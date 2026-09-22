---
title: Decisions Wire Canonicalization
type: concept
summary: Normalize a provider's wire answer shape to the engine's canonical shape at the ONE parse seam both gate domains share — never at each reader — mapping `noul`→`probability`, failing loud on disagreeing or missing keys, so one contract serves the card gate and the follow-up gate.
aliases: [wire canonicalization, answer-shape canonicalization, noul key, parse-site normalization, decisions answer shape]
tags: [pi-council/concept, pi-council/gate]
sources: ["[[2026-09-22-gate-noul-fix]]", "[[2026-09-22-po-ev84-step13-noul-shape-ruling]]"]
created: 2026-09-22
updated: 2026-09-22
---

# Decisions Wire Canonicalization

The gate transport receives answers from a provider (the OpenRouter decisions
endpoint) whose wire shape is not the engine's internal shape. **Canonicalize at
the single parse seam both readers share**, so the contract has one home.

## The shape mismatch that motivated it

The live decisions API returns a noul answer keyed **`noul`**
(`{"type":"noul","noul":<p>}`, P(true) ≡ P(yes)); the engine's readers —
`sideProbability` (shared by `decide()` and `overrideFires`) and
`followupFloor` — read `probability`. Because `parseDecisionsResponse` stored
answers verbatim, both the card gate and the follow-up gate received
`{"type":"noul"}` with no usable probability and threw, resolving to their
fail-safe ([[inert-gate-fallback]]). See [[2026-09-22-gate-noul-fix]].

## The rule

- **One seam, not N readers.** `parseDecisionsResponse` is the parse site both
  `runGate` and `runFollowupGate` call. A fix at either reader would leave two
  contracts where one drifted; the parse-site fix satisfies both at once (the
  FLLWUP-104 ruling's own reasoning). The engine's decision functions
  (`decide`, `decideFollowup`) never see the wire key.
- **Canonicalize, then fail loud on ambiguity.** `noul` → `probability`; an
  answer carrying **both** keys with **disagreeing** values throws rather than
  silently preferring one; an answer carrying **neither** throws. Non-noul
  answers pass through verbatim — the seam normalizes only what it must.
- **The ledger stores the canonical shape.** Because normalization happens at
  parse, the recorded answers (and the ledger) carry `probability`, so the same
  reader that produced a decision can re-derive it.
- **The wire vocabulary stays invisible to the decision layer.** The pole
  mapping (`yes`/`no` → `true`/`false`) lives in the pure wire shaper
  (`toWireQuestions`); the answer-key mapping lives here. Neither leaks into
  `decide()`.

## Why not fix it at the provider

The wire is not ours to change; the provider keyed the answer `noul` and the
engine's contract is `probability`. The seam is the boundary where the foreign
shape is translated, and it is the only place both domains can be fixed once.

## Pole semantics are part of the contract

Canonicalizing a key is not enough: the *meaning* of the value must be pinned.
The noul value names P(true) ≡ P(yes) — proven live (trivially-true → 0.99,
trivially-false → 0.01) before the mapping was trusted. A key mapped on name
alone, with the pole unproven, would trade a visible fail-closed tax for
silently mis-armed routing on a committed ledger.

## Related

- [[metered-deliberation-routing]] — the card-gate reader
- [[followup-decision-gate]] — the follow-up reader
- [[inert-gate-fallback]] — what a shape mismatch produces
- [[gate-parity]] — the adjacent "one strictness contract" rule
- [[2026-09-22-gate-noul-fix]] — the fix that established this seam

## Sources

- `vault/raw/2026-09-22-gate-noul-fix.md`
- `vault/raw/2026-09-22-po-ev84-step13-noul-shape-ruling.md`
- `extensions/gate-transport.ts` (`parseDecisionsResponse`, `canonicalizeAnswer`, `toWireQuestions`)
