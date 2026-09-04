---
title: Grader Topology
type: concept
summary: The grader is a harness-dispatched sibling of the cell (not a descendant), linked by explicit cellId — cell-invariance is honored by topology, so no cost-exclusion rule exists anywhere.
aliases: [grader placement, sibling grader, option A topology]
tags: [pi-council/epic4]
sources: ["[[2026-09-03-po-ev16-grader-topology]]"]
created: 2026-09-04
updated: 2026-09-04
---

# Grader Topology

Where does the grader (the judge-seat dispatch that grades a cell's
open-ended criteria) sit in the dispatch tree? The binding answer:
**harness-dispatched sibling** — same parent as the cell (the command
job), linked to its cell by an explicit `cellId` field on the verdict
record, never by tree position.

## Why topology, not bookkeeping

"Only the model varies" means a cell's subtree cost must be exactly the
cell model's spend. The sibling topology delivers that for free: the
grader is structurally outside the `parentJobId` chain, so summing the
subtree cannot include grader spend. The rejected descendant option
needed one of two fragile mechanisms — the cell-driver LLM cooperating
with the model-pin policy on every dispatch, or an exclusion rule
(`seat == "judge"` → skip) inside every cost aggregator. Exclusion rules
are plumbing that drifts silently across the [[hub job supervision]]
stability boundary. **"No exclusion rule needed" is the design's payoff.**

## Consequences

- **Three cost columns**: cell (cell subtree), command (command subtree),
  grading (grader spend) — structurally separated, no subtraction.
- **Verdict records are self-describing**: `cellId` + `gradedBy` survive
  any future topology rearrangement; "verdict lives in cell's tree" and
  "verdict is about cell's output" are different facts; only the latter
  is recorded.
- **The judge seat dispatches nothing** (`spawns: []`) — grader placement
  is entirely the caller's decision, which is why it was a harness ruling.
- Cost aggregation required the [[run transcripts]] RunManifest to gain
  `usage`/`stopReason` plus a pure `sumSubtree` — the one sanctioned touch
  of the hub boundary, landing failing-test-first.
- Forest split across two repoRoots (cells run in scratch trees) is
  bounded: both roots share one `COUNCIL_RUN_ID`; the harness reads
  caller-side ∪ scratch-side manifests and joins on `parentJobId`,
  reading scratch-side sums before disposal (snapshots persist per
  [[eval store contract]] Q2).

## Related

- [[eval store contract]] — the record linkage.
- [[model eval harness]] — the subsystem.
- [[run transcripts]] — the manifest substrate the cost columns read.

## Sources

- [[2026-09-03-po-ev16-grader-topology]]
