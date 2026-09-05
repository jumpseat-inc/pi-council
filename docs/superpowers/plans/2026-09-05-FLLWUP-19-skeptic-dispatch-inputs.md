# FLLWUP-19: Skeptic Dispatch Inputs Pin the Verification Subject and Loop Frame — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The packaged `council-runner` seat's skeptic-dispatch guidance requires every step-9 skeptic dispatch input the runner composes to name the exact verification subject — the PR head SHA and the head worktree path — and the loop frame — step 9 verification precedes step 10 judging and step 11's mechanical merge, which the facilitator executes and no seat performs — pinned by a driven payload test on the packaged seat body.

**Architecture:** The guidance lives in the packaged `council-runner` seat body (`council/agents/council-runner.md`) as a new `<skeptic_dispatch_subject>` block placed immediately after the `<judge_dispatch_subject>` block (the FLLWUP-18 ship), in the same imperative voice, so the runner holds it as standing guidance while composing every step-9 skeptic dispatch input. A driven payload test in `test/seats.test.ts` asserts the subject/frame phrases against the packaged seat body, following the repo's existing `loadSeat(tmpRepo(), "council-runner")` + `body` toContain pattern (the FLLWUP-16/18 tests). No engine code changes.

**Tech Stack:** TypeScript (`bun:test`), Markdown seat payload. No new dependencies.

**Spec:** `council/cards/FLLWUP-19.md` (card face + orchestrator binding constraints — the card itself is the spec; mechanical path, no spec file). The enforceable, testable artifact is the packaged `council-runner` seat at `council/agents/council-runner.md`; the guidance belongs in a new block adjacent to `<judge_dispatch_subject>`, in the same voice. The loop frame is documented in the repo wiki (`vault/wiki/council-runner.md`, `vault/wiki/deterministic-merge-check.md`): steps 9 (skeptic verification) → 10 (judge) → 11 (mechanical merge, facilitator-executed, no seat performs). Binding scope: do **not** change seat frontmatter in any file, do **not** touch the existing FLLWUP-16/FLLWUP-17/FLLWUP-18 payload tests or the FLLWUP-16/17/18 blocks (byte-intact), do **not** touch `extensions/`, do **not** disturb the model-picker surface.

## Global Constraints

- **Gates** (from `.github/workflows/gates.yml`, run in this order from the worktree root; each must pass before the next; this repo has no dataset-import or server-boot gate):
  1. `bun install --frozen-lockfile`
  2. `bunx tsc --noEmit`
  3. `bun test`
  4. `python3 council/validate.py`
- **Worktree-only discipline:** never run `git checkout`/`git switch`/`git reset` against the main repository path at `/home/tista/codes/pi-council`; all branch state changes happen in the dedicated worktree `.worktrees/fllwup-19-skeptic-dispatch-inputs`, branched from `origin/main` at exactly `df056f9649f32fce7973143018ce309431e41706` (the local `main` carries unpushed council record commits that must not ride this PR).
- **PR diff scope is exactly three files:** `docs/superpowers/plans/2026-09-05-FLLWUP-19-skeptic-dispatch-inputs.md`, `council/agents/council-runner.md`, `test/seats.test.ts`. Nothing from `council/cards/`, `council/board.md`, `vault/`, or `extensions/`.
- **Byte-intact surfaces:** the FLLWUP-16 payload test, the FLLWUP-18 payload test, and the three FLLWUP-17 tests in `test/seats.test.ts`, plus the `<dispatch_discipline>`, `<main_repo_immutability>`, and `<judge_dispatch_subject>` blocks in `council/agents/council-runner.md`. The new test and new block are purely additive (insertion-only diff — zero deleted lines).
- **Repo conventions:** Conventional Commits; seat frontmatter schema untouched; the test suite must stay green per commit.
- **TDD:** no payload edit before a failing test; the driven payload test is the heart of the change. Phrase inventory of the current body (verified by grep): the six FLLWUP-18 phrases (`PR head SHA`, `head worktree path`, `step 10 judging precedes step 11`, `mechanical merge`, `facilitator executes`, `no seat performs`) are already present inside the `<judge_dispatch_subject>` block; `step 9`/`step-9` appear only inside the `<step_9_iteration_cap>` block name/body. The skeptic-specific discriminators `step 9 verification precedes step 10 judging` and `skeptic dispatch input` are ABSENT — the test must fail on those first.

---

### Task 1: Driven payload test (RED)

**Files:**
- Modify: `test/seats.test.ts` — insert one test directly after the existing `"council-runner judge-dispatch guidance pins the verification subject and loop frame (FLLWUP-18)"` test (keeps council-runner payload assertions together).

**Interfaces:**
- Consumes: `loadSeat(root, name)` and `tmpRepo()` from the existing test module (already imported in `test/seats.test.ts` — no new imports).
- Produces: a test named `"council-runner skeptic-dispatch guidance pins the verification subject and loop frame (FLLWUP-19)"`.

- [ ] **Step 1: Insert the failing test**

Insert directly after the FLLWUP-18 test block (its closing `});` at line 95), with the FLLWUP-16/18/17 test texts untouched:

```ts
test("council-runner skeptic-dispatch guidance pins the verification subject and loop frame (FLLWUP-19)", () => {
	const runner = loadSeat(tmpRepo(), "council-runner");
	expect(runner.body).toContain("step 9 verification precedes step 10 judging");
	expect(runner.body).toContain("skeptic dispatch input");
	expect(runner.body).toContain("PR head SHA");
	expect(runner.body).toContain("head worktree path");
	expect(runner.body).toContain("step 10 judging");
	expect(runner.body).toContain("step 11");
	expect(runner.body).toContain("mechanical merge");
	expect(runner.body).toContain("facilitator executes");
	expect(runner.body).toContain("no seat performs");
});
```

(Verified by grep: `step 9 verification precedes step 10 judging` → 0 hits and `skeptic dispatch input` → 0 hits in the current packaged seat body, so the test fails on the first assertion; the remaining phrases exist today only via the `<judge_dispatch_subject>` block and must also appear in the skeptic block's prose.)

- [ ] **Step 2: Run the test and verify it fails RED**

Run: `bun test test/seats.test.ts -t "FLLWUP-19"`
Expected: FAIL — the unmodified seat body contains none of the two discriminator phrases; assertion errors on `toContain("step 9 verification precedes step 10 judging")` first. Also run `bun test test/seats.test.ts -t "FLLWUP"` to confirm the FLLWUP-16/17/18 tests still PASS (red for the new test only). Capture the exact failing assertion output (the RED proof).

---

### Task 2: Skeptic-dispatch guidance block in the council-runner seat (GREEN)

**Files:**
- Modify: `council/agents/council-runner.md` — insert a `<skeptic_dispatch_subject>` block between the closing `</judge_dispatch_subject>` and the opening `<return_contract>`.

**Interfaces:**
- Consumes: the nine phrases asserted by Task 1's test — `step 9 verification precedes step 10 judging`, `skeptic dispatch input`, `PR head SHA`, `head worktree path`, `step 10 judging`, `step 11`, `mechanical merge`, `facilitator executes`, `no seat performs` — the prose must contain them verbatim and contiguous (no line break inside an asserted phrase).
- Produces: the standing skeptic-dispatch guidance the runner holds while composing every step-9 skeptic dispatch input.

- [ ] **Step 3: Add the block**

Insert between `</judge_dispatch_subject>` and `<return_contract>`:

```markdown
<skeptic_dispatch_subject>
Every step 9 skeptic dispatch input you compose names the exact
verification subject and the loop frame. The subject is the PR head SHA and the head worktree path:
the skeptic verifies the deliverables at the branch head, never the local
`main` checkout, where pre-merge deliverables are absent by construction.
The frame is step 9 verification precedes step 10 judging and step 11's
mechanical merge, which the facilitator executes and no seat performs —
a skeptic input must never imply the merge has happened, and never imply
that performing it is the skeptic's job. Repeat this constraint in every
step 9 skeptic dispatch input you compose: a skeptic that verifies the
wrong subject or the wrong frame rejects on a premise error, not on the
deliverable.
</skeptic_dispatch_subject>
```

(Place the opening line ` <skeptic_dispatch_subject>` on its own line; keep every asserted phrase within a single line so the `toContain` substrings remain contiguous.)

- [ ] **Step 4: Run the test and verify it passes GREEN**

Run: `bun test test/seats.test.ts -t "FLLWUP-19"`
Expected: PASS. Then run the full file: `bun test test/seats.test.ts` — expected: all seat tests pass, no regressions, FLLWUP-16/17/18 tests byte-intact and green.

- [ ] **Step 5: Commit the implementation**

```bash
git add test/seats.test.ts council/agents/council-runner.md docs/superpowers/plans/2026-09-05-FLLWUP-19-skeptic-dispatch-inputs.md
git commit -m "feat(council): skeptic dispatch inputs pin the verification subject and loop frame (FLLWUP-19)"
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
git push -u origin fllwup-19-skeptic-dispatch-inputs
gh pr create --base main --title "feat(council): skeptic dispatch inputs pin the verification subject and loop frame (FLLWUP-19)" --body "…"
```

- [ ] **Step 8: Verify PR diff scope**

Run: `gh pr diff <PR> --name-only`
Expected: exactly the three files from Global Constraints, and none from `council/cards/`, `council/board.md`, or `extensions/`. Report the PR number, branch head SHA (`git rev-parse HEAD`), plan path, gate summaries, and the RED→GREEN proof.

---

## Self-Review

- **Spec coverage:** Acceptance 1 (driven test pinning verification subject + loop frame in step-9 skeptic inputs) → Task 1 + Task 2. Acceptance 2 (FLLWUP-16/17/18 blocks + tests byte-intact; no `extensions/` change; picker untouched) → Global Constraints; Task 2 inserts a new block without touching `<dispatch_discipline>`/`<main_repo_immutability>`/`<judge_dispatch_subject>`, and Task 1 is purely additive. Acceptance 3 (gate set green) → Task 3. Binding constraints 1 (no frontmatter change) and 4 (adjacent, same voice) → Task 2 places `<skeptic_dispatch_subject>` immediately after `<judge_dispatch_subject>` in the same imperative prose; the card's wording "verification precedes step 10 judging and step 11's mechanical merge, facilitator-executed, no seat performs" maps to the asserted `step 9 verification precedes step 10 judging` + `step 11`'s `mechanical merge` + `facilitator executes` + `no seat performs`.
- **Placeholder scan:** all steps carry exact file paths, literal code/prose, and expected outputs.
- **Type consistency:** the test consumes only existing exports (`loadSeat`, `tmpRepo`); the nine `toContain` phrases match the block prose verbatim and contiguously (phrase inventory verified by grep before writing, and re-checked after inserting the block).