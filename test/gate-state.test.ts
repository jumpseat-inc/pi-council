import { test, expect } from "bun:test";
import { createHash } from "node:crypto";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { CONFIG_DIR_NAME } from "@earendil-works/pi-coding-agent";
import { buildGateState, estimateTokens, GATE_SECTIONS } from "../extensions/gate-state.ts";
import type { ParsedCard } from "../extensions/gate-state.ts";

/** Synthetic repo tree: a repo-local gate policy carrying a large valid
 * budget (the budget never binds unless a test overrides it). Never the
 * real repo. */
export function tmpRepo(extraPolicy: Record<string, unknown> = {}): string {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "council-gate-state-"));
	const dir = path.join(root, CONFIG_DIR_NAME, "council", "gate");
	fs.mkdirSync(dir, { recursive: true });
	fs.writeFileSync(
		path.join(dir, "policy.json"),
		JSON.stringify({
			policyVersion: "p",
			mode: "off",
			model: "m",
			endpoint: "https://x/",
			gateStateBudgetTokens: 1000000,
			...extraPolicy,
		}),
	);
	return root;
}

export function makeCard(overrides: Partial<ParsedCard> = {}): ParsedCard {
	return {
		id: "EV-0",
		title: "Fix the gate packer",
		goal: "Pack gate state deterministically under budget",
		acceptance: "bytes identical across calls and drops recorded",
		touchedFiles: [{ path: "extensions/gate.ts", linesChanged: 12 }],
		...overrides,
	};
}

const parseState = (bytes: Uint8Array): Record<string, unknown> =>
	JSON.parse(Buffer.from(bytes).toString("utf8")) as Record<string, unknown>;

// ---------------------------------------------------------------------------
// Estimator (§4) — pinned by recompute, byte-based.
// ---------------------------------------------------------------------------

test("estimator is pinned by recompute: ceil(utf8 bytes / 3.5)", () => {
	expect(estimateTokens("hello")).toBe(2); // ceil(5 / 3.5)
	expect(estimateTokens("")).toBe(0);
	expect(estimateTokens(new TextEncoder().encode("hello"))).toBe(2);
});

test("CJK divergence fixture: the measure is byte-based, not char-based", () => {
	// 龘 is 3 UTF-8 bytes; 3 chars = 9 bytes → ceil(9/3.5) = 3 tokens.
	// A chars/4 estimator would say 1 — the byte-based measure per §4.
	expect(estimateTokens("龘".repeat(3))).toBe(3);
});

// ---------------------------------------------------------------------------
// Frame, card + touchedFiles packing (§2, §3, §7).
// ---------------------------------------------------------------------------

test("pack shape: five sections in declared order, card + sorted touchedFiles filled", () => {
	const root = tmpRepo();
	const state = buildGateState(
		makeCard({
			touchedFiles: [
				{ path: "extensions/gate.ts", linesChanged: 12 },
				{ path: "council/preflight.sh", linesChanged: 3 },
				{ path: "extensions/gate-state.ts", linesChanged: 400 },
			],
		}),
		root,
	);
	const parsed = parseState(state.stateBytes);
	expect(Object.keys(parsed)).toEqual([...GATE_SECTIONS]);
	expect(parsed.card).toEqual({ id: "EV-0", title: "Fix the gate packer", goal: "Pack gate state deterministically under budget", acceptance: "bytes identical across calls and drops recorded" });
	expect(parsed.touchedFiles).toEqual([
		{ path: "council/preflight.sh", linesChanged: 3 },
		{ path: "extensions/gate-state.ts", linesChanged: 400 },
		{ path: "extensions/gate.ts", linesChanged: 12 },
	]);
	expect(parsed.wiki).toEqual([]);
	expect(parsed.rulings).toEqual([]);
	expect(parsed.tests).toEqual([]);
	expect(estimateTokens(state.stateBytes)).toBeLessThanOrEqual(1000000);
});

test("byte/hash identity across repeated calls on a fixed tree", () => {
	const root = tmpRepo();
	const a = buildGateState(makeCard(), root);
	const b = buildGateState(makeCard(), root);
	expect(Buffer.compare(Buffer.from(a.stateBytes), Buffer.from(b.stateBytes))).toBe(0);
	expect(a.stateHash).toBe(b.stateHash);
});

test("hash single source: independent sha256 recompute equals the returned stateHash", () => {
	const root = tmpRepo();
	const state = buildGateState(makeCard(), root);
	expect(createHash("sha256").update(state.stateBytes).digest("hex")).toBe(state.stateHash);
});

test("touched-file canary: file contents never enter the state bytes; entries carry only path + linesChanged", () => {
	const root = tmpRepo();
	fs.mkdirSync(path.join(root, "extensions"), { recursive: true });
	fs.writeFileSync(path.join(root, "extensions", "gate.ts"), "// SENTRY-CONTENT-7f3a secrets live here\nexport {};\n");
	const state = buildGateState(makeCard({ touchedFiles: [{ path: "extensions/gate.ts", linesChanged: 2 }] }), root);
	const text = Buffer.from(state.stateBytes).toString("utf8");
	expect(text).not.toContain("SENTRY-CONTENT-7f3a");
	const parsed = parseState(state.stateBytes);
	expect(parsed.touchedFiles).toEqual([{ path: "extensions/gate.ts", linesChanged: 2 }]);
});

test("touched-file validation is loud and named: linesChanged must be a positive integer", () => {
	const root = tmpRepo();
	for (const bad of [0, -3, 1.5, "3", null]) {
		let msg = "";
		try {
			buildGateState(makeCard({ touchedFiles: [{ path: "extensions/gate.ts", linesChanged: bad as number }] }), root);
		} catch (e) {
			msg = (e as Error).message;
		}
		expect(msg).toContain("touchedFiles[0].linesChanged");
		expect(msg).not.toMatch(/\n/);
	}
});

test("touched-file validation is loud and named: path must be a non-empty string", () => {
	const root = tmpRepo();
	let msg = "";
	try {
		buildGateState(makeCard({ touchedFiles: [{ path: "  ", linesChanged: 1 }] }), root);
	} catch (e) {
		msg = (e as Error).message;
	}
	expect(msg).toContain("touchedFiles[0].path");
	expect(msg).not.toMatch(/\n/);
});

test("degenerate case: an over-budget card section truncates per field and stays non-empty; later sections are untouched", () => {
	const root = tmpRepo();
	const state = buildGateState(
		makeCard({ id: "EV-0", title: "t", goal: "G".repeat(40000) }), // ~11.4k tokens, over the 4000 card cap
		root,
	);
	const parsed = parseState(state.stateBytes);
	expect(parsed.card).toEqual({ id: "EV-0", title: "t" }); // field granularity, non-empty
	expect(state.drops[0]).toMatchObject({ section: "card", truncated: "cap", kept: 2 });
	expect(state.drops.find((d) => d.section === "touchedFiles")).toMatchObject({ truncated: false, kept: 1 });
	expect(parsed.touchedFiles).toEqual([{ path: "extensions/gate.ts", linesChanged: 12 }]);
	expect(estimateTokens(state.stateBytes)).toBeLessThanOrEqual(1000000);
});

// ---------------------------------------------------------------------------
// Wiki section (§5) — deterministic matcher, exclusions, doc-to-page map.
// ---------------------------------------------------------------------------

/** Flat-frontmatter wiki page fixture. */
function wikiPage(root: string, rel: string, fm: Record<string, string>, body = ""): void {
	const file = path.join(root, "vault", "wiki", rel);
	fs.mkdirSync(path.dirname(file), { recursive: true });
	const lines = Object.entries(fm).map(([k, v]) => `${k}: ${v}`);
	fs.writeFileSync(file, `---\n${lines.join("\n")}\n---\n${body}`);
}

const WIKI_CARD = (overrides: Partial<ParsedCard> = {}) =>
	makeCard({
		title: "Fix the gate packer",
		goal: "Pack gate state deterministically under budget",
		acceptance: "bytes identical across calls and drops recorded",
		...overrides,
	});

test("wiki selection is deterministic: two calls, byte-identical state and hash", () => {
	const root = tmpRepo();
	for (const name of ["gate-parity-fixture", "unrelated-beta", "smoke-fixture", "council-loop-fixture", "budget-note", "misc-page"]) {
		wikiPage(root, `${name}.md`, {
			title: `Fixture ${name}`,
			summary: name === "gate-parity-fixture" ? "about gate packing under budget" : "nothing relevant here",
			aliases: name === "gate-parity-fixture" ? "[gate packer]" : "[]",
			tags: "[pi-council/concept]",
		});
	}
	const a = buildGateState(WIKI_CARD(), root);
	const b = buildGateState(WIKI_CARD(), root);
	expect(Buffer.compare(Buffer.from(a.stateBytes), Buffer.from(b.stateBytes))).toBe(0);
	expect(a.stateHash).toBe(b.stateHash);
	const parsed = parseState(a.stateBytes);
	expect((parsed.wiki as { slug: string }[]).map((p) => p.slug)).toContain("gate-parity-fixture");
});

test("exclusions as tested rules: index.md and sources/** never appear in the wiki section", () => {
	const root = tmpRepo();
	// Both exclusion-class pages outscore the ordinary page on the card terms.
	wikiPage(root, "index.md", { title: "Gate Fixture Index", summary: "gate gate gate master catalog" });
	wikiPage(root, "sources/2026-09-20-po-gate-ruling.md", {
		title: "Gate Ruling Source",
		summary: "gate ruling with sources",
		tags: "[pi-council/ruling]",
	});
	wikiPage(root, "ordinary-page.md", { title: "Ordinary", summary: "mentions gate once", tags: "[pi-council/concept]" });
	const parsed = parseState(buildGateState(WIKI_CARD(), root).stateBytes);
	const slugs = (parsed.wiki as { slug: string }[]).map((p) => p.slug);
	expect(slugs).toContain("ordinary-page");
	expect(slugs).not.toContain("index");
	expect(slugs.some((s) => s.startsWith("sources/"))).toBe(false);
});

test("wiki entries carry exactly { slug, title, summary, aliases }", () => {
	const root = tmpRepo();
	wikiPage(root, "shaped-page.md", {
		title: "Shaped",
		summary: "a gate page",
		aliases: "[shaped gate]",
		tags: "[pi-council/concept]",
	});
	const parsed = parseState(buildGateState(WIKI_CARD(), root).stateBytes);
	const entry = (parsed.wiki as Record<string, unknown>[])[0];
	expect(Object.keys(entry).sort()).toEqual(["aliases", "slug", "summary", "title"]);
	expect(entry.slug).toBe("shaped-page");
});

test("wiki selection is fill-to-cap in score order with lexicographic tie-break", () => {
	const root = tmpRepo();
	// 14 equal-score pages with ~340-token summaries each: the 4000-token wiki
	// cap keeps only the lexicographically-first prefix that fits.
	for (let i = 0; i < 14; i++) {
		const name = `page-${String(i).padStart(2, "0")}`;
		wikiPage(root, `${name}.md`, {
			title: `Fixture ${name}`,
			summary: `about gate ${"filler ".repeat(160)}`,
			tags: "[pi-council/concept]",
		});
	}
	const state = buildGateState(WIKI_CARD(), root);
	const parsed = parseState(state.stateBytes);
	const wiki = parsed.wiki as { slug: string }[];
	// The kept set is exactly the lexicographic prefix that fits the cap.
	expect(wiki.length).toBeGreaterThan(0);
	expect(wiki.length).toBeLessThan(14);
	for (let i = 0; i < wiki.length; i++) {
		expect(wiki[i].slug).toBe(`page-${String(i).padStart(2, "0")}`);
	}
	const cap = 4000;
	const nextName = `page-${String(wiki.length).padStart(2, "0")}`;
	const nextEntry = { slug: nextName, title: `Fixture ${nextName}`, summary: `about gate ${"filler ".repeat(160)}`, aliases: [] };
	expect(estimateTokens(JSON.stringify(wiki))).toBeLessThanOrEqual(cap);
	expect(estimateTokens(JSON.stringify([...wiki, nextEntry]))).toBeGreaterThan(cap);
	const drops = state.drops.find((d) => d.section === "wiki");
	expect(drops).toMatchObject({ truncated: "cap" });
});

test("doc-to-page map: a live-tree path reference outscores a ghost path and a plain page", () => {
	const root = tmpRepo();
	fs.mkdirSync(path.join(root, "docs"), { recursive: true });
	fs.mkdirSync(path.join(root, "extensions"), { recursive: true });
	fs.writeFileSync(path.join(root, "extensions", "gate.ts"), "export {};\n"); // live path
	wikiPage(root, "page-b-live.md", { title: "Fixture B", summary: "about gate" }, "see extensions/gate.ts for details\n");
	wikiPage(root, "page-a-plain.md", { title: "Fixture A", summary: "about gate" }, "no references at all\n");
	wikiPage(root, "page-c-ghost.md", { title: "Fixture C", summary: "about gate" }, "see docs/ghost.ts nowhere\n");
	const parsed = parseState(buildGateState(WIKI_CARD(), root).stateBytes);
	const slugs = (parsed.wiki as { slug: string }[]).map((p) => p.slug);
	// page-b-live: +2 for the live path → first. page-a-plain and page-c-ghost
	// tie at the summary-only score → lexicographic (plain before ghost).
	expect(slugs).toEqual(["page-b-live", "page-a-plain", "page-c-ghost"]);
});

// ---------------------------------------------------------------------------
// Rulings section (§6) — scorer-then-date ordering over ruling-tagged
// sources/ pages.
// ---------------------------------------------------------------------------

const RULINGS_TREE = () => {
	const root = tmpRepo();
	// A selected wiki page tagged epic9 (term-matched, so it is a candidate).
	wikiPage(root, "epic9-page.md", { title: "Epic9 Fixture", summary: "about gate work", tags: "[pi-council/concept, pi-council/epic9]" });
	// Older term-matched ruling (epic5).
	const oldRuling = path.join(root, "vault", "wiki", "sources", "r-old-ruling.md");
	fs.mkdirSync(path.dirname(oldRuling), { recursive: true });
	fs.writeFileSync(
		oldRuling,
		"---\ntitle: Gate Ruling Old\nsummary: gate packing rules for the packer\naliases: [gate ruling]\ntags: [pi-council/ruling, pi-council/epic5]\ncreated: 2026-09-01\nupdated: 2026-09-01\n---\nbody\n",
	);
	// Newer tag-only ruling (epic9): relevant only via the shared tag leaf.
	const newRuling = path.join(root, "vault", "wiki", "sources", "r-new-ruling.md");
	fs.writeFileSync(
		newRuling,
		"---\ntitle: Unrelated Ruling New\nsummary: entirely unrelated words here\ntags: [pi-council/ruling, pi-council/epic9]\ncreated: 2026-09-20\nupdated: 2026-09-20\n---\nbody\n",
	);
	return root;
};

test("ruling ordering red/green: a term-matched older ruling outranks a tag-only newer one", () => {
	const parsed = parseState(buildGateState(WIKI_CARD(), RULINGS_TREE()).stateBytes);
	const slugs = (parsed.rulings as { slug: string }[]).map((r) => r.slug);
	expect(slugs).toEqual(["sources/r-old-ruling", "sources/r-new-ruling"]);
});

test("ruling candidates: only sources/ pages tagged pi-council/ruling; others never appear", () => {
	const root = RULINGS_TREE();
	// Term-matched source page WITHOUT the ruling tag.
	wikiPage(root, "sources/plain-source.md", { title: "Plain Source Gate", summary: "gate words", tags: "[pi-council/source]" });
	// Ruling-tagged page OUTSIDE sources/ (may appear in the wiki section, never in rulings).
	wikiPage(root, "rogue-ruling.md", { title: "Rogue Gate Ruling", summary: "gate words", tags: "[pi-council/ruling]" });
	const parsed = parseState(buildGateState(WIKI_CARD(), root).stateBytes);
	const rulingSlugs = (parsed.rulings as { slug: string }[]).map((r) => r.slug);
	expect(rulingSlugs).not.toContain("sources/plain-source");
	expect(rulingSlugs).not.toContain("rogue-ruling");
	expect(rulingSlugs).toContain("sources/r-old-ruling");
});

test("ruling relevance: no shared tag leaf and no term match ⇒ absent; term match alone admits one", () => {
	const root = RULINGS_TREE();
	// Shares nothing with any selected wiki page and matches no card term.
	const stranger = path.join(root, "vault", "wiki", "sources", "r-stranger.md");
	fs.writeFileSync(
		stranger,
		"---\ntitle: Stranger Ruling\nsummary: quantum ferrofluids unsui tabled\ntags: [pi-council/ruling, pi-council/epic4]\nupdated: 2026-09-20\n---\nbody\n",
	);
	// Term match alone (no shared tag leaf) — admitted via aliases.
	const termOnly = path.join(root, "vault", "wiki", "sources", "r-term-only.md");
	fs.writeFileSync(
		termOnly,
		"---\ntitle: Term Only Ruling\nsummary: about gate matters\ntags: [pi-council/ruling, pi-council/epic3]\nupdated: 2026-09-20\n---\nbody\n",
	);
	const parsed = parseState(buildGateState(WIKI_CARD({ title: "gate budget" }), root).stateBytes);
	const slugs = (parsed.rulings as { slug: string }[]).map((r) => r.slug);
	expect(slugs).not.toContain("sources/r-stranger");
	expect(slugs).toContain("sources/r-term-only");
});

test("ruling shape and date: { slug, date, title, summary } with updated (fallback created)", () => {
	const parsed = parseState(buildGateState(WIKI_CARD(), RULINGS_TREE()).stateBytes);
	const entry = (parsed.rulings as Record<string, unknown>[])[0];
	expect(Object.keys(entry).sort()).toEqual(["date", "slug", "summary", "title"]);
	expect(entry.date).toBe("2026-09-01");
});

test("ruling date tie-break: equal scores order by date descending", () => {
	const root = tmpRepo();
	wikiPage(root, "epic7-page.md", { title: "Epic7 Fixture", summary: "about gate work", tags: "[pi-council/epic7]" });
	for (const [name, date] of [
		["r-late.md", "2026-09-20"],
		["r-early.md", "2026-09-01"],
	] as const) {
		const f = path.join(root, "vault", "wiki", "sources", name);
		fs.mkdirSync(path.dirname(f), { recursive: true });
		fs.writeFileSync(f, `---\ntitle: Tie Ruling ${date}\nsummary: unrelated words\ntags: [pi-council/ruling, pi-council/epic7]\nupdated: ${date}\n---\nbody\n`);
	}
	const parsed = parseState(buildGateState(WIKI_CARD(), root).stateBytes);
	expect((parsed.rulings as { slug: string }[]).map((r) => r.slug)).toEqual(["sources/r-late", "sources/r-early"]);
});

// ---------------------------------------------------------------------------
// Tests section (§3 table row 5) — covering test names by stem/path affinity.
// ---------------------------------------------------------------------------

test("tests section: stem affinity outranks path affinity; ties break lexicographically", () => {
	const root = tmpRepo();
	const t = (rel: string) => {
		const f = path.join(root, "test", rel);
		fs.mkdirSync(path.dirname(f), { recursive: true });
		fs.writeFileSync(f, "test(\"x\", () => {});\n");
	};
	t("gate.test.ts"); // stem match with touched extensions/gate.ts → 2
	t("other.test.ts"); // no affinity → 0... but it must still be a candidate; entries ranked, packer fills
	t("mcp/deep.test.ts"); // path segment affinity only if a touched dir segment matches
	const parsed = parseState(
		buildGateState(
			makeCard({ touchedFiles: [{ path: "extensions/gate.ts", linesChanged: 12 }] }),
			root,
		).stateBytes,
	);
	const tests = parsed.tests as string[];
	expect(tests[0]).toBe("gate.test.ts");
	expect(tests).toContain("mcp/deep.test.ts"); // "extensions" ∉ path → score 0 but still ranked
	expect(tests).toContain("other.test.ts");
	// score-0 ties break lexicographically: deep.test.ts < other.test.ts
	expect(tests.indexOf("mcp/deep.test.ts")).toBeLessThan(tests.indexOf("other.test.ts"));
});

test("tests section: path-affinity scores 1 and ranks between stem match and no match", () => {
	const root = tmpRepo();
	const t = (rel: string) => {
		const f = path.join(root, "test", rel);
		fs.mkdirSync(path.dirname(f), { recursive: true });
		fs.writeFileSync(f, "test(\"x\", () => {});\n");
	};
	t("gate.test.ts"); // stem "gate" → 2
	t("extensions-probe.test.ts"); // touched dirname segment "extensions" in rel path → 1
	t("zzz.test.ts"); // → 0
	const parsed = parseState(
		buildGateState(
			makeCard({ touchedFiles: [{ path: "extensions/gate.ts", linesChanged: 12 }] }),
			root,
		).stateBytes,
	);
	expect(parsed.tests as string[]).toEqual(["gate.test.ts", "extensions-probe.test.ts", "zzz.test.ts"]);
});

test("tests section: absent test/ directory yields an empty section without crashing", () => {
	const parsed = parseState(buildGateState(makeCard(), tmpRepo()).stateBytes);
	expect(parsed.tests).toEqual([]);
});

// ---------------------------------------------------------------------------
// Budget binding and the drop rule (§7, O7) — the card's demanded tests.
// ---------------------------------------------------------------------------

/** Fixture with an oversized rulings section: `n` ruling-tagged sources
 * pages, each summary ~357 measured tokens. */
function rulingsFixture(policy: Record<string, unknown>): string {
	const root = tmpRepo(policy);
	wikiPage(root, "epic9-page.md", { title: "Epic9 Fixture", summary: "about gate work", tags: "[pi-council/epic9]" });
	const t = (rel: string) => {
		const f = path.join(root, "test", rel);
		fs.mkdirSync(path.dirname(f), { recursive: true });
		fs.writeFileSync(f, "test(\"x\", () => {});\n");
	};
	t("gate.test.ts");
	t("other.test.ts");
	for (let i = 0; i < 30; i++) {
		const f = path.join(root, "vault", "wiki", "sources", `r-${String(i).padStart(2, "0")}.md`);
		fs.mkdirSync(path.dirname(f), { recursive: true });
		fs.writeFileSync(
			f,
			`---\ntitle: Ruling ${i}\nsummary: gate ${"filler ".repeat(160)}\ntags: [pi-council/ruling, pi-council/epic9]\nupdated: 2026-09-20\n---\nbody\n`,
		);
	}
	return root;
}

test("oversized recent-rulings tail-drop: earlier sections byte-identical to the untruncated pack, drop recorded", () => {
	const root = rulingsFixture({ gateStateBudgetTokens: 6000 }); // below the 19000 cap sum
	const truncated = buildGateState(WIKI_CARD(), root);
	const full = buildGateState(WIKI_CARD(), rulingsFixture({ gateStateBudgetTokens: 1000000 }));
	const t = parseState(truncated.stateBytes);
	const f = parseState(full.stateBytes);
	// Earlier sections byte-identical (canonical re-serialization of parsed sections).
	expect(JSON.stringify(t.card)).toBe(JSON.stringify(f.card));
	expect(JSON.stringify(t.touchedFiles)).toBe(JSON.stringify(f.touchedFiles));
	expect(JSON.stringify(t.wiki)).toBe(JSON.stringify(f.wiki));
	const rulingDrops = truncated.drops.find((d) => d.section === "rulings");
	expect(rulingDrops).toMatchObject({ truncated: "budget" });
	expect((t.rulings as unknown[]).length).toBe((rulingDrops as { kept: number }).kept);
	expect((f.rulings as unknown[]).length).toBeGreaterThan((t.rulings as unknown[]).length);
	// Tail rule: the section after the budget cut is dropped entirely.
	expect(truncated.drops.find((d) => d.section === "tests")).toMatchObject({ truncated: "budget", kept: 0 });
	expect(t.tests).toEqual([]);
	expect(estimateTokens(truncated.stateBytes)).toBeLessThanOrEqual(6000);
});

test("budget-only change moves the cut, never the prefix", () => {
	const root = rulingsFixture({ gateStateBudgetTokens: 4000 });
	const low = buildGateState(WIKI_CARD(), rulingsFixture({ gateStateBudgetTokens: 4000 }));
	const mid = buildGateState(WIKI_CARD(), rulingsFixture({ gateStateBudgetTokens: 6000 }));
	const lt = parseState(low.stateBytes);
	const mt = parseState(mid.stateBytes);
	expect(JSON.stringify(lt.card)).toBe(JSON.stringify(mt.card));
	expect(JSON.stringify(lt.touchedFiles)).toBe(JSON.stringify(mt.touchedFiles));
	expect(JSON.stringify(lt.wiki)).toBe(JSON.stringify(mt.wiki));
	expect((mt.rulings as unknown[]).length).toBeGreaterThan((lt.rulings as unknown[]).length);
});

test("drop-shape sufficiency: present bytes reconstruct from the drop record + declared section tuple", () => {
	const truncated = buildGateState(WIKI_CARD(), rulingsFixture({ gateStateBudgetTokens: 6000 }));
	const full = parseState(buildGateState(WIKI_CARD(), rulingsFixture({ gateStateBudgetTokens: 1000000 })).stateBytes);
	expect(truncated.drops.map((d) => d.section)).toEqual([...GATE_SECTIONS]);
	const pick = (section: string, kept: number): unknown => {
		const value = full[section];
		if (section === "card") {
			const o: Record<string, unknown> = {};
			for (const [k, v] of Object.entries(value as Record<string, unknown>).slice(0, kept)) o[k] = v;
			return o;
		}
		return (value as unknown[]).slice(0, kept);
	};
	const reconstructed: Record<string, unknown> = {};
	for (const [i, s] of [...GATE_SECTIONS].entries()) reconstructed[s] = pick(s, truncated.drops[i].kept);
	expect(Buffer.from(truncated.stateBytes).toString("utf8")).toBe(JSON.stringify(reconstructed));
});

test("cap-trim and budget-drop are distinguishable mechanisms in the same pack", () => {
	// wiki oversized over its 4000 cap (cap-trim) + budget 6000 cutting rulings (budget-drop).
	const root = rulingsFixture({ gateStateBudgetTokens: 6000 });
	// Inflate one wiki page so the wiki section alone exceeds its cap.
	const f = path.join(root, "vault", "wiki", "big-page.md");
	fs.writeFileSync(f, `---\ntitle: Big Fixture Gate\nsummary: gate ${"filler ".repeat(2100)}\ntags: [pi-council/epic9]\n---\nbody\n`);
	const state = buildGateState(WIKI_CARD(), root);
	const wikiDrop = state.drops.find((d) => d.section === "wiki");
	const rulingDrop = state.drops.find((d) => d.section === "rulings");
	const testDrop = state.drops.find((d) => d.section === "tests");
	expect(wikiDrop).toMatchObject({ truncated: "cap" });
	expect(rulingDrop).toMatchObject({ truncated: "budget" });
	expect(testDrop).toMatchObject({ truncated: "budget", kept: 0 });
});

test("pathological all-over-cap fixture: everything dropped, state still within budget, card named first", () => {
	const root = tmpRepo({ gateStateBudgetTokens: 32000 });
	// Every candidate entry alone exceeds its section cap.
	wikiPage(root, "huge-wiki.md", { title: "Huge", summary: `gate ${"filler ".repeat(2100)}`, tags: "[pi-council/epic9]" }); // > 4000 tokens
	const f = path.join(root, "vault", "wiki", "sources", "huge-ruling.md");
	fs.mkdirSync(path.dirname(f), { recursive: true });
	fs.writeFileSync(f, `---\ntitle: Huge Ruling\nsummary: gate ${"filler ".repeat(4100)}\ntags: [pi-council/ruling, pi-council/epic9]\nupdated: 2026-09-20\n---\nbody\n`); // > 8000 tokens
	const card = makeCard({
		id: "E".repeat(16000), // > 4000 tokens alone
		title: "gate",
		goal: "g",
		acceptance: "a",
		touchedFiles: [{ path: "x/".repeat(3600) + "a.ts", linesChanged: 1 }], // > 2000 tokens
	});
	const state = buildGateState(card, root);
	expect(estimateTokens(state.stateBytes)).toBeLessThanOrEqual(32000);
	const parsed = parseState(state.stateBytes);
	expect(parsed.card).toEqual({});
	expect(parsed.touchedFiles).toEqual([]);
	expect(parsed.wiki).toEqual([]);
	expect(parsed.rulings).toEqual([]);
	expect(state.drops[0]).toMatchObject({ section: "card", truncated: "cap", kept: 0 });
	for (const d of state.drops.slice(0, 4)) expect(d).toMatchObject({ truncated: "cap", kept: 0 });
});

test("packer fails loud when the resolved policy omits gateStateBudgetTokens — never assumes a default", () => {
	const root = tmpRepo();
	const file = path.join(root, CONFIG_DIR_NAME, "council", "gate", "policy.json");
	fs.writeFileSync(file, JSON.stringify({ policyVersion: "p", mode: "off", model: "m", endpoint: "https://x/" }));
	let msg = "";
	try {
		buildGateState(makeCard(), root);
	} catch (e) {
		msg = (e as Error).message;
	}
	expect(msg).toBe(
		`FAIL: ${file} has an invalid gateStateBudgetTokens — the key is absent — packing needs a positive integer token budget (an off-mode policy may omit it, but then no gate state is ever built) — set a valid value`,
	);
	expect(msg).not.toMatch(/32000/);
	expect(msg).not.toMatch(/remove the key/);
});

test("frame guard: a budget below the empty frame's measure fails loud, never silently over-budget", () => {
	const root = tmpRepo({ gateStateBudgetTokens: 1 });
	let msg = "";
	try {
		buildGateState(makeCard(), root);
	} catch (e) {
		msg = (e as Error).message;
	}
	expect(msg).toMatch(/frame alone measures \d+ tokens, exceeding the gateStateBudgetTokens budget 1/);
	expect(msg).not.toMatch(/\n/);
});
