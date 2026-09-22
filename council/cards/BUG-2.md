---
id: BUG-2
title: Usages tool creates its output directory before writing the cache
state: In Review
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

### Step 4 — skeptic attack (job-1.7), objections and actual results

All probes run read-only against HEAD `42b59c8` (pre-fix); falsifiers and
the mechanism-B transplant in `/tmp/sk-bug2/`; main checkout clean before
and after.

**Red-at-base evidence (seven-field record):** base identity `42b59c8` (base
role: required); transplant set materialized in /tmp (`tu78.test.ts` strict
T-U7/T-U8 falsifier + probe harnesses); exact command `cd /tmp/sk-bug2 &&
timeout 180 bun test tu78.test.ts` (head half `TOOL=/tmp/sk-bug2/fixed/
usages.py`); raw reds — T-U7 R1 stderr carried the literal
`usages: could not write cache: [Errno 2] …` and `.cache.json` absent, R2
`hits: 0`, T-U8 `fresh-out/.cache.json` absent, `0 pass / 2 fail` at base;
head half `2 pass / 0 fail / 16 expect()`; existing suite re-pointed at the
transplant `6 pass / 0 fail`. Comparison triple `(42b59c8, {tu78.test.ts +
probe harnesses}, bun test tu78.test.ts)` identical across halves. Boundary
nuance: **T-U7 R2's "stderr clean" is green at base** (R1's line-792
`ensure_out_dir` already created the dir) — the run-2 red rests entirely on
`hits === 1`, which is the load-bearing assertion.

Objections, each with the test actually run:

1. T-U7/T-U8 fail on the pre-fix tree, on exactly the named assertions —
   **closed-green** (`0 pass / 2 fail` at base; reds exactly the cache-write
   warning, R1 cache absence, R2 `hits: 0`, T-U8 cache absence). Stub is
   load-bearing: with a dead port no rows arrive and the cache never
   populates.
2. Mechanism B produces the acceptance state — **closed-green**
   (transplant: `2 pass / 0 fail`; all 10 T-U7 conditions and both T-U8
   conditions pass). No in-scope configuration found where B fails.
3. Insertion point breaks T-U2 (key check vs moved `ensure_out_dir`) —
   **closed-green**, concern unfounded: the key check (`return 2`) precedes
   out_dir/cache_file resolution; key-missing probe on the fixed variant
   exits 2 writing nothing; existing T-U2 passes against the transplant
   (6/6).
4. Owner's read-only smoke claims — **closed-green** for the operative
   claim (exit 1 PermissionError traceback in both scenarios, both variants,
   never exit 3); **closed-red** on the strict "identical failure surface"
   letter — pre-fix stderr carries an extra `usages: could not write cache:`
   line before the traceback, the fixed variant drops it. Cosmetic, outside
   the acceptance surface; the record's "identical" is corrected to
   "identical exit code and traceback class."
5. Foreign-`--cache-file` divergence persists post-fix exactly as scoped by
   R4 (both variants exit 0, foreign cache never written, warning present) —
   **closed-green**.
6. Regression on shipped tests — **closed-green** (6 pass / 0 fail against
   the transplant).
7. Merged-SHA head half — **open-untested** by construction (no merge this
   turn); pending evidence is the transplant pair; the merged-SHA run is
   the step-9/11 gate.

**Actionable findings carried to the owner:** (a) T-U7/T-U8 must use the
T-U4 async pattern (`Bun.spawn` + `await proc.exited`) — the existing
`runTool` helper uses `spawnSync`, which blocks the event loop so
`Bun.serve` cannot answer python's HTTP calls; the acceptance tests would
deadlock, not fail (reproduced: `status: null … timed out after 5000ms`);
(b) run 2's red rests on `cache.hits === 1` alone — keep it as the
load-bearing run-2 assertion.

### Step 5 — consolidator synthesis (job-1.8)

**Agreed design:** mechanism B — move `ensure_out_dir(out_dir)` above the
first `save_cache` (before `load_cache`), delete the later call;
`save_cache` stays a pure primitive; single owner of "out dir set up"; fix
stays inside `usages.py`; `EMPTY_DIRS` untouched. The Intent sentence is
scoped to the tested surface (`--cache-file` omitted); the foreign
`--cache-file` divergence is acknowledged fact, out of scope here.

**Settled (each by an actually-run test):** S1 red-at-base premise
(`0 pass / 2 fail` at base, `2 pass / 0 fail` on the mechanism-B transplant,
existing suite 6/6 re-pointed) — closed-green; S2 T-U2 interaction (key
check precedes out_dir resolution; exit 2 writes nothing; T-U2 green against
the transplant) — closed-green, concern unfounded; S3 owner's read-only
smokes (exit 1 PermissionError traceback in all four scenario/variant runs,
never exit 3; cosmetic stderr letter-difference recorded) — closed-green for
the operative claim, closed-red on the strict "identical failure surface"
letter; S4 foreign-`--cache-file` divergence identical under both variants,
scoped out by R4 — closed-green; S5 stub load-bearing (dead port → cache
never populates) — closed-green.

**Open judgment:** OJ1 mechanism A-vs-B — the consolidator records that the
A-vs-B difference is not observable under T-U7/T-U8, all three seats chose
B, and the principal explicitly withdrew its A-preference for this card
(scoping it to the follow-up F1 surface), concluding "no seat holds a
different position" — then routes "confirmation of the B selection" to
`product-owner`. **Facilitator routing reading (step 6):** a unanimous
convergence whose only residual is a withdrawn preference is not an
open-judgment dispute — the step-6 route is for what the deliberation left
open, and this deliberation left the fix choice closed (S1's runs closed the
operative question; the principal retracted its scope claim in round 2). The
genuinely open product question — create foreign cache parents vs reject
with a usage error — is already routed where it belongs: **F1**, a future
card chartered for the `--cache-file` parent surface, where the ruling is
owed. No `product-owner` dispatch and no `Needs Human` state arise from this
card; nothing blocks handoff.

**Open objections:** OO1 spawnSync trap in `runTool` (T-U7/T-U8 drafted on
it would deadlock, not fail — reproduced `status: null … timed out`;
actionable, carried to the owner: author T-U7/T-U8 with the T-U4 async
`Bun.spawn` + `await proc.exited` pattern); OO2 merged-SHA full-suite run —
open-untested by construction, deferred to step-9 verification and the
merged-SHA gate (not a blocker for implementation).

**Follow-up candidates carried to step 13:** F1 foreign-`--cache-file`
parent surface (principal's discriminator as red-at-base; product ruling
owed: create vs reject); F2 cache stats in the human-readable summary;
F3 `runTool` async migration (`spawnSync` → T-U4 async pattern, the
deadlock trap removed for future test authors); F4 record-only cosmetic
marker — pre-fix read-only stderr carries an extra cache-warning line the
fixed variant drops (no action unless scope expands).

### Step 7 — spec committed (facilitator)

`docs/superpowers/specs/2026-09-22-BUG-2-design.md` written and committed
(`114b549`). Self-reviewed: no placeholders or unresolved TODOs; consistent
with the deliberation's settled design (mechanism B, R4 scoping, the
spawnSync-trap instruction, the run-2 `hits === 1` nuance); scope confined
to the card's goal; an owner reading only this file cannot reach two
different designs. Card set `In Progress` on card face and board;
`validate.py` clean.

### Step 6 — routing outcome (facilitator)

Zero open-judgment disputes require a ruling seat on this card: OJ1's B
selection is a converged, tested settlement (see the step-5 routing reading);
F1's create-vs-reject ruling is future-card material and does not gate this
card. Zero blocking open objections: OO1 is carried to the owner as an
implementation instruction, OO2 is the deferred merged-SHA gate. The card
does **not** enter `Needs Human`; steps 7+ proceed.

### Step 8 — owner delivered (job-1.9), PR #104 open

Owner implemented in worktree `.worktrees/bug-2` (branch
`feat/bug-2-usages-out-dir`, created with `git worktree add … origin/main`;
main checkout untouched — no checkout/switch/reset against it), pushed, PR
#104 open, head SHA `8a4b2a93e1c4bd8b41aad6caf4d9c3872a64d36d`. Observed
directly by the facilitator (not from the seat's report): `gh pr view 104`
→ state OPEN, base `main`, headRefOid `8a4b2a9…`, `mergeable: MERGEABLE`
(mergeStateStatus `BLOCKED` — the ruleset's approving-review / PR-only
requirement, the condition R1's sanctioned bypass exists for). Diff: 3
files, +307/−1 — `usages.py` +1/−1 (the settled mechanism B, exactly the
spec's insertion point), `test/usages.test.ts` +94 (T-U7, T-U8, async
`serveStub`/`runAsync` helpers), plan doc +212. Single commit
`fix(usages): create the output directory before the first cache write`.

Owner gates green at head, real results: preflight `PASS: preflight clean`;
`bun test test/usages.test.ts` 8 pass / 0 fail; `bun test
test/scaffold.test.ts` 6 pass / 0 fail; full `bun test` **1466 pass / 6
skip / 0 fail** (1472 tests / 113 files, 113.13s); `bunx tsc --noEmit`
clean; `validate.py` → `All council artifacts valid`. Red-at-base recorded
with the seven-field record: base `114b549` (origin/main pre-fix), tests
written first on the mandatory async pattern, raw reds
`6 pass / 2 fail / 42 expect()` — T-U7 and T-U8 each red on
`Expected to not contain: "usages: could not write cache:"` with the real
`Errno 2` temp-file paths named; head half `8 pass / 0 fail / 51 expect()`.
Bun stops a test at its first failed expect, so the remaining base-reds
(`.cache.json` absence, run-2 `hits === 1`, `fresh-out/.cache.json`
absence) surface only post-fix — each was verified directly at base by the
skeptic's independent probes (step 4). Disclosed deviations: gitignored
untracked symlinks in the worktree pointing at the main checkout's installs
(identical across red/green halves, never committed); a plan-doc code-sketch
signature inconsistency the committed tests resolve.

Card set `In Review` (sole precondition: open PR, observed).

### Step 9 — Skeptic NO-BLOCK at head 8a4b2a9 (verify cycle 1 of ≤3)

Skeptic (job-1.10) verified at the pinned subject — PR #104, head SHA
`8a4b2a93e1c4bd8b41aad6caf4d9c3872a64d36d`, head worktree
`.worktrees/bug-2` — with the loop frame stated (step 9 precedes step 10
judging and step 11's facilitator-executed mechanical merge). Verdict:
**`NO-BLOCK`**, six objections, all `closed-green`, each with a real run:

1. Red-at-base independently reproduced: detached throwaway worktree at
   base `114b549` under /tmp, head's test file transplanted, base
   `usages.py` untouched → `6 pass / 2 fail / 42 expect()`, failing exactly
   on the cache-write literal at the two named lines; comparison triple
   equal; reds mechanism-absent (each names
   `usages: could not write cache: [Errno 2] …` against a mkdtemp out dir,
   nothing in the copy set).
2. Head half `8 pass / 0 fail / 51 expect()` at `8a4b2a9` — closed-green.
3. Gates reproduced at head: usages 8/0/51, scaffold 6/0/65, full suite
   **1466 pass / 6 skip / 0 fail** (113 files, 112.02s), tsc exit 0,
   validate.py clean. Preflight PASS on the current tree; the worktree
   preflight FAIL (`local history does not descend from origin/main`) is
   the structurally guaranteed FLLWUP-27 artifact — `origin/main` advanced
   by exactly the two board-doc record commits past branch base — outside
   the acceptance's gate set, resolving at merge.
4. Diff scope exact: 3 files +307/−1; `usages.py` is precisely the one-line
   move; `extensions/scaffold.ts` diff = 0; async pattern confirmed
   (`spawnSync` only in the legacy offline-test helper); no out-dir
   pre-creation in the new tests — closed-green.
5. Foreign-`--cache-file` limitation un-regressed (head probe: exit 0,
   warning present, no cache written) — closed-green.
6. PR body names T-U8 as the EMPTY_DIRS-unsatisfiable test and records the
   limitation; subject SHA equals pinned SHA equals worktree HEAD —
   closed-green.

Verify cycles used: 1 of ≤3; no fix cycle needed.

### Step 10 — judge PASS (job-1.11)

Judge dispatched with exactly the card's `goal` (verbatim) + the step-9
Skeptic evidence, subject pinned (PR #104 head `8a4b2a9…`, head worktree
`.worktrees/bug-2`), loop frame stated (the verdict precedes step 11's
mechanical merge, which has not happened). Verdict **PASS**: the goal's
four concrete behaviors (directory created before the cache write;
`.cache.json` left inside it; no `usages: could not write cache:` line;
clean exit) are exercised by T-U7 (default path) and T-U8 (absent custom
`--out-dir`), both green at the pinned head; the judge independently re-ran
the suite at `8a4b2a9` → `8 pass / 0 fail / 51 expect()`, matching the
skeptic's claim verbatim; base reds at `114b549` confirm the tests exercise
the bug; the fix is the clean one-line `ensure_out_dir()` move. No REJECT
basis; no goal-text ambiguity found.

### Step 11 — merge-gate observable half (facilitator; merge is the orchestrator's act under R1)

`gh pr checks 104 --json name,state,workflow` →
`[{"name":"gates","state":"SUCCESS","workflow":"gates"},{"name":"[code]smith","state":"SKIPPED","workflow":""}]`
— keyed on the `workflow` field; the `gates` workflow is present with
`state: SUCCESS` on the PR head (merge-check criterion 2 satisfied).
Corroborated at the run level: `gh run list --branch
feat/bug-2-usages-out-dir` → run 35729154478, name `gates`,
`workflowName: gates`, status `completed`, conclusion `success`,
`headSha: 8a4b2a93e1c4bd8b41aad6caf4d9c3872a64d36d` (== the PR headRefOid,
re-read in the same breath), event `pull_request`, run_attempt 1, started
12:45:49Z completed 12:48:05Z — so the observed SUCCESS is the run this
PR's own event triggered at the pinned SHA, not a stale or foreign run.
The other listed check (`[code]smith`, workflow field empty) is not the
`gates` workflow and is not asserted on. PR head SHA verified unchanged
after the gate run and before reporting. The merge itself is NOT performed
by this container — per R1 the orchestrator performs the deterministic
merge check and merges (admin-bypass, SHA-pinned, watching the first
autonomous merge).

### Step 13 — follow-up candidates drafted and HELD (no disposition reached in-container)

Four candidates drafted. `council_followup_review` is not dispatchable from
this container (`Unknown seat`-class failure: the gate tools do not resolve
here), so no decision was recorded and **no card was written**; per the
runner's follow-up contract these are **held, not filed**, resumable by the
next runner against these exact draft titles:

1. **"Foreign `--cache-file` parent surface — absent parent keeps the silent no-cache warning"**
   — goal: rule and implement the behavior when `--cache-file` names a
   parent directory that does not exist (create the parent vs reject with a
   usage error), with the principal's discriminator (`--out-dir <dir>` +
   `--cache-file <repo>/nested/absent/.cache.json`, non-offline, live
   analytics stub) as red-at-base. Source: principal round 1–2, verified
   persisting post-fix by both skeptic passes (step-4 probe and step-9
   probe).
2. **"Cache hit/miss counts in the human-readable usages summary"**
   — goal: surface `cache: hits=N misses=M` in the human summary (today
   only the JSON report carries cache stats), so the person gets positive
   feedback the cache machinery worked. Source: designer rounds 1–2.
3. **"Migrate `runTool` in test/usages.test.ts to the async spawn pattern"**
   — goal: replace the `spawnSync`-based `runTool` helper with the T-U4
   async pattern (`Bun.spawn` + `await proc.exited`) so future test authors
   do not inherit the deadlock trap the step-4 skeptic reproduced
   (`status: null … timed out` when the stub cannot answer). T-U7/T-U8
   already use the async pattern; this is the legacy-helper cleanup.
4. **"Record-only marker: pre-fix read-only stderr letter difference"**
   — goal: none (record-only). Pre-fix read-only-out-dir failure stderr
   carries an extra `usages: could not write cache:` line the fixed variant
   drops; exit codes and traceback class identical. File only if a later
   card asserts byte-identical failure surfaces; otherwise drop.

R4 (binding): candidate 2 must not be folded into BUG-2's deliverable; it
is a separate card if ratified.

### Steps 12–14 — NOT executed in this container

Step 12 (post-merge reconcile + `Done`) requires the merge to land; the
merge is the orchestrator's act under R1. Step 13's dispositions and
step 14 are likewise post-merge runner work. Resume point for the next
runner: apply the R1 merge (`gh pr merge 104 --squash --admin
--match-head-commit 8a4b2a93e1c4bd8b41aad6caf4d9c3872a64d36d`), rebase
local `main`, run the gates on the merged SHA, set the card `Done`, commit
and push the reconciliation record, then take up the held step-13
candidates with the recorded dispositions.
