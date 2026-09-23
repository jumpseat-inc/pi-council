---
id: FLLWUP-37
title: Inline progress transcript header: pin it under viewport overflow and clamp every returned line to the granted width
state: Backlog
owner: null
epic: EPIC-19
goal: With follow mode on and composed output exceeding the granted viewport, the inline progress transcript returns the header line (keymap + follow indicator) within the granted viewport without slicing the focused unit's marked head, except at the one-row floor; and with a long title every line render(width) returns, header included, fits within that width with the keys that change a rendered line truncated last — both proven by render assertions, with EV-36's one-row Acceptance reconciled.
---


## Intent

EV-35 scoped its header and marker assertions to fixtures where `maxTop ===
0` (the header already sits in row 0); its step-6 ruling (Q2) ruled that
EV-35 does not pin the header as row 0 and deferred the overflow case, where
follow mode sets `topLine = maxTop` (`extensions/navigator.ts:814-817`) so
the keymap line scrolls off and the marked head is sliced with the body.
The Skeptic verified both halves on the EV-35 branch (`closed-green`): with
30 blocks and `viewportRows = 10`, row 0 is a body line and the header
substring appears nowhere; a pinned header at `viewportRows = 1` returns
`[header]` only.

Q2 names two closure paths — EV-36 if EV-36 chooses to consume the overflow
case, or a new follow-up confirmed by `steward` — and EV-36's Acceptance
requires only that at one row the visible line identifies the active block,
so the overflowing-viewport case is owned by nothing today. This card
captures it so it does not evaporate.

The goal's one-row carve-out is not new scope: it defers to EV-36's binding
Acceptance bullet 2 and R-COPY's one-row mechanism, which a pinned header at
`viewportRows = 1` would otherwise contradict by returning `[header]` alone.
The allocation mechanism — how much body window the pin costs, how follow
reconciles with a focused head above the tail — is this card's own run's
design call.

---

### Absorbed: FLLWUP-38 — Clamp the inline progress transcript header to the granted render width

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

- Over a fixture whose composed output exceeds the granted viewport with
  follow mode on, `render(width)[0]` is the header line carrying the keymap
  and the follow indicator — except at the one-row floor (`viewportRows = 1`),
  where the single returned line identifies the active block instead.
- The focused unit's marked head line is present in the returned viewport at
  the head and bottom focus positions.
- The one-row case is reconciled with EV-36's Acceptance (at `termRows 7`
  the progress viewport is one row and must identify the active block) — the
  chosen allocation must not return `[header]` alone there.
- EV-7/EV-8/EV-9/EV-35 suites stay green; render output adds no literal
  color; the header pin does not break T11 inline-vs-standalone parity.

---

### From FLLWUP-38 — Clamp the inline progress transcript header to the granted render width

- With a long title and the ruled keymap copy, every line `render(width)`
  returns at that width fits within that width, the header line included,
  proven by width-aware render assertions over a long-title fixture.
- The keys that change a rendered line (`↑↓ move`, `e expand`,
  `t thinking`, `f follow`) are truncated last — never before the title or
  the `g/G`/`esc` copy.
- EV-7/EV-8/EV-9/EV-35 suites stay green; render output adds no literal
  color; T11 inline-vs-standalone parity holds.
