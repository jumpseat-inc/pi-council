---
id: FLLWUP-83
title: Close the prototype-chain `in` class across the gate loaders and pin or remove gate-state's duplicated policy read
state: Backlog
owner: null
epic: EPIC-16
goal: loadGateDecision's mechanical-record check, loadGatePolicy's unknown-key check (and loadGateQuestions if it shares the class), and gate-state's duplicated lenient policy read are all reconciled — prototype-named keys (toString, constructor, valueOf) are refused with a single-line FAIL: naming the file and key, and the duplicated read is either resolved through the validated loader or its load-order invariant is pinned by test — with the packaged policy.json/questions.json/decision.json validating clean.
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

---

### Absorbed: FLLWUP-84 — Own-key membership for loadGatePolicy's unknown-key check — same prototype-chain `in` class as FLLWUP-83, one loader over

Surfaced by EV-75's step-4 skeptic (job-4.4, objection O7, closed-green as
characterization): a repo-local `policy.json` carrying `toString: 1` loads
cleanly at head `16e8f5e` and at EV-75's branch head `8e55e89`, because
`"toString" in ALLOWED_POLICY_KEYS` is prototype-true — the identical
pre-existing `in` leak class FLLWUP-83 closes for loadGateDecision's
mechanical-record check, one loader over. EV-75 deliberately did NOT change
the predicate (its binding contract sentence: every non-`mode` input's
outcome is byte-identical) and pinned current behavior with the T6
characterization test (test/gate.test.ts:161/:180). This card decides the
question FLLWUP-83's ruling implies for the remaining gate loaders: leak to
close (own-key membership + FAIL) or law to pin (promote T6). Not urgent —
accepting a prototype-named key is harmless today because such a key is then
ignored as tuning data — but the two loaders should not answer the same
question differently without a recorded reason.

---

### Absorbed: FLLWUP-81 — Eliminate gate-state.ts's duplicated lenient policy read — resolve the budget through the validated loader or pin the load-order invariant

Filed from EV-73's step-13 follow-up feed, item 1 — ratified as filed by the
step-6 product-owner ruling (job-2): **hygiene, not a gate**. EV-73's
deliberation confirmed the lenient read is unreachable as a failure path today
(skeptic O5 probes: `resolveGateStateBudget` runs only inside `buildGateState`,
whose only callers sit after a `loadGatePolicy` call plus the off
short-circuit on the same stack — the strict throw always wins), so the
duplicated parse duplicates the key list in a second module against no
reachable failure. Unify the read or pin the invariant with a test; do not
add a validation gate where the loader already validates.

## Acceptance

- A `mechanical` record with a prototype-key id is refused, single-line
  `FAIL:` naming `mechanical` and the id.
- The ordinary packaged `decision.json` (four weighted questions, four
  mechanical entries) validates clean unchanged.
- No other validation behavior changes; the full suite stays green.

---

### From FLLWUP-84 — Own-key membership for loadGatePolicy's unknown-key check — same prototype-chain `in` class as FLLWUP-83, one loader over

- The `in`-vs-own-key question is answered for loadGatePolicy (and
  loadGateQuestions if it shares the class) with a recorded ruling.
- If closed: prototype-named keys are refused with a single-line `FAIL:`
  naming file and key; the packaged files validate clean; EV-75's T6 is
  updated to the new law.
- If pinned as law: T6 (or its successor) is the loader-level contract test;
  the rationale is recorded here and in the wiki page EV-77 produces.

---

### From FLLWUP-81 — Eliminate gate-state.ts's duplicated lenient policy read — resolve the budget through the validated loader or pin the load-order invariant

- Either `resolveGateStateBudget` consumes the validated loader's output (no
  second independent parse of `policy.json` in `gate-state.ts`), or a test
  pins the load-order invariant across every production path, including the
  transitive precedence through `resolveRoute` for the recheck body.
- No new runtime refusal class is introduced.
- The full suite stays green; no packaged data file changes.
