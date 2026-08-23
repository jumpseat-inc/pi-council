---
title: 2026-08-23 MCP Implementation Plan
type: source
summary: The task-by-task build-out of the MCP subsystem per the design spec — v0.2.0 with SDK-internals-grounded fixtures, OAuth browser flow, tool-bridging entry points, and seed TDD coverage.
tags: [pi-council/source]
sources: []
created: 2026-08-23
updated: 2026-08-23
---

> ⚠️ Derived from `docs/superpowers/plans/2026-08-23-mcp-implementation.md` @ `addc2f9` (captured 2026-08-23).

The execution runbook that turned the MCP design spec into the v0.2.0
subsystem. Notable for how concrete its engineering constraints are.

## Key engineering facts it pins

- **SDK import subpaths** — bun requires `.js` suffixes on every SDK subpath
  (`.../client/streamableHttp.js`, `.../client/stdio.js`, ...); the barrels do
  NOT re-export these.
- **typebox peer dep is v1.x** — schemas are plain JSON Schema objects, so tests
  must assert on JSON structure.
- **Auth file** is `0600` and written atomically (temp + rename). Never write
  secrets into `mcp.json`; never log tokens.
- **`--tools` exact-name allowlist / eager connect**: seat argv must enumerate
  granted MCP tool names; lazy connect deadlocks.
- **header/oauth require `url`** (remote HTTP); stdio servers use `none`.
- **TDD** per task — failing test → run → fail → implement → pass → commit.

## Phasing recap

Two phases: **Phase 1** = dependency + registry + management commands + both
transports + auth bridging + fixture tests (exit: Context7 via API key).
**Phase 2** = OAuth — provider, login flow, token store, silent refresh,
reauth surfacing, stub-AS tests (exit: Context7 via OAuth).

## Related

- [[2026-08-23-mcp-support-design-spec]] — the design it implements
- [[mcp-support]], [[seats]]
- [[pi-council-overview]] — the v0.2.0 result of this plan

## Sources

- `docs/superpowers/plans/2026-08-23-mcp-support-implementation.md` @ `addc2f9`