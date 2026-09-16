// EV-39 spec §2.3 — the pure-decision retry supervisor, unit-tested with a fake
// Hub and injected clock/rand (no processes). Classification and the backoff
// delay are the verbatim retry.ts functions (no second copy — EV-40 §2.8).
import { test, expect } from "bun:test";
import { createRetrySupervisor, type RetryAttemptSpec } from "../extensions/job-retry.ts";
import { computeBackoffDelay } from "../extensions/retry.ts";
import type { Hub, Job, JobReport } from "../extensions/hub.ts";
import type { RetryPolicy } from "../extensions/seats.ts";

const POLICY: RetryPolicy = { enabled: true, maxAttempts: 3, baseDelayMs: 1000, maxDelayMs: 8000, jitter: false };

function zero(): Job["usage"] {
	return {
		input: 0, output: 0, cacheRead: 0, cacheWrite: 0, reasoning: 0, totalTokens: 0,
		cost: 0, costInput: 0, costOutput: 0, costCacheRead: 0, costCacheWrite: 0,
		turns: 0, costBasis: "catalogue-estimate", usageSource: "stream-assistant",
	};
}

function jobOf(over: Partial<Job> = {}): Job {
	return {
		id: "job-1", seat: "stub", pid: 4242, state: "done", startedAt: 1_000, lastActivityAt: 2_000,
		attemptStartedAt: 1_000,
		timeoutMs: 60_000, stallMs: 60_000, events: [], output: "", stderrTail: "",
		usage: zero(), exitCode: 0, ...over,
	} as Job;
}

function reportOf(over: Partial<JobReport>): JobReport {
	return {
		id: "job-1", seat: "stub", state: "done", output: "", elapsedMs: 1_000, usage: zero(),
		stderrTail: "", stopReason: "error", errorMessage: "Provider returned 502: upstream unavailable",
		...over,
	};
}

function fakeHub(job: Job | undefined): Hub {
	return {
		get: (id: string) => (id === job?.id ? job : undefined),
		respawn: () => {},
	} as unknown as Hub;
}

function specFor(n: number): RetryAttemptSpec {
	return { args: ["a"], env: {}, cwd: "/x", sessionId: `job-1-attempt${n}`, timeoutMs: 5, stallMs: 5 };
}

// T1: retryable settle on attempt 1 → onSettle returns true, job mutated to
// retrying with D2's paired null/undefined and a computed nextAttemptAt.
test("onSettle: retry verdict on attempt 1 arms the retrying state (D2 pair)", () => {
	const job = jobOf();
	const before = Date.now();
	const sup = createRetrySupervisor({
		hub: fakeHub(job), jobId: job.id, policy: POLICY, cleanup: () => {},
		attemptSpec: specFor,
		setTimer: (fn, ms) => { const t = { ms, fire: fn, cancelled: false }; (job as any).timers = ((job as any).timers ?? []).concat(t); return { cancel: () => { t.cancelled = true; } }; },
		rand: () => 0.5,
	});
	expect(sup.onSettle(job, reportOf({}))).toBe(true);
	expect(job.state).toBe("retrying");
	expect(job.exitCode).toBeNull(); // D2 — settledness retracted...
	expect(job.pid).toBeUndefined(); // D2 — ...and the dead pid retracted together
	expect(job.attempt).toBe(2);
	// nextAttemptAt = arming time + delay (spec §2.3 step 3)
	expect(job.nextAttemptAt).toBeGreaterThanOrEqual(before + 1_000);
	expect(job.nextAttemptAt).toBeLessThanOrEqual(Date.now() + 1_000);
	expect(job.nextAttemptAt).toBeDefined();
});

// T2: terminal verdict → false, no state mutation.
test("onSettle: terminal verdict returns false and touches nothing", () => {
	const job = jobOf();
	const sup = createRetrySupervisor({
		hub: fakeHub(job), jobId: job.id, policy: POLICY, cleanup: () => {},
		attemptSpec: () => { throw new Error("must not build a spec"); },
	});
	expect(sup.onSettle(job, reportOf({ stopReason: "stop", errorMessage: undefined }))).toBe(false);
	expect(job.state).toBe("done");
	expect(job.exitCode).toBe(0);
	expect(job.attempt).toBeUndefined();
});

// T3: budget exhausted → false.
test("onSettle: attempt >= maxAttempts returns false (budget exhausted)", () => {
	const job = jobOf({ attempt: 3 });
	const sup = createRetrySupervisor({
		hub: fakeHub(job), jobId: job.id, policy: POLICY, cleanup: () => {},
		attemptSpec: () => { throw new Error("must not build a spec"); },
	});
	expect(sup.onSettle(job, reportOf({}))).toBe(false);
});

// T4: disabled policy → false.
test("onSettle: disabled policy returns false", () => {
	const job = jobOf();
	const sup = createRetrySupervisor({
		hub: fakeHub(job), jobId: job.id, policy: { ...POLICY, enabled: false }, cleanup: () => {},
		attemptSpec: () => { throw new Error("must not build a spec"); },
	});
	expect(sup.onSettle(job, reportOf({}))).toBe(false);
});

// T5: timer fire respawns attempt n's spec; a job no longer retrying never respawns.
test("timer fire respawns once with the attempt spec; defused when state moves on", () => {
	const job = jobOf({ state: "retrying", attemptStartedAt: 900 }); // attempt 1 settled → next is 2
	let respawned: { id: string; spec: RetryAttemptSpec } | undefined;
	const hub = {
		get: (id: string) => (id === job.id ? job : undefined),
		respawn: (id: string, spec: RetryAttemptSpec) => { respawned = { id, spec }; },
	} as unknown as Hub;
	let fire: (() => void) | undefined;
	const sup = createRetrySupervisor({
		hub, jobId: job.id, policy: POLICY, cleanup: () => {},
		attemptSpec: specFor,
		setTimer: (fn) => { fire = fn; return { cancel: () => {} }; },
	});
	sup.onSettle(job, reportOf({}));
	fire!();
	expect(respawned?.id).toBe("job-1");
	expect(respawned?.spec.sessionId).toBe("job-1-attempt2");
	// a second fire after the state moved on is a no-op (cancel arbitration)
	respawned = undefined;
	job.state = "done";
	fire!();
	expect(respawned).toBeUndefined();
});

// T6: cancel-during-backoff arbitration — dispose clears the timer, runs the
// once-guarded cleanup exactly once, and a later fire is a no-op.
test("dispose clears the timer, runs cleanup once, is idempotent, defuses the fire", () => {
	const job = jobOf({ state: "retrying" });
	let cleanupRuns = 0;
	let fires: Array<() => void> = [];
	const hub = fakeHub(job);
	const sup = createRetrySupervisor({
		hub, jobId: job.id, policy: POLICY, cleanup: () => { cleanupRuns++; },
		attemptSpec: specFor,
		setTimer: (fn) => { fires.push(fn); return { cancel: () => {} }; },
	});
	sup.onSettle(job, reportOf({}));
	sup.dispose();
	sup.dispose(); // idempotent
	expect(cleanupRuns).toBe(1);
	// a fire after dispose never respawns
	let respawned = 0;
	(hub as unknown as { respawn: () => void }).respawn = () => { respawned++; };
	for (const f of fires) f();
	expect(respawned).toBe(0);
});

// T7: backoff delay comes from computeBackoffDelay — never a second copy.
test("armed delay equals computeBackoffDelay(policy, next, rand)", () => {
	const job = jobOf();
	let seenMs = -1;
	const sup = createRetrySupervisor({
		hub: fakeHub(job), jobId: job.id, policy: POLICY, cleanup: () => {},
		attemptSpec: specFor,
		setTimer: (_fn, ms) => { seenMs = ms; return { cancel: () => {} }; },
		rand: () => 0.25,
	});
	sup.onSettle(job, reportOf({}));
	expect(seenMs).toBe(computeBackoffDelay(POLICY, 2, () => 0.25));
});

// T8: a disposed supervisor's onSettle always returns false (no re-arm after teardown).
test("onSettle after dispose returns false (shutdown-during-backoff)", () => {
	const job = jobOf();
	const hub = fakeHub(job);
	let cleanupRuns = 0;
	const sup = createRetrySupervisor({
		hub, jobId: job.id, policy: POLICY, cleanup: () => { cleanupRuns++; },
		attemptSpec: specFor,
		setTimer: () => ({ cancel: () => {} }),
	});
	sup.dispose();
	expect(sup.onSettle(job, reportOf({}))).toBe(false);
	expect(cleanupRuns).toBe(1); // still exactly once
	expect(job.state).toBe("done"); // untouched — final settle proceeds
});

// ---- wiring (spec §2.4): the real council_dispatch arms the supervisor ----
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach } from "bun:test";
import { CONFIG_DIR_NAME } from "@earendil-works/pi-coding-agent";
import { getHub, initHubIdentity, registerHubTools, shutdownHub } from "../extensions/hub-tools.ts";

const STUB = path.join(import.meta.dir, "stub-child.ts");
const WIRED_POLICY: RetryPolicy = { enabled: true, maxAttempts: 3, baseDelayMs: 60, maxDelayMs: 60, jitter: false };

function writeWiredSeat(root: string, name: string, model: string): void {
	const dir = path.join(root, CONFIG_DIR_NAME, "agents");
	fs.mkdirSync(dir, { recursive: true });
	fs.writeFileSync(
		path.join(dir, `${name}.md`),
		`---\nname: ${name}\ndescription: test\nmodel: ${model}\ntools: Read\n---\nunit-test body`,
	);
}

/** Register the real hub tools with the injected policy and wrap BOTH spawn
 * entry points so the stub child runs instead of pi while the ORIGINAL argv
 * (with --session-id) is captured for O-4 assertions. */
function makeWiredDispatcher(
	root: string,
	policy: RetryPolicy | null,
	flaky?: { state: string; failTimes: string },
) {
	let dispatchTool:
		| { execute: (id: unknown, params: unknown, signal: unknown, onUpdate: unknown, ctx: unknown) => Promise<Record<string, any>> }
		| undefined;
	const pi: unknown = {
		registerTool: (t: { name: string; execute: (id: unknown, params: unknown, signal: unknown, onUpdate: unknown, ctx: unknown) => Promise<Record<string, any>> }) => {
			if (t.name === "council_dispatch") dispatchTool = { execute: t.execute };
		},
	};
	registerHubTools(pi as never, root, policy ? { retryPolicy: () => policy } : {});
	const hub = getHub(root);
	const spawnArgs: string[][] = [];
	const respawnArgs: string[][] = [];
	const realSpawn = hub.spawnJob.bind(hub);
	(hub as unknown as { spawnJob: (o: Record<string, unknown>) => unknown }).spawnJob = (o: Record<string, unknown>) => {
		spawnArgs.push(o.args as string[]);
		const env = flaky
			? { ...(o.env as Record<string, string>), STUB_MODE: "flaky", STUB_STATE: flaky.state, STUB_FAIL_TIMES: flaky.failTimes }
			: o.env;
		return realSpawn({ ...o, command: "bun", args: [STUB], env } as Parameters<typeof realSpawn>[0]);
	};
	const realRespawn = hub.respawn.bind(hub);
	(hub as unknown as { respawn: (id: string, s: Record<string, unknown>) => unknown }).respawn = (id: string, spec: Record<string, unknown>) => {
		respawnArgs.push(spec.args as string[]);
		const env = flaky
			? { ...(spec.env as Record<string, string>), STUB_MODE: "flaky", STUB_STATE: flaky.state, STUB_FAIL_TIMES: flaky.failTimes }
			: spec.env;
		return realRespawn(id, { ...spec, args: [STUB], env } as Parameters<typeof realRespawn>[1]);
	};
	if (!dispatchTool) throw new Error("council_dispatch was not registered");
	const ctx = { modelRegistry: { getAvailable: () => [{ provider: "openrouter", id: "test/model" }] } };
	return {
		dispatch: (params: Record<string, unknown>) => dispatchTool!.execute(null, params, undefined, undefined, ctx),
		spawnArgs,
		respawnArgs,
	};
}

afterEach(() => shutdownHub());

test("wiring: retried dispatch re-spawns under one id with -attempt2 session id and settles done", async () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "ev39-wire-"));
	writeWiredSeat(root, "agent-s", "openrouter/test/model");
	initHubIdentity("runW39");
	const state = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "ev39-wire-state-")), "state.json");
	const { dispatch, respawnArgs } = makeWiredDispatcher(root, WIRED_POLICY, { state, failTimes: "1" });
	const res = await dispatch({ seat: "agent-s", input: "task" });
	expect(res.isError).toBeFalsy();
	const id = res.details.jobId as string;
	const hub = getHub(root);
	const [r] = await hub.wait([id], 10_000);
	expect(r.state).toBe("done");
	// O-4: attempt 2's argv carried the fresh session id
	expect(respawnArgs).toHaveLength(1);
	const sidIdx = respawnArgs[0]!.indexOf("--session-id");
	expect(sidIdx).toBeGreaterThan(-1);
	expect(respawnArgs[0]![sidIdx + 1]).toBe(`${id}-attempt2`);
	// cardinality A: one manifest, attempt 2, the final attempt's session id
	const manifest = JSON.parse(
		fs.readFileSync(path.join(root, CONFIG_DIR_NAME, "council", "runs", "runW39", `${id}.json`), "utf-8"),
	);
	expect(manifest.attempt).toBe(2);
	expect(manifest.sessionId).toBe(`${id}-attempt2`);
}, 15_000);

test("wiring: disabled policy → single spawn, manifest has no attempt key, sessionId == id", async () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "ev39-wire2-"));
	writeWiredSeat(root, "agent-s", "openrouter/test/model");
	initHubIdentity("runW39b");
	const { dispatch, respawnArgs, spawnArgs } = makeWiredDispatcher(root, { ...WIRED_POLICY, enabled: false });
	const res = await dispatch({ seat: "agent-s", input: "task" });
	expect(res.isError).toBeFalsy();
	const id = res.details.jobId as string;
	await getHub(root).wait([id], 10_000);
	expect(spawnArgs).toHaveLength(1);
	expect(respawnArgs).toHaveLength(0);
	const manifest = JSON.parse(
		fs.readFileSync(path.join(root, CONFIG_DIR_NAME, "council", "runs", "runW39b", `${id}.json`), "utf-8"),
	);
	expect("attempt" in manifest).toBe(false);
	expect(manifest.sessionId).toBe(id);
}, 15_000);


test("malformed policy: init disables retry for both loops and warns — never crashes (spec §4.3)", () => {
	const src = fs.readFileSync(new URL("../extensions/index.ts", import.meta.url), "utf-8");
	// the catch disables, it never propagates
	expect(src).toMatch(/catch \(e\) \{[\s\S]*?retryPolicy = null;[\s\S]*?retryConfigError = e;/);
	// the session-start warning names both loops (EV-39 broadened copy)
	expect(src).toContain("retry disabled for this session (hub + parent-turn loops)");
	// both consumers get the snapshot getter, not their own read
	expect(src).toMatch(/registerHubTools\(pi, repoRoot, \{ retryPolicy: retryPolicyGetter \}\)/);
	expect(src).toMatch(/retryPolicy\?\.maxAttempts \?\? DEFAULT_RETRY_POLICY\.maxAttempts/);
});
