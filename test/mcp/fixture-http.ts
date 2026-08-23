import * as http from "node:http";
import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";

export interface HttpFixture {
	url: string;
	close(): Promise<void>;
}

/**
 * Streamable HTTP MCP server on an ephemeral 127.0.0.1 port.
 * `requiredHeader` guards requests with an X-Fix-Key check (401 otherwise).
 */
export async function startFixtureHttpServer(requiredHeader?: string): Promise<HttpFixture> {
	const mcp = new McpServer({ name: "fixture-http", version: "1.0.0" });
	mcp.registerTool(
		"echo",
		{ description: "Echo back the message", inputSchema: { message: z.string() } },
		async ({ message }) => ({ content: [{ type: "text", text: `echo: ${message}` }] }),
	);
	const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: () => randomUUID() });
	await mcp.connect(transport);
	const httpServer = http.createServer(async (req, res) => {
		if (requiredHeader && req.headers["x-fix-key"] !== requiredHeader) {
			res.writeHead(401, { "Content-Type": "text/plain" });
			res.end("missing X-Fix-Key");
			return;
		}
		await transport.handleRequest(req, res);
	});
	await new Promise<void>((resolve) => httpServer.listen(0, "127.0.0.1", resolve));
	const port = (httpServer.address() as { port: number }).port;
	return {
		url: `http://127.0.0.1:${port}/mcp`,
		close: () => new Promise<void>((resolve) => httpServer.close(() => resolve())),
	};
}
