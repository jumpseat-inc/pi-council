import { spawn } from "node:child_process";
import * as fs from "node:fs";
import { type DispatchMode, type Usage, writeManifest } from "./runs.ts";
import type { RetrySupervisorHandle } from "./job-retry.ts";

export type JobState =
	| "running"
	| "done"
	| "failed"
	| "cancelled"
	| "stalled"
	| "timeout"
	| "retrying";

export interface Job {
	id: string;
	seat: string;
	pid: number | undefined;
	state: JobState;
	startedAt: number;
	lastActivityAt: number;
	/** EV-39 — per-attempt clock for tick(); == startedAt at attempt 1,
	 * re-based at respawn. `startedAt` itself is never re-based (D1). */
	attemptStartedAt: number;
	timeoutMs: number;
	stallMs: number;
	events: string[];
	output: string;
	stderrTail: string;
	usage: Usage;
	stopReason?: string;
	errorMessage?: string;
	exitCode: number | null;
	cleanup?: () => void;
	model?: string;
	settledAt?: number;
	/** EV-39 — current attempt's session id (O-4; defaults to job.id). */
	sessionId?: string;
	/** EV-39 — current attempt ordinal; undefined ⇒ 1. */
	attempt?: number;
	/** EV-42 — per-attempt provenance fed to the manifest: the settled prefix
	 * of completed attempts, appended at settle (BEFORE the retry hook advances
	 * the ordinal — that hook is the only place where the completed ordinal and
	 * the completed session id are unambiguously paired). Seeded at spawnJob
	 * with attempt 1; carried across respawn. Never synthesized from `attempt`. */
	attempts?: { attempt: number; sessionId: string }[];
	/** EV-39 — epoch ms of the next scheduled attempt; set only while state === "retrying". */
	nextAttemptAt?: number;
	/** EV-39 — the settle hook + timer owner for this dispatch (the Hub imports
	 * no policy concern — it only consults the hook). */
	retry?: RetrySupervisorHandle;
	/** EV-68 — card execution mode carried on the ROOT dispatch; set only when
	 * the caller supplied it, never inherited, never copied into childEnv.
	 * Carried across respawn unchanged (a fact about the dispatch, not the
	 * attempt). */
	mode?: DispatchMode;
}

export interface JobReport {
	id: string;
	seat: string;
	state: JobState;
	output: string;
	elapsedMs: number;
	usage: Usage;
	stderrTail: string;
	stopReason?: string;
	errorMessage?: string;
}

export interface HubRunOpts {
	repoRoot: string;
	runId: string;
	parentJobPath?: string;
}

const EVENT_RING = 50;
const STDERR_TAIL = 2048;

function killGroup(pid: number, sig: NodeJS.Signals) {
	try {
		process.kill(-pid, sig);
	} catch {
		try {
			process.kill(pid, sig);
		} catch {
			/* already gone */
		}
	}
}

export class Hub {
	private jobs = new Map<string, Job>();
	private procs = new Map<string, ReturnType<typeof spawn>>();
	/** EV-39 — the spawn command per job id (respawn re-spawns the same
	 * executable; the Job shape stays the spec's five additive fields). */
	private commands = new Map<string, string>();
	private monitor: ReturnType<typeof setInterval>;
	private pidFile?: string;
	private onChange?: () => void;
	private run?: HubRunOpts;
	private counter = 1;

	constructor(opts?: { monitorIntervalMs?: number; pidFile?: string; onChange?: () => void; run?: HubRunOpts }) {
		this.pidFile = opts?.pidFile;
		this.onChange = opts?.onChange;
		this.run = opts?.run;
		this.monitor = setInterval(() => this.tick(), opts?.monitorIntervalMs ?? 30_000);
		// Don't keep the process alive just for the monitor.
		if (typeof this.monitor.unref === "function") this.monitor.unref();
	}

	get runId(): string | undefined {
		return this.run?.runId;
	}

	allocateId(): string {
		const n = this.counter++;
		return this.run?.parentJobPath ? `${this.run.parentJobPath}.${n}` : `job-${n}`;
	}

	private writeJobManifest(job: Job): void {
		if (!this.run) return;
		writeManifest(this.run.repoRoot, this.run.runId, {
			id: job.id,
			seat: job.seat,
			model: job.model ?? "",
			parentJobId: this.run.parentJobPath ?? null,
			pid: job.pid ?? null,
			sessionId: job.sessionId ?? job.id,
			state: job.state,
			startedAt: job.startedAt,
			settledAt: job.exitCode !== null ? Date.now() : null,
			exitCode: job.exitCode,
			usage: job.usage,
			...(job.stopReason !== undefined ? { stopReason: job.stopReason } : {}),
			...(job.attempt !== undefined && job.attempt > 1 ? { attempt: job.attempt } : {}),
			// EV-42 — same gate as `attempt`; read from the settled list only (never
			// synthesized from job.attempt — inside the retrying write that pairing
			// would be a lie: {attempt: 2, sessionId: <attempt 1's id>}).
			...(job.attempt !== undefined && job.attempt > 1 && job.attempts ? { attempts: job.attempts } : {}),
			...(job.nextAttemptAt !== undefined ? { nextAttemptAt: job.nextAttemptAt } : {}),
			// EV-68 — spread-gate: absent key when the dispatch carries no mode
			// (byte-identical to pre-EV-68 output); written last, existing keys never move.
			...(job.mode !== undefined ? { mode: job.mode } : {}),
		});
	}

	spawnJob(opts: {
		id: string;
		seat: string;
		model?: string;
		command: string;
		args: string[];
		cwd: string;
		env?: Record<string, string>;
		timeoutMs: number;
		stallMs: number;
		cleanup?: () => void;
		/** EV-39 — attempt 1's session id; defaults to id (byte-identical manifest). */
		sessionId?: string;
		/** EV-39 — the settle hook + timer owner for retryable dispatches. */
		retry?: RetrySupervisorHandle;
		/** EV-68 — card execution mode; recorded on this dispatch's manifest
		 * only when supplied. Never inherited by sub-dispatches. */
		mode?: DispatchMode;
	}): Job {
		const id = opts.id;
		const now = Date.now();
		const job: Job = {
			id,
			seat: opts.seat,
			model: opts.model,
			pid: undefined,
			state: "running",
			startedAt: now,
			lastActivityAt: now,
			attemptStartedAt: now,
			timeoutMs: opts.timeoutMs,
			stallMs: opts.stallMs,
			events: [],
			output: "",
			stderrTail: "",
			usage: {
				input: 0, output: 0, cacheRead: 0, cacheWrite: 0, reasoning: 0, totalTokens: 0,
				cost: 0, costInput: 0, costOutput: 0, costCacheRead: 0, costCacheWrite: 0,
				turns: 0,
				costBasis: "catalogue-estimate",
				usageSource: "stream-assistant",
			},
			exitCode: null,
			cleanup: opts.cleanup,
			sessionId: opts.sessionId ?? id,
			// EV-42 — the attempt-1 record; appended to at settle (never here —
			// spawn proves only that attempt 1 started, settle proves it completed).
			attempts: [{ attempt: 1, sessionId: opts.sessionId ?? id }],
			retry: opts.retry,
			mode: opts.mode,
		};
		this.spawnProcess(job, opts);
		this.jobs.set(id, job);
		this.writeJobManifest(job);
		this.writePids();
		return job;
	}

	/** EV-39 — re-spawn attempt N under the SAME job id (cardinality A): one
	 * manifest, cumulative usage, stable startedAt (D1). Carries the previous
	 * attempt's seat/model/usage/cleanup/retry; re-bases the per-attempt clock;
	 * resets the per-attempt fields. Returns undefined when the id is unknown. */
	respawn(id: string, spec: {
		args: string[];
		env?: Record<string, string>;
		cwd: string;
		sessionId: string;
		timeoutMs: number;
		stallMs: number;
	}): Job | undefined {
		const prev = this.jobs.get(id);
		if (!prev) return undefined;
		const now = Date.now();
		const job: Job = {
			...prev,
			timeoutMs: spec.timeoutMs,
			stallMs: spec.stallMs,
			sessionId: spec.sessionId,
			// attempt is NOT incremented here: the supervisor's onSettle already
			// advanced it when it armed the backoff (the retrying manifest must read
			// `attempt 2`), and respawn is only invoked from the timer-fire path.
			attempt: prev.attempt,
			state: "running",
			attemptStartedAt: now,
			lastActivityAt: now,
			exitCode: null,
			pid: undefined,
			settledAt: undefined,
			nextAttemptAt: undefined,
			stopReason: undefined,
			errorMessage: undefined,
			output: "",
			stderrTail: "",
			events: [],
		};
		this.spawnProcess(job, { command: this.commands.get(id) ?? "pi", args: spec.args, cwd: spec.cwd, env: spec.env });
		this.jobs.set(id, job);
		this.writeJobManifest(job);
		this.writePids();
		return job;
	}

	/** The one process-wiring helper, shared by spawnJob and respawn: spawn +
	 * stdout/stderr/close/error wiring (identical semantics both paths). */
	private spawnProcess(job: Job, spec: {
		command: string;
		args: string[];
		cwd: string;
		env?: Record<string, string>;
	}): Job {
		this.commands.set(job.id, spec.command);
		const proc = spawn(spec.command, spec.args, {
			cwd: spec.cwd,
			env: spec.env ?? (process.env as Record<string, string>),
			shell: false,
			detached: true,
			stdio: ["ignore", "pipe", "pipe"],
		});
		job.pid = proc.pid;
		this.procs.set(job.id, proc);

		let buffer = "";
		proc.stdout?.on("data", (data: Buffer) => {
			job.lastActivityAt = Date.now();
			buffer += data.toString();
			const lines = buffer.split("\n");
			buffer = lines.pop() || "";
			for (const line of lines) this.processLine(job, line);
			this.onChange?.();
		});
		proc.stderr?.on("data", (data: Buffer) => {
			job.lastActivityAt = Date.now();
			job.stderrTail = (job.stderrTail + data.toString()).slice(-STDERR_TAIL);
		});
		proc.on("close", (code) => {
			if (buffer.trim()) this.processLine(job, buffer);
			job.exitCode = code ?? 0;
			// stalled/cancelled were set before the kill landed; don't overwrite them.
			if (job.state === "running" || job.state === "timeout") {
				job.state = code === 0 ? "done" : "failed";
			}
			this.settle(job);
		});
		proc.on("error", (err) => {
			job.exitCode = 1;
			job.stderrTail = (job.stderrTail + `\nspawn error: ${err.message}`).slice(-STDERR_TAIL);
			if (job.state === "running") job.state = "failed";
			this.settle(job);
		});
		return job;
	}

	private processLine(job: Job, line: string) {
		if (!line.trim()) return;
		let event: any;
		try {
			event = JSON.parse(line);
		} catch {
			return;
		}
		if (event.type === "message_end" && event.message?.role === "assistant") {
			const msg = event.message;
			job.usage.turns++;
			if (msg.stopReason) job.stopReason = msg.stopReason;
			if (msg.errorMessage) job.errorMessage = msg.errorMessage;
			const u = msg.usage;
			if (u) {
				job.usage.input += u.input || 0;
				job.usage.output += u.output || 0;
				job.usage.cacheRead += u.cacheRead || 0; // accumulated, never folded into input
				job.usage.cacheWrite += u.cacheWrite || 0;
				// reasoning is a subset of output (pi-ai types.d.ts) — accumulate
				// independently, never re-add into output or any total.
				job.usage.reasoning += u.reasoning || 0;
				// provider-reported; never derived from the component sum
				job.usage.totalTokens += u.totalTokens || 0;
				job.usage.cost += u.cost?.total || 0;
				job.usage.costInput += u.cost?.input || 0;
				job.usage.costOutput += u.cost?.output || 0;
				job.usage.costCacheRead += u.cost?.cacheRead || 0;
				job.usage.costCacheWrite += u.cost?.cacheWrite || 0;
			}
			for (const part of msg.content ?? []) {
				if (part.type === "text" && part.text) job.output = part.text;
				if (part.type === "toolCall") this.pushEvent(job, `→ ${part.name}`);
			}
		} else if (event.type === "tool_execution_start") {
			this.pushEvent(job, `→ ${event.toolName ?? "tool"}`);
		}
	}

	private pushEvent(job: Job, desc: string) {
		job.events.push(desc);
		if (job.events.length > EVENT_RING) job.events.shift();
	}

	private tick() {
		const now = Date.now();
		for (const job of this.jobs.values()) {
			if (job.state !== "running") continue;
			if (now - job.lastActivityAt > job.stallMs) {
				job.state = "stalled";
				this.writeJobManifest(job);
				if (job.pid) {
					killGroup(job.pid, "SIGTERM");
					const pid = job.pid;
					setTimeout(() => killGroup(pid, "SIGKILL"), 5_000).unref?.();
				}
			} else if (now - job.attemptStartedAt > job.timeoutMs) { // EV-39 — per-attempt clock (D1)
				job.state = "timeout"; // informational — NOT killed
				this.writeJobManifest(job);
				this.onChange?.();
			}
		}
	}

	private settle(job: Job) {
		// EV-42 — append the just-completed attempt BEFORE calling onSettle:
		// onSettle advances `attempt` to the PENDING ordinal before the hub's
		// retrying write, so this is the only point where the completed ordinal
		// and the completed session id are unambiguously paired. Copy-on-write +
		// idempotent per ordinal (a re-entering settle is a no-op).
		const completedOrdinal = job.attempt ?? 1;
		if (!job.attempts?.some((a) => a.attempt === completedOrdinal)) {
			job.attempts = [
				...(job.attempts ?? []),
				{ attempt: completedOrdinal, sessionId: job.sessionId ?? job.id },
			];
		}
		const report = this.report(job); // captures the real exitCode/state/usage
		if (job.retry?.onSettle(job, report)) {
			// EV-39 — retrying: the hook retracted settledness (exitCode null, pid
			// undefined, nextAttemptAt set) synchronously BEFORE the manifest and
			// the onChange fan-out, so the usage flush gate stays closed through
			// the backoff window; the cleanup is withheld — the supervisor owns it.
			this.procs.delete(job.id);
			this.writeJobManifest(job);
			this.writePids();
			this.onChange?.();
			return;
		}
		job.settledAt = Date.now();
		this.procs.delete(job.id);
		job.cleanup?.();
		job.cleanup = undefined;
		this.writeJobManifest(job);
		this.writePids();
		this.onChange?.();
	}

	cancel(id: string): boolean {
		const job = this.jobs.get(id);
		if (!job) return false;
		if (job.state === "retrying") {
			// EV-39 — cancel mid-backoff: disarm the timer (the disposed guard
			// makes a later fire a no-op), run the held once-guarded cleanup, and
			// settle synthetically (exitCode 0 — no close event will fire).
			job.retry?.dispose();
			job.state = "cancelled";
			job.exitCode = 0;
			job.nextAttemptAt = undefined;
			this.writeJobManifest(job);
			this.writePids();
			this.onChange?.();
			return true;
		}
		if (job.exitCode !== null) return false;
		job.state = "cancelled";
		this.writeJobManifest(job);
		if (job.pid) {
			killGroup(job.pid, "SIGTERM");
			const pid = job.pid;
			setTimeout(() => killGroup(pid, "SIGKILL"), 5_000).unref?.();
		}
		return true;
	}

	report(job: Job): JobReport {
		return {
			id: job.id,
			seat: job.seat,
			state: job.state,
			output: job.output,
			elapsedMs: Date.now() - job.startedAt,
			usage: { ...job.usage },
			stderrTail: job.stderrTail,
			stopReason: job.stopReason,
			errorMessage: job.errorMessage,
		};
	}

	/** Settled for wait purposes: timeout is informational (wait returns);
	 * cancelled/stalled count once the process actually died. */
	private isSettledForWait(job: Job): boolean {
		if (job.state === "retrying") return false; // EV-39 — wait blocks through the backoff window
		if (job.state === "timeout") return true;
		if (job.state === "running") return false;
		return job.exitCode !== null;
	}

	async wait(ids: string[], timeoutMs: number, signal?: AbortSignal): Promise<JobReport[]> {
		const deadline = Date.now() + timeoutMs;
		while (Date.now() < deadline) {
			if (signal?.aborted) break;
			const jobs = ids.map((id) => this.jobs.get(id));
			if (jobs.some((j) => !j)) {
				const missing = ids.filter((id) => !this.jobs.get(id));
				throw new Error(`Unknown job id(s): ${missing.join(", ")}`);
			}
			if ((jobs as Job[]).every((j) => this.isSettledForWait(j))) break;
			await new Promise((r) => setTimeout(r, 200));
		}
		const missing = ids.filter((id) => !this.jobs.get(id));
		if (missing.length > 0) throw new Error(`Unknown job id(s): ${missing.join(", ")}`);
		return ids.map((id) => this.report(this.jobs.get(id)!));
	}

	list(): Job[] {
		return [...this.jobs.values()];
	}

	/** EV-39 — public accessor used by the retry supervisor's timer fire to
	 * re-check the job's state before respawning. */
	get(id: string): Job | undefined {
		return this.jobs.get(id);
	}

	private writePids() {
		if (!this.pidFile) return;
		const pids = [...this.jobs.values()].filter((j) => j.exitCode === null && j.pid).map((j) => j.pid);
		try {
			fs.writeFileSync(this.pidFile, JSON.stringify(pids));
		} catch {
			/* best effort */
		}
	}

	shutdown(): void {
		clearInterval(this.monitor);
		// EV-39 — retrying jobs have no live pid; dispose their supervisors so the
		// pending backoff timers are cleared and the held cleanup runs exactly once.
		for (const job of this.jobs.values()) {
			if (job.state === "retrying") job.retry?.dispose();
		}
		for (const job of this.jobs.values()) {
			if (job.exitCode === null && job.pid) {
				job.state = "cancelled";
				killGroup(job.pid, "SIGKILL");
			}
		}
		this.writePids();
	}

	static sweepStalePids(pidFile: string): number {
		let killed = 0;
		try {
			const pids: number[] = JSON.parse(fs.readFileSync(pidFile, "utf-8"));
			for (const pid of pids) {
				try {
					process.kill(-pid, "SIGKILL");
					killed++;
				} catch {
					try {
						process.kill(pid, "SIGKILL");
						killed++;
					} catch {
						/* already gone */
					}
				}
			}
			fs.writeFileSync(pidFile, "[]");
		} catch {
			/* no file */
		}
		return killed;
	}
}
