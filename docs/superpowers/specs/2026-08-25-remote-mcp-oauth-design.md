# Remote MCP OAuth Login — Design (v0.11.0)

**Date:** 2026-08-25
**Status:** Approved design, implemented
**Target:** pi-council v0.11.0 (minor bump: new command surface + auth-store schema)

## Problem

The interactive OAuth login (`/mcp login <server>`, `loginOAuth`) assumes the
browser and the agent share a machine: it opens the system browser via
`xdg-open`/`open`/`start`, then captures the authorization code on an ephemeral
`127.0.0.1` loopback listener. On a remote box — SSH session, headless VPS,
Docker container — this breaks in two ways:

1. **No browser to open.** `xdg-open` fails or opens a browser nobody can see.
2. **Redirect lands on the wrong loopback.** Even if the user copies the
   authorization URL to their laptop, the OAuth server redirects to the
   *remote's* `127.0.0.1:<port>`, which is unreachable from the laptop.

The established workaround (per the reporter's own workflow with other coding
agents): open the authorization URL on any device, let the redirect fail
harmlessly, and **paste the redirected URL back** into the agent.

## Goals

- Make copy-paste the *native* flow for headless/remote environments, no
  tunnels (no ngrok/localtunnel/SSH `-L`), no third-party services.
- Zero regression to the local loopback flow — it stays the default when a
  browser is present.
- Reuse the existing SDK `auth()` orchestrator end to end; do not hand-roll
  discovery/DCR/PKCE.

## Design

### Two-phase remote login

**Phase 1 — `/mcp login <server> --remote`** (or auto-detected):

1. Run discovery + DCR + PKCE via the SDK `auth(provider, { serverUrl })` as
   today, but with a **fixed loopback redirect URI**
   `http://127.0.0.1:8765/callback` (`REMOTE_REDIRECT_URI`) instead of an
   ephemeral port, and an `openUrl` hook that **captures the authorization URL
   instead of opening a browser**.
2. The SDK persists client information and discovery state as usual; the PKCE
   verifier now persists to the auth store (`oauth.verifier`) instead of an
   in-memory field — the piece that previously made the flow indivisible.
3. Print the URL plus instructions: *"Open this URL in any browser, authorize,
   then paste the full redirected URL back: `/mcp auth <server> <url>`."*

**Phase 2 — `/mcp auth <server> <pasted>`**:

1. `parseCallback` extracts the `code` from the pasted URL (query or fragment)
   or treats a bare paste as the raw code, and derives the redirect URI from
   the URL's `origin + pathname` (fallback: the fixed URI).
2. Construct a fresh provider with that redirect URI and exchange:
   `auth(provider, { serverUrl, authorizationCode: code })`. The provider
   re-loads the persisted client, discovery state, and verifier, so the
   exchange completes with no browser and no listener.
3. Tokens persist; the verifier is consumed (cleared) on save.

### Why the verifier persistence is the crux

`CouncilOAuthProvider` kept `codeVerifier` in a private in-memory field. That
works while phase 1 and phase 2 share one provider instance inside a single
`loginOAuth` call, but a two-command flow needs the verifier to survive across
process boundaries. The SDK's `fetchToken` requires `provider.codeVerifier()`
and `provider.redirectUrl` to match the authorization request; both are now
available to a fresh provider in phase 2 (verifier from the store, redirect
URI derived from the paste or the constant).

### Redirect URI choice and why PKCE makes it safe

- RFC 8252 permits any port on `127.0.0.1` for native clients; a **fixed**
  port means phase 1 and phase 2 agree without persisting the URI.
- `8765` is deliberately outside common dev ports (3000/5000/8000/8080/5173…).
- Even if a stray local process on the user's machine receives the redirect
  (port collision), the code is **useless without the PKCE verifier**, which
  never leaves the remote machine. The worst case is a failed flow, not a
  compromise.
- The redirect happens on the *user's* machine (their browser), so nothing
  needs to listen on the remote. `localhost` is avoided in favor of the
  `127.0.0.1` literal (no resolver surprises).

### Detection and overrides

`isRemoteSession()`: `SSH_TTY` set, or Linux without `DISPLAY`/`WAYLAND_DISPLAY`
(headless server, container). Not conclusive for SSH-into-desktop (X11
forwarding sets DISPLAY), so explicit flags win:

| Invocation | Behavior |
|---|---|
| `/mcp login <name>` | auto: remote if `isRemoteSession()`, else local loopback |
| `/mcp login <name> --remote` | force copy-paste flow |
| `/mcp login <name> --local` | force loopback flow (e.g. X11 forwarding) |

## Storage model

Extends the existing `oauth` entry in `getAgentDir()/council/mcp-auth.json`
(0600, atomic writes, unchanged):

```json
{
  "servers": {
    "context7": {
      "oauth": {
        "client": { "…": "…" },
        "tokens": { "…": "…" },
        "discovery": { "…": "…" },
        "verifier": "single-use PKCE verifier for a pending remote login"
      }
    }
  }
}
```

- `verifier` is single-use: `saveTokens` clears it on any token save
  (exchange or refresh), `invalidateCredentials("all")` clears it, `logout`
  deletes the whole entry.
- No new fields in `mcp.json`; no environment variables.

## Command surface

| Subcommand | Behavior |
|---|---|
| `login <name> [--remote\|--local]` | oauth mode: auto-detect or forced copy-paste / loopback |
| `auth <name> <url-or-code>` | phase 2: exchange the pasted code; errors if no `code` param |

## Security notes

- Verifier + tokens live in the 0600 auth file, never in `mcp.json`.
- The authorization code transits only the user's browser → their paste; no
  third-party relay (explicitly no tunnels).
- PKCE binds the code to the verifier, which never leaves the agent machine —
  mitigates the fixed-port collision case.
- Paste parsing accepts query (`?code=…`) and fragment (`#code=…`) locations
  for robustness against SPA-style authorization servers.

## Testing

- **Unit (`parseCallback`)**: full URL → code + derived redirect URI; raw code
  → code + fixed URI; URL without code → throws.
- **Integration-with-fixture**: `loginRemote` (phase 1) against the stub AS —
  no browser, no listener, verifier persisted, authorization URL carries
  `redirect_uri=http%3A%2F%2F127.0.0.1%3A8765%2Fcallback`; simulate the user's
  browser with `fetch(url, { redirect: "manual" })`; `completeRemoteLogin`
  (phase 2) with the location header → tokens persist, verifier consumed.
- **Command surface**: `/mcp login ctr --remote` → prints URL; `/mcp auth ctr
  <location>` → "Authenticated".
- Existing loopback `loginOAuth` tests unchanged and green.

## Out of scope

- Device Authorization Grant (RFC 8628) — only viable when the AS advertises
  it; noted as future work if an MCP server does.
- `state` validation on the pasted code — CSRF surface is negligible for
  copy-paste + PKCE; the local flow doesn't validate it either.
- Configurable redirect port (env var) — constant is sufficient; revisit if a
  server rejects 8765.
