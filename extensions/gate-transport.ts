// EV-65 — the gate's decisions transport: the `GateTransport` seam, the real
// OpenRouter decisions HTTP transport, the pure wire shaper (the noul
// yes/no → true/false bijection), and the light response parser.
//
// Network surface: this module owns the gate's only network call — the
// second sanctioned network surface in the engine beside provider-cost.ts's
// generation transport (see that module's amended header). The transport is
// never reached by the default test suite (tests inject doubles; the live
// surface is probed only under COUNCIL_INTEGRATION=1 in
// test/gate-run-live.test.ts).
//
// Import edge: TYPES ONLY from ./gate.ts and ./gate-ledger.ts — no runtime
// dependency. The edge is one-way by design: gate.ts and gate-ledger.ts
// never import this module, and gate-run.ts is NOT the only runtime consumer:
// since EV-81 there are TWO — gate-run.ts (runGate, the card gate) and
// gate-run.ts's colocated runFollowupGate (the followup arm) — both reusing
// this seam verbatim; the one-way import edge is intact.
//
// Fail-closed posture: the transport NEVER throws — every failure, including
// a timeout or a network error, is a returned value, which makes runGate's
// failure path total. The timer lives only here (AbortController +
// setTimeout, cleared in a finally); runGate and the test doubles are
// timer-free.
//
// Response parsing is deliberately LIGHT (model string + answers record,
// each answer stored verbatim; usage/provider/generation id extracted
// defensively as nullable) — one coarser `invalid-response` failure class at
// runGate's catch-all rather than deep schema validation. Fail-closed wins.
import type { GateAnswer } from "./gate-ledger.ts";
import type { GateQuestion, GateQuestionSet, GateQuestionType } from "./gate.ts";

/** The pinned decisions-model refusal marker (live capture, card Intent): a
 * 400 body containing this string is the chat-completions refusal. Together
 * with GATE_FORBIDDEN_PATH below, these are the only two occurrences of the
 * forbidden path in the gate module sources (pinned by a source canary). */
export const GATE_REFUSAL_MARKER =
	"is a decisions model and cannot be used with the chat/completions endpoint";

/** The never-path for the pinned decisions model: a policy endpoint
 * containing this substring is rejected pre-POST by runGate's guard (the
 * enforcement is code, not convention). */
export const GATE_FORBIDDEN_PATH = "/chat/completions";

export interface GateTransportRequest {
	url: string;
	headers: Record<string, string>;
	body: unknown;
	timeoutMs: number;
}

export type GateTransportResult =
	| { ok: true; status: number; body: string }
	| { ok: false; kind: "timeout"; message: string }
	| { ok: false; kind: "network"; message: string }
	| { ok: false; kind: "http-error"; status: number; body: string };

/** The injected seam. Every failure is a value; the transport never throws. */
export type GateTransport = (req: GateTransportRequest) => Promise<GateTransportResult>;

export type GateTransportSoftFailure =
	| { ok: false; kind: "timeout"; message: string }
	| { ok: false; kind: "network"; message: string };

/** Pure: classify a thrown error into the transport's failure-value shape.
 * An abort becomes `kind: "timeout"` with the pinned message
 * `timeout after <timeoutMs>ms`; anything else is `kind: "network"` carrying
 * the error's message verbatim. Unit-testable without timers. */
export function classifyTransportFailure(e: unknown, timeoutMs: number): GateTransportSoftFailure {
	const name = e instanceof Error ? e.name : "";
	const message = e instanceof Error ? e.message : String(e);
	if (name === "AbortError" || name === "TimeoutError" || /abort/i.test(message)) {
		return { ok: false, kind: "timeout", message: `timeout after ${timeoutMs}ms` };
	}
	return { ok: false, kind: "network", message };
}

/** The production transport. Owns the AbortController + setTimeout (cleared
 * in a finally), converts an abort to `kind: "timeout"`, and reads EVERY
 * body via res.text() so non-2xx bodies are captured verbatim for the
 * ledger's verbatim failure reason. */
export function openRouterDecisionsTransport(apiKey: string): GateTransport {
	return async (req) => {
		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), req.timeoutMs);
		try {
			const res = await fetch(req.url, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${apiKey}`,
					...req.headers,
				},
				body: JSON.stringify(req.body),
				signal: controller.signal,
			});
			const body = await res.text();
			if (!res.ok) return { ok: false, kind: "http-error", status: res.status, body };
			return { ok: true, status: res.status, body };
		} catch (e) {
			return classifyTransportFailure(e, req.timeoutMs);
		} finally {
			clearTimeout(timer);
		}
	};
}

// ---------------------------------------------------------------------------
// Wire shaping — the noul bijection (checked, pure, total)
// ---------------------------------------------------------------------------

export interface GateWireQuestion {
	type: GateQuestionType;
	instructions: string;
	/** For `choice`: the option→description record passed through untouched.
	 * For `noul`: the mapped wire-axis record (true/false). For `score`: the
	 * ordered criterion array passed through untouched. */
	criteria: Record<string, string> | string[];
}

/** Pure, total: map the packaged question set onto the decisions wire.
 * Packaged data stays keyed yes/no (the human vocabulary shared with
 * decision.json's tokens); the wire's boolean axis is true/false, so a noul
 * question's criteria keys are mapped `yes → "true"`, `no → "false"`. Any
 * noul question whose criteria keys are not EXACTLY {yes, no} throws — the
 * discovery point is this wire seam, by design (loadGateQuestions accepts a
 * mis-keyed file; runGate surfaces the defect pre-POST with zero POSTs and
 * zero ledger lines). The wire vocabulary is invisible to decide(), which
 * never reads criteria keys — the decision function is untouched. */
export function toWireQuestions(questions: GateQuestionSet): Record<string, GateWireQuestion> {
	const out: Record<string, GateWireQuestion> = {};
	for (const [id, q] of Object.entries(questions.questions)) {
		const question = q as GateQuestion;
		if (question.type === "noul") {
			const criteria = question.criteria as Record<string, string>;
			const keys = Object.keys(criteria);
			if (keys.length !== 2 || !keys.includes("yes") || !keys.includes("no")) {
				throw new Error(
					`gate: toWireQuestions — noul question ${id} has criteria keys [${keys.join(", ")}] — noul criteria must be keyed exactly {yes, no} (the wire axis is true/false; the shaper maps yes→true, no→false)`,
				);
			}
			out[id] = {
				type: question.type,
				instructions: question.instructions,
				criteria: { ["true"]: criteria["yes"]!, ["false"]: criteria["no"]! },
			};
		} else {
			out[id] = {
				type: question.type,
				instructions: question.instructions,
				criteria: question.criteria,
			};
		}
	}
	return out;
}

// ---------------------------------------------------------------------------
// Response parsing — light validation, answers verbatim
// ---------------------------------------------------------------------------

export interface GateUsage {
	input_tokens: number | null;
	output_tokens: number | null;
	cost: number | null;
}

export interface ParsedDecisionsResponse {
	/** The versioned model the response reported (e.g.
	 * typesafe/jev-1.13-20260917 for the typesafe/jev-1.13 pin). */
	model: string;
	/** Verbatim answer payloads keyed by question id. */
	answers: Record<string, GateAnswer>;
	usage: GateUsage;
	provider: string | null;
	generationId: string | null;
}

function num(v: unknown): number | null {
	return typeof v === "number" && Number.isFinite(v) ? v : null;
}

/** Parse a 2xx decisions body. Throws a single-line Error on garbage —
 * runGate's catch-all converts it into the `invalid-response` class and the
 * fail-closed Deliberate path. */
export function parseDecisionsResponse(body: string): ParsedDecisionsResponse {
	let raw: unknown;
	try {
		raw = JSON.parse(body);
	} catch (e) {
		throw new Error(
			`gate: invalid decisions response — not parseable as JSON: ${e instanceof Error ? e.message : String(e)}`,
		);
	}
	if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
		throw new Error("gate: invalid decisions response — root must be a JSON object");
	}
	const o = raw as Record<string, unknown>;
	if (typeof o.model !== "string" || o.model.trim() === "") {
		throw new Error(
			`gate: invalid decisions response — model is ${JSON.stringify(o.model)} — expected a non-empty string`,
		);
	}
	if (!o.answers || typeof o.answers !== "object" || Array.isArray(o.answers)) {
		throw new Error("gate: invalid decisions response — answers must be a record keyed by question id");
	}
	const usageRaw = (
		o.usage && typeof o.usage === "object" && !Array.isArray(o.usage) ? o.usage : {}
	) as Record<string, unknown>;
	return {
		model: o.model,
		answers: o.answers as Record<string, GateAnswer>,
		usage: {
			input_tokens: num(usageRaw["input_tokens"]),
			output_tokens: num(usageRaw["output_tokens"]),
			cost: num(usageRaw["cost"]),
		},
		provider: typeof o.provider === "string" && o.provider.length > 0 ? o.provider : null,
		generationId: typeof o["id"] === "string" && (o["id"] as string).length > 0 ? (o["id"] as string) : null,
	};
}
