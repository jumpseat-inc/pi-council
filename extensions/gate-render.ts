// EV-67 — the gate verdict rendered as information at the step-4 approval
// gate: the pure renderer and the parent-session `council_gate_render` tool.
//
// Spec: docs/superpowers/specs/2026-09-19-EV-67-design.md (settled). The
// single decision gate stays the single decision gate: the human still
// approves, edits, or drops each card exactly as before, and the verdict
// arrives as information attached to the card they are already looking at —
// one line per card, naming the mode and the one-line basis. The basis is
// not authored at render time: it is the string the decision function
// recorded (or the pinned fallback literal for the two failure cells), so
// the line a person reads and the ledger record they can audit cannot drift
// apart.
//
// Pure-leaf posture (the load-bearing construction): this module imports
// ONLY the record layer (decisionLine + readGateLedger from gate-ledger.ts).
// It takes NO card text — the tool schema carries no title/goal/acceptance —
// so the render function cannot alter the card body because it never sees
// it; that is what makes the byte-identity test cheap and load-bearing. Zero
// writes, zero policy loads (loadGatePolicy is never referenced), no widget
// calls, no prompt vocabulary.
//
// Join key: callId ONLY — never stateHash (identical draft text in two runs
// collides in a committed, append-only file, and the hash moves if wiki/ or
// rulings/ change between call and presentation). callId is the only sound
// per-card correlate.
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { decisionLine, readGateLedger, type GateLedgerRecord } from "./gate-ledger.ts";

/** The TS-authored fallback-literal basis constants (cells B and C) — the
 * ruling's J2: fallbacks are basis-slot text fed through decisionLine with
 * resolvedMode "Deliberate", never a separate format branch, never an
 * imperative (an imperative there would turn a failure fact into an
 * instruction), never a gesture at the scrubbed transport reason. B and C
 * are distinct, honestly different states — never conflated. */
export const GATE_RENDER_FALLBACK = {
	/** Cell B — the call threw before any ledger line was written. */
	unrecordedFailure: "gate call failed before recording a verdict",
	/** Cell C — a callId was recorded, but the ledger has no matching line. */
	joinMiss: "recorded gate call not found in ledger",
} as const;

/** The mechanical step-3 result's per-card entry — the tool's whole input.
 * No card text: no title, no goal, no acceptance. */
export interface GateRenderCardInput {
	id: string;
	/** The ledger line's callId; null when the call threw before recording. */
	callId: string | null;
	status: string;
}

export interface GateRenderCardOutput {
	id: string;
	/** The one mode line, `decisionLine`'s exact bytes — presented verbatim. */
	modeLine: string;
}

/** The five-cell table over the callId join. Pure: a function of the recorded
 * decisions and the mechanical card entries — no fs, no policy, no prose.
 *
 * - Cell A (record found, success or recorded failure): `decisionLine(record)`
 *   — a recorded failure's basis already reads `gate call failed: <reason
 *   verbatim>`; the reason renders exactly once, from the record.
 * - Cell A′ (record found, basis absent — a v1 line): `decisionLine` folds
 *   to the mode token alone.
 * - Cell B (`callId: null` — failed before recording): the fallback literal
 *   through `decisionLine` with `resolvedMode: "Deliberate"`.
 * - Cell C (recorded callId matching no ledger line): the other fallback
 *   literal, same routing.
 *
 * Input order is preserved — per-card attachment rides the order; the
 * procedure places each line under its own card. */
export function renderGateLines(cards: readonly GateRenderCardInput[], records: readonly GateLedgerRecord[]): GateRenderCardOutput[] {
	const byCallId = new Map(records.map((r) => [r.callId, r]));
	return cards.map((card) => {
		if (card.callId === null) {
			// Cell B: the call threw before recording — the full mode, and the
			// failure named rather than the line omitted.
			return {
				id: card.id,
				modeLine: decisionLine({ resolvedMode: "Deliberate", basis: GATE_RENDER_FALLBACK.unrecordedFailure }),
			};
		}
		const record = byCallId.get(card.callId);
		if (!record) {
			// Cell C: a callId was recorded, but the ledger has no matching line.
			return {
				id: card.id,
				modeLine: decisionLine({ resolvedMode: "Deliberate", basis: GATE_RENDER_FALLBACK.joinMiss }),
			};
		}
		// Cells A / A′: the record renders itself, whatever it records.
		return { id: card.id, modeLine: decisionLine(record) };
	});
}
