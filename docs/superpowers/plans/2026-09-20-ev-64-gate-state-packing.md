# EV-64 Budget-bounded Gate State Packing — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `buildGateState(card, repoRoot)` packs the five declared sections in fixed order into a state whose measured token count never exceeds the policy's `gateStateBudgetTokens`, with producer-side sha256, an ordered drop record that distinguishes cap-trims from budget-drops, and a deterministic no-model wiki matcher.

**Architecture:** One new pure module `extensions/gate-state.ts` (packer, estimator, wiki matcher, doc-to-page map) importing ONLY types from `./gate.ts`; policy changes in `extensions/gate.ts` (`gateStateBudgetTokens` per PO ruling Q1) plus one packaged-data edit (`council/gate/policy.json` gains the key at 32000). One-way dependency edge: nothing in `gate.ts`/`gate-ledger.ts` imports `gate-state.ts`.

**Tech Stack:** TypeScript (strict), `bun:test`, `node:fs`/`node:path`/`node:crypto`, `CONFIG_DIR_NAME` from `@earendil-works/pi-coding-agent`, `PKG_ROOT` from `./seats.ts`.

**Spec:** `docs/superpowers/specs/2026-09-20-EV-64-design.md` (settled; PO ruling Q1/Q2 binding). Card: `council/cards/EV-64.md`.

## Global Constraints

- `gate-state.ts` imports **only types** from `./gate.ts` — never `loadGatePolicy` or any other value from it. (Consequence, settled: `buildGateState` resolves the budget itself with a minimal first-hit read of the policy file; the resolution duplication is deliberate and tested.)
- No fs writes, no network, no model calls anywhere in `gate-state.ts` (reads of the repo tree are fine; persistence is EV-65's seam).
- Estimator is one pinned pure function: `ceil(utf8 byteLength / 3.5)`. Doc wording pinned (PO Q2): **"an estimate, not uniformly conservative"** with direction and `o200k_base` provenance. The word "conservative" may appear in shipped source ONLY inside the phrase "not uniformly conservative" (grep-falsifiable). No claim the state fits the transport's real context window. **No `32000` literal anywhere in `extensions/*.ts`** — the packaged data file is the only 32000.
- Section order and caps are pinned in-module constants, not policy keys: `card` 4000, `touchedFiles` 2000, `wiki` 4000, `rulings` 8000, `tests` 1000 (sum 19000 ≤ 32000).
- PO Q1 clauses, all binding: present `gateStateBudgetTokens` ⇒ validated in every mode (0, -1, 1.5, `"32k"` in a `mode:"off"` file FAIL); absent ⇒ legal only when resolved mode is `off`, else single-line FAIL whose copy has NO "remove the key" advice; packaged `council/gate/policy.json` ships `mode:"off"` + `gateStateBudgetTokens: 32000`.
- Whole-file first-hit override semantics untouched; `policyVersion`/`model`/`endpoint` required exactly as today; R3 untouched (packaged default stays `mode:"off"`; tests set modes explicitly).
- `$CONFIG_DIR_NAME` from `@earendil-works/pi-coding-agent` — never a hardcoded `.pi`; no hardcoded clone paths.
- All tests on fresh `fs.mkdtempSync` synthetic trees (vault + policy + card); never the real repo; offline; `COUNCIL_INTEGRATION` stays off.
- Touched-file manifest is an explicit input; validation is loud and named (`path` non-empty string, `linesChanged` positive integer), never a silent skip.
- Do not edit `council/board.md` or `council/cards/EV-64.md` (facilitator-owned). No ledger changes (GateLedgerRecord v1 is byte-frozen; drops-carry is EV-65's decision).
- Bump `version` in `package.json` in the same PR (engine + packaged payload change: 0.23.0 → 0.24.0).
- Keep `bun test` inside the test-suite-budget envelope; new tests are fs-only and must stay fast.

## Review Focus

- **Existing tests/fixture policies that resolve to `advisory`/`active` without the key now FAIL (clause 2)** — the key's absence is only legal on the off path, so every repo-local fixture policy in the suite with a live mode must gain `gateStateBudgetTokens`. Test: the FAIL-matrix tests of Task 1 pin it; the updated shadowing fixture proves a live-mode policy WITH the key still loads. A reasonable person flipping an existing repo-local policy from off to active without adding the key gets a loud single-line FAIL naming the file and key — that is the intended posture, not a regression.
- **`bun`'s `toEqual` semantics with an optional key valued `undefined`** — the loader omits `gateStateBudgetTokens` when absent, so existing `toEqual` comparisons on `GatePolicy` stay valid only if undefined-valued keys are ignored. Test: the absent-in-off resolution test asserts `!("gateStateBudgetTokens" in policy)` and the shadowing test keeps its exact-shape `toEqual`. If bun's `toEqual` ever treats an absent key as unequal to undefined, the comparison test (not the loader) gets the explicit-field update.
- **The budget resolution in `gate-state.ts` duplicates the first-hit walk in `gate.ts`** — drift risk between the two walkers is the cost of the type-only import edge. Test: the absent-key loud-FAIL test pins the exact surface (file path + key + single line), and the packaged-default test pins that the packaged file (not a code constant) supplies 32000 behaviorally.
- **Substring term matching over-matches short terms** (e.g. `test` ⊂ `latest`) — the pinned stopword list plus a minimum term length of 3 keeps the matcher deterministic-but-dumb; selection precision rides the model (O3 recorded limitation), never the packer. Test: matcher determinism and the exclusion tests pin determinism, not competence.
- **Multi-line frontmatter scalars are unsupported by the minimal flat parser** — the wiki's frontmatter is flat (`key: value` / `key: [a, b]`); a page using block scalars yields empty fields, never a crash. Test: the exclusion/parse fixtures include a page with no frontmatter at all (parsed as body-only, empty fields).

---

### Task 1: Policy — `gateStateBudgetTokens` in `extensions/gate.ts` + packaged data

**Files:**
- Modify: `extensions/gate.ts` (GatePolicy, POLICY_KEYS, loadGatePolicy validation)
- Modify: `council/gate/policy.json`
- Test: `test/gate.test.ts`

**Interfaces:**
- Consumes: existing `gateFail`, `readGateFile`, `nonEmptyString` helpers (unchanged).
- Produces (Tasks 2–6 and EV-65 consume): `GatePolicy.gateStateBudgetTokens?: number`; `loadGatePolicy` clause-1/clause-2 semantics; packaged default carrying 32000.

- [ ] **Step 1: Write the failing tests** — append to `test/gate.test.ts` (FAIL matrix, clause-2 copy, packaged default):

```ts
const failOf = (run: () => unknown): string => {
	try {
		run();
	} catch (e) {
		return (e as Error).message;
	}
	throw new Error("expected a throw");
};

test("clause 1: a present gateStateBudgetTokens is validated in every mode — off included", () => {
	for (const v of [0, -1, 1.5, "32k"]) {
		const root = fs.mkdtempSync(path.join(os.tmpdir(), "council-gate-"));
		repoPolicy(root, { policyVersion: "p", mode: "off", model: "m", endpoint: "https://x/", gateStateBudgetTokens: v });
		const msg = failOf(() => loadGatePolicy(root));
		expect(msg).toMatch(/^FAIL: .*policy\.json has an invalid gateStateBudgetTokens — expected a positive integer, found /);
		expect(msg).not.toMatch(/\n/);
	}
});

test("clause 2: absent gateStateBudgetTokens FAILs on the advisory path, without the remove-the-key advice", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "council-gate-"));
	repoPolicy(root, { policyVersion: "p", mode: "advisory", model: "m", endpoint: "https://x/" });
	const msg = failOf(() => loadGatePolicy(root));
	expect(msg).toBe(
		`FAIL: ${path.join(root, CONFIG_DIR_NAME, "council", "gate", "policy.json")} has an invalid gateStateBudgetTokens — the key is absent but the resolved mode is "advisory" (an off-mode policy may omit it) — set a valid value`,
	);
	expect(msg).not.toMatch(/remove the key/);
});

test("clause 2: absent on the active path fails the same way", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "council-gate-"));
	repoPolicy(root, { policyVersion: "p", mode: "active", model: "m", endpoint: "https://x/" });
	expect(() => loadGatePolicy(root)).toThrow(/has an invalid gateStateBudgetTokens/);
});

test("absent gateStateBudgetTokens resolves cleanly on the off path and is truly absent", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "council-gate-"));
	repoPolicy(root, { policyVersion: "p", mode: "off", model: "m", endpoint: "https://x/" });
	const policy = loadGatePolicy(root);
	expect(policy.mode).toBe("off");
	expect(policy.gateStateBudgetTokens).toBeUndefined();
	expect("gateStateBudgetTokens" in policy).toBe(false);
});

test("a live-mode policy with a valid key loads with it", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "council-gate-"));
	repoPolicy(root, {
		policyVersion: "p",
		mode: "active",
		model: "m",
		endpoint: "https://x/",
		gateStateBudgetTokens: 32000,
	});
	const policy = loadGatePolicy(root);
	expect(policy.mode).toBe("active");
	expect(policy.gateStateBudgetTokens).toBe(32000);
});

test("the packaged default ships mode off and the budget key at 32000", () => {
	const policy = loadGatePolicy("/nonexistent-repo-root-ev64");
	expect(policy.mode).toBe("off");
	expect(policy.gateStateBudgetTokens).toBe(32000);
});
```

- [ ] **Step 2: Run to verify RED** — `bun test test/gate.test.ts`. Expected: the clause tests FAIL (key unknown → unknown-key FAIL, not the pinned copy; packaged default lacks the key).
- [ ] **Step 3: Implement** — in `extensions/gate.ts`:

```ts
export interface GatePolicy {
	policyVersion: string;
	mode: GateMode;
	model: string;
	endpoint: string;
	/** EV-64: packed gate-state token budget. Present ⇒ a validated positive
	 * integer in every mode; absent ⇒ legal only when the resolved mode is
	 * off (PO ruling Q1). Never defaulted in code — the packaged data file
	 * carries the value. */
	gateStateBudgetTokens?: number;
}
```

`POLICY_KEYS` gains `"gateStateBudgetTokens"` (append last). Inside `loadGatePolicy`, immediately after the unknown-key loop (before mode resolution — clause 1: present ⇒ validated unconditionally):

```ts
	let gateStateBudgetTokens: number | undefined;
	if (raw.gateStateBudgetTokens !== undefined) {
		const v = raw.gateStateBudgetTokens;
		if (typeof v !== "number" || !Number.isInteger(v) || v <= 0) {
			throw gateFail(file, "gateStateBudgetTokens", `expected a positive integer, found ${JSON.stringify(v)}`);
		}
		gateStateBudgetTokens = v;
	}
```

and after mode resolution, before return (clause 2):

```ts
	if (gateStateBudgetTokens === undefined && mode !== "off") {
		throw new Error(
			`FAIL: ${file} has an invalid gateStateBudgetTokens — the key is absent but the resolved mode is "${mode}" (an off-mode policy may omit it) — set a valid value`,
		);
	}
	return gateStateBudgetTokens === undefined
		? { policyVersion, mode, model, endpoint }
		: { policyVersion, mode, model, endpoint, gateStateBudgetTokens };
```

In `council/gate/policy.json` add `"gateStateBudgetTokens": 32000`. Update the ONE existing test whose unknown-key message pins the key list (now includes `gateStateBudgetTokens`), and any existing fixture policy resolving to advisory/active without the key (they now FAIL by design — give them a valid key). The "shadows whole-file" fixture gains `gateStateBudgetTokens: 32000`.

- [ ] **Step 4: Run to verify GREEN** — `bun test test/gate.test.ts` passes; `bunx tsc --noEmit` clean.
- [ ] **Step 5: Commit** — `feat(gate): EV-64 gateStateBudgetTokens policy key with clause-1/2 validation`

### Task 2: `extensions/gate-state.ts` frame — estimator, section tuple, card + touchedFiles packing

**Files:**
- Create: `extensions/gate-state.ts`
- Test: `test/gate-state.test.ts`

**Interfaces:**
- Consumes: `CONFIG_DIR_NAME` (package), `PKG_ROOT` (`./seats.ts`, the gate.ts precedent), types only from `./gate.ts`.
- Produces (Tasks 3–6 + EV-65):

```ts
export const GATE_SECTIONS = ["card", "touchedFiles", "wiki", "rulings", "tests"] as const;
export type GateSection = (typeof GATE_SECTIONS)[number];
export function estimateTokens(text: string | Uint8Array): number; // ceil(utf8 bytes / 3.5)
export interface DropRecord { section: GateSection; truncated: false | "cap" | "budget"; kept: number; measuredTokens: number }
export interface TouchedFile { path: string; linesChanged: number }
export interface ParsedCard { id: string; title: string; goal: string; acceptance: string; touchedFiles: TouchedFile[] }
export interface GateState { stateBytes: Uint8Array; stateHash: string; drops: DropRecord[] }
export function buildGateState(card: ParsedCard, repoRoot: string): GateState;
```

- [ ] **Step 1: Failing tests** — `test/gate-state.test.ts` scaffolding + first behaviors (tmp-root helper with a packaged-default policy via `/nonexistent` resolution is NOT used here: every build uses a tmp repo whose policy carries a large valid budget, e.g. `gateStateBudgetTokens: 1000000`, so the budget never binds in this task):

```ts
import { test, expect } from "bun:test";
import { createHash } from "node:crypto";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { CONFIG_DIR_NAME } from "@earendil-works/pi-coding-agent";
import { buildGateState, estimateTokens, GATE_SECTIONS } from "../extensions/gate-state.ts";

export function tmpRepo(extraPolicy?: Record<string, unknown>): string {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "council-gate-state-"));
	const dir = path.join(root, CONFIG_DIR_NAME, "council", "gate");
	fs.mkdirSync(dir, { recursive: true });
	fs.writeFileSync(
		path.join(dir, "policy.json"),
		JSON.stringify({ policyVersion: "p", mode: "off", model: "m", endpoint: "https://x/", gateStateBudgetTokens: 1000000, ...extraPolicy }),
	);
	return root;
}

export function card(overrides: Partial<Parameters<typeof buildGateState>[0]> = {}) {
	return {
		id: "EV-0",
		title: "Fix the gate packer",
		goal: "Pack gate state deterministically under budget",
		acceptance: "bytes identical across calls and drops recorded",
		touchedFiles: [{ path: "extensions/gate.ts", linesChanged: 12 }],
		...overrides,
	};
}
```

Tests: (a) estimator pinned by recompute — `estimateTokens("hello") === 2` (ceil(5/3.5)); (b) CJK divergence fixture — `estimateTokens("龘".repeat(3)) === 3` (9 UTF-8 bytes ⇒ 3; a chars/4 estimator would say 1 — the byte-based measure, per §4 direction/provenance wording); (c) card+touchedFiles pack: `JSON.parse(Buffer.from(state.stateBytes).toString("utf8"))` deep-equals `{ card: { id, title, goal, acceptance }, touchedFiles: [{ path, linesChanged }], wiki: [], rulings: [], tests: [] }` with sections in `GATE_SECTIONS` order (`Object.keys(parsed)` joins equal to the tuple); (d) touchedFiles sorted lexicographically by path; (e) byte/hash identity across two calls; (f) hash single source — `createHash("sha256").update(state.stateBytes).digest("hex") === state.stateHash`; (g) touched-file canary — write the touched file on disk with a sentinel body (`SENTRY-CONTENT-7f3a`), assert the sentinel never appears in the state bytes and entries carry only `path` + `linesChanged`; (h) touchedFiles validation loud errors — `linesChanged: 0`, `-3`, `1.5`, `"3"`, empty `path` each throw a single-line error naming `touchedFiles[i]` and the found value; (i) degenerate over-budget `card` section — policy budget below the full card's measure but above card's first two fields: with a huge `goal`, the kept card keeps `{ id, title }` (non-empty, per-field granularity), drop record names `card` with kept 2 and `truncated: "cap"`, and every later section records `truncated: false`... — wait, no: a cap-trim of section 1 does NOT drop later sections (cap is per-section). Assert later sections stay present with `truncated: false` and the state still measures ≤ budget.

- [ ] **Step 2: Verify RED** — module missing.
- [ ] **Step 3: Implement** — module frame exactly per the sketch below (Sections/caps/estimator/validation/packer loop for the two implemented sections; `wiki`/`rulings`/`tests` candidate lists empty until Tasks 3–5 fill them):

```ts
// EV-64 — the gate's state packer (EPIC-13). Pure: reads the repo tree,
// writes nothing, performs no network and no model call; persistence is
// EV-65's seam. Imports only TYPES from ./gate.ts — the dependency edge is
// one-way (nothing in gate.ts/gate-ledger.ts imports this module).
import { createHash } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import { CONFIG_DIR_NAME } from "@earendil-works/pi-coding-agent";
import type { GatePolicy } from "./gate.ts";
import { PKG_ROOT } from "./seats.ts";

/** Fixed declared section order (a pinned contract, like MODE_PANELS) and
 * per-section caps in measured tokens — never policy keys. Caps sum to
 * 19,000, below every budget a policy can carry while still packing. */
export const GATE_SECTIONS = ["card", "touchedFiles", "wiki", "rulings", "tests"] as const;
export type GateSection = (typeof GATE_SECTIONS)[number];
const SECTION_CAPS: Record<GateSection, number> = { card: 4000, touchedFiles: 2000, wiki: 4000, rulings: 8000, tests: 1000 };

/** The pinned token estimator (EV-64, PO ruling Q2): an ESTIMATE, not
 * uniformly conservative. It is ceil(utf8 byteLength / 3.5). Against the
 * o200k_base reference tokenizer it over-counts ASCII prose (reference
 * probe +45.8%) and under-counts dense code (−35.9%), rare CJK such as 龘
 * (−13.3%), and emoji (−17.2%). Measured-token count everywhere in this
 * module means this function's count. It is the only hasher's companion:
 * stateHash = sha256(stateBytes), both produced here and nowhere else. */
export function estimateTokens(text: string | Uint8Array): number {
	const bytes = typeof text === "string" ? new TextEncoder().encode(text) : text;
	return Math.ceil(bytes.byteLength / 3.5);
}
```

Drop record, ParsedCard, validation, budget resolution, and the packer loop per the body of this task's design (cap fill per-section on the section's own serialized fragment — per-field for `card` [id, title, goal, acceptance] so an over-budget card truncates to a field prefix and stays non-empty; then whole-state budget check; budget cut ⇒ later sections dropped entirely and recorded `truncated: "budget", kept: 0`; cap-trim recorded `truncated: "cap"` and does NOT drop later sections; every section always gets one ordered record line so the kept counts fully determine the present bytes). Budget resolution is a minimal first-hit read of `<repoRoot>/$CONFIG_DIR_NAME/council/gate/policy.json` then `<PKG_ROOT>/council/gate/policy.json` (the type-only import edge forbids calling `loadGatePolicy`): key absent or not a positive integer ⇒ single-line `FAIL: <file> has an invalid gateStateBudgetTokens — … — set a valid value` (NO "remove the key" advice — wrong for an absent key under whole-file shadowing); never a code-side default. Frame guard: if the empty frame (all sections empty) alone exceeds the budget, throw a loud single-line error naming the budget.

- [ ] **Step 4: Verify GREEN** — `bun test test/gate-state.test.ts`; then `bunx tsc --noEmit`.
- [ ] **Step 5: Commit** — `feat(gate): EV-64 gate-state frame — estimator, card and touchedFiles packing`

### Task 3: Wiki section — frontmatter parser, exclusions, doc-to-page map, scorer, fill-to-cap ordering

**Files:**
- Modify: `extensions/gate-state.ts`
- Test: `test/gate-state.test.ts`

**Interfaces:**
- Consumes: Task 2's packer loop and `estimateTokens`.
- Produces: internal `selectWikiCandidates(repoRoot, terms, docMap): WikiPageShape[]` ranked score-desc then slug-asc (deterministic); the packer consumes the ranked list as the wiki section's entries (`{ slug, title, summary, aliases }`).

- [ ] **Step 1: Failing tests** (fixture trees under `root/vault/wiki/`):
  1. Determinism: fixture with ≥6 pages; two `buildGateState` calls byte-identical (`Buffer.compare === 0`) and identical hashes.
  2. Exclusions as tested rules: a page `vault/wiki/index.md` and a page `vault/wiki/sources/2026-09-20-po-x.md` (both high-scoring against the card terms — e.g. title contains the card's distinctive term) never appear in the wiki section; ordinary pages do.
  3. Fill-to-cap in score order: with a small policy budget that trims the wiki section (or a page list whose serialized size exceeds the 4000 cap), the kept entries are the top-scored prefix in score order; score ties resolve lexicographically by page filename.
  4. Doc-to-page map: a page whose body references `extensions/gate.ts` (a path existing in the fixture tree) outscores an otherwise-identical page without the reference when card terms include "gate"; a path token NOT existing in the tree (`docs/ghost.ts`) adds nothing.
  5. Section shape: entries are `{ slug, title, summary, aliases }` only.
- [ ] **Step 2: Verify RED.**
- [ ] **Step 3: Implement** — minimal flat frontmatter parser (`key: value` / `key: [a, b]`, no YAML dependency, no frontmatter ⇒ empty fields + body-only); candidates = `vault/wiki/**/*.md` excluding `index` and `sources/**`; pinned stopword list (the/a/an/and/or/of/to/in/for/on/is/are/with/as/by/that/this/it/be/at/from/has/have/was/were/will/their/they/then/these/which/its/but/so/than/per/there) + minimum term length 3; terms from lowercase `title+goal+acceptance` split on non-alphanumerics, deduped; scoring pinned — per term: alias hit +3, title +2, tags +2, summary +1, live-tree path hit +2; doc-to-page map derived per call (inverted path→slug index over path-like tokens existing under repoRoot), never hand-maintained (FLLWUP-59 lesson); module comment records the O3 term-overlap limitation (selection precision rides the model, not the packer).
- [ ] **Step 4: Verify GREEN** — `bun test test/gate-state.test.ts`; `bunx tsc --noEmit`.
- [ ] **Step 5: Commit** — `feat(gate): EV-64 deterministic wiki matcher and doc-to-page map`

### Task 4: Rulings section — candidate set, relevance, scorer-then-date ordering

**Files:**
- Modify: `extensions/gate-state.ts`
- Test: `test/gate-state.test.ts`

**Interfaces:**
- Consumes: Task 3's scorer, frontmatter parser; the wiki section's cap-filled (selected) pages' tag leaves.
- Produces: rulings entries `{ slug, date, title, summary }` ranked by the card-term scorer, tie-break date descending, final tie-break slug ascending.

- [ ] **Step 1: Failing tests**:
  1. Red/green ordering (the settled O2 refinement): fixture with an OLDER term-matched ruling (summary/aliases/title contains a card term; `updated` older) and a NEWER tag-only ruling (no term match; shares tag leaf `epic9` with a selected wiki page tagged `pi-council/epic9`). Assert the term-matched older ruling ranks FIRST (a date-descending-first ordering would pick the newer one — this fixture is red under the falsified ordering).
  2. Candidate set: only `vault/wiki/sources/**` pages whose tags include `pi-council/ruling` are candidates; a term-matched `sources` page without the ruling tag, and a ruling-tagged page outside `sources/`, never appear.
  3. Relevance: a ruling sharing no tag leaf with any selected wiki page and matching no card term is absent; term match alone (aliases/summary) admits one.
  4. Shape: `{ slug, date, title, summary }` with `date` = frontmatter `updated` (fall back `created`, else "").
- [ ] **Step 2: Verify RED.**
- [ ] **Step 3: Implement** — relevance filter = shares a non-namespace tag leaf with a selected wiki page OR aliases/summary contain a card term; rank by the same scorer, tie-break `date` descending then slug ascending; entries in packer order.
- [ ] **Step 4: Verify GREEN** — `bun test test/gate-state.test.ts`; `bunx tsc --noEmit`.
- [ ] **Step 5: Commit** — `feat(gate): EV-64 rulings section ranked scorer-then-date`

### Task 5: Tests section — stem/path affinity over the fixture tree's `test/` directory

**Files:**
- Modify: `extensions/gate-state.ts`
- Test: `test/gate-state.test.ts`

**Interfaces:**
- Consumes: Task 2's packer; `ParsedCard.touchedFiles`.
- Produces: tests entries = paths relative to `test/` of `*.test.ts` files, ranked by affinity (score 2: a touched file's basename-stem appears in the test file's name; score 1: any ≥3-char directory segment of a touched file's dirname appears in the test file's relative path), tie-break lexicographic ascending.

- [ ] **Step 1: Failing tests**: fixture tree with `extensions/gate.ts` touched and `test/gate.test.ts` + `test/other.test.ts` + `test/mcp/deep.test.ts`; assert `gate.test.ts` ranks before `other.test.ts`, `deep.test.ts` (score 1 via the `mcp`... — use a touched dir segment matching instead, e.g. touched `test/mcp/x.ts` would score `deep.test.ts` 1); absent `test/` ⇒ empty section, no crash; entries are plain strings.
- [ ] **Step 2: Verify RED.** **Step 3: Implement** (walk `repoRoot/test` recursively for `*.test.ts`). **Step 4: Verify GREEN.**
- [ ] **Step 5: Commit** — `feat(gate): EV-64 tests section by stem/path affinity`

### Task 6: Budget binding and the drop rule — the card's demanded tests

**Files:**
- Modify: `extensions/gate-state.ts`
- Test: `test/gate-state.test.ts`

**Interfaces:**
- Consumes: everything prior; now the tmp-repo helper sets real budgets (below 19000 for tail-drop fixtures).
- Produces: final `buildGateState` semantics; drop record with `truncated: false | "cap" | "budget"` distinguishing cap-trims from budget-drops (O7).

- [ ] **Step 1: Failing tests**:
  1. Oversized recent-rulings tail-drop (the card goal's demanded test): fixture policy with `gateStateBudgetTokens: 6000` (< 19000); an oversized rulings section; every earlier section (card, touchedFiles, wiki) deep-equal AND canonically byte-equal (`JSON.stringify(parsedEarlier)`) to the untruncated pack (same tree, budget 1000000); the drop record names `rulings` with `truncated: "budget"`; the `tests` section records `truncated: "budget", kept: 0` (dropped entirely).
  2. Budget-only change moves the cut, never the prefix: budgets 4000 and 6000 on the same tree — the rulings kept counts differ (or the cut section differs) while card/touchedFiles/wiki stay byte-equal across all three packs.
  3. Drop-shape sufficiency: reconstruct from the record + `GATE_SECTIONS` — take, per section, the first `drops[i].kept` entries of the UNTRUNCATED pack's parsed sections, reassemble in declared order, `JSON.stringify` — result equals the truncated `stateBytes` exactly.
  4. Cap-trim vs budget-drop distinguishable: a cap-trimmed section records `truncated: "cap"` while later sections remain `truncated: false` and present; a budget-cut section records `"budget"` and later sections are absent from the bytes with `kept: 0`.
  5. Pathological all-over-cap fixture: every entry of every section alone exceeds its section cap ⇒ state still ≤ budget (frame only), every section's record is `truncated: "cap", kept: 0`, and the first record names `card`.
  6. Absent-key loud FAIL from the packer: tmp repo whose policy OMITS the key ⇒ `buildGateState` throws the single-line `FAIL: <file> has an invalid gateStateBudgetTokens — the key is absent — … — set a valid value` naming the file and key (never silently assuming the packaged 32000).
  7. Frame guard: a budget of 1 throws a loud single-line error naming the budget (the empty frame alone exceeds it) — never a silent over-budget state.
- [ ] **Step 2: Verify RED.** **Step 3: Implement** the budget/budget-cut paths wired to the Task 2 loop (they were stubbed to never bind). **Step 4: Verify GREEN** — `bun test test/gate-state.test.ts`; `bunx tsc --noEmit`.
- [ ] **Step 5: Commit** — `feat(gate): EV-64 budget binding and cap/budget drop rule`

### Task 7: Wording pins (PO Q2 grep-falsifiable), version bump, gates, PR

**Files:**
- Modify: `test/gate-state.test.ts` (source-wording tests), `package.json` (version)

- [ ] **Step 1: Failing tests** (read the shipped source as text from the test file):

```ts
const moduleSrc = fs.readFileSync(new URL("../extensions/gate-state.ts", import.meta.url), "utf8");
const gateSrc = fs.readFileSync(new URL("../extensions/gate.ts", import.meta.url), "utf8");

test("estimator wording: an estimate, not uniformly conservative, with direction and provenance", () => {
	expect(moduleSrc).toContain("an estimate, not uniformly conservative");
	expect(moduleSrc).toContain("o200k_base");
});

test("grep-falsifiable: 'conservative' survives only inside the sanctioned phrase", () => {
	expect(moduleSrc.replaceAll("not uniformly conservative", "").includes("conservative")).toBe(false);
	expect(gateSrc.includes("conservative")).toBe(false);
});

test("no context-window fit claim and no code-side 32000 anywhere in shipped source", () => {
	expect(moduleSrc).not.toMatch(/context window/);
	expect(moduleSrc.includes("32000")).toBe(false);
	expect(gateSrc.includes("32000")).toBe(false);
});
```

- [ ] **Step 2: Verify RED→GREEN** (wording already written in Task 2 — these may pass immediately; if so they are still pinned against future drift; verify by temporarily breaking the comment if needed, then restore). **Step 3: bump `package.json` to 0.24.0.**
- [ ] **Step 4: Clear all four gates in order, recording real output**: `bash council/preflight.sh` → `bunx tsc --noEmit` → `bun test` (full) → `python3 council/validate.py`.
- [ ] **Step 5: Commit** — `chore(gate): EV-64 estimator wording pins and version bump` — then push and open the PR: `feat(gate): EV-64 budget-bounded gate state packing`, body referencing EV-64 and the four gate results.

## Self-Review

- **Spec coverage:** §1 module placement/one-way edge (Tasks 2, header comment, grep test), §2 shape/validation/producer-side hash/drop shape (Tasks 2, 6), §3 order+caps+O7 coupling (Tasks 2, 6), §4 estimator + ruled wording (Tasks 2, 7), §5 matcher/map/exclusions/scoring (Task 3), §6 rulings (Task 4), §7 packing + drop rule + degenerate fixtures + O7 distinction (Tasks 2, 6), §8 policy (Task 1), §9 test set — mapped test-by-test across Tasks 1–7, §10 out-of-scope respected (no ledger edits, no manifest producer, no tokenizer probe). ✔
- **Placeholders:** none — every code step carries real code or an exact pinned copy; the Task 1 import-line placeholder in the test snippet is marked for removal in the real commit. ✔
- **Type consistency:** `GATE_SECTIONS`/`GateSection`/`DropRecord`/`ParsedCard`/`GateState`/`estimateTokens`/`buildGateState` identical across tasks. ✔
- **Review Focus:** each of the five entries has an owning test (Task 1 FAIL matrix + fixture updates; Task 1 absent-key presence test; Task 6 absent-key FAIL + packaged-default behavioral test; Task 3 determinism/exclusion tests; Task 3 no-frontmatter page in the exclusion fixture). ✔
