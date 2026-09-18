---
id: EPIC-13
title: Metered deliberation routing — a System One gate decides Deliberate, Verify, or Direct per card
state: Backlog
owner: null
epic: null
goal: Deliberation becomes a metered, routed resource instead of the default — a typed System One gate routes each card to Deliberate, Verify, or Direct — so the cheap cards stop paying the deliberation tax while spending council tokens becomes a deliberate choice about the cards that actually need judgment.
---

## Intent

Routing already happens on every card, but as an unrecorded guess:
`council/procedures/council.md` step 1 asks a person to call a card full-council
or mechanical, and nothing about that call is metered, journaled, or checkable
afterwards. The two paths it selects differ by a step function — a mechanical
card skips steps 2–6 and still pays one owner, one branch-verification, and one
judge dispatch, while a full-council card pays those plus the independent pass,
the exchange rounds, and the synthesis. Neither number is aggregated to the unit
the decision is about, which is the card, so the guess is never contradicted by
anything. This epic makes the spending decision explicit, recorded, and
calibrated: a gate evaluates a small fixed set of atomic questions against a
deliberately packed card state, a pure function in code turns those answers into
an execution mode, and every decision is journaled so thresholds can be tuned
from evidence instead of taste.

The human-visible surface is the existing `/features-new` step-3 approval gate.
Each drafted card gains one informational line naming the resolved mode and the
one-line basis for it, so the human sees the routing decision at the moment they
already review the card — no new gate, no new state, and no `Needs Human` stop.
The second observable surface is what actually runs: a card's execution mode
determines which seats are dispatched, and the mode is recorded on the run
substrate so the routing is auditable after the fact from records alone.

Two roles are invariant: the branch-verification dispatch and the fresh-context
goal evaluator are never dropped by the gate, in any mode that dispatches them.
What the gate meters is the deliberation panel — its composition and its size
for every other role. A reduced panel must still contain an adversary and a
ruling authority. Cost discipline is the point, not cheapness: the gate's own
spend is reported from the provider's response, its decisions are recomputable
from the ledger without re-running the model, and no policy change lands before
there is a measured baseline to motivate it.

## Acceptance

Observed as met when: a gate call is journaled per card with the state hash,
question-set version, every answer with its probabilities and confidence, the
resolved mode, and the policy version, and the resolved mode is re-derivable
from that record alone; the three modes are distinguishable from the run
manifests of the cards they executed; a cost-per-card and cost-per-epic baseline
exists from existing run manifests before any routing change ships; the gate's
own spend is recorded with a reported basis rather than estimated; a threshold
change is only effective when a pre-registration record naming the evidence that
motivated it is present; the decision function is provable offline from fixtures
with no network in the default suite; and no call is ever made to the
`chat/completions` path with the pinned decisions model.