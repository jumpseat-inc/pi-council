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
} from "../extensions/focus-nav.ts";
import { CouncilTreeWidget } from "../extensions/navigator.ts";
import {
	ensureRunDir,
	writeManifest,
	runDir,
	browsableAttempts,
	resolveAttempt,
	type RunManifest,
} from "../extensions/runs.ts";

// --- shared helpers (mirrors ev9-progress.test.ts fixtures) ---
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

function entry(i: number, sid: string): { attempt: number; sessionId: string } {
	return { attempt: i, sessionId: sid };
}

function writeSession(root: string, runId: string, sessionId: string, lines: string[]): void {
	const file = path.join(runDir(root, runId), `${sessionId}.jsonl`);
	const header = `{"type":"session","version":3,"id":"${sessionId}","timestamp":"t","cwd":"/x"}`;
	fs.writeFileSync(file, [header, ...lines].join("\n") + "\n");
}

function toolLine(id: string, ts: string, name = "bash", arg = "ls -la"): string {
	return `{"type":"message","id":"${id}","parentId":null,"timestamp":"${ts}","message":{"role":"assistant","content":[{"type":"toolCall","id":"c${id}","name":"${name}","arguments":{"command":"${arg}"}}]}}`;
}

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
// B1: browsableAttempts — the four manifest shapes (spec §2 table)
// ---------------------------------------------------------------------------

test("FLLWUP-45: browsableAttempts — retrying backoff window stays length 1 (live session = last settled entry)", () => {
	const mm = m("job-1", {
		state: "retrying",
		attempt: 2,
		attempts: [entry(1, "job-1")],
	});
	expect(browsableAttempts(mm)).toEqual([entry(1, "job-1")]);
	expect(browsableAttempts(mm).length).toBe(1);
});

test("FLLWUP-45: browsableAttempts — running attempt 2 pre-settle appends the live session", () => {
	const mm = m("job-1", {
		state: "running",
		attempt: 2,
		sessionId: "job-1-attempt2",
		attempts: [entry(1, "job-1")],
	});
	expect(browsableAttempts(mm)).toEqual([entry(1, "job-1"), entry(2, "job-1-attempt2")]);
});

test("FLLWUP-45: browsableAttempts — settled attempt 3 yields the full prefix, live session already in it", () => {
	const mm = m("job-1", {
		state: "done",
		attempt: 3,
		sessionId: "job-1-attempt3",
		attempts: [entry(1, "job-1"), entry(2, "job-1-attempt2"), entry(3, "job-1-attempt3")],
	});
	expect(browsableAttempts(mm)).toEqual([
		entry(1, "job-1"),
		entry(2, "job-1-attempt2"),
		entry(3, "job-1-attempt3"),
	]);
});

test("FLLWUP-45: browsableAttempts — legacy carve-out (no attempts field) synthesizes one entry via the fail-closed fallback (Skeptic O1)", () => {
	const mm = m("job-1", { attempt: 2 });
	delete (mm as Partial<RunManifest>).attempts;
	expect(browsableAttempts(mm)).toEqual([entry(2, "job-1")]);
});

// ---------------------------------------------------------------------------
// B2: resolveAttempt
// ---------------------------------------------------------------------------

test("FLLWUP-45: resolveAttempt — present cursor resolves that entry with its index", () => {
	const entries = [entry(1, "job-1"), entry(2, "job-1-attempt2")];
	expect(resolveAttempt(entries, "job-1")).toEqual({ attempt: 1, sessionId: "job-1", index: 0 });
	expect(resolveAttempt(entries, "job-1-attempt2")).toEqual({
		attempt: 2,
		sessionId: "job-1-attempt2",
		index: 1,
	});
});

test("FLLWUP-45: resolveAttempt — absent or null cursor resolves the LAST entry (latest browsable)", () => {
	const entries = [entry(1, "job-1"), entry(2, "job-1-attempt2")];
	expect(resolveAttempt(entries, "ghost")).toEqual({ attempt: 2, sessionId: "job-1-attempt2", index: 1 });
	expect(resolveAttempt(entries, null)).toEqual({ attempt: 2, sessionId: "job-1-attempt2", index: 1 });
	expect(resolveAttempt(entries)).toEqual({ attempt: 2, sessionId: "job-1-attempt2", index: 1 });
});

test("FLLWUP-45: resolveAttempt — empty entries guard returns the {1, '', 0} sentinel", () => {
	expect(resolveAttempt([])).toEqual({ attempt: 1, sessionId: "", index: 0 });
});

// ---------------------------------------------------------------------------
// B3: selection survives an attempt respawn (spec §8.3; Skeptic O5)
// ---------------------------------------------------------------------------

test("FLLWUP-45: selection survives an attempt respawn — row key is the job id, ▌ marker stays", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "f45-respawn-"));
	const runId = "r45a";
	ensureRunDir(root, runId);
	writeManifest(root, runId, m("job-1"));
	writeManifest(root, runId, m("job-2", { seat: "skeptic", state: "done", settledAt: NOW - 60_000 }));
	const c = new TreeFocusState();
	c.termRowsCap = 24;
	const w = new CouncilTreeWidget(root, () => runId, theme, { now, controller: c, termRowsCap: 24 });
	w.render(200); // setRows from manifests
	c.setOpen(true);
	c.enter(); // selects job-1
	expect(c.selectedIndex()).toBe(0);
	// the retry timer fires: same job id, new attempt/session
	writeManifest(
		root,
		runId,
		m("job-1", { attempt: 2, sessionId: "job-1-attempt2", attempts: [entry(1, "job-1")] }),
	);
	w.refresh();
	const lines = w.render(200);
	expect(c.selectedIndex()).toBe(0); // RED today: -1 (selection keyed on the mutated sessionId)
	const marked = lines.filter((l) => l.includes("\u258C"));
	expect(marked.length).toBe(1); // RED today: no marker on any row
	expect(marked[0]).toContain("owner"); // the marker is on the respawned job's row
});

// ---------------------------------------------------------------------------
// B4: tail-cache guard — the row's last-activity derives from the NEW
// attempt's file (spec §8.5). Green today; ships as the re-key's guard-rail:
// a `keyFor → manifest.id` "fix" goes red here (Skeptic O4).
// ---------------------------------------------------------------------------

test("FLLWUP-45: tail-cache guard — post-respawn last-activity comes from attempt 2's JSONL", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "f45-tail-"));
	const runId = "r45b";
	ensureRunDir(root, runId);
	writeManifest(
		root,
		runId,
		m("job-1", { attempt: 2, sessionId: "job-1-attempt2", attempts: [entry(1, "job-1")] }),
	);
	writeSession(root, runId, "job-1", [toolLine("1", "2026-01-01T00:04:00.000Z", "bash", "attempt-one-arg")]);
	writeSession(root, runId, "job-1-attempt2", [
		toolLine("2", "2026-01-01T00:04:50.000Z", "bash", "attempt-two-arg"),
	]);
	const c = new TreeFocusState();
	c.termRowsCap = 24;
	const w = new CouncilTreeWidget(root, () => runId, theme, { now, controller: c, termRowsCap: 24 });
	const out = w.render(200).join("\n");
	expect(out).toContain("attempt-two-arg"); // derived from attempt 2's file
	expect(out).not.toContain("attempt-one-arg"); // never attempt 1's
});

// ---------------------------------------------------------------------------
// B5: title names the shown ordinal during backoff (spec §8.4; 6d ruling (i))
// ---------------------------------------------------------------------------

test("FLLWUP-45: title names the shown ordinal during backoff — row attempt 2/3 (pending), title attempt 1/3 (shown)", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "f45-title-"));
	const runId = "r45c";
	ensureRunDir(root, runId);
	writeManifest(
		root,
		runId,
		m("job-1", {
			state: "retrying",
			attempt: 2,
			attempts: [entry(1, "job-1")],
			nextAttemptAt: NOW + 7000,
		}),
	);
	writeSession(root, runId, "job-1", [toolLine("1", "2026-01-01T00:04:00.000Z")]);
	const c = new TreeFocusState();
	c.termRowsCap = 24;
	const w = new CouncilTreeWidget(root, () => runId, theme, { now, controller: c, termRowsCap: 24 });
	w.render(200);
	c.setOpen(true);
	c.enter();
	expect(c.enterProgress("job-1")).toBe(true);
	const out = w.render(200).join("\n");
	expect(out).toContain("attempt 2/3"); // row: pending ordinal per R4 — unchanged
	expect(out).toContain("attempt 1/3"); // RED today: title carries no ordinal
});

// ---------------------------------------------------------------------------
// B6-B8: the [/] attempt cycler (spec §5, §6)
// ---------------------------------------------------------------------------

const OPEN = "[";
const CLOSE = "]";

// --- B6: cycler does not own the row key (spec §8.6) ---
test("FLLWUP-45: '[' re-targets the shown attempt to attempt 1 while the row key stays the job id", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "f45-cyc-"));
	const runId = "r45d";
	ensureRunDir(root, runId);
	writeManifest(
		root,
		runId,
		m("job-1", { attempt: 2, sessionId: "job-1-attempt2", attempts: [entry(1, "job-1")] }),
	);
	writeSession(root, runId, "job-1", [toolLine("1", "2026-01-01T00:04:00.000Z")]);
	writeSession(root, runId, "job-1-attempt2", [toolLine("2", "2026-01-01T00:04:50.000Z")]);
	const c = new TreeFocusState();
	c.termRowsCap = 24;
	const w = new CouncilTreeWidget(root, () => runId, theme, { now, controller: c, termRowsCap: 24 });
	w.render(200);
	c.setOpen(true);
	c.enter();
	c.enterProgress("job-1");
	w.render(200); // builds the view on the latest attempt (2)
	const editor = new CustomTreeEditor(
		new FakeTUI() as unknown as TUI,
		editorTheme() as never,
		fakeKeybindings() as never,
		c,
		() => {},
	);
	editor.setText("draft");
	const before = w.activeTranscriptView;
	editor.handleInput(OPEN); // RED today: "[" classifies "other" → forwarded into the draft
	expect(editor.getText()).toBe("draft"); // never reaches the editor draft
	const out = w.render(200).join("\n");
	expect(out).toContain("attempt 1/3"); // title now names attempt 1
	expect(c.selectedRowKey).toBe("job-1"); // cycler did NOT touch the row key
	expect(c.selectedIndex()).toBe(0); // marker survives (setRows values are job ids)
	expect(c.surface).toBe("progress");
	expect(w.activeTranscriptView).not.toBe(before); // view re-targeted to attempt 1's file
});

// --- B7: cycler no-ops (spec §8.7) ---
test("FLLWUP-45: single-attempt job — header carries no '[/] attempt' and '[' changes nothing", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "f45-single-"));
	const runId = "r45e";
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
	const editor = new CustomTreeEditor(
		new FakeTUI() as unknown as TUI,
		editorTheme() as never,
		fakeKeybindings() as never,
		c,
		() => {},
	);
	editor.setText("draft");
	const beforeLines = w.render(200);
	expect(beforeLines.join("\n")).not.toContain("[/] attempt"); // honest-keymap: unadvertised
	editor.handleInput(OPEN);
	expect(editor.getText()).toBe("draft");
	expect(w.render(200)).toEqual(beforeLines); // nothing moved
});

test("FLLWUP-45: one-row floor (termRowsCap 7) — '[' is a consumed no-op: cursor untouched, draft untouched", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "f45-floor-"));
	const runId = "r45f";
	ensureRunDir(root, runId);
	writeManifest(
		root,
		runId,
		m("job-1", { attempt: 2, sessionId: "job-1-attempt2", attempts: [entry(1, "job-1")] }),
	);
	writeSession(root, runId, "job-1", [toolLine("1", "2026-01-01T00:04:00.000Z")]);
	writeSession(root, runId, "job-1-attempt2", [toolLine("2", "2026-01-01T00:04:50.000Z")]);
	const c = new TreeFocusState();
	c.termRowsCap = 7;
	const w = new CouncilTreeWidget(root, () => runId, theme, { now, controller: c, termRowsCap: 7 });
	w.render(200);
	c.setOpen(true);
	c.enter();
	expect(c.enterProgress("job-1")).toBe(true);
	w.render(200);
	const editor = new CustomTreeEditor(
		new FakeTUI() as unknown as TUI,
		editorTheme() as never,
		fakeKeybindings() as never,
		c,
		() => {},
	);
	editor.setText("draft");
	const viewBefore = w.activeTranscriptView;
	editor.handleInput(OPEN);
	expect(editor.getText()).toBe("draft"); // consumed, not forwarded
	w.render(200);
	expect(w.activeTranscriptView).toBe(viewBefore); // no rebuild ⇒ attemptCursor not mutated
});

// --- B8: classifier additive + header advertisement gate (spec §8.8) ---
test("FLLWUP-45: classifyProgressKey — '[' → prevAttempt, ']' → nextAttempt (additive; kitty CSI-u honored)", () => {
	expect(classifyProgressKey(OPEN)).toBe("prevAttempt");
	expect(classifyProgressKey(CLOSE)).toBe("nextAttempt");
	expect(classifyProgressKey("\x1b[91;1u")).toBe("prevAttempt"); // kitty CSI-u form of '['
	expect(classifyProgressKey("\x1b[93;1u")).toBe("nextAttempt"); // kitty CSI-u form of ']'
	expect(classifyProgressKey("x")).toBe("other"); // fall-through intact
});

test("FLLWUP-45: header advertisement gate — '[/] attempt' only when browsableAttempts(m).length > 1", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "f45-advert-"));
	const runId = "r45g";
	ensureRunDir(root, runId);
	// two jobs: single-attempt (running) + retried (running attempt 2)
	writeManifest(root, runId, m("job-1"));
	writeSession(root, runId, "job-1", [toolLine("1", "2026-01-01T00:04:00.000Z")]);
	writeManifest(
		root,
		runId,
		m("job-2", { seat: "skeptic", attempt: 2, sessionId: "job-2-attempt2", attempts: [entry(1, "job-2")] }),
	);
	writeSession(root, runId, "job-2", [toolLine("3", "2026-01-01T00:04:00.000Z")]);
	writeSession(root, runId, "job-2-attempt2", [toolLine("4", "2026-01-01T00:04:50.000Z")]);
	const c = new TreeFocusState();
	c.termRowsCap = 24;
	const w = new CouncilTreeWidget(root, () => runId, theme, { now, controller: c, termRowsCap: 24 });
	w.render(200);
	c.setOpen(true);
	c.enter();
	c.move(1); // job-2 (the retried one)
	c.enterProgress("job-2");
	expect(w.render(200).join("\n")).toContain("[/] attempt"); // browsable length 2
	c.backFromProgress();
	c.enter(); // back on tree; move to job-1 (single-attempt)
	c.move(-1);
	c.enterProgress("job-1");
	expect(w.render(200).join("\n")).not.toContain("[/] attempt"); // browsable length 1
});
