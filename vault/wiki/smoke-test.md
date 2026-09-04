---
title: Smoke Test
type: concept
summary: The definitive, unattended end-to-end test — Phases 0–4 drive a real /council loop, a /features-deliver epic, the /council-eval matrix, and /council-leaderboard in an isolated container, re-running gates itself; standing discipline: the first Council command without an end-to-end falsifier is a defect.
aliases: [smoke, unattended smoke test, smoke test]
tags: [pi-council/smoke-test]
sources: ["[[2026-08-24-unattended-smoke-test-design]]", "[[2026-08-24-unattended-smoke-test-plan]]", "[[2026-08-25-smoke-test-bugfixes]]", "[[2026-09-04-epic4-run-ledger]]"]
created: 2026-08-25
updated: 2026-09-04
---

# Smoke Test

`bun run smoke` (host script `smoke/run.sh`) — the package's release-readiness
check, replacing a human manually installing and driving a council run. It is
**definitive by construction**: green only if the product works.

## Architecture

- **Container** — `node:24-bookworm` + git + python3 + bun + pi pinned at
  `0.84.3` (bump is a deliberate Dockerfile line); ephemeral git identity;
  `defaultProjectTrust: "always"`; one-shot `docker run --rm` with the repo
  bind-mounted at `/pkg`.
- **Fixture** — `smoke/fixture/`: a small real bun+TS CLI (markdown link
  extractor) with pre-authored cards (`EV-1 --count`, `EV-2 --json`,
  `EV-3 --images`, `EPIC-1`), all 9 seats overridden to
  `openrouter/deepseek/deepseek-v4-flash-0731` via `.council.json`, a repo-local
  `preflight.sh` (no MCP/OAuth or origin gates), and an empty `.pi/council/mcp.json`.
  Pre-authored **standing rulings** on the epic/child cards make the autonomous
  flow deterministic.
- **Driver** — `smoke/driver.sh` runs phases; `smoke/assert.sh` holds the
  structural assertions; every phase is `timeout`-ceiled (30 / 90 min,
  Phase 3 has its own ceiling).

## The phases

1. **Phase 0** — seed worktree, `pi install -l /pkg`, `pi -p "/council-init"`;
   assert pins, non-clobber (`.council.json`, `preflight.sh`, `board.md`
   survive), `validate.py`, preflight exit 0.
2. **Phase 1** — `pi -p "/council EV-1"`; assert card `Done`, board column, ≥3
   seat sessions; **kill-shot probes**: typecheck, `bun test`, functional
   `--count` probe against a hardcoded expected value. The **harness plays the
   human** at the merge gate (merges the feature branch, sets `Done`, commits)
   and resumes one known `In Progress` pause state (flash-model variance).
3. **Phase 2** — `pi -p "/features-deliver EPIC-1"`; assert both children
   `Done`, board consistent, exact `--json`/`--images` probes, flag-conflict
   exit 2, council-runner dispatch evidence in `runs/`.
4. **Phase 3** (EV-20 Q3 ruling) — `pi -p "/council-eval eval-smoke <model>
   --repeat 2"` headlessly against a seeded gate-only fixture override;
   assert per-repeat snapshot dirs under `council/eval-results/`, durable
   `[council-eval]` transcript lines, live-vs-re-derivation byte-identity
   through *different code paths* (writer path vs reader path — not
   tautological), `validate.py` green after. "If Phase 3 cannot run, the
   card does not merge."
5. **Phase 4** (EV-21 ruling J-2) — `pi -p "/council-leaderboard"` against
   the Phase-3 records; assert the gate-only empty-state line, both
   By-command and By-seat slices, and leaderboard-reader vs
   `summarizeStore` byte-identity on n/mean/σ. Same standing rule: no
   merge without Phase 4 green. A judge-bearing Phase 5 is filed as follow-up card FLLWUP-6 (under
   EPIC-4), not yet built.

## The philosophy: never trust a claim, re-run reality

The judge's PASS is not the proof — the harness re-runs typecheck, the test
suite, and the exact CLI outputs itself. A seat's prose is never taken on
faith. This is what makes it deterministic despite the LLM underneath.

## Hard-fail semantics

Zero retries; red is red. Every run ships forensics to
`smoke/.artifacts/<ts>/` (pruned to 5; dot-dir so `bun test` never discovers
the council-written test files inside — see [[2026-08-25-smoke-test-bugfixes]]),
and on red the last seat transcript tail prints for immediate triage. Re-run is
the same one command; the container is fresh each time.

## Track record

In its first implementation round it caught **three real production bugs**
(headless procedure dispatch, MCP startup crashes, hub tools never reaching
seat children — which meant `/features-deliver` was broken end-to-end). See
[[2026-08-25-smoke-test-bugfixes]].

## The lighter sibling: the SMOKE-1 scratch run (v0.15.0)

The EPIC-3 run added a second, lighter smoke pattern for **in-run procedure
verification** (the SMOKE-1 ruling): a scratch copy of `council/` in a temp
dir with the rewrite at the [[override-resolution|override path]], headless
`pi -p "/features-new <toy>"`, dispatched-job-ids as evidence, real board
untouched. It complements — does not replace — the Docker smoke: it can run
mid-epic on a single procedure change. Its record: it caught the
[[presented-never-written|Part-1 attribution blur]] (the run's one real
design bug). And its cap lesson: a 20-minute ceiling killed a healthy run
mid-aggregation — the ceiling was the bug, not the run.

## Related

- [[headless-pi]] — the operating-mode rules the driver depends on
- [[procedure-commands]], [[seats]], [[hub-job-supervision]], [[preflight]]
- [[2026-08-24-unattended-smoke-test-design]], [[2026-08-24-unattended-smoke-test-plan]]

## Sources

- `smoke/run.sh`, `smoke/driver.sh`, `smoke/assert.sh`, `smoke/fixture/`
- [[2026-08-24-unattended-smoke-test-design]], [[2026-08-24-unattended-smoke-test-plan]]
- [[2026-08-24-unattended-smoke-test-design]], [[2026-08-24-unattended-smoke-test-plan]]
- [[2026-08-26-smoke-v0.12.0]] — clean-green v0.12.0 run, [[2026-08-25-smoke-test-bugfixes]]
- [[2026-09-04-epic3-run-ledger]] — the SMOKE-1 scratch-run variant
