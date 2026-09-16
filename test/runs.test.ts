import { test, expect } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { CONFIG_DIR_NAME } from "@earendil-works/pi-coding-agent";
import {
	ensureRunDir,
	mintRunId,
	readManifests,
	writeManifest,
	childEnv,
	findSessionFile,
	listRunIds,
	pruneRuns,
	sumSubtree,
	attemptEntries,
	type RunManifest,
	type Usage,
} from "../extensions/runs.ts";

import { sumSubtreeUsage } from "../extensions/usage-block.ts";

function tmpRepo(): string {
	return fs.mkdtempSync(path.join(os.tmpdir(), "council-runs-"));
}

function manifest(id: string, over: Partial<RunManifest> = {}): RunManifest {
	return {
		id,
		seat: "owner",
		model: "m/x",
		parentJobId: null,
		pid: null,
		sessionId: id,
		state: "running",
		startedAt: Date.now(),
		settledAt: null,
		exitCode: null,
		usage: fullUsage(),
		...over,
	};
}

test("ensureRunDir creates self-ignoring .gitignore and run.json", () => {
	const root = tmpRepo();
	const dir = ensureRunDir(root, "runA");
	expect(dir).toBe(path.join(root, CONFIG_DIR_NAME, "council", "runs", "runA"));
	expect(fs.readFileSync(path.join(root, CONFIG_DIR_NAME, "council", "runs", ".gitignore"), "utf-8")).toBe("*\n");
	const info = JSON.parse(fs.readFileSync(path.join(dir, "run.json"), "utf-8"));
	expect(info.runId).toBe("runA");
	expect(info.repoRoot).toBe(root);
	expect(typeof info.startedAt).toBe("number");
	expect(info.hostPid).toBe(process.pid);
});

test("ensureRunDir never clobbers an existing run.json", () => {
	const root = tmpRepo();
	const dir = ensureRunDir(root, "runB");
	fs.writeFileSync(path.join(dir, "run.json"), JSON.stringify({ runId: "runB", startedAt: 1, repoRoot: root, hostPid: 1 }));
	ensureRunDir(root, "runB");
	expect(JSON.parse(fs.readFileSync(path.join(dir, "run.json"), "utf-8")).startedAt).toBe(1);
});

test("mintRunId is unique-ish and filename-safe", () => {
	const a = mintRunId();
	const b = mintRunId();
	expect(a).not.toBe(b);
	expect(a).toMatch(/^[A-Za-z0-9-]+$/);
});

test("manifest round-trip; readManifests skips run.json and corrupt files", () => {
	const root = tmpRepo();
	ensureRunDir(root, "runC");
	writeManifest(root, "runC", manifest("job-1"));
	writeManifest(root, "runC", manifest("job-1.2", { parentJobId: "job-1", seat: "skeptic" }));
	fs.writeFileSync(path.join(root, CONFIG_DIR_NAME, "council", "runs", "runC", "broken.json"), "{ not json");
	const ms = readManifests(root, "runC");
	expect(ms.map((m) => m.id)).toEqual(["job-1", "job-1.2"]);
	expect(ms[1].seat).toBe("skeptic");
});

test("readManifests on missing run dir is empty", () => {
	expect(readManifests(tmpRepo(), "nope")).toEqual([]);
});

test("childEnv adds run identity vars", () => {
	const env = childEnv({ COUNCIL_SEAT: "owner", HOME: "/h" }, "runX", "job-2");
	expect(env.COUNCIL_RUN_ID).toBe("runX");
	expect(env.COUNCIL_JOB_ID).toBe("job-2");
	expect(env.COUNCIL_SEAT).toBe("owner");
});

test("findSessionFile matches by header id, not filename", () => {
	const root = tmpRepo();
	const dir = ensureRunDir(root, "runD");
	fs.writeFileSync(
		path.join(dir, "2026-01-01T00-00-00Z_job-1.jsonl"),
		`{"type":"session","version":3,"id":"job-1","timestamp":"x","cwd":"/x"}\n`,
	);
	fs.writeFileSync(
		path.join(dir, "2026-01-01T00-00-01Z_job-2.jsonl"),
		`{"type":"session","version":3,"id":"job-2","timestamp":"x","cwd":"/x"}\n`,
	);
	expect(findSessionFile(root, "runD", "job-2")).toBe(path.join(dir, "2026-01-01T00-00-01Z_job-2.jsonl"));
	expect(findSessionFile(root, "runD", "job-1")).toBe(path.join(dir, "2026-01-01T00-00-00Z_job-1.jsonl"));
	expect(findSessionFile(root, "runD", "job-9")).toBeUndefined();
});

test("listRunIds orders newest first", () => {
	const root = tmpRepo();
	ensureRunDir(root, "old");
	const dir = path.join(root, CONFIG_DIR_NAME, "council", "runs", "old", "run.json");
	fs.writeFileSync(dir, JSON.stringify({ runId: "old", startedAt: 1, repoRoot: root, hostPid: 1 }));
	ensureRunDir(root, "new");
	expect(listRunIds(root)).toEqual(["new", "old"]);
});

test("pruneRuns deletes oldest beyond keep", () => {
	const root = tmpRepo();
	for (let i = 0; i < 4; i++) {
		ensureRunDir(root, `r${i}`);
		const dir = path.join(root, CONFIG_DIR_NAME, "council", "runs", `r${i}`, "run.json");
		fs.writeFileSync(dir, JSON.stringify({ runId: `r${i}`, startedAt: i + 1, repoRoot: root, hostPid: 1 }));
	}
	const pruned = pruneRuns(root, 2, () => false);
	expect(pruned).toBe(2);
	expect(listRunIds(root)).toEqual(["r3", "r2"]);
});

test("pruneRuns never deletes a run with a live pid", () => {
	const root = tmpRepo();
	ensureRunDir(root, "live");
	const dir = path.join(root, CONFIG_DIR_NAME, "council", "runs", "live", "run.json");
	fs.writeFileSync(dir, JSON.stringify({ runId: "live", startedAt: 1, repoRoot: root, hostPid: 1 }));
	writeManifest(root, "live", manifest("job-1", { pid: process.pid }));
	ensureRunDir(root, "keep1");
	ensureRunDir(root, "keep2");
	const pruned = pruneRuns(root, 2, (pid) => {
		try {
			process.kill(pid, 0);
			return true;
		} catch {
			return false;
		}
	});
	expect(pruned).toBe(0);
	expect(listRunIds(root)).toContain("live");
});

test("pruneRuns deletes a run whose pid is dead", () => {
	const root = tmpRepo();
	ensureRunDir(root, "dead");
	const dir = path.join(root, CONFIG_DIR_NAME, "council", "runs", "dead", "run.json");
	fs.writeFileSync(dir, JSON.stringify({ runId: "dead", startedAt: 1, repoRoot: root, hostPid: 1 }));
	writeManifest(root, "dead", manifest("job-1", { pid: 999999 }));
	ensureRunDir(root, "keep1");
	ensureRunDir(root, "keep2");
	const pruned = pruneRuns(root, 2, () => false);
	expect(pruned).toBe(1);
	expect(listRunIds(root)).not.toContain("dead");
});

// ---- EV-28: full usage tuple ----

function fullUsage(over: Partial<Usage> = {}): Usage {
	return {
		input: 0, output: 0, cacheRead: 0, cacheWrite: 0, reasoning: 0, totalTokens: 0,
		cost: 0, costInput: 0, costOutput: 0, costCacheRead: 0, costCacheWrite: 0,
		turns: 0, costBasis: "catalogue-estimate", usageSource: "stream-assistant",
		...over,
	};
}

// T9 — legacy manifest tolerance: a manifest whose usage lacks the new fields
// sums as 0 through sumSubtree (the unvalidated readManifests cast makes the
// legacy on-disk shape legal disk data); costBasis is not a sumable metric.
test("T9: legacy manifest usage sums as 0 through sumSubtree; costBasis is not a metric", () => {
	const root = tmpRepo();
	const runId = "runT9";
	ensureRunDir(root, runId);
	const legacy = manifest("job-1", {});
	legacy.usage = { input: 1, output: 2, cost: 0.5, turns: 1 } as unknown as Usage;
	writeManifest(root, runId, legacy);
	const ms = readManifests(root, runId);
	expect(sumSubtree(ms, "job-1")).toBe(0.5);
	expect(sumSubtree(ms, "job-1", "cacheRead")).toBe(0);
	expect(sumSubtree(ms, "job-1", "totalTokens")).toBe(0);
	// @ts-expect-error — costBasis is excluded from UsageMetric (T9 type assertion)
	expect(sumSubtree(ms, "job-1", "costBasis")).toBe(0);
	fs.rmSync(path.join(root, CONFIG_DIR_NAME), { recursive: true, force: true });
});

// T10 — the usageSource union member "session-reconciled" is accepted by the type.
test("T10: usageSource accepts the session-reconciled union member", () => {
	const u = fullUsage({ usageSource: "session-reconciled" });
	expect(u.usageSource).toBe("session-reconciled");
});
// EV-39 — attempt ordinal + next-attempt timestamp round-trip (spec §2.5);
// a non-retry manifest carries neither key (G1 byte-identity).
test("EV-39: manifest round-trips attempt and nextAttemptAt; plain manifests carry neither key", () => {
	const root = tmpRepo();
	const runId = "runA39";
	ensureRunDir(root, runId);
	writeManifest(root, runId, manifest("job-1", { attempt: 2, nextAttemptAt: 12345 }));
	const read = readManifests(root, runId)[0]!;
	expect(read.attempt).toBe(2);
	expect(read.nextAttemptAt).toBe(12345);
	const plain = manifest("job-2");
	expect("attempt" in plain).toBe(false);
	expect("nextAttemptAt" in plain).toBe(false);
	fs.rmSync(path.join(root, CONFIG_DIR_NAME), { recursive: true, force: true });
});

// EV-42 — per-attempt provenance: the attempts list round-trips; a plain
// manifest (non-retried) carries neither `attempt` nor `attempts` (byte-identity).
test("EV-42: manifest round-trips the attempts list; a plain manifest carries it not", () => {
	const root = tmpRepo();
	const runId = "runA42";
	ensureRunDir(root, runId);
	writeManifest(root, runId, manifest("job-1", {
		attempt: 2,
		attempts: [{ attempt: 1, sessionId: "job-1" }],
	}));
	const read = readManifests(root, runId)[0]!;
	expect(read.attempts).toEqual([{ attempt: 1, sessionId: "job-1" }]);
	const plain = manifest("job-2");
	expect("attempts" in plain).toBe(false);
	fs.rmSync(path.join(root, CONFIG_DIR_NAME), { recursive: true, force: true });
});

// EV-42 §2.3 — the one per-attempt accessor: the new shape yields the list;
// the fail-closed legacy fallback synthesizes exactly one entry from the
// manifest's own fields (never relabels `usage` as a per-attempt delta).
test("EV-42: attemptEntries — new shape yields the list; legacy fallback synthesizes one entry", () => {
	expect(
		attemptEntries({
			...manifest("j"),
			attempts: [{ attempt: 1, sessionId: "a" }, { attempt: 2, sessionId: "b" }],
		}),
	).toEqual([{ attempt: 1, sessionId: "a" }, { attempt: 2, sessionId: "b" }]);
	// legacy window shape: attempt > 1, no list → one entry derived from the manifest
	expect(attemptEntries(manifest("j", { attempt: 2 }))).toEqual([{ attempt: 2, sessionId: "j" }]);
	// plain single-attempt manifest
	expect(attemptEntries(manifest("j"))).toEqual([{ attempt: 1, sessionId: "j" }]);
});

// EV-42 §3 — no-double-count: the pointer-only list never multiplies the
// cumulative tuple; the subtree sum equals the manifest's own usage.
test("EV-42: sumSubtreeUsage never double-counts a retried manifest", () => {
	const root = tmpRepo();
	const runId = "run42d";
	ensureRunDir(root, runId);
	const usage = fullUsage({ cost: 0.0073 });
	writeManifest(root, runId, manifest("job-1", {
		attempt: 2,
		attempts: [{ attempt: 1, sessionId: "job-1" }, { attempt: 2, sessionId: "job-1-attempt2" }],
		usage,
	}));
	const ms = readManifests(root, runId);
	const { subtree } = sumSubtreeUsage(ms, "job-1");
	expect(subtree.cost).toBe(usage.cost);
	fs.rmSync(path.join(root, CONFIG_DIR_NAME), { recursive: true, force: true });
});
