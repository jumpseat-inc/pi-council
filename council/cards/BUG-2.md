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

### Steps 2–3 — round 1 (independent first pass) and round 2 exchange

**Round 1 — owner (job-1.1), verbatim position (condensed to its claims):**

- Recommends **mechanism B**: move `ensure_out_dir(out_dir)` above the first
  `save_cache` — call it immediately after `out_dir`/`cache_file` are
  resolved (~line 719, before `load_cache`), delete the later call (~792).
  `save_cache` stays a pure write-beside-target primitive; giving it blanket
  `mkdir(parents=True)` changes its contract for every caller since
  `--cache-file` may point anywhere.
- Tradeoffs accepted: `.gitignore` write happens earlier (improves behavior —
  a mid-network-death run still leaves a gitignored dir). `--cache-file`
  pointing outside `out_dir` with an absent parent still fails — record as
  known limitation, hardening it is scope creep (goal names the output
  directory; R4: write-ordering fix only). Both flags together handled
  unchanged.
- Verified: the cache is only non-empty if the stub answers
  (`usages.py:505–523`), so the T-U4 stub is load-bearing for T-U7;
  `extensions/scaffold.ts:71` hardcodes only `vault/raw` and
  `vault/wiki/sources`, so the EMPTY_DIRS prohibition costs nothing.
- Offline unchanged (save_cache only called under `not args.offline`);
  cache-write failure stays non-fatal (R4 respected); red-at-base per the
  seven-field convention via detached worktree transplant at the pre-fix SHA.
- Two questions: (1) harden foreign `--cache-file` parent or record as
  limitation? (2) confirm run-2 "stderr clean" tolerates stdout-only report
  lines — pin the stderr assertion to absence of the cache literal.

**Round 1 — principal (job-1.2), verbatim position (condensed to its claims):**

- The seam is which module owns directory existence for which write target:
  `save_cache` knows only `path` (its tmp is at `path.with_name(...)`),
  `ensure_out_dir` is truly about the report write, and `cache_file` is
  **decoupled** from `out_dir` by `--cache-file`. The two proposed options are
  equivalent *only where `--cache-file` is omitted* — the card's
  "observable contract is the same" sentence is false across the flag surface.
- Recommends **mechanism A**: `save_cache` creates its own parent
  (`p.parent.mkdir(parents=True, exist_ok=True)` before `tmp.write_text`) —
  the only option that holds when `--cache-file` names a parent outside
  `out_dir`; places the invariant at the writer that knows the target;
  preserves the non-fatal warning semantics.
- Testable discriminator (falsifies the equivalence sentence): run with
  `--out-dir <dir>` **and** `--cache-file <repo>/nested/absent/.cache.json`;
  post-fix (a) exits 0 with the cache file present; post-fix (b) still logs
  `usages: could not write cache:` and writes no cache file. T-U7/T-U8 pin
  `--cache-file` omitted so they cannot distinguish (a) from (b).
- Also flags: no offline-path invariant test; no test distinguishing
  "report dir exists" from "cache parent exists" (`.gitignore` check pins the
  report side only).
- Open questions: (1) create the foreign cache parent, or reject
  `--cache-file` outside `out_dir` with a usage error — silently creating
  foreign parents deserves an explicit ruling; (2) cache-write failure stays
  non-fatal (conservative reading).

**Round 1 — designer (job-1.3), verbatim position (condensed to its claims):**

- After the fix, run 1's stderr and the output directory must agree: no
  `could not write cache` line, `.cache.json` present; today stdout proves
  the directory exists milliseconds after stderr said it didn't — a Norman
  feedback contradiction. `.cache.json` is the signifier for the
  "reruns are cheap" promise made verbatim by `council/procedures/usages.md`
  and `vault/wiki/usages-report.md`; the bug breaks that promise on first run.
- Prefers **mechanism B** (single owner: `ensure_out_dir` already carries
  "out dir set up"; splitting the invariant across two functions creates two
  preconditions for no benefit). Predicts `grep -n ensure_out_dir` shows the
  call above the first `save_cache`; grades mechanism A "fix correct, design
  smell" if chosen.
- Residual failure copy stays verbatim (`could not write cache: {e}`) — it
  fires only for cases its wording already names (permissions, read-only,
  disk full); a friendlier line would lie about the cause. Softer wording is
  a separate card.
- Falsifiable predictions for out-of-band smokes: (1) fresh default dir —
  clean stderr + `.cache.json` present; (2) rerun `hits₂ == misses₁`; (3)
  absent `--out-dir` — dir exists with `.cache.json`, both report files,
  `.gitignore`; (4) read-only parent → exit 3 `could not write report`;
  read-only existing dir → `could not write cache` with the real OSError,
  correct and staying; (5) implementer choice — `ensure_out_dir` above the
  first `save_cache`; (6) T-U4's `--cache-file <root>/cache.json` outside
  `--out-dir <root>/out` never exercises the bug path — that gap is itself a
  finding.
- Out of scope, flagged for follow-up: surface cache stats in the human
  summary (`cache: hits=N misses=M`) — positive feedback that the cache
  machinery worked; today only the JSON report carries them.

**Round 2 — the exchange (same three seats, each with the others' round-1
positions; see the three verbatim round-2 blocks below).**

**Round 2 — owner (job-1.4), condensed:** Holds **mechanism B**, votes
against reopening. (1) A-vs-B is not observable on the acceptance surface:
T-U7/T-U8 leave `--cache-file` omitted, so `cache_file` always resolves
inside `out_dir`; identical final state under either mechanism; the only
intra-run difference (`.cache.json` before `.gitignore` under A) is asserted
by no acceptance line — the oracle cannot distinguish the mechanisms, so the
mechanism choice cannot be a gate question. (2) R4 already routes the
foreign-parent case out (trigger for a new card). (3) Mechanism A ships an
unruled behavior change — silently creating arbitrary foreign parent
directories — which the principal's own open question concedes deserves an
explicit product ruling; B's foreign-parent behavior is exactly today's
non-fatal-warning behavior, changed by nothing. Accepts the factual reading
of the flag-surface divergence but scopes the Intent sentence to the tested
surface; the divergence case is follow-up material (principal's
discriminator = that card's red-at-base), never added to this card's
acceptance (it would silently change the oracle). Corrected two of the
designer's smoke predictions with a real run: read-only parent with
`--out-dir` absent → **exit 1 PermissionError traceback** (not exit 3
`could not write report`); read-only existing dir without `.gitignore` →
**exit 1 traceback** from the `.gitignore` write — `ensure_out_dir` sits
outside the report-write try (`usages.py:792` before the `try:` at 793),
before the fix, after it, and identically under A. Settled its own two
questions: no hardening on this card (follow-up card's first line must be
the product ruling); T-U7's stderr assertion stays pinned to the literal.

**Round 2 — principal (job-1.5), condensed:** Recommends **mechanism B for
this card**. Grounded facts: `save_cache` has exactly one caller (`main`);
`ensure_out_dir` is not a pure mkdir (`.gitignore` write) and is called
outside the report-write try; the only binding coupling is
`cache_file = out_dir/.cache.json` when `--cache-file` is omitted — exactly
the card's tested surface, where the two mechanisms are *genuinely
equivalent*. Retracts the scope claim: "I was wrong to let it choose the fix
for this card." Named blind spots: the owner's "every caller" concern is
theoretical; the designer's prediction (4) conflated mkdir-failure with
report-write-failure; own vantage gap — R4's wording ("parent directory
exists") does not literally name the absent-foreign-parent case, so the
follow-up card should be chartered explicitly for the `--cache-file` parent
surface. Answers: (1) discriminator out of scope (goal + R4 + oracle);
(2) the create-vs-reject ruling is new-card material; forced to A or B with
the acceptance as sole oracle — no ground to force A, accepts B; (3) yes,
both pass T-U7/T-U8 identically; round-1 material becomes follow-up card
material. Testable claims: A/B indistinguishability by construction; the
discriminator as the follow-up's red; B's failure-surface shift (moved call
is unguarded — raise occurs before the cache warning); the record must scope
the equivalence sentence to `--cache-file` omitted.

**Round 2 — designer (job-1.6), condensed:** Holds **mechanism B**,
acknowledging the principal's flag-surface reading is correct and important
but scoped out by R4; the single-owner/conceptual-model axis is the
discriminand on the acceptance surface, and B wins it. Verified
`save_cache` has exactly one call site (line 744). Refined predictions: (1)
grep discriminator — under B the call sits ~line 720 (before `load_cache`),
the ~789 call deleted; under A, `save_cache` gains a parent mkdir at ~463.
(2) Split round-1 (4) into two cases: read-only **parent of** `out_dir`
under B fires at `ensure_out_dir` before any network call (single traceback,
no analytics requests, no cache literal) — B strictly better; read-only
`out_dir` itself unchanged between A and B. (3) Adopted the principal's
foreign-`--cache-file` discriminator as a non-gating smoke. Follow-up flag
unchanged (cache stats in `human_summary`); not reopening R4 from this
seat; if A were ever chosen, the create-vs-reject product ruling is owed
separately.

**Step 3 outcome — converged, 2 of ≤3 rounds used.** All three generators
hold **mechanism B** (move `ensure_out_dir(out_dir)` above the first
`save_cache`; `save_cache` stays a pure primitive). Disagreements dissolved:
the principal withdrew its A-preference for this card (acceptance cannot
distinguish A from B; R4 routes the foreign-`--cache-file` absent-parent
case to a new card, chartered explicitly, carrying the principal's
discriminator as its red-at-base, with the create-vs-reject ruling owed
there). Recorded scoping: the card's "the observable contract is the same"
sentence is true **for its oracle** (`--cache-file` omitted) and is to be
implemented and read as so scoped. Known accepted limitation under B: a
`--cache-file` naming an absent parent outside `out_dir` keeps today's
non-fatal warning and writes no cache. Notes carried to the owner: the moved
`ensure_out_dir` is unguarded and side-effecting (`.gitignore` write), sits
outside the report-write try, and pre-existing failure there is an exit-1
traceback both before and after the move — do not change that failure
surface in this card. Follow-up candidates recorded for step 13: (F1)
foreign-`--cache-file` parent surface (principal's discriminator as
red-at-base; product ruling: create vs reject); (F2) cache stats in the
human summary (`cache: hits=N misses=M`).
