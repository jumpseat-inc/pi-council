import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { CONFIG_DIR_NAME, type ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { Hub, type JobReport } from "./hub.ts";
import { buildChildArgv, buildSystemPrompt, loadSeat, proceduresDir } from "./seats.ts";

export interface HubToolOptions {
	allowedSeats?: string[];
}

export function pidFilePath(repoRoot: string): string {
	return path.join(repoRoot, CONFIG_DIR_NAME, "council", ".pids.json");
}

let hubSingleton: Hub | null = null;
let hubOnChange: (() => void) | undefined;

export function getHub(repoRoot: string, onChange?: () => void): Hub {
	if (onChange) hubOnChange = onChange;
	if (!hubSingleton) {
		hubSingleton = new Hub({
			pidFile: pidFilePath(repoRoot),
			onChange: () => hubOnChange?.(),
		});
	}
	return hubSingleton;
}

export function shutdownHub(): void {
	hubSingleton?.shutdown();
	hubSingleton = null;
}

function formatReport(r: JobReport): string {
	const mins = (r.elapsedMs / 60_000).toFixed(1);
	const stop = r.stopReason ? ` stopReason=${r.stopReason}` : "";
	const head = `[${r.id}] seat=${r.seat} state=${r.state}${stop} elapsed=${mins}m turns=${r.usage.turns} cost=$${r.usage.cost.toFixed(4)}`;
	const body = r.output ? `\n--- output ---\n${r.output}` : "";
	const provErr = r.errorMessage ? `\n--- provider error ---\n${r.errorMessage}` : "";
	const emptyWarn =
		!r.output && r.state === "done"
			? `\n⚠ done but no text output (stopReason=${r.stopReason ?? "unknown"}). If stopReason=length, the model hit its output-token ceiling mid-thinking — this is a model-config problem, not a seat problem; surface it rather than re-dispatching blindly.`
			: "";
	const err =
		(r.state === "failed" || r.state === "stalled") && r.stderrTail ? `\n--- stderr tail ---\n${r.stderrTail}` : "";
	return head + body + provErr + emptyWarn + err;
}

export function registerHubTools(pi: ExtensionAPI, repoRoot: string, opts: HubToolOptions = {}): void {
	pi.registerTool({
		name: "council_dispatch",
		label: "Council Dispatch",
		description:
			"Dispatch a Council seat as an isolated background job. Returns a job ID immediately. " +
			"Follow with council_wait to collect the result. Timeout default 15 min; raise it for long implementation or verification tasks.",
		parameters: Type.Object({
			seat: Type.String({ description: "Seat name from .pi/agents/ (e.g. owner, skeptic)" }),
			input: Type.String({ description: "The full task/deliberation input for the seat" }),
			timeout_minutes: Type.Optional(Type.Number({ description: "Ceiling in minutes (default 15)" })),
			stall_minutes: Type.Optional(
				Type.Number({ description: "No-activity window before auto-cancel (default 4)" }),
			),
		}),
		async execute(_id, params, _signal, _onUpdate, ctx) {
			if (opts.allowedSeats && !opts.allowedSeats.includes(params.seat)) {
				return {
					content: [
						{
							type: "text",
							text: `Refused: this seat may only dispatch [${opts.allowedSeats.join(", ")}], not "${params.seat}".`,
						},
					],
					details: {},
					isError: true,
				};
			}
			let seat: ReturnType<typeof loadSeat>;
			try {
				seat = loadSeat(repoRoot, params.seat);
			} catch (e) {
				return { content: [{ type: "text", text: String(e) }], details: {}, isError: true };
			}
			// Loud model check: resolvable in the catalogue or fail now.
			const known = ctx.modelRegistry
				.getAvailable()
				.some((m: { provider: string; id: string }) => `${m.provider}/${m.id}` === seat.model);
			if (!known) {
				return {
					content: [
						{
							type: "text",
							text: `Seat "${seat.name}" pins model "${seat.model}", which is not in pi's catalogue. No fallback — fix the seat file or model config.`,
						},
					],
					details: {},
					isError: true,
				};
			}
			const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "council-"));
			const promptFile = path.join(tmpDir, "system.md");
			fs.writeFileSync(promptFile, buildSystemPrompt(repoRoot, seat, proceduresDir(repoRoot)), { mode: 0o600 });
			const hub = getHub(repoRoot);
			const job = hub.spawnJob({
				seat: seat.name,
				command: "pi",
				args: buildChildArgv(seat, params.input, promptFile),
				cwd: repoRoot,
				env: { ...process.env, COUNCIL_SEAT: seat.name } as Record<string, string>,
				timeoutMs: (params.timeout_minutes ?? 15) * 60_000,
				stallMs: (params.stall_minutes ?? 4) * 60_000,
				cleanup: () => {
					try {
						fs.rmSync(tmpDir, { recursive: true, force: true });
					} catch {
						/* best effort */
					}
				},
			});
			return {
				content: [
					{
						type: "text",
						text: `Dispatched ${seat.name} as ${job.id} (pid ${job.pid}). Use council_wait to collect.`,
					},
				],
				details: { jobId: job.id, seat: seat.name },
			};
		},
	});

	pi.registerTool({
		name: "council_wait",
		label: "Council Wait",
		description:
			"Wait for dispatched jobs to settle or the window to elapse. Returns each job's state " +
			"(done|failed|cancelled|stalled|timeout|running) and output. Does NOT cancel on timeout — that is your explicit move.",
		parameters: Type.Object({
			job_ids: Type.Array(Type.String(), { description: "Job IDs from council_dispatch" }),
			timeout_minutes: Type.Number({ description: "How long to wait before returning" }),
		}),
		async execute(_id, params, signal) {
			const hub = getHub(repoRoot);
			const reports = await hub.wait(params.job_ids, params.timeout_minutes * 60_000, signal);
			return {
				content: [{ type: "text", text: reports.map(formatReport).join("\n\n====\n\n") }],
				details: { reports },
			};
		},
	});

	pi.registerTool({
		name: "council_cancel",
		label: "Council Cancel",
		description: "Cancel a running job (SIGTERM, then SIGKILL).",
		parameters: Type.Object({ job_id: Type.String() }),
		async execute(_id, params) {
			const ok = getHub(repoRoot).cancel(params.job_id);
			return {
				content: [
					{
						type: "text",
						text: ok ? `Cancelled ${params.job_id}.` : `${params.job_id} is unknown or already settled.`,
					},
				],
				details: {},
			};
		},
	});
}
