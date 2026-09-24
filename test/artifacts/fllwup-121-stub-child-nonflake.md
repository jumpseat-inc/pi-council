# FLLWUP-121 — stub-child non-flake disposition (arm b: demonstrated non-flake)

Card: `council/cards/FLLWUP-121.md`. The one observed failure: the FLLWUP-116
judge's full-suite run at head `4515efe` failed once in `test/stub-child.test.ts`
(1253 pass / 1 fail in that file); 5× solo + 1 full-suite rerun at the same tree
were all green. One failure, never reproduced — the card's arm-(b) bar is a
demonstrated non-flake result.

## File identity at the time of the observation vs. this tree

- `test/stub-child.test.ts`, `test/stub-child.ts` at this worktree's head
  (`ea2c3e7` tree) are byte-identical to `4515efe`'s (verified by the prior
  session's plan record and re-verified at this head: neither file appears in
  any commit touching them since `fee6334`/4515efe lineage; `git log
  --oneline -- test/stub-child.test.ts test/stub-child.ts` shows no commit
  after the EV-41/EV-39 era). The one failing run therefore observed the same
  bytes this record stress-tests.
- `extensions/hub.ts` changed on this branch (FLLWUP-120's guard touched
  `extensions/index.ts`, not hub.ts — hub.ts's last change predates 4515efe;
  verified: `git log --oneline 193c724..HEAD -- extensions/hub.ts` → empty).

## The harness

`smoke/runs/stub-child-stress.sh` (committed here) — solo rounds plus N-way
parallel batches of `bun test test/stub-child.test.ts`, each run
`timeout 120`-bounded, every failing run's raw output saved under `smoke/runs/`
(and none was saved: the count of `smoke/runs/*fail*` files after the campaign
is 0).

## Fresh evidence at head `ea2c3e7` tree (this session, 2026-09-24 ~20:55 UTC)

Three harness invocations, cumulative:

| invocation | args (solo, batches, wide) | runs | failures |
|---|---|---|---|
| 1 | 30, 10, 8 | 110 | 0 |
| 2 | 0, 4, 8 | 32 | 0 |
| 3 | 5, 5, 8 | 45 | 0 |
| **total** | | **187** | **0** |

Each invocation's tail output was observed directly in this session (the last:
`solo: 5 rounds, 0 failures / parallel: 40 runs, 0 failures / total: 45 runs,
0 failures`). Prior-session scratch runs (the plan doc's 128-run claim) are
superseded — this record carries only counts observed and saved in this
session.

## Root-cause narrative (named, for the record)

The named hazard class is machine-load child-process scheduling under the full
suite's parallel pressure: `test/stub-child.test.ts` spawns `bun
stub-child.ts` children via `Bun.spawnSync` six times per run; a child starving
under load makes one assertion miss. The file's assertions cannot pass
spuriously (each asserts exact byte/exit behavior of a stateless-per-invocation
child; the `STUB_STATE` file is per-test `mkdtemp` — no cross-test coupling),
so a scheduling stall produces a real one-off failure, not a false-positive
pass. 187 fresh stress runs under 8-wide parallel pressure at the identical
bytes produce zero failures — the observed failure does not recur; the file is
sound. Test assertions untouched (arm (b) requires no test change).
