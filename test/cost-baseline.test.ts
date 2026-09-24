import { test, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { sumSubtree, type RunManifest, type Usage } from "../extensions/runs.ts";
import { srcPin } from "./src-pin.ts";
import {
	buildCostBaseline,
	costByCard,
	costByEpic,
	formatCostBaseline,
} from "../extensions/cost-baseline.ts";

/** Zero-usage tuple helper: a settled dispatch that spent nothing observable. */
function emptyUsage(): Usage {
	return {
		input: 0,
		output: 0,
		cacheRead: 0,
		cacheWrite: 0,
		reasoning: 0,
		totalTokens: 0,
		cost: 0,
		costInput: 0,
		costOutput: 0,
		costCacheRead: 0,
		costCacheWrite: 0,
		turns: 0,
		costBasis: "catalogue-estimate",
		usageSource: "stream-assistant",
	};
}

function manifest(id: string, parentJobId: string | null, cost?: number): RunManifest {
	return {
		id,
		seat: "owner",
		model: "m/x",
		parentJobId,
		pid: null,
		sessionId: id,
		state: "done",
		startedAt: Date.now(),
		settledAt: Date.now(),
		exitCode: 0,
		usage: cost === undefined ? undefined : { ...emptyUsage(), cost },
	};
}

/**
 * Hand-built two-epic fixture forest. Depth 0 = epic roots, depth 1 = card
 * roots, deeper = seat dispatches. Known spend:
 *
 *   epic-alpha                                  subtree cost = 1.00, runs = 3
 *     card-a1 (0.50) ── job-a1 (0.25)           card   = 0.75, runs = 2
 *     card-a2 (none) ── job-a2 (none)           card   = 0.00, runs = 0
 *     card-a3 (0.25)                            card   = 0.25, runs = 1
 *   epic-beta                                   subtree cost = 0.20, runs = 3
 *     card-b1 (0.10) ── job-b1 (0.05), job-b2 (0.05)  card = 0.20, runs = 3
 *     card-b2 (none)                            card   = 0.00, runs = 0
 */
function fixtureForest(): RunManifest[] {
	return [
		manifest("epic-alpha", null),
		manifest("card-a1", "epic-alpha", 0.5),
		manifest("job-a1", "card-a1", 0.25),
		manifest("card-a2", "epic-alpha"),
		manifest("job-a2", "card-a2"),
		manifest("card-a3", "epic-alpha", 0.25),
		manifest("epic-beta", null),
		manifest("card-b1", "epic-beta", 0.1),
		manifest("job-b1", "card-b1", 0.05),
		manifest("job-b2", "card-b1", 0.05),
		manifest("card-b2", "epic-beta"),
	];
}

test("costByCard values each equal sumSubtree at the card root", () => {
	const manifests = fixtureForest();
	const byCard = costByCard(manifests);
	for (const cardId of ["card-a1", "card-a2", "card-a3", "card-b1", "card-b2"]) {
		expect(byCard.get(cardId)).toBe(sumSubtree(manifests, cardId, "cost"));
	}
});

test("costByCard hand-computed sums match the fixture", () => {
	const byCard = costByCard(fixtureForest());
	expect(byCard.get("card-a1")).toBe(0.75);
	expect(byCard.get("card-a3")).toBe(0.25);
	expect(byCard.get("card-b1")).toBe(0.2);
});

test("a card with no settled spend appears as an observed 0, not omitted", () => {
	const byCard = costByCard(fixtureForest());
	expect(byCard.has("card-a2")).toBe(true);
	expect(byCard.get("card-a2")).toBe(0);
	expect(byCard.has("card-b2")).toBe(true);
	expect(byCard.get("card-b2")).toBe(0);
	expect(byCard.size).toBe(5);
});

test("costByEpic sums the epic root's subtree", () => {
	const manifests = fixtureForest();
	expect(costByEpic(manifests, "epic-alpha")).toBe(sumSubtree(manifests, "epic-alpha", "cost"));
	expect(costByEpic(manifests, "epic-alpha")).toBe(1.0);
	expect(costByEpic(manifests, "epic-beta")).toBe(0.2);
});

test("costByEpic of an unknown epic id is 0, never a throw", () => {
	expect(costByEpic(fixtureForest(), "epic-gamma")).toBe(0);
});

test("the report names every epic in scope and its child cards", () => {
	const report = buildCostBaseline(fixtureForest());
	expect(report.epics.map((e) => e.epicId)).toEqual(["epic-alpha", "epic-beta"]);
	const alpha = report.epics[0]!;
	expect(alpha.cards.map((c) => c.cardId)).toEqual(["card-a1", "card-a2", "card-a3"]);
	const beta = report.epics[1]!;
	expect(beta.cards.map((c) => c.cardId)).toEqual(["card-b1", "card-b2"]);
	expect(alpha.cost).toBe(1.0);
	expect(beta.cost).toBe(0.2);
});

test("the report carries the number of runs behind each figure", () => {
	const report = buildCostBaseline(fixtureForest());
	const alpha = report.epics[0]!;
	expect(alpha.runs).toBe(3);
	const cards = new Map(alpha.cards.map((c) => [c.cardId, c.runs]));
	expect(cards.get("card-a1")).toBe(2);
	expect(cards.get("card-a2")).toBe(0);
	expect(cards.get("card-a3")).toBe(1);
	const beta = report.epics[1]!;
	expect(beta.runs).toBe(3);
	expect(new Map(beta.cards.map((c) => [c.cardId, c.runs])).get("card-b2")).toBe(0);
});

test("formatCostBaseline pins the exact bytes over the fixture forest", () => {
	const lines = formatCostBaseline(buildCostBaseline(fixtureForest()));
	expect(lines).toEqual([
		"epic epic-alpha cost=$1.0000 runs=3",
		"  card card-a1 cost=$0.7500 runs=2",
		"  card card-a2 cost=$0.0000 runs=0",
		"  card card-a3 cost=$0.2500 runs=1",
		"epic epic-beta cost=$0.2000 runs=3",
		"  card card-b1 cost=$0.2000 runs=3",
		"  card card-b2 cost=$0.0000 runs=0",
	]);
});

test("the module imports its manifest accessors from the run-substrate module and never touches the run directory", () => {
	const moduleUrl = fileURLToPath(import.meta.resolve("../extensions/cost-baseline.ts"));
	const source = readFileSync(moduleUrl, "utf-8");
	// quote-agnostic pin (FLLWUP-116) — see test/src-pin.ts
	expect(srcPin(source)).toContain(srcPin(`from "./runs.ts"`));
	// No direct run-directory access: no fs/path plumbing, no runsDir seam.
	expect(source).not.toContain("node:fs");
	expect(source).not.toContain("node:path");
	expect(source).not.toContain("runsDir");
	expect(source).not.toContain("readFileSync");
	expect(source).not.toContain("readdirSync");
});

test("the module is pure — its only import is the run-substrate module", () => {
	const moduleUrl = fileURLToPath(import.meta.resolve("../extensions/cost-baseline.ts"));
	const source = readFileSync(moduleUrl, "utf-8");
	const imports = [...source.matchAll(/(?:^|\n)import\s[^;]*from\s*"([^"]+)";/g)].map((m) => m[1]);
	expect(imports).toEqual(["./runs.ts"]);
	expect(source).not.toContain("fetch(");
	expect(source).not.toContain("chat/completions");
	expect(source).not.toContain("import(");
	// Sanity: an empty manifest list yields an empty report, not a crash.
	expect(buildCostBaseline([]).epics).toEqual([]);
	expect(costByCard([]).size).toBe(0);
	expect(costByEpic([], "epic-x")).toBe(0);
	expect(formatCostBaseline({ epics: [] })).toEqual([]);
});
