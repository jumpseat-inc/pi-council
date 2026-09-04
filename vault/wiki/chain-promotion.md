---
title: Chain Promotion
type: concept
summary: Backlog→Ready promotion for a dependent card chain is bound once as an automated cadence — the orchestrator promotes each card the moment its predecessor's merge SHA is on local main and validate.py is clean, without re-asking.
aliases: [promotion cadence, automated promotion, P1-P5]
tags: [pi-council/features-deliver, pi-council/process]
sources: ["[[2026-09-03-po-epic4-promotion-cadence]]"]
created: 2026-09-04
updated: 2026-09-04
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

## Related

- [[deterministic merge check]] — the other automation that makes
  multi-card autonomous runs safe.
- [[engineering board]] — the state columns the cadence moves cards
  through.
- [[2026-09-03-po-epic4-promotion-cadence]] — the source ruling.

## Sources

- [[2026-09-03-po-epic4-promotion-cadence]]
