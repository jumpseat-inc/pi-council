// EV-80 — the follow-up review's state packer (EPIC-10). Pure: it reads the
// repo tree and writes nothing, performs no network and no model call.
// Sibling to gate-state.ts (EV-64) with a forked pack loop: gate-state's loop
// carries a section-coupled wiki-tag-selection side effect, so no shared core
// is extracted — drift is contained by a cross-module parity test
// (test/ev80-followup-state.test.ts).
//
// What the follow-up decision is given is packed deliberately: thin state
// produces confident wrong answers rather than visible uncertainty. Three
// sections in a fixed declared order — the candidate's own text (actionable
// needs the candidate), every board entry (alreadyDone needs the board with
// state), and the run's other not-yet-drafted siblings (duplicate needs open
// cards + siblings) — each with its own token cap, filled greedily forward
// against the policy's gateStateBudgetTokens; an over-budget state is cut at
// the tail with the cut recorded, so a reader can tell a thin state from a
// full one.
//
// EV-80 is the FIRST engine reader of council/board.md. The board reader
// mirrors council/validate.py's board_columns exactly (strip-then-match, em
// dash U+2014 only, pre-header entries are column None → not packed) — the
// board grammar now exists twice (Python + TS) and parity is pinned by test.
//
// THE PAIR RULE (product-owner ruling Q2, 2026-09-21): the board and its
// cards are one resource; the cards dir is derived from `boardPath`, never
// from `repoRoot`.
import { createHash } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import { loadGatePolicy } from "./gate.ts";
import { estimateTokens, type ParsedCard } from "./gate-state.ts";
import { parseCardFile } from "./gate-route.ts";

/** Fixed declared section order — a pinned contract, like GATE_SECTIONS —
 * and per-section caps in measured tokens. Caps are NOT policy keys: they
 * are a fixed packing contract. Caps sum to 30,000, so a well-formed pack
 * fits without dropping under the packaged policy's budget. The board cap is
 * 22,000 (raised from 16,000 by the 2026-09-21 product-owner ruling Q1): at
 * the agreed entry shape the real board measures 16,277 tokens — the old cap
 * would tail-cut 11 real Done cards, exactly the entries `alreadyDone`
 * answers from. The kept entries carry real evidence; if the cap ever binds,
 * the sacrifice stays visible via the section's FollowupDropRecord. */
export const FOLLOWUP_SECTIONS = ["candidate", "board", "siblings"] as const;
export type FollowupSection = (typeof FOLLOWUP_SECTIONS)[number];
export const FOLLOWUP_SECTION_CAPS: Record<FollowupSection, number> = {
	candidate: 2000,
	board: 22000,
	siblings: 6000,
};

/** The follow-up candidate: the current card's identity + intent — and, with
 * the same shape, a sibling (the run's other not-yet-drafted candidates).
 * Fields are contract inputs: empty/whitespace fails loud, naming the field
 * (fail loud on contract inputs; repo-state drift is tolerated but made
 * visible via `sources`). */
export interface FollowupCandidate {
	title: string;
	goal: string;
}

/** One board entry: every entry in file order carries {id, title, state};
 * open entries (column ≠ "Done") additionally carry `goal` read from the
 * card file. Done entries carry EXACTLY {id, title, state} — pinned by test
 * so the shape cannot drift back to {id, state}. */
export interface FollowupBoardEntry {
	id: string;
	title: string;
	state: string;
	goal?: string;
}

/** One sibling entry: exactly {title, goal} — no `id` key. Title-as-id is
 * settled: no stable identity exists for a draft-time artifact, and an
 * invented id field would be a fabricated ambient input. EV-82 owns target
 * resolution (board-id-exact before sibling-title-exact). */
export type FollowupSiblingEntry = FollowupCandidate;

/** Per-section drop record. A FRESH type, not gate-state's DropRecord (whose
 * `section: GateSection` cannot carry "board"/"siblings"); GateDropRecord
 * (gate-ledger.ts, `section: string`) is the precedent, and
 * FollowupState.drops must stay structurally assignable to GateDropRecord[]
 * — pinned by test; runFollowupGate (gate-run.ts, EV-81) is the real
 * consumer, carrying `state.drops` into the gate ledger's one call-line
 * append on both arms (the accessor symbol is deliberately not spelled here
 * — the EV-66 writer-accessor canary enumerates modules by name). */
export interface FollowupDropRecord {
	section: FollowupSection;
	truncated: false | "cap" | "budget";
	kept: number;
	measuredTokens: number;
}

/** Structured per-section kept entries, returned beside stateBytes exactly as
 * drops already is (FollowupDecision is only {disposition, basis}, so these
 * are the only carrier of merge-target identity for EV-82 — it must not
 * re-parse stateBytes). stateHash stays over stateBytes only. */
export interface FollowupSections {
	candidate: { title: string; goal: string };
	board: FollowupBoardEntry[];
	siblings: FollowupSiblingEntry[];
}

/** Drift visibility: absence must never read as "no duplicates found" —
 * kept: 0, truncated: false is byte-identical to genuinely empty. Fail loud
 * on contract inputs (budget, candidate fields); tolerate repo-state drift
 * (board↔card-file pair) but make the drift visible. NOT hashed and never in
 * stateBytes. */
export interface FollowupSources {
	board: { present: boolean; skippedLines: number };
	cards: { missingGoal: string[] };
}

export interface FollowupState {
	stateBytes: Uint8Array;
	stateHash: string;
	drops: FollowupDropRecord[];
	sections: FollowupSections;
	sources: FollowupSources;
}

/** Single-line FAIL, same surface family as gate.ts's gateFail and
 * gate-state.ts's stateFail. No code-side budget default — the packaged
 * data file is the only carrier of the number. */
function followupFail(key: string, found: string): Error {
	const detail = found.replace(/[\r\n]+/g, " ");
	return new Error(`FAIL: followup-state has an invalid ${key} — ${detail} — set a valid value`);
}

function validateCandidate(c: FollowupCandidate, label: string): void {
	for (const k of ["title", "goal"] as const) {
		const v = c[k];
		if (typeof v !== "string" || v.trim() === "") {
			throw new Error(`followup-state: ${label}.${k} must be a non-empty string, found ${JSON.stringify(v)}`);
		}
	}
}

function strCompare(a: string, b: string): number {
	return a < b ? -1 : a > b ? 1 : 0;
}

// ---------------------------------------------------------------------------
// The board reader — grammar parity with council/validate.py's board_columns:
// strip-then-match, em dash U+2014 only, entries before the first `## `
// header are column None → not packed, a hyphen-minus line parses as
// nothing (counted), duplicated ids keep every column.
// ---------------------------------------------------------------------------

interface BoardLine {
	id: string;
	title: string;
	column: string | null;
}

/** Read + parse the board file. Absent file → present: false (tolerant-empty
 * posture, made visible by sources). */
function readBoardLines(boardPath: string): { lines: BoardLine[]; skipped: number; present: boolean } {
	let text: string;
	try {
		text = fs.readFileSync(boardPath, "utf8");
	} catch {
		return { lines: [], skipped: 0, present: false };
	}
	const lines: BoardLine[] = [];
	let skipped = 0;
	let current: string | null = null;
	for (const line of text.split(/\r?\n/)) {
		if (line.startsWith("## ")) {
			current = line.slice(3).trim();
			continue;
		}
		const stripped = line.trim();
		if (!stripped.startsWith("- ")) continue;
		const m = /^- ([A-Z]+-\d+) — (.*)$/.exec(stripped);
		if (!m) {
			skipped++; // e.g. a hyphen-minus line: parses as nothing, counted
			continue;
		}
		lines.push({ id: m[1]!, title: m[2]!.trim(), column: current });
	}
	return { lines, skipped, present: true };
}

/** Board entries in file order. Duplicated ids keep every column (validate.py
 * semantics); the first occurrence wins for the packed entry. state = the ##
 * column; open = column ≠ "Done"; open entries additionally carry `goal` —
 * resolved from the card file. THE PAIR RULE: the cards dir derives from
 * dirname(boardPath), never from repoRoot. A missing card file or an
 * absent/empty frontmatter goal degrades to goal: "" (tolerant posture,
 * visible via sources.cards.missingGoal) — mid-edit board/file drift must
 * not fail the human-review path. */
function readBoardEntries(
	boardPath: string,
): { entries: FollowupBoardEntry[]; skipped: number; present: boolean; missingGoal: string[] } {
	const { lines, skipped, present } = readBoardLines(boardPath);
	const cardsDir = path.join(path.dirname(boardPath), "cards");
	const entries: FollowupBoardEntry[] = [];
	const missingGoal: string[] = [];
	const seen = new Set<string>();
	for (const l of lines) {
		if (l.column === null) continue; // pre-header: column None → not packed
		if (seen.has(l.id)) continue; // duplicated ids: first occurrence wins
		seen.add(l.id);
		if (l.column === "Done") {
			entries.push({ id: l.id, title: l.title, state: l.column });
			continue;
		}
		// Open entry: resolve the goal from the board's own cards dir.
		let goal = "";
		try {
			const parsed: ParsedCard = parseCardFile(fs.readFileSync(path.join(cardsDir, `${l.id}.md`), "utf8"));
			goal = parsed.goal;
		} catch {
			goal = "";
		}
		if (goal.trim() === "") missingGoal.push(l.id);
		entries.push({ id: l.id, title: l.title, state: l.column, goal });
	}
	return { entries, skipped, present, missingGoal };
}

// ---------------------------------------------------------------------------
// The pack loop — forked from gate-state.ts (same algorithm shape, no shared
// core): empty-frame measurement first; forward-greedy cap fill;
// truncated: false | "cap" | "budget"; on budget bind, largest whole-entry
// prefix, later sections dropped entirely (kept: 0, measuredTokens: 0).
// ---------------------------------------------------------------------------

/** A packing "entry": for the candidate section one FIELD (the only reading
 * that preserves the degenerate-case defense — an over-budget candidate
 * truncates to its field prefix and stays non-empty rather than collapsing
 * to an empty state); for array sections one array element. */
interface SectionEntry {
	key?: string;
	value: unknown;
}

function sectionValue(section: FollowupSection, entries: SectionEntry[]): unknown {
	if (section === "candidate") {
		const o: Record<string, unknown> = {};
		for (const e of entries) o[e.key as string] = e.value;
		return o;
	}
	return entries.map((e) => e.value);
}

export function buildFollowupState(
	candidate: FollowupCandidate,
	repoRoot: string,
	siblings: FollowupCandidate[],
	boardPath: string,
): FollowupState {
	validateCandidate(candidate, "candidate");
	{
		const titles = new Set<string>();
		for (const [i, s] of siblings.entries()) {
			validateCandidate(s, `siblings[${i}]`);
			if (s.title === candidate.title) {
				throw new Error(
					`followup-state: sibling title equals the candidate's title "${s.title}" — a sibling must be a different not-yet-drafted candidate`,
				);
			}
			if (titles.has(s.title)) {
				throw new Error(
					`followup-state: duplicate sibling title "${s.title}" — sibling titles must be unique (title-as-id)`,
				);
			}
			titles.add(s.title);
		}
	}

	// Budget seam: loadGatePolicy(repoRoot) and read gateStateBudgetTokens.
	// Absent → the packer's own single-line FAIL naming the key; no code-side
	// default. Two reachable arms, both tested: mode off + absent key → THIS
	// fail (loadGatePolicy returns the key as undefined under off); mode
	// non-off + absent key → loadGatePolicy's EV-75-class FAIL surfaces
	// through the seam unchanged. Packing itself is mode-independent, and the
	// packaged policy.json carries the key explicitly, so the off arm cannot
	// fire on real packaged data. The budget value is never packed into the
	// state. The mode-off short circuit belongs to the EV-81/82 call site
	// (mirroring resolveRoute's off ⇒ fallback before the state build); this
	// FAIL is the loud backstop.
	const budget = loadGatePolicy(repoRoot).gateStateBudgetTokens;
	if (budget === undefined) {
		throw followupFail(
			"gateStateBudgetTokens",
			"the key is absent from the resolved gate policy — packing needs a positive integer token budget (an off-mode policy may omit it, but then no follow-up state is ever built)",
		);
	}

	// Siblings pack in (title, goal) canonical order — caller order is
	// caller-discovered and would leak into the bytes.
	const sortedSiblings = [...siblings].sort(
		(a, b) => (a.title !== b.title ? strCompare(a.title, b.title) : strCompare(a.goal, b.goal)),
	);

	// Full frame first: every measurement below is a measurement of a
	// complete three-section state, so the final state's measured token count
	// is exactly the last check that passed — the budget is never exceeded.
	const state: Record<FollowupSection, unknown> = { candidate: {}, board: [], siblings: [] };
	const frameTokens = estimateTokens(JSON.stringify(state));
	if (frameTokens > budget) {
		throw new Error(
			`followup-state: the empty followup-state frame alone measures ${frameTokens} tokens, exceeding the gateStateBudgetTokens budget ${budget} — set a larger budget`,
		);
	}

	const board = readBoardEntries(boardPath);
	const drops: FollowupDropRecord[] = [];
	let budgetCut = false;

	const sectionsInput: { section: FollowupSection; entries: () => SectionEntry[] }[] = [
		{
			section: "candidate",
			entries: () => [{ key: "title", value: candidate.title }, { key: "goal", value: candidate.goal }],
		},
		{
			section: "board",
			entries: () => board.entries.map((e) => ({ value: e })),
		},
		{
			section: "siblings",
			entries: () => sortedSiblings.map((s) => ({ value: { title: s.title, goal: s.goal } })),
		},
	];

	for (const { section, entries } of sectionsInput) {
		if (budgetCut) {
			// The tail rule: after a budget cut every later section is dropped
			// entirely, recorded so the cut stays visible.
			drops.push({ section, truncated: "budget", kept: 0, measuredTokens: 0 });
			continue;
		}
		const cap = FOLLOWUP_SECTION_CAPS[section];
		const all = entries();
		const fragTokens = (kept: SectionEntry[]) => estimateTokens(JSON.stringify(sectionValue(section, kept)));

		// Cap fill: largest whole-entry prefix measuring at most the section's
		// own cap. Per-field granularity for candidate; whole-entry for arrays.
		const capFilled: SectionEntry[] = [];
		for (const e of all) {
			if (fragTokens([...capFilled, e]) > cap) break;
			capFilled.push(e);
		}

		const fitsBudget = (kept: SectionEntry[]) =>
			estimateTokens(JSON.stringify({ ...state, [section]: sectionValue(section, kept) })) <= budget;

		// Degenerate defense (candidate only): if zero fields fit the CAP,
		// hard-truncate the first field to a non-empty prefix — the candidate
		// never collapses to an empty state, and it never crashes.
		if (section === "candidate" && capFilled.length === 0) {
			const fit = hardTruncatedCandidate(candidate, cap, state);
			state[section] = fit.value;
			drops.push({ section, truncated: "cap", kept: 1, measuredTokens: fit.tokens });
			continue;
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
			continue;
		}

		// Budget cut: largest whole-entry prefix fitting the remaining budget.
		let k = capFilled.length;
		while (k > 0 && !fitsBudget(capFilled.slice(0, k))) k--;

		// Degenerate defense (candidate only): if zero fields fit under the
		// remaining budget, hard-truncate the first field to a non-empty
		// prefix that fits — the candidate never collapses to an empty state,
		// and it never crashes.
		if (section === "candidate" && k === 0) {
			const fit = hardTruncatedCandidate(candidate, budget, state);
			state[section] = fit.value;
			drops.push({ section, truncated: "budget", kept: 1, measuredTokens: fit.tokens });
			budgetCut = true;
			continue;
		}

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
	return {
		stateBytes,
		stateHash,
		drops,
		sections: {
			candidate: state.candidate as { title: string; goal: string },
			board: state.board as FollowupBoardEntry[],
			siblings: state.siblings as FollowupSiblingEntry[],
		},
		sources: {
			board: { present: board.present, skippedLines: board.skipped },
			cards: { missingGoal: [...board.missingGoal].sort(strCompare) },
		},
	};
}

/** Degenerate candidate defense: halve the `title` prefix until the
 * serialized candidate state fits `limit` (the section cap on the cap path,
 * the remaining budget on the budget path), keeping at least one non-empty
 * character. Returns the fitted value + its measured tokens. Called only
 * when zero whole fields fit. */
function hardTruncatedCandidate(
	candidate: FollowupCandidate,
	limit: number,
	state: Record<FollowupSection, unknown>,
): { value: { title: string; goal: string }; tokens: number } {
	const measure = (t: string): number =>
		estimateTokens(JSON.stringify({ ...state, candidate: { title: t, goal: "" } }));
	let len = candidate.title.length;
	while (len > 1 && measure(candidate.title.slice(0, len)) > limit) len = Math.max(1, Math.floor(len / 2));
	const title = candidate.title.slice(0, len);
	return { value: { title, goal: "" }, tokens: measure(title) };
}
