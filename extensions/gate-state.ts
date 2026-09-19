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
				selectWikiCandidates(repoRoot, terms, docMap).map((p) => ({
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
			if (section === "wiki") selectedWikiTagLeaves = capFilled.flatMap((e) => tagLeaves(e.value as WikiCandidate));
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
// Selection stubs — filled by the matcher tasks (deterministic, no model,
// no network). See the design spec §5–§6.
// ---------------------------------------------------------------------------

interface WikiCandidate {
	slug: string;
	title: string;
	summary: string;
	aliases: string[];
	tags: string[];
}

function tagLeaves(page: WikiCandidate): string[] {
	return page.tags.map((t) => (t.includes("/") ? t.slice(t.lastIndexOf("/") + 1) : t));
}

function extractCardTerms(card: ParsedCard): string[] {
	return [];
}

type DocMap = Map<string, string[]>;

function deriveDocToPageMap(repoRoot: string): DocMap {
	return new Map();
}

function selectWikiCandidates(repoRoot: string, terms: string[], docMap: DocMap): WikiCandidate[] {
	return [];
}

interface RulingCandidate {
	slug: string;
	date: string;
	title: string;
	summary: string;
}

function selectRulingCandidates(
	repoRoot: string,
	terms: string[],
	docMap: DocMap,
	wikiTagLeaves: string[],
): RulingCandidate[] {
	return [];
}

function selectTestCandidates(repoRoot: string, card: ParsedCard): string[] {
	return [];
}
