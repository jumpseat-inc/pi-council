// EV-70 — the mode-aware merge check: the fixture proof of the merge-check
// step of /features-deliver.
//
// The headline arms, from the card's goal verbatim: a green Direct card with
// no goal-evaluation record merges; an otherwise-identical Verify card with
// no goal-evaluation record HALTs. The mode is read from the run substrate —
// the ROOT manifest's EV-68 `mode` field, through the REAL
// extensions/runs.ts readers (`writeManifest` on the way in,
// `readManifests` on the way out) — never from a seat's report; a card with
// no recorded mode HALTs rather than merging. The two HALT lines are
// asserted verbatim.
//
// The mode read is EV-69's authority read: `readCardMode`, the pure core
// `effectiveModeForCard` delegates to (the same read the parent-only
// `council_route` op "authority" performs). The mode→criteria table is
// `evaluateMergeCheck` (extensions/merge-check.ts).
//
// RED-BASE RECORD: seven fields in the PR body — falsifiers observed red at
// 6e369b2, where extensions/merge-check.ts does not exist.
import { test, expect, afterAll } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { evaluateMergeCheck, type MergeCheckObservations } from "../extensions/merge-check.ts";
import { effectiveModeForCard, readCardMode } from "../extensions/gate-route.ts";
import { ensureRunDir, readManifests, writeManifest, type RunManifest } from "../extensions/runs.ts";

const RUN = "run-ev70";
const CARD_ID = "EV-950";

// The two HALT lines, verbatim (the card's Acceptance text).
const HALT_NO_MODE = `HALT: ${CARD_ID} has no recorded execution mode — the merge check cannot infer one; route the card at the approval gate`;
const HALT_GOAL_EVAL = (mode: string): string =>
	`HALT: ${CARD_ID} — mode ${mode} requires a goal evaluation and none is recorded`;

/** The green-owner-gates observations: criteria 1, 2, 5 hold; criterion 3
 * holds; and NO goal-evaluation record exists (no judge verdict present) —
 * exactly the shape both headline cards share. */
const GREEN_NO_JUDGE: MergeCheckObservations = {
	ownerGatesGreen: true,
	gatesWorkflowSuccessOnHeadSha: true,
	noBlockingSkepticObjection: true,
	goalEvaluation: undefined,
	noNeedsHumanOrOutstandingRuling: true,
};

const repos: string[] = [];
afterAll(() => {
	for (const r of repos.splice(0)) {
		try {
			fs.rmSync(r, { recursive: true, force: true });
		} catch {
			/* best effort */
		}
	}
});

function scratch(label: string): string {
	const repo = fs.mkdtempSync(path.join(os.tmpdir(), `ev70-${label}-`));
	repos.push(repo);
	ensureRunDir(repo, RUN);
	return repo;
}

/** A ROOT manifest through the REAL writer — `mode` present or absent
 * (key-absence, EV-68's spread-gate shape). */
function rootManifest(repo: string, id: string, over: Partial<RunManifest> = {}): void {
	const m: RunManifest = {
		id,
		seat: "council-runner",
		model: "m/x",
		parentJobId: null,
		pid: null,
		sessionId: id,
		state: "done",
		startedAt: 1,
		settledAt: 2,
		exitCode: 0,
		...over,
	};
	writeManifest(repo, RUN, m);
}

/** The substrate read the merge check performs: real readers, ROOT id keyed. */
function substrateMode(repo: string, rootId: string): RunManifest["mode"] {
	const read = readCardMode(readManifests(repo, RUN), [rootId]);
	return read.present ? read.mode : undefined;
}

// ---------------------------------------------------------------------------
// Headline pair — the card's goal, both arms
// ---------------------------------------------------------------------------

test("headline Direct arm: a green Direct card with no goal-evaluation record merges, its ledger basis naming the recorded mode", () => {
	const repo = scratch("direct");
	rootManifest(repo, "root-direct", { mode: "Direct" });
	// the mode read goes through the disk path too — the real substrate
	expect(effectiveModeForCard(repo, RUN, "root-direct")).toBe("Direct");
	const mode = substrateMode(repo, "root-direct");

	const res = evaluateMergeCheck(CARD_ID, mode, GREEN_NO_JUDGE);
	expect(res.decision).toBe("merge");
	if (res.decision !== "merge") return;
	expect(res.mode).toBe("Direct");
	// the Phase 3 ledger line: the recorded execution mode beside the basis
	expect(res.ledgerBasis).toBe("EV-950 — mode Direct, criteria 1, 2, 5 satisfied");
});

test("headline Verify arm: the otherwise-identical Verify card with no goal-evaluation record HALTs with the verbatim line", () => {
	const repo = scratch("verify");
	rootManifest(repo, "root-verify", { mode: "Verify" });
	const mode = substrateMode(repo, "root-verify");
	expect(mode).toBe("Verify");

	const res = evaluateMergeCheck(CARD_ID, mode, GREEN_NO_JUDGE);
	expect(res.decision).toBe("halt");
	if (res.decision !== "halt") return;
	expect(res.line).toBe(HALT_GOAL_EVAL("Verify"));
});

// ---------------------------------------------------------------------------
// No recorded mode — the check never infers one
// ---------------------------------------------------------------------------

test("no-recorded-mode arm: a mode-less ROOT halts with the verbatim no-inference line", () => {
	const repo = scratch("nomode");
	rootManifest(repo, "root-nomode"); // no `mode` key — pre-EV-68 shape
	const read = readCardMode(readManifests(repo, RUN), ["root-nomode"]);
	expect(read).toEqual({ present: false, reason: "no-recorded-mode" });

	const res = evaluateMergeCheck(CARD_ID, undefined, GREEN_NO_JUDGE);
	expect(res.decision).toBe("halt");
	if (res.decision !== "halt") return;
	expect(res.line).toBe(HALT_NO_MODE);
});

// ---------------------------------------------------------------------------
// Substrate authority — the mode comes from the manifest bytes, never a
// seat's report: there is no mode parameter on the observation input, and
// flipping the ROOT manifest's `mode` field flips the decision
// ---------------------------------------------------------------------------

test("substrate authority arm: flipping the ROOT manifest's mode field flips the decision — the substrate, not a report, decides", () => {
	const repo = scratch("authority");
	rootManifest(repo, "root-a", { mode: "Direct" });
	const before = evaluateMergeCheck(CARD_ID, substrateMode(repo, "root-a"), GREEN_NO_JUDGE);
	expect(before.decision).toBe("merge");

	// The "seat report" has no pathway into the check: the only mode input is
	// the substrate read. Rewrite the manifest bytes and the decision flips.
	rootManifest(repo, "root-a", { mode: "Verify" });
	const after = evaluateMergeCheck(CARD_ID, substrateMode(repo, "root-a"), GREEN_NO_JUDGE);
	expect(after.decision).toBe("halt");
	if (after.decision !== "halt") return;
	expect(after.line).toBe(HALT_GOAL_EVAL("Verify"));
});

// ---------------------------------------------------------------------------
// The Deliberate column — all five, verbatim; the goal-evaluation HALT names
// the mode
// ---------------------------------------------------------------------------

test("Deliberate arm: all five criteria satisfied merges with the mode named; a missing goal evaluation HALTs naming Deliberate", () => {
	const repo = scratch("deliberate");
	rootManifest(repo, "root-delib", { mode: "Deliberate" });
	const mode = substrateMode(repo, "root-delib");

	const judged: MergeCheckObservations = { ...GREEN_NO_JUDGE, goalEvaluation: "PASS" };
	const res = evaluateMergeCheck(CARD_ID, mode, judged);
	expect(res.decision).toBe("merge");
	if (res.decision !== "merge") return;
	expect(res.mode).toBe("Deliberate");
	expect(res.ledgerBasis).toBe("EV-950 — mode Deliberate, criteria 1, 2, 3, 4, 5 satisfied");

	const unjudged = evaluateMergeCheck(CARD_ID, mode, GREEN_NO_JUDGE);
	expect(unjudged.decision).toBe("halt");
	if (unjudged.decision !== "halt") return;
	expect(unjudged.line).toBe(HALT_GOAL_EVAL("Deliberate"));
});

// ---------------------------------------------------------------------------
// The Verify column — all five with the mode-scoped criterion 3; a recorded
// verdict is a criteria question, not the missing-record HALT
// ---------------------------------------------------------------------------

test("Verify arms: a recorded PASS merges; a recorded REJECT is a criteria failure (criterion 4), never the missing-record HALT; a skeptic objection fails criterion 3", () => {
	const repo = scratch("verify-judged");
	rootManifest(repo, "root-vj", { mode: "Verify" });
	const mode = substrateMode(repo, "root-vj");

	const pass = evaluateMergeCheck(CARD_ID, mode, { ...GREEN_NO_JUDGE, goalEvaluation: "PASS" });
	expect(pass.decision).toBe("merge");
	if (pass.decision === "merge") {
		expect(pass.ledgerBasis).toBe("EV-950 — mode Verify, criteria 1, 2, 3, 4, 5 satisfied");
	}

	const reject = evaluateMergeCheck(CARD_ID, mode, { ...GREEN_NO_JUDGE, goalEvaluation: "REJECT" });
	expect(reject.decision).toBe("no-merge");
	if (reject.decision !== "no-merge") return;
	expect(reject.mode).toBe("Verify");
	expect(reject.failedCriteria).toEqual([4]);

	const objected = evaluateMergeCheck(CARD_ID, mode, {
		...GREEN_NO_JUDGE,
		goalEvaluation: "PASS",
		noBlockingSkepticObjection: false,
	});
	expect(objected.decision).toBe("no-merge");
	if (objected.decision !== "no-merge") return;
	expect(objected.failedCriteria).toEqual([3]);
});

// ---------------------------------------------------------------------------
// The Direct column — criteria 1, 2, 5 still bind (R4: the test suite is its
// only gate, not a bypass of the gates it does have)
// ---------------------------------------------------------------------------

test("Direct arm: a failing owner gate, CI read, or outstanding ruling is a no-merge — Direct relaxes only criteria 3 and 4", () => {
	const repo = scratch("direct-gates");
	rootManifest(repo, "root-dg", { mode: "Direct" });
	const mode = substrateMode(repo, "root-dg");

	for (const [n, over] of [
		[1, { ownerGatesGreen: false }],
		[2, { gatesWorkflowSuccessOnHeadSha: false }],
		[5, { noNeedsHumanOrOutstandingRuling: false }],
	] as const) {
		const res = evaluateMergeCheck(CARD_ID, mode, { ...GREEN_NO_JUDGE, ...over });
		expect(res.decision).toBe("no-merge");
		if (res.decision !== "no-merge") continue;
		expect(res.mode).toBe("Direct");
		expect(res.failedCriteria).toEqual([n]);
	}
});

// ---------------------------------------------------------------------------
// The extraction boundary — effectiveModeForCard's fail-safe throws stay
// byte-identical (EV-69's contract), readCardMode distinguishes the two
// absence reasons
// ---------------------------------------------------------------------------

test("absent ROOT: readCardMode says no-root and effectiveModeForCard still throws with its named basis", () => {
	const repo = scratch("noroot");
	rootManifest(repo, "root-present", { mode: "Direct" }); // a different ROOT id
	const read = readCardMode(readManifests(repo, RUN), ["root-absent"]);
	expect(read).toEqual({ present: false, reason: "no-root" });
	expect(() => effectiveModeForCard(repo, RUN, "root-absent")).toThrow(/no ROOT manifest/);
});
