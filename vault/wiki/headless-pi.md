---
title: Headless Pi
type: concept
summary: pi's non-interactive operating modes (-p / --mode json / --mode rpc) and their distinct rules — no trust prompt, single-shot teardown, stale ctx after session replacement, and the waitForIdle pattern for command-dispatch turns.
aliases: [print mode, pi -p, headless mode, non-interactive pi]
tags: [pi-council/concept]
sources: ["[[2026-08-25-smoke-test-bugfixes]]"]
created: 2026-08-25
updated: 2026-08-25
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
- **Single-shot teardown.** After the initial prompt resolves, the runtime is
  disposed. Any async work started by a command handler must be **awaited to
  completion inside the handler** or it dies with the process. The extension
  `sendUserMessage` API is **fire-and-forget** (resolves before the turn runs),
  so awaiting it is not enough — the pattern is: fire it, poll `ctx.isIdle()`
  until the run becomes active, then `await ctx.waitForIdle()` (which also
  covers retries, compaction, and queued continuations). See
  [[2026-08-25-smoke-test-bugfixes]] bug 1.
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

- [[smoke-test]] — the consumer of these rules
- [[remote-oauth-login]] — the copy-paste OAuth pattern for headless agents (the auth half of operating headless)
- [[procedure-commands]], [[seats]]
- [[2026-08-25-smoke-test-bugfixes]], [[2026-08-25-remote-mcp-oauth]]

## Sources

- pi docs `docs/usage.md` (Modes, Project Trust), `docs/settings.md`
- pi source `dist/modes/print-mode.js`, `dist/core/agent-session.js`
- `extensions/index.ts` (the mode-aware handler fix)
