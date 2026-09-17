---
id: FLLWUP-40
title: Isolate COUNCIL_EVAL_MODEL from the eval-runner dispatch-primitive test
state: In Review
owner: null
epic: EPIC-9
goal: A test run of test/eval-runner.test.ts inside a council seat shell with COUNCIL_EVAL_MODEL set, and outside it, both pass without the ambient model variable changing the dispatch-primitive expectation.
---

## Intent

`test/eval-runner.test.ts:210-213` asserts the ambient
`process.env.COUNCIL_EVAL_MODEL` instead of clearing it, so the suite's
green/red depends on the shell it runs in. This run's own owner and Skeptic
reported different red counts because of it, and while it holds, criterion 1
of the deterministic merge check — local gate evidence — is
environment-dependent. Named by the steward closure ruling as owed before the
next autonomous run.

## Execution (run record)

### Step 1 gate (2026-09-17, runner container) — mechanical, not surface-touching

**Mechanical.** The change is narrowly scoped to one test file
(`test/eval-runner.test.ts`), the `goal` admits one reasonable design (make
the test's pass/fail independent of the ambient `COUNCIL_EVAL_MODEL`, while
keeping the dispatch-primitive expectations intact in both environments),
and no cross-seam or design tradeoff is in play. Per council.md step 1 a
mechanical card skips steps 2–6 and proceeds directly to step 7; the owner's
handoff is the card's own `Intent`/`goal` — no design-spec file is written
for a mechanical card.

**Not surface-touching.** The deliverable is test-only code; it changes no
visible surface, no user-visible copy, no empty state, no error state. No
`designer` seat is seated.

Evidence base read before this decision: `test/eval-runner.test.ts`
(lines ~186–214, the dispatch-primitive case), `extensions/dispatch.ts`
(`spawnSeatJob`, the `spawnEnv` / `process.env` boundary at the
`COUNCIL_EVAL_MODEL` carrier), `extensions/seats.ts`
(`resolveEffectiveModel` precedence), `.github/workflows/gates.yml`, and
`vault/wiki/index.md` → [[deterministic-merge-check]].

Seat resolution checked before dispatch: `owner`, `skeptic`, `judge` (and
`consolidator`/`principal`/`designer`, unused on this path) all resolve —
the nine packaged seat files are present in `council/agents/` and in the
installed package clone, and no repo-local `.pi/agents/` override shadows
any of them.

Gate set for this repo (authoritative: `.github/workflows/gates.yml` +
[[deterministic-merge-check]]): `bunx tsc --noEmit`, `bun test`,
`python3 council/validate.py`. Owner gates are met in full regardless of
change size.

### Step 7 — hand to one owner (mechanical path)

No deliberation ran, so the card itself is the owner's handoff. Card set
`In Progress`; `validate.py` clean; `owner` dispatched.

### Step 8 — owner delivered (job-2.1), PR #58 open

Owner implemented in worktree `.worktrees/fllwup-40` (branch
`feat/fllwup-40-eval-model-isolation`, base `origin/main`
`93d7a34d5a7b2bd4266681346bfd86af489af605`), pushed, PR #58 open at head
`470bc96dce591617b2ff60e75022b4e1a7ffefd1`. Observed directly (not from
the seat's report): `gh pr view 58` → state OPEN, base `main`,
`mergeable: MERGEABLE`, headRefOid `470bc96…`.

Diff scope (`git diff --stat 93d7a34..470bc96`): `test/eval-runner.test.ts`
+28/−, `test/job-retry.test.ts` +19/−, and the new plan doc
`docs/superpowers/plans/2026-09-17-FLLWUP-40-plan.md` +64. No engine
changes.

Owner gates green at head, real output: `bunx tsc --noEmit` exit 0;
`bun test` **847 pass / 2 skip / 0 fail** with no ambient var and, run
again with `COUNCIL_EVAL_MODEL="openrouter/ambient/model:high"` exported,
**847 pass / 2 skip / 0 fail — identical 5481 expect() calls in both
states**; `python3 council/validate.py` clean. Red-first runs recorded:
ambient `…:high` → 1 fail at `:210` (`Received:
"openrouter/ovr/model:high"`), ambient without suffix → 1 fail at `:213`.

**Scope extension flagged for verification, not suppressed:** the owner
also fixed the same defect class in `test/job-retry.test.ts` (two wired
`dispatch()` calls with no model param legitimately resolved an exported
ambient as the effective model and hit the loud-refusal path). Its
justification: the card's oracle reads "test/eval-runner.test.ts **(or the
suite)** … both pass", and the card's Intent names criterion 1 — the
`bun test` gate as a whole — as the environment-dependent thing being
fixed; leaving those two red would leave the gate environment-dependent.
The owner reports no assertion was narrowed or deleted. The Skeptic is
directed to attack both the closure and the extension's scope.

Card set `In Review` (sole precondition: open PR, observed).

Owner usage (verbatim, job-2.1):

```
job-2.1  turns=36 tokens=in 74436/out 17647/cR 1376512/cW 0/reason 9600/total 1468595 cost≈$0.0368
```

### Step 9 — Skeptic NO-BLOCK at head 470bc96 (verify cycle 1 of ≤3)

Skeptic (job-2.2) verified at the pinned subject — head SHA
`470bc96dce591617b2ff60e75022b4e1a7ffefd1`, head worktree
`.worktrees/fllwup-40` — with the loop frame stated (step 9 precedes step 10
judging and step 11's facilitator-executed mechanical merge). Verdict:
**`no open objections`**, five objections all `closed-green`, each with a
real run at the head:

1. **Environment-dependence closed, not masked.** Three full-suite runs at
the head — ambient unset, `openrouter/ambient/model`, and
`openrouter/ambient/model:high` — all identical **847 pass / 2 skip / 0 fail /
5481 expects**. Grep confirms no test still depends on the shell ambient
(`override.test.ts` pins its own value before asserting).
2. **Real invariant preserved.** Diff head-vs-base shows only *added*
control of the variable plus the child-env expectation
`"openrouter/ovr/model"` → `"openrouter/ovr/model:high"`; the argv
`--model openrouter/ovr/model` and manifest `.model ===
"openrouter/ovr/model"` assertions are byte-identical to base. Checked
against `extensions/seats.ts` `resolveEffectiveModel` and
`extensions/dispatch.ts:97-101`: under a pinned ambient with a `:thinking`
suffix and no param thinking, the code genuinely builds the composite —
the new expectation matches the implementation, it was not rewritten to
pass.
3. **`test/job-retry.test.ts` extension is in scope and required.** At the
base `93d7a34` under an exported ambient `openrouter/ambient/model:high`,
**3 tests fail** — the eval-runner dispatch-primitive plus both job-retry
wiring calls (an exported ambient legitimately resolved as the effective
model and hit the loud-refusal path). Fixing only `test/eval-runner.test.ts`
would leave the `bun test` gate environment-dependent, which is exactly
criterion 1 / the card's Intent. Head targeted rerun with ambient: 46 pass /
0 fail.
4. **Gate integrity — all three gates watched fail then restored.**
`bun test` (injected `WRONG/model:high` → 1 fail naming the test);
`bunx tsc --noEmit` (injected TS2322 → named error); `validate.py`
(bogus card → `FAIL:` lines). Each restored; `git diff --stat` empty after.
5. **Restoration on the throw path.** Verbatim `finally` patterns with an
injected throw, ambient defined and unset — all four combos restore the
shell ambient.

Skeptic ran its base-worktree probe under `/tmp/fllwup40-base`, removed it
afterward, and never touched the main checkout. Verify cycles used: 1 of ≤3;
no fix cycle needed.

Skeptic usage (verbatim, job-2.2):

```
job-2.2  turns=13 tokens=in 115120/out 7380/cR 177725/cW 0/reason 2853/total 300225 cost≈$0.2019
```

### Step 10 — judge PASS (job-2.3)

Judge dispatched with exactly the card's `goal` (verbatim) + the step-9
Skeptic evidence, subject pinned (head `470bc96…`, head worktree
`.worktrees/fllwup-40`), loop frame stated (step 10 precedes step 11's
mechanical merge, facilitator-executed). Verdict **PASS**, on its own
re-runs at the head: `test/eval-runner.test.ts` 35 pass / 0 fail with
`COUNCIL_EVAL_MODEL` set and 35 pass / 0 fail without it (the `finally`
restores `undefined`; same code path, no ambient interference); full suite
847/2/0/5481 identical with `env -u COUNCIL_EVAL_MODEL` and with
`COUNCIL_EVAL_MODEL="openrouter/ambient/model"`. No REJECT basis; no
goal-text defect.

Judge usage (verbatim, job-2.3):

```
job-2.3  turns=6 tokens=in 83321/out 2251/cR 68608/cW 0/reason 1262/total 154180 cost≈$0.0138
```
