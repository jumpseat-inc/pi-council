import { test, expect, afterEach } from "bun:test";
import * as os from "node:os";
import * as path from "node:path";
import { Hub } from "../extensions/hub.ts";

const STUB = path.join(import.meta.dir, "stub-child.ts");
const pidFile = path.join(os.tmpdir(), `council-hub-test-${process.pid}.json`);
let hub: Hub;
afterEach(() => hub?.shutdown());

function spawnStub(h: Hub, mode: string, over: Partial<{ timeoutMs: number; stallMs: number }> = {}) {
	return h.spawnJob({
		seat: "stub",
		command: "bun",
		args: [STUB],
		cwd: import.meta.dir,
		env: { ...process.env, STUB_MODE: mode } as Record<string, string>,
		timeoutMs: over.timeoutMs ?? 60_000,
		stallMs: over.stallMs ?? 60_000,
	});
}

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

test("shutdown kills running jobs", async () => {
	hub = new Hub({ monitorIntervalMs: 50, pidFile });
	const job = spawnStub(hub, "hang");
	await Bun.sleep(200);
	hub.shutdown();
	await Bun.sleep(200);
	expect(() => process.kill(job.pid!, 0)).toThrow(); // process gone
});
