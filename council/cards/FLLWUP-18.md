---
id: FLLWUP-18
title: Judge dispatch inputs pin the verification subject and loop frame
state: In Review
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

## Execution

### Step 1 gate — mechanical, not surface-touching

Mechanical: narrowly-scoped, unambiguous, confined to one area — the
packaged `council-runner` seat body (`council/agents/council-runner.md`)
gains judge-dispatch guidance in a new block adjacent to the existing
`<dispatch_discipline>` / `<main_repo_immutability>` blocks, plus a driven
payload test in `test/seats.test.ts`. Every element of the guidance is
fixed by the orchestrator's binding constraints: every judge dispatch
input the runner composes must name the verification subject (the PR head
SHA and the head worktree path) and the loop frame (step 10 judging
precedes step 11's mechanical merge, which the facilitator executes and
no seat performs). No spec ambiguity, no design tradeoff, no cross-seam
reach (`extensions/` untouched by binding). Not surface-touching: seat
bodies are agent guidance — nothing a person sees, reads, or does
changes; no user-visible copy, empty state, or error state. Mechanical
path skips steps 2–6 and proceeds to step 7 with the card itself as the
owner handoff (no spec file under `docs/superpowers/specs/`).

### Step 7 — In Progress, handed to owner
Card set In Progress on frontmatter and board; `validate.py` clean (below).
Owner dispatched (job-5.1) at the card only — `goal`/`Intent`/`Acceptance`
verbatim plus the orchestrator's binding constraints (no frontmatter
change; the FLLWUP-16 and FLLWUP-17 payload tests and seat-body blocks
stay byte-intact; no `extensions/` change; picker surface untouched;
guidance adjacent to the `<dispatch_discipline>`/`<main_repo_immutability>`
blocks in the same voice), this repo's gate set (`.github/workflows/
gates.yml` is the authoritative record — this repo has no
`docs/gates/GATE-EVIDENCE.md`), the worktree-only binding (never `git
checkout`/`switch`/`reset` in the main repo path; worktree inside the
repo's `.worktrees/`), base-on-`origin/main` (the local `main` carries
the runner's council record commits that must not appear in the PR diff),
and branch/PR conventions named.

### Step 8 — In Review (owner implemented, PR #32 open)
Owner dispatched (job-5.1) at the card, settled in 1.6m. Delivery per its
report and confirmed observed artifacts: plan
`docs/superpowers/plans/2026-09-06-FLLWUP-18-judge-dispatch-inputs.md`
(committed ca1cd4b, first); the `<judge_dispatch_subject>` block inserted
in `council/agents/council-runner.md` between `</main_repo_immutability>`
and `<return_contract>` — every judge dispatch input the runner composes
must name the verification subject (PR head SHA + head worktree path; the
judge evaluates the deliverables at the branch head, never the local
`main` checkout, where pre-merge deliverables are absent by
construction) and the loop frame (step 10 judging precedes step 11's
mechanical merge, which the facilitator executes and no seat performs; a
judge input must never imply the merge has happened or that requiring it
is the judge's job) — body text only, frontmatter untouched, in the same
voice as the adjacent `<dispatch_discipline>`/`<main_repo_immutability>`
blocks; driven payload test
`council-runner judge-dispatch guidance pins the verification subject and
loop frame (FLLWUP-18)` inserted after the FLLWUP-16 test asserting six
phrases verbatim on `loadSeat(tmpRepo(), "council-runner").body` (`PR
head SHA`, `head worktree path`, `step 10 judging precedes step 11`,
`mechanical merge`, `facilitator executes`, `no seat performs`). RED→GREEN
proven by the owner: RED against the unmodified seat body on `PR head
SHA`, and the assertion caught a second real defect — a line-wrap
splitting `head worktree path` in the first prose draft — fixed in the
block, never the test, then GREEN (FLLWUP filter 5 pass / 0 fail; full
seats file 37 pass / 0 fail). No `extensions/` change; no model-picker
surface. Owner gates green in order in the worktree
(`.worktrees/fllwup-18-judge-dispatch-inputs` at head): `bun install
--frozen-lockfile` exit 0; `bunx tsc --noEmit` clean; `bun test` 549
pass / 2 skip / 0 fail; `python3 council/validate.py` clean.
Facilitator-observed: PR #32 OPEN, branch
`fllwup-18-judge-dispatch-inputs`, head
`6f2d60ef08c11b2ba0a0ee9244661094cb5ad5ac`, base `main`; diff scope
exactly the three planned files (`gh pr diff 32 --name-only`); seat-body
and test-file diffs insertion-only (no `-` lines — FLLWUP-16/17 tests
byte-intact, `<dispatch_discipline>`/`<main_repo_immutability>` blocks
untouched); frontmatter identical to `main`; worktree verified at the
head. Set In Review per step 8's observed-artifact rule (branch + open PR).
