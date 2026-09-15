---
id: FLLWUP-38
title: Clamp the inline progress transcript header to the granted render width
state: Backlog
owner: null
epic: EPIC-8
goal: With a long title and the ruled keymap copy, every line the inline progress transcript returns at a given render width, the header line included, fits within that width, with the keys that change a rendered line truncated last, proven by width-aware render assertions over a long-title fixture.
---

## Intent

The header built in `TranscriptView.render` (`extensions/navigator.ts:803`)
concatenates `<title>` with the ruled keymap copy and is returned unclamped;
the tree rows and the progress separator are width-clamped by the caller
(`:429-430`) while the transcript's lines are not, so a title carrying a job
id, a seat, and `(orphaned)` plus R-KEYMAP's added ` · g/G jump` can exceed
the granted render width, where the terminal wraps or clips the line,
consuming rows the epic's viewport budget assumes are not consumed and
hiding the keymap tail on narrow terminals.

This is a defect of the epic's own granted-viewport contract, not a
preference. The truncation order (the designer's round-1 preference is the
title first, then `g/g`/`esc` copy, never the keys that change a rendered
line) is this card's own run's call.

Ruled against folding into `FLLWUP-37`: distinct defect, distinct falsifier
(a long title clips even on a non-overflowing transcript), and a fold would
let the width defect evaporate if EV-36 consumes the vertical case and
`FLLWUP-37` retires. If both are later promoted, they touch one header
expression and should land under one writer.

## Acceptance

- With a long title and the ruled keymap copy, every line `render(width)`
  returns at that width fits within that width, the header line included,
  proven by width-aware render assertions over a long-title fixture.
- The keys that change a rendered line (`↑↓ move`, `e expand`,
  `t thinking`, `f follow`) are truncated last — never before the title or
  the `g/G`/`esc` copy.
- EV-7/EV-8/EV-9/EV-35 suites stay green; render output adds no literal
  color; T11 inline-vs-standalone parity holds.

## Phase 1 ruling (features-deliver, EPIC-8)

Confirmed by `steward` under **R-FOLLOWUP** at step 13 of the EV-35 run
against merged SHA `85db7a689c8ab7df1fb87f3843d5465fd3d7d8e8` (PR #49) as a
**new follow-up, not a fold-in**. The truncation order is this card's own
run's call; the defect and its falsifier are distinct from `FLLWUP-37`'s.

The card stays `Backlog` as confirmed. `R-ORDER` is untouched and promotion
is a later, human-reachable call.
