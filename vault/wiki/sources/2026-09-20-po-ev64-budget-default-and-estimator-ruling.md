---
title: 2026-09-20 PO EV-64 Budget Default and Estimator Ruling
type: source
summary: product-owner (job-9) rules `gateStateBudgetTokens` required on every gate-capable policy and permittingly absent only under off, and authorizes EV-64 to ship `ceil(utf8/3.5)` documented as an estimate with a self-settling ledger trigger, not a probe.
aliases: [po-ev64-budget-default-and-estimator-ruling, EV-64 budget ruling]
tags: [pi-council/source, pi-council/epic13, pi-council/product-owner]
sources: []
created: 2026-09-20
updated: 2026-09-21
---

# 2026-09-20 PO EV-64 Budget Default and Estimator Ruling

product-owner ruling (job-9) on EPIC-13 card EV-64 (budget-bounded gate-state packing).

## Q1 (O8) — `gateStateBudgetTokens` default semantics

**Required on every policy that can run the gate; permittingly absent only where it cannot
matter (resolved `mode` `off`).** The packaged `policy.json` ships the field explicitly at
`32000`. Three clauses: (1) present ⇒ validated unconditionally, in every mode (a bad value in
an off file still FAILs); (2) absent ⇒ legal only on the off path — `advisory`/`active` without
it FAILs, with copy that drops the template's "remove the key" advice (whole-file shadowing
means removing it leaves it absent, not packaged); (3) no second reachable budget constant —
the off-path value is derived from or test-pinned to the packaged one, so packing never sees an
undeclared budget.

Rejected: (a) fail loud unconditionally (strictness with no failure to prevent on `off`, per
[[gate-parity]]); (c) a silent code fallback (contradicts EV-62's "data, not code" and
"silently defaulted is untested"); packaged-explicit alone (does not itself answer O8). The
decisive measurement: no installed base — `council/scaffold/` has no `gate/` directory and
`loadGatePolicy` had no production caller yet.

## Q2 (O1 residual) — the estimator ships, unprobed

**Ship.** The estimator stays `ceil(utf8 byteLength / 3.5)`, documented as "an estimate, not
uniformly conservative", with direction and `o200k_base` provenance; the word "conservative"
must not survive as a claim (grep-falsifiable); nothing may claim the state fits the model's
real context window. The residual is reclassified from `open-untested` to **self-settling on
the ledger**, with a named trigger: *if any ledger line's provider-reported `input_tokens`
exceeds the estimator's count for the same bytes, the coefficient is a defect and gets its own
card.* The bespoke probe is ruled out (it would cost a network surface and be superseded by the
provider's own `usage.input_tokens`). Bounded because the section caps sum to ~19k against the
32k default, and [[metered-deliberation-routing]]'s fail-closed posture means under-estimating
routes to full deliberation, not a thin panel.

## Related

- [[metered-deliberation-routing]] — the packing budget and estimator
- [[gate-parity]] — the placement rule that decided Q1
- [[2026-09-20-po-ev65-step6-ruling]] — the sibling ruling that put `drops`/`usage` on the call line
- [[product-owner]] — the ruling seat

## Sources

- `vault/raw/2026-09-20-po-ev64-budget-default-and-estimator-ruling.md`
- `council/cards/EV-64.md`