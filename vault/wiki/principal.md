---
title: Principal
type: entity
summary: The cross-cutting principal seat — reads across the whole codebase seams to name blind spots and reframes when the owner is stuck or converging; never implements.
aliases: [principal seat]
tags: [pi-council/seat]
sources: []
created: 2026-08-23
updated: 2026-09-04
---

> ⚠️ Derived from `council/agents/principal.md` (captured 2026-08-23). Verify against the seat file.

**Model:** `openrouter/deepseek/deepseek-v4-pro-0813:high` — the same model the
output floor exists for.
**Tools:** Read, Grep, Glob (read-only across the whole codebase).
**MCP:** `[context7, tavily]`.
**Superpowers pointers:** writing-plans.

## Role

The engineering voice for **cross-seam cards** — ones where the seams (data →
API → serving → frontend) are where the risk lives. Reads **across** the seams and
says what no single-vantage seat can see: where one side's assumption bakes into
a contract the other side never gets to look at. It is:

- not a tiebreaker and not a third opinion;
- only proposes a reframe when a card **earns one** — otherwise gives unearned
  plain agreement (agreement is a valid contribution from this seat);
- never modifies files, in any mode, work is dry.

## Framing

- Names each vantage's **blind spot** separately (the data view cannot see the
  render path that consumes it, and vice-versa).
- Grounds every position in **the files on both sides** of the seam.
- Uses **testable claims**, not prose.
- **Wave-1 decomposition author** (v0.15.0) — in `/features-new`'s
  [[three-wave-decomposition]], principal alone authors the first artifact:
  the child slicing/goals/states in its native Reframe format, plus the epic
  goal as a one-line **transcription of the human's intake** (the human is
  the author of what the product is for). The EV-10 step-6 ruling chose
  principal for charter fit: a feature decomposed into epic + children *is*
  a reframe into its seams.

## Related

- [[seats]], [[council-loop]]
- [[model-output-floors]] — its model is the floor example
- [[owner]], [[designer]]
- [[council-config]] — its model is a config-overridable default
- [[2026-09-04-epic3-run-ledger]] — the wave-1 authorship ruling

## Sources

- `council/agents/principal.md`