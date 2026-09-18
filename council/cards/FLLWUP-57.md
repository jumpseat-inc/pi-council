---
id: FLLWUP-57
title: Suite determinism under a catalogue-valid ambient COUNCIL_EVAL_MODEL
state: In Review
owner: null
epic: EPIC-9
goal: A test run of test/ with a catalogue-valid ambient COUNCIL_EVAL_MODEL exported passes, and any test that resolves the ambient as its effective model is isolated or pinned, so bun test is shell-independent for every catalogue-valid value.
---

## Intent

FLLWUP-40's oracle and its step-9/step-11 probes exercised the ambient unset, a
plain unknown-model value, and an unknown-model `:thinking`-suffixed value — all
of which take the loud-refusal path. A *catalogue-valid* ambient value resolves
as the effective model instead and was not exercised across the whole suite.
Whether any remaining test in `test/` resolves an exported catalogue-valid
ambient as its effective model, and thus still makes `bun test`
shell-dependent, is the narrow but real residual `product-owner` (job-29)
approved from FLLWUP-40's step-13 candidate A.

## Run record (features-deliver / FLLWUP-57 — EPIC-9 residuals run 2)

### Step 1 — promotion + classification (facilitator)

- **Promotion (`Backlog` → `Ready`) applied, not asked.** Phase-1 run-2 scope
  ruling (`EPIC-9.md` run-2 block, 284ced2): `FLLWUP-50` through `FLLWUP-60`
  "are this run's delivery scope", and the human's dispatch input orders this
  card **third** of eleven (steward build-order ruling, job-1, `FLLWUP-60`
  merged `aa1923f` and `FLLWUP-52` retired under R4 already complete). Run-1
  precedent (5608ed1) and run-2 precedent (FLLWUP-60's promotion commit
  `08fdb83`): the autonomous promotion moves the residual card to its working
  state at its runner's start, no separate promotion round-trip. Cited
  ruling: Phase-1 run-2 **scope**. `python3 council/validate.py` clean after
  the edit.
- **Path: mechanical.** The deliverable is confined to `test/` files (plus at
  most test-helper code), the `goal` admits one reasonable design — the same
  isolate-or-pin pattern FLLWUP-40 already established and the Skeptic
  verified there (pin or clear the ambient in `beforeEach`/`finally`, restore
  the shell value on every path) — and no cross-seam or design tradeoff is in
  play. A deliberation would have nothing open to deliberate. Steps 2–6
  skipped per council.md step 1; the owner's handoff is the card itself.
- **Surface-touching: no.** Test-only code changes no visible surface, no
  user-visible copy, no empty state, no error state. No `designer` seat is
  seated.
- **Seat resolution (`<seat_resolution_check>`):** `owner`, `skeptic`,
  `judge` — the only seats this path dispatches — all resolve; the nine
  packaged seat files are present in `council/agents/` and in the installed
  package clone, and no repo-local `.pi/agents/` override directory exists,
  so nothing shadows them. Ruling seats (`product-owner`, `steward`) are
  never dispatched by this container.
- **Environment:** step 0 preflight skipped per the autonomous-run
  substitution (Phase 0 cleared it); run for information only → `PASS:
  preflight clean`, exit 0. Local `main` == `origin/main` at `ad9962c71534…`,
  working tree clean. `python3 council/validate.py` → `All council artifacts
  valid`. No `Needs Human` state and no outstanding ruling on this card —
  criterion 5 holds at card start.
- **Gate set for this repo** (authoritative: `.github/workflows/gates.yml` +
  [[deterministic-merge-check]]; `docs/gates/GATE-EVIDENCE.md` does not exist
  here): `bash council/preflight.sh FLLWUP-57`, `bunx tsc --noEmit`,
  `bun test`, `python3 council/validate.py`. Owner gates met in full
  regardless of change size.
- **Blast radius checked (no digest re-pin owed):** no fixture seed carries
  any repo `test/` file in this card's scope — `council/fixtures/*/seed/test/`
  holds only each fixture's own `links.test.ts` and static samples (verified
  by listing; no `eval-runner*` or `job-retry*` anywhere under
  `council/fixtures/`), so AGENTS.md #5's `seed.treeDigest` machinery is
  untouched. `test/prose.test.ts` pins `council.md` procedure prose — this
  card touches no procedure text; FLLWUP-60's record-push pin and FLLWUP-41/42
  pins stay green by construction.
- **Rulings applied here (cited, not re-asked):** Phase-1 run-2 scope governs
  the promotion; `steward` job-1 governs the position; R2 governs the later
  merge; R3 governs this record's direct pushes (disclosed per
  [[record-push-discipline]]).

### Step 7 — hand to one owner (mechanical path)

No deliberation ran, so the card itself is the owner's handoff: its `goal`,
`Intent`, and the FLLWUP-40 pattern it must extend. Card set `In Progress`;
`python3 council/validate.py` clean at the move; promotion commit `bb5c5e8`
and this record commit pushed directly to `main` under R3 (disclosed:
standard ruleset bypass notice). `owner` dispatched (45-minute window).

### Step 8 — owner delivered (job-5.1), PR #68 open

Owner implemented in worktree `.worktrees/fllwup-57` (branch
`feat/fllwup-57-eval-model-catalogue-valid`, base `origin/main` `77bab89`),
pushed, PR #68 open at head
`5b5e9c9e60e618f8965ad000220eb1424d5f8d4a`. Observed directly (not from the
seat's report): `gh pr view 68` → state OPEN, base `main`,
`mergeable: MERGEABLE` (mergeStateStatus `BLOCKED` — the ruleset's
approving-review / PR-only requirement, cleared at merge by R2), headRefOid
`5b5e9c9…`. Diff scope (observed): `test/override.test.ts` +21/−2 and the
plan doc `docs/superpowers/plans/2026-09-18-FLLWUP-57-plan.md` +65 — 2
files, +84/−2. No engine change, no other test file touched.

**The owner's audit finding (recorded as fact; the Skeptic attacks it):**
the suite was green under a catalogue-valid ambient **only by masking
luck** — `test/override.test.ts`'s existing `afterEach` *deleted* the
ambient rather than restoring it, so its own later tests and every test
file after it ran ambient-less; a catalogue-valid shell value never
survived into them. Single-test probes bypassing that shield went red with
real output (fallback test `isError` true under V1; D2 expecting
`"openrouter/grader/m1:high"` ≠ pinned `"openrouter/grader/m1"` under V2).
The fix extends FLLWUP-40's invariant file-wide in `override.test.ts`:
shell value captured at module load, `beforeEach` clears the ambient,
`afterEach` restores on every path. The FLLWUP-40-fixed files
(`eval-runner`, `job-retry`) keep their per-test patterns untouched.
Catalogue-valid values exercised: V1 `openrouter/qwen/qwen3.8-flash`, V2
`openrouter/qwen/qwen3.8-flash:high` (with `:thinking` suffix). Post-fix:
`bun test` **894 pass / 2 skip / 0 fail / 5649 expect()** in all three
states (unset, V1, V2); `bunx tsc --noEmit` exit 0; `validate.py` clean;
all gates proven fallible with injected-then-restored reds.

**Owner deviation, disclosed:** a gate-integrity probe's `git restore`
briefly wiped the uncommitted fix in the worktree; re-applied
byte-identically, committed at `5b5e9c9`, and one full-suite state re-run
against the committed head. Main repo branch state untouched; work
confined to `.worktrees/fllwup-57`.

Owner usage (verbatim, job-5.1):

```
job-5.1  turns=50 tokens=in 99724/out 24773/cR 2266496/cW 0/reason 16402/total 2390993 cost≈$0.0572 (catalogue)
```

Card set `In Review` (sole precondition: open PR, observed).

### Step 9 — Skeptic NO-BLOCK at head 5b5e9c9 (verify cycle 1 of ≤3)

Skeptic (job-5.2) verified at the pinned subject — head SHA
`5b5e9c9e60e618f8965ad000220eb1424d5f8d4a`, head worktree
`.worktrees/fllwup-57` — with the loop frame stated (step 9 precedes step 10
judging and step 11's facilitator-executed mechanical merge). Verdict:
**`NO-BLOCK`**, eight objections, all `closed-green`, each with a real run
at the head:

1. **Masking-luck finding confirmed, not confabulated.** Base
   (`77bab89`) `afterEach` was a bare `delete process.env.COUNCIL_EVAL_MODEL`
   — the mask is real: base natural full-suite under a catalogue-valid V1
   ambient is green (894/0), while shield-bypassed probes go red (below).
2. **Probe values genuinely catalogue-valid.**
   `openrouter/qwen/qwen3.8-flash` present in pi's catalogue
   (`openai-completions/qwen/qwen3.8-flash/id` in the openrouter provider
   data); both V1 and V2 (`…:high`) resolve through `resolveEffectiveModel`
   — not the loud-refusal path.
3. **Red-at-base records (FLLWUP-47 convention, both rows complete):**
   base `/tmp/fllwup57-base` detached worktree, bare copy, probe commands
   identical base↔head. Row 1 (V1, `-t "omitted override falls back"`):
   `expect(received).toBeFalsy()` → Received `true` at
   `override.test.ts:253`, 1 fail at base; head 1 pass / 0 fail. Row 2 (V2,
   `-t "D2: grader dispatch"`): Expected `"openrouter/grader/m1"` Received
   `"openrouter/grader/m1:high"` at `override.test.ts:354` (the ambient's
   `:thinking` suffix composed into the effective model), 1 fail at base;
   head pass. Mechanism-absent reds; copy-set has zero dependent reds.
4. **Fix semantics exact.** Capture-at-module-load + `beforeEach` clear +
   `afterEach` restore confirmed; deterministic restore proven with a
   `zz_`-sorted probe file (bun runs files sequentially in one process, so
   it sorts after `override.test.ts` and observes the restored shell value);
   throw path covered (`shutdownHub()` cannot skip the restore;
   `SAME_FILE_AFTER=shellX3` probe). FLLWUP-40 files byte-identical
   base↔head (empty diff).
5. **Three-state determinism.** `bun test` at the committed head: unset /
   V1 / V2 all **894 pass / 2 skip / 0 fail / 5649 expect()**, per-test
   result lines byte-identical across states (timing-normalized; only `[ms]`
   and filler whitespace differ). Owner counts exactly reproduced — the
   owner's `git restore` deviation is closed by these being committed-tree
   runs (worktree clean throughout).
6. **Structural audit — no uncontrolled ambient reader anywhere.** Engine
   reads the ambient in exactly two places (`dispatch.ts:55`,
   `hub-tools.ts:174` — the mechanism itself). Test readers confined to
   `override.test.ts` (now shielded file-wide), `eval-runner.test.ts`
   (self-pins + `finally`), `job-retry.test.ts` (`withAmbientEvalModelCleared`
   wrapper); other mentions are string/argv assertions, no execute path.
   This is the seal for "for every catalogue-valid value".
7. **Diff scope; no assertion touched.** Exactly `test/override.test.ts`
   (+21/−2: import line + bare-delete rewrite) + plan doc (+65, new file);
   `expect(` count 72 base == 72 head; no engine file.
8. **Gate integrity at head, each proven fallible.** tsc (TS2322 named
   injection → red → removed); bun test (`expect(1).toBe(2)` named probe →
   red → removed); validate.py (tampered `/tmp` COPY → `FAIL: FLLWUP-57:
   missing required key 'state'`, exit 1; real `council/` untouched). Final
   clean-tree re-run restored 894/2/0/5649.

Non-blocking artifact recorded: preflight branch-freshness FAIL
(`local history does not descend from origin/main`) — the documented
FLLWUP-27 artifact, no gate weakened. Cleanup confirmed: base worktree and
all probes removed, head worktree clean at the pinned SHA, main checkout
untouched, `validate.py` clean.

Skeptic usage (verbatim, job-5.2):

```
job-5.2  turns=57 tokens=in 60244/out 50291/cR 3586048/cW 0/reason 35549/total 3696583 cost≈$0.0527 (catalogue)
```

Verify cycles used: 1 of ≤3; no fix cycle needed.

### Step 8a — diverged-`main` union reconcile at the record push

The step-8 record push was rejected — `origin/main` had advanced with two
commits this container did not author (`a4e78cd`, `1e4e8d0`): a concurrent
EPIC-10 decomposition run (`feat(council):` record commits, EPIC-10 +
EV-44/45/46/47 cards, based on this run's own `77bab89`). That side's copy
of `FLLWUP-57.md` was this card's stale step-7 state — it did not modify
this card; only my step-8 record was the newer side. Repaired per
council.md step 12 / [[union-merge-reconcile]]: union-merge `origin/main`
(git auto-resolved; both sides touched different regions), union-keep both
record sides, board's exactly-once invariant governing FLLWUP-57's row
(single-writer: `In Review`), conflict-marker sweep clean (grep hits were
historical card prose only), `python3 council/validate.py` → `All council
artifacts valid`, pushed as `9f1b8f7` under R3. Local `main` ==
`origin/main` == `9f1b8f7` before the Skeptic dispatch. No side discarded,
no force used.
