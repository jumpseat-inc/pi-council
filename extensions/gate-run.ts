// EV-65 — the gate's one-call orchestration. `runGate` issues EXACTLY ONE
// POST to the pinned decisions endpoint (never the forbidden chat path —
// GATE_FORBIDDEN_PATH, enforced in code), with the pinned model id, and never retries and never
// falls back. The failure posture is fail-closed: a refusal, a timeout, any
// non-2xx, or an unparseable 2xx body resolves the call to `Deliberate`
// with the full panel, and the failure reason is recorded VERBATIM — exactly
// once, inside the composite basis `"gate call failed: " + <reason>` — on
// the one v2 call-line ledger append. An unanswered question exists only as
// `null` in the record and is ABSENT from decide()'s input — never a
// negative answer.
//
// Recomputability precondition (EV-65 PO ruling Q2, binding interim
// wording): a failed call's record re-derives `Deliberate` from the line
// alone for the packaged policy and any policy with `thresholds.verify > 0`
// (asserted against the packaged decision.json: composite 0.00 < verify
// threshold 2.60). It does NOT hold unconditionally: under a loader-legal
// `thresholds.verify = 0` policy the re-derivation can disagree with the
// recorded mode; that loader defect is ruled out of EV-65's scope and ships
// as a follow-up card (no verify guard is implemented here, and gate.ts is
// not edited by EV-65).
//
// runGate loads nothing itself: the future caller command composes the
// loaders / buildGateState → runGate. It takes the GateState object (not raw
// bytes) and consumes the producer's stateHash verbatim (EV-64 ruled
// producer-side hashing only). The timeout lives entirely in the transport;
// this module and the test doubles are timer-free. The only network surface
// behind the default injectable path is gate-transport.ts's production
// transport (the engine's second sanctioned network surface beside
// provider-cost.ts's generation transport); the default test suite never
// constructs it.
import {
	GATE_ENDPOINT,
	GATE_PINNED_MODEL,
	MODE_PANELS,
	decide,
	decideFollowup,
	type FollowupDecision,
	type FollowupDecisionPolicy,
	type GateDecision,
	type GateDecisionPolicy,
	type GatePolicy,
	type GateQuestionSet,
} from "./gate.ts";
import type { FollowupState } from "./followup-state.ts";
import type { GateState } from "./gate-state.ts";
import { appendGateCall, type GateAnswer } from "./gate-ledger.ts";
import { resolveOpenRouterApiKey } from "./provider-cost.ts";
import {
	GATE_FORBIDDEN_PATH,
	GATE_REFUSAL_MARKER,
	openRouterDecisionsTransport,
	parseDecisionsResponse,
	toWireQuestions,
	type GateTransport,
	type GateTransportResult,
} from "./gate-transport.ts";

/** Provisional call timeout default (opts-overridable; POLICY_KEYS stays
 * frozen — timeoutMs is deliberately not a policy key). */
export const GATE_CALL_TIMEOUT_MS = 120_000;

export interface RunGateOpts {
	/** REQUIRED: the ledger's repo root — a call without it cannot append,
	 * to the real committed ledger or anywhere. */
	repoRoot: string;
	/** Caller-loaded gate policy (runGate loads nothing itself). */
	policy: GatePolicy;
	/** Caller-loaded decision policy. */
	decisionPolicy: GateDecisionPolicy;
	/** Injectable transport (tests always inject; production passes
	 * openRouterDecisionsTransport(apiKey)). */
	transport?: GateTransport;
	/** An explicit apiKey bypasses resolution; undefined resolves through
	 * resolveOpenRouterApiKey() (env → stored credential → null). An
	 * explicit null fails closed with the `no-api-key` class. */
	apiKey?: string | null;
	/** Injectable write clock. */
	now?: () => string;
	/** Provisional default 120_000 (GATE_CALL_TIMEOUT_MS). */
	timeoutMs?: number;
	/** Injectable call identity (default randomUUID). */
	callId?: string;
	/** Ledger path override (default gateLedgerPath(repoRoot)). */
	ledgerPath?: string;
	/** EV-69 (spec §5) — the escalation-only ratchet note, appended into the
	 * appended line's `basis` when present. An option on the input, NOT a new
	 * line field: still one write, one line, schemaVersion 2, and the line's
	 * `resolvedMode` stays the verdict verbatim (recomputeable). Either a
	 * static string (owed only when the caller already knows the verdict) or
	 * a post-decide hook — the re-check's ratchet note depends on the verdict,
	 * which exists only after decide() runs inside the single call. Absent ⇒
	 * byte-identical to the pre-EV-69 basis. */
	basisSuffix?: string | ((decision: GateDecision) => string | undefined);
}

export interface GateRunResult {
	status: "ok" | "failed";
	decision: GateDecision;
	callId: string;
	/** Present iff status "failed": the machine class (`kind` — the same
	 * tag the ledger line carries as `failure.class`) and the verbatim
	 * reason, which on the line lives ONLY inside `basis`. */
	failure?: { kind: string; reason: string };
	/** The versioned model the response reported (success path). */
	reportedModel?: string | null;
	/** Present iff the reported model differs from the pin. */
	modelDrift?: { pinned: string; reported: string };
}

interface FailureShape {
	"class": string;
	reason: string;
}

/** The failure taxonomy: no-api-key | timeout | network | http-<status> |
 * http-400-refusal (classification sugar for the pinned decisions-model
 * refusal) | invalid-response | internal-error. All failures take the
 * identical mechanical path: no decide() call, hard Deliberate with the
 * full panel, one v2 call line with every asked id null. */
function transportFailure(res: Exclude<GateTransportResult, { ok: true }>): FailureShape {
	if (res.kind === "http-error") {
		const refusal = res.status === 400 && res.body.includes(GATE_REFUSAL_MARKER);
		return {
			class: refusal ? "http-400-refusal" : `http-${res.status}`,
			reason: `HTTP ${res.status}: ${res.body}`,
		};
	}
	// timeout | network — the transport's message is the verbatim reason.
	return { class: res.kind, reason: res.message };
}

/** Issue the gate's one call. See the module header for the posture and the
 * recomputability precondition. */
export async function runGate(
	state: GateState,
	questions: GateQuestionSet,
	opts: RunGateOpts,
): Promise<GateRunResult> {
	const { repoRoot, policy, decisionPolicy } = opts;

	// --- Fail-loud pre-POST guards (zero POSTs, zero ledger lines) ---
	// These are programming/data errors, never silent degradations.
	if (policy.mode === "off") {
		throw new Error(
			'gate: runGate — policy.mode is "off" — a gate call under off is a programming error (set mode to advisory or active)',
		);
	}
	if (policy.model !== GATE_PINNED_MODEL) {
		throw new Error(
			`gate: runGate — policy.model is ${JSON.stringify(policy.model)} — the pinned decisions model is ${JSON.stringify(GATE_PINNED_MODEL)} (never the alias)`,
		);
	}
	if (policy.endpoint.includes(GATE_FORBIDDEN_PATH)) {
		throw new Error(
			`gate: runGate — policy.endpoint is ${JSON.stringify(policy.endpoint)} — the ${JSON.stringify(GATE_FORBIDDEN_PATH)} path is the never-path for the pinned decisions model (use ${GATE_ENDPOINT})`,
		);
	}
	// Noul join check: the decision policy's token must name a pole the
	// question data actually has (the shaper maps {yes,no} → {true,false};
	// the token lives in the data vocabulary). Fail-loud naming question id,
	// token, and keys.
	for (const [id, q] of Object.entries(questions.questions)) {
		if (q.type !== "noul") continue;
		const keys = Object.keys(q.criteria as Record<string, string>);
		if (!keys.includes(decisionPolicy.noulProbabilityOf)) {
			throw new Error(
				`gate: runGate — noul question ${id}: decision policy noulProbabilityOf ${JSON.stringify(decisionPolicy.noulProbabilityOf)} is not one of the question's criteria keys [${keys.join(", ")}] — the token must name a pole the question data has`,
			);
		}
	}

	// --- Credential resolution (pre-transport) ---
	const apiKey = opts.apiKey !== undefined ? opts.apiKey : resolveOpenRouterApiKey();
	const transport = opts.transport ?? openRouterDecisionsTransport(apiKey ?? "");
	const timeoutMs = opts.timeoutMs ?? GATE_CALL_TIMEOUT_MS;
	const advisory = policy.mode === "advisory";

	/** EV-69 §5: the basis with the optional suffix folded in — one line, the
	 * verdict verbatim, the ratchet note riding the same write. Absent opt ⇒
	 * the decision's own basis, byte-identical to pre-EV-69. */
	const lineBasis = (decision: GateDecision): string => {
		const suffix = typeof opts.basisSuffix === "function" ? opts.basisSuffix(decision) : opts.basisSuffix;
		return suffix !== undefined && suffix !== "" ? `${decision.basis} — ${suffix}` : decision.basis;
	};

	/** The one failure append: exactly ONE v2 call line — all asked ids
	 * null, the machine class on the line, the verbatim reason exactly once
	 * inside basis. No outcome line is ever written by this module. */
	const failRun = (f: FailureShape): GateRunResult => {
		const decision: GateDecision = {
			mode: "Deliberate",
			include: MODE_PANELS.Deliberate,
			basis: `gate call failed: ${f.reason}`,
		};
		const rec = appendGateCall(
			{
				stateHash: state.stateHash,
				questionSetVersion: questions.version,
				questionIds: Object.keys(questions.questions),
				answers: {},
				resolvedMode: decision.mode,
				policyVersion: policy.policyVersion,
				basis: lineBasis(decision),
				failureClass: f.class,
				drops: state.drops,
				advisory,
				unknownAnswerIds: [],
				...(opts.callId !== undefined ? { callId: opts.callId } : {}),
				...(opts.now !== undefined ? { now: opts.now } : {}),
			},
			repoRoot,
			opts.ledgerPath,
		);
		return { status: "failed", decision, callId: rec.callId, failure: { kind: f.class, reason: f.reason } };
	};

	if (apiKey === null || apiKey.length === 0) {
		return failRun({
			class: "no-api-key",
			reason: "no OpenRouter API key resolved (OPENROUTER_API_KEY env or stored credential)",
		});
	}

	// --- Wire shaping (pre-POST; a mis-keyed noul fails HERE — zero POSTs,
	// zero ledger lines — while loadGateQuestions accepted the file). ---
	const wireQuestions = toWireQuestions(questions);
	let stateValue: unknown;
	try {
		stateValue = JSON.parse(new TextDecoder().decode(state.stateBytes));
	} catch (e) {
		// The producer's packed bytes are unreadable — an internal defect,
		// not a transport failure: fail closed with a recorded line.
		return failRun({
			class: "internal-error",
			reason: `gate: runGate — stateBytes are not decodable JSON: ${e instanceof Error ? e.message : String(e)}`,
		});
	}
	const request = {
		url: policy.endpoint,
		headers: {} as Record<string, string>,
		body: { model: policy.model, state: stateValue, questions: wireQuestions },
		timeoutMs,
	};

	// --- Exactly one transport call. No retry, no fallback. ---
	const res = await transport(request);
	if (!res.ok) {
		return failRun(transportFailure(res));
	}

	// --- Success path: light parse → filter to known ids → decide() → the
	// one v2 call-line append. ---
	try {
		const parsed = parseDecisionsResponse(res.body);
		const knownIds = Object.keys(questions.questions);
		const answers: Record<string, GateAnswer> = {};
		const unknownAnswerIds: string[] = [];
		for (const [id, answer] of Object.entries(parsed.answers)) {
			if (knownIds.includes(id)) answers[id] = answer;
			else unknownAnswerIds.push(id);
		}
		// Unanswered questions are ABSENT from decide()'s input — never a
		// zero, never a negative; they appear only as nulls in the record.
		const decision = decide(answers, decisionPolicy);
		const rec = appendGateCall(
			{
				stateHash: state.stateHash,
				questionSetVersion: questions.version,
				questionIds: knownIds,
				answers,
				resolvedMode: decision.mode,
				policyVersion: policy.policyVersion,
				basis: lineBasis(decision),
				model: parsed.model,
				provider: parsed.provider,
				usage: parsed.usage,
				generationId: parsed.generationId,
				drops: state.drops,
				advisory,
				unknownAnswerIds,
				...(opts.callId !== undefined ? { callId: opts.callId } : {}),
				...(opts.now !== undefined ? { now: opts.now } : {}),
			},
			repoRoot,
			opts.ledgerPath,
		);
		const reportedModel = parsed.model;
		return {
			status: "ok",
			decision,
			callId: rec.callId,
			reportedModel,
			...(reportedModel !== GATE_PINNED_MODEL
				? { modelDrift: { pinned: GATE_PINNED_MODEL, reported: reportedModel } }
				: {}),
		};
	} catch (e) {
		// 2xx garbage → the invalid-response catch-all → fail-closed
		// Deliberate (light validation + one coarser class; fail-closed wins).
		return failRun({
			class: "invalid-response",
			reason: e instanceof Error ? e.message : String(e),
		});
	}
}

// ---------------------------------------------------------------------------
// EV-81 — the follow-up review's one-call orchestration: the followup arm of
// the fail-closed Jev transport.
//
// runFollowupGate is a MIRROR of runGate, not a parameterization of it
// (EV-80's no-shared-core fork precedent, ratified by the EV-81
// deliberation): the two fail-safe targets differ by design — a failed
// followup call resolves to the LITERAL decision
// `{ disposition: "File", basis: "gate call failed: <reason>" }`, never
// routed through decideFollowup and never touching MODE_PANELS. File IS the
// human-confirm fallback (decideFollowup's own else-arm); the literal
// constructor is what makes "zero Drop, zero automatic Merge" hold by
// construction on every failure path. The reuse is of the TRANSPORT SEAM —
// GateTransport, openRouterDecisionsTransport, parseDecisionsResponse,
// toWireQuestions, GATE_REFUSAL_MARKER, GATE_FORBIDDEN_PATH, imported
// verbatim from gate-transport.ts — plus this module's private
// transportFailure/FailureShape mechanics (the one failure taxonomy; the
// shared-helper colocation is what keeps a second taxonomy from forking).
//
// The reuse seam also means the two appendGateCall lines below carry
// `policyVersion: decisionPolicy.version` (the followup DECISION policy's
// version, e.g. "followup-decision-1") — a DELIBERATE DIVERGENCE from
// runGate's literal `policy.policyVersion`. The shipped runGate writer is
// the buggy side (verified end-to-end by the EV-81 skeptic's O1 probe:
// resolveRoute validates against the decision policy's version, so every
// live card-gate line is classified as policy drift and EV-69's
// recorded-decision fast path is dead); the shipped fix is carded at step 13
// and is NOT replicated here — EV-81 writes the corrective direction only.
//
// SIGNATURE CONVENTION (deliberate, so the next caller does not guess):
// state, questions, policy, and decisionPolicy are POSITIONAL parameters —
// unlike runGate, whose RunGateOpts keeps policy/decisionPolicy inside the
// opts object. The two conventions are siblings, not one evolving shape;
// RunFollowupOpts carries exactly RunGateOpts's injection surface MINUS
// basisSuffix (the EV-69 ratchet note is a card-gate concept with no
// followup analogue): repoRoot (required), transport?, apiKey?, now?,
// timeoutMs?, callId?, ledgerPath?.
//
// Guards are mirrored verbatim from runGate and all throw pre-POST with
// zero ledger lines. `policy.mode === "off"` throws here (a followup call
// under off is a programming error, R1: the same loadGatePolicy resolver
// feeds both domains) — but the OFF SHORT-CIRCUIT LIVES IN THE CALLER,
// BEFORE buildFollowupState (followup-state.ts's own comment assigns it
// there): an off policy may omit gateStateBudgetTokens, so letting the call
// site reach the packer would throw from the packer instead.
//
// FollowupState arrives as a TYPE-ONLY import (erases
// followup-state/gate-route from this module's runtime graph). Like runGate,
// runFollowupGate loads nothing itself: the caller composes the loaders and
// buildFollowupState. The timeout lives entirely in the transport; this
// section adds no fs beyond appendGateCall's one append and no network
// beyond the injected transport.
// ---------------------------------------------------------------------------

/** Mirrors GateRunResult field-for-field: EV-82's unavailable-state render
 * distinguishes `gate call failed: <reason>` from `credential unresolved` by
 * `failure.kind`, and EV-83's ESCALATION composes from the same kind+reason —
 * a caller holding only the decision would have to string-match the basis. */
export interface FollowupRunResult {
	status: "ok" | "failed";
	decision: FollowupDecision;
	callId: string;
	/** Present iff status "failed": the machine class (`kind` — the same
	 * tag the ledger line carries as `failure.class`) and the verbatim
	 * reason, which on the line lives ONLY inside `basis`. */
	failure?: { kind: string; reason: string };
	/** The versioned model the response reported (success path). */
	reportedModel?: string | null;
	/** Present iff the reported model differs from the pin. */
	modelDrift?: { pinned: string; reported: string };
}

export interface RunFollowupOpts {
	/** REQUIRED: the ledger's repo root — a call without it cannot append,
	 * to the real committed ledger or anywhere. */
	repoRoot: string;
	/** Injectable transport (tests always inject; production passes
	 * openRouterDecisionsTransport(apiKey)). */
	transport?: GateTransport;
	/** An explicit apiKey bypasses resolution; undefined resolves through
	 * resolveOpenRouterApiKey() (env → stored credential → null) — the
	 * byte-identical expression preflight.ts runs. An explicit null fails
	 * closed with the `no-api-key` class. */
	apiKey?: string | null;
	/** Injectable write clock. */
	now?: () => string;
	/** Provisional default 120_000 (GATE_CALL_TIMEOUT_MS). */
	timeoutMs?: number;
	/** Injectable call identity (default randomUUID). */
	callId?: string;
	/** Ledger path override (default gateLedgerPath(repoRoot)). */
	ledgerPath?: string;
}

/** Issue the followup review's one call. See the section header above for
 * the posture, the deliberate policyVersion divergence, and the positional
 * signature convention. */
export async function runFollowupGate(
	state: FollowupState,
	questions: GateQuestionSet,
	policy: GatePolicy,
	decisionPolicy: FollowupDecisionPolicy,
	opts: RunFollowupOpts,
): Promise<FollowupRunResult> {
	const { repoRoot } = opts;

	// --- Fail-loud pre-POST guards (zero POSTs, zero ledger lines) —
	// mirrored verbatim from runGate. ---
	if (policy.mode === "off") {
		throw new Error(
			'gate: runFollowupGate — policy.mode is "off" — a followup call under off is a programming error (set mode to advisory or active)',
		);
	}
	if (policy.model !== GATE_PINNED_MODEL) {
		throw new Error(
			`gate: runFollowupGate — policy.model is ${JSON.stringify(policy.model)} — the pinned decisions model is ${JSON.stringify(GATE_PINNED_MODEL)} (never the alias)`,
		);
	}
	if (policy.endpoint.includes(GATE_FORBIDDEN_PATH)) {
		throw new Error(
			`gate: runFollowupGate — policy.endpoint is ${JSON.stringify(policy.endpoint)} — the ${JSON.stringify(GATE_FORBIDDEN_PATH)} path is the never-path for the pinned decisions model (use ${GATE_ENDPOINT})`,
		);
	}
	// Noul join check: the followup decision policy's token must name a pole
	// the question data actually has (the shaper maps {yes,no} → {true,false};
	// the token lives in the data vocabulary). Fail-loud naming question id,
	// token, and keys.
	for (const [id, q] of Object.entries(questions.questions)) {
		if (q.type !== "noul") continue;
		const keys = Object.keys(q.criteria as Record<string, string>);
		if (!keys.includes(decisionPolicy.noulProbabilityOf)) {
			throw new Error(
				`gate: runFollowupGate — noul question ${id}: decision policy noulProbabilityOf ${JSON.stringify(decisionPolicy.noulProbabilityOf)} is not one of the question's criteria keys [${keys.join(", ")}] — the token must name a pole the question data has`,
			);
		}
	}

	// --- Credential resolution (pre-transport) — the byte-identical
	// expression preflight.ts runs, so runtime parity with the run-start
	// loud failure is by construction (EV-76 owns that arm; no second
	// preflight is forked here). ---
	const apiKey = opts.apiKey !== undefined ? opts.apiKey : resolveOpenRouterApiKey();
	const transport = opts.transport ?? openRouterDecisionsTransport(apiKey ?? "");
	const timeoutMs = opts.timeoutMs ?? GATE_CALL_TIMEOUT_MS;
	const advisory = policy.mode === "advisory";

	/** The one failure append: exactly ONE v2 call line — all asked ids
	 * null, the machine class on the line, the verbatim reason exactly once
	 * inside basis. The decision is the LITERAL fail-safe target (see the
	 * section header): File by construction, never decideFollowup's. */
	const failRun = (f: FailureShape): FollowupRunResult => {
		const decision: FollowupDecision = {
			disposition: "File",
			basis: `gate call failed: ${f.reason}`,
		};
		const rec = appendGateCall(
			{
				stateHash: state.stateHash,
				questionSetVersion: questions.version,
				questionIds: Object.keys(questions.questions),
				answers: {},
				resolvedMode: decision.disposition,
				// DELIBERATE DIVERGENCE from runGate's literal: the followup
				// line carries the DECISION policy's version, not
				// policy.policyVersion — see the section header.
				policyVersion: decisionPolicy.version,
				basis: decision.basis,
				failureClass: f.class,
				drops: state.drops,
				advisory,
				unknownAnswerIds: [],
				...(opts.callId !== undefined ? { callId: opts.callId } : {}),
				...(opts.now !== undefined ? { now: opts.now } : {}),
			},
			repoRoot,
			opts.ledgerPath,
		);
		return { status: "failed", decision, callId: rec.callId, failure: { kind: f.class, reason: f.reason } };
	};

	// Defense-in-depth (mirrored from runGate): the run-start preflight is
	// the loud arm; this failRun keeps an unresolved credential from ever
	// reaching the transport.
	if (apiKey === null || apiKey.length === 0) {
		return failRun({
			class: "no-api-key",
			reason: "no OpenRouter API key resolved (OPENROUTER_API_KEY env or stored credential)",
		});
	}

	// --- Wire shaping (pre-POST; a mis-keyed noul fails HERE — zero POSTs,
	// zero ledger lines — while loadFollowupQuestions accepted the file). ---
	const wireQuestions = toWireQuestions(questions);
	let stateValue: unknown;
	try {
		stateValue = JSON.parse(new TextDecoder().decode(state.stateBytes));
	} catch (e) {
		// The producer's packed bytes are unreadable — an internal defect,
		// not a transport failure: fail closed with a recorded line.
		return failRun({
			class: "internal-error",
			reason: `gate: runFollowupGate — stateBytes are not decodable JSON: ${e instanceof Error ? e.message : String(e)}`,
		});
	}
	const request = {
		url: policy.endpoint,
		headers: {} as Record<string, string>,
		body: { model: policy.model, state: stateValue, questions: wireQuestions },
		timeoutMs,
	};

	// --- Exactly one transport call. No retry, no fallback. ---
	const res = await transport(request);
	if (!res.ok) {
		return failRun(transportFailure(res));
	}

	// --- Success path: light parse → filter to known ids → decideFollowup →
	// the one v2 call-line append. ---
	try {
		const parsed = parseDecisionsResponse(res.body);
		const knownIds = Object.keys(questions.questions);
		const answers: Record<string, GateAnswer> = {};
		const unknownAnswerIds: string[] = [];
		for (const [id, answer] of Object.entries(parsed.answers)) {
			if (knownIds.includes(id)) answers[id] = answer;
			else unknownAnswerIds.push(id);
		}
		// Unanswered questions are ABSENT from decideFollowup's input — never
		// a zero, never a negative; they appear only as nulls in the record.
		const decision = decideFollowup(answers, decisionPolicy);
		const rec = appendGateCall(
			{
				stateHash: state.stateHash,
				questionSetVersion: questions.version,
				questionIds: knownIds,
				answers,
				resolvedMode: decision.disposition,
				// DELIBERATE DIVERGENCE from runGate's literal (both arms):
				// policyVersion carries the followup DECISION policy's version
				// and questionSetVersion the followup question set's — see the
				// section header.
				policyVersion: decisionPolicy.version,
				basis: decision.basis,
				model: parsed.model,
				provider: parsed.provider,
				usage: parsed.usage,
				generationId: parsed.generationId,
				drops: state.drops,
				advisory,
				unknownAnswerIds,
				...(opts.callId !== undefined ? { callId: opts.callId } : {}),
				...(opts.now !== undefined ? { now: opts.now } : {}),
			},
			repoRoot,
			opts.ledgerPath,
		);
		const reportedModel = parsed.model;
		return {
			status: "ok",
			decision,
			callId: rec.callId,
			reportedModel,
			...(reportedModel !== GATE_PINNED_MODEL
				? { modelDrift: { pinned: GATE_PINNED_MODEL, reported: reportedModel } }
				: {}),
		};
	} catch (e) {
		// 2xx garbage (or a decideFollowup throw — an out-of-range choice
		// probability rides in here verbatim) → the invalid-response
		// catch-all → fail-closed File (one coarser class; fail-closed wins).
		return failRun({
			class: "invalid-response",
			reason: e instanceof Error ? e.message : String(e),
		});
	}
}
