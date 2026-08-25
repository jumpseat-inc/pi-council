import { test, expect } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { ansi256ToHex, resolvedPalette, resolveThemeColors, withThemeColorFallbacks } from "../extensions/theme-activation.ts";
import { loadShippedTheme } from "../extensions/seats.ts";

// ---- EV-4 §4: the lone new helper + the 256-index hex copy ----

test("ansi256ToHex: basic 16, cube 220, grayscale endpoints (pi theme.js parity)", () => {
	expect(ansi256ToHex(0)).toBe("#000000");
	expect(ansi256ToHex(15)).toBe("#ffffff");
	expect(ansi256ToHex(220)).toBe("#ffd700"); // cube r=5(ff) g=4(d7) b=0(00)
	expect(ansi256ToHex(232)).toBe("#080808"); // gray 8 + 0*10
	expect(ansi256ToHex(255)).toBe("#eeeeee"); // gray 8 + 23*10 = 238
});

test("resolvedPalette(dark) equals the resolved shipped asset; non-empty values are 6-digit hex", () => {
	const pal = resolvedPalette("dark");
	const shipped = loadShippedTheme("dark");
	const expected = resolveThemeColors(withThemeColorFallbacks(shipped.colors), shipped.vars);
	// identical to the EV-3 resolver output when nothing numeric is present
	expect(pal).toEqual(expected);
	expect(pal.accent).toBe("#febc38");
	expect(pal.text).toBe(""); // default-fg sentinel passes through, never invented
	for (const v of Object.values(pal)) {
		expect(v === "" || /^#[0-9a-fA-F]{6}$/.test(v)).toBe(true);
	}
});

test("numeric color entries are 256-index hexed (repo override accent: 220)", () => {
	const pal = resolvedPalette("dark", { variant: "dark", dark: { colors: { accent: 220 } } });
	expect(pal.accent).toBe("#ffd700");
});

test("numeric VAR entries hex through transitive resolution", () => {
	const pal = resolvedPalette("dark", { variant: "dark", dark: { vars: { accent: 220 } } });
	expect(pal.accent).toBe("#ffd700"); // token accent is a var-ref to vars.accent
});

test("repoRoot config read only when no override; override wins", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "ev4-pal-"));
	fs.writeFileSync(
		path.join(root, ".council.json"),
		JSON.stringify({ theme: { variant: "dark", dark: { colors: { accent: "#123456" } } } }),
	);
	expect(resolvedPalette("dark", undefined, root).accent).toBe("#123456"); // read off disk
	expect(resolvedPalette("dark", { variant: "dark", dark: { colors: { accent: "#abcdef" } } }, root).accent).toBe("#abcdef"); // override wins
});