---
id: BUG-2
title: Usages tool creates its output directory before writing the cache
state: Deliberating
owner: null
epic: EPIC-15
goal: A non-offline run of council/skills/usages/scripts/usages.py with --out-dir omitted, or with --out-dir naming a directory that does not exist, creates that directory before writing its cache, so the run leaves .cache.json inside it and emits no usages: could not write cache: line on stderr.
---

## Intent

In `council/skills/usages/scripts/usages.py`, `main` calls `save_cache()`
before `ensure_out_dir()`. `save_cache` writes a temp file beside its target
with no parent mkdir, so on a first run the cache write raises and logs
`usages: could not write cache: …`; the directory is created moments later for
the report. The fix makes the tool satisfy one invariant — its output directory
exists before anything is written into it — independent of whether
`/council-init` ever created it. Either `save_cache` creates its parent, or
`ensure_out_dir(out_dir)` moves before the first `save_cache`; the observable
contract is the same. This is the user-visible `/usages` surface: the stderr
warning and the presence of `.cache.json`. Do not "fix" this by seeding
`.pi/council/usages/` from `/council-init`'s empty-dir list — that suppresses
the default-path symptom while leaving the tool broken for any nonexistent
custom `--out-dir`, and the output dir is the tool's runtime state, not a
workflow input dir. That prohibition is now load-bearing, not advisory: the
epic's own gate has a bullet an `EMPTY_DIRS`-only patch cannot pass.

## Acceptance

- **T-U7 (new, `test/usages.test.ts`)** runs the packaged tool from `PKG_ROOT`
  (`council/skills/usages/scripts/usages.py`) against a fresh `mkdtemp` `repo`
  and a fresh `mkdtemp` `agent`, with `--config-dir .pi`, fixed
  `--start`/`--end`/`--today`, `OPENROUTER_MANAGEMENT_KEY` set, one seeded
  session file (existing `sessionFile`/`assistant` helpers) carrying one
  `responseId`, and the T-U4 `Bun.serve` analytics+activity stub passed via
  `--api-base`; it passes **neither** `--out-dir` nor `--cache-file` and **not**
  `--offline`. A closed port is NOT an acceptable substitute for the stub here.
- **Run 1 assertions:** exit 0; `stderr` does not contain the literal
  `usages: could not write cache:`;
  `fs.existsSync(<repo>/.pi/council/usages/.cache.json)` is true; the paired
  `usages-<start>_<end>.json` and `.md` exist there; that directory's
  `.gitignore` contains `*`; `.cache.json` parses and its `generations` map
  holds the stubbed `generation_id`.
- **Run 2 assertion (rerun, same repo/agent/stub, still no `--out-dir` /
  `--cache-file`):** exit 0, `stderr` clean, and the parsed report's
  `cache.hits === 1` — the intake's "reruns will not be cheap" claim, reachable
  only because run 1 left a readable cache.
- **T-U8 (new)** repeats run 1's setup but passes `--out-dir <repo>/fresh-out`
  (directory absent) with `--cache-file` still omitted: exit 0, no
  `usages: could not write cache:` on stderr, and `<repo>/fresh-out/.cache.json`
  exists. This is the test a scaffold-only `EMPTY_DIRS` seed cannot pass; name it
  in the PR body.
- **Red-at-base:** T-U7 and T-U8 are both run against the pre-fix tree and both
  fail — T-U7 on the stderr literal and the absent `.cache.json`, T-U8 on the
  absent `fresh-out/.cache.json` — each with the seven-field red-base record.
- The fix stays inside `council/skills/usages/scripts/usages.py` (either
  `save_cache` creates its parent, or `ensure_out_dir(out_dir)` moves above the
  first `save_cache`); `extensions/scaffold.ts`'s `EMPTY_DIRS` is not extended,
  and no test is added that pre-creates the output directory.
- `bun test test/usages.test.ts`, `bun test test/scaffold.test.ts` and
  `bunx tsc --noEmit` pass on the merged SHA.
## Phase 1 Rulings (recorded before dispatch — binding for this run)

- **R1 — merge authorization, this card.** The human authorized, for this run
  only, the admin-bypass merge `gh pr merge <PR> --squash --admin
  --match-head-commit <X>`, where `<X>` is the exact head SHA merge-check
  criterion 2 (`gates` workflow `SUCCESS`) was read against. Not extended to any
  later run; a SHA mismatch is a HALT, not a retry.
- **R2 — build order.** EPIC-15 runs serially: BUG-2, then FLLWUP-105, then
  FLLWUP-106. One runner at a time; never two against the board.
- **R4 — cache-health report row.** Product-owner's decline stands: this card is
  the write-ordering fix only, and the report-level cache-health signifier is
  out of scope. A post-fix cache-write failure whose parent directory exists is
  the trigger for a new card, not for reopening this one.

## Run record (features-deliver / BUG-2 — EPIC-15)

### Step 1 — gate, mode, surface bit (facilitator)

- **Card state `Ready` at container start** — no promotion owed (R2 build
  order: BUG-2 is EPIC-15's first card; this container is the only runner in
  flight, single-writer discipline holds).
- **Execution mode: `Deliberate`**, recorded on this dispatch's ROOT manifest
  (EV-68). Full path, steps 2–14. Roster: `owner`, `principal`, `designer`,
  `skeptic`, `consolidator`, `judge`; ruling seats are never dispatched by
  this container.
- **Surface-touching: yes.** The deliverable changes what a person sees and
  reads on the tool's error state — the `usages: could not write cache:`
  stderr line disappears and `.cache.json` appears where it did not exist —
  user-visible behavior of the `/usages` surface. On a full-council card this
  seats `designer` as a third generator in steps 2–3 (council.md step 1).
- **Seat resolution (`<seat_resolution_check>`):** `owner`, `principal`,
  `designer`, `skeptic`, `consolidator`, `judge` all resolve — the nine
  packaged seat files are present in the installed package clone
  (`council/agents/`), and no repo-local `.pi/agents/` override directory
  exists, so nothing shadows them.
- **Environment:** step-0 preflight skipped per the autonomous-run
  substitution (Phase 0 cleared it); run for information only → `PASS:
  preflight clean`, exit 0. `python3 council/validate.py` → `All council
  artifacts valid`. Local `main` == `origin/main` at `badb093` before this
  card's first record push.
- **Gate set for this repo** (authoritative: `.github/workflows/gates.yml`):
  `bash council/preflight.sh BUG-2`, `bunx tsc --noEmit`, `bun test`,
  `python3 council/validate.py`; card-specific acceptance adds `bun test
  test/usages.test.ts`, `bun test test/scaffold.test.ts`, `bunx tsc
  --noEmit` on the merged SHA. Owner gates met in full regardless of change
  size.
- **Rulings applied here (cited, not re-asked):** R1 — merge authorization is
  run-scoped, but the merge is the orchestrator's act; this container opens
  the PR, gets `gates` green on the PR head, and reports `DONE` with the PR
  number and head SHA. R2 — serial build order. R4 — no cache-health report
  row; the decline stands and is not reopened.
