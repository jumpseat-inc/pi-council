import { test, expect } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { CONFIG_DIR_NAME } from "@earendil-works/pi-coding-agent";
import {
	SUPERPOWERS_SOURCE,
	ASK_USER_QUESTION_SOURCE,
	COUNCIL_DEPENDENCIES,
	resolveCouncilDependencies,
	resolveDependency,
	packagesHolding,
	installArgsFor,
} from "../extensions/dependencies.ts";

function writeSettings(file: string, packages: string[]): string {
	fs.mkdirSync(path.dirname(file), { recursive: true });
	fs.writeFileSync(file, JSON.stringify({ packages }));
	return file;
}

test("packagesHolding matches git and npm identities across entry shapes", () => {
	expect(packagesHolding(["git:github.com/obra/superpowers", "npm:other"], SUPERPOWERS_SOURCE)).toEqual([
		"git:github.com/obra/superpowers",
	]);
	expect(
		packagesHolding(
			["npm:@juicesharp/rpiv-ask-user-question", "npm:@juicesharp/rpiv-ask-user-question@1.2.3", "npm:other"],
			ASK_USER_QUESTION_SOURCE,
		),
	).toEqual(["npm:@juicesharp/rpiv-ask-user-question", "npm:@juicesharp/rpiv-ask-user-question@1.2.3"]);
	expect(packagesHolding(["npm:other"], SUPERPOWERS_SOURCE)).toEqual([]);
	expect(packagesHolding([], ASK_USER_QUESTION_SOURCE)).toEqual([]);
});

test("COUNCIL_DEPENDENCIES lists superpowers then ask-user-question", () => {
	expect(COUNCIL_DEPENDENCIES.map((d) => d.source)).toEqual([
		SUPERPOWERS_SOURCE,
		ASK_USER_QUESTION_SOURCE,
	]);
});

test("resolveCouncilDependencies: absent everywhere → none portable", () => {
	const deps = resolveCouncilDependencies({ projectSettingsFile: null, globalSettingsFile: null });
	expect(deps).toHaveLength(2);
	for (const d of deps) {
		expect(d.project.in).toBe(false);
		expect(d.global.in).toBe(false);
		expect(d.portable).toBe(false);
		expect(d.message).toContain("not");
	}
});

test("project-local entries → pinned in project scope for each dependency", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "council-dep-proj-"));
	const proj = writeSettings(path.join(root, CONFIG_DIR_NAME, "settings.json"), [
		SUPERPOWERS_SOURCE,
		ASK_USER_QUESTION_SOURCE,
	]);
	const deps = resolveCouncilDependencies({ projectSettingsFile: proj, globalSettingsFile: null });
	expect(deps.map((d) => d.portable)).toEqual([true, true]);
	expect(deps.map((d) => d.inGlobal)).toEqual([false, false]);
});

test("global-only entries → available but not pinned", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "council-dep-glob-"));
	const glob = writeSettings(path.join(root, "global.json"), [
		SUPERPOWERS_SOURCE,
		ASK_USER_QUESTION_SOURCE,
	]);
	const deps = resolveCouncilDependencies({ projectSettingsFile: null, globalSettingsFile: glob });
	expect(deps.map((d) => d.inGlobal)).toEqual([true, true]);
	expect(deps.map((d) => d.portable)).toEqual([false, false]);
});

test("project entry wins when both scopes hold it", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "council-dep-both-"));
	const proj = writeSettings(path.join(root, CONFIG_DIR_NAME, "settings.json"), [SUPERPOWERS_SOURCE]);
	const glob = writeSettings(path.join(root, "global.json"), [SUPERPOWERS_SOURCE, ASK_USER_QUESTION_SOURCE]);
	const deps = resolveCouncilDependencies({ projectSettingsFile: proj, globalSettingsFile: glob });
	const sp = deps.find((d) => d.source === SUPERPOWERS_SOURCE);
	const auq = deps.find((d) => d.source === ASK_USER_QUESTION_SOURCE);
	expect(sp?.inProject).toBe(true);
	expect(sp?.inGlobal).toBe(true);
	expect(auq?.inProject).toBe(false);
	expect(auq?.inGlobal).toBe(true);
});

test("resolveDependency keeps a stable label + source", () => {
	const dep = COUNCIL_DEPENDENCIES[1];
	const r = resolveDependency(dep, { projectSettingsFile: null, globalSettingsFile: null });
	expect(r.label).toBe("ask-user-question");
	expect(r.source).toBe(ASK_USER_QUESTION_SOURCE);
});

test("installArgsFor: untrusted project gets --approve so pi install -l succeeds headless", () => {
	// Headless/remote sessions never show the trust prompt; without --approve
	// pi refuses project-local installs with "Project is not trusted".
	const dep = COUNCIL_DEPENDENCIES[1]; // ask-user-question
	expect(installArgsFor(dep.source, { projectTrusted: false })).toEqual(["install", "-l", "--approve", dep.source]);
	// A trusted project needs no override — installing is already allowed.
	expect(installArgsFor(dep.source, { projectTrusted: true })).toEqual(["install", "-l", dep.source]);
});

test("missing settings files never throw", () => {
	const deps = resolveCouncilDependencies({
		projectSettingsFile: "/nonexistent/x.json",
		globalSettingsFile: "/nonexistent/y.json",
	});
	expect(deps.map((d) => d.inProject)).toEqual([false, false]);
	expect(deps.map((d) => d.inGlobal)).toEqual([false, false]);
});
