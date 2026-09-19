import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { CONFIG_DIR_NAME, type ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { Hub, type JobReport, type JobState } from "./hub.ts";
import { type DispatchMode, type RunManifest, readManifests } from "./runs.ts";
import { buildChildArgv, buildSystemPrompt, DEFAULT_RETRY_POLICY, loadSeat, proceduresDir, resolveEffectiveModel } from "./seats.ts";
import type { RetryPolicy } from "./seats.ts";
import { childEnv, ensureRunDir, mintRunId } from "./runs.ts";
import { getMcp } from "./mcp-load.ts";
import { createRetrySupervisor } from "./job-retry.ts";
import { classifyRetry } from "./retry.ts";

export interface HubToolOptions {
	allowedSeats?: string[];
	/** EV-39 — the one init-time RetryPolicy snapshot getter (Q1/D3: index.ts
	 * loads once; no other call site may exist). Null ⇒ retry disabled. */
	retryPolicy?: () => RetryPolicy | null;
}

/** EV-39 — cleanup exactly once across every chain end (clean settle,
 * exhaustion, cancel-during-backoff, dispose): the Hub's non-retry settle path
 * and the supervisor's dispose share this guard. */
function once(fn: () => void): () => void {
	let ran = false;
	return () => {
		if (ran) return;
		ran = true;
		fn();
	};
}

export function pidFilePath(repoRoot: string): string {
	return path.join(repoRoot, CONFIG_DIR_NAME, "council", ".pids.json");
}

let hubSingleton: Hub | null = null;
let hubOnChange: (() => void) | undefined;
let hubIdentity: { runId: string; parentJobPath?: string } | undefined;

export function initHubIdentity(runId: string, parentJobPath?: string): void {
	hubIdentity = { runId, parentJobPath };
}

export function getHub(repoRoot: string, onChange?: () => void): Hub {
	if (onChange) hubOnChange = onChange;
	if (!hubSingleton) {
		hubSingleton = new Hub({
			pidFile: pidFilePath(repoRoot),
			onChange: () => hubOnChange?.(),
			run: hubIdentity ? { repoRoot, runId: hubIdentity.runId, parentJobPath: hubIdentity.parentJobPath } : undefined,
		});
	}
	return hubSingleton;
}

export function shutdownHub(): void {
	hubSingleton?.shutdown();
	hubSingleton = null;
}

// EV-32: the segment lives in usage-format.ts (with the extracted
// formatTokensFragment/formatMoney fragments); imported + re-exported here so
// EV-28's landed import and byte test are untouched.
import { formatUsageSegment } from "./usage-format.ts";
import { formatRunnerUsageBlock, sumSubtreeUsage } from "./usage-block.ts";
export { formatUsageSegment };

export function formatReport(r: JobReport, attempts?: { n: number; max: number }): string {
	const mins = (r.elapsedMs / 60_000).toFixed(1);
	const stop = r.stopReason ? ` stopReason=${r.stopReason}` : "";
	// EV-39 — the attempts head fragment appears only when N > 1; a single-attempt
	// report is byte-identical to pre-EV-39 (G1).
	const retried = attempts !== undefined && attempts.n > 1;
	const attemptsFrag = retried ? ` attempts=${attempts.n}/${attempts.max}` : "";
	const identity = `[${r.id}] seat=${r.seat} state=${r.state}${stop} elapsed=${mins}m${attemptsFrag}`;
	// Suppression (EV-28 Q2): only the usage segment is omitted when no assistant
	// message was produced; the identity prefix survives in every terminal state.
	const suppressed = r.usage.turns === 0 && r.output === "";
	const head = suppressed ? identity : `${identity} ${formatUsageSegment(r.usage)}`;
	const body = r.output ? `\n--- output ---\n${r.output}` : "";
	const provErr = r.errorMessage ? `\n--- provider error ---\n${r.errorMessage}` : "";
	const emptyWarn =
		!r.output && r.state === "done"
			? `\n⚠ done but no text output (stopReason=${r.stopReason ?? "unknown"}). If stopReason=length, the model hit its output-token ceiling mid-thinking — this is a model-config problem, not a seat problem; surface it rather than re-dispatching blindly.`
			: "";
	const err =
		(r.state === "failed" || r.state === "stalled") && r.stderrTail ? `\n--- stderr tail ---\n${r.stderrTail}` : "";
	// EV-39 — exactly one sentence after the err clause when N > 1 (spec §2.7
	// table); the classifier is the verbatim retry.ts one (no second copy).
	const sentence = retried ? attemptsSentence(r, attempts.n, attempts.max) : "";
	return head + body + provErr + emptyWarn + err + sentence;
}

function attemptsSentence(r: JobReport, n: number, max: number): string {
	if (classifyRetry(r) === "retry" && n === max) {
		const tail = r.errorMessage ? `; last error: ${r.errorMessage}` : "";
		return `\nRetry budget exhausted after ${max} of ${max} attempts${tail}.`;
	}
	if (r.state === "failed") return `\nFailed on attempt ${n} of ${max}.`;
	return `\nSettled on attempt ${n} of ${max}.`;
}

/** EV-32 point 5 (PO C, steward I): append the runner-shaped usage block to
 * every settled job's report (done|failed|cancelled|stalled), built from
 * `sumSubtreeUsage` over the job's subtree (inclusive, every numeric metric).
 * The parent renders; the runner never self-computes (its session has no
 * marker — a null marker zeroes both halves). Running or timed-out jobs get
 * no block (not a conclusion); a settled job with no manifest (pre-EV-16)
 * renders state 1 — never blank. The EV-28 head-line segment is untouched. */
export function formatWaitReport(
	reports: JobReport[],
	manifests: RunManifest[],
	maxAttempts: number = DEFAULT_RETRY_POLICY.maxAttempts,
): string {
	const settled: ReadonlySet<JobState> = new Set(["done", "failed", "cancelled", "stalled"]);
	return reports
		.map((r) => {
			// EV-39 — the attempt count comes from the manifest (the renderers'
			// channel), the denominator from the injected policy snapshot (Q1).
			const n = manifests.find((m) => m.id === r.id)?.attempt ?? 1;
			const base = formatReport(r, { n, max: maxAttempts });
			if (!settled.has(r.state)) return base;
			const { subtree, jobCount } = sumSubtreeUsage(manifests, r.id);
			return `${base}\n\n${formatRunnerUsageBlock({ sessionId: r.id, jobCount, subtree })}`;
		})
		.join("\n\n====\n\n");
}

export function registerHubTools(pi: ExtensionAPI, repoRoot: string, opts: HubToolOptions = {}): void {
	pi.registerTool({
		name: "council_dispatch",
		label: "Council Dispatch",
		description:
			"Dispatch a Council seat as an isolated background job. Returns a job ID immediately. " +
			"Follow with council_wait to collect the result. Timeout default 15 min; raise it for long implementation or verification tasks. " +
			"timeout_minutes and stall_minutes are PER-ATTEMPT ceilings: a provider-errored attempt is retried with backoff up to the retry budget (default 3 attempts), so a fully-retried dispatch may run up to maxAttempts × the per-attempt budget.",
		parameters: Type.Object({
			seat: Type.String({ description: "Seat name (e.g. owner, skeptic) — packaged seats load automatically; a repo-local override in .pi/agents/ shadows the packaged seat" }),
			input: Type.String({ description: "The full task/deliberation input for the seat" }),
			timeout_minutes: Type.Optional(Type.Number({ description: "Ceiling in minutes (default 15)" })),
			stall_minutes: Type.Optional(
				Type.Number({ description: "No-activity window before auto-cancel (default 4)" }),
			),
			model: Type.Optional(Type.String({ description: "Override this dispatch's model (provider/id or provider/id:thinking). Wins over COUNCIL_EVAL_MODEL, .council.json, and frontmatter — nothing is written to disk." })),
			thinking: Type.Optional(Type.String({ description: "Override this dispatch's thinking level (off|minimal|low|medium|high|xhigh|max). Wins over the model's :thinking suffix." })),
			cellId: Type.Optional(Type.String({ description: "Eval cell id this dispatch belongs to — the harness passes it on grader dispatches; the verdict record carries it." })),
			mode: Type.Optional(Type.Union([
				Type.Literal("Deliberate"),
				Type.Literal("Verify"),
				Type.Literal("Direct"),
			], { description: "EV-68 — card execution mode, decided from the ledger; recorded on this dispatch's ROOT manifest. Omit for ordinary sub-dispatches — mode is never inherited." })),
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
			// EV-17 per-run model override: per-dispatch model/thinking param >
			// COUNCIL_EVAL_MODEL env > .council.json > frontmatter. Resolved AFTER
			// loadSeat and BEFORE the catalogue check; the effective (model,
			// thinking) is written back onto the seat so the check validates what
			// will actually spawn and the manifest/argv/child-env all agree.
			const envModel = process.env.COUNCIL_EVAL_MODEL;
			const effective = resolveEffectiveModel(seat, envModel, { model: params.model, thinking: params.thinking });
			const modelOverridden = envModel !== undefined || params.model !== undefined;
			const thinkOverridden =
				params.thinking !== undefined || (modelOverridden && effective.thinkingLevel !== seat.thinkingLevel);
			if (modelOverridden || thinkOverridden) {
				seat = { ...seat, model: effective.model, thinkingLevel: effective.thinkingLevel };
			}
			// Loud model check against the EFFECTIVE model: resolvable in the catalogue or fail now.
			const known = ctx.modelRegistry
				.getAvailable()
				.some((m: { provider: string; id: string }) => `${m.provider}/${m.id}` === seat.model);
			if (!known) {
				return {
					content: [
						{
							type: "text",
							text: `Seat "${seat.name}" resolved to model "${seat.model}", which is not in pi's catalogue. No fallback — fix the seat file, .council.json, COUNCIL_EVAL_MODEL, or the dispatch model param.`,
						},
					],
					details: {},
					isError: true,
				};
			}
			// --tools is an exact-name allowlist: enumerate granted MCP tools here.
			// Servers the parent could not connect contribute nothing → warn.
			const mcp = await getMcp();
			const mcpToolNames: string[] = [];
			const mcpWarnings: string[] = [];
			for (const server of seat.mcp ?? []) {
				const names = mcp.getMcpManager(repoRoot).listToolNames(server);
				if (names.length === 0) {
					mcpWarnings.push(
						`seat grants MCP server "${server}" but it is not connected — its tools are unavailable for this dispatch`,
					);
				}
				mcpToolNames.push(...names);
			}
			const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "council-"));
			const promptFile = path.join(tmpDir, "system.md");
			fs.writeFileSync(promptFile, buildSystemPrompt(repoRoot, seat, proceduresDir(repoRoot)), { mode: 0o600 });
			const hub = getHub(repoRoot);
			const jobId = hub.allocateId();
			const runId = hub.runId ?? mintRunId();
			const dir = ensureRunDir(repoRoot, runId);
			// The eval carrier rides this spawn's env — never the parent's
			// process.env — so it is ambient inside this subtree and invisible to
			// every non-eval dispatch and every sibling. childEnv propagates it to
			// descendants exactly like COUNCIL_RUN_ID/COUNCIL_JOB_ID. It encodes the
			// effective pair (provider/id or provider/id:thinking) only when an
			// override is in effect.
			const spawnEnv: Record<string, string | undefined> = { ...process.env, COUNCIL_SEAT: seat.name };
			if (modelOverridden || thinkOverridden) {
				spawnEnv.COUNCIL_EVAL_MODEL =
					thinkOverridden && effective.thinkingLevel !== undefined
						? `${effective.model}:${effective.thinkingLevel}`
						: effective.model;
			}
			// EV-39 — the once-guarded cleanup is shared by the Hub's non-retry
			// settle path and the supervisor's dispose, so the prompt tmpdir is
			// removed exactly once across every chain end.
			const onceCleanup = once(() => {
				try {
					fs.rmSync(tmpDir, { recursive: true, force: true });
				} catch {
					/* best effort */
				}
			});
			const timeoutMs = (params.timeout_minutes ?? 15) * 60_000;
			const stallMs = (params.stall_minutes ?? 4) * 60_000;
			const spawn: Parameters<typeof hub.spawnJob>[0] = {
				id: jobId,
				seat: seat.name,
				model: seat.model,
				command: "pi",
				args: buildChildArgv(seat, params.input, promptFile, mcpToolNames, { sessionDir: dir, sessionId: jobId }),
				cwd: repoRoot,
				env: childEnv(spawnEnv, runId, jobId),
				timeoutMs,
				stallMs,
				sessionId: jobId,
				cleanup: onceCleanup,
				mode: params.mode,
			};
			// EV-39 — arm the retry supervisor only when the injected policy wants
			// more than one attempt. The supervisor owns the chain: on a retryable
			// settle it re-spawns `${jobId}-attempt${n}` after computeBackoffDelay,
			// reusing the dispatch-time argv shape (fresh session id, same prompt
			// file and MCP allowlist — EV-42 owns per-attempt provenance).
			const policy = opts.retryPolicy?.() ?? null;
			if (policy?.enabled && policy.maxAttempts > 1) {
				spawn.retry = createRetrySupervisor({
					hub,
					jobId,
					policy,
					cleanup: onceCleanup,
					attemptSpec: (n) => {
						const sessionId = `${jobId}-attempt${n}`;
						return {
							args: buildChildArgv(seat, params.input, promptFile, mcpToolNames, { sessionDir: dir, sessionId }),
							env: childEnv(spawnEnv, runId, jobId),
							cwd: repoRoot,
							sessionId,
							timeoutMs,
							stallMs,
						};
					},
				});
			}
			const job = hub.spawnJob(spawn);
			return {
				content: [
					{
						type: "text",
						text:
							`Dispatched ${seat.name} as ${job.id} (pid ${job.pid}). Use council_wait to collect.` +
							(mcpWarnings.length > 0 ? `\n⚠ ${mcpWarnings.join("\n⚠ ")}` : ""),
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
			"(done|failed|cancelled|stalled|timeout|retrying|running) and output. Does NOT cancel on timeout — that is your explicit move.",
		parameters: Type.Object({
			job_ids: Type.Array(Type.String(), { description: "Job IDs from council_dispatch" }),
			timeout_minutes: Type.Number({ description: "How long to wait before returning" }),
		}),
		async execute(_id, params, signal) {
			const hub = getHub(repoRoot);
			const reports = await hub.wait(params.job_ids, params.timeout_minutes * 60_000, signal);
			// EV-32 point 5: each settled report carries its runner usage block,
			// rendered parent-side from the run dir's manifests.
			const manifests = readManifests(repoRoot, hub.runId ?? "");
			// EV-39 — the retry denominator comes from the injected snapshot (Q1);
			// never a config read in a tool path (D3/O-8).
			const maxAttempts = opts.retryPolicy?.()?.maxAttempts ?? DEFAULT_RETRY_POLICY.maxAttempts;
			return {
				content: [{ type: "text", text: formatWaitReport(reports, manifests, maxAttempts) }],
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
