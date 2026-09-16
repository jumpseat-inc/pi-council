// EV-40 offline faux-provider harness extension (generalizes ev43/ev43-falsifier-extension.ts).
//
// A scripted (offline, dummy-credential) provider whose FIRST `EV40_FAILS` calls
// fail with the intake's failure class — the WITH-COLON literal
// `Provider finish_reason: error` as `errorMessage` (Skeptic O3: the colon-less
// EV-43 falsifier string is classify-negative on both clauses and tests
// nothing) — and whose SUBSEQUENT calls succeed with the distinctive marker
// `EV40-SECOND-RESPONSE call=<n>`. Failed responses may carry partial streamed
// text (`EV40_PARTIAL=1`, designer P3).
//
// Knobs (env, read at load):
//   EV40_FAILS          leading provider calls that fail (default 0)
//   EV40_PARTIAL        "1" → failed responses carry partial text content
//   EV40_ARM            "inside" | "timer" | "none" (default "none")
//                       inside: the agent_settled handler sends the continuation
//                       inside the handler (the EV-43 falsifier pattern: fire,
//                       poll isIdle until active, guarded waitForIdle).
//                       timer: the handler arms setTimeout(1000) and returns;
//                       the timer sends (P1 arm B — the unproven deferred shape).
//                       none: the harness does no continuation (the council
//                       engine drives retries in engine-mode runs).
//   EV40_CONTINUATION   the continuation prompt (default "EV40-CONTINUE")
//   EV40_MODEL_ID       faux model id (default "ev40-model"; set to
//                       "deepseek-v4-pro-0813" for the owner-P2 floor run)
//   EV40_CONTEXT_LOG    file each `context` event's message shapes are logged to
//   EV40_PAYLOAD_LOG    file each `before_provider_request` payload is logged to
//   EV40_SETTLE_LOG     file settle/send telemetry is logged to
import { appendFileSync } from "node:fs";
import {
	fauxAssistantMessage,
	fauxProvider,
	fauxText,
} from "@earendil-works/pi-ai";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";

/** The injected failure class: the intake's WITH-COLON literal, byte-equal to
 * `PROVIDER_FINISH_REASON_ERROR` (asserted by test/ev40-parent-retry.test.ts,
 * O3 hygiene). */
export const INJECTED_ERROR_MESSAGE = "Provider finish_reason: error";
export const CONTINUATION_MARKER = "EV40-SECOND-RESPONSE";
export const PARTIAL_MARKER = "EV40-PARTIAL";

const FAILS = Number.parseInt(process.env.EV40_FAILS ?? "0", 10) || 0;
const ARM = (process.env.EV40_ARM ?? "none") as "inside" | "timer" | "none";
const PARTIAL = process.env.EV40_PARTIAL === "1";
const CONTINUATION = process.env.EV40_CONTINUATION ?? "EV40-CONTINUE";
const MODEL_ID = process.env.EV40_MODEL_ID ?? "ev40-model";
const CONTEXT_LOG = process.env.EV40_CONTEXT_LOG;
const PAYLOAD_LOG = process.env.EV40_PAYLOAD_LOG;
const SETTLE_LOG = process.env.EV40_SETTLE_LOG;

function log(file: string | undefined, line: string): void {
	if (!file) return;
	try {
		appendFileSync(file, `${new Date().toISOString()} ${line}\n`);
	} catch {
		// telemetry must never break the session
	}
}

const faux = fauxProvider({
	provider: "ev40",
	models: [
		{
			id: MODEL_ID,
			name: "EV40 Falsifier Model",
			reasoning: false,
			input: ["text"],
			cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
			contextWindow: 128000,
			maxTokens: 4096,
		},
	],
});

// Calls 1..FAILS fail with the with-colon literal (partial text optional);
// every later call succeeds with the marker. Extra successes are scripted
// generously so the faux stream never runs dry.
const failStep = (n: number) =>
	fauxAssistantMessage(
		PARTIAL ? [fauxText(`${PARTIAL_MARKER} call=${n + 1} partial tokens before the provider died`)] : [],
		{ stopReason: "error", errorMessage: INJECTED_ERROR_MESSAGE },
	);
const successStep = (_context: unknown, _options: unknown, state: { callCount: number }) =>
	fauxAssistantMessage(`${CONTINUATION_MARKER} call=${state.callCount}`, { stopReason: "stop" });

faux.setResponses([
	...Array.from({ length: FAILS }, (_, i) => failStep(i)),
	successStep,
	successStep,
	successStep,
]);

export default function (pi: ExtensionAPI) {
	pi.registerProvider(faux.provider);
	log(SETTLE_LOG, `extension loaded; provider ev40 registered; fails=${FAILS} arm=${ARM} partial=${PARTIAL}`);

	// Telemetry: message shapes per provider request (D1 recorder) — registered
	// only when the log is configured so plain P1 arms stay untouched.
	if (CONTEXT_LOG) {
		pi.on("context", (event) => {
			const shapes = (event.messages as Array<Record<string, unknown>>).map((m) => {
				const role = String(m.role);
				const content = Array.isArray(m.content) ? m.content : [];
				const text = content
					.filter((c) => (c as { type?: string }).type === "text")
					.map((c) => (c as { text?: string }).text ?? "")
					.join("");
				const toolResults = content.filter((c) => (c as { type?: string }).type === "toolResult").length;
				return `role=${role} stop=${String(m.stopReason)} err=${JSON.stringify(m.errorMessage ?? null)} toolResults=${toolResults} text=${JSON.stringify(text.length > 80 ? `${text.slice(0, 80)}…` : text)}`;
			});
			log(
				CONTEXT_LOG,
				`context request call=${faux.state.callCount} messages=${event.messages.length}${event.messages.length ? `\n  ${shapes.join("\n  ")}` : ""}`,
			);
			return undefined;
		});
	}

	// Telemetry: outgoing payload after before_provider_request (owner P2).
	if (PAYLOAD_LOG) {
		pi.on("before_provider_request", (event) => {
			log(PAYLOAD_LOG, `payload ${JSON.stringify((event as { payload?: unknown }).payload)}`);
			return undefined;
		});
	}

	let sent = false;
	pi.on("agent_settled", async (_event, ctx) => {
		log(SETTLE_LOG, `settle calls=${faux.state.callCount} arm=${ARM} sent=${sent}`);
		if (ARM === "none" || sent || faux.state.callCount > FAILS) return;
		// A leading call failed and this is its settle: continue per arm.
		sent = true;
		const send = (): void => {
			pi.sendUserMessage(CONTINUATION);
			log(SETTLE_LOG, `send fired arm=${ARM}`);
		};
		const settle = async (c: ExtensionContext): Promise<void> => {
			for (let i = 0; i < 100 && c.isIdle(); i++) {
				await new Promise((r) => setTimeout(r, 25));
			}
			if (typeof (c as { waitForIdle?: unknown }).waitForIdle === "function") {
				await (c as { waitForIdle: () => Promise<void> }).waitForIdle();
			}
			log(SETTLE_LOG, "post-send poll complete (guarded waitForIdle)");
		};
		if (ARM === "inside") {
			// Arm A (the EV-43-proven shape): send inside the handler, then
			// poll + guarded waitForIdle (the event context carries no waitForIdle).
			send();
			await settle(ctx);
		} else {
			// Arm B (the unproven deferred shape): arm a timer and RETURN; the
			// timer sends. Plain (non-unref'd) timer — the probe asks whether the
			// print-mode runtime survives to the timer at all.
			log(SETTLE_LOG, "arming setTimeout(1000); handler returning");
			setTimeout(() => {
				log(SETTLE_LOG, "timer fired");
				send();
				void settle(ctx).catch(() => {});
			}, 1000);
		}
	});

	pi.on("session_shutdown", () => log(SETTLE_LOG, `session shutdown calls=${faux.state.callCount} sent=${sent}`));
}
