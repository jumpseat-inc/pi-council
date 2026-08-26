---
title: 2026-08-23 "MCP Support" Design Spec
type: source
summary: The design of the MCP subsystem (v0.2.0) — servers registry, split storage (committable config vs secret auth), parent auth + seat consumption, and the exact-name tool allowlist mechanic.
aliases: []
tags: [pi-council/source]
sources: []
created: 2026-08-23
updated: 2026-08-23
---

> ⚠️ Derived from `docs/superpowers/specs/2026-06-25-mcp-support-design.md` @ `9457278` (captured 2026-06-25).
> Status: approved design, pending implementation plan (for v0.2.0).

The MCP support design — it defines how the Council's seats consume tools from
registered Model Context Protocol servers (e.g. Context7), with OAuth and 
oauth authentication.

## Core constraints it establishes

- **pi has no built-in MCP** (by explicit design), so this subsystem lives
  entirely in pi-council.
- **Seats are headless** (`--mode json -p`): no browser. So *the parent
  authenticates; seats consume credentials.*
- Built on the **official SDK** (`@modelcontextprotocol/sdk` v1.30.x) as a
  bundled runtime dep.
- Implement on **Streamable HTTP + stdio** transports and the SDK's
  `OAuthClientProvider` scaffolding.

## Storage model (two locations)

Split by committability:

1. **Registrations — repo-local, committable, no secrets:** `<repo>/$CONFIG_DIR_NAME/council/mcp.json`.
   Remote servers declare `url`; stdio servers declare `command`+`args`
   (mutually exclusive). `auth: none|header|oauth`. `headers` may use
   `$ENV_VAR` indirection resolved at connect time.
2. **Secrets — user-global, never committed:** `<getAgentDir()>/council/mcp-auth.json`
   (0600), containing header values entered via `/mcp login` and the full OAuth
   client registration + token set.

## Auth, bridging, statuses

- Modes: `none` / `header` / `oauth`; OAuth implements discovery/DCR/PKCE via
  the SDK, and the council supplies its `redirectToAuthorizationCallback`,
  token store, and client info (loopback listener on 127.0.0.1; state validated;
  5-minute window).
- Tool bridging: parent registers `mcp__<server>__<tool>` tyyped tools (JSON
  Schema → TypeBox); seats grant via a new `mcp:` frontmatter field; `--tools`
  is an **exact-name allowlist**, cookies forwarded from parent at dispatch.
- Statuses: `disabled → unauthenticated → connected → error / reauth-required`.
- Out of scope: resources/prompts/sampling (tools only), hot-reload, in-seat
  interactive auth.

## Related

- [[mcp-support]] — the shipped subsystem concept
- [[seats]] — `mcp:` grant field & the exact-name allowlist
- [[pi-council-overview]] — the v0.2.0 result of this design

## Sources

- `docs/superpowers/specs/2026-08-23-mcp-support-design.md` @ `9457278`
- Companion plan: [[2026-08-23-mcp-implementation-plan]]