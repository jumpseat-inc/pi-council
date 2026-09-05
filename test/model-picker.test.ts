import { test, expect } from "bun:test";
import * as fs from "node:fs";
import { loadPiThemeModule, materializeTheme } from "../extensions/theme-activation.ts";
import { COUNCIL_CONFIG_FILE } from "../extensions/seats.ts";
import type { ModelEntry, ResolverResult } from "../extensions/catalogue.ts";
import {
	EMPTY_NO_MODELS,
	EMPTY_NO_PROVIDERS,
	FOOTER_CONFIRM,
	FOOTER_MODEL,
	FOOTER_SEAT_PROVIDER,
	HEADER,
	ModelPicker,
	NO_MATCH,
	PRE_SEARCH_HINT,
	SEARCH_ROW_EMPTY,
	echoFor,
	filterModelRows,
	footerFor,
	rowsForProvider,
	seatMarker,
	type SeatModelSelection,
} from "../extensions/model-picker.ts";

// ---- key simulation: raw bytes pi-tui matches (same as navigator.test.ts) ----
const UP = "\x1b[A";
const DOWN = "\x1b[B";
const ENTER = "\r";
const ESC = "\x1b";

const ANSI_RE = /\u001b\[[0-9;]*m/g;
function strip(line: string): string {
	return line.replace(ANSI_RE, "");
}
const ANSI_SEQ = /\u001b\[[0-9;]*m/g;
function colorAnsi(lines: string[]): string[] {
	return (lines.join("\n").match(ANSI_SEQ) ?? []).filter((s) => /(?:3[89]|4[89]);/.test(s));
}

/** Hand-built model entries. Real resolver output always sets
 *  qualifiedId = `${provider}/${id}`; the fixture deliberately includes one
 *  entry where they differ (an alias key) so tests prove the modal copies
 *  qualifiedId verbatim and never recomposes provider + "/" + id. */
function entry(id: string, levels: string[], qualifiedId = id, name = id): ModelEntry {
	return { qualifiedId, id, name, reasoning: levels.length > 0, supportedThinkingLevels: levels };
}

const OPENROUTER: ModelEntry[] = [
	entry("deepseek/deepseek-v4-pro-0813", ["off", "medium", "high"], "openrouter/deepseek/deepseek-v4-pro-0813", "DeepSeek V4 Pro (0813)"),
	entry("alpha/a", ["off"], "openrouter/alpha/a", "Alpha A"),
	entry("claude/sonnet-4", ["off", "high"], "openrouter/alias/claude-sonnet", "Sonnet 4"), // alias key ≠ provider + "/" + id
];
const XAI: ModelEntry[] = [entry("grok/v1", [], "xai/grok/v1", "Grok V1")]; // [] — the essentially-unreachable shape, built by hand (O-2)

const CATALOGUE: ResolverResult = {
	providers: [
		{ provider: "openrouter", displayName: "OpenRouter", models: OPENROUTER },
		{ provider: "xai", displayName: "xAI", models: XAI },
	],
	seats: [
		{ name: "owner", hasOverride: true, currentModel: "openrouter/a/fm", currentThinking: "medium" },
		{ name: "designer", hasOverride: true, currentModel: "a/b", currentThinking: "low" }, // object-form {"model":"a/b:low"} — seam fixture (§8.10)
		{ name: "principal", hasOverride: false, currentModel: "openrouter/x/yz" },
	],
};

/** Passthrough theme for navigation/echo tests: renders text unstyled, so
 *  strip() is a no-op and ANSI byte assertions stay in the real-theme tests. */
const FAKE_THEME = {
	fg: (_c: string, text: string) => text,
	bg: (_c: string, text: string) => text,
	bold: (text: string) => text,
};

function picker(catalogue: ResolverResult, maxRows?: number): { p: ModelPicker; confirmed: SeatModelSelection[]; closed: () => boolean } {
	const confirmed: SeatModelSelection[] = [];
	let closed = false;
	const p = new ModelPicker(
		catalogue,
		FAKE_THEME,
		(sel) => confirmed.push(sel),
		() => {
			closed = true;
		},
		maxRows !== undefined ? { maxRows } : undefined,
	);
	return { p, confirmed, closed: () => closed };
}

// ---- §8.1 / §8.12 source audits ----
function stripComments(src: string): string {
	let out = src.replace(/\/\*[\s\S]*?\*\//g, "");
	out = out.replace(/\/\/[^\n]*/g, "");
	return out;
}

test("8.1 source audit: model-picker.ts has no ANSI escape and no literal #hex (post-comment-strip)", () => {
	const src = fs.readFileSync(new URL("../extensions/model-picker.ts", import.meta.url), "utf-8");
	const code = stripComments(src);
	expect(code).not.toMatch(/\u001b/);
	expect(code).not.toMatch(/#[0-9a-fA-F]{3,8}/);
});

test("8.12 no-side-effect boundary: source has no writer/resolver/fs symbols (post-comment-strip)", () => {
	const src = fs.readFileSync(new URL("../extensions/model-picker.ts", import.meta.url), "utf-8");
	const code = stripComments(src);
	for (const sym of ["writeSeatOverride", "resolveCatalogue", "getAvailable", "repoRoot", "fs"]) {
		expect(code, `must not mention ${sym}`).not.toContain(sym);
	}
});

// ---- §8.2 palette ----
test("8.2 palette: every level and empty state draws only theme-owned ANSI", async () => {
	const theme = await materializeTheme({ variant: "dark" }, "dark", "truecolor");
	const allowed = new Set<string>();
	for (const tok of (theme as unknown as { fgColors: Map<string, unknown> }).fgColors.keys()) allowed.add(theme.getFgAnsi(tok as never));
	for (const tok of (theme as unknown as { bgColors: Map<string, unknown> }).bgColors.keys()) allowed.add(theme.getBgAnsi(tok as never));

	const renders: string[][] = [];
	const main = new ModelPicker(CATALOGUE, theme, () => {}, () => {});
	renders.push(main.render(80)); // seat
	main.handleInput(ENTER);
	renders.push(main.render(80)); // provider
	main.handleInput(ENTER);
	renders.push(main.render(80)); // model
	main.handleInput(ENTER);
	renders.push(main.render(80)); // confirm

	const noProviders = new ModelPicker({ providers: [], seats: CATALOGUE.seats }, theme, () => {}, () => {});
	noProviders.handleInput(ENTER);
	renders.push(noProviders.render(80)); // R-4#1 empty state

	const noModels = new ModelPicker(
		{ providers: [{ provider: "p", displayName: "P", models: [] }], seats: CATALOGUE.seats },
		theme,
		() => {},
		() => {},
	);
	noModels.handleInput(ENTER);
	noModels.handleInput(ENTER);
	renders.push(noModels.render(80)); // R-4#2 empty state

	const seatDefault: ResolverResult = { providers: [], seats: [{ name: "s", hasOverride: false, currentModel: "m/x" }] };
	renders.push(new ModelPicker(seatDefault, theme, () => {}, () => {}).render(80)); // R-4#3 frontmatter-default marker

	for (const lines of renders) {
		expect(colorAnsi(lines).length, "level must draw color").toBeGreaterThan(0);
		for (const c of colorAnsi(lines)) expect(allowed.has(c), `foreign ansi ${c}`).toBe(true);
	}
});

// ---- §8.3 ruled copy byte-exact ----
test("8.3 ruled copy: R-1..R-4 constants are byte-exact", () => {
	expect(HEADER).toBe("council models — pick a model per seat");
	expect(FOOTER_SEAT_PROVIDER).toBe("↑/↓ move · enter open · esc back");
	expect(FOOTER_MODEL).toBe("↑/↓ move · enter select · esc back");
	expect(FOOTER_CONFIRM).toBe("enter confirm · esc back");
	expect(EMPTY_NO_PROVIDERS).toBe("No providers configured — authenticate a provider in pi, then reopen /council-models.");
	expect(EMPTY_NO_MODELS("OpenRouter")).toBe("No models available for OpenRouter.");
});

test("8.3 ruled copy: seatMarker keyed off hasOverride key presence (incl. the {} edge)", () => {
	expect(seatMarker({ name: "o", hasOverride: true, currentModel: "openrouter/a/fm", currentThinking: "medium" })).toBe(
		"— using openrouter/a/fm:medium (override)",
	);
	expect(seatMarker({ name: "o", hasOverride: true, currentModel: "openrouter/x/yz" })).toBe("— using openrouter/x/yz (override)");
	expect(seatMarker({ name: "o", hasOverride: false, currentModel: "openrouter/x/yz" })).toBe("— frontmatter default");
});

test("8.3 ruled copy: footerFor maps levels to exactly the three footer strings", () => {
	expect(footerFor(0)).toBe(FOOTER_SEAT_PROVIDER);
	expect(footerFor(1)).toBe(FOOTER_SEAT_PROVIDER);
	expect(footerFor(2)).toBe(FOOTER_MODEL);
	expect(footerFor(3)).toBe(FOOTER_CONFIRM);
});

// ---- §8.4 key handling ----
test("8.4 keys: arrows move and clamp (no wrap); enter descends; esc ascends and closes at seat", () => {
	const { p, closed } = picker(CATALOGUE);

	// seat level: 3 seats; up at 0 clamps (no wrap to last)
	p.handleInput(UP);
	expect(strip(p.render(80)[1]).startsWith("> owner")).toBe(true);
	p.handleInput(DOWN);
	p.handleInput(DOWN);
	p.handleInput(DOWN); // past last → clamps at principal
	expect(strip(p.render(80)[3]).startsWith("> principal")).toBe(true);
	p.handleInput(DOWN);
	expect(strip(p.render(80)[3]).startsWith("> principal")).toBe(true); // still clamped

	p.handleInput(ENTER); // → provider
	expect(strip(p.render(80)[1]).startsWith("> OpenRouter")).toBe(true);
	p.handleInput(ENTER); // → model
	const modelLines = p.render(80).map(strip);
	expect(modelLines[1]).toBe("> openrouter/deepseek/deepseek-v4-pro-0813:off");
	p.handleInput(ESC); // → provider
	expect(strip(p.render(80)[1]).startsWith("> OpenRouter")).toBe(true);
	p.handleInput(ESC); // → seat
	expect(strip(p.render(80)[3]).startsWith("> principal")).toBe(true); // seat cursor preserved on return (returning is not entering)
	p.handleInput(ESC); // → close
	expect(closed()).toBe(true);
});

test("8.4 keys: windowing erases only beyond maxRows; re-entry after Esc resets the descended cursor", () => {
	// openrouter has 6 model rows; maxRows 2 → window shows 2, cursor scrolls
	const { p } = picker(CATALOGUE, 2);
	p.handleInput(ENTER); // provider
	p.handleInput(ENTER); // model
	let lines = p.render(80).map(strip);
	expect(lines.filter((l) => l.startsWith("> ") || l.startsWith("  "))).toEqual([
		"> openrouter/deepseek/deepseek-v4-pro-0813:off",
		"  openrouter/deepseek/deepseek-v4-pro-0813:medium",
	]);
	p.handleInput(DOWN);
	p.handleInput(DOWN);
	lines = p.render(80).map(strip);
	expect(lines[1]).toBe("> openrouter/deepseek/deepseek-v4-pro-0813:high"); // window scrolled with cursor
	expect(lines[2]).toBe("  openrouter/alpha/a:off");

	// small per-level row list erases nothing: xai has 1 row ≤ maxRows
	p.handleInput(ESC); // model → provider
	p.handleInput(DOWN); // providerIndex → 1 (xai)
	p.handleInput(ENTER); // provider → model (cursor reset to 0)
	lines = p.render(80).map(strip);
	expect(lines[1]).toBe("> xai/grok/v1");
	expect(lines[2]).toBe(PRE_SEARCH_HINT); // BUG-1 R-1: hint between rows and footer
	expect(lines[lines.length - 1]).toBe(FOOTER_MODEL); // footer stays last, byte-exact

	// re-entry after Esc resets the descended level's cursor to 0
	p.handleInput(ESC); // model → provider (xai)
	p.handleInput(UP); // providerIndex → 0 (openrouter)
	p.handleInput(ENTER); // provider → model — must reset to row 0 (it was 2 before the detour)
	lines = p.render(80).map(strip);
	expect(lines[1]).toBe("> openrouter/deepseek/deepseek-v4-pro-0813:off");
});

// ---- §8.5 echo-then-run ----
test("8.5 echo-then-run: echo matches resolveSelection(), onConfirm fires once with the echoed tuple, settle swallows input", () => {
	const { p, confirmed } = picker(CATALOGUE);
	p.handleInput(ENTER); // provider
	p.handleInput(ENTER); // model
	p.handleInput(DOWN); // → ds:medium
	p.handleInput(ENTER); // confirm
	const lines = p.render(80).map(strip);
	const echoLine = lines.find((l) => l.startsWith("Set "))!;
	const expected: SeatModelSelection = { seat: "owner", model: "openrouter/deepseek/deepseek-v4-pro-0813", thinking: "medium" };
	expect(echoLine).toBe("Set owner to openrouter/deepseek/deepseek-v4-pro-0813:medium");
	expect(lines).toContain(`Writes ${COUNCIL_CONFIG_FILE} — takes effect at the next dispatch.`);
	expect(p.resolveSelection()).toEqual(expected);
	expect(confirmed).toHaveLength(0); // reaching confirm does not fire
	expect(echoLine).toBe(echoFor(expected)); // the echo is derived from the emitted tuple

	p.handleInput(ENTER);
	expect(confirmed).toHaveLength(1);
	expect(confirmed[0]).toEqual(expected);
	p.handleInput(ENTER); // settled — nothing
	p.handleInput(ESC); // settled — nothing
	expect(confirmed).toHaveLength(1);
});

test("8.5 echo-then-run: [] row confirms with thinking omitted", () => {
	const { p, confirmed } = picker(CATALOGUE);
	p.handleInput(ENTER); // provider
	p.handleInput(DOWN); // providerIndex 1 (xai)
	p.handleInput(ENTER); // model — xai/grok/v1 [] row
	p.handleInput(ENTER); // confirm
	const lines = p.render(80).map(strip);
	const echoLine = lines.find((l) => l.startsWith("Set "))!;
	const expected: SeatModelSelection = { seat: "owner", model: "xai/grok/v1" };
	expect(echoLine).toBe("Set owner to xai/grok/v1 — thinking unchanged");
	expect(p.resolveSelection()).toEqual(expected);
	expect(echoLine).toBe(echoFor(expected));
	p.handleInput(ENTER);
	expect(confirmed).toEqual([expected]);
});

// ---- §8.6 thinking matrix (J-2) ----
test("8.6 thinking matrix: 0/1/N levels → exact row counts and order; no level-less row for N≥2", () => {
	const { p } = picker(CATALOGUE);
	p.handleInput(ENTER); // provider (openrouter first)
	p.handleInput(ENTER); // model — 6 rows: ds:off, ds:medium, ds:high, alpha:off, alias:off, alias:high
	const rows = p
		.render(80)
		.map(strip)
		.filter((l) => l.startsWith("> ") || l.startsWith("  "))
		.map((l) => l.slice(2));
	expect(rows).toEqual([
		"openrouter/deepseek/deepseek-v4-pro-0813:off",
		"openrouter/deepseek/deepseek-v4-pro-0813:medium",
		"openrouter/deepseek/deepseek-v4-pro-0813:high",
		"openrouter/alpha/a:off",
		"openrouter/alias/claude-sonnet:off",
		"openrouter/alias/claude-sonnet:high",
	]);
	// J-2: no level-less row for the ≥2-level model
	expect(rows).not.toContain("openrouter/deepseek/deepseek-v4-pro-0813");

	// [] model → 1 row; selection carries thinking undefined
	p.handleInput(ESC); // provider
	p.handleInput(DOWN); // providerIndex 1 (xai)
	p.handleInput(ENTER); // model
	expect(
		p
			.render(80)
			.map(strip)
			.filter((l) => l.startsWith("> ") || l.startsWith("  "))
			.map((l) => l.slice(2)),
	).toEqual(["xai/grok/v1"]);
	p.handleInput(ENTER); // confirm
	expect(p.resolveSelection().thinking).toBeUndefined();
});

test("8.6 thinking matrix: N-row models emit exactly their levels per row", () => {
	// direct row walk: model rows 0..2 are ds:off / ds:medium / ds:high
	const picks: SeatModelSelection[] = [];
	for (let i = 0; i < 3; i++) {
		const q = picker(CATALOGUE);
		q.p.handleInput(ENTER); // provider
		q.p.handleInput(ENTER); // model row 0
		for (let d = 0; d < i; d++) q.p.handleInput(DOWN);
		q.p.handleInput(ENTER); // confirm
		picks.push(q.p.resolveSelection());
		q.p.handleInput(ENTER);
		expect(q.confirmed).toHaveLength(1);
	}
	expect(picks.map((s) => s.thinking)).toEqual(["off", "medium", "high"]);
	for (const s of picks) expect(OPENROUTER[0].supportedThinkingLevels).toContain(s.thinking!);
});

// ---- §8.7 verbatim qualifiedId ----
test("8.7 verbatim qualifiedId: emitted model is byte-equal to ModelEntry.qualifiedId (nested id + alias cases)", () => {
	for (const [row, qualifiedId] of [
		[0, "openrouter/deepseek/deepseek-v4-pro-0813"],
		[3, "openrouter/alpha/a"],
		[4, "openrouter/alias/claude-sonnet"], // ≠ provider + "/" + id
	] as const) {
		const q = picker(CATALOGUE);
		q.p.handleInput(ENTER);
		q.p.handleInput(ENTER);
		for (let d = 0; d < row; d++) q.p.handleInput(DOWN);
		q.p.handleInput(ENTER);
		expect(q.p.resolveSelection().model).toBe(qualifiedId);
	}
});

// ---- §8.8 marker bytes ----
test("8.8 marker bytes: focused row leads with accent `> `, unselected rows two-space padded, no U+258C", async () => {
	const theme = await materializeTheme({ variant: "dark" }, "dark", "truecolor");
	const p = new ModelPicker(CATALOGUE, theme, () => {}, () => {});
	const seat = p.render(80);
	expect(seat[1].startsWith(theme.getFgAnsi("accent") + "> ")).toBe(true);
	expect(seat[2].startsWith("  ")).toBe(true);
	expect(seat.join("\n")).not.toContain("\u258C");
	p.handleInput(ENTER);
	expect(p.render(80).join("\n")).not.toContain("\u258C");
	p.handleInput(ENTER);
	expect(p.render(80).join("\n")).not.toContain("\u258C");
});

// ---- §8.9 four-footer exhaustiveness ----
test("8.9 four-footer exhaustiveness: every transition renders one of the four R-2 footers, never a fifth", () => {
	const { p } = picker(CATALOGUE);
	const FOUR = new Set([FOOTER_SEAT_PROVIDER, FOOTER_MODEL, FOOTER_CONFIRM]);
	const seen = new Set<string>();
	const script: string[] = [ENTER, DOWN, ENTER, DOWN, ENTER, ESC, ESC, ENTER, ENTER, ESC, ENTER, ENTER, ESC];
	for (const key of script) {
		p.handleInput(key);
		const lines = p.render(80).map(strip);
		const footer = lines[lines.length - 1];
		expect(FOUR.has(footer), `footer must be one of the four, got: ${footer}`).toBe(true);
		seen.add(footer);
	}
	expect(seen.size).toBe(3); // seat·provider / model / confirm — no fifth string anywhere
});

// ---- §8.10 seam-aware echo ----
test("8.10 seam-aware echo: picking the [] row for a thinking-suffixed override never claims a preserved level", () => {
	// designer's SeatState comes from object-form {"model":"a/b:low"} — the modal
	// must echo "thinking unchanged", never "keeps thinking low", and emit no thinking.
	const { p, confirmed } = picker(CATALOGUE);
	p.handleInput(DOWN); // seatIndex → designer
	p.handleInput(ENTER); // provider
	p.handleInput(DOWN); // providerIndex → xai
	p.handleInput(ENTER); // model — [] row
	p.handleInput(ENTER); // confirm
	const lines = p.render(80).map(strip);
	expect(lines.find((l) => l.startsWith("Set "))).toBe("Set designer to xai/grok/v1 — thinking unchanged");
	const sel = p.resolveSelection();
	expect(sel).toEqual({ seat: "designer", model: "xai/grok/v1" });
	p.handleInput(ENTER);
	expect(confirmed).toEqual([sel]);
});

// ---- §8.11 empty-state non-conflation ----
test("8.11 empty states: no-providers, no-models, and a [] model row are three distinct surfaces", () => {
	const { p } = picker({ providers: [], seats: CATALOGUE.seats });
	p.handleInput(ENTER); // provider level with zero providers
	const noProv = p.render(80).map(strip);
	expect(noProv).toContain(EMPTY_NO_PROVIDERS);
	expect(noProv).not.toContain("No models available for");
	expect(noProv.some((l) => l.startsWith("> ") || l.startsWith("  "))).toBe(false); // no row markers — no active keys
	expect(noProv).not.toContain(FOOTER_SEAT_PROVIDER); // and no footer

	const q = picker({ providers: [{ provider: "p", displayName: "P", models: [] }], seats: CATALOGUE.seats });
	q.p.handleInput(ENTER); // provider
	q.p.handleInput(ENTER); // model — R-4#2
	const noMod = q.p.render(80).map(strip);
	expect(noMod).toContain(EMPTY_NO_MODELS("P"));
	expect(noMod).not.toContain(EMPTY_NO_PROVIDERS);
	expect(noMod).not.toContain(FOOTER_MODEL); // no footer — no active keys

	// [] model elsewhere is a *selectable* row, never an empty panel (covered by 8.6).
});

// ---- EV-27 `/`-triggered search input (spec test surface) ----
const SLASH_KITTY = "\x1b[47u";

test("EV-27 ruled copy: SEARCH_ROW_EMPTY is the byte-exact R-1 empty-input row", () => {
	expect(SEARCH_ROW_EMPTY).toBe("▌ / filter · esc clears");
});

test("EV-27 1: `/` at level 2 opens the input — bare and kitty forms, rows unchanged", () => {
	const { p } = picker(CATALOGUE);
	p.handleInput(ENTER); // provider
	p.handleInput(ENTER); // model
	expect(strip(p.render(80)[1])).toBe("> openrouter/deepseek/deepseek-v4-pro-0813:off");
	p.handleInput("/");
	const lines = p.render(80).map(strip);
	expect(lines[1]).toBe(SEARCH_ROW_EMPTY);
	expect(lines[2]).toBe("> openrouter/deepseek/deepseek-v4-pro-0813:off");
	expect(lines[lines.length - 1]).toBe(FOOTER_MODEL);

	const q = picker(CATALOGUE);
	q.p.handleInput(ENTER);
	q.p.handleInput(ENTER);
	q.p.handleInput(SLASH_KITTY); // kitty CSI-u form "\x1b[47u"
	expect(strip(q.p.render(80)[1])).toBe(SEARCH_ROW_EMPTY);
});

test("EV-27 3: search row renders between header and first data row; empty byte-exact; typed byte-exact", () => {
	const { p } = picker(CATALOGUE);
	p.handleInput(ENTER);
	p.handleInput(ENTER);
	expect(strip(p.render(80)[0])).toBe(HEADER);
	p.handleInput("/");
	const empty = p.render(80).map(strip);
	expect(empty[0]).toBe(HEADER);
	expect(empty[1]).toBe(SEARCH_ROW_EMPTY);
	expect(empty[2]).toBe("> openrouter/deepseek/deepseek-v4-pro-0813:off");
	for (const ch of "claude") p.handleInput(ch);
	const typed = p.render(80).map(strip);
	expect(typed[0]).toBe(HEADER);
	expect(typed[1]).toBe("▌ claude");

	// truncation is from the right and never clips the `▌`; the empty hint
	// truncates with `/ filter` surviving (design contract, rendering).
	p.handleInput(ESC);
	const narrow = p.render(10).map(strip);
	expect(narrow[1]).toBe("▌ / filter");
	for (const ch of "anthropic/deepseek-v4-pro") p.handleInput(ch);
	expect(p.render(10).map(strip)[1]).toBe("▌ anthropi");
});

// ---- §8.13 truncation never drops the thinking decision ----
test("EV-27 2: typing claude narrows the rows to qualifiedId substring matches (case-insensitive)", () => {
	const { p } = picker(CATALOGUE);
	p.handleInput(ENTER);
	p.handleInput(ENTER);
	p.handleInput("/");
	for (const ch of "claude") p.handleInput(ch);
	const rows = p
		.render(80)
		.map(strip)
		.filter((l) => l.startsWith("> ") || l.startsWith("  "))
		.map((l) => l.slice(2));
	expect(rows).toEqual(["openrouter/alias/claude-sonnet:off", "openrouter/alias/claude-sonnet:high"]);

	const q = picker(CATALOGUE);
	q.p.handleInput(ENTER);
	q.p.handleInput(ENTER);
	q.p.handleInput("/");
	for (const ch of "CLAUDE") q.p.handleInput(ch); // uppercase — case-insensitive
	const qRows = q.p
		.render(80)
		.map(strip)
		.filter((l) => l.startsWith("> ") || l.startsWith("  "))
		.map((l) => l.slice(2));
	expect(qRows).toEqual(["openrouter/alias/claude-sonnet:off", "openrouter/alias/claude-sonnet:high"]);
});

test("EV-27 4: FOOTER_MODEL is the last line at every keystroke incl. no-match", () => {
	const { p } = picker(CATALOGUE);
	p.handleInput(ENTER);
	p.handleInput(ENTER);
	for (const k of ["/", "c", "l", "a", "u", "d", "e", "z", "z"]) {
		p.handleInput(k);
		const lines = p.render(80).map(strip);
		expect(lines[lines.length - 1]).toBe(FOOTER_MODEL);
	}
});

test("EV-27 5: `/` inside the input appends as a literal — anthropic/claude typeable (kitty form)", () => {
	const { p } = picker(CATALOGUE);
	p.handleInput(ENTER);
	p.handleInput(ENTER);
	p.handleInput("/");
	for (const ch of "anthropic") p.handleInput(ch);
	p.handleInput(SLASH_KITTY); // kitty CSI-u slash while search is open — appends, never re-triggers
	for (const ch of "claude") p.handleInput(ch);
	const lines = p.render(80).map(strip);
	expect(lines[1]).toBe("▌ anthropic/claude");
	expect(lines[lines.length - 1]).toBe(FOOTER_MODEL);
	expect(lines.join("\n")).not.toContain(SEARCH_ROW_EMPTY); // still search mode, hint gone
});

test("EV-27 6: render cache — claude vs claud (equal filtered set, cursor, window) differ", () => {
	const { p } = picker(CATALOGUE);
	p.handleInput(ENTER);
	p.handleInput(ENTER);
	p.handleInput("/");
	for (const ch of "claud") p.handleInput(ch);
	const first = p.render(80);
	p.handleInput("e");
	const second = p.render(80);
	expect(second).not.toEqual(first);
	expect(strip(second[1])).toBe("▌ claude");
});

test("EV-27 7: backspace deletes — bare \x7f and kitty \x1b[127u both drop one char (BUG-1)", () => {
	const { p } = picker(CATALOGUE);
	p.handleInput(ENTER);
	p.handleInput(ENTER);
	p.handleInput("/");
	for (const ch of "claude") p.handleInput(ch);
	p.handleInput("\x7f");
	expect(strip(p.render(80)[1])).toBe("▌ claud");
	p.handleInput("\x1b[127u"); // kitty DEL — the same key in kitty encoding
	expect(strip(p.render(80)[1])).toBe("▌ clau");
});

test("EV-27 10: modelIndex re-clamps after every keystroke; shrink-then-Enter emits the survivor; empty-set Enter no-ops", () => {
	const { p, confirmed } = picker(CATALOGUE);
	p.handleInput(ENTER);
	p.handleInput(ENTER);
	p.handleInput("/");
	p.handleInput("a"); // 3 rows: alpha:off, alias:off, alias:high
	p.handleInput(DOWN);
	p.handleInput(DOWN); // index 2
	p.handleInput("l"); // still 3 rows
	p.handleInput("i"); // "ali" → 2 rows; index clamps to 1
	p.handleInput(ENTER); // picks alias:high — no throw
	const sel = p.resolveSelection();
	expect(sel).toEqual({ seat: "owner", model: "openrouter/alias/claude-sonnet", thinking: "high" });
	p.handleInput(ENTER);
	expect(confirmed).toEqual([sel]);

	const q = picker(CATALOGUE);
	q.p.handleInput(ENTER);
	q.p.handleInput(ENTER);
	q.p.handleInput("/");
	for (const ch of "zz") q.p.handleInput(ch); // 0 rows
	q.p.handleInput(ENTER); // consumed no-op, no throw
	const lines = q.p.render(80).map(strip);
	expect(lines[1]).toBe("▌ zz");
	expect(lines[lines.length - 1]).toBe(FOOTER_MODEL);
});

test("EV-27 ruled copy: NO_MATCH is the byte-exact EPIC-6 R-1 literal", () => {
	expect(NO_MATCH("zzzz")).toBe('No models matching "zzzz".');
});

test("EV-27 9: no-match renders ruled copy byte-exact, FOOTER_MODEL last, distinct from R-4; walk exits", () => {
	const { p } = picker(CATALOGUE);
	p.handleInput(ENTER);
	p.handleInput(ENTER);
	p.handleInput("/");
	for (const ch of "zzzz") p.handleInput(ch);
	const lines = p.render(80).map(strip);
	expect(lines[1]).toBe("▌ zzzz");
	expect(lines[2]).toBe(NO_MATCH("zzzz"));
	expect(lines[lines.length - 1]).toBe(FOOTER_MODEL);
	expect(lines).not.toContain(EMPTY_NO_PROVIDERS);
	expect(lines).not.toContain(EMPTY_NO_MODELS("OpenRouter"));
	// R-4#2 is footer-less — byte-distinct surface
	const r4 = new ModelPicker({ providers: [{ provider: "p", displayName: "P", models: [] }], seats: CATALOGUE.seats }, FAKE_THEME, () => {}, () => {});
	r4.handleInput(ENTER);
	r4.handleInput(ENTER);
	expect(r4.render(80).map(strip)).not.toContain(FOOTER_MODEL);
	// no dead-end: Down moves focus out, Esc ascends to level 1
	p.handleInput(DOWN);
	p.handleInput(ESC);
	expect(strip(p.render(80)[1]).startsWith("> OpenRouter")).toBe(true);
});

test("EV-27 8: Esc in the input clears and keeps focus; Esc again stays; Esc with focus out ascends", () => {
	const { p } = picker(CATALOGUE);
	p.handleInput(ENTER);
	p.handleInput(ENTER);
	p.handleInput("/");
	for (const ch of "claude") p.handleInput(ch);
	p.handleInput(ESC); // focused — clear, keep focus, stay level 2
	let lines = p.render(80).map(strip);
	expect(lines[0]).toBe(HEADER);
	expect(lines[1]).toBe(SEARCH_ROW_EMPTY);
	p.handleInput(ESC); // still focused — no ascend
	lines = p.render(80).map(strip);
	expect(lines[0]).toBe(HEADER);
	expect(lines[1]).toBe(SEARCH_ROW_EMPTY);
	p.handleInput(DOWN); // focus out
	p.handleInput(ESC); // → level 1
	lines = p.render(80).map(strip);
	expect(lines[0]).toBe(HEADER);
	expect(lines[1].startsWith("> OpenRouter")).toBe(true);
	expect(lines.join("\n")).not.toContain("\u258C");
});

test("EV-27 11: selection through a filtered set emits the same tuple as the unfiltered path; echo byte-equal", () => {
	const unfiltered = picker(CATALOGUE);
	unfiltered.p.handleInput(ENTER);
	unfiltered.p.handleInput(ENTER);
	for (let i = 0; i < 5; i++) unfiltered.p.handleInput(DOWN); // alias:high
	unfiltered.p.handleInput(ENTER);
	const expected = unfiltered.p.resolveSelection();
	expect(expected).toEqual({ seat: "owner", model: "openrouter/alias/claude-sonnet", thinking: "high" });
	const echo = unfiltered.p.render(80).map(strip).find((l) => l.startsWith("Set "))!;
	expect(echo).toBe(echoFor(expected));

	const filtered = picker(CATALOGUE);
	filtered.p.handleInput(ENTER);
	filtered.p.handleInput(ENTER);
	filtered.p.handleInput("/");
	for (const ch of "claude") filtered.p.handleInput(ch);
	filtered.p.handleInput(DOWN); // alias:high
	filtered.p.handleInput(ENTER);
	expect(filtered.p.resolveSelection()).toEqual(expected);
	const filtEcho = filtered.p.render(80).map(strip).find((l) => l.startsWith("Set "))!;
	expect(filtEcho).toBe(echo);
	expect(filtEcho).toBe(echoFor(expected));
});

test("EV-27 12: B-7 round-trip preserves search state; fresh 1→2 re-entry resets it", () => {
	const { p } = picker(CATALOGUE);
	p.handleInput(ENTER);
	p.handleInput(ENTER);
	p.handleInput("/");
	for (const ch of "claude") p.handleInput(ch);
	p.handleInput(DOWN); // index 1, focus out
	p.handleInput(ENTER); // confirm — search state untouched
	expect(p.render(80).map(strip).join("\n")).not.toContain("\u258C"); // confirm never renders the search row
	p.handleInput(ESC); // back to level 2 — preserved
	let lines = p.render(80).map(strip);
	expect(lines[1]).toBe("▌ claude");
	expect(lines[2]).toBe("  openrouter/alias/claude-sonnet:off");
	expect(lines[3]).toBe("> openrouter/alias/claude-sonnet:high");
	expect(lines[lines.length - 1]).toBe(FOOTER_MODEL);
	p.handleInput(ESC); // focus out → level 1; search state dies with the level
	p.handleInput(ENTER); // fresh 1→2 re-entry — resets search state
	lines = p.render(80).map(strip);
	expect(lines[1]).toBe("> openrouter/deepseek/deepseek-v4-pro-0813:off");
	expect(lines.join("\n")).not.toContain("\u258C");
});

test("EV-27 13: ▌ renders only in search-mode model-level frames", () => {
	const { p } = picker(CATALOGUE);
	// non-search walk: seat, provider, model, confirm — no ▌ anywhere
	expect(p.render(80).join("\n")).not.toContain("\u258C");
	p.handleInput(ENTER);
	expect(p.render(80).join("\n")).not.toContain("\u258C");
	p.handleInput(ENTER);
	expect(p.render(80).join("\n")).not.toContain("\u258C");
	p.handleInput(ENTER);
	expect(p.render(80).join("\n")).not.toContain("\u258C");
	p.handleInput(ESC);
	p.handleInput(ESC);
	p.handleInput(ENTER); // back to the model level
	p.handleInput("/");
	expect(p.render(80).join("\n")).toContain("\u258C");
	p.handleInput(ESC); // cleared but still focused, level 2
	expect(p.render(80).join("\n")).toContain("\u258C");
	p.handleInput(DOWN);
	p.handleInput(ESC);
	expect(p.render(80).join("\n")).not.toContain("\u258C");
});

test("8.13 truncation: narrowed rows still end in :<level>; level never clipped", () => {
	const { p } = picker(CATALOGUE);
	p.handleInput(ENTER); // provider
	p.handleInput(ENTER); // model
	const rows = p
		.render(30)
		.map(strip)
		.filter((l) => l.startsWith("> ") || l.startsWith("  "))
		.map((l) => l.slice(2));
	expect(rows.length).toBe(6); // no row dropped by truncation
	expect(rows[0].endsWith(":off")).toBe(true);
	expect(rows[1].endsWith(":medium")).toBe(true);
	expect(rows[2].endsWith(":high")).toBe(true);
	expect(rows[3].endsWith(":off")).toBe(true);
	expect(rows[4].endsWith(":off")).toBe(true);
	expect(rows[5].endsWith(":high")).toBe(true);
	// and the long ds row actually truncated at width 30
	expect(rows[0].length).toBeLessThan("openrouter/deepseek/deepseek-v4-pro-0813:off".length);
	expect(rows[0].length).toBeLessThanOrEqual(30);
});

test("BUG-1 1: \x7f with a non-empty query and focus in the input deletes exactly one trailing char; the filtered list recomputes through filterModelRows; focus stays", () => {
	const { p } = picker(CATALOGUE);
	p.handleInput(ENTER); // provider
	p.handleInput(ENTER); // model
	p.handleInput("/");
	for (const ch of "claude") p.handleInput(ch);
	expect(strip(p.render(80)[1])).toBe("▌ claude");
	// one backspace → "claud"
	p.handleInput("\x7f");
	const lines = p.render(80).map(strip);
	expect(lines[1]).toBe("▌ claud");
	// the filtered list recomputed through the filterModelRows seam — the rendered
	// row list equals a direct filterModelRows call for the post-backspace query
	const expected = filterModelRows(rowsForProvider(CATALOGUE.providers[0]), "claud").map(
		(r) => r.model.qualifiedId + (r.level === undefined ? "" : `:${r.level}`),
	);
	const rendered = lines
		.filter((l) => l.startsWith("> ") || l.startsWith("  "))
		.map((l) => l.slice(2));
	expect(rendered).toEqual(expected);
	expect(lines[lines.length - 1]).toBe(FOOTER_MODEL);
	// focus stayed in the input: the next printable appends to the query
	p.handleInput("e"); // → "claude"
	expect(strip(p.render(80)[1])).toBe("▌ claude");
	// and Esc still means clear-and-stay (focused), never ascend
	p.handleInput(ESC);
	expect(strip(p.render(80)[1])).toBe(SEARCH_ROW_EMPTY);
});

test("BUG-1 3: \x7f on an empty query and \x7f while unfocused stay no-ops; other control bytes keep their behavior", () => {
	// empty query: backspace does nothing; search mode (and the empty hint) stays
	const empty = picker(CATALOGUE);
	empty.p.handleInput(ENTER);
	empty.p.handleInput(ENTER);
	empty.p.handleInput("/");
	empty.p.handleInput("\x7f");
	expect(strip(empty.p.render(80)[1])).toBe(SEARCH_ROW_EMPTY);
	// unfocused: Down takes focus out; backspace must not enter the input or touch the query
	const unfocused = picker(CATALOGUE);
	unfocused.p.handleInput(ENTER);
	unfocused.p.handleInput(ENTER);
	unfocused.p.handleInput("/");
	for (const ch of "claude") unfocused.p.handleInput(ch);
	unfocused.p.handleInput(DOWN); // cursor → row 1, focus out
	unfocused.p.handleInput("\x7f");
	let lines = unfocused.p.render(80).map(strip);
	expect(lines[1]).toBe("▌ claude"); // query untouched
	expect(lines[2]).toBe("  openrouter/alias/claude-sonnet:off"); // cursor still on row 1
	// the forward Delete key (\x1b[3~) is NOT backspace — stays a no-op
	unfocused.p.handleInput("\x1b[3~");
	lines = unfocused.p.render(80).map(strip);
	expect(lines[1]).toBe("▌ claude");
	// and per BUG-1 1's focus proof: an Esc while unfocused ascends (unchanged) —
	// backspace never granted focus
	unfocused.p.handleInput(ESC);
	expect(strip(unfocused.p.render(80)[1]).startsWith("> OpenRouter")).toBe(true);
});

test("BUG-1 2: before any `/` press, the first model-level render of a fresh picker shows the R-2 hint below the rows, above the byte-exact footer", () => {
	expect(PRE_SEARCH_HINT).toBe("press / to filter models"); // R-2 byte-exact literal
	const { p } = picker(CATALOGUE);
	p.handleInput(ENTER); // provider
	p.handleInput(ENTER); // model — first model-level render of a fresh picker
	const lines = p.render(80).map(strip);
	expect(lines[lines.length - 1]).toBe(FOOTER_MODEL); // ruled footer last, byte-exact (not a hint footer)
	expect(lines[lines.length - 2]).toBe(PRE_SEARCH_HINT); // hint directly below the rows
	expect(lines[1].startsWith("> ")).toBe(true); // rows still start right under the header
	expect(lines.join("\n")).not.toContain("\u258C"); // R-1: no ▌ focus signifier in non-search frames
	// persists across re-renders while search has never been opened
	expect(p.render(80).map(strip)).toContain(PRE_SEARCH_HINT);
});

test("BUG-1 4: R-3 dismissal — hint stops at the first `/` press, returns on the next fresh entry to the model level", () => {
	const { p } = picker(CATALOGUE);
	p.handleInput(ENTER);
	p.handleInput(ENTER);
	expect(p.render(80).map(strip)).toContain(PRE_SEARCH_HINT);
	p.handleInput("/"); // first `/` press — hint is gone
	expect(p.render(80).map(strip).join("\n")).not.toContain(PRE_SEARCH_HINT);
	p.handleInput(ESC); // clear, stay focused — hint does not return mid-entry
	expect(p.render(80).map(strip).join("\n")).not.toContain(PRE_SEARCH_HINT);
	p.handleInput(DOWN); // focus out
	p.handleInput(ESC); // ascend to provider — search state dies with the level
	p.handleInput(ENTER); // fresh 1→2 entry — hint returns (R-3)
	const lines = p.render(80).map(strip);
	expect(lines).toContain(PRE_SEARCH_HINT);
	expect(lines[lines.length - 1]).toBe(FOOTER_MODEL);
	// no session-scoped persistence: a brand-new picker starts with the hint armed
	const q = picker(CATALOGUE);
	q.p.handleInput(ENTER);
	q.p.handleInput(ENTER);
	expect(q.p.render(80).map(strip)).toContain(PRE_SEARCH_HINT);
});