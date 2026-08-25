---
id: EV-1
title: Port the oh-my-pi palette to a shipped pi theme
state: Ready
owner: null
epic: EPIC-1
goal: A pi-council theme pair for dark and light terminals ships in the package and resolves through pi's theme loader with colors matching oh-my-pi's dark.json and light.json
---

## Intent

User-visible surface: the whole pi TUI — this card produces the theme asset
that later cards activate; on its own it makes "pi-council" selectable in
/settings (as the `pi-council-dark` / `pi-council-light` pair).

oh-my-pi (github.com/can1357/oh-my-pi) ships `dark.json` / `light.json` in
packages/coding-agent/src/modes/theme/. Their palettes:

dark vars — cyan #0088fa, blue #178fb9, green #89d281, red #fc3a4b, yellow
#e4c00f, gray #777d88, dimGray #5f6673, darkGray #3d424a, accent #febc38,
selectedBg #31363f, userMsgBg #221d1a, toolPendingBg #1d2129, toolSuccessBg
#161a1f, toolErrorBg #291d1d, customMsgBg #2a2530.

light vars — teal #5a8080, blue #547da7, green #588458, red #aa5555, yellow
#9a7326, mediumGray #6c6c6c, dimGray #767676, lightGray #b0b0b0, selectedBg
#d0d0e0, userMsgBg #e8e8e8, toolPendingBg #e8e8f0, toolSuccessBg #e8f0e8,
toolErrorBg #f0e8e8, customMsgBg #ede7f6.

omp's files carry 67 tokens (a superset of pi's required set, with extras
like `link`, `pythonMode`, and the omp status-line tokens). Port maps onto
pi's theme schema (required tokens, optional `vars`, values as hex /
256-index / var-ref / ""), keeping the omp look: amber accent, blue borders,
warm dark message backgrounds, VS Code-flavored syntax colors.

Shipping mechanism (per pi's themes.md): a `themes/` directory or a
`pi.themes` entry in package.json — pi auto-discovers the package theme and
lists it in /settings. Ship both variants named `pi-council-dark` and
`pi-council-light`; pi's `lightTheme/darkTheme` selection (e.g. `light/dark`)
maps them onto terminal appearance.

## Acceptance

- `themes/pi-council-dark.json` and `themes/pi-council-light.json` (or
  equivalent) exist under the package and are discovered by pi's loader
  (`getThemeByName("pi-council-dark")` resolves in a test).
- Every required pi token is present; schema validation passes; optional
  tokens follow the documented fallbacks.
- Resolved colors match the omp source palette (spot-check table of token →
  hex from dark.json / light.json, including the amber accent and blue border
  family).
- Design spec (EV-5) is written first and this card follows it.
