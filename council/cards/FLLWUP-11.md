---
id: FLLWUP-11
title: Smoke phase selector for the /council-models Phase 5 falsifier
state: In Progress
owner: owner
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

## Phase 1 rulings (features-deliver, binding for this run)

- **R-1 (optional fold-in is in scope)**: the card's optional item is
  included — Phase 5 assertions source the R-2 usage line and R-3 notify
  copy from the ruled literals rather than in-repo constants, closing
  the self-referential `USAGE_LINE` test gap.

Recorded human decision — immutable for the run and binding on every seat,
`steward` included.

## Deliberation

### Step 1 gate
Mechanical, not surface-touching (smoke-harness infrastructure).
Narrowly-scoped, unambiguous, confined to the smoke harness area
(`smoke/driver.sh` plus the phase-assertion constants in
`test/council-models.test.ts`): the goal names the mechanism
(`SMOKE_PHASE=5`-style environment-gated selector), the isolated behavior
(only Phase 5 executes and reports PASS/FAIL), and the no-selector default
(phases 0–4 unchanged); R-1 pins the optional fold-in (phase assertions
source the R-2 usage line and R-3 notify copy from the ruled literals on
EV-25's face, closing the self-referential `USAGE_LINE` gap in H1). The one
implementation latitude — how the phase-5 path obtains its fixture
preconditions before the block's own `python3 council/validate.py`
assertion (the fixture's `council/` ships `board.md`/`cards/`/`preflight.sh`
but no `validate.py`, so the 0d `/council-init` scaffold or an equivalent is
required) — is an implementation choice inside a bounded script, not a
design tradeoff; no visible surface or user copy changes. Skips steps 2–6;
proceeds directly to step 7 with the card itself as the owner handoff (no
spec file — mechanical path). State gate: the card is `Backlog`, but the
orchestrator's Phase-2 scheduling under features-deliver is this run's
promotion (authority map re-homes promotion ratification; identical to the
FLLWUP-10 precedent that immediately precedes this card).

### Step 7 — In Progress, handed to owner
Card set In Progress on frontmatter and board; `validate.py` clean. Owner
dispatched at the card (mechanical-path handoff: the card's Intent and
goal) with the repo gate set, branch/PR conventions, and the environment
facts (docker up, `OPENROUTER_API_KEY` set).
