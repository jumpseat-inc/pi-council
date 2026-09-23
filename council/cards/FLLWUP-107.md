---
id: FLLWUP-107
title: Renderer substitution-set pin for procedure copy
state: In Progress
owner: null
epic: EPIC-15
goal: A test asserts renderProcedure substitutes exactly $COUNCIL_PROCEDURES and $ARGUMENTS, and no packaged procedure ships containing an unrendered $CONFIG_DIR_NAME or @CONFIG_DIR@ token.
---

## Intent

The FLLWUP-105 deliberation (rounds 2–3) relocated this invariant out of its
pin test: a file-level negative assertion on `usages.md` cannot separate a bad
literal from a legitimate future renderer refactor, so the converged design
dropped all negative assertions from that card and the principal proposed the
renderer-level test as its correct home — the substitution seam itself. The
binding product-owner ruling of 2026-09-24 (Q3a) confirmed the disposition:
File. The substrate is `renderProcedure` (extensions/index.ts:148–153), which
today substitutes only `$COUNCIL_PROCEDURES` and `$ARGUMENTS`; no
`@CONFIG_DIR@`/`$CONFIG_DIR_NAME` rendering exists for procedures, which is
why FLLWUP-105's shipped sentence speaks a literal `.pi/` path.

## Acceptance

- A test pins `renderProcedure`'s substitution set: a procedure body
  containing `$COUNCIL_PROCEDURES` and `$ARGUMENTS` renders with both
  substituted, and renders with **nothing else** — any other `$…`/`@…` token
  passes through byte-unchanged.
- A test scans every packaged procedure under `council/procedures/` and fails
  if any file contains an unrendered `$CONFIG_DIR_NAME` or `@CONFIG_DIR@`
  token.
- The assertions live at the renderer/procedure-pack level (substitution
  behavior and packaged-file scan), not as negative assertions inside
  FLLWUP-105's `test/usages-procedure.test.ts` pin, which stays exactly
  three-literal per its amended acceptance.
- `bunx tsc --noEmit`, `bun test`, and `python3 council/validate.py` pass.

## Step 7 — handoff (mechanical, mode Direct)

Recorded mode `Direct` (this dispatch's ROOT manifest): mechanical, test-only,
unambiguous pin — owner-only path, no deliberation, no skeptic, no judge.
Handoff is the card itself (no spec file). Main repo branch state untouched;
the owner works in a dedicated worktree.

## Phase 1 Rulings (this run — features-deliver, EPIC-15 residuals)

Recorded before any `council-runner` was dispatched. Binding on every seat,
`steward` included; cited, never re-asked.

- **Scope/promotion:** this card is promoted `Backlog` → `Ready` as part of the
  run's five-card residual scope (`FLLWUP-107`–`FLLWUP-111`); `EPIC-15` stays
  `Done`.
- **Sequencing (steward, job-1):** `FLLWUP-111 → FLLWUP-109 → FLLWUP-110 →
  FLLWUP-107 → FLLWUP-108`, one runner at a time.
- **R-A (record push) and R-B (merge):** run-scoped authorizations recorded on
  `council/cards/EPIC-15.md`'s residual-run Phase-1 section.
