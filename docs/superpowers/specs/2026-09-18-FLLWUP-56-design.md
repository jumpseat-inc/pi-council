# FLLWUP-56 — Saturate the seat-dispatch provider-error arm onto a config-injected faux provider

Status: settled design (Council deliberation, steps 2–6 of the card's run
record; `council/cards/FLLWUP-56.md`). This document writes up the converged
design; it derives nothing new. The owner implements from this file alone.

## 1. Goal (oracle)

> A falsifier exists for the seat child's own provider-error path — the
> parent-turn offline faux-provider harness reaching a real seat child — and
> its live-arm budget is accounted for in the suite-cost measurement.

Card Intent (binding context): the faux provider is structurally reachable in
a real seat child via a scratch repo's `.pi/extensions` + `.council.json` and
`command: "pi"` with `-a` (`seats.ts:600-621` has no `-e`/`--provider`); the
existing (b) seat-dispatch test (`bun stub-child.ts` Hub test) stays
byte-untouched — this card adds the child-half falsifier and owns its
arm-cost accounting per FLLWUP-48's standing rules.

## 2. Deliverable

One new test file, **`test/ev41-seat-child-live.test.ts`**, containing exactly
two `test(...)` arms:

1. **Treatment arm** — a real `council_dispatch` issued by a real, spawned
   print-mode pi parent (driven by the shared harness), whose seat child (a
   real `pi` process spawned by the engine's own dispatch path) errors on
   attempt 1 with the faux-provider literal and succeeds on attempt 2 after
   the hub's retry supervisor respawns it.
2. **Control arm** — identical setup with the retry policy disabled
   (`retry.enabled: false` in the scratch `.council.json`): exactly one
   spawn, zero respawns, the literal present, no attempt-2 session, no
   `EV40-SECOND-RESPONSE` anywhere.

The drive shape is the **parent-session** drive (a real parent pi process),
not the in-process `registerHubTools` drive: the card's falsifier is "the
parent-turn offline faux-provider harness reaching a real seat child", and an
in-process drive never runs a parent pi session. The in-process drive
(`registerHubTools` as in `test/job-retry.test.ts:236-251`'s hook pattern) is
the **designated fallback** if the parent-session turn fails empirically —
adopting it is an **escalation** (it narrows what the falsifier proves), not
a silent re-scope.

## 3. The drive chain (treatment arm)

1. **Parent.** `runHarnessArm({ councilExtension: true, arm: "none", fails: 0 })`
   from `test/faux-provider/harness.ts`, plus new opt-in knobs (see §4). The
   parent's scripted turn is: `council_dispatch` → `council_wait` →
   success step → settle. The wait step is **required**: `job-retry.ts`
   unrefs the backoff timer, so the retry chain completes only if the
   dispatching process stays alive; `hub.ts:431` (`isSettledForWait`) returns
   `false` while `job.state === "retrying"`, and `council_wait.execute`
   (`await hub.wait(...)`) holds the parent's turn open through the backoff
   window and attempt 2. The parent's PATH is prepended with a scratch `pi`
   shim (`exec node <CLI_PATH> "$@"`) so hub's hardcoded `command: "pi"`
   (`hub-tools.ts:248`) deterministically runs the dev-installed CLI — the
   FLLWUP-21 env-split lesson. The child PATH must likewise resolve `pi`:
   prepend `<repo>/node_modules/.bin` (devDependency symlink; `gates.yml` has
   no pi install step and `spawn(..., shell:false)` does bare-name PATH
   resolution) or substitute `resolveNode()` + `[CLI_PATH, ...argv]`
   (`harness.ts`'s own launcher shape) — either is acceptable; the arm must
   assert which launcher ran and precondition loudly (named throw) if `pi` is
   unresolvable.
2. **Scratch repo** (the arm's cwd → the parent's `repoRoot`), prepared under
   `mkdtempSync`, carries exactly the two O7-named carriers:
   - `.pi/extensions/<shim>.ts` — a runtime-generated **shim** that (a)
     strips all `EV40_*` and `EV40_TOOLCALL_*` knobs the parent's env leaked
     through `childEnv`'s spread (`runs.ts:225-227` ← `spawnEnv =
     {...process.env, COUNCIL_SEAT}` at `hub-tools.ts:240-242`), (b) sets the
     per-attempt script knob keyed on **`process.argv`'s `--session-id`**
     value (`job-1` → `EV40_FAILS=1`; `job-1-attempt2` → `EV40_FAILS=0`;
     `COUNCIL_JOB_ID` is the **same** `jobId` on every attempt —
     `hub-tools.ts:251,273` — and is *not* a valid discriminator; a
     cross-process counter file like `test/stub-child.ts`'s `STUB_STATE` is
     the acceptable alternative), and (c) then loads the shared extension via
     **`await import()`** or an ordered side-effect import — **never** a
     static `export { default } from`, because ESM evaluates dependencies
     before the module body and `extension.ts:63` reads `EV40_FAILS` at
     module top level (Skeptic O5, closed-green). The shim re-exports the
     single shared provider extension (`test/faux-provider/extension.ts`) so
     **no second extension file is born under `test/`** and no `fauxProvider(`
     token appears in any new file (the FLLWUP-49 shape witness, test 2,
     stays untouched).
   - `.council.json` — the seat model override
     (`{"council": {"<seat>": {"model": "ev40/ev40-model"}}, "retry": {enabled:
     true|false, maxAttempts: 2, baseDelayMs: 200, jitter: false}}`), read by
     `loadSeat` → `applySeatOverride(loadCouncilConfig(...))` (`seats.ts`) —
     the real config-injection path, plus a minimal
     `.pi/agents/<seat>.md` seat file for the override to shadow (mirroring
     `test/job-retry.test.ts:192-199`).
   - Scratch HOME with project trust pre-granted
     (`settings.json` `defaultProjectTrust: "always"` or equivalent) and
     `PI_OFFLINE: "1"` in the child env (`docs/settings.md:86` — pi's own
     documented var, not a council-minted flag): the child's argv has no
     `--offline`, and AGENTS.md's "the integration test is the only
     network-touching test" convention must survive.
3. **Dispatch.** The parent's `council_dispatch` call omits the model param —
   the engine resolves the seat from the scratch repo's `.council.json`
   override and the catalogue (`{provider:"ev40", id:"ev40-model"}` must be
   resolvable in the parent's registry via the harness's registered faux
   provider). The engine spawns the real seat child via `buildChildArgv`
   (`seats.ts:600-621`: `--mode json -p -a --session-dir … --session-id …
   --model ev40/ev40-model …`, cwd = scratch repo) with
   `command: "pi"` hardcoded at `hub-tools.ts:248`.
4. **Child behavior.** The child auto-loads the scratch `.pi/extensions` shim
   under `-a`, registers provider `ev40`, and (attempt 1) serves its first
   model call as `stopReason=error, errorMessage="Provider finish_reason:
   error"`. pi does not self-retry that literal (pinned at
   `test/ev41-retry-e2e.test.ts:76-88`). The child's JSON-mode stdout carries
   `stopReason`/`errorMessage` into the hub's job report →
   `classifyRetry` (`retry.ts` — state-independent) → the supervisor respawns
   attempt 2 → attempt 2's child succeeds with `EV40-SECOND-RESPONSE`.

## 4. Harness changes (test files only — zero engine change)

`test/faux-provider/extension.ts` and `test/faux-provider/harness.ts` gain
the opt-in plumbing for the scripted dispatch→wait turn:

- A **`council_wait` script step** in the extension, emitted under a new env
  knob (name it `EV40_TOOLCALL_WAIT`; value `1` ⇒ after the dispatch step the
  parent's next provider call returns a `council_wait` tool call with
  `timeout_minutes` set high enough to cover the chain, e.g. `2`). Today the
  extension scripts only the dispatch step
  (`extension.ts:131-136`) — without the wait step the print-mode parent
  settles, exits, and `shutdownHub` cancels the running attempt-1 child
  (Skeptic O1/principal T1: required, not a nitpick).
- `EV40_TOOLCALL_*` knobs must be plumbed through `ArmOptions`/`harnessEnv`
  (`harness.ts:120-152` forwards none of them today) — the parent's env needs
  `EV40_TOOLCALL_DISPATCH=1` and `EV40_TOOLCALL_WAIT=1`; the child must **not**
  receive them (the scratch shim strips, per §3).
- `EV40_TOOLCALL_MODEL` defaults to `"ev40/ev40-model"` (record correction,
  Skeptic O6: the model param is never omitted — it defaults). The dispatch
  tool call may rely on that default; no "omits the model param" behavior is
  built.
- The **existing** (b) stub arm, the parent-turn arms, and all other harness
  consumers are untouched; the extension changes are additive and knob-gated
  so their behavior with no knob set is byte-identical to today.

## 5. Assertions

**Treatment arm asserts (in order):**

1. Static preconditions (no spawn): the resolved seat's model is
   `ev40/ev40-model`; `buildChildArgv(...)` output contains `-a` and contains
   neither `-e` nor `--provider`; the launcher resolves (`pi` on the prepared
   PATH or the `resolveNode()` fallback).
2. The spawned child command was `"pi"` (captured verbatim), and the parent
   turn's **`council_wait` toolResult** — not the `council_dispatch`
   toolResult (Skeptic O3, closed-green: the dispatch result returns
   immediately, its text is "Dispatched … Use council_wait to collect.", and
   it never carries the child output) — carries final job success and
   `EV40-SECOND-RESPONSE`.
3. The job manifest (`<runDir>/<jobId>.json`, EV-42 shape) has
   `attempts[]` = `[{attempt: 1, sessionId: <jobId>}, {attempt: 2,
   sessionId: <jobId>-attempt2}]` — the pairing written by the timer-owner
   process is the assertion that the parent survived the backoff window.
4. Attempt-1 child session (under the scratch repo's runs dir, parsed by
   `parseSessionEntries`): an assistant entry with `stopReason === "error"`
   and `errorMessage === INJECTED_ERROR_MESSAGE` (imported constant — the
   reachability witness; only the faux provider emits that literal).
5. Attempt-2 child session: an assistant entry containing
   `EV40-SECOND-RESPONSE` and no error entry; manifest final `state: "done"`.

**Control arm asserts:** one spawn, zero respawns, no `attempt` key in the
manifest, attempt-1 session carries the literal, no attempt-2 session, no
`EV40-SECOND-RESPONSE` anywhere.

**Perturbation red (the falsifier's boundary — not a red-base transplant):**
this card's premise is that the mechanism (project-local extension
auto-discovery under `-a`) already exists at base, so a transplanted arm is
**expected green at base** (`vault/wiki/red-base-evidence.md` fields 2/6 not
invoked). The falsifiability is a **mechanism perturbation**: with the
`.pi/extensions` shim write omitted, the child cannot resolve
`ev40/ev40-model` and the dispatch fails **naming the model** — the arm must
red on that named failure, not on a timeout. Record the perturbation result
at step 9; do not manufacture a base red.

## 6. Ceilings and budget accounting (FLLWUP-48 standing rules — binding)

- **Per-attempt inner ceilings:** `timeout_minutes: 0.5`, `stall_minutes: 0.5`
  (30 s each; two attempts ≤ ~61 s worst case).
- **Outer bun ceiling: `120_000` per arm** — deliberately above the inner
  bound (a hang reports attribution, the FLLWUP-48 O7 lesson) and below the
  TUI arm's `300_000`.
- **Expected wall clock: ≈18–30 s for the block** (parent boot ~2–4 s +
  two child sessions + 200 ms backoff + control arm). Stated in the test
  file's header comment verbatim alongside the ceiling — FLLWUP-48 standing
  rule 1.
- **Budget docs re-measured by the implementing pass** (PO ruling, FLLWUP-48
  job-27: the figure comes from the implementing pass, never from
  deliberation): `bun install` **first** (FLLWUP-48 O12), then `time bun test`
  plus the per-arm loop, recorded with full provenance (machine, date, SHA,
  command) and written identically into `README.md` (envelope line),
  `vault/wiki/test-suite-budget.md` (new per-file row
  `test/ev41-seat-child-live.test.ts | 2 | ≈X s`; **"Live-arm share" 15 → 17**
  with the re-summed figure; the per-arm re-measure loop's file list gains the
  new file), and `AGENTS.md` (envelope line). Expected total ≈112–124 s.
- **180 s stays the drift threshold** — unchanged, and not a budget. If the
  implementing pass measures above 180 s, FLLWUP-48 reopens per its standing
  rule; no threshold is moved to fit.
- **Arm baseline:** `3 / 5 / 5 / 2` today → `3 / 5 / 5 / 2 / 2` after (new
  file, two arms). The zero-new-live-arms note in the wiki is superseded by
  this card's own accounting entry (that constraint was scoped to
  FLLWUP-48/49's diffs; this card's whole subject is one new live arm whose
  cost the card owns, per its Intent).

## 7. Escalation boundaries (pre-authorized branches)

1. If the wait-scripted print-mode parent turn fails empirically (the parent
   exits at first settle despite the pending `council_wait` execute), the
   arm reds on the reachability/respawn assertions — the fallback is the
   **in-process `registerHubTools` drive**, and adopting it is an
   **escalation** (it narrows what the falsifier proves), never a silent
   re-scope.
2. If the project-local `.pi/extensions` shim does not load under `-a`
   before argv-model resolution: fallback A is a scratch `settings.json`
   global extension entry (still zero engine change, but the reachability
   claim narrows — the header must say so); fallback B is a runtime
   byte-copy of the extension into `.pi/extensions/`. If neither works
   without an engine flag, that **falsifies the card's premise** and is an
   **escalation**, not a workaround.
3. Any deliverable string outside internal developer tooling/docs (test
   code, test headers, the three budget-doc sites) — e.g. a
   `council/preflight.sh` string or a newly minted env flag — is
   open-judgment: escalate with the drafted string rather than ship it.
   `PI_OFFLINE=1` and the `EV40_*` knob family are pi's own/council's
   existing test-side vars, inside the carve-out.

## 8. Out of scope (boundaries)

- No change to any file under `extensions/` (the premise is zero engine
  change; `buildChildArgv` untouched).
- The (b) stub arm (`bun stub-child.ts` block in
  `test/ev41-retry-e2e.test.ts`) stays byte-untouched; `test/stub-child.ts`
  untouched; the FLLWUP-49 shape witness (`test/faux-provider-shape.test.ts`)
  untouched — the scratch shim lives outside the repo and carries no
  `fauxProvider(` token.
- No `gates.yml` change (FLLWUP-48 PO ruling 2 stands), no `--parallel`, no
  CI wiring changes, no arm moved or removed.
- No `council/cards/**` or `vault/**` edits beyond this card's own records;
  no version bump; no user-visible copy.
- The FLLWUP-48 budget figure is *descriptive, not normative*; the 180 s
  drift threshold is not re-decided here.

## 9. Carried `open-untested` items (implementation-testable, non-blocking)

1. **Print-mode parent liveness across the wait** — settled by the live arm
   itself at step 8/9 (treatment arm green on assertions 2–5, never a
   timeout).
2. **Scratch shim loading under `-a` before argv-model resolution** —
   settled by the live arm; escalation boundaries per §7.2.
3. **Child failure shape under leaked knobs** — settled by a deliberate
   unstripped-knob probe at step 9 if the implementer elects it; the strip
   (§3) is the agreed fix regardless.
4. **Re-measured suite total** — settled by the implementing pass's
   provenance-complete measurement (§6); 180 s governs.

## 10. Gate set (owner, in order, all regardless of diff size)

`bash council/preflight.sh FLLWUP-56` → `bunx tsc --noEmit` → `bun test`
(full suite; the new arms run inside it) → `python3 council/validate.py`.
The known FLLWUP-27 preflight branch-freshness artifact, if it fires
mid-card after a record push advances `origin/main`, is stale-by-construction
and never weakens a gate (step-11 re-run set: `tsc` / `bun test` /
`validate.py`). Card-specific probes: the treatment/control arms green
within their ceilings; the §5 perturbation red; the §6 budget-doc updates
with provenance.
