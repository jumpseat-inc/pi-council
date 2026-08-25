---
id: EV-3
title: Activate the council theme on session start
state: Ready
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
