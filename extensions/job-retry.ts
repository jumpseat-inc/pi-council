// EV-39 — the hub-level retry supervisor (spec §2.3). Pure-decision module:
// classification + attempt counter + unref'd injected backoff timer. It owns
// NO spawn inputs (council_dispatch holds those, spec §2.1) and NO lifecycle
// state beyond its own handle (Hub owns the job's). Both pure functions are
// reused verbatim from retry.ts — the EV-40 §2.8 watch item forbids a second
// copy of either the classifier or the delay function.
import type { Hub, Job, JobReport } from "./hub.ts";
import { classifyRetry, computeBackoffDelay } from "./retry.ts";
import type { RetryPolicy } from "./seats.ts";

export interface RetrySupervisorHandle {
	/** Hub settle hook. Returns true when the dispatch stays alive (retrying);
	 * the Hub then writes the retrying manifest, keeps the pid file clean and
	 * withholds the cleanup (this handle owns it). Synchronous, pre-manifest. */
	onSettle(job: Job, report: JobReport): boolean;
	/** Clears the pending timer and runs the held cleanup exactly once. Idempotent. */
	dispose(): void;
}

export interface RetryAttemptSpec {
	args: string[];
	env: Record<string, string>;
	cwd: string;
	sessionId: string; // MUST be `${jobId}-attempt${n}` (O-4, provisional naming; EV-42 finalizes)
	timeoutMs: number;
	stallMs: number;
}

export interface RetrySupervisorInput {
	hub: Hub;
	jobId: string;
	policy: RetryPolicy;
	/** Once-guarded real cleanup, shared with the Hub's non-retry settle path. */
	cleanup: () => void;
	/** Builds attempt n's spawn spec (n ≥ 2). Pure. */
	attemptSpec: (n: number) => RetryAttemptSpec;
	setTimer?: (fn: () => void, ms: number) => { cancel(): void; unref?: () => void };
	rand?: () => number;
}

interface TimerHandle {
	cancel(): void;
	unref?: () => void;
}

/** Default timer: a real setTimeout, unref'd so a pending backoff never holds
 * the parent's event loop open (shutdown/dispose is the authoritative disarm). */
function defaultSetTimer(fn: () => void, ms: number): TimerHandle {
	const t = setTimeout(fn, ms);
	t.unref?.();
	return { cancel: () => clearTimeout(t) };
}

export function createRetrySupervisor(input: RetrySupervisorInput): RetrySupervisorHandle {
	const setTimer = input.setTimer ?? defaultSetTimer;
	const rand = input.rand ?? Math.random;
	let disposed = false;
	let timer: TimerHandle | undefined;

	function clearTimer(): void {
		timer?.cancel();
		timer = undefined;
	}

	function fire(): void {
		timer = undefined;
		if (disposed) return;
		const job = input.hub.get(input.jobId);
		if (!job || job.state !== "retrying") return; // cancelled or disposed path
		input.hub.respawn(input.jobId, input.attemptSpec(job.attempt ?? 2));
	}

	return {
		onSettle(job, report) {
			const verdict = classifyRetry(report);
			const current = job.attempt ?? 1;
			if (disposed || !input.policy.enabled || verdict !== "retry" || current >= input.policy.maxAttempts) {
				return false; // final settle — the Hub runs the cleanup
			}
			const next = current + 1;
			const delay = computeBackoffDelay(input.policy, next, rand);
			job.attempt = next;
			job.state = "retrying";
			job.exitCode = null; // D2 — settledness retracted…
			job.pid = undefined; // D2 — …and the dead pid retracted together
			job.settledAt = undefined;
			job.nextAttemptAt = Date.now() + delay;
			clearTimer();
			timer = setTimer(fire, delay);
			return true;
		},
		dispose() {
			if (disposed) return;
			disposed = true;
			clearTimer();
			try {
				input.cleanup();
			} catch {
				/* best effort, exactly once (once-guard upstream makes this rare) */
			}
		},
	};
}
