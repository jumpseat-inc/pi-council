---
title: Execution Mode Recording
type: concept
summary: The card's execution mode is recorded on the ROOT dispatch manifest by the orchestrator, but the runner re-derives its path from the ledger fallback — so a recorded mode stricter than the runner executes produces the merge check's missing-goal-evaluation HALT; `readCardMode` upgrades to Deliberate on any generator seat, making a recorded `Direct` the robust default.
aliases: [execution mode, mode recording, ROOT mode, readCardMode, mode authority]
tags: [pi-council/concept, pi-council/features-deliver, pi-council/epic13]
sources: ["[[2026-09-23-epic15-residual-run-ledger]]", "[[2026-09-21-epic13-run-ledger]]", "[[2026-09-22-epic10-run-ledger]]", "[[2026-09-22-epic15-run-ledger]]"]
created: 2026-09-23
updated: 2026-09-23
---

# Execution Mode Recording

A `/features-deliver` card runs in one of three execution modes —
**Deliberate** (steps 2–14), **Verify** (one owner + skeptic + judge), or
**Direct** (owner only) ([[metered-deliberation-routing]]). The
[[deterministic-merge-check]] is keyed to the mode, so *which* mode the run
records is load-bearing.

## Where the mode comes from

- `council_dispatch`'s `mode` parameter is written to the dispatched job's
  **ROOT manifest** (`extensions/hub.ts`; EV-68). Only the orchestrator sets it —
  a runner cannot rewrite its own ROOT manifest.
- `council_route op:"authority"` (run id + runner ROOT id) reads it back from the
  run substrate via `readCardMode` (`extensions/gate-route.ts`), the merge
  check's **mechanical input** — never a seat's report.
- The **runner**, however, derives its own path: `council.md` step 1 calls
  `council_route op:"route"`; when that returns a *fallback* (no recorded
  decision for the current packed state) **the runner's own step-1 judgment
  governs**. The ROOT `mode` it was dispatched with does not control execution.

## `readCardMode`'s resolution rules

Over the union of the named ROOTs' subtrees:

- **Deliberate** iff the subtree contains **≥1 generator seat**
  (`principal`/`designer`/`consolidator`). This is deliberately *not* a panel
  set-difference — `product-owner` is dual-role (a Deliberate panel seat and the
  Verify escalation seat), so a difference-based derivation would misclassify an
  escalated Verify card.
- Otherwise the **strongest ROOT `mode`** stands (multiple ROOTs fail toward the
  stronger mode).
- Absent mode ⇒ the merge check HALTs (never a reduced fallback).

## The mismatch and the HALT

Because the ROOT `mode` and the runner's judgment are independent, they can
disagree. In the [[2026-09-23-epic15-residual-run-ledger|EPIC-15 residual run]] the
orchestrator recorded **`Verify`** for FLLWUP-111 while the runner judged and ran
**`Direct`** (owner-only — no judge). The merge check read the substrate, got
`Verify`, and issued the pinned line:

> `HALT: FLLWUP-111 — mode Verify requires a goal evaluation and none is recorded`

A recorded mode **stricter than the runner executes** is exactly this failure
shape: it demands evidence the run never produced. The repair was to produce the
missing evidence at the recorded mode (dispatch the missing `skeptic`/`judge`)
rather than to merge on the runner's report.

## The robust default: record `Direct`

Recording `Direct` is self-correcting, because `readCardMode` upgrades to
`Deliberate` the moment a generator seat appears:

| Recorded | Runner executes | Resolved mode | Outcome |
|---|---|---|---|
| Direct | owner-only | Direct | criteria 1/2/5 — fine |
| Direct | Verify (owner+skeptic+judge) | Direct | criteria 1/2/5 — fine (evidence exists, unused) |
| Direct | full council (generators) | **Deliberate** | criteria 1–5 — fine |
| Verify | owner-only | Verify | **HALT** — no goal evaluation |
| Deliberate | owner-only | Deliberate | **HALT** — no goal evaluation |

So recording `Direct` never HALTs; recording a stricter mode than the runner
executes can. The EPIC-15 residual run dispatched its remaining four cards
`Direct` on this basis and had zero further mode trouble.

## Open gap — the repair path is undescribed

The command says a missing-goal-evaluation HALT is "surfaced to the human" and
offers no sanctioned repair. The EPIC-15 residual run resolved it by dispatching
the missing mode's seats (skeptic + judge) **directly from the orchestrator**,
outside any runner. That worked, but it is not in the procedure, and the
`mode` param not controlling execution is itself an unresolved design question —
either the orchestrator should record the mode the runner will judge, the runner
should honor the ROOT mode, or the mode should be re-recordable after step 1.
A card is owed.

## Related

- [[deterministic-merge-check]] — the check whose ruleset this keys
- [[metered-deliberation-routing]] — the Deliberate/Verify/Direct lanes
- [[council-runner]] — the container that re-derives the mode
- [[hub-job-supervision]] — the ROOT/manifest substrate the mode rides
- [[record-push-discipline]] — the other run-scoped recording discipline

## Sources

- [[2026-09-23-epic15-residual-run-ledger]]
- `extensions/gate-route.ts` (`readCardMode`, `effectiveModeForCard`),
  `extensions/merge-check.ts`, `council/procedures/council.md` step 1,
  `council/procedures/features-deliver.md`