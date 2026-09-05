---
id: FLLWUP-20
title: Judge seat guidance names the runner-pinned verification subject
state: In Progress
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

## Execution

### Step 1 gate — mechanical, not surface-touching

Mechanical: narrowly-scoped, unambiguous, confined to one area — the
packaged judge seat body (`council/agents/judge.md`) `<when_invoked>`
guidance gains the verification subject and loop frame as received-input
elements, plus a driven payload test in `test/seats.test.ts`. Every
element is fixed by the orchestrator's binding constraints: no
frontmatter change; FLLWUP-17's judge immutability block stays
byte-intact (insertion-only diff); FLLWUP-16/18/19 blocks and tests stay
byte-intact; no `extensions/` change; picker surface untouched; the
change is descriptive — the constraint lives in the runner's guidance
(FLLWUP-18) and no enforcement machinery is duplicated into the judge
body. No spec ambiguity, no design tradeoff, no cross-seam reach.
Not surface-touching: seat bodies are agent guidance — nothing a person
sees, reads, or does changes; no user-visible copy, empty state, or error
state; picker surface explicitly untouched. Mechanical path skips steps
2–6 and proceeds to step 7 with the card itself as the owner handoff (no
spec file under `docs/superpowers/specs/`).

### Step 7 — In Progress, handed to owner

Card set In Progress on frontmatter and board; `validate.py` clean.
Owner dispatched (job-8.1) at the card only — `goal`/`Intent`/
`Acceptance` verbatim plus the orchestrator's binding constraints (no
frontmatter change; FLLWUP-17's judge `<main_repo_immutability>` block
stays byte-identical to `origin/main` — insertion-only diff; the
FLLWUP-16/18/19 blocks and tests stay byte-intact; no `extensions/`
change; picker surface untouched; descriptive change only — the
constraint itself lives in the runner's guidance, not duplicated as
enforcement machinery in the judge body) and this repo's gate set
(`.github/workflows/gates.yml` is the authoritative record — this repo
has no dataset-import or server-boot gate, so the owner's full gate set
is `bun install --frozen-lockfile`, `bunx tsc --noEmit`, `bun test`,
`python3 council/validate.py`, all in order, in full).
