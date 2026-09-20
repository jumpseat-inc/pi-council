---
title: Metered Deliberation Routing
type: concept
summary: EPIC-13, shipped at v0.28.0 — a typed System One gate evaluates a packed card state and routes each card to Deliberate, Verify, or Direct; enablement lives in `.council.json`'s reserved top-level `gate` section, and the packaged default resolves `mode: "off"` — which routes every card to the full Deliberate panel.
aliases: [metered deliberation, deliberation routing, System One gate, Deliberate Verify Direct, gate]
tags: [pi-council/concept, pi-council/epic13]
sources: ["[[2026-09-21-epic13-run-ledger]]"]
created: 2026-09-20
updated: 2026-09-21
---

# Metered Deliberation Routing

> ✅ **Shipped — EPIC-13 closed `Done` at v0.28.0 (2026-09-21).** The gate's
> enablement lives in `.council.json`'s reserved top-level `gate` section
> (`{"mode": "off" | "advisory" | "active"}` — EV-73); with no `gate` section
> the routing is available but inert, and `council/gate/policy.json` carries
> tuning data only (never a mode).

Deliberation is otherwise the default path for every non-mechanical card.
EPIC-13 turned it into a **metered, routed resource**: a typed *System One* gate
evaluates a compact, budget-bounded card state against a small fixed question
set, and a **pure decision function** routes the card to one of three lanes —

- **Deliberate** — the full panel ([[council-loop]]).
- **Verify** — [[owner]] + [[skeptic]] + [[judge]]; a fresh-context goal
  evaluation and the test gates, no branch-verification dispatch, no
  [[principal]]/[[designer]]/[[consolidator]].
- **Direct** — [[owner]] only; the test suite is the gate (no judge).

**`off` is not "less rigor" — it routes every card to the full Deliberate
panel.** The naive reading is inverted: with the gate off there are no recorded
decisions to route from, so `resolveRoute` (`extensions/gate-route.ts`) falls
back to the full panel with basis `gate mode off — no recorded decision` —
maximum scrutiny on every card. An absent `.council.json`, an absent `gate`
section, and `gate: {}` all resolve `off` byte-identically (`loadGateConfig`,
`extensions/gate.ts`). The mode is read lazily at gate-tool-call time, never
eagerly at parent init — a mid-run flip of `.council.json` is visible to the
current dispatch's next gate read.

## Turning the gate on: `/council-gate`

`/council-gate` is the operator surface (`extensions/council-gate-cmd.ts`).
Zero tokens is a **status read** — it resolves through the same loader the gate
uses and costs zero model tokens; one token ∈ `off|advisory|active` is a
**write** — the new mode is spliced into `.council.json`'s `gate` section as a
byte-region splice (`extensions/council-config-writer.ts`), then echoed through
`loadGateConfig` (echo-then-run); more than one token is a usage error. The
shipped copy lines, byte-verbatim:

- status read: `[council-gate] gate mode is <mode>.`
- after a write: `council-gate: gate mode is now <mode> in .council.json — applies to dispatches after this echo.`
- no-op (requested mode already resolved): `council-gate: gate mode is already <mode> in .council.json — no change.`
- usage error: `[council-gate] error: unknown mode "<arg>" — usage: /council-gate [off|advisory|active]`

The status line deliberately names no file — this page is the pointer: the gate
reads and writes the reserved top-level `gate` section of the committed
`.council.json` at the repository root (documented as-is; see Residuals).

## Config surface: the `gate` section of `.council.json`

The `gate` section carries one key, `mode`, with three values (`GATE_MODES` in
`extensions/gate.ts`):

- **`off`** — no gate calls; every card routes to the full Deliberate panel
  (the callout above).
- **`advisory`** — the gate runs and its verdict is rendered informationally at
  the presentation steps; the verdict is never enforced.
- **`active`** — the recorded mode is enforced: the dispatch routes by it and
  the [[deterministic-merge-check]] keys its criteria on it.

The route *targets* are a separate vocabulary (`GATE_DECISION_MODES`):
Deliberate, Verify, Direct — the three lanes above. Enablement values and
decision values are different enums; a `gate.mode` outside `GATE_MODES` fails
loud at load (case-sensitive: `"Active"` is a FAIL, not a coercion to `active`).

## Legacy `policy.json` `mode`: the migration FAIL (EV-75)

`mode` is no longer an accepted `policy.json` key — enablement moved to
`.council.json`'s `gate.mode` (EV-73). A policy file that still carries `mode`
fails loud before any other validation, with the dedicated migration line
(`extensions/gate.ts:186-189`; the throw sits at :189):

`FAIL: <policy.json path> has an invalid mode — unknown key; gate enablement moved to gate.mode in <.council.json path> — remove this key and set gate.mode there`

The line deliberately ends where it does: the standard loader tail's advice —
"set a valid value or remove the key to use the packaged default" — is wrong
for this key, because removing the key would fall back to a packaged default
that no longer carries a mode and no value is accepted, so the FAIL omits that
tail rather than inviting the fix that re-breaks resolution.

## Run-start preflight (EV-76)

When the gate is on (`advisory` or `active`) and no OpenRouter credential
resolves (env → stored credential), the run-start preflight fails loud before
any seat dispatch — a single line from `extensions/preflight.ts`, surfaced by
the `council_preflight` tool:

`FAIL: decisions gate is enabled (mode "<mode>") but no OpenRouter credential resolved — set OPENROUTER_API_KEY, or run /login openrouter in pi to store an openrouter api_key credential, then re-run preflight`

Both remediations are in the line itself: set `OPENROUTER_API_KEY`, or run
`/login openrouter` in pi to store an openrouter api_key credential — then
re-run preflight. Wired at `council/procedures/council.md` step 0 and
`council/procedures/features-deliver.md` Phase 0. Both pass cases — the gate
is off, or the gate is on and a credential resolves — report the same single
ok line at the tool surface (`registerPreflightTool`'s `execute()`):

`council_preflight: ok — decisions gate off, or an OpenRouter credential resolved`

The silent pass is the engine-internal form only: the pure
`runStartGatePreflight` returns null on a pass; the registered tool never
does — it always returns content.

## Reading the `Mode: <mode> — <basis>` line

`decisionLine` (`extensions/gate-ledger.ts`) is the ONE formatter —
`Mode: <resolvedMode> — <basis>`, folding to `Mode: <resolvedMode>` alone when
the basis is absent (a v1 ledger line). What follows the em-dash is an
emitter-keyed union: every distinct basis shape the code can emit, beside its
emitting function. Numeric examples are real renders lifted from
`test/gate-decide.test.ts` and `test/gate-render.test.ts`; the thresholds they
name are whatever the recorded decision was made under, not current constants
(see Thresholds below).

**Emitted by `decide()` (`extensions/gate.ts`):**

| Basis shape (byte template) | Emitting site | Real example |
| --- | --- | --- |
| `<question>? <option> (<basis>)` | hard-override arm, `extensions/gate.ts:624` | `reversible? no (one-way door)` |
| `<id>: confidence <c> < <type> floor <f>` | confidence-floor arm, `extensions/gate.ts:643` | `decidablyTestable: confidence 0.50 < choice floor 0.70` · `probe: confidence 0.40 < score floor 0.70` |
| `<id>: certainty <p> < noul threshold <t>` | noul arm, `extensions/gate.ts:653` | `reversible: certainty 0.51 < noul threshold 0.60` |
| `composite <c> ≥ direct threshold <t>` | composite→Direct arm, `extensions/gate.ts:671` | `composite 3.60 ≥ direct threshold 3.40` |
| `composite <c> ≥ verify threshold <t>` | composite→Verify arm, `extensions/gate.ts:678` | `composite 2.75 ≥ verify threshold 2.60` |
| `composite <c> < verify threshold <t>` | composite→Deliberate arm, `extensions/gate.ts:684` | `composite 1.85 < verify threshold 2.60` |

**Fail-closed, emitted by `runGate` (`extensions/gate-run.ts`):** a refusal,
timeout, non-2xx, or unparseable body records `gate call failed: <reason>` and
resolves Deliberate — e.g. the no-credential case renders `gate call failed: no OpenRouter API key resolved (OPENROUTER_API_KEY env or stored credential)`.

**Emitted by the renderer (`extensions/gate-render.ts`)** — the two fallback
literals, fed through `decisionLine` with resolvedMode `Deliberate`; they are
honest distinct states, never conflated:

- **Cell B** — the call threw before any ledger line was written:
  `gate call failed before recording a verdict`.
- **Cell C** — a recorded callId matching no ledger line:
  `recorded gate call not found in ledger`.

**Routing-read `RouteResult` bases (`extensions/gate-route.ts`) — never reach
`decisionLine`.** These travel only in `council_route`'s JSON result (`source`,
`mode`, `basis`); they are never rendered as `Mode:` lines:

| `RouteResult` basis | When |
| --- | --- |
| `gate mode off — no recorded decision` | gate off → full-panel fallback, decided before any state build |
| `no recorded decision for the current packed state` | no valid recorded line for the hash → fallback full; no gate call from the read |
| `recorded decision for this state uses policyVersion …` | policy drift → fallback full |
| `recorded decision for this state does not re-derive under the current decision policy — routes full` | re-derive drift → fallback full |
| `recorded decisions for this state disagree (…) — the strongest valid mode holds` | disagreeing matches → the strongest valid mode wins |
| `recorded decision (call <callId>): <basis>` | the agreeing-match join; `matchedCallId` carries the callId |
| the packer's thrown message | full-unpackable — the card's state cannot be packed |

## `callId: null` — the tool short-circuit, not corruption

Three things are easily conflated; only the first is `callId: null`:

- **Cell B — `callId: null`**: the gate call failed before any ledger line was
  written — the tool short-circuited, no verdict exists, and the ledger itself
  is intact. Not ledger corruption; renders `gate call failed before recording a verdict`.
- **`matchedCallId`**: a field on the routing-read `RouteResult`
  (`council_route`'s JSON) naming the recorded call line the route matched — a
  successful join, never a failure.
- **Cell C**: a recorded callId that matches no ledger line —
  `recorded gate call not found in ledger`.

## Intake-recorded vs dispatch-re-checked

Intake (`EV-66`) records the route with `touchedFiles: []` — at draft time
nothing has been touched, so the recorded packed state hashes the declared set
only. At dispatch the re-check (`extensions/gate-route-tool.ts`, EV-69) fires
**only** when the route is a recorded reduced mode — `route.source === "recorded"` and the recorded mode is not Deliberate: a recorded Verify card
**and** a recorded Direct card are both re-checked; a recorded Deliberate card
never is (there is nothing below it to hold); a fallback or unpackable route is
returned unchanged. The re-check rebuilds the packed state over the **observed**
numstat set at the pinned head — not the declared set — and re-gates exactly
once; it is **escalation-only**, a ratchet that can strengthen a recorded mode,
never a demotion. A hard override that fires re-routes to the full path with a
ledger line.

## Names and mapping: three names for one thing

| The model pin (`policy.json`'s `model` key — tuning data, never a mode; ledger `model` field) | The gate (operator term — this page, `/council-gate`) | The decisions API (wire name) |
| --- | --- | --- |
| `typesafe/jev-1.13` | the gate | the decisions endpoint `https://openrouter.ai/api/alpha/decisions` (never the `chat/completions` path) |

The pin is the full model id, never the alias — the same string appears in the
ledger's `model` field and in every commit that records a gate call.

## Thresholds

The decision thresholds live in the decision record,
`council/gate/decision.json`, versioned and re-registered via
`council/gate/registrations.jsonl`; they move only with the evidence that
motivated the move on the record. This page deliberately states no threshold
numeral of its own — the basis examples above carry whatever thresholds the
recorded decisions were made under.

## The gate

- **State packing** (`EV-64`): `buildGateState(card, repoRoot)` packs only
  declared sections in a fixed order (goal+acceptance; touched-file paths+line
  counts, never contents; top-k wiki pages via a deterministic matcher; recent
  rulings; covering test names) under `gateStateBudgetTokens` (default 32000).
  Over-budget drops from the tail, section-last, recording the drop.
- **Decision** (`EV-63`): `decide(answers, policy)` is **pure** — a weighted
  composite, per-answer confidence floors, and hard deterministic overrides
  (one-way door, public-contract/data change, cross-module blast radius →
  Deliberate regardless of the answers). It returns `{mode, inclusionSet,
  basis}`, where `basis` is a deterministic one-line string. A `noul` answer
  carries a probability but no `confidence`; it is compared against the policy's
  `noul` threshold instead. The design asymmetry: **skipping deliberation is the
  dangerous error, deliberating unnecessarily is only expensive.**
- **Policy and question set** (`EV-62`): packaged
  `council/gate/{policy,questions,decision}.json`, whole-file first-hit shadowed
  by repo-local `$CONFIG_DIR_NAME/council/gate/*.json`; malformed JSON, an
  unknown key, or an invalid value fails loud naming the file and key. The model
  is pinned in `policy.json`'s `model` key — tuning data, never a mode; the
  vocabulary mapping below gives its three names.
- **Transport** (`EV-65`): exactly one POST to
  `https://openrouter.ai/api/alpha/decisions`, behind an injected interface,
  never the `chat/completions` path. **Fail-closed** — a refusal, timeout, or
  non-2xx resolves to `Deliberate` with the reason recorded verbatim; the default
  suite makes no network call.
- **Ledger** (`EV-61`, widened by `EV-65`): append-only
  `$CONFIG_DIR_NAME/council/gate-ledger.jsonl`, committed by default, schema v2.
  One atomic call line per call carrying the state hash, question-set version,
  every answer with probabilities/confidence, resolved mode, policy version, and
  the call-time union (`basis`, versioned model, provider, usage, generationId,
  failure, drops, advisory, unknownAnswerIds). The mode is re-derivable from the
  record alone with no network call.
- **Spend** (`EV-71`): gate spend is journalled with a **reported** `costBasis`
  (the decisions response's own `usage.cost`), and reconciliation accepts
  `gen-dec-…` generation ids sourced from the ledger. The [[usage-block]] names
  gate spend as excluded from the invocation total.
- **Pre-registration** (`EV-72`): a `policyVersion` with no matching entry in
  `council/gate/registrations.jsonl` is a `validate.py` `FAIL`; thresholds move
  only with the evidence that motivated the move on the record.

## Modes and the merge gate

The recorded mode is written to the root dispatch manifest (`EV-68`), and the
[[deterministic-merge-check]] is **mode-aware** (`EV-70`): Direct merges on
criteria 1/2/5 only, Verify requires all five, Deliberate is verbatim, and an
absent mode is a `HALT` (inferring a mode is the discretion the check exists to
remove). A card whose recorded mode is a reduced mode (Verify **or** Direct) is
**re-checked at dispatch** against the observed touched-file set (the full
condition and the ratchet: the intake/dispatch split above). A hard override
that fires re-routes to the full path with a ledger line. `EV-69` amended
`council.md` step 1 so a recorded mode is authoritative.

## Residuals

The gate carries named, temporary residuals each with a closing
[[engineering-board]] card: the designer-review loss under a recorded Verify
(`FLLWUP-71`, a fourth user-visibility question in the gate set — per R4 no
designer is seated in Verify), and the static pending window (`FLLWUP-75`).
(The historical `verify > 0` gap is closed — `extensions/gate.ts` now enforces
a finite, strictly positive verify threshold at load.) Documented-as-is:
`/council-gate`'s status line names no file while the write/no-op lines do; the
prose location is this page.

## Related

- [[council-loop]] — the Deliberate lane
- [[deterministic-merge-check]] — its mode-aware consumer
- [[engineering-board]] — the cards the gate routes
- [[usage-block]] — the gate-spend exclusion legend
- [[chain-promotion]] — the adjacent autonomous cadence
- [[2026-09-21-epic13-run-ledger]] — the run that shipped it

## Sources

- [[2026-09-21-epic13-run-ledger]]
- `council/cards/EPIC-13.md`, `council/gate/*.json`, `extensions/gate*.ts`