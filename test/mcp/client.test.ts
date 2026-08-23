import { test, expect, afterAll } from "bun:test";
import * as path from "node:path";
import { McpManager } from "../../extensions/mcp/client.ts";
import { startFixtureHttpServer } from "./fixture-http.ts";

const STUB = path.join(import.meta.dir, "fixture-stdio-server.ts");
const cleanups: Array<() => Promise<void>> = [];
afterAll(async () => {
	for (const c of cleanups) await c();
});

test("stdio: connect, list tools, call, close", async () => {
	const mgr = new McpManager();
	const rt = await mgr.connect("fix", { command: "bun", args: ["run", STUB], auth: "none" });
	expect(rt.status).toBe("connected");
	expect(rt.tools.map((t) => t.name).sort()).toEqual(["add", "echo"]);
	expect(mgr.listToolNames("fix").sort()).toEqual(["mcp__fix__add", "mcp__fix__echo"]);
	expect(await mgr.call("fix", "echo", { message: "hi" })).toBe("echo: hi");
	expect(await mgr.call("fix", "add", { a: 2, b: 3 })).toBe("5");
	await mgr.close("fix");
});

test("http: connect and call without auth", async () => {
	const fx = await startFixtureHttpServer();
	cleanups.push(fx.close);
	const mgr = new McpManager();
	const rt = await mgr.connect("web", { url: fx.url, auth: "none" });
	expect(rt.status).toBe("connected");
	expect(await mgr.call("web", "echo", { message: "hello" })).toBe("echo: hello");
	await mgr.closeAll();
});

test("http header auth: env-resolved header authenticates", async () => {
	const fx = await startFixtureHttpServer("sekret");
	cleanups.push(fx.close);
	process.env.FIX_MCP_KEY = "sekret";
	const mgr = new McpManager();
	const rt = await mgr.connect("web2", {
		url: fx.url,
		auth: "header",
		headers: { "X-Fix-Key": "$FIX_MCP_KEY" },
	});
	expect(rt.status).toBe("connected");
	expect(await mgr.call("web2", "echo", { message: "authed" })).toBe("echo: authed");
	delete process.env.FIX_MCP_KEY;
	await mgr.closeAll();
});

test("http header auth: wrong key reports error status", async () => {
	const fx = await startFixtureHttpServer("sekret");
	cleanups.push(fx.close);
	const mgr = new McpManager();
	const rt = await mgr.connect("web3", {
		url: fx.url,
		auth: "header",
		headers: { "X-Fix-Key": "wrong" },
	});
	expect(rt.status).toBe("error");
	expect(rt.error).toBeTruthy();
});

test("statuses reports runtime state and tool counts", async () => {
	const mgr = new McpManager();
	await mgr.connect("s1", { command: "bun", args: ["run", STUB], auth: "none" });
	const st = mgr.statuses();
	expect(st.s1?.status).toBe("connected");
	expect(st.s1?.toolCount).toBe(2);
	await mgr.closeAll();
});
