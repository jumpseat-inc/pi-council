import * as fs from "node:fs";
import * as path from "node:path";
import { pathToFileURL } from "node:url";
import { CONFIG_DIR_NAME, getAgentDir, getPackageDir, Theme, type ExtensionContext } from "@earendil-works/pi-coding-agent";
import { getCapabilities } from "@earendil-works/pi-tui";
import { loadShippedTheme, loadThemeConfig, mergeThemeSection, type ThemeSection } from "./seats.ts";

// ---------------------------------------------------------------------------
// EV-3: activate the council theme on session start.
//
// Pure decision + construction helpers live here so they are unit-testable
// without a real TUI; pi's real Theme, detectTerminalBackgroundFromEnv and
// getCapabilities are reached by (deep-)import at runtime.
// In-memory only: `new Theme(...)` + `ui.setTheme(instance)` — zero
// settingsManager writes, no tempfile, no on-disk theme, no name
// registration (those are EV-4).
// ---------------------------------------------------------------------------

export type ThemeActivationDecision =
	| { action: "activate"; variant: "dark" | "light" }
	| { action: "noop" }
	| { action: "block"; themeName: string };

/**
 * The only raw settings leaves that allow council activation. `"light/dark"`
 * is pi's auto-follow setting (not an explicit theme choice); `"dark"` /
 * `"light"` are persisted explicit choices for the same family. Everything
 * else — including a custom `A/B` pair like `"nord-light/nord-dark"` — is a
 * concrete named arrangement and blocks. Never route through
 * parseAutoThemeSetting / resolveThemeSetting (both invert custom pairs).
 */
const ACTIVATION_WHITELIST = new Set(["light/dark", "dark", "light"]);

/**
 * Pure — no I/O, no TUI. The caller passes the raw values read off disk.
 * `config === undefined` is the rapid gate: noop, reads no settings.
 */
export function decideThemeActivation(
	config: ThemeSection | undefined,
	rawSetting: unknown, // the raw settings.json "theme" leaf, project-wins-resolved
	configVariantPin?: "dark" | "light", // from config.variant when !== "auto"
	terminalTheme?: "dark" | "light", // detectTerminalBackgroundFromEnv() result, sync
): ThemeActivationDecision {
	if (config === undefined) return { action: "noop" };
	const whitelisted = rawSetting === undefined || (typeof rawSetting === "string" && ACTIVATION_WHITELIST.has(rawSetting));
	if (whitelisted) return { action: "activate", variant: configVariantPin ?? terminalTheme ?? "dark" };
	return { action: "block", themeName: typeof rawSetting === "string" ? rawSetting : String(rawSetting) };
}

/**
 * Mode detection — getCapabilities comes from @earendil-works/pi-tui (the
 * module pi's own createTheme imports it from); it is NOT on the
 * pi-coding-agent public API (Skeptic #6 closed-red).
 */
export function buildMode(caps?: { trueColor: boolean }): "truecolor" | "256color" {
	return (caps?.trueColor ?? getCapabilities().trueColor) ? "truecolor" : "256color";
}

/**
 * Resolve var-refs to concrete hex — mirrors pi's internal resolveVarRef
 * (theme.js). Must run BEFORE `new Theme(...)`: pi's constructor throws on a
 * non-hex var-ref.
 */
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

// [ev4-palette-table] basicColors is the same data table pi's unexported
// ansi256ToHex uses (theme.js ~line 794). It is converter data, not drawing
// color — the EV-4 zero-hex audit (test/theme-compliance.test.ts) whitelists
// exactly this region via the marker tags.
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

/**
 * Pure after the optional config read: the MERGED resolved hex map a variant's
 * in-memory Theme is built from (EV-3 chain), with any 256-index integers
 * hexed via ansi256ToHex. `""` passes through (pi's default-terminal-fg
 * sentinel — never invented into a color). config reads from
 * <repoRoot>/.council.json only when no override is passed.
 */
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

/**
 * Apply pi's internal fallback chain with `??` semantics on the merged colors
 * BEFORE construction. The Theme constructor applies the same fallbacks
 * itself, so doing it first is idempotent and mirrors `withThemeColorFallbacks`.
 */
/**
 * Apply pi's internal fallback chain with `??` semantics on the merged colors
 * BEFORE construction. The Theme constructor applies the same fallbacks
 * itself, so doing it first is idempotent and mirrors `withThemeColorFallbacks`.
 *
 * Trim-only (FLLWUP-22): mirrors the three BAND-STABLE fallback sources only
 * (`thinkingMax`/`searchMatchBg`/`searchMatchText` — probe-verified identical
 * on 0.84.3 and 0.85.x). The scrollbar thumb is deliberately NOT mirrored:
 * its source is regime-dependent (0.84.3 bg `?? selectedBg`; 0.85.x fg
 * `?? text`), so it is delegated to the installed Theme constructor's own
 * regime-correct fallback — this helper never reimplements it.
 */
export function withThemeColorFallbacks(colors: Record<string, string | number>): Record<string, string | number> {
	return {
		...colors,
		thinkingMax: colors.thinkingMax ?? colors.thinkingXhigh,
		searchMatchBg: colors.searchMatchBg ?? colors.selectedBg,
		searchMatchText: colors.searchMatchText ?? colors.text,
	};
}

/** The 7 bg keys — everything else is fg. FLLWUP-22: scrollbarThumb is dropped
 * (0.85.x removed it from ThemeBg; the installed constructor routes it via fg). */
export const BG_TOKEN_KEYS = new Set([
	"selectedBg", "searchMatchBg", "userMessageBg", "customMessageBg",
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
	getThemeByName(name: string): Theme | undefined;
	setRegisteredThemes(themes: Theme[]): void;
	detectTerminalBackgroundFromEnv(options?: { env?: NodeJS.ProcessEnv }): { theme: "dark" | "light" };
	// EV-4 §5: pi's theme.js also exports the live Proxy (`theme`, reads
	// globalThis at call time) and setThemeInstance (swaps the global, fires
	// onThemeChange). Declared so the repaint pinning tests can drive the
	// real TUI swap; the extension itself NEVER calls setThemeInstance.
	theme: Theme;
	setThemeInstance(theme: Theme): void;
}
/**
 * Pure — resolve the on-disk path of pi's real theme module (Theme class +
 * the internal-only exports the extension needs: detectTerminalBackgroundFromEnv,
 * the live `theme` proxy, setThemeInstance, setRegisteredThemes, loadThemeFromPath,
 * getThemeByName). Package-specifier deep imports are blocked by pi's exports
 * map (only ".", "./rpc-entry", "./client" are exported), so we walk from pi's
 * OWN install root into the same file interactive-mode.js imports.
 *
 * IMPORTANT: never resolve this via `import.meta.resolve("@earendil-works/pi-coding-agent")`.
 * That works in this repo's dev tree (the peer is in its node_modules) but THROWS
 * in an installed package: the plugin clone under ~/.pi/agent/git/<owner>/pi-council
 * does not materialize the @earendil-works/pi-coding-agent peer in its node_modules,
 * so the bare-specifier filesystem walk fails and the council theme is never applied
 * (surfacing as the "Cannot find module '@earendil-works/pi-coding-agent'" warning).
 * Pi's public getPackageDir() is stable across npm / tsx / bun-binary installs and
 * is exactly what this walk needs.
 */
export function resolveThemeJsPath(packageDir: string): string | null {
	// dist build (npm/tsx) ships the compiled theme bundle; tsx source runtime
	// serves the same module as theme.ts; the bun binary bundles it and only
	// exposes the theme dir of standalone theme files (no theme.js on disk).
	const candidates = [
		path.join(packageDir, "dist", "modes", "interactive", "theme", "theme.js"),
		path.join(packageDir, "src", "modes", "interactive", "theme", "theme.ts"),
	];
	return candidates.find((c) => fs.existsSync(c)) ?? null;
}

let cachedPiThemeModule: Promise<PiThemeModule> | undefined;

/**
 * Deep-import pi's real theme module (dist/modes/interactive/theme/theme.js)
 * — the same file interactive-mode.js imports, so `instanceof Theme` in pi's
 * setTheme branch holds at runtime. The module lives under pi's own install
 * root (getPackageDir), NOT the plugin's node_modules, so the walk is stable
 * for installed packages. On a bun-binary install the theme module is bundled
 * (not on disk); the public `Theme` class still imports fine, so we fall back
 * to a module exposing the public Theme identity and leave the internal-only
 * members undefined (activation degrades: terminal auto-detection skipped).
 */
export function loadPiThemeModule(): Promise<PiThemeModule> {
	if (!cachedPiThemeModule) {
		cachedPiThemeModule = (async () => {
			const themePath = resolveThemeJsPath(getPackageDir());
			if (themePath !== null) {
				return (await import(pathToFileURL(themePath).href)) as unknown as PiThemeModule;
			}
			// bun binary: theme.js is embedded, not a real file. The public entry
			// re-exports the SAME Theme class from the same theme.js module, so
			// constructor identity holds; internal-only helpers are unavailable.
			return { Theme } as unknown as PiThemeModule;
		})();
	}
	return cachedPiThemeModule;
}

/**
 * Materialize the merged theme into pi's real Theme instance, IN MEMORY.
 * base = shipped asset (PKG_ROOT, never getPackageDir), merged with the repo's
 * per-variant override block, var-refs resolved to hex, the 8 bg keys split
 * out, mode from getCapabilities, then `new Theme(fgColors, bgColors, mode)`.
 */
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
	// The merged maps are runtime-validated against the shipped key sets; the deep-imported
	// class is typed by the public API and its constructor demands the full ThemeColor/ThemeBg
	// record shapes, so pin the exact constructor parameter types here.
	return new mod.Theme(
		fgColors as ConstructorParameters<typeof mod.Theme>[0],
		bgColors as ConstructorParameters<typeof mod.Theme>[1],
		mode,
	);
}

export interface ThemeSettingsFiles {
	globalFile: string;
	projectFile: string;
}

/** Default settings.json locations: global agent dir + repo-local. */
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
	} catch { /* unreadable settings count as absent */ }
	return undefined;
}

/** Raw settings.json "theme" leaf; project wins at the leaf. */
export function readRawThemeSetting(files: ThemeSettingsFiles): unknown {
	const globalLeaf = readThemeLeaf(files.globalFile);
	const projectLeaf = readThemeLeaf(files.projectFile);
	return projectLeaf !== undefined ? projectLeaf : globalLeaf;
}

export interface ActivateThemeOptions { settingsFiles?: ThemeSettingsFiles; }

/**
 * Session-start glue: load config (undefined → silent noop), read the raw
 * settings theme leaf off disk, decide, then either activate the in-memory
 * Theme (instanceof-Theme branch of ui.setTheme → ZERO settingsManager
 * writes) or notify a block. The whole block is try/caught so a malformed
 * .council.json / unexpected throw notifies and returns — it never crashes
 * session_start. Notify strings are plain text, guard with hasUI.
 */
export async function activateTheme(ctx: ExtensionContext, repoRoot: string, opts: ActivateThemeOptions = {}): Promise<void> {
	try {
		const config = loadThemeConfig(repoRoot);
		if (config === undefined) return; // no section -> silent noop, no settings reads, no setTheme
		const raw = readRawThemeSetting(opts.settingsFiles ?? defaultThemeSettingsFiles(repoRoot));
		const themeMod = await loadPiThemeModule();
		const terminal =
			// detectTerminalBackgroundFromEnv is an internal-only theme.js export;
			// it is absent on a bun-binary install (theme module is bundled), so
			// fall back to 'dark' rather than throwing a spurious warning.
			themeMod.detectTerminalBackgroundFromEnv?.().theme ?? "dark";
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