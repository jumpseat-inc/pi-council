---
id: FLLWUP-19
title: Skeptic dispatch inputs pin the verification subject and loop frame
state: Done
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

### Step 8 — owner implemented; In Review
Owner (job-6.1) settled in 2.2m. TDD: plan at
`docs/superpowers/plans/2026-09-05-FLLWUP-19-skeptic-dispatch-inputs.md`,
driven payload test proved RED against the unmodified body (`bun test
test/seats.test.ts -t "FLLWUP-19"` failing on the skeptic-specific
phrases), then the `<skeptic_dispatch_subject>` block inserted immediately
after `</judge_dispatch_subject>` in the same voice. All four gates in
order at the head worktree: `bun install --frozen-lockfile` exit 0
("no changes"), `bunx tsc --noEmit` clean, `bun test` 550 pass / 2
skip / 0 fail (baseline 549; FLLWUP-16/17/18 green, FLLWUP-19 present),
`python3 council/validate.py` clean.

Facilitator-observed: PR #33 OPEN, branch
`fllwup-19-skeptic-dispatch-inputs`, head
`ce8bb1ce2ef5598dea1391cd9749a2d420a04dde`, base `main`; diff scope
exactly the three planned files (`gh pr diff 33 --name-only`: seat body,
plan, test file); insertion-only (zero `-` lines in the diff;
frontmatter untouched); worktree `.worktrees/
fllwup-19-skeptic-dispatch-inputs` verified at the head. Set In Review
per step 8's observed-artifact rule (branch + open PR).

### Step 9 — verified (cycle 1 of 3)
Skeptic dispatched at PR #33 head `ce8bb1c` (job-6.2), settled in 3.0m
— first live demonstration of the guidance this card ships: the input
named the exact verification subject (PR head SHA `ce8bb1c` + head
worktree path `.worktrees/fllwup-19-skeptic-dispatch-inputs`) and the
loop frame (step 9 verification precedes step 10 judging and step 11's
mechanical merge, facilitator-executed, no seat performs). All four
gates re-run at the head in order, green with real output: `bun install
--frozen-lockfile` no changes; `bunx tsc --noEmit` clean; `bun test`
550 pass / 2 skip / 0 fail (2553 expects); `python3 council/validate.py`
clean. Nine falsifiable probes, all **closed-green**: P1 driven test
green; P2 defeat injection (block removed in a scratch copy → test RED
naming `step 9 verification precedes step 10 judging`, restore → GREEN);
P3 block names the verification subject (PR head SHA + head worktree
path) and the loop frame (step 9 verification precedes step 10 judging
and step 11's mechanical merge, facilitator-executed, no seat performs)
and forbids implying the merge happened or is the skeptic's job; P4 diff
insertion-only (zero `-` lines) — FLLWUP-16/17/18 blocks and tests
byte-identical to `origin/main`; P5 diff scope exactly the three files;
P6 frontmatter byte-identical to `origin/main`; P7 placement —
`<skeptic_dispatch_subject>` at line 283, immediately after
`</judge_dispatch_subject>` (281) and before `<return_contract>` (297);
P8 no `extensions/` change; P9 picker surface untouched.
**Verdict: NO-BLOCK, 9/9 closed-green, no open objection.** Verify
cycles used: 1 of ≤3.

### Step 10 — judge PASS
Judge dispatched (job-6.3) with the card's `goal` and the Skeptic's
step-9 evidence only, settled in 2.0m. Subject pinned per the FLLWUP-18
constraint: the input named the exact verification subject (PR head SHA
`ce8bb1c` and the head worktree path
`.worktrees/fllwup-19-skeptic-dispatch-inputs`) and the loop frame (step
10 judging precedes step 11's mechanical merge, facilitator-executed, no
seat performs; the merge is not a PASS precondition). Verdict **PASS**:
independently re-verified at the head — driven test green (`bun test
test/seats.test.ts --test-name-pattern="FLLWUP-19"` → 1 pass / 9
expect()); defeat injection RED on block removal; all goal phrases in
the body; insertion-only diff (3 files, 171 insertions, 0 deletions),
lines 1–282 and 297–329 of the seat body byte-identical to
`origin/main`; frontmatter identical; no `extensions/` change; gates
green (550/2/0). No goal-text fix needed; no premise error. Verify
cycles used: 1 of ≤3.

### Step 11 — deterministic merge check (features-deliver substitution)
All five criteria met, read fresh against PR head
`ce8bb1ce2ef5598dea1391cd9749a2d420a04dde`: (1) owner gates green in
full (owner job-6.1 ran all four gates in the head worktree; skeptic
job-6.2 re-ran them at the head: `bun install --frozen-lockfile` no
changes, `bunx tsc --noEmit` clean, `bun test` 550/2/0,
`python3 council/validate.py` clean); (2) `gates` workflow SUCCESS on
the PR head SHA — `gh pr checks 33 --json name,state,workflow` →
`[{"name":"gates","state":"SUCCESS","workflow":"gates"}]` asserted
on the `workflow` field per the substitution, run 33959320794
completed success at headSha ce8bb1c (exact PR head, verified via `gh
run list --branch fllwup-19-skeptic-dispatch-inputs`); (3) no blocking
Skeptic objection (NO-BLOCK, 9/9 closed-green); (4) judge PASS
(job-6.3); (5) no Needs Human / outstanding ruling (card In Review,
zero escalations). Merged `gh pr merge 33 --squash --match-head-commit
ce8bb1c…` → PR #33 **MERGED** (mergedAt 2026-09-05T10:02:28Z), squash
commit `e3d3c88e2ad7ed7c87b5da1fd977ceef21dc7b90` on `main`.

### Step 12 — Done
`gates` workflow on the merged SHA `e3d3c88` (run 33959581886,
observed via `gh run list --commit e3d3c88…`, workflowName gates)
completed success. Board and card set Done; `validate.py` clean;
reconciliation below (fetch, merge `origin/main` adopting the squash `e3d3c88`
while keeping this card's record commits d5f20b0/0a7af1c/51ffdc0/883e32f
and the FLLWUP-19/20 filing commit 1d3af46 — the squash touches only the
seat body, the plan, and `test/seats.test.ts`, no `council/` record
overlap), committed and pushed.
