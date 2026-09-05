# FLLWUP-16: Seat Dispatch Inputs Forbid Main-Repo Branch-State Mutation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every working seat dispatched by `council-runner` is told, in its dispatch guidance, that the main repository path's branch state is immutable to it — `git checkout`, `git switch`, and `git reset` against the main repo are forbidden, and any branch state change happens in a dedicated worktree — pinned by a driven payload test asserting the constraint is present in the packaged `council-runner` seat.

**Architecture:** The constraint lives in the packaged `council-runner` seat body (`council/agents/council-runner.md`) as a block adjacent to `<dispatch_discipline>`, so the runner holds it as standing guidance while composing every dispatch input for its working seats. A payload test in `test/seats.test.ts` asserts the constraint phrases are present in the packaged seat's body, following the repo's existing `loadSeat(tmpRepo(), "council-runner")` + `body` assertion pattern. No engine code changes.

**Tech Stack:** TypeScript (`bun:test`), Markdown seat payload. No new dependencies.

**Spec:** `council/cards/FLLWUP-16.md` (card face + orchestrator scope note). The enforceable, testable artifact is the packaged `council-runner` seat at `council/agents/council-runner.md`; the constraint belongs in the runner's `<dispatch_discipline>` block or an adjacent block. Binding scope: do **not** touch `extensions/` (especially `hub.ts`), do not disturb the model-picker surface, do not fabricate a reflog simulation (the recovery drill is documented by the runner on the card record, not by this change).

## Global Constraints

- **Gates** (from `.github/workflows/gates.yml`, run in this order from the worktree root; each must pass before the next):
  1. `bun install --frozen-lockfile`
  2. `bunx tsc --noEmit`
  3. `bun test`
  4. `python3 council/validate.py`
- **Worktree-only discipline (this card's own subject, applies to the implementer too):** never run `git checkout`/`git switch`/`git reset` against the main repository path at `/home/tista/codes/pi-council`; all branch state changes happen in a dedicated worktree under `.worktrees/`, branched from `origin/main` (the local `main` carries unpushed council record commits that must not appear in the PR diff).
- **PR diff scope is exactly three files:** `docs/superpowers/plans/2026-09-06-FLLWUP-16-main-repo-immutability.md`, `council/agents/council-runner.md`, `test/seats.test.ts`. Nothing from `council/cards/`, `council/board`, `vault/`, or `extensions/`.
- **Repo conventions:** Conventional Commits; seat frontmatter schema untouched; the test suite must stay green per commit.
- **TDD:** no production/payload edit before a failing test; the driven payload test is the heart of the change.

---

### Task 1: Driven payload test (RED)

**Files:**
- Modify: `test/seats.test.ts` — append one test directly after the existing `"parses council-runner spawns list"` test (keeps council-runner payload assertions together).

**Interfaces:**
- Consumes: `loadSeat(root, name)` and `tmpRepo()` from the existing test module (already imported in `test/seats.test.ts` — no new imports).
- Produces: a test named `"council-runner dispatch guidance forbids main-repo branch-state mutation (FLLWUP-16)"`.

- [ ] **Step 1: Append the failing test**

Add after the `"parses council-runner spawns list"` test block:

```ts
test("council-runner dispatch guidance forbids main-repo branch-state mutation (FLLWUP-16)", () => {
	const runner = loadSeat(tmpRepo(), "council-runner");
	expect(runner.body).toContain("main repository path");
	expect(runner.body).toContain("git checkout");
	expect(runner.body).toContain("git switch");
	expect(runner.body).toContain("git reset");
	expect(runner.body).toContain("dedicated worktree");
});
```

- [ ] **Step 2: Run the test and verify it fails RED**

Run: `bun test test/seats.test.ts -t "FLLWUP-16"`
Expected: FAIL — the unmodified seat body contains none of the five phrases; the assertion errors on `toContain("main repository path")` first. Captures: the exact failing assertion output (the RED proof).

---

### Task 2: Constraint block in the council-runner seat (GREEN)

**Files:**
- Modify: `council/agents/council-runner.md` — insert a `<main_repo_immutability>` block between the closing `</dispatch_discipline>` and the opening `<return_contract>`.

**Interfaces:**
- Consumes: the five phrases asserted by Task 1's test: `main repository path`, `git checkout`, `git switch`, `git reset`, `dedicated worktree` — the prose must contain them verbatim.
- Produces: the standing dispatch guidance the runner holds while composing every dispatch input.

- [ ] **Step 3: Add the block**

Insert between `</dispatch_discipline>` and `<return_contract>`:

```markdown
<main_repo_immutability>
The main repository path's branch state is immutable to you and to every
seat you dispatch. `git checkout`, `git switch`, and `git reset` against
the main repository path are forbidden — inside your own turn and inside
every seat run you dispatch — and a violation is a `HALT` condition on the
card. Any branch state change (moving a branch pointer, checking out a
commit, switching branches, rewinding history) happens in a dedicated
worktree created with `git worktree add`, never against the main checkout.
Repeat this constraint in every dispatch input you compose for a working
seat: a seat that mutates the main repo's branch state can revert the board
and card records that the runner is the single writer of, and recovery from
that failure class is a reflog drill, not a normal step.
</main_repo_immutability>
```

- [ ] **Step 4: Run the test and verify it passes GREEN**

Run: `bun test test/seats.test.ts -t "FLLWUP-16"`
Expected: PASS. Then run the full file: `bun test test/seats.test.ts` — expected: all seat tests pass, no regressions.

- [ ] **Step 5: Commit the implementation**

```bash
git add test/seats.test.ts council/agents/council-runner.md
git commit -m "feat(council): forbid main-repo branch-state mutation in runner dispatch guidance (FLLWUP-16)"
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

- [ ] **Step 7: Push and open the PR**

```bash
git push -u origin fllwup-16-main-repo-immutability
gh pr create --base main --title "feat(council): forbid main-repo branch-state mutation in seat dispatch inputs (FLLWUP-16)" --body "…"
```

- [ ] **Step 8: Verify PR diff scope**

Run: `gh pr diff <PR> --name-only`
Expected: exactly the three files from Global Constraints. Report the PR number, branch head SHA (`git rev-parse HEAD`), plan path, gate summaries, and the RED→GREEN proof.

---

## Self-Review

- **Spec coverage:** Acceptance 1 (driven test naming the three commands + dedicated worktree mechanism) → Task 1 + Task 2. Acceptance 2 (reflog drill) → documented by the runner on the card record during the run; explicitly out of scope for this change (card binding). Acceptance 3 (gate set green) → Task 3. Scope note (constraint in `<dispatch_discipline>` or adjacent block; no `extensions/`) → Task 2 places it adjacent; no engine touch.
- **Placeholder scan:** all steps carry exact file paths, literal code/prose, and expected outputs.
- **Type consistency:** the test consumes only existing exports (`loadSeat`, `tmpRepo`); the five `toContain` phrases match the block prose verbatim.