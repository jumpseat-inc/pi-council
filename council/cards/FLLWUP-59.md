---
id: FLLWUP-59
title: Mechanically derive or police the shape witness's token allowlist
state: Deliberating
owner: null
epic: EPIC-9
goal: The shape witness's provider-token list is derived or policed mechanically, so a future token retirement cannot silently create a miss without the hand-maintained regex being updated.
---

## Run record (features-deliver / FLLWUP-59 — EPIC-9 residuals run 2)

### Step 1 — promotion + classification (facilitator)

- **Promotion (`Backlog` → `Ready`) applied, not asked.** Phase-1 run-2 scope
  ruling (`EPIC-9.md` run-2 block): `FLLWUP-50` through `FLLWUP-60` "are this
  run's delivery scope". `FLLWUP-59` is the **tenth of eleven** in the
  `steward` job-1 build-order ruling ("…then harness hygiene (`55`, then `56`,
  whose live arm must precede the budget cards), then the allowlist policing
  (`59`) over the settled harness, and the CI runaway backstop (`58`) last,
  sized against the final arm set"). Run-2 precedent (FLLWUP-56, run-1
  precedent 5608ed1): the autonomous promotion moves the residual card to its
  working state at its runner's start. The card's creation was already
  ratified by `product-owner` (job-29, FLLWUP-48 step-13 draft 2 confirmed) —
  the promotion-ratification power re-homed per `features-deliver.md`'s
  authority map. `Deliberating` set at step 2's opening per council.md.
- **Path: full council.** The `goal` is itself a disjunction — "**derived or
  policed** mechanically" — and each branch admits more than one reasonable
  mechanism (deriving the token list from a maintained single source vs
  policing the regex's coverage against an independent enumeration). That is
  `spec-ambiguous` plus `design-judgment`; either suffices per council.md
  step 1. Not cross-seam in the repo-area sense (the witness test file and
  possibly adjacent test-hygiene files only).
- **Surface-touching: no (recorded).** The deliverable is internal test
  machinery in `test/faux-provider-shape.test.ts` (and at most adjacent test
  files): no product-visible surface, no user-visible copy, no empty state,
  no error state. No `designer` is seated. A design concern on this card
  would be filed as a step-13 follow-up, not used to seat `designer` on a
  mechanical concern.
- **Rulings applied here (cited, not re-asked):** Phase-1 run-2 scope governs
  the promotion; `steward` job-1 governs the build-order position; **R2**
  governs the later merge (`gh pr merge <PR> --squash --admin
  --match-head-commit <X>`, all five deterministic criteria); **R3** governs
  record pushes (direct to `main`, admin identity, disclosed in this card's
  record and the run ledger); the run-wide **zero-new-live-arms** constraint
  (FLLWUP-49 O10) applies — any change here must add zero live arms; and
  step-13's draft-then-confirm gate is re-homed to `product-owner` as
  **pre-write** (this container drafts, never writes an unapproved follow-up,
  and never dispatches `product-owner`). No card-specific Phase-1 ruling
  exists beyond R2/R3.
- **Seat resolution (`<seat_resolution_check>`):** `owner`, `principal`,
  `skeptic`, `consolidator`, `judge` — the seats this card dispatches — all
  present in `council/agents/` (nine files); no repo-local `.pi/agents/`
  override directory exists, so nothing shadows them. Ruling seats
  (`product-owner`, `steward`) are never dispatched by this container per
  `<escalation_contract>`.
- **Environment:** step 0 preflight skipped per the autonomous-run
  substitution (Phase 0 cleared it for the epic). `python3
  council/validate.py` → `All council artifacts valid`. Local `main` ==
  `origin/main` at `ed8cc84` (FLLWUP-60, 57, 51, 53, 50, 54, 55, 56 all
  merged; working tree clean). No `Needs Human` state and no outstanding
  ruling on this card — deterministic merge check criterion 5 holds at card
  start. `council/agents/` is the packaged set; `.council.json` carries the
  run-stable seat-model overrides (run-config-stability).
- **Gate set for this repo** (authoritative: `.github/workflows/gates.yml`):
  `bunx tsc --noEmit`, `bun test`, `python3 council/validate.py`, plus
  `bash council/preflight.sh FLLWUP-59` (the FLLWUP-27
  stale-by-construction line aside, when it recurs).
- **Settled-harness facts carried in (from the orchestrator, neutral — no
  seat position attached):** the token regex in
  `test/faux-provider-shape.test.ts` test 6 is a hand-maintained allowlist
  that already missed once (the retired-path source-comment token at
  `test/ev41-retry-e2e.test.ts:325`, found by FLLWUP-48 and fixed on that
  card without widening the regex per its principal's refinement, which
  recorded the allowlist-decay as a finding — this card). Since then the
  harness changed materially: FLLWUP-49 promoted the shared faux-provider
  station (`test/faux-provider/`), FLLWUP-55 collapsed the smoke driver onto
  `test/faux-provider/pty_kit.py` and added the two-sided stdlib-only guard
  (shape tests 9–11), and FLLWUP-56 added `test/ev41-seat-child-live.test.ts`
  plus the `EV40_TOOLCALL_WAIT` knob (`harness.ts:175`). The mechanism this
  card delivers must cover the settled harness and keep those guards green.
- **Evidence base read before this decision:** `council.md` and
  `features-deliver.md` in full; `council/cards/FLLWUP-59.md`,
  `FLLWUP-48.md` (the full run record, including step-13 draft 2 and the
  principal's allowlist-decay refinement); `EPIC-9.md` (run-2 Phase-1 block);
  `test/faux-provider-shape.test.ts` in full; `test/faux-provider/` station
  listing; `vault/wiki/index.md` (no page covers the token allowlist; the
  nearest pages are `test-suite-budget.md` and `smoke-test.md` — this card's
  durable artifact may warrant a page at step 14).
- **Step 2 is opened below:** state `Deliberating` on the card and board,
  `validate.py` clean, then `owner` + `principal` dispatched independently on
  the card alone (no `designer` — not surface-touching).

## Intent

`test/faux-provider-shape.test.ts`'s token regex is a hand-maintained
allowlist; FLLWUP-48 found it had already missed once (the retired-path
source-comment token at `ev41-retry-e2e.test.ts:325`), fixed on that card
without widening the regex per its principal's refinement. A mechanical
derivation or police of the token list prevents the next token retirement
from silently creating a new miss.

Approved by `product-owner` (job-29) from FLLWUP-48's step-13 draft 2.
