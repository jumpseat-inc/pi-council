---
id: EPIC-21
title: Close the config-runtime and run-start preflight residuals
state: Backlog
owner: null
epic: null
goal: The config-runtime and run-start residuals are delivered — the preflight branch-freshness clause accepts a correctly-based card branch while still failing a genuinely stale one, `.council.json` writes gain a canonical key order and a concurrency discipline, mid-run `.council.json` writes are stability-checked and skip spurious theme reloads, and `/features-new` runs the credential preflight with a stale-scaffold end-to-end proof and a normalized injected-apiKey seam — with the gates green.
---

## Intent

Residuals spanning the EPIC-14 gate-enablement work and the EPIC-7/EPIC-9 preflight. Grouped as run-start safety: the `council/preflight.sh` clauses and the `.council.json` write path whose mid-run edits can alter a run.

Children:

- FLLWUP-27
- FLLWUP-85
- FLLWUP-86
- FLLWUP-89

## Acceptance

Every child card is `Done` with its own goal satisfied, and the repo's gates (`bunx tsc --noEmit`, the full `bun test`, `python3 council/validate.py`, and `bash council/preflight.sh`) are green on each merged SHA. No child is silently dropped: each is delivered, folded, or recorded out of scope with a reason. The epic closes only when its named acceptance outcome is observed on the tree, not merely reported.
