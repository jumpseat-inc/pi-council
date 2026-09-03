# EV-20 — Matrix runner with repeat aggregation: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the `/council-eval` matrix runner end-to-end: a slash command that runs a declared task-and-model matrix at N repeats, drives each cell in a disposable scratch worktree, writes one VerdictRecord/ResultRecord per repeat under self-gitignored `council/eval-results/`, and renders a record-derived per-cell summary (mean / sample σ / histogram / length-flag / triage). Includes the pure shared `aggregateCell`, the dispatch-primitive extraction, the §7 RunManifest extension (failing-test-first), the `VerdictRecord.repeat` amendment, the gate-only `"self"` sentinel, snapshot persistence, and smoke Phase 3.

**Architecture:** One I/O harness module (`extensions/eval-runner.ts`) drives dispatch→wait→grade→aggregate synchronously (NOT an LLM loop). Cells run in-process via `hub.spawnJob({ cwd: scratch })` through a shared dispatch primitive (`extensions/dispatch.ts`) composed from the existing override-resolution functions (no forked override path). A pure aggregate module (`extensions/eval-stats.ts`) recomputes every summary from on-disk records. Store writers implement the Q1/Q2 key semantics atomically, first-write-wins-per-tuple with divergent→throw.

**Tech Stack:** TypeScript (strict), bun:test, the existing `hub.ts`/`hub-tools.ts`/`eval-fixtures.ts`/`eval-rubric.ts`/`seats.ts`/`runs.ts`.

**Spec:** `docs/superpowers/specs/2026-09-03-EV-20-design.md` (settled; the compilation of the Q1/Q2/Q3 product-owner rulings). Design authority: `EV-16-design.md` (§6.3 + repeat amendment, §7, §8), `EV-19-design.md` (record types + O1 key). Card: `council/cards/EV-20.md`.

## Global Constraints

- No hardcoded `.pi` or clone paths — use `CONFIG_DIR_NAME` and `PKG_ROOT` (`seats.ts` `PKG_ROOT` via `import.meta.url`).
- Seat schema is fixed (no new frontmatter fields, no skill mechanism).
- `eval-rubric.ts` stays **pure** — the only EV-20-writer touch is adding `repeat: number` to `VerdictRecord` and projecting it from `meta.repeat`; `cellScope` is attached by the writer at persistence, never in `gradeCell`.
- `cellId` string form `taskId|model[:thinking]` (pipe separator).
- Store key tuples: VerdictRecord `(cellId, repeat, gradedBy, fixtureVersion, rubricVersion)`; ResultRecord `(cellId, repeat, scoredUnder, fixtureVersion, rubricVersion)`. Atomic write, absent→new, same→no-op, divergent→throw.
- `scoredUnder: "self"` sentinel for gate-only fixtures (`rubric` has no judge criterion) — no VerdictRecord written, no grader dispatch.
- `--repeat N` / `--repeat=N`, default 3, cap 20 (loud reject). No implicit all-models sweep. Model tokens parse through `parseQualifiedModel` and pre-validate against `ctx.modelRegistry.getAvailable()`.
- `/council-eval` handler name + argument hint `[task] [model...] [--repeat N]`; no-arg → `listFixtureTasks`.
- `[council-eval]`-prefixed per-repeat transcript lines; summary computed via shared `aggregateCell`; echo-then-run pre-dispatch confirmation naming taskId + fixtureVersion + models + repeat + totalRuns.
- `hub.ts` is stable — the RunManifest extension (`usage`/`stopReason` on `RunManifest`, `sumSubtree`) ships **with a failing test first** (AGENTS.md convention 7).
- RunManifest extension also applies to `extensions/hub.ts` `writeJobManifest` (persist `job.usage` + `job.stopReason`).
- `council/eval-results/` self-gitignored with `.gitignore = "*\n"` exactly like `ensureRunDir`.
- Tessellated rendering / summary strings are plain text, no ANSI/hex (AGENTS.md 9.6).
- Gates (authoritative: AGENTS.md; no `docs/gates/GATE-EVIDENCE.md` exists in this repo — AGENTS.md + wiki govern): `bunx tsc --noEmit`; `bun test` (integration stays gated unless `COUNCIL_INTEGRATION=1`); `python3 council/validate.py`. Smoke Phase 3 runs at the verify gate (Skeptic/CI) in Docker — not required as a local gate.
- Commits Conventional Commits; push branch; open PR against `main`; do not merge.

---

### Task 1: Amend `eval-rubric.ts` — `VerdictRecord.repeat` + `CellScope`/`StoredResultRecord` types

**Files:**
- Modify: `extensions/eval-rubric.ts` (type exports + `projectVerdictRecord`)
- Modify: `test/rubric.test.ts` (add a repeat-projection assertion)

**Interfaces:**
- Consumes: existing `ResultRecord`/`VerdictRecord`/`GradingUsage`/`GradeMeta`.
- Produces: `VerdictRecord` gains `repeat: number`; `projectVerdictRecord(result, report)` sets `repeat: result.repeat`; new type exports `CellScope` and `StoredResultRecord`.

- [ ] **Step 1: failing test** — in `test/rubric.test.ts` add: `projectVerdictRecord(first, report).repeat === META.repeat` (consumer today has no `repeat` on VerdictRecord). Also a type round-trip: construct a `VerdictRecord` literal requiring `repeat`.
- [ ] **Step 2: run → FAIL** (`property repeat does not exist` / assertion fails on `undefined`).
- [ ] **Step 3: implement** — add `repeat: number` to `VerdictRecord`; set it in `projectVerdictRecord`.
- [ ] **Step 4: run → PASS**.
- [ ] **Step 5: commit** — `feat(eval): VerdictRecord carries repeat (Q1)`.

### Task 2: Pure aggregate module `extensions/eval-stats.ts`

**Files:**
- Create: `extensions/eval-stats.ts`
- Test: `test/eval-runner.test.ts` (new file; aggregate claims)

**Interfaces:**
- Consumes: `StoredResultRecord` from `./eval-rubric.ts`.
- Produces: `aggregateCell(records) -> CellSummary` (`{cellId, scoredUnder, n_attempted, n_graded, lengthFlagged, mean, sigma, histogram:{done,stalled,timeout,failed}, indeterminate, lengthMajority}`); `compareCellTriage(aScores, bScores) -> {meanDiff, ciLo, ciHi, tied}`; `ciOnMeanDifference(a, b)`. Pure — reads only records.

- [ ] **Step 1: failing tests (TDD)** — E2 (length-flag, never `mean:0.33`), E3 (histogram), sigma (Bessel), triage ties, mean-of-graded-only.
- [ ] **Step 2: run → FAIL** (`aggregateCell is not defined`).
- [ ] **Step 3: implement** the pure module.
- [ ] **Step 4: run → PASS**.
- [ ] **Step 5: commit** — `feat(eval): pure aggregateCell summary + triage (EV-21 shared)`.

### Task 3: RunManifest extension — `runs.ts` `sumSubtree` + `RunManifest` fields + `hub.ts` persist

**Files:**
- Modify: `extensions/runs.ts` (`RunManifest` gains `usage` + `stopReason?`; new `sumSubtree`)
- Modify: `extensions/hub.ts` (`writeJobManifest` persists `job.usage` + `job.stopReason`)
- Test: `test/eval-runner.test.ts` (failing first: manifest round-trip + sumSubtree + hub persist)

**Interfaces:**
- Consumes: existing `writeManifest`/`readManifests`/`RunManifest`; `Hub`.
- Produces: `RunManifest.usage: {input,output,cost,turns}` and `RunManifest.stopReason?`; `readManifests` round-trips them; `sumSubtree(manifests, rootId, metric="cost")` sums `usage[metric]` over the subtree rooted at `rootId` inclusive; `Hub.writeJobManifest` persists usage/stopReason at settle.

- [ ] **Step 1: failing test** — (a) unit: write a `RunManifest` carrying `usage`+`stopReason` via `writeManifest` → `readManifests` round-trips them; prior to the type extension this fails at TS because the fields aren't on the type. (b) `sumSubtree` of a 3-deep `parentJobId` chain equals the hand-computed sum → fails (`sumSubtree` undefined). (c) hub-runtime: a settled stub job's on-disk manifest carries `usage.turns===1` and `stopReason==="stop"` → fails today (fields absent).
- [ ] **Step 2: run → FAIL** (as above).
- [ ] **Step 3: implement** — extend `RunManifest`, add `sumSubtree`, update `writeJobManifest`.
- [ ] **Step 4: make the existing `test/hub.test.ts` "run-aware hub writes manifests" still pass** (it checks state/exitCode/settledAt only — safe), and run.
- [ ] **Step 5: commit** — `feat(runs): RunManifest usage/stopReason + sumSubtree (EV-16 §7)`.

### Task 4: Dispatch primitive `extensions/dispatch.ts`

**Files:**
- Create: `extensions/dispatch.ts`
- Test: `test/eval-runner.test.ts` (override-path probe: seeded seat spawned at `cwd=scratch` carries the same override semantics as `council_dispatch`)

**Interfaces:**
- Consumes: `loadSeat`-style `Seat`, `resolveEffectiveModel`/`buildChildArgv` from `./seats.ts`, `childEnv`/`ensureRunDir`/`mintRunId` from `./runs.ts`, `getMcpManager` from `./mcp/index.ts`, `Hub` from `./hub.ts`.
- Produces: `spawnSeatJob(opts: { repoRoot, hub, seat, input, cwd, timeoutMs, stallMs, model?, thinking?, cellId?, isModelAvailable }) -> { jobId, seat, model, warnings[] }`. Mirrors `council_dispatch`'s execute(): override resolution → catalogue check (throws on unknown, naming the effective model) → spawn-env with `COUNCIL_EVAL_MODEL` (only when overridden) → `buildChildArgv` → `childEnv` → `hub.spawnJob({ cwd, ... })`. `cwd` defaulted to `repoRoot`; the eval runner passes `cwd=scratch`.

- [ ] **Step 1: failing test** — dispatch a seeded seat; assert the spawned job's `cwd === scratch`, the root argv carries the effective `--model`, the job env carries `COUNCIL_EVAL_MODEL`, and the manifest `model` matches — fails (`spawnSeatJob` undefined).
- [ ] **Step 2: run → FAIL**.
- [ ] **Step 3: implement** `spawnSeatJob` (and a thin `catalogueCheck` helper) reusing the shared functions; leave `hub-tools.ts` untouched.
- [ ] **Step 4: run → PASS**; verify `test/override.test.ts` still green (untouched).
- [ ] **Step 5: commit** — `feat(eval): shared dispatch primitive parameterized by cwd`.

### Task 5: Store writers + grade-and-persist + parseEvalArgs in `extensions/eval-runner.ts`

**Files:**
- Create: `extensions/eval-runner.ts`
- Test: `test/eval-runner.test.ts`

**Interfaces:**
- Consumes: `eval-stats.ts`, `eval-rubric.ts` (`gradeCell`, `projectVerdictRecord`, `replayJudgeVerdicts`, types), `eval-fixtures.ts` (`loadFixture`, `applyRulings`, `sha256Tree`), `dispatch.ts`, `runs.ts` (`readManifests`, `sumSubtree`, `writeAtomic`).
- Produces:
  - `REPEAT_DEFAULT = 3`, `REPEAT_CAP = 20`, `SCORED_UNDER_SELF = "self"`.
  - `parseEvalArgs(args) -> { task?: string; models: string[]; repeat: number; persistSnapshot: boolean }` (pure).
  - `evalResultsDir(repoRoot)`, `ensureEvalDir(repoRoot)`, `sanitize(seg)`.
  - `verdictStorePath(store, cellId, repeat, gradedBy, fv, rv)` / `resultStorePath(store, cellId, repeat, scoredUnder, fv, rv)`.
  - `writeVerdictRecord(store, record)` — atomic, absent→new, same→no-op, divergent→throw.
  - `writeResultRecord(store, record, cellScope)` — same semantics; attaches `cellScope` (`{usage:{input,output,cost,turns}, elapsedMs, stopReason?, repoState}`).
  - `readAllResults(store): StoredResultRecord[]`.
  - `isGateOnlyFixture(rubric): boolean` (no `judge` criterion).
  - `persistCellSnapshot(store, cellId, repeat, scratchDir, persist)` — copies `scratch` to `snapshot/` when persist.
  - `cellCostCell(callers, scratch, driverId)` — callerSide driver usage + `sumSubtree` of scratch manifests rooted at driverId.

- [ ] **Step 1: failing tests (TDD per §10)** — grammar (10), store key (3), gate-only sentinel (4), snapshot persist + `--no-persist-snapshot` keeps `repoState` (5), VerdictRecord repeat round-trip via writers (2).
- [ ] **Step 2: run → FAIL**.
- [ ] **Step 3: implement** the module (writers + parse + persistCellSnapshot + isGateOnly).
- [ ] **Step 4: run → PASS**.
- [ ] **Step 5: commit** — `feat(eval): store writers + parseEvalArgs (Q1/Q2 keys, self sentinel)`.

### Task 6: Cell driver — `runCellAndGrade` + matrix driver + GradeIO binding

**Files:**
- Modify: `extensions/eval-runner.ts`
- Test: `test/eval-runner.test.ts` + smoke Phase 3

**Interfaces:**
- Consumes: `dispatch.ts`, `runs.ts`, `eval-fixtures.ts`, `eval-rubric.ts`, `eval-stats.ts`.
- Produces: `bindGradeIO(scratch, runId): GradeIO` (readFile/jobState against scratch manifests + files; `run` via execFile); `readBothRoots(caller, scratch, runId): { callers: RunManifest[]; scratch: RunManifest[] }`; `runCellAndGrade(scratchDir, runId, caller, persist, opts)` — settle → read both-roots manifests → GradeIO on scratch → for a judge-bearing fixture dispatch the judge once per (cell,repeat) with `model=fixture.graderModel` (beats env) and `cellId`, extract verdict (indeterminate on empty/length) → `gradeCell` → `writeResultRecord` (+ VerdictRecord if judge) → if persist snapshot → rm scratch (try/finally). Also `runMatrix({repoRoot, hub, taskId, models, repeat, persist, isModelAvailable, echo, line})` returning per-cell summaries via `aggregateCell(readAllResults(store))`.

- [ ] **Step 1: failing test (recording harness)** — a fake `GradeIO` + recorded cell report drives `persistCellRun` and produces the expected ResultRecord+VerdictRecord files (repeat keyed), gate-only → `"self"` with no verdict. Fails (`persistCellRun`/wires absent).
- [ ] **Step 2: run → FAIL**.
- [ ] **Step 3: implement** `runCellAndGrade` + `bindGradeIO` + `runMatrix`.
- [ ] **Step 4: run → PASS** (pure/recording tests; real stub dispatch test for the `cwd=scratch` invariant from Task 4).
- [ ] **Step 5: commit** — `feat(eval): cell driver runs in scratch + harness-owned grade`.

### Task 7: Register `/council-eval` in `extensions/index.ts`

**Files:**
- Modify: `extensions/index.ts`
- Test: source probe in `test/eval-runner.test.ts` (command name + hint registered; no-arg path builds the list)

**Interfaces:**
- Consumes: `runMatrix`, `parseEvalArgs`, `listFixtureTasks`, `evalResultsDir`/`readAllResults`, `aggregateCell`.
- Produces: the `/council-eval` command handler: parse → no-arg list | echo-then-run → `runMatrix` with `[council-eval]` transcript lines + summary projection → render via `ctx.ui.notify`/print.

- [ ] **Step 1: failing test** — source probe asserts `index.ts` registers `registerCommand("council-eval", ...)` with a handler that calls `parseEvalArgs`; fails (absent).
- [ ] **Step 2: run → FAIL**.
- [ ] **Step 3: implement** the command + a `renderSummary(lines)` pure helper producing `[council-eval]` lines and the per-cell table from `aggregateCell` output.
- [ ] **Step 4: run → PASS**; full suite green.
- [ ] **Step 5: commit** — `feat(eval): /council-eval slash command (echo-then-run + summary)`.

### Task 8: Smoke Phase 3 (Q3) — fourth phase

**Files:**
- Modify: `smoke/fixture/council/fixtures/eval-smoke/{fixture.json,rubric.json}` (add)
- Modify: `smoke/driver.sh` (add phase 3)
- Modify: `smoke/assert.sh` (add assert helpers: snapshot dirs exist, `[council-eval]` transcript lines, aggregateCell byte-identical live vs re-derivation)

**Interfaces:**
- Consumes: the gate-only fixture loader + `/council-eval`.
- Produces: a minimal gate-only fixture (one model `openrouter/deepseek/deepseek-v4-flash-0731`, two repeats) and the phase-3 driver assertions.

- [ ] **Step 1: add the fixture** (gate-only rubric; credential-free).
- [ ] **Step 2: add phase 3 to `driver.sh`** — drive `pi -p "/council-eval <task> <model> --repeat 2"`, then assert (a) `council/eval-results/<cellId>/r1/`+`r2/` with `snapshot/`, (b) `[council-eval]` transcript lines, (c) `aggregateCell(readAll(cellId))` byte-identical live vs re-derivation, (d) validate.py green.
- [ ] **Step 3: bash syntax sanity-check** (`bash -n`), no container build.
- [ ] **Step 4: commit** — `feat(smoke): Phase 3 council-eval matrix seam (Q3)`.

### Task 9: Full gates + PR

- [ ] `bunx tsc --noEmit` clean (strict).
- [ ] `bun test` full suite green (integration still gated off).
- [ ] `python3 council/validate.py` clean.
- [ ] Push `feat/ev20-matrix-runner`; open PR vs `main`; record PR number + gate output; do not poll CI or merge.
