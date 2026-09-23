---
id: FLLWUP-111
title: Migrate runTool in test/usages.test.ts to the async spawn pattern
state: Ready
owner: null
epic: EPIC-15
goal: test/usages.test.ts contains no spawnSync call — every usages-tool invocation goes through a helper using Bun.spawn with await proc.exited — and bun test test/usages.test.ts passes.
---

## Intent

`test/usages.test.ts`'s `runTool` helper uses `spawnSync`. The BUG-2 step-4
skeptic reproduced the trap this creates: when the analytics stub cannot answer,
`spawnSync` blocks and the test dies with `status: null … timed out`. `T-U7` and
`T-U8` already use the async `Bun.spawn` + `await proc.exited` pattern; this
card migrates the legacy helper so future test authors do not inherit the
deadlock. The product-owner ratified it as a separate card (not a fold-in — no
live card's goal needs it).

## Acceptance

- `test/usages.test.ts` contains no `spawnSync` call; every usages-tool
  invocation goes through a helper using `Bun.spawn` with `await proc.exited`.
- `bun test test/usages.test.ts` passes, including the existing `T-U1`…`T-U8`
  and `T-USK1`-adjacent coverage.
- `bunx tsc --noEmit` and `python3 council/validate.py` pass.

## Phase 1 Rulings (this run — features-deliver, EPIC-15 residuals)

Recorded before any `council-runner` was dispatched. Binding on every seat,
`steward` included; cited, never re-asked.

- **Scope/promotion:** this card is promoted `Backlog` → `Ready` as part of the
  run's five-card residual scope (`FLLWUP-107`–`FLLWUP-111`); `EPIC-15` stays
  `Done`.
- **Sequencing (steward, job-1):** `FLLWUP-111 → FLLWUP-109 → FLLWUP-110 →
  FLLWUP-107 → FLLWUP-108`, one runner at a time. This card is first: FLLWUP-109
  and FLLWUP-110 add new tool-invocation tests to `test/usages.test.ts` and must
  be authored on the async helper, not the `spawnSync` trap.
- **R-A (record push) and R-B (merge):** run-scoped authorizations recorded on
  `council/cards/EPIC-15.md`'s residual-run Phase-1 section.