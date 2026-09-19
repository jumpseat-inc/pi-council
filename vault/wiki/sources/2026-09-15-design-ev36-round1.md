---
title: Designer — EV-36 one-row floor first pass
type: source
summary: The designer's first-pass position on EV-36 — at `viewportRows === 1` the visible line must be the focused unit's composed head (`▌ → <Tool>  <primary-arg>` + `✗` on failure), never a body tail or the header; the fix is one slice-anchor branch in `TranscriptView.render`, with the count half owned by `computeProgressLayout`.
aliases: [design-ev36-round1, ev36 round1, one-row floor design]
tags: [pi-council/source, pi-council/epic8]
sources: ["[[2026-09-15-design-ev36-round1]]"]
created: 2026-09-20
updated: 2026-09-20
---

# EV-36 — designer round-1 position

Source: `vault/raw/2026-09-15-design-ev36-round1.md`. Binding Phase-1 rulings
R-COPY (reuse EV-34's composed head), R-MARKER (`TREE_ROW_MARKER` U+258C), and
R-MODAL (modal out of scope) constrain the surface.

## Position

At `viewportRows === 1` the slice in `TranscriptView.render` must be
`all.slice(focusLine, focusLine + 1)` where `focusLine = starts[fv]` — the
focused unit's **composed head** with the `▌` marker and the `muted "✗"`
failure suffix. `follow` is **not consulted** at one row (there is no body to
follow); it remains meaningful at `viewportRows ≥ 2`, whose math is unchanged.
The count half is owned by `computeProgressLayout` (already guarantees
`progressLines ≥ 1` at `termRows ≥ 7`) plus the factory's outer
`slice(0, layout.progressLines)`.

The single load-bearing change is the `viewportRows === 1` branch:
`topLine = clamp(focusLine, 0, maxTop)` instead of `maxTop`/`clamp(focusLine −
2, …)`. Everything else — count clamp, factory slice, layout function, marker
reuse, token usage — is unchanged. See [[one-row-floor]].

## Gulf closed

The evaluation gulf at "which block am I on?" on a one-row terminal — today a
wrapped-body tail with no block identity; after EV-36 the `▌ → <Tool>  <arg>`
head (and ` ✗` on failure) answers it without a keypress. A secondary execution
gulf ("show me the body") is honestly refused at one row — widen the terminal.

## Predictions

- **Rendering (P1–P11):** exactly one line at `viewportRows=1`, marker-prefixed
  composed head; no body tail under `follow`; `✗` on failure; correct head for
  mid-transcript focus; empty-state line for an empty transcript; count bound
  across `termRows ∈ {7,8,9,40}`; token-only grep audit; EV-8/9/34 suites green.
- **Comprehension (C1–C4):** which seat, which block, what tool/arg, did it
  fail — all on the one row; the shape is recognizably not a body tail;
  `e` visibly does nothing; the empty state reads as "no blocks yet."

## Out of scope (filed as follow-ups)

Do not pin the keymap header (FLLWUP-37's home); do not change
`computeProgressLayout`; do not add a parallel one-row surface; do not widen
`DISPLAY_FLOOR`; do not add a current/visible indicator; do not couple `follow`
to `viewportRows`.

## Related

- [[one-row-floor]] — the shipped projection this position shaped
- [[transcript-unit-rendering]] — EV-34's composed head (R-COPY)
- [[council-job-tree-inline]] — the inline panel and its tiny-regime floor
- [[council-theme]] — the token-only rule
- [[2026-09-15-epic8-run-ledger]] — the run this design belongs to

## Sources

- [[2026-09-15-design-ev36-round1]]