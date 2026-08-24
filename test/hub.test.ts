import { test, expect, afterEach } from "bun:test";
import * as os from "node:os";
import * as fs from "node:fs";
import * as path from "node:path";
import { CONFIG_DIR_NAME } from "@earendil-works/pi-coding-agent";
import { Hub } from "../extensions/hub.ts";
import { ensureRunDir } from "../extensions/runs.ts";

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
