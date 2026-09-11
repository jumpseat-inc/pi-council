import { test, expect } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { parseSessionEntries, type SessionEntry } from "@earendil-works/pi-coding-agent";
import { ensureRunDir, readManifests, writeManifest, type RunManifest, type Usage } from "../extensions/runs.ts";
import { spendRecord, formatBoundaryLabel } from "../extensions/spend.ts";

// ---------------------------------------------------------------------------
// Fixture substrate: a real session JSONL written to a tmpdir and parsed with
// pi's exported parseSessionEntries (getEntries() semantics: header dropped,
// raw append order, abandoned branches included).
// ---------------------------------------------------------------------------

const T0 = 1_700_000_000_000;
const iso = (ms: number) => new Date(ms).toISOString();
const SID = "sess-invoker";

function tmpDir(): string {
	return fs.mkdtempSync(path.join(os.tmpdir(), "ev30-"));
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

function toolResultEntry(id: string, parentId: string | null, ts: number, usage: object) {
	return {
		...base(id, parentId, ts),
		type: "message",
		message: {
			role: "toolResult",
			toolCallId: "tc",
			toolName: "t",
			content: [{ type: "text", text: "ok" }],
			isError: false,
			timestamp: ts,
			usage,
		},
	};
}

function compactionEntry(id: string, parentId: string | null, ts: number, usage: object) {
	return { ...base(id, parentId, ts), type: "compaction", summary: "s", firstKeptEntryId: "e000", tokensBefore: 10, usage };
}

function branchSummaryEntry(id: string, parentId: string | null, ts: number, usage: object) {
	return { ...base(id, parentId, ts), type: "branch_summary", fromId: "e000", summary: "s", usage };
}

function markerEntry(id: string, parentId: string | null, ts: number) {
	return {
		...base(id, parentId, ts),
		type: "custom",
		customType: "council-invocation",
		data: { command: "council", runId: "run-X", at: ts },
	};
}

function writeAndParse(dir: string, sessionId: string, entries: object[]): SessionEntry[] {
	const header = { type: "session", version: 3, id: sessionId, timestamp: iso(T0), cwd: dir };
	const file = path.join(dir, `${sessionId}.jsonl`);
	fs.writeFileSync(file, [header, ...entries].map((e) => JSON.stringify(e)).join("\n") + "\n");
	return parseSessionEntries(fs.readFileSync(file, "utf-8")).filter((e) => e.type !== "session") as unknown as SessionEntry[];
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

/**
 * T1 fixture chain (leaf a3), all timestamps on a fixed epoch:
 *   a_pre (assistant, in=100 out=200 cost=1000)  — pre-boundary, must be excluded
 *   m1    (council-invocation marker, parent a_pre)
 *   u1    (user, parent m1, T0+1000)             — the boundary
 *   a2    (assistant, in=10 out=20 cR=5 cW=1 reas=4 tot=36, cost in=10 out=20 cR=1 cW=2 total=33)
 *   tr    (toolResult, in=2 out=3 tot=5, cost total=10 input=10)
 *   comp  (compaction, in=4 out=6 tot=10, cost total=20)
 *   bs    (branch_summary, in=1 out=2 tot=3, cost total=5)
 *   a3    (assistant, in=7 out=8 reas=3 tot=15, cost total=40 input=40) ← leaf
 *   off   (assistant OFF-BRANCH, parent tr, in=999 out=999 cost=999) ← excluded
 *
 * ownSession hand sum: in=24 out=39 cR=5 cW=1 reas=7 tot=69 cost=108
 *                      costIn=60 costOut=20 costCR=1 costCW=2 turns=2
 * (3-kind sum without branch_summary would be in=23, cost=103.)
 */
function fullFixture(dir: string): { entries: SessionEntry[]; leafId: string; markerId: string } {
	const entries = writeAndParse(dir, SID, [
		assistantEntry("a_pre", null, T0 - 500, { input: 100, output: 200, totalTokens: 300, cost: { total: 1000 } }),
		markerEntry("m1", "a_pre", T0 - 100),
		userEntry("u1", "m1", T0 + 1000),
		assistantEntry("a2", "u1", T0 + 2000, {
			input: 10, output: 20, cacheRead: 5, cacheWrite: 1, reasoning: 4, totalTokens: 36,
			cost: { input: 10, output: 20, cacheRead: 1, cacheWrite: 2, total: 33 },
		}),
		toolResultEntry("tr", "a2", T0 + 2500, { input: 2, output: 3, totalTokens: 5, cost: { input: 10, total: 10 } }),
		compactionEntry("comp", "tr", T0 + 3000, { input: 4, output: 6, totalTokens: 10, cost: { total: 20 } }),
		branchSummaryEntry("bs", "comp", T0 + 3100, { input: 1, output: 2, totalTokens: 3, cost: { total: 5 } }),
		assistantEntry("a3", "bs", T0 + 3200, { input: 7, output: 8, reasoning: 3, totalTokens: 15, cost: { input: 40, total: 40 } }),
		// off-branch sibling, appended after the leaf in file order
		assistantEntry("off", "tr", T0 + 3300, { input: 999, output: 999, totalTokens: 1998, cost: { total: 999 } }),
	]);
	return { entries, leafId: "a3", markerId: "m1" };
}

/** Manifest set for T1: pre-boundary root (excluded) + eligible root + its child. */
function fullManifests(): RunManifest[] {
	const root = tmpDir();
	const runId = "run-F";
	ensureRunDir(root, runId);
	writeManifest(root, runId, manifest("job-0", {
		startedAt: T0 - 1000,
		usage: flatUsage({ input: 1000, cost: 1000, totalTokens: 1000 }),
	}));
	writeManifest(root, runId, manifest("job-1", {
		startedAt: T0 + 2000,
		usage: flatUsage({ input: 30, output: 40, cacheRead: 2, totalTokens: 70, cost: 50, turns: 1 }),
	}));
	writeManifest(root, runId, manifest("job-1.1", {
		parentJobId: "job-1",
		startedAt: T0 + 2100,
		usage: flatUsage({ input: 5, output: 6, totalTokens: 11, cost: 7, turns: 1 }),
	}));
	return readManifests(root, runId);
}

const NUMERIC_KEYS: Array<keyof Usage> = [
	"input", "output", "cacheRead", "cacheWrite", "reasoning", "totalTokens",
	"cost", "costInput", "costOutput", "costCacheRead", "costCacheWrite", "turns",
];

function expectZeroUsage(u: Usage): void {
	for (const k of NUMERIC_KEYS) expect(u[k]).toBe(0);
	expect(u.costBasis).toBe("catalogue-estimate");
}

// ---------------------------------------------------------------------------

test("T1 acceptance: ownSession equals the hand sum over the active chain at/after the boundary; subtree equals the forest sum; resolved label byte-exact", () => {
	const dir = tmpDir();
	const { entries, leafId, markerId } = fullFixture(dir);
	const rec = spendRecord({ entries, leafId, sessionId: SID, markerId, manifests: fullManifests() });

	expect(rec.boundary).toEqual({
		sessionId: SID, resolved: true, firstEntryId: "u1", lastEntryId: "a3", jobCount: 2,
	});
	// own hand sum (4 kinds: assistant + toolResult + compaction + branch_summary)
	expect(rec.ownSession.input).toBe(24);
	expect(rec.ownSession.output).toBe(39);
	expect(rec.ownSession.cacheRead).toBe(5);
	expect(rec.ownSession.cacheWrite).toBe(1);
	expect(rec.ownSession.reasoning).toBe(7);
	expect(rec.ownSession.totalTokens).toBe(69);
	expect(rec.ownSession.cost).toBe(108);
	expect(rec.ownSession.costInput).toBe(60);
	expect(rec.ownSession.costOutput).toBe(20);
	expect(rec.ownSession.costCacheRead).toBe(1);
	expect(rec.ownSession.costCacheWrite).toBe(2);
	expect(rec.ownSession.turns).toBe(2);
	expect(rec.ownSession.usageSource).toBe("session-reconciled");
	expect(rec.ownSession.costBasis).toBe("catalogue-estimate");
	// subtree hand sum over the forest (job-1 + job-1.1; pre-boundary job-0 excluded)
	expect(rec.subtree.input).toBe(35);
	expect(rec.subtree.output).toBe(46);
	expect(rec.subtree.cacheRead).toBe(2);
	expect(rec.subtree.totalTokens).toBe(81);
	expect(rec.subtree.cost).toBe(57);
	expect(rec.subtree.turns).toBe(2);
	expect(rec.subtree.usageSource).toBe("stream-assistant");
	expect(rec.subtree.costBasis).toBe("catalogue-estimate");
	// R-4 byte-exact resolved label
	expect(formatBoundaryLabel(rec)).toBe(`boundary=session=${SID} entries=u1..a3 jobs=2`);
});

test("T2 pre-boundary exclusion: the pre-boundary assistant's usage and the pre-boundary job's usage are absent from both halves", () => {
	const dir = tmpDir();
	const { entries, leafId, markerId } = fullFixture(dir);
	const rec = spendRecord({ entries, leafId, sessionId: SID, markerId, manifests: fullManifests() });
	// own half: pre-boundary assistant had input=100 → 24 (not 124)
	expect(rec.ownSession.input).toBe(24);
	// subtree: pre-boundary job-0 had input=1000 → 35 (not 1035)
	expect(rec.subtree.input).toBe(35);
});

test("T3 zero jobs: empty manifest set → subtree all-zero, jobs=0, boundary still resolved, no throw", () => {
	const dir = tmpDir();
	const { entries, leafId, markerId } = fullFixture(dir);
	const rec = spendRecord({ entries, leafId, sessionId: SID, markerId, manifests: [] });
	expect(rec.boundary.resolved).toBe(true);
	expect(rec.boundary.jobCount).toBe(0);
	expectZeroUsage(rec.subtree);
	// own-session intact
	expect(rec.ownSession.input).toBe(24);
	expect(formatBoundaryLabel(rec)).toBe(`boundary=session=${SID} entries=u1..a3 jobs=0`);
});

test("T4 pruned run dir: readManifests on a removed dir → same as zero jobs", () => {
	const dir = tmpDir();
	const { entries, leafId, markerId } = fullFixture(dir);
	const root = tmpDir();
	const runId = "run-P";
	ensureRunDir(root, runId);
	writeManifest(root, runId, manifest("job-1", { startedAt: T0 + 2000, usage: flatUsage({ input: 50 }) }));
	fs.rmSync(path.join(root, ".pi", "council", "runs", runId), { recursive: true, force: true });
	const manifests = readManifests(root, runId);
	expect(manifests).toEqual([]);
	const rec = spendRecord({ entries, leafId, sessionId: SID, markerId, manifests });
	expect(rec.boundary.resolved).toBe(true);
	expect(rec.boundary.jobCount).toBe(0);
	expectZeroUsage(rec.subtree);
	expect(rec.ownSession.input).toBe(24);
});

test("T5 boundary-unresolvable (marker absent / ghost / off-chain) → zero BOTH halves, resolved=false, entries=unresolved, no throw", () => {
	const dir = tmpDir();
	const { entries, leafId } = fullFixture(dir);
	// an off-branch marker (parent "off" is off-chain) present in entries
	const withOffMarker = writeAndParse(dir, `${SID}-x`, [
		assistantEntry("x_pre", null, T0 - 500, { input: 100, totalTokens: 100, cost: { total: 100 } }),
		assistantEntry("x_off", "x_pre", T0 - 400, { input: 50, totalTokens: 50, cost: { total: 50 } }),
		markerEntry("x_m", "x_off", T0 - 300),
		userEntry("x_u", "x_pre", T0 + 1000),
		assistantEntry("x_a", "x_u", T0 + 2000, { input: 9, totalTokens: 9, cost: { total: 9 } }),
	]);
	for (const [label, markerId, es] of [
		["null marker", null, entries],
		["ghost marker", "ghost", entries],
		["off-chain marker", "x_m", withOffMarker],
	] as Array<[string, string | null, SessionEntry[]]>) {
		const rec = spendRecord({ entries: es, leafId: label === "off-chain marker" ? "x_a" : leafId, sessionId: SID, markerId, manifests: fullManifests() });
		expect(rec.boundary.resolved).toBe(false);
		expect(rec.boundary.firstEntryId).toBeNull();
		expect(rec.boundary.lastEntryId).toBeNull();
		expect(rec.boundary.jobCount).toBe(0);
		expectZeroUsage(rec.ownSession);
		expectZeroUsage(rec.subtree);
		expect(formatBoundaryLabel(rec)).toBe(`boundary=session=${SID} entries=unresolved jobs=0`);
	}
});

test("T6 chain scoping: off-branch user message after the marker is not the boundary; off-branch usage excluded; compacted-away on-chain entry included", () => {
	const dir = tmpDir();
	// append order: a_pre, m1, uo (off-branch user, sibling of m1), u1 (on-chain), a1 (leaf)
	const entries = writeAndParse(dir, SID, [
		assistantEntry("a_pre", null, T0 - 500, { input: 100, totalTokens: 100, cost: { total: 100 } }),
		markerEntry("m1", "a_pre", T0 - 100),
		userEntry("uo", "a_pre", T0 + 500), // off-branch user, appended before u1
		userEntry("u1", "m1", T0 + 1000),
		assistantEntry("a1", "u1", T0 + 2000, { input: 6, totalTokens: 6, cost: { total: 6 } }),
		assistantEntry("ab", "u1", T0 + 2500, { input: 777, totalTokens: 777, cost: { total: 777 } }), // abandoned branch
	]);
	const rec = spendRecord({ entries, leafId: "a1", sessionId: SID, markerId: "m1", manifests: [] });
	expect(rec.boundary.resolved).toBe(true);
	expect(rec.boundary.firstEntryId).toBe("u1"); // not the off-branch user "uo"
	expect(rec.ownSession.input).toBe(6); // a1 only: pre-boundary 100, off-branch 777 excluded
});

test("T7 partial wire cost {total:0.001} → components 0, cost 0.001, never NaN", () => {
	const dir = tmpDir();
	const entries = writeAndParse(dir, SID, [
		markerEntry("m1", null, T0 - 100),
		userEntry("u1", "m1", T0 + 1000),
		assistantEntry("a2", "u1", T0 + 2000, {
			input: 0, output: 0, cacheRead: 0, cacheWrite: 0, totalTokens: 0, cost: { total: 0.001 },
		}),
	]);
	const rec = spendRecord({ entries, leafId: "a2", sessionId: SID, markerId: "m1", manifests: [] });
	expect(rec.ownSession.cost).toBe(0.001);
	for (const k of ["input", "output", "cacheRead", "cacheWrite", "costInput", "costOutput", "costCacheRead", "costCacheWrite"] as const) {
		expect(rec.ownSession[k]).toBe(0);
	}
	for (const k of NUMERIC_KEYS) expect(Number.isFinite(rec.ownSession[k])).toBe(true);
});

test("T8 invocation isolation: a later invocation's record excludes earlier jobs; recomputing an earlier invocation later grows (point-in-time filter)", () => {
	const dir = tmpDir();
	// two invocations in one session; invocation 2's user message is parented on
	// an intervening compaction entry (the real compaction-heavy path)
	const entries = writeAndParse(dir, SID, [
		assistantEntry("a_pre", null, T0 - 500, { input: 1, totalTokens: 1, cost: { total: 1 } }),
		markerEntry("m1", "a_pre", T0 - 100),
		userEntry("u1", "m1", T0 + 1000),
		assistantEntry("a1", "u1", T0 + 1500, { input: 2, totalTokens: 2, cost: { total: 2 } }),
		markerEntry("m2", "a1", T0 + 3900),
		// the pre-prompt compaction check appends AFTER the marker advanced the
		// leaf, so the compaction's parent is the marker; the injected user message
		// is then persisted on the compaction (O1) — the marker is still on-chain
		compactionEntry("c2", "m2", T0 + 3950, { input: 1, totalTokens: 1, cost: { total: 1 } }),
		userEntry("u2", "c2", T0 + 4000), // parent is the compaction, not the marker (O1)
		assistantEntry("a2", "u2", T0 + 4500, { input: 2, totalTokens: 2, cost: { total: 2 } }),
	]);
	const root = tmpDir();
	const runId = "run-T";
	ensureRunDir(root, runId);
	writeManifest(root, runId, manifest("job-1", { startedAt: T0 + 2000, usage: flatUsage({ input: 10, cost: 10 }) }));
	writeManifest(root, runId, manifest("job-1.1", { parentJobId: "job-1", startedAt: T0 + 2100, usage: flatUsage({ input: 4, cost: 4 }) }));
	writeManifest(root, runId, manifest("job-2", { startedAt: T0 + 5000, usage: flatUsage({ input: 100, cost: 100 }) }));
	const manifests = readManifests(root, runId);

	// later invocation (marker m2, boundary u2 at T0+4000): forest = job-2 only
	const r2 = spendRecord({ entries, leafId: "a2", sessionId: SID, markerId: "m2", manifests });
	expect(r2.boundary.firstEntryId).toBe("u2");
	expect(r2.boundary.jobCount).toBe(1);
	expect(r2.subtree.input).toBe(100);
	expect(r2.subtree.cost).toBe(100);

	// point-in-time / recompute drift: recomputing invocation 1's record NOW from
	// the same run dir includes job-2 (started T0+5000 ≥ boundary T0+1000) — the
	// forest is a point-in-time filter, not an invocation identity, which is why
	// the record is valid only when written once at exit (ruling item 6).
	const r1 = spendRecord({ entries, leafId: "a2", sessionId: SID, markerId: "m1", manifests });
	expect(r1.boundary.firstEntryId).toBe("u1");
	expect(r1.boundary.jobCount).toBe(3); // job-1, job-1.1, job-2
	expect(r1.subtree.input).toBe(114);
});

test("T9 ruling item 2: no total on the record; both halves carry their own usageSource simultaneously", () => {
	const dir = tmpDir();
	const { entries, leafId, markerId } = fullFixture(dir);
	const rec = spendRecord({ entries, leafId, sessionId: SID, markerId, manifests: fullManifests() });
	expect("total" in rec).toBe(false);
	expect(rec.ownSession.usageSource).toBe("session-reconciled");
	expect(rec.subtree.usageSource).toBe("stream-assistant");
	// reasoning accumulated independently, never re-added into output
	expect(rec.ownSession.reasoning).toBe(7);
	expect(rec.ownSession.output).toBe(39);
});

test("T10 legacy manifest without usage counts in jobCount, adds 0", () => {
	const dir = tmpDir();
	const { entries, leafId, markerId } = fullFixture(dir);
	const root = tmpDir();
	const runId = "run-L";
	ensureRunDir(root, runId);
	const legacy = manifest("job-1", { startedAt: T0 + 2000 });
	delete (legacy as Partial<RunManifest>).usage;
	writeManifest(root, runId, legacy);
	writeManifest(root, runId, manifest("job-2", { startedAt: T0 + 2100, usage: flatUsage({ input: 20, cost: 20 }) }));
	const manifests = readManifests(root, runId);
	const rec = spendRecord({ entries, leafId, sessionId: SID, markerId, manifests });
	expect(rec.boundary.jobCount).toBe(2);
	expect(rec.subtree.input).toBe(20); // legacy adds 0
	expect(rec.subtree.cost).toBe(20);
});

test("T13 four-kind enumeration: branch_summary usage yields the 4-kind sum, not the 3-kind sum", () => {
	const dir = tmpDir();
	const { entries, leafId, markerId } = fullFixture(dir);
	const rec = spendRecord({ entries, leafId, sessionId: SID, markerId, manifests: [] });
	// with branch_summary: input 24, cost 108; a 3-kind sum would be input 23, cost 103
	expect(rec.ownSession.input).toBe(24);
	expect(rec.ownSession.cost).toBe(108);
});

test("T14 ruling item 7: lastId is the active-chain end (leafId), never the last file entry on an abandoned branch", () => {
	const dir = tmpDir();
	const { entries, leafId, markerId } = fullFixture(dir);
	// "off" is appended after the leaf "a3" in entries order but is off-chain
	expect(entries[entries.length - 1]!.id).toBe("off");
	const rec = spendRecord({ entries, leafId, sessionId: SID, markerId, manifests: fullManifests() });
	expect(rec.boundary.lastEntryId).toBe("a3");
	expect(rec.boundary.lastEntryId).toBe(leafId);
	expect(rec.boundary.lastEntryId).not.toBe("off");
});
