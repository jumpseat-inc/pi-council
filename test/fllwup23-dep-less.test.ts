// FLLWUP-23 — dependency-less install named-failure contract (spec §4).
//
// Builds a self-contained SDK-free install shape (extensions/+themes/+council
// copied, node_modules hardlink copy minus @modelcontextprotocol, driver
// spawned from inside the scratch so BOTH jiti resolver stages end in the
// SDK-free tree) and asserts, through the real loader, that a missing
// @modelcontextprotocol/sdk surfaces as ONE named load error naming the
// package, the first unresolved entry, the remedy at the package root, the
// restart instruction, and a counter to pi's `-ne` hint — plus healthy,
// discriminator-honesty, and async-factory controls. Full narrative lives in
// docs/superpowers/plans/2026-09-05-FLLWUP-23-plan.md.
import { afterAll, describe, expect, test } from "bun:test";
import { execFileSync, spawnSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const REPO_ROOT = process.cwd();
const DRIVER_SRC = join(REPO_ROOT, "test", "fixtures", "fllwup23-driver.ts");
const SDK = "@modelcontextprotocol";

// jiti interop finding (0.85.1): a bare `throw` body has no named exports, so
// jiti's lexer reports "Export named ... not found" instead of executing the
// throw. Keep the five names mcp/index.ts imports so the module shape is valid
// and the top-level throw genuinely fires at eval — the real-bug discriminator.
const CORRUPTED_OAUTH = [
	"export function CouncilOAuthProvider() {}",
	"export function loginOAuth() {}",
	"export function loginRemote() {}",
	"export function completeRemoteLogin() {}",
	"export function isRemoteSession() {}",
	'throw new Error("FLLWUP23_EXPLODED");',
].join("\n");

const scratchDirs: string[] = [];
function makeScratch(): string {
	const dir = mkdtempSync(join(tmpdir(), "fllwup23-"));
	scratchDirs.push(dir);
	return dir;
}

function explicitEnv(home: string, extra: Record<string, string> = {}): Record<string, string> {
	return { PATH: process.env.PATH ?? "", HOME: home, NO_COLOR: "1", ...extra };
}

/** Shape (A) — self-contained SDK-free scratch. */
function buildDepLessScratch(): string {
	const scratch = makeScratch();
	cpSync(join(REPO_ROOT, "extensions"), join(scratch, "extensions"), { recursive: true });
	cpSync(join(REPO_ROOT, "themes"), join(scratch, "themes"), { recursive: true });
	cpSync(join(REPO_ROOT, "council"), join(scratch, "council"), { recursive: true });
	try {
		execFileSync("cp", ["-al", join(REPO_ROOT, "node_modules"), join(scratch, "node_modules")]);
	} catch {
		cpSync(join(REPO_ROOT, "node_modules"), join(scratch, "node_modules"), { recursive: true });
	}
	rmSync(join(scratch, "node_modules", SDK), { recursive: true, force: true });
	cpSync(DRIVER_SRC, join(scratch, "driver.ts"));
	return scratch;
}

function restoreSdk(scratch: string): void {
	cpSync(join(REPO_ROOT, "node_modules", SDK), join(scratch, "node_modules", SDK), { recursive: true });
}

interface DriverOut {
	commands?: number;
	errors?: string[];
	error?: string;
}

function runDriver(scratch: string, extra: Record<string, string> = {}): DriverOut {
	const home = join(scratch, "home");
	mkdirSync(home, { recursive: true });
	const res = spawnSync(process.execPath, [join(scratch, "driver.ts")], {
		cwd: scratch,
		env: explicitEnv(home, { FLLWUP23_EXT_ROOT: scratch, ...extra }),
		encoding: "utf8",
		timeout: 90_000,
	});
	if (res.error) throw res.error;
	const lines = (res.stdout ?? "").trim().split("\n").filter(Boolean);
	if (lines.length === 0) {
		throw new Error(`FLLWUP-23: driver produced no stdout. stderr: ${res.stderr}`);
	}
	try {
		return JSON.parse(lines[lines.length - 1]) as DriverOut;
	} catch {
		throw new Error(`FLLWUP-23: driver stdout was not JSON: ${lines[lines.length - 1]}`);
	}
}

describe("dep-less install named failure (FLLWUP-23, spec §4)", () => {
	test("missing SDK: exactly one loader error naming package, entry, remedy, restart, and countering -ne", () => {
		const scratch = buildDepLessScratch();
		const out = runDriver(scratch);
		expect(out.error, `driver failed: ${out.error}`).toBeUndefined();
		expect(out.errors, JSON.stringify(out)).toHaveLength(1);
		expect(out.commands).toBe(0);
		const e = out.errors![0]!;
		expect(e).toMatch(/pi-council could not load/);
		expect(e).toMatch(/@modelcontextprotocol\/sdk/);
		expect(e).toMatch(/@modelcontextprotocol\/sdk\/client/);
		expect(e).toMatch(/(bun install|npm install)/);
		expect(e).toMatch(/directory containing package\.json/);
		expect(e).toMatch(/restart/);
		expect(e).toMatch(/pi -ne/);
	});

	test("healthy control: SDK restored → 14 commands, zero errors, no prose anywhere", () => {
		const scratch = buildDepLessScratch();
		restoreSdk(scratch);
		const out = runDriver(scratch);
		expect(out.error, `driver failed: ${out.error}`).toBeUndefined();
		expect(out.errors ?? []).toHaveLength(0);
		expect(out.commands).toBe(14);
		expect(JSON.stringify(out)).not.toContain("pi-council could not load");
	});

	test("discriminator honesty: SDK present + corrupted oauth.ts → real error, no prose", () => {
		const scratch = buildDepLessScratch();
		restoreSdk(scratch);
		writeFileSync(join(scratch, "extensions", "mcp", "oauth.ts"), CORRUPTED_OAUTH);
		const out = runDriver(scratch);
		expect(out.error, `driver failed: ${out.error}`).toBeUndefined();
		expect(out.errors ?? []).not.toHaveLength(0);
		const e = out.errors![0]!;
		expect(e).toContain("FLLWUP23_EXPLODED");
		expect(e).not.toContain("pi-council could not load");
	});

	test("async-factory control: the loader awaits an async default export", () => {
		const scratch = buildDepLessScratch();
		const canary = join(scratch, "canary");
		mkdirSync(canary, { recursive: true });
		writeFileSync(
			join(canary, "index.ts"),
			[
				"export default async function (api: any) {",
				"\tawait new Promise((r) => setTimeout(r, 25));",
				'\tapi.registerCommand("async-ok", { description: "canary", handler: async () => {} });',
				"}",
			].join("\n"),
		);
		const out = runDriver(scratch, { FLLWUP23_CANARY: canary });
		expect(out.error, `driver failed: ${out.error}`).toBeUndefined();
		expect(out.errors ?? []).toHaveLength(0);
		expect(out.commands).toBe(1);
	});
});

afterAll(() => {
	for (const dir of scratchDirs) rmSync(dir, { recursive: true, force: true });
});