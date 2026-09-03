# EV-16 Council Model Eval System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the council model eval system per the settled EV-16 design — the eval harness architecture, scoring rubric, per-run model override, and repeat-run confidence methodology — each with falsifiable acceptance criteria (spec §10 A1–F2), so each implementation card (EV-17..EV-21) cites one authoritative source.

**Architecture:** The spec is the design; this plan is the execution order. Tasks are organized by subsystem, matching the spec's child-card mapping (§11): the per-run model override layer (EV-17), benchmark fixtures (EV-18), the scoring rubric + run verifier (EV-19), the matrix runner + forest telemetry (EV-20), and the results leaderboard (EV-21). Each task references the spec's acceptance criteria and never re-derives the design. EV-16 itself delivers only the spec + this plan (scope guard §12); the child cards execute their slices. The final task is EV-16's own delivery: gates, commit, push, PR.

**Tech Stack:** bun, bun:test, TypeScript (strict via `bunx tsc --noEmit`), Python 3 (`council/validate.py`), git worktrees (scratch-per-cell), the pi extension API (`@earendil-works/pi-coding-agent`).

**Spec:** `docs/superpowers/specs/2026-09-03-EV-16-design.md` — the settled design; the plan argues from it and never re-derives it.

## Global Constraints

- **Cell-invariance contract (§1).** The only thing that varies across cells is the (model, thinking) pair. The fixture pins everything-but-model: repo state, grader model, harness-as-human policy, environment. The repeat dimension is the statistical control for the unpinnable sampling dimension.
- **R-1 (storage).** Eval results records live under `council/eval-results/`, local-only telemetry, self-gitignored like `runs/` (the convention-12 pattern). NOT committed to git. EV-20 writes there; EV-21 reads from there; its empty state is truthful on a fresh checkout.
- **R-2 (repeat default).** The default repeat count is **3**; the caller raises or lowers it explicitly via `--repeat N`. There is no implicit all-models sweep — the matrix contains only what the caller names. Cost rationale (verbatim from the deliberation): a full 16-inventory × M-models × 3 sweep is hours of dispatch; the no-implicit-sweep rule is a cost guard.
- **Step-6 ruling (grader topology).** The grader is a **harness-dispatched sibling of the cell** (parent = the command job, same parent as the cell driver). Cell↔verdict linkage is by an explicit `cellId` field on the verdict record — not by `parentJobId`. Three aggregation columns: `cell`, `command`, `grading`. No exclusion rule. Cell drivers have NO authority to dispatch graders; the judge seat's `spawns: []` stays unchanged.
- **Override precedence (§4.1).** per-dispatch `model`/`thinking` param on `council_dispatch` > `COUNCIL_EVAL_MODEL` env > `.council.json` override > seat frontmatter. One parser (`qualifiedOrThrow`-style: `provider/id` or `provider/id:thinking`), one live catalogue check against the **effective** model, loud refusal on unknown (no fallback). The env override is set on the spawned job's env, never the parent's `process.env`.
- **Scope guard (§12).** EV-16 writes the spec and the matching plan only. No engine code changes land on this card. The RunManifest extension (§7) is implemented by EV-20; the override layer (§4) by EV-17. Do not implement any downstream card's code on EV-16.
- **Convention 7 (hub.ts is stable).** The RunManifest extension ships with a failing test first, never a silent field addition.
- **Convention 12 (runs/ quarantine).** No file in the runs/ set (`runs.ts`, `tree.ts`, `transcript.ts`, `navigator.ts`) reads the eval-results path; only the new eval module does.
- **Gates, in order, all four:** `bun install --frozen-lockfile`; `bunx tsc --noEmit` clean; `bun test` full suite green (integration test stays gated off unless `COUNCIL_INTEGRATION=1`); `python3 council/validate.py` prints `All council artifacts valid`.
- **Commits:** Conventional Commits format. Branch `feat/ev16-eval-design` off `main`. Do NOT merge the PR, do NOT poll CI.
- **Every `bash` call carries an explicit `timeout`.**

---

### Task 1: EV-17 — per-run model override layer

**Files:**
- Modify: `extensions/hub-tools.ts` — `council_dispatch` schema (add optional `model`, `thinking`, `cellId`), the post-`loadSeat`/pre-catalogue-check insertion point (~89–130), the `spawnJob` call
- Modify: `extensions/seats.ts` — extract `resolveEffectiveModel(seat, envVal?, param?)` (pure)
- Test: `test/override.test.ts` (new)

**Interfaces:**
- Consumes: `loadSeat` (frontmatter → `.council.json` via `applySeatOverride`), `ctx.modelRegistry.getAvailable()`, `buildChildArgv`, `spawnJob({ model, env })`, `childEnv` (runs.ts:139–141).
- Produces: `resolveEffectiveModel(seat, envVal?, param?)` → `{ model, thinkingLevel }`; `council_dispatch` accepting optional `model`/`thinking`/`cellId`; the effective model written to the spawned job's manifest `model` field and to that spawn's env as `COUNCIL_EVAL_MODEL`.

**Acceptance (spec §10):** B1–B4, D2, D3.

- [ ] **Step 1: Write the failing precedence test (B1)**

`test/override.test.ts` — the four-combination matrix per the deliberation's testable claim (frontmatter `openrouter/a/model`, `.council.json` `openrouter/b/model`, env `openrouter/c/model`, param `openrouter/d/model`):

```ts
// B1: precedence param > env > .council.json > frontmatter, :thinking suffix in all three sources
test("B1: resolveEffectiveModel precedence — param > env > .council.json > frontmatter", () => {
	const seat = { model: "openrouter/a/model", thinkingLevel: "off" }; // frontmatter
	// 1. no env, no param → .council.json value (openrouter/b/model)
	// 2. env only → env value (openrouter/c/model)
	// 3. env + param → param value (openrouter/d/model)
	// 4. param only → param value; none → frontmatter value
	// :thinking suffix parses in all three override sources (e.g. env "openrouter/c/model:high" → thinkingLevel "high")
});
```

- [ ] **Step 2: Run it — must fail**

Run: `bun test test/override.test.ts`
Expected: FAIL — `resolveEffectiveModel` not defined.

- [ ] **Step 3: Extract `resolveEffectiveModel` in `extensions/seats.ts`**

Pure function: `(seat, envVal?, param?) => { model, thinkingLevel }`. Parse `provider/id` or `provider/id:thinking` with the same `qualifiedOrThrow`-style grammar `.council.json` and frontmatter share. Apply precedence: param > env > `.council.json` override > frontmatter.

- [ ] **Step 4: Wire the env layer into `council_dispatch` (B2, B3)**

In `extensions/hub-tools.ts`, after `loadSeat` and before the catalogue check: read `process.env.COUNCIL_EVAL_MODEL` (inherited from the spawn env), apply `resolveEffectiveModel`, **write the effective (model, thinking) back onto the seat**, then run the existing catalogue check against the effective model — the loud error names the overridden model. Pass the effective model to `buildChildArgv` and `spawnJob({ model })`, and write `COUNCIL_EVAL_MODEL` into that spawn's env (never the parent's `process.env`).

- [ ] **Step 5: Run the override tests — green**

Run: `bun test test/override.test.ts`
Expected: PASS (B1–B4).

- [ ] **Step 6: Add `cellId` param (D2, D3)**

`council_dispatch` gains optional `cellId` (string) — the same injection point as `model`/`thinking`. The harness passes it on grader dispatches; the verdict record carries it (spec §6.3). Cell drivers have no authority to dispatch graders — no rubric criterion routes through a cell-driver-spawned grader; the judge seat's `spawns: []` stays unchanged.

- [ ] **Step 7: Commit**

```bash
git add extensions/seats.ts extensions/hub-tools.ts test/override.test.ts
git commit -m "feat(eval): per-run model override layer — COUNCIL_EVAL_MODEL + dispatch params"
```

---

### Task 2: EV-18 — benchmark fixtures

**Files:**
- Create: `council/fixtures/<task>/fixture.json` (per task)
- Create: `council/fixtures/<task>/rubric.json` (per task)
- Test: `test/fixtures.test.ts` (new)

**Interfaces:**
- Consumes: the wiring table (spec §3.4): task id → `council/fixtures/<task>/` → `council/fixtures/<task>/rubric.json`. The fixture directory is the unit of task identity.
- Produces: fixture directories carrying `fixture.json` (task id, name, repo-state seed, procedure/command, harness-as-human policy, pinned `graderModel`, rubric reference) + `rubric.json` (spec §9).

**Acceptance (spec §10):** A1, A4, C3.

- [ ] **Step 1: Write the failing fixture-load tests (C3, A4)**

`test/fixtures.test.ts`:
- C3: a fixture dir lacking `rubric.json` fails loudly at load (no silent `[]`).
- A4: the structured-rulings engine is pure — the same policy block + same cell state yields the same verdict, with no I/O.

- [ ] **Step 2: Run — must fail**

Run: `bun test test/fixtures.test.ts`
Expected: FAIL — fixture loader / rulings engine not defined.

- [ ] **Step 3: Implement the fixture loader + structured-rulings engine**

Pure loader: `loadFixture(repoRoot, taskId)` → `{ fixture, rubric }`, loud failure on missing rubric. Pure rulings engine: `applyRulings(policyBlock, cellState)` → verdict, no I/O (spec §3.3 — machine-applicable structured policy, one block per procedure: /council merge-gate verdict, /features-deliver delivery ruling).

- [ ] **Step 4: Author the first fixture set**

`council/fixtures/<task>/fixture.json` + `rubric.json` per the schema (spec §9): repo-state seed, procedure/command, harness-as-human policy block, pinned `graderModel` (resolved from the fixture file, never from `.council.json`), rubric reference.

- [ ] **Step 5: Run — green**

Run: `bun test test/fixtures.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add council/fixtures test/fixtures.test.ts
git commit -m "feat(eval): benchmark fixtures — fixture.json + rubric.json per task"
```

---

### Task 3: EV-19 — scoring rubric + run verifier

**Files:**
- Create: `extensions/eval-rubric.ts` (pure: rubric schema validation, deterministic gates, judge-verdict replay)
- Test: `test/rubric.test.ts` (new)

**Interfaces:**
- Consumes: rubric files from Task 2; verdict records (spec §6.3).
- Produces: `validateRubric(rubric)` (schema-validate at load, loud failure); `gradeCell(record, rubric)` → per-criterion pass/fail + score (deterministic gates re-run, judge verdicts replayed); append-only re-grade keyed by `gradedBy`.

**Acceptance (spec §10):** C1–C3.

- [ ] **Step 1: Write the failing rubric tests (C1–C3)**

`test/rubric.test.ts`:
- C1: record R re-graded yields the same per-criterion pass/fail and score (judge criteria replayed, gates re-run).
- C2: re-grading under a different pinned grader writes a second verdict keyed by `gradedBy`; the original record is byte-identical.
- C3: a fixture lacking a rubric fails loudly at load (no silent `[]`).

- [ ] **Step 2: Run — must fail**

Run: `bun test test/rubric.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement `extensions/eval-rubric.ts`**

Rubric shape (spec §5): ordered list of named criteria; each criterion is either a deterministic gate (definite pass/fail: gates green, `validate.py` clean, artifact present) or a recorded judge verdict (the existing `judge.md` PASS/REJECT used as data). Scoring: unweighted pass/total, 0..1. Judge verdicts are recorded at grade time into the result record and re-graded by replay; re-grading under a different pinned grader writes a second verdict record keyed by `gradedBy` — append-only, never overwrite.

- [ ] **Step 4: Run — green**

Run: `bun test test/rubric.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add extensions/eval-rubric.ts test/rubric.test.ts
git commit -m "feat(eval): scoring rubric — deterministic gates + recorded judge verdicts, replay re-grade"
```

---

### Task 4: EV-20 — matrix runner + forest telemetry

**Files:**
- Create: `extensions/eval-runner.ts` (engine module: matrix loop, scratch worktree per cell, harness-owned grader dispatch, three aggregation columns, repeat aggregation, eval-results writes)
- Modify: `extensions/runs.ts` — extend `RunManifest` with `usage` + `stopReason` (F1, F2)
- Modify: `extensions/hub.ts` — persist usage/stopReason into the manifest at `settle()` (F2)
- Create: `council/eval-results/.gitignore` (`*`) — self-gitignored (R-1)
- Test: `test/eval-runner.test.ts` (new)

**Interfaces:**
- Consumes: `resolveEffectiveModel` + `cellId` param (Task 1), fixtures (Task 2), rubric (Task 3), `readManifests`/`buildTree` (runs.ts/tree.ts), the `council_dispatch`/`council_wait` shared path (convention 7: reuse, don't fork the hub).
- Produces: `sumSubtree(rootId)` (forest aggregation over `readManifests`); cell/command/grading aggregation columns; result records under `council/eval-results/`; per-cell `n_attempted` vs `n_graded` + terminal-state histogram.

**Acceptance (spec §10):** A1–A3, D1, E2, F1–F2.

- [ ] **Step 1: Write the failing RunManifest-extension test first (F1, F2 — convention 7)**

`test/eval-runner.test.ts`:
- F1: extend `RunManifest`; write → `readManifests` round-trips usage/stopReason; `sumSubtree(rootId)` over a 3-deep chain equals the hand-computed sum.
- F2: the extension ships with a failing test first — this test is that failing test.

- [ ] **Step 2: Run — must fail**

Run: `bun test test/eval-runner.test.ts`
Expected: FAIL — usage/stopReason undefined on round-trip.

- [ ] **Step 3: Extend `RunManifest` + persist at settle**

`extensions/runs.ts`: add `usage` and `stopReason` to `RunManifest` (`elapsedMs` is already derivable from persisted `startedAt`/`settledAt` — only two fields are truly new). `extensions/hub.ts`: at `settle()`, write the job's usage/stopReason into the manifest via the existing `writeManifest` path.

- [ ] **Step 4: Implement the matrix runner**

`extensions/eval-runner.ts`: for each (task × model) cell × repeat (default 3, R-2; `--repeat N` explicit; no implicit all-models sweep): create a disposable scratch worktree seeded from the fixture (A1 — the caller's live tree stays byte-identical), dispatch the cell driver under the env-carried `COUNCIL_EVAL_MODEL` override, wait via the shared hub path, then harness-dispatch the judge as a **sibling** of the cell (parent = the command job) with the fixture-pinned grader model as an explicit `model` param and `cellId` linkage (D1). Write result records to `council/eval-results/` (R-1). Aggregate three columns: `cell` (cell-subtree spend), `command` (command-subtree spend), `grading` (grader-subtree spend) — no exclusion rule (D1).

- [ ] **Step 5: Length semantics (E2)**

Cell summary over `[{stopReason: length, done, empty}, {done, ok}]` yields `{completed: 1, lengthFlagged: 1, score: 1.0}` — not `{score: 0.5}`. Score is over completed repeats only; the cell record carries `n_attempted` vs `n_graded` plus the terminal-state histogram; a majority-flagged cell renders as indeterminate triage, not a low number.

- [ ] **Step 6: Run — green**

Run: `bun test test/eval-runner.test.ts`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add extensions/eval-runner.ts extensions/runs.ts extensions/hub.ts council/eval-results/.gitignore test/eval-runner.test.ts
git commit -m "feat(eval): matrix runner — scratch worktree per cell, harness-owned grader, forest telemetry"
```

---

### Task 5: EV-21 — results leaderboard

**Files:**
- Create: `extensions/eval-leaderboard.ts` (reads `council/eval-results/`, mean/σ/CI, triage, terminal-state histogram, truthful empty state)
- Test: `test/leaderboard.test.ts` (new)

**Interfaces:**
- Consumes: result records from Task 4 (each carries task, model, thinking, repeat index, per-criterion pass/fail, score, cost, elapsed, tokens, stopReason, rubric version, fixture version, repo state — spec §8).
- Produces: per-cell (task × model) mean, sample σ, and n computed from the records alone; CI on the mean difference; TRIAGE rendering (no asserted ordering between close models); terminal-state histogram; truthful empty state on a fresh checkout.

**Acceptance (spec §10):** A2, E1, E3.

- [ ] **Step 1: Write the failing leaderboard tests (E1, E3, A2)**

`test/leaderboard.test.ts`:
- E1: two n=3 cells with overlapping score CIs render as tied/adjacent (triage), never an asserted ordering.
- E3: a cell with 2/3 done + 1/3 `stopReason=length` reports the terminal-state histogram; the leaderboard does not collapse it to a bare mean/σ.
- A2: a fresh checkout with no `council/eval-results/` dir renders the empty state truthfully.

- [ ] **Step 2: Run — must fail**

Run: `bun test test/leaderboard.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement `extensions/eval-leaderboard.ts`**

Per-cell mean/σ/n from the records alone; "a difference is real" = the confidence interval on the mean difference excluding zero; at n=3 that interval is wide, so the leaderboard renders TRIAGE, not asserted ordering — "do not claim an ordering whose variance doesn't support it" is a first-class rule. Terminal-state histogram alongside mean/σ; a majority-flagged cell renders as indeterminate triage, not a low number; a missing `council/eval-results/` dir renders the truthful empty state.

- [ ] **Step 4: Run — green**

Run: `bun test test/leaderboard.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add extensions/eval-leaderboard.ts test/leaderboard.test.ts
git commit -m "feat(eval): results leaderboard — mean/sigma/CI, triage, terminal-state histogram"
```

---

### Task 6: EV-16 delivery — gates, commit, push, PR

**Files:** none (verification + delivery).

- [ ] **Step 1: Gate 1 — install**

Run: `bun install --frozen-lockfile`
Expected: clean, exit 0.

- [ ] **Step 2: Gate 2 — typecheck**

Run: `bunx tsc --noEmit`
Expected: clean, no output, exit 0.

Known pre-existing defect on main: `test/ev16-verification.test.ts:87` casts `RunManifest` to `Record<string, unknown>` directly — TS2352 ("neither type sufficiently overlaps"). Fix: `loaded[0] as unknown as Record<string, unknown>` (the intentional field-probe cast must go through `unknown` first; no semantic change — the test still asserts usage/stopReason/elapsedMs are undefined on the persisted manifest). This is the EV-16 card's own skeptic probe suite; the fix is required to clear the gate.

- [ ] **Step 3: Gate 3 — full test suite**

Run: `bun test`
Expected: all pass, integration test still skipped (2 skip), 0 fail.

- [ ] **Step 4: Gate 4 — validate.py**

Run: `python3 council/validate.py`
Expected: prints `All council artifacts valid`.

- [ ] **Step 5: Push and open the PR**

```bash
git push -u origin feat/ev16-eval-design
gh pr create --title "docs(plan): EV-16 implementation plan — eval harness, override, rubric, confidence" --body "..." --base main
```

PR body: summarize the change (the matching implementation plan for the settled EV-16 design; tasks organized by the spec's child-card mapping EV-17..EV-21, each referencing the spec §10 acceptance criteria A1–F2; the pre-existing typecheck defect in the EV-16 skeptic probe suite fixed to clear the gate) and cite the spec (`docs/superpowers/specs/2026-09-03-EV-16-design.md`). Do NOT merge. Do NOT poll CI.

- [ ] **Step 6: Report**

Report per the owner output format: approach, tradeoffs, and the real gate outputs (paste actual output of each gate), branch name, PR URL, and diff summary.
