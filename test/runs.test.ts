import { test, expect } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { CONFIG_DIR_NAME } from "@earendil-works/pi-coding-agent";
import {
	ensureRunDir,
	mintRunId,
	readManifests,
	writeManifest,
	childEnv,
	findSessionFile,
	type RunManifest,
} from "../extensions/runs.ts";

function tmpRepo(): string {
	return fs.mkdtempSync(path.join(os.tmpdir(), "council-runs-"));
}

function manifest(id: string, over: Partial<RunManifest> = {}): RunManifest {
	return {
		id,
		seat: "owner",
		model: "m/x",
		parentJobId: null,
		pid: null,
		sessionId: id,
		state: "running",
		startedAt: Date.now(),
		settledAt: null,
		exitCode: null,
		...over,
	};
}

test("ensureRunDir creates self-ignoring .gitignore and run.json", () => {
	const root = tmpRepo();
	const dir = ensureRunDir(root, "runA");
	expect(dir).toBe(path.join(root, CONFIG_DIR_NAME, "council", "runs", "runA"));
	expect(fs.readFileSync(path.join(root, CONFIG_DIR_NAME, "council", "runs", ".gitignore"), "utf-8")).toBe("*\n");
	const info = JSON.parse(fs.readFileSync(path.join(dir, "run.json"), "utf-8"));
	expect(info.runId).toBe("runA");
	expect(info.repoRoot).toBe(root);
	expect(typeof info.startedAt).toBe("number");
	expect(info.hostPid).toBe(process.pid);
});

test("ensureRunDir never clobbers an existing run.json", () => {
	const root = tmpRepo();
	const dir = ensureRunDir(root, "runB");
	fs.writeFileSync(path.join(dir, "run.json"), JSON.stringify({ runId: "runB", startedAt: 1, repoRoot: root, hostPid: 1 }));
	ensureRunDir(root, "runB");
	expect(JSON.parse(fs.readFileSync(path.join(dir, "run.json"), "utf-8")).startedAt).toBe(1);
});

test("mintRunId is unique-ish and filename-safe", () => {
	const a = mintRunId();
	const b = mintRunId();
	expect(a).not.toBe(b);
	expect(a).toMatch(/^[A-Za-z0-9-]+$/);
});

test("manifest round-trip; readManifests skips run.json and corrupt files", () => {
	const root = tmpRepo();
	ensureRunDir(root, "runC");
	writeManifest(root, "runC", manifest("job-1"));
	writeManifest(root, "runC", manifest("job-1.2", { parentJobId: "job-1", seat: "skeptic" }));
	fs.writeFileSync(path.join(root, CONFIG_DIR_NAME, "council", "runs", "runC", "broken.json"), "{ not json");
	const ms = readManifests(root, "runC");
	expect(ms.map((m) => m.id)).toEqual(["job-1", "job-1.2"]);
	expect(ms[1].seat).toBe("skeptic");
});

test("readManifests on missing run dir is empty", () => {
	expect(readManifests(tmpRepo(), "nope")).toEqual([]);
});

test("childEnv adds run identity vars", () => {
	const env = childEnv({ COUNCIL_SEAT: "owner", HOME: "/h" }, "runX", "job-2");
	expect(env.COUNCIL_RUN_ID).toBe("runX");
	expect(env.COUNCIL_JOB_ID).toBe("job-2");
	expect(env.COUNCIL_SEAT).toBe("owner");
});

test("findSessionFile matches by header id, not filename", () => {
	const root = tmpRepo();
	const dir = ensureRunDir(root, "runD");
	fs.writeFileSync(
		path.join(dir, "2026-01-01T00-00-00Z_job-1.jsonl"),
		`{"type":"session","version":3,"id":"job-1","timestamp":"x","cwd":"/x"}\n`,
	);
	fs.writeFileSync(
		path.join(dir, "2026-01-01T00-00-01Z_job-2.jsonl"),
		`{"type":"session","version":3,"id":"job-2","timestamp":"x","cwd":"/x"}\n`,
	);
	expect(findSessionFile(root, "runD", "job-2")).toBe(path.join(dir, "2026-01-01T00-00-01Z_job-2.jsonl"));
	expect(findSessionFile(root, "runD", "job-9")).toBeUndefined();
});