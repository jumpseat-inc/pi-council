// EV-69 — deterministic routing to Verify mode: unit claims for the pure
// routing module and its tool seam.
//
// Spec: docs/superpowers/specs/2026-09-21-EV-69-design.md §3, §5, §6, §9.1.
// Every test runs over a mkdtemp repo; the one re-gate call the TOOL may
// issue goes to a loopback decisions stub hosted by the test process. The
// routing read itself never POSTs (T1) — that is a property of the import
// graph, pinned here both statically (source canary) and dynamically
// (loopback-stub route read records POST === 0).
//
// Claims pinned here: T1 (no gate call), T2 (hash join + changed text),
// T3 (hash is tree-sensitive), T4 (duplicate hashes — agreeing latest file
// order, disagreeing strongest), T5 (Q(d) unpackable), T6 (off is silent),
// T9 (single literal source), policy-drift fallbacks, the basisSuffix
// ratchet unit, the C3 offline transcription round-trip, and the procedure
// pins (step 2 byte-identical; the three amended council.md surfaces; the
// features-deliver mode-aware criteria table).
import { test, expect, afterEach } from "bun:test";
import { createHash } from "node:crypto";
import * as fs from "node:fs";
import * as http from "node:http";
import * as os from "node:os";
import * as path from "node:path";
import { CONFIG_DIR_NAME } from "@earendil-works/pi-coding-agent";
import { GATE_PINNED_MODEL, decide, loadGateDecision, loadGateQuestions } from "../extensions/gate.ts";
import { buildGateState } from "../extensions/gate-state.ts";
import {
	appendGateCall,
	gateLedgerPath,
	readGateLedger,
	rederiveResolvedMode,
	type DecideFn,
	type GateAnswer,
	type GateLedgerRecord,
} from "../extensions/gate-ledger.ts";
import type { GateTransport } from "../extensions/gate-transport.ts";
import { runGate } from "../extensions/gate-run.ts";
import { registerGateTool } from "../extensions/gate-tool.ts";
import { parseCardFile, resolveRoute } from "../extensions/gate-route.ts";
import { registerRouteTool } from "../extensions/gate-route-tool.ts";

// ---------------------------------------------------------------------------
// Fixtures — answers that decide() resolves under the packaged decision policy
// ---------------------------------------------------------------------------

/** composite 2.80 ≥ verify threshold 2.60, < direct 3.40 → Verify. No
 * override fires (each override option's side probability is 0.3 ≤ 0.5). */
const VERIFY_ANSWERS = {
	reversible: { type: "noul", probability: 0.7 },
	publicContract: { type: "noul", probability: 0.3 },
	blastRadius: { type: "noul", probability: 0.3 },
	decidablyTestable: { type: "choice", value: "yes", probabilities: { yes: 0.7, no: 0.3 }, confidence: 0.75 },
};

/** composite 3.60 ≥ direct threshold 3.40 → Direct. No override fires. */
const DIRECT_ANSWERS = {
	reversible: { type: "noul", probability: 0.9 },
	publicContract: { type: "noul", probability: 0.1 },
	blastRadius: { type: "noul", probability: 0.1 },
	decidablyTestable: { type: "choice", value: "yes", probabilities: { yes: 0.9, no: 0.1 }, confidence: 0.9 },
};

/** A hard override fires: blastRadius? yes (cross-module blast radius) →
 * Deliberate regardless of the composite. */
const OVERRIDE_ANSWERS = {
	reversible: { type: "noul", probability: 0.7 },
	publicContract: { type: "noul", probability: 0.3 },
	blastRadius: { type: "noul", probability: 0.9 },
	decidablyTestable: { type: "choice", value: "yes", probabilities: { yes: 0.7, no: 0.3 }, confidence: 0.75 },
};

const CARD_MD = `---
id: EV-909
title: Verify routing probe
state: In Progress
epic: EPIC-13
goal: A probe card routed to Verify by a recorded ledger decision
---

## Intent

A probe card for the EV-69 falsifier.

## Acceptance

The recorded Verify decision routes this card without deliberation dispatch.
`;

function decideWith(repoRoot: string): DecideFn {
	return (answers) => decide(answers, loadGateDecision(repoRoot)).mode;
}

function tmpRepo(prefix: string): string {
	return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function writePolicy(repo: string, mode: "off" | "advisory" | "active", endpoint: string, opts: { budget?: number } = {}): void {
	const dir = path.join(repo, CONFIG_DIR_NAME, "council", "gate");
	fs.mkdirSync(dir, { recursive: true });
	const policy: Record<string, unknown> = {
		policyVersion: "ev69-test-policy-1",
		mode,
		model: GATE_PINNED_MODEL,
		endpoint,
	};
	const budget = opts.budget ?? (mode === "off" ? undefined : 32000);
	if (budget !== undefined) policy.gateStateBudgetTokens = budget;
	fs.writeFileSync(path.join(dir, "policy.json"), JSON.stringify(policy, null, 2));
}

function writeCard(repo: string, md: string, rel = "council/cards/EV-909.md"): string {
	const file = path.join(repo, rel);
	fs.mkdirSync(path.dirname(file), { recursive: true });
	fs.writeFileSync(file, md);
	return file;
}

function parseOf(md: string): ReturnType<typeof parseCardFile> {
	return parseCardFile(md);
}

function resolveRouteOf(md: string, repoRoot: string): ReturnType<typeof resolveRoute> {
	return resolveRoute(md, repoRoot);
}

/** Append one recorded call line whose stateHash matches the card's packed
 * state on disk. Fixture sanity: unless the caller is deliberately testing
 * an invalid line, the answers re-derive to the recorded mode under the
 * CURRENT decision policy and the policyVersion is the current one. */
function appendRecorded(
	repo: string,
	card: ReturnType<typeof parseCardFile>,
	resolvedMode: string,
	answers: Record<string, unknown>,
	opts: { policyVersion?: string; skipSanity?: boolean } = {},
): GateLedgerRecord {
	const state = buildGateState(card, repo);
	const questions = loadGateQuestions(repo);
	const decisionPolicy = loadGateDecision(repo);
	const policyVersion = opts.policyVersion ?? decisionPolicy.version;
	if (!opts.skipSanity) {
		const record = { answers, policyVersion } as unknown as GateLedgerRecord;
		expect(rederiveResolvedMode(record, decideWith(repo))).toBe(resolvedMode);
	}
	return appendGateCall(
		{
			stateHash: state.stateHash,
			questionSetVersion: questions.version,
			questionIds: Object.keys(questions.questions),
			answers: answers as Record<string, GateAnswer>,
			resolvedMode,
			policyVersion,
			basis: `fixture line resolving ${resolvedMode}`,
		},
		repo,
	);
}

// ---------------------------------------------------------------------------
// Loopback decisions stub (only the TOOL's re-gate call may ever reach it)
// ---------------------------------------------------------------------------

interface StubHandle {
	url: string;
	postCount(): number;
	close(): Promise<void>;
}

function startStub(canned: Record<string, { answers: Record<string, unknown> }>): Promise<StubHandle> {
	let posts = 0;
	const server = http.createServer((req, res) => {
		let raw = "";
		req.on("data", (c: Buffer) => (raw += c.toString("utf-8")));
		req.on("end", () => {
			posts++;
			const body = JSON.parse(raw) as { state?: { card?: { id?: string } } };
			const cardId = body?.state?.card?.id ?? "";
			const hit = canned[cardId];
			res.writeHead(200, { "Content-Type": "application/json" });
			res.end(
				JSON.stringify(
					hit
						? {
							model: `${GATE_PINNED_MODEL}-20260917`,
							answers: hit.answers,
							usage: { input_tokens: 10, output_tokens: 5, cost: 0.001 },
							provider: "Typesafe",
							id: `gen-ev69-${cardId}`,
						}
						: { model: `${GATE_PINNED_MODEL}-20260917`, answers: {}, usage: { input_tokens: 1, output_tokens: 1, cost: 0 }, provider: "Typesafe", id: "gen-ev69-unknown" },
				),
			);
		});
	});
	return new Promise((resolve) => {
		server.listen(0, "127.0.0.1", () => {
			const port = (server.address() as { port: number }).port;
			resolve({
				url: `http://127.0.0.1:${port}/decisions`,
				postCount: () => posts,
				close: () => new Promise((r) => server.close(() => r())),
			});
		});
	});
}

interface RegisteredTool {
	name: string;
	execute(id: string, params: any, signal: AbortSignal | undefined, onUpdate: unknown, ctx: any): Promise<any>;
}

function captureTool(repo: string, register: (pi: any, repoRoot: string) => void): RegisteredTool {
	const tools: RegisteredTool[] = [];
	const pi = { registerTool: (t: RegisteredTool) => tools.push(t) } as unknown as Parameters<typeof register>[0];
	register(pi, repo);
	return tools[0]!;
}

let stub: StubHandle | undefined;
let repo: string | undefined;

afterEach(async () => {
	await stub?.close();
	stub = undefined;
	if (repo) {
		fs.rmSync(repo, { recursive: true, force: true });
		repo = undefined;
	}
});

const srcOf = (f: string): string => fs.readFileSync(path.join(import.meta.dir, "..", "extensions", f), "utf-8");

// ---------------------------------------------------------------------------
// T1 — no gate call from the routing read (import fence + dynamic POST count)
// ---------------------------------------------------------------------------

test("T1: gate-route.ts's import graph references no gate-call surface — no runGate/transport/render/tool import edge", () => {
	const src = srcOf("gate-route.ts");
	// Strip comments — the canary pins the import graph and the code, not the
	// prose that documents the fence.
	const code = src
		.replace(/\/\*[\s\S]*?\*\//g, "")
		.split("\n")
		.map((l) => l.replace(/(^|[^:])\/\/.*$/, "$1"))
		.join("\n");
	// no runtime import edge to any execution-path module
	for (const banned of ["gate-run.ts", "gate-transport.ts", "gate-render.ts", "gate-tool.ts"]) {
		expect(
			(code.match(new RegExp(`from ["']\\./${banned.replaceAll(".", "\\.")}`)) ?? []).length,
			`gate-route.ts must not import ${banned}`,
		).toBe(0);
	}
	// and no call surface in the code body
	expect(code.includes("runGate")).toBe(false);
	expect(code.includes("fetch(")).toBe(false);
});

test("T1: a route read through the real council_route tool issues zero POSTs (loopback stub observes none)", async () => {
	repo = tmpRepo("ev69-t1-");
	stub = await startStub({});
	writePolicy(repo, "active", stub.url); // active — a re-gate WOULD post; the route read must not
	const cardPath = writeCard(repo, CARD_MD);
	const tool = captureTool(repo, registerRouteTool);
	const res = await tool.execute("t1", { op: "route", cardPath }, undefined, undefined, { hasUI: false });
	const out = JSON.parse(res.content[0].text);
	expect(out.source).toBe("fallback"); // no recorded decision exists
	expect(out.mode).toBe("Deliberate");
	expect(stub.postCount()).toBe(0);
	expect(fs.existsSync(gateLedgerPath(repo))).toBe(false); // the route read writes nothing
});

// ---------------------------------------------------------------------------
// T2 — hash join: recorded mode for the unchanged card, full for changed text
// ---------------------------------------------------------------------------

test("T2: a recorded line for the card's packed state resolves verbatim; one changed Acceptance character routes full", () => {
	repo = tmpRepo("ev69-t2-");
	writePolicy(repo, "advisory", "https://gate.test/never-called");
	writeCard(repo, CARD_MD);
	const card = parseOf(CARD_MD);
	const recorded = appendRecorded(repo, card, "Verify", VERIFY_ANSWERS);

	const route = resolveRouteOf(CARD_MD, repo);
	expect(route.mode).toBe("Verify");
	expect(route.source).toBe("recorded");
	expect(route.stateHash).toBe(buildGateState(card, repo).stateHash);
	expect(route.matchedCallId).toBe(recorded.callId);

	// one character changed in ## Acceptance → a different packed state → no
	// matching record → full path, and the routing read issues no gate call.
	const changed = CARD_MD.replace("without deliberation dispatch.", "without deliberation dispatch.X");
	const changedRoute = resolveRouteOf(changed, repo);
	expect(changedRoute.mode).toBe("Deliberate");
	expect(changedRoute.source).toBe("fallback");
	expect(changedRoute.stateHash).toBeUndefined();
	expect(changedRoute.matchedCallId).toBeUndefined();
});

// ---------------------------------------------------------------------------
// T3 — the hash is tree-sensitive: a new test file changes the packed state
// ---------------------------------------------------------------------------

test("T3: adding an unrelated test file between the ledger write and the read routes full (unchanged packed state is the contract)", () => {
	repo = tmpRepo("ev69-t3-");
	writePolicy(repo, "advisory", "https://gate.test/never-called");
	writeCard(repo, CARD_MD);
	const card = parseOf(CARD_MD);
	appendRecorded(repo, card, "Verify", VERIFY_ANSWERS);
	expect(resolveRouteOf(CARD_MD, repo).mode).toBe("Verify");

	const sentinel = path.join(repo, "test");
	fs.mkdirSync(sentinel, { recursive: true });
	fs.writeFileSync(path.join(sentinel, "zz-drift-sentinel.test.ts"), "// tree drift — changes the packed tests section\n");

	const drifted = resolveRouteOf(CARD_MD, repo);
	expect(drifted.mode).toBe("Deliberate");
	expect(drifted.source).toBe("fallback");
	expect(drifted.basis).toContain("no recorded decision for the current packed state");
});

// ---------------------------------------------------------------------------
// T4 — duplicate hashes: agreeing → latest file order; disagreeing → strongest
// ---------------------------------------------------------------------------

test("T4: agreeing duplicates resolve to the latest line in file order", () => {
	repo = tmpRepo("ev69-t4a-");
	writePolicy(repo, "advisory", "https://gate.test/never-called");
	writeCard(repo, CARD_MD);
	const card = parseOf(CARD_MD);
	const first = appendRecorded(repo, card, "Verify", VERIFY_ANSWERS);
	const second = appendRecorded(repo, card, "Verify", VERIFY_ANSWERS);
	const route = resolveRouteOf(CARD_MD, repo);
	expect(route.mode).toBe("Verify");
	expect(route.matchedCallId).toBe(second.callId);
	expect(route.matchedCallId).not.toBe(first.callId);
});

test("T4: disagreeing duplicates resolve to the strongest valid mode — Verify over Direct, Deliberate over both", () => {
	repo = tmpRepo("ev69-t4b-");
	writePolicy(repo, "advisory", "https://gate.test/never-called");
	writeCard(repo, CARD_MD);
	const card = parseOf(CARD_MD);
	appendRecorded(repo, card, "Verify", VERIFY_ANSWERS);
	appendRecorded(repo, card, "Direct", DIRECT_ANSWERS);
	expect(resolveRouteOf(CARD_MD, repo).mode).toBe("Verify");

	appendRecorded(repo, card, "Deliberate", OVERRIDE_ANSWERS);
	expect(resolveRouteOf(CARD_MD, repo).mode).toBe("Deliberate");
});

// ---------------------------------------------------------------------------
// T5 — EV-66 Q(d): a card without ## Acceptance is unpackable → full, named
// ---------------------------------------------------------------------------

test("T5: a card file with no ## Acceptance routes full with the packer's named basis — no ledger line, zero POSTs", async () => {
	repo = tmpRepo("ev69-t5-");
	stub = await startStub({});
	writePolicy(repo, "active", stub.url);
	const cardPath = writeCard(repo, CARD_MD.replace(/\n## Acceptance\n[\s\S]*$/, "\n"));
	const tool = captureTool(repo, registerRouteTool);
	const res = await tool.execute("t5", { op: "route", cardPath }, undefined, undefined, { hasUI: false });
	const out = JSON.parse(res.content[0].text);
	expect(out.mode).toBe("Deliberate");
	expect(out.source).toBe("full-unpackable");
	expect(out.basis).toContain("card.acceptance");
	expect(fs.existsSync(gateLedgerPath(repo))).toBe(false);
	expect(stub.postCount()).toBe(0);
});

// ---------------------------------------------------------------------------
// T6 — off is silent: the off check precedes any budget load or hash
// ---------------------------------------------------------------------------

test("T6: an off-mode policy routes full with the off basis before any state build (an off policy may omit the budget)", () => {
	repo = tmpRepo("ev69-t6-");
	writePolicy(repo, "off", "https://gate.test/never-called", { budget: undefined });
	writeCard(repo, CARD_MD);
	const route = resolveRouteOf(CARD_MD, repo);
	expect(route.mode).toBe("Deliberate");
	expect(route.source).toBe("fallback");
	expect(route.basis).toBe("gate mode off — no recorded decision");
	expect(route.stateHash).toBeUndefined();
	expect(fs.existsSync(gateLedgerPath(repo))).toBe(false);
});

// ---------------------------------------------------------------------------
// T9 — single literal source: no mode literal of its own
// ---------------------------------------------------------------------------

test("T9: gate-route.ts imports the mode vocabulary and contains no quoted mode literal of its own", () => {
	const src = srcOf("gate-route.ts");
	expect(src.includes("GATE_DECISION_MODES")).toBe(true);
	expect(src.includes("MODE_PANELS")).toBe(true);
	expect(src.includes('from "./runs.ts"')).toBe(true);
	expect(src.includes("DispatchMode")).toBe(true);
	const quoted = src.match(/"(Deliberate|Verify|Direct)"/g) ?? [];
	expect(quoted, `gate-route.ts must not carry its own mode literals, found ${JSON.stringify(quoted)}`).toEqual([]);
});

// ---------------------------------------------------------------------------
// Policy drift — stale policyVersion and re-derivation mismatch both route full
// ---------------------------------------------------------------------------

test("policy drift: a recorded line under a stale policyVersion routes full with a basis naming the drift — never the stale reduced mode", () => {
	repo = tmpRepo("ev69-drift-");
	writePolicy(repo, "advisory", "https://gate.test/never-called");
	writeCard(repo, CARD_MD);
	appendRecorded(repo, parseOf(CARD_MD), "Verify", VERIFY_ANSWERS, { policyVersion: "stale-policy-0" });
	const route = resolveRouteOf(CARD_MD, repo);
	expect(route.mode).toBe("Deliberate");
	expect(route.source).toBe("fallback");
	expect(route.basis).toContain("policyVersion");
});

test("re-derivation drift: a line whose answers re-derive to a different mode is invalid — routes full, never the recorded token", () => {
	repo = tmpRepo("ev69-rederive-");
	writePolicy(repo, "advisory", "https://gate.test/never-called");
	writeCard(repo, CARD_MD);
	// resolvedMode says Verify but the answers re-derive to Direct → invalid.
	appendRecorded(repo, parseOf(CARD_MD), "Verify", DIRECT_ANSWERS, { skipSanity: true });
	const route = resolveRouteOf(CARD_MD, repo);
	expect(route.mode).toBe("Deliberate");
	expect(route.source).toBe("fallback");
	expect(route.basis).toContain("re-derive");
});

// ---------------------------------------------------------------------------
// basisSuffix — the ratchet note rides basis in the ONE append (spec §5)
// ---------------------------------------------------------------------------

test("basisSuffix: the post-decide hook appends the ratchet note into the line's basis; absent opt appends nothing", async () => {
	repo = tmpRepo("ev69-suffix-");
	writePolicy(repo, "active", "https://gate.test/never-called");
	const card = parseOf(CARD_MD);
	const questions = loadGateQuestions(repo);
	const decisionPolicy = loadGateDecision(repo);
	const policy = { policyVersion: "p", mode: "active" as const, model: GATE_PINNED_MODEL, endpoint: "https://gate.test/x", gateStateBudgetTokens: 32000 };
	const transport: GateTransport = async () => ({
		ok: true,
		status: 200,
		body: JSON.stringify({
			model: `${GATE_PINNED_MODEL}-20260917`,
			answers: DIRECT_ANSWERS,
			usage: { input_tokens: 1, output_tokens: 1, cost: 0 },
			provider: "Typesafe",
			id: "gen-suffix",
		}),
	});

	// hook form: the note rides the ONE line, verdict verbatim
	await runGate(buildGateState(card, repo), questions, {
		repoRoot: repo,
		policy,
		decisionPolicy,
		transport,
		apiKey: "dummy",
		basisSuffix: (decision) =>
			decision.mode === "Direct"
				? "ratchet holds Verify — recorded mode stands over the re-gate verdict Direct"
				: undefined,
	});
	const hooked = readGateLedger(repo).calls.at(-1)!;
	expect(hooked.resolvedMode).toBe("Direct");
	expect(rederiveResolvedMode(hooked, decideWith(repo))).toBe("Direct");
	expect(hooked.basis).toContain("ratchet holds Verify");
	expect(hooked.basis).toContain("composite 3.60");

	// default: no opt → the basis is byte-identical to the decision's own
	await runGate(buildGateState(card, repo), questions, {
		repoRoot: repo,
		policy,
		decisionPolicy,
		transport,
		apiKey: "dummy",
	});
	const plain = readGateLedger(repo).calls.at(-1)!;
	expect(plain.basis).toBe("composite 3.60 ≥ direct threshold 3.40");
});

// ---------------------------------------------------------------------------
// C3 — offline transcription round-trip through the REAL council_gate tool
// ---------------------------------------------------------------------------

test("C3: a council_gate invocation transcribed verbatim from a card file hashes equal to a disk rebuild; one changed character diverges", async () => {
	repo = tmpRepo("ev69-c3-");
	stub = await startStub({ "EV-909": { answers: VERIFY_ANSWERS } });
	writePolicy(repo, "advisory", stub.url);
	const cardPath = writeCard(repo, CARD_MD);
	const parsed = parseOf(fs.readFileSync(cardPath, "utf-8"));

	const gate = captureTool(repo, registerGateTool);
	await gate.execute(
		"c3",
		{ cards: [{ id: parsed.id, title: parsed.title, goal: parsed.goal, acceptance: parsed.acceptance }] },
		undefined,
		undefined,
		{ hasUI: false },
	);
	const calls = readGateLedger(repo).calls;
	expect(calls).toHaveLength(1);
	// the transcribed invocation hashes EXACTLY what the on-disk card rebuilds
	expect(calls[0]!.stateHash).toBe(buildGateState(parseOf(fs.readFileSync(cardPath, "utf-8")), repo).stateHash);

	// one changed Acceptance character → a different packed state → unequal
	await gate.execute(
		"c3b",
		{ cards: [{ id: parsed.id, title: parsed.title, goal: parsed.goal, acceptance: `${parsed.acceptance}X` }] },
		undefined,
		undefined,
		{ hasUI: false },
	);
	const calls2 = readGateLedger(repo).calls;
	expect(calls2).toHaveLength(2);
	expect(calls2[1]!.stateHash).not.toBe(calls[0]!.stateHash);
});

// ---------------------------------------------------------------------------
// Procedure pins — the amended surface is EXACTLY three things; step 2 is
// byte-identical (PO ruling Item A); the block is present with its roster.
// ---------------------------------------------------------------------------

const PKG_PROCEDURES = path.join(import.meta.dir, "..", "council", "procedures");

test("procedure pin: council.md step 2 is byte-identical to the pre-EV-69 text", () => {
	const text = fs.readFileSync(path.join(PKG_PROCEDURES, "council.md"), "utf-8");
	const start = text.indexOf("## 2. Independent first pass");
	const end = text.indexOf("## 3. Bounded exchange");
	expect(start).toBeGreaterThan(-1);
	expect(end).toBeGreaterThan(start);
	const slice = text.slice(start, end);
	const sha = createHash("sha256").update(slice, "utf8").digest("hex");
	// sha256 of the pre-amendment step-2 slice (EV-69 PO ruling Item A: step 2
	// is NOT amended — the re-route block lives after the step-8→9 boundary).
	expect(sha).toBe("3def4e83919165a2304a89f50cfff41a22abe00d4be953d615cc3856719975ff");
});

test("procedure pin: step 1 defers to a recorded mode and records the surface bit regardless of it", () => {
	const text = fs.readFileSync(path.join(PKG_PROCEDURES, "council.md"), "utf-8");
	const start = text.indexOf("## 1. Read and gate");
	const end = text.indexOf("## 2. Independent first pass");
	const step1 = text.slice(start, end).replace(/\s+/g, " ");
	expect(step1).toContain("council_route");
	expect(step1).toContain('`op: "route"`');
	expect(step1).toContain("authoritative");
	expect(step1).toContain("REGARDLESS of recorded mode");
	expect(step1).toContain("follow-up card");
});

test("procedure pin: the step-8→9 boundary calls recheck before the skeptic dispatch, and ONE re-route block resumes at step 3", () => {
	const text = fs.readFileSync(path.join(PKG_PROCEDURES, "council.md"), "utf-8");
	const step9 = text.indexOf("## 9. Verify by acting");
	const step10 = text.indexOf("## 10. Judge the stop condition");
	expect(step9).toBeGreaterThan(-1);
	expect(step10).toBeGreaterThan(step9);
	const slice = text.slice(step9, step10).replace(/\s+/g, " ");
	expect(slice).toContain('`op: "recheck"`');
	expect(slice).toContain("Re-route block");
	expect(slice).toContain("principal");
	expect(slice).toContain("designer");
	expect(slice).toContain("RESUMES AT STEP 3");
	expect(slice).toContain("only if the deliberation overturns");
	expect(slice).toContain("first-pass record");
	expect(slice).toContain("not re-run");
});

test("procedure pin: features-deliver's merge check is mode-aware via council_route op authority", () => {
	const text = fs.readFileSync(path.join(PKG_PROCEDURES, "features-deliver.md"), "utf-8");
	const start = text.indexOf("## The deterministic merge check");
	const end = text.indexOf("## Guards");
	const mergeCheck = text.slice(start, end).replace(/\s+/g, " ");
	expect(mergeCheck).toContain('`op: "authority"`');
	expect(mergeCheck).toContain("| Deliberate |");
	expect(mergeCheck).toContain("| Verify |");
	expect(mergeCheck).toContain("| Direct |");
	expect(mergeCheck).toContain("single** Verify skeptic dispatch");
	expect(mergeCheck).toContain("Criteria 1, 2, and 5");
});
