---
title: Metered Deliberation Routing
type: concept
summary: EPIC-13, shipped at v0.28.0 — a typed System One gate evaluates a packed card state and routes each card to Deliberate, Verify, or Direct; enablement lives in `.council.json`'s reserved top-level `gate` section, and the packaged default resolves `mode: "off"`.
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
  is pinned (`typesafe/jev-1.13`), never the alias.
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
remove). A card whose recorded mode is Verify is **re-checked at dispatch**
against the observed touched-file set; a hard override that fires re-routes to
the full path with a ledger line. `EV-69` amended `council.md` step 1 so a
recorded mode is authoritative.

## Residuals

The gate shipped with named, temporary residuals each carrying a closing
[[engineering-board]] card: the designer-review loss under a recorded Verify
(`FLLWUP-71`, a fourth user-visibility question in the gate set — per R4 no
designer is seated in Verify), the `loadGateDecision` `verify > 0` gap
(`FLLWUP-74`), and the static pending window (`FLLWUP-75`).

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