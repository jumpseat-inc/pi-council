import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { CONFIG_DIR_NAME } from "@earendil-works/pi-coding-agent";

export interface Seat {
	name: string;
	description: string;
	model: string;
	thinkingLevel?: string;
	tools: string[];
	spawns: string[];
	mcp: string[];
	body: string;
}

const THINKING_LEVELS = new Set(["off", "minimal", "low", "medium", "high", "xhigh", "max"]);

/**
 * Optional per-agent model/thinking overrides from a committed `.council.json`
 * at the repository root. Frontmatter remains the default; these shadow it.
 * Shape of the file: `{ "council": { "<seatName>": { "model"?, "thinking"? } } }`.
 * A bare-string value is shorthand for `{ "model": "<value>" }` and may carry
 * the same `:thinking` suffix parsing used in seat frontmatter.
 */
export const COUNCIL_CONFIG_FILE = ".council.json";

/** Absolute package root — one level above extensions/. */
export const PKG_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

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

function parseList(raw: string): string[] {
	const inner = raw.trim().replace(/^\[/, "").replace(/\]$/, "");
	return inner
		.split(",")
		.map((s) => s.trim())
		.filter(Boolean);
}

export function parseSeatFile(content: string, fileName: string): Seat {
	const m = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
	if (!m) throw new Error(`${fileName}: missing frontmatter`);
	const [, front, body] = m;
	const fields: Record<string, string> = {};
	for (const line of front.split("\n")) {
		const kv = line.match(/^([\w-]+):\s*(.*)$/);
		if (kv) fields[kv[1]] = kv[2];
	}
	for (const req of ["name", "description", "model"]) {
		if (!fields[req]) throw new Error(`${fileName}: frontmatter missing "${req}"`);
	}
	let model = fields.model.trim();
	let thinkingLevel: string | undefined;
	const colon = model.lastIndexOf(":");
	if (colon > 0) {
		const suffix = model.slice(colon + 1);
		if (THINKING_LEVELS.has(suffix)) {
			thinkingLevel = suffix;
			model = model.slice(0, colon);
		}
	}
	return {
		name: fields.name.trim(),
		description: fields.description.trim(),
		model,
		thinkingLevel,
		tools: fields.tools ? parseList(fields.tools) : [],
		spawns: fields.spawns ? parseList(fields.spawns) : [],
		mcp: fields.mcp ? parseList(fields.mcp) : [],
		body: body.trim(),
	};
}

export interface AgentOverride {
	model?: string;
	thinking?: string;
}

function qualifiedOrThrow(raw: string, fileName: string, where: string): string {
	if (!raw.includes("/")) {
		throw new Error(`${fileName}: ${where} model "${raw}" must be qualified as provider/id`);
	}
	return raw;
}

function parseAgentOverride(name: string, raw: unknown, fileName: string): AgentOverride {
	if (typeof raw === "string") {
		return { model: qualifiedOrThrow(raw, fileName, `council["${name}"]`) };
	}
	if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
		throw new Error(`${fileName}: council["${name}"] must be a string or an object with "model"/"thinking"`);
	}
	const rec = raw as Record<string, unknown>;
	const out: AgentOverride = {};
	if (rec.model !== undefined) {
		if (typeof rec.model !== "string") {
			throw new Error(`${fileName}: council["${name}"].model must be a string`);
		}
		out.model = qualifiedOrThrow(rec.model, fileName, `council["${name}"]`);
	}
	if (rec.thinking !== undefined) {
		if (typeof rec.thinking !== "string" || !THINKING_LEVELS.has(rec.thinking)) {
			throw new Error(
				`${fileName}: council["${name}"].thinking must be one of ${[...THINKING_LEVELS].join(", ")}`,
			);
		}
		out.thinking = rec.thinking;
	}
	return out;
}

/**
 * Read and validate `.council.json` at the repository root. Returns a per-seat
 * override map keyed by seat name; empty object when the file is absent or has
 * no `council` section. Malformed JSON or invalid overrides throw.
 */
export function loadCouncilConfig(repoRoot: string): Record<string, AgentOverride> {
	const file = path.join(repoRoot, COUNCIL_CONFIG_FILE);
	if (!fs.existsSync(file)) return {};
	let parsed: unknown;
	try {
		parsed = JSON.parse(fs.readFileSync(file, "utf-8"));
	} catch (e) {
		throw new Error(`${file}: malformed JSON — ${e instanceof Error ? e.message : String(e)}`);
	}
	if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
		throw new Error(`${file}: root must be a JSON object`);
	}
	const council = (parsed as Record<string, unknown>).council;
	if (council === undefined) return {};
	if (typeof council !== "object" || council === null || Array.isArray(council)) {
		throw new Error(`${file}: "council" must be an object keyed by seat name`);
	}
	const out: Record<string, AgentOverride> = {};
	for (const [name, value] of Object.entries(council as Record<string, unknown>)) {
		// "theme" is reserved — parsed by loadThemeConfig, never a seat override.
		if (name === "theme") continue;
		out[name] = parseAgentOverride(name, value, file);
	}
	return out;
}

/** Apply a seat override, honoring: thinking key > inline :suffix > frontmatter. */
export function applySeatOverride(seat: Seat, config: Record<string, AgentOverride>): Seat {
	const ov = config[seat.name];
	if (!ov) return seat;
	let model = seat.model;
	let thinkingLevel = seat.thinkingLevel;
	if (ov.model) {
		model = ov.model;
		const colon = model.lastIndexOf(":");
		if (colon > 0 && THINKING_LEVELS.has(model.slice(colon + 1))) {
			thinkingLevel = model.slice(colon + 1);
			model = model.slice(0, colon);
		}
	}
	if (ov.thinking) thinkingLevel = ov.thinking;
	return model === seat.model && thinkingLevel === seat.thinkingLevel ? seat : { ...seat, model, thinkingLevel };
}

/** Repo-local override first, packaged default second. */
function seatDirs(repoRoot: string): string[] {
	return [path.join(repoRoot, CONFIG_DIR_NAME, "agents"), path.join(PKG_ROOT, "council", "agents")];
}

export function listSeatNames(repoRoot: string): string[] {
	const names = new Set<string>();
	for (const dir of seatDirs(repoRoot)) {
		if (!fs.existsSync(dir)) continue;
		for (const f of fs.readdirSync(dir)) {
			if (f.endsWith(".md")) names.add(f.replace(/\.md$/, ""));
		}
	}
	return [...names].sort();
}

export function loadSeat(repoRoot: string, name: string): Seat {
	for (const dir of seatDirs(repoRoot)) {
		const file = path.join(dir, `${name}.md`);
		if (fs.existsSync(file)) {
			const seat = parseSeatFile(fs.readFileSync(file, "utf-8"), file);
			return applySeatOverride(seat, loadCouncilConfig(repoRoot));
		}
	}
	throw new Error(`Unknown seat "${name}". Available: ${listSeatNames(repoRoot).join(", ")}`);
}

/** Procedures directory: repo override if present, else packaged default. */
export function proceduresDir(repoRoot: string): string {
	const override = path.join(repoRoot, CONFIG_DIR_NAME, "council", "procedures");
	return fs.existsSync(override) ? override : path.join(PKG_ROOT, "council", "procedures");
}

/** omp tool names → pi built-in tool ids, in stable order. */
const BUILTIN_MAP: Array<[string, string[]]> = [
	["Read", ["read"]],
	["Bash", ["bash"]],
	["Edit", ["edit"]],
	["Write", ["write"]],
	["Grep", ["grep"]],
	["Glob", ["find", "ls"]],
];

export function builtinToolsFor(seat: Seat): string[] {
	const granted = new Set(seat.tools);
	const out: string[] = [];
	for (const [omp, ids] of BUILTIN_MAP) if (granted.has(omp)) out.push(...ids);
	return out;
}

export function grantsFor(seat: Seat): { hub: boolean } {
	const t = new Set(seat.tools);
	return { hub: (t.has("task") || t.has("hub")) && seat.spawns.length > 0 };
}

function groundingBlock(repoRoot: string): string {
	const hasWiki = fs.existsSync(path.join(repoRoot, "vault", "wiki", "index.md"));
	const body = hasWiki
		? "This repository maintains an LLM wiki under `vault/`. Before taking positions on how this codebase works, read `vault/wiki/index.md` and drill into the relevant pages. Cite the pages you used. If the wiki does not cover something you would otherwise assume, say so."
		: "No repository wiki found; ground claims in the actual code before asserting them.";
	return `<repository_grounding>\n${body}\n</repository_grounding>`;
}

export function buildSystemPrompt(repoRoot: string, seat: Seat, procDir: string): string {
	return [
		seat.body,
		`<council_runtime>\nprocedures directory: ${procDir}\n</council_runtime>`,
		groundingBlock(repoRoot),
	].join("\n\n");
}

export function buildChildArgv(
	seat: Seat,
	input: string,
	promptFile: string,
	mcpTools: string[] = [],
	session: { sessionDir: string; sessionId: string },
): string[] {
	// -a: trust project-local files — the child runs headless in the same repo
	// the (already-trusted) parent dispatched from, so project extensions load.
	// --tools is an exact-name allowlist: granted MCP tool names are enumerated
	// here so the model can see and call them after the child registers them.
	// Sessions persist into the council runs dir so transcripts are navigable;
	// --session-dir scopes them away from the user's normal session list.
	const argv = ["--mode", "json", "-p", "-a", "--session-dir", session.sessionDir, "--session-id", session.sessionId, "--model", seat.model];
	if (seat.thinkingLevel) argv.push("--thinking", seat.thinkingLevel);
	const tools = [...builtinToolsFor(seat), ...mcpTools];
	if (grantsFor(seat).hub) tools.push("council_dispatch", "council_wait", "council_cancel");
	argv.push("--tools", tools.join(","));
	argv.push("--append-system-prompt", promptFile);
	argv.push(input);
	return argv;
}