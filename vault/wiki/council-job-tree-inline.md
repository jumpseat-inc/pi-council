---
title: Council Job Tree (inline)
type: concept
summary: EPIC-2's replacement for the /council-tree modal — an inline below-editor panel pushed up by the input bar, with per-row last activity, editor-driven arrow-key focus, and Enter opening the selected subagent's live inline progress expansion.
aliases: [council-tree, inline job tree, council tree inline, job tree]
tags: [pi-council/concept]
sources: ["[[2026-08-26-design-ev8]]", "[[2026-08-26-po-ev8-ruling]]", "[[2026-08-26-design-ev9]]", "[[2026-08-26-design-ev9-round2]]", "[[2026-08-26-po-ev9-tiny-regime-floor]]"]
created: 2026-08-26
updated: 2026-08-26
---

The subject of EPIC-2: `/council-tree` (and `ctrl+shift+t`) renders the live
council job tree **inline beneath the input bar** as a full-width panel —
pushing message content up instead of dimming the terminal with a modal —
with per-row **last activity**, **arrow-key navigation**, and **Enter opening
the selected subagent's live progress** as an inline expansion. It supersedes
the v0.11.4 full-screen modal form of the tree/transcript viewer documented
in [[run-transcripts]].

## The surface (top-down)

```
┌─ council job tree ───────────────────────────────┐
│ ● job-A designer  12s · → ran ls                │
│ ✓ job-B owner     3m                            │
└──────────────────────────────────────────────────┘
  ▾ job-A designer progress · esc back            (divider, only in progress)
  ┌─ progress: job-A ────────────────────────────┐
  │ user ... / assistant ... / → toolcall ...    │
  └──────────────────────────────────────────────┘
```

Exactly one `ctx.ui.setWidget(key, factory, { placement: "belowEditor" })`
(factory/function form). The panel renders in the below-editor region; rows
show a state glyph, the seat name, and the agent's **last activity** next to
it. Display and interaction only — auto-showing whenever jobs run is out of
scope; toggled by `/council-tree` and `ctrl+shift+t`; the headless text-tree
fallback and the ambient above-editor widget both stay.

## EV-7 — inline rendering + last activity

- **Vehicle:** `setWidget(key, factory, { placement: "belowEditor" })`
  (factory form, strict-tsc valid). TUI-only: the widget path guards on
  `ctx.mode === "tui"` — NOT `!ctx.hasUI` (which returns true in RPC and
  would silently walk a dropped factory). Headless/RPC routes to the console
  `textTree` fallback (see [[headless-pi]]).
- **Last activity:** the session transcript is the authoritative source. The
  JSONL `timestamp` (previously discarded) threads through the parser into
  `TranscriptBlock.at`; a row's last activity = the block with max `at`
  (age = `now − at`). **NaN-safe:** a fixture `"timestamp":"t"` → `NaN` is
  treated as absent, falling back to manifest `startedAt` ("spawned").
  Non-running rows collapse to manifest state + `settledAt`. Reads are
  **tail-reads** (cached `TranscriptTail`/last-line seek), not a full parse
  per row per 2s tick. **No `hub.ts` write change** (AGENTS.md #7).
- **Copy (Phase-1 binding):** the exact last-activity wording and layout
  delegate to [[designer]]; the GLANCE format is glyph/seat/verb-first
  activity + age, running-first order, `MAX_WIDGET_LINES = 10` (1 hint + 9
  rows), token-only drawing.

## EV-8 — editor-driven focus (binding PO ruling)

Focus ownership is **editor-driven** — see [[2026-08-26-po-ev8-ruling]]. The
editor stays the sole always-focused component; "tree focus" is the
`controller.surface` state (`"editor" | "tree" | "progress"`) enforced by a
`CustomEditor` subclass composing over `getEditorComponent()`. **No
`setFocus(widget)`** (pi never focuses widgets; and extension dialogs
`dismissDialog → setFocus(this.editor)`, which would steal focus). While
`surface === "tree"` the override **consumes only Up/Down/Enter/Escape** and
forwards everything else to `super.handleInput` (forward-unhandled), so
ctrl+c/ctrl+d/printables still reach the editor. Affordances: a `▌` (U+258C)
marker on the selected row + a vim `-- TREE --` border label, both reading
the same `surface` state. The multi-line rule derives from the editor's own
visual-line predicates.

## EV-9 — inline progress expansion (binding Phase-1 ruling)

Enter on a highlighted row opens the subagent's live transcript **inline as
an expansion of the tree panel's region** (a binding ruling — not the modal).
Tree rows stay visible above a dim divider (`▾ <seat> progress · esc back`),
then the existing `TranscriptView` lines. Content contract is parity with the
former modal viewer: same streaming blocks, expand/thinking/follow. While
progress is open, the tree's selection stays frozen on that seat (other
glyphs still tick). Escape returns to the tree with selection preserved
(`backFromProgress`, a transition that never calls `exit()` so the selection
isn't nulled). **Tiny-regime floor (binding):** minimum supported terminal
height for opening progress is **7 rows**; at `termRows ≤ 6` Enter is a
consumed no-op (see [[2026-08-26-po-ev9-tiny-regime-floor]]).

## Why inline and not a modal

The maintainer wants the tree as first-class chrome, not an overlay: the
person keeps seeing the conversation scroll above while the panel is up. The
modal's full-screen backdrop (v0.11.4) hid the session; the inline panel
lives in the status-bar region and pushes content up instead. The former
modal code path remains only behind the `navigator.ts:57` guard targeted by
FLLWUP-4 (RPC silent-no-op repair) — a contradiction/evolution of the v0.11.4
"modal presentation" claim in [[run-transcripts]].

## Consumers & governance

- Theme: the panel draws **only pi theme tokens** (no literal ANSI/hex),
  per AGENTS.md 9.6 and [[council-theme]]; live repaint follows `invalidate()`.
- The read path stays inside `extensions/runs.ts`, `extensions/tree.ts`,
  `extensions/transcript.ts` (the substrate in [[run-transcripts]]).
- Interaction/route logic lives in `extensions/focus-nav.ts` /
  `extensions/navigator.ts`.

## Related

- [[run-transcripts]] — the on-disk substrate (manifests, JSONL, forest,
  parser) this surface reads; now presents the *inline* form
- [[council-theme]] — the token-only drawing + live repaint it follows
- [[headless-pi]] — the `ctx.mode === "tui"` guard / RPC fallback
- [[council-job-tree-inline]] sources: [[2026-08-26-design-ev8]],
  [[2026-08-26-po-ev8-ruling]], [[2026-08-26-design-ev9]],
  [[2026-08-26-design-ev9-round2]], [[2026-08-26-po-ev9-tiny-regime-floor]]
- [[seats]], [[product-owner]], [[skeptic]] — the actors whose rulings shaped it

## Sources

- `docs/superpowers/specs/2026-08-26-EV-7-design.md`,
  `2026-08-26-EV-8-design.md`, `2026-08-26-EV-9-design.md`
- `extensions/navigator.ts`, `extensions/focus-nav.ts`
- [[2026-08-26-design-ev8]], [[2026-08-26-po-ev8-ruling]],
  [[2026-08-26-design-ev9]], [[2026-08-26-design-ev9-round2]],
  [[2026-08-26-po-ev9-tiny-regime-floor]]
