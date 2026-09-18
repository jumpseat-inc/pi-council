---
id: EPIC-12
title: pi-council version and git hash on the first pi run
state: Backlog
owner: null
epic: null
goal: Know what version of pi-council I am running whenever I run pi the first time; it should show the version and the latest git hash from the repo.
---

## Intent

When a person types `pi` at a terminal, the first thing they need to know is
which code is running under them: the pi-council version and the commit
(git hash) of the running package, so they can attribute a bug to specific
bytes and confirm the install is the one they think it is. This epic delivers
that answer as a one-shot plain-text notification at start-up, grounded in a
pure identity resolver for the running package root (with named degraded states
for no-git-metadata and git-unavailable) and proven by an end-to-end falsifier.
The surface is per-process, not once-ever: it fires on every `pi` launch and
never again within the session, it never compares against a remote release, and
it never writes into headless stdout.

## Acceptance

- EPIC-12 closes when EV-57, EV-58 and EV-59 all close: the identity resolves
  (EV-57), the line emits exactly once on start-up through the ruled vehicle
  (EV-58), and a live `pi` proves it end-to-end across every mode (EV-59).
- The epic's surface is the ruled one-shot notify — no persistent row, no
  `setHeader`, no remote "am I behind" comparison.
