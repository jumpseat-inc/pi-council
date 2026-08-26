---
id: EV-7
title: Render the job tree inline beneath the input bar with per-row last activity
state: Deliberating
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

## Deliberation record

Step 1 gate: full council, surface-touching (designer seated).

### Round 1

**owner (independent):** Recommends `ctx.ui.setWidget("council-tree", factory, { placement: "belowEditor" })` function-form; the only public API owning the below-editor strip. Rejects `ctx.ui.custom({overlay:false})` (replaces whole interactive surface, owns input), setFooter/setStatus (no region), setEditorComponent (hijacks input), and the modal (what the card removes). Data source: manifests via `readManifests`→`buildTree`→`flattenTree`, last-activity from session transcript per node with manifest fallback. **Crux finding:** JSONL envelope carries an entry-level timestamp but `parseTranscript`/`TranscriptBlock` currently discard it; so "age" requires extending `TranscriptBlock` with the entry timestamp and threading it through `parseTranscript` (small, concrete, testable). Pure helper `lastActivity(node, now)` returns `{kind,label,atMs}`; manifest fallback (`startedAt` → "spawned Xs", `settledAt` when done). 2s `setInterval` in factory, cleared in `dispose()`. Theme: reuse NavTheme accent/dim/success/warning/muted, `truncateToWidth` ANSI-safe, token-only. Render tests: (1) fixture transcript → last block is toolCall bash with its ts; (2) deterministic age via injected now; (3) no-session fallback to manifest; (4) fixed-clock render test for the designer-format activity, no literal hex/ANSI. **Testable claims:** parseTranscript drops envelope timestamp (fails today, passes after change); setWidget(name,factory,{placement:"belowEditor"}) is the vehicle; lastActivity fallback; abstract render. Tradeoffs: root/absent-session nodes degrade to manifest timing (no fakeable transcript activity); no key binding (correct, EV-8).

**principal (independent):** — Reframes EV-7 as a consolidation card, not a presentation change: three partial surfaces already ship (plain-text live widget `index.ts:34-42`/`89-107` with per-seat `last:` activity from hub memory, polled 5s, zero-ANSI — a settled EV-4 §8/§11 contract; modal tree in `navigator.ts:80-127` from disk manifests, polled 2s, token-colored frame). They collide on three things the card asks to unify: data source (hub memory vs disk manifest), styling contract (plain vs token), refresh ownership (5s index.ts vs 2s navigator.ts). **The "last activity" seam is a timestamp problem, not a copy problem:** `RunManifest` has startedAt/settledAt but no `lastActivityAt` and `writeJobManifest` never writes one; `TranscriptBlock` and `parseTranscript` discard the JSONL timestamp; only hub in-memory `Job.lastActivityAt` exists, never persisted and unreachable from the disk-reading navigator. So "with its age" forces a hub.ts write change, navigator→hub coupling, or transcript timestamp extraction. **Vehicle seam is sharpest:** belowEditor push-up and token-colored rows are mutually exclusive under settled EV-4 — string-array form pushes up but is plain-only (§8/§11, closed Skeptic D.1/D.2, no handleInput); factory form is token-colored but rejected by EV-4 §8, dropped in rpc-mode (`docs/rpc.md:1286-1301`), not re-invoked on theme change (reopens EV-4 cache-stale trap). `ctx.ui.custom` overlay covers, non-overlay replaces. So pi's documented API has no single vehicle doing both. **Design-judgment questions:** Q1 vehicle — plain-text inline (consistent with settled contract, theme-token collapses to zero-ANSI) vs reopen EV-4 §8 for factory (product-owner ruling against closed Skeptic D.1/D.2, vanishes in rpc); Q2 one panel or two (does belowEditor tree replace index.ts's council widget, or coexist); Q3 last-activity source matching the vehicle's data reach (hub memory / manifest+new field / transcript+extraction); Q4 scope/height (manifest tree spans 15 runs; widget only shows running); Q5 toggle lifecycle (command handler flips from blocking to fire-and-forget; console fallback has no toggle; does ctrl+shift-t flip it). Resolutions: order vehicle→styling contract→source. **Testable claims:** C1 manifest can't carry age today (`readManifests` objects have no lastActivityAt); C2 transcript can't carry age (parse discards line timestamp); C3 token-widget ∩ zero-ANSI mutually exclusive as tests (one currently-green assertion must change either way); C4 factory-form = rpc regression (rpc mode sees nothing).

**designer (independent):** — Inline panel must read at a glance, one row per job, stable left edge + verb-first last-activity summary in a budgeted right column, dim non-running rows, single hint line naming `/council-tree` as close. **Six instruments grounded in artifacts:** (1) stable mapping — left edge anchored in fixed columns (glyph 3, seat 12, elapsed 6, dim `·` separator) from `navigator.ts:135`, drops `{id}` (keyboard-nav territory, EV-8); (2) knowledge-in-the-world — last-activity copy is verb-first noun phrase from `TranscriptBlock.kind`, never a transcript excerpt (`toolCall.label`+first arg, `thinking → "thinking…"`, assistant → first verb, user → idle); (3) constraint+budget — `interactive-mode.js:1746 MAX_WIDGET_LINES=10`; factory form escapes cap but budget 1+9 rows; dock at `:648-654` shows editor sandwiched; (4) feedback+tolerance — non-running rows dimmed `theme.fg("dim",…)`, running-first order: running→stalled→failed→done; (5) forcing function on close — no in-panel button; `/council-tree` toggle removes via `setWidget(key, undefined)` (`:1683-1686`); hint line is knowledge-in-the-world, EV-8 layers keys; (6) token-only drawing — factory form (theme-receiving, `core/extensions/types.d.ts:97-100`), no inline ANSI/hex (AGENTS 9.6, EV-4 settled), factory `invalidate()` repaints on mid-session recolor. **Falsifiable predictions:** P1 verb-first copy scannable; P2 left-edge stable across refreshes; P3 dim non-running rows; P4 running-on-top order; P5 close-by-reinvoke removes widget; P6 coexist with aboveEditor widget (editor ≥5 rows on 24-row terminal); P7 no jumpy layout on 2s refresh; P8 theme repaint on .council.json watcher; P9 empty-state silence (zero lines when nothing running); P10 zero inline code/glyph in production. **Preferences, ranked last:** (a) collapse aboveEditor widget to count when tree visible (scope call, flag to product-owner if P6 fails); (b) EV-8 cursor prefers selectedBg over accent; (c) failed seats stay single-line, EV-9 enter-for-transcript is depth-on-demand.

## Phase 1 rulings (binding, immutable for EPIC-2)

1. **Last-activity copy delegates to the designer.** The card's own wording
   stands — "the council picks the source and the exact copy, and the
   designer seat decides how it reads at a glance." No Phase 1 ruling fixes
   a format. A runner applies this card's intent as-is; the designer's
   glance decision is final unless the designer itself raises a dispute,
   which routes per the EPIC-2 judgment table. (Orchestrator Phase 1,
   2026-08-26.)
