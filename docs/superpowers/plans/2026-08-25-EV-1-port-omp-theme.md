# EV-1 — Port the oh-my-pi palette to a shipped pi theme — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a `pi-council-dark` / `pi-council-light` theme pair in this package that resolves through pi's real theme loader with colors matching oh-my-pi's `dark.json`/`light.json` (pinned SHA `eab72e88e447a4be45bea2bc302995844c0c51a2`), with the EV-1 test suite (T1–T8) proving it.

**Architecture:** Two hand-written strict pi theme JSON files at `themes/`, declared via a literal-path `"themes": ["./themes"]` entry in the package.json pi manifest (required — a `themes/` dir alone collects 0 under a pi manifest). Provenance is enforced by vendored byte-verbatim omp fixtures plus a full resolved-palette equality test that derives its reference from the fixture through pi's own resolver — never hand-transcribed hex. pi's real `theme.js` is imported via absolute path (package-specifier deep imports are blocked by pi's exports map).

**Tech Stack:** Bun (bun:test, bunx tsc), pi's real `dist/modes/interactive/theme/theme.js` loader, pi's `DefaultPackageManager` (package root export), vendored omp JSON fixtures.

**Spec:** `docs/superpowers/specs/2026-08-25-EV-1-design.md` (this card's implementation contract), `docs/superpowers/specs/2026-08-25-council-theme-design.md` (EV-5, design authority — corrected per the binding ESCALATION Q1 ruling, corrections made in this card's PR).

## Global Constraints

- **Four hard reds** (from the deliberation record): (1) JSON `name` = filename = `pi-council-dark`/`pi-council-light`, never `dark`/`light`; (2) the `"themes": ["./themes"]` pi-manifest entry is required; (3) the 4 optional tokens (`scrollbarThumb`, `searchMatchBg`, `searchMatchText`, `thinkingMax`) are OMITTED from the shipped files — `withThemeColorFallbacks` fills them at construction (file = 51 keys, resolved = 55 keys); (4) var-refs preserved verbatim, never resolved to hex.
- **No amber var exists.** dark `colors.accent: "accent"`, light `colors.accent: "teal"`, `colors.border: "blue"` in both. omp's names verbatim.
- **Four `""` defaults survive verbatim**: `text`, `userMessageText`, `customMessageText`, `toolTitle`.
- **Dead keys stripped**: `link` (dark only), `pythonMode` (both), `statusLine*` ×14 (both) — they carry the only 256-index integers; live 51 carry zero.
- **`$schema`** = pi's theme-schema URL (`https://raw.githubusercontent.com/earendil-works/pi/main/packages/coding-agent/src/modes/interactive/theme/theme-schema.json`), not omp's.
- **`export` section verbatim** from omp: dark `#18181e`/`#1e1e24`/`#26262e`, light `#f8f8f8`/`#ffffff`/`#fffae6`.
- **Location pin**: files at `PKG_ROOT/themes/` where `PKG_ROOT` is `extensions/seats.ts:29` (`path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")`).
- **No comments in theme JSON** — strict `JSON.parse` + schema `additionalProperties:false` reject them; the "do not edit" notice lives in the README.
- **No hot-reload machinery** — package themes are immutable install data.
- **Conventional Commits** on every commit; no wip/nonsense messages.
- **Repo gates** (this repo, not ev-guide's — no docker/mongo/server here): `bun install --frozen-lockfile`, `bunx tsc --noEmit`, `bun test` (full suite; integration test self-skips without `COUNCIL_INTEGRATION=1`), `python3 council/validate.py`. Plus the EV-6 `gates` GitHub Actions workflow must go green on the PR.

---

### Task 1: Vendor the omp fixtures (provenance)

**Files:**
- Create: `test/fixtures/omp/dark.json`, `test/fixtures/omp/light.json`

**Interfaces:**
- Produces: `test/fixtures/omp/{dark,light}.json` — byte-verbatim upstream files (the provenance fixture T6 derives its reference from).

- [ ] **Step 1: Fetch byte-verbatim from the pinned SHA** (never from main):

```bash
mkdir -p test/fixtures/omp
curl -fsSL "https://raw.githubusercontent.com/can1357/oh-my-pi/eab72e88e447a4be45bea2bc302995844c0c51a2/packages/coding-agent/src/modes/theme/dark.json" -o test/fixtures/omp/dark.json
curl -fsSL "https://raw.githubusercontent.com/can1357/oh-my-pi/eab72e88e447a4be45bea2bc302995844c0c51a2/packages/coding-agent/src/modes/theme/light.json" -o test/fixtures/omp/light.json
```

- [ ] **Step 2: Verify invariants** (dark 67 color keys, light 66; strip `link`/`pythonMode`/`statusLine*` ⇒ exactly 51 live each; zero 256-index integers in the live set; exports match the spec):

```bash
node -e "
const d = require('./test/fixtures/omp/dark.json');
const l = require('./test/fixtures/omp/light.json');
const dead = (o) => [...Object.keys(o.colors).filter(k => k.startsWith('statusLine')), 'link', 'pythonMode'];
const live = (o) => Object.keys(o.colors).filter(k => !dead(o).includes(k));
console.log('dark keys', Object.keys(d.colors).length, 'live', live(d).length);
console.log('light keys', Object.keys(l.colors).length, 'live', live(l).length);
console.log('dark 256idx in live', live(d).filter(k => typeof d.colors[k] === 'number').length);
console.log('light 256idx in live', live(l).filter(k => typeof l.colors[k] === 'number').length);
console.log('dark export', JSON.stringify(d.export));
console.log('light export', JSON.stringify(l.export));
"
```

Expected: `dark keys 67 live 51`, `light keys 66 live 51`, `0` / `0`, dark export `{"pageBg":"#18181e","cardBg":"#1e1e24","infoBg":"#26262e"}`, light export `{"pageBg":"#f8f8f8","cardBg":"#ffffff","infoBg":"#fffae6"}`.

- [ ] **Step 3: Commit**

```bash
git add test/fixtures/omp/
git commit -m "test(fixtures): vendor oh-my-pi dark/light.json at pinned SHA eab72e88"
```

---

### Task 2: Ship the theme files + pi-manifest entry

**Files:**
- Create: `themes/pi-council-dark.json`, `themes/pi-council-light.json`
- Modify: `package.json` (`"pi": { "extensions": ["./extensions"], "themes": ["./themes"] }`)

**Interfaces:**
- Produces: `themes/pi-council-dark.json` and `themes/pi-council-light.json` at `PKG_ROOT/themes/` — the assets T1/T2/T4–T8 load; EV-2 later reads them via `path.join(PKG_ROOT, "themes", ...)`.
- Consumes: nothing.

- [ ] **Step 1: Write `themes/pi-council-dark.json`** — omp dark minus dead keys, renamed, pi `$schema`, byte-identical values:

```json
{
	"$schema": "https://raw.githubusercontent.com/earendil-works/pi/main/packages/coding-agent/src/modes/interactive/theme/theme-schema.json",
	"name": "pi-council-dark",
	"vars": {
		"cyan": "#0088fa",
		"blue": "#178fb9",
		"green": "#89d281",
		"red": "#fc3a4b",
		"yellow": "#e4c00f",
		"gray": "#777d88",
		"dimGray": "#5f6673",
		"darkGray": "#3d424a",
		"accent": "#febc38",
		"selectedBg": "#31363f",
		"userMsgBg": "#221d1a",
		"toolPendingBg": "#1d2129",
		"toolSuccessBg": "#161a1f",
		"toolErrorBg": "#291d1d",
		"customMsgBg": "#2a2530"
	},
	"colors": {
		"accent": "accent",
		"border": "blue",
		"borderAccent": "cyan",
		"borderMuted": "darkGray",
		"success": "green",
		"error": "red",
		"warning": "yellow",
		"muted": "gray",
		"dim": "dimGray",
		"text": "",
		"thinkingText": "gray",
		"selectedBg": "selectedBg",
		"userMessageBg": "userMsgBg",
		"userMessageText": "",
		"customMessageBg": "customMsgBg",
		"customMessageText": "",
		"customMessageLabel": "#b281d6",
		"toolPendingBg": "toolPendingBg",
		"toolSuccessBg": "toolSuccessBg",
		"toolErrorBg": "toolErrorBg",
		"toolTitle": "",
		"toolOutput": "gray",
		"mdHeading": "#febc38",
		"mdLink": "#0088fa",
		"mdLinkUrl": "dimGray",
		"mdCode": "#e5c1ff",
		"mdCodeBlock": "#9CDCFE",
		"mdCodeBlockBorder": "gray",
		"mdQuote": "gray",
		"mdQuoteBorder": "darkGray",
		"mdHr": "darkGray",
		"mdListBullet": "accent",
		"toolDiffAdded": "green",
		"toolDiffRemoved": "red",
		"toolDiffContext": "gray",
		"syntaxComment": "#6A9955",
		"syntaxKeyword": "#569CD6",
		"syntaxFunction": "#DCDCAA",
		"syntaxVariable": "#9CDCFE",
		"syntaxString": "#CE9178",
		"syntaxNumber": "#B5CEA8",
		"syntaxType": "#4EC9B0",
		"syntaxOperator": "#D4D4D4",
		"syntaxPunctuation": "#D4D4D4",
		"thinkingOff": "darkGray",
		"thinkingMinimal": "dimGray",
		"thinkingLow": "#178fb9",
		"thinkingMedium": "#0088fa",
		"thinkingHigh": "#b281d6",
		"thinkingXhigh": "#e5c1ff",
		"bashMode": "cyan"
	},
	"export": {
		"pageBg": "#18181e",
		"cardBg": "#1e1e24",
		"infoBg": "#26262e"
	}
}
```

- [ ] **Step 2: Write `themes/pi-council-light.json`** — omp light minus dead keys, renamed, pi `$schema`:

```json
{
	"$schema": "https://raw.githubusercontent.com/earendil-works/pi/main/packages/coding-agent/src/modes/interactive/theme/theme-schema.json",
	"name": "pi-council-light",
	"vars": {
		"teal": "#5a8080",
		"blue": "#547da7",
		"green": "#588458",
		"red": "#aa5555",
		"yellow": "#9a7326",
		"mediumGray": "#6c6c6c",
		"dimGray": "#767676",
		"lightGray": "#b0b0b0",
		"selectedBg": "#d0d0e0",
		"userMsgBg": "#e8e8e8",
		"toolPendingBg": "#e8e8f0",
		"toolSuccessBg": "#e8f0e8",
		"toolErrorBg": "#f0e8e8",
		"customMsgBg": "#ede7f6"
	},
	"colors": {
		"accent": "teal",
		"border": "blue",
		"borderAccent": "teal",
		"borderMuted": "lightGray",
		"success": "green",
		"error": "red",
		"warning": "yellow",
		"muted": "mediumGray",
		"dim": "dimGray",
		"text": "",
		"thinkingText": "mediumGray",
		"selectedBg": "selectedBg",
		"userMessageBg": "userMsgBg",
		"userMessageText": "",
		"customMessageBg": "customMsgBg",
		"customMessageText": "",
		"customMessageLabel": "#7e57c2",
		"toolPendingBg": "toolPendingBg",
		"toolSuccessBg": "toolSuccessBg",
		"toolErrorBg": "toolErrorBg",
		"toolTitle": "",
		"toolOutput": "mediumGray",
		"mdHeading": "yellow",
		"mdLink": "blue",
		"mdLinkUrl": "dimGray",
		"mdCode": "teal",
		"mdCodeBlock": "green",
		"mdCodeBlockBorder": "mediumGray",
		"mdQuote": "mediumGray",
		"mdQuoteBorder": "mediumGray",
		"mdHr": "mediumGray",
		"mdListBullet": "green",
		"toolDiffAdded": "green",
		"toolDiffRemoved": "red",
		"toolDiffContext": "mediumGray",
		"syntaxComment": "#008000",
		"syntaxKeyword": "#0000FF",
		"syntaxFunction": "#795E26",
		"syntaxVariable": "#001080",
		"syntaxString": "#A31515",
		"syntaxNumber": "#098658",
		"syntaxType": "#267F99",
		"syntaxOperator": "#000000",
		"syntaxPunctuation": "#000000",
		"thinkingOff": "lightGray",
		"thinkingMinimal": "#767676",
		"thinkingLow": "blue",
		"thinkingMedium": "teal",
		"thinkingHigh": "#875f87",
		"thinkingXhigh": "#8b008b",
		"bashMode": "green"
	},
	"export": {
		"pageBg": "#f8f8f8",
		"cardBg": "#ffffff",
		"infoBg": "#fffae6"
	}
}
```

- [ ] **Step 3: Add the pi-manifest entry** — `"pi": { "extensions": ["./extensions"], "themes": ["./themes"] }` in `package.json`. The entry is REQUIRED (T2/T3 prove the `themes/` dir alone collects 0 under a pi manifest).

- [ ] **Step 4: Sanity-load both files through pi's real loader** (schema validation is pi's `parseThemeJson`):

```bash
bun -e "
import { loadThemeModule } from './test/theme-loader.ts';
"
```

(theme-loader.ts does not exist yet — this step runs after Task 3; until then, sanity-check with the probe from the spec's own discovery: `bun test` after Task 4 is the real gate. Do not block here.)

- [ ] **Step 5: Commit**

```bash
git add themes/ package.json
git commit -m "feat(theme): ship pi-council-dark/light themes from omp palette eab72e88"
```

---

### Task 3: Shared theme loader helper

**Files:**
- Create: `test/theme-loader.ts`

**Interfaces:**
- Produces: `loadThemeModule(): Promise<PiThemeModule>` — the only import path to pi's real theme.js; EV-3 reuses it later for `resolveThemeSetting`.
- Consumes: pi's installed package (resolved via `import.meta.resolve`).

Rationale: package-specifier deep imports are blocked by pi's exports map (`Cannot find package`); `import.meta.resolve("@earendil-works/pi-coding-agent")` + `dist/modes/interactive/theme/theme.js` + dynamic import works.

- [ ] **Step 1: Write the helper**

```ts
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
```

- [ ] **Step 2: Commit**

```bash
git add test/theme-loader.ts
git commit -m "test(theme): shared loader helper for pi's real theme.js"
```

---

### Task 4: The EV-1 test suite (T1–T8 + brand anchors + var-ref probe)

**Files:**
- Create: `test/theme.test.ts`

**Interfaces:**
- Consumes: `loadThemeModule` (Task 3), `PKG_ROOT` from `../extensions/seats.ts`, `test/fixtures/omp/{dark,light}.json` (Task 1), `themes/*.json` (Task 2), `DefaultPackageManager` from the package root.
- Produces: green tests T1–T8 as the spec enumerates, plus the brand-anchor spotlight and the var-ref preservation probe.

- [ ] **Step 1: Write the failing test file** (all tests; they fail until the themes + manifest exist):

```ts
import { test, expect } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { loadThemeModule, type PiThemeModule } from "./theme-loader.ts";
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
```

- [ ] **Step 2: Run the suite; the new tests fail** until Tasks 2/3 are complete (red):

```bash
bun test test/theme.test.ts
```

- [ ] **Step 3: Confirm the tests pass** (green) once Tasks 1–3 are in:

```bash
bun test test/theme.test.ts
```

Expected: 10 pass (T1–T8 + brand anchors + var-ref probe), 0 fail.

- [ ] **Step 4: Commit**

```bash
git add test/theme.test.ts
git commit -m "test(theme): EV-1 suite T1-T8, brand anchors, var-ref probe"
```

---

### Task 5: README notice

**Files:**
- Modify: `README.md` (in the existing "Theme customization" section under "What you get")

**Interfaces:**
- Produces: the "base palette — do not edit; customize via `.council.json`" notice for developers opening the shipped files.

- [ ] **Step 1: Add one sentence** to the first paragraph of the "Theme customization" section, right after the pair is named:

> The shipped files under `themes/` are the base palette — do not edit them; customize via `.council.json`.

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: note shipped themes are a base palette, customize via .council.json"
```

---

### Task 6: Docs edits mandated by the binding ruling (Q1)

**Files:**
- Modify: `docs/superpowers/specs/2026-08-25-council-theme-design.md` (§3 ~lines 125-128, §4 ~lines 204-206)
- Modify: `council/cards/EV-2.md` (Intent section — one line, NOT the goal)

**Interfaces:**
- Produces: corrected spec §3/§4 (the spec file is the source of truth) and the EV-2 Intent pointer (belt-and-suspenders).

- [ ] **Step 1: Correct spec §3** — replace the var-ref example. Current wrong text (~lines 125-128):

```
merge is data-in/data-out
over JSON. A var-ref survives the merge unresolved (the omp look depends on
`colors.accent` being the var-ref `"amber"`); a repo edit to
`theme.dark.vars.amber` must transitively recolor `accent`/`border`.
```

Replace with the real omp names:

```
merge is data-in/data-out
over JSON. A var-ref survives the merge unresolved (the omp look depends on
`colors.accent` being the var-ref `"accent"` in dark / `"teal"` in light,
and `colors.border` being `"blue"` in both); a repo edit to
`theme.dark.vars.accent` must transitively recolor `accent`/`border`.
```

- [ ] **Step 2: Correct spec §4** — replace `via public getPackageDir`. Current wrong text (~lines 204-206):

```
- **Merge base:** the shipped asset JSON read from disk via public
  `getPackageDir` — it cannot be introspected off `ui.getTheme(name)`
  because `Theme` instances are opaque.
```

Replace with:

```
- **Merge base:** the shipped asset JSON read from disk via
  `path.join(PKG_ROOT, "themes", ...)` — it cannot be introspected off
  `ui.getTheme(name)` because `Theme` instances are opaque.
  `getPackageDir()` walks up from pi's own dist and returns pi's install
  dir, so reading there would silently load pi's built-in themes (accent
  `#8abeb7`) instead of the shipped omp palette.
```

- [ ] **Step 3: Add the EV-2 Intent pointer** — one line at the end of EV-2's Intent section (NOT the goal):

> EV-2 reads the shipped theme JSON off disk via
> `path.join(PKG_ROOT, "themes", ...)`. Do NOT use `getPackageDir()` — that
> is pi's install dir, not pi-council's root, and would silently load pi's
> built-in theme (accent `#8abeb7`) instead of the shipped omp palette. See
> spec §4 (corrected).

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/specs/2026-08-25-council-theme-design.md council/cards/EV-2.md
git commit -m "docs(spec): correct EV-5 §3 amber example and §4 getPackageDir; EV-2 intent pointer"
```

---

### Task 7: Gates + PR

- [ ] **Step 1: Gate 1 — frozen install**

```bash
bun install --frozen-lockfile
```

Expected: clean (no lockfile drift — no dependency changes on this card).

- [ ] **Step 2: Gate 2 — typecheck**

```bash
bunx tsc --noEmit
```

Expected: exit 0, no output.

- [ ] **Step 3: Gate 3 — full suite**

```bash
bun test
```

Expected: 138 prior + 10 new = 148 pass, 2 skip (integration self-skips without `COUNCIL_INTEGRATION=1` — documented repo behavior, not a finding), 0 fail. Confirm `test/theme.test.ts` runs and its 10 tests pass within the suite.

- [ ] **Step 4: Gate 4 — board validator**

```bash
python3 council/validate.py
```

Expected: `All council artifacts valid`.

- [ ] **Step 5: Push branch and open PR against main** (local main is 8 commits ahead of origin/main; the branch is based on local main so the PR diff is clean against origin/main once merged)

```bash
git push -u origin feat/ev1-omp-theme
gh pr create --base main --head feat/ev1-omp-theme --title "feat(theme): EV-1 — port the oh-my-pi palette to a shipped pi theme" --body "EV-1 implementation: shipped pi-council-dark/light pair, pi.themes manifest, T1-T8 suite, spec §3/§4 corrections, EV-2 intent pointer."
```

Expected: PR number + EV-6 `gates` workflow run on the head SHA.

- [ ] **Step 6: Report** — plan path, files created/modified, the four gate commands and exact outputs, PR number/branch/head SHA, any justified deviations.
