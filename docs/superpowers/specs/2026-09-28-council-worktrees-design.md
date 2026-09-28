# Council worktree discipline — canonical root + deterministic scripts

Status: design (goal `mulrjjue-d6oezm`, 2026-09-28)
Scope: `extensions/`, `council/scaffold/council/scripts/`, the council prompt
(`council/procedures/council.md` + seat bodies), `docs/`.

## Problem

Council seats create git worktrees wherever they choose. Observed on one
checkout: dozens under `.worktrees/<slug>` (the superpowers
`using-git-worktrees` skill default), plus strays under `/tmp/ev28-*`,
`/tmp/ev30-*`, and a sibling `/home/tista/codes/.worktrees/...`. Nothing
creates them through one routine, nothing removes them, and the shared
`<main_repo_immutability>` block literally instructs seats to run raw
`git worktree add`. The result is unbounded residue and no way to tell a live
worktree from a leaked one.

## Decision: canonical root

**`<repo>/$CONFIG_DIR_NAME/council/worktrees/<slug>/`** (i.e. `.pi/council/worktrees/<slug>`).

The worktrees root is self-ignoring — the create path writes
`worktrees/.gitignore` containing `*`, exactly the pattern `runs/` already
uses (`extensions/runs.ts: ensureRunDir`). Empirically verified: a worktree
created under an ignored in-checkout directory registers with git and leaves
the main checkout's `git status` clean.

### Why this root wins

| Candidate | Verdict |
| --- | --- |
| `.worktrees/` at repo root | **Rejected.** Names no owner: it is the superpowers skill's default and mixes council worktrees with anything else, which is precisely how the strays accreted. Not council-discoverable. |
| `/tmp/<slug>` | **Rejected.** Not on a guaranteed-same filesystem, not discoverable by a repo sweep, survives or vanishes unpredictably, and is the source of the observed `/tmp` strays. |
| Out-of-checkout sibling (`../<repo>-worktrees/`) | **Rejected.** Cleanup is already location-independent (`git worktree list` sees every worktree), so the only real benefit is staying out of tool scans — and it costs determinism: the path depends on the clone's parent directory and name, collides across clones, and is harder for a human to find. `$CONFIG_DIR_NAME/council/` is already where council's on-disk substrate lives (`runs/`, `scaffold.json`, `mcp.json`). |
| **`$CONFIG_DIR_NAME/council/worktrees/`** | **Chosen.** Council-owned, deterministically derivable, self-ignoring, consistent with the existing `runs/` convention, and visible to both `git worktree list` and a root sweep. |

Tooling exposure is bounded: `tsconfig.json` includes only
`extensions/**/*.ts` and `test/**/*.ts`, and `.pi/council/worktrees/` is
ignored, so nested checkouts are not compiled or committed.

## Coverage

One root governs every isolated working copy the council creates:

1. **Owner implementation worktree** — branch work at step 8 (and fix cycles).
2. **Detached base-red evidence worktrees** — throwaway detached checkouts the
   owner/skeptic use for `red-at-base` records.
3. **Judge/skeptic verification worktrees** — any separate checkout at a PR head.
4. **Eval-runner scratch** — `runCellAndGrade`'s disposable copy. This is a
   plain copy, not a git worktree; it is placed under the same root as
   `eval-<cellId>-<repeat>-<rand>` so a residual sweep reaches it. Its
   `finally` removal is unchanged; the canonical root just makes orphans
   findable.

## Determinism: one bash script

`council/scripts/worktree.sh`, shipped in the scaffold tree and invoked by
path (`bash council/scripts/worktree.sh …`). It derives the repo root from its
own location (`council/scripts/../..`) and the worktrees root from the
rendered `@CONFIG_DIR@`, so it hardcodes no `.pi`. Subcommands:

- `create <slug> [--branch <name>] [--base <ref>] [--detach]` — path is a pure
  function of `<slug>`; idempotent (an existing registered worktree at the
  path is reported, not recreated); refuses an unregistered non-empty path.
- `list` — council-owned worktrees only (paths under the root).
- `check` — **the mechanical gate**: exit non-zero with a `FAIL:` line per
  council-owned worktree still present. Exit 0 on a clean root. Tests prove
  both directions.
- `remove <slug> [--force]` — refuses a dirty worktree, or a branch whose
  commits are not on its upstream / has no upstream, unless `--force`.
- `prune [--force]` — remove every council-owned *registered* worktree.
- `prune-scratch` — remove unregistered `eval-*` copy dirs left under the root.
- `sweep` — `prune` + `prune-scratch`, reporting removed and skipped; **refuses
  dirty/unpushed entries without `--force`** and leaves them for the human.

Slug validation (`^[a-z0-9][a-z0-9._/-]*$` with no `..`) prevents path
traversal. The root is created lazily with its `.gitignore`.

## Cleanup points

- **Per-card end** — the facilitator runs `worktree.sh remove <card>` once the
  card reaches a terminal outcome (merged / Done, or the run is abandoned).
  The branch survives removal; the PR is still the artifact.
- **Session-start sweep** — `extensions/index.ts` `session_start`, beside
  `pruneRuns(repoRoot)`, calls `sweepCouncilWorktrees(repoRoot)`, which invokes
  `worktree.sh sweep`. Leftovers a crashed run leaked are removed; dirty ones
  are left and surfaced as a named warning. Absent script (older consumer) is a
  silent no-op.

## Prompt contract

`council/procedures/council.md` and the `owner` / `judge` / `skeptic` /
`council-runner` seat bodies state: the canonical root, the script path, the
ban on raw `git worktree add`, the per-card-end removal rule, and the
session-start sweep. The shared `<main_repo_immutability>` block (duplicated in
those four seats) changes from "created with `git worktree add`" to "created
with `council/scripts/worktree.sh create`".

## Shipping

`council/scripts/worktree.sh` is scaffolded by `/council-init` and is a
**tooling-class** file: added to `TOOLING_FILES` in `extensions/scaffold.ts`,
refreshable by `/council-update`'s consent-gated write path. The scaffold
render rule widens from "basename `preflight.sh`" to "any `.sh` file" so
`@CONFIG_DIR@` is substituted in the script; `packageBytes` in
`council-update.ts` uses the same shared predicate so digests compare.

## Out of scope

- Changing `hub.ts` stall/timeout/kill semantics.
- Cleaning the pre-existing on-disk worktrees in this checkout beyond what the
  sweep removes on the next session start.
- Branch/PR lifecycle (the branch is never deleted by these scripts).
- Non-council worktrees created by other tools.