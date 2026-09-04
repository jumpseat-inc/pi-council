---
id: FLLWUP-6
title: Judge-bearing fixture smoke (Phase 5)
state: Backlog
owner: null
epic: EPIC-4
goal: The smoke drives a judge-bearing fixture end to end so grader rows, verdict records, and TRIAGE rendering have a container-level falsifier
---

## Intent

Filed from EV-21's step-13 draft-then-confirm (human-approved, 2026-09-04).
EV-20's Q3 ruling explicitly deferred a judge-bearing fixture smoke — "a
judge-bearing fixture smoke is a later-card concern (lands when EV-21 needs
a `scoredUnder != self` row to render)". EV-21 is that card: its smoke
Phase 4 renders only the gate-only store, so ranked rows, grader-faceted
rows, and `tied (±CI)` / `leader` / `runner-up` TRIAGE rendering have no
end-to-end falsifier — pure unit tests carry them today.

The PO's EV-21 ruling (J-2) documented the fixture-bump+rerun variant as a
one-PR escape hatch requiring no fresh ruling; this card may fold it in as
a second new phase or leave it out — the deliberation decides.

## Acceptance

- A new smoke phase (appended, existing phases untouched) drives
  `/council-eval` on one of the 9 judge-bearing fixtures headlessly and
  asserts the records carry `scoredUnder` equal to the fixture's
  `graderModel` plus a `VerdictRecord` for the cell.
- `/council-leaderboard` then renders a ranked row (not a gate-only row)
  for that cell, with the grader facet present and no `gate-only (self)`
  marker.
- Reader-vs-`summarizeStore` byte-identity holds on the judge-bearing
  store; `validate.py` green after the phase.
- Every assertion wired `|| fatal`; phase failure fails the smoke.
