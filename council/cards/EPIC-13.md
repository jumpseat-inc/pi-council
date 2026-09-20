---
id: EPIC-13
title: Metered deliberation routing — a System One gate decides Deliberate, Verify, or Direct per card
state: Done
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

## Phase 1 Rulings (recorded before dispatch — binding for this run)

- **R1 — merge authorization, every card in this run.** The human authorized
  the run-scoped admin bypass: the merge is `gh pr merge <PR> --squash --admin
  --match-head-commit <X>`, where `<X>` is the exact head SHA the `gates`
  workflow `SUCCESS` (merge-check criterion 2) was read against. This
  authorization is for this run only and is not extended to any later run; a
  SHA mismatch is a HALT, not a retry.
- **R2 — run scope and order.** The human ruled: deliver the full epic, all 13
  child cards, in dependency order — EV-60, EV-61, EV-62, EV-63, EV-64, EV-65,
  EV-68, EV-66, EV-67, EV-69, EV-70, EV-71, EV-72. No card is retired or
  descoped without a steward ruling via the escalation contract.
- **R3 — packaged gate default.** The packaged `council/gate/policy.json` ships
  `mode: "off"` (no gate call, no ledger line by default); consumers opt in per
  repo via a repo-local `policy.json`. Tests that exercise the gate set the
  mode explicitly; the default is never relied on to be on.
- **R4 — panel seat inclusion.** Verify = owner + skeptic + judge (an explicit
  adversary and ruling authority, plus the fresh-context goal evaluation; no
  branch-verification dispatch, principal, consolidator, or designer). Direct =
  owner only; the test suite is its only gate. Deliberate = the full panel.
  These sets satisfy EV-63's constraints: every set contains the owner, every
  reduced set contains an adversary and a ruling authority, and Direct contains
  no judge.
- **R5 — promotion cadence (product-owner, escalated by the EV-60 runner).**
  Chain-promotion, not bulk: EV-60 was promoted to `Ready` now as chain head;
  each later `Backlog` child promotes the moment its predecessor in R2's order
  has its merge SHA on local `main` and `python3 council/validate.py` is clean,
  in one commit with its board row. EV-65 and EV-68 stay `Ready` as recorded.
  Full ruling: `vault/raw/2026-09-20-po-epic13-promotion-ruling.md`.
- **R6 — run-scoped record push (corrected mid-run).** The human authorized
  this run's direct step-12 record commit to `main` on the admin identity
  (card `Done` + board transition), per `council.md` step 12. Recorded after the
  run had already performed two such pushes (EV-60 `b6d5ce5`, EV-61 `1fdc2de`) —
  a Phase-1 omission now corrected; this ruling covers those two and the rest of
  the run. Run-scoped, not extended to any later run. Force-push, rewind, and
  discarding a side remain forbidden.

## Closure

- Closed `Done` by `steward` (job-29) on observed acceptance: all 13 children
  (EV-60…EV-72) merged and `Done`, each through the deterministic five-criteria
  merge check; `package.json` at `0.28.0`; suite green (1213 pass / 5 skip /
  0 fail); `validate.py` clean; packaged gate `mode: "off"` per R3.
- Ten step-13 follow-ups filed, human-approved, all `epic: EPIC-13` Backlog:
  FLLWUP-71…80.
- Named residuals with closing cards: EV-69 designer-review loss (FLLWUP-71),
  EV-63 `verify > 0` gap (FLLWUP-74), EV-66 static pending window (FLLWUP-75).
- Documentation residual routed by the ruling: the `metered-deliberation-routing`
  wiki page and index line still read "Planned — Backlog / not shipped"; fold
  into the next wiki ingest or FLLWUP-73.
