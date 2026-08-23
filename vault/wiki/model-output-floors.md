---
title: Model Output Floors
type: concept
summary: A data-driven patch (before_provider_request) that re-inflates max output tokens for models whose catalogue entry understates the ceiling — stopping stopReason=length deaths mid-thinking.
aliases: [output floors, max tokens floor]
tags: [pi-council/concept]
sources: []
created: 2026-08-23
updated: 2026-08-23
---

# Model Output Floors

> ⚠️ Derived from `extensions/index.ts` (`loadModelFloors`, `registerMaxTokensFix`),
> `council/model-floors.json`, `AGENTS.md` (convention 9) (captured 2026-08-23). Verify against the code.

Some OpenRouter catalogue entries carry wrong max-output metadata — notably
`deepseek/deepseek-v4-pro-0813` is listed at ~4.1K output tokens while the model
may need far more for high-thinking deliberation. If a seat's deliberation burns
its whole output budget on reasoning, the run dies with `stopReason=length` and
no text.

## The fix

- **Floors are data, not code.** `council/model-floors.json` (shipped, exactly one
  entry) maps model id → minimum output tokens:
  `"deepseek/deepseek-v4-pro-0813": 131072`.
- A repo may extend/override entries at
  `<repo>/$CONFIG_DIR_NAME/council/model-floors.json` — **merge semantics, repo
  keys win** (see [[override-resolution]]).
- The shipped floor is a guide, not gospel.

## Mechanism

`registerMaxTokensFix` hooks `before_provider_request`. It re-inflates
`max_completion_tokens`/`max_tokens` on the outgoing payload (whichever field is
present) up to the floor, whenever pi's own clamp set it lower. Applies in the
parent **and every seat child** (same `COUNCIL_SEAT` path).

## Why data, not code

A wrong catalogue entry is an upstream data error, so the override stays data so
repos and package updates can correct it without touching TypeScript. But it's
recorded **after** a model demonstrably fails; adding a floor speculatively is
discouraged. (It moved from a hardcoded TS table to `council/model-floors.json`
in a `refactor:` commit on the road to v0.1.0.)

## Related

- [[override-resolution]], [[seats]]

## Sources

- `extensions/index.ts`, `council/model-floors.json`
- `AGENTS.md` (convention 9)