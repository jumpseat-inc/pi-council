---
id: EPIC-4
title: Model eval harness for council commands and seats
state: Backlog
owner: null
epic: null
goal: An eval harness runs every shipped council command and seat under a caller-chosen model and reports per-model scores with repeat-run variance so model assignments come from evidence rather than guesswork
---

## Intent

Seat models are currently pinned in frontmatter and overridable only by
editing the committed `.council.json` — there is no way to know whether a
candidate model is actually better as `owner` than as `skeptic`, or better
at driving `/council` than `/features-new`. The maintainer wants evidence
before re-pinning.

This epic builds an eval harness that runs the council's commands and seats
under a caller-chosen model, grades each run against a rubric, and reports
per-model comparison with repeat-run variance. It ships in the package and
follows the repo-local override convention (a repo's `.pi/` resources shadow
packaged ones) for fixtures and rubrics.

Inventory the harness must cover: the 9 packaged seats (consolidator,
council-runner, designer, judge, owner, principal, product-owner, skeptic,
steward — note there is no `ceo` seat; repo-local `.pi/agents/` overrides
count as seats too) and the 7 shipped procedures (board-create-card,
council, features-deliver, features-new, wiki-ingest, wiki-lint, wiki-query).

Children: EV-16 (design spec — lands first), EV-17 (per-run model override),
EV-18 (benchmark fixtures), EV-19 (scoring rubric and verifier), EV-20
(matrix runner with repeat aggregation), EV-21 (results leaderboard). The
later children depend on the spec's definitions and stay `Backlog` until the
spec lands and the human promotes them. All six children landed `Done`
(EV-20 via PR #16 merged `fb858b0`, EV-21 via PR #18 merged `22630ff`,
gates green on merged SHAs).

Follow-ups filed by the run and scoped under this epic (human-approved at
run close, 2026-09-04): FLLWUP-5 (criterion-type-aware judge projection,
originally filed from EV-19 step 13), FLLWUP-6 (judge-bearing fixture
smoke), FLLWUP-7 (eval-results retention policy), FLLWUP-8
(council-leaderboard task drill-down).

## Acceptance

- EV-16's spec defines "accurately measure" for agent commands and seats,
  the harness architecture, the per-run model override, the rubric, and the
  confidence methodology (repeat runs and variance), and lands before the
  implementation children run.
- Every shipped procedure and packaged seat has at least one pinned fixture
  (EV-18) and every fixture has a rubric the scorer (EV-19) can grade.
- `/eval` (EV-20) runs a task-and-model matrix with a configurable repeat
  count and writes reproducible per-run records.
- The results view (EV-21) ranks models per command and per seat with repeat
  count, mean, and variance, and shows a truthful empty state before any run.
- All children land with tests; `bun test`, `bunx tsc --noEmit`, and
  `python3 council/validate.py` stay green.
