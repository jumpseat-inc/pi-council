# EV-8 Focus Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to
> implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Layer bidirectional arrow-key focus navigation onto the EV-7 inline
below-editor tree: Down from the focused input editor (on the **last logical
line**) enters tree-focus (`controller.surface = "tree"`), Up/Down move a
sessionId-keyed selection across rows, and Up-on-row-0 / Escape / Down-on-last-row
return focus to the editor.

**Architecture:** A pure `TreeFocusState` controller (surface + sessionId-keyed
selection + sorted row list) is the single source of truth for "tree focus". A
`CustomEditor` subclass (`setEditorComponent`, composing over a prior editor via
`getEditorComponent()`, per O4) overrides `handleInput` to route only the handled
set (Up/Down/Enter/Escape) and **forward everything else** to `super`/the prior
editor (forward-unhandled, OJ-2). The editor stays the TUI's always-focused
component; "tree focus" is `controller.surface` state (OJ-1). The EV-7 widget
stays render-only; it reads the controller to draw the ▌ (U+258C) selected-row
marker and never receives keys.

**Tech Stack:** Bun, TS (strict), pi extension API
(`setEditorComponent`/`getEditorComponent`, `EditorFactory`), pi-tui
(`CustomEditor` base for app keybindings, `matchesKey`/`Key`, `truncateToWidth`,
`Editor.getCursor()/getLines()`), existing EV-7 `CouncilTreeWidget` +
`openTranscript`.

**Spec:** `docs/superpowers/specs/2026-08-26-EV-8-design.md`

## Global Constraints (from spec — binding)

- **OJ-1 editor-driven:** `controller.surface` is the SOLE arbiter of tree focus.
  **No `setFocus(widget)`, no `onTerminalInput`.** The editor stays the TUI's
  always-focused component.
- **OJ-2 forward-unhandled:** while `surface === "tree"`, consume ONLY
  Up/Down/Enter/Escape; call `super.handleInput(data)` for EVERY other key
  (printables, ctrl+c, ctrl+d, PageUp/PageDown, Home/End, Backspace, Tab).
- **OJ-3 taste:** mode label `-- TREE --` (hard rule), no new keymap mechanism,
  j/k aliasing = no, ▌ = U+258C (hard rule).
- **O4 composition:** `FocusTreeEditor` MUST compose over any prior
  `getEditorComponent()` factory (prior editor's `handleInput` still runs for its
  keys — no clobber).
- **O6 sessionId-keyed selection:** highlight is keyed by `sessionId`, never a row
  index; must survive the 2s running-first re-sort.
- **Multi-line gate:** enter tree only when `getCursor().line >= getLines().length - 1`
  (logical-line predicate; wrap-edge is an accepted, documented trade-off).
- **Token-only:** mode label via the editor's `borderColor` token; ▌ via
  `theme.fg("accent", ...)`. No inline ANSI/hex.
- **Widget budget:** ▌ marker is a single cell; never pushes a row past
  `MAX_WIDGET_LINES = 10`.
- **Repaint:** widget `render()` reads `controller.surface` + `selectedSessionId`
  at render time (cache key includes the selection signature).
- **Lifecycle:** register the editor on tree open; on close / `session_shutdown`
  reset `surface = "editor"`, clear selection, and restore the composed-over
  editor (O3 close-with-focus reset on the same close path).
- **Hub.ts is NOT touched** (AGENTS.md #7); EV-7 modal path + EV-4 ambient widget
  contract untouched.

## File structure

- Create `extensions/focus-nav.ts` — `TreeFocusState`, pure helpers
  (`classifyTreeKey`, `shouldEnterTreeOnDown`), `routeEditorInput`, `FocusTreeEditor`,
  `installTreeEditor`/`restoreTreeEditor`.
- Modify `extensions/navigator.ts` — pass the controller into `CouncilTreeWidget`,
  draw the ▌ marker, write rows to the controller, wire the editor install/restore
  into the toggle + `session_shutdown` teardown.
- Create `test/ev8-focus-navigation.test.ts` — T1–T8 settling tests.
- Modify `extensions/index.ts` — `session_shutdown` also restores the editor.

---

## Task 1: `TreeFocusState` controller + pure routing helpers

**Files:**
- Create: `extensions/focus-nav.ts`
- Test: `test/ev/focus-navigation.test.ts`

**Interfaces:**
- Produces:
  - `type Surface = "editor" | "tree"`
  - `type TreeKey = "up" | "down" | "enter" | "escape" | "other"`
  - `export const TREE_MODE_LABEL = "-- TREE --"`
  - `export const TREE_ROW_MARKER = "\u258C"`
  - `export function classifyTreeKey(data: string): TreeKey`
  - `export function shouldEnterTreeOnDown(cursorLine: number, lineCount: number): boolean`
  - `export type EditorRoute = { action: "consumed" } | { action: "forward" }`
  - `export function routeFocus(data: TreeKey, controller, opts): EditorRoute`
  - `export class TreeFocusState { surface; selectedSessionId; setRows; setOpen; isOpen; rowCount; selectedIndex; enter; move; isAtTop; isAtBottom; exit }`

- [ ] **Step 1: failing test** — create `test/ev/s?focus-navigation.test.ts`:

```ts
import { test, expect } from "bun:test";
import {
	TreeFocusState,
	classifyTreeKey,
	shouldEnterTreeOnDown,
	routeEditorFocus,
	TREE_MODE_LABEL,
	TREE_ROW_MARKER,
} from "../extensions/focus-nav.ts";
import { matchesKey, Key } from "@earendil-works/pi-tui";

const DOWN = "\x1b[B", UP = "\x1b[A", ENTER = "\r", ESC = "\x1b";

/** Build a controller with N rows ['a','b','c'] open. */
function tree(n: number): TreeFocusState {
	const c = new TreeFocusState();
	c.setOpen(true);
	c.setRows(n === 0 ? [] : ["a", "b", "c"].slice(0, n));
	return c;
}

test("T5/O6: selection is keyed by sessionId and survives a re-sort", () => {
	const c = treeController(3);
	c.enter();
	c.move(1);
	c.move(1); // now 'c'
	// running-first re-sort moves 'c' to the top
	c.setRows(["c", "a", "b"]);
	expect(c.selectedSessionId).toBe("c");
	expect(c.selectedIndex()).toBe(0); // same session, new index
});

test("shouldEnterTreeOnDown: single-line true; 3-line line-0 false; last-line true; wrap-edge false", () => {
	expect(shouldEnterTreeOnDown(0, 1)).toBe(true); // single line
	expect(shouldEnterTreeOnDown(0, 3)).toBe(false); // 3-line, cursor on line 0
	expect(shouldEnterTreeOnDown(2, 3)).toBe(true); // last logical line
	expect(shouldEnterTreeOnDown(3, 3)).toBe(false); // wrapped visual line past last logical
});
```

- [ ] **Step 2: run** — `bun test test/ev-focus-navigation.test.ts`. Expected: FAIL
  (module not exported / `TreeFocusState is not a constructor`).
- [ ] **Step 3: implement** — `extensions/focus-nav.ts` with:

```ts
import { Key, matchesKey, type EditorComponent, type TUI, type EditorTheme } from "@earendil-works/pi-tui";
import { CustomEditor, type KeybindingsManager } from "@earendil-works/pi-coding-agent";

export type Surface = "editor" | "tree";
export type TreeKey = "up" | "down" | "enter" | "escape" | "other";
export const TREE_MODE_LABEL = "-- TREE --";
export const TREE_ROW_MARKER = "\u258C";
export type EnterOnDown = boolean;

export function shouldEnterTreeOnDown(cursorLine: number, lineCount: number): boolean {
	return cursorLine >= lineCount - 1;
}

export function classifyTreeKey(data: string): TreeKey {
	if (matchesKey(data, Key.up)) return "up";
	if (matchesKey(data, Key.down)) return "down";
	if (matchesKey(data, Key.enter)) return "enter";
	if (matchesKey(data, Key.escape)) return "escape";
	return "other";
}

export class TreeFocusState {
	surface: Surface = "editor";
	selectedSessionId: string | null = null;
	private _open = false;

	setOpen(v: boolean): void { this._open = v; if (!v) this.exit(); }
	isOpen(): boolean { return this._open; }
	/** Current sorted session-id rows: index == visual row in the widget. */
	setRows(ids: string[]): void { this._rows = ids; }
	private _rows: string[] = [];
	rowCount(): number { return this._rows.length; }
	/** Resolve selectedSessionId to its row index against the CURRENT rows (never stale). */
	selectedIndex(): number {
		if (this.selectedSessionId === null) return -1;
		const i = this._rows.indexOf(this.selectedSessionId);
		return i < 0 ? -1 : i;
	}
	/** Try to enter the tree. Returns true if surface became "tree". */
	enter(): boolean {
		if (this.surface === "tree") return true;
		if (!this._open || this._rows.length === 0) return false;
		if (this.selectedSessionId === null || !this._rows.includes(this.selectedSessionId)) {
			this.selectedSessionId = this._rows[0]!;
		}
		this.surface = "tree";
		return true;
	}
	/** Move selection up(-1)/down(+1), clamped, no wrap. */
	move(dir: -1 | 1): void {
		const i = this.selectedIndex();
		const next = dir === 1 ? Math.min(this._rows.length - 1, i + 1) : Math.max(0, i - 1);
		this.selectedSessionId = this._rows[next] ?? null;
	}
	isAtTop(): boolean { return this.selectedIndex() <= 0; }
	isAtBottom(): boolean { const i = this.selectedIndex(); return i >= this._rows.length - 1; }
	/** Exit tree: return to editor, clear selection. */
	exit(): void { this.surface = "editor"; this.selectedSessionId = null; }
}
```

- [ ] **Step 4: run** — PASS for T3-side, O6-side, T2-side.
- [ ] **Step 5: commit** — `feat(ev8): add TreeFocusState controller + pure navigation helpers`

---

## Task 2: editor-surface + tree routing (`routeEditorFocus`) — T1/T3/T4

**Files:**
- Modify: `extensions/focus-nav.ts`
- Test: extend `test/ev-focus-navigation.test.ts`

**Interfaces:**
- Produces: `export type EditorRoute = { action: "consumed" } | { action: "forward" }`; `export function routeEditorFocus(controller: TreeState, key: TreeKey, meta: { onLastLogicalLine: boolean; treeOpen: boolean }): EditorRoute`.

- [ ] **Step 1: failing test** — the state machine T3 and forward-unhandled T4:

```ts
test("T3: Down-from-editor enters tree at row 0 only on last logical line", () => {
	const c = treeController(3);
	expect(c.surface).toBe("editor");
	// multi-line, cursor on line 0 → NOT on last logical line → forward (no enter)
	let r = routeEditorFocus(c, "down", { onLastLogicalLine: false, treeOpen: true });
	expect(r.action).toBe("forward");
	expect(c.surface).toBe("editor");
	// last logical line → enter, row 0
	r = routeEditorFocus(c, "down", { onLastLogicalLine: true, treeOpen: true });
	expect(r.action).toBe("consumed");
	expect(c.surface).toBe("tree");
	expect(c.selectedSessionId).toBe("a");
});

test("T3: down moves 0→1; down-at-last stays; up-on-row0 → editor + reset; escape → editor; down-on-last → editor", () => {
	const c = treeController(3);
	c.enter();
	routeEditorFocus(c, "down", { onLastLogicalLine: true, treeOpen: true }); // 0→1
	expect(c.selectedSessionId).toBe("b");
	routeEditorFocus(c, "down", { onLastLogicalLine: true, treeOpen: true }); // 1→2 (last)
	expect(c.selectedSessionId).toBe("c");
	routeEditorFocus(c, "down", { onLastLogicalLine: true, treeOpen: true }); // at last → exit
	expect(c.surface).toBe("editor");
	expect(c.selectedSessionId).toBeNull();
});
test("T3 escape: any row → editor, selection reset", () => {
	const c = treeController(3);
	c.enter(); c.move(1);
	routeEditorFocus(c, "escape", { onLastLogicalLine: true, treeOpen: true });
	expect(c.surface).toBe("editor");
	expect(c.selectedSessionId).toBeNull();
});
test("T3 up-on-row0 → editor + reset; up-non-top → moves", () => {
	const c = treeController(3);
	c.enter(); c.move(1); c.move(1);
	const r = routeEditorFocus(c, "up", { onLastLogicalLine: true, treeOpen: true });
	expect(r.action).toBe("consumed");
	expect(c.selectedSessionId).toBe("b");
	routeEditorFocus(c, "up", { onLastLogicalLine: true, treeOpen: true });
	expect(c.selectedSessionId).toBe("a");
	routeEditorFocus(c, "up", { onLastLogicalLine: true, treeOpen: true }); // at top → exit
	expect(c.surface).toBe("editor");
});
test("T4 forward-unhandled: 'other' key while tree → forward, no surface change", () => {
	const c = treeController(3);
	c.enter();
	const r = routeEditorFocus(c, "other", { onLastLogicalLine: true, treeOpen: true });
	expect(r.action).toBe("forward");
});
```

- [ ] **Step 3: implement**:

```ts
export type EditorRoute = { action: "consumed" } | { action: "forward" };
export function treeOpen(c: TreeState): boolean { return c.isOpen(); }

export function routeEditorFocus(
	controller: TreeState,
	key: TreeKey,
	meta: { onLastLogicalLine: boolean; treeOpen: boolean },
): EditorRoute {
	if (controller.surface === "tree") {
		switch (key) {
			case "up": {
				if (controller.isAtTop()) controller.exit();
				else controller.move(-1);
				return { action: "consumed" };
			}
			case "down": {
				if (controller.isAtBottom()) controller.exit();
				else controller.move(1);
				return { action: "consumed" };
			}
			case "enter":
				// caller triggers the row action; selection preserved (not moved)
				return { action: "consumed" };
			case "escape":
				controller.exit();
				return { action: "consumed" };
			default:
				return { action: "forward" }; // forward-unhandled
		}
	}
	// editor surface
	if (meta.treeOpen && meta.onLastLogicalLine && key === "down") {
		if (controller.enter()) return { action: "consumed" };
	}
	return { action: "forward" };
}
```

- [ ] **Step 4: run** — PASS.
- [ ] **Step 5: commit** — `feat(tree): editor-driven tree-focus state machine with forward-unhandled`

---

## Task 3: `CustomTreeEditor extends CustomEditor` — O3/T1/T4 delivery + O4 composition

**Files:**
- Modify: `extensions/focus-nav.ts`
- Test: extend `test/ev-focus-navigation.test.ts`
- Test helper: `test/helpers/fake-tui.ts` (minimal `TUI` + `EditorTheme`).

**Interfaces:**
- Consumes: `CustomEditor`, `KeybindingsManager` (pi-coding-agent), `TUI`/`EditorTheme`/`EditorComponent` (pi-tui).
- Produces: `export type Activate = (tui: TUI, sessionId: string | null) => void;` `export class CustomTreeEditor extends CustomEditor` and `export function installTreeEditor(ui, controller, onActivate): void; export function restoreTreeEditor(ui, prior: EditorFactory | undefined): void;`

- [ ] **Step 1: failing test** — a fake TUI is expensive to fully instantiate, so
  test the delivery seam via a minimal `TUI` stub (see helper) and an editor built
  by `installTreeEditor` with a spy `prior`:

```ts
// test/helpers/fake-tui.ts
import type { TUI, TuiMode, Component } from "@earendil-works/pi-tui";
export class FakeTUI {
	mode: "tui" = "tui";
	focus: Component | null = null;
	requestRender() {}
	invalidate() {}
	setFocus(c: Component | null) { this.focus = c; }
	getFocusedComponent() { return this.focus; }
	// remaining required TUI members as no-ops as sparse as TS permits
}
```

```ts
test("O4 - prior editor's handleInput still runs for its keys (compose, no clobber)", () => {
	const priorCalls: string[] = [];
	const prior = () => ({ handleInput: (d: string) => { priorCalls.push(d); } });
	const ui = {
		getEditorComponent: () => prior as unknown,
		setEditorComponent: (f) => { uiF = f; },
	};
	const c = new TreeState();
	c.setOpen(true); c.setRows(["a", "b"]);
	installTreeEditor(ui as any, c, () => {});
	let ed;
	ed = (uiF as any)(fakeTui, fakeTheme, fakeKeybinds);
	c.enter();
	// escaped printable 'x' while tree → forwarded to prior
	ed.handleInput("x");
	expect(priorCalls).toEqual(["x"]);
	// tree-handled Down does NOT reach the prior editor (consumed)
	ed.handleInput("\x1b[B");
	expect(priorCalls).toEqual(["x"]);
});
```

- [ ] **Step 2: run** — FAIL (no `CustomTreeEditor`/`installTreeEditor`).

- [ ] **Step 3: implement**:

```ts
export type FocusActivate = (tui: TUI, sessionId: string | null) => void;

export class CustomTreeEditor extends CustomEditor {
	private inner?: EditorComponent;
	constructor(
		tui: TUI,
		theme: EditorTheme,
		keybindings: KeybindingsManager,
		private readonly controller: TreeState,
		private readonly onActivate: FocusActivate,
		priorFactory?: EditorFactory,
		options?: EditorOptions & { onLastLogicalLine?: () => boolean },
	) {
		super(tui, theme, keybindings, options);
		this.inner = priorFactory ? (priorFactory(tui, theme, keybindings) as EditorComponent) : undefined;
	}
	handleInput(data: string): void {
		const key = classifyTreeKey(data);
		const meta = this.editorMeta();
		const r = routeEditorFocus(this.controller, key, meta);
		if (r.action === "consumed") {
			if (key === "enter") this.onActivate(this.tui, this.controller.selectedSessionId);
			this.tui.requestRender();
			return;
		}
		// forward-unhandled: prior editor's behavior keeps running (O4), else base app editor
		if (this.inner) this.inner.handleInput(data);
		else super.handleInput(data);
	}
	private editorMeta() {
		return {
			treeOpen: this.controller.isOpen(),
			onLastLogicalLine: shouldEnterTreeOnDown(this.getCursor().line, this.getLines().length),
		};
	}
	render(width: number): string[] {
		const lines = super.render(width);
		if (this.controller.surface === "tree" && lines.length > 0) {
			const label = TREE_MODE_LABEL;
			const styled = this.borderColor ? this.borderColor(label) : label;
			lines[lines.length - 1] = truncateToWidth(lines[lines.length - 1]!, Math.max(1, width - visibleWidth(styled)), "") + styled;
		}
		return lines;
	}
}

export function installTreeEditor(ui: ExtensionUIContext, controller: TreeStateController, onActivate: FocusActivate, prior?: EditorFactory | undefined): void {
	ui.setEditorComponent((tui, theme, keybindings) => new CustomTreeEditor(tui, theme, keybindings, controller, onActivate, prior));
}
export function restoreTreeEditor(ui: ExtensionUIContext, prior?: EditorFactory | undefined): void {
	ui.setEditorComponent(prior);
}
```

- [ ] **Step 4** — tune the fake helper until it constructs; PASS.

- [ ] **Step 5: commit** — `feat(tree): compose editor-driven CustomEditor with prior-editor delegation`

---

## Task 4: widget marker + controller rows (T7/T6/T8) + wiring into `navigator.ts`

**Files:**
- Modify: `extensions/navigator.ts`
- Test: extend `test/ev-focus-navigation.test.ts`

**Interfaces:**
- Consumes: `CustomTreeEditor` install/restore; `TreeStateController`; `CouncilTreeWidget`.
- Produces: modified `registerNavigator` (toggle installs editor + controller), `CouncilTreeWidget` now accepts a `controller?` and draws the ▌ marker where surface==="tree" and `sessionId === selectedSessionId`.

- [ ] **Step 1: failing test** (render T8):

```ts
test("T8: ▌ marker appears on the selected row only when surface==='tree'; no row overflows MAX_WIDGET_LINES", () => {
	// build widget over a fixture root w/ 2 running jobs, identity theme
	const controller = new TreeState();
	controller.setOpen(true);
	controller.setRows(["job-r1", "job-r2"]);
	controller.enter(); // selects job-r1
	const w = new CouncilTreeWidget(root, () => runId, theme, { now, controller });
	const inTree = w.render(200).join("\n");
	const line0 = w.render(200)[0]!;
	expect(line0.startsWith(TREE_ROW_MARKER)).toBe(true);
	expect(inTree).not.toMatch(/\u258C/); // only ONE marker row
	expect(w.render(200)).toHaveLength(10); // budget unchanged
});
```

- [ ] **Step 2: run** — FAIL (widget has no controller param).

- [ ] **Step 3: implement**:
  - `CouncilTreeWidget` ctor gains optional `controller?: TreeStateController`. In `refresh()` after building `ordered` rows, call `this.controller?.setRows(ordered.map(n => n.node.manifest.sessionId))`.
  - In `render()`, for each windowed row, when `controller.surface === "tree"` and `node.manifest.sessionId === controller.selectedSessionId`, prefix `theme.fg("accent", TREE_ROW_MARKER + " ")` and truncate to `width` (marker is 1 column + space; keep budget).
  - In `registerNavigator`: create one `const controller = new TreeState()`; in `toggleWidget` open path set `controller.setOpen(true)` + call `installTreeEditor(ctx.ui, controller, onActivate)`; close path `ctx.ui.setWidget(KEY, undefined)`; `controller.setOpen(false)`; `restoreTreeEditor(ctx.ui, prior)`. On `session_shutdown` call restore + `controller.setOpen(false)`.
  - `onActivate = (tui, sessionId) => { const node = resolveSession(repoRoot, currentRunId(), sessionId); if (node) openTranscript(ctx, tui, repoRoot, node, runId); }`.

- [ ] **Step 4: run** — PASS. (Reuse the ev7 fixture helpers — copy them into the new test file.)

- [ ] **Step 5: commit** — `feat(tree): sessionId-keyed ▌ marker and editor wiring for the inline tree`

---

## Task 5: session_shutdown editorend teardown + index.ts

**Files:**
- Modify: `extensions/index.ts` (`session_shutdown` handler)
- Test: extend T7 assertion (teardown already covered by widget teardown test; editing index is structural).

- [ ] **Step 1: failing test** — none new (the existing `test/navigator.test.ts` `session_shutdown`-related test still passes). This task is a wiring change; its gate is `bun test` staying green + `tsc`.

- [ ] **Step 3: implement** — in `index.ts` `session_shutdown` handler, after `clearTreeWidget(ctx)`, call `teardownFocus(ctx)` exported from navigator (set surface=editor — a no-op if open; restore prior editor via `restoreTreeEditor(ctx, prior)`). Keep the change minimal and do NOT touch `hub.ts`.

- [ ] **Step 4** — `bun test` green; `tsc` clean.
- [ ] **Step 5: commit** — `fix(tree): restore editor + reset focus surface on session_shutdown`

---

## Gates (run in order, worktree root)

1. `bunx tsc --noEmit` → clean.
2. `bun test` → baseline (239 pass) + new EV-8 tests, green.
3. `python3 council/validate.py` → `All council artifacts valid`.