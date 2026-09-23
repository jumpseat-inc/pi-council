---
id: FLLWUP-69
title: Pin the step-13 follow-up confirmation gate as pre-write and mark ledger-level confirmation unsanctioned
state: Backlog
owner: null
epic: EPIC-22
goal: `council/procedures/council.md` step 13 and `council/procedures/features-deliver.md` Phase 1's re-homed follow-up judgment row each state that a follow-up draft is confirmed, edited, or dropped by the ruling seat before any card is written, and that writing cards first and confirming them at ledger level afterward is not a sanctioned posture, proven by a test pinning the pre-write clause in both files and asserting the literal `confirmed at ledger level` appears only inside a sentence that negates it.
---

## Intent

Filed by `steward` (job-16, EPIC-9 residuals run 2) on a procedural defect
`product-owner` escalated during FLLWUP-50's follow-up confirmation. The
FLLWUP-50 runner wrote six follow-up cards (FLLWUP-63–68) before confirmation
and recorded a false normative claim on the card face — "run-2 precedent:
cards land in Backlog, confirmed at ledger level" — inverting the run's
binding Phase-1 ruling that confirmation happens *before* the card is written.
`features-deliver.md` Phase 3 already carries the pre-write rule in packaged
text, and residual run 1 applied it correctly (PO job-29 confirmed
FLLWUP-55–60 pre-write), so no such precedent exists. `steward` ruled the
false line a standing rule a future runner could replicate, corrected
FLLWUP-50's record in place, and carded this procedure-text fix. `FLLWUP-69`
must itself pass through the gate it fixes: draft → `product-owner` confirms
pre-write → card written. It is not a fold-in to `EV-44` (which qualifies step
13's dedup clause); the drafting run must record that determination and land
the two step-13 amendments consistently.

## Acceptance

Both procedure files state the pre-write confirmation rule explicitly and name
ledger-level (post-write) confirmation as unsanctioned; a prose pin in the
`test/prose.test.ts` idiom fails red before the edits and green after, and
asserts the literal `confirmed at ledger level` appears only inside a sentence
that negates it; the full gate set stays green.
