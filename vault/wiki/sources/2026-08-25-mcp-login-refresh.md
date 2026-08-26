---
title: 2026-08-25 "Live Runtime Refresh After MCP Login" (v0.11.2)
type: source
summary: The v0.11.2 fix — /mcp login and /mcp auth now reconnect the live runtime, so /mcp list shows connected + tools instead of the stale unauthenticated/tools=0 captured at session start.
aliases: []
tags: [pi-council/source]
sources: ["[[2026-08-25-remote-mcp-oauth]]", "[[2026-08-25-remote-mcp-oauth-fix]]"]
created: 2026-08-25
updated: 2026-08-25
---

> ⚠️ Derived from commit `2cbabe1` "fix(mcp): refresh live runtime after login/auth so /mcp list reflects credentials" (captured 2026-08-25). Version bump 0.11.1 → 0.11.2 (patch).

The v0.11.2 bugfix — surfaced by the user running `/mcp login context7` +
`/mcp auth context7 <url>` and then seeing `/mcp list` report
`context7 http auth=oauth unauthenticated tools=0` (same for tavily).

## Root cause

`/mcp login` and `/mcp auth` **stored credentials but never reconnected the
live runtime**. `/mcp list` reads the cached in-memory status captured at
`session_start` (when the user had no tokens), so it kept reporting
`unauthenticated` with zero tools. The design doc's "After a successful
login/logout/add/remove, the parent's live connections and registered tools
refresh" was aspirational — the refresh was never wired up.

## The fix

- **`refreshServerRuntime(repoRoot, name)`** — closes + reconnects a server
  after a credential change (header login, oauth login, and `auth`), so
  `/mcp list` reflects `connected` with the real tool count.
- Applied on **all** credential paths: `login` header/oauth, and `auth`
  (remote copy-paste phase 2). The loopback path (`/mcp login` with a local
  browser) had the identical stale-status bug and is fixed too.
- **Tool registration for the live session still requires `/reload`** (pi has
  no tool deregistration) — the reconnect is for status + dispatch accuracy,
  not for surfacing new tools mid-session.

## Test hardening

The command test now asserts the exact row
`ctr http auth=oauth connected tools=N` after the copy-paste flow (a prior
version's `toContain("connected")` was vacuous — `"not connected"` contains
the substring). The reconnect leaves an open connection to the fixture MCP
server, so the test must `closeAll()` the manager before `fx.close()` — Node
≥19's `server.close()` waits for open sockets and would hang otherwise.

## Related

- [[mcp-support]] — the subsystem; the login/status lifecycle this fixes
- [[remote-oauth-login]] — the copy-paste flow whose phase 2 (`auth`) now refreshes
- [[2026-08-25-remote-mcp-oauth]] — the v0.11.0 feature
- [[2026-08-25-remote-mcp-oauth-fix]] — the v0.11.1 fix this builds on
- [[pi-council-overview]] — version arc v0.11.1 → v0.11.2

## Sources

- Commit `2cbabe1` on `main`
- `extensions/mcp/index.ts` (`refreshServerRuntime`, `loginServer`, `auth` case)
- `test/mcp/commands.test.ts`
