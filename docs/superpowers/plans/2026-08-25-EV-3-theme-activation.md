# EV-3 Theme Activation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** At `session_start` the council extension materializes the `.council.json` theme section (EV-2) into a pi `Theme` instance and activates it via the in-memory `ui.setTheme(instance)` route, leaving pi's settings untouched; a repo without a theme section is a silent no-op.

**Architecture:** New module `extensions/theme-activation.ts` holds (1) a pure decision function `decideThemeActivation(config, rawSetting, configVariantPin?, terminalTheme?)` implementing the settled four-state whitelist, (2) pure construction helpers (var-ref resolution mirroring pi's `resolveThemeColors`, the four pi fallbacks, the 8-bg-key split, `buildMode()` from `getCapabilities().trueColor`), and (3) the integration glue `activateTheme(ctx, repoRoot, settingsFiles?)` that reads the two settings.json leaves off disk (project wins), deep-imports pi's theme module for `detectTerminalBackgroundFromEnv` + the real `Theme` class, materializes `new Theme(fgColors, bgColors, mode)`, calls `ctx.ui.setTheme(instance)` (zero settingsManager writes), and emits the notify tri-state. Wired into `extensions/index.ts` `session_start` before `initHubIdentity(mintRunId())`; the whole block is try/caught so a malformed `.council.json` notifies and returns, never crashing the session.

**Tech Stack:** Bun + TypeScript (strict), `bun:test`, `@earendil-works/pi-coding-agent` (public `Theme` type, `getAgentDir`, `CONFIG_DIR_NAME`), `@earendil-works/pi-tui` (`getCapabilities`), deep-import of pi's `dist/modes/interactive/theme/theme.js` — the same file interactive-mode.js imports, so `instanceof Theme` in pi's `setTheme` branch holds at runtime.

**Spec:** `docs/superpowers/specs/2026-08-25-EV-3-design.md` (commit 318e3ce, the contract), plus the epic authority `docs/superpowers/specs/2026-08-25-council-theme-design.md` §4. The card's Deliberation record (Rounds 1–3 + consolidator synthesis, `council/cards/EV-3.md`) is the settled record; the two Skeptic closed-red factual corrections are binding: (1) call pi's exported `detectTerminalBackgroundFromEnv` directly by deep-import, (2) import `getCapabilities` from `@earendil-works/pi-tui`, never from the public API/theme module.

## Global Constraints (binding; do not reweigh)

- **Strict whitelist:** activate iff raw settings `theme` leaf is `undefined` or one of `"light/dark"`, `"dark"`, `"light"`. Everything else — including a custom `A/B` pair like `"nord-light/nord-dark"` — blocks. Never route through `parseAutoThemeSetting` / `resolveThemeSetting` (both invert custom pairs).
- **Raw settings off disk only:** read `getAgentDir()/settings.json` and `<repo>/<CONFIG_DIR_NAME>/settings.json`; project wins at the leaf. Never read `ui.theme.name` — it is `"<in-memory>"` after any `setTheme(instance)`.
- **In-memory only:** activate via `new Theme(fgColors, bgColors, mode)` + `ctx.ui.setTheme(instance)` — the `instanceof Theme` branch (zero `settingsManager` writes, `currentThemeName = "<in-memory>"`). The extension never writes pi's `settings.json`. No tempfile, no on-disk theme copy (spec §4 strict).
- **Fallbacks (mirror pi, `??` semantics):** `thinkingMax←thinkingXhigh`, `scrollbarThumb←selectedBg`, `searchMatchBg←selectedBg`, `searchMatchText←text`.
- **bg keys (8, rest are fg):** `selectedBg, scrollbarThumb, searchMatchBg, userMessageBg, customMessageBg, toolPendingBg, toolSuccessBg, toolErrorBg`.
- **Notify strings (plain text, no ANSI):** activate → `council theme: pi-council-{variant}` `"info"`; block → `council theme: blocked (settings.json has '{themeName}')` `"warning"`; no-section → silent. Guard with `hasUI`.
- **Wiring:** inside `session_start`, before `initHubIdentity(mintRunId())`; the whole activation block is `try/catch`ed — a throw notifies and returns, never crashes the session. The notify tri-state runs inside the `try`.
- **Name namespace:** the in-memory instance carries no name, registers nothing, writes nothing; family `pi-council` exists only in the shipped asset names.
- **Paths:** `CONFIG_DIR_NAME`, `PKG_ROOT` only — no hardcoded `.pi` (AGENTS.md 3, 4).
- **Gates (all four, in order, no thresholds lowered):** `bun install --frozen-lockfile`, `bunx tsc --noEmit`, `bun test` (integration self-skips without `COUNCIL_INTEGRATION=1`), `python3 council/validate.py`.

## Verified Facts (probed against the installed pi theme module in the worktree)

- `Theme` constructor: `new Theme(fgColors, bgColors, mode, options?)`; `fgAnsi`/`bgAnsi` map `#rrggbb` → truecolor `\x1b[38;2;r;g;bm` / 256 `\x1b[38;5;im`, `""` → `\x1b[39m`/`\x1b[49m`, integers → `\x1b[38;5;nm`; throws `Invalid color value` on anything else — var-refs MUST resolve to hex before construction.
- The constructor also applies the fallbacks itself (`thinkingMax??thinkingXhigh`, `searchMatchText??text` on fg; `scrollbarThumb??selectedBg`, `searchMatchBg??selectedBg` on bg) — applying the same `??` fallbacks on the merged colors first is idempotent and mirrors `withThemeColorFallbacks`.
- `detectTerminalBackgroundFromEnv({ env })` is exported from `theme.js` (verified): COLORFGBG `15;0` → `"dark"` (bg index 0, luminance < 0.5), `0;15` → `"light"`, absent → `"dark"` (fallback).
- `getCapabilities()` is exported from `@earendil-works/pi-tui` root, returns `{ images, trueColor: boolean, hyperlinks }`; headless resolves `trueColor: false`.
- The public API re-exports the `Theme` class from the same `theme.js` that `setTheme(theme: string | Theme)` types against — deep-importing the identical absolute file URL gives identical class identity, so `instanceof` holds and TS needs no cast when typing the deep-imported module as `{ Theme: typeof Theme }`.
- Shipped dark palette: `vars.accent = #febc38`, `vars.selectedBg = #31363f`, `colors.selectedBg = "selectedBg"` (a var-ref), `colors.text = ""`; `mdListBullet` follows `vars.accent`, `border` follows `vars.blue`.
- `import.meta.resolve("@earendil-works/pi-coding-agent")` returns the entry file URL; `dirname(resolved)/modes/interactive/theme/theme.js` exists (same walk `test/theme-loader.ts` uses).

## File Structure

- **Create** `extensions/theme-activation.ts` — decision, resolution/fallback/split helpers, `buildMode`, `loadPiThemeModule`, `readRawThemeSetting`, `materializeTheme`, `activateTheme`.
- **Create** `test/theme-activation.test.ts` — decision table, construction identity (both modes, referenced against pi's loader), namespace split, mode detection, no-op rapid gate, settings byte-identity.
- **Modify** `extensions/index.ts` — import + `session_start` call before `initHubIdentity`.
- No changes to `seats.ts`, `themes/`, `council/`, `docs/specs/`.

## Task List

### Task 0: Baseline (done at worktree creation)

- [x] `bun install --frozen-lockfile` exit 0.
- [x] `bunx tsc --noEmit` exit 0.
- [x] `bun test` — 182 pass / 2 skip / 0 fail.
- [x] `python3 council/validate.py` — "All council artifacts valid".

---

### Task 1: Decision function, `buildMode`, resolver/fallback helpers — RED first

**Files:** Create `test/theme-activation.test.ts`; Create `extensions/theme-activation.ts`.

- [ ] **Step 1 (RED):** write the failing tests:

```ts
import { test, expect } from "bun:test";
import { decideThemeActivation, buildMode } from "../extensions/theme-activation.ts";

const AUTO = { variant: "auto" as const };

test("absent config is a rapid noop regardless of raw setting", () => {
	expect(decideThemeActivation(undefined, undefined)).toEqual({ action: "noop" });
	expect(decideThemeActivation(undefined, "gruvbox")).toEqual({ action: "noop" });
	expect(decideThemeActivation(undefined, "light/dark")).toEqual({ action: "noop" });
});

test("whitelist: undefined / light/dark / dark / light activate; default variant dark", () => {
	for (const raw of [undefined, "light/dark", "dark", "light"]) {
		expect(decideThemeActivation(AUTO, raw)).toEqual({ action: "activate", variant: "dark" });
	}
});

test("config variant pin wins; terminal resolves auto; default dark", () => {
	expect(decideThemeActivation({ variant: "dark" }, undefined, "dark", "light")).toEqual({ action: "activate", variant: "dark" });
	expect(decideThemeActivation({ variant: "light" }, undefined, "light", "dark")).toEqual({ action: "activate", variant: "light" });
	expect(decideThemeActivation(AUTO, undefined, undefined, "light")).toEqual({ action: "activate", variant: "light" });
	expect(decideThemeActivation(AUTO, undefined, undefined, "dark")).toEqual({ action: "activate", variant: "dark" });
	expect(decideThemeActivation(AUTO, undefined)).toEqual({ action: "activate", variant: "dark" });
});

test("concrete names and custom A/B pairs block", () => {
	for (const raw of ["gruvbox", "nord-light/nord-dark", "custom-a/custom-b", "solarized"]) {
		expect(decideThemeActivation(AUTO, raw)).toEqual({ action: "block", themeName: raw });
	}
});

test("non-string raw leaves block (not 'absent')", () => {
	expect(decideThemeActivation(AUTO, null)).toEqual({ action: "block", themeName: "null" });
	expect(decideThemeActivation(AUTO, 0)).toEqual({ action: "block", themeName: "0" });
});

test("buildMode: caps override and real default", () => {
	expect(buildMode({ trueColor: true })).toBe("truecolor");
	expect(buildMode({ trueColor: false })).toBe("256color");
	expect(["truecolor", "256color"]).toContain(buildMode());
});
```

- [ ] **Step 2:** `bun test test/theme-activation.test.ts` → FAIL (module not found).
- [ ] **Step 3 (GREEN):** implement the pure exports in `extensions/theme-activation.ts` (see the full module skeleton at the end of this plan; the decision fn is spec §3 verbatim; `buildMode` reads `getCapabilities` from `@earendil-works/pi-tui`).
- [ ] **Step 4:** re-run the test file — decision + buildMode sections green.

---

### Task 2: resolver + fallbacks + bg/fg split — RED then GREEN

- [ ] **Step 1 (RED):** append:

```ts
import { resolveThemeColors, withThemeColorFallbacks, splitThemeColors, loadShippedTheme } from "../extensions/theme-activation.ts";
import { loadShippedTheme as seatsShipped } from "../extensions/seats.ts";

test("resolveThemeColors mirrors pi: chains, hex/int/'' passthrough, errors", () => {
	const vars = { accent: "#febc38", blue: "#178fb9", extra: "accent" };
	expect(resolveThemeColors({ a: "extra", b: "blue", c: "#123456", d: 42, e: "" }, vars)).toEqual({
		a: "#febc38", b: "#178fb9", c: "#123456", d: 42, e: "",
	});
	expect(() => resolveThemeColors({ a: "missing" }, {})).toThrow(/Variable reference not found/);
	expect(() => resolveThemeColors({ a: "b", b: "a" }, { a: "b", b: "a" })).toThrow(/Circular/);
});

test("withThemeColorFallbacks applies the four pi fallbacks with ?? semantics", () => {
	const w = withThemeColorFallbacks({ text: "#fff", selectedBg: "#111", thinkingXhigh: "#333" });
	expect(w.thinkingMax).toBe("#333");
	expect(w.searchMatchText).toBe("#fff");
	expect(w.searchMatchBg).toBe("#111");
	expect(w.scrollbarThumb).toBe("#111");
});

test("splitThemeColors: exactly the 8 bg keys land in bgColors, rest in fgColors", () => {
	const all = [...Object.keys(seatsShipped("dark").colors), "scrollbarThumb", "searchMatchBg", "searchMatchText", "thinkingMax"];
	const colors = Object.fromEntries(all.map((k) => [k, "#000000"]));
	const { fgColors, bgColors } = splitThemeColors(colors);
	expect(Object.keys(bgColors).sort()).toEqual(
		["selectedBg", "scrollbarThumb", "searchMatchBg", "userMessageBg", "customMessageBg", "toolPendingBg", "toolSuccessBg", "toolErrorBg"].sort(),
	);
	expect(fgColors.selectedBg).toBeUndefined();
	expect(fgColors.accent).toBe("#000000");
});
```

- [ ] **Step 2:** run → FAIL (exports missing).
- [ ] **Step 3 (GREEN):** implement `resolveThemeColors` (mirror pi's `resolveVarRef` at theme.js:216-222, same messages), `withThemeColorFallbacks` (`??`, run on merged colors before resolution), `splitThemeColors` (over the 8-key `BG_TOKEN_KEYS` set).
- [ ] **Step 4:** tests pass.

---

### Task 3: deep-import module + construction — the real `Theme` — RED then GREEN

- [ ] **Step 1 (RED):** append:

```ts
import { materializeTheme, loadPiThemeModule } from "../extensions/theme-activation.ts";

test("construction identity: accent/selectedBg ANSI + fallback chains; both modes", async () => {
	const theme = await materializeTheme({ variant: "dark" }, "dark", "truecolor");
	expect(theme.getFgAnsi("accent")).toBe("\x1b[38;2;254;188;56m"); // omp accent var
	expect(theme.getBgAnsi("selectedBg")).toBe("\x1b[48;2;49;54;63m"); // #31363f
	expect(theme.getBgAnsi("scrollbarThumb")).toBe(theme.getBgAnsi("selectedBg"));
	expect(theme.getBgAnsi("searchMatchBg")).toBe(theme.getBgAnsi("selectedBg"));
	expect(theme.getFgAnsi("searchMatchText")).toBe(theme.getFgAnsi("text"));
	expect(theme.getFgAnsi("thinkingMax")).toBe(theme.getFgAnsi("thinkingXhigh"));

	const t256 = await materializeTheme({ variant: "dark" }, "dark", "256color");
	expect(t256.getColorMode()).toBe("256color");
});

test("construction identity: 256 mode matches pi's own loadThemeFromPath", async () => {
	const mod = await loadPiThemeModule();
	const merged = mergeThemeSection(loadShippedTheme("dark"), {});
	const tmp = path.join(os.tmpdir(), `ev3-ref-${Date.now()}.json`);
	fs.writeFileSync(tmp, JSON.stringify({ name: "ev3-ref", vars: merged.vars, colors: merged.colors }));
	const ref = mod.loadThemeFromPath(tmp, "256color");
	const theme = await materializeTheme({ variant: "dark" }, "dark", "256color");
	for (const key of ["scrollbarThumb", "searchMatchBg", "selectedBg"]) {
		expect(theme.getBgAnsi(key)).toBe(ref.getBgAnsi(key));
	}
	for (const key of ["accent", "searchMatchText", "thinkingMax", "mdLink", "thinkingOff", "text"]) {
		expect(theme.getFgAnsi(key)).toBe(ref.getFgAnsi(key));
	}
});

test("repo vars override recolors the instance transitively (dark vars.accent)", async () => {
	const theme = await materializeTheme({ variant: "dark", dark: { vars: { accent: "#ff00ff" } } }, "dark", "truecolor");
	expect(theme.getFgAnsi("accent")).toBe("\x1b[38;2;255;0;255m");
	expect(theme.getFgAnsi("mdListBullet")).toBe("\x1b[38;2;255;0;255m");
});
```

- [ ] **Step 2:** fail → **Step 3 (GREEN):** `loadPiThemeModule()` (cached promise; `import.meta.resolve("@earendil-works/pi-coding-agent")` → `dirname/resolved/modes/interactive/theme/theme.js`, cast `as unknown as PiThemeModule` with `Theme: typeof Theme` from the public API import) and `materializeTheme(config, variant, mode = buildMode())`:

```ts
const base = loadShippedTheme(variant);
const block = variant === "dark" ? config.dark : config.light;
const merged = mergeThemeSection(base, block);
const resolved = resolveThemeColors(withThemeColorFallbacks(merged.colors), merged.vars);
const { fgColors, bgColors } = splitThemeColors(resolved);
const mod = await loadPiThemeModule();
return new mod.Theme(fgColors, bgColors, mode);
```

Return type `Promise<Theme>` (public class).
- [ ] **Step 4:** green.

---

### Task 4: raw-read + activation glue + wiring — RED then GREEN

- [ ] **Step 1 (RED):** integration tests:

```ts
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { activateTheme, materializeTheme } from "../extensions/theme-activation.ts";
import { loadThemeModule } from "./theme-loader.ts";
import { PKG_ROOT, loadShippedTheme as seatsShipped } from "../extensions/seats.ts";
import type { ExtensionContext } from "@earendil-works/pi-coding-agent";

function tmpRepo(config?: unknown): string {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "ev3-act-"));
	if (config !== undefined) fs.writeFileSync(path.join(root, ".council.json"), JSON.stringify(config));
	return root;
}

test("activate flow: one instance set, info notify", async () => {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ev3-settings-"));
	const files = { globalFile: path.join(dir, "g.json"), projectFile: path.join(dir, "p.json") };
	fs.writeFileSync(files.globalFile, JSON.stringify({ theme: "light/dark" }));
	fs.writeFileSync(files.projectFile, JSON.stringify({ theme: "light/dark" }));
	const root = tmpRepo({ theme: { variant: "auto" } });
	let setCount = 0;
	const notif: Array<{ m: string; t?: string }> = [];
	const ctx = { hasUI: true, ui: { setTheme() { setCount++; return { success: true }; }, notify(m: string, t?: string) { notif.push({ m, t }); } } } as unknown as ExtensionContext;
	await activateTheme(ctx, root, { settingsFiles: files });
	expect(setCount).toBe(1);
	expect(notif).toContainEqual({ m: "council theme: pi-council-dark", t: "info" });
});

test("block flow: gruvbox blocks, warning notify, no setTheme", async () => {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ev3-settings-"));
	const files = { globalFile: path.join(dir, "g.json"), projectFile: path.join(dir, "p.json") };
	fs.writeFileSync(files.globalFile, JSON.stringify({ theme: "gruvbox" }));
	fs.writeFileSync(files.projectFile, JSON.stringify({}));
	const root = tmpRepo({ theme: { variant: "auto" } });
	let setCount = 0;
	const notif: Array<{ m: string; t?: string }> = [];
	const ctx = { hasUI: true, ui: { setTheme() { setCount++; return { success: true }; }, notify(m: string, t?: string) { notif.push({ m, t }); } } } as unknown as ExtensionContext;
	await activateTheme(ctx, root, { settingsFiles: files });
	expect(setCount).toBe(0);
	expect(notif).toContainEqual({ m: "council theme: blocked (settings.json has 'gruvbox')", t: "warning" });
});

test("no-op: config undefined -> no settings readFileSync, no setTheme", async () => {
	const spy = spyOn(fs, "readFileSync");
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ev3-settings-"));
	const files = { globalFile: path.join(dir, "g.json"), projectFile: path.join(dir, "p.json") };
	fs.writeFileSync(files.globalFile, JSON.stringify({}));
	const ctx = { hasUI: false, ui: { setTheme() { return { success: true }; }, notify() {} } } as unknown as ExtensionContext;
	await activateTheme(ctx, tmpRepo(), { settingsFiles: files }); // no .council.json
	expect(spy).not.toHaveBeenCalled();
});

test("settings.json byte-identical after activation", async () => {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ev3-settings-"));
	const files = { globalFile: path.join(dir, "g.json"), projectFile: path.join(dir, "p.json") };
	const before = JSON.stringify({ theme: "light/dark" });
	fs.writeFileSync(files.globalFile, before);
	fs.writeFileSync(files.projectFile, before);
	const root = tmpRepo({ theme: { variant: "auto" } });
	const ctx = { hasUI: false, ui: { setTheme() { return { success: true }; }, notify() {} } } as unknown as ExtensionContext;
	await activateTheme(ctx, root, { settingsFiles: files });
	expect(fs.readFileSync(files.globalFile, "utf-8")).toBe(before);
	expect(fs.readFileSync(files.projectFile, "utf-8")).toBe(before);
});

test("namespace: getThemeByName('pi-council-dark') stays EV-1 shipped after in-memory setTheme", async () => {
	const mod = await loadThemeModule();
	mod.setRegisteredThemes([mod.loadThemeFromPath(path.join(PKG_ROOT, "themes", "pi-council-dark.json"), "truecolor")]);
	const before = mod.getThemeByName("pi-council-dark")?.getFgAnsi("accent");
	expect(before).toBe("\x1b[38;2;254;188;56m");
	const instance = await materializeTheme({ variant: "dark", dark: { colors: { accent: "#112233" } } }, "dark", "truecolor");
	expect(instance.getFgAnsi("accent")).toBe("\x1b[38;2;17;34;51m");
	// "set on a stubbed ctx" - the in-memory route never touches registeredThemes
	expect(mod.getThemeByName("pi-council-dark")?.getFgAnsi("accent")).toBe("\x1b[38;2;254;188;56m");
});
```

Also cover `hasUI:false` on the activate path (no notify but still one setTheme).

- [ ] **Step 2:** fail → **Step 3 (GREEN):** `readRawThemeSetting(files)` (per-file try/parse; project wins via `!== undefined`), `defaultThemeSettingsFiles(repoRoot)` (`getAgentDir` + `CONFIG_DIR_NAME`), and `activateTheme(ctx, repoRoot, opts?)` (spec §4 data flow; full code below).
- [ ] **Step 4:** wire `extensions/index.ts`: `import { activateTheme } from "./theme-activation.ts";` and inside `session_start`, directly above `initHubIdentity(mintRunId())`, add `void activateTheme(ctx, repoRoot);`.
- [ ] **Step 5:** `bun test test/theme-activation.test.ts` green; full `bun test` green; `bunx tsc --noEmit` clean.

---

### Task 5: Gates, commits, PR

1. `bun install --frozen-lockfile` exit 0
2. `bunx tsc --noEmit` exit 0
3. `bun test` — new tests add to the suite; integration self-skips — exit 0
4. `python3 council/validate.py` — all valid, exit 0
5. Commit sequence (Conventional Commits, AGENTS.md):
   - `docs(plan): EV-3 theme activation implementation plan`
   - `feat(theme): activate the council theme on session start (EV-3)` — module, tests, and `index.ts` wiring
   - (optionally split `feat(theme): wire activation into session_start` if a clean checkpoint exists; the module+test+wire can land as one feature commit if each gate stays green)
6. `git push -u origin feat/ev3-theme-activation` then
   `gh pr create --base main --head feat/ev3-theme-activation --title "feat(theme): activate council theme on session start" --body "Closes EV-3 (EPIC-1); design spec 318e3ce."`
7. Report: worktree path, branch, PR number/URL, the four gates with real exit codes/counts, commit SHAs.

## Self-review

- Spec §3 decision fn: Task 1 verbatim signature; strict whitelist; non-list incl. custom `A/B` (any `/`) → block; variant = `configVariantPin ?? terminalTheme ?? "dark"`; `config===undefined` → noop (reads no settings).
- Spec §4 data flow: Tasks 2–4 — merged JSON (vars then colors, repo wins per key), var-ref resolution BEFORE `new`, 8-bg split, fallbacks, mode via `getCapabilities` (pi-tui), `ui.setTheme(instance)`; raw settings off disk, project wins; only the instance branch (never writes settings).
- Spec §5 mode: `getCapabilities` from `@earendil-works/pi-tui` — not the public API/theme module.
- Spec §6 notify tri-state: strings exact, `hasUI` guard.
- Spec §7 acceptance: (i) identity tests, (ii) namespace test, (iii) decision-table blockarity, (iv) bytes-identical.
- Spec §8: all five test bullets covered.
- §9 corrections applied; §10 deferred: no watcher, no disk theme, no name registration, no HTML export — nothing in the tasks does any of these.

## Full module code (all exports; referenced by the tasks above — adapt comments to the final committed form)

```ts
// extensions/theme-activation.ts
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { CONFIG_DIR_NAME, getAgentDir, Theme, type ExtensionContext } from "@earendil-works/pi-coding-agent";
import { getCapabilities } from "@earendil-works/pi-tui";
import { loadShippedTheme, mergeThemeSection, type ThemeSection } from "./seats.ts";

export type ThemeActivationDecision =
	| { action: "activate"; variant: "dark" | "light" }
	| { action: "noop" }
	| { action: "block"; themeName: string };

const ACTIVATION_WHITELIST = new Set(["light/dark", "dark", "light"]);

export function decideThemeActivation(
	config: ThemeSection | undefined,
	rawSetting: unknown,
	configVariantPin?: "dark" | "light",
	terminalTheme?: "dark" | "light",
): ThemeActivationDecision {
	if (config === undefined) return { action: "noop" };
	const whitelisted = rawSetting === undefined || (typeof rawSetting === "string" && ACTIVATION_WHITELIST.has(rawSetting));
	if (whitelisted) return { action: "activate", variant: configVariantPin ?? terminalTheme ?? "dark" };
	return { action: "block", themeName: typeof rawSetting === "string" ? rawSetting : String(rawSetting) };
}

export function buildMode(caps?: { trueColor: boolean }): "truecolor" | "256color" {
	return (caps?.trueColor ?? getCapabilities().trueColor) ? "truecolor" : "256color";
}

function resolveVarRef(value: string | number, vars: Record<string, string | number>, visited: Set<string>): string | number {
	if (typeof value === "number" || value === "" || value.startsWith("#")) return value;
	if (visited.has(value)) throw new Error(`Circular variable reference detected: ${value}`);
	const next = vars[value];
	if (next === undefined) throw new Error(`Variable reference not found: ${value}`);
	visited.add(value);
	return resolveVarRef(next, vars, visited);
}

export function resolveThemeColors(
	colors: Record<string, string | number>,
	vars: Record<string, string | number>,
): Record<string, string | number> {
	const out: Record<string, string | number> = {};
	for (const [key, value] of Object.entries(colors)) out[key] = resolveVarRef(value, vars, new Set());
	return out;
}

export function withThemeColorFallbacks(colors: Record<string, string | number>): Record<string, string | number> {
	return {
		...colors,
		thinkingMax: colors.thinkingMax ?? colors.thinkingXhigh,
		scrollbarThumb: colors.scrollbarThumb ?? colors.selectedBg,
		searchMatchBg: colors.searchMatchBg ?? colors.selectedBg,
		searchMatchText: colors.searchMatchText ?? colors.text,
	};
}

export const BG_TOKEN_KEYS = new Set([
	"selectedBg", "scrollbarThumb", "searchMatchBg", "userMessageBg", "customMessageBg",
	"toolPendingBg", "toolSuccessBg", "toolErrorBg",
]);

export function splitThemeColors(colors: Record<string, string | number>): {
	fgColors: Record<string, string | number>;
	bgColors: Record<string, string | number>;
} {
	const fgColors: Record<string, string | number> = {};
	const bgColors: Record<string, string | number> = {};
	for (const [key, value] of Object.entries(colors)) (BG_TOKEN_KEYS.has(key) ? bgColors : fgColors)[key] = value;
	return { fgColors, bgColors };
}

export interface PiThemeModule {
	Theme: typeof Theme;
	loadThemeFromPath(path: string, mode?: string): Theme;
	detectTerminalBackgroundFromEnv(options?: { env?: NodeJS.ProcessEnv }): { theme: "dark" | "light" };
}
let cachedPiThemeModule: Promise<PiThemeModule> | undefined;
export function loadPiThemeModule(): Promise<PiThemeModule> {
	if (!cachedPiThemeModule) {
		cachedPiThemeModule = (async () => {
			const resolved = import.meta.resolve("@earendil-works/pi-coding-agent");
			const dist = path.dirname(fileURLToPath(resolved));
			const themePath = path.join(dist, "modes", "interactive", "theme", "theme.js");
			return (await import(themePath)) as unknown as PiThemeModule;
		})();
	}
	return cachedPiThemeModule;
}

export async function materializeTheme(
	config: ThemeSection,
	variant: "dark" | "light",
	mode: "truecolor" | "256color" = buildMode(),
): Promise<Theme> {
	const base = loadShippedTheme(variant);
	const block = variant === "dark" ? config.dark : config.light;
	const merged = mergeThemeSection(base, block);
	const resolved = resolveThemeColors(withThemeColorFallbacks(merged.colors), merged.vars);
	const { fgColors, bgColors } = splitThemeColors(resolved);
	const mod = await loadPiThemeModule();
	return new mod.Theme(fgColors, bgColors, mode);
}

export interface ThemeSettingsFiles { globalFile: string; projectFile: string; }

export function defaultThemeSettingsFiles(repoRoot: string): ThemeSettingsFiles {
	return {
		globalFile: path.join(getAgentDir(), "settings.json"),
		projectFile: path.join(repoRoot, CONFIG_DIR_NAME, "settings.json"),
	};
}

function readThemeLeaf(file: string): unknown {
	try {
		const parsed = JSON.parse(fs.readFileSync(file, "utf-8"));
		if (parsed && typeof parsed === "object" && !Array.isArray(parsed) && "theme" in parsed) {
			return (parsed as Record<string, unknown>).theme;
		}
	} catch { /* unreadable settings files count as absent */ }
	return undefined;
}

export function readRawThemeSetting(files: ThemeSettingsFiles): unknown {
	const globalLeaf = readThemeLeaf(files.globalFile);
	const projectLeaf = readThemeLeaf(files.projectFile);
	return projectLeaf !== undefined ? projectLeaf : globalLeaf; // project wins at the leaf
}

export interface ActivateThemeOptions { settingsFiles?: ThemeSettingsFiles; }

export async function activateTheme(ctx: ExtensionContext, repoRoot: string, opts: ActivateThemeOptions = {}): Promise<void> {
	try {
		const config = loadThemeConfig(repoRoot);
		if (config === undefined) return; // no section -> silent noop; no settings reads, no setTheme
		const raw = readRawThemeSetting(opts.settingsFiles ?? defaultThemeSettingsFiles(repoRoot));
		const terminal = (await loadPiThemeModule()).detectTerminalBackgroundFromEnv().theme;
		const pin = config.variant === "auto" ? undefined : config.variant;
		const decision = decideThemeActivation(config, raw, pin, terminal);
		if (decision.action === "activate") {
			const instance = await materializeTheme(config, decision.variant);
			ctx.ui.setTheme(instance); // instanceof-Theme branch: no settingsManager writes
			if (ctx.hasUI) ctx.ui.notify(`council theme: pi-council-${decision.variant}`, "info");
		} else if (decision.action === "block") {
			if (ctx.hasUI) ctx.ui.notify(`council theme: blocked (settings.json has '${decision.themeName}')`, "warning");
		}
	} catch (err) {
		if (ctx.hasUI) ctx.ui.notify(`council theme: ${err instanceof Error ? err.message : String(err)}`, "warning");
	}
}
```

(Add the `loadThemeConfig` import to the module header: `import { loadShippedTheme, mergeThemeSection, loadThemeConfig, type ThemeSection } from "./seats.ts";`.)
