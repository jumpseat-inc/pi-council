---
id: FLLWUP-58
title: Runaway timeout-minutes backstop on the gates CI job
state: Ready
owner: null
epic: EPIC-9
goal: The gates workflow fails bounded on a runaway test step via a loose timeout-minutes, sized so it never pre-empts an arm's own ceiling, with the CI-timeout policy documented.
---

## Intent

`product-owner`'s FLLWUP-48 ruling 2 deferred a `gates.yml` `timeout-minutes`
as "CI-timeout policy is a separate question (different rationale, revision
path, and interaction with the per-arm `spawnSync` ceilings)" — a deferral,
not a rejection. The deciding arithmetic is recorded on FLLWUP-48 and in the
test-suite-budget page: the TUI arm's own `300_000` ceiling at
`ev41-retry-e2e.test.ts:362` exceeds any ~180s suite budget, so a
budget-keyed step timeout masks attribution. This card owns the runaway
backstop variant, sized loose enough never to pre-empt an arm.

Approved by `product-owner` (job-29) from FLLWUP-48's step-13 draft 1.

## Run record (features-deliver / FLLWUP-58 — EPIC-9 residuals run 2)

### Step 1 — promotion + classification (facilitator)

- **Promotion (`Backlog` → `Ready`) applied, not asked.** Phase-1 run-2 scope
  ruling (`council/cards/EPIC-9.md` run-2 block): `FLLWUP-50` through
  `FLLWUP-60` "are this run's delivery scope". `FLLWUP-58` is the
  **eleventh and final** card of the `steward` job-1 build-order ruling
  ("…the allowlist policing (`59`) over the settled harness, and the CI
  runaway backstop (`58`) last, sized against the final arm set"). Run-2 precedent (FLLWUP-59, which itself cited run-1 precedent
  `5608ed1`): the autonomous promotion moves the residual card to its working
  state at its runner's start. The card's creation was already ratified by
  `product-owner` (job-29, FLLWUP-48 step-13 draft 1 confirmed) — the
  promotion-ratification power re-homed per `features-deliver.md`'s authority
  map.
- **Path: full council.** The `goal`'s sizing decision — a loose
  `timeout-minutes` "sized so it never pre-empts an arm's own ceiling" —
  admits more than one reasonable design, and the deferred FLLWUP-48 item
  carried exactly two positions on it (owner: ~10 min, 6.4× headroom;
  principal: the 300s TUI-ceiling arithmetic argues the cutoff must sit well
  above it). That is `spec-ambiguous` plus `design-judgment`; either
  suffices per council.md step 1. Not cross-seam in the repo-area sense (one
  CI workflow file plus developer documentation only).
- **Surface-touching: no (recorded).** The deliverable is internal CI
  tooling and developer documentation: no product-visible surface, no
  user-visible copy (platform-generated GH Actions failure text is not our
  copy), no empty state, no error state. No `designer` is seated. A design
  concern on this card would be filed as a step-13 follow-up, not used to
  seat `designer`.
- **Card-specific constraint recorded (FLLWUP-59 step-13 ruling R2,
  `vault/raw/2026-09-19-po-fllwup59-step13-ruling.md`):** `fetch-depth: 0` on
  the `gates.yml` checkout step (added by FLLWUP-59, PR #76) **stays**, and
  any edit introducing a non-full fetch depth makes FLLWUP-59's
  truncated-history canary CI-load-bearing. A constraint, not a goal
  amendment — the falsifier work is not folded into this card. Preserved in
  every edit to `gates.yml` this card makes.
- **Rulings applied here (cited, not re-asked):** Phase-1 run-2 scope governs
  the promotion; `steward` job-1 governs the build-order position (last,
  sized against the final arm set); **R2** governs the later merge
  (`gh pr merge <PR> --squash --admin --match-head-commit <X>`, all five
  deterministic criteria); **R3** governs record pushes (direct to `main`,
  admin identity, disclosed); the run-wide **zero-new-live-arms** constraint
  (FLLWUP-49 O10) applies — a `timeout-minutes` line binds the existing run
  and is neither an arm nor a move, but the final arm set is what the
  sizing is checked against; and step-13's draft-then-confirm gate is
  re-homed to `product-owner` as **pre-write** (this container drafts, never
  writes an unapproved follow-up, and never dispatches `product-owner`).
- **Seat resolution (`<seat_resolution_check>`):** `owner`, `principal`,
  `skeptic`, `consolidator`, `judge` — the seats this card dispatches — all
  present in `council/agents/` (nine files) and in the installed package
  clone (`~/.pi/agent/git/github.com/jumpseat-inc/pi-council/council/agents/`);
  no repo-local `.pi/agents/` override directory exists, so nothing shadows
  them. Ruling seats (`product-owner`, `steward`) are never dispatched by
  this container per `<escalation_contract>`.
- **Environment:** step 0 preflight skipped per the autonomous-run
  substitution (Phase 0 cleared it for the epic). `python3
  council/validate.py` → `All council artifacts valid`. Local `main` ==
  `origin/main` at `b0af8a4` (FLLWUP-59's merge `e1b7801` and its step-13
  ruling record are the newest history; FLLWUP-50–57 and 59 all merged;
  working tree clean). No `Needs Human` state and no outstanding ruling on
  this card — deterministic merge check criterion 5 holds at card start.
- **Gate set for this repo** (authoritative: `.github/workflows/gates.yml`):
  `bunx tsc --noEmit`, `bun test`, `python3 council/validate.py`, plus
  `bash council/preflight.sh FLLWUP-58` (the FLLWUP-27
  stale-by-construction line aside, when it recurs).
- **Final arm set carried in (verified on this tree, `b0af8a4`):**
  `ev40-headless` 3, `ev40-live-gates` 5, `ev41-retry-e2e` 5,
  `ev43-reachability` 2, `ev41-seat-child-live` 2 — **17 live arms**, the
  set `steward` job-1 sized this card against. The deciding arithmetic is
  verified in the tree: the TUI arm's enforced ceiling is `300_000` at
  `test/ev41-retry-e2e.test.ts:362` (measured actual ≈32s per
  `vault/wiki/test-suite-budget.md`); the largest suite-envelope figure in
  play is the 180s **drift threshold** (PO FLLWUP-48 ruling 1 — descriptive,
  not normative). The backstop must be sized loose enough to never pre-empt
  any arm's own ceiling.
- **Evidence base read before this decision:** `council.md` and
  `features-deliver.md` in full; `council/cards/FLLWUP-58.md`,
  `FLLWUP-48.md` (full run record, including PO ruling 2's deferral and
  step-13 draft 1), `FLLWUP-59.md` (run record and its step-13 ruling
  pointer); `.github/workflows/gates.yml` (current: `fetch-depth: 0` on the
  checkout step, bare `bun test`, **no** `timeout-minutes` anywhere);
  `vault/wiki/test-suite-budget.md` (envelope 101.2s, per-arm table, the
  "no suite-level ceiling — and none is added" line this card now amends);
  `EPIC-9.md` (run-2 Phase-1 block).
- **Step 2 is opened below:** state `Deliberating` on the card and board,
  `validate.py` clean, then `owner` + `principal` dispatched independently
  on the card alone (no `designer` — not surface-touching).
