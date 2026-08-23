import { test, expect } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { loadAuth, saveAuth, clearServerSecrets } from "../../extensions/mcp/auth-store.ts";

function tmpFile(): string {
	return path.join(fs.mkdtempSync(path.join(os.tmpdir(), "council-mcp-auth-")), "mcp-auth.json");
}

test("missing file yields empty store", () => {
	expect(loadAuth(tmpFile())).toEqual({ servers: {} });
});

test("malformed file yields empty store, not a crash", () => {
	const f = tmpFile();
	fs.writeFileSync(f, "{ nope");
	expect(loadAuth(f)).toEqual({ servers: {} });
});

test("round-trip with 0600 mode", () => {
	const f = tmpFile();
	saveAuth({ servers: { ctx: { headers: { Authorization: "Bearer s3cret" } } } }, f);
	const mode = fs.statSync(f).mode & 0o777;
	expect(mode).toBe(0o600);
	const loaded = loadAuth(f);
	expect(loaded.servers.ctx?.headers?.Authorization).toBe("Bearer s3cret");
});

test("clearServerSecrets removes only the named entry", () => {
	const f = tmpFile();
	saveAuth({ servers: { a: { headers: { X: "1" } }, b: { headers: { Y: "2" } } } }, f);
	expect(clearServerSecrets("a", f)).toBe(true);
	expect(clearServerSecrets("a", f)).toBe(false);
	expect(loadAuth(f)).toEqual({ servers: { b: { headers: { Y: "2" } } } });
});
