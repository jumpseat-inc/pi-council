// EV-40 — parent-turn retry: the §2.4 structural one-pass context filter.
//
// This module is the SINGLE SOURCE for the filter: the offline harness
// (test/ev40-harness/ev40-harness-extension.ts, D1 arm B) and the engine
// (extensions/index.ts parent mode) both register a `context` handler that
// consults this one implementation, so the D1 probe exercises exactly what
// ships.
//
// Constraint O4 (settled): the `context` hook delivers a `structuredClone` of
// the message list per handler, so object identity is dead — the filter is
// structural, armed for exactly ONE provider request, and drops EVERY
// matching errored assistant message (a 3-attempt chain persists one errored
// assistant turn per attempt; a trailing-only filter would leave the earlier
// turns in attempt 3's request).
import { PROVIDER_FINISH_REASON_ERROR } from "./retry.ts";

/** Minimal structural shape the filter reads (role + stopReason +
 * errorMessage). Deliberately NOT AgentMessage — the context event's message
 * type is pi-internal; the structural match is what O4 settled anyway. */
export interface FilterableMessage {
	role?: unknown;
	stopReason?: unknown;
	errorMessage?: unknown;
	content?: unknown;
	toolCallId?: unknown;
}

export interface OnePassContextFilter {
	/** Arm for exactly one provider request. */
	arm(): void;
	/** Disarm without a pass (abort paths, resets). */
	disarm(): void;
	isArmed(): boolean;
	/**
	 * Per spec §2.4: un-armed → undefined (no filter change). Armed → strip
	 * EVERY assistant message with stopReason "error" whose errorMessage
	 * equals the literal (structural match), disarm, and return the filtered
	 * list. If no such message is present, disarm and return undefined (no
	 * accidental second pass). Never touches non-assistant messages; the
	 * toolResult pairing is unaffected.
	 */
	/** Generic over the caller's message type so a filtered list returns with
	 * the SAME element type it received (the context handler hands back
	 * pi-internal messages; elements are preserved, only removed). */
	apply<T extends FilterableMessage>(messages: T[]): T[] | undefined;
}

function isErroredAssistant(
	m: FilterableMessage,
	literal: string,
): boolean {
	return (
		m.role === "assistant" &&
		m.stopReason === "error" &&
		(m.errorMessage ?? "") === literal
	);
}

export function createOnePassErrorFilter<M extends FilterableMessage = FilterableMessage>(
	literal: string = PROVIDER_FINISH_REASON_ERROR,
): OnePassContextFilter {
	let armed = false;
	return {
		arm: () => {
			armed = true;
		},
		disarm: () => {
			armed = false;
		},
		isArmed: () => armed,
		apply<T extends FilterableMessage>(messages: T[]): T[] | undefined {
			if (!armed) return undefined;
			armed = false; // exactly one pass
			const kept = messages.filter((m) => !isErroredAssistant(m, literal));
			if (kept.length === messages.length) return undefined; // nothing to strip
			return kept;
		},
	};
}

// ---------------------------------------------------------------------------
// EV-40 — copy formatters (R5), the settle decision helpers, the retry
// surface controller, and the composed RetryEditor. Both strings interpolate,
// never hardcode; the dash is U+2014.
// ---------------------------------------------------------------------------
import {
	CustomEditor,
	type ExtensionUIContext,
	type KeybindingsManager,
} from "@earendil-works/pi-coding-agent";
import {
	Key,
	matchesKey,
	truncateToWidth,
	type EditorComponent,
	type EditorOptions,
	type EditorTheme,
	type TUI,
} from "@earendil-works/pi-tui";
import { classifyParentTurnRetry, computeBackoffDelay } from "./retry.ts";
import type { RetryPolicy } from "./seats.ts";

/** An editor factory: same signature as pi's EditorFactory (focus-nav.ts precedent). */
export type FocusEditorFactory = (
	tui: TUI,
	theme: EditorTheme,
	keybindings: KeybindingsManager,
) => EditorComponent;

/** R5 (verbatim shape, interpolated): the backoff countdown line. */
export function formatRetryCountdown(attempt: number, maxAttempts: number, remainingMs: number): string {
	return `Retrying in ${Math.max(0, Math.ceil(remainingMs / 1000))}s (attempt ${attempt} of ${maxAttempts}) \u2014 Esc to abort`;
}

/** R5 (verbatim): the named terminal message. */
export function formatRetryExhausted(maxAttempts: number): string {
	return `Retries exhausted after ${maxAttempts} attempts. The provider kept failing. Press Enter to try again.`;
}

/** Q5: the headless equivalent of "Press Enter" is an exit code (EX_TEMPFAIL
 * semantic); a wrapper or the operator re-invokes the same prompt. */
export const HEADLESS_RETRY_EXHAUSTED_EXIT_CODE = 75;

export type SettleRetryDecision =
	| { action: "schedule"; nextAttempt: number; delayMs: number }
	| { action: "exhaust" }
	| { action: "none" };

/**
 * The agent_settled retry decision (spec §2.3). Pure: the engine only wires
 * the returned action onto the real timer/surface. `policy === null` is the
 * malformed-config init failure (owner round-1 P4): retry is disabled, the
 * session must not crash.
 */
export function decideSettleRetry(input: {
	policy: RetryPolicy | null;
	pendingError: FilterableMessage | null | undefined;
	attempt: number;
	rand?: () => number;
}): SettleRetryDecision {
	const { policy, pendingError, attempt, rand } = input;
	if (!policy || !policy.enabled) return { action: "none" };
	if (!pendingError) return { action: "none" };
	if (classifyParentTurnRetry(pendingError as { stopReason?: string; errorMessage?: string }) !== "retry") return { action: "none" };
	if (attempt < policy.maxAttempts) {
		return {
			action: "schedule",
			nextAttempt: attempt + 1,
			delayMs: computeBackoffDelay(policy, attempt + 1, rand),
		};
	}
	return { action: "exhaust" };
}

/**
 * message_end / agent_end verdict recording (spec §2.3): a retry-verdict
 * assistant message becomes the pending error; aborted/stop/length clear it;
 * anything else leaves the previous verdict standing (agent_end recomputes
 * from the last assistant message and is authoritative).
 */
export function recordAssistantVerdict(
	pending: FilterableMessage | null,
	message: FilterableMessage,
): FilterableMessage | null {
	if (message.role !== "assistant") return pending;
	if (classifyParentTurnRetry(message as { stopReason?: string; errorMessage?: string }) === "retry") {
		return message;
	}
	const stop = message.stopReason;
	if (stop === "aborted" || stop === "stop" || stop === "length") return null;
	return pending;
}

/** The text of the LAST user message — what Enter re-sends and what the
 * continuation sends (spec §2.3). */
export function extractOriginalPrompt(
	messages: Array<{ role?: unknown; content?: unknown }>,
): string | null {
	for (let i = messages.length - 1; i >= 0; i--) {
		const m = messages[i];
		if (m?.role !== "user") continue;
		const content = m.content;
		if (typeof content === "string") return content;
		if (Array.isArray(content)) {
			return content
				.filter((c) => (c as { type?: string } | null)?.type === "text")
				.map((c) => (c as { text?: string }).text ?? "")
				.join("");
		}
		return "";
	}
	return null;
}

// ---------------------------------------------------------------------------
// RetryController — the surface state machine (idle | backoff | exhausted)
// with the 1 s render tick. The engine owns the SEND timer and passes the
// three side-effect callbacks in; navigator/focus-nav never touch the send
// path (spec §2.5).
// ---------------------------------------------------------------------------
export type RetrySurface = "idle" | "backoff" | "exhausted";

export interface RetryControllerDeps {
	maxAttempts: number;
	/** Called by the 1 s tick while the backoff surface is up (the TUI's requestRender). */
	requestRender(): void;
	/** Esc during backoff: the engine disarms its send timer and clears the context filter. */
	onAbort(): void;
	/** Exhausted + empty-draft Enter: the engine re-sends the original prompt with a fresh budget. */
	onRearm(): void;
	/** Non-empty-draft Enter during backoff: the engine disarms timer + filter and clears the surface; the user's prompt wins (Q4). */
	onSubmitTyped(): void;
}

export class RetryController {
	readonly maxAttempts: number;
	private readonly deps: RetryControllerDeps;
	private renderFn: () => void;
	private surfaceState: RetrySurface = "idle";
	private _attempt = 1;
	private _deadline = 0;
	private tick: ReturnType<typeof setInterval> | null = null;

	constructor(deps: RetryControllerDeps) {
		this.deps = deps;
		this.maxAttempts = deps.maxAttempts;
		this.renderFn = deps.requestRender;
	}

	/** The RetryEditor attaches the real TUI render hook when it is constructed
	 * (the editor receives the TUI instance; the engine's closure does not).
	 * Before any editor exists the tick's requestRender is a no-op. */
	attachRender(fn: () => void): void {
		this.renderFn = fn;
	}

	get surface(): RetrySurface {
		return this.surfaceState;
	}

	get attempt(): number {
		return this._attempt;
	}

	remainingMs(now: number = Date.now()): number {
		return Math.max(0, this._deadline - now);
	}

	/** The extra editor line for the current surface ("" while idle). */
	lineText(now: number = Date.now()): string {
		if (this.surfaceState === "backoff") {
			return formatRetryCountdown(this._attempt, this.maxAttempts, this.remainingMs(now));
		}
		if (this.surfaceState === "exhausted") return formatRetryExhausted(this.maxAttempts);
		return "";
	}

	/** Arm the backoff surface for `attempt` with `delayMs` (deadline-relative). */
	beginBackoff(attempt: number, delayMs: number, now: number = Date.now()): void {
		this._attempt = attempt;
		this._deadline = now + delayMs;
		this.surfaceState = "backoff";
		this.startTick();
	}

	/** Natural exhaustion (budget spent without a user Esc). */
	moveToExhausted(): void {
		this.stopTick();
		this.surfaceState = "exhausted";
	}

	/** Escape during backoff: abort the remaining retries and move to the
	 * EXHAUSTED surface with the same terminal copy as natural exhaustion
	 * (designer P2 — not a distinct "cancelled" copy). Consumed only in backoff. */
	escAbort(): boolean {
		if (this.surfaceState !== "backoff") return false;
		this.stopTick();
		this.deps.onAbort();
		this.surfaceState = "exhausted";
		return true;
	}

	/** Enter during backoff. Empty draft → consumed no-op (Q4). Non-empty →
	 * the user's prompt wins: disarm via onSubmitTyped, surface cleared, the
	 * editor forwards Enter so pi submits the typed text. */
	enterOnBackoff(draftEmpty: boolean): "noop" | "submit" {
		if (this.surfaceState !== "backoff") return "noop";
		if (draftEmpty) return "noop";
		this.stopTick();
		this.deps.onSubmitTyped();
		this.surfaceState = "idle";
		return "submit";
	}

	/** Enter on the exhausted surface. Empty draft → re-arm: budget resets to
	 * 1 (Q2 axis 3), one immediate originalPrompt send via onRearm, surface
	 * back to the loop. Non-empty draft → forward (typing still wins). */
	enterOnExhausted(draftEmpty: boolean): "rearm" | "forward" {
		if (this.surfaceState !== "exhausted") return "forward";
		if (!draftEmpty) return "forward";
		this._attempt = 1;
		this.surfaceState = "idle";
		this.deps.onRearm();
		return "rearm";
	}

	/** Successful-continuation exit (or any run that ends without the retry verdict). */
	clearToIdle(): void {
		this.stopTick();
		this.surfaceState = "idle";
	}

	/** Full teardown (session_shutdown). */
	dispose(): void {
		this.stopTick();
		this.surfaceState = "idle";
	}

	private startTick(): void {
		if (this.tick) return;
		this.tick = setInterval(() => {
			if (this.surfaceState === "backoff") this.renderFn();
		}, 1_000);
		this.tick.unref?.();
	}

	private stopTick(): void {
		if (this.tick) {
			clearInterval(this.tick);
			this.tick = null;
		}
	}
}

// ---------------------------------------------------------------------------
// RetryEditor — the R5 input-bar surface (Q1 ruling): a CustomEditor subclass
// installed via setEditorComponent, composing over any prior editor exactly
// like CustomTreeEditor (focus-nav.ts:277–289, 348–357). The countdown is an
// extra RENDERED line — never buffer text, never a placeholder, never
// setEditorText (O6 bans).
// ---------------------------------------------------------------------------
export class RetryEditor extends CustomEditor {
	private inner?: EditorComponent;

	constructor(
		tui: TUI,
		theme: EditorTheme,
		keybindings: KeybindingsManager,
		private readonly controller: RetryController,
		priorFactory?: FocusEditorFactory,
		options?: EditorOptions,
	) {
		super(tui, theme, keybindings, options);
		this.inner = priorFactory ? (priorFactory(tui, theme, keybindings) as EditorComponent) : undefined;
		// The editor owns the only TUI reference — wire the controller's 1 s tick
		// to a real repaint (the countdown line lives in this editor's render).
		controller.attachRender(() => tui.requestRender());
	}

	/** The draft lives in the prior editor when one is composed over; the typed
	 * chars are forwarded there, so the empty-vs-non-empty check reads prior first. */
	private draftText(): string {
		const prior = this.inner as (EditorComponent & { getText?: () => string }) | undefined;
		if (prior && typeof prior.getText === "function") return prior.getText();
		return this.getText();
	}

	handleInput(data: string): void {
		const surface = this.controller.surface;
		if (matchesKey(data, Key.escape)) {
			if (surface === "backoff" && this.controller.escAbort()) {
				this.tui.requestRender();
				return; // consumed: retries aborted, exhausted surface
			}
			// exhausted/idle Esc is pi's normal abort path — forward.
		} else if (matchesKey(data, Key.return)) {
			if (surface === "backoff") {
				const r = this.controller.enterOnBackoff(this.draftText().trim().length === 0);
				if (r === "noop") {
					this.tui.requestRender();
					return; // consumed no-op (Q4): the retry continues
				}
				// "submit": surface already cleared and the timer disarmed — fall
				// through so pi submits the typed text through the normal turn path.
			} else if (surface === "exhausted") {
				const r = this.controller.enterOnExhausted(this.draftText().trim().length === 0);
				if (r === "rearm") {
					this.tui.requestRender();
					return; // consumed: the engine re-sent the original prompt
				}
				// non-empty draft: fall through — typing still wins; the terminal
				// state clears when the user's own run starts.
			}
		}
		// Forward-unhandled (EV-8 Ruling 2): every other key reaches the prior
		// editor or the base app editor.
		if (this.inner) this.inner.handleInput(data);
		else super.handleInput(data);
	}

	render(width: number): string[] {
		const lines = super.render(width);
		const lineText = this.controller.lineText();
		if (!lineText) return lines;
		const styled = this.borderColor ? this.borderColor(lineText) : lineText;
		lines.push(truncateToWidth(styled, width));
		return lines;
	}
}

// ---------------------------------------------------------------------------
// Install/restore lifecycle — mirrors focus-nav's installedPrior pattern
// (single editor slot; restore-IF-STILL-OURS, never clobber an overlay that
// installed over us).
// ---------------------------------------------------------------------------
let installedRetryPrior: FocusEditorFactory | undefined;
let installedRetryFactory: FocusEditorFactory | undefined;

/** Register the retry editor, composing over whatever prior editor exists.
 * Idempotent while installed. */
export function installRetryEditor(
	ui: Pick<ExtensionUIContext, "getEditorComponent" | "setEditorComponent">,
	controller: RetryController,
): void {
	if (installedRetryFactory) return;
	installedRetryPrior = ui.getEditorComponent() ?? undefined;
	installedRetryFactory = (tui, theme, keybindings) =>
		new RetryEditor(tui, theme, keybindings, controller, installedRetryPrior);
	ui.setEditorComponent(installedRetryFactory);
}

/** True while our factory is the configured editor component. */
export function retryEditorInstalled(
	ui: Pick<ExtensionUIContext, "getEditorComponent">,
): boolean {
	return installedRetryFactory !== undefined && ui.getEditorComponent() === installedRetryFactory;
}

/** Restore the composed-over editor ONLY IF the currently configured factory
 * is still ours. If another overlay (the tree) installed over us, it is left
 * in place (O6 single-slot hazard) and our refs are cleared. */
export function restoreRetryEditor(
	ui: Pick<ExtensionUIContext, "getEditorComponent" | "setEditorComponent">,
): void {
	if (!installedRetryFactory) return;
	const stillOurs = ui.getEditorComponent() === installedRetryFactory;
	if (stillOurs) ui.setEditorComponent(installedRetryPrior);
	installedRetryFactory = undefined;
	installedRetryPrior = undefined;
}
