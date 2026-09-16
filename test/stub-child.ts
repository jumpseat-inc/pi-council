import * as fs from "node:fs";
import * as path from "node:path";
import { PROVIDER_FINISH_REASON_ERROR } from "../extensions/retry.ts";

// Fake `pi --mode json` child. Behavior selected by STUB_MODE env:
//   emit    — prints a message_end event then exits 0
//   length  — prints a thinking-only message_end (stopReason length) then exits 0
//   error   — prints a message_end with stopReason error + errorMessage, exits 0
//   fail    — prints to stderr, exits 3
//   hang  — prints one event, then sleeps forever (no further output)
//   slow  — prints an event every 200ms for 10s, then exits 0
//   flaky — EV-39: reads/increments a count in STUB_STATE (JSON {count}); while
//           count <= STUB_FAIL_TIMES (default 1) emits the retryable provider
//           error and exits 0; afterwards emits "stub result" and exits 0.
//   finish_error — EV-41: same STUB_STATE/STUB_FAIL_TIMES fail-once shape, but
//           the failure emits the intake's class byte-equal to
//           PROVIDER_FINISH_REASON_ERROR ("Provider finish_reason: error",
//           with colon — extensions/retry.ts) with stopReason "error" and
//           exits 0; afterwards emits "stub result" and exits 0.
const mode = process.env.STUB_MODE ?? "emit";

function emitAssistant(text: string, stopReason = "stop", errorMessage?: string) {
	console.log(
		JSON.stringify({
			type: "message_end",
			message: {
				role: "assistant",
				content: text ? [{ type: "text", text }] : [{ type: "thinking", thinking: "..." }],
				stopReason,
				errorMessage,
				usage: { input: 10, output: 5, cost: { total: 0.001 }, totalTokens: 15 },
			},
		}),
	);
}

if (mode === "emit") {
	emitAssistant("stub result");
	process.exit(0);
} else if (mode === "length") {
	emitAssistant("", "length");
	process.exit(0);
} else if (mode === "error") {
	emitAssistant("partial output before dying", "error", "Provider returned 502: upstream unavailable");
	process.exit(0);
} else if (mode === "fail") {
	console.error("stub exploded");
	process.exit(3);
} else if (mode === "hang") {
	emitAssistant("starting...");
	setInterval(() => {}, 1 << 30); // no further output, never exits
} else if (mode === "slow") {
	let i = 0;
	const t = setInterval(() => {
		emitAssistant(`tick ${++i}`);
		if (i >= 50) {
			clearInterval(t);
			process.exit(0);
		}
	}, 200);
} else if (mode === "flaky") {
	// EV-39 spec §2.10: fail the first STUB_FAIL_TIMES invocations (counted in
	// STUB_STATE), then emit the normal result. Supports fail-once-then-succeed
	// (STUB_FAIL_TIMES=1) and budget exhaustion (STUB_FAIL_TIMES >= maxAttempts).
	const stateFile = process.env.STUB_STATE!;
	let count = 0;
	try {
		count = (JSON.parse(fs.readFileSync(stateFile, "utf-8")) as { count?: number }).count ?? 0;
	} catch {
		/* fresh */
	}
	count += 1;
	fs.mkdirSync(path.dirname(stateFile), { recursive: true });
	fs.writeFileSync(stateFile, JSON.stringify({ count }));
	const failTimes = Number(process.env.STUB_FAIL_TIMES ?? "1");
	if (count <= failTimes) {
		emitAssistant("partial output before dying", "error", "Provider returned 502: upstream unavailable");
	} else {
		emitAssistant("stub result");
	}
	process.exit(0);
} else if (mode === "finish_error") {
	// EV-41 (a): the same fail-once-then-succeed shape, but the failure is the
	// intake's class byte-equal to PROVIDER_FINISH_REASON_ERROR (with colon) —
	// the state=done trap classifyRetry exists to handle (exits 0).
	const stateFile = process.env.STUB_STATE!;
	let count = 0;
	try {
		count = (JSON.parse(fs.readFileSync(stateFile, "utf-8")) as { count?: number }).count ?? 0;
	} catch {
		/* fresh */
	}
	count += 1;
	fs.mkdirSync(path.dirname(stateFile), { recursive: true });
	fs.writeFileSync(stateFile, JSON.stringify({ count }));
	const failTimes = Number(process.env.STUB_FAIL_TIMES ?? "1");
	if (count <= failTimes) {
		emitAssistant("", "error", PROVIDER_FINISH_REASON_ERROR);
	} else {
		emitAssistant("stub result");
	}
	process.exit(0);
}
