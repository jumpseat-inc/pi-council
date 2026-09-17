---
title: Figure-Scoped Disclosure
type: concept
summary: A usage-figure qualifier applies to a figure, so `partial` is set iff a figure exists AND an attempt is unaccounted (`totalCost !== null && unaccountedAttempts.length > 0`); an all-unaccounted record renders only the `n/a` legend, and the legacy window shape keeps its bytes identical.
aliases: [partial legend, figure-scoped partial, unaccountedAttempts, attempts-unaccounted]
tags: [pi-council/concept, pi-council/epic9]
sources: ["[[2026-09-16-epic9-run-ledger]]"]
created: 2026-09-16
updated: 2026-09-16
---

# Figure-Scoped Disclosure

The rule that governs when a spend figure is marked incomplete (EV-42's J1/J3
ruling, closing EV-39's interim disclosure). It sits on top of
[[cost-provenance]] and [[usage-block]].

## The principle

**A qualifier qualifies a figure.** So `partial` is set iff a figure exists
*and* the walk left at least one attempt unaccounted:

```
partial := totalCost !== null && unaccountedAttempts.length > 0
literal := "attempts-unaccounted"
```

An all-unaccounted retried dispatch — new manifest shape (`attempts` list
present), `status: "unavailable"`, `reason: <worst>`, `totalCost: null` —
carries `partial: undefined` and renders the `n/a` legend only. That *is* the
disclosure. An extra `partial` qualifier naming a property of a **null** figure
would be the standing-legend principle violated in the symmetric direction (a
legend naming something not on screen), which is exactly what
[[cost-provenance]]'s coexistence rule exists to prevent.

This is distinct from the case EV-39's ruling used language about: *"a stored
figure that looks whole a month later is the falsification."* That case is a
figure that exists and is silently short; J1 is a figure that is absent. The
distinction is the whole ruling, and the dissent is named: the owner alone
argued for carrying both `unavailable` **and** `partial` on the all-unaccounted
shape, on audit-durability grounds; the ruling held that `reason` plus
`status` plus the explicit `n/a` already carry the cause and the absence.

## The copy and the stack

For the partial-with-figure case:

- Legend key stays **`partial`**; wording is
  `usage  partial = reported figure excludes unaccounted attempts`.
- Stack order is **reported row → partial legend → `n/a` legend** (the partial
  qualifies the figure; the `n/a` qualifies the absence).
- `unaccountedAttempts` stays **record-only** — the legend grammar cannot carry
  a count without widening the `usage  ` prefix convention, and the job-tree
  `attempt N/M` label already says how many attempts ran ([[per-attempt-provenance]]).

Rejected alternatives and why: `some attempts were unaccounted for` names the
failure mode rather than the figure's property; `reported figure is incomplete`
is true but vague.

## Byte-identity carve-outs

The disclosure change must not touch records it does not concern:

- **Legacy window shape** — a manifest of the form
  `{ attempt: 2, attempts: undefined }` keeps the unconditional
  `partial: "final-attempt-only"` stamp **byte-identical** to pre-EV-42 bytes.
- **Non-retried dispatch** — a single-attempt manifest carries no `attempts`
  field and its persisted record is byte-identical to pre-EV-42.

## Forward safety

Usage records are **choose-once** (never rewritten after flush, see
[[usage-store]]), so an unrecognized `partial` literal must never fail-open into
a silent drop of the qualifier: the renderer uses a total legend map
(`Record<ProviderPartialReason, string>`) with a generic "figure is not whole"
fallback.

## The disclosure contract (the five cases the spec tests)

1. Whole retried dispatch (two attempts, costs c1 + c2): `reported`,
   `totalCost === c1+c2`, `partial === undefined`, no partial legend.
2. Partial-with-figure (attempt 1 unaccounted, attempt 2 reports c2):
   `reported`, `partial: "attempts-unaccounted"`, `unaccountedAttempts: [1]`,
   `totalCost === c2`, the partial legend renders, no `n/a` legend.
3. All-unaccounted (new shape): `unavailable`, `reason: <worst>`,
   `totalCost: null`, `partial === undefined`, `cost=n/a`, the `n/a` legend
   last, **no partial legend** — the load-bearing change.
4. Legacy window carve-out: byte-identical `final-attempt-only`.
5. Non-retried byte-identity: unchanged record.

## Related

- [[cost-provenance]] — the reason vocabulary and the standing-legend principle
- [[usage-block]] — the legend grammar this extends
- [[usage-store]] — the choose-once durable records this protects
- [[per-attempt-provenance]] — the substrate that makes the figure whole
- [[spend-record]] — the two halves the block reports

## Sources

- [[2026-09-16-epic9-run-ledger]]
- `vault/raw/2026-09-17-po-ev42-step6-ruling.md`
- `vault/raw/2026-09-16-design-ev42-partial-legend.md`
- `extensions/usage-block.ts`, `extensions/usage-store.ts`
