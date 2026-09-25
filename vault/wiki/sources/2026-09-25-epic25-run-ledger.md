---
title: "2026-09-25-epic25-run-ledger"
type: source
summary: The EPIC-25 autonomous /features-deliver run under a human topology override — one council-runner for all five cards, owner-first, one branch/PR/squash-merge (PR #117, mode Verify), two follow-ups re-homed to EPIC-26, and a third recurrence of the documented-but-unhardened board heading-uniqueness gap.
aliases: [epic25 run ledger, EPIC-25 run, EPIC-25 batch run]
tags: [pi-council/source, pi-council/features-deliver, pi-council/hub]
sources: []
created: 2026-09-25
updated: 2026-09-25
---

# EPIC-25 Run Ledger (the batch-override run)

Source: `vault/raw/2026-09-25-epic25-run-ledger.md`. The `/features-deliver`
run on **EPIC-25** ("close the EPIC-24 autonomous-delivery residuals"), run id
`2026-09-24T06-55-21-019Z-582308-gule9d`, orchestrator the human's agent
autonomously (attended at the Phase-1 questionnaire).

## What was different

The human **overrode the one-runner-per-card mandate**: a single
`council-runner` handled all five children, the **owner worked on all five
first**, and the **skeptic and judge ran only after all owner work was
committed**. All five rode **one branch (`feat/epic25-residuals`), one PR
(#117), and one squash merge**; no deliberation roster was seated, so the run is
a batch **Verify** lane. See [[batch-runner-topology]].

## Delivery

| Child | What | PR / merge |
|---|---|---|
| FLLWUP-117 | cardEpicKey throw-site docs reconciled (zero executable change) | #117 / `02d73f2` |
| FLLWUP-118 | `FRONTMATTER_RE` byte-0 anchor pinned | #117 / `02d73f2` |
| FLLWUP-119 | `EPIC-*` smoke-fixture faces repaired; SMOKE_PHASE=7 ran | #117 / `02d73f2` |
| FLLWUP-120 | print-mode stale-ctx parent crash covered (`STALE_CTX_PREFIX` guard) | #117 / `02d73f2` |
| FLLWUP-121 | stub-child flake demonstrated non-flake (221 runs, 0 fails) | #117 / `02d73f2` |

Head `cf7abd8a`, squash merge `02d73f287809652fbfed99b38da88a9da8f54ef2`, mode
**Verify** read from the run substrate; `gates` `SUCCESS` on head and merged
SHA. Merged-tree gates: `bun test` 1532 pass / 6 skip / 0 fail, `tsc` clean,
`validate.py` clean, preflight PASS.

## Findings worth keeping

- **One PR ⇒ one SHA for N cards.** Every card's merge basis keys to the same
  head/merged SHA; criteria 3 and 4 are the *single* skeptic and judge covering
  all five goals ([[deterministic-merge-check]]).
- **The board heading-uniqueness gap recurred a third time.** The batch runner's
  union-keep reconcile produced a duplicate `## In Progress` / `## In Review`
  header pair with `validate.py` green; the orchestrator repaired it by hand.
  `engineering-board` had already recorded this as "the obvious hardening…
  still no card" after EPIC-13 and EPIC-15 — this is the third documented
  recurrence, still unhardened ([[engineering-board]], [[union-merge-reconcile]]).
- **The owner phase is the long pole and unsteady.** Four owner dispatches:
  one stalled, two cancelled at their ceiling, one completed (`job-16.4`); the
  run wall was ~4h for five cards ([[hub-job-supervision]], [[run-time-profile]]).
- **Single-writer violation, reverted.** The owner violated the branch's
  single-writer discipline and the facilitator reverted it — a
  [[main-repo-immutability]] witness.
- **Three step-13 candidates: File ×2, Drop ×1.** FLLWUP-122 and FLLWUP-123
  were ratified and filed; the watch-only stub-child candidate was **dropped**
  as a stale-prone placeholder ([[confirmation-authority]],
  [[step-13-followup-surface]]).
- **Close-out re-home:** EPIC-25 closed `Done` and FLLWUP-122/123 were re-homed
  to a new **EPIC-26** in one record push ([[follow-up-backlog-curation]]).
- **The gate stayed inert at read-back** ([[inert-gate-fallback]]).

## Related

- [[batch-runner-topology]] — the execution shape this run introduced
- [[council-runner]] — the single container
- [[deterministic-merge-check]] — the Verify check over five cards and one SHA
- [[engineering-board]] — the heading-uniqueness recurrence
- [[hub-job-supervision]], [[run-time-profile]] — the owner-phase cost
- [[main-repo-immutability]] — the single-writer violation
- [[follow-up-backlog-curation]] — the EPIC-25→EPIC-26 re-home
- [[confirmation-authority]], [[step-13-followup-surface]] — the File/Drop gate

## Sources

- `vault/raw/2026-09-25-epic25-run-ledger.md`