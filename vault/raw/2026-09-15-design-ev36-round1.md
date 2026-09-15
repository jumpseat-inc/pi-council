# EV-36 — Designer round-1 position

> Card: `council/cards/EV-36.md` — Transcript legibility at the one-row
> progress floor. Phase 1 rulings applied: **R-COPY** (the one-row line
> reuses EV-34's composed head `→ <Tool>  <primary-arg>` for the focused
> block, with the trailing `muted "✗"` on failure; no parallel one-row
> surface — binding); **R-MARKER** (focus signifier is `TREE_ROW_MARKER`
> U+258C, no new glyph); **R-MODAL** (modal transcript out of scope).
> Inherited dependencies: **EV-34** (composed head, merged `7235178`) and
> **EV-35** (focus + keymap, merged `85db7a6`). This is the
> designer's independent first pass; no other seat's position has been
> read.

## Wiki grounding

- `vault/wiki/council-job-tree-inline.md` — the inline panel's region;
  termRows 7 is the EV-9 tiny-regime floor (`PO ev9-tiny-regime-floor`)
  where `computeProgressLayout(7,·).progressLines === 1` exactly.
- `vault/wiki/council-theme.md` — token-only drawing (AGENTS.md 9.6);
  marker uses `accent`; composed head uses `warning` (tool) and `muted`
  (✗ suffix), per the documented eight-token palette — no new tokens.
- `vault/wiki/index.md` — module map; no new pages.

## What I read in the code (the load-bearing artifact)

- `extensions/focus-nav.ts:103` — `computeProgressLayout`. The
  tiny-regime branch (`avail < 7`):
  ```
  avail = max(1, 7 − 5) = 2
  sepLines = avail >= 3 ? 1 : 0 → 0
  treeLines = max(1, min(11, treeContentLines, 2 − 0 − 1)) = 1
  progressLines = max(1, 2 − 0 − 1) = 1
  ```
  For termRows=7 the granted progress viewport is **exactly one row**.
  The same function at termRows=8 → `avail=3, sep=1, tree=1, prog=1`;
  termRows=9 → `avail=4, sep=1, tree=1, prog=2`; termRows=40 →
  normal-regime, `tree up to 11, sep=1, prog up to 23`. The four
  pinned layout vectors are 1, 1, 2, and 11 (when the tree takes its
  cap) — the count half is the layout function.
- `extensions/navigator.ts:425-432` — `CouncilTreeWidget.renderProgress`
  produces `[...tree, ...sep, ...view.render(width).slice(0, layout.progressLines)]`.
  The outer `slice(0, layout.progressLines)` is the count clamp that
  satisfies the acceptance bullet "never exceeds the granted viewport"
  — but it does **not** guarantee the *content* bullet, because the
  inner `view.render(width)` may already have eaten the focused unit's
  head (today's bug).
- `extensions/navigator.ts:813-817` — `TranscriptView.render`'s slice
  math: `topLine = follow ? maxTop : clamp(focusLine − 2, 0, maxTop)`
  and the return is `all.slice(topLine, topLine + viewportRows)`. With
  `viewportRows=1` and `follow=true` (default), `topLine = maxTop =
  all.length − 1`, slice returns the **last line of `all`** — which
  with an expanded focused unit is the **tail of a wrapped body**, the
  exact bug the card names. With `viewportRows=1` and `follow=false`,
  `topLine = focusLine − 2 = starts[fv] − 2` clamped — for an
  unexpanded focused unit whose head is the last line of `all`,
  `topLine = all.length − 1`, slice is the head. For an unexpanded
  focused unit whose head is **not** the last line, `topLine` clamps
  to `0` (the header), and slice is the header — not the head. For an
  expanded focused unit whose body extends past the head, the
  focused head line is at `starts[fv]`, the body lines follow it, and
  `topLine = starts[fv] − 2` clamped puts the slice on the header (if
  focused is early in `all`) or on a body line (if focused is late).
  The current slice math has no rule that says "at viewportRows=1 the
  visible line is the focused unit's head."
- `extensions/navigator.ts:700-734` — `unitLines`. The composed head
  is the head line of a `toolCall`-kind unit: `→ <label>  <primary-arg>`
  styled `warning`, optionally suffixed ` muted ✗` on
  `u.result?.isError === true`. The marker (`▌` styled `accent`) is
  prepended to the head line only when `isFocused` is true
  (`navigator.ts:705`), and R-COPY's composed shape is preserved
  byte-for-byte from EV-34 (merged `7235178`).
- `extensions/focus-nav.ts:38` — `TREE_ROW_MARKER = "\u258C"`, the
  same constant `TranscriptView.unitLines` reads (`navigator.ts:705`).
  Reused by construction: no new glyph is introduced (R-MARKER).
- `extensions/transcript.ts:firstArgOf` — the single derivation of
  `<primary-arg>`, consumed at `navigator.ts:710`. EV-34's
  O12-closed-green Skeptic objection confirmed the seam is the only
  derivation. No change to copy is permitted.
- `.pi/skills/minimalist-ui/SKILL.md` — for taste: warm monochrome,
  typographic contrast, no shadows, no gradients, kbd-as-physical-key
  for keystroke micro-UI. The one-row transcript is a "document-style"
  surface: a single line of text whose every visible column is
  load-bearing.

## Design position

The one-row line must be the focused unit's composed head with the
`▌` marker at column 0 and the `muted "✗"` failure suffix where
applicable — and **only that line**. Concretely:

1. At `viewportRows === 1`, the slice in `TranscriptView.render` is
   `all.slice(focusLine, focusLine + 1)`, where `focusLine =
   starts[fv]` is the absolute index of the focused unit's head
   line. `follow` is **not consulted** at this size — there is no
   body to follow, and the operator who opened progress on a one-row
   terminal is asking "what is this seat doing right now," not "what
   is the latest block in the transcript." `follow` remains
   meaningful at `viewportRows ≥ 2`.
2. At `viewportRows ≥ 2`, the existing math
   (`topLine = follow ? maxTop : clamp(focusLine − 2, 0, maxTop)`)
   is preserved unchanged. The "head or wrapped tail?" ambiguity the
   card names is a one-row defect, not a general one — the existing
   math on a 3-row viewport already shows the head plus the body
   prefix the user would want.
3. The count half is owned by `computeProgressLayout` (already
   guarantees `progressLines ≥ 1` at termRows ≥ 7) and by the
   factory's outer `slice(0, layout.progressLines)` in
   `renderProgress` (the count clamp). The card's acceptance bullet
   ("never exceeds the granted viewport") is satisfied at this
   slice; the new regression guard is a pure-seam assertion that
   `view.render(width).length ≤ viewportRows` for every pinned
   layout vector.
4. The empty state at one row with no transcript is the
   `EV-34 (waiting for output · idle)` line, rendered as-is. There is
   no composed head to show because there is no focused unit; the
   empty state itself is the active-block-absence signifier.
5. The keymap header is sliced out at one row — this is the honest
   consequence of `viewportRows=1` and **must not** be smuggled back
   in by pinning (the EV-35 round-2 D2 ruling explicitly deferred
   header-pinning as EV-36-relevant; the one-row case is the natural
   reason pinning fails). The keymap's discoverability at one row
   rests on the EV-9 divider row `▾ <seat> progress · esc back`,
   which already carries `esc back`; the rest of the keymap is
   silently lost at one row and recovered by widening the terminal.
   This gap is filed as a follow-up (see "what this card should NOT
   do" below).

## Gulf closed

**Evaluation gulf, at the moment of "which block am I on?" on a
one-row terminal.** Today the operator can see "the last line of a
wrapped body" — a string of text that names no tool, no arg, no
success/failure status, and no block identity. After EV-36: the
operator sees `▌ → <Tool>  <primary-arg>` (and ` ✗` on failure) and
answers the question without scrolling, expanding, or pressing a key.
This is a **comprehension** gulf, not execution — the operator does
not need to do anything to learn which block they are watching; the
answer is on the screen at the granted viewport's only row. The
gulf-narrowing is structural, not textual: a different `topLine`
formula, not a new string of copy.

**Evaluation gulf, at the moment of "did it fail?"** Same line, same
eye-fix: the `muted "✗"` suffix is a one-cell state indicator that
rides the composed head, the same place the failure status already
sits at width 80 in EV-34. No new copy, no new glyph, no new token —
R-COPY carries it.

**Secondary, execution gulf, at the moment of "I want to see the body
of this call."** The honest answer at one row is "you can't from
here — widen the terminal." The slip (press `e` repeatedly hoping
the body will appear) is silent at one row (the body is sliced out)
but harmless (the expand toggle is preserved, so widening later
shows it). This is a **forcing function** in Norman's sense: the
interface refuses to lie about what's visible. It costs the operator
one dead keypress at worst; it buys the operator the trust that the
line they see is honest.

## Principle and evidence

- **Knowledge in the world beats knowledge in the head.** A one-row
  transcript cannot afford the luxury of stating the keymap — every
  column is the answer to "what is going on right now." Putting the
  `▌`, the `→`, the tool name, the primary arg, and the `✗` into
  one line is the highest-information-per-column layout the
  constrained surface admits; everything else (keymap, body, scroll
  indicator) is knowledge the operator must already carry, and the
  honest contract at one row is "carry it." Apply by changing the
  slice anchor at `extensions/navigator.ts:813-817`.
- **Signifier, not affordance, for the focused block.** The `▌` on
  the head line is the same marker the tree rows use at
  `navigator.ts:415` (EV-8 row highlight) and the same constant the
  routing kernel uses at `focus-nav.ts:38`. Reuse by construction:
  the operator who learned `▌` on the tree sees the same `▌` on the
  transcript head. R-MARKER is binding; no new glyph.
- **Mapping: focused unit ↔ head line ↔ visible row at one line.**
  Three referents, one expression: `focused` (visible-index in
  `TranscriptView`), `starts[focused]` (the head line's index in
  `all`), and `all[starts[focused]]` (the actual line). At
  viewportRows=1 the slice is `[focusLine]` — the head. The mapping
  is honest because all three are computed in the same function
  pass; no off-screen state can drift between them. Apply at
  `extensions/navigator.ts:815-817`.
- **Forcing function against the "press `e` to see the body" slip.**
  At one row, `e` toggles `expanded` (preserved across the resize)
  but the body is sliced out. The honest visual feedback at one row
  is "nothing changed" — which is the truth: the body is not
  visible. The interface refuses to lie; the operator who wants the
  body widens the terminal. Apply by NOT adding a fake body preview
  or a "... more" suffix at one row — the slice is the slice.
- **Constraint: count is the layout function's contract.** The card
  names two halves. The count half is satisfied at
  `computeProgressLayout` (already in the merged code, `extensions/focus-nav.ts:103`):
  `progressLines ≥ 1` is a constructor invariant for termRows ≥ 7,
  and the factory's `slice(0, layout.progressLines)` at
  `navigator.ts:431` is the runtime clamp. No new clamp is needed —
  the regression guard is the assertion that this clamp holds.
  Apply at the test site, not the production code.
- **No new tokens, no literal color.** Composed head uses `warning`
  (`→ <Tool>`); `✗` uses `muted`; marker uses `accent` — all three
  tokens are on the documented palette in `vault/wiki/council-theme.md`
  §"Token-only drawing rule." Grep-audit per AGENTS.md 9.6 binding.
- **The minimal-ui disposition.** Warm monochrome, no shadows, the
  keystroke micro-UI is a `<kbd>` chrome not present here (terminal,
  not web) — but the editorial principle transfers: one column per
  load-bearing piece of state, no decoration. The `▌` is the left
  margin; the `→` is the verb glyph; the tool name is the noun; the
  primary arg is the predicate; the `✗` is the status. Five cells,
  five facts, no waste. Apply by trusting the existing
  `unitLines` head composition and not adding ornamental columns.

## Concrete shape (the contract the owner writes against)

```
// extensions/navigator.ts TranscriptView.render (after EV-36)

render(width: number): string[] {
  const t = this.theme;
  const vis = this.visible();
  if (vis.length === 0) this.focused = 0;
  else this.focused = Math.min(Math.max(this.focused, 0), vis.length - 1);
  const fv = this.focused;
  const all: string[] = [
    t.bold(
      `${this.title} — ↑↓ move · e expand · t thinking · f follow${this.follow ? "(on)" : ""} · g/G jump · esc back`,
    ),
  ];
  if (vis.length === 0) all.push(t.fg("dim", this.tail ? "  (waiting for output · idle)" : "  (no transcript)"));
  const starts: number[] = [];
  for (let vi = 0; vi < vis.length; vi++) {
    const { i, u } = vis[vi]!;
    starts.push(all.length);
    all.push(...this.unitLines(u, i, width, vi === fv));
  }
  const focusLine = starts[fv] ?? 0;
  const maxTop = Math.max(0, all.length - this.viewportRows);

  // EV-36: at viewportRows === 1, the visible line is the focused unit's
  // composed head — never the body tail, never the header. follow is
  // irrelevant at this size; the slice is anchored on focusLine.
  let topLine: number;
  if (this.viewportRows === 1) {
    topLine = Math.min(Math.max(focusLine, 0), maxTop);
  } else {
    if (this.follow) this.topLine = maxTop;
    topLine = Math.min(Math.max(0, focusLine - 2), maxTop);
  }

  return all.slice(topLine, topLine + this.viewportRows);
}
```

The single change to the slice math is the `viewportRows === 1`
branch. The rest of `render` is unchanged: header still in
position 0 of `all`, `unitLines` still produces head + body per
unit, `follow` still meaningful at `viewportRows ≥ 2`, the
factory's `slice(0, layout.progressLines)` still caps to the
granted viewport. The card's two halves (count, content) split
cleanly across two functions: `computeProgressLayout` owns the
count, `TranscriptView.render` owns the content anchor.

## Falsifiable predictions

I cannot see the running interface. Each claim is a hypothesis the
skeptic can run as a pure-seam test against the existing
`TranscriptView` class and `computeProgressLayout`. The card's
acceptance has two bullets — one per half — and each bullet
generates a small set of falsifiers.

### Rendering (pure-seam test against `TranscriptView` + `computeProgressLayout`)

- **P1.** At `viewportRows === 1` with a `toolCall`-kind focused
  unit (paired or unpaired, expanded or collapsed), `view.render(width)`
  returns **exactly one** line, and that line begins with `▌` (the
  marker), contains `→ <label>  <primary-arg>` (the composed head),
  and does NOT contain any 2-space-indented body line. Falsifier:
  fixture of two tool-call units (one paired with result, one
  unpaired); instantiate `TranscriptView` at `viewportRows=1`; assert
  `view.render(80).length === 1`, the line starts with `\u258C`, and
  `includes("→ bash")` (or whichever tool the fixture uses); assert
  no line of the result has a 2-space prefix within the slice.

- **P2.** At `viewportRows === 1`, follow-on does NOT move the slice
  to the body tail of an expanded focused unit. Falsifier: expand a
  focused unit (press `e`); `follow` defaults true; render; assert the
  slice is the head, NOT the body's last wrapped line. This is the
  bug the card names — the failing case today. Run on the current
  merged code to confirm it fails (RED); run on the EV-36
  implementation to confirm it passes (GREEN).

- **P3.** At `viewportRows === 1` with a failed focused unit
  (`u.result?.isError === true`), the slice ends with ` ✗` (U+2717
  with leading space), styled `muted`. Falsifier: paired tool-call
  fixture with `isError: true` on the result; render; assert the
  slice matches `/^.+\s✗$/` after the ANSI is stripped, and the
  `muted` token is emitted on the suffix cell.

- **P4.** At `viewportRows === 1` with a focused unit whose head is
  NOT the last line of `all` (e.g., the focused unit has a
  trailing unit after it), the slice is still the focused unit's
  head, not the trailing unit's head and not a body line. Falsifier:
  three-tool-call fixture; `G` to put focus on the last unit;
  assert the slice is the last unit's head; then `↑` to put focus
  on the middle unit; render; assert the slice is the middle
  unit's head. Repeat for each unit. Run on current merged code to
  confirm RED (today the slice is the trailing body tail in the
  first case); GREEN after EV-36.

- **P5.** At `viewportRows === 1` with an empty transcript (no
  blocks yet), the slice is the empty-state line
  `(waiting for output · idle)` — not the header, not blank, not
  null. Falsifier: fresh `TranscriptView` over an empty file;
  render; assert `view.render(80).length === 1`, the line equals
  the empty-state styled line; assert the line does NOT start with
  `\u258C` (no marker on empty).

- **P6.** At `viewportRows === 1` with a user/assistant/thinking
  focused unit, the slice is the focused unit's head — `user`,
  `assistant`, or `thinking` (with the marker prefix) — not a body
  line. Falsifier: mixed fixture; navigate focus to a user block;
  render; assert slice is `\u258C user` (styled) plus no body. Same
  for assistant and (with `t` toggle to show thinking) thinking.

- **P7.** Across `termRows ∈ {7, 8, 9, 40}`, the factory's
  `renderProgress` output line count equals
  `layout.treeLines + layout.sepLines + view.render(width).length`
  — i.e. the count half of the acceptance bullet. The
  `view.render(width).length ≤ viewportRows` (which equals
  `layout.progressLines` by construction) is the regression guard.
  Falsifier: instantiate `CouncilTreeWidget` against each pinned
  `termRows`; populate a tree + jsonl with N blocks; assert the
  factory's rendered line count is bounded by the layout sum and
  the view's slice is bounded by `viewportRows`.

- **P8.** At `termRows === 7`, the factory's progress output is
  exactly **one line** (per `computeProgressLayout(7,·).progressLines
  === 1`), and that line is the composed head of the focused unit
  per P1–P6. Falsifier: instantiate the factory at termRows=7 with
  a populated transcript; assert `render(80).filter(line =>
  treeLine(line)).length === 1` and the remaining line begins with
  `\u258C` (marker) and contains the composed head.

- **P9.** The factory's slice at `navigator.ts:431`
  (`view.render(width).slice(0, layout.progressLines)`) is the
  count-clamp site. Even if the view produces fewer lines than
  `layout.progressLines` (e.g., empty transcript → 1 line), the
  factory's output is the min of the two — never more, never less
  than 1 (the view is bounded below by the empty-state branch and
  `computeProgressLayout` is bounded below by 1).
  Falsifier: empty transcript at `termRows=7`; assert factory
  output is exactly 1 line (the empty state), not 0, not 2.

- **P10.** No new theme tokens; no literal ANSI; no hex.
  Grep-audit on `theme.(fg|bg|bold)("...")` call sites in
  `extensions/navigator.ts` returns only the eight documented
  tokens (`accent`, `border`, `customMessageBg`, `dim`, `success`,
  `warning`, `muted`, `bold`). Falsifier per
  `vault/wiki/council-theme.md` §"Token-only drawing rule" (a) and
  (b). EV-7/EV-8/EV-9 suites stay green per the Acceptance.

- **P11.** EV-8 / EV-9 / EV-34 suites stay green. The
  `TREE_ROW_MARKER` constant is reused verbatim at the new slice
  anchor (no new glyph). `firstArgOf` is unchanged (single
  derivation, EV-34 O12-closed-green). Falsifier:
  `test/ev34-tool-unit.test.ts`, `test/ev35-*.test.ts`,
  `test/ev9-progress.test.ts`, `test/ev8-focus-navigation.test.ts`,
  `test/theme-compliance.test.ts`, `test/navigator.test.ts` all
  green after the change; `bunx tsc --noEmit` clean.

### Comprehension (judgment — settles only on a human read)

- **C1.** A first-time operator who has just opened inline progress
  on a one-row terminal can answer, without reading docs: (i)
  **which seat am I watching?** — the highlighted tree row above;
  (ii) **which block of that seat's transcript am I on?** — the
  `▌` glyph at column 0; (iii) **what tool and argument?** — the
  `→ <Tool>  <primary-arg>` shape; (iv) **did it fail?** — the
  trailing `✗` if present. All four are on-screen at the one row.

- **C2.** The operator can tell at a glance that this row is NOT a
  body tail. The composed head is a **predictable, regular shape**:
  always starts with `▌ `, always has the `→`, always names a tool.
  A body tail would be a wall of wrapped text with none of those
  features; the operator's eye learns the shape in one read. This
  is the comprehension gulf the card names — "the tail of a wrapped
  body with no block identity" — closed.

- **C3.** Pressing `e` at one row produces no visible change — the
  body remains sliced out. The operator who expects to see the
  body is told by the slice that the terminal is the constraint,
  not the key. The honest contract is "expand toggles state; what
  is visible depends on the viewport." The operator who widens the
  terminal sees the body. This is a **forcing function** against
  the slip "press keys to see if anything happens" and is
  consistent with the EV-35 honest-keymap ruling.

- **C4.** The empty state at one row — `(waiting for output ·
  idle)` — is recognizable as "no blocks yet" rather than "the
  transcript is broken." A first-time operator who lands on a
  freshly-spawned seat's progress at one row sees the empty-state
  line and does not conclude "the system is hung." This is the
  EV-34 O7-closed-green honesty on the empty state, carried
  through.

## Concrete routing table (the owner's spec)

For `viewportRows === 1` (the new branch):

| `view` state | `view.render(width)` returns |
|---|---|
| empty transcript | `[empty-state]` (one line, no marker) |
| one unexpanded focused tool unit (paired or unpaired) | `[▌ → Tool  arg]` (or `[▌ → Tool  arg ✗]`) |
| one unexpanded focused user/assistant unit | `[▌ user]` / `[▌ assistant]` |
| one expanded focused unit (body present) | `[▌ head]` (body sliced out) |
| focused unit whose head is mid-transcript (others after it) | `[▌ head of focused unit]` (not the trailing unit's head, not body) |
| follow on, focused unit is the last unit | `[▌ head of last unit]` (not a body tail — the EV-36 fix) |
| follow on, focused unit is mid-transcript | `[▌ head of focused unit]` |

For `viewportRows ≥ 2` (unchanged): the existing
`topLine = follow ? maxTop : clamp(focusLine − 2, 0, maxTop)` math
applies; EV-35's owner round-1 prediction that the keymap scrolls
out at `follow` + overflow is acknowledged but is EV-35's
deferral, not EV-36's scope.

The boundary at `viewportRows === 1` is the only new behavior.
The factory's outer `slice(0, layout.progressLines)` already
guarantees the count half; the view's new `viewportRows === 1`
branch guarantees the content half. Two functions, two halves,
no overlap.

## Preferences, ranked last

These could not be grounded; they are taste.

- **Whether to show `→` or substitute at one row.** I prefer
  keeping `→` (the R-COPY glyph) at all widths — the operator who
  sees the keymap at width 80 sees the same glyph at one row.
  Equally defensible: drop the `→` at one row to make room for a
  tiny keystroke reminder. The trade-off is consistency vs.
  discoverability; consistency wins because the operator who lands
  on one row has almost certainly seen the wider keymap moments
  earlier.

- **Whether to prepend a "1/1" scroll indicator at one row.** I
  prefer no indicator — at one row there is no scroll; an indicator
  would suggest scrollability that doesn't exist. Equally
  defensible: a faint "(of N)" suffix to set expectations. The
  forcing-function argument stands: at one row, the operator's
  mental model is "I see what I see"; a scroll indicator would
  invite the wrong question.

- **Where the focus `▌` lives at one row with an expanded unit.**
  I prefer the marker on the head (the current behavior; the
  body lines have no marker per `unitLines:705`). Equally
  defensible: marker on the first visible line (which is the head,
  same outcome). No preference, just naming.

- **Whether the keymap header should be folded into the divider row
  above.** I prefer no — the divider row already carries `esc back`,
  and folding the full keymap into one row crowds the divider and
  duplicates work EV-9 already settled. Equally defensible: prepend
  the keymap to the divider row at narrow viewports. Filed as a
  follow-up, not in scope.

## What this card should NOT do (filed as follow-ups)

1. **DO NOT pin the keymap header as row 0 of the progress
   viewport.** EV-35 round-2 D2 ruled against pinning inside EV-35
   because it would contradict EV-36's acceptance ("at one row, the
   visible line identifies the active block"). EV-36's resolution
   is the converse: at one row the header is sliced out, and the
   keymap's discoverability rests on the EV-9 divider row +
   terminal width. A FLLWUP card "header visibility on
   viewport-overflow transcripts" (already on the backlog list at
   `FLLWUP-37` per EV-35 round-2 D2) is the home for header
   discoverability; EV-36 does not own it.

2. **DO NOT change `computeProgressLayout`'s contract.** It already
   pins `progressLines ≥ 1` at termRows ≥ 7. The card's count half
   is satisfied by the existing layout function plus the existing
   factory slice. The change set is the view's slice anchor, not
   the layout function.

3. **DO NOT introduce a parallel one-row surface (a separate
   renderer, a separate row budget, a separate widget).** R-COPY
   (Phase 1, binding) is explicit: the one-row line IS the
   composed head of the focused block. A parallel surface would
   be R-COPY-violating; a runner that hits the dispute applies
   R-COPY and cites it.

4. **DO NOT widen `DISPLAY_FLOOR` (the EV-9 tiny-regime floor at
   `extensions/focus-nav.ts:84`).** EV-36 inherits `termRows ≥ 7`
   and the one-row case it creates. Widening the floor is a
   different card (an EPIC-2 follow-up, not an EPIC-8 follow-up).

5. **DO NOT add a "current/visible" indicator at one row (e.g.,
   "block 3 of 7").** At one row, the `▌` + composed head IS the
   indicator. A second indicator would crowd one row with redundant
   information — Norman's "knowledge in the world beats knowledge
   in the head" cuts against this.

6. **DO NOT carry the EV-35 owner's round-1 prediction about
   header-pin into this card.** That prediction is recorded on
   EV-35's run record as EV-36-relevant, but the *resolution* is
   "header is sliced out at one row" (this card), not "header is
   pinned" (EV-35's owner round-1). Conflating the two would
   invert the card's acceptance.

7. **DO NOT add a "follow indicator" badge in the body at one
   row.** Follow is irrelevant at one row (the body is sliced out
   regardless); a follow badge would suggest scrollability that
   doesn't exist. The forcing function at one row is "the slice is
   the slice."

8. **DO NOT change the routing kernel in `extensions/focus-nav.ts`.**
   EV-36 is a render-time change inside `TranscriptView`. The
   `classifyProgressKey`/`routeEditorFocus` pair is settled by
   EV-35's Q1 ruling and D4 fold-in; EV-36 does not touch it.

9. **DO NOT add a separate fixture for the one-row case beyond
   what the existing `test/ev34-tool-unit.test.ts` and
   `test/ev35-*.test.ts` test surfaces already support.** The
   tests added are extensions of those suites (a new
   `test/ev36-one-row-floor.test.ts` is acceptable, but the
   assertions pin the existing fixtures' counts, not new ones).
   Naming a separate fixture is implementation noise.

10. **DO NOT couple `follow` to `viewportRows`.** The
    `viewportRows === 1` branch sets `topLine` from `focusLine`
    directly and never reads `follow`; `follow` retains its
    existing meaning at larger viewports. The honest contract at
    one row is "follow is meaningless, so we don't consult it."

## Files read for this position

- `vault/wiki/index.md`, `vault/wiki/council-job-tree-inline.md`,
  `vault/wiki/council-theme.md`
- `council/cards/EV-36.md`, `council/cards/EV-34.md`,
  `council/cards/EV-35.md`
- `vault/raw/2026-08-26-design-ev9.md`,
  `vault/raw/2026-08-26-design-ev9-round2.md`
- `extensions/focus-nav.ts` (computeProgressLayout,
  classifyProgressKey, TreeFocusState)
- `extensions/navigator.ts` (TranscriptView unitLines / render /
  handleInput; CouncilTreeWidget renderProgress / ensureView;
  openTranscript modal guard at line 57)
- `extensions/transcript.ts` (TranscriptBlock, firstArgOf,
  parseTranscript, TranscriptTail)
- `.pi/skills/minimalist-ui/SKILL.md` (taste guidance for a
  one-line editorial surface)

## Yield

This is the design seat's first-pass position on EV-36. The owner
is the implementing seat; principal is the cross-seam reviewer;
skeptic is the formal adversary. I have not edited application
code. I have written this `vault/raw/` document as evidence the
design argument is grounded in specific files and lines, not
taste. The 11 falsifiable rendering predictions (P1–P11) and the 4
comprehension checks (C1–C4) are the inputs the skeptic may run as
out-of-band render smokes after the owner implements; the 10
"what this card should NOT do" items are the follow-up candidates
the run record carries to the ruling seats.

The single load-bearing change is the `viewportRows === 1` branch
in `TranscriptView.render`: `topLine = clamp(focusLine, 0,
maxTop)` instead of `topLine = maxTop` (follow) or `clamp(focusLine
− 2, 0, maxTop)` (no-follow). Everything else — count clamp,
factory slice, layout function, marker reuse, token usage — is
unchanged. The card's two halves split across two functions and
do not need a third.