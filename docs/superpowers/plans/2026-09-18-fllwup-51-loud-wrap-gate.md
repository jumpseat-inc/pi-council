# FLLWUP-51 — Loud gate for a goal wrapped onto a second line (implementation plan)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `council/validate.py::parse_frontmatter` refuses — with a named, vocabulary-echoing `FAIL:` — a wrapped goal, a non-`key: value` line inside the leading frontmatter block, an unclosed block, and a key after `goal:`, while single-line colon goals and extra keys before `goal:` stay green.

**Architecture:** Raise-based loader gate. `parse_frontmatter` raises `FrontmatterError(line_no, line_text, partial_meta)` on three positional raw-line predicates; `main()` catches per card, prints one structural `FAIL: <fname>: <message>`, and runs all downstream per-card checks against `partial_meta` (T4 survives). Propagated byte-identically to the scaffold copy and 8 seed copies; 8 digests re-pinned; procedure copy corrected (root only); T7 flipped; new R-test set.

**Tech Stack:** Python 3 (stdlib only), bun:test, TypeScript.

**Spec:** `docs/superpowers/specs/2026-09-18-FLLWUP-51-design.md` (§2, §5, §6 are the contract) + the amended `goal:` in `council/cards/FLLWUP-51.md` (the judge's oracle).

## Global Constraints

- Predicate lives in `parse_frontmatter` (raise), never a `main()` bolt-on (R2′ anti-bolt-on).
- No key vocabulary / no unknown-key FAIL (withdrawn; R7 pins the withdrawal).
- No continuation-folding; authoring-time refusal out of scope.
- Every structural FAIL quotes the offending line (PO 3.1) and contains ≥1 of {wrap, second line, line break, value} (PO 3.5, suite-pinned R11).
- One structural FAIL per card: "not closed" suppressed when the bare-line FAIL fired (PO 3.4, R12).
- 10 `validate.py` copies byte-identical (T3); 8 `fixture.json` re-pins (`sha256Tree(seed/)`, `fixtureVersion` 1.2.0) (T5); rubric untouched (T5b stays 1.1.0).
- `board-create-card.md` root copy only; instructional tone, no authoring-time refusal.
- Conventional Commits; `package.json` 0.19.0 → 0.20.0 in the same PR; release notes call out that `goal:` is now positional.
- All work in `.worktrees/fllwup-51` on `feat/fllwup-51-loud-wrap-gate`; main checkout untouched.

---

### Task 1: Baseline + red-first test set

**Files:**
- Create: `test/fllwup51-gate.test.ts`
- Test: `bun test test/fllwup51-gate.test.ts`

- [x] **Step 1: Worktree created** at `.worktrees/fllwup-51` (branch `feat/fllwup-51-loud-wrap-gate` from `3646cd5` == origin/main), deps installed.
- [ ] **Step 2: Baseline**: `bun test test/fllwup43-goal-oracle.test.ts` green (T7 pins silence today).
- [ ] **Step 3: Write `test/fllwup51-gate.test.ts`** — R1, R2′, R3, R4a, R4b, R5′ (leading-block-scoped scan + full-tree green run), R7, R8 (three sub-shapes incl. PO-4's exit-0 residual), R9, R10 (exit-0 residual pin), R11 (vocabulary echo), R12 (one-structural-FAIL). Harness mirrors FLLWUP-43 (`councilTree`, `runValidate`, direct `parse_frontmatter` via subprocess).
- [ ] **Step 4: Run and record reds.** Expected red today: R1, R2′, R3, R4a, R4b, R8 fail-legs, R11, R12. Expected green today: R5′, R7, R9, R10, R8 residual leg.

### Task 2: The loader gate in `council/validate.py`

**Files:**
- Modify: `council/validate.py` (module docstring, `FrontmatterError`, `parse_frontmatter`, `main()` catch)
- Test: `bun test test/fllwup51-gate.test.ts`

- [ ] **Step 1: Implement** the three predicates (§2): key-after-`goal` raise ("line after `goal`" phrasing, quotes line, wrap vocabulary); bare non-`key: value` raise (both hypotheses: "wrapped/continued value, or the closing `---` is missing"); unclosed raise after loop with distinct "not closed" message (auto-suppressed because the bare-line raise never returns). `main()` catches `FrontmatterError`, prints `FAIL: <fname>: <msg>`, sets `meta = exc.partial_meta`, and continues all per-card checks.
- [ ] **Step 2: Run the new file green**; `bun test test/fllwup43-goal-oracle.test.ts` — T3/T5 red expected (copies not yet propagated / digests stale); T1/T2/T2b/T4/T6/T8 green.
- [ ] **Step 3: Commit test + mechanism together** (suite stays green per commit is restored in Task 3).

### Task 3: Propagate 10 copies + re-pin digests

**Files:**
- Modify: `council/scaffold/council/validate.py`, 8 × `council/fixtures/<task>/seed/council/validate.py` (byte-identical `cp`), 8 × `council/fixtures/<task>/fixture.json` (`seed.treeDigest` = `sha256Tree(seed/)`, `fixtureVersion` → 1.2.0)
- Modify: `test/fllwup43-goal-oracle.test.ts` (T5 → 1.2.0, T7 flip, header note)
- Test: `bun test test/fllwup43-goal-oracle.test.ts test/fllwup51-gate.test.ts`

- [ ] **Step 1: `cp` root validate.py over the 9 copies; recompute digests with `sha256Tree` (extensions/eval-fixtures.ts) via bun; update fixtureVersion.**
- [ ] **Step 2: Amend fllwup43 test file** (T5 assertion + name; T7 flipped; header note).
- [ ] **Step 3: Both test files green; commit.**

### Task 4: Procedure copy (root only)

**Files:**
- Modify: `council/procedures/board-create-card.md` (§3)

- [ ] **Step 1: Make goal-last explicit; split the conflation (line break ends the *value*; a non-`key: value` line ends the *block*); state the now-enforced validator refusal; keep instructional.**
- [ ] **Step 2: `bun test` full suite green; commit.**

### Task 5: Version bump + gates + PR

**Files:**
- Modify: `package.json` (0.19.0 → 0.20.0), this plan file

- [ ] **Step 1: Bump version; commit plan + version.**
- [ ] **Step 2: Gates, in order, from the worktree:** `bash council/preflight.sh FLLWUP-51` → `bunx tsc --noEmit` → `bun test` → `python3 council/validate.py`. Hard stop on any red.
- [ ] **Step 3: Push branch; open PR** with release notes calling out that `goal:` is now positional and consumer cards must conform (PO item 2).
