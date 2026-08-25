import { test, expect } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { loadThemeConfig, loadShippedTheme, loadCouncilConfig, mergeThemeSection, COUNCIL_CONFIG_FILE } from "../extensions/seats.ts";

function tmpRepo(): string {
	return fs.mkdtempSync(path.join(os.tmpdir(), "council-theme-"));
}

function writeConfig(root: string, data: unknown): void {
	fs.writeFileSync(path.join(root, COUNCIL_CONFIG_FILE), JSON.stringify(data));
}

test("absent .council.json and absent theme key both yield undefined", () => {
	expect(loadThemeConfig(tmpRepo())).toBeUndefined();
	const root = tmpRepo();
	writeConfig(root, { council: { owner: { model: "x/y" } } });
	expect(loadThemeConfig(root)).toBeUndefined();
});

test("loadThemeConfig parses the seeded shape", () => {
	const root = tmpRepo();
	writeConfig(root, { theme: { enabled: true, variant: "auto" } });
	expect(loadThemeConfig(root)).toEqual({ enabled: true, variant: "auto" });
});

test("theme: {} returns { variant: 'auto' } — absence is whole-key absence", () => {
	const root = tmpRepo();
	writeConfig(root, { theme: {} });
	expect(loadThemeConfig(root)).toEqual({ variant: "auto" });
});

test("absent variant defaults to auto", () => {
	const root = tmpRepo();
	writeConfig(root, { theme: { enabled: true } });
	expect(loadThemeConfig(root)).toEqual({ enabled: true, variant: "auto" });
});

test("falsy off-switch forms return undefined without crashing", () => {
	for (const theme of [false, null, 0, ""]) {
		const root = tmpRepo();
		writeConfig(root, { theme });
		expect(loadThemeConfig(root)).toBeUndefined();
	}
});

test("theme: { enabled: false } returns undefined", () => {
	const root = tmpRepo();
	writeConfig(root, { theme: { enabled: false } });
	expect(loadThemeConfig(root)).toBeUndefined();
});

test("malformed JSON throws naming the file", () => {
	const root = tmpRepo();
	fs.writeFileSync(path.join(root, COUNCIL_CONFIG_FILE), "{ not json");
	expect(() => loadThemeConfig(root)).toThrow(/council\.json/);
});

test("non-falsy non-object theme throws naming the file", () => {
	const root = tmpRepo();
	writeConfig(root, { theme: "on" });
	expect(() => loadThemeConfig(root)).toThrow(/council\.json/);
});

test("unknown key inside theme throws naming the key (name is rejected)", () => {
	const root = tmpRepo();
	writeConfig(root, { theme: { name: "pi-council" } });
	expect(() => loadThemeConfig(root)).toThrow(/theme\.name/);
});

test("unknown key inside a variant block throws", () => {
	const root = tmpRepo();
	writeConfig(root, { theme: { dark: { foo: "#123456" } } });
	expect(() => loadThemeConfig(root)).toThrow(/theme\.dark\.foo/);
});

test("enabled must be a boolean", () => {
	const root = tmpRepo();
	writeConfig(root, { theme: { enabled: "yes" } });
	expect(() => loadThemeConfig(root)).toThrow(/enabled/);
});

test("invalid variant throws", () => {
	const root = tmpRepo();
	writeConfig(root, { theme: { variant: "sepia" } });
	expect(() => loadThemeConfig(root)).toThrow(/variant/);
});

test("vars keys must be declared vars of that variant — cross-variant pins throw", () => {
	const root = tmpRepo();
	writeConfig(root, { theme: { dark: { vars: { teal: "#123456" } } } }); // teal is light-only
	expect(() => loadThemeConfig(root)).toThrow(/teal/);
	writeConfig(root, { theme: { light: { vars: { accent: "#123456" } } } }); // accent is dark-only
	expect(() => loadThemeConfig(root)).toThrow(/accent/);
});

test("declared var override parses", () => {
	const root = tmpRepo();
	writeConfig(root, { theme: { dark: { vars: { cyan: "#123456" } } } });
	expect(loadThemeConfig(root)).toEqual({ variant: "auto", dark: { vars: { cyan: "#123456" } } });
});

test("colors key outside the valid token set throws naming the token", () => {
	const root = tmpRepo();
	writeConfig(root, { theme: { dark: { colors: { nonexistent: "#000000" } } } });
	expect(() => loadThemeConfig(root)).toThrow(/nonexistent/);
});

test("every shipped color token is a valid override key in both variants", () => {
	const dark = loadShippedTheme("dark");
	for (const key of Object.keys(dark.colors)) {
		const root = tmpRepo();
		writeConfig(root, { theme: { dark: { colors: { [key]: "#123456" } } } });
		expect(() => loadThemeConfig(root)).not.toThrow();
		const root2 = tmpRepo();
		writeConfig(root2, { theme: { light: { colors: { [key]: "#123456" } } } });
		expect(() => loadThemeConfig(root2)).not.toThrow();
	}
});

test("3-digit hex is rejected like pi's hexToRgb", () => {
	const root = tmpRepo();
	writeConfig(root, { theme: { dark: { colors: { accent: "#fff" } } } });
	expect(() => loadThemeConfig(root)).toThrow(/accent/);
});

test("256-index values must be integers 0-255", () => {
	const ok = tmpRepo();
	writeConfig(ok, { theme: { dark: { colors: { accent: 200 } } } });
	expect(loadThemeConfig(ok)?.dark?.colors?.accent).toBe(200);
	const bad = tmpRepo();
	writeConfig(bad, { theme: { dark: { colors: { accent: 256 } } } });
	expect(() => loadThemeConfig(bad)).toThrow(/accent/);
});

test("var-ref values must resolve to a declared var of that variant", () => {
	const ok = tmpRepo();
	writeConfig(ok, { theme: { dark: { colors: { border: "cyan" } } } });
	expect(() => loadThemeConfig(ok)).not.toThrow();
	const bad = tmpRepo();
	writeConfig(bad, { theme: { light: { colors: { accent: "cyan" } } } }); // cyan undeclared in light
	expect(() => loadThemeConfig(bad)).toThrow(/cyan/);
});

test('"" is a valid override value (use-pi-default sentinel)', () => {
	const root = tmpRepo();
	writeConfig(root, { theme: { dark: { colors: { text: "" } } } });
	expect(loadThemeConfig(root)).toEqual({ variant: "auto", dark: { colors: { text: "" } } });
});

test("zero blast radius: top-level theme is invisible to loadCouncilConfig", () => {
	const root = tmpRepo();
	writeConfig(root, { theme: { enabled: true, variant: "auto" }, council: { owner: { model: "x/y" } } });
	expect(loadCouncilConfig(root)).toEqual({ owner: { model: "x/y" } });
});

test("reserved-key guard: mis-nested council.theme never parses as a phantom seat", () => {
	const root = tmpRepo();
	writeConfig(root, { council: { theme: "dark" } });
	expect(loadCouncilConfig(root)).toEqual({}); // today THROWS "must be qualified as provider/id"
	writeConfig(root, { council: { theme: { enabled: true } } });
	expect(loadCouncilConfig(root)).toEqual({}); // today yields phantom seat { theme: {} }
});

test("reserved-key isolation: sibling theme parses; mis-nested council.theme is skipped", () => {
	const root = tmpRepo();
	writeConfig(root, { council: { theme: { enabled: true } }, theme: { enabled: true, variant: "dark" } });
	expect(loadCouncilConfig(root)).toEqual({});
	expect(loadThemeConfig(root)).toEqual({ enabled: true, variant: "dark" });
});

test("mergeThemeSection with no overrides deep-equals the shipped palette including export", () => {
	const dark = loadShippedTheme("dark");
	const merged = mergeThemeSection(dark, {});
	expect(merged.vars).toEqual(dark.vars);
	expect(merged.colors).toEqual(dark.colors);
	expect(merged.export).toEqual(dark.export);
	// the merge contract is { vars, colors, export } — no asset metadata
	expect(Object.keys(merged)).toEqual(["vars", "colors", "export"]);
});

test("export is preserved untouched through the merge", () => {
	const dark = loadShippedTheme("dark");
	expect(mergeThemeSection(dark, { vars: { cyan: "#123456" } }).export).toEqual(dark.export);
});

test("repo wins per key; untouched tokens byte-equal the shipped file", () => {
	const dark = loadShippedTheme("dark");
	const merged = mergeThemeSection(dark, { colors: { mdHeading: "#123456" } });
	expect(merged.colors.mdHeading).toBe("#123456");
	expect(merged.colors.accent).toBe(dark.colors.accent);
	expect(merged.vars).toEqual(dark.vars);
});

test("dark.vars.cyan recolor propagates to borderAccent and bashMode var-refs (verified graph)", () => {
	const merged = mergeThemeSection(loadShippedTheme("dark"), { vars: { cyan: "#123456" } });
	expect(merged.vars.cyan).toBe("#123456");
	expect(merged.colors.borderAccent).toBe("cyan");
	expect(merged.colors.bashMode).toBe("cyan");
	// border follows blue, NOT cyan
	expect(merged.colors.border).toBe("blue");
	// thinkingLow / mdLink / mdHeading are literal hexes, unaffected by var overrides
	expect(merged.colors.thinkingLow).toBe("#178fb9");
	expect(merged.colors.mdLink).toBe("#0088fa");
	expect(merged.colors.mdHeading).toBe("#febc38");
});

test("dark.vars.blue recolor propagates to border only", () => {
	const merged = mergeThemeSection(loadShippedTheme("dark"), { vars: { blue: "#336699" } });
	expect(merged.vars.blue).toBe("#336699");
	expect(merged.colors.border).toBe("blue");
});

test("dark.colors.accent pin leaves mdListBullet following the var", () => {
	const merged = mergeThemeSection(loadShippedTheme("dark"), { colors: { accent: "#ff8800" } });
	expect(merged.colors.accent).toBe("#ff8800");
	expect(merged.colors.mdListBullet).toBe("accent");
});

test("two-layer probe: vars.accent vs colors.accent, same key name, different layer", () => {
	const viaVar = mergeThemeSection(loadShippedTheme("dark"), { vars: { accent: "#123456" } });
	expect(viaVar.colors.accent).toBe("accent"); // var-ref follows the overridden var
	expect(viaVar.colors.mdListBullet).toBe("accent");
	const viaColor = mergeThemeSection(loadShippedTheme("dark"), { colors: { accent: "#654321" } });
	expect(viaColor.colors.accent).toBe("#654321"); // colors pin wins for that token
	expect(viaColor.colors.mdListBullet).toBe("accent"); // var consumer untouched
});

test("layering: colors wins for a pinned token, vars wins elsewhere", () => {
	const merged = mergeThemeSection(loadShippedTheme("dark"), {
		vars: { cyan: "#123456" },
		colors: { border: "#888888" },
	});
	expect(merged.colors.border).toBe("#888888");
	expect(merged.colors.bashMode).toBe("cyan");
});

test("per-variant independence: dark overrides never touch merged light", () => {
	const root = tmpRepo();
	writeConfig(root, { theme: { dark: { vars: { cyan: "#123456" } } } });
	const section = loadThemeConfig(root);
	expect(section?.dark?.vars?.cyan).toBe("#123456");
	expect(section?.light).toBeUndefined();
	const light = loadShippedTheme("light");
	const mergedLight = mergeThemeSection(light, section?.light);
	expect(mergedLight.vars).toEqual(light.vars);
	expect(mergedLight.colors).toEqual(light.colors);
	expect(mergedLight.export).toEqual(light.export);
});
