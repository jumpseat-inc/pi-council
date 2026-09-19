import { test, expect } from "bun:test";
import { createHash } from "node:crypto";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { CONFIG_DIR_NAME } from "@earendil-works/pi-coding-agent";
import { buildGateState, estimateTokens, GATE_SECTIONS } from "../extensions/gate-state.ts";
import type { ParsedCard } from "../extensions/gate-state.ts";

/** Synthetic repo tree: a repo-local gate policy carrying a large valid
 * budget (the budget never binds unless a test overrides it). Never the
 * real repo. */
export function tmpRepo(extraPolicy: Record<string, unknown> = {}): string {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "council-gate-state-"));
	const dir = path.join(root, CONFIG_DIR_NAME, "council", "gate");
	fs.mkdirSync(dir, { recursive: true });
	fs.writeFileSync(
		path.join(dir, "policy.json"),
		JSON.stringify({
			policyVersion: "p",
			mode: "off",
			model: "m",
			endpoint: "https://x/",
			gateStateBudgetTokens: 1000000,
			...extraPolicy,
		}),
	);
	return root;
}

export function makeCard(overrides: Partial<ParsedCard> = {}): ParsedCard {
	return {
		id: "EV-0",
		title: "Fix the gate packer",
		goal: "Pack gate state deterministically under budget",
		acceptance: "bytes identical across calls and drops recorded",
		touchedFiles: [{ path: "extensions/gate.ts", linesChanged: 12 }],
		...overrides,
	};
}

const parseState = (bytes: Uint8Array): Record<string, unknown> =>
	JSON.parse(Buffer.from(bytes).toString("utf8")) as Record<string, unknown>;

// ---------------------------------------------------------------------------
// Estimator (§4) — pinned by recompute, byte-based.
// ---------------------------------------------------------------------------

test("estimator is pinned by recompute: ceil(utf8 bytes / 3.5)", () => {
	expect(estimateTokens("hello")).toBe(2); // ceil(5 / 3.5)
	expect(estimateTokens("")).toBe(0);
	expect(estimateTokens(new TextEncoder().encode("hello"))).toBe(2);
});

test("CJK divergence fixture: the measure is byte-based, not char-based", () => {
	// 龘 is 3 UTF-8 bytes; 3 chars = 9 bytes → ceil(9/3.5) = 3 tokens.
	// A chars/4 estimator would say 1 — the byte-based measure per §4.
	expect(estimateTokens("龘".repeat(3))).toBe(3);
});

// ---------------------------------------------------------------------------
// Frame, card + touchedFiles packing (§2, §3, §7).
// ---------------------------------------------------------------------------

test("pack shape: five sections in declared order, card + sorted touchedFiles filled", () => {
	const root = tmpRepo();
	const state = buildGateState(
		makeCard({
			touchedFiles: [
				{ path: "extensions/gate.ts", linesChanged: 12 },
				{ path: "council/preflight.sh", linesChanged: 3 },
				{ path: "extensions/gate-state.ts", linesChanged: 400 },
			],
		}),
		root,
	);
	const parsed = parseState(state.stateBytes);
	expect(Object.keys(parsed)).toEqual([...GATE_SECTIONS]);
	expect(parsed.card).toEqual({ id: "EV-0", title: "Fix the gate packer", goal: "Pack gate state deterministically under budget", acceptance: "bytes identical across calls and drops recorded" });
	expect(parsed.touchedFiles).toEqual([
		{ path: "council/preflight.sh", linesChanged: 3 },
		{ path: "extensions/gate-state.ts", linesChanged: 400 },
		{ path: "extensions/gate.ts", linesChanged: 12 },
	]);
	expect(parsed.wiki).toEqual([]);
	expect(parsed.rulings).toEqual([]);
	expect(parsed.tests).toEqual([]);
	expect(estimateTokens(state.stateBytes)).toBeLessThanOrEqual(1000000);
});

test("byte/hash identity across repeated calls on a fixed tree", () => {
	const root = tmpRepo();
	const a = buildGateState(makeCard(), root);
	const b = buildGateState(makeCard(), root);
	expect(Buffer.compare(Buffer.from(a.stateBytes), Buffer.from(b.stateBytes))).toBe(0);
	expect(a.stateHash).toBe(b.stateHash);
});

test("hash single source: independent sha256 recompute equals the returned stateHash", () => {
	const root = tmpRepo();
	const state = buildGateState(makeCard(), root);
	expect(createHash("sha256").update(state.stateBytes).digest("hex")).toBe(state.stateHash);
});

test("touched-file canary: file contents never enter the state bytes; entries carry only path + linesChanged", () => {
	const root = tmpRepo();
	fs.mkdirSync(path.join(root, "extensions"), { recursive: true });
	fs.writeFileSync(path.join(root, "extensions", "gate.ts"), "// SENTRY-CONTENT-7f3a secrets live here\nexport {};\n");
	const state = buildGateState(makeCard({ touchedFiles: [{ path: "extensions/gate.ts", linesChanged: 2 }] }), root);
	const text = Buffer.from(state.stateBytes).toString("utf8");
	expect(text).not.toContain("SENTRY-CONTENT-7f3a");
	const parsed = parseState(state.stateBytes);
	expect(parsed.touchedFiles).toEqual([{ path: "extensions/gate.ts", linesChanged: 2 }]);
});

test("touched-file validation is loud and named: linesChanged must be a positive integer", () => {
	const root = tmpRepo();
	for (const bad of [0, -3, 1.5, "3", null]) {
		let msg = "";
		try {
			buildGateState(makeCard({ touchedFiles: [{ path: "extensions/gate.ts", linesChanged: bad as number }] }), root);
		} catch (e) {
			msg = (e as Error).message;
		}
		expect(msg).toContain("touchedFiles[0].linesChanged");
		expect(msg).not.toMatch(/\n/);
	}
});

test("touched-file validation is loud and named: path must be a non-empty string", () => {
	const root = tmpRepo();
	let msg = "";
	try {
		buildGateState(makeCard({ touchedFiles: [{ path: "  ", linesChanged: 1 }] }), root);
	} catch (e) {
		msg = (e as Error).message;
	}
	expect(msg).toContain("touchedFiles[0].path");
	expect(msg).not.toMatch(/\n/);
});

test("degenerate case: an over-budget card section truncates per field and stays non-empty; later sections are untouched", () => {
	const root = tmpRepo();
	const state = buildGateState(
		makeCard({ id: "EV-0", title: "t", goal: "G".repeat(40000) }), // ~11.4k tokens, over the 4000 card cap
		root,
	);
	const parsed = parseState(state.stateBytes);
	expect(parsed.card).toEqual({ id: "EV-0", title: "t" }); // field granularity, non-empty
	expect(state.drops[0]).toMatchObject({ section: "card", truncated: "cap", kept: 2 });
	expect(state.drops.find((d) => d.section === "touchedFiles")).toMatchObject({ truncated: false, kept: 1 });
	expect(parsed.touchedFiles).toEqual([{ path: "extensions/gate.ts", linesChanged: 12 }]);
	expect(estimateTokens(state.stateBytes)).toBeLessThanOrEqual(1000000);
});
