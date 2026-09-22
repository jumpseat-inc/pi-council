# BUG-2 Implementation Plan — Usages tool creates its output directory before writing the cache

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A non-offline run of `council/skills/usages/scripts/usages.py` — with `--out-dir` omitted or naming an absent directory — creates that directory before writing its cache, so `.cache.json` lands inside it and no `usages: could not write cache:` line is emitted.

**Architecture:** Mechanism B (the settled design): move the single `ensure_out_dir(out_dir)` call in `main` from immediately before the report write (~line 792) up to immediately after the `out_dir`/`cache_file` resolution lines (~line 719), before `load_cache`. `save_cache` stays a pure write-beside-target primitive. Delete the old call; touch nothing else.

**Tech Stack:** Python 3 script (`usages.py`), bun:test suite (`test/usages.test.ts`), `Bun.serve` HTTP stub on `port: 0`, `Bun.spawn` async process pattern.

**Spec:** `docs/superpowers/specs/2026-09-22-BUG-2-design.md` (settled design; card `council/cards/BUG-2.md` is the judge's oracle).

## Global Constraints

- Fix is mechanism B only: insert `ensure_out_dir(out_dir)` after the `out_dir`/`cache_file` resolution in `main`; delete the call before the report write. No other line of `usages.py` changes.
- `save_cache` is NOT modified (stays pure write-beside-target + atomic replace).
- `extensions/scaffold.ts`'s `EMPTY_DIRS` is NOT extended; no test pre-creates the output directory.
- T-U7/T-U8 MUST use the async pattern: `Bun.spawn` + `await Promise.all([stdout, stderr, proc.exited])`, `Bun.serve` with `port: 0`, `server.stop(true)` in `finally`. Never the `spawnSync`-based `runTool` helper (it blocks the event loop; the stub cannot answer and the test deadlocks instead of failing).
- T-U7/T-U8 pass neither `--out-dir` (T-U7) nor `--cache-file` (both) and not `--offline`. A closed port is not a substitute for the stub — the stub's analytics rows populate the cache.
- R4 (binding): write-ordering fix only. No cache-health report row, no `--cache-file` hardening, cache-write failure stays non-fatal. The foreign `--cache-file` absent-parent limitation is accepted and recorded in the PR body as follow-up material.
- Red-at-base evidence (seven-field record) is captured BEFORE applying the fix, with the tests present and everything else at the base tree.
- Worktree discipline: all writes in `git worktree add .worktrees/bug-2 -b feat/bug-2-usages-out-dir origin/main`; the main repository path's branch state is never touched.
- R1 (binding): push the branch and open a PR against `main`; never merge.

## Review Focus

- **Missing-key exit path must stay directory-free:** T-U2 pins exit 2 with no `<repo>/out` created; the moved `ensure_out_dir` must sit AFTER the `OPENROUTER_MANAGEMENT_KEY` check (it does — the key check precedes `out_dir` resolution in `main`). Covered by the existing T-U2 in Task 2 Step 4.
- **Run-2 rerun value:** run 2's red rests solely on `cache.hits === 1` (run 2's stderr is clean even at base because run 1's old post-report `ensure_out_dir` already created the dir). Keep `hits === 1` as the load-bearing run-2 assertion. Covered in Task 1 Step 1.
- **Stub load-bearingness:** with a dead port no analytics rows arrive and the cache never populates — the tests must use the live `Bun.serve` stub. Covered by the async pattern constraint above.
- **Offline behavior unchanged:** `save_cache` is only called under `not args.offline`; the moved `ensure_out_dir` now runs on the offline path too (it already ran there post-report before the fix — same end state, earlier in time). No test change needed; existing T-U1/T-U3/T-U6 cover offline.
- **Failure surface of a non-creatable directory:** `ensure_out_dir` is unguarded, outside the report-write `try`, before and after the move; its failure is an exit-1 PermissionError traceback in both positions. Do not change it in this card (spec: "do not change that failure surface").

---

### Task 1: T-U7 and T-U8 — failing tests first (red at base)

**Files:**
- Modify: `test/usages.test.ts` (append two tests; no helper changes)
- Test: `test/usages.test.ts`

**Interfaces:**
- Consumes: existing `mkRepo`, `sessionFile`, `assistant` helpers; `PKG_ROOT`-resolved `TOOL` path; T-U4's `Bun.serve` stub shape.
- Produces: T-U7 (default out-dir creation + cache presence + rerun `cache.hits === 1`) and T-U8 (absent custom `--out-dir` creation) — the acceptance oracle's new arms.

- [ ] **Step 1: Write the failing tests** — append to `test/usages.test.ts`:

```ts
const U = "2026-09-18";

function serveStub(): ReturnType<typeof Bun.serve> {
	return Bun.serve({
		port: 0,
		async fetch(req) {
			const url = new URL(req.url);
			if (url.pathname.endsWith("/analytics/query")) {
				const body = (await req.json()) as { filters?: { value?: unknown }[] };
				const raw = body.filters?.[0]?.value;
				const ids = Array.isArray(raw) ? (raw as string[]) : [];
				return Response.json({
					data: {
						data: ids.map((id) => ({
							generation_id: id, total_usage: 0.004, tokens_prompt: 100, tokens_completion: 10,
							cached_tokens: 0, cache_hit_rate: 0,
						})),
					},
				});
			}
			if (url.pathname.endsWith("/activity")) {
				return Response.json({ data: [{ date: "2026-09-18 00:00:00", model: "deepseek/deepseek-v4.1-flash", usage: 0.05 }] });
			}
			return new Response("nope", { status: 404 });
		},
	});
}

function runAsync(args: string[], env: Record<string, string> = {}) {
	const proc = Bun.spawn(
		["python3", TOOL, "--repo", root_, "--agent-dir", agent_, "--config-dir", ".pi", ...args],
		{ env: { ...process.env, OPENROUTER_MANAGEMENT_KEY: "mgmt-test", ...env }, stdout: "pipe", stderr: "pipe" },
	);
	return Promise.all([new Response(proc.stdout).text(), new Response(proc.stderr).text(), proc.exited])
		.then(([stdout, stderr, status]) => ({ stdout, stderr, status }));
}

test("T-U7: first non-offline run creates the default out dir before writing the cache", async () => {
	const { root, agent } = mkRepo();
	sessionFile(agent, root, "2026-09-18T10:00:00.000Z", [
		assistant("2026-09-18T10:00:05.000Z", "gen-dir-1", {
			input: 100, output: 10, cacheRead: 0, cacheWrite: 0, reasoning: 0, totalTokens: 110,
			cost: { total: 0.001 },
		}),
	]);
	const server = serveStub();
	const outDir = path.join(root, ".pi", "council", "usages");
	const args = ["--start", U, "--end", U, "--today", "2026-09-21", "--json",
		"--api-base", `http://127.0.0.1:${server.port}/api/v1`];
	try {
		const r1 = await runAsync(root, agent, args);
		expect(r1.status, r1.stderr).toBe(0);
		expect(r1.stderr).not.toContain("usages: could not write cache:");
		expect(fs.existsSync(path.join(outDir, ".cache.json"))).toBe(true);
		expect(fs.existsSync(path.join(outDir, "usages-2026-09-18_2026-09-18.json"))).toBe(true);
		expect(fs.existsSync(path.join(outDir, "usages-2026-09-18_2026-09-18.md"))).toBe(true);
		expect(fs.readFileSync(path.join(outDir, ".gitignore"), "utf-8")).toBe("*\n");
		const cache = JSON.parse(fs.readFileSync(path.join(outDir, ".cache.json"), "utf-8"));
		expect(cache.generations["gen-dir-1"]).toBeDefined();
		const r2 = await runAsync(root, agent, args);
		expect(r2.status, r2.stderr).toBe(0);
		expect(r2.stderr).not.toContain("usages: could not write cache:");
		const report2 = JSON.parse(r2.stdout);
		expect(report2.cache.hits).toBe(1);
	} finally {
		server.stop(true);
	}
});

test("T-U8: absent custom --out-dir is created before the cache write", async () => {
	const { root, agent } = mkRepo();
	sessionFile(agent, root, "2026-09-18T10:00:00.000Z", [
		assistant("2026-09-18T10:00:05.000Z", "gen-dir-2", {
			input: 100, output: 10, cacheRead: 0, cacheWrite: 0, reasoning: 0, totalTokens: 110,
			cost: { total: 0.001 },
		}),
	]);
	const server = serveStub();
	const outDir = path.join(root, "fresh-out");
	try {
		const r = await runAsync(root, agent, ["--out-dir", outDir, "--start", U, "--end", U, "--today", "2026-09-21", "--json",
			"--api-base", `http://127.0.0.1:${server.port}/api/v1`]);
		expect(r.status, r.stderr).toBe(0);
		expect(r.stderr).not.toContain("usages: could not write cache:");
		expect(fs.existsSync(path.join(outDir, ".cache.json"))).toBe(true);
	} finally {
		server.stop(true);
	}
});
```

(Implementation note: `runAsync` takes `(root, agent, args)` and builds the full argv; the sketch above shows the shape — the committed helper resolves `root`/`agent` as parameters, never module globals.)

- [ ] **Step 2: Run at the pre-fix base to capture red** — in the worktree still at `114b549` with only the test file modified:

Run: `bun test test/usages.test.ts`
Expected: FAIL — T-U7 on `expect(r1.stderr).not.toContain("usages: could not write cache:")` (the literal is present at base) with `.cache.json` absent, and run 2 on `report2.cache.hits` (0 ≠ 1); T-U8 on the same stderr literal with `fresh-out/.cache.json` absent. Record the verbatim per-failure output as the seven-field red-base record.

- [ ] **Step 3: Commit nothing yet** — the red evidence is captured uncommitted at base; the commit in Task 2 carries tests + fix together so no red test lands.

### Task 2: Mechanism B fix — move `ensure_out_dir` above the first `save_cache`

**Files:**
- Modify: `council/skills/usages/scripts/usages.py` (`main`, two lines)

**Interfaces:**
- Consumes: `ensure_out_dir(out_dir)` (unchanged, defined at module level).
- Produces: output directory (and its `.gitignore`) exists before `load_cache`/`save_cache` and before the network phase.

- [ ] **Step 1: Apply the fix** — in `main`:

```python
    repo = os.path.abspath(args.repo)
    out_dir = args.out_dir or os.path.join(repo, args.config_dir, "council", "usages")
    cache_file = args.cache_file or os.path.join(out_dir, ".cache.json")
    ensure_out_dir(out_dir)
```

and delete the now-duplicate call before the report write:

```python
    ensure_out_dir(out_dir)
    stem = f"usages-{start.isoformat()}_{end.isoformat()}"
```
becomes
```python
    stem = f"usages-{start.isoformat()}_{end.isoformat()}"
```

- [ ] **Step 2: Run the target file green**

Run: `bun test test/usages.test.ts`
Expected: PASS — 8 tests (6 existing + T-U7 + T-U8), 0 fail.

- [ ] **Step 3: Guard the untouched scaffold surface**

Run: `bun test test/scaffold.test.ts`
Expected: PASS (EMPTY_DIRS untouched).

- [ ] **Step 4: Full owner gates, in order**

```bash
bash council/preflight.sh BUG-2   # run-start gate; FLLWUP-27 stale-history FAIL after record pushes is the documented non-blocking artifact
bun test test/usages.test.ts      # 8/8
bun test test/scaffold.test.ts    # green
bun test                          # full suite green
bunx tsc --noEmit                 # clean
python3 council/validate.py       # All council artifacts valid
```

- [ ] **Step 5: Commit (single commit — tests + fix + this plan; no red test lands)**

```bash
git add council/skills/usages/scripts/usages.py test/usages.test.ts docs/superpowers/plans/2026-09-22-BUG-2-usages-out-dir.md
git commit -m "fix(usages): create the output directory before the first cache write"
```

- [ ] **Step 6: Push and open the PR (R1 — never merge)**

```bash
git push -u origin feat/bug-2-usages-out-dir
gh pr create --base main --head feat/bug-2-usages-out-dir \
  --title "fix(usages): create the output directory before the first cache write" \
  --body-file <pr-body.md>   # body: fix summary, T-U8 named as the test an EMPTY_DIRS seed cannot pass, the seven-field red-at-base record, the accepted foreign-`--cache-file` limitation as follow-up material
```
