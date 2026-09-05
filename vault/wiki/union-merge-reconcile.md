---
title: Union-Merge Reconcile
type: concept
summary: When a squash-merged PR folds a runner's board commits, a local main carrying later record commits diverges — reconcile by union merge keeping both record sides, then verify (validate.py + a conflict-marker sweep); or avoid it by pushing records as they happen.
aliases: [union merge, diverged main, union-merge reconcile]
tags: [pi-council/process]
sources: ["[[2026-09-05-epic6-run-ledger]]", "[[2026-09-04-epic4-run-ledger]]"]
created: 2026-09-05
updated: 2026-09-05
---

# Union-Merge Reconcile

The repair pattern for a **diverged local `main`** after an autonomous
run's merges: a runner's board/card record commits made *before* the
branch was cut get folded into the PR's squash merge, so a local `main`
that kept receiving record commits diverges from `origin/main`. Neither
side is wrong — both carry real record history — so the reconcile is a
**union merge**: keep both sides' record blocks rather than choosing one,
then let `validate.py` be the net.

## The pattern

1. Detect: `git status` shows local `main` ahead/behind after the gated
   squash lands.
2. `git merge origin/main` (or the reverse) expecting conflicts in the
   record regions — `council/board.md` column placement and card record
   sections.
3. Resolve by **union**: both sides' records are true history; keep both,
   ordering by what actually happened on the board.
4. `python3 council/validate.py` must print clean — the board's
   one-line-per-card invariant is what a sloppy union would break.
5. Push.

## Track record

- **EPIC-4**: first divergence repair (the CONFIRM-2 era).
- **EPIC-6**: used twice in one run — EV-27 (merge commit `f8f70e4`,
  keeping the In-Review state + step-8 record + the designer's raw doc)
  and FLLWUP-10.
- **FLLWUP-9 (EPIC-6) is the counterexample**: it avoided the pattern
  entirely by **pushing record commits as they happened** instead of
  batching them locally — the runner's own board discipline, followed
  literally, prevents the divergence.

## Failure mode

A union resolve can leave conflict-marker debris on a card: FLLWUP-10's
card carried a lone `<<<<<<< HEAD` (no opposing markers — both sides
kept) from its EV-27-era... its own reconcile; found post-run and
cleaned. **Sweep for markers after every reconcile** — a remnant is
durable-state damage the board discipline exists to prevent. See
[[card-id-allocation]] (the fetched-HEAD allocation rule that interacts
with this) and [[engineering-board]].

## Related

- [[deterministic-merge-check]] — the merge gate whose squash method
  triggers the divergence
- [[card-id-allocation]] — id allocation at fetched HEAD, union-merge
  reconciliation
- [[engineering-board]] — the state being reconciled
- [[2026-09-05-epic6-run-ledger]] — twice in one run + the remnant

## Sources

- [[2026-09-05-epic6-run-ledger]]
- [[2026-09-04-epic4-run-ledger]]
