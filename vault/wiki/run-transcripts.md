---
title: Run Transcripts
type: concept
summary: The on-disk substrate that makes every council run navigable — per-job manifests and seat session JSONL under .pi/council/runs/, a job forest built from manifests, and the /council-tree overlay + ctrl+shift+t live transcript viewer.
aliases: [runs, run manifests, transcript viewer, council-tree, session jsonl]
tags: [pi-council/concept]
sources: ["[[2026-08-25-smoke-test-bugfixes]]"]
created: 2026-08-25
updated: 2026-08-25
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
  parentJobId (nesting!), pid, sessionId, state, startedAt/settledAt, exitCode.
  Written atomically (temp+rename).
- **`runs/<runId>/<timestamp>_<jobId>.jsonl`** — the seat's full session
  transcript (pi session JSONL: thinking, toolCall args, toolResult outputs).
  `findSessionFile` locates one by reading each file's first line for its
  session id.
- **Self-ignoring** — `runs/` carries its own `.gitignore` (`*`), so transcripts
  are never committed (see [[smoke-test]] — the harness reads them as dispatch
  evidence).
- **Retention** — `pruneRuns` keeps the last **15** runs, dropping dead-PID ones
  at parent `session_start`. Ephemeral telemetry, not durable state.

## The job forest (`extensions/tree.ts`)

`readManifests` + `buildTree` reconstruct the dispatch tree from the
`parentJobId` links — pure, no I/O beyond the manifests. Nodes carry a `depth`,
children sorted numerically by id, and an `orphaned` flag (manifest says
`running` but the pid is dead). `flattenTree` yields the display list.

## The transcript parser (`extensions/transcript.ts`)

`parseTranscript` turns a session JSONL into `TranscriptBlock`s — user,
assistant, thinking, toolCall, toolResult — with text, label, and byte counts.
`TranscriptTail` provides incremental tailing for the live viewer.

## The `/council-tree` overlay (`extensions/navigator.ts`)

A TUI component registered by the parent (`registerNavigator`, invoked as a
slash command or via **`ctrl+shift+t`**): a scrollable job tree with status
glyphs (`●` running, `✓` done, `✗` failed, `⏸` stalled, `⊘` cancelled, `⚠`
timeout), per-run scoping (current run vs. all runs), and Enter to open the
live-tailing transcript viewer, Esc to back out. Wired at session start to the
hub's current run id.

## Consumers

- [[hub-job-supervision]] — the hub writes the manifests and pid file; the
  transcript viewer reads what it supervises.
- [[smoke-test]] — the harness counts `*.jsonl` seat sessions and greps
  manifests for `council-runner` dispatch evidence.
- [[pi-council-overview]] — the v0.9.0 release row.

## Related

- [[hub-job-supervision]], [[seats]], [[smoke-test]]
- [[pi-council-overview]] — version arc

## Sources

- `extensions/runs.ts`, `extensions/tree.ts`, `extensions/transcript.ts`,
  `extensions/navigator.ts`
- `extensions/index.ts` (wiring)
- `docs/superpowers/plans/2026-08-24-council-transcript-navigator.md`
