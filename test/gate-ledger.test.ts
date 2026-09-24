import { test, expect } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { CONFIG_DIR_NAME } from "@earendil-works/pi-coding-agent";
import { srcPin } from "./src-pin.ts";
import {
	GATE_LEDGER_SCHEMA_VERSION,
	appendGateCall,
	appendGateOutcome,
	gateLedgerPath,
	readGateLedger,
	rederiveResolvedMode,
	type DecideFn,
} from "../extensions/gate-ledger.ts";

function tmpRepo(): string {
	return fs.mkdtempSync(path.join(os.tmpdir(), "ev61-repo-"));
}

function callInput(over: Partial<Parameters<typeof appendGateCall>[0]> = {}) {
	return {
		stateHash: "sha256:abc123",
		questionSetVersion: "qs-v1",
		questionIds: ["q-oneway", "q-blast"],
		answers: {
			"q-oneway": { type: "choice", value: "no", probabilities: { yes: 0.1, no: 0.9 }, confidence: 0.92 },
		},
		resolvedMode: "Deliberate",
		policyVersion: "policy-v3",
		...over,
	};
}

// ---------------------------------------------------------------------------
// Task 1: record schema + append-only writer
// ---------------------------------------------------------------------------

test("appendGateCall writes exactly one JSON line carrying the goal's fields", () => {
	const repo = tmpRepo();
	const rec = appendGateCall(callInput(), repo);
	const lines = fs.readFileSync(gateLedgerPath(repo), "utf-8").split("\n").filter((l) => l !== "");
	expect(lines.length).toBe(1);
	const parsed = JSON.parse(lines[0]!);
	expect(parsed.schemaVersion).toBe(GATE_LEDGER_SCHEMA_VERSION);
	expect(parsed.kind).toBe("call");
	expect(parsed.callId).toBe(rec.callId);
	expect(parsed.stateHash).toBe("sha256:abc123");
	expect(parsed.questionSetVersion).toBe("qs-v1");
	expect(parsed.resolvedMode).toBe("Deliberate");
	expect(parsed.policyVersion).toBe("policy-v3");
	expect(typeof parsed.recordedAt).toBe("string");
});

test("answers are stored verbatim — probabilities and confidence byte-equal", () => {
	const repo = tmpRepo();
	appendGateCall(callInput(), repo);
	const parsed = JSON.parse(fs.readFileSync(gateLedgerPath(repo), "utf-8").trim());
	expect(parsed.answers["q-oneway"]).toEqual({
		type: "choice",
		value: "no",
		probabilities: { yes: 0.1, no: 0.9 },
		confidence: 0.92,
	});
});

test("an asked-but-unanswered question is recorded as null (absent), never a zero", () => {
	const repo = tmpRepo();
	appendGateCall(callInput(), repo);
	const raw = fs.readFileSync(gateLedgerPath(repo), "utf-8");
	expect(raw).toContain(`"q-blast":null`);
	const parsed = JSON.parse(raw.trim());
	expect(parsed.answers["q-blast"]).toBe(null);
	expect(parsed.answers["q-blast"]).not.toBe(0);
});

test("two appends produce two lines, appended never rewritten", () => {
	const repo = tmpRepo();
	appendGateCall(callInput({ stateHash: "s1" }), repo);
	appendGateCall(callInput({ stateHash: "s2" }), repo);
	const lines = fs.readFileSync(gateLedgerPath(repo), "utf-8").split("\n").filter((l) => l !== "");
	expect(lines.length).toBe(2);
	expect(JSON.parse(lines[0]!).stateHash).toBe("s1");
	expect(JSON.parse(lines[1]!).stateHash).toBe("s2");
});

test("gateLedgerPath derives from CONFIG_DIR_NAME, never a hardcoded .pi", () => {
	const repo = tmpRepo();
	expect(gateLedgerPath(repo)).toBe(path.join(repo, CONFIG_DIR_NAME, "council", "gate-ledger.jsonl"));
});

// ---------------------------------------------------------------------------
// Task 2: tolerant reader + re-derivation seam
// ---------------------------------------------------------------------------

/** A stand-in for EV-63's pure decide(): floors confidence, escalates nulls.
 * Respects the transport's type shapes — a `noul` answer carries no
 * `confidence` field by design (it faces the policy's noul threshold, not a
 * floor), so only types that report one are floored. */
const floorDecide: DecideFn = (answers) => {
	const list = Object.values(answers);
	if (list.some((a) => a === null)) return "Deliberate";
	for (const a of list) {
		if (a!.type === "noul") continue; // no confidence to floor; threshold test is EV-63's
		if (typeof a!.confidence !== "number") throw new Error("answer missing confidence");
		if (a!.confidence < 0.7) return "Deliberate";
	}
	return "Verify";
};

test("two calls with the same stateHash and policyVersion re-derive the identical resolvedMode", () => {
	const repo = tmpRepo();
	const answers = {
		"q-reversible": { type: "choice", value: "yes", probabilities: { yes: 0.95, no: 0.05 }, confidence: 0.9 },
		"q-noul": { type: "noul", probability: 0.02 },
	};
	for (const stateHash of ["s-1", "s-1"]) {
		appendGateCall(callInput({ stateHash, questionIds: ["q-reversible", "q-noul"], answers, resolvedMode: "Verify" }), repo);
	}
	const { calls } = readGateLedger(repo);
	expect(calls.length).toBe(2);
	const modes = calls.map((c) => rederiveResolvedMode(c, floorDecide));
	expect(modes[0]).toBe(modes[1]);
	expect(modes[0]).toBe(calls[0]!.resolvedMode);
});

test("a recorded call's mode is re-derivable from the committed file alone, offline", () => {
	const repo = tmpRepo();
	appendGateCall(
		callInput({
			answers: { "q-x": { type: "choice", value: "yes", probabilities: { yes: 0.9, no: 0.1 }, confidence: 0.95 } },
			questionIds: ["q-x"],
			resolvedMode: "Verify",
		}),
		repo,
	);
	const { calls } = readGateLedger(repo);
	expect(rederiveResolvedMode(calls[0]!, floorDecide)).toBe("Verify");
});

test("the line alone suffices: stripping confidence from a stored line breaks re-derivation", () => {
	const repo = tmpRepo();
	appendGateCall(
		callInput({
			questionIds: ["q-x"],
			answers: { "q-x": { type: "choice", value: "yes", probabilities: { yes: 0.9, no: 0.1 }, confidence: 0.95 } },
		}),
		repo,
	);
	const parsed = JSON.parse(fs.readFileSync(gateLedgerPath(repo), "utf-8").trim());
	delete parsed.answers["q-x"].confidence;
	expect(() => rederiveResolvedMode(parsed as never, floorDecide)).toThrow(/missing confidence/);
});

test("a null (absent) answer re-derives to Deliberate through the seam", () => {
	const repo = tmpRepo();
	appendGateCall(callInput(), repo); // q-blast has no answer → null
	const { calls } = readGateLedger(repo);
	expect(rederiveResolvedMode(calls[0]!, floorDecide)).toBe("Deliberate");
});

test("an outcome joins its call as a follow-on line; the call line is never rewritten", () => {
	const repo = tmpRepo();
	const rec = appendGateCall(callInput(), repo);
	const before = fs.readFileSync(gateLedgerPath(repo), "utf-8");
	appendGateOutcome({ callId: rec.callId, outcome: { cardId: "EV-9", landed: true } }, repo);
	const after = fs.readFileSync(gateLedgerPath(repo), "utf-8");
	expect(after.startsWith(before)).toBe(true); // append-only: the call line is byte-frozen
	const { calls } = readGateLedger(repo);
	expect(calls[0]!.outcome).toEqual({ cardId: "EV-9", landed: true });
});

test("an orphan outcome is tolerated and reported, never fatal", () => {
	const repo = tmpRepo();
	appendGateOutcome({ callId: "no-such-call", outcome: { x: 1 } }, repo);
	const { calls, orphanOutcomes } = readGateLedger(repo);
	expect(calls).toEqual([]);
	expect(orphanOutcomes.length).toBe(1);
	expect(orphanOutcomes[0]!.outcome).toEqual({ x: 1 });
});

test("the reader tolerates a torn trailing line, a blank line, and an unknown kind", () => {
	const repo = tmpRepo();
	appendGateCall(callInput(), repo);
	fs.appendFileSync(gateLedgerPath(repo), "\n");
	fs.appendFileSync(gateLedgerPath(repo), JSON.stringify({ schemaVersion: 99, kind: "future-thing" }) + "\n");
	fs.appendFileSync(gateLedgerPath(repo), '{"kind":"call","callId":"torn"'); // no newline, mid-write tail
	const { calls, orphanOutcomes } = readGateLedger(repo);
	expect(calls.length).toBe(1);
	expect(orphanOutcomes).toEqual([]);
});

test("readGateLedger of a missing file is empty, never a throw", () => {
	const repo = tmpRepo();
	expect(readGateLedger(repo)).toEqual({ calls: [], orphanOutcomes: [] });
});

test("a write failure throws naming the absolute target path", () => {
	const repo = tmpRepo();
	const target = path.join(repo, "blocked");
	fs.mkdirSync(target); // a directory as the target: append fails regardless of uid
	expect(() => appendGateCall(callInput(), repo, target)).toThrow(
		new RegExp(target.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
	);
});

// ---------------------------------------------------------------------------
// Task 3: reader discipline + no-network source pins
// ---------------------------------------------------------------------------

test("the reader never reads the pruned run directory and performs no network call", () => {
	const moduleUrl = fileURLToPath(import.meta.resolve("../extensions/gate-ledger.ts"));
	const source = fs.readFileSync(moduleUrl, "utf-8");
	// Run-directory discipline: no run-substrate accessors, no runs/ references.
	expect(source).not.toContain("./runs.ts");
	expect(source).not.toContain("runsDir");
	expect(source).not.toContain("readManifests");
	expect(source).not.toContain("pruneRuns");
	expect(source).not.toContain("runs/");
	// No network anywhere in the module.
	expect(source).not.toContain("fetch(");
	expect(source).not.toContain("openrouter");
	// No hardcoded .pi — the config dir comes from the package. Quote-agnostic
	// canary (FLLWUP-116): reds on BOTH quote styles (and accepted near-miss
	// bytes like x".pi'y) — see test/src-pin.ts
	expect(srcPin(source)).not.toContain(srcPin('".pi"'));
});

test("the module's imports are exactly the stdlib plus the pi-coding-agent package", () => {
	const moduleUrl = fileURLToPath(import.meta.resolve("../extensions/gate-ledger.ts"));
	const source = fs.readFileSync(moduleUrl, "utf-8");
	const imports = [...source.matchAll(/(?:^|\n)import\s[^;]*from\s*"([^"]+)";/g)].map((m) => m[1]);
	expect(imports.sort()).toEqual([
		"@earendil-works/pi-coding-agent",
		"node:crypto",
		"node:fs",
		"node:path",
	]);
});
