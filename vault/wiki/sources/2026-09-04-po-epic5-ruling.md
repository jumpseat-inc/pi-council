---
title: PO ruling — EPIC-5 /council-models decomposition (wave 3)
type: source
summary: product-owner's wave-3 ruling on the EPIC-5 /council-models decomposition — D1–D9 (EV-23's foreign-ANSI settling test, EV-25's TUI wiring proof, EV-22's per-seat data contract, echo-then-run over two-Enter, EV-24's byte/SHA write contract, notify-only reload), plus the exact final card goals.
aliases: [po-epic5-ruling, epic5 ruling, council-models decomposition ruling]
tags: [pi-council/ruling, pi-council/epic5]
sources: ["[[2026-09-04-po-epic5-ruling]]"]
created: 2026-09-20
updated: 2026-09-20
---

# Product-owner ruling — EPIC-5 `/council-models` decomposition

Source: `vault/raw/2026-09-04-po-epic5-ruling.md`. The unconditional wave-3
ruling over the D1–D9 disagreement ledger for the `/council-models` epic (see
[[three-wave-decomposition]]).

## Rulings

- **D1 (EV-23 testability):** replace the goal's "no ANSI escape" phrasing with
  the shipped [[council-theme]] pattern — a source audit for foreign ANSI/literal
  hex **and** an output test asserting every color-bearing ANSI matches the
  theme's palette. The zero-ANSI phrasing is impossible against a correct modal.
- **D2 (EV-25 testability):** require **both** the headless handler-write path
  and a modal-picker-to-writer wiring test (modal mocked; EV-23 owns the modal,
  EV-25 owns the wiring).
- **D3 (epic settling test):** replace the "automated test that performs a pick"
  with an integration test feeding a programmatic selection through the resolver,
  the selection-encoding contract, and the merge-writer, asserting the
  `council.<seat>` entry plus a SHA-identical `theme` block. The end-to-end smoke
  mandate lives on EV-25.
- **D4 (EV-22 data contract):** accept — the resolver exposes per-seat
  `(name, hasOverride, currentModel, currentThinking)` and per-model supported
  thinking levels from `Model.thinkingLevelMap` (see [[council-config]]).
- **D5 (EV-23 affordances):** accept the copy/empty-states/markers; the confirm
  is **echo-then-run** (one keystroke), not two-Enter — see [[echo-then-run]].
- **D6 (EV-24 acceptance):** byte-assert the emitted `council.<seat>` shape;
  SHA-assert the `theme` block byte-identical. Failure surface:
  **validate-before-write → error message; filesystem failure → throws**.
- **D7 (EV-25 surface):** commit the headless usage-block format, the per-seat
  "current:" listing, and the verbatim post-write notify copy.
- **D8 (reload semantics):** **v1 ships notify-only** ("change takes effect at
  the next dispatch"); a mid-session reload is a follow-up, not a steward
  escalation.
- **D9 (state ratification):** EPIC-5 Backlog; EV-22/23/24 Ready; EV-25 Backlog
  with [[chain-promotion]].

## Documentary

`qualifiedOrThrow` is not exported (`seats.ts:265`); the wave-1 footnote is
inaccurate but no card text relied on it.

## Related

- [[council-models-picker]] — the shipped surface this decomposition produced
- [[council-config-writer]] — EV-24's merge-write contract (D6)
- [[two-bit-focus-machine]] — EV-23's key handling (D5 echo-then-run)
- [[council-config]] — the override precedence (D4/D8)
- [[procedures-vs-commands]] — why the surface is a TS command, not a procedure
- [[2026-09-04-epic5-run-ledger]] — the run that delivered it

## Sources

- [[2026-09-04-po-epic5-ruling]]