---
id: FLLWUP-21
title: Restore pi-council extension load on stock pi 0.85.0 and pin the devDependency
state: In Review
owner: null
epic: EPIC-6
goal: The pi-council package's env-keyed parent/child mode split at `extensions/index.ts` registers all parent-mode slash commands on stock pi in a fresh scratch HOME and registers zero slash commands when `COUNCIL_SEAT` is set, proven by a driven headless verification asserting both poles via the installed pi binary, with the root cause of the env-split fallthrough documented and the devDependency on `@earendil-works/pi-coding-agent` changed to a deliberate version constraint consistent with the verified interval.
---

## Intent

Filed from FLLWUP-14's delivery (council-runner report): the kitty smoke
harness discovered that stock pi 0.85.0 loads **no** pi-council extension —
both TUI and headless (themes load, extensions do not), so `/council-models`
and `/council-init` are unregistered commands that misroute to a real model
dispatch on 0.85.0 with a fresh scratch HOME (unregistered-command fallback
hits the model — an unexpected-cost hazard, not just a missing feature).
The smoke image deliberately pins `PI_VERSION=0.84.3`, and this repo's
`devDependency "@earendil-works/pi-coding-agent": "*"` is unbounded — the
package's own development environment silently rides whatever pi ships.

This card root-causes the extension-load failure on pi ≥0.85.0 (expected
shape — pi manifest/extension API drift between 0.84.3 and 0.85.0 — but the
actual cause is the card's work, not an assumption), restores command
registration on the stock pi, and replaces the unbounded devDependency with
a deliberate version constraint consistent with the root cause. The card is
filed under EPIC-6 per the run's standing orchestrator directive; the
discovery is the smoke's, the defect is the package's.

## Acceptance

- A driven headless verification (test-side, in the repo's gate set) that
  loads the packaged extension through the installed pi binary and
  asserts both poles of the env-split contract end-to-end: a clean
  scratch HOME with no council configuration registers all parent-mode
  slash commands; the same scratch HOME with `COUNCIL_SEAT` set
  registers zero slash commands. The `COUNCIL_SEAT`-set pole is the red
  reproduction of the env-split fallthrough on the current `main` state
  and stays red on every version the verification targets; the clean-env
  pole is already green on the current `main` state and stays green.
- The root cause of the env-split fallthrough (the silent
  `COUNCIL_SEAT`-keyed mode split in `extensions/index.ts` and the
  downstream unregistered-command → model-dispatch path) is documented
  on the card's run record with evidence, not guessed.
- `package.json`'s `@earendil-works/pi-coding-agent` devDependency is
  changed to a deliberate version constraint consistent with the verified
  interval, and the choice is recorded on the card's run record.

## Execution (run record)

### Step 2 — independent first pass (2026-09-05, resumed container)

Card gated at step 1 (recorded in commit a311b97): **full council, not
surface-touching** — no designer seat. `owner` and `principal` dispatched
in parallel with isolated inputs; both positions appended verbatim below.

#### Owner position (first dispatch job-15.1 cancelled mid-investigation
after reproducing the cost hazard on a clean scratch HOME; re-dispatched,
settled as job-15.3)

Evidence chain (all from installed code + real-binary runs):
1. `dist/core/extensions/loader.js`, `pi-manifest.js`, `package-manager.js`
   are **byte-identical** between 0.84.3 (`/tmp/pi843`) and 0.85.0 (npm
   global); `runner.js` differs only in the ui_prompt wrapper, `config.js`
   only in `isBundledNode` plumbing; jiti is **2.7.0 in both**. There is no
   extension-loading API/manifest delta between 0.84.3 and 0.85.0 — the
   card's assumed drift does not exist.
2. Real npm 0.85.0 binary, smoke-shaped install (`pi install -l <repo>`,
   node_modules present), **clean env: all 14 commands registered**
   (`/council-eval` prints its local usage, model-free).
3. Real 0.85.0 + real 0.84.3, **same shape, `COUNCIL_SEAT=owner`
   inherited** (the environment of any seat/council-runner session —
   FLLWUP-14's report came from a council-runner): extension loads in
   **child mode** (index.ts early-returns at the `COUNCIL_SEAT` check,
   lines 66–69), registers **zero commands**, and `/council-eval` falls
   through to a real model dispatch ("No API key found…" / LLM-generated
   help when a key exists). Reproduced on **both** versions. This is the
   reported symptom, mechanically and version-independently.
4. Secondary, version-independent fragility: package installed by
   path/copy **without node_modules** → `Cannot find module
   '@modelcontextprotocol/sdk/client'` at `extensions/mcp/client.ts`
   (0.84.3 and 0.85.0 identical). Git-install clones do materialize
   node_modules (host `~/.pi/agent/git/...` evidence), so the release shape
   is safe; the smoke's `bun install` in phase 0b covers its shape.
5. My own first two "reproductions" were COUNCIL_SEAT contamination from
   this seat session (`env | grep -i council` shows `COUNCIL_SEAT=owner`)
   — an object lesson for exactly what hit the kitty harness.

- **Approach** — The card's premise ("extension/API drift 0.84.3→0.85.0")
  is disproven by evidence: the loader infrastructure is byte-identical and
  clean stock 0.85.0 registers all commands. The reproducible defect is
  pi-council's own env-based mode split: `index.ts` downgrades the
  installed extension to child mode whenever `COUNCIL_SEAT` is present in
  the process env (extensions/index.ts:66–69), which any harness or tool
  invoked from inside a council session inherits — making every council
  command unregistered and silently model-routed. Deliverables: (1) a
  driven verification in `test/` that loads the packaged extension through
  the installed pi's `discoverAndLoadExtensions` (my `/tmp/extload/
  bundle-run.mjs` pattern) with seat env scrubbed, asserting all parent
  commands register — plus a second assertion that the child-mode path
  registers zero commands, locking the split's intent; (2) a run-record
  document (root cause with the four evidence blocks above, labeled `4` as
  inference to verify against FLLWUP-14's harness env — inspect the
  council-runner's dispatched-env before trusting it); (3) devDependency
  pinned to `">=0.84.3 <0.86.0"` (smoke-tested floor, verified ceiling,
  upper bound expresses "engine verified up to this line"); (4) gates +
  smoke unchanged (0.84.3 pin is untouched and correct). If a real
  upstream pi regression exists beyond this evidence, this card does not
  find it — no escalation warranted on current evidence, pending the
  FLLWUP-14 env check.
- **Tradeoffs accepted** — (a) I did not run the kitty harness itself or a
  network `pi install git:` — the COUNCIL_SEAT mechanism is proven on the
  real binary both versions, but its attribution as *the* kitty cause rests
  on the env-shape inference; the implementation phase must check
  FLLWUP-14's run record before finalizing the narrative. (b) The
  no-node_modules SDK-resolution fragility is real but out of the card's
  regression scope (version-independent, release shape safe); recommend a
  follow-up note, not a fix here. (c) The unknown-command→model
  fallthrough is pi-side behavior the package cannot patch — the
  package-side mitigation is the registration test that keeps the failure
  loud.
- **Testable claims** —
  1. `discoverAndLoadExtensions([...extensions files], cleanEnv)` via the
     installed pi bundle returns an extension whose `.commands.size === 14`
     on both 0.84.3 and 0.85.0 — green on current main (loader hasn't
     drifted); run with `COUNCIL_SEAT` set it returns `.commands.size === 0`
     — red, reproducing the report on both versions.
  2. `env -u COUNCIL_SEAT pi -p "/council-eval"` in a scratch consumer
     exits 0 with `[council-eval] usage:` on stock 0.85.0; with
     `COUNCIL_SEAT=owner` it attempts a model dispatch. Both verified on
     the real binaries.
  3. `cmp` of `dist/core/extensions/loader.js` + `pi-manifest.js` +
     `package-manager.js` between 0.84.3 and 0.85.0 is empty — the diff
     evidence for the run record.

#### Principal position (job-15.2)

Cross-seam reading:
- **The contract on the pi 0.85.0 side is unchanged at the
  manifest/discovery layer.** `package.json` still declares `"pi": {
  "extensions": ["./extensions"], "themes": ["./themes"] }`, and 0.85.0
  still reads exactly that key: `dist/core/pi-manifest.js` reads `pkg.pi`
  with `RESOURCE_FIELDS = ["extensions","skills","prompts","themes"]`;
  a directory entry `"./extensions"` still resolves to
  `extensions/index.ts` via `package-manager.js`
  `collectAutoExtensionEntries` → `resolveExtensionEntries` (no inner
  package.json → falls to `index.ts`). The card's "expected shape — pi
  manifest/extension API drift" is, in its manifest-drift flavor,
  contradicted by the code read.
- **The theme/extension asymmetry is explained by the two load paths, not
  by discovery.** Themes are plain `.json` files collected by
  `collectFiles(dir, FILE_PATTERNS.themes)` — no execution. Extensions go
  through `dist/core/extensions/loader.js` `loadExtension` →
  `jiti.import(extensionPath)` → `factory(api)`. The extension's factory
  transitively imports ~15 sibling `.ts` modules plus
  `@modelcontextprotocol/sdk` (a real dependency, not in pi's
  `VIRTUAL_MODULES` map). A throw anywhere in that chain is caught,
  returned as `{extension: null, error}`, and the session proceeds with
  zero registered commands.
- **A load failure is non-fatal and self-reporting.** `dist/main.js:749–755`
  maps loader errors to diagnostics `Failed to load extension "${path}":
  ${error}`; interactive-mode.js:1373 surfaces them in the TUI. The
  unregistered `/council-models` then falls through to the
  unregistered-command path → real model dispatch — precisely the cost
  hazard the card names.
- **The existing gate set never exercises this seam.** `test/*` imports
  only *pure* exports from `extensions/index.ts` (`widgetLines`,
  `jobLines`, `renderProcedure`, `loadModelFloors`); no test drives the
  factory through `registerCommand` against even a mock `ExtensionAPI`,
  and none drives pi's real discovery/jiti load. The defect shipped green
  because the seam between "pi discovers the entry" and "the entry actually
  executes" is untested end-to-end.

Blind spots:
- The pipeline/package-author view (dev environment) can't see it.
  `devDependencies` on `@earendil-works/pi-coding-agent: "*"` rides 0.85.0,
  so `tsc --noEmit` and `bun test` validated against 0.85.0's types. Types
  are erased at runtime; typecheck green gives zero signal that pi's
  bundled-runtime jiti config (`virtualModules` + `tryNative: false`,
  loader.js:413–424) may no longer resolve one of the extension's
  non-virtual imports.
- The harness view (smoke) is blind by construction. It pins
  `PI_VERSION=0.84.3` deliberately and asserts a `0.84.3 decode parity`
  guard (search-smoke/run.sh); it will stay green while the package is
  broken on the current stock pi.
- The owner-inside-the-entry view can't see the loader's jiti config. The
  entry typechecks and reads self-consistently; nothing in the repo tells
  you pi 0.85.0's bundled runtime changed how it resolves the extension's
  third-party or sibling imports. Classic seam-blind spot.

Reframe:
1. **The seam is the jiti load/factory-execute stage in pi's bundled
   runtime, not manifest shape.** Reframe root-cause work away from
   "manifest/extension API drift" toward "which import in the ~15-module
   transitive graph, or which jiti-config change between 0.84.3 and
   0.85.0, makes `loadExtension` return a null extension." Evidence
   already exonerates discovery (themes load through the same manifest
   resolution) and the manifest key (unchanged).
2. **Acceptance #1 and #3 are coupled and must be reconciled explicitly.**
   If the root cause is an upstream regression and the deliberate
   devDependency constraint is `<0.85.0`/`~0.84.3` (matching the smoke),
   then a `bun test` case importing from `node_modules` can no longer
   reproduce the 0.85.0 defect — the driven verification must be a
   **subprocess invocation of the globally-installed stock pi binary**, not
   a library import. The card should name that the "red on current main"
   test targets the installed `pi` executable, independent of what the
   devDependency resolves to. Otherwise the implementer will naturally
   build a mock-`ExtensionAPI` unit test that goes green while the real
   jiti load still fails.
3. **The devDependency pin and the smoke's `PI_VERSION` are one decision,
   not two.** The dev environment and the falsifier diverged because `"*"`
   let the former drift while the Dockerfile held the latter. The
   deliverable should reconcile them, and state which of the two goals is
   primary when they conflict — because they only conflict in exactly the
   escalate case ("no workaround exists"). If no in-package workaround
   restores registration on 0.85.0, "restore on 0.85.0" must degrade to
   "document + constrain + escalate," pre-declared rather than discovered
   at judge time.

Testable claims:
1. **Discovery is not the breakage** (falsifies "manifest drift"): on
   stock 0.85.0, `pi -p "/council-models"` should emit `Failed to load
   extension ".../extensions/index.ts": ...` to stderr (main.js:755). If
   that diagnostic names a module/jiti error rather than a "path does not
   exist"/discovery error, discovery is exonerated and the load stage is
   confirmed. Same probe on 0.84.3 — it must print the usage line with no
   such diagnostic.
2. **A specific import is the delta** (isolates the regression): load a
   throwaway extension importing only virtual/bundled modules
   (`@earendil-works/pi-coding-agent`, `typebox`) and registering a
   command, versus one also importing `@modelcontextprotocol/sdk`, on both
   0.84.3 and 0.85.0. If the former loads on both and the latter fails
   only on 0.85.0, the non-virtual dependency (or a transitive sibling) is
   the precise delta — not the manifest, not the directory shape.
3. **The gate-set test is honest**: assert the new driven verification is a
   subprocess of the installed `pi` binary asserting the search-smoke's
   existing usage-line tripwire, and that it stays **red against the
   0.85.0 binary even after the devDependency is pinned `<0.85.0`**. A
   mock-`ExtensionAPI` factory test is necessary but must not be the
   acceptance's evidence.

Grounding used: `vault/wiki/index.md`, `headless-pi`, `smoke-test`,
`pi-council-overview`; `extensions/index.ts`, `package.json`,
`smoke/Dockerfile`, `smoke/search-smoke/run.sh`, `test/` tree; pi 0.85.0 at
`/home/tista/.nvm/.../@earendil-works/pi-coding-agent/dist`
(`pi-manifest.js`, `package-manager.js`, `extensions/loader.js`,
`resource-loader.js`, `main.js:749–755`, `docs/packages.md`,
`docs/extensions.md`, `CHANGELOG.md`).

### Step 3 — bounded exchange, round 1 (positions stabilized; exchange
stopped early per council.md)

#### Owner round-2 response (job-15.4)

Evidence gathered: `extensions/index.ts:117-121` (the env split),
`smoke/search-smoke/run.sh:36-39`, `driver.py:273-274`,
`README.md:103-107`, and the FLLWUP-14 step-8 deviation record. The open
question from step 2 is now settled.

- **Approach** — The FLLWUP-14 env question is answered: **yes, the harness
  ran with COUNCIL_SEAT in its env, and the harness itself witnessed it.**
  FLLWUP-14 step 8 deviation (1) is verbatim: *"the
  COUNCIL_SEAT/COUNCIL_JOB_ID/COUNCIL_RUN_ID env of this runner's session
  makes the extension enter child mode and register nothing — run.sh
  unsets them; found at bring-up, not assumed."* The fix lives in three
  places — `search-smoke/run.sh:39` (`unset COUNCIL_SEAT COUNCIL_JOB_ID
  COUNCIL_RUN_ID PI_SESSION_FILE`), `driver.py:273-274` (same keys popped
  before spawn), and `README.md:103-107` (the "COUNCIL seat-hazard" note).
  The discovery probe itself (owner job-10.1: "runner's stock pi 0.85.0
  loads no extension") was run by a council-runner inside its seat session
  → child mode inherited → zero commands → misroute; the harness then
  passed only after scrubbing. **Both the report and the bring-up red are
  the same package-side env branch, not a 0.85.0 delta — and notably the
  harness itself only ever boots the pinned 0.84.3 binary (`run.sh`
  `PI_VERSION=0.84.3`); no harness witness ever exercised 0.85.0.**
- **On the principal's three claims** — (1) the jiti/factory-stage
  hypothesis is falsified by the byte-identical loader evidence plus this:
  the factory *executes fine* on 0.85.0 — `loadExtension` succeeds,
  cosmetic child-mode registration; no `Failed to load extension`
  diagnostic ever fires. The seam is not the loader; it is the factory's
  own `COUNCIL_SEAT` branch (`index.ts:117-121`), version-independent.
  (2) Agreed, with a trap the reframe must include: the driven
  verification must be a subprocess **with the council child-mode vars
  scrubbed from its env** — otherwise the test contaminates itself exactly
  the way the discovery probe did. (3) Agreed they're one decision; the
  escalate-degrade is pre-declared: primary goal = registration restored
  on stock pi (all shipping versions); secondary = pin hygiene.
  `">=0.84.3 <0.86.0"` contains 0.85.0, so the subprocess test stays
  honest against the installed binary regardless. The escalate case ("no
  workaround") does not exist on current evidence — the degrade clause
  "document + constrain `<0.86.0` + escalate upstream" only triggers if a
  future real jiti regression surfaces.
- **Tradeoffs accepted** — The step-2 deliverable (2) drops its "labeled 4
  as inference" caveat: the root cause is now fully evidenced by the
  FLLWUP-14 record, no inference remains. Given up: trusting the card's
  premise narrative ("smoke harness discovered an 0.85.0 breakage") as a
  version claim — it is an env-hygiene narrative, and the acceptance's
  "red on current main" assertion must be scoped to the
  `COUNCIL_SEAT=owner` variant, since clean-env main is green on both
  versions.
- **Testable claims** —
  1. `COUNCIL_SEAT=owner` + installed 0.85.0 binary, `pi -p "/council-eval"`
     in scratch HOME → zero registered commands, no `Failed to load
     extension` stderr (proves factory succeeded, child branch ran).
  2. `env -u COUNCIL_SEAT -u COUNCIL_JOB_ID -u COUNCIL_RUN_ID` + same
     binary → exit 0, `[council-eval] usage:` — green on current main both
     versions.
  3. Mutation probe on `index.ts:117-121` (delete the `COUNCIL_SEAT`
     branch): claim-1 variant must flip green — proving the env split is
     the sole mechanism, testable pre-fix.

#### Principal round-2 response (job-15.5)

Read the card, the FLLWUP-14 run record, `extensions/index.ts`,
`extensions/child.ts`, `smoke/search-smoke/run.sh`, `smoke/run.sh`, and
`smoke/Dockerfile`.

- **Approach** — The contract is settled on the owner's side; I concede my
  step-2 hypothesis. (a) No load-layer delta exists (byte-identical loaders
  + clean-env 0.85.0 registering all 14 commands falsify the jiti/import
  hypothesis and the card's manifest-drift premise). (b) The real seam is
  the env-keyed mode split — `extensions/index.ts:66-69` (`const seatName
  = process.env.COUNCIL_SEAT; if (seatName) { runChildMode(...); return;
  }`) and `child.ts`'s `runChildMode` register hub tools + seat MCP but
  **zero slash commands** — version-independent, reproduced on both
  binaries. (c) The "kitty report" never came from the kitty harness: it
  hard-pins `PI_VERSION="0.84.3"`, self-provisions an npm prefix, and
  explicitly `unset COUNCIL_SEAT COUNCIL_JOB_ID COUNCIL_RUN_ID
  PI_SESSION_FILE`; the Docker path forwards only `OPENROUTER_API_KEY` +
  `SMOKE_PHASE` into the container — contamination-proof by construction
  and never exercises 0.85.0. The "stock pi 0.85.0 loads no extension"
  observation is recorded in FLLWUP-14's owner first-pass as "on the
  **runner's** stock pi (0.85.0)" — a probe launched from inside the
  council-runner seat session with `COUNCIL_SEAT=council-runner`
  inherited, exactly the contaminated context.
- **Blind spots** — (a) Owner labels the kitty attribution "inference"
  when the confirming fact is already on the FLLWUP-14 record; the env
  check deferred to implementation has effectively been done. (b) The
  devDependency constraint `>=0.84.3 <0.86.0` is not actually "consistent
  with the root cause": the root cause is version-independent, so
  `<0.86.0` is a statement about the verified interval, not a fix.
  Framing it as the fix re-imports the phantom version axis. (c) My own
  step-2 jiti/import hypothesis was the exact failure my seat prevents;
  conceded. (d) Neither seat named the actual defect shape: a seat child
  that shells out to a *parent-mode* command inherits `COUNCIL_SEAT` and
  silently downgrades the nested invocation — an env-split with no way to
  distinguish "I am a seat child" from "I am a nested parent-mode tool run
  from inside a seat child" — nothing to do with pi version.
- **Reframe** — The proposed design (driven verification through the
  installed pi's `discoverAndLoadExtensions` + devDependency range + run
  record) should land as-is. But the card's narrative is wrong: **there is
  no 0.85.0 load failure to restore.** The defect is (1) an untested
  registration seam — no gate drives `discoverAndLoadExtensions`, so the
  contract is invisible — and (2) a version-independent env-keyed mode
  split that silently downgrades nested parent-mode invocations, which the
  FLLWUP-14 runner probe tripped. The devDependency change is consistency
  housekeeping (stop riding `*`), upper bound stated as "verified
  interval," not "the fix." Acceptance #1's "red on current main" clause
  needs reframing: current main is *green* on clean env; the red case is
  the `COUNCIL_SEAT`-set assertion (zero commands), which reproduces the
  report on **both** versions — that is the honest tripwire.
- **Testable claims** —
  1. Report origin: `smoke/run.sh` forwards only `OPENROUTER_API_KEY` +
     `SMOKE_PHASE` into the container and `search-smoke/run.sh` pins
     `0.84.3` — the Docker harness cannot produce the reported symptom by
     construction; the phrase "on the runner's stock pi" places the probe
     inside a `COUNCIL_SEAT`-set session. No clean-env 0.85.0 load failure
     has ever been observed; every instance is child-mode.
  2. Silence discriminator: with `COUNCIL_SEAT` set, pi emits **no**
     `Failed to load extension ...` diagnostic (silent child mode, zero
     commands); a genuine load throw (e.g. the no-node_modules SDK
     fragility) emits that diagnostic via `main.js:749-755`. The FLLWUP-14
     report records no such diagnostic — assert this in the run record.
  3. The driven verification's two poles: clean env → `.commands.size ===
     14`; `COUNCIL_SEAT` set → `.commands.size === 0`, both via the
     installed pi's `discoverAndLoadExtensions`, both versions. The claim
     this test encodes is an env-split contract, not a version fix, so the
     goal text must not say "restore load on 0.85.0."

### Step 4 — Skeptic attack (job-15.6): no open objections

Objections filed and settled on the installed 0.85.0 binary + scratch
consumer install (git-install shape, fresh HOME under /tmp):

1. **loader.js byte-identity — CLOSED-RED (non-fatal scope).** `cmp` of
   `dist/core/extensions/loader.js` 0.84.3 vs 0.85.0 reports `differ: byte
   1018, line 21`. The `isBundledNode` variable was refactored from a local
   definition (0.84.3 line 60) to an import from `config.js` (0.85.0 line
   21). `pi-manifest.js` and `package-manager.js` ARE byte-identical
   (exit 0). The jiti config block is functionally identical for the
   npm-global path — the no-loader-API-drift conclusion holds despite the
   byte-identity claim being partially false.
2. **Env-split line numbers — CLOSED-RED for 66-69, CLOSED-GREEN for
   117-121.** `grep -n COUNCIL_SEAT extensions/index.ts` → line 117
   (`const seatName = process.env.COUNCIL_SEAT;`), 118-121 the branch +
   `runChildMode(...)`. Lines 66-69 are the `registerMaxTokensFix` body.
   Owner round 1 + both principal rounds cited the wrong location; owner
   round 2's 117-121 is correct.
3. **Clean-env 0.85.0 registers all commands — CLOSED-GREEN.** Scratch
   consumer install via `pi install -l git:...`, fresh HOME, `env -u
   COUNCIL_SEAT -u COUNCIL_JOB_ID -u COUNCIL_RUN_ID -u PI_SESSION_FILE pi
   --approve -p "/council-eval"` → exit 0, prints `[council-eval] usage:`
   with the full 17-entry fixture task list, no stderr.
4. **COUNCIL_SEAT set → zero commands → model fallthrough —
   CLOSED-GREEN.** Same install, `env COUNCIL_SEAT=owner ... "/council-eval"`
   → exit 124 (timeout on a hung model dispatch), no stdout, no stderr.
5. **Silence discriminator — CLOSED-GREEN.** `main.js:755-758` maps
   extension load errors to a "Failed to load extension" diagnostic;
   `reportDiagnostics` (73-78) prints stderr; `hasRuntimeErrors` (845) →
   `process.exit(1)` (852). Objection 4's zero stderr on an 8s run proves
   the factory did not throw — child mode ran.
6. **Smoke harness env shape — CLOSED-GREEN.** `smoke/run.sh` forwards
   only `-e OPENROUTER_API_KEY -e SMOKE_PHASE=${SMOKE_PHASE:-}` into the
   container; `search-smoke/run.sh` line 36 unsets
   `COUNCIL_SEAT COUNCIL_JOB_ID COUNCIL_RUN_ID PI_SESSION_FILE`; line 14
   pins `PI_VERSION="0.84.3"`. Contamination-proof for child mode by
   construction; never exercises 0.85.0.
7. **FLLWUP-14 deviation record quote — CLOSED-GREEN.** Step 8 contains
   the verbatim text: "the COUNCIL_SEAT/COUNCIL_JOB_ID/COUNCIL_RUN_ID env
   of this runner's session makes the extension enter child mode and
   register nothing — run.sh unsets them; found at bring-up, not assumed".
8. **Current main reproduces the symptom — CLOSED-GREEN.** HEAD worktree
   extension identical to main (same line numbers, same COUNCIL_SEAT
   check); Objection 4 proved the reproduction: COUNCIL_SEAT inherited →
   child mode → zero commands → model dispatch fallthrough. The fix is in
   the package code, not the pi version.

Verdict: **no open objections.** The core claim — the `COUNCIL_SEAT`
env-keyed mode split is the root cause, not a pi version regression — is
supported. Two factual inaccuracies in the earlier record (loader.js
byte-identity partially false; env-split line numbers) documented above,
neither fatal to the conclusion.

### Step 5 — Consolidator synthesis (job-15.7)

#### Settled

- **No pi 0.84.3→0.85.0 engine delta.** `pi-manifest.js` +
  `package-manager.js` byte-identical; `loader.js` differs only in the
  `isBundledNode` refactor (local → import) — Skeptic obj. 1,
  CLOSED-RED non-fatal: the byte-identity claim is partially false but the
  no-loader-API-drift conclusion holds.
- **Root cause = pi-council's own `COUNCIL_SEAT` env-keyed mode split at
  `extensions/index.ts:117-121`** (corrected from 66-69 — Skeptic obj. 2,
  CLOSED-RED for 66-69 / CLOSED-GREEN for 117-121), version-independent:
  child mode registers hub tools + seat MCP but zero slash commands.
- **Clean-env current main is GREEN on both 0.84.3 and 0.85.0** — all 14
  commands register (Skeptic obj. 3, CLOSED-GREEN).
- **`COUNCIL_SEAT` set → zero commands → silent model-dispatch
  fallthrough**, reproduced on both versions, no `Failed to load
  extension` diagnostic (factory succeeds, child branch runs) — Skeptic
  objs. 4 + 5, CLOSED-GREEN.
- **FLLWUP-14's "stock pi 0.85.0 loads no extension" observation came
  from a contaminated council-runner seat session** (`COUNCIL_SEAT`
  inherited), not the kitty harness — Skeptic objs. 6 + 7, CLOSED-GREEN:
  smoke harness forwards only `OPENROUTER_API_KEY` + `SMOKE_PHASE`,
  unsets council vars, pins `PI_VERSION=0.84.3`; contamination-proof and
  never exercises 0.85.0.
- **Current main reproduces the symptom** via the `COUNCIL_SEAT`-set
  pole, not a version regression — Skeptic obj. 8, CLOSED-GREEN.
- **Principal's step-2 jiti/import-stage hypothesis is falsified** —
  conceded in round 2; the seam is the factory's own env branch, not the
  loader.
- **No-node_modules SDK-resolution fragility is version-independent,
  release-shape safe, out of card scope** — follow-up note, not a fix
  here (owner tradeoff (b), uncontested).

#### Open judgment — for `product-owner`, escalating to `steward`

1. **Does the card's goal/acceptance text need amendment, or do the agreed
   deliverables satisfy it as written?** The goal says "restore extension
   load on stock pi 0.85.0"; acceptance #1 says the verification is "red
   on the current main state if the defect reproduces." The deliberation
   found clean-env current main is GREEN on both versions (nothing to
   restore), and the honest red reproduction is the `COUNCIL_SEAT`-set
   pole (zero commands) — a version-independent env-split contract, not a
   0.85.0 fix. Both seats flagged this: owner says the "red on current
   main" assertion must be scoped to the `COUNCIL_SEAT=owner` variant;
   principal says "there is no 0.85.0 load failure to restore" and the
   goal text must not say "restore load on 0.85.0." No test can settle
   whether the card-as-written is satisfied by the two-pole verification +
   run-record + pin deliverables, or whether the goal/acceptance text
   itself must be rewritten. Values/narrative-honesty tradeoff → ruling
   seat.
2. **How to characterize the devDependency pin.** Both seats converged on
   the range `>=0.84.3 <0.86.0`. The disagreement is semantic, not
   numeric: owner frames it as "consistent with the root cause" (a
   deliberate constraint expressing the verified interval); principal
   argues the root cause is version-independent, so `<0.86.0` is
   "verified-interval housekeeping, not the fix," and framing it as the
   fix "re-imports the phantom version axis." Same string, different
   narrative claim. No test adjudicates a framing → ruling seat.

#### Open objections

- **None.** All eight Skeptic objections are closed (six CLOSED-GREEN, two
  CLOSED-RED non-fatal). The two CLOSED-REDs are factual corrections to
  the record (loader.js byte-identity partially false; env-split line
  numbers 66-69 → 117-121) that do not overturn the conclusion. No
  settling test is pending, failed-on-conclusion, or unverifiable.

#### Ready to hand off?

**No.** Two open judgment calls block: (1) the goal/acceptance-framing
amendment question, and (2) the devDependency-pin characterization
question. Both route to `product-owner`, escalating to `steward`. No open
objections remain to clear first.
- `package.json`'s `@earendil-works/pi-coding-agent` devDependency is a
  deliberate version constraint consistent with the root cause (pin, range,
  or bump — the deliberation rules which), and the choice is recorded.
- Full gate set stays green (`bun test`, `bunx tsc --noEmit`,
  `python3 council/validate.py`), and the kitty smoke harness still passes
  against its pinned 0.84.3 (unchanged contract).

### Step 7 — spec written, handed to owner

Spec saved to `docs/superpowers/specs/2026-09-05-FLLWUP-21-design.md`
(full-council path; commit e5b048b). Contents: settled-context section
(no 0.84.3→0.85.0 engine delta; root cause = env split at
`extensions/index.ts:117-121`; FLLWUP-14 probe contamination; clean-env
14 commands both versions), the three deliverables per R-1/R-2, the
two-pole test's mechanism set (M1 driver-loader count assertions 14/0;
M2 real-binary `--approve -p "/council-eval"` tripwire; M3 bounded red
pole with silence discriminator), explicit-env construction discipline,
the plan doc's root-cause content contract, the devDependency pin
(`">=0.84.3 <0.86.0"` devDependencies line only, lock regeneration
in-range) with the R-2 (a)/(b)/(c) record, binding exclusions (no
mode-split behavior change; smoke/ and packaged seats/procedures
untouched), the four-gate set per `.github/workflows/gates.yml`, and
branch/PR conventions. Self-review: no placeholders, no scope beyond
the card's goal, single design per resolved point (spec §3 states the
M3 fallback explicitly). Spec committed; card set `In Progress` (commit
e5b048b, validate clean); owner dispatched.

### Step 8 — owner delivered (job-17.1), PR #37 open

Owner implemented in worktree
`.worktrees/fllwup-21-env-split-contract` (branch
`feat/fllwup-21-env-split-contract` at origin/main = 36c3c3f), pushed,
PR #37 open (observed: state OPEN, headRefOid `7f8bd6dd`, base main;
diff scope exactly bun.lock, the plan doc, package.json, the test, the
driver fixture). Deliverables: `test/env-split-contract.test.ts` +
`test/fixtures/env-split-driver.ts` (M1 counts 14/0 through the
installed pi's loader; M2 scratch-consumer `pi --approve -p
"/council-eval"` usage tripwire; M3 COUNCIL_SEAT-set red pole, ~1s
exit 1, no usage, no `Failed to load extension` — spec fallback NOT
needed), `docs/superpowers/plans/2026-09-05-FLLWUP-21-plan.md` (plan +
root-cause write-up with evidence), package.json devDependencies
`">=0.84.3 <0.86.0"` + regenerated bun.lock. Owner gates green at head:
`bun install --frozen-lockfile` exit 0 (no changes); `bunx tsc
--noEmit` exit 0; `bun test` 559 pass / 2 skip / 0 fail (561 ran, 55
files, 4 new); `python3 council/validate.py` clean. Owner deviations
recorded on the plan doc: (1) lock resolved to **0.84.3**, not the
spec's predicted 0.85.1 — owner evidence: the 0.85.0/0.85.1 band shares
byte-identical theme machinery whose bundled dark/light.json delta
breaks 4 committed theme tests, so the in-range gate-safe floor 0.84.3
(smoke's own pin) is locked with the constraint string unchanged; (2)
M2/M3 use the smoke's scratch-consumer + local-pin cwd shape instead of
literal `cwd = <repoRoot>` (a probe showed cwd=<repoRoot> clones
superpowers over the network and fails to register the extension); (3)
usage line asserted on merged streams (0.84.3 print mode emits it on
stderr; the smoke greps merged). In Review set (sole condition: open
PR, observed). Skeptic dispatch at the branch next — the 0.85.x
theme-break claim and the lock-resolution deviation are its prime
attack surface.

### Step 9 — Skeptic NO-BLOCK at head 7f8bd6dd (cycle 1 of 3)

Skeptic (job-17.2) verified at pinned subject: head SHA `7f8bd6dd`,
worktree `.worktrees/fllwup-21-env-split-contract`, loop frame stated
(step 9 precedes step 10 judging and step 11's mechanical merge,
facilitator-executed). Verdict NO-BLOCK; all objections closed-green with
real output:
- **Deviation 1 (lock 0.84.3) — CLOSED-GREEN.** Settling test: `diff -r`
  0.85.0 vs 0.85.1 theme dirs empty (byte-identical); 0.84.3 vs 0.85.1
  dark/light.json show `scrollbarThumb` changed `selectedBg`→`text` +
  `scrollbarTrack` added; theme.js fallback changed likewise — the 4
  committed theme tests asserting `scrollbarThumb === selectedBg` fail
  under 0.85.x. The claim is real; the in-range gate-safe floor 0.84.3
  lock is justified; constraint `">=0.84.3 <0.86.0"` byte-exact.
- **Deviation 2 (M2/M3 cwd shape) — CLOSED-GREEN.** Settling test:
  literal cwd=<repoRoot> probe → clones superpowers over the network
  (violates offline) + "No API key found", no registration; consumer-pin
  probe → exit 0, usage on stderr, no network. Deviation honest and
  necessary.
- **Deviation 3 (merged-stream usage) — CLOSED-GREEN.** M2 probe:
  stdout empty, stderr contains usage, exit 0, no `Failed to load
  extension`; smoke's own run.sh:112 greps merged streams — the
  assertion matches the smoke's tripwire.
- **Env-construction discipline — CLOSED-GREEN.** Mutation probe:
  runner env carried COUNCIL_SEAT=skeptic + OPENROUTER_API_KEY
  (73 chars) + JOB/RUN/PI_SESSION env; suite green — explicit-env
  construction drops all on every spawn.
- **14-command count — CLOSED-GREEN.** Source enumeration: 7 procedures
  + 5 explicit + mcp + council-tree = 14, all registered before the
  COUNCIL_SEAT branch.
- **R-2 record — CLOSED-GREEN.** Plan doc lines 77-84: (a) constraint
  string, (b) versions (lock 0.84.3 + deliberation 0.84.3/0.85.0), (c)
  none outside interval with bound meaning stated.
- **Binding exclusions — CLOSED-GREEN.** `git diff origin/main --stat`
  exactly 5 files; peerDependencies `"*"`; no smoke/, seats/, procedures/,
  or mode-split changes.

No open objections; no fix loop required. Step 10 (judge) next.

### Step 10 — judge PASS (job-17.3)

Judge dispatched with exactly the card's `goal` (verbatim) + the step-9
Skeptic evidence, subject pinned (head `7f8bd6dd`, head worktree
`.worktrees/fllwup-21-env-split-contract`), loop frame stated (step 10
precedes step 11's mechanical merge, facilitator-executed). Verdict
**PASS**, all five goal conjuncts mapped to Skeptic evidence: (1) clean
scratch HOME registers all 14 parent commands (M1 pole A); (2)
`COUNCIL_SEAT` set registers zero (M1 pole B + M3 bounded exit, no
usage); (3) driven verification through the installed pi binary (driver
via devDependency `discoverAndLoadExtensions`; M2/M3 via real
`dist/cli.js`; 4 tests, 10 expects); (4) root cause documented on the
run record with evidence (plan doc: env split `extensions/index.ts:117-
121`, zero-commands → model-dispatch fallthrough, FLLWUP-14 probe
contamination, loader-drift analysis — all cited); (5) devDependency
changed to `">=0.84.3 <0.86.0"` with regenerated bun.lock (frozen-
lockfile green; resolves 0.84.3). Gates re-confirmed; diff scope exactly
5 files. No REJECT basis raised. Step 11 (deterministic merge check)
next.

### Step 6 — route what does not close (product-owner rulings returned, applied)

Both step-5 open-judgment items were escalated per the
`<escalation_contract>`; `product-owner` ruled on them (no steward
escalation — neither ruling changes the portfolio, reverses a recorded
human decision, or implicates the card's `goal` as a defect). The rulings
are appended verbatim below as the card's Phase 1 ruling record and are
binding on every seat, `steward` included. R-1's amendment is applied
above: the `goal` frontmatter line and the `## Acceptance` section are
replaced in full with the byte-exact ruling text (the goal's no-colon-space
property is re-verified on disk via `validate.py`). R-2's framing governs
how the devDependency pin is written up in the run record (step 7 spec,
step 8 delivery, step 12 reconciliation).

Note on title: the card's historical title ("Restore pi-council extension
load on stock pi 0.85.0 and pin the devDependency") predates the
amendment and was **not** covered by the ruling — no title change was
ruled. The title stays as filed; the judge never sees it (step 10
dispatches the judge with the card's `goal` and the Skeptic's evidence
only — nothing else), and the board line is unchanged.

## Phase 1 rulings (product-owner, step-6 escalations)

**R-1 (card goal/acceptance amendment — ADOPTED).** The mechanism test proves no 0.85.0-specific load failure exists to "restore" — clean-env current `main` registers all 14 commands on both 0.84.3 and 0.85.0, and the honest reproduction is the `COUNCIL_SEAT`-set pole (zero commands, silent fallthrough to model dispatch), a version-independent env-split contract. The card is Deliberating, so the text is editable; the deliverables (two-pole driven verification, root-cause run record, deliberate devDependency constraint) stand unchanged — this is a wording fix to make the face say what the work proves. The goal and acceptance are replaced in full with:

goal: The pi-council package's env-keyed parent/child mode split at `extensions/index.ts` registers all parent-mode slash commands on stock pi in a fresh scratch HOME and registers zero slash commands when `COUNCIL_SEAT` is set, proven by a driven headless verification asserting both poles via the installed pi binary, with the root cause of the env-split fallthrough documented and the devDependency on `@earendil-works/pi-coding-agent` changed to a deliberate version constraint consistent with the verified interval.

## Acceptance

- A driven headless verification (test-side, in the repo's gate set) that
  loads the packaged extension through the installed pi binary and
  asserts both poles of the env-split contract end-to-end: a clean
  scratch HOME with no council configuration registers all parent-mode
  slash commands; the same scratch HOME with `COUNCIL_SEAT` set
  registers zero slash commands. The `COUNCIL_SEAT`-set pole is the red
  reproduction of the env-split fallthrough on the current `main` state
  and stays red on every version the verification targets; the clean-env
  pole is already green on the current `main` state and stays green.
- The root cause of the env-split fallthrough (the silent
  `COUNCIL_SEAT`-keyed mode split in `extensions/index.ts` and the
  downstream unregistered-command → model-dispatch path) is documented
  on the card's run record with evidence, not guessed.
- `package.json`'s `@earendil-works/pi-coding-agent` devDependency is
  changed to a deliberate version constraint consistent with the verified
  interval, and the choice is recorded on the card's run record.

**R-2 (devDependency pin framing — VERIFIED-INTERVAL HOUSEKEEPING).** The `">=0.84.3 <0.86.0"` constraint on `@earendil-works/pi-coding-agent` is verified-interval housekeeping, not the fix. The root cause — the env-keyed parent/child mode split at `extensions/index.ts:117-121` — is version-independent (Skeptic objections closed-green). The pin bounds the dev environment, which was silently riding `"*"` and had no end-to-end registration falsifier. The constraint string says "we have tested this range; we have not verified beyond the upper bound," not "this range restores the fix." The run record MUST record (a) the constraint string chosen, (b) the version(s) it was empirically verified against, and (c) the version(s) it was empirically verified to fail against outside the interval, so a future reader can see what the upper bound actually means. Reversibility is trivial — one line in `package.json`.
