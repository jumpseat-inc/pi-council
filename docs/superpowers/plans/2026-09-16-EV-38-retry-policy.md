# EV-38 Retry Policy Section — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `loadRetryConfig(repoRoot)` reads the new top-level `retry` sibling in `.council.json` — documented defaults when the section is absent, the file's values (merged over defaults) when present, validate-loudly throws naming the file and offending key on any invalid value.

**Architecture:** A new loader sibling of `loadThemeConfig`/`loadCouncilConfig` in `extensions/seats.ts`, following `loadThemeConfig`'s validate-loudly shape. Defaults visibility is the committed `council/scaffold/.council.json` (R2), not a runtime announcement. No consumer wiring — `hub.ts` is untouched this card.

**Tech Stack:** TypeScript (bun), `bun:test`, tab-indented scaffold JSON.

**Spec:** `council/cards/EV-38.md` (Intent + Orchestrator rulings R2/R3, binding).

## Global Constraints

- R2 shipped defaults, byte-exact: `{ "retry": { "enabled": true, "maxAttempts": 3, "baseDelayMs": 2000, "maxDelayMs": 30000, "jitter": true } }`.
- R3 validation: `maxAttempts` integer ≥ 1; `baseDelayMs` integer ≥ 100; `maxDelayMs` integer ≥ `baseDelayMs`; `enabled`/`jitter` booleans; any other type or range invalid.
- Scaffold edit preserves tab indentation and every existing key; repo root `.council.json` untouched.
- No `council/` record changes in the PR; no `main` commits; work in the `feat/ev-38-retry-policy` worktree only.
- TDD: failing test before implementation; every test watched red then green.
- Gates, in order: `bash council/preflight.sh EV-38` (known artifact: FLLWUP-27 branch-freshness FAIL allowed) → `bunx tsc --noEmit` → `bun test` → `python3 council/validate.py`.

## Stated readings (the card's explicit readings, asserted by tests)

1. **Partial section** (`{"retry": {"maxAttempts": 5}}`) → merge over the R2 defaults base, exactly as `loadThemeConfig` merges a partial theme over `{ variant: "auto" }`: `{ enabled: true, maxAttempts: 5, baseDelayMs: 2000, maxDelayMs: 30000, jitter: true }`. Goal clause 2 ("returns the file's values when it has one") names the values the file carries; the `loadThemeConfig` precedent (seats.ts:175-196) fills the rest from defaults.
2. **Present `enabled: false`** → "off as data": a full `RetryPolicy` carrying `enabled: false`, NOT `undefined`. Basis: goal clause 2 returns "the file's values" — `enabled: false` is a value the file carries; and unlike `theme`, absent-retry means *enabled* defaults, so `undefined` for retry would be load-bearing ("use defaults" = enabled) and would silently re-enable a policy the user explicitly disabled. The theme loader can afford `undefined` because absent-theme and off-theme both noop; retry cannot.
3. **Non-object `retry`** (`"retry": false` / null / number / string / array) → throw naming the file and the key: `"retry" must be an object`. Basis: retry has no absent-means-disabled semantics, so a bare `false` cannot coherently denote "off" (`undefined` ≡ enabled-defaults at the consumer, per reading 2), and inventing `{...defaults, enabled:false}` for data the file did not carry violates validate-loudly. `{"retry": {"enabled": false}}` is the correct off shape; anything else is loudly rejected.

---

### Task 1: Failing tests for `loadRetryConfig`

**Files:**
- Create: `test/retry-config.test.ts` (focused new file — the loader seam's theme tests live in `test/theme-config.test.ts`, so a sibling `retry-config.test.ts` matches the layout; `writeSeatOverride` byte-preservation joins it to reuse the same fixtures).

**Interfaces:**
- Consumes: nothing new (imports `loadRetryConfig`, `RetryPolicy`, `COUNCIL_CONFIG_FILE`, `writeSeatOverride` — the first three do not exist yet; this task's tests define their required shape).
- Produces: the red test set that Task 2's implementation must satisfy.

- [ ] **Step 1: Write the failing tests** — absent file/section → R2 defaults exactly; `{"retry": {}}` → defaults; full section → file values exactly; partial section → merged; `enabled: false` → data not `undefined`; every R3 violation (wrong type ×5, `maxAttempts` 0/-1/1.5, `baseDelayMs` 99, `maxDelayMs` < `baseDelayMs`, non-boolean `enabled`/`jitter`) → throw naming file + key; unknown key → throw (theme parity); non-object `retry` → throw; malformed JSON / non-object root → throw naming file; cross-field check is order-independent (`maxDelayMs` before `baseDelayMs` in file order still validated against the merged base); `loadCouncilConfig` ignores top-level `retry`; scaffold fixture carries the R2 block; `writeSeatOverride` leaves `retry` bytes untouched (sha256 of the retry byte span before/after).

- [ ] **Step 2: Watch it fail** — `bun test test/retry-config.test.ts` → FAIL (`loadRetryConfig` not exported).

### Task 2: Implement `loadRetryConfig`

**Files:**
- Modify: `extensions/seats.ts` (type + const + loader, placed after `loadThemeConfig`/`mergeThemeSection`, before `parseList`).

**Interfaces:**
- Produces: `export interface RetryPolicy { enabled: boolean; maxAttempts: number; baseDelayMs: number; maxDelayMs: number; jitter: boolean }`, `export const DEFAULT_RETRY_POLICY: RetryPolicy`, `export function loadRetryConfig(repoRoot: string): RetryPolicy` (always returns a policy; never `undefined`).

- [ ] **Step 1: Minimal implementation** — absent file/section → `{ ...DEFAULT_RETRY_POLICY }`; malformed JSON / non-object root → throw `${file}: ...` (same wording as siblings); non-object `retry` → `${file}: "retry" must be an object`; per-key switch validates types/independent ranges and throws `${file}: retry.<key> must ...`; unknown key → `${file}: unknown key "retry.<key>"`; after the merge, cross-field `out.maxDelayMs < out.baseDelayMs` → throw naming `retry.maxDelayMs` (order-independent because it compares merged values).
- [ ] **Step 2: Watch it pass** — `bun test test/retry-config.test.ts` green, then full `bun test` green.

### Task 3: Scaffold defaults (R2)

**Files:**
- Modify: `council/scaffold/.council.json` — append the top-level `retry` block after `theme`, tab-indented, every existing key preserved, byte content equal to R2.

- [ ] **Step 1: Edit the scaffold JSON** (tab indentation, comma after the `theme` close brace).
- [ ] **Step 2: Verify** — the scaffold-fixture test in `test/retry-config.test.ts` passes; `bun test` full green.

### Task 4: Gates, commit, push, PR

- [ ] **Step 1:** `bash council/preflight.sh EV-38` (record verbatim; FLLWUP-27 freshness FAIL is a known artifact, do not rebase).
- [ ] **Step 2:** `bunx tsc --noEmit` → exit 0.
- [ ] **Step 3:** `bun test` → 0 fail.
- [ ] **Step 4:** `python3 council/validate.py` → pass.
- [ ] **Step 5:** Fault injection: corrupt one typed const → tsc red; flip one assertion → suite red; add an invalid board field → validate.py red; restore each.
- [ ] **Step 6:** Conventional commits (`test(retry): ...`, `feat(retry): ...`, `docs: ...`), push branch, `gh pr create --base main --head feat/ev-38-retry-policy`.
- [ ] **Step 7:** Version bump — **skipped**: EPIC-6/7/8 card merges left `0.18.0` constant (wiki run ledgers); bumps land at epic close. Stated basis, not a gate failure.

## Self-review

- Spec coverage: R2 → Task 3 (+ absent-section test), R3 → Task 1 validation matrix, Intent's writer claim → Task 1 byte-preservation test, readings 1–3 → tests in Task 1. ✅
- No placeholders; every step carries real code or exact commands. ✅
- Types consistent: `RetryPolicy` fields match R2 keys exactly. ✅
