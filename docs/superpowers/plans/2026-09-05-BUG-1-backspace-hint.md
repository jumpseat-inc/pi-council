# BUG-1: Backspace deletion + first-use `/` filter hint in `/council-models` — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give `\x7f` (backspace) its ordinary meaning in the model search input — delete the last query character and recompute the filtered rows while the input stays focused — and render a first-use hint line (`press / to filter models`) below the model rows before any `/` press (card BUG-1, epic EPIC-6).

**Architecture:** Two local changes to the `ModelPicker` component in `extensions/model-picker.ts`. (1) In the EV-27 search-mode interception block, replace the guard-only backspace no-op with a delete-one handler: `matchesKey(data, Key.backspace)` (which covers `\x7f`, `\x08`, kitty `\x1b[127u`, and the modify-other-keys form of 127 — verified in `@earendil-works/pi-tui` `dist/keys.js:728-749`) → if `inputFocused` and `query !== ""`, `query = query.slice(0, -1)`, re-clamp `modelIndex` into the recomputed filtered set (`currentRows()` → `filterModelRows`), clear the render cache; no-op otherwise. (2) A per-model-entry flag `searchHint` (initial `true`, reset `true` at every 1→2 entry, set `false` at the fall-through `/` trigger): the plain non-search model frame renders rows, then the dim hint line, then the byte-exact `FOOTER_MODEL`. `signature()` gains the flag so no hint-state flip can serve a stale cached frame. Only `extensions/model-picker.ts` and `test/model-picker.test.ts` change.

**Tech Stack:** TypeScript (strict), bun + bun:test. No new dependencies. `matchesKey("\x7f", Key.backspace) === true` and `matchesKey("\x1b[127u", Key.backspace) === true` verified against pi-tui source.

**Spec:** Mechanical-path card — `council/cards/BUG-1.md` IS the spec (no spec file exists). Binding rulings on the card face: R-1 (pre-press hint placement — line below the model rows at the model level, only while search has never been opened in the current modal-open, no `▌`, not a footer), R-2 (copy `press / to filter models`, byte-exact), R-3 (dismissal — stops at the first `/` press in the current modal-open, returns on the next fresh entry to the model level, no session-scoped persistence). EPIC-6 R-1 (`No models matching "<query>".`) is restated as NOT touched. Folded FLLWUP-12 pins: `\x7f` deletes one trailing char iff non-empty query AND input focus; empty query and unfocused stay no-ops; every other control byte keeps its behavior.

## Global Constraints

- Single seam: `extensions/model-picker.ts`, the `ModelPicker` component only. Do NOT touch `extensions/council-models.ts`, `extensions/navigator.ts`, `council/board.md`, `council/cards/*.md` (the orchestrator owns board bookkeeping — the uncommitted Step-8 note on main is theirs, never commit it), or any file outside the seam. Do NOT modify `resolveSelection`'s emitted tuple shape, `HEADER`, the three footer strings, `seatMarker`, `echoFor`, `footerFor`, `rowsForProvider`, `filterModelRows`, the two R-4 empty states, `SEARCH_HINT`, `SEARCH_ROW_EMPTY`, or `NO_MATCH`.
- Ruled copy is byte-exact and immutable: new hint line = `press / to filter models` (R-2); model footer stays `↑/↓ move · enter select · esc back` as the LAST line of every non-search model frame; zero-match copy `No models matching "<query>".` unchanged.
- The hint is NOT a footer and carries NO `▌` (U+258C): the four-footer exhaustiveness rule (8.9) still holds — the last line of every frame is one of the four R-2 footers.
- `matchesKey(data, Key.backspace)` is the single backspace gate (covers `\x7f`, `\x08`, kitty `\x1b[127u`, modify-other-keys 127) and MUST run before `decodePrintable` — kitty DEL decodes to `\x7f`. The `\x1b[3~` Delete key is NOT backspace and stays a no-op.
- `modelIndex` re-clamps into the recomputed filtered set after EVERY query mutation (append, clear, and now delete-one). Esc-clear (clear-all, stay focused) is unchanged; Enter/Up/Down/Esc routing is unchanged; 1→2 re-entry resets search state AND re-arms the hint (R-3); ascent from level 2 lets search state die with the level.
- `signature()` encodes every frame-affecting bit (EV-27 cache lesson): `level:cursors:top:search:focus:hint:query` — the hint flag joins the two focus bits; query stays last (uniqueness by construction, full-string equality).
- Token-only rendering (AGENTS.md 9.6): only `theme.fg`/`theme.bold` — no ANSI literals, no hex literals (source audits 8.1/8.12 keep passing).
- TDD: new behavior needs a failing test first; suite green per task (pre-existing 2 skips are the env-dependent integration suite — do not disturb).
- Commits MUST be Conventional Commits (`feat(model-picker): ...`); no history rewriting; never work on `main`; ignore the hollowed `.worktrees/feat-bug-1-backspace-hint` husk (0-byte debris, unregistered — not prior work).
- Gates, in order, none lowered: `bun install --frozen-lockfile` (exit 0), `bunx tsc --noEmit` (exit 0), `bun test` (whole suite green; 2 skips expected), `python3 council/validate.py` ("All council artifacts valid").
- Out of scope (do NOT do): anything beyond the seam; any `council/` edit; footer copy changes; session-scoped hint persistence; changing `filterModelRows`'s contract.

---

### Task 1: Backspace deletes one trailing character under the two-bit focus machine

**Files:**
- Modify: `extensions/model-picker.ts`
- Modify: `test/model-picker.test.ts`

**Interfaces:**
- Consumes: EV-27 `decodePrintable`, the `searchActive`/`inputFocused`/`query` fields, `currentRows()` level-2 filter branch (`filterModelRows(rowsForProvider(group), query)`), `clamp`, `matchesKey`/`Key`.
- Produces: the delete-one backspace handler inside the search-mode interception block (replacing the guard-only no-op). Later tasks rely on: backspace keeps `inputFocused` untouched; every query mutation re-clamps `modelIndex`; the guard stays before `decodePrintable`.

- [ ] **Step 1: Write the failing tests**

Add `filterModelRows` and `rowsForProvider` to the import block from `../extensions/model-picker.ts`, replace the EV-27 7 test body (its assertions invert — backspace now deletes), and append two new tests:

```ts
test("BUG-1 1: \x7f with a non-empty query and focus in the input deletes exactly one trailing char; the filtered list recomputes through filterModelRows; focus stays", () => {
	const { p } = picker(CATALOGUE);
	p.handleInput(ENTER); // provider
	p.handleInput(ENTER); // model
	p.handleInput("/");
	for (const ch of "claude") p.handleInput(ch);
	expect(strip(p.render(80)[1])).toBe("▌ claude");
	// one backspace → "claud"
	p.handleInput("\x7f");
	const lines = p.render(80).map(strip);
	expect(lines[1]).toBe("▌ claud");
	// the filtered list recomputed through the filterModelRows seam — the rendered
	// row list equals a direct filterModelRows call for the post-backspace query
	const expected = filterModelRows(rowsForProvider(CATALOGUE.providers[0]), "claud").map(
		(r) => r.model.qualifiedId + (r.level === undefined ? "" : `:${r.level}`),
	);
	const rendered = lines
		.filter((l) => l.startsWith("> ") || l.startsWith("  "))
		.map((l) => l.slice(2));
	expect(rendered).toEqual(expected);
	expect(lines[lines.length - 1]).toBe(FOOTER_MODEL);
	// focus stayed in the input: the next printable appends to the query
	p.handleInput("e"); // → "claude"
	expect(strip(p.render(80)[1])).toBe("▌ claude");
	// and Esc still means clear-and-stay (focused), never ascend
	p.handleInput(ESC);
	expect(strip(p.render(80)[1])).toBe(SEARCH_ROW_EMPTY);
});

test("EV-27 7: backspace deletes — bare \x7f and kitty \x1b[127u both drop one char (BUG-1)", () => {
	const { p } = picker(CATALOGUE);
	p.handleInput(ENTER);
	p.handleInput(ENTER);
	p.handleInput("/");
	for (const ch of "claude") p.handleInput(ch);
	p.handleInput("\x7f");
	expect(strip(p.render(80)[1])).toBe("▌ claud");
	p.handleInput("\x1b[127u"); // kitty DEL — the same key in kitty encoding
	expect(strip(p.render(80)[1])).toBe("▌ clau");
});

test("BUG-1 3: \x7f on an empty query and \x7f while unfocused stay no-ops; other control bytes keep their behavior", () => {
	// empty query: backspace does nothing; search mode (and the empty hint) stays
	const empty = picker(CATALOGUE);
	empty.p.handleInput(ENTER);
	empty.p.handleInput(ENTER);
	empty.p.handleInput("/");
	empty.p.handleInput("\x7f");
	expect(strip(empty.p.render(80)[1])).toBe(SEARCH_ROW_EMPTY);
	// unfocused: Down takes focus out; backspace must not enter the input or touch the query
	const unfocused = picker(CATALOGUE);
	unfocused.p.handleInput(ENTER);
	unfocused.p.handleInput(ENTER);
	unfocused.p.handleInput("/");
	for (const ch of "claude") unfocused.p.handleInput(ch);
	unfocused.p.handleInput(DOWN); // cursor → row 1, focus out
	unfocused.p.handleInput("\x7f");
	let lines = unfocused.p.render(80).map(strip);
	expect(lines[1]).toBe("▌ claude"); // query untouched
	expect(lines[2]).toBe("  openrouter/alias/claude-sonnet:off"); // cursor still on row 1
	// the forward Delete key (\x1b[3~) is NOT backspace — stays a no-op
	unfocused.p.handleInput("\x1b[3~");
	lines = unfocused.p.render(80).map(strip);
	expect(lines[1]).toBe("▌ claude");
	// and per BUG-1 1's focus proof: an Esc while unfocused ascends (unchanged) —
	// backspace never granted focus
	unfocused.p.handleInput(ESC);
	expect(strip(unfocused.p.render(80)[1]).startsWith("> OpenRouter")).toBe(true);
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `bun test test/model-picker.test.ts -t "BUG-1\|EV-27 7"`
Expected: FAIL — backspace is still a guard-only no-op, so `lines[1]` stays `▌ claude` where BUG-1 1 and 7 expect `▌ claud`/`▌ clau`; the empty/unfocused/Delete-key pins fail against the real bytes only if behavior is wrong (they should pass once the guard is no longer a no-op — empty/unfocused/`\x1b[3~` must remain no-ops; the `\x1b[127u` arm must delete). Confirm each failure is the "backspace does nothing" kind, not an import typo.

- [ ] **Step 3: Implement**

Replace the guard-only no-op in `handleInput`'s search-mode interception block (currently `// Backspace is a guard-only no-op — Esc-clear is the sole deletion.`):

```ts
		if (this.level === 2 && this.searchActive) {
			// BUG-1: backspace deletes one trailing query char when the input is
			// focused on a non-empty query; no-op on an empty query or focus-out.
			// Guarded BEFORE decodePrintable — kitty DEL (`\x1b[127u`) decodes to
			// "\x7f" — and matchesKey covers `\x7f`, `\x08` (non-Windows), kitty
			// `\x1b[127u`, and the modify-other-keys form of 127. Focus is kept
			// (inputFocused untouched); Esc-clear stays the clear-all path.
			if (matchesKey(data, Key.backspace)) {
				if (this.inputFocused && this.query !== "") {
					this.query = this.query.slice(0, -1);
					this.modelIndex = clamp(this.modelIndex, 0, this.currentRows().length - 1);
					this.cached = undefined;
				}
				return;
			}
			if (matchesKey(data, Key.escape)) {
```

- [ ] **Step 4: Run to verify they pass**

Run: `bun test test/model-picker.test.ts`
Expected: PASS — BUG-1 1 / EV-27 7 / BUG-1 3 green (delete-one, both byte forms, all pins), and the pre-existing 8.x + EV-27 suite untouched-green (Esc/Enter/Up/Down routing, cache distinctness, no-match, B-7 round-trip all unchanged).

- [ ] **Step 5: Commit**

```bash
git add extensions/model-picker.ts test/model-picker.test.ts
git commit -m "feat(model-picker): backspace deletes one trailing query char in the search input (BUG-1)"
```

---

### Task 2: First-use `/` filter hint (R-1 placement, R-2 copy, R-3 dismissal)

**Files:**
- Modify: `extensions/model-picker.ts`
- Modify: `test/model-picker.test.ts`

**Interfaces:**
- Consumes: Task 1's interception block; the plain non-search model frame in `render()`; the fall-through `/` trigger; the 1→2 re-entry reset in the Enter branch; `signature()`.
- Produces: exported `PRE_SEARCH_HINT: string` (`"press / to filter models"`); class field `searchHint: boolean` (initial `true`; reset `true` at 1→2 entry; set `false` at the `/` trigger); the dim hint line in the non-search model frame between rows and footer; the hint bit in `signature()`.

- [ ] **Step 1: Write the failing tests**

Add `PRE_SEARCH_HINT` to the import block, update the now-stale footer index in the 8.4 windowing test (the hint pushes the footer down one line in non-search model frames), and append two tests:

```ts
		// in 8.4 windowing, the xai frame (1 row, maxRows 2) becomes:
		lines = p.render(80).map(strip);
		expect(lines[1]).toBe("> xai/grok/v1");
		expect(lines[2]).toBe(PRE_SEARCH_HINT); // BUG-1 R-1: hint between rows and footer
		expect(lines[lines.length - 1]).toBe(FOOTER_MODEL); // footer stays last, byte-exact
```

```ts
test("BUG-1 2: before any `/` press, the first model-level render of a fresh picker shows the R-2 hint below the rows, above the byte-exact footer", () => {
	expect(PRE_SEARCH_HINT).toBe("press / to filter models"); // R-2 byte-exact literal
	const { p } = picker(CATALOGUE);
	p.handleInput(ENTER); // provider
	p.handleInput(ENTER); // model — first model-level render of a fresh picker
	const lines = p.render(80).map(strip);
	expect(lines[lines.length - 1]).toBe(FOOTER_MODEL); // ruled footer last, byte-exact (not a hint footer)
	expect(lines[lines.length - 2]).toBe(PRE_SEARCH_HINT); // hint directly below the rows
	expect(lines[1].startsWith("> ")).toBe(true); // rows still start right under the header
	expect(lines.join("\n")).not.toContain("\u258C"); // R-1: no ▌ focus signifier in non-search frames
	// persists across re-renders while search has never been opened
	expect(p.render(80).map(strip)).toContain(PRE_SEARCH_HINT);
});

test("BUG-1 4: R-3 dismissal — hint stops at the first `/` press, returns on the next fresh entry to the model level", () => {
	const { p } = picker(CATALOGUE);
	p.handleInput(ENTER);
	p.handleInput(ENTER);
	expect(p.render(80).map(strip)).toContain(PRE_SEARCH_HINT);
	p.handleInput("/"); // first `/` press — hint is gone
	expect(p.render(80).map(strip).join("\n")).not.toContain(PRE_SEARCH_HINT);
	p.handleInput(ESC); // clear, stay focused — hint does not return mid-entry
	expect(p.render(80).map(strip).join("\n")).not.toContain(PRE_SEARCH_HINT);
	p.handleInput(DOWN); // focus out
	p.handleInput(ESC); // ascend to provider — search state dies with the level
	p.handleInput(ENTER); // fresh 1→2 entry — hint returns (R-3)
	const lines = p.render(80).map(strip);
	expect(lines).toContain(PRE_SEARCH_HINT);
	expect(lines[lines.length - 1]).toBe(FOOTER_MODEL);
	// no session-scoped persistence: a brand-new picker starts with the hint armed
	const q = picker(CATALOGUE);
	q.p.handleInput(ENTER);
	q.p.handleInput(ENTER);
	expect(q.p.render(80).map(strip)).toContain(PRE_SEARCH_HINT);
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `bun test test/model-picker.test.ts -t "BUG-1\|8.4 keys: windowing"`
Expected: FAIL — `PRE_SEARCH_HINT` is not exported (import error); the hint never renders, so BUG-1 2's placement assertions and BUG-1 4's dismissal walk fail; the updated 8.4 assertion fails (`lines[2]` is still `FOOTER_MODEL`, not the hint).

- [ ] **Step 3: Implement**

(a) Add the ruled constant next to the other R-copy exports (after `NO_MATCH`):

```ts
/** BUG-1 R-2 ruled pre-press hint — byte-exact, immutable. */
export const PRE_SEARCH_HINT = "press / to filter models";
```

(b) Add the per-model-entry flag next to the focus-machine fields:

```ts
	private searchActive = false;
	private query = "";
	private inputFocused = false;
	private searchHint = true; // BUG-1 R-3: armed while this model-level entry has never seen a `/` press
```

(c) Extend `signature()` — the hint bit joins the two focus bits (query stays last):

```ts
	private signature(): string {
		return `${this.level}:${this.seatIndex}:${this.providerIndex}:${this.modelIndex}:${this.windowStart()}:${this.searchActive ? 1 : 0}:${this.inputFocused ? 1 : 0}:${this.searchHint ? 1 : 0}:${this.query}`;
	}
```

(d) Render the hint in the plain non-search model frame (rows → hint → footer); the footer stays the last line:

```ts
		} else if (this.searchActive) {
			lines.push(this.searchRow(width));
			this.pushRows(width, lines, this.currentRows(), false);
			lines.push(this.theme.fg("dim", FOOTER_MODEL));
		} else {
			this.pushRows(width, lines, this.currentRows(), false);
			if (this.searchHint) lines.push(this.theme.fg("dim", PRE_SEARCH_HINT));
			lines.push(this.theme.fg("dim", FOOTER_MODEL));
		}
```

(e) Dismiss at the first `/` press — in the fall-through trigger, alongside opening search:

```ts
		if (this.level === 2 && !this.searchActive && decodePrintable(data) === "/") {
			const group = this.catalogue.providers[this.providerIndex];
			if (group && group.models.length > 0) {
				this.searchActive = true;
				this.inputFocused = true;
				this.searchHint = false; // BUG-1 R-3: first `/` press dismisses the hint for this entry
				this.cached = undefined;
				return;
			}
		}
```

(f) Re-arm on the next fresh entry — in the Enter branch's `else if (this.level === 1)` arm:

```ts
		} else if (this.level === 1) {
			this.modelIndex = 0;
			this.level = 2;
			this.searchActive = false;
			this.query = "";
			this.inputFocused = false;
			this.searchHint = true; // BUG-1 R-3: fresh entry re-arms the hint
		}
```

- [ ] **Step 4: Run to verify they pass**

Run: `bun test test/model-picker.test.ts`
Expected: PASS — BUG-1 2 / BUG-1 4 green (placement, copy, dismissal, return, no-persistence), the updated 8.4 green, and everything else untouched-green (8.9 four-footer still holds — the hint is never the last line; 8.8/13 keep asserting no `▌` in non-search frames).

- [ ] **Step 5: Commit**

```bash
git add extensions/model-picker.ts test/model-picker.test.ts
git commit -m "feat(model-picker): first-use / filter hint below the model rows (BUG-1 R-1/R-2/R-3)"
```

---

### Task 3: Clear all four gates in order

- [ ] **Step 1: Gate 1 — frozen install**

Run: `bun install --frozen-lockfile`
Expected: exit 0, no lockfile diff (`git status --short` shows no `bun.lock` change).

- [ ] **Step 2: Gate 2 — typecheck**

Run: `bunx tsc --noEmit`
Expected: exit 0, no output.

- [ ] **Step 3: Gate 3 — whole test suite**

Run: `bun test`
Expected: whole suite green; the 2 pre-existing skips (env-dependent integration suite) remain skipped; record the real pass/skip/fail counts. Also confirm `git status --short` shows only the intended changes (no scratch files).

- [ ] **Step 4: Gate 4 — council artifacts**

Run: `python3 council/validate.py`
Expected: prints `All council artifacts valid`, exit 0. (Diff doesn't touch `council/`, so this must hold from the clean base.)

---

### Task 4: Push the branch and open the PR

- [ ] **Step 1:** Confirm the diff touches only `extensions/model-picker.ts`, `test/model-picker.test.ts`, and the plan file:

```bash
git status --short
git diff main --stat
```

- [ ] **Step 2:** Push and open the PR:

```bash
git push -u origin feat/bug-1-backspace-hint
gh pr create --base main --head feat/bug-1-backspace-hint \
  --title "feat(model-picker): backspace deletion + first-use / filter hint (BUG-1)" \
  --body "Implements card BUG-1 (epic EPIC-6) — backspace now deletes one trailing query character in the /council-models search input (no-op on empty query or focus-out; kitty \x1b[127u covered; all other keys unchanged), and a first-use hint line \`press / to filter models\` renders below the model rows until the first / press, re-arming on the next fresh entry to the model level (phase-1 rulings R-1/R-2/R-3)."
```

- [ ] **Step 3:** Record branch name, PR number, and exact head SHA (`git rev-parse HEAD`). Do NOT poll CI. Report the four gates' real output (not summaries) plus the driven-test evidence per acceptance clause in the final report.