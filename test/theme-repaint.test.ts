import { test, expect } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { CouncilTree, TranscriptView } from "../extensions/navigator.ts";
import { ensureRunDir, writeManifest, type RunManifest } from "../extensions/runs.ts";
import { loadPiThemeModule, materializeTheme } from "../extensions/theme-activation.ts";

// EV-4 §5: the LIVE-REPAINT PINNING test. The contract that an open council
// modal repaints against the live theme Proxy when pi swaps the instance
// mid-session — WITHOUT re-opening or re-constructing the overlay. If this is
// green, NO repaint code ships (the seam already works). Rendering drives the
// real pi `theme` Proxy (read at call time from the module global), and
// setThemeInstance swaps that global exactly as pi's TUI does.

const ACCENT_A = "\x1b[38;2;254;188;56m"; // shipped dark accent #febc38
const ACCENT_B = "\x1b[38;2;255;0;0m"; // repo override accent #ff0000

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

/** A tree with one selected row so its accent cursor line appears in output. */
function buildTree(root: string, theme: unknown) {
	ensureRunDir(root, "runR");
	writeManifest(root, "runR", manifest("job-1"));
	return new CouncilTree(root, "runR", theme as never, () => {}, () => {});
}

test("positive: same overlay re-renders B's accent after setThemeInstance + invalidate (no re-open)", async () => {
	const mod = await loadPiThemeModule();
	const A = await materializeTheme({ variant: "dark" }, "dark", "truecolor");
	const B = await materializeTheme(
		{ variant: "dark", dark: { colors: { accent: "#ff0000" } } },
		"dark",
		"truecolor",
	);
	mod.setThemeInstance(A); // pi's TUI swap — global now A

	const root = fs.mkdtempSync(path.join(os.tmpdir(), "ev4-repaint-"));
	const tree = buildTree(root, mod.theme); // the SAME live Proxy, never rebuilt

	const linesA = tree.render(100);
	const joinedA = linesA.join("\n");
	expect(joinedA).toContain(ACCENT_A); // A's accent ANSI is in the cached output

	mod.setThemeInstance(B); // swap the global; same proxy object
	tree.invalidate(); // exactly what pi's TUI.invalidate() does to the overlay
	const linesB = tree.render(100); // render the SAME overlay again
	const joinedB = linesB.join("\n");
	expect(joinedB).toContain(ACCENT_B); // carries B's exact accent bytes
	expect(joinedB).not.toContain(ACCENT_A);
});

test("negative: WITHOUT invalidate the width-cache still carries A's ANSI (isolates the seam)", async () => {
	const mod = await loadPiThemeModule();
	const A = await materializeTheme({ variant: "dark" }, "dark", "truecolor");
	const B = await materializeTheme(
		{ variant: "dark", dark: { colors: { accent: "#ff0000" } } },
		"dark",
		"truecolor",
	);
	mod.setThemeInstance(A);

	const root = fs.mkdtempSync(path.join(os.tmpdir(), "ev4-repaint2-"));
	const tree = buildTree(root, mod.theme);
	const joinedA = tree.render(100).join("\n");
	expect(joinedA).toContain(ACCENT_A);

	mod.setThemeInstance(B);
	// NO invalidate() — the width cache is the only stale state
	const joinedCached = tree.render(100).join("\n");
	expect(joinedCached).toContain(ACCENT_A); // still A: cached
	expect(joinedCached).not.toContain(ACCENT_B);

	tree.invalidate();
	expect(tree.render(100).join("\n")).toContain(ACCENT_B); // after invalidate it repaints
});

test("proxy-trace: the factory receives the live Proxy — accent resolves per-call, not captured at open", async () => {
	const mod = await loadPiThemeModule();
	const A = await materializeTheme({ variant: "dark" }, "dark", "truecolor");
	const B = await materializeTheme(
		{ variant: "dark", dark: { colors: { accent: "#ff0000" } } },
		"dark",
		"truecolor",
	);
	mod.setThemeInstance(A);
	// "captured at open" is false at the value level: the SAME proxy reads B
	// after the swap, because property access reaches the module global at
	// call time.
	expect((mod.theme.getFgAnsi as (t: string) => string)("accent")).toBe(ACCENT_A);
	mod.setThemeInstance(B);
	expect((mod.theme.getFgAnsi as (t: string) => string)("accent")).toBe(ACCENT_B);
});

test("transcript re-paint: TranscriptView re-renders fresh each render (P5) — B appears with no invalidate", async () => {
	const mod = await loadPiThemeModule();
	const A = await materializeTheme({ variant: "dark" }, "dark", "truecolor");
	const B = await materializeTheme(
		{ variant: "dark", dark: { colors: { accent: "#ff0000" } } },
		"dark",
		"truecolor",
	);
	mod.setThemeInstance(A);

	const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "ev4-repaint3-")), "s.jsonl");
	const user = `{"type":"message","id":"1","parentId":null,"timestamp":"t","message":{"role":"user","content":[{"type":"text","text":"hello"}]}}`;
	fs.writeFileSync(
		file,
		`{"type":"session","version":3,"id":"job-1","timestamp":"t","cwd":"/x"}\n${user}\n`,
	);
	const view = new TranscriptView(file, mod.theme as never, "job-1 owner", 24, () => {});
	const joinedA = view.render(80).join("\n");
	expect(joinedA).toContain(ACCENT_A); // user header uses accent

	mod.setThemeInstance(B);
	// TranscriptView has NO cache — re-render reflects B immediately (P5)
	expect(view.render(80).join("\n")).toContain(ACCENT_B);
	view.dispose();
});
