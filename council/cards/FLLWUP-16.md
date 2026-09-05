---
id: FLLWUP-16
title: Seat dispatch inputs forbid main-repo branch-state mutation
state: Ready
owner: null
epic: EPIC-6
goal: Working seats dispatched by council-runner receive dispatch inputs that forbid git checkout, git switch, and git reset against the main repository path and require any branch state change to happen in a dedicated worktree, proven by a driven test asserting the constraint is present in the packaged council-runner seat's dispatch discipline plus a documented reflog recovery drill executable against a simulated board reversion.
---

## Intent

Filed from this run's own incidents (council-runner report, FLLWUP-13
delivery): twice in this run, board/card record state was lost to
branch-state tampering from inside seat or container runs. The BUG-1
container died with zeroed worktree admin metadata (`.git/config` wiped,
worktree HEAD/ORIG_HEAD/index zeroed), and during FLLWUP-13's step 9 a seat
ran `git checkout <sha>` inside the **main repo**, moving main's HEAD off
the runner's record commits and reverting the board and card faces to a
pre-run state — recovered from reflog, no verdict invalidated, but the
single-writer board discipline was violated by construction.

The council-runner's `<board_discipline>` makes the runner the single
writer of `council/board.md` and the card file, but nothing in the dispatch
inputs the runner composes for its working seats forbids a seat from
mutating the main repository's branch state directly. This card hardens the
dispatch guidance so every working seat is told, in its input, that the
main repo path's branch state is immutable to it — any checkout, switch, or
reset happens in a dedicated worktree — and pins the constraint with a
driven payload test plus a documented recovery drill, so the next
disruption is a bounded recover instead of a rediscovery.

Filed under EPIC-6 per the run's standing orchestrator directive
(run-filed follow-ups carry `epic: EPIC-6` and complete within the run),
though the surface is run mechanics rather than the model picker.

## Acceptance

- Driven test asserting the packaged `council-runner` seat's dispatch
  guidance contains the main-repo immutability constraint — naming
  `git checkout`, `git switch`, and `git reset` as forbidden against the
  main repository path and a dedicated worktree as the required mechanism
  for any branch state change.
- A documented reflog recovery drill (detect board/card reversion, restore
  main from reflog, verify `validate.py` clean) recorded on the card's run
  record, executable by a runner that hits the failure class.
- Full gate set stays green (`bun test`, `bunx tsc --noEmit`,
  `python3 council/validate.py`).
