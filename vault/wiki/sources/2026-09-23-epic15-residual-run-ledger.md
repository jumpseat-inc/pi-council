---
title: 2026-09-23 EPIC-15 Residual Run Ledger
type: source
summary: The EPIC-15 residual run — five Backlog residuals (FLLWUP-111, 109, 110, 107, 108) delivered serially under run-scoped R-A/R-B authorizations, the recorded-mode-vs-executed-mode mismatch that HALTed FLLWUP-111, and the held-follow-up routing to product-owner.
aliases: [epic15 residual run ledger, EPIC-15 residual ledger, 2026-09-23-epic15-residual-run-ledger]
tags: [pi-council/source, pi-council/epic15, pi-council/features-deliver]
sources: []
created: 2026-09-23
updated: 2026-09-23
---

# 2026-09-23 EPIC-15 Residual Run Ledger

The autonomous `/features-deliver EPIC-15` **residual** run delivered the five
`Backlog` cards that still carried `epic: EPIC-15` after the epic itself closed
`Done`: **FLLWUP-111** (migrate `runTool` to async `Bun.spawn`), **FLLWUP-109**
(create an absent `--cache-file` parent), **FLLWUP-110** (`cache: hits/misses`
in the human summary), **FLLWUP-107** (renderProcedure substitution-set pin +
packaged-procedure token scan), **FLLWUP-108** (sentence-scoped remediation pin).
Run id `2026-09-22T20-33-20-915Z-499978-uus0pt`; five merges (PRs #107–#111);
no `RETIRED`, no `Needs Human`. This is a *residual* run distinct from
[[2026-09-22-epic15-run-ledger]] (BUG-2 + FLLWUP-105/106).

## A residual scope is a full run

`EPIC-15` was `Done` while the five residuals sat `Backlog`; delivering them was
a new run, not an epic re-open, and it required its own Phase-1 authorizations.
The human's "deliver all five" is **not** the record-push/admin authorization:
**R-A** (direct step-12 record push) and **R-B** (`--admin` merge) were recorded
on the epic card before the first push, then exercised
([[record-push-discipline]], [[deterministic-merge-check]]). This was the first
run since EPIC-9 to record both cleanly at Phase 1. Build order was
[[steward]]'s (job-1), serial: `111 → 109 → 110 → 107 → 108`, because 111's
async `runTool` must land before 109/110 author new tests on it and the 107
guard must land before the 108 wording-coupled edit it guards.

## The headline defect — recorded mode ≠ executed mode

The orchestrator's `council_dispatch` `mode` param is written to the **ROOT
manifest**, but the runner re-derives its path via `council_route op:route`; on
the no-recorded-decision fallback its own step-1 judgment governs. For
FLLWUP-111 the orchestrator recorded `Verify` while the runner judged and ran
`Direct` (owner-only — no skeptic, no judge). The merge check read the run
substrate, got `Verify`, and issued verbatim:

> `HALT: FLLWUP-111 — mode Verify requires a goal evaluation and none is recorded`

It did **not** merge on the runner's Direct report ("the run substrate, never a
seat's report"). The orchestrator repaired by producing the missing `Verify`
evidence at the recorded mode — `skeptic` (job-4, no blocking objections; T-U9
pin red-at-base / green-at-head) and `judge` (job-5, `PASS`) — after which all
five criteria held and the pinned merge proceeded. The remaining four cards were
dispatched `Direct`, which is self-correcting because `readCardMode` upgrades to
`Deliberate` on any generator seat. See [[execution-mode-recording]].

The repair path — the orchestrator dispatching the missing mode's seats directly
— is **not described by the command** (which only says HALT). Flagged as an open
gap; a card is owed.

## Merges

| Card | Mode | PR | Merged SHA |
|---|---|---|---|
| FLLWUP-111 | Verify (repaired) | #107 | `927fdaa` |
| FLLWUP-109 | Direct | #108 | `3d62b3a` |
| FLLWUP-110 | Direct | #109 | `9da7ff1` |
| FLLWUP-107 | Direct | #110 | `41e9676` |
| FLLWUP-108 | Direct | #111 | `077ebc1` |

Every merge pinned with `--match-head-commit` under R-B; `gates` `SUCCESS` on
every head and merged SHA.

## Operational learnings

- **Runner stall window must exceed the longest seat bound it waits on.**
  `stall_minutes: 6` anti-stall-killed the first FLLWUP-111 runner at ~8 min
  while it blocked on a 45-min owner dispatch (its private record commit had
  landed); `75` survived the rest of the run ([[council-runner]],
  [[hub-job-supervision]]).
- **Held follow-up candidates are a real routing surface.** FLLWUP-107's runner
  returned `DONE`-with-held instead of `ESCALATION`; the orchestrator routed the
  drafts to [[product-owner]] (job-10), which overturned an unsupported `Merge`
  (no target) to `File` and confirmed the other `File` → [[followup-decision-gate]],
  [[confirmation-authority]]; **FLLWUP-112** / **FLLWUP-113** filed.
- **`validate.py` does not catch duplicate board headings** — several writes left
  a stray second `## In Review`; the validator enforces card membership, not
  heading uniqueness ([[engineering-board]]).

## What it closed

The `/usages` lineage ([[usages-report]]): FLLWUP-109 creates a foreign
`--cache-file` parent, FLLWUP-110 prints `cache: hits=<N> misses=<M>`, FLLWUP-111
removes the test-side `spawnSync` deadlock trap, and FLLWUP-107/108 harden the
procedure-copy pins. `bun test` moved 1466 → 1485 tests ([[test-suite-budget]]).

## Related

- [[execution-mode-recording]] — the run's central new concept
- [[deterministic-merge-check]], [[council-runner]], [[record-push-discipline]]
- [[followup-decision-gate]], [[confirmation-authority]]
- [[usages-report]], [[test-suite-budget]], [[engineering-board]]
- [[2026-09-22-epic15-run-ledger]] — the first EPIC-15 run (BUG-2 + 105/106)

## Sources

- `vault/raw/2026-09-23-epic15-residual-run-ledger.md`
- `council/cards/FLLWUP-107.md` … `FLLWUP-111.md`, `council/cards/EPIC-15.md`