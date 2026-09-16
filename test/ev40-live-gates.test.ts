// EV-40 LIVE named gates (spec §4.2) — the offline CLI harness against the REAL
// installed pi CLI (scratch HOME, explicit env, --offline + faux provider).
//
// These are the gates that need a real run, not a component test:
//   Designer P3 — partial tokens persist in the produced JSONL
//   Designer P4 — the live headless retry loop keeps the parent alive across
//                 the backoff and drives the full attempt chain
//   D4          — exactly one usage record for a failing 3-attempt run with an
//                 EV-31 pending-invocation marker
//   T-H1        — SIGINT during the attempt-2 headless backoff disarms
//
// Stream routing finding (probed first-hand on this tree, and the reason the
// assertions read `stderr`): pi's print mode keeps STDOUT for its own final
// assistant message and routes EXTENSION output there — `console.log` AND
// `process.stdout.write` both land on the child's STDERR. The R5 countdown
// line is therefore observable on stderr, not stdout; the implementation's
// `host.print` is unchanged, only the stream pi chooses differs. This is
// recorded, not silenced: the live exit code is also pi's own 1 for a failed
// turn, not the engine's `HEADLESS_RETRY_EXHAUSTED_EXIT_CODE` (75) — the
// spec §2.7 anticipated exactly this clobber; the engine's setExitCode(75)
// call is covered by test/ev40-wiring.test.ts.
import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
	countUsageRecords,
	parseSessionEntries,
	runHarnessArm,
	runHarnessArmSigint,
	sessionJsonlWellFormed,
	type EngineRepoOptions,
} from "../test/ev40-harness/harness-headless.ts";
import { INJECTED_ERROR_MESSAGE, PARTIAL_MARKER } from "../test/ev40-harness/ev40-harness-extension.ts";
import { formatRetryExhausted, formatRetryCountdown } from "../extensions/parent-retry.ts";
import { PROVIDER_FINISH_REASON_ERROR } from "../extensions/retry.ts";

/** The engine's `.council.json` retry section (jitter off → exact delays). */
const policy = (over: Record<string, unknown> = {}): EngineRepoOptions => ({
	retryPolicy: {
		retry: { enabled: true, maxAttempts: 3, baseDelayMs: 200, maxDelayMs: 5000, jitter: false, ...over },
	},
	procedureBody: "EV40-PROBE-TURN",
});

describe("EV-40 live gate — Designer P3 (partial tokens persist in the JSONL)", () => {
	test(
		"the failed turn's partial assistant entry is present and followed by the next attempt's assistant entry",
		() => {
			const scratchRoot = mkdtempSync(join(tmpdir(), "ev40-p3-live-"));
			try {
				const arm = runHarnessArm({ label: "p3-live", fails: 1, arm: "inside", partial: true }, scratchRoot);
				expect(arm.sessionPath).toBeDefined();
				const entries = parseSessionEntries(arm.sessionPath!);

				// The errored assistant turn is never un-appended: it persists with
				// its partial streamed text (spec §2.4, designer P3).
				const partialIdx = entries.findIndex(
					(e) =>
						e.role === "assistant" &&
						e.stopReason === "error" &&
						e.errorMessage === INJECTED_ERROR_MESSAGE &&
						e.text.includes(PARTIAL_MARKER),
				);
				expect(partialIdx).toBeGreaterThanOrEqual(0);

				// The NEXT assistant entry is the next attempt's (the successful
				// continuation), with the continuation user message between them.
				const after = entries.slice(partialIdx + 1);
				const nextAssistantIdx = after.findIndex((e) => e.role === "assistant");
				expect(nextAssistantIdx).toBeGreaterThanOrEqual(0);
				expect(after[nextAssistantIdx]!.text).toContain("EV40-SECOND-RESPONSE");
				expect(after.slice(0, nextAssistantIdx).some((e) => e.role === "user" && e.text.includes("EV40-CONTINUE"))).toBe(true);
			} finally {
				rmSync(scratchRoot, { recursive: true, force: true });
			}
		},
		180_000,
	);
});

describe("EV-40 live gate — Designer P4 (the real extension's headless retry loop)", () => {
	test(
		"the live loop holds across each backoff (countdown line per attempt) and the JSONL shows the full attempt chain",
		() => {
			const scratchRoot = mkdtempSync(join(tmpdir(), "ev40-p4-live-"));
			try {
				const arm = runHarnessArm(
					{ label: "p4-live", fails: 10, arm: "none", councilExtension: true },
					scratchRoot,
					policy(),
				);

				// One countdown line per backoff, both the exact R5 copy (U+2014)
				// with the delay the policy pins (baseDelayMs = 200 → 1s ceil).
				const countdowns = arm.stderr.split("\n").filter((l) => l.startsWith("Retrying in"));
				expect(countdowns).toContain(formatRetryCountdown(2, 3, 200));
				expect(countdowns).toContain(formatRetryCountdown(3, 3, 200));
				expect(countdowns.some((l) => l.includes("(attempt 2 of 3)"))).toBe(true);
				expect(countdowns.some((l) => l.includes("(attempt 3 of 3)"))).toBe(true);
				// The named terminal copy is the final exhaustion line.
				expect(arm.stderr).toContain(formatRetryExhausted(3));

				// The session JSONL shows the full attempt chain: the original
				// prompt three times, each followed by an errored assistant turn
				// carrying the WITH-COLON literal (O3).
				const entries = parseSessionEntries(arm.sessionPath!);
				expect(entries.filter((e) => e.role === "user" && e.text.includes("start")).length).toBe(3);
				const errored = entries.filter((e) => e.role === "assistant" && e.errorMessage === PROVIDER_FINISH_REASON_ERROR);
				expect(errored.length).toBe(3);
				expect(entries.filter((e) => e.errorMessage === INJECTED_ERROR_MESSAGE).length).toBe(3);

				// No uncaught extension error (the guarded-ctx fix, spec §2.5).
				expect(arm.stderr).not.toContain("stale after session replacement");
			} finally {
				rmSync(scratchRoot, { recursive: true, force: true });
			}
		},
		180_000,
	);
});

describe("EV-40 live gate — D4 (one usage record across a failing 3-attempt run)", () => {
	test(
		"an EV-31 marker-stamped invocation across 3 failed attempts writes exactly one usage record",
		() => {
			const scratchRoot = mkdtempSync(join(tmpdir(), "ev40-d4-live-"));
			try {
				const arm = runHarnessArm(
					{ label: "d4-live", fails: 10, arm: "none", councilExtension: true, prompt: "/ev40-probe" },
					scratchRoot,
					policy(),
				);

				// The chain really ran three attempts.
				expect(arm.sequence.filter((s) => s.startsWith("assistant stop=error")).length).toBe(3);
				// The procedure handler stamped the EV-31 boundary and the gated
				// flush wrote exactly one record; the continuation's second
				// `flushUsage("agent-settled")` is a choose-once no-op.
				expect(countUsageRecords(arm.home)).toBe(1);
				const usageDir = join(arm.home, ".pi", "agent", "council", "usage");
				const records = readdirSync(usageDir).filter((f) => f.endsWith(".json"));
				expect(records).toHaveLength(1);
				expect(records[0]!).toContain("ev40-probe");
				const record = JSON.parse(readFileSync(join(usageDir, records[0]!), "utf-8"));
				expect(record.command).toBe("ev40-probe");

				const entries = parseSessionEntries(arm.sessionPath!);
				expect(entries.filter((e) => e.errorMessage === PROVIDER_FINISH_REASON_ERROR).length).toBe(3);
			} finally {
				rmSync(scratchRoot, { recursive: true, force: true });
			}
		},
		180_000,
	);
});

describe("EV-40 live gate — T-H1 (SIGINT during the attempt-2 headless backoff)", () => {
	test(
		"SIGINT after the attempt-2 countdown terminates the runtime: no attempt-3 continuation, clean exit, well-formed JSONL",
		async () => {
			const scratchRoot = mkdtempSync(join(tmpdir(), "ev40-th1-live-"));
			try {
				const arm = await runHarnessArmSigint(
					{ label: "th1-live", fails: 10, arm: "none", councilExtension: true },
					scratchRoot,
					policy({ baseDelayMs: 2000 }),
					{ trigger: "attempt 2 of 3", graceMs: 300 },
				);

				expect(arm.triggered).toBe(true);
				expect(arm.triggerToSignalMs).toBeGreaterThanOrEqual(300);
				// The countdown line for the attempt-2 backoff rendered (real run).
				expect(arm.stderr).toContain(formatRetryCountdown(2, 3, 2000));
				// No attempt-3 continuation was scheduled or sent.
				expect(arm.stderr).not.toContain("attempt 3 of 3");
				expect(arm.sequence.filter((s) => s.startsWith("user ")).length).toBe(1);
				expect(arm.sequence.filter((s) => s.startsWith("assistant stop=error")).length).toBe(1);
				// Clean termination: signalled (or a clean non-null code), no stack trace.
				expect(arm.signal === "SIGINT" || arm.exitCode !== null).toBe(true);
				expect(arm.stderr).not.toMatch(/^\s+at .*:\d+:\d+\)?$/m);
				expect(arm.stderr).not.toContain("stale after session replacement");
				// The session JSONL parses end-to-end.
				expect(sessionJsonlWellFormed(arm.sessionPath)).toBe(true);
			} finally {
				rmSync(scratchRoot, { recursive: true, force: true });
			}
		},
		180_000,
	);
});
