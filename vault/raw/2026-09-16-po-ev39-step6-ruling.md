---
slug: po-ev39-step6
card: EV-39
epic: EPIC-9
seat: product-owner
step: 6
date: 2026-09-16
---

# EV-39 — product-owner step-6 ruling

## Q1 — Denominator carrier: **inject the init-time `RetryPolicy` snapshot into the renderers**

### Why inject, not persist

- The `RetryPolicy` is **session-level** configuration, not per-dispatch state. Every dispatch this process makes shares the same policy. Persisting `maxAttempts` on the manifest encodes a per-dispatch claim that the policy isn't, and the field will drift the moment the same dispatch id is rendered in a session whose policy differs — exactly the case the principal's own D3 test was written to defend against.
- The substrate footprint stays minimal. The convergent design already adds `attempt?: number` (conditional, present at attempt ≥ 2) and `nextAttemptAt?: number` (transient, cleared at respawn). Adding a third "policy-on-manifest" field is a separate substrate claim EV-39 does not need to lock — EV-42 owns final substrate naming (`vault/raw/` already records its `attempt` field + `attemptGroupId` work).
- AGENTS.md §7 binds: `hub.ts`'s stall/timeout/kill semantics are battle-tested; the render path is the same kind of battle-tested surface (`navigator.ts:352-374` `rowLine`, `tree.ts:64-67` `textTree`). Adding a constructor/wiring parameter is a small additive diff; adding a permanent substrate field is bigger and harder to deprecate if EV-42 takes a different naming turn.
- Reversibility is the deciding principle where two designs are both defensible. To reverse inject → persist, you add the field. To reverse persist → inject, you remove a substrate field that may have shipped into other consumers' assumptions. Inject is strictly cheaper to undo.

### Wiring

- One `loadRetryConfig(repoRoot)` per process at init (already there at `index.ts:588`; **O-8 `closed-green` confirms it appears nowhere else**).
- The resolved `RetryPolicy` is passed as an init-time parameter into `CouncilTreeWidget` (already constructed once per parent session) and into `textTree(repoRoot, runIds, policy)`. Renderers hold the snapshot and read `policy.maxAttempts` directly.
- No second `loadRetryConfig` call site is added anywhere; `grep -n loadRetryConfig extensions/` shows exactly one call, per D3.

### Options rejected

- **Persist `maxAttempts?` on `RunManifest`.** Rejected: encodes session-level state as per-dispatch; widens the substrate footprint that EV-42 owns; harder to reverse.
- **Render-time `loadRetryConfig(repoRoot)`.** Rejected: **Skeptic O-8 `closed-green`** + principal's D3 — `loadRetryConfig` already exists exactly once, at `index.ts:588`, and adding a second call is the divergence the policy-load rule forbids.

### Grounding

- `extensions/index.ts:588` — `loadRetryConfig` call site (O-8 closed-green).
- `extensions/navigator.ts:344` — `CouncilTreeWidget.refresh` reads manifests only; constructor is the one wiring point.
- `extensions/tree.ts:58-67` — `textTree(repoRoot, runIds)` is a pure module; a third parameter is mechanical.
- `council/cards/EV-39.md` step 4 O-6b (denominator three-way inconsistency), O-8 (no carrier at render sites).
- `vault/wiki/hub-job-supervision.md` — battle-tested surfaces, additive-only convention; `vault/wiki/run-transcripts.md` — the manifest is the substrate the renderers already read.

### Reversibility

Switch to persist-`maxAttempts?` later if needed: add one optional field to `RunManifest`, populate at dispatch in `Hub.writeJobManifest`, drop the renderer's `policy` parameter. Substrate diff: +1 line. Cost: low.

---

## Q2 — Escalate to `steward`: who corrects EV-42's premise

This is a portfolio question, not a card-scoped one. EV-42 sits at `Ready` with a `goal` and `Intent` text whose premise ("each attempt currently mints a fresh job id, a fresh manifest, and a fresh session file") no longer describes the post-EV-39 mechanism. Both `owner` and `principal` agree that cardinality (A) — one job id / one manifest / one row per dispatch — re-scopes EV-42. They disagree on **who holds the pen**:

- `owner`: EV-39 must edit EV-42's card at this card's close — not silently.
- `principal`: EV-39 decides (A) and records it; does **not** re-scope or absorb EV-42; that is `steward`'s.

Skeptic O-6 is `open-untested` — "not runnable; needs a steward ruling, not a test." The card text is immutable past `In Progress`. Changing EV-42's `goal` or `Intent` is changing what the portfolio is building. That is the `steward`'s authority, not mine.

### Escalation package to `steward`

1. **The mechanism chosen here makes EV-42's stated premise false.** EV-39 mandates (A): one job id, one `<id>.json`, overwritten per attempt; attempts distinguished by the `attempt?` field on the manifest and the per-attempt session id. The sibling's text "each attempt currently mints a fresh job id, a fresh manifest, and a fresh session file" describes manual re-dispatch, not EV-39's loop.
2. **The remaining EV-42 work is real, not nullified.** Per-attempt attribution (which attempt spent what, where the per-attempt transcripts live in the run dir, how the tree/usage copy carries the distinction) is genuine substrate work — it is not absorbed by EV-39. `attemptGroupId` may now be redundant with the job id, or it may still be needed for cross-tree queries; that needs `steward`'s call.
3. **The two specific handoff notes** (per principal round-2 §9):
   - provisional `maxAttempts?` / `nextAttemptAt?` (now superseded by Q1's inject-snapshot ruling — `maxAttempts` does not enter the substrate);
   - the EV-29 provider-reported figure is final-attempt-only under one-manifest-per-dispatch (D4; see Q4).
4. **Ask:** does `steward` (a) edit EV-42's `Intent` directly to match the post-EV-39 mechanism and keep the remaining substrate work as the card's deliverable, (b) leave EV-42's text untouched and have the runner/PO record the correction in a separate "harness amendment" document, or (c) reject this and re-route EV-42?

`product-owner` does not choose among (a)/(b)/(c). I name the options; `steward` rules.

### Reversibility

High — `steward` ruling can be re-asked in a future card if (a) the first ruling turns out wrong; nothing here changes the code path.

---

## Q3 — Tick interval: **2 s** (default ratified)

The widget refreshes every 2 s (`extensions/navigator.ts` widget timer). EV-40's R5 input-bar countdown ticks every 1 s because the input bar is a different surface with its own timer. The two surfaces' cross-consistency is achieved by the verb `retrying` (per designer's convergent row grammar) and by the same `attempt N/M` label, **not** by identical tick intervals.

A 2 s tick means the operator sees `retrying in 2s → 0s`; the meaning (the loop is in backoff, attempt 2 will spawn) is carried by the verb and the label. No new ticker, no new render cost. The 1 s argument is cross-surface consistency with EV-40 — but EV-40's 1 s is its surface's own discipline, not a load-bearing contract this card has to mirror.

**Ratify the designer's default: 2 s.**

### Grounding

- `extensions/navigator.ts` widget refresh (already 2 s).
- `council/cards/EV-39.md` step 4 O-8 wording — "implementation gate, default 2s unless ruled."

### Reversibility

Trivial — change the widget refresh from 2 s to 1 s (or add a dedicated 1 s ticker). No other surface affected.

---

## Q4 — Escalate to `steward`: disclose or fix in card

This is a scope/values call. EV-29's provider-reported figure is built from `findSessionFile(repoRoot, runId, m.sessionId)` — `usage-store.ts:426`, **one path per manifest** (Skeptic O-5 closed-green on shape). Under (A), the manifest carries only the **final** attempt's session id; the reported half is therefore final-attempt-only, not every-attempt. A silent partial reported figure falsifies the honesty invariant (`vault/wiki/usage-accounting.md` — honest token/cost accounting; the EPIC-7 lineage).

Principal D4 names both paths:

1. **Persist the attempt session list** on the manifest (e.g., `attemptSessionPaths?: string[]`) and update `usage-store.ts:426` to walk them; the reported figure then sums across attempts.
2. **Mark the reported row as final-attempt-only** in `formatReport` / the EV-29 wrapper's copy; the limitation is disclosed, not hidden.

Neither is a card-scoped decision. Both change the portfolio:

- (1) expands EV-39's scope into the usage-store EV-29 territory — adjacent card's surface.
- (2) **permanently accepts a residual** ("reported figure is final-attempt-only"). Per my prompt's escalation clause, permanent residual acceptance is `steward` territory.

`product-owner` will not pick. The minimum I will say: **whichever path `steward` picks, the silent partial is forbidden.** The card's `Acceptance` must include one of the two; the runner must not merge without it.

### Escalation package to `steward`

1. The shape is closed-green: `usage-store.ts:426` reads exactly one session path per manifest (verified by Skeptic O-5 code-level probe; live fetch is network-gated `COUNCIL_INTEGRATION=1`, O-5 second half open-untested).
2. The choice is disclose (permanent residual, EV-29 ships with a known limitation) vs fix (EV-39 scope grows to persist the attempt session list and rewire `usage-store.ts`).
3. **Mandatory constraint:** the silent partial is not an option.
4. If `steward` rules "fix in card," the deliverable is named in the EV-39 spec; the existing EV-29 record is not silently re-scoped.

### Reversibility

Disclose → fix is a future card (already routed to EPIC-9's backlog). Fix → disclose requires reversing a substrate addition — moderate cost but bounded.

---

## Open-untested residuals named for the step-7 spec as gates

The following ride into the step-7 spec as **named implementation/integration gates** (not rulings; the owner/Skeptic close them at step 9). They are not blocking the step-6 ruling:

| # | Residual | Settling test | Type |
|---|---|---|---|
| G1 | O-7 byte-identity of non-retry manifest and N=1 `formatReport` | T8/P1 — string-equals baseline; EV-28 byte tests stay green | Implementation |
| G2 | O-5 `retrying`-half of `tick()` claim | live backoff with `retrying` state armed; assert no stall kill, no `killGroup`, no timeout flip | Implementation |
| G3 | T7/P21–P23 `retrying`-state units + gate-closed/written-once | wait-blocks-through-backoff; cancel-disarms-timer (spawn count = 1); one-row + `attempt N/M` rendered; flush outcome `gate-closed` at attempt-1 `onChange`, `written` exactly once after final settle with cumulative `subtree.cost` | Implementation |
| G4 | D4 live OpenRouter fetch half | 2-attempt openrouter dispatch asserting reported figure is final-attempt-only (or, if Q4 is "fix in card," that the attempt-session list is persisted) | Integration (`COUNCIL_INTEGRATION=1`) |
| G5 | O-6 (process half) — EV-42 premise correction | none possible; closes only when `steward` rules | Ruling |

---

## Dissent and escalation summary

- **Q1 (denominator):** no dissent at the consolidated level — designer's render-time read is closed-red by O-8 + D3; the remaining pick is between inject and persist. **Ruled: inject.**
- **Q2 (EV-42 premise correction):** **escalated to `steward`** — process-authority disagreement, not a card-scoped judgment.
- **Q3 (tick interval):** no dissent — designer deferred, Skeptic named the default. **Ruled: 2 s.**
- **Q4 (D4 disclose vs fix):** **escalated to `steward`** — permanent-residual vs scope-expansion, both portfolio-level.
- **Internal dissents the ruling does not adopt:** `owner`'s timer-residence preference (Hub vs supervisor module) — the consolidator's settling test arbitrates, and either placement satisfies the invariants; **deferred to implementation choice under §7-minimality.** `owner`'s "EV-39 must edit EV-42's card at this card's close" — the edit is `steward`'s authority, not the runner's; **escalated.**

---

## Acceptance amendments

EV-39's `Acceptance` is amendable if needed. The step-7 spec should add (at minimum):

1. The denominator carrier is the init-time `RetryPolicy` snapshot, injected into `CouncilTreeWidget` and `textTree` (Q1 ruling).
2. The countdown tick is 2 s (Q3 ruling).
3. The `Acceptance` carries whichever D4 disposition `steward` picks (Q4 escalation) — and **must** carry one of them before merge. The silent partial is forbidden.
4. EV-42's disposition is `steward`'s, recorded in the card's step-11 (Q2 escalation). EV-39's close does not silently edit EV-42.

No `goal` change. No `Acceptance` change that would amend what the card is for (the `goal` stays "re-spawn with backoff until budget or clean settle, final report names the attempt count").