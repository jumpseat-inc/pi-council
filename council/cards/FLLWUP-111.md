---
id: FLLWUP-111
title: Migrate runTool in test/usages.test.ts to the async spawn pattern
state: Done
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

## Run record (features-deliver / FLLWUP-111 — EPIC-15 residual run)

### Steps 1–8 (first container, job-2/job-3)

Mechanical path (test-only, one file, unambiguous). Record commits `e2240a0`
(In Progress at owner handoff) and `6e6d5fe` (In Review at PR #107), pushed
under R-A. Owner implemented the async `runTool` migration in
`.worktrees/fllwup-111-async-spawn`; PR #107 opened; `gates` green on head
`9d5ca53`.

### Mode mismatch (recorded, resolved)

The orchestrator's ROOT dispatch recorded mode `Verify`; the first container
clamped execution to EV-70 `Direct` (owner-only) and dispatched no skeptic or
judge. The merge check read the run substrate (`job-3` → `Verify`) and issued
the mechanical HALT `HALT: FLLWUP-111 — mode Verify requires a goal evaluation
and none is recorded`. Resolved by producing the missing `Verify` evidence at
the recorded mode.

### Step 9 — verification (job-4, skeptic)

Subject: PR #107 head `9d5ca53`, worktree `.worktrees/fllwup-111-async-spawn`.
No blocking objections; every objection closed-green (O1–O6): zero `spawnSync`;
three `Bun.spawn` + `await proc.exited` sites (`runTool`, `runAsync`, T-U4
inline); T-U9 pin red-at-base (`e2240a0`) / green-at-head;
`bun test test/usages.test.ts` 9 pass / 0 fail; T-USK1 1 pass / 0 fail; `tsc`
clean (injection-proven capable of failing); `validate.py` clean.

### Step 10 — judge (job-5)

Verdict **PASS**: zero `spawnSync`; all three spawn sites async; 9 pass /
0 fail.

### Step 11 — deterministic merge (orchestrator)

Mode `Verify`, criteria 1–5 satisfied (criterion 3 scoped to the single Verify
skeptic dispatch, job-4; criterion 4 = judge job-5 PASS). Merged pinned under
R-B: `gh pr merge 107 --squash --admin --match-head-commit
9d5ca5377133fb53bc0ffaaba7839a2913e2c808` → `927fdaa`. `gates` workflow
`SUCCESS` on merged SHA `927fdaa`.

### Step 12 — Done

Card set `Done` on card and board; `python3 council/validate.py` clean.

**Merge basis: FLLWUP-111 — mode Verify, criteria 1, 2, 3, 4, 5 satisfied.**