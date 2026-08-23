import { test, expect } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import {
	parseSeatFile,
	loadSeat,
	listSeatNames,
	builtinToolsFor,
	grantsFor,
	buildSystemPrompt,
	buildChildArgv,
	proceduresDir,
	PKG_ROOT,
} from "../extensions/seats.ts";

function tmpRepo(): string {
	return fs.mkdtempSync(path.join(os.tmpdir(), "council-seats-"));
}

test("lists all 9 packaged seats", () => {
	const names = listSeatNames(tmpRepo());
	expect(names).toEqual([
		"consolidator",
		"council-runner",
		"designer",
		"judge",
		"owner",
		"principal",
		"product-owner",
		"skeptic",
		"steward",
	]);
});

test("repo-local seat shadows packaged seat of the same name", () => {
	const root = tmpRepo();
	const dir = path.join(root, ".pi", "agents");
	fs.mkdirSync(dir, { recursive: true });
	fs.writeFileSync(
		path.join(dir, "owner.md"),
		"---\nname: owner\ndescription: override\nmodel: test/model\n---\nOVERRIDE BODY",
	);
	const owner = loadSeat(root, "owner");
	expect(owner.body).toBe("OVERRIDE BODY");
	expect(owner.model).toBe("test/model");
	// non-shadowed seats still come from the package
	expect(loadSeat(root, "judge").name).toBe("judge");
});

test("designer: minimax m3, high thinking, read/search/write, no bash, no hub", () => {
	const d = loadSeat(tmpRepo(), "designer");
	expect(d.model).toBe("openrouter/minimax/minimax-m3");
	expect(d.thinkingLevel).toBe("high");
	expect(builtinToolsFor(d)).toEqual(["read", "write", "grep", "find", "ls"]);
	expect(grantsFor(d)).toEqual({ hub: false });
});

test("parses owner seat: model split, tools, no autoloadSkills", () => {
	const owner = loadSeat(tmpRepo(), "owner");
	expect(owner.model).toBe("openrouter/deepseek/deepseek-v4-flash-0731");
	expect(owner.thinkingLevel).toBe("high");
	expect(owner.tools).toEqual(["Read", "Grep", "Glob", "Edit", "Write", "Bash"]);
	expect((owner as unknown as Record<string, unknown>).autoloadSkills).toBeUndefined();
	expect(owner.body).toContain("<role>");
	expect(owner.body).not.toContain("ev-guide` skill");
});

test("parses council-runner spawns list", () => {
	const runner = loadSeat(tmpRepo(), "council-runner");
	expect(runner.spawns).toEqual(["owner", "principal", "designer", "skeptic", "consolidator", "judge"]);
	expect(grantsFor(runner).hub).toBe(true);
});

test("consolidator is read-only", () => {
	const c = loadSeat(tmpRepo(), "consolidator");
	expect(builtinToolsFor(c)).toEqual(["read"]);
	expect(grantsFor(c)).toEqual({ hub: false });
});

test("model without thinking suffix parses cleanly", () => {
	const seat = parseSeatFile(
		`---\nname: x\ndescription: d\nmodel: openrouter/foo/bar\ntools: Read\n---\nbody`,
		"x.md",
	);
	expect(seat.model).toBe("openrouter/foo/bar");
	expect(seat.thinkingLevel).toBeUndefined();
});

test("missing name throws", () => {
	expect(() => parseSeatFile(`---\ndescription: d\n---\nbody`, "bad.md")).toThrow(/name/);
});

test("loadSeat unknown seat throws with available names", () => {
	expect(() => loadSeat(tmpRepo(), "nonexistent")).toThrow(/nonexistent.*steward/s);
});

test("buildSystemPrompt without vault: runtime block + degraded grounding", () => {
	const root = tmpRepo();
	const seat = loadSeat(root, "judge");
	const p = buildSystemPrompt(root, seat, proceduresDir(root));
	expect(p).toContain(seat.body.slice(0, 100));
	expect(p).toContain("<council_runtime>");
	expect(p).toContain(path.join(PKG_ROOT, "council", "procedures"));
	expect(p).toContain("No repository wiki found; ground claims in the actual code before asserting them.");
});

test("buildSystemPrompt with vault: wiki grounding", () => {
	const root = tmpRepo();
	fs.mkdirSync(path.join(root, "vault", "wiki"), { recursive: true });
	fs.writeFileSync(path.join(root, "vault", "wiki", "index.md"), "# Wiki Index\n");
	const seat = loadSeat(root, "judge");
	const p = buildSystemPrompt(root, seat, proceduresDir(root));
	expect(p).toContain("This repository maintains an LLM wiki under `vault/`.");
	expect(p).toContain("vault/wiki/index.md");
	expect(p).not.toContain("No repository wiki found");
});

test("proceduresDir: packaged default, then repo override", () => {
	const root = tmpRepo();
	expect(proceduresDir(root)).toBe(path.join(PKG_ROOT, "council", "procedures"));
	const ov = path.join(root, ".pi", "council", "procedures");
	fs.mkdirSync(ov, { recursive: true });
	expect(proceduresDir(root)).toBe(ov);
});

test("buildChildArgv produces json print-mode invocation", () => {
	const owner = loadSeat(tmpRepo(), "owner");
	const argv = buildChildArgv(owner, "do the thing", "/tmp/p.md");
	expect(argv).toEqual([
		"--mode",
		"json",
		"-p",
		"-a",
		"--no-session",
		"--model",
		"openrouter/deepseek/deepseek-v4-flash-0731",
		"--thinking",
		"high",
		"--tools",
		"read,bash,edit,write,grep,find,ls",
		"--append-system-prompt",
		"/tmp/p.md",
		"do the thing",
	]);
});
