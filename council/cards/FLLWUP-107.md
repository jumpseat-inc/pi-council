---
id: FLLWUP-107
title: Renderer substitution-set pin for procedure copy
state: Done
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

## Step 8 — owner implementation (job-8.1)

Branch `feat/fllwup-107-render-pin` (worktree
`.worktrees/fllwup-107-render-pin`; main checkout untouched), PR #110 open,
head `9409e59` (`9409e5907e7dcc2ded95a63f102210e8b5858f53`, verified via
`gh pr view` + diff vs `9babc354`). Owner gates observed in its report:
preflight PASS; `tsc --noEmit` clean; `bun test` 1478 pass / 6 skip / 0 fail;
`test/render.test.ts` 4 pass / 0 fail; `validate.py` clean. Mutation checks
run and reverted: extra renderer substitution → substitution pin red; planted
procedure file → scan pin red. `test/usages-procedure.test.ts` diff-empty vs
base. Files: `test/render.test.ts` (+40), plan
`docs/superpowers/plans/2026-09-23-fllwup-107-render-pin.md`.

## Step 9–10 — verification subject pinned (mode Direct)

Direct mode: no skeptic or judge dispatch — the test suite is that mode's only
gate. CI backstop observed directly (not from a seat report): `gates` workflow
`SUCCESS` on PR #110 head `9409e5907e7dcc2ded95a63f102210e8b5858f53`
(run 35841474574, conclusion `success`, event `pull_request`). Merge criteria
for Direct are 1, 2, 5: owner gates green in full; `gates` SUCCESS on the PR
head SHA; card not `Needs Human`, no outstanding ruling (design rulings were
consumed pre-run per Phase 1). Merge is the orchestrator's act (R-B pinned to
this SHA).

## Step 13 — follow-up drafts (recorded dispositions — held, not filed)

Gate mode `active`; `council_followup_review` called once with both drafts in
draft order; both `status: ok`. Per the run's Phase-1 "Follow-ups" ruling the
draft-then-confirm gate is re-homed to `product-owner`; in-container these ride
the runner's report for ratification — no card written, resumable by draft
title. Dedup pass ran unconditional; no `mergeTargets` supplied.

1. Draft: "Render $CONFIG_DIR_NAME / @CONFIG_DIR@ in procedure copy so packaged
   procedures need not ship literal .pi/ paths" — recorded line verbatim:
   `Mode: Merge — duplicate? yes (same work as an open card) — Render
   $CONFIG_DIR_NAME / @CONFIG_DIR@ in procedure copy so packaged procedures
   need not ship literal .pi/ paths (active)`. No merge target named in the
   rendered line — falls to the confirming seat.
2. Draft: "Generalize the FLLWUP-107 procedure-pack scan from the two pinned
   tokens to an unresolved-token allowlist" — recorded line verbatim:
   `Mode: File — duplicate: certainty 0.59 < noul threshold 0.60 — Generalize
   the FLLWUP-107 procedure-pack scan from the two pinned tokens to an
   unresolved-token allowlist (active)`.

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

## Step 11–12 — merge and Done (orchestrator)

Mode `Direct` (substrate `job-8`, no generator seats), criteria 1, 2, 5
satisfied: owner gates green in full (`preflight.sh` PASS, tsc clean, full
`bun test` 1478 pass / 0 fail, `test/render.test.ts` 4 pass, `validate.py`
clean); `gates` workflow `SUCCESS` on PR head `9409e59` and merged SHA
`41e9676`; card not `Needs Human`, no outstanding ruling. Merged pinned under
R-B: `gh pr merge 110 --squash --admin --match-head-commit
9409e5907e7dcc2ded95a63f102210e8b5858f53` → `41e9676`. Card set `Done` on
card and board; `python3 council/validate.py` clean.

**Merge basis: FLLWUP-107 — mode Direct, criteria 1, 2, 5 satisfied.**

Step-13 follow-up drafts remain **held** on this card (not filed): (1) render
`$CONFIG_DIR_NAME`/`@CONFIG_DIR@` in procedure copy (`Merge`, no target named
→ falls to the confirming seat); (2) generalize the pack scan to an
unresolved-token allowlist (`File`, certainty 0.59 < noul threshold). Carried
to the Phase 3 ledger; confirmation re-homed to `product-owner`.
