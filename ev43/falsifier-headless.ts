// EV-43 headless falsifier runner (`bun ev43/falsifier-headless.ts`).
//
// Drives the real installed pi CLI (`node <pkg>/dist/cli.js -p ...`) twice per
// arm set — treatment (agent_settled handler enabled) and control (same
// provider, handler disabled) — in scratch HOMEs with explicitly constructed
// envs (PATH + scratch HOME + the falsifier's own vars; nothing inherited —
// the FLLWUP-21 env-split lesson). Offline via --offline and the faux
// provider (no network, no credentials).
//
// Verdict per arm: the stdout line (-p prints the LAST assistant message's
// text), the exit code, and the session JSONL message sequence. The
// per-branch observable the card names for headless is the stdout line.
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, sep } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const EXTENSION = join(REPO_ROOT, "ev43", "ev43-falsifier-extension.ts");

const ENTRY_URL = import.meta.resolve("@earendil-works/pi-coding-agent");
const ENTRY_PATH = fileURLToPath(ENTRY_URL);
if (!ENTRY_PATH.endsWith(`${sep}dist${sep}index.js`)) {
	throw new Error(`EV-43: package entry resolved to unexpected path ${ENTRY_PATH}`);
}
const PKG_ROOT = dirname(dirname(ENTRY_PATH));
const CLI_PATH = join(PKG_ROOT, "dist", "cli.js");
if (!existsSync(CLI_PATH)) {
	throw new Error(`EV-43: installed pi CLI missing at ${CLI_PATH}`);
}

function resolveNode(): string {
	const pathValue = process.env.PATH ?? "";
	for (const dir of pathValue.split(":")) {
		if (!dir) continue;
		const candidate = join(dir, "node");
		if (existsSync(candidate)) return candidate;
	}
	throw new Error("EV-43: no `node` executable found on PATH");
}

interface ArmResult {
	arm: "treatment" | "control";
	exitCode: number | null;
	stdout: string;
	stderr: string;
	settleLog: string;
	assistantSequence: string[];
	userSequence: string[];
	sessionPath?: string;
}

export type { ArmResult };

function runArm(arm: "treatment" | "control", scratchRoot: string): ArmResult {
	const workDir = mkdtempSync(join(scratchRoot, `ev43-${arm}-cwd-`));
	const home = mkdtempSync(join(scratchRoot, `ev43-${arm}-home-`));
	mkdirSync(join(home, ".pi", "agent"), { recursive: true });
	writeFileSync(join(home, ".pi", "agent", "settings.json"), JSON.stringify({ defaultProjectTrust: "always" }, null, 2));
	const sessionsDir = join(scratchRoot, `${arm}-sessions`);
	mkdirSync(sessionsDir, { recursive: true });
	const settleLog = join(scratchRoot, `${arm}-settle.log`);

	const env: Record<string, string> = {
		PATH: process.env.PATH ?? "/usr/bin:/bin",
		HOME: home,
		TERM: "xterm-256color",
		// falsifier-only extras; nothing else inherited (FLLWUP-21 lesson)
		EV43_HANDLER: arm === "treatment" ? "1" : "0",
		EV43_BRANCH: "headless",
		EV43_LOG: settleLog,
	};

	const result = spawnSync(
		resolveNode(),
		[
			CLI_PATH,
			"-p",
			"start",
			"-e",
			EXTENSION,
			"--offline",
			"--provider",
			"ev43",
			"--model",
			"ev43/ev43-model",
			"--session-dir",
			sessionsDir,
			"--no-builtin-tools",
		],
		{ cwd: workDir, env, encoding: "utf-8", timeout: 120_000 },
	);

	// Inspect the persisted session JSONL for the message sequence.
	const assistantSequence: string[] = [];
	const userSequence: string[] = [];
	let sessionPath: string | undefined;
	try {
		const files = readdirSync(sessionsDir).filter((f) => f.endsWith(".jsonl"));
		// sessions live under a cwd-named subdir of --session-dir
		for (const f of files) {
			const full = join(sessionsDir, f);
			const statOk = existsSync(full);
			if (statOk) sessionPath = full;
		}
		if (!sessionPath) {
			for (const dir of readdirSync(sessionsDir)) {
				const sub = join(sessionsDir, dir);
				const subFiles = readdirSync(sub).filter((f) => f.endsWith(".jsonl"));
				if (subFiles.length > 0) sessionPath = join(sub, subFiles[0]);
			}
		}
		if (sessionPath) {
			for (const line of readFileSync(sessionPath, "utf-8").split("\n")) {
				if (!line.trim()) continue;
				let entry: any;
				try {
					entry = JSON.parse(line);
				} catch {
					continue;
				}
				const msg = entry.message ?? entry;
				if (msg?.role === "assistant") {
					const text = Array.isArray(msg.content)
						? msg.content.filter((c: any) => c.type === "text").map((c: any) => c.text).join("")
						: "";
					assistantSequence.push(
						`assistant stopReason=${msg.stopReason} error=${JSON.stringify(msg.errorMessage ?? null)} text=${JSON.stringify(text)}`,
					);
				} else if (msg?.role === "user") {
					const text = Array.isArray(msg.content)
						? msg.content.filter((c: any) => c.type === "text").map((c: any) => c.text).join("")
						: "";
					userSequence.push(`user ${JSON.stringify(text)}`);
				}
			}
		}
	} catch (e) {
		console.error(`session inspection failed: ${String(e)}`);
	}

	return {
		arm,
		exitCode: result.status,
		stdout: result.stdout ?? "",
		stderr: result.stderr ?? "",
		settleLog: existsSync(settleLog) ? readFileSync(settleLog, "utf-8") : "(no settle log)",
		assistantSequence,
		userSequence,
		sessionPath,
	};
}

export function runHeadlessArms(scratchRoot: string): { treatment: ArmResult; control: ArmResult } {
	const treatment = runArm("treatment", scratchRoot);
	const control = runArm("control", scratchRoot);
	return { treatment, control };
}

export function secondMessagePresent(arm: ArmResult): boolean {
	return arm.assistantSequence.some((a) => a.includes("EV43-SECOND-RESPONSE"));
}

function main(): void {
	const scratchRoot = mkdtempSync(join(tmpdir(), "ev43-falsifier-"));
	console.log(`EV-43 falsifier headless run — scratch root ${scratchRoot}`);
	console.log(`extension: ${EXTENSION}`);
	console.log(`cli: ${CLI_PATH}`);
	console.log("");
	const { treatment, control } = runHeadlessArms(scratchRoot);

	for (const arm of [treatment, control]) {
		console.log(`===== ARM ${arm.arm.toUpperCase()} =====`);
		console.log(`exit=${arm.exitCode}`);
		console.log(`--- stdout ---\n${arm.stdout || "(empty)"}`);
		console.log(`--- stderr ---\n${arm.stderr || "(empty)"}`);
		console.log(`--- settle log ---\n${arm.settleLog}`);
		console.log(`--- session (${arm.sessionPath ?? "none"}) ---`);
		for (const u of arm.userSequence) console.log(`  ${u}`);
		for (const a of arm.assistantSequence) console.log(`  ${a}`);
		console.log("");
	}

	const treatSecond = secondMessagePresent(treatment);
	const controlSecond = secondMessagePresent(control);
	console.log("===== VERDICT (headless -p) =====");
	console.log(
		`EV43-HEADLESS: second assistant message ${treatSecond ? "PRESENT" : "ABSENT"} in treatment; ${
			controlSecond ? "PRESENT" : "ABSENT"
		} in control; attributable-to-handler=${treatSecond && !controlSecond}`,
	);
	rmSync(scratchRoot, { recursive: true, force: true });
}

if (import.meta.main) {
	main();
}
