/**
 * EV-21 — the pure leaderboard module. A read-only ranking of models per
 * command (procedure fixtures) and per seat (seat fixtures) from the on-disk
 * eval-results store, rendered as plain text (AGENTS.md 9.6 — no literal hex,
 * no ANSI, no 256-index in anything this module draws).
 *
 * Pure read: records come only through eval-runner's store boundary
 * (readAllResults), fixture kind through eval-fixtures' loader, and every
 * per-cohort aggregate is delegated to the shared `aggregateCell` / `compareCellTriage`
 * — the same functions /council-eval's summary uses, so both surfaces agree
 * byte-for-byte on n/mean/σ (same-function-both-sides, EV-20 Q1-D1).
 *
 * Group-by (the leaderboard's own key, finer than summarizeStore's cell unit):
 * (taskId, kind, model, thinking, fixtureVersion, rubricVersion, scoredUnder).
 * kind is a read-time loadFixture join — a pure function of taskId — with an
 * `unknown` bucket when the fixture is missing on disk (a deleted fixture must
 * never crash a history read, J-3). The rank axis is the tested model[:thinking];
 * scoredUnder is a row facet (the grader id never appears as a ranked row);
 * gate-only (`self`) rows render separated from graded rows.
 */
import { readAllResults, SCORED_UNDER_SELF } from "./eval-runner.ts";
import { aggregateCell, compareCellTriage, type CellSummary } from "./eval-stats.ts";
import { loadFixture } from "./eval-fixtures.ts";
import type { StoredResultRecord } from "./eval-rubric.ts";

export type LeaderKind = "procedure" | "seat" | "unknown";

export interface LeaderRow {
	taskId: string;
	kind: LeaderKind;
	model: string;
	thinking?: string;
	fixtureVersion: string;
	rubricVersion: string;
	scoredUnder: string;
	summary: CellSummary;
}

// ---- bound empty-state copy (J-1) ----

export const EMPTY_STATE_A = "council/eval-results/ does not exist — run /council-eval <task> <model…> to start";
export const EMPTY_STATE_B = "results exist, all gate-only (self) — not rankable against graded cells; run a judge-bearing fixture to compare";
export const EMPTY_STATE_C = "n<2 — need 2 repeats to triage";
export const EMPTY_STATE_D = "indeterminate (length majority) — do not pin from this cell";

const COLUMN_HEADER = ["TASK", "MODEL", "GRADER", "n", "MEAN", "σ", "TRIAGE"] as const;

const SLICE_LABEL: Record<LeaderKind, string> = {
	procedure: "By command (procedure fixtures)",
	seat: "By seat (seat fixtures)",
	unknown: "Kind unknown (fixture missing on disk)",
};

/** The rank identity of a row: `model[:thinking]` (Q1-D1 rank axis). */
export function rankAxis(model: string, thinking?: string): string {
	return thinking !== undefined ? `${model}:${thinking}` : model;
}

function resolveKind(repoRoot: string, taskId: string): LeaderKind {
	try {
		return loadFixture(repoRoot, taskId).fixture.kind;
	} catch {
		return "unknown"; // a deleted fixture never crashes a history read (J-3)
	}
}

/**
 * Group the whole store into leaderboard rows. Each group aggregates through
 * the shared aggregateCell, so a group's n/mean/σ are byte-identical to the
 * /council-eval summary of the same record set (version pair included — the
 * CONFIRM-2 group key rides here too: groups carry the full version pair).
 */
export function buildLeaderboard(store: string, repoRoot: string): LeaderRow[] {
	const grouped = new Map<string, StoredResultRecord[]>();
	for (const rec of readAllResults(store)) {
		// (taskId, model, thinking, fixtureVersion, rubricVersion, scoredUnder);
		// kind is derived from taskId (a pure function) so it cannot split a record set.
		const key = `${rec.taskId}\u0000${rec.model}\u0000${rec.thinking ?? ""}\u0000${rec.fixtureVersion}\u0000${rec.rubricVersion}\u0000${rec.scoredUnder}`;
		const arr = grouped.get(key);
		if (arr) arr.push(rec);
		else grouped.set(key, [rec]);
	}
	const kindCache = new Map<string, LeaderKind>();
	return [...grouped.values()].map((recs) => {
		const r0 = recs[0];
		let kind = kindCache.get(r0.taskId);
		if (kind === undefined) {
			kind = resolveKind(repoRoot, r0.taskId);
			kindCache.set(r0.taskId, kind);
		}
		return {
			taskId: r0.taskId,
			kind,
			model: r0.model,
			...(r0.thinking !== undefined ? { thinking: r0.thinking } : {}),
			fixtureVersion: r0.fixtureVersion,
			rubricVersion: r0.rubricVersion,
			scoredUnder: r0.scoredUnder,
			summary: aggregateCell(recs),
		};
	});
}

// ---- tiers (E1/E2/E3) ----

/** Rankable = graded (not gate-only) with >=2 graded repeats and not indeterminate. */
function isRankable(r: LeaderRow): boolean {
	const s = r.summary;
	return r.scoredUnder !== SCORED_UNDER_SELF && s.n_graded >= 2 && !s.indeterminate;
}

/**
 * Tier phrases over the rankable rows in mean-desc order. Adjacent-pair
 * compareCellTriage over gradedScores: overlapping CIs mark both touching rows
 * `tied (±CI)` (never an asserted ordinal); otherwise the top isolated row is
 * `leader`, the second `runner-up`, and lower isolated rows carry no tier
 * (they are ordered, but the trio of phrases asserts no strength on them).
 */
function tierForRankable(ranked: LeaderRow[]): Map<LeaderRow, string> {
	const tier = new Map<LeaderRow, string>();
	const tied = new Set<number>();
	for (let i = 0; i < ranked.length - 1; i++) {
		if (compareCellTriage(ranked[i].summary.gradedScores, ranked[i + 1].summary.gradedScores).tied) {
			tied.add(i);
			tied.add(i + 1);
		}
	}
	for (let i = 0; i < ranked.length; i++) {
		if (tied.has(i)) tier.set(ranked[i], "tied (±CI)");
		else if (i === 0) tier.set(ranked[i], "leader");
		else if (i === 1) tier.set(ranked[i], "runner-up");
		else tier.set(ranked[i], "");
	}
	return tier;
}

/** Per-row TRIAGE phrase — the confidence verdict, ordered-fields only. */
function rowTriage(r: LeaderRow, tier: string): string {
	if (r.scoredUnder === SCORED_UNDER_SELF) return "gate-only (self)";
	const s = r.summary;
	if (s.indeterminate) return s.lengthMajority ? "indeterminate (length majority)" : "indeterminate (no graded repeats)";
	if (s.n_graded < 2) return "n<2 (need 2 to triage)";
	return tier;
}

interface RenderRow {
	task: string;
	model: string;
	grader: string;
	n: string;
	mean: string;
	sigma: string;
	triage: string;
}

function toRenderRow(r: LeaderRow, tier: string): RenderRow {
	const s = r.summary;
	const isSelf = r.scoredUnder === SCORED_UNDER_SELF;
	return {
		task: r.taskId,
		model: rankAxis(r.model, r.thinking),
		grader: isSelf ? "self" : r.scoredUnder,
		n: isSelf ? "gate-only (self)" : `${s.n_graded}/${s.n_attempted}`,
		mean: s.mean === null ? "—" : s.mean.toFixed(3),
		sigma: s.sigma === null ? "—" : s.sigma.toFixed(3),
		triage: tier,
	};
}

function tableLines(rows: RenderRow[]): string[] {
	const cols: string[][] = [COLUMN_HEADER as unknown as string[], ...rows.map((r) => [r.task, r.model, r.grader, r.n, r.mean, r.sigma, r.triage])];
	const widths = COLUMN_HEADER.map((_, i) => Math.max(...cols.map((c) => c[i].length)));
	return cols.map((c) => c.map((v, i) => v.padEnd(widths[i])).join("  ").replace(/\s+$/, ""));
}

function cmpSemver(a: string, b: string): number {
	const pa = a.split(".").map(Number);
	const pb = b.split(".").map(Number);
	for (let i = 0; i < 3; i++) {
		if ((pa[i] ?? 0) !== (pb[i] ?? 0)) return (pa[i] ?? 0) - (pb[i] ?? 0);
	}
	return 0;
}

/** J-3 disclosure: kind resolves against the CURRENT fixture on disk. */
function disclosureLine(repoRoot: string, taskId: string, fallbackVersion: string): string {
	let cur = fallbackVersion;
	try {
		cur = loadFixture(repoRoot, taskId).fixture.fixtureVersion;
	} catch {
		/* current fixture missing — disclose with the cohort's own version */
	}
	return `kind reflects the current fixture (version v${cur}); historical rows use the same kind`;
}

/**
 * Render one slice's ranked tables. Version pairs are sibling row groups
 * (FIXTURE/RUBRIC in the per-task header), latest fixture+rubric first and
 * mean desc within each cohort. Gate-only (self) rows never enter the ranked
 * tables — they render in a separated block at the end of the slice.
 */
function renderRanked(rows: LeaderRow[], kind: LeaderKind, repoRoot: string): string[] {
	const byCohort = new Map<string, { taskId: string; fixtureVersion: string; rubricVersion: string; graded: LeaderRow[] }>();
	const selfRows: LeaderRow[] = [];
	for (const r of rows) {
		if (r.scoredUnder === SCORED_UNDER_SELF) {
			selfRows.push(r);
			continue;
		}
		const key = `${r.taskId}\u0000${r.fixtureVersion}\u0000${r.rubricVersion}`;
		const co = byCohort.get(key) ?? { taskId: r.taskId, fixtureVersion: r.fixtureVersion, rubricVersion: r.rubricVersion, graded: [] };
		co.graded.push(r);
		byCohort.set(key, co);
	}
	const cohorts = [...byCohort.values()].sort((a, b) => {
		const t = a.taskId.localeCompare(b.taskId);
		if (t !== 0) return t;
		const f = cmpSemver(b.fixtureVersion, a.fixtureVersion); // latest first
		if (f !== 0) return f;
		return cmpSemver(b.rubricVersion, a.rubricVersion);
	});

	const out: string[] = [];
	for (const co of cohorts) {
		out.push(`TASK ${co.taskId} — FIXTURE ${co.fixtureVersion} RUBRIC ${co.rubricVersion}`);
		if (kind !== "unknown") out.push(disclosureLine(repoRoot, co.taskId, co.fixtureVersion));
		const sorted = [...co.graded].sort((a, b) => {
			const ma = a.summary.mean ?? -1;
			const mb = b.summary.mean ?? -1;
			if (mb !== ma) return mb - ma;
			return rankAxis(a.model, a.thinking).localeCompare(rankAxis(b.model, b.thinking));
		});
		const ranked = sorted.filter(isRankable);
		const tiers = tierForRankable(ranked);
		const cellRows = sorted.map((r) => toRenderRow(r, tiers.get(r) ?? rowTriage(r, "")));
		out.push(...tableLines(cellRows));
	}
	if (selfRows.length > 0) {
		out.push("gate-only (self) rows:");
		for (const r of selfRows) {
			const s = r.summary;
			out.push(
				`  ${rankAxis(r.model, r.thinking)}  ${r.taskId}  ${r.fixtureVersion}/${r.rubricVersion}  ${s.n_graded}/${s.n_attempted}  mean=${s.mean === null ? "—" : s.mean.toFixed(3)}`,
			);
		}
	}
	return out;
}

/**
 * One slice (By command / By seat / unknown). Empty-state spectrum is truthful:
 * no rows -> header only; only gate-only rows -> State B; graded rows that
 * cannot rank at all -> State D (length majority) or State C (n<2); otherwise
 * the ranked tables.
 */
function renderSlice(rows: LeaderRow[], kind: LeaderKind, repoRoot: string): string[] {
	const out: string[] = [SLICE_LABEL[kind]];
	if (rows.length === 0) return out;
	const graded = rows.filter((r) => r.scoredUnder !== SCORED_UNDER_SELF);
	if (graded.length === 0) {
		out.push(EMPTY_STATE_B);
		return out;
	}
	if (!graded.some(isRankable)) {
		out.push(graded.every((r) => r.summary.lengthMajority) ? EMPTY_STATE_D : EMPTY_STATE_C);
		return out;
	}
	out.push(...renderRanked(rows, kind, repoRoot));
	return out;
}

/**
 * The whole-surface renderer: State A when the store has no records, otherwise
 * both slices by default (each labeled by its grouping axis), plus a third
 * `unknown` block only when a missing fixture forces the unknown bucket.
 */
export function renderLeaderboard(store: string, repoRoot: string): string[] {
	const rows = buildLeaderboard(store, repoRoot);
	if (rows.length === 0) return ["Leaderboard", "", EMPTY_STATE_A];
	const out: string[] = ["Leaderboard", ""];
	out.push(...renderSlice(rows.filter((r) => r.kind === "procedure"), "procedure", repoRoot));
	out.push("", ...renderSlice(rows.filter((r) => r.kind === "seat"), "seat", repoRoot));
	const unknown = rows.filter((r) => r.kind === "unknown");
	if (unknown.length > 0) out.push("", ...renderSlice(unknown, "unknown", repoRoot));
	return out;
}