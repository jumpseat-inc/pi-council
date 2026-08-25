# EV-4 Theme Compliance + Live Repaint Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every council-drawn element draws from pi theme tokens only (zero hardcoded hex/ANSI in `extensions/*.ts`), a `resolvedPalette(variant)` helper exposes the merged resolved hex palette, and the `.council.json` mid-session watcher live-repaints the open modal — pinned by a test that renders a real pi Theme through the live Proxy.

**Architecture:** `extensions/theme-activation.ts` gains the pure `ansi256ToHex` (copy of pi's unexported table, theme.js ~line 794) + `resolvedPalette(variant, configOverride?, repoRoot?)` (loadShippedTheme → mergeThemeSection → resolveThemeColors(withThemeColorFallbacks) → hex any numeric entries). New `extensions/theme-watcher.ts` watches the PARENT DIR of `<repoRoot>/.council.json`, filters by basename, re-arms on rename/delete, ~250ms last-write-wins debounce, unref'd handle; on reload it follows the decision table: malformed → notify warning + stay armed; config undefined → RULING 1 keep-last + notify warning + NO setTheme default; config present → reuse `activateTheme`. `extensions/index.ts` arms the watcher in `session_start` only when `loadThemeConfig(repoRoot)` is defined at that moment (sync-gated), closes it in `session_shutdown`, and extracts two pure line-builders (`widgetLines`, `jobLines`) so the zero-ANSI audit tests the REAL strings.

**Tech Stack:** Bun + TypeScript (strict), `bun:test`, `@earendil-works/pi-coding-agent` (`ExtensionContext`, `Theme`), `@earendil-works/pi-tui`, deep-import of pi's `dist/modes/interactive/theme/theme.js` (via existing `loadPiThemeModule()`), `node:fs`/`node:path`. No new dependencies; no `package.json` version bump.

**Spec:** `docs/superpowers/specs/2026-08-25-EV-4-design.md` (commit 989a2c4, the contract). Do not reopen the rulings (RULING 1 keep-last, RULING 2 no status surface), Phase 1 NAME-1 (`pi-council` only), EV-3 zero-settings-write, epic §4 in-memory-only, AGENTS.md 9.6.

## Global Constraints (binding; do not reweigh)

- **RULING 1:** config section removed/disabled mid-session → keep the LAST materialized theme. NO `setTheme` call at all. Notify: `council: theme removed — keeping the last council theme active; restart to revert` (warning). No live off-revert.
- **RULING 2:** no council-owned status surface. Display nothing about the active theme.
- **EV-3 zero-settings-write:** `ui.setTheme` only in its `instanceof Theme` branch — `ui.setTheme(instance)`. NEVER call `ui.setTheme(string)`, `setThemeName`, `settingsManager`, `onThemeChange`, `setThemeInstance` (extension code; tests may call `setThemeInstance` to simulate pi's TUI the way `interactive-mode.js` does).
- **Arm gate:** the watcher arms ONLY when `loadThemeConfig(repoRoot)` is defined at `session_start` (sync check, try/caught). A theme section appearing mid-session in a repo that had none is unsupported — documented.
- **Watch set:** `.council.json` edits only. `settings.json` never watched, shipped `themes/*.json` are silent no-ops.
- **In-memory:** `materializeTheme` never registers a name, writes no on-disk theme, no tempfile.
- **Notify/widget strings:** plain text, zero ANSI, no `#hex`. Guard every notify with `ctx.hasUI`.
- **The audit:** `extensions/*.ts` contains NO `\x1b` and NO `#[0-9a-fA-F]{3,8}` outside (a) comment content, (b) the marked `[ev4-palette-table]` region (the `basicColors` data table of `ansi256ToHex`), (c) the navigator.ts:24–26 comment block (its escapes live in a JSDoc block comment).
- **Gates (all four, in order):** `bun install --frozen-lockfile`, `bunx tsc --noEmit`, `bun test` (integration self-skips without `COUNCIL_INTEGRATION=1`), `python3 council/validate.py`. Each is a hard stop-and-fix.

## Verified Facts (probed against the installed pi in the worktree)

- `theme.js` exports `theme` (Proxy over `globalThis[Symbol.for("@earendil-works/pi-coding-agent:theme")]`), `setThemeInstance(instance)` (swap global, `currentThemeName = "<in-memory>"`, calls `onThemeChangeCallback`), `Theme` class with `fg`/`bg`/`bold` methods; `Theme.getFgAnsi(token)` returns e.g. `\x1b[38;2;254;188;56m` in truecolor mode, `\x1b[39m` for `""`.
- `interactive-mode.js:2154` calls `factory(this.ui, theme, this.keybindings, close)` — the TUI passes the live module-level `theme` proxy; `interactive-mode.js:741` registers `onThemeChange(() => { this.ui.invalidate(); ... })` — the ONLY invalidate fan is pi's own.
- `tui.js:429–434`: `TUI.invalidate()` calls `overlay.component.invalidate()` for each overlay. The council overlay's `invalidate` wiring is `() => tree.invalidate()`; `CouncilTree.invalidate()` clears the width-keyed `this.cached` — the ONLY stale state.
- Shipped `themes/pi-council-{dark,light}.json` currently contain no integer entries (colon all `#rrggbb`/var-refs) — `ansi256ToHex` is exercised by repo override integers and test fixtures (validateThemeValue allows `integer 0..255`).
- `ansi256ToHex` (pi, unexported): bytes 0–15 basic table, 16–231 6×6×6 cube (`toHex(n) = n===0 ? 0 : 55+n*40`), 232–255 gray `8+(idx-232)*10`. Vectors: `0 → #000000`, `15 → #ffffff`, `220 → #ffd700` (r=5→#ff, g=4→#d7, b=0→#00), `232 → #080808`, `255 → #eeeeee`.
- `loadThemeConfig(repoRoot)` throws with file-named messages on malformed JSON/invalid section; returns undefined for absent/falsy-off/`enabled:false`.
- `Job { id, seat, pid, state, startedAt, lastActivityAt, timeoutMs, stallMs, events, output, stderrTail, usage, exitCode }` (extensions/hub.ts:7).
- Index.ts `renderWidget` and `/council-job-sizing` handler build plain strings — extracting `widgetLines`/`jobLines` is behavior-preserving.

---
### Task 1: `resolvedPalette` + `ansi256ToHex` (theme-activation.ts)

**Files:**
- Modify: `extensions/theme-activation.ts`
- Test: `test/theme-resolved-palette.test.ts` (new)
- Docs header of theme-activation.ts comment already says EV-4 scope — leave.

**Interfaces:**
- Consumes: `loadShippedTheme`, `loadThemeConfig`, `mergeThemeSection`, `resolveThemeColors`, `withThemeColorFallbacks` (all exist).
- Produces: `ansi256ToHex(index: number): string` (exported, pure) and `resolvedPalette(variant: "dark"|"light", configOverride?: ThemeSection, repoRoot?: string): Record<string, string>` (exported, pure after optional config read).

- [ ] **Step 1: Write the failing test** `test/theme-resolved-palette.test.ts`

```ts
import { test, expect } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { ansi256ToHex, resolvedPalette } from "../extensions/theme-activation.ts";
import { loadShippedTheme, loadThemeConfig, mergeThemeSection } from "../extensions/seats.ts";

test("ansi256ToHex: basic 16, cube 220, grayscale endpoints", () => {
	expect(ansi256ToHex(0)).toBe("#000000");
	expect(ansi256ToHex(15)).toBe("#ffffff");
	expect(ansi256ToHex(220)).toBe("#ffd700"); // cube r=5 g=4 b=0
	expect(ansi256ToHex(232)).toBe("#080808");
	expect(ansi256ToHex(255)).toBe("#eeeeee");
});

test("resolvedPalette(dark) == resolved shipped asset; text stays '' (default sentinel)", () => {
	const pal = resolvedPalette("dark");
	const shipped = loadShippedTheme("dark");
	const expected = resolveColorVariables(withThemeFallbacks(shipped.colors), shipped.vars);
	expect(pal).toEqual(expected);
	expect(pal.text).toBe("");
	expect(pal.accent).toBe("#febc38");
	// every non-empty value is a 6-digit hex
	for (const v of Object.values(pal)) {
		expect(v === "" || /^#[0-9a-fA-F]{6}$/.test(v)).toBe(true);
	}
});

test("numeric entries are 256-index hexed (repo override accent: 220)", () => {
	const pal = resolvedPalette("dark", { variant: "dark", dark: { colors: { accent: 220 } } });
	expect(pal.accent).toBe("#ffd700");
});

test("numeric VAR entries hex through transitive resolution", () => {
	const pal = resolvedPalette("dark", { variant: "dark", dark: { vars: { accent: 220 } } });
	expect(pal.accent).toBe("#ffd700"); // accent token is a var-ref to vars.accent
});

test("configOverride wins; repoRoot read only when no override", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "ev4-pal-"));
	fs.writeFileSync(path.join(root, ".council.json"), JSON.stringify({ theme: { variant: "dark", dark: { colors: { accent: "#123456" } } } }));
	expect(resolvedPalette("dark", undefined, root).accent).toBe("#123456"); // read from disk
	expect(resolvedPalette("dark", { variant: "dark", dark: { colors: { accent: "#abcdef" } } }, root).accent).toBe("#abcdef"); // override wins
});
```

- [ ] **Step 2: Run it — must FAIL** on `resolvedPalette`/`ansi256ToHex` not existing.

```bash
bun test test/theme-resolved-palette.test.ts
```

- [ ] **Step 3: Implement** in `extensions/theme-activation.ts`:

```ts
// [ev4-palette-table] basicColors is the same data pi's unexported ansi256ToHex
// uses (theme.js ~line 794). It is a converter table, NOT drawing color — the
// EV-4 zero-hex audit whitelists exactly this region via the marker tags.
export function ansi256ToHex(index: number): string {
	const basicColors = [
		"#000000", "#800000", "#008000", "#808000",
		"#000080", "#800080", "#008080", "#c0c0c0",
		"#808080", "#ff0000", "#00ff00", "#ffff00",
		"#0000ff", "#ff00ff", "#00ffff", "#ffffff",
	];
	if (index < 16) return basicColors[index];
	if (index < 232) {
		const cubeIndex = index - 16;
		const r = Math.floor(cubeIndex / 36);
		const g = Math.floor((cubeIndex % 36) / 6);
		const b = cubeIndex % 6;
		const toHex = (n: number) => (n === 0 ? 0 : 55 + n * 40).toString(16).padStart(2, "0");
		return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
	}
	const gray = 8 + (index - 232) * 10;
	const grayHex = gray.toString(16).padStart(2, "0");
	return `#${grayHex}${grayHex}${grayHex}`;
}
// [ev4-palette-table]

export function resolvedPalette(
	variant: "dark" | "light",
	configOverride?: ThemeSection,
	repoRoot?: string,
): Record<string, string> {
	const config = configOverride ?? (repoRoot !== undefined ? loadThemeConfig(repoRoot) : undefined);
	const block = config !== undefined ? (variant === "dark" ? config.dark : config.light) : undefined;
	const merged = mergeThemeSection(loadShippedTheme(variant), block);
	const resolved = resolveThemeColors(withThemeColorFallbacks(merged.colors), merged.vars);
	const out: Record<string, string> = {};
	for (const [key, value] of Object.entries(resolved)) out[key] = typeof value === "number" ? ansi256ToHex(value) : value;
	return out;
}
```

- [ ] **Step 4: Run — must PASS**
- [ ] **Step 5: Commit** `git add extensions/theme-activation.ts test/theme-resolved-palette.test.ts && git commit -m "feat(theme): resolvedPalette + ansi256ToHex hex palette helper (EV-4)"`

### Task 2: `extensions/theme-watcher.ts`

**Files:**
- Create: `extensions/theme-watcher.ts`
- Test: `test/theme-watcher.test.ts`

**Interfaces:**
- Consumes: `loadThemeConfig`, `ThemeSection` (seats.ts); `activateTheme`, `ThemeSettingsFiles` (theme-activation.ts).
- Produces: `interface CouncilConfigWatcher { close(): void }`, `watchCouncilConfig(ctx: ExtensionContext, repoRoot: string, opts?: { settingsFiles?: ThemeSettingsFiles; debounceMs?: number }): CouncilConfigWatcher`.

- [ ] **Step 1: failing test** `test/theme-watcher.test.ts`:

```ts
import { any("test", expect } from "bun:test"; // placeholder — real import below
```

(paste the full block below — the file is committed in Task 2 commit.)

```ts
import { test, expect } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { watchCouncilConfig } from "../extensions/theme-watcher.ts";
import type { ExtensionContext } from "@earendil-works/pi-coding-agent";

function tmpRepo(initial?: unknown): string {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "ev4-watch-"));
	if (initial !== undefined) fs.writeFileSync(path.join(root, ".council.json"), JSON.stringify(initial));
	return root;
}
function settingsFiles(): { globalFile: string; projectFile: string } {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ev4-watch-settings-"));
	return { globalFile: path.join(dir, "g.json"), projectFile: path.join(dir, "p.json") };
}
function makeCtx(notify: (m: string, t?: string) => void): { ctx: ExtensionContext; setCount: () => number } {
	const calls: Array<{ theme: any }> = [];
	const ctx = { hasUI: true, ui: { setTheme(t: unknown) { calls.push({ theme: t }); return { success: true }; }, notify } } as unknown as ExtensionContext;
	return { ctx, setCount: () => calls.length };
}
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const DESIGN = 40; // fast debounce for tests

async function waitFor(cond: () => boolean, ms = 1500): Promise<boolean> {
	const start = Date.now();
	while (Date.now() - start < ms) { if (cond()) return true; await sleep(20); }
	return cond();
}

test("valid save → exactly one reload with the NEW palette", async () => {
	const root = tmpRoot({ theme: { variant: "dark", dark: { colors: { accent: "#123456" } } } });
	const files = settingsFiles(); fs.writeFileSync(files.projectFile, JSON.stringify({ theme: "light/dark" })); fs.writeFileSync(files.globalFile, JSON.stringify({ theme: "light/dark" }));
	const notifs: string[] = [];
	const { ctx, setCount } = makeCtx((m) => notifs.push(m));
	const w = watchCouncilConfig(ctx, root, { settingsFiles: files, debounceMs: 60 });
	await sleep(120); // no reload on arm
	expect(setCount()).toBe(0);
	fs.writeFileSync(path.join(root, ".council.json"), JSON.stringify({ theme: { variant: "dark", dark: { colors: { accent: "#654321" } } } }));
	await waitFor(() => setCount() === 1) true;
	await sleep(150);
	expect(setCount()).toBe(1);
	expect(notifs).toContainEqual("council theme: pi-council-dark");
	w.close();
});
```

(Continue in the committed file — replace the truncated asserts with exact ones per the plan's "prove it" style: accent ANSI byte on the captured instance.)

- [ ] **Step 2: run — FAIL (module missing)**
- [ ] **Step 3: implement** `extensions/theme-watcher.ts` (see below, full code in the commit block)
- [ ] **Step 4: run — PASS, all watcher cases**
- [ ] **Step 5: commit**

### Task 3: index.ts wiring + pure builders

- [ ] **Step 1:** write failing tests for `widgetLines`/`jobLines` + session arm/close (test file extends Task 2's)
- [ ] **Step 2:** run FAIL
- [ ] **Step 3:** minimal implementation
- [ ] **Step 4:** run PASS
- [ ] **Step 5:** commit

### Task 4: `test/theme-repaint.test.ts` (pinning)

- [ ] Steps 1..5 (real pi Theme A/B via `materializeTheme`, live Proxy via `loadPiThemeModule().theme`, drive `CouncilTree`/`TranscriptView`, assert B's ANSI bytes)

### Task 5: `test/theme-compliance.test.ts`

- [ ] zero-ANSI assertions + grep-audit unit test
- [ ] run PASS, commit

### Task 6: docs (README.md, Live theme editing + export regression note)

### Task 7: gates, branch push, PR (open, DO NOT merge)

### Self-review checklist (run before gates)

- [ ] Every spec §4/§5/§7/§8 requirement maps to a task
- [ ] No `\x1b`/`#hex` literals in extensions/*.ts outside whitelisted regions
- [ ] No string-branch `ui.setTheme`, no settings.json writes, no onThemeChange in extension code
- [ ] Watcher arm gated at session_start; close in session_shutdown
