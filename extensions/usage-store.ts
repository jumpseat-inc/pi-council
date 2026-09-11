// EV-31: durable usage store outside the pruned run directory, with session
// provenance. The I/O sibling of the pure spend.ts, following the
// mcp/auth-store.ts pattern: a getAgentDir()-derived default path as a default
// parameter, atomic tmp+rename, explicit chmod so modes hold regardless of
// umask.
//
// The store lives at getAgentDir()/council/usage/ (Phase 1 ruling R-3) —
// outside runsDir(repoRoot), which pruneRuns deletes — so a record written
// here survives run-directory pruning. One record per completed invocation,
// keyed on the invocation marker's `at` (the store key is the invocation
// identity, so choose-once is structural and survives process restarts): an
// existing file is refused, never overwritten, never recomputed.
//
// The record wraps EV-30's SpendRecord byte-verbatim — SpendRecord gains no
// field (spec §2.3). Read-back (resolveProvenance) is a never-throwing pure
// function deriving the five-value ResolveOutcome from the stored write-time
// fact (pointerSurvivable) and the session file's present state; the outcome
// is never stored (it goes stale — the card's step-6 ruling).
import * as fs from "node:fs";
import * as path from "node:path";
import {
	getAgentDir,
	parseSessionEntries,
	type SessionEntry,
} from "@earendil-works/pi-coding-agent";
import {
	fetchProviderReport,
	openRouterGenerationTransport,
	resolveOpenRouterApiKey,
	type FetchGeneration,
	type ProviderCostReport,
} from "./provider-cost.ts";
import { spendRecord, type SpendRecord } from "./spend.ts";
import { formatUsageBlock } from "./usage-block.ts";
import { findSessionFile, readManifests, runsDir } from "./runs.ts";

/** Ruling D: the wrapper's schema gains the EV-29 provider sibling. `spend`
 * is untouched — EV-31's freeze covers `spend`, not the wrapper. */
export const USAGE_RECORD_SCHEMA_VERSION = 2;

export type UsageTrigger = "forest-settle" | "agent-settled" | "session-shutdown";

export interface UsageProvenance {
	/** The invoking session (getSessionId()) — never a child job id. */
	sessionId: string;
	/** Absolute path of the invoking session's JSONL; null = unresolvable at write (never fabricated). */
	sessionPath: string | null;
	/** Mirrors SpendBoundary. */
	firstEntryId: string | null;
	/** Mirrors SpendBoundary. */
	lastEntryId: string | null;
	/** Mirrors SpendBoundary.resolved. */
	boundaryResolved: boolean;
	/** Write-time fact (ruling item 1 semantics): true iff the session file
	 * existed AND was outside runsDir(repoRoot) at write time — i.e. pruning
	 * was never expected to remove it. Never derived at read; never stored for
	 * present-tense resolution. */
	pointerSurvivable: boolean;
}

export interface StoredUsageRecord {
	schemaVersion: number; // USAGE_RECORD_SCHEMA_VERSION; records are self-describing standalone
	spend: SpendRecord; // EV-30's record, byte-verbatim — never extended
	provenance: UsageProvenance;
	runId: string;
	command: string;
	repoRoot: string;
	/** ISO-8601 write clock — the invocation time lives on the key, not here. */
	writtenAt: string;
	basis: { trigger: UsageTrigger; manifestsObserved: number };
	/** EV-29 sibling (ruling D): the provider-reported figures, present only
	 * when an OpenRouter-modelled seat ran in the invocation window. Absent on
	 * non-OpenRouter runs and pre-EV-29 v1 records. */
	provider?: ProviderCostReport;
}

/** The ruling's five values; read-time only, never stored. */
export type ResolveOutcome =
	| "resolved"
	| "pruned-expected"
	| "missing-unexpected"
	| "no-session-file"
	| "range-missing";

export function usageStoreDir(): string {
	return path.join(getAgentDir(), "council", "usage");
}

/** R-3 byte-exact: <ISO-basic>_<runId>_<command>.json. ISO-basic is rendered
 * from the marker's `at` as YYYYMMDDThhmmssSSS (UTC, no separators, no Z,
 * milliseconds kept — they are the same-millisecond collision margin). The
 * prefix is the invocation's time, not the write time; the record body's
 * `writtenAt` carries write-time honesty. */
export function usageRecordName(markerAtMs: number, runId: string, command: string): string {
	const d = new Date(markerAtMs);
	const p = (n: number, w: number) => String(n).padStart(w, "0");
	const isoBasic =
		`${d.getUTCFullYear()}${p(d.getUTCMonth() + 1, 2)}${p(d.getUTCDate(), 2)}` +
		`T${p(d.getUTCHours(), 2)}${p(d.getUTCMinutes(), 2)}${p(d.getUTCSeconds(), 2)}${p(d.getUTCMilliseconds(), 3)}`;
	return `${isoBasic}_${runId}_${command}.json`;
}

/** Shipped as a template-literal constant (asserted via the constant in
 * tests), not a PKG_ROOT asset — a new resource mechanism the conventions
 * caution against. Shelf order per spec §2.6. */
export const USAGE_README = `# Council usage records

Durable store of council usage: one JSON file per completed council
invocation, written once and never rewritten. Read-back is supported — every
record names the session and the entry range its numbers were derived from,
and the pointer is resolved on read (five outcomes below). Empty state: only
this README present means first invocation pending — nothing recorded yet.

## The two halves are different kinds of number

Each record's \`spend\` has two halves with different accounting bases.
\`ownSession\` is \`usageSource: "session-reconciled"\` — a full reconciliation
of the session's active chain from the invocation boundary onward. \`subtree\`
is \`usageSource: "stream-assistant"\` — a **lower bound** projected from the
child-job manifests' assistant stream, not a reconciliation. Never read them
as the same measurement.

## Filenames

\`<ISO-basic>_<runId>_<command>.json\`. The timestamp prefix is the
**invocation** time (stamped on the session's council-invocation marker), not
the write time; the record's \`writtenAt\` field carries the write time, and
\`basis.trigger\` / \`basis.manifestsObserved\` carry what the write observed.

## Provenance and read-back outcomes

Each record carries \`provenance\`: the absolute path of the invoking session's
JSONL plus \`firstEntryId\` / \`lastEntryId\`, the entry ids bounding the range
the spend was derived from (they explain \`ownSession\` exhaustively and
\`subtree\`'s time window; the manifests that grounded \`subtree\` live under
the pruned run directory). Resolving the pointer on read yields one of five
outcomes: \`resolved\` (file present, both ids found), \`pruned-expected\`
(the session file was inside the run directory at write time, so its absence
after pruning is by design), \`missing-unexpected\` (the file should have
survived and did not — a defect signal), \`no-session-file\` (no session file
existed at write time), \`range-missing\` (file present but the ids are not in
it, e.g. after a partial backup). Read-back never throws.

## Failures

A record that cannot be written (for example the directory is not writable)
is reported, never dropped silently, and the report names the absolute target
path.

## What this is not

This is not the run-transcript store (the repo's council runs directory —
ephemeral, pruned to the last 15 runs), not the MCP secret store
(\`mcp-auth.json\`), and not a transcript log: it holds exactly one immutable
summary record per completed council invocation.
`;

/** Idempotent store-root creation (R-3 modes): directory 0700, README 0600
 * written once, non-clobberingly (a second call never rewrites it). */
export function ensureUsageDir(storeRoot: string = usageStoreDir()): void {
	fs.mkdirSync(storeRoot, { recursive: true });
	fs.chmodSync(storeRoot, 0o700); // explicit: the mode must hold regardless of umask
	const readme = path.join(storeRoot, "README.md");
	if (!fs.existsSync(readme)) {
		const tmp = `${readme}.tmp-${process.pid}`;
		fs.writeFileSync(tmp, USAGE_README, { mode: 0o600 });
		fs.chmodSync(tmp, 0o600);
		fs.renameSync(tmp, readme);
	}
}

/** The ruling's operative semantics (the card's drafting note documents the
 * literal formula fragment as arithmetically inverted; gloss + mapping win):
 * true iff the session file was outside the pruned run dir at write time. */
export function pointerSurvivableAtWrite(repoRoot: string, sessionPath: string | null): boolean {
	if (sessionPath === null) return false;
	return path.relative(runsDir(repoRoot), sessionPath).startsWith("..");
}

export interface PersistUsageInput {
	spend: SpendRecord;
	sessionId: string;
	/** ctx.sessionManager.getSessionFile() ?? null — never fabricated. */
	sessionPath: string | null;
	runId: string;
	command: string;
	repoRoot: string;
	/** The invocation marker's `at` — the store key's clock. */
	markerAt: number;
	trigger: UsageTrigger;
	manifestsObserved: number;
	/** EV-29: the provider report, copied only when defined (absent ⇒ a record
	 * byte-identical to v1 modulo schemaVersion — never fabricated). */
	provider?: ProviderCostReport;
	/** Injectable write clock (default wall-clock ISO). */
	now?: () => string;
}

export interface PersistResult {
	file: string;
	record: StoredUsageRecord;
	written: boolean;
}

/** Write one invocation's usage record. Choose-once (spec §2.4): the key is
 * the marker's `at` + runId + command; an existing file is returned unchanged
 * (`written: false`) — never overwritten, never recomputed. The record file
 * is written atomically (tmp+rename) at mode 0600. Throws on an unwritable
 * store — the caller catches per record and surfaces the absolute path. */
export function persistInvocationUsage(input: PersistUsageInput, storeRoot: string = usageStoreDir()): PersistResult {
	ensureUsageDir(storeRoot);
	const file = path.join(storeRoot, usageRecordName(input.markerAt, input.runId, input.command));
	if (fs.existsSync(file)) {
		const existing = JSON.parse(fs.readFileSync(file, "utf-8")) as StoredUsageRecord;
		return { file, record: existing, written: false };
	}
	const now = input.now ?? (() => new Date().toISOString());
	const record: StoredUsageRecord = {
		schemaVersion: USAGE_RECORD_SCHEMA_VERSION,
		spend: input.spend, // EV-30's record byte-verbatim — never extended
		provenance: {
			sessionId: input.sessionId,
			sessionPath: input.sessionPath,
			firstEntryId: input.spend.boundary.firstEntryId,
			lastEntryId: input.spend.boundary.lastEntryId,
			boundaryResolved: input.spend.boundary.resolved,
			pointerSurvivable: pointerSurvivableAtWrite(input.repoRoot, input.sessionPath),
		},
		runId: input.runId,
		command: input.command,
		repoRoot: input.repoRoot,
		writtenAt: now(),
		basis: { trigger: input.trigger, manifestsObserved: input.manifestsObserved },
		...(input.provider !== undefined ? { provider: input.provider } : {}),
	};
	const tmp = `${file}.tmp-${process.pid}`;
	fs.writeFileSync(tmp, JSON.stringify(record, null, "\t") + "\n", { mode: 0o600 });
	fs.chmodSync(tmp, 0o600);
	fs.renameSync(tmp, file);
	return { file, record, written: true };
}

/** Read every record in the store, skipping unparseable/partial files (the
 * readManifests precedent), sorted by filename (chronological by the
 * invocation-time prefix). Never throws. */
export function readUsageRecords(storeRoot: string = usageStoreDir()): StoredUsageRecord[] {
	if (!fs.existsSync(storeRoot)) return [];
	const files = fs.readdirSync(storeRoot).filter((f) => f.endsWith(".json")).sort();
	const out: StoredUsageRecord[] = [];
	for (const f of files) {
		try {
			const rec = JSON.parse(fs.readFileSync(path.join(storeRoot, f), "utf-8")) as StoredUsageRecord;
			if (rec && typeof rec === "object" && rec.spend && rec.provenance) out.push(rec);
		} catch {
			/* mid-write/corrupt → skip */
		}
	}
	return out;
}

function defaultReadEntryIds(sessionPath: string): string[] | null {
	try {
		return parseSessionEntries(fs.readFileSync(sessionPath, "utf-8")).map((e) => e.id);
	} catch {
		return null; // missing, unreadable, or unparseable → treated as absent
	}
}

/** The ruling's mapping, in order, never throwing (spec §2.5):
 *   sessionPath === null                          → "no-session-file"
 *   file absent/unreadable, pointerSurvivable     → "missing-unexpected"
 *   file absent/unreadable, !pointerSurvivable    → "pruned-expected"
 *   both ids present in the file                  → "resolved"
 *   otherwise (null/partial ids)                  → "range-missing"
 * A missing, unreadable, or unparseable session file is treated as absent;
 * the outcome is then one of the two survivability classes. */
export function resolveProvenance(
	pointer: UsageProvenance,
	readEntryIds: (sessionPath: string) => string[] | null = defaultReadEntryIds,
): ResolveOutcome {
	if (pointer.sessionPath === null) return "no-session-file";
	let ids: string[] | null;
	try {
		ids = readEntryIds(pointer.sessionPath);
	} catch {
		ids = null; // a misbehaving injected reader must not make this throw
	}
	if (ids === null) return pointer.pointerSurvivable ? "missing-unexpected" : "pruned-expected";
	const inFile = new Set(ids);
	return pointer.firstEntryId !== null &&
		pointer.lastEntryId !== null &&
		inFile.has(pointer.firstEntryId) &&
		inFile.has(pointer.lastEntryId)
		? "resolved"
		: "range-missing";
}

// ---------------------------------------------------------------------------
// The one gated write path (spec §2.4): driven from hub onChange,
// agent_settled, and the session_shutdown sweep; the gate decides, not the
// event.
// ---------------------------------------------------------------------------

export interface PendingInvocation {
	command: string;
	markerId: string;
	runId: string;
	/** The marker's `at` — the store key's clock. null = unresolvable at stamp
	 * time; the record is never written (never fabricate a marker time). */
	markerAt: number | null;
	/** ctx.sessionManager.getSessionFile() ?? null. */
	sessionFile: string | null;
	/** Steward A(c): the boundary anchor for spendRecord at flush. Default
	 * "user-message" — byte-preserving for every existing caller; the scanned
	 * procedure push omits it. Set "marker" for await-without-injection
	 * handlers (/council-eval). The discriminator lives on the store record,
	 * never on EV-30's returned SpendRecord. */
	boundaryMode?: "user-message" | "marker";
}

export type FlushStatus = "written" | "existing" | "gate-closed" | "failed" | "unkeyable";

/** The provider injection seam (spec §2.3): only the transport and the key
 * are injectable. There is NO caller-supplied job or id list — the eligible
 * jobs and their generation ids are harvested from the invocation's own
 * manifests and session files, which is what makes the acceptance's
 * never-fetch falsifier bite (O-2/O-7). Production callers pass nothing: the
 * real transport and the resolved credential are the defaults. */
export interface FlushProviderDeps {
	fetchGeneration?: FetchGeneration;
	apiKey?: string | null;
	now?: () => string;
	timeoutMs?: number;
}

export interface FlushOutcome {
	markerId: string;
	status: FlushStatus;
	file?: string;
	error?: string;
}

/** Gate, per pending invocation, in order:
 *   1. keyable      — markerAt !== null (else "unkeyable": warn + drop)
 *   2. marker is on-chain (parent-walk from the leaf)
 *   3. forestFullySettled — every manifest with startedAt >= markerAt has
 *      exitCode !== null (else keep pending: a mid-turn onChange or an early
 *      agent_settled is a no-op)
 *   4. no file exists for this key (else "existing": already durable)
 * then compute spendRecord at this moment and persist once. Per-record
 * failure handling: a write error is caught, notified with the absolute
 * target path, and the pending entry dropped — never crashes the caller,
 * never retries against a failing store, never silently drops the
 * invocation. */
export async function flushPendingInvocations(input: {
	repoRoot: string;
	entries: SessionEntry[];
	leafId: string | null;
	sessionId: string;
	pending: readonly PendingInvocation[];
	trigger: UsageTrigger;
	notify?: (message: string, kind: "info" | "warning") => void;
	storeRoot?: string;
	now?: () => string;
	providerDeps?: FlushProviderDeps;
}): Promise<{ outcomes: FlushOutcome[]; remaining: PendingInvocation[] }> {
	const storeRoot = input.storeRoot ?? usageStoreDir();
	const notify = input.notify ?? (() => {});
	const byId = new Map(input.entries.map((e) => [e.id, e]));
	const onChain = new Set<string>();
	let cur = input.leafId;
	while (cur) {
		const e = byId.get(cur);
		if (!e) break;
		onChain.add(cur);
		cur = e.parentId ?? null;
	}
	const outcomes: FlushOutcome[] = [];
	const remaining: PendingInvocation[] = [];
	for (const p of input.pending) {
		if (p.markerAt === null) {
			outcomes.push({ markerId: p.markerId, status: "unkeyable" });
			notify(`council usage: no invocation timestamp for marker ${p.markerId} — usage record not written`, "warning");
			continue;
		}
		if (!onChain.has(p.markerId)) {
			outcomes.push({ markerId: p.markerId, status: "gate-closed" });
			remaining.push(p);
			continue;
		}
		const manifests = readManifests(input.repoRoot, p.runId);
		// forestFullySettled: every manifest in the invocation's window settled.
		if (manifests.some((m) => m.startedAt >= p.markerAt! && m.exitCode === null)) {
			outcomes.push({ markerId: p.markerId, status: "gate-closed" });
			remaining.push(p);
			continue;
		}
		const file = path.join(storeRoot, usageRecordName(p.markerAt, p.runId, p.command));
		if (fs.existsSync(file)) {
			// Choose-once: already durable; byte-identical no-op, no recompute.
			outcomes.push({ markerId: p.markerId, status: "existing", file });
			continue;
		}
		try {
			const spend = spendRecord({
				entries: input.entries,
				leafId: input.leafId,
				sessionId: input.sessionId,
				markerId: p.markerId,
				manifests,
				boundaryMode: p.boundaryMode ?? "user-message",
			});
			// EV-29 (spec §2.3): fetch the provider report AFTER the choose-once
			// file check and BEFORE persist, so the durable record is final at write
			// time and a second flush never re-fetches. Eligible jobs come from the
			// invocation-window manifests already read for the gate — never a
			// caller-supplied list (O-2). A fetch failure is converted INSIDE
			// fetchProviderReport into the unavailable report (never the {failed}
			// path); only a write failure reaches the catch below.
			const apiKey = input.providerDeps?.apiKey !== undefined ? input.providerDeps.apiKey : resolveOpenRouterApiKey();
			const jobs = manifests
				.filter((m) => m.model.startsWith("openrouter/") && m.startedAt >= p.markerAt!)
				.map((m) => ({
					jobId: m.id,
					model: m.model,
					sessionPath: findSessionFile(input.repoRoot, p.runId, m.sessionId) ?? null,
				}));
			const provider = await fetchProviderReport({
				repoRoot: input.repoRoot,
				runId: p.runId,
				jobs,
				fetchGeneration: input.providerDeps?.fetchGeneration ?? openRouterGenerationTransport(apiKey ?? ""),
				apiKey,
				now: input.providerDeps?.now,
				timeoutMs: input.providerDeps?.timeoutMs,
			});
			const res = persistInvocationUsage(
				{
					spend,
					sessionId: input.sessionId,
					sessionPath: p.sessionFile,
					runId: p.runId,
					command: p.command,
					repoRoot: input.repoRoot,
					markerAt: p.markerAt,
					trigger: input.trigger,
					manifestsObserved: manifests.length,
					now: input.now,
					...(provider !== null ? { provider } : {}),
				},
				storeRoot,
			);
			outcomes.push({ markerId: p.markerId, status: res.written ? "written" : "existing", file: res.file });
			// EV-32 (PO G/J): the block IS the written-transition emission — it
			// replaces EV-31's success notify (wording ownership transferred), so
			// exactly one line-set lands, byte-equal to disk. EV-29: the block is
			// composed from the PERSISTED record's provider sibling, so "what was
			// shown" and "what is on disk" are equal by construction. `existing`
			// stays silent (choose-once already satisfied at a prior settle).
			notify(formatUsageBlock({ record: res.record.spend, provider: res.record.provider }), "info");
		} catch (e) {
			const msg = e instanceof Error ? e.message : String(e);
			outcomes.push({ markerId: p.markerId, status: "failed", file, error: msg });
			// R-5 failure state with EV-31's T-U14 absolute-path property composed in.
			notify(formatUsageBlock({ failed: `write failed for ${file}: ${msg}` }), "warning");
		}
	}
	return { outcomes, remaining };
}
