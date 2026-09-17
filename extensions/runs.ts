import * as fs from "node:fs";
import * as path from "node:path";
import { CONFIG_DIR_NAME } from "@earendil-works/pi-coding-agent";
import type { JobState } from "./hub.ts";

/** Wire→record clause (EV-28 step-6 ruling Q1): on ingestion, `u.cost.input →
 * usage.costInput`, `u.cost.output → usage.costOutput`, `u.cost.cacheRead →
 * usage.costCacheRead`, `u.cost.cacheWrite → usage.costCacheWrite`, and
 * `u.cost.total → usage.cost`; partial cost objects (e.g. `{total:0.001}`)
 * coerce the missing components to 0, never `NaN`; the card goal's dotted
 * `cost.input|…` refer to the wire components that ingestion flattens, not to
 * a nested record shape.
 *
 * Capture-scope clause (EV-28 step-6 ruling Q4): capture is a stream projection
 * of assistant `message_end` events on the child's stdout only — tool-result
 * and compaction usage are absent. The persisted `usageSource` field is the
 * machine-readable statement of that scope. */
export type CostBasis = "catalogue-estimate" | "reported";
export type UsageSource = "stream-assistant" | "session-reconciled";

export interface Usage {
	input: number;
	output: number;
	cacheRead: number; // accumulated, never folded into input
	cacheWrite: number;
	reasoning: number; // subset of output — accumulate independently, never re-add
	totalTokens: number;
	cost: number; // scalar aggregate; the compatibility anchor
	costInput: number;
	costOutput: number;
	costCacheRead: number;
	costCacheWrite: number;
	turns: number;
	costBasis: CostBasis; // R-3
	usageSource: UsageSource; // step-6 ruling Q4
}

/** Numeric metrics only — the two string-valued fields cannot be summed. */
export type UsageMetric = Exclude<keyof Usage, "costBasis" | "usageSource">;

export interface RunManifest {
	id: string;
	seat: string;
	model: string;
	parentJobId: string | null;
	pid: number | null;
	sessionId: string;
	state: JobState;
	startedAt: number;
	settledAt: number | null;
	exitCode: number | null;
	/** EV-16 §7 — persisted at settle (distinct from the in-memory-only JobReport).
	 * Optional: manifests written before the extension (or a partial write) may lack it. */
	usage?: Usage;
	stopReason?: string;
	/** EV-39 — attempt ordinal; present only when >= 2 (one id / one manifest
	 * / one row per dispatch, cardinality A). EV-42 owns per-attempt provenance. */
	attempt?: number;
	/** EV-42 — per-attempt provenance. Present iff attempt > 1 (same gate as
	 * `attempt`); ordered and unique across attempts 1..N at every settled
	 * write; a mid-flight (retrying) manifest carries the settled prefix.
	 * Pointer-only: each attempt's spend is recovered from the session JSONL
	 * this names. */
	attempts?: { attempt: number; sessionId: string }[];
	/** EV-39 — epoch ms of the next scheduled attempt; present only while the
	 * dispatch is between attempts (state retrying). */
	nextAttemptAt?: number;
}

export interface RunInfo {
	runId: string;
	startedAt: number;
	repoRoot: string;
	hostPid: number;
}

export function runsDir(repoRoot: string): string {
	return path.join(repoRoot, CONFIG_DIR_NAME, "council", "runs");
}

export function runDir(repoRoot: string, runId: string): string {
	return path.join(runsDir(repoRoot), runId);
}

export function mintRunId(): string {
	const nonce = Math.random().toString(36).slice(2, 8);
	return `${new Date().toISOString().replace(/[:.]/g, "-")}-${process.pid}-${nonce}`;
}

export function writeAtomic(file: string, content: string): void {
	const tmp = `${file}.${process.pid}.tmp`;
	fs.writeFileSync(tmp, content);
	fs.renameSync(tmp, file);
}

/** Idempotently creates run dir + self-ignoring .gitignore + run.json (never clobbers). */
export function ensureRunDir(repoRoot: string, runId: string): string {
	const dir = runDir(repoRoot, runId);
	fs.mkdirSync(dir, { recursive: true });
	const gi = path.join(runsDir(repoRoot), ".gitignore");
	if (!fs.existsSync(gi)) fs.writeFileSync(gi, "*\n");
	const rj = path.join(dir, "run.json");
	if (!fs.existsSync(rj)) {
		const info: RunInfo = { runId, startedAt: Date.now(), repoRoot, hostPid: process.pid };
		writeAtomic(rj, JSON.stringify(info, null, "\t"));
	}
	return dir;
}

export function writeManifest(repoRoot: string, runId: string, m: RunManifest): void {
	writeAtomic(path.join(runDir(repoRoot, runId), `${m.id}.json`), JSON.stringify(m, null, "\t"));
}

/** EV-42 (spec §2.3) — the one per-attempt accessor. The fail-closed legacy
 * fallback synthesizes exactly one entry from the manifest's own fields and
 * never relabels `m.usage` as a per-attempt delta (the pointer shape carries
 * no usage). Shape discrimination is the manifest's own property:
 * `m.attempts !== undefined`. */
export function attemptEntries(m: RunManifest): { attempt: number; sessionId: string }[] {
	return m.attempts ?? [{ attempt: m.attempt ?? 1, sessionId: m.sessionId }];
}

/** FLLWUP-45 — the attempts the navigator may browse: the settled prefix
 *  (attemptEntries) plus the live session when it has not settled yet. */
export function browsableAttempts(
	m: RunManifest,
): { attempt: number; sessionId: string }[] {
	const entries = attemptEntries(m);
	const live = { attempt: m.attempt ?? 1, sessionId: m.sessionId };
	return entries.some((e) => e.sessionId === live.sessionId) ? entries : [...entries, live];
}

/** FLLWUP-45 — pure attempt selector (the resolveAttemptFile seam Q3 named,
 *  returning the entry rather than a path so FLLWUP-4 can reuse it): cursor
 *  hit → that entry; absent/null cursor → the last (latest browsable) entry;
 *  empty input (cannot occur via browsableAttempts, guarded anyway) → the
 *  { attempt: 1, sessionId: "", index: 0 } sentinel. */
export function resolveAttempt(
	entries: { attempt: number; sessionId: string }[],
	cursorSessionId?: string | null,
): { attempt: number; sessionId: string; index: number } {
	if (entries.length === 0) return { attempt: 1, sessionId: "", index: 0 };
	const idx = cursorSessionId != null ? entries.findIndex((e) => e.sessionId === cursorSessionId) : -1;
	if (idx >= 0) return { ...entries[idx]!, index: idx };
	const last = entries.length - 1;
	return { ...entries[last]!, index: last };
}

export function readManifests(repoRoot: string, runId: string): RunManifest[] {
	const dir = runDir(repoRoot, runId);
	if (!fs.existsSync(dir)) return [];
	const out: RunManifest[] = [];
	for (const f of fs.readdirSync(dir)) {
		if (!f.endsWith(".json") || f === "run.json") continue;
		try {
			out.push(JSON.parse(fs.readFileSync(path.join(dir, f), "utf-8")));
		} catch {
			/* mid-write/corrupt → skip */
		}
	}
	return out.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
}

export function listRunIds(repoRoot: string): string[] {
	const base = runsDir(repoRoot);
	if (!fs.existsSync(base)) return [];
	const entries: Array<{ d: string; at: number }> = [];
	for (const d of fs.readdirSync(base)) {
		if (!fs.statSync(path.join(base, d)).isDirectory()) continue;
		let at = 0;
		try {
			at = (JSON.parse(fs.readFileSync(path.join(base, d, "run.json"), "utf-8")) as RunInfo).startedAt ?? 0;
		} catch {
			/* no run.json */
		}
		entries.push({ d, at });
	}
	return entries.sort((a, b) => b.at - a.at).map((e) => e.d);
}

export function findSessionFile(repoRoot: string, runId: string, sessionId: string): string | undefined {
	const dir = runDir(repoRoot, runId);
	if (!fs.existsSync(dir)) return undefined;
	for (const f of fs.readdirSync(dir)) {
		if (!f.endsWith(".jsonl")) continue;
		const p = path.join(dir, f);
		try {
			const fd = fs.openSync(p, "r");
			const buf = Buffer.alloc(512);
			const n = fs.readSync(fd, buf, 0, buf.length, 0);
			fs.closeSync(fd);
			const head = buf.subarray(0, n).toString();
			const nl = head.indexOf("\n");
			const first = nl === -1 ? head : head.slice(0, nl);
			if ((JSON.parse(first) as { id?: string }).id === sessionId) return p;
		} catch {
			continue;
		}
	}
	return undefined;
}

export function pidAlive(pid: number): boolean {
	try {
		process.kill(pid, 0);
		return true;
	} catch {
		return false;
	}
}

export function pruneRuns(repoRoot: string, keep = 15, isAlive: (pid: number) => boolean = pidAlive): number {
	const base = runsDir(repoRoot);
	if (!fs.existsSync(base)) return 0;
	let pruned = 0;
	for (const runId of listRunIds(repoRoot).slice(keep)) {
		const live = readManifests(repoRoot, runId).some((m) => m.pid !== null && isAlive(m.pid));
		if (live) continue;
		fs.rmSync(path.join(base, runId), { recursive: true, force: true });
		pruned++;
	}
	return pruned;
}

export function childEnv(base: Record<string, string | undefined>, runId: string, jobId: string): Record<string, string> {
	return { ...base, COUNCIL_RUN_ID: runId, COUNCIL_JOB_ID: jobId } as Record<string, string>;
}

/**
 * Sum a usage metric over the job-forest subtree rooted at `rootId` inclusive
 * (parentJobId-chain descendants). Pure. Old manifests written before the §7
 * extension carry no `usage` — treated as 0 (a missing usage is a no-op, never
 * a crash). EV-16 §7: command-level cost = Σ over the subtree.
 */
export function sumSubtree(manifests: RunManifest[], rootId: string, metric: UsageMetric = "cost"): number {
	const children = (id: string): RunManifest[] => manifests.filter((m) => m.parentJobId === id);
	let sum = 0;
	const walk = (id: string): void => {
		const node = manifests.find((m) => m.id === id);
		if (node) sum += (node.usage as Usage | undefined)?.[metric] ?? 0;
		for (const c of children(id)) walk(c.id);
	};
	walk(rootId);
	return sum;
}