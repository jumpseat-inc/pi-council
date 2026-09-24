---
title: Halt Repair Gap
type: concept
summary: A recurring under-specification in /features-deliver — the command says a seat failure is a HALT surfaced to the human but names no sanctioned repair, so orchestrators improvise; observed for the EPIC-15 mode mismatch (repair by dispatching the missing mode's seats) and the EPIC-23 dispatch-window overrun (repair by a longer window).
aliases: [HALT repair, undefined repair, halt gap, dispatch window overrun]
tags: [pi-council/concept, pi-council/features-deliver, pi-council/process]
sources: ["[[2026-09-24-epic23-run-ledger]]", "[[2026-09-23-epic15-residual-run-ledger]]"]
created: 2026-09-24
updated: 2026-09-24
---

# Halt Repair Gap

`/features-deliver` defines `HALT` as "an environment failure this container
could not repair itself," surfaces it to the human, and stops dispatching. The
command does **not** describe how a halt is cleared and the run resumed. Because
a `council-runner` job is terminal once settled (a settled runner cannot be
re-entered), any repair necessarily happens **at the orchestrator level** — and
the orchestrator has no written recipe.

## Two observed repair classes

1. **Mode mismatch (EPIC-15 residual run).** The orchestrator recorded `Verify`
   while the runner judged and executed `Direct`; the [[deterministic-merge-check]]
   read the substrate and issued
   `HALT: FLLWUP-111 — mode Verify requires a goal evaluation and none is recorded`.
   Repaired by dispatching the missing mode's seats (`skeptic` + `judge`)
   **directly from the orchestrator**, outside any runner. Not in the procedure
   ([[execution-mode-recording]]).
2. **Dispatch-window overrun (EPIC-23).** The `owner` seat failed its step-2
   first-pass position twice inside the **15-minute default window** (`job-8.1`
   cancelled at 18 turns, no text; the one sanctioned re-dispatch `job-8.4`,
   36 turns, zero text blocks); the runner HALTed per dispatch discipline. The
   same model completed for `principal` in 17 turns. The command names no repair;
   the orchestrator surfaced it to the human, who chose a **30-minute owner
   window**, and the resumed owner completed in 22.3 min.

## Why it matters

The dispatch discipline correctly bounds every seat and forbids a third dispatch —
that is [[hub-job-supervision]]'s anti-stall intent. But "bounded" is not
"repaired," and a HALT without a repair recipe converts a transient seat-latency
overrun (or a metadata mismatch) into a run-ending event whose only escape is
improvisation the next orchestrator must reinvent. Both classes are recurring;
the mode-mismatch one is already flagged as "a card is owed," and the window
overrun is a second owed card. Candidate fixes: a re-dispatch window bump in the
dispatch discipline for a visibly-progressing first pass (already allowed for the
step-9 skeptic), or an explicit orchestrator repair recipe keyed by halt class.

## Related

- [[execution-mode-recording]] — the mode-mismatch HALT and its ad-hoc repair
- [[council-runner]] — the container's dispatch discipline and double-fail stop
- [[hub-job-supervision]] — stall/timeout/kill semantics the discipline rides
- [[deterministic-merge-check]] — the merge-time HALT lines
- [[run-time-profile]] — the seat-latency distribution behind an overrun

## Sources

- [[2026-09-24-epic23-run-ledger]]
- [[2026-09-23-epic15-residual-run-ledger]]