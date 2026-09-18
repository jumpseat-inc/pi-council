# FLLWUP-56 — seat-child live arm Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A falsifier for the seat child's own provider-error path — the
parent-turn offline faux-provider harness reaching a real seat child — plus
its live-arm budget accounting per FLLWUP-48's standing rules.

**Architecture:** One new test file `test/ev41-seat-child-live.test.ts` with
exactly two arms (treatment + control). Each arm drives a real print-mode pi
parent via `runHarnessArm` with a new opt-in scripted `council_dispatch` →
`council_wait` turn (`EV40_TOOLCALL_WAIT=1`), whose dispatch spawns a real
seat child (`command: "pi"` resolved through a scratch PATH shim) in a
scratch repo carrying exactly the two O7-named carriers: a `.pi/extensions`
shim (dynamic-import re-export of the shared faux-provider extension, argv-
keyed attempt discriminator, full `EV40_*` env strip) and a `.council.json`
seat-model + retry override. The parent stays alive across the backoff
window because `hub.wait` blocks while `job.state === "retrying"`
(`hub.ts` `isSettledForWait`).

**Tech Stack:** bun:test, the shared faux-provider harness
(`test/faux-provider/harness.ts` + `extension.ts`, additive knob-gated
changes only), the real engine modules (`loadSeat`/`buildChildArgv` asserted
directly; everything else exercised through real processes).

**Spec:** `docs/superpowers/specs/2026-09-18-FLLWUP-56-design.md` (the
design authority; the plan argues from it).

## Global Constraints

- Zero changes under `extensions/` (spec §8); `buildChildArgv` untouched.
- The (b) stub arm block in `test/ev41-retry-e2e.test.ts`,
  `test/stub-child.ts`, `test/faux-provider-shape.test.ts`, `smoke/`,
  `council/preflight.sh`, `.github/workflows/gates.yml`, `package.json` —
  untouched.
- No `fauxProvider(` token in any new file (shape witness test 2); the
  scratch shim re-exports the single shared extension.
- No user-visible copy; no new env flag beyond `EV40_TOOLCALL_WAIT` (plus
  the existing `EV40_TOOLCALL_*` plumbing); no `council/preflight.sh`
  string. `PI_OFFLINE=1` is pi's own documented var (inside the carve-out).
- Correctness requirements (Skeptic-confirmed): dynamic `await import()`
  shim (never static re-export, O5); attempt discriminator keys on
  `process.argv --session-id` (never `COUNCIL_JOB_ID`, O4); the shim strips
  ALL leaked `EV40_*` knobs (O7); assertions name the `council_wait`
  toolResult as the carrier (O3).
- Ceilings (spec §6): inner per-attempt `timeout_minutes: 0.5`,
  `stall_minutes: 0.5`; outer bun ceiling `120_000` per arm; expected block
  wall clock ≈18–30s, stated verbatim in the test header; `bun install`
  first on any re-measure; 180s stays the drift threshold.
- Perturbation-red framing: the mechanism exists at base; the arm is
  expected green at base; no manufactured base red. The perturbation (omit
  the `.pi/extensions` shim write) must red on the named model-resolution
  failure, not a timeout — recorded as a probe, not a committed test (the
  committed file has exactly two arms).

---

### Task 1: harness plumbing (additive, knob-gated)

**Files:**
- Modify: `test/faux-provider/harness.ts` (`ArmOptions`, `harnessEnv`,
  `EngineRepoOptions`/`writeEngineRepoFiles`)
- Modify: `test/faux-provider/extension.ts` (scripted `council_wait` step)

**Interfaces:**
- Produces: `ArmOptions.toolcallDispatch?: boolean`,
  `ArmOptions.toolcallWait?: boolean`,
  `ArmOptions.extraEnv?: Record<string, string>`,
  `ArmOptions.pathPrepend?: string[]`,
  `EngineRepoOptions.extraRepoFiles?: Array<{ path: string; body: string }>`.
  With none set, every existing arm's env and argv are byte-identical.

- [ ] **Step 1: extension — the `EV40_TOOLCALL_WAIT` step (knob-gated).**

  In `test/faux-provider/extension.ts`, next to the existing
  `EV40_TOOLCALL_DISPATCH` block: read `TOOLCALL_WAIT` at module scope; when
  set, emit a `council_wait` tool-call step (after `dispatchStep`) with
  `{ job_ids: ["job-1"], timeout_minutes: 2 }` and switch the dispatch step's
  per-attempt ceilings to the spec's inner bounds
  (`timeout_minutes: 0.5`, `stall_minutes: 0.5`). With no knob set, the
  response list and dispatch step are byte-identical to today.

- [ ] **Step 2: harness — forward the knobs and the scratch substrate.**

  - `ArmOptions` gains `toolcallDispatch`, `toolcallWait`, `extraEnv`,
    `pathPrepend` (all optional; commented FLLWUP-56).
  - `harnessEnv`: prepend `pathPrepend` dirs to `PATH`; append
    `EV40_TOOLCALL_DISPATCH=1` / `EV40_TOOLCALL_WAIT=1` when set; spread
    `extraEnv` last (the test passes `{ PI_OFFLINE: "1" }` — the child has
    no `--offline` flag; `docs/settings.md` documents the var).
  - `EngineRepoOptions` gains `extraRepoFiles`; `writeEngineRepoFiles`
    writes them (relative paths) after the existing `.council.json` write.

- [ ] **Step 3: verify existing arms are untouched.**

  Run: `bun test test/ev40-headless.test.ts test/ev43-reachability.test.ts`
  (fast live-arm files) — all green; grep confirms no knob set anywhere
  except the new file.

### Task 2: the two arms (`test/ev41-seat-child-live.test.ts`)

**Files:**
- Create: `test/ev41-seat-child-live.test.ts`

**Interfaces:**
- Consumes: `runHarnessArm`, `parseSessionEntries`, `CLI_PATH`,
  `INJECTED_ERROR_MESSAGE` from `./faux-provider/harness.ts`;
  `loadSeat`, `buildChildArgv` from `../extensions/seats.ts`;
  `CONTINUATION_MARKER` from `./faux-provider/extension.ts`.

Per-arm scratch substrate (generated at runtime, all inside `mkdtempSync`):
a PATH-shim dir whose `pi` script (`printf 'pi\n' > <witness>; exec node
<CLI_PATH> "$@"`) captures the launcher verbatim and deterministically runs
the dev-installed CLI (FLLWUP-21 env-split lesson); and a scratch repo with
`.council.json` (`{"council": {"skeptic": {"model": "ev40/ev40-model"}},
"retry": {…}}` — the real config-injection path), a minimal
`.pi/agents/skeptic.md` seat to shadow, and — treatment only —
`.pi/extensions/ev56-shim.ts` (the dynamic-import shim above). Scratch HOME
(`defaultProjectTrust: "always"`) comes from `prepareHarnessArm` already.

- [ ] **Step 1: write the file** — header states expected wall clock
  (≈18–30s) + ceiling (120s per arm) verbatim (standing rule 1); two
  `test(...)` arms, third positional arg `120_000`; treatment asserts, in
  order: (1) static preconditions (resolved seat model
  `ev40/ev40-model`; `buildChildArgv` contains `-a`, neither `-e` nor
  `--provider`; launcher witness precondition — named throw if `pi`
  unresolvable); (2) the wait toolResult (not the dispatch toolResult)
  carries `state=done` + `EV40-SECOND-RESPONSE`, and the spawned launcher
  witness reads `pi`; (3) manifest `attempts[]` = `[{attempt: 1, sessionId:
  "job-1"}, {attempt: 2, sessionId: "job-1-attempt2"}]` — the timer-owner
  survived; (4) attempt-1 session has `stopReason === "error"` +
  `errorMessage === INJECTED_ERROR_MESSAGE`; (5) attempt-2 session carries
  `EV40-SECOND-RESPONSE`, no error entry, manifest `state: "done"`.
  Control asserts: no `attempt`/`attempts` key in the manifest; exactly one
  child session file; the literal present; no `*-attempt2*` file; no
  `EV40-SECOND-RESPONSE` in any child-session file, the manifest, or the
  wait toolResult.

- [ ] **Step 2: run the file** — `bun test test/ev41-seat-child-live.test.ts`
  (timeout generous; two live arms ≈18–30s). Iterate only on mechanism bugs
  in the test/harness surface (the spec's named fallbacks if the shim
  doesn't load under `-a`, or the in-process drive if the parent turn dies —
  both are escalations to be reported, never silent).

- [ ] **Step 3: run the shape witness + neighbors** —
  `bun test test/faux-provider-shape.test.ts test/ev41-retry-e2e.test.ts`
  green (byte-untouched files, witness intact).

### Task 3: perturbation probe (recorded, not committed)

- [ ] Temporarily omit the `.pi/extensions` shim write (local edit, not
  committed) and rerun the treatment arm: expect red **naming the model**
  (`ev40/ev40-model` unresolvable), not a timeout. Revert. Record verbatim
  output in the card report.

### Task 4: budget accounting (implementing-pass measurement)

**Files:**
- Modify: `README.md` (envelope line), `vault/wiki/test-suite-budget.md`
  (new per-file row; Live-arm share 15 → 17 re-summed; per-arm loop file
  list gains the new file), `AGENTS.md` (envelope line).

- [ ] **Step 1:** `bun install` first, then `time bun test` (full suite)
  and the per-arm loop (`time bun test test/<file>.test.ts` for the five
  live files). Record machine, date, SHA, exact commands.
- [ ] **Step 2:** write the re-measured figures with full provenance into
  the three sites; 180s stays "drift threshold"; if >180s STOP and report.

### Task 5: gates + PR

- [ ] `bash council/preflight.sh FLLWUP-56` → `bunx tsc --noEmit` →
  `bun test` (full, `timeout 600`) → `python3 council/validate.py`, in
  order, on the final committed tree.
- [ ] Push `fllwup-56` to origin; `gh pr create` with a conventional
  commits title; report PR number, head SHA, gate evidence verbatim,
  budget provenance, deviations.
