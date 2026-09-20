---
id: FLLWUP-77
title: Name the excluded gate-call count in the usage legend
state: Backlog
owner: null
epic: EPIC-13
goal: The usage block's gate legend names how many gate calls it excludes, rendering header exactly as `usage  gate = <N> call(s) excluded from this total`, with a golden test over the one-call and multi-call cases, and the whole-block-state grammar scoping extended (or explicitly re-ruled) so a count-bearing legend is permitted where the legend's presence is no longer an iff.
---

## Intent

Filed from EV-71's step-13 follow-up draft P4. EV-71 ships the conditional legend
`usage  gate = excluded from this total`, whose presence is an iff on "at least
one gate call falls in the window". The count distinguishes one call from many —
which matters because gate spend is metered per card — but it changes the legend
from an iff to a count-bearing row, so the grammar scoping pinned in EV-71's
step-6 ruling (J2) must be extended or re-ruled deliberately rather than
inherited by accident.

## Acceptance

- The one-call and multi-call renders both name the exact count.
- The row keeps the `usage  ` prefix, the ruled key shape, the label column, and
  its last slot in the `reported → partial → n/a → gate` stack.
- The whole-block-state grammar scoping is amended (or a fresh ruling recorded)
  to permit the count-bearing legend; every relaxed state is named in its own
  golden with a `// Decision:` comment.
- Zero gate calls in window still renders the block byte-identical to the
  pre-EV-71 render.