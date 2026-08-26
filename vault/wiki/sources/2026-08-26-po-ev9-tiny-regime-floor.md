---
title: EV-9 Product-Owner Ruling — tiny-regime viewport floor
type: source
summary: PO's binding EV-9 ruling: minimum supported terminal height for inline progress is 7 rows; below it Enter on a tree row is a consumed no-op (silent degrade) because progress ≥ 1 ∧ progress ≤ termRows−5 is unsatisfiable at ≤ 6 rows.
aliases: [po-ev9-tiny-regime-floor]
tags: [pi-council/source]
sources: ["[[2026-08-26-po-ev9-tiny-regime-floor]]"]
created: 2026-08-26
updated: 2026-08-26
---

The binding product-owner ruling that resolves EV-9's single open-judgment
item: what the inline progress viewport does at the degenerate terminal
height band `5 ≤ termRows ≤ 6`, where the settled two-regime formula's
invariants are **mathematically unsatisfiable** (`progress ≥ 1 ∧ progress ≤
avail = max(1, termRows − 5)` is UNSAT — Skeptic O1 closed-red at
`termRows=6`).

## Ruling — minimum supported height = 7; below it, Enter is a consumed no-op

**At `termRows ≤ 6`, Enter on a highlighted tree row is consumed as a no-op**:
`controller.surface` stays on `"tree"`, no progress viewport is allocated,
no separator renders, tree rows stay visible (`treeLines ≥ 1`), and Esc
still works. **Minimum supported terminal height for opening inline progress
is `7 rows`**; at ≥ 7 the existing two-regime formula runs as designed.

Implementation is one guard at the top of the controller's
`enterProgress(sid)` — `if (termRows < 7) return;` — plus three TDD tests
(no-op at 5/6, layout `(6,...)` never opens progress, `(7,...)` regression
unchanged). No new surface value, no new transition, no
chrome/separator/floor compression.

## Why option (a) silent over option (b)

1. The invariant `treeLines + 1 + progress ≤ termRows − CHROME ∧ progress ≥ 1
   ∧ treeLines ≥ 1` is settled across all three seats; compressing
   CHROME/SEPARATOR/TREE_FLOOR to make `progress ≥ 1` achievable breaks
   another binding constraint (Phase-1 "tree rows stay visible" moving thing
   TREE_FLOOR).
2. `progress` is integer rows; a "sub-1 progress band" is incoherent.
3. **Platform precedent:** `navigator.ts` already enforces
   `termRows = Math.max(10, ...)` for the modal viewer — an explicit
   refusal-to-render at degenerate heights; the inline widget (chrome 5 vs
   modal's 4) is more constrained. Same posture, not new doctrine.
4. At ≤ 6 rows the editor is already squeezed to 1–2 rows; a silent no-op
   preserves the tree (which still surfaces last-activity) and avoids
   clipping a half-rendered viewport.

The single-line "overflow indicator" variant was rejected: at `termRows=6`
`treeLines(≥1) + footer(1) = 2 > avail = 1`, so even that variant has no room.

## Out of scope but flagged (owner responsibility in the EV-9 spec)

The **upper-bound** invariant violation at `termRows ∈ {7..11}` (e.g.
`(8,5)→(1,2)` overflows `avail=3`) was NOT surfaced by the consolidator; the
owner must address it in the EV-9 spec write (tighten the tiny-regime formula
or formally clip), not by this ruling. The lower-bound fix at ≤ 6 stands alone.

## Related

- [[2026-08-26-design-ev9]], [[2026-08-26-design-ev9-round2]] — the designer
  positions the floor penetrates
- [[council-job-tree-inline]], [[run-transcripts]]
- [[product-owner]], [[skeptic]]

## Sources

- `vault/raw/2026-08-26-po-ev9-tiny-regime-floor.md`
