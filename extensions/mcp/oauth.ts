import * as http from "node:http";
import { execFile } from "node:child_process";
import { auth, UnauthorizedError, type OAuthClientProvider, type OAuthDiscoveryState } from "@modelcontextprotocol/sdk/client/auth.js";
import type {
	OAuthClientInformationMixed,
	OAuthTokens,
} from "@modelcontextprotocol/sdk/shared/auth.js";
import { loadMcpConfig } from "./config.ts";
import { loadAuth, saveAuth, type McpAuthServerEntry } from "./auth-store.ts";

/** Best-effort system browser open (macOS/Linux/Windows). */
export function openBrowser(url: string): void {
	const [cmd, ...args] =
		process.platform === "darwin"
			? ["open", url]
			: process.platform === "win32"
				? ["cmd", "/c", "start", "", url]
				: ["xdg-open", url];
	execFile(cmd, args, () => {});
}

export interface CallbackListener {
	port: number;
	waitForCode(timeoutMs: number): Promise<string>;
	close(): void;
}

/** Ephemeral 127.0.0.1 loopback listener capturing /callback?code=… . */
export function startCallbackListener(): Promise<CallbackListener> {
	return new Promise((resolve) => {
		let waiting: { resolve: (code: string) => void; reject: (e: Error) => void } | null = null;
		const server = http.createServer((req, res) => {
			const url = new URL(req.url ?? "/", "http://127.0.0.1");
			if (url.pathname !== "/callback") {
				res.writeHead(404);
				res.end();
				return;
			}
			const code = url.searchParams.get("code");
			if (!code) {
				res.writeHead(400, { "Content-Type": "text/html" });
				res.end("Missing code");
				return;
			}
			res.writeHead(200, { "Content-Type": "text/html" });
			res.end("<html><body><h2>Authorization received. Close this tab and return to pi.</h2></body></html>");
			waiting?.resolve(code);
		});
		server.listen(0, "127.0.0.1", () => {
			const port = (server.address() as { port: number }).port;
			resolve({
				port,
				waitForCode(timeoutMs: number): Promise<string> {
					return new Promise((res, rej) => {
						waiting = { resolve: res, reject: rej };
						const timer = setTimeout(() => rej(new Error("Timed out waiting for OAuth callback")), timeoutMs);
						timer.unref?.();
					});
				},
				close(): void {
					server.close();
				},
			});
		});
	});
}

export interface CouncilOAuthProviderOptions {
	/** Browser hook; tests inject a simulator. Default: openBrowser. */
	openUrl?: (url: string) => void;
	/** Invoked when credentials are invalidated (refresh failed etc.). */
	onInvalidate?: (error?: string) => void;
}

/**
 * OAuthClientProvider backed by the user-global auth store. The SDK handles
 * discovery, DCR, PKCE, token exchange and refresh; this class supplies
 * persistence, the browser hook, and the loopback redirect URI.
 */
export class CouncilOAuthProvider implements OAuthClientProvider {
	private open: (url: string) => void;

	constructor(
		private serverName: string,
		private redirectUri: string,
		private opts: CouncilOAuthProviderOptions = {},
	) {
		this.open = opts.openUrl ?? openBrowser;
	}

	private entry(): NonNullable<McpAuthServerEntry["oauth"]> {
		return loadAuth().servers[this.serverName]?.oauth ?? {};
	}

	private patch(part: Partial<NonNullable<McpAuthServerEntry["oauth"]>>): void {
		const file = loadAuth();
		const entry = file.servers[this.serverName] ?? {};
		entry.oauth = { ...(entry.oauth ?? {}), ...part };
		file.servers[this.serverName] = entry;
		saveAuth(file);
	}

	get redirectUrl(): string {
		// Prefer a redirect URI the AS actually registered for this client. A
		// persisted DCR client (e.g. from an earlier loopback login with an
		// ephemeral port) has a fixed registered list; advertising a foreign URI
		// (the remote constant, or a fresh ephemeral port) makes the AS reject
		// with invalid_request "redirect_uri does not match". Copy-paste login
		// works with ANY registered URI — it needn't be reachable.
		const client = this.entry().client as { redirect_uris?: string[] } | undefined;
		const registered = client?.redirect_uris;
		if (registered && registered.length > 0) return registered[0];
		return this.redirectUri;
	}

	get clientMetadata() {
		return {
			redirect_uris: [this.redirectUri],
			client_name: "pi-council",
			grant_types: ["authorization_code", "refresh_token"],
			response_types: ["code"],
			token_endpoint_auth_method: "none",
		};
	}

	async clientInformation(): Promise<OAuthClientInformationMixed | undefined> {
		return this.entry().client as OAuthClientInformationMixed | undefined;
	}

	async saveClientInformation(info: OAuthClientInformationMixed): Promise<void> {
		this.patch({ client: info });
	}

	async tokens(): Promise<OAuthTokens | undefined> {
		return this.entry().tokens as OAuthTokens | undefined;
	}

	async saveTokens(tokens: OAuthTokens): Promise<void> {
		// A verifier is single-use: any token save (exchange or refresh) consumes it.
		this.patch({ tokens, verifier: undefined });
	}

	async redirectToAuthorization(authorizationUrl: URL): Promise<void> {
		this.open(authorizationUrl.toString());
	}

	async saveCodeVerifier(verifier: string): Promise<void> {
		// Persisted (not memory-only) so the two-phase remote flow can split phase 1
		// (build + print the authorization URL) from phase 2 (paste back, exchange).
		this.patch({ verifier });
	}

	async codeVerifier(): Promise<string> {
		return this.entry().verifier ?? "";
	}

	async saveDiscoveryState(state: OAuthDiscoveryState): Promise<void> {
		this.patch({ discovery: state });
	}

	async discoveryState(): Promise<OAuthDiscoveryState | undefined> {
		return this.entry().discovery as OAuthDiscoveryState | undefined;
	}

	async invalidateCredentials(scope: "all" | "client" | "tokens" | "verifier" | "discovery"): Promise<void> {
		if (scope === "all") this.patch({ client: undefined, tokens: undefined, discovery: undefined, verifier: undefined });
		else if (scope === "client") this.patch({ client: undefined });
		else if (scope === "tokens") this.patch({ tokens: undefined });
		else if (scope === "discovery") this.patch({ discovery: undefined });
		this.opts.onInvalidate?.(`credentials invalidated (${scope})`);
	}
}

export interface LoginOAuthOptions extends CouncilOAuthProviderOptions {
	callbackTimeoutMs?: number;
}

/**
 * Interactive OAuth login: phase 1 auth() → REDIRECT (discovery + DCR +
 * authorization start, browser opens); phase 2 waits for the loopback code
 * then auth(code) → AUTHORIZED with tokens persisted.
 */
export async function loginOAuth(repoRoot: string, serverName: string, opts: LoginOAuthOptions = {}): Promise<string> {
	const cfg = loadMcpConfig(repoRoot).servers[serverName];
	if (!cfg) throw new Error(`Unknown MCP server "${serverName}".`);
	if (!cfg.url) throw new Error(`MCP server "${serverName}" is not a remote http server; OAuth requires "url".`);
	const listener = await startCallbackListener();
	const redirectUri = `http://127.0.0.1:${listener.port}/callback`;
	const provider = new CouncilOAuthProvider(serverName, redirectUri, opts);
	try {
		// If a persisted client was registered for a different redirect URI (e.g. an
		// earlier ephemeral loopback port), the AS would reject our fresh listener
		// URI. When there's no refresh token to short-circuit phase 1, invalidate
		// NOW so the browser opens once, with the correct URL. (A persisted client
		// whose registered list happens to cover our URI is left alone.)
		const existingClient = loadAuth().servers[serverName]?.oauth?.client as
			| { redirect_uris?: string[] }
			| undefined;
		const existingTokens = loadAuth().servers[serverName]?.oauth?.tokens as
			| { refresh_token?: string }
			| undefined;
		if (
			existingClient?.redirect_uris?.length &&
			!existingClient.redirect_uris.includes(redirectUri) &&
			!existingTokens?.refresh_token
		) {
			provider.invalidateCredentials("client");
		}
		const first = await auth(provider, { serverUrl: cfg.url });
		if (first === "AUTHORIZED") return `Already authenticated to "${serverName}".`;
		// Refresh failed (a refresh token was present but is dead): if the persisted
		// client is stale, force a fresh DCR registration and rebuild the URL.
		if (
			existingClient?.redirect_uris?.length &&
			!existingClient.redirect_uris.includes(redirectUri) &&
			existingTokens?.refresh_token
		) {
			provider.invalidateCredentials("client");
			const rebuilt = await auth(provider, { serverUrl: cfg.url });
			if (rebuilt !== "REDIRECT") throw new Error("OAuth flow did not reach REDIRECT after client re-registration.");
		}
		const code = await listener.waitForCode(opts.callbackTimeoutMs ?? 5 * 60_000);
		const second = await auth(provider, { serverUrl: cfg.url, authorizationCode: code });
		if (second !== "AUTHORIZED") throw new Error("OAuth flow did not reach AUTHORIZED state.");
		return `Authenticated to "${serverName}".`;
	} finally {
		listener.close();
	}
}

/**
 * Fixed loopback redirect URI for remote (copy-paste) login. RFC 8252 allows
 * any port on 127.0.0.1 for native clients; fixed so phase 1 and phase 2 agree
 * without persisting the URI. 8765 is unusual among common dev ports
 * (3000/5000/8000/8080/5173/4321...). The code that lands here is useless
 * without the PKCE verifier, which never leaves this machine — so even a port
 * collision on the *user's* laptop can't be turned into a token.
 */
export const REMOTE_REDIRECT_URI = "http://127.0.0.1:8765/callback";

/**
 * Heuristic: is this process likely running without a browser the user can
 * see? Strong signals — an SSH session, or Linux without DISPLAY/WAYLAND_DISPLAY
 * (headless server, container). SSH into a desktop usually carries DISPLAY via
 * X11 forwarding, so SSH_TTY alone is not conclusive; the /mcp login command
 * also accepts explicit --remote / --local overrides.
 */
export function isRemoteSession(): boolean {
	if (process.env.SSH_TTY) return true;
	if (process.platform === "linux" && !process.env.DISPLAY && !process.env.WAYLAND_DISPLAY) return true;
	return false;
}

/**
 * Parse what the user pastes back after authorizing in their own browser.
 * Accepts the full redirected URL (query or fragment code) or a bare code.
 * The redirect URI is derived from the URL's origin+path — what the browser
 * actually landed on — falling back to the fixed URI for bare codes.
 */
export function parseCallback(pasted: string): { code: string; redirectUri: string } {
	const trimmed = pasted.trim();
	try {
		const url = new URL(trimmed);
		const code =
			url.searchParams.get("code") ?? new URLSearchParams(url.hash.slice(1)).get("code");
		if (!code) throw new Error(`No "code" parameter in pasted URL.`);
		return { code, redirectUri: `${url.origin}${url.pathname}` };
	} catch (e) {
		if (e instanceof Error && e.message.includes('No "code"')) throw e;
		// Not a URL — treat the whole paste as the raw authorization code.
		return { code: trimmed, redirectUri: REMOTE_REDIRECT_URI };
	}
}

/**
 * Remote login, phase 1: discovery + DCR + PKCE, then print the authorization
 * URL instead of opening a browser or starting a loopback listener. The PKCE
 * verifier (and client/discovery state) persist via the provider; the user
 * opens the URL on any device and pastes the redirected URL back into
 * /mcp auth <server> <url> (phase 2).
 */
export async function loginRemote(repoRoot: string, serverName: string): Promise<string> {
	const cfg = loadMcpConfig(repoRoot).servers[serverName];
	if (!cfg) throw new Error(`Unknown MCP server "${serverName}".`);
	if (!cfg.url) throw new Error(`MCP server "${serverName}" is not a remote http server; OAuth requires "url".`);
	let captured = "";
	const provider = new CouncilOAuthProvider(serverName, REMOTE_REDIRECT_URI, {
		openUrl: (url) => {
			captured = url;
		},
	});
	const first = await auth(provider, { serverUrl: cfg.url });
	if (first === "AUTHORIZED") return `Already authenticated to "${serverName}".`;
	if (!captured) throw new Error("Remote login: no authorization URL was produced.");
	return [
		`Open this URL in any browser, authorize, then paste the full redirected URL back:`,
		`  ${captured}`,
		`Then run: /mcp auth ${serverName} <pasted-url>`,
	].join("\n");
}

/**
 * Remote login, phase 2: exchange the pasted redirect URL's code for tokens.
 * The provider re-loads the persisted client, discovery state, and PKCE
 * verifier from phase 1, so the exchange completes without a browser.
 */
export async function completeRemoteLogin(repoRoot: string, serverName: string, pasted: string): Promise<string> {
	const cfg = loadMcpConfig(repoRoot).servers[serverName];
	if (!cfg) throw new Error(`Unknown MCP server "${serverName}".`);
	if (!cfg.url) throw new Error(`MCP server "${serverName}" is not a remote http server; OAuth requires "url".`);
	const { code, redirectUri } = parseCallback(pasted);
	const provider = new CouncilOAuthProvider(serverName, redirectUri, { openUrl: () => {} });
	const second = await auth(provider, { serverUrl: cfg.url, authorizationCode: code });
	if (second !== "AUTHORIZED") throw new Error("OAuth flow did not reach AUTHORIZED state.");
	return `Authenticated to "${serverName}".`;
}
