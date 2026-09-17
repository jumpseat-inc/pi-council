---
id: FLLWUP-60
title: Non-admin record-push path for autonomous runs
state: Backlog
owner: null
epic: EPIC-9
goal: Under the active main ruleset (approving review + linear history + changes must be made through a pull request), an autonomous features-deliver run completes every step-12 record write without an unrecorded privileged bypass — either an explicit, run-scoped, human-recorded authorization for the direct record push exists on the run's Phase-1 record before the run's first record push, the procedure names that authorization explicitly, and an unauthorized push is a HALT surfaced to the human; or the record-push path no longer requires any bypass.
---

## Intent

`council.md` step 12 instructs committing the reconciliation directly to `main`
and pushing. The active `main` ruleset blocks direct updates, so every record
push in the 2026-09-17 EPIC-9 residual run bypassed the protection via the
pusher's admin identity — a mechanism outside the run's Phase-1 ruling R2,
which scoped itself to `gh pr merge --admin`, and outside the authority map's
coverage entirely. `steward` (job-30) ruled the past pushes an accepted
permanent residual (disclosed in the run-close record, no undo), but ruled the
standing posture *not* acceptable unchanged: the next autonomous run hits this
deterministically on every card's step 12.

**Falsifier (red-first):** a test pinning `council.md` step 12's record-push
paragraph, in the same idiom FLLWUP-42's `test/prose.test.ts` pin used.

**Non-goals:** no change to the five deterministic criteria, to
`--match-head-commit` pinning, to FLLWUP-42's merged merge paragraph, or any
reopening of FLLWUP-42.

**Build order (`steward`):** this card sits in the EPIC-9 closure's "standing
machinery owed before the next autonomous run" class (FLLWUP-40/41/42/43 now
all `Done`) and sequences **before the next autonomous run's first dispatch**,
ahead of the pending non-blocking Backlog (`FLLWUP-50`–`54`). Independently of
whether it lands first, the next run's Phase 1 must either record the
run-scoped record-push authorization explicitly before the first record push,
or the run does not proceed unattended.

Ruled owed by `steward` (job-30), acceptance shape verbatim.
