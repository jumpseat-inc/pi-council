---
id: FLLWUP-120
title: Cover the print-mode stale-ctx parent crash when a dispatched job outlives its turn
state: Done
owner: null
epic: EPIC-25
goal: The print-mode stale-context parent crash is covered by a test that reproduces the crash class and pins the engine's behavior — when a dispatched job outlives its parent `pi -p` turn and settles afterward, the parent's `Hub.onChange → renderWidget → assertActive` path does not produce an unhandled stale-ctx crash, and `bun test` stays green on the merged tree.
---

## Intent

While FLLWUP-114's live run was executing, the print-mode parent crashed with
a stale-context error when a dispatched job outlived its turn: the parent
`pi -p` teardown disposed the extension context, and the runner's later
settle fired `Hub.onChange → renderWidget → assertActive` against the
disposed context, crashing the parent. A phase-scoped workaround was applied
during the run (a scripted `council_wait` spanning the runner's lifetime) but
no test covers the crash class — the workaround holds this run's shape only,
not the general case.

Grounding: observed during FLLWUP-114's live container (the parent `pi -p`
teardown disposed ctx; `Hub.onChange → renderWidget → assertActive` crashed
on the runner's later settle).

Filed from FLLWUP-114's step-13 gate (candidate 2, draft title "Cover the
print-mode stale-ctx parent crash when a dispatched job outlives its turn"),
product-owner-ratified `File` 2026-09-26 (confirming ruling, job-8; recorded
gate basis: composite 0.27 < merge threshold 1.00 — active mode).

## Acceptance

1. A test reproduces the crash class: a dispatched job settling after its
   parent print-mode turn has torn down (ctx disposed) drives the
   `Hub.onChange → renderWidget → assertActive` path against the disposed
   context.
2. The test pins the engine's settled behavior — no unhandled stale-ctx
   crash escapes on that path (whether by dispose-aware guard, safe no-op,
   or another mechanism the implementation names).
3. `bun test`, `bunx tsc --noEmit`, and `python3 council/validate.py` stay
   green on the merged tree.
