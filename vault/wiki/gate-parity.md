---
title: Gate Parity
type: concept
summary: A persistence/validation layer may be stricter than the runtime only where an existing downstream gate is also that strict — writer = loader's field-level inverse + dispatch's one failure predicate; capability enforcement lives at selection time, not write time.
aliases: [gate parity, writer gate parity, gate placement, capability gate placement]
tags: [pi-council/concept, pi-council/epic5]
sources: ["[[2026-09-04-epic5-run-ledger]]"]
created: 2026-09-04
updated: 2026-09-04
---

# Gate Parity

Settled in EV-24's deliberation (designer withdrew the opposing position
in round 3 on Skeptic evidence): **the writer may be stricter than the
runtime only where dispatch is also stricter.** Concretely, the
`.council.json` writer validates exactly two things —

1. **model-presence in the catalogue** (the one predicate dispatch
   enforces, `hub-tools.ts`/`dispatch.ts`), and
2. **thinking grammar** (`THINKING_LEVELS` membership, the one predicate
   the loader enforces)

— and deliberately has **no capability gate** (no check that a model
supports a chosen thinking level). The full gate map proved why: the
loader is grammar-only; dispatch is model-presence only; **no council
code path rejects a capability-invalid override** — pi's
`clampThinkingLevel` clamps to the nearest supported level at spawn. A
capability gate in the writer alone would be (a) stricter than every
downstream consumer with no in-UI escape hatch (hand-edits bypass it),
(b) bound to volatile catalogue metadata that is known-unreliable
([[model-output-floors]] exists precisely because catalogue metadata
lies), and (c) an asymmetry with no delayed failure to prevent — there
is no failure to move earlier; the runtime clamps silently.

## The placement rule

Capability data (`supportedThinkingLevels`) is the **picker's**
affordance, not a persistence contract: constrain the choice at
selection time — where the person is, with fresh per-selection data —
and let pi's clamp be the last-resort net. "Teach at the surface;
don't gate at persistence."

The symmetric corollary: if a future writer-side hardening is wanted,
it must ship the **identical check in dispatch in the same change** —
never the writer alone (writer ⊆ loader ∪ dispatch is the invariant).

## Related

- [[council config writer]] — the application of this principle
- [[council config]] — the file and its read-path gates
- [[model-output-floors]] — why catalogue metadata can't bear a hard gate
- [[council models picker]] — where capability enforcement lives instead

## Sources

- [[2026-09-04-epic5-run-ledger]]
- `council/cards/EV-24.md` — the round-2/3 dispute and Skeptic gate map
