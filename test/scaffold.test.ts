import { test, expect } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { scaffoldInto } from "../extensions/scaffold.ts";
import { PKG_ROOT } from "../extensions/seats.ts";

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
