---
id: FLLWUP-3
title: Revisit empty dark and light variant shells for consumer discoverability
state: Backlog
owner: null
epic: null
goal: First-time consumers discover and correctly use the per-variant council theme customization
---

## Intent

Surfaced during EV-2's design deliberation (designer observational
follow-up). EV-2 settled the `.council.json` theme shape as per-variant
(`dark` and `light` blocks), with a minimal seed. The open question: do
first-time consumers actually discover that there are dark and light
variants to split their overrides across, or do they only ever touch one
block and assume it covers everything?

The card is deliberately observational: implement any change only if
evidence (real consumer usage, docs feedback, or a deliberate usability
probe) shows the split is undiscovered or confusing. It is a placeholder to
revisit the shape's discoverability, not a mandate to redesign it now.

Boundaries:
- The theme family name is `pi-council` and nothing else; variants
  `pi-council-dark` / `pi-council-light`.
- The `.council.json` theme section shape is settled (top-level `theme`
  sibling of `council`, per-variant `vars`/`colors`); this card may relabel
  the scaffolded documentation or add seed comments, not change the parse
  contract.
- Nothing here may reintroduce a rendering the human ruled against (status
  surface RULING 2 is untouched).

## Acceptance

- A concrete finding is recorded (either "discoverability is fine — no
  change" with the evidence, or a specific discoverability gap with a
  proposed remedy).
- If a change ships, it must be docs/seed-only per the boundaries above;
  `python3 council/validate.py` and all owner gates stay green.