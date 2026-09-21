// EV-82 — the followup decision's render side: the pure renderer and the
// parent-session `council_followup_render` tool, mirroring the EV-67
// gate-render posture.
//
// Spec: docs/superpowers/specs/2026-09-22-EV-82-design.md §3 (settled).
//
// Pure-leaf posture (the load-bearing construction): this module's OWN source
// carries no fs usage and imports ONLY the record layer (decisionLine +
// readGateLedger from the ledger module), typebox, and the extension API
// types. (The ledger module itself imports the fs runtime transitively — the
// skeptic's O3 correction; purity is pinned by a source-string canary on
// THIS module's text, not by an import-graph claim.) It takes no card text,
// performs zero writes, loads no policy, and cannot re-issue the gate call.
//
// Join key: callId ONLY — identical candidate titles collide in an
// append-only ledger; stateHash moves. The candidate's title, boardIds, and
// siblingTitles ride the record tool's mechanical result, joined per callId.
//
// Byte order (the designer's round-3 settlement, append-order): the line is
// composed as
//   decisionLine(record) + " — " + title + (target ? " → " + target : "")
//   + " (" + qualifier + ")"
// so the shipped `Mode:`-prefixed disposition-basis grammar stays byte-intact
// as a contiguous prefix (the D3 discriminator), the single Mode:-prefixed
// format expression stays owned by the ledger module, and no second one
// exists anywhere.
//
// The qualifier comes from the RECORD's `advisory` flag — the record is the
// audit truth of what governed the recorded decision; a render-time config
// re-read could mislabel after a mid-run flip. The step-13 prose pins that
// the applying arm executes the recorded disposition the line names, not the
// current configuration.
//
// Unavailable-state literals (R8): `off` (the record tool's no-op, rendered
// from the result-level mode flag — skeptic O4), `credential unresolved`
// (failure class no-api-key), `model-card coming-soon` (failure class
// http-404 — a RENDER-SIDE HEURISTIC, commented as such: no shared
// transport-taxonomy edit; when the model-card page gains a real availability
// signal, the class and this mapping amendment land together in a future
// card), and `gate call failed: <reason>` (per-candidate, the verbatim
// ledger reason, newline-flattened to one line — skeptic O5).
//
// D4 placement: a total-failure literal (`credential unresolved`,
// `model-card coming-soon`) renders ONCE above the drafts iff EVERY
// candidate's record shares that state; otherwise each affected candidate
// gets its literal under its own card, replacing its disposition line, and
// the above-drafts slot renders nothing. `gate call failed: <reason>` is
// always per-candidate. The off case degenerates cleanly: no candidates, one
// `off` literal.
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { decisionLine, readGateLedger, type GateLedgerRecord } from "./gate-ledger.ts";

/** The record side's mechanical per-candidate entry — the render's only
 * carrier of candidate identity and resolution lists. */
export interface FollowupRenderCandidate {
	title: string;
	callId: string | null;
	status: string;
	boardIds: string[];
	siblingTitles: string[];
}

/** The render input: the record tool's result (mechanical facts) + the mode
 * flag. The off no-op carries no candidates — the mode flag is what the off
 * cell renders from (skeptic O4). */
export interface FollowupRenderInput {
	mode: string;
	recorded?: number;
	candidates?: FollowupRenderCandidate[];
}

/** The fallback literals for the two no-record cells — bare, never routed
 * through a fabricated Mode: line. */
export const FOLLOWUP_RENDER_FALLBACK = {
	/** The call threw before any ledger line was written (callId null). */
	unrecorded: "followup decision not recorded",
	/** A callId was recorded, but the ledger has no matching line. */
	joinMiss: "recorded followup call not found in ledger",
} as const;

/** The failure basis prefix the ledger module owns; the reason is the
 * verbatim remainder, rendered once, newline-flattened. */
const GATE_CALL_FAILED_PREFIX = "gate call failed: ";

/** The two aggregatable total-failure literals (R8, bare, no namespace
 * prefix — only `gate call failed:` carries a prefix, because its grammar is
 * the verbatim ledger basis substring). */
const CREDENTIAL_UNRESOLVED = "credential unresolved";
const MODEL_CARD_COMING_SOON = "model-card coming-soon";

/** The suffix composer — exported for the byte tests. */
export function followupSuffix(s: { title: string; targetId?: string; qualifier: "advisory" | "active" }): string {
	return ` — ${s.title}${s.targetId !== undefined ? ` → ${s.targetId}` : ""} (${s.qualifier})`;
}

/** Resolve a facilitator-supplied merge-target reference: board-id-exact
 * before sibling-title-exact (EV-80's precedence, kept in ONE resolver). A
 * Done card id is absent from the open-only lists by construction, so a
 * Done-id reference fails loud here. An unresolvable reference fails loud
 * with this named failure — never a silent re-point, never a silent File. */
export function resolveFollowupTarget(
	reference: string,
	lists: { boardIds: readonly string[]; siblingTitles: readonly string[] },
): string {
	if (lists.boardIds.includes(reference)) return reference;
	if (lists.siblingTitles.includes(reference)) return reference;
	throw new Error(
		`followup-render: merge target ${JSON.stringify(reference)} matches no open board id or sibling title — supply the exact board id (a Done card id is not resolvable) or the exact sibling title`,
	);
}

type Classification =
	| { kind: "disposition"; record: GateLedgerRecord }
	| { kind: "total"; literal: string }
	| { kind: "callFailed"; reason: string }
	| { kind: "unrecorded" }
	| { kind: "joinMiss" };

function classify(
	candidate: FollowupRenderCandidate,
	record: GateLedgerRecord | undefined,
): { cls: Classification; candidate: FollowupRenderCandidate } {
	if (!record) {
		return { cls: candidate.callId === null ? { kind: "unrecorded" } : { kind: "joinMiss" }, candidate };
	}
	if (record.failure === undefined) {
		return { cls: { kind: "disposition", record }, candidate };
	}
	if (record.failure.class === "no-api-key") {
		return { cls: { kind: "total", literal: CREDENTIAL_UNRESOLVED }, candidate };
	}
	if (record.failure.class === "http-404") {
		// Render-side heuristic (see module header) — no transport-taxonomy edit.
		return { cls: { kind: "total", literal: MODEL_CARD_COMING_SOON }, candidate };
	}
	const basis = record.basis ?? "";
	const reason = (basis.startsWith(GATE_CALL_FAILED_PREFIX) ? basis.slice(GATE_CALL_FAILED_PREFIX.length) : basis)
		.replace(/[\r\n]+/g, " ");
	return { cls: { kind: "callFailed", reason }, candidate };
}

/** The five-cell table over the callId join, with the D4 aggregation. Pure:
 * a function of the recorded decisions and the mechanical result entries —
 * no fs, no policy, no prose, no writes. Returns the full ordered line set:
 * an optional total-failure literal (above the drafts) plus exactly ONE line
 * per candidate in input order (under its card). */
export function renderFollowupLines(
	result: FollowupRenderInput,
	records: readonly GateLedgerRecord[],
	targets?: Record<string, string>,
): string[] {
	// The off cell: no record, no per-candidate callIds — the result-level
	// mode flag is the only input, and the bare literal is the only output.
	if (result.mode === "off") return ["off"];
	const byCallId = new Map(records.map((r) => [r.callId, r]));
	const classified = (result.candidates ?? []).map((c) => classify(c, byCallId.get(c.callId ?? "\u0000")));

	// D4: a total-failure literal renders once above the drafts iff EVERY
	// candidate's classification is the SAME total state; two differing
	// total-failure states (or any non-total state) fall through to
	// per-candidate literals only.
	if (classified.length > 0 && classified.every((x) => x.cls.kind === "total")) {
		const literal = (classified[0]!.cls as { kind: "total"; literal: string }).literal;
		if (classified.every((x) => x.cls.kind === "total" && x.cls.literal === literal)) {
			return [literal];
		}
	}

	const lines: string[] = [];
	for (const { cls, candidate } of classified) {
		if (cls.kind === "disposition") {
			const record = cls.record;
			const qualifier = record.advisory === true ? "advisory" : "active";
			let targetId: string | undefined;
			if (record.resolvedMode === "Merge") {
				const reference = targets?.[candidate.title];
				if (reference !== undefined) {
					// A supplied reference that resolves to nothing fails loud —
					// a typo must never silently render as "unresolved".
					targetId = resolveFollowupTarget(reference, {
						boardIds: candidate.boardIds,
						siblingTitles: candidate.siblingTitles,
					});
				}
				// No target supplied: the arrow and the slot are omitted
				// together — the absent arrow is the signifier for the human's
				// next move; the candidate falls to the human.
			}
			lines.push(
				decisionLine(record) +
					followupSuffix({ title: candidate.title, targetId, qualifier }),
			);
		} else if (cls.kind === "total") {
			lines.push(cls.literal);
		} else if (cls.kind === "callFailed") {
			lines.push(`${GATE_CALL_FAILED_PREFIX}${cls.reason}`);
		} else if (cls.kind === "unrecorded") {
			lines.push(FOLLOWUP_RENDER_FALLBACK.unrecorded);
		} else {
			lines.push(FOLLOWUP_RENDER_FALLBACK.joinMiss);
		}
	}
	return lines;
}

// ---------------------------------------------------------------------------
// The parent-session tool — council_followup_render
// ---------------------------------------------------------------------------

/** The tool's input: the record tool's mechanical result + the per-candidate
 * mergeTarget references the dedup pass produced. NO card text. */
export const FOLLOWUP_RENDER_PARAMS = Type.Object({
	result: Type.Object({
		mode: Type.String({
			description: `The council_followup_gate result's mode, verbatim ("off" when the gate is off)`,
		}),
		candidates: Type.Optional(
			Type.Array(
				Type.Object({
					title: Type.String({ description: "The candidate's title, verbatim" }),
					callId: Type.Union([Type.String(), Type.Null()], {
						description: "The ledger callId from the council_followup_gate result; null when the call failed before recording",
					}),
					status: Type.String({ description: "The per-candidate status, verbatim" }),
					boardIds: Type.Array(Type.String(), { description: "The open board ids, as the record result reported them" }),
					siblingTitles: Type.Array(Type.String(), { description: "The sibling candidates' titles, as the record result reported them" }),
				}),
				{ description: "The per-candidate mechanical entries from the council_followup_gate result, in draft order" },
			),
		),
	}),
	mergeTargets: Type.Optional(
		Type.Record(Type.String(), Type.String(), {
			description: "Per-candidate merge-target references (candidate title → the exact open board id or the exact sibling title), produced by the dedup pass",
		}),
	),
});

/** One readGateLedger pass joined against the mechanical result — the tool's
 * whole body. Zero writes, zero policy loads. */
export function renderFollowupLinesFromRepo(
	result: FollowupRenderInput,
	repoRoot: string,
	targets?: Record<string, string>,
): string[] {
	const { calls } = readGateLedger(repoRoot);
	return renderFollowupLines(result, calls, targets);
}

/** Register the render tool on the PARENT path only — called from index.ts's
 * parent block, never folded into registerHubTools (which child.ts also
 * calls for hub-granted seats). */
export function registerFollowupRenderTool(pi: ExtensionAPI, repoRoot: string): void {
	pi.registerTool({
		name: "council_followup_render",
		label: "Council Followup Render",
		description:
			"Render the recorded follow-up decision lines for the drafted follow-up candidates at the card-the-follow-ups confirm gate. " +
			"Invoke ONCE with the result exactly as the council_followup_gate tool returned it, plus any merge targets the dedup pass identified. " +
			"Returns the line set in draft order: print each per-candidate line verbatim under its own draft, and any leading literal line above the drafts. " +
			"Presented, never written. Zero writes, loads no policy; with the gate off this renders the bare off literal.",
		parameters: FOLLOWUP_RENDER_PARAMS,
		async execute(_id, params, _signal, _onUpdate, _ctx) {
			const lines = renderFollowupLinesFromRepo(
				params.result as FollowupRenderInput,
				repoRoot,
				params.mergeTargets as Record<string, string> | undefined,
			);
			return { content: [{ type: "text", text: JSON.stringify({ lines }) }], details: { lines } };
		},
	});
}
