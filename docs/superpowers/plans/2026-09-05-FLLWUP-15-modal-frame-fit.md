# FLLWUP-15 — Search-mode modal frame fits the terminal at full window height

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the /council-models modal's search-mode model-rows window one row smaller (`maxRows - 1`) so search content keeps the same total height budget as the non-search frame, proven by a driven render test at the tightest height that is RED on the current code and GREEN after the fix.

**Architecture:** The `ModelPicker` component (extensions/model-picker.ts) owns the model-rows window via `windowStart()` (scroll centering) and `pushRows()` (row slice). The fix adds a single seam, `effectiveMaxRows()`, that returns `maxRows - 1` only when the picker is at the model level (level 2) with search active; `windowStart()` and `pushRows()` both read it, so window math stays consistent and non-search rendering is bit-for-bit unchanged. No copy, styling, or frame code changes.

**Tech Stack:** TypeScript, bun:test, pi-tui theme tokens via existing FAKE_THEME test pattern.

**Spec:** No spec file — the card FLLWUP-15 (verbatim in the card handoff) plus the orchestrator binding constraints:
- Constraint 1: BUG-1 (c1406138) added `PRE_SEARCH_HINT = "press / to filter models"` below the model rows; FLLWUP-13 (b66bc8f) added `NO_MATCH_HINT = "↓ then esc exits search"` to the no-match region. The zero-match frame now carries two ruled hint lines.
- Constraint 2: the `maxRows - 1` fix applies to the MODEL-ROWS WINDOW only, never fixed chrome. The driven test must verify the frame fits at the tightest height (`termRows = Math.max(10, rows)`) in ALL search-mode render branches — rows present AND the zero-match branch with its two hint lines — or scope the card and name a follow-up. Hiding the interaction is not allowed.
- Constraint 3: Phase 1 rulings byte-exact and untouched: `No models matching "<query>".`; `↓ then esc exits search`; `press / to filter models`; `▌` (U+258C) in NO non-search state; ruled footers byte-exact. This change alters NO copy, NO styling token, NO ruler footer — only model-row window sizing in search mode.

## Global Constraints

- Non-search rendering at every height is byte-identical to the pre-change suite (acceptance 2).
- With search active at full height, exactly one fewer model row is visible than in the non-search case; selection/clamping still reaches every filtered row by scrolling (acceptance 3).
- The selection emits byte-verbatim `qualifiedId` + `:level` — the window shrink must never change emitted tuples or `resolveSelection()`.
- Fix shape applies to `windowStart()` and `pushRows()` TOGETHER — one seam, no divergence.
- Full tracked gates, in order: `bun install --frozen-lockfile`, `bunx tsc --noEmit`, `bun test`, `python3 council/validate.py`. Authoritative gate record: `.github/workflows/gates.yml` (this repo has no docs/gates/GATE-EVIDENCE.md).
- Conventional Commits; worktree `.worktrees/fllwup-15-modal-frame-fit` at origin/main; no history rewriting.

## First-hand geometry (facilitator probe, reproduced at origin/main head)

- `openModelPicker` (extensions/council-models.ts:140-146) wires `new ModelPicker(..., { maxRows: termRows - 2 })` and `withModalFrame(theme, w, termRows, picker.render(...), { maxPanelHeight: termRows - 2 })`.
- `withModalFrame` (extensions/navigator.ts:91-122): `panelHeight = min(content.length + 2, maxPanelHeight)`; `shown = content.slice(0, panelHeight - 2)` — a tail-clip to `termRows - 4` lines. The frame's bottom border is always present (vacuous pre-fix).
- At termRows 10 / maxRows 8 with a full filtered window: search content = 11 lines (header, search row, 8 windowed rows, FOOTER_MODEL); `maxRows - 1` makes it 10 with 7 windowed rows (parity with the non-search budget; one fewer model row).
- Zero-match search content = 5 fixed lines (header, search row, NO_MATCH, NO_MATCH_HINT, FOOTER_MODEL); capacity `termRows - 4 = 6` → already fits fully; bottom border at row 7 of 10. Needs its own branch in the driven test; needs no fix.
- The tail-clip mask makes framed output byte-identical pre/post at heights where the window is full — the assertable RED→GREEN deltas are the MECHANISM (windowed row count 8→7, content 11→10), per the facilitator's binding note. Zero-match and frame-fit assertions pin the fence; they are green on both sides.

---

### Task 1: Failing driven-render tests for the search-mode window shrink (RED)

**Files:**
- Modify: `test/model-picker.test.ts` (append a new `// ---- FLLWUP-15 ...` section)
- Test: `test/model-picker.test.ts`

**Interfaces:**
- Consumes: existing `picker()`, `entry()`, `strip()`, `FAKE_THEME`, `CATALOGUE`, `filterModelRows`, `rowsForProvider`, and the key constants (`HEADER`, `FOOTER_MODEL`, `PRE_SEARCH_HINT`, `NO_MATCH`, `NO_MATCH_HINT`) already exported from `../extensions/model-picker.ts`; `withModalFrame` from `../extensions/navigator.ts` (new import).
- Produces: the four FLLWUP-15 test cases (window-shift at tightest height, zero-match full fit, scroll-to-tail reachability, height sweep non-search byte-parity).

- [ ] **Step 1: Add the `withModalFrame` import to the test file.**

At the top of `test/model-picker.test.ts`, after the existing `import { ModelPicker, ... }` block:

```ts
import { withModalFrame } from "../extensions/navigator.ts";
```

- [ ] **Step 2: Add the FLLWUP-15 test section** (append at the end of the file):

```ts
// ---- FLLWUP-15 search-mode model-window shrink (EPIC-6 mechanical path) ----
// Driven at the tightest height with openModelPicker's exact wiring: picker
// maxRows = termRows - 2, withModalFrame maxPanelHeight = termRows - 2
// (extensions/council-models.ts openModelPicker).

function wiredPicker(nModels: number, termRows: number) {
	const models: ModelEntry[] = [];
	for (let i = 0; i < nModels; i++) {
		const id = `p/m${String(i).padStart(2, "0")}`;
		models.push(entry(id, ["low", "high"])); // qualifiedId = id
	}
	const catalogue: ResolverResult = {
		seats: [{ name: "owner", hasOverride: false, currentModel: "a/x" }],
		providers: [{ provider: "p", displayName: "Provider P", models }],
	};
	return { catalogue, ...picker(catalogue, termRows - 2) };
}

test("FLLWUP-15 1: at the tightest height search owns exactly one fewer model window row than non-search; content is the ruled chrome + (maxRows-1) rows", () => {
	const termRows = 10; // Math.max(10, rows) — the tightest height
	const { p } = wiredPicker(50, termRows);
	p.handleInput(ENTER); // seat → provider
	p.handleInput(ENTER); // provider → model (non-search, hint armed)
	const nonSearch = p.render(80).map(strip);
	// non-search window is exactly maxRows = termRows - 2 — the shrink never leaks
	expect(nonSearch.filter((l) => l.startsWith("> ") || l.startsWith("  "))).toHaveLength(termRows - 2);
	expect(nonSearch[0]).toBe(HEADER);
	expect(nonSearch[nonSearch.length - 2]).toBe(PRE_SEARCH_HINT);
	expect(nonSearch[nonSearch.length - 1]).toBe(FOOTER_MODEL);

	p.handleInput("/");
	for (const ch of "m0") p.handleInput(ch); // 20 filtered rows — window full
	const search = p.render(80).map(strip);
	const searchRows = search.filter((l) => l.startsWith("> ") || l.startsWith("  "));
	// RED pre-fix: 8 windowed rows / 11 content lines → GREEN post-fix: 7 / 10
	expect(searchRows).toHaveLength(termRows - 3); // exactly one fewer than non-search's maxRows
	expect(search).toHaveLength(searchRows.length + 3); // header + search row + rows + footer
	expect(search[0]).toBe(HEADER);
	expect(search[1]).toBe("▌ m0");
	expect(search[search.length - 1]).toBe(FOOTER_MODEL);

	// card acceptance (letter): the frame's bottom border line is present at the
	// tightest height with search active. Green on both sides — the teeth are the
	// windowed-row count above (per the EPIC-6 facilitator probe).
	const framed = withModalFrame(FAKE_THEME, 80, termRows, search, { maxPanelHeight: termRows - 2 }).map(strip);
	expect(framed).toHaveLength(termRows);
	expect(framed.filter((l) => l.includes("└") || l.includes("┘"))).toHaveLength(1);
});

test("FLLWUP-15 2: zero-match branch at the tightest height fits fully in the frame — both ruled hint lines, the ruled footer, and the bottom border are present", () => {
	const termRows = 10;
	const { p } = wiredPicker(50, termRows);
	p.handleInput(ENTER);
	p.handleInput(ENTER);
	p.handleInput("/");
	for (const ch of "zzzz") p.handleInput(ch);
	const content = p.render(80).map(strip);
	expect(content).toEqual([HEADER, "▌ zzzz", NO_MATCH("zzzz"), NO_MATCH_HINT, FOOTER_MODEL]); // 5 fixed lines
	const framed = withModalFrame(FAKE_THEME, 80, termRows, content, { maxPanelHeight: termRows - 2 }).map(strip);
	const joined = framed.join("\n");
	expect(joined).toContain(NO_MATCH("zzzz")); // no tail-clip — content fits
	expect(joined).toContain(NO_MATCH_HINT); // the FLLWUP-13 ruled exit hint fits
	expect(joined).toContain(FOOTER_MODEL); // the ruled footer fits
	expect(framed.filter((l) => l.includes("└") || l.includes("┘"))).toHaveLength(1); // bottom border present
});

test("FLLWUP-15 3: with the shrunk search window, Down still reaches every filtered row by scrolling and Enter picks the last one", () => {
	const termRows = 10;
	const { p, confirmed } = wiredPicker(50, termRows);
	p.handleInput(ENTER);
	p.handleInput(ENTER);
	p.handleInput("/");
	for (const ch of "m") p.handleInput(ch); // 100 filtered rows — far past the 7-row window
	for (let i = 0; i < 200; i++) p.handleInput(DOWN); // past the tail — clamps
	const lines = p.render(80).map(strip);
	expect(lines.filter((l) => l.startsWith("> ") || l.startsWith("  "))[0]).toBe("> p/m49:high"); // window scrolled to the tail
	p.handleInput(ENTER); // confirm
	expect(p.resolveSelection()).toEqual({ seat: "owner", model: "p/m49", thinking: "high" });
	p.handleInput(ENTER);
	expect(confirmed).toEqual([{ seat: "owner", model: "p/m49", thinking: "high" }]);
});

test("FLLWUP-15 4: non-search rendering is byte-identical at every height — the window shrink touches search only", () => {
	for (const termRows of [10, 12, 16, 24, 40]) {
		const { p, catalogue } = wiredPicker(50, termRows);
		p.handleInput(ENTER);
		p.handleInput(ENTER);
		const lines = p.render(80).map(strip);
		const window = Math.min(termRows - 2, 100);
		const expectedRows = rowsForProvider(catalogue.providers[0]!)
			.slice(0, window)
			.map((r, i) => (i === 0 ? "> " : "  ") + r.model.qualifiedId + (r.level === undefined ? "" : `:${r.level}`));
		expect(lines).toEqual([HEADER, ...expectedRows, PRE_SEARCH_HINT, FOOTER_MODEL]); // pre-change bytes, untouched

		const q = wiredPicker(50, termRows);
		q.p.handleInput(ENTER);
		q.p.handleInput(ENTER);
		q.p.handleInput("/");
		for (const ch of "m") q.p.handleInput(ch); // 100 filtered rows
		const sRows = q.p.render(80).map(strip).filter((l) => l.startsWith("> ") || l.startsWith("  "));
		expect(sRows).toHaveLength(Math.min(termRows - 3, 100)); // RED pre-fix: termRows - 2
	}
});
```

- [ ] **Step 3: Run the new tests, verifying RED.**

Run: `bun test test/model-picker.test.ts -t "FLLWUP-15" -v`
Expected: FAIL — `FLLWUP-15 1` and `FLLWUP-15 4` fail on the search-window count (`expected 7 ... received 8` and `expected 9...received 10` etc.); `FLLWUP-15 2` and `FLLWUP-15 3` pass (pins, green on both sides).

- [ ] **Step 4: Commit the failing tests.**

```bash
git add test/model-picker.test.ts
git commit -m "test(model-picker): FLLWUP-15 search-mode window shrink driven tests (RED)"
```

---

### Task 2: Implement `effectiveMaxRows()` — search-mode window shrink (GREEN)

**Files:**
- Modify: `extensions/model-picker.ts` (add `effectiveMaxRows()`; route `windowStart()` and `pushRows()` through it)

**Interfaces:**
- Consumes: `this.level`, `this.searchActive`, `this.maxRows` (existing fields).
- Produces: `private effectiveMaxRows(): number` — `maxRows - 1` at level 2 with search active, else `maxRows`. Consumed by `windowStart()` (scroll centering) and `pushRows()` (row slice). Signature/cache keying unchanged (searchActive and windowStart are already in the signature).

- [ ] **Step 1: Add the seam method.** Insert after `windowStart()` (or directly before it) in the class body:

```ts
/** FLLWUP-15: the model-rows window is one row smaller while the search
 *  input is open at the model level (maxRows - 1), so the search row +
 *  the ruled footer keep the same content-height budget as the non-search
 *  frame — with a full window, search renders exactly one fewer model row
 *  than non-search. Fixed chrome (header/search row/footer) is never touched,
 *  and the shrink never applies outside level 2 with search active. */
private effectiveMaxRows(): number {
	return this.level === 2 && this.searchActive ? Math.max(1, this.maxRows - 1) : this.maxRows;
}
```

- [ ] **Step 2: Route `windowStart()` through the seam.**

```ts
/** §2 windowed scrolling: start = max(0, min(sel - floor((maxRows-1)/2), len - maxRows)). */
private windowStart(): number {
	const len = this.currentRows().length;
	const window = this.effectiveMaxRows();
	if (len <= window) return 0;
	const selected = this.currentIndex();
	return Math.max(0, Math.min(selected - Math.floor((window - 1) / 2), len - window));
}
```

- [ ] **Step 3: Route `pushRows()` through the seam** (the slice length line only):

```ts
const windowed = rows.slice(start, start + Math.min(this.effectiveMaxRows(), rows.length));
```

- [ ] **Step 4: Run the FLLWUP-15 tests, verifying GREEN.**

Run: `bun test test/model-picker.test.ts -t "FLLWUP-15" -v`
Expected: PASS — 4/4 (mechanism tests now 7 rows / 10 lines at the tightest height).

- [ ] **Step 5: Run the whole model-picker suite (non-search byte-parity guard).**

Run: `bun test test/model-picker.test.ts`
Expected: PASS — every pre-existing test untouched-identical (acceptance 2: non-search renders byte-equal to the pre-change suite).

- [ ] **Step 6: Commit.**

```bash
git add extensions/model-picker.ts
git commit -m "fix(model-picker): shrink the model-rows window by one in search mode (FLLWUP-15)"
```

---

### Task 3: Full gate run, push, PR

- [ ] **Step 1: `bun install --frozen-lockfile`** — expect exit 0.
- [ ] **Step 2: `bunx tsc --noEmit`** — expect clean.
- [ ] **Step 3: `bun test`** — expect whole suite green (2 env-dependent skips).
- [ ] **Step 4: `python3 council/validate.py`** — expect "All council artifacts valid".
- [ ] **Step 5: Push + PR.**

```bash
git push -u origin fllwup-15-modal-frame-fit
# open PR: base main, head fllwup-15-modal-frame-fit (worktree branch)
```

- [ ] **Step 6: Record** worktree path, branch, PR number + head SHA, RED→GREEN evidence (test output), gate results, and the scoping note (tail-clip seam: the footer is clipped from the frame by withModalFrame's existing tail-clip whenever the window is full, in both search and non-search branches at tight heights; the card's fix restores the search budget to parity — one fewer windowed row — and the zero-match branch already fits fully with both ruled hint lines).