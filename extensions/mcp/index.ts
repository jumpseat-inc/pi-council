import type { ExtensionAPI, ExtensionCommandContext } from "@earendil-works/pi-coding-agent";
import { loadMcpConfig, saveMcpConfig, validateEntry, type McpServerConfig } from "./config.ts";
import { clearServerSecrets, loadAuth, saveAuth } from "./auth-store.ts";
import { McpManager, type McpServerRuntime } from "./client.ts";
import { jsonSchemaToTypebox } from "./schema.ts";
import {
	CouncilOAuthProvider,
	loginOAuth,
	loginRemote,
	completeRemoteLogin,
	isRemoteSession,
} from "./oauth.ts";
import type { Seat } from "../seats.ts";

let managerSingleton: McpManager | null = null;

/**
 * Process-wide manager. In child mode COUNCIL_SEAT selects the seat; in parent
 * mode the same instance serves session_start connections and dispatch lookups.
 */
export function getMcpManager(_repoRoot: string): McpManager {
	if (!managerSingleton) {
		managerSingleton = new McpManager({
			secrets: (name) => loadAuth().servers[name]?.headers ?? {},
			// Headless context: interactive login runs through loginOAuth (own
			// provider + loopback). This provider only serves token refresh, so its
			// browser hook is a no-op — a fresh authorization attempt would mean the
			// stored credentials are gone, and the reauth-required path handles that.
			authProvider: (name, cfg) =>
				cfg.auth === "oauth" && cfg.url
					? new CouncilOAuthProvider(name, "http://127.0.0.1/callback", { openUrl: () => {} })
					: undefined,
		});
	}
	return managerSingleton;
}

/** Register one connected server's tools as pi tools under mcp__<server>__<tool>. */
export function registerServerTools(
	pi: ExtensionAPI,
	manager: McpManager,
	serverName: string,
	runtime: McpServerRuntime,
): void {
	for (const tool of runtime.tools) {
		const fullName = `mcp__${serverName}__${tool.name}`;
		pi.registerTool({
			name: fullName,
			label: `MCP ${serverName}/${tool.name}`,
			description: tool.description ?? `MCP tool "${tool.name}" from server "${serverName}".`,
			parameters: jsonSchemaToTypebox(tool.inputSchema),
			async execute(_id, params) {
				const args = (params ?? {}) as Record<string, unknown>;
				try {
					const text = await manager.call(serverName, tool.name, args);
					return { content: [{ type: "text", text }], details: {}, isError: false };
				} catch (e) {
					const message = e instanceof Error ? e.message : String(e);
					return { content: [{ type: "text", text: message }], details: {}, isError: true };
				}
			},
		});
	}
}

/**
 * Seat startup: connect eagerly to granted, enabled servers and register their
 * tools. pi's tool refresh re-activates registered tools whose exact names were
 * in the child's --tools allowlist, so registration after session start is safe.
 */
export async function startSeatMcp(pi: ExtensionAPI, repoRoot: string, seat: Seat): Promise<void> {
	if ((seat.mcp ?? []).length === 0) return;
	const cfg = loadMcpConfig(repoRoot);
	const manager = getMcpManager(repoRoot);
	for (const name of seat.mcp ?? []) {
		const serverCfg = cfg.servers[name];
		if (!serverCfg || serverCfg.enabled === false) continue;
		if (validateEntry(name, serverCfg).length > 0) continue;
		const runtime = await manager.connect(name, serverCfg);
		if (runtime.status === "connected") registerServerTools(pi, manager, name, runtime);
	}
}

/** Parent session_start: connect enabled servers, register tools, report failures. */
export async function connectParentServers(pi: ExtensionAPI, repoRoot: string): Promise<string[]> {
	const cfg = loadMcpConfig(repoRoot);
	const manager = getMcpManager(repoRoot);
	const notes: string[] = [];
	for (const [name, serverCfg] of Object.entries(cfg.servers)) {
		if (serverCfg.enabled === false || validateEntry(name, serverCfg).length > 0 || manager.has(name)) continue;
		const runtime = await manager.connect(name, serverCfg);
		if (runtime.status === "connected") {
			registerServerTools(pi, manager, name, runtime);
		} else {
			notes.push(`mcp ${name}: ${runtime.status}${runtime.error ? ` — ${runtime.error}` : ""}`);
		}
	}
	return notes;
}

export async function runMcpSubcommand(
	repoRoot: string,
	sub: string,
	args: string[],
	ctx: ExtensionCommandContext,
): Promise<string> {
	switch (sub) {
		case "list":
			return listServers(repoRoot);
		case "add":
			return addServer(repoRoot, args);
		case "remove":
			return removeServer(repoRoot, args[0]);
		case "status":
			return probeServer(repoRoot, args[0]);
		case "login":
			return loginServer(repoRoot, args[0], ctx, args.slice(1));
		case "auth": {
			const out = await completeRemoteLogin(repoRoot, args[0], args.slice(1).join(" "));
			await refreshServerRuntime(repoRoot, args[0]);
			return out;
		}
		case "logout":
			return logoutServer(repoRoot, args[0]);
		default:
			return "Usage: /mcp list | add <name> <url> [none|header|oauth] | add <name> -- <command> [args…] | remove <name> | status <name> | login <name> [--remote|--local] | auth <name> <url-or-code> | logout <name>";
	}
}

function listServers(repoRoot: string): string {
	const cfg = loadMcpConfig(repoRoot);
	const manager = getMcpManager(repoRoot);
	const names = Object.keys(cfg.servers);
	if (names.length === 0) return "No MCP servers registered. Add one: /mcp add <name> <url>";
	const rows = names.map((name) => {
		const s = cfg.servers[name]!;
		const transport = s.url ? "http" : "stdio";
		const rt = manager.get(name);
		const status = s.enabled === false ? "disabled" : rt ? rt.status : "not connected";
		const tools = rt ? rt.tools.length : 0;
		return `${name}  ${transport.padEnd(5)}  auth=${s.auth.padEnd(6)}  ${status.padEnd(14)}  tools=${tools}`;
	});
	return ["MCP servers:", ...rows].join("\n");
}

function addServer(repoRoot: string, args: string[]): string {
	const name = args[0];
	if (!name) return "Usage: /mcp add <name> <url> [none|header|oauth]  or  /mcp add <name> -- <command> [args…]";
	const cfg = loadMcpConfig(repoRoot);
	if (cfg.servers[name]) return `Server "${name}" already exists. Remove it first: /mcp remove ${name}`;
	const dash = args.indexOf("--");
	let entry: McpServerConfig;
	if (dash > 0) {
		entry = { command: args[dash + 1], args: args.slice(dash + 2), auth: "none" };
	} else if (args[1]) {
		const mode = args[2];
		entry = {
			url: args[1],
			auth: mode === "header" || mode === "oauth" || mode === "none" ? mode : "none",
		};
	} else {
		return "Usage: /mcp add <name> <url> [none|header|oauth]  or  /mcp add <name> -- <command> [args…]";
	}
	const errs = validateEntry(name, entry);
	if (errs.length > 0) return errs.join("\n");
	cfg.servers[name] = entry;
	saveMcpConfig(repoRoot, cfg);
	const next = entry.auth !== "none" ? ` — run /mcp login ${name} to authenticate` : "";
	return `Registered MCP server "${name}"${next}. Tool changes take effect next session (or /reload).`;
}

async function removeServer(repoRoot: string, name?: string): Promise<string> {
	const cfg = loadMcpConfig(repoRoot);
	if (!name || !cfg.servers[name]) return `Unknown server "${name ?? ""}".`;
	delete cfg.servers[name];
	saveMcpConfig(repoRoot, cfg);
	clearServerSecrets(name);
	await getMcpManager(repoRoot).close(name);
	return `Removed MCP server "${name}" and its stored secrets. Tool changes take effect next session (or /reload).`;
}

/** Live probe: reconnect and report status + tools. Tool registration for the
 * live session still requires /reload (pi has no tool deregistration). */
async function probeServer(repoRoot: string, name?: string): Promise<string> {
	if (!name) return "Usage: /mcp status <name>";
	const cfg = loadMcpConfig(repoRoot);
	const serverCfg = cfg.servers[name];
	if (!serverCfg) return `Unknown server "${name}".`;
	const manager = getMcpManager(repoRoot);
	await manager.close(name);
	const rt = await manager.connect(name, serverCfg);
	const tools = rt.tools.map((t) => `  - ${t.name}`).join("\n") || "  (no tools)";
	return `${name}: ${rt.status}${rt.error ? ` — ${rt.error}` : ""}\n${tools}`;
}

/**
 * After a credential change (login/auth), reconnect the live runtime so
 * /mcp list reflects the new status instead of the stale one captured at
 * session start. Tool registration for the live session still requires
 * /reload (pi has no tool deregistration).
 */
async function refreshServerRuntime(repoRoot: string, name: string): Promise<void> {
	const cfg = loadMcpConfig(repoRoot).servers[name];
	if (!cfg || cfg.enabled === false) return;
	const manager = getMcpManager(repoRoot);
	await manager.close(name);
	await manager.connect(name, cfg);
}

async function loginServer(repoRoot: string, name: string | undefined, ctx: ExtensionCommandContext, flags: string[] = []): Promise<string> {
	if (!name) return "Usage: /mcp login <name> [--remote|--local]";
	const cfg = loadMcpConfig(repoRoot);
	const serverCfg = cfg.servers[name];
	if (!serverCfg) return `Unknown server "${name}".`;
	if (serverCfg.auth === "none") return `Server "${name}" uses no authentication.`;
	if (serverCfg.auth === "header") {
		const keys = Object.keys(serverCfg.headers ?? {}).filter((k) => !(serverCfg.headers![k] ?? "").includes("$"));
		if (keys.length === 0) {
			return `Server "${name}" headers are env-indirected ($VAR) or absent — nothing to store. Set the env vars and reconnect: /mcp status ${name}`;
		}
		if (!ctx.hasUI) return "Header login needs an interactive session.";
		const store = loadAuth();
		const entry = store.servers[name] ?? {};
		entry.headers = entry.headers ?? {};
		for (const k of keys) {
			entry.headers[k] = (await ctx.ui.input(`Secret for header ${k}:`)) ?? "";
		}
		store.servers[name] = entry;
		saveAuth(store);
		await refreshServerRuntime(repoRoot, name);
		return `Stored secrets for "${name}". Reconnect: /mcp status ${name}`;
	}
	// oauth — auto-detect headless/remote unless explicitly overridden
	let remote: boolean | undefined;
	for (const f of flags) {
		if (f === "--remote") remote = true;
		else if (f === "--local") remote = false;
	}
	const out = (remote ?? isRemoteSession()) ? await loginRemote(repoRoot, name) : await loginOAuth(repoRoot, name);
	if (out.includes("Authenticated") || out.includes("Already authenticated")) {
		await refreshServerRuntime(repoRoot, name);
	}
	return out;
}

async function logoutServer(repoRoot: string, name?: string): Promise<string> {
	if (!name) return "Usage: /mcp logout <name>";
	const cleared = clearServerSecrets(name);
	await getMcpManager(repoRoot).close(name);
	return cleared
		? `Credentials for "${name}" cleared. Re-authenticate with /mcp login ${name}.`
		: `No stored credentials for "${name}".`;
}

export function registerMcpCommand(pi: ExtensionAPI, repoRoot: string): void {
	pi.registerCommand("mcp", {
		description: "Manage Council MCP servers: list | add | remove | status | login [--remote] | auth | logout",
		handler: async (args, ctx) => {
			const parts = (args ?? "").trim().split(/\s+/).filter(Boolean);
			const out = await runMcpSubcommand(repoRoot, parts[0] ?? "", parts.slice(1), ctx);
			if (ctx.hasUI) ctx.ui.notify(out, "info");
			else console.log(out);
		},
	});
}
