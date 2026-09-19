// EV-66 — the advisory gate at features-new intake: the parent-session
// `council_gate` tool and the gate's only UI surface, the transient in-flight
// line.
//
// Spec: docs/superpowers/specs/2026-09-19-EV-66-design.md (settled). The tool
// is invoked once by the /features-new facilitator after wave-3 aggregation
// and before step-3 (draft-then-confirm) presentation, with the epic card and
// every drafted child as parameters. Per card, SEQUENTIALLY: buildGateState →
// runGate with the production transport (apiKey resolution inside runGate).
//
// Result opacity (the load-bearing seam): the tool result carries ONLY
// mechanical facts — `{ policyMode, cards: [{ id, callId, status }] }` —
// never resolvedMode, basis, answers, decision, failure, reportedModel,
// modelDrift, or include; no verdict token (Deliberate|Verify|Direct|Mode:)
// appears in any returned string, including error and status strings; the
// tool never passes opts.callId (the default randomUUID keeps the callId
// uncorrelatable by the reading model); a thrown pre-POST guard or
// appendGateCall failure is caught and re-surfaced as a GENERIC message,
// never runGate's own policy-mode / noul-join text. The gate verdict is
// RECORDED, never printed — the printed verdict line belongs to EV-67.
//
// R3: loadGatePolicy runs FIRST; mode "off" is a mechanical no-op
// `{ mode: "off", recorded: 0 }` BEFORE loading questions, building state,
// fetching, writing a ledger line, or touching any widget (a repo-local off
// policy may omit gateStateBudgetTokens — the short-circuit precedes the
// loaders, which would otherwise throw). The advisory flag on the ledger line
// comes from policy.mode inside runGate — no second mode copy anywhere.
//
// R(c): touchedFiles is optional in the tool contract; the call site passes
// `touchedFiles: []` when the parameter is absent — gate-state.ts is NOT
// touched. Intake makes no touched-file claim; `[]` merely carries that in a
// contract with no absent slot, and EV-69's re-check against the observed set
// is the enforcement.
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { loadGateDecision, loadGatePolicy, loadGateQuestions } from "./gate.ts";
import { buildGateState, type ParsedCard } from "./gate-state.ts";
import { runGate, type GateRunResult } from "./gate-run.ts";

/** The in-flight widget key — distinct from the always-on jobs widget
 * ("council") and the toggle-controlled tree (COUNCIL_TREE_WIDGET_KEY); three
 * surfaces never fight. */
export const GATE_WIDGET_KEY = "gate-call";

/** The in-flight line: plain string[] form, no theme call, no hex, no ANSI
 * escape, no factory form. Names the card, states a call is in progress, no
 * banned word (`thinking`, `deliberating`, `reasoning`, `judging`), no
 * verdict, no mode suffix beyond the literal word `advisory` — the exact word
 * the goal's `advisory: true` hinges on. R(a): the surface stays exactly this
 * pending line; settled (null) → zero lines for EVERY post-settle state
 * including failures; drawn from in-flight call state only, never from the
 * ledger. Deterministic: same input → same output. */
export function renderGateInFlight(pending: { cardId: string } | null): string[] {
	if (!pending) return [];
	return [`gate: advisory call in progress · ${pending.cardId}`];
}

/** The mechanical per-card result entry — nothing verdict-bearing. */
interface GateToolCardResult {
	id: string;
	/** The ledger line's callId; null when the call threw before recording. */
	callId: string | null;
	status: GateRunResult["status"] | "failed";
	/** Present only on a thrown (unrecorded) failure: a GENERIC message —
	 * never runGate's own policy-mode / noul-join text, never a verdict. */
	message?: string;
}

interface GateToolResult {
	/** Off-mode no-op shape (spec §3): mechanical, recorded 0. */
	mode?: "off";
	recorded?: 0;
	/** Advisory/active shape (spec §4): mechanical facts only. */
	policyMode?: "advisory" | "active";
	cards?: GateToolCardResult[];
}

interface GateCardParam {
	id: string;
	title: string;
	goal: string;
	acceptance: string;
	touchedFiles?: Array<{ path: string; linesChanged: number }>;
}

/** Tool-boundary card validation: fail loud naming the field, BEFORE any
 * loading, fetching, writing, or widget work. Mirrors buildGateState's own
 * contract (gate-state.ts is NOT touched) so the packer never sees a
 * malformed card; a clearer intake error names the offending cards[i] slot.
 * R(c): an absent touchedFiles carries NO touched-file claim — the call site
 * passes `[]` (the contract has no absent slot); it is never described as
 * "touches nothing". */
function validateCardParam(card: GateCardParam, index: number): ParsedCard {
	const slot = `cards[${index}]`;
	for (const field of ["id", "title", "goal", "acceptance"] as const) {
		const v = card[field];
		if (typeof v !== "string" || v.trim() === "") {
			throw new Error(`gate: ${slot}.${field} must be a non-empty string, found ${JSON.stringify(v)}`);
		}
	}
	if (card.touchedFiles !== undefined) {
		if (!Array.isArray(card.touchedFiles)) {
			throw new Error(`gate: ${slot}.touchedFiles must be an array of { path, linesChanged }, found ${JSON.stringify(card.touchedFiles)}`);
		}
		card.touchedFiles.forEach((t, i) => {
			if (typeof t?.path !== "string" || t.path.trim() === "") {
				throw new Error(`gate: ${slot}.touchedFiles[${i}].path must be a non-empty string, found ${JSON.stringify(t?.path)}`);
			}
			if (typeof t?.linesChanged !== "number" || !Number.isInteger(t.linesChanged) || t.linesChanged <= 0) {
				throw new Error(`gate: ${slot}.touchedFiles[${i}].linesChanged must be a positive integer, found ${JSON.stringify(t?.linesChanged)}`);
			}
		});
	}
	return {
		id: card.id,
		title: card.title,
		goal: card.goal,
		acceptance: card.acceptance,
		touchedFiles: card.touchedFiles ?? [],
	};
}

/** Register the advisory gate's parent-session tool. Its OWN registration —
 * called from index.ts's parent path only, never folded into registerHubTools
 * (which child.ts also calls for hub-granted seats). */
export function registerGateTool(pi: ExtensionAPI, repoRoot: string): void {
	pi.registerTool({
		name: "council_gate",
		label: "Council Gate",
		description:
			"Record the advisory gate's verdict on drafted cards at /features-new intake. " +
			"Invoke ONCE, after wave-3 aggregation and before presenting the drafts, with the epic card and every drafted child. " +
			"The verdict is recorded to the gate ledger, never returned — presentation proceeds unchanged. " +
			"With the packaged default (mode off) this is a mechanical no-op.",
		parameters: Type.Object({
			cards: Type.Array(
				Type.Object({
					id: Type.String({ description: "The drafted card's id (e.g. EV-67; the epic card included)" }),
					title: Type.String({ description: "The drafted card's title" }),
					goal: Type.String({ description: "The drafted card's goal" }),
					acceptance: Type.String({ description: "The drafted card's seat-authored ## Acceptance text" }),
					touchedFiles: Type.Optional(
						Type.Array(
							Type.Object({
								path: Type.String(),
								linesChanged: Type.Number(),
							}),
							{ description: "Omit — intake makes no touched-file claim; the observed set is re-checked when the card runs" },
						),
					),
				}),
				{ description: "The epic card plus every drafted child card, in draft order" },
			),
		}),
		async execute(_id, params, _signal, _onUpdate, ctx) {
			// R3: the policy loads first; off is a mechanical no-op BEFORE the
			// question/decision loaders (an off policy may omit the state budget,
			// which those loaders' packer path would throw on), BEFORE any card
			// validation, fetch, write, or widget touch.
			const policy = loadGatePolicy(repoRoot);
			if (policy.mode === "off") {
				const off: GateToolResult = { mode: "off", recorded: 0 };
				return { content: [{ type: "text", text: JSON.stringify(off) }], details: off };
			}
			// Fail loud naming the field, before anything else happens.
			const parsedCards = (params.cards as GateCardParam[]).map(validateCardParam);
			const questions = loadGateQuestions(repoRoot);
			const decisionPolicy = loadGateDecision(repoRoot);
			const cards: GateToolCardResult[] = [];
			try {
				// Sequential per card — the in-flight line names ONE card; latency
				// is traded for unambiguous copy.
				for (const card of parsedCards) {
					if (ctx.hasUI) ctx.ui.setWidget(GATE_WIDGET_KEY, renderGateInFlight({ cardId: card.id }));
					try {
						const state = buildGateState(card, repoRoot);
						// Production composition: apiKey resolution inside runGate;
						// opts.callId stays untouched (default randomUUID keeps the
						// callId opaque to the reading model).
						const res = await runGate(state, questions, { repoRoot, policy, decisionPolicy });
						cards.push({ id: card.id, callId: res.callId, status: res.status });
					} catch {
						// Generic re-surface: never runGate's policy-mode / noul-join
						// text, never a verdict token, never the failure reason.
						cards.push({
							id: card.id,
							callId: null,
							status: "failed",
							message: `gate: the gate call for card ${card.id} failed`,
						});
					}
				}
			} finally {
				// R(a): zero lines after settle for EVERY post-settle state — the
				// empty array renders zero lines and keeps the key registered.
				// Replacement, never append; never notify. Headless shows nothing.
				if (ctx.hasUI) ctx.ui.setWidget(GATE_WIDGET_KEY, []);
			}
			const out: GateToolResult = { policyMode: policy.mode, cards };
			return { content: [{ type: "text", text: JSON.stringify(out) }], details: out };
		},
	});
}
