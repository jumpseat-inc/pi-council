---
id: EPIC-15
title: Usages tool creates its output directory before writing the cache
state: Backlog
owner: null
epic: null
goal: A non-offline run of council/skills/usages/scripts/usages.py creates its output directory before writing the cache, so a run whose output directory does not yet exist — the default .pi/council/usages/ or a fresh --out-dir — leaves .cache.json in it and emits no usages: could not write cache: line on stderr.
---

## Intent

`/council-init` copies `council/skills/usages/` into
`<repo>/$CONFIG_DIR_NAME/skills/usages/`, non-clobbering, and the copied
`usages.py` resolves its output directory at runtime. The reported warning is
not a copy defect: `copyUsagesSkill` recursively creates every directory it
writes. The defect is an ordering bug in the tool's `main` — the cache write
runs before `ensure_out_dir()`, so on a repo with no output directory the
temp-file write raises `FileNotFoundError`, is caught, and logs
`usages: could not write cache: …`, while the report still writes after the
directory is created. The tool must satisfy one invariant — its output
directory exists before anything is written into it — independent of whether
`/council-init` ever created it, and independent of whether `--out-dir` is the
default or a custom path. Because a package-only fix reaches only future
copies, the epic also carries the named remediation route for an
already-initialized install.

## Acceptance

- **Scope first:** the reporting repo is an already-initialized install, so
  `BUG-2` alone does not silence its warning — `copyUsagesSkill` is
  non-clobbering and the copied skill has no refresh path. The epic is not Done
  while `FLLWUP-105` is unpromoted, and merging `BUG-2` does not close the epic.
- **User-facing observable:** on a fresh temp repo with no
  `<repo>/.pi/council/usages/` directory, one default-argument run of the tool
  leaves `.pi/council/usages/.cache.json` on disk, prints no line containing
  `usages: could not write cache:`, and a second run reports `cache.hits > 0`.
- **Discriminator:** the same setup with `--out-dir <repo>/fresh-out` — a path
  `/council-init` never creates — also leaves `fresh-out/.cache.json` with no
  warning. An `EMPTY_DIRS`-style scaffold pre-seed must NOT be able to satisfy
  this bullet. The recorded closed-red probe (dir seeded, `usages.py`
  untouched → the previously drafted epic gate went green) is the reason this
  bullet exists.
- `bun test test/usages.test.ts` and `bun test test/scaffold.test.ts` pass on
  the merged SHA; the new default-path and `--out-dir` tests are red at the base
  commit and green after the fix; T-USK1's non-clobbering assertions are
  unchanged.
- `bunx tsc --noEmit` and `council/preflight.sh` pass on the merged SHA.
- `extensions/scaffold.ts`'s `EMPTY_DIRS` does not gain the usages output dir,
  and no test asserts that the output dir exists before the tool is run.
- The epic card records the steward escalation (whether `/council-update` should
  own copied-skill refresh) and its outcome.