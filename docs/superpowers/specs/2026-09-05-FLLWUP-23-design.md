# FLLWUP-23 — Named failure for pi-council installs missing node_modules

Card: FLLWUP-23 · Epic: EPIC-6 · Date: 2026-09-05 · State at spec: Deliberating (steps 2–6 closed; consolidator: READY TO HAND OFF, no open judgment, one gate-time verification carried).

## 1. What the deliberation settled (context, not an open design space)

- **The failure, precisely.** Installing the pi-council package by path or copy without its `node_modules` dies at extension load: jiti cannot resolve `@modelcontextprotocol/sdk/client` (the first value-import of the first-loaded mcp file, `extensions/mcp/client.ts:1`). The extension factory never runs; pi's loader emits `Failed to load extension "<path>": Failed to load extension: Cannot find module '@modelcontextprotocol/sdk/client'` + a require stack + `Hint: Start without extensions using "pi -ne"` and exits 1 (Skeptic obj 3 CLOSED-GREEN: main.js:706-710 order is diagnostics → `-ne` hint → exit 1). The `-ne` hint is actively wrong advice here ("start without extensions" deletes the council rather than repairing deps). The card's "silent zero-command state" conflation with FLLWUP-21's child-mode silence was corrected in deliberation: this failure is loud-but-cryptic; the deliverable names it.
- **The SDK is the only unresolvable specifier in the field shape.** `package.json` declares `@modelcontextprotocol/sdk` under runtime `dependencies`; pi's own package.json (both 0.84.2 installed and 0.85.1 in the lock) carries `pi-ai`/`pi-tui`/`typebox` and no MCP SDK (Skeptic obj 8 CLOSED-GREEN). So in a vendored clone with pi installed elsewhere, every other bare specifier resolves via jiti's stage-2 loader-location walk; the SDK does not.
- **Detection must be the import attempt itself.** jiti resolves a bare specifier in two stages: (1) `node_modules` walk up from the importing file, (2) `nativeRequire.resolve` bound to the loader's *own* location. An `import.meta.resolve` presence probe or PKG_ROOT fs-walk reproduces only stage 1 and diverges from the real resolver in both directions — it can false-fire on a healthy-by-resolution install (Skeptic obj 1 CLOSED-RED: under drift, a dep-less scratch *loads 14 commands* because the loader's stage-2 walk reaches an SDK in the repo tree). Detection is the actual import attempt, in the same module graph the factory would use.
- **The named-load-error contract beats partial-load-with-diagnostic-command.** The loader-error payload is the channel a person reads first (exit-1 stderr); a `/mcp` command description and a console.error are weaker/discoverable-only channels (owner conceded on its own real-CLI probe; designer P4). The failure contract: on missing SDK the extension loads as `extension: null` with the named prose as the inner `${message}` under pi's fixed wrappers — reachable both programmatically (`discoverAndLoadExtensions` `errors[]`) and on stderr, *before* the `-ne` hint. No partial load; zero sentinel branches.
- **Async factories are safe.** The loader `await`s the factory at both call sites (loader.js:409, :425 — Skeptic obj 7 CLOSED-GREEN; owner's async canary registered a command through the real loader). Making the factory's first statement `await getMcp()` is tolerated by the load path and by the env-split suite.
- **Discriminator honesty.** When the SDK is present and `mcp/*` has a real bug, the lazy import fails for the real reason and the secondary probe-import succeeds — the guard must rethrow the original error, never emit prose (Skeptic obj 4 CLOSED-GREEN).
- **Healthy install is byte-identical in behavior.** The four direct
  `./mcp/index.ts` static import sites (plus eval-runner.ts's static edge to
dispatch.ts, disarmed by dispatch.ts going type-only) become type-only; on
success the memoized dynamic import returns the identical module object at
the sites that use it. The only evaluable difference is mcp module
evaluation timing (graph-top → factory-top). Watchdog: the env-split suite
(test/env-split-contract.test.ts, 4/4 green — Skeptic obj 5) plus a healthy
control in the new suite.
- **Five type-only caller sites, not four.** `index.ts:13`, `child.ts:4`, `hub-tools.ts:9`, `dispatch.ts:16` directly; plus the indirect edge `eval-runner.ts → dispatch.ts` (dispatch.ts is statically imported by eval-runner.ts, so dispatch.ts must be type-only on `./mcp/index.ts`) (Skeptic obj 6 CLOSED-GREEN).
- **Themes-mask trap.** The dependency-less fixture must ship `themes/` (and `council/`): `seats.ts:63-64` reads the shipped theme at module-eval before the SDK edge is reached; an `extensions/`-only copy ENOENTs on `themes/pi-council-dark.json` instead (Skeptic obj 2 CLOSED-RED, drift-independent fixture fact).
- **First-unresolved-entry is sourced by construction, not extraction.** The Bun-native throw can be a generic TypeError that names nothing; the prose hardcodes `@modelcontextprotocol/sdk` and `@modelcontextprotocol/sdk/client` (from `client.ts:1`, deterministic) rather than parsing error text.
- **Fixture fidelity is a gate-time property, not a design choice.** Whether a cheap fixture (committed tree minus node_modules, driver in the repo) reproduces the field failure depends on which tree the loader's stage-2 walk can see — i.e. on the lock-synced gate environment (FLLWUP-24 binding). The deterministically faithful shape is the self-contained SDK-free scratch (verified by owner probes and Skeptic obj 3): its own node_modules copy minus `@modelcontextprotocol`, driver inside the scratch, `extensions/`+`themes/`+`council/` copied. Section 4 makes the choice a decision procedure, not a pre-picked answer.

## 2. Mechanism (settled)

New module `extensions/mcp-load.ts` (node-builtins only — no extension imports that could pull the mcp graph):

```
const cached: McpModule | null = null;
export async function getMcp() {
  if (cached) return cached;
  try {
    return cached = await import("./mcp/index.ts");
  } catch (e) {
    try { await import("@modelcontextprotocol/sdk/client"); }
    catch { throw new Error(NAMED_PROSE); }   // SDK genuinely unresolvable
    throw e;                                  // real mcp/* bug with SDK present — honest surface
  }
}
```

1. The five `./mcp/index.ts` caller sites become `import type` + runtime access through `getMcp()`: `extensions/index.ts`, `extensions/child.ts`, `extensions/hub-tools.ts`, `extensions/dispatch.ts`; and `eval-runner.ts`'s static import of `dispatch.ts` is unaffected only because dispatch.ts itself goes type-only on the mcp edge. (`client.ts`/`oauth.ts` SDK imports stay static *inside* `mcp/` — the graph is only pulled in via `getMcp()`.)
2. The extension factory's **first statement** is `await getMcp()` — before the `COUNCIL_SEAT` split (`index.ts:117-121`) — so seat children surface the same prose. The factory becomes async; the loader awaits it (verified).
3. `runChildMode` stays synchronous; its `startSeatMcp` call becomes `void getMcp().then((m) => m.startSeatMcp(...))` (the factory's top await guarantees the missing branch never reaches it). `session_start`/`session_shutdown` and the hub-tools/dispatch handler bodies `await getMcp()` where they used `getMcpManager`.
4. `hub.ts` is untouched (AGENTS.md 7). No other engine behavior changes.
5. Healthy install: the memoized import succeeds on first await; every callsite behaves as today. Zero additional output on the healthy path.

## 3. The named prose (binding constraints; copy owned by the designer, implemented by the owner)

The thrown `NAMED_PROSE` is a constructed `Error` (message only; no stack-trace dependence) that MUST (each item is asserted by the driven test where noted):

- prefix attributing the failure to the package (e.g. "pi-council could not load:" — not a generic "extension failed");
- name the missing package verbatim: `@modelcontextprotocol/sdk`;
- name the first unresolved entry: `@modelcontextprotocol/sdk/client`;
- give the remedy: `bun install` (or `npm install`) at the package root, stated portably ("the directory containing package.json"), not as an absolute path;
- instruct a restart of pi afterward;
- counter pi's `-ne` hint explicitly: it disables extensions entirely; this is an installation dependency error, not an extension configuration error (do NOT tell the user to run `/mcp login` or change MCP config).

The designer's semantic copy from step 2 is the expected shape; the owner implements prose satisfying the constraints verbatim-checkable by the test.

## 4. Deliverables

1. `extensions/mcp-load.ts` per §2, plus the five type-only site conversions and the factory-top `await getMcp()`.
2. Driven test `test/fllwup23-dep-less.test.ts` + fixture driver (env-split-driver pattern; explicit-env construction — PATH + scratch HOME only, all `COUNCIL_*`/provider vars dropped) that:
   - builds the dependency-less install shape in a scratch under TMPDIR: `extensions/` + `themes/` + `council/` copied, plus a node_modules tree for the scratch that **excludes `@modelcontextprotocol`** — the decision procedure below picks between (A) self-contained SDK-free node_modules (hardlink copy `cp -al` of the lock-installed tree minus `@modelcontextprotocol`, driver file copied into the scratch and spawned from there so the loader's stage-1 and stage-2 walks both end inside the scratch), and (B) committed-tree-minus-node_modules with the driver in the repo — whichever, at gate time under the lock-synced 0.85.1 tree, reproduces the field failure (non-empty `errors[]` naming `@modelcontextprotocol/sdk`; commands 0).
   - asserts the diagnostic: `errors.length === 1` and `errors[0].error` matches the named-prose contract (names `@modelcontextprotocol/sdk`, `/client`, `bun install` OR `npm install`, package-root phrase, restart, `-ne` counter) — RED on current code (raw `Cannot find module`, no remedy), GREEN post-guard;
   - healthy control in the same fixture: the identical scratch WITH `@modelcontextprotocol` restored loads 14 commands with zero errors and no prose anywhere — the byte-identical pole;
   - discriminator-honesty control: scratch with the SDK present but `mcp/oauth.ts` corrupted (top-level throw) → `errors[0]` is the real failure, no prose;
   - async-factory control (loader awaits the factory — e.g. the canary fixture from the owner's probe as a suite control).
3. The env-split contract suite stays green (unmodified) — the healthy-install tripwire.
4. Gate-time verification under lock-sync (FLLWUP-24 binding; the O1 carry from step 5): the fixture decision procedure of (2) is executed in the synced worktree (0.85.1) — frozen-lockfile first — and T5/C4 sign-off recorded: the loader still `await`s and wraps at 0.85.1, dir→index discovery holds, and the chosen fixture reproduces the field failure (or the self-contained fallback is used).

## 5. Binding exclusions

- No packaged seat (`council/agents/*.md`) or procedure (`council/procedures/*.md`) content changes.
- No `smoke/` changes.
- FLLWUP-22's theme-token work untouched (no `extensions/theme-activation.ts`, `seats.ts` token constants, theme files, or lock-version changes).
- `hub.ts` untouched (AGENTS.md 7).
- No change to the env-keyed parent/child mode split behavior (FLLWUP-21 contract).
- package.json dependency declarations unchanged (no new deps; `@modelcontextprotocol/sdk` stays a runtime dependency).
- No `git checkout`/`reset`/branch mutation of the main repo path; all work in an isolated worktree under `.worktrees/`, branch based at `origin/main`.

## 6. Gates (all four, in full, regardless of change size)

From `.github/workflows/gates.yml`, run in the head worktree after `bun install --frozen-lockfile` (FLLWUP-24: node_modules must be synced from the lock before any gate output is trusted):

1. `bun install --frozen-lockfile` exits 0 with no lock drift;
2. `bunx tsc --noEmit` clean;
3. `bun test` full suite green (including the new `test/fllwup23-dep-less.test.ts` and the env-split suite);
4. `python3 council/validate.py` clean.

## 7. Worktree / PR conventions

Worktree `.worktrees/fllwup-23-named-failure`, branch `feat/fllwup-23-named-failure` based at `origin/main`, plan doc at `docs/superpowers/plans/2026-09-05-FLLWUP-23-plan.md` committed with the change, PR opened against `main` when ready. Record the fixture decision (which shape, with gate-time evidence) on the plan doc.