---
title: PO EV-19 ResultRecord Key Ruling (O1)
type: source
summary: Binding O1 ruling — the ResultRecord store key extends to (cellId, repeat, scoredUnder), the symmetric mirror of the VerdictRecord's gradedBy dimension; silent loss of a re-grade rejected as dishonest.
aliases: [O1 ruling, resultrecord key ruling]
tags: [pi-council/epic4, ruling]
sources: []
created: 2026-09-04
updated: 2026-09-04
---

# PO EV-19 ResultRecord Key Ruling (O1) (2026-09-03)

Under C2 (re-grade the same captured run under a second grader M2), the
deliberated `(cellId, repeat)` ResultRecord key collides — M2's score has
nowhere to land. **O1: extend the key to `(cellId, repeat, scoredUnder)`.**
The deciding pattern is the symmetric mirror: `scoredUnder` is the
ResultRecord's analogue of the VerdictRecord's `gradedBy`; one store
contract, not two. First-write-wins was rejected as "silent loss makes the
leaderboard less honest, not more" — a record's existence should reflect
what happened.

Also binds `scoredUnder = gradedBy` as an invariant, and names the
asymmetry the deliberation left open as exactly the kind of structural
decision that is a ruling, not a writer detail.

## Superseded (flagged, not silent)

- O1's key was **extended by EV-20's Q1-D1**: the
  `(fixtureVersion, rubricVersion)` pair rides the store key (present in
  the on-disk filename) so fixture/rubric bumps produce new keyed sets
  instead of fragmenting or blending cohorts. O1 bound the key's
  *dimensions*, not the field set — the extension is additive.
- The EV-20 implementation initially ignored the version pair at read
  time (see CONFIRM-2 on [[cell aggregation]]); fixed failing-test-first
  in EV-21.

## Related

- [[eval store contract]] — the concept page carrying the full key tuple.
- [[2026-09-03-po-ev16-grader-topology]] — the mirrored VerdictRecord side.
- [[cell aggregation]] — where the key matters at read time.
- [[2026-09-04-epic4-run-ledger]] — run context.

## Sources

- `vault/raw/2026-09-03-po-ev19-resultrecord-key.md`
