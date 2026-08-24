---
title: Preflight
type: concept
summary: The shell+script standard fixture that gates every council run — card-aware checks, MCP registration/auth, superpowers + ask-user-question pins, openrouter auth; any FAIL: line halts startup.
aliases: [preflight gate]
tags: [pi-council/concept]
sources: ["[[2026-08-24-ask-user-question]]"]
created: 2026-08-23
updated: 2026-08-24
---

# Preflight

> ⚠️ Derived from `council/scaffold/council/preflight.sh` (a template, non-doc), `council/procedures/council.md` (step 0), `council/procedures/features-deliver.md` (Phase 0), `council/procedures/features-new.md` (step 0) (captured 2026-08-23). Verify against the file.

`council/preflight.sh` (scaffolded by `/council-init`, with `@CONFIG_DIR@` rendered
at copy time) is the deterministic gate that must pass **before any council run
starts**. The facilitator runs it at `/council` step 0, and `features-deliver.md`
Phase 0 runs it once for an epic.

## What it checks (fail-fast)

- **superpowers** present project-locally (clone under
  `$CONFIG_DIR_NAME/git/github.com/obra/superpowers` or pin in
  `$CONFIG_DIR_NAME/settings.json`) — else `FAIL`.
- **ask-user-question** present project-locally (clone under
  `$CONFIG_DIR_NAME/npm/node_modules/@juicesharp/rpiv-ask-user-question` or pin
  in `$CONFIG_DIR_NAME/settings.json`) — else `FAIL`.
- **bun** on PATH.
- project root marker (`package.json`/`bun.lock`); `bun install --frozen-lockfile`.
- **Card-aware**: `council/cards/<card>.md` exists when given.
- **main fast-forwards** from origin.
- **MCP gate** (context7 + tavily): registration present + stored credentials
  present. Structural only, not a live OAuth probe.
- **OpenRouter provider authorized** (v0.5.0) — API key source or stored auth.

The MCP + OpenRouter gates were added incrementally: the context7 structural
assertion in v0.3.0, expanded to cover tavily in v0.4.0, and the OpenRouter
authorization assertion in v0.5.0. The ask-user-question gate landed with the
second council dependency (see [[council-dependencies]]).

## Contract

`FAIL:` **halts the run** verbatim; the script prints no install steps (the
facilitator's job is remediation). It's card-aware: an import-dataset check is
skipped unless the card involves import.

## Related

- [[council-dependencies]], [[ask-user-question]], [[mcp-support]], [[council-loop]]
- [[2026-08-23-context7-preflight-plan]]

## Sources

- `council/scaffold/council/preflight.sh`
- reference file for the check it tests