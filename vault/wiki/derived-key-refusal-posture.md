---
title: Derived-Key Refusal Posture
type: concept
summary: The D1 ruling from EPIC-23 — when a derived key (e.g. an epic read from a card face's `epic:` field) is null or missing, the dispatch fails loud (throws, naming the actor) rather than proceeding un-substituted; and "byte-identical" in an acceptance criterion governs the enumerated fields, not the dispatch's occurrence.
aliases: [derived key posture, fail-loud derived key, null epic posture, D1 ruling]
tags: [pi-council/concept, pi-council/process]
sources: ["[[2026-09-24-epic23-run-ledger]]"]
created: 2026-09-24
updated: 2026-09-24
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

## Related

- [[procedure-context-injection]] — the composer that raised the question
- [[council-runner]] — the dispatch whose input the key feeds
- [[facilitator]] — the house hard-error convention
- [[deterministic-merge-check]] — another mechanical fail-loud posture

## Sources

- [[2026-09-24-epic23-run-ledger]]
- `council/cards/EV-90.md` (D1 ruling, recorded verbatim)