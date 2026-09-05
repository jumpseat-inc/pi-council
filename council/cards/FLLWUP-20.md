---
id: FLLWUP-20
title: Judge seat guidance names the runner-pinned verification subject
state: In Review
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
Owner dispatched (job-7.1) at the card only — `goal`/`Intent`/
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

### Step 8 — owner implemented; In Review

Owner (job-7.1) settled in 1.8m. TDD: plan at
`docs/superpowers/plans/2026-09-05-FLLWUP-20-judge-when-invoked.md`,
driven payload test `"judge seat when-invoked guidance pins the
verification subject and loop frame (FLLWUP-20)"` proved RED against the
unmodified body (`bun test test/seats.test.ts -t "FLLWUP-20"` failing on
the first discriminator phrase `verification subject`), then the
`<when_invoked>` guidance extended with insertion-only prose naming the
verification subject (PR head SHA + head worktree path) and the loop
frame (step 10 judging precedes step 11's mechanical merge, facilitator
executes, no seat performs). All four gates in order at the head
worktree: `bun install --frozen-lockfile` exit 0 (215 packages),
`bunx tsc --noEmit` clean, `bun test` 551 pass / 2 skip / 0 fail
(baseline 550; FLLWUP-16/17/18/19 green, FLLWUP-20 present),
`python3 council/validate.py` clean.

Facilitator-observed: PR #34 OPEN, branch
`fllwup-20-judge-when-invoked`, head
`d7bb7084dc8e0c2ab50a6b45b589c49f57f8d799`, base `main`; diff scope
exactly the three planned files (`gh pr diff 34 --name-only`: seat body,
plan, test file); insertion-only (zero deleted content lines in the
patch; frontmatter untouched); judge `<main_repo_immutability>` block
extracted for `origin/main` vs PR head — byte-identical; runner body and
`extensions/` untouched by the PR; worktree
`.worktrees/fllwup-20-judge-when-invoked` verified at the head. Set In
Review per step 8's observed-artifact rule (branch + open PR).
