import { test, expect } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { scaffoldInto } from "../extensions/scaffold.ts";
import { PKG_ROOT } from "../extensions/seats.ts";
import { loadMcpConfig } from "../extensions/mcp/config.ts";
import { COUNCIL_CONFIG_FILE, loadCouncilConfig, loadSeat } from "../extensions/seats.ts";

const SCAFFOLD = path.join(PKG_ROOT, "council", "scaffold");

test("first run creates everything, second run skips everything", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "council-init-"));
	const first = scaffoldInto(root, SCAFFOLD);
	expect(first.created).toContain("council/board.md");
	expect(first.created).toContain("council/cards/_template.md");
	expect(first.created).toContain("council/preflight.sh");
	expect(first.created).toContain("council/validate.py");
	expect(first.created).toContain("vault/CLAUDE.md");
	expect(first.created).toContain("vault/wiki/index.md");
	expect(first.created).toContain("vault/wiki/log.md");
	expect(first.created).toContain("vault/raw");
	expect(first.created).toContain("vault/wiki/sources");
	expect(first.skipped).toEqual([]);

	// user modifies a file, rerun: modification survives
	fs.appendFileSync(path.join(root, "council", "board.md"), "\n<!-- mine -->");
	const second = scaffoldInto(root, SCAFFOLD);
	const createdFiles = second.created.filter((c) => c !== "vault/raw" && c !== "vault/wiki/sources");
	expect(createdFiles).toEqual([]);
	expect(second.skipped).toContain("council/board.md");
	expect(fs.readFileSync(path.join(root, "council", "board.md"), "utf-8")).toContain("<!-- mine -->");
});

	test("scaffold seeds .council.json with agent defaults and never overwrites user edits", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "council-init-conf-"));
	const first = scaffoldInto(root, SCAFFOLD);
	expect(first.created).toContain(COUNCIL_CONFIG_FILE);
	expect(first.skipped).toEqual([]);

	// seeded values match each shipped agent's frontmatter (model + thinking split)
	const seeded = loadCouncilConfig(root);
	expect(seeded["owner"]).toEqual({ model: "openrouter/deepseek/deepseek-v4-flash-0731", thinking: "high" });
	expect(seeded["council-runner"]).toEqual({
		model: "openrouter/deepseek/deepseek-v4-flash-0731",
		thinking: "medium",
	});
	expect(seeded["designer"]).toEqual({ model: "openrouter/minimax/minimax-m3", thinking: "high" });
	expect(seeded["consolidator"]).toEqual({ model: "openrouter/z-ai/glm-5.2", thinking: "high" });

	// a seat override in the seeded file actually takes effect
	expect(loadSeat(root, "owner").model).toBe("openrouter/deepseek/deepseek-v4-flash-0731");
	expect(loadSeat(root, "owner").thinkingLevel).toBe("high");

	// rerun: user edit survives, nothing new created
	fs.writeFileSync(path.join(root, COUNCIL_CONFIG_FILE), JSON.stringify({ council: { owner: { model: "x/y" } } }));
	const second = scaffoldInto(root, SCAFFOLD);
	const createdFiles = second.created.filter((c) => c !== "vault/raw" && c !== "vault/wiki/sources");
	expect(createdFiles).toEqual([]);
	expect(second.skipped).toContain(COUNCIL_CONFIG_FILE);
	expect(loadSeat(root, "owner").model).toBe("x/y");
});

test("scaffold writes context7 + tavily mcp.json and renders @CONFIG_DIR@ in preflight", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "council-init-c7-"));
	const first = scaffoldInto(root, SCAFFOLD);
	expect(first.created).toContain(".pi/council/mcp.json");
	expect(first.skipped).toEqual([]);

	const cfg = loadMcpConfig(root);
	expect(cfg.servers["context7"]).toBeDefined();
	expect(cfg.servers["context7"]?.url).toBe("https://mcp.context7.com/mcp/oauth");
	expect(cfg.servers["context7"]?.auth).toBe("oauth");
	expect(cfg.servers["context7"]?.enabled).toBe(true);
	expect(cfg.servers["tavily"]).toBeDefined();
	expect(cfg.servers["tavily"]?.url).toBe("https://mcp.tavily.com/mcp");
	expect(cfg.servers["tavily"]?.auth).toBe("oauth");
	expect(cfg.servers["tavily"]?.enabled).toBe(true);

	const preflight = fs.readFileSync(path.join(root, "council", "preflight.sh"), "utf-8");
	expect(preflight).toContain(".pi/council/mcp.json");
	expect(preflight).not.toContain("@CONFIG_DIR@");
	expect(preflight).toContain("OPENROUTER_API_KEY");
	expect(preflight).toContain("auth.json");
	expect(preflight).toContain("/login openrouter");
	expect(preflight).toContain("superpowers");
	expect(preflight).toContain(".pi/git/github.com/obra/superpowers");
	expect(preflight).toContain("/reload");

	// rerun: user edits survive, nothing new created
	fs.appendFileSync(path.join(root, ".pi", "council", "mcp.json"), "\n");
	const second = scaffoldInto(root, SCAFFOLD);
	const createdFiles = second.created.filter((c) => c !== "vault/raw" && c !== "vault/wiki/sources");
	expect(createdFiles).toEqual([]);
	expect(second.skipped).toContain(".pi/council/mcp.json");
});
