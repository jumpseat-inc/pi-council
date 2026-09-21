// EV-81 — the probability-range residual (the fold-in ruling's how), pinned
// as a red-at-base falsifier. Every import here resolves at the pre-EV-81
// base sha (gate.ts, gate-run.ts, gate-ledger.ts, gate-transport.ts all
// exist there), so the file runs unchanged at base and at head:
//   - at base, `sideProbability`'s choice branch returns ANY finite value,
//     so a weighted choice answer carrying `probabilities{no: 1.5}` pushes a
//     composite past the thresholds (the dangerous direction) — every
//     throw-expectation below fails red against base;
//   - at head, a finite value outside [0, 1] throws (domain-neutral message
//     naming the question id, the option, the value, and the expected
//     [0, 1] range), so:
//       * `decideFollowup` throws (the followup arm; the orchestration's
//         invalid-response catch-all then resolves File — asserted in
//         test/ev81-followup-run.test.ts, which cannot run at base);
//       * the shipped `decide()` throws inside runGate's try, whose
//         invalid-response catch-all records Deliberate (was: possibly
//         Direct) — asserted here against the real runGate.
// Frozen posture (unchanged at base AND head, obligation 9): an absent or
// non-numeric probability still contributes 0 — missing evidence drags
// toward the safe side and must NOT become an error.
import { test, expect } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import {
	GATE_PINNED_MODEL,
	decide,
	decideFollowup,
	loadFollowupDecision,
	type GateAnswer,
	type GateDecisionPolicy,
	type GatePolicy,
	type GateQuestionSet,
} from "../extensions/gate.ts";
import type { GateState } from "../extensions/gate-state.ts";
import { gateLedgerPath, readGateLedger } from "../extensions/gate-ledger.ts";
import type { GateTransport } from "../extensions/gate-transport.ts";
import { runGate } from "../extensions/gate-run.ts";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const noul = (probability: number): GateAnswer => ({ type: "noul", probability });
/** Explicit probabilities so composite arithmetic is hand-checkable. */
const choice = (value: string, confidence: number, probs: Record<string, number>): GateAnswer => ({
	type: "choice",
	value,
	probabilities: probs,
	confidence,
});

/** The packaged followup decision policy (loads from a nonexistent repo
 * root, exactly as test/ev79-followup-decide.test.ts does). */
const followupPolicy = loadFollowupDecision("/nonexistent-repo-root-ev81");

/** mergeSet from ev79 with actionable's counted "no" probability out of
 * range: 0.4 + 0.4 + 1.5 = 2.30 ≥ drop threshold 2.00 — the observed red
 * premise (the skeptic's O2 probe: {Drop, "composite 2.30 ≥ drop threshold
 * 2.00"}). */
const outOfRangeSet: Record<string, GateAnswer | null> = {
	duplicate: noul(0.4),
	alreadyDone: noul(0.4),
	actionable: choice("no", 0.9, { yes: 0, no: 1.5 }),
};

// A hand-built card decision policy: one noul + one weighted choice; the
// out-of-range "no" probability (weight 2) pushes the composite to
// 0.9 + 3.0 = 3.9 ≥ direct threshold 3.4 → Direct at base (the EV-79-recorded
// flip, O3). After the fix decide() throws before any composite.
const cardPolicy: GateDecisionPolicy = {
	version: "ev81-range-card-1",
	weights: { gate: 1, prob: 2 },
	mechanical: { gate: "yes", prob: "no" },
	floors: { choice: 0.6, score: 0.6 },
	noulThreshold: 0.6,
	noulProbabilityOf: "yes",
	thresholds: { verify: 2.6, direct: 3.4 },
	overrides: [],
};

const cardQuestions: GateQuestionSet = {
	version: "ev81-range-qs-1",
	questions: {
		gate: { type: "noul", instructions: "Gate?", criteria: { yes: "yes side", no: "no side" } },
		prob: { type: "choice", instructions: "Prob?", criteria: { yes: "yes side", no: "no side" } },
	},
};

const CARD_STATE: GateState = {
	stateBytes: new TextEncoder().encode(JSON.stringify({ card: { id: "EV-81", title: "t" } })),
	stateHash: "sha256:ev81-range-fake-state-hash",
	drops: [],
};

const CARD_POLICY: GatePolicy = {
	policyVersion: "ev81-range-policy-1",
	mode: "active",
	model: GATE_PINNED_MODEL,
	endpoint: "https://gate.test/api/alpha/decisions",
	gateStateBudgetTokens: 32000,
};

const CARD_ANSWERS = JSON.stringify({
	model: "typesafe/jev-1.13-20260917",
	answers: {
		gate: { type: "noul", probability: 0.9 },
		prob: { type: "choice", value: "no", probabilities: { yes: 0, no: 1.5 }, confidence: 0.9 },
	},
	usage: { input_tokens: 10, output_tokens: 5, cost: 0.001 },
	provider: "Typesafe",
	id: "gen-dec-ev81-range",
});

const okDouble = (body: string): GateTransport => async (req) => {
	void req;
	return { ok: true, status: 200, body };
};

function tmpRepo(): string {
	return fs.mkdtempSync(path.join(os.tmpdir(), "ev81-range-repo-"));
}

// ---------------------------------------------------------------------------
// The followup arm — decideFollowup throws on an out-of-range choice
// probability (red at base: it returned {Drop, "composite 2.30 ≥ ..."})
// ---------------------------------------------------------------------------

test("range residual (followup arm): decideFollowup throws on a weighted choice probability outside [0,1]", () => {
	let err: unknown;
	try {
		decideFollowup(outOfRangeSet, followupPolicy);
	} catch (e) {
		err = e;
	}
	expect(err).toBeInstanceOf(Error);
	const message = (err as Error).message;
	// Names the question id, the option, the value, and the expected range…
	expect(message).toContain("actionable");
	expect(message).toContain('"no"');
	expect(message).toContain("1.5");
	expect(message).toContain("[0, 1]");
	// …and is domain-neutral from birth — neither domain's prefix (the
	// reason rides verbatim into `gate call failed: <reason>`).
	expect(message.startsWith("gate:")).toBe(false);
	expect(message.startsWith("followup:")).toBe(false);
});

test("range residual (followup arm): a negative probability throws with the same domain-neutral grammar", () => {
	// The negative sits on the COUNTED option (packaged countedOption.actionable
	// = "no"): the helper reads the counted side's value, so that is where an
	// out-of-range value throws. An uncounted side's probability is never read
	// and therefore never validated — the same posture as absent/non-numeric.
	expect(() =>
		decideFollowup(
			{ ...outOfRangeSet, actionable: choice("no", 0.9, { yes: 0, no: -0.1 }) },
			followupPolicy,
		),
	).toThrow(/-0\.1[\s\S]*\[0, 1\]/);
});

// ---------------------------------------------------------------------------
// The card-gate arm — the shipped decide() throws, and runGate's
// invalid-response catch-all records Deliberate (was: possibly Direct)
// ---------------------------------------------------------------------------

test("range residual (card arm): shipped decide() throws on an out-of-range choice probability", () => {
	const answers: Record<string, GateAnswer | null> = {
		gate: noul(0.9),
		prob: choice("no", 0.9, { yes: 0, no: 1.5 }),
	};
	expect(() => decide(answers, cardPolicy)).toThrow(/prob[\s\S]*"no"[\s\S]*1\.5[\s\S]*\[0, 1\]/);
});

test("range residual (card arm): runGate carrying an out-of-range probability records invalid-response → Deliberate", async () => {
	const repo = tmpRepo();
	const r = await runGate(CARD_STATE, cardQuestions, {
		repoRoot: repo,
		policy: CARD_POLICY,
		decisionPolicy: cardPolicy,
		transport: okDouble(CARD_ANSWERS),
		apiKey: "k-test",
	});
	expect(r.status).toBe("failed");
	expect(r.decision.mode).toBe("Deliberate");
	expect(r.failure?.kind).toBe("invalid-response");
	// The verbatim reason rides the composite basis exactly once.
	expect(r.decision.basis.startsWith("gate call failed: ")).toBe(true);
	expect(r.decision.basis).toContain("1.5");
	expect(r.decision.basis).toContain("[0, 1]");
	// One ledger line, resolvedMode Deliberate.
	const lines = readGateLedger(repo).calls;
	expect(lines.length).toBe(1);
	expect(lines[0]!.resolvedMode).toBe("Deliberate");
	expect(lines[0]!.basis).toBe(r.decision.basis);
	expect(gateLedgerPath(repo)).toBeTruthy();
});

// ---------------------------------------------------------------------------
// Frozen posture (obligation 9) — absent/non-numeric probabilities still
// contribute 0; these are green at base AND at head.
// ---------------------------------------------------------------------------

test("frozen: an absent counted-option probability contributes 0 (followup arm)", () => {
	const d = decideFollowup(
		{
			duplicate: noul(0.4),
			alreadyDone: noul(0.4),
			actionable: choice("no", 0.9, { yes: 0 }), // "no" absent → 0
		},
		followupPolicy,
	);
	// 0.4 + 0.4 + 0 = 0.80 < merge 1.00 → File (missing evidence drags toward
	// the safe side; it must NOT become an error).
	expect(d.disposition).toBe("File");
});

test("frozen: a non-numeric counted-option probability contributes 0 (followup arm)", () => {
	const d = decideFollowup(
		{
			duplicate: noul(0.4),
			alreadyDone: noul(0.4),
			actionable: { type: "choice", value: "no", probabilities: { no: "high" }, confidence: 0.9 },
		},
		followupPolicy,
	);
	expect(d.disposition).toBe("File");
});

test("frozen: an absent/non-numeric probability contributes 0 (card arm drags toward Deliberate)", () => {
	const missing = decide(
		{ gate: noul(0.9), prob: choice("no", 0.9, { yes: 0 }) },
		cardPolicy,
	);
	// 0.9 + 0 = 0.90 < verify 2.6 → Deliberate.
	expect(missing.mode).toBe("Deliberate");
	const nonNumeric = decide(
		{ gate: noul(0.9), prob: { type: "choice", value: "no", probabilities: { no: "high" }, confidence: 0.9 } },
		cardPolicy,
	);
	expect(nonNumeric.mode).toBe("Deliberate");
});
