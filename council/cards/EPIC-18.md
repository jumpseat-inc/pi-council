---
id: EPIC-18
title: Close the model-eval-harness residuals — judge projection, judge-bearing smoke, and leaderboard drill-down
state: Backlog
owner: null
epic: null
goal: The eval harness's filed residuals are delivered — `projectVerdictRecord` classifies judge criteria from the carried criterion type, the smoke drives a judge-bearing fixture end to end, and `/council-leaderboard` accepts a task filter whose no-arg render stays byte-identical to v1 — with the gates green.
---

## Intent

Residuals of the EPIC-4 model-eval harness. Three independent but adjacent improvements to the eval store's projection, the end-to-end smoke coverage of judge-bearing fixtures, and the leaderboard's read surface.

Children:

- FLLWUP-5
- FLLWUP-6
- FLLWUP-8

## Acceptance

Every child card is `Done` with its own goal satisfied, and the repo's gates (`bunx tsc --noEmit`, the full `bun test`, `python3 council/validate.py`, and `bash council/preflight.sh`) are green on each merged SHA. No child is silently dropped: each is delivered, folded, or recorded out of scope with a reason. The epic closes only when its named acceptance outcome is observed on the tree, not merely reported.
