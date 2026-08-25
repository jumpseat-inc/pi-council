import { test, expect } from "bun:test";
import { loadPiThemeModule, materializeTheme } from "../extensions/theme-activation.ts";

// ---- EV-4 §3.5 + §10 (and the delegation's binding context): the HTML-export
// pinning test. With the council theme active in-memory, pi's name-lookup
// surface cannot reach it: `getResolvedThemeColors()` (no name) resolves to
// `name = currentThemeName = "<in-memory>"` and `loadThemeJson("<in-memory>")`
// throws "Theme not found: <in-memory>" (uncaught in the /export path). That
// is an epic-visible pi-side limitation this card DOCUMENTS and PINS — the
// fix is pi's, filed as a follow-up, never implemented here.
//
// `currentThemeName` is a module-private `let` (not exported), so the swap is
// asserted behaviourally: after `setThemeInstance(in-memory theme)`, the
// no-arg export color lookup MUST throw — it must not silently render.

const lookup = (mod: unknown) =>
	(mod as unknown as { getResolvedThemeColors(name?: string): Record<string, string> }).getResolvedThemeColors;

test("EV-4 §10: in-memory activation makes the no-arg export color lookup throw (pins the /export crash)", async () => {
	const mod = await loadPiThemeModule();
	const instance = await materializeTheme({ variant: "dark" }, "dark", "truecolor");
	mod.setThemeInstance(instance); // pi's TUI swap — sets module state to "<in-memory>"

	// The crash the spec documents: no name reaches the in-memory instance,
	// so the no-arg export lookup throws the pi-side "Theme not found:
	// <in-memory>" rather than rendering.
	expect(() => lookup(mod)()).toThrow(/Theme not found: <in-memory>/);
});