---
title: 2026-09-28 Council Worktree Discipline
type: source
summary: The /goal run that made council worktrees single-rooted and script-driven — canonical root .pi/council/worktrees/, one worktree.sh for create/remove/check/sweep, per-card reap + session-start sweep, prompt contract, and tooling-class shipping (commit 934fb78).
aliases: [council worktree discipline run, worktree discipline run, 2026-09-28 worktree goal]
tags: [pi-council/source, pi-council/process]
provenance: session-run
source_commit: 934fb78
captured: 2026-09-28
sources: []
created: 2026-09-28
updated: 2026-09-28
---

# Council Worktree Discipline (the /goal run)

Source: this session's `/goal` run on the pi-council repo, commit `934fb78`
("feat(council): single-rooted deterministic worktrees via worktree.sh"),
plus its design record
`docs/superpowers/specs/2026-09-28-council-worktrees-design.md`. There is no
`vault/raw/` file; the run and its artifacts are the source.

## The problem it found

Council seats created git worktrees **wherever they chose**, with no shared
routine and no cleanup. One checkout held ~40 resident worktrees across three
patterns:

1. the superpowers default `.worktrees/<slug>` (what the
   `using-git-worktrees` skill instructs),
2. `/tmp/ev28-*` / `/tmp/ev30-*` strays,
3. a sibling clone's `/home/tista/codes/.worktrees/<slug>`.

The shared `<main_repo_immutability>` block literally told seats to run raw
`git worktree add`. Nothing removed a worktree after a run.

## The decision: one canonical root

**`<repo>/.pi/council/worktrees/<slug>/`**, self-ignoring via an inner
`.gitignore` containing `*` — the same pattern `runs/` uses
([[run-transcripts]]). Empirically verified: a worktree created inside an
ignored in-checkout directory registers with git and leaves the main checkout's
`git status` clean.

Rejected alternatives, with reasons:

- **`.worktrees/` at the repo root** — ownerless; it is the superpowers skill's
  default and mixes council worktrees with anything else, which is how the
  strays accreted.
- **`/tmp/<slug>`** — not guaranteed same-filesystem, not discoverable by a
  repo sweep, and the observed stray source.
- **An out-of-checkout sibling** — cleanup is already location-independent
  (`git worktree list` sees every worktree), so the only real benefit (staying
  out of tool scans) does not justify a path that depends on the clone's parent
  directory and collides across clones.

See [[council-worktree-discipline]].

## The mechanism

- **`council/scripts/worktree.sh`** is the only sanctioned create/remove path:
  `create <slug> [--branch|--base|--detach]`, `list`, `check`, `remove
  <slug> [--force]`, `prune`, `prune-scratch`, `sweep`. Create is idempotent and
  path-deterministic; slugs are validated against traversal; remove **refuses
  dirty or unpushed/no-upstream work without `--force`** and never deletes the
  branch.
- **Cleanup is two-point**: a per-card reap at `council.md` step 12, plus a
  parent `session_start` sweep (`extensions/worktrees.ts`,
  `sweepCouncilWorktrees`). `worktree.sh check` is the mechanical residual gate
  — fail on present, pass on clean.
- **Shipping**: the script joins `TOOLING_FILES`; the scaffold render predicate
  widened from `preflight.sh` to **any `.sh`**, shared by `scaffoldInto` and
  `council-update`'s `packagedBytes` so refresh digests agree
  ([[non-clobbering-scaffold]], [[council-update]]).
- **Prompt**: `council.md`'s "Worktree discipline" section + the shared
  `<main_repo_immutability>` block on owner/judge/skeptic/council-runner name
  the script and root and ban raw `git worktree add`.

## Findings beyond the feature

- **Eval scratch was a misnomer.** `eval-runner`'s "scratch worktree" is an
  `os.tmpdir()` *copy*, not a git worktree. It now lives under the canonical
  root as `eval-*`, reaped by `prune-scratch`.
- **The classification guard fired as designed.** Adding a scaffold file reddened
  the T4/T4b set-equality guards until it was deliberately classified as tooling
  — the intended "a new scaffold file must be consciously classified" pressure.
- **AGENTS.md gained convention #14**, which cascaded into the
  [[2026-08-23-agents]] source page and the index (13→14) via the FLLWUP-25
  wiki-sync guard; that guard is what keeps the wiki copy honest.
- **Dogfooding**: the package repo is itself a scaffolded consumer (`council/`
  at root), so the script was also placed at `council/scripts/worktree.sh` for
  its own runs.
- **A contradiction surfaced and was flagged**, not overwritten: the
  [[main-repo immutability]] page still said worktrees live under `.worktrees/`.

## Gates

`bunx tsc --noEmit` exit 0; `bun test` 1544 pass / 6 skip / 0 fail (119 files);
`python3 council/validate.py` "All council artifacts valid"; `council/preflight.sh`
"PASS: preflight clean". New falsifier `test/worktrees.test.ts` (12 pass) proves
create/list/check/remove refusal + `--force`, prune/sweep, eval-scratch routing,
and the engine no-op when the script is absent.

## Related

- [[council-worktree-discipline]] — the concept this run shipped
- [[main-repo immutability]] — the rule the worktree is the sanctioned outlet for
- [[run-transcripts]] — the sibling self-ignoring ephemeral substrate (`runs/`)
- [[non-clobbering-scaffold]], [[council-update]] — the tooling-class shipping
- [[verification-subject pinning]], [[red-base evidence]] — the head/base worktrees
- [[preflight]] — the sibling mechanical gate

## Sources

- This run, commit `934fb78`
- `docs/superpowers/specs/2026-09-28-council-worktrees-design.md`
- `council/scripts/worktree.sh`, `extensions/worktrees.ts`, `test/worktrees.test.ts`