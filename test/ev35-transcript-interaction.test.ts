import { test, expect } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import type { TUI, EditorComponent } from "@earendil-works/pi-tui";
import {
	CustomTreeEditor,
	TreeFocusState,
	classifyProgressKey,
	routeEditorFocus,
	type RouteKey,
	type RouteMeta,
} from "../extensions/focus-nav.ts";
import { TranscriptView } from "../extensions/navigator.ts";

const theme = { fg: (_c: string, s: string) => s, bold: (s: string) => s, bg: (_c: string, s: string) => s };

class FakeTUI {
	mode = "tui";
	requestRender() {}
}
function fakeKeybindings() {
	return { matches: () => false, matchesExact: () => false };
}

function headerLine(id: string): string {
	return `{"type":"session","version":3,"id":"${id}","timestamp":"t","cwd":"/x"}`;
}
function callLine(name: string, arg: string, id?: string): string {
	const idPart = id != null ? `"id":"${id}",` : "";
	return `{"type":"message","id":"m-${name}-${arg}","parentId":null,"timestamp":"t","message":{"role":"assistant","content":[{${idPart}"type":"toolCall","name":"${name}","arguments":{"command":"${arg}"}}]}}`;
}
function resultLine(callId: string | undefined, text: string, isError?: boolean): string {
	const idPart = callId != null ? `"toolCallId":"${callId}",` : "";
	const errPart = isError != null ? `,"isError":${isError}` : "";
	return `{"type":"message","id":"r-${text}","parentId":null,"timestamp":"t","message":{"role":"toolResult",${idPart}"toolName":"bash","content":[{"type":"text","text":"${text}"}]${errPart}}}`;
}
function userLine(text: string): string {
	return `{"type":"message","id":"u-${text}","parentId":null,"timestamp":"t","message":{"role":"user","content":[{"type":"text","text":"${text}"}]}}`;
}
function thinkingLine(text: string): string {
	return `{"type":"message","id":"th-${text}","parentId":null,"timestamp":"t","message":{"role":"assistant","content":[{"type":"thinking","thinking":"${text}"}]}}`;
}

function fixtureView(name: string, lines: string[], viewportRows = 24): TranscriptView {
	const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), `ev35-${name}-`)), "s.jsonl");
	fs.writeFileSync(file, [headerLine(name), ...lines].join("\n") + "\n");
	return new TranscriptView(file, theme, `${name} seat`, viewportRows, () => {});
}

const DOWN = "\x1b[B";
const UP = "\x1b[A";

// --- O2 (maxTop===0-scoped): the header advertises g/G; follow state is (on) presence/absence ---

test("O2 header: fresh view advertises 'g/G jump' and 'f follow(on)'; after f the suffix is absent (Q3 presence/absence)", () => {
	const view = fixtureView("hdr", [callLine("bash", "echo one", "c1"), resultLine("c1", "one")]);
	const fresh = view.render(80); // fixture fits the viewport → maxTop === 0, header is row 0
	expect(fresh[0]).toContain("g/G jump");
	expect(fresh[0]).toContain("f follow(on)");
	expect(fresh[0]).toContain("esc back");
	view.handleInput("f");
	const off = view.render(80);
	expect(off[0]).toContain("f follow");
	expect(off[0]).not.toContain("follow(on)");
});

// --- O1 (Q1): the production key gate honors kitty/modifyOtherKeys forms ----

test("O1: classifyProgressKey classifies the kitty CSI-u forms of e/t/f/g (was raw ===, returned 'other')", () => {
	expect(classifyProgressKey("\x1b[101u")).toBe("e");
	expect(classifyProgressKey("\x1b[116u")).toBe("t");
	expect(classifyProgressKey("\x1b[102u")).toBe("f");
	expect(classifyProgressKey("\x1b[103u")).toBe("g");
});

test("O1: legacy forms and G are unaffected — 'e'/'t'/'f'/'g' literal, 'G' legacy and CSI-u shift, arrows/enter/esc", () => {
	expect(classifyProgressKey("e")).toBe("e");
	expect(classifyProgressKey("t")).toBe("t");
	expect(classifyProgressKey("f")).toBe("f");
	expect(classifyProgressKey("g")).toBe("g");
	expect(classifyProgressKey("G")).toBe("G"); // legacy uppercase
	expect(classifyProgressKey("\x1b[71;2u")).toBe("G"); // CSI-u shift+g — the g branch must not swallow it
	expect(classifyProgressKey("\x1b[A")).toBe("up");
	expect(classifyProgressKey("\x1b[B")).toBe("down");
	expect(classifyProgressKey("\r")).toBe("enter");
	expect(classifyProgressKey("\x1b")).toBe("escape");
	expect(classifyProgressKey("x")).toBe("other");
});

test("O1 routing: every progress-consumed key routes 'consumed' on the progress surface; 'other' forwards (control)", () => {
	const c = new TreeFocusState();
	c.termRowsCap = 24;
	c.setOpen(true);
	c.setRows(["a"]);
	c.enter();
	c.enterProgress("a");
	const meta: RouteMeta = { treeOpen: true, onLastLogicalLine: false };
	for (const k of ["e", "t", "f", "g", "G"] as RouteKey[]) {
		expect(routeEditorFocus(c, k, meta)).toEqual({ action: "consumed" });
	}
	expect(routeEditorFocus(c, "other", meta)).toEqual({ action: "forward" });
});

test("O1 delivery: a kitty-encoded 'e' reaches the transcript view via viewHost and never the editor draft", () => {
	const tui = new FakeTUI();
	const controller = new TreeFocusState();
	controller.termRowsCap = 24;
	controller.setOpen(true);
	controller.setRows(["a"]);
	controller.enter();
	controller.enterProgress("a");
	const delivered: string[] = [];
	controller.viewHost = { handleInput: (d: string) => delivered.push(d) };
	const forwarded: string[] = [];
	const prior = { handleInput: (d: string) => forwarded.push(d) } as unknown as EditorComponent;
	const editor = new CustomTreeEditor(
		tui as unknown as TUI,
		{ borderColor: (s: string) => s } as never,
		fakeKeybindings() as never,
		controller,
		() => {},
		() => prior,
	);
	editor.handleInput("\x1b[101u");
	expect(delivered).toEqual(["\x1b[101u"]); // consumed → the view got it
	expect(forwarded).toEqual([]); // the editor draft did NOT receive it
	editor.handleInput("x"); // control: a genuinely unhandled key still forwards
	expect(forwarded).toEqual(["x"]);
});

// --- Marker (R-MARKER): exactly one ▌, on the focused unit's head line ------

test("R-MARKER: exactly one rendered line starts with ▌ and it is the focused unit's head (maxTop===0 fixture)", () => {
	const view = fixtureView("mark", [
		callLine("bash", "echo one", "c1"),
		resultLine("c1", "one"),
		callLine("bash", "echo two", "c2"),
		resultLine("c2", "two"),
	]);
	const lines = view.render(80);
	const marked = lines.filter((l) => l.startsWith("\u258C"));
	expect(marked.length).toBe(1);
	expect(marked[0]).toContain("→ bash  echo one"); // unit 0's composed head (fresh view: focused = 0)
});

test("R-MARKER: body lines never carry the marker; e's expanded body appears beneath the marked head, unmarked", () => {
	const view = fixtureView("body", [callLine("bash", "echo one", "c1"), resultLine("c1", "one")]);
	view.handleInput("e");
	const lines = view.render(80);
	const marked = lines.filter((l) => l.startsWith("\u258C"));
	expect(marked.length).toBe(1); // head only
	expect(lines[1]).toBe("\u258C → bash  echo one");
	expect(lines[2]).toBe("  one"); // expanded result body: indented, unmarked
});

test("R-MARKER: the marker precedes truncation — it survives at narrow width on a collapsed toolCall head", () => {
	const view = fixtureView(
		"narrow",
		[callLine("bash", "echo a-really-long-primary-argument-value-here", "c1"), resultLine("c1", "x")],
	);
	const lines = view.render(30);
	const marked = lines.filter((l) => l.startsWith("\u258C"));
	expect(marked.length).toBe(1);
});

test("DOWN moves the marker to the next unit's head; still exactly one", () => {
	const view = fixtureView("move", [
		callLine("bash", "echo one", "c1"),
		resultLine("c1", "one"),
		callLine("bash", "echo two", "c2"),
		resultLine("c2", "two"),
		callLine("bash", "echo three", "c3"),
		resultLine("c3", "three"),
	]);
	view.handleInput(DOWN);
	const lines = view.render(80);
	const marked = lines.filter((l) => l.startsWith("\u258C"));
	expect(marked.length).toBe(1);
	expect(marked[0]).toContain("→ bash  echo two");
});

test("g/G jump: G moves the marker to the last visible unit's head (follow off), g back to the first", () => {
	const view = fixtureView("jump", [
		callLine("bash", "echo one", "c1"),
		resultLine("c1", "one"),
		callLine("bash", "echo two", "c2"),
		resultLine("c2", "two"),
		callLine("bash", "echo three", "c3"),
		resultLine("c3", "three"),
	]);
	view.handleInput("G");
	const afterG = view.render(80);
	expect(afterG[0]).not.toContain("follow(on)"); // G turns follow off
	const marked = afterG.filter((l) => l.startsWith("\u258C"));
	expect(marked.length).toBe(1);
	expect(marked[0]).toContain("→ bash  echo three");
	view.handleInput("g");
	const afterg = view.render(80);
	const marked2 = afterg.filter((l) => l.startsWith("\u258C"));
	expect(marked2.length).toBe(1);
	expect(marked2[0]).toContain("→ bash  echo one");
});

test("e expands the marked unit: body directly beneath the marked head; the marked line does not move", () => {
	const view = fixtureView("expand", [
		callLine("bash", "echo one", "c1"),
		resultLine("c1", "one"),
		callLine("bash", "echo two", "c2"),
		resultLine("c2", "two"),
	]);
	const before = view.render(80);
	const mi = before.findIndex((l) => l.startsWith("\u258C"));
	expect(mi).toBe(1); // header is row 0, unit 0's head row 1
	view.handleInput("e");
	const after = view.render(80);
	expect(after[mi]).toBe(before[mi]); // marked head unchanged
	expect(after[mi + 1]).toBe("  one"); // its result body appeared directly beneath
});

test("marker and e stay on the same unit after t reshuffles the visible list (Q5: shared visible-index expression)", () => {
	const view = fixtureView("sync", [
		thinkingLine("secret plan"),
		callLine("bash", "echo A", "cA"),
		resultLine("cA", "A"),
		callLine("bash", "echo B", "cB"),
		resultLine("cB", "B"),
	]);
	view.handleInput(DOWN); // vis = [A, B] (thinking hidden); focused = 1 → B
	const before = view.render(80);
	const markedBefore = before.filter((l) => l.startsWith("\u258C"));
	expect(markedBefore.length).toBe(1);
	expect(markedBefore[0]).toContain("→ bash  echo B");
	view.handleInput("t"); // vis = [T, A, B]; visible-index focus 1 now points at A
	const after = view.render(80);
	const markedAfter = after.filter((l) => l.startsWith("\u258C"));
	expect(markedAfter.length).toBe(1);
	const mi = after.findIndex((l) => l.startsWith("\u258C"));
	expect(after[mi]).toContain("→ bash  echo A");
	view.handleInput("e"); // expands the SAME unit the marker shows
	const expanded = view.render(80);
	expect(expanded[mi + 1]).toBe("  A");
});

// --- Defined no-ops (§2.5) ---------------------------------------------------

test("e is a defined no-op on user/assistant units (byte-identical render before/after)", () => {
	const view = fixtureView("usernoop", [userLine("hello"), callLine("bash", "echo x", "cx"), resultLine("cx", "x")]);
	// fresh view: focused = 0 = the user unit (no DOWN — that would focus the toolCall)
	const before = view.render(80);
	view.handleInput("e");
	expect(view.render(80)).toEqual(before);
});

test("e is a defined no-op on an unpaired toolCall unit (byte-identical render before/after)", () => {
	const view = fixtureView("unpaired", [callLine("bash", "lonely", "cx")]);
	const before = view.render(80);
	view.handleInput("e");
	expect(view.render(80)).toEqual(before);
});

// --- t is body-visible (§2.6): fixture MUST contain a thinking block --------

test("t toggles a thinking block's visibility in the body; the header keeps unsuffixed 't thinking'", () => {
	const view = fixtureView("think", [
		callLine("bash", "echo one", "c1"),
		resultLine("c1", "one"),
		thinkingLine("secret plan"),
	]);
	const hidden = () => {
		const lines = view.render(80);
		// head line check (exact line, not substring — the header advertises 't thinking')
		expect(lines.filter((l) => l.trim() === "thinking").length).toBe(0);
		expect(lines.join("\n")).not.toContain("secret plan");
	};
	hidden();
	view.handleInput("t");
	const shown = view.render(80);
	expect(shown.filter((l) => l.trim() === "thinking").length).toBe(1); // head line present
	expect(shown.join("\n")).toContain("secret plan");
	view.handleInput("t");
	hidden();
	expect(view.render(80)[0]).toContain("t thinking"); // no suffix on t (R-KEYMAP)
});

// --- O6a: empty-transcript guards -------------------------------------------

test("O6a: empty transcript — down/up/e/g/G are consumed no-ops; render stays header + waiting line, never a marker", () => {
	const view = fixtureView("empty", []);
	const empty = view.render(80);
	expect(empty.length).toBe(2);
	expect(empty[1]).toContain("(waiting for output · idle)");
	for (const k of [DOWN, UP, "e", "g", "G"]) {
		expect(() => view.handleInput(k)).not.toThrow();
		const after = view.render(80);
		expect(after.join("\n")).not.toContain("\u258C"); // no marker from a clamped/garbage focus index
		expect(after.length).toBe(2);
		expect(after[1]).toContain("(waiting for output · idle)");
	}
});

// --- O6d: clamp equalities with follow already off ---------------------------

test("O6d: boundary clamps are byte-identical no-ops with follow off (up at top; down at bottom)", () => {
	const view = fixtureView("clamp", [
		callLine("bash", "echo one", "c1"),
		resultLine("c1", "one"),
		callLine("bash", "echo two", "c2"),
		resultLine("c2", "two"),
		callLine("bash", "echo three", "c3"),
		resultLine("c3", "three"),
	]);
	view.handleInput("f"); // follow off FIRST — byte-identity only holds in this state (§2.4)
	const atTop = view.render(80);
	view.handleInput(UP); // up at focused=0
	expect(view.render(80)).toEqual(atTop);
	view.handleInput("G"); // jump to last (follow off too)
	const atBottom = view.render(80);
	view.handleInput(DOWN); // down at the last visible unit
	expect(view.render(80)).toEqual(atBottom);
});
