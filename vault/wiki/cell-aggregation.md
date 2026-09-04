---
title: Cell Aggregation
type: concept
summary: The shared pure aggregate — aggregateCell computes mean (Bessel σ) over graded repeats with E1 CI-on-mean-difference triage, E2 length-never-zero, E3 terminal histogram; the live summary and the leaderboard must be byte-identical over the same records.
aliases: [aggregateCell, compareCellTriage, summarizeStore, eval aggregation]
tags: [pi-council/epic4]
sources: ["[[2026-09-04-epic4-run-ledger]]", "[[2026-09-03-po-ev21-ruling]]"]
created: 2026-09-04
updated: 2026-09-04
---

# Cell Aggregation

`extensions/eval-stats.ts` is the one shared pure aggregate module; the
live `/council-eval` summary and the `/council-leaderboard` both consume
it. **Same-function-both-sides is a byte-identity contract**, pinned by
tests and by smoke re-derivation — the summary is a pure function of the
on-disk records, never of in-memory loop counters.

## Semantics (EV-16 §8, binding)

- **E1 triage** — the confidence verdict is the CI on the mean
  *difference* excluding zero (Welch, via `compareCellTriage` over raw
  graded score arrays). Overlapping CIs render `tied (±CI)`, never an
  asserted ordering; "ordered by score" is presentation order, ranking is
  a claim the CI must earn.
- **E2** — a `done` repeat with `stopReason=length` is flagged, never
  scored 0; a length-majority cell renders `indeterminate (length
  majority)`.
- **E3** — terminal-state histogram over the repeat set; `n_graded` vs
  `n_attempted` always visible (`2/3`, not `3`).
- **σ** — Bessel-corrected sample standard deviation, `—` when n < 2. The
  acceptance word "variance" is bound to render as σ (EV-21 ruling J-1:
  "naming it VARIANCE while computing σ is a lie-of-imprecision").

## CONFIRM-2 — the reader-side bug that proved the contract

The landed `summarizeStore` grouped on `cellId + scoredUnder` only — it
dropped the `(fixtureVersion, rubricVersion)` pair the store filename
carries. After a fixture bump + re-run the live summary pooled both
version-keyed sets and averaged repeats across two incomparable rubric
versions (skeptic reproduction: `n_attempted=4, mean=0.625`). The EV-21
ruling folded the fix into EV-21 itself: **in-place** group-key fix (full
tuple), additive `CellSummary.fixtureVersion/rubricVersion/gradedScores`,
`summaryLines` version stamp, failing-test-first, single-version
byte-identity preserved. A version-aware *wrapper* was explicitly
rejected — two functions on opposite sides of a byte-identity seam is the
anti-pattern; "the version pair is part of the store's identity; make the
summary's identity equal the store's identity, one place, both consumers."

`gradedScores` exists precisely because E1 needs raw repeats: an
aggregate of aggregates cannot reproduce a Welch CI.

## Related

- [[eval store contract]] — the identity the reader must honor.
- [[model eval harness]] — the subsystem.
- [[council leaderboard]] — the read surface that surfaced the bug.
- [[2026-09-03-po-ev21-ruling]] — the CONFIRM-2 ruling.

## Sources

- [[2026-09-04-epic4-run-ledger]]
