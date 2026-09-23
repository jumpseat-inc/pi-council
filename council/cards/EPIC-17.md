---
id: EPIC-17
title: Close the usage-accounting residuals and add retention for the append-only stores
state: Backlog
owner: null
epic: null
goal: The usage-accounting lineage's filed residuals are delivered — the per-run token ceiling guard, the full `cellScope.usage` tuple with the eval-store contract amendment, Anthropic `cacheWrite1h` persistence, the opt-in live usage falsifiers, per-node subtree reconciliation, the bounded usage-store retry policy, the usage/accounting wiki page, and retention policies for `council/eval-results` cohorts and the durable usage store — with the gates green.
---

## Intent

Residuals of the EPIC-7 token/cost accounting subsystem, plus the retention question shared by the two append-only stores (the eval-results cohort store and the durable usage store). Grouped because every child reads or extends the same usage tuple, store, and provenance machinery.

Children:

- FLLWUP-26
- FLLWUP-28
- FLLWUP-29
- FLLWUP-30
- FLLWUP-31
- FLLWUP-34
- FLLWUP-35
- FLLWUP-7

## Acceptance

Every child card is `Done` with its own goal satisfied, and the repo's gates (`bunx tsc --noEmit`, the full `bun test`, `python3 council/validate.py`, and `bash council/preflight.sh`) are green on each merged SHA. No child is silently dropped: each is delivered, folded, or recorded out of scope with a reason. The epic closes only when its named acceptance outcome is observed on the tree, not merely reported.
