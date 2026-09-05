---
id: FLLWUP-15
title: Search-mode modal frame fits the terminal at full window height
state: Ready
owner: null
epic: EPIC-6
goal: With the search row visible at full window height the modal's frame renders without dropping its last line, achieved by shrinking the model window to `maxRows - 1` in search mode, proven by a driven render test at the tightest height asserting the frame's bottom border is present.
---

## Intent

Filed from EV-27's delivery (pre-existing tail-clip seam, made reachable
by the search row): `withModalFrame` wraps the rendered body in a frame,
and at full window height the extra search-row line pushes the frame's
bottom border past the terminal — a +1 line overrun in search mode. The
fix shape named during EV-27's deliberation is a search-mode window of
`maxRows - 1`, so the total render height is unchanged from the
non-search case while one fewer model row is visible. Surface is the
`/council-models` modal's model level at the tightest terminal heights.

## Acceptance

- A driven render test at the tightest height with search active asserts
  the frame's bottom border line is present in the output.
- The non-search rendering at every height is byte-identical to the
  pre-change suite (the window shrink applies only when the search row is
  visible).
- With search active at full height, exactly one fewer model row is
  visible than in the non-search case, and selection/clamping still
  reaches every filtered row by scrolling.
