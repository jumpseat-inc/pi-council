---
id: FLLWUP-81
title: Eliminate gate-state.ts's duplicated lenient policy read — resolve the budget through the validated loader or pin the load-order invariant
state: Backlog
owner: null
epic: EPIC-14
goal: gate-state.ts's duplicated, lenient policy.json read is eliminated — resolveGateStateBudget resolves the gateStateBudgetTokens value through the validated loadGatePolicy path (or, failing that, the load-order invariant that buildGateState is reached only after a loadGatePolicy call on every production path is pinned with a test) — with no new runtime gate introduced and the existing suite green.
---

## Intent

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

- Either `resolveGateStateBudget` consumes the validated loader's output (no
  second independent parse of `policy.json` in `gate-state.ts`), or a test
  pins the load-order invariant across every production path, including the
  transitive precedence through `resolveRoute` for the recheck body.
- No new runtime refusal class is introduced.
- The full suite stays green; no packaged data file changes.
