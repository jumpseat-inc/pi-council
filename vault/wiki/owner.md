---
title: Owner
type: entity
summary: The Council's engineering voice and the single implementing seat — turns agreed specs into plans, implements in a worktree, clears all four gates to a PR.
aliases: [owner seat]
tags: [pi-council/seat]
sources: [[2026-08-23-pi-council-design-spec]]
created: 2026-08-23
updated: 2026-08-25
---

> ⚠️ Derived from `council/agents/owner.md` @ `df3...` (captured 2026-08-23). Verify against the seat file.

**Model:** `openrouter/deepseek/deepseek-v4-flash-0731:high`.
**Tools:** Read, Grep, Glob, Edit, Write, Bash (full implementer).
**MCP:** `[context7, tavily]`.
**Superpowers pointers:** writing-plans, test-driven-development, using-git-worktrees,
systematic-debugging, verification-before-completion.

## Role

The most-cross-cutting seat: engineering voice during refinement, **the single
implementing owner** once a design is agreed. Owns the whole codebase. It works **in an isolated git worktree**,
never on `main`.

## Owner discipline (the four gates, is exposed)

When handed an agreed spec, the owner:

1. turns it into a plan under `docs/superpowers/plans/`;
2. implements the minimum that satisfies it — **no scope, no tall speculation**;
3. clears every gate the repository defines, in order, in full;
4. opens a PR.

The gates are **not scalable down**: a one-line edit clears the same four gates
as a thousand-line one; a failing gate is a hard stop-and-fix; threshold-lowering,
stub-tests, and suppression-comment dodges are the same move as `# nosec`.

## Verification style

Gate status is written **only from observed artifacts**. "Done" is true only
once all four gates are green.

## Related

- [[seats]], [[council-loop]], [[hub-job-supervision]]
- [[skeptic]] — the adversary who attacks the owner's branch
- [[council-config]] — default model/thinking override

## Sources

- `council/agents/owner.md`
- `docs/.../pi-council-design-spec.md`