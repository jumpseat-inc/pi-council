---
id: FLLWUP-75
title: Signify a slow advisory gate call without implying deliberation or failure
state: Backlog
owner: null
epic: EPIC-13
goal: A /features-new advisory gate call that outlives a short pending threshold renders exactly one additional transient editor-region signifier naming the call as still in progress and its elapsed state, using no word implying thought or deliberation and no word implying failure, replaced rather than appended and returning zero lines when the call settles for every post-settle state; and a test proves the slow-call render differs from the initial pending render and that both return zero lines after settle.
---

## Intent

Filed from EV-66's step-6 product-owner ruling (job-16), Q(a). The ruling kept
EV-66's copy surface exactly the pending line (`gate: advisory call in progress ·
<id>`, zero lines after settle for every post-settle state, no failure wording)
and accepted the residual it named: the pending window is honest but **static** —
with `GATE_CALL_TIMEOUT_MS` at 120s, a person can watch an unchanged line for two
minutes and then see it vanish with no signal whether the call timed out, was
refused, or succeeded slowly. EV-67 renders the failure face at the approval gate
afterwards; this card covers only the in-window experience.

The mechanism fact that constrains the design (skeptic-verified during EV-66):
the ledger line lands only after the transport resolves, so during the pending
window there is no on-disk record to read — any in-window signifier must come
from in-flight state.

## Acceptance

- A call whose resolution exceeds the short pending threshold renders one
  additional signifier; a call that resolves quickly does not.
- The added copy uses no word implying thought or deliberation and no word
  implying failure (`thinking`, `deliberating`, `reasoning`, `judging`, `failed`,
  `error`, `timeout` must not appear).
- The signifier is replaced, never appended, and the render function returns zero
  lines after settle for success, refusal, and timeout alike.
- No second decision point and no new keystroke, prompt, or state transition.
- The existing EV-66 pending line and its byte-identity/zero-after-settle tests
  are unchanged.