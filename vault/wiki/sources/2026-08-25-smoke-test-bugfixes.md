---
title: Smoke Test Bugfixes (v0.10.0)
type: source
summary: The three real bugs the unattended smoke test caught in pi-council's own engine — headless procedure dispatch, MCP startup crashes, and hub tools never reaching seat children — plus the v0.10.0 release.
aliases: [smoke test bugfixes, v0.10.0]
tags: [pi-council/smoke-test, pi-council/release]
sources: ["[[smoke-test]]"]
created: 2026-08-25
updated: 2026-08-25
---

# Smoke Test Bugfixes (v0.10.0)

Source: the implementation round behind [[smoke-test]] — three production bugs
the end-to-end run surfaced (fix commits `9151505`, `77305d1`, `0c2666f`),
released as **v0.10.0** (commit `5bf3900`, tags `v0.10.0` + `latest`).

## Bug 1 — procedure commands were a silent no-op headlessly

- **Symptom:** `pi -p "/council EV-1"` exited 0 but nothing ran; card untouched.
- **Mechanism:** procedure handlers called `pi.sendUserMessage(...)` without
  awaiting; the extension API wrapper is fire-and-forget (resolves before the
  turn runs); print mode tears the runtime down after the initial prompt
  resolves → the dispatched turn never started. Interactive TUI worked only
  because the session stays alive.
- **Fix (`extensions/index.ts`):** mode-aware handler — TUI fire-and-forget;
  print/json/rpc block until the turn completes via `ctx.waitForIdle()` (after
  polling for the run to become active, since `waitForIdle` returns immediately
  before the run starts). See [[headless-pi]].

## Bug 2 — MCP startup could crash any session

- **Symptom:** session crash with "This extension ctx is stale after session
  replacement"; later a hard crash on malformed `mcp.json`.
- **Mechanism:** the `session_start` handler kicked off async
  `connectParentServers`; its continuation touched the captured `ctx` after a
  session replacement (ctx getters call `assertActive()` and throw), and a
  rejected connect was an unhandled rejection.
- **Fix:** guard the notify (drop it when the ctx is stale) and swallow connect
  rejections — MCP is best-effort at startup; seats report their own warnings at
  dispatch time.

## Bug 3 — hub tools never reached seat children (`/features-deliver` broken end-to-end)

- **Symptom:** the `council-runner` HALTed before dispatching a single seat —
  its session exposed only `read, bash, edit, write, grep, find, ls`.
- **Mechanism:** `child.ts` registered `council_dispatch/wait/cancel` and
  `isCallAllowed` permitted them, but `buildChildArgv` never added them to the
  `--tools` allowlist — and pi enforces `--tools` as an **exact-name gate**.
  Attended `/council` worked only because its parent session has no `--tools`
  restriction. The runner's own forensics identified the exact line
  (`seats.ts:244`).
- **Fix:** `buildChildArgv` now appends the three hub tool names when
  `grantsFor(seat).hub` — mirroring `isCallAllowed`. TDD: failing tests first
  (`test/seats.test.ts`).

## Bug 4 — test-discovery poisoning (repo hygiene)

- `smoke/artifacts/<ts>/work/` holds council-written test files copied out as
  forensics; `bun test` at the repo root discovered them and failed the suite.
  `bunfig.toml` exclude patterns were ineffective on bun 1.3. Fix: rename to a
  dot-dir `smoke/.artifacts/` — bun skips dot-directories in discovery.

## What the council's discipline proved under fire

- The `/features-deliver` orchestrator **refused** to infer the merge-check
  adaptation (no remote/CI) itself — routed to the human per the authority map.
- The `council-runner`'s HALT contract produced complete forensics and stopped
  rather than working around the environment.
- Flash-model variance surfaced (one facilitator asked the git-strategy question
  upfront vs. at the gate); deterministic handling: pre-authored rulings on card
  faces, harness plays the human at gates, one resume on a known pause state.

## Related

- [[smoke-test]], [[headless-pi]], [[seats]], [[hub-job-supervision]],
  [[procedure-commands]]
- [[2026-08-24-unattended-smoke-test-design]], [[2026-08-24-unattended-smoke-test-plan]]

## Sources

- Commit `9151505`, `77305d1`, `0c2666f`, `5bf3900` (git log on `main`)
- `extensions/index.ts`, `extensions/seats.ts`, `extensions/child.ts`
- `test/seats.test.ts`
