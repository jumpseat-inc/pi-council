import { test, expect } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import type { SettingsManager } from "@earendil-works/pi-coding-agent";
import { loadThemeModule } from "./theme-loader.ts";
import { PKG_ROOT, loadThemeConfig } from "../extensions/seats.ts";

const THEMES_DIR = path.join(PKG_ROOT, "themes");
const FIXTURES_DIR = path.join(PKG_ROOT, "test", "fixtures", "omp");
const SHIPPED = {
	dark: path.join(THEMES_DIR, "pi-council-dark.json"),
	light: path.join(THEMES_DIR, "pi-council-light.json"),
} as const;

/** The 51 required pi color tokens — also the 51 live omp tokens. */
const REQUIRED_51 = [
	"accent", "border", "borderAccent", "borderMuted", "success", "error", "warning",
	"muted", "dim", "text", "thinkingText", "selectedBg", "userMessageBg",
	"userMessageText", "customMessageBg", "customMessageText", "customMessageLabel",
	"toolPendingBg", "toolSuccessBg", "toolErrorBg", "toolTitle", "toolOutput",
	"mdHeading", "mdLink", "mdLinkUrl", "mdCode", "mdCodeBlock", "mdCodeBlockBorder",
	"mdQuote", "mdQuoteBorder", "mdHr", "mdListBullet", "toolDiffAdded",
	"toolDiffRemoved", "toolDiffContext", "syntaxComment", "syntaxKeyword",
	"syntaxFunction", "syntaxVariable", "syntaxString", "syntaxNumber", "syntaxType",
	"syntaxOperator", "syntaxPunctuation", "thinkingOff", "thinkingMinimal",
	"thinkingLow", "thinkingMedium", "thinkingHigh", "thinkingXhigh", "bashMode",
] as const;

/**
 * Installed pi version — resolved exactly like the FLLWUP-21 env-split tests
 * resolve theirs (import.meta.resolve → package root → package.json). The
 * gates run this exact installed machinery, so P is the locked band.
 */
const ENTRY_PATH = fileURLToPath(import.meta.resolve("@earendil-works/pi-coding-agent"));
if (!ENTRY_PATH.endsWith(`${path.sep}dist${path.sep}index.js`)) {
	throw new Error(`FLLWUP-22: package entry resolved to unexpected path ${ENTRY_PATH}`);
}
const PI_PKG_ROOT = path.dirname(path.dirname(ENTRY_PATH));
const PI_VERSION = (JSON.parse(fs.readFileSync(path.join(PI_PKG_ROOT, "package.json"), "utf-8")) as { version: string }).version;
function semverAtLeast(v: string, target: string): boolean {
	const a = v.split(".").map((n) => parseInt(n, 10));
	const b = target.split(".").map((n) => parseInt(n, 10));
	for (let i = 0; i < Math.max(a.length, b.length); i++) {
		const x = a[i] ?? 0;
		const y = b[i] ?? 0;
		if (x !== y) return x > y;
	}
	return true;
}
/** 0.85.x moved scrollbarThumb to the fg map (?? text) and added
 * scrollbarTrack (fg, ?? muted); 0.84.3 resolves it in bg (?? selectedBg). */
const PI_GE_085 = semverAtLeast(PI_VERSION, "0.85.0");

function readTheme(file: string): RawTheme {
	return JSON.parse(fs.readFileSync(file, "utf-8")) as RawTheme;
}

interface RawTheme {
	$schema?: string;
	name: string;
	vars: Record<string, string>;
	colors: Record<string, string>;
	export: Record<string, string>;
}

/** The vendored omp fixture shape — colors may carry 256-index integers in the dead keys. */
interface OmpFixture {
	name: string;
	vars: Record<string, string>;
	colors: Record<string, string | number>;
	export: Record<string, string>;
}

function deadKeys(colors: Record<string, unknown>): string[] {
	return [
		...Object.keys(colors).filter((k) => k.startsWith("statusLine")),
		"link",
		"pythonMode",
	];
}

/** Same transform the shipped file applies: strip dead keys, rename, pi $schema. */
function trimFixture(raw: OmpFixture, name: string): RawTheme {
	const colors = Object.fromEntries(
		Object.entries(raw.colors).filter(([k]) => !deadKeys(raw.colors).includes(k)),
	) as Record<string, string>;
	return {
		$schema: "https://raw.githubusercontent.com/earendil-works/pi/main/packages/coding-agent/src/modes/interactive/theme/theme-schema.json",
		name,
		vars: raw.vars,
		colors,
		export: raw.export,
	};
}

/**
 * collectPackageResources/createAccumulator are private in pi's .d.ts but are
 * the runtime path the package uses to collect shipped themes (no settings
 * access with filter === undefined). Cast through unknown to drive the real
 * code — white-box, not a reimplementation.
 */
interface PackageManagerSurface {
	createAccumulator(): { themes: Map<string, { metadata: unknown; enabled: boolean }> };
	collectPackageResources(
		root: string,
		acc: { themes: Map<string, unknown> },
		filter: undefined,
		metadata: unknown,
	): boolean;
}

async function managerFor(root: string): Promise<PackageManagerSurface> {
	const { DefaultPackageManager } = (await import("@earendil-works/pi-coding-agent")) as unknown as {
		DefaultPackageManager: new (opts: {
			cwd: string;
			agentDir: string;
			settingsManager: SettingsManager;
		}) => PackageManagerSurface;
	};
	return new DefaultPackageManager({
		cwd: root,
		agentDir: root,
		settingsManager: null as unknown as SettingsManager,
	});
}

const metadata = { source: "test", scope: "project", origin: "test", baseDir: PKG_ROOT };

test("T1 package shape + location: pi.themes lists both literal paths; files exist at PKG_ROOT/themes", () => {
	const pkg = JSON.parse(fs.readFileSync(path.join(PKG_ROOT, "package.json"), "utf-8"));
	expect(pkg.pi.themes).toEqual(["./themes"]);
	for (const file of [SHIPPED.dark, SHIPPED.light]) {
		expect(fs.existsSync(file)).toBe(true);
	}
});

test("T2 discovery via real pi code: collectPackageResources lands both files in acc.themes enabled", async () => {
	const manager = await managerFor(PKG_ROOT);
	const acc = manager.createAccumulator();
	const collected = manager.collectPackageResources(PKG_ROOT, acc, undefined, metadata);
	expect(collected).toBe(true);
	const entries = Array.from(acc.themes.entries());
	expect(entries.map(([p]) => path.basename(p)).sort()).toEqual([
		"pi-council-dark.json",
		"pi-council-light.json",
	]);
	expect(entries.every(([, v]) => v.enabled)).toBe(true);
});

test("T3 convention-dir refutation: themes/ dir alone collects 0 under a pi manifest; the entry collects them", async () => {
	const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "pi-council-pkg-"));
	fs.mkdirSync(path.join(tmp, "themes"), { recursive: true });
	fs.copyFileSync(SHIPPED.dark, path.join(tmp, "themes", "pi-council-dark.json"));
	const pkgPath = path.join(tmp, "package.json");
	fs.writeFileSync(
		pkgPath,
		JSON.stringify({ name: "fixture-pkg", version: "0.0.0", pi: { extensions: ["./extensions"] } }),
	);
	const manager = await managerFor(tmp);
	const acc = manager.createAccumulator();
	manager.collectPackageResources(tmp, acc, undefined, { ...metadata, baseDir: tmp });
	expect(acc.themes.size).toBe(0);
	const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
	pkg.pi.themes = ["./themes"];
	fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
	const acc2 = manager.createAccumulator();
	manager.collectPackageResources(tmp, acc2, undefined, { ...metadata, baseDir: tmp });
	expect(acc2.themes.size).toBe(1);
});

test("T4 validation + identity: loadThemeFromPath no-throw; name is exactly pi-council-dark/light", async () => {
	const mod = await loadThemeModule();
	expect(mod.loadThemeFromPath(SHIPPED.dark, "truecolor").name).toBe("pi-council-dark");
	expect(mod.loadThemeFromPath(SHIPPED.light, "truecolor").name).toBe("pi-council-light");
});

test("T5 registration chain: setRegisteredThemes -> getThemeByName; hijack guard; family name; pi-owned resolved keys", async () => {
	const mod = await loadThemeModule();
	mod.setRegisteredThemes([
		mod.loadThemeFromPath(SHIPPED.dark, "truecolor"),
		mod.loadThemeFromPath(SHIPPED.light, "truecolor"),
	]);
	const t = mod.getThemeByName("pi-council-dark");
	expect(t).toBeInstanceOf(mod.Theme);
	expect(t?.name).toBe("pi-council-dark");
	// hijack guard: built-in "dark" still resolves to pi's built-in
	expect(mod.getThemeByName("dark")?.name).toBe("dark");
	// family name is prose-only — never a theme name (NAME-1)
	expect(mod.getThemeByName("pi-council")).toBeUndefined();
	const resolved = mod.getResolvedThemeColors("pi-council-dark");
	// pi-owned key count — the map is 51 shipped + pi's fallback fills. The
	// count is version-parameterized (55 on 0.84.3; 56 once scrollbarTrack
	// joins the map on 0.85.x), never a hardcoded council literal.
	for (const k of [...REQUIRED_51, "thinkingMax", "searchMatchBg", "searchMatchText", "scrollbarThumb"]) {
		expect(Object.keys(resolved), `resolved map missing ${k}`).toContain(k);
	}
	expect(Object.keys(resolved)).toHaveLength(PI_GE_085 ? 56 : 55);
});

test("T6 full-map equality: shipped resolved map === reference derived from vendored omp fixture, both through pi's resolver", async () => {
	const mod = await loadThemeModule();
	const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "pi-council-ref-"));
	const refPaths: string[] = [];
	for (const [variant, name] of [
		["dark", "pi-council-dark-ref"],
		["light", "pi-council-light-ref"],
	] as const) {
		const raw = JSON.parse(fs.readFileSync(path.join(FIXTURES_DIR, `${variant}.json`), "utf-8")) as OmpFixture;
		const refPath = path.join(tmp, `${variant}-ref.json`);
		fs.writeFileSync(refPath, JSON.stringify(trimFixture(raw, name), null, "\t"));
		refPaths.push(refPath);
	}
	mod.setRegisteredThemes([
		mod.loadThemeFromPath(SHIPPED.dark, "truecolor"),
		mod.loadThemeFromPath(SHIPPED.light, "truecolor"),
		mod.loadThemeFromPath(refPaths[0], "truecolor"),
		mod.loadThemeFromPath(refPaths[1], "truecolor"),
	]);
	for (const [shipped, ref] of [
		["pi-council-dark", "pi-council-dark-ref"],
		["pi-council-light", "pi-council-light-ref"],
	] as const) {
		const shippedMap = mod.getResolvedThemeColors(shipped);
		const refMap = mod.getResolvedThemeColors(ref);
		// count is pi-owned and version-parameterized — pinned in T5; the
		// equality below is the band-stable oracle (Skeptic obj 7d).
		expect(shippedMap).toEqual(refMap);
	}
});

test("T7 raw-JSON invariants: var-refs verbatim with real omp names; every var-ref resolves; four '' survive; no dead keys; optional tokens equal fallback sources after resolution", async () => {
	const mod = await loadThemeModule();
	mod.setRegisteredThemes([
		mod.loadThemeFromPath(SHIPPED.dark, "truecolor"),
		mod.loadThemeFromPath(SHIPPED.light, "truecolor"),
	]);
	const expectedRefs: Record<string, Record<string, string>> = {
		"pi-council-dark": { accent: "accent", border: "blue" },
		"pi-council-light": { accent: "teal", border: "blue" },
	};
	for (const [variant, shippedPath, name] of [
		["dark", SHIPPED.dark, "pi-council-dark"],
		["light", SHIPPED.light, "pi-council-light"],
	] as const) {
		const raw = readTheme(shippedPath);
		expect(raw.name).toBe(name);
		const colors = raw.colors as Record<string, string>;
		const vars = (raw.vars ?? {}) as Record<string, string>;
		// var-refs verbatim with real omp names
		for (const [token, ref] of Object.entries(expectedRefs[name])) {
			expect(colors[token]).toBe(ref);
		}
		// every var-ref resolves to a declared var
		for (const [token, value] of Object.entries(colors)) {
			if (typeof value === "string" && value !== "" && !value.startsWith("#")) {
				expect(Object.keys(vars), `${token} -> ${value} in ${name}`).toContain(value);
			}
		}
		// four "" defaults survive
		for (const token of ["text", "userMessageText", "customMessageText", "toolTitle"]) {
			expect(colors[token], `${token} in ${name}`).toBe("");
		}
		// no dead keys
		for (const token of deadKeys(colors)) {
			expect(colors[token]).toBeUndefined();
		}
		// band-stable optional tokens equal their fallback sources after resolution
		const resolved = mod.getResolvedThemeColors(name);
		expect(resolved.searchMatchBg).toBe(resolved.selectedBg);
		expect(resolved.searchMatchText).toBe(resolved.text);
		expect(resolved.thinkingMax).toBe(resolved.thinkingXhigh);
		// shipped-file provenance: the council ships NEITHER scrollbar key —
		// placement identity is delegated to the installed Theme constructor
		// (0.84.3 bg ?? selectedBg / 0.85.x fg ?? text, track ?? muted).
		expect(Object.keys(colors)).not.toContain("scrollbarThumb");
		expect(Object.keys(colors)).not.toContain("scrollbarTrack");
	}
	// the fixture itself is the provenance: shipped vars/colors values are byte-identical to the trimmed fixture
	for (const [variant, shippedPath] of [
		["dark", SHIPPED.dark],
		["light", SHIPPED.light],
	] as const) {
		const raw = JSON.parse(fs.readFileSync(path.join(FIXTURES_DIR, `${variant}.json`), "utf-8")) as OmpFixture;
		const shipped = readTheme(shippedPath);
		const trimmed = trimFixture(raw, shipped.name);
		expect(shipped.vars).toEqual(trimmed.vars);
		expect(shipped.colors).toEqual(trimmed.colors);
		expect(shipped.export).toEqual(trimmed.export);
	}
});

test("T8 export section: getThemeExportColors matches omp export verbatim", async () => {
	const mod = await loadThemeModule();
	mod.setRegisteredThemes([
		mod.loadThemeFromPath(SHIPPED.dark, "truecolor"),
		mod.loadThemeFromPath(SHIPPED.light, "truecolor"),
	]);
	expect(mod.getThemeExportColors("pi-council-dark")).toEqual({
		pageBg: "#18181e",
		cardBg: "#1e1e24",
		infoBg: "#26262e",
	});
	expect(mod.getThemeExportColors("pi-council-light")).toEqual({
		pageBg: "#f8f8f8",
		cardBg: "#ffffff",
		infoBg: "#fffae6",
	});
});

test("brand-anchor spotlight: resolved values fail loudly with a one-line diagnostic", async () => {
	const mod = await loadThemeModule();
	mod.setRegisteredThemes([
		mod.loadThemeFromPath(SHIPPED.dark, "truecolor"),
		mod.loadThemeFromPath(SHIPPED.light, "truecolor"),
	]);
	const dark = mod.getResolvedThemeColors("pi-council-dark");
	const light = mod.getResolvedThemeColors("pi-council-light");
	const anchors: Array<[string, Record<string, string>, string, string]> = [
		["dark", dark, "accent", "#febc38"],
		["dark", dark, "border", "#178fb9"],
		["dark", dark, "borderAccent", "#0088fa"],
		["dark", dark, "customMessageLabel", "#b281d6"],
		["dark", dark, "mdCodeBlock", "#9CDCFE"],
		["dark", dark, "syntaxKeyword", "#569CD6"],
		["light", light, "accent", "#5a8080"],
		["light", light, "border", "#547da7"],
		["light", light, "syntaxString", "#A31515"],
	];
	for (const [variant, map, token, hex] of anchors) {
		expect(map[token], `${variant} ${token} (brand anchor)`).toBe(hex);
	}
	// four "" defaults must resolve to the CSS-export fallback, not a substituted hex
	for (const token of ["text", "userMessageText", "customMessageText", "toolTitle"]) {
		expect(dark[token], `dark ${token}`).toBe("#e5e5e7");
		expect(light[token], `light ${token}`).toBe("#e5e5e7");
	}
	// export tokens
	expect(mod.getThemeExportColors("pi-council-dark")).toEqual({
		pageBg: "#18181e",
		cardBg: "#1e1e24",
		infoBg: "#26262e",
	});
	expect(mod.getThemeExportColors("pi-council-light")).toEqual({
		pageBg: "#f8f8f8",
		cardBg: "#ffffff",
		infoBg: "#fffae6",
	});
});

test("drift characterization: scrollbar tokens track the installed pi regime; allowlist accepts both", async () => {
	const mod = await loadThemeModule();
	mod.setRegisteredThemes([mod.loadThemeFromPath(SHIPPED.dark, "truecolor")]);
	const resolved = mod.getResolvedThemeColors("pi-council-dark");
	if (PI_GE_085) {
		// 0.85.x: scrollbarThumb resolves in fg with text fallback; scrollbarTrack
		// is new (fg, muted fallback). The shipped file declares neither, so these
		// are pi's bundled-default fills — the exact drift this card names.
		expect(resolved.scrollbarThumb).toBe(resolved.text);
		expect(resolved.scrollbarTrack).toBe(resolved.muted);
	} else {
		// 0.84.3: scrollbarThumb resolves in bg with selectedBg fallback; no
		// scrollbarTrack token exists in the machinery.
		expect(resolved.scrollbarThumb).toBe(resolved.selectedBg);
		expect(resolved.scrollbarTrack).toBeUndefined();
	}
	// Allowlist acceptance (recorded discretion): a consumer may declare the
	// new 0.85.x scrollbarTrack — VALID_COLOR_KEYS must not throw, or the
	// swallowed throw silently deactivates the whole theme (Skeptic obj 5).
	const allowRoot = fs.mkdtempSync(path.join(os.tmpdir(), "fllwup22-allowlist-"));
	fs.writeFileSync(
		path.join(allowRoot, ".council.json"),
		JSON.stringify({ theme: { dark: { colors: { scrollbarThumb: "#123456", scrollbarTrack: "#654321" } } } }),
	);
	expect(() => loadThemeConfig(allowRoot)).not.toThrow();
	fs.rmSync(allowRoot, { recursive: true, force: true });
});

test("var-ref preservation probe: mutating vars.accent re-resolves the dependent colors", async () => {
	const mod = await loadThemeModule();
	const raw = readTheme(SHIPPED.dark);
	const mutated = {
		...raw,
		name: "pi-council-dark-mutated",
		vars: { ...raw.vars, accent: "#ff00ff" },
	};
	const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "pi-council-probe-"));
	const mutatedPath = path.join(tmp, "pi-council-dark-mutated.json");
	fs.writeFileSync(mutatedPath, JSON.stringify(mutated, null, "\t"));
	mod.setRegisteredThemes([mod.loadThemeFromPath(mutatedPath, "truecolor")]);
	const resolved = mod.getResolvedThemeColors("pi-council-dark-mutated");
	expect(resolved.accent).toBe("#ff00ff");
	// mdListBullet is "accent" in dark — the var-ref must transitively recolor
	expect(resolved.mdListBullet).toBe("#ff00ff");
});
