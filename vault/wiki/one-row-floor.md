---
title: One-Row Floor
type: concept
summary: The inline progress transcript at the tiniest viewport grant — at viewportRows=1 the line is the focused unit's composed head, the follow-mode effective index tracks the live tail read-only, and the U+258C marker is absent until a nav key flips follow off.
aliases: [one row floor, one-row case, viewportRows 1, effective index, R3]
tags: [pi-council/concept, pi-council/surface]
sources: ["[[2026-09-15-epic8-run-ledger]]", "[[2026-08-26-po-ev9-tiny-regime-floor]]"]
created: 2026-09-15
updated: 2026-09-15
---

# One-Row Floor

The smallest presentation of the `/council-tree` inline progress transcript:
a **one-row viewport grant** (reached at `termRows = 7`, the EV-9 tiny-regime
floor — `computeProgressLayout(7, ·).progressLines === 1`; see
[[2026-08-26-po-ev9-tiny-regime-floor]]). Before EPIC-8 the one visible row was
the tail of a wrapped body with no block identity. EV-36
(`transcript-one-row-floor-legibility`, commit `6b858c92`) made it legible.

## The projection rule (R3)

The one-row line is the **effective-indexed unit's composed head** (from
[[transcript-unit-rendering]]), computed **read-only**:

```
follow ? vis[vis.length − 1] : vis[fv]
```

`focused` is never written by the projection, and the signifier remains the
existing `vi === fv` expression (`isFocused`, `navigator.ts:709`). Consequence:

- **Under follow**, the operator watching a running seat sees the **live tail**
  — the latest unit's composed head — and a fresh follow-on floor with more than
  one visible unit carries **no `▌` marker** (the line is the live tail, not the
  cursor).
- **Pressing any navigation key** (`up`, `down`, `g`, `G`) already sets
  `follow = false`, so the marker reappears on the cursor's unit. The divergence
  lasts exactly until the operator signals they are no longer watching.
- **Under navigation**, the line is the focused unit's head and the marker and
  `e` coincide.

The markerless fresh-follow state is the card's **shipped comprehension rule**
(product-owner, job-17 Q1/Q3), not a waiver: *marker = cursor, no marker =
watching the live tail*. The designer opposed it but the alternative — R2,
writing `this.focused = vis.length − 1` in `render` — was foreclosed because
EV-35's Q5 anti-goal ("no render-time recompute / no cursor-stability work")
**reaches** the writeback (product-owner, job-17 Q2). That is a cross-card
ruling-reach fact: an earlier card's anti-goal can bind a later card's design.

## The frozen-grant defect (EV-36, in scope)

At the card's own `(9, 2)` layout transition the cached `TranscriptView` kept
`viewportRows = 2` and served a mid-body continuation while the outer
`slice(0, 1)` hid it (Skeptic O4 `closed-red`). The consolidator placed the
frozen-grant fix in scope for EV-36; it landed with the projection.

## Width, not height

A separate defect: the transcript head was never clamped to the render width —
a 60-char unpaired `toolResult` label rendered 69 cells in a 40-cell viewport,
wrapping to two physical rows the count half could not see (Skeptic O6
`closed-red`). EV-36 moved the clamp to the `unitLines` **single-head site**
(`navigator.ts:723`), idempotent with the toolCall head's existing truncation
(product-owner, job-17 Q4). The header-level width and follow-mode overflow
cases were ruled out of EV-36 and filed as [[one-row-floor|FLLWUP-37/FLLWUP-38]].

## Related

- [[council-job-tree-inline]] — the tree/progress region this floor belongs to
- [[transcript-unit-rendering]] — the composed head the one-row line shows
- [[honest-keymap]] — the nav keys that flip follow off and restore the marker
- [[two-bit-focus-machine]] — the focus-state machinery
- [[2026-08-26-po-ev9-tiny-regime-floor]] — the 7-row minimum and the ≤6 no-op

## Sources

- `vault/raw/2026-09-15-epic8-run-ledger.md`
- `council/cards/EV-36.md`
- `extensions/navigator.ts`, `extensions/focus-nav.ts`
- `test/ev36-one-row-floor.test.ts`