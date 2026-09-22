---
id: FLLWUP-109
title: Foreign --cache-file parent: absent parent is created before the cache write
state: Backlog
owner: null
epic: EPIC-15
goal: A non-offline run of council/skills/usages/scripts/usages.py with --out-dir <dir> and --cache-file <repo>/nested/absent/.cache.json (parent directory absent, live analytics stub) exits 0, creates <repo>/nested/absent/, leaves the parsed .cache.json at the --cache-file path holding the stubbed generation_id, and emits no usages: could not write cache: line on stderr.
---

## Intent

BUG-2 fixed the default `--out-dir` path: `ensure_out_dir` now runs before the
first `save_cache`, so the tool's output directory exists before anything is
written into it. But `save_cache` still writes its `.tmp-<pid>` file beside its
target with no parent mkdir, and `--cache-file` is an independent path. A
custom `--cache-file` naming an absent parent therefore still raises, is caught,
and logs `usages: could not write cache: …` to stderr only — silently losing the
cache and the cheap-rerun promise ([[usages-report]]).

The product-owner ratification (EPIC-15 follow-up gate, 2026-09-22) ruled the
design: **create the parent**, consistent with the tool's create-on-demand
behavior everywhere else. Rejecting an absent parent with a usage error was
rejected — the tool validates nothing that way, and it would break the documented
rerun-cheap promise. Genuine failures (permissions, read-only, disk full) keep
the non-fatal warning, per EPIC-15 R4.

## Acceptance

- A new test runs the packaged tool (`PKG_ROOT`) with `--out-dir <dir>` and
  `--cache-file <repo>/nested/absent/.cache.json`, non-offline, against the
  live-analytics stub; it asserts exit 0, the parent directory is created, the
  parsed `.cache.json` sits at the custom path holding the stubbed
  `generation_id`, and stderr carries no `usages: could not write cache:` line.
- Red-at-base: the same run against the pre-fix tree fails on the absent
  `.cache.json` (the cache write's `FileNotFoundError`), with the seven-field
  red-base record.
- `bun test test/usages.test.ts`, `bunx tsc --noEmit`, and
  `python3 council/validate.py` pass.