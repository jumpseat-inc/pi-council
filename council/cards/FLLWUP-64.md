---
id: FLLWUP-64
title: Cosmetic cleanup of the FLLWUP-50 refresh surface (dead variable, duplicated helper, creationPass filter)
state: Backlog
owner: null
epic: EPIC-9
goal: The three FLLWUP-50 skeptic cosmetic findings (the `void recordDirty` dead variable in `applyRefresh`, the `scaffoldPackageVersion` duplication across `extensions/scaffold.ts` and `extensions/council-update.ts`, and the no-op `creationPass` filter with its comment) are cleaned without behavior change, and the full gate set stays green with the record-state, notification, and consent pins untouched.
---

## Intent

Filed by the FLLWUP-50 step-13 record (EPIC-9 residuals run 2). The
skeptic's step-9 verification at PR #72 head `d3de248` reported "no
blocks" with three explicitly non-blocking cosmetic notes (quoted from its
report):

1. "`void recordDirty` dead variable in `applyRefresh`";
2. "`scaffoldPackageVersion` duplicated across scaffold.ts/council-update.ts";
3. "the creationPass filter (`includes("/")` or `.json`) is effectively a
   no-op and may report `mcp.json` under `+ created` if it was missing —
   copy looseness, no write-rule impact."

None affects the write rules, the record semantics, or the consent
boundary — all of which are pinned by test/council-update.test.ts and must
stay green through this cleanup. Pure refactor card; no deliverable
change.

## Origin

FLLWUP-50 step 9 (skeptic job-14.2 report, "non-blocking cosmetic notes").
