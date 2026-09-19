---
title: PO ruling — EV-42 step-6 (figure-scoped partial)
type: source
summary: product-owner rules EV-42's J1 — `partial` is figure-scoped (set iff a figure exists and an attempt is unaccounted), so an all-unaccounted retried dispatch carries no `partial` and renders only the `n/a` legend; the new partial-with-figure literal is `attempts-unaccounted`, the legacy `final-attempt-only` window shape stays byte-identical, and the legend copy is fixed.
aliases: [po-ev42-step6, ev42 step6 ruling, figure-scoped partial ruling]
tags: [pi-council/ruling, pi-council/epic9]
sources: ["[[2026-09-17-po-ev42-step6-ruling]]"]
created: 2026-09-20
updated: 2026-09-20
---

# EV-42 — product-owner step-6 ruling

Source: `vault/raw/2026-09-17-po-ev42-step6-ruling.md`. Ruled while the card
was `Deliberating`; the `goal` and `Acceptance` are amendable.

## J1 — `partial` is figure-scoped

```
partial := totalCost !== null && unaccountedAttempts.length > 0
literal := "attempts-unaccounted"   // plural
```

For a retried dispatch where **every** attempt is unaccounted (new shape:
`attempts` present, `status:"unavailable"`, `reason:<C3 worst>`,
`totalCost:null`), the persisted provider sibling carries **`partial:
undefined`** — the `n/a` legend alone is the disclosure. The falsification
class EV-39 named is "a figure that *looks whole*"; an explicitly absent figure
does not. `unaccountedAttempts: number[]` stays record-only; the cause of
absence lives in `reason` (the C3 vocabulary). See [[figure-scoped-disclosure]].

**Legacy window carve-out preserved:** `attempt > 1 && attempts === undefined`
⇒ `partial: "final-attempt-only"`, byte-identical to today
(`usage-store.ts:443-448`).

## J3 — copy for the new partial-with-figure case

- Literal `attempts-unaccounted` (plural).
- Legend copy: **`usage  partial = reported figure excludes unaccounted attempts`**.
- Stack order: reported row → partial legend → `n/a` legend.
- A total legend map with a generic fallback is the forward-safety discipline
  (choose-once records must never fail-open into a silent drop).

## Dissent and escalation

Owner alone dissented (wants a non-undefined `partial` on the all-unaccounted
shape); not adopted — `reason` already carries the cause, and a qualifier on a
null figure inverts the standing-legend principle. **No steward escalation** —
the card goal is unchanged, no permanent residual is accepted, and the legacy
carve-out preserves today's bytes.

## Disclosure contract the spec must test

1. Whole retried dispatch → `partial === undefined`.
2. Partial-with-figure → `partial: "attempts-unaccounted"`,
   `unaccountedAttempts: [1]`, new legend.
3. All-unaccounted (new shape) → `partial === undefined`, `cost=n/a`, only the
   `n/a` legend (**load-bearing change**).
4. Legacy carve-out → byte-identical `final-attempt-only`.
5. Non-retried dispatch → byte-identical to pre-EV-42.

## Related

- [[figure-scoped-disclosure]] — the shipped rule this ruling settled
- [[per-attempt-provenance]] — the `attempts` substrate
- [[usage-store]], [[usage-block]], [[cost-provenance]] — the record/legend/reason surfaces
- [[2026-09-17-epic9-residual-run-ledger]] — the run this ruling belongs to

## Sources

- [[2026-09-17-po-ev42-step6-ruling]]