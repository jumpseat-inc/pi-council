---
id: FLLWUP-41
title: Reconcile council.md step 12's non-fast-forward wording with the union-merge repair
state: Ready
owner: null
epic: EPIC-9
goal: council.md step 12 names the documented union-merge reconcile as the sanctioned non-fast-forward repair, retains the never-force guard, and a literal reading no longer HALTs a run that the documented repair resolves.
---

## Intent

`council.md` step 12 says to stop and surface a non-fast-forward, while
`vault/wiki/union-merge-reconcile.md` documents the non-destructive union
merge as the routine repair. Two EPIC-9 reconciliations (EV-37, EV-40)
resolved it by inference, which the authority map forbids, and a literal
reading HALTs a run with no human watching. Named by the steward closure
ruling as owed before the next autonomous run.

## Orchestrator rulings (Phase 1, binding)

Recorded human decisions for this run. Immutable and binding on every seat,
`steward` included; a runner that hits one applies it and cites the ruling
rather than re-asking.

- **R1 (non-fast-forward repair).** The documented union-merge reconcile
  (`vault/wiki/union-merge-reconcile.md`) is the sanctioned non-destructive
  repair for a non-fast-forward on local `main` during this run. A runner
  that hits a diverged `main` which a union merge resolves applies this
  ruling rather than `HALT`-ing on the literal step-12 wording. The
  never-force guard stands: force-pushing, rewinding, or discarding a side
  remains forbidden. This run's delivery of FLLWUP-41 is what reconciles the
  procedure text with this ruling; until it lands, R1 governs.
