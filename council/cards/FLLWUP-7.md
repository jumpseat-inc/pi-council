---
id: FLLWUP-7
title: eval-results retention policy
state: Backlog
owner: null
epic: EPIC-4
goal: council/eval-results stops growing without bound under a retention rule that never prunes the newest version cohort of any cell
---

## Intent

Filed from EV-21's step-13 draft-then-confirm (human-approved, 2026-09-04).
The skeptic confirmed during EV-21 verification that the results store is
append-only and never pruned (`readAllResults` reads every record file;
no version cleanup anywhere in `runMatrix`), and EV-20's Q2 ruling defaults
per-repeat snapshot persistence ON (`council/eval-results/<cellId>/r<N>/
snapshot/`). Repeated matrices therefore accumulate record files and full
seeded snapshots without bound.

Constraint inherited from R-5 and the EV-19 O1 ruling — records alone must
suffice to recompute every aggregate — so retention may only drop whole
superseded version cohorts (or whole cells the caller names), never
individual repeats of the newest cohort, or the leaderboard's means and σ
become unreproducible.

## Acceptance

- A retention rule (keep-latest-N version cohorts per `cellId`, or an
  explicit prune command — the deliberation picks) runs at a defined
  trigger and documents the trigger.
- The newest `(fixtureVersion, rubricVersion)` cohort of every cell is
  never pruned; nothing under `runs/` is touched (convention 12 boundary).
- After retention, `summarizeStore` and the leaderboard recompute
  byte-identically from the retained set; tests pin both the pruning rule
  and the recompute guarantee.
