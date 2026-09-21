// EV-82 — the followup review's record side: `runFollowupReview`, the ONE
// engine-side composition that loads both followup files and reaches
// `buildFollowupState` (FLLWUP-96's composition site — a single function
// with up to two callers: the parent-session gate tool, and EV-83's runner
// transport), plus two thin tools:
//
//   - the parent-session `council_followup_gate` tool (this file, parent
//     path only), and
//   - the child-mode `council_followup_review` tool (EV-83): the runner
//     container's TRANSPORT to the same composition — an LLM container
//     cannot import TS, so the granted tool is the seam. It is a second
//     CALLER, never a second composition: `composeFollowupReview` runs
//     `runFollowupReview` then renders against the ACTUAL result object
//     (the join is by callId in-process — no model re-transmission of
//     mechanical facts), so every basis byte in a runner's report is
//     engine-derived by construction.
//
// Spec: docs/superpowers/specs/2026-09-22-EV-82-design.md §2 (settled).
//
// R3 posture, verbatim from gate-tool.ts: loadGatePolicy runs FIRST;
// mode "off" is a mechanical no-op `{ mode: "off", recorded: 0 }` BEFORE the
// followup loaders, the packer, any fetch, any ledger line, or any widget —
// an off repo-local policy may omit gateStateBudgetTokens, and
// buildFollowupState throws on its absence, so the short-circuit must
// precede the loaders exactly as council_gate's does.
//
// Sequentially per candidate (draft order): siblings = the other candidates
// in this call (one call carries all drafts; the sibling set is the run's
// drafted set by construction); buildFollowupState(candidate, repoRoot,
// siblings, boardPath) with boardPath = <repoRoot>/council/board.md (the
// cards-dir pair rule rides dirname(boardPath) inside the packer); then
// runFollowupGate — one ledger line per candidate on both arms. A
// runFollowupGate failure arm is RECORDED, not thrown.
//
// Thrown failures (a pre-POST guard, or the packer's own loud throws — the
// same-title draft set throws per candidate) are caught per candidate: the
// candidate yields a mechanical entry with callId: null and a GENERIC
// message — never runFollowupGate's guard text, never a verdict token — and
// ZERO ledger lines for the thrown candidate (skeptic O6/O2). The confirm
// gate still proceeds; the fail-safe direction is the human.
//
// Result opacity: mechanical, verdict-free facts only — title, callId,
// status, boardIds (the OPEN-only projection of sections.board), and
// siblingTitles. No disposition, no basis, no "Mode:" token in any returned
// string on any arm. opts.callId is never passed by the tool (the default
// randomUUID keeps callIds uncorrelatable by the reading model).
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import * as path from "node:path";
import { Type } from "typebox";
import { loadFollowupDecision, loadFollowupQuestions, loadGatePolicy } from "./gate.ts";
import { buildFollowupState, type FollowupCandidate } from "./followup-state.ts";
import { runFollowupGate, type RunFollowupOpts } from "./gate-run.ts";
import { renderFollowupLinesFromRepo } from "./followup-render.ts";

/** The in-flight widget key — the followup sibling of GATE_WIDGET_KEY; three
 * surfaces (jobs widget, tree, this) never fight. */
export const FOLLOWUP_WIDGET_KEY = "followup-gate-call";

/** The in-flight line: plain string[] form, no theme call, no hex, no ANSI
 * escape. Names the candidate, states a call is in progress. Replaced, never
 * appended; settled (null) → zero lines. */
export function renderFollowupInFlight(pending: { title: string } | null): string[] {
	if (!pending) return [];
	return [`followup gate: call in progress · ${pending.title}`];
}

/** The mechanical per-candidate result entry — nothing verdict-bearing. */
export interface FollowupReviewCandidate {
	title: string;
	/** The ledger line's callId; null when the call threw before recording. */
	callId: string | null;
	status: "ok" | "failed";
	/** The OPEN-only projection of sections.board: Done entries are excluded,
	 * so a reference matching a Done card id matches neither list and target
	 * resolution fails loud by construction (the render side's resolver). */
	boardIds: string[];
	/** The other candidates in this call, in draft order. */
	siblingTitles: string[];
	/** Present only on a thrown (unrecorded) failure: a GENERIC message —
	 * never runFollowupGate's own guard text, never a verdict token. */
	message?: string;
}

export type FollowupReviewResult =
	| { mode: "off"; recorded: 0 }
	| { mode: "advisory" | "active"; candidates: FollowupReviewCandidate[] };

/** Widget hook (the tool wires it to ctx.ui.setWidget); optional so tests and
 * EV-83's runner path can run headless. Replacement semantics belong to the
 * wiring: setWidget replaces the widget's lines, never appends. */
export interface RunFollowupReviewOpts extends Omit<RunFollowupOpts, "repoRoot"> {
	setWidget?: (lines: string[]) => void;
}

/** The followup review's composition: the single site that loads both
 * followup files and reaches buildFollowupState (FLLWUP-96's premise: one
 * site, up to two callers). See the module header for the ordering posture. */
export async function runFollowupReview(
	candidates: readonly FollowupCandidate[],
	repoRoot: string,
	opts: RunFollowupReviewOpts = {},
): Promise<FollowupReviewResult> {
	// R3: the policy loads FIRST; off is a mechanical no-op BEFORE the
	// followup loaders (an off policy may omit the state budget, which the
	// packer path would throw on), BEFORE any fetch, write, or widget touch.
	const policy = loadGatePolicy(repoRoot);
	if (policy.mode === "off") {
		return { mode: "off", recorded: 0 };
	}
	const questions = loadFollowupQuestions(repoRoot);
	const decisionPolicy = loadFollowupDecision(repoRoot);
	const boardPath = path.join(repoRoot, "council", "board.md");
	const { setWidget, ...gateOpts } = opts;
	const out: FollowupReviewCandidate[] = [];
	try {
		// Sequential per candidate — the in-flight line names ONE candidate;
		// latency is traded for unambiguous copy.
		for (const candidate of candidates) {
			const siblings = candidates.filter((c) => c !== candidate);
			if (setWidget) setWidget(renderFollowupInFlight({ title: candidate.title }));
			try {
				const state = buildFollowupState(candidate, repoRoot, siblings, boardPath);
				// Production composition; opts.callId stays whatever the caller
				// passed (the tool passes nothing — default randomUUID keeps the
				// callId opaque to the reading model).
				const res = await runFollowupGate(state, questions, policy, decisionPolicy, {
					...gateOpts,
					repoRoot,
				});
				out.push({
					title: candidate.title,
					callId: res.callId,
					status: res.status,
					boardIds: state.sections.board.filter((e) => e.state !== "Done").map((e) => e.id),
					siblingTitles: siblings.map((s) => s.title),
				});
			} catch {
				// Generic re-surface: never runFollowupGate's guard text, never
				// the packer's FAIL detail, never a verdict token. ZERO ledger
				// lines exist for this candidate (the throw was pre-POST).
				out.push({
					title: candidate.title,
					callId: null,
					status: "failed",
					boardIds: [],
					siblingTitles: siblings.map((s) => s.title),
					message: `followup gate: the followup call for candidate "${candidate.title}" failed`,
				});
			}
		}
	} finally {
		// Zero lines after settle for EVERY post-settle state — the empty
		// array renders zero lines and keeps the key registered. Replacement,
		// never append; never notify. Headless (no hook) shows nothing.
		if (setWidget) setWidget(renderFollowupInFlight(null));
	}
	return { mode: policy.mode, candidates: out };
}

// ---------------------------------------------------------------------------
// EV-83 — the child-mode runner transport: council_followup_review
// ---------------------------------------------------------------------------

/** The review tool's result: the record-side mechanical facts plus the
 * rendered line set — every basis byte a runner's report carries comes from
 * here, engine-derived, never a model echo. */
export interface FollowupReviewToolResult {
	result: FollowupReviewResult;
	lines: string[];
}

/** The child-mode tool's whole composition: the ONE followup composition
 * (`runFollowupReview`) followed by the render half against the ACTUAL
 * result object — a second caller of both exported halves (FLLWUP-96
 * intact), never a second composition. `mergeTargets` stays a parameter,
 * passed through to the render half; this wrapper never absorbs the dedup
 * pass. Exported so the arm-shape tests can inject a transport. */
export async function composeFollowupReview(
	candidates: readonly FollowupCandidate[],
	repoRoot: string,
	opts: RunFollowupReviewOpts = {},
	mergeTargets?: Record<string, string>,
): Promise<FollowupReviewToolResult> {
	const result = await runFollowupReview(candidates, repoRoot, opts);
	const lines = renderFollowupLinesFromRepo(result, repoRoot, mergeTargets);
	return { result, lines };
}

/** Register the child-mode review tool — called from runChildMode when the
 * seat carries the `followup` grant, NEVER from index.ts's parent path (the
 * parent pair gate/render is the attended surface; this tool is the runner
 * container's). Its execute guards ctx.hasUI, so headless child sessions
 * work unchanged. */
export function registerFollowupReviewTool(pi: ExtensionAPI, repoRoot: string): void {
	pi.registerTool({
		name: "council_followup_review",
		label: "Council Followup Review",
		description:
			"Record the follow-up decision for every drafted follow-up candidate in one call and render the recorded lines. " +
			"Invoke ONCE, with every drafted candidate in draft order; the recorded decision is the only disposition source — never re-decide a candidate the render already answered. " +
			"Returns the mechanical per-candidate facts plus the rendered line set in draft order: present each per-candidate line verbatim. " +
			"A failed or unresolved decision is an ESCALATION before any write — never read the gate ledger directly, the tool result is the only interface. " +
			"With the packaged default (mode off) this is a mechanical no-op rendering the bare off literal.",
		parameters: Type.Object({
			candidates: Type.Array(
				Type.Object({
					title: Type.String({ description: "The drafted follow-up card's title, verbatim" }),
					goal: Type.String({ description: "The drafted follow-up card's goal" }),
				}),
				{ description: "Every drafted follow-up candidate, in draft order — one call carries all drafts" },
			),
			mergeTargets: Type.Optional(
				Type.Record(Type.String(), Type.String(), {
					description:
						"Per-candidate merge-target references (candidate title → the exact open board id or the exact sibling title), produced by the dedup pass",
				}),
			),
		}),
		async execute(_id, params, _signal, _onUpdate, ctx) {
			const setWidget = (lines: string[]) => {
				if (ctx.hasUI) ctx.ui.setWidget(FOLLOWUP_WIDGET_KEY, lines);
			};
			const out = await composeFollowupReview(
				params.candidates as FollowupCandidate[],
				repoRoot,
				{ setWidget },
				params.mergeTargets as Record<string, string> | undefined,
			);
			return { content: [{ type: "text", text: JSON.stringify(out) }], details: out };
		},
	});
}

// ---------------------------------------------------------------------------
// The parent-session tool — council_followup_gate
// ---------------------------------------------------------------------------

/** Register the followup gate's parent-session tool. Its OWN registration —
 * called from index.ts's parent path only, never folded into registerHubTools
 * (which child.ts also calls for hub-granted seats). */
export function registerFollowupGateTool(pi: ExtensionAPI, repoRoot: string): void {
	pi.registerTool({
		name: "council_followup_gate",
		label: "Council Followup Gate",
		description:
			"Record the follow-up decision for every drafted follow-up candidate at the card-the-follow-ups confirm gate. " +
			"Invoke ONCE, after drafting and before presenting, with every drafted candidate in draft order. " +
			"The decision is recorded to the gate ledger, never returned — the presentation lines come from council_followup_render. " +
			"With the packaged default (mode off) this is a mechanical no-op.",
		parameters: Type.Object({
			candidates: Type.Array(
				Type.Object({
					title: Type.String({ description: "The drafted follow-up card's title, verbatim" }),
					goal: Type.String({ description: "The drafted follow-up card's goal" }),
				}),
				{ description: "Every drafted follow-up candidate, in draft order — one call carries all drafts" },
			),
		}),
		async execute(_id, params, _signal, _onUpdate, ctx) {
			const setWidget = (lines: string[]) => {
				if (ctx.hasUI) ctx.ui.setWidget(FOLLOWUP_WIDGET_KEY, lines);
			};
			const result = await runFollowupReview(
				params.candidates as FollowupCandidate[],
				repoRoot,
				{ setWidget },
			);
			return { content: [{ type: "text", text: JSON.stringify(result) }], details: result };
		},
	});
}
