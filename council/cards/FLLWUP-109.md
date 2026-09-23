---
id: FLLWUP-109
title: Foreign --cache-file parent: absent parent is created before the cache write
state: In Progress
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

## Phase 1 Rulings (this run — features-deliver, EPIC-15 residuals)

Recorded before any `council-runner` was dispatched. Binding on every seat,
`steward` included; cited, never re-asked.

- **Scope/promotion:** this card is promoted `Backlog` → `Ready` as part of the
  run's five-card residual scope (`FLLWUP-107`–`FLLWUP-111`); `EPIC-15` stays
  `Done`.
- **Sequencing (steward, job-1):** `FLLWUP-111 → FLLWUP-109 → FLLWUP-110 →
  FLLWUP-107 → FLLWUP-108`, one runner at a time.
- **R-A (record push) and R-B (merge):** run-scoped authorizations recorded on
  `council/cards/EPIC-15.md`'s residual-run Phase-1 section.
- **Design already ratified (consumed, not re-asked):** create the absent
  `--cache-file` parent; do not reject it with a usage error.

## Run record (features-deliver / FLLWUP-109 — EPIC-15 residual run)

Mechanical path per recorded execution mode `Direct` (EV-70: owner-only, no
deliberation, no skeptic, no judge — the test suite is that mode's only gate).
Record commit pushed under R-A at owner handoff (step 7→8).