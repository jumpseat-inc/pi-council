# FLLWUP-44 — Name the provider failure before the backoff countdown

**Card:** `council/cards/FLLWUP-44.md` (EPIC-9) — settled design, steps 7–8 handoff.
**Status:** full-council, surface-touching path; steps 1–6 closed (three
generators round 1 + round 2, Skeptic job-9.7, consolidator job-9.8,
`product-owner` R3 ruling job-10 returned and appended verbatim as Step 6b).
This document writes up what the Council settled and what R3 ruled. It **does
not reopen** anything closed in steps 2–6 or in R3.

## 1. Problem

EV-40 shipped the parent-turn retry surface: during a backoff the `RetryEditor`
shows exactly one extra editor-region line, the R5 countdown
(`Retrying in 2s (attempt 2 of 3) — Esc to abort`), and headless prints the same
countdown. A person watching that countdown is told *how long* but never *what*
is being retried — the surface jumps from an off-screen `agent_settled` to a
ticking clock with no signifier of the failure. EV-40's own `designer` filed a
transient failure line; the owner endorsed it, but R5's copy was binding and did
not include it. R3 re-opened R5 for exactly this line: the backoff surface **may
name the provider failure once, in a transient line distinct from the countdown
line**, with the string ruled by `product-owner` before merge. R5's countdown
and terminal-exhaustion strings remain binding and unchanged.

The mechanism this card completes is already merged. This card is the second
surface line, its headless parity print, and their tests.

## 2. Settled contract (from steps 2–5; not reopened)

- **Carrier.** A second `RetryEditor` editor-region line, pushed **above** the
  R5 countdown, plus one `host.print` immediately before the first
  `formatRetryCountdown` print of each backoff episode in headless. `ui.notify`
  and chat-append are **rejected**: `"warning"` renders a permanent
  `Warning: `-prefixed chat line, `"info"` de-dups consecutive-identical
  messages, neither is transient, and `EditorTheme` is exactly
  `{borderColor, selectList}` — no second visual token exists.
- **Placement/ordering invariants** (`closed-green`, Skeptic O2):
  - The failure line pushes strictly between `super.render(width)` output and
    the countdown push: during `backoff`, `render()` returns
    `super.length + 2`, index `-2` is the failure line, index `-1` is the
    countdown.
  - `idle` appends nothing; `exhausted` appends only
    `formatRetryExhausted(maxAttempts)` at `-1` (no failure line).
  - Headless: the failure line is never the last non-empty stdout line (the
    terminal copy is) and must not start with `Retrying in` (hygiene for the
    live-gate filter; not a gate assertion).
- **Literal/predicate coupling** (`closed-green`, O4):
  `classifyParentTurnRetry` returns `"retry"` only for byte-equality with
  `PROVIDER_FINISH_REASON_ERROR` (`extensions/retry.ts`), so the failure being
  named is a single constant. The line is a **pure static formatter output**,
  never assembled from `pendingError.errorMessage`; it is emitted iff a retry
  was classified. Because `beginBackoff` is only reached on a `schedule`
  decision, `surfaceState === "backoff"` is an exact proxy for that predicate
  and **no new controller state is needed**.
- **Headless mechanism** (`closed-green`, O6): the injected
  `ParentRetryHost.print` is wired to `fs.writeSync(1, …)` in
  `registerParentTurnRetry`'s real host block; it is the O-ROUTE write and the
  only path observable through `ev40-wiring.test.ts`'s `state.printed` seam. Do
  not use a raw `fs.writeSync` in `onSettled`.
- **R5 binding strings are immutable** and may not be changed by this card:
  - countdown `Retrying in 2s (attempt 2 of 3) — Esc to abort`
    (`formatRetryCountdown`)
  - exhaustion `Retries exhausted after 3 attempts. The provider kept failing.
    Press Enter to try again.` (`formatRetryExhausted`, exit code 75 headless)
  - The existing R5-guard tests (`test/ev40-parent-retry.test.ts`, the live-gate
    countdown/terminal/exit-75 assertions) must pass **unmodified**; their green
    is the R5 compliance proof.

## 3. R3 ruling (binding; final copy and re-show semantic)

**Q1 — exact string.** The transient failure line is byte-exactly:

```
The provider returned an error.
```

Period, no glyph, no vendor token. Renders equal to this at wide widths;
`truncateToWidth(width)` clamp at narrow widths. A pure static
`formatRetryFailure()` output; emitted iff
`classifyParentTurnRetry(pendingError) === "retry"`; absent on `idle` and
`exhausted`. Engine-level gate the string must satisfy (no ruling may relax):
- no `finish_reason` substring;
- not byte-equal to `Provider finish_reason: error`;
- does not start with `Retrying in`.

Rejected candidates and reasons (recorded, not shipped):
`Provider returned no response.` — `closed-red` against the green P3 live gate,
which proves an `error`-stop turn can carry streamed partial text, so the clause
can contradict the transcript above it; `Provider request failed — retrying.` —
owner conceded round 2; `Provider error.` — drops the article, while `The
provider` matches R5's terminal-copy register.

**Q2 — re-show semantic: per backoff episode.** The failure line shows at
every `beginBackoff(attempt, delayMs)` (attempts 2 and 3), survives across the
countdown ticks of that episode, and disappears with `clearToIdle()` /
`moveToExhausted()` / `escAbort()`. **Zero new controller state** —
`surfaceState === "backoff"` is the gate. Carrier confirmed: a second
editor-region line pushed above the R5 countdown in `RetryEditor.render(width)`
(TUI), and one `host.print` immediately before the first `formatRetryCountdown`
print of each backoff episode in headless. R5's binding strings unchanged.

Rejected semantic: once-per-cycle would require a `RetryController` latch with a
reset point distinct from `clearToIdle()` plus a headless-side flag — neither
exists on this tree (Skeptic O1). Designer's T-RR1 is recorded as the rejected
semantic, **not** a skipped test.

## 4. Change set

One branch, one PR. In `extensions/parent-retry.ts`:

1. **`formatRetryFailure()`** — a new exported pure formatter next to
   `formatRetryCountdown` / `formatRetryExhausted`, returning exactly
   `The provider returned an error.` (hardcoded literal, no interpolation).
   Add a one-line comment pointing at `classifyParentTurnRetry`: if the parent
   classifier ever widens past the single literal, this static line must be
   revisited.
2. **`RetryController`** — add a read-only accessor for the extra line, or
   compose it in the editor directly from `surface`. No new mutable state.
   Concretely: `failureLineText()` returns `formatRetryFailure()` iff
   `surfaceState === "backoff"`, else `""` (mirroring `lineText()`; the
   `surfaceState === "backoff"` check is the whole gate).
3. **`RetryEditor.render(width)`** — during `backoff`, push the failure line
   above the countdown: compute the failure text, style it with the same
   `borderColor` token as the countdown, `truncateToWidth(styled, width)`, push
   it, then push the countdown. Visible glyphs equal the ruled string at wide
   widths; the clamp applies at narrow widths.

In `extensions/index.ts`, in the headless branch of `onSettled` (the schedule
path, before `await runHeadlessCountdown(...)`): one
`host.print(formatRetryFailure())` immediately before the countdown begins for
that episode. This runs twice on a 3-attempt run (attempt 2 and attempt 3),
never on the `exhaust` branch, and never on the `none` branch.

Not in the change set: any edit to `formatRetryCountdown` / `formatRetryExhausted`
or `lineText()`; any `RetryController` latch/flag; any `ui.notify` / chat
carrier; any raw `fs.writeSync` in `onSettled`.

## 5. Tests (red-first where a pin is the point)

Add to `test/ev40-parent-retry.test.ts` and `test/ev40-wiring.test.ts`
(`bun:test`, relative imports; no real-repo filesystem access):

- **T1 formatter byte-exact.** `formatRetryFailure()` === `The provider
  returned an error.`; the output contains no `finish_reason` and is not
  byte-equal to `PROVIDER_FINISH_REASON_ERROR`; it does not start with
  `Retrying in`.
- **T2 render composition.** In `backoff`: `render(80).length ===
  super.render(80).length + 2`, index `-2` is the failure line, index `-1` is
  the countdown. Retitle/repair the existing test literally titled "appends
  exactly one extra line while the surface is non-idle; none while idle" (its
  title currently lies about its `>= 1` assertion) so it pins the new
  composition.
- **T3 idle/exhausted absence.** `clearToIdle()` → no failure line; after
  `moveToExhausted()`, `render(120).length === super + 1` and the last line is
  `formatRetryExhausted(3)` with no failure line; after `escAbort()` the same.
  This closes principal's length-assertion gap (a failure line pushed above the
  terminal copy would still satisfy `lines.at(-1)`).
- **T4 per-episode re-show (the ruling's semantic).** `beginBackoff(2, …)`,
  then `clearToIdle()`, then `beginBackoff(3, …)`: the failure line is present
  in both backoff renders. No test asserts the rejected once-per-cycle
  semantic.
- **T5 width clamp.** At a wide width the rendered line's visible text equals
  the ruled string; at a narrow width it equals the `truncateToWidth` clamp.
- **T6 predicate coupling.** A `pendingError` whose `errorMessage` is
  `Provider returned 502` yields no decision and no failure line (already
  covered at the decision point; assert the render side too).
- **T7 headless per-episode count.** Through
  `registerParentTurnRetry` + `makeHost` (`test/ev40-wiring.test.ts`'s
  `state.printed` seam), a 3-attempt run prints exactly **two**
  `formatRetryFailure()` lines, each immediately followed by that episode's
  first `formatRetryCountdown` line; the final non-empty printed line is
  `formatRetryExhausted(3)`.
- **T8 R5 guards unmodified.** Leave
  `test/ev40-parent-retry.test.ts`'s countdown/terminal/live-gate assertions
  byte-for-byte intact; all must pass. Only the one mis-titled test in T2 may
  be edited (title/assertion), and its R5 string content must not change.

## 6. Residuals (recorded, not claimed green)

- **The third failure is named only by R5's terminal copy.** On a 3-attempt
  run there are 2 failure lines and 3 failures; the final failure is named by
  `The provider kept failing.` Per episode is the ruled semantic, so this is
  intended, not a defect. It is pinned by T7's count (asserted, not assumed).
- **Skeptic O3 residual accuracy** — whether `The provider returned an error.`
  misattributes pi's synthesized `finish_reason: "error"` to the provider is a
  lexical question no repo test settles. R3 ruled the string with this known;
  the residual is accepted, not re-opened.
- **Headless scrollback grouping** — per-episode prints accumulate; the
  episode-grouped placement is the ruled choice.
- **Once-per-cycle** — the rejected semantic (designer's T-RR1) is recorded on
  the card, not shipped as a skipped test.

## 7. Gate set for this repo

`bunx tsc --noEmit`, `bun test`, `python3 council/validate.py` (AGENTS.md
§Commands + `.github/workflows/gates.yml`). `council/preflight.sh FLLWUP-44` is
run as a card-aware check; its branch-freshness clause (FLLWUP-27) is a known
mid-card FAIL by construction, and the FLLWUP-44 re-run set is
`tsc` / `bun test` / `validate.py`. This repo defines no database/import/server
gate; `COUNCIL_INTEGRATION=1` stays gated and is not run. Owner gates are met
in full regardless of change size. Work happens in an isolated git worktree;
the main checkout's branch state is never mutated.

## 8. Citations

`vault/wiki/retry-classification.md` (the literal's authority; the with-colon
`PROVIDER_FINISH_REASON_ERROR` and the colon-drop defect it caused),
`vault/wiki/parent-turn-continuation.md` (the EV-40 surface, the R5 copy
ruling, the headless stdout path), `vault/wiki/deterministic-merge-check.md`
(the five merge criteria; copy rulings enforced as literal-string tests),
`council/cards/EV-40.md` (R5 binding strings; the designer position this card
adopts), `council/cards/FLLWUP-44.md` (steps 1–6 and the R3 ruling verbatim).
Wiki gaps: no page documents the second editor-region line or the ruled
`formatRetryFailure()` copy; the step-14 persist step may file that.