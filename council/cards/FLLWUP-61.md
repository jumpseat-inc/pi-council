---
id: FLLWUP-61
title: Worktree-seat cwd discipline for edit/write tools
state: Backlog
owner: null
epic: EPIC-22
goal: When `owner` or `skeptic` dispatch inside a worktree, edit/write tools resolve against the worktree (not the session cwd) by seat-prompt discipline — absolute worktree paths or a session-level `cd` into the worktree before any edit/write — and a red-first test pins that discipline in the FLLWUP-42 prose-pin idiom.
---

## Intent

Filed from FLLWUP-60's step-13 candidate A, confirmed by `product-owner`
(EPIC-9 residuals run 2). During FLLWUP-60's owner dispatch the owner's first
two file writes resolved against the session cwd — the main checkout — rather
than the bash-cd worktree; the owner caught and reverted them same-turn and the
residue was verified absent at step 8, so no defect shipped. The hazard class
recurs on every worktree-touching owner/skeptic dispatch: the `edit`/`write`
tools follow the session cwd while `git` and `bash` follow the `cd`, so a seat
that cds into its worktree before editing can still write to the main checkout.
`product-owner` ruled that a seat-prompt change shipping into every future
container is card-worthy TDD, not a quiet maintenance edit.

## Acceptance

The `owner` and `skeptic` seat guidance names the worktree path resolution
discipline explicitly; a prose pin (FLLWUP-42's `test/prose.test.ts` idiom)
fails red before the seat-prose edit and green after; the full owner gate set
stays green and no main-checkout write is possible under the documented
procedure.
