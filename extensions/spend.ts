// EV-30: invocation-scoped spend record. Pure module — no node:fs, no ctx, no
// hub import. Types only from pi and from the runs.ts substrate.
//
// The invoking session has no manifest at all (the hub writes manifests only
// for jobs it dispatches), so the hub's job forest is not the invocation's
// spend. spendRecord() returns the two halves, each labelled with its own
// single-valued accounting basis (usageSource/costBasis on Usage are
// single-valued — EV-28 Q4):
//   ownSession — sum over the invoking session's active leaf chain at/after the
//                invocation boundary ("session-reconciled")
//   subtree    — sum over the invocation's job forest, stream-projected
//                ("stream-assistant" — the machine-readable lower-bound
//                statement, ruling item 5)
import type { SessionEntry } from "@earendil-works/pi-coding-agent";
import type { CostBasis, RunManifest, Usage, UsageMetric, UsageSource } from "./runs.ts";

export interface SpendBoundary {
	/** The invoking session (getSessionId()) — never RunManifest.sessionId, which is a child job id. */
	sessionId: string;
	/** Ruling item 3 flag: true iff the boundary entry was resolved. */
	resolved: boolean;
	/** The boundary user-message entry id; null iff !resolved. */
	firstEntryId: string | null;
	/** Last entry id on the active leaf chain at compute time (= leafId); null iff !resolved. */
	lastEntryId: string | null;
	/** Forest node count (roots + descendants); 0 iff !resolved. */
	jobCount: number;
}

export interface SpendRecord {
	boundary: SpendBoundary;
	/** Sum over the active chain at/after the boundary, inclusive. */
	ownSession: Usage; // usageSource: "session-reconciled"
	/** Sum over the invocation's job forest (manifest usage, stream-projected). */
	subtree: Usage; // usageSource: "stream-assistant" — the lower-bound statement (ruling item 5)
}

/** Wire shape of the pi-ai Usage as it appears on session entries (nested cost). */
interface WireUsage {
	input?: number;
	output?: number;
	cacheRead?: number;
	cacheWrite?: number;
	reasoning?: number;
	totalTokens?: number;
	cost?: { input?: number; output?: number; cacheRead?: number; cacheWrite?: number; total?: number };
}

export function zeroUsage(costBasis: CostBasis, usageSource: UsageSource): Usage {
	return {
		input: 0,
		output: 0,
		cacheRead: 0,
		cacheWrite: 0,
		reasoning: 0,
		totalTokens: 0,
		cost: 0,
		costInput: 0,
		costOutput: 0,
		costCacheRead: 0,
		costCacheWrite: 0,
		turns: 0,
		costBasis,
		usageSource,
	};
}

/** EV-28 Q1 wire→record clause verbatim: cost.{input,output,cacheRead,cacheWrite,total}
 * → costInput/costOutput/costCacheRead/costCacheWrite/cost; missing components coerce
 * to 0, never NaN; cacheRead is accumulated, never folded into input. */
function accumulateWire(into: Usage, u: WireUsage | undefined): void {
	if (!u) return;
	into.input += u.input || 0;
	into.output += u.output || 0;
	into.cacheRead += u.cacheRead || 0; // accumulated, never folded into input
	into.cacheWrite += u.cacheWrite || 0;
	// reasoning is a subset of output (pi-ai types) — accumulate independently,
	// never re-add into output or any total.
	into.reasoning += u.reasoning || 0;
	// provider-reported; never derived from the component sum
	into.totalTokens += u.totalTokens || 0;
	into.cost += u.cost?.total || 0;
	into.costInput += u.cost?.input || 0;
	into.costOutput += u.cost?.output || 0;
	into.costCacheRead += u.cost?.cacheRead || 0;
	into.costCacheWrite += u.cost?.cacheWrite || 0;
}

/** Flat RunManifest.usage summation — the manifest tuple is already EV-28-shaped
 * (scalar cost + cost* components), not the nested wire shape. */
const NUMERIC_METRICS: UsageMetric[] = [
	"input",
	"output",
	"cacheRead",
	"cacheWrite",
	"reasoning",
	"totalTokens",
	"cost",
	"costInput",
	"costOutput",
	"costCacheRead",
	"costCacheWrite",
	"turns",
];

function accumulateFlat(into: Usage, u: Usage | undefined): void {
	if (!u) return; // legacy/partial manifest: counts in jobCount, adds 0
	for (const k of NUMERIC_METRICS) into[k] += u[k] || 0;
}

/** Active leaf chain (root → leaf) as ids, plus the on-chain id set. */
function activeChain(entries: SessionEntry[], leafId: string | null): { ids: string[]; onChain: Set<string> } {
	const byId = new Map(entries.map((e) => [e.id, e]));
	const ids: string[] = [];
	let cur = leafId;
	while (cur) {
		const e = byId.get(cur);
		if (!e) break;
		ids.push(cur);
		cur = e.parentId;
	}
	return { ids, onChain: new Set(ids) };
}

/** Append-order scan for exit-time callers that no longer hold the in-memory
 * marker id (spec §2.5): the LAST council-invocation marker on the active
 * chain. Interface completion for EV-31/EV-32, not a settled-decision change. */
export function findLatestInvocationMarker(entries: SessionEntry[], leafId: string | null): string | null {
	const { onChain } = activeChain(entries, leafId);
	let found: string | null = null;
	for (const e of entries) {
		if (e.type === "custom" && e.customType === "council-invocation" && onChain.has(e.id)) found = e.id;
	}
	return found;
}

export function spendRecord(opts: {
	/** ctx.sessionManager.getEntries() — raw append order, abandoned branches included. */
	entries: SessionEntry[];
	/** ctx.sessionManager.getLeafId(). */
	leafId: string | null;
	/** The invoking session's id (getSessionId()). */
	sessionId: string;
	/** The council-invocation marker id from recordInvocationBoundary, or null if unknown. */
	markerId: string | null;
	/** readManifests(repoRoot, runId) for the session's run dir. */
	manifests: RunManifest[];
}): SpendRecord {
	const { entries, leafId, sessionId, markerId, manifests } = opts;
	const ownSession = zeroUsage("catalogue-estimate", "session-reconciled");
	const subtree = zeroUsage("catalogue-estimate", "stream-assistant");
	const byId = new Map(entries.map((e) => [e.id, e]));
	const { ids, onChain } = activeChain(entries, leafId);

	// Boundary resolution (spec §2.5, settled by Skeptic O1 closed-red): the
	// marker must exist and be on the active chain; the boundary is the first
	// on-chain user message after the marker in getEntries() append order —
	// never parentId === markerId (the pre-prompt compaction check re-parents
	// the leaf before the injected user message is persisted).
	let boundaryId: string | null = null;
	if (markerId && byId.has(markerId) && onChain.has(markerId)) {
		const markerIdx = entries.findIndex((e) => e.id === markerId);
		for (let i = markerIdx + 1; i < entries.length; i++) {
			const e = entries[i]!;
			if (e.type === "message" && e.message.role === "user" && onChain.has(e.id)) {
				boundaryId = e.id;
				break;
			}
		}
	}
	if (!boundaryId) {
		// Boundary unresolvable (ruling items 3+4): zero BOTH halves, never an error.
		return {
			boundary: { sessionId, resolved: false, firstEntryId: null, lastEntryId: null, jobCount: 0 },
			ownSession,
			subtree,
		};
	}

	// Own half: raw active chain at/after the boundary, inclusive. The raw chain
	// is walked deliberately — NOT buildContextEntries, which drops
	// compacted-away entries (the card requires pi's full count).
	let seenBoundary = false;
	for (let i = ids.length - 1; i >= 0; i--) {
		// root → leaf
		const e = byId.get(ids[i]!)!;
		if (!seenBoundary) {
			if (e.id !== boundaryId) continue;
			seenBoundary = true;
		}
		if (e.type === "message") {
			if (e.message.role === "assistant") {
				accumulateWire(ownSession, e.message.usage);
				ownSession.turns += 1; // assistant-only, mirrors hub.ts
			} else if (e.message.role === "toolResult") {
				accumulateWire(ownSession, e.message.usage);
			}
		} else if (e.type === "compaction" || e.type === "branch_summary") {
			accumulateWire(ownSession, e.usage); // branch_summary included per ruling item 1
		}
	}

	// Subtree half: eligible roots = manifests with parentJobId === null and
	// startedAt >= the boundary entry's timestamp (same process clock as
	// job.startedAt = Date.now() at spawn); the forest is each root closed over
	// its parentJobId descendants. One rule covers attended rootlessness
	// (top-level siblings), nested autonomy, and multi-invocation sessions.
	const boundaryEntry = byId.get(boundaryId)!;
	const boundaryMs = Date.parse(boundaryEntry.timestamp);
	const byParent = new Map<string | null, RunManifest[]>();
	for (const m of manifests) {
		const list = byParent.get(m.parentJobId) ?? [];
		list.push(m);
		byParent.set(m.parentJobId, list);
	}
	const forest: RunManifest[] = [];
	const walk = (id: string): void => {
		for (const k of byParent.get(id) ?? []) {
			forest.push(k);
			walk(k.id);
		}
	};
	for (const r of byParent.get(null) ?? []) {
		if (r.startedAt >= boundaryMs) {
			forest.push(r);
			walk(r.id);
		}
	}
	for (const m of forest) accumulateFlat(subtree, m.usage);

	return {
		boundary: {
			sessionId,
			resolved: true,
			firstEntryId: boundaryId,
			// Ruling item 7: last id on the active leaf chain at compute time
			// (= leafId), never "last file entry" (abandoned branches).
			lastEntryId: leafId!,
			jobCount: forest.length,
		},
		ownSession,
		subtree,
	};
}

/** R-4 resolved label byte-exact; unresolved form per ruling item 3. */
export function formatBoundaryLabel(record: SpendRecord): string {
	const b = record.boundary;
	if (!b.resolved || b.firstEntryId === null || b.lastEntryId === null) {
		return `boundary=session=${b.sessionId} entries=unresolved jobs=0`;
	}
	return `boundary=session=${b.sessionId} entries=${b.firstEntryId}..${b.lastEntryId} jobs=${b.jobCount}`;
}
