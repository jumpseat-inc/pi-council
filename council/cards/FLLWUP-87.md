---
id: FLLWUP-87
title: Concurrent-session write discipline for `.council.json`
state: Backlog
owner: null
epic: EPIC-14
goal: Concurrent pi sessions writing .council.json (e.g. /council-models and /council-gate in different sessions) resolve last-rename-wins and silently lose one change; the write path gains a named discipline — either a file lock/lease or a versioned write-and-verify — and a test proving a lost-update is detected rather than silent, with no new runtime gate violating gate-parity.
---

## Intent

extensions/council-config-writer.ts's writeAtomic is tmp+rename; two concurrent writers in one repo race and one change is lost. EV-74 added a second write surface, making the pre-existing single-writer hazard easier to hit. The EV-74 deliberation scoped it out as a follow-up (principal round 2).

## Acceptance

- A test reproduces the lost-update under two interleaved writers.
- The chosen discipline is named and implemented for both writers (seat overrides and gate mode) through the shared splice module.
- Existing byte-preservation guarantees unchanged.
