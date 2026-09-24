---
id: FLLWUP-119
title: Repair the EPIC-* smoke-fixture card faces so real model-driven flows can dispatch them
state: Done
owner: null
epic: EPIC-25
goal: The EPIC-* smoke-fixture card faces (`council/fixtures/features-deliver/EPIC-*`) resolve and dispatch cleanly under a real model-driven `/features-deliver` flow — `cardEpicKey(EPIC-1)` returns the epic key without throwing, the runner flow reaches its first seat dispatch on fixture cards, and `bun test` stays green on the merged tree.
---

## Intent

FLLWUP-114's live-smoke phase dispatched a real `council-runner` through an
epic flow, and the smoke fixtures' `EPIC-*` card faces do not
resolve/dispatch cleanly under the real model-driven flow: the fixture faces
predate the frontmatter-scoped epic parse, so their `epic:` frontmatter is
not in the shape the current engine derives epic keys from. The card
repairs the fixture faces so the live-smoke phase is dispatchable end to
end — not worked around by dispatching EV-2 instead.

Grounding: FLLWUP-114's skeptic O1 is `closed-red` with a settling probe
(`cardEpicKey(EPIC-1)` throws; fixture face `epic: null`, authored 2026-08-25,
a month before the refusal landed in `14f244f`). FLLWUP-114 worked around it
by dispatching EV-2, and the fixture faces remain undispatchable.

Filed from FLLWUP-114's step-13 gate (candidate 1, draft title "Repair the
EPIC-* smoke-fixture card faces so real model-driven flows can dispatch
them"), product-owner-ratified `File` 2026-09-26 (confirming ruling, job-8;
recorded gate basis: composite 0.30 < merge threshold 1.00 — active mode).

## Acceptance

1. The `EPIC-*` fixture card faces' frontmatter is repaired so
   `cardEpicKey` derives the epic key without throwing — the closed-red
   probe no longer throws on any fixture face.
2. The live-smoke phase (FLLWUP-114's SMOKE_PHASE=7 falsifier) dispatches a
   real `council-runner` through an epic flow against a repaired fixture
   face, and the phase reaches its first seat dispatch without the
   FLLWUP-114 workaround (dispatching EV-2 instead of the fixture card).
3. `bun test`, `bunx tsc --noEmit`, and `python3 council/validate.py` stay
   green on the merged tree.
