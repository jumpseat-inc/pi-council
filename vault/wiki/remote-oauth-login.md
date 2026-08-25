---
title: Remote OAuth Login
type: concept
summary: The copy-paste OAuth pattern for headless or remote agents — phase 1 prints an authorization URL, phase 2 exchanges the code the user pastes back; a persisted PKCE verifier makes the split safe without tunnels.
aliases: [copy-paste oauth, manual oauth, paste-back oauth, remote login, headless oauth]
tags: [pi-council/concept]
sources: ["[[2026-08-25-remote-mcp-oauth]]"]
created: 2026-08-25
updated: 2026-08-25
---

# Remote OAuth Login

The pattern for OAuth authorization when the browser can't be on the same
machine as the agent: print the authorization URL, let the user open it on
any device, and have them paste the redirected URL back. The agent extracts
the code and completes the exchange. No tunnels, no third-party relays.

The loopback-redirect flow assumes browser and agent share a machine: it
opens the system browser and captures the code on an ephemeral `127.0.0.1`
listener. On an [[headless-pi]] box — SSH session, headless VPS, container —
there is no browser to open, and the redirect would land on the *remote's*
loopback, unreachable from the user's laptop. Remote login splits the flow
instead.

## The two phases

1. **Build + print** — run discovery, dynamic client registration, and PKCE
   as usual, but capture the authorization URL instead of opening a browser.
   Print it with instructions.
2. **Paste + exchange** — the user authorizes on their own device; the OAuth
   server redirects to the loopback URI (connection refused is fine — the
   code is in the address bar). They paste the URL back; the agent parses the
   `code` (query or fragment) and completes the token exchange.

## Why it's safe

- **PKCE is the lock.** The authorization code is useless without the
  verifier. If the verifier never leaves the agent machine, the code can land
  anywhere — a misdirected redirect, a port collision, a malicious local
  listener — and can't be turned into a token.
- **Fixed loopback URI.** RFC 8252 allows any port on `127.0.0.1`; a fixed
  port means both phases agree without persisting the URI.
- **No relay.** The code only travels browser → user's paste. No ngrok,
  no localtunnel, no SSH `-L`.
- **`state` is skippable.** CSRF risk is negligible for a human copy-paste +
  PKCE flow; the loopback flow never validated it either.

## Practical rules

- Accept **both** a full redirected URL and a bare code on paste — some
  authorization servers render the code on a page instead of redirecting.
- Auto-detect the headless case (`SSH_TTY` set, or Linux without
  `DISPLAY`/`WAYLAND_DISPLAY`), but keep explicit `--remote` / `--local`
  overrides — SSH into a desktop with X11 forwarding sets DISPLAY, so
  environment signals alone aren't conclusive.
- Persist the PKCE verifier between phases (in the agent's secret store), and
  treat it as **single-use**: consume it on the first token save so a stale
  paste can't replay.
- The redirect URI derived from the paste (`origin + pathname`) must match
  what phase 1 registered; fall back to the fixed URI for bare codes.

## Where it lives

- Implemented in pi-council as the MCP OAuth login: `/mcp login <server>
  --remote` then `/mcp auth <server> <pasted>` — see [[mcp-support]] and
  [[2026-08-25-remote-mcp-oauth]].
- The same pattern applies to any coding agent running remotely; the user's
  own workflow already used it by hand before this shipped.

## Related

- [[mcp-support]] — the subsystem with the concrete two-phase commands
- [[headless-pi]] — the operating rules for pi without a human at the keyboard
- [[2026-08-25-remote-mcp-oauth]] — the source: design spec + implementation

## Sources

- [[2026-08-25-remote-mcp-oauth]]
