# EV-27 Round 2 — Designer position (engagement)

Engaging **principal** and **owner** on EV-27 (`/`-triggered search input
in the model selection modal). The card's Phase-1 rulings are binding
(EV-27 R-1 hint copy, EPIC-6 R-1 no-match copy); this round is about
whether the *implementation shape* the two generators propose is the
right one to carry those rulings, and where their first-pass
positions are right or wrong by the artifact.

## Where I land

| # | Question | Owner R1 | Principal R1 | **Designer R2** |
|---|---|---|---|---|
| 1 | Filter interposed at | `pushRows` (render tail) + `signature` query | `currentRows()` at level 2 (single source of truth) | **principal's** (`currentRows()` is the seam; `pushRows` cannot be the seam — see §1) |
| 2 | State shape | `searchActive: boolean` + `query: string` | `(searchActive, inputFocused)` two-bit state machine | **principal's** — one boolean cannot route Esc two ways (§2) |
| 3 | Focus-out key | implicit, not named | **Up/Down set `inputFocused=false`** | **principal's** — without this, "Esc elsewhere" is unreachable (§2.2) |
| 4 | Cache key | `${searchActive}${query}` | `:${searchActive}${inputFocused}:${query}` (superset) | **principal's** (§3) |
| 5 | `/` delivery (kitty / modifyOtherKeys) | `decodeKittyPrintable` recipe, `setKittyProtocolActive` flag | not addressed (out of seat) | **fabricated API specifics, real risk class — see §4** |
| 6 | Enter-at-level-2: clears search? | yes (`query=""`) per literal "search state clears" | **no** — preserve; "clears" = "not part of the level-3 confirm screen" | **principal's** — the literal reading violates the same Intent (§5) |
| 7 | Trigger gate `group.models.length > 0` | yes (so `/` never injects keys into R-4#2) | not addressed | **owner's** (§6) |
| 8 | No-match is a third branch, not R-4#2 | footer present; dim copy + `FOOTER_MODEL` | third branch, footer present, R-4#2 has no footer | **both agree** — this is settled (§7) |
| 9 | Control-byte guard | `decodeKittyPrintable(data) ?? (len===1 && charCode ≥ 32)` | not addressed | **owner's shape**, but the recipe is fabricated (§4) |
| 10 | Frame clip at small terminals | out of scope, pre-existing seam | not addressed | **owner's** — accept as out of scope (§8) |

The rest of this document engages each disagreement with the artifact.

---

## §1 — Where the filter actually lives

### Right by the artifact (endorse principal)

Principal is right that the filter must interpose at `currentRows()`,
not at the render tail. The existing code has exactly the three
consumers of the row list that principal names — and they all read
the same field:

- `currentRows()` at `extensions/model-picker.ts:142-148` (the
  canonical source)
- `windowStart()` at `:150-154` reads `currentRows().length`
- the Up/Down clamps at `:245` and `:252` both call
  `currentRows().length - 1`
- `pushRows` at `:184-206` reads `this.currentRows()` to get the
  rows it slices
- `Enter` at `:269` reads `this.currentRows()[this.modelIndex]` to
  pick

If the filter lives in `pushRows`, every other reader still sees the
unfiltered list. Three consequences that principal names and I
agree with:

1. `modelIndex` after a query narrows to 2 rows, on a list of 200,
   can point past the filtered set's end. The Up/Down clamps read
   the *unfiltered* length (200) and do not clamp. Pressing Enter on
   a filtered list with `modelIndex > filtered.length - 1` sets
   `picked = undefined` and `resolveSelection()` throws on
   `this.picked!` at `:267`.
2. `windowStart()` reads the *unfiltered* length and centers the
   window on `modelIndex` in unfiltered coordinates, so a query
   that narrows to 2 rows still gets a 10-row window starting at
   `modelIndex - 4` in unfiltered space — most of which is empty
   after the filter. The user sees a screen of empty `  ` rows with
   two real rows in the middle.
3. The signature at `:130` is currently `${level}:${seatIndex}:
   ${providerIndex}:${modelIndex}:${windowStart()}` — purely a
   function of unfiltered coordinates. Keystrokes that leave those
   five unchanged never invalidate the cache, even if they change
   the visible rows.

All three are real, observable failures. Both seats agree the fix
lives at `currentRows()` and the cache key needs the query. The
distinction is in *what else* belongs in the state and the cache key.

### Where the render-tail temptation comes from (and why I reject it)

Owner's render-tail framing reads naturally from inside the renderer
("the row source is `currentRows()`; the filter is a presentation
concern"). That is the same mistake EV-26's "display name matching"
counter-proposal would have been: making a thing visible-by-omission
(filtering rows inside the renderer) while the cursor and window math
read a different list. EV-26's contract was *reference-preserving*
precisely so this seam would land at the row source. The card's
"signature includes the query" clause is the cache-side view of the
same seam. They are one seam, and it lives at `currentRows()`.

### Falsifiable predictions

- **P1.** After typing `claude` (narrowing 200 rows to 3), `windowStart()`
  is computed against `currentRows().length === 3`, not 200; the window
  centers on the selected filtered row, not on its position in the
  unfiltered list. Pure-seam: `clamp(modelIndex, 0, filtered.length - 1)`
  post-filter. CDP smoke: render the modal at width=80 with this state
  and observe no `  ` blank rows except the legitimate windowing.
- **P2.** With `modelIndex = 5` (in unfiltered space) and a filter that
  narrows to 2 rows, `modelIndex` clamps to 1 before Enter resolves
  `picked`. Pure-seam: `handleInput` of `claude` with prior
  `modelIndex = 5` results in `modelIndex = 0` (or whatever the
  clamp yields), and `picked = currentRows()[modelIndex]` is a real
  `PickRow`.

---

## §2 — The state is two bits, not one

### Endorse principal

A single `searchActive` boolean cannot route Esc two ways. The
contract — "Esc with focus in the input clears; Esc elsewhere at
the model level ascends" — requires the handler to know which
surface owns the next Esc, and that is a separate bit from "is
search mode open at all." `searchActive=true, inputFocused=true`
is the "type into the input" state; `searchActive=true,
inputFocused=false` is the "type navigates the list" state.
These are observably different:

- In the first state, a printable appends to the query and the
  rows re-filter.
- In the second state, a printable reaches Up/Down's
  `matchesKey(data, Key.up)` check, doesn't match, and falls
  through — currently a silent no-op, which is the existing
  behavior and is fine.

Both seats agree on the two-bit shape. The disagreement is on
*which key transitions focus out of the input*, which the card
does not name.

### §2.1 — The unstated key: Up/Down set `inputFocused=false`

Principal names this and is right. Without an explicit focus-out
key, the "Esc elsewhere" acceptance is unreachable except
vacuously: a user types `claude`, sees two rows, presses Down to
highlight the second one, presses Esc — and where does Esc go?
With only `searchActive`, the handler has no way to distinguish
"Down was pressed, so list owns focus now" from "the user is
still typing."

The natural key is Up/Down, and for a reason the card does not
say out loud: at the moment the user is moving the cursor through
filtered rows, they are not typing. Their intent has shifted from
"narrow the list" to "pick one." Esc at that moment should
ascend, just as it does everywhere else on the model level.

Principal's claim that this is "the unstated key that makes the
'Esc elsewhere' acceptance reachable at all" is correct. Without
it, the acceptance is satisfied only in the case where the user
opens search, types, and immediately presses Esc without ever
moving the cursor — a vanishing slice of real use.

### §2.2 — What this changes for the handler

The handler at `extensions/model-picker.ts:241-265` gains one new
state-dependent switch. Up/Down now has two cases:

- `searchActive && inputFocused`: set `inputFocused = false`, then
  proceed with the existing clamp. The list cursor moves; future
  Up/Down do not flip `inputFocused` again (it stays `false`
  until something returns focus — typing in the input would, but
  typing currently can't happen because `inputFocused` is `false`
  and printable keys fall through).
- `!inputFocused`: existing clamp unchanged.

`/` toggles search mode and sets `inputFocused = true`. Printables
append and set `inputFocused = true` only when they happen with
`!searchActive || inputFocused` — i.e., they enter the input
whenever they reach the handler in a state where the input is
visible. (Edge case: if the user pressed Up to move focus to the
list, then types — current behavior is a silent no-op for
printables, which is consistent with the existing unsearched
fall-through. Keep that.)

Esc's two-way routing is then:

- `searchActive && inputFocused`: clear query, keep `searchActive`
  and `inputFocused = true`. (B-1 ruling.)
- `searchActive && !inputFocused`: ascend to level 1.
  `searchActive` clears because the level changed (mirrors the
  existing "entering a level resets its cursor"; per B-7 the
  prior query is *not* preserved across the level 2 → level 1
  transition — that is the only place search state actually
  resets, and it is correct).
- `!searchActive`: existing ascend unchanged.

### Falsifiable predictions

- **P3 (focus transition is real, not decorative).** Open `/`,
  type `claude` (narrows to 2 rows), press `Down` (highlights row
  2), press `Esc`. The modal is at level 1, the query text was
  *not* cleared (it was cleared as a side effect of the ascend,
  not by Esc), and no `No models matching…` text appears in the
  transition (because the level changed before any re-render
  with the cleared query). Pure-seam: `handleInput("Down")` then
  `handleInput(Esc)` yields `level === 1`, `searchActive === false`.
- **P4 (Down does not move cursor while `inputFocused`).** Open
  `/`, press `Down`. `modelIndex` is unchanged. Pure-seam
  assertion; falsifier is the current handler calling clamp
  regardless.
- **P5 (typing re-enters focus).** Open `/`, type `claude`,
  press `Down` (focus to list), type `x`. `query` is unchanged
  (`x` falls through as it would in unsearched mode). Press
  `Down` again, then `/` — search mode is still active
  (`searchActive === true`), `inputFocused === true`, `query`
  unchanged. (The `/` in `query` is captured by the ordering
  rule, but here `/` reopens / re-enters focus because search
  is already active.)

### §2.3 — One question for owner

Owner proposed the same shape minus the focus bit (`searchActive`
only, route Esc on `searchActive`). The collapse to one bit is the
question: does the card's acceptance *require* `Down` to move the
cursor while the input is visible, or does it require only that
"Esc elsewhere" works in some non-vacuous case? Reading the
acceptance line, "Esc at level 2 outside the input transitions to
level 1" — "outside the input" implies a state where focus is not
in the input, which is the two-bit shape. So the card itself
already implies the bit; principal is right that owner left it
implicit and the implementation must surface it.

---

## §3 — The cache key is a superset, not a query

### Endorse principal

Owner's `signature = … + ':' + searchActive + ':' + query` is
necessary but not sufficient. The reason is the empty-input
rendering: with `searchActive === true && query === ""`, the
search row renders `▌ / filter · esc clears` (the hint, per R-1).
A keystroke that adds the first character replaces the hint with
`▌ c` (the query text). The signature changes because `query`
changes. Good.

But principal is right that there is another dimension: the
search row's visibility depends on `searchActive`, and a focus
state might affect row rendering if (e.g.) we chose to dim the
list while focus is in the input. The card does not say to dim
the list, so `inputFocused` does not need to be in the signature
*for correctness today*. It needs to be in the signature
*defensively*, because the next time someone adds a focus-driven
visual change (a dimmed list, a different `▌` color, an animated
caret), the cache will silently serve a stale frame and the bug
will be at the integration seam, not the cache.

So: principal's `:${searchActive}${inputFocused}:${query}` is
correct as a *forward-looking* cache key. The cost is zero (two
boolean fields, string concat). The benefit is that no future
focus-driven rendering change can land without invalidating the
cache. Adopt.

### Falsifiable predictions

- **P6.** Type `claude`, render(80), type `d` to make it
  `clauded`. The two `render` outputs differ — but the *filtered
  set* is the same (clauded matches the same rows as claude plus
  one more), `modelIndex` is unchanged, `windowStart()` is
  unchanged. Without the query in the signature, the cache would
  serve the prior frame. With it, the cache invalidates. Pure-seam:
  `render(80)` byte-differs between the two states; cache key
  bytes are `…:claude` vs `…:clauded`.

  Actually — `clauded` is not in the card's acceptance; the
  minimal proof is the `claude` → `claud` pair (both narrow to
  the same rows; principal calls this out as test claim 2). I
  keep `claude` → `claud` as the falsifier because it is the
  cleaner case (filtered-set-identical, modelIndex-identical,
  query differs).
- **P7.** Open `/` then type `a` then `b` on a provider where
  both queries filter to equal-length, equal-window, equal-cursor
  sets. `render(80)` differs across the two keystrokes. The cache
  key includes the query byte-differentially.

---

## §4 — The kitty / modifyOtherKeys claim: real risk, fabricated API

### The risk is real

`pi-coding-agent/CHANGELOG.md:2735` records exactly this failure class
in a sibling surface: "Fixed model selector filter not accepting
typed characters in VS Code 1.110+ due to missing Kitty CSI-u
printable decoding in the `Input` component." A modal's typed-search
input on a terminal using the kitty keyboard protocol will receive
printables as CSI-u sequences (`\x1b[<code>u`), not as bare
characters. Without a decode step that converts CSI-u back to the
printable character, the user's keystrokes never append to the
query.

So the *class* of risk owner names — modern terminals encode
printables in kitty/modifyOtherKeys form — is grounded in
upstream's own bug history. The card is right to flag it.

### The specific API owner names is not in the repo

I checked:

- `grep -R "decodeKittyPrintable|setKittyProtocolActive|isKittyProtocolActive"
  extensions/` returns **zero matches**. The repo's source tree does
  not reference any of these names.
- `grep -R "decodePrintable|decodeModifyOtherKeys" extensions/` also
  returns **zero matches**.
- `find components/editor.js` under the resolved
  `@earendil-works/pi-coding-agent` package returns **no file**. The
  owner cited a source path that does not exist in the installed
  package.
- `grep "kitty|Kitty|KITTY" extensions/` returns **zero matches**.
- Searching the pi-coding-agent package's compiled bundle confirms
  the kitty/modifyOtherKeys *machinery exists* (`matchesKittySequence`,
  `matchesModifyOtherKeys`, `_kittyProtocolActive`, `MODIFIERS.alt`
  etc. all present in `dist/bundle/chunks/chunk-WZB2R5YO.js`), but the
  *specific function names* and *the specific export* the owner cites
  (`decodeKittyPrintable`, `setKittyProtocolActive`,
  `isKittyProtocolActive`, `decodeModifyOtherKeysPrintable`) are
  not surfaced as part of any documented export from this package.
  The owner is asserting file-level surface area I cannot verify
  from the artifact.

Per the doctrine ("You cannot see the running interface… Any claim
about rendered appearance, layout under a real viewport, z-order,
or WebGL compositing is a hypothesis you must label as one"):
the same principle applies to claiming that an exported helper
function exists at a specific path in a package that the seat
cannot resolve live. The claim is a hypothesis, not a fact.

### What the implementation must do (the honest shape)

The right shape is the one owner *describes*, not the one owner
*cites by name*:

1. **Treat any byte sequence whose terminal decode yields a
   printable character as a printable append.** The decode step is
   the responsibility of whoever owns the terminal input path; the
   modal handler receives the *decoded* character. If the project's
   input pipeline hands the modal a raw kitty/modifyOtherKeys
   sequence, that is a bug in the pipeline, not in the modal — but
   a robust modal still needs to recognize the printable when the
   pipeline has decoded it.

2. **The modal's printable rule:** `decode(data) ?? (data.length === 1
   && data.charCodeAt(0) >= 32 ? data : undefined)`. This is the
   shape owner proposes, and it is correct *as a fallback* even if
   `decode(data)` is undefined (the recipe collapses to the
   bare-byte check).

3. **Control-byte guard:** in search mode, `\x7f` (backspace), `\r`
   (carriage return), `\x1b[…` (escape sequences) must not append.
   Owner's length-1 + charCode ≥ 32 check drops pastes safely (a
   paste longer than one char is rejected) and drops control bytes
   (charCode < 32 is rejected). This is the correct minimal guard
   for the modal's responsibility.

### What this seat cannot verify and what the falsifier is

I cannot verify from the artifact that:

- The exact function name `decodeKittyPrintable` exists in the
  pi-tui / pi-coding-agent export surface.
- The exact function name `setKittyProtocolActive` exists.
- The exact line `components/editor.js:553` exists at that path.
- The implementation recipe minus `decodeModifyOtherKeysPrintable`
  is sufficient on xterm mode-2 terminals.

I can verify that:

- The compiled bundle has the matching *machinery* under different
  names.
- The changelog records the same bug class in a sibling surface.
- The fallback recipe (length-1 + charCode ≥ 32) covers the
  legacy-terminal case and any modern-terminal case where the
  pipeline has decoded the printable for us.

**The smoke that would settle this:** run `/council-models` in a
kitty-protocol terminal (Kitty, Ghostty, WezTerm, modern
VS Code), type `claude` in the search input, observe the rows
narrow. If the rows narrow, the pipeline decoded the printables
and the modal's fallback rule is sufficient. If not, the modal
itself must perform the decode step using whichever exported
helper actually exists in the resolved pi-coding-agent package
the runtime sees — and that helper's name is for the owner to
discover against the actual installed version, not for this
seat to assert against a package I cannot resolve live.

### Endorse owner's *gate*, qualify the *citation*

- **Endorse:** the printable rule must work on kitty/modifyOtherKeys
  terminals, and the control-byte guard must not be skipped.
- **Endorse:** Backspace is a silent no-op (the card pins Esc-clear
  as the sole deletion mechanism; FLLWUP for Backspace-as-delete).
- **Qualify:** the *specific* helper function names and line numbers
  owner cites are not verifiable against the artifact. The
  implementation must use whichever helper the resolved
  pi-coding-agent package actually exports — the owner must
  resolve that during implementation, not assert it in the
  deliberation.

---

## §5 — Enter at level 2 does not clear the query

### Endorse principal; reject owner's literal reading

The card's Intent says: "On Enter at the model level with the input
visible, search state clears and the picked row advances into the
confirm level; backing out of confirm (Esc at level 3) returns to the
model level with the prior search state preserved."

Two sentences. Both must be true. They cannot both be true if
"search state clears" means `query = ""`, because "prior search
state preserved" means the query string is still there when we
return to level 2.

The only coherent reading is principal's: "search state clears" is
the confirm-screen visibility rule — the search row is not part of
the level-3 confirm screen because level 3 draws its own branch —
not a mutation of the underlying query string. The query field is
never zeroed by Enter; it is only zeroed by:

- Esc with `inputFocused === true` (B-1).
- Ascending to level 1 (the level transition reset).

This means the implementation is simpler, not more complex: the
search state fields (`searchActive`, `inputFocused`, `query`) are
preserved through Enter at level 2, the level transitions to 3
normally, the confirm screen draws its own branch (no search row
in level 3), and on Esc at level 3 the level transitions back to 2
and the search row reappears with the prior query.

### Why the literal reading is wrong

Owner writes "Enter at level 2 does *not* drop the query" — and
immediately afterward says the B-7 floor's literal "search state
clears" is the "momentary confirm view." That is the same reading
principal and I share; owner just labels it "the momentary confirm
view" and then describes a literal `query = ""` assignment at
Enter that contradicts it.

If `query = ""` on Enter, the backout at level 3 returns to a
model-level view with `query === ""`, no `▌ / filter · esc clears`
hint, no filtered rows, and a fully re-shown unfiltered list. The
user, who narrowed to 2 rows, sees 200 rows again and concludes the
filter "forgot" their query. That is the design debt a one-line
literal reading introduces.

### Falsifiable predictions

- **P8.** Type `claude` (2-row match), press `Enter`. The modal
  advances to level 3 with the picked row's `qualifiedId` in the
  echo. Press `Esc` at level 3. The modal returns to level 2;
  the search row is visible; the query text is `claude`; the
  filtered rows are the same 2; `modelIndex` still points at
  the same row (or has been re-clamped if the prior filter set
  changed during the level 3 visit — it cannot, because the
  filter input is unchanged).
- **P9.** The level-3 confirm screen does NOT render the search
  row. Render(80) at level 3 contains exactly `[HEADER,
  echoFor(sel), dim write line, FOOTER_CONFIRM]` — no `▌`-row.

---

## §6 — Trigger gate on `group.models.length > 0` (endorse owner)

The gate "open `/` only when there is at least one model to
filter" is right. R-4#2 is a deliberately keyless state
(`EMPTY_NO_MODELS(group.displayName)` and no footer); injecting
search-mode keys into it would add active affordances to a
state that was designed to have none. A user who lands on R-4#2
should see one dim line and one key (Esc back). Pressing `/`
should do nothing — not because we silently drop it, but because
the trigger predicate excludes the state.

The same gate probably applies to R-4#1 (no providers
configured), but R-4#1 is at level 1, not level 2; `/` at level
1 is not a trigger at all (the card says `/` opens search at the
model level only). So the gate is correctly level-2-and-models-non-
empty.

### Falsifiable prediction

- **P10.** On a `ProviderGroup` with `models.length === 0`, the
  rendered lines are exactly `[HEADER, dim(EMPTY_NO_MODELS(name))]`
  (R-4#2's ruled contract). Pressing `/` at this state produces
  no visible change and does not enter search mode. Pure-seam:
  `handleInput("/")` at level 2 with empty models leaves
  `searchActive === false`, `cached.lines` byte-equal to the
  pre-input cached lines.

---

## §7 — No-match is a third render branch (endorse both)

Owner's "dim copy + `FOOTER_MODEL`" and principal's "footer
present, R-4#2 has no footer" land in the same place. The
discriminator the card acceptance wants is the footer present
vs absent. R-4#2 (`:182-188`) renders no footer at all; the
no-match state renders `FOOTER_MODEL`. The footer presence is
the byte-level distinction the test pins.

The no-match branch lives in the existing level-2 else-branch
that calls `pushRows` at `extensions/model-picker.ts:181`. The
new branch is `else if (currentRows().length === 0)` *after*
the filter is applied at `currentRows()`. The render order:

1. HEADER (always)
2. search row if `searchActive === true`
3. (existing R-4#2 check, unchanged)
4. (new) if `searchActive && currentRows().length === 0`:
   `dim(No models matching "<query>.")` + `FOOTER_MODEL`
5. else: existing `pushRows` (which itself emits `FOOTER_MODEL`)

The footer is `FOOTER_MODEL` in branches 4 and 5; the absence of
rows distinguishes them by whether `pushRows` ran.

### Falsifiable prediction

- **P11.** With `query = "zqzzzz"`, `currentRows().length === 0`.
  `render(80)` is `[HEADER, "▌ zqzzzz", "No models matching
  \"zqzzzz\".", "↑/↓ move · enter select · esc back"]` (the last
  line is `FOOTER_MODEL` byte-exact). The string
  `No models matching "zqzzzz".` is byte-distinct from
  `EMPTY_NO_PROVIDERS` and `EMPTY_NO_MODELS(name)` — assertable
  via string inequality.
- **P12.** `render(80)` with `query = ""` and a non-empty filtered
  set does NOT contain `No models matching`. Assertable.

---

## §8 — Frame clip at small terminals (accept out of scope)

Owner's note: in search mode, the search row is rendered between
HEADER and the first data row, adding one line. At small
terminal heights, `maxRows`-windowed output plus the withModalFrame
tail clip can eat the footer one line sooner. This is a
pre-existing seam (`withModalFrame`'s tail-clip behavior is
untouched by EV-27) and a single line of additional content
cannot fix the underlying budget issue. Out of scope for EV-27.
Flag for follow-up only if a real user reports it; do not preempt
with a redesign.

---

## §9 — What this seat is escalating

### §9.1 — Live-terminal routing of `/` to a focused overlay is unverified

Owner names this honestly: "Live-terminal routing of `/` to a
focused overlay is unverified by the repo's gates; unit tests prove
the state machine given bytes; the falsifier for the delivery
path is a manual `/council-models` run." This is correct and I
endorse it. EV-27's tests pin the state machine; the smoke is
out-of-band. Per `vault/wiki/smoke-test.md`, "the first Council
command without an end-to-end falsifier is a defect" — EV-27 is
not a command, but the modal it modifies is opened by a command
(`/council-models`), so the modal surface is on the smoke path of
its parent. The smoke already runs `/council-models` (the EV-25
smoke mandate from EPIC-5 ruling); EV-27 should extend the smoke
to press `/`, type `claude`, observe the rows narrow, and press
Esc, all in a real terminal. Owner must add this to the EV-25
smoke path before EV-27 merges, or call out the gap explicitly.

### §9.2 — Helper function names in the deliverable

The implementation must NOT cite `decodeKittyPrintable`,
`setKittyProtocolActive`, `isKittyProtocolActive`, or
`components/editor.js:553` as if they exist in the resolved
pi-coding-agent package — the package's resolved exports are
not visible from this seat, and the names owner cited are not
findable in the package's `dist/`. The implementation must
resolve the actual export surface against the package version
the runtime sees (per `extensions/index.ts` imports) and use
whichever helper is actually exported. If no helper is
exported, the fallback recipe (length-1 + charCode ≥ 32) is
sufficient for legacy terminals and for any modern terminal
whose input pipeline decodes printables before reaching the
modal — and the smoke on a kitty-protocol terminal is the
final arbiter.

### §9.3 — Phase-1 ruling B-6 is binding

The no-match copy is the ruled literal
`No models matching "<query>".` per EPIC-6 R-1. No further
copy iteration. Owner must not propose a copy change in this
seat's hearing.

---

## §10 — What the implementation looks like, summarized

(For owner. This is the minimum I am asking for; the rest is
implementation detail.)

- Add `private searchActive = false; private inputFocused = false;
  private query = "";` to `ModelPicker`.
- Replace `currentRows()` at level 2 to return
  `searchActive ? filterModelRows(rowsForProvider(group), query) :
  rowsForProvider(group)`. (Reference identity preserved by
  EV-26.)
- `modelIndex` is clamped into the filtered set after every
  mutation that can shrink it (`handleInput` of a printable
  that appended, `handleInput` of Esc that cleared, `Enter` at
  level 1 → 2 transition already does this).
- `signature()` becomes `${level}:${seatIndex}:${providerIndex}:
  ${modelIndex}:${windowStart()}:${searchActive}${inputFocused}:
  ${query}`.
- `handleInput` reordering for level 2, in this order:
  1. (existing settled, existing level 3) — unchanged.
  2. `Key.up` / `Key.down`: if `searchActive && inputFocused`,
     set `inputFocused = false`; then existing clamp (the
     cursor move). If `searchActive && !inputFocused`, existing
     clamp only.
  3. `Key.enter`: existing model-level Enter — pick the row,
     advance to level 3. Do NOT mutate `query` / `searchActive`.
  4. `Key.escape`: route on `searchActive && inputFocused` →
     clear `query`, keep `inputFocused`. Otherwise if
     `searchActive` (and `!inputFocused`) → ascend to level 1,
     reset search state. Otherwise existing ascend.
  5. Printable decode (the gate, the decode, the control-byte
     guard, per §4): if `searchActive && inputFocused`, append
     the decoded printable to `query` and invalidate cache. Else
     silent no-op (current behavior).
  6. `/` trigger: if level 2, `!searchActive`, and
     `group.models.length > 0` — open search mode
     (`searchActive = true; inputFocused = true; query = ""`),
     invalidate cache. If level 2 and `searchActive` already,
     the printable handler above appends `/` to the query (per
     B-4 — capture by ordering).
- Render at level 2:
  1. HEADER
  2. if `searchActive`: search row
     `"\u258C " + (query || "/ filter · esc clears")`,
     right-truncated so the `▌` is never clipped.
  3. existing R-4#2 check
  4. else if `searchActive && currentRows().length === 0`:
     `dim("No models matching \"" + query + "\".")`
  5. else: existing `pushRows` (which emits `FOOTER_MODEL`)
  6. `FOOTER_MODEL` is the last line in branches 4 and 5.

---

## §11 — Falsifiable predictions (consolidated)

(Restating the full list, ranked by consequence.)

1. **P1.** Window math operates on the filtered set, not the
   unfiltered one. (Filter interposed at `currentRows()`, not at
   render tail.)
2. **P2.** `modelIndex` clamps into the filtered set after every
   mutation that can shrink it. No `picked = undefined` from Enter
   on a stale index.
3. **P3.** Open `/`, type `claude` (2-row match), press `Down`,
   press `Esc` → level 1; `searchActive === false`. The focus
   transition (`inputFocused: true → false` on Down) is the
   unstated key that makes the "Esc elsewhere" acceptance
   non-vacuous.
4. **P4.** Down with `inputFocused === true` does NOT move
   `modelIndex`. (The state is one bit; Down flips the bit, then
   proceeds with the clamp, but in the focused state the clamp is
   a no-op because `inputFocused` already flipped. Net: Down
   moves `modelIndex` only in the unfocused state.)
5. **P5.** Typing re-enters focus. Press Down (focus to list),
   type `x` — `query` unchanged (silent no-op, current
   unsearched-mode behavior).
6. **P6 / P7.** Cache key includes the query byte-differentially.
   `claude` → `claud` invalidates the cache even though filtered
   set, `modelIndex`, `windowStart()` are all unchanged.
7. **P8.** Backout preservation: type `claude` → Enter → Esc at
   level 3 returns to level 2 with `query === "claude"`, the same
   2 rows, and `modelIndex` valid.
8. **P9.** Level 3 confirm screen renders without the search row.
9. **P10.** `/` in an empty-models group is a no-op (no search
   row appears, R-4#2 is unchanged).
10. **P11 / P12.** No-match state is a third branch:
    `[HEADER, "▌ zqzzzz", "No models matching \"zqzzzz\".",
    "↑/↓ move · enter select · esc back"]`. Byte-distinct from
    R-4#1 and R-4#2.
11. **P13.** `anthropic/claude` (slash-containing query) is
    typeable: `handleInput("a","n","t","h","r","o","p","i","c",
    "/","c","l","a","u","d","e")` results in
    `query === "anthropic/claude"`, `searchActive === true`,
    `inputFocused === true`, and the filtered set is the rows
    matching that substring.
12. **P14.** `resolveSelection()` after Down+Enter on a filtered
    row emits the same tuple as the unfiltered path. (EV-26
    identity preservation makes this true by construction; the
    test pins it.)
13. **P15.** Confirm echo is byte-equal between filtered and
    unfiltered paths. (Same source: `echoFor(sel)` from
    `resolveSelection()`.)

---

## §12 — Preferences, ranked last

- The `▌` + hint idiom (per R-1) is right; I would not have
  asked for it any other way.
- Two-bit state over one bit is the right shape; one bit would
  have shipped a vacuously-satisfied "Esc elsewhere" acceptance
  and a real user-visible bug.
- The smoke on a real kitty-protocol terminal is the right
  falsifier for the printable-routing claim. Unit tests pin the
  state machine; the smoke proves the pipeline delivers
  printables to it.
- Backspace-as-delete is a FLLWUP candidate, not an EV-27
  requirement. The card pins Esc-clear as the sole deletion
  mechanism; I would not have argued for Backspace here even
  if taste allowed it (one more key with one more behavior is
  a worse card, not a better one).
