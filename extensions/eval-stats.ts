/**
 * EV-20 — the PURE shared aggregate module (aka eval-aggregate.ts; name is an
 * implementer call per the spec). Reads ONLY records — never the job forest —
 * so the same functions produce byte-identical output for EV-20's on-session
 * summary and EV-21's leaderboard import (same-function-both-sides).
 *
 * Everything here is a pure function of the on-disk `StoredResultRecord`s:
 * mean / n-1 sample σ, the terminal-state histogram, the length-flag (E2),
 * and the CI-on-mean-difference triage (E1). No I/O, no state.
 */
import type { StoredResultRecord } from "./eval-rubric.ts";

/** Terminal-state histogram over the repeat set (E3). */
export interface CellTerminalHistogram {
	done: number;
	stalled: number;
	timeout: number;
	failed: number;
}

export interface CellSummary {
	cellId: string;
	scoredUnder: string;
	/** fixture version of this cohort (version-homogeneous by construction). */
	fixtureVersion: string;
	/** rubric version of this cohort (version-homogeneous by construction). */
	rubricVersion: string;
	/** repeats attempted (records present) */
	n_attempted: number;
	/** repeats whose score counts toward mean/σ (done + not length-flagged) */
	n_graded: number;
	/** raw graded repeat scores (done + not length-flagged), repeat order — feeds adjacent-pair compareCellTriage (E1). */
	gradedScores: number[];
	/** done repeats flagged stopReason=length (E2 — flagged, never scored 0) */
	lengthFlagged: number;
	/** mean over graded repeats; null when none graded */
	mean: number | null;
	/** sample σ (Bessel, n-1) over graded repeats; null when <2 graded */
	sigma: number | null;
	histogram: CellTerminalHistogram;
	/** lengthFlagged outnumber graded -> never a low bare mean (E3) */
	lengthMajority: boolean;
	/** no graded repeats OR length majority -> render indeterminate, not a number */
	indeterminate: boolean;
}

/**
 * Aggregate one cell's repeat records into a summary. Pure. A repeat is
 * graded iff its terminal state is `done` and it is not stopReason=length.
 * Histogram is counted from `cellScope.state` (persisted by the writer).
 */
export function aggregateCell(records: StoredResultRecord[]): CellSummary {
	// Deterministic repeat order (the store is repeat-keyed; filesystem read
	// order is not): gradedScores must be stable across reads, and every other
	// aggregate is order-independent, so a repeat-sort is safe.
	const sorted = [...records].sort((a, b) => (a.repeat ?? 0) - (b.repeat ?? 0));
	const graded: number[] = [];
	let lengthFlagged = 0;
	const histogram: CellTerminalHistogram = { done: 0, stalled: 0, timeout: 0, failed: 0 };
	const cellId = records[0]?.cellId ?? "";
	const scoredUnder = records[0]?.scoredUnder ?? "";

	for (const r of sorted) {
		const state = r.cellScope?.state ?? "done";
		if (state in histogram) histogram[state as keyof CellTerminalHistogram]++;
		const isLength = r.cellScope?.stopReason === "length";
		if (state === "done" && !isLength) graded.push(r.score);
		else if (state === "done" && isLength) lengthFlagged++;
	}

	const n_graded = graded.length;
	const mean = n_graded > 0 ? graded.reduce((a, b) => a + b, 0) / n_graded : null;
	let sigma: number | null = null;
	if (n_graded >= 2 && mean !== null) {
		const ss = graded.reduce((acc, v) => acc + (v - (mean as number)) ** 2, 0);
		sigma = Math.sqrt(ss / (n_graded - 1));
	}

	const lengthMajority = lengthFlagged > n_graded;
	return {
		cellId,
		scoredUnder,
		fixtureVersion: records[0]?.fixtureVersion ?? "",
		rubricVersion: records[0]?.rubricVersion ?? "",
		gradedScores: graded,
		n_attempted: records.length,
		n_graded,
		lengthFlagged,
		mean,
		sigma,
		histogram,
		lengthMajority,
		indeterminate: n_graded === 0 || lengthMajority,
	};
}

// ---- triage: CI on the mean difference excluding zero (E1) ----

/** Two-sided 0.975 t critical values for Welch df = 1..10 (then asymptote to 1.96). */
const T_CRIT_95: Record<number, number> = {
	1: 12.706,
	2: 4.303,
	3: 3.182,
	4: 2.776,
	5: 2.571,
	6: 2.447,
	7: 2.365,
	8: 2.306,
	9: 2.262,
	10: 2.228,
};

function tCrit95(df: number): number {
	const k = Math.min(30, Math.max(1, Math.floor(df)));
	if (k <= 10) return T_CRIT_95[k];
	if (k <= 20) return 2.086; // df 20
	return 1.96;
}

function mean(xs: number[]): number {
	return xs.reduce((x, y) => x + y, 0) / xs.length;
}

/** sample variance (n-1); 0 for n<2. */
function sampleVar(xs: number[]): number {
	if (xs.length < 2) return 0;
	const m = mean(xs);
	return xs.reduce((acc, v) => acc + (v - m) ** 2, 0) / (xs.length - 1);
}

export interface TriageResult {
	meanDiff: number;
	ciLo: number;
	ciHi: number;
	/** CI on the mean difference includes zero -> cannot assert an ordering. */
	tied: boolean;
}

/**
 * "A difference is real" = the 95% confidence interval on the mean difference
 * excluding zero (EV-16 §8). Welch two-sample t; degrees of freedom via the
 * Welch–Satterthwaite approximation; honestly wide at small n (t-above-normal)
 * so close n≤3 cells render as tied, never an asserted ordering.
 */
export function compareCellTriage(a: number[], b: number[]): TriageResult {
	const meanDiff = mean(a) - mean(b);
	const va = sampleVar(a);
	const vb = sampleVar(b);
	const na = a.length;
	const nb = b.length;
	const se = Math.sqrt(va / na + vb / nb) || 0;

	let df = 0;
	if (na > 1 && nb > 1) {
		const n1 = va / na;
		const n2 = vb / nb;
		df = (n1 + n2) ** 2 / (n1 ** 2 / (na - 1) + n2 ** 2 / (nb - 1));
	} else {
		df = Math.max(na, nb) - 1;
	}
	const t = df > 0 ? tCrit95(df) : 1.96;
	const ciLo = meanDiff - t * se;
	const ciHi = meanDiff + t * se;
	return { meanDiff, ciLo, ciHi, tied: !(ciLo > 0 || ciHi < 0) };
}
