# EV-43 — Reachability falsifier for parent-turn continuation (plan + run record)

## Question the card asks

Does an `agent_settled` handler that invokes `sendUserMessage` actually
produce a **second assistant message** in a real pi session — in both the TUI
and the headless (`-p`) branch? This is the reachability gate EV-40 sits on:
if both branches return no, EV-40's intent becomes a "cannot recover,
restart" copy card instead.

## Design

**Falsifier, not a unit test of the mechanism.** Both branches drive the REAL
installed pi (pi 0.85.1, `node_modules/@earendil-works/pi-coding-agent/dist/cli.js`)
in scratch HOMEs with explicitly constructed envs (PATH + scratch HOME +
falsifier vars only; nothing inherited — the FLLWUP-21 env-split lesson).

- **Provider**: `pi-ai`'s built-in `fauxProvider`, registered from the scratch
  extension `ev43/ev43-falsifier-extension.ts` (`pi.registerProvider`). Call
  #1 is scripted to fail with the intake's failure class (EV-41): the bare
  string `Provider finish_reason error` as `errorMessage`. Calls #2+ succeed
  with the marker text `EV43-SECOND-RESPONSE call=<n>`. Offline, dummy
  credentials, no network.
- **Handler**: an `agent_settled` handler (EV43_HANDLER=1) that sends
  `EV43-CONTINUE` exactly once after the first settle — fire-and-forget in
  TUI (`ctx.hasUI`), poll-then-idle in headless (the
  `extensions/index.ts:442/448-454` command-handler patterns).
- **Control arm**: the same extension with EV43_HANDLER=0 — identical
  provider behavior, no handler send.
- **Attribution**: the injected error string does NOT match pi's
  `RETRYABLE_PROVIDER_ERROR_PATTERN` (asserted in
  `test/ev43-reachability.test.ts` against pi's own
  `isRetryableAssistantError`), so pi's auto-retry never re-issues the call.
  The control arm showing NO second message under identical provider behavior
  is what makes the treatment arm's second message attributable to the
  handler.

## Files

- `ev43/ev43-falsifier-extension.ts` — scratch extension (fail-once faux
  provider + guarded agent_settled handler; settle/shutdown logging to
  `EV43_LOG`).
- `ev43/falsifier-headless.ts` — headless arm runner (`bun
  ev43/falsifier-headless.ts` for the full evidence dump; exported
  `runHeadlessArms`/`secondMessagePresent` for the test).
- `ev43/falsifier-tui.py` — TUI arm driver: pty (28x80), screen model,
  timestamped byte log, frames A (error painted) / B (post-settle) / C (rest),
  per-arm settle log + session JSONL sequences. python3 stdlib only.
- `test/ev43-reachability.test.ts` — classifier-attribution assertion +
  headless characterization test (spawns the real CLI, both arms).

## Observed answer (run record, 2026-09-16)

**YES — reachable in both branches, attributable to the handler.**

- Headless `-p` (treatment): stdout line `EV43-SECOND-RESPONSE call=2`
  (print mode prints the LAST assistant message — the second one), exit 0;
  session JSONL: `user "start" → assistant error "Provider finish_reason
  error" → user "EV43-CONTINUE" → assistant stop EV43-SECOND-RESPONSE`.
  Control: stdout empty, stderr `Provider finish_reason error`, exit 1, only
  the two error-turn messages.
- TUI (treatment): the rendered screen carries
  `start → first-turn-fails → Error: Provider finish_reason error →
  EV43-CONTINUE → EV43-SECOND-RESPONSE call=2`; control shows only the error
  and an idle input bar. The handler-attributable rendered delta (treatment
  vs control, same frame) is the conversation tail directly above the input
  bar: the echoed `EV43-CONTINUE` user row and the second assistant row.
  With the instant-recovery scripted provider, the continuation paints in the
  same burst as the error (nested settle lands ~1ms after the first), so
  there is no intermediate rendered frame; the post-error-paint A→B delta is
  the status/footer row repainting (e.g. row28 `'' -> '↑452 ↓11 … (ev43)
  ev43-model'`). A real provider's latency/backoff would spread this over
  frames — the reachability question does not depend on that.

**Engine findings the mechanism card (EV-40) should know:**

1. The nested continuation run is covered by print mode's own
   `await session.prompt(...)` even when the handler cannot await anything:
   `_emitAgentSettled` runs inside `_runAgentPrompt`'s `finally`, so the
   nested prompt chain is inside the outer run's promise, which print mode
   awaits before teardown.
2. The `agent_settled` **event** context does NOT carry `waitForIdle` (that
   is a command-context affordance). The command-handler pattern at
   `extensions/index.ts:448-454` cannot be transplanted verbatim into a
   settle handler; `ctx.isIdle()` polling works, and plain fire-and-forget
   suffices for correctness in both branches (guarded in the falsifier
   extension).
3. One unreproduced anomaly: in the first TUI falsifier run, a second pi
   session (fresh session file, extensions reloaded, settings.json rewritten)
   started ~9s after the settle and re-ran the same turn; it did not recur
   across the two diagnostics and two formal runs (45s observation windows,
   timestamped byte logs). Recorded here for the Skeptic to chase if it
   reappears; the falsifier's per-branch evidence does not depend on it.
