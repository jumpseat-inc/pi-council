// FLLWUP-25 — wiki source page matches AGENTS.md hard-conventions count
// (spec: docs/superpowers/specs/2026-09-06-FLLWUP-25-design.md; rulings
// R-1 heading format, R-2 sources disposition on the card face).
//
// Pure, test-local consistency check: the page's hard-conventions section
// must mirror AGENTS.md's own conventions section (ordered labels + exact
// bold leads) and the stated count (page-body bold phrase, frontmatter
// summary word, index.md digit) must equal the runtime-derived count. No
// hardcoded 13/15 anywhere — both sides are derived from disk-read text.
// Red-honesty is in-memory string mutations only; real files are never
// written.
import { expect, test } from "bun:test";
import * as fs from "node:fs";
import * as path from "node:path";

const REPO_ROOT = process.cwd();

/** Both texts are sliced at their `## Hard conventions` heading (R-1:
 *  symmetric slice anchors; the page's heading is verbatim, no count word). */
const HEADING = /^## Hard conventions$/m;

/** The shipped parser: leading-whitespace tolerant (` 10.`, ` 9.6.` in
 *  AGENTS.md), decimal labels (`9.5.`), bold-lead capture spanning
 *  newlines (`[^*]+` includes `\n`; the 9.5/9.6/13 bolds are multi-line). */
const TOKEN = /^[ \t]*(\d+(?:\.\d+)?)\.\s+\*\*([^*]+)\*\*/gm;

/** Strict variant — same parser minus the leading-whitespace tolerance.
 *  Must demonstrably undercount the real file (parser-trap check, T-E). */
const STRICT_TOKEN = /^(\d+(?:\.\d+)?)\.\s+\*\*([^*]+)\*\*/gm;

/** Independent scalar reference: one match per marker line (multi-line bolds
 *  still match on their opening line). Shares no code with the parser, so an
 *  agreement between the two is a fidelity check, not a tautology. */
const MARKER_LINE = /^[ \t]*\d+(?:\.\d+)?\.[ \t]+\*\*/gm;

export interface Token {
	label: string;
	lead: string;
}

export interface Finding {
	site: string;
	detail: string;
}

export function sliceConventions(text: string): string {
	const head = text.match(HEADING);
	if (!head) throw new Error("FLLWUP-25: missing `## Hard conventions` heading");
	const start = head.index ?? 0;
	const rest = text.slice(start);
	const next = rest.match(/\n## /);
	return next ? rest.slice(0, next.index) : rest;
}

export function parseTokens(slice: string): Token[] {
	const out: Token[] = [];
	for (const m of slice.matchAll(TOKEN)) out.push({ label: m[1]!, lead: m[2]! });
	return out;
}

/** Whitespace-collapsed bold lead (exact-lead policy). */
export function normalizeLead(lead: string): string {
	return lead.replace(/\s+/g, " ").trim();
}

const WORD_TO_NUMBER: Record<string, number> = {
	one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8,
	nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14,
	fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19,
	twenty: 20,
};

/** "twelve"→12, "thirteen"→13, "13"→13; anything else → null. */
export function normalizeCountToken(token: string): number | null {
	if (/^\d+$/.test(token)) return parseInt(token, 10);
	const word = token.toLowerCase().replace(/[^a-z]/g, "");
	return WORD_TO_NUMBER[word] ?? null;
}

/** Derived count = number of *integer* top-level labels in the file slice. */
export function derivedCount(tokens: Token[]): number {
	return tokens.filter((t) => !t.label.includes(".")).length;
}

/** (a) ordered label equality, (b) per-label normalized bold-lead equality,
 *  (c) the two page-embedded stated-count sites (intro bold phrase +
 *  frontmatter summary word) == derived count. The index.md site is
 *  asserted separately via `indexCountMatches` (three sites in total). */
export function diffConventions(agentsText: string, pageText: string): Finding[] {
	const fileTokens = parseTokens(sliceConventions(agentsText));
	const pageTokens = parseTokens(sliceConventions(pageText));
	const count = derivedCount(fileTokens);
	const findings: Finding[] = [];

	const labels = (ts: Token[]) => ts.map((t) => t.label);
	if (JSON.stringify(labels(fileTokens)) !== JSON.stringify(labels(pageTokens))) {
		findings.push({
			site: "labels",
			detail: `file ${JSON.stringify(labels(fileTokens))} vs page ${JSON.stringify(labels(pageTokens))}`,
		});
	}

	const fileLeads = new Map(fileTokens.map((t) => [t.label, normalizeLead(t.lead)]));
	for (const t of pageTokens) {
		const want = fileLeads.get(t.label);
		if (want === undefined) continue; // absent/extra labels surface as a "labels" finding
		const got = normalizeLead(t.lead);
		if (want !== got) {
			findings.push({ site: `lead ${t.label}`, detail: `file "${want}" vs page "${got}"` });
		}
	}

	// Page-body site: the bold phrase `**thirteen hard conventions**`.
	const body = pageText.match(/\*\*([a-z]+)\s+hard conventions\*\*/i);
	if (!body) {
		findings.push({
			site: "page-body count token",
			detail: "no **<word> hard conventions** bold phrase",
		});
	} else {
		const n = normalizeCountToken(body[1]!);
		if (n !== count) {
			findings.push({ site: "page-body count token", detail: `"${body[1]}" (${n}) != derived ${count}` });
		}
	}

	// Frontmatter site: the summary's exact-one number-word token.
	const summary = pageText.match(/^summary:\s*(.+)$/m)?.[1];
	if (!summary) {
		findings.push({ site: "frontmatter summary", detail: "no summary line" });
	} else {
		const words = [...summary.matchAll(/\b([a-z]+)\b/gi)]
			.map((m) => m[1]!)
			.filter((w) => normalizeCountToken(w) !== null);
		if (words.length !== 1) {
			findings.push({
				site: "frontmatter summary",
				detail: `exactly one number-word expected, found ${words.length}: ${JSON.stringify(words)}`,
			});
		} else if (normalizeCountToken(words[0]!) !== count) {
			findings.push({ site: "frontmatter summary", detail: `"${words[0]}" != derived ${count}` });
		}
	}

	return findings;
}

/** index.md site: the [[2026-08-23-agents]] Sources line's sole integer
 *  (outside the wikilink, so the link's date digits can't collide) must
 *  equal the derived count. Returns null on match, else a named failure. */
export function indexCountMatches(indexText: string, count: number): string | null {
	const line = indexText.split("\n").find((l) => l.includes("[[2026-08-23-agents]]"));
	if (!line) return "no [[2026-08-23-agents]] line in index.md";
	const outside = line.replace(/\[\[[^\]]*\]\]/g, "");
	const ints = outside.match(/\d+/g) ?? [];
	if (ints.length !== 1) return `expected exactly one integer outside the link, found ${ints.length}`;
	return parseInt(ints[0]!, 10) === count ? null : `index integer ${ints[0]} != derived ${count}`;
}

/** Independent marker-line count (scalar; shares no parser code). */
export function referenceMarkerCount(slice: string): number {
	return slice.match(MARKER_LINE)?.length ?? 0;
}

/** Strict (no-whitespace-tolerance) marker count — the parser-trap variant. */
export function strictMarkerCount(slice: string): number {
	return slice.match(STRICT_TOKEN)?.length ?? 0;
}

function real() {
	return {
		agents: fs.readFileSync(path.join(REPO_ROOT, "AGENTS.md"), "utf8"),
		page: fs.readFileSync(path.join(REPO_ROOT, "vault", "wiki", "sources", "2026-08-23-agents.md"), "utf8"),
		index: fs.readFileSync(path.join(REPO_ROOT, "vault", "wiki", "index.md"), "utf8"),
	};
}

/** Substitute a function over the conventions section of a page text
 *  (in-memory only; used by the red-honesty cases). */
function mutateSection(pageText: string, fn: (section: string) => string): string {
	const head = pageText.match(HEADING);
	if (!head) throw new Error("no heading");
	const start = head.index ?? 0;
	const rest = pageText.slice(start);
	const next = rest.match(/\n## /);
	if (!next) throw new Error("no section after conventions");
	const end = start + (next.index ?? 0);
	return pageText.slice(0, start) + fn(rest.slice(0, next.index)) + pageText.slice(end);
}

test("T-A parser fidelity: the tolerant parser extracts every marker from real AGENTS.md with labels in order", () => {
	const { agents } = real();
	const slice = sliceConventions(agents);
	const tokens = parseTokens(slice);
	expect(tokens.length).toBeGreaterThan(0);
	// Two independent extractors agree: the shipped parser and the scalar
	// line-marker counter (15 today — asserted derivatively, never literally).
	expect(tokens.length).toBe(referenceMarkerCount(slice));
	// Integer labels are exactly 1..N, in order (N derived from the file).
	const intLabels = tokens.filter((t) => !t.label.includes(".")).map((t) => t.label);
	expect(intLabels).toEqual(intLabels.map((_, i) => String(i + 1)));
	// Decimal labels are parented and in ascending order (9.5/9.6 today).
	const decLabels = tokens.filter((t) => t.label.includes(".")).map((t) => t.label);
	for (const d of decLabels) expect(intLabels).toContain(d.split(".")[0]!);
	expect([...decLabels].sort()).toEqual(decLabels);
	// Whitespace-prefixed markers (` 9.6.`, ` 10.`) all parse to labels.
	const prefixed = slice.split("\n").filter((l) => /^[ \t]+\d+(?:\.\d+)?\./.test(l));
	expect(prefixed.length).toBeGreaterThan(0);
	for (const l of prefixed) {
		const lbl = l.match(/^[ \t]*(\d+(?:\.\d+)?)\./)![1]!;
		expect(tokens.some((t) => t.label === lbl)).toBe(true);
	}
	// Multi-line bold leads survived (the file's 13th token lead spans a newline).
	const last = tokens[tokens.length - 1]!;
	expect(last.lead).toContain("\n");
});

test("T-B green on the real pair: diffConventions(AGENTS.md, page) == [] and the index site matches", () => {
	const { agents, page, index } = real();
	expect(diffConventions(agents, page)).toEqual([]);
	const count = derivedCount(parseTokens(sliceConventions(agents)));
	expect(indexCountMatches(index, count)).toBeNull();
});

test("T-C red-honesty: each in-memory mutation of the real page yields a named finding", () => {
	const { agents, page } = real();

	// 1. drop item 13 → labels mismatch
	const case1 = mutateSection(page, (s) => s.replace(/13\. \*\*[\s\S]*$/m, ""));
	expect(diffConventions(agents, case1).some((f) => f.site === "labels")).toBe(true);

	// 2. renumber 9.5 → 10 → two 10s, no 9.5 → labels mismatch
	const case2 = mutateSection(page, (s) => s.replace(/^9\.5\. \*\*/m, "10. **"));
	expect(diffConventions(agents, case2).some((f) => f.site === "labels")).toBe(true);

	// 3. invert the item-1 lead → named lead-1 finding (the v0.14.0 class)
	const case3 = mutateSection(
		page,
		(s) => s.replace(/^1\. \*\*Seats are domain-neutral by design\.\*\*/m, "1. **Seats are opinionated on purpose.**"),
	);
	expect(diffConventions(agents, case3).some((f) => f.site === "lead 1")).toBe(true);

	// 4. swap 10/11 → labels mismatch
	const case4 = mutateSection(page, (s) => {
		const lines = s.split("\n");
		const i10 = lines.findIndex((l) => /^10\. /.test(l));
		const i11 = lines.findIndex((l) => /^11\. /.test(l));
		if (i10 < 0 || i11 < 0) throw new Error("10/11 not found");
		const tmp = lines[i10]!;
		lines[i10] = lines[i11]!;
		lines[i11] = tmp;
		return lines.join("\n");
	});
	expect(diffConventions(agents, case4).some((f) => f.site === "labels")).toBe(true);

	// 5. wrong count token: page bold sentence "twelve" → page-body site
	const case5 = page.replace(/\*\*thirteen hard conventions\*\*/, "**twelve hard conventions**");
	expect(diffConventions(agents, case5).some((f) => f.site === "page-body count token")).toBe(true);
});

test("T-D no-hardcode: a synthetic AGENTS.md + matching page with a 14th convention stay green with zero test edits", () => {
	const items = (count: number) =>
		Array.from({ length: count }, (_, i) => `${i + 1}. **Convention number ${i + 1}** — placeholder body.`);
	const scratchAgents = ["# AGENTS.md", "", "## Hard conventions", ...items(14), "", "## Commits", ""].join("\n");
	const scratchPage = [
		"---",
		"title: 2026-08-23 AGENTS.md",
		"type: source",
		"summary: The repo's agent-guidance file — the authoritative statement of the package's hard conventions (fourteen, incl. sub-entries).",
		"aliases: [agents guide]",
		"tags: [pi-council/source]",
		"provenance: repo-doc",
		"source_path: AGENTS.md",
		"source_commit: 2c5ec3b",
		"captured: 2026-09-06",
		"sources: []",
		"created: 2026-08-23",
		"updated: 2026-09-06",
		"---",
		"",
		"`AGENTS.md` names — critically — **fourteen hard conventions** that encode the product's deliberate constraints.",
		"",
		"## Hard conventions",
		...items(14),
		"",
		"## Related",
		"",
	].join("\n");
	expect(diffConventions(scratchAgents, scratchPage)).toEqual([]);
});

test("T-E parser trap: dropping the leading-whitespace tolerance demonstrably undercounts the real file", () => {
	const { agents } = real();
	const slice = sliceConventions(agents);
	const reference = referenceMarkerCount(slice);
	const strict = strictMarkerCount(slice);
	const prefixed = (slice.match(/^[ \t]+\d+(?:\.\d+)?\.[ \t]+\*\*/gm) ?? []).length;
	expect(prefixed).toBeGreaterThan(0);      // the trap seats exist
	expect(strict).toBeLessThan(reference);   // undercounts
	expect(strict).toBe(reference - prefixed); // by exactly the prefixed markers
});

test("T-F count-token normalization: words→numbers via the map, digits pass through", () => {
	expect(normalizeCountToken("twelve")).toBe(12);
	expect(normalizeCountToken("fourteen")).toBe(14);
	expect(normalizeCountToken("13")).toBe(13);
	expect(normalizeCountToken("forty")).toBeNull();
	expect(normalizeCountToken("13.5")).toBeNull();
});