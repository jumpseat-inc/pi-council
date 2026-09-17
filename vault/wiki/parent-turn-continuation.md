---
title: Parent-Turn Continuation
type: concept
summary: EV-40's mechanism for the intake's actual failure — an agent_settled handler that re-sends the failed parent turn after a backoff, with the ruled input-bar countdown, Esc abort, Enter re-arm, headless SIGINT/exit-75, and the event-ctx gap (no waitForIdle) it works around.
aliases: [parent retry, agent_settled continuation, retrying in Ns, parent-turn retry]
tags: [pi-council/concept, pi-council/epic9]
sources: ["[[2026-09-16-epic9-run-ledger]]"]
created: 2026-09-16
updated: 2026-09-16
---

# Parent-Turn Continuation

The intake's real failure was the **parent's own provider call** dying and the
session dead-ending at the visible affordance `Continue` — not a seat child
failing. `extensions/parent-retry.ts` (EV-40) is the mechanism that continues
that turn. The hub-side retry of a seat dispatch is a separate loop with a
separate surface ([[per-attempt-provenance]]); this card is the epic's centre.

## Why it is hand-built

There is **no extension hook that re-issues a failed parent turn**.
`before_provider_request` only replaces the outgoing payload and runs before a
request; `after_provider_response` sees status and headers before the stream is
consumed. The only post-failure lever is the `agent_settled` event followed by
`sendUserMessage` — a hand-built resume loop, not a retry API.

## Reachability came first

Before the mechanism was designed, [[steward]] inserted **EV-43** as a gate: a
falsifier that answers whether an `agent_settled` handler calling
`sendUserMessage` can produce a second assistant message at all. The answer was
**yes in both the TUI and `-p`**, with a control arm closing attribution to the
handler rather than to pi's own auto-retry.

The gate's method lesson is worth keeping: the three-seat consensus that
continuation "works" cited EV-43, which proved only the *send-inside-handler*
arm, while the design needed a *timer-deferred* send (TUI) and an
*await-inside-handler* send (headless). The [[skeptic]] refused to let
agreement stand as evidence — see [[council-runner]]'s *convergence is not
evidence*.

## The event-context gap

The `agent_settled` **event context does not carry `waitForIdle`** — that
affordance exists only on the command context — so the established
`extensions/index.ts` pattern cannot be transplanted verbatim. What works:
poll `ctx.isIdle()`, and note that `_emitAgentSettled` clears
`_isAgentRunActive` *before* awaiting handlers, so `ctx.isIdle()` is already
true during the emit; the nested run is covered by `_runAgentPrompt`'s
`finally`. See [[headless-pi]].

A continuation send re-enters `before_provider_request`, so it cannot silently
escape the [[model-output-floors]] `max_completion_tokens` floor.

## The ruled surface (R5)

During backoff the **input bar** reads
`Retrying in 2s (attempt 2 of 3) — Esc to abort`. [[product-owner]] ruled the
input bar the binding surface — implementing it as an extra editor-region line
via `setEditorComponent` (the `focus-nav` `CustomTreeEditor` precedent), which
snapshot-restores the draft — and **declined** [[designer]]'s proposal to
re-pin the countdown to `setStatus("council.retry", …)`. The dissent is named,
not hidden: the status row would co-locate with pi's own retry indicator, but it
would change the recorded per-branch observable, which is a human decision.
See [[engineering-board]].

Semantics settled at the same ruling:

- The input bar stays **interactive** — typed text accumulates, never locked or
  discarded; `Esc` aborts the remaining retries; `Enter` on a non-empty buffer
  submits and aborts; `Enter` on an empty buffer is a no-op.
- At exhaustion `Enter` **re-sends the original prompt with a fresh budget** —
  the copy means what it says.
- Terminal copy:
  `Retries exhausted after 3 attempts. The provider kept failing. Press Enter to try again.`
- **Headless:** SIGINT is the abort equivalent (the process dies, so an unref'd
  timer never fires); `Enter` has no meaning in `-p`, so the hand-off is an
  **exit code 75** with the terminal copy as the final stdout line. That exit
  code needs a one-shot `exit` listener because pi assigns `process.exitCode`
  *after* settle handlers, and reaching real stdout needs `fs.writeSync(1, …)`
  because print mode hijacks `process.stdout` — both [[headless-pi]] facts.

## Gates that had to settle first

`P1` (does a timer-deferred send survive print-mode teardown — the reason
send-inside-handler is not enough) and `D1` (is the message list actually
malformed after an errored turn) had to close before implementation; the rest —
literal hygiene, the parent-loop guard excluding pi-retryable messages, usage
double-counting, and the designer's pty smokes — rode as named gates into the
spec. The card cleared its verify loop on the third cycle with no open residual.

## Related

- [[retry-classification]], [[retry-policy]] — the decision and the budget
- [[headless-pi]] — teardown, stdout takeover, exit-code timing, `isIdle`
- [[per-attempt-provenance]] — the sibling hub loop
- [[model-output-floors]] — the floor a continuation re-enters
- [[designer]], [[product-owner]] — the surface dispute
- [[council-job-tree-inline]] — the TUI surface it shares

## Sources

- [[2026-09-16-epic9-run-ledger]]
- `extensions/parent-retry.ts`, `extensions/index.ts`
- `vault/raw/2026-09-17-po-ev40-ruling.md`
