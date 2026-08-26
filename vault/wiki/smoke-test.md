---
title: Smoke Test
type: concept
summary: The definitive, unattended end-to-end test — one command drives a real /council loop and a /features-deliver epic in an isolated Docker container, asserting structure and re-running gates itself; it caught three production bugs in its first round.
aliases: [smoke, unattended smoke test, smoke test]
tags: [pi-council/smoke-test]
sources: ["[[2026-08-24-unattended-smoke-test-design]]", "[[2026-08-24-unattended-smoke-test-plan]]", "[[2026-08-25-smoke-test-bugfixes]]"]
created: 2026-08-25
updated: 2026-08-25
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
- **Driver** — `smoke/driver.sh` runs three phases; `smoke/assert.sh` holds the
  structural assertions; every phase is `timeout`-ceilinged (30 / 90 min).

## The three phases

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

## Related

- [[headless-pi]] — the operating-mode rules the driver depends on
- [[procedure-commands]], [[seats]], [[hub-job-supervision]], [[preflight]]
- [[2026-08-24-unattended-smoke-test-design]], [[2026-08-24-unattended-smoke-test-plan]]

## Sources

- `smoke/run.sh`, `smoke/driver.sh`, `smoke/assert.sh`, `smoke/fixture/`
- [[2026-08-24-unattended-smoke-test-design]], [[2026-08-24-unattended-smoke-test-plan]]
- [[2026-08-26-smoke-v0.12.0]] — clean-green v0.12.0 run, [[2026-08-25-smoke-test-bugfixes]]
