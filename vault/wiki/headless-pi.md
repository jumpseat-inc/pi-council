---
title: Headless Pi
type: concept
summary: pi's non-interactive operating modes (-p / --mode json / --mode rpc) and their distinct rules — no trust prompt, project-extension discovery that is not -a-gated, single-shot teardown, stale ctx after session replacement, and the waitForIdle pattern for command-dispatch turns.
aliases: [print mode, pi -p, headless mode, non-interactive pi]
tags: [pi-council/concept]
sources: ["[[2026-08-25-smoke-test-bugfixes]]", "[[2026-09-16-epic9-run-ledger]]", "[[2026-09-18-po-fllwup56-step13-ruling]]"]
created: 2026-08-25
updated: 2026-09-18
---

# Headless Pi

The rules that govern pi when there is no human at the keyboard — the substrate
[[smoke-test]] drives, the source of two bugs fixed in v0.10.0, and the
environment [[remote-oauth-login]]'s headless auto-detection reads.

## Modes

`pi -p "<prompt>"` prints the response and exits (single-shot). `--mode json`
emits an NDJSON event stream (`session`, `agent_start`, `turn_start/end`,
`message_*`, `toolcall_*`, `thinking_*`); `--mode rpc` is the stdin/stdout
protocol mode. All three are non-interactive.

## Distinct rules

- **No trust prompt.** Non-interactive modes never ask "trust this project?".
  Without a saved decision they fall back to `defaultProjectTrust`
  (`ask`/`always`/`never` in `~/.pi/agent/settings.json`); `--approve`/`-a`
  overrides for one run. Project-local extensions and settings load only when
  trusted.
- **Project-extension discovery is *not* `-a`-gated (EPIC-9, FLLWUP-56).**
  `-a`/`--approve` answers the trust question for one run; it is **not** the
  switch that turns project-local extension loading on and off. A print-mode
  parent loads its cwd's `.pi/extensions` on its own, so a scratch-repo shim
  placed there to reach a **seat child** is **also** loaded by the parent. Such
  a shim must gate itself on the child discriminator (`--session-id` in
  `process.argv`) and be a no-op otherwise — the guard is load-bearing, not
  cosmetic. This is why FLLWUP-56's seat-child falsifier needed no engine
  change: the same rule that makes the shim reachable from the child reaches
  it from the parent. See [[2026-09-18-po-fllwup56-step13-ruling]].
- **Single-shot teardown.** After the initial prompt resolves, the runtime is
  disposed. Any async work started by a command handler must be **awaited to
  completion inside the handler** or it dies with the process. The extension
  `sendUserMessage` API is **fire-and-forget** (resolves before the turn runs),
  so awaiting it is not enough — the pattern is: fire it, poll `ctx.isIdle()`
  until the run becomes active, then `await ctx.waitForIdle()` (which also
  covers retries, compaction, and queued continuations). See
  [[2026-08-25-smoke-test-bugfixes]] bug 1.
  ⚠️ **Refinement (EPIC-9):** `waitForIdle` exists on the **command** context
  only. The `agent_settled` **event** context does not carry it, so a
  continuation built on that event cannot transplant the pattern verbatim —
  poll `ctx.isIdle()` instead, and note `_emitAgentSettled` clears
  `_isAgentRunActive` *before* awaiting handlers, so `isIdle()` is already true
  during the emit. A **timer-deferred** send also dies with the process in
  `-p`, which is why EV-40 gated on an empirical reachability falsifier rather
  than seat consensus. See [[parent-turn-continuation]].
- **Print mode hijacks stdout and owns the exit code (EPIC-9).** `-p` calls
  `takeOverStdout()`, reassigning `process.stdout.write` to **stderr**, so
  extension output reaches the real stdout only via `fs.writeSync(1, …)`. And
  `main` assigns `process.exitCode` **after** settle handlers run, so an
  extension needing a specific exit code must set it in a one-shot `exit`
  listener. Both were root-caused live while building the parent-turn
  continuation's headless surface ([[parent-turn-continuation]]).
- **Stale ctx after session replacement.** Startup (project trust activation,
  `/reload`, `newSession`/`fork`/`switchSession`) replaces the session; captured
  `ctx` getters call `assertActive()` and **throw**. Async continuations that
  touch the old ctx must be guarded — see bug 2.
- **Ephemeral sessions.** Print-mode sessions don't persist by default;
  `--session-dir <dir> --session-id <id>` scopes child sessions for the council
  runs substrate.

## Slash commands

Commands route in non-interactive mode (`_tryExecuteExtensionCommand` runs the
handler synchronously), but the handler's dispatched turn is the part that
needs the waitForIdle pattern above — this is why `/council` was a silent no-op
headlessly before v0.10.0.

## Related

- [[parent-turn-continuation]] — the EPIC-9 surface these rules gate
- [[smoke-test]] — the consumer of these rules
- [[remote-oauth-login]] — the copy-paste OAuth pattern for headless agents (the auth half of operating headless)
- [[procedure-commands]], [[seats]]
- [[2026-08-25-smoke-test-bugfixes]], [[2026-08-25-remote-mcp-oauth]]

## Sources

- pi docs `docs/usage.md` (Modes, Project Trust), `docs/settings.md`
- pi source `dist/modes/print-mode.js`, `dist/core/agent-session.js`
- `extensions/index.ts` (the mode-aware handler fix)
- [[2026-09-18-po-fllwup56-step13-ruling]] — the `-a`/project-extension finding
