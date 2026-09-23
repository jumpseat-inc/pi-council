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

### Implementation (step 8) — head `521399a`

Diff: 2 files, +25 — `council/skills/usages/scripts/usages.py` +1 (the ratified
mechanism: `p.parent.mkdir(parents=True, exist_ok=True)` at the top of
`save_cache`, before the tmp write; the `OSError` catch and non-fatal
`usages: could not write cache:` warning in `main()` untouched),
`test/usages.test.ts` +24 (T-U10, placed between T-U8 and T-U5, async
`runAsync` + `serveStub` pattern per T-U7/T-U8). Single commit `fix(usages):
save_cache creates an absent --cache-file parent (FLLWUP-109)`. No version
bump — precedent (BUG-2's fix commit `59fad63`) ships usages.py behavior
changes without a package.json bump; releases are cut as separate
`chore(release)` commits.

Owner gates green at head, real results:

- `bash council/preflight.sh FLLWUP-109` → `PASS: preflight clean`
- `bunx tsc --noEmit` → `TypeScript: No errors found` (exit 0)
- `python3 council/validate.py` → `All council artifacts valid`
- `bun test` (full suite) → **1475 pass / 6 skip / 0 fail** (1481 tests /
  114 files, 113.56s)
- `bun test test/usages.test.ts` → 10 pass / 0 fail / 59 expect() (T-U10
  included)

### Red-at-base record (seven fields per [[red-base-evidence]])

1. **Base identity** — `847119c164f152c861deb90676b513dabf80a217`
   (origin/main == main at record time; `git fetch origin` confirmed), the
   commit immediately preceding the fix commit `521399a`. Base role:
   **required**.
2. **Transplant identity** — one file materialized into the base worktree:
   `test/usages.test.ts`, overwritten wholesale with the head version
   (source head `521399a`), carrying the new T-U10. The path exists at base
   (9 tests, no T-U10); the base tree contains every path the transplant
   references — no missing-path qualification. `usages.py` and all other
   files left at base, untouched.
3. **Exact command** — `bun test test/usages.test.ts` (verbatim, same
   command in both halves).
4. **Raw red output** (verbatim from the base run):

   ```
   286 |  try {
   287 |      const r = await runAsync(root, agent, ["--out-dir", path.join(root, "out"), "--cache-file", cacheFile,
   288 |          "--start", U, "--end", U, "--today", "2026-09-21", "--json",
   289 |          "--api-base", `http://127.0.0.1:${server.port}/api/v1`]);
   290 |      expect(r.status, r.stderr).toBe(0);
   291 |      expect(r.stderr).not.toContain("usages: could not write cache:");
                                ^
   error: expect(received).not.toContain(expected)

   Expected to not contain: "usages: could not write cache:"
   Received: "usages: could not write cache: [Errno 2] No such file or directory: '/tmp/usages-repo-NQ3RRY/nested/absent/.cache.json.tmp-3373645'\n"

     at <anonymous> (/tmp/fllwup109-base/test/usages.test.ts:291:24)
   (fail) T-U10: absent custom --cache-file parent is created before the cache write [82.86ms]

    9 pass
    1 fail
   57 expect() calls
   Ran 10 tests across 1 file. [1481.00ms]
   ```

   (Bun stops the test at its first failed expect; the remaining T-U10
   assertions — parent dir existence, parsed cache content — are unreachable
   at base, mirroring the BUG-2 red shape.)
5. **Worktree provenance** — detached checkout at the base sha:
   `git worktree add --detach /tmp/fllwup109-base 847119c164f152c861deb90676b513dabf80a217`;
   the main checkout's branch state never touched; worktree removed after
   the run (`git worktree remove --force /tmp/fllwup109-base`).
6. **Copy set** — `bun install --frozen-lockfile` at the base worktree
   (217 packages from the base tree's own frozen `bun.lock`; node_modules is
   gitignored and absent at base). Nothing else beyond the transplant named
   in field 2 — a bare copy otherwise.
7. **Head half** — head `521399a`
   (`fix(usages): save_cache creates an absent --cache-file parent
   (FLLWUP-109)`), same command verbatim (`bun test test/usages.test.ts`) →
   **10 pass / 0 fail** / 59 expect(). Pair closed: red at base, 0 fail at
   head; no red test landed.