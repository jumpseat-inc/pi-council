// EV-77 — mechanical pins for the gate-surface wiki documentation
// (docs/superpowers/specs/2026-09-20-ev-77-design.md; J2 product-owner
// ruling: ALL mechanical pins live in `test/`, never `council/validate.py`).
//
// Pure offline: file reads over the real `vault/wiki/*.md` plus one
// `resolveRoute` behavioral probe on a throwaway directory (no network, no
// model call, no new live arm — no `[[test-suite-budget]]` header owed).
//
// Byte-copy pins follow the FLLWUP-58 marker pattern: the test defines the
// string, the page carries it verbatim. Variable path slots are written as
// `<...>` placeholders in BOTH sides — the code's interpolating `${file}` /
// `${configFile}` / `${mode}` / `${arg}` segments are guarded separately by
// per-literal source-drift checks so the pinned templates cannot drift from
// the shipped strings.
import { expect, test } from "bun:test";
import { existsSync, mkdtempSync, readdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { GATE_DECISION_MODES, GATE_MODES } from "../extensions/gate.ts";
import { resolveRoute } from "../extensions/gate-route.ts";

const REPO_ROOT = dirname(import.meta.dir); // test/ parent = repo root
const WIKI_DIR = join(REPO_ROOT, "vault", "wiki");
const PAGE_PATH = join(WIKI_DIR, "metered-deliberation-routing.md");
const INDEX_PATH = join(WIKI_DIR, "index.md");

const PAGE = readFileSync(PAGE_PATH, "utf-8");
const INDEX = readFileSync(INDEX_PATH, "utf-8");
const GATE_TS = readFileSync(join(REPO_ROOT, "extensions", "gate.ts"), "utf-8");
const GATE_RUN_TS = readFileSync(join(REPO_ROOT, "extensions", "gate-run.ts"), "utf-8");
const GATE_RENDER_TS = readFileSync(join(REPO_ROOT, "extensions", "gate-render.ts"), "utf-8");
const GATE_ROUTE_TS = readFileSync(join(REPO_ROOT, "extensions", "gate-route.ts"), "utf-8");
const PREFLIGHT_TS = readFileSync(join(REPO_ROOT, "extensions", "preflight.ts"), "utf-8");
const CMD_TS = readFileSync(join(REPO_ROOT, "extensions", "council-gate-cmd.ts"), "utf-8");

// ---- T3 byte-copy pins: the test defines the string; the page carries it
// verbatim. `<...>` slots mark the code's interpolations. ----

/** EV-75 migration FAIL (`extensions/gate.ts:186-189`). */
const EV75_MIGRATION_LINE =
	"FAIL: <policy.json path> has an invalid mode — unknown key; gate enablement moved to gate.mode in <.council.json path> — remove this key and set gate.mode there";

/** EV-76 run-start preflight FAIL (`extensions/preflight.ts`). */
const EV76_PREFLIGHT_FAIL_LINE =
	'FAIL: decisions gate is enabled (mode "<mode>") but no OpenRouter credential resolved — set OPENROUTER_API_KEY, or run /login openrouter in pi to store an openrouter api_key credential, then re-run preflight';

/** EV-76 run-start preflight pass line — the tool's ONLY pass output, in
 * BOTH pass cases (gate off, or gate on + credential resolved). */
const EV76_PREFLIGHT_OK_LINE =
	"council_preflight: ok — decisions gate off, or an OpenRouter credential resolved";

/** `/council-gate` shipped copy lines (`extensions/council-gate-cmd.ts`). */
const CMD_STATUS_LINE = "[council-gate] gate mode is <mode>.";
const CMD_SUCCESS_LINE =
	"council-gate: gate mode is now <mode> in .council.json — applies to dispatches after this echo.";
const CMD_NOOP_LINE = "council-gate: gate mode is already <mode> in .council.json — no change.";
const CMD_USAGE_LINE =
	'[council-gate] error: unknown mode "<arg>" — usage: /council-gate [off|advisory|active]';

/** gate-render fallback literals (cells B and C — distinct honest states). */
const CELL_B_LITERAL = "gate call failed before recording a verdict";
const CELL_C_LITERAL = "recorded gate call not found in ledger";

/** The fail-closed basis shape (`extensions/gate-run.ts`). */
const FAIL_CLOSED_SHAPE = "gate call failed: <reason>";

/** The off⇒Deliberate basis (`extensions/gate-route.ts`). */
const OFF_BASIS = "gate mode off — no recorded decision";

/** Real decide()/fail-closed renders lifted from test/gate-decide.test.ts and
 * test/gate-render.test.ts — the page's per-shape characterizing needles. */
const DECIDE_SHAPE_EXAMPLES = [
	"reversible? no (one-way door)", // hard override
	"confidence 0.50 < choice floor 0.70", // choice confidence floor
	"confidence 0.40 < score floor 0.70", // score confidence floor
	"certainty 0.51 < noul threshold 0.60", // noul certainty
	"composite 3.60 ≥ direct threshold 3.40", // composite → Direct
	"composite 2.75 ≥ verify threshold 2.60", // composite → Verify
	"composite 1.85 < verify threshold 2.60", // composite → Deliberate
	"gate call failed: no OpenRouter API key resolved (OPENROUTER_API_KEY env or stored credential)", // fail-closed
];

/** Routing-read `RouteResult` basis fragments (`extensions/gate-route.ts`) —
 * described on the page as never reaching `decisionLine`. */
const ROUTE_RESULT_FRAGMENTS = [
	OFF_BASIS,
	"no recorded decision for the current packed state",
	"recorded decision for this state uses policyVersion ",
	"recorded decision for this state does not re-derive under the current decision policy — routes full",
	"recorded decisions for this state disagree (",
	" — the strongest valid mode holds",
	"recorded decision (call ",
];

/** Source-drift guards: the static segments each pinned template is built
 * from must still sit in the emitting source file byte-verbatim. The EV-75
 * line is split by hand because its middle segment crosses the code's
 * `${detail}` interpolation boundary (outer template + detail const). */
const SOURCE_SEGMENTS: Array<[string, string, string[]]> = [
	[
		"extensions/gate.ts",
		EV75_MIGRATION_LINE,
		[
			"FAIL: ",
			"has an invalid mode — ",
			"unknown key; gate enablement moved to gate.mode in ",
			" — remove this key and set gate.mode there",
		],
	],
	["extensions/preflight.ts", EV76_PREFLIGHT_FAIL_LINE, [
		// hand-split: the code builds the line from three concatenated literals
		'FAIL: decisions gate is enabled (mode "',
		'") but no OpenRouter credential resolved — ',
		"set OPENROUTER_API_KEY, or run /login openrouter in pi to store an openrouter api_key credential, ",
		"then re-run preflight",
	]],
	["extensions/preflight.ts", EV76_PREFLIGHT_OK_LINE, [EV76_PREFLIGHT_OK_LINE]],
	["extensions/council-gate-cmd.ts", CMD_STATUS_LINE, templateSegments(CMD_STATUS_LINE)],
	["extensions/council-gate-cmd.ts", CMD_SUCCESS_LINE, templateSegments(CMD_SUCCESS_LINE)],
	["extensions/council-gate-cmd.ts", CMD_NOOP_LINE, templateSegments(CMD_NOOP_LINE)],
	["extensions/council-gate-cmd.ts", CMD_USAGE_LINE, templateSegments(CMD_USAGE_LINE)],
	["extensions/gate-render.ts", CELL_B_LITERAL, [CELL_B_LITERAL]],
	["extensions/gate-render.ts", CELL_C_LITERAL, [CELL_C_LITERAL]],
	["extensions/gate-run.ts", FAIL_CLOSED_SHAPE, ["gate call failed: "]],
];

/** Split a pinned template on its `<...>` placeholder slots. */
function templateSegments(template: string): string[] {
	return template.split(/<[^>]+>/).filter((s) => s.length > 0);
}

// ---- T1 machinery: cited-path existence + index reach over the real wiki. ----

/** Known source roots a backticked token is treated as a repo citation in. */
const CITATION_ROOTS = ["extensions/", "council/", "test/", "docs/", "vault/", ".github/"];

/** Citations whose target deliberately does not exist on this tree. Each
 * entry carries its reason; every entry is a documented fact in the wiki
 * itself (historical record, cross-repo pointer, or runtime-created dir) —
 * not a silenced finding. If one starts existing, drop the exemption. */
const CITATION_EXEMPTS = new Map<string, string>([
	["docs/usage.md", "headless-pi.md cites pi-the-app's docs — a different repo"],
	["docs/settings.md", "headless-pi.md cites pi-the-app's docs — a different repo"],
	["council/agents/AGENTS.md", "log.md history note recording that dangling citation's removal"],
	["test/ev40-harness/", "retired path; nonexistence is retired-path-tokens.md's documented subject (FLLWUP-59)"],
	["test/ev40-harness/harness-headless.ts", "retired path (FLLWUP-59 record)"],
	["test/ev41-tui.py", "retired path (FLLWUP-59 record); the live copy is test/faux-provider/ev41-tui.py"],
	["vault/.llm-wiki-bootstrap.md", "log.md records dropping this dangling citation"],
	["council/eval-results/", "runtime-created, gitignored output directory — absent in a clean clone"],
]);

function wikiMarkdownFiles(): string[] {
	// the living wiki layer only (vault/wiki/*.md): entity/concept/overview
	// pages. vault/wiki/sources/*.md are per-source summaries of historical
	// raw documents — they quote past design docs' paths as written and are
	// records, not live pointers.
	return readdirSync(WIKI_DIR)
		.filter((f) => f.endsWith(".md"))
		.map((f) => join(WIKI_DIR, f));
}

function backtickedTokens(text: string): string[] {
	return [...text.matchAll(/`([^`\n]+)`/g)].map((m) => m[1]!);
}

function isCitationToken(token: string): boolean {
	if (!CITATION_ROOTS.some((r) => token.startsWith(r))) return false;
			if (/[*{}<>\s…]/.test(token) || token.includes("..")) return false;
			return true;
}

/** A citation resolves when the token (minus a `:line`/`:line-range` cite
 * suffix) exists as a file or directory; a glob's static prefix directory
 * must exist. */
function citationResolves(token: string): boolean {
	const base = token.split(":")[0]!;
	const globCut = base.search(/[*{]/);
	const probe = globCut === -1 ? base : base.slice(0, globCut).replace(/\/$/, "");
	return probe.length > 0 && existsSync(join(REPO_ROOT, probe));
}

function frontmatterField(text: string, field: string): string[] {
	const values: string[] = [];
	const title = new RegExp(`^${field}:\\s*(.+)$`, "m").exec(text);
	if (title) values.push(title[1]!.trim());
	return values;
}

function aliasesOf(text: string): string[] {
	const m = /^aliases:\s*\[(.*)\]\s*$/m.exec(text);
	if (!m) return [];
	return m[1]!
		.split(",")
		.map((a) => a.trim().replace(/^["']|["']$/g, ""))
		.filter((a) => a.length > 0);
}

/** Obsidian resolves [[links]] by note name, not path: hyphens, underscores,
 * and spaces are the same character for reachability purposes. */
function normalizeName(s: string): string {
	return s.toLowerCase().replace(/[-_ ]/g, "");
}

function indexLinkNames(): Set<string> {
	const names = new Set<string>();
	for (const m of INDEX.matchAll(/\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/g)) {
		names.add(normalizeName(m[1]!.trim()));
	}
	return names;
}

// ---- T2/T3/T4/T5/T6 ----

test("T1: every cited code path in vault/wiki exists; every page is reachable from the index", () => {
	const exemptionsStillMissing: string[] = [];
	for (const file of wikiMarkdownFiles()) {
		const text = readFileSync(file, "utf-8");
		for (const token of backtickedTokens(text)) {
			if (!isCitationToken(token)) continue;
			if (CITATION_EXEMPTS.has(token)) {
				if (existsSync(join(REPO_ROOT, token.split(":")[0]!))) {
					throw new Error(`exemption stale — ${token} now exists; drop it from CITATION_EXEMPTS`);
				}
				exemptionsStillMissing.push(token);
				continue;
			}
			expect(
				citationResolves(token),
				`${file.replace(REPO_ROOT + "/", "")} cites missing path: ${token}`,
			).toBe(true);
		}
	}
	// every exemption is still doing exemption work (no dead allowlist entries)
	expect(new Set(exemptionsStillMissing)).toEqual(new Set(CITATION_EXEMPTS.keys()));

	// index reach: filename stem, frontmatter title, or an alias must appear
	// as an index [[link]] (index.md is the catalog itself; log.md is the
	// structural append-only timeline per vault/CLAUDE.md, not a page).
	const links = indexLinkNames();
	for (const file of readdirSync(WIKI_DIR)) {
		if (!file.endsWith(".md")) continue;
		if (file === "index.md" || file === "log.md") continue;
		const text = readFileSync(join(WIKI_DIR, file), "utf-8");
		const names = [file.replace(/\.md$/, ""), ...frontmatterField(text, "title"), ...aliasesOf(text)].map(normalizeName);
		const reachable = names.some((n) => links.has(n));
		expect(reachable, `vault/wiki/${file} is not reachable from vault/wiki/index.md`).toBe(true);
	}
});

test("T2: mode identity — every GATE_MODES / GATE_DECISION_MODES member and the exact usage tail", () => {
	for (const mode of GATE_MODES) {
		expect(PAGE).toContain(`\`${mode}\``);
	}
	for (const mode of GATE_DECISION_MODES) {
		expect(PAGE).toContain(mode);
	}
	// the exact shipped usage tail, byte-verbatim
	expect(PAGE).toContain("usage: /council-gate [off|advisory|active]");
	// and it is the tail of the full shipped error line
	expect(PAGE).toContain(CMD_USAGE_LINE);
});

test("T3: basis coverage — byte-exact constants present and source-drift-guarded", () => {
	// byte-copy pins: the page carries each pinned literal verbatim
	for (const literal of [
		EV75_MIGRATION_LINE,
		EV76_PREFLIGHT_FAIL_LINE,
		EV76_PREFLIGHT_OK_LINE,
		CMD_STATUS_LINE,
		CMD_SUCCESS_LINE,
		CMD_NOOP_LINE,
		CMD_USAGE_LINE,
		CELL_B_LITERAL,
		CELL_C_LITERAL,
		FAIL_CLOSED_SHAPE,
	]) {
		expect(PAGE).toContain(literal);
	}
	// every decide() shape + fail-closed render has its characterizing example
	for (const example of DECIDE_SHAPE_EXAMPLES) {
		expect(PAGE).toContain(example);
	}
	// routing-read RouteResult bases are described (never as decisionLine output)
	for (const fragment of ROUTE_RESULT_FRAGMENTS) {
		expect(PAGE).toContain(fragment);
	}
	expect(PAGE).toContain("never reach");
	// source drift: the pinned templates' static segments still sit in the
	// emitting modules — a code-side wording change reds here, not silently
	for (const [file, template, segments] of SOURCE_SEGMENTS) {
		const source = readFileSync(join(REPO_ROOT, file), "utf-8");
		for (const segment of segments) {
			expect(source).toContain(segment);
		}
		expect(template.length).toBeGreaterThan(0); // the pin itself is non-vacuous
	}
});

test("T4: off⇒Deliberate pinned against resolveRoute behavior, not just page copy", () => {
	const tmp = mkdtempSync(join(tmpdir(), "ev77-off-"));
	// no .council.json in tmp ⇒ loadGateConfig resolves "off"; resolveRoute
	// must return the full-panel fallback BEFORE any state build (no card is
	// even needed beyond the type).
	const route = resolveRoute({} as Parameters<typeof resolveRoute>[0], tmp);
	expect(route.mode).toBe("Deliberate");
	expect(route.source).toBe("fallback");
	expect(route.basis).toBe(OFF_BASIS);
	// the page's inverted-reading callout carries the same basis, byte-verbatim
	expect(PAGE).toContain(OFF_BASIS);
	expect(PAGE).toContain("routes every card to the full Deliberate");
});

test("T5: index reach + de-staled summary naming the inversion", () => {
	expect(INDEX).toContain("[[metered-deliberation-routing]]");
	const entry = INDEX.split("\n").find((l) => l.includes("[[metered-deliberation-routing]]"));
	expect(entry).toBeDefined();
	// the index itself names the off-as-Deliberate inversion (one click)
	expect(entry).toContain("off` routes every card to the full Deliberate panel");
	// no pre-EV-73 config-home semantics: policy.json is not the enablement home
	expect(entry).not.toContain("policy.json");
});

test("T6: stale-claim guards — FLLWUP-74 closed; policy.json never mode-bearing outside the migration section", () => {
	// verify > 0 is enforced at extensions/gate.ts; the page no longer lists
	// the gap as open (or mentions the id at all)
	expect(PAGE).not.toContain("FLLWUP-74");
	const residuals = PAGE.slice(PAGE.indexOf("## Residuals"), PAGE.indexOf("## Related"));
	expect(residuals).toContain("FLLWUP-71");
	expect(residuals).toContain("FLLWUP-75");

	// the preflight pass is NOT silent at the tool surface (EV-77 cycle-1 red):
	// both pass cases return the single ok line; silence is engine-internal only
	expect(PAGE).not.toContain("A pass is silent");

	// policy.json mode-bearing guard: outside the migration section (where the
	// historical mode key is the subject), every policy.json line must be one
	// of the known-safe "tuning data, never a mode" phrasings.
	const migrationStart = PAGE.indexOf("## Legacy");
	const migrationEnd = PAGE.indexOf("## Run-start preflight");
	expect(migrationStart).toBeGreaterThan(-1);
	expect(migrationEnd).toBeGreaterThan(migrationStart);
	const startLine = PAGE.slice(0, migrationStart).split("\n").length - 1;
	const endLine = PAGE.slice(0, migrationEnd).split("\n").length - 1;
	const lines = PAGE.split("\n");
	// hard-wrapped markdown: check per paragraph (blank-line-separated), so a
	// safe phrase spanning a wrap is not a false red
	const paragraphs: Array<{ text: string; start: number }> = [];
	{
		let start = 0;
		for (let i = 1; i <= lines.length; i++) {
			if (i === lines.length || lines[i]!.trim() === "") {
				paragraphs.push({ text: lines.slice(start, i).join(" "), start });
				start = i + 1;
			}
		}
	}
	const SAFE = /never a mode|tuning data only|no longer an accepted/;
	let policyJsonMentions = 0;
	for (const para of paragraphs) {
		if (!para.text.includes("policy.json")) continue;
		if (para.start >= startLine && para.start <= endLine) continue; // migration section: the mode key IS the subject
		policyJsonMentions++;
		expect(
			SAFE.test(para.text),
			`paragraph describes policy.json outside the safe phrasings: ${para.text.slice(0, 120)}`,
		).toBe(true);
	}
	expect(policyJsonMentions).toBeGreaterThan(0); // the guard is not vacuous
});
