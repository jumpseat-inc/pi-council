import { test, expect } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { widgetLines, jobLines } from "../extensions/index.ts";
import { CouncilTree, TranscriptView } from "../extensions/navigator.ts";
import { ensureRunDir, writeManifest, type RunManifest } from "../extensions/runs.ts";
import { loadPiThemeModule, materializeTheme } from "../extensions/theme-activation.ts";

// EV-4 §6: zero-ANSI compliance — council text surfaces (widget, /council-jobs,
// /council-init) are plain text with no ANSI and no literal hex (AGENTS.md 9.6),
// and the codebase stays hardcode-free (P3).

const NO_ANSI = /[\u001b]/;
const NO_HEX = /#[0-9a-fA-F]{3,8}/;

test("widget lines: plain text, zero ANSI, zero literal hex", () => {
	const lines = widgetLines([
		{ seat: "owner", startedAt: Date.now() - 65_000, events: ["planning", "writing"], state: "running" },
		{ seat: "skeptic", startedAt: Date.now() - 10_000, events: ["reading"], state: "running" },
		{ seat: "stall", startedAt: Date.now() - 30_000, events: ["x"], state: "timeout" },
	]);
	expect(lines.length).toBe(3);
	for (const l of lines) {
		expect(NO_ANSI.test(l)).toBe(false);
		expect(NO_HEX.test(l)).toBe(false);
	}
	// it is plain text, not colorized markup
	expect(lines.join("\n")).not.toMatch(/\[3[0-9]m|\[4[0-9]m/);
});

test("/council-jobs lines: plain text, zero ANSI, zero literal hex", () => {
	const lines = jobLines([
		{ id: "job-1", seat: "owner", state: "running", startedAt: Date.now() - 60_000, pid: 1234, events: ["planning", "writing"] },
		{ id: "job-2", seat: "skeptic", state: "running", startedAt: Date.now() - 10_000, pid: 5678, events: ["reading"] },
	]);
	for (const l of lines) {
		expect(NO_ANSI.test(l)).toBe(false);
		expect(NO_HEX.test(l)).toBe(false);
	}
});

test("no status-surface line: /council-jobs output carries no 'current theme' / palette text (RULING 2)", () => {
	const lines = jobLines([
		{ id: "job-1", seat: "owner", state: "running", startedAt: Date.now(), pid: 1, events: [] },
	]);
	expect(lines.join("\n")).not.toMatch(/theme/i);
});

// ---- §6.4: modal/viewer output consists only of the theme's own color ANSI ----

const ANSI_SEQ = /\u001b\[[0-9;]*m/g;

/** Every color-bearing ANSI (truecolor 38;2/48;2 and 256 38;5/48;5) found. */
function colorAnsi(lines: string[]): string[] {
	return (lines.join("\n").match(ANSI_SEQ) ?? []).filter((s) => /(?:3[89]|4[89]);/.test(s));
}

function manifest(id: string, over: Partial<RunManifest> = {}): RunManifest {
	return {
		id,
		seat: "owner",
		model: "m/x",
		parentJobId: id.includes(".") ? "job-1" : null,
		pid: null,
		sessionId: id,
		state: "running",
		startedAt: Date.now(),
		settledAt: null,
		exitCode: null,
		...over,
	};
}

test("CouncilTree output uses only the theme's own fg/bg ANSI (P9 no-foreign-ANSI)", async () => {
	const mod = await loadPiThemeModule();
	const theme = await materializeTheme({ variant: "dark" }, "dark", "truecolor");
	const allowed = new Set<string>();
	for (const tok of (theme as unknown as { fgColors: Map<string, unknown> }).fgColors.keys()) allowed.add(theme.getFgAnsi(tok as never));
	for (const tok of (theme as unknown as { bgColors: Map<string, unknown> }).bgColors.keys()) allowed.add(theme.getBgAnsi(tok as never));

	const root = fs.mkdtempSync(path.join(os.tmpdir(), "ev4-comply-"));
	ensureRunDir(root, "runC");
	writeManifest(root, "runC", manifest("job-1"));
	const tree = new CouncilTree(root, "runC", theme as never, () => {}, () => {});
	const lines = tree.render(100);

	expect(colorAnsi(lines).length).toBeGreaterThan(0); // the accent cursor is present
	for (const c of colorAnsi(lines)) expect(allowed.has(c)).toBe(true);
});

test("TranscriptView output uses only the theme's own fg/bg ANSI (P5)", async () => {
	const mod = await loadPiThemeModule();
	const theme = await materializeTheme({ variant: "dark" }, "dark", "truecolor");
	const allowed = new Set<string>();
	for (const tok of (theme as unknown as { fgColors: Map<string, unknown> }).fgColors.keys()) allowed.add(theme.getFgAnsi(tok as never));
	for (const tok of (theme as unknown as { bgColors: Map<string, unknown> }).bgColors.keys()) allowed.add(theme.getBgAnsi(tok as never));

	const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "ev4-comply2-")), "s.jsonl");
	const user = `{"type":"message","id":"1","parentId":null,"timestamp":"t","message":{"role":"user","content":[{"type":"text","text":"hello"}]}}`;
	fs.writeFileSync(file, `{"type":"session","version":3,"id":"job-1","timestamp":"t","cwd":"/x"}\n${user}\n`);
	const view = new TranscriptView(file, theme as never, "job-1 owner", 24, () => {});
	const lines = view.render(80);
	expect(colorAnsi(lines).length).toBeGreaterThan(0);
	for (const c of colorAnsi(lines)) expect(allowed.has(c)).toBe(true);
	view.dispose();
});

// ---- §6.5: grep-audit as a unit test (P3) ----

function stripComments(src: string): string {
	// drop block comments
	let out = src.replace(/\/\*[\s\S]*?\*\//g, "");
	// drop the marked [ev4-palette-table] region (converter data, not drawing color)
	out = out.replace(/\/\/ \[ev4-palette-table\][\s\S]*?\/\/ \[ev4-palette-table\]/g, "");
	// drop line comments (only after block + palette strips; `//` inside strings
	// is vanishingly unlikely in this codebase and would need a real lexer otherwise)
	out = out.replace(/\/\/[^\n]*/g, "");
	return out;
}

test("grep-audit: extensions/*.ts has no ANSI escape and no literal #hex outside the whitelisted palette table", () => {
	const dir = path.resolve(import.meta.dir, "..", "extensions");
	const files = fs.readdirSync(dir).filter((f) => f.endsWith(".ts"));
	expect(files.length).toBeGreaterThan(0);
	let checked = 0;
	for (const f of files) {
		// drill into src for the mcp/ subdir only if present (it has no theme literals)
		const file = path.join(dir, f);
		if (!fs.statSync(file).isFile()) continue;
		checked++;
		const code = stripComments(fs.readFileSync(file, "utf-8"));
		expect(code, `no \\x1b in ${f}`).not.toMatch(/\u001b/);
		expect(code, `no #hex in ${f}`).not.toMatch(/#[0-9a-fA-F]{3,8}/);
	}
	expect(checked).toBeGreaterThan(0);
});
