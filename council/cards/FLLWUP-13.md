---
id: FLLWUP-13
title: No-match state names how to leave search mode
state: Backlog
owner: null
epic: EPIC-6
goal: When the model search query matches zero rows, the modal's no-match rendering includes a hint naming the key sequence that leaves search mode without clearing it, byte-distinct from the ruled no-match literal and both R-4 empty states, proven by driven render tests at the zero-match state.
---

## Intent

Filed from EV-27's delivery (principal's discoverability item): exiting
search mode is invisible at zero rows — the two-bit state machine routes
focus out on Down and ascend on a second Esc, but at zero rows the person
sees only "nothing matches" and has no visible affordance telling them the
list (and search) is recoverable without clearing. The ruled no-match copy
(`No models matching "<query>".`, EPIC-6 R-1) stays byte-exact; this card
adds a second line naming the focus-out key sequence. Surface is the
`/council-models` modal's model level, no-match state. The hint's exact copy is a Phase-1 ruling recorded
on this card face below.

## Phase 1 rulings (features-deliver, binding for this run)

- **R-1 (no-match exit hint copy)**: the no-match region renders a dim
  second line under the ruled `No models matching "<query>".` literal, with
  the byte-exact copy `↓ then esc exits search` — naming the real two-key
  walk (Down moves focus out of the input, Esc then ascends and search
  state dies with the level). The ruled footer stays byte-exact; the hint
  lives in the no-match region, never a fifth footer.

Recorded human decision — immutable for the run and binding on every seat,
`steward` included.

## Acceptance

- Driven tests: a zero-match query renders the ruled no-match literal
  unchanged plus the ruled hint line; both are byte-distinct from the two
  R-4 empty states.
- The footer remains the ruled model-level string (four-footer rule
  intact — the hint lives on the search row or no-match region, never a
  fifth footer).
- The hint's key names match the actual handler behavior (focus-out then
  ascend verified by driven key walks).
