---
title: Procedures vs Commands
type: comparison
summary: Markdown procedures (scanned, LLM-facilitated) vs TypeScript-registered commands (engine-owned loops) — when each is the right surface, learned from /council-eval and /council-leaderboard.
aliases: [procedure vs command, ts command, markdown procedure]
tags: [pi-council/architecture]
sources: ["[[2026-09-03-design-ev20]]", "[[2026-09-03-po-ev21-ruling]]"]
created: 2026-09-04
updated: 2026-09-04
---

# Procedures vs Commands

The package ships two kinds of slash surface. Picking wrong is expensive —
both directions were argued during EPIC-4.

| | **Markdown procedure** (`council/procedures/*.md`) | **TS command** (`registerCommand` in `extensions/index.ts`) |
|---|---|---|
| Executed by | the LLM facilitator, following prose | the engine, deterministically |
| Override | repo-local file shadows by filename | code only (package-level) |
| Good for | judgment flows: deliberation, drafting, routing — where an LLM in the loop *is* the feature | mechanical loops: parse → dispatch → accumulate → render; anything where LLM improvisation is a defect |
| Cost-bearing? | dangerous (an LLM loop can wander into expensive dispatches) | safe (pre-validation, caps, echo-then-run live in code) |
| Examples | `/council`, `/features-new`, `/features-deliver`, `/wiki-*` | `/council-init`, `/council-jobs`, `/council-eval`, `/council-leaderboard` |

## The deciding arguments

- **/council-eval must not be an LLM-orchestrated loop** (EV-16 §3.1): a
  hours-long matrix needs catalogue pre-validation before any dispatch, a
  hard repeat cap, and a per-repeat transcript line written by harness
  verbs — "no LLM prose" as the durable record. An LLM facilitator cannot
  guarantee any of those under drift. (Designer r1 made this a hard scope
  decision; see [[model eval harness]].)
- **/council-leaderboard must not be able to mutate**: a pure read whose
  handler calls one renderer. Baking a read into the write verb (a
  `--summary` flag on `/council-eval`) was rejected — someone typing a
  rank query would risk triggering a matrix; the no-arg form collision
  ("list tasks") settles it.
- **/council stays a procedure** because its value *is* seated judgment:
  the loop routes open-judgment items to ruling seats. Determinism is not
  the goal there; boundedness is (round caps, verify-cycle caps).

## Rule of thumb

If the surface's correctness depends on **an LLM's judgment**, it is a
procedure. If its correctness depends on **an LLM's obedience**, it must
be a command.

## Related

- [[procedure commands]] — the scanned procedure mechanism.
- [[council loop]] — the flagship procedure.
- [[model eval harness]] — the flagship commands.

## Sources

- [[2026-09-03-design-ev20]]
- [[2026-09-03-po-ev21-ruling]]
