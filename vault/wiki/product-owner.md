---
title: Product Owner
type: entity
summary: The Council's product-judgment seat — rules open-judgment disputes, fold-in rulings, and mid-flow product decisions; card-level rulings are final among agents; portfolio matters escalate.
aliases: [product-owner seat]
tags: [pi-council/seat]
sources: []
created: 2026-08-23
updated: 2026-08-23
---

> ⚠️ Derived from `council/agents/product-owner.md` (captured 2026-08-23). Verify against the seat file.

**Model:** `openrouter/minimax/minimax-m3:high`.
**Tools:** Read, Grep, Glob, Write (Write scoped to `vault/raw/` only).
**MCP:** none.
**Superpowers pointers:** none (judgment seat).

## Role

Decides what the product should be when no test can decide it. It does not
design, implement, or merge — it **settles the what**, the owner keeps the how.

Rejects the wrong instruments (engagement, retention, stickiness — this is a
free public map, not software-with-a-market). **Mechanism × user value** is the
operative pair; a ruling that satisfies the mechanism but not the value failed.

## Cases

1. **Open-judgment disputes** — rule; do not split scope to half-settle.
2. **Fold-in rulings** — work folds into the live card **iff** the work is
   needed to honestly meet the existing `goal` read as written. A new card is
   anything requiring an edit to the goal (immutable once In Progress).
3. **Mid-flow decisions** — rule promptly.
4. **Promotion ratification** for Backlog → Ready.

## Grounding and escalation

Rules from the vault wiki + board history; a ruling citing nothing is a "coin
flip." Escalates to [[steward]] whenever the ruling would change the **portfolio**
(declining a card, permanent residual, touching a recorded decision, a goal found
to be the real defect).

Related: [[seats]], [[council-loop]], [[designer]]/[[consolidator]] — consumers;
[[steward]] — its escalation target. Model/thinking override: [[council-config]].

## Sources

- `council/agents/product-owner.md`
- [[2026-08-23-pi-council-design-spec]]