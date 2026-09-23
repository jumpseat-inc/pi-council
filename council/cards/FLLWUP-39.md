---
id: FLLWUP-39
title: Dispose the replaced transcript view when the inline progress surface switches sessions
state: Backlog
owner: null
epic: EPIC-19
goal: Switching the inline progress surface to another seat's session disposes the replaced `TranscriptView`, so its one-second interval is cleared and its `onChange` can no longer fire, proven by a session-switch assertion that the replaced view is disposed and only one view remains live.
---

## Intent

`ensureView` (`extensions/navigator.ts:437-461`) builds a `TranscriptView`
per selected session and installs it in `viewFor` and as
`controller.viewHost`; when the selection moves to another session it
replaces `viewFor` without calling the outgoing view's `dispose()`
(`:642-644`, which clears the interval), so the replaced view keeps polling
its own transcript file every second and its `onChange` — `this.refresh()`
plus `this.onRender?.()` (`:448-452`) — stays reachable from a view the
widget no longer hosts, letting a stale view whose file is still being
written drive redundant widget refreshes for the life of the parent
session.

This is a lifecycle defect, not a rendering change. No existing card owns
it: `FLLWUP-36` covers the dead renderer, `FLLWUP-4` the modal RPC path.

## Acceptance

- Switching the inline progress surface to another seat's session disposes
  the replaced `TranscriptView`, asserted by a session-switch test that the
  replaced view's interval is cleared and its `onChange` can no longer fire.
- Only one `TranscriptView` remains live after the switch.
- EV-7/EV-8/EV-9/EV-35 suites stay green; render output is unchanged; the
  three gates stay green.

## Phase 1 ruling (features-deliver, EPIC-8)

Confirmed by `steward` under **R-FOLLOWUP** at step 13 of the EV-35 run
against merged SHA `85db7a689c8ab7df1fb87f3843d5465fd3d7d8e8` (PR #49) as a
**new follow-up, not a fold-in**. Ruled against a standalone `BUG` card —
`ensureView` is the epic's own named surface, and a card outside the epic
touching `navigator.ts` while EV-36 still writes there is the interleaving
the one-writer discipline avoids.

The card stays `Backlog` as confirmed. `R-ORDER` is untouched and promotion
is a later, human-reachable call.
