// EV-82 — offline tests for runFollowupReview, the followup record side
// (extensions/followup-tool.ts): the single engine-side composition that
// loads both followup files and reaches buildFollowupState (FLLWUP-96's
// composition site), wrapped by the thin parent-session
// `council_followup_gate` tool.
//
// Spec: docs/superpowers/specs/2026-09-22-EV-82-design.md §2/§5 (settled);
// card: council/cards/EV-82.md. Every test runs over a mkdtemp repoRoot with
// an injected transport double: no network, no timers, never the real repo
// (the ev81 pattern).
//
// Obligations pinned here (spec §5 items 1–7):
//  1. off no-op precedes the loaders — an off repo-local policy may omit
//     gateStateBudgetTokens, so the short-circuit must run BEFORE the
//     followup loaders and buildFollowupState (which throws on the absent
//     key); zero ledger lines, transport never called.
//  2. one ledger line per candidate on both arms — the failure arm carries
//     failure {class} + advisory; the success arm carries advisory;
//     resolvedMode = the disposition; policyVersion = the followup DECISION
//     policy's version (asserted via the loaders, never a literal).
//  3. a thrown pre-POST guard surfaces as a GENERIC message with
//     callId: null — never runFollowupGate's own guard text — and ZERO
//     ledger lines for the thrown candidate (skeptic O6), one mechanical
//     entry per candidate.
//  4. same-title draft set (skeptic O2) — buildFollowupState throws loud per
//     candidate; every candidate yields callId: null with ZERO ledger lines;
//     the degradation is named, tested, and safe (the human is the fail-safe).
//  5. mid-run flip — the mode is read inside execute per invocation; a
//     .council.json gate.mode edit between invocations is visible to the next.
//  6. mechanical-result opacity + the open-only boardIds projection — no
//     disposition/basis/"Mode:" token anywhere in the returned strings; a
//     Done id never appears in boardIds.
//  7. FLLWUP-96 composition — the composition loads both followup files and
//     reaches buildFollowupState; a mismatched pair fails loud from the
//     loader before any candidate work.
//  + widget shape — in-flight line naming the candidate, replaced not
//    appended, zero lines after settle (spec §2.6).
import { afterEach, test, expect } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { CONFIG_DIR_NAME } from "@earendil-works/pi-coding-agent";
import { GATE_ENDPOINT, GATE_PINNED_MODEL, loadFollowupDecision } from "../extensions/gate.ts";
import { gateLedgerPath, readGateLedger } from "../extensions/gate-ledger.ts";
import type { GateTransport } from "../extensions/gate-transport.ts";
import {
	FOLLOWUP_WIDGET_KEY,
	renderFollowupInFlight,
	runFollowupReview,
} from "../extensions/followup-tool.ts";
import type { FollowupCandidate } from "../extensions/followup-state.ts";

// ---------------------------------------------------------------------------
// Fixtures — mkdtemp repo + repo-local gate config/policy + doubles
// ---------------------------------------------------------------------------

function tmpRepo(): string {
	return fs.mkdtempSync(path.join(os.tmpdir(), "ev82-followup-repo-"));
}

/** Repo-local policy file; `budget: false` omits gateStateBudgetTokens (the
 * off-policy shape the R3 short-circuit must preempt). */
function writeGateConfig(repo: string, mode: "off" | "advisory" | "active", budget: boolean): void {
	fs.mkdirSync(path.join(repo, CONFIG_DIR_NAME, "council", "gate"), { recursive: true });
	fs.writeFileSync(
		path.join(repo, ".council.json"),
		JSON.stringify({ gate: { mode } }),
	);
	const policy: Record<string, unknown> = {
		policyVersion: "ev82-followup-policy-1",
		model: GATE_PINNED_MODEL,
		endpoint: GATE_ENDPOINT,
	};
	if (budget) policy["gateStateBudgetTokens"] = 32000;
	fs.writeFileSync(path.join(repo, CONFIG_DIR_NAME, "council", "gate", "policy.json"), JSON.stringify(policy));
}

/** A board fixture with one OPEN entry (with a card file carrying a goal) and
 * one DONE entry — the open-only projection's discriminating pair. */
function writeBoard(repo: string): void {
	fs.mkdirSync(path.join(repo, "council", "cards"), { recursive: true });
	fs.writeFileSync(
		path.join(repo, "council", "board.md"),
		["# Board", "", "## In Progress", "- EV-901 — Open probe card", "", "## Done", "- EV-900 — Done probe card", ""].join("\n"),
	);
	fs.writeFileSync(
		path.join(repo, "council", "cards", "EV-901.md"),
		["---", "id: EV-901", "title: Open probe card", "state: In Progress", "owner: null", "epic: EPIC-10", "goal: an open probe card goal", "---", "", "## Intent", "", "Probe.", ""].join("\n"),
	);
}

const CANDIDATE: FollowupCandidate = { title: "FLLWUP-101 probe", goal: "Probe the followup record side" };
const OTHER: FollowupCandidate = { title: "FLLWUP-102 other", goal: "A sibling probe" };

/** composite 0.20 + 0.10 + 0.50 = 0.80 < merge 1.00 → File (the packaged
 * decision policy's own else-arm). */
const FILE_BODY = JSON.stringify({
	model: "typesafe/jev-1.13-20260917",
	answers: {
		duplicate: { type: "noul", probability: 0.2 },
		alreadyDone: { type: "noul", probability: 0.1 },
		actionable: { type: "choice", value: "no", probabilities: { yes: 0.5, no: 0.5 }, confidence: 0.9 },
	},
	usage: { input_tokens: 10, output_tokens: 5, cost: 0.001 },
	provider: "Typesafe",
	id: "gen-dec-ev82-file",
});

interface Capture {
	url: string;
	body: unknown;
}

const okDouble = (body: string, capture: Capture[]): GateTransport => async (req) => {
	capture.push({ url: req.url, body: req.body });
	return { ok: true, status: 200, body };
};
const failDouble = (message: string): GateTransport => async () => ({
	ok: false,
	kind: "network",
	message,
});

/** The packaged followup decision policy's version, via the loader — never a
 * literal (the ev81 obligation-3 idiom). */
const decisionVersion = (): string => loadFollowupDecision("/nonexistent-repo-root-ev82").version;

afterEach(() => {
	delete process.env["OPENROUTER_API_KEY"];
});

// ---------------------------------------------------------------------------
// 1 — off no-op precedes the loaders (R3 posture)
// ---------------------------------------------------------------------------

test("off no-op: an off policy omitting gateStateBudgetTokens resolves the mechanical no-op BEFORE the packer would throw; zero ledger lines, transport untouched", async () => {
	const repo = tmpRepo();
	writeGateConfig(repo, "off", false);
	const capture: Capture[] = [];
	const r = await runFollowupReview([CANDIDATE], repo, {
		transport: okDouble(FILE_BODY, capture),
		apiKey: "k-test",
	});
	// The off no-op shape, byte-for-byte the EV-66 posture's shape.
	expect(r).toEqual({ mode: "off", recorded: 0 });
	// The packer never ran: had the short-circuit followed buildFollowupState,
	// the absent budget key would have thrown the packer's FAIL.
	expect(fs.existsSync(gateLedgerPath(repo))).toBe(false);
	expect(readGateLedger(repo).calls.length).toBe(0);
	expect(capture.length).toBe(0);
});

// ---------------------------------------------------------------------------
// 2 — one ledger line per candidate on both arms
// ---------------------------------------------------------------------------

test("success arm: one ledger line per candidate — resolvedMode is the disposition, advisory true, policyVersion is the DECISION policy's version", async () => {
	const repo = tmpRepo();
	writeGateConfig(repo, "advisory", true);
	const capture: Capture[] = [];
	const r = await runFollowupReview([CANDIDATE], repo, {
		transport: okDouble(FILE_BODY, capture),
		apiKey: "k-test",
	});
	expect(r.mode).toBe("advisory");
	expect(r.mode !== "off" && r.candidates.length).toBe(1);
	const c = r.mode !== "off" ? r.candidates[0]! : undefined;
	expect(c!.status).toBe("ok");
	expect(c!.callId).not.toBeNull();
	const lines = readGateLedger(repo).calls;
	expect(lines.length).toBe(1);
	const line = lines[0]!;
	expect(line.resolvedMode).toBe("File");
	expect(line.advisory).toBe(true);
	expect(line.policyVersion).toBe(decisionVersion());
	if (typeof c!.callId !== "string") throw new Error("expected a recorded callId");
	expect(line.callId).toBe(c!.callId);
});

test("failure arm: one ledger line per candidate — the line carries failure {class} and advisory, basis `gate call failed: <reason>`", async () => {
	const repo = tmpRepo();
	writeGateConfig(repo, "active", true);
	const r = await runFollowupReview([CANDIDATE], repo, {
		transport: failDouble("getaddrinfo ENOTFOUND gate.test"),
		apiKey: "k-test",
	});
	expect(r.mode).toBe("active");
	const c = r.mode !== "off" ? r.candidates[0]! : undefined;
	expect(c!.status).toBe("failed");
	expect(c!.callId).not.toBeNull(); // a RECORDED failure still has a callId
	const lines = readGateLedger(repo).calls;
	expect(lines.length).toBe(1);
	const line = lines[0]!;
	expect(line.failure).toEqual({ class: "network" });
	expect(line.advisory).toBe(false); // active mode
	expect(line.basis).toBe("gate call failed: getaddrinfo ENOTFOUND gate.test");
	expect(line.policyVersion).toBe(decisionVersion());
});

// ---------------------------------------------------------------------------
// 3 — thrown pre-POST guard: generic message, callId null, zero lines (O6)
// ---------------------------------------------------------------------------

test("pre-POST guard throw: every candidate yields a generic message with callId null, never the guard text, zero ledger lines", async () => {
	const repo = tmpRepo();
	writeGateConfig(repo, "advisory", true);
	// Corrupt the policy's model AFTER config write: the guard in
	// runFollowupGate throws pre-POST naming the pinned model.
	const policyPath = path.join(repo, CONFIG_DIR_NAME, "council", "gate", "policy.json");
	const policy = JSON.parse(fs.readFileSync(policyPath, "utf-8")) as Record<string, unknown>;
	policy["model"] = "typesafe/jev-latest";
	fs.writeFileSync(policyPath, JSON.stringify(policy));
	const capture: Capture[] = [];
	const r = await runFollowupReview([CANDIDATE], repo, {
		transport: okDouble(FILE_BODY, capture),
		apiKey: "k-test",
	});
	const c = r.mode !== "off" ? r.candidates[0]! : undefined;
	expect(c!.callId).toBeNull();
	expect(c!.status).toBe("failed");
	expect(c!.message).toBeDefined();
	// GENERIC: never runFollowupGate's own guard text, never a verdict token.
	expect(c!.message).not.toContain("pinned decisions model");
	expect(c!.message).not.toContain("Mode:");
	expect(c!.message).not.toContain("File");
	expect(c!.message).not.toContain("Merge");
	expect(c!.message).not.toContain("Drop");
	expect(capture.length).toBe(0); // zero POSTs
	expect(readGateLedger(repo).calls.length).toBe(0); // ZERO ledger lines (O6)
});

// ---------------------------------------------------------------------------
// 4 — same-title draft set (skeptic O2)
// ---------------------------------------------------------------------------

test("same-title draft set: every candidate throws per-candidate — callId null, one entry per candidate, ZERO ledger lines, transport never called", async () => {
	const repo = tmpRepo();
	writeGateConfig(repo, "advisory", true);
	const capture: Capture[] = [];
	const dup: FollowupCandidate = { title: "Same title", goal: "a" };
	const r = await runFollowupReview([dup, { title: "Same title", goal: "b" }], repo, {
		transport: okDouble(FILE_BODY, capture),
		apiKey: "k-test",
	});
	expect(r.mode).toBe("advisory");
	const cs = r.mode !== "off" ? r.candidates : [];
	expect(cs.length).toBe(2); // one mechanical entry per candidate
	for (const c of cs) {
		expect(c.callId).toBeNull();
		expect(c.status).toBe("failed");
		expect(c.message).toBeDefined();
	}
	expect(capture.length).toBe(0);
	expect(readGateLedger(repo).calls.length).toBe(0); // zero ledger lines
});

// ---------------------------------------------------------------------------
// 5 — mid-run flip
// ---------------------------------------------------------------------------

test("mid-run flip: off no-op, then a .council.json gate.mode edit is visible to the next invocation", async () => {
	const repo = tmpRepo();
	writeGateConfig(repo, "off", false);
	const capture: Capture[] = [];
	const r1 = await runFollowupReview([CANDIDATE], repo, {
		transport: okDouble(FILE_BODY, capture),
		apiKey: "k-test",
	});
	expect(r1).toEqual({ mode: "off", recorded: 0 });
	// Flip advisory between invocations — the policy file gains the budget key
	// (a non-off policy must carry it).
	writeGateConfig(repo, "advisory", true);
	const r2 = await runFollowupReview([CANDIDATE], repo, {
		transport: okDouble(FILE_BODY, capture),
		apiKey: "k-test",
	});
	expect(r2.mode).toBe("advisory");
	const c = r2.mode !== "off" ? r2.candidates[0]! : undefined;
	expect(c!.callId).not.toBeNull();
});

// ---------------------------------------------------------------------------
// 6 — mechanical-result opacity + open-only boardIds projection
// ---------------------------------------------------------------------------

test("mechanical result: no disposition/basis/Mode: token anywhere; boardIds is the open-only projection (the Done id never appears); siblingTitles are the other candidates", async () => {
	const repo = tmpRepo();
	writeGateConfig(repo, "advisory", true);
	writeBoard(repo);
	const r = await runFollowupReview([CANDIDATE, OTHER], repo, {
		transport: okDouble(FILE_BODY, []),
		apiKey: "k-test",
	});
	const s = JSON.stringify(r);
	expect(s).not.toContain('"disposition"');
	expect(s).not.toContain("basis");
	expect(s).not.toContain("Mode:");
	expect(s).not.toContain('"File"');
	expect(s).not.toContain('"Merge"');
	expect(s).not.toContain('"Drop"');
	const cs = r.mode !== "off" ? r.candidates : [];
	expect(cs.length).toBe(2);
	expect(cs[0]!.boardIds).toEqual(["EV-901"]); // open-only: EV-900 (Done) never appears
	expect(cs[0]!.siblingTitles).toEqual([OTHER.title]);
	expect(cs[1]!.siblingTitles).toEqual([CANDIDATE.title]);
	// Key walk: mechanical facts only.
	for (const c of cs) {
		expect(Object.keys(c).sort()).toEqual(["boardIds", "callId", "siblingTitles", "status", "title"]);
	}
});

// ---------------------------------------------------------------------------
// 7 — FLLWUP-96 composition: both followup files loaded, buildFollowupState
// reached; a mismatched pair fails loud
// ---------------------------------------------------------------------------

test("composition: the success path reaches buildFollowupState (sections read from the real board fixture) and runFollowupGate (a ledger line lands)", async () => {
	const repo = tmpRepo();
	writeGateConfig(repo, "advisory", true);
	writeBoard(repo);
	const r = await runFollowupReview([CANDIDATE], repo, {
		transport: okDouble(FILE_BODY, []),
		apiKey: "k-test",
	});
	const c = r.mode !== "off" ? r.candidates[0]! : undefined;
	expect(c!.status).toBe("ok");
	expect(c!.boardIds).toEqual(["EV-901"]); // sections were packed from the board
	expect(readGateLedger(repo).calls.length).toBe(1);
});

test("composition: a mismatched followup pair fails LOUD from the loader before any candidate work — zero ledger lines", async () => {
	const repo = tmpRepo();
	writeGateConfig(repo, "advisory", true);
	// A repo-local questions.json carrying a `score` question — refused in the
	// followup domain (the loader's restricted type set).
	const dir = path.join(repo, CONFIG_DIR_NAME, "council", "gate", "followup");
	fs.mkdirSync(dir, { recursive: true });
	fs.writeFileSync(
		path.join(dir, "questions.json"),
		JSON.stringify({
			version: "ev82-mismatch-1",
			questions: { q1: { type: "score", instructions: "rank", criteria: ["a", "b"] } },
		}),
	);
	await expect(
		runFollowupReview([CANDIDATE], repo, { transport: okDouble(FILE_BODY, []), apiKey: "k-test" }),
	).rejects.toThrow(/has an invalid/);
	expect(readGateLedger(repo).calls.length).toBe(0);
});

// ---------------------------------------------------------------------------
// Widget — in-flight line naming the candidate; replaced not appended; zero
// lines after settle (spec §2.6)
// ---------------------------------------------------------------------------

test("widget: one in-flight line per candidate naming that candidate, replaced not appended, then zero lines after settle", async () => {
	const repo = tmpRepo();
	writeGateConfig(repo, "advisory", true);
	const calls: Array<{ key: string; lines: string[] }> = [];
	const r = await runFollowupReview([CANDIDATE, OTHER], repo, {
		transport: okDouble(FILE_BODY, []),
		apiKey: "k-test",
		setWidget: (lines: string[]) => calls.push({ key: FOLLOWUP_WIDGET_KEY, lines }),
	});
	expect(r.mode).toBe("advisory");
	const named = calls.filter((c) => c.lines.length === 1).map((c) => c.lines[0]);
	expect(named).toContain(`followup gate: call in progress · ${CANDIDATE.title}`);
	expect(named).toContain(`followup gate: call in progress · ${OTHER.title}`);
	// The settle: the LAST call clears — zero lines after settle.
	expect(calls[calls.length - 1]!.lines).toEqual([]);
	expect(renderFollowupInFlight(null)).toEqual([]);
	expect(renderFollowupInFlight({ title: "X" })).toEqual(["followup gate: call in progress · X"]);
});
