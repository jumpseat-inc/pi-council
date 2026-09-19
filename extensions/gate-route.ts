// EV-69 — deterministic routing to Verify mode: the pure routing read.
//
// Spec: docs/superpowers/specs/2026-09-21-EV-69-design.md §3. Sibling of
// gate-state.ts. The routing read consumes a RECORDED ledger decision rather
// than recomputing one: the verdict was computed against the card's packed
// state at intake and keyed by that state's hash; if the packed state is
// unchanged the recorded decision IS the decision, and re-calling the model
// would spend tokens to re-derive a deterministic function of frozen bytes.
//
// IMPORT FENCE (a property of the import graph, pinned by the T1 canary in
// test/gate-route.test.ts): this module may import gate-state.ts,
// gate-ledger.ts, gate.ts, and the DispatchMode type from runs.ts. It MUST
// NOT import gate-run.ts, gate-transport.ts, gate-render.ts, or gate-tool.ts
// — "no gate call from the routing read" is structural, not a tested hope.
// The ONE sanctioned gate caller is the parent-only council_route tool
// (gate-route-tool.ts), which owns the observed-set re-check's re-gate.
//
// SINGLE LITERAL SOURCE: this module contains no mode literal of its own.
// Modes come from GATE_DECISION_MODES / MODE_PANELS (gate.ts) and the
// DispatchMode union (runs.ts); the strongest-mode rank is the index in
// GATE_DECISION_MODES (Deliberate > Verify > Direct — the escalation-only
// direction). Every non-match, drift, ambiguity, unpackable card, off
// policy, and read error resolves to GATE_DECISION_MODES[0] (Deliberate)
// with a named basis; ONLY a ledger's verbatim recorded resolvedMode can
// ever produce a reduced mode from this module.
//
// This module is also the shared card-field extractor (spec §3.1): intake
// (gate-tool.ts's council_gate) and routing parse one artifact — the
// normalization below — so the intake↔routing state-hash join cannot drift
// apart by construction.
import { execFileSync } from "node:child_process";
import { readManifests, type DispatchMode, type RunManifest } from "./runs.ts";
import {
	GATE_DECISION_MODES,
	MODE_PANELS,
	decide,
	loadGateDecision,
	loadGatePolicy,
	type GateDecisionMode,
} from "./gate.ts";
import { buildGateState, type ParsedCard } from "./gate-state.ts";
import {
	readGateLedger,
	rederiveResolvedMode,
	type DecideFn,
	type GateLedgerRecord,
} from "./gate-ledger.ts";

// ---------------------------------------------------------------------------
// The card-markdown extractor — the ONLY one in the engine
// ---------------------------------------------------------------------------

/** Extract the packable card fields from card markdown: frontmatter
 * `id`/`title`/`goal` plus the `## Acceptance` section body. A missing or
 * empty field yields `""` — the function NEVER throws (an unpackable card is
 * `resolveRoute`'s classification, not a parse error: such a card can never
 * have a matching recorded record, since intake would have thrown packing
 * it). `touchedFiles` is always `[]`: a card file makes no touched-file
 * claim — the observed set is re-checked when the card runs (EV-66 Q(c)). */
export function parseCardFile(md: string): ParsedCard {
	const fmMatch = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(md);
	const fm: Record<string, string> = {};
	if (fmMatch) {
		for (const line of fmMatch[1]!.split(/\r?\n/)) {
			const i = line.indexOf(":");
			if (i <= 0) continue;
			fm[line.slice(0, i).trim()] = line
				.slice(i + 1)
				.trim()
				.replace(/^["']+|["']+$/g, "");
		}
	}
	const body = fmMatch ? md.slice(fmMatch[0].length) : md;
	return {
		id: fm["id"] ?? "",
		title: fm["title"] ?? "",
		goal: fm["goal"] ?? "",
		acceptance: extractAcceptance(body),
		touchedFiles: [],
	};
}

/** The `## Acceptance` section body: from the heading (any `#` depth pinned
 * to the two-level `## Acceptance` the card convention uses) to the next
 * `## ` heading, trimmed. Absent ⇒ "". */
function extractAcceptance(body: string): string {
	const lines = body.split(/\r?\n/);
	const start = lines.findIndex((l) => /^##\s+Acceptance\s*$/.test(l.trim()));
	if (start === -1) return "";
	const rest = lines.slice(start + 1);
	const end = rest.findIndex((l) => /^##\s/.test(l.trim()));
	const section = (end === -1 ? rest : rest.slice(0, end)).join("\n").trim();
	return section;
}

/** The shared extractor's tool-param normalization — the ONE place card
 * fields are validated, used by intake (council_gate) and by any caller
 * holding raw field values. Fail-loud naming the field, byte-identical to
 * the intake tool's historical messages so the EV-66 tool tests legitimately
 * stay put. Preserves the `touchedFiles ?? []` contract (R(c)): an absent
 * touchedFiles carries NO touched-file claim. */
export function normalizeCardInput(
	card: { id?: unknown; title?: unknown; goal?: unknown; acceptance?: unknown; touchedFiles?: unknown },
	slot: string,
): ParsedCard {
	for (const field of ["id", "title", "goal", "acceptance"] as const) {
		const v = card[field];
		if (typeof v !== "string" || v.trim() === "") {
			throw new Error(`gate: ${slot}.${field} must be a non-empty string, found ${JSON.stringify(v)}`);
		}
	}
	if (card.touchedFiles !== undefined) {
		if (!Array.isArray(card.touchedFiles)) {
			throw new Error(
				`gate: ${slot}.touchedFiles must be an array of { path, linesChanged }, found ${JSON.stringify(card.touchedFiles)}`,
			);
		}
		(card.touchedFiles as unknown[]).forEach((t, i) => {
			const entry = t as { path?: unknown; linesChanged?: unknown };
			if (typeof entry?.path !== "string" || entry.path.trim() === "") {
				throw new Error(`gate: ${slot}.touchedFiles[${i}].path must be a non-empty string, found ${JSON.stringify(entry?.path)}`);
			}
			if (typeof entry?.linesChanged !== "number" || !Number.isInteger(entry.linesChanged) || entry.linesChanged <= 0) {
				throw new Error(
					`gate: ${slot}.touchedFiles[${i}].linesChanged must be a positive integer, found ${JSON.stringify(entry?.linesChanged)}`,
				);
			}
		});
	}
	return {
		id: card.id as string,
		title: card.title as string,
		goal: card.goal as string,
		acceptance: card.acceptance as string,
		touchedFiles:
			card.touchedFiles === undefined
				? []
				: (card.touchedFiles as ParsedCard["touchedFiles"]),
	};
}

/** The roster a mode dispatches (R4's mapping) — MODE_PANELS is the single
 * source; the tool surfaces it so the facilitator never re-derives seating
 * from prose. */
export function panelFor(mode: DispatchMode): readonly string[] {
	return MODE_PANELS[mode as GateDecisionMode];
}

// ---------------------------------------------------------------------------
// The routing read
// ---------------------------------------------------------------------------

export interface RouteResult {
	mode: DispatchMode;
	source: "recorded" | "fallback" | "full-unpackable";
	/** Present on the recorded and re-checked paths: the packed-state hash the
	 * decision was matched (or rebuilt) against. */
	stateHash?: string;
	/** Present on the recorded path: the matched call line's callId. */
	matchedCallId?: string;
	/** The named basis — never silent, never a bare mode token, and never in
	 * the decisionLine render shape (that format expression belongs to
	 * gate-ledger.ts alone; EV-67 pins it). */
	basis: string;
}

/** The routing read: pure-with-fs, NO model call in any branch, ever.
 * Rules in order (spec §3.2):
 *   1. gate off ⇒ fallback full, before any state build (an off-mode policy
 *      may omit the state budget — the off check precedes the packer, which
 *      would otherwise throw);
 *   2. card not packable ⇒ full-unpackable with the packer's named basis;
 *   3. hash the FULL packed state (card + touchedFiles([]) + wiki + rulings
 *      + tests) — unchanged packed state is the contract; unchanged card
 *      text is necessary but not sufficient;
 *   4. select valid recorded call lines for that hash: policyVersion equal
 *      to the current decision policy AND the mode re-derives from the line
 *      alone; invalid lines are dropped, never thrown on;
 *   5. no valid match ⇒ fallback full, and NO gate call is issued by the
 *      routing read — re-gating a drifted state is the next intake's job;
 *   6. agreeing matches ⇒ latest in file order wins (file order, never
 *      recordedAt — injectable clocks; same-bytes duplicates are expected
 *      re-measurements);
 *   7. disagreeing matches ⇒ the strongest valid mode wins (Deliberate >
 *      Verify > Direct) — a later disagreeing line for an identical hash is
 *      evidence the decision is unstable, and taking the newest silently
 *      would resolve that instability toward the cheaper mode;
 *   8. a matching failed-call record (failure.class present, fail-closed
 *      Deliberate) is a valid recorded decision used verbatim. */
export function resolveRoute(card: ParsedCard | string, repoRoot: string): RouteResult {
	const parsed = typeof card === "string" ? parseCardFile(card) : card;

	// 1. off is silent — before the state build, before the budget load.
	if (loadGatePolicy(repoRoot).mode === "off") {
		return { mode: GATE_DECISION_MODES[0], source: "fallback", basis: "gate mode off — no recorded decision" };
	}

	// 2. packable? The packer throws on any empty field; the thrown message is
	// the named basis (full path, no hash, no ledger read, no gate call).
	let state;
	try {
		state = buildGateState(parsed, repoRoot);
	} catch (e) {
		return {
			mode: GATE_DECISION_MODES[0],
			source: "full-unpackable",
			basis: e instanceof Error ? e.message : String(e),
		};
	}

	// 3–4. valid recorded lines for this packed state.
	const decisionPolicy = loadGateDecision(repoRoot);
	const decideFn: DecideFn = (answers) => decide(answers, decisionPolicy).mode;
	const matching = readGateLedger(repoRoot).calls.filter((c) => c.stateHash === state.stateHash);
	const valid: GateLedgerRecord[] = [];
	let policyDrift: string | undefined;
	let rederiveDrift: string | undefined;
	for (const record of matching) {
		if (record.policyVersion !== decisionPolicy.version) {
			policyDrift =
				`recorded decision for this state uses policyVersion ${JSON.stringify(record.policyVersion)}, current decision policy is ${JSON.stringify(decisionPolicy.version)} — routes full`;
			continue;
		}
		let rederived: string;
		try {
			rederived = rederiveResolvedMode(record, decideFn);
		} catch {
			rederiveDrift = "recorded decision for this state does not re-derive under the current decision policy — routes full";
			continue;
		}
		if (rederived !== record.resolvedMode || !(GATE_DECISION_MODES as readonly string[]).includes(record.resolvedMode)) {
			rederiveDrift = "recorded decision for this state does not re-derive under the current decision policy — routes full";
			continue;
		}
		valid.push(record);
	}

	// 5. no valid match ⇒ fallback full, never a gate call from this read.
	if (valid.length === 0) {
		return {
			mode: GATE_DECISION_MODES[0],
			source: "fallback",
			basis: policyDrift ?? rederiveDrift ?? "no recorded decision for the current packed state",
		};
	}

	// 6–7. Agreeing ⇒ latest file order; disagreeing ⇒ strongest valid mode.
	// Unified: the strongest valid mode wins; ties are broken by latest file
	// order (for agreeing lines strongest === the agreed mode, so the last
	// line wins — exactly rule 6).
	const strongestMode = valid.map((r) => asMode(r.resolvedMode)).reduce((a, b) => strongest(a, b));
	const chosen = valid.filter((r) => asMode(r.resolvedMode) === strongestMode).at(-1)!;
	const disagreeing = valid.some((r) => r.resolvedMode !== valid[valid.length - 1]!.resolvedMode);
	const basis = disagreeing
		? `recorded decisions for this state disagree (${valid.map((r) => r.resolvedMode).join(", ")}) — the strongest valid mode holds`
		: `recorded decision (call ${chosen.callId}): ${chosen.basis ?? "(no basis on the line)"}`;
	return {
		mode: asMode(chosen.resolvedMode),
		source: "recorded",
		stateHash: state.stateHash,
		matchedCallId: chosen.callId,
		basis,
	};
}

function asMode(v: string): GateDecisionMode {
	return GATE_DECISION_MODES.find((m) => m === v) ?? GATE_DECISION_MODES[0];
}

// ---------------------------------------------------------------------------
// The observed-set re-check predicate + the escalation-only ratchet
// ---------------------------------------------------------------------------

/** The pure call-gating predicate for the re-check: a re-gate call is owed
 * exactly when the rebuilt (observed) packed-state hash differs from the
 * matched record's hash. What the override fires on is decided by the model
 * call the TOOL layer issues — never by a file-set-derived heuristic here. */
export function recheckOwed(matchedStateHash: string, rebuiltStateHash: string): boolean {
	return rebuiltStateHash !== matchedStateHash;
}

/** The escalation-only ratchet clamp: the stronger of two modes under
 * Deliberate > Verify > Direct (the GATE_DECISION_MODES order — never a
 * MODE_PANELS set-difference, which would misread the dual-role
 * product-owner seat). A re-gate may move the mode toward greater
 * deliberation, never below it. */
export function strongest(a: GateDecisionMode, b: GateDecisionMode): GateDecisionMode {
	return GATE_DECISION_MODES.indexOf(a) <= GATE_DECISION_MODES.indexOf(b) ? a : b;
}

// ---------------------------------------------------------------------------
// The observed touched-file set
// ---------------------------------------------------------------------------

/** The observed touched-file set: paths in the branch diff at the pinned
 * head SHA — `git diff --name-only <base>..<headSha>` where `<base>` is the
 * merge-base of `origin/main` and `headSha`. Executed READ-ONLY in the
 * checkout (diffs mutate no branch state); commit-range form with the base
 * pinned; no working-tree read, never ambient `git status` (EV-64's
 * explicit-input rule). `origin/main` is resolved ONCE at run start and
 * never re-fetched mid-card; the base is pinned then. Paths are
 * repo-root-relative. */
export function observedTouchedFiles(repoRoot: string, headSha: string): string[] {
	const git = (args: string[]): string =>
		execFileSync("git", ["-C", repoRoot, ...args], { encoding: "utf-8" }).trim();
	let base: string;
	try {
		base = git(["merge-base", "origin/main", headSha]);
	} catch (e) {
		throw new Error(
			`gate-route: observed-set read failed — cannot resolve the merge-base of origin/main and ${headSha} (origin/main is pinned at run start): ${e instanceof Error ? e.message : String(e)}`,
		);
	}
	let diff: string;
	try {
		diff = git(["diff", "--name-only", `${base}..${headSha}`]);
	} catch (e) {
		throw new Error(
			`gate-route: observed-set read failed — git diff --name-only ${base}..${headSha}: ${e instanceof Error ? e.message : String(e)}`,
		);
	}
	return diff
		.split("\n")
		.map((l) => l.trim())
		.filter((l) => l !== "");
}

/** Per-path changed-line counts for the observed set, from `git diff
 * --numstat <base>..<head>` — the honest { path, linesChanged } entries the
 * rebuilt packed state records (a binary file's "-" counts as 1: the hash
 * depends on the packed bytes; the count must exist and be honest). */
export function observedTouchedEntries(repoRoot: string, headSha: string): ParsedCard["touchedFiles"] {
	const base = execFileSync("git", ["-C", repoRoot, "merge-base", "origin/main", headSha], { encoding: "utf-8" }).trim();
	const numstat = execFileSync("git", ["-C", repoRoot, "diff", "--numstat", `${base}..${headSha}`], { encoding: "utf-8" });
	return numstat
		.split("\n")
		.map((l) => l.trim())
		.filter((l) => l !== "")
		.map((l) => {
			const [added, deleted, ...rest] = l.split("\t");
			const p = rest.join("\t");
			const n = (s: string | undefined): number => (s !== undefined && /^\d+$/.test(s) ? Number(s) : 1);
			return { path: p, linesChanged: Math.max(1, n(added) + n(deleted)) };
		});
}

// ---------------------------------------------------------------------------
// The mode authority — card-scoped subtree read (spec §3.4)
// ---------------------------------------------------------------------------

/** The deliberation-generator seats — the ONLY dispatch presence that makes
 * a card's effective mode Deliberate. Explicitly NOT MODE_PANELS.Deliberate
 * minus MODE_PANELS.Verify: product-owner is dual-role (a Deliberate panel
 * seat AND the escalation ruling seat dispatchable on a Verify card), and a
 * set-difference derivation would misclassify an escalated Verify card. */
const GENERATOR_SEATS: readonly string[] = ["principal", "designer", "consolidator"];

/** The outcome of the card-scoped mode read: a present mode, or the two
 * absence reasons distinguished — `no-root` (the fail-safe EV-69 throw) vs
 * `no-recorded-mode` (EV-70's merge-check HALT for an uninferrable mode).
 * The EV-70 merge check needs the distinction WITHOUT string-matching an
 * error message, so the pure core returns it. */
export type CardModeRead =
	| { present: true; mode: DispatchMode }
	| { present: false; reason: "no-root" | "no-recorded-mode" };

/** The pure core of the mode authority for the merge check: a card-scoped
 * subtree read over the run's manifests (pass readManifests' output). Locate
 * the ROOT manifest(s) with `id === runnerJobId` (escalation re-entry
 * dispatches a fresh runner, so a card may have several ROOTs — pass them
 * all; a single id is the common case), union ONLY those subtrees (a
 * /council-eval stray dispatch or a sibling card's forest is structurally
 * excluded), and resolve: Deliberate iff the union contains ≥1 generator
 * dispatch; otherwise the strongest ROOT mode stands (multiple ROOTs fail
 * toward the stronger mode). Absent ROOT or absent mode ⇒ the named absence
 * reason — a fail-safe for the merge check, never a reduced fallback. Pure
 * over the manifest list; reads nothing else. */
export function readCardMode(manifests: readonly RunManifest[], runnerJobIds: readonly string[]): CardModeRead {
	const roots = manifests.filter((m) => runnerJobIds.includes(m.id));
	if (roots.length === 0) return { present: false, reason: "no-root" };
	const inSubtree = new Set<string>();
	const collect = (id: string): void => {
		if (inSubtree.has(id)) return;
		inSubtree.add(id);
		for (const child of manifests.filter((m) => m.parentJobId === id)) collect(child.id);
	};
	for (const root of roots) collect(root.id);
	if (manifests.some((m) => inSubtree.has(m.id) && GENERATOR_SEATS.includes(m.seat))) {
		return { present: true, mode: GATE_DECISION_MODES[0] };
	}
	const rootModes = roots
		.map((r) => r.mode)
		.filter((m): m is DispatchMode => m !== undefined && (GATE_DECISION_MODES as readonly string[]).includes(m));
	if (rootModes.length === 0) return { present: false, reason: "no-recorded-mode" };
	return { present: true, mode: rootModes.reduce((a, b) => strongest(a as GateDecisionMode, b as GateDecisionMode)) };
}

/** The mode authority for the merge check: the disk-path wrapper over
 * readCardMode. ROOT absent ⇒ throw with a named basis — a fail-safe
 * HALT/full for the merge check, never a reduced fallback. */
export function effectiveModeForCard(
	repoRoot: string,
	runId: string,
	runnerJobIds: string | readonly string[],
): DispatchMode {
	const ids = typeof runnerJobIds === "string" ? [runnerJobIds] : [...runnerJobIds];
	const read = readCardMode(readManifests(repoRoot, runId), ids);
	if (read.present) return read.mode;
	if (read.reason === "no-root") {
		throw new Error(
			`gate-route: authority — no ROOT manifest for runnerJobId(s) ${ids.join(", ")} in run ${runId} — the merge check cannot read a recorded execution mode`,
		);
	}
	throw new Error(
		`gate-route: authority — no recorded execution mode on any ROOT for runnerJobId(s) ${ids.join(", ")} in run ${runId}`,
	);
}
