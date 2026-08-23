import { test, expect } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { loadModelFloors } from "../extensions/index.ts";

test("packaged floors cover exactly deepseek-v4-pro-0813 at 131072", () => {
	const floors = loadModelFloors("/nonexistent-repo-root-xyz");
	expect(Object.keys(floors)).toEqual(["deepseek/deepseek-v4-pro-0813"]);
	expect(floors["deepseek/deepseek-v4-pro-0813"]).toBe(131072);
});

test("repo-local override merges over packaged floors", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "council-floors-"));
	fs.mkdirSync(path.join(root, ".pi", "council"), { recursive: true });
	fs.writeFileSync(
		path.join(root, ".pi", "council", "model-floors.json"),
		JSON.stringify({ "deepseek/deepseek-v4-pro-0813": 65536 }),
	);
	const floors = loadModelFloors(root);
	expect(floors["deepseek/deepseek-v4-pro-0813"]).toBe(65536); // overridden value wins
	expect(Object.keys(floors)).toEqual(["deepseek/deepseek-v4-pro-0813"]);
});
