/**
 * Loads pi's real theme module (theme.js) via absolute path.
 *
 * Package-specifier deep imports are blocked by pi's exports map (only ".",
 * "./rpc-entry", "./client" are exported), so we resolve the package entry
 * with import.meta.resolve and walk into dist/modes/interactive/theme/theme.js.
 * EV-3 reuses this for resolveThemeSetting.
 */
import * as path from "node:path";
import { fileURLToPath } from "node:url";

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
	const resolved = import.meta.resolve("@earendil-works/pi-coding-agent");
	const dist = path.dirname(fileURLToPath(resolved));
	const themePath = path.join(dist, "modes", "interactive", "theme", "theme.js");
	const mod = (await import(themePath)) as unknown as PiThemeModule;
	cached = mod;
	return cached;
}
