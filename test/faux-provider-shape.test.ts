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
//
// FLLWUP-55 extends the charter to `smoke/`: smoke/search-smoke/driver.py
// consumes the shared pty kit (no private Screen/Session); test 4's `test/`
// universe is unchanged.
//
// FLLWUP-59 derives test 6's token list from git HEAD ancestry (two read-only
// `git` spawns, the same benign spawn class as test 8; enumeration is
// HEAD-ancestry only, never `--all`; shallow/truncated history loud-fails).
import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

const REPO_ROOT = dirname(import.meta.dir); // test/ parent = repo root
const TEST_DIR = join(REPO_ROOT, "test");
const FAUX = join(TEST_DIR, "faux-provider");
const WITNESS = "test/faux-provider-shape.test.ts";

/** Files whose own text necessarily carries the retired tokens as DATA — the
 * witness's own expected-value strings are the original case. test/
ev77-gate-docs.test.ts (EV-77) is the second: its wiki-citation exemption keys
 * must equal the retired tokens byte-for-byte, and each key asserts the path
 * does NOT exist (a checker key, never a live reference). Same rationale as
 * the witness's own exclusion — declared here, never scanner-evaded. */
const SCAN_EXEMPT_SUFFIXES = [WITNESS, "test/ev77-gate-docs.test.ts"];

/**
 * Recursively list every file under dir, excluding the scan-exempt files and
 * any Python bytecode. The witness polices SOURCE, not bytecode: bytecode is
 * derived, regenerable, gitignored, and re-compiled in-run by test 8 —
 * scanning it adds zero information and lets stale residue (an orphan .pyc
 * compiled from pre-move source) self-arm the witness (FLLWUP-48).
 */
function filesUnder(dir: string): string[] {
	const out: string[] = [];
	const walk = (d: string): void => {
		for (const e of readdirSync(d)) {
			const p = join(d, e);
			if (statSync(p).isDirectory()) {
				if (e !== "__pycache__") walk(p); // bytecode is derived, never source
			} else if (!SCAN_EXEMPT_SUFFIXES.some((s) => p.endsWith(s))) {
				if (/\.(pyc|pyo|pyd)$/.test(p)) continue; // bytecode, same rule
				out.push(p);
			}
		}
	};
	walk(dir);
	return out;
}

function countMatches(dir: string, re: RegExp): string[] {
	return filesUnder(dir).filter((f) => re.test(readFileSync(f, "utf-8")));
}

const SMOKE_DRIVER = join(REPO_ROOT, "smoke", "search-smoke", "driver.py");

/**
 * FLLWUP-55 ban checker: line-anchored regexes over source — comments and
 * strings do not false-positive (O11). Bans any private Screen/Session
 * definition (including subclasses) and any screen/session ingest re-entry
 * (`feed`/`_csi`/`_feed`) in the smoke driver's source.
 */
function bannedScreenSessionLines(src: string): string[] {
	const hits: string[] = [];
	const lines = src.split("\n");
	for (let i = 0; i < lines.length; i++) {
		if (/^class\s+\w*(Screen|Session)\b/.test(lines[i])) hits.push(`line ${i + 1}: ${lines[i]}`);
		if (/^\s*def (feed|_csi|_feed)\(/.test(lines[i])) hits.push(`line ${i + 1}: ${lines[i]}`);
	}
	return hits;
}

/** FLLWUP-55 charter pin: pty_kit.py stays stdlib-only. */
const KIT_STDLIB = new Set(["fcntl", "json", "os", "pty", "re", "select", "struct", "termios", "time"]);
function kitImportViolations(src: string): string[] {
	const out: string[] = [];
	for (const line of src.split("\n")) {
		const m = /^(import|from)\s+([\w.]+)/.exec(line);
		if (!m) continue;
		if (!KIT_STDLIB.has(m[2].split(".")[0])) out.push(line);
	}
	return out;
}

// ----------------------------------------------------------------------------
// FLLWUP-59 — the derived retired-path token set. Test 6's token list is no
// longer a hand-maintained regex: it is derived from git HEAD ancestry (paths
// in history, absent from the live tree, bytecode excluded — the same
// exclusion rule the scan itself applies). A future token retirement enters
// the set automatically; a stale path-shaped reference reds with the token
// and file named. See vault/wiki/retired-path-tokens.md.
// ----------------------------------------------------------------------------

const isBytecodePath = (p: string): boolean =>
	p.includes("__pycache__") || /\.(pyc|pyo|pyd)$/.test(p);

/** Segment-aligned suffix fragments: `a/b/c` → `a/b/c`, `b/c`, `c`. */
function segmentSuffixes(p: string): string[] {
	const segs = p.split("/");
	return segs.map((_, i) => segs.slice(i).join("/"));
}

/** Pure: retired paths = in history, absent from the live tree, not bytecode. */
function deriveRetiredPaths(historyPaths: string[], currentPaths: string[]): string[] {
	const live = new Set(currentPaths);
	const out: string[] = [];
	for (const p of new Set(historyPaths)) {
		if (p === "" || live.has(p) || isBytecodePath(p)) continue;
		out.push(p);
	}
	return out;
}

/**
 * Pure: emission (FLLWUP-59 spec §2, pinned). Path fragments = segment-aligned
 * suffix fragments of retired paths, each emitted iff no live tracked path
 * contains it as a substring. Dir tokens = RETIRED ancestor directories (no
 * live tracked path has them as a prefix) plus their segment-aligned suffix
 * dir fragments, each emitted iff no live tracked path has it as a prefix —
 * fragments of live ancestor dirs (`council/cards` → `cards/`) are never
 * emitted, or legitimate `council/cards/` prose reds. The collision universe
 * is live tracked PATHS (git ls-tree), never file contents.
 */
function deriveRetiredTokens(historyPaths: string[], currentPaths: string[]): { fragments: string[]; dirs: string[] } {
	const live = currentPaths;
	const retired = deriveRetiredPaths(historyPaths, currentPaths);
	const fragments: string[] = [];
	const seenFrag = new Set<string>();
	for (const p of retired) {
		for (const f of segmentSuffixes(p)) {
			if (seenFrag.has(f) || live.some((l) => l.includes(f))) continue;
			seenFrag.add(f);
			fragments.push(f);
		}
	}
	const retiredDirs = new Set<string>();
	for (const p of retired) {
		const segs = p.split("/");
		for (let i = 1; i < segs.length; i++) {
			const d = segs.slice(0, i).join("/");
			if (!live.some((l) => l.startsWith(d + "/"))) retiredDirs.add(d); // the dir itself is retired
		}
	}
	const dirs: string[] = [];
	const seenDir = new Set<string>();
	for (const d of retiredDirs) {
		for (const f of segmentSuffixes(d)) {
			if (seenDir.has(f) || live.some((l) => l.startsWith(f + "/"))) continue;
			seenDir.add(f);
			dirs.push(f + "/"); // trailing slash marks the dir token
		}
	}
	return { fragments, dirs };
}

const escapeRegExp = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Pure: matching rule (FLLWUP-59 spec §2, pinned). A path fragment violates
 * on a plain substring match. A dir token (trailing `/`) violates only when
 * followed by a path-continuation character — so retirement-documentation
 * prose ("the retired ev43/ scratch extension") stays green, and the old
 * fixture form `'ev40-harness/';` (apostrophe after the token) stays green.
 */
function retiredPathViolations(
	src: string,
	tokens: { fragments: string[]; dirs: string[] },
): Array<{ kind: "frag" | "dir"; token: string }> {
	const out: Array<{ kind: "frag" | "dir"; token: string }> = [];
	for (const frag of tokens.fragments) {
		if (src.includes(frag)) out.push({ kind: "frag", token: frag });
	}
	for (const dir of tokens.dirs) {
		if (new RegExp(escapeRegExp(dir) + "[A-Za-z0-9_./-]").test(src)) out.push({ kind: "dir", token: dir });
	}
	return out;
}

/**
 * Guard (FLLWUP-59 spec §5, composed): shallow history or a missing
 * retirement canary is a named loud FAIL — never a silent pass. The canary
 * reads the derived RETIRED-PATH set (pre-suppression), never the fragment
 * set: `test/ev41-tui.py` is collision-suppressed from fragments, so a
 * fragment-based canary would be unsatisfiable. A retired path cannot
 * un-retire — the canary is a tripwire, not an allowlist; it covers the
 * truncated histories the shallow check cannot see (windowed fetches,
 * archive exports, a future workflow edit).
 */
function assertFullRetirementHistory(retiredPaths: string[], isShallowRepository: string): void {
	if (isShallowRepository.trim() === "true") {
		throw new Error(
			"derived retired-token set: shallow history — the derived token set would be silently partial (git rev-parse --is-shallow-repository = true)",
		);
	}
	for (const target of ["test/ev41-tui.py", "test/ev40-harness/"]) {
		const present = target.endsWith("/")
			? retiredPaths.some((p) => p.startsWith(target))
			: retiredPaths.includes(target);
		if (!present) {
			throw new Error(`derived retired-token set: retirement canary absent — history truncated (missing: ${target})`);
		}
	}
}

/** Read-only git, named loud FAIL on any error — same benign spawn class as test 8's `python3 -m py_compile`. */
function gitLinesOrThrow(args: string[], why: string): string[] {
	const res = spawnSync("git", args, { encoding: "utf-8", cwd: REPO_ROOT });
	if (res.error || res.status !== 0) {
		throw new Error(
			`derived retired-token set: ${why} — git ${args.join(" ")} failed: ${res.stderr?.trim() || res.error?.message || "unknown error"}`,
		);
	}
	return res.stdout.split("\n").filter((l) => l !== "");
}

let retiredTokenCache: { fragments: string[]; dirs: string[]; retiredPaths: string[] } | undefined;
/** Impure wrapper: derive this repo's tokens from HEAD ancestry — never `--all` (a verdict that varies with the local ref set is nondeterministic). */
function retiredTokensForRepo(): { fragments: string[]; dirs: string[]; retiredPaths: string[] } {
	if (!retiredTokenCache) {
		const isShallow = gitLinesOrThrow(["rev-parse", "--is-shallow-repository"], "shallow check")[0] ?? "";
		const historyPaths = gitLinesOrThrow(["log", "--no-renames", "--pretty=format:", "--name-only", "HEAD"], "history enumeration");
		const currentPaths = gitLinesOrThrow(["ls-tree", "-r", "HEAD", "--name-only"], "live tree");
		const retiredPaths = deriveRetiredPaths(historyPaths, currentPaths);
		assertFullRetirementHistory(retiredPaths, isShallow);
		retiredTokenCache = { ...deriveRetiredTokens(historyPaths, currentPaths), retiredPaths };
	}
	return retiredTokenCache;
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

	test("6: no retired path token survives under test/ (derived set — FLLWUP-59)", () => {
		const tokens = retiredTokensForRepo();
		const violations: string[] = [];
		for (const f of filesUnder(TEST_DIR)) {
			for (const v of retiredPathViolations(readFileSync(f, "utf-8"), tokens)) {
				violations.push(`${f} (${v.kind}) ${v.token}`);
			}
		}
		expect(violations).toEqual([]);
	});

	test("7: the seat fixture did not move or multiply", () => {
		expect(readFileSync(join(TEST_DIR, "ev41-retry-e2e.test.ts"), "utf-8")).toContain("stub-child.ts");
		const entries = readdirSync(FAUX);
		expect(entries.some((e) => e.startsWith("stub"))).toBe(false);
	});

	describe("scan domain — bytecode exclusion (FLLWUP-48)", () => {
		// The witness polices SOURCE, not bytecode: Python bytecode is derived,
		// regenerable, gitignored, and re-compiled in-run by test 8 — scanning it
		// adds zero information and lets stale residue (e.g. an orphan .pyc
		// compiled from pre-move source) self-arm the witness. Two-sided: the
		// `.ts` case guards against an over-broad exclusion weakening the witness.
		// FLLWUP-59: the fixture carries a retired FULL PATH — under the derived
		// mechanism's pinned rule a bare dir token followed by an apostrophe no
		// longer reds, so the probe must use the path form the mechanism polices.
		test("drops __pycache__ bytecode but still hits source carrying the same retired token", () => {
			const scratch = mkdtempSync(join(tmpdir(), "fllwup48-scan-"));
			try {
				writeFileSync(join(scratch, "x.ts"), "const retired = 'test/ev40-harness/harness-headless.ts';\n", "utf-8");
				mkdirSync(join(scratch, "__pycache__"), { recursive: true });
				writeFileSync(join(scratch, "__pycache__", "x.pyc"), "test/ev40-harness/harness-headless.ts\0binary payload", "utf-8");
				const hits = countMatches(scratch, /test\/ev40-harness\/harness-headless\.ts/);
				expect(hits).toEqual([join(scratch, "x.ts")]);
			} finally {
				rmSync(scratch, { recursive: true, force: true });
			}
		});
	});

	describe("derived retired-path token set (FLLWUP-59)", () => {
		// Pure probes use synthetic lists/strings: the witness's own prose and
		// fixtures carry retired tokens, so it excludes itself from its own scan
		// and real-source scratch probes stay in mkdtemp land.

		test("derivation: retired = history minus live, bytecode excluded (pure)", () => {
			const history = ["test/a.ts", "test/old/x.py", "council/__pycache__/old.cpython-314.pyc", "test/live.ts"];
			const live = ["test/live.ts", "test/old/x.py"];
			expect(deriveRetiredPaths(history, live)).toEqual(["test/a.ts"]);
		});

		test("emission: segment-aligned fragments, suppressed on live-path collision (pure)", () => {
			const history = ["test/ev40-harness/harness-headless.ts", "test/ev41-tui.py"];
			const live = ["test/faux-provider/ev41-tui.py"];
			const tokens = deriveRetiredTokens(history, live);
			// `ev41-tui.py` collides with the live relocated file — suppressed;
			// the full retired path is emitted (the historical miss reds).
			expect(tokens.fragments).toContain("test/ev41-tui.py");
			expect(tokens.fragments).not.toContain("ev41-tui.py");
			expect(tokens.fragments).toContain("harness-headless.ts");
			expect(tokens.dirs).toContain("test/ev40-harness/");
			expect(tokens.dirs).toContain("ev40-harness/");
		});

		test("dir tokens come from retired ancestor dirs, never live ones (pure)", () => {
			// `council/cards/` is live: a retired `council/cards/EV-9.md` must not
			// emit `cards/`, which would red legitimate `council/cards/` prose.
			const tokens = deriveRetiredTokens(["council/cards/EV-9.md"], ["council/cards/FLLWUP-59.md"]);
			// fragments are emitted (no live path collides) — but no dir token:
			expect(tokens.fragments).toContain("council/cards/EV-9.md");
			expect(tokens.dirs).toEqual([]);
		});

		test("matching: dir token needs a continuation char; path fragment is a plain substring (pure)", () => {
			const tokens = {
				fragments: ["test/ev41-tui.py", "ev43/falsifier-headless.ts", "test/ev40-harness/harness-headless.ts"],
				dirs: ["ev43/", "ev40-harness/"],
			};
			const red = (src: string) => retiredPathViolations(src, tokens);
			// positive tripwires (spec §4 — all red)
			expect(red("see ev43/falsifier-headless.ts").map((v) => v.token)).toContain("ev43/falsifier-headless.ts");
			expect(red("via test/ev41-tui.py").map((v) => v.token)).toContain("test/ev41-tui.py");
			expect(red("const retired = 'test/ev40-harness/harness-headless.ts';").length).toBeGreaterThan(0);
			// owned narrowings (spec §4 — green)
			expect(red("the retired ev43/ scratch extension")).toEqual([]);
			expect(red("the retired ev40-harness/ family")).toEqual([]);
			expect(red("mentions test/faux-provider/ev41-tui.py live")).toEqual([]);
			// the pre-FLLWUP-59 fixture form is green under the pinned rule (why §3 re-fixtures it)
			expect(red("const retired = 'ev40-harness/';")).toEqual([]);
		});

		test("guard: shallow history reds with a named error (pure)", () => {
			expect(() => assertFullRetirementHistory(["test/ev41-tui.py", "test/ev40-harness/x.ts"], "true\n")).toThrow(/shallow history/);
			expect(() => assertFullRetirementHistory(["test/ev41-tui.py", "test/ev40-harness/x.ts"], "false\n")).not.toThrow();
		});

		test("guard: a truncated history reds the retirement canary with a named error (pure)", () => {
			expect(() => assertFullRetirementHistory([], "false")).toThrow(/retirement canary absent/);
			expect(() => assertFullRetirementHistory(["test/ev41-tui.py"], "false")).toThrow(/retirement canary absent/);
			expect(() => assertFullRetirementHistory(["test/ev40-harness/x.ts"], "false")).toThrow(/retirement canary absent/);
		});

		test("guard: the real repository passes the composed guard and carries both canary targets", () => {
			const derived = retiredTokensForRepo();
			expect(derived.retiredPaths).toContain("test/ev41-tui.py");
			expect(derived.retiredPaths.some((p) => p.startsWith("test/ev40-harness/"))).toBe(true);
			expect(derived.fragments.length).toBeGreaterThan(0);
		});
	});

	describe("smoke/ charter extension (FLLWUP-55)", () => {
		test("9: the search-smoke driver consumes the shared kit — no private Screen/Session", () => {
			const src = readFileSync(SMOKE_DRIVER, "utf-8");
			expect(bannedScreenSessionLines(src)).toEqual([]);
			expect(src).toContain("from pty_kit import");
		});

		test("10: ban checker is two-sided — a private session subclass reds it", () => {
			const synthetic = "class SmokeSession(Session):\n    def _csi(self, a, f):\n        pass\n";
			const hits = bannedScreenSessionLines(synthetic);
			expect(hits.length).toBe(2); // the class line + the _csi line
			expect(hits[0]).toContain("class SmokeSession(Session):");
			expect(hits[1]).toContain("def _csi(");
		});

		test("11: kit stdlib-only guard (charter pin, green at base and head — never a red-base falsifier)", () => {
			const kit = readFileSync(join(FAUX, "pty_kit.py"), "utf-8");
			expect(kitImportViolations(kit)).toEqual([]);
			// two-sided: the checker reds on a non-stdlib import
			const scratch = mkdtempSync(join(tmpdir(), "fllwup55-stdlib-"));
			try {
				writeFileSync(join(scratch, "x.py"), "import requests\n", "utf-8");
				expect(kitImportViolations(readFileSync(join(scratch, "x.py"), "utf-8"))).toEqual(["import requests"]);
			} finally {
				rmSync(scratch, { recursive: true, force: true });
			}
		});
	});

	test("8: every pty runner compiles", () => {
		for (const f of ["pty_kit.py", "tui-retry.py", "ev41-tui.py"]) {
			const res = spawnSync("python3", ["-m", "py_compile", join(FAUX, f)], { encoding: "utf-8" });
			expect(res.status).toBe(0);
		}
	});
});
