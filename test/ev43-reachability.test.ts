// EV-43 — reachability falsifier for parent-turn continuation (per-branch
// answer encoded as a regression test).
//
// The falsifier runs on the SHARED offline faux-provider harness
// (test/faux-provider/harness.ts + extension.ts — FLLWUP-49 dedup; the
// retired ev43/ scratch extension and runner this test originally drove are
// recorded in council/cards/EV-43.md). It drives the REAL installed pi CLI
// headless with a scripted fail-once faux provider. The injected failure is
// the intake's recorded class (EV-41): the bare string `Provider finish_reason
// error` as errorMessage — byte-identical to the original observation via the
// harness extension's EV40_ERROR_MESSAGE knob (the shared extension's default
// literal is the with-colon spelling, which does NOT contain the colon-less
// substring).
//
// Attribution claim (asserted here against pi's own classifier): that string
// does NOT match RETRYABLE_PROVIDER_ERROR_PATTERN, so pi's auto-retry never
// re-issues the call — any second assistant message is attributable to the
// agent_settled handler's sendUserMessage, and the control arm (same provider
// behavior, no continuation arm) showing NO second message is what makes the
// answer mean what the card says.
//
// Observed on this tree (see the falsifier runs + PR evidence): headless -p —
// treatment PRESENT, control ABSENT. The observed outcome is encoded below as
// a characterization test; if the engine's reachability changes, this goes
// red and EV-40's mechanism card must be re-examined.
import { describe, expect, test } from "bun:test";
import { isRetryableAssistantError } from "@earendil-works/pi-ai";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
	CONTINUATION_MARKER,
	CONTINUATION_PROMPT,
	hasUserMessage,
	runHarnessArm,
	secondMessagePresent,
} from "./faux-provider/harness.ts";

/** The recorded EV-43 forcing class, colon-less — byte-identical to the
 * observation recorded in council/cards/EV-43.md; injected through the
 * EV40_ERROR_MESSAGE knob. */
const EV43_INJECTED_ERROR_MESSAGE = "Provider finish_reason error";

describe("EV-43 reachability falsifier", () => {
	test("injected failure class `Provider finish_reason error` is NOT retryable by pi (attribution)", () => {
		// The intake's failure class must not be confounded with pi's own
		// auto-retry: pi's RETRYABLE_PROVIDER_ERROR_PATTERN must not match it.
		const msg = {
			role: "assistant",
			content: [],
			api: "faux",
			provider: "ev43",
			model: "ev43-model",
			usage: {
				input: 0,
				output: 0,
				cacheRead: 0,
				cacheWrite: 0,
				totalTokens: 0,
				cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
			},
			stopReason: "error",
			errorMessage: "Provider finish_reason error",
			timestamp: Date.now(),
		} as any;
		expect(isRetryableAssistantError(msg)).toBe(false);
		// Contrast: the existing stub `error` mode's message DOES match the
		// retryable pattern (EV-41's Intent records this).
		const retryable = { ...msg, errorMessage: "Provider returned 502: upstream unavailable" } as any;
		expect(isRetryableAssistantError(retryable)).toBe(true);
	});

	test(
		"headless -p: agent_settled handler sendUserMessage produces a second assistant message; control does not",
		() => {
			const scratchRoot = mkdtempSync(join(tmpdir(), "ev43-test-"));
			try {
				// Treatment: the harness's `inside` arm — the agent_settled handler
				// sends the continuation inside the handler (the EV-43 falsifier
				// pattern). Control: identical provider behavior, no continuation
				// arm (EV40_ARM=none).
				const treatment = runHarnessArm(
					{ label: "ev43-treatment", fails: 1, arm: "inside", errorMessage: EV43_INJECTED_ERROR_MESSAGE },
					scratchRoot,
				);
				const control = runHarnessArm(
					{ label: "ev43-control", fails: 1, arm: "none", errorMessage: EV43_INJECTED_ERROR_MESSAGE },
					scratchRoot,
				);
				// Treatment: session shows start -> error -> continuation send ->
				// second assistant message; print mode's stdout line IS that second
				// message.
				expect(secondMessagePresent(treatment)).toBe(true);
				expect(hasUserMessage(treatment, CONTINUATION_PROMPT)).toBe(true);
				expect(treatment.stdout).toContain(CONTINUATION_MARKER);
				// Control: identical provider behavior, no mechanism — no second
				// assistant message, and the turn ends with the bare error (exit 1).
				expect(secondMessagePresent(control)).toBe(false);
				expect(hasUserMessage(control, CONTINUATION_PROMPT)).toBe(false);
				expect(control.stderr).toContain(EV43_INJECTED_ERROR_MESSAGE);
				expect(control.exitCode).toBe(1);
			} finally {
				rmSync(scratchRoot, { recursive: true, force: true });
			}
		},
		300_000,
	);
});
