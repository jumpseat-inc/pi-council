# EV-21 Results Leaderboard with Variance — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or executing-plans. Steps use `- [ ]` syntax.

**Goal:** Ship `/council-leaderboard` — a read-only ranking of models per command (procedure fixtures) and per seat (seat fixtures) with repeat count, mean, σ, and an honest tier/empty-state, plus the CONFIRM-2 version-pair group-key fix.

**Architecture:** A pure module `extensions/eval-leaderboard.ts` that groups `readAllResults(store)` records by `(taskId, kind, model, thinking, fixtureVersion, rubricVersion, scoredUnder)`, aggregates each group through the shared `aggregateCell`, and renders a plain-text table. Registered in `extensions/index.ts` as a pure read. The CONFIRM-2 fix rides in `eval-runner.ts`/`eval-stats.ts` (additive, byte-identity preserved for single-version stores).

**Tech Stack:** TypeScript, bun:test, pi extension API (`ctx.ui.notify` / `console.log`).

**Spec:** `docs/superpowers/specs/2026-09-03-EV-21-design.md` (+ binding PO ruling `vault/raw/2026-09-03-po-ev21-ruling.md`).

## Global Constraints

- CONFIRM-2: failing-test-first (convention 7); in-place version-pair group-key fix.
- No schema amendment to `StoredResultRecord`/`VerdictRecord`/writers.
- No reads of `runs/` (convention 12).
- Theme compliance 9.6: no literal hex/ANSI/256-index in council-drawn output; plain text.
- Copy bound: `TASK MODEL GRADER n MEAN σ TRIAGE`; tier phrases; four empty states; both slices default; disclosure copy.
- Do not touch `council/board.md` or card states.
- Byte-identity: single-version stores keep every existing summary byte identical (mean/σ/n/histogram) — only the appended version stamp is new.

---

### Task 1: CONFIRM-2 — failing test + in-place fix (eval-runner.ts / eval-stats.ts)

**Files:**
- Modify: `extensions/eval-stats.ts` (`CellSummary` + `aggregateCell`)
- Modify: `extensions/eval-runner.ts` (`summarizeStore:634` group key; `summaryLines` stamp)
- Test: `test/eval-runner.test.ts`

- [ ] **Step 1: Write the failing two-version test** (below) in `test/eval-runner.test.ts`.
- [ ] **Step 2: Run it — must fail RED** (`summarizeStore` returns 1 blended summary, not 2).
- [ ] **Step 3: Fix** — add `fixtureVersion`/`rubricVersion`/`gradedScores` to `CellSummary`; populate in `aggregateCell`; change `summarizeStore` group key to `${cellId}\0${scoredUnder}\0${fixtureVersion}\0${rubricVersion}`; append ` fixture=vX.Y.Z rubric=vA.B.C` in `summaryLines` when versions present.
- [ ] **Step 4: Run test — GREEN**; run full suite — every existing test stays green (byte-identity).
- [ ] **Step 5: Commit.**

### Task 2: New pure module extensions/eval-leaderboard.ts

**Files:**
- Create: `extensions/eval-leaderboard.ts`
- Test: `test/eval-leaderboard.test.ts`

**Interfaces:**
- Consumes: `readAllResults`, `SCORED_UNDER_SELF` (eval-runner.ts); `aggregateCell`, `compareCellTriage`, `CellSummary` (eval-stats.ts); `loadFixture` (eval-fixtures.ts); `StoredResultRecord`.
- Produces: `buildLeaderboard(store, repoRoot): LeaderRow[]`; `renderLeaderboard(store, repoRoot): string[]`; helpers `rankAxis(model, thinking): string`.

- [ ] Step 1: group records by the finer key; `kind` via `loadFixture(...).fixture.kind` with `"unknown"` fallback (try/catch).
- [ ] Step 2: separate gate-only (`self`) rows from graded rows; rank axis `model[:thinking]`; grader never a ranked row.
- [ ] Step 3: mean-desc order; adjacent-pair `compareCellTriage` over `gradedScores` → tier phrases (leader / runner-up / tied (±CI) / gate-only (self) / indeterminate (…) / n<2 (need 2 to triage)); indeterminate+n<2 excluded from numeric bands.
- [ ] Step 4: renderer produces both slices (By command / By seat), per-task version-cohort sibling rows + disclosure line, empty states A/B/C/D.
- [ ] Step 5: unit tests for claims 1–9.
- [ ] Step 6: theme-compliance (9.6) — no hex/ANSI in the module.
- [ ] Step 7: Commit.

### Task 3: Register /council-leaderboard in extensions/index.ts

**Files:**
- Modify: `extensions/index.ts`
- Test: `test/eval-leaderboard.test.ts` (surface gate)

**Interfaces:** consumes `renderLeaderboard`.

- [ ] Step 1: register command next to `/council-eval`; handler = pure read, `emit` via notify/console, no-arg default render, never calls `runMatrix`; errors non-fatal (`[council-leaderboard] error: …`).
- [ ] Step 2: surface-gate unit test (registers command; never calls `runMatrix`; theme-clean).
- [ ] Step 3: Commit.

### Task 4: Phase-4 smoke (smoke/driver.sh + smoke/assert.sh)

**Files:**
- Modify: `smoke/driver.sh` (append Phase 4), `smoke/assert.sh` (Phase-4 assertions)

- [ ] Step 1: append Phase 4 after Phase 3 — drive `/council-leaderboard` headlessly against the Phase-3 gate-only records.
- [ ] Step 2: assert `|| fatal`: (a) State B line, (b) both slice headers, (c) leaderboard numbers == summarizeStore numbers, (d) validate.py green.
- [ ] Step 3: Commit.

### Task 5: Gates + delivery

- [ ] `bunx tsc --noEmit` clean; `bun test` all green (CONFIRM-2 shown red-first); `python3 council/validate.py` clean.
- [ ] Bump `version` in `package.json` (breaking? no — additive feature; minor bump), commit.
- [ ] Push branch, `gh pr create` → PR to main; report PR number + head SHA + gate outputs + pinned claims.

## Self-review

- Claim 1 (A) → Task 2 Step 4/5; Claim 2 (B) → Task 2; Claim 3 (version cohorts) → Task 1; Claim 4 (byte-identity) → Task 1 Step 4; Claim 5 (kind join) → Task 2; Claim 6 (rank axis) → Task 2; Claim 7 (E1 ties) → Task 2; Claim 8 (E2/E3) → Task 2; Claim 9 (surface gate) → Task 3; Claim 10 (Phase 4) → Task 4; Claim 11 (gates) → Task 5. No gaps.
