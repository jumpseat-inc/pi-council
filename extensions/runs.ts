import * as fs from "node:fs";
import * as path from "node:path";
import { CONFIG_DIR_NAME } from "@earendil-works/pi-coding-agent";
import type { JobState } from "./hub.ts";

export interface Usage {
	input: number;
	output: number;
	cost: number;
	turns: number;
}

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
export function sumSubtree(manifests: RunManifest[], rootId: string, metric: keyof Usage = "cost"): number {
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