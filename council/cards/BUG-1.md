---
id: BUG-1
title: Backspace deletion in the model search input and a first-use `/` filter hint
state: Backlog
owner: null
epic: EPIC-6
goal: Pressing backspace while the model search input in the `/council-models` modal is focused deletes the last character of the query and recomputes the filtered list, and before any `/` press the model-level view shows a visible hint that `/` filters models, proven by driven handleInput and render tests.
---

## Intent

Filed from a human bug report naming two defects on the `/council-models`
model picker, deliberately kept in one card.

**Backspace does not delete.** Since EV-27, `\x7f` is a guard-only no-op in
the search input (the settled convergence: `matchesKey(data, Key.backspace)`
guards before the printable decode, and Esc-clear is the sole deletion
mechanism), so a one-character typo costs clear-and-retype. This card gives
`\x7f` its ordinary meaning — delete the last query character and recompute
the filtered rows — under the same two-bit focus machine EV-27 shipped.

⚠ **Overlap resolved pre-run.** FLLWUP-12 (Ready) carried exactly this
backspace contract; per recorded human decision it was dropped before this
card's dispatch and its pins are folded into this card's acceptance.

**No indicator that `/` filters.** The only `/` affordance on screen lives
inside the search row itself (`▌ / filter · esc clears`), which renders only
after `/` is pressed — invisible before the first press. The model-level
footer (`↑/↓ move · enter select · esc back`) does not mention `/`, and
EV-27 explicitly ruled no `/ filter` addition to the ruled footers
(four-footer exhaustiveness), recording this discoverability gap as an
unauthorized follow-up. The hint's placement, copy, and dismissal are
Phase-1 rulings recorded on this card face below.

## Phase 1 rulings (features-deliver, binding for this run)

- **R-1 (pre-press hint placement)**: a first-render hint line below the
  model rows at the model level, rendered only while search has never been
  opened in the current modal-open. The line is not the search row, carries
  no `▌` (U+258C) focus signifier (which appears in no non-search state,
  per EV-27), and is not a footer — the ruled footer stays byte-exact.
- **R-2 (pre-press hint copy)**: the hint line renders the byte-exact
  literal `press / to filter models`.
- **R-3 (dismissal)**: the hint stops rendering at the first `/` press in
  the current modal-open and returns on the next fresh entry to the model
  level. No session-scoped persistence.

Recorded human decisions — immutable for the run and binding on every seat,
`steward` included.

## Acceptance

- Driven `handleInput` test — `\x7f` with a non-empty query and focus in the
  input deletes exactly one trailing character, the filtered list recomputes
  through `filterModelRows`, and focus stays in the input.
- `\x7f` on an empty query and `\x7f` while unfocused remain no-ops; other
  control bytes keep their existing behavior (the FLLWUP-12 pins, if folded
  here).
- Driven render test — the first model-level render of a fresh picker shows
  a visible hint naming `/` as the filter trigger, before any `/` press.
- The hint half's copy, placement, and dismissal semantics are the ruled
  literals in the Phase 1 rulings above (R-1 placement, R-2 copy,
  R-3 dismissal).
