---
title: PO EPIC-4 Promotion Cadence Ruling
type: source
summary: Binding P1–P5 ruling — the EPIC-4 child cards promote Backlog→Ready by an automated chain (fixtures → rubric → matrix → leaderboard), applied by the orchestrator without re-asking as each predecessor's merge lands.
aliases: [promotion cadence, P1-P5 ruling]
tags: [pi-council/epic4, ruling]
sources: []
created: 2026-09-04
updated: 2026-09-04
---

# PO EPIC-4 Promotion Cadence Ruling (2026-09-03)

Re-homes the EPIC-4 Intent clause ("children stay Backlog until the human
promotes them") to the product-owner for the run, then binds a **serial
chain**: P1 promote EV-18 now (spec + override seam landed); P2 EV-19 after
EV-18 is Done (grading fixtures that don't exist is "a rejection waiting to
happen"); P3 EV-20 after EV-19 (a matrix over fixtures that don't grade
yet can't satisfy the re-grade-reproducibility clause); P4 EV-21 after
EV-20 (a leaderboard without records renders the truthful empty state as
the *only* state — a designed-for defect class, not a useful posture).

**P5 is the load-bearing part: the cadence is automated, not
packet-driven.** The orchestrator applies each promotion as soon as the
predecessor's merge SHA is on local main and `python3 council/validate.py`
is clean — no re-asking. The legitimacy argument rides the single-board-
writer discipline: the runner writes while a card is in flight, the
orchestrator writes between cards.

Options rejected: bulk promotion (invites cards to spec dependencies that
don't exist); per-card re-asking (the chain is mechanically deterministic);
steward escalation (executing a recorded human decision, not reversing it).

This pattern was applied at every link of the chain, including EV-20→EV-21
at the end of the run (see [[chain promotion]]).

## Related

- [[chain promotion]] — the generalized concept.
- [[engineering board]] — the board mechanics the cadence rides.
- [[2026-09-04-epic4-run-ledger]] — run context.

## Sources

- `vault/raw/2026-09-03-po-epic4-promotion-cadence.md`
