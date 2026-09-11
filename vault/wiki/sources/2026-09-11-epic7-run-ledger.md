---
title: EPIC-7 Run Ledger
type: source
summary: The features-new + features-deliver run that shipped honest token/cost usage accounting (EV-28/30/31/32/29) — every child escalated, the provider has no per-component dollar source, the stalled runner re-learned the window invariant, and EPIC-7 closed Done at v0.18.0.
aliases: [epic7 run, 2026-09-11-epic7-run-ledger, epic7 ledger, usage accounting run]
tags: [pi-council/run-ledger, pi-council/epic7]
sources: ["[[2026-09-11-epic7-run-ledger]]"]
created: 2026-09-11
updated: 2026-09-11
provenance: run-ledger
source_path: vault/raw/2026-09-11-epic7-run-ledger.md
source_commit: 042a0c8
captured: 2026-09-11
---

# EPIC-7 Run Ledger (2026-09-10 → 2026-09-11)

The `/features-new` decomposition and `/features-deliver EPIC-7` autonomous run
that shipped the **honest token/cost usage accounting** subsystem. Five
children, five gated merges (PRs #42–#46), 587 → 668 tests, the epic card
closed `Done` (second epic-card closure). Unlike EPIC-6's zero-escalation
close, **every child escalated** (7 ruling dispatches) because the feature's
premise collided with the provider's real data granularity.

## What the run delivered

- **The full usage tuple** ([[usage-accounting]]): the hub's four-field record
  widened to the flat tuple with `costBasis`/`usageSource` provenance labels.
- **The invocation-scoped spend record** ([[spend-record]]): two halves —
  `ownSession` (session enumeration) + `subtree` (stream projection) — each
  with its own single-valued basis, plus the R-4 boundary label.
- **The durable usage store** ([[usage-store]]): `getAgentDir()/council/usage/`,
  one record per invocation, schema v2 with the provider sibling, surviving
  `pruneRuns`; the council's answer to the human's `~/.pi-council` proposal.
- **The usage block** ([[usage-block]]): a deterministic handler at five
  autonomous exits, three whole-block states, and the steward-ruled opt-in
  `boundaryMode: "marker"`.
- **Provider-reported cost** ([[cost-provenance]]): generation-level dollars +
  a BYOK-only two-component split + native token counts — and the finding that
  pi never reads a provider charge and the catalogue was *not* stale.

## The central finding

The intake asked whether pi's 2–5x inflation and optimistic cache were stale
catalogue rates. The run proved otherwise: pi computes `cost` from the static
catalogue, and a spot-check found pi's runtime rates **matched OpenRouter's
live default listed prices exactly** for every model used. The divergence is
**upstream-routing** — OpenRouter can route to a provider whose actual charge
differs — and there is **no per-component dollar source** at all (only
generation-level dollars and a BYOK-only two-way split), so `(reported)` means
"what the provider reported", never "what you were billed".

## The escalation pattern (the run's defining shape)

- **Every card escalated**; the plan-phase copy literals settled nothing about
  *placement, trigger, multiplicity, or durable carrier* — the
  discovered-mechanism class.
- **The card's own goal was the defect** (EV-29) — the strongest
  goal-as-defect escalation recorded; [[steward]] amended the wording.
- Two escalations crossed to [[steward]] (the EV-32 eval-boundary mechanism and
  the EV-29 goal), proving the two-seat [[product-owner]] → [[steward]] chain
  under autonomy.
- Each ruling resolved in one facts-only round.

## Incidents

A package root deleted mid-session degraded every child `pi` to a vanilla agent
with no hub tools (EV-28 HALTed correctly; repaired by a global local-path
`pi install`); EV-31's runner was anti-stall-killed because its 30-min window
was below the 45-min owner ceiling (**recurrence #3** of the stall invariant);
the preflight branch-freshness artifact recurred every card (FLLWUP-27); one
union merge; and the run could not render its own usage block (pre-merge code).

## Related

- [[usage-accounting]], [[spend-record]], [[usage-store]], [[usage-block]],
  [[cost-provenance]] — the subsystem this run shipped
- [[council-runner]], [[hub-job-supervision]], [[deterministic-merge-check]],
  [[chain-promotion]], [[preflight]], [[eval-store-contract]],
  [[engineering-board]] — the process pages it sharpened
- [[2026-09-06-epic6-close-run-ledger]] — the preceding autonomous close run

## Sources

- [[2026-09-11-epic7-run-ledger]] (raw)
