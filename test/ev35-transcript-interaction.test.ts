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
