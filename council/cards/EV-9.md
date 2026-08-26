---
id: EV-9
title: Open the selected subagent's progress from the inline tree
state: Ready
owner: null
epic: EPIC-2
goal: Pressing enter on the selected row of the inline tree opens that subagent's live progress view with the same streaming transcript content the modal viewer shows today, and closing it returns focus to the tree with the selection preserved
---

## Intent

Today, enter on a selected job inside the modal opens TranscriptView:
a live, auto-following view of the seat's session transcript with
expand/collapse, thinking toggle, and follow mode. This card wires
that progress experience to the inline tree from EV-7 and EV-8: enter
on the highlighted row opens the selected subagent's progress, and the
driver comes back to the tree afterwards with the selection intact.

User-visible surface: the progress view itself. Open question for the
council and designer: whether it renders as the current modal overlay
(reusing TranscriptView wholesale, lowest risk) or inline as an
expansion of the tree panel's region (more consistent with the new
surface, more work). Either way, the content contract is parity with
the current modal viewer — same streaming blocks, same expand and
follow behavior — and the tree's last-activity rows keep updating
while progress is open. If the council keeps the modal, opening it
from the inline tree must not destroy the tree panel or its focus
state on close.

Depends on EV-7 and EV-8.

## Phase 1 rulings (binding, immutable for EPIC-2)

1. **Progress renders inline, as an expansion of the tree panel's region.**
   The selected subagent's live progress view (TranscriptView content
   contract: same streaming blocks, expand, thinking, follow) is rendered
   inline in the below-editor region as an expansion of the tree panel,
   not as the full-screen modal overlay. The tree panel and its rows stay
   visible above the progress expansion. The driver comes back to the
   tree with the selection intact. (Orchestrator Phase 1, 2026-08-26.)

## Acceptance

- Enter on a highlighted running job shows its transcript streaming live
  (user/assistant/tool blocks appear as the seat works).
- Closing the progress view returns to the inline tree with the same row
  selected; tree last-activity values kept updating while progress was open.
- Transcript parity with the current modal viewer is covered by tests on
  shared rendering code; `bun test` passes.
