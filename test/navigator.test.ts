import { test, expect } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { CouncilTree, type NavTheme } from "../extensions/navigator.ts";
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