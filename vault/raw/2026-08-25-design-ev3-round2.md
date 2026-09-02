# EV-3 Round 2 — Designer position (bounded exchange)

Round-2 design response on card EV-3 (Activate the council theme on
session start). Engages the five open disputes the round-1
convergence surfaced, names the gulf each closes, and predicts the
visible failures a person / consumer would hit if each side landed
wrong. Supersedes nothing in `vault/raw/` for EV-3 (round-1 design
note `2026-08-25-design-ev3.md` stands; this doc is the round-2
delta, not a rewrite).

## Where I land — five disputes, one table

| # | Dispute | Owner (R1) | Principal (R1) | Designer (R1) | **Designer (R2)** |
|---|---|---|---|---|---|
| 1 | Custom pair `A/B` | activate (auto-follow signature) | block (concrete named arrangement) | well-formed pairs activate; malformed pairs block | **block** (principal's; reasons below) |
| 2 | Auto-variant source | env `COLORFGBG` heuristic | read `ui.theme` (name + `getColorMode()`) once pre-activate | sync `detectTerminalBackgroundFromEnv()` (COLORFGBG) | **read `ui.theme`'s variant once pre-activate** (principal's; continuity wins) |
| 3 | Notify | not opposed, not settled | not opposed, not settled | activate (info) + block (warning), silent noop | **hold** (design judgment; bound recommendation in §3) |
| 4 | Construction | reimplement resolver + in-memory `new Theme(...)` | reimplement resolver + in-memory `new Theme(...)` | tempfile + `loadThemeFromPath` | **tempfile** (own R1); drop A LOC; ground-truth seam as a NET if the card goes the other way |
| 5 | Acceptance line | (not raised) | unsatisfiable under in-memory, needs correction | (not raised) | **nominate corrected text** in §5 |

The rest of this doc justifies each row, names the gulf closed,
and predicts the visible failure the wrong side would cause.

## §1 — Dispute 1: custom pair `A/B` blocks (principal's position)

### What I held in round 1 vs where I land now

Round 1 had me at: "any well-formed `A/B` (one `/` between non-empty
halves, which is what `parseAutoThemeSetting` accepts) activates; a
malformed pair with extra `/`s blocks." That is OWNER's position in
spirit. In round 2 I land on PRINCIPAL's: all custom pairs block;
only the literal `"light/dark"` (row (b) of the spec §4 table)
activates.

### Why the shift, grounded

- **Spec §4 row (b) is literally `"light/dark"`, not "any auto-follow
  pair".** The table is the binding design authority; the row names
  one specific value. Row (d) is "any other concrete name" — and a
  custom pair `nord-light/nord-dark` is structurally a *named
  arrangement of two concrete themes*, exactly the kind of
  deliberate consumer choice row (d) describes. `docs/superpowers/specs/2026-08-25-council-theme-design.md`
  §4 four-state table.
- **Phase-1 ruling language is specific to the pi-shipped pair.**
  Recorded 2026 by the human: "pi's `"theme": "light/dark"` setting
  (auto-follow terminal appearance) is not an explicit theme choice
  and does not block council activation. ... Only a concrete theme
  name (e.g. `"theme": "gruvbox"`) in settings.json blocks council
  activation." The example given for the block side is a single
  concrete name (`gruvbox`); the example for the activate side is
  the pi-shipped pair (`light/dark`). Custom pairs are not in
  either example, but a custom pair is structurally two concrete
  names, which is closer to "gruvbox" than to "light/dark".
- **The user's intent argument.** A consumer who wrote
  `nord-light/nord-dark` in settings.json had to (a) install both
  Nord themes, (b) deliberately type those names. That is a
  deliberate aesthetic choice — Nord specifically. Activating the
  council theme silently OVER their Nord pair would be a surprise;
  the user would see a palette they didn't pick and have no idea
  why. The block-with-notify path is the design-honest answer: the
  notify names the source (`settings.json has 'nord-light/nord-dark'`),
  the user decides.
- **Owner's defense (parseAutoThemeSetting accepts any `A/B`)** is
  technically true but loses the user's intent. pi's
  `parseAutoThemeSetting` returning non-undefined for
  `"nord-light/nord-dark"` is pi's syntactic convenience, not a
  statement about what the user meant. The user meant "I like Nord
  and want it to follow my terminal" — which is the OPPOSITE of
  "let the council theme override me." Reading intent via
  parseAutoThemeSetting alone would honor pi's API surface and
  ignore the person's intent.

### Gulf closed

- **Evaluation gulf** for the user who wrote a custom pair and
  expects their Nord (or whatever) to render. Silent activation
  widens the gulf: the user sees omp colors, wonders where Nord
  went, debugs for an hour. The block + warning notify closes it:
  the user reads "council theme: blocked (settings.json has
  'nord-light/nord-dark')" and either removes the pair (lets the
  council theme activate), removes the theme section (keeps Nord),
  or pins the council theme variant explicitly.

### Falsifiable predictions

- **P22**: `decideActivation({themeSection: {variant:"auto"},
  projectSettingsRaw: "nord-light/nord-dark", globalSettingsRaw:
  undefined, terminalTheme: "dark"})` returns `{kind:"block",
  themeName:"nord-light/nord-dark"}`. Pure-seam unit test.
- **P23**: `theme: "foo/bar/baz"` (multi-`/`, malformed pair)
  returns `{kind:"block", themeName:"foo/bar/baz"}`. Defensive
  default; matches both owner's and principal's positions on
  malformed pairs.
- **P27**: With `theme: "nord-light/nord-dark"` in project
  settings.json, the TUI shows the block-notify at session_start.
  CDP smoke: launch a TUI session with this settings.json, observe
  the warning message contains `'nord-light/nord-dark'`.

## §2 — Dispute 2: auto-variant source — read `ui.theme`'s variant once pre-activate (principal's position)

### What I held in round 1 vs where I land now

Round 1 had me at: synchronous `detectTerminalBackgroundFromEnv()`
(COLORFGBG env var), rejecting async OSC-11 because the TUI hasn't
rendered yet at session_start. OWNER landed in the same place.
PRINCIPAL argued for reading `ui.theme`'s already-resolved state
BEFORE first setTheme. In round 2 I land on PRINCIPAL.

### Why the shift, grounded

- **Spec §4 prohibits reading `ui.theme.name`, NOT `ui.theme`'s
  variant accessor.** Spec §4: "Never read `ui.theme.name` — after
  any `setTheme(instance)` it is `"<in-memory>"`." The prohibition
  is on the name field specifically (which becomes useless after
  in-memory activation). Reading the resolved Theme's color mode
  via `getColorMode()` (or whatever the variant accessor is) is
  independent of `.name`. PRINCIPAL's "name + getColorMode()"
  phrasing bundles both; the actually-load-bearing signal is the
  variant, not the name.
- **Visual continuity wins.** At session_start time, the user has
  ALREADY been looking at their screen and has seen pi's resolved
  palette (pi's `InteractiveThemeController` constructor calls
  `initTheme` BEFORE session_start fires — verified in
  `extensions/index.ts:107-135` ordering). Whatever palette they
  are seeing at the moment our session_start handler runs is what
  they expect to continue seeing. If COLORFGBG says one thing and
  pi's resolver said another, flipping to the COLORFGBG opinion
  would create a flash-the-eyes moment. Continuity is the smaller,
  calmer Gulf of Evaluation answer.
- **pi's resolver may use signals we don't replicate.** pi's
  `resolveThemeSetting` (theme.js:540-552) collapses
  `"light/dark"` against the terminal; `applyFromSettings`
  (theme-controller.js:38-49) persists a high-confidence auto-detect
  literal `"dark"`/`"light"` to settings.json. By the time
  session_start fires, pi has applied these. Re-detecting via
  COLORFGBG ignores pi's persisted state and may disagree. The
  user's intent at this point is "I want the council theme on
  top of whatever I was already seeing," not "I want the absolute
  truth of my terminal background right now."
- **The activate-notify's truthfulness depends on continuity.**
  If we read COLORFGBG and disagree with pi, the notify says one
  variant and the user sees another. That is a worse failure mode
  than reading ui.theme and matching what the user already sees.
  With ui.theme continuity, the notify's named variant is what the
  user sees; the Gulf of Evaluation is closed by direct
  correspondence.

### Gulf closed

- **Evaluation gulf** for the user at session_start: they have been
  seeing pi's palette; the council theme should continue within
  that palette, not flip it. Reading ui.theme's variant gives us
  what they were seeing; the activate-notify matches it; the user
  reads "council theme: pi-council-dark" and sees dark on screen.

### Falsifiable predictions

- **P24**: With pi's resolved theme in dark mode at session_start
  (e.g., pi persisted literal `"dark"` per row (c)), the
  activation uses dark. CDP smoke: confirm dark-on-screen before
  and after; the activate-notify says "pi-council-dark".
- **P25 (counter-test)**: With `COLORFGBG=0;0` (light) but pi's
  resolver returning dark (e.g., user pinned dark in `/settings`
  earlier), the activation uses dark — palette does NOT flip.
  Smoke: terminal reports `COLORFGBG=0;0`, palette is dark before
  AND after activation. Continuity wins over COLORFGBG.
- **P32 (continuity vs explicit pin)**: With `.council.json` having
  `variant: "light"` and pi showing dark, the activation uses
  light (explicit pin wins over ui.theme's variant — already in
  the spec §4 four-state table, restated here for the smoke).

## §3 — Dispute 3: notify on activate/block, silent noop (hold my R1 position)

### Why hold

This is design judgment, not product ruling. The product ruling would
be: "should there be ANY user-facing signal at session_start?" The
seat's ruling is: "given a signal, what's the right copy and level?"

- **The notify IS the Gulf of Evaluation closer.** Without it, the
  user has no signal that the activation decision was made at all.
  - Activate-notify says: "your council theme is now active; here's
    which variant." The user reads "pi-council-dark" and confirms
    against what they expected.
  - Block-notify says: "your settings.json pins a concrete theme;
    the council theme is not active." The user reads the pinned
    theme name and decides what to do (remove the pin, remove the
    theme section, pin the council variant explicitly).
  - Silent noop for the off-switch case (no theme section, or
    `enabled:false`) is BY DESIGN: the user expressed "I don't want
    a council theme," and a "council theme: off" notify would be
    noise in a long-running session that may last hours.
- **The notify text must match the predicate (P18, restated).** If
  dispute 1 lands on "custom pairs block," the block-notify fires
  for `"nord-light/nord-dark"`. If it lands on "custom pairs
  activate," the block-notify never fires for a pair. The copy and
  the predicate are coupled; both must move together.

### Where this might be a product ruling instead

If the product-owner decides that NO notify should fire at
session_start (relying on `/settings` or other UI surface to
communicate the activation), then the seat's recommendation inverts.
The current notify is the only signal because:

1. After in-memory activation, the theme's name in `getAllThemes()` is
   the shipped `pi-council-dark`/`pi-council-light`, NOT the
   activated merged instance (the activated instance has no name).
2. `/settings` would show the activated theme under... nothing
   (because `<in-memory>` is not a name). The user has no way to
   verify activation via the standard UI surface.

So the notify is load-bearing for the in-memory route. Removing it
removes the user's only verification surface.

**Bound recommendation to product-owner**: if a future card moves
activation OFF the in-memory route (e.g., materializes a named theme
on disk so `/settings` can show it), the notify can be reconsidered.
For EV-3 in its settled shape, the notify is non-negotiable.

### Falsifiable predictions

- **P26 (row c truthfulness)**: With `.council.json` theme present
  AND `theme: "dark"` (persisted literal) in project settings.json,
  the activate-notify fires (not block). Wording: "council theme:
  pi-council-dark (follows settings.json auto-detection)" — explains
  the row (c) carve-out to the user who might think they made an
  explicit choice.
- **P33 (silent noop)**: With `.council.json` absent or
  `theme: false`, session_start produces NO notify. CDP smoke:
  launch session without `.council.json`; observe notify area is
  empty after start.

## §4 — Dispute 4: construction — tempfile (own R1); ground-truth seam as a NET if reimplementation wins

### My pick

**Tempfile + `loadThemeFromPath`** — holds from round 1. Reasons:

- **Spec §4 "writes nothing to disk" is in the context of the
  USER's namespace**, not the OS temp directory. The full sentence:
  "the in-memory route writes nothing to disk and registers no
  name — the materialized theme can never collide with the shipped
  names in `getAllThemes`." The collision concern is about the
  theme inventory; a transient file under
  `os.tmpdir()/council-active-{pid}-{ts}.json` unlinked in
  `try/finally` is outside that namespace. The user never sees it.
- **Public API surface**: `loadThemeFromPath` is the only public
  pi API that returns a Theme instance from arbitrary JSON.
  Reimplementing `resolveThemeColors` + `withThemeColorFallbacks`
  (theme.js:229-237 + pi internals) duplicates ~50-80 LoC of pi
  internals and depends on those internals staying semantically
  stable across pi versions. Tempfile is the smaller surface.
- **Ground-truth seam is built-in.** Calling `loadThemeFromPath`
  means pi itself does the resolution + fallback work; we cannot
  diverge from pi's resolver. If the card picks reimplementation,
  the ground-truth seam is a required guardrail (see net below).

### Drop A LOC

If the card picks reimplementation (owner/principal's position), the
implementation is roughly:

- A reimplementation of `resolveThemeColors(varName, vars)` —
  ~15-25 LoC (handle var-ref → var value → hex; "" defaults; error
  on undeclared var).
- A reimplementation of `withThemeColorFallbacks(colors)` — ~10-15
  LoC (4 optional tokens with their fallback sources).
- The fg/bg split (8 bg keys out of the 51+4 colors) — ~5-10 LoC
  (a static list + filter).
- A `new Theme(fgColors, bgColors, "truecolor", {name})` call —
  ~3 LoC.
- Unit tests for the reimplementation against the ground-truth —
  ~30-50 LoC across 3 fixtures (no override, vars-only, colors-only).

Total reimplementation: roughly 60-100 LoC, depending on style.
Tempfile path: ~15-25 LoC total (write JSON, sync, call, unlink,
return). The drop is approximately **40-75 LoC**, which is what I
mean by "drop A LOC" in the brief.

### The ground-truth ANSI seam — the NET for the reimplementation, if it wins

If the card lands on reimplementation, the safety net is the
ground-truth ANSI identity test. The seam is at three levels:

1. **Unit (gates the implementation)**. Pure-seam test: for a known
   merged JSON input, the in-memory construction's `getFgAnsi(name,
   s)` / `getBgAnsi(name, s)` returns ANSI byte-equal to what
   `loadThemeFromPath(tempFile).getFgAnsi/getBgAnsi` returns for the
   same input. Three fixtures minimum: (a) no override (shipped
   dark), (b) vars-only override (`dark.vars.accent = "#123456"`),
   (c) colors-only override (`dark.colors.mdHeading = "#abcdef"`).
   Plus both variants. ~6 assertions.
2. **Integration (re-derivation check)**. Build the merged JSON via
   `mergeThemeSection(loadShippedTheme("dark"), section.dark)`,
   call `getResolvedThemeColors(theme)` on the constructed instance,
   assert the resolved color map matches the merged JSON's
   post-resolution values for all 51+4 token keys.
3. **End-to-end (skeptic's smoke)**. Scaffold a fixture repo,
   launch a TUI session, capture the rendered ANSI for a known
   cell (e.g., the border color of a tool call), assert the
   captured ANSI matches the ground-truth baseline.

### Falsifiable predictions

- **P30 (reimplementation ground-truth)**: For 6 fixtures (3
  inputs × 2 variants), `new Theme(fg, bg, "truecolor", {name})` in
  the extension produces fg/bg ANSI byte-equal to
  `loadThemeFromPath(tempFile)`. Pure-seam test in
  `test/theme-activation.test.ts`.
- **P31 (tempfile cleanup)**: After `activateCouncilTheme` returns,
  `os.tmpdir()` contains no `council-active-*` file. Smoke: list
  `os.tmpdir()` before and after; diff.
- **P34 (try/finally correctness)**: If `loadThemeFromPath` throws
  mid-call (e.g., bad JSON), the tempfile is still unlinked. Smoke:
  inject a `loadThemeFromPath` that throws; assert no leftover file.

## §5 — Dispute 5: nominate the corrected acceptance line

### Current acceptance (unsatisfiable under in-memory)

> With a theme section present, after session start `getThemeByName`
> (or equivalent) resolves the materialized `pi-council-dark` /
> `pi-council-light` themes and their resolved colors match the
> config values; unit-testable without a real TUI.

Per spec §4: the in-memory route "registers no name — the materialized
theme can never collide with the shipped names in `getAllThemes`."
So `getThemeByName("pi-council-dark")` returns the SHIPPED
un-merged palette, not the activated merged instance. The acceptance
line is unsatisfiable as written.

### Corrected acceptance (proposed)

> With a theme section present, after session start the
> actively-installed Theme instance (reachable via `ui.theme` or via
> the instance captured by `ui.setTheme`) reflects the merged
> palette for the resolved variant; its resolved colors match the
> output of `mergeThemeSection(loadShippedTheme(variant), section.variant)`
> for that variant. Unit-testable without a real TUI by capturing
> the instance passed to `ui.setTheme` and asserting
> `getResolvedThemeColors(instance)` byte-equal to the merged
> JSON's post-resolution map for all 51+4 token keys.

### Why this wording

- **Names the reachable surface.** `ui.theme` is the live proxy on
  globalThis set by `setThemeInstance` (theme.js:705-714). After
  activation, `ui.theme` is the merged instance. This is what the
  user sees and what `/council-tree` reads via its factory's
  second argument (navigator.ts:164-176).
- **Names the comparison.** `getResolvedThemeColors(instance)`
  resolves var-refs to concrete values, matching what the user sees
  on screen. The merged JSON's post-resolution map is the ground
  truth — `mergeThemeSection(loadShippedTheme(variant), section.variant)`
  produces the input JSON, and after pi's `loadThemeFromPath` (or
  the reimplementation's resolver), the resolved colors are the
  expected output.
- **Names the testability.** "Captured by `ui.setTheme`" is the
  pure-seam test mechanism: stub `ui.setTheme`, call the activation
  path, assert the captured instance's resolved colors. No TUI
  needed.
- **Aligns with EV-2's "one-word fix" precedent.** EV-2's
  acceptance had a draft-vs-settled wording mismatch resolved by
  citing spec §8 ("`loadCouncilConfig` returns the parsed theme
  section" → "`loadThemeConfig` returns the parsed theme section").
  Same precedent here: cite spec §4's "in-memory, no third on-disk
  copy" and "registers no name" as the binding constraint.

## §6 — Additional visible-failure predictions round 1 missed

P1-P8 covered the obvious failure modes. The following are
predictions I did not make in round 1 that surfaced on this read.

- **P26 (row c truthfulness, restated)**: With `.council.json`
  theme present AND `theme: "dark"` persisted literal in
  settings.json (row c), the user may think they made an explicit
  choice — they didn't (it's pi's auto-detect persistence). The
  activate-notify must explain this carve-out in copy, not just
  name the variant. Without the explanation, the user reads "I
  said dark, and the council says dark — but they look different
  (omp dark ≠ built-in dark)" and concludes the scaffold didn't
  apply correctly.
- **P28 (headless mode defensive)**: In `mode === "json"` or
  `mode === "rpc"`, `ui.setTheme(instance)` may not behave the
  same way as in TUI mode (no TUI to repaint, no notify area). The
  activation wraps in try/catch; on failure or in headless modes,
  silent noop (no notify, no exception, no console noise polluting
  structured output). Smoke: stub `ui.setTheme` to throw; assert
  session_start resolves.
- **P29 (child-seat no-op)**: With `COUNCIL_SEAT=designer` set,
  session_start still fires for child seats but the activation is
  skipped (parent-mode-only). Child seats inherit the parent's
  theme via their own ui.theme, not via re-activation. The
  acceptance for child-seat context: "child sees parent's
  activated theme, not re-activates." Smoke: launch a child seat,
  inspect its `ui.theme` against the parent's pre-activation
  instance — should match (or be a deeper re-derivation, never a
  re-activation).
- **P18 (notify copy ↔ predicate coupling)**: The block-notify
  wording depends on what the block predicate is. If custom pairs
  block (this round-2 position), the notify must say "settings.json
  has 'nord-light/nord-dark'" — a custom pair. If custom pairs
  activate (owner's position), the notify would never fire for a
  pair, only for single concrete names like "gruvbox". The copy
  and the predicate must land together.
- **P19 (variant-pin notify explanation)**: When `.council.json`
  has `variant: "dark"` and the terminal is light, the
  activate-notify could include "(variant pinned in .council.json)"
  so the user understands why their light terminal got dark.
  Without the explanation, the user reads "pi-council-dark" and
  wonders if the activation is wrong.
- **P35 (theme watcher re-engagement)**: Spec §4: "`setThemeInstance`
  stops pi's theme file-watcher". After activation, the watcher
  is off. If pi's controller re-engages it later (e.g., on
  `/reload`, or some future hot-reload path), the council theme's
  instance may be replaced by a file-based theme. EV-3 is
  single-shot at session_start; the watcher is off after that.
  Acceptance for EV-3: "after session_start, pi's theme watcher is
  stopped, and EV-3 does not re-engage it." Watcher re-engagement
  is EV-4's job.
- **P36 (Theme instance lifetime across `session_shutdown`)**: The
  activated instance is on `globalThis[THEME_KEY]`. When pi's
  `session_shutdown` fires, the next `session_start` (if the
  process continues, e.g., /reload) re-creates the ThemeController,
  which calls `initTheme` again, which overwrites globalThis with
  the default theme. The council theme instance is GC'd. Smoke:
  launch session, activate, /reload, observe the council theme is
  gone (replaced by pi's default) — until session_start re-fires
  the activation.

## §7 — What I'm escalating to product-owner

- **Bound recommendation on the notify (dispute 3)**. If the
  product-owner disagrees with any notify at session_start (e.g.,
  wants zero user-facing output), the seat defers. Current
  recommendation: activate (info) + block (warning), silent noop,
  with copy that names the variant and the source of the block
  (per dispute 1's landing). Bound, not unbounded.
- **Acceptance-line correction (dispute 5)**. The card's draft
  acceptance is unsatisfiable under in-memory activation per spec
  §4. The corrected wording is in §5. This is a one-line
  card-text fix following EV-2's precedent (spec §8 outranks the
  card's draft wording). Owner can apply it without
  product-owner signoff; flagged here for visibility.

## §8 — Ground / unground tally

- **Grounded in spec/code**:
  - Dispute 1 lands on principal's (spec §4 row (b)/(d) reading).
  - Dispute 2 lands on principal's (visual continuity; spec §4
    `.name` prohibition does not cover variant accessor).
  - Dispute 3 lands on notify (Gulf of Evaluation argument;
    in-memory route makes notify load-bearing).
  - Dispute 4 lands on own R1 (tempfile; spec §4 "writes nothing
    to disk" context).
  - Dispute 5 corrected acceptance grounds in spec §4 "registers
    no name" + EV-2 one-word-fix precedent.
  - P22-P27, P28-P29, P30-P31, P33-P36 all grounded in pi's
    documented behavior (theme.js, settings-manager.js,
    theme-controller.js) or in the spec.
- **Taste / ungrounded**:
  - Notify copy wording ("council theme: pi-council-dark" vs
    "activated (pi-council-dark)" vs "→ pi-council-dark"). I
    prefer the tersest form. Copy decision for the implementation
    card.
  - Variant-pin notify explanation ("variant pinned in
    .council.json"). Useful but adds length; copy decision.
  - Whether to also `ctx.ui.setStatus("council-theme", ...)` for
    a persistent footer indicator. I lean against (status updates
    crowd out other extensions); stick with one-shot notify.
