// EV-79 — offline fixture tests for the followup's pure decision function.
// No network: `decideFollowup` and its fixtures are pure data; the packaged
// policy loads from a nonexistent repo root, band-walk fixtures use tmpdir
// repos (never the real repo), and nothing here sets COUNCIL_INTEGRATION or
// touches a model. Fixture pattern follows test/gate-decide.test.ts.
import { test, expect } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { CONFIG_DIR_NAME } from "@earendil-works/pi-coding-agent";
import {
	FOLLOWUP_DISPOSITIONS,
	decideFollowup,
	loadFollowupDecision,
	type FollowupDecisionPolicy,
	type FollowupDisposition,
	type GateAnswer,
} from "../extensions/gate.ts";

// ---------------------------------------------------------------------------
// Fixtures: answer shapes + the packaged followup decision policy
// ---------------------------------------------------------------------------

const noul = (probability: number): GateAnswer => ({ type: "noul", probability });
/** Explicit probabilities so composite arithmetic is hand-checkable. */
const choice = (value: string, confidence: number, probs: Record<string, number>): GateAnswer => ({
	type: "choice",
	value,
	probabilities: probs,
	confidence,
});

const policy: FollowupDecisionPolicy = loadFollowupDecision("/nonexistent-repo-root-ev79");

// All on-floor, all non-firing: composite 0.4 + 0.4 + 1.0 = 1.80 → Merge
// (the max non-override composite for well-formed answers — note 1).
const mergeSet: Record<string, GateAnswer | null> = {
	duplicate: noul(0.4), // certainty 0.60, P(yes) = 0.4 → contributes 0.4, fires nothing
	alreadyDone: noul(0.4), // same
	actionable: choice("no", 0.9, { yes: 0, no: 1 }), // counts "no" → contributes 1.0
};

// Every fixture in the file, for the matrix-wide purity + vocabulary tests.
const FIXTURES: { name: string; answers: Record<string, GateAnswer | null>; policy: FollowupDecisionPolicy }[] = [
	{ name: "file/noul-threshold", answers: { duplicate: noul(0.5), alreadyDone: noul(0.4), actionable: choice("no", 0.9, { yes: 0, no: 1 }) }, policy },
	{ name: "merge/composite", answers: mergeSet, policy },
	{ name: "drop/override", answers: { ...mergeSet, alreadyDone: noul(0.9) }, policy },
	{ name: "unanswered/absent", answers: {}, policy },
	{ name: "unanswered/null", answers: { duplicate: null, alreadyDone: noul(0.4), actionable: choice("no", 0.9, { yes: 0, no: 1 }) }, policy },
	{ name: "floor/choice", answers: { ...mergeSet, actionable: choice("no", 0.4, { yes: 0, no: 1 }) }, policy },
	{ name: "carve-out/noul", answers: { ...mergeSet, alreadyDone: noul(0.55) }, policy },
	{ name: "carve-out/choice", answers: { ...mergeSet, duplicate: choice("yes", 0.4, { yes: 1, no: 0 }) }, policy },
	{ name: "override-fire/merge", answers: { duplicate: choice("yes", 0.9, { yes: 1, no: 0 }), alreadyDone: noul(0.4), actionable: choice("no", 0.9, { yes: 0, no: 1 }) }, policy },
	{ name: "override-order/drop-first", answers: { duplicate: choice("yes", 0.9, { yes: 1, no: 0 }), alreadyDone: noul(0.9), actionable: choice("no", 0.9, { yes: 0, no: 1 }) }, policy },
];

// A hand-built policy for the unweighted-answer discriminator (obligations
// 11–13): one weighted question, generous merge threshold, no overrides.
const discrimPolicy: FollowupDecisionPolicy = {
	version: "discrim-1",
	weights: { a: 1 },
	countedOption: { a: "no" },
	floors: { choice: 0.6 },
	noulThreshold: 0.6,
	noulProbabilityOf: "yes",
	thresholds: { merge: 0.5, drop: 5 },
	overrides: [],
};

// ---------------------------------------------------------------------------
// Obligation 1: each disposition on packaged data, basis byte-exact
// ---------------------------------------------------------------------------

test("each disposition is reachable on packaged data with byte-exact bases", () => {
	expect(decideFollowup(FIXTURES[0].answers, policy)).toEqual({
		disposition: "File",
		basis: "duplicate: certainty 0.50 < noul threshold 0.60",
	});
	expect(decideFollowup(mergeSet, policy)).toEqual({
		disposition: "Merge",
		basis: "composite 1.80 ≥ merge threshold 1.00",
	});
	expect(decideFollowup({ ...mergeSet, alreadyDone: noul(0.9) }, policy)).toEqual({
		disposition: "Drop",
		basis: "alreadyDone? yes (already resolved or obsolete)",
	});
});

// ---------------------------------------------------------------------------
// Obligation 2: fail-safe arm A — a below-floor choice answer Files even
// when the composite alone would Merge (precedence, not just outcome)
// ---------------------------------------------------------------------------

test("a below-floor choice answer Files even though the composite alone would Merge", () => {
	// actionable's confidence 0.40 < 0.60, yet its counted probability still
	// feeds the composite: 0.4 + 0.4 + 1.0 = 1.80 ≥ 1.0 → Merge if floors were
	// ignored. The floor wins because it is evaluated first (R4).
	const d = decideFollowup({ ...mergeSet, actionable: choice("no", 0.4, { yes: 0, no: 1 }) }, policy);
	expect(d).toEqual({ disposition: "File", basis: "actionable: confidence 0.40 < choice floor 0.60" });
});

// ---------------------------------------------------------------------------
// Obligation 3: fail-safe arm B — a below-threshold noul Files even though
// its override would fire (P(yes) = 0.55 > 0.5)
// ---------------------------------------------------------------------------

test("a below-threshold noul answer Files although its Merge override would fire", () => {
	// certainty(0.55) = 0.55 < 0.60 → File; the duplicate override fires at
	// P(yes) > 0.5, so an override-blind composite would have said Merge.
	const d = decideFollowup({ ...mergeSet, duplicate: noul(0.55) }, policy);
	expect(d).toEqual({ disposition: "File", basis: "duplicate: certainty 0.55 < noul threshold 0.60" });
});

// ---------------------------------------------------------------------------
// Obligation 4: unanswered weighted question → File naming the FIRST
// declared weight id; null ≡ absent (one code path, byte-identical basis)
// ---------------------------------------------------------------------------

test("an unanswered weighted question Files naming the first declared weight id; null is byte-identical to absent", () => {
	const absent = decideFollowup({}, policy);
	expect(absent).toEqual({ disposition: "File", basis: "duplicate: unanswered" });
	const nulled = decideFollowup(
		{ duplicate: null, alreadyDone: noul(0.4), actionable: choice("no", 0.9, { yes: 0, no: 1 }) },
		policy,
	);
	expect(nulled.basis).toBe(absent.basis);
});

// ---------------------------------------------------------------------------
// Obligation 5: the R4 carve-out on both floored types — an override whose
// answer is below its floor never fires; the same rules FIRING on
// confident input (gated, not dead)
// ---------------------------------------------------------------------------

test("carve-out: an alreadyDone noul(0.55) Files although the Drop override would fire on its own merits", () => {
	const d = decideFollowup({ ...mergeSet, alreadyDone: noul(0.55) }, policy);
	expect(d).toEqual({ disposition: "File", basis: "alreadyDone: certainty 0.55 < noul threshold 0.60" });
});

test("carve-out: a duplicate choice(yes, conf 0.4) Files although the Merge override would fire", () => {
	const d = decideFollowup({ ...mergeSet, duplicate: choice("yes", 0.4, { yes: 1, no: 0 }) }, policy);
	expect(d).toEqual({ disposition: "File", basis: "duplicate: confidence 0.40 < choice floor 0.60" });
});

test("the same rules fire on confident input — gated, not dead", () => {
	const d = decideFollowup(
		{ duplicate: choice("yes", 0.9, { yes: 1, no: 0 }), alreadyDone: noul(0.4), actionable: choice("no", 0.9, { yes: 0, no: 1 }) },
		policy,
	);
	expect(d).toEqual({ disposition: "Merge", basis: "duplicate? yes (same work as an open card)" });
	// alreadyDone firing on its own merits is pinned by the Drop fixture
	// (obligation 1): "alreadyDone? yes (already resolved or obsolete)".
});

// ---------------------------------------------------------------------------
// Obligation 6: override ordering pin — first declared rule wins
// ---------------------------------------------------------------------------

test("two simultaneously firing overrides resolve in declared order (alreadyDone → Drop)", () => {
	const d = decideFollowup(
		{ duplicate: choice("yes", 0.9, { yes: 1, no: 0 }), alreadyDone: noul(0.9), actionable: choice("no", 0.9, { yes: 0, no: 1 }) },
		policy,
	);
	expect(d).toEqual({ disposition: "Drop", basis: "alreadyDone? yes (already resolved or obsolete)" });
});

// ---------------------------------------------------------------------------
// Obligation 7: composite band walk on a tmpdir repo-local fixture
// (overrides: [], tuned thresholds) — exact-== lands in the band, one tick
// below falls to the lower band. Composite-Drop is unreachable on packaged
// data for well-formed answers (note 1: 1.8 < 2.0), so the Drop arm is
// exercised here.
// ---------------------------------------------------------------------------

function bandPolicyFrom(root: string, thresholds: { merge: number; drop: number }): FollowupDecisionPolicy {
	const dir = path.join(root, CONFIG_DIR_NAME, "council", "gate", "followup");
	fs.mkdirSync(dir, { recursive: true });
	fs.writeFileSync(
		path.join(dir, "decision.json"),
		JSON.stringify({
			version: "band-1",
			weights: { a: 1 },
			countedOption: { a: "yes" },
			floors: { choice: 0.6 },
			noulThreshold: 0.6,
			noulProbabilityOf: "yes",
			thresholds,
			overrides: [],
		}),
	);
	return loadFollowupDecision(root);
}

test("composite band walk: exact-==-merge lands Merge; one tick below falls to File", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "ev79-band-"));
	const p = bandPolicyFrom(root, { merge: 0.5, drop: 0.9 });
	expect(decideFollowup({ a: choice("yes", 0.9, { yes: 0.5, no: 0.5 }) }, p)).toEqual({
		disposition: "Merge",
		basis: "composite 0.50 ≥ merge threshold 0.50",
	});
	expect(decideFollowup({ a: choice("yes", 0.9, { yes: 0.49, no: 0.51 }) }, p)).toEqual({
		disposition: "File",
		basis: "composite 0.49 < merge threshold 0.50",
	});
});

test("composite band walk: exact-==-drop lands Drop; one tick below falls to Merge", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "ev79-band-"));
	const p = bandPolicyFrom(root, { merge: 0.4, drop: 0.5 });
	expect(decideFollowup({ a: choice("yes", 0.9, { yes: 0.5, no: 0.5 }) }, p)).toEqual({
		disposition: "Drop",
		basis: "composite 0.50 ≥ drop threshold 0.50",
	});
	expect(decideFollowup({ a: choice("yes", 0.9, { yes: 0.49, no: 0.51 }) }, p)).toEqual({
		disposition: "Merge",
		basis: "composite 0.49 ≥ merge threshold 0.40",
	});
});

// ---------------------------------------------------------------------------
// Obligation 8: vocabulary-only-returnable — matrix-wide membership plus
// the union is exactly {File, Merge, Drop}, with a static type-level pin
// ---------------------------------------------------------------------------

test("every fixture's disposition is in FOLLOWUP_DISPOSITIONS and the union is exactly File, Merge, Drop", () => {
	const seen = new Set<string>();
	for (const f of FIXTURES) {
		const d = decideFollowup(f.answers, f.policy);
		expect(FOLLOWUP_DISPOSITIONS).toContain(d.disposition);
		seen.add(d.disposition);
	}
	expect([...seen].sort()).toEqual(["Drop", "File", "Merge"]);
});

test("the disposition vocabulary is exactly the three names, type-level", () => {
	// Static: the const tuple IS the three names, in order — the assignment
	// below fails to compile if the vocabulary ever drifts.
	const vocab: readonly ["File", "Merge", "Drop"] = FOLLOWUP_DISPOSITIONS;
	expect([...vocab]).toEqual(["File", "Merge", "Drop"]);
	// Static exhaustiveness: a switch over FollowupDisposition has no
	// leftover arm (the never arm fails to compile if a value is added).
	const exhaustive = (d: FollowupDisposition): string => {
		switch (d) {
			case "File":
				return "File";
			case "Merge":
				return "Merge";
			case "Drop":
				return "Drop";
			default: {
				const _unreachable: never = d;
				return _unreachable;
			}
		}
	};
	expect(exhaustive("File")).toBe("File");
});

// ---------------------------------------------------------------------------
// Obligation 9: purity — two identical calls → byte-identical whole result,
// across every fixture in the file
// ---------------------------------------------------------------------------

test("two identical calls yield byte-identical whole results (behavioral purity)", () => {
	for (const f of FIXTURES) {
		const first = JSON.stringify(decideFollowup(f.answers, f.policy));
		const second = JSON.stringify(decideFollowup(f.answers, f.policy));
		expect(first).toBe(second);
	}
});

// ---------------------------------------------------------------------------
// Obligation 10: fail-loud runtime arms — each throws naming the id, with
// the followup: prefix so the two domains' errors never confound
// ---------------------------------------------------------------------------

test("a score answer throws naming the id (the followup has no score floor)", () => {
	expect(() =>
		decideFollowup(
			{ ...mergeSet, duplicate: { type: "score", score: 0, legend: ["a", "b"], probabilities: { "0": 1, "1": 0 }, confidence: 0.9 } },
			policy,
		),
	).toThrow(/followup: decideFollowup — answer duplicate/);
});

test("an unknown answer type throws naming the id", () => {
	expect(() => decideFollowup({ ...mergeSet, actionable: { type: "nonsense" } }, policy)).toThrow(
		/followup: decideFollowup — answer actionable/,
	);
});

test("a choice answer missing its confidence throws naming the id", () => {
	expect(() =>
		decideFollowup({ ...mergeSet, actionable: { type: "choice", value: "no", probabilities: { yes: 0, no: 1 } } }, policy),
	).toThrow(/followup: decideFollowup — answer actionable/);
	expect(() =>
		decideFollowup({ ...mergeSet, actionable: { type: "choice", value: "no", probabilities: { yes: 0, no: 1 }, confidence: "high" } }, policy),
	).toThrow(/followup: decideFollowup — answer actionable/);
});

test("a noul answer missing or out-of-range probability throws naming the id", () => {
	expect(() => decideFollowup({ ...mergeSet, duplicate: { type: "noul" } }, policy)).toThrow(
		/followup: decideFollowup — answer duplicate/,
	);
	expect(() => decideFollowup({ ...mergeSet, duplicate: { type: "noul", probability: 1.5 } }, policy)).toThrow(
		/followup: decideFollowup — answer duplicate/,
	);
});

// ---------------------------------------------------------------------------
// Obligation 11: determinism across insertion orders (settles open
// objection O1) — two identical maps differing only in key order, each with
// two below-floor unweighted present answers, yield byte-identical basis
// ---------------------------------------------------------------------------

test("identical maps differing only in insertion order yield byte-identical bases (phase-1b canonical order)", () => {
	const bBelow = choice("yes", 0.1, { yes: 1, no: 0 });
	const cBelow = choice("yes", 0.1, { yes: 1, no: 0 });
	const mapA: Record<string, GateAnswer | null> = {
		duplicate: noul(0.4),
		alreadyDone: noul(0.4),
		actionable: choice("no", 0.9, { yes: 0, no: 1 }),
		b: bBelow,
		c: cBelow,
	};
	const mapB: Record<string, GateAnswer | null> = {
		c: cBelow,
		b: bBelow,
		actionable: choice("no", 0.9, { yes: 0, no: 1 }),
		alreadyDone: noul(0.4),
		duplicate: noul(0.4),
	};
	const a = decideFollowup(mapA, policy);
	const b = decideFollowup(mapB, policy);
	expect(a.basis).toBe(b.basis);
	// Unweighted ids are floored in canonical sorted key order: b sorts
	// before c, so the basis names b regardless of insertion order.
	expect(a.basis).toBe("b: confidence 0.10 < choice floor 0.60");
});

// ---------------------------------------------------------------------------
// Obligation 12: unweighted below-floor discriminator — floor-everything,
// not ignore-unweighted (which would Merge on the composite alone)
// ---------------------------------------------------------------------------

test("an unweighted below-floor answer Files with a floor basis although the weighted answers would Merge", () => {
	// If unweighted answers were ignored: composite = 1.0 (a counts "no" with
	// probability 1) ≥ 0.5 → Merge. Floor-everything: b's confidence 0.10 <
	// 0.60 → File, first, in canonical order.
	const d = decideFollowup(
		{ a: choice("no", 0.9, { yes: 0, no: 1 }), b: choice("yes", 0.1, { yes: 1, no: 0 }) },
		discrimPolicy,
	);
	expect(d).toEqual({ disposition: "File", basis: "b: confidence 0.10 < choice floor 0.60" });
});

// ---------------------------------------------------------------------------
// Obligation 13: an unweighted present answer of unknown type throws
// naming the id (floor-everything shape-validates; owner round-2 position)
// ---------------------------------------------------------------------------

test("an unweighted present answer of unknown type throws naming the id", () => {
	expect(() => decideFollowup({ a: choice("no", 0.9, { yes: 0, no: 1 }), b: { type: "nonsense" } }, discrimPolicy)).toThrow(
		/followup: decideFollowup — answer b/,
	);
});

// ---------------------------------------------------------------------------
// Obligation 14: sideProbability refactor safety — every existing decide()
// basis string is unchanged and test/gate-decide.test.ts stays green
// unchanged. The proof is that file's own run in the same suite; no new
// assertion duplicates it here.
// ---------------------------------------------------------------------------
