// EV-65 — offline tests for the gate transport seam: the pure wire shaper
// (noul yes/no → true/false bijection), the light response parser, and the
// pure transport-failure classifier. No network, no timers: the real HTTP
// transport is never constructed here (its live probe is gated behind
// COUNCIL_INTEGRATION=1 in test/gate-run-live.test.ts).
import { test, expect } from "bun:test";
import {
	GATE_FORBIDDEN_PATH,
	GATE_REFUSAL_MARKER,
	classifyTransportFailure,
	parseDecisionsResponse,
	toWireQuestions,
} from "../extensions/gate-transport.ts";
import type { GateQuestionSet } from "../extensions/gate.ts";

// ---------------------------------------------------------------------------
// classifyTransportFailure — pure; a thrown error becomes a value
// ---------------------------------------------------------------------------

test("classifyTransportFailure: an AbortError becomes kind timeout with the pinned message", () => {
	const e = new Error("The operation was aborted");
	e.name = "AbortError";
	expect(classifyTransportFailure(e, 5000)).toEqual({
		ok: false,
		kind: "timeout",
		message: "timeout after 5000ms",
	});
});

test("classifyTransportFailure: any other thrown error becomes kind network with its message", () => {
	expect(classifyTransportFailure(new Error("ECONNREFUSED"), 5000)).toEqual({
		ok: false,
		kind: "network",
		message: "ECONNREFUSED",
	});
});

test("classifyTransportFailure: a non-Error thrown value still becomes a network value", () => {
	expect(classifyTransportFailure("boom", 1200)).toEqual({
		ok: false,
		kind: "network",
		message: "boom",
	});
});

// ---------------------------------------------------------------------------
// toWireQuestions — the noul bijection {yes,no} → {true,false}
// ---------------------------------------------------------------------------

const questions = (q: GateQuestionSet["questions"]): GateQuestionSet => ({ version: "qs-test", questions: q });

test("toWireQuestions: a noul keyed {yes,no} maps to the wire axis true/false, descriptions preserved", () => {
	const out = toWireQuestions(
		questions({
			reversible: {
				type: "noul",
				instructions: "Reversible?",
				criteria: { yes: "cheap revert", no: "one-way door" },
			},
		}),
	);
	expect(Object.keys(out.reversible!.criteria as Record<string, string>).sort()).toEqual(["false", "true"]);
	const c = out.reversible!.criteria as Record<string, string>;
	expect(c["true"]).toBe("cheap revert");
	expect(c["false"]).toBe("one-way door");
	expect(out.reversible!.instructions).toBe("Reversible?");
});

test("toWireQuestions: a mis-keyed noul throws pre-POST naming the question id and the keys", () => {
	const misKeyed = questions({
		reversible: {
			type: "noul",
			instructions: "Reversible?",
			criteria: { favorable: "cheap", unfavorable: "costly" },
		},
	});
	expect(() => toWireQuestions(misKeyed)).toThrow(/reversible/);
	expect(() => toWireQuestions(misKeyed)).toThrow(/favorable, unfavorable/);
});

test("toWireQuestions: a noul with an extra key is rejected — the key set must be exactly {yes,no}", () => {
	const extraKeyed = questions({ q: { type: "noul", instructions: "?", criteria: { yes: "a", no: "b", maybe: "c" } } });
	expect(() => toWireQuestions(extraKeyed)).toThrow(/maybe/);
});

test("toWireQuestions: a choice question's option labels pass through untouched (yes/no stay yes/no)", () => {
	const out = toWireQuestions(
		questions({
			decidablyTestable: {
				type: "choice",
				instructions: "Testable?",
				criteria: { yes: "a test decides", no: "judgment required" },
			},
		}),
	);
	expect(out.decidablyTestable!.criteria).toEqual({ yes: "a test decides", no: "judgment required" });
	expect(out.decidablyTestable!.type).toBe("choice");
});

test("toWireQuestions: a score question's ordered criteria array passes through untouched", () => {
	const out = toWireQuestions(
		questions({ scorable: { type: "score", instructions: "Score it.", criteria: ["low", "high"] } }),
	);
	expect(out.scorable!.criteria).toEqual(["low", "high"]);
});

// ---------------------------------------------------------------------------
// parseDecisionsResponse — light validation, answers verbatim
// ---------------------------------------------------------------------------

const liveShapeBody = JSON.stringify({
	model: "typesafe/jev-1.13-20260917",
	answers: {
		reversible: { type: "noul", probability: 0.9 },
		decidablyTestable: { type: "choice", value: "yes", probabilities: { yes: 0.93, no: 0.07 }, confidence: 0.91 },
	},
	usage: { input_tokens: 1200, output_tokens: 90, cost: 0.0031 },
	provider: "Typesafe",
	id: "gen-dec-abc123",
});

test("parseDecisionsResponse: the live-capture shape parses model, verbatim answers, usage, provider, generation id", () => {
	const p = parseDecisionsResponse(liveShapeBody);
	expect(p.model).toBe("typesafe/jev-1.13-20260917");
	expect(p.answers.reversible).toEqual({ type: "noul", probability: 0.9 });
	expect(p.answers.decidablyTestable).toEqual({
		type: "choice",
		value: "yes",
		probabilities: { yes: 0.93, no: 0.07 },
		confidence: 0.91,
	});
	expect(p.usage).toEqual({ input_tokens: 1200, output_tokens: 90, cost: 0.0031 });
	expect(p.provider).toBe("Typesafe");
	expect(p.generationId).toBe("gen-dec-abc123");
});

test("parseDecisionsResponse: absent usage/provider/id parse as nulls, never fabricated", () => {
	const p = parseDecisionsResponse(JSON.stringify({ model: "m", answers: {} }));
	expect(p.usage).toEqual({ input_tokens: null, output_tokens: null, cost: null });
	expect(p.provider).toBeNull();
	expect(p.generationId).toBeNull();
});

test("parseDecisionsResponse: garbage bodies throw (the runGate catch-all turns them into invalid-response)", () => {
	expect(() => parseDecisionsResponse("not json")).toThrow(/invalid decisions response/);
	expect(() => parseDecisionsResponse("[1,2]")).toThrow(/root must be a JSON object/);
	expect(() => parseDecisionsResponse(JSON.stringify({ answers: {} }))).toThrow(/model/);
	expect(() => parseDecisionsResponse(JSON.stringify({ model: "m" }))).toThrow(/answers/);
});

// ---------------------------------------------------------------------------
// Source pins for the transport module itself
// ---------------------------------------------------------------------------

test("the refusal marker and the forbidden path are the pinned literals", () => {
	expect(GATE_REFUSAL_MARKER).toContain("decisions model");
	expect(GATE_FORBIDDEN_PATH).toBe("/chat/completions");
});
