// EV-40 headless gates — the offline CLI runs against the REAL installed pi
// CLI (scratch HOME, explicit env, --offline + faux provider, no network).
//
// P1 recorded result (the must-settle probe, run live on this tree at
// branch feat/ev-40-parent-retry, fails=1, -p mode):
//   arm A (send-inside-handler):  GREEN — exit 0; session JSONL shows
//     user("start") → assistant(stop=error, errorMessage="Provider finish_reason: error")
//     → user("EV40-CONTINUE") → assistant("EV40-SECOND-RESPONSE call=2");
//     stdout IS the second assistant message.
//   arm B (timer-deferred send):  RED — exit 1; the handler returned and the
//     plain setTimeout(1000) fired 1s later, but the session was already
//     disposed (settle log: "session shutdown" logged before "timer fired");
//     pi.sendUserMessage threw the stale-ctx assertActive error, which crashed
//     the process. No second assistant message, no continuation user message.
//   → The deferred (arm-and-return) send is unreachable headless; the
//     as-designed headless mechanism is the await-inside-handler shape
//     (spec §2.5, the principal's mitigation). This is the EV-40 engine's
//     headless branch and is exercised by the engine run below.
//
// D1 recorded result (run live on this tree, fails=1, context recorder on):
//   arm A (no filter): attempt-2's recorded request shape ends
//     […, assistant(error), user] — the malformed continuation payload.
//   arm B (shared §2.4 filter armed): the attempt-2 recorded request contains
//     NO errored assistant message and no extra/missing toolResult (0/0 both
//     arms). The filter strips every errored assistant message structurally.
import { describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
	hasUserMessage,
	parseContextLog,
	secondMessagePresent,
	runHarnessArm,
} from "../test/ev40-harness/harness-headless.ts";
import { PROVIDER_FINISH_REASON_ERROR } from "../extensions/retry.ts";
import { INJECTED_ERROR_MESSAGE } from "../test/ev40-harness/ev40-harness-extension.ts";

describe("EV-40 P1 — headless send-inside vs timer-deferred (recorded characterization)", () => {
	test(
		"arm A (send inside the agent_settled handler) produces the second assistant message; arm B (timer-deferred) does not",
		() => {
			const scratchRoot = mkdtempSync(join(tmpdir(), "ev40-p1-test-"));
			try {
				const armA = runHarnessArm({ label: "p1-a", fails: 1, arm: "inside" }, scratchRoot);
				// Arm A: the EV-43-proven shape — full chain lands, clean exit.
				expect(secondMessagePresent(armA)).toBe(true);
				expect(hasUserMessage(armA, "EV40-CONTINUE")).toBe(true);
				expect(armA.exitCode).toBe(0);
				expect(armA.stdout).toContain("EV40-SECOND-RESPONSE");
				// The errored turn is persisted with the WITH-COLON literal (O3).
				expect(armA.sequence.some((s) => s.startsWith("assistant") && s.includes(JSON.stringify(PROVIDER_FINISH_REASON_ERROR)))).toBe(true);

				const armB = runHarnessArm({ label: "p1-b", fails: 1, arm: "timer" }, scratchRoot);
				// Arm B: the deferred send is unreachable — print-mode teardown wins.
				expect(secondMessagePresent(armB)).toBe(false);
				expect(hasUserMessage(armB, "EV40-CONTINUE")).toBe(false);
				expect(armB.settleLog).toContain("arming setTimeout(1000)");
				expect(armB.settleLog).toContain("timer fired");
				// The turn ends with the bare error (exit 1, like the EV-43 control).
				expect(armB.stderr).toContain(PROVIDER_FINISH_REASON_ERROR);
			} finally {
				rmSync(scratchRoot, { recursive: true, force: true });
			}
		},
		300_000,
	);
});

describe("EV-40 O3 — literal hygiene of the harness", () => {
	test("the harness's injected errorMessage is exactly the with-colon intake literal", () => {
		expect(INJECTED_ERROR_MESSAGE).toBe(PROVIDER_FINISH_REASON_ERROR);
	});
});

