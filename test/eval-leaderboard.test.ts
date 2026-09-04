import { test, expect } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import type { CellScope, StoredResultRecord } from "../extensions/eval-rubric.ts";
import { ensureEvalDir, writeResultRecord, SCORED_UNDER_SELF, summarizeStore } from "../extensions/eval-runner.ts";
import { buildLeaderboard, renderLeaderboard, rankAxis, EMPTY_STATE_A, EMPTY_STATE_B, EMPTY_STATE_C, EMPTY_STATE_D } from "../extensions/eval-leaderboard.ts";

// EV-21 — the leaderboard is a pure read over the eval-results store. These
// tests pin the spec's testable claims 1-9. Fixture kind resolves against the
// PACKAGED fixtures (PKG_ROOT) since repoRoot is a fresh temp dir, so "owner"
// (seat) and "council" (procedure) are real, discoverable fixtures.

const REPO = "sha256:" + "a".repeat(64);

function scope(over: Partial<CellScope> = {}): CellScope {
	return { state: "done", usage: { input: 0, output: 0, cost: 0, turns: 0 }, elapsedMs: 1, repoState: REPO, ...over };
}

function stub(over: Partial<StoredResultRecord> = {}): StoredResultRecord {
	return {
		cellId: "owner|m/x",
		taskId: "owner",
		model: "m/x",
		repeat: 1,
		fixtureVersion: "1.0.0",
		rubricVersion: "1.0.0",
		scoredUnder: SCORED_UNDER_SELF,
		perCriterion: [],
		score: 1.0,
		gradedAt: 1,
		cellScope: scope(),
		...over,
	};
}

function freshStore(): string {
	return ensureEvalDir(fs.mkdtempSync(path.join(os.tmpdir(), "council-lb-")));
}

/** Write one graded (judge-bearing) repeat for a cell. cellId follows Q1-D1 (taskId|model[:thinking]). */
function writeGraded(store: string, over: Partial<StoredResultRecord> & { score: number; repeat: number }): void {
	const rec = { ...stub({ repeat: over.repeat, score: over.score }), ...over };
	rec.cellId = `${rec.taskId}|${rec.model}`;
	writeResultRecord(store, rec, rec.cellScope ?? scope());
}

test("rankAxis: model[:thinking]", () => {
	expect(rankAxis("openrouter/m/x")).toBe("openrouter/m/x");
	expect(rankAxis("openrouter/m/x", "high")).toBe("openrouter/m/x:high");
});

// ---- claim 1: empty state A ----

test("claim 1: missing results dir -> exactly the State A copy, zero rank rows, names /council-eval", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "council-lb1-"));
	const missing = path.join(root, "no-such-results-dir");
	const lines = renderLeaderboard(missing, root);
	expect(lines).toEqual(["Leaderboard", "", EMPTY_STATE_A]);
	expect(EMPTY_STATE_A).toContain("/council-eval");
	expect(lines.join("\n")).not.toContain("MEAN");
});

// ---- claim 2: state B ----

test("claim 2: gate-only-only store -> State B copy, no numeric ranking, both slices render", () => {
	const s = freshStore();
	writeResultRecord(s, stub({ repeat: 1, score: 1.0 }), scope());
	writeResultRecord(s, stub({ repeat: 2, score: 1.0 }), scope());
	const lines = renderLeaderboard(s, fs.mkdtempSync(path.join(os.tmpdir(), "council-lb2-")));
	const text = lines.join("\n");
	expect(text).toContain(EMPTY_STATE_B);
	expect(text).not.toContain("TASK  MODEL"); // never a rendered rank table
	expect(text).not.toContain("1/2"); // no numeric n
	// both slices render by default, each labeled by its grouping axis
	expect(text).toContain("By command (procedure fixtures)");
	expect(text).toContain("By seat (seat fixtures)");
});

// ---- claim 3: version cohorts on the leaderboard reader (CONFIRM-2) ----

test("claim 3: two version pairs in one (taskId, scoredUnder) -> two rows with per-version means (0.45 / 0.9)", () => {
	const s = freshStore();
	writeGraded(s, { taskId: "owner", model: "m/x", fixtureVersion: "1.0.0", rubricVersion: "1.0.0", scoredUnder: "openrouter/j/j1", repeat: 1, score: 0.4 });
	writeGraded(s, { taskId: "owner", model: "m/x", fixtureVersion: "1.0.0", rubricVersion: "1.0.0", scoredUnder: "openrouter/j/j1", repeat: 2, score: 0.5 });
	writeGraded(s, { taskId: "owner", model: "m/x", fixtureVersion: "2.0.0", rubricVersion: "2.0.0", scoredUnder: "openrouter/j/j1", repeat: 1, score: 0.8 });
	writeGraded(s, { taskId: "owner", model: "m/x", fixtureVersion: "2.0.0", rubricVersion: "2.0.0", scoredUnder: "openrouter/j/j1", repeat: 2, score: 1.0 });

	const rows = buildLeaderboard(s, fs.mkdtempSync(path.join(os.tmpdir(), "council-lb3-")));
	expect(rows).toHaveLength(2);
	const byVer = new Map(rows.map((r) => [`${r.fixtureVersion}/${r.rubricVersion}`, r]));
	expect(byVer.get("1.0.0/1.0.0")!.summary.mean).toBeCloseTo(0.45, 10);
	expect(byVer.get("2.0.0/2.0.0")!.summary.mean).toBeCloseTo(0.9, 10);
	expect([...byVer.keys()].sort()).toEqual(["1.0.0/1.0.0", "2.0.0/2.0.0"]);
});

// ---- claim 4: byte-identity — leaderboard reader == summarizeStore (same-function-both-sides) ----

test("claim 4: buildLeaderboard aggregates agree with summarizeStore on n/mean/σ for identical record sets", () => {
	const s = freshStore();
	writeGraded(s, { taskId: "owner", model: "m/x", scoredUnder: "openrouter/j/j1", repeat: 1, score: 0.5 });
	writeGraded(s, { taskId: "owner", model: "m/x", scoredUnder: "openrouter/j/j1", repeat: 2, score: 0.7 });
	writeGraded(s, { taskId: "owner", model: "m/x", scoredUnder: "openrouter/j/j1", repeat: 3, score: 0.6 });
	const lb = buildLeaderboard(s, fs.mkdtempSync(path.join(os.tmpdir(), "council-lb4-")))[0];
	const sm = summarizeStore(s)[0];
	expect(lb.summary.n_attempted).toBe(sm.n_attempted);
	expect(lb.summary.n_graded).toBe(sm.n_graded);
	expect(lb.summary.mean).toBe(sm.mean);
	expect(lb.summary.sigma).toBe(sm.sigma);
});

// ---- claim 5: kind join through loadFixture + unknown bucket ----

test("claim 5: owner (seat) + council (procedure) bucket into their own slices by fixture.kind", () => {
	const s = freshStore();
	writeGraded(s, { taskId: "owner", model: "m/a", scoredUnder: "openrouter/j/j1", repeat: 1, score: 0.6 });
	writeGraded(s, { taskId: "owner", model: "m/a", scoredUnder: "openrouter/j/j1", repeat: 2, score: 0.6 });
	writeGraded(s, { taskId: "council", model: "m/b", scoredUnder: "openrouter/j/j1", repeat: 1, score: 0.7 });
	writeGraded(s, { taskId: "council", model: "m/b", scoredUnder: "openrouter/j/j1", repeat: 2, score: 0.7 });
	const lines = renderLeaderboard(s, fs.mkdtempSync(path.join(os.tmpdir(), "council-lb5-")));
	const text = lines.join("\n");
	const cmd = lines.slice(lines.indexOf("By command (procedure fixtures)"), lines.indexOf("By seat (seat fixtures)")).join("\n");
	const seat = lines.slice(lines.indexOf("By seat (seat fixtures)")).join("\n");
	expect(cmd).toContain("council");
	expect(cmd).not.toContain("owner");
	expect(seat).toContain("owner");
	expect(seat).not.toContain("council");
	expect(text).not.toContain("unknown");
});

test("claim 5b: deleted fixture -> unknown bucket, no crash, both slices still render", () => {
	const s = freshStore();
	writeGraded(s, { taskId: "deleted-task-xyz", model: "m/c", scoredUnder: "openrouter/j/j1", repeat: 1, score: 0.6 });
	writeGraded(s, { taskId: "deleted-task-xyz", model: "m/c", scoredUnder: "openrouter/j/j1", repeat: 2, score: 0.6 });
	const lines = renderLeaderboard(s, fs.mkdtempSync(path.join(os.tmpdir(), "council-lb5b-")));
	const text = lines.join("\n");
	expect(text).toContain("unknown");
	expect(text).toContain("By command (procedure fixtures)");
	expect(text).toContain("By seat (seat fixtures)");
});

// ---- claim 6: rank axis is the tested model; grader never a ranked row; gate-only separated ----

test("claim 6: row identity is the tested model[:thinking]; grader id never a ranked row", () => {
	const s = freshStore();
	for (const [model, scores] of [["m/a", [0.8, 0.8, 0.8]], ["m/b", [0.6, 0.6, 0.6]]] as const) {
		scores.forEach((score, i) => writeGraded(s, { taskId: "owner", model, scoredUnder: "openrouter/j/j1", repeat: i + 1, score }));
	}
	// gate-only cell on the same task: separated, never ranked
	writeResultRecord(s, stub({ taskId: "owner", model: "m/self", repeat: 1, score: 1.0 }), scope());
	writeResultRecord(s, stub({ taskId: "owner", model: "m/self", repeat: 2, score: 1.0 }), scope());

	const rows = buildLeaderboard(s, fs.mkdtempSync(path.join(os.tmpdir(), "council-lb6-")));
	for (const r of rows) expect(r.model).not.toBe("openrouter/j/j1"); // grader never a ranked row
	expect(rows.some((r) => r.scoredUnder === SCORED_UNDER_SELF)).toBe(true);

	const lines = renderLeaderboard(s, fs.mkdtempSync(path.join(os.tmpdir(), "council-lb6-")));
	const text = lines.join("\n");
	expect(text).toContain("m/a");
	expect(text).toContain("m/b");
	expect(text).toContain("openrouter/j/j1"); // GRADER column present
	// gate-only rows render separated from graded rows
	expect(text).toContain("gate-only (self)");
});

// ---- claim 7: E1 ties — overlapping CIs never assert an ordinal ----

test("claim 7: overlapping CIs -> both rows tied (±CI), never leader/runner-up", () => {
	const s = freshStore();
	// a = [1.0, 0.5, 0.9] mean 0.8; b = [0.7, 0.8, 0.6] mean 0.7 — CI on the mean difference spans zero
	const a = [1.0, 0.5, 0.9];
	const b = [0.7, 0.8, 0.6];
	a.forEach((score, i) => writeGraded(s, { taskId: "owner", model: "m/a", scoredUnder: "openrouter/j/j1", repeat: i + 1, score }));
	b.forEach((score, i) => writeGraded(s, { taskId: "owner", model: "m/b", scoredUnder: "openrouter/j/j1", repeat: i + 1, score }));
	const lines = renderLeaderboard(s, fs.mkdtempSync(path.join(os.tmpdir(), "council-lb7-")));
	const text = lines.join("\n");
	expect(text).toContain("tied (±CI)");
	expect(text).not.toContain("leader");
	expect(text).not.toContain("runner-up");
});

test("claim 7b: separated CIs -> distinct tiers (leader / runner-up)", () => {
	const s = freshStore();
	const a = [1.0, 1.0, 1.0];
	const b = [0.0, 0.0, 0.0];
	a.forEach((score, i) => writeGraded(s, { taskId: "owner", model: "m/a", scoredUnder: "openrouter/j/j1", repeat: i + 1, score }));
	b.forEach((score, i) => writeGraded(s, { taskId: "owner", model: "m/b", scoredUnder: "openrouter/j/j1", repeat: i + 1, score }));
	const text = renderLeaderboard(s, fs.mkdtempSync(path.join(os.tmpdir(), "council-lb7b-"))).join("\n");
	expect(text).toContain("leader");
	expect(text).toContain("runner-up");
	expect(text).not.toContain("tied (±CI)");
});

// ---- claim 8: E2/E3 — length-majority is indeterminate, excluded from numeric bands ----

test("claim 8: single length-majority cell -> State D copy, never a bare low mean", () => {
	const s = freshStore();
	// 2 of 3 repeats stopReason=length -> length majority, only 1 graded repeat
	const len = scope({ stopReason: "length" });
	writeResultRecord(s, stub({ taskId: "owner", model: "m/x", scoredUnder: "openrouter/j/j1", repeat: 1, score: 1.0 }), scope());
	writeResultRecord(s, stub({ taskId: "owner", model: "m/x", scoredUnder: "openrouter/j/j1", repeat: 2, score: 1.0, cellScope: len }), len);
	writeResultRecord(s, stub({ taskId: "owner", model: "m/x", scoredUnder: "openrouter/j/j1", repeat: 3, score: 1.0, cellScope: len }), len);
	const text = renderLeaderboard(s, fs.mkdtempSync(path.join(os.tmpdir(), "council-lb8-"))).join("\n");
	expect(text).toContain(EMPTY_STATE_D);
	expect(text).toContain("indeterminate (length majority)");
	expect(text).not.toMatch(/0\.33/); // the length-flagged repeats are never averaged as a low mean
});

test("claim 8b: indeterminate row in a mixed cohort renders its triage and never wins a tier by accident", () => {
	const s = freshStore();
	// rankable low row + length-majority row whose lone graded score would rank first by mean
	[0.4, 0.4, 0.4].forEach((score, i) => writeGraded(s, { taskId: "owner", model: "m/low", scoredUnder: "openrouter/j/j1", repeat: i + 1, score }));
	const len = scope({ stopReason: "length" });
	writeResultRecord(s, stub({ taskId: "owner", model: "m/len", scoredUnder: "openrouter/j/j1", repeat: 1, score: 1.0 }), scope());
	writeResultRecord(s, stub({ taskId: "owner", model: "m/len", scoredUnder: "openrouter/j/j1", repeat: 2, score: 1.0, cellScope: len }), len);
	writeResultRecord(s, stub({ taskId: "owner", model: "m/len", scoredUnder: "openrouter/j/j1", repeat: 3, score: 1.0, cellScope: len }), len);
	const text = renderLeaderboard(s, fs.mkdtempSync(path.join(os.tmpdir(), "council-lb8b-"))).join("\n");
	expect(text).toContain("indeterminate (length majority)");
	expect(text).toContain("leader"); // only the rankable low row earns a tier
});

// ---- claim 9: surface gate — command registration + purity + theme compliance ----

test("claim 9: index.ts registers /council-leaderboard wired to the pure module, never runMatrix", () => {
	const src = fs.readFileSync(path.join(import.meta.dir, "..", "extensions", "index.ts"), "utf-8");
	expect(src).toContain('pi.registerCommand("council-leaderboard"');
	expect(src).toMatch(/renderLeaderboard\(/);
	// the leaderboard handler block (up to the next registration) is a pure read
	const lbIdx = src.indexOf('pi.registerCommand("council-leaderboard"');
	const next = src.indexOf("pi.registerCommand", lbIdx + 10);
	const block = src.slice(lbIdx, next === -1 ? src.length : next);
	expect(block).toMatch(/renderLeaderboard\(/);
	expect(block).not.toMatch(/runMatrix/);
});

test("claim 9b: leaderboard render is plain text — no ANSI, no literal hex (9.6)", () => {
	const s = freshStore();
	[0.7, 0.7, 0.7].forEach((score, i) => writeGraded(s, { taskId: "owner", model: "m/a", scoredUnder: "openrouter/j/j1", repeat: i + 1, score }));
	[0.5, 0.5, 0.5].forEach((score, i) => writeGraded(s, { taskId: "owner", model: "m/b", scoredUnder: "openrouter/j/j1", repeat: i + 1, score }));
	const text = renderLeaderboard(s, fs.mkdtempSync(path.join(os.tmpdir(), "council-lb9-"))).join("\n");
	expect(text).not.toMatch(/\u001b/);
	expect(text).not.toMatch(/#[0-9a-fA-F]{3,8}/);
});

// ---- claim 3 complement: n<2 slice renders State C ----

test("claim 3c: slice where every graded row is n<2 renders State C copy", () => {
	const s = freshStore();
	writeGraded(s, { taskId: "owner", model: "m/a", scoredUnder: "openrouter/j/j1", repeat: 1, score: 0.8 });
	writeGraded(s, { taskId: "owner", model: "m/b", scoredUnder: "openrouter/j/j1", repeat: 1, score: 0.6 });
	const text = renderLeaderboard(s, fs.mkdtempSync(path.join(os.tmpdir(), "council-lb3c-"))).join("\n");
	expect(text).toContain(EMPTY_STATE_C);
	expect(text).toContain("need 2 repeats to triage");
});