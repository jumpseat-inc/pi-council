---
id: FLLWUP-36
title: Deferred no-behavior-change cleanups: drop the dead TranscriptView renderer and the FLLWUP-50 refresh cosmetics
state: Backlog
owner: null
epic: EPIC-19
goal: extensions/navigator.ts holds exactly one TranscriptView head/body renderer (the EV-34 unitLines/bodyLines path, dead blockLines deleted), and the three FLLWUP-50 skeptic cosmetics are cleaned (the void recordDirty dead variable, the scaffoldPackageVersion duplication, and the no-op creationPass filter), with no rendered line changing and the full gate set green.
---


## Intent

EV-34 composed each tool call and its result in `unitLines` and routed
`render` through it, but left the pre-EV-34 `blockLines` in the class with no
call site, still carrying the superseded head shapes — two implementations of
the transcript head shapes in one class. The step-9 Skeptic ran the grep
evidence and closed the observation `closed-green` (dead code, no behavior
change, "a possible cleanup, not a block").

---

### Absorbed: FLLWUP-64 — Cosmetic cleanup of the FLLWUP-50 refresh surface (dead variable, duplicated helper, creationPass filter)

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

## Acceptance

- grep finds no unreferenced head renderer in `TranscriptView`.
- No rendered line changes (`test/ev34-tool-unit.test.ts`,
  `test/navigator.test.ts`, `test/ev7-council-tree-widget.test.ts`,
  `test/theme-compliance.test.ts` stay green).
- The three gates stay green.

---

### From FLLWUP-64 — Cosmetic cleanup of the FLLWUP-50 refresh surface (dead variable, duplicated helper, creationPass filter)

(No separate Acceptance clause — see its Intent above.)
