---
title: PO EV-16 Grader Topology Ruling
type: source
summary: Binding ruling — the grader is a harness-dispatched sibling of the cell (Option A), linked by explicit cellId, so cell-invariance is honored by topology and no cost-exclusion rule is needed.
aliases: [grader topology ruling, option A sibling grader]
tags: [pi-council/epic4, ruling]
sources: []
created: 2026-09-04
updated: 2026-09-04
---

# PO EV-16 Grader Topology Ruling (2026-09-03)

Resolves where the grader lives in the dispatch tree. **Option A wins: the
harness dispatches the grader as a sibling of the cell** (same parent —
the command job), linked to its cell by an explicit `cellId` field on the
verdict record, never by tree position. Option B (cell-driver descendant)
rejected: it either relies on the cell-driver LLM cooperating with the
model-pin policy or forces every cost aggregator to carry a judge/gradedBy
exclusion rule — both fragile across the [[hub job supervision]] stability
boundary.

Deciding facts verified directly from code: `childEnv` copies
`process.env` forward (so a cell's model pin would leak into a
descendant grader unless overridden); the judge seat has `spawns: []`
(who dispatches the grader is entirely the caller's decision);
`writeJobManifest` carried no usage/stopReason (forest cost aggregation
needed the [[run transcripts]] RunManifest extension).

Structural consequences: cell subtree = `parentJobId`-chain rooted at the
cell job, grader outside it; **three cost columns** (cell / command /
grading) with no exclusion rule; verdict record schema frozen as
`{cellId, gradedBy, fixtureVersion, rubricVersion, perCriterion,
gradedAt}` + `gradingUsage`.

## Superseded (flagged, not silent)

- "First write wins for the cell, subsequent writes are new records" for
  the VerdictRecord key was **superseded by EV-20's Q1 ruling**: the key
  gained `repeat` → `(cellId, repeat, gradedBy)` — the mirror of O1, so
  three grader dispatches for repeats 1..3 produce three readable verdicts.
- The ruling's assumption that `gradeCell` runs once per cell became
  once per `(cell, repeat)` under the same Q1.

## Related

- [[grader topology]] — the concept page.
- [[eval store contract]] — the record schemas this ruling froze and Q1 amended.
- [[2026-09-03-po-ev19-resultrecord-key]] — the O1 mirror ruling.
- [[2026-09-04-epic4-run-ledger]] — the run context.

## Sources

- `vault/raw/2026-09-03-po-ev16-grader-topology.md`
