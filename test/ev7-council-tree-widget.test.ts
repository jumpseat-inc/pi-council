import { test, expect } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { runDir } from "../extensions/runs.ts";
import { ensureRunDir, writeManifest, type RunManifest } from "../extensions/runs.ts";
import {
	COUNCIL_TREE_WIDGET_KEY,
	CouncilTreeWidget,
	formatAge,
	surfaceForMode,
	clearTreeWidget,
} from "../extensions/navigator.ts";

// EV-7: display-only below-editor widget. Identity theme so the copy is
// asserted verbatim (no ANSI in the fixture assertions).
const theme = { fg: (_c: string, s: string) => s, bold: (s: string) => s, bg: (_c: string, s: string) => s };

const NOW = Date.parse("2026-01-01T00:05:00.000Z");
const now = () => NOW;

function m(id: string, over: Partial<RunManifest> = {}): RunManifest {
	return {
		id,
		seat: "owner",
		model: "m/x",
		parentJobId: id.includes(".") ? "job-1" : null,
		pid: process.pid, // alive → not orphaned
		sessionId: id,
		state: "running",
		startedAt: Date.parse("2026-01-01T00:00:00.000Z"),
		settledAt: null,
		exitCode: null,
		...over,
	};
}

/** Write a session file whose first-line id == sessionId so findSessionFile resolves it. */
function writeSession(root: string, runId: string, sessionId: string, lines: string[]): void {
	const file = path.join(runDir(root, runId), `${sessionId}.jsonl`);
	const header = `{"type":"session","version":3,"id":"${sessionId}","timestamp":"t","cwd":"/x"}`;
	fs.writeFileSync(file, [header, ...lines].join("\n") + "\n");
}

function toolLine(id: string, ts: string, name = "bash", arg = "ls -la"): string {
	return `{"type":"message","id":"${id}","parentId":null,"timestamp":"${ts}","message":{"role":"assistant","content":[{"type":"toolCall","id":"c${id}","name":"${name}","arguments":{"command":"${arg}"}}]}}`;
}

test("formatAge: <60s→Ns, <60m→Nm, >=60m→Nh Mm", () => {
	expect(formatAge(5_000)).toBe("5s");
	expect(formatAge(65_000)).toBe("1m");
	expect(formatAge(61 * 60_000)).toBe("1h 1m");
	expect(formatAge(-1)).toBe("");
});

test("CouncilTreeWidget running row shows seat + verb-first last activity + age", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "ev7-widget-"));
	const runId = "runW";
	ensureRunDir(root, runId);
	writeManifest(root, runId, m("job-1"));
	// last toolCall 2m5s before NOW (00:02:55 vs 00:05:00)
	writeSession(root, runId, "job-1", [toolLine("1", "2026-01-01T00:02:55.000Z")]);

	const w = new CouncilTreeWidget(root, () => runId, theme, { now });
	const row = w.render(200).join("\n");
	expect(row).toContain("owner"); // seat name is shown; job id is dropped (EV-8 keynav territory)
	expect(row).not.toContain("job-1");
	expect(row).toMatch(/ran bash ls -la/); // verb-first copy
	expect(row).toMatch(/2m/); // age = 2m5s → "2m"
});

test("CouncilTreeWidget non-running row collapses to manifest state + settledAt copy", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "ev7-widget2-"));
	const runId = "runD";
	ensureRunDir(root, runId);
	// settled 3 minutes before NOW
	writeManifest(root, runId, m("job-1", { seat: "skeptic", state: "done", settledAt: NOW - 3 * 60_000 }));
	const w = new CouncilTreeWidget(root, () => runId, theme, { now });
	expect(w.render(200).join("\n")).toMatch(/settled 3m/);
});

test("CouncilTreeWidget empty state", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "ev7-widget3-"));
	const runId = "runE";
	ensureRunDir(root, runId);
	const w = new CouncilTreeWidget(root, () => runId, theme, { now });
	expect(w.render(200).join("\n")).toContain("no council jobs this session");
});

test("CouncilTreeWidget refresh picks up appended tail line (tail-read)", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "ev7-widget4-"));
	const runId = "runR";
	ensureRunDir(root, runId);
	writeManifest(root, runId, m("job-1"));
	const file = path.join(runDir(root, runId), "job-1.jsonl");
	const header = `{"type":"session","version":3,"id":"job-1","timestamp":"t","cwd":"/x"}`;
	fs.writeFileSync(file, header + "\n" + toolLine("1", "2026-01-01T00:04:00.000Z") + "\n");
	const w = new CouncilTreeWidget(root, () => runId, theme, { now });
	expect(w.render(200).join("\n")).toMatch(/ran bash/);

	// append a newer toolCall at 00:04:50 → age drops to 10s
	fs.appendFileSync(file, toolLine("2", "2026-01-01T00:04:50.000Z") + "\n");
	w.refresh();
	expect(w.render(200).join("\n")).toMatch(/ran bash/);
	expect(w.render(200).join("\n")).toMatch(/10s/);
});

test("surfaceForMode: guard is ctx.mode === 'tui' (RPC/headless → console, never widget)", () => {
	expect(surfaceForMode("tui")).toBe("widget");
	expect(surfaceForMode("rpc")).toBe("console");
	expect(surfaceForMode("print")).toBe("console");
	expect(surfaceForMode("json")).toBe("console");
});

test("clearTreeWidget calls setWidget(key, undefined) only in tui mode", () => {
	const calls: Array<{ key: string; val: unknown }> = [];
	const ui = { setWidget: (k: string, v: unknown) => void calls.push({ key: k, val: v }) };
	clearTreeWidget({ mode: "tui", ui } as never);
	clearTreeWidget({ mode: "rpc", ui } as never);
	expect(calls).toEqual([{ key: COUNCIL_TREE_WIDGET_KEY, val: undefined }]);
});