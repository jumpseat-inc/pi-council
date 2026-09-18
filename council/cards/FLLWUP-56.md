---
id: FLLWUP-56
title: Saturate the seat-dispatch provider-error arm onto a config-injected faux provider
state: Deliberating
owner: null
epic: EPIC-9
goal: A falsifier exists for the seat child's own provider-error path — the parent-turn offline faux-provider harness reaching a real seat child — and its live-arm budget is accounted for in the suite-cost measurement.
---

## Intent

FLLWUP-49's step-4 O7 live half stayed `open-untested` (non-blocking): the faux
provider is structurally reachable in a real seat child via a scratch repo's
`.pi/extensions` + `.council.json` and `command: "pi"` with `-a`
(`seats.ts:600-621` has no `-e`/`--provider`), but running it would
re-architect the seat arm — changing what that falsifier proves — and add a
live arm to FLLWUP-48's budget. Filed as a residual, not a defect: if pursued,
it is a different card whose design owns the arm-cost accounting.

Approved by `product-owner` (job-29) as-is from FLLWUP-49's step-13 draft.

## Run record (features-deliver / FLLWUP-56 — EPIC-9 residuals run 2)

### Step 1 — promotion + classification (facilitator)

- **Promotion (`Backlog` → `Ready`) applied, not asked.** Phase-1 run-2 scope
  ruling (`EPIC-9.md` run-2 block, 284ced2): `FLLWUP-50` through `FLLWUP-60`
  "are this run's delivery scope". `FLLWUP-56` is the **ninth** of eleven in
  the `steward` job-1 build-order ruling ("harness hygiene (`55`, then `56`,
  whose live arm must precede the budget cards)"). Run-2 precedent (FLLWUP-55,
  run-1 precedent 5608ed1): the autonomous promotion moves the residual card
  to its working state at its runner's start. The card's creation was already
  ratified by `product-owner` (job-29, FLLWUP-49 step-13 draft confirmed
  as-is) — that is the promotion-ratification power re-homed per
  `features-deliver.md`'s authority map.
- **Path: full council.** The `goal` fixes the outcome (a falsifier for the
  seat child's own provider-error path — the offline faux-provider harness
  reaching a real seat child) but leaves every design question open: how the
  harness reaches the seat child (scratch repo `.pi/extensions` +
  `.council.json` per FLLWUP-49 O7's structural finding), how the test drives
  the dispatch (a real `council_dispatch` through a spawned parent vs. a
  direct `buildChildArgv` spawn), where the falsifier lives, what it asserts,
  its wall-clock ceiling, and how its live arm is accounted in the
  FLLWUP-48 suite-cost measurement (per FLLWUP-48's standing re-measure rule,
  any new live arm must state expected wall-clock and ceiling in its test
  header and the budget docs re-measured). That is `spec-ambiguous` plus
  `design-judgment` per council.md step 1 — either alone is sufficient.
  Cross-seam-adjacent but not cross-seam in the repo-area sense (test files,
  a scratch fixture tree, and budget documentation; no engine module change —
  the card's premise is that `seats.ts:600-621` needs no `-e`/`--provider`).
- **Surface-touching: no (recorded).** The deliverable is test/falsifier code
  and budget documentation (README line re-measure, `vault/wiki/test-suite-budget.md`
  update, test-header wall-clock/ceiling statement) — internal developer
  tooling and documentation inside the FLLWUP-48 copy carve-out (PO ruling 1,
  job-27: all deliverable strings are internal dev docs). It changes no
  product-visible surface, no user-visible copy, no empty state, no error
  state. No `designer` is seated. Boundary recorded honestly: if the
  deliberated design requires a string outside the carve-out (e.g. anything
  added to `council/preflight.sh` or a minted env flag), this container
  returns `ESCALATION` with the drafted string rather than shipping it
  unruled.
- **Rulings applied here (cited, not re-asked):** Phase-1 run-2 scope governs
  the promotion; `steward` job-1 governs the build-order position; R2 governs
  the later merge; R3 governs record pushes (disclosed per
  [[record-push-discipline]]). No card-specific Phase-1 ruling exists beyond
  R2/R3.
- **Seat resolution (`<seat_resolution_check>`):** `owner`, `principal`,
  `skeptic`, `consolidator`, `judge` — the seats this card dispatches — all
  resolve; the nine packaged seat files are present in the installed package
  clone (`~/.pi/agent/git/github.com/jumpseat-inc/pi-council/council/agents/`)
  and no repo-local `.pi/agents/` override directory exists, so nothing
  shadows them. Ruling seats (`product-owner`, `steward`) are never
  dispatched by this container.
- **Environment:** step 0 preflight skipped per the autonomous-run
  substitution (Phase 0 cleared it for the run); run for information only →
  not run by this container at card start (FLLWUP-49/55/57 precedent). Local
  `main` == `origin/main` at `8bb64d9` (FLLWUP-55 merged `97f4b6d`; CI on the
  record commit `8bb64d9` green — `gates` run 35371921484, `conclusion:
  success`, observed from the API), working tree clean.
  `python3 council/validate.py` → `All council artifacts valid`. No
  `Needs Human` state and no outstanding ruling on this card — deterministic
  merge check criterion 5 holds at card start.
- **Gate set for this repo** (authoritative: `.github/workflows/gates.yml` +
  [[deterministic-merge-check]]; `docs/gates/GATE-EVIDENCE.md` does not exist
  here): `bash council/preflight.sh FLLWUP-56`, `bunx tsc --noEmit`,
  `bun test` (≈94–97s envelope per [[test-suite-budget]]; 180s drift
  threshold), `python3 council/validate.py`. Owner gates met in full
  regardless of change size. This card will add a live arm, so the
  FLLWUP-48 PO-ruled re-measure rule (job-27 ruling 1 + the wiki page's
  standing rule) is a binding acceptance criterion on the deliverable.
- **Binding notes carried in (not rulings):** FLLWUP-49 O7 settled the
  structural sub-claims `closed-green` (scratch-repo `.pi/extensions` +
  `.council.json` + `command: "pi"` with `-a` is reachable with no engine
  change; `buildChildArgv` has no `-e`/`--provider`); the live-E2E half was
  left `open-untested` and this card is its pursuit. FLLWUP-48's zero-new-
  live-arms constraint was scoped to those cards' own diffs (baseline
  3/5/5/2); this card's whole subject is a **new** live arm, whose cost the
  card's design owns per the card `Intent`. Concurrent-run environment note:
  EPIC-10/EPIC-11 runners write to the shared board; a step-12 divergence is
  repaired by the documented union-merge reconcile (R1), never force.
  Merged-SHA CI flake on the EV-40 backoff-jitter test is FLLWUP-63's class
  (file untouched by this card); one disclosed rerun on the same commit is
  the cited precedent (FLLWUP-50, FLLWUP-55 step-12 records).
- **Step 2 is opened below:** state `Deliberating` on the card and board,
  `validate.py` clean, then `owner` + `principal` dispatched independently on
  the card alone (no `designer` — not surface-touching).

### Step 2 — independent first pass (round 1)

Two generators dispatched in parallel on the card alone (not surface-touching → no
`designer`). Jobs: `owner` `job-23.1` (14.3m, 14 turns), `principal` `job-23.2`
(14.3m, 35 turns), both settled `done`. Positions appended verbatim.

#### Position — `owner` (job-23.1)

**What it is.** A live treatment/control arm, added to `test/ev41-retry-e2e.test.ts`
(the file that owns seat-dispatch provider-error testing and is already a
`faux-provider/harness.ts` importer, so the FLLWUP-49 shape witness — test 2
"exactly one `fauxProvider(`", test 7 "stub-child.ts stays" — is untouched). The
existing (b) `bun stub-child.ts` arm **stays**: it is the witness-pinned,
deterministic parent-side chain falsifier. The new arm proves the child half is
real: a **config-injected faux provider reaching a real seat child spawned by the
engine's own dispatch path**.

**The chain it drives** (real `council_dispatch` through a real spawned parent —
the pole FLLWUP-49 O7's live half named, not a direct `buildChildArgv` spawn):

1. Parent = `runHarnessArm({councilExtension: true, arm: "none", fails: 0})` plus
new opt-in knobs (`EV40_TOOLCALL_DISPATCH=1`; `EV40_TOOLCALL_MODEL` unset ⇒ the
extension's dispatch tool call **omits the model param** — one small change to
`test/faux-provider/extension.ts`, a test file). Parent env gets a scratch `pi`
shim prepended to PATH (`exec node <CLI_PATH> "$@"`), so hub's `command: "pi"`
(`hub.ts:248`) deterministically runs the dev CLI, never ambient pi — the
FLLWUP-21 env-split lesson.
2. Scratch repo (the arm's cwd, which becomes the parent's `repoRoot`) is
prepared with exactly the two O7-named carriers: `.pi/extensions/faux-seat-child.ts`
— a runtime-generated **shim** that sets child knobs keyed on `COUNCIL_JOB_ID`
(attempt 1 ⇒ `EV40_FAILS=1`; `-attempt2` ⇒ `EV40_FAILS=0`) and then
`export { default } from "<abs>/test/faux-provider/extension.ts"` — and
`.council.json` carrying `{"council": {"<seat>": {"model": "ev40/ev40-model"}}, "retry": {enabled, maxAttempts: 2, baseDelayMs: 200, jitter: false}}`. The shim
reuses the single provider extension (its relative import of
`extensions/parent-retry.ts` resolves against its real path), so **no second
extension file is born under `test/`**.
3. The engine's dispatch (`hub-tools.ts:248`) resolves the seat via `loadSeat` →
`applySeatOverride(loadCouncilConfig(scratchRepo))` (`seats.ts:550`) — the
`.council.json` layer, config-injected, proven — passes the catalogue check (the
parent's registered faux provider makes `ev40/ev40-model` available), and spawns
the real seat child via `buildChildArgv` (`seats.ts:600-621`: `--mode json -p -a
--model ev40/ev40-model`, cwd = scratch repo). `childEnv` (`runs.ts:225-227`)
passes the parent's env plus `COUNCIL_RUN_ID`/`COUNCIL_JOB_ID` through.
4. The child auto-loads the scratch `.pi/extensions` shim under `-a`, registers
provider `ev40`, serves its first call as `stopReason=error,
errorMessage="Provider finish_reason: error"`; pi does not self-retry that
literal (`ev41` precondition test). The child's JSON-mode stdout carries
`stopReason`/`errorMessage` into the hub's `JobReport` (`hub.ts:300-301`) →
`classifyRetry` (`retry.ts:103-107`) → the supervisor respawns attempt 2 →
attempt 2's child succeeds with `EV40-SECOND-RESPONSE`.

**Assertions (treatment):** (i) parent exit 0 and its session JSONL's dispatch
toolResult carries final job success + the child output `EV40-SECOND-RESPONSE`;
(ii) the manifest (`<runDir>/<jobId>.json`) has `attempts[]` = 2 — EV-42
per-attempt provenance proves a real re-spawn; (iii) attempt-1 child session
(under the scratch repo's runs dir) has assistant `stop=error, errorMessage ===
INJECTED_ERROR_MESSAGE` (imported constant); (iv) attempt-2 child session has
`EV40-SECOND-RESPONSE` and no error entry. **Control (in-test, the
mechanism-absent half):** identical setup with `retry.enabled: false` — dispatch
reports failure, exactly one child session carrying the literal, no attempt-2
session, no marker anywhere. Because this card's premise is *no engine change*
(the mechanism already exists at base), the red/green boundary is asserted
in-test by the control plus a structural perturbation (drop the
`.pi/extensions` shim ⇒ the child cannot resolve the model ⇒ dispatch fails
naming it) — not by a red-at-base transplant, which is expected **green** at
base; the Skeptic should demand the control red and the perturbation red, not a
red base run.

**Ceiling:** 180s per test (the suite's `-p`-arm convention). **Expected
wall-clock:** ~20–30s for the block (treatment ≈12–18s: parent boot + two child
boots + 200ms backoff; control ≈8–12s: parent + one child) — stated in the test
header per standing rule 1.

**Budget accounting (per FLLWUP-48 standing rules):** test header carries
expected wall-clock + ceiling (rule 1); implementing pass re-measures (`bun
install; time bun test` + per-file loop) and writes the figure with provenance
into all three budget docs (README envelope + provenance, wiki total +
`ev41-retry-e2e` table row 5→6 arms + recomputed live-arm share, AGENTS.md
figure); wiki records the new arm-count baseline 3/5/**6**/2, superseding the
zero-new-live-arms note (that constraint was scoped to FLLWUP-48/49's own
diffs); expected new total ≈115–125s, under the 180s drift threshold — if the
implementing pass measures above 180s, FLLWUP-48 reopens, no threshold moved.
No escalation: every new string is internal developer tooling/docs; nothing in
`council/preflight.sh`, no gate flag minted — the arm is offline and
default-run like its siblings.

**Tradeoffs accepted:** stub arm retained alongside the live arm (~1.1s
apparent redundancy — witness-pinned by shape test 7, still the only
deterministic attribution falsifier for the supervisor chain); the most
expensive arm shape in the suite (two live processes per treatment) accepted
because it is the only way to prove dispatch→child→error→retry end-to-end;
attempt indexing keyed on the `COUNCIL_JOB_ID` `-attempt2` suffix (encodes the
EV-39/EV-42 convention in fixture code; if it changes, the arm reds loudly);
empirical risks named, not assumed — the child runs without `--offline`
(faux provider is in-process, so no network needed, but unproven — the 180s
ceiling bounds a hang) and project extensions must load before argv-model
resolution (the parent's `-e` arms prove the pattern for `-e`, not `-a`; O7's
structural finding covers the `-a` route).

**Testable claims for the Skeptic:** (1) premise re-checkable — `buildChildArgv`
no `-e`/`--provider`; `command: "pi"` hit; `childEnv` full passthrough;
(2) design forced by the witness, not taste — `grep -rln "fauxProvider(" test/`
→ exactly `test/faux-provider/extension.ts`; stub-child.ts pinned by shape
tests 2 and 7; (3) the falsifier works and attributes (post-implementation) —
treatment green, control green; perturbation (delete the scratch
`.pi/extensions` shim) → dispatch fails naming the model; (4) exactly one new
live arm — arm counts → `3 / 5 / 6 / 2`; (5) budget docs re-measured with
provenance, 180s still reads *drift threshold*; (6) suite inside the envelope —
`bun install && time bun test` < 180s, expected ≈115–125s.

#### Position — `principal` (job-23.2)

**Tooling note:** no shell this pass; every command is the Skeptic's to run;
every fact is read-derived from the named file and line range.

**Cross-seam reading.** The seam is the **parent/child process boundary plus the
process that owns the retry timer**, and neither side of the card's frame sees
it whole. Child side: `buildChildArgv` (`seats.ts:600-621`) emits `--mode json
-p -a --session-dir … --model …` — no `-e`, no `--provider`, no `--offline`.
Dispatch side: `hub-tools.ts:244-275` — `command: "pi"` hardcoded (`:248`),
`cwd: repoRoot` (`:250`), `env: childEnv(spawnEnv, runId, jobId)` (`:251`),
supervisor armed at `:262-275` with per-attempt argv/env/sessionId.
`registerHubTools` is **exported** (`:131`), so the real dispatch handler is
drivable in-process — already done twice (`test/job-retry.test.ts:70-101,184-259`,
`test/override.test.ts:70-101`).
**Lifecycle side (the part the card does not name):** `job-retry.ts:65-91` — the
backoff timer is created **in the process that issued the dispatch**, and
`fire()` calls `hub.respawn`. Both the (c) parent-turn arms and `runHarnessArm`
drive a print-mode pi **parent** — which exits when its turn settles. A
parent-session-driven seat arm therefore can witness the child's error but
*cannot* witness attempt 2. Retry predicate: `retry.ts:85-105` — `classifyRetry`
keys on `stopReason`/`errorMessage`, never on state, so a real child exiting 1
with the faux literal **is** retried. Script state:
`extension.ts:60-70` — `EV40_FAILS` is read **once at module load, per
process**; `stub-child.ts:60-90` shows the repo's precedent for the missing
shape (cross-process counter file). Env: `childEnv` = `{...base,
COUNCIL_RUN_ID, COUNCIL_JOB_ID}`; in a test process `process.env` is the
**runner's** env — the FLLWUP-21 contamination class
(`vault/wiki/env-split-contract.md`). CI side: `gates.yml` has **no `pi`
install step**; only `node_modules/.bin/pi` exists and `spawn` does not search
it; the only test spawning `command: "pi"` is `integration.test.ts:33`, gated
behind `COUNCIL_INTEGRATION=1`.

**Recommended design.** The falsifier is a new in-process live arm: the real
`council_dispatch` handler, with a real `pi` seat child. It is
`test/job-retry.test.ts`'s wiring drive with the child swap removed. **File:**
`test/ev41-seat-child-live.test.ts`, two `test(...)` arms (treatment + control) —
new file, not a block in `ev41-retry-e2e.test.ts`: the card's Intent explicitly
wants (b)'s falsifier *unchanged*, and FLLWUP-48's per-file row stays a clean
signal. **Scratch substrate** (all under `mkdtempSync`): (1) `<root>/.council.json`
= seat model override to `ev40/ev40-model` — read by
`loadSeat`→`applySeatOverride` (`seats.ts:545-553,478-496`), the real config
path; (2) `<root>/.pi/agents/agent-s.md` — minimal seat so the override has
something to shadow (mirrors `job-retry.test.ts:192-199`); (3)
`<root>/.pi/extensions/ev56-faux.ts` — one line: `export { default } from "<abs
HARNESS_EXTENSION>"`. No `fauxProvider(` token, so shape test 2 stays green; no
committed copy, so nothing can drift; (4) scratch HOME with
`defaultProjectTrust:"always"` + `PI_OFFLINE: "1"` in the child env (pi's own
documented var, `docs/settings.md:86`) — the child's argv has no `--offline`,
and AGENTS.md's "integration test is the only network-touching test" must
survive. **Drive:** `registerHubTools(fakePi, root, {retryPolicy})`; capture the
`council_dispatch` definition; call `execute(...)` with a real
`modelRegistry` exposing `ev40/ev40-model`; `initHubIdentity("run56")`,
`afterEach(shutdownHub)`. **Child env + launcher, wrapped in the two spawn
hooks** (`hub.spawnJob`, `hub.respawn` — the `job-retry.test.ts:236-251`
pattern): keep the engine's `COUNCIL_*` keys; **rebuild** the rest as
`harnessEnv` does (explicit `PATH`, scratch `HOME`/`TERM`, `PI_OFFLINE=1`,
`EV40_*` knobs) — without this the real child inherits the runner's
HOME/global extensions/credentials; prepend `<repo>/node_modules/.bin` to the
child PATH and leave `command: "pi"` **verbatim**, with a precondition
asserting `.bin/pi` exists; on **respawn only**, inject `EV40_FAILS: "0"` —
each attempt is a fresh process whose module-load script reads `EV40_FAILS`
again, so without it attempt 2 fails too; the shared harness extension takes
**zero changes**. **Assertions (treatment):** static preconditions (resolved
seat model; argv has `-a`, no `-e`/`--provider`; `.bin/pi` exists); spawned
command was `"pi"`; attempt-1 session has assistant
`stopReason==="error"`, `errorMessage===INJECTED_ERROR_MESSAGE` (**the
reachability witness** — only the faux provider emits that literal); `respawn`
called exactly once with `--session-id <id>-attempt2`; one manifest with
`attempt: 2`, `attempts: [{1,id},{2,id-attempt2}]`; attempt-2 session holds
`EV40-SECOND-RESPONSE`; manifest final `state: "done"`. **Control arm:** same,
`{enabled:false}` → one spawn, zero respawns, literal present, no
`EV40-SECOND-RESPONSE`; pi-auto-retry exclusion already pinned byte-for-byte at
`test/ev41-retry-e2e.test.ts:76-88`. **Budget statement:** inner per-attempt
ceilings `timeout_minutes: 0.5`/`stall_minutes: 0.5`; outer bun ceiling
**`120_000`** per arm — above the inner bound so a hang reports attribution
(the FLLWUP-48 O7 lesson), below the TUI arm's `300_000`. **Expected wall clock
≈ 7s** (range 5–12s). Header states both figures verbatim. **Suite-cost
accounting:** header carries expected wall clock + ceiling (rule 1);
implementing pass re-measures (`bun install` first — FLLWUP-48 O12) and writes
the provenance-complete figure into the wiki (new per-file row
`test/ev41-seat-child-live.test.ts | 2 | ≈X s`; **"Live-arm share" 15 → 17**
with the re-summed figure; per-arm loop's file list gains the new file),
README.md:315 and AGENTS.md:17 get the same re-measured figure; **180s stays
the drift threshold**; expected total ≈ 94 + 7 ≈ **101s**; no `gates.yml`
change (PO ruling 2 stands), no arm moved, baseline 3/5/5/2 → 3/5/5/2/2.

**Tradeoffs accepted:** in-process dispatch, not a parent pi session (the
supervisor's timer is process-local; a print-mode parent exits at settle, so a
parent-session arm can never see attempt 2 and would leave a detached child
behind; the parent-turn retry is already witnessed by (c)); `command: "pi"` is
asserted, not executed from ambient PATH; the arm rebuilds the child env and
rewrites one env key on respawn; two new arms ~7s (+7%); **the project-local
shim route may not load** — fallback A: scratch `settings.json`
`extensions: [HARNESS_EXTENSION]` (global route — still zero engine change, but
the reachability claim narrows and the header must say so); fallback B:
runtime byte-copy of the extension into `.pi/extensions/`. If neither works
without an engine flag, that is an **escalation**, not a silent re-scope — it
falsifies the card's premise.

**Reframe.** The card is framed as an **instrumentation** question; the
load-bearing question is **lifecycle**: which process stays alive to fire
attempt 2. Answer: the test process, because `createRetrySupervisor`'s timer is
owned where the dispatch was issued and print-mode pi exits at settle. Second
reframe: this is **not a red-base card**; its falsifiability is a
**perturbation red** (drop the `.pi/extensions` write → the literal never
appears), and the evidence record should say so rather than manufacture a base
red (`vault/wiki/red-base-evidence.md`, fields 2/6).

**Testable claims (Skeptic-runnable):** (1) `buildChildArgv` has no provider
flags; `-a` present; (2) the harness's fail script is per-process (`EV40_FAILS`
module-scope; contrast `stub-child.ts` cross-process counter) — settles why
attempt 2 needs `EV40_FAILS=0`; (3) `command: "pi"` is not PATH-safe in CI
(`gates.yml` has no pi install; devDependency only); (4) retry is
state-independent (`classifyRetry` reads `stopReason`/`errorMessage` only);
(5) the timer-owner claim (`job-retry.ts:65-91` + print-mode parent exits at
settle) — **falsified by an existing arm where a parent-session dispatch
completes a retry chain**; (6) mechanism-perturbation red — comment out the
`.pi/extensions/ev56-faux.ts` write → the arm fails **on the reachability
assertion**, not a timeout; (7) head green + budget —
`bun test test/ev41-seat-child-live.test.ts` → 2/0, then `bun install && time
bun test` → < 180s (expected ≈ 101s); (8) accounting landed in all four places
(wiki row + Live-arm share 17; README; AGENTS); (9) no engine change, no new
flag, no preflight string; (10) shape witness survives untouched. **Escalation
flags:** none required under my reading — every string lives in test
code/headers/budget docs and `PI_OFFLINE` is pi's own documented var, not a
council-minted flag; the one boundary item for the PO to confirm is
`PI_OFFLINE` in test code. If fallback A is required, the reachability claim
narrows and that narrowing must be recorded, not assumed.


### Step 3 — bounded exchange (round 2)

Re-dispatched each generator with the other's round-1 position. Jobs: `owner`
`job-23.3` (7.8m, 7 turns), `principal` `job-23.4` (7.8m, 11 turns), both
settled `done`. Positions appended verbatim. **Closed at 2 rounds — positions
stabilised** (facilitator note below).

#### Round 2 — `owner` (job-23.3)

**P1 — the pivotal lifecycle claim: rejected on the code, with one concession
about my round-1 design.** Premises checked: "`council_dispatch` returns
immediately" — **true** (`hub-tools.ts:132`, `:291`); "the backoff timer is
created in the process that issued the dispatch, `fire()` calls `hub.respawn`"
— **true** (`job-retry.ts:65-91`; unref'd, `:31-37`); "print-mode pi exits when
its turn settles, therefore a parent-session arm cannot witness attempt 2" —
**the inference is invalid for the dispatch+wait turn shape.** The load-bearing
code is `hub.ts:431`, in `isSettledForWait` — the predicate `hub.wait` polls
(`hub.ts:471-489`): `if (job.state === "retrying") return false; // EV-39 —
wait blocks through the backoff window` — and `council_wait.execute` is `await
hub.wait(...)` (`hub-tools.ts:308`). A pending tool `execute` is not a settled
turn; the parent process is alive for its whole duration. So a dispatch →
`council_wait` turn does not settle until final settle: the backoff timer fires
in the still-alive parent, `hub.respawn` runs there, attempt 2 runs, `hub.wait`
returns `state=done` with the EV-42 `attempts[]` pairing. The detached-child
hazard is covered by the same semantics (`hub.wait` cannot return while any
attempt runs or backoff pends; shutdown disposes retrying supervisors). Where
principal is right: the extension **as it stands today** scripts only the
`council_dispatch` step (`dispatchStep`, `stopReason: "toolUse"`) — a
dispatch-only turn settles, print mode exits, the timer dies, the child is
orphaned. **I concede my round-1 design did not name the wait step, and without
it principal's failure mode is real.** The fix is one addition to
`test/faux-provider/extension.ts`: a new opt-in knob (`EV40_TOOLCALL_WAIT=1`)
scripting a second `council_wait` tool call. Scripted sequence: dispatch → wait
(blocks through backoff + attempt 2) → successStep → settle → exit. **What
makes the parent drive possible: the timer owner stays alive because the turn
is blocked inside `council_wait`'s awaited `execute`, which `hub.ts:431`
deliberately holds open through the retrying window.**

**P2 — principal's lifecycle reframe accepted** and it strengthens the
parent-session arm: the EV-42 `attempts[]` pairing is written by the
timer-owner process, and a mid-backoff retrying manifest carries `attempts:[1]`
only — so asserting `attempts[] == 2` **is** the assertion that the timer owner
survived. Lifecycle and reachability are answered by the same arm.

**P3 — in-process `registerHubTools` drive: viable, but it concedes the card's
own pole.** `registerHubTools` is exported and driven in-process by
`job-retry.test.ts`/`override.test.ts` — true. But the card's Intent fixes the
falsifier as "**the parent-turn offline faux-provider harness** reaching a real
seat child" (O7's live half). The in-process drive never runs a parent pi
session, so it does not prove what the card exists to prove. I keep the
parent-session drive; principal's in-process shape is the designated fallback
if the wait-scripted knob fails empirically (same escalation discipline as the
shim fallbacks).

**P4 — (b) stub exit-0 not load-bearing; `classifyRetry` state-independent:
conceded and recorded** (`retry.ts:85-105` reads `stopReason`/`errorMessage`
only).

**P5 — accounting: conceded, my round-1 numbers were wrong.** I adopt
principal's layout: **new file `test/ev41-seat-child-live.test.ts`, baseline
`3/5/5/2/2`, Live-arm share 15→17**, per-file wiki row, README/AGENTS
re-measure, 180s unchanged as drift threshold. Parent-session treatment adds
one parent boot (~2–4s) over principal's ≈7s estimate → **block expected
≈18–30s, suite total ≈112–124s**, under 180s. Ceilings as principal specified
(inner 0.5/0.5 per attempt, outer 120s per arm).

**P6 — perturbation-red, not red-base: already agreed; no dispute.**

**P7 — new hazard neither round named:** the parent's env carries
`EV40_TOOLCALL_DISPATCH=1`; `childEnv` passes the parent's env through, so the
child shim must **strip `EV40_TOOLCALL_DISPATCH`/`EV40_ARM`** or the child's
own faux provider attempts a recursive dispatch. The shim's knob-reset must
explicitly clear the dispatch knob.

**P8 — shim fallbacks A/B and the escalation boundary: kept unchanged.**

**Testable claims:** (1) mechanism half, immediately runnable in bun — wire
`registerHubTools` as in `job-retry.test.ts:236-251`'s hook pattern; stub child
sleeps ~1s, exits with `INJECTED_ERROR_MESSAGE`; call `council_dispatch.execute`
then **await the `council_wait` tool's `execute`** with retry
`{maxAttempts: 2, baseDelayMs: 200}` — resolves with `state=done`, manifest
`attempts[] == 2`; (2) print-mode half — the proposed arm itself; if the parent
exits at first settle, attempt-2 session and `attempts[] == 2` are absent and
the arm reds on the reachability/respawn assertions (never a timeout);
(3) perturbation red — drop the `.pi/extensions` shim write → dispatch fails
naming the model; (4) accounting — arms `3/5/5/2/2`; Live-arm share 17;
`bun install && time bun test` < 180s, expected ≈112–124s; (5) no engine
change — `buildChildArgv` untouched; `command: "pi"` asserted, resolved via
child-env PATH prepending `node_modules/.bin`; shape test 2 untouched.

**Revised position.** The parent-session drive survives, amended: script the
parent's turn as dispatch → `council_wait` (new `EV40_TOOLCALL_WAIT` knob),
which keeps the timer-owner parent alive through the backoff window by
`hub.ts:431`'s wait-blocking semantics; no detached child, no engine change. I
withdraw the round-1 omission of the wait step, the `3/5/6/2` accounting, and
the same-file layout; I adopt principal's new file, baseline `3/5/5/2/2`,
share 15→17, and the perturbation-red framing. The in-process drive is
recorded as the designated fallback, with escalation — not silent re-scope —
if the wait-scripted parent turn fails empirically.

#### Round 2 — `principal` (job-23.4)

**Three undisputed load-bearing facts:** `council_dispatch` returns
**immediately** (`hub-tools.ts:136`, `:282`) — its toolResult can never carry
`EV40-SECOND-RESPONSE`; the retry timer lives in the **dispatching process**
(`hub-tools.ts:264`) and is **unref'd** (`job-retry.ts:38-41`) — an unref'd
timer does not hold the event loop open; `council_wait` → `hub.wait` polls with
a **ref'd** `setTimeout(r, 200)` (`hub.ts:447`), which does hold the loop open.

**The pivotal dispute — I concede the general form and defend the written
design.** My round-1 sentence ("a print-mode parent exits when its turn settles
and cannot host attempt 2") was stated too strongly: a parent **can** host
attempt 2 iff its turn is held open by a blocking tool call; `hub.wait`'s
ref'd poll is exactly that. But **the owner's design as written does not
contain that wait.** `extension.ts:131-136` scripts
`[dispatchStep, successStep, successStep, successStep]` for the parent; knobs
cover only `EV40_TOOLCALL_DISPATCH/SEAT/MODEL/OPEN_TREE` (`:78-80`) — no
`council_wait` step, no knob to emit one. After the dispatch toolResult
returns, the next provider call is `successStep`; the turn settles;
print-mode tears down; `shutdownHub` cancels the still-running attempt-1 child
(`hub.ts:483-484`) and disposes the retrying job; the unref'd timer dies with
the process. **Attempt 2 never spawns.** The design needs an explicit
`council_wait` step (and a knob to emit it) — a required amendment, not a
nitpick.

**Concede: the drive shape.** The card `goal` says "the **parent-turn** offline
faux-provider harness reaching a real seat child"; my round-1 in-process drive
never uses the parent-turn harness. On goal-fidelity, owner's real-parent drive
is the better shape, provided the wait step is added. **I withdraw the
in-process-only recommendation and the over-general lifecycle claim** (narrowed
to: the written design omits the only mechanism (`council_wait`) that keeps the
parent alive across the backoff).

**Defend, with new grounds — the assertion carrier is misnamed.** The final
report is rendered by `council_wait`'s `formatWaitReport`; the assertion must
name the **wait** toolResult, not the dispatch toolResult (whose text is
"Dispatched … Use council_wait to collect.").

**Defend, with new grounds — the attempt-index key is wrong.** `childEnv` sets
`COUNCIL_JOB_ID` to the *job id*, and `attemptSpec` passes the **same**
`jobId` on every attempt (`env: childEnv(spawnEnv, runId, jobId)` at
`hub-tools.ts:273`; attempt 1 at `:251` identical). `COUNCIL_JOB_ID` is `job-1`
for both attempts; the `-attempt2` suffix lives only in `--session-id` (argv),
which reaches the child via `process.argv`, not the env. Fix: key the shim on
`process.argv`'s `--session-id`, or use the cross-process counter-file
precedent (`test/stub-child.ts`).

**Defend, with new grounds — the static re-export defeats the shim.** ESM
evaluates a module's dependencies **before** its own body, so a static
`export … from` loads `extension.ts` first, where `EV40_FAILS` is read at
module top level (`extension.ts:63`). The shim's env write runs too late;
attempt 1's child reads the parent's `EV40_FAILS="0"` and never fails. Fix:
dynamic `await import()` after setting the knob, or a side-effect import
ordered before the re-export.

**Defend — the change surface is understated.** `harnessEnv` does not forward
`EV40_TOOLCALL_*`; the knobs must be plumbed through `ArmOptions`/`harnessEnv`
too. Test-helper surface, but not "one small change to `extension.ts`."

**Arm-count question:** both placements preserve the Intent's (b)-arm boundary
and the shape witness (`faux-provider-shape.test.ts:91,129` asserts
`stub-child.ts` stays; the scratch shim lives outside the repo). The new-file
row is marginally cleaner for FLLWUP-48's per-file accounting; preference, not
a blocker — will not trade rounds over it.

**Reframed risk (stated):** the load-bearing seam is **liveness across the
backoff** — `job-retry.ts` deliberately unrefs the backoff timer, so the retry
chain's completion is a property of *whatever keeps the dispatching process
alive*. Any drive that lets the parent turn settle before attempt 2 fires
cannot observe the chain. Owner's drive is the right shape **plus** a
`council_wait` step, **plus** a `process.argv`-keyed (or counter-file) attempt
discriminator, **plus** a dynamic-import shim.

**Testable claims:** **T1 (wait required)** — `grep -n "council_wait"
test/faux-provider/extension.ts` → no hits today; add only the wait knob;
assert manifest `attempts.length===2` and attempt-2 session
`EV40-SECOND-RESPONSE`; expected red without it (parent exits, `shutdownHub`
cancels attempt 1), green with it. **T2 (ESM ordering)** — shim = top-level env
write + static re-export; assert attempt-1 child session has
`stopReason==="error"`; expected red; green only with `await import()` or an
ordered side-effect import. **T3 (attempt key)** — log `COUNCIL_JOB_ID` in the
child for both attempts; expected `job-1` twice (`hub-tools.ts:251,273`), never
`job-1-attempt2`; falsify by reading `process.argv --session-id` instead.
**T4 (carrier)** — the wait toolResult (not the dispatch toolResult) carries
`EV40-SECOND-RESPONSE`.

**Revised position.** Owner's real-parent drive is the right shape for the
goal's wording; the design as written is red-for-the-wrong-reason at three
points I can name from the code — (1) no `council_wait` step, so the unref'd
backoff timer never fires and `shutdownHub` kills attempt 1; (2) the shim keys
on `COUNCIL_JOB_ID`, which is the same `jobId` on every attempt, not a
`-attempt2` suffix; (3) the static re-export evaluates `extension.ts` before
the shim's env write. Fix those three (explicit wait + argv/counter-file
discriminator + dynamic import), and owner's shape is the one to ship.

#### Facilitator note — exchange closed at round 2

Positions stabilised. The two generators converged on every load-bearing
point: **drive shape = parent-session** (`runHarnessArm` parent pi, scripted
dispatch → `council_wait` via a new opt-in knob — owner's shape amended with
principal's required wait step); **file layout = new file**
`test/ev41-seat-child-live.test.ts`, two arms, baseline `3/5/5/2/2`, Live-arm
share 15→17; **ceilings** inner 0.5min/0.5min per attempt, outer 120s per arm;
**expected block ≈18–30s, suite ≈112–124s** under the 180s drift threshold;
**budget accounting** per FLLWUP-48's standing rules (header, implementing-pass
re-measure, wiki row + share, README/AGENTS, 180s unchanged); **framing =
perturbation-red**, not red-base; **escalation boundaries** — shim fallbacks
A/B recorded, escalation (not silent re-scope) if the wait-scripted parent
turn fails empirically or if neither shim route works without an engine flag.
Principal withdrew the in-process-only recommendation and the general
lifecycle-impossibility claim; owner withdrew the wait-step omission, the
`3/5/6/2` accounting, and the same-file layout. Principal's three
correctness fixes (wait step; `COUNCIL_JOB_ID` is constant across attempts —
key the discriminator on `process.argv --session-id` or a counter file; ESM
dependency-before-body ordering — dynamic import or ordered side-effect
import) and its T4 carrier correction (assertions name the **wait** toolResult)
plus owner's P7 child-knob-strip hazard are carried to the spec as settled
design content. The remaining unsettled items are **empirical** (whether the
wait-scripted parent turn actually completes the chain; whether the
project-local shim loads under `-a` before argv-model resolution) — these are
Skeptic/implementation territory, not exchange rounds. No third round needed;
the ≤3 cap is not reached.

