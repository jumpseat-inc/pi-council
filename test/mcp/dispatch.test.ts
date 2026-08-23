import { test, expect } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { getMcpManager } from "../../extensions/mcp/index.ts";
import { buildChildArgv, parseSeatFile } from "../../extensions/seats.ts";
import { startFixtureHttpServer } from "./fixture-http.ts";

test("dispatch path: connected granted server contributes tool names to argv", async () => {
	const fx = await startFixtureHttpServer();
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "council-mcp-dispatch-"));
	const mgr = getMcpManager(root);
	await mgr.connect("fix", { url: fx.url, auth: "none" });
	expect(mgr.listToolNames("fix").sort()).toEqual(["mcp__fix__echo"]);
	const seat = parseSeatFile(
		"---\nname: x\ndescription: d\nmodel: m\ntools: Read\nmcp: [fix]\n---\nbody",
		"x.md",
	);
	const argv = buildChildArgv(seat, "go", "/tmp/p.md", mgr.listToolNames("fix"));
	expect(argv).toContain("read,mcp__fix__echo");
	await mgr.close("fix");
	await fx.close();
});

test("dispatch path: unknown granted server yields zero names (warn path)", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "council-mcp-dispatch2-"));
	expect(getMcpManager(root).listToolNames("never-connected")).toEqual([]);
});
