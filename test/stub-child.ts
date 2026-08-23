// Fake `pi --mode json` child. Behavior selected by STUB_MODE env:
//   emit    — prints a message_end event then exits 0
//   length  — prints a thinking-only message_end (stopReason length) then exits 0
//   error   — prints a message_end with stopReason error + errorMessage, exits 0
//   fail    — prints to stderr, exits 3
//   hang  — prints one event, then sleeps forever (no further output)
//   slow  — prints an event every 200ms for 10s, then exits 0
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
}
