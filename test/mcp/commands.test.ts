import { test, expect, beforeAll } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { runMcpSubcommand, connectParentServers, getMcpManager } from "../../extensions/mcp/index.ts";
import { loadMcpConfig, saveMcpConfig } from "../../extensions/mcp/config.ts";
import { loadAuth } from "../../extensions/mcp/auth-store.ts";
import { startFixtureHttpServer } from "./fixture-http.ts";
import { startOAuthFixture } from "./fixture-oauth.ts";

beforeAll(() => {
	process.env.PI_CODING_AGENT_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "council-mcp-cmds-"));
});

function tmpRepo(): string {
	return fs.mkdtempSync(path.join(os.tmpdir(), "council-mcp-cmds-repo-"));
}

test("add validates, writes config, rejects duplicates", async () => {
	const root = tmpRepo();
	const out = await runMcpSubcommand(root, "add", ["srv", "https://x.example/mcp", "oauth"], {} as never);
	expect(out).toContain("Registered");
	expect(loadMcpConfig(root).servers.srv?.auth).toBe("oauth");
	expect(await runMcpSubcommand(root, "add", ["srv", "https://y"], {} as never)).toContain("already exists");
});

test("add stdio via -- separator", async () => {
	const root = tmpRepo();
	const out = await runMcpSubcommand(root, "add", ["local", "--", "npx", "-y", "some-server"], {} as never);
	expect(out).toContain("Registered");
	const entry = loadMcpConfig(root).servers.local!;
	expect(entry.command).toBe("npx");
	expect(entry.args).toEqual(["-y", "some-server"]);
	expect(entry.auth).toBe("none");
});

test("add rejects entries that fail validation", async () => {
	const root = tmpRepo();
	const out = await runMcpSubcommand(root, "add", ["bad", "--"], {} as never);
	expect(out).not.toContain("Registered");
	expect(loadMcpConfig(root).servers.bad).toBeUndefined();
});

test("remove deletes the registration", async () => {
	const root = tmpRepo();
	await runMcpSubcommand(root, "add", ["gone", "https://x", "none"], {} as never);
	expect(loadMcpConfig(root).servers.gone).toBeDefined();
	expect(await runMcpSubcommand(root, "remove", ["gone"], {} as never)).toContain("Removed");
	expect(loadMcpConfig(root).servers.gone).toBeUndefined();
});

test("list reports servers; unknown subcommand prints usage", async () => {
	const root = tmpRepo();
	saveMcpConfig(root, { servers: { a: { url: "https://x", auth: "none" } } });
	const out = await runMcpSubcommand(root, "list", [], {} as never);
	expect(out).toContain("a");
	expect(out).toContain("http");
	const usage = await runMcpSubcommand(root, "bogus", [], {} as never);
	expect(usage).toContain("Usage:");
});

test("connectParentServers registers tools and notes failures", async () => {
	const fx = await startFixtureHttpServer();
	const root = tmpRepo();
	saveMcpConfig(root, {
		servers: {
			good: { url: fx.url, auth: "none" },
			dead: { url: "http://127.0.0.1:1/mcp", auth: "none" },
		},
	});
	const registered: string[] = [];
	const pi = { registerTool: (t: { name: string }) => registered.push(t.name) } as never;
	const notes = await connectParentServers(pi, root);
	expect(registered).toContain("mcp__good__echo");
	expect(notes.join("\n")).toContain("dead");
	await getMcpManager(root).closeAll();
	await fx.close();
});

test("login --remote prints URL; auth completes the copy-paste flow", async () => {
	const fx = await startOAuthFixture();
	const root = tmpRepo();
	saveMcpConfig(root, { servers: { ctr: { url: fx.serverUrl, auth: "oauth" } } });

	const out1 = await runMcpSubcommand(root, "login", ["ctr", "--remote"], {} as never);
	expect(out1).toContain("Open this URL");
	const urlMatch = out1.match(/https?:\/\/\S+/);
	expect(urlMatch).toBeTruthy();

	const res = await fetch(urlMatch![0], { redirect: "manual" });
	const pasted = res.headers.get("location")!;
	expect(pasted).toContain("code=test-code");

	const out2 = await runMcpSubcommand(root, "auth", ["ctr", pasted], {} as never);
	expect(out2).toContain("Authenticated");
	await fx.close();
}, 30_000);

test("logout clears stored secrets", async () => {
	const root = tmpRepo();
	saveMcpConfig(root, { servers: { sec: { url: "https://x", auth: "header" } } });
	const authFile = path.join(process.env.PI_CODING_AGENT_DIR!, "council", "mcp-auth.json");
	fs.mkdirSync(path.dirname(authFile), { recursive: true });
	fs.writeFileSync(authFile, JSON.stringify({ servers: { sec: { headers: { Authorization: "Bearer x" } } } }));
	expect(await runMcpSubcommand(root, "logout", ["sec"], {} as never)).toContain("cleared");
	expect(loadAuth(authFile).servers.sec).toBeUndefined();
});
