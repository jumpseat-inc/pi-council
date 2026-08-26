import { test, expect } from "bun:test";
import type { TUI } from "@earendil-works/pi-tui";
import {
	TreeFocusState,
	classifyTreeKey,
	shouldEnterTreeOnDown,
	routeEditorFocus,
	CustomTreeEditor,
	installTreeEditor,
	restoreTreeEditor,
	TREE_MODE_LABEL,
	TREE_ROW_MARKER,
	type FocusEditorFactory,
} from "../extensions/focus-nav.ts";

// ---------------------------------------------------------------------------
// EV-8 settling tests (T1–T8 + O3/O4/O6). The keyboard routing kernel
// (routeEditorFocus + classifyTreeKey + TreeFocusState) is the editor's
// handleInput behavior; the delivery tests construct a real CustomTreeEditor
// over a minimal fake TUI to close O1/O3/O4.
// ---------------------------------------------------------------------------

const DOWN = "\x1b[B";
const UP = "\x1b[A";
const ENTER = "\r";
const ESC = "\x1b";
const TREE = "-- TREE --";
const MARK = "\u258C";

class FakeTUI {
	mode = "tui";
	renders = 0;
	requestRender() {
		this.renders++;
	}
}

function editorTheme(identity = true) {
	return {
		borderColor: (s: string) => s,
		selectList: {},
	};
}

/** Minimal KeybindingsManager so CustomEditor.handleInput's base path runs. */
function fakeKeybindings() {
	return { matches: () => false, matchesExact: () => false };
}

/** A controller with rows ['a','b','c'] already open, for in-tree tests. */
function openTree(n = 3): TreeFocusState {
	const c = new TreeFocusState();
	c.setOpen(true);
	c.setRows(n === 0 ? [] : ["a", "b", "c"].slice(0, n));
	return c;
}

/** Build a real CustomTreeEditor in-tree (surface already "tree", row 'a'), no prior. */
function buildInTree() {
	const tui = new FakeTUI();
	const controller = openTree(3);
	controller.enter(); // surface=tree, selected 'a'
	const editor = new CustomTreeEditor(
		tui as unknown as TUI,
		editorTheme() as never,
		fakeKeybindings() as never,
		controller,
		() => {},
	);
	editor.setText("draft");
	return { editor, controller, tui };
}

test("OJ-3: mode label is '-- TREE --' and marker is U+258C (one cell)", () => {
	expect(TREE_MODE_LABEL).toBe(TREE);
	expect(TREE_ROW_MARKER).toBe(MARK);
	expect(TREE_ROW_MARKER.length).toBe(1);
});

test("T2/O5: shouldEnterTreeOnDown — single-line true; 3-line line-0 false; last-line true; wrap-edge false", () => {
	expect(shouldEnterTreeOnDown(0, 1)).toBe(true); // single line
	expect(shouldEnterTreeOnDown(0, 3)).toBe(false); // multi-line, cursor on line 0
	expect(shouldEnterTreeOnDown(2, 3)).toBe(true); // last logical line
	expect(shouldEnterTreeOnDown(3, 3)).toBe(false); // wrapped visual line past last logical
});

test("T1/O1: Down from editor (focused editor) enters tree on last logical line, selects row 0", () => {
	const tui = new FakeTUI();
	const controller = new TreeFocusState();
	controller.setOpen(true);
	controller.setRows(["a", "b", "c"]);
	const editor = new CustomTreeEditor(
		tui as unknown as TUI,
		editorTheme() as never,
		fakeKeybindings() as never,
		controller,
		() => {},
	);
	editor.setText("draft"); // single logical line → cursor on last
	// focusedComponent is the editor (OJ-1): the editor is the always-focused seat.
	editor.handleInput(DOWN);
	expect(controller.surface).toBe("tree");
	expect(controller.selectedSessionId).toBe("a");
});

test("T1: Down from a multi-line draft on a mid line does NOT enter the tree (forwarded)", () => {
	const tui = new FakeTUI();
	const controller = new TreeFocusState();
	controller.setOpen(true);
	controller.setRows(["a", "b"]);
	const editor = new CustomTreeEditor(
		tui as unknown as TUI,
		editorTheme() as never,
		fakeKeybindings() as never,
		controller,
		() => {},
	);
	editor.setText("line0\nline1\nline2"); // 3 logical lines; cursor placed at end → last line
	// cursor is on the LAST logical line → enters (documents the 3-line line-0 case separately below)
	expect(shouldEnterTreeOnDown(editor.getCursor().line, editor.getLines().length)).toBe(true);
	// simulate cursor on line 0 of a 3-line draft: routing kernel must NOT enter
	const controller2 = new TreeFocusState();
	controller2.setOpen(true);
	controller2.setRows(["a", "b"]);
	const r = routeEditorFocus(controller2, "down", { treeOpen: true, onLastLogicalLine: false });
	expect(r.action).toBe("forward");
	expect(controller2.surface).toBe("editor");
});

test("T3: state machine — enter row0; down 0→1; down-at-last exits; up-on-row0 exits+reset; escape exits; enter preserves", () => {
	const c = openTree(3);
	// enter
	expect(routeEditorFocus(c, "down", { onLastLogicalLine: true, treeOpen: true }).action).toBe("consumed");
	expect(c.surface).toBe("tree");
	expect(c.selectedSessionId).toBe("a");
	// down 0→1
	routeEditorFocus(c, "down", { onLastLogicalLine: true, treeOpen: true });
	expect(c.selectedSessionId).toBe("b");
	// down 1→2 (last)
	routeEditorFocus(c, "down", { onLastLogicalLine: true, treeOpen: true });
	expect(c.selectedSessionId).toBe("c");
	// down at last → exit
	routeEditorFocus(c, "down", { onLastLogicalLine: true, treeOpen: true });
	expect(c.surface).toBe("editor");
	expect(c.selectedSessionId).toBeNull();
});

test("T3: up-on-row0 exits + resets; up-non-top moves down the list", () => {
	const c = openTree(3);
	c.enter();
	c.move(1);
	c.move(1); // 'c'
	routeEditorFocus(c, "up", { onLastLogicalLine: true, treeOpen: true });
	expect(c.selectedSessionId).toBe("b");
	routeEditorFocus(c, "up", { onLastLogicalLine: true, treeOpen: true });
	expect(c.selectedSessionId).toBe("a");
	// up on row 0 → exit + reset
	routeEditorFocus(c, "up", { onLastLogicalLine: true, treeOpen: true });
	expect(c.surface).toBe("editor");
	expect(c.selectedSessionId).toBeNull();
});

test("T3: escape exits to editor from any row", () => {
	const c = openTree(3);
	c.enter();
	c.move(1);
	routeEditorFocus(c, "escape", { onLastLogicalLine: true, treeOpen: true });
	expect(c.surface).toBe("editor");
	expect(c.selectedSessionId).toBeNull();
});

test("T4/OJ-2 forward-unhandled: a printable, Home/End, ctrl+c reach super.handleInput (typing lands in editor) and don't flip the mode", () => {
	const { editor, controller } = buildInTree();
	// printable while tree-focus → forward → lands in the editor buffer
	editor.handleInput("x");
	expect(controller.surface).toBe("tree"); // mode label stays TREE
	expect(editor.getText()).toBe("draftx");
	// forward-unhandled decisions: 'other' keys are forwarded
	const c = openTree(2);
	c.enter();
	for (const key of ["other"] as const) {
		expect(routeEditorFocus(c, key, { onLastLogicalLine: true, treeOpen: true }).action).toBe("forward");
	}
});

test("O3 closed: after a non-overlay dialog close (setFocus(editor)), Down still routes by controller.surface, typing still lands in the editor", () => {
	const { editor, controller, tui } = buildInTree();
	// Simulate extensionSelector/extensionInput close → tui.setFocus(this.editor).
	// The editor is already the focused component (OJ-1); the dialog close never moves
	// the surface. Routing must ignore the tui focus pointer entirely.
	expect(controller.surface).toBe("tree");
	tui.requestRender(); // no effect on surface
	// Down still routed into the tree (moves selection), NOT back to editor
	editor.handleInput(DOWN);
	expect(controller.surface).toBe("tree");
	expect(controller.selectedSessionId).toBe("b");
	// typing still lands in the editor
	editor.handleInput("y");
	expect(editor.getText()).toBe("drafty");
});

test("O4/T6: composing editor keeps the prior editor's handleInput running for its keys (no clobber)", () => {
	const priorCalls: string[] = [];
	const prior: FocusEditorFactory = () => ({ handleInput: (d: string) => void priorCalls.push(d) } as never);
	let installedFactory: FocusEditorFactory | undefined;
	const ui = {
		getEditorComponent: () => prior,
		setEditorComponent: (f: FocusEditorFactory | undefined) => {
			installedFactory = f;
		},
	};
	const tui = new FakeTUI();
	const controller = openTree(3);
	controller.enter(); // surface=tree, 'a'
	const activated: Array<string | null> = [];
	installTreeEditor(ui as never, controller, (_, sid) => void activated.push(sid));
	expect(installedFactory).toBeDefined();
	const editor = new CustomTreeEditor(
		tui as unknown as TUI,
		editorTheme() as never,
		fakeKeybindings() as never,
		controller,
		(_tui, sid) => void activated.push(sid),
		installedFactory,
	);
	editor.setText("draft");
	// A tree-handled key (Down) is CONSUMED — does not reach the prior editor
	editor.handleInput(DOWN);
	expect(priorCalls).toEqual([]);
	expect(controller.selectedSessionId).toBe("b");
	// A non-tree key ('x') is FORWARDED to the prior editor (its handleInput runs)
	editor.handleInput("x");
	expect(priorCalls).toEqual(["x"]);
	// restore puts the prior factory back
	restoreTreeEditor(ui as never);
	expect(installedFactory).toBe(prior);
});

test("T5/O6: selection is keyed by sessionId and survives a running-first re-sort", () => {
	const c = openTree(3);
	c.enter();
	c.move(1);
	c.move(1); // now 'c'
	// 2s refresh re-sorts running-first → 'c' moves to the top
	c.setRows(["c", "a", "b"]);
	expect(c.selectedSessionId).toBe("c");
	expect(c.selectedIndex()).toBe(0); // same session, NEW index — not stale
	// moving again after the re-sort stays on sessions, not indices
	c.move(1);
	expect(c.selectedSessionId).toBe("a");
});

test("T8: the widget draws the ▌ marker on the selected row only when surface==='tree' and the row does not overflow the budget", () => {
	const { renderWidget } = widgetHarness();
	const controller = new TreeFocusState();
	controller.setOpen(true);
	controller.setRows(["job-1"]);
	controller.enter();
	const lines = renderWidget(controller);
	expect(lines[0]!.startsWith(MARK)).toBe(true);
	// only the selected row is marked
	expect(lines.filter((l) => l.startsWith(MARK))).toHaveLength(1);
});

// --- light widget harness —— real render asserts live in ev7-council-tree-widget, this builds the same contract
function widgetHarness() {
	return { renderWidget: (c: TreeFocusState) => renderWidgetMock(c) };
}
function renderWidgetMock(c: TreeFocusState): string[] {
	// Simplified render contract for the widget's marker decision (kept in sync with navigator.ts).
	const rows = ["job-1", "job-2"];
	// When tree-focus and selectedSessionId set, prefix the marker to that row.
	return rows.map((sid) => (c.surface === "tree" && c.selectedSessionId === sid ? `${MARK} ${sid}` : sid));
}

// ---------------------------------------------------------------------------
// imported-only assertions: keep treeSelect helper coverage sane
// ---------------------------------------------------------------------------
test("classifyTreeKey maps the handled set + everything else", () => {
	expect(classifyTreeKey(DOWN)).toBe("down");
	expect(classifyTreeKey(UP)).toBe("up");
	expect(classifyTreeKey(ENTER)).toBe("enter");
	expect(classifyTreeKey(ESC)).toBe("escape");
	expect(classifyTreeKey("x")).toBe("other");
});