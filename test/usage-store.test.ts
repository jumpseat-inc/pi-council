import { test, expect, beforeEach } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import {
	parseSessionEntries,
	type SessionEntry,
} from "@earendil-works/pi-coding-agent";
import { ensureRunDir, pruneRuns, readManifests, writeManifest, type RunManifest, type Usage } from "../extensions/runs.ts";
import { spendRecord } from "../extensions/spend.ts";
import { formatUsageBlock } from "../extensions/usage-block.ts";
import {
	USAGE_RECORD_SCHEMA_VERSION,
	flushPendingInvocations,
	persistInvocationUsage,
	readUsageRecords,
	resolveProvenance,
	usageRecordName,
	type PendingInvocation,
	type StoredUsageRecord,
	type UsageProvenance,
} from "../extensions/usage-store.ts";

// Captured BEFORE any test mutates the env (module top level runs at import):
// T-U16 asserts the real default agent dir was never written.
const REAL_AGENT_DIR = getAgentDirPath();
function getAgentDirPath(): string {
	// Mirrors pi's config.js resolution; avoids importing a second symbol.
	const env = process.env.PI_CODING_AGENT_DIR;
	if (env) return env;
	return path.join(os.homedir(), ".pi", "agent");
}

// getAgentDir() reads PI_CODING_AGENT_DIR at call time, so per-test assignment
// fully isolates the store root (oauth.test.ts precedent). Tests that exercise
// the parameter seam pass an explicit storeRoot; no test may write to the real
// ~/.pi/agent/.
beforeEach(() => {
	process.env.PI_CODING_AGENT_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "ev31-agent-home-"));
});

// ---------------------------------------------------------------------------
// Fixture substrate (spend.test.ts pattern): real session JSONL parsed with
// pi's parseSessionEntries; manifests via writeManifest/readManifests.
// ---------------------------------------------------------------------------

const T0 = 1_700_000_000_000;
const iso = (ms: number) => new Date(ms).toISOString();
const SID = "sess-invoker";

function tmpDir(prefix: string): string {
	return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function base(id: string, parentId: string | null, ts: number) {
	return { id, parentId, timestamp: iso(ts) };
}

function assistantEntry(id: string, parentId: string | null, ts: number, usage: object) {
	return {
		...base(id, parentId, ts),
		type: "message",
		message: {
			role: "assistant",
			provider: "p",
			model: "m",
			api: "openai-completions",
			content: [{ type: "text", text: "hi" }],
			stopReason: "stop",
			timestamp: ts,
			usage,
		},
	};
}

function userEntry(id: string, parentId: string | null, ts: number, text = "/council go") {
	return {
		...base(id, parentId, ts),
		type: "message",
		message: { role: "user", content: [{ type: "text", text }], timestamp: ts },
	};
}

function markerEntry(id: string, parentId: string | null, ts: number, runId = "run-X") {
	return {
		...base(id, parentId, ts),
		type: "custom",
		customType: "council-invocation",
		data: { command: "council", runId, at: ts },
	};
}

/** Write a session JSONL (header + entries) and return its path. */
function writeSessionFile(dir: string, sessionId: string, entries: object[]): string {
	const header = { type: "session", version: 3, id: sessionId, timestamp: iso(T0), cwd: dir };
	const file = path.join(dir, `${sessionId}.jsonl`);
	fs.writeFileSync(file, [header, ...entries].map((e) => JSON.stringify(e)).join("\n") + "\n");
	return file;
}

function parseFixture(file: string): SessionEntry[] {
	return parseSessionEntries(fs.readFileSync(file, "utf-8")).filter((e) => e.type !== "session") as unknown as SessionEntry[];
}

/** The standard invocation chain: a_pre → m1(marker) → u1(boundary) → a1(leaf, final assistant). */
function standardChain(dir: string): { file: string; entries: SessionEntry[]; leafId: string; markerId: string } {
	const file = writeSessionFile(dir, SID, [
		assistantEntry("a_pre", null, T0 - 500, { input: 1, totalTokens: 1, cost: { total: 1 } }),
		markerEntry("m1", "a_pre", T0 - 100),
		userEntry("u1", "m1", T0 + 1000),
		assistantEntry("a1", "u1", T0 + 2000, { input: 7, totalTokens: 7, cost: { total: 7 } }),
	]);
	const entries = parseFixture(file);
	return { file, entries, leafId: "a1", markerId: "m1" };
}

function flatUsage(over: Partial<Usage> = {}): Usage {
	return {
		input: 0, output: 0, cacheRead: 0, cacheWrite: 0, reasoning: 0, totalTokens: 0,
		cost: 0, costInput: 0, costOutput: 0, costCacheRead: 0, costCacheWrite: 0,
		turns: 0, costBasis: "catalogue-estimate", usageSource: "stream-assistant",
		...over,
	};
}

function manifest(id: string, over: Partial<RunManifest> = {}): RunManifest {
	return {
		id,
		seat: "owner",
		model: "m/x",
		parentJobId: null,
		pid: null,
		sessionId: id,
		state: "running",
		startedAt: Date.now(),
		settledAt: null,
		exitCode: null,
		usage: flatUsage(),
		...over,
	};
}

interface Repo {
	root: string;
	runId: string;
}

function repoWithRun(runId: string): Repo {
	const root = tmpDir("ev31-repo-");
	ensureRunDir(root, runId);
	return { root, runId };
}

function spendOf(entries: SessionEntry[], leafId: string, markerId: string, repo: Repo): ReturnType<typeof spendRecord> {
	return spendRecord({
		entries,
		leafId,
		sessionId: SID,
		markerId,
		manifests: readManifests(repo.root, repo.runId),
	});
}

function persistInput(over: Partial<Parameters<typeof persistInvocationUsage>[0]> = {}): Parameters<typeof persistInvocationUsage>[0] {
	return {
		spend: over.spend ?? defaultSpend(),
		sessionId: SID,
		sessionPath: null,
		runId: "run-X",
		command: "council",
		repoRoot: over.repoRoot ?? tmpDir("ev31-repo-key-"),
		markerAt: T0 - 100,
		trigger: "forest-settle",
		manifestsObserved: 0,
		...over,
	} as Parameters<typeof persistInvocationUsage>[0];
}

function thrower(msg: string): never {
	throw new Error(msg);
}

/** Minimal zero-half SpendRecord for tests that only exercise persist
 * mechanics (T-U3/T-U4/T-U6/T-U9) and never read the spend half. */
function defaultSpend(): ReturnType<typeof spendRecord> {
	return spendRecord({ entries: [], leafId: null, sessionId: SID, markerId: null, manifests: [] });
}

// ---------------------------------------------------------------------------
// T-U5 — filename grammar (R-3, byte-exact)
// ---------------------------------------------------------------------------

test("T-U5 filename is byte-exact R-3: ISO-basic rendered from the marker's at, not wall-clock", () => {
	// 1_700_000_000_123 ms === 2023-11-14T22:13:20.123Z
	expect(usageRecordName(1_700_000_000_123, "run-X", "council")).toBe(
		"20231114T221320123_run-X_council.json",
	);
	// grammar shape: 8 digits, T, 9 digits (ms kept — the collision margin), runId, command
	expect(usageRecordName(Date.now(), "2026-09-11T10-14-00-000Z-123-abc", "features-deliver"))
		.toMatch(/^\d{8}T\d{9}_2026-09-11T10-14-00-000Z-123-abc_features-deliver\.json$/);
	// the prefix derives from markerAt even when the clock has moved far past it
	expect(usageRecordName(1_000_000_000_000, "r", "c").startsWith("20010909T014640000")).toBe(true);
});

// ---------------------------------------------------------------------------
// T-U3 / T-U4 — modes and README
// ---------------------------------------------------------------------------

function setupPersistedRecord(): { storeRoot: string; file: string; record: StoredUsageRecord } {
	const storeRoot = tmpDir("ev31-store-");
	const res = persistInvocationUsage(persistInput(), storeRoot);
	return { storeRoot, file: res.file, record: res.record };
}

test("T-U3 modes: dir 0700, record file 0600, README 0600 (R-3, umask-independent)", () => {
	const { storeRoot, file } = setupPersistedRecord();
	expect(fs.statSync(storeRoot).mode & 0o777).toBe(0o700);
	expect(fs.statSync(file).mode & 0o777).toBe(0o600);
	expect(fs.statSync(path.join(storeRoot, "README.md")).mode & 0o777).toBe(0o600);
});

test("T-U4 README: names the format, empty state, asymmetry within the first 20 lines, five outcomes, unwritable path named, unchanged after a second persist", () => {
	const { storeRoot, file } = setupPersistedRecord();
	const readmePath = path.join(storeRoot, "README.md");
	const readme = fs.readFileSync(readmePath, "utf-8");
	const collapsed = readme.replace(/\s+/g, " ");
	const lines = readme.split("\n");

	// product voice + empty state, up front
	expect(lines[0]).toContain("Council usage records");
	expect(collapsed).toContain("first invocation pending");
	expect(collapsed).toContain("completed council invocation");
	expect(collapsed).toContain("Read-back is supported");

	// the R-3 grammar, and invocation-time-not-write-time
	expect(readme).toContain("<ISO-basic>_<runId>_<command>.json");
	expect(collapsed).toContain("not the write time");

	// accounting asymmetry within the first 20 lines (not a tail comment)
	const lowerBoundLine = lines.findIndex((l) => l.includes("lower bound"));
	expect(lowerBoundLine).toBeGreaterThanOrEqual(0);
	expect(lowerBoundLine).toBeLessThan(20);
	expect(collapsed).toContain("usageSource");

	// the five ResolveOutcome values, taught on the record-reading shelf
	for (const outcome of ["resolved", "pruned-expected", "missing-unexpected", "no-session-file", "range-missing"]) {
		expect(readme).toContain(outcome);
	}

	// unwritable behaviour names the absolute target path; "what this is not" closer
	expect(collapsed).toContain("absolute target path");
	expect(collapsed).toContain("What this is not");

	// a second persist must not rewrite the README (non-clobber, write-once)
	const before = fs.readFileSync(readmePath, "utf-8");
	const mtimeBefore = fs.statSync(readmePath).mtimeMs;
	persistInvocationUsage(persistInput({ runId: "run-2" }), storeRoot);
	expect(fs.readFileSync(readmePath, "utf-8")).toBe(before);
	expect(fs.statSync(readmePath).mtimeMs).toBe(mtimeBefore);
	expect(fs.statSync(file).mtimeMs).toBe(fs.statSync(file).mtimeMs); // sanity
});

// ---------------------------------------------------------------------------
// T-U6 / T-U7 / T-U9 / T-U15 — persist semantics
// ---------------------------------------------------------------------------

test("T-U6 no session file: sessionPath null → record written, pointerSurvivable false, outcome no-session-file, no path fabricated", () => {
	const { file, record } = setupPersistedRecord();
	expect(fs.existsSync(file)).toBe(true);
	expect(record.provenance.sessionPath).toBeNull();
	expect(record.provenance.pointerSurvivable).toBe(false);
	expect(resolveProvenance(record.provenance)).toBe("no-session-file");
});

test("T-U7 unresolved boundary: zero both halves mirrored, boundaryResolved false, null ids + file present read as range-missing", () => {
	const sessDir = tmpDir("ev31-sess-");
	const file = writeSessionFile(sessDir, SID, [
		assistantEntry("a_pre", null, T0 - 500, { input: 1, totalTokens: 1, cost: { total: 1 } }),
		userEntry("u1", "a_pre", T0 + 1000), // no marker before it
		assistantEntry("a1", "u1", T0 + 2000, { input: 7, totalTokens: 7, cost: { total: 7 } }),
	]);
	const entries = parseFixture(file);
	const spend = spendRecord({ entries, leafId: "a1", sessionId: SID, markerId: null, manifests: [] });
	const res = persistInvocationUsage(
		persistInput({ spend, sessionPath: file, runId: "run-U7", command: "council", repoRoot: tmpDir("ev31-repo-") }),
		tmpDir("ev31-store-"),
	);
	expect(res.record.provenance.boundaryResolved).toBe(false);
	expect(res.record.provenance.firstEntryId).toBeNull();
	expect(res.record.provenance.lastEntryId).toBeNull();
	expect(res.record.provenance.pointerSurvivable).toBe(true); // file outside any run dir
	expect(res.record.spend).toEqual(spend); // persisted unchanged, never recomputed
	// file present + null ids → range-missing (the ruling's refinement)
	expect(resolveProvenance(res.record.provenance)).toBe("range-missing");
});

test("T-U9 choose-once across a simulated restart: same marker, different now → exactly one file, byte-identical no-op", () => {
	const storeRoot = tmpDir("ev31-store-");
	const first = persistInvocationUsage(persistInput({ now: () => "2030-01-01T00:00:00.000Z" }), storeRoot);
	const bytes = fs.readFileSync(first.file, "utf-8");
	const second = persistInvocationUsage(persistInput({ now: () => "2031-06-06T06:06:06.000Z" }), storeRoot);
	expect(fs.readdirSync(storeRoot).filter((f) => f.endsWith(".json"))).toHaveLength(1);
	expect(second.written).toBe(false);
	expect(second.file).toBe(first.file);
	expect(second.record).toEqual(first.record);
	expect(fs.readFileSync(first.file, "utf-8")).toBe(bytes);
});

test("T-U15 EV-30 record purity: persisted spend toEqual the in-memory SpendRecord; SpendRecord gained no field", () => {
	const repo = repoWithRun("run-U15");
	const sessDir = tmpDir("ev31-sess-");
	const { file, entries, leafId, markerId } = standardChain(sessDir);
	writeManifest(repo.root, repo.runId, manifest("job-1", { startedAt: T0 + 1500, exitCode: 0, settledAt: T0 + 2100, state: "done" }));
	const spend = spendOf(entries, leafId, markerId, repo);
	const res = persistInvocationUsage(
		persistInput({ spend, sessionPath: file, repoRoot: repo.root, runId: repo.runId }),
		tmpDir("ev31-store-"),
	);
	expect(res.record.spend).toEqual(spend);
	expect(Object.keys(res.record.spend).sort()).toEqual(["boundary", "ownSession", "subtree"]);
	expect("provenance" in res.record.spend).toBe(false);
	expect("schemaVersion" in res.record.spend).toBe(false);
	expect(res.record.schemaVersion).toBe(USAGE_RECORD_SCHEMA_VERSION);
});

// ---------------------------------------------------------------------------
// T-U1 / T-U2 / T-U10 / T-U11 / T-U12 — durability + read-back
// ---------------------------------------------------------------------------

test("T-U1 acceptance end to end: record survives the run dir being removed and its provenance pointer resolves to the surviving session file", () => {
	const repo = repoWithRun("run-U1");
	const sessDir = tmpDir("ev31-sess-");
	const { file, entries, leafId, markerId } = standardChain(sessDir);
	writeManifest(repo.root, repo.runId, manifest("job-1", { startedAt: T0 + 1500, exitCode: 0, settledAt: T0 + 2100, state: "done", usage: flatUsage({ input: 30, cost: 30, totalTokens: 30 }) }));
	const spend = spendOf(entries, leafId, markerId, repo);
	const storeRoot = tmpDir("ev31-store-");
	persistInvocationUsage(
		persistInput({ spend, sessionPath: file, repoRoot: repo.root, runId: repo.runId, manifestsObserved: 1 }),
		storeRoot,
	);
	// the run directory is removed entirely
	fs.rmSync(path.join(repo.root, ".pi", "council", "runs"), { recursive: true, force: true });
	const records = readUsageRecords(storeRoot);
	expect(records).toHaveLength(1);
	expect(records[0]!.spend.subtree.input).toBe(30);
	expect(records[0]!.provenance.sessionPath).toBe(file);
	expect(resolveProvenance(records[0]!.provenance)).toBe("resolved");
	// both ids are found in the surviving session file
	const ids = new Set(parseFixture(file).map((e) => e.id));
	expect(ids.has(records[0]!.provenance.firstEntryId!)).toBe(true);
	expect(ids.has(records[0]!.provenance.lastEntryId!)).toBe(true);
});

test("T-U2 pruneRuns(repoRoot, 0) leaves the record byte-identical", () => {
	const repo = repoWithRun("run-U2");
	const sessDir = tmpDir("ev31-sess-");
	const { file, entries, leafId, markerId } = standardChain(sessDir);
	writeManifest(repo.root, repo.runId, manifest("job-1", { startedAt: T0 + 1500, exitCode: 0, state: "done" }));
	const storeRoot = tmpDir("ev31-store-");
	persistInvocationUsage(
		persistInput({ spend: spendOf(entries, leafId, markerId, repo), sessionPath: file, repoRoot: repo.root, runId: repo.runId }),
		storeRoot,
	);
	const before = fs.readdirSync(storeRoot).filter((f) => f.endsWith(".json")).map((f) => fs.readFileSync(path.join(storeRoot, f), "utf-8"));
	expect(pruneRuns(repo.root, 0)).toBe(1); // the run dir is gone
	expect(fs.existsSync(path.join(repo.root, ".pi", "council", "runs", repo.runId))).toBe(false);
	const after = fs.readdirSync(storeRoot).filter((f) => f.endsWith(".json")).map((f) => fs.readFileSync(path.join(storeRoot, f), "utf-8"));
	expect(after).toEqual(before);
	expect(readUsageRecords(storeRoot)).toHaveLength(1);
});

test("T-U10 runner-shaped dangle: session file inside the run dir → record survives pruneRuns, outcome pruned-expected, never throws", () => {
	const repo = repoWithRun("run-U10");
	const sessionFile = path.join(path.join(repo.root, ".pi", "council", "runs", repo.runId), "s.jsonl");
	const header = { type: "session", version: 3, id: "sess-runner", timestamp: iso(T0), cwd: repo.root };
	fs.writeFileSync(sessionFile, [header, ...[
		markerEntry("m1", null, T0 - 100, repo.runId),
		userEntry("u1", "m1", T0 + 1000),
		assistantEntry("a1", "u1", T0 + 2000, { input: 5, totalTokens: 5, cost: { total: 5 } }),
	]].map((e) => JSON.stringify(e)).join("\n") + "\n");
	const entries = parseFixture(sessionFile);
	const spend = spendRecord({ entries, leafId: "a1", sessionId: "sess-runner", markerId: "m1", manifests: readManifests(repo.root, repo.runId) });
	const storeRoot = tmpDir("ev31-store-");
	persistInvocationUsage(
		persistInput({ spend, sessionId: "sess-runner", sessionPath: sessionFile, repoRoot: repo.root, runId: repo.runId }),
		storeRoot,
	);
	const [record] = readUsageRecords(storeRoot);
	expect(record!.provenance.pointerSurvivable).toBe(false); // under the run dir at write time
	expect(pruneRuns(repo.root, 0)).toBe(1);
	expect(fs.existsSync(sessionFile)).toBe(false);
	const [survivor] = readUsageRecords(storeRoot);
	expect(survivor).toEqual(record);
	let outcome: ReturnType<typeof resolveProvenance> | "threw" = "threw";
	try {
		outcome = resolveProvenance(survivor!.provenance);
	} catch {
		outcome = "threw";
	}
	expect(outcome).toBe("pruned-expected");
});

test("T-U11 missing-unexpected + derived-vs-stored: delete the session file (not the run dir) → outcome flips on read; stored bytes never change", () => {
	const sessDir = tmpDir("ev31-sess-");
	const { file, entries, leafId, markerId } = standardChain(sessDir);
	const storeRoot = tmpDir("ev31-store-");
	persistInvocationUsage(persistInput({ spend: spendRecord({ entries, leafId, sessionId: SID, markerId, manifests: [] }), sessionPath: file }), storeRoot);
	const [record] = readUsageRecords(storeRoot);
	expect(resolveProvenance(record!.provenance)).toBe("resolved");
	const recordFile = path.join(storeRoot, usageRecordName(T0 - 100, "run-X", "council"));
	const snapshot = fs.readFileSync(recordFile, "utf-8");
	expect(snapshot.length).toBeGreaterThan(0);
	fs.rmSync(file);
	expect(fs.existsSync(file)).toBe(false);
	// outcome is derived on read, never stored — and never throws
	expect(resolveProvenance(record!.provenance)).toBe("missing-unexpected");
	expect(fs.readFileSync(recordFile, "utf-8")).toBe(snapshot);
});

test("T-U12 range-missing: file present, one or both ids absent → range-missing, no throw; unreadable file → absent classes; reader throw never propagates", () => {
	const sessDir = tmpDir("ev31-sess-");
	const file = writeSessionFile(sessDir, "sess-other", [
		userEntry("x1", null, T0 + 1000),
		assistantEntry("x2", "x1", T0 + 2000, { input: 1, totalTokens: 1, cost: { total: 1 } }),
	]);
	const pointer = (over: Partial<UsageProvenance>): UsageProvenance => ({
		sessionId: SID,
		sessionPath: file,
		firstEntryId: "u1",
		lastEntryId: "a1",
		boundaryResolved: true,
		pointerSurvivable: true,
		...over,
	});
	// both ids absent from a present file
	expect(resolveProvenance(pointer({}))).toBe("range-missing");
	// one id present, the other absent
	expect(resolveProvenance(pointer({ firstEntryId: "x1" }), () => ["x1", "x2"])).toBe("range-missing");
	// injected reader returning null → absent classes by survivability
	expect(resolveProvenance(pointer({}), () => null)).toBe("missing-unexpected");
	expect(resolveProvenance(pointer({ pointerSurvivable: false }), () => null)).toBe("pruned-expected");
	// a throwing injected reader must never propagate
	expect(resolveProvenance(pointer({}), () => {
		throw new Error("boom");
	})).toBe("missing-unexpected");
	// empty ids → both absent → range-missing
	expect(resolveProvenance(pointer({}), () => [])).toBe("range-missing");
});

// ---------------------------------------------------------------------------
// T-U8 / T-U13 / T-U14 — the gated write path (flushPendingInvocations)
// ---------------------------------------------------------------------------

function flushSetup(): {
	repo: Repo;
	pending: PendingInvocation[];
	flush: (trigger: "forest-settle" | "agent-settled" | "session-shutdown", pending: PendingInvocation[], opts?: { storeRoot?: string; notify?: (m: string, k: "info" | "warning") => void }) => ReturnType<typeof flushPendingInvocations>;
} {
	const repo = repoWithRun("run-F");
	const sessDir = tmpDir("ev31-sess-");
	const { file, entries, leafId } = standardChain(sessDir);
	const pending: PendingInvocation[] = [
		{ command: "council", markerId: "m1", runId: repo.runId, markerAt: T0 - 100, sessionFile: file },
	];
	const flush = (
		trigger: "forest-settle" | "agent-settled" | "session-shutdown",
		pend: PendingInvocation[],
		opts?: { storeRoot?: string; notify?: (m: string, k: "info" | "warning") => void },
	) =>
		flushPendingInvocations({
			repoRoot: repo.root,
			entries,
			leafId,
			sessionId: SID,
			pending: pend,
			trigger,
			...opts,
		});
	return { repo, pending, flush };
}

test("T-U8 run dir removed before the write: exit-time (zero) subtree, manifestsObserved 0, pointer class stated", () => {
	const { repo, pending, flush } = flushSetup();
	writeManifest(repo.root, repo.runId, manifest("job-1", { startedAt: T0 + 1500, exitCode: 0, state: "done" }));
	fs.rmSync(path.join(repo.root, ".pi", "council", "runs", repo.runId), { recursive: true, force: true });
	const storeRoot = tmpDir("ev31-store-");
	const { outcomes } = flush("session-shutdown", pending, { storeRoot });
	expect(outcomes).toHaveLength(1);
	expect(outcomes[0]!.status).toBe("written");
	const [record] = readUsageRecords(storeRoot);
	expect(record!.spend.boundary.resolved).toBe(true);
	expect(record!.spend.subtree.input).toBe(0);
	expect(record!.spend.subtree.cost).toBe(0);
	expect(record!.basis.manifestsObserved).toBe(0);
	expect(record!.basis.trigger).toBe("session-shutdown");
	expect(record!.provenance.pointerSurvivable).toBe(true); // session file was outside the run dir
	expect(resolveProvenance(record!.provenance)).toBe("resolved");
});

test("T-U13 seam order (O1c): unsettled forest → no record at settle; manifest completes → exactly one record whose lastEntryId is the leaf; second settle → byte-identical no-op", () => {
	const { repo, pending, flush } = flushSetup();
	const storeRoot = tmpDir("ev31-store-");
	writeManifest(repo.root, repo.runId, manifest("job-1", { startedAt: T0 + 1500, exitCode: null })); // still running

	// first settle trigger while the child is still running: the gate decides — no write
	const r1 = flush("agent-settled", pending, { storeRoot });
	expect(r1.outcomes[0]!.status).toBe("gate-closed");
	expect(r1.remaining).toHaveLength(1);
	expect(readUsageRecords(storeRoot)).toHaveLength(0);

	// the child's manifest completes (exitCode lands)
	writeManifest(repo.root, repo.runId, manifest("job-1", { startedAt: T0 + 1500, exitCode: 0, state: "done", settledAt: T0 + 2500 }));

	// next trigger: exactly one record, written once, stamped with the trigger that fired
	const r2 = flush("agent-settled", pending, { storeRoot });
	expect(r2.outcomes[0]!.status).toBe("written");
	expect(r2.remaining).toHaveLength(0);
	const records = readUsageRecords(storeRoot);
	expect(records).toHaveLength(1);
	expect(records[0]!.provenance.lastEntryId).toBe("a1"); // the leaf at invocation end
	expect(records[0]!.provenance.firstEntryId).toBe("u1");
	expect(records[0]!.basis.trigger).toBe("agent-settled");
	expect(records[0]!.basis.manifestsObserved).toBe(1);
	const bytes = fs.readFileSync(path.join(storeRoot, usageRecordName(T0 - 100, repo.runId, "council")), "utf-8");

	// a second settle (session shutdown) observing the same still-on-chain marker: no-op
	const r3 = flush("session-shutdown", pending, { storeRoot });
	expect(r3.outcomes[0]!.status).toBe("existing");
	expect(readUsageRecords(storeRoot)).toHaveLength(1);
	expect(fs.readFileSync(path.join(storeRoot, usageRecordName(T0 - 100, repo.runId, "council")), "utf-8")).toBe(bytes);
});

test("T-U13b unkeyable: a pending invocation with no marker time is never written (never fabricate) and surfaces a warning", () => {
	const { pending, flush } = flushSetup();
	const storeRoot = tmpDir("ev31-store-");
	const notes: string[] = [];
	const unkeyable: PendingInvocation[] = [{ ...pending[0]!, markerAt: null }];
	const { outcomes } = flush("session-shutdown", unkeyable, { storeRoot, notify: (m) => notes.push(m) });
	expect(outcomes[0]!.status).toBe("unkeyable");
	expect(readUsageRecords(storeRoot)).toHaveLength(0);
	expect(notes.length).toBeGreaterThanOrEqual(1);
});

test("T-U14 (EV-32-amended) notify: the written block replaces the success notify (one notify = the block); EACCES → ≥1 notify with the absolute target path inside the R-5 literal; never throws", () => {
	// success
	const { repo, pending, flush } = flushSetup();
	writeManifest(repo.root, repo.runId, manifest("job-1", { startedAt: T0 + 1500, exitCode: 0, state: "done" }));
	const storeRoot = tmpDir("ev31-store-");
	const successNotes: Array<{ m: string; k: string }> = [];
	const r = flush("forest-settle", pending, { storeRoot, notify: (m, k) => successNotes.push({ m, k }) });
	expect(r.outcomes[0]!.status).toBe("written");
	expect(successNotes).toHaveLength(1);
	// PO J: the block replaces the flush success notify — one emission, the block
	const [written] = readUsageRecords(storeRoot);
	expect(successNotes[0]!.m).toBe(formatUsageBlock({ record: written!.spend }));
	expect(successNotes[0]!.k).toBe("info");

	// failure: a read-only PARENT dir makes the store mkdir fail with EACCES.
	// (chmod 0500 on the store root itself would not: ensureUsageDir re-asserts
	// 0700 as owner, silently undoing it — the parent-dir construction is the
	// honest way to make the write fail.)
	const parent = tmpDir("ev31-ro-parent-");
	const roStore = path.join(parent, "usage");
	fs.chmodSync(parent, 0o500);
	try {
		const failNotes: string[] = [];
		let threw = false;
		try {
			const rf = flush("session-shutdown", pending, { storeRoot: roStore, notify: (m) => failNotes.push(m) });
			expect(rf.outcomes[0]!.status).toBe("failed");
		} catch {
			threw = true;
		}
		expect(threw).toBe(false); // caught per record, never crashes the caller
		expect(failNotes.length).toBeGreaterThanOrEqual(1);
		expect(failNotes.some((m) => m.includes(roStore))).toBe(true);
		// R-5 failure literal + EV-31's T-U14 absolute-path property, composed
		const failedNote = failNotes.find((m) => m.includes(roStore))!;
		expect(failedNote.startsWith("usage  accounting failed \u2014 write failed for ")).toBe(true);
		expect(failedNote).toContain(": ");
	} finally {
		fs.chmodSync(parent, 0o700);
	}
});

// ---------------------------------------------------------------------------
// T-U16 — env seam: the real default path is never written
// ---------------------------------------------------------------------------

test("T-U16 env seam: no explicit root → the record lands under PI_CODING_AGENT_DIR/council/usage, never at the real agent dir", () => {
	const repo = repoWithRun("run-U16");
	const sessDir = tmpDir("ev31-sess-");
	const { file, entries, leafId, markerId } = standardChain(sessDir);
	const res = persistInvocationUsage(
		persistInput({ spend: spendOf(entries, leafId, markerId, repo), sessionPath: file, repoRoot: repo.root, runId: repo.runId }),
		// no storeRoot — the default (usageStoreDir()) must resolve through the env var
	);
	const envHome = process.env.PI_CODING_AGENT_DIR!;
	expect(envHome).not.toBe(REAL_AGENT_DIR);
	expect(res.file.startsWith(path.join(envHome, "council", "usage"))).toBe(true);
	// nothing landed at the real default path
	expect(fs.existsSync(path.join(REAL_AGENT_DIR, "council", "usage", path.basename(res.file)))).toBe(false);
	expect(fs.existsSync(path.join(envHome, "council", "usage", "README.md"))).toBe(true);
});

// ---------------------------------------------------------------------------
// T12 (EV-32) — one emission per invocation: written → the block; existing →
// silent; a second settle after written → silent.
// ---------------------------------------------------------------------------

test("T12: written emits exactly one notify equal to formatUsageBlock(record); existing emits zero; second agent_settled after written emits zero", () => {
	const { repo, pending, flush } = flushSetup();
	writeManifest(repo.root, repo.runId, manifest("job-1", { startedAt: T0 + 1500, exitCode: 0, state: "done" }));
	const storeRoot = tmpDir("ev31-store-");
	const notes: string[] = [];
	// written
	const r1 = flush("agent-settled", pending, { storeRoot, notify: (m) => notes.push(m) });
	expect(r1.outcomes[0]!.status).toBe("written");
	const [written] = readUsageRecords(storeRoot);
	expect(notes).toHaveLength(1);
	expect(notes[0]).toBe(formatUsageBlock({ record: written!.spend }));
	// a second flush observing the same marker: existing → zero notifications
	const r2 = flush("session-shutdown", pending, { storeRoot, notify: (m) => notes.push(m) });
	expect(r2.outcomes[0]!.status).toBe("existing");
	expect(notes).toHaveLength(1); // unchanged
});

test("T12b (EV-32): flushPendingInvocations forwards PendingInvocation.boundaryMode to spendRecord — marker mode resolves the eval invocation", () => {
	const repo = repoWithRun("run-M");
	const sessDir = tmpDir("ev31-sess-");
	// marker-only chain: NO user message after the marker (the /council-eval shape)
	const file = writeSessionFile(sessDir, SID, [
		assistantEntry("ev_pre", null, T0 - 500, { input: 100, totalTokens: 100, cost: { total: 100 } }),
		markerEntry("ev_m1", "ev_pre", T0 - 100, repo.runId),
		assistantEntry("ev_a1", "ev_m1", T0 + 2000, { input: 6, totalTokens: 6, cost: { total: 6 } }),
	]);
	const entries = parseFixture(file);
	const marker = entries.find((e) => e.id === "ev_m1") as unknown as { data: { at: number } };
	writeManifest(repo.root, repo.runId, manifest("job-m1", { startedAt: T0 + 2000, exitCode: 0, state: "done", usage: flatUsage({ input: 30, totalTokens: 30, cost: 3, turns: 1 }) }));
	const storeRoot = tmpDir("ev31-store-");
	const pending: PendingInvocation[] = [
		{ command: "council-eval", markerId: "ev_m1", runId: repo.runId, markerAt: marker.data.at, sessionFile: file, boundaryMode: "marker" },
	];
	const notes: string[] = [];
	const r = flushPendingInvocations({
		repoRoot: repo.root, entries, leafId: "ev_a1", sessionId: SID, pending,
		trigger: "agent-settled", storeRoot, notify: (m) => notes.push(m),
	});
	expect(r.outcomes[0]!.status).toBe("written");
	const [record] = readUsageRecords(storeRoot);
	// marker mode resolved despite never injecting a user message
	expect(record!.spend.boundary.resolved).toBe(true);
	expect(record!.spend.boundary.firstEntryId).toBe("ev_m1");
	expect(record!.spend.boundary.lastEntryId).toBe("ev_a1");
	expect(record!.spend.boundary.jobCount).toBe(1);
	expect(record!.spend.subtree.totalTokens).toBe(30);
	expect(notes).toHaveLength(1);
	expect(notes[0]).toBe(formatUsageBlock({ record: record!.spend }));
});
