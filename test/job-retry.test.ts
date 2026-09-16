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
