---
title: Unattended Smoke Test — Design
type: source
summary: The design for a definitive, unattended smoke test: one command that builds a throwaway Docker container, installs pi-council into a fresh consumer repo, and drives a full /council loop plus a /features-deliver epic — green only if the product works.
aliases: [smoke test design]
tags: [pi-council/smoke-test]
sources: ["[[smoke-test]]"]
created: 2026-08-25
updated: 2026-08-25
---

# Unattended Smoke Test — Design

Source: `docs/superpowers/specs/2026-08-24-unattended-smoke-test-design.md` — the
approved design behind [[smoke-test]]. Brainstormed because the package's
release-readiness check was a human manually installing pi-council into a fresh
repo and driving a council run by hand.

## The contract

- **One command** — `bash smoke/run.sh` — builds an isolated container,
  installs the package into a fixture consumer repo exactly as a consumer
  would, and drives two full product paths unattended: a `/council` card loop
  and a `/features-deliver` epic.
- **Definitive means structural.** Green only if the product works; no retries,
  no flake forgiveness, full forensic artifacts every run. The harness never
  trusts a seat's prose — it re-runs the gates itself (kill-shot probes).
- **Hard fail, zero retries** — a failed run is red; re-run is one command with
  a fresh container and fresh repo state.

## Key decisions (the brainstorm outcomes)

| Decision | Choice | Rationale |
|---|---|---|
| Scope | Full `/council` loop + `/features-deliver` epic | Smallest surface where "the product works" is true |
| Trigger | Local, manual (`smoke/run.sh`) | Per user; CI was dropped mid-brainstorm |
| Seat models | All 9 → `openrouter/deepseek/deepseek-v4-flash-0731` via fixture `.council.json` | Cost/time; the override mechanism gets a real workout; dated ID pinned |
| Failure semantics | Hard fail, zero retries, artifacts always | A smoke that retries hides its failures |
| Driver surface | `pi -p "<slash command>"` headless (approach A) | Tests the real product surface; SDK driver (B) only as fallback |
| Base image | `node:24-bookworm` + git + bun, pi pinned at build | Reproducible; a pi bump is a deliberate Dockerfile line |
| Credentials | `OPENROUTER_API_KEY` only, via env | Only key the gates require; fresh container `HOME` |

## What the driver asserts (the deterministic bar)

- **Phase 0** — install → `/council-init` → preflight; pins, scaffold
  non-clobber, `validate.py`, preflight exit 0.
- **Phase 1** — `/council EV-1`: card state `Done`, board column, ≥3 seat
  sessions in `runs/`, then **kill-shot probes**: typecheck, `bun test`, and a
  functional `--count` probe with a hardcoded expected value.
- **Phase 2** — `/features-deliver EPIC-1`: both children `Done`, board
  consistent, exact `--json`/`--images` probes, flag-conflict exit codes,
  council-runner dispatch evidence.

## Explicit non-goals

- No MCP/OAuth coverage (OAuth browser flow impossible unattended; fixture runs
  with an empty MCP registry — unregistered servers degrade to dispatch
  warnings, existing designed behavior).
- No `/wiki-*` commands; no CI; no engine changes. If the smoke needs an engine
  hook to pass, that is a product bug — the plan's escape hatch that this round
  exercised three times.

## Related

- [[smoke-test]] — the implemented concept
- [[headless-pi]] — the operating-mode rules the driver depends on
- [[procedure-commands]], [[seats]], [[hub-job-supervision]]

## Sources

- `docs/superpowers/specs/2026-08-24-unattended-smoke-test-design.md`
