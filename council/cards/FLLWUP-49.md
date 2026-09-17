---
id: FLLWUP-49
title: Promote the offline faux-provider harness into a shared smoke helper
state: Deliberating
owner: null
epic: EPIC-9
goal: The offline faux-provider harness is a shared test helper that both the parent-turn and seat-dispatch provider-error tests import, with no duplicated harness copy.
---

## Intent

EV-40's `test/ev40-harness/` (headless plus pty, with fail-count, arm,
context-log, and SIGINT knobs) proved its leverage by producing closed-red
findings, but EV-41 and EV-42 currently carry duplicated harness copies. A
refactor with no in-flight consumer belongs in `Backlog`, per the steward
disposition.

## Orchestrator rulings (Phase 1, binding)

Recorded human decisions for this run. Immutable and binding on every seat,
`steward` included; a runner that hits one applies it and cites the ruling
rather than re-asking.

- **Card-specific:** none on the card face. The design (which harness lives
  where, its exported surface, and which consumers import it) is for the
  deliberation, steps 2–6; this container decides nothing behind it.
- **Run-wide Phase-1 rulings (binding; apply and cite, do not re-ask):**
  - Scope = the nine promoted EPIC-9 residuals; EPIC-9 stays `Done`.
  - Sequencing ruled by `steward`; this is the **eighth** card of the run.
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

## Run record (features-deliver)

### Step 1 — classification (facilitator)

- **Path: full council.** The card's `goal` fixes the outcome (one offline
  faux-provider harness, imported as a shared test helper by both the
  parent-turn and the seat-dispatch provider-error tests, with no duplicated
  harness copy) but leaves every design question that produces it open: which
  harness is the canonical one, where it lives, what its exported surface is,
  which consumers are re-pointed at it, and how much of the older copy is
  collapsed rather than deleted. That is `spec-ambiguous` per council.md
  step 1, which is sufficient for a full council on its own. It is **not**
  cross-seam in the repo-area sense (test-only plus an `ev43/` scratch tree;
  no engine module, no `.council.json` surface, no rendered council surface).
- **Surface-touching: no (recorded).** The deliverable is test/falsifier code
  and scratch extensions; it changes no person's visible surface, no
  user-visible copy, no empty state, no error state. No `designer` is seated.
  Recorded as a boundary call: if the deliberated design required
  **user-visible copy**, the orchestrator's Phase-1 card rulings make that copy
  open-judgment — this container would return `ESCALATION` with the drafted
  string rather than ship it unruled.
- **Premise to be tested in deliberation (not decided here).** The card's
  `Intent` states that "EV-41 and EV-42 currently carry duplicated harness
  copies." At the card-start tree (`main` == `origin/main` = `b95c71e`) that is
  **false as read**: EV-42's merged squash (`952d5c1`) added no harness or pty
  file, and `test/ev41-retry-e2e.test.ts` already imports
  `test/ev40-harness/harness-headless.ts`. The duplication that does exist at
  HEAD is (a) `ev43/` — a full predecessor harness
  (`ev43-falsifier-extension.ts`, `falsifier-headless.ts`, `falsifier-tui.py`)
  still imported by `test/ev43-reachability.test.ts`; (b) `test/ev41-tui.py`, a
  pty adaptation of `test/ev40-harness/tui-retry.py`; and (c) the three pty
  screen-model copies across `ev43/`, `test/ev40-harness/`, `test/ev41-tui.py`.
  Whether the goal's premise as written is a goal defect, a stale-Intent
  wording, or a mislabel is for the deliberation/Skeptic to resolve; the
  facilitator routes it, and does not decide it.
- **Seat resolution (`<seat_resolution_check>`):** `owner`, `principal`,
  `skeptic`, `consolidator`, `judge` — the seats this card dispatches — all
  present in `council/agents/` and in the installed package clone
  (`~/.pi/agent/git/github.com/jumpseat-inc/pi-council/council/agents/`); no
  repo-local `.pi/agents/` override exists, so nothing shadows them. Ruling
  seats (`product-owner`, `steward`) are never dispatched by this container.
- **Environment:** step 0 preflight skipped per the autonomous-run
  substitution (Phase 0 cleared it for the epic). Run for information only on
  the main checkout: **not run** by this container; `python3 council/validate.py`
  → `All council artifacts valid`; `main` clean and equal to `origin/main` at
  `b95c71e` (`FLLWUP-40` `8dbe038`, `FLLWUP-43` `e25b813`, `FLLWUP-42`
  `aff1101`, `FLLWUP-41` `9adca28`, `FLLWUP-44` `05ae348`, `FLLWUP-45`
  `2f79142`, `FLLWUP-47` `216ea34` all merged). No `Needs Human` state and no
  outstanding ruling on this card — deterministic merge check criterion 5
  holds at card start.
- **Gate set for this repo** (authoritative: `.github/workflows/gates.yml`;
  `docs/gates/GATE-EVIDENCE.md` does not exist here): `bunx tsc --noEmit`,
  `bun test`, `python3 council/validate.py`, plus `bash council/preflight.sh
  FLLWUP-49` (the FLLWUP-27 stale-by-construction line aside).
- **Evidence base read before this decision:** `council/procedures/council.md`
  and `features-deliver.md` in full; `test/ev40-harness/harness-headless.ts`,
  `test/ev40-harness/ev40-harness-extension.ts`, `test/ev41-retry-e2e.test.ts`,
  `test/ev41-tui.py`, `test/ev43-reachability.test.ts`, the `ev43/` tree,
  `test/stub-child.ts` consumers, `git show --stat 952d5c1` (EV-42) and
  `653ce01` (EV-41), `council/cards/EV-41.md`, `EV-42.md`, `EPIC-9.md`,
  `vault/raw/2026-09-16-epic9-run-ledger.md`, and `council/validate.py`.
- **Step 2 is opened below:** state `Deliberating` on the card and board,
  `validate.py` clean, then `owner` + `principal` dispatched independently on
  the card alone (no `designer` — not surface-touching).
