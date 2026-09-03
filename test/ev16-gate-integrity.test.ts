/**
 * Gate integrity: inject defects and confirm each gate CAN fail.
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
function tmpRepo(): string { return fs.mkdtempSync(path.join(os.tmpdir(), "ev16-gate-")); }

test("GATE-1: buildChildArgv with injected model shows injected model", () => {
	const seat = loadSeat(REPO_ROOT, "judge");
	const hackedSeat = { ...seat, model: "openrouter/evil/not-the-judge-model" };
	const argv = buildChildArgv(hackedSeat, "test", "/tmp/p.md", [],
		{ sessionDir: "/tmp/s", sessionId: "j1" });
	const modelIdx = argv.indexOf("--model");
	expect(argv[modelIdx + 1]).toBe("openrouter/evil/not-the-judge-model");
	expect(argv[modelIdx + 1]).not.toBe("openrouter/qwen/qwen3.6-35b-a3b");
});

test("GATE-2: childEnv forces COUNCIL_RUN_ID/COUNCIL_JOB_ID", () => {
	const env = childEnv({}, "test-run", "test-job");
	expect(env.COUNCIL_RUN_ID).toBe("test-run");
	expect(env.COUNCIL_JOB_ID).toBe("test-job");
});

test("GATE-3: readManifests skips corrupt json, does not crash", () => {
	const root = tmpRepo();
	const runId = mintRunId();
	const dir = ensureRunDir(root, runId);
	fs.writeFileSync(path.join(dir, "corrupt.json"), "not json");
	const manifests = readManifests(root, runId);
	expect(manifests).toEqual([]);
	fs.rmSync(path.join(root, CONFIG_DIR_NAME), { recursive: true, force: true });
});

test("GATE-4: pruneRuns empty dir returns 0", () => {
	const root = tmpRepo();
	fs.mkdirSync(path.join(root, CONFIG_DIR_NAME, "council", "runs"), { recursive: true });
	expect(pruneRuns(root)).toBe(0);
	fs.rmSync(path.join(root, CONFIG_DIR_NAME), { recursive: true, force: true });
});

test("GATE-5: unqualified model override fails loadSeat", () => {
	const root = tmpRepo();
	const configDir = path.join(root, CONFIG_DIR_NAME, "agents");
	fs.mkdirSync(configDir, { recursive: true });
	fs.writeFileSync(path.join(configDir, "test.md"),
		"---\nname: test\ndescription: test\nmodel: openrouter/default/model\ntools: Read\n---\nbody");
	fs.writeFileSync(path.join(root, COUNCIL_CONFIG_FILE), JSON.stringify({ council: { test: "no-slash" } }));
	expect(() => loadSeat(root, "test")).toThrow();
	fs.rmSync(path.join(root, CONFIG_DIR_NAME), { recursive: true, force: true });
	fs.rmSync(path.join(root, COUNCIL_CONFIG_FILE));
});

test("GATE-6: judge model is the shipped default (would fail if changed)", () => {
	const judge = loadSeat(REPO_ROOT, "judge");
	expect(judge.model).toBe("openrouter/qwen/qwen3.6-35b-a3b");
	expect(judge.thinkingLevel).toBe("medium");
});

test("GATE-7: model-floors has known entries", () => {
	const floors = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, "council", "model-floors.json"), "utf-8"));
	expect(floors["deepseek/deepseek-v4-pro-0813"]).toBe(131072);
});

test("GATE-8: scaffold has board.md and cards/", () => {
	const s = path.join(PKG_ROOT, "council", "scaffold", "council");
	const files = fs.readdirSync(s);
	expect(files.includes("board.md")).toBe(true);
});

test("GATE-9: judge (no hub) argv has no dispatch tools", () => {
	const judge = loadSeat(REPO_ROOT, "judge");
	const argv = buildChildArgv(judge, "test", "/tmp/p.md", [],
		{ sessionDir: "/tmp/s", sessionId: "j1" });
	expect(argv.join(",")).not.toContain("council_dispatch");
});
