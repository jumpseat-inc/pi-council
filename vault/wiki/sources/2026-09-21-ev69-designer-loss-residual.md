---
title: 2026-09-21 EV-69 Designer-Loss Residual
type: source
summary: The EV-69 step-6 ruling's named residual — a surface-touching card routed Verify seats no designer, a design-review loss (not a clause violation) accepted temporarily and closed by the FLLWUP-71 user-visibility question under EV-72 pre-registration.
aliases: [ev69-designer-loss-residual, designer-review gap, Verify designer loss]
tags: [pi-council/source, pi-council/epic13]
sources: []
created: 2026-09-21
updated: 2026-09-21
---

# 2026-09-21 EV-69 Designer-Loss Residual

Raw material filed by the EV-69 council-runner as the ruling's step-14 condition — the
design-review gap under a recorded Verify, named for the wiki.

## The gap

A card whose recorded ledger decision resolves to `Verify` runs owner + skeptic + judge (R4) and
**seats no `designer`**. A **surface-touching** card — one that changes what a person sees, reads,
or does (any visible surface, user-visible copy including strings and error text, an empty state,
or an error state) — can therefore route to Verify and lose the design review the full-council
path (Deliberate) guaranteed. Verified against `council/gate/decision.json`: no gate override
covers surface-touching, so nothing mechanically prevents a recorded Verify on a surface-touching
card. The adversary/ruling-authority constraints are satisfied; what is lost is design review
specifically — **a design-review loss, not a clause violation**.

## The compensation (binding)

- Step 1 records the surface-touching bit **regardless of recorded mode**; it feeds step-13
  designer routing and the Verify skeptic's step-9 dispatch input, so branch verification looks
  at the rendered surface.
- The residual is disclosed in the spec and, per the PO ruling, closed by **`FLLWUP-71`**: a
  fourth `userVisibility` question in the gate's question set, landing under EV-72's
  pre-registration discipline with the set version bumped (`gate-questions-1` →
  `gate-questions-2`). Once landed, a surface-touching change re-routes a recorded Verify to the
  full path mechanically, via the observed-set re-check and the escalation-only ratchet.
- Per R4 (a recorded human decision), **no designer is seated in Verify**. The residual is
  accepted as temporary and named, never silently closed.

## Related

- [[metered-deliberation-routing]] — the Verify panel and its residual
- [[designer]] — the seat the loss concerns
- [[2026-09-21-po-ev69-step6-ruling]] — the Item B ruling that filed this residual
- [[engineering-board]] — residual cards

## Sources

- `vault/raw/2026-09-21-ev69-designer-loss-residual.md`
- `council/cards/EV-69.md`, `council/cards/FLLWUP-71.md`