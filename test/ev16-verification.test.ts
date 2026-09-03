/**
 * EV-16 Verification: Skeptic attack on each claim.
 */
import { test, expect } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { CONFIG_DIR_NAME } from "@earendil-works/pi-coding-agent";

import {
	buildChildArgv,
	loadSeat,
	COUNCIL_CONFIG_FILE,
	PKG_ROOT,
} from "../extensions/seats.ts";
import {
	writeManifest,
	readManifests,
	pruneRuns,
	childEnv,
	runsDir,
	ensureRunDir,
	mintRunId,
	type RunManifest,
	type RunInfo,
} from "../extensions/runs.ts";
import { buildTree } from "../extensions/tree.ts";

const REPO_ROOT = fs.realpathSync(".");

function tmpRepo(): string {
	return fs.mkdtempSync(path.join(os.tmpdir(), "ev16-verify-"));
}

// ========== CLAIM 1: buildChildArgv emits --model/--thinking at depth 1 only ==========
test("C1a: buildChildArgv emits --model and --thinking from resolved seat", () => {
	const seat = loadSeat(REPO_ROOT, "owner");
	const argv = buildChildArgv(seat, "test input", "/tmp/prompt.md", [],
		{ sessionDir: "/tmp/session", sessionId: "job-1" });
	const modelIdx = argv.indexOf("--model");
	expect(modelIdx).not.toBe(-1);
	expect(argv[modelIdx + 1]).toBe(seat.model);
	if (seat.thinkingLevel) {
		const thinkIdx = argv.indexOf("--thinking");
		expect(thinkIdx).not.toBe(-1);
		expect(argv[thinkIdx + 1]).toBe(seat.thinkingLevel);
	}
});

test("C1b: argv carries exactly one --model (depth 1 only)", () => {
	const seat = loadSeat(REPO_ROOT, "council-runner");
	const argv = buildChildArgv(seat, "run card", "/tmp/p.md", [],
		{ sessionDir: "/tmp/s", sessionId: "root-job" });
	expect(argv.filter(a => a === "--model").length).toBe(1);
	expect(argv.join(",")).toContain("council_dispatch");
});

// ========== CLAIM 2: childEnv and tree.ts parentJobId ==========
test("C2a: childEnv copies base + injects COUNCIL_RUN_ID/COUNCIL_JOB_ID", () => {
	const env = childEnv({ PATH: "/usr/bin" }, "run-abc", "job-42");
	expect(env.COUNCIL_RUN_ID).toBe("run-abc");
	expect(env.COUNCIL_JOB_ID).toBe("job-42");
	expect(env.PATH).toBe("/usr/bin");
});

test("C2b: tree.ts builds parent-child from parentJobId", () => {
	const manifests: RunManifest[] = [
		{ id: "job-1", seat: "runner", model: "m1", parentJobId: null, pid: 1, sessionId: "s1", state: "done", startedAt: 100, settledAt: 200, exitCode: 0 },
		{ id: "job-1.1", seat: "owner", model: "m2", parentJobId: "job-1", pid: 2, sessionId: "s1", state: "done", startedAt: 110, settledAt: 190, exitCode: 0 },
	];
	const tree = buildTree(manifests);
	expect(tree[0].children[0].manifest.parentJobId).toBe("job-1");
});

// ========== CLAIM 3: writeJobManifest persists limited fields ==========
test("C3a: writeManifest persists id/seat/model/parentJobId/pid/state/startedAt/settledAt/exitCode only", () => {
	const root = tmpRepo();
	const runId = mintRunId();
	ensureRunDir(root, runId);
	writeManifest(root, runId, {
		id: "job-test", seat: "owner", model: "test/model", parentJobId: null,
		pid: 12345, sessionId: "session-1", state: "done",
		startedAt: Date.now(), settledAt: Date.now(), exitCode: 0,
	});
	const loaded = readManifests(root, runId);
	expect(loaded[0].pid).toBe(12345);
	const m = loaded[0] as unknown as Record<string, unknown>;
	expect(m.usage).toBeUndefined();
	expect(m.stopReason).toBeUndefined();
	expect(m.elapsedMs).toBeUndefined();
	fs.rmSync(path.join(root, CONFIG_DIR_NAME), { recursive: true, force: true });
});

test("C3b: readManifests returns [] on missing dir", () => {
	const root = tmpRepo();
	expect(readManifests(root, "nonexistent")).toEqual([]);
});

// ========== CLAIM 4: pruneRuns ==========
test("C4a: pruneRuns keeps last 15 runs, prunes 5 of 20", () => {
	const root = tmpRepo();
	const base = runsDir(root);
	fs.mkdirSync(base, { recursive: true });
	for (let i = 0; i < 20; i++) {
		const runId = `run-${String(i).padStart(3, "0")}`;
		const dir = path.join(base, runId);
		fs.mkdirSync(dir);
		fs.writeFileSync(path.join(dir, "run.json"),
			JSON.stringify({ runId, startedAt: 1000 + i * 100, repoRoot: root, hostPid: process.pid }));
	}
	expect(pruneRuns(root, 15)).toBe(5);
	expect(fs.readdirSync(base).filter(d => fs.statSync(path.join(base, d)).isDirectory()).length).toBe(15);
	fs.rmSync(base, { recursive: true, force: true });
});

test("C4b: pruneRuns with no runs dir returns 0", () => {
	const root = tmpRepo();
	expect(pruneRuns(root)).toBe(0);
});

// ========== CLAIM 5: catalogue check validates effective model ==========
test("C5a: loadSeat applies .council.json override — model changes", () => {
	const root = tmpRepo();
	const configDir = path.join(root, CONFIG_DIR_NAME, "agents");
	fs.mkdirSync(configDir, { recursive: true });
	fs.writeFileSync(path.join(configDir, "owner.md"),
		"---\nname: owner\ndescription: test\nmodel: openrouter/default/model\ntools: Read\n---\nbody");
	fs.writeFileSync(path.join(root, COUNCIL_CONFIG_FILE), JSON.stringify({
		council: { owner: { model: "openrouter/override/model" } },
	}));
	expect(loadSeat(root, "owner").model).toBe("openrouter/override/model");
	fs.rmSync(path.join(root, CONFIG_DIR_NAME), { recursive: true, force: true });
	fs.rmSync(path.join(root, COUNCIL_CONFIG_FILE));
});

test("C5b: unqualified override model throws qualifiedOrThrow", () => {
	const root = tmpRepo();
	const configDir = path.join(root, CONFIG_DIR_NAME, "agents");
	fs.mkdirSync(configDir, { recursive: true });
	fs.writeFileSync(path.join(configDir, "test.md"),
		"---\nname: test\ndescription: test\nmodel: openrouter/default/model\ntools: Read\n---\nbody");
	fs.writeFileSync(path.join(root, COUNCIL_CONFIG_FILE), JSON.stringify({
		council: { test: "unqualified-model" },
	}));
	expect(() => loadSeat(root, "test")).toThrow(/must be qualified/);
	fs.rmSync(path.join(root, CONFIG_DIR_NAME), { recursive: true, force: true });
	fs.rmSync(path.join(root, COUNCIL_CONFIG_FILE));
});

// ========== CLAIM 6: judge.md ==========
test("C6a: judge model is openrouter/qwen/qwen3.6-35b-a3b:medium", () => {
	const judge = loadSeat(REPO_ROOT, "judge");
	expect(judge.model).toBe("openrouter/qwen/qwen3.6-35b-a3b");
	expect(judge.thinkingLevel).toBe("medium");
});

test("C6b: judge tools = [Read, Bash], no hub spawns", () => {
	const judge = loadSeat(REPO_ROOT, "judge");
	expect(judge.tools).toEqual(["Read", "Bash"]);
	expect(judge.spawns).toEqual([]);
});

test("C6c: .council.json re-models judge silently", () => {
	const root = tmpRepo();
	fs.writeFileSync(path.join(root, COUNCIL_CONFIG_FILE), JSON.stringify({
		council: { judge: { model: "openrouter/evil/harmful-model", thinking: "off" } },
	}));
	const judge = loadSeat(root, "judge");
	expect(judge.model).toBe("openrouter/evil/harmful-model");
	expect(judge.thinkingLevel).toBe("off");
	fs.rmSync(path.join(root, COUNCIL_CONFIG_FILE));
});

// ========== CLAIM 7: model-floors exists, spawnJob accepts env ==========
test("C7a: model-floors.json exists with entry deepseek/deepseek-v4-pro-0813 = 131072", () => {
	const floors = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, "council", "model-floors.json"), "utf-8"));
	expect(floors["deepseek/deepseek-v4-pro-0813"]).toBe(131072);
});

// ========== CLAIM 8: scaffold structure ==========
test("C8a: scaffold council/ has board.md, cards/, preflight.sh, validate.py", () => {
	const s = path.join(PKG_ROOT, "council", "scaffold", "council");
	expect(fs.existsSync(path.join(s, "board.md"))).toBe(true);
	expect(fs.statSync(path.join(s, "cards")).isDirectory()).toBe(true);
	expect(fs.existsSync(path.join(s, "preflight.sh"))).toBe(true);
	expect(fs.existsSync(path.join(s, "validate.py"))).toBe(true);
});

test("C8b: repo-root council/ dir (which IS PKG_ROOT/council/ for this package) has board.md consumer data", () => {
	// For this package (pi-council itself), the PKG_ROOT/council/ IS the
	// repo-root council/ dir. It contains consumer data files that match
	// what the scaffold produces, because the package consumes its own council.
	const rootCouncilFiles = fs.readdirSync(path.join(PKG_ROOT, "council"))
		.filter(f => !f.startsWith(".") && f !== "agents" && f !== "procedures" && f !== "scaffold" && f !== "cards");
	// board.md, preflight.sh, validate.py are consumer data at the repo root
	expect(rootCouncilFiles).toContain("board.md");
	expect(rootCouncilFiles).toContain("preflight.sh");
	expect(rootCouncilFiles).toContain("validate.py");
	// model-floors.json is engine data, not consumer scaffold
	expect(rootCouncilFiles).toContain("model-floors.json");
});

// ========== CLAIM 9: council_dispatch schema ==========
test("C9a: council_dispatch schema includes optional model/thinking/cellId (EV-17 override glance)", () => {
	// hub-tools.ts: parameters: Type.Object({ seat, input, timeout_minutes?, stall_minutes?, model?, thinking?, cellId? })
	const src = fs.readFileSync(path.join(REPO_ROOT, "extensions", "hub-tools.ts"), "utf-8");
	const blockStart = src.indexOf("parameters: Type.Object");
	const block = src.slice(blockStart, src.indexOf("async execute", blockStart));
	for (const key of ["seat", "input", "timeout_minutes", "stall_minutes", "model", "thinking", "cellId"]) {
		expect(block, `council_dispatch schema declares ${key}`).toContain(`${key}:`);
	}
});

test("C9b: buildChildArgv signature unchanged — the EV-17 override flows through the seat, not a new param", () => {
	// The effective (model, thinking) is written back onto the seat before
	// buildChildArgv runs; the argv builder keeps its 5-arg signature.
	const src = fs.readFileSync(path.join(REPO_ROOT, "extensions", "seats.ts"), "utf-8");
	const sig = src.match(/export function buildChildArgv\([^)]*\)/)?.[0] ?? "";
	const argCount = sig.slice(0, sig.lastIndexOf(")")).split(",").filter((s) => s.trim().length > 0).length;
	expect(argCount).toBe(5);
});
