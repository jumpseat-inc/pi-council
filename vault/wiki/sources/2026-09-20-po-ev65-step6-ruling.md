---
title: 2026-09-20 PO EV-65 Step-6 Ruling
type: source
summary: product-owner (job-12) rules the v2 call-line ledger bump (one call line carrying the call-time union, no outcome line from EV-65) and defers the `verify ≤ 0` loader guard to a follow-up card (FLLWUP-74), with an interim recomputability precondition.
aliases: [po-ev65-step6-ruling, EV-65 ledger ruling]
tags: [pi-council/source, pi-council/epic13, pi-council/product-owner]
sources: []
created: 2026-09-20
updated: 2026-09-21
---

# 2026-09-20 PO EV-65 Step-6 Ruling

product-owner ruling (job-12) on EPIC-13 card EV-65 (the gate's one-call transport), after the
3-round cap was hit.

## Q1 — adopt the v2 call-line bump

`GATE_LEDGER_SCHEMA_VERSION` 1 → 2; `appendGateCall` carries the **call-time union atomically in
one append**; EV-65 writes exactly one line per call and **no `kind: "outcome"` line** (the
outcome line stays for post-run facts, per EV-61). The v2 key set = the v1 set ⊎ `basis` ·
`model` · `provider` · `usage{input_tokens,output_tokens,cost}` · `generationId` · `failure{class}`
· `drops` · `advisory` · `unknownAnswerIds`, all optional-tolerant on read. Binding clauses: the
`basis` on the line is the converged composite and its verbatim reason occurs exactly once;
`drops` rides the call line (which makes the EV-64 estimator residual self-settling on the
ledger); the bump is additive and the reader stays tolerant (mixed v1/v2 reads identically for
re-derivation); no card may move a call-time fact to `record.outcome.*`.

Rejected: (a) declared-outcome with a byte-frozen v1 call line — it puts a goal deliverable
inside a crash window, makes the record non-self-describing, and spends EV-61's reserved
post-run surface; splitting the fields; deferring the bump to a later card. **This is the
source of the "a field on the durable line needs a named consumer" rule** (each v2 field has a
named consuming card).

## Q2 — the `verify ≤ 0` guard is a defect, but not EV-65's

A repo-local `decision.json` with `thresholds.verify = 0` makes `decide({})` return `Direct`
while a failed call hard-codes `Deliberate`, so offline re-derivation disagrees. The fix belongs
at `loadGateDecision` (one predicate: `verify > 0`, from which `direct > 0` follows), **not** in
`runGate` and not document-only. EV-65 implements no guard; its spec states the recomputability
precondition instead of advertising it unconditionally. Filed as the follow-up that became
`FLLWUP-74` (later folded into EV-73 in EPIC-14).

## Related

- [[metered-deliberation-routing]] — the ledger's v2 shape
- [[record-push-discipline]] — the adjacent durable-record discipline
- [[2026-09-20-po-ev64-budget-default-and-estimator-ruling]] — the estimator residual this makes self-settling
- [[product-owner]] — the ruling seat

## Sources

- `vault/raw/2026-09-20-po-ev65-step6-ruling.md`
- `council/cards/EV-65.md`