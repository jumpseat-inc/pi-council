# EV-69 residual — the designer-review gap under a recorded Verify (raw material for /wiki-ingest)

Date: 2026-09-21. Source: EV-69's step-6 product-owner ruling (job-22),
Item B, and the EV-69 deliberation record. Filed by the card's council-runner
as the ruling's step-14 condition — this is raw material, not a wiki page.

## The gap, in its own words

A card whose recorded ledger decision resolves to `Verify` runs owner +
skeptic + judge (R4) and seats no `designer`. A surface-touching card — one
that changes what a person sees, reads, or does: any visible surface, any
user-visible copy (including strings and error text), an empty state, or an
error state — can therefore route to Verify and lose the design review the
full-council path (Deliberate) guaranteed. During EV-69's deliberation this
was verified against `council/gate/decision.json`: no gate override covers
surface-touching, so nothing in the gate mechanically prevents a recorded
Verify on a surface-touching card. The acceptance's adversary and
ruling-authority constraints (skeptic + judge) are satisfied; what is lost is
design review specifically — a design-review loss, not a clause violation.

## The ruling's compensation (binding for EV-69's run)

- Step 1 records the surface-touching bit REGARDLESS of recorded mode; it
  feeds step-13 designer routing and the Verify skeptic's step-9 dispatch
  input, so branch verification looks at the rendered surface.
- The spec (docs/superpowers/specs/2026-09-21-EV-69-design.md §8) names the
  gap; this note names it for the wiki.
- Step 13 filed FLLWUP-71: the gap's home is the gate's QUESTION SET — a
  fourth user-visibility question landing under EV-72's pre-registration
  discipline with the question-set version bumped (gate-questions-1 →
  gate-questions-2). Once landed, a surface-touching change re-routes a
  recorded Verify to the full path mechanically, via the observed-set
  re-check and the escalation-only ratchet.
- Per R4 (a recorded human decision), NO designer is seated in Verify. The
  residual is accepted as TEMPORARY and NAMED — not silently closed.
