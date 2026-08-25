---
id: EV-4
title: Theme compliance and live repaint of council surfaces
state: Ready
owner: null
epic: EPIC-1
goal: Every council-drawn element from the /council-tree modal and transcript viewer to the widget and command outputs draws from pi theme tokens and repaints when the active theme changes mid-session
---

## Intent

User-visible surface: the /council-tree modal (backdrop, panel borders,
selection cursor, job glyphs, transcript headers, block labels, footer
hints) and the transcript viewer — plus the non-modal council text the
extension draws: the status widget (renderWidget in index.ts), the
/council-jobs table, and the /council-init summary. The designer seat must
sit on this card: it changes what a driver sees.

Today the modal already consumes pi Theme tokens (accent, border,
customMessageBg, dim, success, warning, muted, bold in navigator.ts), so
most of the work is audit + fill gaps, not greenfield:

- Every drawn element maps to a pi token; nothing hardcodes a hex or ANSI
  code that ignores the active theme.
- The widget and /council-jobs output are plain text — decide token use
  (e.g. seat name in accent, state in success/error) per what pi's widget
  renderer supports.
- Live repaint: pi's theme can change mid-session (/settings, hot reload).
  The modal is opened with the theme captured at open time — verify whether
  an open modal repaints on theme change and fix if not (re-read the active
  theme on render or re-open).
- Snapshot tests: render modal / viewer / widget with a known fake theme and
  assert the expected ANSI token codes per line; simulate a theme switch and
  assert repaint.

## Acceptance

- Grep-audit: no hardcoded color codes in council-drawn output (all through
  theme.fg/bg/bold or pi-rendered primitives).
- Snapshot test renders the modal with a fake theme and every line carries
  the expected token codes; same for the viewer, widget, and /council-jobs.
- A simulated mid-session theme switch repaints an open modal (test proves
  the new palette appears without closing/reopening, or the fix is
  documented if pi cannot support it).
