// EV-63 — offline fixture tests for the gate's pure decision function.
// No network: `decide` and its fixtures are pure data; the loader tests use
// tmpdir repos (never the real repo), and nothing here sets
// COUNCIL_INTEGRATION or touches a model.
import { test, expect } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { CONFIG_DIR_NAME } from "@earendil-works/pi-coding-agent";
import { GATE_DECISION_MODES, loadGateDecision, MODE_PANELS, decide, type GateAnswer, type GateDecisionPolicy } from "../extensions/gate.ts";
import { rederiveResolvedMode, type GateLedgerRecord } from "../extensions/gate-ledger.ts";

// ---------------------------------------------------------------------------
// Task 2: the pure decide() — fixtures, overrides, floors, composite
// ---------------------------------------------------------------------------

// The transport's answer shapes, per type (card Intent): choice carries the
// chosen label + probabilities by option + confidence; score carries score,
// legend, probabilities by index, confidence; noul carries ONLY its
// probability — there is no confidence field to floor.
const choice = (value: string, pYes: number, confidence = 0.9): GateAnswer => ({
	type: "choice",
	value,
	probabilities: { yes: pYes, no: 1 - pYes },
	confidence,
});
const noul = (probability: number): GateAnswer => ({ type: "noul", probability });
const score = (probMechanical: number, confidence = 0.9): GateAnswer => ({
	type: "score",
	score: probMechanical >= 0.5 ? 0 : 1,
	legend: ["mechanical criterion", "judgment criterion"],
	probabilities: { "0": probMechanical, "1": 1 - probMechanical },
	confidence,
});

const policy: GateDecisionPolicy = loadGateDecision("/nonexistent-repo-root-ev63");

// All-mechanical, all-confident answer set: composite 0.9+0.9+0.9+0.9 = 3.6.
const mechSet: Record<string, GateAnswer> = {
	reversible: noul(0.9),
	publicContract: noul(0.1),
	blastRadius: noul(0.1),
	decidablyTestable: choice("yes", 0.9),
};

// A score-typed policy for the score-specific tests (the packaged set has no
// score question, but the decision core must handle the type).
const scorePolicy: GateDecisionPolicy = {
	...policy,
	version: "score-test-1",
	weights: { probe: 1 },
	mechanical: { probe: "0" },
	thresholds: { verify: 0.5, direct: 0.9 },
	overrides: [],
};

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

// --- hard deterministic overrides: Deliberate against an all-mechanical set ---

for (const [id, p, option, basisNeedle] of [
	["reversible", 0.15, "no", "one-way door"],
	["publicContract", 0.85, "yes", "public contract or data change"],
	["blastRadius", 0.85, "yes", "cross-module blast radius"],
] as const) {
	test(`override: ${id} → Deliberate against an otherwise all-mechanical answer set`, () => {
		const answers = { ...mechSet, [id]: noul(p) };
		const d = decide(answers, policy);
		expect(d.mode).toBe("Deliberate");
		expect(d.basis).toBe(`${id}? ${option} (${basisNeedle})`);
	});
}

test("a hard override fires on the CHOSEN label, not the probability mass", () => {
	// chosen "no" (one-way door) while probabilities favor "yes" — the answer
	// itself is the deterministic signal, not its probability mass.
	const answers = { ...mechSet, reversible: { type: "choice", value: "no", probabilities: { yes: 0.8, no: 0.2 }, confidence: 0.95 } };
	const d = decide(answers, policy);
	expect(d.mode).toBe("Deliberate");
	expect(d.basis).toBe("reversible? no (one-way door)");
});

// --- confidence floors (choice + score) ---

test("a below-floor choice answer returns Deliberate even when the composite would not", () => {
	const answers = { ...mechSet, decidablyTestable: choice("yes", 0.9, 0.5) };
	const d = decide(answers, policy);
	expect(d.mode).toBe("Deliberate");
	expect(d.basis).toBe("decidablyTestable: confidence 0.50 < choice floor 0.70");
});

test("a below-floor score answer returns Deliberate", () => {
	const answers = { probe: score(0.9, 0.4) };
	const d = decide(answers, scorePolicy);
	expect(d.mode).toBe("Deliberate");
	expect(d.basis).toBe("probe: confidence 0.40 < score floor 0.70");
});

test("a confident mechanical score answer scores the composite", () => {
	const d = decide({ probe: score(0.9, 0.9) }, scorePolicy);
	expect(d.mode).toBe("Direct");
	expect(d.basis).toBe("composite 0.90 ≥ direct threshold 0.90");
});

test("a score answer whose chosen index matches an override option fires it", () => {
	const p: GateDecisionPolicy = { ...scorePolicy, overrides: [{ question: "probe", option: "1", basis: "judgment call" }] };
	const d = decide({ probe: score(0.1, 0.95) }, p);
	expect(d.mode).toBe("Deliberate");
	expect(d.basis).toBe("probe? 1 (judgment call)");
});

// --- the noul threshold: a noul answer is never silently treated as confident ---

test("a near-tie noul answer below the policy's noul threshold escalates instead of riding the composite", () => {
	// certainty(0.51) = 0.51 < 0.60; the override does NOT fire; the composite
	// (0.51+0.9+0.9+0.9 = 3.21) would have said Verify — the threshold is what
	// turns this into Deliberate.
	const answers = { ...mechSet, reversible: noul(0.51) };
	const d = decide(answers, policy);
	expect(d.mode).toBe("Deliberate");
	expect(d.basis).toBe("reversible: certainty 0.51 < noul threshold 0.60");
});

// --- reduced modes: positive evidence, not the absence of a warning ---

test("a reversible, low-blast-radius, decidably-testable confident set resolves Direct", () => {
	const d = decide(mechSet, policy);
	expect(d.mode).toBe("Direct");
	expect(d.basis).toBe("composite 3.60 ≥ direct threshold 3.40");
});

test("a set that is not decidably testable resolves Verify", () => {
	const answers = { ...mechSet, decidablyTestable: choice("no", 0.05, 0.95) };
	const d = decide(answers, policy);
	expect(d.mode).toBe("Verify");
	expect(d.include).toContain("skeptic"); // adversary
	expect(d.include).toContain("judge"); // ruling authority
	expect(d.basis).toBe("composite 2.75 ≥ verify threshold 2.60");
});

test("missing evidence biases SAFE: a null answer drops Direct to Verify, never the reverse", () => {
	const answers: Record<string, GateAnswer | null> = { ...mechSet, decidablyTestable: null };
	const d = decide(answers, policy);
	expect(d.mode).toBe("Verify");
	expect(d.basis).toBe("composite 2.70 ≥ verify threshold 2.60");
});

test("a mediocre set resolves Deliberate", () => {
	// Nothing fires: each noul answer sits exactly at its certainty floor
	// (certainty 0.60, favored toward the mechanical side), the choice answer
	// is confident and carries no override, yet the composite (0.6+0.6+0.6+0.05
	// = 1.85) sits below the verify threshold — positive mechanical evidence,
	// not the absence of a warning, is what buys a reduced mode.
	const answers: Record<string, GateAnswer> = {
		reversible: noul(0.6),
		publicContract: noul(0.4),
		blastRadius: noul(0.4),
		decidablyTestable: choice("no", 0.05),
	};
	const d = decide(answers, policy);
	expect(d.mode).toBe("Deliberate");
	expect(d.basis).toBe("composite 1.85 < verify threshold 2.60");
});

// --- inclusion-set invariants across every fixture in this file ---

const FIXTURES: { name: string; decision: ReturnType<typeof decide> }[] = [
	{ name: "all-mechanical/Direct", decision: decide(mechSet, policy) },
	{ name: "not-decidably-testable/Verify", decision: decide({ ...mechSet, decidablyTestable: choice("no", 0.05, 0.95) }, policy) },
	{ name: "missing-evidence/Verify", decision: decide({ ...mechSet, decidablyTestable: null }, policy) },
	{ name: "override/Deliberate", decision: decide({ ...mechSet, reversible: noul(0.15) }, policy) },
	{ name: "floor/Deliberate", decision: decide({ ...mechSet, decidablyTestable: choice("yes", 0.9, 0.5) }, policy) },
	{ name: "noul-threshold/Deliberate", decision: decide({ ...mechSet, reversible: noul(0.51) }, policy) },
	{ name: "mediocre/Deliberate", decision: decide(
		{ reversible: noul(0.6), publicContract: noul(0.4), blastRadius: noul(0.4), decidablyTestable: choice("no", 0.05) },
		policy,
	) },
];

test("every fixture's inclusion set starts with the owner; Deliberate fixtures carry adversary + ruling authority", () => {
	for (const f of FIXTURES) {
		expect(f.decision.include[0]).toBe("owner");
		if (f.decision.mode === "Deliberate") {
			expect(f.decision.include).toContain("owner");
			expect(f.decision.include).toContain("skeptic");
			expect(f.decision.include).toContain("judge");
		}
	}
});

test("the Direct fixture's inclusion set contains no judge — the test suite is its only gate (R4)", () => {
	const direct = FIXTURES.find((f) => f.name === "all-mechanical/Direct");
	expect(direct?.decision.mode).toBe("Direct");
	expect(direct?.decision.include).toEqual(["owner"]);
	expect(direct?.decision.include).not.toContain("judge");
});

test("each distinct non-invariant role is absent from at least one reduced-set fixture", () => {
	const reduced = FIXTURES.filter((f) => f.decision.mode === "Verify" || f.decision.mode === "Direct");
	expect(reduced.length).toBeGreaterThanOrEqual(2);
	for (const role of ["skeptic", "principal", "designer", "product-owner", "consolidator"]) {
		expect(reduced.some((f) => !f.decision.include.includes(role))).toBe(true);
	}
});

// --- basis determinism: same answers → same bytes, no model call in the path ---

test("the same answers produce byte-identical basis strings across calls", () => {
	for (const f of FIXTURES) {
		const answers = f.name.includes("missing-evidence")
			? ({ ...mechSet, decidablyTestable: null } as Record<string, GateAnswer | null>)
			: (mechSet as Record<string, GateAnswer>);
		const d1 = decide(answers, policy);
		const d2 = decide(answers, policy);
		expect(d1.basis).toBe(d2.basis); // same bytes, deterministically derived
		expect(d1.mode).toBe(d2.mode);
	}
});

// --- fail-loud on malformed answers (never a silent default) ---

test("a noul answer missing its probability throws naming the question", () => {
	expect(() => decide({ reversible: { type: "noul" } as GateAnswer }, policy)).toThrow(/reversible/);
});

test("a choice answer missing its confidence throws naming the question", () => {
	expect(() => decide({ decidablyTestable: { type: "choice", value: "yes", probabilities: { yes: 0.9, no: 0.1 } } as GateAnswer }, policy)).toThrow(/decidablyTestable/);
});

test("an unknown answer type throws naming the question", () => {
	expect(() => decide({ reversible: { type: "essay" } as GateAnswer }, policy)).toThrow(/reversible/);
});

// --- ledger compatibility: rederiveResolvedMode over ONLY the stored line ---

test("rederiveResolvedMode re-runs decide over the stored answers and reproduces the recorded mode", () => {
	const record = {
		answers: mechSet,
		policyVersion: policy.version,
	} as unknown as GateLedgerRecord;
	const mode = rederiveResolvedMode(record, (answers) => decide(answers, policy).mode);
	expect(mode).toBe("Direct");
});

test("the decision mode vocabulary is exactly what the ledger stores as resolvedMode strings", () => {
	expect([...GATE_DECISION_MODES]).toEqual(["Deliberate", "Verify", "Direct"]);
});
