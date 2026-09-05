---
id: FLLWUP-20
title: Judge seat guidance names the runner-pinned verification subject
state: Ready
owner: null
epic: EPIC-6
goal: The judge seat body's when-invoked guidance describes the input it receives as including the verification subject and loop frame that council-runner pins in every judge dispatch input, proven by a driven payload test asserting the wording on the packaged judge seat body.
---

## Intent

Filed from FLLWUP-18's delivery (council-runner report): the judge seat's
`<when_invoked>` block says the judge is given "the card's `goal` and the
Skeptic's evidence" — accurate before FLLWUP-18, now under-descriptive.
FLLWUP-18 (merged `21a95a8`) made the runner pin two more input elements in
every judge dispatch — the verification subject (PR head SHA and head
worktree path) and the loop frame (step 10 precedes step 11's mechanical
merge, facilitator-executed) — and the FLLWUP-16 premise error happened
precisely because the judge had no input-contract wording to anchor on. A
seat body that doesn't mention the pinned elements leaves the judge with
nothing on its own face telling it the subject and frame are part of the
contract.

This card is a wording-only update to the packaged judge seat body
(`council/agents/judge.md`): the `<when_invoked>` guidance names the
verification subject and loop frame as elements of the input the judge
receives and is expected to verify against. No frontmatter change, no
behavioral addition beyond the description — the constraint itself lives in
the runner (FLLWUP-18) and the immutability block (FLLWUP-17). Asserted by
a driven payload test in `test/seats.test.ts`. Filed under EPIC-6 per the
run's standing orchestrator directive; surface is run mechanics, not the
model picker.

## Acceptance

- Driven payload test on the packaged judge seat body asserting the
  when-invoked guidance names the verification subject and the loop frame
  as received-input elements.
- FLLWUP-17's judge immutability block stays byte-intact
  (insertion-only diff); no `extensions/` change; picker surface untouched.
- Full gate set stays green (`bun test`, `bunx tsc --noEmit`,
  `python3 council/validate.py`).
