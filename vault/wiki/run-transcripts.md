---
title: Run Transcripts
type: concept
summary: The on-disk substrate that makes every council run navigable — per-job manifests and seat session JSONL under .pi/council/runs/, a job forest built from manifests, and the /council-tree + ctrl+shift+t live surface that reads it (inline below-editor as of EPIC-2).
aliases: [runs, run manifests, transcript viewer, council-tree, session jsonl]
tags: [pi-council/concept]
sources: ["[[2026-08-25-smoke-test-bugfixes]]", "[[2026-08-26-po-ev8-ruling]]", "[[2026-08-26-po-ev9-tiny-regime-floor]]", "[[2026-09-11-epic7-run-ledger]]", "[[2026-09-15-epic8-run-ledger]]"]
created: 2026-08-25
updated: 2026-09-15
---

# Run Transcripts

The v0.9.0 subsystem that turns opaque seat subprocesses into a navigable,
auditable record. Every seat dispatched by the hub writes its session into a
run directory under `$CONFIG_DIR_NAME/council/runs/` — the same directory the
hub's pid file lives in — so a parent session can browse the full conversation
of every seat at any nesting depth, live or after the fact.

## The on-disk substrate (`extensions/runs.ts`)

- **`runs/<runId>/run.json`** — run info (runId, startedAt, repoRoot, hostPid),
  written idempotently, never clobbered.
- **`runs/<runId>/<jobId>.json`** — one `RunManifest` per job: id, seat, model,
  parentJobId (nesting!), pid, sessionId, state, startedAt/settledAt, exitCode,
  and the full flat **`usage`** tuple persisted at settle (EV-28,
  [[usage-accounting]]). Written atomically (temp+rename).
- **`runs/<runId>/<timestamp>_<jobId>.jsonl`** — the seat's full session
  transcript (pi session JSONL: thinking, toolCall args, toolResult outputs).
  `findSessionFile` locates one by reading each file's first line for its
  session id.
- **Self-ignoring** — `runs/` carries its own `.gitignore` (`*`), so transcripts
  are never committed (see [[smoke-test]] — the harness reads them as dispatch
  evidence).
- **Retention** — `pruneRuns` keeps the last **15** runs, dropping dead-PID ones
  at parent `session_start`. Ephemeral telemetry, not durable state. **The
  durable [[usage-store]] is the deliberate exception** — its records live at
  `getAgentDir()/council/usage/`, survive pruning, and name the invoking
  session JSONL path + entry range so a spend stays traceable after the run
  directory is gone.

## The job forest (`extensions/tree.ts`)

`readManifests` + `buildTree` reconstruct the dispatch tree from the
`parentJobId` links — pure, no I/O beyond the manifests. Nodes carry a `depth`,
children sorted numerically by id, and an `orphaned` flag (manifest says
`running` but the pid is dead). `flattenTree` yields the display list.

## The transcript parser (`extensions/transcript.ts`)

`parseTranscript` turns a session JSONL into `TranscriptBlock`s — user,
assistant, thinking, toolCall, toolResult — with text, label, and byte counts.
`TranscriptTail` provides incremental tailing for the live viewer.

**EPIC-8 (2026-09-15) extended the block shape.** `TranscriptBlock` now carries
**`toolCallId`** and **`isError`** (both present in the JSONL and previously
discarded), so a consumer can pair every `toolCall` with **its own**
`toolResult` by identity even when same-named calls' results arrive out of
order; the parser also exports the single **primary-argument accessor** that
the tree row's `/ran <tool> <arg>` copy and the transcript head both consume
(EV-33, commit `186c04dc`). The progress transcript renders a call and its
result as one composed unit ([[transcript-unit-rendering]]). This is an
**evolution**, not a contradiction: the flat-block description above is now
incomplete at the rendering layer; the substrate facts (manifests, forest,
tailing, retention) are unchanged.

## The `/council-tree` surface (`extensions/navigator.ts`)

A TUI component registered by the parent (`registerNavigator`, invoked as a
slash command or via **`ctrl+shift+t`**): a scrollable **inline job tree**
with status glyphs (`●` running, `✓` done, `✗` failed, `⏸` stalled, `⊘`
cancelled, `⚠` timeout), per-run scoping (current run vs. all runs), and
Enter to open the live-tailing transcript, Esc to back out. Wired at
session start to the hub's current run id.

**Inline presentation (EPIC-2, released as v0.13.0 — supersedes the v0.11.4 modal).**
`/council-tree` now renders as an **inline full-width panel beneath the
input bar** (`setWidget(key, factory, { placement: "belowEditor" })`),
pushing message content up instead of dimming the terminal. The tree adds
**per-row last activity** (from the transcript timestamp seam), gains
**editor-driven arrow-key focus**, and opens the selected subagent's live
transcript as an **inline expansion** of the tree region. See the dedicated
[[council-job-tree-inline]] page for the full surface + the binding rulings.

The **former full-screen modal** (opaque backdrop + centered bordered panel
via `withModalFrame()`, [v0.11.4]) is **superseded** by this inline form. The
modal code path survives only behind the `navigator.ts:57` guard, which is
the subject of FLLWUP-4 (RPC silent-no-op repair). This is an evolution, not
a silent overwrite: the modal was the correct v0.11.4 fix for the
backdrop-less overlay; EPIC-2 replaced it with a first-class inline surface.

**Theming (EPIC-1, EV-4):** the tree and transcript draw **solely from
activated pi theme tokens** — `border` rails, `accent` selection cursor +
the `▌` marker, `dim` hints/overflow, `bold` headers, and transcript labels
(`accent` user, `success` assistant, `dim` thinking, `warning` toolCall,
`muted` toolResult) — per the token-only drawing rule (AGENTS.md 9.6,
[[council-theme]]). Since EPIC-8 a tool call and its result render as one
composed unit rather than two separate heads ([[transcript-unit-rendering]]). Under the council theme the surface follows the
activated palette and **repaints live on mid-session theme change** via
`onThemeChange → invalidate()` — see [[council-theme]] and
[[2026-08-25-design-ev4-round1]].

## Consumers

- [[hub-job-supervision]] — the hub writes the manifests and pid file; the
  transcript viewer reads what it supervises.
- [[smoke-test]] — the harness counts `*.jsonl` seat sessions and greps
  manifests for `council-runner` dispatch evidence.
- [[pi-council-overview]] — the v0.9.0 release row.

## Related

- [[hub-job-supervision]], [[seats]], [[smoke-test]]
- [[council-job-tree-inline]] — the EPIC-2 inline below-editor surface (EV-7/8/9) that reads this substrate; supersedes the v0.11.4 modal presentation
- [[transcript-unit-rendering]] — the EPIC-8 composed tool-call unit rendered over these blocks
- [[council-theme]] — the palette/theme tokens the tree/transcript draw
- [[pi-council-overview]] — version arc
- [[2026-08-25-council-tree-modal]] — the v0.11.4 full-screen modal fix (now superseded by [[council-job-tree-inline]])
- [[2026-08-25-design-ev4-round1]] — the EV-4 audit/source
- [[2026-08-26-po-ev8-ruling]], [[2026-08-26-po-ev9-tiny-regime-floor]] — binding rulings shaping the inline surface
- [[usage-accounting]], [[usage-store]] — the EV-28 tuple on the manifest and the durable store that outlives the run dir

## Sources

- `extensions/runs.ts`, `extensions/tree.ts`, `extensions/transcript.ts`,
  `extensions/navigator.ts`, `extensions/focus-nav.ts`
- `extensions/index.ts` (wiring)
- `docs/superpowers/plans/2026-08-24-council-transcript-navigator.md`
- [[2026-08-25-council-tree-modal]]
- [[2026-08-26-po-ev8-ruling]], [[2026-08-26-po-ev9-tiny-regime-floor]]
