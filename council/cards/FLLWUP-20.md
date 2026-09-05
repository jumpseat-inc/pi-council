---
id: FLLWUP-20
title: Judge seat guidance names the runner-pinned verification subject
state: Done
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

### Step 9 — verified (cycle 1 of 3)

Skeptic dispatched at PR #34 head `d7bb7084` (job-7.2), settled in 2.6m
— input named the exact verification subject (PR head SHA `d7bb7084` +
head worktree path `.worktrees/fllwup-20-judge-when-invoked`) and the
loop frame (step 9 verification precedes step 10 judging and step 11's
mechanical merge, facilitator-executed, no seat performs). All four
gates re-run at the head in order, green with real output: `bun install
--frozen-lockfile` 224 packages no changes; `bunx tsc --noEmit` clean;
`bun test` 551 pass / 2 skip / 0 fail; `python3 council/validate.py`
clean. Twelve falsifiable probes, all **closed-green**: P1 driven test
green (`bun test test/seats.test.ts -t "FLLWUP-20"` → 1 pass / 9
expect()); P2 full FLLWUP suite 7 pass (FLLWUP-16/17/18/19/20, 44
expect()); P3 FLLWUP-17 judge `<main_repo_immutability>` block
byte-identical to `origin/main` (sed-extracted diff: none); P4 judge
frontmatter byte-identical; P5 `council/agents/council-runner.md`
byte-identical (FLLWUP-16/18/19 blocks intact); P6 no `extensions/`
change; P7 diff scope exactly the three files; P8 zero deleted content
lines (+171/−0); P9 every asserted phrase contiguous on a single line
(lines 33, 35, 38, 39); P10 guidance explicitly forbids implying the
merge has happened or is the judge's job; P11 defeat injection —
9-line prose block stripped from a /tmp scratch copy → driven test RED
(`expect(received).toContain("verification subject")`), head body
GREEN; P12 gate set green in order.
**Verdict: NO-BLOCK, 12/12 closed-green, no open objection.** Verify
cycles used: 1 of ≤3.

### Step 10 — judge PASS

Judge dispatched (job-7.3) with the card's `goal` and the Skeptic's
step-9 evidence only, settled in 0.3m. Subject pinned per the FLLWUP-18
constraint: the input named the exact verification subject (PR head SHA
`d7bb7084` and the head worktree path
`.worktrees/fllwup-20-judge-when-invoked`) and the loop frame (step 10
judging precedes step 11's mechanical merge, facilitator-executed, no
seat performs; the merge is not a PASS precondition). Verdict **PASS**:
independently re-verified at the head — driven test green (`bun test
test/seats.test.ts --test-name-pattern="FLLWUP-20"` → 1 pass / 9
expect()), the `<when_invoked>` guidance at line 28 names the
verification subject and loop frame as runner-pinned input elements,
council-runner.md/owner.md byte-identical to `origin/main`, diff scope
exactly the three files (+171/−0). No goal-text fix needed; no premise
error. Verify cycles used: 1 of ≤3.

### Step 11 — deterministic merge check (features-deliver substitution)

All five criteria met, read fresh against PR head
`d7bb7084dc8e0c2ab50a6b45b589c49f57f8d799`: (1) owner gates green in
full (owner job-7.1 ran all four gates in the head worktree; skeptic
job-7.2 re-ran them at the head: `bun install --frozen-lockfile` 224
packages no changes, `bunx tsc --noEmit` clean, `bun test` 551/2/0,
`python3 council/validate.py` clean); (2) `gates` workflow SUCCESS on
the PR head SHA — `gh pr checks 34 --json name,state,workflow` →
`[{"name":"gates","state":"SUCCESS","workflow":"gates"}]` asserted
on the `workflow` field per the substitution; (3) no blocking Skeptic
objection (NO-BLOCK, 12/12 closed-green); (4) judge PASS (job-7.3);
(5) no Needs Human / outstanding ruling (card In Review, zero
escalations). Merged `gh pr merge 34 --squash --match-head-commit
d7bb7084…` → PR #34 **MERGED** (mergedAt 2026-09-05T10:11:12Z), squash
commit `48f60cc4c1117f36e911ce3ec564dfd773c0dd60` on `main`.

### Step 12 — Done

`gates` workflow on the merged SHA `48f60cc4` (run 33959968323,
observed via `gh run list --commit 48f60cc4…`, workflowName gates)
completed success. Board and card set Done; `validate.py` clean;
reconciliation below (fetch, merge `origin/main` adopting the squash
`48f60cc4` while keeping this card's record commits
54d1048/7e7c73d/62c65ef/0c1068e — the squash touches only the judge
body, the plan, and `test/seats.test.ts`, no `council/` record overlap),
committed and pushed.
