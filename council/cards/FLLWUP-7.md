---
id: FLLWUP-7
title: Retention policies for the append-only stores: eval-results cohorts and the durable usage store
state: Backlog
owner: null
epic: null
goal: council/eval-results stops growing without bound under a retention rule that never prunes the newest version cohort of any cell (whole superseded cohorts or named cells only, never individual repeats), and the durable usage store applies a bounded retention policy that keeps recent records while preserving the provenance pointers of survivors, each proven by a test with byte-identical recompute/read-back for survivors.
---


## Intent

Filed from EV-21's step-13 draft-then-confirm (human-approved, 2026-09-04).
The skeptic confirmed during EV-21 verification that the results store is
append-only and never pruned (`readAllResults` reads every record file;
no version cleanup anywhere in `runMatrix`), and EV-20's Q2 ruling defaults
per-repeat snapshot persistence ON (`council/eval-results/<cellId>/r<N>/
snapshot/`). Repeated matrices therefore accumulate record files and full
seeded snapshots without bound.

Constraint inherited from R-5 and the EV-19 O1 ruling — records alone must
suffice to recompute every aggregate — so retention may only drop whole
superseded version cohorts (or whole cells the caller names), never
individual repeats of the newest cohort, or the leaderboard's means and σ
become unreproducible.

---

### Absorbed: FLLWUP-32 — Usage-store retention and compaction policy

EV-31 ships a durable store at `getAgentDir()/council/usage/` that is, by
design, never pruned — durability is the point. But an unbounded store is its
own long-term liability, and EV-31's spec §5 lists retention as a forward
decision. The policy must not defeat the traceability the store exists for:
pruning a record's file while leaving a pointer, or vice versa, breaks
read-back.

## Acceptance

- A retention rule (keep-latest-N version cohorts per `cellId`, or an
  explicit prune command — the deliberation picks) runs at a defined
  trigger and documents the trigger.
- The newest `(fixtureVersion, rubricVersion)` cohort of every cell is
  never pruned; nothing under `runs/` is touched (convention 12 boundary).
- After retention, `summarizeStore` and the leaderboard recompute
  byte-identically from the retained set; tests pin both the pruning rule
  and the recompute guarantee.

---

### From FLLWUP-32 — Usage-store retention and compaction policy

- A store grown past the configured bound drops oldest-first and keeps the
  newest records.
- Read-back for every retained record still resolves its provenance pointer.
- `bun test`, `bunx tsc --noEmit`, `python3 council/validate.py` stay green.
