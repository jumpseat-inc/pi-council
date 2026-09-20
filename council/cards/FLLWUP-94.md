---
id: FLLWUP-94
title: Consider naming the config home in the /council-gate status read literal
state: Backlog
owner: null
epic: EPIC-14
goal: Decide whether the /council-gate status read literal (gateStatusLine, extensions/council-gate-cmd.ts) should name `.council.json` — the designer's P9 position was that every operator-facing form names the config home, while the converged literal deliberately names only the write/no-op forms — or whether the shipped literal stays and the wiki page's prose location (shipped by EV-77, documented-as-is) remains the canonical pointer; a surface-touching decision, page copy and literal change (if any) pinned in the established test/ev77-gate-docs.test.ts pattern.
---

## Intent

Filed from EV-77's step 13, carrying the designer P9 residual (recorded on the
EV-77 card face and documented-as-is on the wiki page): whether the status read
should name `.council.json`. EV-77's scope ruled the literal itself out of the
docs card (page copy only; J1: `extensions/gate.ts` — and by extension the
command literals — untouched). The residual stayed genuinely open: an operator
who runs the status read sees no file named, and must consult the wiki to learn
where the gate state lives.

## Acceptance

- A ruling (open-judgment; surface-touching copy decision) on the literal:
  name the config home, or keep it terse with the wiki as the pointer.
- Whichever way it goes, the decision is pinned: the literal's copy is
  byte-pinned with a source-drift guard, and the wiki page's prose matches the
  shipped surface exactly (the EV-77 page already carries the
  documented-as-is framing to update).
