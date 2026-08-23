---
title: 2026-08-23 Context7-by-default + Preflight Plan
type: source
summary: The v0.3.0 bounded task plan — ship Context7 as a default MCP server, grant it to six seats, and make preflight structurally assert the registration + stored auth.
tags: [pi-council/source]
sources: []
created: 2026-08-23
updated: 2026-08-23
---

> ⚠️ Derived from `docs/superpowers/plans/2026-08-23-context7-default-preflight.md` @ `a3141df` (captured 2026-08-23).

A small, scoped plan: no engine-mechanics change. Three edits.

## The three edits

1. **`scaffoldInto`** writes a non-clobbering `$CONFIG_DIR_NAME/council/mcp.json`
   registering context7 (OAuth endpoint) + renders `@CONFIG_DIR@` → the real
   config-dir name in the copied `preflight.sh`, and adds `DEFAULT_MCP_CONFIG`.
2. **Six seat frontmatters** gain `mcp: [context7]` — council-runner, designer,
   owner, principal, skeptic, steward (a refined set vs. the earlier draft that
   also included consolidator/product-owner).
3. **`preflight.sh`** gains a structural check block asserting the context7
   registration + stored auth present.

All existing MCP plumbing (parent auto-connect, seat grants, `--tools`
allowlist, `/mcp login` OAuth) is reused untouched.

## Interesting choices

- Config-dir rendered at copy time into shell (production TS still never
  hardcodes `.pi`).
- `preflight` is **structural** (B), not a live OAuth probe.
- Same `version: 0.3.0` bump in the same PR as the seat grants, per AGENTS rules.

## Related

- [[mcp-support]], [[preflight]], [[seats]]
- [[2026-08-23-mcp-implementation-plan]]

## Sources

- `docs/superpowers/plans/2026-08-23-context7-default-preflight.md` @ `a3141df`