// EV-40 harness runner — drives the REAL installed pi CLI headless
// (`node <pkg>/dist/cli.js -p ...`) in a scratch HOME with an explicitly
// constructed env (PATH + scratch HOME + harness vars only — never ambient
// config, the FLLWUP-21 env-split lesson). Offline via --offline and the faux
// provider (no network, no credentials).
//
// Generalizes ev43/falsifier-headless.ts. Verdict per arm: exit code, stdout,
// the session JSONL message sequence, and the harness telemetry logs
// (settle / context-shapes / payload).
import { spawnSync } from "node:child_process";
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

/** Run one arm of the harness. Synchronous (spawnSync) — the CLI child is
 * offline and bounded by `timeoutMs`. */
export function runHarnessArm(opts: ArmOptions, scratchRoot: string, engineRepo?: EngineRepoOptions): ArmResult {
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

	const result = spawnSync(resolveNode(), args, {
		cwd: workDir,
		env,
		encoding: "utf-8",
		timeout: opts.timeoutMs ?? 120_000,
	});

	const sessionPath = findSessionJsonl(sessionsDir);
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
		label: opts.label,
		exitCode: result.status,
		signal: result.signal ?? null,
		stdout: result.stdout ?? "",
		stderr: result.stderr ?? "",
		settleLog: read(settleLog),
		contextLog: read(contextLog),
		payloadLog: read(payloadLog),
		home,
		workDir,
		sequence,
		sessionPath,
	};
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
