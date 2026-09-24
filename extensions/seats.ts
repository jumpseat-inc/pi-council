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

export const THINKING_LEVELS = new Set(["off", "minimal", "low", "medium", "high", "xhigh", "max"]);

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

/** Optional pi theme tokens that join the 51 shipped colors keys. FLLWUP-22:
 * scrollbarTrack joins (recorded discretion) — a consumer may declare the new
 * 0.85.x token; on 0.84.3 it is inert-by-construction (fg-map carry, never read). */
const OPTIONAL_TOKENS = ["scrollbarThumb", "scrollbarTrack", "searchMatchBg", "searchMatchText", "thinkingMax"];

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

/** Retry policy for seat-child dispatch failures (EV-38). */
export interface RetryPolicy {
	enabled: boolean;
	maxAttempts: number;
	baseDelayMs: number;
	maxDelayMs: number;
	jitter: boolean;
}

/**
 * Shipped defaults (EV-38 ruling R2): byte-mirrored in
 * council/scaffold/.council.json so consumers see them as concrete data.
 */
export const DEFAULT_RETRY_POLICY: RetryPolicy = {
	enabled: true,
	maxAttempts: 3,
	baseDelayMs: 2000,
	maxDelayMs: 30000,
	jitter: true,
};

function retryInt(
	key: string,
	value: unknown,
	min: number,
	file: string,
): number {
	if (typeof value !== "number" || !Number.isInteger(value) || value < min) {
		throw new Error(`${file}: retry.${key} must be an integer ≥ ${min}`);
	}
	return value;
}

function retryBool(key: string, value: unknown, file: string): boolean {
	if (typeof value !== "boolean") {
		throw new Error(`${file}: retry.${key} must be a boolean`);
	}
	return value;
}

/**
 * Read and validate the optional top-level `retry` section of `.council.json`
 * (EV-38). Unlike `loadThemeConfig`, this always returns a full RetryPolicy:
 * absent file/section yields the R2 defaults, and a present value is merged
 * over the defaults base — `enabled: false` is off-as-data, never `undefined`
 * (absent-retry means enabled here, so a falsy absent-shape would be
 * load-bearing and silently re-enable a disabled policy). Malformed JSON,
 * invalid content, or unknown keys throw naming the file and the offending
 * key. The maxDelayMs-vs-baseDelayMs cross-check compares the merged values,
 * so it holds regardless of the file's key order.
 */
export function loadRetryConfig(repoRoot: string): RetryPolicy {
	const file = path.join(repoRoot, COUNCIL_CONFIG_FILE);
	if (!fs.existsSync(file)) return { ...DEFAULT_RETRY_POLICY };
	let parsed: unknown;
	try {
		parsed = JSON.parse(fs.readFileSync(file, "utf-8"));
	} catch (e) {
		throw new Error(`${file}: malformed JSON — ${e instanceof Error ? e.message : String(e)}`);
	}
	if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
		throw new Error(`${file}: root must be a JSON object`);
	}
	const raw = (parsed as Record<string, unknown>).retry;
	if (raw === undefined) return { ...DEFAULT_RETRY_POLICY };
	if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
		throw new Error(`${file}: "retry" must be an object`);
	}
	const out: RetryPolicy = { ...DEFAULT_RETRY_POLICY };
	for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
		switch (key) {
			case "enabled":
				out.enabled = retryBool("enabled", value, file);
				break;
			case "jitter":
				out.jitter = retryBool("jitter", value, file);
				break;
			case "maxAttempts":
				out.maxAttempts = retryInt("maxAttempts", value, 1, file);
				break;
			case "baseDelayMs":
				out.baseDelayMs = retryInt("baseDelayMs", value, 100, file);
				break;
			case "maxDelayMs":
				out.maxDelayMs = retryInt("maxDelayMs", value, 100, file);
				break;
			default:
				throw new Error(`${file}: unknown key "retry.${key}"`);
		}
	}
	if (out.maxDelayMs < out.baseDelayMs) {
		throw new Error(`${file}: retry.maxDelayMs must be ≥ retry.baseDelayMs`);
	}
	return out;
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
		} else if (suffix !== "") {
			throw new Error(
				`${fileName}: model "${model}" has unknown :thinking suffix ":${suffix}" (expected one of ${[...THINKING_LEVELS].join(", ")})`,
			);
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

/**
 * Parse the shared qualified-model grammar `provider/id` or `provider/id:thinking`.
 * A known `:thinking` suffix splits off; a non-empty unknown suffix throws (Q3)
 * instead of silently remaining part of the model id; a trailing colon with an
 * empty suffix keeps today's behavior. Unqualified values throw — this is a
 * second grammar, not a looser one.
 */
export function parseQualifiedModel(raw: string, where: string): { model: string; thinkingLevel?: string } {
	if (!raw.includes("/")) {
		throw new Error(`${where}: model "${raw}" must be qualified as provider/id`);
	}
	let model = raw.trim();
	let thinkingLevel: string | undefined;
	const colon = model.lastIndexOf(":");
	if (colon > 0) {
		const suffix = model.slice(colon + 1);
		if (THINKING_LEVELS.has(suffix)) {
			thinkingLevel = suffix;
			model = model.slice(0, colon);
		} else if (suffix !== "") {
			throw new Error(
				`${where}: model "${raw}" has unknown :thinking suffix ":${suffix}" (expected one of ${[...THINKING_LEVELS].join(", ")})`,
			);
		}
	}
	return { model, thinkingLevel };
}

/** Optional per-dispatch override params on council_dispatch (EV-17). */
export interface DispatchModelParam {
	model?: string;
	thinking?: string;
}

/**
 * Resolve the effective (model, thinkingLevel) for an eval dispatch.
 * Precedence, exactly: explicit per-dispatch param > COUNCIL_EVAL_MODEL env
 * > `.council.json` override > seat frontmatter. The seat passed in is the
 * post-loadSeat seat, so the `.council.json` > frontmatter layer is already
 * collapsed into it (loadSeat → applySeatOverride). Pure; no I/O.
 *
 * Each dimension independently falls through to the next-lower source: a param
 * that supplies only `model` leaves thinking to the env suffix, then the seat.
 * All three override sources parse the shared `provider/id[:thinking]` grammar.
 */
export function resolveEffectiveModel(
	seat: Pick<Seat, "model" | "thinkingLevel">,
	envVal?: string,
	param?: DispatchModelParam,
): { model: string; thinkingLevel?: string } {
	let model = seat.model;
	let thinkingLevel = seat.thinkingLevel;

	// Layer 2: COUNCIL_EVAL_MODEL env — canonical eval carrier.
	if (envVal !== undefined && envVal.trim() !== "") {
		const parsed = parseQualifiedModel(envVal, "COUNCIL_EVAL_MODEL");
		model = parsed.model;
		if (parsed.thinkingLevel !== undefined) thinkingLevel = parsed.thinkingLevel;
	}

	// Layer 3: per-dispatch params — optional sugar that win when present.
	if (param) {
		if (param.model !== undefined && param.model.trim() !== "") {
			const parsed = parseQualifiedModel(param.model, "council_dispatch model");
			model = parsed.model;
			if (parsed.thinkingLevel !== undefined) thinkingLevel = parsed.thinkingLevel;
		}
		if (param.thinking !== undefined && param.thinking.trim() !== "") {
			if (!THINKING_LEVELS.has(param.thinking)) {
				throw new Error(`council_dispatch thinking must be one of ${[...THINKING_LEVELS].join(", ")}`);
			}
			thinkingLevel = param.thinking;
		}
	}
	return { model, thinkingLevel };
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
		if (colon > 0) {
			const suffix = model.slice(colon + 1);
			if (THINKING_LEVELS.has(suffix)) {
				thinkingLevel = suffix;
				model = model.slice(0, colon);
			} else if (suffix !== "") {
				throw new Error(
					`council["${seat.name}"].model "${model}" has unknown :thinking suffix ":${suffix}" (expected one of ${[...THINKING_LEVELS].join(", ")})`,
				);
			}
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

/** Substitute runtime placeholders into a stripped procedure body. EV-90:
 * relocated here from index.ts (the import graph is binding — the composer
 * below lives in this module, and seats → index would cycle; index.ts
 * re-exports this so the parent scan path and every existing importer stay
 * green). Substitution set and behavior are byte-identical to the original
 * (AC4): exactly $COUNCIL_PROCEDURES and $ARGUMENTS, nothing else (FLLWUP-107
 * pin in test/render.test.ts imports through the re-export). */
export function renderProcedure(strippedBody: string, procDir: string, args?: string): string {
	return strippedBody
		.replace(/\$COUNCIL_PROCEDURES/g, procDir)
		.replace(/\$ARGUMENTS/g, (args ?? "").trim());
}

/** EV-90: read one procedure body per-file, override-first — walk
 * [repoOverride, packaged] by filename (the same walk as the parent command
 * scan in index.ts), taking the first file that exists, never mixing halves,
 * then apply the scan's frontmatter strip. Never
 * path.join(proceduresDir(repoRoot), name): proceduresDir is directory-level
 * first-hit and a join reads the wrong (unstripped, ENOENT) files in any
 * partial-override repo. */
function readProcedureBody(repoRoot: string, name: string): string {
	const override = path.join(repoRoot, CONFIG_DIR_NAME, "council", "procedures", name);
	const packaged = path.join(PKG_ROOT, "council", "procedures", name);
	const file = fs.existsSync(override) ? override : packaged;
	if (!fs.existsSync(file)) {
		throw new Error(`composeRunnerInput: procedure "${name}" not found at ${override} or ${packaged}`);
	}
	return fs.readFileSync(file, "utf-8").replace(FRONTMATTER_RE, "");
}

/** FLLWUP-115: the packaged-procedure frontmatter block — shared by
 * readProcedureBody's strip (procedure path: the body is the payload) and
 * epicKeyFromFace's match scope (card path: the frontmatter is the payload).
 * Byte-0-anchored by design (documented caveat: a leading blank line or a
 * closing `---` at EOF without a trailing newline makes the block unmatchable;
 * no corpus face has either — any future one reds T4's equivalence sweep). */
const FRONTMATTER_RE = /^---\n[\s\S]*?\n---\n/;

/** FLLWUP-115: the epic key derived from one card face's frontmatter block
 * only — a body line beginning `epic:` can never win the derivation (the
 * whole-file match it replaces could). Pure: raw face text in, key out.
 * Absent frontmatter block ⇒ absent epic. FLLWUP-117 (the delivered
 * throw-site truth): a null/absent epic throws HERE, inside this function —
 * the named-card epic-field D1 refusal, byte-for-byte. cardEpicKey retains
 * only the nonexistent-face read refusal and delegates the derivation. */
export function epicKeyFromFace(raw: string, cardId: string): string {
	const block = raw.match(FRONTMATTER_RE)?.[0] ?? "";
	const m = block.match(/^epic:\s*(.*)$/m);
	const epic = m?.[1]?.trim();
	if (!epic || epic === "null") {
		throw new Error(
			`council-runner dispatch for card "${cardId}" refused: the card face's epic: field is null or absent (EV-90 D1 ruling — a runner dispatched without its features-deliver scope is a degraded dispatch, not a fallback)`,
		);
	}
	return epic;
}

/** EV-90: the epic key the features-deliver.md rendering binds — derived from
 * the card face's `epic:` field so a mismatched (card, epic) pair is
 * impossible by construction. D1 ruling (EV-90, 2026-09-24): a null or absent
 * epic is a fail-loud refusal naming the card — never an un-substituted or
 * omitted overlay (a runner without its features-deliver scope is a degraded
 * dispatch, not a fallback). FLLWUP-115: the match is scoped to the
 * frontmatter block (epicKeyFromFace) — body occurrences cannot win. */
export function cardEpicKey(repoRoot: string, cardId: string): string {
	const face = path.join(repoRoot, "council", "cards", `${cardId}.md`);
	let raw: string;
	try {
		raw = fs.readFileSync(face, "utf-8");
	} catch {
		throw new Error(
			`council-runner dispatch for card "${cardId}" refused: its card face council/cards/${cardId}.md does not exist`,
		);
	}
	return epicKeyFromFace(raw, cardId);
}

/** EV-90 — compose the council-runner dispatch input: council.md rendered with
 * the card id, then features-deliver.md rendered with the epic key derived
 * from the card face (top-down reading order = working order; the overlay
 * addresses the orchestrator — the seat block tells the runner how to read
 * it), then the parent's task text appended verbatim as the `<task>` tail.
 * The tail is concatenated, never passed through .replace — its $&/$n
 * replacement metacharacters would corrupt arbitrary task text. */
export function composeRunnerInput(repoRoot: string, cardId: string, taskInput: string): string {
	const procDir = proceduresDir(repoRoot);
	const councilBody = renderProcedure(readProcedureBody(repoRoot, "council.md"), procDir, cardId);
	const featuresBody = renderProcedure(
		readProcedureBody(repoRoot, "features-deliver.md"),
		procDir,
		cardEpicKey(repoRoot, cardId),
	);
	return [
		`<council-procedure>\n${councilBody}\n</council-procedure>`,
		`<features-deliver-overlay>\n${featuresBody}\n</features-deliver-overlay>`,
		`<task>\n${taskInput}\n</task>`,
	].join("\n\n");
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

/** The engine grant keywords, mirroring the omp tool vocabulary: `hub`
 * gates the dispatch/wait/cancel trio, `followup` (EV-83) gates the
 * child-mode `council_followup_review` tool. */
export function grantsFor(seat: Seat): { hub: boolean; followup: boolean } {
	const t = new Set(seat.tools);
	return {
		hub: (t.has("task") || t.has("hub")) && seat.spawns.length > 0,
		followup: t.has("followup"),
	};
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
	const grants = grantsFor(seat);
	if (grants.hub) tools.push("council_dispatch", "council_wait", "council_cancel");
	// EV-83: the followup grant carries the child-mode review tool only —
	// the parent-session gate/render pair stays parent-path registered.
	if (grants.followup) tools.push("council_followup_review");
	argv.push("--tools", tools.join(","));
	argv.push("--append-system-prompt", promptFile);
	argv.push(input);
	return argv;
}