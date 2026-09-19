# PO ruling — EPIC-13 promotion ratification (Backlog → Ready)

**Seat:** product-owner. **Date:** 2026-09-20. **Run:** `/features-deliver EPIC-13`.
**Question referred:** should the EPIC-13 children in `state: Backlog` be promoted to
`Ready` so `council.md` step 1 permits their Council runs — just EV-60, or the whole set?

## Decision

**P1 — EV-60 is promoted to `Ready` now**, as the chain head.

**P2 — the remaining nine `Backlog` children promote by the established chain cadence,
not in bulk.** Each promotes the moment its predecessor in the R2 order has its merge SHA
on local `main` and `python3 council/validate.py` is clean on the tree after the edit:

> EV-61 after EV-60 · EV-62 after EV-61 · EV-63 after EV-62 · EV-64 after EV-63 ·
> EV-66 after EV-64 · EV-67 after EV-66 · EV-69 after EV-67 · EV-70 after EV-69 ·
> EV-71 after EV-70 · EV-72 after EV-71

The cadence is **ruled once here and executed by the orchestrator without a further
packet** to this seat (`[[chain-promotion]]`, P5 of
`[[2026-09-03-po-epic4-promotion-cadence]]`).

**P3 — EV-65 and EV-68 stay `Ready` as recorded.** No demotion. Their state was
human-approved at decomposition, and this seat does not overturn a recorded human
decision. `Ready` *permits* a run; R2's dependency order *governs* which run happens
next, and the run is purely serial. The two early `Readys` are therefore inert.

**P4 — no escalation to `steward`.** This ruling *executes* R2 (deliver the full epic,
all 13 children, in dependency order); it declines no card, accepts no permanent
residual, touches no settled decision, and finds no `goal` defect. Reversing R2 would be
a portfolio change; carrying it out is not.

## Grounding

- `council/procedures/features-deliver.md` authority map: promotion ratification is
  this seat's, escalating to `steward`.
- `council/procedures/council.md` step 1: a card outside `Ready` has not earned a run.
- `council/procedures/board-create-card.md` step 4: `Ready` means the intent is detailed
  enough to deliberate without further clarification. Spot-read of EV-60, EV-63 and
  EV-72 confirms these eleven are `Backlog` for **sequencing**, not under-specification.
- `[[chain-promotion]]` and `[[2026-09-03-po-epic4-promotion-cadence]]`: bulk promotion
  was rejected on the grounds that it "invites cards to spec dependencies that don't
  exist"; per-card re-asking was rejected as mechanical busywork.
- `[[2026-09-19-po-epic11-decomposition-ruling]]` §2: "chain-promotion, not bulk."
- `council/cards/EPIC-13.md` Acceptance: a cost-per-card and cost-per-epic baseline
  "exists from existing run manifests **before any routing change ships**."
- AGENTS.md convention 12: `runs/` is pruned to the last 15 runs.

## Why EV-60 alone carries an urgency the others do not

EV-60's raw material is the repository's own history, and that history is on a
depleting surface — `runs/` keeps only the last 15 runs. Every card behind it is
promoted by a trigger that cannot be beaten; EV-60 has no such guardrail. Holding it for
a later packet spends evidence that cannot be regenerated, and the epic's Acceptance
conditions the entire routing change on that baseline existing first.

## Options rejected

- **Bulk promotion of all eleven.** Loses on the EPIC-4 ground, which is unusually sharp
  here: EV-66, EV-67, EV-69, EV-70 and EV-71 all spec against the gate ledger (`EV-61`),
  `decide()` (EV-63), or a recorded mode (EV-68) that do not yet exist. A panel
  deliberating them today is inventing interfaces it cannot see, and a runner may build
  to the invention.
- **Promote EV-60 only, then re-ask per card.** The trigger is mechanically observable;
  re-asking buys nothing and idles a serial run while waiting on this seat.
- **Demote EV-65/EV-68 into chain position.** Reverses a human-approved board state to
  satisfy an ordering the ruling already enforces at dispatch time.
- **Escalate to `steward`.** R2 already settled the portfolio; there is nothing left for
  that seat to decide.
