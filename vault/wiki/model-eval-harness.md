---
title: Model Eval Harness
type: concept
summary: The EPIC-4 subsystem — /council-eval runs a task×model×repeat matrix over shipped fixtures in isolated scratch trees and writes durable records; /council-leaderboard reads them back as per-command and per-seat rankings; evidence replaces guesswork for seat model pins.
aliases: [eval harness, council-eval, council-leaderboard]
tags: [pi-council/epic4]
sources: ["[[2026-09-04-epic4-run-ledger]]", "[[2026-09-03-po-ev21-ruling]]"]
created: 2026-09-04
updated: 2026-09-04
---

# Model Eval Harness

The answer to "which model should be `owner`?" — evidence instead of
guesswork. Built by EPIC-4 (six cards, EV-16..EV-21, all landed `Done`).

## Shape

- **Fixtures** (EV-18): one per packaged seat and per shipped procedure —
  `kind: seat|procedure`, a pinned seed tree (`treeDigest` verified at
  load), a `graderModel`, a rubric with gate and/or judge criteria.
  7 gate-only fixtures, 9 judge-bearing. Whole-task-dir
  [[override resolution|override-first-hit]].
- **Write side** — `/council-eval <task> <model…> [--repeat N]` (EV-20): a
  TypeScript-registered command (not a markdown procedure), catalogue
  pre-validation before any dispatch, echo-then-run confirmation, one
  cell per (task × model) run in a disposable scratch tree seeded from the
  fixture, spawned same-hub with `cwd: scratch` so both manifest roots
  share one `COUNCIL_RUN_ID`. Grader is a harness-dispatched sibling (see
  [[grader topology]]). One [[eval store contract|ResultRecord]] per run,
  plus a VerdictRecord per (cell, repeat) when a judge ran.
- **Read side** — `/council-leaderboard` (EV-21): pure read, both
  By-command and By-seat slices, rows ranked mean-desc with adjacent-pair
  `tied (±CI)` triage, gate-only rows separated, four truthful empty
  states.
- **Aggregation** — one shared pure module ([[cell aggregation]]);
  "records alone suffice to recompute every aggregate" holds by
  construction and is smoke-pinned byte-identity.

## Governing rulings

R-1 storage local-only gitignored; R-2 repeat default 3 (cap 20);
R-3/R-6 command names; R-5 records-alone; grader topology Option A; O1
ResultRecord key; Q1 verdict repeat + version-pair-in-key + `self`
sentinel; EV-21 ruling (name, CONFIRM-2 fold-in, σ, empty spectrum,
Phase-4 smoke, kind limitation).

## What it does NOT do (by ruling)

No implicit all-models sweep; no store schema for `kind` (read-time
fixture join); no implicit store pruning ([[card id allocation|follow-up
FLLWUP-7]] owns retention); smoke does not yet exercise judge-bearing
stores end-to-end (FLLWUP-6).

## Related

- [[eval store contract]] — the records and keys.
- [[cell aggregation]] — mean/σ/triage, same-function-both-sides.
- [[grader topology]] — why the grader is a sibling.
- [[council leaderboard]] — the read surface.
- [[procedures vs commands]] — why these are TS commands, not procedures.
- [[smoke test]] — Phases 3 and 4 pin the seam.

## Sources

- [[2026-09-04-epic4-run-ledger]]
- [[2026-09-03-po-ev21-ruling]]
