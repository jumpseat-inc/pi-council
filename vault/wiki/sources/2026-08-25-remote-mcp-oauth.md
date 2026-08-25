---
title: 2026-08-25 "Remote MCP OAuth Login" (v0.11.0)
type: source
summary: The two-phase copy-paste OAuth login for headless/remote agents — /mcp login <server> --remote prints the authorization URL, /mcp auth <server> <url> exchanges the pasted code; the PKCE verifier persisted to the auth store is what makes the split possible.
tags: [pi-council/source]
sources: []
created: 2026-08-25
updated: 2026-08-25
---

> ⚠️ Derived from commit `82765ad` "feat(mcp): remote OAuth login via copy-paste redirect URL" + `docs/superpowers/specs/2026-08-25-remote-mcp-oauth-design.md` + `docs/superpowers/plans/2026-08-25-remote-mcp-oauth-implementation.md` (captured 2026-08-25). Version bump 0.10.0 → 0.11.0.

The remote MCP OAuth login feature — the fix for authenticating to MCP
servers when the agent runs on a machine whose browser you can't see
(SSH session, headless VPS, container). The user's existing workaround
with other coding agents — open the auth URL on any device, then
**paste the redirected URL back** — is now the native flow, with zero
tunnels and no third-party relays.

## The problem

`loginOAuth` (the pre-existing flow) opens the system browser and captures
the authorization code on an ephemeral `127.0.0.1` loopback listener. On a
remote box this breaks twice: no browser to open, and the redirect lands on
the *remote's* loopback, unreachable from the user's laptop.

## The two-phase design

- **Phase 1 — `/mcp login <server> --remote`**: runs the same SDK `auth()`
  orchestrator (discovery + DCR + PKCE), but with a **fixed loopback redirect
  URI** `http://127.0.0.1:8765/callback` (`REMOTE_REDIRECT_URI`, RFC 8252
  any-port) and an `openUrl` hook that *captures* the authorization URL
  instead of opening a browser. Prints the URL plus instructions.
- **Phase 2 — `/mcp auth <server> <pasted>`**: `parseCallback` extracts the
  `code` from the pasted URL (query *or* fragment) or treats a bare paste as
  the raw code; a fresh provider re-loads the persisted client + discovery
  state + PKCE verifier and exchanges through the same `auth()` call.

## The crux: verifier persistence

`CouncilOAuthProvider` previously kept the PKCE verifier in an in-memory
field — fine while phase 1 and phase 2 shared one provider instance inside a
single `loginOAuth` call, impossible across two commands. The change: the
verifier now persists to `mcp-auth.json` under `oauth.verifier` (single-use —
`saveTokens` clears it on any token save, `invalidateCredentials("all")` and
`logout` clear it too). The SDK's `fetchToken` needs `codeVerifier()` +
`redirectUrl` to match the authorization request; both are now reproducible
by a fresh provider in phase 2.

## Safety without tunnels

- Fixed port `8765` (deliberately outside common dev ports) means phase 1 and
  phase 2 agree without persisting the URI.
- Even a port collision on the user's laptop is harmless: the code is useless
  without the verifier, which never leaves the agent machine.
- The redirect happens on the *user's* browser, so nothing must listen on the
  remote. No ngrok/localtunnel/SSH `-L`.
- `state` validation on the pasted code is explicitly **out of scope** — CSRF
  surface is negligible for copy-paste + PKCE (and the loopback flow never
  validated it either).

## Detection & overrides

`isRemoteSession()`: `SSH_TTY` set, or Linux without `DISPLAY`/
`WAYLAND_DISPLAY` (headless server, container). Auto-routes `/mcp login <name>`
to remote mode; `--remote` / `--local` force either way (e.g. X11 forwarding
sets DISPLAY so SSH_TTY alone isn't conclusive).

## Related

- [[remote-oauth-login]] — the concept: copy-paste OAuth for headless agents
- [[mcp-support]] — the subsystem this extends (command surface, storage schema)
- [[headless-pi]] — the sibling problem: operating pi without a human at the keyboard
- [[pi-council-overview]] — version arc v0.10.0 → v0.11.0

## Sources

- `docs/superpowers/specs/2026-08-25-remote-mcp-oauth-design.md`
- `docs/superpowers/plans/2026-08-25-remote-mcp-oauth-implementation.md`
- `extensions/mcp/oauth.ts` (`loginRemote`, `completeRemoteLogin`,
  `parseCallback`, `isRemoteSession`, `REMOTE_REDIRECT_URI`,
  `CouncilOAuthProvider.saveCodeVerifier`/`codeVerifier`/`saveTokens`)
- `extensions/mcp/index.ts` (`auth` subcommand, `login` flags),
  `extensions/mcp/auth-store.ts` (`oauth.verifier`)
- `test/mcp/oauth.test.ts`, `test/mcp/commands.test.ts` (remote-login tests)
- Commit `82765ad` on `main`
