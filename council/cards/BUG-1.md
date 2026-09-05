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

⚠ **Overlap flagged for the human.** FLLWUP-12 (Ready) already carries
exactly this backspace contract, with a fully ruled acceptance. If BUG-1 is
approved as written, FLLWUP-12 is redundant — the human should decide
whether to drop it or narrow this card to the hint half only.

**No indicator that `/` filters.** The only `/` affordance on screen lives
inside the search row itself (`▌ / filter · esc clears`), which renders only
after `/` is pressed — invisible before the first press. The model-level
footer (`↑/↓ move · enter select · esc back`) does not mention `/`, and
EV-27 explicitly ruled no `/ filter` addition to the ruled footers
(four-footer exhaustiveness), recording this discoverability gap as an
unauthorized follow-up. Deliberation must settle what the card leaves open —
hint copy, placement (a first-render line vs. anywhere else the exhaustiveness
rule permits), and what "first time" means (per modal open, until the first
`/` press, or persistent).

## Acceptance

- Driven `handleInput` test — `\x7f` with a non-empty query and focus in the
  input deletes exactly one trailing character, the filtered list recomputes
  through `filterModelRows`, and focus stays in the input.
- `\x7f` on an empty query and `\x7f` while unfocused remain no-ops; other
  control bytes keep their existing behavior (the FLLWUP-12 pins, if folded
  here).
- Driven render test — the first model-level render of a fresh picker shows
  a visible hint naming `/` as the filter trigger, before any `/` press.
- The hint half's exact copy, placement, and dismissal semantics are
  deliberately unpinned (Backlog) — deliberation rules them.
