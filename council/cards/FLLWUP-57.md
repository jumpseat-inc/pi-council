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
