/**
 * Loads pi's real theme module (theme.js) via absolute path.
 *
 * Package-specifier deep imports are blocked by pi's exports map (only ".",
 * "./rpc-entry", "./client" are exported), so we resolve the package entry
 * with import.meta.resolve and walk into dist/modes/interactive/theme/theme.js.
 * EV-3 reuses this for resolveThemeSetting.
 */
import * as path from "node:path";
import { pathToFileURL } from "node:url";
import { getPackageDir } from "@earendil-works/pi-coding-agent";

export interface PiThemeModule {
	loadThemeFromPath(themePath: string, mode?: string): { name: string };
	getThemeByName(name: string): { name: string } | undefined;
	setRegisteredThemes(themes: Array<{ name: string }>): void;
	getResolvedThemeColors(name: string): Record<string, string>;
	getThemeExportColors(name: string): Record<string, string | undefined>;
	Theme: new (...args: unknown[]) => unknown;
}

let cached: PiThemeModule | undefined;

export async function loadThemeModule(): Promise<PiThemeModule> {
	if (cached) return cached;
	// Locate pi's theme module via the PUBLIC getPackageDir() API — not
	// `import.meta.resolve("@earendil-works/pi-coding-agent")`, which throws in
	// an installed package whose node_modules has no @earendil-works peer.
	const themePath = path.join(
		getPackageDir(),
		"dist",
		"modes",
		"interactive",
		"theme",
		"theme.js",
	);
	const mod = (await import(pathToFileURL(themePath).href)) as unknown as PiThemeModule;
	cached = mod;
	return cached;
}
