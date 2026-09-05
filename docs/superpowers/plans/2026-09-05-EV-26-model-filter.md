# EV-26: Pure model-name filter over the thinking-level cross-product — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the pure `filterModelRows(rows: PickRow[], query: string): PickRow[]` unit plus its unit tests (card EV-26), so EV-27's search input has a tested match contract.

**Architecture:** `filterModelRows` is a pure, exported function in `extensions/model-picker.ts`, living next to `PickRow`/`rowsForProvider` — the card's suggested natural home, mirroring EV-22's `resolveCatalogue` as a pure unit. It filters an existing `PickRow[]` (the J-2 cross-product) by case-insensitive substring on `model.qualifiedId` only, returns the identical row references (never copies), returns all rows on empty query, and `[]` on no match. `PickRow` and `rowsForProvider` are exported (currently module-private) so the tests drive the real producer's output shape and the exported function's signature type is public.

**Tech Stack:** TypeScript (strict), bun + bun:test. No new dependencies.

**Spec:** Card `council/cards/EV-26.md` — the Intent block IS the spec (mechanical path; do NOT create a design-spec file under `docs/superpowers/specs/`).

## Global Constraints

- Match field is `qualifiedId` ONLY — display `name` is never rendered and must never be matched.
- Match algorithm is case-insensitive substring.
- The filter runs on the model cross-product rows BEFORE the `:level` suffix is applied at render time — a query containing `:` (e.g. `:off`) never matches a thinking-level suffix.
- Surviving rows are the IDENTICAL `PickRow` references (reference equality), so `resolveSelection()` keeps emitting byte-verbatim keys. No copies, no mutation.
- Empty query returns all rows; a query matching nothing returns an empty array. The modal owns the no-match copy — that is EV-27, NOT this card.
- Pure function: no I/O, no rendering, no side effects.
- Do NOT touch the modal's rendering, keyboard handling, user-visible copy, `resolveSelection()`, or `ModelPicker`. Do NOT implement EV-27's search input. Do NOT touch `council/board.md` or `council/cards/*.md` (facilitator is the single writer).
- New behavior needs a failing test first (TDD); keep the suite green per task.
- Commits MUST be Conventional Commits (`feat(model-picker): ...`); no history rewriting.
- Gates (AGENTS.md + `.github/workflows/gates.yml`), in order, none lowered: `bun install --frozen-lockfile`, `bunx tsc --noEmit`, `bun test` (whole suite; 1 integration test skipped unless `COUNCIL_INTEGRATION=1` — expected), `python3 council/validate.py`.
- Model-picker source audits are binding: no ANSI escapes, no `#hex` literals (8.1), and no `writeSeatOverride`/`resolveCatalogue`/`getAvailable`/`repoRoot`/`fs` symbols (8.12) in `extensions/model-picker.ts`.

---

### Task 1: Write the failing unit tests for `filterModelRows`

**Files:**
- Create: `test/model-filter.test.ts`

**Interfaces:**
- Consumes (not yet exported — Task 2 provides them): `rowsForProvider(group: ProviderGroup): PickRow[]`, `type PickRow { model: ModelEntry; level?: string }`, `filterModelRows(rows: PickRow[], query: string): PickRow[]` — all from `extensions/model-picker.ts`. `ModelEntry`/`ProviderGroup` from `extensions/catalogue.ts`.
- Produces: the complete EV-26 acceptance suite — every test below passes only when the contract in Global Constraints holds.

- [ ] **Step 1: Write the failing test file**

```ts
import { expect, test } from "bun:test";
import { filterModelRows, rowsForProvider, type PickRow } from "../extensions/model-picker.ts";
import type { ModelEntry, ProviderGroup } from "../extensions/catalogue.ts";

/** Hand-built entries in the same shape model-picker.test.ts uses.
 *  qualifiedId is the byte-verbatim `${provider}/${id}` write key; one entry
 *  deliberately carries a display name ("Sonnet 4") that must never match. */
function entry(id: string, levels: string[], qualifiedId = id, name = id): ModelEntry {
	return { qualifiedId, id, name, reasoning: levels.length > 0, supportedThinkingLevels: levels };
}

const OPENROUTER: ProviderGroup = {
	provider: "openrouter",
	displayName: "OpenRouter",
	models: [
		entry("deepseek/deepseek-v4-pro-0813", ["off", "medium", "high"], "openrouter/deepseek/deepseek-v4-pro-0813", "DeepSeek V4 Pro (0813)"),
		entry("alpha/a", ["off"], "openrouter/alpha/a", "Alpha A"),
		entry("alias/claude-sonnet", ["off", "high"], "openrouter/alias/claude-sonnet", "Anthropic Sonnet 4"),
	],
};
const XAI: ProviderGroup = {
	provider: "xai",
	displayName: "xAI",
	models: [entry("grok/v1", [], "xai/grok/v1", "Grok V1")], // [] — one level-less row
};

/** Real rowsForProvider output — the exact J-2 shape EV-27's search input
 *  will filter: ds:off/medium/high, alpha:off, alias:off, alias:high,
 *  grok/v1 (level-less). */
const ROWS: PickRow[] = [...rowsForProvider(OPENROUTER), ...rowsForProvider(XAI)];

test("EV-26: case-insensitive substring on qualifiedId only; non-matches and display names excluded", () => {
	const hit = filterModelRows(ROWS, "deepseek");
	// suffixes preserved on surviving rows, rendered shape intact
	expect(hit.map((r) => `${r.model.qualifiedId}${r.level === undefined ? "" : ":" + r.level}`)).toEqual([
		"openrouter/deepseek/deepseek-v4-pro-0813:off",
		"openrouter/deepseek/deepseek-v4-pro-0813:medium",
		"openrouter/deepseek/deepseek-v4-pro-0813:high",
	]);
	// case-insensitive — the card's "filter" word
	expect(filterModelRows(ROWS, "DEEPSEEK-V4")).toHaveLength(3);
	expect(filterModelRows(ROWS, "ALPHA").map((r) => r.model.qualifiedId)).toEqual(["openrouter/alpha/a"]);
	expect(filterModelRows(ROWS, "grok").map((r) => r.model.qualifiedId)).toEqual(["xai/grok/v1"]);
	expect(filterModelRows(ROWS, "grok")[0].level).toBeUndefined(); // level-less [] row survives unfiltered
	// non-matches excluded
	expect(filterModelRows(ROWS, "zz-no-such-model")).toEqual([]);
	// display name is never a match field: "anthropic" appears only in the
	// alias entry's name, never in any qualifiedId
	expect(filterModelRows(ROWS, "anthropic")).toEqual([]);
	// surviving rows are the identical PickRow references, not copies
	hit.forEach((r, i) => expect(r).toBe(ROWS[i]));
});

test("EV-26: empty query returns all rows as identical references", () => {
	const result = filterModelRows(ROWS, "");
	expect(result).toHaveLength(ROWS.length);
	result.forEach((row, i) => expect(row).toBe(ROWS[i])); // identical PickRow objects, not copies
});

test("EV-26: a query matching nothing returns an empty array", () => {
	expect(filterModelRows(ROWS, "zz")).toEqual([]);
	expect(filterModelRows(ROWS, "openrouter/x/yz")).toEqual([]);
});

test("EV-26: a query containing ':' never matches a thinking-level suffix", () => {
	// alpha/a:off and alias/claude-sonnet:off are rows whose RENDERED string
	// ends in ":off", but "off" is the level — not part of qualifiedId.
	expect(filterModelRows(ROWS, ":off")).toEqual([]);
	expect(filterModelRows(ROWS, ":")).toEqual([]); // no qualifiedId contains ":"
	// bare "off" matches nothing either — no qualifiedId contains it; levels
	// are not match fields at all
	expect(filterModelRows(ROWS, "off")).toEqual([]);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `bun test test/model-filter.test.ts`
Expected: FAIL — the import fails because `extensions/model-picker.ts` does not export `filterModelRows`/`rowsForProvider`/`PickRow` (`SyntaxError` / `bun:test` error, not an assertion failure). A wrong failure (e.g. a passing test) means the test is not exercising new code — stop.

- [ ] **Step 3: Commit**

```bash
git add test/model-filter.test.ts
git commit -m "test(model-picker): failing EV-26 filterModelRows unit tests"
```

---

### Task 2: Implement and export `filterModelRows`

**Files:**
- Modify: `extensions/model-picker.ts` — in the J-2 block where `PickRow` and `rowsForProvider` live: export `PickRow` (was `interface PickRow`), export `rowsForProvider` (was `function rowsForProvider`), and add the exported `filterModelRows` directly below `rowsForProvider`.

**Interfaces:**
- Consumes: `PickRow` (same block), `ModelEntry.qualifiedId` (required string).
- Produces: `filterModelRows(rows: PickRow[], query: string): PickRow[]` — the EV-27 consumer surface.

- [ ] **Step 1: Write the minimal implementation**

Add immediately after `rowsForProvider`'s closing brace:

```ts
/** EV-26: pure model-name filter over the J-2 cross-product rows; EV-27's
 *  search input renders from this. Contract (card EV-26 Intent, pinned):
 *  match field is qualifiedId only — display name is never rendered and
 *  never matched; case-insensitive substring; the filter runs on the rows
 *  BEFORE the `:level` suffix is applied at render time, so a query
 *  containing ":" never matches a suffix; surviving rows are the identical
 *  PickRow references so resolveSelection() keeps emitting byte-verbatim
 *  keys; empty query ("" matches every string) → all rows; no match → []
 *  (the modal owns the no-match copy — EV-27). Pure: no I/O, no rendering,
 *  no side effects. */
export function filterModelRows(rows: PickRow[], query: string): PickRow[] {
	const q = query.toLowerCase();
	return rows.filter((row) => row.model.qualifiedId.toLowerCase().includes(q));
}
```

And flip the two existing declarations:
- `interface PickRow {` → `/** One cursor row of the J-2 flat cross-product ... */ export interface PickRow {` (keep the existing doc comment verbatim).
- `function rowsForProvider(group: ProviderGroup): PickRow[] {` → `/** J-2: ... */ export function rowsForProvider(group: ProviderGroup): PickRow[] {` (keep the existing doc comment verbatim).

- [ ] **Step 2: Run the new test file to verify it passes**

Run: `bun test test/model-filter.test.ts`
Expected: PASS — all four tests green.

- [ ] **Step 3: Run the existing model-picker suite to verify no regression**

Run: `bun test test/model-picker.test.ts`
Expected: PASS — all existing §8 tests (source audits incl. 8.12 still clean — `filterModelRows` mentions none of the forbidden symbols).

- [ ] **Step 4: Commit**

```bash
git add extensions/model-picker.ts
git commit -m "feat(model-picker): pure filterModelRows over the J-2 cross-product (EV-26)"
```

---

### Task 3: Clear all four gates in order

**Files:** none (verification only).

- [ ] **Step 1: `bun install --frozen-lockfile`** — Run in the worktree root. Expected: exit 0, "checked N installs" line.
- [ ] **Step 2: `bunx tsc --noEmit`** — Expected: exit 0, no output (strict typecheck).
- [ ] **Step 3: `bun test`** — Expected: full suite green; exactly 1 skipped (integration test, gated behind `COUNCIL_INTEGRATION=1`) — that skip is expected, never a failure.
- [ ] **Step 4: `python3 council/validate.py`** — Expected: `All council artifacts valid`, exit 0.

Any failure is a hard stop-and-fix: fix the underlying problem, then re-run the whole gate sequence from gate 1. Do not silence, stub, or narrow to make a gate pass.

---

### Task 4: Push and open the PR

**Files:** none (git only).

- [ ] **Step 1: Verify the branch diff**

Run: `git log --oneline main..HEAD` and `git diff main...HEAD --stat`
Expected: the two commits from Tasks 1–2, touching only `test/model-filter.test.ts` and `extensions/model-picker.ts`.

- [ ] **Step 2: Push and open the PR**

```bash
git push -u origin feat/ev-26-model-filter
gh pr create --base main --head feat/ev-26-model-filter --title "feat(model-picker): EV-26 pure model-name filter over the J-2 cross-product" --body "<gate evidence: each gate's exact command + output>"
```

Record the PR number and head SHA for the report. Do NOT merge, do NOT poll CI — CI status and the merge are the facilitator's job.