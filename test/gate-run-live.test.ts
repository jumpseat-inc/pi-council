// EV-65 live arm — real decisions calls against https://openrouter.ai/api/alpha/decisions.
// Requires network + OpenRouter key; skipped unless COUNCIL_INTEGRATION=1.
// Design-time expected wall clock ≈ 10s (two real calls + one 1ms-aborted
// probe); per-test ceiling 120_000ms — an emergency bound, never a budget
// (see vault/wiki/test-suite-budget.md, live-arm census).
import { test, expect } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import {
	GATE_ENDPOINT,
	GATE_PINNED_MODEL,
	loadGateDecision,
	loadGateQuestions,
	type GatePolicy,
	type GateQuestionSet,
} from "../extensions/gate.ts";
import type { GateState } from "../extensions/gate-state.ts";
import { gateLedgerPath } from "../extensions/gate-ledger.ts";
import { openRouterDecisionsTransport } from "../extensions/gate-transport.ts";
import { resolveOpenRouterApiKey } from "../extensions/provider-cost.ts";
import { runGate } from "../extensions/gate-run.ts";

const enabled = process.env.COUNCIL_INTEGRATION === "1";

function tmpRepo(): string {
	return fs.mkdtempSync(path.join(os.tmpdir(), "ev65-live-"));
}

const livePolicy = (mode: GatePolicy["mode"]): GatePolicy => ({
	policyVersion: "live-policy-1",
	mode,
	model: GATE_PINNED_MODEL,
	endpoint: GATE_ENDPOINT,
	gateStateBudgetTokens: 32000,
});

const STATE: GateState = {
	stateBytes: new TextEncoder().encode(JSON.stringify({ card: { id: "EV-65-live", title: "live probe" } })),
	stateHash: "sha256:live-probe",
	drops: [],
};

test.skipIf(!enabled)(
	"live: one real decisions call — versioned reportedModel, usage present, exactly one v2 line",
	async () => {
		const key = resolveOpenRouterApiKey();
		expect(key).not.toBeNull();
		const repo = tmpRepo();
		const r = await runGate(STATE, loadGateQuestions(repo), {
			repoRoot: repo,
			policy: livePolicy("advisory"),
			decisionPolicy: loadGateDecision(repo),
			transport: openRouterDecisionsTransport(key!),
			apiKey: key!,
		});
		expect(r.status).toBe("ok");
		expect(r.reportedModel).toMatch(/^typesafe\/jev-1\.13-/);
		const lines = fs.readFileSync(gateLedgerPath(repo), "utf-8").split("\n").filter((l) => l !== "");
		expect(lines.length).toBe(1);
		const parsed = JSON.parse(lines[0]!);
		expect(parsed.schemaVersion).toBe(2);
		expect(parsed.kind).toBe("call");
		expect(parsed.model).toMatch(/^typesafe\/jev-1\.13-/);
		expect(parsed.usage.input_tokens).toBeGreaterThan(0);
		expect(typeof parsed.usage.cost).toBe("number");
		expect(parsed.generationId).toMatch(/^gen-dec-/);
		expect(parsed.advisory).toBe(true);
		expect(parsed.failure).toBeUndefined();
		expect(typeof parsed.basis).toBe("string");
	},
	120_000,
);

test.skipIf(!enabled)("live: timeoutMs 1 → fail-closed timeout, one line, zero answers", async () => {
	const key = resolveOpenRouterApiKey();
	expect(key).not.toBeNull();
	const repo = tmpRepo();
	const r = await runGate(STATE, loadGateQuestions(repo), {
		repoRoot: repo,
		policy: livePolicy("advisory"),
		decisionPolicy: loadGateDecision(repo),
		transport: openRouterDecisionsTransport(key!),
		apiKey: key!,
		timeoutMs: 1,
	});
	expect(r.status).toBe("failed");
	expect(r.failure?.kind).toBe("timeout");
	expect(r.failure?.reason).toBe("timeout after 1ms");
	expect(r.decision.mode).toBe("Deliberate");
	const lines = fs.readFileSync(gateLedgerPath(repo), "utf-8").split("\n").filter((l) => l !== "");
	expect(lines.length).toBe(1);
	expect(JSON.parse(lines[0]!).failure).toEqual({ class: "timeout" });
}, 120_000);

test.skipIf(!enabled)(
	"live: pole semantics — P(true) ≡ P(yes): a trivially-true noul statement returns a high probability",
	async () => {
		const key = resolveOpenRouterApiKey();
		expect(key).not.toBeNull();
		const repo = tmpRepo();
		const questions: GateQuestionSet = {
			version: "qs-pole-probe",
			questions: {
				twoPlusTwo: {
					type: "noul",
					instructions: "What is the probability that the statement '2 + 2 equals 4' is true?",
					criteria: { yes: "2 + 2 equals 4.", no: "2 + 2 does not equal 4." },
				},
			},
		};
		const r = await runGate(STATE, questions, {
			repoRoot: repo,
			policy: livePolicy("advisory"),
			decisionPolicy: loadGateDecision(repo),
			transport: openRouterDecisionsTransport(key!),
			apiKey: key!,
		});
		expect(r.status).toBe("ok");
		const parsed = JSON.parse(fs.readFileSync(gateLedgerPath(repo), "utf-8").trim());
		// The wire carries P(true); the policy token is "yes". A high
		// probability for the trivially-true statement confirms the answer's
		// probability names the yes/true pole (the live-capture convention).
		expect((parsed.answers.twoPlusTwo as { probability: number }).probability).toBeGreaterThan(0.9);
	},
	120_000,
);
