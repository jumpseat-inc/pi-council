// EV-40 harness runner — drives the REAL installed pi CLI headless
// (`node <pkg>/dist/cli.js -p ...`) in a scratch HOME with an explicitly
// constructed env (PATH + scratch HOME + harness vars only — never ambient
// config, the FLLWUP-21 env-split lesson). Offline via --offline and the faux
// provider (no network, no credentials).
//
// Generalizes ev43/falsifier-headless.ts. Verdict per arm: exit code, stdout,
// the session JSONL message sequence, and the harness telemetry logs
// (settle / context-shapes / payload).
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, sep } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
export const HARNESS_EXTENSION = join(REPO_ROOT, "test", "ev40-harness", "ev40-harness-extension.ts");
export const COUNCIL_EXTENSION = join(REPO_ROOT, "extensions", "index.ts");

const ENTRY_URL = import.meta.resolve("@earendil-works/pi-coding-agent");
const ENTRY_PATH = fileURLToPath(ENTRY_URL);
if (!ENTRY_PATH.endsWith(`${sep}dist${sep}index.js`)) {
	throw new Error(`EV-40: package entry resolved to unexpected path ${ENTRY_PATH}`);
}
const PKG_ROOT = dirname(dirname(ENTRY_PATH));
export const CLI_PATH = join(PKG_ROOT, "dist", "cli.js");
if (!existsSync(CLI_PATH)) {
	throw new Error(`EV-40: installed pi CLI missing at ${CLI_PATH}`);
}

export function resolveNode(): string {
	const pathValue = process.env.PATH ?? "";
	for (const dir of pathValue.split(":")) {
		if (!dir) continue;
		const candidate = join(dir, "node");
		if (existsSync(candidate)) return candidate;
	}
	throw new Error("EV-40: no `node` executable found on PATH");
}

export interface ArmResult {
	label: string;
	exitCode: number | null;
	signal: NodeJS.Signals | null;
	stdout: string;
	stderr: string;
	settleLog: string;
	contextLog: string;
	payloadLog: string;
	/** The arm's scratch HOME (usage-store reads, D4) and cwd. */
	home: string;
	workDir: string;
	/** Per-message sequence from the produced session JSONL. */
	sequence: string[];
	sessionPath?: string;
}

export interface ArmOptions {
	label: string;
	/** Leading faux calls that fail with the with-colon literal. */
	fails: number;
	arm: "inside" | "timer" | "none";
	partial?: boolean;
	prompt?: string;
	modelId?: string;
	filter?: boolean;
	contextLog?: boolean;
	payloadLog?: boolean;
	/** Load the council extension alongside the harness (engine runs). */
	councilExtension?: boolean;
	timeoutMs?: number;
}

/** Parsed session JSONL entry (message subset the harness asserts on). */
export interface ParsedEntry {
	role: string;
	stopReason: string | null;
	errorMessage: string | null;
	text: string;
}

export function parseSessionEntries(sessionPath: string): ParsedEntry[] {
	const out: ParsedEntry[] = [];
	for (const line of readFileSync(sessionPath, "utf-8").split("\n")) {
		if (!line.trim()) continue;
		let entry: any;
		try {
			entry = JSON.parse(line);
		} catch {
			continue;
		}
		const msg = entry.message ?? entry;
		if (!msg || typeof msg !== "object") continue;
		if (msg.role !== "assistant" && msg.role !== "user") continue;
		const text = Array.isArray(msg.content)
			? msg.content.filter((c: any) => c.type === "text").map((c: any) => c.text).join("")
			: "";
		out.push({
			role: msg.role,
			stopReason: msg.stopReason ?? null,
			errorMessage: msg.errorMessage ?? null,
			text,
		});
	}
	return out;
}

export function findSessionJsonl(sessionsDir: string): string | undefined {
	const walk = (dir: string): string | undefined => {
		let entries: string[];
		try {
			entries = readdirSync(dir);
		} catch {
			return undefined;
		}
		const files = entries.filter((f) => f.endsWith(".jsonl")).sort();
		if (files.length > 0) return join(dir, files[files.length - 1]!);
		for (const e of entries) {
			const found = walk(join(dir, e));
			if (found) return found;
		}
		return undefined;
	};
	return walk(sessionsDir);
}

const harnessEnv = (opts: ArmOptions, home: string, contextLog: string, payloadLog: string, settleLog: string): Record<string, string> => ({
	PATH: process.env.PATH ?? "/usr/bin:/bin",
	HOME: home,
	TERM: "xterm-256color",
	// harness-only extras; nothing else inherited (FLLWUP-21 env-split lesson)
	EV40_FAILS: String(opts.fails),
	EV40_ARM: opts.arm,
	EV40_PARTIAL: opts.partial ? "1" : "0",
	EV40_SETTLE_LOG: settleLog,
	...(opts.modelId ? { EV40_MODEL_ID: opts.modelId } : {}),
	...(opts.filter ? { EV40_FILTER: "1" } : {}),
	...(opts.contextLog ? { EV40_CONTEXT_LOG: contextLog } : {}),
	...(opts.payloadLog ? { EV40_PAYLOAD_LOG: payloadLog } : {}),
});

/** Extra scratch-repo files the engine runs need (retry policy + a marker-
 * stamping procedure). Written into `workDir` when `engineRepo` is set. */
function writeEngineRepoFiles(workDir: string, retryPolicy: unknown, procedureBody: string): void {
	writeFileSync(join(workDir, ".council.json"), JSON.stringify(retryPolicy, null, 2));
	mkdirSync(join(workDir, ".pi", "council", "procedures"), { recursive: true });
	writeFileSync(
		join(workDir, ".pi", "council", "procedures", "ev40-probe.md"),
		`---\ndescription: EV-40 engine probe — stamps an invocation marker and sends the probe turn\n---\n${procedureBody}\n`,
	);
}

export interface EngineRepoOptions {
	retryPolicy: unknown;
	procedureBody: string;
}

/** The scratch substrate of one arm (dirs, env, argv). Shared by the sync and
 * the signal-capable runners so both drive byte-identical CLI invocations. */
export interface PreparedArm {
	workDir: string;
	home: string;
	sessionsDir: string;
	settleLog: string;
	contextLog: string;
	payloadLog: string;
	env: Record<string, string>;
	args: string[];
}

export function prepareHarnessArm(
	opts: ArmOptions,
	scratchRoot: string,
	engineRepo?: EngineRepoOptions,
): PreparedArm {
	const workDir = mkdtempSync(join(scratchRoot, `ev40-${opts.label}-cwd-`));
	const home = mkdtempSync(join(scratchRoot, `ev40-${opts.label}-home-`));
	mkdirSync(join(home, ".pi", "agent"), { recursive: true });
	writeFileSync(
		join(home, ".pi", "agent", "settings.json"),
		JSON.stringify({ defaultProjectTrust: "always" }, null, 2),
	);
	const sessionsDir = join(scratchRoot, `${opts.label}-sessions`);
	mkdirSync(sessionsDir, { recursive: true });
	const settleLog = join(scratchRoot, `${opts.label}-settle.log`);
	const contextLog = join(scratchRoot, `${opts.label}-context.log`);
	const payloadLog = join(scratchRoot, `${opts.label}-payload.log`);
	if (engineRepo) writeEngineRepoFiles(workDir, engineRepo.retryPolicy, engineRepo.procedureBody);

	const env = harnessEnv(opts, home, contextLog, payloadLog, settleLog);

	const args = [
		CLI_PATH,
		"-p",
		opts.prompt ?? "start",
		"-e",
		HARNESS_EXTENSION,
		...(opts.councilExtension ? ["-e", COUNCIL_EXTENSION] : []),
		"--offline",
		"--provider",
		"ev40",
		"--model",
		`ev40/${opts.modelId ?? "ev40-model"}`,
		"--session-dir",
		sessionsDir,
		"--no-builtin-tools",
	];
	return { workDir, home, sessionsDir, settleLog, contextLog, payloadLog, env, args };
}

/** Finalize an arm from its raw process outcome + scratch substrate. */
function finalizeArm(
	prepared: PreparedArm,
	label: string,
	exitCode: number | null,
	signal: NodeJS.Signals | null,
	stdout: string,
	stderr: string,
): ArmResult {
	const sessionPath = findSessionJsonl(prepared.sessionsDir);
	const sequence: string[] = [];
	if (sessionPath) {
		for (const e of parseSessionEntries(sessionPath)) {
			sequence.push(
				`${e.role} stop=${e.stopReason} err=${JSON.stringify(e.errorMessage)} text=${JSON.stringify(e.text.length > 120 ? `${e.text.slice(0, 120)}…` : e.text)}`,
			);
		}
	}
	const read = (f: string): string => (existsSync(f) ? readFileSync(f, "utf-8") : "");
	return {
		label,
		exitCode,
		signal,
		stdout,
		stderr,
		settleLog: read(prepared.settleLog),
		contextLog: read(prepared.contextLog),
		payloadLog: read(prepared.payloadLog),
		home: prepared.home,
		workDir: prepared.workDir,
		sequence,
		sessionPath,
	};
}

/** Run one arm of the harness. Synchronous (spawnSync) — the CLI child is
 * offline and bounded by `timeoutMs`. */
export function runHarnessArm(opts: ArmOptions, scratchRoot: string, engineRepo?: EngineRepoOptions): ArmResult {
	const prepared = prepareHarnessArm(opts, scratchRoot, engineRepo);
	const result = spawnSync(resolveNode(), prepared.args, {
		cwd: prepared.workDir,
		env: prepared.env,
		encoding: "utf-8",
		timeout: opts.timeoutMs ?? 120_000,
	});
	return finalizeArm(
		prepared,
		opts.label,
		result.status,
		result.signal ?? null,
		result.stdout ?? "",
		result.stderr ?? "",
	);
}

/** Run one arm asynchronously, signalling the child (SIGINT) once a stdout
 * trigger line appears — the T-H1 shape (a signal mid-backoff, which a
 * synchronous spawnSync cannot express).
 *
 * Stream routing (fix cycle 1, probed): pi's print mode calls
 * `takeOverStdout()`, which reassigns `process.stdout.write` to `stderr.write`,
 * so an extension's `console.log` / `process.stdout.write` land on the child's
 * STDERR while `fs.writeSync(1, …)` reaches the REAL stdout. The engine prints
 * its countdown/terminal lines via `fs.writeSync(1, …)` (they are on stdout);
 * the trigger still scans BOTH streams by default (`stream: "either"`) so it
 * fires wherever a given line is routed. */
export interface SigintOptions {
	/** Send the signal after a chunk containing this substring. */
	trigger: string;
	/** Grace after the trigger line before signalling (default 250 ms). */
	graceMs?: number;
	/** Hard ceiling for the whole arm (default opts.timeoutMs / 120 s). */
	timeoutMs?: number;
	/** The signal to send (default SIGINT). */
	signal?: NodeJS.Signals;
	/** Which stream to scan for the trigger (default "either"). */
	stream?: "stdout" | "stderr" | "either";
}

export interface SigintArmResult extends ArmResult {
	/** ms between the trigger line appearing and the signal being sent. */
	triggerToSignalMs: number | null;
	triggered: boolean;
}

export async function runHarnessArmSigint(
	opts: ArmOptions,
	scratchRoot: string,
	engineRepo: EngineRepoOptions | undefined,
	sigint: SigintOptions,
): Promise<SigintArmResult> {
	const prepared = prepareHarnessArm(opts, scratchRoot, engineRepo);
	const child = spawn(resolveNode(), prepared.args, {
		cwd: prepared.workDir,
		env: prepared.env,
		stdio: ["ignore", "pipe", "pipe"],
	});
	let stdout = "";
	let stderr = "";
	let triggered = false;
	let triggerToSignalMs: number | null = null;
	let signalTimer: ReturnType<typeof setTimeout> | null = null;
	const ceiling = sigint.timeoutMs ?? opts.timeoutMs ?? 120_000;
	let timedOut = false;
	const deadline = setTimeout(() => {
		timedOut = true;
		child.kill("SIGKILL");
	}, ceiling);
	deadline.unref?.();

	const maybeTrigger = (): void => {
		if (triggered) return;
		const stream = sigint.stream ?? "either";
		const haystack = stream === "stdout" ? stdout : stream === "stderr" ? stderr : `${stdout}\n${stderr}`;
		if (!haystack.includes(sigint.trigger)) return;
		triggered = true;
		const at = Date.now();
		signalTimer = setTimeout(() => {
			triggerToSignalMs = Date.now() - at;
			try {
				child.kill(sigint.signal ?? "SIGINT");
			} catch {
				// already gone
			}
		}, sigint.graceMs ?? 250);
	};

	child.stdout.on("data", (chunk: Buffer) => {
		stdout += chunk.toString("utf-8");
		maybeTrigger();
	});
	child.stderr.on("data", (chunk: Buffer) => {
		stderr += chunk.toString("utf-8");
		maybeTrigger();
	});

	const { code, signal } = await new Promise<{ code: number | null; signal: NodeJS.Signals | null }>((resolve) => {
		child.on("close", (code, signal) => resolve({ code, signal }));
	});
	clearTimeout(deadline);
	if (signalTimer) clearTimeout(signalTimer);
	if (timedOut) stderr += `\n[harness] arm exceeded ${ceiling} ms and was SIGKILLed`;

	return {
		...finalizeArm(prepared, opts.label, code, signal, stdout, stderr),
		triggered,
		triggerToSignalMs,
	};
}

/** Every session JSONL line parses (T-H1 "well-formed session JSONL"). */
export function sessionJsonlWellFormed(sessionPath: string | undefined): boolean {
	if (!sessionPath || !existsSync(sessionPath)) return false;
	const lines = readFileSync(sessionPath, "utf-8").split("\n").filter((l) => l.trim().length > 0);
	if (lines.length === 0) return false;
	for (const line of lines) {
		try {
			JSON.parse(line);
		} catch {
			return false;
		}
	}
	return true;
}

/** The distinctive marker of a successful post-continuation assistant turn. */
export function secondMessagePresent(arm: ArmResult): boolean {
	return arm.sequence.some((s) => s.includes("EV40-SECOND-RESPONSE"));
}

export function hasUserMessage(arm: ArmResult, needle: string): boolean {
	return arm.sequence.some((s) => s.startsWith("user ") && s.includes(needle));
}

export function failedAssistantCount(arm: ArmResult): number {
	return arm.sequence.filter((s) => s.startsWith("assistant stop=error")).length;
}

/** Count usage records (README excluded) in a scratch agent dir's usage store. */
export function countUsageRecords(home: string): number {
	const dir = join(home, ".pi", "agent", "council", "usage");
	if (!existsSync(dir)) return 0;
	return readdirSync(dir).filter((f) => f.endsWith(".json")).length;
}

/** Parsed context-shape log: one request per `context request` line with the
 * following indented shape lines. */
export function parseContextLog(raw: string): Array<{ request: number; messages: string[] }> {
	const out: Array<{ request: number; messages: string[] }> = [];
	let current: { request: number; messages: string[] } | null = null;
	for (const line of raw.split("\n")) {
		const m = line.match(/context request call=(\d+) messages=(\d+)/);
		if (m) {
			current = { request: Number(m[1]), messages: [] };
			out.push(current);
			continue;
		}
		if (current && line.startsWith("  ")) current.messages.push(line.slice(2));
	}
	return out;
}
