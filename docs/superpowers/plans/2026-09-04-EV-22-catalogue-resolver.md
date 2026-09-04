# EV-22 Catalogue Resolver Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the pure `resolveCatalogue` resolver that turns pi's flat model registry into a provider-grouped, ordered catalogue plus per-seat current override state — the data-to-UI seam for the `/council-models` picker (EV-22).

**Architecture:** One pure module `extensions/catalogue.ts` with no I/O of any kind. It takes four flat-data arguments (`models`, `providerDisplayName`, `rawSeats`, `overrideMap`), groups models by provider, orders providers/models by id ascending (ruling J-1), derives `supportedThinkingLevels` exclusively from pi's `getSupportedThinkingLevels` (`@earendil-works/pi-ai/compat`), and derives per-seat current state via the existing pure `applySeatOverride` in `seats.ts`. A single pure unit test `test/catalogue.test.ts` calls it with plain literals. No live caller: EV-25 owns the one `refresh()`/`getAvailable()` fetch and hands the same flat list to this resolver and to EV-24's writer-validation.

**Tech Stack:** TypeScript strict (`tsc --noEmit`), `bun:test`, `@earendil-works/pi-ai/compat` (runtime-remapped by pi's extension loader; NOT declared in package.json — it resolves transitively via the `@earendil-works/pi-coding-agent` devDep, Skeptic-verified).

**Spec:** `docs/superpowers/specs/2026-09-04-EV-22-design.md` — committed to the repo on `main` as `7c31456` (part of the EV-22 card-prep commits; pending push to `origin` alongside the card). The plan argues from that spec; where anything below needs elaboration it quotes the spec.

## Global Constraints

(From spec §§2–5, 8 — verbatim rules; every task inherits these.)

1. **Signature (ruling J-2):** `resolveCatalogue(models, providerDisplayName, rawSeats, overrideMap)` — exactly four flat-data arguments. No `repoRoot`, no `source`, no filesystem I/O, no network inside the resolver.
2. **Ordering (ruling J-1):** providers sorted by `provider` id ascending; models within each group by `id` ascending. Never sort by display labels. Tiebreaks unnecessary (provider id and model id are unique per namespace).
3. **Thinking extraction:** `supportedThinkingLevels` comes ONLY from `getSupportedThinkingLevels` imported from `@earendil-works/pi-ai/compat`. Never hand-roll a level set; never add a "keys of thinkingLevelMap" fallback.
4. **`hasOverride` = key presence:** `overrideMap.has(seat.name)` semantics — an `{}` entry is `hasOverride: true`. Use `Object.hasOwn` (ES2022 target) to avoid prototype-chain false positives.
5. **Current state:** via `applySeatOverride(seat, overrideMap)` (pure; honors explicit `thinking` key > `:suffix` on model > frontmatter, model/thinking independent). `currentModel` always the qualified `provider/id`; `currentThinking` present only when a level resolves (omit the field otherwise).
6. **`displayName` passthrough:** `providerDisplayName[provider] ?? provider` — never derive.
7. **No raw HTTP:** `grep -nE 'fetch|http|axios|https|undici|node:http' extensions/catalogue.ts` must return nothing.
8. **Imports only:** `type Seat` / `type AgentOverride` from `./seats.ts` (type-only), the runtime `applySeatOverride` from `./seats.ts` (pure), and `getSupportedThinkingLevels` from `@earendil-works/pi-ai/compat`. No other imports. No package.json change (do NOT declare `@earendil-works/pi-ai`).
9. **Empty-catalogue edge:** empty `models` input → `providers: []` with **no throw**. A provider id present in `providerDisplayName` but absent from `models` yields **no** `ProviderGroup`.
10. **Out of scope:** no command registration, no UI, no file writes (EV-24), no EV-25 wiring, no async fetch wrapper, no change to `loadSeat`'s signature. EV-22 is the pure resolver + its test only.
11. **Return shape** (spec §4, fixed):
    - `ModelEntry { qualifiedId, id, name, reasoning, supportedThinkingLevels: string[] }` — `qualifiedId = \`${provider}/${id}\``; `name = model.name ?? model.id`; `reasoning` is passthrough and NOT consumer-contract (`supportedThinkingLevels` is the sole capability authority).
    - `ProviderGroup { provider, displayName, models: ModelEntry[] }`
    - `SeatState { name, hasOverride, currentModel, currentThinking? }`
    - `ResolverResult { providers: ProviderGroup[], seats: SeatState[] }`
12. **Seat order:** preserve `rawSeats` input order exactly (the caller supplies `listSeatNames` order; never re-sort seats).

---

### Task 1: The failing unit test (`test/catalogue.test.ts`)

**Files:**
- Create: `test/catalogue.test.ts`

**Interfaces:**
- Consumes: nothing (test is written before the module exists).
- Produces: the full acceptance contract the next task must satisfy — `resolveCatalogue(models, providerDisplayName, rawSeats, overrideMap)` returning `{ providers, seats }` per constraint 11.

- [ ] **Step 1: Write the test** — create `test/catalogue.test.ts` with the exact content below. (Tabs, matching repo convention; `bun:test`.)

```ts
import { describe, expect, test } from "bun:test";
import { resolveCatalogue } from "../extensions/catalogue.ts";
import type { CatalogueModel } from "../extensions/catalogue.ts";
import type { Seat } from "../extensions/seats.ts";

/** Build a full Seat literal. Thinking level optional — the resolver must
 *  omit SeatState.currentThinking when none resolves. */
function makeSeat(name: string, model: string, thinkingLevel?: string): Seat {
	return { name, description: `${name} role`, model, thinkingLevel, tools: [], spawns: [], mcp: [], body: "" };
}

/** Models fixture — exactly the four documented thinking-parity shapes plus a
 *  named model and a non-reasoning model. Providers/models deliberately
 *  unsorted: ordering must be the resolver's job (J-1). */
const MODELS: CatalogueModel[] = [
	{ provider: "xai", id: "grok/v1", reasoning: false },
	{ provider: "openrouter", id: "alpha/a", reasoning: true }, // missing thinkingLevelMap
	{
		provider: "openrouter",
		id: "beta/c",
		name: "Beta C",
		reasoning: true,
		thinkingLevelMap: { off: null }, // always-thinking model; off explicitly unsupported
	},
	{
		provider: "openrouter",
		id: "deepseek/deepseek-v4-pro-0813",
		name: "DeepSeek V4 Pro (0813)",
		reasoning: true,
		thinkingLevelMap: { minimal: "minimal", high: "high" }, // holes: low/medium absent; xhigh/max absent
	},
	{
		provider: "anthropic",
		id: "claude/sonnet-4",
		name: "Sonnet 4",
		reasoning: true, // missing thinkingLevelMap
	},
];

/** Stub of pi's getProviderDisplayName output. "ghost" is present in the map
 *  but absent from MODELS — it must produce NO ProviderGroup. "xai" is absent
 *  from the map — displayName must fall back to the provider id. */
const DISPLAY: Record<string, string> = { openrouter: "OpenRouter", anthropic: "Anthropic", ghost: "Ghost Co" };

const RAW_SEATS: Seat[] = [makeSeat("principal", "openrouter/x/yz"), makeSeat("owner", "openrouter/a/fm", "medium")];

const EMPTY_OVERRIDE: Record<string, never> = {};

describe("resolveCatalogue", () => {
	test("groups models by provider; displayName passes through or falls back to provider id", () => {
		const res = resolveCatalogue(MODELS, DISPLAY, RAW_SEATS, EMPTY_OVERRIDE);
		expect(res.providers.map((p) => p.provider)).toEqual(["anthropic", "openrouter", "xai"]);
		const byName = new Map(res.providers.map((p) => [p.provider, p]));
		expect(byName.get("anthropic")!.displayName).toBe("Anthropic"); // stub value verbatim (O-7)
		expect(byName.get("openrouter")!.displayName).toBe("OpenRouter");

		expect(byName.get("openrouter")!.models.map((m) => m.id)).toEqual([
			"alpha/a",
			"beta/c",
			"deepseek/deepseek-v4-pro-0813",
		]);

		const xai = byName.get("xai")!;
		expect(xai.displayName).toBe("xai"); // absent from DISPLAY → provider id fallback
		expect(xai.models.map((m) => m.id)).toEqual(["grok/v1"]);

		// Provider id in DISPLAY but absent from MODELS → no group at all.
		expect(byName.has("ghost")).toBe(false);
		expect(res.providers.length).toBe(3);
	});

	test("empty catalogue produces providers: [] without throwing", () => {
		const res = resolveCatalogue([], DISPLAY, RAW_SEATS, EMPTY_OVERRIDE);
		expect(res.providers).toEqual([]);
		// Seat state still resolves — the catalogue and seats arrays are independent.
		expect(res.seats).toHaveLength(RAW_SEATS.length);
	});

	test("orders providers by provider id and models by id ascending (J-1); twice-run is deep-equal", () => {
		const run = () => resolveCatalogue(MODELS, DISPLAY, RAW_SEATS, EMPTY_OVERRIDE);
		const first = run();
		expect(first.providers.map((p) => p.provider)).toEqual(["anthropic", "openrouter", "xai"]);
		for (const group of first.providers) {
			const ids = group.models.map((m) => m.id);
			expect(ids).toEqual([...ids].sort());
		}
		// Determinism: the same inputs always produce the identical structure.
		expect(run()).toEqual(first);
	});

	test("extracts supportedThinkingLevels with parity to pi's getSupportedThinkingLevels contract", () => {
		const res = resolveCatalogue(MODELS, DISPLAY, RAW_SEATS, EMPTY_OVERRIDE);
		const model = (provider: string, id: string) =>
			res.providers.find((p) => p.provider === provider)!.models.find((m) => m.id === id)!;

		// reasoning: false → exactly ["off"], never [].
		expect(model("xai", "grok/v1").supportedThinkingLevels).toEqual(["off"]);

		// reasoning: true, missing thinkingLevelMap → off..high supported, xhigh/max NOT.
		expect(model("openrouter", "alpha/a").supportedThinkingLevels).toEqual(["off", "minimal", "low", "medium", "high"]);
		expect(model("anthropic", "claude/sonnet-4").supportedThinkingLevels).toEqual(["off", "minimal", "low", "medium", "high"]);

		// deepseek-v4-pro-style holes: off..high present (absent keys = provider default),
		// xhigh/max excluded (their keys are required). A naive "keys with non-null
		// values" implementation would return ["minimal","high"] here and fail this.
		const ds = model("openrouter", "deepseek/deepseek-v4-pro-0813");
		expect(ds.supportedThinkingLevels).toEqual(["off", "minimal", "low", "medium", "high"]);
		expect(ds.name).toBe("DeepSeek V4 Pro (0813)");

		// always-thinking model with off: null → off excluded, rest of off..high kept.
		expect(model("openrouter", "beta/c").supportedThinkingLevels).toEqual(["minimal", "low", "medium", "high"]);
	});

	test("qualifiedId round-trips the modelled getAvailable() set (${provider}/${id})", () => {
		const res = resolveCatalogue(MODELS, DISPLAY, RAW_SEATS, EMPTY_OVERRIDE);
		const source = new Set(MODELS.map((m) => `${m.provider}/${m.id}`));
		const emitted = res.providers.flatMap((p) => p.models.map((m) => m.qualifiedId));
		// Every emitted id is in the source set, and the source set is fully
		// emitted (grouping emits nothing outside `models`).
		expect([...emitted].sort()).toEqual([...source].sort());
		expect(source.has(emitted[0])).toBe(true);
	});

	test("resolves per-seat current state: no override, explicit override, {} override, independent dims", () => {
		// No override entry → frontmatter owns everything.
		const plain = resolveCatalogue(MODELS, DISPLAY, RAW_SEATS, EMPTY_OVERRIDE);
		const owner = plain.seats.find((s) => s.name === "owner")!;
		expect(owner.hasOverride).toBe(false);
		expect(owner.currentModel).toBe("openrouter/a/fm");
		expect(owner.currentThinking).toBe("medium");
		const principal = plain.seats.find((s) => s.name === "principal")!;
		expect(principal.hasOverride).toBe(false);
		expect(principal.currentModel).toBe("openrouter/x/yz");
		expect(principal.currentThinking).toBeUndefined(); // field omitted when no level resolves

		// Override with model :high suffix AND explicit thinking → explicit thinking wins.
		const over = resolveCatalogue(MODELS, DISPLAY, RAW_SEATS, { owner: { model: "openrouter/b/m:high", thinking: "low" } });
		const ownerOver = over.seats.find((s) => s.name === "owner")!;
		expect(ownerOver.hasOverride).toBe(true);
		expect(ownerOver.currentModel).toBe("openrouter/b/m");
		expect(ownerOver.currentThinking).toBe("low");

		// {} entry counts as an override, leaves current state at frontmatter.
		const emptyOv = resolveCatalogue(MODELS, DISPLAY, RAW_SEATS, { owner: {} });
		const ownerEmpty = emptyOv.seats.find((s) => s.name === "owner")!;
		expect(ownerEmpty.hasOverride).toBe(true);
		expect(ownerEmpty.currentModel).toBe("openrouter/a/fm");
		expect(ownerEmpty.currentThinking).toBe("medium");

		// Model-only override keeps frontmatter thinking; thinking-only keeps frontmatter model.
		const modelOnly = resolveCatalogue(MODELS, DISPLAY, RAW_SEATS, { owner: { model: "openrouter/b/m" } });
		expect(modelOnly.seats.find((s) => s.name === "owner")!.currentModel).toBe("openrouter/b/m");
		expect(modelOnly.seats.find((s) => s.name === "owner")!.currentThinking).toBe("medium");

		const thinkingOnly = resolveCatalogue(MODELS, DISPLAY, RAW_SEATS, { owner: { thinking: "high" } });
		expect(thinkingOnly.seats.find((s) => s.name === "owner")!.currentModel).toBe("openrouter/a/fm");
		expect(thinkingOnly.seats.find((s) => s.name === "owner")!.currentThinking).toBe("high");
	});

	test("preserves rawSeats order exactly as passed", () => {
		const res = resolveCatalogue(MODELS, DISPLAY, RAW_SEATS, EMPTY_OVERRIDE);
		expect(res.seats.map((s) => s.name)).toEqual(["principal", "owner"]);
	});
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd .worktrees/feat-ev22-catalogue && bun test test/catalogue.test.ts`
Expected: FAIL — the module `../extensions/catalogue.ts` does not exist (`Cannot find module` / `resolveCatalogue` undefined). The failure must be "feature missing", not a typo.

- [ ] **Step 3: Commit the failing test**

```bash
git add test/catalogue.test.ts
git commit -m "test(catalogue): EV-22 resolver acceptance contract (red)"
```

---

### Task 2: The pure resolver (`extensions/catalogue.ts`)

**Files:**
- Create: `extensions/catalogue.ts`

**Interfaces:**
- Consumes: `Seat`/`AgentOverride` types + `applySeatOverride` from `./seats.ts` (pure — see `extensions/seats.ts` `applySeatOverride`, honoring explicit `thinking` key > `:suffix` on model > frontmatter, model/thinking independent); `getSupportedThinkingLevels` from `@earendil-works/pi-ai/compat`.
- Produces: `CatalogueModel`, `ModelEntry`, `ProviderGroup`, `SeatState`, `ResolverResult`, and `resolveCatalogue` — the exact names/shapes Task 1's test imports.

- [ ] **Step 1: Write the implementation** — create `extensions/catalogue.ts` with the exact content below. Tabs, repo convention.

```ts
import type { Seat, AgentOverride } from "./seats.ts";
import { applySeatOverride } from "./seats.ts";
import { getSupportedThinkingLevels } from "@earendil-works/pi-ai/compat";

/* The plain-data view of one registry Model that the resolver reads. The
   output of ctx.modelRegistry.getAvailable() is structurally assignable to
   this. `reasoning` is passthrough; supportedThinkingLevels — derived below,
   ONLY via pi's getSupportedThinkingLevels — is the sole capability
   authority, never a hand-rolled level set and never a "keys of the map"
   fallback. */
export interface CatalogueModel {
	provider: string;
	id: string;
	name?: string; // display label; falls back to id
	reasoning: boolean;
	thinkingLevelMap?: Record<string, string | null>;
}

export interface ModelEntry {
	qualifiedId: string; // `${provider}/${id}` — the selection/write key (dispatch validates this exact form)
	id: string;
	name: string; // model.name ?? model.id
	reasoning: boolean; // passthrough; NOT consumer-contract
	supportedThinkingLevels: string[];
}

export interface ProviderGroup {
	provider: string;
	displayName: string; // passthrough of providerDisplayName[provider] ?? provider — never derived here
	models: ModelEntry[];
}

export interface SeatState {
	name: string;
	hasOverride: boolean;
	currentModel: string; // always the qualified provider/id
	currentThinking?: string; // present only when a level resolves
}

export interface ResolverResult {
	providers: ProviderGroup[];
	seats: SeatState[];
}

/** J-1 ordering: ids only, never display labels. Both keys are unique per
 *  namespace, so these comparators are total. */
function byId<M extends { id: string }>(a: M, b: M): number {
	return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

function byProviderId<G extends { provider: string }>(a: G, b: G): number {
	return a.provider < b.provider ? -1 : a.provider > b.provider ? 1 : 0;
}

function toModelEntry(model: CatalogueModel): ModelEntry {
	return {
		qualifiedId: `${model.provider}/${model.id}`,
		id: model.id,
		name: model.name ?? model.id,
		reasoning: model.reasoning,
		// `getAvailable()` output and plain test literals are structurally
		// compatible with pi's Model; the cast is required because pi's Model
		// carries many fields this view does not. getSupportedThinkingLevels
		// reads only .reasoning and .thinkingLevelMap.
		supportedThinkingLevels: getSupportedThinkingLevels(
			model as Parameters<typeof getSupportedThinkingLevels>[0],
		),
	};
}

/**
 * Turn pi's flat model registry into a provider-grouped, ordered catalogue of
 * pickable model entries plus each seat's current override state. EV-22 owns
 * this transform only: the fetch (`await refresh()` then `getAvailable()`)
 * happens once in the EV-25 handler and the SAME flat array is handed to this
 * resolver and EV-24's writer-validation, so listing from the result
 * guarantees dispatch accepts the picked model (dispatch validates against
 * the same getAvailable() set).
 *
 * Pure over plain data: four flat arguments, no filesystem, no network, no
 * throwing on an empty catalogue (empty models → `providers: []`).
 */
export function resolveCatalogue(
	models: CatalogueModel[],
	providerDisplayName: Record<string, string>,
	rawSeats: Seat[],
	overrideMap: Record<string, AgentOverride>,
): ResolverResult {
	// 1. Group by provider.
	const byProvider = new Map<string, CatalogueModel[]>();
	for (const model of models) {
		const bucket = byProvider.get(model.provider);
		if (bucket) bucket.push(model);
		else byProvider.set(model.provider, [model]);
	}

	// 2-3. Model entries, then J-1 order: models by id asc, providers by provider id asc.
	const providers = [...byProvider.entries()]
		.map(([provider, groupModels]) => ({
			provider,
			displayName: providerDisplayName[provider] ?? provider,
			models: [...groupModels].sort(byId).map(toModelEntry),
		}))
		.sort(byProviderId);

	// 4. Seats: rawSeats order preserved. hasOverride is KEY PRESENCE — an
	//    `{}` entry counts; applySeatOverride yields the effective values.
	const seats = rawSeats.map((seat) => {
		const effective = applySeatOverride(seat, overrideMap);
		const state: SeatState = {
			name: seat.name,
			hasOverride: Object.hasOwn(overrideMap, seat.name),
			currentModel: effective.model,
		};
		if (effective.thinkingLevel !== undefined) state.currentThinking = effective.thinkingLevel;
		return state;
	});

	return { providers, seats };
}
```

- [ ] **Step 2: Run the test to verify it passes**

Run: `cd .worktrees/feat-ev22-catalogue && bun test test/catalogue.test.ts`
Expected: PASS — all seven `describe` blocks green.

- [ ] **Step 3: Confirm no raw HTTP** (acceptance 2 / constraint 7)

Run: `grep -nE 'fetch|http|axios|https|undici|node:http' extensions/catalogue.ts`
Expected: no output, exit code 1 (no matches). The only specifier in the file is the `import` line — the grep pattern `http` must NOT match `"@earendil-works/pi-ai/compat"` (it does not: no `http` substring).

- [ ] **Step 4: Commit the implementation**

```bash
git add extensions/catalogue.ts
git commit -m "feat(catalogue): pure resolveCatalogue for the picker data seam (EV-22)"
```

---

### Task 3: Full gate sweep (all four, in order)

**Files:** none — verification only.

**Interfaces:** none.

- [ ] **Step 1: Typecheck** — `bunx tsc --noEmit` (repo's gate 1)

Run: `cd .worktrees/feat-ev22-catalogue && bunx tsc --noEmit`
Expected: exit 0, no output. If errors: fix the root cause (this is a hard stop-and-fix; never suppress).

- [ ] **Step 2: Full test suite** — `bun test` (repo's gate 2)

Run: `cd .worktrees/feat-ev22-catalogue && bun test`
Expected: all pass, 0 fail (baseline was 453 pass / 2 skip / 0 fail; now ≥ 460 pass with the new file). The `test/catalogue.test.ts` file must be green in the full suite (spec §7 criterion 1).

- [ ] **Step 3: Artifact validation** — `python3 council/validate.py` (repo's gate 3)

Run: `cd .worktrees/feat-ev22-catalogue && python3 council/validate.py`
Expected: `All council artifacts valid`, exit 0.

- [ ] **Step 4: Re-confirm the raw-HTTP grep**

Run: `cd .worktrees/feat-ev22-catalogue && grep -nE 'fetch|http|axios|https|undici|node:http' extensions/catalogue.ts`
Expected: nothing. Report verbatim.

- [ ] **Step 5: Commit any gate fixes and record the branch**

```bash
git add -A
git commit -m "chore(catalogue): gate sweep (EV-22)"   # only if gate fixes were needed
git rev-parse HEAD
git log --oneline -3
```

---

### Task 4: Push the branch and open the PR

**Files:** none.

- [ ] **Step 1: Push**

```bash
cd .worktrees/feat-ev22-catalogue
git push -u origin feat/ev22-catalogue
git rev-parse HEAD   # record the pushed head SHA
```

- [ ] **Step 2: Open the PR** against `main`

Use `gh pr create` (or the equivalent) with base `main`, head `feat/ev22-catalogue`:

```bash
gh pr create --base main --head feat/ev22-catalogue --title "feat(catalogue): resolve enabled providers/models for the picker (EV-22)" \
  --body "Implements **EV-22**: the pure \`resolveCatalogue(models, providerDisplayName, rawSeats, overrideMap)\` resolver (spec \`docs/superpowers/specs/2026-09-04-EV-22-design.md\`, rulings J-1 id-asc ordering and J-2 flat-data signature applied).

- New: \`extensions/catalogue.ts\` — pure, no fs/network (\`grep -nE 'fetch|http|axios|https|undici|node:http'\` returns nothing); \`supportedThinkingLevels\` ONLY via \`getSupportedThinkingLevels\` from \`@earendil-works/pi-ai/compat\` (no package.json change); \`hasOverride\` = key presence; \`currentModel\` always qualified \`provider/id\`.
- New: \`test/catalogue.test.ts\` — plain-literal unit test covering grouping, displayName passthrough, id-asc ordering (J-1) incl. re-run deep-equal, thinking-level parity fixtures, qualifiedId round-trip, per-seat current state, seat-order preservation.
- New plan: \`docs/superpowers/plans/2026-09-04-EV-22-catalogue-resolver.md\`.

Gates: \`bunx tsc --noEmit\` clean · \`bun test\` full suite green · \`python3 council/validate.py\` clean. No live caller yet — EV-25 owns the one fetch and passes the same flat list here and to EV-24 (scope guard §8)."
```

- [ ] **Step 3: Report** — PR number/URL, pushed head SHA, branch name, plan path, and the verbatim gate outputs (tsc exit, test summary line, validate output, grep result). Do NOT poll CI — that is the facilitator's check.