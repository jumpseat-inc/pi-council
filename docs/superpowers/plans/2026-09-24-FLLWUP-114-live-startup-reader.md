# FLLWUP-114 — Live-smoke verification of the pre-injected runner transcript surface — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `SMOKE_PHASE=7` — a live smoke phase dispatching a real `council-runner` against the dispatchable fixture card EV-2, asserting from the runner's real session transcript that its startup toolCalls contain no Read against `council/procedures/council.md|features-deliver.md` (AC2), that its first toolCall is not under `council/procedures/` (AC3), with liveness anchors asserted first — plus a deterministic two-attempt replay (offline faux-provider harness) asserting retried attempts carry byte-equal first user-message blocks (AC4).

**Architecture:** Part A = a pure reader `readRunnerStartup` in `smoke/read-runner-startup.ts` (unit-tested from the existing `test/ev90-runner-input.test.ts` — AC5-safe) + a bounded dispatch harness in `smoke/phase7-dispatch.ts` + `phase7_run()` wired into the existing SMOKE_PHASE selector in `smoke/driver.sh`, and the same reader called at zero added model time from full-path Phase 2. Part B = closing the `card_id` knob gap in `test/faux-provider/extension.ts` + `harness.ts`, then extending the EV-56 treatment arm (`test/ev41-seat-child-live.test.ts`, existing file) with the cross-attempt transcript-equality assertions.

**Tech Stack:** bun/TypeScript, bash driver, the EV-56 offline faux-provider harness, real `pi -p` + real Hub inside the smoke container.

**Spec:** `docs/superpowers/specs/2026-09-24-FLLWUP-114-design.md` (settled; the deliberation record in `council/cards/FLLWUP-114.md` is the binding history, including skeptic O1's closed-red fix: dispatch EV-2, never EPIC-1).

## Global Constraints

- Work ONLY inside a dedicated git worktree (`git worktree add`); never `git checkout/switch/reset` against the main repo path.
- AC5: no new file under `test/` matched by default `bun test` discovery. New test code lives only inside existing `test/` files (`ev90-runner-input.test.ts`, `ev41-seat-child-live.test.ts`, `faux-provider-shape.test.ts`); new standalone files live under `smoke/` (bun discovers nothing there).
- Default-suite wall-clock stays inside the 180s drift threshold ([[test-suite-budget]]; measured ≈113s at the skeptic's probe). The Part B replay extension rides an existing live arm and must stay ≲5s added.
- Transcript vocabulary is pi's lowercase names (`read`, `bash`, `council_dispatch`); `firstArgOf` (transcript.ts) is the single first-argument derivation.
- Liveness anchors (≥1 toolCall; ≥1 `council_dispatch`-labeled toolCall; exactly one non-empty `<council-procedure>` user block also carrying `<features-deliver-overlay>`) are asserted BEFORE AC2/AC3 — a transcript missing any anchor FAILS the reader.
- The failing retry must be the MODEL call: `stopReason: "error"` with the with-colon literal `Provider finish_reason: error`, so `classifyRetry` (retry.ts) returns `"retry"`. No other seam retries.
- The child shim registers the provider unconditionally and gates the FAILING call on `--session-id` in `process.argv` (the guard is load-bearing — the parent also loads the shim).
- The dispatch step must carry `card_id` (knob-gated); the scratch card face EV-2 has a byte-0-anchored frontmatter block with a trailing newline.
- Artifacts under `smoke/.artifacts/` (dot-dir, gitignored).
- Never lower a threshold, never silence a finding, never narrow scope to pass a gate. Conventional Commits.

## Review Focus

- A transcript located by the WRONG seam (the `RUNNER_SESSIONS` grep matches `.json` manifests, not sessions) — the reader must locate only via `readManifests` → `findSessionFile`; expect: grep-based selection never locates a JSONL and the reader reds.
- A post-failure child session with ZERO toolCalls — anchors must red before AC2/AC3 can pass vacuously (skeptic O5).
- `blocks[0]` as the compared object — two empty/absent first blocks are byte-equal; the compared block must be LOCATED by the `<council-procedure>` marker, exactly one per transcript.
- Whole-block byte-equality including `at` — the derived timestamp is the sole volatile; `{kind, text}` is the stable projection, and `at` must be asserted to DIFFER.
- A literal `Read` label match — pi labels are lowercase; a case-sensitive match passes vacuously forever.
- The EPIC-1 face refusal — `epic: null` fail-louds at dispatch (`cardEpicKey`); dispatching it measures nothing (skeptic O1 closed-red).

---

### Task 1: Worktree isolation

**Files:** none created in the main checkout.

- [ ] **Step 1: Create the worktree from current main (e6a901f)**

```bash
cd /home/tista/codes/pi-council
git worktree add .worktrees/fllwup-114 -b feat/fllwup-114-live-startup-reader
cd .worktrees/fllwup-114
bun install
```

- [ ] **Step 2: Commit the plan inside the worktree**

Copy this plan file into the worktree (`docs/superpowers/plans/…`), commit: `docs(plans): FLLWUP-114 implementation plan`.

### Task 2: Pure reader — failing tests first (TDD red)

**Files:**
- Modify: `test/ev90-runner-input.test.ts` (existing file — append the reader test block)
- Create (later, Task 3): `smoke/read-runner-startup.ts`

**Interfaces:**
- Consumes: `parseTranscript`/`firstArgOf` (extensions/transcript.ts), `runsDir`/`listRunIds`/`readManifests`/`findSessionFile` (extensions/runs.ts), `composeRunnerInput` (extensions/seats.ts — already imported by this test file).
- Produces: `readRunnerStartup(repoRoot: string, cardId?: string): { runId: string; sessionId: string; file: string }` — THROWS on every failure (the smoke driver treats a non-zero exit as the red verdict; throw messages carry the reason: `fllwup114-reader:`-prefixed).

- [ ] **Step 1: Write the failing tests** (append to `test/ev90-runner-input.test.ts`):

A local helper writes a synthetic runs substrate into a fresh `fs.mkdtempSync` dir (never the real repo):
- `runsDir = path.join(root, CONFIG_DIR_NAME, "council", "runs")`; `run.json` (`{runId, startedAt, repoRoot, hostPid}`); manifest JSON files with the `RunManifest` fields; session JSONL files whose first line carries `{"type":"session","id":"<sessionId>",...}` (so `findSessionFile`'s header-`id` scan resolves them — test/transcript.test.ts's fixture shape).
- The happy runner session's first user block text = `composeRunnerInput(root, "EV-2", ...)` written into a scratch `council/cards/EV-2.md` face with `epic: EPIC-1` (byte-0 `---` + trailing newline) — the REAL composed bytes, not a hand-typed string; assistant entries carrying toolCall parts (`name: "read"`, `arguments: {path: ...}` and `name: "council_dispatch"`, `arguments: {seat: ...}` — first string arg per `firstArgOf` = `arguments`' first string value).

Tests (each names the AC it pins):
1. **happy path** — happy fixture → resolves, returns the session file path; no throw.
2. **anchors: zero toolCalls** → throws with the anchors message.
3. **anchors: no council_dispatch** → throws.
4. **anchors: user block without `<council-procedure>`** → throws; **empty first user block** → throws; **no `<features-deliver-overlay>`** → throws.
5. **AC2 red** — planted `read` toolCall with first arg ending in `council/procedures/council.md` BEFORE the dispatch → throws with the AC2 message.
6. **AC2 case-insensitivity** — same planted call labeled `READ` → still throws (never vacuous).
7. **AC3 red** — transcript whose FIRST toolCall reads `council/procedures/x.md` → throws with the AC3 message; a first `write` toolCall (path NOT under `council/procedures/`) passes.
8. **selection: descendants ignored** — a non-runner manifest + descendant session → reader picks the runner session; **multiple runs** — the latest runner manifest wins (two run dirs, older startedAt loses).
9. **AC2 window ends at the dispatch** — a `read` of `council/procedures/council.md` AFTER the first `council_dispatch` toolCall does NOT throw (the window is before-the-first-dispatch only).

- [ ] **Step 2: Run to verify red** — `bun test test/ev90-runner-input.test.ts` → fails on the unresolvable `smoke/read-runner-startup.ts` import. Record the red output.

### Task 3: Pure reader implementation (TDD green)

**Files:**
- Create: `smoke/read-runner-startup.ts`
- Also: a CLI entry in the same file (`if (import.meta.main)`) — `bun smoke/read-runner-startup.ts <repoRoot> [cardId]` → calls the reader; on throw prints the message to stderr and `process.exit(1)`; on success prints a one-line verdict and exits 0. The driver consumes the CLI.

- [ ] **Step 1: Implement** exactly:
  - `runsDir(repoRoot)` → `listRunIds(repoRoot)` (latest-run first) → `readManifests(repoRoot, runId)` → filter `seat === "council-runner"` → `findSessionFile(repoRoot, runId, m.sessionId)`; first resolvable wins. NEVER a grep.
  - `parseTranscript(readFileSync(file, "utf-8"))`.
  - ANCHORS (in order): ≥1 `kind:"toolCall"`; ≥1 toolCall with `(label ?? "").toLowerCase() === "council_dispatch"`; the FIRST user block: non-empty text, contains `<council-procedure>` and `<features-deliver-overlay>`; EXACTLY ONE user block contains `<council-procedure>`; when `cardId` given, the first user text also contains the literal `cardId` (marker-consistency).
  - AC2: let `dispatchIdx` = index of the first `council_dispatch`-labeled toolCall; every toolCall with `(label ?? "").toLowerCase() === "read"` at index < `dispatchIdx` must NOT have `firstArgOf(b)` ending in `council/procedures/council.md` or `council/procedures/features-deliver.md`.
  - AC3: `firstArgOf(blocks[0] where kind==="toolCall")` — the transcript's FIRST toolCall block — must not have a first arg starting with `council/procedures/` (or containing `council/procedures/`).
  - All failures throw `Error("fllwup114-reader: <reason>")` naming the violated assertion.

- [ ] **Step 2:** `bun test test/ev90-runner-input.test.ts` → green (all reader tests). Record output.
- [ ] **Step 3:** `bunx tsc --noEmit` → green. Commit: `feat(smoke): readRunnerStartup — the pure runner-startup transcript reader (FLLWUP-114 Part A)`.

### Task 4: card_id knob — failing tests first (TDD red)

**Files:**
- Modify: `test/faux-provider-shape.test.ts` (existing file; the dispatch-shape assertions live here)

**Interfaces:**
- Consumes: `buildHarnessEnv`/`serializedResponses`-style existing helpers in that file (follow its current structure).
- Produces: knob `EV40_CARD_ID` (env) → `ArmOptions.cardId?: string` → the dispatch step's `council_dispatch` tool call arguments carry `card_id`.

- [ ] **Step 1: Write the failing tests:**
  1. env `EV40_CARD_ID=EV-2` with the dispatch knob on → the serialized scripted dispatch step contains `"card_id":"EV-2"`.
  2. no `EV40_CARD_ID` (with the dispatch knob on) → the serialized dispatch step contains NO `card_id` key at all (byte-identity guard for every existing arm).
- [ ] **Step 2:** run the file → red. Record output.

### Task 5: card_id knob implementation (TDD green)

**Files:**
- Modify: `test/faux-provider/extension.ts` (read `EV40_CARD_ID` at load; spread `...(CARD_ID ? { card_id: CARD_ID } : {})` into the `dispatchStep` tool-call args; document the knob in the header comment)
- Modify: `test/faux-provider/harness.ts` (`ArmOptions.cardId?: string`; `...(opts.cardId ? { EV40_CARD_ID: opts.cardId } : {})` in `harnessEnv` — knob-gated so existing arms' env stays byte-identical)

- [ ] **Step 1:** implement both edits.
- [ ] **Step 2:** `bun test test/faux-provider-shape.test.ts` → green; `bun test test/faux-provider-shape.test.ts test/faux-provider/` whole harness suite green. Commit: `test(harness): knob-gated card_id on the faux dispatch step (FLLWUP-114 Part B prep)`.

### Task 6: Part B replay — cross-attempt transcript equality (green-on-arrival; both directions verified)

**Files:**
- Modify: `test/ev41-seat-child-live.test.ts` (existing file — the treatment test gains the Part B assertion block; AC5-safe: no new file)
- Modify: `test/ev41-seat-child-live.test.ts` treatment `repo`: add a scratch card face `council/cards/EV-2.md` (frontmatter `id: EV-2`, `epic: EPIC-1`, byte-0 + trailing newline) to `extraRepoFiles`.

**Interfaces:**
- Consumes: `parseTranscript` (new import), `attemptEntries` (new import alongside `findSessionFile`), the treatment arm's existing artifacts (manifest attempts[] = job-1 / job-1-attempt2).
- Produces: the card's AC4 assertion, live in the default suite.

- [ ] **Step 1: Add the assertion block** after the existing manifest assertions:
  - `attemptEntries(manifest)` → exactly the two sessions.
  - `parseTranscript(readFileSync(findSessionFile(...)))` per attempt; per transcript collect user blocks whose text contains `<council-procedure>` → EXACTLY one, non-empty, text contains `<features-deliver-overlay>`.
  - `JSON.stringify({kind, text})` of the two located blocks byte-equal; `at` values DIFFER (load-bearing exclusion).
- [ ] **Step 2:** run `bun test test/ev41-seat-child-live.test.ts` → green (establishes GREEN-ON-ARRIVAL). Time the file.
- [ ] **Step 3: Negative control (must red, NOT landed):** in a scratch copy of the worktree, `sed`-mutate `extensions/seats.ts`'s `composeRunnerInput` return (append a per-composition sentinel to the joined string), rerun the file → the new assertions RED with the equality message; record the verbatim red output in the run report; revert the scratch copy (nothing lands). Also record the `at`-differing values from the Step-2 run.
- [ ] **Step 4:** commit: `test(ev56): cross-attempt first-user-block byte-equality over the real retry seam (FLLWUP-114 Part B)`.

### Task 7: SMOKE_PHASE=7 wiring

**Files:**
- Create: `smoke/phase7-dispatch.ts` — pure post-settle wait harness: `bun smoke/phase7-dispatch.ts <repoRoot> <cardId>`; polls `listRunIds`/`readManifests`/`findSessionFile` for the latest council-runner manifest + session JSONL; success the moment the parsed transcript carries ≥1 `council_dispatch`-labeled toolCall (startup window complete) or the runner's manifest settles; exit 1 on the ceiling; exit 2 on usage. NEVER judges AC2/AC3 (the reader does). Prints a short evidence line for the driver log.
- Modify: `smoke/driver.sh` —
  - new `phase7_run()`: cd `$WORK`; run `bash smoke/phase7-runner-spawn.sh` (background, PID captured); poll `bun smoke/phase7-dispatch.ts "$WORK" "EV-2"` (per-poll timeout 120s) until exit 0 (proceed) or ceiling; ALWAYS `kill "$RUNNER_PID" 2>/dev/null || true; wait "$RUNNER_PID" 2>/dev/null || true`; then `(cd "$PKG" && bun smoke/read-runner-startup.ts "$WORK" "EV-2")` as the verdict.
  - new `smoke/phase7-runner-spawn.sh` — the one backgrounded bootstrapper: `cd "$WORK"`, export `OPENROUTER_API_KEY`, `exec pi --approve --model "$FLASH" -p "Dispatch the council-runner for card EV-2 now. council_dispatch: seat council-runner, card_id EV-2, input: Run the /features-deliver flow for EV-2 within your procedures. Do not dispatch any other seat from the parent context."` (env inherited from driver.sh: `FLASH`, `PHASE7_TIMEOUT`).
  - new fixture file `smoke/fixture/.pi/extensions/runner-startup-shim.ts` — registers a faux provider named `fllwup114-offline` unconditionally; when `--session-id` IS in `process.argv` (a seat child), exports a default extension whose scripted provider returns one deterministic tool-call turn (a `write` of the literal line `fllwup114-runner-startup <council-procedure> <features-deliver-overlay> $ARGUMENTS`-echoing marker into `runner-startup-marker.txt` — proving the composed input reached the runner) and then stops. When `--session-id` is ABSENT (the parent) → no-op (the guard is load-bearing). The phase uses the model id `fllwup114-offline/fllwup114-flash` via a fixture `.council.json` override entry for `council-runner` — the phase NEVER spends real model tokens on the runner turn.
  - the fixture runner turn: seat `council-runner` override body instructs the runner to write the marker file then dispatch owner once, wait, stop.
  - selector: `SMOKE_PHASE=7` accepted in the isolation path (5/6/7); full path: after phase 2's existing `council-runner dispatch evidence` block, call the reader at zero added model time: `(cd "$PKG" && bun smoke/read-runner-startup.ts "$WORK") || fatal ...`.
  - fixture `.council.json` gains the runner override entry. `bash -n smoke/driver.sh` after every edit.

- [ ] **Step 1:** write `smoke/phase7-dispatch.ts` + fixture shim + override + spawn script; wire `phase7_run` + selector + full-path call.
- [ ] **Step 2:** `bash -n smoke/driver.sh` green. Docker build only (the container run is the live deliverable, executed via `SMOKE_PHASE=7 bash smoke/run.sh` when infrastructure permits; a docker-unavailable environment records that the live run is the residual deliverable, per O5).
- [ ] **Step 3:** commit: `feat(smoke): SMOKE_PHASE=7 — live runner-startup falsifier + zero-cost phase-2 reader reuse (FLLWUP-114)`.

### Task 8: Docs (wiki + card note)

**Files:**
- Modify: `vault/wiki/smoke-test.md` — document phase 7 (dispatchable-card rule: EV-2/EV-3, never EPIC-1's `epic: null` face; startup-window scope; the reader). Fix the stale `driver.sh:131–145` "only 5 and 6" reference if the page carries it.
- Modify: `council/cards/FLLWUP-114.md` — state: owner implemented on branch X, PR URL (added after push), gate results.

- [ ] **Step 1:** write both. Commit: `docs(wiki): SMOKE_PHASE=7 phase record (FLLWUP-114)`.

### Task 9: Gates (in order, hard stops)

- [ ] **Gate 1 typecheck:** `bunx tsc --noEmit` → must pass.
- [ ] **Gate 2 tests:** `bun test` full suite → green; record counts + wall clock; verify ≤180s.
- [ ] **Gate 3+4 preflight:** `bash council/preflight.sh FLLWUP-114` → PASS (local gate evidence trusted only after this; the repo's gates 3/4 are subsumed by preflight + the green suite per this repo's tooling).

### Task 10: Push + PR + report

- [ ] `git push -u origin feat/fllwup-114-live-startup-reader`; `gh pr create` — body names the card, summarizes Part A + Part B, lists gate results.
- [ ] Report: branch, PR URL, head SHA, gate results, files changed, explicit statement of the Part B surface location (default-suite extension of an existing live arm, ≲5s added — the AC5 "no new file" reading) and any residual (live container run status).
