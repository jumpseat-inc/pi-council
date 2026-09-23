---
id: EPIC-23
title: Autonomous-delivery cold-start efficiency: gate-routing disposition, Phase 1 class enumeration, and runner procedure pre-injection
state: Backlog
owner: null
epic: null
goal: Act on the three suggestions for autonomous delivery: fix gate routing, systematize Phase 1 front-loading, and cache/pass procedure context.
---

## Intent

The autonomous-delivery pipeline pays a cold-start cost on every card: each `council-runner` re-reads the full procedure from disk before its first dispatch, and a card whose deliberation surfaces an open judgment ends its turn in an `ESCALATION` so a fresh runner re-reads and resumes. The epic treats that cold start as one seam with two levers — Phase 1 front-loads the predictable open-judgment classes so fewer restarts happen, and procedure pre-injection removes the per-restart read so each restart is cheaper. The third intake suggestion, fixing gate routing, is dispositioned rather than built here: the gate-routing defect is already owned by FLLWUP-99 (metering), FLLWUP-104, and FLLWUP-71, and no duplicate card is filed under this epic.

## Acceptance

- The epic is closed when its two children are merged, and when the gate-routing suggestion is dispositioned on the record as owned by FLLWUP-99 with FLLWUP-104 and FLLWUP-71 — no duplicate gate-routing card is filed under EPIC-23.
- No child changes the merge check, the seat schema, `hub.ts`, or the gate policy/question data without a corresponding failing test first.
- `bun test`, `bunx tsc --noEmit`, `python3 council/validate.py`, and `council/preflight.sh` pass on the merged tree.