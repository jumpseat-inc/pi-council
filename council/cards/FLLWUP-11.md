---
id: FLLWUP-11
title: Smoke phase selector for the /council-models Phase 5 falsifier
state: Backlog
owner: null
epic: EPIC-6
goal: smoke/driver.sh accepts an environment-gated phase selector so the /council-models Phase 5 end-to-end smoke runs in isolation without phases 0 through 4 real-model dispatches, proven by running the driver with the selector set and observing only Phase 5 execute and report.
---

## Intent

Filed from EV-25's run. The `/council-models` end-to-end smoke (Phase 5,
added to `smoke/driver.sh` by EV-25) only executes inside the full
multi-phase container harness whose phases 0–4 dispatch real models with
30/90-minute ceilings — unholdable inside any bounded council-runner
window. EV-25 discharged its smoke acceptance via an ad-hoc scoped script
instead. A phase selector makes the falsifier runnable in isolation.
Optionally folds the R-2/R-3 byte-literal authority into the phase
assertions, closing the self-referential `USAGE_LINE` test gap the Skeptic
noted in `test/council-models.test.ts` H1.

## Acceptance

- A `SMOKE_PHASE=5`-style selector runs only Phase 5 against a real
  registered command in a real session and reports PASS/FAIL.
- Phase assertions source the R-2 usage line and R-3 notify copy from the
  ruled literals rather than in-repo constants (no self-reference).
- Phases 0–4 behavior unchanged when no selector is set.
