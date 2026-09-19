// EV-63 — offline fixture tests for the gate's pure decision function.
// No network: `decide` and its fixtures are pure data; the loader tests use
// tmpdir repos (never the real repo), and nothing here sets
// COUNCIL_INTEGRATION or touches a model.
import { test, expect } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { CONFIG_DIR_NAME } from "@earendil-works/pi-coding-agent";
import { loadGateDecision, MODE_PANELS } from "../extensions/gate.ts";

// ---------------------------------------------------------------------------
// Task 1: decision-policy data + packaged decision.json + fail-loud loader
// ---------------------------------------------------------------------------

test("the packaged decision policy loads from a nonexistent repo root with floors and thresholds", () => {
	const d = loadGateDecision("/nonexistent-repo-root-ev63");
	expect(d.version.length).toBeGreaterThan(0);
	expect(d.floors.choice).toBeGreaterThan(0);
	expect(d.floors.score).toBeGreaterThan(0);
	expect(d.noulThreshold).toBeGreaterThan(0);
	expect(d.noulThreshold).toBeLessThanOrEqual(1);
	expect(d.thresholds.verify).toBeLessThanOrEqual(d.thresholds.direct);
	expect(d.overrides.length).toBeGreaterThanOrEqual(3);
});

test("a repo-local decision.json shadows the packaged default whole-file", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "ev63-decision-"));
	const dir = path.join(root, CONFIG_DIR_NAME, "council", "gate");
	fs.mkdirSync(dir, { recursive: true });
	fs.writeFileSync(
		path.join(dir, "decision.json"),
		JSON.stringify({
			version: "t-1",
			weights: { probe: 2 },
			mechanical: { probe: "yes" },
			floors: { choice: 0.5, score: 0.5 },
			noulThreshold: 0.55,
			noulProbabilityOf: "yes",
			thresholds: { verify: 1, direct: 1.5 },
			overrides: [],
		}),
	);
	const d = loadGateDecision(root);
	expect(d.version).toBe("t-1");
	expect(Object.keys(d.weights)).toEqual(["probe"]);
});

test("a malformed repo decision.json throws the single FAIL line naming the file", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "ev63-decision-"));
	const dir = path.join(root, CONFIG_DIR_NAME, "council", "gate");
	fs.mkdirSync(dir, { recursive: true });
	const file = path.join(dir, "decision.json");
	fs.writeFileSync(file, "{ not json");
	let msg = "";
	try {
		loadGateDecision(root);
	} catch (e) {
		msg = (e as Error).message;
	}
	expect(msg).not.toMatch(/\n/);
	expect(msg).toContain(`FAIL: ${file} has an invalid JSON`);
});

test("an invalid threshold pair (verify > direct) throws the FAIL line", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "ev63-decision-"));
	const dir = path.join(root, CONFIG_DIR_NAME, "council", "gate");
	fs.mkdirSync(dir, { recursive: true });
	const file = path.join(dir, "decision.json");
	fs.writeFileSync(
		file,
		JSON.stringify({
			version: "t-1",
			weights: { probe: 1 },
			mechanical: { probe: "yes" },
			floors: { choice: 0.7, score: 0.7 },
			noulThreshold: 0.6,
			noulProbabilityOf: "yes",
			thresholds: { verify: 9, direct: 1 },
			overrides: [],
		}),
	);
	let msg = "";
	try {
		loadGateDecision(root);
	} catch (e) {
		msg = (e as Error).message;
	}
	expect(msg).toContain(`FAIL: ${file} has an invalid thresholds`);
	expect(msg).toContain("verify must be ≤ direct");
});

test("R4 panel constants: Verify keeps an adversary and a ruling authority; Direct has no judge", () => {
	expect(MODE_PANELS.Verify).toContain("skeptic");
	expect(MODE_PANELS.Verify).toContain("judge");
	expect(MODE_PANELS.Direct).not.toContain("judge");
	for (const panel of Object.values(MODE_PANELS)) expect(panel[0]).toBe("owner");
});
