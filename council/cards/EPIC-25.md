---
id: EPIC-25
title: Close the EPIC-24 autonomous-delivery residuals — runner never-read rule, dispatchable smoke-fixture faces, stale-ctx crash, and two test-pin residuals
state: Backlog
owner: null
epic: null
goal: The five residuals re-homed from EPIC-24 are closed — FLLWUP-117's cardEpicKey throw-site documentation is reconciled, FLLWUP-118 pins the shared FRONTMATTER_RE byte-0 anchor, FLLWUP-119's EPIC-* smoke-fixture card faces are dispatchable by real model-driven flows, FLLWUP-120 covers the print-mode stale-ctx parent crash, and FLLWUP-121 reproduces or pins test/stub-child.test.ts's child-scheduling flake — with `bun test`, `bunx tsc --noEmit`, and `python3 council/validate.py` green on the merged tree.
---

## Intent

EPIC-24 ("Close the EPIC-23 autonomous-delivery residuals") delivered and
merged its three named children — FLLWUP-115, FLLWUP-114, and FLLWUP-116 —
then closed `Done` on its named acceptance. Its run surfaced five follow-up
cards, each ratified independently by `product-owner` at the step-13 gate and
filed under `epic: EPIC-24`. Carrying those five open residuals under a `Done`
epic is the exact state EPIC-24 itself was created to remove, so `steward`
(job-15 of the EPIC-24 autonomous run) ruled them re-homed here, replaying the
EPIC-23→EPIC-24 precedent.

The five children:

- FLLWUP-117 — Close the cardEpicKey throw-site JSDoc drift (from FLLWUP-115).
- FLLWUP-118 — Pin the shared FRONTMATTER_RE anchor shape at the byte-0
  boundary (from FLLWUP-115).
- FLLWUP-119 — Repair the EPIC-* smoke-fixture card faces so real model-driven
  flows can dispatch them (from FLLWUP-114).
- FLLWUP-120 — Cover the print-mode stale-ctx parent crash when a dispatched job
  outlives its turn (from FLLWUP-114).
- FLLWUP-121 — Pin test/stub-child.test.ts's child-scheduling race (from
  FLLWUP-116).

## Acceptance

- All five children are merged with the `gates` workflow green on each merged
  SHA — or a child is explicitly dispositioned (retired/absorbed) on the record
  with the ruling that produced it.
- `bun test`, `bunx tsc --noEmit`, and `python3 council/validate.py` pass on the
  merged tree.