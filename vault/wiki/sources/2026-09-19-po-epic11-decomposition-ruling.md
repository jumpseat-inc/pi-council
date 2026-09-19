---
title: PO ruling — EPIC-11 /council-setup decomposition (wave 3)
type: source
summary: product-owner's wave-3 ruling on the EPIC-11 decomposition — the epic goal stands; states become a chain-promotion cadence; cost is dropped from the tier predicates (it is unreliable catalogue metadata); the diversity floor is 3 vendor families; the tier map is a fail-loud typed parse; the headless seam is gated on `hasUI` by EV-53 and degraded by EV-52; the recommendation marker is the tool's own `(Recommended)` grammar; and a new EV-56 end-to-end falsifier is proposed.
aliases: [po-epic11-decomposition-ruling, epic11 decomposition ruling, council-setup decomposition]
tags: [pi-council/ruling, pi-council/epic11]
sources: ["[[2026-09-19-po-epic11-decomposition-ruling]]"]
created: 2026-09-20
updated: 2026-09-20
---

# PO ruling — EPIC-11 decomposition

Source: `vault/raw/2026-09-19-po-epic11-decomposition-ruling.md`. The wave-3
ruling on the `/council-setup` epic. The question held over every item: does
this serve the consumer maintainer, or the product?

## Rulings

- **§1 Epic goal:** ratified unchanged.
- **§2 States:** chain-promotion, not bulk. EV-48 `Ready` (chain head);
  EV-49–53 `Backlog` promoting on their predecessor's merge SHA; EV-54 after
  EV-52; EV-55 `Backlog` with a precondition; EV-56 proposed new `Backlog`
  child. See [[chain-promotion]].
- **§3 Cost band dropped** from the tier predicates — `CatalogueModel` has no
  cost input and pi's figure is a `catalogue-estimate` ([[cost-provenance]]);
  cost survives only as prose in a recommendation's trade-off sub-line.
- **§4 Diversity floor = 3 distinct vendor families** (the first `id` segment
  after the provider), with non-vacuity tests; reject "provider family" naming.
- **§5 Two legal profiles** (packaged frontmatter defaults + the scaffold
  `.council.json`) both validate `ok`; the floor is a per-tier capability
  predicate plus a relational ordering constraint; literal violation names
  pinned (`tier-floor`, `judge-model-collision`, `skeptic-model-collision`,
  `diversity-floor`, `unknown-model`, `invalid-thinking`).
- **§6 One typed parse that throws** — the tier map follows
  `loadCouncilConfig`, not `loadModelFloors` (a fail-open gate input is
  theatre).
- **§7 EV-50 consumer-side-only** made testable via the stray packaged
  directory; the byte-identity proof is only a regression guard.
- **§8 `preflight.sh` stays a write surface** — convention 6's data-class
  enumeration is scoped to the `/council-update` refresh path, not a blanket
  ban; the append is marker-guarded and idempotent; FLLWUP-66 is untouched.
- **§9 The headless seam is `hasUI`, not `ctx.mode`** — EV-53 (engine) gates
  the handoff, EV-52 (procedure) degrades to print-and-resume; Esc is a
  first-class refusal.
- **§10 The recommendation marker is the tool's documented grammar**
  (recommended option first, `(Recommended)` suffix, profile field in the
  header chip).
- **§11 EV-52/53 stay `Ready`** with goal amendments; "core loop seats" is
  rejected in favor of **frozen roster** (skeptic, judge, product-owner,
  steward, consolidator).
- **§12** The "Onboarding run" idiom is out of scope; the consent receipt
  folds into EV-51 by updating `scaffold.json` (see [[council-update]]); and
  EV-56 is proposed because `/council-setup` has no end-to-end falsifier (a
  defect per [[smoke-test]]).

**Nothing escalated** — no portfolio change, no permanent residual, no
recorded human decision touched.

## Related

- [[council-setup]] — the epic's planned surface
- [[council-config]], [[override-resolution]] — where the tier map and emphasis notes live
- [[chain-promotion]] — the state cadence
- [[cost-provenance]], [[gate-parity]] — why cost is not a predicate
- [[ask-user-question]] — the interview mechanism and its `(Recommended)` grammar
- [[smoke-test]] — the end-to-end-falsifier rule behind EV-56

## Sources

- [[2026-09-19-po-epic11-decomposition-ruling]]