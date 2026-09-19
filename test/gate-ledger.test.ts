import { test, expect } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { CONFIG_DIR_NAME } from "@earendil-works/pi-coding-agent";
import {
	GATE_LEDGER_SCHEMA_VERSION,
	appendGateCall,
	appendGateOutcome,
	gateLedgerPath,
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

test("a write failure throws naming the absolute target path", () => {
	const repo = tmpRepo();
	const target = path.join(repo, "blocked");
	fs.mkdirSync(target); // a directory as the target: append fails regardless of uid
	expect(() => appendGateCall(callInput(), repo, target)).toThrow(
		new RegExp(target.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
	);
});
