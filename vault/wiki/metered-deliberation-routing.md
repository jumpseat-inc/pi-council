---
title: Metered Deliberation Routing
type: concept
summary: EPIC-13 (Backlog) — a planned typed System One gate that routes each card to Deliberate, Verify, or Direct so cheap cards stop paying the full deliberation tax.
aliases: [metered deliberation, deliberation routing, System One gate, Deliberate Verify Direct]
tags: [pi-council/concept, pi-council/plan]
sources: []
created: 2026-09-20
updated: 2026-09-20
---

> ⚠️ **Planned — EPIC-13 is `Backlog` as of 2026-09-20; the routing is not
> shipped.** This page records the epic's stated intent.

Deliberation is currently the default path for every non-mechanical card. EPIC-13
turns it into a **metered, routed resource**: a typed *System One* gate inspects
each card and routes it to one of three lanes —

- **Deliberate** — the full multi-seat loop ([[council-loop]]),
- **Verify** — a bounded check without a full deliberation,
- **Direct** — proceed without seating the council,

so cheap cards stop paying the deliberation tax, and spending council tokens
becomes a deliberate choice about the cards that actually need judgment. Related
to [[chain-promotion]] (the automated board-state cadence) and
[[deterministic-merge-check]] (the autonomous merge gate).

## Related

- [[council-loop]] — the deliberation lane
- [[engineering-board]] — the cards the gate routes
- [[deterministic-merge-check]], [[chain-promotion]] — the adjacent autonomous machinery

## Sources

- `council/cards/EPIC-13.md` (Backlog)