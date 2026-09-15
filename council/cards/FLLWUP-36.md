---
id: FLLWUP-36
title: Remove the unreachable pre-EV-34 transcript renderer left in TranscriptView
state: Backlog
owner: null
epic: EPIC-8
goal: `extensions/navigator.ts` holds exactly one `TranscriptView` head/body renderer — the EV-34 `unitLines`/`bodyLines` path — with the unreferenced private `blockLines` method deleted, and `bash council/preflight.sh`, `bun test`, `bunx tsc --noEmit`, and `python3 council/validate.py` stay green.
---

## Intent

EV-34 composed each tool call and its result in `unitLines` and routed
`render` through it, but left the pre-EV-34 `blockLines` in the class with no
call site, still carrying the superseded head shapes — two implementations of
the transcript head shapes in one class. The step-9 Skeptic ran the grep
evidence and closed the observation `closed-green` (dead code, no behavior
change, "a possible cleanup, not a block").

## Acceptance

- grep finds no unreferenced head renderer in `TranscriptView`.
- No rendered line changes (`test/ev34-tool-unit.test.ts`,
  `test/navigator.test.ts`, `test/ev7-council-tree-widget.test.ts`,
  `test/theme-compliance.test.ts` stay green).
- The three gates stay green.

## Phase 1 ruling (features-deliver, EPIC-8)

This card is a **confirmed new follow-up, not a fold-in**: EV-34's goal is
fully met by `unitLines`, so removing `blockLines` is not a code change
needed to honestly meet any card's goal. Confirmed by `steward` under
**R-FOLLOWUP** at step 13 of the EV-34 run against merged SHA
`72351780e2f9974926404d26f9679b385d2f1e5f` (PR #48).

The card stays `Backlog` as drafted. `R-ORDER` (pinned EV-33 → EV-34 →
EV-35 → EV-36) is a recorded human decision and is not touched; EV-35 and
EV-36 are `Ready` and are the run's next work, and adding a third concurrent
writer to `TranscriptView` — the file both of them edit — would interleave
with the pinned sequence for no gain. Promotion is a later, human-reachable
call.
