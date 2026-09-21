// EV-81 — offline tests for runFollowupGate, the followup arm of the
// fail-closed Jev transport (colocated in gate-run.ts as a fenced section).
//
// Spec: docs/superpowers/specs/2026-09-21-EV-81-design.md (authoritative);
// card: council/cards/EV-81.md. Every test injects a transport double over a
// mkdtemp repoRoot: no network, no timers, never the real repo. The
// probability-range falsifier lives in test/ev81-sideprobability-range.test.ts
// (red-at-base recorded; this file holds the orchestration's green half).
//
// Obligations pinned here (spec "Owner test obligations"):
//  1. fixture matrix — network / timeout / http-500 / http-400-refusal /
//     2xx-garbage / explicit null apiKey / out-of-range probability, each
//     asserting the FULL posture (status failed; disposition File; basis
//     exactly `gate call failed: <reason>`; exactly one ledger line with
//     resolvedMode "File", failureClass, every asked id null; zero Drop and
//     zero Merge anywhere in result or line);
//  2. guard parity — off / model pin / endpoint never-path / noul join all
//     throw pre-POST with zero ledger lines; the credential expression is
//     preflight's (undefined → resolveOpenRouterApiKey, null → fail closed);
//  3. policyVersion/questionSetVersion asserted against the LOADERS' versions,
//     never literals (the deliberate divergence from runGate's literal);
//  6. vocabulary disjointness (GATE_DECISION_MODES ∩ FOLLOWUP_DISPOSITIONS =
//     ∅, imported constants) + mixed followup+card ledger → resolveRoute
//     returns the card line's result, unaffected;
//  7. one-pin request assertions — captured url === GATE_ENDPOINT,
//     body.model === GATE_PINNED_MODEL (imported, never re-declared);
//  10. one-call-line-per-call posture with a directory-snapshot diff — the
//      only mutation around the call is the single ledger line;
//  11. off short-circuit ordering — runFollowupGate throws its OWN guard
//      error on off, distinct from buildFollowupState's absent-budget FAIL,
//      which is why the short-circuit belongs to the caller BEFORE the pack.
import { afterEach, test, expect } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { CONFIG_DIR_NAME } from "@earendil-works/pi-coding-agent";
import {
	FOLLOWUP_DISPOSITIONS,
	GATE_DECISION_MODES,
	GATE_ENDPOINT,
	GATE_PINNED_MODEL,
	loadFollowupDecision,
	loadFollowupQuestions,
	type GatePolicy,
} from "../extensions/gate.ts";
import { buildGateState } from "../extensions/gate-state.ts";
import { gateLedgerPath, readGateLedger } from "../extensions/gate-ledger.ts";
import { appendGateCall } from "../extensions/gate-ledger.ts";
import { GATE_CALL_TIMEOUT_MS, runFollowupGate } from "../extensions/gate-run.ts";
import { GATE_REFUSAL_MARKER, type GateTransport } from "../extensions/gate-transport.ts";
import {
	buildFollowupState,
	type FollowupCandidate,
	type FollowupState,
} from "../extensions/followup-state.ts";
import { loadGateDecision, loadGateQuestions } from "../extensions/gate.ts";
import { parseCardFile, resolveRoute } from "../extensions/gate-route.ts";

// ---------------------------------------------------------------------------
// Fixtures — packaged followup data, a synthetic minimal state, doubles
// ---------------------------------------------------------------------------

/** A nonexistent repo root: the loaders' first-hit resolution falls through
 * to the PACKAGED defaults. The versions are asserted via these loaders —
 * never literals ("followup-decision-1"/"followup-questions-1" appear
 * nowhere in this file). */
const PACKAGED_ROOT = "/nonexistent-repo-root-ev81";
const followupDecision = (): ReturnType<typeof loadFollowupDecision> => loadFollowupDecision(PACKAGED_ROOT);
const followupQuestions = (): ReturnType<typeof loadFollowupQuestions> => loadFollowupQuestions(PACKAGED_ROOT);

function tmpRepo(): string {
	return fs.mkdtempSync(path.join(os.tmpdir(), "ev81-followup-repo-"));
}

const POLICY: GatePolicy = {
	policyVersion: "ev81-followup-policy-1",
	mode: "active",
	model: GATE_PINNED_MODEL,
	endpoint: GATE_ENDPOINT,
	gateStateBudgetTokens: 32000,
};

const ADVISORY_POLICY: GatePolicy = { ...POLICY, mode: "advisory" };

/** Minimal synthetic FollowupState — the runner needs only stateHash,
 * stateBytes, drops (spec: "no fs, no timers in the orchestration"); the
 * remaining fields are present because the type demands them. */
const STATE: FollowupState = {
	stateBytes: new TextEncoder().encode(
		JSON.stringify({ candidate: { title: "EV-81", goal: "Followup transport" }, board: [], siblings: [] }),
	),
	stateHash: "sha256:ev81-followup-fake-state-hash",
	drops: [{ section: "board", truncated: false, kept: 3, measuredTokens: 900 }],
	sections: {
		candidate: { title: "EV-81", goal: "Followup transport" },
		board: [],
		siblings: [],
	},
	sources: { board: { present: true, skippedLines: 0 }, cards: { missingGoal: [] } },
};

const REPORTED_MODEL = "typesafe/jev-1.13-20260917";

/** composite 0.20 + 0.10 + 0.50 = 0.80 < merge 1.00 → File (the composite's
 * own else-arm, distinct from a failed-call File). */
const FILE_BODY = JSON.stringify({
	model: REPORTED_MODEL,
	answers: {
		duplicate: { type: "noul", probability: 0.2 },
		alreadyDone: { type: "noul", probability: 0.1 },
		actionable: { type: "choice", value: "no", probabilities: { yes: 0.5, no: 0.5 }, confidence: 0.9 },
	},
	usage: { input_tokens: 10, output_tokens: 5, cost: 0.001 },
	provider: "Typesafe",
	id: "gen-dec-ev81-file",
});

/** composite 0.40 + 0.40 + 0.80 = 1.60 ∈ [merge 1.00, drop 2.00) → Merge; no
 * override fires (each override option's P(yes) ≤ 0.4). */
const MERGE_BODY = JSON.stringify({
	model: REPORTED_MODEL,
	answers: {
		duplicate: { type: "noul", probability: 0.4 },
		alreadyDone: { type: "noul", probability: 0.4 },
		actionable: { type: "choice", value: "no", probabilities: { yes: 0.2, no: 0.8 }, confidence: 0.9 },
	},
	usage: { input_tokens: 12, output_tokens: 6, cost: 0.002 },
	provider: "Typesafe",
	id: "gen-dec-ev81-merge",
});

/** alreadyDone? yes (P(yes) = 0.9) fires the override → Drop regardless of
 * the composite (phase 2 precedes phase 3). */
const OVERRIDE_DROP_BODY = JSON.stringify({
	model: REPORTED_MODEL,
	answers: {
		duplicate: { type: "noul", probability: 0.2 },
		alreadyDone: { type: "noul", probability: 0.9 },
		actionable: { type: "choice", value: "no", probabilities: { yes: 0.2, no: 0.8 }, confidence: 0.9 },
	},
	usage: { input_tokens: 14, output_tokens: 7, cost: 0.003 },
	provider: "Typesafe",
	id: "gen-dec-ev81-drop",
});

/** The packaged question set's ids, with one UNKNOWN answer id riding the
 * body — the knownIds filter must drop it into unknownAnswerIds. */
const UNKNOWN_ID = "notAQuestion";
const UNKNOWN_BODY = JSON.stringify({
	model: REPORTED_MODEL,
	answers: {
		duplicate: { type: "noul", probability: 0.2 },
		alreadyDone: { type: "noul", probability: 0.1 },
		actionable: { type: "choice", value: "no", probabilities: { yes: 0.5, no: 0.5 }, confidence: 0.9 },
		[UNKNOWN_ID]: { type: "noul", probability: 0.9 },
	},
	usage: { input_tokens: 10, output_tokens: 5, cost: 0.001 },
	provider: "Typesafe",
	id: "gen-dec-ev81-unknown",
});

/** The out-of-range arm: the counted option "no" carries 1.5 — decideFollowup
 * throws inside the success-path try, the invalid-response catch-all converts
 * it to the fail-closed File. */
const OUT_OF_RANGE_BODY = JSON.stringify({
	model: REPORTED_MODEL,
	answers: {
		duplicate: { type: "noul", probability: 0.2 },
		alreadyDone: { type: "noul", probability: 0.1 },
		actionable: { type: "choice", value: "no", probabilities: { yes: 0, no: 1.5 }, confidence: 0.9 },
	},
	usage: { input_tokens: 10, output_tokens: 5, cost: 0.001 },
	provider: "Typesafe",
	id: "gen-dec-ev81-range",
});
const OUT_OF_RANGE_REASON = `answer actionable of type choice: option "no" carries probability 1.5 — expected a number in [0, 1]`;

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
const failDouble = (
	f:
		| { ok: false; kind: "timeout"; message: string }
		| { ok: false; kind: "network"; message: string }
		| { ok: false; kind: "http-error"; status: number; body: string },
	capture: Capture[] = [],
): GateTransport => async (req) => {
	capture.push(req);
	return f;
};

/** Recursive file listing (sorted) for the directory-snapshot diff. */
function snapshot(root: string): string[] {
	const out: string[] = [];
	const walk = (dir: string): void => {
		for (const e of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
			const p = path.join(dir, e.name);
			if (e.isDirectory()) walk(p);
			else out.push(p);
		}
	};
	walk(root);
	return out;
}

/** The FULL failure posture (spec obligation 1): status failed; disposition
 * File; basis exactly `gate call failed: <reason>` with the verbatim reason
 * exactly once; failure {kind, reason} on the result; exactly ONE ledger line
 * — resolvedMode "File", failureClass, policyVersion/questionSetVersion from
 * the loaders, every asked id null, drops carried; ZERO Drop and zero Merge
 * anywhere in the result or the line. */
async function assertFailedPosture(
	repo: string,
	run: () => ReturnType<typeof runFollowupGate>,
	expectedKind: string,
	expectedReason: string,
): Promise<void> {
	const r = await run();
	expect(r.status).toBe("failed");
	expect(r.decision.disposition).toBe("File");
	expect(r.decision.basis).toBe(`gate call failed: ${expectedReason}`);
	expect(r.decision.basis.split("gate call failed: ").length - 1).toBe(1); // exactly once
	expect(r.failure).toEqual({ kind: expectedKind, reason: expectedReason });
	const lines = readGateLedger(repo).calls;
	expect(lines.length).toBe(1);
	const line = lines[0]!;
	expect(line.resolvedMode).toBe("File");
	expect(line.failure).toEqual({ class: expectedKind });
	expect(line.basis).toBe(r.decision.basis);
	// Deliberate divergence: the DECISION policy's version + the question
	// set's version — via the loaders, never literals (obligation 3).
	expect(line.policyVersion).toBe(followupDecision().version);
	expect(line.questionSetVersion).toBe(followupQuestions().version);
	expect(Object.keys(line.answers).sort()).toEqual(["actionable", "alreadyDone", "duplicate"]);
	for (const v of Object.values(line.answers)) expect(v).toBeNull(); // absent, never a zero
	expect(line.drops).toEqual(STATE.drops);
	// Zero Drop and zero Merge anywhere in result or line.
	for (const rendered of [JSON.stringify(r), JSON.stringify(line)]) {
		expect(rendered).not.toContain('"Drop"');
		expect(rendered).not.toContain('"Merge"');
	}
}

// ---------------------------------------------------------------------------
// Success path — one POST, the pin, wire shaping, the disposition verbatim
// ---------------------------------------------------------------------------

test("success: one POST to GATE_ENDPOINT with the pinned model; body keys exactly {model,state,questions}; wire maps noul yes/no → true/false; default timeout is GATE_CALL_TIMEOUT_MS", async () => {
	const repo = tmpRepo();
	const capture: Capture[] = [];
	const r = await runFollowupGate(STATE, followupQuestions(), POLICY, followupDecision(), {
		repoRoot: repo,
		transport: okDouble(FILE_BODY, capture),
		apiKey: "k-test",
	});
	expect(r.status).toBe("ok");
	expect(capture.length).toBe(1);
	const req = capture[0]!;
	// Obligation 7 — the pin, via the imported constants, never re-declared.
	expect(req.url).toBe(GATE_ENDPOINT);
	expect((req.body as Record<string, unknown>)["model"]).toBe(GATE_PINNED_MODEL);
	expect(Object.keys(req.body as Record<string, unknown>).sort()).toEqual(["model", "questions", "state"]);
	const wire = (req.body as Record<string, unknown>)["questions"] as Record<string, { criteria: Record<string, string> }>;
	expect(Object.keys(wire["duplicate"]!.criteria).sort()).toEqual(["false", "true"]);
	expect(JSON.parse(new TextDecoder().decode(STATE.stateBytes))).toEqual(
		(req.body as Record<string, unknown>)["state"],
	);
	expect(req.timeoutMs).toBe(GATE_CALL_TIMEOUT_MS);
	// Timeout opt override.
	const capture2: Capture[] = [];
	await runFollowupGate(STATE, followupQuestions(), POLICY, followupDecision(), {
		repoRoot: tmpRepo(),
		transport: okDouble(FILE_BODY, capture2),
		apiKey: "k-test",
		timeoutMs: 1234,
	});
	expect(capture2[0]!.timeoutMs).toBe(1234);
});

test("success: the composite's File arm records the disposition verbatim, answers verbatim, loaders' versions, modelDrift on the reported versioned id", async () => {
	const repo = tmpRepo();
	const capture: Capture[] = [];
	const r = await runFollowupGate(STATE, followupQuestions(), POLICY, followupDecision(), {
		repoRoot: repo,
		transport: okDouble(FILE_BODY, capture),
		apiKey: "k-test",
	});
	expect(r.status).toBe("ok");
	expect(r.decision.disposition).toBe("File");
	expect(r.decision.basis).toBe("composite 0.80 < merge threshold 1.00");
	expect(r.reportedModel).toBe(REPORTED_MODEL);
	expect(r.modelDrift).toEqual({ pinned: GATE_PINNED_MODEL, reported: REPORTED_MODEL });
	const line = readGateLedger(repo).calls[0]!;
	expect(line.resolvedMode).toBe("File");
	expect(line.basis).toBe(r.decision.basis);
	expect(line.model).toBe(REPORTED_MODEL);
	expect(line.provider).toBe("Typesafe");
	expect(line.usage).toEqual({ input_tokens: 10, output_tokens: 5, cost: 0.001 });
	expect(line.generationId).toBe("gen-dec-ev81-file");
	expect(line.advisory).toBe(false); // active mode, recorded never enforced
	expect(line.policyVersion).toBe(followupDecision().version);
	expect(line.questionSetVersion).toBe(followupQuestions().version);
	expect(line.unknownAnswerIds).toEqual([]);
	const parsed = JSON.parse(FILE_BODY) as { answers: Record<string, unknown> };
	expect(line.answers).toEqual(parsed.answers as typeof line.answers);
	expect(line.drops).toEqual(STATE.drops);
});

test("success: Merge composite and the alreadyDone?yes override Drop resolve verbatim; advisory records advisory true", async () => {
	const mergeRepo = tmpRepo();
	const r = await runFollowupGate(STATE, followupQuestions(), POLICY, followupDecision(), {
		repoRoot: mergeRepo,
		transport: okDouble(MERGE_BODY, []),
		apiKey: "k-test",
	});
	expect(r.status).toBe("ok");
	expect(r.decision.disposition).toBe("Merge");
	expect(readGateLedger(mergeRepo).calls[0]!.resolvedMode).toBe("Merge");

	const dropRepo = tmpRepo();
	const r2 = await runFollowupGate(STATE, followupQuestions(), POLICY, followupDecision(), {
		repoRoot: dropRepo,
		transport: okDouble(OVERRIDE_DROP_BODY, []),
		apiKey: "k-test",
	});
	expect(r2.status).toBe("ok");
	expect(r2.decision.disposition).toBe("Drop");
	expect(r2.decision.basis).toBe("alreadyDone? yes (already resolved or obsolete)");
	expect(readGateLedger(dropRepo).calls[0]!.resolvedMode).toBe("Drop");

	const advisoryRepo = tmpRepo();
	const r3 = await runFollowupGate(STATE, followupQuestions(), ADVISORY_POLICY, followupDecision(), {
		repoRoot: advisoryRepo,
		transport: okDouble(MERGE_BODY, []),
		apiKey: "k-test",
	});
	expect(r3.status).toBe("ok");
	expect(r3.decision.disposition).toBe("Merge"); // computed and recorded, never enforced
	expect(readGateLedger(advisoryRepo).calls[0]!.advisory).toBe(true);
});

test("success: an unknown answer id lands in unknownAnswerIds and never in the record", async () => {
	const repo = tmpRepo();
	const r = await runFollowupGate(STATE, followupQuestions(), POLICY, followupDecision(), {
		repoRoot: repo,
		transport: okDouble(UNKNOWN_BODY, []),
		apiKey: "k-test",
	});
	expect(r.status).toBe("ok");
	const line = readGateLedger(repo).calls[0]!;
	expect(line.unknownAnswerIds).toEqual([UNKNOWN_ID]);
	expect(Object.keys(line.answers).sort()).toEqual(["actionable", "alreadyDone", "duplicate"]);
});

// ---------------------------------------------------------------------------
// Obligation 1 — the failure matrix: every variant asserts the FULL posture
// ---------------------------------------------------------------------------

test("matrix: network failure → File, exactly `gate call failed: <reason>`, one null-answer line, zero Drop/Merge", async () => {
	const repo = tmpRepo();
	const capture: Capture[] = [];
	await assertFailedPosture(
		repo,
		() =>
			runFollowupGate(STATE, followupQuestions(), POLICY, followupDecision(), {
				repoRoot: repo,
				transport: failDouble({ ok: false, kind: "network", message: "getaddrinfo ENOTFOUND gate.test" }, capture),
				apiKey: "k-test",
			}),
		"network",
		"getaddrinfo ENOTFOUND gate.test",
	);
	expect(capture.length).toBe(1); // exactly one POST attempt, no retry, no fallback
});

test("matrix: timeout → kind timeout, verbatim transport message in the basis", async () => {
	const repo = tmpRepo();
	await assertFailedPosture(
		repo,
		() =>
			runFollowupGate(STATE, followupQuestions(), POLICY, followupDecision(), {
				repoRoot: repo,
				transport: failDouble({ ok: false, kind: "timeout", message: `timeout after ${GATE_CALL_TIMEOUT_MS}ms` }),
				apiKey: "k-test",
			}),
		"timeout",
		`timeout after ${GATE_CALL_TIMEOUT_MS}ms`,
	);
});

test("matrix: http-500 → kind http-500, body captured verbatim", async () => {
	const repo = tmpRepo();
	await assertFailedPosture(
		repo,
		() =>
			runFollowupGate(STATE, followupQuestions(), POLICY, followupDecision(), {
				repoRoot: repo,
				transport: failDouble({ ok: false, kind: "http-error", status: 500, body: "upstream exploded" }),
				apiKey: "k-test",
			}),
		"http-500",
		"HTTP 500: upstream exploded",
	);
});

test("matrix: http-400 with the imported GATE_REFUSAL_MARKER → kind http-400-refusal", async () => {
	const repo = tmpRepo();
	await assertFailedPosture(
		repo,
		() =>
			runFollowupGate(STATE, followupQuestions(), POLICY, followupDecision(), {
				repoRoot: repo,
				transport: failDouble({ ok: false, kind: "http-error", status: 400, body: REFUSAL_BODY }),
				apiKey: "k-test",
			}),
		"http-400-refusal",
		`HTTP 400: ${REFUSAL_BODY}`,
	);
});

test("matrix: 2xx garbage → invalid-response → File (the invalid-response catch-all)", async () => {
	const repo = tmpRepo();
	const r = await runFollowupGate(STATE, followupQuestions(), POLICY, followupDecision(), {
		repoRoot: repo,
		transport: okDouble("this is not json", []),
		apiKey: "k-test",
	});
	expect(r.failure?.kind).toBe("invalid-response");
	expect(r.failure?.reason).toContain("not parseable as JSON");
	// The basis is exactly `gate call failed: ` + the verbatim reason.
	expect(r.decision.basis).toBe(`gate call failed: ${r.failure!.reason}`);
	expect(r.decision.disposition).toBe("File");
	expect(readGateLedger(repo).calls[0]!.resolvedMode).toBe("File");
});

test("matrix: explicit apiKey null → no-api-key, ZERO POSTs (defense-in-depth failRun fires pre-transport)", async () => {
	const repo = tmpRepo();
	const capture: Capture[] = [];
	await assertFailedPosture(
		repo,
		() =>
			runFollowupGate(STATE, followupQuestions(), POLICY, followupDecision(), {
				repoRoot: repo,
				transport: okDouble(FILE_BODY, capture),
				apiKey: null,
			}),
		"no-api-key",
		"no OpenRouter API key resolved (OPENROUTER_API_KEY env or stored credential)",
	);
	expect(capture.length).toBe(0);
});

test("matrix: out-of-range counted probability → decideFollowup throws → invalid-response → File, reason verbatim", async () => {
	const repo = tmpRepo();
	await assertFailedPosture(
		repo,
		() =>
			runFollowupGate(STATE, followupQuestions(), POLICY, followupDecision(), {
				repoRoot: repo,
				transport: okDouble(OUT_OF_RANGE_BODY, []),
				apiKey: "k-test",
			}),
		"invalid-response",
		OUT_OF_RANGE_REASON,
	);
});

// ---------------------------------------------------------------------------
// Obligation 10 — one call line per call; the only disk mutation is the line
// ---------------------------------------------------------------------------

test("failure posture: a directory-snapshot diff shows the ONLY mutation is the single appended ledger line", async () => {
	const repo = tmpRepo();
	const before = snapshot(repo);
	expect(before.length).toBe(0);
	await runFollowupGate(STATE, followupQuestions(), POLICY, followupDecision(), {
		repoRoot: repo,
		transport: failDouble({ ok: false, kind: "network", message: "ECONNREFUSED" }),
		apiKey: "k-test",
	});
	const after = snapshot(repo);
	expect(after).toEqual([gateLedgerPath(repo)]);
	const raw = fs.readFileSync(gateLedgerPath(repo), "utf-8");
	expect(raw.split("\n").filter((l) => l !== "").length).toBe(1); // exactly one line
});

// ---------------------------------------------------------------------------
// Obligation 2 — guard parity: all pre-POST, zero POSTs, zero ledger lines
// ---------------------------------------------------------------------------

test("guards: mode off throws before any POST, zero ledger lines — the guard error, not the packer's", async () => {
	const repo = tmpRepo();
	const capture: Capture[] = [];
	await expect(
		runFollowupGate(STATE, followupQuestions(), { ...POLICY, mode: "off" }, followupDecision(), {
			repoRoot: repo,
			transport: okDouble(FILE_BODY, capture),
			apiKey: "k-test",
		}),
	).rejects.toThrow(/runFollowupGate — policy\.mode is "off"/);
	expect(capture.length).toBe(0);
	expect(readGateLedger(repo).calls.length).toBe(0);
});

test("guards: a model other than the imported pin throws naming the pin, zero POSTs, zero lines", async () => {
	const repo = tmpRepo();
	const capture: Capture[] = [];
	await expect(
		runFollowupGate(STATE, followupQuestions(), { ...POLICY, model: "typesafe/jev-latest" }, followupDecision(), {
			repoRoot: repo,
			transport: okDouble(FILE_BODY, capture),
			apiKey: "k-test",
		}),
	).rejects.toThrow(new RegExp(`${JSON.stringify(GATE_PINNED_MODEL)}`));
	expect(capture.length).toBe(0);
	expect(readGateLedger(repo).calls.length).toBe(0);
});

test("guards: an endpoint carrying the never-path throws before any POST, zero lines", async () => {
	const repo = tmpRepo();
	const capture: Capture[] = [];
	await expect(
		runFollowupGate(
			STATE,
			followupQuestions(),
			{ ...POLICY, endpoint: "https://openrouter.ai/api/v1/chat/completions" },
			followupDecision(),
			{
				repoRoot: repo,
				transport: okDouble(FILE_BODY, capture),
				apiKey: "k-test",
			},
		),
	).rejects.toThrow(/never-path/);
	expect(capture.length).toBe(0);
	expect(readGateLedger(repo).calls.length).toBe(0);
});

test("guards: a noul join miss (noulProbabilityOf not a criteria key) throws naming id and token, zero POSTs, zero lines", async () => {
	const repo = tmpRepo();
	const capture: Capture[] = [];
	const drifted = { ...followupDecision(), noulProbabilityOf: "true" };
	await expect(
		runFollowupGate(STATE, followupQuestions(), POLICY, drifted, {
			repoRoot: repo,
			transport: okDouble(FILE_BODY, capture),
			apiKey: "k-test",
		}),
	).rejects.toThrow(/duplicate[\s\S]*noulProbabilityOf[\s\S]*"true"/);
	expect(capture.length).toBe(0);
	expect(readGateLedger(repo).calls.length).toBe(0);
});

test("guards: the credential expression is preflight's — undefined resolves through resolveOpenRouterApiKey (env), null fails closed even with env set", async () => {
	const repo = tmpRepo();
	const capture: Capture[] = [];
	const prev = process.env["OPENROUTER_API_KEY"];
	process.env["OPENROUTER_API_KEY"] = "k-env-ev81";
	try {
		// undefined → resolution path runs → the POST happens (a no-api-key
		// failRun would have produced capture.length === 0).
		const r = await runFollowupGate(STATE, followupQuestions(), POLICY, followupDecision(), {
			repoRoot: tmpRepo(),
			transport: okDouble(FILE_BODY, capture),
		});
		expect(r.status).toBe("ok");
		expect(capture.length).toBe(1);
		// null → fail closed EVEN with the env var set (the `!== undefined`
		// semantics preflight.ts:47 pins).
		const capture2: Capture[] = [];
		const r2 = await runFollowupGate(STATE, followupQuestions(), POLICY, followupDecision(), {
			repoRoot: tmpRepo(),
			transport: okDouble(FILE_BODY, capture2),
			apiKey: null,
		});
		expect(r2.status).toBe("failed");
		expect(r2.failure?.kind).toBe("no-api-key");
		expect(capture2.length).toBe(0);
	} finally {
		if (prev === undefined) delete process.env["OPENROUTER_API_KEY"];
		else process.env["OPENROUTER_API_KEY"] = prev;
	}
});

// ---------------------------------------------------------------------------
// Obligation 11 — the off short-circuit ordering: the guard error and the
// packer's absent-budget FAIL are DISTINCT, and the caller must short-circuit
// before buildFollowupState or it gets the packer's error instead
// ---------------------------------------------------------------------------

test("off ordering: buildFollowupState under an off policy with the budget key absent throws the packer FAIL — the error the caller's short-circuit must preempt", () => {
	const repo = tmpRepo();
	fs.writeFileSync(path.join(repo, ".council.json"), JSON.stringify({ gate: { mode: "off" } }));
	const dir = path.join(repo, CONFIG_DIR_NAME, "council", "gate");
	fs.mkdirSync(dir, { recursive: true });
	fs.writeFileSync(
		path.join(dir, "policy.json"),
		JSON.stringify({ policyVersion: "p", model: GATE_PINNED_MODEL, endpoint: GATE_ENDPOINT }),
	);
	const candidate: FollowupCandidate = { title: "EV-81", goal: "Followup transport" };
	let message = "";
	try {
		buildFollowupState(candidate, repo, [], path.join(repo, "council", "board.md"));
	} catch (e) {
		message = (e as Error).message;
	}
	expect(message).toContain("gateStateBudgetTokens");
	expect(message).not.toContain("runFollowupGate");
});

// ---------------------------------------------------------------------------
// Obligation 6 — vocabulary disjointness + mixed-fixture routing
// ---------------------------------------------------------------------------

test("disjointness: GATE_DECISION_MODES ∩ FOLLOWUP_DISPOSITIONS = ∅ (imported constants)", () => {
	for (const m of GATE_DECISION_MODES) {
		expect((FOLLOWUP_DISPOSITIONS as readonly string[]).includes(m)).toBe(false);
	}
	for (const d of FOLLOWUP_DISPOSITIONS) {
		expect((GATE_DECISION_MODES as readonly string[]).includes(d)).toBe(false);
	}
});

const CARD_MD = `---
id: EV-910
title: EV-81 mixed-routing probe
state: In Progress
epic: EPIC-10
goal: A probe card routed by a recorded card-gate decision beside a followup line
---

## Intent

A probe card for the mixed followup+card routing fixture.

## Acceptance

- resolveRoute returns this card's recorded result, unaffected by followup lines.
`;

test("mixed fixture: resolveRoute over a ledger holding a followup line + a card line returns the card line's result, unaffected", () => {
	const repo = tmpRepo();
	fs.writeFileSync(path.join(repo, ".council.json"), JSON.stringify({ gate: { mode: "active" } }));
	const dir = path.join(repo, CONFIG_DIR_NAME, "council", "gate");
	fs.mkdirSync(dir, { recursive: true });
	fs.writeFileSync(
		path.join(dir, "policy.json"),
		JSON.stringify({ policyVersion: "ev81-mix-policy-1", model: GATE_PINNED_MODEL, endpoint: GATE_ENDPOINT, gateStateBudgetTokens: 32000 }),
	);
	const cardPath = path.join(repo, "council", "cards", "EV-910.md");
	fs.mkdirSync(path.dirname(cardPath), { recursive: true });
	fs.writeFileSync(cardPath, CARD_MD);
	// parseCardFile takes the card's CONTENT, not its path.
	const parsed = parseCardFile(fs.readFileSync(cardPath, "utf-8"));
	const state = buildGateState(parsed, repo);

	// The CARD line: all-null answers re-derive to Deliberate under the
	// packaged card decision policy, with the CURRENT decision policy's
	// version (a valid recorded line).
	const cardQuestions = loadGateQuestions(repo);
	const cardCall = appendGateCall(
		{
			stateHash: state.stateHash,
			questionSetVersion: cardQuestions.version,
			questionIds: Object.keys(cardQuestions.questions),
			answers: {},
			resolvedMode: "Deliberate",
			policyVersion: loadGateDecision(repo).version,
			basis: "composite 0.00 < verify threshold 2.60",
		},
		repo,
	);
	// The FOLLOWUP line: a different stateHash (the followup packer's bytes),
	// a File disposition, the followup decision policy's version.
	appendGateCall(
		{
			stateHash: "sha256:ev81-followup-other-state",
			questionSetVersion: followupQuestions().version,
			questionIds: ["duplicate", "alreadyDone", "actionable"],
			answers: {},
			resolvedMode: "File",
			policyVersion: followupDecision().version,
			basis: "gate call failed: timeout after 120000ms",
			failureClass: "timeout",
		},
		repo,
	);

	const route = resolveRoute(fs.readFileSync(cardPath, "utf-8"), repo);
	expect(route.source).toBe("recorded");
	expect(route.mode).toBe("Deliberate");
	expect(route.matchedCallId).toBe(cardCall.callId);
	expect(route.stateHash).toBe(state.stateHash);
});
