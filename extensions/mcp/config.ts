import * as fs from "node:fs";
import * as path from "node:path";
import { CONFIG_DIR_NAME } from "@earendil-works/pi-coding-agent";

export type McpAuthMode = "none" | "header" | "oauth";

export interface McpServerConfig {
	url?: string;
	command?: string;
	args?: string[];
	auth: McpAuthMode;
	headers?: Record<string, string>;
	enabled?: boolean;
}

export interface McpConfig {
	servers: Record<string, McpServerConfig>;
}

export function mcpConfigPath(repoRoot: string): string {
	return path.join(repoRoot, CONFIG_DIR_NAME, "council", "mcp.json");
}

export function loadMcpConfig(repoRoot: string): McpConfig {
	const file = mcpConfigPath(repoRoot);
	if (!fs.existsSync(file)) return { servers: {} };
	let parsed: unknown;
	try {
		parsed = JSON.parse(fs.readFileSync(file, "utf-8"));
	} catch (e) {
		throw new Error(`Malformed MCP config ${file}: ${(e as Error).message}`);
	}
	if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
		throw new Error(`Malformed MCP config ${file}: expected a JSON object`);
	}
	const servers = (parsed as { servers?: Record<string, McpServerConfig> }).servers;
	if (!servers || typeof servers !== "object" || Array.isArray(servers)) {
		throw new Error(`Malformed MCP config ${file}: "servers" must be an object map`);
	}
	return { servers };
}

export function saveMcpConfig(repoRoot: string, config: McpConfig): void {
	const file = mcpConfigPath(repoRoot);
	fs.mkdirSync(path.dirname(file), { recursive: true });
	fs.writeFileSync(file, JSON.stringify(config, null, 2) + "\n");
}

export function validateEntry(name: string, cfg: McpServerConfig): string[] {
	const errs: string[] = [];
	const hasUrl = typeof cfg?.url === "string" && cfg.url.length > 0;
	const hasCmd = typeof cfg?.command === "string" && cfg.command.length > 0;
	if (hasUrl === hasCmd) {
		errs.push(`server "${name}": exactly one of "url" or "command" is required`);
	}
	if (cfg?.auth !== "none" && cfg?.auth !== "header" && cfg?.auth !== "oauth") {
		errs.push(`server "${name}": auth must be one of none|header|oauth`);
	} else if (cfg?.auth !== "none" && !hasUrl) {
		errs.push(`server "${name}": "${cfg.auth}" auth requires a remote http server ("url"); stdio servers use none`);
	}
	if (cfg?.enabled !== undefined && typeof cfg.enabled !== "boolean") {
		errs.push(`server "${name}": enabled must be a boolean`);
	}
	return errs;
}

function substituteEnv(value: string): { text: string; complete: boolean } {
	let complete = true;
	const text = value.replace(/\$([A-Z_][A-Z0-9_]*)/g, (_m, name: string) => {
		const v = process.env[name];
		if (v === undefined) {
			complete = false;
			return "";
		}
		return v;
	});
	return { text, complete };
}

export function resolveHeaders(cfg: McpServerConfig, stored: Record<string, string> = {}): Record<string, string> {
	const out: Record<string, string> = {};
	for (const [k, v] of Object.entries(cfg.headers ?? {})) {
		if (v.includes("$")) {
			const { text, complete } = substituteEnv(v);
			if (complete) out[k] = text;
			else if (stored[k] !== undefined) out[k] = stored[k]; // unresolved $VAR → stored fallback
		} else if (stored[k] !== undefined) {
			out[k] = stored[k]; // login-provided secret wins over the literal
		} else {
			out[k] = v;
		}
	}
	for (const [k, v] of Object.entries(stored)) {
		if (!(k in out)) out[k] = v; // headers entered via /mcp login that cfg doesn't name
	}
	return out;
}
