---
id: EV-1
title: Port the oh-my-pi palette to a shipped pi theme
state: Deliberating
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

## Deliberation Record

### Round 1 — independent first pass (owner, principal, designer)

**owner** (engineering): Ship two hand-written JSON assets at `themes/pi-council-dark.json` / `themes/pi-council-light.json`, declared via `pi.themes` in package.json's pi manifest. (a) Var-refs preserved unconditionally — omp ships var-refs, pi's own built-ins ship var-refs, and EV-5 §3 (binding) requires the merge to compose over them; add the 4 optional tokens explicitly as var-refs (`scrollbarThumb: "selectedBg"`, `searchMatchBg: "selectedBg"`, `searchMatchText: "text"`, `thinkingMax: "thinkingXhigh"`); keep omp's four `""` defaults; point `$schema` at pi's theme-schema URL, not omp's. (b) `pi.themes` manifest entry — the `themes/` convention dir is invisible under a pi manifest (verified: `collectPackageResources` returns before the convention-dir loop when a pi manifest exists); `resources_discover → themePaths` could not be fully verified and is unnecessary. (c) Hand-written, not generated — transcription risk eliminated by a full resolved-palette test; one fewer moving part. (d) No hot-reload machinery — pi's watcher only watches `getCustomThemesDir()`; package themes are never file-watched; document edit→restart consequence in README. (e) Deep-import pi's real `theme.js` in the bun suite: `loadThemeFromPath` (throws on schema violation = schema-validation acceptance) → `setRegisteredThemes([dark, light])` (exactly what interactive-mode.js:403 does) → `getThemeByName("pi-council-dark")`; plus a second offline test driving `DefaultPackageManager.collectPackageResources` over a fixture package to prove the manifest entry collects the pair and its absence doesn't. Embed the COMPLETE expected resolved map (51+4 tokens, both variants, derived from pinned SHA eab72e88) and assert `getResolvedThemeColors` matches key-for-key — "matches omp" total, not sampled. Testable claims: full-map equality incl. accent #febc38 / border #178fb9 / borderAccent #0088fa / customMessageLabel #b281d6 / mdCodeBlock #9CDCFE / syntaxKeyword #569CD6; light accent #5a8080 / border #547da7 / syntaxString #A31515; var-ref preservation probe (mutate vars.accent → re-resolve changes); fixture collection proves `pi.themes` needed; `getThemeByName("pi-council") === undefined` (family never a theme name); optional-token fallbacks; export byte-identical to omp (dark #18181e/#1e1e24/#26262e; light #f8f8f8/#ffffff/#fffae6). Caveat: could not verify `resources_discover` tool surface in installed dist — asserted in card facts.

**principal** (cross-seam): The shipped asset is a file-shape contract, not a color contract — EV-2 reads the raw JSON (Theme instances are opaque, ANSI at construction); var-refs resolve at construction by name either way, so preserving them is free AND load-bearing for EV-2. Reframes: R1 — spec §3's `amber` example is wrong: no var named `amber` exists in either omp file (dark `colors.accent: "accent"`, light `colors.accent: "teal"`; `border` → `blue` in both). Ship omp's names verbatim; don't invent `amber`. R2 — spec §4's "read via public getPackageDir" is wrong: `getPackageDir()` walks up from pi's own dist to pi's package.json — returns pi's install dir, NOT pi-council's root. EV-2 must read via `path.join(PKG_ROOT, "themes", ...)`. R3 — NAME-1 forces a `name`-field rename: omp ships `name: "dark"`/`"light"`; a verbatim copy registers as `dark`/`light`, colliding with built-ins and tripping dedupeThemes. The `name` field (not the filename) must be `pi-council-dark`/`pi-council-light`. R4 — "resolves in a test" decomposes into three tests: T1 discovery (drive `collectPackageResources` over the package root, assert both files land enabled; fails if `pi.themes` omitted); T2 validation+identity (`loadThemeFromPath` returns Theme with `name === "pi-council-dark"` + spot-checked resolved colors); T3 optional white-box (`setRegisteredThemes` from T1 output, then `getThemeByName` instanceof Theme). Clean answers: (b) `pi.themes` manifest with literal paths, not resources_discover (self-referential seam); (c) hand-written or generated-once-then-committed, two committed files; (d) no hot-reload — immutable install data; recolor surface is `.council.json` (EV-2), hot-reload is EV-4's watcher. Blind spots: owner naturally flattens var-refs (cannot see EV-2's raw-file merge); designer judges resolved output and may "fix" light's teal accent to amber (breaks omp match) or want hot-reload on an immutable file; principal's claims are code-inferred, not runtime-observed (setRegisteredThemes ordering relative to extension load).

**designer** (human-centered): Ship var-refs preserved in a `themes/` directory, hand-written, committed. The layered vars↔colors structure is the affordance that makes the palette teachable (Gulf of Evaluation for the developer who opens the file); var-refs also keep EV-2's merge compositional. (a) Preserve — resolving to hex collapses the two layers, destroys color-by-hue editability, and forces EV-2's merge to re-stringify hexes. (b) `themes/` directory — static asset → static shipping; pi's documented auto-discovery; file name carries the theme name; no extension runtime dependency. (c) Hand-written — a theme is content, not derived code; generation severs artifact from intent and adds a build dependency; re-pin is a deliberate human action. (d) Package-shipped files are immutable from the user's perspective; the hot-reload surface is `.council.json` via the extension's own watcher (EV-4); put a header comment in each shipped file ("base palette — do not edit; customize via `.council.json`") and a README sentence. (e) "Resolves in a test" = three things: discovery (loader finds it by name), validity (schema passes, all 51 required present, optional fallbacks honored), palette match (brand anchors: dark accent #febc38 / border #178fb9 / borderAccent #0088fa / customMessageLabel #b281d6 / mdCodeBlock #9CDCFE; light accent #5a8080 / border #547da7 / customMessageLabel #7e57c2; empty-string defaults text/userMessageText/customMessageText/toolTitle must remain empty — a hex substitution would silently break text=""). Family concerns: the pair reads as a family through the `pi-council-` prefix in /settings; the amber-dark/teal-light accent divergence is omp's intent (accent tracks background temperature) — the blue border family is the real family anchor, README should teach it; card intent's "makes 'pi-council' selectable in /settings" is a wording bug — per NAME-1 the family is not a theme name. Falsifiable predictions: var-refs survive as strings; brand-anchor ANSI spot-check via getFgAnsi; empty-string defaults survive; discovery via themes/ dir without extension registration; /settings lists the pair under the pi-council- prefix; .council.json override repaints live (EV-4); editing the shipped file does NOT repaint (header comment present); light accent divergence visible on variant switch.

### Round 2 — bounded exchange
