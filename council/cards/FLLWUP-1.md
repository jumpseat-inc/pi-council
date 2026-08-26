---
id: FLLWUP-1
title: Fix HTML export under an active in-memory council theme
state: Backlog
owner: null
epic: null
goal: /export no longer crashes or renders the wrong palette when a council theme is activated in memory
---

## Intent

Surfaced during EV-4: pi's HTML export resolves theme colors by *name*
(`getResolvedThemeColors(name)`), and the council theme is activated
in-memory via `ui.setTheme(instance)` — it registers no name. So under an
active council theme, `/export` either crashes (`loadThemeJson("<in-memory>")`
throws) with no `settings.theme`, or renders pi's un-merged built-in palette
when the settings leaf is `"light"`/`"dark"`. This was documented as a pi
limitation with no extension seam, and EV-4 pinned it with
`test/theme-export-pinning.test.ts` (asserts the no-arg export lookup throws
`Theme not found: <in-memory>`).

Two viable resolutions to deliberate in this card:
- a pi-side fix: make `getResolvedThemeColors` fall back sanely under
  `<in-memory>` or resolve the settings leaf through the user's theme path;
- or an extension-side clamp: have the council expose the resolved palette
  so export can carry it without a registered name.

The card's goal is simply the observable outcome: `/export` works (no crash,
correct palette) under an in-memory council theme. `pi-council` name
family: `pi-council`, variants `pi-council-dark` / `pi-council-light`.

## Acceptance

- `/export` produces correct HTML output (no crash, palette matches the
  configured `.council.json` theme) when the council theme is activated
  in-memory.
- The EV-4 export-pinning test is updated from "throws" to the passing
  green state this card's fix produces, or replaced by a test asserting the
  correct rendered colors.
- All owner gates green (`bunx tsc --noEmit`, `bun test`, `python3 council/validate.py`).