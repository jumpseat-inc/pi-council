---
id: FLLWUP-78
title: Make the gate legend key self-describing (deliberation, not gate)
state: Backlog
owner: null
epic: EPIC-13
goal: The usage block's gate-exclusion legend uses the self-describing key `deliberation` instead of the project-internal `gate`, with the row prefix, the `key = short definition` shape, the label column, and the legend stack order unchanged, and a golden test pinning the new key byte-for-byte while every other row and the exclusion semantics are unchanged.
---

## Intent

Filed from EV-71's step-13 follow-up draft P7. The legend key `gate` is internal
vocabulary; a reader who never saw this epic cannot tell what "gate" excludes.
`deliberation` is the self-describing term for the spend being excluded (the
intake-time system-one routing call). This is a copy change confined to one key
string, but it must not disturb the row grammar pinned by EV-71's J2 ruling.

## Acceptance

- The legend reads `usage  deliberation = excluded from this total` (exact bytes,
  pending the run's copy convention for the count variant if FLLWUP-77 lands
  first).
- Row order, label column, prefix, and the `reported → partial → n/a → deliberation`
  stack are unchanged.
- A golden test pins the key; no other row's bytes change.
- The block still renders byte-identical to the pre-EV-71 render when zero gate
  calls fall in the window.