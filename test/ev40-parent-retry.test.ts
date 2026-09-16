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
import type { AgentMessage } from "@earendil-works/pi-coding-agent";
import { createOnePassErrorFilter } from "../extensions/parent-retry.ts";
import { PROVIDER_FINISH_REASON_ERROR } from "../extensions/retry.ts";

const erroredAssistant = (errorMessage: string = PROVIDER_FINISH_REASON_ERROR): AgentMessage =>
	({
		role: "assistant",
		content: [],
		stopReason: "error",
		errorMessage,
	} as unknown as AgentMessage);

const user = (text: string): AgentMessage =>
	({ role: "user", content: [{ type: "text", text }] } as unknown as AgentMessage);

const toolResult = (): AgentMessage =>
	({ role: "toolResult", content: [], toolCallId: "t1" } as unknown as AgentMessage);

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
