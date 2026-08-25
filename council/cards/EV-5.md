---
id: EV-5
title: Document the council theme system
state: Ready
owner: null
epic: EPIC-1
goal: A design spec under docs/superpowers plus AGENTS.md and README entries describe the council theme system so the wiki ingest captures it
---

## Intent

This repo's convention (AGENTS.md) is design spec + implementation plan
under docs/superpowers/ before big changes, then wiki ingest after they
land. This card produces that paper trail for the theme epic:

- Design spec: docs/superpowers/specs/<date>-council-theme-design.md and a
  matching plan, covering the omp palette provenance, the pi theme schema
  mapping, the `.council.json` theme section shape, activation semantics
  (EV-3's precedence decision), and the surface-compliance rules (EV-4).
- AGENTS.md: a hard-convention entry documenting the `.council.json` theme
  key (alongside 9.5's seat overrides) and the rule that council-drawn UI
  draws only from pi theme tokens.
- README: a short section showing the scaffold `.council.json` theme snippet
  and how to recolor the council.
- Ordering: this card lands first among the children — the implementation
  cards follow the spec (each cites it). Wiki ingest is the follow-up
  procedure after implementation lands, not part of this card.

## Acceptance

- Spec + plan files exist under docs/superpowers/ and cover the sections
  above, with the activation decision recorded.
- AGENTS.md documents the `.council.json` theme key and the token-only
  drawing rule.
- README includes the theme customization snippet.
- `python3 council/validate.py` still passes after the docs edits (no card
  or board drift).
