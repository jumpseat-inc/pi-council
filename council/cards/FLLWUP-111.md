---
id: FLLWUP-111
title: Migrate runTool in test/usages.test.ts to the async spawn pattern
state: Backlog
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