---
title: Chain Promotion
type: concept
summary: Backlog→Ready promotion for a dependent card chain is bound once as an automated cadence — the orchestrator promotes each card the moment its predecessor's merge SHA is on local main and validate.py is clean, without re-asking.
aliases: [chain promotion, promotion cadence, automated promotion, P1-P5]
tags: [pi-council/features-deliver, pi-council/process]
sources: ["[[2026-09-03-po-epic4-promotion-cadence]]", "[[2026-09-11-epic7-run-ledger]]", "[[2026-09-21-epic13-run-ledger]]", "[[2026-09-20-po-epic13-promotion-ruling]]", "[[2026-09-21-epic14-run-ledger]]", "[[2026-09-22-epic10-run-ledger]]", "[[2026-09-23-fllwup-backlog-cleanup]]", "[[2026-09-23-fllwup-epic-grouping]]"]
created: 2026-09-04
updated: 2026-09-22
---

# Chain Promotion

When an epic's children form a dependency chain (fixtures → rubric →
matrix → leaderboard), promoting them one human packet at a time is
mechanical busywork, and promoting them all at once invites each card to
spec dependencies that don't exist yet. The EPIC-4 ruling bound the middle
path: **the product-owner rules the whole cadence once; the orchestrator
executes it without re-asking.**

## The rule shape

1. The ruling names the chain order and *why* each link exists (e.g.
   "grading fixtures that do not exist is not a card, it is a rejection
   waiting to happen"; a leaderboard without records renders the truthful
   empty state as its only state).
2. Promotion trigger is **observed, not decided**: predecessor's merge SHA
   on local main + `python3 council/validate.py` clean after the edit. No
   further packet; phase-1 rulings on each card travel with it.
3. The legitimacy argument rides single-board-writer discipline: the
   runner is the writer while a card is in flight; the orchestrator
   writes between cards; promotion is a between-cards write.
4. Escalation discipline preserved: the ruling *executes* a recorded
   human decision (EPIC-4's Intent clause), so it is not a portfolio
   change — reversing it would be.

Applied at every EPIC-4 link (EV-18→EV-19→EV-20→EV-21), including across
session boundaries.

## Applied at EPIC-7 — the first full five-link chain (2026-09-11)

EV-28 → EV-30 → EV-31 → EV-32 → EV-29 promoted one at a time as each
predecessor's merge SHA landed on local `main` with `validate.py` clean — no
re-asking, and never a promotion to a card whose dependencies did not yet
exist. The cadence held across all five cards (the longest chain it has
carried), and the run closed EPIC-7 `Done`. See
[[2026-09-11-epic7-run-ledger]].

## Applied at EPIC-13 — the longest chain yet (2026-09-21)

All 13 children (`EV-60`…`EV-72`) promoted one at a time as each predecessor's
merge SHA landed on local `main` with `validate.py` clean — the longest chain
the cadence has carried. Two links (`EV-65`, `EV-68`) were already `Ready` from
decomposition and skipped. The ruling was obtained as an **escalation**: the
first runner correctly refused to promote a `Backlog` card itself, and
[[product-owner]] ruled the whole cadence once. See
[[2026-09-21-epic13-run-ledger]].

## EPIC-10 (2026-09-22)

The intake ratified the promotion conditions (EV-79/80 "Backlog until EV-78";
EV-82 until EV-78–81; EV-83 until EV-82; EV-84 until EV-82/83), and the
orchestrator promoted each card to `Ready` the moment its predecessor's merge
landed — no re-asking (`vault/raw/2026-09-21-po-epic10-recut-ruling.md`, R3).
Witness: [[2026-09-22-epic10-run-ledger]].

## Backlog curation and `epic: null` (2026-09-23)

The cadence and the residual-scope model locate follow-up cards by their `epic:`
tag. The 2026-09-23 curation passed cross-epic merges (e.g. EPIC-13 + EPIC-14)
and set those survivors' `epic: null`, so they can no longer be reached by an
epic-scoped promotion or residual run. A cross-epic merge trades attribution for
consolidation ([[follow-up-backlog-curation]]). The same day's **grouping** pass
re-homed every survivor — including the `epic: null` orphans — into 7 new
thematic epics (EPIC-16…22), so they are reachable by an epic-scoped run again
([[2026-09-23-fllwup-epic-grouping]]).

## Related

- [[deterministic merge check]] — the other automation that makes
  multi-card autonomous runs safe.
- [[engineering board]] — the state columns the cadence moves cards
  through.
- [[2026-09-03-po-epic4-promotion-cadence]] — the source ruling.
- [[2026-09-21-epic13-run-ledger]] — the 13-link chain (EV-60…EV-72).
- [[2026-09-21-epic14-run-ledger]] — the 5-link chain (EV-73…EV-77).

## Sources

- [[2026-09-03-po-epic4-promotion-cadence]]
- [[2026-09-20-po-epic13-promotion-ruling]] — chain-not-bulk, ruled once
- [[2026-09-21-epic14-run-ledger]]
- [[follow-up-backlog-curation]] — cross-epic merges nullify the `epic:` tag this
cadence reads
- [[2026-09-23-fllwup-epic-grouping]] — the pass that re-homed those orphans into
new thematic epics the cadence can scope
