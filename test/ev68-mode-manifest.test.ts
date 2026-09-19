// EV-68 — card execution mode recorded on the run manifest.
//
// Spec: docs/superpowers/specs/2026-09-19-EV-68-design.md (settled 2026-09-19).
//
// RED-BASE RECORD (seven fields per vault/wiki/red-base-evidence.md):
// 1. Base identity — c9aaab908168957416a2fb229ccead9224fa72fb ("EV-68 In
//    Progress" card-state commit; the commit immediately preceding EV-68's
//    first mechanism merge — no `mode` write path exists at this sha).
//    Base role: required.
// 2. Transplant identity — this file (test/ev68-mode-manifest.test.ts),
//    materialized into the base worktree; copied from head sha
//    (see git log for the head half's exact sha). Nothing else was added.
// 3. Exact command — `bun test test/ev68-mode-manifest.test.ts`
//    (identical on both halves of the pair).
// 4. Raw red output — verbatim from the base run:
//    bun test v1.4.2 (744846f84)
//    test/ev68-mode-manifest.test.ts:
//    (fail) EV-68: the three modes are distinguishable from manifests alone;
//      children and legacy roots carry none [1.01ms]
//      error: expect(received).toEqual(expected)
//      ["Deliberate","Verify","Direct"] expected; received [undefined,undefined,undefined]
//      at test/ev68-mode-manifest.test.ts:166:15
//    (fail) EV-68: dispatching with mode=Verify writes mode last on the
//      manifest [201.63ms]
//      error: expect(received).toBe(expected) — Expected: "Verify", Received: undefined
//      at test/ev68-mode-manifest.test.ts:257:22
//    (fail) EV-68: retry respawn keeps the dispatch's mode on the single
//      manifest [402.91ms]
//      error: expect(received).toBe(expected) — Expected: "Deliberate", Received: undefined
//      at test/ev68-mode-manifest.test.ts:332:22
//    5 pass / 3 fail / 22 expect() calls — Ran 8 tests across 1 file. [2.38s]
//    (full raw transcript retained in the PR body's red-base summary.)
// 5. Worktree provenance — detached checkout of the base sha in a separate
//    worktree (git worktree add --detach); the feat/ev-68-manifest-mode
//    checkout was never switched; the base worktree was removed after the run.
// 6. Copy set — bare copy of the transplant plus a node_modules symlink to the
//    implementation worktree's node_modules (dependency resolution only).
// 7. Head half — the PR head sha (recorded on the PR), same exact command,
//    0 fail.
//
// Mechanism-absent boundary (derived from the raw per-failure lines): the reds
// at base are exactly the tests whose failure text names the `mode` artifact of
// the mechanism under test (distinguishability via the dispatch path, the
// mode-bearing write, and retry stability). Tests exercising only pre-existing
// reader behavior (absence shape, sum identity, inertness) and the no-mode
// write path are green at base — they guard the backward-compatibility
// contract, not the mechanism.
import { test, expect, beforeAll, afterAll, afterEach } from "bun:test";
import * as os from "node:os";
import * as fs from "node:fs";
import * as path from "node:path";
import { CONFIG_DIR_NAME } from "@earendil-works/pi-coding-agent";
import { Hub } from "../extensions/hub.ts";
import {
	ensureRunDir,
	readManifests,
	writeManifest,
	sumSubtree,
	type DispatchMode,
	type RunManifest,
	type Usage,
} from "../extensions/runs.ts";
import { buildTree, flattenTree, textTree } from "../extensions/tree.ts";
import { createRetrySupervisor } from "../extensions/job-retry.ts";

const STUB = path.join(import.meta.dir, "stub-child.ts");
const MODES: DispatchMode[] = ["Deliberate", "Verify", "Direct"];

function tmpRepo(prefix: string): string {
	return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function fullUsage(over: Partial<Usage> = {}): Usage {
	return {
		input: 0, output: 0, cacheRead: 0, cacheWrite: 0, reasoning: 0, totalTokens: 0,
		cost: 0, costInput: 0, costOutput: 0, costCacheRead: 0, costCacheWrite: 0,
		turns: 0, costBasis: "catalogue-estimate", usageSource: "stream-assistant",
		...over,
	};
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
		usage: fullUsage(),
		...over,
	};
}

/** EV-68 spread-gate control: absence is key-absence, never null. */
function stripMode(m: RunManifest): RunManifest {
	const c = { ...m };
	delete c.mode;
	return c;
}

function manifestFile(repoRoot: string, runId: string, jobId: string): string {
	return path.join(repoRoot, CONFIG_DIR_NAME, "council", "runs", runId, `${jobId}.json`);
}

function emitEnv(): Record<string, string> {
	return { ...process.env, STUB_MODE: "emit" } as Record<string, string>;
}

// ---- Reader half (tests 1–4): shared forest tagged through the real dispatch path ----

const RUN = "runE68";
let root = "";
let rootIds: Partial<Record<DispatchMode, string>> = {};
let childIds: string[] = [];
const LEGACY_ROOT = "job-legacy";

beforeAll(async () => {
	root = tmpRepo("ev68-reader-");
	ensureRunDir(root, RUN);
	// The three tagged roots are tagged through the mechanism itself (spawnJob
	// opts with `mode`) — the manifests on disk carry `mode` only if the
	// dispatch→Job→manifest flow works. This is the red-base falsifier.
	const forestHub = new Hub({ monitorIntervalMs: 50, run: { repoRoot: root, runId: RUN } });
	try {
		for (const mode of MODES) {
			const id = forestHub.allocateId();
			forestHub.spawnJob({
				id, seat: "stub", command: "bun", args: [STUB], cwd: import.meta.dir,
				env: emitEnv(), timeoutMs: 60_000, stallMs: 60_000,
				mode,
			});
			const [r] = await forestHub.wait([id], 10_000);
			if (r.state !== "done") throw new Error(`stub root ${id} did not settle done: ${r.state}`);
			rootIds[mode] = id;
		}
	} finally {
		forestHub.shutdown();
	}
	// Mode-less children with usage under each tagged root (written directly —
	// readers are the subject here, not the child dispatch path).
	childIds = [];
	for (const mode of MODES) {
		for (const n of [1, 2]) {
			const cid = `${rootIds[mode]}.${n}`;
			writeManifest(root, RUN, manifest(cid, {
				parentJobId: rootIds[mode],
				seat: "skeptic",
				usage: fullUsage({ cost: n === 1 ? 0.25 : 0.125, turns: n }),
			}));
			childIds.push(cid);
		}
	}
	// One legacy root (pre-EV-68 shape: no `mode` key) + two children.
	writeManifest(root, RUN, manifest(LEGACY_ROOT, { usage: fullUsage({ cost: 0.5, turns: 3 }) }));
	for (const n of [1, 2]) {
		writeManifest(root, RUN, manifest(`${LEGACY_ROOT}.${n}`, {
			parentJobId: LEGACY_ROOT,
			seat: "owner",
			usage: fullUsage({ cost: 0.25, turns: n }),
		}));
	}
}, 30_000);

afterAll(() => {
	try {
		fs.rmSync(root, { recursive: true, force: true });
	} catch {
		/* best effort */
	}
});

// Test 1 — distinguishability from manifests alone: the three tagged roots
// yield exactly the three distinct literals; every child and the legacy root
// yield undefined.
test("EV-68: the three modes are distinguishable from manifests alone; children and legacy roots carry none", () => {
	const ms = readManifests(root, RUN);
	const byId = new Map(ms.map((m) => [m.id, m]));
	const seen = MODES.map((mode) => byId.get(rootIds[mode]!)?.mode);
	expect(seen).toEqual(MODES);
	// no double-tagging: exactly three manifests carry a mode, the tagged roots
	expect(ms.filter((m) => m.mode !== undefined).map((m) => m.id).sort())
		.toEqual(Object.values(rootIds).sort());
	// every child and the legacy root are mode-less — absence, not null
	for (const cid of childIds) expect(byId.get(cid)!.mode).toBeUndefined();
	expect(byId.get(LEGACY_ROOT)!.mode).toBeUndefined();
});

// Test 2 — absence shape: the legacy manifest's raw bytes contain no "mode"
// key; readManifests yields undefined, never null.
test("EV-68: a manifest with no mode key reads as undefined — absence is key-absence", () => {
	const r2 = tmpRepo("ev68-absence-");
	ensureRunDir(r2, "runA");
	writeManifest(r2, "runA", manifest("job-1")); // no mode anywhere
	const bytes = fs.readFileSync(manifestFile(r2, "runA", "job-1"), "utf-8");
	expect(!("mode" in JSON.parse(bytes))).toBe(true);
	const m = readManifests(r2, "runA")[0]!;
	expect(m.mode).toBeUndefined();
	fs.rmSync(r2, { recursive: true, force: true });
});

// Test 3 — sum identity: sumSubtree over the legacy root and an
// identically-shaped tagged root return the same number; each equals the
// hand-computed fixture sum; a manifest with no usage still sums as 0.
test("EV-68: sumSubtree is unchanged by mode — legacy and tagged roots sum identically; no-usage sums 0", () => {
	const r3 = tmpRepo("ev68-sum-");
	ensureRunDir(r3, "runS");
	// identical shapes: root 0.5 + children 0.25 + 0.125 = 0.875
	writeManifest(r3, "runS", manifest("job-legacy", { usage: fullUsage({ cost: 0.5 }) }));
	writeManifest(r3, "runS", manifest("job-legacy.1", { parentJobId: "job-legacy", usage: fullUsage({ cost: 0.25 }) }));
	writeManifest(r3, "runS", manifest("job-legacy.2", { parentJobId: "job-legacy", usage: fullUsage({ cost: 0.125 }) }));
	writeManifest(r3, "runS", { ...manifest("job-tagged", { usage: fullUsage({ cost: 0.5 }) }), mode: "Direct" });
	writeManifest(r3, "runS", manifest("job-tagged.1", { parentJobId: "job-tagged", usage: fullUsage({ cost: 0.25 }) }));
	writeManifest(r3, "runS", manifest("job-tagged.2", { parentJobId: "job-tagged", usage: fullUsage({ cost: 0.125 }) }));
	// no-usage manifest (the §7-era legacy shape) still sums as 0
	const bare: RunManifest = { ...manifest("job-nousage") };
	delete bare.usage;
	writeManifest(r3, "runS", bare);
	const ms = readManifests(r3, "runS");
	expect(sumSubtree(ms, "job-legacy")).toBe(0.875);
	expect(sumSubtree(ms, "job-tagged")).toBe(0.875);
	expect(sumSubtree(ms, "job-nousage")).toBe(0);
	fs.rmSync(r3, { recursive: true, force: true });
});

// Test 4 — same-function-both-sides inertness: readManifests, sumSubtree, and
// buildTree→flattenTree→textTree over the mode-bearing forest vs a
// byte-equivalent mode-stripped control are byte-equal.
test("EV-68: readers are inert to mode — same-function-both-sides byte-equal against a mode-stripped control", () => {
	const ms = readManifests(root, RUN);
	const stripped = ms.map(stripMode);
	// sumSubtree: every root id, mode-bearing vs stripped
	for (const id of [...Object.values(rootIds), LEGACY_ROOT]) {
		expect(sumSubtree(ms, id!)).toBe(sumSubtree(stripped, id!));
	}
	// buildTree→flattenTree: structure byte-equal once the key under test is
	// normalized away on BOTH sides (equal iff structure + all other fields
	// are byte-identical)
	const snap = (ts: ReturnType<typeof buildTree>) =>
		JSON.stringify(flattenTree(ts).map((n) => stripMode(n.manifest)));
	expect(snap(buildTree(stripped))).toBe(snap(buildTree(ms)));
	// textTree: disk byte-equivalent control (same bytes, mode key stripped)
	const RUN2 = "runE68-strip";
	ensureRunDir(root, RUN2);
	for (const m of ms) writeManifest(root, RUN2, stripMode(m));
	const linesMode = textTree(root, [RUN]);
	const linesStrip = textTree(root, [RUN2]);
	// drop the per-runId header line — the two runs differ only by runId
	expect(linesStrip.slice(1)).toEqual(linesMode.slice(1));
});

// ---- Write-path half (tests 5–8): Hub + STUB child, the test/hub.test.ts pattern ----

let hub: Hub | undefined;
afterEach(() => hub?.shutdown());

// Test 5 — mode writes: a dispatch with mode records it on the manifest;
// "mode" is the last key.
test("EV-68: dispatching with mode=Verify writes mode last on the manifest", async () => {
	const r5 = tmpRepo("ev68-write-");
	ensureRunDir(r5, "runW");
	hub = new Hub({ monitorIntervalMs: 50, run: { repoRoot: r5, runId: "runW" } });
	const id = hub.allocateId();
	hub.spawnJob({
		id, seat: "stub", command: "bun", args: [STUB], cwd: import.meta.dir,
		env: emitEnv(), timeoutMs: 60_000, stallMs: 60_000,
		mode: "Verify",
	});
	await hub.wait([id], 10_000);
	const parsed = JSON.parse(fs.readFileSync(manifestFile(r5, "runW", id), "utf-8"));
	expect(parsed.mode).toBe("Verify");
	expect(Object.keys(parsed).at(-1)).toBe("mode");
	fs.rmSync(r5, { recursive: true, force: true });
}, 15_000);

// Test 6 — no-mode write is byte-identical to pre-EV-68 output, pinned WITHIN
// THE SAME STATE CLASS (O-4 hazard: settled and running writes differ in the
// state-gated stopReason/settledAt keys even today — a settled no-mode
// treatment is compared against a settled mode-bearing control with the mode
// key stripped, plus the exact pre-EV-68 settled key list).
test("EV-68: a no-mode settled write carries exactly the pre-EV-68 key set (same-state-class comparison)", async () => {
	const r6 = tmpRepo("ev68-bytes-");
	ensureRunDir(r6, "runB");
	hub = new Hub({ monitorIntervalMs: 50, run: { repoRoot: r6, runId: "runB" } });
	const idA = hub.allocateId();
	hub.spawnJob({
		id: idA, seat: "stub", command: "bun", args: [STUB], cwd: import.meta.dir,
		env: emitEnv(), timeoutMs: 60_000, stallMs: 60_000, // no mode
	});
	await hub.wait([idA], 10_000);
	const idB = hub.allocateId();
	hub.spawnJob({
		id: idB, seat: "stub", command: "bun", args: [STUB], cwd: import.meta.dir,
		env: emitEnv(), timeoutMs: 60_000, stallMs: 60_000,
		mode: "Direct",
	});
	await hub.wait([idB], 10_000);
	const noMode = JSON.parse(fs.readFileSync(manifestFile(r6, "runB", idA), "utf-8"));
	const withMode = JSON.parse(fs.readFileSync(manifestFile(r6, "runB", idB), "utf-8"));
	expect(noMode.mode).toBeUndefined();
	// same state class (both settled done): key sets equal modulo `mode`
	expect(Object.keys(noMode).sort())
		.toEqual(Object.keys(withMode).filter((k) => k !== "mode").sort());
	// and the settled no-mode key set is exactly the pre-EV-68 key set
	expect(Object.keys(noMode).sort()).toEqual([
		"exitCode", "id", "model", "parentJobId", "pid", "seat", "sessionId",
		"settledAt", "startedAt", "state", "stopReason", "usage",
	]);
	fs.rmSync(r6, { recursive: true, force: true });
}, 20_000);

// Test 7 — retry stability: a retried mode-bearing job keeps its mode on the
// single per-job manifest (cardinality A).
test("EV-68: retry respawn keeps the dispatch's mode on the single manifest", async () => {
	const r7 = tmpRepo("ev68-retry-");
	ensureRunDir(r7, "runR");
	hub = new Hub({ monitorIntervalMs: 50, run: { repoRoot: r7, runId: "runR" } });
	const state = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "ev68-flaky-")), "state.json");
	const id = hub.allocateId();
	const flakyEnv = () =>
		({ ...process.env, STUB_MODE: "flaky", STUB_STATE: state, STUB_FAIL_TIMES: "1" }) as Record<string, string>;
	hub.spawnJob({
		id, seat: "stub", command: "bun", args: [STUB], cwd: import.meta.dir,
		env: flakyEnv(), timeoutMs: 60_000, stallMs: 60_000, sessionId: id,
		mode: "Deliberate",
		cleanup: () => {},
		retry: createRetrySupervisor({
			hub, jobId: id,
			policy: { enabled: true, maxAttempts: 3, baseDelayMs: 50, maxDelayMs: 50, jitter: false },
			cleanup: () => {},
			attemptSpec: (n) => ({
				args: [STUB], cwd: import.meta.dir, env: flakyEnv(),
				sessionId: `${id}-attempt${n}`, timeoutMs: 60_000, stallMs: 60_000,
			}),
		}),
	});
	const [r] = await hub.wait([id], 15_000);
	expect(r.state).toBe("done"); // attempt 1 fails retryably, attempt 2 succeeds
	const parsed = JSON.parse(fs.readFileSync(manifestFile(r7, "runR", id), "utf-8"));
	expect(parsed.attempt).toBe(2); // the retry actually happened
	// the settled list is complete and ordered 1..N (EV-42)
	expect(parsed.attempts).toEqual([
		{ attempt: 1, sessionId: id },
		{ attempt: 2, sessionId: `${id}-attempt2` },
	]);
	expect(parsed.mode).toBe("Deliberate"); // unchanged across attempts
	expect(Object.keys(parsed).at(-1)).toBe("mode");
	fs.rmSync(r7, { recursive: true, force: true });
}, 20_000);

// Test 8 — non-inheritance: a child-hub dispatch without the param writes no
// mode key. Mode never rides childEnv or descendant spawns.
test("EV-68: a child-hub dispatch without the param writes no mode key", async () => {
	const r8 = tmpRepo("ev68-nest-");
	ensureRunDir(r8, "runN");
	hub = new Hub({ monitorIntervalMs: 50, run: { repoRoot: r8, runId: "runN", parentJobPath: "job-2" } });
	const id = hub.allocateId();
	hub.spawnJob({
		id, seat: "stub", command: "bun", args: [STUB], cwd: import.meta.dir,
		env: emitEnv(), timeoutMs: 60_000, stallMs: 60_000, // no mode
	});
	await hub.wait([id], 10_000);
	const parsed = JSON.parse(fs.readFileSync(manifestFile(r8, "runN", id), "utf-8"));
	expect(parsed.parentJobId).toBe("job-2");
	expect(!("mode" in parsed)).toBe(true);
	fs.rmSync(r8, { recursive: true, force: true });
}, 15_000);
