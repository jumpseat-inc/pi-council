// FLLWUP-21 — two-pole env-split registration contract (spec §3).
//
// This suite asserts the env-keyed parent/child mode split contract at
// `extensions/index.ts:117-121` (const seatName = process.env.COUNCIL_SEAT;
// if (seatName) { runChildMode(...); return; }): pole A — a clean env with no
// council configuration registers all 14 parent-mode slash commands; pole B —
// the same env with COUNCIL_SEAT set registers zero slash commands (the red
// reproduction, version-independent). Every subprocess receives an explicitly
// constructed env built from scratch (PATH + scratch HOME + optional
// COUNCIL_SEAT only); nothing is inherited from the runner, so the suite is
// immune by construction to seat-session contamination (the runner's own
// session carries COUNCIL_SEAT/OPENROUTER_API_KEY/COUNCIL_JOB_ID/... — all
// dropped, not scrubbed-then-forwarded — the FLLWUP-14 probe-contamination
// lesson applied structurally). The full root-cause narrative lives in
// docs/superpowers/plans/2026-09-05-FLLWUP-21-plan.md, not here.
import { afterAll, describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, sep } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = process.cwd();
const DRIVER = join(REPO_ROOT, "test", "fixtures", "env-split-driver.ts");

// The installed pi under test: the devDependency-resolved package in this
// repo's node_modules (the same version the lock delivers). Resolve the
// package entry, walk to the package root, and fail loudly if unresolvable.
const ENTRY_URL = import.meta.resolve("@earendil-works/pi-coding-agent");
const ENTRY_PATH = fileURLToPath(ENTRY_URL);
if (!ENTRY_PATH.endsWith(`${sep}dist${sep}index.js`)) {
	throw new Error(
		`FLLWUP-21: package entry resolved to unexpected path ${ENTRY_PATH} — cannot locate the installed pi package root`,
	);
}
const PKG_ROOT = dirname(dirname(ENTRY_PATH));
const CLI_PATH = join(PKG_ROOT, "dist", "cli.js");
if (!existsSync(CLI_PATH)) {
	throw new Error(`FLLWUP-21: installed pi CLI missing at ${CLI_PATH} — is the devDependency installed?`);
}

// node interpreter for the real-binary spawns (the CLI's shebang is
// #!/usr/bin/env node). Resolved from the TEST's own PATH — the child envs
// contain only a bare PATH, so nothing but `node` is ever PATH-resolved.
function resolveNode(): string {
	const pathValue = process.env.PATH ?? "";
	for (const dir of pathValue.split(":")) {
		if (!dir) continue;
		const candidate = join(dir, "node");
		if (existsSync(candidate)) return candidate;
	}
	throw new Error(
		"FLLWUP-21: no `node` executable found on PATH — the pi CLI must run under node",
	);
}
const NODE = resolveNode();

// Explicit-env construction: PATH + fresh scratch HOME + extra vars ONLY.
// Every parent-process variable (OPENROUTER_API_KEY, provider keys,
// COUNCIL_JOB_ID, COUNCIL_RUN_ID, PI_SESSION_FILE, PI_PROVIDER, ...) is
// dropped, never forwarded — the core contamination immunity of this suite.
function explicitEnv(home: string, extra: Record<string, string> = {}): Record<string, string> {
	return { PATH: process.env.PATH ?? "", HOME: home, NO_COLOR: "1", ...extra };
}

const scratchDirs: string[] = [];
function makeScratch(): string {
	const dir = mkdtempSync(join(tmpdir(), "fllwup21-"));
	scratchDirs.push(dir);
	return dir;
}

/** Run the driver fixture; returns the parsed JSON line from stdout. */
function runDriver(env: Record<string, string>): { commands?: number; error?: string } {
	const res = spawnSync(process.execPath, [DRIVER], {
		cwd: REPO_ROOT,
		env: { ...env, FLLWUP21_REPO_ROOT: REPO_ROOT },
		encoding: "utf8",
		timeout: 60_000,
	});
	if (res.error) throw res.error;
	const lines = (res.stdout ?? "").trim().split("\n").filter(Boolean);
	if (lines.length === 0) {
		throw new Error(`FLLWUP-21: driver produced no stdout. stderr: ${res.stderr}`);
	}
	try {
		return JSON.parse(lines[lines.length - 1]) as { commands?: number; error?: string };
	} catch {
		throw new Error(`FLLWUP-21: driver stdout was not JSON: ${lines[lines.length - 1]}`);
	}
}

/** Write a scratch consumer (pi install -l shape) pinning the repo root locally. */
function makeConsumer(scratch: string): string {
	const consumer = join(scratch, "consumer");
	mkdirSync(join(consumer, ".pi"), { recursive: true });
	writeFileSync(
		join(consumer, "package.json"),
		JSON.stringify({ name: "fllwup21-consumer", private: true }, null, "\t"),
	);
	// The exact shape `pi install -l <repo>` writes into `<cwd>/.pi/settings.json`
	// (package-manager-cli.js: "-l, --local  Install project-locally
	// ($CONFIG_DIR_NAME/settings.json)"; parseSource classifies a bare absolute
	// path as a local package). A local pin means no git clone and no npm
	// install — the spawn is fully offline. This is the smoke harness's own
	// headless-tripwire shape; see the plan doc for why cwd = the repo root
	// itself cannot satisfy the offline requirement.
	writeFileSync(
		join(consumer, ".pi", "settings.json"),
		`${JSON.stringify({ packages: [REPO_ROOT] }, null, "\t")}\n`,
	);
	return consumer;
}

/** Run the installed pi CLI headless; status === null means it hit the timeout. */
function runCli(home: string, consumer: string, env: Record<string, string>, timeoutMs: number) {
	return spawnSync(NODE, [CLI_PATH, "--approve", "-p", "/council-eval"], {
		cwd: consumer,
		env,
		encoding: "utf8",
		timeout: timeoutMs,
	});
}

describe("env-split registration contract (FLLWUP-21, spec §3)", () => {
	test("M1 pole A: clean env registers all 14 parent-mode commands", () => {
		const home = makeScratch();
		const out = runDriver(explicitEnv(home));
		expect(out.error, `driver reported a load error: ${out.error}`).toBeUndefined();
		// 7 procedure commands + council-init/-jobs/-leaderboard/-models/-eval
		// + council-tree + mcp.
		expect(out.commands).toBe(14);
	});

	test("M1 pole B: COUNCIL_SEAT set registers zero commands (red reproduction)", () => {
		const home = makeScratch();
		const out = runDriver(explicitEnv(home, { COUNCIL_SEAT: "judge" }));
		expect(out.error, `driver reported a load error: ${out.error}`).toBeUndefined();
		expect(out.commands).toBe(0);
	});

	test("M2 end-to-end clean-env pole through the real binary", () => {
		const scratch = makeScratch();
		const home = join(scratch, "home");
		mkdirSync(home, { recursive: true });
		const consumer = makeConsumer(scratch);
		const res = runCli(home, consumer, explicitEnv(home), 60_000);
		expect(res.status, `pi exited ${res.status ?? "timeout"}; stderr: ${res.stderr}`).toBe(0);
		const merged = `${res.stdout ?? ""}${res.stderr ?? ""}`;
		expect(merged).toContain("[council-eval] usage:");
		expect(res.stderr ?? "").not.toContain("Failed to load extension");
	});

	test("M3 end-to-end COUNCIL_SEAT pole through the real binary (bounded, red)", () => {
		const scratch = makeScratch();
		const home = join(scratch, "home");
		mkdirSync(home, { recursive: true });
		const consumer = makeConsumer(scratch);
		const res = runCli(home, consumer, explicitEnv(home, { COUNCIL_SEAT: "judge" }), 60_000);
		// (a) bounded: the process must exit within the timeout — with no API
		// key present the unregistered-command path fails fast ("No API key
		// found…"); the explicit env drops every provider key, so no dispatch
		// can succeed or linger. status === null is the timeout signal.
		expect(res.status, "pi did not exit within the 60s bound").not.toBeNull();
		const merged = `${res.stdout ?? ""}${res.stderr ?? ""}`;
		expect(merged).not.toContain("[council-eval] usage:");
		// (c) the silence discriminator: the factory succeeded and child mode
		// ran — zero commands, zero load diagnostics.
		expect(res.stderr ?? "").not.toContain("Failed to load extension");
	});
});

afterAll(() => {
	for (const dir of scratchDirs) rmSync(dir, { recursive: true, force: true });
});