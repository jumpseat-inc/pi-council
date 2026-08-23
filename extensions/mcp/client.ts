import { Client } from "@modelcontextprotocol/sdk/client";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { UnauthorizedError, type OAuthClientProvider } from "@modelcontextprotocol/sdk/client/auth.js";
import { resolveHeaders, type McpServerConfig } from "./config.ts";

export type ServerStatus = "disabled" | "unauthenticated" | "connected" | "error" | "reauth-required";

export interface McpToolInfo {
	name: string;
	description?: string;
	inputSchema?: unknown;
}

export interface McpServerRuntime {
	name: string;
	client: Client;
	transport: StreamableHTTPClientTransport | StdioClientTransport;
	tools: McpToolInfo[];
	status: ServerStatus;
	error?: string;
}

export interface McpManagerOptions {
	/** Stored header secrets for a server (from the user-global auth store). */
	secrets?: (serverName: string) => Record<string, string>;
	/** Provider factory for oauth-mode servers. */
	authProvider?: (serverName: string, config: McpServerConfig) => OAuthClientProvider | undefined;
}

const CLIENT_INFO = { name: "pi-council", version: "0.2.0" };

function formatToolResult(result: { content?: unknown[]; isError?: boolean }): string {
	const parts: string[] = [];
	for (const raw of result.content ?? []) {
		const part = raw as { type?: string; text?: string };
		if (part?.type === "text" && typeof part.text === "string") parts.push(part.text);
		else parts.push(JSON.stringify(raw));
	}
	const body = parts.join("\n") || "(empty result)";
	return result.isError ? `MCP tool error: ${body}` : body;
}

export class McpManager {
	private runtimes = new Map<string, McpServerRuntime>();

	constructor(private opts: McpManagerOptions = {}) {}

	has(name: string): boolean {
		return this.runtimes.has(name);
	}

	get(name: string): McpServerRuntime | undefined {
		return this.runtimes.get(name);
	}

	/**
	 * Connect and enumerate tools. Connection failures are captured in
	 * `status` (unauthenticated | error), never thrown — a dead server must
	 * not block session startup. Invalid config (neither url nor command) throws.
	 */
	async connect(name: string, cfg: McpServerConfig): Promise<McpServerRuntime> {
		const authProvider = cfg.auth === "oauth" ? this.opts.authProvider?.(name, cfg) : undefined;
		let transport: StreamableHTTPClientTransport | StdioClientTransport;
		if (cfg.url) {
			const headers = cfg.auth === "header" ? resolveHeaders(cfg, this.opts.secrets?.(name) ?? {}) : undefined;
			transport = new StreamableHTTPClientTransport(new URL(cfg.url), {
				authProvider,
				requestInit: headers ? { headers } : undefined,
			});
		} else if (cfg.command) {
			transport = new StdioClientTransport({ command: cfg.command, args: cfg.args ?? [] });
		} else {
			throw new Error(`MCP server "${name}" has neither url nor command`);
		}
		const client = new Client(CLIENT_INFO, { capabilities: {} });
		const runtime: McpServerRuntime = { name, client, transport, tools: [], status: "connected" };
		this.runtimes.set(name, runtime);
		try {
			await client.connect(transport);
			const { tools } = await client.listTools();
			runtime.tools = tools.map((t) => ({
				name: t.name,
				description: t.description,
				inputSchema: t.inputSchema,
			}));
		} catch (e) {
			runtime.status = e instanceof UnauthorizedError ? "unauthenticated" : "error";
			runtime.error = e instanceof Error ? e.message : String(e);
		}
		return runtime;
	}

	listToolNames(name: string): string[] {
		return this.runtimes.get(name)?.tools.map((t) => `mcp__${name}__${t.name}`) ?? [];
	}

	/** Structured reauth sentinel on auth failure; MCP-side tool errors surface as text. */
	async call(name: string, toolName: string, args: Record<string, unknown>): Promise<string> {
		const runtime = this.runtimes.get(name);
		if (!runtime) throw new Error(`MCP server "${name}" is not connected`);
		try {
			// callTool's union includes a legacy compatibility variant without
			// `content` — normalize defensively in formatToolResult.
			const result = (await runtime.client.callTool({ name: toolName, arguments: args })) as {
				content?: unknown[];
				isError?: boolean;
			};
			return formatToolResult(result);
		} catch (e) {
			if (e instanceof UnauthorizedError) {
				runtime.status = "reauth-required";
				runtime.error = e.message;
				throw new Error(`MCP server "${name}" requires reauthentication — run /mcp login ${name}.`);
			}
			throw e;
		}
	}

	statuses(): Record<string, { status: ServerStatus; toolCount: number; error?: string }> {
		const out: Record<string, { status: ServerStatus; toolCount: number; error?: string }> = {};
		for (const [name, rt] of this.runtimes) {
			out[name] = { status: rt.status, toolCount: rt.tools.length, error: rt.error };
		}
		return out;
	}

	async close(name: string): Promise<void> {
		const runtime = this.runtimes.get(name);
		if (!runtime) return;
		this.runtimes.delete(name);
		try {
			await runtime.client.close();
		} catch {
			/* best effort */
		}
	}

	async closeAll(): Promise<void> {
		await Promise.all([...this.runtimes.keys()].map((n) => this.close(n)));
	}
}
