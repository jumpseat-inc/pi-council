import { describe, expect, test } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { createHash } from "node:crypto";
import {
	clearSeatOverride,
	writeGateMode,
	writeSeatOverride,
} from "../extensions/council-config-writer.ts";
import { GATE_MODES, loadGateConfig } from "../extensions/gate.ts";
import { runGateCommand } from "../extensions/council-gate-cmd.ts";
import { COUNCIL_CONFIG_FILE } from "../extensions/seats.ts";

/** sha256 hex digest — the byte-identity probe for preserved regions. */
function sha256(s: string): string {
	return createHash("sha256").update(s).digest("hex");
}

/** Fresh temp repo; `files` keys are relative paths from the repo root. */
function makeRepo(files: Record<string, string> = {}): string {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ev74-gate-"));
	for (const [name, content] of Object.entries(files)) {
		const p = path.join(dir, name);
		fs.mkdirSync(path.dirname(p), { recursive: true });
		fs.writeFileSync(p, content);
	}
	return dir;
}

function cfgPath(repo: string): string {
	return path.join(repo, COUNCIL_CONFIG_FILE);
}

function cfg(repo: string): string {
	return fs.readFileSync(cfgPath(repo), "utf-8");
}

/** Emitter sink that records every line (and lets tests assert single-line). */
function makeEmitter(): { lines: string[]; emit: (line: string) => void } {
	const lines: string[] = [];
	return { lines, emit: (line: string) => lines.push(line) };
}

/** Offset ONE PAST the value's closing brace, matching the `{` opened at `from`.
 *  Valid for the controlled fixtures below: no braces inside their strings. */
function objectEnd(text: string, from: number): number {
	let depth = 0;
	for (let i = from; i < text.length; i++) {
		if (text[i] === "{") depth++;
		else if (text[i] === "}") {
			depth--;
			if (depth === 0) return i + 1;
		}
	}
	return text.length;
}

const T = "\t";

/** Tab-indented gate-less fixture: council + theme + an injected unknown
 *  top-level key, scaffold order. */
const TAB_FIXTURE =
	`{\n` +
	`${T}"council": {\n` +
	`${T}${T}"owner": {\n` +
	`${T}${T}${T}"model": "openrouter/deepseek/deepseek-v4-flash-0731",\n` +
	`${T}${T}${T}"thinking": "high"\n` +
	`${T}${T}},\n` +
	`${T}${T}"judge": {\n` +
	`${T}${T}${T}"model": "openrouter/qwen/qwen3.6-35b-a3b",\n` +
	`${T}${T}${T}"thinking": "medium"\n` +
	`${T}${T}}\n` +
	`${T}},\n` +
	`${T}"theme": {\n` +
	`${T}${T}"enabled": true,\n` +
	`${T}${T}"variant": "auto"\n` +
	`${T}},\n` +
	`${T}"unknownTopLevel": { "kept": true }\n` +
	`}`;

// ---- literals (spec §3) — byte-exact, binding ----

const SUCCESS = (m: string) => `council-gate: gate mode is now ${m} in .council.json — applies to dispatches after this echo.`;
const REDUNDANT = (m: string) => `council-gate: gate mode is already ${m} in .council.json — no change.`;
const STATUS = (m: string) => `[council-gate] gate mode is ${m}.`;
const USAGE_ERROR = (arg: string) =>
	`[council-gate] error: unknown mode "${arg}" — usage: /council-gate [off|advisory|active]`;

// =====================================================================
// Writer: writeGateMode (spec §5 items 1–9)
// =====================================================================

describe("writeGateMode — greenfield (item 1)", () => {
	test("absent file + off ⇒ {ok:true, unchanged:true}, file still absent", () => {
		const repo = makeRepo();
		const res = writeGateMode({ repoRoot: repo, mode: "off" });
		expect(res).toEqual({ ok: true, unchanged: true });
		expect(fs.existsSync(cfgPath(repo))).toBe(false);
	});

	test("absent file + advisory/active ⇒ created with only the gate section, loads via loadGateConfig", () => {
		for (const mode of ["advisory", "active"] as const) {
			const repo = makeRepo();
			const res = writeGateMode({ repoRoot: repo, mode });
			expect(res).toEqual({ ok: true });
			const text = cfg(repo);
			expect(text).toBe(`{\n  "gate": {\n    "mode": "${mode}"\n  }\n}\n`);
			expect(loadGateConfig(repo).mode).toBe(mode);
		}
	});
});

describe("writeGateMode — byte preservation (items 2–4)", () => {
	test("gate-less file insert: outside-span regions sha256-identical, trailing byte-identical", () => {
		const repo = makeRepo({ [COUNCIL_CONFIG_FILE]: TAB_FIXTURE });
		const before = cfg(repo);
		// Region spans in the ORIGINAL text.
		const councilStart = before.indexOf('"council"');
		const councilBlock = before.slice(councilStart, objectEnd(before, before.indexOf("{", councilStart)));
		const themeStart = before.indexOf('"theme"');
		const themeBlock = before.slice(themeStart, objectEnd(before, before.indexOf("{", themeStart)));
		const unknownStart = before.indexOf('"unknownTopLevel"');
		const unknownBlock = before.slice(unknownStart, objectEnd(before, before.indexOf("{", unknownStart)));

		const res = writeGateMode({ repoRoot: repo, mode: "advisory" });
		expect(res).toEqual({ ok: true });
		const after = cfg(repo);

		const aCouncilStart = after.indexOf('"council"');
		expect(after.slice(aCouncilStart, objectEnd(after, after.indexOf("{", aCouncilStart)))).toBe(councilBlock);
		const aThemeStart = after.indexOf('"theme"');
		expect(after.slice(aThemeStart, objectEnd(after, after.indexOf("{", aThemeStart)))).toBe(themeBlock);
		const aUnknownStart = after.indexOf('"unknownTopLevel"');
		expect(after.slice(aUnknownStart, objectEnd(after, after.indexOf("{", aUnknownStart)))).toBe(unknownBlock);
		// Insertion landed after the last root member's value: everything up to
		// the root's closing `\n}` is an exact prefix, and the root close survives
		// as the tail — only the `gate` member was spliced in between.
		expect(after.startsWith(before.slice(0, before.length - 2))).toBe(true);
		expect(after.endsWith(before.slice(-2))).toBe(true);
		expect(loadGateConfig(repo).mode).toBe("advisory");
	});

	test("gate present without mode (`gate: {}`): member inserted, rest byte-identical", () => {
		const fixture =
			`{\n${T}"council": {},\n${T}"gate": {},\n${T}"theme": {\n${T}${T}"enabled": true\n${T}}\n}`;
		const repo = makeRepo({ [COUNCIL_CONFIG_FILE]: fixture });
		const res = writeGateMode({ repoRoot: repo, mode: "active" });
		expect(res).toEqual({ ok: true });
		const after = cfg(repo);
		expect(after).toBe(
			`{\n${T}"council": {},\n${T}"gate": {\n${T}${T}"mode": "active"\n${T}},\n${T}"theme": {\n${T}${T}"enabled": true\n${T}}\n}`,
		);
		expect(loadGateConfig(repo).mode).toBe("active");
	});

	test("gate.mode present: LAST span replaced on the O2 duplicate-key fixture", () => {
		const repo = makeRepo({ [COUNCIL_CONFIG_FILE]: `{"gate":{"mode":"active","mode":"off"}}` });
		const res = writeGateMode({ repoRoot: repo, mode: "advisory" });
		expect(res).toEqual({ ok: true });
		const after = cfg(repo);
		expect(after).toBe(`{"gate":{"mode":"active","mode":"advisory"}}`);
		expect(loadGateConfig(repo).mode).toBe("advisory"); // JSON.parse last-wins
	});
});

describe("writeGateMode — redundant set (item 5)", () => {
	test("same mode: {ok:true, unchanged:true}, bytes AND mtime unchanged", () => {
		const repo = makeRepo({ [COUNCIL_CONFIG_FILE]: TAB_FIXTURE + "\n" });
		writeGateMode({ repoRoot: repo, mode: "advisory" });
		const before = cfg(repo);
		const beforeStat = fs.statSync(cfgPath(repo));
		const res = writeGateMode({ repoRoot: repo, mode: "advisory" });
		expect(res).toEqual({ ok: true, unchanged: true });
		expect(cfg(repo)).toBe(before);
		expect(fs.statSync(cfgPath(repo)).mtimeMs).toBe(beforeStat.mtimeMs);
	});

	test("gate-less file + off: redundant no-op never materializes a gate section", () => {
		const repo = makeRepo({ [COUNCIL_CONFIG_FILE]: TAB_FIXTURE + "\n" });
		const before = cfg(repo);
		const beforeStat = fs.statSync(cfgPath(repo));
		const res = writeGateMode({ repoRoot: repo, mode: "off" });
		expect(res).toEqual({ ok: true, unchanged: true });
		expect(cfg(repo)).toBe(before);
		expect(fs.statSync(cfgPath(repo)).mtimeMs).toBe(beforeStat.mtimeMs);
		expect(loadGateConfig(repo).mode).toBe("off");
	});
});

describe("writeGateMode — refusals before any splice (item 6)", () => {
	const cases: Array<[string, string]> = [
		["malformed JSON", `{ "council": `],
		["non-object root (array)", `["nope"]`],
		["non-object root (string)", `"nope"`],
		["non-object root (null)", `null`],
		["non-object gate", `{ "gate": 5 }`],
		["invalid resolved mode", `{ "gate": { "mode": "bogus" } }`],
		["unknown gate key", `{ "gate": { "other": true } }`],
	];
	for (const [name, fixture] of cases) {
		test(`${name} ⇒ {ok:false, error}, file untouched`, () => {
			const repo = makeRepo({ [COUNCIL_CONFIG_FILE]: fixture });
			const before = cfg(repo);
			const res = writeGateMode({ repoRoot: repo, mode: "active" });
			expect(res.ok).toBe(false);
			expect((res as { ok: false; error: string }).error.length).toBeGreaterThan(0);
			expect(cfg(repo)).toBe(before);
		});
	}

	test("invalid mode ARGUMENT ⇒ {ok:false, error} before any I/O", () => {
		const repo = makeRepo();
		// Cast: exercising the runtime guard that mirrors the loader grammar.
		const res = writeGateMode({ repoRoot: repo, mode: "turbo" as never });
		expect(res.ok).toBe(false);
		expect(fs.existsSync(cfgPath(repo))).toBe(false);
	});
});

describe("writeGateMode — atomicity mechanics (item 7)", () => {
	test("permission bits preserved; no .tmp-* leftover", () => {
		const repo = makeRepo({ [COUNCIL_CONFIG_FILE]: `{\n  "gate": {\n    "mode": "off"\n  }\n}` });
		fs.chmodSync(cfgPath(repo), 0o600);
		const res = writeGateMode({ repoRoot: repo, mode: "active" });
		expect(res).toEqual({ ok: true });
		expect(fs.statSync(cfgPath(repo)).mode & 0o777).toBe(0o600);
		const leftovers = fs.readdirSync(repo).filter((f) => f.includes(".tmp-"));
		expect(leftovers).toEqual([]);
		expect(loadGateConfig(repo).mode).toBe("active");
	});
});

describe("export-surface + vocabulary guards (items 8–9)", () => {
	test("O1: runtime export surface grows by exactly writeGateMode", async () => {
		const mod = await import("../extensions/council-config-writer.ts");
		expect(Object.keys(mod).sort()).toEqual(
			["clearSeatOverride", "writeGateMode", "writeSeatOverride"].sort(),
		);
		// And the pre-existing names still behave (unchanged exports).
		expect(typeof mod.writeSeatOverride).toBe("function");
		expect(typeof mod.clearSeatOverride).toBe("function");
	});

	test("single-source vocabulary: writer source has no mode-value string literals", () => {
		const src = fs.readFileSync(
			path.join(import.meta.dir, "..", "extensions", "council-config-writer.ts"),
			"utf-8",
		);
		expect(src).not.toMatch(/advisory|active/);
	});
});

// =====================================================================
// Command: runGateCommand / registration (spec §5 items 10–18)
// =====================================================================

describe("runGateCommand — status (item 10)", () => {
	test("no-arg on a gate-less fixture prints the status line and writes nothing", () => {
		const repo = makeRepo({ [COUNCIL_CONFIG_FILE]: TAB_FIXTURE + "\n" });
		const before = cfg(repo);
		const { lines, emit } = makeEmitter();
		runGateCommand("", repo, emit);
		expect(lines).toEqual([STATUS("off")]);
		expect(cfg(repo)).toBe(before);
	});

	test("no-arg with an absent file: status off, file still absent", () => {
		const repo = makeRepo();
		const { lines, emit } = makeEmitter();
		runGateCommand("   ", repo, emit);
		expect(lines).toEqual([STATUS("off")]);
		expect(fs.existsSync(cfgPath(repo))).toBe(false);
	});
});

describe("runGateCommand — round-trip echo (item 11)", () => {
	test("off→advisory→off→active: echoed mode equals loadGateConfig after each leg; literals exact", () => {
		const repo = makeRepo({ [COUNCIL_CONFIG_FILE]: TAB_FIXTURE + "\n" });
		// Start state resolves off without a write.
		expect(loadGateConfig(repo).mode).toBe("off");
		for (const [arg, literal] of [
			["advisory", SUCCESS("advisory")],
			["off", SUCCESS("off")],
			["active", SUCCESS("active")],
		] as const) {
			const { lines, emit } = makeEmitter();
			runGateCommand(arg, repo, emit);
			expect(lines).toEqual([literal]);
			expect(loadGateConfig(repo).mode).toBe(arg);
		}
	});

	test("redundant set echoes the no-change literal", () => {
		const repo = makeRepo({ [COUNCIL_CONFIG_FILE]: `{"gate":{"mode":"active"}}` });
		const { lines, emit } = makeEmitter();
		runGateCommand("active", repo, emit);
		expect(lines).toEqual([REDUNDANT("active")]);
	});
});

describe("runGateCommand — unknown / extra args (item 12)", () => {
	test("unknown token: exact error literal, no write, single line", () => {
		const repo = makeRepo({ [COUNCIL_CONFIG_FILE]: TAB_FIXTURE + "\n" });
		const before = cfg(repo);
		const { lines, emit } = makeEmitter();
		runGateCommand("turbo", repo, emit);
		expect(lines).toEqual([USAGE_ERROR("turbo")]);
		expect(lines[0]).not.toMatch(/\n/);
		expect(cfg(repo)).toBe(before);
	});

	test("extra args (>1 token) land on the same error line; file byte-identical", () => {
		const repo = makeRepo({ [COUNCIL_CONFIG_FILE]: `{"gate":{"mode":"off"}}` });
		const before = cfg(repo);
		const { lines, emit } = makeEmitter();
		runGateCommand("off advisory", repo, emit);
		expect(lines).toEqual([USAGE_ERROR("off advisory")]);
		expect(lines[0]).not.toMatch(/\n/);
		expect(cfg(repo)).toBe(before);
	});
});

describe("runGateCommand — O3 pin (item 13)", () => {
	test(`"off " (trailing whitespace) is a VALID off request, not an error`, () => {
		const repo = makeRepo({ [COUNCIL_CONFIG_FILE]: `{"gate":{"mode":"advisory"}}` });
		const { lines, emit } = makeEmitter();
		runGateCommand("off ", repo, emit);
		expect(lines).toEqual([SUCCESS("off")]);
		expect(loadGateConfig(repo).mode).toBe("off");
	});
});

describe("runGateCommand — O4 fail-soft read-back (item 14)", () => {
	test("write lands but read-back throws ⇒ still the success copy with the requested mode", () => {
		const repo = makeRepo();
		const badWrite = (): { ok: true } => {
			fs.writeFileSync(cfgPath(repo), "{ broken");
			return { ok: true };
		};
		const { lines, emit } = makeEmitter();
		runGateCommand("active", repo, emit, badWrite);
		expect(lines).toEqual([SUCCESS("active")]);
		expect(lines[0]).not.toMatch(/error/);
	});
});

describe("runGateCommand — O5 copy forms (item 15)", () => {
	test("all four copy forms emit single lines (no embedded newline)", () => {
		const repo = makeRepo({ [COUNCIL_CONFIG_FILE]: TAB_FIXTURE + "\n" });
		const { lines, emit } = makeEmitter();
		runGateCommand("", repo, emit); // status
		runGateCommand("advisory", repo, emit); // success
		runGateCommand("advisory", repo, emit); // redundant
		runGateCommand("bogus", repo, emit); // error
		for (const line of lines) expect(line).not.toMatch(/\n/);
		expect(lines[0]).toBe(STATUS("off"));
		expect(lines[1]).toBe(SUCCESS("advisory"));
		expect(lines[2]).toBe(REDUNDANT("advisory"));
		expect(lines[3]).toBe(USAGE_ERROR("bogus"));
	});
});

describe("lazy resolver proof (item 16)", () => {
	test("resolve, mutate file, resolve again ⇒ different mode (echo-then-run timing)", () => {
		const repo = makeRepo({ [COUNCIL_CONFIG_FILE]: `{"gate":{"mode":"off"}}` });
		expect(loadGateConfig(repo).mode).toBe("off");
		expect(writeGateMode({ repoRoot: repo, mode: "active" })).toEqual({ ok: true });
		expect(loadGateConfig(repo).mode).toBe("active");
	});
});

describe("module hygiene (item 17)", () => {
	test(`"jev" appears in no operator-facing string of the new module`, () => {
		const src = fs.readFileSync(
			path.join(import.meta.dir, "..", "extensions", "council-gate-cmd.ts"),
			"utf-8",
		);
		expect(src).not.toMatch(/jev/i);
	});
});

describe("registration (item 18)", () => {
	test("index.ts registers /council-gate wired to the pure module (house pattern)", () => {
		const src = fs.readFileSync(path.join(import.meta.dir, "..", "extensions", "index.ts"), "utf-8");
		expect(src).toContain('pi.registerCommand("council-gate"');
		const idx = src.indexOf('pi.registerCommand("council-gate"');
		const next = src.indexOf("pi.registerCommand", idx + 10);
		const block = src.slice(idx, next === -1 ? src.length : next);
		expect(block).toMatch(/runGateCommand\(/); // wired to the pure module
		expect(block).toMatch(/off\|advisory\|active/); // description names the mode values
	});
});
