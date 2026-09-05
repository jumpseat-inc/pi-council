# FLLWUP-20: Judge Seat When-Invoked Guidance Names the Runner-Pinned Verification Subject — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The packaged judge seat body (`council/agents/judge.md`) — its `<when_invoked>` block — names the verification subject (PR head SHA and head worktree path) and the loop frame (step 10 judging precedes step 11's mechanical merge, facilitator-executed, no seat performs) as received-input elements the judge verifies against, pinned by a driven payload test on the packaged judge seat body.

**Architecture:** Wording-only update to the `<when_invoked>` block of the packaged judge seat. FLLWUP-18 already made the runner pin the verification subject and loop frame into every judge dispatch input; the judge body's guidance today under-describes the input contract ("You are given the card's `goal` and the Skeptic's evidence."), which is exactly the gap where the FLLWUP-16 premise error happened. The change adds additive prose after the opening sentence that names both pinned elements as part of the input contract, in the same imperative voice as the shipped runner-side blocks (`<judge_dispatch_subject>` in `council/agents/council-runner.md`). A driven payload test in `test/seats.test.ts` asserts the nine discriminator phrases against the packaged seat body via the existing `loadSeat(tmpRepo(), "judge")` + `body` toContain pattern (the FLLWUP-16/17/18/19 tests). No frontmatter change, no `extensions/` change, no picker surface change, no enforcement machinery in the judge body — the constraint lives in the runner (FLLWUP-18) and the immutability block (FLLWUP-17); this card is purely descriptive.

**Tech Stack:** TypeScript (`bun:test`), Markdown seat payload. No new dependencies.

**Spec:** `council/cards/FLLWUP-20.md` (card face + orchestrator binding constraints — the card itself is the spec; mechanical path, no spec file). The enforceable, testable artifact is the packaged judge seat at `council/agents/judge.md`; the wording change belongs in the `<when_invoked>` block only. The pattern mirror is `docs/superpowers/plans/2026-09-05-FLLWUP-19-skeptic-dispatch-inputs.md` and `docs/superpowers/plans/2026-09-06-FLLWUP-18-judge-dispatch-inputs.md` — same voice: "The subject is the PR head SHA and the head worktree path… The frame is step 10 judging precedes step 11's mechanical merge, which the facilitator executes and no seat performs… a judge input must never imply the merge has happened, and never imply that requiring it is the judge's job." Binding scope: do **not** change seat frontmatter in any file, do **not** touch the existing FLLWUP-16/17/18/19 payload tests or the FLLWUP-16/17/18/19 blocks (byte-intact), do **not** touch `extensions/`, do **not** disturb the model-picker surface.

## Global Constraints

- **Gates** (from `.github/workflows/gates.yml`, run in this order from the worktree root; each must pass before the next; this repo has no dataset-import or server-boot gate):
  1. `bun install --frozen-lockfile`
  2. `bunx tsc --noEmit`
  3. `bun test`
  4. `python3 council/validate.py`
- **Worktree-only discipline:** never run `git checkout`/`git switch`/`git reset` against the main repository path at `/home/tista/codes/pi-council`; all branch state changes happen in the dedicated worktree `.worktrees/fllwup-20-judge-when-invoked`, branched from `origin/main` at exactly `7d79aae17187e2a18db579e46ccbc8c5aea140ee` (the local `main` carries unpushed council record commits that must not ride this PR; the base is `origin/main`).
- **PR diff scope is exactly three files:** `docs/superpowers/plans/2026-09-05-FLLWUP-20-judge-when-invoked.md`, `council/agents/judge.md`, `test/seats.test.ts`. Nothing from `council/cards/`, `council/board.md`, `vault/`, or `extensions/`.
- **Byte-intact surfaces:** the FLLWUP-16/18/19 tests and the three FLLWUP-17 tests in `test/seats.test.ts`; the FLLWUP-16/17/18/19 blocks in `council/agents/council-runner.md`; the `<main_repo_immutability>` block in `council/agents/judge.md` byte-identical to `origin/main`; judge seat frontmatter untouched. The new test and new prose are purely additive — the overall diff must be insertion-only (zero deleted lines).
- **Repo conventions:** Conventional Commits; seat frontmatter schema untouched; the test suite must stay green per commit.
- **TDD:** no payload edit before a failing test; the driven payload test is the heart of the change. Phrase inventory of the current judge body (verified by grep): NONE of `verification subject`, `PR head SHA`, `head worktree path`, `loop frame`, `step 10 judging`, `step 11`, `mechanical merge`, `facilitator executes`, `no seat performs` are present in `council/agents/judge.md` today — the test must fail on those first.

---

### Task 1: Driven payload test (RED)

**Files:**
- Modify: `test/seats.test.ts` — insert one test directly after the existing `"council-runner skeptic-dispatch guidance pins the verification subject and loop frame (FLLWUP-19)"` test (keeps the FLLWUP payload suite grouped; the FLLWUP-17 judge-immutability test follows it downstream).

**Interfaces:**
- Consumes: `loadSeat(root, name)` and `tmpRepo()` from the existing test module (already imported in `test/seats.test.ts` — no new imports).
- Produces: a test named `"judge seat when-invoked guidance pins the verification subject and loop frame (FLLWUP-20)"`.

- [ ] **Step 1: Insert the failing test**

Insert directly after the FLLWUP-19 test block (its closing `});` after the `no seat performs` assertion), with the FLLWUP-16/17/18/19 test texts untouched:

```ts
test("judge seat when-invoked guidance pins the verification subject and loop frame (FLLWUP-20)", () => {
	const judge = loadSeat(tmpRepo(), "judge");
	expect(judge.body).toContain("verification subject");
	expect(judge.body).toContain("loop frame");
	expect(judge.body).toContain("PR head SHA");
	expect(judge.body).toContain("head worktree path");
	expect(judge.body).toContain("step 10 judging");
	expect(judge.body).toContain("step 11");
	expect(judge.body).toContain("mechanical merge");
	expect(judge.body).toContain("facilitator executes");
	expect(judge.body).toContain("no seat performs");
});
```

(Verified by grep: all nine asserted substrings are ABSENT from the current packaged judge seat body, so the test fails on the first assertion.)

- [ ] **Step 2: Run the test and verify it fails RED**

Run: `bun test test/seats.test.ts -t "FLLWUP-20"`
Expected: FAIL — the unmodified judge seat body contains none of the nine phrases; the assertion errors on `toContain("verification subject")` first. Also run `bun test test/seats.test.ts -t "FLLWUP"` to confirm the FLLWUP-16/17/18/19 tests still PASS (red for the new test only). Capture the exact failing assertion output (the RED proof).

---

### Task 2: When-invoked guidance prose in the judge seat (GREEN)

**Files:**
- Modify: `council/agents/judge.md` — insert additive prose inside `<when_invoked>`, immediately after the existing opening lines and before the blank line that precedes the numbered steps. Insertion-only: the original lines `You are given the card's \`goal\` and the Skeptic's evidence. Work through` / `this in order:` and all numbered steps stay byte-identical.

**Interfaces:**
- Consumes: the nine phrases asserted by Task 1's test — `verification subject`, `loop frame`, `PR head SHA`, `head worktree path`, `step 10 judging`, `step 11`, `mechanical merge`, `facilitator executes`, `no seat performs` — the prose must contain them verbatim and contiguous (no line break inside an asserted phrase).
- Produces: the when-invoked guidance naming the verification subject and loop frame as received-input elements the judge verifies against.

- [ ] **Step 3: Add the prose**

Insert after the existing `this in order:` line (the lines below are added; nothing above or below is changed):

```markdown
Your input contract also names the verification subject and the loop frame —
the two elements the runner pins into every judge dispatch input. The
subject is the PR head SHA and the head worktree path: you evaluate the
deliverables at the branch head, never the local `main` checkout, where
pre-merge deliverables are absent by construction.
The frame is step 10 judging precedes step 11's mechanical merge,
which the facilitator executes and no seat performs — a judge input
must never imply the merge has happened, and never imply that
requiring it is the judge's job.
```

(Every asserted phrase is contiguous within a single line: line 1 holds `verification subject` and `loop frame`; line 3 holds `PR head SHA` and `head worktree path`; line 6 holds `step 10 judging`, `step 11`, and `mechanical merge`; line 7 holds `facilitator executes` and `no seat performs`. The `<main_repo_immutability>` block below is untouched — this is a pure insertion above it.)

- [ ] **Step 4: Run the test and verify it passes GREEN**

Run: `bun test test/seats.test.ts -t "FLLWUP-20"`
Expected: PASS. Then run the full file: `bun test test/seats.test.ts` — expected: all seat tests pass, no regressions, FLLWUP-16/17/18/19 tests byte-intact and green.

- [ ] **Step 5: Verify insertion-only diff and immutability-bloc ha byte-identity**

```bash
git diff origin/main -- council/agents/judge.md | grep -c '^-'   # 0 deleted lines
git show origin/main:council/agents/judge.md > /tmp/judge-main.md
diff <(sed -n '/<main_repo_immutability>/,/<\/main_repo_immutability>/p' /tmp/judge-main.md) \
     <(sed -n '/<main_repo_immutability>/,/<\/main_repo_immutability>/p' council/agents/judge.md)  # no output = byte-identical
```

- [ ] **Step 6: Commit the implementation**

```bash
git add test/seats.test.ts council/agents/judge.md docs/superpowers/plans/2026-09-05-FLLWUP-20-judge-when-invoked.md
git commit -m "feat(council): judge when-invoked guidance names the runner-pinned verification subject and loop frame (FLLWUP-20)"
```

---

### Task 3: Full gate set + push + PR

**Files:** none (verification only).

- [ ] **Step 7: Run the gate set in order from the worktree root**

```bash
bun install --frozen-lockfile
bunx tsc --noEmit
bun test
python3 council/validate.py
```

Each gate must exit 0 with no findings; record real output (bun test counts: pass/skip/fail) for the report.

- [ ] **Step 8: Verify diff scope, push, and open the PR**

```bash
git diff origin/main --name-only
git push -u origin fllwup-20-judge-when-invoked
gh pr create --base main --title "feat(council): judge when-invoked guidance names the runner-pinned verification subject and loop frame (FLLWUP-20)" --body "…"
```

- [ ] **Step 9: Verify PR diff scope**

Run: `gh pr diff <PR> --name-only`
Expected: exactly the three files from Global Constraints, and none from `council/cards/`, `council/board.md`, or `extensions/`. Report the PR number, branch head SHA (`git rev-parse HEAD`), plan path, `-`/`+` line counts, gate summaries, and the exact RED→GREEN proof.

---

## Self-Review

- **Spec coverage:** Acceptance 1 (driven payload test pinning verification subject + loop frame as received-input elements) → Task 1 + Task 2. Acceptance 2 (FLLWUP-17 judge immutability block byte-intact; insertion-only diff; no `extensions/` change; picker untouched) → Global Constraints + Step 5 verifies zero deleted lines and the block's byte-identity; Task 2 inserts prose above the immutability block without touching it; Task 1 is purely additive. Acceptance 3 (gate set green) → Task 3. Binding constraints 1 (no frontmatter change anywhere) → Task 2 touches only the `<when_invoked>` body. Constraint 5 (descriptive only, no duplicated enforcement machinery) → the added prose names the input elements; the judge body gains no new mechanism, and the runner-side constraint (FLLWUP-18) and immutability block (FLLWUP-17) are untouched.
- **Placeholder scan:** all steps carry exact file paths, literal test code/prose, and expected outputs.
- **Type consistency:** the test consumes only existing exports (`loadSeat`, `tmpRepo`); the nine `toContain` phrases match the added prose verbatim and contiguously (phrase inventory verified by grep before writing, and re-checked after inserting the prose).