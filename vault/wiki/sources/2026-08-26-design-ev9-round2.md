---
title: EV-9 Designer Round 2 — tree-as-anchor viewport
type: source
summary: Designer's refined EV-9 pass that drops the 50/50 height split for an asymmetric tree-as-anchor budget, reaffirms Enter-as-consumed-no-op, pins the shared-VStack hard bound, and keeps the union encoding.
aliases: [design-ev9-round2]
tags: [pi-council/source]
sources: ["[[2026-08-26-design-ev9-round2]]"]
created: 2026-08-26
updated: 2026-08-26
---

The designer's round-2 refinement on EV-9 after the owner/principal
exchange. It refines the viewport and reaffirms the inline expansion, all
within the settled EV-9 direction; the tiny-regime floor is ruled separately
in [[2026-08-26-po-ev9-tiny-regime-floor]].

## What changed and why

- **(a) The 50/50 height split is dropped.** Tree is the operator's spatial
  anchor; chopping it in half to share with progress breaks
  "returning-to-the-same-place" comprehension. Budget is asymmetric: tree
  keeps its EV-7 cap (≤11 rows incl. hint/overflow, often ≤6 after
  running-first sort), progress gets
  `max(3, availableRows − treeLinesCount − 1)` (floor 3, `availableRows =
  max(1, termRows − 5)`).
- **(b) Enter as consumed no-op — reaffirmed, rationale tightened.** Inside
  progress, Enter has no semantic (progress is already open); consuming it
  silently is the safe default against the slip "press Enter again."
- **(c) The shared-VStack constraint is a hard bound:** factory output
  ≤ `availableRows` always; tree windowing wins over progress expansion at
  small budgets.
- **(d) Rendering predictions are indifferent to union-vs-rods** — "is
  progress open?" is boolean either way; the encoding choice (discriminated
  union vs a parallel flag) is a modeling decision, not a rendering one.

## Falsifiable predictions / preferences

Refined P11 (tree-wins height budget), plus new P13 (render memo folds the
progress predicate), P14 (independent 1s transcript / 2s tree clocks),
P15 (a NEW `classifyProgressKey` + `routeEditorFocus` progress branch, EV-8
test file passes unmodified), P16/P17 (operational: bounded render at 500
blocks; selection survives re-sort during progress). Preferences de-escalated:
only the surface-type-union escalation is retained; the height budget is no
longer escalated.

## Related

- [[2026-08-26-design-ev9]] — the first pass this refines
- [[2026-08-26-po-ev9-tiny-regime-floor]] — the floor ruling
- [[council-job-tree-inline]], [[run-transcripts]], [[designer]]

## Sources

- `vault/raw/2026-08-26-design-ev9-round2.md`
