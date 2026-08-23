import { test, expect } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { loadMcpConfig, validateEntry, resolveHeaders } from "../../extensions/mcp/config.ts";

function tmpRepo(): string {
	return fs.mkdtempSync(path.join(os.tmpdir(), "council-mcp-cfg-"));
}

test("missing mcp.json yields empty config", () => {
	expect(loadMcpConfig(tmpRepo())).toEqual({ servers: {} });
});

test("loads a valid config", () => {
	const root = tmpRepo();
	fs.mkdirSync(path.join(root, ".pi", "council"), { recursive: true });
	fs.writeFileSync(
		path.join(root, ".pi", "council", "mcp.json"),
		JSON.stringify({
			servers: {
				ctx: { url: "https://mcp.example.com/mcp", auth: "oauth" },
				local: { command: "npx", args: ["-y", "srv"], auth: "none", enabled: false },
			},
		}),
	);
	const cfg = loadMcpConfig(root);
	expect(Object.keys(cfg.servers).sort()).toEqual(["ctx", "local"]);
	expect(validateEntry("ctx", cfg.servers.ctx!)).toEqual([]);
	expect(validateEntry("local", cfg.servers.local!)).toEqual([]);
});

test("malformed json throws with path", () => {
	const root = tmpRepo();
	fs.mkdirSync(path.join(root, ".pi", "council"), { recursive: true });
	fs.writeFileSync(path.join(root, ".pi", "council", "mcp.json"), "{ not json");
	expect(() => loadMcpConfig(root)).toThrow(/mcp\.json/);
});

test("validateEntry: transport and auth rules", () => {
	const errs = (cfg: Record<string, unknown>) => validateEntry("x", cfg as never);
	expect(errs({ auth: "none" }).length).toBeGreaterThan(0); // no url or command
	expect(errs({ url: "https://a", command: "npx", auth: "none" }).length).toBeGreaterThan(0); // both
	expect(errs({ url: "https://a", auth: "nope" }).length).toBeGreaterThan(0); // bad auth mode
	expect(errs({ command: "npx", auth: "oauth" }).length).toBeGreaterThan(0); // oauth needs url
	expect(errs({ command: "npx", auth: "header" }).length).toBeGreaterThan(0); // header needs url
	expect(errs({ command: "npx", auth: "none" })).toEqual([]);
	expect(errs({ url: "https://a", auth: "header" })).toEqual([]);
});

test("resolveHeaders: env substitution, stored fallback, drop unresolved", () => {
	process.env.TEST_MCP_KEY = "from-env";
	const out = resolveHeaders(
		{ headers: { Authorization: "Bearer $TEST_MCP_KEY", "X-Fixed": "fixed" } } as never,
		{ Authorization: "Bearer stored" },
	);
	expect(out.Authorization).toBe("Bearer from-env");
	expect(out["X-Fixed"]).toBe("fixed");
	delete process.env.TEST_MCP_KEY;
	expect(resolveHeaders({ headers: { Authorization: "Bearer $NOPE_VAR" } } as never, {}).Authorization).toBeUndefined();
	// stored-only headers (entered via /mcp login) are carried through
	expect(resolveHeaders({ headers: {} } as never, { Authorization: "Bearer stored-only" })).toEqual({
		Authorization: "Bearer stored-only",
	});
});
