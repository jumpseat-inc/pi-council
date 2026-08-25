import { test, expect, beforeEach } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import {
	loginOAuth,
	loginRemote,
	completeRemoteLogin,
	parseCallback,
	CouncilOAuthProvider,
} from "../../extensions/mcp/oauth.ts";
import { loadAuth, saveAuth } from "../../extensions/mcp/auth-store.ts";
import { saveMcpConfig, loadMcpConfig } from "../../extensions/mcp/config.ts";
import { McpManager } from "../../extensions/mcp/client.ts";
import { startOAuthFixture } from "./fixture-oauth.ts";

// Each test gets a fresh agent dir so cached OAuth discovery state from one
// fixture (with its own port) never leaks into the next — getAgentDir() reads
// the env var at call time, so per-test assignment fully isolates the auth file.
beforeEach(() => {
	process.env.PI_CODING_AGENT_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "council-oauth-home-"));
});

function tmpRepo(): string {
	return fs.mkdtempSync(path.join(os.tmpdir(), "council-oauth-repo-"));
}

test("loginOAuth: full flow against stub AS persists tokens", async () => {
	const fx = await startOAuthFixture();
	const root = tmpRepo();
	saveMcpConfig(root, { servers: { ctx: { url: fx.serverUrl, auth: "oauth" } } });
	const result = await loginOAuth(root, "ctx", {
		openUrl: (url) => {
			void fetch(url); // follow 302 → loopback callback with code=test-code
		},
		callbackTimeoutMs: 15_000,
	});
	expect(result).toContain("Authenticated");
	expect((loadAuth().servers.ctx?.oauth?.tokens as { access_token?: string })?.access_token).toBe("acc-1");
	expect((loadAuth().servers.ctx?.oauth?.client as { client_id?: string })?.client_id).toBe("test-client-id");
	await fx.close();
}, 30_000);

test("authenticated connect + call; unauthenticated reports status", async () => {
	const fx = await startOAuthFixture();
	// (a) without tokens: unauthenticated
	const rootA = tmpRepo();
	saveMcpConfig(rootA, { servers: { ctxa: { url: fx.serverUrl, auth: "oauth" } } });
	const mgrA = new McpManager({
		authProvider: (name) => new CouncilOAuthProvider(name, "http://127.0.0.1:9/callback", { openUrl: () => {} }),
	});
	const rtA = await mgrA.connect("ctxa", loadMcpConfig(rootA).servers.ctxa!);
	expect(rtA.status).toBe("unauthenticated");
	await mgrA.closeAll();

	// (b) with tokens from a login: connected, call works
	const rootB = tmpRepo();
	saveMcpConfig(rootB, { servers: { ctxb: { url: fx.serverUrl, auth: "oauth" } } });
	await loginOAuth(rootB, "ctxb", { openUrl: (url) => void fetch(url), callbackTimeoutMs: 15_000 });
	const mgrB = new McpManager({
		authProvider: (name) => new CouncilOAuthProvider(name, "http://127.0.0.1:9/callback", { openUrl: () => {} }),
	});
	const rtB = await mgrB.connect("ctxb", loadMcpConfig(rootB).servers.ctxb!);
	expect(rtB.status).toBe("connected");
	expect(await mgrB.call("ctxb", "echo", { message: "authed" })).toBe("echo: authed");
	await mgrB.closeAll();
	await fx.close();
}, 45_000);

test("expired access + corrupt refresh → non-connected status", async () => {
	const fx = await startOAuthFixture();
	const root = tmpRepo();
	saveMcpConfig(root, { servers: { ctxc: { url: fx.serverUrl, auth: "oauth" } } });
	saveAuth({
		servers: {
			ctxc: {
				oauth: {
					client: { client_id: "test-client-id" },
					tokens: { access_token: "expired", token_type: "Bearer", expires_in: 0, refresh_token: "corrupt" },
				},
			},
		},
	});
	const mgr = new McpManager({
		authProvider: (name) => new CouncilOAuthProvider(name, "http://127.0.0.1:9/callback", { openUrl: () => {} }),
	});
	const rt = await mgr.connect("ctxc", loadMcpConfig(root).servers.ctxc!);
	expect(["unauthenticated", "reauth-required", "error"]).toContain(rt.status);
	await mgr.closeAll();
	await fx.close();
}, 30_000);

test("parseCallback: full URL → code + derived redirect URI", () => {
	const { code, redirectUri } = parseCallback("http://127.0.0.1:8765/callback?code=abc123&state=xyz");
	expect(code).toBe("abc123");
	expect(redirectUri).toBe("http://127.0.0.1:8765/callback");
});

test("parseCallback: raw code → code + default remote redirect URI", () => {
	const { code, redirectUri } = parseCallback("abc123");
	expect(code).toBe("abc123");
	expect(redirectUri).toBe("http://127.0.0.1:8765/callback");
});

test("parseCallback: URL without code throws", () => {
	expect(() => parseCallback("http://127.0.0.1:8765/callback?state=xyz")).toThrow(/code/);
});

test("remote login: reuses a persisted client's registered redirect URI, not the constant", async () => {
	// Simulate the reported bug: a client was previously registered (e.g. via an
	// earlier loopback login) with an ephemeral-port redirect URI that no longer
	// matches the remote constant. The AS rejects any redirect_uri not in that
	// registered list — so phase 1 must advertise the *registered* URI.
	const fx = await startOAuthFixture();
	const root = tmpRepo();
	saveMcpConfig(root, { servers: { ctr: { url: fx.serverUrl, auth: "oauth" } } });
	saveAuth({
		servers: {
			ctr: {
				oauth: {
					client: {
						client_id: "test-client-id",
						redirect_uris: ["http://127.0.0.1:7777/callback"],
					},
				},
			},
		},
	});

	const msg = await loginRemote(root, "ctr");
	const authorizationUrl = msg.match(/https?:\/\/\S+/)?.[0];
	expect(authorizationUrl).toBeTruthy();
	expect(authorizationUrl).toContain(`redirect_uri=${encodeURIComponent("http://127.0.0.1:7777/callback")}`);
	expect(authorizationUrl).not.toContain("8765");

	const res = await fetch(authorizationUrl!, { redirect: "manual" });
	const pasted = res.headers.get("location");
	expect(pasted).toContain("code=test-code");
	expect(await completeRemoteLogin(root, "ctr", pasted!)).toContain("Authenticated");
	await fx.close();
}, 30_000);

test("loopback re-login with a stale persisted client re-registers instead of failing", async () => {
	// Same class of bug on the loopback path: a persisted client registered for an
	// old ephemeral port. The fresh listener's URI won't match, so loginOAuth must
	// clear the stale client and DCR a new one before opening the browser.
	const fx = await startOAuthFixture();
	const root = tmpRepo();
	saveMcpConfig(root, { servers: { ctr: { url: fx.serverUrl, auth: "oauth" } } });
	saveAuth({
		servers: {
			ctr: {
				oauth: {
					client: { client_id: "test-client-id", redirect_uris: ["http://127.0.0.1:7777/callback"] },
				},
			},
		},
	});

	const result = await loginOAuth(root, "ctr", {
		openUrl: (url) => void fetch(url).catch(() => {}),
		callbackTimeoutMs: 15_000,
	});
	expect(result).toContain("Authenticated");
	expect((loadAuth().servers.ctr?.oauth?.tokens as { access_token?: string })?.access_token).toBe("acc-1");
	// The client was re-registered for the fresh listener URI, not the stale 7777 one.
	const client = loadAuth().servers.ctr?.oauth?.client as { redirect_uris?: string[] };
	expect(client.redirect_uris?.some((u) => u.startsWith("http://127.0.0.1:") && u !== "http://127.0.0.1:7777/callback")).toBe(true);
	await fx.close();
}, 30_000);

test("remote login: two-phase copy-paste flow against stub AS persists tokens", async () => {
	const fx = await startOAuthFixture();
	const root = tmpRepo();
	saveMcpConfig(root, { servers: { ctr: { url: fx.serverUrl, auth: "oauth" } } });

	// Phase 1: prints the authorization URL (no browser, no listener), persists verifier
	const msg = await loginRemote(root, "ctr");
	const urlMatch = msg.match(/https?:\/\/\S+/);
	expect(urlMatch).toBeTruthy();
	const authorizationUrl = urlMatch![0];
	expect(authorizationUrl).toContain("/authorize");
	expect(authorizationUrl).toContain("code_challenge=");
	expect(authorizationUrl).toContain(`redirect_uri=${encodeURIComponent("http://127.0.0.1:8765/callback")}`);
	expect((loadAuth().servers.ctr?.oauth as { verifier?: string }).verifier).toBeDefined();

	// User's browser: 302 → the pasted URL (what ends up in the address bar)
	const res = await fetch(authorizationUrl, { redirect: "manual" });
	const pasted = res.headers.get("location");
	expect(pasted).toContain("code=test-code");

	// Phase 2: paste it back, tokens persist, verifier consumed
	const out = await completeRemoteLogin(root, "ctr", pasted!);
	expect(out).toContain("Authenticated");
	expect((loadAuth().servers.ctr?.oauth?.tokens as { access_token?: string })?.access_token).toBe("acc-1");
	expect((loadAuth().servers.ctr?.oauth as { verifier?: string }).verifier).toBeUndefined();
	await fx.close();
}, 30_000);
