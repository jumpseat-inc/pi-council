---
id: EPIC-24
title: Close the EPIC-23 autonomous-delivery residuals — runner transcript live-smoke, frontmatter-scoped epic parse, and quote-agnostic import pins
state: Done
owner: null
epic: null
goal: The EPIC-23 autonomous-delivery residuals are closed — FLLWUP-114's live-smoke phase asserts a real council-runner session transcript's startup toolCalls contain no Read against council/procedures/council.md or council/procedures/features-deliver.md, FLLWUP-115's cardEpicKey derives the epic key from the card face's frontmatter `epic:` field alone with a corpus-divergence pin, and FLLWUP-116's file-content import pins are quote-agnostic or pin the double-quote convention as the contract — with `bun test`, `bunx tsc --noEmit`, and `python3 council/validate.py` green on the merged tree.
---

## Intent

Three follow-ups were filed out of the EPIC-23 autonomous `/features-deliver` run (EV-90 step 13) and ratified `File` by the product-owner, but they were homed under an epic that then closed — EPIC-23's two children merged and the epic shipped, so carrying three open residuals under a `Done` epic is a state the board should not hold. They are grouped here as a coherent layer: all three are residuals of the same shipped mechanism. EV-90 composed the `council-runner` dispatch input from `renderProcedure`-substituted procedure bodies; FLLWUP-114 supplies the live transcript evidence that the pre-injected startup actually looks like the unit-proven design; FLLWUP-115 hardens `cardEpicKey`, the epic-key derivation that now feeds that composed dispatch input; FLLWUP-116 is test-pin hygiene on the packaged source the mechanism reads. None changes the merge check, the seat schema, `hub.ts`, or the gate policy data. Each child is individually specified and carries its own falsifiable goal; the epic closes when all three are merged.

## Phase 1 rulings

Recorded human decisions for the EPIC-24 run. Immutable for the run and binding on every seat, `steward` included.

- **P1-1 (run-scoped admin authorization).** For this run only — not extended to any later run — the `main` ruleset's required approving review is satisfied by the sanctioned admin bypass: card merges use `gh pr merge <PR> --squash --admin --match-head-commit <X>` pinned to the exact SHA the merge check was read against; the step-12 direct record push to `main`; and the push of the Phase 1 record (`council/phase1-rulings.json`) are all authorized. Without this record the bypass must not be used.
- **P1-2 (record push).** For this run only, direct card-and-board state commits and the step-12 record commit to `main` are authorized; force-push, rewind, and history rewrite remain forbidden.
- **P1-3 (class rulings).** The five Phase-1 open-judgment classes are all recorded not-applicable for this internal test/engine epic in `council/phase1-rulings.json` — no user-facing surface is touched by FLLWUP-114, FLLWUP-115, or FLLWUP-116.
- **P1-4 (build order — steward job-1).** Total order FLLWUP-115 → FLLWUP-114 → FLLWUP-116, strictly serial (one `council-runner` at a time, board single-writer). No child is retired or defaulted out of scope.
- **P1-5 (promotion — product-owner job-2).** FLLWUP-114, FLLWUP-115, and FLLWUP-116 are ratified `Backlog → Ready` for this run; FLLWUP-115's goal and Acceptance criterion 3 are amended to the behavioral-equivalence pin before the promotion write.
- **P1-6 (FLLWUP-115 criterion-3 reconciliation — product-owner job-2).** Criterion 3 is amended from the empirically false "no card body line matches the key label" claim to a corpus-wide behavioral-equivalence pin between the whole-file and frontmatter-scoped derivations; the card records the disposition of the known body occurrences.
- **P1-7 (first merge).** The human selected fully unattended for this run; the P1-1 authorization stands as the merge authorization and no merge pauses for a human.

## Acceptance

- All three children — FLLWUP-114, FLLWUP-115, FLLWUP-116 — are merged with the `gates` workflow green on each merged SHA — or a child is explicitly dispositioned (retired/absorbed) on the record with the ruling that produced it.
- FLLWUP-114's two `open-untested` predictions from EV-90's step-9 record (and the byte-equal-retry prediction) each carry an actual transcript-level result, green or red, not a restatement of the mechanism.
- FLLWUP-115 lands with the corpus-divergence pin that proves the parse scoping changed no existing derivation.
- `bun test`, `bunx tsc --noEmit`, and `python3 council/validate.py` pass on the merged tree.