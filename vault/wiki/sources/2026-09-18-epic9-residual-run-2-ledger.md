---
title: 2026-09-18 EPIC-9 Residual Run 2 Ledger
type: source
summary: The /features-deliver run that delivered EPIC-9's eleven remaining Backlog residuals (FLLWUP-50–60) — ten gated merges, one R4 retirement, the pre-write step-13 gate inversion, and two new pi-runtime mechanism findings.
aliases: [epic9 residual run 2, residual run 2 ledger, 2026-09-18-epic9-residual-run-2-ledger]
tags: [pi-council/run-ledger, pi-council/epic9]
sources: ["[[2026-09-18-epic9-residual-run-2-ledger]]"]
created: 2026-09-18
updated: 2026-09-18
---

# EPIC-9 Residual Run 2 Ledger (2026-09-18)

The second `/features-deliver` run over EPIC-9's residuals: the eleven
remaining `Backlog` cards `FLLWUP-50`–`60`. Ten merged, one retired under a
human ruling. Source: [[2026-09-18-epic9-residual-run-2-ledger]].

## Outcome

Ten merges (PRs #67–#77) plus `FLLWUP-52` retired under R4. All five
[[deterministic-merge-check]] criteria held on every card; `gates` `SUCCESS` on
each PR head SHA and each merged SHA. Serial order ruled by [[steward]]:
`60 → 52 → 57 → 51 → 53 → 50 → 54 → 55 → 56 → 59 → 58`. No `HALT`. The run
opened with the owed record-push machinery ([[record-push-discipline]]) and
closed with the CI runaway backstop.

## What is new

- **The step-13 follow-up gate is pre-write, and a runner inverted it.** A
  false "cards land in Backlog, confirmed at ledger level" precedent was
  recorded; [[steward]] ruled it false and carded `FLLWUP-69` to pin the gate
  in the procedures. See [[engineering-board]].
- **The runner is never a ruling seat, and the ruling seat never hand-edits
  `vault/`** — two round-2 confirmations were dropped as cards and routed to
  the ingest instead of being minted ([[llm-wiki]]).
- **Two pi-runtime mechanism findings** landed from `FLLWUP-56`: project
  extension discovery is not `-a`-gated ([[headless-pi]]), and jiti's sync
  pipeline mis-resolves file-valued subpath aliases in nested `require()`
  ([[council-theme]]).
- **`goal:` is now positional** in card frontmatter — a consumer-visible
  breaking change from `FLLWUP-51` ([[engineering-board]]).
- **The CI backstop's census is thinner than first advertised** — the shipped
  `timeout-minutes: 60` has ~1 minute of headroom, not 10
  ([[test-suite-budget]]).
- **A live arm's header carries the design-time expectation, not the
  measurement**; the measured figure lives in [[test-suite-budget]]'s per-file
  row (`FLLWUP-56` R1).
- **Record-push closure**: `council.md` step 12 now names the run-scoped
  authorization and fences an unauthorized push as a HALT — the gap
  [[record-push-discipline]] recorded is closed.
- **Concurrent runs share one board.** EPIC-10/11/12 wrote it mid-run; two
  sanctioned union merges, no history rewrite ([[union-merge reconcile]]).
- **The EV-40 jitter flake reddened merged-SHA CI twice** on untouched files,
  each healed by one disclosed same-commit rerun; carded as `FLLWUP-63`.

## Escalation load

Six escalations served; `product-owner` jobs 3/7/12/15/18/21/24/25/27/29/31 and
[[steward]] jobs 1/8/13/16. Escalation, not the criteria, paced the run — the
EPIC-7/8/9 pattern continuing.

## Follow-ups

`FLLWUP-61`–`70`, all `epic: EPIC-9`, `Backlog`, unpromoted: worktree-seat cwd
discipline, the frontmatter continuation residual, the EV-40 jitter top edge,
refresh-surface cosmetics, `_template.md` reclassification, `--refresh-file`,
the refresh-path wiki pages, the cold-read persona smoke, the pre-write
step-13 gate pin, and the gates CI-timeout residuals.

## Related

- [[2026-09-17-epic9-residual-run-ledger]] — the first residual run
- [[record-push-discipline]] — the gap this run closed
- [[test-suite-budget]], [[engineering-board]], [[headless-pi]],
  [[council-theme]], [[retired-path-tokens]], [[smoke-test]]
- [[deterministic-merge-check]], [[union-merge reconcile]], [[council-runner]]

## Sources

- [[2026-09-18-epic9-residual-run-2-ledger]]