---
title: Retry Classification
type: concept
summary: The pure predicate that decides retry-vs-terminal for a settled seat job — keyed on stopReason/errorMessage and never on state (a provider-errored child exits 0 and settles done), a deliberate superset of pi's own retryable pattern, verified against pi's installed bundle by a snapshot-drift test.
aliases: [classifyRetry, retry predicate, retryable provider error, retry classification]
tags: [pi-council/concept, pi-council/epic9]
sources: ["[[2026-09-16-epic9-run-ledger]]"]
created: 2026-09-16
updated: 2026-09-16
---

# Retry Classification

`extensions/retry.ts` (EV-37) is the pure decision that sits in front of both
retry loops: given a settled job report, is this attempt retryable or terminal?
It does no I/O and spawns nothing.

## The two facts that framed it

**pi already retries — just not this class.** pi's agent loop retries
retryable assistant errors with `baseDelayMs * 2**(attempt-1)`, gated by
`isRetryableAssistantError` against `RETRYABLE_PROVIDER_ERROR_PATTERN`. That
list does not match `Provider finish_reason: error` — the message pi's own
`mapStopReason` default branch emits (`` `Provider finish_reason: ${reason}` ``)
when a provider declines with `finish_reason: "error"`. So pi's backoff never
fires for the error the intake screenshotted, and the council loop had to own
the decision.

**A provider-errored child settles `done`.** `hub.ts` sets
`state = code === 0 ? "done" : "failed"`, and a provider error **exits 0** — so
the settled report is `state=done` with `stopReason=error`. A card phrased as
"retry failed jobs" is wrong on arrival; the classifier keys on
`stopReason`/`errorMessage` only. See [[hub-job-supervision]].

## The predicate (R1 superset)

`classifyRetry(report)` returns:

- **`"retry"`** — settled, `stopReason === "error"`, and the message is the
  literal `Provider finish_reason: error` **or** matches pi's shipped
  `RETRYABLE_PROVIDER_ERROR_PATTERN` (502, rate limit, timeouts, transport
  errors…). The state never blocks a retry pi itself would make, so the widened
  predicate is a **superset** of pi's, never narrower.
- **`"terminal"`** — settled with `stopReason` `stop`/`length`, or one of the
  `failed`/`cancelled`/`stalled`/`timeout` states.
- **`undefined`** — every other input (running, missing `stopReason`,
  `aborted`/`pending`, or an error whose message is missing or non-retryable).

## Literal hygiene, and the defect it caused

The widened literal must be spelled **with its colon** —
`Provider finish_reason: error`. That colon is load-bearing and invisible in the
wrong place: `council/validate.py` forbids a `: ` sequence in a card's `goal`
(frontmatter is parsed as plain `key: value` lines), so EV-37's goal spelled the
literal without it. The owner implemented the goal byte-for-byte; the shipped
constant therefore did not match pi's real message, and the real message matched
none of pi's tokens either — so the classifier returned `undefined` for exactly
the error the epic exists to retry.

Owner gates, `gates` SUCCESS, a no-block [[skeptic]] verdict, and a judge `PASS`
all cleared it. The defect was caught by reading pi's *installed bundle* instead
of the card. See [[deterministic-merge-check]] and [[engineering-board]].

## The snapshot-drift discipline

pi does not export the compiled pattern, so council re-declares the token list
verbatim and pins it to the installed version. `test/retry.test.ts` re-extracts
the list from the installed bundle and asserts **equality in both directions**,
so a pi update that adds or removes a token fails the suite and forces a
deliberate refresh. The literal branch gets the same treatment: a regression
test derives its expectation from the bundle's `mapStopReason` template
evaluated at `reason === "error"` and fails on the colon-free spelling.

The generalizable pattern: **a re-declared vendor constant is verified against
the installed artifact, not against the config that declares it.**

## Related

- [[retry-policy]] — the budget and delay formula the loop consumes
- [[parent-turn-continuation]], [[per-attempt-provenance]] — the two loops
- [[hub-job-supervision]] — the `state=done` trap and the report shape
- [[deterministic-merge-check]] — the gate that passed the dead branch
- [[engineering-board]] — the goal-field colon rule that caused it

## Sources

- [[2026-09-16-epic9-run-ledger]]
- `extensions/retry.ts`, `extensions/hub.ts`, `test/retry.test.ts`
- pi `dist/bundle` (`mapStopReason`, `RETRYABLE_PROVIDER_ERROR_PATTERN`)
