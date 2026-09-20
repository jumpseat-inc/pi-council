---
title: 2026-09-21 PO EV-71 Step-6 Ruling
type: source
summary: product-owner (job-26) rules no `costBasis` field on the v2 call line (reported basis is structural; a named consumer is required for any field) and scopes "grammar unchanged" to row grammar and state exclusivity, permitting conditional legend rows in two whole-block states.
aliases: [po-ev71-step6-ruling, EV-71 costBasis ruling]
tags: [pi-council/source, pi-council/epic13, pi-council/product-owner]
sources: []
created: 2026-09-21
updated: 2026-09-21
---

# 2026-09-21 PO EV-71 Step-6 Ruling

product-owner ruling (job-26) on EPIC-13 card EV-71 (decisions-aware gate spend accounting).

## J1 — no `costBasis` field on the v2 call line

`gate-ledger.ts` is not touched; no `costBasis` key, no schema bump, no second cost field. The
reported basis is **structural** (the single writer stores the provider's `usage.cost` verbatim)
and is enforced by three assertions on one emitted line: **T-B** round-trip (`0.0042` in →
`0.0042` out), **T-C** no cost-bearing key other than `usage.cost`, **T-D** no catalogue-cost path
reachable from gate reconciliation. The goal sentence is amended to match.

The governing rule: **a field on the durable line needs a named consumer, not a named sentence.**
An unconditionally-emitted `costBasis: "reported"` literal cannot be wrong, so it cannot be
evidence; absence is silent, presence authoritative. A basis field becomes required only when a
*second cost source* reaches `usage.cost`, and then it must be written from the derivation site.

## J2 — "grammar unchanged" scopes to row grammar and state exclusivity, not line count

Pinned as a reading of R-6 (EPIC-7's "grammar identity, not line-count"), not an amendment. A
whole-block state may be followed by conditional **legend** rows (and only legend rows) when a
card's own acceptance makes that legend's presence an *iff*. Granted for `no usage recorded` and
`accounting boundary unresolved`; denied for `accounting failed` (chosen, because no persisted
record exists to render from). The block's first line stays the state line; precedence
`failed > unresolved > empty` unchanged; with zero gate calls the block is byte-identical.

## Related

- [[usage-block]] — the surface J2 scopes
- [[spend-record]] — the gate sibling and the exclusion surface
- [[cost-provenance]] — why provenance labels are set at the derivation site
- [[metered-deliberation-routing]] — the v2 call line
- [[product-owner]] — the ruling seat

## Sources

- `vault/raw/2026-09-21-po-ev71-step6-ruling.md`
- `council/cards/EV-71.md`