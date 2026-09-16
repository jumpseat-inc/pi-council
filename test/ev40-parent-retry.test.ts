// EV-40 — pure parent-retry units (TDD): the shared §2.4 one-pass context
// filter, then the D2 parent predicate, the backoff policy, the copy
// formatters, the settle decision helpers, and the RetryController/RetryEditor
// component behavior.
//
// O3 literal hygiene: every classification test here uses the WITH-COLON
// intake literal PROVIDER_FINISH_REASON_ERROR ("Provider finish_reason: error")
// — never the colon-less EV-43 falsifier string, which is classify-negative on
// both clauses and tests nothing (Skeptic O3, standing order).
import { describe, expect, test } from "bun:test";
import { createOnePassErrorFilter, type FilterableMessage } from "../extensions/parent-retry.ts";
import {
	PROVIDER_FINISH_REASON_ERROR,
	classifyParentTurnRetry,
	computeBackoffDelay,
} from "../extensions/retry.ts";

const erroredAssistant = (errorMessage: string = PROVIDER_FINISH_REASON_ERROR): FilterableMessage =>
	({
		role: "assistant",
		content: [],
		stopReason: "error",
		errorMessage,
	});

const user = (text: string): FilterableMessage =>
	({ role: "user", content: [{ type: "text", text }] });

const toolResult = (): FilterableMessage =>
	({ role: "toolResult", content: [], toolCallId: "t1" });

describe("EV-40 §2.4 — structural one-pass context filter (single source)", () => {
	test("un-armed → undefined (no filter change)", () => {
		const filter = createOnePassErrorFilter();
		const messages = [user("hi"), erroredAssistant()];
		expect(filter.apply(messages)).toBeUndefined();
		expect(filter.isArmed()).toBe(false);
	});

	test("armed → strips EVERY errored assistant message in one pass, then disarms", () => {
		const filter = createOnePassErrorFilter();
		const messages = [
			user("start"),
			erroredAssistant(),
			user("EV40-CONTINUE"),
			erroredAssistant(),
			user("EV40-CONTINUE"),
		];
		filter.arm();
		const out = filter.apply(messages);
		expect(out).not.toBeUndefined();
		expect(out!.length).toBe(3);
		expect(out!.every((m) => m.role !== "assistant")).toBe(true);
		// exactly one pass: the second call is a no-op
		expect(filter.isArmed()).toBe(false);
		expect(filter.apply([erroredAssistant()])).toBeUndefined();
	});

	test("armed but no errored message present → disarms and returns undefined (no accidental second pass)", () => {
		const filter = createOnePassErrorFilter();
		const messages = [user("hi"), user("again")];
		filter.arm();
		expect(filter.apply(messages)).toBeUndefined();
		expect(filter.isArmed()).toBe(false);
	});

	test("never touches non-assistant messages; an assistant error with a DIFFERENT errorMessage is kept", () => {
		const filter = createOnePassErrorFilter();
		const messages = [user("start"), erroredAssistant("some other failure"), toolResult()];
		filter.arm();
		// Per §2.4: armed but no literal-matched errored assistant → undefined, no change.
		expect(filter.apply(messages)).toBeUndefined();
		expect(filter.isArmed()).toBe(false);
		expect(messages.length).toBe(3); // the caller's list is never mutated
	});

	test("disarm() cancels an armed pass (abort paths)", () => {
		const filter = createOnePassErrorFilter();
		filter.arm();
		filter.disarm();
		expect(filter.apply([erroredAssistant()])).toBeUndefined();
	});
});

describe("EV-40 D2 — classifyParentTurnRetry (the parent-loop predicate)", () => {
	test('"retry" for the with-colon intake literal (O3 hygiene)', () => {
		expect(classifyParentTurnRetry({ stopReason: "error", errorMessage: PROVIDER_FINISH_REASON_ERROR })).toBe("retry");
	});

	test("undefined for a message pi itself retries — pi already spent its budget before settle", () => {
		expect(classifyParentTurnRetry({ stopReason: "error", errorMessage: "Provider returned 502: upstream unavailable" })).toBeUndefined();
		expect(classifyParentTurnRetry({ stopReason: "error", errorMessage: "overloaded" })).toBeUndefined();
	});

	test("undefined for stopReason stop / length / aborted / absent", () => {
		expect(classifyParentTurnRetry({ stopReason: "stop", errorMessage: PROVIDER_FINISH_REASON_ERROR })).toBeUndefined();
		expect(classifyParentTurnRetry({ stopReason: "length" })).toBeUndefined();
		expect(classifyParentTurnRetry({ stopReason: "aborted" })).toBeUndefined();
		expect(classifyParentTurnRetry({})).toBeUndefined();
	});

	test("undefined for a missing message", () => {
		expect(classifyParentTurnRetry(null as never)).toBeUndefined();
	});
});

describe("EV-40 — computeBackoffDelay (pure policy)", () => {
	const policy = { baseDelayMs: 2000, maxDelayMs: 30000, jitter: true };

	test("attempt 2 is baseDelayMs; exponential growth caps at maxDelayMs", () => {
		expect(computeBackoffDelay({ ...policy, jitter: false }, 2)).toBe(2000);
		expect(computeBackoffDelay({ ...policy, jitter: false }, 3)).toBe(4000);
		expect(computeBackoffDelay({ ...policy, jitter: false }, 4)).toBe(8000);
		expect(computeBackoffDelay({ baseDelayMs: 2000, maxDelayMs: 5000, jitter: false }, 5)).toBe(5000);
	});

	test("jitter multiplies by (0.5 + rand), rounded — injected rand", () => {
		expect(computeBackoffDelay(policy, 2, () => 0)).toBe(1000); // halved (lower bound)
		expect(computeBackoffDelay(policy, 2, () => 0.5)).toBe(2000); // multiplier exactly 1.0
	});

	test("jitter bounds: attempt 2 ∈ [1000, 3000), attempt 3 ∈ [2000, 6000) with the defaults", () => {
		for (let i = 0; i < 200; i++) {
			const d2 = computeBackoffDelay(policy, 2);
			const d3 = computeBackoffDelay(policy, 3);
			expect(d2).toBeGreaterThanOrEqual(1000);
			expect(d2).toBeLessThan(3000);
			expect(d3).toBeGreaterThanOrEqual(2000);
			expect(d3).toBeLessThan(6000);
		}
	});

	test("jitter honors the maxDelayMs cap — the cap binds BEFORE jitter, so the jittered result stays within the spec's [0.5, 1.5) × cap envelope (§2.1 pins the formula)", () => {
		const capped = { baseDelayMs: 2000, maxDelayMs: 5000, jitter: true };
		for (let i = 0; i < 200; i++) {
			const d = computeBackoffDelay(capped, 6, Math.random);
			expect(d).toBeGreaterThanOrEqual(2500);
			expect(d).toBeLessThan(7500); // multiplier is strictly < 1.5
		}
	});
});
