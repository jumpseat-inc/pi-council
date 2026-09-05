---
id: FLLWUP-12
title: Backspace deletes one character in the model search input
state: Ready
owner: null
epic: EPIC-6
goal: Pressing backspace while the model search input in the `/council-models` modal is focused deletes the last character of the query and recomputes the filtered list, backspace on an empty query is a no-op, backspace while the input is not focused is ignored, and other control bytes keep leaving the query unchanged, proven by driven handleInput tests.
---

## Intent

Filed from EV-27's delivery (owner and designer flag): Esc-clear is today's
sole deletion affordance in the model search input — a one-character typo
costs clear-and-retype. The modal's key handler already receives `\x7f`
(backspace) as a control byte and deliberately ignores it (the EV-27
control-byte guard test pins that); this card gives `\x7f` meaning *only*
when the search input holds focus, per the two-bit state machine (search
active, input focused) EV-27 shipped. Deleting the last character must
recompute the filtered row set through the same `filterModelRows` path and
keep the input focused; `\r`, `\x1b[A`, and every other control byte keep
their existing behavior unchanged.

## Acceptance

- Driven tests: `\x7f` with a non-empty query and focus in the input
  deletes exactly one trailing character, the filtered list recomputes,
  and focus stays in the input.
- `\x7f` on an empty query changes nothing; `\x7f` with `inputFocused`
  false changes nothing (both pinned).
- `\r` and `\x1b[A` behavior is byte-identical to the pre-change suite
  (the existing control-byte guard tests still pass unchanged).
- Render cache invalidates on deletion (query is part of the signature).
