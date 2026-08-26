---
title: 2026-08-25 "Remote MCP OAuth Redirect-URI Fix" (v0.11.1)
type: source
summary: The v0.11.1 bugfix for the invalid_request "redirect_uri does not match" — a persisted DCR client's registered redirect-URI list drove the advertised URI, and stale loopback clients get re-registered instead of rejected.
aliases: []
tags: [pi-council/source]
sources: ["[[2026-08-25-remote-mcp-oauth]]"]
created: 2026-08-25
updated: 2026-08-25
---

> ⚠️ Derived from commit `4a3f1a4` "fix(mcp): advertise the client's registered redirect URI, re-register stale clients" (captured 2026-08-25). Version bump 0.11.0 → 0.11.1 (patch). Supersedes the "fixed constant" claim in the v0.11.0 ingest.

The v0.11.1 bugfix — the direct response to the `invalid_request` error:
*"The 'redirect_uri' parameter does not match any of the OAuth 2.0 Client's
pre-registered redirect urls."*

## Root cause

A **persisted DCR client** (e.g. from an earlier loopback login with an
ephemeral port) carries a fixed, AS-registered list of redirect URIs. The
login flows, however, advertised a **foreign** URI not in that list:

- the remote copy-paste flow advertised the hardcoded `127.0.0.1:8765`
  constant, and
- the loopback flow advertised a fresh ephemeral listener port.

The authorization server (Clerk, Context7's AS) rejected both. Critically,
**Clerk DCRs loopback URIs fine** — the mismatch was the *reused client*, not
the URI shape. Probing Clerk's `/oauth/register` directly confirmed it echoes
any `127.0.0.1` / `localhost` redirect URI.

## The fix, in two parts

1. **`redirectUrl` derives from the registered list.** `CouncilOAuthProvider.redirectUrl`
   now returns the persisted client's `redirect_uris[0]` when one exists,
   falling back to the explicit URI only for a fresh registration. Copy-paste
   login works with *any* registered URI — it needn't be reachable.
2. **Stale loopback clients are re-registered.** `loginOAuth` checks the
   persisted client's list against the fresh listener URI:
   - no refresh token present → invalidate the client **before** phase 1, so
     the browser opens once, with the correct URL (fresh DCR registers it);
   - refresh token present but dead (phase 1 returned REDIRECT) → invalidate
     and re-run `auth()` to rebuild the URL via fresh DCR.

## Fixture hardening

The stub AS (`test/mcp/fixture-oauth.ts`) now behaves Clerk-style: DCR echoes
the registered `redirect_uris`, and `/authorize` + `/token` validate the
`redirect_uri` against that list (rejecting with `invalid_request` /
`invalid_grant` otherwise). Two regression tests cover the stale-client case
in both the remote and loopback flows; the suite also gained per-test agent-dir
isolation (`beforeEach`), since cached OAuth discovery state from one fixture's
port leaked into the next.

## Related

- [[remote-oauth-login]] — the concept this fix refined (registered-URI derivation)
- [[mcp-support]] — the subsystem; v0.11.1 version lineage
- [[2026-08-25-remote-mcp-oauth]] — the v0.11.0 feature this fixes
- [[pi-council-overview]] — version arc v0.11.0 → v0.11.1

## Sources

- Commit `4a3f1a4` on `main`
- `extensions/mcp/oauth.ts` (`redirectUrl`, `loginOAuth` stale-client handling)
- `test/mcp/fixture-oauth.ts`, `test/mcp/oauth.test.ts`
- `docs/superpowers/specs/2026-08-25-remote-mcp-oauth-design.md` (the design this fix corrects)
