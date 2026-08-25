import * as http from "node:http";
import * as crypto from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";

function s256(verifier: string): string {
	return crypto.createHash("sha256").update(verifier).digest("base64url");
}

export interface OAuthFixture {
	serverUrl: string; // protected MCP endpoint
	asUrl: string; // authorization server base
	close(): Promise<void>;
}

/**
 * Stub authorization server (RFC 8414 metadata, DCR, PKCE-validating token
 * endpoint) plus a protected Streamable HTTP MCP server requiring Bearer
 * tokens minted by the AS. The /authorize endpoint sets the PKCE challenge
 * and 302-redirects back to the client's redirect_uri with code=test-code —
 * tests fetch the authorization URL and let fetch follow the redirect.
 */
export async function startOAuthFixture(): Promise<OAuthFixture> {
	let codeChallenge = "";
	// Clerk-style: DCR echoes back the client's redirect_uris, and /authorize +
	// /token validate the redirect_uri against that registered list.
	let registeredRedirectUris: string[] = [];

	const as = http.createServer((req, res) => {
		const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "127.0.0.1"}`);
		const send = (status: number, body: unknown) => {
			res.writeHead(status, { "Content-Type": "application/json" });
			res.end(JSON.stringify(body));
		};
		if (req.method === "GET" && url.pathname === "/authorize") {
			codeChallenge = url.searchParams.get("code_challenge") ?? "";
			const redirectUri = url.searchParams.get("redirect_uri") ?? "";
			if (registeredRedirectUris.length > 0 && !registeredRedirectUris.includes(redirectUri)) {
				send(400, {
					error: "invalid_request",
					error_description:
						"The 'redirect_uri' parameter does not match any of the OAuth 2.0 Client's pre-registered redirect urls.",
				});
				return;
			}
			const state = url.searchParams.get("state") ?? "";
			res.writeHead(302, { Location: `${redirectUri}?code=test-code&state=${encodeURIComponent(state)}` });
			res.end();
			return;
		}
		if (req.method === "GET" && url.pathname === "/.well-known/oauth-authorization-server") {
			send(200, {
				issuer: url.origin,
				authorization_endpoint: `${url.origin}/authorize`,
				token_endpoint: `${url.origin}/token`,
				registration_endpoint: `${url.origin}/register`,
				response_types_supported: ["code"],
				grant_types_supported: ["authorization_code", "refresh_token"],
				code_challenge_methods_supported: ["S256"],
				token_endpoint_auth_methods_supported: ["none"],
			});
			return;
		}
		if (req.method === "POST" && url.pathname === "/register") {
			let body = "";
			req.on("data", (c) => (body += c));
			req.on("end", () => {
				try {
					registeredRedirectUris = (JSON.parse(body).redirect_uris ?? []) as string[];
				} catch {
					registeredRedirectUris = [];
				}
				send(201, {
					client_id: "test-client-id",
					redirect_uris: registeredRedirectUris,
				});
			});
			return;
		}
		if (req.method === "POST" && url.pathname === "/token") {
			let body = "";
			req.on("data", (c) => (body += c));
			req.on("end", () => {
				const params = new URLSearchParams(body);
				const grant = params.get("grant_type");
			if (grant === "authorization_code") {
				const verifier = params.get("code_verifier") ?? "";
				const redirectUri = params.get("redirect_uri") ?? "";
				if (
					params.get("code") !== "test-code" ||
					s256(verifier) !== codeChallenge ||
					(registeredRedirectUris.length > 0 && !registeredRedirectUris.includes(redirectUri))
				) {
					send(400, { error: "invalid_grant" });
					return;
				}
					send(200, { access_token: "acc-1", token_type: "Bearer", expires_in: 3600, refresh_token: "ref-1" });
				} else if (grant === "refresh_token") {
					if (params.get("refresh_token") !== "ref-1") {
						send(400, { error: "invalid_grant" });
						return;
					}
					send(200, { access_token: "acc-2", token_type: "Bearer", expires_in: 3600, refresh_token: "ref-2" });
				} else {
					send(400, { error: "unsupported_grant_type" });
				}
			});
			return;
		}
		send(404, { error: "not_found" });
	});
	await new Promise<void>((r) => as.listen(0, "127.0.0.1", r));
	const asPort = (as.address() as { port: number }).port;
	const asUrl = `http://127.0.0.1:${asPort}`;

	const mcp = new McpServer({ name: "fixture-oauth", version: "1.0.0" });
	mcp.registerTool(
		"echo",
		{ description: "Echo back the message", inputSchema: { message: z.string() } },
		async ({ message }) => ({ content: [{ type: "text", text: `echo: ${message}` }] }),
	);
	const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: () => crypto.randomUUID() });
	await mcp.connect(transport);

	const protectedServer = http.createServer(async (req, res) => {
		const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "127.0.0.1"}`);
		if (req.method === "GET" && url.pathname === "/.well-known/oauth-protected-resource") {
			res.writeHead(200, { "Content-Type": "application/json" });
			res.end(JSON.stringify({ resource: url.origin, authorization_servers: [asUrl] }));
			return;
		}
		const bearer = req.headers.authorization ?? "";
		if (!bearer.startsWith("Bearer acc-")) {
			res.writeHead(401, {
				"WWW-Authenticate": `Bearer resource_metadata="${url.origin}/.well-known/oauth-protected-resource"`,
			});
			res.end("unauthorized");
			return;
		}
		await transport.handleRequest(req, res);
	});
	await new Promise<void>((r) => protectedServer.listen(0, "127.0.0.1", r));
	const serverPort = (protectedServer.address() as { port: number }).port;

	return {
		serverUrl: `http://127.0.0.1:${serverPort}/mcp`,
		asUrl,
		close: async () => {
			await new Promise<void>((r) => protectedServer.close(() => r()));
			await new Promise<void>((r) => as.close(() => r()));
		},
	};
}
