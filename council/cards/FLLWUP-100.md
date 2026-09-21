---
id: FLLWUP-100
title: Card-gate calls always route full Deliberate — every live ledger line died at decide() on a missing answer probability
state: Backlog
owner: null
epic: EPIC-13
goal: Diagnose why the decisions transport's answers reach `decide()` without usable probabilities (wire shaping, question instructions, or model behavior) and land a remedy that keeps the fail-closed posture byte-identical, proven by a test showing a live-shaped call can produce a reduced mode when the evidence supports it.
---

## Intent

Confirmed by the EV-81 step-13 product-owner ruling
(`vault/raw/2026-09-22-po-ev81-step13-confirmation.md`, Item 2). Sequence after
FLLWUP-99.

**The observation.** 8 of 8 live card-gate ledger lines died at `decide()` with
`invalid-response` "missing a usable probability", all answers all-null, all
`resolvedMode: "Deliberate"` — the shipped card gate has never once returned an answer
the decision function could use. The fail-closed posture itself is correct and tested;
`FLLWUP-99` alone cannot make metering work, since post-fix every line still
re-derives to `Deliberate`.

**Amendment A — include the response-contract hypothesis.** The drafted cause list
("wire shaping, question instructions, model behavior") omits the one cause with a
shipped-code home: `parseDecisionsResponse` validates `model` and that `answers` is an
object, then passes per-question payloads **verbatim** (`extensions/gate-transport.ts`)
with no probability extraction anywhere. A location/key mismatch is indistinguishable
from "the model gave none," and it is the cheapest hypothesis to kill. The goal must not
be closeable without looking at it.

**Amendment B — the proof cannot be a fixture of answers.** The load-bearing claim is
proven by the gated live arm (`COUNCIL_INTEGRATION=1`, `test/gate-run-live.test.ts`)
issuing the real packaged four-question set and producing a line that `resolveRoute`
reads back as a reduced mode with `source: "recorded"`. Offline arms may inject a
response *body*; they may not stand alone as evidence that the model can answer. The
default suite stays offline and gains no new live arm.

**Amendment C — the card owns its evidence problem.** On `invalid-response` the failure
arm writes `answers: {}` (`extensions/gate-run.ts`), so the ledger's all-null answers
are the arm's own rendering, not observation. The card must capture a real response body
as part of the diagnosis. If the honest remedy requires persisting the offending payload
on the failure line, that is a ledger-schema change — a new card, not a fold-in.

**Starting point.** `test/gate-run-live.test.ts` already gets a usable probability from
the pinned model for a single-question noul set, so "the endpoint can't" is falsified;
the delta is the packaged question set and the multi-question response.

**Outcome named in advance.** The fail-closed posture stays byte-identical and no remedy
may lower scrutiny. The goal is deliberately not softened to "diagnose and report". If
the diagnosis concludes the pin cannot answer this question set with usable
probabilities, then no remedy exists inside the card, the judge's honest verdict is that
the goal is unmet, and the card ends in a named human decision about the question set —
a correct outcome.

## Acceptance

- The owner gates green in full: `bunx tsc --noEmit`, the full `bun test`,
  `python3 council/validate.py`, and `bash council/preflight.sh`.
- The `parseDecisionsResponse` verbatim-pass-through hypothesis is explicitly killed or
  confirmed before any model-side conclusion.
- The gated live arm (`COUNCIL_INTEGRATION=1`) produces a line `resolveRoute` reads back
  as a reduced mode with `source: "recorded"`; the default offline suite gains no new
  live arm.
- A real response body is captured as evidence; the fail-closed posture is byte-identical.
- Any ledger-schema change needed to persist an offending payload is filed as its own card.