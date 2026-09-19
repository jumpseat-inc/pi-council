---
title: PO ruling — EPIC-9 provider-error retry decomposition (wave 3)
type: source
summary: product-owner's wave-3 ruling on the EPIC-9 decomposition — pi already retries but its pattern misses the Intake's bare `Provider finish_reason: error`; EV-37/38/39/40/41/42 all demoted to Backlog with quantified-goal amendments, and a new EV-43 reachability falsifier added to gate EV-40.
aliases: [po-epic9-retry-ruling, epic9 retry ruling, provider-error retry decomposition]
tags: [pi-council/ruling, pi-council/epic9]
sources: ["[[2026-09-16-po-epic9-retry-ruling]]"]
created: 2026-09-20
updated: 2026-09-20
---

# Product-owner ruling — EPIC-9 provider-error retry decomposition

Source: `vault/raw/2026-09-16-po-epic9-retry-ruling.md`. The unconditional
wave-3 ruling over the EPIC-9 disagreement ledger.

## Framing

The Intake is a **parent-turn** provider error (`finish_reason=error` →
`stopReason=error` → `errorMessage="Provider finish_reason: error"`) that
dead-ended at `Continue`. Two binding facts: (1) pi already retries by default,
but its `RETRYABLE_PROVIDER_ERROR_PATTERN` does **not** match the Intake's bare
string, so pi's loop never fires for it; (2) council owns the seat path, not the
parent path. The epic therefore splits into two mechanism surfaces (EV-39 seat
dispatch, EV-40 parent turn), one classifier (EV-37), one config section
(EV-38), one E2E falsifier (EV-41), and one substrate fix (EV-42).

**FLLWUP-34 separation:** FLLWUP-34 is bounded retry for a failed usage-store
write — a different mechanism; EPIC-9 does not touch it.

## Child states — all demoted to Backlog, plus one new child

| Card | Ruling |
|---|---|
| EV-37 | **Backlog** — goal must enumerate ≥1 terminal case and the settled set |
| EV-38 | **Backlog** — goal must name the defaults table + invalid-value set; `Intent` picks concrete JSON in `council/scaffold/.council.json` |
| EV-39 | **Backlog** — `Intent` must say "this card does not address the Intake"; goal pins budget source, delay formula, attempts sentence |
| EV-40 | **Backlog** — `Intent` names input-bar text + per-branch observable; goal names exhausted-budget copy; re-ground the event to `agent_settled` |
| EV-41 | **Backlog** — goal must name both forcing paths (bare-string stub mode + parent-turn fail harness) |
| EV-42 | **Backlog** — goal must name the manifest field and the tree/usage copy |
| **EV-43** *(new)* | **Backlog, gates EV-40** — the reachability falsifier for parent-turn continuation |

## Key rulings

- **Skeptic 1/3/4 (closed-red):** EV-37's goal is stub-satisfiable; EV-38's
  defaults are not enumerable from the goal; EV-41's fixtures do not exist.
- **Skeptic 5/6/7 (open-untested):** EV-39/40/42 need quantified parameters.
- **Designer 1:** EV-40 must name what the input bar shows during backoff (the
  Intake's bare `Continue` is the only affordance).
- **Designer 2:** EV-39's `Intent` must disambiguate it from the Intake.
- **Designer 4:** the reachability claim is a new child (EV-43), not a fold-in —
  a "no" changes EV-40's surface.
- **Skeptic 2/8/9 (closed-green):** the colon-space bar holds; Backlog
  assignments are honest; the `state=done` + `stopReason=error` trap is real.

No escalations — the goal is not the defect; adding EV-43 is a slicing
refinement.

## Related

- [[retry-classification]] — EV-37, the pure predicate
- [[retry-policy]] — EV-38, the `.council.json` `retry` section
- [[parent-turn-continuation]] — EV-40, the parent-turn resume
- [[per-attempt-provenance]] — EV-42, the attempt substrate
- [[headless-pi]] — the `waitForIdle` pattern EV-40 mirrors
- [[smoke-test]] — "first Council command without an end-to-end falsifier is a defect"
- [[2026-09-16-epic9-run-ledger]] — the run that delivered it

## Sources

- [[2026-09-16-po-epic9-retry-ruling]]