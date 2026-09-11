// EV-32: the shared token/money fragments, extracted byte-identically out of
// formatUsageSegment (hub-tools.ts, EV-28). Pure leaf — types only from
// ./runs.ts. `formatUsageSegment` moves here with it and is re-exported from
// hub-tools.ts so EV-28's landed import and byte test are untouched.
//
// Token field order (EV-28 Q5): turns first, in/out/cR/cW/reason/total (only
// the labels collapse; persisted fields stay cacheRead/cacheWrite/reasoning),
// no thousands separators, labelled money rightmost; `≈` is U+2248 for the
// catalogue estimate, `$` for a reported charge.
import type { Usage } from "./runs.ts";

export function formatTokensFragment(u: Usage): string {
	return `turns=${u.turns} tokens=in ${u.input}/out ${u.output}/cR ${u.cacheRead}/cW ${u.cacheWrite}/reason ${u.reasoning}/total ${u.totalTokens}`;
}

export function formatMoney(u: Usage): string {
	return u.costBasis === "reported"
		? `cost=$${u.cost.toFixed(4)} (reported)`
		: `cost≈$${u.cost.toFixed(4)} (catalogue)`; // ≈ is U+2248
}

export function formatUsageSegment(u: Usage): string {
	return `${formatTokensFragment(u)} ${formatMoney(u)}`;
}
