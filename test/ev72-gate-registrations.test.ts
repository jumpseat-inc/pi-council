/**
 * EV-72 — pre-registered threshold tuning from the ledger.
 *
 * The gate policy's policyVersion must have a matching pre-registration
 * record in council/gate/registrations.jsonl or `python3 council/validate.py`
 * fails with the exact named line. A registration entry names the policy
 * version it introduces, the coefficient or floor that changed, the ledger
 * evidence that motivated the change, and the expected outcome.
 *
 * Tests drive the REAL validator via spawnSync against a fresh mkdtemp tree
 * (validate.py copied byte-identically — FLLWUP-51 pattern), plus the
 * packaged pair at PKG_ROOT: no threshold in the packaged default policy may
 * lack a registration entry, and the packaged tree itself must validate
 * clean.
 */
import { test, expect } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { spawnSync } from "node:child_process";
import { PKG_ROOT } from "../extensions/seats.ts";

const EM_DASH = "\u2014";

/** The exact FAIL line the contract demands, for a given policyVersion. */
function expectedFailLine(version: string): string {
	return (
		`FAIL: gate policy version ${version} has no pre-registration record in ` +
		`council/gate/registrations.jsonl ${EM_DASH} add an entry naming that ` +
		`version, the coefficient or floor that changed, and the ledger ` +
		`evidence that motivated it`
	);
}

function policyJson(version: string): string {
	return `${JSON.stringify(
		{
			policyVersion: version,
			mode: "off",
			model: "typesafe/jev-1.13",
			endpoint: "https://openrouter.ai/api/alpha/decisions",
			gateStateBudgetTokens: 32000,
		},
		null,
		"\t",
	)}\n`;
}

function registrationLine(version: string): string {
	return `${JSON.stringify({
		policyVersion: version,
		changed: "gateStateBudgetTokens: floor set at 32000 (initial default)",
		evidence: "EV-64 wiki-packing probe: measured section caps sum to 19,000 tokens (council/cards/EV-64.md, O7)",
		expectedOutcome: "the state packer never truncates at the default budget",
	})}\n`;
}

/** Temp council tree: validate.py copied byte-identically, a minimal card +
 * board, and — when non-null — a council/gate/policy.json and/or
 * registrations.jsonl written as given. */
function gateTree(policy: string | null, registrations: string | null): string {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "ev72-"));
	fs.mkdirSync(path.join(root, "council", "cards"), { recursive: true });
	fs.copyFileSync(
		path.join(PKG_ROOT, "council", "validate.py"),
		path.join(root, "council", "validate.py"),
	);
	fs.writeFileSync(
		path.join(root, "council", "cards", "EV-901.md"),
		[
			"---",
			"id: EV-901",
			"title: Test card",
			"state: Backlog",
			"owner: null",
			"epic: null",
			"goal: a single line goal",
			"---",
			"",
			"## Intent",
			"",
			"minimal",
			"",
		].join("\n"),
	);
	fs.writeFileSync(
		path.join(root, "council", "board.md"),
		"# Board\n\n## Backlog\n\n- EV-901 — Test card\n",
	);
	if (policy !== null || registrations !== null) {
		fs.mkdirSync(path.join(root, "council", "gate"), { recursive: true });
	}
	if (policy !== null) {
		fs.writeFileSync(path.join(root, "council", "gate", "policy.json"), policy);
	}
	if (registrations !== null) {
		fs.writeFileSync(
			path.join(root, "council", "gate", "registrations.jsonl"),
			registrations,
		);
	}
	return root;
}

function runValidate(root: string): { status: number; stdout: string; stderr: string } {
	const res = spawnSync("python3", [path.join(root, "council", "validate.py")], {
		encoding: "utf-8",
	});
	return {
		status: res.status ?? -1,
		stdout: res.stdout ?? "",
		stderr: res.stderr ?? "",
	};
}

function failLines(stdout: string): string[] {
	return stdout.split("\n").filter((l) => l.startsWith("FAIL:"));
}

// ---- (a) control: a policy version with a matching entry validates clean ----

test("matching registration entry → clean exit 0", () => {
	const { status, stdout } = runValidate(
		gateTree(policyJson("gate-policy-1"), registrationLine("gate-policy-1")),
	);
	expect(status).toBe(0);
	expect(stdout).toContain("All council artifacts valid");
});

// ---- (b) version bumped with no entry → FAIL naming the bumped version ----

test("bumped policyVersion with no matching entry fails, naming the bumped version", () => {
	const { status, stdout } = runValidate(
		gateTree(policyJson("gate-policy-2"), registrationLine("gate-policy-1")),
	);
	expect(status).toBe(1);
	expect(stdout).toContain("gate-policy-2");
	const line = failLines(stdout).find((l) => l.includes("pre-registration"));
	expect(line).toBeDefined();
});

test("policy.json present but registrations.jsonl entirely missing → the same FAIL", () => {
	const { status, stdout } = runValidate(gateTree(policyJson("gate-policy-1"), null));
	expect(status).toBe(1);
	expect(stdout).toContain(expectedFailLine("gate-policy-1"));
});

// ---- (c) the FAIL line's exact form ----

test("the FAIL line has the exact contracted form (em dash U+2014, remedy inline)", () => {
	const { stdout } = runValidate(
		gateTree(policyJson("gate-policy-2"), registrationLine("gate-policy-1")),
	);
	expect(failLines(stdout)).toContain(expectedFailLine("gate-policy-2"));
});

// ---- registrations.jsonl data integrity: torn lines and malformed policy ----

test("an unparseable registrations.jsonl line is a named FAIL, never skipped silently", () => {
	const torn = registrationLine("gate-policy-1") + "{not json\n";
	const { status, stdout } = runValidate(gateTree(policyJson("gate-policy-1"), torn));
	expect(status).toBe(1);
	const line = failLines(stdout).find((l) => l.includes("registrations.jsonl"));
	expect(line).toBeDefined();
	expect(line).toContain("not json");
});

test("a malformed policy.json is a named FAIL, not a traceback", () => {
	const { status, stdout, stderr } = runValidate(gateTree("{broken", null));
	expect(status).toBe(1);
	expect(stderr).not.toContain("Traceback");
	const line = failLines(stdout).find((l) => l.includes("policy.json"));
	expect(line).toBeDefined();
});

// ---- (d) the packaged registration entry round-trips with required fields ----

test("packaged registrations.jsonl parses as JSONL; every entry carries all four required fields", () => {
	const text = fs.readFileSync(
		path.join(PKG_ROOT, "council", "gate", "registrations.jsonl"),
		"utf-8",
	);
	const entries = text
		.split("\n")
		.filter((l) => l.trim() !== "")
		.map((l) => JSON.parse(l));
	expect(entries.length).toBeGreaterThan(0);
	for (const entry of entries) {
		for (const field of ["policyVersion", "changed", "evidence", "expectedOutcome"]) {
			expect(typeof entry[field], `field ${field} in ${JSON.stringify(entry)}`).toBe("string");
			expect((entry[field] as string).length).toBeGreaterThan(0);
		}
	}
});

test("the packaged entry names a coefficient and a ledger citation (the motivating evidence)", () => {
	const text = fs.readFileSync(
		path.join(PKG_ROOT, "council", "gate", "registrations.jsonl"),
		"utf-8",
	);
	const entry = text
		.split("\n")
		.map((l) => l.trim())
		.filter((l) => l !== "")
		.map((l) => JSON.parse(l))
		.find((e) => e.policyVersion === "gate-policy-1");
	expect(entry).toBeDefined();
	// the coefficient that changed
	expect(entry.changed).toContain("gateStateBudgetTokens");
	// the ledger evidence: a named, checkable citation carrying the measured number
	expect(entry.evidence).toContain("19,000");
});

// ---- (e) the packaged pair validates clean; no threshold lacks an entry ----

test("packaged tree validates clean at PKG_ROOT", () => {
	const res = spawnSync("python3", [path.join(PKG_ROOT, "council", "validate.py")], {
		encoding: "utf-8",
	});
	expect(res.status).toBe(0);
	expect(res.stdout).toContain("All council artifacts valid");
});

test("no threshold in the packaged default policy lacks a registration entry", () => {
	const policy = JSON.parse(
		fs.readFileSync(path.join(PKG_ROOT, "council", "gate", "policy.json"), "utf-8"),
	);
	const text = fs.readFileSync(
		path.join(PKG_ROOT, "council", "gate", "registrations.jsonl"),
		"utf-8",
	);
	const entries = text
		.split("\n")
		.filter((l) => l.trim() !== "")
		.map((l) => JSON.parse(l));
	const metadataKeys = new Set(["policyVersion", "mode", "model", "endpoint"]);
	const thresholds = Object.keys(policy).filter((k) => !metadataKeys.has(k));
	expect(thresholds).toContain("gateStateBudgetTokens");
	for (const key of thresholds) {
		const covered = entries.some(
			(e) => e.policyVersion === policy.policyVersion && e.changed.includes(key),
		);
		expect(covered, `threshold ${key} has no registration entry`).toBe(true);
	}
});
