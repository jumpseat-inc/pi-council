---
id: FLLWUP-17
title: Main-repo immutability constraint in the working seats' own guidance
state: Ready
owner: null
epic: EPIC-6
goal: The owner, skeptic, and judge seat bodies each carry the main-repo immutability constraint — git checkout, git switch, and git reset forbidden against the main repository path with branch state changes happening only in a dedicated worktree — proven by a driven payload test per seat asserting the constraint phrases on the packaged seat bodies.
---

## Intent

Filed from FLLWUP-16's delivery (council-runner report): FLLWUP-16
(merged `68e728d`) hardened the **runner's** side — the packaged
`council-runner` seat now carries the `<main_repo_immutability>` block and
must forward the constraint in every dispatch input it composes. But the
incident that motivated the hardening was a **working seat** violating the
main repo directly (FLLWUP-13 step 9, `git checkout <sha>` inside the main
repo, board/card faces reverted, reflog recovery). A constraint that lives
only in the runner's forward is lost the moment a forward is — the seat's
own guidance is the layer that survives every composition path.

This card puts the same block in the three working seats that actually run
git — `owner`, `skeptic`, `judge` — as payload on the packaged seat bodies
(`council/agents/owner.md`, `skeptic.md`, `judge.md`), asserted per seat by
driven payload tests in `test/seats.test.ts` (same pattern as the
FLLWUP-16 runner-body test). Belt and suspenders, matching the run's own
contamination lessons. Filed under EPIC-6 per the run's standing
orchestrator directive; surface is run mechanics, not the model picker.

## Acceptance

- Driven payload test per seat (owner, skeptic, judge) asserting the
  constraint phrases on the packaged seat body — naming `git checkout`,
  `git switch`, and `git reset` as forbidden against the main repository
  path and a dedicated worktree as the required mechanism.
- The existing FLLWUP-16 runner-body test stays green; no `extensions/`
  change; the picker surface is untouched.
- Full gate set stays green (`bun test`, `bunx tsc --noEmit`,
  `python3 council/validate.py`).
