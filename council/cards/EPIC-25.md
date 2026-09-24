---
id: EPIC-25
title: Close the EPIC-24 autonomous-delivery residuals — runner never-read rule, dispatchable smoke-fixture faces, stale-ctx crash, and two test-pin residuals
state: Done
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

## Phase 1 rulings

Recorded human decisions for the EPIC-25 run. Immutable for the run and binding on every seat, `steward` included.

- **P1-1 (human topology override).** The `/features-deliver` one-runner-per-card mandate is overridden for this run: a **single `council-runner`** handles all five EPIC-25 cards (FLLWUP-117, FLLWUP-118, FLLWUP-119, FLLWUP-120, FLLWUP-121). The `owner` works on all five first; the `skeptic` and `judge` are not dispatched until all five owner implementations are committed to the branch.
- **P1-2 (branch/PR/merge topology).** The five cards ride **one branch, one PR, and one squash merge**. Each card's merge basis keys to the same PR head SHA; criterion 3 (no blocking skeptic objection) and criterion 4 (judge PASS) are the single skeptic and judge covering all five card goals.
- **P1-3 (class rulings).** The five Phase-1 open-judgment classes are all recorded not-applicable for this internal docs/test-pin/engine-test epic in `council/phase1-rulings.json`.
- **P1-4 (run-scoped admin + record-push authorization).** For this run only — not extended to any later run — the `main` ruleset's required approving review is satisfied by the sanctioned admin bypass: the single batch merge uses `gh pr merge <PR> --squash --admin --match-head-commit <X>` pinned to the exact SHA the merge check was read against; the step-12 direct record push to `main` for the five cards' board/card transitions; and the push of the Phase 1 record (`council/phase1-rulings.json`). Without this record the bypass must not be used.
- **P1-5 (scope and promotion).** All five cards are in scope regardless of their current `Ready`/`Backlog` state; the single runner moves each through the board (`In Progress` as owner work starts, `Done` on the merged SHA). No card is retired.
- **P1-6 (first merge).** The human selected fully unattended; P1-4 stands as the merge authorization and no merge pauses for a human.
- **P1-7 (run ending).** After the batch merge lands and all five cards are `Done`, the run ends; `steward` rules EPIC-25's closure.

## Acceptance

- All five children are merged with the `gates` workflow green on each merged
  SHA — or a child is explicitly dispositioned (retired/absorbed) on the record
  with the ruling that produced it.
- `bun test`, `bunx tsc --noEmit`, and `python3 council/validate.py` pass on the
  merged tree.