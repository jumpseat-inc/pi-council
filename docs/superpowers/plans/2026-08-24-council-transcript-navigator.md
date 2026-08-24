# Council Transcript Navigator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the full conversation of every active council seat — at any nesting depth — navigable live from the parent pi TUI (tree overlay + live-tailing transcript viewer), with transcripts persisted as real pi session files in a self-gitignored in-repo runs dir.

**Architecture:** Children drop `--no-session` and write their full session JSONL into `$CONFIG_DIR_NAME/council/runs/<runId>/` via `--session-dir`/`--session-id`; each hub level (parent and nested child hubs) writes a tiny per-job manifest so the tree reconstructs across process boundaries. Job IDs become path-encoded (`job-1.2`) so the ID is the tree position. The navigator is a pi extension overlay: tree of manifests (disk is source of truth), Enter opens a transcript viewer that incrementally tails the session JSONL.

**Tech Stack:** TypeScript (bun runtime), `bun:test`, pi extension API (`ctx.ui.custom` overlays, `pi.registerShortcut`), `@earendil-works/pi-tui` components.

**Spec:** `docs/superpowers/specs/2026-08-24-council-transcript-navigator-design.md`

## Global Constraints

- Conventional Commits: `type(scope): short imperative summary`; bump `version` in `package.json` in the same PR as behavior changes (this feature lands as `0.9.0`).
- TDD: failing test first, every task; `repoRoot` in tests is always a fresh `fs.mkdtempSync` dir, never the real repo.
- No hardcoded `.pi` — repo-local paths use `CONFIG_DIR_NAME` from `@earendil-works/pi-coding-agent`.
- `hub.ts` stall/timeout/kill semantics are battle-tested: do not change them; only additive manifest writes.
- Seat schema, tool-grant vocabulary, MCP wiring, scaffold non-clobbering: untouched.
- Code style matches the repo: tabs, double quotes, semicolons.
- Run `bunx tsc --noEmit` and `bun test` at the end of every task; keep the suite green.

## File Structure

- Create `extensions/runs.ts` — on-disk substrate: run dir layout, `.gitignore` bootstrap, `run.json`, manifests, retention, env helper, session-file lookup.
- Create `extensions/tree.ts` — pure tree building from manifests + plain-text tree.
- Create `extensions/transcript.ts` — pure JSONL→block parser + incremental tail reader.
- Create `extensions/navigator.ts` — TUI overlays (tree + transcript), command + shortcut registration.
- Modify `extensions/seats.ts` — `buildChildArgv` session flags.
- Modify `extensions/hub.ts` — run-aware hub: path-encoded ids, manifest writes, `Job.model`/`Job.settledAt`.
- Modify `extensions/hub-tools.ts` — hub identity, dispatch wiring (run dir, env, session argv).
- Modify `extensions/child.ts` — child reads run identity from env.
- Modify `extensions/index.ts` — mint runId, prune, register navigator, widget hint.
- Modify `test/seats.test.ts`, `test/hub.test.ts`, `test/integration.test.ts`; create `test/runs.test.ts`, `test/transcript.test.ts`, `test/tree.test.ts`, `test/navigator.test.ts`.
- Modify `AGENTS.md`, `package.json`.

---

### Task 1: runs.ts — core substrate

**Files:**
- Create: `extensions/runs.ts`
- Test: `test/runs.test.ts`

**Interfaces:**
- Produces: `runsDir(repoRoot): string`, `runDir(repoRoot, runId): string`, `mintRunId(): string`, `writeAtomic(file, content)`, `ensureRunDir(repoRoot, runId): string`, `writeManifest(repoRoot, runId, m)`, `readManifests(repoRoot, runId): RunManifest[]`, `childEnv(base, runId, jobId): Record<string,string>`, `findSessionFile(repoRoot, runId, sessionId): string | undefined`, types `RunManifest`, `RunInfo`.
- Consumes: `JobState` type from `./hub.ts` (already exists).

- [ ] **Step 1: Write the failing tests**

```typescript
// test/runs.test.ts
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
	type RunManifest,
} from "../extensions/runs.ts";

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
	fs.writeFileSync(path.join(dir, "2026-01-01T00-00-00Z_job-1.jsonl"), `{"type":"session","version":3,"id":"job-1","timestamp":"x","cwd":"/x"}\n`);
	fs.writeFileSync(path.join(dir, "2026-01-01T00-00-01Z_job-2.jsonl"), `{"type":"session","version":3,"id":"job-2","timestamp":"x","cwd":"/x"}\n`);
	expect(findSessionFile(root, "runD", "job-2")).toBe(path.join(dir, "2026-01-01T00-00-01Z_job-2.jsonl"));
	expect(findSessionFile(root, "runD", "job-9")).toBeUndefined();
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bun test test/runs.test.ts`
Expected: FAIL — `extensions/runs.ts` does not exist.

- [ ] **Step 3: Implement `extensions/runs.ts`**

```typescript
import * as fs from "node:fs";
import * as path from "node:path";
import { CONFIG_DIR_NAME } from "@earendil-works/pi-coding-agent";
import type { JobState } from "./hub.ts";

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
	return `${new Date().toISOString().replace(/[:.]/g, "-")}-${process.pid}`;
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `bun test test/runs.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add extensions/runs.ts test/runs.test.ts
git commit -m "feat(council): add runs substrate for transcripts and manifests"
```

---

### Task 2: runs.ts — retention pruning

**Files:**
- Modify: `extensions/runs.ts` (already has `pruneRuns`/`listRunIds` from Task 1)
- Test: `test/runs.test.ts` (append)

**Interfaces:**
- Produces: `pruneRuns(repoRoot, keep?, isAlive?): number` — keeps the newest `keep` runs, deletes older ones unless any manifest pid is alive.

- [ ] **Step 1: Write the failing tests (append to test/runs.test.ts)**

```typescript
import { listRunIds, pruneRuns } from "../extensions/runs.ts";

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
```

- [ ] **Step 2: Run tests**

Run: `bun test test/runs.test.ts`
Expected: PASS if Task 1's `pruneRuns`/`listRunIds` were implemented as specified (they were part of the Task 1 file). If any assertion fails, fix `extensions/runs.ts` to match the spec semantics (newest-first ordering, live-pid skip) — do not weaken the tests.

- [ ] **Step 3: Full suite + typecheck**

Run: `bunx tsc --noEmit && bun test`
Expected: green.

- [ ] **Step 4: Commit**

```bash
git add test/runs.test.ts
git commit -m "test(council): cover run retention pruning"
```

---

### Task 3: buildChildArgv — session persistence flags

**Files:**
- Modify: `extensions/seats.ts` (`buildChildArgv`)
- Test: `test/seats.test.ts`

**Interfaces:**
- Produces: `buildChildArgv(seat, input, promptFile, mcpTools, session: { sessionDir: string; sessionId: string }): string[]` — session param is now REQUIRED; drops `--no-session`, appends `--session-dir <dir> --session-id <id>` right after `-a`.

- [ ] **Step 1: Flip the argv tests to failing expectations**

In `test/seats.test.ts`, replace the `buildChildArgv produces json print-mode invocation` test and update the two other call sites:

```typescript
test("buildChildArgv produces json print-mode invocation with session persistence", () => {
	const owner = loadSeat(tmpRepo(), "owner");
	const argv = buildChildArgv(owner, "do the thing", "/tmp/p.md", [], {
		sessionDir: "/r/runs/x",
		sessionId: "job-1",
	});
	expect(argv).toEqual([
		"--mode",
		"json",
		"-p",
		"-a",
		"--session-dir",
		"/r/runs/x",
		"--session-id",
		"job-1",
		"--model",
		"openrouter/deepseek/deepseek-v4-flash-0731",
		"--thinking",
		"high",
		"--tools",
		"read,bash,edit,write,grep,find,ls",
		"--append-system-prompt",
		"/tmp/p.md",
		"do the thing",
	]);
});
```

and in `buildChildArgv appends granted mcp tool names to --tools`:

```typescript
	const argv = buildChildArgv(owner, "go", "/tmp/p.md", ["mcp__context7__search", "mcp__context7__docs"], {
		sessionDir: "/r",
		sessionId: "job-1",
	});
```

and in `override ooze flows into buildChildArgv --model/--thinking`:

```typescript
	const argv = buildChildArgv(loadSeat(root, "owner"), "do", "/tmp/p.md", [], { sessionDir: "/r", sessionId: "job-1" });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bun test test/seats.test.ts`
Expected: FAIL (signature/argv mismatch, `--no-session` still present).

- [ ] **Step 3: Update `buildChildArgv` in `extensions/seats.ts`**

```typescript
export function buildChildArgv(
	seat: Seat,
	input: string,
	promptFile: string,
	mcpTools: string[] = [],
	session: { sessionDir: string; sessionId: string },
): string[] {
	// -a: trust project-local files — the child runs headless in the same repo
	// the (already-trusted) parent dispatched from, so project extensions load.
	// --tools is an exact-name allowlist: granted MCP tool names are enumerated
	// here so the model can see and call them after the child registers them.
	// Sessions persist into the council runs dir so transcripts are navigable;
	// --session-dir scopes them away from the user's normal session list.
	const argv = ["--mode", "json", "-p", "-a", "--session-dir", session.sessionDir, "--session-id", session.sessionId, "--model", seat.model];
	if (seat.thinkingLevel) argv.push("--thinking", seat.thinkingLevel);
	argv.push("--tools", [...builtinToolsFor(seat), ...mcpTools].join(","));
	argv.push("--append-system-prompt", promptFile);
	argv.push(input);
	return argv;
}
```

- [ ] **Step 4: Fix the other caller (hub-tools.ts) minimally so typecheck passes**

In `extensions/hub-tools.ts` the dispatch call site now needs the session arg; wire it fully (this is the real wiring, not a stub):

```typescript
			const hub = getHub(repoRoot);
			const jobId = hub.allocateId();
			const runId = hub.runId ?? mintRunId();
			const dir = ensureRunDir(repoRoot, runId);
```

and in `spawnJob`:

```typescript
			const job = hub.spawnJob({
				id: jobId,
				seat: seat.name,
				model: seat.model,
				command: "pi",
				args: buildChildArgv(seat, params.input, promptFile, mcpToolNames, {
					sessionDir: dir,
					sessionId: jobId,
				}),
				cwd: repoRoot,
				env: childEnv({ ...process.env, COUNCIL_SEAT: seat.name }, runId, jobId),
				timeoutMs: (params.timeout_minutes ?? 15) * 60_000,
				stallMs: (params.stall_minutes ?? 4) * 60_000,
				cleanup: () => {
					try {
						fs.rmSync(tmpDir, { recursive: true, force: true });
					} catch {
						/* best effort */
					}
				},
			});
```

Add imports to `hub-tools.ts`: `import { childEnv, ensureRunDir, mintRunId } from "./runs.ts";` — `allocateId`, `runId`, and the new `spawnJob` opts come from Task 4; if typecheck fails here, implement Task 4 next before committing this task. (If you prefer strict per-task green: do Task 4's hub changes in the same commit.)

- [ ] **Step 5: Run tests + typecheck**

Run: `bunx tsc --noEmit && bun test test/seats.test.ts`
Expected: PASS (typecheck may require Task 4; if so, proceed to Task 4 and commit both together).

- [ ] **Step 6: Commit**

```bash
git add extensions/seats.ts extensions/hub-tools.ts test/seats.test.ts
git commit -m "feat(council): persist seat sessions into runs dir"
```

---

### Task 4: Hub — run-aware ids and manifests

**Files:**
- Modify: `extensions/hub.ts`
- Test: `test/hub.test.ts`

**Interfaces:**
- Produces: `Hub` opts gain `run?: { repoRoot: string; runId: string; parentJobPath?: string }`; `hub.allocateId(): string` (top-level `job-<n>`, nested `<parentJobPath>.<n>`); `hub.runId?: string`; `spawnJob` opts gain required `id: string` and optional `model?: string`; manifests written at spawn and every state transition.
- Consumes: `writeManifest` from `./runs.ts`.

- [ ] **Step 1: Write the failing tests (update test/hub.test.ts)**

Update the `spawnStub` helper to pass an id:

```typescript
function spawnStub(h: Hub, mode: string, over: Partial<{ timeoutMs: number; stallMs: number }> = {}) {
	return h.spawnJob({
		id: h.allocateId(),
		seat: "stub",
		command: "bun",
		args: [STUB],
		cwd: import.meta.dir,
		env: { ...process.env, STUB_MODE: mode } as Record<string, string>,
		timeoutMs: over.timeoutMs ?? 60_000,
		stallMs: over.stallMs ?? 60_000,
	});
}
```

Append new tests:

```typescript
import * as fs from "node:fs";
import { CONFIG_DIR_NAME } from "@earendil-works/pi-coding-agent";

test("top-level hub ids are job-N", () => {
	hub = new Hub({ monitorIntervalMs: 50, pidFile });
	expect(hub.allocateId()).toBe("job-1");
	expect(hub.allocateId()).toBe("job-2");
});

test("nested hub path-encodes ids from parentJobPath", () => {
	hub = new Hub({ monitorIntervalMs: 50, pidFile, run: { repoRoot: fs.mkdtempSync(path.join(os.tmpdir(), "council-nest-")), runId: "runN", parentJobPath: "job-1" } });
	expect(hub.allocateId()).toBe("job-1.1");
	expect(hub.allocateId()).toBe("job-1.2");
});

test("run-aware hub writes manifests at spawn and settle", async () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "council-man-"));
	hub = new Hub({ monitorIntervalMs: 50, pidFile, run: { repoRoot: root, runId: "runM", parentJobPath: "job-2" } });
	const job = spawnStub(hub, "emit");
	expect(job.id).toBe("job-2.1");
	const mFile = path.join(root, CONFIG_DIR_NAME, "council", "runs", "runM", "job-2.1.json");
	const during = JSON.parse(fs.readFileSync(mFile, "utf-8"));
	expect(during.state).toBe("running");
	expect(during.parentJobId).toBe("job-2");
	expect(during.sessionId).toBe("job-2.1");
	const [r] = await hub.wait([job.id], 10_000);
	expect(r.state).toBe("done");
	const after = JSON.parse(fs.readFileSync(mFile, "utf-8"));
	expect(after.state).toBe("done");
	expect(after.exitCode).toBe(0);
	expect(typeof after.settledAt).toBe("number");
});

test("cancel is reflected in the manifest", async () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "council-manc-"));
	hub = new Hub({ monitorIntervalMs: 50, pidFile, run: { repoRoot: root, runId: "runC" } });
	const job = spawnStub(hub, "hang");
	await Bun.sleep(300);
	hub.cancel(job.id);
	await hub.wait([job.id], 10_000);
	const m = JSON.parse(fs.readFileSync(path.join(root, CONFIG_DIR_NAME, "council", "runs", "runC", `${job.id}.json`), "utf-8"));
	expect(m.state).toBe("cancelled");
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bun test test/hub.test.ts`
Expected: FAIL (`allocateId` missing, `spawnJob` rejects unknown opts / no manifest).

- [ ] **Step 3: Implement hub changes in `extensions/hub.ts`**

Add import: `import { writeManifest } from "./runs.ts";`

Add to `Job`: `model?: string;`

Add to constructor opts and store:

```typescript
export interface HubRunOpts {
	repoRoot: string;
	runId: string;
	parentJobPath?: string;
}
```

In the class:

```typescript
	private run?: HubRunOpts;
	private counter = 1;

	constructor(opts?: { monitorIntervalMs?: number; pidFile?: string; onChange?: () => void; run?: HubRunOpts }) {
		this.run = opts?.run;
		// ... existing body unchanged
	}

	get runId(): string | undefined {
		return this.run?.runId;
	}

	allocateId(): string {
		const n = this.counter++;
		return this.run?.parentJobPath ? `${this.run.parentJobPath}.${n}` : `job-${n}`;
	}

	private writeJobManifest(job: Job): void {
		if (!this.run) return;
		writeManifest(this.run.repoRoot, this.run.runId, {
			id: job.id,
			seat: job.seat,
			model: job.model ?? "",
			parentJobId: this.run.parentJobPath ?? null,
			pid: job.pid ?? null,
			sessionId: job.id,
			state: job.state,
			startedAt: job.startedAt,
			settledAt: job.exitCode !== null ? Date.now() : null,
			exitCode: job.exitCode,
		});
	}
```

In `spawnJob`: add `id: string; model?: string;` to opts; set `job.id = opts.id` (remove the `job-${this.nextId++}` generation and the `nextId` field); set `job.model = opts.model`; after `job.pid = proc.pid;` add `this.writeJobManifest(job);`.

In `settle()`: add `this.writeJobManifest(job);` before `this.onChange?.()`.

In `cancel()`: after `job.state = "cancelled";` add `this.writeJobManifest(job);`.

In `tick()`: after each of the `job.state = "stalled"` and `job.state = "timeout"` assignments add `this.writeJobManifest(job);`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `bunx tsc --noEmit && bun test test/hub.test.ts`
Expected: PASS. (If `hub-tools.ts` from Task 4-step-4 of Task 3 was left type-broken, it now compiles.)

- [ ] **Step 5: Commit**

```bash
git add extensions/hub.ts extensions/hub-tools.ts test/hub.test.ts
git commit -m "feat(hub): path-encoded job ids and per-job manifests"
```

---

### Task 5: Identity wiring — parent, child, dispatch

**Files:**
- Modify: `extensions/hub-tools.ts` (`initHubIdentity`, `getHub`)
- Modify: `extensions/child.ts`
- Modify: `extensions/index.ts`
- Test: `test/integration.test.ts` (gated)

**Interfaces:**
- Produces: `initHubIdentity(runId: string, parentJobPath?: string): void` — must be called before the first `getHub` in a process.

- [ ] **Step 1: Update the gated integration test (failing until wiring lands)**

Rewrite `test/integration.test.ts`'s dispatch block:

```typescript
import { Hub } from "../extensions/hub.ts";
import { buildChildArgv, buildSystemPrompt, loadSeat, proceduresDir } from "../extensions/seats.ts";
import { childEnv, ensureRunDir, findSessionFile, readManifests } from "../extensions/runs.ts";

// inside the test, replacing the hub/spawnJob block:
		const runId = "int-run";
		const dir = ensureRunDir(root, runId);
		const hub = new Hub({
			monitorIntervalMs: 1000,
			pidFile: path.join(tmpDir, "pids.json"),
			run: { repoRoot: root, runId },
		});
		try {
			const jobId = hub.allocateId();
			const job = hub.spawnJob({
				id: jobId,
				seat: seat.name,
				model: seat.model,
				command: "pi",
				args: buildChildArgv(seat, "Reply with exactly one sentence describing what a council board is. Do not use any tool.", promptFile, [], {
					sessionDir: dir,
					sessionId: jobId,
				}),
				cwd: root,
				env: childEnv({ ...process.env, COUNCIL_SEAT: seat.name }, runId, jobId),
				timeoutMs: 5 * 60_000,
				stallMs: 3 * 60_000,
			});
			const [r] = await hub.wait([job.id], 5 * 60_000);
			if (r.state !== "done") console.error("stderr tail:", r.stderrTail);
			expect(r.state).toBe("done");
			expect(r.output.length).toBeGreaterThan(10);
			expect(r.usage.turns).toBeGreaterThanOrEqual(1);
			// transcript substrate: session file exists and manifest settled
			expect(findSessionFile(root, runId, jobId)).toBeDefined();
			const [m] = readManifests(root, runId);
			expect(m.state).toBe("done");
			expect(m.id).toBe("job-1");
```

- [ ] **Step 2: Implement `initHubIdentity` in `extensions/hub-tools.ts`**

```typescript
let hubIdentity: { runId: string; parentJobPath?: string } | undefined;

export function initHubIdentity(runId: string, parentJobPath?: string): void {
	hubIdentity = { runId, parentJobPath };
}
```

and in `getHub`:

```typescript
		hubSingleton = new Hub({
			pidFile: pidFilePath(repoRoot),
			onChange: () => hubOnChange?.(),
			run: hubIdentity ? { repoRoot, runId: hubIdentity.runId, parentJobPath: hubIdentity.parentJobPath } : undefined,
		});
```

- [ ] **Step 3: Wire child mode in `extensions/child.ts`**

At the top of `runChildMode`, before `registerHubTools`:

```typescript
	initHubIdentity(process.env.COUNCIL_RUN_ID ?? mintRunId(), process.env.COUNCIL_JOB_ID);
```

Imports: `import { mintRunId } from "./runs.ts";` and `initHubIdentity` from `./hub-tools.ts`.

- [ ] **Step 4: Wire parent mode in `extensions/index.ts`**

In the `session_start` handler, before `getHub(repoRoot, renderWidget)`:

```typescript
		initHubIdentity(mintRunId());
		pruneRuns(repoRoot);
```

Imports: `import { mintRunId, pruneRuns } from "./runs.ts";` and `initHubIdentity` from `./hub-tools.ts`.

- [ ] **Step 5: Run suite + typecheck; run gated integration if credentials exist**

Run: `bunx tsc --noEmit && bun test`
Then, only if network + OpenRouter creds are available: `COUNCIL_INTEGRATION=1 bun test test/integration.test.ts`
Expected: green; integration asserts session file + manifest.

- [ ] **Step 6: Commit**

```bash
git add extensions/hub-tools.ts extensions/child.ts extensions/index.ts test/integration.test.ts
git commit -m "feat(council): propagate run identity across seat nesting"
```

---

### Task 6: transcript.ts — parser + incremental tail

**Files:**
- Create: `extensions/transcript.ts`
- Test: `test/transcript.test.ts`

**Interfaces:**
- Produces: `TranscriptBlock { kind, text, detail?, label?, bytes? }`, `parseTranscript(raw: string): TranscriptBlock[]`, `class TranscriptTail { constructor(file); poll(): TranscriptBlock[] }`.

- [ ] **Step 1: Write the failing tests**

```typescript
// test/transcript.test.ts
import { test, expect } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { parseTranscript, TranscriptTail } from "../extensions/transcript.ts";

const HEADER = `{"type":"session","version":3,"id":"job-1","timestamp":"t","cwd":"/x"}`;
const USER = `{"type":"message","id":"1","parentId":null,"timestamp":"t","message":{"role":"user","content":[{"type":"text","text":"do it"}]}}`;
const ASSISTANT = `{"type":"message","id":"2","parentId":"1","timestamp":"t","message":{"role":"assistant","content":[{"type":"thinking","thinking":"hmm\\nmore"},{"type":"toolCall","id":"c1","name":"bash","arguments":{"command":"ls"}},{"type":"text","text":"listing now"}]}}`;
const RESULT = `{"type":"message","id":"3","parentId":"2","timestamp":"t","message":{"role":"toolResult","toolCallId":"c1","toolName":"bash","content":[{"type":"text","text":"a.txt\\nb.txt"}],"isError":false}}`;

test("parseTranscript yields typed blocks in order", () => {
	const blocks = parseTranscript([HEADER, USER, ASSISTANT, RESULT].join("\n"));
	expect(blocks.map((b) => b.kind)).toEqual(["user", "thinking", "toolCall", "assistant", "toolResult"]);
	expect(blocks[0].text).toBe("do it");
	expect(blocks[1].text).toBe("hmm"); // collapsed first line
	expect(blocks[1].detail).toBe("hmm\nmore");
	expect(blocks[2].label).toBe("bash");
	expect(blocks[2].detail).toContain("\"ls\"");
	expect(blocks[3].text).toBe("listing now");
	expect(blocks[4].label).toBe("bash");
	expect(blocks[4].text).toBe("a.txt");
	expect(blocks[4].detail).toBe("a.txt\nb.txt");
	expect(blocks[4].bytes).toBe(11);
});

test("parseTranscript tolerates a trailing partial line", () => {
	const blocks = parseTranscript(USER + "\n" + `{"type":"message","id":"9","par`);
	expect(blocks.map((b) => b.kind)).toEqual(["user"]);
});

test("TranscriptTail returns only new blocks per poll and buffers partials", () => {
	const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "council-tail-")), "s.jsonl");
	fs.writeFileSync(file, HEADER + "\n" + USER + "\n");
	const tail = new TranscriptTail(file);
	expect(tail.poll().map((b) => b.kind)).toEqual(["user"]);
	expect(tail.poll()).toEqual([]);
	// partial append: split RESULT mid-line
	fs.appendFileSync(file, RESULT.slice(0, 40));
	expect(tail.poll()).toEqual([]);
	fs.appendFileSync(file, RESULT.slice(40) + "\n");
	expect(tail.poll().map((b) => b.kind)).toEqual(["toolResult"]);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bun test test/transcript.test.ts`
Expected: FAIL — module missing.

- [ ] **Step 3: Implement `extensions/transcript.ts`**

```typescript
import * as fs from "node:fs";

export interface TranscriptBlock {
	kind: "user" | "assistant" | "thinking" | "toolCall" | "toolResult";
	text: string;
	detail?: string;
	label?: string;
	bytes?: number;
}

function firstLine(s: string): string {
	return s.split("\n")[0] ?? "";
}

function textOf(content: unknown): string {
	if (!Array.isArray(content)) return "";
	return (content as Array<{ type?: string; text?: string }>)
		.filter((p) => p.type === "text")
		.map((p) => p.text ?? "")
		.join("\n");
}

export function parseTranscript(raw: string): TranscriptBlock[] {
	const blocks: TranscriptBlock[] = [];
	for (const line of raw.split("\n")) {
		if (!line.trim()) continue;
		let e: any;
		try {
			e = JSON.parse(line);
		} catch {
			continue; // incomplete trailing line during live tail
		}
		if (e?.type !== "message") continue;
		const m = e.message;
		if (m?.role === "user") {
			blocks.push({ kind: "user", text: textOf(m.content) });
		} else if (m?.role === "assistant") {
			for (const part of (m.content ?? []) as Array<Record<string, any>>) {
				if (part.type === "thinking") {
					blocks.push({ kind: "thinking", text: firstLine(part.thinking ?? ""), detail: part.thinking ?? "" });
				} else if (part.type === "text" && part.text) {
					blocks.push({ kind: "assistant", text: part.text });
				} else if (part.type === "toolCall") {
					blocks.push({
						kind: "toolCall",
						label: String(part.name ?? "tool"),
						text: String(part.name ?? "tool"),
						detail: JSON.stringify(part.arguments ?? {}, null, 2),
					});
				}
			}
		} else if (m?.role === "toolResult") {
			const t = Array.isArray(m.content)
				? (m.content as Array<{ type?: string; text?: string }>)
						.map((c) => (c.type === "text" ? (c.text ?? "") : `[${c.type}]`))
						.join("\n")
				: "";
			blocks.push({ kind: "toolResult", label: String(m.toolName ?? "tool"), text: firstLine(t), detail: t, bytes: t.length });
		}
	}
	return blocks;
}

/** Incremental reader: parses bytes appended since the last poll;
 * holds an incomplete trailing line until it completes. */
export class TranscriptTail {
	private offset = 0;
	private partial = "";

	constructor(private file: string) {}

	poll(): TranscriptBlock[] {
		let stat: fs.Stats;
		try {
			stat = fs.statSync(this.file);
		} catch {
			return [];
		}
		if (stat.size <= this.offset) return [];
		const fd = fs.openSync(this.file, "r");
		const buf = Buffer.alloc(stat.size - this.offset);
		fs.readSync(fd, buf, 0, buf.length, this.offset);
		fs.closeSync(fd);
		this.offset = stat.size;
		const text = this.partial + buf.toString();
		const lines = text.split("\n");
		this.partial = lines.pop() ?? "";
		return parseTranscript(lines.join("\n"));
	}
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `bun test test/transcript.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add extensions/transcript.ts test/transcript.test.ts
git commit -m "feat(council): add session transcript parser and incremental tail"
```

---

### Task 7: tree.ts — forest from manifests

**Files:**
- Create: `extensions/tree.ts`
- Test: `test/tree.test.ts`

**Interfaces:**
- Produces: `TreeNode { manifest, children, depth, orphaned }`, `buildTree(manifests, isAlive?): TreeNode[]`, `flattenTree(roots): TreeNode[]`, `textTree(repoRoot, runIds): string[]`.
- Consumes: `readManifests`, `pidAlive`, `RunManifest` from `./runs.ts`.

- [ ] **Step 1: Write the failing tests**

```typescript
// test/tree.test.ts
import { test, expect } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { buildTree, flattenTree, textTree } from "../extensions/tree.ts";
import { ensureRunDir, writeManifest, type RunManifest } from "../extensions/runs.ts";

function m(id: string, over: Partial<RunManifest> = {}): RunManifest {
	return {
		id,
		seat: id.includes(".") ? "skeptic" : "owner",
		model: "m/x",
		parentJobId: id.includes(".") ? id.split(".").slice(0, -1).join(".") : null,
		pid: null,
		sessionId: id,
		state: "done",
		startedAt: 1,
		settledAt: 2,
		exitCode: 0,
		...over,
	};
}

test("buildTree nests by parentJobId and sorts numerically", () => {
	const roots = buildTree([m("job-2"), m("job-1"), m("job-1.10"), m("job-1.2")], () => false);
	expect(roots.map((r) => r.manifest.id)).toEqual(["job-1", "job-2"]);
	expect(roots[0].children.map((c) => c.manifest.id)).toEqual(["job-1.2", "job-1.10"]);
	expect(roots[0].children[0].depth).toBe(1);
});

test("orphaned: running manifest with dead pid", () => {
	const roots = buildTree([m("job-1", { state: "running", pid: 999999 })], (pid) => pid === process.pid);
	expect(roots[0].orphaned).toBe(true);
	const alive = buildTree([m("job-1", { state: "running", pid: process.pid })], (pid) => pid === process.pid);
	expect(alive[0].orphaned).toBe(false);
});

test("flattenTree is pre-order", () => {
	const flat = flattenTree(buildTree([m("job-1"), m("job-1.2"), m("job-1.2.1")], () => false));
	expect(flat.map((n) => n.manifest.id)).toEqual(["job-1", "job-1.2", "job-1.2.1"]);
});

test("textTree renders indented rows with glyphs", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "council-tree-"));
	ensureRunDir(root, "runT");
	writeManifest(root, "runT", m("job-1", { state: "running", pid: process.pid }));
	writeManifest(root, "runT", m("job-1.2", { state: "failed", pid: 12 }));
	const lines = textTree(root, ["runT"]);
	expect(lines[0]).toBe("run runT");
	expect(lines[1]).toContain("● job-1 owner");
	expect(lines[2]).toMatch(/^\s{4}✗ job-1\.2 skeptic failed/);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bun test test/tree.test.ts`
Expected: FAIL — module missing.

- [ ] **Step 3: Implement `extensions/tree.ts`**

```typescript
import { pidAlive, readManifests, type RunManifest } from "./runs.ts";

export interface TreeNode {
	manifest: RunManifest;
	children: TreeNode[];
	depth: number;
	orphaned: boolean;
}

export function buildTree(manifests: RunManifest[], isAlive: (pid: number) => boolean = pidAlive): TreeNode[] {
	const nodes = new Map<string, TreeNode>();
	for (const m of manifests) {
		nodes.set(m.id, {
			manifest: m,
			children: [],
			depth: 0,
			orphaned: m.state === "running" && (m.pid === null || !isAlive(m.pid)),
		});
	}
	const roots: TreeNode[] = [];
	for (const m of manifests) {
		const n = nodes.get(m.id)!;
		const parent = m.parentJobId ? nodes.get(m.parentJobId) : undefined;
		if (parent) parent.children.push(n);
		else roots.push(n);
	}
	const byId = (a: TreeNode, b: TreeNode) => a.manifest.id.localeCompare(b.manifest.id, undefined, { numeric: true });
	const walk = (n: TreeNode, depth: number): void => {
		n.depth = depth;
		n.children.sort(byId);
		for (const c of n.children) walk(c, depth + 1);
	};
	roots.sort(byId);
	for (const r of roots) walk(r, 0);
	return roots;
}

export function flattenTree(roots: TreeNode[]): TreeNode[] {
	const out: TreeNode[] = [];
	const walk = (n: TreeNode): void => {
		out.push(n);
		for (const c of n.children) walk(c);
	};
	for (const r of roots) walk(r);
	return out;
}

const GLYPH: Record<string, string> = {
	running: "●",
	done: "✓",
	failed: "✗",
	stalled: "⏸",
	cancelled: "⊘",
	timeout: "⚠",
};

/** Plain-text tree for headless parents. */
export function textTree(repoRoot: string, runIds: string[]): string[] {
	const lines: string[] = [];
	for (const runId of runIds) {
		const nodes = flattenTree(buildTree(readManifests(repoRoot, runId)));
		if (nodes.length === 0) continue;
		lines.push(`run ${runId}`);
		for (const n of nodes) {
			const m = n.manifest;
			const glyph = n.orphaned ? "☠" : (GLYPH[m.state] ?? "?");
			const mins = ((Date.now() - m.startedAt) / 60_000).toFixed(1);
			lines.push(`${"  ".repeat(n.depth + 1)}${glyph} ${m.id} ${m.seat} ${m.state} ${mins}m pid=${m.pid ?? "?"}`);
		}
	}
	return lines;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `bun test test/tree.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add extensions/tree.ts test/tree.test.ts
git commit -m "feat(council): build job forest from run manifests"
```

---

### Task 8: navigator.ts — tree overlay + entry points

**Files:**
- Create: `extensions/navigator.ts` (tree half)
- Modify: `extensions/index.ts` (register navigator + widget hint)
- Test: `test/navigator.test.ts`

**Interfaces:**
- Produces: `TREE_SHORTCUT = "ctrl+shift+t"`, `NavTheme`, `class CouncilTree implements Component`, `registerNavigator(pi, repoRoot, currentRunId)`.
- Consumes: `listRunIds`, `readManifests`, `findSessionFile` from `./runs.ts`; `buildTree`, `flattenTree`, `textTree`, `TreeNode` from `./tree.ts`.

- [ ] **Step 1: Write the failing tests**

```typescript
// test/navigator.test.ts
import { test, expect } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { CouncilTree, type NavTheme } from "../extensions/navigator.ts";
import { ensureRunDir, writeManifest, type RunManifest } from "../extensions/runs.ts";

const theme: NavTheme = { fg: (_c, s) => s, bold: (s) => s };

function m(id: string, over: Partial<RunManifest> = {}): RunManifest {
	return {
		id,
		seat: "owner",
		model: "m/x",
		parentJobId: id.includes(".") ? "job-1" : null,
		pid: null,
		sessionId: id,
		state: "running",
		startedAt: Date.now(),
		settledAt: null,
		exitCode: null,
		...over,
	};
}

test("CouncilTree renders rows indented by depth and selects with arrows", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "council-nav-"));
	ensureRunDir(root, "runV");
	writeManifest(root, "runV", m("job-1"));
	writeManifest(root, "runV", m("job-1.2", { seat: "skeptic" }));
	let opened: string | null = null;
	const tree = new CouncilTree(root, "runV", theme, (n) => (opened = n.manifest.id), () => {});
	const lines = tree.render(100);
	expect(lines[1]).toContain("job-1 owner");
	expect(lines[2]).toContain("job-1.2 skeptic");
	expect(lines[2].indexOf("job-1.2")).toBeGreaterThan(lines[1].indexOf("job-1"));
	tree.handleInput("\x1b[B"); // down
	tree.handleInput("\r"); // enter
	expect(opened).toBe("job-1.2");
});

test("CouncilTree with no jobs renders empty hint", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "council-nav2-"));
	const tree = new CouncilTree(root, undefined, theme, () => {}, () => {});
	expect(tree.render(80).some((l) => l.includes("(no jobs)"))).toBe(true);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bun test test/navigator.test.ts`
Expected: FAIL — module missing.

- [ ] **Step 3: Implement `extensions/navigator.ts` (tree half; transcript view added in Task 9)**

```typescript
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Key, matchesKey, truncateToWidth, type Component } from "@earendil-works/pi-tui";
import { findSessionFile, listRunIds, readManifests } from "./runs.ts";
import { buildTree, flattenTree, textTree, type TreeNode } from "./tree.ts";

export const TREE_SHORTCUT = "ctrl+shift+t";

export interface NavTheme {
	fg: (color: string, s: string) => string;
	bold: (s: string) => string;
}

const GLYPH: Record<string, string> = {
	running: "●",
	done: "✓",
	failed: "✗",
	stalled: "⏸",
	cancelled: "⊘",
	timeout: "⚠",
};

export class CouncilTree implements Component {
	private rows: Array<{ node: TreeNode; runId: string }> = [];
	private selected = 0;
	private scopeAll = false;
	private cached?: { w: number; lines: string[] };

	constructor(
		private repoRoot: string,
		private currentRunId: string | undefined,
		private theme: NavTheme,
		private onOpen: (node: TreeNode, runId: string) => void,
		private onClose: () => void,
	) {
		this.refresh();
	}

	refresh(): void {
		const ids = this.scopeAll
			? listRunIds(this.repoRoot)
			: this.currentRunId
				? [this.currentRunId]
				: listRunIds(this.repoRoot).slice(0, 1);
		this.rows = ids.flatMap((runId) =>
			flattenTree(buildTree(readManifests(this.repoRoot, runId))).map((node) => ({ node, runId })),
		);
		if (this.selected >= this.rows.length) this.selected = Math.max(0, this.rows.length - 1);
		this.cached = undefined;
	}

	handleInput(data: string): void {
		if (matchesKey(data, Key.up)) {
			this.selected = Math.max(0, this.selected - 1);
			this.cached = undefined;
			return;
		}
		if (matchesKey(data, Key.down)) {
			this.selected = Math.min(this.rows.length - 1, this.selected + 1);
			this.cached = undefined;
			return;
		}
		if (matchesKey(data, Key.tab)) {
			this.scopeAll = !this.scopeAll;
			this.refresh();
			return;
		}
		if (matchesKey(data, Key.enter) && this.rows[this.selected]) {
			const r = this.rows[this.selected];
			this.onOpen(r.node, r.runId);
			return;
		}
		if (matchesKey(data, Key.escape)) this.onClose();
	}

	render(width: number): string[] {
		if (this.cached?.w === width) return this.cached.lines;
		const lines = [
			this.theme.bold(`council jobs${this.scopeAll ? " (all runs)" : ""} — ↑↓ move · enter view · tab runs · esc close`),
		];
		if (this.rows.length === 0) lines.push(this.theme.fg("dim", "  (no jobs)"));
		this.rows.forEach((r, i) => {
			const m = r.node.manifest;
			const glyph = r.node.orphaned ? "☠" : (GLYPH[m.state] ?? "?");
			const mins = ((Date.now() - m.startedAt) / 60_000).toFixed(1);
			const row = `${"  ".repeat(r.node.depth)}${glyph} ${m.id} ${m.seat} ${mins}m${m.state === "running" ? "" : ` ${m.state}`}`;
			lines.push(truncateToWidth(i === this.selected ? this.theme.fg("accent", `> ${row}`) : `  ${row}`, width));
		});
		this.cached = { w: width, lines };
		return lines;
	}

	invalidate(): void {
		this.cached = undefined;
	}
}

export function registerNavigator(pi: ExtensionAPI, repoRoot: string, currentRunId: () => string | undefined): void {
	const open = async (ctx: { hasUI: boolean; ui: any }): Promise<void> => {
		if (!ctx.hasUI) {
			const lines = textTree(repoRoot, listRunIds(repoRoot).slice(0, 5));
			console.log(lines.length ? lines.join("\n") : "No council jobs yet.");
			return;
		}
		await ctx.ui.custom<string | null>(
			(tui: any, theme: NavTheme, _kb: unknown, done: (v: string | null) => void) => {
				const tree = new CouncilTree(
					repoRoot,
					currentRunId(),
					theme,
					(node, runId) => {
						openTranscript(ctx, tui, node, runId);
					},
					() => close(),
				);
				const refreshTimer = setInterval(() => {
					tree.refresh();
					tui.requestRender();
				}, 2000);
				const close = () => {
					clearInterval(refreshTimer);
					done(null);
				};
				return {
					render: (w: number) => tree.render(w),
					invalidate: () => tree.invalidate(),
					handleInput: (d: string) => {
						tree.handleInput(d);
						tui.requestRender();
					},
				};
			},
			{ overlay: true },
		);
	};

	pi.registerCommand("council-tree", {
		description: "Browse the live council job tree and seat transcripts",
		handler: async (_args, ctx) => {
			await open(ctx);
		},
	});
	pi.registerShortcut(TREE_SHORTCUT, {
		description: "Open the council job tree",
		handler: async (ctx) => {
			await open(ctx);
		},
	});
}

// Filled in Task 9 — keep as a hoisted function so Task 8 compiles.
function openTranscript(_ctx: { ui: any }, _tui: any, _node: TreeNode, _runId: string): void {
	// no-op until Task 9
}
```

- [ ] **Step 4: Register the navigator in `extensions/index.ts`**

In parent mode, after `registerHubTools(pi, repoRoot)`:

```typescript
	registerNavigator(pi, repoRoot, () => getHub(repoRoot).runId);
```

Import: `import { registerNavigator, TREE_SHORTCUT } from "./navigator.ts";`

Widget hint — in `renderWidget`, when building the `active.map(...)` lines, append the hint to the last line:

```typescript
			const lines = active.map((j) => {
				// ... existing line construction unchanged
			});
			if (lines.length > 0) lines[lines.length - 1] += `  ·  ${TREE_SHORTCUT} to browse`;
			uiCtx.ui.setWidget("council", lines);
```

- [ ] **Step 5: Run tests + typecheck**

Run: `bunx tsc --noEmit && bun test`
Expected: green.

- [ ] **Step 6: Commit**

```bash
git add extensions/navigator.ts extensions/index.ts test/navigator.test.ts
git commit -m "feat(council): add council-tree overlay and shortcut"
```

---

### Task 9: navigator.ts — live transcript viewer

**Files:**
- Modify: `extensions/navigator.ts` (replace the `openTranscript` no-op with the real viewer)
- Test: `test/navigator.test.ts` (append)

**Interfaces:**
- Produces: `class TranscriptView implements Component` — incremental tail, follow mode, block focus/expand, thinking toggle, 200-line expansion cap.

- [ ] **Step 1: Write the failing tests (append to test/navigator.test.ts)**

```typescript
import { TranscriptView } from "../extensions/navigator.ts";

test("TranscriptView renders blocks and expands with e", () => {
	const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "council-view-")), "s.jsonl");
	const user = `{"type":"message","id":"1","parentId":null,"timestamp":"t","message":{"role":"user","content":[{"type":"text","text":"hello"}]}}`;
	const result = `{"type":"message","id":"2","parentId":"1","timestamp":"t","message":{"role":"toolResult","toolCallId":"c","toolName":"bash","content":[{"type":"text","text":"line1\\nline2"}],"isError":false}}`;
	fs.writeFileSync(file, `{"type":"session","version":3,"id":"job-1","timestamp":"t","cwd":"/x"}\n${user}\n${result}\n`);
	let closed = false;
	const view = new TranscriptView(file, theme, "job-1 owner", 24, () => (closed = true));
	const lines = view.render(80);
	expect(lines.some((l) => l.includes("user"))).toBe(true);
	expect(lines.some((l) => l.includes("hello"))).toBe(true);
	expect(lines.some((l) => l.includes("line1"))).toBe(true); // collapsed first-line preview
	expect(lines.some((l) => l.includes("line2"))).toBe(false); // rest hidden until expanded
	// focus the toolResult block (index 1) and expand
	view.handleInput("\x1b[B"); // down
	view.handleInput("e");
	const expanded = view.render(80);
	expect(expanded.some((l) => l.includes("line2"))).toBe(true);
	view.handleInput("\x1b"); // esc closes
	expect(closed).toBe(true);
	view.dispose();
});

test("TranscriptView without a session file renders a no-transcript notice", () => {
	let closed = false;
	const view = new TranscriptView(undefined, theme, "job-9 owner", 24, () => (closed = true));
	expect(view.render(80).some((l) => l.includes("no transcript"))).toBe(true);
	view.dispose();
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bun test test/navigator.test.ts`
Expected: FAIL (TranscriptView missing / no-op).

- [ ] **Step 3: Implement `TranscriptView` and replace `openTranscript` in `extensions/navigator.ts`**

Add imports: `wrapTextWithAnsi` from `@earendil-works/pi-tui`; `TranscriptTail, type TranscriptBlock` from `./transcript.ts`. Then add the class and the real `openTranscript` (replacing the Task 8 no-op):

```typescript
export class TranscriptView implements Component {
	private tail: TranscriptTail | null;
	private blocks: TranscriptBlock[] = [];
	private expanded = new Set<number>();
	private showThinking = false;
	private focused = 0;
	private topLine = 0;
	private follow = true;
	private timer: ReturnType<typeof setInterval>;
	private onChange?: () => void;

	constructor(
		file: string | undefined,
		private theme: NavTheme,
		private title: string,
		private viewportRows: number,
		private onClose: () => void,
	) {
		this.tail = file ? new TranscriptTail(file) : null;
		this.poll();
		this.timer = setInterval(() => {
			if (this.poll()) this.onChange?.();
		}, 1000);
	}

	setOnChange(fn: () => void): void {
		this.onChange = fn;
	}

	dispose(): void {
		clearInterval(this.timer);
	}

	poll(): boolean {
		const nb = this.tail?.poll() ?? [];
		if (nb.length === 0) return false;
		this.blocks.push(...nb);
		return true;
	}

	private visible(): Array<{ i: number; b: TranscriptBlock }> {
		return this.blocks.map((b, i) => ({ i, b })).filter(({ b }) => b.kind !== "thinking" || this.showThinking);
	}

	private blockLines(b: TranscriptBlock, i: number, width: number): string[] {
		const t = this.theme;
		const head =
			b.kind === "user"
				? t.fg("accent", t.bold("user"))
				: b.kind === "assistant"
					? t.fg("success", t.bold("assistant"))
					: b.kind === "thinking"
						? t.fg("dim", "thinking")
						: b.kind === "toolCall"
							? t.fg("warning", `→ ${b.label}`)
							: t.fg("muted", `⎿ ${b.label} · ${b.bytes ?? 0}b`);
		const out = [head];
		const showBody = b.kind === "user" || b.kind === "assistant" || this.expanded.has(i);
		if (showBody) {
			const body =
				b.kind === "toolCall" || b.kind === "toolResult" || b.kind === "thinking" ? (b.detail ?? "") : b.text;
			const all = body.split("\n");
			const capped = all.slice(0, 200);
			if (all.length > 200) capped.push(t.fg("dim", `… truncated (${body.length} bytes total)`));
			for (const l of capped) out.push(...wrapTextWithAnsi(`  ${l}`, width - 2));
		} else if (b.text) {
			out.push(truncateToWidth(`  ${t.fg("dim", b.text)}`, width));
		}
		return out;
	}

	handleInput(data: string): void {
		const vis = this.visible();
		if (matchesKey(data, Key.up)) {
			this.follow = false;
			this.focused = Math.max(0, this.focused - 1);
		} else if (matchesKey(data, Key.down)) {
			this.follow = false;
			this.focused = Math.min(vis.length - 1, this.focused + 1);
		} else if (matchesKey(data, "e") && vis[this.focused]) {
			const i = vis[this.focused].i;
			if (this.expanded.has(i)) this.expanded.delete(i);
			else this.expanded.add(i);
		} else if (matchesKey(data, "t")) {
			this.showThinking = !this.showThinking;
		} else if (matchesKey(data, "f")) {
			this.follow = !this.follow;
		} else if (matchesKey(data, "g")) {
			this.follow = false;
			this.focused = 0;
		} else if (matchesKey(data, "G")) {
			this.follow = false;
			this.focused = Math.max(0, vis.length - 1);
		} else if (matchesKey(data, Key.escape)) {
			this.dispose();
			this.onClose();
			return;
		}
		this.onChange?.();
	}

	render(width: number): string[] {
		const t = this.theme;
		const vis = this.visible();
		if (this.focused >= vis.length) this.focused = Math.max(0, vis.length - 1);
		const all: string[] = [
			t.bold(`${this.title} — ↑↓ move · e expand · t thinking · f follow${this.follow ? "(on)" : ""} · esc back`),
		];
		if (vis.length === 0) all.push(t.fg("dim", this.tail ? "  (waiting for output…)" : "  (no transcript)"));
		const starts: number[] = [];
		for (const { i, b } of vis) {
			starts.push(all.length);
			all.push(...this.blockLines(b, i, width));
		}
		const focusLine = starts[this.focused] ?? 0;
		const maxTop = Math.max(0, all.length - this.viewportRows);
		if (this.follow) this.topLine = maxTop;
		else this.topLine = Math.min(Math.max(0, focusLine - 2), maxTop);
		return all.slice(this.topLine, this.topLine + this.viewportRows);
	}

	invalidate(): void {}
}

function openTranscript(ctx: { ui: any }, tui: any, repoRoot: string, node: TreeNode, runId: string): void {
	const file = findSessionFile(repoRoot, runId, node.manifest.id);
	void ctx.ui.custom(
		(_t2: any, theme2: NavTheme, _kb: unknown, done2: (v: null) => void) => {
			const view = new TranscriptView(
				file,
				theme2,
				`${node.manifest.id} ${node.manifest.seat}${node.orphaned ? " (orphaned)" : ""}`,
				Math.max(10, (tui?.terminal?.rows ?? 24) - 4),
				() => done2(null),
			);
			view.setOnChange(() => tui?.requestRender?.());
			return view;
		},
		{ overlay: true },
	);
}
```

Wire it up in `registerNavigator` by replacing the Task 8 no-op call site:

```typescript
				(node, runId) => {
					openTranscript(ctx, tui, repoRoot, node, runId);
				},
```

(Overlay-on-overlay keeps the tree visible underneath; Esc on the view closes it and the tree reclaims input.)

- [ ] **Step 4: Run tests + typecheck**

Run: `bunx tsc --noEmit && bun test`
Expected: green.

- [ ] **Step 5: Manual smoke test (interactive)**

Run `pi` in a scratch repo with the package loaded; dispatch a seat via any procedure or directly with `council_dispatch` from the REPL-less flow is not possible — instead: start `pi`, ask it to dispatch the `consolidator` seat with a short task, then press `ctrl+shift+t` (or `/council-tree`): verify tree shows the running job, Enter opens the live transcript that tails, Esc backs out, `x`-free. Also verify `git status` in the scratch repo shows nothing under the config dir.

- [ ] **Step 6: Commit**

```bash
git add extensions/navigator.ts test/navigator.test.ts
git commit -m "feat(council): add live transcript viewer overlay"
```

---

### Task 10: Release hygiene — version, docs, final gate

**Files:**
- Modify: `package.json` (`0.8.0` → `0.9.0`)
- Modify: `AGENTS.md`

- [ ] **Step 1: Bump version**

In `package.json`: `"version": "0.9.0"`.

- [ ] **Step 2: Document the runs dir in AGENTS.md**

Add to the Layout block, under `council/`:

```
  runs/                  NOT packaged — created in consumer repos at
                         $CONFIG_DIR_NAME/council/runs/; per-run manifests +
                         seat session transcripts; self-gitignored ("*"),
                         pruned to 15 runs at parent session_start
```

Add hard convention #12:

```
12. **`runs/` is ephemeral telemetry.** `$CONFIG_DIR_NAME/council/runs/` holds
    per-job manifests and seat session transcripts for the transcript
    navigator. It is self-gitignored (`*`), pruned to the last 15 runs, and
    must never be read by engine logic outside `extensions/runs.ts`,
    `extensions/tree.ts`, `extensions/transcript.ts`, and
    `extensions/navigator.ts`.
```

- [ ] **Step 3: Full gate**

Run: `bunx tsc --noEmit && bun test`
Expected: 34+ tests green (new suites added).

- [ ] **Step 4: Commit**

```bash
git add package.json AGENTS.md
git commit -m "feat(council): release transcript navigator as 0.9.0"
```

- [ ] **Step 5: Release tags (only when cutting the release)**

```bash
git tag v0.9.0 && git tag -f latest v0.9.0 && git push origin main v0.9.0 latest
```
