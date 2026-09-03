/**
 * EV-17 — per-run model override on the eval dispatch path.
 *
 * Acceptance B1–B4, D2, D3 (spec §10), plus the card's own acceptance:
 *   - the spawned session argv carries the override model (and thinking, if any)
 *   - the override works without writing to seat frontmatter or .council.json
 *   - a test proves the spawned argv reflects the override for at least one
 *     seat and one procedure, and that an omitted override falls back to the
 *     seat's resolved model unchanged.
 *
 * Dispatch tests drive the REAL registerHubTools tool registration against a
 * fake pi ExtensionAPI + modelRegistry; the spawned executable is swapped for
 * the repo's stub child so no pi binary or network is involved. The hub
 * identity is re-initialized between dispatches to model each spawned process
 * (the same way runChildMode re-inits per child), so manifests land in one
 * run dir with parentJobId-chained ids.
 */
import { test, expect, afterEach } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { CONFIG_DIR_NAME } from "@earendil-works/pi-coding-agent";

import {
	applySeatOverride,
	loadSeat,
	parseSeatFile,
	COUNCIL_CONFIG_FILE,
	PKG_ROOT,
	resolveEffectiveModel,
} from "../extensions/seats.ts";
import { getHub, initHubIdentity, registerHubTools, shutdownHub } from "../extensions/hub-tools.ts";
import { readManifests } from "../extensions/runs.ts";

const STUB = path.join(import.meta.dir, "stub-child.ts");

function tmpRepo(): string {
	return fs.mkdtempSync(path.join(os.tmpdir(), "council-eval-ovr-"));
}

function writeRepoSeat(root: string, name: string, model: string, tools = "Read"): void {
	const dir = path.join(root, CONFIG_DIR_NAME, "agents");
	fs.mkdirSync(dir, { recursive: true });
	fs.writeFileSync(
		path.join(dir, `${name}.md`),
		`---\nname: ${name}\ndescription: test\ndescription-extra: unit\nmodel: ${model}\ntools: ${tools}\n---\nunit-test body`,
	);
}

function catalogueFor(qualified: string[]): Array<{ provider: string; id: string }> {
	return qualified.map((q) => {
		const slash = q.indexOf("/");
		if (slash === -1) throw new Error(`test fixture model must be qualified: ${q}`);
		return { provider: q.slice(0, slash), id: q.slice(slash + 1) };
	});
}

interface SpawnCapture {
	args: string[];
	env: Record<string, string>;
	model?: string;
}

/**
 * Register the real hub tools for `root` and hand back a dispatch function
 * that drives council_dispatch's execute with a fake modelRegistry. The hub's
 * spawnJob is wrapped to (a) capture the original spawn opts (the root argv /
 * env / manifest) and (b) keep the real spawn path but run the stub child.
 */
function makeDispatcher(root: string, catalogue: string[]): {
	dispatch: (params: Record<string, unknown>) => Promise<Record<string, any>>;
	spawns: SpawnCapture[];
} {
	const spawns: SpawnCapture[] = [];
	let dispatchTool:
		| { execute: (id: unknown, params: unknown, signal: unknown, onUpdate: unknown, ctx: unknown) => Promise<Record<string, any>> }
		| undefined;
	const pi: unknown = {
		registerTool: (t: {
			name: string;
			execute: (id: unknown, params: unknown, signal: unknown, onUpdate: unknown, ctx: unknown) => Promise<Record<string, any>>;
		}) => {
			if (t.name === "council_dispatch") dispatchTool = { execute: t.execute };
		},
	};
	registerHubTools(pi as never, root);
	const hub = getHub(root);
	const real = hub.spawnJob.bind(hub);
	(hub as unknown as { spawnJob: (o: Record<string, unknown>) => unknown }).spawnJob = (o: Record<string, unknown>) => {
		spawns.push({ args: o.args as string[], env: o.env as Record<string, string>, model: o.model as string | undefined });
		// Keep the real spawn path (manifests, pid bookkeeping) but run the
		// stub child instead of a pi session.
		return real({ ...o, command: "bun", args: [STUB] } as Parameters<typeof real>[0]);
	};
	if (!dispatchTool) throw new Error("council_dispatch was not registered");
	const ctx = { modelRegistry: { getAvailable: () => catalogueFor(catalogue) } };
	return {
		dispatch: (params) => dispatchTool!.execute(null, params, undefined, undefined, ctx),
		spawns,
	};
}

afterEach(() => {
	shutdownHub();
	delete process.env.COUNCIL_EVAL_MODEL;
});

// ================= B1 — pure precedence (spec §10 B1) =================

const FM = `---\nname: seat\ndescription: d\nmodel: openrouter/a/model:off\n---\nbody`;

test("B1: resolveEffectiveModel precedence — param > env > .council.json > frontmatter, all four combinations", () => {
	// seat = loadSeat output: frontmatter a, .council.json b already applied.
	const frontmatter = parseSeatFile(FM, "seat.md");
	expect(frontmatter.model).toBe("openrouter/a/model");
	expect(frontmatter.thinkingLevel).toBe("off");
	const withConfig = applySeatOverride(frontmatter, { seat: { model: "openrouter/b/model" } });
	expect(withConfig.model).toBe("openrouter/b/model");

	// 1. no env, no param → .council.json-layer value (b)
	expect(resolveEffectiveModel(withConfig)).toEqual({ model: "openrouter/b/model", thinkingLevel: "off" });
	// (none anywhere → frontmatter value)
	expect(resolveEffectiveModel(frontmatter)).toEqual({ model: "openrouter/a/model", thinkingLevel: "off" });
	// 2. env only → env value (c), beats .council.json
	expect(resolveEffectiveModel(withConfig, "openrouter/c/model")).toEqual({ model: "openrouter/c/model", thinkingLevel: "off" });
	// 4. param only → param value (d), no env involved
	expect(resolveEffectiveModel(withConfig, undefined, { model: "openrouter/d/model" })).toEqual({ model: "openrouter/d/model", thinkingLevel: "off" });
	// 3. env + param → param wins
	expect(resolveEffectiveModel(withConfig, "openrouter/c/model", { model: "openrouter/d/model" })).toEqual({ model: "openrouter/d/model", thinkingLevel: "off" });
});

test("B1b: :thinking suffix parses in all three override sources (env, param, .council.json)", () => {
	const frontmatter = parseSeatFile(FM, "seat.md");
	// .council.json override carrying a :suffix
	const withConfig = applySeatOverride(frontmatter, { seat: { model: "openrouter/b/model:xhigh" } });
	expect(withConfig.model).toBe("openrouter/b/model");
	expect(withConfig.thinkingLevel).toBe("xhigh");
	// env carrying a :suffix
	expect(resolveEffectiveModel(withConfig, "openrouter/c/model:high")).toEqual({ model: "openrouter/c/model", thinkingLevel: "high" });
	// param model carrying a :suffix
	expect(resolveEffectiveModel(withConfig, undefined, { model: "openrouter/d/model:minimal" })).toEqual({ model: "openrouter/d/model", thinkingLevel: "minimal" });
	// explicit param.thinking beats the env suffix
	expect(resolveEffectiveModel(frontmatter, "openrouter/c/model:high", { model: "openrouter/d/model", thinking: "low" })).toEqual({ model: "openrouter/d/model", thinkingLevel: "low" });
	// env suffix survives when the param model carries none (per-dimension fall-through)
	expect(resolveEffectiveModel(frontmatter, "openrouter/c/model:high", { model: "openrouter/d/model" })).toEqual({ model: "openrouter/d/model", thinkingLevel: "high" });
});

test("B1c: unqualified or invalid override values throw loudly (no second grammar)", () => {
	const seat = parseSeatFile(`---\nname: seat\ndescription: d\nmodel: openrouter/a/model\ntools: Read\n---\nbody`, "seat.md");
	expect(() => resolveEffectiveModel(seat, "naked-model")).toThrow(/must be qualified/);
	expect(() => resolveEffectiveModel(seat, undefined, { model: "naked-model" })).toThrow(/must be qualified/);
	expect(() => resolveEffectiveModel(seat, "openrouter/c/model", { thinking: "turbo" })).toThrow(/thinking/);
});

// ================= B2 — dispatch under COUNCIL_EVAL_MODEL (spec §10 B2) =================

test("B2: dispatch under env COUNCIL_EVAL_MODEL — root argv, child env, and manifest carry the override; files untouched", async () => {
	const root = tmpRepo();
	writeRepoSeat(root, "agent-s", "openrouter/frontmatter/model");
	fs.writeFileSync(
		path.join(root, COUNCIL_CONFIG_FILE),
		JSON.stringify({ council: { "agent-s": { model: "openrouter/config/model" } } }),
	);
	const seatBytes = fs.readFileSync(path.join(root, CONFIG_DIR_NAME, "agents", "agent-s.md"), "utf-8");
	const configBytes = fs.readFileSync(path.join(root, COUNCIL_CONFIG_FILE), "utf-8");
	initHubIdentity("run-b2", "cellA");
	const { dispatch, spawns } = makeDispatcher(root, ["openrouter/frontmatter/model", "openrouter/env/model"]);
	process.env.COUNCIL_EVAL_MODEL = "openrouter/env/model";
	const res = await dispatch({ seat: "agent-s", input: "task" });
	expect(res.isError).toBeFalsy();
	expect(spawns).toHaveLength(1);
	const s = spawns[0];
	// root argv carries the effective model — and only one --model
	expect(s.args[s.args.indexOf("--model") + 1]).toBe("openrouter/env/model");
	expect(s.args.filter((a) => a === "--model")).toHaveLength(1);
	// the override rides the spawned job's env, reaching the whole subtree
	expect(s.env.COUNCIL_EVAL_MODEL).toBe("openrouter/env/model");
	// the manifest model field is the effective model
	const ms = readManifests(root, "run-b2");
	expect(ms.find((m) => m.id === "cellA.1")!.model).toBe("openrouter/env/model");
	// no mutation of seat frontmatter or .council.json
	expect(fs.readFileSync(path.join(root, CONFIG_DIR_NAME, "agents", "agent-s.md"), "utf-8")).toBe(seatBytes);
	expect(fs.readFileSync(path.join(root, COUNCIL_CONFIG_FILE), "utf-8")).toBe(configBytes);
	// dispatch never writes to the parent's process.env — we clear our own set and verify
	delete process.env.COUNCIL_EVAL_MODEL;
	expect(process.env.COUNCIL_EVAL_MODEL).toBeUndefined();
});

test("B2b: a nested dispatch in the eval subtree re-applies the inherited env — grandchild manifest model equals the override", async () => {
	const root = tmpRepo();
	writeRepoSeat(root, "agent-s", "openrouter/frontmatter/model");
	initHubIdentity("run-b2b", "cellA");
	const cat = ["openrouter/frontmatter/model", "openrouter/env/model"];
	process.env.COUNCIL_EVAL_MODEL = "openrouter/env/model";
	// root dispatch: the spawn env carries the override into the subtree
	const first = makeDispatcher(root, cat);
	await first.dispatch({ seat: "agent-s", input: "root task" });
	expect(first.spawns[0].env.COUNCIL_EVAL_MODEL).toBe("openrouter/env/model");
	// the child process re-enters council_dispatch (its own hub identity =
	// its own job id) with the var inherited in its own process env
	shutdownHub();
	initHubIdentity("run-b2b", "cellA.1");
	const second = makeDispatcher(root, cat);
	await second.dispatch({ seat: "agent-s", input: "grandchild task" });
	expect(second.spawns[0].env.COUNCIL_EVAL_MODEL).toBe("openrouter/env/model");
	const ms = readManifests(root, "run-b2b");
	expect(ms.find((m) => m.id === "cellA.1")!.model).toBe("openrouter/env/model");
	expect(ms.find((m) => m.id === "cellA.1.1")!.model).toBe("openrouter/env/model");
	delete process.env.COUNCIL_EVAL_MODEL;
	expect(process.env.COUNCIL_EVAL_MODEL).toBeUndefined();
});

test("card acceptance: a procedure-driving dispatch carries the override in its argv", async () => {
	const root = tmpRepo();
	writeRepoSeat(root, "driver", "openrouter/driver/default");
	initHubIdentity("run-proc", "cellP");
	const { dispatch, spawns } = makeDispatcher(root, ["openrouter/driver/default", "openrouter/proc/model"]);
	process.env.COUNCIL_EVAL_MODEL = "openrouter/proc/model";
	const input = fs.readFileSync(path.join(PKG_ROOT, "council", "procedures", "features-deliver.md"), "utf-8");
	const res = await dispatch({ seat: "driver", input });
	expect(res.isError).toBeFalsy();
	expect(spawns[0].args[spawns[0].args.indexOf("--model") + 1]).toBe("openrouter/proc/model");
	delete process.env.COUNCIL_EVAL_MODEL;
});

test("card acceptance: an omitted override falls back to the seat's resolved model unchanged — and no eval env carrier is injected", async () => {
	const root = tmpRepo();
	writeRepoSeat(root, "agent-s", "openrouter/frontmatter/model");
	fs.writeFileSync(
		path.join(root, COUNCIL_CONFIG_FILE),
		JSON.stringify({ council: { "agent-s": { model: "openrouter/config/model" } } }),
	);
	initHubIdentity("run-fb", "cellA");
	const { dispatch, spawns } = makeDispatcher(root, ["openrouter/frontmatter/model", "openrouter/config/model"]);
	const res = await dispatch({ seat: "agent-s", input: "task" });
	expect(res.isError).toBeFalsy();
	expect(loadSeat(root, "agent-s").model).toBe("openrouter/config/model");
	expect(spawns[0].args[spawns[0].args.indexOf("--model") + 1]).toBe("openrouter/config/model");
	expect(spawns[0].model).toBe("openrouter/config/model");
	// a non-eval dispatch is invisible to the carrier — nothing injected into the subtree
	expect(spawns[0].env.COUNCIL_EVAL_MODEL).toBeUndefined();
});

// ================= B3 — catalogue check against the effective model (spec §10 B3) =================

test("B3: catalogue check validates the effective model — unknown env override refuses loudly, naming the override", async () => {
	const root = tmpRepo();
	writeRepoSeat(root, "agent-s", "openrouter/known/model");
	initHubIdentity("run-b3", "cellA");
	const { dispatch, spawns } = makeDispatcher(root, ["openrouter/known/model"]); // override NOT in catalogue
	process.env.COUNCIL_EVAL_MODEL = "openrouter/unknown/model9";
	const res = await dispatch({ seat: "agent-s", input: "task" });
	expect(res.isError).toBe(true);
	expect(res.content[0].text).toContain("openrouter/unknown/model9");
	expect(res.content[0].text).not.toContain("openrouter/known/model");
	expect(spawns).toHaveLength(0); // refused before any spawn
	expect(readManifests(root, "run-b3")).toHaveLength(0);
	delete process.env.COUNCIL_EVAL_MODEL;
});

// ================= B4 — subtree scope, no residue (spec §10 B4) =================

test("B4: subtree scope — each cell's manifests carry its own model; parent env carries no residue", async () => {
	const root = tmpRepo();
	writeRepoSeat(root, "cell-a", "openrouter/a/frontmatter");
	writeRepoSeat(root, "cell-b", "openrouter/b/frontmatter");
	initHubIdentity("run-b4", "cellA");
	const cat = [
		"openrouter/a/frontmatter",
		"openrouter/b/frontmatter",
		"openrouter/x/model",
		"openrouter/y/model",
		"openrouter/grader/p",
	];

	// cell A under X, plus A's descendant re-entering with the inherited env
	process.env.COUNCIL_EVAL_MODEL = "openrouter/x/model";
	let d = makeDispatcher(root, cat);
	await d.dispatch({ seat: "cell-a", input: "a" });
	expect(d.spawns[0].model).toBe("openrouter/x/model");
	shutdownHub();
	initHubIdentity("run-b4", "cellA.1");
	d = makeDispatcher(root, cat);
	await d.dispatch({ seat: "cell-a", input: "a.1" });
	expect(d.spawns[0].model).toBe("openrouter/x/model");

	// cell B under Y
	shutdownHub();
	initHubIdentity("run-b4", "cellB");
	process.env.COUNCIL_EVAL_MODEL = "openrouter/y/model";
	d = makeDispatcher(root, cat);
	await d.dispatch({ seat: "cell-b", input: "b" });
	expect(d.spawns[0].model).toBe("openrouter/y/model");

	// grader G pinned P via the explicit model param (no env involved)
	shutdownHub();
	initHubIdentity("run-b4", "cellG");
	delete process.env.COUNCIL_EVAL_MODEL;
	d = makeDispatcher(root, cat);
	const gRes = await d.dispatch({ seat: "judge", input: "grade", model: "openrouter/grader/p" });
	expect(gRes.isError).toBeFalsy();
	expect(d.spawns[0].model).toBe("openrouter/grader/p");

	// every descendant manifest in each subtree carries its own model
	const ms = readManifests(root, "run-b4");
	const modelOf = (id: string): string => {
		const m = ms.find((x) => x.id === id);
		expect(m, `manifest ${id} present`).toBeDefined();
		return m!.model;
	};
	expect(modelOf("cellA.1")).toBe("openrouter/x/model");
	expect(modelOf("cellA.1.1")).toBe("openrouter/x/model");
	expect(modelOf("cellB.1")).toBe("openrouter/y/model");
	expect(modelOf("cellG.1")).toBe("openrouter/grader/p");
	// no residue: the dispatch path never wrote to the parent's process.env
	expect(process.env.COUNCIL_EVAL_MODEL).toBeUndefined();
});

// ================= D2/D3 — grader topology (spec §10 D2, D3) =================

test("D2: grader dispatch — the explicit model param beats the .council.json pin; argv carries the fixture model", async () => {
	const root = tmpRepo();
	fs.writeFileSync(
		path.join(root, COUNCIL_CONFIG_FILE),
		JSON.stringify({ council: { judge: { model: "openrouter/judge-pin/m2" } } }),
	);
	initHubIdentity("run-d2", "grading");
	const { dispatch, spawns } = makeDispatcher(root, ["openrouter/grader/m1"]);
	const res = await dispatch({ seat: "judge", input: "grade the cell", model: "openrouter/grader/m1" });
	expect(res.isError).toBeFalsy();
	// the .council.json pin still applies to a normal (non-param) judge dispatch
	expect(loadSeat(root, "judge").model).toBe("openrouter/judge-pin/m2");
	const s = spawns[0];
	expect(s.args[s.args.indexOf("--model") + 1]).toBe("openrouter/grader/m1");
	expect(s.model).toBe("openrouter/grader/m1");
	expect(readManifests(root, "run-d2")[0].model).toBe("openrouter/grader/m1");
	expect(s.env.COUNCIL_EVAL_MODEL).toBe("openrouter/grader/m1");
	// judge frontmatter untouched
	expect(fs.readFileSync(path.join(PKG_ROOT, "council", "agents", "judge.md"), "utf-8")).toContain("openrouter/qwen/qwen3.6-35b-a3b:medium");
});

test("cellId param is accepted on council_dispatch — the harness's grader-linkage slot", async () => {
	const root = tmpRepo();
	fs.writeFileSync(
		path.join(root, COUNCIL_CONFIG_FILE),
		JSON.stringify({ council: { judge: { model: "openrouter/judge-pin/m2" } } }),
	);
	initHubIdentity("run-cellid", "grading");
	const { dispatch, spawns } = makeDispatcher(root, ["openrouter/grader/m1"]);
	const res = await dispatch({ seat: "judge", input: "grade", model: "openrouter/grader/m1", cellId: "cellA.1" });
	expect(res.isError).toBeFalsy();
	expect(res.details.jobId).toBe("grading.1");
	expect(spawns).toHaveLength(1);
	expect(spawns[0].model).toBe("openrouter/grader/m1");
});

test("council_dispatch schema declares optional model / thinking / cellId (source probe)", () => {
	const src = fs.readFileSync(path.join(import.meta.dir, "..", "extensions", "hub-tools.ts"), "utf-8");
	const blockStart = src.indexOf("parameters: Type.Object");
	expect(blockStart).not.toBe(-1);
	const block = src.slice(blockStart, src.indexOf("async execute", blockStart));
	expect(block).toContain("model: Type.Optional(Type.String(");
	expect(block).toContain("thinking: Type.Optional(Type.String(");
	expect(block).toContain("cellId: Type.Optional(Type.String(");
});

test("D3: judge seat spawns: [] — cell drivers have no authority to dispatch graders", () => {
	expect(loadSeat(tmpRepo(), "judge").spawns).toEqual([]);
});