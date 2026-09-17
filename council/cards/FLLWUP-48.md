---
id: FLLWUP-48
title: Suite-cost budget for the live pty and -p falsifier arms
state: Deliberating
owner: null
epic: EPIC-9
goal: The default bun test suite's wall-clock budget is documented, and the live pty and -p falsifier arms run within it or are gated behind an opt-in.
---

## Intent

EV-41's live pty and `-p` parent-turn arms cost roughly 30 to 95 seconds
inside the default `bun test` suite. It is a measurement and retention
question rather than a defect — binding only if suite time becomes binding —
so steward dispositioned it as a `Backlog` residual.

## Orchestrator rulings (Phase 1, binding)

Recorded human decisions for this run. Immutable and binding on every seat,
`steward` included; a runner that hits one applies it and cites the ruling
rather than re-asking.

- **Card-specific (FLLWUP-48).** The `goal` is **disjunctive** — documenting a
  wall-clock budget and gating the live pty/`-p` arms behind an opt-in are
  *both* valid deliveries. The choice between them is a card-level
  open-judgment call; it is not settled here. Where the documented budget
  lives is a design/writing question for the deliberation. If the deliberated
  design introduces **user-visible copy beyond internal developer
tooling/documentation**, that copy is open-judgment under the authority map —
  the runner returns `ESCALATION` with the drafted string rather than shipping
  an unruled one.
- **Run-wide Phase-1 rulings (binding; apply and cite, do not re-ask):**
  - Scope = the nine promoted EPIC-9 residuals; EPIC-9 stays `Done`.
  - Sequencing ruled by `steward`; this is the **ninth and final** card of the
    run.
  - Merge = `gh pr merge <PR> --squash --admin --match-head-commit <X>` per
    `features-deliver.md`; all five deterministic criteria must hold.
  - **R1** — union-merge reconcile is the sanctioned non-fast-forward repair,
    never force.
  - Step-13 follow-up confirmation is re-homed to `product-owner`: draft,
    never write an unapproved follow-up, and never dispatch `product-owner`
    from this container.
- **Known artifacts carried into this card (binding notes, not rulings):**
  - The FLLWUP-27 preflight branch-freshness `FAIL` recurs mid-card once a
    record commit advances `origin/main` past the branch cut; it is
    stale-by-construction and never weakens a gate. The step-11 re-run set is
    `bunx tsc --noEmit` / `bun test` / `python3 council/validate.py`.
  - Criterion 2 is `gh pr checks <PR> --json name,state,workflow`, keyed on
    the `workflow` field; `gates` must appear `SUCCESS`.
  - Owner gates are met in full regardless of change size.
  - If this card adds or moves any live arm, it must note the run-wide
    **zero-new-live-arms** constraint FLLWUP-49's deliberation recorded
    (`council/cards/FLLWUP-49.md` O10; spec §“FLLWUP-48 adjacency”): the
    dedup refactor added zero live arms, so this card's baseline is the
    current arm set, unchanged.

## Run record (features-deliver)

### Step 1 — classification (facilitator)

- **Path: full council.** The card's `goal` admits more than one reasonable
  design — and the card face itself makes the disjunction explicit: the suite's
  wall-clock budget is *documented* and the live arms *run within it* **or**
  are *gated behind an opt-in*. Those are two different deliverables (a
  measurement-plus-documentation card vs. a test-hygiene/gating card), with a
  real tradeoff between suite confidence and suite cost. That is
  `spec-ambiguous` plus `design-judgment`, either of which is sufficient for a
  full council per council.md step 1. It is **not** cross-seam in the
  repo-area sense (test files, CI, and developer documentation; no engine
  module, no `.council.json` surface, no rendered council surface). The owner
  and `product-owner` share the open-judgment decision per the card-specific
  ruling above; this container routes it and decides nothing.
- **Surface-touching: no (recorded).** The deliverable is internal developer
  tooling and/or documentation (a budget statement and/or an opt-in gate on
  the live falsifier arms). It changes no person's product-visible surface,
  no user-visible copy, no empty state, no error state. No `designer` is
  seated. Recorded honestly as a boundary call rather than a settled fact: if
  the deliberated design required **user-visible copy beyond internal developer
  tooling/documentation**, the card-specific ruling makes that copy
  open-judgment — this container returns `ESCALATION` with the drafted string
  rather than shipping it unruled.
- **Rulings applied (Phase 1, binding), not reweighed:** the card-specific
  disjunction/copy boundary above; scope = the nine promoted EPIC-9 residuals
  with EPIC-9 staying `Done`; sequencing is `steward`'s (**ninth and final**
  card); merge = `gh pr merge <PR> --squash --admin --match-head-commit <X>`;
  **R1** union-merge reconcile never force; step-13 confirmation re-homed to
  `product-owner` (draft only — this container never dispatches
  `product-owner`). None of these is re-asked.
- **Seat resolution (`<seat_resolution_check>`):** `owner`, `principal`,
  `skeptic`, `consolidator`, `judge` — the seats this card dispatches — all
  present in `council/agents/` (nine files: `consolidator.md`,
  `council-runner.md`, `designer.md`, `judge.md`, `owner.md`, `principal.md`,
  `product-owner.md`, `skeptic.md`, `steward.md`) and in the installed package
  clone (`~/.pi/agent/git/github.com/jumpseat-inc/pi-council/council/agents/`);
  no repo-local `.pi/agents/` override directory exists, so nothing shadows
  them. Ruling seats (`product-owner`, `steward`) are never dispatched by this
  container per `<escalation_contract>`.
- **Environment:** step 0 preflight skipped per the autonomous-run
  substitution (Phase 0 cleared it for the epic). `python3 council/validate.py`
  → `All council artifacts valid`. Local `main` == `origin/main` at
  `b70aa0d` (`FLLWUP-40` `8dbe038`, `FLLWUP-43` `e25b813`, `FLLWUP-42`
  `aff1101`, `FLLWUP-41` `9adca28`, `FLLWUP-44` `05ae348`, `FLLWUP-45`
  `2f79142`, `FLLWUP-47` `216ea34`, `FLLWUP-49` `323abdc` all merged); working
  tree clean. No `Needs Human` state and no outstanding ruling on this card —
  deterministic merge check criterion 5 holds at card start.
- **Gate set for this repo** (authoritative: `.github/workflows/gates.yml`;
  `docs/gates/GATE-EVIDENCE.md` does not exist here): `bunx tsc --noEmit`,
  `bun test`, `python3 council/validate.py`, plus
  `bash council/preflight.sh FLLWUP-48` (the FLLWUP-27
  stale-by-construction line aside).
- **Baseline arm set carried in (FLLWUP-49 record, `job-22.5` O10):**
  `ev40-headless` 3, `ev40-live-gates` 5, `ev41-retry-e2e` 5,
  `ev43-reachability` 2. FLLWUP-49 added **zero** live arms; that baseline is
  what this card measures and budgets.
- **Evidence base read before this decision:** `council/procedures/council.md`
  and `features-deliver.md` in full; `council/cards/FLLWUP-48.md`,
  `FLLWUP-49.md`, `FLLWUP-47.md`, `EV-41.md`, `EPIC-9.md`; the EV-41/EV-43
  live arms (`test/ev41-retry-e2e.test.ts` (c) headless `-p` timeout 180s and
  (c) TUI pty timeout 300s; `test/ev43-reachability.test.ts` live arm timeout
  300s); `test/ev40-live-gates.test.ts`; `.github/workflows/gates.yml`;
  `README.md:315`; `vault/raw/2026-09-16-epic9-run-ledger.md`;
  `council/validate.py`.
- **Step 2 is opened below:** state `Deliberating` on the card and board,
  `validate.py` clean, then `owner` + `principal` dispatched independently on
  the card alone (no `designer` — not surface-touching).
