---
title: "2026-09-24-epic23-run-ledger"
type: source
summary: The EPIC-23 autonomous /features-deliver run — 2 cards shipped (EV-89, EV-90) on the full Deliberate path because the decision gate was inert at READ-BACK (policyVersion drift, FLLWUP-99), plus an undefined HALT repair, a recurring step-13 return drift, and the run-time audit that motivated the epic.
aliases: [epic23 run ledger, EPIC-23 run]
tags: [pi-council/source, pi-council/features-deliver, pi-council/gate]
sources: []
created: 2026-09-24
updated: 2026-09-24
---

# EPIC-23 Run Ledger

Source: `vault/raw/2026-09-24-epic23-run-ledger.md`. The `/features-deliver`
run on **EPIC-23** ("autonomous-delivery cold-start efficiency"), run id
`2026-09-23T18-48-50-938Z-1556044-ywwq9c`, orchestrator the human's agent
autonomously. EPIC-23 was decomposed in the same session by `/features-new`
into **EV-89** (Phase 1 class-enumerated rulings record) and **EV-90**
(pre-injected procedure context into the runner dispatch); both merged
(`593f6ed`, `14f244f`), EPIC-23 closed `Done`, and three follow-ups
(FLLWUP-114/115/116) were re-homed into a new **EPIC-24**.

## What it establishes

### The gate has a second inert arm: read-back drift

The run's central finding, and the reason it is worth a page: the decision gate
was **inert even though the live call was healthy**. `council_route op:"route"`
returned `source: "fallback"` for both cards — EV-89 with the explicit basis
`recorded decision for this state uses policyVersion "gate-policy-1", current
decision policy is "gate-decision-1" — routes full`. The writer stamps
`policy.policyVersion` (`gate-policy-1`); the reader compares against
`council/gate/decision.json`'s `version` (`gate-decision-1`); two namespaces,
never equal, so `resolveRoute` **drops every recorded decision at read-back**.
This extends [[inert-gate-fallback]], which previously named only the live-call
failure arm (the fixed `noul` drift). FLLWUP-99 owns the fix.

### The fast paths are dark

Both EV-69/EV-70 `Direct`/`Verify` lanes were unreachable, so both cards ran the
full `Deliberate` roster. Across the whole corpus the mode telemetry reads
`Deliberate` 131 / `Direct` 10 / `Verify` 1. An "opened" gate whose decisions are
never read back is not metering anything ([[metered-deliberation-routing]]).

### The run-time profile (the precursor audit)

Aggregate seat time is **~52% model latency / ~44% tool**, with **~80% of tool
time in `council_wait`** — 354 of 468 waits are single-child (avg 455 s). Session
parallelism is **~1.4–1.7×**. Runner orientation (start → first dispatch) is a
median **260 s**, the cost of re-reading `council.md` + `features-deliver.md`
(714 lines) every cold start ([[run-time-profile]]).

### Delivered design

- **EV-89** → [[phase1-rulings-record]]: a closed, ordered, class-enumerated
  record at `council/phase1-rulings.json` with a `ruling` / `n/a: <reason>`
  schema, a `Phase 1 unresolved: <class>` refusal fence, and the authorization
  clause for the record push. Mechanism only — no record written this run.
- **EV-90** → [[procedure-context-injection]]: the runner dispatch input is
  composed from the `renderProcedure`-substituted procedure bodies, with a
  two-args binding (`$ARGUMENTS` is the card id in `council.md` but the epic key
  in `features-deliver.md`).

### Rulings and gaps

- **D1** → [[derived-key-refusal-posture]]: a derived key (epic from a card
  face) that is null/missing is a **fail-loud throw**; "byte-identical" governs
  the enumerated fields, not the dispatch's occurrence.
- **P1-1** → [[record-push-discipline]]: run-scoped admin authorization is a
  **closed enumeration** of three write classes; a write outside it (the
  class-enumeration record commit) HALTs rather than pushing; extending it is a
  human Phase-1 act.
- **The undefined HALT repair** → [[halt-repair-gap]]: the `owner` seat overran
  its 15-min step-2 window twice; the command names no repair, so the
  orchestrator improvised a 30-min window with human consent. A second
  undefined-repair class alongside EPIC-15's mode mismatch.
- **The step-13 return drift** → [[confirmation-authority]]: EV-89's runner
  returned `DONE`-with-held instead of `ESCALATION` (as FLLWUP-107's did in
  EPIC-15); EV-90's escalated correctly.
- **Close-out epic leaks** → [[follow-up-backlog-curation]]: EPIC-23 closed
  `Done` while carrying three open `FLLWUP` children; grouping them into EPIC-24
  is the same curate-then-group lesson one level up.

## Related

- [[inert-gate-fallback]] — the concept this source extends (read-back arm)
- [[metered-deliberation-routing]] — the lanes that never fired
- [[run-time-profile]] — the measured latency/serialization profile
- [[phase1-rulings-record]] — EV-89's mechanism
- [[procedure-context-injection]] — EV-90's mechanism
- [[halt-repair-gap]] — the undefined repair
- [[derived-key-refusal-posture]] — the D1 ruling
- [[record-push-discipline]] — the closed-enumeration authorization
- [[confirmation-authority]] — the step-13 ratify-before-write discipline
- [[deterministic-merge-check]] — the five criteria both merges satisfied

## Sources

- `vault/raw/2026-09-24-epic23-run-ledger.md`