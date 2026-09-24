// ---------------------------------------------------------------------------
// EV-71 — decisions-aware gate spend accounting: the reconciliation half
// (test plan items 2, 3, 4, 12–15, 17, 18 of the settled design spec,
// docs/superpowers/specs/2026-09-21-EV-71-design.md).
//
// Shape under test: `reconcileGateSpend` (extensions/provider-cost.ts) — a
// SEPARATE gate-spend reconciliation sharing only `fetchGeneration` with the
// seat path; ids enter ONLY through the caller-passed ledger-sourced input
// (no gate-ledger import in provider-cost.ts — the source pin is structural).
// The result is the `GateSpendReport` that becomes the record's top-level
// `gate` sibling: { callsInWindow, totalCost (ledger-authoritative Σ,
// sumGateSpend semantics), lookupCost (distinct observable lookup Σ),
// failedLookups }. `api_type` is inert (no field, byte-identical behavior
// with and without it).
//
// Grammar scoping (product-owner ruling 2026-09-21, verbatim — binds EVERY
// golden in this file; see also the block goldens in test/usage-block.test.ts):
// "The block's grammar is unchanged" means row grammar and state exclusivity,
// not line count. A render is grammar-preserving iff, for every input: (1)
// every emitted line is one of the three bound whole-block state lines (or
// the usage  accounting failed — <reason> prefix line) or a row carrying the
// literal "usage  " prefix; (2) every row keeps its ruled key and "key = short
// definition" shape, label column unpadded as ruled; (3) row order is the
// ruled order and each conditional legend keeps its slot, the stack reading
// reported → partial → n/a → gate with gate last; (4) at most one whole-block
// state line appears, never two, precedence failed > unresolved > empty
// unchanged, and the state line is always the block's first line; (5) with
// zero gate calls in window the block is byte-identical to the pre-EV-71
// render.
//
// O-C (adopted): every Σ golden in this file compares through ONE float path
// (`0.0042 − 0.001 = 0.0031999999999999997`) — never a hand-written decimal.
//
// RED-AT-BASE RECORD (C1, seven-field convention, required base):
//   1. Base identity: 6eccde0 (full sha recorded in the PR body) — the commit
//      immediately preceding EV-71's first mechanism merge; base role:
//      `required`.
//   2. Transplant identity: this file alone, copied from the EV-71 head
//      (source sha in the PR body). At base, `reconcileGateSpend` /
//      `sumGateSpend` / `GateSpendReport` do not exist in
//      extensions/provider-cost.ts.
//   3. Exact command: `bun test test/gate-spend-reconcile.test.ts`.
//   4. Raw red output: recorded verbatim in the EV-71 PR body.
//   5. Worktree provenance: detached checkout at the base sha in a separate
//      worktree; the main checkout never touched; worktree removed after the
//      run.
//   6. Copy set: bare copy + a node_modules symlink (module resolution only —
//      the transplant adds no other file).
//   7. Head half: same exact command at the EV-71 head → 0 fail (asserted by
//      the gate run; sha in the PR body).
// ---------------------------------------------------------------------------

import { test, expect } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import {
	appendGateCall,
	readGateLedger,
	type GateCallInput,
} from "../extensions/gate-ledger.ts";
import {
	reconcileGateSpend,
	sumGateSpend,
	type GateLedgerCallLine,
} from "../extensions/provider-cost.ts";
import type { GenerationResponse } from "../extensions/provider-cost.ts";
import { srcPin } from "./src-pin.ts";

function tmpDir(prefix: string): string {
	return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function gateCall(repoRoot: string, t: number, over: Partial<GateCallInput> = {}) {
	return appendGateCall(
		{
			stateHash: "s-hash",
			questionSetVersion: "q1",
			questionIds: [],
			answers: {},
			resolvedMode: "Verify",
			policyVersion: "p1",
			now: () => new Date(t).toISOString(),
			...over,
		},
		repoRoot,
	);
}

// ---------------------------------------------------------------------------
// J1 enforcement: the ledger half is NOT touched (appendGateCall stays the
// sole writer; it computes nothing and stores usage.cost verbatim).
// ---------------------------------------------------------------------------

test("T-B (J1): appendGateCall round-trip — usage.cost 0.0042 in, 0.0042 out exactly", () => {
	const repo = tmpDir("ev71-ledger-");
	gateCall(repo, 1_700_000_000_000, {
		callId: "call-tb",
		usage: { input_tokens: 10, output_tokens: 5, cost: 0.0042 },
		generationId: "gen-dec-123",
	});
	const { calls } = readGateLedger(repo);
	expect(calls).toHaveLength(1);
	expect(calls[0]!.callId).toBe("call-tb");
	expect(calls[0]!.usage).toEqual({ input_tokens: 10, output_tokens: 5, cost: 0.0042 });
	expect(calls[0]!.usage!.cost).toBe(0.0042);
	expect(calls[0]!.generationId).toBe("gen-dec-123");
});

test("T-C (J1): the emitted line carries no cost-bearing key other than usage.cost", () => {
	const repo = tmpDir("ev71-ledger-");
	gateCall(repo, 1_700_000_000_000, {
		usage: { input_tokens: 1, output_tokens: 1, cost: 0.0042 },
		generationId: "gen-dec-1",
		basis: "Mode: Verify — answered",
		model: "typesafe/jev-1.13",
		provider: "typesafe",
	});
	const line = fs
		.readFileSync(path.join(repo, ".pi", "council", "gate-ledger.jsonl"), "utf-8")
		.split("\n")[0]!;
	const rec = JSON.parse(line) as Record<string, unknown>;
	const costPaths: string[] = [];
	const walk = (v: unknown, prefix: string[]): void => {
		if (v === null || typeof v !== "object") return;
		for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
			const p = [...prefix, k];
			if (/cost/i.test(k)) costPaths.push(p.join("."));
			walk(val, p);
		}
	};
	walk(rec, []);
	expect(costPaths).toEqual(["usage.cost"]);
	// the prohibited synonyms never appear on the line in any shape
	for (const banned of ["costBasis", "totalCost", "estimated", "catalogue"]) {
		expect(line.includes(banned)).toBe(false);
	}
});

test("T-D (J1): no catalogue-cost path reachable from the gate path (source canary)", () => {
	const src = (rel: string): string =>
		fs.readFileSync(fileURLToPath(new URL(rel, import.meta.url)), "utf-8");
	// the gate path's three files: the ledger writer/reader, the gate
	// reconciliation half, and the flush's gate block
	for (const f of [
		"../extensions/gate-ledger.ts",
		"../extensions/provider-cost.ts",
		"../extensions/usage-store.ts",
	]) {
		const text = srcPin(src(f));
		expect(text.includes("calculateCost")).toBe(false);
		// quote-agnostic canary (FLLWUP-116): reds on BOTH quote styles — see test/src-pin.ts
		expect(text.includes(srcPin('from "./catalogue'))).toBe(false);
	}
});

// ---------------------------------------------------------------------------
// sumGateSpend semantics (the ledger-authoritative Σ)
// ---------------------------------------------------------------------------

test("sumGateSpend: null iff no finite usage.cost carried; absent/null/non-finite contribute nothing (never zero-derived)", () => {
	expect(sumGateSpend([])).toBe(null);
	expect(sumGateSpend([{ callId: "a" }])).toBe(null);
	expect(sumGateSpend([{ callId: "a", usage: null }])).toBe(null);
	expect(sumGateSpend([{ callId: "a", usage: { cost: null } }])).toBe(null);
	expect(sumGateSpend([{ callId: "a", usage: { cost: Number.NaN } }])).toBe(null);
	// a finite 0 IS carried (present, not derived) — O-C float path, single term
	expect(sumGateSpend([{ callId: "a", usage: { cost: 0 } }])).toBe(0);
});

// ---------------------------------------------------------------------------
// Item 18 — mixed ledger through the REAL readGateLedger: v1 lines, v2 lines,
// usage: null, finite 0, a torn tail; the Σ counts only finite usage.cost.
// Grammar-scoped golden (file header); O-C one float path.
// ---------------------------------------------------------------------------

test("item 18: mixed v1/v2 ledger + usage null + finite 0 + torn tail — Σ = 0.0042 − 0.001 + 0 through one float path", async () => {
	const repo = tmpDir("ev71-mixed-");
	// v1 call line (EV-61 shape): no usage, no generationId — contributes nothing
	const v1 = {
		schemaVersion: 1,
		kind: "call",
		callId: "call-v1",
		stateHash: "s",
		questionSetVersion: "q1",
		answers: {},
		resolvedMode: "Direct",
		policyVersion: "p1",
		recordedAt: new Date(1_700_000_000_000).toISOString(),
	};
	fs.mkdirSync(path.join(repo, ".pi", "council"), { recursive: true });
	fs.writeFileSync(path.join(repo, ".pi", "council", "gate-ledger.jsonl"), JSON.stringify(v1) + "\n");
	gateCall(repo, 1_700_000_100_000, {
		callId: "call-a",
		usage: { input_tokens: 1, output_tokens: 1, cost: 0.0042 },
		generationId: "gen-dec-a",
	});
	gateCall(repo, 1_700_000_200_000, {
		callId: "call-b",
		usage: null,
		generationId: "gen-dec-b",
	});
	gateCall(repo, 1_700_000_300_000, {
		callId: "call-c",
		usage: { input_tokens: 1, output_tokens: 1, cost: -0.001 },
		generationId: "gen-dec-c",
	});
	gateCall(repo, 1_700_000_400_000, {
		callId: "call-d",
		usage: { input_tokens: 1, output_tokens: 1, cost: 0 },
		generationId: "gen-dec-d",
	});
	// torn tail + an outcome follow-on line (joined at read; never a call)
	const ledgerPath = path.join(repo, ".pi", "council", "gate-ledger.jsonl");
	fs.appendFileSync(
		ledgerPath,
		JSON.stringify({ schemaVersion: 2, kind: "outcome", callId: "call-a", outcome: { ok: true }, recordedAt: new Date(1_700_000_500_000).toISOString() }) + "\n" +
			'{"schemaVersion":2,"kind":"call","callId":"call-tor', // torn
	);
	const { calls } = readGateLedger(repo);
	expect(calls).toHaveLength(5); // v1 + a/b/c/d; torn tail skipped
	const windowed: GateLedgerCallLine[] = calls.filter(
		(c) => Date.parse(c.recordedAt) >= 1_700_000_000_000,
	);
	expect(windowed).toHaveLength(5); // the v1 line is in the window too — it just carries nothing
	const seen: string[] = [];
	const report = await reconcileGateSpend({
		gateCalls: windowed,
		fetchGeneration: async (id) => {
			seen.push(id);
			return { total_cost: 0, provider_name: "x" };
		},
		apiKey: "k",
	});
	// the v1 line is never looked up (no id); a/b/c/d are, exactly once each
	expect(seen).toEqual(["gen-dec-a", "gen-dec-b", "gen-dec-c", "gen-dec-d"]);
	expect(report.callsInWindow).toBe(5);
	// O-C: the Σ golden compares through ONE float path —
	// 0.0042 − 0.001 = 0.0031999999999999997 (+0 exact) — never hand-written.
	expect(report.totalCost).toBe(0.0042 - 0.001 + 0);
	// the lookup Σ is a DISTINCT observable field (four carried 0s → 0, not null)
	expect(report.lookupCost).toBe(0);
	expect(report.failedLookups).toBe(0);
	// sumGateSpend over the same slice agrees through the same float path
	expect(sumGateSpend(windowed)).toBe(report.totalCost!);
});

// ---------------------------------------------------------------------------
// Item 13 — the acceptance property: a ledger-sourced gen-dec- id is looked
// up exactly once through the injected double and its reported total_cost
// resolves into the gate total (and equals the ledger Σ through one float
// path).
// ---------------------------------------------------------------------------

test("item 13 (acceptance): ledger-sourced gen-dec- id looked up exactly once; reported total_cost resolves into the gate total", async () => {
	const windowed: GateLedgerCallLine[] = [
		{ callId: "call-1", generationId: "gen-dec-123", usage: { cost: 0.0042 } },
	];
	const seen: string[] = [];
	const report = await reconcileGateSpend({
		gateCalls: windowed,
		fetchGeneration: async (id) => {
			seen.push(id);
			return { id, total_cost: 0.0042, provider_name: "Typesafe", api_type: "decisions" };
		},
		apiKey: "k",
	});
	expect(seen).toEqual(["gen-dec-123"]); // exactly once
	expect(report).toEqual({ callsInWindow: 1, totalCost: 0.0042, lookupCost: 0.0042, failedLookups: 0 });
	// the reported figure resolves into (equals) the ledger-authoritative Σ
	expect(report.lookupCost).toBe(report.totalCost);
	expect(report.totalCost).toBe(sumGateSpend(windowed));
});

// ---------------------------------------------------------------------------
// Item 15 — api_type is inert: byte-identical report with and without it.
// ---------------------------------------------------------------------------

test("item 15: api_type inert — 'decisions' vs 'chat' vs absent resolve to equal reports", async () => {
	const windowed: GateLedgerCallLine[] = [
		{ callId: "call-1", generationId: "gen-dec-1", usage: { cost: 0.0042 } },
	];
	const run = async (api_type: string | undefined): Promise<unknown> => {
		return reconcileGateSpend({
			gateCalls: windowed,
			fetchGeneration: async () =>
				({ total_cost: 0.0042, provider_name: "T", ...(api_type !== undefined ? { api_type } : {}) }) as GenerationResponse,
			apiKey: "k",
		});
	};
	expect(await run("decisions")).toEqual(await run("chat"));
	expect(await run("decisions")).toEqual(await run(undefined));
});

// ---------------------------------------------------------------------------
// Item 17 — ledger authority vs lookup: a divergent total_cost keeps both
// figures separately observable (a mismatch is record-only, never rendered).
// ---------------------------------------------------------------------------

test("item 17: divergent lookup — gate.totalCost stays the ledger Σ; lookupCost keeps the lookup Σ", async () => {
	const windowed: GateLedgerCallLine[] = [
		{ callId: "call-1", generationId: "gen-dec-1", usage: { cost: 0.0042 } },
		{ callId: "call-2", generationId: "gen-dec-2", usage: { cost: 0.001 } },
	];
	const report = await reconcileGateSpend({
		gateCalls: windowed,
		fetchGeneration: async () => ({ total_cost: 9.99, provider_name: "T" }),
		apiKey: "k",
	});
	// O-C: the Σ golden compares through one float path over the fixture's own
	// figures (0.0042 then 0.001) — never a hand-written decimal
	expect(report.totalCost).toBe(0.0042 + 0.001);
	expect(report.lookupCost).toBe(9.99 + 9.99); // one float path over the lookup figures
	expect(report.failedLookups).toBe(0);
	expect(report.callsInWindow).toBe(2);
});

// ---------------------------------------------------------------------------
// Item 12 — failed-call-only window: a call with no id and no usage counts in
// callsInWindow, is never looked up, and derives no estimate (call-claim, not
// spend-claim).
// ---------------------------------------------------------------------------

test("item 12: failed-call-only window — callsInWindow counts it, zero lookups, totalCost null, no estimate", async () => {
	const seen: string[] = [];
	const report = await reconcileGateSpend({
		gateCalls: [{ callId: "call-f", generationId: null, usage: null }],
		fetchGeneration: async (id) => {
			seen.push(id);
			return { total_cost: 0.0042 };
		},
		apiKey: "k",
	});
	expect(report).toEqual({ callsInWindow: 1, totalCost: null, lookupCost: null, failedLookups: 0 });
	expect(seen).toEqual([]); // no lookup for a failed call
});

// ---------------------------------------------------------------------------
// Failed lookup — a rejecting double lands in failedLookups and leaves the
// ledger-authoritative total untouched (the ledger carries the cost).
// ---------------------------------------------------------------------------

test("failed lookup: rejecting double → failedLookups 1, ledger Σ intact, lookup Σ of survivors only", async () => {
	const windowed: GateLedgerCallLine[] = [
		{ callId: "call-1", generationId: "gen-dec-1", usage: { cost: 0.0042 } },
		{ callId: "call-2", generationId: "gen-dec-2", usage: { cost: 0.001 } },
	];
	const report = await reconcileGateSpend({
		gateCalls: windowed,
		fetchGeneration: async (id) => {
			if (id === "gen-dec-1") throw new Error("HTTP 500");
			return { total_cost: 0.0042 };
		},
		apiKey: "k",
	});
	expect(report.failedLookups).toBe(1);
	expect(report.totalCost).toBe(0.0042 + 0.001); // ledger-authoritative, unaffected (one float path)
	expect(report.lookupCost).toBe(0.0042); // only the surviving lookup's figure
});

// ---------------------------------------------------------------------------
// No key / no calls — the zero shapes.
// ---------------------------------------------------------------------------

test("apiKey null: no lookups attempted (lookupCost null, failedLookups 0); ledger figures intact", async () => {
	const seen: string[] = [];
	const report = await reconcileGateSpend({
		gateCalls: [{ callId: "call-1", generationId: "gen-dec-1", usage: { cost: 0.0042 } }],
		fetchGeneration: async (id) => {
			seen.push(id);
			return { total_cost: 0.0042 };
		},
		apiKey: null,
	});
	expect(report.callsInWindow).toBe(1);
	expect(report.totalCost).toBe(0.0042);
	expect(report.lookupCost).toBe(null);
	expect(report.failedLookups).toBe(0);
	expect(seen).toEqual([]);
});

test("no gateCalls input → the zero-shape report; absent ids are skipped, never synthesized", async () => {
	const seen: string[] = [];
	const report = await reconcileGateSpend({
		fetchGeneration: async (id) => {
			seen.push(id);
			return { total_cost: 0.0042 };
		},
		apiKey: "k",
	});
	expect(report).toEqual({ callsInWindow: 0, totalCost: null, lookupCost: null, failedLookups: 0 });
	// a call line with an empty-string id is treated as absent (never fetched)
	const report2 = await reconcileGateSpend({
		gateCalls: [{ callId: "call-x", generationId: "", usage: { cost: 0.0042 } }],
		fetchGeneration: async (id) => {
			seen.push(id);
			return { total_cost: 0.0042 };
		},
		apiKey: "k",
	});
	expect(report2.callsInWindow).toBe(1);
	expect(report2.totalCost).toBe(0.0042);
	expect(report2.lookupCost).toBe(null); // nothing was looked up
	expect(seen).toEqual([]);
});
