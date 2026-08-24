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
	argv.push("--tools", [...builtinToolsFor(seat), ...mcpTools].join(","));
	argv.push("--append-system-prompt", promptFile);
	argv.push(input);
	return argv;
}