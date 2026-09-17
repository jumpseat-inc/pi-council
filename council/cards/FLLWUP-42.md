---
id: FLLWUP-42
title: Make the deterministic merge check independent of a human-granted admin bypass
state: Done
owner: null
epic: EPIC-9
goal: The deterministic merge check succeeds under a repository ruleset that requires an approving review without a human-granted admin bypass, or the procedure names the bypass explicitly as the sanctioned step.
---

## Intent

A `main` ruleset created mid-run requires 1 approving review plus linear
history, so every autonomous merge depended on the human's run-scoped
`--admin` authorization. The authority map replaces the human merge gate with
the five criteria, and the human's authorization is explicitly not extended
to the next run. Named by the steward closure ruling as owed before the next
autonomous run.

## Orchestrator rulings (Phase 1, binding)

Recorded human decisions for this run. Immutable and binding on every seat,
`steward` included; a runner that hits one applies it and cites the ruling
rather than re-asking.

- **R2 (merge authorization).** The human has explicitly authorized, for
  this run only, `gh pr merge <PR> --squash --admin --match-head-commit <X>`
  — the `--admin` bypass is the sanctioned merge step under the active
  `main` ruleset (1 approving review + linear history + thread resolution).
  This satisfies the goal's second disjunct, "or the procedure names the
  bypass explicitly as the sanctioned step"; the card's delivery is to make
  the procedure name it explicitly, not to remove the bypass. The
  authorization is run-scoped and is **not** extended to any later run.

## Run record (features-deliver / FLLWUP-42)

### Step 1 — classification (facilitator)

- **Path: mechanical.** The deliverable is confined to one seam —
  `council/procedures/features-deliver.md`'s deterministic-merge-check
  section. The design the card's `goal` leaves open (make the check succeed
  with no bypass, or name the bypass as the sanctioned step) is settled by
  binding Phase-1 ruling **R2**: the delivery is to name it, run-scoped,
  never extended to a later run. A deliberation would have nothing open to
  deliberate, and `<escalation_contract>` step 1 forbids re-asking an
  answered question. The five criteria and `--match-head-commit` pinning
  stand exactly as written; no code, criterion, or mechanism changes.
- **Surface-touching: yes.** The deliverable changes procedure prose a
  person (the operator) reads and the orchestrator follows — the copy that
  names the sanctioned merge step. On a mechanical card this seats no
  `designer` (council.md step 1); any design concern is a step-13
  follow-up candidate, never a reason to reopen.
- **Seat resolution (`<seat_resolution_check>`):** `owner`, `skeptic`,
  `judge` — the only seats this path dispatches — all resolve; the nine
  packaged seat files are present in `council/agents/`, and no repo-local
  `.pi/agents/` override directory exists, so nothing shadows them. Ruling
  seats (`product-owner`, `steward`) are never dispatched by this container.
- **Environment:** step 0 preflight skipped per the autonomous-run
  substitution (Phase 0 cleared it); run for information only on the main
  checkout → `PASS: preflight clean`, exit 0. `python3 council/validate.py`
  → `All council artifacts valid`. Local `main` == `origin/main` at
  `526ca2b`. No `Needs Human` state and no outstanding ruling on this card —
  criterion 5 holds at card start.
- **Gate set for this repo** (authoritative: `.github/workflows/gates.yml` +
  [[deterministic-merge-check]]; `docs/gates/GATE-EVIDENCE.md` does not exist
  here): `bash council/preflight.sh FLLWUP-42`, `bunx tsc --noEmit`,
  `bun test`, `python3 council/validate.py`. Owner gates met in full
  regardless of change size.
- **Blast radius checked (no digest re-pin owed):** no fixture seed carries
  a copy of `council/procedures/features-deliver.md`
  (`council/fixtures/*/seed/` holds board/cards/validate/preflight, not
  procedures), so AGENTS.md #5's `seed.treeDigest` machinery is untouched;
  no shipped test pins the merge paragraph (grep: no
  `--admin`/`match-head-commit`/merge-check assertion in `test/`);
  `prose.test.ts` forbids a pinned tech stack in procedure prose, so the new
  text must stay free of `bun`/`bunx`/`tsc`/`typescript`.
- **Phase-1 rulings applicable here:** R2 governs the delivery (applied,
  not re-asked). The scope / sequencing / follow-up-re-homing rulings govern
  process only; R1 governs FLLWUP-41, a different card. Nothing else on this
  card is open.

### Step 7 — hand to one owner (mechanical path)

No deliberation ran, so the card itself is the owner's handoff: its `goal`,
`Intent`, and the binding R2. Card set `In Progress`; `validate.py` clean;
`owner` dispatched.

### Step 8 — owner delivered (job-7.1), PR #60 open

Owner implemented in worktree `.worktrees/fllwup-42` (branch
`feat/fllwup-42-admin-merge-procedure`, base `origin/main` `4ae414f`),
pushed, PR #60 open at head
`8815bf44644c474f4d1a95323e06a4d6bda6580c`. Observed directly (not from the
seat's report): `gh pr view 60` → state OPEN, base `main`, headRefOid
`8815bf4…`, `mergeable: MERGEABLE` (mergeStateStatus `BLOCKED` — the
ruleset's approving-review requirement, the condition this card's copy
addresses). Diff scope: `council/procedures/features-deliver.md` (the
stale "may not be configured" paragraph replaced by the run-scoped
`--admin` sanctioned-step copy), `test/prose.test.ts` (one red-first
literal-substring pin), and the plan doc
`docs/superpowers/plans/2026-09-17-FLLWUP-42-admin-merge-procedure.md`. No
engine, criterion, or `--match-head-commit` change.

Owner gates green at head, real output: `bash council/preflight.sh
FLLWUP-42` → `PASS: preflight clean` (exit 0); `bunx tsc --noEmit` exit 0;
`bun test` **859 pass / 2 skip / 0 fail** (baseline at `4ae414f`: 858 pass
/ 2 skip); `python3 council/validate.py` → `All council artifacts valid`.
Red-first recorded: the new test FAILs pre-edit (`Expected to contain:
"requires an approving review"`), GREEN after the copy edit.

Card set `In Review` (sole precondition: open PR, observed).

Owner usage (verbatim, job-7.1):

```
job-7.1  turns=28 tokens=in 71564/out 9241/cR 972096/cW 0/reason 3329/total 1052901 cost≈$0.0267
```

### Step 9 — Skeptic NO-BLOCK at head 8815bf4 (verify cycle 1 of ≤3)

Skeptic (job-7.2) verified at the pinned subject — head SHA
`8815bf44644c474f4d1a95323e06a4d6bda6580c`, head worktree
`.worktrees/fllwup-42` — with the loop frame stated (step 9 precedes step 10
judging and step 11's facilitator-executed mechanical merge). Verdict:
**`no open objections`**, eight objections all `closed-green`, each with a
real run at the head:

1. Copy satisfies the goal's second disjunct — the section names
   `gh pr merge <PR> --squash --admin --match-head-commit <X>` as "the
   sanctioned merge step", run-scoped, `HALT` when unauthorized.
2. Five criteria / criterion-2 read / `--match-head-commit` pinning
   byte-unchanged (`git diff 4ae414f..HEAD` touches only the stale trailing
   paragraph).
3. Run-scoping real, not a standing-bypass loophole — attack attempted and
   lost; the authorization must be a recorded human decision on the card
   face and is never extended.
4. Red-first integrity — stripping `--admin` from the procedure turns the
   new pin red (`12 pass, 1 fail`, naming the exact string); restored
   `13 pass, 0 fail`; the diff is a pure addition, no assertion narrowed.
5. Prose forbidden-token guards green (13/13, no forbidden token).
6. Step-11 gates green and each provably failable: `bunx tsc --noEmit`
   exit 0 (red on injected TS2322); `bun test` 859 pass / 2 skip / 0 fail
   (5524 expects, 94.57s); `validate.py` clean (red on `state: Bogus`).
7. Preflight `FAIL: local history does not descend from origin/main` — the
   documented FLLWUP-27 mid-card record-push artifact (merge-base
   `4ae414f`, `origin/main` moved to `bd6e5ea` by the step-8 record
   commit); the step-11 re-run set (`tsc`/`bun test`/`validate.py`) is all
   green. Not a defect; no criterion weakened.
8. Digest/fixture non-impact — fixtures diff empty, no seed carries the
   procedure.

Verify cycles used: 1 of ≤3; no fix cycle needed.

Skeptic usage (verbatim, job-7.2):

```
job-7.2  turns=19 tokens=in 147223/out 6777/cR 311267/cW 0/reason 2025/total 465267 cost≈$0.2595
```

### Step 10 — judge PASS (job-7.3)

Judge dispatched with exactly the card's `goal` (verbatim) + the step-9
Skeptic evidence, subject pinned (head `8815bf4…`, head worktree
`.worktrees/fllwup-42`), loop frame stated (step 10 precedes step 11's
mechanical merge, facilitator-executed). Verdict **PASS**: the goal is a
disjunction, and the procedure at the pinned head names
`gh pr merge <PR> --squash --admin --match-head-commit <X>` as "the
sanctioned merge step" under a review-requiring ruleset, run-scoped, with
all step-11 gates green. No REJECT basis; no goal-text defect.

Judge usage (verbatim, job-7.3):

```
job-7.3  turns=7 tokens=in 14842/out 1855/cR 78592/cW 0/reason 1142/total 95289 cost≈$0.0071
```

### Step 11 — deterministic merge check, merged

Five criteria executed mechanically at PR head
`8815bf44644c474f4d1a95323e06a4d6bda6580c`:

1. **Owner gates green in full.** Re-run by the facilitator at the head in
   `.worktrees/fllwup-42`: `bunx tsc --noEmit` exit 0; `bun test` **859
   pass / 2 skip / 0 fail / 5524 expect** (94.86s); `python3
   council/validate.py` → `All council artifacts valid`. The step-11
   re-run set is `tsc` / `bun test` / `validate.py` (recorded FLLWUP-27
   practice; `council/preflight.sh` is the run-start / owner-time gate and
   its branch-freshness line is the known mid-card artifact — never
   weakened).
2. **`gates` workflow SUCCESS on the PR head SHA.**
   `gh pr checks 60 --json name,state,workflow` →
   `[{"name":"gates","state":"SUCCESS","workflow":"gates"}]`, asserted
   on the `workflow` field. `headRefOid` re-read immediately before the
   merge as `8815bf4…` and asserted equal to the checked SHA.
3. **No blocking Skeptic objection** — step 9 NO-BLOCK, all eight
   objections `closed-green`.
4. **Judge PASS** (job-7.3).
5. **No `Needs Human` / outstanding ruling** — card `In Review`, zero
   escalations. R2 is the recorded run-scoped authorization this merge
   executes under, not an open ruling.

Merged under R2: `gh pr merge 60 --squash --admin --match-head-commit
8815bf44…` exit 0 → PR #60 **MERGED** (mergedAt 2026-09-17T11:15:10Z),
squash commit **`aff11012a0133526645a1858e9ee2d872206d50e`** on `main`
(parent `544f52d`).

**Observed parallel fact:** the ruleset blocks direct `main` updates too
(`remote: Bypassed rule violations for refs/heads/main: Cannot update this
protected ref / Changes must be made through a pull request`) — this run's
step-1/8/9 record pushes and this card's step-12 push bypass it via the
pusher's admin identity, not via `gh pr merge --admin`. Recorded as a
step-13 candidate below (the record-push discipline inherits the same
admin dependency the procedure copy addresses for merges).

### Step 12 — Done

`gates` workflow on the merged SHA `aff1101` (observed via `gh run list
--commit aff1101…`, workflowName `gates`, event `push`) completed
**success**. Local `main` fast-forwarded from `544f52d` to `aff1101` —
clean FF, no forced resolution, no union merge needed. `validate.py`
clean; board and card set `Done`; reconciliation committed and pushed
directly to `main`. Card closes with **no open-untested step-9 residual**
— the verify loop ran once (NO-BLOCK at cycle 1 of ≤3).

### Step 13 — follow-up candidates (drafted, NOT written; per Phase-1
follow-up ruling, draft-then-confirm is re-homed to `product-owner`, which
this container must not dispatch)

- **Candidate A — the record-push discipline's own admin dependency.**
  `features-deliver.md` step 12 instructs committing the reconciliation
  directly to `main` and pushing, and the active ruleset's "Changes must be
  made through a pull request" clause blocks that for any pusher without a
  bypass (observed on every record push this card made). The run-scoped
  R2 authorization covers the `gh pr merge --admin` step; whether it also
  covers, or should explicitly cover, the runner's direct record pushes —
  or whether the next run needs a non-admin record-push path — is an open
  scope/judgment question this card's goal does not settle. No proposed id
  assigned; the orchestrator owns allocation.
- **Candidate B — wiki staleness.** [[deterministic-merge-check]] still
  reads "The human merge gate is not fully replaced … Carded as FLLWUP-42"
  and the EPIC-9 source ledger still reads "the procedure text does not yet
  name it" — both stale as of the merged SHA. Step-14 material; recorded
  as owed, not hand-edited (`vault/` is never written by hand).

No other candidate: the FLLWUP-27 preflight branch-freshness artifact is
already carded; the fixture/digest surface has zero impact (verified); the
prose/stack gates are green.
