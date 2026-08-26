---
id: EPIC-2
title: Inline council job tree beneath the input bar
state: Backlog
owner: null
epic: null
goal: The council job tree renders beneath pi's input bar as a live inline panel instead of a full-screen modal, with arrow-key navigation, per-subagent last activity, and enter-to-open-progress on the selected subagent
---

## Intent

Today `/council-tree` (and `ctrl+shift+t`) opens the job tree as a
full-screen modal overlay: a backdrop dims the whole terminal and a
centered panel hides the session underneath while it is open. The
maintainer wants the tree as a first-class part of the main screen
instead — rendered inline at the bottom of pi's chrome, beneath the
input text bar in the status-bar area, pushing message content up to
make room. While the panel is up, the driver keeps seeing the
conversation scroll by above it.

The interaction model is keyboard-driven: the arrow keys move between
the input bar and the tree rows (down enters the tree, up at the top
row returns focus to the input), and enter on a selected subagent
opens that subagent's live progress. Each tree row shows the
subagent's last activity next to the seat name, so glanceable status
doesn't require opening anything.

Scope boundaries: the panel is toggled by the existing /council-tree
command and ctrl+shift+t shortcut; auto-showing it whenever jobs run
is out of scope. The headless (no-UI) fallback that prints a text
tree stays. Engine modules stay inside their current boundaries —
runs/tree/transcript reads go through extensions/runs.ts,
extensions/tree.ts, and extensions/transcript.ts only, and all
council-drawn output uses pi theme tokens (no literal ANSI), per
AGENTS.md conventions 9.6 and 12.

Deliverables across the children: (1) EV-7 — inline rendering with
per-row last activity, (2) EV-8 — focus navigation between the input
bar and the tree, (3) EV-9 — enter opens the selected subagent's
progress. EV-7 comes first; EV-8 and EV-9 build on it.

## Acceptance

- With at least one council job dispatched, /council-tree shows the tree
  inline beneath the input bar; message content is pushed up, not covered.
- Down from the input bar enters tree navigation; up/down move the
  selection; up on the topmost row returns focus to the input bar.
- Enter on a selected row opens that subagent's progress; each row shows
  last activity next to the seat name and keeps updating live.
- All three child cards land with tests; `bun test`, `bunx tsc --noEmit`,
  and `python3 council/validate.py` stay green.
