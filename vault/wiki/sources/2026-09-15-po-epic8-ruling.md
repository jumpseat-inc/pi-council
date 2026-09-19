---
title: PO ruling — EPIC-8 transcript-rendering decomposition (wave 3)
type: source
summary: product-owner's wave-3 ruling on the EPIC-8 decomposition — the data-fidelity child (EV-33) demoted to Backlog pending a single-accessor assertion and an out-of-order pairing fixture; EV-34/35/36 ratified with token/mechanism amendments; the modal path declared out of scope as dead code.
aliases: [po-epic8-ruling, epic8 ruling, transcript rendering decomposition ruling]
tags: [pi-council/ruling, pi-council/epic8]
sources: ["[[2026-09-15-po-epic8-ruling]]"]
created: 2026-09-20
updated: 2026-09-20
---

# Product-owner ruling — EPIC-8 transcript-rendering decomposition

Source: `vault/raw/2026-09-15-po-epic8-ruling.md`. The unconditional wave-3
ruling over D1–D10 for the EPIC-8 "elegant transcript rendering" epic.

## Framing

The intake is a rendering-taste request, but the blocker is upstream:
`parseTranscript` (`extensions/transcript.ts:30-80`) preserves neither
`toolCallId` nor `isError`, so the data layer must land before rendering taste
can be delivered. Binding EPIC-2 rulings constrain the surface: editor-driven
focus (no `setFocus`), the `DISPLAY_FLOOR = 7` tiny-regime floor, the
`TREE_ROW_MARKER` (U+258C) signifier, and the [[council-theme]] token-only rule.

## Child states

- **EV-33 (`transcript-block-fidelity`) — Backlog** (demoted): the goal body is
  not falsifiable as written. Needs (D1) a single-accessor assertion in the goal
  body and (D2) an out-of-order pairing fixture. Promotion is automatic once
  transcribed ([[chain-promotion]]).
- **EV-34 (`tool-call-unit-rendering`) — Ready** with Intent amendments (D4/D10)
  and a legacy-blocks proof fixture (D3).
- **EV-35 (`transcript-interaction-model`) — Ready** with the D5 goal tightening
  ("every key has well-defined behavior") and D6 Intent amendments (advertise
  `g`/`G`).
- **EV-36 (`transcript-one-row-floor-legibility`) — Ready** with D7 (drop the
  false "twenty-three rows" parenthetical) and D9 (head + status-suffix
  mechanism).

## Key rulings

- **D1:** the goal must assert the single primary-argument derivation
  (`firstArgOf`-shaped) consumed by both the tree row and the new transcript
  header.
- **D2:** the demo fixture must exercise out-of-order results so positional
  pairing fails.
- **D4:** failure token is `muted "✗"` (`warning` is already the `toolCall`
  color); the modal path is dead code behind `navigator.ts:57` and out of scope.
- **D7:** the true max `progressLines` is 31, not 23 — drop the parenthetical.
- **D10:** inline empty-state copy folds into EV-34; `g`/`G` advertised.

No escalations — the child-1 goal is imprecise, not a goal-defect.

## Related

- [[transcript-unit-rendering]] — EV-34's composed tool-call unit
- [[honest-keymap]] — EV-35's keymap honesty
- [[one-row-floor]] — EV-36's one-row projection
- [[council-job-tree-inline]] — the inline progress surface (the modal is superseded)
- [[two-bit-focus-machine]], [[council-theme]] — the inherited interaction/token rules
- [[2026-09-15-epic8-run-ledger]] — the run that delivered it

## Sources

- [[2026-09-15-po-epic8-ruling]]