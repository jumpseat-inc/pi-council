---
id: EPIC-23
title: Autonomous-delivery cold-start efficiency: gate-routing disposition, Phase 1 class enumeration, and runner procedure pre-injection
state: Done
owner: null
epic: null
goal: Act on the three suggestions for autonomous delivery: fix gate routing, systematize Phase 1 front-loading, and cache/pass procedure context.
---

## Intent

The autonomous-delivery pipeline pays a cold-start cost on every card: each `council-runner` re-reads the full procedure from disk before its first dispatch, and a card whose deliberation surfaces an open judgment ends its turn in an `ESCALATION` so a fresh runner re-reads and resumes. The epic treats that cold start as one seam with two levers — Phase 1 front-loads the predictable open-judgment classes so fewer restarts happen, and procedure pre-injection removes the per-restart read so each restart is cheaper. The third intake suggestion, fixing gate routing, is dispositioned rather than built here: the gate-routing defect is already owned by FLLWUP-99 (metering), FLLWUP-104, and FLLWUP-71, and no duplicate card is filed under this epic.

## Phase 1 rulings

Recorded human decisions for the EPIC-23 run. Immutable for the run and binding on every seat, `steward` included.

- **P1-1 (run-scoped admin authorization).** For this run only — and not extended to any later run — the `main` ruleset's required approving review is satisfied by the sanctioned admin bypass: card merges use `gh pr merge <PR> --squash --admin --match-head-commit <X>` pinned to the exact SHA the merge check was read against; the step-12 direct record push to `main`; and the push of the EPIC-23 intake commit are all authorized. Without this record the bypass must not be used.
- **P1-2 (promotion).** EV-89 and EV-90 are ratified `Backlog → Ready` for this run.
- **P1-3 (build order).** Deliver EV-89 first, then EV-90. One `council-runner` at a time (board single-writer).

## Acceptance

- The epic is closed when its two children are merged, and when the gate-routing suggestion is dispositioned on the record as owned by FLLWUP-99 with FLLWUP-104 and FLLWUP-71 — no duplicate gate-routing card is filed under EPIC-23.
- No child changes the merge check, the seat schema, `hub.ts`, or the gate policy/question data without a corresponding failing test first.
- `bun test`, `bunx tsc --noEmit`, `python3 council/validate.py`, and `council/preflight.sh` pass on the merged tree.