---
id: EV-3
title: Activate the council theme on session start
state: Deliberating
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
- Designer's `vault/raw/2026-08-25-design-ev3.md` carries falsifiable CDP-smoke predictions; those P1–P8 are inputs a Skeptic can run, never gate assertions.
