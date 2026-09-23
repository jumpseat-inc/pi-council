---
id: FLLWUP-77
title: Usage block gate legend: name the excluded call count, use the self-describing `deliberation` key, and signpost the gate ledger
state: Backlog
owner: null
epic: EPIC-13
goal: The usage block's gate legend names how many gate calls it excludes (`usage  deliberation = <N> call(s) excluded from this total`), uses the self-describing key `deliberation`, and carries a signpost to the gate ledger resolved through CONFIG_DIR_NAME (never a hardcoded .pi), with golden tests over the one-call/multi-call/zero-call cases, the whole-block-state grammar scoping extended to permit the count-bearing legend, and the row's prefix, label column, and reported → partial → n/a → deliberation stack slot unchanged.
---


## Intent

Filed from EV-71's step-13 follow-up draft P4. EV-71 ships the conditional legend
`usage  gate = excluded from this total`, whose presence is an iff on "at least
one gate call falls in the window". The count distinguishes one call from many —
which matters because gate spend is metered per card — but it changes the legend
from an iff to a count-bearing row, so the grammar scoping pinned in EV-71's
step-6 ruling (J2) must be extended or re-ruled deliberately rather than
inherited by accident.

---

### Absorbed: FLLWUP-78 — Make the gate legend key self-describing (deliberation, not gate)

Filed from EV-71's step-13 follow-up draft P7. The legend key `gate` is internal
vocabulary; a reader who never saw this epic cannot tell what "gate" excludes.
`deliberation` is the self-describing term for the spend being excluded (the
intake-time system-one routing call). This is a copy change confined to one key
string, but it must not disturb the row grammar pinned by EV-71's J2 ruling.

---

### Absorbed: FLLWUP-79 — Signpost the gate ledger from the usage block's exclusion surface

Filed from EV-71's step-13 follow-up draft O3(b), which the designer flagged as
urgent once P6 closed. EV-71 establishes the division of surfaces the designer
named: the usage block is the **exclusion** surface (what is not in this total)
and the gate ledger is the **trace** surface (the per-call records). Today the
legend tells a reader that spend is excluded with no way to reach the records
that show it.

## Acceptance

- The one-call and multi-call renders both name the exact count.
- The row keeps the `usage  ` prefix, the ruled key shape, the label column, and
  its last slot in the `reported → partial → n/a → gate` stack.
- The whole-block-state grammar scoping is amended (or a fresh ruling recorded)
  to permit the count-bearing legend; every relaxed state is named in its own
  golden with a `// Decision:` comment.
- Zero gate calls in window still renders the block byte-identical to the
  pre-EV-71 render.

---

### From FLLWUP-78 — Make the gate legend key self-describing (deliberation, not gate)

- The legend reads `usage  deliberation = excluded from this total` (exact bytes,
  pending the run's copy convention for the count variant if FLLWUP-77 lands
  first).
- Row order, label column, prefix, and the `reported → partial → n/a → deliberation`
  stack are unchanged.
- A golden test pins the key; no other row's bytes change.
- The block still renders byte-identical to the pre-EV-71 render when zero gate
  calls fall in the window.

---

### From FLLWUP-79 — Signpost the gate ledger from the usage block's exclusion surface

- The block names a concrete path to the gate ledger, and the path resolves
  through `CONFIG_DIR_NAME` (no hardcoded `.pi`, no absolute clone path).
- A golden test pins the signpost text; the row keeps its ruled grammar, label
  column, prefix, and stack slot.
- The signpost does not change the exclusion semantics or the total.
- Works under `mode: "off"` (no ledger file yet) without claiming a file exists.
