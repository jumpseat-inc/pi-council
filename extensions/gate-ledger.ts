// EV-61 — the durable gate ledger: the record schema, an append-only
// JSONL writer, and a tolerant reader for the metered-deliberation gate's
// decision records (EPIC-13; the gate itself is EV-63/EV-65 — this is the
// substrate it writes to).
//
// Placement (settled by the card, not a convention amendment): repo-scoped
// durable telemetry at `<repo>/$CONFIG_DIR_NAME/council/gate-ledger.jsonl` —
// outside the pruned run directory (`extensions/runs.ts`), appended to and
// never rewritten, and committed by default (no .gitignore rule covers it;
// verified at implementation time with `git check-ignore -v`, exit 1). The
// reader NEVER reads the pruned run directory — the accessor-discipline test
// pins this (the test/cost-baseline.test.ts precedent).
//
// Write mechanics: each record is fully pre-serialized to one line
// (`JSON.stringify(record) + "\n"`) and appended with a single
// `fs.appendFileSync` (one O_APPEND write — as atomic as an append gets).
// A crash mid-append can leave a torn trailing line; the reader skips
// unparseable lines rather than throwing, so the file stays readable.
//
// Failure posture: an append that fails throws an Error whose message names
// the ABSOLUTE target path — reported, never dropped silently; the caller
// surfaces it.
//
// Outcome design choice: the file is append-only and never rewritten, so an
// outcome arriving after the call cannot be spliced into the call's line.
// The outcome joins the call's record as a FOLLOW-ON `kind: "outcome"` line
// keyed on `callId`; the reader attaches it to the matching call record
// (the last outcome for a callId wins). The outcome line stays what EV-61
// built it to be: the follow-on record for what happened after the card ran
// (EV-65's product-owner ruling Q1: no card puts a call-time fact at
// `record.outcome.*`). The reader also tolerates unrecognized `kind`s so
// future record shapes never strand the file.
//
// Call-line shape (EV-65, PO ruling Q1): schemaVersion is 2. The call-time
// union — basis, the versioned reported model, provider, usage, generation
// id, failure {class}, drops, advisory, unknownAnswerIds — rides the call
// line ATOMICALLY in the one appendGateCall write; EV-65's runGate writes
// exactly ONE ledger line per call and NO outcome line. The bump is
// additive and the reader stays tolerant: no schemaVersion validation, no
// rewrite or re-serialization of existing lines; mixed v1/v2 files read
// with identical rederiveResolvedMode (kept as a test, not an assumption).
//
// The record carries the goal's fields verbatim — stateHash,
// questionSetVersion, every answer with its probabilities and confidence
// (an asked-but-unanswered question is recorded as `null`, never as a
// zero), the resolved mode, and the policyVersion — which is what makes a
// recorded call recomputable offline: `rederiveResolvedMode` re-runs the
// (future, EV-63) pure decision function over ONLY the stored line.
import * as fs from "node:fs";
import * as path from "node:path";
import { randomUUID } from "node:crypto";
import { CONFIG_DIR_NAME } from "@earendil-works/pi-coding-agent";

export const GATE_LEDGER_SCHEMA_VERSION = 2;

/** The transport's answer, stored verbatim: the answer-type discriminator
 * plus the rest of the payload (chosen label, score, legend, `probabilities`
 * keyed by option or index, `confidence`, or a bare `probability`) as
 * unknown fields. The ledger never smooths the differing answer shapes. */
export type GateAnswer = { type: string } & Record<string, unknown>;

/** EV-65 v2 call-line usage block (provider-reported; null = not carried). */
export interface GateUsage {
	input_tokens: number | null;
	output_tokens: number | null;
	cost: number | null;
}

/** EV-65 v2 call-line drop record — structurally identical to
 * gate-state.ts's DropRecord (the type-only import edge forbids importing
 * it here). */
export interface GateDropRecord {
	section: string;
	truncated: false | "cap" | "budget";
	kept: number;
	measuredTokens: number;
}

export interface GateLedgerRecord {
	schemaVersion: number; // GATE_LEDGER_SCHEMA_VERSION; self-describing standalone
	kind: "call";
	/** Write-time identity the follow-on outcome line keys on. */
	callId: string;
	/** The packed card state's hash. */
	stateHash: string;
	questionSetVersion: string;
	/** Every question asked, keyed by id: the verbatim answer, or `null` for
	 * an asked-but-unanswered question — absent, never a zero. */
	answers: Record<string, GateAnswer | null>;
	/** The mode the pure decision function resolved (Deliberate/Verify/Direct
	 * per EV-63; stored as a string so the ledger never couples to the mode
	 * vocabulary's evolution). */
	resolvedMode: string;
	policyVersion: string;
	/** ISO-8601 write clock. */
	recordedAt: string;
	// --- EV-65 v2 call-time union (PO ruling Q1): additive, written by
	// runGate's single append, all optional-tolerant on read. ---
	/** The decision basis: the decide()-derived composite on success,
	 * `"gate call failed: " + <verbatim transport reason>` on failure. The
	 * verbatim reason occurs EXACTLY ONCE in the record — there is no
	 * `failure.reason` field (only `failure {class}`).
	 * `"Mode: " + resolvedMode + " — " + basis` byte-equals EV-67's pinned
	 * render. */
	basis?: string;
	/** The versioned model the response reported. */
	model?: string | null;
	provider?: string | null;
	usage?: GateUsage | null;
	generationId?: string | null;
	/** The machine failure-class tag — present only on a failed call. */
	failure?: { class: string };
	/** The state packer's drop records (the estimator's measuredTokens next
	 * to the provider's usage.input_tokens on the same line). */
	drops?: GateDropRecord[];
	/** Advisory-mode marker (the gate ran in advisory mode). */
	advisory?: boolean;
	/** Response answer ids not in the question set (dropped from answers). */
	unknownAnswerIds?: string[];
	/** Joined at read time from the call's follow-on outcome line(s) — never
	 * rewritten into this line. */
	outcome?: Record<string, unknown>;
}

export interface GateOutcomeRecord {
	schemaVersion: number;
	kind: "outcome";
	/** The callId of the call this outcome belongs to. */
	callId: string;
	outcome: Record<string, unknown>;
	recordedAt: string;
}

/** The committed-by-default ledger path: repo-scoped, under the council
 * config dir, outside the pruned run directory. */
export function gateLedgerPath(repoRoot: string): string {
	return path.join(repoRoot, CONFIG_DIR_NAME, "council", "gate-ledger.jsonl");
}

export interface GateCallInput {
	stateHash: string;
	questionSetVersion: string;
	/** Every question id the call asked — an id without an answer is recorded
	 * as `null` (absent), never a zero. */
	questionIds: readonly string[];
	/** The transport's answers, keyed by question id; stored verbatim. */
	answers: Record<string, GateAnswer>;
	resolvedMode: string;
	policyVersion: string;
	/** Injectable write clock (default wall-clock ISO). */
	now?: () => string;
	/** Injectable identity (default randomUUID). */
	callId?: string;
	// --- EV-65 v2 call-time union (all optional; written by runGate). ---
	basis?: string;
	model?: string | null;
	provider?: string | null;
	usage?: GateUsage | null;
	generationId?: string | null;
	/** The machine failure-class tag, present only on a failed call. */
	failureClass?: string;
	drops?: GateDropRecord[];
	advisory?: boolean;
	unknownAnswerIds?: string[];
}

/** Append one call record. Fully pre-serialized, then a single append write;
 * a failure throws naming the absolute target path. */
export function appendGateCall(input: GateCallInput, repoRoot: string, ledgerPath: string = gateLedgerPath(repoRoot)): GateLedgerRecord {
	const answers: Record<string, GateAnswer | null> = { ...input.answers };
	for (const id of input.questionIds) {
		if (!(id in answers)) answers[id] = null; // absent, never a zero
	}
	const record: GateLedgerRecord = {
		schemaVersion: GATE_LEDGER_SCHEMA_VERSION,
		kind: "call",
		callId: input.callId ?? randomUUID(),
		stateHash: input.stateHash,
		questionSetVersion: input.questionSetVersion,
		answers,
		resolvedMode: input.resolvedMode,
		policyVersion: input.policyVersion,
		recordedAt: (input.now ?? (() => new Date().toISOString()))(),
	};
	// EV-65 v2 union — written ATOMICALLY with the v1 fields in the one
	// append below; absent optional fields stay absent (never null-filled).
	if (input.basis !== undefined) record.basis = input.basis;
	if (input.model !== undefined) record.model = input.model;
	if (input.provider !== undefined) record.provider = input.provider;
	if (input.usage !== undefined) record.usage = input.usage;
	if (input.generationId !== undefined) record.generationId = input.generationId;
	if (input.failureClass !== undefined) record.failure = { class: input.failureClass };
	if (input.drops !== undefined) record.drops = input.drops;
	if (input.advisory !== undefined) record.advisory = input.advisory;
	if (input.unknownAnswerIds !== undefined) record.unknownAnswerIds = input.unknownAnswerIds;
	appendLine(ledgerPath, record);
	return record;
}

export interface GateOutcomeInput {
	callId: string;
	outcome: Record<string, unknown>;
	now?: () => string;
}

/** Append one follow-on outcome record for a previously recorded call. */
export function appendGateOutcome(input: GateOutcomeInput, repoRoot: string, ledgerPath: string = gateLedgerPath(repoRoot)): GateOutcomeRecord {
	const record: GateOutcomeRecord = {
		schemaVersion: GATE_LEDGER_SCHEMA_VERSION,
		kind: "outcome",
		callId: input.callId,
		outcome: input.outcome,
		recordedAt: (input.now ?? (() => new Date().toISOString()))(),
	};
	appendLine(ledgerPath, record);
	return record;
}

// ---------------------------------------------------------------------------
// Reader + re-derivation seam
// ---------------------------------------------------------------------------

/** The seam EV-63's pure `decide` plugs into: a pure function of the stored
 * answers and the policy version, with no fs and no network. Re-derivation
 * never re-runs the model — the line is the record. */
export type DecideFn = (answers: Record<string, GateAnswer | null>, policyVersion: string) => string;

/** Re-derive a recorded call's resolved mode from ONLY the stored line:
 * the answers (absent as `null`) and the policyVersion. Pure. */
export function rederiveResolvedMode(record: GateLedgerRecord, decide: DecideFn): string {
	return decide(record.answers, record.policyVersion);
}

// EV-67 — the one decision-line format. The doc comment on `basis` above
// staked the byte-equality claim; this function makes it executable: the
// render is EXACTLY the record's two fields, never prose authored at render
// time, so the line a person reads and the ledger record they can audit
// cannot drift apart. gate-ledger.ts is the ONLY module in the repo owning a
// `Mode: `-prefixed format expression.
//
// A′ (the ruling's addendum): a v1 ledger line carries no `basis` — the
// nullish-coalescing fold renders the mode token ALONE, so no `undefined`,
// `null`, or `NaN` byte can ever appear (an empty string is treated as
// absent for the same reason: a dangling separator is a lie about a basis
// that is not there).
export function decisionLine(record: { resolvedMode: string; basis?: string }): string {
	const basis = record.basis ?? "";
	return basis === "" ? `Mode: ${record.resolvedMode}` : `Mode: ${record.resolvedMode} — ${basis}`;
}

export interface ReadGateLedgerResult {
	calls: GateLedgerRecord[];
	/** Outcome lines whose callId has no matching call in the file. */
	orphanOutcomes: GateOutcomeRecord[];
}

/** Read the ledger, never throwing: blank and unparseable (torn-tail) lines
 * are skipped (the tolerant read precedent of the run-manifest reader),
 * unrecognized `kind`s are ignored (future record shapes never strand the
 * file), and each call's last follow-on outcome is joined onto its record.
 * Reads ONLY the ledger path — never the pruned run directory. */
export function readGateLedger(repoRoot: string, ledgerPath: string = gateLedgerPath(repoRoot)): ReadGateLedgerResult {
	const calls: GateLedgerRecord[] = [];
	const orphanOutcomes: GateOutcomeRecord[] = [];
	if (!fs.existsSync(ledgerPath)) return { calls, orphanOutcomes };
	for (const line of fs.readFileSync(ledgerPath, "utf-8").split("\n")) {
		if (line.trim() === "") continue;
		let rec: unknown;
		try {
			rec = JSON.parse(line);
		} catch {
			continue; // torn tail / corrupt line → skip, never throw
		}
		if (!rec || typeof rec !== "object" || !("kind" in rec)) continue;
		if (rec.kind === "call") {
			calls.push(rec as unknown as GateLedgerRecord);
		} else if (rec.kind === "outcome") {
			const out = rec as unknown as GateOutcomeRecord;
			const call = calls.find((c) => c.callId === out.callId);
			if (call) call.outcome = out.outcome; // last outcome wins
			else orphanOutcomes.push(out);
		}
		// unrecognized kind → tolerated, ignored
	}
	return { calls, orphanOutcomes };
}

function appendLine(ledgerPath: string, record: GateLedgerRecord | GateOutcomeRecord): void {
	fs.mkdirSync(path.dirname(ledgerPath), { recursive: true });
	const line = JSON.stringify(record) + "\n";
	try {
		fs.appendFileSync(ledgerPath, line, "utf-8");
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		throw new Error(`gate-ledger: write failed for ${ledgerPath}: ${msg}`);
	}
}
