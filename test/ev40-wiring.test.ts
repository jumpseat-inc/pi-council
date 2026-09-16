// EV-40 — the engine wiring's decision path (spec §2.3/§2.5/§2.7), exercised
// with fake pi/ctx objects: a retry-verdict settle schedules (headless:
// await-inside-handler send + one-pass filter armed); a non-retry settle
// clears the surface and restores the editor; the headless exhaustion path
// prints the terminal copy and sets exit code 75; agent_start resets a
// non-continuation run but never a continuation.
//
// O3 literal hygiene: every classification here uses the WITH-COLON intake
// literal PROVIDER_FINISH_REASON_ERROR.
import { describe, expect, test } from "bun:test";
import { registerParentTurnRetry, type ParentRetryHost } from "../extensions/index.ts";
import {
	createOnePassErrorFilter,
	formatRetryCountdown,
	formatRetryExhausted,
	type FilterableMessage,
} from "../extensions/parent-retry.ts";
import { PROVIDER_FINISH_REASON_ERROR, type RetryPolicy } from "../extensions/retry.ts";

const erroredAssistant = (): FilterableMessage =>
	({ role: "assistant", content: [], stopReason: "error", errorMessage: PROVIDER_FINISH_REASON_ERROR });

const okAssistant = (): FilterableMessage =>
	({ role: "assistant", content: [{ type: "text", text: "done" }], stopReason: "stop" });

const userMsg = (text: string): FilterableMessage => ({ role: "user", content: [{ type: "text", text }] });

const POLICY: RetryPolicy = {
	enabled: true,
	maxAttempts: 3,
	baseDelayMs: 20,
	maxDelayMs: 100,
	jitter: false,
};

type Handler = (event: unknown, ctx: unknown) => unknown;

interface FakePi {
	on(type: string, handler: Handler): void;
	sendUserMessage(prompt: string): void;
	sent: string[];
}

function makePi(): FakePi & { emit(type: string, event: unknown, ctx: unknown): Promise<unknown[]> } {
	const handlers = new Map<string, Handler[]>();
	const pi: FakePi = {
		sent: [],
		on(type, handler) {
			const list = handlers.get(type) ?? [];
			list.push(handler);
			handlers.set(type, list);
		},
		sendUserMessage(prompt) {
			pi.sent.push(prompt);
		},
	};
	const emitter = pi as FakePi & { emit(type: string, event: unknown, ctx: unknown): Promise<unknown[]> };
	emitter.emit = async (type, event, ctx) => {
		const out: unknown[] = [];
		for (const h of handlers.get(type) ?? []) out.push(await h(event, ctx));
		return out;
	};
	return emitter;
}

interface FakeUiState {
	prior: unknown;
	installed: unknown;
}

function makeUi(): { getEditorComponent(): unknown; setEditorComponent(f: unknown): void; state: FakeUiState } {
	const state: FakeUiState = { prior: undefined, installed: undefined };
	return {
		state,
		getEditorComponent: () => state.installed,
		setEditorComponent: (f) => {
			state.installed = f;
		},
	};
}

interface HostState {
	sent: string[];
	printed: string[];
	exitCode: number | null;
}

function makeHost(getUi: () => unknown): { host: ParentRetryHost; state: HostState } {
	const state: HostState = { sent: [], printed: [], exitCode: null };
	const host: ParentRetryHost = {
		sendUserMessage: (prompt) => state.sent.push(prompt),
		print: (line) => state.printed.push(line),
		setExitCode: (code) => {
			state.exitCode = code;
		},
		getUi: getUi as () => null,
	};
	return { host, state };
}

const sleep = (ms: number): Promise<void> => new Promise<void>((r) => setTimeout(r, ms));

describe("EV-40 wiring — headless decision path", () => {
	test("a retry-verdict settle schedules: await-inside-handler backoff, then the originalPrompt send with the filter armed", async () => {
		const pi = makePi();
		const wiring = registerParentTurnRetry(pi, () => POLICY, makeHost(() => null).host);
		const ctx = { hasUI: false, mode: "print", isIdle: () => pi.sent.length === 0 };
		await pi.emit("message_end", { message: erroredAssistant() }, ctx);
		await pi.emit("agent_end", { messages: [userMsg("start"), erroredAssistant()] }, ctx);
		await wiring.onSettled(ctx as never);
		// the continuation was sent INSIDE the settle decision (headless shape), with the original prompt
		expect(pi.sent).toEqual(["start"]);
		// the one-pass filter was armed for exactly this send: a context event strips the errored turn
		const results = await pi.emit("context", { messages: [userMsg("start"), erroredAssistant()] }, ctx);
		expect(results[results.length - 1]).toEqual({ messages: [userMsg("start")] });
		// and the filter disarmed itself (one pass)
		const again = await pi.emit("context", { messages: [erroredAssistant()] }, ctx);
		expect(again[again.length - 1]).toBeUndefined();
	});

	test("a non-retry settle clears the surface and restores the editor (TUI)", async () => {
		const pi = makePi();
		const ui = makeUi();
		const { host } = makeHost(() => ui);
		const wiring = registerParentTurnRetry(pi, () => POLICY, host);
		const ctx = { hasUI: true, mode: "tui", isIdle: () => true, ui };
		// arm a backoff
		await pi.emit("message_end", { message: erroredAssistant() }, ctx);
		await pi.emit("agent_end", { messages: [userMsg("start"), erroredAssistant()] }, ctx);
		await wiring.onSettled(ctx as never);
		expect(ui.state.installed).not.toBeUndefined(); // our editor is installed
		expect(pi.sent).toEqual([]); // TUI: nothing sent until the timer fires
		// the continuation succeeds
		await pi.emit("message_end", { message: okAssistant() }, ctx);
		await pi.emit("agent_end", { messages: [userMsg("start"), okAssistant()] }, ctx);
		await wiring.onSettled(ctx as never);
		expect(ui.state.installed).toBeUndefined(); // restored (prior captured as undefined)
		expect(pi.sent).toEqual([]);
	});

	test("headless exhaustion prints the terminal copy and sets exit code 75; nothing is sent", async () => {
		const pi = makePi();
		const policy: RetryPolicy = { ...POLICY, maxAttempts: 1 };
		const { host, state } = makeHost(() => null);
		const wiring = registerParentTurnRetry(pi, () => policy, host);
		const ctx = { hasUI: false, mode: "print", isIdle: () => true };
		await pi.emit("message_end", { message: erroredAssistant() }, ctx);
		await pi.emit("agent_end", { messages: [userMsg("start"), erroredAssistant()] }, ctx);
		await wiring.onSettled(ctx as never);
		expect(state.printed).toContain(formatRetryExhausted(1));
		expect(state.exitCode).toBe(75);
		expect(pi.sent).toEqual([]);
	});

	test("agent_start resets a non-continuation run (timer disarmed, editor restored) but never a continuation", async () => {
		const pi = makePi();
		const ui = makeUi();
		const { host } = makeHost(() => ui);
		const wiring = registerParentTurnRetry(pi, () => POLICY, host);
		const ctx = { hasUI: true, mode: "tui", isIdle: () => pi.sent.length === 0, ui };
		// arm the TUI timer
		await pi.emit("message_end", { message: erroredAssistant() }, ctx);
		await pi.emit("agent_end", { messages: [userMsg("start"), erroredAssistant()] }, ctx);
		await wiring.onSettled(ctx as never);
		expect(ui.state.installed).not.toBeUndefined();
		// a NON-continuation run starts (user typed / procedure): fresh budget, timer disarmed, editor restored
		await pi.emit("agent_start", {}, ctx);
		expect(ui.state.installed).toBeUndefined();
		await sleep(80); // longer than the 20ms backoff — the disarmed timer must never fire
		expect(pi.sent).toEqual([]);

		// a CONTINUATION agent_start does not reset: budget stands and the loop continues
		await pi.emit("message_end", { message: erroredAssistant() }, ctx);
		await pi.emit("agent_end", { messages: [userMsg("start"), erroredAssistant()] }, ctx);
		await wiring.onSettled(ctx as never);
		await pi.emit("agent_start", {}, ctx); // this one IS the continuation (expectContinuation set by the send)
		expect(ui.state.installed).not.toBeUndefined(); // surface/editor untouched
		await sleep(60); // the timer fires
		expect(pi.sent).toEqual(["start"]);
		// the nested run settles as a retry at attempt 2 → schedules attempt 3
		await pi.emit("message_end", { message: erroredAssistant() }, ctx);
		await pi.emit("agent_end", { messages: [userMsg("start"), erroredAssistant()] }, ctx);
		const before = pi.sent.length;
		await wiring.onSettled(ctx as never);
		await sleep(60);
		expect(pi.sent.length).toBe(before + 1); // attempt 3 was scheduled and sent
	});
});

describe("EV-40 wiring — headless countdown shape", () => {
	test("the once-per-second countdown line is the R5 copy (interpolated, U+2014)", async () => {
		// shape check: the engine prints formatRetryCountdown — the line the
		// live P4 gate asserts on stdout. 3s backoff → t0 line + 2 whole-second crossings.
		expect(formatRetryCountdown(2, 3, 3000)).toBe("Retrying in 3s (attempt 2 of 3) \u2014 Esc to abort");
	});
});
