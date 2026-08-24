import { test, expect } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { CouncilTree, TranscriptView, type NavTheme } from "../extensions/navigator.ts";
import { ensureRunDir, writeManifest, type RunManifest } from "../extensions/runs.ts";

const theme: NavTheme = { fg: (_c, s) => s, bold: (s) => s };

function m(id: string, over: Partial<RunManifest> = {}): RunManifest {
	return {
		id,
		seat: "owner",
		model: "m/x",
		parentJobId: id.includes(".") ? "job-1" : null,
		pid: null,
		sessionId: id,
		state: "running",
		startedAt: Date.now(),
		settledAt: null,
		exitCode: null,
		...over,
	};
}

test("CouncilTree renders rows indented by depth and selects with arrows", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "council-nav-"));
	ensureRunDir(root, "runV");
	writeManifest(root, "runV", m("job-1"));
	writeManifest(root, "runV", m("job-1.2", { seat: "skeptic" }));
	const openedRef: { value: string | null } = { value: null };
	const tree = new CouncilTree(root, "runV", theme, (n) => (openedRef.value = n.manifest.id), () => {});
	const lines = tree.render(100);
	expect(lines[1]).toContain("job-1 owner");
	expect(lines[2]).toContain("job-1.2 skeptic");
	expect(lines[2].indexOf("job-1.2")).toBeGreaterThan(lines[1].indexOf("job-1"));
	tree.handleInput("\x1b[B"); // down
	tree.handleInput("\r"); // enter
	expect(openedRef.value).toBe("job-1.2");
});

test("CouncilTree with no jobs renders empty hint", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "council-nav2-"));
	const tree = new CouncilTree(root, undefined, theme, () => {}, () => {});
	expect(tree.render(80).some((l) => l.includes("(no jobs)"))).toBe(true);
});

test("TranscriptView renders blocks and expands with e", () => {
	const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "council-view-")), "s.jsonl");
	const user = `{"type":"message","id":"1","parentId":null,"timestamp":"t","message":{"role":"user","content":[{"type":"text","text":"hello"}]}}`;
	const result = `{"type":"message","id":"2","parentId":"1","timestamp":"t","message":{"role":"toolResult","toolCallId":"c","toolName":"bash","content":[{"type":"text","text":"line1\\nline2"}],"isError":false}}`;
	fs.writeFileSync(
		file,
		`{"type":"session","version":3,"id":"job-1","timestamp":"t","cwd":"/x"}\n${user}\n${result}\n`,
	);
	let closed = false;
	const view = new TranscriptView(file, theme, "job-1 owner", 24, () => (closed = true));
	const lines = view.render(80);
	expect(lines.some((l) => l.includes("user"))).toBe(true);
	expect(lines.some((l) => l.includes("hello"))).toBe(true);
	expect(lines.some((l) => l.includes("line1"))).toBe(true); // collapsed first-line preview
	expect(lines.some((l) => l.includes("line2"))).toBe(false); // rest hidden until expanded
	// focus the toolResult block (index 1) and expand
	view.handleInput("\x1b[B"); // down
	view.handleInput("e");
	const expanded = view.render(80);
	expect(expanded.some((l) => l.includes("line2"))).toBe(true);
	view.handleInput("\x1b"); // esc closes
	expect(closed).toBe(true);
	view.dispose();
});

test("TranscriptView without a session file renders a no-transcript notice", () => {
	let closed = false;
	const view = new TranscriptView(undefined, theme, "job-9 owner", 24, () => (closed = true));
	expect(view.render(80).some((l) => l.includes("no transcript"))).toBe(true);
	view.dispose();
});