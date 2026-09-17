---
title: Usage Block
type: concept
summary: The deterministic usage block rendered at five autonomous exits — grammar identity across forms, three whole-block states (failed > unresolved > empty), the conditional `n/a` legend, and the opt-in marker boundary mode.
aliases: [usage block, usage line, no usage recorded, accounting boundary unresolved]
tags: [pi-council/concept, pi-council/epic7]
sources: ["[[2026-09-11-epic7-run-ledger]]", "[[2026-09-16-epic9-run-ledger]]"]
created: 2026-09-11
updated: 2026-09-16
---

# Usage Block

`extensions/usage-block.ts` (EV-32) renders the invocation's spend at **five
autonomous exits**: `/features-new`, `/features-deliver` (its Phase 3 ledger
carries the runner block verbatim), `/council`, `/council-eval`, and a
`council-runner`'s own report. The block is produced by a **deterministic
handler**, never by the procedure's own prose — the same input yields the same
bytes, so a test can assert string equality and a person never reads
LLM-authored numbers.

## Composition, never forks

Every token/money fragment is shared (`formatTokensFragment`, `formatMoney` in
`extensions/usage-format.ts`), and the boundary row is `formatBoundaryLabel`
from [[spend-record]] verbatim. The module never re-renders a ruled literal.

Token field order (the EV-28 head-line re-budget): `turns` first, then
`in/out/cR/cW/reason/total` — only the *labels* collapse (`cacheRead → cR`,
`cacheWrite → cW`, the persisted `reasoning → reason` label, to avoid a
`stopReason` collision); no thousands separators; money rightmost, ≤160 columns.
Money is `cost≈$X.XXXX (catalogue)` (≈ is U+2248) or `cost=$X.XXXX (reported)`.

## Grammar identity, not line-count

R-6 means **grammar** identity across the forms: same `usage  ` prefix, same
label column, same `basis=` field read from the half's own `usageSource`, same
ordering, same whole-block states. The **runner form omits the `ownSession`
row** — the runner is null-rooted and its parent never performed a session
reconciliation, so a fabricated zero `session-reconciled` row would assert a
measurement that never happened. The omission is the card-satisfying minimum;
a real own-session half at point 5 is FLLWUP-31.

## The three whole-block states (precedence failed > unresolved > empty)

1. `usage  no usage recorded` — boundary resolved **and** both halves all-zero.
2. `usage  accounting boundary unresolved` — `boundary.resolved === false`
   (marker absent or off-chain). Steward's third state; without it the
   unresolved case renders identically to a measured zero, and any fixture test
   asserting the zero line passes vacuously.
3. `usage  accounting failed — <reason>` (em dash U+2014) — an accounting
   failure; no record to read.

A **conditional legend** `usage  n/a = provider figure unavailable` appears iff
a slot rendered `n/a` (see [[cost-provenance]]); a standing legend on a block
with no `n/a` would be the plausible-but-false pattern in reverse.

A **second conditional legend**, `usage  partial = reported figure excludes
unaccounted attempts`, appears iff the provider sibling carries `partial` while
a figure exists (EPIC-9, [[figure-scoped-disclosure]]). Stack order is reported
row → partial legend → `n/a` legend. An **all-unaccounted** retried record
carries no `partial` at all — the `n/a` legend *is* the whole disclosure — and
the legacy window shape (`attempt > 1 && attempts === undefined`) keeps its
`final-attempt-only` bytes identical.

## The boundary-mode extension

`/council-eval` is a TS command whose handler awaits and never injects a user
message, so the default `boundaryMode: "user-message"` cannot resolve. Steward
ruled an **opt-in** `boundaryMode: "marker"`: the anchor *is* the invocation
marker, required present and on-chain, and the forest gate uses the marker's
own recorded `at`. The default is byte-preserving and fail-closed; this is an
extension, not a relaxation of the zero-both invariant.

## Related

- [[usage-accounting]] — the tuple the block renders
- [[spend-record]], [[usage-store]], [[cost-provenance]]
- [[figure-scoped-disclosure]] — the partial legend's predicate
- [[council-loop]] — the exits it reports at
- [[deterministic-merge-check]] — the run that shipped it

## Sources

- [[2026-09-11-epic7-run-ledger]]
- `extensions/usage-block.ts`, `extensions/usage-format.ts`
