// EV-40 — parent-turn retry: the §2.4 structural one-pass context filter.
//
// This module is the SINGLE SOURCE for the filter: the offline harness
// (test/ev40-harness/ev40-harness-extension.ts, D1 arm B) and the engine
// (extensions/index.ts parent mode) both register a `context` handler that
// consults this one implementation, so the D1 probe exercises exactly what
// ships.
//
// Constraint O4 (settled): the `context` hook delivers a `structuredClone` of
// the message list per handler, so object identity is dead — the filter is
// structural, armed for exactly ONE provider request, and drops EVERY
// matching errored assistant message (a 3-attempt chain persists one errored
// assistant turn per attempt; a trailing-only filter would leave the earlier
// turns in attempt 3's request).
import type { AgentMessage } from "@earendil-works/pi-coding-agent";
import { PROVIDER_FINISH_REASON_ERROR } from "./retry.ts";

export interface OnePassContextFilter {
	/** Arm for exactly one provider request. */
	arm(): void;
	/** Disarm without a pass (abort paths, resets). */
	disarm(): void;
	isArmed(): boolean;
	/**
	 * Per spec §2.4: un-armed → undefined (no filter change). Armed → strip
	 * EVERY assistant message with stopReason "error" whose errorMessage
	 * equals the literal (structural match), disarm, and return the filtered
	 * list. If no such message is present, disarm and return undefined (no
	 * accidental second pass). Never touches non-assistant messages; the
	 * toolResult pairing is unaffected.
	 */
	apply(messages: AgentMessage[]): AgentMessage[] | undefined;
}

function isErroredAssistant(
	m: AgentMessage,
	literal: string,
): boolean {
	return (
		m.role === "assistant" &&
		m.stopReason === "error" &&
		(m.errorMessage ?? "") === literal
	);
}

export function createOnePassErrorFilter(
	literal: string = PROVIDER_FINISH_REASON_ERROR,
): OnePassContextFilter {
	let armed = false;
	return {
		arm: () => {
			armed = true;
		},
		disarm: () => {
			armed = false;
		},
		isArmed: () => armed,
		apply(messages) {
			if (!armed) return undefined;
			armed = false; // exactly one pass
			const kept = messages.filter((m) => !isErroredAssistant(m, literal));
			if (kept.length === messages.length) return undefined; // nothing to strip
			return kept;
		},
	};
}
