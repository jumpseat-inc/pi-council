---
id: FLLWUP-56
title: Saturate the seat-dispatch provider-error arm onto a config-injected faux provider
state: Deliberating
owner: null
epic: EPIC-9
goal: A falsifier exists for the seat child's own provider-error path — the parent-turn offline faux-provider harness reaching a real seat child — and its live-arm budget is accounted for in the suite-cost measurement.
---

## Intent

FLLWUP-49's step-4 O7 live half stayed `open-untested` (non-blocking): the faux
provider is structurally reachable in a real seat child via a scratch repo's
`.pi/extensions` + `.council.json` and `command: "pi"` with `-a`
(`seats.ts:600-621` has no `-e`/`--provider`), but running it would
re-architect the seat arm — changing what that falsifier proves — and add a
live arm to FLLWUP-48's budget. Filed as a residual, not a defect: if pursued,
it is a different card whose design owns the arm-cost accounting.

Approved by `product-owner` (job-29) as-is from FLLWUP-49's step-13 draft.

## Run record (features-deliver / FLLWUP-56 — EPIC-9 residuals run 2)

### Step 1 — promotion + classification (facilitator)

- **Promotion (`Backlog` → `Ready`) applied, not asked.** Phase-1 run-2 scope
  ruling (`EPIC-9.md` run-2 block, 284ced2): `FLLWUP-50` through `FLLWUP-60`
  "are this run's delivery scope". `FLLWUP-56` is the **ninth** of eleven in
  the `steward` job-1 build-order ruling ("harness hygiene (`55`, then `56`,
  whose live arm must precede the budget cards)"). Run-2 precedent (FLLWUP-55,
  run-1 precedent 5608ed1): the autonomous promotion moves the residual card
  to its working state at its runner's start. The card's creation was already
  ratified by `product-owner` (job-29, FLLWUP-49 step-13 draft confirmed
  as-is) — that is the promotion-ratification power re-homed per
  `features-deliver.md`'s authority map.
- **Path: full council.** The `goal` fixes the outcome (a falsifier for the
  seat child's own provider-error path — the offline faux-provider harness
  reaching a real seat child) but leaves every design question open: how the
  harness reaches the seat child (scratch repo `.pi/extensions` +
  `.council.json` per FLLWUP-49 O7's structural finding), how the test drives
  the dispatch (a real `council_dispatch` through a spawned parent vs. a
  direct `buildChildArgv` spawn), where the falsifier lives, what it asserts,
  its wall-clock ceiling, and how its live arm is accounted in the
  FLLWUP-48 suite-cost measurement (per FLLWUP-48's standing re-measure rule,
  any new live arm must state expected wall-clock and ceiling in its test
  header and the budget docs re-measured). That is `spec-ambiguous` plus
  `design-judgment` per council.md step 1 — either alone is sufficient.
  Cross-seam-adjacent but not cross-seam in the repo-area sense (test files,
  a scratch fixture tree, and budget documentation; no engine module change —
  the card's premise is that `seats.ts:600-621` needs no `-e`/`--provider`).
- **Surface-touching: no (recorded).** The deliverable is test/falsifier code
  and budget documentation (README line re-measure, `vault/wiki/test-suite-budget.md`
  update, test-header wall-clock/ceiling statement) — internal developer
  tooling and documentation inside the FLLWUP-48 copy carve-out (PO ruling 1,
  job-27: all deliverable strings are internal dev docs). It changes no
  product-visible surface, no user-visible copy, no empty state, no error
  state. No `designer` is seated. Boundary recorded honestly: if the
  deliberated design requires a string outside the carve-out (e.g. anything
  added to `council/preflight.sh` or a minted env flag), this container
  returns `ESCALATION` with the drafted string rather than shipping it
  unruled.
- **Rulings applied here (cited, not re-asked):** Phase-1 run-2 scope governs
  the promotion; `steward` job-1 governs the build-order position; R2 governs
  the later merge; R3 governs record pushes (disclosed per
  [[record-push-discipline]]). No card-specific Phase-1 ruling exists beyond
  R2/R3.
- **Seat resolution (`<seat_resolution_check>`):** `owner`, `principal`,
  `skeptic`, `consolidator`, `judge` — the seats this card dispatches — all
  resolve; the nine packaged seat files are present in the installed package
  clone (`~/.pi/agent/git/github.com/jumpseat-inc/pi-council/council/agents/`)
  and no repo-local `.pi/agents/` override directory exists, so nothing
  shadows them. Ruling seats (`product-owner`, `steward`) are never
  dispatched by this container.
- **Environment:** step 0 preflight skipped per the autonomous-run
  substitution (Phase 0 cleared it for the run); run for information only →
  not run by this container at card start (FLLWUP-49/55/57 precedent). Local
  `main` == `origin/main` at `8bb64d9` (FLLWUP-55 merged `97f4b6d`; CI on the
  record commit `8bb64d9` green — `gates` run 35371921484, `conclusion:
  success`, observed from the API), working tree clean.
  `python3 council/validate.py` → `All council artifacts valid`. No
  `Needs Human` state and no outstanding ruling on this card — deterministic
  merge check criterion 5 holds at card start.
- **Gate set for this repo** (authoritative: `.github/workflows/gates.yml` +
  [[deterministic-merge-check]]; `docs/gates/GATE-EVIDENCE.md` does not exist
  here): `bash council/preflight.sh FLLWUP-56`, `bunx tsc --noEmit`,
  `bun test` (≈94–97s envelope per [[test-suite-budget]]; 180s drift
  threshold), `python3 council/validate.py`. Owner gates met in full
  regardless of change size. This card will add a live arm, so the
  FLLWUP-48 PO-ruled re-measure rule (job-27 ruling 1 + the wiki page's
  standing rule) is a binding acceptance criterion on the deliverable.
- **Binding notes carried in (not rulings):** FLLWUP-49 O7 settled the
  structural sub-claims `closed-green` (scratch-repo `.pi/extensions` +
  `.council.json` + `command: "pi"` with `-a` is reachable with no engine
  change; `buildChildArgv` has no `-e`/`--provider`); the live-E2E half was
  left `open-untested` and this card is its pursuit. FLLWUP-48's zero-new-
  live-arms constraint was scoped to those cards' own diffs (baseline
  3/5/5/2); this card's whole subject is a **new** live arm, whose cost the
  card's design owns per the card `Intent`. Concurrent-run environment note:
  EPIC-10/EPIC-11 runners write to the shared board; a step-12 divergence is
  repaired by the documented union-merge reconcile (R1), never force.
  Merged-SHA CI flake on the EV-40 backoff-jitter test is FLLWUP-63's class
  (file untouched by this card); one disclosed rerun on the same commit is
  the cited precedent (FLLWUP-50, FLLWUP-55 step-12 records).
- **Step 2 is opened below:** state `Deliberating` on the card and board,
  `validate.py` clean, then `owner` + `principal` dispatched independently on
  the card alone (no `designer` — not surface-touching).
