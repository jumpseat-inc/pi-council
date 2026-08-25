# Remote MCP OAuth Login — Implementation Plan (v0.11.0)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users authenticate to MCP OAuth servers from a headless/remote agent by copy-pasting the redirected URL, without tunnels. Split the monolithic `loginOAuth` into a two-phase remote flow: `/mcp login <server> --remote` prints the authorization URL; `/mcp auth <server> <pasted-url>` exchanges the code. Auto-detect headless sessions; keep the loopback flow as the local default.

**Architecture:** Reuse the SDK's `auth()` orchestrator for both phases. The only structural change is making the PKCE verifier **persisted** (auth-store `oauth.verifier`) instead of an in-memory provider field, so phase 2 can construct a fresh provider that re-loads client + discovery + verifier. No new dependencies, no tunnels, no network relays.

**Tech Stack:** TypeScript, `@modelcontextprotocol/sdk` client auth, Bun tests, existing `node:http` fixture AS.

**Spec:** `docs/superpowers/specs/2026-08-25-remote-mcp-oauth-design.md`

## Global Constraints

- Auth file is `getAgentDir()/council/mcp-auth.json`, mode `0600`, atomic writes — never put secrets in `mcp.json`.
- `@modelcontextprotocol/sdk/client/auth.js` subpath import (`.js` suffix required by bun): `auth`, `OAuthClientProvider`, types.
- TDD per task: failing test → run (fails) → implement → run (passes) → commit. Commits follow Conventional Commits; bump `version` in `package.json` in the same change (semver minor: new command surface + schema field).
- The loopback `loginOAuth` flow and its tests must not change behavior.
- `hub.ts` untouched.

## Tasks

### Task 1: Failing tests (red)

- [ ] `test/mcp/oauth.test.ts`: import `loginRemote`, `completeRemoteLogin`, `parseCallback`.
- [ ] Unit tests for `parseCallback`:
  - full URL `http://127.0.0.1:8765/callback?code=abc123&state=xyz` → `{ code: "abc123", redirectUri: "http://127.0.0.1:8765/callback" }`
  - raw `"abc123"` → `{ code: "abc123", redirectUri: REMOTE_REDIRECT_URI }`
  - URL without `code` param → throws with `/code/`
- [ ] Integration test `remote login: two-phase copy-paste flow`:
  - `loginRemote(root, "ctr")` → message contains an `/authorize` URL with `code_challenge=` and `redirect_uri=http%3A%2F%2F127.0.0.1%3A8765%2Fcallback`; `oauth.verifier` persisted.
  - Simulate the user's browser: `fetch(url, { redirect: "manual" })` → `location` header (the pasted URL) contains `code=test-code`.
  - `completeRemoteLogin(root, "ctr", location)` → "Authenticated"; `tokens.access_token === "acc-1"`; `oauth.verifier` now `undefined` (consumed).
- [ ] `test/mcp/commands.test.ts`: `runMcpSubcommand(root, "login", ["ctr", "--remote"])` prints "Open this URL"; then `runMcpSubcommand(root, "auth", ["ctr", location])` → "Authenticated".
- [ ] Run: both files fail (missing exports; login command hangs on local loopback). **Exit: red confirmed.**

### Task 2: Auth-store schema

- [ ] `extensions/mcp/auth-store.ts`: add `verifier?: string` to `McpAuthServerEntry.oauth`.

### Task 3: Provider verifier persistence

- [ ] `extensions/mcp/oauth.ts`, `CouncilOAuthProvider`:
  - Remove the `private verifier = ""` field.
  - `saveCodeVerifier(v)` → `this.patch({ verifier: v })`.
  - `codeVerifier()` → `this.entry().verifier ?? ""`.
  - `saveTokens(tokens)` → `this.patch({ tokens, verifier: undefined })` (single-use consumption).
  - `invalidateCredentials("all")` → also clear `verifier`.

### Task 4: Remote-flow functions

- [ ] `extensions/mcp/oauth.ts` exports:
  - `REMOTE_REDIRECT_URI = "http://127.0.0.1:8765/callback"` (constant; document port rationale + PKCE safety).
  - `isRemoteSession()`: `SSH_TTY` set, or `platform === "linux" && !DISPLAY && !WAYLAND_DISPLAY`.
  - `parseCallback(pasted)`: URL (query or fragment `code`) → `{ code, redirectUri: origin+pathname }`; bare string → raw code + fixed URI; URL without code → throw.
  - `loginRemote(repoRoot, name)`: validate config; provider with fixed redirect URI and an `openUrl` that captures the URL; `auth(provider, { serverUrl })`; if `"AUTHORIZED"` return already-authed message; return multi-line instructions with the captured URL.
  - `completeRemoteLogin(repoRoot, name, pasted)`: validate; `parseCallback`; fresh provider with derived redirect URI and no-op `openUrl`; `auth(provider, { serverUrl, authorizationCode })`; "Authenticated" or throw.

### Task 5: Command surface

- [ ] `extensions/mcp/index.ts`:
  - `loginServer(..., flags: string[] = [])`: parse `--remote` / `--local` overrides; default `remote ?? isRemoteSession()`.
  - `runMcpSubcommand`: `login` passes `args.slice(1)`; new `auth` case → `completeRemoteLogin(repoRoot, args[0], args.slice(1).join(" "))`.
  - Update both usage strings and the command description.

### Task 6: Green + full suite

- [ ] `bun test test/mcp/oauth.test.ts test/mcp/commands.test.ts` — all pass.
- [ ] `bun test` — full suite green (existing 2 gated skips remain).
- [ ] `bunx tsc --noEmit` — clean.

### Task 7: Docs + release

- [ ] Spec: `docs/superpowers/specs/2026-08-25-remote-mcp-oauth-design.md`.
- [ ] This plan: `docs/superpowers/plans/2026-08-25-remote-mcp-oauth-implementation.md`.
- [ ] Bump `version` in `package.json` (0.10.0 → 0.11.0, minor).
- [ ] Commit: `feat(mcp): remote OAuth login via copy-paste redirect URL` (Conventional Commits).
