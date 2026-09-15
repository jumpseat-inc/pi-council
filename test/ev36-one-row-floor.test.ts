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

// --- T3 (Q5 non-violation): poll()+render() never writes focused ---

test("EV-36 T3 (Q5): new units arriving + t toggled + poll/render never change focused", () => {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ev36-t3-"));
	const file = path.join(dir, "s.jsonl");
	fs.writeFileSync(file, [headerLine("t3"), callLine("bash", "echo one", "c1")].join("\n") + "\n");
	const view = new TranscriptView(file, theme, "t3 seat", 1, () => {});
	view.render(80);
	const before = (view as unknown as { focused: number }).focused;
	for (let n = 0; n < 3; n++) {
		fs.appendFileSync(file, callLine("bash", `echo n${n}`, `cn${n}`) + "\n");
		view.poll();
		view.render(80);
	}
	view.handleInput("t"); // t toggles; it never mutates focused
	view.render(80);
	const after = (view as unknown as { focused: number }).focused;
	expect(after).toBe(before);
	view.dispose();
});

// --- T5 (count guard, green today): pinned pairs over the real widget ---

test("EV-36 T5: pinned pairs (7,5),(8,5),(9,11),(40,11) — progress lines in [1, progressLines], total within avail", () => {
	for (const [termRows, treeContent] of [
		[7, 5],
		[8, 5],
		[9, 11],
		[40, 11],
	] as const) {
		const root = fs.mkdtempSync(path.join(os.tmpdir(), `ev36-t5-${termRows}-`));
		const runId = "r";
		ensureRunDir(root, runId);
		for (let j = 1; j <= treeContent; j++) writeManifest(root, runId, m(`job-${j}`));
		writeSession(root, runId, "job-1", [callLine("bash", "echo one", "c1"), resultLine("c1", "one")]);
		const layout = computeProgressLayout(termRows, treeContent);
		expect(layout.treeLines + layout.sepLines + layout.progressLines).toBeLessThanOrEqual(layout.avail);
		expect(layout.progressLines).toBeGreaterThanOrEqual(1);
		const c = new TreeFocusState();
		c.termRowsCap = termRows;
		const w = new CouncilTreeWidget(root, () => runId, theme, { now, controller: c, termRowsCap: termRows });
		c.setOpen(true);
		w.render(200);
		c.enter();
		expect(c.enterProgress("job-1")).toBe(true);
		const lines = w.render(200);
		expect(lines.length).toBeGreaterThanOrEqual(1);
		expect(lines.length).toBeLessThanOrEqual(layout.avail);
		const progress = lines.slice(layout.treeLines + layout.sepLines);
		expect(progress.length).toBeGreaterThanOrEqual(1);
		expect(progress.length).toBeLessThanOrEqual(layout.progressLines);
	}
});

// --- T6 (never empty, green today) ---

test("EV-36 T6: empty transcript at grant 1 → exactly one idle line; missing file → (no transcript)", () => {
	const empty = fixtureView("t6e", [], 1);
	const e = empty.render(80);
	expect(e.length).toBe(1);
	expect(e[0]).toContain("(waiting for output · idle)");
	empty.dispose();
	const noFile = new TranscriptView(undefined, theme, "t6n", 1, () => {});
	const nf = noFile.render(80);
	expect(nf.length).toBe(1);
	expect(nf[0]).toContain("(no transcript)");
	noFile.dispose();
});

// --- T7 (width): single-kind heads clamp to the granted width ---
// NOTE: the chrome header row (row 0 of a multi-row render) is FLLWUP-38's
// subject, out of scope here (spec §2.6) — at grant 1 the projection never
// emits it, so the one-row assertion covers every returned line.

function unitRows(lines: string[]): string[] {
	return lines.slice(1);
}
test("EV-36 T7: an over-wide unpaired toolResult head is clamped at viewport 1 and at a tall viewport", () => {
	const label = "a".repeat(60);
	const one = fixtureView("t7one", [resultLineLabel(label, "c", "odata")], 1);
	for (const line of one.render(40)) expect(visibleWidth(line)).toBeLessThanOrEqual(40);
	one.dispose();
	const many = fixtureView("t7many", [resultLineLabel(label, "c", "odata"), callLine("bash", "echo two", "c2")], 24);
	for (const line of unitRows(many.render(40))) expect(visibleWidth(line)).toBeLessThanOrEqual(40);
	many.dispose();
});

// --- T8 (byte parity per kind): the one-row line equals the multi-row head line ---

test("EV-36 T8: for each kind the grant-1 line is byte-equal to the multi-row head line for the same unit", () => {
	const longLabel = "a".repeat(60);
	const cases: Array<{ name: string; lines: string[]; literal: string; thinking?: boolean }> = [
		{ name: "user", lines: [userLine("body words only")], literal: "user" },
		{ name: "assistant", lines: [assistantLine("body words only")], literal: "assistant" },
		{ name: "thinking", lines: [thinkingLine("pondering")], literal: "thinking", thinking: true },
		{ name: "toolResult-unpaired", lines: [resultLineLabel(longLabel, "c", "odata")], literal: "⎿ aaaa" },
		{ name: "toolCall", lines: [callLine("bash", "echo one", "c1"), resultLine("c1", "one")], literal: "→ bash  echo one" },
	];
	for (const { name, lines, literal, thinking } of cases) {
		const one = fixtureView(`t8-${name}`, lines, 1);
		const many = fixtureView(`t8m-${name}`, lines, 24);
		if (thinking) {
			one.handleInput("t");
			many.handleInput("t");
		}
		const oneLine = one.render(80);
		expect(oneLine.length).toBe(1);
		// the head is located by its literal below the chrome header (row 0 carries
		// the title, which contains the fixture name)
		const headRow = many.render(80).slice(1).find((l) => l.includes(literal));
		expect(headRow).toBeDefined();
		expect(oneLine[0]).toBe(headRow!);
		one.dispose();
		many.dispose();
	}
});

// --- T4 (frozen grant): the cached view re-syncs to the current grant ---

test("EV-36 T4: re-grant per render — the cached view tracks computeProgressLayout across (9,1)→(9,2)→(40,2)", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "ev36-t4-"));
	const runId = "r";
	ensureRunDir(root, runId);
	writeManifest(root, runId, m("job-1"));
	writeSession(root, runId, "job-1", [
		callLine("bash", "echo one", "c1"),
		resultLine("c1", "one"),
		assistantLine(Array.from({ length: 60 }, (_, i) => `body line ${i}`).join("\n")),
	]);
	const c = new TreeFocusState();
	c.termRowsCap = 9;
	const w = new CouncilTreeWidget(root, () => runId, theme, { now, controller: c, termRowsCap: 9 });
	c.setOpen(true);
	w.render(200);
	c.enter();
	expect(c.enterProgress("job-1")).toBe(true);
	w.render(200);
	const view = w.activeTranscriptView!;
	const layout91 = computeProgressLayout(9, 1);
	expect((view as unknown as { viewportRows: number }).viewportRows).toBe(layout91.progressLines); // 2
	// a second job lands mid-progress: grant shrinks 2 → 1
	writeManifest(root, runId, m("job-2", { seat: "skeptic", state: "done", settledAt: NOW - 60_000 }));
	w.refresh();
	const layout92 = computeProgressLayout(9, 2);
	expect(layout92.progressLines).toBe(1);
	const lines1 = w.render(200);
	expect((view as unknown as { viewportRows: number }).viewportRows).toBe(1); // frozen-grant defect site
	const progress1 = lines1.slice(layout92.treeLines + layout92.sepLines);
	expect(progress1.length).toBe(1);
	expect(progress1[0]).toContain("assistant");
	expect(progress1[0]).not.toContain("body line");
	// raise the grant on the SAME cached view: termRows 9 → 40 (tree content still 2 → grant 31)
	(w as unknown as { termRowsCap: number }).termRowsCap = 40;
	w.refresh();
	const layout402 = computeProgressLayout(40, 2);
	expect(layout402.progressLines).toBe(31);
	w.render(200);
	expect((view as unknown as { viewportRows: number }).viewportRows).toBe(31);
	const viewLines = view.render(200);
	expect(viewLines.length).toBe(31); // transcript (60+ body lines) longer than the grant
	const lines40 = w.render(200);
	expect(lines40.slice(layout402.treeLines + layout402.sepLines).length).toBeLessThanOrEqual(31);
});

// --- T9 (parity + modal inertness): inline == standalone at every grant; modal unchanged ---

test("EV-36 T9: inline == standalone at grant 2 and grant 1 and across the (9,1)→(9,2) transition; modal-shaped view is inert", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "ev36-t9-"));
	const runId = "r";
	ensureRunDir(root, runId);
	writeManifest(root, runId, m("job-1"));
	writeSession(root, runId, "job-1", [
		callLine("bash", "echo one", "c1"),
		resultLine("c1", "one"),
		assistantLine("streaming output with words"),
	]);
	const file = path.join(runDir(root, runId), "job-1.jsonl");
	const c = new TreeFocusState();
	c.termRowsCap = 9;
	const w = new CouncilTreeWidget(root, () => runId, theme, { now, controller: c, termRowsCap: 9 });
	c.setOpen(true);
	w.render(200);
	c.enter();
	expect(c.enterProgress("job-1")).toBe(true);
	w.render(200);
	const inline = w.activeTranscriptView!;
	let standalone = new TranscriptView(file, theme, "job-1 owner", computeProgressLayout(9, 1).progressLines, () => {});
	expect(inline.render(80)).toEqual(standalone.render(80));
	standalone.dispose();
	writeManifest(root, runId, m("job-2", { seat: "skeptic", state: "done", settledAt: NOW - 60_000 }));
	w.refresh();
	w.render(200);
	standalone = new TranscriptView(file, theme, "job-1 owner", computeProgressLayout(9, 2).progressLines, () => {});
	expect(inline.render(80)).toEqual(standalone.render(80));
	expect(inline.render(80).length).toBe(1);
	standalone.dispose();
	// modal-shaped: own grant (termRows − 4), never re-granted → unchanged window, never projected
	const modal = new TranscriptView(file, theme, "job-1 owner", 40 - 4, () => {});
	const modalLines = modal.render(80);
	expect(modalLines.length).toBeGreaterThan(1);
	expect(modalLines.length).toBeLessThanOrEqual(36);
	expect(modalLines).toEqual(new TranscriptView(file, theme, "job-1 owner", 36, () => {}).render(80));
	modal.dispose();
});
