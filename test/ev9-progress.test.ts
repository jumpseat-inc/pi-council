import { test, expect } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import type { TUI } from "@earendil-works/pi-tui";
import {
	TreeFocusState,
	CustomTreeEditor,
	classifyProgressKey,
	computeProgressLayout,
	type Surface,
	type FocusEditorFactory,
} from "../extensions/focus-nav.ts";
import { CouncilTreeWidget, TranscriptView } from "../extensions/navigator.ts";
import { ensureRunDir, writeManifest, runDir, type RunManifest } from "../extensions/runs.ts";

const DOWN = "\x1b[B";
const UP = "\x1b[A";
const ENTER = "\r";
const ESC = "\x1b";

// --- helpers to drive a real CustomTreeEditor through handleInput (delivery path) ---
class FakeTUI {
	mode = "tui";
	requestRender() {}
}
function editorTheme() {
	return { borderColor: (s: string) => s, selectList: {} };
}
function fakeKeybindings() {
	return { matches: () => false, matchesExact: () => false };
}

// ---------------------------------------------------------------------------
// Cycle 1 (fail-first RED → GREEN): surface union, controller methods,
// classifyProgressKey, and the upper-bound-fixed viewport layout.
// ---------------------------------------------------------------------------

test("T5/O2: Surface union is widened to 'progress' (compile-enforced union, not a flag)", () => {
	const e: Surface = "editor";
	expect(e).toBe("editor");
	const t: Surface = "tree";
	expect(t).toBe("tree");
	const p: Surface = "progress";
	expect(p).toBe("progress");
});

test("classifyProgressKey: Enter/Escape/Up/Down/e/t/f/g(shift+g)/G sentinel + view keys, everything else 'other'", () => {
	expect(classifyProgressKey(ENTER)).toBe("enter");
	expect(classifyProgressKey(ESC)).toBe("escape");
	expect(classifyProgressKey(UP)).toBe("up");
	expect(classifyProgressKey(DOWN)).toBe("down");
	expect(classifyProgressKey("e")).toBe("e");
	expect(classifyProgressKey("t")).toBe("t");
	expect(classifyProgressKey("f")).toBe("f");
	expect(classifyProgressKey("g")).toBe("g");
	expect(classifyProgressKey("G")).toBe("G"); // shift+g arrives as legacy uppercase "G"
	expect(classifyProgressKey("x")).toBe("other");
});

test("T1/O1-lower (ruling): termRows in {5,6} → enterProgress is a consumed no-op (surface stays tree, selection unchanged)", () => {
	for (const rows of [5, 6]) {
		const c = new TreeFocusState();
		c.termRowsCap = rows;
		c.setOpen(true);
		c.setRows(["a", "b", "c"]);
		c.enter();
		expect(c.surface).toBe("tree");
		const before = c.selectedSessionId;
		expect(c.enterProgress("b")).toBe(false);
		expect(c.surface).toBe("tree"); // no transition to progress
		expect(c.selectedSessionId).toBe(before); // selection untouched
	}
});

test("T3/T12: enterProgress opens progress at termRows>=7, sets selectedSessionId", () => {
	const c = new TreeFocusState();
	c.termRowsCap = 24;
	c.setOpen(true);
	c.setRows(["a", "b", "c"]);
	c.enter();
	expect(c.enterProgress("b")).toBe(true);
	expect(c.surface).toBe("progress");
	expect(c.selectedSessionId).toBe("b");
});

test("enterProgress on a widget-less (not open) controller returns false, no transition", () => {
	const c = new TreeFocusState();
	c.termRowsCap = 24;
	c.setRows(["a"]);
	expect(c.enterProgress("a")).toBe(false);
	expect(c.surface).toBe("editor");
});

test("T7/O3 (closed-red): backFromProgress returns to tree preserving selectedSessionId; exit() would null it", () => {
	const c = new TreeFocusState();
	c.termRowsCap = 24;
	c.setOpen(true);
	c.setRows(["a", "b"]);
	c.enter(); // selects 'a'
	c.enterProgress("b"); // surface progress, selected 'b'
	expect(c.surface).toBe("progress");
	expect(c.selectedSessionId).toBe("b");
	c.backFromProgress();
	expect(c.surface).toBe("tree");
	expect(c.selectedSessionId).toBe("b"); // preserved by design, NOT nulled
	// control: a naive exit() would null selection — O3 closed-red guard
	c.exit();
	expect(c.surface).toBe("editor");
	expect(c.selectedSessionId).toBeNull();
});

test("T4 upper-bound: for every termRows in {7..11} and representative treeContentLines, tree+sep+progress <= avail AND each >= 1", () => {
	for (let tr = 7; tr <= 11; tr++) {
		for (const rc of [1, 3, 5, 8, 11, 20]) {
			const l = computeProgressLayout(tr, rc);
			const avail = Math.max(1, tr - 5);
			expect(l.avail).toBe(avail);
			// the upper-bound invariant the flagged formula violated pre-fix:
			expect(l.treeLines + l.sepLines + l.progressLines).toBeLessThanOrEqual(avail);
			expect(l.treeLines).toBeGreaterThanOrEqual(1);
			expect(l.progressLines).toBeGreaterThanOrEqual(1);
		}
	}
});

test("tiny-regime pins: (7)|(1,0,1); (8,5)→(1,1,1) fixed from the old (1,2)  overflow; (9,·)→(2,1,1); (11,·)→(4,1,1)", () => {
	expect(computeProgressLayout(7, 5)).toEqual({ avail: 2, treeLines: 1, sepLines: 0, progressLines: 1 });
	expect(computeProgressLayout(8, 5)).toEqual({ avail: 3, treeLines: 1, sepLines: 1, progressLines: 1 });
	expect(computeProgressLayout(9, 11)).toEqual({ avail: 4, treeLines: 2, sepLines: 1, progressLines: 1 });
	expect(computeProgressLayout(11, 11)).toEqual({ avail: 6, treeLines: 4, sepLines: 1, progressLines: 1 });
});

test("normal-regime pins unchanged: (12,8)→(3,1,3); (24,8)→(8,1,10); (40,11)→(11,1,23)", () => {
	expect(computeProgressLayout(12, 8)).toEqual({ avail: 7, treeLines: 3, sepLines: 1, progressLines: 3 });
	expect(computeProgressLayout(24, 8)).toEqual({ avail: 19, treeLines: 8, sepLines: 1, progressLines: 10 });
	expect(computeProgressLayout(40, 11)).toEqual({ avail: 35, treeLines: 11, sepLines: 1, progressLines: 23 });
});

// ---------------------------------------------------------------------------
// Cycle 2 (widget + editor): inline progress rendering, delivery, cache, clocks.
// ---------------------------------------------------------------------------

const theme = {
	fg: (_c: string, s: string) => s,
	bold: (s: string) => s,
	bg: (_c: string, s: string) => s,
};
const NOW = Date.parse("2026-01-01T00:05:00.000Z");
const now = () => NOW;

function m(id: string, over: Partial<RunManifest> = {}): RunManifest {
	return {
		id,
		seat: "owner",
		model: "m/x",
		parentJobId: null,
		pid: process.pid,
		sessionId: id,
		state: "running",
		startedAt: Date.parse("2026-01-01T00:00:00.000Z"),
		settledAt: null,
		exitCode: null,
		...over,
	};
}

function writeSession(root: string, runId: string, sessionId: string, lines: string[]): void {
	const file = path.join(runDir(root, runId), `${sessionId}.jsonl`);
	const header = `{"type":"session","version":3,"id":"${sessionId}","timestamp":"t","cwd":"/x"}`;
	fs.writeFileSync(file, [header, ...lines].join("\n") + "\n");
}

function toolLine(id: string, ts: string, name = "bash", arg = "ls -la"): string {
	return `{"type":"message","id":"${id}","parentId":null,"timestamp":"${ts}","message":{"role":"assistant","content":[{"type":"toolCall","id":"c${id}","name":"${name}","arguments":{"command":"${arg}"}}]}}`;
}

test("T3 progress inline at term=7: tree row + a progress header, total <= avail", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "ev9-t7-"));
	const runId = "r7";
	ensureRunDir(root, runId);
	writeManifest(root, runId, m("job-1"));
	writeSession(root, runId, "job-1", []);
	const c = new TreeFocusState();
	c.termRowsCap = 7;
	const w = new CouncilTreeWidget(root, () => runId, theme, { now, controller: c, termRowsCap: 7 });
	w.render(200);
	c.setOpen(true);
	w.render(200);
	c.enter();
	expect(c.surface).toBe("tree");
	expect(c.enterProgress("job-1")).toBe(true);
	const lines = w.render(200);
	// avail = max(1, 7-5) = 2; tree row + transcript header
	expect(lines.length).toBeLessThanOrEqual(2);
	expect(lines[0]).toContain("owner"); // tree row visible
	expect(lines.length).toBeGreaterThanOrEqual(1);
});

test("O1 floor (widget-level): at termRows 5/6 Enter stays tree, lines<=avail, tree row visible", () => {
	for (const rows of [5, 6]) {
		const root = fs.mkdtempSync(path.join(os.tmpdir(), `ev9-f-${rows}-`));
		const runId = "rf";
		ensureRunDir(root, runId);
		writeManifest(root, runId, m("job-1"));
		const c = new TreeFocusState();
		c.termRowsCap = rows;
		const w = new CouncilTreeWidget(root, () => runId, theme, { now, controller: c, termRowsCap: rows });
		w.render(200);
		c.setOpen(true);
		w.render(200);
		c.enter();
		expect(c.surface).toBe("tree");
		expect(c.enterProgress("extra")).toBe(false); // guard blocks
		expect(c.surface).toBe("tree");
		const lines = w.render(200);
		expect(lines.length).toBeLessThanOrEqual(Math.max(1, rows - 5)); // <= avail
		expect(lines.length).toBeGreaterThanOrEqual(1);
		expect(lines[0]).toContain("owner"); // tree row remains visible
	}
});

test("O5: a job landing during progress — invalidate() stale, refresh() re-syncs rows and controller", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "ev9-o5-"));
	const runId = "ro5";
	ensureRunDir(root, runId);
	writeManifest(root, runId, m("job-1"));
	writeSession(root, runId, "job-1", [toolLine("1", "2026-01-01T00:04:00.000Z")]);
	const c = new TreeFocusState();
	c.termRowsCap = 24;
	const w = new CouncilTreeWidget(root, () => runId, theme, { now, controller: c, termRowsCap: 24 });
	w.render(200);
	c.setOpen(true);
	c.enter();
	c.enterProgress("job-1");
	w.render(200); // cache progress for job-1
	// new job lands during progress
	writeManifest(root, runId, m("job-2", { seat: "skeptic", state: "done", settledAt: NOW - 60_000 }));
	w.invalidate(); // invalidate() alone does NOT re-read the row list
	expect(w.render(200).join("\n")).not.toContain("skeptic"); // stale row list
	w.refresh(); // onChange→refresh path: re-reads rows + clears cache
	expect(w.render(200).join("\n")).toContain("skeptic"); // row appeared
	c.backFromProgress();
	expect(c.surface).toBe("tree");
	expect(c.selectedSessionId).toBe("job-1"); // selection preserved
	expect(w.render(200).join("\n")).toContain("skeptic");
});

test("T9 cache folds the surface; T12-negative: ▌ hidden when surface ≠ 'tree', reappears on return", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "ev9-t9-"));
	const runId = "rt9";
	ensureRunDir(root, runId);
	writeManifest(root, runId, m("job-1"));
	const c = new TreeFocusState();
	c.termRowsCap = 24;
	const w = new CouncilTreeWidget(root, () => runId, theme, { controller: c, termRowsCap: 24 });
	c.setOpen(true);
	w.render(200);
	c.enter();
	c.enterProgress("job-1");
	const inProgress = w.render(200);
	expect(inProgress.join("\n")).not.toContain("\u258C"); // marker hidden in progress
	c.backFromProgress();
	expect(w.render(200).join("\n")).toContain("\u258C"); // marker restored on tree
});

test("T11 parity (block-renderer level): inline progress view lines == standalone TranscriptView with same JSONL+width+viewportRows", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "ev9-t11-"));
	const runId = "rt11";
	ensureRunDir(root, runId);
	writeManifest(root, runId, m("job-1"));
	writeSession(root, runId, "job-1", [
		toolLine("1", "2026-01-01T00:04:00.000Z"),
		toolLine("2", "2026-01-01T00:04:30.000Z"),
	]);
	const c = new TreeFocusState();
	c.termRowsCap = 24;
	const w = new CouncilTreeWidget(root, () => runId, theme, { now, controller: c, termRowsCap: 24 });
	c.setOpen(true);
	w.render(200);
	c.enter();
	c.enterProgress("job-1");
	w.render(200); // build the inline progress view
	const inlineView = w.activeTranscriptView;
	expect(inlineView).toBeInstanceOf(TranscriptView);
	const width = 80;
	const inlineLines = inlineView!.render(width);
	// a freshly-constructed TranscriptView with the same JSONL + width + viewportRows
	// is byte-identical (the same block renderer the modal path reuses).
	const vp = computeProgressLayout(24, 1).progressLines;
	const standalone = new TranscriptView(
		path.join(runDir(root, runId), "job-1.jsonl"),
		theme,
		"job-1 owner",
		vp,
		() => {},
	);
	expect(standalone.render(width)).toEqual(inlineLines);
});

test("T10 dual-clock: widget.dispose() clears the 1s transcript timer (onChange stops firing on appended lines)", async () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "ev9-t10-"));
	const runId = "rt10";
	ensureRunDir(root, runId);
	writeManifest(root, runId, m("job-1"));
	const file = path.join(runDir(root, runId), "job-1.jsonl");
	writeSession(root, runId, "job-1", [toolLine("1", "2026-01-01T00:04:00.000Z")]);
	const c = new TreeFocusState();
	c.termRowsCap = 24;
	const w = new CouncilTreeWidget(root, () => runId, theme, { now, controller: c, termRowsCap: 24 });
	c.setOpen(true);
	w.render(200);
	c.enter();
	c.enterProgress("job-1");
	w.render(200); // build the inline progress view
	const view = w.activeTranscriptView!;
	let onChangeCalls = 0;
	view.setOnChange(() => { onChangeCalls++; });
	// append a new line; with the 1s clock still alive onChange would fire after a tick
	w.dispose(); // clears the view's 2s.../1s clocks
	fs.appendFileSync(file, toolLine("9", "2026-01-01T00:04:59.000Z") + "\n");
	await new Promise((r) => setTimeout(r, 1300));
	expect(onChangeCalls).toBe(0); // timer cleared on dispose
});

// ---------------------------------------------------------------------------
// Cycle 3 (fix-round, Skeptic closed-red): Enter from the inline tree actually
// opens inline progress — the user-reachable delivery path. This was the one
// blocking item: the tree rendered progress but Enter still routed to the
// modal onActivate. The Enter path below goes through a real
// CustomTreeEditor.handleInput(ENTER) so it exercises the production wiring,
// not a direct controller call.
// ---------------------------------------------------------------------------

test("Integration (Skeptic closed-red): Enter on a highlighted tree row through handleInput → surface transitions to 'progress', selection preserved", () => {
	const tui = new FakeTUI();
	const controller = new TreeFocusState();
	controller.termRowsCap = 24; // above the floor so enceProgress is allowed
	controller.setOpen(true);
	controller.setRows(["a", "b", "c"]);
	controller.enter(); // surface=tree, selected 'a'

	const editor = new CustomTreeEditor(
		tui as unknown as TUI,
		editorTheme() as never,
		fakeKeybindings() as never,
		controller,
		() => {}, // onActivate stays present but must NOT be the Enter path
	);
	editor.setText("draft");

	expect(controller.surface).toBe("tree");
	controller.move(1); // highlight row 'b'
	expect(controller.selectedSessionId).toBe("b");

	editor.handleInput(ENTER);

	expect(controller.surface).toBe("progress"); // Enter opens inline progress, NOT the modal
	expect(controller.selectedSessionId).toBe("b"); // selected session preserved + opened
});

test("Integration (Skeptic closed-red): Enter at the tiny regime (termRows 6) is a consumed no-op — surface stays 'tree'", () => {
	const tui = new FakeTUI();
	const controller = new TreeFocusState();
	controller.termRowsCap = 6; // below DISPLAY_FLOOR(7)
	controller.setOpen(true);
	controller.setRows(["a", "b", "c"]);
	controller.enter(); // surface=tree, selected 'a'

	const editor = new CustomTreeEditor(
		tui as unknown as TUI,
		editorTheme() as never,
		fakeKeybindings() as never,
		controller,
		() => {},
	);
	editor.setText("draft");

	expect(controller.surface).toBe("tree");
	editor.handleInput(ENTER);
	expect(controller.surface).toBe("tree"); // guard: no transition at termRows < 7
	expect(controller.selectedSessionId).toBe("a"); // selection untouched
});