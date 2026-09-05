---
title: EPIC-6 Run Ledger
type: source
summary: The features-deliver run that added the model-name search filter to /council-models (EV-26/EV-27) and closed the three reassigned EPIC-5 follow-ups (FLLWUP-9/10/11) — five gated merges, zero escalations, and the stall-recurrence, sub-dispatch-loss, and contamination lessons.
aliases: [epic6 run, 2026-09-05-epic6-run-ledger]
tags: [pi-council/run-ledger, pi-council/epic6]
sources: ["[[2026-09-05-epic6-run-ledger]]"]
created: 2026-09-05
updated: 2026-09-05
---

# EPIC-6 Run Ledger (2026-09-05)

The `/features-deliver EPIC-6` autonomous run: the model-name search
filter for [[council models picker]] (`filterModelRows` + the
`/`-triggered search input) plus the three EPIC-5 follow-ups the human
reassigned into the epic. **First fully-autonomous epic closure**: five
merges under the [[deterministic-merge-check]], **zero `ESCALATION`s**
across all five cards, and human touches only at the Phase-1 rulings
preflight and the step-13 follow-up confirmation.

## What landed

- **EV-26** — `filterModelRows`: pure case-insensitive substring filter
  on `qualifiedId`, suffix-safe, reference-preserving (PR #23 `b89a93b`).
- **EV-27** — the `/`-triggered focused search input below the top row,
  built on the [[two-bit-focus-machine]]; ruled copy
  `▌ / filter · esc clears` and `No models matching "<query>".` byte-pinned
  (PR #24 `3452abb`).
- **FLLWUP-10** — writer `existingThinking` matches the loader's
  object-form `:suffix` parse (the known seam fixed, PR #25 `948d111`).
- **FLLWUP-9** — `clearSeatOverride`, the explicit writer-level clear
  (PR #26 `08438bd`).
- **FLLWUP-11** — the `SMOKE_PHASE` selector so the Phase 5 falsifier
  runs in isolation, with the R-2/R-3 byte-literal fold-in (PR #27
  `73b3150`).

Suite: 507 → 537 pass, 0 fail. Steward's build order ruled
EV-26 → EV-27 → FLLWUP-10 → FLLWUP-9 → FLLWUP-11; four of five cards
took the mechanical path (steps 2–6 skipped) because Phase-1 rulings and
landed contracts settled their designs — only EV-27 merited full
council with the designer seated.

## Key takeaways

1. **Phase-1 front-loading is the escalation-killer.** Four rulings
   recorded on card faces before any dispatch absorbed every dispute the
   deliberations raised — the two flagged EV-27 disputes closed by
   citing rulings, never re-asking. The cheapest ESCALATION is the one
   pre-answered.
2. **The stall-window invariant must be institutionalized, not
   remembered.** Two containers died re-learning the EPIC-5 lesson
   because the fix (orchestrator stall window above the runner's longest
   child ceiling) lived on [[hub-job-supervision]] but not in the
   dispatching procedure. See [[hub-job-supervision]].
3. **Sub-dispatches die with their parent container** — an in-flight
   skeptic verification was unrecoverable across containers; durable
   board state plus a fresh container is the only recovery path.
4. **Verify the staged set before every commit.** A foreign dispatch's
   staged files were swept onto `main` by a scoped record commit;
   forward-reverted without history rewriting ([[union-merge reconcile]]
   documents the related repair patterns).
5. **Ruled copy is enforced by literal tests with gate-integrity
   injections** — drift tripwires proven red in both directions.

## Related

- [[council models picker]] — the surface extended
- [[council config writer]] — the writer this run fixed and extended
- [[smoke test]] — the Phase 5 selector this run shipped
- [[deterministic-merge-check]] — five more merges under the gate
- [[council-runner]], [[hub-job-supervision]] — the orchestration lessons
- [[2026-09-04-po-epic6-ruling]] — the decomposition ruling this run built on

## Sources

- [[2026-09-05-epic6-run-ledger]] (raw)
- `council/cards/EV-26.md`, `EV-27.md`, `FLLWUP-9.md`, `FLLWUP-10.md`,
  `FLLWUP-11.md` — the card records
