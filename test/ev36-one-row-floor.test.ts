import { test, expect } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { visibleWidth } from "@earendil-works/pi-tui";
import { computeProgressLayout, TreeFocusState } from "../extensions/focus-nav.ts";
import { CouncilTreeWidget, TranscriptView, type NavTheme } from "../extensions/navigator.ts";
import { ensureRunDir, writeManifest, runDir, type RunManifest } from "../extensions/runs.ts";

// EV-36: transcript legibility at the one-row progress floor.
// Spec: docs/superpowers/specs/2026-09-15-EV-36-design.md (R3 read-only projection,
// per-render re-grant, single-head width clamp). Layout assertions always go through
// computeProgressLayout — never literals.

const theme: NavTheme = { fg: (_c: string, s: string) => s, bold: (s: string) => s, bg: (_c: string, s: string) => s };
const UP = "\x1b[A";
const MARKER = "\u258C";
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
function resultLineLabel(label: string, callId: string | undefined, text: string, isError?: boolean): string {
	const idPart = callId != null ? `"toolCallId":"${callId}",` : "";
	const errPart = isError != null ? `,"isError":${isError}` : "";
	return `{"type":"message","id":"r-${text}","parentId":null,"timestamp":"t","message":{"role":"toolResult",${idPart}"toolName":"${label}","content":[{"type":"text","text":"${text}"}]${errPart}}}`;
}
function userLine(text: string): string {
	return `{"type":"message","id":"u-${text}","parentId":null,"timestamp":"t","message":{"role":"user","content":[{"type":"text","text":"${text}"}]}}`;
}
function assistantLine(text: string): string {
	return JSON.stringify({
		type: "message",
		id: `a-${text.slice(0, 16)}`,
		parentId: null,
		timestamp: "t",
		message: { role: "assistant", content: [{ type: "text", text }] },
	});
}
function thinkingLine(text: string): string {
	return `{"type":"message","id":"th-${text}","parentId":null,"timestamp":"t","message":{"role":"assistant","content":[{"type":"thinking","thinking":"${text}"}]}}`;
}

function fixtureView(name: string, lines: string[], viewportRows = 24): TranscriptView {
	const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), `ev36-${name}-`)), "s.jsonl");
	fs.writeFileSync(file, [headerLine(name), ...lines].join("\n") + "\n");
	return new TranscriptView(file, theme, `${name} seat`, viewportRows, () => {});
}

function writeSession(root: string, runId: string, sessionId: string, lines: string[]): void {
	const file = path.join(runDir(root, runId), `${sessionId}.jsonl`);
	fs.writeFileSync(file, [headerLine(sessionId), ...lines].join("\n") + "\n");
}

// --- T1 (content): the one-row line is the trailing unit's composed head, not a body continuation ---

test("EV-36 T1: at grant 1 a trailing assistant body shows the assistant head, not a body continuation", () => {
	const view = fixtureView(
		"t1a",
		[callLine("bash", "echo one", "c1"), resultLine("c1", "one"), assistantLine("streaming words that wrap well past the viewport edge")],
		1,
	);
	const one = view.render(80);
	expect(one.length).toBe(1);
	expect(one[0]).toContain("assistant");
	expect(one[0]).not.toContain("wrap well past");
	view.dispose();
});

test("EV-36 T1b: at grant 1 a trailing user body shows the user head, not a body continuation", () => {
	const view = fixtureView("t1u", [userLine("many words yes that spill past one row of width")], 1);
	const one = view.render(80);
	expect(one.length).toBe(1);
	expect(one[0]).toContain("user");
	expect(one[0]).not.toContain("many words");
	view.dispose();
});

// --- T2 (subject discriminator, R3): fresh follow-on floor = live tail head, no marker ---

test("EV-36 T2 (R3): fresh follow-on floor shows the tail's head with no marker; G marks the tail; up moves marker+line", () => {
	const view = fixtureView(
		"t2",
		[callLine("bash", "echo one", "c1"), callLine("bash", "echo two", "c2"), callLine("bash", "echo three", "c3")],
		1,
	);
	const fresh = view.render(80);
	expect(fresh.length).toBe(1);
	expect(fresh[0]).toContain("→ bash  echo three");
	expect(fresh[0].includes(MARKER)).toBe(false); // watching the tail, not the cursor
	view.handleInput("G"); // nav key: follow off, focused → last
	const g = view.render(80);
	expect(g.length).toBe(1);
	expect(g[0]).toContain("→ bash  echo three");
	expect(g[0].includes(MARKER)).toBe(true);
	view.handleInput(UP);
	const up = view.render(80);
	expect(up.length).toBe(1);
	expect(up[0]).toContain("→ bash  echo two");
	expect(up[0].includes(MARKER)).toBe(true);
	view.dispose();
});

