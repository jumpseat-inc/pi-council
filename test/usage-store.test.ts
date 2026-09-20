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
	type FlushProviderDeps,
	type PendingInvocation,
	type StoredUsageRecord,
	type UsageProvenance,
} from "../extensions/usage-store.ts";
import { PROVIDER_COMPONENTS, providerComponentFigure, type GenerationResponse } from "../extensions/provider-cost.ts";

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
	entries: SessionEntry[];
	leafId: string;
	flush: (trigger: "forest-settle" | "agent-settled" | "session-shutdown", pending: PendingInvocation[], opts?: { storeRoot?: string; notify?: (m: string, k: "info" | "warning") => void; providerDeps?: FlushProviderDeps }) => ReturnType<typeof flushPendingInvocations>;
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
		opts?: { storeRoot?: string; notify?: (m: string, k: "info" | "warning") => void; providerDeps?: FlushProviderDeps },
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
	return { repo, pending, entries, leafId, flush };
}

test("T-U8 run dir removed before the write: exit-time (zero) subtree, manifestsObserved 0, pointer class stated", async () => {
	const { repo, pending, flush } = flushSetup();
	writeManifest(repo.root, repo.runId, manifest("job-1", { startedAt: T0 + 1500, exitCode: 0, state: "done" }));
	fs.rmSync(path.join(repo.root, ".pi", "council", "runs", repo.runId), { recursive: true, force: true });
	const storeRoot = tmpDir("ev31-store-");
	const { outcomes } = await flush("session-shutdown", pending, { storeRoot });
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

test("T-U13 seam order (O1c): unsettled forest → no record at settle; manifest completes → exactly one record whose lastEntryId is the leaf; second settle → byte-identical no-op", async () => {
	const { repo, pending, flush } = flushSetup();
	const storeRoot = tmpDir("ev31-store-");
	writeManifest(repo.root, repo.runId, manifest("job-1", { startedAt: T0 + 1500, exitCode: null })); // still running

	// first settle trigger while the child is still running: the gate decides — no write
	const r1 = await flush("agent-settled", pending, { storeRoot });
	expect(r1.outcomes[0]!.status).toBe("gate-closed");
	expect(r1.remaining).toHaveLength(1);
	expect(readUsageRecords(storeRoot)).toHaveLength(0);

	// the child's manifest completes (exitCode lands)
	writeManifest(repo.root, repo.runId, manifest("job-1", { startedAt: T0 + 1500, exitCode: 0, state: "done", settledAt: T0 + 2500 }));

	// next trigger: exactly one record, written once, stamped with the trigger that fired
	const r2 = await flush("agent-settled", pending, { storeRoot });
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
	const r3 = await flush("session-shutdown", pending, { storeRoot });
	expect(r3.outcomes[0]!.status).toBe("existing");
	expect(readUsageRecords(storeRoot)).toHaveLength(1);
	expect(fs.readFileSync(path.join(storeRoot, usageRecordName(T0 - 100, repo.runId, "council")), "utf-8")).toBe(bytes);
});

test("T-U13b unkeyable: a pending invocation with no marker time is never written (never fabricate) and surfaces a warning", async () => {
	const { pending, flush } = flushSetup();
	const storeRoot = tmpDir("ev31-store-");
	const notes: string[] = [];
	const unkeyable: PendingInvocation[] = [{ ...pending[0]!, markerAt: null }];
	const { outcomes } = await flush("session-shutdown", unkeyable, { storeRoot, notify: (m) => notes.push(m) });
	expect(outcomes[0]!.status).toBe("unkeyable");
	expect(readUsageRecords(storeRoot)).toHaveLength(0);
	expect(notes.length).toBeGreaterThanOrEqual(1);
});

test("T-U14 (EV-32-amended) notify: the written block replaces the success notify (one notify = the block); EACCES → ≥1 notify with the absolute target path inside the R-5 literal; never throws", async () => {
	// success
	const { repo, pending, flush } = flushSetup();
	writeManifest(repo.root, repo.runId, manifest("job-1", { startedAt: T0 + 1500, exitCode: 0, state: "done" }));
	const storeRoot = tmpDir("ev31-store-");
	const successNotes: Array<{ m: string; k: string }> = [];
	const r = await flush("forest-settle", pending, { storeRoot, notify: (m, k) => successNotes.push({ m, k }) });
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
			const rf = await flush("session-shutdown", pending, { storeRoot: roStore, notify: (m) => failNotes.push(m) });
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

test("T12: written emits exactly one notify equal to formatUsageBlock(record); existing emits zero; second agent_settled after written emits zero", async () => {
	const { repo, pending, flush } = flushSetup();
	writeManifest(repo.root, repo.runId, manifest("job-1", { startedAt: T0 + 1500, exitCode: 0, state: "done" }));
	const storeRoot = tmpDir("ev31-store-");
	const notes: string[] = [];
	// written
	const r1 = await flush("agent-settled", pending, { storeRoot, notify: (m) => notes.push(m) });
	expect(r1.outcomes[0]!.status).toBe("written");
	const [written] = readUsageRecords(storeRoot);
	expect(notes).toHaveLength(1);
	expect(notes[0]).toBe(formatUsageBlock({ record: written!.spend }));
	// a second flush observing the same marker: existing → zero notifications
	const r2 = await flush("session-shutdown", pending, { storeRoot, notify: (m) => notes.push(m) });
	expect(r2.outcomes[0]!.status).toBe("existing");
	expect(notes).toHaveLength(1); // unchanged
});

test("T12b (EV-32): flushPendingInvocations forwards PendingInvocation.boundaryMode to spendRecord — marker mode resolves the eval invocation", async () => {
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
	const r = await flushPendingInvocations({
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

// ---------------------------------------------------------------------------
// EV-29 — schema v2 provider sibling + async fetch-before-persist flush
// (spec §2.2–§2.3; acceptance bullets 1–2; O-2 identity binding; O-7 ordering;
// choose-once × provider).
// ---------------------------------------------------------------------------

/** An assistant entry carrying an OpenRouter generation id (responseId). */
function assistantWithRid(id: string, parentId: string | null, ts: number, rid: string) {
	const entry = assistantEntry(id, parentId, ts, { input: 1, totalTokens: 1, cost: { total: 1 } }) as {
		message: Record<string, unknown>;
	};
	entry.message.responseId = rid;
	return entry;
}

/** The EV-29 fixture: the standard chain in a session dir, plus an
 * OpenRouter-modelled job whose session file lives INSIDE the run dir (the
 * production path `findSessionFile` reads). */
function openRouterFlushSetup(): ReturnType<typeof flushSetup> & { jobSessionPath: string } {
	const s = flushSetup();
	const jobSessionPath = path.join(s.repo.root, ".pi", "council", "runs", s.repo.runId, "job-1.jsonl");
	fs.writeFileSync(
		jobSessionPath,
		[
			{ type: "session", version: 3, id: "job-1", timestamp: iso(T0), cwd: s.repo.root },
			assistantWithRid("ja1", null, T0 + 100, "gen-f1"),
		].map((e) => JSON.stringify(e)).join("\n") + "\n",
	);
	writeManifest(
		s.repo.root,
		s.repo.runId,
		manifest("job-1", { model: "openrouter/anthropic/claude-x", startedAt: T0 + 1500, exitCode: 0, settledAt: T0 + 2100, state: "done" }),
	);
	return { ...s, jobSessionPath };
}

const FIXTURE_RESPONSE = {
	id: "gen-f1",
	total_cost: 0.0042,
	provider_name: "Infermatic",
	native_tokens_prompt: 12,
	native_tokens_cached: 880,
	is_byok: true,
};

/** An injected transport that records every generation id it saw. */
function recordingTransport(): { calls: string[]; fetchGeneration: (id: string) => Promise<GenerationResponse> } {
	const calls: string[] = [];
	return {
		calls,
		fetchGeneration: async (id: string) => {
			calls.push(id);
			return FIXTURE_RESPONSE;
		},
	};
}

/** EV-42 — a transport keyed by generation id, reporting a per-id cost. */
function keyedTransport(costs: Record<string, number>): { calls: string[]; fetchGeneration: (id: string) => Promise<GenerationResponse> } {
	const calls: string[] = [];
	return {
		calls,
		fetchGeneration: async (id: string) => {
			calls.push(id);
			return { ...FIXTURE_RESPONSE, id, total_cost: costs[id] };
		},
	};
}

test("T-S1 (acceptance 1 end to end): the flush persists the fixture response's values with schemaVersion 2; the transport saw exactly the session-harvested ids (O-2)", async () => {
	const s = openRouterFlushSetup();
	const storeRoot = tmpDir("ev31-store-");
	const t = recordingTransport();
	const notes: string[] = [];
	const r = await flushPendingInvocations({
		repoRoot: s.repo.root,
		entries: s.entries,
		leafId: s.leafId,
		sessionId: SID,
		pending: s.pending,
		trigger: "agent-settled",
		storeRoot,
		notify: (m) => notes.push(m),
		providerDeps: { fetchGeneration: t.fetchGeneration, apiKey: "k" },
	});
	expect(r.outcomes[0]!.status).toBe("written");
	const [record] = readUsageRecords(storeRoot);
	expect(record!.schemaVersion).toBe(2);
	expect(record!.provider!.status).toBe("reported");
	expect(record!.provider!.generations[0]!.totalCost).toBe(0.0042);
	expect(record!.provider!.generations[0]!.providerName).toBe("Infermatic");
	expect(record!.provider!.generations[0]!.nativeTokens!.cached).toBe(880);
	expect(record!.provider!.generations[0]!.isByok).toBe(true);
	expect(record!.provider!.generations[0]!.jobId).toBe("job-1");
	// O-2 identity binding: the ids the transport saw are exactly those harvested
	// from the invocation's own session file via findSessionFile — never a
	// caller-supplied list.
	expect(t.calls).toEqual(["gen-f1"]);
	// spend byte-verbatim; the sibling lives on the wrapper, never inside spend
	expect(Object.keys(record!.spend).sort()).toEqual(["boundary", "ownSession", "subtree"]);
	expect("provider" in record!.spend).toBe(false);
	// the written-transition emission is the block composed from the PERSISTED record
	expect(notes[0]).toBe(formatUsageBlock({ record: record!.spend, provider: record!.provider }));
	expect(notes[0]).toContain("usage  reported  cost=$0.0042 (reported) routed=Infermaticx1");
});

test("T-S2 (acceptance 2 end to end): a rejecting transport persists the unavailable report; providerComponentFigure returns the identical marker for every component, read back from disk", async () => {
	const s = openRouterFlushSetup();
	const storeRoot = tmpDir("ev31-store-");
	const r = await flushPendingInvocations({
		repoRoot: s.repo.root,
		entries: s.entries,
		leafId: s.leafId,
		sessionId: SID,
		pending: s.pending,
		trigger: "agent-settled",
		storeRoot,
		providerDeps: {
			fetchGeneration: async () => {
				throw new Error("ECONNREFUSED");
			},
			apiKey: "k",
		},
	});
	// a fetch failure NEVER takes the { failed } path — the record is written
	expect(r.outcomes[0]!.status).toBe("written");
	const [record] = readUsageRecords(storeRoot);
	expect(record!.provider!.status).toBe("unavailable");
	expect(record!.provider!.reason).toBe("fetch-failed:ECONNREFUSED");
	expect((record!.provider!.reason ?? "").length).toBeGreaterThan(0);
	for (const c of PROVIDER_COMPONENTS) {
		expect(providerComponentFigure(record!.provider, c)).toBe("n/a");
	}
});

test("T-S3 (ordering, O-1/O-7): a next-tick transport still lands — the awaited flush's record carries the fetched values; an early persist genuinely has no provider field", async () => {
	const s = openRouterFlushSetup();
	const storeRoot = tmpDir("ev31-store-");
	await flushPendingInvocations({
		repoRoot: s.repo.root,
		entries: s.entries,
		leafId: s.leafId,
		sessionId: SID,
		pending: s.pending,
		trigger: "agent-settled",
		storeRoot,
		providerDeps: {
			fetchGeneration: async (id: string) => {
				await new Promise((r) => setTimeout(r, 0)); // resolves on a later tick
				return { ...FIXTURE_RESPONSE, id };
			},
			apiKey: "k",
		},
	});
	const [record] = readUsageRecords(storeRoot);
	expect(record!.provider!.status).toBe("reported");
	expect(record!.provider!.generations[0]!.totalCost).toBe(0.0042);
	// contrast fixture: an early-persisting variant (no provider) yields a record
	// with NO provider field — late-fetch, fetch-failure, and no-report records
	// are three distinct shapes (O-7).
	const early = persistInvocationUsage(persistInput(), tmpDir("ev31-store-early-"));
	expect("provider" in early.record).toBe(false);
});

test("T-S4 (choose-once × provider): a second flush observes existing — byte-identical file, transport call count unchanged", async () => {
	const s = openRouterFlushSetup();
	const storeRoot = tmpDir("ev31-store-");
	const t = recordingTransport();
	const input = {
		repoRoot: s.repo.root,
		entries: s.entries,
		leafId: s.leafId,
		sessionId: SID,
		pending: s.pending,
		trigger: "agent-settled" as const,
		storeRoot,
		providerDeps: { fetchGeneration: t.fetchGeneration, apiKey: "k" },
	};
	const r1 = await flushPendingInvocations(input);
	expect(r1.outcomes[0]!.status).toBe("written");
	expect(t.calls).toEqual(["gen-f1"]);
	const file = r1.outcomes[0]!.file!;
	const bytes = fs.readFileSync(file, "utf-8");
	const r2 = await flushPendingInvocations(input);
	expect(r2.outcomes[0]!.status).toBe("existing");
	expect(t.calls).toEqual(["gen-f1"]); // the choose-once file check precedes the fetch — never re-fetch
	expect(fs.readFileSync(file, "utf-8")).toBe(bytes);
});


// ---- EV-39 G4/Q4: the durable machine-readable partial disclosure ----

test("EV-39 G4: a retried openrouter/ manifest persists provider.partial='final-attempt-only' (present, true, durable on disk); a non-retried one does not", async () => {
	const s = openRouterFlushSetup();
	// the eligible manifest is on attempt 2 — the EV-39 chain's final figure is
	// the last attempt's alone and MUST be disclosed on the persisted sibling
	writeManifest(
		s.repo.root,
		s.repo.runId,
		manifest("job-1", {
			model: "openrouter/anthropic/claude-x",
			startedAt: T0 + 1500,
			exitCode: 0,
			settledAt: T0 + 2100,
			state: "done",
			attempt: 2,
		}),
	);
	const storeRoot = tmpDir("ev31-store-partial-");
	const t = recordingTransport();
	const r = await flushPendingInvocations({
		repoRoot: s.repo.root,
		entries: s.entries,
		leafId: s.leafId,
		sessionId: SID,
		pending: s.pending,
		trigger: "agent-settled",
		storeRoot,
		notify: () => {},
		providerDeps: { fetchGeneration: t.fetchGeneration, apiKey: "k" },
	});
	expect(r.outcomes[0]!.status).toBe("written");
	const [record] = readUsageRecords(storeRoot);
	expect(record!.provider!.status).toBe("reported");
	expect(record!.provider!.partial).toBe("final-attempt-only");
	// durable: the record file on disk carries the literal (pretty-printed JSON)
	const file = r.outcomes[0]!.file!;
	expect(fs.readFileSync(file, "utf-8")).toContain('"partial": "final-attempt-only"');
	// the render of the PERSISTED record carries the qualifying legend — the
	// figure can never read as the dispatch's whole figure unqualified
	expect(formatUsageBlock({ record: record!.spend, provider: record!.provider })).toContain(
		"usage  partial = reported figure is final-attempt-only",
	);

	// the contrast: the same fixture WITHOUT attempt stays disclosure-free
	const s2 = openRouterFlushSetup();
	const storeRoot2 = tmpDir("ev31-store-plain-");
	await flushPendingInvocations({
		repoRoot: s2.repo.root,
		entries: s2.entries,
		leafId: s2.leafId,
		sessionId: SID,
		pending: s2.pending,
		trigger: "agent-settled",
		storeRoot: storeRoot2,
		notify: () => {},
		providerDeps: { fetchGeneration: t.fetchGeneration, apiKey: "k" },
	});
	const [plain] = readUsageRecords(storeRoot2);
	expect("partial" in plain!.provider!).toBe(false);
});

// ---------------------------------------------------------------------------
// EV-42 — the per-attempt harvest walk (spec §2.4) + the J1 figure-scoped
// disclosure. The flush resolves one session path per ATTEMPT (the manifest's
// `attempts` list); the legacy window shape keeps today's stamp byte-identical.
// ---------------------------------------------------------------------------

/** A retried dispatch fixture: one manifest with the attempts list, two
 * attempt JSONLs in the same run dir (attempt 1's id `job-1`, attempt 2's
 * `job-1-attempt2`), each carrying a distinct generation id. */
function retriedFlushSetup(): ReturnType<typeof flushSetup> & { attempt1Path: string; attempt2Path: string } {
	const s = flushSetup();
	const dir = path.join(s.repo.root, ".pi", "council", "runs", s.repo.runId);
	const attempt1Path = path.join(dir, "job-1.jsonl");
	fs.writeFileSync(
		attempt1Path,
		[
			{ type: "session", version: 3, id: "job-1", timestamp: iso(T0), cwd: s.repo.root },
			assistantWithRid("ja1", null, T0 + 100, "gen-a1"),
		].map((e) => JSON.stringify(e)).join("\n") + "\n",
	);
	const attempt2Path = path.join(dir, "job-1-attempt2.jsonl");
	fs.writeFileSync(
		attempt2Path,
		[
			{ type: "session", version: 3, id: "job-1-attempt2", timestamp: iso(T0 + 3000), cwd: s.repo.root },
			assistantWithRid("ja2", null, T0 + 3100, "gen-a2"),
		].map((e) => JSON.stringify(e)).join("\n") + "\n",
	);
	writeManifest(
		s.repo.root,
		s.repo.runId,
		manifest("job-1", {
			model: "openrouter/anthropic/claude-x",
			startedAt: T0 + 1500,
			exitCode: 0,
			settledAt: T0 + 4200,
			state: "done",
			attempt: 2,
			attempts: [{ attempt: 1, sessionId: "job-1" }, { attempt: 2, sessionId: "job-1-attempt2" }],
		}),
	);
	return { ...s, attempt1Path, attempt2Path };
}

function flushedProvider(storeRoot: string): StoredUsageRecord["provider"] {
	const [record] = readUsageRecords(storeRoot);
	return record!.provider;
}

function ev42Flush(
	s: ReturnType<typeof flushSetup>,
	storeRoot: string,
	fetchGeneration: (id: string) => Promise<GenerationResponse>,
) {
	return flushPendingInvocations({
		repoRoot: s.repo.root,
		entries: s.entries,
		leafId: s.leafId,
		sessionId: SID,
		pending: s.pending,
		trigger: "agent-settled",
		storeRoot,
		notify: () => {},
		providerDeps: { fetchGeneration, apiKey: "k" },
	});
}

// Contract 1 (spec §3): a whole retried dispatch sums every attempt.
test("EV-42 contract 1: a whole retried dispatch sums every attempt — no partial", async () => {
	const s = retriedFlushSetup();
	const storeRoot = tmpDir("ev42-store-");
	const t = keyedTransport({ "gen-a1": 0.0011, "gen-a2": 0.0031 });
	const r = await ev42Flush(s, storeRoot, t.fetchGeneration);
	expect(r.outcomes[0]!.status).toBe("written");
	const p = flushedProvider(storeRoot)!;
	expect(p.status).toBe("reported");
	expect(p.totalCost).toBeCloseTo(0.0042, 12); // c1 + c2
	expect("partial" in p).toBe(false);
	expect("unaccountedAttempts" in p).toBe(false);
	expect(t.calls).toEqual(["gen-a1", "gen-a2"]); // BOTH attempts harvested
	expect(p.generations.map((g) => g.attempt)).toEqual([1, 2]);
	expect(new Set(p.generations.map((g) => g.jobId))).toEqual(new Set(["job-1"]));
	// the block renders no partial legend
	const block = formatUsageBlock({ record: readUsageRecords(storeRoot)[0]!.spend, provider: p });
	expect(block).not.toContain("usage  partial");
});

// Contract 2 (spec §3): partial-with-figure on the new shape.
test("EV-42 contract 2: partial-with-figure — attempt 1 unaccounted, attempt 2 reports; the new legend renders, no n/a", async () => {
	const s = retriedFlushSetup();
	fs.rmSync(s.attempt1Path); // attempt 1's pointer dangles
	const storeRoot = tmpDir("ev42-store-");
	const t = keyedTransport({ "gen-a2": 0.0031 });
	await ev42Flush(s, storeRoot, t.fetchGeneration);
	const p = flushedProvider(storeRoot)!;
	expect(p.status).toBe("reported");
	expect(p.partial).toBe("attempts-unaccounted");
	expect(p.unaccountedAttempts).toEqual([1]);
	expect(p.totalCost).toBeCloseTo(0.0031, 12);
	const block = formatUsageBlock({ record: readUsageRecords(storeRoot)[0]!.spend, provider: p });
	expect(block).toContain("usage  partial = reported figure excludes unaccounted attempts");
	expect(block).not.toContain("usage  n/a = provider figure unavailable");
	// stack order: reported row → partial legend
	const lines = block.split("\n");
	const reportedIdx = lines.findIndex((l) => l.startsWith("usage  reported"));
	const partialIdx = lines.findIndex((l) => l.startsWith("usage  partial"));
	expect(partialIdx).toBe(reportedIdx + 1);
});

// Contract 3 (spec §3): all-unaccounted new shape — the `n/a` legend only,
// NO partial legend (J1; the owner dissent is rejected).
test("EV-42 contract 3: all-unaccounted new shape — unavailable, no partial (J1), the n/a legend last", async () => {
	const s = retriedFlushSetup();
	fs.rmSync(s.attempt1Path);
	fs.rmSync(s.attempt2Path);
	const storeRoot = tmpDir("ev42-store-");
	const t = keyedTransport({});
	await ev42Flush(s, storeRoot, t.fetchGeneration);
	const p = flushedProvider(storeRoot)!;
	expect(p.status).toBe("unavailable");
	expect(p.reason).toBe("session-missing");
	expect(p.totalCost).toBeNull();
	expect("partial" in p).toBe(false);
	expect(p.unaccountedAttempts).toEqual([1, 2]); // present as audit
	expect(t.calls).toHaveLength(0);
	const block = formatUsageBlock({ record: readUsageRecords(storeRoot)[0]!.spend, provider: p });
	const lines = block.split("\n");
	expect(lines[lines.length - 1]).toBe("usage  n/a = provider figure unavailable");
	expect(block).not.toContain("usage  partial");
});

// Contract 4b (spec §3): mixed-window precedence — the new-shape producer
// owns the disclosure; the legacy stamp does not fire.
test("EV-42 contract 4b: a mixed window — no final-attempt-only stamp when a new-shape manifest is present", async () => {
	const s = retriedFlushSetup();
	const dir = path.dirname(s.attempt1Path);
	fs.writeFileSync(
		path.join(dir, "job-2.jsonl"),
		[
			{ type: "session", version: 3, id: "job-2", timestamp: iso(T0), cwd: s.repo.root },
			assistantWithRid("jb1", null, T0 + 200, "gen-b1"),
		].map((e) => JSON.stringify(e)).join("\n") + "\n",
	);
	// the legacy window shape: attempt 2 with NO attempts list
	writeManifest(
		s.repo.root,
		s.repo.runId,
		manifest("job-2", {
			model: "openrouter/anthropic/claude-x",
			startedAt: T0 + 1600,
			exitCode: 0,
			settledAt: T0 + 4300,
			state: "done",
			attempt: 2,
		}),
	);
	const storeRoot = tmpDir("ev42-store-");
	const t = keyedTransport({ "gen-a1": 0.0011, "gen-a2": 0.0031, "gen-b1": 0.0007 });
	await ev42Flush(s, storeRoot, t.fetchGeneration);
	const p = flushedProvider(storeRoot)!;
	expect(p.status).toBe("reported");
	expect("partial" in p).toBe(false); // NOT final-attempt-only
	expect(t.calls).toEqual(["gen-a1", "gen-a2", "gen-b1"]); // every attempt of both dispatches
});

// Contract 5 (spec §3): non-retried byte-identity.
test("EV-42 contract 5: a non-retried dispatch's manifest and record are byte-identical to pre-EV-42", async () => {
	const s = openRouterFlushSetup();
	const m = readManifests(s.repo.root, s.repo.runId).find((x) => x.id === "job-1")!;
	expect("attempt" in m).toBe(false);
	expect("attempts" in m).toBe(false);
	const storeRoot = tmpDir("ev42-store-");
	const t = recordingTransport();
	await ev42Flush(s, storeRoot, t.fetchGeneration);
	const p = flushedProvider(storeRoot)!;
	expect("partial" in p).toBe(false);
	expect("unaccountedAttempts" in p).toBe(false);
	expect(p.generations.every((g) => !("attempt" in g))).toBe(true);
});

// Single-entry compatibility (spec §3 pins): a plain manifest whose session
// is present but empty stays unavailable/no-generation-id with no partial.
test("EV-42 single-entry compatibility: present-but-empty legacy session stays unavailable/no-generation-id, no partial", async () => {
	const s = flushSetup();
	const dir = path.join(s.repo.root, ".pi", "council", "runs", s.repo.runId);
	fs.writeFileSync(
		path.join(dir, "job-1.jsonl"),
		[
			{ type: "session", version: 3, id: "job-1", timestamp: iso(T0), cwd: s.repo.root },
			assistantEntry("ja1", null, T0 + 100, { input: 1, totalTokens: 1, cost: { total: 1 } }), // no responseId
		].map((e) => JSON.stringify(e)).join("\n") + "\n",
	);
	writeManifest(
		s.repo.root,
		s.repo.runId,
		manifest("job-1", {
			model: "openrouter/anthropic/claude-x",
			startedAt: T0 + 1500,
			exitCode: 0,
			settledAt: T0 + 2100,
			state: "done",
		}),
	);
	const storeRoot = tmpDir("ev42-store-");
	const t = recordingTransport();
	await ev42Flush(s, storeRoot, t.fetchGeneration);
	const p = flushedProvider(storeRoot)!;
	expect(p.status).toBe("unavailable");
	expect(p.reason).toBe("no-generation-id");
	expect("partial" in p).toBe(false);
	expect("unaccountedAttempts" in p).toBe(false);
});

test("EV-39 G3 (gate-closed/written-once): a mid-backoff manifest (exitCode null) keeps the flush gate closed; the settled cumulative chain writes exactly once", async () => {
	const { repo, pending, flush } = flushSetup();
	const storeRoot = tmpDir("ev39-store-gate-");
	// attempt 1 settled retryable and the supervisor armed: the retrying
	// manifest reads exitCode null with the attempt ordinal (D2) — the same
	// shape the hub test pins mid-backoff.
	writeManifest(
		repo.root,
		repo.runId,
		manifest("job-1", { startedAt: T0 + 1500, exitCode: null, state: "retrying", attempt: 2, nextAttemptAt: T0 + 90_000 }),
	);
	const r1 = await flush("forest-settle", pending, { storeRoot });
	expect(r1.outcomes[0]!.status).toBe("gate-closed");
	expect(readUsageRecords(storeRoot)).toHaveLength(0);

	// the chain completes: attempt 2 settles, the manifest carries the
	// cumulative usage (cardinality A) and exitCode lands
	writeManifest(
		repo.root,
		repo.runId,
		manifest("job-1", {
			startedAt: T0 + 1500, // D1 — stable startedAt, still one invocation window
			exitCode: 0,
			state: "done",
			settledAt: T0 + 2500,
			attempt: 2,
			usage: { input: 40, output: 0, cacheRead: 0, cacheWrite: 0, reasoning: 0, totalTokens: 40, cost: 4, costInput: 0, costOutput: 0, costCacheRead: 0, costCacheWrite: 0, turns: 2, costBasis: "catalogue-estimate", usageSource: "stream-assistant" },
		}),
	);
	const r2 = await flush("forest-settle", pending, { storeRoot });
	expect(r2.outcomes[0]!.status).toBe("written");
	const records = readUsageRecords(storeRoot);
	expect(records).toHaveLength(1); // exactly once — never a mid-backoff under-count
	expect(records[0]!.spend.subtree.cost).toBe(4);
	expect(records[0]!.spend.subtree.turns).toBe(2);

	// a third flush is the choose-once no-op
	const r3 = await flush("forest-settle", pending, { storeRoot });
	expect(r3.outcomes[0]!.status).toBe("existing");
	expect(readUsageRecords(storeRoot)).toHaveLength(1);
});

// ---------------------------------------------------------------------------
// EV-71 — the gate sibling on the flush path (spec §1.4): one readGateLedger
// per flush pass; window predicate `Date.parse(call.recordedAt) >= markerAt`
// (lower bound only); reconcileGateSpend with ids sourced ONLY from the
// ledger; record.gate present iff callsInWindow > 0, independent of
// `provider`; the write-transition notify composes the block from the
// PERSISTED record. Grammar-scoped goldens carry the ruling wording verbatim
// in test/usage-block.test.ts (§ EV-71) — this file asserts the persisted
// record and the flush semantics.
// ---------------------------------------------------------------------------

import { appendGateCall, type GateCallInput } from "../extensions/gate-ledger.ts";

function gateCallIn(repo: Repo, t: number, over: Partial<GateCallInput> = {}) {
	return appendGateCall(
		{
			stateHash: "s-hash",
			questionSetVersion: "q1",
			questionIds: [],
			answers: {},
			resolvedMode: "Verify",
			policyVersion: "p1",
			now: () => iso(t),
			...over,
		},
		repo.root,
	);
}

const GATE_LEGEND_LINE = "usage  gate = excluded from this total";

// Items 13 + 14 + 20 — the acceptance property end to end: a ledger-sourced
// gen-dec- id is looked up through the injected double exactly once (after
// the seat ids), its reported total_cost resolves into the persisted
// record.gate, and the write-transition notify composes the block from the
// PERSISTED record.
test("EV-71 items 13/14/20: flush looks up the ledger-sourced gen-dec- id once, persists record.gate, and the notify equals the persisted block", async () => {
	const s = openRouterFlushSetup();
	gateCallIn(s.repo, T0 + 5000, {
		callId: "call-gate-1",
		generationId: "gen-dec-1",
		usage: { input_tokens: 10, output_tokens: 5, cost: 0.0042 },
	});
	const storeRoot = tmpDir("ev71-store-");
	const t = keyedTransport({ "gen-f1": 0.0042, "gen-dec-1": 0.0042 });
	const notes: string[] = [];
	const r = await flushPendingInvocations({
		repoRoot: s.repo.root,
		entries: s.entries,
		leafId: s.leafId,
		sessionId: SID,
		pending: s.pending,
		trigger: "agent-settled",
		storeRoot,
		notify: (m) => notes.push(m),
		providerDeps: { fetchGeneration: t.fetchGeneration, apiKey: "k" },
	});
	expect(r.outcomes[0]!.status).toBe("written");
	// item 14: seat-transcript silence — the double saw exactly the seat id
	// harvested from the session file and the ONE ledger-sourced decision id;
	// no gen-dec- id is ever synthesized from a transcript source
	expect(t.calls).toEqual(["gen-f1", "gen-dec-1"]);
	const [record] = readUsageRecords(storeRoot);
	expect(record!.schemaVersion).toBe(2); // additive sibling; no schema bump
	expect(record!.gate).toEqual({ callsInWindow: 1, totalCost: 0.0042, lookupCost: 0.0042, failedLookups: 0 });
	expect(record!.provider!.status).toBe("reported"); // seat path intact
	// item 20: the notify is the block composed from the PERSISTED record
	expect(notes).toHaveLength(1);
	expect(notes[0]).toBe(
		formatUsageBlock({ record: record!.spend, provider: record!.provider, gate: record!.gate }),
	);
	expect(notes[0].split("\n").at(-1)).toBe(GATE_LEGEND_LINE);
});

// Item 11 (principal T1) — a gate-only window with NO seat job: `provider`
// stays absent (byte-structural no-fold-in) while the gate sibling is set,
// and the seat halves keep their real measured catalogue figures (never n/a).
test("EV-71 item 11: gate-only window, no seat job — no provider field, gate present, real catalogue cost intact", async () => {
	const s = flushSetup();
	gateCallIn(s.repo, T0 + 5000, {
		callId: "call-gate-1",
		generationId: "gen-dec-1",
		usage: { input_tokens: 10, output_tokens: 5, cost: 0.0042 },
	});
	// a non-OpenRouter seat job ran: its manifest usage is real and measured
	writeManifest(
		s.repo.root,
		s.repo.runId,
		manifest("job-1", { model: "p/m", startedAt: T0 + 1500, exitCode: 0, state: "done", usage: flatUsage({ input: 30, totalTokens: 30, cost: 3, turns: 1 }) }),
	);
	const storeRoot = tmpDir("ev71-store-");
	const seen: string[] = [];
	const notes: string[] = [];
	await flushPendingInvocations({
		repoRoot: s.repo.root,
		entries: s.entries,
		leafId: s.leafId,
		sessionId: SID,
		pending: s.pending,
		trigger: "agent-settled",
		storeRoot,
		notify: (m) => notes.push(m),
		providerDeps: {
			fetchGeneration: async (id: string) => {
				seen.push(id);
				return { total_cost: 0.0042, provider_name: "Typesafe" };
			},
			apiKey: "k",
		},
	});
	const [record] = readUsageRecords(storeRoot);
	expect("provider" in record!).toBe(false); // structural: no seat report to fold into
	expect(record!.gate).toEqual({ callsInWindow: 1, totalCost: 0.0042, lookupCost: 0.0042, failedLookups: 0 });
	expect(seen).toEqual(["gen-dec-1"]); // only the ledger-sourced id
	// the seat half keeps its real measured catalogue figure (never n/a)
	expect(record!.spend.subtree.cost).toBe(3);
	expect(notes[0]).toBe(
		formatUsageBlock({ record: record!.spend, provider: record!.provider, gate: record!.gate }),
	);
	expect(notes[0]).toContain(GATE_LEGEND_LINE);
	expect(notes[0]).toContain("cost≈$3.0000 (catalogue)"); // real, not n/a
	expect(notes[0]).not.toContain("n/a =");
});

// Item 16 — the window predicate: `Date.parse(recordedAt) >= markerAt`,
// lower bound only, equality inclusive; a prior invocation's call never
// contributes to the current flush's record.
test("EV-71 item 16: window predicate — recordedAt < markerAt excluded, == markerAt included", async () => {
	const s = flushSetup(); // markerAt = T0 - 100
	gateCallIn(s.repo, T0 - 6000, {
		callId: "call-prior",
		generationId: "gen-dec-prior",
		usage: { input_tokens: 1, output_tokens: 1, cost: 0.0042 },
	});
	gateCallIn(s.repo, T0 - 100, {
		callId: "call-at-marker",
		generationId: "gen-dec-at",
		usage: { input_tokens: 1, output_tokens: 1, cost: 0.001 },
	});
	const storeRoot = tmpDir("ev71-store-");
	const seen: string[] = [];
	const r = await flushPendingInvocations({
		repoRoot: s.repo.root,
		entries: s.entries,
		leafId: s.leafId,
		sessionId: SID,
		pending: s.pending,
		trigger: "agent-settled",
		storeRoot,
		providerDeps: {
			fetchGeneration: async (id: string) => {
				seen.push(id);
				return { total_cost: 0.0042, provider_name: "Typesafe" };
			},
			apiKey: "k",
		},
	});
	expect(r.outcomes[0]!.status).toBe("written");
	expect(seen).toEqual(["gen-dec-at"]); // the prior invocation's call is excluded
	const [record] = readUsageRecords(storeRoot);
	expect(record!.gate!.callsInWindow).toBe(1);
	// O-C: the Σ golden compares through one float path — only the at-marker
	// call's cost is carried: 0.0042 − 0.001 = 0.0031999999999999997 path NOT
	// reachable here (one carried value); assert through the single float path
	expect(record!.gate!.totalCost).toBe(0.001);
	expect(record!.gate!.lookupCost).toBe(0.0042);
});

// Item 12 (flush half) — a failed-call-only window still renders the legend:
// record.gate set (call-claim), zero lookups, totalCost null — never an
// estimate.
test("EV-71 item 12: failed-call-only window — record.gate set, zero lookups, totalCost null, legend present", async () => {
	const s = flushSetup();
	gateCallIn(s.repo, T0 + 5000, { callId: "call-f", failureClass: "transport" }); // no usage, no generationId
	const storeRoot = tmpDir("ev71-store-");
	const seen: string[] = [];
	const notes: string[] = [];
	await flushPendingInvocations({
		repoRoot: s.repo.root,
		entries: s.entries,
		leafId: s.leafId,
		sessionId: SID,
		pending: s.pending,
		trigger: "agent-settled",
		storeRoot,
		notify: (m) => notes.push(m),
		providerDeps: {
			fetchGeneration: async (id: string) => {
				seen.push(id);
				return { total_cost: 0.0042 };
			},
			apiKey: "k",
		},
	});
	const [record] = readUsageRecords(storeRoot);
	expect(record!.gate).toEqual({ callsInWindow: 1, totalCost: null, lookupCost: null, failedLookups: 0 });
	expect(seen).toEqual([]); // zero lookups
	expect(notes).toHaveLength(1);
	expect(notes[0].split("\n").at(-1)).toBe(GATE_LEGEND_LINE);
});

// C7 (owner claim, structural check) — gate spend never folds into the seat
// path: with vs without a gate ledger call, the persisted `provider` sibling
// and `spend` are deep-equal; only `gate` appears.
test("EV-71 C7: with vs without a gate call — provider and spend deep-equal; gate is the only delta", async () => {
	const run = async (withGate: boolean): Promise<{ provider: unknown; spend: unknown; gate: unknown }> => {
		const s = openRouterFlushSetup();
		if (withGate) {
			gateCallIn(s.repo, T0 + 5000, {
				callId: "call-gate-1",
				generationId: "gen-dec-1",
				usage: { input_tokens: 10, output_tokens: 5, cost: 0.0042 },
			});
		}
		const storeRoot = tmpDir("ev71-store-");
		const t = recordingTransport();
		await flushPendingInvocations({
			repoRoot: s.repo.root,
			entries: s.entries,
			leafId: s.leafId,
			sessionId: SID,
			pending: s.pending,
			trigger: "agent-settled",
			storeRoot,
			providerDeps: { fetchGeneration: t.fetchGeneration, apiKey: "k", now: () => iso(T0 + 9000) },
		});
		const [record] = readUsageRecords(storeRoot);
		return { provider: record!.provider, spend: record!.spend, gate: record!.gate };
	};
	const without = await run(false);
	const withG = await run(true);
	expect(withG.provider).toEqual(without.provider);
	expect(withG.spend).toEqual(without.spend);
	expect(without.gate).toBeUndefined();
	expect(withG.gate).toBeDefined();
});
