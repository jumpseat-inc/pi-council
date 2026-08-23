import { test, expect } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { CONFIG_DIR_NAME } from "@earendil-works/pi-coding-agent";
import { SUPERPOWERS_SOURCE, resolveSuperpowers, packagesHolding } from "../extensions/superpowers.ts";

function writeSettings(file: string, packages: string[]): string {
	fs.mkdirSync(path.dirname(file), { recursive: true });
	fs.writeFileSync(file, JSON.stringify({ packages }));
	return file;
}

const SOURCE = SUPERPOWERS_SOURCE;

test("packagesHolding filters the exact repo identity across entry shapes", () => {
	expect(packagesHolding(["git:github.com/obra/superpowers", "npm:other"], SOURCE)).toEqual([
		"git:github.com/obra/superpowers",
	]);
	expect(packagesHolding(["npm:other"], SOURCE)).toEqual([]);
	expect(packagesHolding([], SOURCE)).toEqual([]);
});

test("not in project or global → neither scope holds it", () => {
	const r = resolveSuperpowers({
		projectSettingsFile: null,
		globalSettingsFile: null,
	});
	expect(r.project.in).toBe(false);
	expect(r.global.in).toBe(false);
	expect(r.portable).toBe(false);
	expect(r.message).toContain("not");
});

test("project-local entry → pinned in project scope", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "council-sup-proj-"));
	const proj = writeSettings(path.join(root, CONFIG_DIR_NAME, "settings.json"), [SOURCE]);
	const r = resolveSuperpowers({ projectSettingsFile: proj, globalSettingsFile: null });
	expect(r.project.in).toBe(true);
	expect(r.inGlobal).toBe(false);
	expect(r.portable).toBe(true);
});

test("global-only entry → available but not pinned in project", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "council-sup-glob-"));
	const glob = writeSettings(path.join(root, "global.json"), [SOURCE]);
	const r = resolveSuperpowers({ projectSettingsFile: null, globalSettingsFile: glob });
	expect(r.inGlobal).toBe(true);
	expect(r.project.in).toBe(false);
	expect(r.portable).toBe(false);
	expect(r.message).toContain("global");
});

test("project entry wins when both scopes hold it", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "council-sup-both-"));
	const proj = writeSettings(path.join(root, CONFIG_DIR_NAME, "settings.json"), [SOURCE]);
	const glob = writeSettings(path.join(root, "global.json"), [SOURCE]);
	const r = resolveSuperpowers({ projectSettingsFile: proj, globalSettingsFile: glob });
	expect(r.project.in).toBe(true);
	expect(r.inGlobal).toBe(true);
});

test("missing settings files never throw", () => {
	const r = resolveSuperpowers({ projectSettingsFile: "/nonexistent/x.json", globalSettingsFile: "/nonexistent/y.json" });
	expect(r.project.in).toBe(false);
	expect(r.inGlobal).toBe(false);
});