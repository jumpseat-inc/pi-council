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
	expect(pending[0]!.sessionFile !== null && pending[0]!.sessionFile !== undefined).toBe(true);
});
