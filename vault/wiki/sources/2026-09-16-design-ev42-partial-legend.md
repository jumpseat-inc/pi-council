---
title: Designer — EV-42 partial-legend first pass
type: source
summary: The designer's independent first pass on the usage-block partial legend — retire `final-attempt-only` from display, add one literal for the still-partial case, keep the `partial` key with new wording, migrate legacy records on read, and keep the grammar-identity constraint (no new rows/keys/ordering); names five open-judgment items without ruling them.
aliases: [design-ev42-partial-legend, ev42 partial legend design, partial legend design]
tags: [pi-council/source, pi-council/epic9]
sources: ["[[2026-09-16-design-ev42-partial-legend]]"]
created: 2026-09-20
updated: 2026-09-20
---

# EV-42 — designer first pass on the partial legend

Source: `vault/raw/2026-09-16-design-ev42-partial-legend.md`. The designer is
the generator here, not the reviewer.

## Position

- **Retire `final-attempt-only` from the block's display vocabulary** — after
  EV-42 the mode is gone by construction; the literal is audit history only.
- **Add one literal** for the still-partial case (proposed
  `attempt-unaccounted`; the PO ruling later chose the plural
  `attempts-unaccounted`).
- **Keep the legend key `partial`**, update the wording to
  `usage  partial = reported figure excludes unaccounted attempts`.
- **Migrate legacy records on read** — the on-disk literal stays, the block
  renders the new wording uniformly.
- **Predicate unchanged:** `input.provider?.partial !== undefined`.
- The `n/a = provider figure unavailable` legend stays; the two states are
  orthogonal (absent figure vs present-but-incomplete figure).
- The routed multiset aggregates across attempts under the existing ordering.

## Grammar-identity constraint

The block keeps its stable rows and stack order — reported row → partial
legend → `n/a` legend — with no new rows, keys, or ordering; only one literal
changes and the aggregate widens.

## Falsifiable predictions

Five string-equality predicates (8.1–8.5): whole retried dispatch renders no
partial legend and a cross-attempt multiset; still-partial renders the new
legend byte-exact with the reported row; legacy `final-attempt-only` migrates
on read; non-retried dispatch is byte-identical; the conditional predicate is
unchanged.

## Open items (named, not ruled)

Manifest per-attempt session-list shape; exact legend wording; whether to
retire the legacy literal on disk; the empty-multiset retried case; and the
worst-of/partial interaction.

## Related

- [[figure-scoped-disclosure]] — the shipped rule this first pass informed
- [[usage-block]] — the grammar the position preserves
- [[usage-store]], [[cost-provenance]] — the record and reason surfaces
- [[2026-09-17-po-ev42-step6-ruling]] — the ruling that resolved the open items
- [[2026-09-17-epic9-residual-run-ledger]] — the run this design belongs to

## Sources

- [[2026-09-16-design-ev42-partial-legend]]