---
id: EV-3
title: Activate the council theme on session start
state: In Progress
owner: null
epic: EPIC-1
goal: At session start the council extension materializes the .council.json theme into a pi theme and activates it so the TUI renders in the configured palette and a repo without a theme section leaves pi's theme untouched
---

## Intent

User-visible surface: the entire pi TUI — messages, tool boxes, markdown,
status line, thinking borders — plus, transitively, the /council-tree modal,
which draws from the same Theme object.

This is the "governs everything we show" card. Mechanics available today:
pi exports `getThemeByName`, `loadThemeFromPath`, `initTheme`, `setTheme`,
`setThemeInstance`; a package theme auto-discovered by pi (EV-1) is already
selectable in /settings. This card wires the `.council.json` theme section
(EV-2) into activation:

- Materialize the configured palette into pi theme JSON under the repo's
  config dir (CONFIG_DIR_NAME — no hardcoded `.pi`, AGENTS.md 3) so pi's
  watcher/hot-reload can see it, or register it directly; Council decides.
  The theme family name is `pi-council` and nothing else — the dark/light
  variants materialize as `pi-council-dark` / `pi-council-light`.
- Activate at session start when a theme section exists; absent section →
  leave pi's theme exactly as the user configured it.
- Precedence (decided): auto via scaffold — the scaffold ships the theme
  section by default, so installing pi-council yields the omp look; a
  consumer who prefers their own theme deletes the section (or sets an
  explicit off switch). An explicit `settings.json` theme choice wins over
  the repo's `.council.json` theme.

## Acceptance

- With a theme section present, after session start `getThemeByName` (or
  equivalent) resolves the materialized `pi-council-dark` / `pi-council-light`
  themes and their resolved colors match the config values; unit-testable
  without a real TUI.
- The materialized file (if materialized) has correct JSON and lives under
  CONFIG_DIR_NAME-derived paths, never a hardcoded `.pi`.
- Without a theme section, activation is a no-op — pi's theme is unchanged.
- Editing `.council.json` mid-session (or restarting) applies the new
  palette; hot-reload behavior per pi's theme watcher.

## Phase 1 Ruling (recorded, binding)

Recorded 2026 by the human before the run: pi's `"theme": "light/dark"` setting (auto-follow terminal appearance) is **not** an explicit theme choice and does **not** block council activation. The council theme still activates and follows terminal appearance with its own dark/light pair. Only a concrete theme name (e.g. `"theme": "gruvbox"`) in settings.json blocks council activation.

## Deliberation record

### Round 1 — independent first pass (owner / principal / designer)

All three generators converged on the mechanism: new module (owner `extensions/theme.ts`, principal `extensions/theme-activation.ts`, designer `extensions/activate-theme.ts`) holding a **pure decision function** + integration glue; merge via `loadShippedTheme` + `mergeThemeSection` (EV-2) over `PKG_ROOT/themes`; resolve var-refs to concrete colors **before** `new Theme(...)` (pi's constructor takes resolved fg/bg and throws on a non-hex var-ref); split the 8 bg token keys out of `colors` for the fg/bg constructor split; read both settings.json files off disk (project wins at the leaf); `ui.setTheme(instance)` signature-ed to `setThemeInstance` (zero settingsManager calls — no mutation); activation at `session_start`, placed before `initHubIdentity`/widget; try/catch so malformed `.council.json` notifies and returns, never throws out of `session_start`; no `.council.json` watcher in EV-3 — mid-session recolor is EV-4.

**Owner (extensions/theme.ts):** reimplements pi's `resolveThemeColors` (var-ref lookup), a `COLORFGBG` env luminance heuristic (`terminalThemeFromEnv`, mirrors pi's not-public `detectTerminalBackgroundFromEnv`), and the fg/bg split — three small duplicates sealed by a ground-truth ANSI identity test against pi's real theme module (deep-import via `test/theme-loader.ts`). `decideThemeActivation(config, rawSetting, terminal)` → `{action:activate,variant}|{action:noop}`. Rapid-gate: `config===undefined` → noop and reads no settings. Block iff `raw` is a string not in {undefined,"light/dark","dark","light", any A/B pair}. Auto variant: config pin, else env heuristic, else settings literal dark/light, else `"dark"`. In-memory construction — no tempfile.

**Principal (extensions/theme-activation.ts):** the open decision is the **resolution seam** (EV-2 leaves var-refs unresolved by contract; pi exports only the raw `Theme` constructor). Decision stays a **whitelist**, not `parseAutoThemeSetting`: activate only for `undefined`, `"light/dark"`, `"dark"`, `"light"`; **block a custom pair like `"nord-light/nord-dark"`** (concrete named arrangement, table row d) — routed through `parseAutoThemeSetting` would invert the settled table for any `A/B`. Terminal theme for the auto variant comes from **pi's already-resolved result — read `ui.theme` (name + `getColorMode()`) BEFORE the first setTheme** — not by re-detecting COLORFGBG (duplicates pi logic, can disagree with the theme already on screen). Reads the raw settings.json leaf with per-key project-wins semantics. `ui.theme.setTheme(instance)` verified zero settingsManager calls (interactive-mode.js:1946). Callout: the card's acceptance "`getThemeByName` resolves the materialized theme" is unsatisfiable under in-memory (registers no name; `getThemeByName(pi-council-dark)` still returns the shipped un-merged palette) — needs a card-text correction like EV-2's one-word fix. Callout: in-memory activation is TUI-only; `getResolvedThemeColors(instance)` resolves by name and `<in-memory>` matches nothing → HTML export won't carry the council palette (write it down for EV-4).

**Designer (extensions/activate-theme.ts):** pure `decideActivation({themeSection, projectSettingsRaw, globalSettingsRaw, terminalTheme})` → tagged union `{noop}|{block, themeName}|{activate, variant}`; caller does the disk read and passes raw values (pure, disk-testable). Auto-variant recommendation: synchronous `detectTerminalBackgroundFromEnv()` (COLORFGBG), rejecting async OSC-11 (TUI-frame). Full predictions P1–P8 in `vault/raw/2026-08-25-design-ev3.md`. Notable: **tempfile construction** to `os.tmpdir()` + `loadThemeFromPath` chosen (uses public pi API, no duplicated resolver), with an explicit "if owner/principal read spec §4 'writes nothing to disk' as forbidding even a `try/finally` tempfile, route the strict-reading question to product-owner". **Notify** on activate (`council theme: pi-council-{variant}`, info) and block (`council theme: blocked (settings.json has '{name}')`, warning), silent no-op. The designer's rule: ✓ "app-visible surfaces" scope — entire TUI.

### Open judgments / disputes carried to round 2 & step 6

1. **Block predicate for a custom pair** — owner: any `A/B` pair activates (auto-follow signature); principal/designer: only the exact `"light/dark"` pair activates, a custom pair like `"nord-light/nord-dark"` blocks (row d).
2. **Auto-variant source** — principal: read `ui.theme` once before first setTheme; owner/designer: re-implement env `COLORFGBG` heuristic (plus settings-literal then dark fallback). Spec §4's "Never read ui.theme.name" wording is in dispute (is the pre-activation terminal read covered?).
3. **One-time notify on activate/block** (designer) vs silent — product/UX judgment; no seat opposed but not settled.
4. **Tempfile construction path** — designer recommended tempfile+loadThemeFromPath; owner/primary re-derive the resolver and never write disk. If any seat insists the strict in-memory reading forbids even the tempfile, route.
5. **Card-text correction** — acceptance line "getThemeByName resolves materialized theme" is not satisfiable under in-memory; correct the card text to the settled assertion.

### Notes in the card record
- Designer's `vault/raw/2026-08-25-design-ev3.md` (R1, P1–P8) and `vault/raw/2026-08-25-design-ev3-round2.md` (R2, P22–P36) carry falsifiable CDP-smoke predictions; those are inputs a Skeptic can run, never gate assertions.

### Round 2 — bounded exchange (owner / principal / designer)

All five disputes settled; positions stabilised (used 2 of ≤3 rounds, no round 3).
1. Block predicate (D1) — settled, strict whitelist. Activate iff raw settings `theme` value ∈ {undefined, "light/dark", "dark", "light"}; everything else incl. a custom `A/B` pair like "nord-light/nord-dark" blocks (row d). Must NOT route through `parseAutoThemeSetting` (inverts any A/B into an auto pair). If a string with "/" appears it is a concrete named arrangement → block.
2. Auto-variant (D2) — settled: env heuristic; the `ui.theme` pre-read is retracted (Theme.getColorMode() returns color depth, not the dark/light variant). Chain: config variant pin → env COLORFGBG luminance (sync terminalThemeFromEnv) → "dark"; the state-(c) settings literal activates directly via the whitelist, not as a fallback step. Documented non-gating caveat: env heuristic mirrors pi's sync fallback only.
3. Notify (D3) — settled, in-scope, non-gating: info on activate (council theme: pi-council-{variant}), warning on block (council theme: blocked (settings.json has '{raw}')), silent on no-section. Thin removable layer.
4. Construction (D4) — settled: in-memory, no tempfile (spec §4's "writes nothing to disk" is strict; loadThemeFromPath is not publicly reachable). Reimplement withThemeColorFallbacks + resolveThemeColors + 8 bg-key split, then new Theme(fg,bg,mode), ui.setTheme(instance). Ground-truth ANSI smoke in test/theme-loader.ts deep import, both truecolor and 256color, mode from getCapabilities().trueColor.
5. Card-text (D5) — settled: acceptance line "getThemeByName resolves materialized theme" is a false contract and is DELETED. Corrected acceptance: (i) activated instance's resolved colors match merge→resolve of (loadShippedTheme(variant), section[variant]); (ii) namespace: getThemeByName("pi-council-dark") after activation still returns EV-1's shipped un-merged palette. Name-based surfaces (getResolvedThemeColors(name), HTML export, /settings) are an explicit non-goal, deferred to EV-4.

### Round 3 — Skeptic attacks and runs tests (step 4)

Skeptic dispatched with every Round 1 + Round 2 position and the binding rulings. Settled in 5.7m, 26 turns, all gates (bun install --frozen-lockfile, bunx tsc --noEmit, bun test: 182 pass 2 skip 0 fail, python3 council/validate.py) verified as capable of failing via injected defects. Verdict: **no blocks** — card ready for owner implementation.

| # | Objection | Settling test & result | Status |
|---|-----------|------------------------|--------|
| 1 | Strict-whitelist block predicate works for all table rows | Pure mathematical probe `decideThemeActivation` — 11 cases (all table rows, custom pairs, edges) | **closed-green** |
| 2 | `parseAutoThemeSetting` inverts ANY A/B pair (not just "light/dark") | Verified real pi code: `parseAutoThemeSetting("nord-light/nord-dark")` → `{lightTheme:"nord-light",darkTheme:"nord-dark"}`; same for custom-a/custom-b. Prohibition on routing through it correct. | **closed-green** |
| 3 | **`detectTerminalBackgroundFromEnv` IS exported from pi's theme.js** — design's "not-public" claim is FALSE | Deep-import verified it resolves; COLORFGBG=15;0→dark, 0;15→light, no env→dark. Owner should call it directly instead of duplicating the ~500-byte function. | **closed-red (factual correction, non-blocking)** |
| 4 | `resolveThemeColors` / `withThemeColorFallbacks` NOT exported — owner must reimplement | Both `undefined` on deep-imported theme module; internal to `getResolvedThemeColors(name)` | **closed-green** |
| 5 | In-memory `new Theme(fg,bg,mode)` construction feasible | Constructed real Theme from merged JSON (45 fg + 8 bg keys): `fg("accent")`→`\x1b[38;2;254;188;56m` (omp orange), `bg("selectedBg")`→`\x1b[48;2;49;54;63m`, fallback chain thinkingMax→thinkingXhigh, scrollbarThumb→selectedBg, searchMatchBg→selectedBg, searchMatchText→text all verified | **closed-green** |
| 6 | **`getCapabilities()` NOT available from public API or theme module** — only from `@earendil-works/pi-tui` (transitive dep) | Verified undefined from both public API and theme.js; `createTheme` in theme module imports it from pi-tui. Owner: import from `@earendil-works/pi-tui`, or use `chalk.level >= 2` substitute. | **closed-red (factual correction, non-blocking)** |
| 7 | `ExtensionUIContext.setTheme` accepts Theme instances — no deep-import needed | Type defs: `setTheme(theme: string \| Theme): { success: boolean; error?: string }`; call `ctx.ui.setTheme(instance)` | **closed-green** |
| 8 | `loadThemeFromPath` deep-importable but unusable (no-tempfile stands) | Reachable via deep-import, but needs tempfile which violates spec §4; in-memory construction (objection 5) verified feasible | **closed-green** |
| 9 | Notify info/warning/silent tri-state | No implementation exists yet; cannot test | **open-untested (non-gating by settled design)** |
| 10 | Card-text correction — "getThemeByName resolves materialized theme" DELETED | In-memory Theme with name sets `this.name` but registers nothing; `getThemeByName("pi-council-dark")` after activation still returns EV-1's shipped un-merged palette — deletion correct | **closed-green** |
| 11 | `resolveThemeSetting` inverts custom A/B — confirms blocking must check RAW not resolved | `resolveThemeSetting("nord-light/nord-dark","dark")` → `"nord-dark"`; if predicate checked resolved value, custom pairs would activate | **closed-green** |
| 12 | Gate integrity — gates capable of failing | Injected defects: bun test exit 1 ✓, tsc exit 2 ✓, validate.py non-zero ✓, bun install --frozen-lockfile exit 0 ✗ (weak gate — noted, not a blocker for this card) | **closed-green** |

**Tests actually run (real output):** `bun test test/theme.test.ts` (10 pass), `bun test test/theme-config.test.ts` (32 pass), `bunx tsc --noEmit` (exit 0), `python3 council/validate.py` (clean), `bun test` (182 pass / 2 skip), `bun install --frozen-lockfile` (exit 0), plus `/tmp/skeptic-ev3-tests.ts`, `/tmp/check-mode-detection.ts`, `/tmp/check-reachability.ts`, `/tmp/gate-integrity.ts`.

**Two actionable factual corrections for the owner (closed-red, non-blocking):**
- **Obj 3:** call pi's exported `detectTerminalBackgroundFromEnv` directly (deep-import) rather than duplicating it; do not claim it is not-public.
- **Obj 6:** get mode via `getCapabilities` imported from `@earendil-works/pi-tui` (or `chalk.level >= 2`), not from the pi-coding-agent public API / theme module where it is undefined.

### Synthesis — consolidator (step 5, job-14.1)

Recorded verbatim from the consolidator dispatch:

- **Agreed design** — every seat converged in Round 1 and held through Round 2:
  - New module holds a pure decision function (`decideThemeActivation(config, rawSetting, terminal) → {activate, variant} | {noop} | {block, themeName}`) plus integration glue; caller does the disk read and passes raw values.
  - Merge via `loadShippedTheme` + `mergeThemeSection` (EV-2) over `PKG_ROOT/themes`; resolve var-refs to concrete hex **before** `new Theme(...)` (pi's constructor throws on a non-hex var-ref); split the 8 bg token keys out of `colors` for the `fg`/`bg` constructor split.
  - Read both `settings.json` files **off disk** (project wins at the leaf), detecting the **raw** value — never `ui.theme.name` (it is `"<in-memory>"` after any setTheme).
  - Activate via `new Theme(fg, bg, mode)` + `ui.setTheme(instance)` — the instance branch is the zero-`settingsManager` path (interactive-mode.js:1945-1955); the string branch is forbidden. No `.council.json` watcher in EV-3 (mid-session recolor → EV-4).
  - Activation at `session_start`, placed before `initHubIdentity`/widget; `try/catch` so malformed `.council.json` notifies and returns, never throws out of `session_start`.
  - Family name `pi-council`; variants `pi-council-dark` / `pi-council-light`; paths via `CONFIG_DIR_NAME`/`PKG_ROOT`, never hardcoded `.pi`.
  - Binding Phase 1 ruling: `settings.json` `"theme": "light/dark"` (auto-follow) and a persisted literal `"dark"`/`"light"` (pi's recorded auto-detect) do **not** block council activation; only a concrete non-built-in name (e.g. `gruvbox`) blocks. This is the four-state table (spec §4, rows a–d).
- **Settled disputes** — all five, with the tests that closed them:
  - **D1 Block predicate = strict whitelist.** Activate iff raw value ∈ {undefined, `"light/dark"`, `"dark"`, `"light"`}; any string with `/` (a concrete `A/B` pair like `"nord-light/nord-dark"`) blocks (row d); never route through `parseAutoThemeSetting`. Settling tests: Skeptic #1 (11-case pure probe, all table rows) **closed-green**; #2 (`parseAutoThemeSetting("nord-light/nord-dark")` → inverted pair, prohibition confirmed) **closed-green**; #11 (`resolveThemeSetting` inverts custom `A/B`, so the predicate must check RAW not resolved) **closed-green**.
  - **D2 Auto-variant = env heuristic via pi's exported `detectTerminalBackgroundFromEnv`.** The `ui.theme` pre-read was **retracted** in Round 2 — `Theme.getColorMode()` returns color depth, not the dark/light variant. Chain: config variant pin → env `COLORFGBG` luminance (sync) → `"dark"`; the state-(c) settings literal activates directly via the whitelist, not as a fallback step. Settling test: Skeptic #3 — **closed-red (factual correction, non-blocking)**: `detectTerminalBackgroundFromEnv` **is** exported from pi's theme.js; the owner must call it directly (deep-import) rather than duplicating the ~500-byte function. Documented non-gating caveat: the env heuristic mirrors pi's sync fallback only.
  - **D3 Notify = info/warning/silent tri-state.** info on activate (`council theme: pi-council-{variant}`), warning on block (`council theme: blocked (settings.json has '{raw}')`), silent on no-section; thin removable layer. Settling test: Skeptic #9 — **open-untested (non-gating by settled design)** — no implementation exists yet; see open objections.
  - **D4 Construction = in-memory, no tempfile.** Spec §4's "writes nothing to disk" is strict; `loadThemeFromPath` is not publicly reachable. Reimplement `withThemeColorFallbacks` + `resolveThemeColors` + the bg-key split, then `new Theme(fg, bg, mode)`, `ui.setTheme(instance)`. Settling tests: Skeptic #5 (real Theme from merged JSON, 45 fg + 8 bg keys, omp accent `#febc38` ANSI verified, fallback chain thinkingMax→thinkingXhigh etc. verified) **closed-green**; #8 (`loadThemeFromPath` deep-importable but needs a tempfile → violates §4) **closed-green**. The second closed-red correction attaches here: Skeptic #6 — `getCapabilities()` is **not** on the public API or theme module; import it from `@earendil-works/pi-tui` (or use `chalk.level >= 2` as a substitute) for the `mode` arg.
  - **D5 Card-text correction = DELETE the unsatisfiable acceptance line.** The line "`getThemeByName` resolves the materialized theme" is a false contract under in-memory (the instance sets `this.name` but registers nothing; `getThemeByName("pi-council-dark")` after activation still returns EV-1's shipped un-merged palette). Corrected acceptance: (i) the activated instance's resolved colors match merge→resolve of `(loadShippedTheme(variant), section[variant])`; (ii) namespace: `getThemeByName("pi-council-dark")` after activation still returns EV-1's shipped un-merged palette. Name-based surfaces (`getResolvedThemeColors(name)`, HTML export, `/settings`) are an explicit non-goal, deferred to EV-4. Settling test: Skeptic #10 — **closed-green**.
- **Open judgment — for `product-owner`, escalating to `steward`** — none. The designer's Round-1 step-6 flag (does spec §4 "writes nothing to disk" forbid even a `try/finally` temp construction) was **resolved in Round 2 D4** in favor of owner/principal's in-memory `new Theme(...)` reading, and that resolution was then **confirmed by two Skeptic tests** (#5 feasible, #8 no-tempfile stands). It is not open judgment; it is settled. No values/tradeoff question survived the deliberation.
- **Open objections** — Skeptic objections whose settling test has not passed:
  - **#9 — notify info/warning/silent tri-state.** Settling test: implement the notify layer and run it. Status: **not run** (no implementation exists yet). Explicitly **non-gating by settled design** — D3 is a thin removable layer; its absence does not change the activation decision or the construction path. This rides with the implementation, not against hand-off.
- **Ready to hand off?** — **yes, to owner** for implementation. All five disputes are settled; the Skeptic returned **no blocks**. Two closed-red **non-blocking factual corrections** must be applied during implementation (not judgment calls — verified deltas to the plan): (1) call pi's **exported** `detectTerminalBackgroundFromEnv` directly rather than duplicating it (D2/#3); (2) import `getCapabilities` from `@earendil-works/pi-tui` (or `chalk.level >= 2`) for the `mode` arg, since it is undefined on the public API and theme module (D4/#6). The single open objection (#9 notify tri-state) is non-gating by settled design and is exercised once the notify layer is written. No open judgment remains for `product-owner`/`steward`.
