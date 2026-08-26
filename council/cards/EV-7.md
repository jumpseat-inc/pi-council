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

### Round 2

**owner (round 2):** Verified `types.d.ts:97-98` — both `setWidget` overloads
(string[] and function) accept `ExtensionWidgetOptions.placement:
"aboveEditor" | "belowEditor"` (`types.d.ts:43-47`). So factory +
`belowEditor` is **type-valid**; the principal's mutual exclusion exists only in
rpc-mode (`rpc.md:1301` "Only string arrays supported in RPC mode; component
factories are ignored"). That rpc drop **does not matter for /council-tree**:
this is a TUI-interactive surface (input bar, message area — absent in RPC);
its no-UI fallback (`navigator.ts open()` guards `!ctx.hasUI`) already covers
headless. Owner will guard with `ctx.mode === "tui"` (not just `hasUI`, which
turns true in RPC) so RPC never walks the widget path silently. Hold: the
factory is the sanctioned path (designer instrument 6), no EV-4 §8 reopening
needed. **Source:** confirms C1/C2 — `runs.ts` `RunManifest` has no
`lastActivityAt`; `hub.ts:118-130 writeJobManifest` writes none;
`parseTranscript` discards the line timestamp. But the ISO `timestamp` already
lives on every txn line of the `.jsonl`. Cheap fix: extend `TranscriptBlock`
with `at: number = Date.parse(e.timestamp)` (fall back to `message.timestamp`).
`lastActivity` for a seat = block with max `at`; age = `now - at`. This
sidesteps all of `hub.writeJobManifest` coupling. Transcript is authoritative
last-activity source; manifest contributes seat/id/state/parent for tree
shape; hub memory redundant. No hub change (proto = AGENTS #7 guards hub).
Q2 coexist: owner leans tree on-demand + ambient widget stays; whether the
widget dims while tree is open is a PO/designer call, not engineering.
Remaining open (stated plainly): Q2 visual overlap is PO/designer; must scope
`lastActivity` to the current run's session for re-spawned seats
(`currentRunId` vs `scopeAll`). Testable claims: (1) parseTranscript preserves
ISO `at` + max by `at`; (2) a two-line transcript with increasing timestamps
returns block 2 as last-activity (fails today on current `parseTranscript`);
(3) `setWidget(key, factory, {placement:"belowEditor"})` compiles under strict
`tsc` (+ an acceptance-mode `--mode tui` no-fallback pin).

**admin note:** The principal's first Round 2 dispatch returned state
`done` with `stopReason=stop` and zero text output. Re-dispatched once with the
same input per dispatch discipline; that re-dispatch settled with the full
position below.
**principal (Round 2, re-dispatch verdict):** uncovered two blind spots before
accepting. (1) both owner and designer validate factory + `belowEditor` from
the *type contract* height but miss a repaint/live-theme pin residual: the
factory is invoked once; a theme swap must re-render via the component's
`render()` applying tokens at render time (never baked in the factory body),
with the 2s interval / an explicit `invalidate()` as the repaint trigger; otherwise the panel sits stale across a mid-session
`.council.json` recolor -- the exact cache-stale trap EV-4 closed (D2 ghost).
(2) **per-refresh read cost** -- last-activity for N running sessions every 2s;
promoting transcript to authoritative source must not be a full
`parseTranscript` per node per tick (O(rows x file)); the read must be a
**tail-read** (cached TranscriptTail or last-line seek), not a full parse.
Also **NaN-stamp**: every existing fixture stamps `"timestamp":"t"` (a
placeholder; `Date.parse("t")` === NaN); `lastActivity` must treat NaN as
absent and fall back to manifest `startedAt` -- the age assertion needs real
ISO stamps in fixtures. **Verdict ACCEPT with 3 shipping conditions** for the
owner: (1) repaint pin -- test asserting the factory re-renders the live theme
on a normal tick after a theme swap without calling the factory again
(mirroring `theme-repaint.test.ts:116-127`); (2) session-teardown --
`setWidget(key, undefined)` is called on `session_shutdown`, not just the
interval, per the stale-ctx rule; (3) NaN-fallback + tail-read on the
authoritative-`at` source claim. Q2: coexist (engineering); whether the
above-editor widget dims while the tree is open is attributed to the designer,
PO escalation if P6 (editor >=5 rows on a 24-row terminal) fails. Q3: settled
as transcript `at` + manifest fallback, NaN-safe, tail-not-full-parse. Q4:
default current run (parity with the modal's `scopeAll=false`); height budget
= `MAX_WIDGET_LINES=10` (1 hint + 9 rows). Q5: stateful parent-side toggle,
`ctrl+shift+t` reuses it, console fallback print-once, `session_shutdown`
teardown. Testable claims: T1 source (ISO-stamped last block `at` ===
Date.parse(lastStamp); `"t"` => NaN => manifest fallback), T2 vehicle (strict
`tsc`; factory invoked once; `render()` re-reads theme tokens each call), T3
repaint residual D2 (theme swap -> re-render with new tokens, no second factory
call), T4 no-RPC-regression (RPC mode routes to console `textTree`, never calls
the factory; assert guard `ctx.mode === "tui"`, not `hasUI`).
**designer (Round 2, glance + copy decisions):** "Ends the round with a
GLANCE snippet the owner implements from." **GLANCE DESIGN**:
- **Vehicle:** factory form `setWidget("council-tree", factory,
  {placement:"belowEditor"})`, TUI-only; headless = textTree (fallback unchanged).
- **Token plan per row state:** RUNNING accent, DONE success, FAILED error,
  STALLED warning, CANCELLED dim, TIMEOUT warning, ORPHANED error.
- **Row layout / stable left edge:** `[glyph 3][seat 14][sep ' · ' 3][activity flex-truncate][elapsed right-aligned 6]`; seat 14 pads the longest seat name; left edge fixed, no reflow across the 2s refresh.
- **Activity copy, verb-first from `TranscriptBlock.kind`:** toolCall -> `ran <name> [first-arg <= ~30c]` [+ age]; thinking -> `thinking` [+ age]; assistant -> `replied` [+ age]; toolResult -> `got <name>` [+ age] (only if last block; usually toolCall preempts); user -> `idle` [+ age]. Age format `<60s -> 'Ns', <60m -> 'Nm', >=60m -> 'Nh Mm'`. Fallback (no timestamp reach): same templates, no age suffix; never a fabricated age.
- **Non-running rows** (dim): activity collapses to manifest state + `settledAt`
  copy -- `settled <age>`, `failed`, `stalled <age of last>`, `cancelled`,
  `timeout <secs>`, `orphaned` -- state and `settledAt` are never absent, so no
  timestamp reach is needed for non-running rows (closes principal's
  "fallback grammar is undesignated" witness point).
- **Dim / non-running rule:** running-first order (running -> stalled -> failed
  -> done); running = full color with seat name bold; done/failed/cancelled =
  dim; stalled/timeout = warning (eye-catcher); seat name bold for stalled,
  dim for settled.
- **Close / forcing function:** no in-panel button; `/council-tree` toggle calls
  `setWidget(key, undefined)`; hint line names the command (EV-8 layers keys).
- **Hint line** (bottom): dim `up/down move · enter view · /council-tree to close`.
- **Empty state:** one dim line `no council jobs this session` (feedback the
  command was received -- revised from zero-line collapse so the invocation is
  acknowledged).
- **Budget / cap:** `MAX_WIDGET_LINES=10` = 1 hint line + 9 rows hard cap; overflow -> dim `... N more` (navigator-style), never draw past the cap.
- **Token-only (AGENTS 9.6 + EV-4 settled):** every color/bold via `theme.fg`
  / `theme.bold`, no inline ANSI/hex; `truncateToWidth` ANSI-safe; factory
  `invalidate()` repaints on theme change.
- **Coexist (design log, engine call):** when the tree is open it takes the
  glance role; the above-editor widget shows when closed. Not a designer
  ruling; logged as a preference, the council routes it (Q2).
## Phase 1 rulings (binding, immutable for EPIC-2)

1. **Last-activity copy delegates to the designer.** The card's own wording
   stands — "the council picks the source and the exact copy, and the
   designer seat decides how it reads at a glance." No Phase 1 ruling fixes
   a format. A runner applies this card's intent as-is; the designer's
   glance decision is final unless the designer itself raises a dispute,
   which routes per the EPIC-2 judgment table. (Orchestrator Phase 1,
   2026-08-26.)
