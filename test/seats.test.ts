import { test, expect } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import {
	parseSeatFile,
	parseQualifiedModel,
	loadSeat,
	listSeatNames,
	builtinToolsFor,
	grantsFor,
	buildSystemPrompt,
	buildChildArgv,
	proceduresDir,
	loadCouncilConfig,
	COUNCIL_CONFIG_FILE,
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
	expect(owner.body).not.toContain("ev-guide");
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

test("parseQualifiedModel is exported and splits a known :thinking suffix", () => {
	expect(parseQualifiedModel("openrouter/q/q:medium", "unit")).toEqual({
		model: "openrouter/q/q",
		thinkingLevel: "medium",
	});
});

test("parseQualifiedModel throws on an unknown non-empty :thinking suffix (Q3)", () => {
	expect(() => parseQualifiedModel("openrouter/q/q:MediuM", "unit")).toThrow(/MediuM/);
	expect(() => parseQualifiedModel("openrouter/q/q:MAX", "unit")).toThrow(/MAX/);
	expect(() => parseQualifiedModel("openrouter/q/q:maxx", "unit")).toThrow(/maxx/);
});

test("parseQualifiedModel: bare ids throw, trailing empty suffix keeps today's behavior (Q3)", () => {
	expect(() => parseQualifiedModel("qwen3.6-35b", "unit")).toThrow(/must be qualified/);
	expect(parseQualifiedModel("openrouter/q/q:", "unit").model).toBe("openrouter/q/q:");
});

test("parseSeatFile frontmatter rejects an unknown :thinking suffix (Q3)", () => {
	expect(() =>
		parseSeatFile(`---\nname: x\ndescription: d\nmodel: openrouter/q/q:MediuM\n---\nbody`, "x.md"),
	).toThrow(/MediuM/);
	expect(() =>
		parseSeatFile(`---\nname: x\ndescription: d\nmodel: openrouter/q/q:off\n---\nbody`, "x.md"),
	).not.toThrow();
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

test("buildChildArgv produces json print-mode invocation with session persistence", () => {
	const owner = loadSeat(tmpRepo(), "owner");
	const argv = buildChildArgv(
		owner,
		"do the thing",
		"/tmp/p.md",
		[],
		{ sessionDir: "/r/runs/x", sessionId: "job-1" },
	);
	expect(argv).toEqual([
		"--mode",
		"json",
		"-p",
		"-a",
		"--session-dir",
		"/r/runs/x",
		"--session-id",
		"job-1",
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

test("mcp frontmatter field parses as list", () => {
	const seat = parseSeatFile(
		`---\nname: x\ndescription: d\nmodel: m\nmcp: [a, b]\n---\nbody`,
		"x.md",
	);
	expect(seat.mcp).toEqual(["a", "b"]);
});

test("seats without mcp field default to no MCP access", () => {
	expect(loadSeat(tmpRepo(), "product-owner").mcp).toEqual([]);
});

test("buildChildArgv appends granted mcp tool names to --tools", () => {
	const owner = loadSeat(tmpRepo(), "owner");
	const argv = buildChildArgv(
		owner,
		"go",
		"/tmp/p.md",
		["mcp__context7__search", "mcp__context7__docs"],
		{ sessionDir: "/r", sessionId: "job-1" },
	);
	expect(argv).toContain("read,bash,edit,write,grep,find,ls,mcp__context7__search,mcp__context7__docs");
});

// ---- .council.json override layer ----

function writeConfig(root: string, data: unknown): void {
	fs.writeFileSync(path.join(root, COUNCIL_CONFIG_FILE), JSON.stringify(data));
}

test("absent .council.json yields no overrides and leaves seat untouched", () => {
	const owner = loadSeat(tmpRepo(), "owner");
	expect(owner.model).toBe("openrouter/deepseek/deepseek-v4-flash-0731");
	expect(owner.thinkingLevel).toBe("high");
});

test("object override replaces model and thinking together", () => {
	const root = tmpRepo();
	writeConfig(root, {
		council: {
			owner: { model: "openrouter/api/override", thinking: "low" },
		},
	});
	const owner = loadSeat(root, "owner");
	expect(owner.model).toBe("openrouter/api/override");
	expect(owner.thinkingLevel).toBe("low");
	// untouched seats keep their frontmatter defaults
	expect(loadSeat(root, "judge").model).toBe("openrouter/qwen/qwen3.6-35b-a3b");
});

test("model-only override preserves frontmatter thinking", () => {
	const root = tmpRepo();
	writeConfig(root, { council: { owner: { model: "openrouter/api/override" } } });
	const owner = loadSeat(root, "owner");
	expect(owner.model).toBe("openrouter/api/override");
	expect(owner.thinkingLevel).toBe("high");
});

test("thinking-only override preserves frontmatter model", () => {
	const root = tmpRepo();
	writeConfig(root, { council: { owner: { thinking: "off" } } });
	const owner = loadSeat(root, "owner");
	expect(owner.model).toBe("openrouter/deepseek/deepseek-v4-flash-0731");
	expect(owner.thinkingLevel).toBe("off");
});

test("string shorthand override parses model and optional :thinking suffix", () => {
	const root = tmpRepo();
	writeConfig(root, { council: { designer: "openrouter/api/override:minimal" } });
	const d = loadSeat(root, "designer");
	expect(d.model).toBe("openrouter/api/override");
	expect(d.thinkingLevel).toBe("minimal");
});

test("explicit thinking key beats inline :suffix in the override model", () => {
	const root = tmpRepo();
	writeConfig(root, { council: { owner: { model: "openrouter/api/override:max", thinking: "low" } } });
	const owner = loadSeat(root, "owner");
	expect(owner.model).toBe("openrouter/api/override");
	expect(owner.thinkingLevel).toBe("low");
});

test("override ooze flows into buildChildArgv --model/--thinking", () => {
	const root = tmpRepo();
	writeConfig(root, { council: { owner: { model: "openrouter/api/override", thinking: "medium" } } });
	const argv = buildChildArgv(loadSeat(root, "owner"), "do", "/tmp/p.md", [], {
		sessionDir: "/r",
		sessionId: "job-1",
	});
	expect(argv).toContain("openrouter/api/override");
	expect(argv).toContain("--thinking");
	expect(argv[argv.indexOf("--thinking") + 1]).toBe("medium");
});

test("config referencing an unknown seat does not affect known seats", () => {
	const root = tmpRepo();
	writeConfig(root, { council: { nope: { model: "x/y" } } });
	expect(loadSeat(root, "owner").model).toBe("openrouter/deepseek/deepseek-v4-flash-0731");
});

test("malformed .council.json throws a useful error", () => {
	const root = tmpRepo();
	expect(() => {
		fs.writeFileSync(path.join(root, COUNCIL_CONFIG_FILE), "{ not json");
		loadCouncilConfig(root);
	}).toThrow(/council\.json/);
});

test("council section missing means no overrides", () => {
	const root = tmpRepo();
	writeConfig(root, { somethingElse: true });
	expect(loadCouncilConfig(root)).toEqual({});
	expect(loadSeat(root, "owner").model).toBe("openrouter/deepseek/deepseek-v4-flash-0731");
});

test("buildChildArgv grants hub tools to hub-enabled seats via --tools", () => {
	const runner = loadSeat(tmpRepo(), "council-runner");
	const argv = buildChildArgv(
		runner,
		"run the card",
		"/tmp/p.md",
		[],
		{ sessionDir: "/r", sessionId: "job-1" },
	);
	expect(argv).toContain(
		"read,bash,edit,write,grep,find,ls,council_dispatch,council_wait,council_cancel",
	);
});

test("buildChildArgv does not grant hub tools to seats without the hub grant", () => {
	const owner = loadSeat(tmpRepo(), "owner");
	const argv = buildChildArgv(
		owner,
		"go",
		"/tmp/p.md",
		[],
		{ sessionDir: "/r", sessionId: "job-1" },
	);
	expect(argv).toContain("read,bash,edit,write,grep,find,ls");
	expect(argv.join(",")).not.toContain("council_dispatch");
});
