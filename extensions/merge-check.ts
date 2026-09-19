// EV-70 — the mode→criteria merge check: the deterministic merge-check step
// of /features-deliver as an executable, pure expression.
//
// The mode is read from the run substrate (EV-68's ROOT-manifest `mode`
// field, via gate-route.ts's readCardMode over the real runs.ts readers) and
// keys ONE ruleset — never a seat's report, never an inference:
//
//   Deliberate — criteria 1–5, verbatim.
//   Verify     — criteria 1–5, with criterion 3's basis mode-scoped to the
//                single Verify skeptic dispatch (prose-side scoping; the
//                observation is the same flag).
//   Direct     — criteria 1, 2, 5 only — no skeptic and no judge are
//                dispatched; the test suite is that mode's only gate (R4).
//
// Two HALTs precede any criteria weighing, and their lines are verbatim
// (asserted by test/ev70-merge-check.test.ts and pinned in
// test/prose.test.ts):
//
//   no recorded execution mode → the merge check cannot infer one; inferring
//   a mode is exactly the discretion the check exists to remove.
//
//   a mode that requires a goal evaluation (Deliberate or Verify) with no
//   goal-evaluation record → the honest outcome for a missing verdict; only
//   Direct merges with no judge verdict present.
//
// This module is pure — it imports no reader, takes no mode parameter other
// than the substrate-read result, and touches no disk.
import type { DispatchMode } from "./runs.ts";

export interface MergeCheckObservations {
	/** Criterion 1 — every owner gate green, in full. */
	ownerGatesGreen: boolean;
	/** Criterion 2 — the `gates` workflow appears with `state: SUCCESS` on the
	 * PR head SHA (keyed on the `workflow` field of
	 * `gh pr checks <PR> --json name,state,workflow`; an absent check is not a
	 * passing check). */
	gatesWorkflowSuccessOnHeadSha: boolean;
	/** Criterion 3 — no blocking skeptic objection (Verify: the single Verify
	 * skeptic dispatch; Deliberate: steps 4/9). */
	noBlockingSkepticObjection: boolean;
	/** Criterion 4 — the goal-evaluation record: the fresh-context judge's
	 * verdict. `undefined` = no goal-evaluation record. */
	goalEvaluation: "PASS" | "REJECT" | undefined;
	/** Criterion 5 — no `Needs Human` state or outstanding ruling on the card. */
	noNeedsHumanOrOutstandingRuling: boolean;
}

export type MergeCheckResult =
	| { decision: "merge"; mode: DispatchMode; ledgerBasis: string }
	| { decision: "halt"; line: string }
	| { decision: "no-merge"; mode: DispatchMode; failedCriteria: number[] };

/** The mode→criteria table: Direct relaxes only criteria 3 and 4; every
 * other mode carries all five. */
export function mergeCriteriaFor(mode: DispatchMode): readonly number[] {
	return mode === "Direct" ? [1, 2, 5] : [1, 2, 3, 4, 5];
}

const MODE_REQUIRES_GOAL_EVALUATION: Record<DispatchMode, boolean> = {
	Deliberate: true,
	Verify: true,
	Direct: false,
};

/** The merge check, mechanically. `mode` is the substrate read's result —
 * `undefined` only when the ROOT carries no recorded mode (readCardMode's
 * `no-recorded-mode`), never an inference. */
export function evaluateMergeCheck(
	cardId: string,
	mode: DispatchMode | undefined,
	obs: MergeCheckObservations,
): MergeCheckResult {
	if (mode === undefined) {
		return {
			decision: "halt",
			line: `HALT: ${cardId} has no recorded execution mode — the merge check cannot infer one; route the card at the approval gate`,
		};
	}
	if (MODE_REQUIRES_GOAL_EVALUATION[mode] && obs.goalEvaluation === undefined) {
		return {
			decision: "halt",
			line: `HALT: ${cardId} — mode ${mode} requires a goal evaluation and none is recorded`,
		};
	}
	const holds: Record<number, boolean> = {
		1: obs.ownerGatesGreen,
		2: obs.gatesWorkflowSuccessOnHeadSha,
		3: obs.noBlockingSkepticObjection,
		4: obs.goalEvaluation === "PASS",
		5: obs.noNeedsHumanOrOutstandingRuling,
	};
	const failedCriteria = mergeCriteriaFor(mode).filter((n) => !holds[n]);
	if (failedCriteria.length > 0) return { decision: "no-merge", mode, failedCriteria };
	const criteria = mergeCriteriaFor(mode)
		.map(String)
		.join(", ");
	return {
		decision: "merge",
		mode,
		// The Phase 3 per-card ledger entry's basis: the recorded execution
		// mode named beside the criteria (the ONLY Phase 3 report change).
		ledgerBasis: `${cardId} — mode ${mode}, criteria ${criteria} satisfied`,
	};
}
