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
	private verifier = "";
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
		this.patch({ tokens });
	}

	async redirectToAuthorization(authorizationUrl: URL): Promise<void> {
		this.open(authorizationUrl.toString());
	}

	async saveCodeVerifier(verifier: string): Promise<void> {
		this.verifier = verifier;
	}

	async codeVerifier(): Promise<string> {
		return this.verifier;
	}

	async saveDiscoveryState(state: OAuthDiscoveryState): Promise<void> {
		this.patch({ discovery: state });
	}

	async discoveryState(): Promise<OAuthDiscoveryState | undefined> {
		return this.entry().discovery as OAuthDiscoveryState | undefined;
	}

	async invalidateCredentials(scope: "all" | "client" | "tokens" | "verifier" | "discovery"): Promise<void> {
		if (scope === "all") this.patch({ client: undefined, tokens: undefined, discovery: undefined });
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
		const first = await auth(provider, { serverUrl: cfg.url });
		if (first === "AUTHORIZED") return `Already authenticated to "${serverName}".`;
		const code = await listener.waitForCode(opts.callbackTimeoutMs ?? 5 * 60_000);
		const second = await auth(provider, { serverUrl: cfg.url, authorizationCode: code });
		if (second !== "AUTHORIZED") throw new Error("OAuth flow did not reach AUTHORIZED state.");
		return `Authenticated to "${serverName}".`;
	} finally {
		listener.close();
	}
}
