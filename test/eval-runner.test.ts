import { test, expect } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { CONFIG_DIR_NAME } from "@earendil-works/pi-coding-agent";
import type { CellScope, StoredResultRecord } from "../extensions/eval-rubric.ts";
import { aggregateCell, compareCellTriage } from "../extensions/eval-stats.ts";

// ---- helpers ----

const REPO = "sha256:" + "a".repeat(64);

function scope(over: Partial<CellScope> = {}): CellScope {
	return {
		state: "done",
		usage: { input: 0, output: 0, cost: 0, turns: 0 },
		elapsedMs: 1,
		repoState: REPO,
		...over,
	};
}

function stubResult(over: Partial<StoredResultRecord> = {}): StoredResultRecord {
	return {
		cellId: "taskA|m/x",
		taskId: "taskA",
		model: "m/x",
		repeat: 1,
		fixtureVersion: "1.0.0",
		rubricVersion: "1.0.0",
		scoredUnder: "m/x",
		perCriterion: [],
		score: 1.0,
		gradedAt: 1,
		cellScope: scope(),
		...over,
	};
}

test("E2: length is flagged, never scored 0 — mean over graded repeats only", () => {
	const records = [
		stubResult({ repeat: 1, score: 1.0 }),
		stubResult({ repeat: 2, score: 1.0, cellScope: scope({ stopReason: "length" }) }),
		stubResult({ repeat: 3, score: 0, cellScope: scope({ state: "timeout", stopReason: "timeout" }) }),
	];
	const s = aggregateCell(records);
	expect(s.n_attempted).toBe(3);
	expect(s.n_graded).toBe(1);
	expect(s.lengthFlagged).toBe(1);
	expect(s.mean).toBe(1.0); // never 0.33
	expect(s.histogram.done).toBe(2);
	expect(s.histogram.timeout).toBe(1);
});

test("E3: terminal-state histogram + indeterminate on length majority, never a bare mean", () => {
	const records = [
		stubResult({ repeat: 1, score: 1.0 }),
		stubResult({ repeat: 2, score: 1.0, cellScope: scope({ stopReason: "length" }) }),
		stubResult({ repeat: 3, score: 1.0, cellScope: scope({ stopReason: "length" }) }),
	];
	const s = aggregateCell(records);
	expect(s.histogram).toEqual({ done: 3, stalled: 0, timeout: 0, failed: 0 });
	expect(s.lengthFlagged).toBe(2);
	expect(s.n_graded).toBe(1);
	expect(s.lengthMajority).toBe(true);
	expect(s.indeterminate).toBe(true);
});

test("sample sigma is Bessel-corrected (n-1)", () => {
	const records = [
		stubResult({ repeat: 1, score: 1.0 }),
		stubResult({ repeat: 2, score: 1.0 }),
		stubResult({ repeat: 3, score: 0.0 }),
	];
	const s = aggregateCell(records);
	expect(s.n_graded).toBe(3);
	expect(s.mean).toBeCloseTo(2 / 3, 10);
	// sample variance of [1,1,0]: mean 2/3 -> (1/9 + 1/9 + 4/9)/2 = (6/9)/2 = 1/3
	expect(s.sigma).toBeCloseTo(Math.sqrt(1 / 3), 10);
});

test("n_graded < 2 -> sigma null; n_graded === 0 -> mean null and indeterminate", () => {
	expect(aggregateCell([stubResult({ repeat: 1, score: 0.5 })]).sigma).toBeNull();
	const empty = aggregateCell([
		stubResult({ repeat: 1, score: 0, cellScope: scope({ state: "stalled", stopReason: "stalled" }) }),
	]);
	expect(empty.n_graded).toBe(0);
	expect(empty.mean).toBeNull();
	expect(empty.indeterminate).toBe(true);
});

test("E1: two n=3 cells with overlapping score CIs render as tied (CI on mean difference includes zero)", () => {
	const a = [1.0, 0.5, 0.9]; // mean 0.8, wide spread
	const b = [0.7, 0.8, 0.6]; // mean 0.7
	const t = compareCellTriage(a, b);
	expect(t.tied).toBe(true); // CI on mean-difference spans zero
	expect(t.ciLo <= 0 && t.ciHi >= 0).toBe(true);
	expect(t.meanDiff).toBeCloseTo(0.1, 10);
});

test("E1b: a strongly separated pair is NOT tied (CI on mean difference excludes zero)", () => {
	const t = compareCellTriage([1.0, 1.0, 1.0], [0.0, 0.0, 0.0]);
	expect(t.tied).toBe(false);
	expect(t.ciLo > 0 || t.ciHi < 0).toBe(true);
});
