---
title: PO ruling — EPIC-6 /council-models search filter decomposition (wave 3)
type: source
summary: product-owner's wave-3 ruling on the EPIC-6 model-search decomposition — Esc from the search input clears its text (not dismiss/exit), the input renders below the top row, `qualifiedId`-only case-insensitive substring matching, `/` is typeable inside the input, the `▌` focus signifier, no-match copy routed to the Phase-1 gate, and FLLWUP-9/10/11 reassigned EPIC-5 → EPIC-6.
aliases: [po-epic6-ruling, epic6 ruling, model search filter decomposition]
tags: [pi-council/ruling, pi-council/epic6]
sources: ["[[2026-09-04-po-epic6-ruling]]"]
created: 2026-09-20
updated: 2026-09-20
---

# Product-owner ruling — EPIC-6 search-filter decomposition

Source: `vault/raw/2026-09-04-po-epic6-ruling.md`. The unconditional wave-3
ruling over D1–D10 for the `/`-triggered model-name search filter.

## Epic goal (binding)

The `/council-models` modal gains a `/`-triggered focused search input below
the top row that filters visible model rows by case-insensitive substring on
`qualifiedId` as the user types; Esc with focus in the search input clears its
text.

## Rulings

- **EPIC-1 (Esc):** clear-text-when-focused; the existing model-level Esc
  ascend is preserved. Not clear-and-dismiss or clear-and-exit.
- **A-1/A-2/A-3 (Child A):** match `qualifiedId` only (display `name` is not
  rendered); case-insensitive **substring** (not prefix); filter before the
  `:level` suffix; return the same `PickRow` references so
  `resolveSelection()` stays byte-verbatim. Child A `Ready`.
- **B-1 (Child B Esc):** clear-text-and-stay.
- **B-2 (placement):** render **below the top row** — preserves the byte-exact
  R-1 header and avoids a third render branch; the four-footer exhaustiveness
  rule still binds.
- **B-3 (signifier):** U+258C (`▌`) at column 0, per the EV-8 hard-rule
  precedent.
- **B-4 (`/` typeable):** yes — the trigger and query character are the same,
  handled by ordering.
- **B-5:** Child B `Ready`.
- **B-6 (no-match copy):** routed to the **Phase-1 ruling gate** (a ruled-copy
  decision), not this seat.
- **B-7 (auto-exit):** left to implementation with a floor (Enter clears search
  state and advances; Esc from confirm preserves the query).
- **S-1/S-2 (missing children):** rejected — no level-0/1 filter; FLLWUP-9 is
  not a fold-in.
- **M-1:** FLLWUP-9/10/11 flip `epic:` EPIC-5 → EPIC-6, content unchanged.
- **M-2:** the facilitator allocates the child ids at step 1 (EV-26/EV-27).

The session converged; the ruled draft (not the fallback) is canonical. Only
B-6 routes to the human at the step-3 gate.

## Related

- [[council-models-picker]] — the shipped surface and its ruled-copy set
- [[two-bit-focus-machine]] — the search-mode key handling
- [[echo-then-run]] — the selection pipeline preserved byte-verbatim
- [[council-theme]] — the token-only rule
- [[card-id-allocation]] — id allocation at fetched HEAD
- [[2026-09-05-epic6-run-ledger]] — the run that delivered it

## Sources

- [[2026-09-04-po-epic6-ruling]]