import { test, expect } from "bun:test";
import {
	TreeFocusState,
	classifyProgressKey,
	computeProgressLayout,
	type Surface,
} from "../extensions/focus-nav.ts";

const DOWN = "\x1b[B";
const UP = "\x1b[A";
const ENTER = "\r";
const ESC = "\x1b";

test("T5/O2: Surface union is widened to 'progress' (compile-enforced union, not a flag)", () => {
	const e: Surface = "editor";
	expect(e).toBe("editor");
	const t: Surface = "tree";
	expect(t).toBe("tree");
	const p: Surface = "progress";
	expect(p).toBe("progress");
});

test("classifyProgressKey: Enter/Escape/Up/Down/e/t/f/g/G sentinel + view keys, everything else 'other'", () => {
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
		const result = c.enterProgress("b");
		expect(result).toBe(false);
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

// ---------------------------------------------------------------------------
// Upper-bound viewport formula (owner obligation): for every termRows ∈ {7..11}
// the invariant treeLines + sep + progressLines <= avail with both >= 1 must hold.
// ---------------------------------------------------------------------------

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

test("tiny-regime pins: (7,·)→(1,0,1); (8,5)→(1,1,1) fixed from the old (1,2) overflow; (9,·)→(2,1,1); (11,·)→(4,1,1)", () => {
	expect(computeProgressLayout(7, 5)).toEqual({ avail: 2, sepLines: 0, treeLines: 1, progressLines: 1 });
	expect(computeProgressLayout(8, 5)).toEqual({ avail: 3, sepLines: 1, treeLines: 1, progressLines: 1 });
	expect(computeProgressLayout(9, 11)).toEqual({ avail: 4, sepLines: 1, treeLines: 2, progressLines: 1 });
	expect(computeProgressLayout(11, 11)).toEqual({ avail: 6, sepLines: 1, treeLines: 4, progressLines: 1 });
});

test("normal-regime pins unchanged: (12,8)→(3,1,3); (24,8)→(8,1,10); (40,11)→(11,1,23)", () => {
	expect(computeProgressLayout(12, 8)).toEqual({ avail: 7, sepLines: 1, treeLines: 3, progressLines: 3 });
	expect(computeProgressLayout(24, 8)).toEqual({ avail: 19, sepLines: 1, treeLines: 8, progressLines: 10 });
	expect(computeProgressLayout(40, 11)).toEqual({ avail: 35, sepLines: 1, treeLines: 11, progressLines: 23 });
});