// EV-32: the pure usage-block renderer — one grammar, three whole-block
// states, two forms. No node:fs, no ctx, no hub import; types only from
// ./runs.ts / ./spend.ts, and the shared formatter.
//
// Composition, never forks (PO effect item 1): every token/money fragment is
// formatTokensFragment/formatMoney (usage-format.ts) and the session boundary
// row is formatBoundaryLabel(record) verbatim (spend.ts, R-4) — this module
// never re-renders a ruled literal.
//
// R-6 is grammar identity, not line-count identity (PO C): the runner form
// omits the ownSession row (a fabricated zero `session-reconciled` row would
// assert a measurement the parent never performed) and composes its own
// job-scope boundary row (formatBoundaryLabel hardcodes jobs=0, which would be
// false here), with the same prefix, label column, basis field, ordering, and
// whole-block states.
import type { RunManifest, Usage } from "./runs.ts";
import { formatBoundaryLabel, accumulateFlat, zeroUsage, NUMERIC_METRICS, type SpendRecord } from "./spend.ts";
import { formatMoney, formatTokensFragment } from "./usage-format.ts";

/** The two measurement halves (SpendRecord's own field names). */
export type Half = "ownSession" | "subtree";

/** R-5's two bound literals + steward B's third state, precedence
 * failed > unresolved > empty. */
const NO_USAGE_LINE = "usage  no usage recorded";
const UNRESOLVED_LINE = "usage  accounting boundary unresolved";
const LEGEND_LINE = "usage  n/a = provider figure unavailable";
const FAILED_PREFIX = "usage  accounting failed \u2014 "; // U+2014

export type UsageBlockInput =
	| { record: SpendRecord; unavailableCost?: Half[] }
	| { failed: string };

/** Every numeric metric of a half is 0. */
function allZeroUsage(u: Usage): boolean {
	for (const k of NUMERIC_METRICS) if (u[k] !== 0) return false;
	return true;
}

/** `usage  ` + half label padded to a fixed 10-column field + two spaces +
 * `basis=` read from the half's own usageSource (never hardcoded, PO F). */
function measurementRow(half: Half, u: Usage, unavailable: boolean): string {
	const money = unavailable ? "cost=n/a" : formatMoney(u);
	return `usage  ${half.padEnd(10, " ")}  basis=${u.usageSource}  ${formatTokensFragment(u)} ${money}`;
}

/** The session-boundary form (points 1–4). Three whole-block states in the
 * precedence failed > unresolved > empty; the resolved form is two
 * measurement rows, the boundary row (R-4 verbatim), and the conditional
 * legend (present iff unavailableCost names ≥1 half — PO D/E). */
export function formatUsageBlock(input: UsageBlockInput): string {
	if ("failed" in input) {
		// Newline-normalized so the state stays exactly one line.
		const reason = input.failed.split(/[\r\n]+/).join(" ").trim();
		return `${FAILED_PREFIX}${reason}`;
	}
	const record = input.record;
	if (!record.boundary.resolved) return UNRESOLVED_LINE; // state 3
	if (allZeroUsage(record.ownSession) && allZeroUsage(record.subtree)) return NO_USAGE_LINE; // state 1
	const unavailable = input.unavailableCost ?? [];
	const rows = [
		measurementRow("ownSession", record.ownSession, unavailable.includes("ownSession")),
		measurementRow("subtree", record.subtree, unavailable.includes("subtree")),
		`usage  ${formatBoundaryLabel(record)}`,
	];
	if (unavailable.length > 0) rows.push(LEGEND_LINE);
	return rows.join("\n");
}

/** The runner form (point 5 only, PO C): no ownSession row, one subtree row,
 * a job-scope boundary row composed directly (NOT via formatBoundaryLabel —
 * its unresolved branch hardcodes jobs=0, which would be false here).
 * The runner's zero state remains state 1 (steward I) — never blank. */
export function formatRunnerUsageBlock(input: {
	sessionId: string;
	jobCount: number;
	subtree: Usage;
}): string {
	const { sessionId, jobCount, subtree } = input;
	if (allZeroUsage(subtree)) return NO_USAGE_LINE;
	return [
		measurementRow("subtree", subtree, false),
		`usage  boundary=session=${sessionId} entries=unresolved jobs=${jobCount}`,
	].join("\n");
}

export interface SubtreeUsageResult {
	/** The subtree sum over every numeric metric, basis catalogue-estimate /
	 * source stream-assistant (the manifest tuple's machine vocabulary). */
	subtree: Usage;
	/** True subtree node count (inclusive of the root). */
	jobCount: number;
}

/** Additive pure helper (spec §2.5 point 5): the job-forest subtree rooted at
 * `rootId` inclusive — parentJobId-chain descendants — summed over EVERY
 * numeric metric, plus the node count. Does not change `sumSubtree` (EV-16 §7
 * keeps its single-metric contract). Missing usage (pre-EV-16 manifests) adds
 * 0 and still counts the node. */
export function sumSubtreeUsage(manifests: RunManifest[], rootId: string): SubtreeUsageResult {
	const children = (id: string): RunManifest[] => manifests.filter((m) => m.parentJobId === id);
	const subtree = zeroUsage("catalogue-estimate", "stream-assistant");
	let jobCount = 0;
	const walk = (id: string): void => {
		const node = manifests.find((m) => m.id === id);
		if (node) {
			jobCount += 1;
			accumulateFlat(subtree, node.usage);
		}
		for (const c of children(id)) walk(c.id);
	};
	walk(rootId);
	return { subtree, jobCount };
}
