---
id: FLLWUP-8
title: council-leaderboard task drill-down filter
state: Backlog
owner: null
epic: EPIC-4
goal: council-leaderboard accepts an optional task filter that renders only the named task's rows while the no-arg render stays byte-identical to v1
---

## Intent

Filed from EV-21's step-13 draft-then-confirm (human-approved, 2026-09-04).
The PO's EV-21 ruling (CONFIRM-1) bound `/council-leaderboard` v1 with no
`[task]` drill-down — "drill-downs are a follow-up if anyone asks for
them". This card is that ask, approved by the human at run close.

## Acceptance

- An optional `[task]` positional (or `--task <id>` — the deliberation
  picks) renders only the named task's rows in both slices it belongs to.
- Unknown task refuses loudly at parse time naming the available list
  from `listFixtureTasks`, mirroring `/council-eval`'s grammar; the
  failure is non-fatal to the session.
- The no-arg default render is byte-identical to the v1 output (existing
  tests stay green unchanged).
- The command remains a pure read — no dispatch, no mutation, conventions
  9.6 and 12 hold.
