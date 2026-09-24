---
title: Inert Gate Fallback
type: concept
summary: An enabled decision gate (`.council.json` `gate.mode: active`) can be inert two ways — its live call fails, OR a recorded decision is dropped at read-back by schema/version drift — and both fall back to the safe default (full Deliberate) without blocking the run, so "active" can mean the gate is not deciding.
aliases: [inert gate, gate fallback, active-but-failing gate, gate fail-closed fallback, inert active gate]
tags: [pi-council/concept, pi-council/gate]
sources: ["[[2026-09-22-epic15-run-ledger]]", "[[2026-09-22-epic10-run-ledger]]", "[[2026-09-22-gate-noul-fix]]", "[[2026-09-24-epic23-run-ledger]]"]
created: 2026-09-22
updated: 2026-09-24
---

# Inert Gate Fallback

A decision gate in `active` mode does not guarantee a decision was made. When
the live model call fails — refusal, timeout, non-2xx, unparseable answer, or a
wire-shape mismatch — the engine **records a failure and falls back to the
domain's safe default**. The run proceeds; nothing is blocked. The gate is then
*inert*: enabled on paper, not deciding in fact.

## The two domains and their safe directions

| Domain | Enabled by | Failure fallback | Direction |
|---|---|---|---|
| Card gate ([[metered-deliberation-routing]]) | `.council.json` `gate.mode` | full **Deliberate** panel | toward *more* scrutiny |
| Follow-up gate ([[followup-decision-gate]]) | same `gate.mode` | human/[[product-owner]] pre-write confirm; may never `Drop` or auto-`Merge` | toward *more* review |

The safe direction is chosen per domain, and it is the whole point: a card gate
that cannot decide routes the card through the full council; a follow-up gate
that cannot decide hands the candidate back for review and can never take the
destructive or irreversible action. Both fail toward the conservative side, so
an inert gate is **not** a correctness hazard for the run it governs.

## What "inert" does and does not mean

- **Does:** the recorded decision is absent, so the router reads *no recorded
  decision for the current packed state* and returns the fallback
  (`council_route op:route`). The [[deterministic-merge-check]] then reads the
  mode from the **run substrate** (the ROOT dispatch manifest), not from any
  seat report — so a failed gate never fabricates a mode.
- **Does not:** block, HALT, or silently default to a *less* strict mode. The
  fallback is never `Direct`; a card gate failure routes Deliberate.
- **Does:** make the rendered verdict **information only**. A failed call
  carries `gate call failed: <reason>`; the draft-then-confirm gate proceeds
  unchanged ([[presented-never-written]]). "Recorded, never acted on" is the
  card-gate counterpart.

## The EPIC-15 evidence

`.council.json` carried `gate.mode: active`, yet **both** domains failed on
every call with the `noul` answer-shape drift (open `FLLWUP-104`):

- intake card gate — `gate: decide — answer reversible of type noul is missing a
  usable probability`;
- follow-up gate — `followup: decideFollowup — answer duplicate of type noul is
  missing a usable probability`.

Three cards still shipped (PRs #104–#106), each routed **Deliberate** by
fallback, each merged under the five criteria. The run's mode was never in
question because the merge check reads the substrate, and the substrate recorded
the fallback mode.

**Resolved 2026-09-22** (`e903b67`): the `noul` wire-shape drift was fixed by
canonicalizing the answer key at the shared parse seam
([[decisions-wire-canonicalization]]). Both domains now record real decisions;
the inert-fallback *property* remains by design, but this specific trigger is
gone. See [[2026-09-22-gate-noul-fix]].

## EPIC-23 — the second inert arm: read-back drift (2026-09-24)

The `noul` fix restored the live call, but EPIC-23 showed the gate can still be
inert with a **healthy** call. `council_route op:"route"` returned
`source: "fallback"` for both cards, EV-89 with the explicit basis:

> recorded decision for this state uses policyVersion "gate-policy-1", current
> decision policy is "gate-decision-1" — routes full

The writer stamps `policy.policyVersion` (`gate-policy-1`); the reader compares
against `council/gate/decision.json`'s `version` (`gate-decision-1`). Two
namespaces, structurally never equal, so `resolveRoute` **drops every recorded
decision at read-back**. This is a distinct arm from the live-call failure above:
the decision *was* recorded; the reader rejected it. Both arms fall toward
Deliberate and neither routes the card, so the operator tell here is not
`gate call failed: …` but the `policyVersion`/packed-state basis — the same
active-but-not-deciding property, a different signature. FLLWUP-99 owns the fix.

## Relationship to gate-parity

[[gate-parity]] is about *strictness alignment between a write layer and the
runtime* — a write layer may be stricter only where a runtime gate is too.
Inert gate fallback is orthogonal: it is about *runtime failure behavior* — what
the runtime does when the decision call does not produce a usable answer. The
two meet only in that both are about not letting an absent answer become a
permissive one.

## The operator-facing trap

`active` in `.council.json` reads as "the gate is deciding." When the gate is
inert, that belief is false: the gate is recording failures, and the run is
running on the fallback. The safe direction bounds the blast radius, but it does
not make the gate a gate. The practical tell is the failure basis in the
recorded line (`gate call failed: …`) versus a real decision. The FLLWUP-104
`noul` drift that made both domains inert through EPIC-15 was fixed 2026-09-22
([[2026-09-22-gate-noul-fix]]); any future mechanical failure re-exercises this
property, so the tell stays worth checking.

## Related

- [[metered-deliberation-routing]] — the card-gate domain (mode, routing)
- [[followup-decision-gate]] — the follow-up domain and its `File` fail-safe
- [[deterministic-merge-check]] — reads mode from the substrate, never a report
- [[gate-parity]] — the orthogonal strictness-alignment rule
- [[confirmation-authority]] — what a *recorded* decision may apply
- [[presented-never-written]] — the rendered verdict is information, never a write
- [[decisions-wire-canonicalization]] — the fix that ended the EPIC-15 inertness
- [[three-wave-decomposition]] — the intake gate whose verdict is recorded, never acted on

## Sources

- [[2026-09-22-epic15-run-ledger]] — both domains inert; three cards shipped on fallback
- [[2026-09-22-epic10-run-ledger]] — the card gate's drift first surfaced (FLLWUP-104)
- [[2026-09-22-gate-noul-fix]] — the parse-site fix that restored both domains
- `vault/raw/2026-09-22-epic15-run-ledger.md`
