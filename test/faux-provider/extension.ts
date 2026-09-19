// EV-40 offline faux-provider harness extension (generalizes the EV-43
// falsifier extension — the record of that observation is council/cards/EV-43.md).
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
//   EV40_ERROR_MESSAGE  the injected failure class (default =
//                       INJECTED_ERROR_MESSAGE, the with-colon literal). The
//                       EV-43 reachability test sets this to the recorded
//                       colon-less class so its falsifier identity stays
//                       byte-identical after the harness dedup (FLLWUP-49).
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
//   EV40_TOOLCALL_DISPATCH "1" → the first provider call is a real
//                       council_dispatch tool call (designer P6): the parent
//                       engine spawns a real hub job via the council's own Hub,
//                       so the `council` widget + inline tree widget render.
//   EV40_TOOLCALL_SEAT / EV40_TOOLCALL_MODEL  the dispatched seat/model override
//   EV40_TOOLCALL_WAIT  "1" → after the dispatch step the parent's next
//                       provider call returns a real council_wait tool call
//                       (FLLWUP-56: job_ids ["job-1"], timeout_minutes 2 —
//                       the awaited hub.wait holds the print-mode parent's
//                       turn open through the retry backoff window and
//                       attempt 2, so the timer-owner process survives to
//                       respawn). The dispatch step's per-attempt ceilings
//                       drop to the FLLWUP-56 inner bounds (0.5/0.5) under
//                       this knob. The child shim strips this knob.
//   EV40_TOOLCALL_GATE  "1" → a council_gate tool-call step (GATE_CARDS: one
//                       epic + two children) follows the dispatch/wait steps
//                       (EV-66: the advisory gate's parent turn). The knob is
//                       inert for every existing arm.
//   EV40_OPEN_TREE      "1" → dispatch the real /council-tree command at
//                       session_start to open the inline tree widget (P6).
import { appendFileSync } from "node:fs";
import {
	fauxAssistantMessage,
	fauxProvider,
	fauxText,
	fauxToolCall,
} from "@earendil-works/pi-ai";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { createOnePassErrorFilter } from "../../extensions/parent-retry.ts";

/** The injected failure class: the intake's WITH-COLON literal, byte-equal to
 * `PROVIDER_FINISH_REASON_ERROR` (asserted by test/ev40-parent-retry.test.ts,
 * O3 hygiene). */
export const INJECTED_ERROR_MESSAGE = "Provider finish_reason: error";
export const CONTINUATION_MARKER = "EV40-SECOND-RESPONSE";
export const PARTIAL_MARKER = "EV40-PARTIAL";
/** The continuation prompt the extension sends (EV40_CONTINUATION may override
 * it; no arm passes that env, so the test-process and arm-process values are
 * the same string). Exported so re-pointed tests assert the shared constant
 * rather than a harness-internal literal (FLLWUP-49). */
export const CONTINUATION_PROMPT = process.env.EV40_CONTINUATION ?? "EV40-CONTINUE";

const FAILS = Number.parseInt(process.env.EV40_FAILS ?? "0", 10) || 0;
const ARM = (process.env.EV40_ARM ?? "none") as "inside" | "timer" | "none";
const PARTIAL = process.env.EV40_PARTIAL === "1";
/** The injected failure class; the default preserves today's byte-for-byte
 * behavior, the knob lets the EV-43 reachability arm inject its recorded
 * colon-less class (FLLWUP-49). */
const ERROR_MESSAGE = process.env.EV40_ERROR_MESSAGE ?? INJECTED_ERROR_MESSAGE;
const CONTINUATION = CONTINUATION_PROMPT;
const MODEL_ID = process.env.EV40_MODEL_ID ?? "ev40-model";
const FILTER = process.env.EV40_FILTER === "1";
const CONTEXT_LOG = process.env.EV40_CONTEXT_LOG;
const PAYLOAD_LOG = process.env.EV40_PAYLOAD_LOG;
const SETTLE_LOG = process.env.EV40_SETTLE_LOG;
/** Designer P6: the first provider call is a real council_dispatch tool call, so
 * the parent engine spawns a real hub job through the council's own Hub. */
const TOOLCALL_DISPATCH = process.env.EV40_TOOLCALL_DISPATCH === "1";
const TOOLCALL_SEAT = process.env.EV40_TOOLCALL_SEAT ?? "skeptic";
const TOOLCALL_MODEL = process.env.EV40_TOOLCALL_MODEL ?? "ev40/ev40-model";
/** FLLWUP-56: script a council_wait step after the dispatch step — the wait's
 * awaited execute holds the print-mode parent alive through the backoff window
 * (hub.ts isSettledForWait returns false while the job is retrying). */
const TOOLCALL_WAIT = process.env.EV40_TOOLCALL_WAIT === "1";
/** Designer P6: dispatch the REAL /council-tree command at session_start so the
 * inline tree widget (navigator.ts COUNCIL_TREE_WIDGET_KEY) is active. */
const OPEN_TREE = process.env.EV40_OPEN_TREE === "1";
/** EV-66 (opt-in): script a real council_gate parent step after the
 * dispatch/wait steps — the advisory gate's tool call through the parent
 * engine, exactly as the /features-new facilitator invokes it. */
const TOOLCALL_GATE = process.env.EV40_TOOLCALL_GATE === "1";

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

// P6 (opt-in): a leading real council_dispatch tool call — the engine executes
// it and the council's own Hub spawns a job (the PATH `pi` stub hangs), so the
// active-jobs widget + tree widget have real rows. Then calls 1..FAILS fail with
// the with-colon literal (partial text optional); every later call succeeds with
// the marker. Extra successes are scripted generously so the stream never runs dry.
const dispatchStep = fauxAssistantMessage(
	fauxToolCall("council_dispatch", {
		seat: TOOLCALL_SEAT,
		input: "EV40-P6 live active job (no-op; the PATH pi stub hangs)",
		model: TOOLCALL_MODEL,
		// FLLWUP-56: under the wait knob the turn runs the seat-dispatch retry
		// chain, so the per-attempt ceilings are the card's inner bounds
		// (0.5 min = 30 s each) instead of the P6 widget-arm's 30-min ceiling.
		timeout_minutes: TOOLCALL_WAIT ? 0.5 : 30,
		...(TOOLCALL_WAIT ? { stall_minutes: 0.5 } : {}),
	}),
	{ stopReason: "toolUse" },
);
// FLLWUP-56 (opt-in): the council_wait step that keeps the dispatching parent
// alive across the retry backoff window — the wait toolResult is the carrier
// that collects the job's final report (the dispatch result returns
// immediately and never carries the child output). timeout_minutes 2 covers
// two 30 s child attempts plus the backoff with margin.
const waitStep = fauxAssistantMessage(
	fauxToolCall("council_wait", { job_ids: ["job-1"], timeout_minutes: 2 }),
	{ stopReason: "toolUse" },
);
// EV-66 (opt-in): the scripted council_gate parent step — one epic + two
// children, a static module constant so the card set is byte-identical across
// arms (only the repo-local gate policy differs). `touchedFiles` is omitted:
// intake makes no touched-file claim (R(c) — the tool carries `[]` in a
// contract with no absent slot; EV-69's re-check is the enforcement).
export const GATE_CARDS = [
	{
		id: "EPIC-66T",
		title: "EV-66 falsifier epic",
		goal: "Carry the advisory-gate falsifier's epic card through the scripted gate call",
		acceptance:
			"The falsifier run records exactly one advisory ledger line for this epic card, byte-identical script across arms.",
	},
	{
		id: "EV-66T-1",
		title: "First falsifier child",
		goal: "Carry the first scripted child card through the gate call",
		acceptance:
			"The falsifier run records exactly one advisory ledger line for this child, carrying its resolved mode and basis.",
	},
	{
		id: "EV-66T-2",
		title: "Second falsifier child",
		goal: "Carry the second scripted child card through the gate call",
		acceptance:
			"The falsifier run records exactly one advisory ledger line for this child, and the per-card resolved modes are not all identical.",
	},
] as const;
const gateStep = fauxAssistantMessage(
	fauxToolCall("council_gate", { cards: GATE_CARDS.map((c) => ({ ...c })) }),
	{ stopReason: "toolUse" },
);
const failStep = (n: number) =>
	fauxAssistantMessage(
		PARTIAL ? [fauxText(`${PARTIAL_MARKER} call=${n + 1} partial tokens before the provider died`)] : [],
		{ stopReason: "error", errorMessage: ERROR_MESSAGE },
	);
const successStep = (_context: unknown, _options: unknown, state: { callCount: number }) =>
	fauxAssistantMessage(`${CONTINUATION_MARKER} call=${state.callCount}`, { stopReason: "stop" });

faux.setResponses([
	...(TOOLCALL_DISPATCH ? [dispatchStep] : []),
	...(TOOLCALL_DISPATCH && TOOLCALL_WAIT ? [waitStep] : []),
	...(TOOLCALL_GATE ? [gateStep] : []),
	...Array.from({ length: FAILS }, (_, i) => failStep(i)),
	successStep,
	successStep,
	successStep,
]);

export default function (pi: ExtensionAPI) {
	pi.registerProvider(faux.provider);
	log(SETTLE_LOG, `extension loaded; provider ev40 registered; fails=${FAILS} arm=${ARM} partial=${PARTIAL} filter=${FILTER}`);

	// The shared §2.4 filter (single source with the engine): armed for exactly
	// one provider request per harness continuation send (D1 arm B).
	const filter = createOnePassErrorFilter();

	// Telemetry: message shapes per provider request (D1 recorder) — registered
	// only when the log is configured so plain P1 arms stay untouched. The log
	// records the EFFECTIVE outgoing list (post-filter), i.e. what the provider
	// request actually carried.
	if (CONTEXT_LOG) {
		pi.on("context", (event) => {
			const filtered = filter.apply(event.messages);
			const effective = filtered ?? event.messages;
			const shapes = (effective as unknown as Array<Record<string, unknown>>).map((m) => {
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
				`context request call=${faux.state.callCount} messages=${effective.length}${effective.length ? `\n  ${shapes.join("\n  ")}` : ""}`,
			);
			return filtered ? { messages: filtered } : undefined;
		});
	} else {
		pi.on("context", (event) => {
			const filtered = filter.apply(event.messages);
			return filtered ? { messages: filtered } : undefined;
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
			if (FILTER) filter.arm();
			pi.sendUserMessage(CONTINUATION);
			log(SETTLE_LOG, `send fired arm=${ARM}`);
		};
		const settle = async (c: ExtensionContext): Promise<void> => {
			for (let i = 0; i < 100 && c.isIdle(); i++) {
				await new Promise((r) => setTimeout(r, 25));
			}
			if (typeof (c as { waitForIdle?: unknown }).waitForIdle === "function") {
				await (c as unknown as { waitForIdle: () => Promise<void> }).waitForIdle();
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

	// Designer P6: open the REAL inline tree widget by dispatching the registered
	// /council-tree command (navigator.ts toggleWidget) — the same handler the TUI
	// slash command invokes; no widget is faked here. The deferred tick lets the
	// council extension's own session_start (Hub.sweepStalePids, hub creation)
	// finish first.
	pi.on("session_start", () => {
		if (!OPEN_TREE) return;
		setTimeout(() => {
			pi.sendUserMessage("/council-tree", { expandPromptTemplates: true });
			log(SETTLE_LOG, "dispatched /council-tree");
		}, 50);
	});

	pi.on("session_shutdown", () =>
		log(SETTLE_LOG, `session shutdown calls=${faux.state.callCount} sent=${sent}`),
	);
}
