---
title: Council Worktree Discipline
type: concept
summary: Every council git worktree is created and removed through council/scripts/worktree.sh under one canonical root (.pi/council/worktrees/); removal refuses dirty or unpushed work without --force, and leftovers are reaped at card end plus session start.
aliases: [council worktree discipline, worktree discipline, canonical worktree root, worktree root, worktree.sh]
tags: [pi-council/concept, pi-council/process]
sources: ["[[2026-09-28-council-worktree-discipline]]"]
created: 2026-09-28
updated: 2026-09-28
---

# Council Worktree Discipline

The rule that gives the [[main-repo immutability|worktree-only rule]] a
deterministic home and lifecycle: **one canonical root, one script**. Before
this, seats created git worktrees wherever they chose — the superpowers
`.worktrees/` default, `/tmp` strays, a sibling clone — and nothing removed
them ([[2026-09-28-council-worktree-discipline]]).

## The canonical root

```
<repo>/.pi/council/worktrees/<slug>/
```

The root is **self-ignoring**: `worktree.sh` writes `worktrees/.gitignore`
containing `*`, exactly the pattern `runs/` uses ([[run-transcripts]]). A
worktree inside an ignored in-checkout directory registers with git and leaves
the main checkout's `git status` clean.

Why this root, over the alternatives:

- **vs `.worktrees/`** — that name has no owner (it is the superpowers skill's
  default) and mixes council worktrees with anything else.
- **vs `/tmp`** — not discoverable by a repo sweep and not reliably on the same
  filesystem.
- **vs an out-of-checkout sibling** — cleanup is already location-independent
  (`git worktree list` sees every worktree), and a sibling path depends on the
  clone's parent/name and collides across clones.

The root is derivable two ways that must agree: the script computes it from its
own location plus the rendered `@CONFIG_DIR@`; the engine computes it with
`CONFIG_DIR_NAME` in `extensions/worktrees.ts`.

## The one script

`council/scripts/worktree.sh` (scaffolded by `/council-init`, refreshed by
[[council-update]]) is the only sanctioned create/remove path. Raw
`git worktree add` is banned in the prompt.

| Subcommand | Behavior |
| --- | --- |
| `create <slug> [--branch <n>] [--base <ref>] [--detach]` | Idempotent, path-deterministic; prints the path. |
| `list` | Council-owned worktrees only (paths under the root). |
| `check` | **Mechanical residual gate** — exit 1 with a `FAIL:` line per resident council worktree; exit 0 on a clean root. |
| `remove <slug> [--force]` | Refuses dirty / unpushed / no-upstream work without `--force`. Never deletes the branch. |
| `prune [--force]` | Remove every council-owned registered worktree. |
| `prune-scratch` | Remove unregistered `eval-*` copy dirs. |
| `sweep [--force]` | `prune` + `prune-scratch`. |

Slug validation (`^[A-Za-z0-9][A-Za-z0-9._/-]*$`, no `..`) prevents path
traversal. The branch always survives removal — the merged PR is the artifact.

## Cleanup points

- **Per-card end** — `council.md` step 12 reaps the card's worktree once the card
  is `Done` and the record commit is pushed.
- **Session-start sweep** — the parent `session_start` calls
  `sweepCouncilWorktrees` (beside `pruneRuns`). Leftovers a crashed run leaked
  are removed; dirty/unpushed ones are **reported, not deleted**.
- The engine is a **no-op when the script is absent** (a consumer that predates
  it), so [[extension-load-scope]] applies: the sweep is live only after the
  package is installed/reloaded.

## Coverage

The one root governs every isolated working copy the council creates: the
[[owner]]'s implementation worktree, detached base-red evidence worktrees
([[red-base evidence]], field 5), judge/skeptic verification checkouts
([[verification-subject pinning]]), and the eval runner's disposable
**copy** (a misnomer — it is not a git worktree; it lives under the root as
`eval-*` and is reaped by `prune-scratch`).

## Related

- [[main-repo immutability]] — the rule this operationalizes (and a stale
  `.worktrees/` claim this supersedes — flagged, not silently overwritten)
- [[run-transcripts]] — the sibling self-ignoring substrate pattern
- [[non-clobbering-scaffold]], [[council-update]] — the script is tooling-class
- [[owner]], [[skeptic]], [[judge]], [[council-runner]] — the seats carrying the block
- [[red-base evidence]], [[verification-subject pinning]] — the worktrees they name
- [[preflight]] — the sibling mechanical gate

## Contradictions flagged

- **[[main-repo immutability]]** previously located worktrees "under the repo's
  `.worktrees/`". Since the canonical root is `.pi/council/worktrees/` and
  creation is script-mediated, that claim is **superseded**; the page was
  updated with a pointer here.

## Sources

- [[2026-09-28-council-worktree-discipline]]
- `council/scripts/worktree.sh`, `extensions/worktrees.ts`
- `council/procedures/council.md`, the seat `<main_repo_immutability>` blocks