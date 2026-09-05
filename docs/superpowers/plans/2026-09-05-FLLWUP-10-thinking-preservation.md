# FLLWUP-10: Writer thinking preservation matches loader resolution — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `existingThinking` in `extensions/council-config-writer.ts` parse an object-form `model`'s `:suffix` with the exact rule `applySeatOverride` uses (`lastIndexOf(':')` + `THINKING_LEVELS.has(...)`), so a model-only write against an object-form override carrying a `:suffix` (and no explicit `thinking` key) preserves that thinking level instead of silently dropping it back to frontmatter.

**Architecture:** The loader (`applySeatOverride`, `extensions/seats.ts:412-427`) and the writer (`existingThinking`, `extensions/council-config-writer.ts:200-217`) both derive an override's effective `thinking`, but the writer's object branch only reads the `.thinking` key — never `model`'s `:suffix`, which the loader parses. The fix adds one fallback to the object branch: when `.thinking` is absent (or invalid), parse `raw.model`'s `:suffix` with the identical `lastIndexOf(':')` + `THINKING_LEVELS.has(...)` predicate and `>= 1`-char guard. Precedence order stays loader-exact: explicit `.thinking` key wins over the inline `:suffix` (the loader applies `if (ov.thinking) thinkingLevel = ov.thinking;` after suffix parsing). The fix is confined to `existingThinking`; the byte-region splice, validation, and all EV-24 guarantees are untouched. `extensions/seats.ts` is the reference, NOT a file to change.

**Tech Stack:** TypeScript (strict), bun + bun:test. No new dependencies.

**Spec:** Card FLLWUP-10 (EPIC-6), filed from EV-23 Skeptic verification (objection O-1, closed-red, reproduced). Wiki ground: `vault/wiki/council-config-writer.md` (the "Known seam" section documents this exact defect and names FLLWUP-10), `vault/wiki/council-config.md` (precedence: explicit `thinking` key > inline `:suffix` > frontmatter).

## Global Constraints

- Single seam: `extensions/council-config-writer.ts` (`existingThinking` only) + `test/council-config-writer.test.ts`. Do NOT touch `extensions/seats.ts` (the loader is the reference), `council/board.md`, `council/cards/*.md`, or any other file.
- The writer's parse rule must match `applySeatOverride`'s exactly: `lastIndexOf(':')` + `THINKING_LEVELS.has(suffix)`, with the suffix checked only when `colon > 0` (a leading-position or absent colon is not a suffix), and a non-member suffix is dropped (never carried — the file would be un-loadable).
- Precedence inside the object branch: explicit `.thinking` key first, then `model` `:suffix` — mirroring the loader's `thinking key > :suffix > frontmatter`.
- EV-24 guarantees hold — `theme` section, other seats, and unknown top-level keys byte-identical after the write (the fix changes only *what value* `existingThinking` returns, never the splice).
- No write-path behavior change beyond the parse rule: absent `thinking` still preserves; `thinking: "xhigh"` still accepted regardless of catalogue capability; greenfield still canonical 2-space + trailing newline.
- TDD: new behavior needs a failing test first; watch it fail with the expected reason. Pre-existing 2 skips (env-dependent integration suite) untouched.
- Commits MUST be Conventional Commits (`fix(council-config-writer): ...`); no history rewriting; never work on `main`.
- Gates, in order, none lowered: `bun install --frozen-lockfile` (exit 0), `bunx tsc --noEmit` (exit 0), `bun test` (whole suite green; 2 skips expected), `python3 council/validate.py` ("All council artifacts valid").
- Clean tree hygiene: no stray/throwaway `test/*.ts` files — every probe either lands in a commit or is deleted before finishing.

---

### Task 1: Failing test + minimal fix in `existingThinking`

**Files:**
- Modify: `extensions/council-config-writer.ts` (`existingThinking`, lines 200-217)
- Modify: `test/council-config-writer.test.ts`

**Interfaces:**
- Consumes: existing test helpers `makeRepo`, `cfg`, `objectEnd`, `T`, `TAB_FIXTURE`-style fixtures, `CATALOGUE` (includes `openrouter/minimax/minimax-m3` and `openrouter/new/other`); `writeSeatOverride`, `loadCouncilConfig` (already imported).
- Produces: the FLLWUP-10 acceptance tests (below); the fixed `existingThinking` (assertion rule identical to `applySeatOverride`).

- [ ] **Step 1: Write the failing test**

Append to `test/council-config-writer.test.ts`, inside the existing `describe("writeSeatOverride", ...)` block, after the "string-shorthand span becomes the object form" test:

```ts
test("FLLWUP-10: object-form model :suffix is preserved across a model-only write (loader parity)", () => {
	// Reproduction from the card: object-form override carrying a :suffix and
	// NO explicit thinking key. Pre-fix, existingThinking sees only the absent
	// `.thinking` key, the write emits no thinking line, and the post-write
	// effective thinking falls back to frontmatter — "low" silently dropped.
	const fixture =
		`{\n` +
		`${T}"council": {\n` +
		`${T}${T}"designer": {\n` +
		`${T}${T}${T}"model": "openrouter/minimax/minimax-m3:low"\n` +
		`${T}${T}},\n` +
		`${T}${T}"judge": {\n` +
		`${T}${T}${T}"model": "openrouter/qwen/qwen3.6-35b-a3b:medium"\n` +
		`${T}${T}}\n` +
		`${T}},\n` +
		`${T}"theme": {\n` +
		`${T}${T}"enabled": true,\n` +
		`${T}${T}"variant": "auto"\n` +
		`${T}},\n` +
		`${T}"unknownTopLevel": { "kept": true }\n` +
		`}`;
	const repo = makeRepo({ [COUNCIL_CONFIG_FILE]: fixture });
	const before = cfg(repo);

	// Model-only write — no `thinking` argument, so preservation is the merge's job.
	const res = writeSeatOverride({ repoRoot: repo, seat: "designer", model: "openrouter/new/other", catalogue: CATALOGUE });
	expect(res.ok).toBe(true);
	const after = cfg(repo);

	// The written entry preserves the level the loader would have resolved:
	expect(loadCouncilConfig(repo).designer).toEqual({ model: "openrouter/new/other", thinking: "low" });
	expect(after).toContain(`"thinking": "low"`);

	// EV-24 guarantees still hold through this fixture: only designer's value
	// span changed; theme, judge, unknown key, indent, trailing bytes identical.
	const keyAt = before.indexOf('"designer"');
	const valueStart = before.indexOf("{", keyAt);
	const valueEnd = objectEnd(before, valueStart);
	expect(after.startsWith(before.slice(0, valueStart))).toBe(true);
	expect(after.endsWith(before.slice(valueEnd))).toBe(true);
	const themeBefore = before.slice(before.indexOf('"theme"'));
	const themeAfter = after.slice(after.indexOf('"theme"'));
	expect(sha256(themeAfter)).toBe(sha256(themeBefore));
	expect(after.slice(after.indexOf('"unknownTopLevel"'))).toBe(before.slice(before.indexOf('"unknownTopLevel"')));
});

test("FLLWUP-10: explicit thinking key still wins over an object-form model :suffix (loader precedence)", () => {
	// applySeatOverride: `if (ov.thinking) thinkingLevel = ov.thinking;` runs
	// AFTER suffix parsing — the explicit key must win here too. Regression pin
	// guarding a wrong fix that checks the :suffix before the .thinking key.
	const fixture =
		`{\n` +
		`${T}"council": {\n` +
		`${T}${T}"designer": {\n` +
		`${T}${T}${T}"model": "openrouter/minimax/minimax-m3:low",\n` +
		`${T}${T}${T}"thinking": "high"\n` +
		`${T}${T}}\n` +
		`${T}}\n` +
		`}`;
	const repo = makeRepo({ [COUNCIL_CONFIG_FILE]: fixture });
	const res = writeSeatOverride({ repoRoot: repo, seat: "designer", model: "openrouter/new/other", catalogue: CATALOGUE });
	expect(res.ok).toBe(true);
	expect(loadCouncilConfig(repo).designer).toEqual({ model: "openrouter/new/other", thinking: "high" });
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `bun test test/council-config-writer.test.ts -t "FLLWUP-10"`
Expected: the FIRST test FAILS — `loadCouncilConfig(repo).designer` is `{ model: "openrouter/new/other" }` without `thinking: "low"` (the silent drop the card reproduces), and `after` does not contain `"thinking": "low"`. The second test PASSES (explicit key was already preserved) — it is a regression pin, not the red. The byte-identity assertions in test 1 pass pre-fix too (they pin EV-24 guarantees, which the defect never broke).

- [ ] **Step 3: Implement the minimal fix**

`extensions/council-config-writer.ts`, `existingThinking` (lines 200-217) — replace the doc comment and the object branch:

```ts
/** Existing thinking of `parsedDoc.council[seat]`: a string-shorthand
 *  `:suffix`, the object's `thinking` key, or an object-form `model`'s
 *  `:suffix` — the same parse rule `applySeatOverride` uses (thinking key >
 *  inline suffix), so preservation matches loader resolution (FLLWUP-10).
 *  Only members of THINKING_LEVELS are carried — an invalid level would keep
 *  the file un-loadable, so a broken value is dropped instead of byte-kept. */
function existingThinking(parsedDoc: unknown, seat: string): string | undefined {
	const council = (parsedDoc as Record<string, unknown>).council;
	if (typeof council !== "object" || council === null || Array.isArray(council)) return undefined;
	const raw = (council as Record<string, unknown>)[seat];
	if (typeof raw === "string") {
		const colon = raw.lastIndexOf(":");
		if (colon > 0 && THINKING_LEVELS.has(raw.slice(colon + 1))) return raw.slice(colon + 1);
		return undefined;
	}
	if (typeof raw === "object" && raw !== null && !Array.isArray(raw)) {
		const rec = raw as Record<string, unknown>;
		const t = rec.thinking;
		if (typeof t === "string" && THINKING_LEVELS.has(t)) return t;
		// FLLWUP-10: object-form `model` may carry the same `:suffix` the string
		// shorthand does; applySeatOverride parses it. Unknown/trailing suffixes
		// are dropped (no level) exactly like the string branch and the loader.
		const m = rec.model;
		if (typeof m === "string") {
			const colon = m.lastIndexOf(":");
			if (colon > 0 && THINKING_LEVELS.has(m.slice(colon + 1))) return m.slice(colon + 1);
		}
	}
	return undefined;
}
```

- [ ] **Step 4: Run to verify they pass**

Run: `bun test test/council-config-writer.test.ts`
Expected: PASS — both FLLWUP-10 tests plus the full pre-existing writer suite (byte-splice, hostile span-finder, capability parity, mode, idempotency, shorthand-carry, etc.).

- [ ] **Step 5: Commit**

```bash
git add extensions/council-config-writer.ts test/council-config-writer.test.ts
git commit -m "fix(council-config-writer): preserve object-form model :suffix on model-only writes (FLLWUP-10)"
```

---

### Task 2: Clear all four gates in order

- [ ] **Step 1: Gate 1 — frozen install**

Run: `bun install --frozen-lockfile`
Expected: exit 0, no lockfile diff (`git status --short` shows no `bun.lock` change).

- [ ] **Step 2: Gate 2 — typecheck**

Run: `bunx tsc --noEmit`
Expected: exit 0, no output.

- [ ] **Step 3: Gate 3 — whole test suite**

Run: `bun test`
Expected: whole suite green; 2 pre-existing skips (env-dependent integration) remain skipped; record real pass/skip counts; `git status --short` clean except intended changes (no stray probe files in `test/`).

- [ ] **Step 4: Gate 4 — council artifacts**

Run: `python3 council/validate.py`
Expected: prints `All council artifacts valid`, exit 0.

- [ ] **Step 5: Commit any remaining changes (none expected)**

---

### Task 3: Push the branch and open the PR

- [ ] **Step 1:** Confirm the diff touches only `extensions/council-config-writer.ts`, `test/council-config-writer.test.ts`, and the plan file:

```bash
git status --short
git diff main --stat
```

- [ ] **Step 2:** Push and open the PR:

```bash
git push -u origin fllwup-10-thinking-preservation
gh pr create --base main --head fllwup-10-thinking-preservation --title "fix(council-config-writer): preserve object-form model :suffix on model-only writes (FLLWUP-10)" --body "FLLWUP-10 ... "
```

- [ ] **Step 3:** Record branch name, PR number, and exact head SHA (`git rev-parse HEAD`). Do NOT poll CI. Report the gates' real output in the final report.