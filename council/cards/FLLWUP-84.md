---
id: FLLWUP-84
title: Own-key membership for loadGatePolicy's unknown-key check — same prototype-chain `in` class as FLLWUP-83, one loader over
state: Backlog
owner: null
epic: EPIC-14
goal: The policy.json loader's unknown-key check (loadGatePolicy's `key in ALLOWED_POLICY_KEYS`, plus the same-shape checks in loadGateQuestions if they share the class) is either closed to own-key semantics — a prototype-named key such as toString, constructor, or valueOf is refused with the single-line FAIL: naming the file and key — or explicitly ruled as accepted law with the characterization test that pins it promoted from EV-75's T6 to the loader-level contract; either way the decision is recorded on this card and the packaged policy.json/questions.json validate clean.
---

## Intent

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

## Acceptance

- The `in`-vs-own-key question is answered for loadGatePolicy (and
  loadGateQuestions if it shares the class) with a recorded ruling.
- If closed: prototype-named keys are refused with a single-line `FAIL:`
  naming file and key; the packaged files validate clean; EV-75's T6 is
  updated to the new law.
- If pinned as law: T6 (or its successor) is the loader-level contract test;
  the rationale is recorded here and in the wiki page EV-77 produces.
