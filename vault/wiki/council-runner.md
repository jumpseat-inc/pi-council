---
title: Council Runner
type: entity
summary: The per-card autonomous execution container — dispatched by /features-deliver to run the full /council loop for one card in an isolated context; routes, counts, and writes the board but never decides.
aliases: [council-runner, runner]
tags: [pi-council/seat]
sources: ["[[2026-08-24-bugfix-seat-prose]]"]
created: 2026-08-23
updated: 2026-09-04
---

> ⚠️ Derived from `council/agents/council-runner.md` (captured 2026-08-23). Verify against the seat file.

**Model:** `openrouter/deepseek/deepseek-v4-flash-0731:medium`.
**Tools:** Read, Grep, Glob, Edit, Write, Bash, task, hub.
**Spawns:** `[owner, principal, designer, skeptic, consolidator, judge]` — it
dispatches the working seats, **never the ruling seats** (product-owner/steward).
**MCP:** `[context7, tavily]`.
**Superpowers pointers:** writing/executing-plans, subagent-driven-development,
verification-before-completion, finishing-a-development-branch.

## Role

A **facilitator for exactly one card** (dispatched by /features-deliver's
Phase 2; the facilitator role per [[facilitator]]), executing the full
`/council` loop in its own turn. It decides
nothing — routes work, counts rounds/dispatches, writes the board. The human's
reserved powers are re-homed per the authority map in `features-deliver.md`.

> ⚠️ **Corrected (v0.10.0):** this page previously asserted the runner
> "dispatches the working seats" as fact. Before v0.10.0 that was aspirational
> — hub tools were never on the child's `--tools` allowlist, so the runner
> HALTed before dispatching a single seat and `/features-deliver` was broken
> end-to-end. Found by the [[smoke-test]]'s first round; fixed by the
> smoke-test bugfix; see [[2026-08-25-smoke-test-bugfixes]] bug 3.

## Distinctive contracts

- **Escalation contract** — rulings aren't dispatched; it checks Phase 1
  standing rulings first, else ends with an `ESCALATION` report carrying **facts,
  not a recommendation**, and resumes with the ruling.
- **Board discipline** — while a card is in flight it is the **single writer** of
  the board + card file; every state transition is committed immediately
  (durable-state), `validate.py` after every board write.
- **Step-9 iteration cap** — ≤3 verify→fix→verify cycles per card.
- **Convergence is not evidence** — agreement between independently-dispatched
  seats is a shared hypothesis, not a test result.
- **Dispatch discipline** — every dispatch bounded and note/waited; a `stalled`
  re-dispatch is treated like a timeout; never dispatch a third time.
  **Poll-slice long waits** (EPIC-3 lesson): never issue a `council_wait`
  longer than ~8 minutes — three EPIC-3 containers were anti-stall-killed
  while blocked in single 30–45-minute waits (see [[hub-job-supervision]];
  [[2026-09-04-epic3-run-ledger]]). EPIC-5 corroboration at the layer
  above: the orchestrator dispatching *runners* must also set its stall
  window above the runner's longest legitimate silent wait (55 min
  covers the 45-min owner ceiling) — see [[2026-09-04-epic5-run-ledger]].
- **Seat resolution check** — verifies each needed seat resolves by name; seats
  resolve from disk at dispatch time, so a gap is a missing seat file → `HALT`,
  never a registry restart.
- **Return contract** — report tags `ESCALATION`, `DONE`, `RETIRED`, `HALT`;
  the orchestrator sees only the report.

## Lessons from the EPIC-5 run

- **The mechanical path is real** — when a card's design is fully settled
  by Phase 1 rulings and landed module contracts, steps 2–6 are skipped
  and the card itself is the owner handoff (EV-25 did exactly this).
  Deliberation is not ritual; skipping it when nothing is open is the
  facilitator's call, recorded on the card face.
- **Green-light conditional shipping** — an `ESCALATION` ruling may make
  continuation conditional on a filed follow-up card (EV-23 shipped
  against the tracked FLLWUP-10 seam); the runner then asserts the
  follow-up's record exists before any merge. A *temporary, tracked*
  residual is shippable; a permanent one never is.
- **Committed-board-state recovery works** — two EPIC-5 containers died
  on infrastructure and both successors resumed from the committed
  card/board state (one owner resumed from its own plan doc and partial
  artifacts) with zero work lost. The board discipline is what makes a
  crashed container cheap.

## Related

- [[seats]], [[council-loop]]
- [[engineering-board]], [[hub-job-supervision]], [[preflight]]
- [[council-config]] — default model/thinking override
- [[council models picker]] — the EPIC-5 epic this seat delivered

## Sources

- `council/agents/council-runner.md`
- `council/procedures/features-deliver.md`
- [[2026-08-24-bugfix-seat-prose]]
- [[2026-09-04-epic5-run-ledger]] — mechanical path, green-light
  conditionals, recovery-from-committed-state