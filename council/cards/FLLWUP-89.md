---
id: FLLWUP-89
title: Run-start credential preflight: cover /features-new, prove the stale-scaffold reach end to end, and normalize the injected-apiKey seam
state: Backlog
owner: null
epic: EPIC-21
goal: /features-new gains a run-start preflight invocation (or a recorded product-owner ruling that it deliberately has none); an end-to-end test drives a stale-scaffold consumer repo through a gate-on-no-credential run start to the EV-76 single-line FAIL; and runStartGatePreflight's injected-apiKey seam treats the empty string as absent like the runtime resolver, each pinned by test.
---


## Intent

Surfaced by the owner in EV-76 round 1: `council/procedures/features-new.md`
contains no preflight step today (verified: no preflight invocation in the
file). EV-76's run-start check covers `/council` step 0 and `/features-deliver`
Phase 0 only. A `/features-new` session in a repo with the gate enabled and no
OpenRouter credential reaches seat dispatches before any credential check.
Converged "not owed for EV-76" (out of that card's scope) — this is the
follow-up.

---

### Absorbed: FLLWUP-90 — End-to-end falsifier — an already-initialized consumer with a stale council/preflight.sh reaches the run-start gate-credential FAIL

The designer's escalation-class note (EV-76 round 2, note 1) and the
principal's round-1 blind-spot probe: EV-76's "reaches existing consumers
without refreshing council/preflight.sh" is falsified today only by
procedure-text inspection and unit pins on the packaged files — no test drives
a stale-scaffold consumer end to end. The smoke container always holds a
credential, so the gate-on-no-credential state is not smoke-reachable either
(skeptic O-series, EPIC-14). The unit pins are honest but static; this card
buys the dynamic falsifier.

---

### Absorbed: FLLWUP-92 — Align runStartGatePreflight's injected apiKey semantics with the resolver's empty-means-absent rule

Skeptic note (c) from EV-76 step-9 verification: the `{apiKey?}` injection seam
exists for tests, and `""` currently means "credential present" at the seam
while meaning "absent" at the resolver. Unfirable in production (no caller
injects apiKey) — recorded as a semantic-trap nit, not a defect of the shipped
check.

## Acceptance

- The three run-start surfaces (`/council` step 0, `/features-deliver` Phase 0,
  `/features-new` step 0) either all run the same credential-conditional check
  or the exclusion is a recorded product-owner ruling, not an omission.
- If added, the off-mode behavior for `/features-new` adds nothing (same
  add-nothing property EV-76 pinned).

---

### From FLLWUP-90 — End-to-end falsifier — an already-initialized consumer with a stale council/preflight.sh reaches the run-start gate-credential FAIL

- The fixture consumer's `council/preflight.sh` is a pre-EV-76 scaffold copy
  (no gate awareness) — the test must NOT ship a gate-aware preflight.sh into
  the fixture.
- With gate mode enabled and no credential, the run start halts on the
  decisions-gate FAIL line; with mode off or a stored credential present, it
  proceeds to the preflight script unchanged.
- The harness deletes OPENROUTER_API_KEY from the environment (skeptic O10
  discipline) rather than trusting the runner's env.

---

### From FLLWUP-92 — Align runStartGatePreflight's injected apiKey semantics with the resolver's empty-means-absent rule

- Injecting `""` behaves identically to injecting `null`/`undefined`-then-
  resolving-to-null, or the seam's type narrows to make `""` unrepresentable.
- A test pins the chosen semantics; no production behavior change.
