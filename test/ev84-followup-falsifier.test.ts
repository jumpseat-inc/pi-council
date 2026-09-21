// EV-84 — the end-to-end falsifier for the Jev-gated follow-up review.
//
// Spec: docs/superpowers/specs/2026-09-22-EV-84-design.md (settled — do not
// reopen what the Council closed); card: council/cards/EV-84.md; epic EPIC-10.
// One file, zero engine/procedure/scaffold/validate.py diff, no package.json
// bump (test-only card).
//
// The falsifier drives the real exported composition `composeFollowupReview`
// (extensions/followup-tool.ts) over a mkdtemp repoRoot whose repo-local
// `$CONFIG_DIR_NAME/council/gate/followup/{questions,decision}.json`
// (whole-file first-hit per EV-78; CONFIG_DIR_NAME, never a hardcoded `.pi`)
// forces the dispositions, then applies step-13's prose to the rendered
// engine bytes.
//
// The pinned fixture (spec §2): `.council.json` carries `gate.mode` (mode
// lives in config, never in policy.json — EV-75); the packaged
// `council/gate/policy.json` supplies model/endpoint/budget via first-hit
// fallback. Fixture `decision.json`: version "ev84-fixture-v1" (asserted
// verbatim as every ledger line's policyVersion — the composition-level
// first-hit proof); thresholds {merge: 5.0, drop: 9.0} strictly ordered and
// above any achievable composite (≤ 1.0), so Merge/Drop are structurally
// unreachable via the composite and Merge has exactly ONE route — the
// override lane; noulThreshold 0 so a pinned confident answer never trips
// the R4 floor. Pinned answers (delivered by an injected transport on the
// offline leg): A duplicate=yes → Merge (override) into sibling B;
// B duplicate=no → File → new FLLWUP- card; C duplicate=no → File → new
// FLLWUP- card. Board gains exactly two net-new FLLWUP- cards; B's own
// written card carries `## Merged from:` naming both sources (R7's sibling
// branch, EV-82.md:148-156).
//
// The write leg is a named actuator (settled S2): an in-file step-13
// transcription helper that parses `Mode: <disposition>` from the
// engine-derived rendered bytes (NEVER the ledger — the tool result's
// opacity contract) and applies the pinned table's targets. Its
// `## Merged from:` heading bytes are derived from the shipped procedure's
// own step-13 template: the prose is the source, the helper follows — never
// vice versa. In production the actuator is the facilitator executing
// step-13 prose (there is no card-writing tool; EV-83's confirmation-
// authority ruling).
//
// Gating (settled S3): three always-on offline arms (pinned-answers decision
// leg; off; unreachable endpoint) + one gated live arm behind the DEDICATED
// `COUNCIL_JEV_LIVE=1` (not COUNCIL_INTEGRATION=1 — the two must never flip
// together). The default suite stays green without the var and still carries
// the offline coverage. P1-4: the live arm IS executed during this card,
// evidence recorded on the card.
//
// Red-at-base (settled T5, seven-field convention per
// vault/wiki/red-base-evidence.md): base
// d94b33c9ce0d32380e8e0891b32c3298d6861047 — the commit immediately
// preceding EPIC-10's first mechanism merge (92855385, EV-78's PR), role
// required; transplant = exactly this one file, bare copy; exact command
// `bun test test/ev84-followup-falsifier.test.ts`, both halves. At base the
// followup modules do not exist, so the imports fail — the mechanism-absent
// red (the two-class boundary is skeptic-derived, never owner-classified).
import { afterEach, test, expect } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { CONFIG_DIR_NAME } from "@earendil-works/pi-coding-agent";
import { PKG_ROOT } from "../extensions/seats.ts";
import { loadFollowupDecision, loadFollowupQuestions } from "../extensions/gate.ts";
import { gateLedgerPath, readGateLedger } from "../extensions/gate-ledger.ts";
import type { GateTransport, GateTransportResult } from "../extensions/gate-transport.ts";
import { composeFollowupReview, type FollowupReviewResult } from "../extensions/followup-tool.ts";
import type { FollowupCandidate } from "../extensions/followup-state.ts";

// ---------------------------------------------------------------------------
// Fixture data — the pinned table (spec §2, settled S1)
// ---------------------------------------------------------------------------

const DECISION_VERSION = "ev84-fixture-v1";
const QUESTIONS_VERSION = "ev84-fixture-questions-v1";
const ECONNREFUSED = "connect ECONNREFUSED 127.0.0.1:1";

/** The fixture question set: the packaged `duplicate` question verbatim (the
 * live model sees the real question), single-question so the pinned decision
 * needs nothing else and the live arm's answer surface stays minimal. */
const FIXTURE_QUESTIONS = {
	version: QUESTIONS_VERSION,
	questions: {
		duplicate: {
			type: "noul",
			instructions:
				"Is this card substantially the same work as an open card or a same-run sibling — work already underway elsewhere on the board?",
			criteria: {
				yes: "An open card or a same-run sibling already covers this work.",
				no: "No open card or same-run sibling covers this work.",
			},
		},
	},
};

/** The pinned fixture decision policy. Merge is reachable ONLY through the
 * override lane (thresholds above any achievable composite); noulThreshold 0
 * keeps a pinned confident answer clear of the R4 floor. */
const FIXTURE_DECISION = {
	version: DECISION_VERSION,
	weights: { duplicate: 1.0 },
	countedOption: { duplicate: "yes" },
	floors: { choice: 0 },
	noulThreshold: 0,
	noulProbabilityOf: "yes",
	thresholds: { merge: 5.0, drop: 9.0 },
	overrides: [
		{ question: "duplicate", option: "yes", basis: "verbatim duplicate", disposition: "Merge" },
	],
};

/** The pinned table (spec §2): draft order A, B, C; A merges into sibling B
 * (title-exact), B and C each write a new FLLWUP- card. The expected write
 * set and bullet sets derive from THIS table (T4), never from hardcoded
 * literals beside the assertions. */
const CANDIDATE_A: FollowupCandidate = {
	title: "FLLWUP-301 hub stall-kill telemetry",
	goal: "Surface the hub's stall-kill decisions as per-job telemetry rows.",
};
const CANDIDATE_B: FollowupCandidate = {
	title: "FLLWUP-301 hub stall-kill telemetry coverage",
	goal: "Widen the hub's stall-kill telemetry coverage to the pid sweep.",
};
const CANDIDATE_C: FollowupCandidate = {
	title: "FLLWUP-302 usage-block conditional legend refresh",
	goal: "Refresh the usage-block conditional legend's documented states.",
};
const CANDIDATES: readonly FollowupCandidate[] = [CANDIDATE_A, CANDIDATE_B, CANDIDATE_C];
/** The dedup pass's data: A's merge target is sibling B, title-exact. */
const MERGE_TARGETS: Record<string, string> = { [CANDIDATE_A.title]: CANDIDATE_B.title };

/** Pinned model answers (offline leg): A answers the firing option (yes,
 * confident), B and C answer the non-firing option (no, confident). The
 * certainty of 0.05 is 0.95 — clear of every sane floor, and the fixture's
 * noulThreshold 0 makes the floor phase structurally unable to trip. */
const PINNED_YES = { duplicate: { type: "noul", probability: 0.9 } };
const PINNED_NO = { duplicate: { type: "noul", probability: 0.05 } };

// ---------------------------------------------------------------------------
// Fixture repo plumbing — mkdtemp, never the real repo (house rule)
// ---------------------------------------------------------------------------

function tmpRepo(): string {
	return fs.mkdtempSync(path.join(os.tmpdir(), "ev84-falsifier-repo-"));
}

function writeCouncilConfig(repo: string, mode: "off" | "active"): void {
	fs.writeFileSync(path.join(repo, ".council.json"), JSON.stringify({ gate: { mode } }));
}

function writeFixtureGate(repo: string): void {
	fs.mkdirSync(path.join(repo, CONFIG_DIR_NAME, "council", "gate", "followup"), { recursive: true });
	fs.writeFileSync(
		path.join(repo, CONFIG_DIR_NAME, "council", "gate", "followup", "questions.json"),
		JSON.stringify(FIXTURE_QUESTIONS),
	);
	fs.writeFileSync(
		path.join(repo, CONFIG_DIR_NAME, "council", "gate", "followup", "decision.json"),
		JSON.stringify(FIXTURE_DECISION),
	);
}

/** Board card X — an open entry (X need not be a FLLWUP- card; spec §2).
 * `withCardFile: false` leaves the cards dir empty (the off arm asserts it
 * stays empty through the call). */
function writeBoard(repo: string, withCardFile: boolean): void {
	fs.mkdirSync(path.join(repo, "council", "cards"), { recursive: true });
	fs.writeFileSync(
		path.join(repo, "council", "board.md"),
		["# Board", "", "## In Progress", "", "- EV-950 — X board probe card", ""].join("\n"),
	);
	if (withCardFile) {
		fs.writeFileSync(
			path.join(repo, "council", "cards", "EV-950.md"),
			[
				"---",
				"id: EV-950",
				"title: X board probe card",
				"state: In Progress",
				"owner: null",
				"epic: EPIC-10",
				"goal: an open board card the fixture merges nothing into",
				"---",
				"",
				"## Intent",
				"",
				"Probe.",
				"",
			].join("\n"),
		);
	}
}

/** T3's snapshot: council/cards/** + council/board.md, relative path → bytes.
 * The gate ledger lives outside this tree ($CONFIG_DIR_NAME/council/), so a
 * byte-identical snapshot around composeFollowupReview proves the engine
 * wrote nothing but the ledger. */
function snapshotTree(repo: string): Record<string, string> {
	const out: Record<string, string> = {};
	const cardsDir = path.join(repo, "council", "cards");
	for (const f of fs.readdirSync(cardsDir).sort()) {
		out[path.join("council", "cards", f)] = fs.readFileSync(path.join(cardsDir, f), "utf-8");
	}
	out[path.join("council", "board.md")] = fs.readFileSync(path.join(repo, "council", "board.md"), "utf-8");
	return out;
}

/** The injected transport returning the pinned answers, keyed on the packed
 * state's candidate title. Records one invocation per call in arrival order
 * (the composition is sequential per candidate in draft order). */
function pinnedTransport(): { transport: GateTransport; calledTitles: string[] } {
	const calledTitles: string[] = [];
	const transport: GateTransport = async (req) => {
		const body = req.body as { state: { candidate: { title: string } } };
		calledTitles.push(body.state.candidate.title);
		const answers = body.state.candidate.title === CANDIDATE_A.title ? PINNED_YES : PINNED_NO;
		const res: GateTransportResult = {
			ok: true,
			status: 200,
			body: JSON.stringify({
				model: "typesafe/jev-1.13",
				answers,
				usage: { input_tokens: 10, output_tokens: 5, cost: 0.001 },
				provider: "Typesafe",
				id: `gen-ev84-${calledTitles.length}`,
			}),
		};
		return res;
	};
	return { transport, calledTitles };
}

/** Narrow the off no-op away so the active arms' candidate fields are
 * type-visible without non-null assertion noise. */
function expectActive(
	result: FollowupReviewResult,
): Extract<FollowupReviewResult, { mode: "active" | "advisory" }> {
	if (result.mode === "off") throw new Error("expected an active/advisory result, got the off no-op");
	return result;
}

// ---------------------------------------------------------------------------
// The write leg — the step-13 transcription helper (named actuator, settled S2)
// ---------------------------------------------------------------------------

/** The shipped step-13 `## Merged from:` template, extracted from the
 * procedure file. If the prose changes, THIS throws and the helper follows —
 * never vice versa (the test never owns the convention). */
function extractStep13Template(): string {
	const council = fs.readFileSync(path.join(PKG_ROOT, "council", "procedures", "council.md"), "utf-8");
	const m = council.match(/## Merged from:\n\n- <source-title>\n- <source-title>/);
	if (!m) {
		throw new Error(
			"EV-84: the shipped step-13 `## Merged from:` template is gone from council/procedures/council.md — the helper follows the prose, so re-pin the helper to the new prose first",
		);
	}
	return m[0];
}

/** The section for one target: the shipped template with each source
 * candidate's title substituted for `<source-title>` in recorded order. */
function mergedFromSection(sources: readonly string[]): string {
	let section = extractStep13Template();
	for (const title of sources) section = section.replace("<source-title>", title);
	return section;
}

function nextFllwupId(cardsDir: string): number {
	let max = 0;
	for (const f of fs.readdirSync(cardsDir)) {
		const m = f.match(/^FLLWUP-(\d+)\.md$/);
		if (m) max = Math.max(max, Number(m[1]));
	}
	return max + 1;
}

function draftCardBody(title: string, goal: string, mergedFrom?: string): string {
	const lines = ["---", `title: ${title}`, "state: Draft", `goal: ${goal}`, "---", "", "## Intent", "", goal, ""];
	if (mergedFrom !== undefined) lines.push(mergedFrom, "");
	return lines.join("\n");
}

/** Apply step-13's prose to the rendered engine bytes: parse
 * `Mode: <disposition>` from each line (draft order — the render returns
 * exactly one line per candidate); a File writes the candidate's card; a
 * Merge writes no card for the source and, per R7's sibling branch (EV-82.md:
 * 148-156), the target candidate's OWN written card names both source
 * candidates — one bullet per source, in recorded order; a Drop files
 * nothing. Card ids come from scanning the cards dir for the highest
 * existing FLLWUP- id and incrementing (step 13's rule). No ledger reads
 * anywhere — the rendered bytes are the only interface. */
function transcribeStep13(
	lines: readonly string[],
	candidates: readonly FollowupCandidate[],
	repo: string,
	mergeTargets: Record<string, string>,
): { written: string[]; sectionByTarget: Map<string, string> } {
	if (lines.length !== candidates.length) {
		throw new Error(`EV-84: expected one rendered line per candidate (${candidates.length}), got ${lines.length}`);
	}
	const cardsDir = path.join(repo, "council", "cards");
	fs.mkdirSync(cardsDir, { recursive: true });
	const dispositions = candidates.map((c, i) => {
		const m = lines[i]!.match(/^Mode: (File|Merge|Drop)(?: |$)/);
		if (!m) return null; // no Mode: prefix — an escalation literal; nothing is written
		return m[1] as "File" | "Merge" | "Drop";
	});
	// The sibling branch's bullet sets: sources in recorded (draft) order per
	// target, plus the target itself (its own card names BOTH source
	// candidates — the pair is A+B, per the settled pinned table).
	const sourcesByTarget = new Map<string, string[]>();
	for (const [i, c] of candidates.entries()) {
		if (dispositions[i] !== "Merge") continue;
		const target = mergeTargets[c.title];
		if (target === undefined) continue; // Merge with no target falls to the human — nothing written
		const list = sourcesByTarget.get(target) ?? [];
		list.push(c.title);
		sourcesByTarget.set(target, list);
	}
	const written: string[] = [];
	const sectionByTarget = new Map<string, string>();
	for (const [i, c] of candidates.entries()) {
		if (dispositions[i] !== "File") continue;
		const sources = sourcesByTarget.get(c.title);
		let mergedFrom: string | undefined;
		if (sources !== undefined) {
			mergedFrom = mergedFromSection([...sources, c.title]);
			sectionByTarget.set(c.title, mergedFrom);
		}
		const file = path.join(cardsDir, `FLLWUP-${nextFllwupId(cardsDir)}.md`);
		fs.writeFileSync(file, draftCardBody(c.title, c.goal, mergedFrom));
		written.push(file);
	}
	// The EV-84 fixture covers the sibling branch only — a Merge whose target
	// is not itself a written candidate (a board target) fails loud rather
	// than silently skipping the section.
	for (const target of sourcesByTarget.keys()) {
		if (!sectionByTarget.has(target)) {
			throw new Error(`EV-84: merge target ${JSON.stringify(target)} is not a written candidate — the fixture covers the sibling branch only`);
		}
	}
	return { written, sectionByTarget };
}

// ---------------------------------------------------------------------------
// Arm 1 — offline pinned-answers decision leg (always-on, model-independent)
// ---------------------------------------------------------------------------

afterEach(() => {
	// mkdtemp dirs are left for the OS tmp cleaner — the ev81/ev82 precedent.
});

test("arm 1 — offline pinned-answers decision leg: exact-two-card write set, model-independent", async () => {
	const repo = tmpRepo();
	writeCouncilConfig(repo, "active");
	writeFixtureGate(repo);
	writeBoard(repo, true);
	const { transport, calledTitles } = pinnedTransport();

	// T3 rides here too: the snapshot is byte-identical around the call —
	// the engine writes nothing but the ledger.
	const before = snapshotTree(repo);
	const { result, lines } = await composeFollowupReview(
		CANDIDATES,
		repo,
		{ transport, apiKey: "k-test" },
		MERGE_TARGETS,
	);
	const after = snapshotTree(repo);
	expect(after).toEqual(before);

	const active = expectActive(result);
	expect(active.candidates).toHaveLength(3);
	for (const c of active.candidates) {
		expect(c.status).toBe("ok");
		expect(c.callId).not.toBeNull();
	}
	expect(new Set(active.candidates.map((c) => c.callId)).size).toBe(3);
	// Exactly one transport call per candidate, in draft order.
	expect(calledTitles).toEqual(CANDIDATES.map((c) => c.title));

	// The ledger: one call line per candidate, all fixture-versioned.
	const { calls: ledgerLines } = readGateLedger(repo);
	expect(ledgerLines).toHaveLength(3);
	for (const rec of ledgerLines) {
		// The composition-level first-hit proof: every line carries the
		// fixture decision policy's version, verbatim.
		expect(rec.policyVersion).toBe(DECISION_VERSION);
		// The fixture question set's version, via the loaders (never a
		// literal here — the loader's first-hit resolution IS the assertion).
		expect(rec.questionSetVersion).toBe(loadFollowupQuestions(repo).version);
		expect(rec.failure).toBeUndefined();
		// The spec's `drops: []` intent — zero dropped content. The packer
		// ALWAYS records one per-section measurement record (truncated: false
		// when nothing was cut), so an empty array is structurally unreachable
		// for any composed state: the honest form of this assertion is zero
		// truncations, not zero records (spec defect found at implementation
		// time, recorded on the card).
		expect(rec.drops).toBeDefined();
		for (const d of rec.drops!) expect(d.truncated).toBe(false);
	}
	// Dispositions exactly Merge, File, File in draft order; zero Drop
	// anywhere.
	expect(ledgerLines.map((r) => r.resolvedMode)).toEqual(["Merge", "File", "File"]);
	expect(ledgerLines.some((r) => r.resolvedMode === "Drop")).toBe(false);
	// The floors probe (the implementation-time failing-then-passing check):
	// the pinned answers reached decideFollowup PAST the floors phase — A's
	// basis is the override lane's, B/C's are composite lines (a floor breach
	// would render `duplicate: certainty ... < noul threshold ...` instead).
	expect(ledgerLines[0]!.basis).toBe("duplicate? yes (verbatim duplicate)");
	expect(ledgerLines[1]!.basis).toBe("composite 0.05 < merge threshold 5.00");
	expect(ledgerLines[2]!.basis).toBe("composite 0.05 < merge threshold 5.00");

	// Render: one `Mode:` line per candidate in draft order; A's carries the
	// sibling arrow; B and C are arrow-less.
	expect(lines).toHaveLength(3);
	expect(lines[0]).toBe(
		`Mode: Merge — duplicate? yes (verbatim duplicate) — ${CANDIDATE_A.title} → ${CANDIDATE_B.title} (active)`,
	);
	expect(lines[1]!.startsWith("Mode: File")).toBe(true);
	expect(lines[1]).not.toContain("→");
	expect(lines[2]!.startsWith("Mode: File")).toBe(true);

	// The write leg: the helper applies step 13 to the rendered bytes.
	const cardsDir = path.join(repo, "council", "cards");
	expect(fs.readdirSync(cardsDir)).toEqual(["EV-950.md"]);
	const { written, sectionByTarget } = transcribeStep13(lines, CANDIDATES, repo, MERGE_TARGETS);

	// T4 — the expectations derive from the pinned table: exactly two
	// net-new FLLWUP- cards (B and C; A writes nothing), B's card carries the
	// `## Merged from:` section naming both sources in recorded order, C's is
	// plain, and board card X is untouched.
	expect(written).toHaveLength(2);
	expect(fs.readdirSync(cardsDir).sort()).toEqual(["EV-950.md", "FLLWUP-1.md", "FLLWUP-2.md"]);
	const expectedSection = mergedFromSection([CANDIDATE_A.title, CANDIDATE_B.title]);
	expect(sectionByTarget.get(CANDIDATE_B.title)).toBe(expectedSection);
	const bCard = fs.readFileSync(path.join(cardsDir, "FLLWUP-1.md"), "utf-8");
	expect(bCard).toContain(expectedSection);
	const cCard = fs.readFileSync(path.join(cardsDir, "FLLWUP-2.md"), "utf-8");
	expect(cCard).not.toContain("## Merged from:");
	expect(fs.readFileSync(path.join(repo, "council", "board.md"), "utf-8")).toContain("- EV-950 — X board probe card");
});

// ---------------------------------------------------------------------------
// Arm 2 — off (always-on): the R3 short-circuit precedes the loaders
// ---------------------------------------------------------------------------

test("arm 2 — gate off: exact no-op {mode off, recorded 0}, transport never invoked, ledger absent, zero cards", async () => {
	const repo = tmpRepo();
	writeCouncilConfig(repo, "off");
	writeFixtureGate(repo); // the fixture files ARE present — the short-circuit still precedes them
	writeBoard(repo, false); // cards dir starts empty
	let transportCalls = 0;
	const spy: GateTransport = async () => {
		transportCalls++;
		const res: GateTransportResult = {
			ok: false,
			kind: "network",
			message: "spy transport must never be invoked under off",
		};
		return res;
	};

	const { result, lines } = await composeFollowupReview(CANDIDATES, repo, { transport: spy, apiKey: "k-test" });

	// The result is EXACTLY the off no-op — no candidates array, proving the
	// R3 short-circuit precedes the loaders and the packer.
	expect(result).toEqual({ mode: "off", recorded: 0 });
	expect(transportCalls).toBe(0);
	expect(fs.existsSync(gateLedgerPath(repo))).toBe(false);
	expect(lines).toEqual(["off"]);
	expect(fs.readdirSync(path.join(repo, "council", "cards"))).toEqual([]);

	// The prose confirm, carrying the unconditional dedup pass, is what
	// remains: one anchored scan that step 13 still carries the sentence.
	const council = fs.readFileSync(path.join(PKG_ROOT, "council", "procedures", "council.md"), "utf-8");
	expect(council).toContain("**The dedup pass is unconditional.**");
});

// ---------------------------------------------------------------------------
// Arm 3 — unreachable endpoint (always-on): recorded failures, zero Drop
// ---------------------------------------------------------------------------

test("arm 3 — unreachable endpoint: recorded failures (one ledger line per candidate), zero Drop, zero cards written", async () => {
	const repo = tmpRepo();
	writeCouncilConfig(repo, "active");
	writeFixtureGate(repo);
	writeBoard(repo, true);
	const before = snapshotTree(repo);

	const { result, lines } = await composeFollowupReview(
		CANDIDATES,
		repo,
		{
			transport: async () => ({ ok: false, kind: "network", message: ECONNREFUSED }),
			apiKey: "k-test", // explicit — bypasses credential resolution
		},
		MERGE_TARGETS,
	);

	const after = snapshotTree(repo);
	expect(after).toEqual(before); // nothing written before approval

	const active = expectActive(result);
	expect(active.candidates).toHaveLength(3);
	for (const c of active.candidates) {
		expect(c.status).toBe("failed");
		expect(c.callId).not.toBeNull(); // RECORDED failures — non-null callIds
	}
	const { calls: ledgerLines } = readGateLedger(repo);
	expect(ledgerLines).toHaveLength(3); // one ledger line per candidate even on failure
	for (const rec of ledgerLines) {
		expect(rec.resolvedMode).toBe("File"); // the literal fail-safe, never decideFollowup's
		expect(rec.failure?.class).toBe("network");
		expect(rec.basis).toBe(`gate call failed: ${ECONNREFUSED}`);
		// Zero dropped content — zero truncation records (see arm 1's note).
		expect(rec.drops).toBeDefined();
		for (const d of rec.drops!) expect(d.truncated).toBe(false);
		expect(rec.policyVersion).toBe(DECISION_VERSION);
	}
	// Zero Drop dispositions recorded anywhere.
	expect(ledgerLines.some((r) => r.resolvedMode === "Drop")).toBe(false);

	// Render: per-candidate `gate call failed: <reason>` lines (the
	// callFailed cell — network is not a D4 total literal), no Mode: prefix.
	expect(lines).toEqual(CANDIDATES.map(() => `gate call failed: ${ECONNREFUSED}`));
	expect(lines.some((l) => l.startsWith("Mode:"))).toBe(false);

	// The human pre-write confirm is what remains — zero cards written.
	expect(fs.readdirSync(path.join(repo, "council", "cards"))).toEqual(["EV-950.md"]);
});

// ---------------------------------------------------------------------------
// Arm 4 — live wiring falsifier (gated on COUNCIL_JEV_LIVE=1, dedicated)
// ---------------------------------------------------------------------------

const LIVE_ENABLED = process.env.COUNCIL_JEV_LIVE === "1";

test.skipIf(!LIVE_ENABLED)(
	"arm 4 — live: real model, real credential, the exact-two assertion against the fixture's pinned options",
	async () => {
		const repo = tmpRepo();
		writeCouncilConfig(repo, "active");
		writeFixtureGate(repo);
		writeBoard(repo, true);
		const before = snapshotTree(repo);

		// No transport injection; no apiKey opt — the production transport
		// and the byte-identical preflight credential expression.
		const { result, lines } = await composeFollowupReview(CANDIDATES, repo, {}, MERGE_TARGETS);

		const after = snapshotTree(repo);
		expect(after).toEqual(before);

		const active = expectActive(result);
		expect(active.candidates).toHaveLength(3);
		for (const c of active.candidates) {
			expect(c.status).toBe("ok");
			expect(c.callId).not.toBeNull();
		}
		expect(new Set(active.candidates.map((c) => c.callId)).size).toBe(3);

		const { calls: ledgerLines } = readGateLedger(repo);
		expect(ledgerLines).toHaveLength(3);
		for (const rec of ledgerLines) {
			expect(rec.policyVersion).toBe(DECISION_VERSION);
			expect(rec.questionSetVersion).toBe(loadFollowupQuestions(repo).version);
			expect(rec.failure).toBeUndefined();
			// Zero dropped content — zero truncation records (see arm 1's note).
			expect(rec.drops).toBeDefined();
			for (const d of rec.drops!) expect(d.truncated).toBe(false);
		}
		// Residual model dependence, recorded honestly (R5): the exact-two
		// claim holds IFF the model answers the fixture's pinned options. A
		// model answering the non-firing option fails HERE — a legitimate
		// wiring finding, never flake to be suppressed.
		expect(ledgerLines.map((r) => r.resolvedMode)).toEqual(["Merge", "File", "File"]);
		expect(ledgerLines.some((r) => r.resolvedMode === "Drop")).toBe(false);
		expect(ledgerLines[0]!.basis).toBe("duplicate? yes (verbatim duplicate)");

		// Render + write leg, same contract as arm 1.
		expect(lines).toHaveLength(3);
		expect(lines[0]!.startsWith("Mode: Merge")).toBe(true);
		expect(lines[0]).toContain(`→ ${CANDIDATE_B.title} (active)`);
		const { written, sectionByTarget } = transcribeStep13(lines, CANDIDATES, repo, MERGE_TARGETS);
		expect(written).toHaveLength(2);
		const expectedSection = mergedFromSection([CANDIDATE_A.title, CANDIDATE_B.title]);
		expect(sectionByTarget.get(CANDIDATE_B.title)).toBe(expectedSection);
		expect(fs.readFileSync(path.join(repo, "council", "cards", "FLLWUP-1.md"), "utf-8")).toContain(expectedSection);
	},
	5 * 60_000,
);

// ---------------------------------------------------------------------------
// Probes — T1 (path contract), T2 (forcing fires, restated), T3 (standalone),
// and the S2 prose pin
// ---------------------------------------------------------------------------

test("T1 — path contract: unprefixed fixture path falls through to packaged; the CONFIG_DIR_NAME-prefixed path resolves the fixture", () => {
	const repo = tmpRepo();
	// Negative half (the actual first-hit falsifier): a decision.json at the
	// UNPREFIXED path is silently invisible — the packaged default wins.
	fs.mkdirSync(path.join(repo, "council", "gate", "followup"), { recursive: true });
	fs.writeFileSync(
		path.join(repo, "council", "gate", "followup", "decision.json"),
		JSON.stringify(FIXTURE_DECISION),
	);
	const packagedVersion = loadFollowupDecision("/nonexistent-ev84-root").version;
	expect(loadFollowupDecision(repo).version).toBe(packagedVersion);
	// Positive half: the prefixed path resolves the fixture whole-file.
	writeFixtureGate(repo);
	expect(loadFollowupDecision(repo).version).toBe(DECISION_VERSION);
});

test("T2 — forcing fires (restated): flipping A's override Merge→Drop changes the disposition distribution and dissolves B's merged-from section; the card count stays 2→2", async () => {
	// Flipped fixture: same everything, A's override disposition Merge → Drop.
	const flippedDecision = JSON.parse(JSON.stringify(FIXTURE_DECISION)) as typeof FIXTURE_DECISION;
	flippedDecision.overrides[0]!.disposition = "Drop";

	const repo = tmpRepo();
	writeCouncilConfig(repo, "active");
	fs.mkdirSync(path.join(repo, CONFIG_DIR_NAME, "council", "gate", "followup"), { recursive: true });
	fs.writeFileSync(
		path.join(repo, CONFIG_DIR_NAME, "council", "gate", "followup", "questions.json"),
		JSON.stringify(FIXTURE_QUESTIONS),
	);
	fs.writeFileSync(
		path.join(repo, CONFIG_DIR_NAME, "council", "gate", "followup", "decision.json"),
		JSON.stringify(flippedDecision),
	);
	writeBoard(repo, true);
	const { transport } = pinnedTransport();

	const { result, lines } = await composeFollowupReview(
		CANDIDATES,
		repo,
		{ transport, apiKey: "k-test" },
		MERGE_TARGETS,
	);
	const active = expectActive(result);

	// The disposition DISTRIBUTION changes (arm 1's Merge,File,File →
	// Drop,File,File) — never a card-count delta.
	const { calls: ledgerLines } = readGateLedger(repo);
	expect(ledgerLines.map((r) => r.resolvedMode)).toEqual(["Drop", "File", "File"]);
	expect(ledgerLines[0]!.basis).toBe("duplicate? yes (verbatim duplicate)");

	// The write leg: the card count STAYS 2 (A moves Merge→Drop; B and C's
	// Files are untouched), and B's card loses its `## Merged from:` section
	// entirely — the bullet set disappears.
	const { written, sectionByTarget } = transcribeStep13(lines, CANDIDATES, repo, MERGE_TARGETS);
	expect(written).toHaveLength(2);
	expect(sectionByTarget.size).toBe(0);
	const cardsDir = path.join(repo, "council", "cards");
	const bCard = fs.readFileSync(path.join(cardsDir, "FLLWUP-1.md"), "utf-8");
	expect(bCard).not.toContain("## Merged from:");
});

test("T3 — zero-engine-write: cards/ + board.md byte-identical around composeFollowupReview; only the ledger is written", async () => {
	const repo = tmpRepo();
	writeCouncilConfig(repo, "active");
	writeFixtureGate(repo);
	writeBoard(repo, true);
	const { transport } = pinnedTransport();
	expect(fs.existsSync(gateLedgerPath(repo))).toBe(false);

	const before = snapshotTree(repo);
	await composeFollowupReview(CANDIDATES, repo, { transport, apiKey: "k-test" }, MERGE_TARGETS);
	const after = snapshotTree(repo);

	expect(after).toEqual(before);
	expect(fs.existsSync(gateLedgerPath(repo))).toBe(true); // the only mutation
});

test("S2 — write-leg convention: the helper follows the shipped step-13 prose, never vice versa", () => {
	const council = fs.readFileSync(path.join(PKG_ROOT, "council", "procedures", "council.md"), "utf-8");
	// The pin: the shipped step-13 literal exists verbatim (prose.test.ts
	// pins it too — this file's helper DERIVES from it).
	expect(council).toContain("## Merged from:\n\n- <source-title>\n- <source-title>");
	// The substitution mechanics: one bullet per source, recorded order,
	// each bullet the source candidate's title verbatim.
	expect(mergedFromSection([CANDIDATE_A.title, CANDIDATE_B.title])).toBe(
		`## Merged from:\n\n- ${CANDIDATE_A.title}\n- ${CANDIDATE_B.title}`,
	);
});
