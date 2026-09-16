// EV-37 — pure retry classification for settled job reports (ruling R1).
//
// The retry decision keys on stopReason + errorMessage and never on state:
// a provider-errored child exits 0 and settles as `done`, so "retry failed
// jobs" is wrong on arrival. Council's classifier is a superset of pi's
// shipped retryable-provider-error pattern — it never retries less than pi.
import type { JobReport, JobState } from "./hub.ts";

/**
 * Snapshot of pi's RETRYABLE_PROVIDER_ERROR_PATTERN source tokens, pinned to
 * @earendil-works/pi-coding-agent@0.85.1
 * (dist/bundle/chunks/chunk-JVUZSMYM.js:475), where
 * buildProviderErrorPattern(tokens) = new RegExp(tokens.join("|"), "i").
 * The compiled pattern is not exported from pi's public API (no .d.ts
 * declaration, absent from dist/index.js), so council re-declares the token
 * list verbatim. test/retry.test.ts re-extracts the list from the installed
 * bundle and asserts equality — a pi update that changes the list fails the
 * suite and forces a deliberate snapshot refresh (R1: never silently narrow,
 * never silently widen).
 */
export const RETRYABLE_PROVIDER_ERROR_PATTERNS = [
	"overloaded",
	"rate.?limit",
	"too many requests",
	"429",
	"500",
	"502",
	"503",
	"504",
	"524",
	"service.?unavailable",
	"server.?error",
	"internal.?error",
	"provider.?returned.?error",
	"exceeded request buffer limit while retrying upstream",
	"network.?error",
	"connection.?error",
	"connection.?refused",
	"connection.?lost",
	"other side closed",
	"fetch failed",
	"getaddrinfo",
	"ENOTFOUND",
	"EAI_AGAIN",
	"upstream.?connect",
	"reset before headers",
	"socket hang up",
	"socket connection was closed",
	"timed? out",
	"timeout",
	"terminated",
	"websocket.?closed",
	"websocket.?error",
	"ended without",
	"stream ended before message_stop",
	"stream ended before a terminal response event",
	"http2 request did not get a response",
	"retry delay",
	"you can retry your request",
	"try your request again",
	"please retry your request",
	"ResourceExhausted",
] as const;

/** Council-widened literal: pi's emitted message for a declined finish_reason
 * (mapStopReason's default case, `Provider finish_reason: ${reason}`, at
 * reason === "error" — dist/bundle/chunks/openai-completions-EKZT2IH2.js).
 * The card's Intent binds "the literal" to pi's real emitted message (Resume 2
 * PO ruling, job-8); test/retry.test.ts derives the expectation from the
 * installed bundle and asserts byte-for-byte equality. */
export const PROVIDER_FINISH_REASON_ERROR = "Provider finish_reason: error";

const RETRYABLE_PROVIDER_ERROR = new RegExp(RETRYABLE_PROVIDER_ERROR_PATTERNS.join("|"), "i");

const SETTLED_STATES: readonly JobState[] = ["done", "failed", "cancelled", "stalled", "timeout"];
const TERMINAL_STATES: readonly JobState[] = ["failed", "cancelled", "stalled", "timeout"];

export type RetryVerdict = "retry" | "terminal";

/**
 * Classify a settled job report for the retry loop (EV-38's input).
 *
 * - "retry"    — settled, stopReason "error", and the message is the literal
 *                Provider finish_reason: error (pi's emitted message) or
 *                matches pi's shipped
 *                retryable pattern (state-independent: state never blocks a
 *                retry pi itself would make).
 * - "terminal" — settled with stopReason "stop"/"length", or one of the
 *                failed/cancelled/stalled/timeout states (the state clause is
 *                the default terminal for settled failures carrying no
 *                retryable signal; it never overrides a retry match).
 * - undefined  — every other input: running reports, missing stopReason,
 *                "aborted"/"pending", or an error stopReason whose message is
 *                missing or non-retryable (pi wouldn't retry it either).
 */
export function classifyRetry(report: JobReport): RetryVerdict | undefined {
	if (!SETTLED_STATES.includes(report.state)) return undefined;
	if (report.stopReason === "error") {
		const message = report.errorMessage ?? "";
		if (message === PROVIDER_FINISH_REASON_ERROR || RETRYABLE_PROVIDER_ERROR.test(message)) {
			return "retry";
		}
	}
	if (report.stopReason === "stop" || report.stopReason === "length") return "terminal";
	if (TERMINAL_STATES.includes(report.state)) return "terminal";
	return undefined;
}
