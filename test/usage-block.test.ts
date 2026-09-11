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
