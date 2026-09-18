// FLLWUP-58 — the gates CI runaway-backstop tripwire (spec §2.2).
//
// Pure offline: file reads only — no spawns, no network, no new live arm
// (FLLWUP-49 O10), no new dependency. Runs in the default suite in well
// under a second.
//
// Derive, never restate: the per-test ceiling census is scanned from
// test/**/*.test.ts at run time (recursive — the top-level glob misses
// test/mcp/), the shipped backstop value is read from
// .github/workflows/gates.yml, and the doc value is read from
// vault/wiki/test-suite-budget.md. No ceiling, sum, or shipped-value
// constant is written here — the only numeric literals are structural
// (the ms-per-minute unit conversion, the census parser's
// minimum-plausibility threshold, and the count in the exactly-one
// placement assertion).
//
// Census terms are bun test-level ceilings in standalone-line form — the
// third positional argument of a `test(name, fn, timeoutMs)` call sitting
// on its own line: a bare numeric literal (`300_000,`) or a small integer
// product (`6 * 60_000,` at test/integration.test.ts:60 — a literal `_000`
// regex misses it, Skeptic O4). Option-object keys (`timeout: 30_000,`,
// `stallMs: 60_000,`), harness-internal spawnSync bounds
// (`timeout: 280_000,` — inner first-to-fire bounds under an outer test
// ceiling, not census terms, Skeptic O6 / PO ruling §1), compact closings
// (`}, 15_000);`), and the vacuous 5s bun-default tier (Skeptic O5) never
// match the standalone-line shape and are never census terms.
import { expect, test } from "bun:test";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";

const REPO_ROOT = dirname(import.meta.dir); // test/ parent = repo root
const GATES_YML = join(REPO_ROOT, ".github", "workflows", "gates.yml");
const TEST_DIR = join(REPO_ROOT, "test");
const WIKI = join(REPO_ROOT, "vault", "wiki", "test-suite-budget.md");

/** The wiki's machine-parity marker (the test defines the marker text; the
 *  wiki's CI-backstop section carries it verbatim with a backticked value). */
const WIKI_MARKER = "Shipped backstop value (machine-parity marker):";

/** Structural unit conversion — not a census term. */
const MS_PER_MINUTE = 60_000;

/** Census parser threshold, structural not data: a test-level ceiling is at
 *  least 10s (the 5s bun-default tier is vacuous for arm-bearing tests,
 *  Skeptic O5); a smaller standalone number is not a ceiling (e.g. the
 *  manifest ordinals in ev36-one-row-floor.test.ts). */
const MIN_CEILING_MS = 10_000;

const LITERAL_LINE = /^\s*(\d[\d_]*),\s*$/;
const PRODUCT_LINE = /^\s*(\d[\d_]*)\s*\*\s*(\d[\d_]*),\s*$/;

interface CensusTerm {
	file: string; // relative to test/
	line: number; // 1-based
	source: string; // the trimmed carrying line
	ms: number;
	gated: boolean; // carrying file is skipped in the default run
}

/** A file whose tests are `test.skipIf`-gated behind one of the integration
 *  env vars is skipped in the default `bun test` run: its ceilings are
 *  reported separately, never summed into the default-suite floor. */
function isGatedFile(text: string): boolean {
	return (
		text.includes("test.skipIf(") &&
		(text.includes("COUNCIL_INTEGRATION") ||
			text.includes("COUNCIL_MCP_INTEGRATION"))
	);
}

function parseCeilingLine(line: string): number | null {
	const prod = PRODUCT_LINE.exec(line);
	if (prod) return Number(prod[1].replaceAll("_", "")) * Number(prod[2].replaceAll("_", ""));
	const lit = LITERAL_LINE.exec(line);
	if (lit) return Number(lit[1].replaceAll("_", ""));
	return null;
}

/** Derive the census from the tree. Never restated — a new arm, a changed
 *  ceiling, or a gated-site promotion re-derives here. */
function census(): CensusTerm[] {
	const terms: CensusTerm[] = [];
	const walk = (dir: string): void => {
		for (const entry of readdirSync(dir)) {
			const p = join(dir, entry);
			if (statSync(p).isDirectory()) {
				walk(p);
				continue;
			}
			if (!entry.endsWith(".test.ts")) continue;
			const text = readFileSync(p, "utf-8");
			const gated = isGatedFile(text);
			const lines = text.split("\n");
			for (let i = 0; i < lines.length; i++) {
				const ms = parseCeilingLine(lines[i]);
				if (ms !== null && ms >= MIN_CEILING_MS) {
					terms.push({
						file: relative(TEST_DIR, p),
						line: i + 1,
						source: lines[i].trim(),
						ms,
						gated,
					});
				}
			}
		}
	};
	walk(TEST_DIR);
	return terms;
}

function gatesLines(): string[] {
	return readFileSync(GATES_YML, "utf-8").split("\n");
}

function indentOf(line: string): number {
	return line.length - line.trimStart().length;
}

/** Parse the shipped backstop from gates.yml. A named throw, not a silent
 *  skip: removal of the line is a red with its reason stated. */
function shippedBackstop(): { value: number; index: number; indent: number } {
	const lines = gatesLines();
	const idx = lines.findIndex((l) => l.includes("timeout-minutes:"));
	if (idx === -1) {
		throw new Error(
			"gates.yml carries no timeout-minutes line — the runaway backstop is gone (FLLWUP-58)",
		);
	}
	const m = /timeout-minutes:\s*(\d+)\s*$/.exec(lines[idx]);
	if (!m) {
		throw new Error(
			`gates.yml timeout-minutes value is not a plain integer: ${lines[idx].trim()}`,
		);
	}
	return { value: Number(m[1]), index: idx, indent: indentOf(lines[idx]) };
}

test("census: derived from the tree, split by default vs gated", () => {
	const terms = census();
	expect(terms.length).toBeGreaterThan(0);
	for (const t of terms) {
		// every term is a standalone numeric/product line — option-object
		// keys, harness-internal spawnSync bounds, and compact closings are
		// structurally excluded (they never take this shape)
		expect(t.source).toMatch(/^[0-9_*\s]+,$/);
		// split-mechanism tripwire: a skipIf-carrying file's terms must be
		// classified gated — if the gate mechanism drifted out of the
		// detector's vocabulary, the site would silently join the default
		// floor and this reds
		const text = readFileSync(join(TEST_DIR, t.file), "utf-8");
		if (text.includes("skipIf(")) expect(t.gated).toBe(true);
	}
	// the split is real on both sides today: arm ceilings in the default
	// suite and gated probe ceilings are both present in the tree
	expect(terms.some((t) => !t.gated)).toBe(true);
	expect(terms.some((t) => t.gated)).toBe(true);
});

test("backstop floor: shipped ≥ ceil(default-suite census sum) + 1 minute", () => {
	const terms = census();
	const defaultSumMs = terms
		.filter((t) => !t.gated) // gated sites never sum into the default floor
		.reduce((s, t) => s + t.ms, 0);
	const floorMinutes = Math.ceil(defaultSumMs / MS_PER_MINUTE) + 1;
	expect(shippedBackstop().value).toBeGreaterThanOrEqual(floorMinutes);
});

test("placement: exactly one timeout-minutes, on the bun test step, none at job level", () => {
	const lines = gatesLines();
	// exactly one in the whole file — a job-level clone or a second step
	// line reds here
	expect(lines.filter((l) => l.includes("timeout-minutes:")).length).toBe(1);
	const shipped = shippedBackstop();
	// step-level: the carrying line is the property of the step item whose
	// run line is the bun test step
	expect(lines[shipped.index - 1].trim()).toBe("- run: bun test");
	// none at job level: the job's own property indent is `runs-on:`'s
	// indent; a job-level timeout-minutes would sit there, not on a step
	const runsOn = lines.find((l) => l.trim().startsWith("runs-on:"));
	expect(runsOn).toBeDefined();
	expect(shipped.indent).toBeGreaterThan(indentOf(runsOn!));
});

test("fetch-depth: 0 parity on the checkout step (FLLWUP-59 R2)", () => {
	const lines = gatesLines();
	const idx = lines.findIndex((l) => l.trim().startsWith("- uses: actions/checkout@"));
	expect(idx).toBeGreaterThan(-1);
	expect(lines[idx + 1].trim()).toBe("with:");
	expect(lines[idx + 2].trim()).toBe("fetch-depth: 0");
	// verbatim: exactly one full-depth pin in the file
	expect(lines.filter((l) => l.includes("fetch-depth:")).length).toBe(1);
});

test("line↔doc parity: the wiki states the shipped value in machine-extractable form", () => {
	const shipped = shippedBackstop().value;
	const wikiLines = readFileSync(WIKI, "utf-8").split("\n");
	const markerLine = wikiLines.find((l) => l.includes(WIKI_MARKER));
	expect(markerLine).toBeDefined();
	const m = /`timeout-minutes:\s*(\d+)`/.exec(markerLine ?? "");
	expect(m).not.toBeNull();
	expect(Number(m![1])).toBe(shipped);
});
