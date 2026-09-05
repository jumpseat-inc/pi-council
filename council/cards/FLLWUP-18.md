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

### Step 9 — verified (cycle 1 of 3)
Skeptic dispatched at PR #32 head `6f2d60e` (job-5.2), settled in 2.9m.
All four gates re-run at the head in order, green with real output: `bun
install --frozen-lockfile` exit 0 ("no changes"); `bunx tsc --noEmit`
clean; `bun test` 549 pass / 2 skip / 0 fail; `python3 council/validate.py`
clean. Eight falsifiable probes, **all closed-green**: P1 driven test
green (`bun test test/seats.test.ts -t "FLLWUP-18"` → 1 pass / 6
expect()s, all six phrases); P2 gate integrity — defeat injection (block
removed in a scratch copy → test RED naming the first missing phrase,
restore → GREEN); P3 block names the subject (PR head SHA + head worktree
path) and the loop frame (step 10 precedes step 11's mechanical merge,
facilitator executes, no seat performs) and forbids implying the merge
happened or is the judge's job; P4 diff insertion-only (zero `-` lines) —
FLLWUP-16/17 test bodies and the `<dispatch_discipline>`/
`<main_repo_immutability>` blocks byte-identical to `origin/main`
(FLLWUP-16/17 tests 4/4, 20 expects); P5 diff scope exactly the three
files; P6 frontmatter byte-identical to `origin/main`; P7 placement —
`<judge_dispatch_subject>` at line 270, immediately after
`</main_repo_immutability>` (268) and before `<return_contract>` (283);
P8 six phrases contiguous verbatim in the body (closed by P1).
**Verdict: NO-BLOCK, 8/8 closed-green, no open objection.** Verify cycles
used: 1 of ≤3.

### Step 10 — judge PASS
Judge dispatched with the card's `goal` and the Skeptic's step-9 evidence
only (job-5.3), settled in 0.3m. This dispatch was the first live
demonstration of the guidance this card ships: the input named the
exact verification subject (PR head SHA `6f2d60e` and the head worktree
path `.worktrees/fllwup-18-judge-dispatch-inputs`) and the loop frame
(step 10 judging precedes step 11's mechanical merge, facilitator-
executed, no seat performs; the merge is not a PASS precondition).
Verdict **PASS**: re-ran the decisive tests at the head worktree — `bun
test test/seats.test.ts -t "FLLWUP-18"` → 1 pass / 6 expect()s; the
`<judge_dispatch_subject>` block (lines 270–281 of
`council/agents/council-runner.md`) names the PR head SHA + head worktree
path as the subject, states step 10 judging precedes step 11's mechanical
merge which the facilitator executes and no seat performs, and forbids
implying the merge has happened or that requiring it is the judge's job.
No goal-text fix needed; no premise error. No verify cycle consumed
(verify cycles used: 1 of ≤3).

### Step 11 — deterministic merge check (features-deliver substitution)
All five criteria met, read fresh against PR head
`6f2d60ef08c11b2ba0a0ee9244661094cb5ad5ac`: (1) owner gates green in
full (owner job-5.1 ran all four gates in the head worktree; Skeptic
job-5.2 re-ran them at the head: frozen-lockfile install exit 0, `bunx
tsc --noEmit` clean, `bun test` 549/2/0, `python3 council/validate.py`
clean); (2) `gates` workflow SUCCESS on the PR head SHA — `gh pr checks
32 --json name,state,workflow` →
`[{"name":"gates","state":"SUCCESS","workflow":"gates"}]` asserted on
the `workflow` field per the substitution, run 33958850849 completed
success at headSha 6f2d60e (exact PR head, verified via `gh run list
--branch fllwup-18-judge-dispatch-inputs`); (3) no blocking Skeptic
objection (NO-BLOCK, 8/8 closed-green); (4) judge PASS (job-5.3); (5) no
Needs Human / outstanding ruling (card In Review, zero escalations).
Merged `gh pr merge 32 --squash --match-head-commit
6f2d60e…` → PR #32 **MERGED** (mergedAt 2026-09-05T09:50:02Z), squash
commit `21a95a8617f910eaf7a3d937fd045eec6696a719` on `main`. `gates`
workflow re-ran on the merged SHA — run 33959042296 (observed via `gh run
list --commit 21a95a8…`). Local `main` reconciled by clean ort merge
adopting the squash (`2c5530f`) while keeping this card's record commits
(1cd5fcd, 7e5eff4, 6834892, ff5a3f1) — the squash touches only the seat
body, the plan, and `test/seats.test.ts`, no `council/` record overlap;
merge exit 0, conflict-marker sweep empty (the one `<<<<<<<` grep hit is
pre-existing record text in `council/cards/FLLWUP-9.md`), `python3
council/validate.py` clean after the merge.
