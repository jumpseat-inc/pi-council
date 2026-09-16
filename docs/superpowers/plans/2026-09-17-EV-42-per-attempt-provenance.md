# EV-42 — Per-attempt provenance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every attempt of a retried dispatch is recoverable from that dispatch's manifest alone — its session transcript and its spend — and the dispatch's provider-reported figure sums every attempt.

**Architecture:** A pointer-only `attempts` list on `RunManifest` (runs.ts), maintained additively by the hub (seed at spawn, append at settle, emit under the same `attempt > 1` gate); `usage-store` replaces its one-session-per-manifest harvest with a per-attempt walk via a single accessor (`attemptEntries`), with a legacy-window carve-out that keeps the EV-39 `partial:"final-attempt-only"` stamp byte-identical; `provider-cost` gets per-entry unaccounted semantics, a record-only `unaccountedAttempts`, and the J1 figure-scoped `partial:"attempts-unaccounted"`; `usage-block` renders the J3 total legend map with a fail-closed fallback.

**Tech Stack:** TypeScript (bun, strict), bun:test, no new dependencies.

**Spec:** `docs/superpowers/specs/2026-09-17-EV-42-design.md` (authoritative; J1/J3 binding).

## Global Constraints

- **J1 (binding):** new shape ⇒ `partial := totalCost !== null && unaccountedAttempts.length > 0`, literal `"attempts-unaccounted"`; all-unaccounted new shape ⇒ `status:"unavailable"`, `totalCost:null`, `partial` absent (no `partial` legend). Legacy window shape (`attempt > 1 && attempts === undefined`) keeps `partial:"final-attempt-only"` byte-identical.
- **J3 (binding):** new literal renders `usage  partial = reported figure excludes unaccounted attempts`; legacy literal renders `usage  partial = reported figure is final-attempt-only` verbatim; total legend map + generic fallback (`usage  partial = figure is not whole`); stack order reported row → partial legend → `n/a` legend.
- Byte-identity: non-retried dispatch — manifest carries neither `attempt` nor `attempts`; persisted record byte-identical (no `attempt` on generations, no `partial`, no `unaccountedAttempts`).
- `manifest.usage` stays cumulative; `USAGE_RECORD_SCHEMA_VERSION` stays 2.
- `extensions/hub.ts` deltas additive only — no kill/stall/timeout semantics change (AGENTS.md §7).
- Never synthesize a manifest attempt entry from `job.attempt` (append only at settle).
- Gates, in order, in the worktree: `bash council/preflight.sh EV-42`, `bunx tsc --noEmit`, `bun test`, `python3 council/validate.py`. `COUNCIL_INTEGRATION=1` stays gated and is not run.

---

### Task 1: `runs.ts` — the manifest field + the substrate accessor

**Files:**
- Modify: `extensions/runs.ts` (`RunManifest`, new export `attemptEntries`)
- Test: `test/runs.test.ts`

**Interfaces:**
- Consumes: existing `RunManifest` shape (`attempt?`, `sessionId`).
- Produces: `RunManifest.attempts?: { attempt: number; sessionId: string }[]`; `attemptEntries(m: RunManifest): { attempt: number; sessionId: string }[]` (legacy fallback: `m.attempts ?? [{ attempt: m.attempt ?? 1, sessionId: m.sessionId }]`). All later tasks consume both.

- [ ] **Step 1: Write the failing tests** (extend the EV-39 round-trip test + new accessor tests)

```ts
// runs.test.ts — extend the existing "EV-39: manifest round-trips attempt and
// nextAttemptAt..." test and add:
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

test("EV-42: attemptEntries — new shape yields the list; legacy fallback synthesizes one entry", () => {
	expect(attemptEntries({ ...manifest("j"), attempts: [{ attempt: 1, sessionId: "a" }, { attempt: 2, sessionId: "b" }] }))
		.toEqual([{ attempt: 1, sessionId: "a" }, { attempt: 2, sessionId: "b" }]);
	expect(attemptEntries(manifest("j", { attempt: 2 }))).toEqual([{ attempt: 2, sessionId: "j" }]);
	expect(attemptEntries(manifest("j"))).toEqual([{ attempt: 1, sessionId: "j" }]);
});
```

- [ ] **Step 2: Run to verify RED** — `bun test test/runs.test.ts` fails: no `attempts` key round-trips / `attemptEntries` not exported.
- [ ] **Step 3: Implement** — add the optional field with the spec §2.1 doc comment and `attemptEntries` with the spec §2.3 signature.
- [ ] **Step 4: Run to verify GREEN** — `bun test test/runs.test.ts` passes.
- [ ] **Step 5: Commit** — `feat(runs): EV-42 — per-attempt provenance field + attemptEntries accessor`

### Task 2: `hub.ts` — additive bookkeeping (seed, append-at-settle, emit)

**Files:**
- Modify: `extensions/hub.ts` (`Job`, `spawnJob`, `settle`, `writeJobManifest`)
- Test: `test/hub.test.ts`

**Interfaces:**
- Consumes: Task 1's field shape.
- Produces: `Job.attempts?: { attempt: number; sessionId: string }[]`; manifest `attempts` emitted iff `attempt > 1` (same gate as `attempt`).

- [ ] **Step 1: Write the failing tests** (EV-42 section in hub.test.ts; reuse the EV-39 D1 harness + stub)

Test A — ordinal-at-settle (retrying manifest: `attempt:2`, `nextAttemptAt` set, `attempts:[{1, id}]`, `sessionId === id`; long backoff, then `hub.cancel(id)` to clean up).
Test B — budget exhaustion (`STUB_FAIL_TIMES: "5"`, maxAttempts 3): final manifest `attempts` = 1..3 ordered/unique and `attempts[last].sessionId === manifest.sessionId === ${id}-attempt3`.
Test C — extend the D1/O-4 done-path test with `attempts` = `[{1, id}, {2, id-attempt2}]`.
Test D — disabled-policy manifest carries neither `attempt` nor `attempts` (add to the existing wiring test or a new one).

- [ ] **Step 2: Run to verify RED** — `bun test test/hub.test.ts` fails: `attempts` absent/undefined on manifests.
- [ ] **Step 3: Implement** — (1) `Job.attempts?`; (2) `spawnJob` seeds `attempts: [{ attempt: 1, sessionId: opts.sessionId ?? id }]`; (3) `settle()` appends `{ attempt: job.attempt ?? 1, sessionId: job.sessionId ?? job.id }` BEFORE `job.retry?.onSettle(...)`, copy-on-write, idempotent per ordinal; (4) `writeJobManifest` emits `attempts` under the same `attempt !== undefined && attempt > 1` gate as `attempt`.
- [ ] **Step 4: Run to verify GREEN** — `bun test test/hub.test.ts` passes (no retry-semantics change).
- [ ] **Step 5: Commit** — `feat(hub): EV-42 — per-attempt bookkeeping (seed, append-at-settle, manifest emit)`

### Task 3: `provider-cost.ts` — per-entry unaccounted semantics + figure-scoped `partial`

**Files:**
- Modify: `extensions/provider-cost.ts` (types + `fetchProviderReport` loop/assembly + `toGeneration`)
- Test: `test/provider-cost.test.ts`

**Interfaces:**
- Consumes: nothing new (entries gain `attempt?`).
- Produces: `ProviderPartialReason = "final-attempt-only" | "attempts-unaccounted"`; `ProviderCostReport.unaccountedAttempts?: number[]`; `ProviderGeneration.attempt?`; jobs entries `{ jobId; model; attempt?; sessionPath }`.

- [ ] **Step 1: Write the failing tests** — module-level: (a) new-shape all-unaccounted (both `sessionPath: null`) → `unavailable`/`session-missing`/`totalCost:null`/`unaccountedAttempts:[1,2]`/no `partial`; (b) partial-with-figure (attempt 1 missing, attempt 2 reports c2) → `reported`/`partial:"attempts-unaccounted"`/`unaccountedAttempts:[1]`/`totalCost===c2`/gen `attempt:2`; (c) corrupt/truncated attempt file + reporting sibling → NOT `reported && partial === undefined`; (d) new-shape both reporting → `reported`, no partial, no unaccountedAttempts, generations ordered with `attempt` stamps; (e) fetch rejects on a new-shape entry → failure `fetch-failed:` (not unaccounted), no partial; (f) legacy entry (no `attempt`) semantics unchanged (T-P8 stays green as the pin).
- [ ] **Step 2: Run to verify RED** — new tests fail (no unaccounted semantics; T-P8-class behavior for all).
- [ ] **Step 3: Implement** — per-entry rule keyed on `job.attempt !== undefined`: `sessionPath === null` and read-throw/zero-ids ⇒ unaccounted (new shape) vs failure (legacy); read-throw never contributes zero. Assembly: `unaccountedAttempts` = sorted unique ordinals of new-shape entries with no ids; `status = failures.length > 0 || generations.length === 0 ? "unavailable" : "reported"`; reason = C3 worst over failures + unaccounted classes; J1 predicate set in the producer: `partial := hasNewShape && totalCost !== null && unaccountedAttempts.length > 0 ? "attempts-unaccounted" : undefined`; `no-api-key` early return unchanged.
- [ ] **Step 4: Run to verify GREEN** — `bun test test/provider-cost.test.ts` passes; `test/provider-cost.test.ts:361-389` byte-green.
- [ ] **Step 5: Commit** — `feat(provider-cost): EV-42 — per-entry unaccounted semantics + figure-scoped partial`

### Task 4: `usage-store.ts` — the per-attempt harvest walk + legacy carve-out

**Files:**
- Modify: `extensions/usage-store.ts` (`flushPendingInvocations` harvest + stamp deletion)
- Test: `test/usage-store.test.ts`

**Interfaces:**
- Consumes: Task 1 `attemptEntries`; Task 3 module semantics.
- Produces: retried-dispatch figures that sum every attempt; legacy-window stamp byte-identical.

- [ ] **Step 1: Write the failing tests** — retried-flush fixture (manifest with `attempts` list + two attempt JSONLs with distinct responseIds; keyed transport with costs c1/c2):
  - **Contract 1 (whole):** persisted `status:"reported"`, `totalCost === c1+c2`, no `partial`, transport saw BOTH generation ids, generations carry `attempt:1|2` with the same `jobId`, block renders no `usage  partial`.
  - **Contract 2 (partial-with-figure):** attempt-1 JSONL deleted → `reported`, `partial:"attempts-unaccounted"`, `unaccountedAttempts:[1]`, `totalCost === c2`; block renders the reported row + exactly the new legend, no `n/a` legend.
  - **Contract 3 (all-unaccounted):** both JSONLs deleted → `unavailable`, `reason:"session-missing"`, `totalCost:null`, `!("partial" in provider)`, `unaccountedAttempts:[1,2]` as audit; block renders subtree `cost=n/a`, last line exactly `usage  n/a = provider figure unavailable`, no `partial` legend.
  - **Contract 4b (mixed-window precedence):** window holds a new-shape manifest AND a legacy-window manifest (`attempt:2`, no `attempts`) → the record carries NO `partial` (the new-shape producer owns the disclosure; the legacy stamp does not fire).
  - **Contract 5 (byte-identity):** plain single-attempt flush → manifest has neither `attempt` nor `attempts`; record has no `partial`, no `unaccountedAttempts`, no `attempt` on generations.
  - **Single-entry compat (flush level):** plain manifest + present-but-empty session → `unavailable`/`no-generation-id`, no `partial`.
- [ ] **Step 2: Run to verify RED** — contracts 1–3 fail (one session path resolved; unconditional `partial` stamp fires); 4b fails (`final-attempt-only` stamped); 5's `"attempts" in manifest` fails (after Task 2, manifests of retried dispatches carry it — the plain-manifest half already holds).
- [ ] **Step 3: Implement** — replace the jobs mapping with `openrouterInWindow.flatMap((m) => attemptEntries(m).map(...))` where the entry carries `attempt` iff `m.attempts !== undefined || (m.attempt ?? 1) > 1`; compute `hasNewShape` / `hasLegacyWindowShape`; delete the unconditional stamp; stamp `partial:"final-attempt-only"` only when `provider !== null && !hasNewShape && hasLegacyWindowShape`.
- [ ] **Step 4: Run to verify GREEN** — `bun test test/usage-store.test.ts` passes; the EV-39 G4 pin (`:845-885`) stays green.
- [ ] **Step 5: Commit** — `feat(usage-store): EV-42 — per-attempt harvest walk with legacy carve-out`

### Task 5: `usage-block.ts` — total legend map + J3 copy

**Files:**
- Modify: `extensions/usage-block.ts` (`PARTIAL_LEGEND` → `PARTIAL_LEGENDS` map + fallback)
- Test: `test/usage-block.test.ts`

**Interfaces:**
- Consumes: `ProviderPartialReason` (both literals).
- Produces: legend rendering for known literals + fail-closed fallback.

- [ ] **Step 1: Write the failing tests** — (a) `partial:"attempts-unaccounted"` renders `usage  partial = reported figure excludes unaccounted attempts`, immediately after the reported row (stack order); (b) `partial:"final-attempt-only"` renders the legacy line verbatim and not the new copy; (c) an unknown literal renders `usage  partial = figure is not whole` (never fails open).
- [ ] **Step 2: Run to verify RED** — (a) and (c) fail today.
- [ ] **Step 3: Implement** — replace the single constant with the J3 total map + `PARTIAL_LEGEND_FALLBACK`; predicate (`provider?.partial !== undefined`) and stack position unchanged; lookup `PARTIAL_LEGENDS[partial] ?? PARTIAL_LEGEND_FALLBACK`.
- [ ] **Step 4: Run to verify GREEN** — `bun test test/usage-block.test.ts` passes; `test/usage-block.test.ts:612` stays green.
- [ ] **Step 5: Commit** — `feat(usage-block): EV-42 — total partial-legend map with fail-closed fallback`

### Task 6: no-double-count pin + full gates + PR

**Files:**
- Test: `test/runs.test.ts` (pure pin)
- No production changes.

- [ ] **Step 1: Write the failing-is-impossible pin** — `sumSubtreeUsage(manifests, id).subtree.cost === manifest.usage.cost` for a retried manifest (pointer-only ⇒ cumulative tuple summed once). This is a guard, expected green on arrival; it pins the O6 closed-green invariant.
- [ ] **Step 2: Run gates in order, verbatim, in the worktree:**
  1. `bash council/preflight.sh EV-42`
  2. `bunx tsc --noEmit`
  3. `bun test`
  4. `python3 council/validate.py`
- [ ] **Step 3: Push branch + open PR** (`gh pr create` against `main`); record head SHA.
- [ ] **Step 4: Commit** — `test(runs): EV-42 — pin sumSubtreeUsage against per-attempt double count` (and any doc fixes).

## Self-review

- Spec §2.1→Task 1, §2.2→Task 2, §2.5→Task 3, §2.4→Task 4, §2.6→Task 5, §3 pins distributed across tasks 1–6. §3 contract tests 1–5 → Task 4; additional pins: ordinal-at-settle + complete/ordered → Task 2; single-entry compat → Tasks 3+4; fail-closed legend → Task 5; unaccounted-is-never-zero → Task 3; no-double-count → Task 6.
- O10 (evidence item, non-blocking): record any real failed-attempt run-dir observation; do not fabricate a fixture.
- Out of scope (spec §5): navigator per-attempt browsing, `openTranscript` latent path, durable per-attempt dollar spend, wiki ingest.
