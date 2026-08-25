# Gates GitHub Actions Workflow Implementation Plan (EV-6)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `gates` GitHub Actions workflow at `.github/workflows/gates.yml` that reports SUCCESS on every pull request and main push when typecheck, tests, and board validation pass.

**Architecture:** Single-file workflow addition. The workflow runs the repo's AGENTS.md gate command set as GitHub Actions steps on `ubuntu-latest`; GitHub Actions reports the `gates` job's outcome as the workflow check status on the PR head SHA, satisfying the deterministic merge check's criterion 2 (ruling CI-1).

**Tech Stack:** GitHub Actions, `actions/checkout@v4`, `oven-sh/setup-bun@v2`, Bun (`bun install --frozen-lockfile`, `bunx tsc --noEmit`, `bun test`), Python 3 (`python3 council/validate.py`).

**Spec:** `council/cards/EV-6.md` (verbatim card; the YAML draft it contains is the approved Phase 1 ruling CI-1 artifact — this plan argues from it, and the file must match it byte-for-byte).

## Global Constraints

- The workflow `name` is `gates` and the job is named `gates` — `gh pr checks` keys on the `workflow` field and the merge check asserts the `gates` workflow row with `state: SUCCESS`. No renames, no added steps, no extra triggers.
- The file content must match the approved draft exactly (six steps in order: checkout, setup-bun, `bun install --frozen-lockfile`, `bunx tsc --noEmit`, `bun test`, `python3 council/validate.py`).
- Triggers: `pull_request` (all) and `push` to `main`.
- `bun test` runs the whole suite; the integration test self-skips without `COUNCIL_INTEGRATION=1` — documented repo behavior, not a finding.
- The card's own PR branch carries the 3 local commits ahead of `origin/main` (EPIC-1 decomposition + Phase 1 rulings) plus the `.worktrees/` gitignore chore; that is expected, do not push main directly.

---

### Task 1: Write the plan (this file)

**Files:**
- Create: `docs/superpowers/plans/2026-08-25-gates-workflow.md`

- [ ] **Step 1: Save this plan under `docs/superpowers/plans/`** in the worktree, per the writing-plans skill.

### Task 2: Add the gates workflow file

**Files:**
- Create: `.github/workflows/gates.yml`

**Interfaces:**
- Consumes: nothing from other tasks.
- Produces: `.github/workflows/gates.yml` — the file GitHub Actions reads for the `gates` workflow; the merge check's criterion 2 reads its check status.

- [ ] **Step 1: Create the workflow file** with content copied exactly from the card's approved draft (no added steps, no renames, no extra triggers):

```yaml
name: gates
on:
  pull_request:
  push:
    branches: [main]

jobs:
  gates:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install --frozen-lockfile
      - run: bunx tsc --noEmit
      - run: bun test
      - run: python3 council/validate.py
```

- [ ] **Step 2: Diff-check the file against the card draft** — verify `name: gates`, job `gates`, the six steps, and both triggers are present verbatim.

### Task 3: Clear the local gate set (AGENTS.md, in order)

**Files:** none (verification only).

- [ ] **Step 1: Gate 1 — install with frozen lockfile.** Run `bun install --frozen-lockfile` in the worktree root. Expected: exit 0, no dependency changes.
- [ ] **Step 2: Gate 2 — typecheck.** Run `bunx tsc --noEmit`. Expected: exit 0, no errors.
- [ ] **Step 3: Gate 3 — full test suite.** Run `bun test`. Expected: 34 tests pass, 1 skipped (integration, gated on `COUNCIL_INTEGRATION=1`).
- [ ] **Step 4: Gate 4 — board validation.** Run `python3 council/validate.py`. Expected: exit 0.

### Task 4: Commit, push, open PR

**Files:** none (git + gh).

- [ ] **Step 1: Commit the plan and the workflow** (conventional commits per AGENTS.md):

```bash
git add docs/superpowers/plans/2026-08-25-gates-workflow.md
git commit -m "docs: add EV-6 gates workflow implementation plan"
git add .github/workflows/gates.yml
git commit -m "ci: add gates GitHub Actions workflow (EV-6)"
```

- [ ] **Step 2: Push the branch** — `git push -u origin feat/ev-6-gates-workflow` (via `gh`, authenticated).
- [ ] **Step 3: Open the PR** against `main` with `gh pr create`, title `ci: add gates GitHub Actions workflow (EV-6)`, body citing the card and ruling CI-1.
- [ ] **Step 4: Verify the PR exists** — `gh pr view --json number,title,baseRefName,headRefName`.

## Self-Review

- **Spec coverage:** Acceptance criterion 1 (workflow file committed, matching draft) → Task 2. Criterion 2 (PR shows `gates` SUCCESS) → Task 4 (workflow triggers on the PR's own head SHA). Criterion 3 (triggers on `pull_request` and `push` to `main`) → Task 2's `on:` block. Criterion 4 (local gates still pass) → Task 3. No gaps.
- **Placeholder scan:** No TBD/TODO; the workflow YAML and commit commands are inline verbatim.
- **Type consistency:** N/A — no code signatures; the only cross-task contract is the exact YAML, reproduced in both the plan and the file from the same card draft.
