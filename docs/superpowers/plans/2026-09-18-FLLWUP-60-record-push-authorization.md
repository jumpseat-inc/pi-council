# FLLWUP-60 — Name the run-scoped record-push authorization in council.md step 12

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `council/procedures/council.md` step 12 ("## 12. Sync and
reconcile") name the run-scoped record-push authorization explicitly: the
step-12 record commit is pushed directly to `main` — a privileged write the
authority map does not re-home — an explicit, run-scoped, human-granted
authorization (a Phase-1 ruling on the run's Phase-1 record) must exist
before the run's first record push and is never extended to a later run,
and an unauthorized direct record push is a `HALT` surfaced to the human.

**Architecture:** One seam, procedure prose only. Step 12's final paragraph
("Run `python3 council/validate.py` ... commit the reconciliation directly
to `main`, and push.") is expanded into the record-push paragraph. The
union-merge reconcile paragraph above it (FLLWUP-41) and the merge text in
`features-deliver.md` (FLLWUP-42) are untouched. A literal-substring test in
`test/prose.test.ts` pins the new copy, written red-first (same idiom as the
FLLWUP-41 and FLLWUP-42 pins).

**Tech Stack:** Markdown prose, bun (test runner), TypeScript (strict).

**Spec:** `council/cards/FLLWUP-60.md` (goal + Intent + binding ruling R3),
run-1 precedent `docs/superpowers/plans/2026-09-17-FLLWUP-42-admin-merge-procedure.md`.

## Global Constraints

- Main-repo immutability: all work in worktree
  `.worktrees/fllwup-60`, branch `feat/fllwup-60-record-push-authorization`,
  created from `origin/main` at `8e6fe4b`.
- Do not edit `council/board.md`, `council/cards/**`, or `vault/**`.
- Do not touch engine TypeScript.
- Keep FLLWUP-41's step-12 pin green (`union-merge reconcile`, never-force
  guard, `union-keep both record sides`, `council/validate.py`, conflict
  markers, `surfaced to the human`).
- Keep FLLWUP-42's `features-deliver.md` merge paragraph untouched; the five
  deterministic criteria and `--match-head-commit` pinning unchanged.
- New prose must stay free of `bun`/`bunx`/`tsc`/`typescript` tokens (the
  `council prose does not pin a specific tech stack` test) and must be
  run-generic — it names no specific ruling id and no repo toolchain.

## Tasks

### Task 1: Falsifier — pin step 12's record-push paragraph (red-first)

**Files:**
- Modify: `test/prose.test.ts` (one new test, after the FLLWUP-41 step-12 pin)

- [ ] **Step 1: Write the failing test** — read `council.md` via `PKG_ROOT`,
  slice step 12 between `## 12. Sync and reconcile` and
  `## 13. Card the follow-ups`, whitespace-normalize, assert the literals:
  `pushed directly to \`main\``, `privileged write`, `authority map does not
  re-home`, `run-scoped`, `Phase-1 ruling`, `before the run's first record
  push`, `not extended to any later run`, `HALT surfaced to the human`.
- [ ] **Step 2: Run it red** — `bun test test/prose.test.ts`; record the
  literal red output (fails against current prose).
- [ ] **Step 3: Edit the prose** — expand step 12's final paragraph per the
  requirements above, keeping all FLLWUP-41 literals intact.
- [ ] **Step 4: Run it green** — `bun test test/prose.test.ts` passes; the
  FLLWUP-41 pin stays green.
- [ ] **Step 5: Commit** — `docs(council): FLLWUP-60 — name the run-scoped record-push authorization in step 12`

### Task 2: Clear the owner gates in full, in order

- [ ] `bash council/preflight.sh FLLWUP-60` — exit 0
- [ ] `bunx tsc --noEmit` — exit 0
- [ ] `bun test` — full suite, record pass/skip/fail counts
- [ ] `python3 council/validate.py` — clean

### Task 3: Push and open the PR

- [ ] Commit (conventional message), push `feat/fllwup-60-record-push-authorization`, `gh pr create` against `main`.
- [ ] Report PR number, head SHA, diff stat, red/green evidence, gate outputs.
