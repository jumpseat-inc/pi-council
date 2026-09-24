---
id: EPIC-26
title: Close the EPIC-25 live-verification residuals — real-harness stale-ctx pin and post-merge SMOKE_PHASE=7 re-run
state: Backlog
owner: null
epic: null
goal: The two residuals re-homed from EPIC-25 are closed — FLLWUP-122 pins the FLLWUP-120 stale-ctx guard against the real pi extension runner harness (not only the modeled ctx, within the test-suite-budget live-arm envelope), and FLLWUP-123 re-runs the SMOKE_PHASE=7 live falsifier on the merged `main` tree at `02d73f2` with the artifact recorded — with `bun test`, `bunx tsc --noEmit`, and `python3 council/validate.py` green on the merged tree.
---

## Intent

EPIC-25 ("Close the EPIC-24 autonomous-delivery residuals") delivered and merged
its five named children — FLLWUP-117, FLLWUP-118, FLLWUP-119, FLLWUP-120, and
FLLWUP-121 — in one batch run (single `council-runner`, owner-first, one
branch/PR/merge, PR #117), then closed `Done` on its named acceptance. Its run
surfaced three step-13 candidates; `product-owner` ratified two `File` and dropped
the watch-only third. `steward` (job-19 of the run) ruled the two filed
residuals re-homed here, replaying the EPIC-23→EPIC-24 and EPIC-24→EPIC-25
close-out precedent, so no open child sits under a `Done` epic.

The two children:

- FLLWUP-122 — Build the FLLWUP-120 stale-ctx pin on the real pi runner harness.
- FLLWUP-123 — Re-run the SMOKE_PHASE=7 live falsifier on the merged main tree.

Both are live-verification residuals of the same principle: a modeled or
pre-merge proof is not proof of the shipped tree's operator-observable behavior
(`vault/wiki/live-mechanism-verification.md`).

## Acceptance

- Both children are merged with the `gates` workflow green on each merged SHA —
  or a child is explicitly dispositioned (retired/absorbed) on the record with
  the ruling that produced it.
- `bun test`, `bunx tsc --noEmit`, and `python3 council/validate.py` pass on the
  merged tree.