# EV-25 — Register /council-models and wire picker to writer — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Register the `/council-models` TypeScript command: TUI sessions open EV-23's modal over EV-22's resolved catalogue (single snapshot), headless sessions print R-2's usage block + per-seat current listing, and both surfaces write through EV-24's `writeSeatOverride` then notify R-3's byte-exact copy derived from a post-write file read-back.

**Architecture:** One new pure+coordination module `extensions/council-models.ts` (listing builder, notify builder, post-write read-back wiring, headless grammar runner, TUI modal opener) + a thin registration in `extensions/index.ts` doing one `refresh()`/`getAvailable()` snapshot and branching TUI→modal / headless→console. The snapshot array is handed to both `resolveCatalogue` and `writeSeatOverride`'s `catalogue` gate. The modal (EV-23) and the writer (EV-24) are landed and untouched; FLLWUP-10's writer seam is NOT fixed here.

**Tech Stack:** TypeScript strict (`bunx tsc --noEmit`), bun:test, `ctx.modelRegistry` (pi `ModelRegistry`: `refresh()`, `getAvailable()`, `getProviderDisplayName()`), `ctx.ui.custom` overlay pattern from navigator.ts, pi-tui `Component`.

**Spec:** The card `council/cards/EV-25.md` (Phase 1 rulings R-1..R-3, binding, immutable) + EV-23 design spec §9/§10 (`docs/superpowers/specs/2026-09-04-EV-23-design.md`) — inherited obligations 1–4. No new design deliberation: this is the mechanical path.

## Global Constraints

- **R-1 (headless grammar)**: `/council-models` no-args → usage block + full per-seat listing; `/council-models <seat>` → that seat's current line + usage line; `/council-models <seat> <provider>/<model>[:thinking]` → validate + write + notify.
- **R-2 (usage block)**: first line byte-exact `[council-models] usage: /council-models [<seat> [<provider>/<model>[:thinking]]]`, then blank, then `Current per-seat models:`, then one line per seat: `<seat>: <provider>/<model>[:thinking] (override)` when an override key exists, else `<seat>: frontmatter default`.
- **R-3 (notify copy, byte-exact in either surface after a SUCCESSFUL write)**: `council-models: wrote <seat> → <provider>/<model>[:thinking] in .council.json — takes effect at the next dispatch.` — the `[:thinking]` suffix present only when the effective post-write seat carries a thinking level.
- **Single snapshot (EV-23 §10/1)**: one `await ctx.modelRegistry.refresh()` then one `ctx.modelRegistry.getAvailable()` per invocation; the SAME flat array feeds `resolveCatalogue` AND `writeSeatOverride.catalogue`. The modal never triggers a second refresh.
- **Post-write notify = file read-back (EV-23 §10/2)**: after `writeSeatOverride` returns `{ok:true}`, the notified `<provider>/<model>[:thinking]` derives from `loadSeat(repoRoot, seat)` — the loader's own post-write resolution — never the selection tuple. A selection without `thinking` may still yield a suffix (writer merge preserves), and under the object-`:suffix` seam (FLLWUP-10, not fixed here) the notify names only what is on disk.
- **`picker.invalidate()` on theme change (EV-23 §10/3)**: the `ctx.ui.custom` factory's `invalidate` calls `picker.invalidate()`.
- **Tests mock the modal at its selection-encoding contract** (`SeatModelSelection | null`), per EV-23 §10/4.
- **Theme compliance (AGENTS.md 9.6)**: new source emits plain text for headless lines and R-2/R-3 copies; no `\x1b`, no `#[hex]` in `extensions/council-models.ts` (post-comment-strip) — the repo-wide grep-audit in `test/theme-compliance.test.ts` auto-covers it.
- **No FLLWUP-10 fix, no FLLWUP-9 clear-thinking affordance** (`thinking: undefined` preserves), **no mid-session reload**; the modal + writer modules are landed — only wire to them.
- Convenience: `listSeatNames`/`loadSeat`/`loadCouncilConfig`/`COUNCIL_CONFIG_FILE` from `extensions/seats.ts`; no hardcoded `.pi` (`CONFIG_DIR_NAME`); no hardcoded `.council.json` literal outside `COUNCIL_CONFIG_FILE`.

---

### Task 1: Failing test suite — `test/council-models.test.ts`

**Files:**
- Create: `test/council-models.test.ts`

**Interfaces:**
- Consumes (nothing yet — the missing module import IS the RED): the planned exports of `../extensions/council-models.ts` — `applySeatSelection(repoRoot, models, sel|null, write?) → WriteOutcome`, `buildProviderDisplayNames(registry, models)`, `modelsListingLines(seats, only?)`, `modelsNotifyLine(seatName, effective)`, `openModelPicker(ctx, resolved)`, `runHeadless(args, repoRoot, models, displayNames, emit)`, constants `USAGE_LINE`, `LISTING_HEADER`, type `WriteOutcome = { notified: string | null; error: string | null }`.
- Also consumes landed exports: `resolveCatalogue` + type `CatalogueModel` from `../extensions/catalogue.ts`; `loadCouncilConfig`/`loadSeat`/`listSeatNames`/`COUNCIL_CONFIG_FILE` from `../extensions/seats.ts`; type `SeatModelSelection` from `../extensions/model-picker.ts`; type `WriteSeatOverrideResult` from `../extensions/council-config-writer.ts`; `CONFIG_DIR_NAME` from `@earendil-works/pi-coding-agent`.

- [ ] **Step 1: Write the test file** — exact content below:

```ts
import { test, expect } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { CONFIG_DIR_NAME } from "@earendil-works/pi-coding-agent";
import { resolveCatalogue, type CatalogueModel } from "../extensions/catalogue.ts";
import { COUNCIL_CONFIG_FILE, loadCouncilConfig, loadSeat, listSeatNames } from "../extensions/seats.ts";
import {
	USAGE_LINE,
	LISTING_HEADER,
	applySeatSelection,
	buildProviderDisplayNames,
	modelsNotifyLine,
	runHeadless,
} from "../extensions/council-models.ts";
import type { SeatModelSelection } from "../extensions/model-picker.ts";
import type { WriteSeatOverrideResult } from "../extensions/council-config-writer.ts";

const NO_ANSI = /[\u001b]/;
const NO_HEX = /#[0-9a-fA-F]{3,8}/;

/** Fake registry snapshot — structurally assignable to getAvailable() output. */
const MODELS: CatalogueModel[] = [
	{
		provider: "openrouter",
		id: "deepseek/deepseek-v4-flash-0731",
		name: "DeepSeek V4 Flash (0731)",
		reasoning: true,
		thinkingLevelMap: { off: "off", high: "high" },
	},
	{ provider: "openrouter", id: "qwen/qwen3.6-35b-a3b", name: "Qwen 3.6 35B A3B", reasoning: true, thinkingLevelMap: { low: "low" } },
	{ provider: "xai", id: "grok/v1", name: "Grok V1", reasoning: false },
];
const DISPLAY = { openrouter: "OpenRouter", xai: "xAI" };

const FLASH = "openrouter/deepseek/deepseek-v4-flash-0731";
const QWEN = "openrouter/qwen/qwen3.6-35b-a3b";

function makeRepo(files: Record<string, string> = {}): string {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ev25-models-"));
	for (const [rel, content] of Object.entries(files)) {
		const p = path.join(dir, rel);
		fs.mkdirSync(path.dirname(p), { recursive: true });
		fs.writeFileSync(p, content);
	}
	return dir;
}

/** A repo-local seat shadowing the packaged one with knowable frontmatter. */
function seatFile(name: string, model: string): string {
	return ["---", `name: ${name}`, "description: test seat", `model: ${model}`, "---", "body", ""].join("\n");
}

/** Run the headless grammar, returning the exact emitted text. */
function run(args: string, repo: string): string {
	const out: string[] = [];
	runHeadless(args, repo, MODELS, DISPLAY, (line) => out.push(line));
	return out.join("\n");
}

function cfg(repo: string): string {
	return fs.readFileSync(path.join(repo, COUNCIL_CONFIG_FILE), "utf-8");
}

// ---- headless handler-write path (acceptance 1) ----

test("H1: no args → R-2 usage block + full per-seat listing (all frontmatter-default lines)", () => {
	const repo = makeRepo();
	const text = run("", repo);
	const lines = text.split("\n");
	expect(lines.slice(0, 3)).toEqual([USAGE_LINE, "", LISTING_HEADER]);
	for (const l of lines.slice(3)) {
		expect(l).toMatch(/^[a-z0-9-]+: frontmatter default$/);
	}
	expect(lines.length - 3).toBe(listSeatNames(repo).length);
	expect(text).toContain("owner: frontmatter default");
});

test("H1b: override seats render `<seat>: <model>[:thinking] (override)` byte-exact", () => {
	const repo = makeRepo({
		[COUNCIL_CONFIG_FILE]: JSON.stringify({
			council: { owner: { model: FLASH, thinking: "high" }, skeptic: FLASH },
		}),
	});
	const text = run("", repo);
	expect(text).toContain("owner: openrouter/deepseek/deepseek-v4-flash-0731:high (override)");
	expect(text).toContain("skeptic: openrouter/deepseek/deepseek-v4-flash-0731 (override)");
	expect(text).toContain("consolidator: frontmatter default");
});

test("H2: <seat> → that seat's current line plus the usage line", () => {
	const repo = makeRepo({
		[COUNCIL_CONFIG_FILE]: JSON.stringify({ council: { owner: { model: FLASH, thinking: "low" } } }),
	});
	const text = run("owner", repo);
	expect(text).toBe([USAGE_LINE, "", LISTING_HEADER, "owner: openrouter/deepseek/deepseek-v4-flash-0731:low (override)"].join("\n"));
});

test("H3: <seat> <provider>/<model>[:thinking] → validates, writes, R-3 notify byte-exact", () => {
	const repo = makeRepo();
	const text = run(`owner ${FLASH}:high`, repo);
	expect(text).toBe(
		"council-models: wrote owner → openrouter/deepseek/deepseek-v4-flash-0731:high in .council.json — takes effect at the next dispatch.",
	);
	expect(JSON.parse(cfg(repo)).council.owner).toEqual({ model: FLASH, thinking: "high" });
});

test("H3b: a level-less write notifies without a :suffix and writes no thinking key", () => {
	const repo = makeRepo();
	const text = run(`owner ${FLASH}`, repo);
	expect(text).toBe(
		"council-models: wrote owner → openrouter/deepseek/deepseek-v4-flash-0731 in .council.json — takes effect at the next dispatch.",
	);
	expect(JSON.parse(cfg(repo)).council.owner).toEqual({ model: FLASH });
});

test("H4: unknown seat → error, nothing written (write form and listing form)", () => {
	const repo = makeRepo();
	const text = run(`nosuch ${FLASH}`, repo);
	expect(text).toContain("[council-models] error:");
	expect(text).toContain('Unknown seat "nosuch"');
	expect(fs.existsSync(path.join(repo, COUNCIL_CONFIG_FILE))).toBe(false);
	expect(run("nosuch", repo)).toContain("[council-models] error:");
});

test("H5: model not in the catalogue → error, nothing written", () => {
	const repo = makeRepo();
	const text = run(`owner openrouter/nope/never`, repo);
	expect(text).toContain("[council-models] error:");
	expect(text).toContain("not in the available model catalogue");
	expect(fs.existsSync(path.join(repo, COUNCIL_CONFIG_FILE))).toBe(false);
});

test("H6: unqualified model → error, nothing written", () => {
	const repo = makeRepo();
	const text = run("owner just-a-model", repo);
	expect(text).toContain("[council-models] error:");
	expect(text).toContain("must be qualified as provider/id");
	expect(fs.existsSync(path.join(repo, COUNCIL_CONFIG_FILE))).toBe(false);
});

test("H7: more than two args → error, nothing written", () => {
	const repo = makeRepo();
	const text = run(`owner ${FLASH} extra`, repo);
	expect(text).toContain("[council-models] error:");
	expect(text).toContain("unexpected arguments");
	expect(fs.existsSync(path.join(repo, COUNCIL_CONFIG_FILE))).toBe(false);
});

test("display names: buildProviderDisplayNames maps each provider through the registry once", () => {
	const seen: string[] = [];
	const names = buildProviderDisplayNames(
		{ getProviderDisplayName: (p) => (seen.push(p), p.toUpperCase()) },
		MODELS,
	);
	expect(names).toEqual({ openrouter: "OPENROUTER", xai: "XAI" });
	expect(seen).toEqual(["openrouter", "xai"]);
});

// ---- modal-picker-to-writer wiring path, modal mocked at its contract (acceptance 2) ----

test("W1: non-null selection → writeSeatOverride exactly once with the SAME snapshot array feeding resolveCatalogue", () => {
	const repo = makeRepo();
	const rawSeats = listSeatNames(repo).map((n) => loadSeat(repo, n));
	const resolved = resolveCatalogue(MODELS, DISPLAY, rawSeats, loadCouncilConfig(repo));
	const listed = resolved.providers.flatMap((g) => g.models).map((m) => m.qualifiedId);
	const sel: SeatModelSelection = { seat: "owner", model: FLASH };

	const calls: Array<Parameters<typeof writeSeatOverride>[0]> = [];
	const spy: typeof writeSeatOverride = (a) => {
		calls.push(a);
		return { ok: true };
	};
	const out = applySeatSelection(repo, MODELS, sel, spy);
	expect(calls).toHaveLength(1);
	expect(calls[0].catalogue).toBe(MODELS); // SAME array reference — listing guarantees writability
	expect(calls[0].seat).toBe("owner");
	expect(calls[0].model).toBe(FLASH);
	expect(calls[0].thinking).toBeUndefined();
	expect(listed).toContain(FLASH); // the pick is in the SAME snapshot the modal listed
	// spy wrote nothing: the notify still derives from the on-disk read-back, whatever it is
	expect(out.notified).toBe(modelsNotifyLine("owner", loadSeat(repo, "owner")));
});

test("W2: notify derives from the POST-WRITE file read-back — a level-less pick over a preserved-thinking override names the preserved level", () => {
	const repo = makeRepo({
		[COUNCIL_CONFIG_FILE]: JSON.stringify({ council: { owner: { model: QWEN, thinking: "low" } } }),
	});
	const out = applySeatSelection(repo, MODELS, { seat: "owner", model: FLASH });
	expect(out.error).toBeNull();
	// the selection carried no thinking, but the merged file keeps low — the notify names what is on disk
	expect(out.notified).toBe(
		"council-models: wrote owner → openrouter/deepseek/deepseek-v4-flash-0731:low in .council.json — takes effect at the next dispatch.",
	);
	expect(JSON.parse(cfg(repo)).council.owner).toEqual({ model: FLASH, thinking: "low" });
});

test("W3: object-form :suffix override — the notify names only what the post-write file actually carries (seam-honest)", () => {
	// FLLWUP-10 seam (NOT fixed in this card): an object-form model carrying a
	// :suffix with no thinking key drops the level on a level-less write. The
	// notify must track the on-disk truth, never the pre-write level.
	const repo = makeRepo({
		[path.join(CONFIG_DIR_NAME, "agents", "owner.md")]: seatFile("owner", "openrouter/base/x"),
		[COUNCIL_CONFIG_FILE]: JSON.stringify({ council: { owner: { model: `${QWEN}:low` } } }),
	});
	const out = applySeatSelection(repo, MODELS, { seat: "owner", model: FLASH });
	expect(out.error).toBeNull();
	expect(out.notified).toBe(modelsNotifyLine("owner", loadSeat(repo, "owner")));
	expect(out.notified).not.toContain(":low"); // the dropped level is never claimed
	expect(JSON.parse(cfg(repo)).council.owner).toEqual({ model: FLASH }); // on-disk truth
});

test("W4: null selection → no write, no notify, no error", () => {
	const repo = makeRepo();
	let called = 0;
	const out = applySeatSelection(repo, MODELS, null, () => {
		called++;
		return { ok: true };
	});
	expect(called).toBe(0);
	expect(out).toEqual({ notified: null, error: null });
});

// ---- registration / source assertions (acceptance 3) ----

test("registration: index.ts registers /council-models wired to the pure module (house pattern)", () => {
	const src = fs.readFileSync(path.join(import.meta.dir, "..", "extensions", "index.ts"), "utf-8");
	expect(src).toContain('pi.registerCommand("council-models"');
	expect(src).toMatch(/modelRegistry\.getAvailable\(\)/); // single snapshot in the handler
	expect(src).toMatch(/modelRegistry\.refresh\(\)/);
	expect(src).toMatch(/openModelPicker\(/);
	expect(src).toMatch(/runHeadless\(/);
	expect(src).toMatch(/applySeatSelection\(/);
	const idx = src.indexOf('pi.registerCommand("council-models"');
	const next = src.indexOf("pi.registerCommand", idx + 10);
	const block = src.slice(idx, next === -1 ? src.length : next);
	expect(block).toMatch(/getAvailable\(\)/); // the snapshot sits in the handler's own block
});

test("source audit: council-models.ts emits plain text — no ANSI, no literal #hex (9.6)", () => {
	const src = fs.readFileSync(path.join(import.meta.dir, "..", "extensions", "council-models.ts"), "utf-8");
	const code = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
	expect(code).not.toMatch(NO_ANSI);
	expect(code).not.toMatch(NO_HEX);
	const notify = modelsNotifyLine("owner", { model: "openrouter/a/b", thinkingLevel: "high" });
	expect(USAGE_LINE).not.toMatch(NO_ANSI);
	expect(notify).not.toMatch(NO_ANSI);
	expect(notify).not.toMatch(NO_HEX);
});
```

- [ ] **Step 2: Run it to verify it fails (module does not exist yet)**

Run: `bun test test/council-models.test.ts`
Expected: FAIL — `Cannot find module ../extensions/council-models.ts` and/or `writeSeatOverride` not defined (the W1 spy references it via `typeof`).

- [ ] **Step 3: Commit the failing test**

```bash
git add test/council-models.test.ts
git commit -m "test(council-models): failing EV-25 headless + wiring acceptance suite"
```

(If the module import fails at load time, still commit the test file so the next task has a red baseline to flip.)

---

### Task 2: `extensions/council-models.ts` — listing, notify, wiring, headless grammar, TUI opener

**Files:**
- Create: `extensions/council-models.ts`

**Interfaces:**
- Consumes: `SeatState`/`ResolverResult`/`CatalogueModel` + `resolveCatalogue` from `./catalogue.ts`; `loadCouncilConfig`/`listSeatNames`/`loadSeat`/`COUNCIL_CONFIG_FILE` + type `Seat` from `./seats.ts`; `writeSeatOverride` + type `WriteSeatOverrideResult` from `./council-config-writer.ts`; `ModelPicker` + type `SeatModelSelection` from `./model-picker.ts`; `withModalFrame` + type `NavTheme` from `./navigator.ts`; type `ExtensionContext` from `@earendil-works/pi-coding-agent`.
- Produces: everything Task 1 imports, plus `openModelPicker(ctx, resolved) → Promise<SeatModelSelection | null>` for the index.ts handler.

- [ ] **Step 1: Write the module** — exact content below:

```ts
import type { ExtensionContext } from "@earendil-works/pi-coding-agent";
import type { CatalogueModel, ResolverResult, SeatState } from "./catalogue.ts";
import { resolveCatalogue } from "./catalogue.ts";
import { writeSeatOverride, type WriteSeatOverrideResult } from "./council-config-writer.ts";
import { ModelPicker, type SeatModelSelection } from "./model-picker.ts";
import { withModalFrame, type NavTheme } from "./navigator.ts";
import { COUNCIL_CONFIG_FILE, listSeatNames, loadCouncilConfig, loadSeat, type Seat } from "./seats.ts";

// ---- R-2 ruled copy — byte-exact, binding ----

export const USAGE_LINE = "[council-models] usage: /council-models [<seat> [<provider>/<model>[:thinking]]]";
export const LISTING_HEADER = "Current per-seat models:";

/** R-2 block: usage line, blank, header, then one line per seat — an override
 *  seat renders `<seat>: <model>[:thinking] (override)` (key presence), else
 *  `<seat>: frontmatter default`. `only` scopes to one seat (R-1 <seat> form):
 *  that seat's current line plus the usage line. Pure. */
export function modelsListingLines(seats: SeatState[], only?: string): string[] {
	const lines = [USAGE_LINE, "", LISTING_HEADER];
	const scope = only !== undefined ? seats.filter((s) => s.name === only) : seats;
	for (const s of scope) {
		if (s.hasOverride) {
			const suffix = s.currentThinking !== undefined ? `:${s.currentThinking}` : "";
			lines.push(`${s.name}: ${s.currentModel}${suffix} (override)`);
		} else {
			lines.push(`${s.name}: frontmatter default`);
		}
	}
	return lines;
}

/** R-3 notify copy — byte-exact in either surface after a SUCCESSFUL write.
 *  The `[:thinking]` suffix is present only when the effective (post-write)
 *  seat carries a thinking level. Pure. */
export function modelsNotifyLine(seatName: string, effective: Pick<Seat, "model" | "thinkingLevel">): string {
	const suffix = effective.thinkingLevel !== undefined ? `:${effective.thinkingLevel}` : "";
	return `council-models: wrote ${seatName} → ${effective.model}${suffix} in ${COUNCIL_CONFIG_FILE} — takes effect at the next dispatch.`;
}

export interface WriteOutcome {
	notified: string | null; // R-3 line when the write succeeded (post-write read-back)
	error: string | null; // writer error copy when validation failed (nothing written)
}

/**
 * The modal-to-writer wiring (EV-23 §10): given the picker's selection — or
 * null when the user closed the modal — writes through writeSeatOverride and
 * derives the notify copy from a POST-WRITE read of the file
 * (`loadSeat` = the loader's own resolution), never from the selection tuple.
 * The `catalogue` arg is the SAME snapshot array that built the modal's
 * listing; the writer validates the pick against it. `write` is injectable so
 * the wiring test can count calls and pin the array reference.
 */
export function applySeatSelection(
	repoRoot: string,
	models: CatalogueModel[],
	sel: SeatModelSelection | null,
	write: typeof writeSeatOverride = writeSeatOverride,
): WriteOutcome {
	if (sel === null) return { notified: null, error: null };
	const res = write({ repoRoot, seat: sel.seat, model: sel.model, thinking: sel.thinking, catalogue: models });
	if (!res.ok) return { notified: null, error: res.error };
	const effective = loadSeat(repoRoot, sel.seat);
	return { notified: modelsNotifyLine(sel.seat, effective), error: null };
}

/** Unique provider ids → pi's display names (render copy; never a write key). */
export function buildProviderDisplayNames(
	registry: { getProviderDisplayName(provider: string): string },
	models: CatalogueModel[],
): Record<string, string> {
	const out: Record<string, string> = {};
	for (const m of models) {
		if (!(m.provider in out)) out[m.provider] = registry.getProviderDisplayName(m.provider);
	}
	return out;
}

/**
 * The headless grammar (R-1), driven by the handler for print/json/rpc
 * sessions. `models`/`displayNames` are the handler's single snapshot — this
 * never refreshes, never re-reads the registry. Unknown seat, invalid or
 * unqualified model, or extra args emit `[council-models] error: ...` and
 * write NOTHING (the error path is caught here, mirroring the handler's own
 * catch).
 */
export function runHeadless(
	args: string,
	repoRoot: string,
	models: CatalogueModel[],
	displayNames: Record<string, string>,
	emit: (line: string) => void,
): void {
	const tokens = args.trim() ? args.trim().split(/\s+/) : [];
	try {
		const rawSeats = listSeatNames(repoRoot).map((n) => loadSeat(repoRoot, n));
		const resolved = resolveCatalogue(models, displayNames, rawSeats, loadCouncilConfig(repoRoot));

		if (tokens.length === 0) {
			emit(modelsListingLines(resolved.seats).join("\n"));
			return;
		}
		const seatName = tokens[0]!;
		loadSeat(repoRoot, seatName); // throws "Unknown seat" — validation before any write
		if (tokens.length === 1) {
			emit(modelsListingLines(resolved.seats, seatName).join("\n"));
			return;
		}
		if (tokens.length > 2) {
			throw new Error(`unexpected arguments after <provider>/<model>: ${JSON.stringify(tokens.slice(2).join(" "))}`);
		}
		const out = applySeatSelection(repoRoot, models, { seat: seatName, model: tokens[1]! });
		if (out.notified !== null) emit(out.notified);
		else if (out.error !== null) throw new Error(out.error);
		else throw new Error("applySeatSelection returned neither notified nor error");
	} catch (e) {
		emit(`[council-models] error: ${e instanceof Error ? e.message : String(e)}`);
	}
}

/**
 * The TUI surface: EV-23's ModelPicker opened as a full-screen overlay via
 * ctx.ui.custom — the openTranscript pattern. The modal is pure (zero I/O);
 * the write happens after this promise resolves with the selection (or null
 * on close). The custom factory's `invalidate` forwards to
 * `picker.invalidate()` — the theme-repaint seam (EV-23 §10/3).
 */
export function openModelPicker(
	ctx: Pick<ExtensionContext, "ui">,
	resolved: ResolverResult,
): Promise<SeatModelSelection | null> {
	return ctx.ui.custom<SeatModelSelection | null>(
		(tui: any, theme: NavTheme, _kb: unknown, done: (sel: SeatModelSelection | null) => void) => {
			const termRows = Math.max(10, tui?.terminal?.rows ?? 24);
			const picker = new ModelPicker(
				resolved,
				theme,
				(sel) => done(sel), // confirm → single emission
				() => done(null), // esc at seat level → cancel
				{ maxRows: termRows - 2 },
			);
			return {
				render: (w: number) =>
					withModalFrame(theme, w, termRows, picker.render(Math.min(96, Math.max(1, w - 8))), {
						maxPanelHeight: termRows - 2,
					}),
				invalidate: () => picker.invalidate(),
				handleInput: (d: string) => {
					picker.handleInput(d);
					tui?.requestRender?.();
				},
			};
		},
		{ overlay: true, overlayOptions: { width: "100%", maxHeight: "100%", margin: 0, anchor: "top-left" } },
	);
}
```

- [ ] **Step 2: Run the suite to verify the red baseline flips green**

Run: `bun test test/council-models.test.ts`
Expected: PASS (all tests in the file; the W1 `typeof writeSeatOverride` import now resolves too — note Task 1's file also needs `writeSeatOverride` VALUE-imported for the spy to typecheck; see Task 1 file — the spy uses `typeof writeSeatOverride` with no value import, which FAILS typecheck of the TEST. Fix: add `import { writeSeatOverride, type WriteSeatOverrideResult } from "../extensions/council-config-writer.ts";` — `typeof writeSeatOverride` is fine at type level only if the name is imported. The REPO's typecheck gate (`bunx tsc --noEmit`) covers test/ — so amend Task 1's file with that import before this step.)

- [ ] **Step 3: Commit**

```bash
git add extensions/council-models.ts test/council-models.test.ts
git commit -m "feat(council-models): headless grammar, read-back notify, and picker wiring (EV-25)"
```

---

### Task 3: Register `/council-models` in `extensions/index.ts`

**Files:**
- Modify: `extensions/index.ts` — add the imports and the registration after `council-leaderboard`.

**Interfaces:**
- Consumes: `applySeatSelection`, `buildProviderDisplayNames`, `openModelPicker`, `runHeadless` from `./council-models.ts`; type `CatalogueModel` from `./catalogue.ts`; `resolveCatalogue` from `./catalogue.ts`; `listSeatNames`, `loadSeat`, `loadCouncilConfig` from `./seats.ts` (seats.ts imports are already partially there).

- [ ] **Step 1: Add the imports** — after the existing `./seats.ts` import, add:

```ts
import { applySeatSelection, buildProviderDisplayNames, openModelPicker, runHeadless } from "./council-models.ts";
import { resolveCatalogue, type CatalogueModel } from "./catalogue.ts";
```

and extend the existing `./seats.ts` import to include `listSeatNames, loadSeat, loadCouncilConfig`:

```ts
import { PKG_ROOT, listSeatNames, loadSeat, loadCouncilConfig, loadThemeConfig, proceduresDir, parseQualifiedModel } from "./seats.ts";
```

- [ ] **Step 2: Add the registration** — directly after the `council-leaderboard` registration block:

```ts
	pi.registerCommand("council-models", {
		description:
			"Show or set a seat's model/thinking override — TUI opens the picker modal; headless prints the usage block + per-seat listing ([<seat> [<provider>/<model>[:thinking]]])",
		handler: async (args, ctx) => {
			const emit = (line: string) => {
				if (ctx.hasUI) ctx.ui.notify(line, "info");
				else console.log(line);
			};
			try {
				// Single snapshot (EV-23 §10/1): one refresh, one getAvailable per
				// invocation; the SAME flat array feeds resolveCatalogue AND the
				// writer's catalogue gate — listing guarantees writability.
				await ctx.modelRegistry.refresh();
				const models = ctx.modelRegistry.getAvailable() as CatalogueModel[];
				const displayNames = buildProviderDisplayNames(ctx.modelRegistry, models);
				if (ctx.mode === "tui") {
					// TUI surface: the modal (R-1 governs headless; the modal is the TUI
					// surface). The modal owns zero I/O; the opener owns the write.
					const rawSeats = listSeatNames(repoRoot).map((n) => loadSeat(repoRoot, n));
					const resolved = resolveCatalogue(models, displayNames, rawSeats, loadCouncilConfig(repoRoot));
					const sel = await openModelPicker(ctx, resolved);
					const out = applySeatSelection(repoRoot, models, sel);
					if (out.notified !== null) emit(out.notified);
					else if (out.error !== null) emit(`[council-models] error: ${out.error}`);
					return;
				}
				runHeadless(args, repoRoot, models, displayNames, emit);
			} catch (e) {
				emit(`[council-models] error: ${e instanceof Error ? e.message : String(e)}`);
			}
		},
	});
```

- [ ] **Step 3: Verify the file-level tests pass (registration assertion + full suite focused run)**

Run: `bun test test/council-models.test.ts test/eval-leaderboard.test.ts test/eval-runner.test.ts test/theme-compliance.test.ts test/theme-repaint.test.ts` and `bunx tsc --noEmit`
Expected: PASS — registration assertion now matches; typecheck clean.

- [ ] **Step 4: Commit**

```bash
git add extensions/index.ts
git commit -m "feat(council-models): register /council-models — TUI modal, headless listing + write (EV-25)"
```

---

### Task 4: End-to-end smoke phase — `/council-models` in the real overlay

**Files:**
- Modify: `smoke/driver.sh` — append Phase 5 after Phase 4 (the `rm -f "$LB_OUT" ...` line) and extend the final SMOKE PASS echo.

**Interfaces:**
- Consumes: the shipped `/council-models` command (this branch's code — the container installs it project-local from `/pkg`); the fixture's `.council.json` (all 9 seats pinned to `openrouter/deepseek/deepseek-v4-flash-0731`).

- [ ] **Step 1: Append Phase 5** — exact content below (the container runs `pi --approve -p`, headless → console path):

```bash
phase "5 council-models (EV-25)"
cd "$WORK" || fatal "no worktree"
CM_OUT="$(mktemp)"
CM_SEAT="$(mktemp)"
CM_WRITE="$(mktemp)"
CM_FAIL="$(mktemp)"

# (a) no-arg form: R-2 usage block + per-seat current listing (all 9 seats override-pinned).
timeout 120 pi --approve -p "/council-models" >"$CM_OUT" 2>&1 \
	|| fatal "phase 5: /council-models no-arg did not settle"
grep -Fq '[council-models] usage: /council-models [<seat> [<provider>/<model>[:thinking]]]' "$CM_OUT" \
	|| fatal "phase 5: R-2 usage line missing"
grep -Fq 'Current per-seat models:' "$CM_OUT" \
	|| fatal "phase 5: listing header missing"
grep -Fq 'owner: openrouter/deepseek/deepseek-v4-flash-0731 (override)' "$CM_OUT" \
	|| fatal "phase 5: owner override line missing"

# (b) single-seat form: usage line + that seat's current line.
timeout 120 pi --approve -p "/council-models owner" >"$CM_SEAT" 2>&1 \
	|| fatal "phase 5: /council-models owner did not settle"
grep -Fq '[council-models] usage:' "$CM_SEAT" || fatal "phase 5: single-seat usage line missing"
grep -Fq 'owner: openrouter/deepseek/deepseek-v4-flash-0731 (override)' "$CM_SEAT" \
	|| fatal "phase 5: single-seat current line missing"

# (c) write form: validate + write + R-3 notify (post-write read-back), file asserted.
timeout 120 pi --approve -p "/council-models owner openrouter/deepseek/deepseek-v4-flash-0731:high" >"$CM_WRITE" 2>&1 \
	|| fatal "phase 5: /council-models write did not settle"
grep -Fq 'council-models: wrote owner → openrouter/deepseek/deepseek-v4-flash-0731:high in .council.json — takes effect at the next dispatch.' \
	"$CM_WRITE" || fatal "phase 5: R-3 notify copy missing"
python3 -c '
import json
cfg = json.load(open(".council.json"))
val = cfg["council"]["owner"]
assert val == {"model": "openrouter/deepseek/deepseek-v4-flash-0731", "thinking": "high"}, val
assert len(cfg["council"]) == 9, f"write must not disturb other seats: {len(cfg[\"council\"])}"
' || fatal "phase 5: post-write .council.json mismatch"
python3 council/validate.py || fatal "phase 5: validate.py failed after the write"

# (d) failure: model outside the catalogue → error, file byte-identical (nothing written).
cp .council.json "$WORK/.council.json.cm-before"
timeout 120 pi --approve -p "/council-models owner openrouter/no-such-model/xyz" >"$CM_FAIL" 2>&1 \
	|| fatal "phase 5: /council-models invalid-model did not settle"
grep -Fq '[council-models] error:' "$CM_FAIL" || fatal "phase 5: invalid-model error missing"
cmp -s .council.json "$WORK/.council.json.cm-before" || fatal "phase 5: invalid model still wrote .council.json"
rm -f "$WORK/.council.json.cm-before"

rm -f "$CM_OUT" "$CM_SEAT" "$CM_WRITE" "$CM_FAIL"

echo
```

and change the final echo to:

```bash
echo "SMOKE PASS — full council loop + epic delivery + council-eval matrix + council-leaderboard + council-models verified"
```

The (a) block asserts the three ruled lines and the fixture seat line; a seat-count assertion is unnecessary (the fixture's 9 seats are already asserted by validate.py).

- [ ] **Step 2: Commit**

```bash
git add smoke/driver.sh
git commit -m "test(smoke): phase 5 exercises /council-models headless + write in the real overlay (EV-25)"
```

---

### Task 5: Owner gates, full smoke discharge, push + PR

- [ ] **Step 1: Gate 1 — deps**

Run: `bun install --frozen-lockfile`
Expected: exit 0.

- [ ] **Step 2: Gate 2 — strict typecheck**

Run: `bunx tsc --noEmit`
Expected: exit 0, no output.

- [ ] **Step 3: Gate 3 — full suite**

Run: `bun test`
Expected: exit 0; whole suite green (no `COUNCIL_INTEGRATION=1`).

- [ ] **Step 4: Gate 4 — validate.py**

Run: `python3 council/validate.py`
Expected: exit 0, `All council artifacts valid`.

- [ ] **Step 5: Full smoke discharge (acceptance 4)**

Run: `OPENROUTER_API_KEY=... bun run smoke` from the worktree root (the container installs THIS branch's package from `/pkg`).
Expected: `SMOKE PASS — full council loop + epic delivery + council-eval matrix + council-leaderboard + council-models verified`; artifacts under `smoke/.artifacts/<ts>/`.
If phases 0–4 fail for reasons unrelated to EV-25 (model variance / environment), fall back to a container-scoped Phase-0+5 run: `docker build -t pi-council-smoke smoke && docker run --rm -e OPENROUTER_API_KEY -v "$PWD:/pkg" pi-council-smoke bash -c 'cp -R /pkg/smoke/fixture /work && cd /work && pi install -l /pkg && pi --approve -p "/council-init" && pi --approve -p "/council-models" && pi --approve -p "/council-models owner openrouter/deepseek/deepseek-v4-flash-0731:high" && python3 council/validate.py'` and record exactly what ran and its output.

- [ ] **Step 6: Push + PR**

```bash
git push -u origin feat/ev-25-council-models
gh pr create --base main --head feat/ev-25-council-models \
  --title "feat(council-models): register /council-models, headless listing + write, picker wiring (EV-25)" \
  --body "<card Intent/Goal + gate evidence + smoke evidence + notable decisions>"
```

Do NOT poll CI. Record the four gate outputs, the smoke evidence, and the PR number/head SHA (`gh pr view --json number,headRefOid`).