---
title: MCP Support
type: concept
summary: The engine subsystem that lets seats use tools from registered MCP servers — split storage (committable config vs 0600 secrets), oauth via loopback or copy-paste remote login, sandboxed seat grants.
aliases: [mcp, model context protocol]
tags: [pi-council/concept]
sources: ["[[2026-08-25-remote-mcp-oauth]]"]
created: 2026-08-23
updated: 2026-08-25
---

# MCP Support

> ⚠️ Derived from `extensions/mcp/**` (index, config, auth-store, client, oauth, schema) (captured 2026-08-23; remote-login section captured 2026-08-25). Verify against the source; mature subsystem (v0.2.0→v0.11.0).

pi has no built-in MCP, so pi-council ships one. Seats can call tools from
**registered, authenticated MCP servers** (Context7, Tavily, ...). This is the
v0.2.0 subsystem formed by the design + implementation plans.

## Storage — two locations

- **Registrations (committable, repo-local):** `<REPO>$CONFIG_DIR_NAME/council/mcp.json`.
  Remote `url` ; stdio `command`+`args`; `auth: none|header|oauth`; `headers`
  may use `$ENV_VAR` (resolved at connect, never copied). Malformed whole file =
  whole-config fail; a bad entry = that server skipped with a warning.
- **Secrets (user-global, never committed):** `getAgentDir()/council/mcp-auth.json`,
  **0600**, atomic temp+rename. Header values entered via `/mcp login`, OAuth
  token sets, and the **pending PKCE verifier** (`oauth.verifier`) for a
  two-phase remote login live here. Refresh/reauth across sessions/children.

## Lifecycle — one command, subcommand-dispatched

`/mcp list | add | remove | login [--remote|--local] | auth | logout | status
<name>`. The parent connects servers config auth'd at session_start and
registers their tools as pi tools `mcp__<server>__<tool>` (converting JSON
Schema → TypeBox). Tool results: text.

- **`login <name>`** — `oauth` mode auto-detects a headless/remote session
  (`SSH_TTY` set, or Linux without DISPLAY/WAYLAND_DISPLAY) and routes to the
  copy-paste flow; `--remote` / `--local` force either way. `header` mode
  prompts for secrets.
- **`auth <name> <pasted>`** — phase 2 of remote login: exchanges the code
  pasted back from the user's browser (v0.11.0).

## Authentication

### Modes

1. **`none`** — connect directly.
2. **`header`** — inject configured headers (env-indirection resolved, or
   values fetched from the auth file) on every request.
3. **`oauth`** — full MCP authorization-spec flow via the SDK's
   `OAuthClientProvider`. Two login paths:

   - **Loopback (same machine):** open the system browser at the
     authorization URL; ephemeral 127.0.0.1 listener (OS-assigned port,
     5-minute window) captures the code.
   - **Remote copy-paste (any machine):** capture the authorization URL and
     print it. The user opens it on any device and pastes the redirected URL
     back into `/mcp auth`. The fixed loopback URI is
     `http://127.0.0.1:8765/callback`; the PKCE verifier persisted from
     phase 1 (single-use, consumed on token save) makes phase 2 safe with no
     tunnels or relays. See [[remote-oauth-login]] for the pattern.

### Token lifecycle & reauthentication

- Parent and seats call `tokens()` before requests; expired access tokens are
  refreshed silently via `refresh_token`.
- A failed refresh (revoked/expired refresh token) sets the server's status to
  `reauth-required` and every tool call returns a structured error:
  `MCP server "<name>" requires reauthentication — run /mcp login <name>.`
  Seats surface this verbatim to the facilitator; the facilitator surfaces it
  to the human. Seats never attempt interactive auth.
- `logout` clears tokens; the next tool call reports `unauthenticated`.

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

Auth file never logged/echoed; the OAuth callback binds **127.0.0.1 only** and
shuts down after the first code or the timeout window. ⚠️ **Contradiction
flagged (2026-08-25):** the wiki previously claimed the callback "validates
`state`" — the code never did (the loopback listener extracts only `code`, and
`state` handling in `oauth.ts` is the OAuth *discovery* state, not the CSRF
`state` param). The remote paste path explicitly scopes `state` validation out
(negligible CSRF surface with copy-paste + PKCE). `$ENV` never persisted
resolved. Seats never attempt interactive auth (headless by design).

## Version lineage

The subsystem landed in **v0.2.0** and matured through later bumps: Context7
became a default server in v0.3.0, Tavily joined in v0.4.0, seat MCP grants
were rebalanced as the defaults shifted (see [[preflight]] and
[[2026-08-23-mcp-implementation-plan]]), startup was hardened against
unauthenticated/error servers in v0.10.0 (see
[[2026-08-25-smoke-test-bugfixes]]), and **v0.11.0 added remote copy-paste
OAuth login** (`auth` subcommand, persisted verifier) — see
[[2026-08-25-remote-mcp-oauth]]. **v0.11.1** fixes the reused-client
redirect-URI mismatch: the advertised URI derives from the client's
registered `redirect_uris`, and stale loopback clients are re-registered
instead of rejected with `invalid_request`.

## Related

- [[seats]], [[override-resolution]]
- [[remote-oauth-login]] — the copy-paste pattern this subsystem implements
- [[headless-pi]] — operating pi without a human at the keyboard
- [[2026-08-23-mcp-implementation-plan]], [[2026-08-23-mcp-support-design-spec]],
  [[2026-08-25-remote-mcp-oauth]]

## Sources

- `extensions/mcp/*`
- `README.md` (MCP Server section)
- `AGENTS.md` (convention 10-11)
