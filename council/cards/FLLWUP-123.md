---
id: FLLWUP-123
title: Re-run the SMOKE_PHASE=7 live falsifier on the merged main tree
state: Backlog
owner: null
epic: EPIC-25
goal: One SMOKE_PHASE=7 run on `main` at `02d73f2` confirms the repaired fixture face dispatches to its first seat dispatch on the merged tree, and the resulting artifact is recorded — the prior live evidence was produced pre-merge in the worktree and audited as an artifact, not re-run post-merge.
---

## Intent

FLLWUP-119 (Done, merged in EPIC-25's batch PR #117 at `02d73f2`) repaired
the EPIC-* smoke-fixture card faces so real model-driven flows can dispatch
them. Its live falsifier evidence (`SMOKE_PHASE=7`, the fixture face
dispatching to its first seat dispatch) was produced **pre-merge**, in the
owner's worktree, and audited as an artifact — never re-run on the merged
`main` tree. The step-13 gate surfaced the residual: one live run on merged
`main` at `02d73f2`, with the artifact recorded.

Filed from the EPIC-25 batch step-13 gate (candidate 2, draft title "Re-run
the SMOKE_PHASE=7 live falsifier on the merged main tree"),
product-owner-ratified `File` 2026-09-24 (confirming ruling, job-17 of the
EPIC-25 batch container, job-16; recorded gate basis: actionable: confidence
0.52 < choice floor 0.60 — active mode).

## Acceptance

1. One SMOKE_PHASE=7 run executes on merged `main` at `02d73f2` and
   confirms the repaired fixture face dispatches to its first seat dispatch
   on the merged tree.
2. The run's artifact is recorded (the evidence, not just a claim that the
   run happened).
3. `bun test`, `bunx tsc --noEmit`, and `python3 council/validate.py` stay
   green on the merged tree.
