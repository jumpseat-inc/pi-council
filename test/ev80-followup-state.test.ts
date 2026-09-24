// EV-80 — the follow-up review state packer (EPIC-10).
//
// Spec: docs/superpowers/specs/2026-09-21-EV-80-design.md §8 (settled
// deliberation record council/cards/EV-80.md + the binding product-owner
// ruling of 2026-09-21). One file, tmpdir fixtures for any write; the only
// repo-filesystem read used as a fixture is the read-only PKG_ROOT pin (the
// §7 headroom probe over this repo's own council/board.md and the §3
// caps-sum invariant through the packaged policy loader) — it writes
// nothing, so the tmpdir convention is not owed there.
import { beforeAll, describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { CONFIG_DIR_NAME } from "@earendil-works/pi-coding-agent";
import { srcPin } from "./src-pin.ts";
import {
	FOLLOWUP_SECTION_CAPS,
	FOLLOWUP_SECTIONS,
	buildFollowupState,
	type FollowupCandidate,
	type FollowupState,
} from "../extensions/followup-state.ts";
import { buildGateState } from "../extensions/gate-state.ts";
import { loadGatePolicy } from "../extensions/gate.ts";
import { PKG_ROOT } from "../extensions/seats.ts";

// ---------------------------------------------------------------------------
// Fixtures — tmpdir only (except the read-only PKG_ROOT pins).
// ---------------------------------------------------------------------------

/** Synthetic repo tree: a repo-local gate policy carrying a large valid
 * budget (the budget never binds unless a test overrides it) and an optional
 * `.council.json` gate section. Never the real repo. `budget: null` omits
 * the key entirely (the budget-two-arm fixture). */
function tmpRepo(opts: { budget?: number | null; gateMode?: string } = {}): string {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "council-ev80-"));
	const dir = path.join(root, CONFIG_DIR_NAME, "council", "gate");
	fs.mkdirSync(dir, { recursive: true });
	const policy: Record<string, unknown> = {
		policyVersion: "p",
		model: "m",
		endpoint: "https://x/",
		...(opts.budget !== null ? { gateStateBudgetTokens: opts.budget ?? 1000000 } : {}),
	};
	fs.writeFileSync(path.join(dir, "policy.json"), JSON.stringify(policy));
	if (opts.gateMode !== undefined) {
		// .council.json lives at the REPO ROOT (COUNCIL_CONFIG_FILE), not under
		// CONFIG_DIR_NAME — loadGateConfig reads path.join(repoRoot, ".council.json").
		fs.writeFileSync(path.join(root, ".council.json"), JSON.stringify({ gate: { mode: opts.gateMode } }));
	}
	return root;
}

const candidate = (overrides: Partial<FollowupCandidate> = {}): FollowupCandidate => ({
	title: "Fix the follow-up packer",
	goal: "Pack follow-up state deterministically under budget",
	...overrides,
});

/** Board + cards fixture. Entries are (id, title, column) in intended file
 * order; a card file carrying `cardGoals[id]` (or a default) is written into
 * cardsDirRel for every non-Done entry. Returns the board's absolute path. */
function boardFixture(
	root: string,
	boardRel: string,
	cardsDirRel: string,
	entries: { id: string; title: string; column: string }[],
	cardGoals: Record<string, string> = {},
): string {
	const boardPath = path.join(root, boardRel);
	fs.mkdirSync(path.dirname(boardPath), { recursive: true });
	const columns = [...new Set(entries.map((e) => e.column))];
	const lines: string[] = ["# Council Board", ""];
	for (const col of columns) {
		lines.push(`## ${col}`, "");
		for (const e of entries.filter((x) => x.column === col)) lines.push(`- ${e.id} — ${e.title}`);
		lines.push("");
	}
	fs.writeFileSync(boardPath, lines.join("\n"));
	const cardsDir = path.join(root, cardsDirRel);
	fs.mkdirSync(cardsDir, { recursive: true });
	for (const e of entries.filter((x) => x.column !== "Done")) {
		writeCard(cardsDir, e.id, e.title, e.column, cardGoals[e.id] ?? `Do ${e.id}: ${e.title}`);
	}
	return boardPath;
}

function writeCard(cardsDir: string, id: string, title: string, state: string, goal: string): void {
	fs.writeFileSync(path.join(cardsDir, `${id}.md`), `---\nid: ${id}\ntitle: ${title}\nstate: ${state}\ngoal: ${goal}\n---\n\n## Goal\n\n${goal}\n`);
}

const parseState = (bytes: Uint8Array): Record<string, unknown> =>
	JSON.parse(Buffer.from(bytes).toString("utf8")) as Record<string, unknown>;

const decode = (s: FollowupState): string => Buffer.from(s.stateBytes).toString("utf8");

const failOf = (run: () => unknown): string => {
	try {
		run();
	} catch (e) {
		return (e as Error).message;
	}
	throw new Error("expected a throw");
};

/** The discriminating relocated pair (spec §8 item 16, ruling Q2): the board
 * lives in a non-council dir whose sibling cards/ carries a DISTINCTIVE goal
 * for EV-90 while <repoRoot>/council/cards/ carries a DIFFERENT goal for the
 * same id — the convention-(b) reader would pack the wrong one. Also carries
 * a Done entry (EV-91) with a card file, for the Done-change sensitivity arm.
 * Returns boardPath + both goals. */
function relocatedPair(root: string): { boardPath: string; distinctiveGoal: string; rootGoal: string } {
	const distinctiveGoal = "DISTINCTIVE-GOAL: pack from the board's own cards dir";
	const rootGoal = "ROOT-GOAL: must never pack";
	const boardPath = boardFixture(
		root,
		path.join("relocated", "board.md"),
		path.join("relocated", "cards"),
		[
			{ id: "EV-90", title: "Relocated evidence card", column: "Backlog" },
			{ id: "EV-91", title: "Relocated done card", column: "Done" },
		],
		{ "EV-90": distinctiveGoal },
	);
	writeCard(path.join(root, "relocated", "cards"), "EV-91", "Relocated done card", "Done", "DONE-CARD-GOAL: never read");
	// The decoy card under <repoRoot>/council/cards/.
	fs.mkdirSync(path.join(root, "council", "cards"), { recursive: true });
	writeCard(path.join(root, "council", "cards"), "EV-90", "Relocated evidence card", "Backlog", rootGoal);
	return { boardPath, distinctiveGoal, rootGoal };
}

// ---------------------------------------------------------------------------
// 1. Pack shape + section order (§4).
// ---------------------------------------------------------------------------

test("pack shape: three sections in declared order, candidate + board + siblings filled", () => {
	const root = tmpRepo();
	const boardPath = boardFixture(root, "council/board.md", "council/cards", [
		{ id: "EV-1", title: "Alpha card", column: "Backlog" },
		{ id: "EV-2", title: "Done card", column: "Done" },
	]);
	const state = buildFollowupState(candidate(), root, [candidate({ title: "Sibling one", goal: "s1" })], boardPath);
	const parsed = parseState(state.stateBytes);
	expect(Object.keys(parsed)).toEqual([...FOLLOWUP_SECTIONS]);
	expect(parsed.candidate).toEqual({ title: candidate().title, goal: candidate().goal });
	expect(parsed.board).toEqual([
		{ id: "EV-1", title: "Alpha card", state: "Backlog", goal: "Do EV-1: Alpha card" },
		{ id: "EV-2", title: "Done card", state: "Done" },
	]);
	expect(parsed.siblings).toEqual([{ title: "Sibling one", goal: "s1" }]);
});

// ---------------------------------------------------------------------------
// 2. Determinism (§5) — byte/hash identity + independent recompute.
// ---------------------------------------------------------------------------

test("byte/hash identity across repeated calls on a fixed tree", () => {
	const root = tmpRepo();
	const boardPath = boardFixture(root, "council/board.md", "council/cards", [{ id: "EV-1", title: "Alpha card", column: "Backlog" }]);
	const a = buildFollowupState(candidate(), root, [candidate({ title: "Sibling one", goal: "s1" })], boardPath);
	const b = buildFollowupState(candidate(), root, [candidate({ title: "Sibling one", goal: "s1" })], boardPath);
	expect(Buffer.compare(Buffer.from(a.stateBytes), Buffer.from(b.stateBytes))).toBe(0);
	expect(a.stateHash).toBe(b.stateHash);
});

test("hash single source: independent sha256 recompute equals the returned stateHash", () => {
	const root = tmpRepo();
	const boardPath = boardFixture(root, "council/board.md", "council/cards", [{ id: "EV-1", title: "Alpha card", column: "Backlog" }]);
	const state = buildFollowupState(candidate(), root, [], boardPath);
	expect(createHash("sha256").update(state.stateBytes).digest("hex")).toBe(state.stateHash);
});

// ---------------------------------------------------------------------------
// 3. Round-trip pin + sources not hashed (§2, §5).
// ---------------------------------------------------------------------------

test("round-trip: JSON.parse(stateBytes) deep-equals the canonical sections; sources never in stateBytes", () => {
	const root = tmpRepo();
	const boardPath = boardFixture(root, "council/board.md", "council/cards", [
		{ id: "EV-1", title: "Alpha card", column: "Backlog" },
		{ id: "EV-2", title: "Done card", column: "Done" },
	]);
	const state = buildFollowupState(candidate(), root, [candidate({ title: "Sibling one", goal: "s1" })], boardPath);
	const parsed = parseState(state.stateBytes);
	expect(parsed).toEqual({
		candidate: state.sections.candidate,
		board: state.sections.board,
		siblings: state.sections.siblings,
	});
	expect("sources" in parsed).toBe(false);
});

// ---------------------------------------------------------------------------
// 4. Hash sensitivity — the R0 headline proofs over the relocated pair.
// ---------------------------------------------------------------------------

describe("hash sensitivity (R0 headline over the discriminating relocated pair)", () => {
	let root: string;
	let boardPath: string;
	let goals: { boardPath: string; distinctiveGoal: string; rootGoal: string };
	let base: FollowupState;
	const SIBLING = candidate({ title: "Sibling one", goal: "s1" });
	const pack = (): FollowupState => buildFollowupState(candidate(), root, [SIBLING], boardPath);

	beforeAll(() => {
		root = tmpRepo();
		goals = relocatedPair(root);
		boardPath = goals.boardPath;
		base = pack();
		// Item 16 over the pair the headline proofs run on: the
		// dirname-derived goal packs, the repo-council decoy never does.
		expect(decode(base)).toContain(goals.distinctiveGoal);
		expect(decode(base)).not.toContain(goals.rootGoal);
		expect(decode(base)).not.toContain("DONE-CARD-GOAL");
	});

	test("open-card goal change → hash changes (restored after)", () => {
		const card = path.join(root, "relocated", "cards", "EV-90.md");
		const original = fs.readFileSync(card, "utf8");
		fs.writeFileSync(card, original.replace(goals.distinctiveGoal, "CHANGED-GOAL now different"));
		expect(pack().stateHash).not.toBe(base.stateHash);
		fs.writeFileSync(card, original); // restore
		expect(pack().stateHash).toBe(base.stateHash);
	});

	test("sibling change → hash changes", () => {
		expect(
			buildFollowupState(candidate(), root, [candidate({ title: "Sibling one", goal: "s2-changed" })], boardPath).stateHash,
		).not.toBe(base.stateHash);
	});

	test("Done-card change → hash unchanged (Done entries carry state only)", () => {
		const card = path.join(root, "relocated", "cards", "EV-91.md");
		const original = fs.readFileSync(card, "utf8");
		fs.writeFileSync(card, original.replace("DONE-CARD-GOAL: never read", "DONE-CARD-GOAL: rewritten text"));
		expect(pack().stateHash).toBe(base.stateHash);
		fs.writeFileSync(card, original); // restore
	});

	test("unrelated repo file create/rewrite → hash unchanged", () => {
		fs.mkdirSync(path.join(root, "vault", "wiki"), { recursive: true });
		fs.writeFileSync(path.join(root, "vault", "wiki", "unrelated.md"), "unrelated wiki page");
		fs.writeFileSync(path.join(root, "unrelated-root-file.txt"), "created");
		// Rewriting extensions/gate.ts bytes INSIDE the fixture tree (C4).
		fs.mkdirSync(path.join(root, "extensions"), { recursive: true });
		fs.writeFileSync(path.join(root, "extensions", "gate.ts"), "// rewritten bytes — not an input");
		expect(pack().stateHash).toBe(base.stateHash);
	});

	test("sources-only change → hash unchanged (a skipped line moves sources, never the bytes)", () => {
		fs.appendFileSync(boardPath, "- EV-99 - hyphen-minus noise line\n");
		const after = pack();
		expect(after.stateHash).toBe(base.stateHash);
		expect(after.sources.board.skippedLines).toBe(base.sources.board.skippedLines + 1);
	});
});

// ---------------------------------------------------------------------------
// 5. Accessor canary (§5).
// ---------------------------------------------------------------------------

test("accessor canary: no forbidden accessor strings in module source; run-store sentinel never in stateBytes", () => {
	const src = srcPin(fs.readFileSync(path.join(PKG_ROOT, "extensions", "followup-state.ts"), "utf8"));
	expect(src).not.toContain("runs/");
	expect(src).not.toContain("fetch(");
	// quote-agnostic canary (FLLWUP-116): normalization makes this red on BOTH
	// quote styles of .pi (and accepted near-miss bytes like x".pi'y) — see test/src-pin.ts
	expect(src).not.toContain(srcPin('".pi"'));

	const root = tmpRepo();
	// A sentinel under the run-store directory must never enter the state bytes.
	const sentinelDir = path.join(root, CONFIG_DIR_NAME, "council", "runs");
	fs.mkdirSync(sentinelDir, { recursive: true });
	fs.writeFileSync(path.join(sentinelDir, "manifest.json"), "RUNS-SENTINEL-eleven-9f2c");
	const boardPath = boardFixture(root, "council/board.md", "council/cards", [{ id: "EV-1", title: "Alpha card", column: "Backlog" }]);
	const state = buildFollowupState(candidate(), root, [], boardPath);
	expect(decode(state)).not.toContain("RUNS-SENTINEL");
});

// ---------------------------------------------------------------------------
// 6. Budget seam — two arms (§3).
// ---------------------------------------------------------------------------

test("budget arm i: mode off + absent key → the packer's own FAIL naming gateStateBudgetTokens", () => {
	const root = tmpRepo({ budget: null, gateMode: "off" });
	const boardPath = boardFixture(root, "council/board.md", "council/cards", [{ id: "EV-1", title: "Alpha card", column: "Backlog" }]);
	const msg = failOf(() => buildFollowupState(candidate(), root, [], boardPath));
	expect(msg).toMatch(/^FAIL: /);
	expect(msg).toContain("gateStateBudgetTokens");
	expect(msg).not.toMatch(/\n/);
});

test("budget arm ii: mode advisory + absent key → loadGatePolicy's EV-75-class FAIL surfaces through the seam", () => {
	const root = tmpRepo({ budget: null, gateMode: "advisory" });
	const boardPath = boardFixture(root, "council/board.md", "council/cards", [{ id: "EV-1", title: "Alpha card", column: "Backlog" }]);
	const msg = failOf(() => buildFollowupState(candidate(), root, [], boardPath));
	expect(msg).toContain(`has an invalid gateStateBudgetTokens — the key is absent but the resolved mode is "advisory"`);
});

// ---------------------------------------------------------------------------
// 7. Budget mechanics (§6).
// ---------------------------------------------------------------------------

describe("budget mechanics", () => {
	test("tiny budget → candidate full, board cut at 'budget', siblings dropped entirely (kept 0, measuredTokens 0)", () => {
		const root = tmpRepo({ budget: 60 });
		const boardPath = boardFixture(root, "council/board.md", "council/cards", [
			{ id: "EV-1", title: "Alpha card", column: "Backlog" },
			{ id: "EV-2", title: "Beta card", column: "Backlog" },
		]);
		const state = buildFollowupState(candidate(), root, [candidate({ title: "Sibling one", goal: "s1" })], boardPath);
		expect(state.drops.map((d) => d.section)).toEqual(["candidate", "board", "siblings"]);
		expect(state.drops[0]).toMatchObject({ truncated: false, kept: 2 });
		expect(state.drops[1]).toMatchObject({ section: "board", truncated: "budget" });
		expect(state.drops[2]).toEqual({ section: "siblings", truncated: "budget", kept: 0, measuredTokens: 0 });
		const parsed = parseState(state.stateBytes);
		expect(parsed.board).toEqual([]);
		expect(parsed.siblings).toEqual([]);
	});

	test("cap overfill → board trimmed at 'cap' keeping a whole-entry prefix, later section unaffected", () => {
		const root = tmpRepo();
		const big = "G".repeat(70000); // ~20,016 tokens with entry overhead
		const small = "S".repeat(2000); // ~588 tokens with entry overhead
		const boardPath = boardFixture(
			root,
			"council/board.md",
			"council/cards",
			[
				{ id: "EV-1", title: "Alpha card", column: "Backlog" },
				{ id: "EV-2", title: "Beta card", column: "Backlog" },
				{ id: "EV-3", title: "Gamma card", column: "Backlog" },
				{ id: "EV-4", title: "Delta card", column: "Backlog" },
				{ id: "EV-5", title: "Epsilon card", column: "Backlog" },
			],
			{ "EV-1": big, "EV-2": small, "EV-3": small, "EV-4": small, "EV-5": small },
		);
		const state = buildFollowupState(candidate(), root, [candidate({ title: "Sibling one", goal: "s1" })], boardPath);
		const boardDrop = state.drops.find((d) => d.section === "board");
		expect(boardDrop?.truncated).toBe("cap");
		expect(boardDrop?.kept).toBe(4); // 4 entries ≈ 21,780 ≤ 22,000; the 5th breaks it
		const parsed = parseState(state.stateBytes);
		expect((parsed.board as unknown[]).map((e) => (e as { id: string }).id)).toEqual(["EV-1", "EV-2", "EV-3", "EV-4"]);
		expect(state.drops.find((d) => d.section === "siblings")?.truncated).toBe(false);
		expect(parsed.siblings).toEqual([{ title: "Sibling one", goal: "s1" }]);
	});

	test("frame > budget → throw", () => {
		const root = tmpRepo({ budget: 5 });
		const boardPath = boardFixture(root, "council/board.md", "council/cards", []);
		expect(() => buildFollowupState(candidate(), root, [], boardPath)).toThrow(/frame/);
	});
});

// ---------------------------------------------------------------------------
// 8. Degenerate over-budget candidate (§4).
// ---------------------------------------------------------------------------

test("degenerate case: an over-budget candidate truncates per field and stays non-empty; later sections untouched", () => {
	const root = tmpRepo();
	const boardPath = boardFixture(root, "council/board.md", "council/cards", [{ id: "EV-1", title: "Alpha card", column: "Backlog" }]);
	// goal ~11.4k tokens, over the 2000 candidate cap → the goal field is cut
	// whole (field granularity); the section stays non-empty on its title.
	const state = buildFollowupState(candidate({ goal: "G".repeat(40000) }), root, [candidate({ title: "Sibling one", goal: "s1" })], boardPath);
	const parsed = parseState(state.stateBytes);
	const cand = parsed.candidate as Record<string, unknown>;
	expect(Object.keys(cand)).toEqual(["title"]);
	expect(cand.title).toBe(candidate().title);
	expect(state.drops[0]).toMatchObject({ section: "candidate", truncated: "cap", kept: 1 });
	expect(state.drops.find((d) => d.section === "board")?.truncated).toBe(false);
	expect(state.drops.find((d) => d.section === "siblings")?.truncated).toBe(false);
	expect(parsed.siblings).toEqual([{ title: "Sibling one", goal: "s1" }]);
});

test("degenerate case: the candidate's FIRST field alone exceeds the cap → non-empty prefix, never a crash or empty state", () => {
	const root = tmpRepo();
	const boardPath = boardFixture(root, "council/board.md", "council/cards", [{ id: "EV-1", title: "Alpha card", column: "Backlog" }]);
	const state = buildFollowupState(candidate({ title: "T".repeat(40000), goal: "G".repeat(40000) }), root, [], boardPath);
	const parsed = parseState(state.stateBytes);
	const cand = parsed.candidate as Record<string, unknown>;
	expect(Object.keys(cand).length).toBeGreaterThan(0);
	expect(cand.title).toBeTruthy();
	expect((cand.title as string).length).toBeGreaterThan(0);
	expect((cand.title as string).length).toBeLessThan(40000);
	expect(state.drops[0]?.truncated).toBe("cap");
	expect(state.drops[0]?.kept).toBe(1);
});

// ---------------------------------------------------------------------------
// 9. Validation FAILs (§2).
// ---------------------------------------------------------------------------

test("validation FAILs name candidate.title / candidate.goal / siblings[i].*; missing boardPath is a compile-time type error", () => {
	const root = tmpRepo();
	const boardPath = boardFixture(root, "council/board.md", "council/cards", []);
	expect(failOf(() => buildFollowupState(candidate({ title: "  " }), root, [], boardPath))).toContain("candidate.title");
	expect(failOf(() => buildFollowupState(candidate({ goal: "" }), root, [], boardPath))).toContain("candidate.goal");
	expect(failOf(() => buildFollowupState(candidate(), root, [candidate({ title: "" })], boardPath))).toContain("siblings[0].title");
	expect(failOf(() => buildFollowupState(candidate(), root, [candidate({ goal: "  " })], boardPath))).toContain("siblings[0].goal");
	// Compile-time requirement: a 3-arg call must not typecheck. Never invoked.
	if (false) {
		// @ts-expect-error boardPath is a required 4th parameter
		buildFollowupState(candidate(), root, []);
	}
});

// ---------------------------------------------------------------------------
// 10. Board-grammar parity with council/validate.py board_columns (§4).
// ---------------------------------------------------------------------------

describe("board grammar parity", () => {
	function rawBoard(root: string, text: string): string {
		const boardPath = path.join(root, "council", "board.md");
		fs.mkdirSync(path.dirname(boardPath), { recursive: true });
		fs.writeFileSync(boardPath, text);
		return boardPath;
	}

	test("U+2014 em dash only: a hyphen-minus line parses as nothing (skipped, counted)", () => {
		const root = tmpRepo();
		const boardPath = rawBoard(root, "# Council Board\n\n## Backlog\n\n- EV-1 — Em dash entry\n- EV-2 - Hyphen-minus entry\n");
		const state = buildFollowupState(candidate(), root, [], boardPath);
		const parsed = parseState(state.stateBytes);
		expect(parsed.board).toEqual([{ id: "EV-1", title: "Em dash entry", state: "Backlog", goal: "" }]);
		expect(state.sources.board.skippedLines).toBe(1);
		expect(state.sources.cards.missingGoal).toEqual(["EV-1"]);
	});

	test("pre-header entries are column None → not packed (counted); duplicates keep every column, first occurrence wins", () => {
		const root = tmpRepo();
		const boardPath = rawBoard(
			root,
			"# Council Board\n\n- EV-9 — Pre-header entry\n\n## Done\n\n- EV-1 — Done copy\n\n## Backlog\n\n- EV-1 — Backlog copy\n",
		);
		const state = buildFollowupState(candidate(), root, [], boardPath);
		const parsed = parseState(state.stateBytes);
		// Pre-header EV-9: still MATCHES the grammar (validate.py parses it
		// with column None), so it is parsed-but-unplaced — not packed, and
		// NOT counted as skipped. EV-1 duplicated: first occurrence (Done)
		// wins the packed entry; no goal read for Done.
		expect(parsed.board).toEqual([{ id: "EV-1", title: "Done copy", state: "Done" }]);
		expect(state.sources.board.skippedLines).toBe(0);
	});
});

// ---------------------------------------------------------------------------
// 11. Drift visibility — sources (§2, §4).
// ---------------------------------------------------------------------------

describe("drift visibility (sources)", () => {
	test("absent board → present: false, kept 0, truncated: false — absence never reads as 'no duplicates found'", () => {
		const root = tmpRepo();
		const boardPath = path.join(root, "council", "board.md");
		const state = buildFollowupState(candidate(), root, [], boardPath);
		const parsed = parseState(state.stateBytes);
		expect(parsed.board).toEqual([]);
		expect(state.drops.find((d) => d.section === "board")).toMatchObject({ truncated: false, kept: 0 });
		expect(state.sources.board).toEqual({ present: false, skippedLines: 0 });
		expect(state.sources.cards).toEqual({ missingGoal: [] });
	});

	test("open id with absent card file and with empty-goal frontmatter → missingGoal, sorted, goal packs empty", () => {
		const root = tmpRepo();
		const boardPath = boardFixture(root, "council/board.md", "council/cards", [
			{ id: "EV-3", title: "Gamma card", column: "Backlog" },
			{ id: "EV-1", title: "Alpha card", column: "Backlog" },
			{ id: "EV-2", title: "Beta card", column: "Backlog" },
		]);
		// EV-1's card file removed entirely; EV-2's file rewritten with no
		// goal key. Both degrade to goal: "" and surface in missingGoal.
		fs.rmSync(path.join(root, "council", "cards", "EV-1.md"));
		fs.writeFileSync(path.join(root, "council", "cards", "EV-2.md"), "---\nid: EV-2\ntitle: Beta card\nstate: Backlog\n---\n");
		const state = buildFollowupState(candidate(), root, [], boardPath);
		expect(state.sources.cards.missingGoal).toEqual(["EV-1", "EV-2"]);
		const parsed = parseState(state.stateBytes);
		expect(parsed.board).toEqual([
			{ id: "EV-3", title: "Gamma card", state: "Backlog", goal: "Do EV-3: Gamma card" },
			{ id: "EV-1", title: "Alpha card", state: "Backlog", goal: "" },
			{ id: "EV-2", title: "Beta card", state: "Backlog", goal: "" },
		]);
	});
});

// ---------------------------------------------------------------------------
// 12. Sibling canonicalization + identity rules (§4).
// ---------------------------------------------------------------------------

describe("sibling canonicalization", () => {
	test("siblings pack in (title, goal) canonical order regardless of caller order", () => {
		const root = tmpRepo();
		const boardPath = boardFixture(root, "council/board.md", "council/cards", []);
		const state = buildFollowupState(
			candidate(),
			root,
			[candidate({ title: "Zulu sibling", goal: "z" }), candidate({ title: "Mid sibling", goal: "a" }), candidate({ title: "Alpha sibling", goal: "b" })],
			boardPath,
		);
		const parsed = parseState(state.stateBytes);
		expect(parsed.siblings).toEqual([
			{ title: "Alpha sibling", goal: "b" },
			{ title: "Mid sibling", goal: "a" },
			{ title: "Zulu sibling", goal: "z" },
		]);
	});

	test("duplicate sibling titles throw naming the title", () => {
		const root = tmpRepo();
		const boardPath = boardFixture(root, "council/board.md", "council/cards", []);
		const msg = failOf(() =>
			buildFollowupState(candidate(), root, [candidate({ title: "Same title", goal: "a" }), candidate({ title: "Same title", goal: "b" })], boardPath),
		);
		expect(msg).toContain("Same title");
		expect(msg).toContain("sibling");
	});

	test("a sibling title equal to the candidate's title throws", () => {
		const root = tmpRepo();
		const boardPath = boardFixture(root, "council/board.md", "council/cards", []);
		const msg = failOf(() => buildFollowupState(candidate(), root, [candidate({ title: candidate().title, goal: "x" })], boardPath));
		expect(msg).toContain(candidate().title);
	});

	test("structural no-fabrication: sibling entries carry exactly {title, goal} — no id key", () => {
		const root = tmpRepo();
		const boardPath = boardFixture(root, "council/board.md", "council/cards", []);
		const state = buildFollowupState(candidate(), root, [candidate({ title: "Sibling one", goal: "s1" })], boardPath);
		const parsed = parseState(state.stateBytes);
		for (const s of parsed.siblings as Record<string, unknown>[]) expect(Object.keys(s)).toEqual(["title", "goal"]);
	});
});

// ---------------------------------------------------------------------------
// 13. Cross-module drop parity with buildGateState (§6).
// ---------------------------------------------------------------------------

describe("cross-module drop parity (forked loop, identical mechanics)", () => {
	test("budget cut: first section over remaining budget → prefix kept, every later section zeroed in BOTH packers", () => {
		const g = buildGateState(
			{ id: "EV-0", title: "t", goal: "G".repeat(400), acceptance: "a", touchedFiles: [{ path: "p/q.ts", linesChanged: 1 }] },
			tmpRepo({ budget: 80 }),
		);
		const rootF = tmpRepo({ budget: 80 });
		const f = buildFollowupState(
			candidate({ title: "t", goal: "G".repeat(400) }),
			rootF,
			[candidate({ title: "Sibling one", goal: "s1" })],
			path.join(rootF, "council", "board.md"), // absent board
		);
		// Same shape: a first section that kept a non-empty whole-entry
		// prefix under the budget cut, then every later section dropped
		// entirely with kept 0 / measuredTokens 0.
		for (const drops of [g.drops, f.drops]) {
			expect(drops[0].truncated).toBe("budget");
			expect(drops[0].kept).toBeGreaterThan(0);
			expect(drops[0].measuredTokens).toBeGreaterThan(0);
			for (const d of drops.slice(1)) {
				expect(d).toEqual({ section: d.section, truncated: "budget", kept: 0, measuredTokens: 0 });
			}
		}
	});

	test("cap trim: the last field/entry over its section cap → 'cap' record, later sections untouched in BOTH packers", () => {
		// gate card: id+title+goal fit the 4000 card cap, acceptance breaks it.
		const g = buildGateState(
			{ id: "EV-0", title: "t", goal: "G".repeat(6000), acceptance: "A".repeat(20000), touchedFiles: [] },
			tmpRepo(),
		);
		// followup candidate: title fits the 2000 cap, goal breaks it.
		const rootF = tmpRepo();
		const f = buildFollowupState(
			candidate({ title: "t", goal: "G".repeat(8000) }),
			rootF,
			[candidate({ title: "Sibling one", goal: "s1" })],
			path.join(rootF, "council", "board.md"),
		);
		for (const drops of [g.drops, f.drops]) {
			expect(drops[0].truncated).toBe("cap");
			expect(drops[0].kept).toBeGreaterThan(0);
			for (const d of drops.slice(1)) expect(d.truncated).toBe(false);
		}
	});

	test("frame > budget → both packers throw", () => {
		expect(() =>
			buildGateState({ id: "EV-0", title: "t", goal: "g", acceptance: "a", touchedFiles: [] }, tmpRepo({ budget: 1 })),
		).toThrow(/frame/);
		const rootF = tmpRepo({ budget: 1 });
		expect(() => buildFollowupState(candidate(), rootF, [], path.join(rootF, "council", "board.md"))).toThrow(/frame/);
	});
});

// ---------------------------------------------------------------------------
// 14. Done-entry shape pin (§4).
// ---------------------------------------------------------------------------

test("Done entries carry exactly {id, title, state}; open entries carry {id, title, state, goal}", () => {
	const root = tmpRepo();
	const boardPath = boardFixture(root, "council/board.md", "council/cards", [
		{ id: "EV-2", title: "Done card", column: "Done" },
		{ id: "EV-1", title: "Alpha card", column: "Backlog" },
	]);
	const state = buildFollowupState(candidate(), root, [], boardPath);
	const parsed = parseState(state.stateBytes);
	expect((parsed.board as { id: string }[]).find((e) => e.id === "EV-2")).toEqual({
		id: "EV-2",
		title: "Done card",
		state: "Done",
	} as { id: string });
	expect((parsed.board as { id: string }[]).find((e) => e.id === "EV-1")).toEqual({
		id: "EV-1",
		title: "Alpha card",
		state: "Backlog",
		goal: "Do EV-1: Alpha card",
	} as { id: string });
});

// ---------------------------------------------------------------------------
// 15. Caps-sum invariant through the loader (§3).
// ---------------------------------------------------------------------------

test("caps-sum invariant: 2000 + 22000 + 6000 < gateStateBudgetTokens read through loadGatePolicy", () => {
	expect(FOLLOWUP_SECTION_CAPS.candidate).toBe(2000);
	expect(FOLLOWUP_SECTION_CAPS.board).toBe(22000);
	expect(FOLLOWUP_SECTION_CAPS.siblings).toBe(6000);
	const budget = loadGatePolicy(PKG_ROOT).gateStateBudgetTokens;
	expect(typeof budget).toBe("number");
	expect(FOLLOWUP_SECTION_CAPS.candidate + FOLLOWUP_SECTION_CAPS.board + FOLLOWUP_SECTION_CAPS.siblings).toBeLessThan(budget as number);
});

// ---------------------------------------------------------------------------
// 16. Discriminating cards-dir fixture (ruling Q2).
// ---------------------------------------------------------------------------

test("the cards dir derives from dirname(boardPath), never from repoRoot (relocated pair)", () => {
	const root = tmpRepo();
	const { boardPath, distinctiveGoal, rootGoal } = relocatedPair(root);
	const state = buildFollowupState(candidate(), root, [], boardPath);
	const parsed = parseState(state.stateBytes);
	expect((parsed.board as { id: string; goal?: string }[]).find((e) => e.id === "EV-90")?.goal).toBe(distinctiveGoal);
	expect(decode(state)).not.toContain(rootGoal);
});

// ---------------------------------------------------------------------------
// 17. Headroom probe over the real board (§7 — measures THROUGH the packer).
// ---------------------------------------------------------------------------

test("headroom probe: this repo's own board packs under every cap (goes red the day the board outgrows the caps)", () => {
	const boardPath = path.join(PKG_ROOT, "council", "board.md");
	const state = buildFollowupState(
		{ title: "Headroom probe candidate", goal: "Minimal synthetic candidate" },
		PKG_ROOT,
		[],
		boardPath,
	);
	expect(state.sources.board.present).toBe(true);
	const capOf: Record<string, number> = {
		candidate: FOLLOWUP_SECTION_CAPS.candidate,
		board: FOLLOWUP_SECTION_CAPS.board,
		siblings: FOLLOWUP_SECTION_CAPS.siblings,
	};
	for (const d of state.drops) {
		expect(d.truncated).toBe(false); // no cap trim, no budget cut
		expect(d.measuredTokens).toBeLessThanOrEqual(capOf[d.section]);
	}
});
