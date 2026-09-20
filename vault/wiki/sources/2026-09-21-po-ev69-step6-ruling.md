---
title: 2026-09-21 PO EV-69 Step-6 Ruling
type: source
summary: product-owner (job-22) rules the re-route block is one named block resuming at step 3 (step 2 byte-unchanged, owner re-dispatched only if the design is overturned), accepts the Verify designer-review loss provisionally with FLLWUP-71, and conditions EV-69's goal on a scripted-harness dispatch multiset.
aliases: [po-ev69-step6-ruling, EV-69 re-route ruling]
tags: [pi-council/source, pi-council/epic13, pi-council/product-owner]
sources: []
created: 2026-09-21
updated: 2026-09-21
---

# 2026-09-21 PO EV-69 Step-6 Ruling

product-owner ruling (job-22) on EPIC-13 card EV-69 (deterministic routing to Verify), over
Items A, B, C.

## Item A — the re-route block

The re-route is **one named block** in `council/procedures/council.md`, after the step-8→9
observed-set re-check and **resuming at step 3**; step 2 stays byte-identical. The block declares
its own generator roster (`principal` + `designer` under the surface rule) and states the owner's
first-pass record is its pushed step-8 branch. The owner is re-dispatched at step 8 **only if the
deliberation overturns the design**; if the branch is ratified, no second owner dispatch occurs
and criterion 1 reads against the first owner dispatch's gates. The owner's step-2 amendment
scattered one fact across four places; the block holds it once where the facilitator needs it.

## Item B — the Verify designer-review loss

The loss is **real, accepted provisionally**, with two binding conditions: (1) the surface-touching
bit is recorded regardless of mode and feeds the Verify skeptic's input; (2) the residual is
disclosed and carded (`FLLWUP-71`). Seating `designer` in Verify is barred — R4 is a recorded
human decision. A mechanical path→surface predicate is rejected as a second untuned decision
surface competing with `decide()`. See [[2026-09-21-ev69-designer-loss-residual]].

## Item C — the goal is conditioned on scripted execution

The goal's bare "proves" is amended to claim exactly the reach of the evidence: a falsifier over
the manifests of a **scripted harness run produced by the real `council_route` tool** proves that
run's dispatch multiset (ROOT mode Verify, one owner, exactly one skeptic, one judge, zero
principal/designer/consolidator/product-owner/steward), **claiming nothing about whether a live
facilitator called it**. A condition written only in the spec is context the judge is forbidden to
have (`council.md` step 10), so the goal itself must carry it. It also encodes the settled
skeptic-count reading and names the residual as a claim the card does not make.

PO, not steward: the amendment removes a demand and adds nothing to build, and the observable all
exist on the tree.

## Related

- [[metered-deliberation-routing]] — Verify routing and the re-check
- [[judge]] — goal-and-evidence-only input, no partial credit
- [[engineering-board]] — goal-defect vs goal-amendment
- [[verification-subject-pinning]] — pinned dispatch subjects
- [[product-owner]] — the ruling seat

## Sources

- `vault/raw/2026-09-21-po-ev69-step6-ruling.md`
- `council/cards/EV-69.md`