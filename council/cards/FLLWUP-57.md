---
id: FLLWUP-57
title: Suite determinism under a catalogue-valid ambient COUNCIL_EVAL_MODEL
state: Ready
owner: null
epic: EPIC-9
goal: A test run of test/ with a catalogue-valid ambient COUNCIL_EVAL_MODEL exported passes, and any test that resolves the ambient as its effective model is isolated or pinned, so bun test is shell-independent for every catalogue-valid value.
---

## Intent

FLLWUP-40's oracle and its step-9/step-11 probes exercised the ambient unset, a
plain unknown-model value, and an unknown-model `:thinking`-suffixed value — all
of which take the loud-refusal path. A *catalogue-valid* ambient value resolves
as the effective model instead and was not exercised across the whole suite.
Whether any remaining test in `test/` resolves an exported catalogue-valid
ambient as its effective model, and thus still makes `bun test`
shell-dependent, is the narrow but real residual `product-owner` (job-29)
approved from FLLWUP-40's step-13 candidate A.

## Run record (features-deliver / FLLWUP-57 — EPIC-9 residuals run 2)

### Step 1 — promotion + classification (facilitator)

- **Promotion (`Backlog` → `Ready`) applied, not asked.** Phase-1 run-2 scope
  ruling (`EPIC-9.md` run-2 block, 284ced2): `FLLWUP-50` through `FLLWUP-60`
  "are this run's delivery scope", and the human's dispatch input orders this
  card **third** of eleven (steward build-order ruling, job-1, `FLLWUP-60`
  merged `aa1923f` and `FLLWUP-52` retired under R4 already complete). Run-1
  precedent (5608ed1) and run-2 precedent (FLLWUP-60's promotion commit
  `08fdb83`): the autonomous promotion moves the residual card to its working
  state at its runner's start, no separate promotion round-trip. Cited
  ruling: Phase-1 run-2 **scope**. `python3 council/validate.py` clean after
  the edit.
- **Path: mechanical.** The deliverable is confined to `test/` files (plus at
  most test-helper code), the `goal` admits one reasonable design — the same
  isolate-or-pin pattern FLLWUP-40 already established and the Skeptic
  verified there (pin or clear the ambient in `beforeEach`/`finally`, restore
  the shell value on every path) — and no cross-seam or design tradeoff is in
  play. A deliberation would have nothing open to deliberate. Steps 2–6
  skipped per council.md step 1; the owner's handoff is the card itself.
- **Surface-touching: no.** Test-only code changes no visible surface, no
  user-visible copy, no empty state, no error state. No `designer` seat is
  seated.
- **Seat resolution (`<seat_resolution_check>`):** `owner`, `skeptic`,
  `judge` — the only seats this path dispatches — all resolve; the nine
  packaged seat files are present in `council/agents/` and in the installed
  package clone, and no repo-local `.pi/agents/` override directory exists,
  so nothing shadows them. Ruling seats (`product-owner`, `steward`) are
  never dispatched by this container.
- **Environment:** step 0 preflight skipped per the autonomous-run
  substitution (Phase 0 cleared it); run for information only → `PASS:
  preflight clean`, exit 0. Local `main` == `origin/main` at `ad9962c71534…`,
  working tree clean. `python3 council/validate.py` → `All council artifacts
  valid`. No `Needs Human` state and no outstanding ruling on this card —
  criterion 5 holds at card start.
- **Gate set for this repo** (authoritative: `.github/workflows/gates.yml` +
  [[deterministic-merge-check]]; `docs/gates/GATE-EVIDENCE.md` does not exist
  here): `bash council/preflight.sh FLLWUP-57`, `bunx tsc --noEmit`,
  `bun test`, `python3 council/validate.py`. Owner gates met in full
  regardless of change size.
- **Blast radius checked (no digest re-pin owed):** no fixture seed carries
  any repo `test/` file in this card's scope — `council/fixtures/*/seed/test/`
  holds only each fixture's own `links.test.ts` and static samples (verified
  by listing; no `eval-runner*` or `job-retry*` anywhere under
  `council/fixtures/`), so AGENTS.md #5's `seed.treeDigest` machinery is
  untouched. `test/prose.test.ts` pins `council.md` procedure prose — this
  card touches no procedure text; FLLWUP-60's record-push pin and FLLWUP-41/42
  pins stay green by construction.
- **Rulings applied here (cited, not re-asked):** Phase-1 run-2 scope governs
  the promotion; `steward` job-1 governs the position; R2 governs the later
  merge; R3 governs this record's direct pushes (disclosed per
  [[record-push-discipline]]).
