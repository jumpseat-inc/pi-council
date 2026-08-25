# EV-2 Theme Config Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the scaffold `.council.json` carry an editable, validated `theme` section that a sibling `loadThemeConfig` parses and that `mergeThemeSection` merges over the shipped omp palette — repo overrides win, var-refs survive, zero blast radius on `loadCouncilConfig`.

**Architecture:** A sibling loader `loadThemeConfig(repoRoot)` beside `loadCouncilConfig` in `extensions/seats.ts` reads the top-level `theme` key (a reserved key skipped by the `loadCouncilConfig` loop, so mis-nested `council.theme` never parses as a phantom seat). Validation is fail-fast against vocabularies derived from the shipped theme files (`path.join(PKG_ROOT, "themes", ...)` — never `getPackageDir()`): per-variant declared vars (dark 15 / light 14) and the 51 shipped color keys + 4 optional tokens. A pure, I/O-free `mergeThemeSection(baseJson, overrideBlock?)` merges the vars map first, then the colors map, repo-wins per key, preserves `export` untouched, and never resolves var-refs to hex — un-overridden tokens keep their var-refs so a repo `vars` edit transitively recolors every referencing token at Theme construction (EV-3). The scaffold seed is a minimal delta `{ "enabled": true, "variant": "auto" }`.

**Tech Stack:** Bun + TypeScript (strict), `bun:test`, `node:fs`/`node:path`. Themes are plain JSON assets.

**Spec:** `docs/superpowers/specs/2026-08-25-EV-2-design.md` (committed 11f2171 — the EV-2 contract; where it and the EV-5 epic spec differ, it wins). Epic design authority: `docs/superpowers/specs/2026-08-25-council-theme-design.md` (EV-5; updated in this same PR per spec §9).

## Global Constraints

Copied verbatim from the spec — every task's requirements implicitly include this section.

- **Shape:** top-level `theme`, sibling of `council`: `{ "enabled"?: boolean, "variant": "auto"|"dark"|"light", "dark"?: { "vars"?, "colors"? }, "light"?: { "vars"?, "colors"? } }`. Absent `variant` defaults to `"auto"`. `variant` is validated but **not resolved** (EV-3's job).
- **No `name` key** — a `name` key inside `theme` is an unknown key and **throws** (family identity `pi-council` lives in asset names `pi-council-dark`/`pi-council-light`).
- **Off switch:** `loadThemeConfig` returns `undefined` for absent `theme` key, `theme: false`, `theme: null`, `theme: 0`, `theme: ""` (any falsy non-object), `theme: { "enabled": false }`. `theme: {}` returns `{ variant: "auto" }` — presence implies enabled; absence means **whole-key** absence. A non-falsy non-object (`theme: "on"`) **throws** naming the file.
- **Loader:** sibling `loadThemeConfig(repoRoot: string): ThemeSection | undefined` in `extensions/seats.ts`, beside `loadCouncilConfig`. Malformed JSON throws naming the file, same message shape as `loadCouncilConfig` today.
- **Reserved key:** `theme` skipped in `loadCouncilConfig`'s loop — closes both `{"council":{"theme":"dark"}}` (today THROWS `must be qualified as provider/id`) and `{"council":{"theme":{"enabled":true}}}` (today produces a phantom empty seat `{"theme":{}}`). Zero return-shape change to `loadCouncilConfig`.
- **Merge base:** shipped asset JSON read from disk via `path.join(PKG_ROOT, "themes", "pi-council-{dark,light}.json")` — **never `getPackageDir()`** (pi's install dir would silently load pi's built-in theme, accent `#8abeb7`). `PKG_ROOT` is already exported from seats.ts.
- **Merge:** pure `mergeThemeSection(baseJson, overrideBlock?)` returns full merged JSON `{ vars, colors, export }`. vars **map** merged first, then colors map, repo wins per key. **Never resolve the base's var-refs to hex before or during the merge.** `export` is preserved untouched.
- **Validation vocabulary:** `vars` keys must be **declared vars of that variant** (per-variant; cross-variant pins throw deterministically: `dark.vars.teal`, `light.vars.accent`). `colors` keys must be the **51 shipped keys + 4 optional** (`scrollbarThumb`, `searchMatchBg`, `searchMatchText`, `thinkingMax`). Values: 6-digit hex (reject `#fff` like pi's `hexToRgb` — theme.js:96), integer 0–255 (256-index), var-ref to a declared var of that variant, or `""` (use-pi-default sentinel, a valid override value distinct from an absent key).
- **Strict unknown keys** anywhere inside `theme` (including `name`) → throw naming the file and the key.
- **Scaffold:** `council/scaffold/.council.json` gains `"theme": { "enabled": true, "variant": "auto" }` — delta only, no dark/light shells, no `name`. `scaffoldInto` unchanged (non-clobbering). A re-run over a pre-existing `.council.json` **lacking** `theme` is byte-for-byte a no-op on that file (no `theme` key added; absence = off).
- **Transitivity graph (verified against shipped files — tests MUST follow this, never memory):** dark: `blue → [border]` only; `cyan → [borderAccent, bashMode]`; `accent → [accent, mdListBullet]`; `thinkingLow`/`mdLink` are **literal hexes** (`#178fb9`/`#0088fa`), NOT var-refs; `mdHeading` is literal `#febc38`. Light: `teal → [accent, borderAccent, mdCode, thinkingMedium]`; `blue → [border, mdLink, thinkingLow]`.
- **Message shape:** every throw names the file (`${file}: ...`), mirroring `loadCouncilConfig`.
- **Gates (all four, in order, in full, regardless of change size):** `bun install --frozen-lockfile` → `bunx tsc --noEmit` → `bun test` (full suite; baseline 148 pass / 2 skip / 0 fail) → `python3 council/validate.py`.
- **Same-PR doc updates (mandated, spec §9):** EV-5 §3 working proposal → settled per-variant shape; §3 stale "verified" example corrected; §3 transitive example corrected; README "Theme customization" → settled shape; AGENTS.md 9.6 verified (no change expected).
- **Out of scope (do NOT implement):** resolving `variant: "auto"` (EV-3), activation/`ui.setTheme` (EV-3), hot-reload (EV-4), `export` overrides (deferred), token-only drawing audit (EV-4).

---

### Task 1: Write this plan and commit it

**Files:**
- Create: `docs/superpowers/plans/2026-08-25-EV-2-theme-config.md` (this file)

**Interfaces:**
- Produces: the plan all later tasks execute.

- [ ] **Step 1: Save this file** (already written)
- [ ] **Step 2: Commit**

```bash
git add docs/superpowers/plans/2026-08-25-EV-2-theme-config.md
git commit -m "docs(plan): EV-2 theme config implementation plan"
```

---

### Task 2: `loadThemeConfig` — parse, off-switch, fail-fast validation

**Files:**
- Create: `test/theme-config.test.ts` (EV-2 suite. NOTE: `test/theme.test.ts` already exists on main — it is EV-1's committed suite (T1–T8, brand anchors, var-ref probe, 334 lines, imports `test/theme-loader.ts`). Never overwrite it; EV-2 tests live in a separate file.)
- Modify: `extensions/seats.ts` (types + vocab constants + `loadShippedTheme` + `parseThemeSection` + `parseThemeVariantBlock` + `parseOverrideMap` + `validateThemeValue` + `loadThemeConfig`, placed after `loadCouncilConfig`; module-level constants go near `PKG_ROOT`)

**Interfaces:**
- Consumes: `COUNCIL_CONFIG_FILE`, `PKG_ROOT` (both already exported from seats.ts).
- Produces (later tasks rely on these exact signatures):
  - `export interface ThemeVariantBlock { vars?: Record<string, string | number>; colors?: Record<string, string | number>; }`
  - `export interface ThemeSection { enabled?: boolean; variant: "auto" | "dark" | "light"; dark?: ThemeVariantBlock; light?: ThemeVariantBlock; }`
  - `export interface ShippedTheme { vars: Record<string, string>; colors: Record<string, string>; export: Record<string, string>; }`
  - `export function loadShippedTheme(variant: "dark" | "light"): ShippedTheme`
  - `export function loadThemeConfig(repoRoot: string): ThemeSection | undefined`

- [ ] **Step 1: Write the failing tests** — `test/theme-config.test.ts`:

```ts
import { test, expect } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { loadThemeConfig, loadShippedTheme, COUNCIL_CONFIG_FILE } from "../extensions/seats.ts";

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
	expect(() => loadThemeConfig(root)).toThrow(/"name"/);
});

test("unknown key inside a variant block throws", () => {
	const root = tmpRepo();
	writeConfig(root, { theme: { dark: { foo: "#123456" } } });
	expect(() => loadThemeConfig(root)).toThrow(/"foo"/);
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bun test test/theme-config.test.ts`
Expected: FAIL — `loadThemeConfig is not defined` (import error), every test errors.

- [ ] **Step 3: Implement** — add to `extensions/seats.ts`, right after the `PKG_ROOT` export:

```ts
// ---- theme config (.council.json "theme" section) ----

export interface ThemeVariantBlock {
	vars?: Record<string, string | number>;
	colors?: Record<string, string | number>;
}

export interface ThemeSection {
	enabled?: boolean;
	variant: "auto" | "dark" | "light";
	dark?: ThemeVariantBlock;
	light?: ThemeVariantBlock;
}

/** The shipped theme asset shape: { vars, colors, export }. */
export interface ShippedTheme {
	vars: Record<string, string>;
	colors: Record<string, string>;
	export: Record<string, string>;
}

/** Optional pi theme tokens that join the 51 shipped colors keys. */
const OPTIONAL_TOKENS = ["scrollbarThumb", "searchMatchBg", "searchMatchText", "thinkingMax"];

/** Read a shipped theme asset. Base for all merges — never getPackageDir(). */
export function loadShippedTheme(variant: "dark" | "light"): ShippedTheme {
	const file = path.join(PKG_ROOT, "themes", `pi-council-${variant}.json`);
	return JSON.parse(fs.readFileSync(file, "utf-8")) as ShippedTheme;
}

const SHIPPED_DARK = loadShippedTheme("dark");
const SHIPPED_LIGHT = loadShippedTheme("light");
const DARK_VARS = new Set(Object.keys(SHIPPED_DARK.vars));
const LIGHT_VARS = new Set(Object.keys(SHIPPED_LIGHT.vars));
const VALID_COLOR_KEYS = new Set([
	...Object.keys(SHIPPED_DARK.colors),
	...Object.keys(SHIPPED_LIGHT.colors),
	...OPTIONAL_TOKENS,
]);

function isHex6(s: string): boolean {
	return /^#[0-9a-fA-F]{6}$/.test(s);
}

function validateThemeValue(raw: unknown, variant: "dark" | "light", file: string, where: string): void {
	const declared = variant === "dark" ? DARK_VARS : LIGHT_VARS;
	if (raw === "") return;
	if (typeof raw === "string") {
		if (isHex6(raw) || declared.has(raw)) return;
		throw new Error(
			`${file}: ${where} value ${JSON.stringify(raw)} must be a 6-digit hex color, an integer 0-255, a var-ref to a declared var, or ""`,
		);
	}
	if (typeof raw === "number" && Number.isInteger(raw) && raw >= 0 && raw <= 255) return;
	throw new Error(
		`${file}: ${where} value ${JSON.stringify(raw)} must be a 6-digit hex color, an integer 0-255, a var-ref to a declared var, or ""`,
	);
}

function parseOverrideMap(
	rec: Record<string, unknown>,
	variant: "dark" | "light",
	layer: "vars" | "colors",
	file: string,
): Record<string, string | number> {
	const declared = variant === "dark" ? DARK_VARS : LIGHT_VARS;
	const out: Record<string, string | number> = {};
	for (const [key, value] of Object.entries(rec)) {
		if (layer === "vars" && !declared.has(key)) {
			throw new Error(`${file}: theme.${variant}.vars["${key}"] is not a declared var of the ${variant} variant`);
		}
		if (layer === "colors" && !VALID_COLOR_KEYS.has(key)) {
			throw new Error(`${file}: theme.${variant}.colors["${key}"] is not a valid theme token`);
		}
		validateThemeValue(value, variant, file, `theme.${variant}.${layer}["${key}"]`);
		out[key] = value as string | number;
	}
	return out;
}

function parseThemeVariantBlock(raw: unknown, variant: "dark" | "light", file: string): ThemeVariantBlock {
	if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
		throw new Error(`${file}: "theme.${variant}" must be an object`);
	}
	const rec = raw as Record<string, unknown>;
	for (const key of Object.keys(rec)) {
		if (key !== "vars" && key !== "colors") {
			throw new Error(`${file}: unknown key "theme.${variant}.${key}"`);
		}
	}
	const block: ThemeVariantBlock = {};
	if (rec.vars !== undefined) {
		if (typeof rec.vars !== "object" || rec.vars === null || Array.isArray(rec.vars)) {
			throw new Error(`${file}: "theme.${variant}.vars" must be an object`);
		}
		block.vars = parseOverrideMap(rec.vars as Record<string, unknown>, variant, "vars", file);
	}
	if (rec.colors !== undefined) {
		if (typeof rec.colors !== "object" || rec.colors === null || Array.isArray(rec.colors)) {
			throw new Error(`${file}: "theme.${variant}.colors" must be an object`);
		}
		block.colors = parseOverrideMap(rec.colors as Record<string, unknown>, variant, "colors", file);
	}
	return block;
}

function parseThemeSection(raw: Record<string, unknown>, file: string): ThemeSection {
	const out: ThemeSection = { variant: "auto" };
	for (const key of Object.keys(raw)) {
		switch (key) {
			case "enabled":
				if (typeof raw.enabled !== "boolean") {
					throw new Error(`${file}: theme.enabled must be a boolean`);
				}
				out.enabled = raw.enabled;
				break;
			case "variant":
				if (raw.variant !== "auto" && raw.variant !== "dark" && raw.variant !== "light") {
					throw new Error(`${file}: theme.variant must be one of "auto", "dark", "light"`);
				}
				out.variant = raw.variant;
				break;
			case "dark":
				out.dark = parseThemeVariantBlock(raw.dark, "dark", file);
				break;
			case "light":
				out.light = parseThemeVariantBlock(raw.light, "light", file);
				break;
			default:
				throw new Error(`${file}: unknown key "theme.${key}"`);
		}
	}
	return out;
}

/**
 * Read and validate the optional top-level `theme` section of `.council.json`.
 * Returns undefined when the section is absent or explicitly off (theme: false /
 * null / 0 / "" / { enabled: false }). Presence implies enabled; `theme: {}`
 * returns { variant: "auto" }. Malformed JSON or invalid content throws naming
 * the file.
 */
export function loadThemeConfig(repoRoot: string): ThemeSection | undefined {
	const file = path.join(repoRoot, COUNCIL_CONFIG_FILE);
	if (!fs.existsSync(file)) return undefined;
	let parsed: unknown;
	try {
		parsed = JSON.parse(fs.readFileSync(file, "utf-8"));
	} catch (e) {
		throw new Error(`${file}: malformed JSON — ${e instanceof Error ? e.message : String(e)}`);
	}
	if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
		throw new Error(`${file}: root must be a JSON object`);
	}
	const raw = (parsed as Record<string, unknown>).theme;
	if (raw === undefined) return undefined;
	// Falsy non-object forms are the explicit off switch.
	if (raw === false || raw === null || raw === 0 || raw === "") return undefined;
	if (typeof raw !== "object" || Array.isArray(raw)) {
		throw new Error(`${file}: "theme" must be an object`);
	}
	const section = parseThemeSection(raw as Record<string, unknown>, file);
	return section.enabled === false ? undefined : section;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `bun test test/theme-config.test.ts`
Expected: all tests in this file PASS.

- [ ] **Step 5: Commit**

```bash
git add extensions/seats.ts test/theme-config.test.ts
git commit -m "feat(theme): loadThemeConfig — parse, off-switch, fail-fast validation"
```

---

### Task 3: Reserved-key guard in `loadCouncilConfig` + zero blast radius

**Files:**
- Modify: `extensions/seats.ts` (`loadCouncilConfig` loop, ~line 133)
- Modify: `test/theme-config.test.ts` (append reserved-key tests)

**Interfaces:**
- Consumes: `loadCouncilConfig` (existing, unchanged return shape `Record<string, AgentOverride>`), `loadThemeConfig` from Task 2.
- Produces: the guard behavior — `council.theme` is skipped, never a phantom seat.

- [ ] **Step 1: Write the failing tests** — append to `test/theme-config.test.ts` (add `loadCouncilConfig` to the import list):

```ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bun test test/theme-config.test.ts`
Expected: the three new tests FAIL — `loadCouncilConfig({council:{theme:"dark"}})` throws `must be qualified as provider/id`; the object form returns `{ theme: {} }`.

- [ ] **Step 3: Implement** — add the reserved-key skip in `loadCouncilConfig`'s loop:

```ts
	const out: Record<string, AgentOverride> = {};
	for (const [name, value] of Object.entries(council as Record<string, unknown>)) {
		// "theme" is reserved — parsed by loadThemeConfig, never a seat override.
		if (name === "theme") continue;
		out[name] = parseAgentOverride(name, value, file);
	}
	return out;
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `bun test test/theme-config.test.ts`
Expected: all PASS. Then the full suite: `bun test` — expected 148 + 10 EV-1 + 23 theme-config tests = 171 pass / 2 skip / 0 fail, **no existing expectation edits** (zero blast radius).

- [ ] **Step 5: Commit**

```bash
git add extensions/seats.ts test/theme-config.test.ts
git commit -m "feat(theme): reserved-key guard for mis-nested council.theme"
```

---

### Task 4: Pure `mergeThemeSection` — repo wins, export preserved, transitivity per verified graph

**Files:**
- Modify: `extensions/seats.ts` (add `mergeThemeSection` after `loadThemeConfig`)
- Modify: `test/theme-config.test.ts` (append merge tests; add `mergeThemeSection` to the import list)

**Interfaces:**
- Consumes: `ShippedTheme`, `ThemeVariantBlock` (Task 2), `loadShippedTheme` (Task 2).
- Produces: `export function mergeThemeSection(base: ShippedTheme, overrideBlock?: ThemeVariantBlock): { vars: Record<string, string | number>; colors: Record<string, string | number>; export: Record<string, string>; }` — used by Task 5's delta acceptance and by EV-3.

- [ ] **Step 1: Write the failing tests** — append to `test/theme-config.test.ts`:

```ts
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
	expect(mergedLight.vars).toEqual(light.vars);
	expect(mergedLight.colors).toEqual(light.colors);
	expect(mergedLight.export).toEqual(light.export);
});
```

NOTE on the merge contract: spec §4 pins the return shape to exactly `{ vars, colors, export }`. The shipped files also carry `$schema`/`name` asset metadata; those are NOT part of the merge contract (spec §2 — no `name` key; EV-3 constructs an in-memory nameless Theme from the merged maps). Deep-equality tests compare against the palette maps, and the exact-key-set assertion pins the contract.

- [ ] **Step 2: Run tests to verify they fail**

Run: `bun test test/theme-config.test.ts`
Expected: FAIL — `mergeThemeSection is not defined`.

- [ ] **Step 3: Implement** — add to `extensions/seats.ts`, after `loadThemeConfig`:

```ts
/**
 * Merge a repo override block over a shipped base at the JSON level.
 * The vars map merges first, then the colors map; repo wins per key. The
 * base's var-refs are never resolved to hex here — un-overridden tokens keep
 * their var-refs so a repo vars edit transitively recolors referencing tokens
 * at Theme construction (EV-3). `export` is preserved untouched. Pure, no I/O.
 */
export function mergeThemeSection(
	base: ShippedTheme,
	overrideBlock?: ThemeVariantBlock,
): { vars: Record<string, string | number>; colors: Record<string, string | number>; export: Record<string, string> } {
	return {
		vars: { ...base.vars, ...(overrideBlock?.vars ?? {}) },
		colors: { ...base.colors, ...(overrideBlock?.colors ?? {}) },
		export: { ...base.export },
	};
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `bun test test/theme-config.test.ts`
Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add extensions/seats.ts test/theme-config.test.ts
git commit -m "feat(theme): pure mergeThemeSection with export preservation"
```

---

### Task 5: Scaffold seed + scaffold tests

**Files:**
- Modify: `council/scaffold/.council.json` (add the theme section)
- Modify: `test/scaffold.test.ts` (extend imports + append two tests)

**Interfaces:**
- Consumes: `loadThemeConfig`, `loadShippedTheme`, `mergeThemeSection` (Tasks 2/4), `scaffoldInto` (unchanged).
- Produces: the seeded `.council.json` that `/council-init` writes into consumer repos.

- [ ] **Step 1: Write the failing tests** — extend `test/scaffold.test.ts`. Change the import line to:

```ts
import { COUNCIL_CONFIG_FILE, loadCouncilConfig, loadSeat, loadThemeConfig, loadShippedTheme, mergeThemeSection } from "../extensions/seats.ts";
```

Append:

```ts
test("fresh scaffold writes the theme section; rerun over theme-less .council.json is a byte-for-byte no-op", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "council-init-theme-"));
	const first = scaffoldInto(root, SCAFFOLD);
	expect(first.created).toContain(COUNCIL_CONFIG_FILE);
	const seededConfig = JSON.parse(fs.readFileSync(path.join(root, COUNCIL_CONFIG_FILE), "utf-8"));
	expect(seededConfig.theme).toEqual({ enabled: true, variant: "auto" });
	expect(loadThemeConfig(root)).toEqual({ enabled: true, variant: "auto" });

	// rerun over a user-written theme-less .council.json: byte-for-byte no-op
	const userConfig = JSON.stringify({ council: { owner: { model: "x/y" } } });
	fs.writeFileSync(path.join(root, COUNCIL_CONFIG_FILE), userConfig);
	const second = scaffoldInto(root, SCAFFOLD);
	const createdFiles = second.created.filter((c) => c !== "vault/raw" && c !== "vault/wiki/sources");
	expect(createdFiles).toEqual([]);
	expect(second.skipped).toContain(COUNCIL_CONFIG_FILE);
	expect(fs.readFileSync(path.join(root, COUNCIL_CONFIG_FILE), "utf-8")).toBe(userConfig);
	expect(loadThemeConfig(root)).toBeUndefined(); // absence = off; no theme key is added
});

test("delta acceptance: seeded theme section merges to byte-identical shipped palettes", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "council-init-delta-"));
	scaffoldInto(root, SCAFFOLD);
	const seeded = loadThemeConfig(root)!;
	const dark = loadShippedTheme("dark");
	const light = loadShippedTheme("light");
	const mergedDark = mergeThemeSection(dark, seeded.dark);
	expect(mergedDark.vars).toEqual(dark.vars);
	expect(mergedDark.colors).toEqual(dark.colors);
	expect(mergedDark.export).toEqual(dark.export);
	const mergedLight = mergeThemeSection(light, seeded.light);
	expect(mergedLight.vars).toEqual(light.vars);
	expect(mergedLight.colors).toEqual(light.colors);
	expect(mergedLight.export).toEqual(light.export);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bun test test/scaffold.test.ts`
Expected: the two new tests FAIL — `seededConfig.theme` is `undefined` (fresh scaffold has no theme section today); the delta tests fail on the first assertion chain.

- [ ] **Step 3: Implement** — add the theme section to `council/scaffold/.council.json`, matching the existing tab indentation. The file becomes:

```json
{
	"council": {
		"consolidator": {
			"model": "openrouter/z-ai/glm-5.2",
			"thinking": "high"
		},
		"council-runner": {
			"model": "openrouter/deepseek/deepseek-v4-flash-0731",
			"thinking": "medium"
		},
		"designer": {
			"model": "openrouter/minimax/minimax-m3",
			"thinking": "high"
		},
		"judge": {
			"model": "openrouter/qwen/qwen3.6-35b-a3b",
			"thinking": "medium"
		},
		"owner": {
			"model": "openrouter/deepseek/deepseek-v4-flash-0731",
			"thinking": "high"
		},
		"principal": {
			"model": "openrouter/deepseek/deepseek-v4-pro-0813",
			"thinking": "high"
		},
		"product-owner": {
			"model": "openrouter/minimax/minimax-m3",
			"thinking": "high"
		},
		"skeptic": {
			"model": "openrouter/deepseek/deepseek-v4-flash",
			"thinking": "high"
		},
		"steward": {
			"model": "openrouter/deepseek/deepseek-v4-pro",
			"thinking": "high"
		}
	},
	"theme": {
		"enabled": true,
		"variant": "auto"
	}
}
```

(Diff is exactly: append `,\n\t"theme": {\n\t\t"enabled": true,\n\t\t"variant": "auto"\n\t}` after the closing `}` of `council`. Use `edit` with the trailing `\t}` + `}` as the anchor — do not rewrite the seat blocks by hand.)

- [ ] **Step 4: Run tests to verify they pass**

Run: `bun test test/scaffold.test.ts`
Expected: all PASS, including the pre-existing scaffold tests **with no edits to their expectations**.

- [ ] **Step 5: Commit**

```bash
git add council/scaffold/.council.json test/scaffold.test.ts
git commit -m "feat(theme): scaffold seeds minimal theme section (delta, non-clobbering)"
```

---

### Task 6: Same-PR doc updates — EV-5 §3, README, AGENTS.md verify

**Files:**
- Modify: `docs/superpowers/specs/2026-08-25-council-theme-design.md` (§3)
- Modify: `README.md` ("Theme customization" section, ~line 115)

**Interfaces:**
- Consumes: the settled shape from the EV-2 spec §2 and §7; nothing from code tasks.
- Produces: the epic spec and README stay the single source of truth (Phase 1 ruling).

- [ ] **Step 1: Update the EV-5 epic spec §3** — the following three edits, exactly:

(1) Replace the **Working proposal** block (flat `overrides` example + "Open design detail left to EV-2") with the settled shape and mark it settled:

```markdown
- **Theme section shape (settled — EV-2 fixed it).** The flat `overrides`
  working proposal was rejected in deliberation: a variant-agnostic `vars`
  override under `variant: "auto"` has no statically known variant, so it can
  only validate against the union of both var sets — accepting a light-only
  var that silently no-ops on a dark terminal. The settled shape is
  per-variant blocks, validated per-variant:
  ```json
  {
    "council": { "<seat>": { "model"?, "thinking"? }, ... },
    "theme": {
      "enabled": true,
      "variant": "auto",
      "dark":  { "vars": { "<varName>": "<value>" }, "colors": { "<tokenName>": "<value>" } },
      "light": { "vars": { "<varName>": "<value>" }, "colors": { "<tokenName>": "<value>" } }
    }
  }
  ```
  - `variant` ∈ `auto | dark | light`; `auto` follows terminal background →
    `pi-council-dark` / `pi-council-light` (resolution is EV-3's job).
  - `vars` keys must be declared vars of that variant (dark and light var
    sets differ; cross-variant pins throw); an override here transitively
    recolors every token whose shipped value references the var.
  - `colors` keys are pi `ThemeColor` / `ThemeBg` names (51 shipped + 4
    optional), values in pi's four accepted formats (hex / 256-index /
    var-ref to a declared var / `""`). An override here pins that token only.
  - No `name` key — family identity `pi-council` lives in the shipped asset
    names (`pi-council-dark` / `pi-council-light`); a `name` key is an
    unknown key and throws.
```

(2) Fix the **stale "verified" example** in the reserved-key bullet. Replace:

```markdown
  override` (verified: `{"council":{"theme":"dark"}}` → `{"theme":
  {"model":"dark"}}`; `{"council":{"theme":{"enabled":true}}}` → empty
  override for phantom seat `"theme"`). The fix is a **sibling loader
```

with:

```markdown
  override (verified against current main: `{"council":{"theme":"dark"}}`
  THROWS `council["theme"] model "dark" must be qualified as provider/id` —
  it does not produce a phantom override; `{"council":{"theme":
  {"enabled":true}}}` produces a phantom empty seat `{"theme":{}}`). The fix
  is a **sibling loader
```

and the sentence that follows already names the fix — extend it to state the guard closes both: replace "The fix is a **sibling loader `loadThemeConfig()`**, with `theme` a reserved key skipped in the `loadCouncilConfig` loop" with "The fix is a **sibling loader `loadThemeConfig()`**, with `theme` a reserved key skipped in the `loadCouncilConfig` loop (the one-line guard closes both cases above)".

(3) Fix the **stale transitive example** in the merge-semantics bullet. Replace:

```markdown
  `"blue"` in both); a repo edit to `theme.dark.vars.accent` must
  transitively recolor `accent`/`border`.
```

with:

```markdown
  `"blue"` in both); a repo edit to `theme.dark.vars.accent` must
  transitively recolor `accent`/`mdListBullet` (dark) — `border` follows
  `vars.blue`, not `vars.accent` (verified against the shipped files).
```

(4) Fix the **off-switch "pinned rule" typo** (`council.theme` → `theme`) and extend the falsy vocabulary to match the loader. Replace:

```markdown
  `theme: false` and `theme: { enabled: false }` both accepted as
  explicit off via one falsy/enabled-check expression. Pinned rule:
  `council.theme` falsy OR `council.theme.enabled === false` ⇒ off;
  otherwise on.
```

with:

```markdown
  `theme: false` and `theme: { enabled: false }` both accepted as
  explicit off via one falsy/enabled-check expression (falsy non-object
  forms: `false` / `null` / `0` / `""`). Pinned rule: `theme` falsy OR
  `theme.enabled === false` ⇒ off; otherwise on.
```

(5) Update §8's EV-2 open-items line to record the shape as settled. Replace:

```markdown
- **EV-2:** the final theme-section shape, including the overrides
  representation (vars/colors split vs flat — §3). EV-2's draft acceptance
```

with:

```markdown
- **EV-2:** the final theme-section shape (settled — per-variant `vars`/
  `colors` blocks, §3). EV-2's draft acceptance
```

- [ ] **Step 2: Update the README "Theme customization" section** — replace the JSON example and the two override bullets, keep the variant-pinning and off-switch prose. Replace:

```markdown
The council ships an oh-my-pi-themed dark/light pair — `pi-council-dark` and
`pi-council-light`. The shipped files under `themes/` are the base palette —
do not edit them; customize via `.council.json`. Recolor it per-repo from the
committed `.council.json`, under a top-level `theme` key, a sibling of
`council` (final shape owned by EV-2; this is the working proposal from the
epic's design spec):

```json
{
  "council": { "<seat>": { "model"?, "thinking"? }, ... },
  "theme": {
    "enabled": true,
    "variant": "auto",
    "overrides": { "accent": "#febc38" }
  }
}
```

- **Variant pinning** — `variant` is `auto`, `dark`, or `light`; `auto`
  follows the terminal background and resolves to `pi-council-dark` /
  `pi-council-light`. `/council-init` seeds the section non-clobberingly, so
  `auto` is the default for fresh installs.
- **Per-token overrides** — `overrides` is keyed by pi theme token names
  (`accent`, `border`, …) with values in pi's accepted formats (hex,
  256-index, var-ref, or `""`).
- **Off switch** — presence implies enabled; remove the `theme` section
  or set `theme.enabled: false` to turn the council theme off.
```

with:

```markdown
The council ships an oh-my-pi-themed dark/light pair — `pi-council-dark` and
`pi-council-light`. The shipped files under `themes/` are the base palette —
do not edit them; customize via `.council.json`. Recolor it per-repo from the
committed `.council.json`, under a top-level `theme` key, a sibling of
`council`:

```json
{
  "council": { "<seat>": { "model"?, "thinking"? }, ... },
  "theme": {
    "enabled": true,
    "variant": "auto",
    "dark": { "vars": { "cyan": "#0088fa" }, "colors": { "accent": "#ff8800" } },
    "light": { "vars": {}, "colors": {} }
  }
}
```

`/council-init` seeds the minimal `{ "enabled": true, "variant": "auto" }`
non-clobberingly; `auto` is the default for fresh installs.

- **Variant pinning** — `variant` is `auto`, `dark`, or `light`; `auto`
  follows the terminal background and resolves to `pi-council-dark` /
  `pi-council-light`.
- **Per-variant overrides** — `dark` and `light` are optional override
  blocks, each with two optional maps. `vars` is keyed by the shipped var
  names of that variant (dark and light var sets differ — a var the variant
  lacks throws); `colors` is keyed by pi theme token names (`accent`,
  `border`, …). Values in either are hex (6-digit), a 256-index integer
  0–255, a var-ref to a declared var of that variant, or `""` (use pi's
  default). Invalid tokens and values fail loudly, naming `.council.json`.
- **Transitive recolor** — a `vars` override recolors every token whose
  shipped value references that var (e.g. dark `vars.cyan` recolors
  `borderAccent` and `bashMode`); a `colors` override pins that one token.
- **Off switch** — presence implies enabled; remove the `theme` section
  or set `theme.enabled: false` to turn the council theme off.
```

- [ ] **Step 3: Verify AGENTS.md 9.6 still matches** — read `AGENTS.md` lines 88-94 and confirm it states the top-level `theme` sibling, reserved key, `loadThemeConfig`, `enabled: false` off switch. No change expected.

- [ ] **Step 4: Run tests to verify nothing regressed**

Run: `bun test`
Expected: full suite green (148 + new tests pass, 2 skip, 0 fail).

- [ ] **Step 5: Commit**

```bash
git add docs/superpowers/specs/2026-08-25-council-theme-design.md README.md
git commit -m "docs: EV-5 theme shape and README customization to settled per-variant"
```

---

### Task 7: Gates, push, PR

**Files:** none (verification + delivery).

- [ ] **Step 1: Gate 1 — install frozen**

```bash
bun install --frozen-lockfile
```
Expected: `215 packages installed`, no lockfile drift.

- [ ] **Step 2: Gate 2 — typecheck**

```bash
bunx tsc --noEmit
```
Expected: exit 0, no output.

- [ ] **Step 3: Gate 3 — full test suite**

```bash
bun test
```
Expected: all pass — baseline 148 plus the new theme/scaffold tests; `2 skip` (integration self-skips without `COUNCIL_INTEGRATION=1`, documented); `0 fail`.

- [ ] **Step 4: Gate 4 — validate**

```bash
python3 council/validate.py
```
Expected: `All council artifacts valid`.

- [ ] **Step 5: Review the diff** — `git log --oneline main..HEAD` and `git diff main` — confirm only the intended files changed and no existing test expectations were edited.

- [ ] **Step 6: Push and open the PR**

```bash
git push -u origin feat/ev2-theme-config
gh pr create --base main --head feat/ev2-theme-config --title "feat(theme): EV-2 theme configuration in scaffold .council.json" --body "Implements EV-2 (EPIC-1): loadThemeConfig + reserved-key guard, mergeThemeSection, scaffold theme seed, EV-5 §3/README doc updates. Gates green: install/tsc/test/validate."
```
Expected: PR created against `main`. Record the PR number and head SHA.

- [ ] **Step 7: Report** — branch name, PR number, head SHA, per-gate actual output, files changed, plan path.
