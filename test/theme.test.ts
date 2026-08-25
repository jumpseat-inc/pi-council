import { test, expect } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { loadThemeModule } from "./theme-loader.ts";
import { PKG_ROOT } from "../extensions/seats.ts";

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

/** The 4 optional tokens — OMITTED from the shipped file, filled by withThemeColorFallbacks. */
const OPTIONAL_4 = ["scrollbarThumb", "searchMatchBg", "searchMatchText", "thinkingMax"] as const;

function readTheme(file: string): Record<string, unknown> {
	return JSON.parse(fs.readFileSync(file, "utf-8"));
}

function deadKeys(colors: Record<string, unknown>): string[] {
	return [
		...Object.keys(colors).filter((k) => k.startsWith("statusLine")),
		"link",
		"pythonMode",
	];
}

/** Same transform the shipped file applies: strip dead keys, rename, pi $schema. */
function trimFixture(raw: Record<string, unknown>, name: string): Record<string, unknown> {
	const colors = Object.fromEntries(
		Object.entries(raw.colors as Record<string, unknown>).filter(
			([k]) => !deadKeys(raw.colors as Record<string, unknown>).includes(k),
		),
	);
	return {
		$schema: "https://raw.githubusercontent.com/earendil-works/pi/main/packages/coding-agent/src/modes/interactive/theme/theme-schema.json",
		name,
		vars: raw.vars,
		colors,
		export: raw.export,
	};
}

async function managerFor(root: string) {
	const { DefaultPackageManager } = (await import("@earendil-works/pi-coding-agent")) as {
		DefaultPackageManager: new (opts: { cwd: string; agentDir: string; settingsManager: null }) => {
			createAccumulator(): { themes: Map<string, { metadata: unknown; enabled: boolean }> };
			collectPackageResources(
				root: string,
				acc: { themes: Map<string, unknown> },
				filter: undefined,
				metadata: unknown,
			): boolean;
		};
	};
	return new DefaultPackageManager({ cwd: root, agentDir: root, settingsManager: null });
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

test("T5 registration chain: setRegisteredThemes -> getThemeByName; hijack guard; family name; 55 resolved keys", async () => {
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
	expect(Object.keys(resolved)).toHaveLength(55);
});

test("T6 full-map equality: shipped resolved map === reference derived from vendored omp fixture, both through pi's resolver", async () => {
	const mod = await loadThemeModule();
	const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "pi-council-ref-"));
	const refPaths: string[] = [];
	for (const [variant, name] of [
		["dark", "pi-council-dark-ref"],
		["light", "pi-council-light-ref"],
	] as const) {
		const raw = JSON.parse(fs.readFileSync(path.join(FIXTURES_DIR, `${variant}.json`), "utf-8"));
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
		expect(Object.keys(shippedMap)).toHaveLength(55);
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
		// optional tokens equal their fallback sources after resolution
		const resolved = mod.getResolvedThemeColors(name);
		expect(resolved.scrollbarThumb).toBe(resolved.selectedBg);
		expect(resolved.searchMatchBg).toBe(resolved.selectedBg);
		expect(resolved.searchMatchText).toBe(resolved.text);
		expect(resolved.thinkingMax).toBe(resolved.thinkingXhigh);
	}
	// the fixture itself is the provenance: shipped vars/colors values are byte-identical to the trimmed fixture
	for (const [variant, shippedPath] of [
		["dark", SHIPPED.dark],
		["light", SHIPPED.light],
	] as const) {
		const raw = JSON.parse(fs.readFileSync(path.join(FIXTURES_DIR, `${variant}.json`), "utf-8"));
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

test("var-ref preservation probe: mutating vars.accent re-resolves the dependent colors", async () => {
	const mod = await loadThemeModule();
	const raw = readTheme(SHIPPED.dark);
	const mutated = {
		...raw,
		name: "pi-council-dark-mutated",
		vars: { ...(raw.vars as Record<string, string>), accent: "#ff00ff" },
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
