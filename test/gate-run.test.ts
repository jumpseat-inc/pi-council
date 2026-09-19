// EV-65 — offline tests for runGate's one-call orchestration. Every test
// injects a transport double and an explicit apiKey over a mkdtemp repoRoot:
// no network, no timers, never the real repo. The live arm lives in
// test/gate-run-live.test.ts behind COUNCIL_INTEGRATION=1.
import { test, expect } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { CONFIG_DIR_NAME } from "@earendil-works/pi-coding-agent";
import {
	GATE_ENDPOINT,
	GATE_PINNED_MODEL,
	MODE_PANELS,
	decide,
	loadGateDecision,
	loadGateQuestions,
	type GateDecisionPolicy,
	type GatePolicy,
	type GateQuestionSet,
} from "../extensions/gate.ts";
import type { GateState } from "../extensions/gate-state.ts";
import {
	GATE_LEDGER_SCHEMA_VERSION,
	gateLedgerPath,
	readGateLedger,
	rederiveResolvedMode,
} from "../extensions/gate-ledger.ts";
import { GATE_REFUSAL_MARKER, type GateTransport } from "../extensions/gate-transport.ts";
import { runGate } from "../extensions/gate-run.ts";

// ---------------------------------------------------------------------------
// Fixtures — the packaged vocabulary, a fake packed state, doubles
// ---------------------------------------------------------------------------

function tmpRepo(): string {
	return fs.mkdtempSync(path.join(os.tmpdir(), "ev65-repo-"));
}

const POLICY: GatePolicy = {
	policyVersion: "test-policy-1",
	mode: "active",
	model: GATE_PINNED_MODEL,
	endpoint: "https://gate.test/api/alpha/decisions",
	gateStateBudgetTokens: 32000,
};

const QUESTIONS: GateQuestionSet = {
	version: "qs-test-1",
	questions: {
		reversible: { type: "noul", instructions: "Reversible?", criteria: { yes: "cheap revert", no: "one-way door" } },
		publicContract: { type: "noul", instructions: "Public contract?", criteria: { yes: "public", no: "internal" } },
		blastRadius: { type: "noul", instructions: "Blast radius?", criteria: { yes: "crosses modules", no: "contained" } },
		decidablyTestable: {
			type: "choice",
			instructions: "Testable?",
			criteria: { yes: "a test decides", no: "judgment required" },
		},
	},
};

const STATE: GateState = {
	stateBytes: new TextEncoder().encode(JSON.stringify({ card: { id: "EV-65", title: "t" } })),
	stateHash: "sha256:fake-state-hash",
	drops: [{ section: "card", truncated: false, kept: 2, measuredTokens: 120 }],
};

/** Live-capture response shape (card Intent): answers keyed by question id,
 * usage, provider, a gen-dec- generation id, and the versioned model. */
const SUCCESS_BODY = JSON.stringify({
	model: "typesafe/jev-1.13-20260917",
	answers: {
		reversible: { type: "noul", probability: 0.9 },
		publicContract: { type: "noul", probability: 0.2 },
		blastRadius: { type: "noul", probability: 0.15 },
		decidablyTestable: { type: "choice", value: "yes", probabilities: { yes: 0.93, no: 0.07 }, confidence: 0.91 },
	},
	usage: { input_tokens: 1200, output_tokens: 90, cost: 0.0031 },
	provider: "Typesafe",
	id: "gen-dec-abc123",
});

const REFUSAL_BODY = `typesafe/jev-1.13 ${GATE_REFUSAL_MARKER}. Use the /api/alpha/decisions endpoint instead.`;

interface Capture {
	url: string;
	headers: Record<string, string>;
	body: unknown;
	timeoutMs: number;
}

const okDouble = (body: string, capture: Capture[]): GateTransport => async (req) => {
	capture.push(req);
	return { ok: true, status: 200, body };
};
const failResponse = (f: { ok: false; kind: "timeout"; message: string } | { ok: false; kind: "network"; message: string } | { ok: false; kind: "http-error"; status: number; body: string }): GateTransport => async (req) => {
	void req;
	return f;
};

function readLedgerLines(repo: string, ledgerPath?: string): string[] {
	const file = ledgerPath ?? gateLedgerPath(repo);
	if (!fs.existsSync(file)) return [];
	return fs.readFileSync(file, "utf-8").split("\n").filter((l) => l !== "");
}

function decisionPolicyFor(repo: string): GateDecisionPolicy {
	return loadGateDecision(repo); // no repo-local file → the packaged default
}

function rederiveFn(dp: GateDecisionPolicy) {
	return (answers: Record<string, unknown>, _policyVersion: string) => decide(answers as never, dp).mode;
}

// ---------------------------------------------------------------------------
// Success path
// ---------------------------------------------------------------------------

test("success: exactly one POST to policy.endpoint, pinned model, body keys exactly {model,state,questions}", async () => {
	const repo = tmpRepo();
	const capture: Capture[] = [];
	const r = await runGate(STATE, QUESTIONS, {
		repoRoot: repo,
		policy: POLICY,
		decisionPolicy: decisionPolicyFor(repo),
		transport: okDouble(SUCCESS_BODY, capture),
		apiKey: "k-test",
	});
	expect(r.status).toBe("ok");
	expect(capture.length).toBe(1);
	expect(capture[0]!.url).toBe(POLICY.endpoint);
	expect(capture[0]!.timeoutMs).toBe(120_000);
	expect(Object.keys(capture[0]!.body as Record<string, unknown>).sort()).toEqual(["model", "questions", "state"]);
	expect((capture[0]!.body as Record<string, unknown>).model).toBe(GATE_PINNED_MODEL);
});

test("success: the noul bijection rides the wire (yes→true, no→false); choice labels pass through", async () => {
	const repo = tmpRepo();
	const capture: Capture[] = [];
	await runGate(STATE, QUESTIONS, {
		repoRoot: repo,
		policy: POLICY,
		decisionPolicy: decisionPolicyFor(repo),
		transport: okDouble(SUCCESS_BODY, capture),
		apiKey: "k-test",
	});
	const wire = (capture[0]!.body as Record<string, unknown>).questions as Record<string, Record<string, unknown>>;
	expect(wire.reversible!.criteria).toEqual({ true: "cheap revert", false: "one-way door" });
	expect(wire.blastRadius!.criteria).toEqual({ true: "crosses modules", false: "contained" });
	expect(wire.decidablyTestable!.criteria).toEqual({ yes: "a test decides", no: "judgment required" });
});

test("success: the state is embedded as the JSON value decoded from stateBytes", async () => {
	const repo = tmpRepo();
	const capture: Capture[] = [];
	await runGate(STATE, QUESTIONS, {
		repoRoot: repo,
		policy: POLICY,
		decisionPolicy: decisionPolicyFor(repo),
		transport: okDouble(SUCCESS_BODY, capture),
		apiKey: "k-test",
	});
	const body = capture[0]!.body as Record<string, unknown>;
	expect(body.model).toBe(GATE_PINNED_MODEL);
	expect(body.state).toEqual(JSON.parse(new TextDecoder().decode(STATE.stateBytes)));
});

test("success: exactly ONE v2 call line carrying the full union — no outcome line, no failure field", async () => {
	const repo = tmpRepo();
	const capture: Capture[] = [];
	await runGate(STATE, QUESTIONS, {
		repoRoot: repo,
		policy: POLICY,
		decisionPolicy: decisionPolicyFor(repo),
		transport: okDouble(SUCCESS_BODY, capture),
		apiKey: "k-test",
	});
	const lines = readLedgerLines(repo);
	expect(lines.length).toBe(1);
	const parsed = JSON.parse(lines[0]!);
	expect(parsed.schemaVersion).toBe(GATE_LEDGER_SCHEMA_VERSION);
	expect(parsed.schemaVersion).toBe(2);
	expect(parsed.kind).toBe("call");
	expect(parsed.stateHash).toBe(STATE.stateHash);
	expect(parsed.questionSetVersion).toBe("qs-test-1");
	expect(parsed.policyVersion).toBe("test-policy-1");
	expect(parsed.basis).toBe(decide(JSON.parse(JSON.stringify({
		reversible: { type: "noul", probability: 0.9 },
		publicContract: { type: "noul", probability: 0.2 },
		blastRadius: { type: "noul", probability: 0.15 },
		decidablyTestable: { type: "choice", value: "yes", probabilities: { yes: 0.93, no: 0.07 }, confidence: 0.91 },
	})), decisionPolicyFor(repo)).basis);
	expect(parsed.model).toBe("typesafe/jev-1.13-20260917");
	expect(parsed.provider).toBe("Typesafe");
	expect(parsed.usage).toEqual({ input_tokens: 1200, output_tokens: 90, cost: 0.0031 });
	expect(parsed.generationId).toBe("gen-dec-abc123");
	expect(parsed.drops).toEqual(STATE.drops);
	expect(parsed.advisory).toBe(false); // policy.mode is active
	expect(parsed.unknownAnswerIds).toEqual([]);
	expect(parsed.failure).toBeUndefined();
	expect(lines.join("\n")).not.toContain('"kind":"outcome"');
});

test("success: rederiveResolvedMode over the recorded line equals the recorded mode (packaged decision policy)", async () => {
	const repo = tmpRepo();
	const dp = decisionPolicyFor(repo);
	const capture: Capture[] = [];
	await runGate(STATE, QUESTIONS, {
		repoRoot: repo,
		policy: POLICY,
		decisionPolicy: dp,
		transport: okDouble(SUCCESS_BODY, capture),
		apiKey: "k-test",
	});
	const { calls } = readGateLedger(repo);
	expect(calls.length).toBe(1);
	expect(rederiveResolvedMode(calls[0]!, rederiveFn(dp))).toBe(calls[0]!.resolvedMode);
});

test("success: an unanswered question is null in the record and ABSENT from decide() input — never a negative", async () => {
	const repo = tmpRepo();
	const dp = decisionPolicyFor(repo);
	const partial = JSON.stringify({
		model: "typesafe/jev-1.13-20260917",
		answers: {
			reversible: { type: "noul", probability: 0.9 },
			decidablyTestable: { type: "choice", value: "yes", probabilities: { yes: 0.93, no: 0.07 }, confidence: 0.91 },
		},
		usage: { input_tokens: 800, output_tokens: 60, cost: 0.002 },
		provider: "Typesafe",
		id: "gen-dec-partial",
	});
	const capture: Capture[] = [];
	const r = await runGate(STATE, QUESTIONS, {
		repoRoot: repo,
		policy: POLICY,
		decisionPolicy: dp,
		transport: okDouble(partial, capture),
		apiKey: "k-test",
	});
	const parsed = JSON.parse(readLedgerLines(repo)[0]!);
	expect(parsed.answers.blastRadius).toBeNull();
	expect(parsed.answers.publicContract).toBeNull();
	// decide() saw only the two answered ids: composite 0.9 + 0.93 = 1.83 < verify 2.6.
	// A coerced negative for blastRadius (mechanical "no") would push composite ≥ 2.6 → Verify.
	const expected = decide(
		{
			reversible: { type: "noul", probability: 0.9 },
			decidablyTestable: { type: "choice", value: "yes", probabilities: { yes: 0.93, no: 0.07 }, confidence: 0.91 },
		},
		dp,
	);
	expect(r.decision.mode).toBe(expected.mode);
	expect(r.decision.basis).toBe(expected.basis);
	expect(parsed.resolvedMode).toBe(expected.mode);
	expect(parsed.basis).toBe(expected.basis);
});

test("success: unknown response ids are dropped from the answers and recorded as unknownAnswerIds", async () => {
	const repo = tmpRepo();
	const body = JSON.stringify({
		...JSON.parse(SUCCESS_BODY),
		answers: { ...JSON.parse(SUCCESS_BODY).answers, extraNotAsked: { type: "noul", probability: 0.5 } },
	});
	const capture: Capture[] = [];
	await runGate(STATE, QUESTIONS, {
		repoRoot: repo,
		policy: POLICY,
		decisionPolicy: decisionPolicyFor(repo),
		transport: okDouble(body, capture),
		apiKey: "k-test",
	});
	const parsed = JSON.parse(readLedgerLines(repo)[0]!);
	expect(parsed.answers.extraNotAsked).toBeUndefined();
	expect(parsed.unknownAnswerIds).toEqual(["extraNotAsked"]);
});

test("success: model drift is recorded on the line and returned structurally", async () => {
	const repo = tmpRepo();
	const body = JSON.stringify({ ...JSON.parse(SUCCESS_BODY), model: "typesafe/jev-1.13-99990101" });
	const capture: Capture[] = [];
	const r = await runGate(STATE, QUESTIONS, {
		repoRoot: repo,
		policy: POLICY,
		decisionPolicy: decisionPolicyFor(repo),
		transport: okDouble(body, capture),
		apiKey: "k-test",
	});
	expect(r.reportedModel).toBe("typesafe/jev-1.13-99990101");
	expect(r.modelDrift).toEqual({ pinned: GATE_PINNED_MODEL, reported: "typesafe/jev-1.13-99990101" });
	expect(JSON.parse(readLedgerLines(repo)[0]!).model).toBe("typesafe/jev-1.13-99990101");
});

test("advisory mode marks the call line advisory: true; injectable now, callId, and ledgerPath all land", async () => {
	const repo = tmpRepo();
	const customLedger = path.join(repo, "custom", "ledger.jsonl");
	const capture: Capture[] = [];
	await runGate(STATE, QUESTIONS, {
		repoRoot: repo,
		policy: { ...POLICY, mode: "advisory" },
		decisionPolicy: decisionPolicyFor(repo),
		transport: okDouble(SUCCESS_BODY, capture),
		apiKey: "k-test",
		now: () => "2026-09-20T00:00:00.000Z",
		callId: "test-call-1",
		ledgerPath: customLedger,
	});
	expect(readLedgerLines(repo).length).toBe(0); // nothing on the default path
	const lines = readLedgerLines(repo, customLedger);
	expect(lines.length).toBe(1);
	const parsed = JSON.parse(lines[0]!);
	expect(parsed.advisory).toBe(true);
	expect(parsed.callId).toBe("test-call-1");
	expect(parsed.recordedAt).toBe("2026-09-20T00:00:00.000Z");
});

// ---------------------------------------------------------------------------
// Failure doubles — fail-closed Deliberate, one line, verbatim reason once
// ---------------------------------------------------------------------------

const refusalReason = `HTTP 400: ${REFUSAL_BODY}`;

for (const [label, transport, expectedClass, reason] of [
	[
		"refusal 400",
		failResponse({ ok: false, kind: "http-error", status: 400, body: REFUSAL_BODY }),
		"http-400-refusal",
		refusalReason,
	],
	[
		"timeout",
		failResponse({ ok: false, kind: "timeout", message: "timeout after 120000ms" }),
		"timeout",
		"timeout after 120000ms",
	],
	[
		"503",
		failResponse({ ok: false, kind: "http-error", status: 503, body: "upstream unavailable" }),
		"http-503",
		"HTTP 503: upstream unavailable",
	],
] as [string, GateTransport, string, string][]) {
	test(`${label}: Deliberate + full panel + one v2 line with basis carrying the verbatim reason EXACTLY once`, async () => {
		const repo = tmpRepo();
		const dp = decisionPolicyFor(repo);
		const capture: Capture[] = [];
		const counting: GateTransport = async (req) => {
			capture.push(req);
			return transport(req);
		};
		const r = await runGate(STATE, QUESTIONS, {
			repoRoot: repo,
			policy: POLICY,
			decisionPolicy: dp,
			transport: counting,
			apiKey: "k-test",
		});
		// Exactly one POST — no retry, no fallback.
		expect(capture.length).toBe(1);
		expect(r.status).toBe("failed");
		expect(r.failure).toEqual({ kind: expectedClass, reason });
		expect(r.decision.mode).toBe("Deliberate");
		expect(r.decision.include).toEqual(MODE_PANELS.Deliberate);
		const lines = readLedgerLines(repo);
		expect(lines.length).toBe(1); // exactly one ledger line — no outcome line
		const raw = lines[0]!;
		const parsed = JSON.parse(raw);
		expect(parsed.kind).toBe("call");
		expect(parsed.schemaVersion).toBe(2);
		expect(parsed.resolvedMode).toBe("Deliberate");
		expect(parsed.basis).toBe(`gate call failed: ${reason}`);
		// The verbatim reason occurs exactly once in the record (no failure.reason field).
		expect(raw.split(reason).length - 1).toBe(1);
		expect(parsed.failure).toEqual({ class: expectedClass });
		expect("reason" in parsed.failure).toBe(false);
		// All asked ids null; drops still ride the line.
		for (const id of Object.keys(QUESTIONS.questions)) expect(parsed.answers[id]).toBeNull();
		expect(parsed.drops).toEqual(STATE.drops);
		// EV-67's pinned render byte-joins: "Mode: " + mode + " — " + basis.
		expect(`Mode: ${parsed.resolvedMode} — ${parsed.basis}`).toBe(`Mode: Deliberate — gate call failed: ${reason}`);
		// Failed-call re-derivation (packaged policy, verify 2.6): Deliberate from the line alone.
		expect(rederiveResolvedMode(parsed, rederiveFn(dp))).toBe("Deliberate");
	});
}

test("2xx garbage → invalid-response → Deliberate catch-all, one line", async () => {
	const repo = tmpRepo();
	const dp = decisionPolicyFor(repo);
	const capture: Capture[] = [];
	const counting: GateTransport = async (req) => {
		capture.push(req);
		return { ok: true, status: 200, body: "not json at all" };
	};
	const r = await runGate(STATE, QUESTIONS, {
		repoRoot: repo,
		policy: POLICY,
		decisionPolicy: dp,
		transport: counting,
		apiKey: "k-test",
	});
	expect(capture.length).toBe(1);
	expect(r.status).toBe("failed");
	expect(r.failure?.kind).toBe("invalid-response");
	expect(r.decision.mode).toBe("Deliberate");
	const lines = readLedgerLines(repo);
	expect(lines.length).toBe(1);
	const parsed = JSON.parse(lines[0]!);
	expect(parsed.failure).toEqual({ class: "invalid-response" });
	expect(parsed.resolvedMode).toBe("Deliberate");
	expect(parsed.basis.startsWith("gate call failed: ")).toBe(true);
});

test("a 2xx body whose answers decide() rejects also lands in invalid-response (catch-all)", async () => {
	const repo = tmpRepo();
	const body = JSON.stringify({
		model: "typesafe/jev-1.13-20260917",
		answers: { reversible: { type: "choice", value: "yes", probabilities: { yes: 0.9, no: 0.1 } } }, // no confidence → decide() throws
		usage: { input_tokens: 10, output_tokens: 5, cost: 0.0001 },
		provider: "Typesafe",
		id: "gen-dec-x",
	});
	const capture: Capture[] = [];
	const r = await runGate(STATE, QUESTIONS, {
		repoRoot: repo,
		policy: POLICY,
		decisionPolicy: decisionPolicyFor(repo),
		transport: okDouble(body, capture),
		apiKey: "k-test",
	});
	expect(capture.length).toBe(1);
	expect(r.failure?.kind).toBe("invalid-response");
	expect(readLedgerLines(repo).length).toBe(1);
});

// ---------------------------------------------------------------------------
// no-api-key — fail-closed, pre-transport, zero POSTs
// ---------------------------------------------------------------------------

test("apiKey null → fail-closed no-api-key: zero POSTs, Deliberate, one line with the failure class", async () => {
	const repo = tmpRepo();
	const capture: Capture[] = [];
	const counting: GateTransport = async (req) => {
		capture.push(req);
		return { ok: true, status: 200, body: SUCCESS_BODY };
	};
	const r = await runGate(STATE, QUESTIONS, {
		repoRoot: repo,
		policy: POLICY,
		decisionPolicy: decisionPolicyFor(repo),
		transport: counting,
		apiKey: null,
	});
	expect(capture.length).toBe(0);
	expect(r.status).toBe("failed");
	expect(r.failure?.kind).toBe("no-api-key");
	expect(r.decision.mode).toBe("Deliberate");
	expect(r.decision.include).toEqual(MODE_PANELS.Deliberate);
	const lines = readLedgerLines(repo);
	expect(lines.length).toBe(1);
	const parsed = JSON.parse(lines[0]!);
	expect(parsed.failure).toEqual({ class: "no-api-key" });
	expect(parsed.basis.startsWith("gate call failed: ")).toBe(true);
});

// ---------------------------------------------------------------------------
// Fail-loud pre-POST guards — zero POSTs, zero ledger lines
// ---------------------------------------------------------------------------

const guardCases: [string, { policy?: Partial<GatePolicy>; questions?: GateQuestionSet; decisionPolicy?: (dp: GateDecisionPolicy) => GateDecisionPolicy }, RegExp][] = [
	["off mode is a programming error, never silent", { policy: { mode: "off" } }, /policy\.mode is "off"/],
	[
		"an unpinned model is rejected pre-POST",
		{ policy: { model: "typesafe/jev-1.13-20260917" } },
		/pinned decisions model/,
	],
	[
		"a chat-completions endpoint is the never-path, enforced in code",
		{ policy: { endpoint: "https://openrouter.ai/api/v1/chat/completions" } },
		/never-path/,
	],
	[
		"the noul join check fires naming question id, token, and keys",
		{ decisionPolicy: (dp) => ({ ...dp, noulProbabilityOf: "true" }) },
		/reversible.*"true".*yes, no/,
	],
	[
		"a noul keyed outside {yes,no} fails at the wire seam (pre-POST, zero lines)",
		{ questions: { ...QUESTIONS, questions: { ...QUESTIONS.questions, reversible: { type: "noul", instructions: "?", criteria: { yes: "a", no: "b", maybe: "c" } } } } },
		/maybe/,
	],
];

for (const [label, over, pattern] of guardCases) {
	test(`guard: ${label} — rejects, zero POSTs, zero ledger lines`, async () => {
		const repo = tmpRepo();
		const capture: Capture[] = [];
		const counting: GateTransport = async (req) => {
			capture.push(req);
			return { ok: true, status: 200, body: SUCCESS_BODY };
		};
		const dp0 = decisionPolicyFor(repo);
		const dp = over.decisionPolicy ? over.decisionPolicy(dp0) : dp0;
		const policy = { ...POLICY, ...over.policy };
		const questions = over.questions ?? QUESTIONS;
		await expect(
			runGate(STATE, questions, {
				repoRoot: repo,
				policy,
				decisionPolicy: dp,
				transport: counting,
				apiKey: "k-test",
			}),
		).rejects.toThrow(pattern);
		expect(capture.length).toBe(0);
		expect(readLedgerLines(repo).length).toBe(0);
	});
}

test("the pinned endpoint itself is never the never-path (guard is substring-scoped)", async () => {
	const repo = tmpRepo();
	const capture: Capture[] = [];
	const r = await runGate(STATE, QUESTIONS, {
		repoRoot: repo,
		policy: { ...POLICY, endpoint: GATE_ENDPOINT },
		decisionPolicy: decisionPolicyFor(repo),
		transport: okDouble(SUCCESS_BODY, capture),
		apiKey: "k-test",
	});
	expect(r.status).toBe("ok");
	expect(capture.length).toBe(1);
});

test("loadGateQuestions ACCEPTS a mis-keyed noul repo-local override (O7 — discovered at the wire seam)", () => {
	const repo = tmpRepo();
	const dir = path.join(repo, CONFIG_DIR_NAME, "council", "gate");
	fs.mkdirSync(dir, { recursive: true });
	fs.writeFileSync(
		path.join(dir, "questions.json"),
		JSON.stringify({
			version: "qs-miskeyed",
			questions: { reversible: { type: "noul", instructions: "?", criteria: { favorable: "cheap", unfavorable: "costly" } } },
		}),
	);
	const qs = loadGateQuestions(repo);
	expect(qs.questions.reversible!.criteria).toEqual({ favorable: "cheap", unfavorable: "costly" });
});

// ---------------------------------------------------------------------------
// v1/v2 coexistence (O17 — kept a test, not an assumption)
// ---------------------------------------------------------------------------

test("a hand-written v1 line next to a v2 line both read back with identical rederiveResolvedMode", async () => {
	const repo = tmpRepo();
	const dp = decisionPolicyFor(repo);
	const v1 = JSON.stringify({
		schemaVersion: 1,
		kind: "call",
		callId: "v1-call",
		stateHash: "s1",
		questionSetVersion: "qs-v1",
		answers: { reversible: null, publicContract: null, blastRadius: null, decidablyTestable: null },
		resolvedMode: "Deliberate",
		policyVersion: "gate-policy-1",
		recordedAt: "2026-01-01T00:00:00.000Z",
	});
	fs.mkdirSync(path.dirname(gateLedgerPath(repo)), { recursive: true });
	fs.writeFileSync(gateLedgerPath(repo), v1 + "\n");
	const capture: Capture[] = [];
	await runGate(STATE, QUESTIONS, {
		repoRoot: repo,
		policy: POLICY,
		decisionPolicy: dp,
		transport: okDouble(SUCCESS_BODY, capture),
		apiKey: "k-test",
	});
	const { calls } = readGateLedger(repo);
	expect(calls.length).toBe(2);
	const v1rec = calls.find((c) => c.callId === "v1-call")!;
	const v2rec = calls.find((c) => c.callId !== "v1-call")!;
	expect(v1rec.schemaVersion).toBe(1);
	expect(v2rec.schemaVersion).toBe(2);
	// Reader tolerance: no schemaVersion validation, no rewrite; re-derivation identical.
	expect(rederiveResolvedMode(v1rec, rederiveFn(dp))).toBe(v1rec.resolvedMode);
	expect(rederiveResolvedMode(v2rec, rederiveFn(dp))).toBe(v2rec.resolvedMode);
	const raw = fs.readFileSync(gateLedgerPath(repo), "utf-8");
	expect(raw).toContain('"schemaVersion":1'); // v1 line never rewritten
});

// ---------------------------------------------------------------------------
// Source canary
// ---------------------------------------------------------------------------

function src(f: string): string {
	return fs.readFileSync(new URL(`../extensions/${f}`, import.meta.url), "utf-8");
}

test("source canary: chat/completions appears only in the transport's two pinned constants (plus gate.ts's pre-existing comment); fetch( only in the production transport", () => {
	// EV-65 edits no gate.ts code — its one pre-existing comment occurrence is
	// pinned so it cannot grow; the other modules carry none.
	for (const f of ["gate-ledger.ts", "gate-run.ts", "gate-state.ts"]) {
		expect(`${f}: chat/completions`).toBe(`${f}: chat/completions`);
		expect(src(f).includes("chat/completions")).toBe(false);
		expect(`${f}: fetch(`).toBe(`${f}: fetch(`);
		expect(src(f).includes("fetch(")).toBe(false);
	}
	expect(src("gate.ts").split("chat/completions").length - 1).toBe(1);
	const transport = src("gate-transport.ts");
	expect(transport.split("chat/completions").length - 1).toBe(2); // refusal marker + forbidden-path constant, nothing else
	expect(transport.split("fetch(").length - 1).toBe(1); // the production transport only
});
