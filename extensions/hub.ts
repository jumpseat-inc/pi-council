import { spawn } from "node:child_process";
import * as fs from "node:fs";
import { writeManifest } from "./runs.ts";

export type JobState = "running" | "done" | "failed" | "cancelled" | "stalled" | "timeout";

export interface Job {
	id: string;
	seat: string;
	pid: number | undefined;
	state: JobState;
	startedAt: number;
	lastActivityAt: number;
	timeoutMs: number;
	stallMs: number;
	events: string[];
	output: string;
	stderrTail: string;
	usage: { input: number; output: number; cost: number; turns: number };
	stopReason?: string;
	errorMessage?: string;
	exitCode: number | null;
	cleanup?: () => void;
	model?: string;
	settledAt?: number;
}

export interface JobReport {
	id: string;
	seat: string;
	state: JobState;
	output: string;
	elapsedMs: number;
	usage: Job["usage"];
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
			sessionId: job.id,
			state: job.state,
			startedAt: job.startedAt,
			settledAt: job.exitCode !== null ? Date.now() : null,
			exitCode: job.exitCode,
			usage: job.usage,
			...(job.stopReason !== undefined ? { stopReason: job.stopReason } : {}),
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
			timeoutMs: opts.timeoutMs,
			stallMs: opts.stallMs,
			events: [],
			output: "",
			stderrTail: "",
			usage: { input: 0, output: 0, cost: 0, turns: 0 },
			exitCode: null,
			cleanup: opts.cleanup,
		};
		const proc = spawn(opts.command, opts.args, {
			cwd: opts.cwd,
			env: opts.env ?? (process.env as Record<string, string>),
			shell: false,
			detached: true,
			stdio: ["ignore", "pipe", "pipe"],
		});
		job.pid = proc.pid;
		this.writeJobManifest(job);
		this.jobs.set(id, job);
		this.procs.set(id, proc);
		this.writePids();

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
				job.usage.cost += u.cost?.total || 0;
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
			} else if (now - job.startedAt > job.timeoutMs) {
				job.state = "timeout"; // informational — NOT killed
				this.writeJobManifest(job);
				this.onChange?.();
			}
		}
	}

	private settle(job: Job) {
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
