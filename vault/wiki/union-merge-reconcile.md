---
title: Union-Merge Reconcile
type: concept
summary: When a squash-merged PR folds a runner's board commits, a local main carrying later record commits diverges — reconcile by union merge keeping both record sides, then verify (validate.py + a conflict-marker sweep); or avoid it by pushing records as they happen. A `git reset --hard` on local main is a rewind, not this repair — EPIC-13's counterexample discarded a ruling doc.
aliases: [union merge, diverged main, union-merge reconcile]
tags: [pi-council/process]
sources: ["[[2026-09-05-epic6-run-ledger]]", "[[2026-09-04-epic4-run-ledger]]", "[[2026-09-06-epic6-close-run-ledger]]", "[[2026-09-16-epic9-run-ledger]]", "[[2026-09-17-epic9-residual-run-ledger]]", "[[2026-09-18-epic9-residual-run-2-ledger]]", "[[2026-09-21-epic13-run-ledger]]", "[[2026-09-22-epic10-run-ledger]]", "[[2026-09-22-epic15-run-ledger]]"]
created: 2026-09-05
updated: 2026-09-22
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
- **The close run proved the avoidance recipe** (v0.18.0): base PRs at
  `origin/main` and push record commits as they happen, and the later
  cards (FLLWUP-22/23/25) reconciled by clean rebase or fast-forward —
  zero union merges. Early close-run cards (BUG-1, FLLWUP-13/16/18) still
  hit union merges before the recipe was applied to every runner's
  dispatch input. The repair remains the net; the recipe makes it rare.

- **EPIC-9 again, twice** (2026-09-16): EV-37's reconcile used a **union
  merge** (`6573fe0`, parents `953dafd` + `6a375c4`, verified with
  `git merge-base --is-ancestor`), after its owner force-pushed a rebase; EV-40
  ended `ahead 10, behind 2` and was reconciled in a worktree branched from
  `origin/main`, pushed fast-forward. The main checkout's local `main` also
  needed a reconcile to pick up EV-40's code. Both repairs were resolved by
  **inference from this page** — `council.md` step 12 then said to stop and
  surface a non-fast-forward. That gap was carded as FLLWUP-41 and **delivered
  (2026-09-17)**: step 12 now names the documented union-merge reconcile here as
  the sanctioned non-destructive repair, never-force guard retained.
- **EPIC-9 residual run** (2026-09-17): one union merge (FLLWUP-43, after its
  squash folded pre-cut record commits); every other reconcile fast-forwarded.
  The first merge was announced in-line. ⚠️ The step-12 record pushes themselves
  used an admin-identity bypass under a ruleset that blocks direct updates —
  outside the run-scoped merge authorization; see [[record-push-discipline]].
- **EPIC-9 residual run 2** (2026-09-18): two union merges, from a **new
trigger** — not a squash-fold divergence but **concurrent runs writing the
same shared board**. FLLWUP-57 reconciled an EPIC-10 decomposition's commits
(which were based on this run's own record side) by union merge `9f1b8f7`, both
record sides kept, board exactly-once invariant held; FLLWUP-58 reconciling an
EPIC-12 record push (`a0dfc3b`). Every other record push fast-forwarded. No
side discarded, no force-push, no history rewrite. The lesson: `board.md` and
the card files are the run's only durable state, so **any other writer — not
just the run's own squash — can diverge it**, and the repair is unchanged. See
[[2026-09-18-epic9-residual-run-2-ledger]].
- **EPIC-13 (2026-09-21) — the counterexample that is NOT a union merge.** The
  orchestrator reconciled each squash merge with `git reset --hard origin/main`
  instead of this pattern. A reset is a **rewind**: it discarded a local-only
  ruling commit (the EV-66 ruling doc), recovered only because it survived as a
  dangling object. The never-force/never-discard guard exists for exactly this —
  the union merge keeps both record sides and lets `validate.py` be the net. The
  run's own ledger recorded the contradiction. See
  [[2026-09-21-epic13-run-ledger]].

## Failure mode

A union resolve can leave conflict-marker debris on a card: FLLWUP-10's
card carried a lone `<<<<<<< HEAD` (no opposing markers — both sides
kept) from its EV-27-era... its own reconcile; found post-run and
cleaned. **Sweep for markers after every reconcile** — a remnant is
durable-state damage the board discipline exists to prevent. See
[[card-id-allocation]] (the fetched-HEAD allocation rule that interacts
with this) and [[engineering-board]].

## EPIC-10 recurrence (2026-09-22)

Recurred on 3 of 7 cards (EV-81, EV-83, EV-84), including the documented
spurious-conflict class: the squash already carried the pre-branch record commits,
so the local record side was a strict superset. The repair used a containment
check plus `git rebase --onto origin/main <pre-branch>` to replay only the
genuinely-unmerged record commits — never a `reset --hard`. Witness:
[[2026-09-22-epic10-run-ledger]].

## EPIC-15 recurrence (2026-09-22)

A new trigger with no divergence at all: an **untracked file leaked into the
main checkout** by the owner's worktree work. `test/usages-procedure.test.ts`
was left untracked at the repo root, so the post-merge
`git merge --ff-only origin/main` aborted — *"untracked working tree files
would be overwritten by merge"*. The repair was not a union merge: compare the
untracked file byte-for-byte with the merged version (`git show
origin/main:<path>`), and only when identical remove it, then re-run the ff.
Recurred on one of three cards (FLLWUP-105); BUG-2 and FLLWUP-106 fast-forwarded
cleanly. Witness: [[2026-09-22-epic15-run-ledger]].

## Related

- [[deterministic-merge-check]] — the merge gate whose squash method
  triggers the divergence
- [[card-id-allocation]] — id allocation at fetched HEAD, union-merge
  reconciliation
- [[engineering-board]] — the state being reconciled
- [[2026-09-05-epic6-run-ledger]] — twice in one run + the remnant
- [[2026-09-16-epic9-run-ledger]] — the EPIC-9 divergence pair and the
  procedure-vs-practice gap (FLLWUP-41)

## Sources

- [[2026-09-05-epic6-run-ledger]]
- [[2026-09-04-epic4-run-ledger]]
- [[2026-09-18-epic9-residual-run-2-ledger]] — the concurrent-writer trigger
- [[2026-09-21-epic13-run-ledger]] — the reset counterexample
- [[2026-09-22-epic15-run-ledger]] — the untracked-worktree-file ff abort
