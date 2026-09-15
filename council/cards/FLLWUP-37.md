---
id: FLLWUP-37
title: Keep the progress keymap header visible when follow-mode content overflows the viewport
state: Backlog
owner: null
epic: EPIC-8
goal: With follow mode on and composed output exceeding the granted viewport, the inline progress transcript returns the header line (the ruled keymap and the follow indicator) within the granted viewport and does not slice the focused unit's marked head out of the body window, except at the one-row floor where the single line identifies the active block, proven by handleInput-driven render assertions over a fixture that overflows the granted viewport.
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

## Phase 1 ruling (features-deliver, EPIC-8)

Confirmed by `steward` under **R-FOLLOWUP** at step 13 of the EV-35 run
against merged SHA `85db7a689c8ab7df1fb87f3843d5465fd3d7d8e8` (PR #49) as a
**new follow-up, not a fold-in**, citing the EV-35 Q2 ruling. Acceptance
bullet 1 carries the same one-row carve-out as the goal so bullets 1 and 3
cannot contradict each other.

The card stays `Backlog` as confirmed. `R-ORDER` (EV-33 → EV-34 → EV-35 →
EV-36) is a recorded human decision and is untouched; promotion is a later,
human-reachable call. A `Backlog` card retires for free if EV-36 consumes
the case.
