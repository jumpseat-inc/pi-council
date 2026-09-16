// EV-43 reachability falsifier — scratch parent-turn extension.
//
// Registers a scripted (offline, dummy-credential) provider whose FIRST call
// fails with the intake's failure class — the bare string
// `Provider finish_reason error` as `errorMessage` (EV-41's forcing class) —
// and whose SUBSEQUENT calls succeed with a distinctive attribution marker.
// An `agent_settled` handler (enabled by EV43_HANDLER=1) sends one follow-up
// user message after the first settle, using the same per-branch pattern the
// council command handlers use at extensions/index.ts:442/448-454.
//
// The control arm is the same extension with EV43_HANDLER unset: identical
// provider behavior, no handler send. Any second assistant message in the
// treatment arm that is absent in the control arm is attributable to the
// handler's sendUserMessage, not to pi's own auto-retry (the injected error
// message does not match pi's RETRYABLE_PROVIDER_ERROR_PATTERN — asserted in
// test/ev43-reachability.test.ts).
import { appendFileSync } from "node:fs";
import { fauxAssistantMessage, fauxProvider } from "@earendil-works/pi-ai";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const HANDLER_ENABLED = process.env.EV43_HANDLER === "1";
const BRANCH = process.env.EV43_BRANCH ?? "headless";
const LOG_FILE = process.env.EV43_LOG;

function log(line: string): void {
	if (LOG_FILE) {
		try {
			appendFileSync(LOG_FILE, `[${BRANCH}] ${new Date().toISOString()} ${line}\n`);
		} catch {
			// telemetry must never break the session
		}
	}
}

// Provider id / model id the harness selects via --provider/--model.
const faux = fauxProvider({
	provider: "ev43",
	models: [
		{
			id: "ev43-model",
			name: "EV43 Falsifier Model",
			reasoning: false,
			input: ["text"],
			cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
			contextWindow: 128000,
			maxTokens: 4096,
		},
	],
});

// Call #1 fails with the intake's class; call #2+ succeeds with the marker.
faux.setResponses([
	fauxAssistantMessage("first-turn-fails", {
		stopReason: "error",
		errorMessage: "Provider finish_reason error",
	}),
	(_context, _options, state) =>
		fauxAssistantMessage(`EV43-SECOND-RESPONSE call=${state.callCount}`, { stopReason: "stop" }),
]);

export default function (pi: ExtensionAPI) {
	pi.registerProvider(faux.provider);
	log("extension loaded; provider ev43 registered");

	let settledCount = 0;
	let sent = false;
	pi.on("agent_settled", async (_event, ctx) => {
		settledCount++;
		log(`settle#${settledCount} handler=${HANDLER_ENABLED} sent=${sent}`);
		if (!HANDLER_ENABLED || sent) return;
		sent = true;
		if (ctx.hasUI) {
			// TUI: fire-and-forget — never block the settle emission (the
			// extensions/index.ts:442 command-handler pattern).
			void pi.sendUserMessage("EV43-CONTINUE");
			log("send fired (tui, fire-and-forget)");
		} else {
			// print/json/rpc: fire the continuation, then wait for the nested run to
			// become active before returning. NOTE (empirical, EV-43): the
			// agent_settled EVENT context does not carry `waitForIdle` (that is a
			// command-context affordance — extensions/index.ts:448-454 cannot be
			// transplanted verbatim here). The nested run is nonetheless covered:
			// _runAgentPrompt's finally awaits _emitAgentSettled, so the nested
			// prompt chain is inside the outer run's promise, which print mode
			// itself awaits before teardown.
			pi.sendUserMessage("EV43-CONTINUE");
			for (let i = 0; i < 100 && ctx.isIdle(); i++) {
				await new Promise((r) => setTimeout(r, 25));
			}
			if (typeof (ctx as { waitForIdle?: unknown }).waitForIdle === "function") {
				await (ctx as { waitForIdle: () => Promise<void> }).waitForIdle();
			}
			log("send fired (headless, poll + guarded waitForIdle)");
		}
	});

	pi.on("session_shutdown", () => log(`session shutdown settles=${settledCount}`));
}
