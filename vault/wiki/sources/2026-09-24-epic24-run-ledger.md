---
title: "2026-09-24-epic24-run-ledger"
type: source
summary: The EPIC-24 autonomous /features-deliver run — three cards merged (FLLWUP-115/114/116, PRs #114–#116) on the full Deliberate path, five follow-ups ratified File and re-homed into a new EPIC-25 at closure, and the finding that EV-90's pre-injected procedure still read `features-deliver.md` at startup until a seat-level never-read rule — caught only by the live smoke.
aliases: [epic24 run ledger, EPIC-24 run, EPIC-24]
tags: [pi-council/source, pi-council/features-deliver, pi-council/gate]
sources: []
created: 2026-09-24
updated: 2026-09-24
---

# EPIC-24 Run Ledger

Source: `vault/raw/2026-09-24-epic24-run-ledger.md`. The `/features-deliver`
run on **EPIC-24** ("close the EPIC-23 autonomous-delivery residuals"), run id
`2026-09-24T06-55-21-019Z-582308-gule9d`, orchestrator the human's agent
autonomously (attended only at the Phase-1 rulings questionnaire). The epic
closed `Done` when its three named children merged, and its five open follow-ups
were re-homed into a new **EPIC-25** in the same run.

## What it delivers

| Child | What | PR / merge |
|---|---|---|
| FLLWUP-115 | Frontmatter-scoped `cardEpicKey` + corpus-divergence pin | #114 / `7173477` |
| FLLWUP-114 | Live-smoke verification of the pre-injected runner transcript surface | #115 / `be7d667` |
| FLLWUP-116 | Quote-agnostic file-content import pins (arm a, scoped) | #116 / `fee6334` |

All three ran mode **Deliberate** (substrate read, never a seat's report) and
satisfied all five merge criteria; merged-tree gates green (`bun test` 1530
pass / 6 skip / 0 fail, `tsc` clean, `validate.py` clean, preflight PASS).

## The central finding: pre-injection alone did not stop the read

EV-90 ([[procedure-context-injection]]) moved the procedure bodies into the
runner dispatch input and its unit tests proved the *composer*. FLLWUP-114's
**live smoke** then parsed a real runner session and found designer prediction 1
**false on real behavior**: the flash runner still read
`/pkg/council/procedures/features-deliver.md` at startup. The fix was a
seat-level **never-read rule in `council/agents/council-runner.md`**, merged with
the card. Unit proof of a mechanism is not proof of its operator-observable
behavior — see [[live-mechanism-verification]]. The same live run surfaced a
print-mode stale-ctx parent crash when a dispatched job outlives its turn
(workaround only; follow-up FLLWUP-120).

## A criterion that asserted a falsehood

FLLWUP-115's Acceptance criterion 3 required a corpus test asserting **no card
body line matches `^epic:`**. That was false on the corpus (5 files / 9 body
lines), while the actual divergence was unobservable — `cardEpicKey`'s
whole-file `match` returns the first occurrence, always the frontmatter line, so
no body occurrence ever won. [[product-owner]] amended the criterion
(pre-promotion) to a **behavioral-equivalence pin** between the whole-file and
frontmatter-scoped derivations: green on the current corpus, red exactly when the
scoping change alters a derivation. The judge reads the goal, so a false
criterion forces either a red gate or a dishonest pin
([[engineering-board]]).

## The gate stayed inert at read-back

`.council.json` carried `gate.mode: active`, but `council_route op:route`
returned `source: "fallback"` for every card, so all three ran the full
Deliberate roster and the `Direct`/`Verify` fast paths never fired — the same
read-back arm EPIC-23 found ([[inert-gate-fallback]], FLLWUP-99 still open).

## Escalations and follow-ups

Seven ruling-seat dispatches: [[steward]] job-1 (build order FLLWUP-115 →
FLLWUP-114 → FLLWUP-116, no retirement) and job-15 (EPIC-24 closes `Done`;
re-home five follow-ups to a new EPIC-25); [[product-owner]] job-2 (promote the
three; amend criterion 3), job-5/job-8/job-11/job-13 (step-13 ratifications and
the FLLWUP-116 scope/widening ruling).

Five follow-ups were ratified `File` at the step-13 gate (mode `active`) and
written by resuming runners — none held, none dropped
([[confirmation-authority]], [[step-13-followup-surface]]):

- **FLLWUP-117** — Close the cardEpicKey throw-site JSDoc drift (from 115)
- **FLLWUP-118** — Pin the shared `FRONTMATTER_RE` byte-0 anchor (from 115)
- **FLLWUP-119** — Repair the EPIC-* smoke-fixture card faces (from 114)
- **FLLWUP-120** — Cover the print-mode stale-ctx parent crash (from 114)
- **FLLWUP-121** — Pin `test/stub-child.test.ts`'s flake (from 116)

## Operational lessons

- **The stall-window invariant recurred.** The first FLLWUP-115 container was
  anti-stall-killed at 18.4m because the orchestrator's 8-minute window sat
  under its internal child wait; the resume used `stall_minutes: 55`
  ([[hub-job-supervision]], [[council-runner]]).
- **A timed-out runner keeps running, and `council_wait` treats `timeout` as
  settled** — so a timed-out runner must be polled by manifest/pid until its
  process exits, not waited on through the tool.
- **Board-title parity is not fenced.** A step-13 application runner duplicated
  EPIC-24's title suffix onto FLLWUP-119's board line; `validate.py` checks
  structure, not board-title ↔ card-title equality. The orchestrator's ad-hoc
  board-title audit caught it ([[engineering-board]]).
- **Close-out re-homing moved inside the run.** EPIC-24 closed on its *named*
  acceptance (three children) and created EPIC-25 for its five open residuals,
  rather than leaving them under a `Done` epic
  ([[follow-up-backlog-curation]]).

## Related

- [[live-mechanism-verification]] — the unit-proof-vs-transcript gap this run exposed
- [[procedure-context-injection]] — the mechanism the live smoke amended
- [[council-runner]] — the container the never-read rule lands in
- [[derived-key-refusal-posture]] — the D1 posture this run hardened
- [[inert-gate-fallback]] — the read-back arm, still dark
- [[follow-up-backlog-curation]] — the close-out re-home this run executed
- [[engineering-board]] — the criterion-truth and board-title gaps
- [[deterministic-merge-check]] — the gate all three merges satisfied
- [[hub-job-supervision]], [[run-time-profile]] — the stall/serialization substrate

## Sources

- `vault/raw/2026-09-24-epic24-run-ledger.md`