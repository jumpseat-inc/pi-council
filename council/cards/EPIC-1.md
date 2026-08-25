---
id: EPIC-1
title: omp-themed council theme for pi, configurable from the scaffold .council.json
state: Backlog
owner: null
epic: null
goal: Installing pi-council yields an oh-my-pi-palette theme that governs every council UI surface and can be recolored from the scaffold .council.json
---

## Intent

Why: pi-council currently renders with whatever pi theme the user happens to
have active. The maintainer wants a signature look: the oh-my-pi ("omp")
palette (dark.json / light.json from github.com/can1357/oh-my-pi — cyan
#0088fa, blue #178fb9, green #89d281, red #fc3a4b, yellow #e4c00f, amber
accent #febc38, warm dark backgrounds) as the default when pi-council is
installed, covering everything the user sees: the main pi TUI (messages,
tool boxes, markdown, status line, thinking borders) and the /council-tree
modal and transcript viewer, which draw from the same pi Theme object.

The customization surface is the repo's committed `.council.json` (the same
file that already carries per-seat model overrides): the scaffold version
ships a theme section the consumer can edit — palette vars, per-token
overrides, dark and light variants. Editing it recolors the whole council
experience on the next session. The theme's default name is `pi-council`
(and nothing else): the `.council.json` `theme.name` is `pi-council`, and
activation materializes the `pi-council-dark` / `pi-council-light` pair for
pi's light/dark selection.

Deliverables across children: (1) the shipped omp theme asset, (2) the
`.council.json` theme config parsed and validated like the seat overrides,
(3) activation so the configured theme becomes pi's active theme, (4) every
council-drawn surface compliant with and live-updating from the active
theme, (5) the design spec, AGENTS.md convention, and README so the wiki
ingest captures the system.

## Acceptance

- A fresh `/council-init` scaffold's `.council.json` carries the theme section.
- With that scaffold, a pi session shows the omp palette in the main TUI and in
  the /council-tree modal (verified by render snapshots against known ANSI).
- Editing a palette var in `.council.json` changes the rendered colors on the
  next session; a repo without a theme section is untouched.
- All five child cards land with tests; `bun test` and `python3 council/validate.py` stay green.
