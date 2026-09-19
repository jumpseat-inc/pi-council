---
title: PO ruling — EV-37 merge-gate defect (the literal branch is dead)
type: source
summary: product-owner rules EV-37's merge-gate pause — the shipped retry predicate tests a colon-free byte string pi never emits, so the literal branch is dead; the Intent (not the goal) binds the literal, the fix is an owner-routable fold-in (colon + a bundle-template regression test), and the PR may not merge at 17b5a7f.
aliases: [po-ev37-merge-gate-defect, ev37 merge gate defect, literal branch dead, dead literal branch]
tags: [pi-council/ruling, pi-council/epic9]
sources: ["[[2026-09-16-po-ev37-merge-gate-defect]]"]
created: 2026-09-20
updated: 2026-09-20
---

# Product-owner ruling — EV-37 merge-gate defect

Source: `vault/raw/2026-09-16-po-ev37-merge-gate-defect.md`. The **card-level**
ruling (the merge-gate defect), distinct from the epic-level EPIC-9 wave-3
decomposition at `vault/raw/2026-09-16-po-epic9-retry-ruling.md`.

## The defect

Pi's installed bundle emits `Provider finish_reason: ${reason}` (colon), so for
`finish_reason === "error"` the real message is `Provider finish_reason: error`.
The card goal cannot spell `: ` (frontmatter constraint), so the goal, the R1
Phase-1 ruling, and `extensions/retry.ts` all spell it **without** the colon.
The shipped predicate `message === "Provider finish_reason error"` therefore
never matches pi's output — the literal branch, the card's entire reason for
existing, is dead.

## Ruling

**Owner-routable fold-in, not a goal-defect / steward escalation.** EV-37's
Intent binds "the literal" unambiguously to pi's real emitted message (the
Intake screenshot's class); the goal's colon-free spelling is a structural
artifact, not the substance. By the [[product-owner]] EV-29 precedent, a
goal-defect applies only when the reference cannot be resolved against the
card's own words — here the Intent (shipped on the same card) carries the
binding. Also, goal text is immutable once `In Progress` and EV-37 is
`In Review`, so amending it would force retirement — the wrong move.

**Three artifacts change:** (1) `extensions/retry.ts` constant → the colon
form; (2) `test/retry.test.ts` gains a regression test asserting the constant
byte-for-byte against pi's bundle template evaluated with `reason === "error"`;
(3) the plan records the corrected literal, citing the Intent.

## Merge gate

The five [[deterministic-merge-check]] criteria nominally pass at `17b5a7f`,
but criterion 5 holds only once this ruling is closed by the fold-in landing
and gates passing at the new head. The criteria are mechanical; they do not
substitute for the user-value test — a person hitting `Provider finish_reason:
error` would not be retried, defeating the Intake.

## Related

- [[retry-classification]] — the predicate whose literal was dead
- [[deterministic-merge-check]] — the five criteria and criterion 5
- [[engineering-board]] — goal immutability once `In Progress`
- [[product-owner]] — the EV-29 goal-defect precedent distinguished here
- [[2026-09-16-epic9-run-ledger]] — the run that hit this pause

## Sources

- [[2026-09-16-po-ev37-merge-gate-defect]]