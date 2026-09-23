---
id: EPIC-16
title: Close the decisions-gate residuals — question data, loader invariants, routing execution, gate surfaces, and the follow-up sibling
state: Backlog
owner: null
epic: null
goal: The decisions gate's filed residuals are all delivered — the user-visibility question, the executable merge-check table, the refreshed merge-check wiki, the slow-call signifier, the usage-block legend, the cross-file questions↔weights equality, the prototype-chain loader class, the metering repair, the follow-up board cap, and the follow-up http-404/advisory-arm amendments — with `python3 council/validate.py`, the full `bun test`, and `bash council/preflight.sh` green on the run's merged SHAs.
---

## Intent

Residuals of the EPIC-13 metered-deliberation routing gate and its EPIC-10 follow-up sibling. They span the gate's question data, its loader invariants, the executable merge check, the in-window and failure copy, the usage-block exclusion legend, and the follow-up review's state packing and render surface. Grouped because every child touches the same two gate domains (`council/gate/**`, `extensions/gate*.ts`) and shares the same test/fixture surface.

Children:

- FLLWUP-71
- FLLWUP-72
- FLLWUP-73
- FLLWUP-75
- FLLWUP-77
- FLLWUP-82
- FLLWUP-83
- FLLWUP-99
- FLLWUP-97
- FLLWUP-102

## Acceptance

Every child card is `Done` with its own goal satisfied, and the repo's gates (`bunx tsc --noEmit`, the full `bun test`, `python3 council/validate.py`, and `bash council/preflight.sh`) are green on each merged SHA. No child is silently dropped: each is delivered, folded, or recorded out of scope with a reason. The epic closes only when its named acceptance outcome is observed on the tree, not merely reported.
