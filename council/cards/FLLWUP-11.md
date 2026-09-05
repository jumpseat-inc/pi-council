---
id: FLLWUP-11
title: Smoke phase selector for the /council-models Phase 5 falsifier
state: In Review
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

### Step 8 — In Review (owner implemented, PR #27 open)
Owner dispatched at the card (job-12.1), settled in 4.6m, report recorded:
plan `docs/superpowers/plans/2026-09-05-FLLWUP-11-phase-selector.md`
(committed); `smoke/driver.sh` restructured so Phase 0 and Phase 5 bodies
are wrapped byte-verbatim into `phase0_prepare()` / `phase5_run()`, with an
isolation branch ahead of phases 1–4 (function declarations precede the
branch; bash defines at runtime); `smoke/run.sh` forwards `SMOKE_PHASE`;
the R-1 fold-in moved H1/H2/H3 expectations to test-local EV-25 R-2/R-3
ruled literals plus a new source-audit test byte-locking the module
constants/function output to the ruling. Gates: `bun install
--frozen-lockfile` exit 0 (bun.lock unchanged); `bunx tsc --noEmit` clean;
`bun test` 539 pass / 2 skip / 0 fail (main measured 538/2/0 pre-+1);
`python3 council/validate.py` clean; `bash -n` clean both scripts.
Acceptance observed by the owner: `SMOKE_PHASE=5 bun run smoke` →
FLLWUP-11 isolated banner, phase-0 setup (no `SMOKE PHASE 0 PASS`
verdict), no phases 1–4 banners, all Phase 5 greps green, ending
`SMOKE PASS — phase 5 (council-models) verified in isolation
(SMOKE_PHASE=5)`, host exit 0 (artifacts `smoke/.artifacts/20260905-063114`
in the worktree); FAIL path `SMOKE_PHASE=999` → `SMOKE FAIL: unsupported
SMOKE_PHASE...`, exit 1 (artifacts `…063129`); no-selector full path
byte-identical structure (diffed) with the final full-loop PASS line
intact.

Observed artifacts confirmed by the facilitator: PR #27 OPEN, branch
`fllwup-11-phase-selector`, head `1b37acdf0a690b019e52b4f0e80d0859e9c03042`,
base `main` (origin at `bbbeab4`); diff scope = plan, `smoke/driver.sh`,
`smoke/run.sh`, `test/council-models.test.ts` + this card's own record
commits riding through (established epic pattern); smoke artifacts
`20260905-063114`/`063129` present in the worktree's `smoke/.artifacts/`.
Set In Review per step 8's observed-artifact rule (branch + open PR).

### Step 9 — verified (cycle 1 of ≤3)
Skeptic dispatched at PR #27 head `1b37acd` (job-12.2), settled in 6.7m.
All four gates plus `bash -n` re-run green at the head: `bun install
--frozen-lockfile` exit 0 no lockfile diff; `bunx tsc --noEmit` clean;
`bun test` 537 pass / 2 skip / 0 fail (54 files; the owner's 539 vs 537
discrepancy is bun's counting of fixture-discovered tests — same suite,
green either way); `python3 council/validate.py` clean.
Independent acceptance probes, all run fresh (not from the owner's
artifacts): `SMOKE_PHASE=5 bash smoke/run.sh` via docker → isolation
banner, phase-0 prep (no verdict), NO phases 1–4 banners, all Phase 5
greps green, final `SMOKE PASS — phase 5 (council-models) verified in
isolation (SMOKE_PHASE=5)`, host exit 0; `SMOKE_PHASE=999` → `SMOKE
FAIL: unsupported SMOKE_PHASE='999'`, exit 1; `git diff` of the driver
confirms phase 1–4 statements byte-identical to base and the full-loop
PASS line preserved; grep probe confirms H1/H2/H3 assert `RULED_*`
literals never module exports; drift injection in a scratch copy (both
`RULED_*`-literal drift and module-constant drift) turns H1/H2 and the
source-audit test red — the settlement tripwire works in both
directions. 11 objections filed, **all `closed-green`**; O11: the
isolation path does run phase-0's `/council-init` (a short deterministic
real-session scaffold — required because the fixture ships no
`validate.py`), observed and judged closed-green against the card's
record (the Intent's binding property is bounded-window feasibility —
phases 1–4 never run under the selector; the whole isolation run settles
in minutes). **Verdict: NO-BLOCK, no open objection.**

### Step 10 — judge PASS
Judge dispatched with the card's `goal` and the Skeptic's step-9 evidence
only (job-12.3), settled in 0.3m. Verdict **PASS**: all three conjunctive
goal clauses verified — (1) `SMOKE_PHASE` env gate present in
`smoke/driver.sh` (line 21) and forwarded by `run.sh`; (2) isolation path
runs `phase0_prepare 0` (verdict suppressed) + `phase5_run` then exits —
phases 1–4 live after the branch and are unreachable under the selector;
(3) the single `SMOKE PASS — phase 5 … verified in isolation` line is the
only report in the isolation path, observed with all Phase 5 assertions
green and host exit 0.
