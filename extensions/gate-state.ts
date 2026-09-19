// EV-64 — the gate's state packer (EPIC-13). Pure: it reads the repo tree
// and writes nothing, performs no network and no model call. Persistence
// (ledger lines) is EV-65's decision and seam. This module imports only
// TYPES from ./gate.ts — the dependency edge is one-way, and neither
// gate.ts nor gate-ledger.ts ever imports this module.
//
// What the gate model is given is packed deliberately: thin state produces
// confident wrong answers rather than visible uncertainty. Five sections in
// a fixed declared order, each with its own token cap, filled greedily
// forward against the policy's gateStateBudgetTokens; an over-budget state
// is cut at the tail with the cut recorded, so a reader can tell a thin
// state from a full one.
import { createHash } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import { CONFIG_DIR_NAME } from "@earendil-works/pi-coding-agent";
import type { GatePolicy } from "./gate.ts";
import { PKG_ROOT } from "./seats.ts";

/** Fixed declared section order — a pinned contract, like MODE_PANELS — and
 * per-section caps in measured tokens. Caps are NOT policy keys: they are a
 * fixed packing contract. Caps sum to 19,000, so a well-formed pack fits
 * without dropping under the packaged policy's budget. */
export const GATE_SECTIONS = ["card", "touchedFiles", "wiki", "rulings", "tests"] as const;
export type GateSection = (typeof GATE_SECTIONS)[number];
const SECTION_CAPS: Record<GateSection, number> = {
	card: 4000,
	touchedFiles: 2000,
	wiki: 4000,
	rulings: 8000,
	tests: 1000,
};

/** The pinned token estimator (PO ruling Q2): an ESTIMATE, not uniformly
 * conservative. It is ceil(utf8 byteLength / 3.5). Against the o200k_base
 * reference tokenizer it over-counts ASCII prose (reference probe +45.8%)
 * and under-counts dense code (−35.9%), rare CJK such as 龘 (−13.3%), and
 * emoji (−17.2%). "Measured token count" everywhere in this module means
 * this function's count. The production gate model's own tokenizer is
 * unprobed; if any ledger line's provider-reported input_tokens ever
 * exceeds this count for the same bytes, the coefficient is a defect and
 * gets its own card. */
export function estimateTokens(text: string | Uint8Array): number {
	const bytes = typeof text === "string" ? new TextEncoder().encode(text) : text;
	return Math.ceil(bytes.byteLength / 3.5);
}

/** One ordered record line per section, in GATE_SECTIONS order. `truncated`
 * names the mechanism that cut the section: false (nothing lost), "cap"
 * (the section's own cap cut it while the budget still had room; later
 * sections are unaffected), or "budget" (the remaining budget cut it; every
 * later section is dropped entirely). When both bounds bind at the same
 * section the record names "budget" — the budget cut is strictly deeper
 * than the cap cut and is the mechanism that truncated the section. */
export interface DropRecord {
	section: GateSection;
	truncated: false | "cap" | "budget";
	kept: number;
	measuredTokens: number;
}

/** A touched-file manifest entry: paths and changed-line counts, never file
 * contents. The manifest is an EXPLICIT input, never an ambient git diff —
 * ambient uncommitted state would make the packed bytes a function of
 * whatever happens to be dirty. */
export interface TouchedFile {
	path: string;
	linesChanged: number;
}

export interface ParsedCard {
	id: string;
	title: string;
	goal: string;
	acceptance: string;
	touchedFiles: TouchedFile[];
}

export interface GateState {
	stateBytes: Uint8Array;
	stateHash: string;
	drops: DropRecord[];
}

function validateParsedCard(card: ParsedCard): void {
	for (const k of ["id", "title", "goal", "acceptance"] as const) {
		const v = card[k];
		if (typeof v !== "string" || v.trim() === "") {
			throw new Error(`gate-state: card.${k} must be a non-empty string, found ${JSON.stringify(v)}`);
		}
	}
	if (!Array.isArray(card.touchedFiles)) {
		throw new Error(`gate-state: touchedFiles must be an array of { path, linesChanged }, found ${JSON.stringify(card.touchedFiles)}`);
	}
	card.touchedFiles.forEach((t, i) => {
		if (typeof t?.path !== "string" || t.path.trim() === "") {
			throw new Error(`gate-state: touchedFiles[${i}].path must be a non-empty string, found ${JSON.stringify(t?.path)}`);
		}
		if (typeof t?.linesChanged !== "number" || !Number.isInteger(t.linesChanged) || t.linesChanged <= 0) {
			throw new Error(`gate-state: touchedFiles[${i}].linesChanged must be a positive integer, found ${JSON.stringify(t?.linesChanged)}`);
		}
	});
}

/** Single-line FAIL, same surface family as gate.ts's gateFail. The copy
 * deliberately drops the "remove the key" advice: under whole-file shadowing
 * removing an absent key from a repo-local file cannot summon the packaged
 * value, and there is NO code-side budget default — the packaged data file
 * is the only carrier of the number. */
function stateFail(file: string, key: string, found: string): Error {
	const detail = found.replace(/[\r\n]+/g, " ");
	return new Error(`FAIL: ${file} has an invalid ${key} — ${detail} — set a valid value`);
}

/** Resolve the packed-state budget from the gate policy file. This is a
 * minimal first-hit read mirroring gate.ts's whole-file resolution rule; the
 * duplication is the price of the type-only import edge (§1 of the design
 * spec). An absent or invalid key fails loud — it never silently assumes
 * the packaged value. */
function resolveGateStateBudget(repoRoot: string): { file: string; budget: number } {
	const dirs = [
		path.join(repoRoot, CONFIG_DIR_NAME, "council", "gate"),
		path.join(PKG_ROOT, "council", "gate"),
	];
	for (const dir of dirs) {
		const file = path.join(dir, "policy.json");
		if (!fs.existsSync(file)) continue;
		let parsed: unknown;
		try {
			parsed = JSON.parse(fs.readFileSync(file, "utf8"));
		} catch (e) {
			throw stateFail(file, "JSON", `not parseable as JSON: ${e instanceof Error ? e.message : String(e)}`);
		}
		if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
			throw stateFail(file, "JSON", "root must be a JSON object");
		}
		const raw = parsed as Partial<GatePolicy> & Record<string, unknown>;
		const v = raw.gateStateBudgetTokens;
		if (v === undefined) {
			throw stateFail(
				file,
				"gateStateBudgetTokens",
				"the key is absent — packing needs a positive integer token budget (an off-mode policy may omit it, but then no gate state is ever built)",
			);
		}
		if (typeof v !== "number" || !Number.isInteger(v) || v <= 0) {
			throw stateFail(file, "gateStateBudgetTokens", `expected a positive integer, found ${JSON.stringify(v)}`);
		}
		return { file, budget: v };
	}
	throw new Error(`gate-state: no policy.json found — looked in ${dirs.join(", ")}`);
}

/** A packing "entry": for array sections one array element; for the
 * single-object card section one FIELD (the only reading that preserves the
 * degenerate-case defense — an over-budget card truncates to its field
 * prefix and stays non-empty rather than collapsing to an empty state). */
interface SectionEntry {
	key?: string;
	value: unknown;
}

function sectionValue(section: GateSection, entries: SectionEntry[]): unknown {
	if (section === "card") {
		const o: Record<string, unknown> = {};
		for (const e of entries) o[e.key as string] = e.value;
		return o;
	}
	return entries.map((e) => e.value);
}

function pathCompare(a: string, b: string): number {
	return a < b ? -1 : a > b ? 1 : 0;
}

/** Build the packed gate state. Deterministic on (card, repo tree): the
 * same inputs yield byte-identical stateBytes and the same hash, which is
 * computed HERE and returned so the ledger's stateHash and the transported
 * bytes can never silently diverge. Packing is mode-independent — the same
 * function serves any resolved gate mode. */
export function buildGateState(card: ParsedCard, repoRoot: string): GateState {
	validateParsedCard(card);
	const { budget } = resolveGateStateBudget(repoRoot);

	const terms = extractCardTerms(card);
	const docMap = deriveDocToPageMap(repoRoot);
	const wikiCandidates = selectWikiCandidates(repoRoot, terms, docMap);

	// Full frame first: every measurement below is a measurement of a
	// complete five-section state, so the final state's measured token count
	// is exactly the last check that passed — the budget is never exceeded.
	const state: Record<GateSection, unknown> = { card: {}, touchedFiles: [], wiki: [], rulings: [], tests: [] };
	const frameTokens = estimateTokens(JSON.stringify(state));
	if (frameTokens > budget) {
		throw new Error(
			`gate-state: the empty gate-state frame alone measures ${frameTokens} tokens, exceeding the gateStateBudgetTokens budget ${budget} — set a larger budget`,
		);
	}

	const drops: DropRecord[] = [];
	let budgetCut = false;
	let selectedWikiTagLeaves: string[] = [];

	const sections: { section: GateSection; entries: () => SectionEntry[] }[] = [
		{
			section: "card",
			entries: () => [
				{ key: "id", value: card.id },
				{ key: "title", value: card.title },
				{ key: "goal", value: card.goal },
				{ key: "acceptance", value: card.acceptance },
			],
		},
		{
			section: "touchedFiles",
			entries: () =>
				[...card.touchedFiles]
					.sort((a, b) => pathCompare(a.path, b.path))
					.map((t) => ({ value: t })),
		},
		{
			section: "wiki",
			entries: () =>
				wikiCandidates.map((p) => ({
					value: { slug: p.slug, title: p.title, summary: p.summary, aliases: p.aliases },
				})),
		},
		{
			section: "rulings",
			entries: () =>
				selectRulingCandidates(repoRoot, terms, docMap, selectedWikiTagLeaves).map((r) => ({
					value: { slug: r.slug, date: r.date, title: r.title, summary: r.summary },
				})),
		},
		{
			section: "tests",
			entries: () => selectTestCandidates(repoRoot, card).map((name) => ({ value: name })),
		},
	];

	for (const { section, entries } of sections) {
		if (budgetCut) {
			// The tail rule: after a budget cut every later section is dropped
			// entirely, recorded so the cut stays visible.
			drops.push({ section, truncated: "budget", kept: 0, measuredTokens: 0 });
			continue;
		}
		const cap = SECTION_CAPS[section];
		const all = entries();
		const fragTokens = (kept: SectionEntry[]) => estimateTokens(JSON.stringify(sectionValue(section, kept)));
		const fitsBudget = (kept: SectionEntry[]) =>
			estimateTokens(JSON.stringify({ ...state, [section]: sectionValue(section, kept) })) <= budget;

		// Cap fill: largest whole-entry prefix measuring at most the section's
		// own cap. Per-field granularity for card; whole-entry for arrays.
		const capFilled: SectionEntry[] = [];
		for (const e of all) {
			if (fragTokens([...capFilled, e]) > cap) break;
			capFilled.push(e);
		}

		if (fitsBudget(capFilled)) {
			state[section] = sectionValue(section, capFilled);
			const capTrimmed = capFilled.length < all.length;
			drops.push({
				section,
				truncated: capTrimmed ? "cap" : false,
				kept: capFilled.length,
				measuredTokens: fragTokens(capFilled),
			});
			if (section === "wiki") selectedWikiTagLeaves = wikiCandidates.slice(0, capFilled.length).flatMap(tagLeaves);
			continue;
		}

		// Budget cut: largest whole-entry prefix fitting the remaining budget.
		let k = capFilled.length;
		while (k > 0 && !fitsBudget(capFilled.slice(0, k))) k--;
		state[section] = sectionValue(section, capFilled.slice(0, k));
		drops.push({
			section,
			truncated: "budget",
			kept: k,
			measuredTokens: fragTokens(capFilled.slice(0, k)),
		});
		budgetCut = true;
	}

	const stateBytes = new TextEncoder().encode(JSON.stringify(state));
	const stateHash = createHash("sha256").update(stateBytes).digest("hex");
	return { stateBytes, stateHash, drops };
}

// ---------------------------------------------------------------------------
// Deterministic wiki matcher (§5) — no model, no network. Fixed a repo tree,
// selection is deterministic: stopword-extracted card terms scored against
// each page's own frontmatter and the live-tree paths it references.
//
// Recorded limitation (O3, quantified in the card record): this is a
// term-overlap matcher, and on some goals its top picks are term-adjacent
// rather than topically right. Determinism is the contract; selection
// precision rides the model, not the packer.
// ---------------------------------------------------------------------------

const STOPWORDS = new Set([
	"the", "a", "an", "and", "or", "of", "to", "in", "for", "on", "is", "are", "with",
	"as", "by", "that", "this", "it", "be", "at", "from", "has", "have", "was", "were",
	"will", "their", "they", "then", "these", "which", "its", "but", "so", "than", "per",
	"there", "not", "into",
]);
const MIN_TERM_LEN = 3;

/** Card terms: stopword-extracted lowercase tokens from title+goal+acceptance. */
function extractCardTerms(card: ParsedCard): string[] {
	const text = `${card.title} ${card.goal} ${card.acceptance}`.toLowerCase();
	const out: string[] = [];
	for (const t of text.split(/[^a-z0-9]+/)) {
		if (t.length < MIN_TERM_LEN || STOPWORDS.has(t)) continue;
		if (!out.includes(t)) out.push(t);
	}
	return out;
}

interface ParsedFrontmatter {
	fm: Record<string, string | string[]>;
	body: string;
}

/** Minimal flat frontmatter parser (no YAML dependency): `key: value` and
 * `key: [a, b]` lines between the first two `---` markers. Multi-line block
 * scalars are unsupported — a page using them yields empty fields, never a
 * crash. A page with no frontmatter parses as body-only. */
function parseFrontmatter(text: string): ParsedFrontmatter {
	const m = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(text);
	if (!m) return { fm: {}, body: text };
	const fm: Record<string, string | string[]> = {};
	for (const line of m[1].split(/\r?\n/)) {
		const i = line.indexOf(":");
		if (i <= 0) continue;
		const key = line.slice(0, i).trim();
		const v = line.slice(i + 1).trim();
		if (v.startsWith("[") && v.endsWith("]")) {
			const inner = v.slice(1, -1).trim();
			fm[key] = inner === "" ? [] : inner.split(",").map((s) => s.trim().replace(/^["']+|["']+$/g, "")).filter((s) => s !== "");
		} else {
			fm[key] = v.replace(/^["']+|["']+$/g, "");
		}
	}
	return { fm, body: text.slice(m[0].length) };
}

function asStringArray(v: string | string[] | undefined): string[] {
	if (v === undefined) return [];
	return Array.isArray(v) ? v : [v];
}

interface PageOnDisk {
	slug: string; // vault/wiki-relative path without the .md extension
	rel: string;
	file: string;
}

function listWikiPages(repoRoot: string): PageOnDisk[] {
	const base = path.join(repoRoot, "vault", "wiki");
	if (!fs.existsSync(base)) return [];
	const out: PageOnDisk[] = [];
	const walk = (dir: string, rel: string): void => {
		let items: fs.Dirent[];
		try {
			items = fs.readdirSync(dir, { withFileTypes: true });
		} catch {
			return;
		}
		for (const e of [...items].sort((a, b) => pathCompare(a.name, b.name))) {
			const relPath = rel ? `${rel}/${e.name}` : e.name;
			if (e.isDirectory()) walk(path.join(dir, e.name), relPath);
			else if (e.isFile() && e.name.endsWith(".md")) out.push({ slug: relPath.slice(0, -3), rel: relPath, file: path.join(dir, e.name) });
		}
	};
	walk(base, "");
	return out;
}

/** Path-like tokens: words ending in a code/doc extension. Only tokens that
 * EXIST in the live tree index — a reference to a file that isn't there
 * carries no evidence. */
const PATH_TOKEN_RE = /[A-Za-z0-9_][A-Za-z0-9_./-]*\.(?:ts|tsx|js|mjs|cjs|json|md|py|sh|ya?ml)\b/g;

type DocMap = Map<string, string[]>; // live-tree path token → slugs referencing it

/** Doc-to-page map: derived per call from every page's frontmatter and body
 * — never hand-maintained (the FLLWUP-59 lesson). ~80 pages; per-call
 * derivation is cheap. */
function deriveDocToPageMap(repoRoot: string): DocMap {
	const map: DocMap = new Map();
	for (const p of listWikiPages(repoRoot)) {
		let text: string;
		try {
			text = fs.readFileSync(p.file, "utf8");
		} catch {
			continue;
		}
		for (const token of new Set(text.match(PATH_TOKEN_RE) ?? [])) {
			if (!fs.existsSync(path.join(repoRoot, token))) continue;
			const slugs = map.get(token) ?? [];
			if (!slugs.includes(p.slug)) slugs.push(p.slug);
			map.set(token, slugs);
		}
	}
	return map;
}

interface WikiCandidate {
	slug: string;
	title: string;
	summary: string;
	aliases: string[];
	tags: string[];
}

interface ScoredPage extends WikiCandidate {
	paths: string[];
	score: number;
}

/** Weighted field scoring — pinned constants (a pinning detail, not a second
 * knob): per card term, alias hit +3, title +2, tag +2, summary +1, live-tree
 * path hit +2. */
function scorePage(terms: string[], page: { title: string; summary: string; aliases: string[]; tags: string[]; paths: string[] }): number {
	let score = 0;
	for (const t of terms) {
		if (page.aliases.some((a) => a.toLowerCase().includes(t))) score += 3;
		if (page.title.toLowerCase().includes(t)) score += 2;
		if (page.tags.some((g) => g.toLowerCase().includes(t))) score += 2;
		if (page.summary.toLowerCase().includes(t)) score += 1;
		if (page.paths.some((p) => p.toLowerCase().includes(t))) score += 2;
	}
	return score;
}

/** Wiki candidates: every markdown page under vault/wiki EXCEPT
 * vault/wiki/index.md (cheap insurance, tested rule) and everything under
 * vault/wiki/sources/ (tested rule — with sources in the candidate set they
 * take top slots and ruling pages double-dip into the wiki section). Ranked
 * score-descending, tie-break lexicographic by page filename; the cap fill
 * happens in the packer, so k is emergent from the cap, not a second knob. */
function selectWikiCandidates(repoRoot: string, terms: string[], docMap: DocMap): WikiCandidate[] {
	const scored: ScoredPage[] = [];
	for (const p of listWikiPages(repoRoot)) {
		if (p.slug === "index" || p.slug.startsWith("sources/")) continue;
		const { fm, body } = parseFrontmatter(fs.readFileSync(p.file, "utf8"));
		void body;
		// A page's paths are the live-tree tokens THIS page references (the map
		// is frontmatter+body derived and live-validated, per page).
		const paths: string[] = [];
		for (const [token, slugs] of docMap) if (slugs.includes(p.slug)) paths.push(token);
		const title = typeof fm.title === "string" ? fm.title : "";
		const summary = typeof fm.summary === "string" ? fm.summary : "";
		const aliases = asStringArray(fm.aliases);
		const tags = asStringArray(fm.tags);
		scored.push({ slug: p.slug, title, summary, aliases, tags, paths, score: scorePage(terms, { title, summary, aliases, tags, paths }) });
	}
	return scored
		.sort((a, b) => (a.score !== b.score ? b.score - a.score : pathCompare(a.slug, b.slug)))
		.map((p) => ({ slug: p.slug, title: p.title, summary: p.summary, aliases: p.aliases, tags: p.tags }));
}

/** Non-namespace tag leaf: the part after the last `/` (pi-council/epic9 →
 * epic9). Ruling relevance shares these with selected wiki pages. */
function tagLeaves(page: WikiCandidate): string[] {
	return page.tags.map((t) => (t.includes("/") ? t.slice(t.lastIndexOf("/") + 1) : t));
}

interface RulingCandidate {
	slug: string;
	date: string;
	title: string;
	summary: string;
}

/** Rulings (§6): candidates are vault/wiki/sources/ pages whose tags include
 * pi-council/ruling. Relevance: shares a non-namespace tag leaf with a
 * selected wiki page, OR aliases/summary match a card term. Ordering settled
 * by direct measurement (O2): rank by the same card-term scorer, tie-break
 * date descending (the corpus's date field is tie-dominated; date-first
 * ordering measured mean top-6 relevance 1.00 vs 3.17 for scorer-then-date),
 * final tie-break slug ascending for a total order. */
function selectRulingCandidates(
	repoRoot: string,
	terms: string[],
	docMap: DocMap,
	wikiTagLeaves: string[],
): RulingCandidate[] {
	const scored: (RulingCandidate & { score: number })[] = [];
	for (const p of listWikiPages(repoRoot)) {
		if (!p.slug.startsWith("sources/")) continue;
		const { fm } = parseFrontmatter(fs.readFileSync(p.file, "utf8"));
		const tags = asStringArray(fm.tags);
		if (!tags.includes("pi-council/ruling")) continue;
		const title = typeof fm.title === "string" ? fm.title : "";
		const summary = typeof fm.summary === "string" ? fm.summary : "";
		const aliases = asStringArray(fm.aliases);
		const paths: string[] = [];
		for (const [token, slugs] of docMap) if (slugs.includes(p.slug)) paths.push(token);
		const sharedTag = tags.some((t) => wikiTagLeaves.includes(t.includes("/") ? t.slice(t.lastIndexOf("/") + 1) : t));
		const termMatch = terms.some(
			(t) => aliases.some((a) => a.toLowerCase().includes(t)) || summary.toLowerCase().includes(t),
		);
		if (!sharedTag && !termMatch) continue;
		const date = typeof fm.updated === "string" ? fm.updated : typeof fm.created === "string" ? fm.created : "";
		scored.push({
			slug: p.slug,
			date,
			title,
			summary,
			score: scorePage(terms, { title, summary, aliases, tags, paths }),
		});
	}
	return scored
		.sort((a, b) =>
			a.score !== b.score ? b.score - a.score : a.date !== b.date ? b.date.localeCompare(a.date) : pathCompare(a.slug, b.slug))
		.map(({ slug, date, title, summary }) => ({ slug, date, title, summary }));
}

/** Tests section (§3): names of existing tests covering the touched area,
 * by stem/path affinity. Candidates are every *.test.ts under repoRoot/test
 * (recursive); entry = path relative to test/. Affinity per test file, max
 * over touched files: 2 if the touched file's basename stem appears in the
 * test file's name; else 1 if any ≥3-char directory segment of a touched
 * file's dirname appears in the test file's relative path; else 0. Ranked
 * score-descending, tie-break lexicographic ascending. A repo without a
 * test/ directory yields an empty section. */
function selectTestCandidates(repoRoot: string, card: ParsedCard): string[] {
	const base = path.join(repoRoot, "test");
	if (!fs.existsSync(base)) return [];
	const files: { rel: string; file: string }[] = [];
	const walk = (dir: string, rel: string): void => {
		let items: fs.Dirent[];
		try {
			items = fs.readdirSync(dir, { withFileTypes: true });
		} catch {
			return;
		}
		for (const e of items) {
			const relPath = rel ? `${rel}/${e.name}` : e.name;
			if (e.isDirectory()) walk(path.join(dir, e.name), relPath);
			else if (e.isFile() && e.name.endsWith(".test.ts")) files.push({ rel: relPath, file: path.join(dir, e.name) });
		}
	};
	walk(base, "");
	const stems = card.touchedFiles.map((t) => {
		const base2 = path.basename(t.path);
		const dot = base2.lastIndexOf(".");
		return dot > 0 ? base2.slice(0, dot) : base2;
	});
	const segments = card.touchedFiles
		.flatMap((t) => path.dirname(t.path).split(/[\\/]/))
		.filter((s) => s.length >= 3);
	const scoreOf = (rel: string, name: string): number => {
		const lowerRel = rel.toLowerCase();
		if (stems.some((s) => s.length >= 3 && name.toLowerCase().includes(s.toLowerCase()))) return 2;
		if (segments.some((s) => lowerRel.includes(s.toLowerCase()))) return 1;
		return 0;
	};
	return files
		.map((f) => ({ rel: f.rel, score: scoreOf(f.rel, path.basename(f.rel)) }))
		.sort((a, b) => (a.score !== b.score ? b.score - a.score : pathCompare(a.rel, b.rel)))
		.map((f) => f.rel);
}
