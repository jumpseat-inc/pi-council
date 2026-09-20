---
id: FLLWUP-76
title: Document the decide() basis vocabulary, the callId:null fallback, and the intake-vs-dispatch split
state: Done
owner: null
epic: EPIC-13
goal: vault/ holds a durable page, new or a named section of the metered-deliberation-routing page, that documents the decide() basis vocabulary (composite and comparison strings, threshold names, the one-way-door phrase), the meaning of the callId:null fallback cell as a tool short-circuit rather than a corrupted ledger, and that the rendered line describes the recorded intake-time decision while EV-69 re-checks at dispatch; every claim cites its implementing code or a run record, and a test or lint check confirms each cited path exists.
---

## Intent

Filed from EV-67's step-13 documentation residual (J5), ruled out of that card's
scope by all seats and untouched by the step-6 ruling. The approval-gate line
now surfaces a `basis` string derived by `decide()` (EV-63), recorded verbatim on
the v2 ledger call line (EV-65), and rendered verbatim (EV-67); none of that
vocabulary has a reader-facing home, and the `callId: null` fallback cell reads
ambiguously without one.

The event this page serves: a person reads `Mode: Deliberate — <basis>` at the
approval gate and needs to know what the basis means, why a fallback says what it
says, and that the mode is the intake-time decision with a dispatch-time
re-check — not a live re-derivation.

## Acceptance

- The page names every distinct basis shape the code can emit, each beside its
  emitting function or code path.
- The `callId: null` fallback is explained as "the tool short-circuited before a
  ledger line existed", explicitly not "the ledger is corrupted".
- The intake-time-recorded vs dispatch-time-re-checked split is stated, citing
  EV-69's re-check.
- Every cited code path and run record exists (checked mechanically).
- The page is reached from the routed wiki index, not orphaned.
## Folded into EPIC-14

Folded into `EV-77` (`EPIC-14`) by the EPIC-14 wave-3 product-owner ruling
(job-33): both cards document the same reader-facing `metered-deliberation-routing`
page, which EPIC-14 must edit anyway to describe the new `.council.json` gate
surface and the `/council-gate` toggle. `EV-77` carries this card's full scope.
