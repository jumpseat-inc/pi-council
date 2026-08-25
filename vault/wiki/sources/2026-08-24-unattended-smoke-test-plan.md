---
title: Unattended Smoke Test — Implementation Plan
type: source
summary: The task-by-task runbook for building the smoke test — fixture consumer repo, pinned Docker image, run/assert/driver scripts, and the two LLM-costing verification tasks.
aliases: [smoke test plan]
tags: [pi-council/smoke-test]
sources: ["[[smoke-test]]"]
created: 2026-08-25
updated: 2026-08-25
---

# Unattended Smoke Test — Implementation Plan

Source: `docs/superpowers/plans/2026-08-24-unattended-smoke-test.md` — the
six-task runbook that built [[smoke-test]].

## Task shape

1. **Fixture consumer repo** — `smoke/fixture/`: a small real bun+TS project
   (markdown-link-extractor CLI), pre-authored cards `EV-1`/`EV-2`/`EV-3` +
   `EPIC-1`, all-9-seat `.council.json` flash override, and a repo-local
   `preflight.sh` adapted to drop the OAuth-only MCP gate and the
   `origin/main` ancestry gate. No `vault/` (scaffold creates it — the degraded
   "no wiki" grounding path gets tested too).
2. **Docker image** — `node:24-bookworm` + git + python3 + bun + pi pinned at
   `0.84.3`; ephemeral git identity; `defaultProjectTrust: "always"`.
3. **run.sh / assert.sh / driver phase 0** — host entrypoint (key check, build,
   one-shot run, artifact extraction, prune to 5) + the assertion helpers
   (card state, board column, exact JSON/images probes) + install/init phase.
   This task doubled as the **approach A/B spike**: confirming headless
   `pi -p "/council-init"` routes slash commands.
4. **Phase 1** — `/council EV-1` with the harness merge gate and kill-shot
   probes. Real dispatches, ~5-15 min on flash.
5. **Phase 2** — `/features-deliver EPIC-1` with exact probes; plus the
   `"smoke"` package.json script and README note.
6. **Verification sweep** — clean re-run (idempotency), repo hygiene.

## Facts the plan embedded (verified up front, not re-derived)

- `pi install -l /absolute/path` pins the local path into `.pi/settings.json`
  **without copying**.
- `/council-init` is a deterministic engine command (no LLM turn).
- Headless modes never show a trust prompt; `--approve` overrides per run.
- `validate.py` enforces id `^(EV|FLLWUP|BUG|EPIC)-[1-9]\d*$` matching the
  filename, and board lines `- <ID> — <Title>` under the state column.
- Runs substrate lives at `.pi/council/runs/<runId>/` (manifests + JSONL).
- `council-runner`'s "container" is a metaphor for an isolated pi session — no
  Docker-in-Docker.

## Cost honesty

Tasks 4 and 5 spend real OpenRouter tokens (the actual council runs) —
single-digit dollars on flash, and there is no cheaper substitute: the full
green run **is** the verification.

## Related

- [[smoke-test]], [[2026-08-24-unattended-smoke-test-design]]
- [[headless-pi]]

## Sources

- `docs/superpowers/plans/2026-08-24-unattended-smoke-test.md`
