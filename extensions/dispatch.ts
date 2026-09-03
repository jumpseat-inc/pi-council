/**
 * EV-20 §4 — the shared dispatch primitive, parameterized by `cwd`.
 *
 * Extracted from `council_dispatch`'s `execute()` body so the eval runner can
 * spawn cell drivers with `cwd = scratch` (in-process, same hub — keeps the
 * parentJobId chain + shared COUNCIL_RUN_ID) without forking the override
 * path into a second implementation. The load-bearing override-resolution
 * logic is `resolveEffectiveModel` from `./seats.ts` — the SAME function
 * `council_dispatch` uses — so there is exactly one model-override path
 * (EV-16 §4). `hub-tools.ts` is left untouched.
 */
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import type { Hub } from "./hub.ts";
import { getMcpManager } from "./mcp/index.ts";
import { childEnv, ensureRunDir, mintRunId } from "./runs.ts";
import { buildChildArgv, buildSystemPrompt, proceduresDir, resolveEffectiveModel, type Seat } from "./seats.ts";

export interface SpawnSeatJobOpts {
	repoRoot: string;
	hub: Hub;
	/** post-loadSeat (repo override already applied) seat. */
	seat: Seat;
	input: string;
	/** Cell drivers run with cwd = scratch; plain dispatch uses repoRoot. */
	cwd: string;
	timeoutMs: number;
	stallMs: number;
	/** per-dispatch override (beats COUNCIL_EVAL_MODEL env). */
	model?: string;
	thinking?: string;
	/** The eval cell id this dispatch belongs to (grader linkage; not used for spawn env). */
	cellId?: string;
	/** Catalogue probe — true when the effective model is usable. */
	isModelAvailable: (model: string) => boolean;
}

export interface SpawnedSeat {
	jobId: string;
	seat: string;
	model: string;
	warnings: string[];
}

/**
 * Override resolution → catalogue check → spawn-env → buildChildArgv →
 * childEnv → hub.spawnJob({ cwd }). Mirrors council_dispatch's execute() so
 * the eval path and the tool path agree on precedence and effective model.
 * Throws on an unresolvable effective model (the runner surfaces it as a
 * failed repeat), never falls back silently.
 */
export function spawnSeatJob(opts: SpawnSeatJobOpts): SpawnedSeat {
	const { repoRoot, hub, seat, input, cwd } = opts;
	const envModel = process.env.COUNCIL_EVAL_MODEL;
	const effective = resolveEffectiveModel(seat, envModel, { model: opts.model, thinking: opts.thinking });
	const modelOverridden = envModel !== undefined || opts.model !== undefined;
	const thinkOverridden =
		opts.thinking !== undefined || (modelOverridden && effective.thinkingLevel !== seat.thinkingLevel);
	let eff = seat;
	if (modelOverridden || thinkOverridden) {
		eff = { ...seat, model: effective.model, thinkingLevel: effective.thinkingLevel };
	}
	if (!opts.isModelAvailable(eff.model)) {
		throw new Error(
			`Seat "${seat.name}" resolved to model "${eff.model}", which is not in pi's catalogue. No fallback — fix the seat file, .council.json, COUNCIL_EVAL_MODEL, or the dispatch model param.`,
		);
	}

	// --tools is an exact-name allowlist: enumerate granted MCP tools here.
	const mcpToolNames: string[] = [];
	const mcpWarnings: string[] = [];
	for (const server of seat.mcp ?? []) {
		const names = getMcpManager(repoRoot).listToolNames(server);
		if (names.length === 0) {
			mcpWarnings.push(
				`seat grants MCP server "${server}" but it is not connected — its tools are unavailable for this dispatch`,
			);
		}
		mcpToolNames.push(...names);
	}

	const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "council-"));
	const promptFile = path.join(tmpDir, "system.md");
	fs.writeFileSync(promptFile, buildSystemPrompt(repoRoot, eff, proceduresDir(repoRoot)), { mode: 0o600 });

	const jobId = hub.allocateId();
	const runId = hub.runId ?? mintRunId();
	const dir = ensureRunDir(repoRoot, runId);

	// The eval carrier rides this spawn's env — never the parent's process.env —
	// so it is ambient inside this subtree and invisible to every non-eval
	// dispatch and every sibling. childEnv propagates it to descendants.
	const spawnEnv: Record<string, string | undefined> = { ...process.env, COUNCIL_SEAT: eff.name };
	if (modelOverridden || thinkOverridden) {
		spawnEnv.COUNCIL_EVAL_MODEL =
			thinkOverridden && effective.thinkingLevel !== undefined
				? `${effective.model}:${effective.thinkingLevel}`
				: effective.model;
	}

	const job = hub.spawnJob({
		id: jobId,
		seat: eff.name,
		model: eff.model,
		command: "pi",
		args: buildChildArgv(eff, input, promptFile, mcpToolNames, { sessionDir: dir, sessionId: jobId }),
		cwd,
		env: childEnv(spawnEnv, runId, jobId),
		timeoutMs: opts.timeoutMs,
		stallMs: opts.stallMs,
		cleanup: () => {
			try {
				fs.rmSync(tmpDir, { recursive: true, force: true });
			} catch {
				/* best effort */
			}
		},
	});
	return { jobId: job.id, seat: job.seat, model: job.model ?? eff.model, warnings: mcpWarnings };
}
