---
title: Verification-Subject Pinning
type: concept
summary: Judge and skeptic dispatch inputs must name the exact verification subject (PR head SHA + head worktree path) and the loop frame (judging/verification precede the mechanical merge the facilitator executes) — an empty or vague subject produces verdicts about the wrong tree.
aliases: [subject pinning, judge dispatch subject, skeptic dispatch subject, verification subject]
tags: [pi-council/concept, pi-council/process]
sources: ["[[2026-09-06-epic6-close-run-ledger]]"]
created: 2026-09-06
updated: 2026-09-06
---

# Verification-Subject Pinning

The dispatch-input contract for the two verification seats: every judge and
skeptic dispatch input names

1. **the exact verification subject** — the PR head SHA and the head
   worktree path (never the shared checkout's `main`, where a pre-merge
   deliverable is absent by construction), and
2. **the loop frame** — step-9 verification and step-10 judging precede
   step-11's mechanical merge, which the facilitator executes and **no seat
   performs**.

Without the frame, a judge reads a goal verb like "receive" as requiring
the merge and rejects a healthy PR for not being merged yet. Without the
subject, it verifies whichever tree its cwd happens to contain.

## The incident class

FLLWUP-16's first judge dispatch (job-3.3) evaluated the local `main`
checkout — where the deliverable is absent pre-merge — and REJECTed on a
premise error, costing a full re-dispatch on a corrected factual record.
The correction practice held (facts only, no coaching, no goal change), but
the wasted dispatch was structural: nothing pinned *what* to verify.

## Where the pinning lives (FLLWUP-18/19/20)

- **`<judge_dispatch_subject>`** on the [[council-runner]] body (FLLWUP-18):
  every judge input the runner composes names subject and frame.
- **`<skeptic_dispatch_subject>`** (FLLWUP-19): the same pin for step-9
  skeptic inputs.
- **The judge seat's `<when_invoked>`** (FLLWUP-20): the seat body names the
  subject and frame as elements of the input it receives, so the contract is
  visible on the seat's own face, not only in the input.

Both the runner and the seats carry it — the [[main-repo immutability]]
lesson that seat-body guidance alone is insufficient; the dispatch input is
where the constraint is actually consumed.

## Evidence it works

The FLLWUP-18 and FLLWUP-19 card runs demonstrated their own constraints
live — their judge and skeptic dispatches named the PR head SHA and head
worktree path and stated the loop frame, and both judged first-pass PASS
with no premise errors. The FLLWUP-16-class rejection has not recurred
since the pinning landed.

## The factual-correction discipline (when a verdict still goes wrong)

A verdict made against a wrong premise is corrected by **re-dispatch with a
corrected factual record only** — the error is named, the subject is
re-stated, and nothing else changes: no verdict coaching, no goal-text
editing, no evidence reshaping. The judge must own its verdict on the
corrected facts.

## Related

- [[main-repo immutability]] — the sibling dispatch-input constraint
- [[judge]] — the seat being pinned
- [[skeptic]] — the other seat being pinned
- [[council-runner]] — the composer of the dispatch inputs
- [[deterministic merge check]] — why the merge must be facilitator-executed
- [[2026-09-06-epic6-close-run-ledger]] — the premise error and the chain

## Sources

- [[2026-09-06-epic6-close-run-ledger]]
- `council/agents/council-runner.md`, `council/agents/judge.md`
