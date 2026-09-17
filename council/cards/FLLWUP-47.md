---
id: FLLWUP-47
title: Documented red-base convention for falsifier evidence
state: Deliberating
owner: null
epic: EPIC-9
goal: A written convention fixes what a falsifier's red-at-base evidence must record and how it is compared across cards.
---

## Intent

Red-at-base is core falsifier evidence, and its counts varied with harness
copy depth on EV-41 (an optional second base measured 7 fail/1 error by the
owner versus 1 fail/1 error by the Skeptic). A written convention is a
different subject from the suite-cost budget, so steward dispositioned it as
its own `Backlog` residual.

## Orchestrator rulings (Phase 1, binding)

Recorded human decisions for this run. Immutable and binding on every seat,
`steward` included; a runner that hits one applies it and cites the ruling
rather than re-asking.

- **Card-specific (FLLWUP-47).** Where the convention should live is a
  design/writing question for the deliberation. If the convention would
  introduce **user-visible copy beyond internal documentation**, that copy is
  open-judgment under the authority map — the runner returns `ESCALATION`
  with the drafted string rather than shipping an unruled one.
- **Run-wide Phase-1 rulings (binding; apply and cite, do not re-ask):**
  - Scope = the nine promoted EPIC-9 residuals; EPIC-9 stays `Done`.
  - Sequencing ruled by `steward`; this is the **seventh** card of the run.
  - Merge = `gh pr merge <PR> --squash --admin --match-head-commit <X>` per
    `features-deliver.md`; all five deterministic criteria must hold.
  - **R1** — union-merge reconcile is the sanctioned non-fast-forward repair,
    never force.
  - Step-13 follow-up confirmation is re-homed to `product-owner`: draft,
    never write an unapproved follow-up, and never dispatch `product-owner`
    from this container.
- **Known artifacts carried into this card (binding notes, not rulings):**
  - The FLLWUP-27 preflight branch-freshness `FAIL` recurs mid-card once a
    facilitator record commit advances `origin/main` past a branch cut; the
    step-11 re-run set is `tsc` / `bun test` / `validate.py`, and the FAIL is
    recorded verbatim, never reclassified, never used to weaken a criterion.
  - Criterion 2 is `gh pr checks <PR> --json name,state,workflow` keyed on
    `workflow`; the `gates` workflow must appear `SUCCESS` on the PR head SHA.

## Run record (features-deliver)

### Step 1 — classification (facilitator)

- **Path: full council.** The card's `goal` fixes an outcome — a *written*
  convention governing what a falsifier's red-at-base evidence must record and
  how it is compared across cards — but leaves open every design question that
  produces it: where the convention is written (packaged seat prose, a
  procedure, a durable repo document, the scaffold template set, the wiki), who
  it binds, whether it is normative or advisory, and what a cross-card
  comparison actually keys on given that a red count is a function of the
  base tree plus the harness copy depth (EV-41). That is spec-ambiguous and
  design-judgment, either of which is sufficient for a full council per
  council.md step 1. It is **not** cross-seam in the repo-area sense (no
  engine module, no `.council.json` surface, no rendered council surface).
- **Surface-touching: no (recorded).** The deliverable is internal
  documentation and/or packaged prose read by seats and engineers; it changes
  no person's visible surface, and adds no user-visible string, empty state,
  or error state. No `designer` is seated on this card. Recorded honestly as a
  boundary call rather than a settled fact: if the deliberated design required
  **user-visible copy beyond internal documentation**, the orchestrator's
  Phase-1 card ruling makes that copy open-judgment — this container returns
  `ESCALATION` with the drafted string rather than shipping it unruled.
- **Rulings applied (Phase 1, binding), not reweighed:** the card-specific
  copy/escalation boundary above; scope = the nine promoted EPIC-9 residuals
  with EPIC-9 staying `Done`; sequencing is `steward`'s (seventh card); merge
  = `gh pr merge <PR> --squash --admin --match-head-commit <X>`; step-13
  follow-up confirmation is re-homed to `product-owner` (draft, never write an
  unapproved follow-up); **R1** union-merge reconcile as the sanctioned
  non-fast-forward repair, never force. None of these is extended to a
  question it did not answer.
- **Seat resolution (`<seat_resolution_check>`):** this card dispatches
  `owner`, `principal`, `skeptic`, `consolidator`, and `judge`. All five
  resolve from the packaged seat set
  (`/home/tista/.pi/agent/git/github.com/jumpseat-inc/pi-council/council/agents/*.md`,
  each file's `name:` matching its filename); this checkout has **no
  `.pi/agents/`** directory (`ls -d .pi/agents` → `No such file or
  directory`), so nothing shadows them and no repo-local override exists. No
  `designer` (not surface-touching). `product-owner` / `steward` are
  escalation-only and are never dispatched by this container. No `Unknown
  seat` is possible on the seats named here.
- **Environment (facilitator-read, first-hand):** main checkout clean
  (`git status --short` empty); `HEAD = origin/main =
  a55db92609094c791f235366c0f385a8fb21e029`. The six earlier cards of this run
  are merged with their records ancestors of `HEAD`: FLLWUP-40 `8dbe038`,
  FLLWUP-43 `e25b813`, FLLWUP-42 `aff1101`, FLLWUP-41 `9adca28`, FLLWUP-44
  `05ae348`, FLLWUP-45 `2f79142`. `bash council/preflight.sh FLLWUP-47` →
  `PASS: preflight clean`, exit 0. This card is `Ready` at the start of the
  run; no `Needs Human` state and no outstanding ruling — deterministic merge
  check criterion 5 holds at the start of the card.
- **Gate set for this repo (authoritative; `docs/gates/GATE-EVIDENCE.md` does
  not exist here):** `bunx tsc --noEmit`, `bun test`, `python3
  council/validate.py` (AGENTS.md §Commands + `.github/workflows/gates.yml`,
  whose `gates` job runs exactly the last three). `council/preflight.sh
  FLLWUP-47` is run as a card-aware check, but its branch-freshness clause
  (FLLWUP-27) is known to `FAIL` by construction once a facilitator record
  commit advances `origin/main` past a branch cut; per the standing
  known-artifact note the step-11 re-run set is `tsc` / `bun test` /
  `validate.py`. This repo defines no database/import/server gate;
  `COUNCIL_INTEGRATION=1` stays gated and is not run. Criterion 2 is
  `gh pr checks <PR> --json name,state,workflow` keyed on `workflow`; `gates`
  must appear `SUCCESS`.
- **Grounded facts carried into deliberation (inputs, not a settled design;
  the Council verifies them at this tree):**
  - **No red-at-base convention exists anywhere today.** `grep -rn
    "red-at-base\|pre-mechanism\|base run\|red at base"` across
    `council/agents/*.md` and `council/procedures/*.md` matches nothing (the
    only `red` tokens in those files are `closed-red`, the `red flag`
    escalation warning, and generic "a red test" prose). There is no
    normative text for a seat to follow.
  - **Packaged seat/procedure prose is regression-guarded**, by
    `test/prose.test.ts`: no bare `deliver.md`; no `GATE-EVIDENCE.md` in
    `features-deliver.md`; no "registry"/"named agent" framing; no hardcoded
    product domain; and **no pinned tech stack** — the forbidden pattern is
    `/\b(bun|bunx|typescript|tsc)\b|bun test|bun run|@ts-expect-error/i`
    over every packaged seat and procedure body. Any convention sited in seat
    prose must therefore be stack-neutral ("the repo's test command", not a
    named runner) or it breaks the suite.
  - **`docs/gates/GATE-EVIDENCE.md` does not exist in this repo.** `owner.md`
    names it only as an example ("where the repo keeps an authoritative gate
    document"). The wiki records it was deliberately dropped from
    `features-deliver.md` as source-repo-specific
    ([[2026-08-24-bugfix-seat-prose]], fix 2, locked by `test/prose.test.ts`).
  - **`vault/` cannot be authored directly.** council.md step 14 forbids
    hand-editing anything under `vault/`; the wiki is written only through
    `/wiki-ingest`. `vault/wiki` has no page for red-at-base evidence today
    (`grep -rl falsifier vault/wiki/` finds smoke-test/headless-pi/
    transcript pages, none for red-base).
  - **The scaffold is the only channel to consumer repos.**
    `council/scaffold/` ships `council/board.md`, `council/cards/_template.md`,
    `council/preflight.sh`, `council/validate.py`, `vault/CLAUDE.md`,
    `vault/wiki/index.md`, `vault/wiki/log.md`, `.council.json`, copied
    non-clobberingly (AGENTS.md convention #6; `scaffoldInto` never overwrites
    an existing file). Anything intended to travel to consuming repos has to
    ride that template set.
  - **`docs/` holds only per-card working documents today**
    (`docs/superpowers/{specs,plans}/`); there is no durable top-level `docs/`
    convention file in this repo.
  - **The EV-41 discrepancy, verbatim from the card's own record:** the
    optional second pre-mechanism base `3e39e66` measured `7 fail / 1 error`
    in the owner's report versus `1 fail / 1 error` in the Skeptic's
    reproduction; "the difference tracks how much of `test/ev40-harness/` was
    copied into the base worktree (that directory does not exist at
    `3e39e66`), so it is a property of the copy depth, not of the falsifier.
    The **required** base (`3a3773f`) reproduced exactly" (EV-41 card, step 9).
  - **The only standing statement of the red-base obligation** is EPIC-9's
    steward ruling applied on EV-41: EV-41 "cannot land red through the merge
    gate, so its 'starts red' obligation is met by running the authored
    falsifier against the merge-base / pre-mechanism base in a worktree and
    observing red there, then green at the head. The base-commit red run is
    recorded as evidence; **no red test lands**" (EV-41 card, step 1). It
    names no required fields, no base-selection rule, and no comparison rule —
    precisely the gap this card's `goal` closes.
- **Deliberation opened (step 2).** `owner` and `principal` are dispatched in
  parallel with this card only (no designer; not surface-touching); no seat
  sees the other's position in round 1.
