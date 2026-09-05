# FLLWUP-13 No-Match Exit Hint Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When `/council-models`' model level has search open (`searchActive`) and the query matches zero rows, render a dim second line directly under the ruled `No models matching "<query>".` literal with the byte-exact copy `↓ then esc exits search` (FLLWUP-13 R-1), leaving the ruled footer `FOOTER_MODEL` byte-exact and last and every other frame untouched.

**Architecture:** Single-seam additive change. A new exported byte-exact constant `NO_MATCH_HINT` sits next to the other ruled copy exports in `extensions/model-picker.ts`; the zero-row branch of `ModelPicker.render` pushes it as one more body line directly under the `NO_MATCH` line and above the unchanged `FOOTER_MODEL`. No handler logic changes — the keys the hint names (Down moves focus out, Esc then ascends) are already shipped and driven-tested (EV-27 8/9/12/13) and are re-proven here by a mirror walk test.

**Tech Stack:** TypeScript (strict), bun:test, pi-tui `Component` pattern, no new dependencies.

**Spec:** `council/cards/FLLWUP-13.md` — the card IS the spec (mechanical-path handoff; Intent/goal/Acceptance + Phase 1 ruling R-1 are binding and immutable).

## Global Constraints

- **Seam is exactly two files:** `extensions/model-picker.ts` and `test/model-picker.test.ts`. Nothing else. Do NOT touch `extensions/council-models.ts`, `navigator.ts`, `council/`, `vault/`, `smoke/`. The only other committed file is this plan.
- **Byte-exact literal:** `NO_MATCH_HINT = "↓ then esc exits search"` — `↓` is U+2193 (DOWNWARDS ARROW), transcribed byte-for-byte from the card face (verified from the card: codepoints `0x2193 0x20 0x74 0x68 0x65 ...`, single spaces, no trailing period). New export only — never retype, never modify anything.
- **Do NOT modify:** `resolveSelection`, `HEADER`, the three footer strings (`FOOTER_SEAT_PROVIDER`, `FOOTER_MODEL`, `FOOTER_CONFIRM`), `seatMarker`, `echoFor`, `footerFor`, `rowsForProvider`, `filterModelRows`, `NO_MATCH`, `SEARCH_ROW_EMPTY`, `PRE_SEARCH_HINT`, `EMPTY_NO_PROVIDERS`, `EMPTY_NO_MODELS`.
- **Four-footer rule:** the hint is a body line in the no-match region, never a fifth footer — `FOOTER_MODEL` stays the last rendered line in every search frame.
- **Mutual exclusion with the pre-press hint:** `PRE_SEARCH_HINT` renders only in the non-search model-level frame (BUG-1 R-1); the no-match hint renders only inside `searchActive` with zero rows, which requires a non-empty query (the empty-query branch renders `SEARCH_ROW_EMPTY` + rows). The two can never render in the same frame.
- **Token-only drawing:** dim via `this.theme.fg("dim", ...)` — no ANSI escapes, no hex literals (AGENTS.md 9.6).
- **TDD:** each task writes the failing test first and watches it fail before the implementation lands.
- **Never commit `council/` or `vault/` files** — the runner owns them.
- **Conventional Commits**; no history rewriting.
- **Gates** (`.github/workflows/gates.yml` is the authoritative record — this repo has no `docs/gates/GATE-EVIDENCE.md`): 1) `bun install --frozen-lockfile`, 2) `bunx tsc --noEmit`, 3) `bun test` (baseline 541 pass / 2 skip / 0 fail), 4) `python3 council/validate.py`. All four green, in order, each a hard stop-and-fix, full regardless of change size. No database, import dataset, or server boot exists in this repo — these four commands are the complete gate set.

---

### Task 1: Byte-exact `NO_MATCH_HINT` constant (TDD red → green)

**Files:**
- Modify: `extensions/model-picker.ts` (add export next to `NO_MATCH`, after line 40)
- Modify: `test/model-picker.test.ts` (add `NO_MATCH_HINT` to the import block, add the constant test)

**Interfaces:**
- Consumes: existing export block pattern — `export const NO_MATCH = (query: string): string => ...` at `extensions/model-picker.ts:40`.
- Produces: `export const NO_MATCH_HINT: string` = `"↓ then esc exits search"` (U+2193 first char). Later tasks import it.

- [ ] **Step 1: Write the failing test**

Append at the end of `test/model-picker.test.ts`, and add `NO_MATCH_HINT,` to the import block after `NO_MATCH,`:

```ts
// ---- FLLWUP-13 no-match exit hint (EPIC-6 follow-up) ----
test("FLLWUP-13 ruled copy: NO_MATCH_HINT is the byte-exact R-1 literal, byte-distinct from the R-4 empty states", () => {
	expect(NO_MATCH_HINT).toBe("↓ then esc exits search"); // ↓ is U+2193 — transcribed from the card face
	expect(NO_MATCH_HINT).not.toBe(EMPTY_NO_PROVIDERS);
	expect(NO_MATCH_HINT).not.toBe(EMPTY_NO_MODELS("OpenRouter"));
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `bun test test/model-picker.test.ts`
Expected: RED — module load failure: `model-picker.ts does not provide an export named 'NO_MATCH_HINT'`. This is the correct red for an additive export: the missing export IS the missing feature.

- [ ] **Step 3: Add the export**

In `extensions/model-picker.ts`, directly after the `NO_MATCH` export (line 40):

```ts
/** FLLWUP-13 R-1 ruled no-match exit hint — byte-exact (↓ is U+2193), immutable.
 *  Names the real two-key walk: Down moves focus out of the input, Esc then
 *  ascends and search state dies with the level. Lives in the no-match region,
 *  never a footer. */
export const NO_MATCH_HINT = "↓ then esc exits search";
```

- [ ] **Step 4: Run it and watch it pass**

Run: `bun test test/model-picker.test.ts`
Expected: GREEN — `FLLWUP-13 ruled copy` passes; all previously existing tests in the file still pass.

---

### Task 2: Render the hint in the zero-row branch (TDD red → green)

**Files:**
- Modify: `test/model-picker.test.ts` (append render test)
- Modify: `extensions/model-picker.ts` (zero-row branch of `ModelPicker.render`, around line 235)

**Interfaces:**
- Consumes: `NO_MATCH_HINT` (Task 1), the existing `render` no-match branch, `FOOTER_MODEL`, `EMPTY_NO_PROVIDERS`, `EMPTY_NO_MODELS`.
- Produces: the zero-match frame shape `[HEADER, searchRow, NO_MATCH, NO_MATCH_HINT, FOOTER_MODEL]` — hint at index 3, footer last at index 4.

- [ ] **Step 1: Write the failing test**

Append at the end of `test/model-picker.test.ts`:

```ts
test("FLLWUP-13 1: zero-match renders the ruled NO_MATCH literal then the dim hint line, in that order, above FOOTER_MODEL — never a fifth footer", () => {
	const { p } = picker(CATALOGUE);
	p.handleInput(ENTER);
	p.handleInput(ENTER);
	p.handleInput("/");
	for (const ch of "zzzz") p.handleInput(ch);
	const lines = p.render(80).map(strip);
	expect(lines[1]).toBe("▌ zzzz"); // search row unchanged
	expect(lines[2]).toBe(NO_MATCH("zzzz")); // ruled literal unchanged, in place
	expect(lines[3]).toBe(NO_MATCH_HINT); // hint line directly under it
	expect(lines[lines.length - 1]).toBe(FOOTER_MODEL); // four-footer rule intact
	expect(lines).not.toContain(EMPTY_NO_PROVIDERS);
	expect(lines).not.toContain(EMPTY_NO_MODELS("OpenRouter"));
	expect(lines[3]).not.toBe(FOOTER_MODEL); // the hint is a body line, never a footer
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `bun test test/model-picker.test.ts`
Expected: RED — `expect(lines[3]).toBe(NO_MATCH_HINT)`: received `↑/↓ move · enter select · esc back` (the current frame is `[HEADER, searchRow, NO_MATCH, FOOTER_MODEL]`). Fails for the right reason: the hint line is missing.

- [ ] **Step 3: Add the render line**

In `extensions/model-picker.ts`, the zero-row branch of `render` (currently a single push):

```ts
				if (rows.length === 0) {
					lines.push(this.theme.fg("dim", NO_MATCH(this.query)));
					// FLLWUP-13 R-1: dim exit-hint under the ruled literal — a body
					// line in the no-match region, never a fifth footer. FOOTER_MODEL
					// below stays byte-exact and last. Renders only inside
					// searchActive with a non-empty query — mutually exclusive with
					// the non-search PRE_SEARCH_HINT frame by construction.
					lines.push(this.theme.fg("dim", NO_MATCH_HINT));
				}
```

- [ ] **Step 4: Run it and watch it pass**

Run: `bun test test/model-picker.test.ts`
Expected: GREEN — `FLLWUP-13 ruled copy` and `FLLWUP-13 1` pass; the existing "EV-27 9" test (reads `lines[2]` and the last line — hint at index 3 keeps it green), "EV-27 4" (footer last at every keystroke incl. no-match), and "EV-27 10" (zz → footer last) all still pass.

---

### Task 3: Driven key walk lock — the hint names the real exit (green from start) + full gates

**Files:**
- Modify: `test/model-picker.test.ts` (append walk test)

**Interfaces:**
- Consumes: `HEADER`, `NO_MATCH`, `NO_MATCH_HINT`, `FOOTER_MODEL` — the exact same walk shape as "EV-27 9" and "EV-27 8".

- [ ] **Step 1: Write the walk test**

This is a lock test (card Acceptance #4): the hint's key names must match real handler behavior. The handler behavior is pre-shipped (EV-27), so this test is green from the start — its job is proving the hint copy is true to the machine and catching any future divergence. Append at the end of `test/model-picker.test.ts`:

```ts
test("FLLWUP-13 2: the hint names the real walk — at zero-match, Down moves focus out, Esc ascends, search state dies", () => {
	const { p } = picker(CATALOGUE);
	p.handleInput(ENTER);
	p.handleInput(ENTER);
	p.handleInput("/");
	for (const ch of "zzzz") p.handleInput(ch);
	let lines = p.render(80).map(strip);
	expect(lines[2]).toBe(NO_MATCH("zzzz"));
	expect(lines[3]).toBe(NO_MATCH_HINT);
	// Down at zero rows: no crash; the row list stays empty; cursor clamps to
	// the empty range; FOOTER_MODEL still last.
	p.handleInput(DOWN);
	lines = p.render(80).map(strip);
	expect(lines[1]).toBe("▌ zzzz"); // search row unchanged
	expect(lines[2]).toBe(NO_MATCH("zzzz")); // still zero rows
	expect(lines[lines.length - 1]).toBe(FOOTER_MODEL);
	// Esc now ascends — if the input were still focused this would clear-and-stay
	// (EV-27 8) and the level would not drop; instead the level is 1, so the
	// Down did move focus out of the input (inputFocused false).
	p.handleInput(ESC);
	lines = p.render(80).map(strip);
	expect(lines[0]).toBe(HEADER);
	expect(lines[1].startsWith("> OpenRouter")).toBe(true); // ascended to provider
	expect(lines.join("\n")).not.toContain("\u258C"); // search state died with the level
	expect(lines.join("\n")).not.toContain(NO_MATCH_HINT);
	// fresh 1→2 re-entry carries no search residue (EV-27 12 mirror)
	p.handleInput(ENTER);
	lines = p.render(80).map(strip);
	expect(lines[1]).toBe("> openrouter/deepseek/deepseek-v4-pro-0813:off");
	expect(lines.join("\n")).not.toContain("\u258C");
});
```

- [ ] **Step 2: Run it**

Run: `bun test test/model-picker.test.ts`
Expected: GREEN — all three FLLWUP-13 tests pass along with the full file.

- [ ] **Step 3: Full gates, in order, each a hard stop-and-fix**

Run each from the worktree root; a failing gate means stop and fix before proceeding:

1. `bun install --frozen-lockfile` — expected exit 0, no lockfile change.
2. `bunx tsc --noEmit` — expected clean (strict).
3. `bun test` — expected full suite green (`541 pass`, `2 skip` baseline + 3 new tests).
4. `python3 council/validate.py` — expected clean.

- [ ] **Step 4: Commit, push, open PR**

```bash
git add docs/superpowers/plans/2026-09-05-FLLWUP-13-no-match-exit-hint.md
git commit -m "docs(superpowers): FLLWUP-13 no-match exit hint implementation plan"
git add extensions/model-picker.ts test/model-picker.test.ts
git commit -m "feat(model-picker): dim no-match exit hint naming the focus-out walk (FLLWUP-13)"
git push -u origin fllwup-13-no-match-exit-hint
gh pr create --base main --title "feat(model-picker): no-match exit hint (FLLWUP-13)" --body "..."
```

Verify before each completion claim: read the real output of every gate command (verification-before-completion).

## Self-Review

- **Spec coverage:** R-1 copy → Task 1 (byte-exact constant + lock test). R-1 placement (dim second line under literal, never a footer) → Task 2. Acceptance 1 → Task 2 render test. Acceptance 2 (byte-distinct from R-4 empties) → Task 1 constant test + Task 2 render assertions. Acceptance 3 (footer last) → Tasks 2/3. Acceptance 4 (key names match handlers) → Task 3 walk. NO_MATCH/FOOTER_MODEL/pre-press untouched → no edits outside the two named sites.
- **Placeholder scan:** every step carries its exact code and expected output; no TBDs.
- **Type consistency:** `NO_MATCH_HINT` is a `string` constant in all three tasks; the import block name matches the export name exactly.
- **Regression lookahead:** existing "EV-27 9" reads `lines[2]` + last line — the hint at index 3 keeps it green; "EV-27 4" and "EV-27 10" assert only the last line of no-match frames — green; "EV-27 12" reads indices 1–3 of a *matched* (2-row) frame — green; BUG-1 tests read indices 1–2 / last of non-no-match frames — green.