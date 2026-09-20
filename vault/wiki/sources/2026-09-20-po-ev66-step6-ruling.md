---
title: 2026-09-20 PO EV-66 Step-6 Ruling
type: source
summary: product-owner (job-16) rules EV-66's pending line is the sole copy with zero lines after any settle, `touchedFiles: []` is a no-claim (gate-state.ts untouched), and `features-new.md` must draft seat-authored `## Acceptance` text on every card before the gate call.
aliases: [po-ev66-step6-ruling, EV-66 failure-invisibility ruling]
tags: [pi-council/source, pi-council/epic13, pi-council/product-owner]
sources: []
created: 2026-09-20
updated: 2026-09-21
---

# 2026-09-20 PO EV-66 Step-6 Ruling

product-owner ruling (job-16) on EPIC-13 card EV-66 (the advisory gate at `/features-new`
intake), over items Q(a), Q(c), Q(d).

## Q(a) — failure invisibility stays EV-67's job

EV-66's copy surface stays **exactly** the pending line `gate: advisory call in progress · <id>`;
it gains no failure and no duration wording, and the render returns **zero lines after settle in
every post-settle state**. The reason is mechanism, not taste: a failure is only known once the
transport resolves, at which point EV-66's own acceptance requires an empty surface, and
[[metered-deliberation-routing]]'s EV-67 already owns the failure line at the approval gate. The
named residual — the pending window is honest but static — became `FLLWUP-75`.

## Q(c) — absent `touchedFiles` is a no-claim

`extensions/gate-state.ts` (EV-64's frozen contract) is **not** touched. The call site passes
`touchedFiles: []`, and the copy states plainly: at intake **no touched-file claim is made**;
`[]` is how "no claim" is carried in a contract with no absent slot; EV-69's dispatch-time
re-check against the *observed* set is the enforcement. "Never defaulted to `[]`" is struck from
the record. Rejected Option 1 (accepting absent) as a one-way door on a `Done` card's contract,
pre-baseline.

## Q(d) — `## Acceptance` must be drafted before the gate call

`council/procedures/features-new.md` is amended so **every drafted card (children and the epic)
carries seat-authored, human-presented `## Acceptance` text before the gate call**. Otherwise the
packer throws on 100% of drafted cards and EV-66's own goal is unsatisfiable. The fix is procedure
text only — `validate.py` is not touched (it has no Acceptance rule; adding one would invalidate
~32 legacy cards), and no existing card is back-edited. The legacy-cards-without-Acceptance
residual was routed to EV-69.

## Related

- [[metered-deliberation-routing]] — the gate and its packing contract
- [[engineering-board]] — the card shape (`## Acceptance`) and goal immutability
- [[gate-parity]] — the placement rule
- [[2026-09-21-po-ev69-step6-ruling]] — the run's next ruling (record-count correction)
- [[product-owner]] — the ruling seat

## Sources

- `vault/raw/2026-09-20-po-ev66-step6-ruling.md`
- `council/cards/EV-66.md`