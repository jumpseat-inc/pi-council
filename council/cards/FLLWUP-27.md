---
id: FLLWUP-27
title: Preflight branch-freshness clause vs mid-card record pushes
state: Backlog
owner: null
epic: EPIC-21
goal: `council/preflight.sh` accepts an autonomous runner's card branch as fresh when the branch merge-base is an ancestor of `origin/main` even though `origin/main` has advanced with record commits, and an automated test over a fixture repository asserts the check passes in that state and still fails for a genuinely stale branch.
---

## Intent

During EPIC-7's EV-28 run, the orchestrator's record commits advanced
`origin/main` after the owner's branch was cut, so `council/preflight.sh`'s
branch-freshness clause reported `FAIL: local history does not descend from
origin/main` at step 11 even though the branch was correctly based. The
merge-gate re-run works around it, but the owner-gate artifact is red at
merge time on every card after the first record push.

## Acceptance

- A fixture repo whose local `main` carries record commits ahead of a card
  branch's base, both descending from `origin/main`, passes the
  branch-freshness clause.
- A genuinely stale branch (base not an ancestor of `origin/main`) still
  fails with a `FAIL:` line.
- `bun test`, `bunx tsc --noEmit`, `python3 council/validate.py` stay green.
