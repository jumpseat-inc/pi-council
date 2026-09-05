---
title: Hub Job Supervision
type: concept
summary: The battle-tested engine that spawns, monitors, stalls, times out, and sweeps seat subprocesses — the hub table, pid file, anti-stall kill, and the dispatch/wait/cancel tools.
aliases: [hub, job table, council_dispatch]
tags: [pi-council/concept]
sources: ["[[2026-08-24-bugfix-seat-prose]]", "[[2026-09-05-epic6-run-ledger]]"]
created: 2026-08-23
updated: 2026-09-05
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

## Long blocking waits look like stalls (EPIC-3 lesson; EPIC-5 refinement)

The stall monitor keys on **tool activity**, not on whether a wait is
legitimate. A facilitator/runner that issues one long `council_wait` over a
30–45-minute seat dispatch produces no activity for the whole window and is
anti-stall-killed with its seat's partial work forfeited — three EPIC-3
containers died exactly this way. The caller-side fix: **poll in
≤8-minute slices**, re-waiting the same job while it is visibly progressing
(turns climbing, recent events). The hub never kills on timeout — cancel is
the caller's move, and cancelling mid-gate forfeits every gate already run.
See [[council-runner]], [[2026-09-04-epic3-run-ledger]].

**The invariant, generalized (EPIC-5) — and its failure mode (EPIC-6):**
at *every* dispatch layer, the no-activity window must exceed the longest
legitimate silent wait below it. EPIC-5 killed two runner containers from
the orchestrator side — one legitimately blocked on a 45-min owner
dispatch under a 15-min orchestrator stall window (poll-slicing is the
runner's choice, not the orchestrator's). The orchestrator-side fix: set
the dispatch's stall window above the runner's longest child ceiling (55
min covers the 45-min owner ceiling). **EPIC-6 then killed two more**
(jobs 6, 7) the same way: the fix was recorded here but not
institutionalized in the dispatching procedure, so the run's first
dispatches used the default 4-minute window and re-learned the lesson
from scratch. The lesson has moved from knowledge to procedure: the
orchestrator must set the stall window on *every* runner dispatch
(50–55 min), never rely on run memory. Both dead containers were
recovered from committed board state with zero work lost — the
durable-state discipline is what makes an anti-stall kill survivable.

**Sub-dispatches die with their parent (EPIC-6):** a container's
in-flight child dispatch (a skeptic verification) is unrecoverable after
the parent is killed — hub children are not addressable across
containers, and their hub session dies with the parent. The only
recovery is a fresh container resuming from committed board state and
re-running the step. Budget for it: a stall kill forfeits not just the
container's turn but every sub-dispatch it was babysitting.

## Related

- [[seats]], [[council-loop]], [[model-output-floors]]
- [[run-transcripts]] — the on-disk manifests + transcript viewer (v0.9.0)
- [[council models picker]] — delivered by the run that refined this page

## Sources

- `extensions/hub.ts`, `extensions/hub-tools.ts`
- [[2026-08-23-pi-council-design-spec]]
- [[2026-08-24-bugfix-seat-prose]]
- [[2026-09-04-epic3-run-ledger]] — the stall-window vs blocking-wait lesson
- [[2026-09-04-epic5-run-ledger]] — the orchestrator-side stall-window
  corroboration and the committed-state recovery proof
- [[2026-09-05-epic6-run-ledger]] — the recurrence (invariant not
  institutionalized) + the sub-dispatch lifecycle lesson