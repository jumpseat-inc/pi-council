import { test, expect } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { loadSeat } from "../extensions/seats.ts";
import { isCallAllowed } from "../extensions/child.ts";

const root = fs.mkdtempSync(path.join(os.tmpdir(), "council-child-"));

test("principal: read/grep/find/ls allowed, bash/write/edit blocked", () => {
	const p = loadSeat(root, "principal");
	expect(isCallAllowed(p, "read")).toBe(true);
	expect(isCallAllowed(p, "grep")).toBe(true);
	expect(isCallAllowed(p, "find")).toBe(true);
	expect(isCallAllowed(p, "ls")).toBe(true);
	expect(isCallAllowed(p, "bash")).toBe(false);
	expect(isCallAllowed(p, "write")).toBe(false);
	expect(isCallAllowed(p, "edit")).toBe(false);
	expect(isCallAllowed(p, "council_dispatch")).toBe(false);
});

test("judge: read+bash allowed, write blocked", () => {
	const j = loadSeat(root, "judge");
	expect(isCallAllowed(j, "read")).toBe(true);
	expect(isCallAllowed(j, "bash")).toBe(true);
	expect(isCallAllowed(j, "write")).toBe(false);
});

test("council-runner: hub tools allowed", () => {
	const r = loadSeat(root, "council-runner");
	expect(isCallAllowed(r, "council_dispatch")).toBe(true);
	expect(isCallAllowed(r, "council_wait")).toBe(true);
	expect(isCallAllowed(r, "council_cancel")).toBe(true);
});

test("consolidator: only read", () => {
	const c = loadSeat(root, "consolidator");
	expect(isCallAllowed(c, "read")).toBe(true);
	for (const t of ["bash", "write", "edit", "grep", "find", "ls", "council_dispatch"]) {
		expect(isCallAllowed(c, t)).toBe(false);
	}
});

test("mcp grants: granted server's tools allowed, others blocked", () => {
	const dir = path.join(root, ".pi", "agents");
	fs.mkdirSync(dir, { recursive: true });
	fs.writeFileSync(
		path.join(dir, "mcpseat.md"),
		"---\nname: mcpseat\ndescription: d\nmodel: openrouter/test/m\ntools: Read\nmcp: [context7]\n---\nbody",
	);
	const s = loadSeat(root, "mcpseat");
	expect(s.mcp).toEqual(["context7"]);
	expect(isCallAllowed(s, "mcp__context7__resolve-library-id")).toBe(true);
	expect(isCallAllowed(s, "mcp__other__tool")).toBe(false);
	expect(isCallAllowed(s, "read")).toBe(true);
});

test("seat without mcp field gets zero MCP access", () => {
	const j = loadSeat(root, "judge");
	expect(j.mcp).toEqual([]);
	expect(isCallAllowed(j, "mcp__context7__search")).toBe(false);
});
