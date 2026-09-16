import { test, expect, afterEach } from "bun:test";
import * as os from "node:os";
import * as fs from "node:fs";
import * as path from "node:path";
import { CONFIG_DIR_NAME } from "@earendil-works/pi-coding-agent";
import { Hub, type Job } from "../extensions/hub.ts";
import { ensureRunDir, readManifests, type Usage } from "../extensions/runs.ts";

const STUB = path.join(import.meta.dir, "stub-child.ts");
const pidFile = path.join(os.tmpdir(), `council-hub-test-${process.pid}.json`);
let hub: Hub;
afterEach(() => hub?.shutdown());

function spawnStub(h: Hub, mode: string, over: Partial<{ timeoutMs: number; stallMs: number }> = {}) {
	return h.spawnJob({
		id: h.allocateId(),
		seat: "stub",
		command: "bun",
		args: [STUB],
		cwd: import.meta.dir,
		env: { ...process.env, STUB_MODE: mode } as Record<string, string>,
		timeoutMs: over.timeoutMs ?? 60_000,
		stallMs: over.stallMs ?? 60_000,
	});
}

test("top-level hub ids are job-N", () => {
	hub = new Hub({ monitorIntervalMs: 50, pidFile });
	expect(hub.allocateId()).toBe("job-1");
	expect(hub.allocateId()).toBe("job-2");
});

test("nested hub path-encodes ids from parentJobPath", () => {
	hub = new Hub({
		monitorIntervalMs: 50,
		pidFile,
		run: { repoRoot: fs.mkdtempSync(path.join(os.tmpdir(), "council-nest-")), runId: "runN", parentJobPath: "job-1" },
	});
	expect(hub.allocateId()).toBe("job-1.1");
	expect(hub.allocateId()).toBe("job-1.2");
});

test("done: captures output and usage", async () => {
	hub = new Hub({ monitorIntervalMs: 50, pidFile });
	const job = spawnStub(hub, "emit");
	expect(job.state).toBe("running"); // fire-and-forget
	const [r] = await hub.wait([job.id], 10_000);
	expect(r.state).toBe("done");
	expect(r.output).toBe("stub result");
	expect(r.stopReason).toBe("stop");
	expect(r.usage.turns).toBe(1);
});

test("provider-error run: errorMessage surfaced in report", async () => {
	hub = new Hub({ monitorIntervalMs: 50, pidFile });
	const job = spawnStub(hub, "error");
	const [r] = await hub.wait([job.id], 10_000);
	expect(r.stopReason).toBe("error");
	expect(r.errorMessage).toBe("Provider returned 502: upstream unavailable");
});

test("length-truncated run: done but empty output with stopReason surfaced", async () => {
	hub = new Hub({ monitorIntervalMs: 50, pidFile });
	const job = spawnStub(hub, "length");
	const [r] = await hub.wait([job.id], 10_000);
	expect(r.state).toBe("done");
	expect(r.output).toBe("");
	expect(r.stopReason).toBe("length");
});

test("failed: nonzero exit captures stderr tail", async () => {
	hub = new Hub({ monitorIntervalMs: 50, pidFile });
	const job = spawnStub(hub, "fail");
	const [r] = await hub.wait([job.id], 10_000);
	expect(r.state).toBe("failed");
	expect(r.stderrTail).toContain("stub exploded");
});

test("cancelled: cancel kills a running job", async () => {
	hub = new Hub({ monitorIntervalMs: 50, pidFile });
	const job = spawnStub(hub, "hang");
	await Bun.sleep(300);
	expect(hub.cancel(job.id)).toBe(true);
	const [r] = await hub.wait([job.id], 10_000);
	expect(r.state).toBe("cancelled");
});

test(
	"stalled: no activity past stallMs auto-terminates",
	async () => {
		hub = new Hub({ monitorIntervalMs: 50, pidFile });
		const job = spawnStub(hub, "hang", { stallMs: 400 });
		const [r] = await hub.wait([job.id], 10_000);
		expect(r.state).toBe("stalled");
	},
	15_000,
);

test(
	"timeout: marked but NOT killed; active job survives",
	async () => {
		hub = new Hub({ monitorIntervalMs: 50, pidFile });
		const job = spawnStub(hub, "slow", { timeoutMs: 500, stallMs: 60_000 });
		const [r] = await hub.wait([job.id], 5_000);
		expect(r.state).toBe("timeout");
		expect(hub.list().find((j) => j.id === job.id)!.exitCode).toBeNull(); // still running
		hub.cancel(job.id);
	},
	15_000,
);

test(
	"wait window elapses with job still running",
	async () => {
		hub = new Hub({ monitorIntervalMs: 50, pidFile });
		const job = spawnStub(hub, "slow");
		const [r] = await hub.wait([job.id], 500);
		expect(r.state).toBe("running"); // wait returned, job not settled
		hub.cancel(job.id);
	},
	15_000,
);

test("wait on multiple jobs returns all reports", async () => {
	hub = new Hub({ monitorIntervalMs: 50, pidFile });
	const a = spawnStub(hub, "emit");
	const b = spawnStub(hub, "emit");
	const rs = await hub.wait([a.id, b.id], 10_000);
	expect(rs.map((r) => r.state)).toEqual(["done", "done"]);
});

test("wait on unknown job id throws", async () => {
	hub = new Hub({ monitorIntervalMs: 50, pidFile });
	await expect(hub.wait(["job-999"], 1000)).rejects.toThrow(/job-999/);
});

test("run-aware hub writes manifests at spawn and settle", async () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "council-man-"));
	ensureRunDir(root, "runM");
	hub = new Hub({ monitorIntervalMs: 50, pidFile, run: { repoRoot: root, runId: "runM", parentJobPath: "job-2" } });
	const job = spawnStub(hub, "emit");
	expect(job.id).toBe("job-2.1");
	const mFile = path.join(root, CONFIG_DIR_NAME, "council", "runs", "runM", "job-2.1.json");
	const during = JSON.parse(fs.readFileSync(mFile, "utf-8"));
	expect(during.state).toBe("running");
	expect(during.parentJobId).toBe("job-2");
	expect(during.sessionId).toBe("job-2.1");
	const [r] = await hub.wait([job.id], 10_000);
	expect(r.state).toBe("done");
	const after = JSON.parse(fs.readFileSync(mFile, "utf-8"));
	expect(after.state).toBe("done");
	expect(after.exitCode).toBe(0);
	expect(typeof after.settledAt).toBe("number");
});

test("cancel is reflected in the manifest", async () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "council-manc-"));
	ensureRunDir(root, "runC");
	hub = new Hub({ monitorIntervalMs: 50, pidFile, run: { repoRoot: root, runId: "runC" } });
	const job = spawnStub(hub, "hang");
	await Bun.sleep(300);
	hub.cancel(job.id);
	await hub.wait([job.id], 10_000);
	const m = JSON.parse(fs.readFileSync(path.join(root, CONFIG_DIR_NAME, "council", "runs", "runC", `${job.id}.json`), "utf-8"));
	expect(m.state).toBe("cancelled");
});

test("shutdown kills running jobs", async () => {
	hub = new Hub({ monitorIntervalMs: 50, pidFile });
	const job = spawnStub(hub, "hang");
	await Bun.sleep(200);
	hub.shutdown();
	await Bun.sleep(200);
	expect(() => process.kill(job.pid!, 0)).toThrow(); // process gone
});

// ---- EV-28: full usage tuple ----

const ACC_FIXTURE = {
	type: "message_end",
	message: {
		role: "assistant",
		content: [{ type: "text", text: "out" }],
		stopReason: "stop",
		usage: {
			input: 100, output: 10, cacheRead: 900, cacheWrite: 0, reasoning: 7, totalTokens: 1010,
			cost: { input: 0.0003, output: 0.0001, cacheRead: 0.0009, cacheWrite: 0, total: 0.0013 },
		},
	},
};

function freshJob(): Job {
	return {
		id: "job-t", seat: "stub", pid: undefined, state: "running", startedAt: Date.now(), lastActivityAt: Date.now(),
		attemptStartedAt: Date.now(),
		timeoutMs: 60_000, stallMs: 60_000, events: [], output: "", stderrTail: "",
		usage: {
			input: 0, output: 0, cacheRead: 0, cacheWrite: 0, reasoning: 0, totalTokens: 0,
			cost: 0, costInput: 0, costOutput: 0, costCacheRead: 0, costCacheWrite: 0,
			turns: 0, costBasis: "catalogue-estimate", usageSource: "stream-assistant",
		},
		exitCode: null,
	};
}

function ingest(job: Job, event: unknown): void {
	(hub as unknown as { processLine: (j: Job, line: string) => void }).processLine(job, JSON.stringify(event));
}

// T1 — the card's core red today: cacheRead (and every other new field) is dropped.
test("T1: ingestion accumulates the full tuple, fields separately", () => {
	hub = new Hub({ monitorIntervalMs: 60_000 });
	const job = freshJob();
	ingest(job, ACC_FIXTURE);
	const u = job.usage;
	expect(u.input).toBe(100);
	expect(u.cacheRead).toBe(900); // the card's core red today
	expect(u.cacheWrite).toBe(0);
	expect(u.output).toBe(10);
	expect(u.reasoning).toBe(7);
	expect(u.totalTokens).toBe(1010); // never derived from the component sum
	expect(u.costInput).toBe(0.0003);
	expect(u.costOutput).toBe(0.0001);
	expect(u.costCacheRead).toBe(0.0009);
	expect(u.costCacheWrite).toBe(0);
	expect(u.cost).toBe(0.0013);
	expect(u.turns).toBe(1);
	// reasoning ⊆ output: never re-added into output
	expect(u.output).toBe(10);
	// two sequential message_ends accumulate
	ingest(job, ACC_FIXTURE);
	expect(u.input).toBe(200);
	expect(u.cacheRead).toBe(1800);
	expect(u.output).toBe(20);
	expect(u.reasoning).toBe(14);
	expect(u.totalTokens).toBe(2020);
	expect(u.cost).toBe(0.0026);
	expect(u.turns).toBe(2);
});

// T2 — cost post-condition (pi-ai invariant, accumulated form)
test("T2: accumulated cost equals the sum of the four accumulated components", () => {
	hub = new Hub({ monitorIntervalMs: 60_000 });
	const job = freshJob();
	ingest(job, ACC_FIXTURE);
	const u = job.usage;
	const componentSum = u.costInput + u.costOutput + u.costCacheRead + u.costCacheWrite;
	expect(Math.abs(u.cost - componentSum)).toBeLessThan(1e-12);
});

// T3 — partial cost object: components coerce to 0, never NaN
test("T3: partial wire cost object yields zero components, never NaN", () => {
	hub = new Hub({ monitorIntervalMs: 60_000 });
	const job = freshJob();
	ingest(job, {
		type: "message_end",
		message: { role: "assistant", content: [{ type: "text", text: "x" }], usage: { input: 10, output: 5, cost: { total: 0.001 }, totalTokens: 15 } },
	});
	const u = job.usage;
	expect(u.costInput).toBe(0);
	expect(u.costOutput).toBe(0);
	expect(u.costCacheRead).toBe(0);
	expect(u.costCacheWrite).toBe(0);
	expect(u.cost).toBe(0.001);
	expect(Number.isNaN(u.costInput)).toBe(false);
});

// T4 — manifest/report agreement by construction
test("T4: settled manifest usage deep-equals report usage with provenance stamps", async () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "council-ev28-"));
	ensureRunDir(root, "runE28");
	hub = new Hub({ monitorIntervalMs: 50, pidFile, run: { repoRoot: root, runId: "runE28" } });
	const job = spawnStub(hub, "emit");
	const [r] = await hub.wait([job.id], 10_000);
	const ms = readManifests(root, "runE28");
	const m = ms.find((x) => x.id === job.id)!;
	expect(m.usage).toEqual(r.usage);
	expect(m.usage!.costBasis).toBe("catalogue-estimate");
	expect(m.usage!.usageSource).toBe("stream-assistant");
});

// ---- EV-28: head line (T5/T6/T7) ----

import { formatReport, formatUsageSegment } from "../extensions/hub-tools.ts";

function usageOf(over: Partial<Usage> = {}): Usage {
	return {
		input: 0, output: 0, cacheRead: 0, cacheWrite: 0, reasoning: 0, totalTokens: 0,
		cost: 0, costInput: 0, costOutput: 0, costCacheRead: 0, costCacheWrite: 0,
		turns: 0, costBasis: "catalogue-estimate", usageSource: "stream-assistant",
		...over,
	};
}

// T5 — head-line bytes and the ≤160 threshold at both fixtures
test("T5: head line renders the token split with the basis, ≤160 cols at both fixtures", () => {
	const base = usageOf({ input: 100, output: 10, cacheRead: 900, cacheWrite: 0, reasoning: 7, totalTokens: 1010, cost: 0.0013, turns: 1 });
	const seg = formatUsageSegment(base);
	expect(seg).toBe("turns=1 tokens=in 100/out 10/cR 900/cW 0/reason 7/total 1010 cost≈$0.0013 (catalogue)");
	expect((seg.match(/≈/g) ?? [])[0]).toBe("\u2248");
	const line = `[job-1] seat=owner state=done stopReason=stop elapsed=2.3m ${seg}`;
	expect([...line].length).toBeLessThanOrEqual(160);
	const wide = formatUsageSegment(usageOf({ ...base, cacheRead: 9000 }));
	const wideLine = `[job-1] seat=owner state=done stopReason=stop elapsed=2.3m ${wide}`;
	expect([...wideLine].length).toBeLessThanOrEqual(160);
	const reported = formatUsageSegment(usageOf({ ...base, costBasis: "reported" }));
	expect(reported).toContain("cost=$0.0013 (reported)");
	expect(reported).not.toContain("≈");
	const rep = formatReport({ id: "job-1", seat: "owner", state: "done", output: "out", elapsedMs: 138_000, usage: base, stderrTail: "", stopReason: "stop" });
	expect(rep.split("\n")[0]).toBe(line);
});

// T6 — zero usage renders zeros, never suppressed
test("T6: zero usage with an emitted assistant message renders all-zero fields", () => {
	const seg = formatUsageSegment(usageOf({ turns: 1 }));
	expect(seg).toBe("turns=1 tokens=in 0/out 0/cR 0/cW 0/reason 0/total 0 cost≈$0.0000 (catalogue)");
});

// T7 — suppression: identity prefix survives, no usage segment, state-independent
test("T7: no assistant message suppresses only the usage segment, across states", () => {
	const zero = usageOf(); // turns 0
	for (const state of ["done", "failed", "stalled", "timeout", "cancelled"] as const) {
		const rep = formatReport({ id: "job-9", seat: "owner", state, output: "", elapsedMs: 5_000, usage: zero, stderrTail: "stub exploded", stopReason: state === "done" ? undefined : "stop" });
		expect(rep.startsWith("[job-9] seat=owner")).toBe(true);
		expect(rep).not.toMatch(/cost≈|cost=\$/);
		expect(rep).not.toContain("tokens=");
	}
});

// ---- EV-32: council_wait runner usage blocks (T10/T11) ----

import { formatWaitReport } from "../extensions/hub-tools.ts";
import type { RunManifest } from "../extensions/runs.ts";

function reportOf(over: Partial<Parameters<typeof formatReport>[0]>): Parameters<typeof formatReport>[0] {
	return {
		id: "job-1", seat: "council-runner", state: "done", output: "", elapsedMs: 60_000,
		usage: usageOf(), stderrTail: "", ...over,
	};
}

function waitManifest(id: string, over: Partial<RunManifest> = {}): RunManifest {
	return {
		id, seat: "council-runner", model: "m/x", parentJobId: null, pid: null, sessionId: id,
		state: "done", startedAt: 0, settledAt: null, exitCode: 0,
		usage: usageOf(), ...over,
	};
}

test("T10-wait: settled reports get the runner block (no ownSession, one subtree line, true job count); running/timeout get none", () => {
	const manifests = [
		waitManifest("job-w", { usage: usageOf({ input: 300, cost: 3, totalTokens: 600, turns: 1 }) }),
		waitManifest("job-w.1", { parentJobId: "job-w", usage: usageOf({ input: 200, cost: 2, totalTokens: 400, turns: 1 }) }),
		waitManifest("job-w2"), // running: no usage anyway
	];
	const reports = [
		reportOf({ id: "job-w", state: "done", output: "card done" }),
		reportOf({ id: "job-w2", state: "running" }),
		reportOf({ id: "job-w3", state: "timeout" }),
	];
	const text = formatWaitReport(reports, manifests);
	const wSection = text.split("====")[0]!;
	expect(wSection).toContain("usage  subtree     basis=stream-assistant  turns=2 tokens=in 500/out 0/cR 0/cW 0/reason 0/total 1000 cost≈$5.0000 (catalogue)");
	expect(wSection).toContain("usage  boundary=session=job-w entries=unresolved jobs=2");
	expect(wSection).not.toContain("ownSession");
	expect(wSection.split("\n").filter((l) => l.startsWith("usage  "))).toHaveLength(2);
	// running / timed-out jobs: no block, ever
	for (const section of text.split("====").slice(1)) {
		expect(section.includes("usage  boundary=")).toBe(false);
		expect(section.includes("basis=stream-assistant")).toBe(false);
	}
});

test("T11-wait: settled job with no manifest renders state 1 — never blank; failed/cancelled/stalled are settled too", () => {
	const text = formatWaitReport(
		[
			reportOf({ id: "job-x", state: "failed", stderrTail: "boom" }),
			reportOf({ id: "job-y", state: "cancelled" }),
			reportOf({ id: "job-z", state: "stalled" }),
		],
		[], // pre-EV-16: no manifests at all
	);
	const sections = text.split("====");
	expect(sections[0]!.includes("usage  no usage recorded")).toBe(true);
	expect(sections[1]!.includes("usage  no usage recorded")).toBe(true);
	expect(sections[2]!.includes("usage  no usage recorded")).toBe(true);
	for (const section of sections) {
		expect(section.includes("ownSession")).toBe(false);
	}
});

// ---- EV-39: retry state machine (spec §2.2; AGENTS.md §7 — each delta red first) ----
import { createRetrySupervisor } from "../extensions/job-retry.ts";
import type { RetryPolicy } from "../extensions/retry.ts";

const EV39_POLICY: RetryPolicy = { enabled: true, maxAttempts: 3, baseDelayMs: 50, maxDelayMs: 50, jitter: false };

function flakyState(): string {
	return path.join(fs.mkdtempSync(path.join(os.tmpdir(), "ev39-flaky-")), "state.json");
}

// D1/O-4/G1 core loop: fail once, then succeed — one id, one manifest, cumulative
// usage, stable startedAt, fresh session id on attempt 2, wait resolves once.
test("EV-39 D1/O-4: fail-once-then-succeed re-spawns under one id and settles done", async () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "ev39-chain-"));
	ensureRunDir(root, "run39");
	hub = new Hub({ monitorIntervalMs: 50, pidFile, run: { repoRoot: root, runId: "run39" } });
	const state = flakyState();
	const policy: RetryPolicy = { enabled: true, maxAttempts: 3, baseDelayMs: 50, maxDelayMs: 50, jitter: false };
	const id = hub.allocateId();
	const flakyEnv = () =>
		({ ...process.env, STUB_MODE: "flaky", STUB_STATE: state, STUB_FAIL_TIMES: "1" }) as Record<string, string>;
	const job = hub.spawnJob({
		id, seat: "stub", command: "bun", args: [STUB], cwd: import.meta.dir,
		env: flakyEnv(), timeoutMs: 60_000, stallMs: 60_000, sessionId: id,
		cleanup: () => {},
		retry: createRetrySupervisor({
			hub, jobId: id, policy, cleanup: () => {},
			attemptSpec: (n) => ({
				args: [STUB], cwd: import.meta.dir, env: flakyEnv(),
				sessionId: `${id}-attempt${n}`, timeoutMs: 60_000, stallMs: 60_000,
			}),
		}),
	});
	const t0 = Date.now();
	const [r] = await hub.wait([id], 10_000);
	expect(r.state).toBe("done");
	expect(r.output).toBe("stub result");
	// D1: the wall clock spans both attempts (backoff happened)
	expect(Date.now() - t0).toBeGreaterThanOrEqual(50);
	// cardinality A: one manifest, attempt=2, the FINAL attempt's session id,
	// startedAt stable across attempts (D1), no nextAttemptAt after final settle.
	const ms = readManifests(root, "run39").filter((x) => x.id === id);
	expect(ms).toHaveLength(1);
	const m = ms[0]!;
	expect(m.attempt).toBe(2);
	expect(m.sessionId).toBe(`${id}-attempt2`);
	expect(m.startedAt).toBe(job.startedAt); // D1 — never re-based
	expect(m.state).toBe("done");
	expect("nextAttemptAt" in m).toBe(false);
	// D1: cumulative usage — both attempts' assistant messages are in the tuple
	expect(r.usage.turns).toBe(2);
}, 15_000);

// G2: tick() must not stall/timeout/kill a retrying job (the retrying half of tick).
test("EV-39 G2: tick skips retrying jobs (no stalled kill, no timeout flip)", async () => {
	hub = new Hub({ monitorIntervalMs: 50, pidFile });
	const id = hub.allocateId();
	const job = hub.spawnJob({
		id, seat: "stub", command: "bun", args: [STUB], cwd: import.meta.dir,
		env: { ...process.env, STUB_MODE: "hang" } as Record<string, string>,
		timeoutMs: 500, stallMs: 500, sessionId: id, cleanup: () => {},
	});
	await Bun.sleep(300); // first output event re-bases lastActivityAt
	// flip into the retrying window exactly as the supervisor does on a settled
	// retryable report: exitCode null + pid undefined + state retrying.
	job.state = "retrying";
	job.exitCode = null;
	job.pid = undefined;
	await Bun.sleep(1_400); // > stallMs(500) and > timeoutMs(500) with monitor at 50ms
	expect(hub.report(job).state).toBe("retrying"); // no stalled, no timeout
	expect(hub.list().find((j) => j.id === id)!.pid).toBeUndefined();
	hub.cancel(id); // disarm + settle cancelled
}, 15_000);

// Q5 regression / G3: wait never resolves during the backoff window; cancel
// mid-backoff disarms the timer (spawn count stays 1) and settles cancelled.
test("EV-39 G3: wait blocks through backoff; cancel mid-backoff disarms the timer", async () => {
	hub = new Hub({ monitorIntervalMs: 50, pidFile });
	const id = hub.allocateId();
	const job = hub.spawnJob({
		id, seat: "stub", command: "bun", args: [STUB], cwd: import.meta.dir,
		env: { ...process.env, STUB_MODE: "emit" } as Record<string, string>,
		timeoutMs: 60_000, stallMs: 60_000, sessionId: id, cleanup: () => {},
	});
	await hub.wait([id], 10_000); // attempt 1 settles done
	let respawned = 0;
	const sup = createRetrySupervisor({
		hub, jobId: id, policy: EV39_POLICY, cleanup: () => {},
		attemptSpec: () => {
			respawned++;
			return { args: [STUB], cwd: import.meta.dir, env: { ...process.env } as Record<string, string>, sessionId: `${id}-attempt2`, timeoutMs: 60_000, stallMs: 60_000 };
		},
	});
	// arm the backoff with a synthetic RETRYABLE report (the shape attempt 1 of
	// a real chain carries — done + stopReason error + retryable message).
	const retryable = { ...hub.report(job), stopReason: "error" as const, errorMessage: "Provider returned 502: upstream unavailable" };
	expect(sup.onSettle(job, retryable)).toBe(true);
	expect(job.state).toBe("retrying");
	// wait must NOT resolve while the backoff timer is pending (delay 50ms, poll
	// 200ms — a naive settled-check would return immediately on exitCode!==null;
	// the retrying clause keeps it blocked until the timer's job moves on)
	const race = await Promise.race([
		hub.wait([id], 10_000).then((rs) => rs[0]!.state),
		Bun.sleep(20).then(() => "STILL-WAITING"),
	]);
	expect(race).toBe("STILL-WAITING");
	// cancel mid-backoff: true, timer disarmed (no respawn), synthetic settle
	expect(hub.cancel(id)).toBe(true);
	await Bun.sleep(150); // > baseDelay — a disarmed timer would have fired
	expect(respawned).toBe(0); // spawn count stays 1 (attempt 1 only)
	const [r] = await hub.wait([id], 10_000);
	expect(r.state).toBe("cancelled");
}, 15_000);

// cancel of a RETRYING job reflects in the manifest (cardinality A: same file)
test("EV-39: cancel during backoff writes state=cancelled into the same manifest", async () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "ev39-cancel-"));
	ensureRunDir(root, "run39c");
	hub = new Hub({ monitorIntervalMs: 50, pidFile, run: { repoRoot: root, runId: "run39c" } });
	const id = hub.allocateId();
	const job = hub.spawnJob({
		id, seat: "stub", command: "bun", args: [STUB], cwd: import.meta.dir,
		env: { ...process.env, STUB_MODE: "emit" } as Record<string, string>,
		timeoutMs: 60_000, stallMs: 60_000, sessionId: id, cleanup: () => {},
	});
	await hub.wait([id], 10_000);
	const sup = createRetrySupervisor({
		hub, jobId: id, policy: EV39_POLICY, cleanup: () => {},
		attemptSpec: (n) => ({ args: [STUB], cwd: import.meta.dir, env: { ...process.env } as Record<string, string>, sessionId: `${id}-attempt${n}`, timeoutMs: 60_000, stallMs: 60_000 }),
	});
	const retryable = { ...hub.report(job), stopReason: "error" as const, errorMessage: "Provider returned 502: upstream unavailable" };
	sup.onSettle(job, retryable);
	hub.cancel(id);
	const ms = readManifests(root, "run39c").filter((x) => x.id === id);
	expect(ms).toHaveLength(1);
	const m = ms[0]!;
	expect(m.state).toBe("cancelled");
	expect(m.exitCode).toBe(0);
	// pid file discipline (D2): the retracted pid is not re-published by cancel
	expect(m.pid).toBeNull();
}, 15_000);

// shutdown disposes retrying supervisors (disarm + held cleanup) before the kill loop
test("EV-39: shutdown disposes a retrying supervisor (timer disarmed, cleanup run)", async () => {
	hub = new Hub({ monitorIntervalMs: 50, pidFile });
	const id = hub.allocateId();
	const job = hub.spawnJob({
		id, seat: "stub", command: "bun", args: [STUB], cwd: import.meta.dir,
		env: { ...process.env, STUB_MODE: "emit" } as Record<string, string>,
		timeoutMs: 60_000, stallMs: 60_000, sessionId: id, cleanup: () => {},
	});
	await hub.wait([id], 10_000);
	let cleanups = 0;
	let respawned = 0;
	const sup = createRetrySupervisor({
		hub, jobId: id, policy: { ...EV39_POLICY, baseDelayMs: 10_000 }, cleanup: () => { cleanups++; },
		attemptSpec: () => { respawned++; return { args: [STUB], cwd: import.meta.dir, env: { ...process.env } as Record<string, string>, sessionId: `${id}-attempt2`, timeoutMs: 1_000, stallMs: 1_000 }; },
	});
	const retryable = { ...hub.report(job), stopReason: "error" as const, errorMessage: "Provider returned 502: upstream unavailable" };
	sup.onSettle(job, retryable);
	expect(job.state).toBe("retrying");
	// attach exactly as the real wiring does (spawnJob's retry opt is captured
	// at spawn; a synthetic arming mirrors it via the same field the Hub reads)
	job.retry = sup;
	hub.shutdown();
	await Bun.sleep(100); // far below the 10s delay, but dispose must have rearmed nothing
	expect(cleanups).toBe(1);
	expect(respawned).toBe(0);
}, 15_000);

// exhaust the budget: maxAttempts reached → final settle keeps attempt=3, no further respawn
test("EV-39: budget exhaustion settles with attempt=maxAttempts and no further spawn", async () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "ev39-exh-"));
	ensureRunDir(root, "run39x");
	hub = new Hub({ monitorIntervalMs: 50, pidFile, run: { repoRoot: root, runId: "run39x" } });
	const state = flakyState();
	const id = hub.allocateId();
	const flakyEnv = () =>
		({ ...process.env, STUB_MODE: "flaky", STUB_STATE: state, STUB_FAIL_TIMES: "5" }) as Record<string, string>;
	const job = hub.spawnJob({
		id, seat: "stub", command: "bun", args: [STUB], cwd: import.meta.dir,
		env: flakyEnv(), timeoutMs: 60_000, stallMs: 60_000, sessionId: id,
		cleanup: () => {},
		retry: createRetrySupervisor({
			hub, jobId: id, policy: EV39_POLICY, cleanup: () => {},
			attemptSpec: (n) => ({ args: [STUB], cwd: import.meta.dir, env: flakyEnv(), sessionId: `${id}-attempt${n}`, timeoutMs: 60_000, stallMs: 60_000 }),
		}),
	});
	const [r] = await hub.wait([id], 10_000);
	expect(r.stopReason).toBe("error"); // last attempt still errored
	const ms = readManifests(root, "run39x").filter((x) => x.id === id);
	expect(ms).toHaveLength(1);
	expect(ms[0]!.attempt).toBe(3); // maxAttempts reached, no 4th spawn
	expect(ms[0]!.state).toBe("done"); // provider-errored children exit 0
}, 15_000);

// ---- EV-39: formatReport attempts grammar (spec §2.7; G1 byte-identity) ----

test("EV-39 G1: formatReport with attempts absent or n=1 is byte-identical to the baseline", () => {
	const r = reportOf({ id: "job-1", seat: "owner", state: "done", output: "card done" });
	const base = formatReport(r);
	expect(formatReport(r, { n: 1, max: 3 })).toBe(base);
	expect(base).not.toContain("attempts=");
	expect(base).not.toContain("attempt ");
});

test("EV-39: attempts head fragment + settled sentence on n>1", () => {
	const r = reportOf({ id: "job-5", seat: "skeptic", state: "done", output: "ok", elapsedMs: 186_000, stopReason: "stop" });
	const out = formatReport(r, { n: 2, max: 3 });
	const head = out.split("\n")[0]!;
	expect(head).toContain("attempts=2/3");
	expect(head).toContain("elapsed=3.1m");
	// fragment sits right after elapsed
	expect(head).toMatch(/elapsed=3\.1m attempts=2\/3/);
	expect(out).toContain("Settled on attempt 2 of 3.");
	// sentence comes after the output body
	expect(out.indexOf("--- output ---")).toBeLessThan(out.indexOf("Settled on attempt 2 of 3."));
});

test("EV-39: exhausted sentence names the last error", () => {
	const r = reportOf({ id: "job-5", seat: "skeptic", state: "done", output: "", stopReason: "error", errorMessage: "Provider returned 502: upstream unavailable" });
	const out = formatReport(r, { n: 3, max: 3 });
	expect(out).toContain("Retry budget exhausted after 3 of 3 attempts; last error: Provider returned 502: upstream unavailable.");
});

test("EV-39: non-retryable error stop on the last attempt is a terminal settle, not exhaustion (spec §2.7 table)", () => {
	// errorMessage empty → classifyRetry is undefined → the terminal-settle row,
	// NOT the exhausted row (the exhausted row requires verdict === "retry",
	// which needs a retryable message; the last-error tail is already carried by
	// the --- provider error --- clause).
	const r = reportOf({ id: "job-5", seat: "skeptic", state: "done", output: "", stopReason: "error", errorMessage: undefined });
	const out = formatReport(r, { n: 3, max: 3 });
	expect(out).toContain("Settled on attempt 3 of 3.");
	expect(out).not.toContain("exhausted");
});

test("EV-39: failed-on-attempt sentence", () => {
	const r = reportOf({ id: "job-5", seat: "skeptic", state: "failed", stderrTail: "boom" });
	const out = formatReport(r, { n: 2, max: 3 });
	expect(out).toContain("Failed on attempt 2 of 3.");
});

test("EV-39: settled on the LAST attempt (terminal, not retryable) names the attempt", () => {
	const r = reportOf({ id: "job-5", seat: "skeptic", state: "done", output: "ok", stopReason: "stop" });
	const out = formatReport(r, { n: 3, max: 3 });
	expect(out).toContain("Settled on attempt 3 of 3.");
	expect(out).not.toContain("exhausted");
});
