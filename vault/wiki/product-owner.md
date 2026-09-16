---
title: Product Owner
type: entity
summary: The Council's product-judgment seat — rules open-judgment disputes, fold-in rulings, and mid-flow product decisions; card-level rulings are final among agents; portfolio matters escalate.
aliases: [product-owner seat]
tags: [pi-council/seat]
sources: ["[[2026-09-11-epic7-run-ledger]]", "[[2026-09-15-epic8-run-ledger]]"]
created: 2026-08-23
updated: 2026-09-15
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
free public product, not software-with-a-market). **Mechanism × user value** is the
operative pair; a ruling that satisfies the mechanism but not the value failed.

## Cases

1. **Open-judgment disputes** — rule; do not split scope to half-settle.
2. **Fold-in rulings** — work folds into the live card **iff** the work is
   needed to honestly meet the existing `goal` read as written. A new card is
   anything requiring an edit to the goal (immutable once In Progress).
3. **Mid-flow decisions** — rule promptly.
4. **Promotion ratification** for Backlog → Ready.
5. **Wave-3 decomposition ruler** (v0.15.0) — in `/features-new`'s
   [[three-wave-decomposition]], product-owner runs last, unconditionally,
   and **rules but never generates**: it ratifies/amends the epic goal and
   child states, rules disputes with dissent named. The EV-10 step-6 ruling
   rejected PO-as-wave-1-author precisely because authoring the epic goal
   and then ruling on it in wave 3 is a self-review loop the human at the
   gate cannot see — the structural expression of "decide the what, never
   design the how". Ruled EPIC-3's three mid-run escalations this way.

### EPIC-7 (v0.18.0) — the goal-as-defect precedent

EV-29's goal asked for "per-component cost figures reported by the provider";
the provider has **no per-component dollar source at all** (see
[[cost-provenance]]). Product-owner ruled the copy and record-shape items and
escalated the goal wording to [[steward]], which amended the card goal in
place. The general lesson: **a goal that must be reinterpreted against its own
words to be satisfiable is the defect**, and goal-wording authority is the
steward's. Product-owner also ruled EV-30's record shape (no `total`, per-half
basis) and EV-31's read-back semantics in the same run.

### EPIC-8 (v0.18.0) — acceptance amendment + cross-card ruling reach

EV-33's `goal` named "one accessor consumed by both the tree row copy and the
transcript header", while its Acceptance bullet 4 said "no render code
changes". Product-owner ruled (job-6) the accessor is **exported** for EV-34 to
consume — the goal describes a **post-epic endpoint**, so bullet 3 was amended
and the goal stood. An Acceptance section is an amendable surface; the goal is
not ([[engineering-board]]).

EV-35's five-item ruling (job-12) is the run's other defining call:
`classifyProgressKey` is a **fold-in** (its honesty claim was already false on
smoke-tested terminals), no header pin (overflow deferred), presence/absence
follow copy, an EV-9 test narrowing plus a positive `▌` assertion, and the
visible-index cursor scheme (Q5). EV-36 (job-17) then ruled Q1 = **R3**
(read-only effective index) and — the precedent — that **EV-35's Q5 anti-goal
reaches EV-36's R2 writeback**, clarifying its own prior ruling rather than
reversing a human decision. See [[one-row-floor]].

## Grounding and escalation

Rules from the vault wiki + board history; a ruling citing nothing is a "coin
flip." Escalates to [[steward]] whenever the ruling would change the **portfolio**
(declining a card, permanent residual, touching a recorded decision, a goal found
to be the real defect).

## Related

- [[seats]], [[council-loop]], [[designer]]/[[consolidator]] — consumers
- [[steward]] — its escalation target
- [[council-config]] — model/thinking override

## Sources

- `council/agents/product-owner.md`
- [[2026-08-23-pi-council-design-spec]]
- [[2026-09-04-epic3-run-ledger]] — the wave-3 ruling-only precedent + three rulings
- [[2026-09-11-epic7-run-ledger]] — the goal-as-defect escalation (EV-29) + seven ruling dispatches