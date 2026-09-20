---
id: FLLWUP-73
title: Refresh the deterministic-merge-check wiki page for the mode-aware ruleset
state: Backlog
owner: null
epic: EPIC-13
goal: `vault/wiki/deterministic-merge-check.md` describes the five merge criteria as one unconditional ruleset; after EV-70 it must describe the mode→criteria table (Deliberate verbatim five; Verify all five with mode-scoped criterion 3; Direct criteria 1, 2, 5), the two verbatim HALT lines, the run-substrate mode read, and the unchanged criterion-2 `workflow`-field reading with `--match-head-commit` pinning.
---

## Intent

The wiki page is cited grounding for seats and runners executing or auditing
the merge gate. EV-70 changed the merge check from one unconditional
five-criteria ruleset to a mode-keyed table (Direct admitted as a third
mode; two verbatim HALT lines; mode read from the run substrate), and the
page still states the unconditional ruleset — stale grounding. Route through
`/wiki-ingest`; never hand-edit `vault/`. Out of scope: any behavior change;
the procedure prose at `council/procedures/features-deliver.md` head is the
authority this page must reflect.
