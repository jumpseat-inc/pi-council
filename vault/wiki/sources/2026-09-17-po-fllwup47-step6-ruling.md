---
title: 2026-09-17 FLLWUP-47 product-owner step-6 ruling
type: source
summary: The ruling that settled FLLWUP-47's six open-judgment items on the red-base evidence convention — skeptic-derived boundary, head-half record, craft delegations with constraints, and the wiki-ingest standing offer — plus the two record corrections, including the true EV-41 causal story.
aliases: ["2026-09-17-po-fllwup47-step6-ruling", "FLLWUP-47 step-6 ruling", "po-fllwup47-step6"]
tags: [pi-council/ruling, pi-council/epic9]
sources: ["[[2026-09-17-po-fllwup47-step6-ruling]]"]
created: 2026-09-18
updated: 2026-09-18
---

# FLLWUP-47 — product-owner step-6 ruling (2026-09-17)

The `product-owner` ruling that closed FLLWUP-47's deliberation — eight
skeptic objections (O1–O8, all closed), ten convergence-settled items, six
open-judgment items, zero blocking objections. Source:
[[2026-09-17-po-fllwup47-step6-ruling]]. The deliverable it ruled on is the
[[red-base evidence]] convention, shipped via FLLWUP-47 (PR #64, merged at
`a1d805a`).

## R1–R6 (the six open-judgment items)

- **R1 — mechanism-absent boundary: skeptic-derives-only.** The skeptic
  derives the two-class bit from raw red output + transplant manifest + base
  identity and carries it in its evidence row; the owner's record provides raw
  material, never the classification. Rejected: owner-produces-skeptic-audits
  (two interpretive reads can disagree with no settling test) and a
  three-class `redAttribution` field with `incidental` (no operational
  definition; the EV-41 record shows no author could have classified
  correctly with the transplant set unrecorded).
- **R2 — field 7: replace with the head half.** The record carries head sha +
  same command verbatim + `0 fail`; the "no red test lands" landing statement
  is removed from the convention's record — it is a merge-gate obligation
  ([[deterministic-merge-check]]), and the convention does not
  double-enforce it.
- **R3 — shared-block wording: delegated to owner (craft).** Constraints:
  stack-neutral phrasing (no runner names in code fences — the
  `test/prose.test.ts` stack-pin guard reds on any runner name), the
  skeptic-derivation sentence must be in the block, the field vocabulary must
  surface inside `skeptic.md`'s `<output_format>`, and
  `docs/gates/GATE-EVIDENCE.md` must not be named (that path does not exist).
- **R4 — pin-marker placement: adjacent to the recording/reproduction duty.**
  In `owner.md`, inside or immediately after `<owner_mode>`; in
  `skeptic.md`, inside or immediately after `<verify_by_acting>` adjacent to
  `<output_format>`. Rejected file-end parking (read at intake, not at
  evidence-composition time).
- **R5 — pin granularity: two pins.** A byte-identity drift pin on the marked
  shared slice (`<!-- red-base-shared-start/end -->` markers, not line
  numbers) and a whitespace-flattened judge-reachability pin scoped to
  `skeptic.md`'s `<output_format>`. Whole-file byte-identity is unsatisfiable
  alongside judge-reachability (the skeptic carries vocabulary the owner does
  not).
- **R6 — wiki-ingest: standing offer, not a fold-in.** The seat prose alone
  meets the card's goal; a wiki page documents rather than fixes. Filed as a
  separate follow-up (this page's ingest is FLLWUP-54's exercise of that
  offer; see the lineage note on [[red-base evidence]]).

## The two record corrections (mechanical, pre-step-7)

Skeptic `closed-red` facts — defects in the record's supporting claims, not
in the design:

1. **The "copy depth of `test/ev40-harness/`" explanation is known-wrong**
   (O2). The 6 extra fails in the recorded `7 fail / 1 error` come from head
   `test/stub-child.test.ts` running against the base `test/stub-child.ts`
   (which lacks `flaky`/`finish_error` modes), enabled by an unrecorded
   `extensions/retry.ts` transplant. Copying `test/ev40-harness/` and
   `ev41-tui.py` is inert in this configuration (their removal leaves the
   count identical).
2. **The owner's round-2 "unreproducible" finding is refuted** (O1). The
   recorded number IS reproducible at base `3e39e66` with transplant set
   `{extensions/retry.ts, test/stub-child.test.ts,
   test/ev41-retry-e2e.test.ts}` (all from EV-41 head `0330274`), keeping the
   base `test/stub-child.ts`: `733 pass / 2 skip / 7 fail / 1 error`, exact.

## ⚠️ Contradiction flagged (explicit, never silently overwritten)

**The EV-41 causal story.** Anywhere the EV-41 record or earlier prose cites
"copy depth of `test/ev40-harness/`" as the cause of the extra fails, the
true cause is the `test/stub-child.test.ts`-vs-`test/stub-child.ts` head/base
mismatch enabled by the unrecorded `extensions/retry.ts` transplant (per the
Skeptic's transplant table in FLLWUP-47 step 4); `test/ev40-harness/` and
`ev41-tui.py` are inert in that configuration. This page carries the
correction story because no wiki page previously carried the known-wrong
cause — there was nothing to overwrite, only a gap to fill explicitly. See
[[red-base evidence]] § The EV-41 causal-story correction.

## Reversibility, end-to-end

One commit on a worktree branch, no main-repo state mutation
([[main-repo immutability]]); the five merge criteria
([[deterministic-merge-check]]) apply at head SHA; PR with squash method,
`--match-head-commit` pinning, merged-SHA gates re-verified. No `steward`
escalation needed — no recorded human decision touched, no card declined, no
permanent residual, no goal amendment.

## Related

- [[red-base evidence]] — the convention this ruling settled and shaped
- [[skeptic]] — R1's derivation duty lands on this seat
- [[owner]] — R3/R4/R5's craft delegations land on this seat
- [[deterministic-merge-check]] — R2's head-half vs merge-gate split
- [[gate-parity]] — the placement rule R1 cited
- [[product-owner]] — the seat that ruled
- [[main-repo immutability]] — the worktree-only end-to-end framing

## Sources

- `vault/raw/2026-09-17-po-fllwup47-step6-ruling.md`
- `council/cards/FLLWUP-47.md` — steps 1–5 (positions, objections, synthesis)
- `council/cards/EV-41.md` — the standing "no red test lands" obligation
- `test/prose.test.ts` — the guards the shared block must satisfy
