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
