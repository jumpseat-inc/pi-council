---
id: EV-7
title: Render the job tree inline beneath the input bar with per-row last activity
state: Ready
owner: null
epic: EPIC-2
goal: /council-tree renders the live job tree as an inline panel beneath the input bar that pushes message content up instead of dimming the terminal with a modal, with each row showing that subagent's last activity next to the seat name
---

## Intent

The current /council-tree surface is a modal (withModalFrame over
ctx.ui.custom with overlay: true): backdrop plus centered panel, and
the session underneath is invisible while it is open. This card
replaces that with an inline panel in pi's below-editor region — the
status-bar area beneath the input text bar — so message content is
pushed up instead of covered. pi exposes setWidget with
{ placement: "belowEditor" } for exactly this region; the council
decides whether that is the right vehicle or whether a different
mechanism serves the push-up requirement better.

User-visible surface: a full-width panel beneath the input bar. Rows
keep the current information — state glyph, job id, seat — and gain
the missing piece the maintainer asked for, the subagent's last
activity rendered next to the seat name (for example the latest
transcript event such as the most recent tool call, with its age).
"Last activity" derives from the seat session transcripts
(extensions/transcript.ts) and/or run manifests (extensions/runs.ts)
— the council picks the source and the exact copy, and the designer
seat decides how it reads at a glance. The panel refreshes live while
visible, on par with the modal's 2-second polling today, and
council-drawn output uses pi theme tokens only (AGENTS.md convention
9.6). The no-UI fallback (text tree to console) is preserved.

This card is display-only: focus and key navigation belong to EV-8.

## Acceptance

- With a live job dispatched, /council-tree shows the panel beneath the
  input bar; the message area is pushed up rather than covered.
- Each row shows the seat name and a last-activity summary that updates
  as the job makes progress.
- Re-invoking /council-tree (or the documented close action) removes the
  panel and restores the normal layout.
- Render tests cover the new row format and the last-activity text against
  fixture manifests and transcripts; `bun test` and `bunx tsc --noEmit`
  pass.
