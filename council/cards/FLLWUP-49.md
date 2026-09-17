---
id: FLLWUP-49
title: Promote the offline faux-provider harness into a shared smoke helper
state: Ready
owner: null
epic: EPIC-9
goal: The offline faux-provider harness is a shared test helper that both the parent-turn and seat-dispatch provider-error tests import, with no duplicated harness copy.
---

## Intent

EV-40's `test/ev40-harness/` (headless plus pty, with fail-count, arm,
context-log, and SIGINT knobs) proved its leverage by producing closed-red
findings, but EV-41 and EV-42 currently carry duplicated harness copies. A
refactor with no in-flight consumer belongs in `Backlog`, per the steward
disposition.
