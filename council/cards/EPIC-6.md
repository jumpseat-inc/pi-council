---
id: EPIC-6
title: /council-models model-name search filter in the model selection modal
state: Done
owner: null
epic: null
goal: The `/council-models` model selection modal gains a `/`-triggered focused search input below the top row that filters the visible model rows by case-insensitive substring on `qualifiedId` as the user types, and pressing Esc with focus in the search input clears its text.
---

## Intent

The human's intake: there are so many models to choose from when using a
provider like OpenRouter for the `/council-models` command — a `/` pressed
in the model selection modal should open a search input (at or below the
top row, cursor focused) that filters model names as the user types, and
Esc from the search input removes the search input text.

Ruled surface contract: the input renders below the top row (the R-1
header stays byte-exact), focus is signified by a `▌` (U+258C) cell at
column 0 of the search-input row, `/` is typeable inside the input
(captured by construction — `qualifiedId` values contain `/`), the filter
matches case-insensitive substring on `qualifiedId` only, and Esc with
focus in the input clears its text while Esc elsewhere at the model level
ascends to the provider level unchanged. The four-footer exhaustiveness
rule stays intact — the search row carries its own affordance hint and is
never a fifth footer. A query matching no rows renders a distinct no-match
empty state; its copy is a Phase-1 ruling recorded on this card.

The human also directed that every EPIC-5 follow-up not yet worked on
(Backlog or Ready) reassigns to this epic: FLLWUP-9, FLLWUP-10, and
FLLWUP-11 move here with content unchanged.

Children: EV-26 (pure model-name filter over the thinking-level
cross-product), EV-27 (`/`-triggered search input in the model selection
modal), FLLWUP-9, FLLWUP-10, FLLWUP-11 (reassigned from EPIC-5).

## Acceptance

- `/` at the model level of the modal opens the focused search input;
  typing narrows the visible rows to `qualifiedId` case-insensitive
  substring matches; the rendered frame changes on every keystroke (no
  stale cache).
- Selecting a filtered row emits the byte-verbatim `qualifiedId` plus
  thinking level through the unchanged `resolveSelection()`/confirm-echo
  pipeline.
- Esc in the input clears its text; Esc elsewhere at the model level
  ascends to the provider level, unchanged from EPIC-5 behavior.
- A no-match query renders the ruled no-match empty state.
- `bun test`, `bunx tsc --noEmit`, and `python3 council/validate.py` stay
  green.

## Phase 1 rulings (features-deliver, binding for this run)

- **R-1 (no-match copy)**: when the search query matches zero models, the
  modal renders the empty state `No models matching "<query>".` —
  byte-exact ruled literal, interpolated with the live query, distinct
  from the two R-4 empty states.

Recorded human decision — immutable for the run and binding on every seat,
`steward` included.
