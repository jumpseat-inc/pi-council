// EV-66 — the advisory gate's in-flight surface: the pure render function and
// its pinned widget constants.
//
// Spec: docs/superpowers/specs/2026-09-19-EV-66-design.md §6 (settled 2026-09-
// 19). The card's Acceptance pins: the in-flight line names the card being
// evaluated and states that a gate call is in progress, uses no word implying
// thought or deliberation (`thinking`, `deliberating`, `reasoning`, `judging`),
// is replaced rather than appended when the call settles, and a test asserts
// the render function returns zero lines after settle.
//
// R(a) (product-owner ruling, binding): the surface stays exactly the pending
// line — zero lines after settle for EVERY post-settle state including
// failures; no transient failure wording; the line is drawn from in-flight
// call state only, never from the ledger.
//
// These tests are PURE (no TUI, no gate call): the render function is a pure
// function of the pending state; the source pins hold the callsite to the
// settled constants (key "gate-call", no placement argument — pi's documented
// default is aboveEditor — and the hasUI guard) without needing a TUI.
import { test, expect } from "bun:test";
import { readFileSync } from "node:fs";
import * as path from "node:path";
import { COUNCIL_TREE_WIDGET_KEY } from "../extensions/navigator.ts";
import { GATE_WIDGET_KEY, renderGateInFlight } from "../extensions/gate-tool.ts";

const MODULE_PATH = path.join(import.meta.dir, "..", "extensions", "gate-tool.ts");
const source = (): string => readFileSync(MODULE_PATH, "utf-8");

// --- the card's pinned test: zero lines after settle ---

test("settled (null pending) renders zero lines — the card's pinned assertion", () => {
	expect(renderGateInFlight(null)).toEqual([]);
});

test("pending renders exactly one line naming the card and the in-progress state", () => {
	const lines = renderGateInFlight({ cardId: "EV-66" });
	expect(lines).toHaveLength(1);
	expect(lines[0]).toBe("gate: advisory call in progress · EV-66");
});

test("the line is under the wrap budget (length < 80) and deterministic", () => {
	const a = renderGateInFlight({ cardId: "EPIC-13" });
	const b = renderGateInFlight({ cardId: "EPIC-13" });
	expect(a).toEqual(b);
	expect(a[0]!.length).toBeLessThan(80);
});

test("banned-word scan is negative (case-insensitive) across the rendered line", () => {
	const BANNED = /\b(thinking|deliberating|reasoning|judging)\b/i;
	const lines = renderGateInFlight({ cardId: "EV-66" });
	for (const line of lines) expect(BANNED.test(line)).toBe(false);
	// and for a long card id too
	for (const line of renderGateInFlight({ cardId: "EPIC-13-CHILD" })) {
		expect(BANNED.test(line)).toBe(false);
	}
});

// --- pinned constants ---

test('the widget key is exactly "gate-call", distinct from the other two council widget keys', () => {
	expect(GATE_WIDGET_KEY).toBe("gate-call");
	expect(GATE_WIDGET_KEY).not.toBe("council");
	expect(GATE_WIDGET_KEY).not.toBe(COUNCIL_TREE_WIDGET_KEY);
});

// --- source pins: the callsite honors the settled surface contract ---

test("the callsite sets the widget with NO placement argument (aboveEditor default)", () => {
	const src = source();
	const calls = src.match(/setWidget\(GATE_WIDGET_KEY[^\n]*/g) ?? [];
	// exactly two sites: one pending line up, one settle clear
	expect(calls.length).toBe(2);
	for (const call of calls) expect(call.includes("placement")).toBe(false);
});

test("the settle call passes the empty array — zero lines after settle, key kept registered", () => {
	expect(source()).toContain("setWidget(GATE_WIDGET_KEY, [])");
});

test("every widget call is hasUI-guarded — headless shows nothing", () => {
	const src = source();
	const guarded = src.match(/if \(ctx\.hasUI\) ctx\.ui\.setWidget\(GATE_WIDGET_KEY/g) ?? [];
	expect(guarded.length).toBe(2);
});

test("the surface never notifies and never draws with theme colors", () => {
	const src = source();
	// call sites, not comments: a `notify(` invocation is the transcript-append
	// failure the card forbids; the words in prose are not the mechanism.
	expect(/\bnotify\s*\(/.test(src)).toBe(false);
	expect(/theme\.fg|#[0-9a-fA-F]{6}|\\x1b/.test(src)).toBe(false);
});

test("the render path is deterministic — no clock or randomness anywhere in the module", () => {
	const src = source();
	expect(src.includes("Date.now")).toBe(false);
	expect(src.includes("Math.random")).toBe(false);
});
