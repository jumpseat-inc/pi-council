---
id: FLLWUP-19
title: Skeptic dispatch inputs pin the verification subject and loop frame
state: Ready
owner: null
epic: EPIC-6
goal: The council-runner seat's skeptic-dispatch guidance requires every step-9 skeptic dispatch input to name the PR head SHA and the head worktree path as the verification subject and the loop frame that verification precedes step 10 judging and step 11's mechanical merge which the facilitator executes and no seat performs, proven by a driven payload test on the packaged seat body.
---

## Intent

Filed from FLLWUP-18's delivery (council-runner report): FLLWUP-18
(merged `21a95a8`) pinned the judge's verification subject in the runner's
judge-dispatch guidance. The skeptic's step-9 dispatch has the same
exposure and no structural pin — this run's skeptic inputs followed the
discipline only by the runner's own composition habit, not by any seat-body
constraint, so a runner that composes a vague skeptic input re-creates the
premise-error class FLLWUP-18 closed for the judge (wrong verification
subject → verdict about the wrong tree).

This card extends the same class to step 9: the packaged
`council-runner` seat's skeptic-dispatch guidance (`council/agents/council-runner.md`,
adjacent to the `<judge_dispatch_subject>` block) requires every step-9
skeptic input to name the PR head SHA and head worktree path as the
verification subject and the loop frame (verification precedes step 10
judging and step 11's mechanical merge, facilitator-executed, no seat
performs), asserted by a driven payload test on the packaged seat body in
`test/seats.test.ts` (FLLWUP-16/17/18 pattern). Filed under EPIC-6 per the
run's standing orchestrator directive; surface is run mechanics, not the
model picker.

## Acceptance

- Driven payload test on the packaged `council-runner` seat body asserting
  the skeptic-dispatch guidance requires the verification subject (PR head
  SHA and head worktree path) and the loop frame (step 9 verification
  precedes step 10 judging and step 11's mechanical merge,
  facilitator-executed) in every step-9 skeptic input.
- The FLLWUP-16/17/18 blocks and their tests stay byte-intact
  (insertion-only diff); no `extensions/` change; picker surface untouched.
- Full gate set stays green (`bun test`, `bunx tsc --noEmit`,
  `python3 council/validate.py`).
