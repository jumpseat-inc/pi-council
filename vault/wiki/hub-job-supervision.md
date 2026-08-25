---
title: Hub Job Supervision
type: concept
summary: The battle-tested engine that spawns, monitors, stalls, times out, and sweeps seat subprocesses — the hub table, pid file, anti-stall kill, and the dispatch/wait/cancel tools.
aliases: [hub, job table, council_dispatch]
tags: [pi-council/concept]
sources: ["[[2026-08-24-bugfix-seat-prose]]"]
created: 2026-08-23
updated: 2026-08-25
---

# Hub Job Supervision

> ⚠️ Derived from `extensions/hub.ts`, `extensions/hub-tools.ts` (captured 2026-08-23). Verify against the code; this is the battle-tested core (AGENTS.md convention 7 — change only via a failing test).

A dispatched seat (see [[seats]]) runs **outside the parent** as an isolated
headless `pi` process. The **hub** supervises that process. It is the same core
ported verbatim from the source repo — its semantics are stable.

## The hub table

`Hub` (in `hub.ts`) keeps a `jobs` map: id, seat, pid, state, timestamps,
`timeoutMs`, `stalledMs`, usage (input/output/cost/turns), stderr tail, events.
The monitor runs on an interval:

- **Stall** — no activity for `stallMs` → `stalled`, SIGTERM then SIGKILL after 5s.
- **Timeout** — a job beyond `timeoutMs` is marked `timeout` **informationally but
  never killed** (cancelling is the facilitator's move).
- **PID sweep** — stale PIDs from a previous session are killed at startup
  (`Hub.sweepStalePids` on the pid file).

## JSON stream

The child prints NDJSON. The hub parses lines for `message_end` (assistant) —
accumulating output tokens/cost and stopReason — and `tool_execution_start`
(a `→ tool` event). `done` is settled when the process closes with code 0.

## The three tools

`hub-tools.ts` registers (only for seats granted `hub`):

- **`council_dispatch`** — spawn a seat as a job; resolves the seat by name from
  disk (packaged + repo-local override) and fails loudly with `Unknown seat` when
  it doesn't resolve; validates the model is in the catalog (else refuses
  loudly), builds the prompt file, writes the system prompt, adds granted MCP
  `--tools`, returns job id + pid.
- **`council_wait`** — wait for jobs to settle or a window; returns each job's
  report. Never cancels on timeout.
- **`council_cancel`** — SIGTERM+SIGKILL a running job.

Since v0.10.0 these tools also reach the **child's model**: `buildChildArgv`
appends their names to the child's `--tools` allowlist for hub-enabled seats
(previously registration-only — children could never see or call them; see
[[2026-08-25-smoke-test-bugfixes]] bug 3).

## The wait-report format

The report carries `state`, `turns`, `cost`, `output`, `stopReason`,
`errorMessage`, `stderrTail`. An **empty-done + `stopReason=length`** is surfaced
as a model-config problem (see [[model-output-floors]]), not a silent success —
this is the whitespace observer of the guard.

## `/council-jobs` CLI

`/council-jobs` prints the live job table.

## Related

- [[seats]], [[council-loop]], [[model-output-floors]]
- [[run-transcripts]] — the on-disk manifests + transcript viewer (v0.9.0)

## Sources

- `extensions/hub.ts`, `extensions/hub-tools.ts`
- [[2026-08-23-pi-council-design-spec]]
- [[2026-08-24-bugfix-seat-prose]]