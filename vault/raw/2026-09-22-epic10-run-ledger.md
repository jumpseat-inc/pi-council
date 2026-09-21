---
title: 2026-09-22 EPIC-10 Run Ledger
date: 2026-09-22
kind: run-ledger
epic: EPIC-10
run: /features-deliver EPIC-10
result: all 7 children merged and Done; no HALT, no Needs Human
---

# 2026-09-22 EPIC-10 Run Ledger

The autonomous `/features-deliver EPIC-10` run delivered all seven children of
the re-cut epic **"Follow-up review decided by the typed TypeSafe Jev gate"**
to `main`. This is the run's durable record; it is the source for the
`2026-09-22-epic10-run-ledger` wiki summary.

## Phase 0 and Phase 1

- `council_preflight` pass; `bash council/preflight.sh` `PASS: preflight clean`;
  all nine seats resolved by name.
- The active `main` ruleset (`23557528`) requires 1 approving review + linear
  history; the human granted four run-scoped rulings up front: **P1-1** admin
  merge (`--squash --admin --match-head-commit`), **P1-RP** direct record pushes
  to `main`, **P1-3** no pause through merges, **P1-4** run EV-84's live arms.
  **P1-2** delegated EV-82's rendered-line byte order to the seated `designer`
  (intake R8).
- All seven cards routed **Deliberate** (no recorded ledger decision → fallback),
  so every merge required all five criteria.

## What shipped

| Card | PR | Merged SHA | Deliverable |
|---|---|---|---|
| EV-78 | #97 | `9285538` | packaged `council/gate/followup/{questions,decision}.json`; whole-file first-hit override; fail-loud loader |
| EV-79 | #98 | `ddf9077` | pure `decideFollowup(answers, policy)` — floors → overrides → composite, fail-safe `File` |
| EV-80 | #99 | `e0fd6f5` | `buildFollowupState(candidate, repoRoot, siblings, boardPath)` — board/open-card/sibling packing, caps 2000/22000/6000 |
| EV-81 | #100 | `690127b` | `runFollowupGate` — Jev transport reuse with human-bound fail-closed posture |
| EV-82 | #101 | `277036b` | step-13 record/render at the pre-write confirm gate; `runFollowupReview` composition site |
| EV-83 | #102 | `6a5d70c` | Phase 3 + `council-runner` escalation routing of the follow-up decision |
| EV-84 | #103 | `03925df` | end-to-end falsifier (active/off/unreachable arms + live arm) |

`package.json` advanced **0.28.0 → 0.33.0**; the default suite reached
**1453 pass / 6 skip** by EV-84. Every merge was SHA-pinned via
`gh pr merge <PR> --squash --admin --match-head-commit <X>`, with the `gates`
workflow read on the `workflow` field at the pinned head and re-verified green
on the merged SHA. Record pushes rode P1-RP.

## The rulings

Nine `product-owner` rulings were dispatched (8 step-6/step-13 + the recut
intake). No escalation ever reached `steward`.

- **Recut intake** (`vault/raw/2026-09-21-po-epic10-recut-ruling.md`, R0–R9) —
  one shared `gate.mode` governs both decision domains; vocabulary exactly
  `File | Merge | Drop`; `Merge` is the decision's own outcome (merge-before-draft
  is subsumed); `RETIRED` is not reused for a dropped candidate; the
  `## Merged from:` format and the unavailable-state render ride EV-82; and
  step 13's board/sibling **dedup pass is unconditional in every mode** (R9).
- **`vault/raw/2026-09-21-po-ev78-thresholds-schema-ruling.md`** — `thresholds`
  is the named-key object `{merge, drop}` with strict `merge < drop`; override
  `disposition` is restricted to `{Merge, Drop}`.
- **`vault/raw/2026-09-21-po-ev79-step13-followup-confirmation.md`** — FLLWUP-96
  confirmed (both domains); the `sideProbability` range residual is EV-81's.
- **`vault/raw/2026-09-21-po-ev80-state-packing-ruling.md`** — board cap
  16,000 → 22,000 (caps sum 30,000 < 32,000); cards dir derived from
  `dirname(boardPath)`.
- **`vault/raw/2026-09-22-po-ev81-step13-confirmation.md`** — FLLWUP-99 re-routed
  to EPIC-13; FLLWUP-100 confirmed; FLLWUP-96's face corrected.
- **`vault/raw/2026-09-22-po-ev82-step13-confirmation.md`** — FLLWUP-101/102
  confirmed (101 narrowed to the six person-facing predictions; 102 re-grounded
  off an external trigger).
- **`vault/raw/2026-09-22-po-ev83-confirmation-authority-ruling.md`** — the
  load-bearing ruling: a recorded engine-minted decision is the disposition
  **source, never confirmation**; the runner escalates each candidate for
  **ratification**; `advisory` → `ESCALATION`.
- **`vault/raw/2026-09-22-po-ev84-step13-noul-shape-ruling.md`** — FLLWUP-104
  filed; FLLWUP-100 gains Amendment D.

## Findings (what the run learned about the shipped gate)

The EPIC-10 falsifier reached into the shipped card gate and found it **inert
in production**:

- **The noul wire shape drifted.** `typesafe/jev-1.13-20260917` returns noul
  answers as `{"type":"noul","noul":<p>}` while `sideProbability`/`followupFloor`
  read `answer.probability`; `parseDecisionsResponse` passes payloads verbatim.
  Every live gate and follow-up call fails closed with `invalid-response`
  (`File`/`Deliberate`). Filed as **FLLWUP-104** (EPIC-13).
- **The recorded-decision fast path is dead.** `runGate` writes the *tuning*
  `policyVersion` while `resolveRoute` compares the *decision* policy's version,
  so every recorded line classifies as `policyDrift` and routes full. Filed as
  **FLLWUP-99** (EPIC-13).
- **Card-gate answers have never carried usable probabilities** — 8/8 live lines
  died at `decide()`. Filed as **FLLWUP-100** (EPIC-13), whose cause list
  Amendment A predicted and Amendment D confirms.

The fail-closed direction held in every case (`File`/`Deliberate`, zero `Drop`,
zero cards before approval) — the safe side is the human.

## Process learnings

- **Runner-merges-itself.** Per the human's Phase-1 choice, each `council-runner`
  executed the deterministic merge check and the merge itself, then the step-12
  `Done` record; the orchestrator independently re-verified each merged SHA,
  PR state, card state, and the `gates` check afterward. (The historical
  procedure text reads the orchestrator as the step-11 executor — recorded as
  variance, not a ruleset change.)
- **Confirmation round-trips are the cost of a safe write path.** All seven cards
  produced step-13 candidates; each was held and routed to `product-owner` for
  ratification before any card was written. FLLWUP-69 records that no code
  enforces the write path, so the guarantee is prose plus a ruling seat.
- **Union-merge reconcile recurred on 3 of 7 cards**, including the documented
  spurious-conflict class (the squash already carried the pre-branch record
  commits); repaired by containment check + `git rebase --onto origin/main`,
  never a `reset --hard`.
- **Provider-error retries all recovered** (upstream idle timeouts on EV-78/83/84
  and a stalled principal on EV-82); no card lost work.
- **The 9 ruling-source files under `vault/raw/` were untracked** through all
  seven cards and were committed with the run's final record.
- **No `HALT`, no `Needs Human`, no `steward` escalation.** `validate.py` clean
  at every board write.

## Follow-ups filed

FLLWUP-96…104 (96 `EPIC-10`, 97/98 `EPIC-10`, 99/100 `EPIC-13`, 101/102/103
`EPIC-10`, 104 `EPIC-13`), each its own card, each confirmed by `product-owner`
before writing.

## Open at run close

- EPIC-10's epic card remains `Backlog` although all children are `Done` —
  epic closure is a portfolio act (steward/human).
- `/wiki-ingest` owed for the EPIC-10 follow-up lineage.
- Merged feature branches `ev-78…ev-84` remain on the remote.