---
id: FLLWUP-21
title: Restore pi-council extension load on stock pi 0.85.0 and pin the devDependency
state: Deliberating
owner: null
epic: EPIC-6
goal: The pi-council package's extensions load and register their commands on stock pi 0.85.0 from a fresh scratch HOME with no council configuration, proven by a driven headless verification asserting command registration succeeds on the installed stock pi, with the root cause of the load failure documented and the devDependency on @earendil-works/pi-coding-agent changed to a deliberate version constraint.
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
  loads the packaged extension the way stock pi does and asserts command
  registration succeeds on the installed stock pi — red on the current
  `main` state if the defect reproduces, green after the fix.
- The root cause of the 0.84.3 → 0.85.0 load failure is documented on the
  card's run record (the concrete API/manifest delta, with evidence), not
  guessed.

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
- `package.json`'s `@earendil-works/pi-coding-agent` devDependency is a
  deliberate version constraint consistent with the root cause (pin, range,
  or bump — the deliberation rules which), and the choice is recorded.
- Full gate set stays green (`bun test`, `bunx tsc --noEmit`,
  `python3 council/validate.py`), and the kitty smoke harness still passes
  against its pinned 0.84.3 (unchanged contract).
