import { test, expect } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { buildTree, flattenTree, textTree } from "../extensions/tree.ts";
import { ensureRunDir, writeManifest, type RunManifest } from "../extensions/runs.ts";

function m(id: string, over: Partial<RunManifest> = {}): RunManifest {
	return {
		id,
		seat: id.includes(".") ? "skeptic" : "owner",
		model: "m/x",
		parentJobId: id.includes(".") ? id.split(".").slice(0, -1).join(".") : null,
		pid: null,
		sessionId: id,
		state: "done",
		startedAt: 1,
		settledAt: 2,
		exitCode: 0,
		...over,
	};
}

test("buildTree nests by parentJobId and sorts numerically", () => {
	const roots = buildTree([m("job-2"), m("job-1"), m("job-1.10"), m("job-1.2")], () => false);
	expect(roots.map((r) => r.manifest.id)).toEqual(["job-1", "job-2"]);
	expect(roots[0].children.map((c) => c.manifest.id)).toEqual(["job-1.2", "job-1.10"]);
	expect(roots[0].children[0].depth).toBe(1);
});

test("orphaned: running manifest with dead pid", () => {
	const roots = buildTree([m("job-1", { state: "running", pid: 999999 })], (pid) => pid === process.pid);
	expect(roots[0].orphaned).toBe(true);
	const alive = buildTree([m("job-1", { state: "running", pid: process.pid })], (pid) => pid === process.pid);
	expect(alive[0].orphaned).toBe(false);
});

test("flattenTree is pre-order", () => {
	const flat = flattenTree(buildTree([m("job-1"), m("job-1.2"), m("job-1.2.1")], () => false));
	expect(flat.map((n) => n.manifest.id)).toEqual(["job-1", "job-1.2", "job-1.2.1"]);
});

test("textTree renders indented rows with glyphs", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "council-tree-"));
	ensureRunDir(root, "runT");
	writeManifest(root, "runT", m("job-1", { state: "running", pid: process.pid }));
	writeManifest(root, "runT", m("job-1.2", { state: "failed", pid: 12 }));
	const lines = textTree(root, ["runT"]);
	expect(lines[0]).toBe("run runT");
	expect(lines[1]).toContain("● job-1 owner");
	expect(lines[2]).toMatch(/^\s{4}✗ job-1\.2 skeptic failed/);
});