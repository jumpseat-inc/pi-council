// EV-76 — the run-start gate preflight: fail loud when the decisions gate is
// enabled (mode advisory/active) and no OpenRouter credential resolves.
//
// Spec: docs/superpowers/specs/2026-09-20-EV-76-design.md (settled).
//
// O10 hygiene (standing discipline for this suite): this machine's environment
// carries a live OPENROUTER_API_KEY. Every enabled-no-credential case runs
// with that key DELETED from the test process env and the agent dir pointed at
// a fresh empty mkdtemp dir — otherwise the test silently passes in a
// credentialed world. Originals are captured BEFORE any mutation (T-U16
// precedent, test/provider-cost.test.ts) and restored after each test.
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { createHash } from "node:crypto";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { registerPreflightTool, runStartGatePreflight } from "../extensions/preflight.ts";

const REAL_AGENT_DIR = process.env.PI_CODING_AGENT_DIR ?? path.join(os.homedir(), ".pi", "agent");
const REAL_ENV_KEY = process.env.OPENROUTER_API_KEY;

/** The R5-endorsed FAIL literal (spec §2), byte-pinned. */
function expectedFail(mode: string): string {
	return (
		`FAIL: decisions gate is enabled (mode "${mode}") but no OpenRouter credential resolved — ` +
		`set OPENROUTER_API_KEY, or run /login openrouter in pi to store an openrouter api_key credential, ` +
		`then re-run preflight`
	);
}

let agentDir: string;
let repo: string;

beforeEach(() => {
	agentDir = fs.mkdtempSync(path.join(os.tmpdir(), "ev76-agent-home-"));
	repo = fs.mkdtempSync(path.join(os.tmpdir(), "ev76-repo-"));
	process.env.PI_CODING_AGENT_DIR = agentDir;
	delete process.env.OPENROUTER_API_KEY;
});

afterEach(() => {
	fs.rmSync(agentDir, { recursive: true, force: true });
	fs.rmSync(repo, { recursive: true, force: true });
	if (REAL_ENV_KEY === undefined) delete process.env.OPENROUTER_API_KEY;
	else process.env.OPENROUTER_API_KEY = REAL_ENV_KEY;
	if (process.env.PI_CODING_AGENT_DIR !== undefined) {
		if (REAL_AGENT_DIR !== agentDir) delete process.env.PI_CODING_AGENT_DIR;
		process.env.PI_CODING_AGENT_DIR = REAL_AGENT_DIR;
	}
});

function writeGateMode(mode: string): void {
	fs.writeFileSync(path.join(repo, ".council.json"), JSON.stringify({ gate: { mode } }), "utf-8");
}

function assertFailLiteralShape(line: string, mode: string): void {
	expect(line).toBe(expectedFail(mode));
	// R5 constraints, independently of the byte pin:
	expect(line.split("FAIL:").length - 1).toBe(1); // exactly one FAIL:
	expect(line.includes("\n")).toBe(false);
	expect(line.includes("\r")).toBe(false);
	expect(line.includes("jev")).toBe(false);
	for (const required of ["decisions gate", "OPENROUTER_API_KEY", "openrouter api_key"]) {
		expect(line.includes(required), `FAIL literal must name "${required}"`).toBe(true);
	}
}

describe("EV-76 runStartGatePreflight", () => {
	// Spec test 1 — the card's named test: enabled-no-credential FAIL.
	test("mode advisory + no credential of any kind → the endorsed FAIL literal, byte-identical", () => {
		writeGateMode("advisory");
		const line = runStartGatePreflight(repo);
		assertFailLiteralShape(line!, "advisory");
	});

	test("mode active + no credential of any kind → the endorsed FAIL literal, byte-identical", () => {
		writeGateMode("active");
		const line = runStartGatePreflight(repo);
		assertFailLiteralShape(line!, "active");
	});

	// Spec test 2 — the card's named test: off-mode adds nothing.
	test("off-mode in every absent/empty shape → null (add nothing)", () => {
		// absent .council.json
		expect(runStartGatePreflight(repo)).toBeNull();
		// no `gate` key
		fs.writeFileSync(path.join(repo, ".council.json"), JSON.stringify({ council: {} }), "utf-8");
		expect(runStartGatePreflight(repo)).toBeNull();
		// `gate: {}`
		fs.writeFileSync(path.join(repo, ".council.json"), JSON.stringify({ gate: {} }), "utf-8");
		expect(runStartGatePreflight(repo)).toBeNull();
		// `mode: "off"`
		writeGateMode("off");
		expect(runStartGatePreflight(repo)).toBeNull();
	});

	// Spec test 3 — stored-credential parity, runtime parity both directions.
	test("stored typed api_key credential for openrouter + no env → null", () => {
		writeGateMode("advisory");
		fs.writeFileSync(
			path.join(agentDir, "auth.json"),
			JSON.stringify({ openrouter: { type: "api_key", key: "stored-k" } }),
			{ mode: 0o600 },
		);
		expect(runStartGatePreflight(repo)).toBeNull();
	});

	test("injected env key + no stored credential → null", () => {
		writeGateMode("advisory");
		process.env.OPENROUTER_API_KEY = "env-k";
		expect(runStartGatePreflight(repo)).toBeNull();
	});

	test("oauth-typed stored credential does NOT count → the FAIL literal (runtime parity, skeptic O2/O3)", () => {
		writeGateMode("advisory");
		fs.writeFileSync(
			path.join(agentDir, "auth.json"),
			JSON.stringify({ openrouter: { type: "oauth", access: "t", refresh: "r", expires: 0 } }),
			{ mode: 0o600 },
		);
		assertFailLiteralShape(runStartGatePreflight(repo)!, "advisory");
	});

	// Spec test 4 — malformed gate config fails loud, never defaults to off.
	test("invalid gate.mode throws the single-line FAIL gateFail error verbatim", () => {
		writeGateMode("bogus");
		let thrown: unknown;
		try {
			runStartGatePreflight(repo);
		} catch (e) {
			thrown = e;
		}
		expect(thrown).toBeInstanceOf(Error);
		const msg = (thrown as Error).message;
		expect(msg.startsWith("FAIL:")).toBe(true);
		expect(msg.includes("gate.mode")).toBe(true);
		expect(msg.includes("\n")).toBe(false);
	});

	test("unparseable .council.json throws the single-line FAIL gateFail error verbatim", () => {
		fs.writeFileSync(path.join(repo, ".council.json"), "{not json", "utf-8");
		let thrown: unknown;
		try {
			runStartGatePreflight(repo);
		} catch (e) {
			thrown = e;
		}
		expect(thrown).toBeInstanceOf(Error);
		const msg = (thrown as Error).message;
		expect(msg.startsWith("FAIL:")).toBe(true);
		expect(msg.includes("\n")).toBe(false);
	});
});

describe("EV-76 council_preflight registration", () => {
	// Spec test 6 — parent-only registration pin (test/gate-render.test.ts:330 precedent).
	test("registration is parent-mode-only: index.ts wires registerPreflightTool after registerRouteTool; hub-tools.ts and child.ts never mention it", () => {
		const extDir = path.join(import.meta.dir, "..", "extensions");
		const idx = fs.readFileSync(path.join(extDir, "index.ts"), "utf-8");
		const routePos = idx.indexOf("registerRouteTool(pi, repoRoot)");
		const preflightPos = idx.indexOf("registerPreflightTool(pi, repoRoot)");
		expect(routePos).toBeGreaterThan(-1);
		expect(preflightPos).toBeGreaterThan(routePos);
		for (const f of ["hub-tools.ts", "child.ts"]) {
			const src = fs.readFileSync(path.join(extDir, f), "utf-8");
			expect(src.includes("council_preflight") || src.includes("preflight"), `${f} must not reference the preflight module or tool`).toBe(false);
		}
	});

	test("registered tool is named council_preflight and returns a pass result on an off-mode repo", async () => {
		let registered: { name: string; execute: (...a: unknown[]) => Promise<{ content: { type: string; text: string }[]; details: unknown }> } | null = null;
		const pi = {
			registerTool: (t: unknown) => {
				registered = t as typeof registered;
			},
		} as unknown as ExtensionAPI;
		registerPreflightTool(pi, repo);
		expect(registered!.name).toBe("council_preflight");
		const res = await registered!.execute("t1", {}, undefined, undefined, {});
		expect(res.details).toEqual({ ok: true });
		expect(res.content[0].text.includes("FAIL:")).toBe(false);
	});

	// Spec test 8 — non-spawn pin: the tool module never references or spawns
	// council/preflight.sh and calls no spawn/exec primitive.
	test("source canary: preflight.ts never spawns and never references the preflight script", () => {
		const src = fs.readFileSync(path.join(import.meta.dir, "..", "extensions", "preflight.ts"), "utf-8");
		for (const banned of ["child_process", "spawn", "exec(", "execFile", "preflight.sh"]) {
			expect(src.includes(banned), `preflight.ts must not reference ${banned}`).toBe(false);
		}
	});
});

describe("EV-76 packaged procedure reach + preflight-script byte pins", () => {
	// Spec test 7 — ordering/reach pins against the PACKAGED text.
	test("council.md step 0 invokes council_preflight BEFORE the unchanged preflight.sh line", () => {
		const text = fs.readFileSync(path.join(import.meta.dir, "..", "council", "procedures", "council.md"), "utf-8");
		const toolPos = text.indexOf("council_preflight");
		const scriptPos = text.indexOf("bash council/preflight.sh");
		expect(toolPos).toBeGreaterThan(-1);
		expect(scriptPos).toBeGreaterThan(toolPos);
		// the script invocation line is byte-unchanged
		expect(text.includes("Run `bash council/preflight.sh $ARGUMENTS`. It is card-aware")).toBe(true);
	});

	test("features-deliver.md Phase 0 invokes council_preflight BEFORE the unchanged preflight.sh line", () => {
		const text = fs.readFileSync(path.join(import.meta.dir, "..", "council", "procedures", "features-deliver.md"), "utf-8");
		const toolPos = text.indexOf("council_preflight");
		const scriptPos = text.indexOf("bash council/preflight.sh");
		expect(toolPos).toBeGreaterThan(-1);
		expect(scriptPos).toBeGreaterThan(toolPos);
		expect(text.includes("Run `bash council/preflight.sh` once, at run start")).toBe(true);
	});

	// Spec test 5 — byte-identity pins: the mechanism must not touch any
	// preflight script. Digests captured at the base commit (27eda83).
	test("the three preflight scripts keep their base-commit bytes", () => {
		const pins: Record<string, string> = {
			"council/preflight.sh": "0674b558088ae7914283985de9e1c5e0365a27817d49dd7398f71b8aeda1f723",
			"council/scaffold/council/preflight.sh": "06b9a09c124156cb7383fee5cd125e61c19e99f9cff08ad8246ec3a0dd8d0033",
			"smoke/fixture/council/preflight.sh": "ffb03aea3201e633432f36090857c99f618dad49a2a63ab4c44af34e7ba7d56a",
		};
		for (const [rel, digest] of Object.entries(pins)) {
			const buf = fs.readFileSync(path.join(import.meta.dir, "..", rel));
			expect(createHash("sha256").update(buf).digest("hex")).toBe(digest);
		}
	});
});
