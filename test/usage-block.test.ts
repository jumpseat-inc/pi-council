// ---------------------------------------------------------------------------
// Task 1 (EV-32): the extracted token/money fragments (T9 — EV-28 regression
// guard). The bytes pinned here are byte-identical to hub.test.ts T5, which
// pinned formatUsageSegment BEFORE the extraction; these assert the SAME bytes
// AFTER it, so the refactor is regression-guarded from both ends.
// ---------------------------------------------------------------------------

import { test, expect } from "bun:test";
import type { Usage } from "../extensions/runs.ts";
import { formatTokensFragment, formatMoney, formatUsageSegment } from "../extensions/usage-format.ts";

function usageOf(over: Partial<Usage> = {}): Usage {
	return {
		input: 0, output: 0, cacheRead: 0, cacheWrite: 0, reasoning: 0, totalTokens: 0,
		cost: 0, costInput: 0, costOutput: 0, costCacheRead: 0, costCacheWrite: 0,
		turns: 0, costBasis: "catalogue-estimate", usageSource: "stream-assistant",
		...over,
	};
}

test("T9: formatUsageSegment bytes survive the extraction byte-identically", () => {
	const base = usageOf({ input: 100, output: 10, cacheRead: 900, cacheWrite: 0, reasoning: 7, totalTokens: 1010, cost: 0.0013, turns: 1 });
	expect(formatUsageSegment(base)).toBe("turns=1 tokens=in 100/out 10/cR 900/cW 0/reason 7/total 1010 cost≈$0.0013 (catalogue)");
	// hub-tools re-exports the same function — the EV-28 import surface is untouched
	// (asserted on the re-export in the T9-companion test in test/hub.test.ts style).
});

test("T9a: formatTokensFragment field order (EV-28 Q5) and no thousands separators", () => {
	const u = usageOf({ turns: 4, input: 9000, output: 2100, cacheRead: 44000, cacheWrite: 800, reasoning: 700, totalTokens: 55900 });
	expect(formatTokensFragment(u)).toBe("turns=4 tokens=in 9000/out 2100/cR 44000/cW 800/reason 700/total 55900");
});

test("T9b: formatMoney renders R-1 verbatim — U+2248 catalogue, plain $ reported", () => {
	const cat = formatMoney(usageOf({ cost: 0.1234 }));
	expect(cat).toBe("cost≈$0.1234 (catalogue)");
	expect([...cat.matchAll(/≈/g)][0]![0]).toBe("\u2248");
	const rep = formatMoney(usageOf({ cost: 0.1234, costBasis: "reported" }));
	expect(rep).toBe("cost=$0.1234 (reported)");
	expect(rep).not.toContain("≈");
});

// ---------------------------------------------------------------------------
// Task 2 (EV-32): the pure block renderer — extensions/usage-block.ts
// (spec §2.1–§2.3; steward B three states; PO C/D/E/F grammar)
// ---------------------------------------------------------------------------

import { formatUsageBlock, formatRunnerUsageBlock, sumSubtreeUsage } from "../extensions/usage-block.ts";
import { formatBoundaryLabel } from "../extensions/spend.ts";
import { formatReportedMoney } from "../extensions/usage-format.ts";
import type { ProviderCostReport, ProviderGeneration } from "../extensions/provider-cost.ts";
import { sumSubtree, type RunManifest } from "../extensions/runs.ts";

/** Resolved, measured fixture record (hand-built for full numeric control). */
const measuredRecord = {
	boundary: { sessionId: "sess-x", resolved: true, firstEntryId: "e1", lastEntryId: "e9", jobCount: 3 },
	ownSession: usageOf({
		input: 10, output: 20, cacheRead: 5, cacheWrite: 1, reasoning: 4, totalTokens: 36,
		cost: 0.0123, costInput: 10, costOutput: 20, costCacheRead: 1, costCacheWrite: 2, turns: 1,
		costBasis: "catalogue-estimate", usageSource: "session-reconciled",
	}),
	subtree: usageOf({
		input: 9000, output: 2100, cacheRead: 44000, cacheWrite: 800, reasoning: 700, totalTokens: 55900,
		cost: 0.201, costInput: 100, costOutput: 60, costCacheRead: 3, costCacheWrite: 4, turns: 4,
	}),
} as const;

const zeroRecord = {
	boundary: { sessionId: "sess-x", resolved: true, firstEntryId: "e1", lastEntryId: "e9", jobCount: 2 },
	ownSession: usageOf({ usageSource: "session-reconciled" }),
	subtree: usageOf(),
} as const;

const unresolvedRecord = {
	boundary: { sessionId: "sess-x", resolved: false, firstEntryId: null, lastEntryId: null, jobCount: 0 },
	ownSession: usageOf({ usageSource: "session-reconciled" }),
	subtree: usageOf(),
} as const;

test("T1: every rendered number parse-back-equals the record field; no summed half anywhere", () => {
	const block = formatUsageBlock({ record: measuredRecord });
	expect(block).toBe(
		"usage  ownSession  basis=session-reconciled  turns=1 tokens=in 10/out 20/cR 5/cW 1/reason 4/total 36 cost≈$0.0123 (catalogue)\n" +
		"usage  subtree     basis=stream-assistant  turns=4 tokens=in 9000/out 2100/cR 44000/cW 800/reason 700/total 55900 cost≈$0.2010 (catalogue)\n" +
		"usage  boundary=session=sess-x entries=e1..e9 jobs=3",
	);
	// basis is read from data, never hardcoded
	expect(block).toContain("basis=session-reconciled");
	expect(block).toContain("basis=stream-assistant");
	// no combined half-sum: input 10+9000=9010, total 36+55900=55936, cost .0123+.2010=.2133
	expect(block).not.toContain("9010");
	expect(block).not.toContain("55936");
	expect(block).not.toContain("0.2133");
	// exactly one occurrence of each half's own numbers (a row per half, never merged)
	for (const n of ["in 10", "in 9000", "total 36", "total 55900"]) {
		expect(block.split(n).length - 1).toBe(1);
	}
});

test("T2: byte-stable — two calls and a structuredClone yield identical bytes", () => {
	const a = formatUsageBlock({ record: measuredRecord });
	const b = formatUsageBlock({ record: measuredRecord });
	const c = formatUsageBlock({ record: structuredClone(measuredRecord) as unknown as typeof measuredRecord });
	expect(a).toBe(b);
	expect(a).toBe(c);
});

test("T3: state 1 — resolved + measured-zero → exactly 'usage  no usage recorded'", () => {
	expect(formatUsageBlock({ record: zeroRecord })).toBe("usage  no usage recorded");
});

test("T4: state 2 — { failed } → R-5 literal with U+2014, newline-normalized to one line", () => {
	const one = formatUsageBlock({ failed: "write failed for /abs/store/x.json: EACCES" });
	expect(one).toBe("usage  accounting failed \u2014 write failed for /abs/store/x.json: EACCES");
	expect(one.includes("\u2014")).toBe(true);
	const two = formatUsageBlock({ failed: "a\nb" });
	expect(two).toBe("usage  accounting failed \u2014 a b");
	expect(two.split("\n").length).toBe(1);
});

test("T5: state 3 — unresolved boundary → exactly 'usage  accounting boundary unresolved', distinct from the measured-zero render", () => {
	const unresolved = formatUsageBlock({ record: unresolvedRecord });
	expect(unresolved).toBe("usage  accounting boundary unresolved");
	expect(unresolved).not.toBe(formatUsageBlock({ record: zeroRecord }));
});

test("T6: R-1 — reported basis renders cost=$… (reported); catalogue renders cost≈$… (catalogue)", () => {
	const rep = formatUsageBlock({
		record: {
			boundary: measuredRecord.boundary,
			ownSession: usageOf({ input: 1, totalTokens: 1, cost: 0.1, costBasis: "reported", turns: 1, usageSource: "session-reconciled" }),
			subtree: usageOf({ input: 5, totalTokens: 5, cost: 0.5, costBasis: "reported", turns: 1 }),
		},
	});
	expect(rep).toContain("cost=$0.5000 (reported)");
	expect(rep).toContain("cost=$0.1000 (reported)");
	expect(rep).not.toContain("≈");
});

test("T7: R-4 — the resolved block contains formatBoundaryLabel(record) verbatim as one line", () => {
	const block = formatUsageBlock({ record: measuredRecord });
	// the row is `usage  ` + formatBoundaryLabel(record) verbatim — never re-rendered
	expect(block).toContain(formatBoundaryLabel(measuredRecord));
	expect(block.split("\n")[2]).toBe(`usage  ${formatBoundaryLabel(measuredRecord)}`);
});

test("T8: n/a hook — explicit unavailableCost renders cost=n/a in-slot + conditional legend; absent input → no legend; never in a whole-block state", () => {
	const withNa = formatUsageBlock({ record: measuredRecord, unavailableCost: ["subtree"] });
	expect(withNa).toContain("reason 700/total 55900 cost=n/a");
	expect(withNa).not.toContain("cost≈$0.2010");
	expect(withNa.split("\n")).toContain("usage  n/a = provider figure unavailable");
	// ownSession slot unaffected
	expect(withNa).toContain("cost≈$0.0123 (catalogue)");
	// legend is the LAST line
	expect(withNa.split("\n").at(-1)).toBe("usage  n/a = provider figure unavailable");
	// no unavailableCost → no legend
	expect(formatUsageBlock({ record: measuredRecord }).includes("n/a")).toBe(false);
	// legend never in a whole-block state, even with unavailableCost passed
	expect(formatUsageBlock({ record: zeroRecord, unavailableCost: ["subtree"] })).toBe("usage  no usage recorded");
	expect(formatUsageBlock({ record: unresolvedRecord, unavailableCost: ["subtree"] })).toBe(
		"usage  accounting boundary unresolved",
	);
});

// --- T10/T11: the runner-shaped block (PO C: no ownSession, one subtree line) ---

function manifestFixture(id: string, over: Partial<RunManifest> = {}): RunManifest {
	return {
		id,
		seat: "council-runner",
		model: "m/x",
		parentJobId: null,
		pid: null,
		sessionId: id,
		state: "done",
		startedAt: 0,
		settledAt: null,
		exitCode: 0,
		usage: usageOf({ usageSource: "stream-assistant" }),
		...over,
	};
}

const runnerManifests = [
	manifestFixture("job-r", { usage: usageOf({ input: 300, cost: 3, totalTokens: 600, turns: 1 }) }),
	manifestFixture("job-r.1", { parentJobId: "job-r", usage: usageOf({ input: 200, cost: 2, totalTokens: 400, turns: 1 }) }),
];

test("T10: runner block — no ownSession line, one subtree line equal to sumSubtree over every metric, true job count", () => {
	const { subtree, jobCount } = sumSubtreeUsage(runnerManifests, "job-r");
	expect(jobCount).toBe(2);
	// every numeric metric equals the existing single-metric sumSubtree
	const METRICS = [
		"input", "output", "cacheRead", "cacheWrite", "reasoning", "totalTokens",
		"cost", "costInput", "costOutput", "costCacheRead", "costCacheWrite", "turns",
	] as const;
	for (const m of METRICS) {
		expect(subtree[m]).toBe(sumSubtree(runnerManifests, "job-r", m));
	}
	const block = formatRunnerUsageBlock({ sessionId: "job-r", jobCount, subtree });
	expect(block).not.toContain("ownSession");
	const lines = block.split("\n");
	expect(lines).toHaveLength(2);
	expect(lines[0]).toBe(
		"usage  subtree     basis=stream-assistant  turns=2 tokens=in 500/out 0/cR 0/cW 0/reason 0/total 1000 cost≈$5.0000 (catalogue)",
	);
	expect(lines[1]).toBe("usage  boundary=session=job-r entries=unresolved jobs=2");
	// sumSubtree itself is untouched (EV-16 §7)
	expect(sumSubtree(runnerManifests, "job-r", "cost")).toBe(5);
});

test("T11: runner zero — settled job with no manifest usage renders state 1, never blank", () => {
	const { subtree, jobCount } = sumSubtreeUsage(runnerManifests, "job-missing");
	expect(jobCount).toBe(0);
	expect(formatRunnerUsageBlock({ sessionId: "job-missing", jobCount, subtree })).toBe("usage  no usage recorded");
});

test("T16: every line of every fixture render is ≤160 columns", () => {
	const renders = [
		formatUsageBlock({ record: measuredRecord }),
		formatUsageBlock({ record: measuredRecord, unavailableCost: ["subtree"] }),
		formatRunnerUsageBlock({ sessionId: "job-r", jobCount: 2, subtree: sumSubtreeUsage(runnerManifests, "job-r").subtree }),
		// a deliberately wide fixture
		formatUsageBlock({
			record: {
				boundary: measuredRecord.boundary,
				ownSession: measuredRecord.ownSession,
				subtree: usageOf({ input: 900000, output: 210000, cacheRead: 4400000, cacheWrite: 8000, reasoning: 7000, totalTokens: 5590000, cost: 20.01, turns: 444 }),
			},
		}),
	];
	for (const block of renders) {
		for (const line of block.split("\n")) {
			expect([...line].length).toBeLessThanOrEqual(160);
		}
	}
});

// ---------------------------------------------------------------------------
// EV-29: the provider-reported row — one new row after the boundary row and
// before the legend (ruling C1); `routed=` multiset (C2); the provider-driven
// subtree unavailability (C4/E); ≤160 hard (C2). The two measurement rows, the
// boundary row, and the three whole-block states are unchanged (T-B6 is the
// existing T1–T16 set running unmodified-expectations with no provider).
// ---------------------------------------------------------------------------

function providerGen(over: Partial<ProviderGeneration> = {}): ProviderGeneration {
	return {
		generationId: "gen-1",
		jobId: "job-1",
		model: "openrouter/anthropic/claude-x",
		providerName: "Infermatic",
		totalCost: 0.0042,
		upstreamInferenceCost: null,
		upstreamInferencePromptCost: null,
		upstreamInferenceCompletionsCost: null,
		cacheDiscount: null,
		isByok: null,
		nativeTokens: null,
		status: "reported",
		fetchedAt: "2026-09-11T00:00:00.000Z",
		...over,
	};
}

function providerReport(over: Partial<ProviderCostReport> = {}): ProviderCostReport {
	return { status: "reported", totalCost: 0.0042, generations: [providerGen()], ...over };
}

test("T-B1 (C1 bytes): reported provider — the three existing rows byte-identical, then exactly one reported row, no legend", () => {
	const noProvider = formatUsageBlock({ record: measuredRecord });
	const withProvider = formatUsageBlock({ record: measuredRecord, provider: providerReport() });
	const lines = withProvider.split("\n");
	expect(lines).toHaveLength(4);
	expect(lines[0]).toBe(noProvider.split("\n")[0]);
	expect(lines[1]).toBe(noProvider.split("\n")[1]);
	expect(lines[2]).toBe(noProvider.split("\n")[2]);
	// the one new row, byte-exact R-1 via the composed formatter (never forked)
	expect(lines[3]).toBe("usage  reported  cost=$0.0042 (reported) routed=Infermaticx1");
	expect(lines[3]).toContain(formatReportedMoney(0.0042));
	expect(withProvider).not.toContain("provider figure unavailable");
});

test("T-B2 (multiset): routed=ax2,bx1 — descending count, then ascending name, ASCII x, no spaces; providerName null excluded", () => {
	const rep = providerReport({
		totalCost: 0.03,
		generations: [
			providerGen({ generationId: "g1", providerName: "b", totalCost: 0.01 }),
			providerGen({ generationId: "g2", providerName: "a", totalCost: 0.01 }),
			providerGen({ generationId: "g3", providerName: "a", totalCost: 0.01 }),
			providerGen({ generationId: "g4", providerName: null, totalCost: 0 }), // excluded
		],
	});
	const row = formatUsageBlock({ record: measuredRecord, provider: rep }).split("\n")[3];
	expect(row).toBe("usage  reported  cost=$0.0300 (reported) routed=ax2,bx1");
});

test("T-B3 (omission, C2): unavailable + zero reported → no reported row, subtree cost=n/a + legend; absent provider → bytes identical to today", () => {
	const unavail: ProviderCostReport = { status: "unavailable", reason: "no-api-key", totalCost: null, generations: [] };
	const b = formatUsageBlock({ record: measuredRecord, provider: unavail });
	const lines = b.split("\n");
	expect(lines).toHaveLength(4);
	expect(lines.some((l) => l.includes("reported "))).toBe(false);
	// the subtree half carries the marker; ownSession is unaffected
	expect(lines[0]).toContain("cost≈$0.0123 (catalogue)");
	expect(lines[1]).toContain("cost=n/a");
	expect(lines.at(-1)).toBe("usage  n/a = provider figure unavailable");
	// absent provider (and explicit undefined) → no row, no legend, byte-identical
	const noProvider = formatUsageBlock({ record: measuredRecord });
	expect(formatUsageBlock({ record: measuredRecord, provider: undefined })).toBe(noProvider);
});

test("T-B4 (partial): unavailable with ≥1 reported → subtree cost=n/a AND legend AND the reported row", () => {
	const partial: ProviderCostReport = {
		status: "unavailable",
		reason: "fetch-failed:boom",
		totalCost: 0.01,
		generations: [
			providerGen({ generationId: "g1", totalCost: 0.01 }),
			providerGen({ generationId: "g2", status: "unavailable", reason: "timeout", providerName: null, totalCost: null }),
		],
	};
	const b = formatUsageBlock({ record: measuredRecord, provider: partial });
	const lines = b.split("\n");
	expect(lines).toHaveLength(5);
	expect(lines[1]).toContain("cost=n/a");
	expect(lines[3]).toBe("usage  reported  cost=$0.0100 (reported) routed=Infermaticx1");
	expect(lines.at(-1)).toBe("usage  n/a = provider figure unavailable");
});

test("T-B5 (≤160, C2): a wide multiset falls back to routed=(mixed; +K more); every line ≤160", () => {
	const names = Array.from({ length: 30 }, (_, i) => `provider-${i}`);
	const rep: ProviderCostReport = {
		status: "reported",
		totalCost: 0.03,
		generations: names.map((n, i) => providerGen({ generationId: `g${i}`, providerName: n, totalCost: 0.001 })),
	};
	const b = formatUsageBlock({ record: measuredRecord, provider: rep });
	for (const line of b.split("\n")) {
		expect([...line].length).toBeLessThanOrEqual(160);
	}
	const reported = b.split("\n").find((l) => l.startsWith("usage  reported"))!;
	expect(reported).toContain("routed=(mixed; +29 more)"); // K = distinct names − 1
	expect(reported).not.toContain("provider-"); // omitted names stay verbatim on the record, never in the row
});

test("T-B6 (regression): existing renders stay byte-identical with no provider input (T1/T3/T4/T5/T8/T10 asserted above run unchanged)", () => {
	// spot-pin the three whole-block states never gain a reported row or legend
	expect(formatUsageBlock({ record: zeroRecord, provider: providerReport() })).toBe("usage  no usage recorded");
	expect(formatUsageBlock({ record: unresolvedRecord, provider: providerReport() })).toBe(
		"usage  accounting boundary unresolved",
	);
	expect(formatUsageBlock({ failed: "x" })).toBe("usage  accounting failed \u2014 x");
});

// ---------------------------------------------------------------------------
// Task 5 (EV-32): the scanned-procedure stamp seam — spec §2.5 item 6 / PO
// effect 6: a null marker (stale/replaced session) emits the R-5 failure state
// synchronously and is never blank.
// ---------------------------------------------------------------------------

import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { stampProcedureInvocation } from "../extensions/index.ts";
import { SessionManager, type SessionEntry } from "@earendil-works/pi-coding-agent";
import type { PendingInvocation } from "../extensions/usage-store.ts";

const evSeed = () => ({
	role: "assistant",
	provider: "p",
	model: "m",
	api: "openai-completions",
	content: [{ type: "text", text: "seed" }],
	stopReason: "stop",
	timestamp: Date.now(),
	usage: { input: 1, output: 1, totalTokens: 2, cost: { total: 1 } },
});
const evShim = (sm: SessionManager) => ({ appendEntry: (customType: string, data?: unknown): void => { sm.appendCustomEntry(customType, data); } });
const evCtx = (sm: SessionManager) => ({ sessionManager: sm }) as never;

test("point-6: recordInvocationBoundary → null → synchronous 'usage  accounting failed — invocation boundary unresolvable', no pending push", () => {
	const sm = SessionManager.inMemory(fs.mkdtempSync(path.join(os.tmpdir(), "ev32-stamp-")));
	sm.appendMessage(evSeed() as never);
	const notes: Array<{ m: string; k: string }> = [];
	const pending: PendingInvocation[] = [];
	// no-op appendEntry → the post-append leaf is not the marker → fail closed
	stampProcedureInvocation({ appendEntry: () => {} }, evCtx(sm), "council", "run-X", pending, (m, k) => notes.push({ m, k }));
	expect(notes).toHaveLength(1);
	expect(notes[0]!.m).toBe("usage  accounting failed \u2014 invocation boundary unresolvable");
	expect(notes[0]!.k).toBe("warning");
	expect(pending).toHaveLength(0);
	// nothing observable landed in the session
	const markers = sm.getEntries().filter((e: SessionEntry) => (e as { customType?: string }).customType === "council-invocation");
	expect(markers).toHaveLength(0);
});

test("point-6: marker stamped → pending push carries the marker id and the marker's own `at` read back off the on-chain entry", () => {
	const sm = SessionManager.inMemory(fs.mkdtempSync(path.join(os.tmpdir(), "ev32-stamp-")));
	sm.appendMessage(evSeed() as never);
	const notes: string[] = [];
	const pending: PendingInvocation[] = [];
	stampProcedureInvocation(evShim(sm), evCtx(sm), "features-deliver", "run-X", pending, (m) => notes.push(m));
	expect(notes).toHaveLength(0); // no emission on the happy path
	expect(pending).toHaveLength(1);
	expect(pending[0]!.command).toBe("features-deliver");
	expect(pending[0]!.markerId === sm.getLeafId()).toBe(true);
	expect(pending[0]!.runId).toBe("run-X");
	expect(typeof pending[0]!.markerAt).toBe("number");
	// sessionFile is getSessionFile() ?? null — an in-memory session legitimately has none
	expect(pending[0]!.sessionFile).toBe(sm.getSessionFile() ?? null);
});

// ---------------------------------------------------------------------------
// Task 6 (EV-32): the /council-eval run path — steward A(c) marker mode, PO
// effect 3/7. Driven through the deps-injected runMatrix seam (no network).
// ---------------------------------------------------------------------------

import { registerCouncilEvalCommand } from "../extensions/index.ts";
import { initHubIdentity, getHub, shutdownHub } from "../extensions/hub-tools.ts";
import { flushPendingInvocations, readUsageRecords } from "../extensions/usage-store.ts";
import { ensureRunDir, writeManifest } from "../extensions/runs.ts";
import { listFixtureTasks } from "../extensions/eval-fixtures.ts";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";

interface EvalHarness {
	repoRoot: string;
	pending: PendingInvocation[];
	emitted: string[];
	notes: Array<{ m: string; k: string }>;
	sent: string[];
	handler: (args: string, ctx: ExtensionContext) => Promise<void>;
	sm: SessionManager;
	/** T-S5 (O-6): ordering log — the flush double's start/done markers and the
	 * handler's summary emission land in one shared stream. */
	eventLog: string[];
}

function evalHarness(): EvalHarness {
	const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), "ev32-eval-"));
	initHubIdentity("run-ev32");
	getHub(repoRoot);
	const sm = SessionManager.inMemory(fs.mkdtempSync(path.join(os.tmpdir(), "ev32-eval-sess-")));
	sm.appendMessage(evSeed() as never);
	let handler: (args: string, ctx: ExtensionContext) => Promise<void> = async () => {};
	const pi = {
		registerCommand: (name: string, def: { handler: (args: string, ctx: ExtensionContext) => Promise<void> }) => {
			if (name === "council-eval") handler = def.handler;
		},
		sendUserMessage: (text: string) => {
			sentRef.sent.push(text);
		},
		// the real appendEntry is synchronous (agent-session.js → appendCustomEntry)
		appendEntry: (customType: string, data?: unknown) => {
			sm.appendCustomEntry(customType, data);
		},
	} as unknown as ExtensionAPI;
	const sentRef: { sent: string[] } = { sent: [] };
	const pending: PendingInvocation[] = [];
	const emitted: string[] = [];
	const notes: Array<{ m: string; k: string }> = [];
	const eventLog: string[] = [];
	registerCouncilEvalCommand(pi, repoRoot, {
		runMatrix: async () => {
			// the double simulates the real run: cells settle with manifests
			ensureRunDir(repoRoot, "run-ev32");
			writeManifest(repoRoot, "run-ev32", {
				id: "job-eval-1", seat: "owner", model: "p/m", parentJobId: null, pid: null,
				sessionId: "job-eval-1", state: "done", startedAt: Date.now(), settledAt: null,
				exitCode: 0,
				usage: usageOf({ input: 30, output: 12, totalTokens: 42, cost: 0.42, turns: 2 }),
			});
			return { store: "", fixtureVersion: "1.0.0", rubricVersion: "1.0.0", summaries: [] };
		},
		pending,
		flushUsage: async (trigger, ctx) => {
			// T-S5 (O-6): the double is genuinely async — if the eval tail stops
			// awaiting, the summary outruns flush-done and this test goes red.
			eventLog.push("flush-start");
			await new Promise((r) => setTimeout(r, 25));
			eventLog.push("flush-done");
			const smm = ctx.sessionManager;
			const res = await flushPendingInvocations({
				repoRoot,
				entries: smm.getEntries(),
				leafId: smm.getLeafId(),
				sessionId: smm.getSessionId(),
				pending,
				trigger,
				notify: (m, k) => notes.push({ m, k }),
				storeRoot: evalStoreRoot,
			});
			pending.length = 0;
			pending.push(...res.remaining);
		},
		sink: (line) => {
			emitted.push(line);
			eventLog.push("summary");
		},
	});
	const sent = sentRef.sent;
	const ctx = {
		hasUI: false,
		sessionManager: sm,
		modelRegistry: { getAvailable: () => [{ provider: "p", id: "m" }] },
		mode: "headless",
	} as unknown as ExtensionContext;
	return { repoRoot, pending, emitted, notes, sent, handler, sm, eventLog };
}

let evalStoreRoot = "";

// hoisted store root shared by the harness closure above (set before handler runs)
function setEvalStoreRoot(dir: string): void {
	evalStoreRoot = dir;
}

test("T15: the eval run path stamps a marker, pushes boundaryMode:'marker', and emits exactly one block after the awaited matrix", async () => {
	const storeRoot = fs.mkdtempSync(path.join(os.tmpdir(), "ev32-eval-store-"));
	setEvalStoreRoot(storeRoot);
	const h = evalHarness();
	try {
		const task = listFixtureTasks(h.repoRoot)[0];
		expect(task).toBeTruthy();
		const messageEntriesBefore = h.sm.getEntries().filter((e: SessionEntry) => e.type === "message").length;
		await h.handler(`${task} p/m`, {
			hasUI: false,
			sessionManager: h.sm,
			modelRegistry: { getAvailable: () => [{ provider: "p", id: "m" }] },
			mode: "headless",
		} as unknown as ExtensionContext);

		// marker stamped on-chain, pending pushed with boundaryMode "marker"
		const markers = h.sm.getEntries().filter((e: SessionEntry) => (e as { customType?: string }).customType === "council-invocation");
		expect(markers).toHaveLength(1);
		expect((markers[0] as unknown as { data: { command: string } }).data.command).toBe("council-eval");
		expect(h.pending).toHaveLength(0); // written at the tail drain — no entry stays pending
		// exactly one emission per invocation, and it is the block
		expect(h.notes).toHaveLength(1);
		expect(h.notes[0]!.k).toBe("info");
		const [record] = readUsageRecords(evalStoreRoot);
		expect(h.notes[0]!.m).toBe(formatUsageBlock({ record: record!.spend }));
		// steward I: non-empty matrix → resolved boundary + real subtree
		expect(record!.spend.boundary.resolved).toBe(true);
		expect(record!.spend.boundary.firstEntryId).not.toBeNull();
		expect(record!.spend.boundary.jobCount).toBeGreaterThanOrEqual(1);
		expect(record!.spend.subtree.totalTokens).toBeGreaterThan(0);
		// the block landed BEFORE the summary in the concluding output
		expect(h.emitted.filter((l) => l.startsWith("[council-eval] confirmed")).length).toBe(1);
		// never sendUserMessage; the block is not in the session prose
		expect(h.sent).toHaveLength(0);
		expect(h.sm.getEntries().filter((e: SessionEntry) => e.type === "message").length).toBe(messageEntriesBefore);
		// the block text never appears in the sink (deterministic engine sinks only)
		expect(h.emitted.some((l) => l.startsWith("usage  "))).toBe(false);
	} finally {
		shutdownHub();
	}
});

test("T-S5 (O-6): the eval tail awaits the flush — flush-done lands before the summary, pending drained", async () => {
	const storeRoot = fs.mkdtempSync(path.join(os.tmpdir(), "ev32-eval-store-"));
	setEvalStoreRoot(storeRoot);
	const h = evalHarness();
	try {
		const task = listFixtureTasks(h.repoRoot)[0];
		expect(task).toBeTruthy();
		await h.handler(`${task} p/m`, {
			hasUI: false,
			sessionManager: h.sm,
			modelRegistry: { getAvailable: () => [{ provider: "p", id: "m" }] },
			mode: "headless",
		} as unknown as ExtensionContext);
		// the awaited tail observed the full async flush: start → done → summary.
		// The 50ms settle lets a hypothetical un-awaited flush finish landing
		// first — without it, an un-awaited tail's flush-done (index −1) would
		// vacuously pass the ordering check. This is the O-6 falsifier.
		await new Promise((r) => setTimeout(r, 60));
		expect(h.eventLog).toContain("flush-start");
		expect(h.eventLog.indexOf("flush-start")).toBeLessThan(h.eventLog.indexOf("flush-done"));
		expect(h.eventLog[h.eventLog.length - 1]).toBe("summary");
		expect(h.eventLog.indexOf("flush-done")).toBeLessThan(h.eventLog.lastIndexOf("summary"));
		// the flush drained: no pending entry survives the awaited tail
		expect(h.pending).toHaveLength(0);
		// and the flush's real body ran to completion — exactly one written block
		expect(h.notes).toHaveLength(1);
		expect(h.notes[0]!.k).toBe("info");
	} finally {
		shutdownHub();
	}
});

test("T15: the no-arg listing form stamps no marker and pushes nothing", async () => {
	const h = evalHarness();
	try {
		await h.handler("", {
			hasUI: false,
			sessionManager: h.sm,
			modelRegistry: { getAvailable: () => [] },
			mode: "headless",
		} as unknown as ExtensionContext);
		const markers = h.sm.getEntries().filter((e: SessionEntry) => (e as { customType?: string }).customType === "council-invocation");
		expect(markers).toHaveLength(0);
		expect(h.pending).toHaveLength(0);
		expect(h.notes).toHaveLength(0);
		expect(h.emitted.some((l) => l.includes("Available fixture tasks"))).toBe(true);
	} finally {
		shutdownHub();
	}
});

// ---- EV-39 Q4: the final-attempt-only conditional legend (spec §2.9) ----

test("EV-39 Q4: partial legend renders iff provider.partial present, after the reported row", () => {
	const provider = providerReport({ partial: "final-attempt-only" });
	const out = formatUsageBlock({ record: measuredRecord, provider });
	expect(out).toContain("usage  partial = reported figure is final-attempt-only");
	const lines = out.split("\n");
	const reportedIdx = lines.findIndex((l) => l.startsWith("usage  reported"));
	const partialIdx = lines.findIndex((l) => l.startsWith("usage  partial"));
	expect(partialIdx).toBeGreaterThan(reportedIdx);
	// absent partial → byte-identical to the pre-EV-39 render (no legend, no row)
	const plain = formatUsageBlock({ record: measuredRecord, provider: providerReport() });
	expect(formatUsageBlock({ record: measuredRecord, provider: { ...providerReport(), partial: undefined } })).toBe(plain);
	expect(plain).not.toContain("partial");
});
