# FLLWUP-42 — Name the run-scoped `--admin` bypass as the sanctioned merge step

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `council/procedures/features-deliver.md`'s deterministic
merge check name the human-granted `--admin` bypass explicitly as the
sanctioned merge step under a `main` ruleset that requires an approving
review, and state that the authorization is run-scoped and never extended
to a later run — satisfying binding Phase-1 ruling R2 and the card's goal
via its second disjunct.

**Architecture:** One seam, procedure prose only. The five criteria, the
criterion-2 `gh pr checks <PR> --json name,state,workflow` read (keyed on
`workflow`, `gates` `SUCCESS`), and the `--match-head-commit <X>` SHA
pinning discipline stand exactly as written. Only the stale trailing
paragraph ("merge-time behaviour ... may not be configured in this repo")
is replaced by the sanctioned-bypass copy. A literal-substring test in
`test/prose.test.ts` pins the new copy, written red-first.

**Tech Stack:** bun (test runner), TypeScript (strict), Markdown prose.

**Spec:** `council/cards/FLLWUP-42.md` (goal + Intent + binding R2), plus
`vault/wiki/deterministic-merge-check.md` (the check being amended) and
`AGENTS.md` conventions #1 (domain-neutral prose) and the prose gate in
`test/prose.test.ts`.

## Global Constraints

- Main-repo immutability: all work in worktree
  `.worktrees/fllwup-42`, branch `feat/fllwup-42-admin-merge-procedure`,
  based on `4ae414f` (= `origin/main`). No checkout/switch/reset against
  the main repo path.
- No fixture/digest impact: no `council/fixtures/*/seed/` tree carries a
  copy of `council/procedures/features-deliver.md` (verified), so no
  `seed.treeDigest` re-pin is owed.
- Prose gate (`test/prose.test.ts`): the new copy must not contain `bun`,
  `bunx`, `tsc`, `typescript`, `registry`, `named agent`, a bare
  `deliver.md`, `GATE-EVIDENCE.md`, or any hardcoded product-domain token.
  No `bun test` command strings in the prose — the tokens are forbidden by
  the stack-pinning guard.
- Do not change: the five criteria, the criterion-2 read paragraph, the
  `--match-head-commit <X>` pinning paragraph. Do not remove the bypass.
- TDD red-first: the new test must fail before the procedure edit and pass
  after. No existing assertion narrowed or deleted.
- Gates in full, at the branch head: `bash council/preflight.sh FLLWUP-42`,
  `bunx tsc --noEmit`, `bun test`, `python3 council/validate.py`. The
  FLLWUP-27 branch-freshness artifact in preflight is a known mid-run
  artifact; the step-11 re-run set is `tsc` / `bun test` / `validate.py`.
- Conventional Commits; push branch + PR against `main`; never merge, never
  poll CI (the merge is the facilitator's move under R2).

---

### Task 1: Write the failing pin test

**Files:**
- Modify: `test/prose.test.ts` (append one test at end of file)

**Interfaces:**
- Consumes: existing `councilMarkdown()` helper / direct
  `features-deliver.md` read pattern used by sibling tests in the file.
- Produces: a new test named
  `features-deliver names the run-scoped --admin bypass as the sanctioned merge step`
  asserting literal substrings of the new copy (whitespace-flattened, per
  the file's copy-as-literal convention).

- [ ] **Step 1: Append the failing test**

```typescript
test("features-deliver names the run-scoped --admin bypass as the sanctioned merge step", () => {
	const text = fs.readFileSync(
		path.join(PKG_ROOT, "council", "procedures", "features-deliver.md"),
		"utf-8",
	);
	// Whitespace-normalized so the pin survives line wrapping in the prose.
	const flat = text.replace(/\s+/g, " ");
	// FLLWUP-42 / Phase-1 ruling R2: under a `main` ruleset that requires an
	// approving review, the sanctioned merge step is the human-granted
	// admin bypass — named explicitly, in the exact authorized command shape.
	const sectionStart = flat.indexOf("## The deterministic merge check");
	const sectionEnd = flat.indexOf("## Guards");
	expect(sectionStart).toBeGreaterThan(-1);
	expect(sectionEnd).toBeGreaterThan(sectionStart);
	const mergeCheck = flat.slice(sectionStart, sectionEnd);
	expect(mergeCheck).toContain("requires an approving review");
	expect(mergeCheck).toContain("gh pr merge <PR> --squash --admin --match-head-commit <X>");
	expect(mergeCheck).toContain("sanctioned merge step");
	// The authorization is run-scoped — recorded on the card / by a Phase-1
	// ruling before the merge — and never extended to a later run.
	expect(mergeCheck).toContain("run-scoped");
	expect(mergeCheck).toContain("Phase-1 ruling");
	expect(mergeCheck).toContain("not extended to any later run");
	// A run with no recorded authorization must not use `--admin`; if the
	// ruleset then blocks the merge, that is a HALT to the human, not a
	// bypass.
	expect(mergeCheck).toContain("must not use `--admin`");
	expect(mergeCheck).toContain("HALT surfaced to the human");
});
```

- [ ] **Step 2: Verify RED**

Run: `bun test test/prose.test.ts`
Expected: FAIL on
`features-deliver names the run-scoped --admin bypass as the sanctioned merge step`
(first failing assertion: `"requires an approving review"` not found).
All pre-existing tests still pass.

- [ ] **Step 3: Commit the red test alone is NOT done** — proceed to Task 2
  in the same working tree; the red state is verified by command output,
  and the commit lands with the green change (a red commit would break
  bisect).

### Task 2: Land the sanctioned-bypass copy

**Files:**
- Modify: `council/procedures/features-deliver.md` — replace only the
  paragraph beginning `Merge-time behaviour — branch protection, required
  status checks — may not be configured in this repo.` (the stale claim)
  with the sanctioned-bypass copy. Everything above it — five criteria,
  criterion-2 read, `--match-head-commit` pinning — is byte-untouched.

- [ ] **Step 1: Replace the stale paragraph with:**

```markdown
**Merge-time repository protection is a fact to satisfy, not an obstacle
to route around.** A `main` ruleset that requires an approving review
blocks an ordinary merge. Under such a ruleset, the sanctioned merge step
is the human-granted admin bypass, performed with the SHA pinned exactly
as above:

> `gh pr merge <PR> --squash --admin --match-head-commit <X>`

**The `--admin` bypass is sanctioned only as a run-scoped
authorization.** It is valid only when a recorded human decision — a
Phase-1 ruling, named on the card face before the merge — authorizes it
for this run. The authorization is **not extended to any later run**: a
run with no such recorded authorization must not use `--admin`. If the
ruleset then blocks the merge, that is a **`HALT` surfaced to the human**
— the protection is doing its job, not an obstacle to defeat.

The first autonomous merge this command performs should be watched by the
human, not merely reported after the fact.
```

- [ ] **Step 2: Verify GREEN**

Run: `bun test test/prose.test.ts`
Expected: the new test PASSES; every pre-existing test still passes.

- [ ] **Step 3: Commit**

```bash
git add test/prose.test.ts council/procedures/features-deliver.md \
  docs/superpowers/plans/2026-09-17-FLLWUP-42-admin-merge-procedure.md
git commit -m "fix(council): FLLWUP-42 — name the run-scoped --admin bypass as the sanctioned merge step in features-deliver"
```

### Task 3: Clear the four gates, in order

- [ ] **Step 1:** `bash council/preflight.sh FLLWUP-42` — expect
  `PASS: preflight clean`; if the known FLLWUP-27 branch-freshness line
  FAILs (runner record commits pushed to `main` mid-card), record the
  artifact and rely on the step-11 re-run set; never weaken a criterion.
- [ ] **Step 2:** `bunx tsc --noEmit` — expect clean exit.
- [ ] **Step 3:** `bun test` — expect all pass.
- [ ] **Step 4:** `python3 council/validate.py` — expect
  `All council artifacts valid`.

### Task 4: Push and open the PR (no merge, no CI polling)

- [ ] **Step 1:** `git push -u origin feat/fllwup-42-admin-merge-procedure`
- [ ] **Step 2:** `gh pr create --base main` with body carrying: worktree
  path, branch, head SHA, red-first test output, gate outputs, R2 applied.
- [ ] **Step 3:** Stop. The merge is the facilitator's move under R2.
