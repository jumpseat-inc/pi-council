# EV-76 Run-start Gate Preflight Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A run-start preflight that fails loud, via a parent-only `council_preflight` tool, when the decisions gate is enabled (mode `advisory`/`active`) and no OpenRouter credential resolves.

**Architecture:** Pure core `runStartGatePreflight(repoRoot, opts)` in a new `extensions/preflight.ts` composing the ONE gate resolver (`loadGateConfig`) with the ONE credential resolver (`resolveOpenRouterApiKey`); a parent-only tool registration (the `registerGateTool` pattern) wired in `extensions/index.ts`'s parent block; one new step in each packaged procedure (`council.md` step 0, `features-deliver.md` Phase 0) ordered before the unchanged `bash council/preflight.sh` line. No preflight script is touched; the tool never spawns the script.

**Tech Stack:** TypeScript (strict), bun:test, typebox tool params, `@earendil-works/pi-coding-agent` (`ExtensionAPI`, `CONFIG_DIR_NAME`).

**Spec:** `docs/superpowers/specs/2026-09-20-EV-76-design.md` (settled — implementer argues from the spec, not the deliberation).

## Global Constraints

- Fail literal is byte-pinned (R5): `FAIL: decisions gate is enabled (mode "<mode>") but no OpenRouter credential resolved — set OPENROUTER_API_KEY, or run /login openrouter in pi to store an openrouter api_key credential, then re-run preflight` — `<mode>` is `advisory` or `active`; em-dashes U+2014; exactly one `FAIL:`; zero `\n`; zero `jev`.
- `loadGateConfig` throws propagate as-is (already single-line `FAIL:` gateFail errors) — never caught into a default-`off`.
- Credential resolution: `opts.apiKey !== undefined ? opts.apiKey : resolveOpenRouterApiKey()` — runtime parity by construction.
- `council_preflight` is parent-block-only (the `registerGateTool`/`registerRouteTool` pattern in `extensions/index.ts`); `hub-tools.ts` and `child.ts` never mention it; never folded into `registerHubTools`.
- The tool never spawns/execs anything — no `child_process`, no `council/preflight.sh` reference in `extensions/preflight.ts`.
- O10 hygiene: every enabled-no-credential test case deletes `OPENROUTER_API_KEY` from the process env (save/restore) and points `PI_CODING_AGENT_DIR` at a fresh `mkdtemp` agent dir; the original values are captured BEFORE any mutation and restored after.
- Repo conventions: no hardcoded `.pi` (use `CONFIG_DIR_NAME`); `hub.ts` untouched; repo filesystem always via `repoRoot` params; tests use `fs.mkdtempSync` trees, never the real repo; conventional commits.
- Nothing under `council/scaffold/` is created or modified; the three preflight scripts keep their current bytes (digest-pinned).

## Review Focus

- **Ambient `OPENROUTER_API_KEY` on this machine** — an enabled-no-credential case that forgets env deletion silently tests a credentialed world and passes wrongly. Pinned by test 1's explicit `delete process.env.OPENROUTER_API_KEY` in a `beforeEach`-managed harness.
- **Ambient `PI_CODING_AGENT_DIR`/real `~/.pi/agent`** — a stored-credential test reading the real agent dir could pass/fail on machine state. Pinned by the captured-before-mutation agent-dir seam (test/provider-cost.test.ts pattern).
- **OAuth-typed credential must NOT count** — a future "broaden the check" edit would accept oauth and break runtime parity with the script's grep hazard (skeptic O3). Pinned by test 3c.
- **`loadGateConfig` throw swallowed into `off`** — a malformed `.council.json` must fail loud, never silently proceed. Pinned by test 4.
- **Tool drift into child mode or spawn** — pinned by source canaries (tests 6, 8) so the guarantee survives refactors, not just this PR's snapshot.

---

### Task 1: Pure core `runStartGatePreflight` + behavioral tests

**Files:**
- Create: `extensions/preflight.ts`
- Test: `test/preflight.test.ts` (tests 1–4 of the spec's list)

**Interfaces:**
- Consumes: `loadGateConfig(repoRoot): { mode: GateMode }` (extensions/gate.ts); `resolveOpenRouterApiKey(): string | null` (extensions/provider-cost.ts:477).
- Produces: `runStartGatePreflight(repoRoot: string, opts?: { apiKey?: string | null }): string | null` — `null` = pass (silent), non-null = the single-line FAIL literal; later tasks rely on exactly this signature.

- [ ] **Step 1: Write the failing tests** — spec tests 1–4 in `test/preflight.test.ts`: enabled-no-credential FAIL byte-`===` for both `advisory` and `active` with env key deleted and agent dir at an empty temp dir; off-mode add-nothing (`absent file` / `gate: {}` / no `gate` key / `mode: "off"` → `null`); stored-credential parity (typed `api_key` auth.json → `null`; injected env → `null`; oauth-typed → FAIL); malformed config throws the single-line `FAIL:` verbatim (invalid mode; bad JSON).

- [ ] **Step 2: Run tests, verify RED** — `bun test test/preflight.test.ts` → fails with "Cannot find module .../extensions/preflight.ts".

- [ ] **Step 3: Minimal implementation** in `extensions/preflight.ts` — loadGateConfig → off ⇒ `null`; credential per the injection rule; null credential ⇒ the R5 literal with `<mode>` interpolated; throws propagate.

- [ ] **Step 4: Run tests, verify GREEN** — same command, all pass.

- [ ] **Step 5: Commit** — `feat(gate): runStartGatePreflight pure core (EV-76)`.

### Task 2: Parent-only `council_preflight` tool

**Files:**
- Modify: `extensions/preflight.ts` (add `registerPreflightTool`)
- Modify: `extensions/index.ts` (parent block, after `registerRouteTool(pi, repoRoot)`)
- Test: `test/preflight.test.ts` (spec tests 6 and 8)

**Interfaces:**
- Consumes: `runStartGatePreflight` (Task 1); `ExtensionAPI.registerTool` shape per `registerGateTool` (extensions/gate-tool.ts:102).
- Produces: `registerPreflightTool(pi: ExtensionAPI, repoRoot: string): void` registering tool name `council_preflight`; execute returns the FAIL line as result text on failure, a pass text otherwise; a `loadGateConfig` throw propagates (fail loud).

- [ ] **Step 1: Write failing tests** — registration canary (`registerPreflightTool(pi, repoRoot)` present in index.ts parent block after `registerRouteTool`, absent from hub-tools.ts/child.ts — the test/gate-render.test.ts:330 pattern) + functional fake-pi test (off-mode repo → pass result, tool name `council_preflight`) + non-spawn source canary (no `child_process`, `spawn`, `exec(`, `execFile`, `preflight.sh` in preflight.ts).

- [ ] **Step 2: Verify RED** — canaries fail (no registration, no module export yet).

- [ ] **Step 3: Implement** `registerPreflightTool` + index.ts wiring.

- [ ] **Step 4: Verify GREEN.**

- [ ] **Step 5: Commit** — `feat(gate): parent-only council_preflight tool (EV-76)`.

### Task 3: Procedure steps + byte pins

**Files:**
- Modify: `council/procedures/council.md` (step 0 gains ONE step before the script line)
- Modify: `council/procedures/features-deliver.md` (Phase 0 gains ONE step before the script line)
- Test: `test/preflight.test.ts` (spec tests 5 and 7)

**Interfaces:**
- Consumes: tool name `council_preflight` (Task 2).
- Produces: packaged procedure text naming `council_preflight`, its step BEFORE the unchanged `bash council/preflight.sh` line; digest pins for the three preflight scripts.

- [ ] **Step 1: Write failing tests** — ordering/reach pins (both packaged procedures contain `council_preflight` with its step index < the `bash council/preflight.sh` index) and byte-identity digest pins (`0674b558…` council/preflight.sh, `06b9a09c…` council/scaffold/council/preflight.sh, `ffb03aea…` smoke/fixture/council/preflight.sh).

- [ ] **Step 2: Verify RED** — ordering pins fail (no tool step yet).

- [ ] **Step 3: Edit both procedures** — one new step each, before the script line: invoke `council_preflight` on the repo root, stop on any `FAIL:` line (same stop rule the procedure already states), pass proceeds to the unchanged script invocation.

- [ ] **Step 4: Verify GREEN** (full file suite).

- [ ] **Step 5: Commit** — `feat(gate): procedures invoke council_preflight before preflight.sh (EV-76)`.

### Task 4: Gates, push, PR

- [ ] Gate 1: `bash council/preflight.sh` (worktree) → pass.
- [ ] Gate 2: `bunx tsc --noEmit` → clean.
- [ ] Gate 3: `bun test` full suite → green, integrations stay gated off.
- [ ] Gate 4: `python3 council/validate.py` → pass.
- [ ] Push `feat/ev-76-gate-preflight`, open PR against `main` referencing EV-76. No merge; board/card state untouched.
