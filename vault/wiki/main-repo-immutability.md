---
title: Main-Repo Immutability
type: concept
summary: No seat and no runner may run git checkout/switch/reset against the main repository path — branch state changes happen only in a dedicated worktree — enforced at three layers after two incidents corrupted board records.
aliases: [main repo immutability, branch-state immutability, worktree-only rule, main-repo immutability]
tags: [pi-council/concept, pi-council/process]
sources: ["[[2026-09-06-epic6-close-run-ledger]]", "[[2026-09-17-po-fllwup47-step6-ruling]]"]
created: 2026-09-06
updated: 2026-09-18
---

# Main-Repo Immutability

The rule that protects the [[engineering board]]'s durable state from the
agents that work on the repo: **`git checkout`, `git switch`, and
`git reset` are forbidden against the main repository path**; any branch
state change happens in a dedicated worktree (under the repo's
`.worktrees/`), and a violation is a `HALT`, not a warning.

## The incidents that made it a rule

1. **Session disruption (BUG-1's first container)** — `.git/config` zeroed,
   the owner's worktree admin metadata zeroed, the owner's in-flight work
   unrecoverable. Recovery: remote re-added from the human's URL, corrupt
   refs removed, fresh runner resumed from committed board state.
2. **Seat tampering (FLLWUP-13, step 9)** — a working seat ran
   `git checkout <sha>` inside the main repo, moving main's HEAD off the
   runner's record commits and reverting board/card faces to a pre-run
   state. Recovered from reflog; no verdict invalidated — but the runner's
   single-writer board discipline had been violated by construction.

## The three enforcement layers (FLLWUP-16..20)

The constraint is deliberately redundant, because each layer fails
differently:

1. **The runner's body** (FLLWUP-16, `<main_repo_immutability>`) — the
   facilitator must not mutate main-repo branch state, and must re-state
   the constraint in every dispatch input it composes.
2. **The working seats' bodies** (FLLWUP-17) — `owner`, `skeptic`, and
   `judge` each carry the block themselves: the layer that survives even a
   lost runner forward, since the FLLWUP-13 violation came from a working
   seat, not the runner.
3. **The dispatch inputs** (the generalization) — seat-body guidance proved
   necessary but not sufficient: the runner ignored its own body under long
   deliberations twice (the stall recurrences). Operative constraints are
   re-stated in every dispatch input; see
   [[verification-subject pinning]], which applies the same re-statement
   pattern to content.

## The recovery drill

When board/card faces revert anyway (a new violation class, a crash): the
record commits are intact objects — restore main from the reflog, verify
`council/validate.py` clean, then continue. FLLWUP-24's card record
documents the drill; it was executed twice this run and both times lost
nothing but time.

## Beyond the main checkout: the red-at-base worktree (FLLWUP-47)

The red-base evidence convention ([[red-base evidence]], field 5) extends
the worktree-only rule to the base run itself: worktree provenance is a
required field, meaning a **detached checkout at the base sha in a separate
worktree** — the main checkout is never touched, and the worktree is
removed after the run. A red-at-base record without that provenance is an
incomplete gate result for the [[owner]] and a defective verification for
the [[skeptic]].

## Related

- [[engineering board]] — the state being protected
- [[verification-subject pinning]] — the dispatch-input re-statement pattern
- [[council-runner]] — the facilitator container the blocks live in
- [[seats]] — the working seats carrying the block
- [[env-split contract]] — the other way a seat's environment poisons a probe
- [[red-base evidence]] — field 5 makes the detached base worktree a required
  part of the evidence record
- [[2026-09-17-po-fllwup47-step6-ruling]] — the ruling whose end-to-end
  reversibility framing names this page
- [[2026-09-06-epic6-close-run-ledger]] — the incidents and the chain

## Sources

- [[2026-09-06-epic6-close-run-ledger]]
- `council/agents/council-runner.md`, `council/agents/owner.md`,
  `council/agents/skeptic.md`, `council/agents/judge.md`
