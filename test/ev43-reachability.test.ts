// EV-43 — reachability falsifier for parent-turn continuation (per-branch
// answer encoded as a regression test).
//
// The falsifier (ev43/falsifier-headless.ts + ev43/falsifier-tui.py) drives
// the REAL installed pi CLI/TUI with a scripted fail-once faux provider and
// the EV-43 scratch extension. The injected failure is the intake's class
// (EV-41): the bare string `Provider finish_reason error` as errorMessage.
//
// Attribution claim (asserted here against pi's own classifier): that string
// does NOT match RETRYABLE_PROVIDER_ERROR_PATTERN, so pi's auto-retry never
// re-issues the call — any second assistant message is attributable to the
// agent_settled handler's sendUserMessage, and the control arm (same provider
// behavior, handler disabled) showing NO second message is what makes the
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
import { runHeadlessArms, secondMessagePresent } from "../ev43/falsifier-headless.ts";

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
				const { treatment, control } = runHeadlessArms(scratchRoot);
				// Treatment: session shows start -> error -> EV43-CONTINUE -> second
				// assistant message; print mode's stdout line IS that second message.
				expect(secondMessagePresent(treatment)).toBe(true);
				expect(
					treatment.userSequence.some((u) => u.includes("EV43-CONTINUE")),
				).toBe(true);
				expect(treatment.stdout).toContain("EV43-SECOND-RESPONSE");
				// Control: identical provider behavior, no handler — no second
				// assistant message, and the turn ends with the bare error (exit 1).
				expect(secondMessagePresent(control)).toBe(false);
				expect(control.userSequence.some((u) => u.includes("EV43-CONTINUE"))).toBe(false);
				expect(control.stderr).toContain("Provider finish_reason error");
				expect(control.exitCode).toBe(1);
			} finally {
				rmSync(scratchRoot, { recursive: true, force: true });
			}
		},
		300_000,
	);
});
