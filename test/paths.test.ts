import { test, expect } from "bun:test";
import * as path from "node:path";
import { CONFIG_DIR_NAME } from "@earendil-works/pi-coding-agent";
import { pidFilePath } from "../extensions/hub-tools.ts";
import { proceduresDir, PKG_ROOT } from "../extensions/seats.ts";

test("pidFilePath lives under $CONFIG_DIR_NAME/council", () => {
	expect(pidFilePath("/repo")).toBe(path.join("/repo", CONFIG_DIR_NAME, "council", ".pids.json"));
});

test("proceduresDir falls back to packaged default", () => {
	expect(proceduresDir("/nonexistent-repo-root-xyz")).toBe(path.join(PKG_ROOT, "council", "procedures"));
});
