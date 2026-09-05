# FLLWUP-18: Judge Dispatch Inputs Pin the Verification Subject and Loop Frame — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The packaged `council-runner` seat's judge-dispatch guidance requires every judge dispatch input the runner composes to name the exact verification subject — the PR head SHA and the head worktree path — and the loop frame — step 10 judging precedes step 11's mechanical merge, which the facilitator executes and no seat performs — pinned by a driven payload test on the packaged seat body.

**Architecture:** The guidance lives in the packaged `council-runner` seat body (`council/agents/council-runner.md`) as a new `<judge_dispatch_subject>` block adjacent to the existing `<dispatch_discipline>` / `<main_repo_immutability>` blocks (the FLLWUP-16 ship), so the runner holds it as standing guidance while composing every judge dispatch input. A driven payload test in `test/seats.test.ts` asserts six phrases are present in the packaged seat's body, following the repo's existing `loadSeat(tmpRepo(), "council-runner")` + `body` assertion pattern (the FLLWUP-16 test). No engine code changes.

**Tech Stack:** TypeScript (`bun:test`), Markdown seat payload. No new dependencies.

**Spec:** `council/cards/FLLWUP-18.md` (card face + orchestrator binding constraints). The enforceable, testable artifact is the packaged `council-runner` seat at `council/agents/council-runner.md`; the guidance belongs in a new block adjacent to `<dispatch_discipline>` / `<main_repo_immutability>`, in the same imperative voice. Binding scope: do **not** change seat frontmatter in any file, do **not** touch the existing FLLWUP-16/FLLWUP-17 payload tests or the `<dispatch_discipline>` / `<main_repo_immutability>` blocks (byte-intact), do **not** touch `extensions/`, do **not** disturb the model-picker surface.

## Global Constraints

- **Gates** (from `.github/workflows/gates.yml`, run in this order from the worktree root; each must pass before the next):
  1. `bun install --frozen-lockfile`
  2. `bunx tsc --noEmit`
  3. `bun test`
  4. `python3 council/validate.py`
- **Worktree-only discipline (applies to the implementer too):** never run `git checkout`/`git switch`/`git reset` against the main repository path at `/home/tista/codes/pi-council`; all branch state changes happen in the dedicated worktree `.worktrees/fllwup-18-judge-dispatch-inputs`, branched from `origin/main` (the local `main` carries unpushed council record commits — `1cd5fcd` — that must not appear in the PR diff).
- **PR diff scope is exactly three files:** `docs/superpowers/plans/2026-09-06-FLLWUP-18-judge-dispatch-inputs.md`, `council/agents/council-runner.md`, `test/seats.test.ts`. Nothing from `council/cards/`, `council/board.md`, `vault/`, or `extensions/`.
- **Byte-intact surfaces:** the FLLWUP-16 payload test and the three FLLWUP-17 tests in `test/seats.test.ts`, and the `<dispatch_discipline>` and `<main_repo_immutability>` blocks in `council/agents/council-runner.md`. The new test and new block are purely additive.
- **Repo conventions:** Conventional Commits; seat frontmatter schema untouched; the test suite must stay green per commit.
- **TDD:** no production/payload edit before a failing test; the driven payload test is the heart of the change.

---

### Task 1: Driven payload test (RED)

**Files:**
- Modify: `test/seats.test.ts` — insert one test directly after the existing `"council-runner dispatch guidance forbids main-repo branch-state mutation (FLLWUP-16)"` test (keeps council-runner payload assertions together).

**Interfaces:**
- Consumes: `loadSeat(root, name)` and `tmpRepo()` from the existing test module (already imported in `test/seats.test.ts` — no new imports).
- Produces: a test named `"council-runner judge-dispatch guidance pins the verification subject and loop frame (FLLWUP-18)"`.

- [ ] **Step 1: Insert the failing test**

Insert directly after the FLLWUP-16 test block:

```ts
test("council-runner judge-dispatch guidance pins the verification subject and loop frame (FLLWUP-18)", () => {
	const runner = loadSeat(tmpRepo(), "council-runner");
	expect(runner.body).toContain("PR head SHA");
	expect(runner.body).toContain("head worktree path");
	expect(runner.body).toContain("step 10 judging precedes step 11");
	expect(runner.body).toContain("mechanical merge");
	expect(runner.body).toContain("facilitator executes");
	expect(runner.body).toContain("no seat performs");
});
```

(Verified: all six asserted substrings are ABSENT from the current packaged seat body, so the test fails on the first assertion.)

- [ ] **Step 2: Run the test and verify it fails RED**

Run: `bun test test/seats.test.ts -t "FLLWUP-18"` — also run with the FLLWUP-16 test to confirm the byte-intact test still runs: `bun test test/seats.test.ts -t "FLLWUP"`
Expected: FLLWUP-18 FAIL — the unmodified seat body contains none of the six phrases; the assertion errors on `toContain("PR head SHA")` first; the FLLWUP-16/17 tests PASS. Captures: the exact failing assertion output (the RED proof).

---

### Task 2: Judge-dispatch guidance block in the council-runner seat (GREEN)

**Files:**
- Modify: `council/agents/council-runner.md` — insert a `<judge_dispatch_subject>` block between the closing `</main_repo_immutability>` and the opening `<return_contract>`.

**Interfaces:**
- Consumes: the six phrases asserted by Task 1's test — `PR head SHA`, `head worktree path`, `step 10 judging precedes step 11`, `mechanical merge`, `facilitator executes`, `no seat performs` — the prose must contain them verbatim and contiguous (no line break inside an asserted phrase).
- Produces: the standing judge-dispatch guidance the runner holds while composing every judge dispatch input.

- [ ] **Step 3: Add the block**

Insert between `</main_repo_immutability>` and `<return_contract>`:

```markdown
<judge_dispatch_subject>
Every judge dispatch input you compose names the exact verification
subject and the loop frame. The subject is the PR head SHA and the head
worktree path: the judge evaluates the deliverables at the branch head,
never the local `main` checkout, where pre-merge deliverables are absent
by construction. The frame is step 10 judging precedes step 11's
mechanical merge, which the facilitator executes and no seat performs —
a judge input must never imply the merge has happened, and never imply
that requiring it is the judge's job. Repeat this constraint in every
judge dispatch input you compose: a judge that verifies the wrong subject
or the wrong frame rejects on a premise error, not on the deliverable.
</judge_dispatch_subject>
```

- [ ] **Step 4: Run the test and verify it passes GREEN**

Run: `bun test test/seats.test.ts -t "FLLWUP-18"`
Expected: PASS. Then run the full file: `bun test test/seats.test.ts` — expected: all seat tests pass, no regressions, FLLWUP-16/17 tests byte-intact and green.

- [ ] **Step 5: Commit the implementation**

```bash
git add test/seats.test.ts council/agents/council-runner.md
git commit -m "feat(council): judge dispatch inputs pin the verification subject and loop frame (FLLWUP-18)"
```

---

### Task 3: Full gate set + push + PR

**Files:** none (verification only).

- [ ] **Step 6: Run the gate set in order from the worktree root**

```bash
bun install --frozen-lockfile
bunx tsc --noEmit
bun test
python3 council/validate.py
```

Each gate must exit 0 with no findings; record real output (bun test counts: pass/skip/fail) for the report.

- [ ] **Step 7: Verify diff scope, push, and open the PR**

```bash
git diff origin/main --name-only
git push -u origin fllwup-18-judge-dispatch-inputs
gh pr create --base main --title "feat(council): judge dispatch inputs pin the verification subject and loop frame (FLLWUP-18)" --body "…"
```

- [ ] **Step 8: Verify PR diff scope**

Run: `gh pr diff <PR> --name-only`
Expected: exactly the three files from Global Constraints, and none from `council/cards/`, `council/board.md`, or `extensions/`. Report the PR number, branch head SHA (`git rev-parse HEAD`), plan path, gate summaries, the exact asserted phrases, and the RED→GREEN proof.

---

## Self-Review

- **Spec coverage:** Acceptance 1 (driven test pinning verification subject + loop frame) → Task 1 + Task 2. Acceptance 2 (FLLWUP-16 blocks byte-intact; no `extensions/` change; picker untouched) → Global Constraints + Task 2 inserts a new block without touching `<dispatch_discipline>`/`<main_repo_immutability>`, and Task 1 is purely additive. Acceptance 3 (gate set green) → Task 3. Binding constraints 1 (no frontmatter change) and 4 (adjacent, same voice) → Task 2 places `<judge_dispatch_subject>` adjacent to the FLLWUP-16 blocks in imperative prose.
- **Placeholder scan:** all steps carry exact file paths, literal code/prose, and expected outputs.
- **Type consistency:** the test consumes only existing exports (`loadSeat`, `tmpRepo`); the six `toContain` phrases match the block prose verbatim and contiguously (verified above).