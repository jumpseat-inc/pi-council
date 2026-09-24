---
id: FLLWUP-121
title: Pin test/stub-child.test.ts's child-scheduling race — the transient solo-run flake the FLLWUP-116 judge observed
state: Backlog
owner: null
epic: EPIC-25
goal: The transient solo-run flake in `test/stub-child.test.ts`'s child-scheduling race is reproduced or root-caused and then pinned or demonstrated non-flake — the card's first job is to reproduce/root-cause the one observed failure, and the card closes only with the flake pinned (deterministic test) or with a demonstrated non-flake result, following FLLWUP-63's house bar for test-determinism work.
---

## Intent

While judging FLLWUP-116 (PR #116's merged deliverable), the judge's
full-suite run at head `4515efe` failed once in `test/stub-child.test.ts`
(1253 pass / 5 skip / 1 fail) — a test file untouched by the branch. The
facilitator settled the discrepancy by observation at the same tree: 5×
isolated runs of `test/stub-child.test.ts` all `6 pass / 0 fail`, and one
full-suite run `1530 pass / 6 skip / 0 fail`. One observed failure, never
reproduced — the signature of a scheduling race, not a deliverable defect.

Dedup found no duplicate or home: FLLWUP-57 (Done) covered
ambient-`COUNCIL_EVAL_MODEL` determinism; FLLWUP-63 (Backlog) covers the
backoff-jitter and textTree-minute flakes; neither names stub-child's
child-process scheduling.

Filed from FLLWUP-116's step-13 gate (draft title "Pin
test/stub-child.test.ts's child-scheduling race — the transient solo-run
flake the FLLWUP-116 judge observed"), product-owner-ratified `File`
2026-09-24 (confirming ruling, job-13; recorded gate basis: composite 0.48 <
merge threshold 1.00 — active mode).

## Acceptance

1. The reported flake is reproduced or root-caused: the one observed
   failure is either reproduced (deterministically or under a stress
   harness) or root-caused to a named scheduling hazard in
   `test/stub-child.test.ts`'s child-process orchestration.
2. Following the reproduction/root-cause, the outcome is one of the two
   closing arms: the flake is pinned (made deterministic, or the race is
   covered by a test that pins the engine's settled behavior), or a
   demonstrated non-flake result is recorded (the harness shows the
   observed failure does not recur and the test is sound).
3. FLLWUP-63's house bar for test-determinism work is followed (its
   acceptance discipline applies to this card's determinism arm).
4. `bun test`, `bunx tsc --noEmit`, and `python3 council/validate.py` stay
   green on the merged tree.
