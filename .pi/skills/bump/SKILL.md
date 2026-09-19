---
name: bump
description: Cut a pi-council release — bump package.json semver (major/minor/patch), commit it, tag vX.Y.Z, push main and the tag, then force-move the moving `latest` tag. Use when asked to bump, release, or tag a version, or when the user invokes /bump.
---

# Release bump

Cut a release of the `pi-council` repository: bump `package.json`, commit,
tag, and push, then move the `latest` tag. The mechanics live in
[`scripts/bump.sh`](scripts/bump.sh); this skill is the workflow around it.

## Input

A single bump level: exactly one of `major`, `minor`, or `patch`.

If the level is missing or is anything else, STOP and ask the user which
level to use. Never guess a bump level — it is a semver contract, not a
convenience.

## Usage

From the repository root:

```bash
.pi/skills/bump/scripts/bump.sh <major|minor|patch>
```

Before running it, tell the user what will happen in one line, e.g.
"bumping `0.21.0` → `0.22.0` (minor), committing, tagging `v0.22.0`, and
force-moving `latest`". Then run it and report the script's output.

## What the script does

1. Validates the bump level and resolves the repo root.
2. Aborts unless the working tree is clean and the branch is `main`.
3. Reads the current version from `package.json` (must be plain `X.Y.Z`).
4. Computes the next version (`major` → `X+1.0.0`, `minor` → `X.Y+1.0`,
   `patch` → `X.Y.Z+1`) and aborts if `vX.Y.Z` already exists locally or
   on origin.
5. Rewrites only the `version` line, preserving the file's formatting.
6. Commits `chore(release): X.Y.Z`.
7. Creates tag `vX.Y.Z` and force-moves `latest` onto the new release
   commit.
8. Pushes `main`, then `vX.Y.Z`, then force-pushes `latest`.

## Preconditions and failure modes

- **Clean tree + `main` only.** Any dirty file or other branch aborts
  before anything is written. Commit the work first.
- **`latest` is a moving tag.** Re-pointing it is never a fast-forward,
  so the final step is `git push -f origin latest` — this is expected
  and matches the release notes in `AGENTS.md`.
- **Aborts before writes** for a bad level, existing tag, or unreachable
  origin.
- **A push failure leaves local state.** The commit and both tags exist
  locally; nothing is rolled back. Re-run `git push origin main`,
  `git push origin vX.Y.Z`, and `git push -f origin latest` once the
  cause is fixed. Do not re-run the script — the version is already
  bumped.

## Scope

This is maintainer tooling for the pi-council repo itself. It never
touches `council/` payload files, the board, or the wiki, and it does
not run the test suite — only the clean-tree and branch checks gate the
release.