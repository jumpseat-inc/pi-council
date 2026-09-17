// FLLWUP-49 — the goal's committed witness (spec §7). Pure filesystem reads
// plus `python3 -m py_compile` spawns: no pi arm, no pty, no live run, no new
// `bun test` arm count. Asserts the amended goal's three identities — exactly
// one provider extension, one headless runner, one pty screen model — inside
// the goal's declared universe (`test/` plus a non-existent `ev43/`), that
// each of the four goal-named consumers imports the shared harness, and that
// every pty runner compiles.
//
// The witness excludes ITSELF from its own scans (its expected-value strings
// contain the path tokens it counts). Scope is `test/` only — the goal's
// universe; `smoke/search-smoke/driver.py` is the named out-of-universe
// residual (spec §2).
import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";

const REPO_ROOT = dirname(import.meta.dir); // test/ parent = repo root
const TEST_DIR = join(REPO_ROOT, "test");
const FAUX = join(TEST_DIR, "faux-provider");
const WITNESS = "test/faux-provider-shape.test.ts";

/** Recursively list every file under dir, excluding the witness itself. */
function filesUnder(dir: string): string[] {
	const out: string[] = [];
	const walk = (d: string): void => {
		for (const e of readdirSync(d)) {
			const p = join(d, e);
			if (statSync(p).isDirectory()) walk(p);
			else if (!p.endsWith(WITNESS)) out.push(p);
		}
	};
	walk(dir);
	return out;
}

function countMatches(dir: string, re: RegExp): string[] {
	return filesUnder(dir).filter((f) => re.test(readFileSync(f, "utf-8")));
}

describe("faux-provider shape (the goal's committed witness)", () => {
	test("1: ev43/ does not exist", () => {
		expect(existsSync(join(REPO_ROOT, "ev43"))).toBe(false);
	});

	test("2: exactly one provider extension under test/", () => {
		const hits = countMatches(TEST_DIR, /fauxProvider\(/);
		expect(hits.length).toBe(1);
		expect(hits[0]).toBe(join(TEST_DIR, "faux-provider", "extension.ts"));
	});

	test("3: exactly one headless runner under test/", () => {
		const hits = countMatches(TEST_DIR, /export function runHarnessArm\(/);
		expect(hits.length).toBe(1);
		expect(hits[0]).toBe(join(TEST_DIR, "faux-provider", "harness.ts"));
	});

	test("4: exactly one pty screen model under test/ (Screen + Session, same file)", () => {
		const screens = countMatches(TEST_DIR, /^class Screen/m);
		const sessions = countMatches(TEST_DIR, /^class Session/m);
		expect(screens.length).toBe(1);
		expect(sessions.length).toBe(1);
		expect(screens[0]).toBe(join(FAUX, "pty_kit.py"));
		expect(sessions[0]).toBe(join(FAUX, "pty_kit.py"));
	});

	test("5: each of the four goal-named consumers imports the shared harness", () => {
		for (const f of [
			"ev40-headless.test.ts",
			"ev40-live-gates.test.ts",
			"ev41-retry-e2e.test.ts",
			"ev43-reachability.test.ts",
		]) {
			expect(readFileSync(join(TEST_DIR, f), "utf-8")).toContain('from "./faux-provider/harness.ts"');
		}
	});

	test("6: no retired path token survives under test/", () => {
		const hits = countMatches(TEST_DIR, /ev40-harness\/|ev43\/falsifier|ev43\/ev43-falsifier/);
		expect(hits).toEqual([]);
	});

	test("7: the seat fixture did not move or multiply", () => {
		expect(readFileSync(join(TEST_DIR, "ev41-retry-e2e.test.ts"), "utf-8")).toContain("stub-child.ts");
		const entries = readdirSync(FAUX);
		expect(entries.some((e) => e.startsWith("stub"))).toBe(false);
	});

	test("8: every pty runner compiles", () => {
		for (const f of ["pty_kit.py", "tui-retry.py", "ev41-tui.py"]) {
			const res = spawnSync("python3", ["-m", "py_compile", join(FAUX, f)], { encoding: "utf-8" });
			expect(res.status).toBe(0);
		}
	});
});
