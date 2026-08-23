# MCP Server Support — Design (v0.2.0)

**Date:** 2026-08-23
**Status:** Approved design, pending implementation plan
**Target:** pi-council v0.2.0 (minor bump: new subsystem + new dependency)

## Goal

Let the Council's seats use tools from registered MCP (Model Context Protocol)
servers — e.g. Context7 for library documentation — with OAuth authentication
where the server supports it, API-key or open access otherwise. The human
manages servers through parent-side commands; seats consume them under the
existing tool-sandbox model.

## Background & constraints

- **pi has no built-in MCP** (by explicit design — docs/usage.md: "It
  intentionally does not include built-in MCP… build or install those workflows
  as extensions or packages"). This subsystem lives entirely in pi-council.
- **Seats are headless** (`pi --mode json -p`): no UI, no browser. OAuth
  redirect flows are impossible inside a seat. Therefore: *the parent
  authenticates; seats consume credentials.*
- **Context7 reference case** (context7.com/docs/howto/oauth): OAuth 2.0 per
  the MCP authorization spec is available on remote HTTP endpoints only
  (`/mcp` → `/mcp/oauth`); stdio transports use API keys. Explicit
  authentication is the normal UX; automatic token refresh follows first login.
- **We build on the official SDK** (`@modelcontextprotocol/sdk`, v1.30.x) as a
  bundled runtime dependency — client protocol, Streamable HTTP + stdio
  transports, and the OAuth discovery/DCR/PKCE scaffolding via its
  `OAuthClientProvider` interface. Accepted trade-off: a heavy transitive
  dependency tree (~30 packages, incl. server-side code we do not use) in
  `node_modules` at install time. Hand-rolling was rejected for correctness
  risk on the OAuth discovery chain and SSE session handling.

## Storage model

Two locations, split by committability:

### Registrations — repo-local, committable, no secrets

`<repo>/$CONFIG_DIR_NAME/council/mcp.json`:

```json
{
  "servers": {
    "context7": {
      "url": "https://mcp.context7.com/mcp/oauth",
      "auth": "oauth",
      "enabled": true
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "auth": "header",
      "headers": { "Authorization": "Bearer $GITHUB_MCP_TOKEN" },
      "enabled": true
    }
  }
}
```

Rules:

- Remote servers declare `url`; local stdio servers declare `command` + `args`.
  Mutually exclusive; exactly one required.
- `auth`: `"none" | "header" | "oauth"` (required).
- `headers` (optional, `header` mode): injected on every request. Values may
  use `$ENV_VAR` indirection, resolved at connect time — so keys can live in
  the environment instead of a committed file.
- `enabled` (optional, default `true`).
- Malformed file → parent reports the error, no servers load; a bad *entry*
  → that server skipped with a warning, others still load.

### Secrets — user-global, never committed

`getAgentDir()/council/mcp-auth.json` (i.e. `~/.pi/agent/council/mcp-auth.json`
on stock installs), written with mode `0600`:

```json
{
  "servers": {
    "context7": {
      "oauth": {
        "client": { "client_id": "…", "client_secret": "…", "…dcr metadata" },
        "tokens": { "access_token": "…", "refresh_token": "…", "expires_at": 0,
                    "scope": "…", "token_type": "Bearer" }
      }
    },
    "github": { "headers": { "Authorization": "Bearer ghp_…" } }
  }
}
```

- Header keys configured without `$ENV` indirection are stored here when the
  human enters them via `/mcp login` (prompted, never written to `mcp.json`).
- OAuth client registrations (from dynamic client registration) and token sets
  persist here so refresh works across sessions and across seat children.
- Read/write paths must be race-tolerant (parent + concurrent seats may
  refresh): atomic write via temp-file + rename.

## Parent-side management commands

One command, subcommand-dispatched: `/mcp <sub> [args]`.

| Subcommand | Behavior |
|---|---|
| `list` | Table: name, transport (http/stdio), auth mode, status, tool count |
| `add <name> <url>` | Register a remote server (prompts for auth mode; `oauth`/`header` follow-ups). Validates URL, rejects duplicate names, writes `mcp.json` |
| `add <name> -- <command> [args…]` | Register a local stdio server |
| `remove <name>` | Delete registration + any stored secrets (confirm first) |
| `login <name>` | `header` → prompt for secret values, store in auth file. `oauth` → run the full flow (below). `none` → no-op |
| `logout <name>` | Clear stored secrets/tokens for the server |
| `status <name>` | Live check: connect + `initialize` + `tools/list`, report status and tool count |

After a successful `login`/`logout`/`add`/`remove`, the parent's live
connections and registered tools refresh.

## Authentication

### Modes

1. **`none`** — connect directly.
2. **`header`** — inject configured headers (env-indirection resolved, or
   values fetched from the auth file) on every request.
3. **`oauth`** — full MCP authorization-spec flow via the SDK's
   `OAuthClientProvider`. Our provider implementation supplies only the parts
   requiring UI or persistence:
   - `redirectToAuthorizationCallback`: open the system browser at the
     authorization URL; run an ephemeral localhost callback listener
     (127.0.0.1 bind, OS-assigned port, 5-minute window, `state` validated)
     to capture the authorization code.
   - `token storage`: read/write the user-global auth file (atomic).
   - `client information`: persisted DCR result; register on first login.
   - Discovery chain, PKCE (S256), token exchange, and refresh grants are the
     SDK's.

### Token lifecycle & reauthentication

- Parent and seats call `tokens()` before requests; expired access tokens are
  refreshed silently via `refresh_token`.
- A failed refresh (revoked/expired refresh token) sets the server's status to
  `reauth-required` and every tool call returns a structured error:
  `MCP server "<name>" requires reauthentication — run /mcp login <name>.`
  Seats surface this verbatim to the facilitator; the facilitator surfaces it
  to the human. Seats never attempt interactive auth.
- `logout` clears tokens; the next tool call reports `unauthenticated`.

## Tool bridging

### Parent

On `session_start` (and after management-command changes), for each enabled
server: connect (lazy failure tolerance — a dead server logs a warning and is
marked `error`, never blocks startup), `tools/list`, register each tool as a
pi tool named **`mcp__<server>__<toolName>`** with the server-provided
description and JSON-schema parameters (converted to TypeBox, since
`registerTool` requires TypeBox schemas; see implementation plan). Tool
results are returned as text. The cached per-server tool-name list is what
`council_dispatch` reads to build a seat's `--tools` argv (see Seats).

### Seats

- New optional seat frontmatter field: **`mcp: [name, …]`** (parsed with the
  existing list parser). A seat with no `mcp:` field gets zero MCP access.
- **`--tools` is an exact-name allowlist** over all tools (pi filters the
  model's advertised tools by exact registry names; no globs). Consequences
  that drive the mechanics:
  - The seat child's argv must enumerate every granted MCP tool's exact name
    (`mcp__<server>__<tool>`). Therefore the **parent discovers tool names at
    dispatch time** from its own live/cached MCP tool lists and passes them
    into `buildChildArgv`.
  - The child **connects eagerly at startup** to granted, enabled servers,
    lists tools, and registers them. (Lazy connect is a deadlock: an
    unregistered tool is never advertised, so the model never calls it to
    trigger the lazy connect.) pi's tool refresh re-activates any registered
    tool whose name is in the allowlist, so async registration is fine as
    long as the names were in argv.
- Registered MCP tools pass through the existing `tool_call` sandbox
  (`isCallAllowed`): granted server ⇒ its `mcp__<server>__*` tools allowed;
  anything else blocked with the standard refusal message.
- If a granted server could not be authenticated/connected by the parent,
  its tools are omitted from argv and the dispatch result warns.
- Seat frontmatter docs: `mcp` joins `tools`/`spawns` as a grants field.

## Statuses

Per server: `disabled` → `unauthenticated` → `connected` → `error` /
`reauth-required`. Parent keeps last-known status in memory (updated by
connection activity and management commands); `/mcp status` forces a live
probe. Seat-side connection failures mark the in-seat client errored and
return structured errors on call.

## Security notes

- Auth file `0600`; never logged, never echoed into prompts or reports.
- Callback listener binds 127.0.0.1 only; validates OAuth `state`; shuts down
  after first code or the 5-minute window.
- `$ENV` indirection is resolved at connect time, never persisted resolved.
- MCP tool calls are sandbox-gated like every other tool; granting a server to
  a seat is an explicit human edit to that seat's frontmatter.

## Dependencies

- Add `@modelcontextprotocol/sdk` to `dependencies` in `package.json`
  (runtime dep; pi installs git packages with `npm install`). `peerDependencies`
  on pi + typebox unchanged.

## Testing

- **Fixture servers**: build minimal MCP servers with the SDK's server classes
  — one over stdio, one over Streamable HTTP on an ephemeral port — exercising
  `initialize`, `tools/list`, `tools/call`.
- **Registry**: parse/validate/merge of `mcp.json` (bad entries skipped with
  warning, env indirection, duplicate rejection, stdio/http mutual exclusion).
- **Grants**: child allows granted server's tools, blocks non-granted servers
  and non-MCP tools; no `mcp:` field ⇒ no MCP tools at all.
- **Header auth**: fixture server requires a header; env-indirection resolved.
- **OAuth**: stub authorization server on localhost implementing discovery,
  DCR, authorize, token, refresh endpoints; test full login (browser step
  stubbed), silent refresh, expired-refresh → `reauth-required`, logout.
- **Statuses**: transitions driven by fixture failures.
- **Integration (gated, `COUNCIL_MCP_INTEGRATION=1`)**: real Context7 round
  trip, both API-key and OAuth modes where credentials exist.

## Phasing

1. **Phase 1:** dependency + registry + management commands (`list/add/remove/
   status`, plus `login` for `header`-mode secret entry and `logout`) + both
   transports + `none`/`header` auth + tool bridging (parent +
   seats) + fixture-server test suite. *Exit: Context7 usable via API key.*
2. **Phase 2:** OAuth — provider implementation, OAuth mode of `login`, token
   store, silent refresh, `reauth-required` surfacing, stub-AS test suite.
   *Exit: Context7 usable via OAuth at `/mcp/oauth`.*

## Out of scope

- MCP resources, prompts, sampling, completions, subscriptions (tools only).
- Hot-reload of `mcp.json` mid-session (management commands refresh instead).
- Interactive auth inside seats (architecturally impossible, permanently).
- Server-side MCP features the SDK bundles but we never import.
- Windows-specific browser-open handling beyond best-effort `open`/`xdg-open`.
