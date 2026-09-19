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
// (the last outcome for a callId wins). The call line itself stays
// byte-frozen forever. The reader also tolerates unrecognized `kind`s so
// future record shapes never strand the file.
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

export const GATE_LEDGER_SCHEMA_VERSION = 1;

/** The transport's answer, stored verbatim: the answer-type discriminator
 * plus the rest of the payload (chosen label, score, legend, `probabilities`
 * keyed by option or index, `confidence`, or a bare `probability`) as
 * unknown fields. The ledger never smooths the differing answer shapes. */
export type GateAnswer = { type: string } & Record<string, unknown>;

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
