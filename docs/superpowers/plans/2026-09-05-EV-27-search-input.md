# EV-27: `/`-triggered search input in the model selection modal — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `/`-triggered, Esc-clearable search input to the model level (`level 2`) of `ModelPicker`, filtering the J-2 cross-product rows by case-insensitive `qualifiedId` substring (EV-27).

**Architecture:** Three level-2-local fields on `ModelPicker` (`searchActive`, `query`, `inputFocused`). At level 2, `currentRows()` becomes the single row source: `searchActive ? filterModelRows(rowsForProvider(group), query) : rowsForProvider(group)` — so windowing, Up/Down clamps, the Enter guard, the Enter-pick, and `resolveSelection()` all read one filtered list and the byte-verbatim tuple holds by `PickRow` reference identity. `handleInput` gains a search-mode interception block (backspace guard → printable append → Esc-routes-on-focus) before the existing key handling, plus a fall-through `/` trigger. `render()` draws the search row (`▌ ` + hint-or-query) between header and rows, an explicit dim `FOOTER_MODEL` in every search frame, and a no-match third branch. `signature()` carries search state (query last) so no keystroke serves a stale frame. Builds on EV-26's merged `filterModelRows`; only `extensions/model-picker.ts` and `test/model-picker.test.ts` change.

**Tech Stack:** TypeScript (strict), bun + bun:test. No new dependencies. `decodeKittyPrintable` verified exported from `@earendil-works/pi-tui` root (`dist/index.d.ts:21`); `Key`/`matchesKey` verified (`matchesKey("\x7f", Key.backspace) === true`, incl. kitty `\x1b[127u`).

**Spec:** `docs/superpowers/specs/2026-09-05-EV-27-design.md` — the settled design contract, byte-exact binding. Ruled copy immutable: R-1 hint `▌ / filter · esc clears`; EPIC-6 R-1 no-match `No models matching "<query>".`.

## Global Constraints

- Single seam: `extensions/model-picker.ts`, the `ModelPicker` component only. Do NOT touch `extensions/council-models.ts` (wiring), `extensions/navigator.ts`, `council/board.md`, `council/cards/*.md`, or any file outside the seam. Do NOT modify `resolveSelection`'s emitted tuple shape, `HEADER`, the three footer strings, `seatMarker`, `echoFor`, `footerFor`, `rowsForProvider`, `filterModelRows`, or the two R-4 empty states.
- Ruled copy is byte-exact and immutable: empty search row = `▌ / filter · esc clears` (EV-27 R-1); no-match line = `No models matching "<query>".` (EPIC-6 R-1). Never re-litigate them.
- Full-width search row is `▌ ` + (query === "" ? hint : query); truncation from the right never clips the `▌`; the row is byte-identical in both focus states.
- `signature()` includes `searchActive`, `inputFocused`, and `query` (query LAST — compared by full-string equality, never parsed).
- `modelIndex` re-clamps into the filtered set after EVERY query mutation (append and clear). The existing `currentRows().length === 0` Enter-guard covers shrink-to-zero.
- Key-handling order is fixed: settled → level 3 → search-mode interception (level 2 && searchActive: backspace guard first, then printable append, then Esc) → existing up/down/enter/escape (unchanged in shape; Up/Down additionally set `inputFocused = false` when level 2 && searchActive) → fall-through `/` trigger (level 2, !searchActive, non-empty model list).
- Backspace is a guard-only no-op (`matchesKey(data, Key.backspace)` BEFORE any decode — covers `\x7f`, `\x08`, kitty `\x1b[127u`, modify-other-keys). Esc-clear is the sole deletion mechanism.
- Printable decode is `decodeKittyPrintable(data) ?? (data.length === 1 && code >= 32 && code <= 126 ? data : undefined)`; the 126 upper bound is belt-and-suspenders against DEL (127).
- Enter never zeroes `query`/`searchActive` (non-mutation): 3→2 backout preserves search state; 1→2 re-entry resets it; ascent from level 2 clears it.
- Token-only rendering (AGENTS.md 9.6): only `theme.fg`/`theme.bold` — no ANSI literals, no hex literals (source audits 8.1/8.12 keep passing).
- TDD: new behavior needs a failing test first; suite green per task (pre-existing 2 skips are the env-dependent integration suite — do not disturb).
- Commits MUST be Conventional Commits (`feat(model-picker): ...`); no history rewriting; never work on `main`.
- Gates, in order, none lowered: `bun install --frozen-lockfile` (exit 0), `bunx tsc --noEmit` (exit 0), `bun test` (whole suite green; 2 skips expected), `python3 council/validate.py` ("All council artifacts valid").
- Out of scope (do NOT do): backspace/single-char deletion, `/ filter` in the model footer, first-time hint row, `withModalFrame` changes, kitty-protocol activation, any change outside the seam.

---

### Task 1: Search state, `/` trigger, row-source filter, and the search row

**Files:**
- Modify: `extensions/model-picker.ts`
- Modify: `test/model-picker.test.ts`

**Interfaces:**
- Consumes: EV-26 `filterModelRows(rows: PickRow[], query: string): PickRow[]` (already in `model-picker.ts`); `rowsForProvider(group)`; pi-tui root exports `decodeKittyPrintable`, `Key`, `matchesKey`, `truncateToWidth`, `visibleWidth` (verified).
- Produces (used by later tasks): exported `SEARCH_HINT: string` (`"/ filter · esc clears"`), `SEARCH_ROW_EMPTY: string` (`"▌ / filter · esc clears"`); class fields `searchActive`, `query`, `inputFocused`; `currentRows()` level-2 filter branch; `signature()` with `:searchActive:inputFocused:query` appended (query last); `searchRow(width)`; `pushRows(..., footer = true)` 4th param; the fall-through `/` trigger.

- [ ] **Step 1: Write the failing tests**

Append to `test/model-picker.test.ts` (after the existing 8.13 block), and add `SEARCH_ROW_EMPTY` to the import block from `../extensions/model-picker.ts`:

```ts
// ---- EV-27 `/`-triggered search input (spec test surface) ----
const SLASH_KITTY = "\x1b[47u";

test("EV-27 ruled copy: SEARCH_ROW_EMPTY is the byte-exact R-1 empty-input row", () => {
	expect(SEARCH_ROW_EMPTY).toBe("▌ / filter · esc clears");
});

test("EV-27 1: `/` at level 2 opens the input — bare and kitty forms, rows unchanged", () => {
	const { p } = picker(CATALOGUE);
	p.handleInput(ENTER); // provider
	p.handleInput(ENTER); // model
	expect(strip(p.render(80)[1])).toBe("> openrouter/deepseek/deepseek-v4-pro-0813:off");
	p.handleInput("/");
	const lines = p.render(80).map(strip);
	expect(lines[1]).toBe(SEARCH_ROW_EMPTY);
	expect(lines[2]).toBe("> openrouter/deepseek/deepseek-v4-pro-0813:off");
	expect(lines[lines.length - 1]).toBe(FOOTER_MODEL);

	const q = picker(CATALOGUE);
	q.p.handleInput(ENTER);
	q.p.handleInput(ENTER);
	q.p.handleInput(SLASH_KITTY); // kitty CSI-u form "\x1b[47u"
	expect(strip(q.p.render(80)[1])).toBe(SEARCH_ROW_EMPTY);
});

test("EV-27 3: search row renders between header and first data row; empty byte-exact; typed byte-exact", () => {
	const { p } = picker(CATALOGUE);
	p.handleInput(ENTER);
	p.handleInput(ENTER);
	expect(strip(p.render(80)[0])).toBe(HEADER);
	p.handleInput("/");
	const empty = p.render(80).map(strip);
	expect(empty[0]).toBe(HEADER);
	expect(empty[1]).toBe(SEARCH_ROW_EMPTY);
	expect(empty[2]).toBe("> openrouter/deepseek/deepseek-v4-pro-0813:off");
	for (const ch of "claude") p.handleInput(ch);
	const typed = p.render(80).map(strip);
	expect(typed[0]).toBe(HEADER);
	expect(typed[1]).toBe("▌ claude");
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `bun test test/model-picker.test.ts -t "EV-27"`
Expected: FAIL — `SEARCH_ROW_EMPTY` is not exported (import error), and `handleInput("/")` changes nothing (no trigger yet), so `lines[1]` is still the first model row.

- [ ] **Step 3: Implement**

`extensions/model-picker.ts`:

(a) Import `decodeKittyPrintable` from pi-tui:

```ts
import { Key, decodeKittyPrintable, matchesKey, truncateToWidth, visibleWidth, type Component } from "@earendil-works/pi-tui";
```

(b) Add the ruled constants next to the other R-copy exports (after `EMPTY_NO_MODELS`):

```ts
/** EV-27 R-1 ruled hint — byte-exact, immutable. */
export const SEARCH_HINT = "/ filter · esc clears";
/** EV-27 R-1 byte-exact empty-input row: `▌` (U+258C, one column at 0) + hint. */
export const SEARCH_ROW_EMPTY = `\u258C ${SEARCH_HINT}`;
```

(c) Add the three search fields to the class (next to `private picked`):

```ts
	private searchActive = false;
	private query = "";
	private inputFocused = false;
```

(d) Add the shared printable decode as a module-level pure function (next to `clamp`):

```ts
/** EV-27 shared printable decode: kitty CSI-u arm plus the legacy bare-byte
 *  fallback. Callers MUST guard backspace BEFORE decoding — kitty DEL
 *  (`\x1b[127u`) decodes to "\x7f" — and the 126 upper bound is the
 *  belt-and-suspenders exclusion of the same byte. */
function decodePrintable(data: string): string | undefined {
	return decodeKittyPrintable(data) ?? (data.length === 1 && data.charCodeAt(0) >= 32 && data.charCodeAt(0) <= 126 ? data : undefined);
}
```

(e) Extend `signature()` (query last; compared by full equality, never parsed):

```ts
	private signature(): string {
		return `${this.level}:${this.seatIndex}:${this.providerIndex}:${this.modelIndex}:${this.windowStart()}:${this.searchActive ? 1 : 0}:${this.inputFocused ? 1 : 0}:${this.query}`;
	}
```

(f) Make `currentRows()` the single row source at level 2:

```ts
		const group = this.catalogue.providers[this.providerIndex];
		return group ? (this.searchActive ? filterModelRows(rowsForProvider(group), this.query) : rowsForProvider(group)) : [];
```

(g) Add the search row builder (never clips the `▌`; right-truncation; byte-identical in both focus states):

```ts
	/** EV-27 search row: `▌ ` (U+258C at column 0) + the R-1 empty hint or the
	 *  live query. Truncation is from the right and never clips the `▌`. */
	private searchRow(width: number): string {
		const cell = "\u258C ";
		const text = this.query === "" ? SEARCH_HINT : this.query;
		if (visibleWidth(cell + text) <= width) return cell + text;
		return cell + truncateToWidth(text, Math.max(1, width - visibleWidth(cell)), "");
	}
```

(h) Give `pushRows` an opt-out footer so the search frame can draw `FOOTER_MODEL` explicitly:

```ts
	private pushRows(width: number, lines: string[], rows: Array<SeatState | ProviderGroup | PickRow>, footer = true): void {
		// ... unchanged body ...
		if (footer) lines.push(this.theme.fg("dim", footerFor(this.level)));
	}
```

(i) Render the search frame at level 2 (between the existing R-4#2 branch and the plain branch):

```ts
		} else if (this.searchActive) {
			lines.push(this.searchRow(width));
			this.pushRows(width, lines, this.currentRows(), false);
			lines.push(this.theme.fg("dim", FOOTER_MODEL));
		} else {
			this.pushRows(width, lines, this.currentRows());
		}
```

(j) Add the fall-through `/` trigger at the very end of `handleInput`:

```ts
		// EV-27 fall-through trigger: a decoded `/` at the model level with no
		// search open opens it — gated on a non-empty model list so `/` never
		// injects active keys into the keyless R-4#2 state.
		if (this.level === 2 && !this.searchActive && decodePrintable(data) === "/") {
			const group = this.catalogue.providers[this.providerIndex];
			if (group && group.models.length > 0) {
				this.searchActive = true;
				this.inputFocused = true;
				this.cached = undefined;
				return;
			}
		}
	}
```

- [ ] **Step 4: Run to verify they pass**

Run: `bun test test/model-picker.test.ts`
Expected: PASS, including the pre-existing 8.x tests (8.8 keeps passing — no `▌` in non-search walks).

- [ ] **Step 5: Commit**

```bash
git add extensions/model-picker.ts test/model-picker.test.ts
git commit -m "feat(model-picker): / opens a search input at the model level (EV-27 state, trigger, row source)"
```

---

### Task 2: Printable append, backspace guard, cache distinctness

**Files:**
- Modify: `extensions/model-picker.ts`
- Modify: `test/model-picker.test.ts`

**Interfaces:**
- Consumes: Task 1's `searchActive`/`query`/`inputFocused`, `currentRows()` filter branch, `decodePrintable`, `signature()`.
- Produces: the search-mode interception block in `handleInput` (backspace guard → printable append → re-clamp → cache clear); the modelIndex re-clamp-on-append invariant that Task 5's shrink test relies on.

- [ ] **Step 1: Write the failing tests**

```ts
test("EV-27 2: typing claude narrows the rows to qualifiedId substring matches (case-insensitive)", () => {
	const { p } = picker(CATALOGUE);
	p.handleInput(ENTER);
	p.handleInput(ENTER);
	p.handleInput("/");
	for (const ch of "claude") p.handleInput(ch);
	const rows = p
		.render(80)
		.map(strip)
		.filter((l) => l.startsWith("> ") || l.startsWith("  "))
		.map((l) => l.slice(2));
	expect(rows).toEqual(["openrouter/alias/claude-sonnet:off", "openrouter/alias/claude-sonnet:high"]);

	const q = picker(CATALOGUE);
	q.p.handleInput(ENTER);
	q.p.handleInput(ENTER);
	q.p.handleInput("/");
	for (const ch of "CLAUDE") q.p.handleInput(ch); // uppercase — case-insensitive
	const qRows = q.p
		.render(80)
		.map(strip)
		.filter((l) => l.startsWith("> ") || l.startsWith("  "))
		.map((l) => l.slice(2));
	expect(qRows).toEqual(["openrouter/alias/claude-sonnet:off", "openrouter/alias/claude-sonnet:high"]);
});

test("EV-27 4: FOOTER_MODEL is the last line at every keystroke incl. no-match", () => {
	const { p } = picker(CATALOGUE);
	p.handleInput(ENTER);
	p.handleInput(ENTER);
	for (const k of ["/", "c", "l", "a", "u", "d", "e", "z", "z"]) {
		p.handleInput(k);
		const lines = p.render(80).map(strip);
		expect(lines[lines.length - 1]).toBe(FOOTER_MODEL);
	}
});

test("EV-27 5: `/` inside the input appends as a literal — anthropic/claude typeable", () => {
	const { p } = picker(CATALOGUE);
	p.handleInput(ENTER);
	p.handleInput(ENTER);
	p.handleInput("/");
	for (const ch of "anthropic/claude") p.handleInput(ch);
	const lines = p.render(80).map(strip);
	expect(lines[1]).toBe("▌ anthropic/claude");
	expect(lines[lines.length - 1]).toBe(FOOTER_MODEL);
	expect(lines.join("\n")).not.toContain(SEARCH_ROW_EMPTY); // still search mode, hint gone
});

test("EV-27 6: render cache — claude vs claud (equal filtered set, cursor, window) differ", () => {
	const { p } = picker(CATALOGUE);
	p.handleInput(ENTER);
	p.handleInput(ENTER);
	p.handleInput("/");
	for (const ch of "claud") p.handleInput(ch);
	const first = p.render(80);
	p.handleInput("e");
	const second = p.render(80);
	expect(second).not.toEqual(first);
	expect(strip(second[1])).toBe("▌ claude");
});

test("EV-27 7: backspace bytes are guard-only no-ops — \x7f and \x1b[127u leave query unchanged", () => {
	const { p } = picker(CATALOGUE);
	p.handleInput(ENTER);
	p.handleInput(ENTER);
	p.handleInput("/");
	for (const ch of "claude") p.handleInput(ch);
	p.handleInput("\x7f");
	expect(strip(p.render(80)[1])).toBe("▌ claude");
	p.handleInput("\x1b[127u");
	expect(strip(p.render(80)[1])).toBe("▌ claude");
});

test("EV-27 10: modelIndex re-clamps after every keystroke; shrink-then-Enter emits the survivor; empty-set Enter no-ops", () => {
	const { p, confirmed } = picker(CATALOGUE);
	p.handleInput(ENTER);
	p.handleInput(ENTER);
	p.handleInput("/");
	p.handleInput("a"); // 3 rows: alpha:off, alias:off, alias:high
	p.handleInput(DOWN);
	p.handleInput(DOWN); // index 2
	p.handleInput("l"); // still 3 rows
	p.handleInput("i"); // "ali" → 2 rows; index clamps to 1
	p.handleInput(ENTER); // picks alias:high — no throw
	const sel = p.resolveSelection();
	expect(sel).toEqual({ seat: "owner", model: "openrouter/alias/claude-sonnet", thinking: "high" });
	p.handleInput(ENTER);
	expect(confirmed).toEqual([sel]);

	const q = picker(CATALOGUE);
	q.p.handleInput(ENTER);
	q.p.handleInput(ENTER);
	q.p.handleInput("/");
	for (const ch of "zz") q.p.handleInput(ch); // 0 rows
	q.p.handleInput(ENTER); // consumed no-op, no throw
	const lines = q.p.render(80).map(strip);
	expect(lines[1]).toBe("▌ zz");
	expect(lines[lines.length - 1]).toBe(FOOTER_MODEL);
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `bun test test/model-picker.test.ts -t "EV-27"`
Expected: FAIL — typed characters fall through to the (unchanged) key handling, so the query never grows: rows stay full, `lines[1]` is never `▌ claude`, test 2/4/5/6/7 fail; test 10's shrink walk picks `ds:high` instead of `alias:high`.

- [ ] **Step 3: Implement**

Insert the search-mode interception block in `handleInput`, immediately after the level-3 branch and before the Up key branch:

```ts
		// EV-27 search-mode interception: only at the model level with search open.
		if (this.level === 2 && this.searchActive) {
			// Backspace is a guard-only no-op — Esc-clear is the sole deletion.
			if (matchesKey(data, Key.backspace)) return;
			const printable = decodePrintable(data);
			if (printable !== undefined) {
				this.query += printable;
				this.inputFocused = true;
				this.modelIndex = clamp(this.modelIndex, 0, this.currentRows().length - 1);
				this.cached = undefined;
				return;
			}
		}
```

- [ ] **Step 4: Run to verify they pass**

Run: `bun test test/model-picker.test.ts`
Expected: PASS — including the full EV-27 2/4/5/6/7/10 assertions and the pre-existing 8.x suite (8.1/8.12 source audits must still pass: no ANSI, no hex, no foreign symbols).

- [ ] **Step 5: Commit**

```bash
git add extensions/model-picker.ts test/model-picker.test.ts
git commit -m "feat(model-picker): search-mode printable append with backspace guard (EV-27)"
```

---

### Task 3: Esc routing and the focus machine

**Files:**
- Modify: `extensions/model-picker.ts`
- Modify: `test/model-picker.test.ts`

**Interfaces:**
- Consumes: Task 2's interception block; the existing Up/Down/Enter/Escape branches; Task 1's fields.
- Produces: Esc-routes-on-focus (focused → clear-and-stay; unfocused → ascend with search death), Up/Down focus-out at level 2 && searchActive, 1→2 re-entry reset, Esc-clear re-clamp. These are what make the no-match walk (Task 4 test) exit.

- [ ] **Step 1: Write the failing tests**

```ts
test("EV-27 8: Esc in the input clears and keeps focus; Esc again stays; Esc with focus out ascends", () => {
	const { p } = picker(CATALOGUE);
	p.handleInput(ENTER);
	p.handleInput(ENTER);
	p.handleInput("/");
	for (const ch of "claude") p.handleInput(ch);
	p.handleInput(ESC); // focused — clear, keep focus, stay level 2
	let lines = p.render(80).map(strip);
	expect(lines[0]).toBe(HEADER);
	expect(lines[1]).toBe(SEARCH_ROW_EMPTY);
	p.handleInput(ESC); // still focused — no ascend
	lines = p.render(80).map(strip);
	expect(lines[0]).toBe(HEADER);
	expect(lines[1]).toBe(SEARCH_ROW_EMPTY);
	p.handleInput(DOWN); // focus out
	p.handleInput(ESC); // → level 1
	lines = p.render(80).map(strip);
	expect(lines[0]).toBe(HEADER);
	expect(lines[1].startsWith("> OpenRouter")).toBe(true);
	expect(lines.join("\n")).not.toContain("\u258C");
});

test("EV-27 13: ▌ renders only in search-mode model-level frames", () => {
	const { p } = picker(CATALOGUE);
	// non-search walk: seat, provider, model, confirm — no ▌ anywhere
	expect(p.render(80).join("\n")).not.toContain("\u258C");
	p.handleInput(ENTER);
	expect(p.render(80).join("\n")).not.toContain("\u258C");
	p.handleInput(ENTER);
	expect(p.render(80).join("\n")).not.toContain("\u258C");
	p.handleInput(ENTER);
	expect(p.render(80).join("\n")).not.toContain("\u258C");
	p.handleInput(ESC);
	p.handleInput(ESC);
	p.handleInput(ENTER); // back to the model level
	p.handleInput("/");
	expect(p.render(80).join("\n")).toContain("\u258C");
	p.handleInput(ESC); // cleared but still focused, level 2
	expect(p.render(80).join("\n")).toContain("\u258C");
	p.handleInput(DOWN);
	p.handleInput(ESC);
	expect(p.render(80).join("\n")).not.toContain("\u258C");
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `bun test test/model-picker.test.ts -t "EV-27"`
Expected: FAIL — Esc in search mode currently falls through to the generic branch and ascends to level 1 (or closes at level 0), so `lines[1]` after Esc is the provider row, not `SEARCH_ROW_EMPTY`; test 13's `Esc` after `/` loses the `▌`.

- [ ] **Step 3: Implement**

(a) Add the Esc branch inside the interception block (before the printable decode):

```ts
			if (matchesKey(data, Key.escape)) {
				if (this.inputFocused) {
					// Esc-clear: empty the query, keep focus and search mode.
					this.query = "";
					this.modelIndex = clamp(this.modelIndex, 0, this.currentRows().length - 1);
					this.cached = undefined;
					return;
				}
				// Focus out — ascend exactly like the plain level-2 Esc; search state dies with the level.
				this.level = 1;
				this.searchActive = false;
				this.query = "";
				this.inputFocused = false;
				this.cached = undefined;
				return;
			}
```

(b) In the existing Up and Down branches, after the clamp, add:

```ts
			if (this.level === 2 && this.searchActive) this.inputFocused = false;
```

(c) In the existing Enter branch's `else if (this.level === 1)` arm, reset search state on 1→2 re-entry:

```ts
		} else if (this.level === 1) {
			this.modelIndex = 0;
			this.level = 2;
			this.searchActive = false;
			this.query = "";
			this.inputFocused = false;
		}
```

- [ ] **Step 4: Run to verify they pass**

Run: `bun test test/model-picker.test.ts`
Expected: PASS — EV-27 8/13 green; existing 8.4 (Esc ascends, cursor preserved) still green.

- [ ] **Step 5: Commit**

```bash
git add extensions/model-picker.ts test/model-picker.test.ts
git commit -m "feat(model-picker): Esc routes on search-input focus; focus machine (EV-27)"
```

---

### Task 4: No-match third render branch

**Files:**
- Modify: `extensions/model-picker.ts`
- Modify: `test/model-picker.test.ts`

**Interfaces:**
- Consumes: Task 3's focus machine (the no-match walk depends on Down-focus-out then Esc-ascend); `SEARCH_ROW_EMPTY`/`SEARCH_HINT` from Task 1.
- Produces: exported `NO_MATCH(query: string): string`; the render no-match branch.

- [ ] **Step 1: Write the failing tests**

Add `NO_MATCH` to the test import block, then:

```ts
test("EV-27 ruled copy: NO_MATCH is the byte-exact EPIC-6 R-1 literal", () => {
	expect(NO_MATCH("zzzz")).toBe('No models matching "zzzz".');
});

test("EV-27 9: no-match renders ruled copy byte-exact, FOOTER_MODEL last, distinct from R-4; walk exits", () => {
	const { p } = picker(CATALOGUE);
	p.handleInput(ENTER);
	p.handleInput(ENTER);
	p.handleInput("/");
	for (const ch of "zzzz") p.handleInput(ch);
	const lines = p.render(80).map(strip);
	expect(lines[1]).toBe("▌ zzzz");
	expect(lines[2]).toBe(NO_MATCH("zzzz"));
	expect(lines[lines.length - 1]).toBe(FOOTER_MODEL);
	expect(lines).not.toContain(EMPTY_NO_PROVIDERS);
	expect(lines).not.toContain(EMPTY_NO_MODELS("OpenRouter"));
	// R-4#2 is footer-less — byte-distinct surface
	const r4 = new ModelPicker({ providers: [{ provider: "p", displayName: "P", models: [] }], seats: CATALOGUE.seats }, FAKE_THEME, () => {}, () => {});
	r4.handleInput(ENTER);
	r4.handleInput(ENTER);
	expect(r4.render(80).map(strip)).not.toContain(FOOTER_MODEL);
	// no dead-end: Down moves focus out, Esc ascends to level 1
	p.handleInput(DOWN);
	p.handleInput(ESC);
	expect(strip(p.render(80)[1]).startsWith("> OpenRouter")).toBe(true);
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `bun test test/model-picker.test.ts -t "EV-27"`
Expected: FAIL — with `zzzz` the filtered set is empty, and the current search frame renders `[HEADER, ▌ zzzz, FOOTER_MODEL]` with no no-match line; `NO_MATCH` isn't exported (import error).

- [ ] **Step 3: Implement**

(a) Export the no-match literal next to `SEARCH_ROW_EMPTY`:

```ts
/** EPIC-6 R-1 ruled no-match copy — byte-exact, interpolated with the live query. */
export const NO_MATCH = (query: string): string => `No models matching "${query}".`;
```

(b) Add the no-match branch inside the level-2 search frame (between the search row and the footer):

```ts
		} else if (this.searchActive) {
			lines.push(this.searchRow(width));
			const rows = this.currentRows();
			if (rows.length === 0) {
				lines.push(this.theme.fg("dim", NO_MATCH(this.query)));
			} else {
				this.pushRows(width, lines, rows, false);
			}
			lines.push(this.theme.fg("dim", FOOTER_MODEL));
		} else {
```

- [ ] **Step 4: Run to verify they pass**

Run: `bun test test/model-picker.test.ts`
Expected: PASS — EV-27 9 green; R-4#2 remains footer-less (8.11 keeps passing).

- [ ] **Step 5: Commit**

```bash
git add extensions/model-picker.ts test/model-picker.test.ts
git commit -m "feat(model-picker): no-match third render branch with ruled copy (EV-27)"
```

---

### Task 5: Selection tuple equality and the B-7 round-trip

**Files:**
- Modify: `test/model-picker.test.ts` only (implementation came with Tasks 1–4)

**Interfaces:**
- Consumes: everything from Tasks 1–4. Produces: the final two acceptance clusters (spec test surface 11 and 12) — proof that `resolveSelection()` is byte-verbatim through a filtered set and that 3→2 backout preserves while 1→2 re-entry resets.

- [ ] **Step 1: Write the failing tests**

```ts
test("EV-27 11: selection through a filtered set emits the same tuple as the unfiltered path; echo byte-equal", () => {
	const unfiltered = picker(CATALOGUE);
	unfiltered.p.handleInput(ENTER);
	unfiltered.p.handleInput(ENTER);
	for (let i = 0; i < 5; i++) unfiltered.p.handleInput(DOWN); // alias:high
	unfiltered.p.handleInput(ENTER);
	const expected = unfiltered.p.resolveSelection();
	expect(expected).toEqual({ seat: "owner", model: "openrouter/alias/claude-sonnet", thinking: "high" });
	const echo = unfiltered.p.render(80).map(strip).find((l) => l.startsWith("Set "))!;
	expect(echo).toBe(echoFor(expected));

	const filtered = picker(CATALOGUE);
	filtered.p.handleInput(ENTER);
	filtered.p.handleInput(ENTER);
	filtered.p.handleInput("/");
	for (const ch of "claude") filtered.p.handleInput(ch);
	filtered.p.handleInput(DOWN); // alias:high
	filtered.p.handleInput(ENTER);
	expect(filtered.p.resolveSelection()).toEqual(expected);
	const filtEcho = filtered.p.render(80).map(strip).find((l) => l.startsWith("Set "))!;
	expect(filtEcho).toBe(echo);
	expect(filtEcho).toBe(echoFor(expected));
});

test("EV-27 12: B-7 round-trip preserves search state; fresh 1→2 re-entry resets it", () => {
	const { p } = picker(CATALOGUE);
	p.handleInput(ENTER);
	p.handleInput(ENTER);
	p.handleInput("/");
	for (const ch of "claude") p.handleInput(ch);
	p.handleInput(DOWN); // index 1, focus out
	p.handleInput(ENTER); // confirm — search state untouched
	expect(p.render(80).map(strip).join("\n")).not.toContain("\u258C"); // confirm never renders the search row
	p.handleInput(ESC); // back to level 2 — preserved
	let lines = p.render(80).map(strip);
	expect(lines[1]).toBe("▌ claude");
	expect(lines[2]).toBe("  openrouter/alias/claude-sonnet:off");
	expect(lines[3]).toBe("> openrouter/alias/claude-sonnet:high");
	expect(lines[lines.length - 1]).toBe(FOOTER_MODEL);
	p.handleInput(ESC); // focus out → level 1; search state dies with the level
	p.handleInput(ENTER); // fresh 1→2 re-entry — resets search state
	lines = p.render(80).map(strip);
	expect(lines[1]).toBe("> openrouter/deepseek/deepseek-v4-pro-0813:off");
	expect(lines.join("\n")).not.toContain("\u258C");
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `bun test test/model-picker.test.ts -t "EV-27 11\|EV-27 12"`
Expected: FAIL — with no re-clamp... wait, re-clamp exists (Task 2). The point of TDD here: write them, watch them fail against the CURRENT code state ONLY IF a gap exists. Run first; if they pass, they are regression pins — record that they pass and that their failure mode (removing the re-clamp on append, removing the 1→2 reset, or zeroing `query` on Enter) is covered by the neighbor tasks' red steps. Proceed to Step 3 regardless: these two tests are the spec's mandatory acceptance 11/12 and must be in the suite.

- [ ] **Step 3: (no implementation needed — Tasks 1–4 already satisfy the spec; if Step 2 failed, fix the specific gap, e.g. a missing `this.query = ""` reset or a dropped re-clamp)**

- [ ] **Step 4: Run the full file**

Run: `bun test test/model-picker.test.ts`
Expected: PASS — all 8.x + EV-27 tests.

- [ ] **Step 5: Commit**

```bash
git add test/model-picker.test.ts
git commit -m "test(model-picker): tuple-equality and B-7 round-trip acceptance (EV-27 11-12)"
```

---

### Task 6: Clear all four gates in order

- [ ] **Step 1: Gate 1 — frozen install**

Run: `bun install --frozen-lockfile`
Expected: exit 0, no lockfile diff (`git status --short` shows no `bun.lock` change).

- [ ] **Step 2: Gate 2 — typecheck**

Run: `bunx tsc --noEmit`
Expected: exit 0, no output.

- [ ] **Step 3: Gate 3 — whole test suite**

Run: `bun test`
Expected: whole suite green; the 2 pre-existing skips (env-dependent integration suite) remain skipped; record real pass/skip counts. Also confirm no scratch files were left in `test/` (`git status --short` clean except intended changes).

- [ ] **Step 4: Gate 4 — council artifacts**

Run: `python3 council/validate.py`
Expected: prints `All council artifacts valid`, exit 0.

- [ ] **Step 5: Commit any remaining changes (none expected)**

---

### Task 7: Push the branch and open the PR

- [ ] **Step 1:** Confirm the diff touches only `extensions/model-picker.ts` and `test/model-picker.test.ts` (+ the plan file):

```bash
git status --short
git diff main --stat
```

- [ ] **Step 2:** Push and open the PR:

```bash
git push -u origin feat/ev-27-search-input
gh pr create --base main --head feat/ev-27-search-input --title "feat(model-picker): /-triggered search input in the model selection modal (EV-27)" --body "Implements EV-27 ... "
```

- [ ] **Step 3:** Record branch name, PR number, and exact head SHA (`git rev-parse HEAD`). Do NOT poll CI. Report the gates' real output in the final report.