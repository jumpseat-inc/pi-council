---
title: Derived-Key Refusal Posture
type: concept
summary: The D1 ruling from EPIC-23 — when a derived key (e.g. an epic read from a card face's `epic:` field) is null or missing, the dispatch fails loud (throws, naming the actor) rather than proceeding un-substituted; and "byte-identical" in an acceptance criterion governs the enumerated fields, not the dispatch's occurrence.
aliases: [derived key posture, fail-loud derived key, null epic posture, D1 ruling]
tags: [pi-council/concept, pi-council/process]
sources: ["[[2026-09-24-epic23-run-ledger]]", "[[2026-09-24-epic24-run-ledger]]", "[[2026-09-25-epic25-run-ledger]]"]
created: 2026-09-24
updated: 2026-09-25
---

# Derived-Key Refusal Posture

When a component derives a value from another artifact — EV-90's
`composeRunnerInput` reads a card face's `epic:` field to resolve
`features-deliver.md`'s epic-key substitution ([[procedure-context-injection]]) —
what should happen when the derived value is null or missing: fail loud, or
proceed with the substitution unresolved?

## The D1 ruling

**Fail loud (throw), naming the actor.** The alternatives were rejected:

- **No-throw, un-substituted overlay** — writes literal `$ARGUMENTS`
  placeholders into operative context, failing the goal that the bodies be
  *substituted*.
- **No-throw, omitted overlay** — worse: `features-deliver.md` carries the run's
  **authority map** (the complete re-homing of the human's reserved powers), so a
  runner dispatched without it is an autonomy-shaped dispatch stripped of its
  authorization context. A governance hazard, not a capability.

The posture follows the house norm that a missing prerequisite is a **hard error,
not a degraded result** (the `Unknown seat` error, the `allowedSeats` refusal).

## The AC5-scope corollary

The card's acceptance criterion "Everything else about the dispatch is
byte-identical: same seat, model, tools, timeouts" was being read to forbid the
throw (the throw removes a currently-working, if undocumented, epic-null
dispatch). **Ruled: "byte-identical" governs the enumerated fields, not the
dispatch's occurrence.** "Byte-identical" is a data claim — an *occurrence* has no
bytes — and the colon construction makes the list appositive. This is the general
rule: an acceptance clause phrased as byte-identity is read against the fields it
names, never as a clause about whether an action happens at all.

## Why it is worth ruling once

A derived-key null is a recurring shape (any substitution keyed off another
artifact). The asymmetry favors throw: a wrong throw is a loud, named refusal an
operator reports immediately; a wrong no-throw is a silently degraded run — the
expensive direction to discover. Cheapest-to-reverse: flipping to no-throw is one
branch plus one test delta.

## EPIC-24 witness (2026-09-24)

FLLWUP-115 hardened the derivation this posture governs: `cardEpicKey` now
scopes the epic match to the **frontmatter** block (the same strip the packaged
procedure scan uses), and the three D1 refusals keep byte-for-byte behavior. The
corpus pin was amended from the false "no card body contains the key label"
claim to a **behavioral-equivalence** pin (whole-file derivation ==
frontmatter-scoped derivation, same key or same throw, per card), green on the
current corpus and red exactly when the scoping changes a derivation
([[engineering-board]]). Two residuals were filed from the live run: FLLWUP-117
(the throw-site JSDoc drift) and FLLWUP-118 (the shared `FRONTMATTER_RE` byte-0
anchor). Witness: [[2026-09-24-epic24-run-ledger]].

## EPIC-25 witness (2026-09-25) — the fixture faces repaired

FLLWUP-119 repaired the `EPIC-*` smoke-fixture card faces so `cardEpicKey` no
longer throws on them: their frontmatter resolves a key, and the SMOKE_PHASE=7
live falsifier reached its first seat dispatch without the EV-2 workaround. This
closes the FLLWUP-114 `closed-red` probe (`cardEpicKey(EPIC-1)` threw) that the
D1 fail-loud posture had made visible. Two residuals remain (FLLWUP-122
real-harness stale-ctx pin, FLLWUP-123 post-merge live re-run), now under
EPIC-26. Witness: [[2026-09-25-epic25-run-ledger]].

## Related

- [[procedure-context-injection]] — the composer that raised the question
- [[council-runner]] — the dispatch whose input the key feeds
- [[facilitator]] — the house hard-error convention
- [[deterministic-merge-check]] — another mechanical fail-loud posture
- [[2026-09-24-epic24-run-ledger]] — the hardening + behavioral-equivalence pin

## Sources

- [[2026-09-24-epic23-run-ledger]]
- `council/cards/EV-90.md` (D1 ruling, recorded verbatim)