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
