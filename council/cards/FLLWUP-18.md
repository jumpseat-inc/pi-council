---
id: FLLWUP-18
title: Judge dispatch inputs pin the verification subject and loop frame
state: Ready
owner: null
epic: EPIC-6
goal: The council-runner seat's judge-dispatch guidance requires every judge dispatch input to name the exact verification subject — the PR head SHA and the head worktree path — and the loop frame that step 10 judging precedes step 11's mechanical merge which the facilitator executes and no seat performs, proven by a driven payload test on the packaged seat body.
---

## Intent

Filed from FLLWUP-16's delivery (council-runner report): this run's
job-3.3 judge dispatch was REJECTed on a premise error — the judge
evaluated the local `main` checkout (where the deliverable is absent by
construction pre-merge) and read the goal verb "receive" as requiring the
merge, costing a full re-dispatch on a corrected factual record. The
verdict pipeline held (no coaching, no goal change), but the wasted
dispatch class is structural — the judge's input does not pin **what** to
verify or **where in the loop frame** the verification sits.

This card hardens the packaged `council-runner` seat's judge-dispatch
guidance (`council/agents/council-runner.md`, adjacent to the
`<dispatch_discipline>` and `<main_repo_immutability>` blocks FLLWUP-16
shipped) so every judge input the runner composes names the exact subject
(PR head SHA + head worktree path) and the loop frame (step 10 precedes
step 11's mechanical merge, executed by the facilitator, never a seat),
asserted by a driven payload test on the packaged seat body. Filed under
EPIC-6 per the run's standing orchestrator directive; surface is run
mechanics, not the model picker.

## Acceptance

- Driven payload test on the packaged `council-runner` seat body asserting
  the judge-dispatch guidance requires the verification subject (PR head
  SHA and head worktree path) and the loop frame (step 10 judging precedes
  step 11's mechanical merge, facilitator-executed) in every judge input.
- The FLLWUP-16 blocks on the same seat stay byte-intact; no
  `extensions/` change; the picker surface is untouched.
- Full gate set stays green (`bun test`, `bunx tsc --noEmit`,
  `python3 council/validate.py`).
