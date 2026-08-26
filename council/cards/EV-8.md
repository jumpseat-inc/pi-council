---
id: EV-8
title: Bidirectional arrow-key focus navigation between the input bar and the inline tree
state: Ready
owner: null
epic: EPIC-2
goal: While the inline tree is visible, pressing down from the focused input bar moves keyboard focus into the tree, up and down move the highlighted selection across rows, and pressing up on the topmost row returns focus to the input bar
---

## Intent

The inline panel from EV-7 must be navigable without leaving the
keyboard's home row, and focus must move cleanly between pi's input
editor and the tree. Contract: with the input bar focused, down moves
focus into the tree; up/down then move a visible highlight across the
tree rows (the tree already keeps the selection on screen when the
panel is shorter than the tree); pressing up on the topmost row
returns focus to the input bar.

User-visible surfaces: the highlighted row state in the panel, and a
clear indication of which surface owns the keyboard (input bar versus
tree) so a driver is never typing into the wrong place — the designer
seat decides the affordance. Text being typed while the input bar is
focused must stay in the editor; while the tree holds focus, arrow
keys must not corrupt editor content, and keys the tree does not
handle must have safe, defined behavior.

Open deliberation points, deliberately left to the council and
designer rather than blocking this card: how keys are routed out of
the editor (pi's CustomEditor/setEditorComponent pattern versus
whatever input channel a below-editor widget can receive — the
council investigates what pi's TUI actually delivers), and the
multi-line rule (for example, down enters the tree only when the
cursor cannot move further down inside a multi-line draft). The
observable contract above is what the judge verifies.

Depends on EV-7 landing first.

## Acceptance

- Interactive walkthrough: focus on the input bar, down enters the tree,
  up/down cycle rows, up on the top row puts the caret back in the input
  bar, and typing after the return lands in the editor.
- The selected row is visually distinct while the tree holds focus, and
  focus ownership is unambiguous.
- Automated tests cover the focus/state machine (down/up transitions and
  selection movement) at the component level; `bun test` passes.
