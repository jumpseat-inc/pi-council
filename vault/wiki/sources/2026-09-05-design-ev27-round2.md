---
title: Designer — EV-27 round 2 (two-bit search focus)
type: source
summary: The designer's round-2 position on EV-27's search input — the filter interposes at `currentRows()` (not the render tail), the state is two bits (`searchActive` × `inputFocused`) with Up/Down as the focus-out edge, the cache key is a superset, Enter at level 2 preserves the query, the kitty/modifyOtherKeys risk is real but the cited helper names are fabricated, and `/` is typeable inside the input.
aliases: [design-ev27-round2, ev27 round2, search focus design]
tags: [pi-council/source, pi-council/epic6]
sources: ["[[2026-09-05-design-ev27-round2]]"]
created: 2026-09-20
updated: 2026-09-20
---

# EV-27 round 2 — designer position

Source: `vault/raw/2026-09-05-design-ev27-round2.md`. Engages principal and
owner on the `/`-triggered search input's implementation shape.

## Positions

- **Filter seam:** principal's — interpose at `currentRows()`, not the render
  tail. `windowStart()`, the Up/Down clamps, `pushRows`, and `Enter` all read
  the same field; a render-tail filter leaves them on the unfiltered list
  (stale index, wrong window, cache never invalidated).
- **State:** principal's two-bit `(searchActive, inputFocused)`. One boolean
  cannot route Esc two ways; the card's "Esc elsewhere" implies the second bit.
- **Focus-out key:** **Up/Down set `inputFocused = false`** — without it the
  "Esc elsewhere" acceptance is vacuous.
- **Cache key:** a superset including `searchActive`, `inputFocused`, and the
  query (defensive against future focus-driven rendering).
- **Kitty/modifyOtherKeys:** the risk class is real (upstream changelog records
  the sibling bug), but the cited helper names (`decodeKittyPrintable`,
  `setKittyProtocolActive`, `components/editor.js:553`) are **not findable in
  the resolved package** — the implementation must resolve the actual export
  surface; the length-1 + `charCode ≥ 32` fallback covers legacy terminals.
- **Enter at level 2:** does **not** clear the query — "search state clears" is
  the level-3 visibility rule, not a `query = ""` mutation; the query is only
  cleared by Esc-when-focused or by ascending.
- **Trigger gate:** `/` opens only at level 2 with `group.models.length > 0`
  (R-4#2 stays keyless).
- **No-match:** a third render branch (`dim` copy + `FOOTER_MODEL`), distinct
  from R-4#1/R-4#2 by footer presence.

## Predictions

P1–P15: window math and `modelIndex` clamp on the filtered set; Down flips
focus without moving the cursor; typing re-enters focus; the cache key
includes the query byte-differentially; backout preserves the query; level 3
omits the search row; `/` is a no-op on an empty group; the no-match state is
byte-distinct; `anthropic/claude` is typeable; `resolveSelection()` and the
echo are identical across filtered/unfiltered paths.

## Escalations

The live-terminal `/`-routing is unverified by the repo's gates — the smoke
must extend to press `/`, type `claude`, observe the rows narrow, and press
Esc in a real terminal; the implementation must not cite the fabricated helper
names; and the no-match copy is the binding Phase-1 literal.

## Related

- [[two-bit-focus-machine]] — the shipped two-bit state machine this position produced
- [[council-models-picker]] — the modal and its ruled-copy set
- [[honest-keymap]] — the later key-matching bug class
- [[echo-then-run]] — the selection pipeline preserved
- [[2026-09-05-epic6-run-ledger]] — the run this design belongs to

## Sources

- [[2026-09-05-design-ev27-round2]]