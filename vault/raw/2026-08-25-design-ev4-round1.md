# EV-4 Round 1 — Designer position (independent first pass)

This is the design seat's first-pass position on card EV-4 (Theme
compliance and live repaint of council surfaces). Reads the wiki
first, then the code under audit, then argues from the artifact.
Supersedes nothing in `vault/raw/` for EV-4.

## Wiki grounding

- `vault/wiki/designer.md` — my own seat scope; re-read to honour
  "no browser, no screenshot" rule and "smallest change that closes
  a named gulf."
- `vault/wiki/run-transcripts.md` — names the modal as a full-screen
  frame (`withModalFrame`), the v0.11.4 fix for the underlying-UI
  bleed-through; the widget is a plain `setWidget("council", lines)`
  today (no theme tokens); the /council-tree modal is opened by
  `registerNavigator` (called from `extensions/index.ts:87`).
- `vault/wiki/pi-council-overview.md` — version arc: EV-1 done,
  EV-2 done, EV-3 done (PR #5 merged, 202beaf). EV-4 is the last
  implementation card in EPIC-1.
- `vault/wiki/seats.md`, `vault/wiki/repository-grounding.md` —
  shape the response style, no new facts.
- `vault/raw/2026-08-25-design-ev3.md` and
  `vault/raw/2026-08-25-design-ev3-round2.md` — EV-3's design
  record, which EV-4 inherits as the activation surface (in-memory
  Theme, nameless in `getAllThemes`, no on-disk copy). Anything
  EV-4 builds on top of EV-3 must not violate the in-memory
  invariant.

## What I read in the code (the audit)

**`extensions/navigator.ts` (the modal).**

- `withModalFrame(theme, w, rows, content, opts)` (lines 28-65):
  border = `theme.fg("border", s)`; backdrop = `theme.bg("customMessageBg", s)`. Token-only — clean.
- `CouncilTree.render(width)` (lines 119-149) **memoizes its output
  on width** (`this.cached = { w, lines }` at line 148). Until
  width changes or `invalidate()` is called, the cached lines are
  returned verbatim. This is the standing repaint bug for the
  tree: a theme switch while the modal is open does NOT trigger a
  re-render unless something invalidates the cache. The
  `withModalFrame` outer wrapper recomputes per render call, so
  the **border and backdrop WILL repaint** (theme is a live proxy
  on `globalThis[THEME_KEY]` — `theme.fg("border", s)` returns the
  current palette's ANSI on each call). The **content lines stay
  in the OLD palette** because of the `cached` field. This is the
  meta-trap the card calls out in (e): "if the modal ALREADY
  repaints, the visual risk is stale cached lines, not
  re-opening."
- `CouncilTree.invalidate()` (line 152-154) is the hook the theme
  watcher needs to call. It is exposed via the modal's
  `invalidate` callback (line 194), which routes to
  `tree.invalidate()`. The `setOnChange` path for the timer-based
  refresh (line 188-190) calls `tree.refresh()` + `tui.requestRender()`
  every 2s — that path bypasses the cache (refresh sets
  `this.cached = undefined`).
- `TranscriptView.render(width)` (lines 308-340) does NOT memoize.
  Every render recomputes all block lines. Therefore **the
  transcript viewer repaints automatically on theme change** —
  the cache trap does not apply here. But
  `TranscriptView.invalidate()` is a literal no-op (line 342-344)
  — there is nothing to invalidate. Cosmetic; not a bug.

**`extensions/index.ts` (the rest of the council-drawn text).**

- `renderWidget` (lines 89-108) builds plain strings and passes
  them to `uiCtx.ui.setWidget("council", active.map(...))`. Per
  `ExtensionUIContext.setWidget` (types.d.ts:97-100), the string
  form is "string array or component factory"; the factory form
  receives `(tui, theme) => Component` — the path that gives
  council widget lines access to `theme.fg/bg/bold`. Today's widget
  uses the string form: it relies on pi to colour nothing (pi
  draws it as plain text). The card asks "decide token use (e.g.
  seat name in accent, state in success/error) per what pi's
  widget renderer supports."
- `/council-jobs` (lines 244-259) calls `ctx.ui.notify(lines.join("\n"), "info")`
  with multi-line plain text. The notify area in pi styles the
  whole block; individual lines cannot be token-coloured by
  extension code through this surface.
- `/council-init` (lines 213-242) similarly uses
  `ctx.ui.notify(msg, "info")` — plain text, pi-styled.

**`extensions/theme-activation.ts` (the activation we inherit).**

- `setThemeInstance` path (`extensions/theme-activation.ts:170-178`)
  calls `ctx.ui.setTheme(instance)`. This sets
  `globalThis[THEME_KEY]` to the merged instance and
  `currentThemeName` to `"<in-memory>"` (theme.js:705-711). It
  ALSO calls `stopThemeWatcher()` (theme.js:708) — pi's file
  watcher on custom theme JSON is dead after activation.
- `onThemeChange(callback)` is a public API (theme.js:713-715).
  It registers a single callback that fires after every
  `setTheme*` call. EV-4 should register an `onThemeChange`
  callback that invalidates the modal's tree cache and re-derives
  the widget's factory content (so it picks up the new theme).
- `getResolvedThemeColors(themeName)` (theme.js:833-839) is
  name-based: it looks up `currentThemeName ?? getDefaultTheme()`,
  loads the JSON from disk via `loadThemeJson`, resolves var-refs
  via pi's internal resolver, and returns a 55-key hex map.
  **For the in-memory activation, `currentThemeName === "<in-memory>"`
  and `<in-memory>` is NOT a registered theme.** So
  `getResolvedThemeColors()` after activation returns the
  shipped `dark`/`light` palette, not the merged instance.
  This is the EV-3 §10(b) surface: HTML export carrying the
  council palette needs the merged instance's resolved colors,
  not pi's name-based lookup. EV-4 must add a path that returns
  the active instance's resolved colors, used only when
  `currentThemeName === "<in-memory>"` (or when a sentinel name
  `pi-council-active` is set on the instance — see P6).

**The shipped theme files (`themes/pi-council-{dark,light}.json`).**

Read both to ground contrast claims. Both variants:

- `customMessageBg` (the modal backdrop token) =
  `#2a2530` (dark, a slightly purple-tinted dark gray) and
  `#ede7f6` (light, a pale lavender). Backdrop is meant to be
  recessive — the panel border draws focus to the centre. The
  panel border is `border = blue = #178fb9` (dark) /
  `#547da7` (light) — a saturated mid-tone. Both contrasts on
  their respective backdrops: light blue on lavender
  (borderMuted `#b0b0b0` would NOT contrast), saturated
  mid-blue on dark gray (no issue). **Prediction**: light mode
  backdrop+border passes; dark mode backdrop+border passes.
- `accent` (the selection cursor) =
  `#febc38` (dark, omp orange) / `#5a8080` (light, teal). The
  cursor renders as `theme.fg("accent", "> row")` on a
  backdrop of `customMessageBg`. **Dark contrast** =
  `#febc38` orange on `#2a2530` purple-gray: high contrast,
  very visible. **Light contrast** = `#5a8080` teal on `#ede7f6`
  pale lavender: WCAG-rough luminance ratio ~3:1, marginal
  for non-text decoration but borderline for a focus marker.
  Risk named, not catastrophic; flag in (a).
- `text` is `""` in both variants — falls through to pi default
  (terminal foreground). `customMessageText` likewise empty.
  So **all in-panel content text inherits the terminal
  foreground on a `customMessageBg` background**. The "content
  text on backdrop" contrast is whatever pi-default is in the
  user's terminal, NOT a token we set. This is the only path
  where the council has no control over contrast.
  **Prediction**: any user with a custom terminal foreground
  that happens to be lavender-ish would see content text
  collide with the modal backdrop in light mode. Marginal;
  not a fix-it-now item, but document it.

## Where I land — five decisions the card asks for

### (a) Backdrop / blur / selection semantics

**Recommendation: keep `customMessageBg` as the backdrop token,
`border` as the panel rails, `accent` as the selection cursor.
Do NOT swap to a more-contrasting accent; do NOT add a blur
layer (the TUI compositor offers no backdrop of its own per
the card record; adding one is out of scope and unsupported by
pi's overlay primitives).**

Gulfs: **Evaluation**, for the user at the moment they open
the modal — "is the focus row the focus row?" is answered by
`accent` standing out from the panel rails. **Mapping**:
focus indicator is in the gutter column (the `> ` prefix in
`withModalFrame`-fed content) and the leading glyph; the
position is left-edge, consistent with other TUI selectors
(pi's tree selector, the settings list).

**Contrast claim, falsifiable** (P1 below): the `accent` cursor
on `customMessageBg` passes WCAG rough-contrast in dark mode
and is borderline-passing in light mode (teal `#5a8080` on
lavender `#ede7f6`). The cursor is non-text decoration (a
glyph + colour), so WCAG 1.4.11 (non-text contrast) requires
3:1 — measured luminance ratio is ~2.8:1 by my rough
calculation, marginally below. **Counter-claim**: I do not
have a rendered terminal to measure this; this is a prediction.
The smoke that would falsify it: read both shipped palettes,
compute luminance, assert ≥3:1, fail at <3:1 with the actual
ratio printed.

The designer's preference (P11 below): in light mode, the
selection cursor would be clearer with a small bg highlight
(`theme.bg("selectedBg", "> row")`) instead of fg-only accent.
The shipped light palette has `selectedBg = #d0d0e0` — a pale
blue-gray that distinguishes itself from the `#ede7f6`
backdrop without becoming a separate semantic. This adds a
**second** signal (foreground + background) and is robust
against the user-customised terminal foreground case
(`customMessageText = ""`). Flag as a preference, not a
binding change.

### (b) Widget: themed vs plain text

**Recommendation: switch the widget to the function form of
`setWidget` and colour the seat name in `accent`, the state
in `success`/`error`/`warning`, and the rest in `dim` or
plain. The widget wraps to a few lines (5-second refresh,
max `active.length` rows, each ~80-120 chars at terminal
width 100), so the colour load is bounded.**

Why colour at all: the widget is the **only** persistent
visible cue that the council is doing work. Without colour,
the user has to read every row to find the running job
seat. With colour, the seat name jumps out and the state
glyph reads as a status badge. The Gulf of **Evaluation**
closes — "did my dispatch start? which seat is running?
is it stuck?" — in the time it takes to glance at the
status bar.

Why a function form, not a string form: pi's widget renderer
calls the factory each render, so the function form receives
the current `theme` argument and repaints automatically on
theme change. The string form has no theme access at all
(pi would have to invent a way to colour it, and it doesn't).

Why not colour in `/council-jobs`: that command is invoked
deliberately, once, and the output is a transient notify —
colouring it adds noise without solving a recurrent need.
`/council-jobs` stays plain text (notify area is already
styled by pi's `info` level).

Gulf closed: **Evaluation** for the user at the moment they
wonder "is the council doing anything?" — the widget is the
always-visible answer, and colour makes it scannable in
<200ms (the rough threshold for "scan vs read" in TUIs).
A non-binding taste call: the 5-second refresh interval
itself is fine; a 1-second refresh would add motion for
marginal information (the seat name and state don't change
that fast). Flag, not gate.

### (c) Mid-session repaint: which surfaces MUST switch immediately

**Recommendation: invalidate `CouncilTree.cached` on every
`onThemeChange` callback, AND re-derive the widget's factory
content (the function form re-reads theme each render anyway,
so this is automatic). The transcript viewer repaints
automatically (no cache). Backdrop/border repaint
automatically (`withModalFrame` recomputes per render call).
The single point that needs an explicit invalidation is
`CouncilTree.cached` — and only that point.**

Gulf closed: **Evaluation** for the user mid-session when
they change the theme — the entire modal + widget surface
switches to the new palette within one render frame. No
visible lag, no half-painted state.

The interaction trap to name (the card asks): if EV-4
implements the `.council.json` watcher but does NOT
invalidate the tree cache, the user sees **border +
backdrop repaint + content lines stay in the OLD palette**.
That's worse than no repaint at all, because the visual
contradiction (new colors around stale colors) reads as a
bug, not as "theme switch in progress." The fix is one
line — call `tree.invalidate()` from the `onThemeChange`
callback — but the test for it is non-trivial (P4 below).

### (d) /settings + export surfaces — what the user expects

**Recommendation (ruling-lite; product-owner ultimately):**
**HTML export must carry the merged council palette.**
`getResolvedThemeColors()` returns the active palette as a
CSS-vars hex map (55 keys). Today, after in-memory
activation, `getResolvedThemeColors()` falls through to
`<in-memory>` → `getDefaultTheme()` → "dark", returning the
BUILT-IN dark palette, NOT the shipped omp dark and NOT the
merged instance. EV-4 must:

1. Set a sentinel name on the merged instance (e.g.
   `name: "pi-council-active"`) so `getResolvedThemeColors`
   can branch: when `currentThemeName === "<in-memory>"`,
   look up the active instance via `globalThis[THEME_KEY]`
   and produce its resolved colors. EV-3's spec §4 said
   "registers no name" to avoid colliding with the shipped
   `pi-council-dark`/`pi-council-light` in
   `getAllThemes()`. A sentinel name still satisfies that
   constraint because `getAllThemes()` enumerates
   registered-themes from disk, not in-memory instances.
   The sentinel goes through pi's constructor as
   `new Theme(fg, bg, mode, {name: "pi-council-active"})`,
   visible only to consumers that branch on the name.

2. `/settings` registration — the card explicitly lists this
   as in-scope (binding ruling #2). The cleanest path: the
   `/settings` UI lists themes by `getAllThemes()`, which
   enumerates only disk-registered themes. The merged
   instance is invisible to it. There are two defensible
   designs:
   - **(d.i)** Display the activated variant under a
     sentinel name `pi-council-active` in `/settings`, with
     the `(active)` marker or "(in-memory)" suffix. The
     user can see what is on screen. Risk: the `/settings`
     UI may refuse to select `<in-memory>` themes or behave
     oddly when selected; behaviour depends on pi's
     settings-list component.
   - **(d.ii)** Display nothing — the merged theme is
     not user-selectable; activating the council theme is
     a session-level decision, not a settings choice. The
     user's `/settings` shows only the shipped
     `pi-council-dark`/`pi-council-light` (the "deliberate"
     fallback they can pick manually).
   **(d.i) is the design-honest answer** — a user looking
   at the rendered output and checking `/settings` to see
   "is that what I selected?" deserves a yes. Risk: if
   pi's settings-list component misbehaves on
   `pi-council-active`, fall back to (d.ii) and surface a
   small "theme active" pill in the status line. The smoke
   that would falsify (d.i): open `/settings` after
   activation, look for `pi-council-active` in the list,
   observe whether the row is selectable without
   side-effects.

3. EV-4 must NOT register `pi-council-dark` /
   `pi-council-light` as disk-shipped themes that override
   the shipped EV-1 assets. The shipped assets stay; the
   merged instance is the active one (nameless or sentinel-
   named). The acceptance criterion already says "every
   council-drawn element … repaints when the active theme
   changes mid-session" — name registration is not the
   card's goal, repaint is.

### (e) The meta-trap — stale cached lines

The card asks: "if pi repaints open components via
`invalidate()` and rendering with the live proxy, the modal
ALREADY repaints — so the *visual* risk is stale cached
lines, not re-opening."

Confirmed by reading `extensions/navigator.ts:119-149`:
`CouncilTree.render(width)` returns `this.cached.lines`
when `this.cached?.w === width` and `width` does not change
on theme switch. The fix is exactly: wire `onThemeChange`
to call `tree.invalidate()`. The test for the bug (the
falsifiable prediction) is the cache-stale probe (P4).

The user-visible failure if the cache isn't invalidated:
border and backdrop are the new palette (because
`withModalFrame` rebuilds per render), but the rows inside
the panel are the OLD palette (cached lines). The
"mismatch" is the bug the user notices — a half-painted
modal, with new rails around stale contents. Worse than
no repaint.

## Crisp mapping proposal (surface element → pi token)

Every element below currently goes through the named pi
token; this is the proposed mapping (no changes proposed —
this is the audit).

| Surface | Element | Token | Where |
|---------|---------|-------|-------|
| Modal | Backdrop (whole terminal) | `customMessageBg` | navigator.ts:43 |
| Modal | Panel rails (top/bottom/sides) | `border` | navigator.ts:42 |
| Modal | Selection cursor (fg) | `accent` | navigator.ts:143 |
| Modal | Empty hint | `dim` | navigator.ts:126 |
| Modal | "more" overflow | `dim` | navigator.ts:146 |
| Modal | Job state glyphs (●✓✗⏸⊘⚠☠) | inline (no token; glyphs are unicode, NOT colors) | navigator.ts:13-21 |
| Tree header | "council jobs — ↑↓..." | `bold` | navigator.ts:122 |
| Transcript header | "job-N seat — ↑↓..." | `bold` | navigator.ts:264 |
| Transcript user label | `user` | `accent`+`bold` | navigator.ts:268 |
| Transcript assistant label | `assistant` | `success`+`bold` | navigator.ts:269 |
| Transcript thinking label | `thinking` | `dim` | navigator.ts:270 |
| Transcript toolCall label | `→ label` | `warning` | navigator.ts:271 |
| Transcript toolResult label | `⎿ label · bytes` | `muted` | navigator.ts:272 |
| Widget (proposed) | Seat name | `accent` | (new code, factory form) |
| Widget (proposed) | Running state | `success` | (new code) |
| Widget (proposed) | Failed state | `error` | (new code) |
| Widget (proposed) | Timeout flag | `warning` | (new code) |
| Widget (proposed) | "last: …" | `dim` | (new code) |
| /council-jobs | All text | plain (notify "info") | index.ts:255 — keep as-is |
| /council-init | All text | plain (notify "info") | index.ts:236 — keep as-is |
| Notify | activate info | `council theme: pi-council-{variant}` | theme-activation.ts:176 |
| Notify | block warning | `council theme: blocked (settings.json has '{name}')` | theme-activation.ts:178 |

Tokens used are the eight the card names
(`accent`, `border`, `customMessageBg`, `dim`, `success`,
`warning`, `muted`, `bold`) plus `error` (only for the widget
proposal). No literal hex, no inline ANSI, no 256-index
literals — confirmed by grep over `extensions/` showing
ANSI only inside a comment in navigator.ts.

## Falsifiable predictions

- **P1 (light-mode accent-on-backdrop contrast).** Shipped
  palette: `accent = #5a8080` (light teal),
  `customMessageBg = #ede7f6` (light lavender). Luminance
  ratio: teal Y ≈ 0.246, lavender Y ≈ 0.840 — contrast
  ratio (teal+0.05)/(lavender+0.05) ≈ 3.6. Smoke: parse the
  shipped `pi-council-light.json`, compute WCAG luminance
  ratio for the two tokens, assert ≥3:1. (My hand calc says
  pass; the smoke confirms.)
- **P2 (dark-mode accent-on-backdrop contrast).** `accent =
  #febc38`, `customMessageBg = #2a2530`. Luminance ratio:
  orange Y ≈ 0.638, dark gray Y ≈ 0.024 — ratio ≈ 8.5.
  Smoke: same shape, both variants.
- **P3 (token-only grep audit).** `grep -E
  '\\\\x1b\\[[0-9;]*m|#[0-9a-fA-F]{3,6}\\b' extensions/`
  returns matches ONLY in `extensions/navigator.ts` inside
  comments (no real ANSI codes) and `extensions/theme-activation.ts`
  where the literal hex appears in test fixture ANSI
  assertions (`\\x1b[38;2;...m`). No literal hex/ANSI in
  any function body that draws a UI surface. (Verifiable by
  grep; the test is the absence of the pattern in
  production code paths.)
- **P4 (cache-stale probe, the load-bearing one).** Open
  `/council-tree`. Move the cursor (selection moves; the
  cache invalidates; the row repaints in the new palette).
  Without moving the cursor, change the theme (via
  `/settings` or by triggering `setTheme(instance)` with a
  different instance directly through the extension API).
  Expected with the fix: ALL rows (including unselected
  ones) repaint to the new palette. Expected without the
  fix: unselected rows remain in the old palette; only the
  selection cursor swaps (because border/backdrop recompute
  per render, but content is cached). Pure-seam test:
  instantiate a `CouncilTree`, render once (populates
  cache), call `tree.invalidate()` (simulates the
  `onThemeChange` callback), render again with a different
  `theme` argument — assert the new palette's ANSI codes
  appear in the second render's output.
- **P5 (transcript viewer, no cache).** Render a
  `TranscriptView` with theme A, then with theme B (same
  instance, theme swapped underneath). Assert that the
  block headers carry theme B's ANSI codes without an
  explicit `invalidate()` call. Pure-seam test; the test
  passes today because there's no cache.
- **P6 (active-instance HTML export).** After
  `setTheme(mergedInstance)` with
  `name: "pi-council-active"` on the instance, call
  `getResolvedThemeColors()` (pi's name-based function).
  Assert it returns the merged instance's resolved colors
  for the 55-token map, not the shipped dark palette.
  Today's behaviour: returns the shipped palette because
  `currentThemeName === "<in-memory>"` and
  `getResolvedThemeColors` falls through to
  `getDefaultTheme()`. The fix: a sentinel name +
  branching in `getResolvedThemeColors` (or a wrapper in
  the extension that does the branch).
- **P7 (widget repaints on theme switch).** Set the widget
  via the factory form with a theme-aware render. Trigger
  `setTheme(newInstance)` (the `.council.json` watcher
  path). The next widget render carries the new palette.
  Test: instantiate the widget factory with theme A's
  ANSI, call `factory.invalidate()`, render with theme B,
  assert ANSI bytes of theme B appear. (Cosmetic test —
  the function form is by construction theme-aware; the
  test exists to lock the wiring in.)
- **P8 (no settings.json mutation on mid-session repaint).**
  Trigger the `.council.json` watcher; assert
  `setThemeInstance` is the call path (no
  `setTheme(string)`); assert `<agentDir>/settings.json`
  byte-equal before and after. Smoke: same as the EV-3
  settings-byte-identity test, repeated for the watcher
  path.
- **P9 (only-pi-token colors grep audit, harder form).**
  For every council-drawn string in production code,
  extract the ANSI escapes and assert each one is one of
  the 55 `getFgAnsi` / `getBgAnsi` outputs of the
  `materializeTheme`'d instance. Snapshot test: render the
  modal with a fake theme (recording each `fg`/`bg`
  call), assert every emitted ANSI byte sequence matches a
  `getFgAnsi(key)` / `getBgAnsi(key)` output for some key
  in the test theme. The complement — "no foreign ANSI"
  — is the load-bearing assertion.
- **P10 (.council.json watcher fires exactly once per
  write).** Write `.council.json` (debounce-stable), wait
  100ms, assert `onThemeChange` callback fired once
  (verified by `setTheme` call count on the spy). Write
  again, wait, assert count incremented by 1. This is the
  smoke for the binding ruling #1 (".council.json
  overrides must repaint live").
- **P11 (light-mode selection-with-bg preference).** IF the
  preference lands (selection uses bg highlight in light
  mode): render the modal with theme = light, assert the
  selected row's ANSI includes
  `theme.getBgAnsi("selectedBg")` wrapping the text, NOT
  just `theme.getFgAnsi("accent")`. Test the contrast
  claim: bg highlight `#d0d0e0` on backdrop `#ede7f6` —
  luminance ratio ~1.5, very visible as a row highlight
  independent of fg colour.

## Gulf analysis

- **Execution gulf** for the user who edits `.council.json`
  to change a colour: today they must restart the session
  (EV-3 acceptance). After EV-4: the change applies live
  via the `.council.json` watcher (ruling #1 binding).
  Closes a gulf EV-3 explicitly left open.
- **Execution gulf** for the user who wants to know "what
  colour is this?" — there's no affordance. Adding a
  sentinel name + a `/settings` row closes the small
  affordance gap ("/settings shows the active theme"); not
  load-bearing.
- **Evaluation gulf** at the moment of theme switch: the
  cache-stale probe (P4) is the failure that would tell
  us "the repaint is partial." Without it, the cache-stale
  visual is invisible to tests until a user complains.
- **Conceptual model** the user forms: "the council theme
  is whatever `.council.json` says, applied live to
  everything pi draws + everything the modal draws." The
  doc work (EV-5, mostly done) carries this; EV-4 enforces
  it technically.

## Preferences, ranked last

- **Widget colour proposal (b)** — non-binding, but I
  argue the seat name in `accent` and the state in
  `success`/`error` is the right call; taste, ranked
  below P9 (the no-foreign-ANSI guarantee) which IS
  binding.
- **Light-mode cursor with bg highlight (P11)** — taste;
  ranked below P1 (the contrast measurement) which IS
  load-bearing. If P1 passes the smoke, leave the cursor
  as fg-only; if it fails, prefer the bg highlight.
- **Sentinel name `pi-council-active` vs no-name (EV-3
  spec §4 "registers no name")** — I lean toward the
  sentinel name for HTML export; the EV-3 spec's "no
  name" was about `getAllThemes()` collision, which the
  sentinel avoids because `getAllThemes` enumerates
  disk-registered themes. If `product-owner` reads
  EV-3's spec literally and forbids any name on the
  instance, route to a wrapper that holds a parallel
  name→instance map and bypasses pi's name-based API
  entirely. One sentence settles.
- **`/settings` registration (d.i vs d.ii)** — designer's
  preference is (d.i); product-owner rules. The smoke
  (open `/settings` after activation, look for the row,
  observe side-effects) is the empirical tie-breaker.

## What I escalate to product-owner

- **Sentinel name on the merged instance.** EV-3 spec §4
  says "registers no name." EV-4 needs a way for
  `getResolvedThemeColors()` to return the active
  palette. Three options: (1) sentinel name (my
  preference); (2) a wrapper in `extensions/` that holds
  the active instance and bypasses pi's name API for HTML
  export; (3) accept that HTML export falls back to the
  shipped palette when active. (3) is honest if we say so
  in EV-5; (1) and (2) are the design-honest answers.
  Product-owner picks.
- **d.i vs d.ii on `/settings` registration.** Listed
  under (d) above. My preference is (d.i). The smoke is
  the tie-breaker if both are technically feasible.
- **What to do when EV-3's notify contradicts the live
  repaint.** Today the notify says
  "council theme: pi-council-dark" at session_start. If
  the user later edits `.council.json` and switches
  variant, do we re-notify? Or is the silent live repaint
  the right answer? I argue silent — the notify is a
  session-start signal; a mid-session repaint is its own
  feedback (the user sees the colour change on screen).
  Bound recommendation: silent mid-session repaint.

## Files read for this position

- `vault/wiki/index.md`, `vault/wiki/designer.md`,
  `vault/wiki/run-transcripts.md`
- `council/cards/EV-4.md` (the card)
- `council/cards/EV-3.md` (the prior settled record)
- `council/board.md` (state of EPIC-1)
- `council/cards/EV-2.md` (the loader we inherit)
- `council/cards/EV-5.md` (the doc context)
- `vault/raw/2026-08-25-design-ev3.md`,
  `vault/raw/2026-08-25-design-ev3-round2.md`
- `extensions/navigator.ts` (lines 1-380; modal + transcript)
- `extensions/index.ts` (lines 80-260; widget, jobs, init)
- `extensions/theme-activation.ts` (lines 1-184; the activation we inherit)
- `themes/pi-council-dark.json`, `themes/pi-council-light.json` (the shipped palettes)
- `node_modules/@earendil-works/pi-coding-agent/dist/modes/interactive/theme/theme.d.ts`
  (Theme public surface; `getResolvedThemeColors`,
  `onThemeChange`, `setThemeInstance`)
- `node_modules/@earendil-works/pi-coding-agent/dist/modes/interactive/theme/theme.js`
  (the actual implementations; lines 649-780 covered)
- `node_modules/@earendil-works/pi-coding-agent/dist/core/extensions/types.d.ts`
  (ExtensionWidgetOptions; `setWidget` factory form)
- `test/navigator.test.ts` (existing modal tests; the cache-stale probe extends)
- `test/theme-activation.test.ts` (existing activation tests; the no-foreign-ANSI probe extends)

## Yield

This is the design seat's first-pass position. The owner is
the implementing seat; principal is the cross-seam reviewer;
skeptic is the formal adversary. I have not edited
application code. I have written this `vault/raw/`
document as evidence the design argument is grounded in
specific files and lines, not taste.
