import { test, expect, beforeAll } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { loginOAuth, CouncilOAuthProvider } from "../../extensions/mcp/oauth.ts";
import { loadAuth, saveAuth } from "../../extensions/mcp/auth-store.ts";
import { saveMcpConfig, loadMcpConfig } from "../../extensions/mcp/config.ts";
import { McpManager } from "../../extensions/mcp/client.ts";
import { startOAuthFixture } from "./fixture-oauth.ts";

beforeAll(() => {
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
