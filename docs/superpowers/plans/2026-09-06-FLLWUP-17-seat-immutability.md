# FLLWUP-17: Main-Repo Immutability Constraint in the Working Seats' Own Guidance — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The owner, skeptic, and judge seat bodies each carry the main-repo immutability constraint — `git checkout`, `git switch`, and `git reset` forbidden against the main repository path, with any branch state change happening in a dedicated worktree — as body text on the packaged seats, pinned per seat by a driven payload test asserting the constraint phrases (the same pattern as FLLWUP-16's runner-body test).

**Architecture:** FLLWUP-16 (68e728d) put the `<main_repo_immutability>` block on the packaged `council-runner` seat, which must forward it in dispatch inputs — but a constraint that lives only in the runner's forward is lost the moment a forward is omitted (the FLLWUP-13 step 9 incident was a working seat mutating the main repo directly). This card adds the same block to the three working seats that actually run git — owner, skeptic, judge — as payload on `council/agents/{owner,skeptic,judge}.md`, adapted to each seat's voice (none of them dispatches seats). One driven test per seat in `test/seats.test.ts` asserts the five phrases on `loadSeat(tmpRepo(), "<seat>").body`. No engine code changes; the model-picker surface is untouched.

**Tech Stack:** TypeScript (`bun:test`), Markdown seat payload. No new dependencies.

**Spec:** Orchestrator handoff FLLWUP-17 (card face not yet on disk — mechanical path). The enforceable artifact is the packaged working-seat bodies; the reference substance is FLLWUP-16's `<main_repo_immutability>` block on `council/agents/council-runner.md`, verbatim. Binding scope: do **not** touch seat frontmatter, do **not** touch `extensions/`, keep the FLLWUP-16 runner-body test green, and match the incident class (a seat violating main-repo branch state) rather than vague caution.

## Global Constraints

- **Gates** (from `.github/workflows/gates.yml`, run in this order from the worktree root; each must pass before the next):
  1. `bun install --frozen-lockfile`
  2. `bunx tsc --noEmit`
  3. `bun test`
  4. `python3 council/validate.py`
- **Worktree-only discipline (this card's own subject, applies to the implementer too):** never run `git checkout`/`git switch`/`git reset` against the main repository path at `/home/tista/codes/pi-council`; all branch state changes happen in the dedicated worktree at `/home/tista/codes/.worktrees/fllwup-17-seat-immutability`, branched from `origin/main` (`39ef42f` — the local `main` carries unpushed council record commits at `6c98d76` that must not appear in the PR diff).
- **PR diff scope is exactly five files:** `docs/superpowers/plans/2026-09-06-FLLWUP-17-seat-immutability.md`, `council/agents/owner.md`, `council/agents/skeptic.md`, `council/agents/judge.md`, `test/seats.test.ts`. Nothing from `council/cards/`, `council/board`, `vault/`, or `extensions/`.
- **Repo conventions:** Conventional Commits; seat frontmatter schema untouched; the test suite stays green per commit.
- **TDD:** no payload edit before a failing test; the driven per-seat payload tests are the heart of the change.

---

### Task 1: Three driven payload tests (RED)

**Files:**
- Modify: `test/seats.test.ts` — append three tests immediately after the existing `"council-runner dispatch guidance forbids main-repo branch-state mutation (FLLWUP-16)"` test (keeps the main-repo-immutability payload assertions together).

**Interfaces:**
- Consumes: `loadSeat(root, name)` and `tmpRepo()` from the existing test module (already imported in `test/seats.test.ts` — no new imports).
- Produces: three tests named `"<seat> seat guidance forbids main-repo branch-state mutation (FLLWUP-17)"` for `owner`, `skeptic`, `judge`.

- [ ] **Step 1: Append the three failing tests**

Add after the FLLWUP-16 runner-body test block:

```ts
test("owner seat guidance forbids main-repo branch-state mutation (FLLWUP-17)", () => {
	const owner = loadSeat(tmpRepo(), "owner");
	expect(owner.body).toContain("main repository path");
	expect(owner.body).toContain("git checkout");
	expect(owner.body).toContain("git switch");
	expect(owner.body).toContain("git reset");
	expect(owner.body).toContain("dedicated worktree");
});

test("skeptic seat guidance forbids main-repo branch-state mutation (FLLWUP-17)", () => {
	const skeptic = loadSeat(tmpRepo(), "skeptic");
	expect(skeptic.body).toContain("main repository path");
	expect(skeptic.body).toContain("git checkout");
	expect(skeptic.body).toContain("git switch");
	expect(skeptic.body).toContain("git reset");
	expect(skeptic.body).toContain("dedicated worktree");
});

test("judge seat guidance forbids main-repo branch-state mutation (FLLWUP-17)", () => {
	const judge = loadSeat(tmpRepo(), "judge");
	expect(judge.body).toContain("main repository path");
	expect(judge.body).toContain("git checkout");
	expect(judge.body).toContain("git switch");
	expect(judge.body).toContain("git reset");
	expect(judge.body).toContain("dedicated worktree");
});
```

- [ ] **Step 2: Run each test and verify it fails RED, per seat**

Run, per seat (substring-matched by the `-t` filter):
```bash
bun test test/seats.test.ts -t "owner seat guidance forbids"
bun test test/seats.test.ts -t "skeptic seat guidance forbids"
bun test test/seats.test.ts -t "judge seat guidance forbids"
```
Expected: each FAILS — the unmodified seat body contains none of the five phrases; the assertion errors on `toContain("main repository path")` first. Capture the exact failing assertion output per seat (the RED proof). The FLLWUP-16 runner-body test must stay green in the same run.

---

### Task 2: Constraint blocks in the three working-seat bodies (GREEN)

**Files:**
- Modify: `council/agents/owner.md` — insert a `<main_repo_immutability>` block between `</owner_mode>` and `<bash_discipline>` (the owner's implementing-owner discipline block already names the isolated worktree; the block hardens it into the immutability constraint).
- Modify: `council/agents/skeptic.md` — insert the block between `</verification_mode>` and `<bash_discipline>` (the verification discipline's neighbor; the skeptic runs gates on branches and must hold the constraint while doing so).
- Modify: `council/agents/judge.md` — insert the block between `</when_invoked>` and `<bash_discipline>`.

**Interfaces:**
- Consumes: the five phrases asserted by Task 1's tests: `main repository path`, `git checkout`, `git switch`, `git reset`, `dedicated worktree` — the prose must contain them verbatim.
- Produces: each working seat's own standing guidance — the layer that survives every composition path, even a runner forward that is omitted.

- [ ] **Step 3: Add the block to each of the three seats**

The same adapted prose in all three (none of owner/skeptic/judge dispatches seats, so the runner's "to every seat you dispatch" clause drops; the incident-class closing sentence stays — the board/card revert risk is why the constraint exists):

```markdown
<main_repo_immutability>
The main repository path's branch state is immutable to you. `git checkout`,
`git switch`, and `git reset` against the main repository path are forbidden
— inside your own turn — and a violation is a `HALT` condition on the card.
Any branch state change (moving a branch pointer, checking out a commit,
switching branches, rewinding history) happens in a dedicated worktree
created with `git worktree add`, never against the main checkout. A seat
that mutates the main repo's branch state can revert the board and card
records that the runner is the single writer of, and recovery from that
failure class is a reflog drill, not a normal step.
</main_repo_immutability>
```

Frontmatter of all three seats is untouched.

- [ ] **Step 4: Run the three tests and verify they pass GREEN**

Run: `bun test test/seats.test.ts -t "FLLWUP-17"`
Expected: PASS (3 tests). Then run the full file: `bun test test/seats.test.ts` — expected: all seat tests pass, including the FLLWUP-16 runner-body test.

- [ ] **Step 5: Commit the implementation**

```bash
git add test/seats.test.ts council/agents/owner.md council/agents/skeptic.md council/agents/judge.md
git commit -m "feat(council): carry main-repo immutability constraint in owner/skeptic/judge seat guidance (FLLWUP-17)"
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
git push -u origin fllwup-17-seat-immutability
gh pr create --base main --title "feat(council): carry main-repo immutability constraint in working-seat guidance (FLLWUP-17)" --body "…"
```

- [ ] **Step 8: Verify PR diff scope**

Run: `gh pr diff <PR> --name-only`
Expected: exactly the five files from Global Constraints. Report the PR number, branch head SHA (`git rev-parse HEAD`), plan path, per-seat RED→GREEN proof, and the four gate results with real output.

---

## Self-Review

- **Spec coverage:** Acceptance 1 (one driven payload test per seat — owner, skeptic, judge — asserting the five phrases incl. all three commands and the dedicated worktree) → Tasks 1 + 2. Acceptance 2 (FLLWUP-16 runner-body test stays green; no `extensions/` change; picker surface untouched) → Task 1 Step 2 verifies it stays green in the same run; Task 2 touches only seat bodies + tests; frontmatter untouched. Acceptance 3 (gate set green) → Task 3. Binding constraints (body text only, adjacent to existing discipline blocks, same voice, incident-class-specific prose) → Task 2 placement and prose; the five required phrases appear verbatim.
- **Placeholder scan:** all steps carry exact file paths, literal code/prose, and expected outputs.
- **Type consistency:** the tests consume only existing exports (`loadSeat`, `tmpRepo`); the five `toContain` phrases match the block prose verbatim.