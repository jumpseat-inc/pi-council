---
title: Council Runner
type: entity
summary: The per-card autonomous execution container — dispatched by /features-deliver to run the full /council loop for one card in a stream-isolated context; routes, counts, and writes the board but never decides.
aliases: [council-runner, runner]
tags: [pi-council/seat]
sources: []
created: 2026-08-23
updated: 2026-08-23
---

> ⚠️ Derived from `council/agents/council-runner.md` @ (captured 2026-08-23). Verify against the seat file.

**Model:** `openrouter/deepseek/deepseek-v4-flash-0731:medium`.
**Tools:** Read, Grep, Glob, Edit, Write, Bash, task, hub.
**Spawns:** `[owner, principal, designer, skeptic, consolidator, judge]` — it
dispatches the working seats, **never the ruling seats** (product-owner/steward).
**MCP:** `[context7, tavily]`.
**Superpowers pointers:** writing/executing-plans, subagent-driven-development,
verification-before-completion, finishing-a-development-branch.

## Role

A **facilitator for exactly one card** (dispatched by /features-deliver's
Phase 2), executing the full `/council` loop in its own turn. It decides
nothing — routes work, counts rounds/dispatches, writes the board. The human's
reserved powers are re-homed per the authority map in `features-deliver.md`.

## Distinctive contracts

- **Escalation contract** — rulings aren't dispatched; it checks Phase 1
  standing rulings first, else ends with an `ESCALATION` report carrying **facts,
  not a recommendation**, and resumes with the bunch.
- **Board discipline** — while a card is in flight it is the **single writer** of
  the board + card file; every state transition is committed immediately
  (durable-state), `validate.py` after every board write.
- **Step-9 iteration cap** — ≤3 verify→fix→verify cycles per card.
- **Convergence is not evidence** — agreement between independently-dispatched
  seats is a shared hypothesis, not a test result.
- **Dispatch discipline** — every dispatch bounded and note/waited; a `stalled`
  re-dispatch is treated like a timeout; never dispatch a third time.
- **Return contract** — report tags `ESCALATION`, `DONE`, `RETIRED`, `HALT`;
  the orchestrator sees only the report.

## Related

- [[seats]], [[council-loop]]
- [[engineering-board]], [[hub-job-supervision]], [[preflight]]

## Sources

- `council/agents/council-runner.md`
- `council/procedures/features-deliver.md`