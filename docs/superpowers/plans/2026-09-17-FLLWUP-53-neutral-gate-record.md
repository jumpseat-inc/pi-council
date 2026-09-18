# FLLWUP-53 — De-repo-specific gate-file reference + widen the prose guard

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `council.md` no longer hard-references a gate-document path that does not exist in this repo, and the packaged-prose guard covers every shipped file that could reintroduce one.

**Architecture:** Three-edit seam, no engine changes: (1) widen the existing `councilMarkdown()`-based guard in `test/prose.test.ts` to iterate all packaged seat + procedure prose (red-first), (2) reword `council/procedures/council.md` step 8's hard `docs/gates/GATE-EVIDENCE.md` reference to consumer-neutral phrasing, (3) reword `council/agents/owner.md`'s `e.g.` example in the same pass because the widened guard otherwise reds it.

**Tech Stack:** bun (tests), packaged council prose (markdown).

**Spec:** `council/cards/FLLWUP-53.md` — its `goal`, `Intent`, and the step-1 grounded facts are the binding inputs; the deliverable was handed off as the card itself.

## Global Constraints

- Main checkout `/home/tista/codes/pi-council` branch state is immutable: all work in `.worktrees/fllwup-53` (branch `feat/fllwup-53-neutral-gate-record`, cut from `a54e8f8`); resolve every path against the worktree; verify main `git status --short` empty before push.
- Red-first (TDD): the widened guard test must FAIL before the prose edits and PASS after; record the literal red output and the green run.
- Keep every existing pin green: FLLWUP-60's step-12 record-push pin, FLLWUP-51's wrapped-goal pins, FLLWUP-41/42's pins, FLLWUP-47's red-base byte-identity and output-format pins, the stack-neutrality guard.
- Replacement prose stays free of `bun`/`bunx`/`typescript`/`tsc` (stack-neutrality guard scans all packaged prose).
- Scope fences: no `council/scaffold/`, `council/fixtures/`, `vault/`, `extensions/`, `package.json`, or any other procedure/seat file. Card records in `council/cards/` naming the path are historical run records — never edit them.
- The literal token `GATE-EVIDENCE.md` must not appear anywhere in new or edited packaged prose (this is exactly what the widened guard enforces).
- Gates, in order, in full: `bash council/preflight.sh FLLWUP-53` (branch-freshness FAIL may occur by construction — record verbatim, do not reclassify), `bunx tsc --noEmit`, `bun test`, `python3 council/validate.py`.

---

### Task 1: Widen the guard test (RED)

**Files:**
- Modify: `test/prose.test.ts:28-34` (the "features-deliver does not hard-reference the repo-specific gate file" test)

**Interfaces:**
- Consumes: the existing `councilMarkdown()` helper (`test/prose.test.ts:7-17`) which yields `Array<[<agents|procedures>/<file>, text]>` over every packaged `.md`.
- Produces: a test named for its widened scope that fails on `GATE-EVIDENCE.md` in any packaged seat or procedure file.

- [x] **Step 1: Replace the single-file test with the widened guard**

```ts
test("packaged council prose does not hard-reference the repo-specific gate file", () => {
	// FLLWUP-53: a repo-specific gate-document path stated as fact in packaged
	// prose is the failure class this guard exists for — council.md step 8
	// hard-named `docs/gates/GATE-EVIDENCE.md`, a path that does not exist in
	// this repo, and the old single-file guard missed it. Every packaged seat
	// and procedure file is covered so a second naming cannot reintroduce it.
	for (const [rel, text] of councilMarkdown()) {
		expect(text, `${rel} hard-references the repo-specific gate file`).not.toContain(
			"GATE-EVIDENCE.md",
		);
	}
});
```

- [x] **Step 2: Watch it fail**

Run: `bun test test/prose.test.ts`
Expected: FAIL — at least one of `agents/owner.md`, `procedures/council.md` carries `GATE-EVIDENCE.md`. Record the literal output.

- [x] **Step 3: Commit the red test**

```bash
git add test/prose.test.ts
git commit -m "test(prose): widen the repo-specific gate-file guard to all packaged council prose"
```

### Task 2: Reword the packaged prose (GREEN)

**Files:**
- Modify: `council/procedures/council.md:237-238` (step 8)
- Modify: `council/agents/owner.md:97-99` (`<owner_mode>` gate-discipline paragraph)

**Interfaces:**
- Consumes: Task 1's widened guard as the acceptance oracle.
- Produces: packaged prose free of `GATE-EVIDENCE.md`, with the sentence meanings intact.

- [x] **Step 1: Reword council.md step 8**

Old:

```markdown
The owner then clears **every gate its own agent defines, in full** —
`docs/gates/GATE-EVIDENCE.md` is the authoritative record of what those
gates are and how to run them, and the owner's own agent definition already
carries that discipline.
```

New:

```markdown
The owner then clears **every gate its own agent defines, in full** — the
repo's own authoritative gate record, if it keeps one, is the source of
truth for what those gates are and how to run them, and the owner's own
agent definition already carries that discipline.
```

- [x] **Step 2: Reword owner.md's `e.g.` example**

Old:

```markdown
Where the repo keeps an authoritative gate document (e.g.
`docs/gates/GATE-EVIDENCE.md`), it outranks the wiki: if a wiki page and
that file ever disagree, the file wins and the wiki is stale.
```

New:

```markdown
Where the repo keeps an authoritative gate document, it outranks the wiki:
if a wiki page and that document ever disagree, the document wins and the
wiki is stale.
```

- [x] **Step 3: Watch the widened guard pass**

Run: `bun test test/prose.test.ts`
Expected: PASS — 0 failures; every existing pin in this file still green. Record the literal output.

- [x] **Step 4: Commit**

```bash
git add council/procedures/council.md council/agents/owner.md
git commit -m "docs(council): replace the repo-specific gate-file reference with consumer-neutral phrasing"
```

### Task 3: Clear all gates, in full

- [x] **Step 1:** `bash council/preflight.sh FLLWUP-53` — record verbatim; a branch-freshness FAIL is a known artifact of the runner's record pushes advancing `origin/main` past this branch cut; the operative local gate set is Steps 2–4.
- [x] **Step 2:** `bunx tsc --noEmit` — expected clean.
- [x] **Step 3:** `bun test` — expected all green; report exact pass/fail counts.
- [x] **Step 4:** `python3 council/validate.py` — expected `All council artifacts valid`.

### Task 4: Push + open PR

- [x] **Step 1:** Verify main checkout `git status --short` is empty.
- [x] **Step 2:** `git push -u origin feat/fllwup-53-neutral-gate-record`.
- [x] **Step 3:** `gh pr create --base main` with a body tying back to the card; do not poll CI.
