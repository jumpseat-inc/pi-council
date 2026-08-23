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
	body: string;
}

const THINKING_LEVELS = new Set(["off", "minimal", "low", "medium", "high", "xhigh", "max"]);

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
		body: body.trim(),
	};
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
		if (fs.existsSync(file)) return parseSeatFile(fs.readFileSync(file, "utf-8"), file);
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

export function buildChildArgv(seat: Seat, input: string, promptFile: string): string[] {
	// -a: trust project-local files — the child runs headless in the same repo
	// the (already-trusted) parent dispatched from, so project extensions load.
	const argv = ["--mode", "json", "-p", "-a", "--no-session", "--model", seat.model];
	if (seat.thinkingLevel) argv.push("--thinking", seat.thinkingLevel);
	argv.push("--tools", builtinToolsFor(seat).join(","));
	argv.push("--append-system-prompt", promptFile);
	argv.push(input);
	return argv;
}
