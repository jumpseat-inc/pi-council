// EV-40 — pure parent-retry units (TDD): the shared §2.4 one-pass context
// filter, then the D2 parent predicate, the backoff policy, the copy
// formatters, the settle decision helpers, and the RetryController/RetryEditor
// component behavior.
//
// O3 literal hygiene: every classification test here uses the WITH-COLON
// intake literal PROVIDER_FINISH_REASON_ERROR ("Provider finish_reason: error")
// — never the colon-less EV-43 falsifier string, which is classify-negative on
// both clauses and tests nothing (Skeptic O3, standing order).
import { describe, expect, test } from "bun:test";
import { registerMaxTokensFix } from "../extensions/index.ts";
import type { FilterableMessage } from "../extensions/parent-retry.ts";
import {
	PROVIDER_FINISH_REASON_ERROR,
	classifyParentTurnRetry,
	computeBackoffDelay,
} from "../extensions/retry.ts";

const erroredAssistant = (errorMessage: string = PROVIDER_FINISH_REASON_ERROR): FilterableMessage =>
	({
		role: "assistant",
		content: [],
		stopReason: "error",
		errorMessage,
	});

const user = (text: string): FilterableMessage =>
	({ role: "user", content: [{ type: "text", text }] });

const toolResult = (): FilterableMessage =>
	({ role: "toolResult", content: [], toolCallId: "t1" });

describe("EV-40 owner P2 — floor re-entry on the continuation payload", () => {
	test("a continuation payload for deepseek/deepseek-v4-pro-0813 carries max_completion_tokens = 131072 after before_provider_request", () => {
		// O-P2-live residual (fix cycle 1): the LIVE half is structurally
		// unobservable — pi invokes `before_provider_request` only from the model
		// runtime's `onPayload` hook (dist/core/sdk.js:210), and the offline faux
		// transport's `stream`/`streamSimple` never call `streamOptions.onPayload`
		// (pi-ai/dist/providers/faux.js), so PAYLOAD_LOG_LINES is 0 by
		// construction. This test therefore drives the SHIPPED handler itself
		// (`registerMaxTokensFix`, not a reimplementation) with a
		// continuation-shaped payload; ev40-live-gates.test.ts pins the live
		// absence as a tripwire.
		const handlers = new Map<string, Array<(event: unknown) => unknown>>();
		const fakePi = {
			on(type: string, handler: (event: unknown) => unknown) {
				const list = handlers.get(type) ?? [];
				list.push(handler);
				handlers.set(type, list);
			},
		};
		// Packaged floors only (no repo-local override at this root).
		registerMaxTokensFix(fakePi as never, "/nonexistent-repo-root-xyz");
		const patch = handlers.get("before_provider_request")?.[0];
		expect(patch).toBeDefined();

		// A continuation-shaped request: the council re-issued the original prompt
		// over the persisted errored assistant turn (the §2.4 shape).
		const continuationPayload = {
			model: "deepseek/deepseek-v4-pro-0813",
			max_completion_tokens: 4096,
			max_tokens: 4096,
			messages: [
				{ role: "assistant", stopReason: "error", errorMessage: PROVIDER_FINISH_REASON_ERROR },
				{ role: "user", content: [{ type: "text", text: "start" }] },
			],
		};
		const patched = patch!({ payload: continuationPayload }) as Record<string, unknown>;
		expect(patched.max_completion_tokens).toBe(131072);
		expect(patched.max_tokens).toBe(131072);
		// Non-floored / absent payloads are untouched (no change → undefined).
		expect(patch!({ payload: { model: "some/other-model", max_completion_tokens: 4096 } })).toBeUndefined();
		expect(patch!({ payload: { model: "deepseek/deepseek-v4-pro-0813" } })).toBeUndefined();
	});
});

describe("EV-40 §2.4 — structural one-pass context filter (single source)", () => {
	test("un-armed → undefined (no filter change)", () => {
		const filter = createOnePassErrorFilter();
		const messages = [user("hi"), erroredAssistant()];
		expect(filter.apply(messages)).toBeUndefined();
		expect(filter.isArmed()).toBe(false);
	});

	test("armed → strips EVERY errored assistant message in one pass, then disarms", () => {
		const filter = createOnePassErrorFilter();
		const messages = [
			user("start"),
			erroredAssistant(),
			user("EV40-CONTINUE"),
			erroredAssistant(),
			user("EV40-CONTINUE"),
		];
		filter.arm();
		const out = filter.apply(messages);
		expect(out).not.toBeUndefined();
		expect(out!.length).toBe(3);
		expect(out!.every((m) => m.role !== "assistant")).toBe(true);
		// exactly one pass: the second call is a no-op
		expect(filter.isArmed()).toBe(false);
		expect(filter.apply([erroredAssistant()])).toBeUndefined();
	});

	test("armed but no errored message present → disarms and returns undefined (no accidental second pass)", () => {
		const filter = createOnePassErrorFilter();
		const messages = [user("hi"), user("again")];
		filter.arm();
		expect(filter.apply(messages)).toBeUndefined();
		expect(filter.isArmed()).toBe(false);
	});

	test("never touches non-assistant messages; an assistant error with a DIFFERENT errorMessage is kept", () => {
		const filter = createOnePassErrorFilter();
		const messages = [user("start"), erroredAssistant("some other failure"), toolResult()];
		filter.arm();
		// Per §2.4: armed but no literal-matched errored assistant → undefined, no change.
		expect(filter.apply(messages)).toBeUndefined();
		expect(filter.isArmed()).toBe(false);
		expect(messages.length).toBe(3); // the caller's list is never mutated
	});

	test("disarm() cancels an armed pass (abort paths)", () => {
		const filter = createOnePassErrorFilter();
		filter.arm();
		filter.disarm();
		expect(filter.apply([erroredAssistant()])).toBeUndefined();
	});
});

describe("EV-40 D2 — classifyParentTurnRetry (the parent-loop predicate)", () => {
	test('"retry" for the with-colon intake literal (O3 hygiene)', () => {
		expect(classifyParentTurnRetry({ stopReason: "error", errorMessage: PROVIDER_FINISH_REASON_ERROR })).toBe("retry");
	});

	test("undefined for a message pi itself retries — pi already spent its budget before settle", () => {
		expect(classifyParentTurnRetry({ stopReason: "error", errorMessage: "Provider returned 502: upstream unavailable" })).toBeUndefined();
		expect(classifyParentTurnRetry({ stopReason: "error", errorMessage: "overloaded" })).toBeUndefined();
	});

	test("undefined for stopReason stop / length / aborted / absent", () => {
		expect(classifyParentTurnRetry({ stopReason: "stop", errorMessage: PROVIDER_FINISH_REASON_ERROR })).toBeUndefined();
		expect(classifyParentTurnRetry({ stopReason: "length" })).toBeUndefined();
		expect(classifyParentTurnRetry({ stopReason: "aborted" })).toBeUndefined();
		expect(classifyParentTurnRetry({})).toBeUndefined();
	});

	test("undefined for a missing message", () => {
		expect(classifyParentTurnRetry(null as never)).toBeUndefined();
	});
});

describe("EV-40 — computeBackoffDelay (pure policy)", () => {
	const policy = { baseDelayMs: 2000, maxDelayMs: 30000, jitter: true };

	test("attempt 2 is baseDelayMs; exponential growth caps at maxDelayMs", () => {
		expect(computeBackoffDelay({ ...policy, jitter: false }, 2)).toBe(2000);
		expect(computeBackoffDelay({ ...policy, jitter: false }, 3)).toBe(4000);
		expect(computeBackoffDelay({ ...policy, jitter: false }, 4)).toBe(8000);
		expect(computeBackoffDelay({ baseDelayMs: 2000, maxDelayMs: 5000, jitter: false }, 5)).toBe(5000);
	});

	test("jitter multiplies by (0.5 + rand), rounded — injected rand", () => {
		expect(computeBackoffDelay(policy, 2, () => 0)).toBe(1000); // halved (lower bound)
		expect(computeBackoffDelay(policy, 2, () => 0.5)).toBe(2000); // multiplier exactly 1.0
	});

	test("jitter bounds: attempt 2 ∈ [1000, 3000], attempt 3 ∈ [2000, 6000] with the defaults (round can reach the boundary)", () => {
		for (let i = 0; i < 200; i++) {
			const d2 = computeBackoffDelay(policy, 2);
			const d3 = computeBackoffDelay(policy, 3);
			expect(d2).toBeGreaterThanOrEqual(1000);
			expect(d2).toBeLessThanOrEqual(3000);
			expect(d3).toBeGreaterThanOrEqual(2000);
			expect(d3).toBeLessThanOrEqual(6000);
		}
	});

	test("jitter honors the maxDelayMs cap — the cap binds BEFORE jitter, so the jittered result stays within the spec's [0.5, 1.5) × cap envelope (§2.1 pins the formula)", () => {
		const capped = { baseDelayMs: 2000, maxDelayMs: 5000, jitter: true };
		for (let i = 0; i < 200; i++) {
			const d = computeBackoffDelay(capped, 6, Math.random);
			expect(d).toBeGreaterThanOrEqual(2500);
			expect(d).toBeLessThanOrEqual(7500); // multiplier is strictly < 1.5, but round can reach 1.5 × cap exactly (5000 × 1.4999… rounds to 7500)
		}
	});
});

// ---------------------------------------------------------------------------
// EV-40 formatters, decision helpers, RetryController + RetryEditor component
// behavior. The editor is a real CustomEditor subclass over a minimal fake
// TUI (the test/ev8-focus-navigation.test.ts pattern).
// ---------------------------------------------------------------------------
import {
	RetryController,
	RetryEditor,
	createOnePassErrorFilter,
	formatRetryCountdown,
	formatRetryExhausted,
	formatRetryFailure,
	decideSettleRetry,
	recordAssistantVerdict,
	extractOriginalPrompt,
	installRetryEditor,
	restoreRetryEditor,
	HEADLESS_RETRY_EXHAUSTED_EXIT_CODE,
	type FocusEditorFactory,
} from "../extensions/parent-retry.ts";
import { truncateToWidth, type TUI } from "@earendil-works/pi-tui";

const ESC = "\x1b";
const ENTER = "\r";
const EM_DASH = "\u2014";

class FakeTUI {
	mode = "tui";
	renders = 0;
	terminal = { rows: 24, columns: 80, size: { rows: 24, columns: 80 } };
	requestRender() {
		this.renders++;
	}
}

function editorTheme() {
	return { borderColor: (s: string) => s, selectList: {} };
}

function fakeKeybindings() {
	return { matches: () => false, matchesExact: () => false };
}

interface ControllerCalls {
	requestRender: number;
	onAbort: number;
	onRearm: number;
	onSubmitTyped: number;
}

function buildController(over: Partial<{ maxAttempts: number }> = {}): {
	controller: RetryController;
	calls: ControllerCalls;
	filter: ReturnType<typeof createOnePassErrorFilter>;
} {
	const calls: ControllerCalls = { requestRender: 0, onAbort: 0, onRearm: 0, onSubmitTyped: 0 };
	const filter = createOnePassErrorFilter();
	const controller = new RetryController({
		maxAttempts: over.maxAttempts ?? 3,
		requestRender: () => calls.requestRender++,
		onAbort: () => {
			calls.onAbort++;
			filter.disarm();
		},
		onRearm: () => calls.onRearm++,
		onSubmitTyped: () => {
			calls.onSubmitTyped++;
			filter.disarm();
		},
	});
	return { controller, calls, filter };
}

function buildEditor(controller: RetryController, priorFactory?: FocusEditorFactory) {
	const tui = new FakeTUI();
	const editor = new RetryEditor(
		tui as unknown as TUI,
		editorTheme() as never,
		fakeKeybindings() as never,
		controller,
		priorFactory,
	);
	return { editor, tui };
}

describe("EV-40 — copy formatters (R5, exact; U+2014)", () => {
	test("countdown line interpolates attempt, budget, and remaining seconds", () => {
		expect(formatRetryCountdown(2, 3, 2000)).toBe(`Retrying in 2s (attempt 2 of 3) ${EM_DASH} Esc to abort`);
		expect(formatRetryCountdown(3, 3, 500)).toBe(`Retrying in 1s (attempt 3 of 3) ${EM_DASH} Esc to abort`);
		expect(formatRetryCountdown(2, 3, 0)).toBe(`Retrying in 0s (attempt 2 of 3) ${EM_DASH} Esc to abort`);
	});

	test("exhausted terminal line is byte-exact", () => {
		expect(formatRetryExhausted(3)).toBe(
			"Retries exhausted after 3 attempts. The provider kept failing. Press Enter to try again.",
		);
	});

	test("headless exhaustion exit code is 75 (EX_TEMPFAIL semantic, Q5)", () => {
		expect(HEADLESS_RETRY_EXHAUSTED_EXIT_CODE).toBe(75);
	});
});

describe("EV-40 — decideSettleRetry (pure settle decision)", () => {
	const policy = { enabled: true, maxAttempts: 3, baseDelayMs: 2000, maxDelayMs: 30000, jitter: false };
	const errored = { stopReason: "error", errorMessage: PROVIDER_FINISH_REASON_ERROR };

	test("schedule: attempt < maxAttempts → nextAttempt with the computed delay", () => {
		expect(decideSettleRetry({ policy, pendingError: errored, attempt: 1 })).toEqual({
			action: "schedule",
			nextAttempt: 2,
			delayMs: 2000,
		});
		expect(decideSettleRetry({ policy, pendingError: errored, attempt: 2 })).toEqual({
			action: "schedule",
			nextAttempt: 3,
			delayMs: 4000,
		});
	});

	test("exhaust: attempt >= maxAttempts", () => {
		expect(decideSettleRetry({ policy, pendingError: errored, attempt: 3 })).toEqual({ action: "exhaust" });
	});

	test("none: no pending error / disabled policy / null policy (malformed config, owner round-1 P4)", () => {
		expect(decideSettleRetry({ policy, pendingError: null, attempt: 1 })).toEqual({ action: "none" });
		expect(decideSettleRetry({ policy: { ...policy, enabled: false }, pendingError: errored, attempt: 1 })).toEqual({ action: "none" });
		expect(decideSettleRetry({ policy: null, pendingError: errored, attempt: 1 })).toEqual({ action: "none" });
	});

	test("owner P3: aborted / stop / length turns schedule nothing", () => {
		expect(decideSettleRetry({ policy, pendingError: { stopReason: "aborted" }, attempt: 1 })).toEqual({ action: "none" });
		expect(decideSettleRetry({ policy, pendingError: { stopReason: "stop" }, attempt: 1 })).toEqual({ action: "none" });
		expect(decideSettleRetry({ policy, pendingError: { stopReason: "length" }, attempt: 1 })).toEqual({ action: "none" });
	});

	test("D2 at the decision point: a pi-retryable error schedules nothing", () => {
		expect(
			decideSettleRetry({ policy, pendingError: { stopReason: "error", errorMessage: "Provider returned 502: upstream unavailable" }, attempt: 1 }),
		).toEqual({ action: "none" });
	});
});

describe("EV-40 — recordAssistantVerdict + extractOriginalPrompt (pure detection)", () => {
	test("retry-verdict message becomes pending; aborted/stop/length clear it; non-assistant messages don't touch it", () => {
		const pending = { stopReason: "error", errorMessage: PROVIDER_FINISH_REASON_ERROR };
		const retryMessage = { role: "assistant", stopReason: "error", errorMessage: PROVIDER_FINISH_REASON_ERROR };
		// the retry-verdict message IS the new pending (identity — agent_end recomputes from it)
		expect(recordAssistantVerdict(null, retryMessage)).toBe(retryMessage);
		expect(recordAssistantVerdict(retryMessage, { role: "assistant", stopReason: "aborted" })).toBeNull();
		expect(recordAssistantVerdict(retryMessage, { role: "assistant", stopReason: "stop" })).toBeNull();
		expect(recordAssistantVerdict(retryMessage, { role: "assistant", stopReason: "length" })).toBeNull();
		expect(recordAssistantVerdict(retryMessage, { role: "user", stopReason: "error" })).toBe(retryMessage);
		const otherError = { role: "assistant", stopReason: "error", errorMessage: "Provider returned 500: x" };
		expect(recordAssistantVerdict(retryMessage, otherError)).toBe(retryMessage); // non-retryable: previous verdict stands
		expect(recordAssistantVerdict(null, otherError)).toBeNull();
	});

	test("originalPrompt is the LAST user message's text (what Enter re-sends)", () => {
		expect(
			extractOriginalPrompt([
				{ role: "user", content: [{ type: "text", text: "first" }] },
				{ role: "assistant", content: [] },
				{ role: "user", content: [{ type: "text", text: "second" }] },
			]),
		).toBe("second");
		expect(extractOriginalPrompt([{ role: "assistant", content: [] }])).toBeNull();
		expect(extractOriginalPrompt([{ role: "user", content: "plain string" }])).toBe("plain string");
	});
});

describe("EV-40 — RetryController surface machine", () => {
	test("beginBackoff → countdown line from the deadline; tick requestRender; clearToIdle stops", () => {
		const { controller, calls } = buildController();
		const now = Date.now();
		controller.beginBackoff(2, 2000, now);
		expect(controller.surface).toBe("backoff");
		expect(controller.attempt).toBe(2);
		expect(controller.lineText(now)).toBe(`Retrying in 2s (attempt 2 of 3) ${EM_DASH} Esc to abort`);
		controller.dispose();
		expect(controller.surface).toBe("idle");
		expect(controller.lineText(now)).toBe("");
	});

	test("designer P2: Esc during backoff → exhausted surface, EXACT terminal copy, disarm fired, no further attempt", () => {
		const { controller, calls, filter } = buildController();
		filter.arm();
		controller.beginBackoff(2, 2000);
		const { editor } = buildEditor(controller);
		editor.handleInput(ESC);
		expect(controller.surface).toBe("exhausted");
		expect(controller.lineText()).toBe(formatRetryExhausted(3));
		expect(calls.onAbort).toBe(1); // engine disarms the send timer
		expect(filter.isArmed()).toBe(false); // filter flag cleared
		expect(calls.onRearm).toBe(0); // no further attempt scheduled
		expect(calls.onSubmitTyped).toBe(0);
	});

	test("designer P5: typed text during backoff is preserved; Enter submits through the prior and aborts the retry", () => {
		const forwarded: string[] = [];
		const priorFactory: FocusEditorFactory = () =>
			({
				handleInput: (data: string) => forwarded.push(data),
				getText: () => forwarded.filter((d) => d !== "\r").join(""),
				render: () => [],
			}) as never;
		const { controller, calls } = buildController();
		controller.beginBackoff(2, 2000);
		const { editor } = buildEditor(controller, priorFactory);
		for (const ch of "hello") editor.handleInput(ch);
		expect(controller.surface).toBe("backoff"); // typing does not disturb the countdown
		editor.handleInput(ENTER);
		expect(controller.surface).toBe("idle"); // surface cleared
		expect(calls.onSubmitTyped).toBe(1); // timer disarmed (engine), council continuation aborted
		expect(calls.onRearm).toBe(0);
		expect(forwarded).toEqual(["h", "e", "l", "l", "o", "\r"]); // the prior/outer submit received the typed text + Enter
	});

	test("Q2 axis 3: Enter on the exhausted surface with an empty draft resets the budget to 1 and re-arms the send", () => {
		const { controller, calls } = buildController();
		controller.moveToExhausted(); // natural exhaustion at attempt 3
		const { editor } = buildEditor(controller);
		editor.handleInput(ENTER);
		expect(calls.onRearm).toBe(1); // one immediate originalPrompt send scheduled
		expect(controller.attempt).toBe(1); // budget back to 1
		expect(controller.surface).toBe("idle"); // surface back to the loop
	});

	test("Q4: empty-draft Enter during backoff is a consumed no-op — no disarm, no send, surface unchanged", () => {
		const { controller, calls, filter } = buildController();
		filter.arm();
		controller.beginBackoff(2, 2000);
		const { editor } = buildEditor(controller);
		editor.handleInput(ENTER);
		expect(controller.surface).toBe("backoff");
		expect(calls.onAbort).toBe(0);
		expect(calls.onSubmitTyped).toBe(0);
		expect(calls.onRearm).toBe(0);
		expect(filter.isArmed()).toBe(true);
	});

	test("exhausted surface with a non-empty draft forwards (typing still wins)", () => {
		const { controller, calls } = buildController();
		controller.moveToExhausted();
		const { editor } = buildEditor(controller);
		editor.setText("new prompt");
		editor.handleInput(ENTER);
		expect(calls.onRearm).toBe(0);
		expect(controller.surface).toBe("exhausted"); // the terminal state clears when the user's own run starts
	});
});

describe("EV-40 — RetryEditor render", () => {
	test("appends the failure line above the countdown while the surface is in backoff; none while idle", () => {
		const { controller } = buildController();
		controller.beginBackoff(2, 2000, Date.now());
		const { editor } = buildEditor(controller);
		const during = editor.render(80);
		expect(during.length).toBeGreaterThanOrEqual(2);
		expect(during[during.length - 2]!).toContain("The provider returned an error");
		expect(during[during.length - 1]!).toContain("attempt 2 of 3");
		controller.clearToIdle();
		const after = editor.render(80);
		expect(after.join("\n")).not.toContain("attempt 2 of 3");
		expect(after.join("\n")).not.toContain("The provider returned an error");
	});

	test("exhausted surface renders the terminal copy as the extra line", () => {
		const { controller } = buildController();
		controller.moveToExhausted();
		const { editor } = buildEditor(controller);
		const lines = editor.render(120); // wide enough for the 92-cell terminal copy
		expect(lines[lines.length - 1]).toBe(formatRetryExhausted(3));
	});
});

describe("FLLWUP-44 — the R3-ruled transient failure line", () => {
	const RULED = "The provider returned an error.";

	test("T1: formatRetryFailure is byte-exact, jargon-free, not the raw literal, not a countdown", () => {
		expect(formatRetryFailure()).toBe(RULED);
		expect(formatRetryFailure()).not.toContain("finish_reason");
		expect(formatRetryFailure()).not.toBe(PROVIDER_FINISH_REASON_ERROR);
		expect(formatRetryFailure().startsWith("Retrying in")).toBe(false);
	});

	test("T2: backoff render composition — failure line at -2, countdown at -1, +2 over idle", () => {
		const { controller } = buildController();
		const { editor } = buildEditor(controller);
		const base = editor.render(80).length; // idle: no extra lines
		controller.beginBackoff(2, 2000, Date.now());
		const during = editor.render(80);
		expect(during.length).toBe(base + 2);
		expect(during[during.length - 2]).toBe(RULED); // identity theme — ruled string at a wide width
		expect(during[during.length - 1]!).toContain("attempt 2 of 3");
		// pi-tui contract: one string per line, no embedded newline
		expect(during.every((l) => !l.includes("\n"))).toBe(true);
	});

	test("T3: idle/exhausted absence — clearToIdle, moveToExhausted, escAbort all drop the failure line", () => {
		const { controller } = buildController();
		controller.beginBackoff(2, 2000, Date.now());
		const { editor } = buildEditor(controller);
		controller.clearToIdle();
		expect(editor.render(80)).not.toContain(RULED);
		controller.moveToExhausted();
		const exhausted = editor.render(120);
		expect(exhausted[exhausted.length - 1]).toBe(formatRetryExhausted(3));
		expect(exhausted).not.toContain(RULED);
		controller.clearToIdle();
		controller.beginBackoff(2, 2000, Date.now());
		editor.handleInput(ESC);
		expect(controller.surface).toBe("exhausted");
		expect(editor.render(120)).not.toContain(RULED);
	});

	test("T4 (the ruling's semantic): per-episode re-show — failure line at attempt 2 AND attempt 3", () => {
		const { controller } = buildController();
		const { editor } = buildEditor(controller);
		controller.beginBackoff(2, 2000, Date.now());
		const during2 = editor.render(80);
		expect(during2[during2.length - 2]).toBe(RULED);
		controller.clearToIdle();
		controller.beginBackoff(3, 2000, Date.now());
		const during3 = editor.render(80);
		expect(during3[during3.length - 2]).toBe(RULED); // re-shown per episode
		expect(during3[during3.length - 1]!).toContain("attempt 3 of 3");
	});

	test("T5: width clamp — byte-equal at wide width, truncateToWidth clamp at narrow", () => {
		const { controller } = buildController();
		controller.beginBackoff(2, 2000, Date.now());
		const { editor } = buildEditor(controller);
		const wide = editor.render(80);
		expect(wide[wide.length - 2]).toBe(RULED);
		const narrow = editor.render(10);
		expect(narrow[narrow.length - 2]).toBe(truncateToWidth(RULED, 10));
	});

	test("T6: coupling — no backoff surface, no failure line (render side of the classify gate)", () => {
		const { controller } = buildController();
		const { editor } = buildEditor(controller);
		controller.beginBackoff(2, 2000, Date.now());
		controller.clearToIdle();
		expect(controller.failureLineText()).toBe(""); // surfaceState is the whole gate
		// decision side: a pi-retryable message is classify-none (already covered at the decision point)
		expect(
			decideSettleRetry({ policy: { enabled: true, maxAttempts: 3, baseDelayMs: 2000, maxDelayMs: 30000, jitter: false }, pendingError: { stopReason: "error", errorMessage: "Provider returned 502" }, attempt: 1 }),
		).toEqual({ action: "none" });
	});
});

describe("EV-40 O6 — editor-slot composition (install/restore-if-still-ours)", () => {
	class FakeUI {
		private factory: FocusEditorFactory | undefined;
		getEditorComponent(): FocusEditorFactory | undefined {
			return this.factory;
		}
		setEditorComponent(f: FocusEditorFactory | undefined): void {
			this.factory = f;
		}
	}

	test("install captures the prior and installs ours; restore hands back the prior exactly", () => {
		const ui = new FakeUI();
		const treeFactory: FocusEditorFactory = () => ({}) as never;
		ui.setEditorComponent(treeFactory);
		const { controller } = buildController();
		installRetryEditor(ui, controller);
		expect(ui.getEditorComponent()).not.toBe(treeFactory); // ours is installed
		restoreRetryEditor(ui);
		expect(ui.getEditorComponent()).toBe(treeFactory); // prior restored
		// restore is a no-op when nothing is installed
		restoreRetryEditor(ui);
		expect(ui.getEditorComponent()).toBe(treeFactory);
	});

	test("restore-if-still-ours: an overlay installed over us is left in place", () => {
		const ui = new FakeUI();
		const { controller } = buildController();
		installRetryEditor(ui, controller); // prior = undefined (default editor)
		const treeFactory: FocusEditorFactory = () => ({}) as never;
		ui.setEditorComponent(treeFactory); // the tree installed over us (O6 single-slot hazard)
		restoreRetryEditor(ui);
		expect(ui.getEditorComponent()).toBe(treeFactory); // we do NOT clobber the tree
		// refs cleared: a second restore is inert
		restoreRetryEditor(ui);
		expect(ui.getEditorComponent()).toBe(treeFactory);
	});

	test("install is idempotent — a second install does not re-capture the prior", () => {
		const ui = new FakeUI();
		const { controller } = buildController();
		installRetryEditor(ui, controller);
		const ours = ui.getEditorComponent();
		installRetryEditor(ui, controller);
		expect(ui.getEditorComponent()).toBe(ours);
		restoreRetryEditor(ui);
		expect(ui.getEditorComponent()).toBeUndefined();
	});
});
