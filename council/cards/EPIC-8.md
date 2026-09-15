---
id: EPIC-8
title: Elegant tool-call and transcript rendering in the /council-tree inline progress view
state: Backlog
owner: null
epic: null
goal: Tool calls and the surrounding seat transcript render in the /council-tree inline progress view with an editorial, low-noise hierarchy, a visible focus-and-expand interaction model, and legibility that holds from a one-row viewport to a full panel, drawing only pi theme tokens
---

## Intent

The human's intake: when /council-tree is invoked and the transcript of an
agent's session is opened, tool calls are not rendered elegantly. The
transcript should take its taste and interaction design from the
`minimalist-ui` skill available in this repository, and may draw on the
transcript conventions of coding agents such as Claude Code and Codex.

The surface this epic owns is the inline progress view beneath pi's input
bar, the same region the inline job tree renders into. The full-screen modal
transcript path is the legacy path (guarded at navigator.ts:57, the subject
of FLLWUP-4) and is out of scope. `minimalist-ui` is written for web/HTML;
its literal palette, spacing scale, and motion have no legal vehicle here —
council-drawn output draws only pi theme tokens (AGENTS.md 9.6), the inline
viewport budget is an integer row count with a floor of one, and the render
is a pure line slice with no animation surface. The transferable half is the
editorial typographic/structural hierarchy and the scarcity of color; the
human interaction-design half is a visible focus signifier and an honest
keymap.

The inelegance starts at the data layer: parseTranscript drops the call
identity and the error bit, so a tool call and its result arrive as two
unrelated flat blocks with no link. The children therefore order as (1)
EV-33 parser fidelity first, (2) EV-34 composed tool-call unit, (3) EV-35
interaction model, (4) EV-36 one-row floor legibility. EV-34, EV-35 and
EV-36 all edit TranscriptView.render/blockLines in one file, so they land in
sequence.

Boundaries: no new theme tokens, no literal colors or ANSI, no blank-line
gutters as vertical rhythm (the inline path slices to a computed row floor),
and no animation. Every child's tests run under the existing
`test/theme-compliance.test.ts` grep-audit.

## Acceptance

- The four children land in order EV-33 → EV-34 → EV-35 → EV-36, each with
  its own failing-test-first coverage.
- A tool call and its own result render as one unit in the inline progress
  transcript, with a distinct failed-result token and a visible focus
  signifier, at widths from the one-row floor to a full panel.
- `bun test`, `bunx tsc --noEmit`, and `python3 council/validate.py` stay
  green; `test/ev7-council-tree-widget.test.ts` and the EV-8/EV-9 suites
  stay green.