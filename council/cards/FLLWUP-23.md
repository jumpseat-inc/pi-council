---
id: FLLWUP-23
title: Named failure for pi-council installs missing node_modules
state: Deliberating
owner: null
epic: EPIC-6
goal: Installing the pi-council package without its node_modules dependencies produces a named diagnostic at extension load instead of a silent zero-command state, proven by a driven test that loads the extension from a dependency-less install and asserts the diagnostic names the missing module and the remedy.
---

## Intent

Filed from FLLWUP-21's delivery (council-runner report, owner tradeoff (b),
out of that card's scope): when the package is installed by path or copy
without its `node_modules` — a real install shape for consumers vendoring
the repo — extension load currently dies with `Cannot find module
'@modelcontextprotocol/sdk'` surfaced as a generic loader error, and the
consumer-visible result is a silent zero-command state: no `/council-*`
commands, no explanation. The env-split card proved how opaque a
zero-command state is to diagnose (FLLWUP-21's whole root-cause arc); this
card closes the cheapest instance of that opacity.

This card adds a load-time guard or catch that turns the missing-dependency
case into a named diagnostic — which module is missing and what remedy
installs it (`bun install` / `npm install` at the package root) — asserted
by a driven test that loads the extension from a dependency-less install
shape and asserts the diagnostic text. The deliberation rules the mechanism
(try/catch around the dependency import, a load-time presence check, or an
equivalent); the card requires only that the failure be named, not silent,
and that the diagnostic be asserted by a driven test. Filed under EPIC-6
per the run's standing orchestrator directive; surface is extension-load
robustness, not the model picker.

## Acceptance

- A driven test loads the extension from a dependency-less install shape
  (scratch dir without `node_modules`, or an equivalent the deliberation
  rules) and asserts the diagnostic names the missing module and the
  remedy command.
- A normal install's load path is byte-identical in behavior (the guard
  fires only on the missing-dependency case).
- The diagnostic is actionable prose, not a stack trace alone.
- Full gate set stays green (`bun test`, `bunx tsc --noEmit`,
  `python3 council/validate.py`).

## Execution (run record)

### Step 1 gate (2026-09-05, runner container)

**Full council, surface-touching — designer seated.** The card is
spec-ambiguous by its own Intent ("the deliberation rules the mechanism
(try/catch around the dependency import, a load-time presence check, or an
equivalent)") — the goal admits more than one reasonable design for where
and how the guard fires. Surface-touching per the council.md test ("an
error state"): the deliverable is user-visible diagnostic prose that
replaces pi's generic loader line + silent zero-command state, and the
card's contract is that the failure be *named* — which module and which
remedy. So `designer` joins `owner`/`principal` as a third generator in
steps 2–3. Cross-seam by construction: the load path (`extensions/`),
the driven test (`test/` + a fixture), and the guard's placement all move
together.

Evidence base (this container): `extensions/index.ts` statically imports
`./mcp/index.ts`, which statically imports `./client.ts` and `./oauth.ts`
— the only `@modelcontextprotocol/sdk` import sites in `extensions/` are
`client.ts:1-4` and `oauth.ts:3,7`. With no `node_modules`, jiti fails
resolving `@modelcontextprotocol/sdk/client`, so the factory never runs
(zero commands) and pi's loader diagnostic names only the top-level entry.
Healthy install: `node_modules/@modelcontextprotocol/sdk` 1.30.0 present.
The env-split contract suite (`test/env-split-contract.test.ts` + driver
fixture) loads the packaged extension through the installed pi's loader
with fully explicit envs — the surface a guard that misfires on healthy
installs will trip (orchestrator binding: it must stay green).

Environment note (FLLWUP-24 binding): this container's
`node_modules/@earendil-works/pi-coding-agent` is **0.84.2** while
`bun.lock` resolves **0.85.1** — the installed deps drift from the lock.
Per the binding, no local gate output is trusted before the dev tree is
synced (`bun install --frozen-lockfile`), and every gate run must happen
in a worktree whose node_modules is synced from the lock first; noted
here and bound into every dispatch brief.

### Step 2 — independent first pass (2026-09-05, runner container)

Owner (job-19.1), principal (job-19.2), designer (job-19.3) dispatched in
parallel, isolated inputs (card + binding facts only). Positions appended
verbatim below.

#### Owner position (job-19.1)

Grounding: vault/wiki index, [[pi-council-overview]], [[mcp-support]],
[[council-dependencies]], [[repository-grounding]], plus
`docs/superpowers/plans/2026-09-05-FLLWUP-21-plan.md` (authoritative gates:
`.github/workflows/gates.yml` — frozen-lockfile install, `bunx tsc
--noEmit`, `bun test`, `python3 council/validate.py`).

- **Mechanism ruling — catch the guarded lazy import; a presence check is
  ruled out on evidence.** Static imports hoist: any try/catch or fs-probe
  in `index.ts`'s body runs only *after* the whole import graph evaluated.
  The SDK is reachable through four static paths from `index.ts`, not one:
  `index.ts:13` → `./mcp/index.ts`; `index.ts` → `child.ts:4`; `index.ts` →
  `hub-tools.ts:9`; `index.ts` → `eval-runner.ts:32` → `dispatch.ts:16`.
  The guard is unreachable unless all four sites stop statically importing
  `mcp/index.ts`. Detection must be the import attempt itself, not a probe:
  jiti's resolver for a missing bare specifier is two-stage (verified in
  `node_modules/jiti/dist/jiti.cjs`, `jitiResolve`): walk `node_modules` up
  from the extension file, then fall back to `nativeRequire.resolve` bound
  to the loader's own location. Proven empirically: a dep-less scratch copy
  of the extension loaded 14 commands with no error in this container,
  because pi 0.84.2's loader sits inside this repo's `node_modules` and its
  `createRequire` walk finds the SDK there. The card's "no node_modules ⇒
  jiti fails" is true only when *both* walks fail — the field shape (pi
  installed elsewhere; clone at `~/.pi/agent/git/...` without
  `node_modules`). An fs-walk probe from `PKG_ROOT` diverges from the actual
  resolver in both directions (SDK resolvable via pi's tree when the clone
  has none → probe false-fires on a healthy-by-resolution install). Only an
  actual import through the same chain fires exactly when the static chain
  would have failed. Additional evidence: with the real repo's SDK
  temporarily hidden, the current failure *escapes the loader entirely*
  under Bun — `discoverAndLoadExtensions` rejects with a raw `TypeError:
  The "paths[0]" property must be of type string, got undefined` — not a
  wrapped `Failed to load extension:`, and the text does not name the SDK.
  So (i) an error-text discriminator on `message.includes('@modelcontextprotocol/sdk')`
  would miss the Bun runtime; (ii) the guard must not rely on pi's loader
  wrapping — it must catch a normal dynamic-import rejection inside the
  factory's own async control flow.
- **Ruling:** a new SDK-free module (`extensions/mcp-load.ts`, node-builtins
  only) exporting a memoized `getMcp()`: `try { return await
  import("./mcp/index.ts") } catch (e) { try { await
  import("@modelcontextprotocol/sdk/client") } catch { return "missing-sdk"
  } throw e }`. The four static sites switch to this guarded lazy load. On
  `index.ts`'s parent branch, `missing-sdk` ⇒ register all non-MCP commands
  normally plus a `/mcp` command whose description and handler carry the
  named prose (module + remedy + `/reload`), and `console.error` the same
  one-liner at load; `session_start` skips `connectParentServers`,
  `session_shutdown` skips `closeAll`, `hub-tools.ts:127-137`/
  `dispatch.ts:71-80` yield zero MCP tool names plus a warning, `child.ts:31`
  skips `startSeatMcp` with a warn. Non-SDK failures of the lazy import
  rethrow → unchanged honest loader surface. `hub.ts` untouched (AGENTS.md 7).
- **Driven-test shape — a node_modules copy minus the SDK.**
  `test/fixtures/dep-less-driver.ts` (env-split-driver pattern; explicit
  envs only — the bearer shell carries `COUNCIL_SEAT` and contaminated a
  naive probe): loads `[<root>/extensions]`, emits one JSON line with the
  full `name → description` command map and `errors`. The suite
  (`test/fllwup23-dep-less.test.ts`) builds the dependency-less install
  once: scratch = `cp -a`/`-al` of this repo's `node_modules` minus
  `@modelcontextprotocol`, plus copies of `extensions/`, `council/procedures/`,
  `themes/` (themes are read at load — `seats.ts:59`; omission yields a
  spurious ENOENT, observed), and the driver itself inside the scratch so
  its own pi import resolves from the scratch tree. Run end-to-end and
  proven faithful: missing copy ⇒ `errors[0] = "Failed to load extension:
  Cannot find module '@modelcontextprotocol/sdk/client'\nRequire stack:\n-
  .../extensions/mcp/client.ts"` (field shape, load fails, zero commands);
  same copy with the SDK restored ⇒ 14 commands, normal `/mcp`, no errors.
- **Byte-identical-on-healthy-install:** the four static `./mcp/index.ts`
  imports become a memoized dynamic import resolved inside the factory; on
  success the callsites receive the identical module object and every
  registration/connect path is unchanged; the guard adds zero output on the
  healthy path. The only evaluable difference is mcp module evaluation
  timing, which the env-split suite observes as identical (M1 pole A 14
  commands; M2 real-binary `/council-eval` unaffected; M3 child pole zero).
- **Testable claims:** C1 (acceptance, red today): `bun test
  test/fllwup23-dep-less.test.ts` — on current code the missing-copy run
  yields `errors` non-empty/commands 0 (RED); post-guard: one JSON line,
  `errors` empty, 14 commands, `mcp` description matches
  `/@modelcontextprotocol\/sdk/` and `/(bun install|npm install)/`, driver
  stderr carries the load-time prose. C2 (healthy byte-identical):
  `bun test test/env-split-contract.test.ts` stays green (M1/M2/M3) plus
  healthy controls assert zero diagnostic tokens in any description; then
  frozen-lockfile + tsc + bun test + validate in order on a synced
  worktree (0.85.1). C3 (discriminator honesty): corrupt the copied
  scratch's `extensions/mcp/oauth.ts` (top-level `throw`) with the SDK
  present — lazy import fails for the real reason, SDK confirm-succeeds,
  `errors` non-empty, loader surfaces `Failed to load extension:` (no
  masking). C4 (version-independence): guard keys on the resolution
  attempt, not error text/fs layout — same suite green after worktree sync
  to lock-resolved 0.85.1.
- **Tradeoffs accepted:** mcp module evaluation moves from graph-top to
  factory time (healthy: behavior-identical, ordering-only); four
  mechanical import-site edits (`index.ts`, `child.ts`, `dispatch.ts`,
  `hub-tools.ts`) — `hub.ts`, `mcp/*` internals, `council/*`, `smoke/*`,
  FLLWUP-22 theme code untouched; in the dep-less state a latent non-SDK
  bug inside `mcp/*` is masked by the missing-dep diagnostic until deps are
  installed (benign, one-sided); child seats with MCP grants in a dep-less
  install run without MCP tools and a warning instead of crashing; the
  suite fixtures ~274 MB of `node_modules` per run (bounded,
  hardlink-copy when the fs allows) — the price of a faithful
  reproduction.

#### Principal position (job-19.2)

Cross-seam reading:

- **The failing edge is a static-import edge, and it fails before any
  pi-council code runs.** `extensions/index.ts` statically imports
  `./mcp/index.ts` (index.ts:13), which statically imports `./client.ts`
  and `./oauth.ts` — the only `@modelcontextprotocol/sdk` value-import
  sites in `extensions/` (client.ts:1-4, oauth.ts:3; oauth.ts:7 is `import
  type`, erased at runtime). Three other files also statically import
  `./mcp/index.ts` — child.ts:4, hub-tools.ts:9, dispatch.ts:16 — so the
  SDK is reachable from every process (parent and seat child) through one
  shared edge. pi's loader resolves the whole graph before the factory can
  be called (`dist/core/extensions/loader.js:365` `await
  jiti.import(extensionPath, …)` throws on the unresolvable specifier;
  `loadExtension` wraps it at loader.js:395-416 into `{ extension: null,
  error: "Failed to load extension: ${message}" }`). Nothing in
  `extensions/` has executed at that point. A `try/catch` in the factory is
  a no-op for this failure — the card's "try/catch around the dependency
  import" mechanism is only reachable if the import is *dynamic*, i.e. if
  client.ts:1-4 and oauth.ts:3 are de-static-ed. The three listed
  mechanisms are one prerequisite (lazy imports) plus one consequence (a
  load-time presence check), not three options.
- **The "silent zero-command state" framing is wrong for the CLI surface.**
  On a missing-dependency install, the normal pi runtime does *not*
  continue with zero commands: `main.js:633-636` maps every loader error
  to a `type: "error"` diagnostic `Failed to load extension "${path}":
  ${error}`, and `main.js:719-723` prints `Hint: Start without extensions
  using "pi -ne"` and `process.exit(1)` for all modes. The consumer sees
  an exit-1 and a generic line, not silence. The "silent zero-command
  state" is the FLLWUP-21 child-mode scenario (factory succeeds, child
  branch runs, zero commands, no diagnostic — asserted by
  env-split-contract's M1-pole-B/M3 `not.toContain("Failed to load
  extension")`). FLLWUP-23 is a *different* failure: loud-but-cryptic, not
  silent. The "session continues with zero commands (pi main.js:749-755)"
  reading is not supported by main.js — 749-755 sits in the interactive
  branch, after the unconditional exit-1 at 719-723.
- **What the guard can and cannot own.** The named prose becomes the
  *innermost* `${message}` that survives two wrappers: loader.js:415, then
  main.js:635. The package cannot replace pi's outer "Failed to load
  extension" line, the exit-1, or the `-ne` hint. Achievable contract: the
  inner payload changes from a raw `Cannot find module
  '@modelcontextprotocol/sdk/client'` to actionable prose naming the
  package, the missing module, and `bun install`/`npm install` at `PKG_ROOT`
  (`seats.ts:29`, one level above `extensions/`). The `-ne` hint pi appends
  is actively wrong here — "start without extensions" deletes the council
  rather than repairing the deps; the diagnostic should counter it.
- **The fixture's "dependency-less shape" is itself a seam.** The
  extension's module-eval reads packaged assets *before* the SDK edge is
  reached: `seats.ts:63-64` runs `loadShippedTheme("dark"/"light")` at
  module top, reading `<PKG_ROOT>/themes/…`, and seats.ts is imported
  (index.ts:5) before the mcp import (index.ts:13). A scratch copy
  containing only `extensions/` fails with `ENOENT …/themes/pi-council-dark.json`
  at seats.ts module-eval — the theme error fires first and the SDK guard
  is never reached. The honest dependency-less shape is "the committed
  package tree minus `node_modules`," minimally `extensions/` + `themes/`
  (and, to be future-proof, `council/`).
- **Reframe.** The card's three candidate mechanisms are one design under
  two names: the guard must live on the far side of a de-static-ed SDK
  import, and it must be a synchronous presence check, not a dynamic-import
  probe. (1) Convert client.ts:1-4 and oauth.ts:3 to `await
  import("@modelcontextprotocol/sdk/…")` inside the methods that use them
  — the smallest cut, leaving child.ts/hub-tools.ts/dispatch.ts/index.ts's
  `./mcp/index.ts` imports static and untouched. (2) Add a synchronous
  presence check (resolution probe via `import.meta.resolve(
  "@modelcontextprotocol/sdk/client")`, or a filesystem probe) as the
  *first* statement of the factory — before the `if (seatName)
  runChildMode(...)` split (index.ts:117-121) so seat children get it too —
  throwing the named prose on failure. Sync, not async, so the factory
  stays sync and no SDK is eagerly loaded into MCP-less children
  (preserving "byte-identical in behavior"; strictly *less* eager work
  than today, since the SDK currently loads at module-eval in every
  process). (3) The thrown prose becomes the inner `${message}` under pi's
  fixed wrappers; acceptance must assert the *payload* (names
  `@modelcontextprotocol/sdk` + `bun install` + the path), and should name
  the `-ne` misdirection.
- **Testable claims.** Claim 1 — a factory try/catch is unreachable until
  the SDK imports are lazy: canary as first statement of the factory, then
  `mv node_modules/@modelcontextprotocol node_modules/.bak`, run the
  driver; expected `errors[0].error` is `Failed to load extension: Cannot
  find module '@modelcontextprotocol/sdk/…'`, canary never printed. Claim
  2 — the fixture must ship `themes/`, not just `extensions/`: on current
  main, the same copy without `themes/` errors `ENOENT …/themes/pi-council-dark.json`
  (seats.ts:63-64 at module-eval), proving the theme read precedes and
  masks the SDK edge. Claim 3 — the consumer surface is exit-1 + nested
  wrappers, not silence; the guard only changes the payload: on a copied
  committed tree (extensions/+themes/+council, no node_modules), run the
  real CLI `node <lock-resolved-pi>/dist/cli.js --approve -p
  "/council-eval"` with a clean explicit env. On main: exit 1, stderr
  contains the doubled wrapper + `Cannot find module` + `-ne` hint;
  post-fix: same exit-1 and outer wrapper, inner payload names the module
  and `bun install`, stderr still carries the (wrong) `-ne` hint which the
  prose must counter. Env-split M1/M2/M3 (healthy-install guard-misfire
  tripwire) must stay green, run against lock-resolved pi after
  `--frozen-lockfile` sync.

#### Designer position (job-19.3)

- **The first observable event should be a named extension-load error, not
  a command/help result.** The diagnostic must identify the missing
  package, give a concrete remedy, and explain that the extension did not
  initialize. Semantic copy: `pi-council could not load: Node could not
  resolve the runtime package "@modelcontextprotocol/sdk" (first
  unresolved entry: "@modelcontextprotocol/sdk/client"). Council commands
  are unavailable; this is an installation dependency error, not an MCP
  configuration or authentication error. At the package root (the directory
  containing package.json), run bun install (or npm install), then restart
  pi.` The guard must be inert on a healthy install: no new diagnostic, no
  new command, no change to command registration or session behavior.
- **Gulfs closed:** Gulf of Execution (a person who copied/vendored the
  package and sees no Council commands can act without remembering
  package-manager conventions) and Gulf of Evaluation (cause explicit at
  the loader boundary instead of a zero-command state or generic stack
  trace).
- **Static import placement:** the failure occurs during extension import,
  before the default factory runs and before any `registerCommand` calls;
  a guard in a command handler, `session_start`, `client.ts`, or `oauth.ts`
  is too late for the first unresolved SDK import. The exact mechanism
  (presence check, catch, or safe dynamic import) is the Council's to rule
  separately.
- **Package-root context:** `package.json` already declares
  `@modelcontextprotocol/sdk` under runtime `dependencies`; the message
  must distinguish a vendored package root from the consumer project and
  must not suggest changing MCP configuration or running `/mcp login`.
- **Reachability through loader errors, not a UI affordance:** the
  installed pi loader catches module-load failures and returns them in
  `extensionsResult.errors` (loader.js:399-416); the CLI reports loader
  failures as `Error: Failed to load extension ...` and exits before normal
  session use (`dist/main.js:633-635,718-723`). The named text must be part
  of the load error itself so it reaches both programmatic
  `discoverAndLoadExtensions` callers and human-facing stderr; a mere
  `console.log` from a later factory is not sufficient.
- **Do not make the command the remedy:** there may be no TUI, no
  registered commands, no extension `ctx` in this state; a new fake command
  would not be reachable. The host's generic `pi -ne` hint disables
  extensions but does not repair the installation, so it must not be the
  package's primary answer.
- **Falsifiable predictions:** (1) healthy install, clean environment:
  real loader returns zero errors, one extension, the existing 14-command
  parent set; `pi --approve -p "/council-eval"` exits successfully, prints
  the usage line, no new dependency diagnostic; `COUNCIL_SEAT=judge` pole
  still zero commands without a new load error — the existing
  `test/env-split-contract.test.ts` contract is the regression falsifier.
  (2) dependency-less install, clean environment: zero extensions,
  non-empty `errors`; `errors[0].error` must contain the package name,
  actual unresolved entry, package-root instruction, `bun install` or
  `npm install`, and restart guidance. (3) human-facing channel: CLI exits
  nonzero, emits the named diagnostic in the load-error position before any
  generic host hint, emits no `/council-eval` usage or model response, no
  command registration; the test must inspect the first actionable load
  diagnostic or the loader error payload, not grep anywhere after startup.
  (4) recovery: after the package-root install and restart, the same load
  path behaves like the healthy case — zero errors, 14 commands, no
  residual named diagnostic. (5) isolation: the driven test must not
  accidentally resolve a parent workspace's SDK and must scrub inherited
  `COUNCIL_*` vars.
- **Preferences (surface-copy decisions, not semantic requirements):**
  exact prefix/line breaks; whether to include the first unresolved subpath;
  whether to retain each sentence; absolute vs portable package-root path;
  `bun install` vs `npm install` primary; a dedicated TUI panel is not
  required if the load error is surfaced.
- **Implementation details for the Council to rule separately:** static
  presence check vs import catch/dynamic import; how the actual unresolved
  specifier is extracted; whether the guard returns an error or throws; how
  the test captures loader output and isolates module resolution; whether
  the existing `PKG_ROOT` seam in `extensions/seats.ts:29` is used.

### Step 3 — bounded exchange, round 1 (positions stabilized by principal +
designer; owner job-19.4 stalled mid-round and was re-dispatched as job-19.7)

Round-1 responses of principal and designer appended verbatim. The owner's
round-1 response follows in re-dispatch job-19.7 (the original job-19.4
stalled after 20 turns during dep-less boot probes — no final position
emitted — re-dispatched once per the stall protocol).

#### Principal round-1 response (job-19.5)

One hard constraint named up front: this seat's tool grant is read/grep/find/ls
only — no shell — so the `import.meta.resolve(...)` probe could not be
literally executed under Bun; evidence substituted from source.

- **The four paths are four routes to the same two files, not four SDK
  edges.** Exactly five `@modelcontextprotocol` import statements in
  `extensions/`, all value-imports except one: `client.ts:1-4` (values)
  and `oauth.ts:3` (values) ; `oauth.ts:7` is `import type`, erased at
  runtime. The four static paths (`index.ts:13`, `child.ts:4`,
  `hub-tools.ts:9`, `dispatch.ts:16`) all import `./mcp/index.ts`, which
  imports `client.ts`/`oauth.ts` — they do not each independently import
  the SDK. "De-static client/oauth at method level" leaves **zero** static
  SDK edges in any process shape. The owner's counterpoint is wrong as "a
  static edge survives", right as "de-static alone doesn't satisfy the
  card".
- **Why de-static alone fails is the reverse of the step-2 argument:** the
  step-2 pairing of de-static + `import.meta.resolve` presence check is
  invalidated by the owner's counterpoint (2), confirmed from source:
  jiti's resolver (`unjs/jiti` `src/resolve.ts`) is an ESM-conditions walk
  with `parentURL` = the importing file, then `ctx.nativeRequire.resolve(id,
  { paths })`, then extension fallbacks, then `throw lastError`;
  `nativeRequire` = `createRequire` bound to the loader's own
  `import.meta.url`. `import.meta.resolve(spec)` under Bun walks
  node_modules up **from the importing module only** — reproduces stage 1
  and cannot see stage 2's loader-location fallback. A PKG_ROOT-based probe
  diverges from the real import by construction and would **false-fire a
  named "missing SDK" error on an install that jiti resolves successfully**
  — a direct violation of acceptance. Even if it throws, it throws on the
  wrong input; immaterial whether the probe throws or returns.
- **The load-error wrapping contract is version-sensitive.** pi 0.84.2
  `loader.js:395-416` wraps as `{ extension: null, error: "Failed to load
  extension: ${message}" }`; `discoverAndLoadExtensions` returns `{
  extensions, errors }`. The owner's raw `TypeError: The "paths[0]"
  property must be of type string` observation is consistent with jiti's
  `nativeRequire.resolve(id, { paths })` throwing under Bun when both
  stages fail — and does **not** name the SDK. An error-text discriminator
  on `message.includes('@modelcontextprotocol/sdk')` is unsafe on Bun, and
  reliance on pi's wrapper *text* is unsafe across versions. Both owner
  claims are correct.
- **The decisive cross-seam fact: `package.json` already encodes which
  specifier fails first.** pi-council declares `@modelcontextprotocol/sdk`
  under `dependencies` (`^1.30.0`) but `@earendil-works/pi-coding-agent`
  and `typebox` under `peerDependencies`; pi 0.84.2's own package.json
  carries `typebox`/`@earendil-works/pi-tui`/`@earendil-works/pi-ai` and
  **no** `@modelcontextprotocol/sdk`. In the field shape (clone vendored
  without node_modules, pi installed elsewhere), every bare specifier the
  extension imports resolves via pi's tree through jiti stage 2 **except**
  `@modelcontextprotocol/sdk` — the SDK is the *only* unresolvable
  specifier. "Committed tree minus node_modules" is therefore a faithful
  fixture — fragile, currently-true-by-accident property of dependency
  *classification*, not a structural guarantee.
- **Reframe — the synthesis:** keep `client.ts`/`oauth.ts` static (SDK
  stays inside `mcp/`); make the *four* `./mcp/index.ts` sites lazy behind
  a memoized `getMcp()` whose import attempt *is* the probe (the owner's
  cut); **but on `missing-sdk`, throw the named prose as the factory's
  first act** so the loader returns `extension: null` with the prose as
  the inner `message` (the designer's surface). Reject the
  `import.meta.resolve` presence check entirely. Factory becomes async
  (the loader already does `await factory(api)`, loader.js:404); its first
  statement is `await getMcp()`; `getMcp()` does
  `try { await import("./mcp/index.ts") } catch (e) { try { await
  import("@modelcontextprotocol/sdk/client") } catch { throw new
  Error(<named prose>) } throw e }`. The secondary import runs only after
  the primary already failed; a real bug in `mcp/*` with the SDK present
  rethrows → honest loader surface. Yields: extension `null`, non-empty
  `errors`, exit-1, named prose reaching both `discoverAndLoadExtensions.errors`
  and stderr, healthy install byte-identical, detection faithful to jiti's
  two-stage walk, before the `seatName` split so children get it too.
- **Testable claims:** (1) after de-static of client.ts:1-4/oauth.ts:3
  values, `grep -rn "from \"@modelcontextprotocol" extensions/` returns
  only `oauth.ts:7` (`import type`) — no static value edge survives in any
  shape. (2) `import.meta.resolve("@modelcontextprotocol/sdk/client")`
  from a scratch extension fails while jiti.import succeeds via stage-2 —
  the false-fire reproduction (not executed — no shell — two-line repro
  left for the runner). (3) The `paths[0]` escape falsifies any error-text
  discriminator. (4) Fixture fidelity is decided by *which pi loads the
  extension*, not the shape: under lock-resolved pi (0.85.1) both shapes
  reproduce the field failure; under drift 0.84.2 neither does (stage-2
  tree resolution). Precondition = the FLLWUP-24 lock-sync binding; the
  cheap fixture is faithful iff the driver runs under lock-resolved pi and
  asserts the diagnostic names `@modelcontextprotocol/sdk`. (5)
  Reconciliation: ship `themes/` in both shapes; use "committed tree minus
  node_modules" as the missing-direction fixture; treat "byte-identical on
  healthy install" as env-split's existing job.
- **What remains genuinely open:** (1) **load-error vs partial-load fork
  is a product decision, not a technical fact** — the acceptance is
  satisfied by both; sides with designer on title ("Named *failure*")
  and intent ("extension load currently dies"), but card text does not
  force it; needs a ruling. (2) Whether the factory may become async —
  `await factory(api)` tolerates it, but any synchronous caller would
  break; needs a check. (3) How the "first unresolved entry" is sourced —
  under Bun it is NOT extractable from the native throw; either hardcode
  the known first entry (`@modelcontextprotocol/sdk/client` from
  `client.ts:1`) or accept package-only naming on Bun. (4) Copy decisions
  remain the designer's.

#### Designer round-1 response (job-19.6)

Adjudicates for the **named-load-error contract** (principal's mechanism,
its own prediction 3) and against the **diagnostic-command variant**
(owner's).

- The loader owns the channel: `loader.js:395-416` wraps every thrown
  error as `Failed to load extension: ${err.message}`, `main.js:633-635`
  nests it again, `main.js:721` appends the yellow `-ne` hint and exits 1.
  A person reading stderr sees "Failed to load extension" twice before
  anything else. The partial-load variant's diagnostic lives in `/mcp`'s
  `description` — text a person never reads at extension load (palette
  strings, not the loader-error payload) — plus a load-time console.error
  one-liner. Both are weaker channels than the loader error. The card's
  goal is "what happened + what to do at the moment of failure", and that
  moment is the load-error.
- **Gulf closed:** Gulf of Evaluation at first invocation (exit-1, named
  diagnostic naming package + missing module + remedy at package root,
  before the `-ne` misdirect can be followed); Gulf of Execution for the
  seat-child case (`COUNCIL_SEAT` set, dep-less): the synchronous presence
  check at factory top fires before `runChildMode`, so seat children
  surface the same named prose rather than crashing at first MCP-tool use.
- **Principle:** reachability through the existing channel beats adding a
  new affordance; constraint over configuration — the guard's purpose is
  to convert a non-actionable TypeError into an actionable one. If the
  guard throws a constructed `Error("pi-council could not load: ...")`,
  that string survives both wrappers. No new fake command as remedy
  stands: a `/mcp` command naming the missing dep is a signifier in a
  channel the person does not reach when the extension fails to load.
- **Falsifiable predictions:** (P1) healthy install byte-identical —
  env-split M1/M2/M3 stay green; driver emits `errors` empty, `commands:
  14`, no diagnostic text in any description. (P2) dep-less driven test
  names package + module + remedy + counters `-ne`: `errors[0].error`
  contains `@modelcontextprotocol/sdk`, `bun install` AND `npm install`,
  package-root instruction, `restart`, and a `-ne` counter ("do NOT use
  pi -ne ..."). Bun-binary equivalence because the throw is constructed
  inside the factory, after jiti's resolver returns. (P3) headless CLI
  channel ordering: exit 1, `errors[0].error` text appears in stderr
  before the `-ne` hint. (P4) counterfactual: owner's variant produces
  `errors: []`, `commands: 14`, diagnostic in command description only —
  acceptance "named diagnostic at extension load" fails on its own terms.
  (P5) discriminator honesty: if a sync probe false-fires on a healthy
  install, M1 pole A breaks (14 → 0); if implementation cannot prove
  probe/resolver equivalence, fall back to the owner's actual-import
  guard — the named-load-error contract is achievable from either
  mechanism, so the diagnostic-command is not necessary. (P6) fixture
  must include `themes/` (+council/): `seats.ts:59` reads
  `loadShippedTheme("dark")` at module-eval; an extensions/-only copy
  ENOENTs before the SDK edge is reached.
- **Surface-copy decisions retained (design seat):** semantic content of
  the prose (name the package `@modelcontextprotocol/sdk`, the first
  unresolved subpath, remedy `bun install`/`npm install` at package root,
  restart, explicit counter to `pi -ne`); "pi-council could not load:"
  prefix attributing failure to the package; portable package-root phrase
  ("the directory containing package.json") not absolute; channel order
  (loader-error string first, then the `-ne` counter).
- **Released to owner (implementation):** sync probe vs dynamic-import
  catch — deciding factor is whether `import.meta.resolve(...)` can be
  proved equivalent to jiti's two-stage walk (if yes, sync probe; if not,
  the dynamic-import catch with a re-thrown Error is safer; either way the
  thrown string is the contract); where the throw lives (factory top vs
  child.ts entry); fixture construction (cp -a/-al, scratch HOME, COUNCIL_*
  scrub).
- **Preferences (taste, ranked last):** sync probe over dynamic-import
  catch on cost/cognition grounds; prose leads with the package name, not
  the subpath; `-ne` counter phrased as "Do NOT use `pi -ne` — it disables
  extensions entirely; this is a missing dependency, not an extension
  configuration error".

#### Owner round-1 response (job-19.7 — re-dispatch of stalled job-19.4)

**(a) Named-load-error verdict — conceded, on evidence.** Consumer-facing
channel probe in this container (dep-less scratch pinned via `.pi/settings.json`,
real CLI `node dist/cli.js --approve -p /council-eval`): exit **1**, stderr:
`Error: Failed to load extension "<scratch>/extensions/index.ts": Failed to
load extension: Cannot find module '@modelcontextprotocol/sdk/client'` /
`Require stack:` / `- <scratch>/extensions/mcp/client.ts` / `Hint: Start
without extensions using "pi -ne".` — the designer is right that a person
reads this first; a `/mcp` palette string and a console.error are weaker
channels, and "diagnostic **at extension load**" favors the loader-error
payload. The partial-load variant is abandoned entirely; the named-load-error
design needs **zero** of the five sentinel branches. Honest correction to
step 2: the raw `TypeError: "paths[0]"...` belongs to a different channel
(Bun-native `import()` outside jiti's resolver); under the driven/CLI
channels jiti's throw **names** the SDK exactly.

**(b) Mechanism — the guarded-lazy import serves the named-load-error
contract; async factory proven safe.** `extensions/mcp-load.ts`: memoized
`getMcp()`; `try { return await import("./mcp/index.ts") } catch (e) { try {
await import("@modelcontextprotocol/sdk/client") } catch { throw new
Error(NAMED_PROSE) } throw e }`. The four `./mcp/index.ts` sites
(`index.ts:13`, `child.ts:4`, `hub-tools.ts:9`, `dispatch.ts:16` —
grep-verified) become `import type` + runtime access through `getMcp()`; the
factory's **first statement is `await getMcp()`**, before the `seatName`
split, so children get the same prose. The secondary probe runs only after
the primary failed — a real `mcp/*` bug with the SDK present rethrows
honestly (C3 retained). Async tolerance evidence: `loader.js:409` and
`:425` are both `await factory(api)`; `resource-loader.js`
`loadExtensionFactories` routes through awaited `loadExtensionFromFactory`;
grep of all of `dist/` found no synchronous extension-factory caller. Direct
probe: a scratch extension whose default export awaits 10 ms registers its
command through the real loader (`{"errors":[],"commands":["async-ok"]}`).
`runChildMode` stays sync; the child's `startSeatMcp` call becomes `void
getMcp().then((m) => m.startSeatMcp(pi, repoRoot, seat))`;
`session_start`/`session_shutdown`/hub-tools/dispatch handlers are already
async and can `await getMcp()`.

**(c) Principal's two technical items settled by probe.** (1) Async
factory: **yes, empirically** — both loader call sites await, no sync caller
in `dist/`. (2) First-unresolved-entry: **by construction, not extraction**
— reproduced in the driven shape, `errors[0].error` is `Failed to load
Extension: Cannot find module '@modelcontextprotocol/sdk/client' ... -
<scratch>/extensions/mcp/client.ts`; the SDK and subpath are named. The
prose hardcodes `@modelcontextprotocol/sdk` + first entry
`@modelcontextprotocol/sdk/client` (client.ts:1 — the first value-import of
the first-loaded mcp file, deterministic across runtimes, immune to the
Bun-native `paths[0]` TypeError). The SDK-only-unresolvable classification
confirmed on both versions: pi 0.84.2's installed deps and the 0.85.1 lock
entry both carry `pi-ai`/`pi-tui`/`typebox`; neither carries the MCP SDK.

**(d) What remains open (narrow).** (1) Prose copy — designer's seat, fully
released; owner constraints it to name both `@modelcontextprotocol/sdk` and
the `/client` subpath, use a portable package-root phrase, counter `-ne`.
(2) Fixture variant — owner's "node_modules minus SDK" (274 MB hardlink
copy, verified working) vs principal's "committed tree minus node_modules,
driver in the repo" (cheaper, closer to the vendored-clone shape, theme
ENOENT avoided by shipping `themes/`+`council/`); both produced the
identical `errors[0]` in owner's probes; owner releases the choice to the
driven-test design with a recommendation for the principal's variant,
pending a gate-time check that dir→index discovery holds under lock-resolved
pi. (3) One last lock-sync-dependent verification (0.85.1's loader still
`await`s and still wraps) — C4, run at gate time per FLLWUP-24, not assumed
now.

- **Tradeoffs accepted:** healthy install — mcp module evaluation moves from
graph-top to factory-top (timing-only; env-split M1/M3 and M2 are the
tripwires); dep-less install — `mcp/*` internals with non-SDK bugs are
masked by the prose until deps restore (one-sided, accepted); the loader
still prints pi's wrong `-ne` hint AFTER the prose (main.js:721,
unsuppressible; the prose counters it; probe confirms the Error line
precedes the hint).
- **Testable claims:** T1 (red today, acceptance): driven dep-less test
asserts `errors.length === 1`, `errors[0].error` matches
`/Failed to load extension: pi-council could not load.*@modelcontextprotocol\/sdk.*(bun install|npm install).*package.json/` — RED on current
code, GREEN post-guard. T2 (healthy tripwire): `bun test
test/env-split-contract.test.ts` stays green on the synced worktree. T3
(discriminator honesty): corrupt `extensions/mcp/oauth.ts` top-level throw,
SDK present → `errors[0].error` is the real failure, no prose. T4 (async):
async-factory probe as a suite control. T5 (C4): suite green after
frozen-lockfile sync to 0.85.1, asserting the loader still wraps and awaits.

### Step 3 close — exchange stopped early (positions stabilized)

Exchange rounds used: 1 of ≤3. Owner, principal, and designer all converged
on the same design: guarded-lazy `getMcp()` (extensions/mcp-load.ts, the
four `./mcp/index.ts` sites type-only), factory-first-statement `await
getMcp()` before the `seatName` split, missing-SDK ⇒ `throw new
Error(NAMED_PROSE)` ⇒ extension:null + exit-1 + prose in
`discoverAndLoadExtensions.errors` and stderr before the `-ne` hint;
named-load-error surface beats partial-load-with-diagnostic-command (owner
conceded on the real-CLI channel probe; designer P4 stands); async factory
proven safe; first-unresolved-entry sourced by construction. Residual
decisions are all testable or copy-level: fixture variant (owner
recommends the cheaper committed-tree-minus-node_modules, principal's;
the fidelity question — whether the loader's stage-2 walk can still
resolve the SDK from the repo tree in the cheap shape — is a settling test
for step 4's Skeptic), prose copy (designer's), lock-sync-dependent C4 at
gate time. No open judgment dispute survives to step 6: the load-error vs
partial-load fork the principal flagged as "needs a ruling" was resolved by
convergence (owner conceded on evidence), not left open.
