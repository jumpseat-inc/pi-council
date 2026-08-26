---
title: 2026-08-25 "/council-tree Full-Screen Modal Backdrop" Fix (v0.11.4)
type: source
summary: The v0.11.4 fix — /council-tree and the transcript viewer render as full-screen modals (opaque backdrop + bordered panel), because the TUI overlay compositor offers no backdrop of its own.
aliases: []
tags: [pi-council/source]
sources: ["[[2026-08-24-unattended-smoke-test-plan]]", "[[2026-08-25-remote-mcp-oauth]]"]
created: 2026-08-25
updated: 2026-08-25
---

> ⚠️ Derived from commit `573f8de` "fix(navigator): render /council-tree as a full-screen modal with blocked backdrop" (captured 2026-08-25). Version bump 0.11.3 → 0.11.4 (patch).

The v0.11.4 bugfix — `/council-tree` (and the per-job transcript viewer it
opens) rendered as bare overlays with no background blocking the underlying
session UI, making the tree unreadable.

## Root cause

The TUI overlay compositor has **no backdrop by design**. `OverlayOptions`
(`@earendil-works/pi-tui` `tui.d.ts`) exposes only width/maxHeight/anchor/
margin/offset/visible — no `background`/`dim`/`opacity` field — and
`compositeTuiLine` just **splices** the component's rendered lines over the
base screen at the overlay's `(row, col)`. The base content around and behind
the overlay stays visible. Therefore **the component itself must draw any
blocking background** — and neither council component did: `CouncilTree.render()`
and `TranscriptView.render()` returned only their content lines with no fill.
pi's own `confirm`/`select` never hit this because they *replace* the editor
container content rather than overlaying it.

## The fix

- **`withModalFrame(theme, width, rows, content, opts)`** — new pure helper:
  full-screen **opaque backdrop** (`theme.bg("customMessageBg")`) applied to
  every terminal row, plus a **centered bordered panel** (`theme.fg("border")`
  rails + `┌─┐│└┘`) holding the content. Exact terminal width per row, so the
  base screen is fully blocked.
  - Nests cleanly because `theme.fg` resets with `\x1b[39m` and `theme.bg`
    with `\x1b[49m` (scoped resets, not `\x1b[0m`), so foreground-colored
    content under the backdrop background keeps its color.
- Both open paths (the tree and the transcript viewer) now pass
  `overlayOptions: { width: "100%", maxHeight: "100%", margin: 0, anchor: "top-left" }`
  — which resolves to row 0 / col 0 and exactly the visible viewport — and
  wrap their `render()` in `withModalFrame`.
- **`CouncilTree` gained a `maxRows` window** around the selection, so a long
  job tree stays within the panel and the highlighted row stays visible
  (with a `… N more` overflow hint).

## Test hardening

Two new unit tests for `withModalFrame`: full-screen coverage (one line per
terminal row, every line passes through the backdrop bg, exact terminal
widths) and panel-height capping (overflow content dropped). Existing
`CouncilTree`/`TranscriptView` component tests kept passing — they render
content directly, so the frame is applied only at the `ui.custom` integration
layer.

## Related

- [[run-transcripts]] — the `/council-tree` overlay subsystem this fixes
- [[hub-job-supervision]] — the job table the tree visualizes
- [[pi-council-overview]] — version arc v0.11.3 → v0.11.4

## Sources

- Commit `573f8de` on `main`
- `extensions/navigator.ts` (`withModalFrame`, both `ui.custom` open paths)
- `test/navigator.test.ts`
- pi docs: `docs/tui.md` (Overlays), `@earendil-works/pi-tui` `tui.d.ts`
  (`OverlayOptions`), `interactive-mode.js` (`showExtensionConfirm`)
