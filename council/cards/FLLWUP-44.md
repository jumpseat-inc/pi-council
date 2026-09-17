---
id: FLLWUP-44
title: Name the provider failure before the backoff countdown
state: In Progress
owner: null
epic: EPIC-9
goal: During a retried parent turn's backoff the surface names the provider failure once, distinct from the countdown line, and the copy is ruled before it ships.
---

## Intent

EV-40's round-2 `designer` position — a transient line naming the failure,
distinct from the countdown — was endorsed by the owner but not adopted,
because R5's copy is binding and does not include it. R5 is a recorded human
Phase-1 ruling, so only the human re-opens the copy; steward dispositioned
this as a `Backlog` residual under the `Done` epic.

## Orchestrator rulings (Phase 1, binding)

Recorded human decisions for this run. Immutable and binding on every seat,
`steward` included; a runner that hits one applies it and cites the ruling
rather than re-asking.

- **R3 (R5 re-opened — transient failure line).** R5's copy is re-opened for
  this card: the backoff surface may name the provider failure once, in a
  transient line distinct from the countdown line. The exact string is
  drafted by `designer` and the final copy ruled by `product-owner` before
  merge; R5's countdown string and its terminal exhaustion string remain
  binding and unchanged. This is the human re-opening R5, which R5 itself
  reserved to the human.

## Run record (features-deliver)

### Step 1 — classification (facilitator)

- **Path: full council.** The card is spec-ambiguous: `goal` fixes the
  outcome (the surface names the provider failure once, distinct from the
  countdown line, copy ruled before ship) but leaves the placement of the
  transient line, its transient lifetime, whether it re-shows per attempt,
  and the exact string open. R3 assigns the string draft to `designer` and
  the final copy to `product-owner`, which is a deliberation-plus-ruling
  path, not an implementation choice. Per council.md step 1 this card runs
  steps 2-6 and then 7-14.
- **Surface-touching: yes (recorded).** The deliverable is user-visible
  copy on the EV-40 backoff surface (the `RetryEditor` editor region in the
  TUI; the stdout countdown in headless). A full-council, surface-touching
  card seats `designer` as a third generator in steps 2-3.
- **Rulings applied (Phase 1, binding), not reweighed:**
  - **R3 (R5 re-opened — transient failure line)** applies directly and is
    quoted verbatim in this card's frontmatter `## Orchestrator rulings`
    section: the backoff surface MAY name the provider failure once, in a
    transient line distinct from the countdown line; the exact string is
    drafted by `designer` and finally ruled by `product-owner` before
    merge. Because this container may not dispatch `product-owner`, the
    draft is escalated to the orchestrator for the copy ruling, and the
    card does not ship an unruled string.
  - **R5's binding strings are unchanged and re-cited:** countdown
    `Retrying in 2s (attempt 2 of 3) — Esc to abort`; exhaustion
    `Retries exhausted after 3 attempts. The provider kept failing. Press
    Enter to try again.` Neither is opened by R3 (R3 opens only the
    transient failure line) and neither is editable by any seat.
  - Scope = the nine promoted EPIC-9 residuals, EPIC-9 stays `Done`;
    merge = `gh pr merge <PR> --squash --admin --match-head-commit <X>`;
    step-13 follow-up confirmation is re-homed to `product-owner` (draft,
    never write an unapproved follow-up); R1 (union-merge reconcile) is the
    sanctioned non-fast-forward repair, never force.
- **Seat resolution (`<seat_resolution_check>`):** this card dispatches
  `owner`, `principal`, `designer`, `skeptic`, `consolidator`, and `judge`.
  All six resolve from the packaged seat set (`council/agents/*.md`); this
  checkout has **no `.pi/agents/`** directory, so nothing shadows them and
  no repo-local override exists. `product-owner` / `steward` are never
  dispatched by this container (escalation-only). No `Unknown seat` is
  possible on the seats named here.
- **Environment (facilitator-read, first-hand):** main checkout clean;
  `HEAD = origin/main = b90d60b03b2ac230ddda644b31b1c2037ecfe76a`;
  `gh` authenticated as `tistaharahap`. FLLWUP-40/43/42/41 merges are
  ancestors of `HEAD` with their cards `Done`. This card is `Ready` at the
  start of the run; no `Needs Human` state and no outstanding ruling —
  deterministic merge check criterion 5 holds at the start of the card.
- **Gate set for this repo (authoritative; `docs/gates/GATE-EVIDENCE.md`
  does not exist here):** `bunx tsc --noEmit`, `bun test`,
  `python3 council/validate.py` (AGENTS.md §Commands +
  `.github/workflows/gates.yml`). `council/preflight.sh FLLWUP-44` is run
  as a card-aware check but its branch-freshness clause (FLLWUP-27) is
  known to FAIL by construction once a facilitator record commit advances
  `origin/main` past a branch cut; per the standing known-artifact note the
  step-11 re-run set is `tsc` / `bun test` / `validate.py`. This repo
  defines no database/import/server gate; `COUNCIL_INTEGRATION=1` stays
  gated and is not run.
- **Grounded facts carried into deliberation (inputs, not a settled design;
  the Council verifies them at this tree):**
  - The mechanism this card completes already shipped in EV-40
    (`extensions/parent-retry.ts`, merged). The backoff surface is
    `RetryController.lineText()` -> `RetryEditor.render()`, which appends
    exactly one extra editor-region line (`extensions/parent-retry.ts:250-256,
    296-307`). Headless prints the same countdown via
    `runHeadlessCountdown` (`extensions/index.ts:435-460`).
  - The parent-loop predicate `classifyParentTurnRetry`
    (`extensions/retry.ts:110-121`) retries ONLY the exact literal
    `Provider finish_reason: error` (`extensions/retry.ts:103`) and
    deliberately excludes every pi-retryable message; the pending errored
    message is available to the engine as `pendingError` at settle
    (`extensions/index.ts:461`).
  - R5's surface is the `CustomEditor` subclass (`RetryEditor`), whose
    countdown is a rendered line, never buffer text and never
    `setEditorText` (EV-40 PO ruling Q1 / Skeptic O6).
  - EV-40's own designer filed the non-adopted position this card adopts:
    "a transient toast/log line naming the failure, distinct from the
    countdown itself" (`council/cards/EV-40.md` step-2 designer position);
    the owner endorsed it ("I'd carry it into A") and principal did not
    engage it. R3 is the human re-opening R5 to permit it. The card
    delivers the surface naming plus its tests; the mechanism is already
    merged.

### Step 2 — independent first pass (round 1)

Jobs: `owner` `job-9.1` (5.5m, 6 turns), `principal` `job-9.2` (5.5m, 32
turns), `designer` `job-9.3` (5.5m, 9 turns). All settled `done`. Each was
given only the card; no seat saw another's position.

#### Owner position (`job-9.1`) — verbatim

**Position — owner seat, FLLWUP-44 first pass**

## Approach

The mechanism is already merged; this card is surface copy plus tests, and every design question reduces to where a second transient line hangs off the existing `RetryController` state machine without touching R5's two binding strings. I read the actual tree: `extensions/parent-retry.ts` (controller, `RetryEditor.render()`, formatters), `extensions/retry.ts:103-121` (`PROVIDER_FINISH_REASON_ERROR`, `classifyParentTurnRetry`), `extensions/index.ts:435-520` (`runHeadlessCountdown`, `onSettled`), and `test/ev40-parent-retry.test.ts`. Nothing pins "exactly one extra editor line" in a test — that invariant lives in docs only, so adding a second backoff-state line is a contained change.

**Where the line renders.**

1. **TUI:** today `RetryController.lineText()` returns one string and `RetryEditor.render()` (parent-retry.ts:529-536) pushes it styled with `borderColor` and `truncateToWidth` after `super.render(width)`. The failure line should be a second pushed line in that same render path — a pure static formatter next to `formatRetryCountdown`/`formatRetryExhausted`, pushed above the countdown, only when `controller.surface === "backoff"`. No new controller state is needed: the backoff surface *is* the "failure happened" state; the controller already knows it.
2. **Headless:** `runHeadlessCountdown` (index.ts:435-460) prints the countdown at t=0 and once per whole second via `host.print`. Parity is one `host.print` of the failure line immediately before the first countdown line of each attempt's backoff — once per attempt, not per tick.

**Transient lifetime / re-show per attempt.** In the TUI the line lives exactly while `surfaceState === "backoff"`: shown by `beginBackoff`, re-shown per attempt (attempt 2 and 3 each re-enter backoff), and gone the instant the send timer fires (`clearToIdle` before `sendUserMessage`, index.ts:502-504), on Esc abort, or on exhaustion. Critical constraint: the line must **not** persist into the `exhausted` surface — R5's terminal string is binding and unchanged, and a failure line lingering above `Retries exhausted…` would be an implicit re-open of terminal copy. A test must pin: backoff → both lines; exhausted/idle → countdown-or-terminal copy only, failure line absent.

**How the failure is named.** Not the raw literal. `classifyParentTurnRetry` retries *only* the exact string `Provider finish_reason: error` (retry.ts:110-121) — so the named failure is always the same single thing, and interpolating `pendingError.errorMessage` into the surface would buy a dynamic string where only one value can ever occur, plus leak pi-internal jargon ("finish_reason") into a user surface whose R5 style is human ("The provider kept failing"). My recommendation to designer/PO: a static ruled string in human phrasing (e.g. `Provider request failed — retrying.`), no emoji, plain text (AGENTS.md 9.6). I'd put one comment at the formatter pointing at `classifyParentTurnRetry`: if the classifier ever widens past the literal, this static line must be revisited — that's the honest seam.

**Tests (TDD, failing first).** In `test/ev40-parent-retry.test.ts` (controller unit) and `test/ev40-headless.test.ts`:
- Render-composition: backoff surface renders the failure line distinct from and above the countdown; idle renders neither; exhausted renders only the R5 terminal string.
- Per-attempt re-show: second `beginBackoff` re-renders the line.
- Width truncation applies to the new line (existing `truncateToWidth` pattern).
- R5 string guards stay byte-identical and untouched-green — ev40-parent-retry.test.ts:274-276 already pins the countdown; the exhausted pin guards the terminal string. Those tests passing unmodified *is* the R5 compliance proof.
- Headless: failure line printed exactly once per attempt's backoff, before the first countdown line; exhausted path prints only the terminal string + exit 75.

**Gates.** Per the card's run record: `bunx tsc --noEmit`, `bun test`, `python3 council/validate.py` — I take that set from the card, not memory; this repo is a package, so the import/boot gates from my general discipline don't apply here and the card's recorded set governs.

## Tradeoffs accepted

- A second editor-region line during backoff slightly changes the "exactly one extra line" documented invariant — accepted because no test pins it and the line vanishes with the surface. If it bothers the layout, the copy could be prefixed onto the countdown line, but that fails "distinct from the countdown line" — so two lines it is.
- Static copy instead of interpolating the actual error: loses generality if the classifier ever widens, gains a fully ruled, testable, jargon-free surface. Worth it.
- Headless gets a parity line even though headless output scrolls and "distinct" is trivial there — cheap, and keeps the two surfaces honest.

## Testable claims (falsifiable)

1. **No test pins the one-line invariant** — claim: adding a second backoff line breaks zero existing tests except ones we write. Verify: `bun test` green with the new line pushed in `RetryEditor.render` for the backoff surface only.
2. **The failure being named is statically knowable** — claim: every retried settle has `errorMessage === "Provider finish_reason: error"` by construction. Verify: a test asserting `classifyParentTurnRetry` returns "retry" for nothing else, plus a render test asserting the surface never contains `finish_reason`.
3. **The line must not appear on the exhausted surface** — a test that after `escAbort()`/`moveToExhausted()` the rendered lines contain the R5 terminal string and no failure line would fail against any implementation that hangs the failure line on `lineText()` unconditionally.
4. **Per-attempt re-show** — a test calling `beginBackoff(2, …)` then `beginBackoff(3, …)` asserts the failure line is present in both; fails on any once-only/latched design.

**Split judgment (my recommendation, PO rules):** failure line *above* the countdown (chronological read: what happened, then what happens next), static human phrasing, one host.print per attempt in headless. All three are copy-level and land with designer/PO per R3; the engine contract I'd hold is: backoff-only, static, untruncated-then-truncated, R5 strings untouched.

#### Principal position (`job-9.2`) — verbatim

## Cross-seam reading — what the contract is right now

**(1) Placement.** The EV-40 surface is one editor-region line pushed at the end of `RetryEditor.render()` (`extensions/parent-retry.ts:401-408`), sourced from `RetryController.lineText()` (`:250-256`); headless is `host.print` from `runHeadlessCountdown` (`extensions/index.ts:439-460`), wired to a raw fd-1 write (`index.ts:614-616`) so it reaches real stdout past pi's print-mode stdout takeover. A naming line therefore lands in exactly two places, and both are already part of that surface: a **second `lines.push` immediately before the countdown push** (TUI), and a **`host.print` before the first `formatRetryCountdown` print of each episode** (headless, e.g. at `index.ts:439`).

That placement is not taste — two existing tests force it. `test/ev40-parent-retry.test.ts:440-451` asserts `during[during.length-1]` contains `attempt 2 of 3`, and `:452-458` asserts `lines[lines.length-1] === formatRetryExhausted(3)`. A naming line pushed *after* the countdown breaks the first; one pushed below the terminal copy breaks the second. Headless has the same two invariants: `test/ev40-live-gates.test.ts:105` filters countdowns by `startsWith("Retrying in")` and `:113-114` asserts the terminal copy is the last non-empty stdout line. So the naming line must be strictly *between* the editor content and the countdown, and strictly *not final* on stdout — a rule the implementer cannot see from either side alone.

Mechanism consequences worth naming before copy is drafted: `EditorTheme` is `{borderColor, selectList}` (`node_modules/@earendil-works/pi-tui/dist/components/editor.d.ts:25-28`), so a second editor-region line has **no second token** to look different from the countdown; and `ui.notify(msg,"warning")` is not a toast — it appends `Spacer` + `Text("Warning: " + msg)` to the chat container for the session (`node_modules/@earendil-works/pi-coding-agent/dist/modes/interactive/interactive-mode.js:3525-3529`), while `"info"` appends dim chat text with consecutive-identical de-dup (`:2878-2893`). There is no fading-notification mechanism in pi.

**(2) Lifetime and re-show.** The honest definition is *the backoff episode*: the naming line exists exactly while `surface === "backoff"` and disappears with it (`clearToIdle` `:308`, `escAbort` → exhausted `:275`). Because `render()` is a pure function of controller state and is called on every repaint (the 1 s `startTick` `:319-330` plus every keypress), a state-derived line is continuously visible without ever duplicating; that is the only mechanism-compatible reading of "transient" here, and it is why I would keep the line *off* the chat plane.

It re-shows **per episode, not per turn**: `beginBackoff` is called once per retry attempt (`index.ts:498` TUI, `:522` headless), so attempt 2 and attempt 3 each get a naming line. In headless it *accumulates* — attempt 3's naming line is appended above attempt 3's countdown block, so a CI reader sees the same sentence twice with no visual grouping, and it is in the scrollback permanently. Note also that on the `exhaust` branch (`index.ts:471-479`) only the terminal copy is written; the third failure is named solely by R5's already-binding "The provider kept failing." So "the surface names the provider failure once" is true per *episode*, and the surface does **not** name every failure.

**(3) How the failure is named — this is the load-bearing seam fact.** At the schedule branch the name is provably a single constant. `decideSettleRetry` returns `"schedule"` only when `classifyParentTurnRetry(pendingError) === "retry"` (`parent-retry.ts:143-146`), and that predicate returns `"retry"` only for the exact byte string `PROVIDER_FINISH_REASON_ERROR = "Provider finish_reason: error"` (`retry.ts:78`, `:110-121`) — anything matching pi's `RETRYABLE_PROVIDER_ERROR_PATTERN` is excluded by design. There is no second possible failure to display. So "raw literal vs human phrasing" is not a data question; it is a presentation choice about one constant, and the raw option means shipping pi's internal `mapStopReason` template — the exact `: `-bearing string whose colon-drop silently deadened EV-37's branch (`vault/wiki/retry-classification.md` §"Literal hygiene, and the defect it caused"). The register already exists and is already human-ruled: R5's terminal string ends "The provider kept failing." (`parent-retry.ts:91-93`). Keeping the constant in `retry.ts` and the surface in human register is the only choice that doesn't put a vendor template on a user-visible surface.

One injection rule follows: capture the name at arm time and pass it into the controller (the deps-injection pattern at `parent-retry.ts:203-214`); do **not** let the render path read the engine's `pendingError` closure field, whose lifecycle the render path does not own (`index.ts:407-415` clears it on any non-continuation `agent_start`).

## Blind spots

- **Designer (screen/conceptual-model vantage).** Will reason about a "toast" as a visual object with a fade, and about state 3 leaving a readable trace — and cannot see that pi has no fading notify, that the only two carriers are *editor-region (vanishes)* and *chat-append (persists)*, or that `EditorTheme` offers no second token for a visually distinct second line. The adopted position's own words — "a transient toast/**log** line" (`council/cards/EV-40.md:550`) — name two mutually exclusive lifetimes.
- **Owner (code vantage).** Will reach for `ui.notify` because it is one call from the settle closure where `pendingError` is already in hand, and cannot see that a `"warning"` notify renders `Warning: <ruled copy>` or that an `"info"` notify de-dupes the attempt-3 repeat into silence. Also cannot see the stdout/tui consumers' ordering invariants listed above.
- **Product-owner (copy vantage).** Rules the string as text and cannot see that the *rendered* string is carrier-dependent (council-owned line vs pi's "Warning: " prefix vs headless plain line), so a copy ruled before the carrier is fixed can be mutated by the carrier choice after the ruling.
- **Headless/log consumer.** A line-stream has no "transient" — one print is permanent scrollback — while the TUI side can have a line that vanishes. Neither side can see the other's meaning of "once", and neither can see that the number of naming lines (2) differs from the number of failures (3) on a 3-attempt run.
- **Hub/per-attempt surface (`attempt N/M`, EV-39/EV-42).** Cannot see that "attempt 2 of 3" now appears on a *parent-turn* provider failure; the parent and hub retry loops share the vocabulary and differ only by plane.

## Reframe

One reframe, and it is about sequencing rather than design: **the carrier is a precondition of the copy ruling.** R3 orders "designer drafts, product-owner rules the copy", but the human's string is `carrier(line) + prefix` — a notify adds `Warning: ` and a chat line is permanent. Ruling copy first, then carrier, means the ruled copy can ship altered or in a place whose lifetime contradicts the goal's word "transient". Fix the carrier first (I recommend the second editor-region line + one headless print per episode, both derived from a name injected at `beginBackoff`), then rule the copy against the *full rendered* string.

Two explicit positions, so they are not read as neutral: **reject the notify/chat carrier** — it makes "transient" false and hands pi the prefix; **reject the raw literal** — it is a private vendor template and the only class this loop retries. Otherwise **the proposed design is sound; no further reframe needed**: this is a small surface addition whose real risk is seam-detail regression, not design ambiguity.

**Split judgment** (kept honest, not manufactured): (a) genuine and blocking-ish — *carrier* (editor-region line vs notify/chat line), because it decides both the lifetime claim and whether the ruled string is the shown string; (b) genuine but resolvable by a definition — the meaning of "once" (per episode vs per turn vs per render frame), where the TUI can only express per-episode and headless makes every print permanent; (c) **not** a split — raw literal vs human phrasing, since the data is a single constant and R5's terminal string already supplies the ruled register.

## Testable claims

Placement/lifetime (all as runnable assertions):
1. **Countdown stays byte-identical and last.** `editor.render(width)` in backoff: `lines.at(-1) === formatRetryCountdown(attempt, maxAttempts, remaining)` and `lines.length === super.render(width).length + 2`; on `exhausted`, `lines.at(-1) === formatRetryExhausted(maxAttempts)`; on `idle`, no naming line.
2. **No accumulated/duplicated line.** `editor.render(80)` called twice returns arrays of equal length and equal elements. This is the regression the existing tests *cannot* catch: `:449` asserts via `after.join("\n")`, which tolerates a `"\n"` embedded inside one array element. Add: every element of `render()` contains no `"\n"` (pi-tui's contract is one string per line, `tui.d.ts:69-74`) and every element's visible width ≤ width.
3. **R5 strings untouched.** Keep `lineText()` byte-exact (`:250-256`) and add a separate accessor; the existing tests `:272-282` and `:359-369` must pass **unmodified**. A diff that edits `lineText()` to return a two-line string fails this by construction.
4. **Naming is coupled to the predicate, not to `pendingError` presence.** Wiring test: `pendingError = {stopReason:"error", errorMessage:"Provider returned 502"}` → `decideSettleRetry` `"none"`, no naming line, no retry (mirrors `:325-327`); `pendingError = {stopReason:"error", errorMessage: PROVIDER_FINISH_REASON_ERROR}` → naming line present.
5. **Headless per-episode count.** A 3-attempt fake-policy run prints exactly two naming lines, each immediately preceding that episode's first countdown line; the final non-empty stdout line is still `formatRetryExhausted(maxAttempts)`; no naming line starts with `"Retrying in"` (else it corrupts the live-gate filter at `ev40-live-gates.test.ts:105`).
6. **The raw literal never reaches either surface.** Assert the rendered TUI line and the headless print do not equal and do not contain `PROVIDER_FINISH_REASON_ERROR`; assert the naming line is emitted iff the classified literal matched, so the line can never name a failure the loop did not actually retry.

#### Designer position (`job-9.3`) — verbatim

# Designer Position — FLLWUP-44, the transient failure line

## Design position

I draft the transient failure line as:

> **`Provider returned no response (finish_reason: error).`**

It renders as a second line in the `RetryEditor` editor region, **above** the R5 countdown line in the TUI branch and **immediately before** the first `runHeadlessCountdown` print in the headless branch (`extensions/index.ts:435-460`). It is shown **once per parent-turn failure cycle** — at the first `beginBackoff` for that cycle (attempt 2), persisted across countdown ticks, cleared when the surface leaves `backoff`, and **not re-shown at attempt 3's `beginBackoff`** even though `beginBackoff` runs again. The literal `Provider finish_reason: error` (the council-widened parent-loop predicate, `extensions/retry.ts:54, 103`) is **always** the failure being named — by construction `classifyParentTurnRetry` only retries that exact literal — so a single copy with the technical label is honest for every retried failure.

## Gulf closed

**Evaluation, for the person at the moment the failure is first detectable.** The current EV-40 surface jumps from "provider errored" (a state with no on-screen signifier — `agent_settled` is a no-payload event) directly to the countdown line. A person staring at a tick-down countdown with no signal of *what* is being retried forms either no model ("why is this happening?") or a wrong one ("did my prompt fail to parse?"). The transient line is the signifier the system owes them at that moment; the countdown already answers "how long", this answers "what". The Gulf of Execution is unaffected — `Esc` and Enter behavior are unchanged.

## Principle and evidence

**Signifier + mapping** applied to the artifact:

- `extensions/parent-retry.ts:250-256` — `RetryController.lineText()` is the single source for the backoff-line text. It returns `""` while idle, the R5 countdown during `backoff`, and the R5 exhaustion copy during `exhausted`. A `failureLineText()` getter alongside it, gated on a `failureShown` flag set by the first `beginBackoff`, is the natural seam.
- `extensions/parent-retry.ts:296-307` — `RetryEditor.render(width)` appends exactly one extra editor-region line. To render two (failure above, countdown below) it must push two styled lines from `super.render(width)` output; the line that already exists is unchanged in copy, just no longer alone. The internal ordering — failure first, countdown second — is the mapping argument: the eye reads cause then consequence.
- `extensions/index.ts:435-460` — `runHeadlessCountdown` prints the countdown at t=0 and re-prints once per whole second. The failure line is *not* a countdown re-print; it belongs *before* the first print, in `onSettled` itself, after `controller.beginBackoff(...)` and before `runHeadlessCountdown`. The existing O-ROUTE `fs.writeSync(1, …)` (`extensions/index.ts:584-587`) is the right print mechanism — print mode's stdout hijack means anything routed through `host.print` lands on stderr (verified by the owner-probed three-path probe referenced in the EV-40 card).
- **Naming — both human and literal:** the line embeds the literal's `finish_reason: error` substring in parens, matching the transcript-side string enough to be greppable. The "raw literal vs human phrasing" question is not either/or — Norman: *knowledge in the world beats knowledge in the head*. The person does not need to remember what `finish_reason` means; the human phrasing tells them, and the parens give a developer (or anyone curious enough to grep `.pi/council/runs/`) a hook into the transcript.

## Falsifiable predictions

1. **P1 (hypothesis):** At `t = 0` of the first `beginBackoff` for a parent provider error, the editor-region rendered output contains **two** appended lines — the failure line first, the countdown line second — at the same width-clamp. **Smoke:** the EV-41 falsifier (or a sibling that triggers the parent-only error literal), capture the `RetryEditor.render(width)` output at the first tick after `c.beginBackoff(2, delayMs)`; assert the array has length `superLen + 2` and that index `-2` is the failure line, index `-1` is the countdown.
2. **P2 (hypothesis):** At `t = 1s, 2s, …` during the same backoff, the failure line is still present (it does not clear across countdown ticks) and unchanged. **Smoke:** capture frames at successive ticks; assert failure-line string byte-identical across them.
3. **P3 (hypothesis):** When the `setTimeout` fires and the surface transitions to `idle` (continuation's `sendUserMessage` is dispatched), the failure line disappears alongside the countdown. **Smoke:** capture frame immediately after the tick fires; assert only `super.render(width)` (no append).
4. **P4 (hypothesis, the once-per-cycle semantic):** When attempt-2's continuation fails again and `beginBackoff(3, …)` is called, the failure line does **not** re-appear — the literal is the same and a re-flash would distract. **Smoke:** two-attempt injected failure; capture frame at attempt-3's first tick; assert countdown is present, failure line is not.
5. **P5 (hypothesis, the once-per-cycle scope edge):** If the user aborts via `Esc`, the exhaustion terminal copy replaces the entire editor region — failure line is gone. **Smoke:** Esc during backoff; capture at exhaustion; assert exactly one appended line, the R5 terminal copy.
6. **P6 (hypothesis, successful-continuation edge):** On a successful retry, `clearToIdle()` removes both lines. **Smoke:** parent error → retry succeeds → capture; assert zero appended lines.
7. **P7 (hypothesis, headless parity):** In `-p` mode, the first line of stdout for a parent error is the failure line; the next non-empty line is the t=0 countdown. **Smoke:** run with injected parent error in headless; assert stdout line ordering. (Re-assert on attempt-3 beginBackoff: failure line is **not** re-printed, only the countdown.)
8. **P8 (hypothesis, pure):** `formatRetryFailure(errorMessage)` returns `Provider returned no response (finish_reason: error).` for the input `Provider finish_reason: error`. **Test:** unit test on the pure formatter; byte-identical to the drafted string. Defends against accidental copy edits in review.

The smoke that falsifies P4 specifically is the one I'd put in front of the owner first — the "does it flash on attempt 3?" question is the design choice that fails loudest if implemented as "re-show every beginBackoff".

## Preferences, ranked last

- **Register of the human phrasing.** I chose "returned no response" over "errored" / "rejected" / "failed" because the truth is the provider returned *no model output* (the OpenAI completion-stop value `error` is exactly that — pi's mapStopReason default branch, `extensions/retry.ts:51-55`). "errored" alone is vague; "rejected" implies an upstream policy; "failed" is what the terminal copy already uses for the after-the-fact summary. "Returned no response" is precise. Taste; product-owner rules.
- **Article.** "The provider" vs "Provider" — the terminal copy uses "The provider kept failing"; matching that would mean "The provider returned no response…". I dropped the article for compactness in the editor region. Taste; product-owner rules.
- **Separator.** I put the technical label in parens, not behind an em-dash. The countdown already uses `— Esc to abort` and a failure line with a second em-dash would crowd the editor region with the same glyph. Parens visually subordinate the technical anchor to the human phrasing — correct, because the human phrasing is what the user reads first.
- **No glyph / leading icon.** The current R5 lines are plain text; adding `⚠` or similar would be a register break. The Pi theme's color tokens could give the failure line a muted color; I lean against that — it would compete with the countdown's visual weight, and the failure line is *less* actionable than the countdown (the countdown says `Esc to abort`; the failure line is informational). Color/signifier differentiation should favor the actionable line, not the informational one.

I do not write any source. This position is a draft only; the final string is ruled by `product-owner` per R3, and I expect them to edit at least the article choice.

### Step 3 — bounded exchange (round 2)

Round 2: each generator re-dispatched with the others' round-1 positions (read
from this card), asked to respond to what the others actually said. Jobs:
`owner` `job-9.4` (4.3m, 6 turns), `principal` `job-9.5` (4.3m, 12 turns),
`designer` `job-9.6` (4.3m, 26 turns). All settled `done`. Positions
stabilised on the carrier (second editor-region line above the countdown +
one headless print per backoff episode; notify/chat-append rejected) and on
the human copy register (no raw literal on the surface). Two items remain
open: the re-show semantics (owner+principal per-episode vs designer
once-per-cycle) and the exact lexical string. No round 3 is run: the
remaining copy difference is a product-owner lexical ruling and further
generator rounds would re-litigate, not settle.

#### Owner round 2 (`job-9.4`) — verbatim

All first-hand checks are done. Round-2 position:

## Approach

I verified every load-bearing claim both seats made against the tree before answering, and the record is: principal's facts are all correct; designer's facts are correct except one — the headless print mechanism — which is refuted first-hand. On re-show semantics I hold per-episode and can now show designer's once-per-cycle is unimplementable without an arbitrary reset rule. On the carrier I agree with principal's principle but the precondition is already discharged — his blind-spot attribution to me is refuted by my own round-1 text.

**1. Re-show semantics — per-episode; designer's P4 cannot be implemented without a rule it never states.** Designer's once-per-cycle requires a `failureShown` latch, and a latch needs a reset point. Enumerate the candidates: (a) *never reset* — a successful retry followed, minutes later, by a second unrelated parent error in the same session shows **no failure line at attempt 2's backoff**; the exact gulf designer closed ("a person staring at a countdown with no signal of what") reopens; (b) *reset at `clearToIdle`* — but `clearToIdle` fires in the send timer immediately before every continuation send (index.ts:502-504), so it resets before attempt 3, directly contradicting P4; (c) *reset on a newly classified failure* — which is precisely `beginBackoff` per episode, i.e. my semantics with extra state. There is no fourth option. Worse, designer's own gulf argument defeats P4: attempt 3's backoff is the same "staring at a countdown" moment as attempt 2's; if the signifier is owed once it is owed at every episode. And the distraction rationale fails on the actual mechanism: `render()` is a pure function of controller state (verified — parent-retry.ts:401-408), so the line is *continuously present during backoff*, absent during idle between episodes; nothing flashes. If re-showing the failure line distracts, so does re-showing the countdown — which R5 binds and the live gate pins for both attempts (`test/ev40-live-gates.test.ts:110-111` asserts countdowns for attempt 2 **and** attempt 3). Finally, the goal's word "once" reads most naturally as "one line, distinct from the countdown" (not per-tick) — which per-episode satisfies. A test cannot settle which semantic the human wants; both P4 and my per-attempt test pin a choice, they don't prove one. This goes to the copy ruling with both semantics stated and my recommendation: **per-episode**. Honest concession: my round-1 "no new controller state is needed" was conditional on my own semantics — under designer's semantics new state *is* required, and that uncosted latch is itself an argument against it.

**2. Carrier precondition — agree with the principle; it is already discharged.** Principal's blind-spot claim that I "would reach for `ui.notify`" is refuted by my round-1 position verbatim: I specified a second pushed line in `RetryEditor.render` and a `host.print` per attempt, and never mentioned notify. His underlying warning about notify is nonetheless verified correct first-hand: `showWarning` renders `Warning: ${warningMessage}` as permanent chat-append (`interactive-mode.js` `showWarning`), `showStatus` de-dups back-to-back identical messages into an update — no fading toast exists. But the carrier+prefix risk exists **only for the notify/chat carriers, which all three seats now reject**. On the agreed carrier the rendered string is the ruled string: `RetryEditor.render` pushes the text verbatim (only `borderColor` colors it; visible glyphs unchanged) and headless is `host.print` → `fs.writeSync(1, …)` (verified at index.ts:610-616). So: yes, the escalation to product-owner must state the carrier explicitly so copy is ruled against the full rendered form — but there is no sequencing deadlock, because the carrier is settled in this deliberation, now. R3's "draft then rule" ordering survives intact.

**3. Headless mechanism — settled by reading the code, designer is wrong.** Designer's claim that `host.print` "lands on stderr (verified by the owner-probed three-path probe)" misreads the O-ROUTE finding: the probe established that *raw* `console.log`/`process.stdout.write` land on stderr under print mode's takeover, and **that is why `host.print` is defined as `fs.writeSync(1, …)`** in `registerParentTurnRetry`'s deps (index.ts:610-616). The countdown already prints to real stdout through `host.print` — the live gate proves it (`arm.stdout` contains the countdowns). Designer's proposed `fs.writeSync(1, …)` in `onSettled` would work but duplicates a mechanism that already exists; the failure line is one more `host.print`, placed inside `runHeadlessCountdown` before the t=0 countdown print (episode-grouped, matching the countdown's own home) or immediately before the await in `onSettled` — either satisfies the ordering invariants.

**4. Ordering invariants — verified, adopted as shared contract.** All four check out first-hand: `during[during.length-1]` contains "attempt 2 of 3" and the exhausted render asserts `lines[last] === formatRetryExhausted(3)` (test/ev40-parent-retry.test.ts) — so the naming line pushes *before* the countdown and never after the terminal copy; the live-gate filter `startsWith("Retrying in")` and the final-non-empty-stdout-line assertion (test/ev40-live-gates.test.ts:105, 113-114) give the two headless invariants — the naming line must **not** start with `Retrying in` (designer's draft doesn't) and must never be the last stdout line (it can't be; the terminal copy prints after any naming line). Exit 75 untouched. `EditorTheme` is indeed `{borderColor, selectList}` — no second token, so the two lines share styling; I accept that (designer's "no competing visual weight" preference is forced, which resolves her color question for free).

**5. Copy register — I withdraw one of my own round-1 tests.** My claim 2 asserted "a render test asserting the surface never contains `finish_reason`." That over-specified a copy preference into an engine invariant — the register question is PO's per R3, and the test was me prejudging it. Withdrawn. Designer's "both human and literal" argument is legitimate on the merits: the parens subordinate the jargon to a human-primary sentence, and the greppable anchor has real operational value — a user pasting the line in a bug report can be grepped into `runs/` transcripts, where `finish_reason: error` appears verbatim. I also concede her precision point: "returned no response" is more accurate than my "request failed" (the provider returned no model output). My updated recommendation to PO: **adopt designer's draft as the baseline**, with one open taste note she already flagged — I lean to restore the article ("The provider returned no response (finish_reason: error).") for register consistency with R5's terminal "The provider kept failing." The engine-level invariant I *do* keep, narrowing my round-1 claim: the rendered line is a static formatter output, never assembled from `pendingError.errorMessage`, and never byte-equal to the raw literal. Principal's claim-4 wiring test then holds structurally: with a static formatter gated on `surface === "backoff"`, the line exists exactly when a classified retry armed a backoff — no injection parameter needed while the classifier is a single constant (his deps-injection proposal is the right *contingency* if the classifier ever widens; the comment-at-the-formatter seam I proposed in round 1 covers that).

## Tradeoffs accepted

- Per-episode means headless scrollback shows the same sentence twice on a 3-attempt run (2 naming lines, 3 failures — principal's arithmetic is right and neither semantics names every failure; the third is named only by R5's terminal copy). Accepted: log grouping per episode beats sentence-count parsimony.
- Endorsing designer's draft means my own round-1 sample copy is dead; fine — hers is more precise and I've withdrawn the test that would have blocked it.
- Accepting shared styling for both lines (no second token) means the failure line reads as part of the countdown block, differentiated only by order and content. Accepted — differentiation by position is the mapping argument anyway.
- The re-show semantic stays formally open until the copy ruling; if PO rules once-per-cycle, the reset-rule gap must be answered in the same ruling, or the latch ships with undefined behavior.

## Testable claims

1. **(Refuted claim, now settled) `host.print` reaches real stdout** — already proven by the green live gate (`arm.stdout` contains countdowns); designer's stderr assertion fails against index.ts:610-616. No new test needed; cite the existing green `ev40-live-gates` p4-live assertions.
2. **(Shared, both seats' versions merged) Render contract:** in backoff, `render(80)` returns `superLen + 2` lines, index `-2` is the failure line, `-1` is the countdown; every element contains no `\n`; every element's visible width ≤ width; on `exhausted`, `lines.at(-1) === formatRetryExhausted(3)` and no failure line; on `idle`, no appended lines. The no-`\n` clause is principal's catch that the existing `join("\n")` assertion cannot make.
3. **(Per-episode pin, my side of the open semantic)** `beginBackoff(2, …)` then `beginBackoff(3, …)` → failure line present at both. **(Designer's P4 is the same test with the opposite assertion.)** Whichever the ruling picks, exactly one of these goes in the suite; the other is recorded as the rejected semantic in the escalation, not as a skipped test.
4. **(Latch exhaustiveness — settles the re-show argument, not by render but by state)** A test-class enumerating reset points: for each candidate (never / `clearToIdle` / new classified failure), assert the observable consequence; `clearToIdle`-reset fails P4 by construction (fires before attempt 3's send, index.ts:502-504), never-reset fails the second-unrelated-error case, new-failure-reset is per-episode. Runnable as three assertions against any once-per-cycle implementation offered.
5. **(Headless parity, amended from designer's P7 with the verified mechanism)** A 3-attempt fake-policy live-style run: per episode, one failure line immediately before that episode's first countdown line; failure lines do not start with `Retrying in`; final non-empty stdout line is `formatRetryExhausted(3)`; exit 75. Under per-episode: exactly two failure lines.
6. **(Narrowed register invariant, replacing my withdrawn claim 2)** Rendered line and headless print are not byte-equal to and not assembled from `PROVIDER_FINISH_REASON_ERROR`; the line is emitted iff `classifyParentTurnRetry` returned retry; `pendingError = {errorMessage: "Provider returned 502"}` produces no line and no retry (principal's claim 4, adopted verbatim).
7. **(R5 guards, unchanged)** `lineText()` byte-exact and untouched; existing tests at ev40-parent-retry.test.ts:272-282/359-369 and the live-gate countdown/terminal/exit assertions pass **unmodified** — their green is the R5 compliance proof.

#### Principal round 2 (`job-9.5`) — verbatim

## Cross-seam reading — what the contract actually is

Grounding read first-hand: `extensions/parent-retry.ts` (`lineText`, `beginBackoff`, `clearToIdle`, `RetryEditor.render`), `extensions/retry.ts:103-135`, `extensions/index.ts:296-330` (`ParentRetryHost`/`ParentRetryCtx`), `:435-483` (`runHeadlessCountdown`, `onSettled` exhaust/schedule branches), `:603-616` (the real injected host), `test/ev40-parent-retry.test.ts`, `test/ev40-wiring.test.ts`, `test/ev40-live-gates.test.ts`, `test/retry.test.ts:142-186`; wiki [[retry-classification]] and [[parent-turn-continuation]].

Contract as it stands:

1. **There is no `host.print` API in play.** The countdown is emitted by the *injected* `ParentRetryHost.print` (`index.ts:296-300`, called at `:440,:454,:479`), and the real wiring passes `print: (line) => fs.writeSync(1, \`${line}\n\`)` (`index.ts:613-616`). So "route through the injected `print`" **is** the O-ROUTE raw fd-1 write — the two are the same call. This makes designer's claim ("anything routed through `host.print` lands on stderr; use `fs.writeSync` directly in `onSettled`") a conflation of the injected host with pi's extension-context print. Routing through the injected `print` is both correct *and* the only observable path: `test/ev40-wiring.test.ts:92` records into `state.printed`, and a raw `fs.writeSync` in `onSettled` would make the naming line invisible to that seam.
2. **Placement is forced by existing gates, not taste.** `test/ev40-live-gates.test.ts:105-116`: countdown lines are byte-exact by `toContain`, and the terminal copy must be the **last non-empty stdout line**. `test/ev40-parent-retry.test.ts` render tests require the countdown at `.at(-1)` and the terminal copy at `.at(-1)`. Naming goes strictly between `super.render(width)` output and the countdown push, and never after the terminal copy. Owner and designer both chose this; unanimous.
3. **The rendering is state-derived, and `clearToIdle()` runs between episodes.** `clearToIdle()` is called in the send timer immediately before `pi.sendUserMessage(prompt)` (`index.ts` onSettled TUI branch, card-cited `:502-504`). Consequence: attempt 2's editor-region line does not survive into the continuation turn, so **nothing of attempt 2's naming is on screen when attempt 3's backoff begins**.
4. **The named failure is one constant.** `decideSettleRetry` gates on `classifyParentTurnRetry` (`parent-retry.ts:143-146`), which returns `"retry"` only for `text === PROVIDER_FINISH_REASON_ERROR` and explicitly returns `undefined` for anything matching pi's retryable pattern (`retry.ts:120-125`). The parent loop has no second possible failure. (The *hub* loop uses the wider `classifyRetry` at `retry.ts:103-113` — designer's "council-widened parent-loop predicate" wording cites the wrong function; the parent predicate is deliberately narrower.)
5. **The vendor template is already re-declared and drift-pinned once**, `retry.ts:78` against the bundle's `errorMessage:\`Provider finish_reason: ${reason}\`` (`test/retry.test.ts:164-185`).

## Blind spots

- **Owner (code vantage, from the settle closure).** Sees `lineText()` as the one place text is produced and "backoff == failure happened" as the whole state question, so it cannot see that the *count* of naming lines differs from the *count* of failures (3 failures, 2 backoffs on a budget-3 run) and that the third failure is named only by R5's terminal copy. It also files placement/lifetime as "copy-level … lands with designer/PO per R3" — a misfiling: R3 gives PO the **string**, not the lifetime.
- **Designer (surface/conceptual vantage).** Reasons about the line as a persistent object the user "remembers" across the cycle, and therefore cannot see that the carrier they chose (editor region) is *erased* at `clearToIdle()` between episodes — "shown once, remembered" is unobservable on that carrier. That is not a preference gap; it is a mechanism contradiction internal to the designer's own position.
- **Copy vantage (PO).** Rules bytes without seeing that the rendered string's only carrier-induced mutation left after the unanimous carrier choice is `truncateToWidth` at narrow widths, plus the fg token — no prefix, no ANSI, plain text. So the per-episode question is being routed to a seat that owns neither its state machine nor its tests.
- **Headless/log consumer.** Cannot see the TUI's "transient"; every print is permanent scrollback, so "once per episode" there means twice with no grouping, while the TUI means twice with a blank interval between.

## Wrong, first-hand

1. **My round-1 test #6 was too weak.** I proposed asserting the rendered line does not *contain* `PROVIDER_FINISH_REASON_ERROR`. Designer's draft does not contain the full literal (it contains the substring `finish_reason: error`), so **my test would have passed designer's draft** — it did not test what I claimed. Corrected rule and predicate below.
2. **My "must not start with `Retrying in`"** was overstated as a gate-enforced invariant. `ev40-live-gates.test.ts:105-109` uses `startsWith` only to build the filter and then `toContain` for presence — a naming line starting with `Retrying in` would not fail any current assertion. It stays a hygiene rule for the filter's meaning, not a gate.
3. **Owner's claim 1 is true of assertions, false of the tree.** `ev40-parent-retry.test.ts` render test asserts `>= 1` and `.at(-1)`, so no assertion pins one-line — but the **test title literally reads "appends exactly one extra line"**. The implementer must retitle it, or the suite ships a named invariant it no longer asserts.
4. **Owner's claim 2 is correct and (usefully) argues against designer:** the backoff surface *is* the failure state; no new controller state is required. Designer's `failureShown` latch is exactly that new state, and its reset sites are not local (`clearToIdle()` serves both fresh-run reset and continuation exit; `enterOnExhausted` resets `_attempt = 1`).
5. **Designer's line reference** `index.ts:584-587` for the O-ROUTE write is wrong on this tree; the real print wiring is `:603-616`. Behaviour, not substance.

## Reframe

- **Carrier reframe: materially closed.** Both seats chose the second editor-region line, which is the carrier I recommended. Residual, not a redesign: the ruling note must state the carrier facts that can still mutate the string — plain text, one line, no prefix, `truncateToWidth(width)` clamp, rendered above the countdown — so "the shown string" is defined at ruling time.
- **Re-show reframe (new): the question is misfiled.** "per episode" vs "once per cycle" is engine contract, not copy. R3 assigns PO the *string*; who shows it, when, and for how long is the state machine this card is about. And on the elected carrier, designer's P4 does not mean "it doesn't flash again" — it means **attempt 3's backoff is a bare countdown**, exactly the pre-card state EV-40's own designer called out ("a person staring at a tick-down countdown with no signal of what is being retried", `council/cards/EV-40.md` step-2 designer position). Designer's gulf argument, applied to designer's own P4, reconstructs the defect at attempt 3. Designer's greppability argument points the same way: the anchor should sit next to each episode, not only the first.
- **Copy: keep designer's human clause, drop the parenthetical.** The greppable anchor's job is already done elsewhere — the errored assistant turn carrying the with-colon literal is stored in the session JSONL and the live gate parses it (`ev40-live-gates.test.ts:~125`). The parenthetical buys nothing a grep of the transcript doesn't already find, and costs a *second, drift-uncovered spelling* of a vendor-derived token: hardcoded, it escapes `test/retry.test.ts`'s bundle-derived equality check; derived from `errorMessage`, it is literally the raw literal's tail on a user surface. `finish_reason` is also meaningless to the person the line exists for. That leaves `Provider returned no response.` (designer's clause, minus the parens) vs owner's static string — PO's bytes to rule. My engine-level holds only: no `/finish_reason/`, no prefix, one line, above the countdown, never on `exhausted`.
- **No further reframe.** The design is small and sound; the risk is seam-detail regression, not ambiguity.

## Testable claims (runnable)

1. **Corrected literal rule** — rejects designer's draft, which my round-1 test did not:
   `expect(namingLine).not.toMatch(/finish_reason/)` and `.not.toContain(PROVIDER_FINISH_REASON_ERROR)`. (Designer's P8 formatter output fails the first; a raw-literal design fails the second.)
2. **Re-show, per episode (my/owner's standing disagreement with designer's P4):** in `ev40-parent-retry.test.ts`, `beginBackoff(2,…)` → `clearToIdle()` → `beginBackoff(3,…)`; `expect(namingLines(editor.render(80))).toHaveLength(1)`. Designer's P4 asserts `0`; the two tests are mutually exclusive, so this is settleable mechanically once the *ruling* picks the semantics — the ruling is engine-level (see Reframe), not PO copy.
3. **The carrier cannot express "once, remembered"** — makes the contradiction executable: after `beginBackoff(2,…)` then `clearToIdle()`, `expect(editor.render(80).length).toBe(superLen)` (no line at all during the continuation). Any "shown once per cycle" semantics is indistinguishable from "absent at attempt 3" on this carrier.
4. **Carrier/injection (refutes designer's `fs.writeSync` prescription):** headless 3-attempt run through `registerParentTurnRetry` with `makeHost` (`ev40-wiring.test.ts:88-99`); `expect(state.printed.filter(isNaming)).toHaveLength(2)`. Routing through `ParentRetryHost.print` passes; a raw `fs.writeSync` in `onSettled` leaves `state.printed` empty and fails.
5. **Ordering invariants:** each naming line is immediately followed by that episode's countdown line; `expect(state.printed.at(-1)).toBe(formatRetryExhausted(3))`; and on the live gate the last non-empty stdout line stays the terminal copy (`ev40-live-gates.test.ts:114-116` unmodified).
6. **Exhaustive-surface gating (gap in my round-1 claim 1):** existing tests only pin `lines.at(-1)`, which a naming line pushed *above* the terminal copy would still satisfy. Add `controller.moveToExhausted(); expect(editor.render(120).length).toBe(superLen + 1)`, and on the live path `expect(state.printed.filter(isNaming)).toHaveLength(2)` against 3 failures — i.e. the third failure is named only by R5's terminal copy, asserted rather than assumed.
7. **Copy equals rendered string:** `expect(renderedLine).toBe(RULED_STRING)` at a wide width; at a narrow width assert the rendered line is the clamp of the ruled string, not equality — `truncateToWidth` is the one surviving carrier mutation and the ruling must name it.
8. **Unverified first-hand, flagged for the skeptic:** I could not extract from the minified `dist/bundle/chunks/openai-completions-EKZT2IH2.js` whether an `error`-stop assistant message retains already-streamed `content`. If it does, "Provider returned no response" asserts a data property (empty content) the naming line's source (`errorMessage`) never checks, and the line can contradict the transcript directly above it. Settling test: arm the EV-41 falsifier with a provider error after partial text and assert whether the errored assistant message's `content` is non-empty; if non-empty, the human clause must not claim emptiness.

#### Designer round 2 (`job-9.6`) — verbatim

# Designer position — FLLWUP-44, round 2

## Design position

I revise my draft on **two** points and confirm on three. **(1) Drop the parens.** My round-1 string `Provider returned no response (finish_reason: error).` put pi-internal OpenAI-API vocabulary on the user surface — `finish_reason` is a completion-API field name a reader cannot decode without a model card. The grep-anchor argument is already served by the errored assistant message persisting in the JSONL with `errorMessage === "Provider finish_reason: error"` (per `2026-09-17-po-ev40-ruling.md` Q2.Axis2). New draft: **`The provider returned an error.`** — accurate (the provider did return, with `finish_reason: "error"`, which is exactly what `mapStopReason`'s default branch emits per the bundle snapshot), jargon-free, R5-register consistent (`The provider kept failing.`). **(2) Accept carrier-first sequencing.** Principal is right that the ruled string is `carrier(line) + prefix`; ruling copy first then picking a carrier lets the carrier mutate the ruled string. The carrier must be pinned first: a second editor-region line in the TUI and one `host.print` per parent-failure episode in headless — both reject notify (`"warning"` prefixes `Warning: `; `"info"` de-dups consecutive-identical and persists to chat) and reject chat-append (permanent, not transient). I confirm on **(3) once-per-cycle re-show semantics**, **(4) every ordering invariant principal named**, and **(5) the principal-stated predicate-coupling claim**.

## Gulf closed

**Evaluation, for the person at the first failure.** At attempt 2's first `beginBackoff`, the person who was just staring at a tick-down countdown with no signal of *what* is being retried is now told what failed and given the countdown's "what happens next." The Gulf of Execution is unaffected — `Esc`, Enter, and headless SIGINT semantics are unchanged. The Gulf of Evaluation is closed at the moment the backoff surface first appears, and only at that moment; attempt 3's surface is already legible because the user saw the failure named once and is now watching the system retry.

## Principle and evidence

**Signifier (where the line lives) + knowledge in the world (where the literal lives).** The signifier is `formatRetryFailure()` returning the drafted string, gated by a `failureShown` flag in `RetryController` that the render path reads — applied to `extensions/parent-retry.ts:401-408` (push the failure line *before* the countdown push, never inside `lineText()`, so R5's byte-exact test at `test/ev40-parent-retry.test.ts:272-282` stays unmodified-green) and `extensions/index.ts:435-460` (one `host.print` via `fs.writeSync(1, …)` immediately before the first `formatRetryCountdown` print of the cycle, never inside `runHeadlessCountdown`'s per-second tick — `runHeadlessCountdown` is t=0 + per-second re-print only). The literal stays in `extensions/retry.ts:78` (`PROVIDER_FINISH_REASON_ERROR = "Provider finish_reason: error"`) and in the persisted JSONL; the surface does not name it. *Knowledge in the world beats knowledge in the head* applies to the JSONL — that's where the person (or their grep tool) finds the literal. On the surface, the user gets human register: `The provider returned an error.` carries the same information in the language R5 already uses.

**Carrier-first, copy-second.** R3 orders `designer drafts → PO rules the copy`, but the ruled string only equals the rendered string after the carrier is fixed. Pin the carrier against the goal text first: "transient" rules out `ui.notify` (chat-append, prefix-mutating) and rules out chat-append directly (permanent). That leaves the second editor-region line + one `host.print` per cycle, which is the only carrier where `formatRetryFailure()` *is* the rendered string. The carrier and only the carrier is what `EditorTheme` styles: I verified `EditorTheme = {borderColor, selectList}` at `node_modules/@earendil-works/pi-tui/dist/components/editor.d.ts:25-28`, confirming principal's claim that no second style token is available to make a second line visually distinct — the visual distinction has to come from ordering and content, not color.

## Where I was wrong (round 1)

1. **The parens.** I argued "both human and literal (greppable anchor)" using `Norman: knowledge in the world beats knowledge in the head`. I applied the principle to the wrong artifact: the user-facing surface. The knowledge-in-the-world argument is satisfied by the JSONL transcript (which already contains `Provider finish_reason: error` per Q2.Axis2's binding transcript invariant), not by the surface. The parens are vendor jargon, and the substring `finish_reason: error` IS half the literal that principal rightly says must not reach the surface in raw form. **Dropped.**

2. **The sequencing.** I implicitly assumed the carrier was already fixed (a second editor-region line). I did not argue the carrier-first precondition explicitly. Principal's "carrier is a precondition of the copy ruling" is correct because `ui.notify("warning")` would prefix `Warning: ` and `ui.notify("info")` would de-dup attempt-3 — both mutate the ruled string or contradict "transient." **Endorsed.**

3. **The `EditorTheme` shape.** I did not verify it first-hand. I have now: `node_modules/@earendil-works/pi-tui/dist/components/editor.d.ts:25-28` confirms `borderColor` and `selectList` only — there is no second visual token. The visual distinction between the failure line and the countdown has to come from ordering (failure first, then countdown) and from the failure line's content being informational-only (no `Esc to abort`), not from color. **Confirmed principal's claim.**

## Standing disagreements and their settling tests

### Re-show semantics — once-per-cycle (mine) vs once-per-episode (owner + principal)

The goal says "the backoff surface may name the provider failure once." `once` has two honest readings: once per cycle, or once per episode. I argue **once per cycle** because:

- The minimum-reading of "once" is once total. The maximum-reading requires the goal to have said "per attempt" or "per episode."
- The named failure is information-free on the second showing: by `retry.ts:110-121`, `classifyParentTurnRetry` returns `"retry"` only for the exact literal — attempt 2 and attempt 3 retried the same class of failure. A second showing repeats the same signifier with no new information.
- Principal's own observation: in headless, attempt 3's per-episode re-show means "a CI reader sees the same sentence twice with no visual grouping, and it is in the scrollback permanently." The terminal copy already names the 3rd failure (`Retries exhausted after 3 attempts. The provider kept failing.`) — so per-episode re-show creates a 2-sentence stack naming the same thing twice.
- The terminal copy's existence proves the surface is *designed to* name the final failure separately. A second transient naming line for attempt 3 is redundant with the terminal copy's "kept failing."

**Settling test (test-settleable; PO rules intent):**

- T-RR1 (3-attempt run): exactly **one** failure line appears in the TUI's `render(80)` output across the full backoff sequence; the second `beginBackoff(3, …)` does NOT push a second failure line. `expect(controller.failureLineText()).toBe("")` after the second `beginBackoff`.
- T-RR2 (3-attempt headless run): `arm.stdout.split("\n").filter(l => l.startsWith("The provider returned an error"))` has length **1**; the same filter for `formatRetryCountdown` keeps length 2; the last non-empty stdout line is still `formatRetryExhausted(3)`.

This is a copy/design ruling PO makes; the test pins whichever ruling lands. I argue for once-per-cycle as the smaller change and the minimum-reading interpretation.

### Carrier precondition — principal correct, agreed

The carrier is pinned first (editor-region second line TUI + one `host.print` per cycle headless), then the copy is ruled against `formatRetryFailure() = "The provider returned an error."`. The rendered string equals the ruled string by construction. **Test:** the test that asserts the rendered TUI line is byte-equal to `borderColor("The provider returned an error.")` (modulo `truncateToWidth`) is the carrier-and-copy contract.

### Copy register — parens dropped, raw literal rejected

**Final string for PO: `The provider returned an error.`**

- Accurate: the provider did return, with `finish_reason: "error"` — the exact thing `mapStopReason` emits per the snapshot at `test/retry.test.ts:155-180`.
- Jargon-free: no `finish_reason`, no API vocabulary.
- R5-register consistent: matches the article and subject of `Retries exhausted after 3 attempts. The provider kept failing.`
- Live-gate safe: does not start with `"Retrying in"` (so `test/ev40-live-gates.test.ts:105` filter still catches exactly the two countdown lines), does not start with anything that breaks `:113-114`'s terminal-as-last assertion, and `formatRetryFailure()` is a pure formatter so a unit test on the byte-output closes the regression.

**Fallback variant** (if PO wants a slightly more compact register matching R5's verb): `Provider error.` — same accuracy, drops the article and the "returned" verb. Taste; PO rules. The literal in `retry.ts:78` stays as the source of truth; the JSONL persists the errored message verbatim; the surface speaks human.

### Headless parity and ordering invariants — all four confirmed

1. **Naming line not final.** First `host.print` of the cycle, before any `formatRetryCountdown` print. The terminal copy remains last on stdout.
2. **Must not start with `"Retrying in"`.** Drafted string starts with `"The"`. Filter at `test/ev40-live-gates.test.ts:105` (`startsWith("Retrying in")`) is unaffected.
3. **Countdown stays last within each episode.** The render path pushes failure → countdown; `formatRetryCountdown` is still the array tail during `backoff`.
4. **Terminal copy final.** On `moveToExhausted`, the failure line is gone (the flag is reset), the countdown is gone, and only `formatRetryExhausted(maxAttempts)` is rendered — `test/ev40-parent-retry.test.ts:452-458` continues to pass unmodified.

All four are test-settleable; principal's tests 1, 3, 5, and 6 cover them.

## Claims of the other seats I now verify or refute first-hand

- **Owner P1** ("Nothing pins 'exactly one extra editor line' in a test"): **verified.** `test/ev40-parent-retry.test.ts:440-451` asserts `during[during.length-1].toContain("attempt 2 of 3")` — the *last* element, not the *length*. Adding a second extra line keeps the last element as the countdown and the test stays green. The "exactly one" is docs only. **Owner's claim stands.**

- **Owner P2** ("interpolating `pendingError.errorMessage` into the surface would buy a dynamic string where only one value can ever occur"): **verified.** By `extensions/retry.ts:110-121` (`classifyParentTurnRetry` returns `"retry"` *only* for exact match to `PROVIDER_FINISH_REASON_ERROR`), every retried settle has `errorMessage === "Provider finish_reason: error"`. Static copy is correct by construction. The honest seam owner flagged — "if the classifier ever widens, this static line must be revisited" — is the right discipline. **Owner's claim stands.**

- **Principal placement claim** ("second `lines.push` immediately before the countdown push" at `extensions/parent-retry.ts:401-408`): **verified by source read.** The current `render()` has exactly one `lines.push` at the end; adding a second before it satisfies `test/ev40-parent-retry.test.ts:440-451` (countdown still `lines.at(-1)`) and `test/ev40-parent-retry.test.ts:452-458` (terminal still `lines.at(-1)`). **Principal's claim stands.**

- **Principal claim 4** ("`pendingError = {stopReason:'error', errorMessage:'Provider returned 502'}` → `decideSettleRetry` `"none"`, no naming line"): **verified by source read.** `retry.ts:110-121`'s `RETRYABLE_PROVIDER_ERROR.test(text)` clause excludes pi-retryable messages (the `"502"` token is in the pattern list at `retry.ts:33`), returning `undefined` from `classifyParentTurnRetry`, which makes `decideSettleRetry` return `"none"` (`parent-retry.ts:144-146`). **Principal's claim stands.**

- **Principal claim 5** ("A 3-attempt fake-policy run prints exactly two naming lines"): **disputed.** I argue once-per-cycle → 1 naming line. Settling test T-RR2 above. **My disagreement, principal's framing is the per-episode reading.**

- **Principal claim 6** ("The raw literal never reaches either surface"): **verified for the full literal.** `formatRetryFailure()` does not contain `Provider finish_reason: error` and never will — the parens are dropped. The substring `finish_reason: error` does NOT reach the surface either (also dropped). **Principal's claim stands under my revised draft.**

- **Principal "must not start with 'Retrying in'"**: **verified.** Drafted string starts with `"The"`. Filter at `ev40-live-gates.test.ts:105` is a `startsWith("Retrying in")` filter, unaffected.

- **Owner recommendation "above the countdown"**: **endorsed.** Chronological read (what happened → what happens next), matches the render-ordering invariant at `parent-retry.ts:401-408`.

## Falsifiable predictions (round 2)

1. **P1** (hypothesis): in a 3-attempt run, exactly **one** TUI failure-line push across `beginBackoff(2)` and `beginBackoff(3)`. **Smoke:** unit test on `RetryController.failureLineText()` after the second `beginBackoff`; assert `""`. The same test on `failureLineText()` after the first `beginBackoff`; assert `"The provider returned an error."`.
2. **P2** (hypothesis): in headless 3-attempt run, stdout has exactly **one** line matching the failure-line prefix and exactly **two** lines matching `"Retrying in"`; last non-empty line is `formatRetryExhausted(3)`. **Smoke:** harness arm with the live-gate filter at `test/ev40-live-gates.test.ts:105`, asserting the count is 2 (unchanged) and a sibling filter `startsWith("The provider returned an error")` count is 1.
3. **P3** (hypothesis): `formatRetryFailure()` is byte-equal to `"The provider returned an error."` for any input; the substring `finish_reason: error` does not appear in any `formatRetryFailure()` output. **Test:** pure-formatter unit test.
4. **P4** (hypothesis): the rendered TUI line is `borderColor("The provider returned an error.")` (modulo `truncateToWidth`); no other styled value. **Test:** `editor.render(80)` after `beginBackoff` with a stub `borderColor`; assert `lines.at(-2)` is `borderColor("The provider returned an error.")`.
5. **P5** (hypothesis): `ui.notify` and chat-append are never the carrier. **Test:** static-grep test asserting no call to `ui.notify(` or `chat.append(` (or pi's equivalents) appears in the diff between the controller and the surface for the failure-line path.
6. **P6** (hypothesis): the existing tests at `test/ev40-parent-retry.test.ts:272-282, 359-369, 440-451, 452-458` pass **unmodified** — byte-exact R5 countdown + terminal + the "lines.at(-1) contains" assertions all green. **Test:** `bun test test/ev40-parent-retry.test.ts test/ev40-live-gates.test.ts` green before and after.
7. **P7** (hypothesis): the failure-line flag resets on `clearToIdle()` and `moveToExhausted()`, so a *new* parent failure cycle (a subsequent error after a successful continuation) re-shows the naming line — the once-per-cycle semantic is per *cycle*, not per *session*. **Smoke:** unit test on `RetryController`; `clearToIdle()` → `beginBackoff(2, …)` → `failureLineText()` returns the drafted string.

## Preferences, ranked last

- **Article.** I chose `The provider` over `Provider` for register consistency with R5's terminal copy (`The provider kept failing`). Compactness argues against; register consistency argues for. PO rules.
- **Verb.** I chose `returned an error` over `errored` (vague), `failed` (what R5 already uses for the summary), `rejected` (implies upstream policy), and `returned no response` (slightly inaccurate — the provider DID return, with `finish_reason: "error"`). `Returned an error` is the precise description. Taste.
- **Period.** Trailing period matches R5's terminal copy (`Press Enter to try again.`). Two sentences in the editor region during backoff both end with periods; visual consistency. Taste.
- **No glyph.** No `⚠` or icon; R5 lines are plain text. A glyph would be a register break with R5 and with the existing input-bar copy. Taste, but consistent with prior ruling.

I do not write any source; this is a draft only. The final string is ruled by product-owner per R3. I expect PO to edit at most the article.

### Step 4 — Skeptic attacks and runs tests (`job-9.7`, 4.8m, 20 turns, `done`)

Working tree clean; all probes under `/tmp`; no tracked source touched.

**Baseline gates (real runs, current tree):** `bunx tsc --noEmit` → clean exit 0;
`python3 council/validate.py` → `All council artifacts valid`; `bun test` (full)
→ **860 pass, 2 skip, 0 fail** across 76 files (94s; the 2 skips are the
pre-existing gated skips). Focused `bun test test/ev40-parent-retry.test.ts
test/ev40-wiring.test.ts test/retry.test.ts` → 50 pass, 0 fail.

#### Skeptic report — verbatim

**O1. Re-show semantics** — `closed-green` for owner/principal per-episode
implementability; **`closed-red`** for designer's once-per-cycle spec as
written. Evidence: `extensions/index.ts` send-timer callback is verbatim
`retryAttempt = …; expectContinuation = true; contextFilter.arm();
c.clearToIdle(); pi.sendUserMessage(prompt);` — `clearToIdle()` fires before
every continuation send (including attempt-2→3), so a latch reset there is
cleared before attempt 3's `beginBackoff` re-sets it → observable behavior is
per-episode, contradicting P4. Owner's trilemma (never-reset / clearToIdle-reset
/ new-failure-reset) is exhaustive against this code; no fourth call site.
Probe: after `beginBackoff(2,…)` render length 4, after `clearToIdle()` length
3 (== super length) — nothing survives into the continuation turn; "shown once,
remembered" is unobservable on this carrier. Second defect: the headless
schedule branch never touches the controller (`await runHeadlessCountdown(…);
retryAttempt = …; contextFilter.arm(); pi.sendUserMessage(prompt);` — no
`beginBackoff`, no `clearToIdle`), so a `failureShown` flag in `RetryController`
cannot govern headless; the headless once-per-cycle semantic needs a second,
unspecified flag. The re-show choice itself remains a ruling input; the
once-per-cycle option must name a reset point that survives the send-timer
`clearToIdle()` — none exists on this carrier.

**O2. Placement/ordering invariants** — `closed-green`, principal's corrections
confirmed. A naming line pushed above the countdown keeps
`during.at(-1)` containing "attempt 2 of 3" (owner P1 holds at assertion level);
a naming line pushed above the terminal copy **still satisfies**
`lines.at(-1) === formatRetryExhausted(3)` — principal's length-assertion gap is
real and load-bearing. The test is literally titled "appends exactly one extra
line while the surface is non-idle; none while idle" while asserting only
`>= 1` + `.at(-1)`; the implementer must retitle. Live gate `:105` builds the
filter with `startsWith("Retrying in")` then asserts presence with `toContain`,
and `:113-114` asserts the last non-empty stdout line is the terminal copy; a
naming line starting with `Retrying in` would pass every current assertion, so
that rule is hygiene, not a gate.

**O3. Copy claims** — `closed-red` against the round-1 string
`Provider returned no response (finish_reason: error).`; `open-untested` for the
round-2 string's residual accuracy. Evidence: the pending-error path preserves
the message object including its `content` array (`recordAssistantVerdict`
identity probe `{kept:true}`); the green P3 live gate asserts an errored
assistant entry with `errorMessage === INJECTED_ERROR_MESSAGE` **and**
`text.includes("EV40-PARTIAL")` persists in the JSONL. An `error`-stop turn
demonstrably carries streamed partial text, so "returned no response" can
contradict the transcript directly above it — the designer's withdrawal of the
round-1 draft was required, not optional. Round-2 `The provider returned an
error.`: the bundle template check (green) pins that pi *synthesizes*
`Provider finish_reason: error` in `mapStopReason`'s default branch for a
declined `finish_reason`; whether "The provider returned an error" misattributes
pi's synthesis to the provider is a lexical question no repo test settles →
`open-untested`; exact settling test named (extract `mapStopReason`'s
surrounding upstream context from the installed bundle chunk plus the provider
wire meaning of `finish_reason: "error"`). Principal's `not.toMatch(/finish_reason/)`
replacement rule is verified implementable (`closed-green` as a gate,
independent of the taste ruling).

**O4. Literal/predicate coupling** — `closed-green`. `classifyParentTurnRetry`
returns `"retry"` only for byte-equality with `PROVIDER_FINISH_REASON_ERROR`
and `undefined` for `"Provider returned 502"`, `"Provider returned 502:
upstream unavailable"`, `"The provider returned an error."`, `"Provider request
failed"`, `""`. Static formatter correct; interpolation would add a dynamic
string over a singleton domain. pi's `provider.?returned.?error` token matches
neither draft string.

**O5. Carrier** — `closed-green`. `EditorTheme` is exactly
`{borderColor, selectList}`; `showWarning` appends `Spacer` +
`Text("Warning: " + msg)` to the chat container, permanent, session-scoped;
`showStatus` de-dups back-to-back identical messages; no fading mechanism
exists. At narrow widths the rendered line is the clamp, not the ruled string
(`visibleWidth <= 10` while raw bytes differ) — the ruling must name the width
behavior (byte-equal at wide widths; clamped at narrow).

**O6. Further settled claims (all `closed-green`).** Owner's `host.print`
reaches real stdout via `fs.writeSync(1, …)` and the green P4 live gate; the
O-ROUTE wiring is at `registerParentTurnRetry`'s host block (~`:606-616`), not
designer's `:584-587`; `classifyRetry` is the wider hub predicate while the
parent loop's `classifyParentTurnRetry` is deliberately narrower (designer
conflated them); principal's admission that his round-1 test #6 would have
passed the round-1 draft is verified by inspection.

**Skeptic verdict: `blocks`** — one item, precisely scoped: the re-show
semantic is specified against a reset rule that contradicts the code (designer's
P7 resets at `clearToIdle()`, which fires before every continuation send; plus
the headless branch has no controller for the flag to live in). The card may
proceed only with (a) per-episode semantics, which the carrier implements with
zero new state, or (b) a once-per-cycle spec that names a reset point distinct
from the inter-episode `clearToIdle()` and a headless-side flag — neither exists
on this tree today. The word "once" in the goal is `open`: per-episode vs
per-cycle is engine contract with mutually exclusive pinning tests (owner test 3
vs designer T-RR1), not settleable by testing; the escalation must present both
with O1's mechanism finding.

### Step 5 — Synthesis (`job-9.8`, 1.0m, 4 turns, `done`)

#### Consolidator synthesis — verbatim

## Agreed design (every seat converged)

- **Carrier:** a second editor-region line in the `RetryEditor` TUI surface, pushed above the R5 countdown, plus one `host.print` per backoff episode in headless. `ui.notify` ("warning" prefixes `Warning: `, permanent chat-append; "info" de-dups consecutive-identical) and direct chat-append (permanent, not transient) are **rejected** as carriers by all three generators and the Skeptic.
- **Copy register:** human phrasing only — the raw literal `Provider finish_reason: error` never reaches either surface; no `finish_reason` substring; no API/vendor jargon. The named failure is a single constant (`classifyParentTurnRetry` retries only that exact literal), so a static formatter is correct by construction.
- **Rendering facts (carrier-confirmed, `closed-green` by O5/O6):** plain text; one line; no prefix; above the countdown; never on the `exhausted` surface; `EditorTheme` is exactly `{borderColor, selectList}` (no second visual token — differentiation is by order/content, not color); the rendered string equals the ruled string at wide widths and is the `truncateToWidth(width)` clamp at narrow widths (the one surviving carrier-induced mutation, which the ruling must name).
- **Placement/ordering invariants (`closed-green` by O2):** the failure line pushes strictly between `super.render(width)` output and the countdown push; countdown stays `lines.at(-1)` in backoff; terminal copy stays `lines.at(-1)` on `exhausted`; headless naming line is never the last non-empty stdout line and never starts with `Retrying in` (hygiene rule, not a gate).
- **R5 binding strings are immutable invariants no ruling may change:** countdown `Retrying in 2s (attempt 2 of 3) — Esc to abort`; exhaustion `Retries exhausted after 3 attempts. The provider kept failing. Press Enter to try again.` Existing R5-guard tests at `ev40-parent-retry.test.ts:272-282, 359-369, 440-451, 452-458` and the live-gate countdown/terminal/exit-75 assertions must pass **unmodified** — their green is the R5 compliance proof.
- **Headless mechanism (`closed-green` by O6):** the injected `ParentRetryHost.print` (wired to `fs.writeSync(1, …)` at `index.ts:~606-616`, not designer's cited `:584-587`) is the O-ROUTE write and the only observable path through `ev40-wiring.test.ts`'s `state.printed` seam; a raw `fs.writeSync` in `onSettled` would be invisible to that seam.
- **Literal/predicate coupling (`closed-green` by O4):** `classifyParentTurnRetry` returns `"retry"` only for byte-equality with `PROVIDER_FINISH_REASON_ERROR`; static formatter correct; interpolation over a singleton domain buys nothing. Note (O6): `classifyRetry` is the wider hub predicate; the parent loop's `classifyParentTurnRetry` is deliberately narrower (designer had conflated them — corrected).

## Settled disputes

- **Round-1 copy string `Provider returned no response (finish_reason: error).`** — `closed-red` by **O3**. The green P3 live gate asserts an errored assistant entry with `errorMessage === INJECTED_ERROR_MESSAGE` **and** `text.includes("EV40-PARTIAL")` persists in the JSONL: an `error`-stop turn demonstrably carries streamed partial text, so "returned no response" can contradict the transcript directly above it. The designer's withdrawal of the round-1 draft was required, not optional. The `not.toMatch(/finish_reason/)` / `.not.toContain(PROVIDER_FINISH_REASON_ERROR)` replacement rule is `closed-green` as an implementable gate (O3/O4), independent of the taste ruling.
- **`host.print` reaches real stdout** — `closed-green` by the existing green P4 live gate (`arm.stdout` contains countdowns) and O6; designer's stderr assertion was a conflation of the injected host with pi's extension-context print. Designer conceded in round 2.
- **Carrier is a precondition of the copy ruling** — principal's reframe, endorsed by designer and owner in round 2; now discharged because the carrier is settled in this deliberation (second editor-region line + one headless print per episode). No sequencing deadlock; R3's "draft then rule" ordering survives intact.
- **Parens / `finish_reason` substring on the surface** — dropped by designer in round 2; the grep-anchor job is already done by the errored assistant message persisted in the JSONL (per the Q2.Axis2 binding transcript invariant). Principal and owner concurred.
- **`ui.notify` and chat-append as carriers** — rejected unanimously; O5 confirmed the mechanism facts (`showWarning` = permanent `Warning: `-prefixed chat-append; `showStatus` de-dups; no fading mechanism exists).
- **Owner's withdrawn test (round-1 claim 2 "surface never contains `finish_reason`")** — owner retracted it as prejudging a copy preference into an engine invariant; the narrowed engine-level invariant kept is: rendered line is a static formatter output, never assembled from `pendingError.errorMessage`, never byte-equal to the raw literal.

## Open judgment — for `product-owner`, escalating to `steward`

These are disputes no test can settle; both sides carried forward at equal weight.

1. **The exact lexical copy string.** R3 assigns the final string to `product-owner`; this runner cannot dispatch `product-owner` and must escalate to the orchestrator. Candidate strings, each with a proponent and the Skeptic's relevance finding:
   - **Designer (round 2, primary):** `The provider returned an error.` — proponent: designer, endorsed as baseline by owner. Fallback variant: `Provider error.` Skeptic **O3: `open-untested`** — the green bundle-template check pins that pi *synthesizes* `Provider finish_reason: error` in `mapStopReason`'s default branch for a declined `finish_reason`; whether "The provider returned an error" misattributes pi's synthesis to the provider is a lexical question no repo test settles. Settling test named: extract `mapStopReason`'s surrounding upstream context from the installed bundle chunk plus the provider wire meaning of `finish_reason: "error"`.
   - **Principal:** `Provider returned no response.` (designer's human clause, minus the parens). Skeptic **O3: `closed-red` against "returned no response"** in the partial-token case — the green P3 live gate proves an `error`-stop turn can carry streamed partial text, so this clause can contradict the transcript directly above it. (This finding also kills the substring of designer's round-1 draft and any "no response" phrasing.)
   - **Owner (round 2, updated):** adopt designer's `The provider returned an error.` as baseline, with a leaning to restore the article (`The provider…`) for R5-register consistency; owner's own round-1 sample `Provider request failed — retrying.` is dead (owner conceded designer's "returned an error" / "returned no response" was more precise than "request failed").
   - **Verified engine-level gate the final string must satisfy (no ruling may relax):** the surface must **not** contain `finish_reason`; must **not** be byte-equal to the raw literal; must be a pure static formatter output; must not start with `Retrying in` (hygiene); must be byte-equal to the rendered line at wide widths and the `truncateToWidth` clamp at narrow widths (the ruling must name the width behavior).
2. **The re-show semantic — per backoff episode vs once per failure cycle.** This is engine contract with mutually exclusive pinning tests (owner test 3 vs designer T-RR1), not a copy question and not test-settleable as intent. R3 assigns PO the *string*; who shows it, when, and for how long is the state machine this card is about (principal's reframe).
   - **Per-episode (owner + principal):** the line shows at every `beginBackoff` (attempt 2 and attempt 3 each); the backoff surface *is* the failure state, so no new controller state is required. Designer's gulf argument, applied to designer's own P4, reconstructs the EV-40 defect at attempt 3 (principal). Headless scrollback shows the same sentence twice with per-episode grouping (principal's arithmetic: 2 naming lines, 3 failures; the third is named only by R5's terminal copy).
   - **Once-per-cycle (designer):** the minimum-reading of "once"; the named failure is information-free on a second showing (same class by construction); the terminal copy already names the final failure. Requires a `failureShown` latch with a reset point.
   - **Skeptic O1 mechanism finding (`closed-red` for once-per-cycle *as specified*):** the send-timer callback runs `c.clearToIdle()` before every continuation send (including attempt-2→3), so a latch reset at `clearToIdle()` is cleared before attempt 3's `beginBackoff` re-sets it → observable behavior is per-episode, contradicting P4. Owner's trilemma (never-reset / clearToIdle-reset / new-failure-reset) is exhaustive against this code; no fourth call site. A probe confirmed: after `beginBackoff(2,…)` render length 4, after `clearToIdle()` length 3 (== super length) — "shown once, remembered" is unobservable on this carrier. Second defect: the headless schedule branch never touches the controller (no `beginBackoff`, no `clearToIdle`), so a `failureShown` flag in `RetryController` cannot govern headless; the headless once-per-cycle semantic needs a second, unspecified flag. **Per-episode is implementable with zero new state; once-per-cycle on this carrier would need a reset point distinct from the inter-episode `clearToIdle()` plus a headless-side flag — neither exists on this tree today.**
   - The escalation must present both semantics with O1's mechanism finding; the ruling must either pick per-episode, or pick once-per-cycle *and* name a reset point that survives the send-timer `clearToIdle()` (and a headless-side flag), which does not exist today.

## Open objections

- **O3 (round-2 string residual accuracy) — `open-untested`.** The exact settling test (extract `mapStopReason`'s surrounding upstream context from the installed bundle chunk plus the provider wire meaning of `finish_reason: "error"`) has not been run; it cannot be settled inside this deliberation and routes with the copy ruling to `product-owner`/`steward`. The round-1 "returned no response" clause is `closed-red` (partial-token case), so any ruling adopting "no response" phrasing would re-open this as a defect.
- **O1 (re-show once-per-cycle as specified) — `closed-red` against the spec as written**; the *choice* itself is open judgment (above), not an objection to be retired by a test. If once-per-cycle is ruled, the ruling must name a reset point that contradicts the code's `clearToIdle()` placement and supply a headless-side flag — a settling implementation test would then be required (designer's P7 / owner's latch-exhaustiveness test). That test has not been run because no such implementation exists on this tree.

(All other Skeptic items — O2, O4, O5, O6 — are `closed-green` and recorded under Settled.)

## Ready to hand off?

**No.** Two open items block ship:

1. **Open judgment: the exact lexical copy string** — R3 requires the final string be ruled by `product-owner` before merge. This runner cannot dispatch `product-owner`; it must escalate to the orchestrator, which routes to `product-owner` (escalating to `steward` on the residual-accuracy question). The four candidate strings and the O3 `closed-red` finding against "returned no response" must travel with the escalation, along with the verified engine-level gate the final string must satisfy.
2. **Open judgment: the re-show semantic** (per-episode vs once-per-cycle) — engine contract with mutually exclusive pinning tests, not test-settleable as intent; the escalation must present both with O1's mechanism finding. If once-per-cycle is chosen, the ruling must additionally name a reset point distinct from the inter-episode `clearToIdle()` and a headless-side flag (neither exists today), which converts it into an implementation obligation requiring a new settling test.

R3 and R5's binding strings remain immutable; no ruling may change them.

### Step 6 — Route what does not close (facilitator)

The consolidator holds two **open-judgment** items and no blocking open
objection against the card. R3 assigns the exact string to `product-owner`,
which this container may not dispatch; per `<escalation_contract>` the two
items are escalated to the orchestrator as facts and the card is paused in
`Deliberating` until the ruling returns:

1. **Exact lexical copy string** (R3) — route: `product-owner` via the
   orchestrator. Candidates and the verified engine-level gate are recorded
   verbatim in Step 5.
2. **Re-show semantic** (per-episode vs once-per-cycle) — route:
   `product-owner` via the orchestrator, with the Skeptic's O1 mechanism
   finding carried as a fact. If once-per-cycle is ruled, the ruling must
   name a reset point distinct from the inter-episode `clearToIdle()` and a
   headless-side flag.

Applied and cited, not re-asked: R3 (transient line permitted; string
drafted by `designer`, final copy ruled by `product-owner`; R5's countdown
and exhaustion strings unchanged); R5's binding strings are quoted above as
immutable invariants; scope/merge/union-merge rulings as recorded in Step 1.
No `Needs Human` state is entered: `product-owner` may rule both items, and
R3's escalation path is the orchestrator.

### Step 6b — R3 ruling returned (product-owner job-10) — APPENDED VERBATIM

> **R3 ruling.** Q1 — exact string: `The provider returned an error.` (period, no glyph, no vendor token). Renders equal to this at wide widths; `truncateToWidth(width)` clamp at narrow widths. Pure static formatter output; emitted iff `classifyParentTurnRetry(pendingError) === "retry"`; absent on `idle` and `exhausted`. Engine-level gate: no `finish_reason` substring; not byte-equal to `Provider finish_reason: error`; does not start with `Retrying in`. Q2 — re-show semantic: per backoff episode. The failure line shows at every `beginBackoff(attempt, delayMs)` (attempts 2 and 3), survives across countdown ticks for that episode, disappears with `clearToIdle()` / `moveToExhausted()` / `escAbort()`. Zero new controller state — `surfaceState === "backoff"` is the gate. Carrier confirmed: a second editor-region line pushed above the R5 countdown in `RetryEditor.render(width)` (TUI) and one `host.print` immediately before the first `formatRetryCountdown` print of each backoff episode in headless. R5 binding strings unchanged and binding: countdown `Retrying in 2s (attempt 2 of 3) — Esc to abort`; exhaustion `Retries exhausted after 3 attempts. The provider kept failing. Press Enter to try again.`

Additional binding detail from the ruling (also append to the record): the line is never assembled from `pendingError.errorMessage`; it is a pure static `formatRetryFailure()` output. Rejected candidates and reasons: `Provider returned no response.` (closed-red — an `error`-stop turn can carry streamed partial text, so it can contradict the transcript above it); `Provider request failed — retrying.` (owner conceded round 2); `Provider error.` (drops the article; `The provider` matches R5's terminal-copy register). Rejected semantic: once-per-cycle would need a `RetryController` latch with a reset point distinct from `clearToIdle()` plus a headless-side flag, neither of which exists; designer's T-RR1 is recorded as the rejected semantic, not a skipped test.

Both step-6 open-judgment items are closed by this ruling (R3). Applied, not re-asked:
Q1 (exact string) = `The provider returned an error.`; Q2 (re-show) = per
backoff episode. No `Needs Human` state; no further ruling outstanding.

### Step 7 — Spec written, handed to one owner (facilitator)

- **Spec:** `docs/superpowers/specs/2026-09-17-FLLWUP-44-design.md` — a settled
  design write-up, not a derivation. Self-reviewed for placeholders,
  internal consistency, scope (nothing beyond the card `goal`), and ambiguity
  (an owner reading only the spec can reach exactly one design): clean.
- **R3 applied, not re-asked:** Q1 string `The provider returned an error.`;
  Q2 re-show = per backoff episode with `surfaceState === "backoff"` as the
  sole gate (zero new controller state). R5's two binding strings unchanged.
- **Path:** full-council, surface-touching. Handing the committed spec to the
  single `owner`, which works in an isolated git worktree and never on `main`.
- **State:** `In Progress` on the card frontmatter and on `council/board.md`;
  `python3 council/validate.py` re-run clean after the write.
