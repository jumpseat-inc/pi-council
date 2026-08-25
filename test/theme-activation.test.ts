import { test, expect, spyOn } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import {
	activateTheme,
	buildMode,
	decideThemeActivation,
	loadPiThemeModule,
	materializeTheme,
	resolveThemeColors,
	splitThemeColors,
	withThemeColorFallbacks,
} from "../extensions/theme-activation.ts";
import { PKG_ROOT, loadShippedTheme as seatsShipped, loadThemeConfig, mergeThemeSection } from "../extensions/seats.ts";
import type { ExtensionContext } from "@earendil-works/pi-coding-agent";

const AUTO = { variant: "auto" as const };

// ---- Task 1: pure decision function + buildMode ----

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

// ---- Task 2: resolver + fallbacks + bg/fg split ----

test("resolveThemeColors mirrors pi: chains, hex/int/'' passthrough, errors", () => {
	const vars = { accent: "#febc38", blue: "#178fb9", extra: "accent" };
	expect(resolveThemeColors({ a: "extra", b: "blue", c: "#123456", d: 42, e: "" }, vars)).toEqual({
		a: "#febc38",
		b: "#178fb9",
		c: "#123456",
		d: 42,
		e: "",
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

// ---- Task 3: deep-import + real Theme construction ----

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
	const merged = mergeThemeSection(seatsShipped("dark"), {});
	const tmp = path.join(os.tmpdir(), `ev3-ref-${Date.now()}.json`);
	fs.writeFileSync(tmp, JSON.stringify({ name: "ev3-ref", vars: merged.vars, colors: merged.colors }));
	const ref = mod.loadThemeFromPath(tmp, "256color");
	const theme = await materializeTheme({ variant: "dark" }, "dark", "256color");
	for (const key of ["scrollbarThumb", "searchMatchBg", "selectedBg"] as const) {
		expect(theme.getBgAnsi(key)).toBe(ref.getBgAnsi(key));
	}
	for (const key of ["accent", "searchMatchText", "thinkingMax", "mdLink", "thinkingOff", "text"] as const) {
		expect(theme.getFgAnsi(key)).toBe(ref.getFgAnsi(key));
	}
	fs.rmSync(tmp, { force: true });
});

test("repo vars override recolors the instance transitively (dark vars.accent)", async () => {
	const theme = await materializeTheme({ variant: "dark", dark: { vars: { accent: "#ff00ff" } } }, "dark", "truecolor");
	expect(theme.getFgAnsi("accent")).toBe("\x1b[38;2;255;0;255m");
	expect(theme.getFgAnsi("mdListBullet")).toBe("\x1b[38;2;255;0;255m");
});

// ---- Task 3/4 helpers ----

function tmpRepo(config?: unknown): string {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "ev3-act-"));
	if (config !== undefined) fs.writeFileSync(path.join(root, ".council.json"), JSON.stringify(config));
	return root;
}

function makeCtx(hasUI: boolean, ui: Record<string, unknown>): ExtensionContext {
	return { hasUI, ui } as unknown as ExtensionContext;
}

// ---- Task 4: activation glue ----

test("activate flow: one instance set, info notify", async () => {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ev3-settings-"));
	const files = { globalFile: path.join(dir, "g.json"), projectFile: path.join(dir, "p.json") };
	fs.writeFileSync(files.globalFile, JSON.stringify({ theme: "light/dark" }));
	fs.writeFileSync(files.projectFile, JSON.stringify({ theme: "light/dark" }));
	const root = tmpRepo({ theme: { variant: "auto" } });
	let setCount = 0;
	const notif: Array<{ m: string; t?: string }> = [];
	const ctx = makeCtx(true, {
		setTheme() {
			setCount++;
			return { success: true };
		},
		notify(m: string, t?: string) {
			notif.push({ m, t });
		},
	});
	await activateTheme(ctx, root, { settingsFiles: { globalFile: files.globalFile, projectFile: files.projectFile } });
	expect(setCount).toBe(1);
	expect(notif).toContainEqual({ m: "council theme: pi-council-dark", t: "info" });
});

test("activate flow with hasUI:false still sets one theme, silent", async () => {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ev3-settings-"));
	const files = { globalFile: path.join(dir, "g.json"), projectFile: path.join(dir, "p.json") };
	fs.writeFileSync(files.globalFile, JSON.stringify({ theme: "light/dark" }));
	fs.writeFileSync(files.projectFile, JSON.stringify({ theme: "light/dark" }));
	const root = tmpRepo({ theme: { variant: "auto" } });
	let setCount = 0;
	const notif: Array<{ m: string; t?: string }> = [];
	const ctx = makeCtx(false, {
		setTheme() {
			setCount++;
			return { success: true };
		},
		notify(m: string, t?: string) {
			notif.push({ m, t });
		},
	});
	await activateTheme(ctx, root, { settingsFiles: { globalFile: files.globalFile, projectFile: files.projectFile } });
	expect(setCount).toBe(1);
	expect(notif).toEqual([]);
});

test("block flow: gruvbox blocks, warning notify, no setTheme", async () => {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ev3-settings-"));
	const files = { globalFile: path.join(dir, "g.json"), projectFile: path.join(dir, "p.json") };
	fs.writeFileSync(files.globalFile, JSON.stringify({ theme: "gruvbox" }));
	fs.writeFileSync(files.projectFile, JSON.stringify({}));
	const root = tmpRepo({ theme: { variant: "auto" } });
	let setCount = 0;
	const notif: Array<{ m: string; t?: string }> = [];
	const ctx = makeCtx(true, {
		setTheme() {
			setCount++;
			return { success: true };
		},
		notify(m: string, t?: string) {
			notif.push({ m, t });
		},
	});
	await activateTheme(ctx, root, { settingsFiles: { globalFile: files.globalFile, projectFile: files.projectFile } });
	expect(setCount).toBe(0);
	expect(notif).toContainEqual({ m: "council theme: blocked (settings.json has 'gruvbox')", t: "warning" });
});

test("custom A/B pair in settings blocks", async () => {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ev3-settings-"));
	const files = { globalFile: path.join(dir, "g.json"), projectFile: path.join(dir, "p.json") };
	fs.writeFileSync(files.globalFile, JSON.stringify({ theme: "nord-light/nord-dark" }));
	fs.writeFileSync(files.projectFile, JSON.stringify({}));
	const root = tmpRepo({ theme: { variant: "auto" } });
	let setCount = 0;
	const notif: Array<{ m: string; t?: string }> = [];
	const ctx = makeCtx(true, {
		setTheme() {
			setCount++;
			return { success: true };
		},
		notify(m: string, t?: string) {
			notif.push({ m, t });
		},
	});
	await activateTheme(ctx, root, { settingsFiles: { globalFile: files.globalFile, projectFile: files.projectFile } });
	expect(setCount).toBe(0);
	expect(notif).toContainEqual({ m: "council theme: blocked (settings.json has 'nord-light/nord-dark')", t: "warning" });
});

test("enabled:false flows through loadThemeConfig to a rapid noop", () => {
	const offRoot = tmpRepo({ theme: { enabled: false } });
	expect(loadThemeConfig(offRoot)).toBeUndefined();
	expect(decideThemeActivation(loadThemeConfig(offRoot), "gruvbox")).toEqual({ action: "noop" });
	expect(decideThemeActivation(loadThemeConfig(offRoot), undefined)).toEqual({ action: "noop" });
});

test("malformed .council.json notifies and returns, never crashes", async () => {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ev3-settings-"));
	const files = { globalFile: path.join(dir, "g.json"), projectFile: path.join(dir, "p.json") };
	fs.writeFileSync(files.globalFile, JSON.stringify({ theme: "light/dark" }));
	fs.writeFileSync(files.projectFile, JSON.stringify({ theme: "light/dark" }));
	const malformedRoot = fs.mkdtempSync(path.join(os.tmpdir(), "ev3-act-"));
	fs.writeFileSync(path.join(malformedRoot, ".council.json"), "{ not json");
	let setCount = 0;
	const notif: Array<{ m: string; t?: string }> = [];
	const ctx = makeCtx(true, {
		setTheme() {
			setCount++;
			return { success: true };
		},
		notify(m: string, t?: string) {
			notif.push({ m, t });
		},
	});
	await activateTheme(ctx, malformedRoot, {
		settingsFiles: { globalFile: files.globalFile, projectFile: files.projectFile },
	});
	expect(setCount).toBe(0); // never reached setTheme
	expect(notif.length).toBe(1);
	expect(notif[0].m).toContain("council theme");
	expect(notif[0].m).toContain(".council.json");
	expect(notif[0].t).toBe("warning");
});

test("no-op: config undefined -> no settings readFileSync, no setTheme", async () => {
	const spy = spyOn(fs, "readFileSync");
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ev3-settings-"));
	const files = { globalFile: path.join(dir, "g.json"), projectFile: path.join(dir, "p.json") };
	fs.writeFileSync(files.globalFile, JSON.stringify({}));
	const ctx = makeCtx(false, { setTheme() { return { success: true }; }, notify() {} });
	await activateTheme(ctx, tmpRepo(), { settingsFiles: { globalFile: files.globalFile, projectFile: files.projectFile } }); // no .council.json
	expect(spy).not.toHaveBeenCalled();
	spy.mockRestore();
});

test("settings.json byte-identical after activation", async () => {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ev3-settings-"));
	const files = { globalFile: path.join(dir, "g.json"), projectFile: path.join(dir, "p.json") };
	const before = JSON.stringify({ theme: "light/dark" });
	fs.writeFileSync(files.globalFile, before);
	fs.writeFileSync(files.projectFile, before);
	const root = tmpRepo({ theme: { variant: "auto" } });
	const ctx = makeCtx(false, { setTheme() { return { success: true }; }, notify() {} });
	await activateTheme(ctx, root, { settingsFiles: { globalFile: files.globalFile, projectFile: files.projectFile } });
	expect(fs.readFileSync(files.globalFile, "utf-8")).toBe(before);
	expect(fs.readFileSync(files.projectFile, "utf-8")).toBe(before);
});

test("namespace: getThemeByName('pi-council-dark') stays EV-1 shipped after in-memory setTheme", async () => {
	const mod = await loadPiThemeModule();
	mod.setRegisteredThemes([mod.loadThemeFromPath(path.join(PKG_ROOT, "themes", "pi-council-dark.json"), "truecolor")]);
	const before = mod.getThemeByName("pi-council-dark")?.getFgAnsi("accent");
	expect(before).toBe("\x1b[38;2;254;188;56m");
	const theme = await materializeTheme({ variant: "dark", dark: { colors: { accent: "#112233" } } }, "dark", "truecolor");
	expect(theme.getFgAnsi("accent")).toBe("\x1b[38;2;17;34;51m");
	// in-memory route never registers a name
	expect(mod.getThemeByName("pi-council-dark")?.getFgAnsi("accent")).toBe("\x1b[38;2;254;188;56m");
});