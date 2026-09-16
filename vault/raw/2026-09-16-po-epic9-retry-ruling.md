# Product-owner ruling — EPIC-9 provider-error retry decomposition (wave 3)

Run: `/features-new` decomposition of the human intake (screenshot of
`Provider finish_reason: error` dead-ending at `Continue` in a `/features-new`
session; feature request: retry with exponential backoff, configured in
`.council.json` with shipped defaults), epic id EPIC-9, six proposed children
EV-37..EV-42. Three-wave deliberation per [[three-wave-decomposition]]:
wave-1 principal authored, wave-2 skeptic + designer attacked in parallel,
wave-3 product-owner rules last, unconditional.

Source: facilitator-assembled disagreement ledger (skeptic items 1–9,
designer items 1–4) + verbatim principal draft + raw intake screenshot
(`/tmp/herdr-clipboard-images-1001/client-60-clipboard-1789558473706576151-0.png`).
Vault wiki + EPIC-2/5/7/8 board history + the FLLWUP-34 separation cited
inline.

## Framing — what the epic is for

The intake screenshot shows a **parent-turn** provider error — the assistant's
own provider call in the user's pi session died with
`finish_reason=error` → `stopReason=error` → `errorMessage="Provider finish_reason: error"`,
and the session dead-ended at the literal input-bar affordance `Continue`.
The human's stated feature is "retry with exponential backoff, configured in
`.council.json`."

Two binding facts govern the slicing:

1. **Pi already retries by default.** `pi-ai/dist/utils/retry.js:118-157`
   backoffs with `delayMs = baseDelayMs * 2**(attempt-1)`; the gate is
   `isRetryableAssistantError` (`retry.js:167-174`) matching
   `RETRYABLE_PROVIDER_ERROR_PATTERN` (`:13-79`). The Intake's bare string
   `Provider finish_reason: error` does **not** match that pattern — verified
   live via `bun -e` driving the real Hub with `STUB_MODE=error`. So pi's own
   retry loop never fires for precisely the error in the screenshot.
2. **Council owns the seat path, not the parent path.** `extensions/hub.ts:161-166`
   sets `state = code === 0 ? "done" : "failed"`; the stub-child's `error` mode
   exits 0, so a provider-errored child settles `state=done` with
   `stopReason=error`. `extensions/hub-tools.ts:61` prints
   `--- provider error ---`. `extensions/index.ts:379` listens to
   `agent_settled` (not `agent_end` as the principal's testable claim 4
   named). `extensions/index.ts:442-450` is the established
   `sendUserMessage` + `waitForIdle` headless pattern.

The epic therefore splits into two mechanism surfaces (seat dispatch = EV-39,
parent turn = EV-40), one classifier (EV-37) that the loop depends on, one
config section (EV-38), one end-to-end falsifier (EV-41), and one substrate
fix (EV-42). The classifier-before-loop ordering is correct; the Intake is
the parent's surface, so EV-40 carries the user value the human asked for —
EV-39 alone would not fix the screenshot.

**FLLWUP-34 separation.** FLLWUP-34 is *bounded retry for a failed
usage-store write* (`council/board.md`, Done column). Different mechanism,
different file path, different intent. EPIC-9 does not touch it. The two
cards must remain distinguishable on the board.

## Epic goal — ratify

> Council invocations survive transient provider errors by retrying with
> exponential backoff under a policy set in `.council.json`, instead of the
> session stopping.

Captures the intake (retry with backoff, `.council.json` config, defaults,
session-stop instead of dead-end). "Transient" is load-bearing: not every
error is transient, and the classifier card (EV-37) is where the boundary
is drawn. "Council invocations" is read as covering **both** surfaces the
children split — parent turn (EV-40) and seat dispatch (EV-39) — because
the Intake's failure is the parent's own provider call and "session
stopping" only closes if the parent survives.

## Slicing — one amendment

All six children stand. **One new child is added: EV-43, the reachability
falsifier that gates EV-40.** Rationale in Dispute 7.

## Child states — three demote, three stay Backlog, one new Backlog

| Card | Principal | Skeptic | Designer | PO ruling |
|------|-----------|---------|----------|-----------|
| EV-37 | Ready | Backlog (bar 1, stub-satisfiable) | n/a | **Backlog** (objection upheld; goal must enumerate ≥1 terminal case and the settled set) |
| EV-38 | Ready | Backlog (bar 3, no defaults/invalid set) | Backlog (defaults visibility) | **Backlog** (objection upheld; goal must name the defaults table and the invalid-value set; `Intent` must pick a defaults-visibility surface — concrete JSON in `council/scaffold/.council.json`) |
| EV-39 | Backlog | Backlog (bar 1, quantification) | Backlog (misidentification) | **Backlog** (objections upheld; `Intent` must carry "this card does not address the Intake; it fixes a child seat's provider error"; goal must pin budget source, delay formula, attempts sentence) |
| EV-40 | Backlog | Backlog (bar 1, quantification) | Backlog (input-bar state) | **Backlog** (objections upheld; `Intent` must name the input-bar text during backoff and the per-branch observable in TUI and `-p`; goal must name the exhausted-budget terminal copy and re-ground the event name to `agent_settled`) |
| EV-41 | Ready | Backlog (bar 3, no forcing fixtures) | n/a | **Backlog** (objection upheld; goal must name both forcing paths — bare-string stub-child mode + parent-turn provider-fail harness) |
| EV-42 | Backlog | Backlog (bar 1, compound/unobservable) | n/a | **Backlog** (objection upheld; goal must name the manifest field and the tree/usage copy) |
| **EV-43** *(new)* | — | — | Backlog (reachability falsifier) | **Backlog, gates EV-40** (single yes/no deliverable with portfolio consequences on "no" — a new child, not a fold-in) |

---

## Disputes

### Skeptic 1 — EV-37 goal is stub-satisfiable (closed-red)

**Ruling.** Adopt Skeptic. Demote to Backlog; the goal must enumerate the
settled set and at least one terminal case before promotion. Suggested shape
(not authored here): `classifyRetry(r)` returns `"retry"` iff `r.stopReason
=== "error"` and `r.errorMessage` matches the council-widened pattern
(includes the literal `"Provider finish_reason: error"` plus pi's
`RETRYABLE_PROVIDER_ERROR_PATTERN`); returns `"terminal"` for `stopReason
∈ {"stop","length"}` or `state ∈ {"failed","cancelled","stalled","timeout"}`;
all other inputs are explicitly undefined behavior.

**Grounding.** `council/cards/_template.md` (bar 1: falsifiable, not stub-
satisfiable). `extensions/hub.ts:161-166` (the state=done trap on exit 0).
`test/stub-child.ts` `error` mode emits
`Provider returned 502: upstream unavailable` — matches pi's retryable
pattern, so the current fixture does not exercise the Intake's class.
`vault/wiki/council-config.md` does not speak to retry behavior.

**Reversibility.** Local to the goal text; no code touched.

### Skeptic 3 — EV-38 cannot be deliberated as Ready (closed-red)

**Ruling.** Adopt Skeptic. Demote to Backlog; the goal must name the defaults
table (every key, every shipped default) and the invalid-value set (type +
range + format) before promotion. The `Intent` must pick a defaults-
visibility surface: **concrete JSON in `council/scaffold/.council.json`** is
the right answer — defaults visible in place, no runtime surprise, follows
the `loadThemeConfig` precedent. `council/scaffold/.council.json` does not
yet carry a `retry` key and must gain one carrying the documented defaults.

**Options rejected.** (a) Keep Ready — defaults are not enumerable from the
goal text, so the Council cannot write the acceptance test. (b) Defaults
visibility via runtime announcement on first dispatch — requires a new code
path; the scaffold seed already runs non-clobberingly, so visible-in-place
is cheaper. (c) Defaults visibility via docs page — JSON has no comments;
the scaffold JSON is where the human looks.

**Grounding.** `extensions/seats.ts:175-196` (`loadThemeConfig`: falsy off
switch, validate-loudly throws naming the file, presence implies enabled,
falsy non-object `theme` is the off switch). `council/scaffold/.council.json`
(today carries `theme` only — no `retry` key). `vault/wiki/council-config.md`
describes the precedent but does not speak to retry. AGENTS.md 9.5/9.6 is
the pattern new `.council.json` fields follow. The byte-splice
(`extensions/council-config-writer.ts`) preserves unknown top-level keys by
construction, so the writer needs no change for an EV-38 section; the only
risk is *introducing a new writer* without following the byte-splice
discipline.

**Reversibility.** Local to goal/`Intent` text plus one scaffold JSON edit.

### Skeptic 4 — EV-41 cannot be deliberated as Ready (closed-red)

**Ruling.** Adopt Skeptic. Demote to Backlog; the goal must name both
forcing paths before promotion: (a) a `stub-child` mode (suggested:
`STUB_MODE=finish_error`) that emits the bare string
`Provider finish_reason: error` as `errorMessage` so the classifier and the
seat-dispatch loop are exercised with the Intake's exact error text; (b) a
harness for failing a parent turn's provider once in a scratch session
(TUI and `-p` branches) so EV-40's continuation path is exercised. Until
both fixtures exist on the shipped tree, the falsifier card is a research
spike, not a falsifier.

**Options rejected.** (a) Keep Ready — `grep -rn "finish_reason" test/
extensions/` returns nothing; the current fixture matches pi's retryable
pattern and does not exercise the classifier gap. (b) Absorb the fixtures
into EV-37/EV-38 — the E2E falsifier's role is to gate both paths
together; splitting the harness across two cards duplicates it.

**Grounding.** `test/stub-child.ts` (current `error` mode text);
`extensions/hub.ts:161-166` (state model). `vault/wiki/smoke-test.md`
("first Council command without an end-to-end falsifier is a defect" —
applies here, but the falsifier card is not yet falsifiable because the
fixtures are absent).

**Reversibility.** Local to the goal text.

### Skeptic 5/6/7 — EV-39/EV-40/EV-42 goal quantification (open-untested)

**Ruling.** Adopt Skeptic. Backlog is correct as written; the cards cannot
promote to Ready without quantified parameters:

- **EV-39** — budget source (the EV-38 `retry` section's field names, e.g.
  `maxAttempts`/`baseDelayMs`/`maxDelayMs`/`jitter`), backoff formula
  (base, factor, jitter policy, real sleep vs injected clock for tests),
  and the exact attempts sentence on the final report (which string, on
  which field of `formatReport`'s output).
- **EV-40** — configured-backoff field name from EV-38, exhausted-budget
  terminal copy (verbatim string), per-branch observable for "continued
  automatically": TUI input-bar text delta + headless stdout line. The
  event name is **`agent_settled`** per `extensions/index.ts:379`, not
  `agent_end` as the principal's testable claim 4 named — re-ground the
  claim.
- **EV-42** — manifest field name (suggested: `attempt` integer, with a
  stable `attemptGroupId` to bind sibling attempts to one logical dispatch)
  and the tree-row / usage-block copy that distinguishes attempts from
  dispatches.

**Grounding.** `extensions/index.ts:379` (`agent_settled` is the event the
extension listens to); `extensions/index.ts:442-450` (the established
`sendUserMessage` + `waitForIdle` pattern). `vault/wiki/headless-pi.md`
documents the headless waitForIdle discipline. `vault/wiki/usage-accounting.md`
and `vault/wiki/run-transcripts.md` speak to the substrate EV-42 must
preserve.

**Reversibility.** Backlog is the cheapest state; amendments are local to
goal/`Intent` text.

### Designer 1 — EV-40 input-bar state (open)

**Ruling.** Adopt Designer. The Intake screenshot's terminal word is
`Continue`; that single word is the only affordance the surface offers
between the error and the person's next action. EV-40's `Intent` must name
what the input bar shows during the backoff window (suggested:
`Retrying in 2s (attempt 2 of 3) — Esc to abort`). The same obligation
applies to the headless branch (a stdout line that announces the wait) and
the exhausted-budget state (named terminal copy in both branches). A person
whose terminal sits frozen for 2–12 seconds with no visible state change
reaches for Ctrl-C; the affordance is part of the delivery, not an
implementer's taste call.

**Options rejected.** (a) Defer to the implementer — the implementer's job
is the `how`; the visible surface during backoff is a `what` decision.
(b) Limit to TUI — the Intake's `-p` headless branch has the same shape
and the same wait; both branches must be named.

**Grounding.** The Intake screenshot (parent's terminal state is bare
`Continue`). `vault/wiki/headless-pi.md` documents that headless runs use
stdout, not an input bar — the affordance differs by mode but the
obligation to name it does not. `extensions/index.ts:442-450` is the
existing headless-dispatch pattern the EV-40 implementation should mirror.

**Reversibility.** Local to the `Intent` text.

### Designer 2 — EV-39 misidentification (open)

**Ruling.** Adopt Designer. EV-39's `Intent` must carry the line:
*"This card does not address the Intake; it fixes a child seat's provider
error."* Without it, a reader unfamiliar with the parent/child layering
can read EV-39 as fixing the Intake, and the Intake ends up misrouted
under EV-39 in a future board sweep.

**Options rejected.** (a) Rely on the title's "seat dispatch" wording —
titles are taste; the seam word is the contract. (b) Restructure chain
order — the chain order is independent of the disambiguation; the
`Intent` is the cheap place to carry it.

**Grounding.** `extensions/hub-tools.ts:127` (`spawnJob` is the seat
subprocess path). `extensions/hub.ts:161-166` (state=done trap). The
Intake screenshot is the parent's transcript; EV-39 is the child's loop.

**Reversibility.** Local to the `Intent` text.

### Designer 4 — Missing reachability falsifier (open) → EV-43 added

**Ruling.** Adopt Designer — as a new child, **not** a fold-in to EV-40.
The principal's testable claim 4 (corrected: `agent_settled`, not
`agent_end`) is the only claim that, if it returns "no," collapses EV-40's
center card and forces a different surface (a different copy string the
Intake doesn't yet have — "Council cannot recover from this provider
error; restart with X"). That single yes/no deliverable plus a named
observable is a child, not a fold-in — and EV-41's role is the
post-mechanism E2E falsifier, not the pre-mechanism reachability check.

**New child — EV-43 Reachability falsifier for parent-turn continuation**
· `state: Backlog` · `epic: EPIC-9` · gates EV-40

> goal: `A scratch pi session whose provider is configured to fail once
> and then succeed produces a second assistant message in both TUI and
> headless (-p) branches when an agent_settled handler invokes
> sendUserMessage, and the per-branch observable (input-bar text delta
> in TUI; stdout line in headless) is named in the acceptance.`
>
> Intent: This card is the reachability gate EV-40 sits on. The extension
> listens to `agent_settled` (`extensions/index.ts:379`), not `agent_end`;
> the principal's claim 4 named the wrong event and must be re-grounded.
> If both branches return "no," EV-40's `Intent` becomes a different card
> — the Intake's surface is then "Council cannot recover; restart with X"
> copy, which is not in scope today and must be carved as a new card by
> the owner of this epic if EV-43 lands "no."

**Options rejected.** (a) Fold into EV-40 — a fold-in must be needed to
honestly meet the card's existing goal; EV-40's goal as written ("parent
turn… is continued automatically") does not include the reachability
claim, and adding it changes what the card is, which is a card-level
amendment, not a fold-in. (b) Treat as a testable claim only — a yes/no
deliverable with portfolio consequences (different surface on "no") is too
load-bearing to live in a list. (c) Drop the falsifier entirely — the
Intake already shows a bare `Continue`; without the falsifier the worst
case is documented and the best case is unverified, and a Council command
without an end-to-end falsifier is a defect per `vault/wiki/smoke-test.md`.

**Grounding.** `extensions/index.ts:379` (`agent_settled`);
`extensions/index.ts:442-450` (the established `sendUserMessage` +
`waitForIdle` pattern). `vault/wiki/headless-pi.md` (the headless
observable differs from the TUI one — both must be named).
`vault/wiki/smoke-test.md` ("first Council command without an end-to-end
falsifier is a defect").

**Reversibility.** A new Backlog card with no code; cheapest-to-reverse.

### Skeptic 2 — colon-space bar holds on all six goals (closed-green)

**Ruling.** Endorse Skeptic. Bar 1's syntactic half passes; the bar-1
failures the skeptic identified are semantic, not syntactic. No amendment
to the colon-space contract; the colon-space scan remains the standing
check.

### Skeptic 8 — Backlog assignments honest (closed-green)

**Ruling.** Endorse Skeptic. No change.

### Skeptic 9 — state-model trap confirmed live (closed-green)

**Ruling.** Endorse Skeptic. The `state=done` + `stopReason=error` trap is
confirmed; EV-37's "never on `state`" clause is load-bearing and correct.
No amendment.

---

## Escalations

None. The portfolio (build provider-error retry with exponential backoff
under `.council.json` policy) is unchanged. FLLWUP-34 is a different retry
and is not touched. No recorded human decision is being reversed. The goal
is not itself the defect — it is a faithful statement of user value, and
the children carry the mechanism and the surface. Adding EV-43 is a
slicing refinement, not a portfolio change.

## Reversibility note

All amendments are local to goal/`Intent` text on Backlog cards plus one
new Backlog card and one scaffold JSON edit (`council/scaffold/.council.json`
gains a `retry` block). No shipped card moved out of Backlog. The deck can
re-promote to Ready one card at a time as the named amendments land; the
ordering (EV-37 + EV-38 + EV-43 → EV-39 + EV-40 → EV-41 + EV-42) is the
chain EV-39/EV-40's Backlog text already names and need not be re-ruled.
