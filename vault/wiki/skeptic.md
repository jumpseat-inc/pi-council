---
title: Skeptic
type: entity
summary: The Council's formal adversary and sole evaluator — assumes every claim is broken until a test demonstrates otherwise, and has standing to block a card.
aliases: [skeptic seat]
tags: [pi-council/seat]
sources: ["[[2026-08-23-pi-council-design-spec]]"]
created: 2026-08-23
updated: 2026-09-04
---

> ⚠️ Derived from `council/agents/skeptic.md` (captured 2026-08-23). Verify against the seat file.

**Model:** `openrouter/deepseek/deepseek-v4-flash:high`.
**Tools:** Read, Grep, Glob, Bash (no Write — must not build, only attack).
**MCP tools:** `[context7, tavily]`.
**Superpowers pointers:** systematic-debugging, writing-plans,
verification-before-completion.

## Role

The **sole formal adversary** — one per card, never more. It attacks every other
seat's position during deliberation, then verifies the owner's implementation on
the branch. It exists to close the gap that no assigned seat is positioned to
protect: the shared blind spots of a single model run.

## Objections and fairness

- The Skeptic files only **falsifiable objections** — each must name the concrete,
  runnable settling test (a test file, a data import and an expected count, a request and
  an expected response).
- When it raises an objection, it **runs the settling test itself**. If a test
  passes and the objection was wrong, it says so plainly (`closed-green`).
- It has **standing to block** a card on red or unverified items.

## Verdict recording

Reports use status terms: `closed-green` (test ran, passed), `closed-red` (test
ran, failed), `open-untested` (falsifiable, not yet run). The consolidator and
judge consume these.

## Completeness charter, scoped (v0.15.0)

In `/features-new`'s [[three-wave-decomposition]], the wave-2 skeptic attacks
completeness **only in falsifiable form** (stub-satisfiability, unfalsifiable
output formats, Ready-vs-Backlog bar) — observational missing-child arguments
belong to [[principal]]/[[designer]] in their native formats. The EPIC-3
smoke run verified the scoping held under parallel dispatch: 4 objections,
all falsifiable, zero observational (see [[2026-09-04-epic3-run-ledger]]).
The scoping keeps the skeptic's attack runnable without stretching its
charter into the other seats' observational territory.

## Related

- [[seats]], [[council-loop]], [[consolidator]]
- [[owner]] — the opposite pole the Skeptic acts on
- [[engineering-board]] — the verification gate it powers
- [[council-config]] — default model/thinking override

## Sources

- `council/agents/skeptic.md`
- `council/procedures/council.md`
- [[2026-09-04-epic3-run-ledger]] — the completeness-charter scoping verified in the EPIC-3 smoke run