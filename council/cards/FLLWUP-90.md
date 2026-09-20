---
id: FLLWUP-90
title: End-to-end falsifier — an already-initialized consumer with a stale council/preflight.sh reaches the run-start gate-credential FAIL
state: Backlog
owner: null
epic: EPIC-14
goal: an automated end-to-end test drives a fixture consumer repo that was initialized with an OLD (pre-EV-76) scaffold — stale data-class council/preflight.sh, packaged procedures absent — through a run start with gate.mode enabled and no OpenRouter credential, and asserts the run halts on EV-76's single-line decisions-gate FAIL, proving the packaged-path reach claim the procedure-text pins only assert statically.
---

## Intent

The designer's escalation-class note (EV-76 round 2, note 1) and the
principal's round-1 blind-spot probe: EV-76's "reaches existing consumers
without refreshing council/preflight.sh" is falsified today only by
procedure-text inspection and unit pins on the packaged files — no test drives
a stale-scaffold consumer end to end. The smoke container always holds a
credential, so the gate-on-no-credential state is not smoke-reachable either
(skeptic O-series, EPIC-14). The unit pins are honest but static; this card
buys the dynamic falsifier.

## Acceptance

- The fixture consumer's `council/preflight.sh` is a pre-EV-76 scaffold copy
  (no gate awareness) — the test must NOT ship a gate-aware preflight.sh into
  the fixture.
- With gate mode enabled and no credential, the run start halts on the
  decisions-gate FAIL line; with mode off or a stored credential present, it
  proceeds to the preflight script unchanged.
- The harness deletes OPENROUTER_API_KEY from the environment (skeptic O10
  discipline) rather than trusting the runner's env.
