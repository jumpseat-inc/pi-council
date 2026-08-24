---
title: MCP Support
type: concept
summary: The engine subsystem that lets seats use tools from registered MCP servers — led by configuration, secrets in mcp-auth, MCP telemetry names, sandboxed seat grants.
aliases: [mcp, model context protocol]
tags: [pi-council/concept]
sources: []
created: 2026-08-23
updated: 2026-08-23
---

# MCP Support

> ⚠️ Derived from `extensions/mcp/**` (index, config, auth-store, client, oauth, schema) (captured 2026-08-23). Verify against the source; mature subsystem (v0.22.0→v0.4.0).

pi has no built-in MCP, so pi-council ships one. Seats can call tools from
**registered, authenticated MCP servers** (Context7, Tavily, ...). This is the
v0.2.0 subsystem formed by the design + implementation plans.

## Storage — two locations

- **Registrations (committable, repo-local):** `<REPO>$CONFIG_DIR_NAME/council/mcp.json`.
  Remote `url` ; stdio `command`+`args`; `auth: none|header|oauth`; `headers`
  may use `$ENV_VAR` (resolved at connect, never copied). Malformed whole file =
  whole-config fail; a bad entry = that server skipped with a warning.
- **Secrets (user-global, never committed):** `getAgentDir()/council/mcp-auth.json`,
  **0600**, atomic temp+rename. Header values entered via `/mcp login` and OAuth
  token sets here. Refresh/reauth across sessions/children.

## Lifecycle `# one command, subcommand-dispatched`

`/mcp list | add | remove | login | logout | status <name>`. The parent connects
servers config auth'd at session_start and registers their tools as pi tools
`mcp__<server>__<tool>` (converting JSON Schema → TypeBox). Tool results: text.

## Seats

- Seats declare `mcp: [name, …]` frontmatter. No `mcp:` field → zero MCP access.
- `--tools` is an **exact-name allowlist** — the child's argv must enumerate
  every granted `mcp__...` name, discovered by the parent at dispatch.
- The child **connects eagerly at startup** (lazy connect deadlocks).
- Every MCP call passes through the existing sandbox (`isCallAllowed`): granted
  server → allowed; else blocked.
- A granted-but-unauthenticated server's tools are omitted from argv + the
  dispatch warns.

## Security

Auth file never logged/echoed; the OAuth callback binds **127.0.0.1 only**,
validates `state`, shuts down after first code or 5 minutes. `$ENV` never
persisted resolved. Seats never attempt interactive auth (headless by design).

## Version lineage

The subsystem landed in **v0.2.0** and matured through later bumps:
Context7 became a default server in v0.3.0, Tavily joined in v0.4.0, and seat
MCP grants were rebalanced as the defaults shifted (see [[preflight]] and
[[2026-08-23-mcp-implementation-plan]]).

## Related

- [[seats]], [[override-resolution]]
- [[2026-08-23-mcp-implementation-plan]], [[2026-08-23-mcp-support-design-spec]]

## Sources

- `extensions/mcp/*`
- `README.md` (MCP Server section)
- `AGENTS.md` (convention 10-11)