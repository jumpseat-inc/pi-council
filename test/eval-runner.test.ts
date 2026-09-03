import { test, expect } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { CONFIG_DIR_NAME } from "@earendil-works/pi-coding-agent";
import type { CellScope, StoredResultRecord } from "../extensions/eval-rubric.ts";
import { aggregateCell, compareCellTriage } from "../extensions/eval-stats.ts";

// ---- helpers ----

const REPO = "sha256:" + "a".repeat(64);

function scope(over: Partial<CellScope> = {}): CellScope {
	return {
		state: "done",
		usage: { input: 0, output: 0, cost: 0, turns: 0 },
		elapsedMs: 1,
		repoState: REPO,
		...over,
	};
}

function stubResult(over: Partial<StoredResultRecord> = {}): StoredResultRecord {
	return {
		cellId: "taskA|m/x",
		taskId: "taskA",
		model: "m/x",
		repeat: 1,
		fixtureVersion: "1.0.0",
		rubricVersion: "1.0.0",
		scoredUnder: "m/x",
		perCriterion: [],
		score: 1.0,
		gradedAt: 1,
		cellScope: scope(),
		...over,
	};
}

test("E2: length is flagged, never scored 0 — mean over graded repeats only", () => {
	const records = [
		stubResult({ repeat: 1, score: 1.0 }),
		stubResult({ repeat: 2, score: 1.0, cellScope: scope({ stopReason: "length" }) }),
		stubResult({ repeat: 3, score: 0, cellScope: scope({ state: "timeout", stopReason: "timeout" }) }),
	];
	const s = aggregateCell(records);
	expect(s.n_attempted).toBe(3);
	expect(s.n_graded).toBe(1);
	expect(s.lengthFlagged).toBe(1);
	expect(s.mean).toBe(1.0); // never 0.33
	expect(s.histogram.done).toBe(2);
	expect(s.histogram.timeout).toBe(1);
});

test("E3: terminal-state histogram + indeterminate on length majority, never a bare mean", () => {
	const records = [
		stubResult({ repeat: 1, score: 1.0 }),
		stubResult({ repeat: 2, score: 1.0, cellScope: scope({ stopReason: "length" }) }),
		stubResult({ repeat: 3, score: 1.0, cellScope: scope({ stopReason: "length" }) }),
	];
	const s = aggregateCell(records);
	expect(s.histogram).toEqual({ done: 3, stalled: 0, timeout: 0, failed: 0 });
	expect(s.lengthFlagged).toBe(2);
	expect(s.n_graded).toBe(1);
	expect(s.lengthMajority).toBe(true);
	expect(s.indeterminate).toBe(true);
});

test("sample sigma is Bessel-corrected (n-1)", () => {
	const records = [
		stubResult({ repeat: 1, score: 1.0 }),
		stubResult({ repeat: 2, score: 1.0 }),
		stubResult({ repeat: 3, score: 0.0 }),
	];
	const s = aggregateCell(records);
	expect(s.n_graded).toBe(3);
	expect(s.mean).toBeCloseTo(2 / 3, 10);
	// sample variance of [1,1,0]: mean 2/3 -> (1/9 + 1/9 + 4/9)/2 = (6/9)/2 = 1/3
	expect(s.sigma).toBeCloseTo(Math.sqrt(1 / 3), 10);
});

test("n_graded < 2 -> sigma null; n_graded === 0 -> mean null and indeterminate", () => {
	expect(aggregateCell([stubResult({ repeat: 1, score: 0.5 })]).sigma).toBeNull();
	const empty = aggregateCell([
		stubResult({ repeat: 1, score: 0, cellScope: scope({ state: "stalled", stopReason: "stalled" }) }),
	]);
	expect(empty.n_graded).toBe(0);
	expect(empty.mean).toBeNull();
	expect(empty.indeterminate).toBe(true);
});

test("E1: two n=3 cells with overlapping score CIs render as tied (CI on mean difference includes zero)", () => {
	const a = [1.0, 0.5, 0.9]; // mean 0.8, wide spread
	const b = [0.7, 0.8, 0.6]; // mean 0.7
	const t = compareCellTriage(a, b);
	expect(t.tied).toBe(true); // CI on mean-difference spans zero
	expect(t.ciLo <= 0 && t.ciHi >= 0).toBe(true);
	expect(t.meanDiff).toBeCloseTo(0.1, 10);
});

test("E1b: a strongly separated pair is NOT tied (CI on mean difference excludes zero)", () => {
	const t = compareCellTriage([1.0, 1.0, 1.0], [0.0, 0.0, 0.0]);
	expect(t.tied).toBe(false);
	expect(t.ciLo > 0 || t.ciHi < 0).toBe(true);
});

// ---- RunManifest extension (EV-16 §7) — failing test first (convention 7) ----

import { Hub } from "../extensions/hub.ts";
import { ensureRunDir, readManifests, sumSubtree, writeManifest, type RunManifest } from "../extensions/runs.ts";

const STUB = path.join(import.meta.dir, "stub-child.ts");

function manifest(id: string, over: Partial<RunManifest> = {}): RunManifest {
	return {
		id,
		seat: "owner",
		model: "m/x",
		parentJobId: null,
		pid: null,
		sessionId: id,
		state: "done",
		startedAt: 1,
		settledAt: 2,
		exitCode: 0,
		usage: { input: 10, output: 5, cost: 1.5, turns: 2 },
		...over,
	};
}

test("F1: sumSubtree over a 3-deep parentJobId chain equals the hand-computed cost", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "council-sub-"));
	ensureRunDir(root, "runS");
	writeManifest(root, "runS", manifest("job-1", { usage: { input: 10, output: 5, cost: 1.5, turns: 2 } }));
	writeManifest(root, "runS", manifest("job-1.1", { parentJobId: "job-1", usage: { input: 10, output: 5, cost: 2.0, turns: 1 } }));
	writeManifest(root, "runS", manifest("job-1.1.1", { parentJobId: "job-1.1", usage: { input: 10, output: 5, cost: 0.5, turns: 3 } }));
	writeManifest(root, "runS", manifest("job-2", { usage: { input: 10, output: 5, cost: 9.0, turns: 9 } }));
	const ms = readManifests(root, "runS");
	expect(sumSubtree(ms, "job-1")).toBeCloseTo(1.5 + 2.0 + 0.5, 10);
	expect(sumSubtree(ms, "job-1", "turns")).toBe(2 + 1 + 3);
});

test("F1b: a settled hub job persists usage and stopReason to the manifest", async () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "council-manu-"));
	ensureRunDir(root, "runMU");
	const pidFile = path.join(os.tmpdir(), `council-eval-hub-${process.pid}.json`);
	const hub = new Hub({ monitorIntervalMs: 50, pidFile, run: { repoRoot: root, runId: "runMU" } });
	const job = hub.spawnJob({
		id: hub.allocateId(),
		seat: "stub",
		command: "bun",
		args: [STUB],
		cwd: import.meta.dir,
		env: { ...process.env, STUB_MODE: "emit" } as Record<string, string>,
		timeoutMs: 30_000,
		stallMs: 30_000,
	});
	await hub.wait([job.id], 10_000);
	hub.shutdown();
	const m = JSON.parse(
		fs.readFileSync(path.join(root, CONFIG_DIR_NAME, "council", "runs", "runMU", `${job.id}.json`), "utf-8"),
	) as { usage?: { turns: number; cost: number }; stopReason?: string };
	expect(m.usage).toBeDefined();
	expect(m.usage!.turns).toBe(1);
	expect(m.usage!.cost).toBeCloseTo(0.001, 10);
	expect(m.stopReason).toBe("stop");
});

// ---- dispatch primitive (EV-20 §4) — parameterized by cwd, one override path ----

import { getHub, initHubIdentity, shutdownHub } from "../extensions/hub-tools.ts";
import { loadSeat } from "../extensions/seats.ts";
import { spawnSeatJob } from "../extensions/dispatch.ts";

test("dispatch primitive: cell spawned with cwd=scratch carries the override (B2/B4/D2 mirror)", async () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "council-disp-"));
	const dir = path.join(root, CONFIG_DIR_NAME, "agents");
	fs.mkdirSync(dir, { recursive: true });
	fs.writeFileSync(path.join(dir, "agent-s.md"), `---\nname: agent-s\ndescription: d\nmodel: openrouter/frontmatter/model\ntools: Read\n---\nbody`);
	const scratch = path.join(root, "scratch");
	fs.mkdirSync(scratch, { recursive: true });
	initHubIdentity("run-disp", "cellA");
	const hub = getHub(root);
	const captures: any[] = [];
	const real = hub.spawnJob.bind(hub);
	(hub as unknown as { spawnJob: (o: Record<string, unknown>) => unknown }).spawnJob = (o: Record<string, unknown>) => {
		captures.push(o);
		return real({ ...o, command: "bun", args: [STUB] } as Parameters<typeof real>[0]);
	};
	const seat = loadSeat(root, "agent-s");
	const res = spawnSeatJob({
		repoRoot: root, hub, seat, input: "task", cwd: scratch,
		timeoutMs: 60_000, stallMs: 60_000,
		model: "openrouter/ovr/model", isModelAvailable: (m) => m === "openrouter/ovr/model",
	});
	expect(res.jobId).toBe("cellA.1");
	expect(captures).toHaveLength(1);
	expect(captures[0].cwd).toBe(scratch);
	expect(captures[0].args as string[]).toContain("--model");
	expect((captures[0].args as string[])[(captures[0].args as string[]).indexOf("--model") + 1]).toBe("openrouter/ovr/model");
	expect(captures[0].env.COUNCIL_EVAL_MODEL).toBe("openrouter/ovr/model");
	const ms = readManifests(root, "run-disp");
	expect(ms.find((m) => m.id === "cellA.1")!.model).toBe("openrouter/ovr/model");
	expect(process.env.COUNCIL_EVAL_MODEL).toBeUndefined();
	shutdownHub();
});

test("dispatch primitive: unknown effective model refuses loudly, naming it (B3)", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "council-dispb-"));
	const dir = path.join(root, CONFIG_DIR_NAME, "agents");
	fs.mkdirSync(dir, { recursive: true });
	fs.writeFileSync(path.join(dir, "agent-s.md"), `---\nname: agent-s\ndescription: d\nmodel: openrouter/frontmatter/model\ntools: Read\n---\nbody`);
	initHubIdentity("run-dispb", "cellA");
	const hub = getHub(root);
	const seat = loadSeat(root, "agent-s");
	expect(() =>
		spawnSeatJob({
			repoRoot: root, hub, seat, input: "task", cwd: root,
			timeoutMs: 60_000, stallMs: 60_000,
			model: "openrouter/unknown/model9", isModelAvailable: () => false,
		}),
	).toThrow(/openrouter\/unknown\/model9/);
	shutdownHub();
});

// ---- parseEvalArgs grammar (spec §2 / §10.10) ----

import {
	REPEAT_CAP,
	REPEAT_DEFAULT,
	SCORED_UNDER_SELF,
	ensureEvalDir,
	evalResultsDir,
	isGateOnlyFixture,
	parseEvalArgs,
	persistCellSnapshot,
	readAllResults,
	writeResultRecord,
	writeVerdictRecord,
} from "../extensions/eval-runner.ts";
import type { ResultRecord, VerdictRecord } from "../extensions/eval-rubric.ts";

test("grammar: no args -> no task, default repeat, snapshot on", () => {
	const a = parseEvalArgs([]);
	expect(a.task).toBeUndefined();
	expect(a.models).toEqual([]);
	expect(a.repeat).toBe(REPEAT_DEFAULT);
	expect(a.persistSnapshot).toBe(true);
});

test("grammar: --repeat N and --repeat=N; multiple models; task first", () => {
	expect(parseEvalArgs(["council", "m/x", "--repeat", "5"])).toEqual({
		task: "council", models: ["m/x"], repeat: 5, persistSnapshot: true,
	});
	expect(parseEvalArgs(["council", "m/x", "m/y", "--repeat=2"]).repeat).toBe(2);
	expect(parseEvalArgs(["council", "m/x", "m/y", "--repeat=2"]).models).toEqual(["m/x", "m/y"]);
});

test("grammar: --no-persist-snapshot turns the snapshot flag off", () => {
	expect(parseEvalArgs(["council", "m/x", "--no-persist-snapshot"]).persistSnapshot).toBe(false);
	expect(parseEvalArgs(["council", "m/x", "--persist-snapshot"]).persistSnapshot).toBe(true);
});

test("grammar: repeat above the hard cap rejects loudly", () => {
	expect(() => parseEvalArgs(["council", "m/x", "--repeat", String(REPEAT_CAP + 1)])).toThrow(/20/);
});

test("grammar: non-integer or zero repeat rejects", () => {
	expect(() => parseEvalArgs(["council", "m/x", "--repeat", "abc"])).toThrow();
	expect(() => parseEvalArgs(["council", "m/x", "--repeat", "0"])).toThrow();
});

// ---- store: verdict repeat round-trip (spec §10.2) ----

function vrec(over: Partial<VerdictRecord> = {}): VerdictRecord {
	return {
		cellId: "taskA|m/x",
		repeat: 1,
		gradedBy: "g",
		fixtureVersion: "1.0.0",
		rubricVersion: "1.0.0",
		perCriterion: [],
		gradedAt: 1,
		gradingUsage: { input: 0, output: 0, cost: 0, elapsedMs: 0 },
		...over,
	};
}

test("verdict repeat round-trip: repeats 1..3 produce three distinct keyed files", () => {
	const store = ensureEvalDir(fs.mkdtempSync(path.join(os.tmpdir(), "council-ver-")));
	writeVerdictRecord(store, vrec({ repeat: 1 }));
	writeVerdictRecord(store, vrec({ repeat: 2 }));
	writeVerdictRecord(store, vrec({ repeat: 3 }));
	const files = fs.readdirSync(store).filter((f) => f.endsWith(".json"));
	expect(files).toHaveLength(3);
	expect(new Set(files)).toHaveLength(3); // keys differ by repeat (only the r<N> segment varies)
	for (const n of [1, 2, 3]) expect(files.some((f) => f.includes(`__r${n}__`))).toBe(true);
});

test("verdict first-write-wins: same tuple same payload is a no-op, divergent throws, new key is a new file", () => {
	const store = ensureEvalDir(fs.mkdtempSync(path.join(os.tmpdir(), "council-ver2-")));
	writeVerdictRecord(store, vrec({ repeat: 1 }));
	writeVerdictRecord(store, vrec({ repeat: 1 })); // identical -> no-op
	expect(fs.readdirSync(store).filter((f) => f.endsWith(".json"))).toHaveLength(1);
	// a different gradedBy is a NEW key tuple -> a second file, not a conflict
	writeVerdictRecord(store, vrec({ repeat: 1, gradedBy: "g2" }));
	expect(fs.readdirSync(store).filter((f) => f.endsWith(".json"))).toHaveLength(2);
	// divergent payload for the SAME key tuple -> throw (defect)
	expect(() => writeVerdictRecord(store, vrec({ repeat: 1, perCriterion: [{ criterionId: "c", verdict: "pass", evidence: "e" }] }))).toThrow();
});

test("result store key (spec §10.3): two graders under the same version pair both survive; fixture bump = new version-keyed set", () => {
	const store = ensureEvalDir(fs.mkdtempSync(path.join(os.tmpdir(), "council-res-")));
	const base: ResultRecord = {
		cellId: "taskA|m/x", taskId: "taskA", model: "m/x", repeat: 1,
		fixtureVersion: "1.0.0", rubricVersion: "1.0.0",
		perCriterion: [], score: 0.5, gradedAt: 1, scoredUnder: "g1",
	};
	const scope = { state: "done" as const, usage: { input: 0, output: 0, cost: 0, turns: 0 }, elapsedMs: 1, repoState: "sha256:" + "b".repeat(64) };
	writeResultRecord(store, { ...base, scoredUnder: "g1" }, scope);
	writeResultRecord(store, { ...base, scoredUnder: "g2" }, scope);
	// fixture bump -> new version-keyed set (same cellId/repeat/graders, new fixtureVersion)
	writeResultRecord(store, { ...base, fixtureVersion: "2.0.0", scoredUnder: "g1" }, scope);
	const all = readAllResults(store);
	expect(all).toHaveLength(3);
	expect(all.filter((r) => r.fixtureVersion === "1.0.0")).toHaveLength(2);
	expect(all.filter((r) => r.fixtureVersion === "2.0.0")).toHaveLength(1);
});

test("result store: divergent same-tuple throws; identical no-op", () => {
	const store = ensureEvalDir(fs.mkdtempSync(path.join(os.tmpdir(), "council-res2-")));
	const base: ResultRecord = { cellId: "c", taskId: "t", model: "m", repeat: 1, fixtureVersion: "1.0.0", rubricVersion: "1.0.0", perCriterion: [], score: 0.5, gradedAt: 1, scoredUnder: "g" };
	const scope = { state: "done" as const, usage: { input: 0, output: 0, cost: 0, turns: 0 }, elapsedMs: 1, repoState: "sha256:" + "b".repeat(64) };
	writeResultRecord(store, base, scope);
	writeResultRecord(store, base, scope); // identical -> no-op
	expect(fs.readdirSync(store).filter((f) => f.endsWith(".json"))).toHaveLength(1);
	expect(() => writeResultRecord(store, { ...base, score: 0.6 }, scope)).toThrow();
});

test("result record carries the repoState cellScope (Q2)", () => {
	const store = ensureEvalDir(fs.mkdtempSync(path.join(os.tmpdir(), "council-res3-")));
	const base: ResultRecord = { cellId: "c", taskId: "t", model: "m", repeat: 1, fixtureVersion: "1.0.0", rubricVersion: "1.0.0", perCriterion: [], score: 0.5, gradedAt: 1, scoredUnder: SCORED_UNDER_SELF };
	const scope = { state: "done" as const, usage: { input: 1, output: 2, cost: 3, turns: 4 }, elapsedMs: 9, repoState: "sha256:" + "c".repeat(64) };
	writeResultRecord(store, base, scope);
	const [r] = readAllResults(store);
	expect(r.cellScope.repoState).toBe("sha256:" + "c".repeat(64));
	expect(r.cellScope.elapsedMs).toBe(9);
});

// ---- gate-only sentinel (spec §10.4 / Q1-D2) ----

import { validateRubric } from "../extensions/eval-fixtures.ts";

test("gate-only sentinel: a rubric with only gate criteria is gate-only (scoredUnder self); judge renders it not", () => {
	const gateOnly = validateRubric(
		{ schemaVersion: 1, rubricVersion: "1.0.0", criteria: [{ id: "c1", type: "gate", check: { kind: "artifact-present", path: "out.txt" } }] },
		"f",
	);
	expect(isGateOnlyFixture(gateOnly)).toBe(true);
	const judge = validateRubric(
		{ schemaVersion: 1, rubricVersion: "1.0.0", criteria: [{ id: "j1", type: "judge", prompt: "p" }] },
		"f",
	);
	expect(isGateOnlyFixture(judge)).toBe(false);
	expect(SCORED_UNDER_SELF).toBe("self");
});

// ---- snapshot persistence (spec §10.5 / Q2) ----

import { sha256Tree } from "../extensions/eval-fixtures.ts";

test("snapshot: persist copies the scratch tree; --no-persist-snapshot skips the copy", () => {
	const store = ensureEvalDir(fs.mkdtempSync(path.join(os.tmpdir(), "council-snap-")));
	const scratch = fs.mkdtempSync(path.join(os.tmpdir(), "council-scratch-"));
	fs.writeFileSync(path.join(scratch, "out.txt"), "artifact");
	fs.mkdirSync(path.join(scratch, "sub"));
	fs.writeFileSync(path.join(scratch, "sub", "nested.md"), "hi");
	persistCellSnapshot(store, "taskA|m/x", 1, scratch, true);
	const snapDir = path.join(store, "taskA_m_x", "r1", "snapshot");
	expect(fs.existsSync(snapDir)).toBe(true);
	expect(sha256Tree(snapDir)).toBe(sha256Tree(scratch));
	persistCellSnapshot(store, "taskA|m/x", 2, scratch, false);
	expect(fs.existsSync(path.join(store, "taskA_m_x", "r2", "snapshot"))).toBe(false);
});
