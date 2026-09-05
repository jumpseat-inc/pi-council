---
id: FLLWUP-19
title: Skeptic dispatch inputs pin the verification subject and loop frame
state: In Progress
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

## Execution

### Step 1 gate — mechanical, not surface-touching

Mechanical: narrowly-scoped, unambiguous, confined to one area — the
packaged `council-runner` seat body (`council/agents/council-runner.md`)
gains skeptic-dispatch guidance in a new block adjacent to the
`<judge_dispatch_subject>` block FLLWUP-18 shipped, plus a driven payload
test in `test/seats.test.ts`. Every element of the guidance is fixed by
the orchestrator's binding constraints: every step-9 skeptic dispatch
input the runner composes must name the verification subject (the PR head
SHA and the head worktree path) and the loop frame (step 9 verification
precedes step 10 judging and step 11's mechanical merge, which the
facilitator executes and no seat performs). No spec ambiguity, no design
tradeoff, no cross-seam reach (`extensions/` untouched by binding). Not
surface-touching: seat bodies are agent guidance — nothing a person
sees, reads, or does changes; no user-visible copy, empty state, or error
state; picker surface explicitly untouched. Mechanical path skips steps
2–6 and proceeds to step 7 with the card itself as the owner handoff (no
spec file under `docs/superpowers/specs/`).

### Step 7 — In Progress, handed to owner
Card set In Progress on frontmatter and board; `validate.py` clean.
Owner dispatched (job-1.1) at the card only — `goal`/`Intent`/
`Acceptance` verbatim plus the orchestrator's binding constraints (no
frontmatter change; the FLLWUP-16 `<main_repo_immutability>` block, the
FLLWUP-17 working-seat blocks, and the FLLWUP-18 `<judge_dispatch_subject>`
block stay byte-identical to `origin/main` — insertion-only diff; no
`extensions/` change; picker surface untouched; guidance adjacent to the
`<judge_dispatch_subject>` block in the same voice) and this repo's gate
set (`.github/workflows/gates.yml` is the authoritative record — this
repo has no dataset-import or server-boot gate, so the owner's full gate
set is `bun install --frozen-lockfile`, `bunx tsc --noEmit`, `bun test`,
`python3 council/validate.py`, all in order, in full).
