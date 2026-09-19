// EV-69 — the parent-only `council_route` tool: the routing read's surface
// and the observed-set re-check's sanctioned gate caller.
//
// Spec: docs/superpowers/specs/2026-09-21-EV-69-design.md §4. Registered on
// the parent path only (index.ts, next to registerGateTool) — never folded
// into registerHubTools, which the child path also calls: council_route must
// not exist in seat children.
//
// This module MAY import runGate/transport — it IS the sanctioned gate
// caller for re-checks; the import fence protects the pure module
// (gate-route.ts), not the tool. The tool RETURNS the mode to the caller —
// the EV-66 verdict-opacity ruling does not apply here: the facilitator IS
// the router and cannot route on a hidden verdict. Enforcement is procedural
// (tool + amended council.md step 1 / the step-8→9 boundary); the
// dispatch-multiset falsifier over the run manifests is the teeth.
//
// Ops (spec §4):
//   route     — step 1: parseCardFile → resolveRoute; the mode comes back.
//   recheck   — step-8→9 boundary: resolve the route; only a recorded
//               REDUCED route re-checks. The observed touched-file set at the
//               pinned head rebuilds the packed state; hash equal ⇒ the
//               record stands, ZERO calls; hash differs ⇒ EXACTLY ONE
//               runGate call whose own v2 line IS the ledger line recording
//               the re-route (no new record kind, schemaVersion 2). The
//               route becomes effective = strongest(recorded, verdict) —
//               the escalation-only ratchet; the ratchet note rides basis
//               via runGate's basisSuffix when effective ≠ verdict.
//   authority — EV-70-facing: effectiveModeForCard over the run substrate.
import * as fs from "node:fs";
import * as path from "node:path";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { GATE_DECISION_MODES, loadGateDecision, loadGatePolicy, loadGateQuestions, type GateDecisionMode } from "./gate.ts";
import { buildGateState } from "./gate-state.ts";
import { runGate } from "./gate-run.ts";
import {
	effectiveModeForCard,
	observedTouchedEntries,
	observedTouchedFiles,
	panelFor,
	parseCardFile,
	recheckOwed,
	resolveRoute,
	strongest,
} from "./gate-route.ts";

const STRONGEST = GATE_DECISION_MODES[0]; // Deliberate — the strongest mode; no literal here

/** Register the parent-only council_route tool. Its OWN registration —
 * called from index.ts's parent path only, never folded into registerHubTools. */
export function registerRouteTool(pi: ExtensionAPI, repoRoot: string): void {
	pi.registerTool({
		name: "council_route",
		label: "Council Route",
		description:
			"Deterministic card routing from the recorded gate ledger (EV-69). " +
			'op "route": read the card\'s recorded decision for its current packed state — the returned mode is authoritative for council.md step 1 (a fallback result means step 1\'s own judgment applies). ' +
			'op "recheck": at the step-8→9 boundary, re-check the recorded route against the observed branch (headSha required); a fired override re-routes with exactly one recorded gate call. ' +
			'op "authority": the card\'s effective execution mode read from the run manifests (runId + runnerJobId required) — the merge check\'s mechanical input. ' +
			"With the packaged default (gate mode off) every op routes to the full path.",
		parameters: Type.Object({
			op: Type.Union([Type.Literal("route"), Type.Literal("recheck"), Type.Literal("authority")], {
				description: "route = step 1's recorded-mode read; recheck = the step-8→9 observed-set re-check; authority = the merge check's mode read",
			}),
			cardPath: Type.String({ description: "Path to the card markdown file (absolute or repo-root-relative)" }),
			headSha: Type.Optional(Type.String({ description: "recheck only — the branch head SHA the observed set is diffed against (pinned per FLLWUP-18/19)" })),
			runId: Type.Optional(Type.String({ description: "authority only — the run id" })),
			runnerJobId: Type.Optional(
				Type.String({ description: "authority only — the card's council-runner ROOT dispatch id (comma-separate several ROOTs after an escalation re-entry)" }),
			),
		}),
		async execute(_id, params, _signal, _onUpdate, _ctx) {
			const cardPath = path.isAbsolute(params.cardPath) ? params.cardPath : path.join(repoRoot, params.cardPath);
			if (params.op === "route") {
				const card = parseCardFile(fs.readFileSync(cardPath, "utf-8"));
				const route = resolveRoute(card, repoRoot);
				return json({ ...route, include: panelFor(route.mode) });
			}
			if (params.op === "recheck") {
				if (params.headSha === undefined) {
					throw new Error('gate-route: op "recheck" requires headSha — the branch head the observed set is diffed against');
				}
				return json(await recheck(cardPath, params.headSha));
			}
			// op === "authority"
			if (params.runId === undefined || params.runnerJobId === undefined) {
				throw new Error('gate-route: op "authority" requires runId and runnerJobId — the run substrate the mode is read from');
			}
			const runnerJobIds = params.runnerJobId.split(",").map((s: string) => s.trim()).filter((s: string) => s !== "");
			const mode = effectiveModeForCard(repoRoot, params.runId, runnerJobIds);
			return json({ mode, include: panelFor(mode), runId: params.runId, runnerJobId: params.runnerJobId });
		},
	});

	function json(value: unknown) {
		return { content: [{ type: "text" as const, text: JSON.stringify(value) }], details: value as Record<string, unknown> };
	}

	/** The observed-set re-check (spec §4, op recheck). Returns the unchanged
	 * route (rechecked: false) unless a recorded REDUCED route's rebuilt hash
	 * differs — then exactly one re-gate call, whose line is the re-route
	 * record, with the ratchet clamp on the returned mode. */
	async function recheck(cardPath: string, headSha: string) {
		const card = parseCardFile(fs.readFileSync(cardPath, "utf-8"));
		const route = resolveRoute(card, repoRoot);
		// Only a valid recorded REDUCED route re-checks: a fallback/unpackable
		// result is returned unchanged, and a recorded Deliberate card is
		// already on the full path — there is nothing below it to hold.
		if (route.source !== "recorded" || route.mode === STRONGEST) {
			return {
				...route,
				include: panelFor(route.mode),
				rechecked: false,
				note: route.source !== "recorded" ? "no recorded reduced mode — the re-check is not applicable" : "recorded mode is already the full path — the re-check is not applicable",
			};
		}
		const recordedMode = route.mode as GateDecisionMode;
		// The observed set at the pinned head — commit-range form, base pinned;
		// the per-path line counts are recorded honestly (numstat).
		const observedPaths = observedTouchedFiles(repoRoot, headSha);
		const observedEntries = observedTouchedEntries(repoRoot, headSha);
		for (const p of observedPaths) {
			if (!observedEntries.some((e) => e.path === p)) observedEntries.push({ path: p, linesChanged: 1 });
		}
		const rebuilt = buildGateState({ ...card, touchedFiles: observedEntries }, repoRoot);
		if (!recheckOwed(route.stateHash!, rebuilt.stateHash)) {
			// The rebuilt (observed) packed state matches the recorded decision's
			// hash — the record stands, route unchanged, ZERO calls (this covers
			// the intake-recorded-[]-and-observed-empty case).
			return { ...route, include: panelFor(route.mode), rechecked: false, note: "observed packed state unchanged — the recorded decision stands" };
		}
		// The rebuilt hash differs — exactly ONE re-gate call. Its own v2 line
		// (rebuilt observed stateHash, real answers, real basis) IS the ledger
		// line recording the re-route; no new record kind; schemaVersion stays 2.
		try {
			const policy = loadGatePolicy(repoRoot);
			const questions = loadGateQuestions(repoRoot);
			const decisionPolicy = loadGateDecision(repoRoot);
			const res = await runGate(rebuilt, questions, {
				repoRoot,
				policy,
				decisionPolicy,
				// The ratchet note is owed exactly when the verdict lands BELOW the
				// recorded mode (the ratchet holds); on an UP-escalation no suffix —
				// the verdict's own basis names the fired override.
				basisSuffix: (decision) =>
					strongest(recordedMode, decision.mode) !== decision.mode
						? `ratchet holds ${recordedMode} — recorded mode stands over the re-gate verdict ${decision.mode}`
						: undefined,
			});
			const effective = strongest(recordedMode, res.decision.mode as GateDecisionMode);
			return {
				mode: effective,
				source: "recheck",
				basis: res.decision.basis,
				stateHash: rebuilt.stateHash,
				matchedCallId: res.callId,
				include: panelFor(effective),
				rechecked: true,
				recordedMode,
				verdictMode: res.decision.mode,
			};
		} catch (e) {
			// Fail-closed: a re-gate that cannot run routes full — the safe side —
			// with a named basis, never the recorded reduced mode.
			const msg = e instanceof Error ? e.message : String(e);
			return {
				mode: STRONGEST,
				source: "recheck",
				basis: `the re-gate call could not run: ${msg} — routes full`,
				stateHash: rebuilt.stateHash,
				include: panelFor(STRONGEST),
				rechecked: true,
				recordedMode,
				reGateFailed: true,
			};
		}
	}
}
