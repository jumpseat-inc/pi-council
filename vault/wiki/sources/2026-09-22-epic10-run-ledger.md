---
title: 2026-09-22 EPIC-10 Run Ledger
type: source
summary: The EPIC-10 run — the typed follow-up review (File/Merge/Drop) shipped end to end (7 Deliberate merges, PRs #97–#103, v0.28.0→v0.33.0), the confirmation-authority ruling (a recorded decision is the source, never the human confirmation), and the discovery that the shipped card gate is inert in production (noul wire-shape drift, dead recorded-decision fast path).
aliases: [epic10 run ledger, EPIC-10 ledger, 2026-09-22-epic10-run-ledger]
tags: [pi-council/source, pi-council/epic10]
sources: []
created: 2026-09-22
updated: 2026-09-22
---

# 2026-09-22 EPIC-10 Run Ledger

The autonomous `/features-deliver EPIC-10` run delivered all seven children of
the **re-cut** epic "Follow-up review decided by the typed TypeSafe Jev gate" to
`main` — 7 Deliberate merges (PRs #97–#103), no `HALT`, no `Needs Human`, no
[[steward]] escalation.

## What shipped

The follow-up review is now decided by the same typed System One mechanism as
the card gate, in its own domain ([[followup-decision-gate]]): packaged
`council/gate/followup/{questions,decision}.json` behind [[override-resolution]]
(EV-78); the pure `decideFollowup` with floors → overrides → composite and a
fail-safe `File` (EV-79); `buildFollowupState` packing candidate + board/open
cards + same-run siblings under caps 2000/22000/6000 (EV-80); `runFollowupGate`
reusing the Jev transport with a human-bound fail-closed posture (EV-81); the
step-13 record/render at the pre-write confirm gate plus the `runFollowupReview`
composition site (EV-82); the Phase 3 + [[council-runner]] escalation routing
(EV-83); and the end-to-end falsifier (EV-84).

`package.json` went **0.28.0 → 0.33.0**; the default suite reached **1453 pass /
6 skip**. All seven routed [[metered-deliberation-routing|Deliberate]] (no
recorded ledger decision → fallback), each passed all five
[[deterministic-merge-check]] criteria, each merge `--match-head-commit`-pinned;
record pushes rode a Phase-1 P1-RP [[record-push-discipline]] authorization
granted before the first push.

## The confirmation-authority ruling

The run's load-bearing new idea: under `gate.mode: active`, a recorded
engine-minted disposition is the **disposition source, never the human
confirmation**. In-container confirmation belongs to a ruling seat reached via
`ESCALATION`, and a resolved `active` decision is **ratified** rather than
re-decided; `advisory` escalates as information-only; `off` decides from
scratch. The safe side is the human, and the authority map is exhaustive — a
model call cannot be a row in it. See [[confirmation-authority]]. The cost is
visible: all seven cards produced step-13 candidates and each was held for a
[[product-owner]] round-trip before any card was written.

## What the run learned about the shipped gate

The EPIC-10 falsifier reached back into the shipped card gate and found it
**inert in production** ([[metered-deliberation-routing]] Residuals):

- **Noul wire-shape drift** — the decisions API returns
  `{"type":"noul","noul":<p>}` while the engine reads `probability`, so every
  live call fails closed (`FLLWUP-104`, EPIC-13).
- **Dead recorded-decision fast path** — `runGate` writes the *tuning*
  `policyVersion` while the router compares the *decision* policy's version, so
  every recorded line routes full (`FLLWUP-99`, EPIC-13).
- **No usable probabilities ever** — 8/8 live card-gate lines died at
  `decide()` (`FLLWUP-100`, EPIC-13).

The fail-closed direction held throughout ([[gate-parity]]-adjacent: `File` /
`Deliberate`, zero `Drop`, nothing written before approval).

## Process learnings

- **Runner-merges-itself** — per the human's Phase-1 choice, each
  [[council-runner]] executed the deterministic check and the merge, then the
  step-12 `Done` record; the orchestrator independently re-verified every merged
  SHA and the `gates` check afterward. Recorded as run variance, not a ruleset
  change (see [[deterministic-merge-check]]).
- **Reconcile + retries + untracked sources** — [[union-merge-reconcile]]
  recurred on 3 of 7 cards; provider-error retries all recovered; the nine
  `vault/raw/` ruling docs stayed untracked until the run's final record.

## Follow-ups

FLLWUP-96…104 — 96 `EPIC-10`, 97/98 `EPIC-10`, 99/100 `EPIC-13`, 101/102/103
`EPIC-10`, 104 `EPIC-13` ([[card-id-allocation]], [[engineering-board]]).

## Related

- [[followup-decision-gate]] — the subsystem this run shipped
- [[confirmation-authority]] — the ruling that governed its writes
- [[step-13-followup-surface]] — the surface it renders
- [[metered-deliberation-routing]] — the twin domain whose gate it found inert
- [[deterministic-merge-check]] — applied seven times, all Deliberate
- [[product-owner]] — the ruling seat; [[steward]] — never reached

## Sources

- `vault/raw/2026-09-22-epic10-run-ledger.md`
- `council/cards/EV-78.md`…`EV-84.md`, `council/cards/EPIC-10.md`
- `vault/raw/2026-09-2*-po-*.md` (the nine rulings)