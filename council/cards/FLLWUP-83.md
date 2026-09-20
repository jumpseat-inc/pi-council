---
id: FLLWUP-83
title: Own-key membership for loadGateDecision's mechanical-record check — close the pre-existing prototype-chain `in` leak
state: Backlog
owner: null
epic: EPIC-13
goal: loadGateDecision's mechanical-record membership check uses own-key semantics — a mechanical id that is not an OWN key of the weights record (a prototype-chain collision such as toString, constructor, or valueOf) is refused with a single-line FAIL: naming mechanical and the offending id — and the packaged decision.json validates clean.
---

## Intent

Surfaced by EV-73's step-9 skeptic (job-3.2, cycle 1): the closed-red found
the same prototype-chain `in` bug class on the card's NEW class-3 check and it
was fixed there (`weightIds.includes(rule.question)`); the IDENTICAL
pre-existing pattern on the `mechanical` record at extensions/gate.ts (~line
441, `mechIds.some((id) => !(id in weights))`) predates EV-73 and was
explicitly ruled out of that card's scope. The skeptic verified it
byte-identical base↔head and noted the residual for this filing. Practical
reach: a mechanical record carrying a prototype-key id can pass the
"exactly the weighted question ids" check while not naming any weighted
question — a validation hole of the same shape EV-73 closed. Note: this card
is NOT part of the job-2 ruling's ratified step-13 feed; it is filed under
council.md step 13's everything-surfaced rule and needs the orchestrator's
confirmation.

## Acceptance

- A `mechanical` record with a prototype-key id is refused, single-line
  `FAIL:` naming `mechanical` and the id.
- The ordinary packaged `decision.json` (four weighted questions, four
  mechanical entries) validates clean unchanged.
- No other validation behavior changes; the full suite stays green.
