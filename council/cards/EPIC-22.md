---
id: EPIC-22
title: Close the process and test-discipline residuals
state: Backlog
owner: null
epic: null
goal: The process and test-discipline residuals are delivered — worktree-seat cwd discipline is pinned in the seat prompts, the frontmatter colon-continuation residual is gated, the backoff-jitter and textTree test-determinism flake classes are closed, a reusable cold-read persona harness settles the un-run output-surface predictions, the pre-write step-13 confirmation gate is pinned in both procedure files, and the gates CI-timeout residuals are closed — with the gates green.
---

## Intent

Residuals of the EPIC-9 residual runs that concern procedure text, seat-prompt discipline, CI/test determinism, and persona cold-reads rather than a single engine subsystem.

Children:

- FLLWUP-61
- FLLWUP-62
- FLLWUP-63
- FLLWUP-68
- FLLWUP-69
- FLLWUP-70

## Acceptance

Every child card is `Done` with its own goal satisfied, and the repo's gates (`bunx tsc --noEmit`, the full `bun test`, `python3 council/validate.py`, and `bash council/preflight.sh`) are green on each merged SHA. No child is silently dropped: each is delivered, folded, or recorded out of scope with a reason. The epic closes only when its named acceptance outcome is observed on the tree, not merely reported.
