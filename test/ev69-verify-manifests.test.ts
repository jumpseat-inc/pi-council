// EV-69 — the dispatch-multiset falsifier (spec §9.2).
//
// A scripted harness run over a Verify-routed card: the dispatches are
// scripted per the amended council.md, and the route read / re-check that
// DECIDE those dispatches are produced by the REAL `council_route` tool
// function (captured through a fake ExtensionAPI — the test/gate-tool.test.ts
// precedent — never a stub of it). The claims are asserted over the run's
// manifests (`readManifests`) and the gate ledger's call lines.
//
// The headline claim is conditioned on scripted execution, per the card
// goal's own final clause: this falsifier proves the manifest shape of a
// scripted run; it claims NOTHING about whether a live facilitator would
// call council_route — the manifest record cannot show that.
//
// Red at base: nothing wrote `mode` and nothing routed when this falsifier
// was authored (see the red-base record in the PR description).
//
// CI-hermeticity (fix cycle 1): the re-gate-bearing arms (re-route, ratchet)
// drive the REAL council_route recheck, whose runGate resolves the OpenRouter
// credential from ambient state (env → stored credential) when no explicit
// apiKey is passed. On CI nothing resolves, the re-gate fail-closes with
// "no OpenRouter API key resolved", and every re-gate verdict degrades to
// Deliberate — exactly the red seen at ab13a4c. Locally the ambient key
// masked it. The gate POSTs to the scratch policy's loopback stub, so the
// key value is never exercised — a dummy default suffices (the ev66
// precedent: OPENROUTER_API_KEY: "ev66-dummy-key" at
// test/ev66-advisory-intake.test.ts:456). The re-gate here runs IN-PROCESS
// (registerRouteTool → recheck → runGate in this bun process), so the
// per-arm child-env shape of ev66 becomes a module-level default. `??=`: a
// real ambient key wins and is equally fine; no arm in this file asserts
// the key-absent fail-closed basis.
if (!process.env.OPENROUTER_API_KEY) process.env.OPENROUTER_API_KEY = "ev69-dummy-key";

import { test, expect, afterAll } from "bun:test";
import { execFileSync } from "node:child_process";
import * as fs from "node:fs";
import * as http from "node:http";
import * as os from "node:os";
import * as path from "node:path";
import { CONFIG_DIR_NAME } from "@earendil-works/pi-coding-agent";
import { GATE_PINNED_MODEL, decide, loadGateDecision, loadGateQuestions } from "../extensions/gate.ts";
import { buildGateState } from "../extensions/gate-state.ts";
import { appendGateCall, readGateLedger, rederiveResolvedMode, type DecideFn, type GateAnswer, type GateLedgerRecord } from "../extensions/gate-ledger.ts";
import { Hub } from "../extensions/hub.ts";
import { ensureRunDir, readManifests, writeManifest, type RunManifest } from "../extensions/runs.ts";
import { effectiveModeForCard, parseCardFile } from "../extensions/gate-route.ts";
import { registerRouteTool } from "../extensions/gate-route-tool.ts";

// ---------------------------------------------------------------------------
// Fixtures — the three verdict shapes the packaged decision policy produces
// ---------------------------------------------------------------------------

/** composite 2.80 → Verify. No override fires. */
const VERIFY_ANSWERS = {
	reversible: { type: "noul", probability: 0.7 },
	publicContract: { type: "noul", probability: 0.3 },
	blastRadius: { type: "noul", probability: 0.3 },
	decidablyTestable: { type: "choice", value: "yes", probabilities: { yes: 0.7, no: 0.3 }, confidence: 0.75 },
};

/** composite 3.60 ≥ direct 3.40 → Direct (the ratchet arm's re-gate verdict). */
const DIRECT_ANSWERS = {
	reversible: { type: "noul", probability: 0.9 },
	publicContract: { type: "noul", probability: 0.1 },
	blastRadius: { type: "noul", probability: 0.1 },
	decidablyTestable: { type: "choice", value: "yes", probabilities: { yes: 0.9, no: 0.1 }, confidence: 0.9 },
};

/** blastRadius? yes fires → Deliberate (the re-route arm's re-gate verdict). */
const OVERRIDE_ANSWERS = {
	reversible: { type: "noul", probability: 0.7 },
	publicContract: { type: "noul", probability: 0.3 },
	blastRadius: { type: "noul", probability: 0.9 },
	decidablyTestable: { type: "choice", value: "yes", probabilities: { yes: 0.7, no: 0.3 }, confidence: 0.75 },
};

const CARD_ID = "EV-909";
const CARD_MD = `---
id: ${CARD_ID}
title: Verify routing probe
state: In Progress
epic: EPIC-13
goal: A probe card routed to Verify by a recorded ledger decision
---

## Intent

A probe card for the EV-69 dispatch-multiset falsifier.

## Acceptance

The recorded Verify decision routes this card without deliberation dispatch.
`;

const STUB = path.join(import.meta.dir, "stub-child.ts");
const RUN = "run-ev69";
const RUNNER_SEAT = "council-runner";

function decideWith(repoRoot: string): DecideFn {
	return (answers) => decide(answers, loadGateDecision(repoRoot)).mode;
}

function git(repo: string, args: string[]): string {
	return execFileSync("git", ["-C", repo, ...args], { encoding: "utf-8" }).trim();
}

interface StubHandle {
	url: string;
	postCount(): number;
	close(): Promise<void>;
}

const openStubs: StubHandle[] = [];
const openRepos: string[] = [];

afterAll(async () => {
	for (const s of openStubs.splice(0)) await s.close();
	for (const r of openRepos.splice(0)) {
		try {
			fs.rmSync(r, { recursive: true, force: true });
		} catch {
			/* best effort */
		}
	}
});

function startStub(canned: Record<string, { answers: Record<string, unknown> }>): Promise<StubHandle> {
	let posts = 0;
	const server = http.createServer((req, res) => {
		let raw = "";
		req.on("data", (c: Buffer) => (raw += c.toString("utf-8")));
		req.on("end", () => {
			posts++;
			const body = JSON.parse(raw) as { state?: { card?: { id?: string } } };
			const hit = canned[body?.state?.card?.id ?? ""];
			res.writeHead(200, { "Content-Type": "application/json" });
			res.end(
				JSON.stringify(
					hit
						? { model: `${GATE_PINNED_MODEL}-20260917`, answers: hit.answers, usage: { input_tokens: 10, output_tokens: 5, cost: 0.001 }, provider: "Typesafe", id: `gen-ev69-${body?.state?.card?.id}` }
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

interface Scratch {
	repo: string;
	cardPath: string;
	baseSha: string;
	ledgerCalls(): GateLedgerRecord[];
}

/** A scratch repo that IS a git repo (the observed-set read is a diff against
 * the pinned merge-base), with a card file, a repo-local advisory gate policy
 * pointing at the test's own loopback stub, and a recorded Verify decision
 * line whose stateHash matches the card's packed state on disk. */
async function buildScratch(label: string, canned: Record<string, { answers: Record<string, unknown> }>): Promise<Scratch> {
	const stub = await startStub(canned);
	openStubs.push(stub);
	const repo = fs.mkdtempSync(path.join(os.tmpdir(), `ev69-${label}-`));
	openRepos.push(repo);
	const cardPath = path.join(repo, "council", "cards", `${CARD_ID}.md`);
	fs.mkdirSync(path.dirname(cardPath), { recursive: true });
	fs.writeFileSync(cardPath, CARD_MD);
	const gateDir = path.join(repo, CONFIG_DIR_NAME, "council", "gate");
	fs.mkdirSync(gateDir, { recursive: true });
	fs.writeFileSync(
		path.join(gateDir, "policy.json"),
		JSON.stringify({ policyVersion: "ev69-falsifier-1", mode: "advisory", model: GATE_PINNED_MODEL, endpoint: stub.url, gateStateBudgetTokens: 32000 }, null, 2),
	);
	execFileSync("git", ["-C", repo, "init", "-q", "-b", "main"]);
	execFileSync("git", ["-C", repo, "add", "-A"]);
	execFileSync("git", ["-C", repo, "-c", "user.email=falsifier@test", "-c", "user.name=falsifier", "commit", "-qm", "base"]);
	execFileSync("git", ["-C", repo, "update-ref", "refs/remotes/origin/main", "HEAD"]);
	const baseSha = git(repo, ["rev-parse", "HEAD"]);
	// the recorded Verify decision the run consumes — keyed by the card's
	// packed state exactly as intake recorded it (touchedFiles [])
	const card = buildGateState(parseCardFile(fs.readFileSync(cardPath, "utf-8")), repo);
	const questions = loadGateQuestions(repo);
	const decisionPolicy = loadGateDecision(repo);
	const record = appendGateCall(
		{
			stateHash: card.stateHash,
			questionSetVersion: questions.version,
			questionIds: Object.keys(questions.questions),
			answers: VERIFY_ANSWERS as Record<string, GateAnswer>,
			resolvedMode: "Verify",
			policyVersion: decisionPolicy.version,
			basis: "composite 2.80 ≥ verify threshold 2.60",
		},
		repo,
	);
	expect(rederiveResolvedMode(record, decideWith(repo))).toBe("Verify"); // fixture sanity
	return { repo, cardPath, baseSha, ledgerCalls: () => readGateLedger(repo).calls };
}

interface RegisteredTool {
	name: string;
	execute(id: string, params: any, signal: AbortSignal | undefined, onUpdate: unknown, ctx: any): Promise<any>;
}

function captureRouteTool(repo: string): RegisteredTool {
	const tools: RegisteredTool[] = [];
	const pi = { registerTool: (t: RegisteredTool) => tools.push(t) } as unknown as Parameters<typeof registerRouteTool>[0];
	registerRouteTool(pi, repo);
	expect(tools).toHaveLength(1);
	expect(tools[0]!.name).toBe("council_route");
	return tools[0]!;
}

async function runTool(tool: RegisteredTool, params: Record<string, unknown>): Promise<any> {
	const res = await tool.execute("falsifier", params, undefined, undefined, { hasUI: false });
	return JSON.parse(res.content[0].text);
}

let dispatchSeq = 0;

/** Scripted dispatch through the REAL dispatch path (Hub + stub child): the
 * ROOT dispatch carries the mode; children carry none (EV-68). */
async function dispatch(repo: string, runId: string, seat: string, opts: { mode?: RunManifest["mode"]; parentJobId?: string } = {}): Promise<string> {
	ensureRunDir(repo, runId);
	const hub = new Hub({
		monitorIntervalMs: 50,
		run: { repoRoot: repo, runId, ...(opts.parentJobId ? { parentJobPath: opts.parentJobId } : {}) },
	});
	try {
		// A fresh Hub restarts its id counter — the manifest file is keyed by id,
		// so two hubs would collide and overwrite each other's rows. Unique ids.
		const id = `ev69job-${++dispatchSeq}`;
		hub.spawnJob({
			id,
			seat,
			model: "stub/x",
			command: "bun",
			args: [STUB],
			cwd: import.meta.dir,
			env: { ...process.env, STUB_MODE: "emit" } as Record<string, string>,
			timeoutMs: 60_000,
			stallMs: 60_000,
			...(opts.mode ? { mode: opts.mode } : {}),
		});
		const [r] = await hub.wait([id], 20_000);
		if (r.state !== "done") throw new Error(`stub ${seat} dispatch did not settle done: ${r.state}`);
		return id;
	} finally {
		hub.shutdown();
	}
}

let seq = 0;
function putManifest(repo: string, over: Partial<RunManifest> & { id: string; seat: string }): RunManifest {
	const m: RunManifest = {
		id: over.id,
		seat: over.seat,
		model: "m/x",
		parentJobId: over.parentJobId ?? null,
		pid: null,
		sessionId: over.id,
		state: "done",
		startedAt: Date.now() + seq++,
		settledAt: Date.now(),
		exitCode: 0,
		...(over.mode !== undefined ? { mode: over.mode } : {}),
	};
	writeManifest(repo, RUN, m);
	return m;
}

function ensureRun(repo: string): void {
	fs.mkdirSync(path.join(repo, CONFIG_DIR_NAME, "council", "runs", RUN), { recursive: true });
}

// ---------------------------------------------------------------------------
// Clean Verify arm — the headline claim
// ---------------------------------------------------------------------------

test("clean Verify arm: ROOT mode Verify, owner/skeptic/judge == 1 each, five seats == 0, zero new gate call lines", async () => {
	const s = await buildScratch("clean", {});
	const before = s.ledgerCalls().length;
	const tool = captureRouteTool(s.repo);

	// step 1 — the facilitator's route read, through the real tool
	const route = await runTool(tool, { op: "route", cardPath: s.cardPath });
	expect(route.mode).toBe("Verify");
	expect(route.source).toBe("recorded");

	// step-8→9 boundary — the re-check, through the real tool; the pinned head
	// has an empty diff against the pinned base → the record stands, zero calls
	const recheck = await runTool(tool, { op: "recheck", cardPath: s.cardPath, headSha: s.baseSha });
	expect(recheck.rechecked).toBe(false);
	expect(recheck.mode).toBe("Verify");

	// the scripted dispatch set per the amended procedure: one owner ROOT with
	// the routed mode, one skeptic, one judge — no deliberation dispatch
	const rootId = await dispatch(s.repo, RUN, "owner", { mode: "Verify" });
	await dispatch(s.repo, RUN, "skeptic", { parentJobId: rootId });
	await dispatch(s.repo, RUN, "judge", { parentJobId: rootId });

	const ms = readManifests(s.repo, RUN);
	const modeCarriers = ms.filter((m) => m.mode !== undefined);
	expect(modeCarriers.map((m) => m.id)).toEqual([rootId]); // exactly one manifest carries mode
	expect(modeCarriers[0]!.mode).toBe("Verify");
	const seats = ms.map((m) => m.seat);
	const count = (seat: string): number => seats.filter((x) => x === seat).length;
	expect(count("owner")).toBe(1);
	expect(count("skeptic")).toBe(1);
	expect(count("judge")).toBe(1);
	for (const absent of ["principal", "designer", "consolidator", "product-owner", "steward"]) {
		expect(count(absent), `${absent} must be absent from a Verify run`).toBe(0);
	}
	// zero new gate call lines for the unchanged-state path
	expect(s.ledgerCalls().length).toBe(before);
});

// ---------------------------------------------------------------------------
// Re-route arm — the observed set changes the rebuilt hash; the re-gate fires
// ---------------------------------------------------------------------------

test("re-route arm: exactly one new v2 call line naming the fired override; the subtree resolves Deliberate; generators present (no owner-count assertion)", async () => {
	const s = await buildScratch("reroute", { [CARD_ID]: { answers: OVERRIDE_ANSWERS } });
	const before = s.ledgerCalls().length;
	const tool = captureRouteTool(s.repo);
	expect((await runTool(tool, { op: "route", cardPath: s.cardPath })).mode).toBe("Verify");

	// the owner's pushed step-8 branch: one commit touching a file
	execFileSync("git", ["-C", s.repo, "checkout", "-q", "-b", "feat/ev-909"]);
	fs.writeFileSync(path.join(s.repo, "notes.txt"), "owner work\n");
	execFileSync("git", ["-C", s.repo, "add", "-A"]);
	execFileSync("git", ["-C", s.repo, "-c", "user.email=falsifier@test", "-c", "user.name=falsifier", "commit", "-qm", "owner work"]);
	const headSha = git(s.repo, ["rev-parse", "HEAD"]);

	const recheck = await runTool(tool, { op: "recheck", cardPath: s.cardPath, headSha });
	expect(recheck.rechecked).toBe(true);
	expect(recheck.mode).toBe("Deliberate"); // UP-escalation: the fired override wins
	expect(recheck.verdictMode).toBe("Deliberate");
	expect(recheck.recordedMode).toBe("Verify");

	// EXACTLY ONE new v2 call line — the re-gate's own line — naming the fired
	// override (C1b: distinguishable from the intake line at render)
	const calls = s.ledgerCalls();
	expect(calls.length).toBe(before + 1);
	const line = calls.at(-1)!;
	expect(line.schemaVersion).toBe(2);
	expect(line.resolvedMode).toBe("Deliberate");
	expect(rederiveResolvedMode(line, decideWith(s.repo))).toBe("Deliberate");
	expect(line.basis).toContain("blastRadius? yes");
	expect(line.basis).not.toContain("ratchet");

	// the scripted re-route dispatches: principal + designer + consolidator
	// under the runner ROOT (owner is NOT re-dispatched — the design confirmed
	// the branch work; per the PO ruling NO owner-count assertion is made here)
	const rootId = await dispatch(s.repo, RUN, RUNNER_SEAT, { mode: "Verify" });
	await dispatch(s.repo, RUN, "principal", { parentJobId: rootId });
	await dispatch(s.repo, RUN, "designer", { parentJobId: rootId });
	await dispatch(s.repo, RUN, "consolidator", { parentJobId: rootId });

	expect(effectiveModeForCard(s.repo, RUN, rootId)).toBe("Deliberate");
});

// ---------------------------------------------------------------------------
// Ratchet arm (C1) — a Direct landing on a recorded Verify card holds Verify
// ---------------------------------------------------------------------------

test("ratchet arm C1: the line records Direct verbatim, the tool returns effective Verify, the subtree reads Verify, the basis carries the ratchet note", async () => {
	const s = await buildScratch("ratchet", { [CARD_ID]: { answers: DIRECT_ANSWERS } });
	const before = s.ledgerCalls().length;
	const tool = captureRouteTool(s.repo);
	expect((await runTool(tool, { op: "route", cardPath: s.cardPath })).mode).toBe("Verify");

	execFileSync("git", ["-C", s.repo, "checkout", "-q", "-b", "feat/ev-909"]);
	fs.writeFileSync(path.join(s.repo, "notes.txt"), "owner work\n");
	execFileSync("git", ["-C", s.repo, "add", "-A"]);
	execFileSync("git", ["-C", s.repo, "-c", "user.email=falsifier@test", "-c", "user.name=falsifier", "commit", "-qm", "owner work"]);
	const headSha = git(s.repo, ["rev-parse", "HEAD"]);

	const recheck = await runTool(tool, { op: "recheck", cardPath: s.cardPath, headSha });
	expect(recheck.rechecked).toBe(true);
	// (b) the tool returns the EFFECTIVE mode — the ratchet holds Verify
	expect(recheck.mode).toBe("Verify");
	expect(recheck.verdictMode).toBe("Direct");
	expect(recheck.recordedMode).toBe("Verify");

	// (a) the line records the verdict VERBATIM and re-derives true
	const line = s.ledgerCalls().at(-1)!;
	expect(s.ledgerCalls().length).toBe(before + 1);
	expect(line.resolvedMode).toBe("Direct");
	expect(rederiveResolvedMode(line, decideWith(s.repo))).toBe("Direct");
	// (d) the basis carries the ratchet sentence — no invented fired override
	expect(line.basis).toContain("ratchet");
	expect(line.basis).toContain("Verify");
	expect(line.basis).not.toContain("blastRadius? yes");

	// (c) the subtree read gives Verify — no generators were dispatched
	const rootId = await dispatch(s.repo, RUN, "owner", { mode: "Verify" });
	expect(effectiveModeForCard(s.repo, RUN, rootId)).toBe("Verify");

	// the authority surface through the real tool agrees
	const authority = await runTool(tool, { op: "authority", cardPath: s.cardPath, runId: RUN, runnerJobId: rootId });
	expect(authority.mode).toBe("Verify");
});

// ---------------------------------------------------------------------------
// Subtree-read arms for effectiveModeForCard (real writeManifest/readManifests
// forests; the discriminator is the generator set {principal, designer,
// consolidator} — never a MODE_PANELS set-difference)
// ---------------------------------------------------------------------------

test("subtree arms i–iv: generators ⇒ Deliberate; clean Verify ⇒ Verify; Direct ⇒ Direct; product-owner dual-role ⇒ Verify", () => {
	const repo = fs.mkdtempSync(path.join(os.tmpdir(), "ev69-subtree-"));
	openRepos.push(repo);
	ensureRun(repo);

	// (i) generators under the Verify runner ROOT ⇒ Deliberate
	putManifest(repo, { id: "root-i", seat: RUNNER_SEAT, mode: "Verify" });
	putManifest(repo, { id: "root-i.p", seat: "principal", parentJobId: "root-i" });
	expect(effectiveModeForCard(repo, RUN, "root-i")).toBe("Deliberate");

	// (ii) clean Verify subtree ⇒ Verify
	putManifest(repo, { id: "root-ii", seat: RUNNER_SEAT, mode: "Verify" });
	putManifest(repo, { id: "root-ii.o", seat: "owner", parentJobId: "root-ii" });
	putManifest(repo, { id: "root-ii.s", seat: "skeptic", parentJobId: "root-ii" });
	putManifest(repo, { id: "root-ii.j", seat: "judge", parentJobId: "root-ii" });
	expect(effectiveModeForCard(repo, RUN, "root-ii")).toBe("Verify");

	// (iii) Direct ⇒ Direct
	putManifest(repo, { id: "root-iii", seat: RUNNER_SEAT, mode: "Direct" });
	putManifest(repo, { id: "root-iii.o", seat: "owner", parentJobId: "root-iii" });
	expect(effectiveModeForCard(repo, RUN, "root-iii")).toBe("Direct");

	// (iv) product-owner escalation child, no generators ⇒ Verify (dual-role:
	// the discriminator is the generator set, never the panel set-difference)
	putManifest(repo, { id: "root-iv", seat: RUNNER_SEAT, mode: "Verify" });
	putManifest(repo, { id: "root-iv.po", seat: "product-owner", parentJobId: "root-iv" });
	expect(effectiveModeForCard(repo, RUN, "root-iv")).toBe("Verify");
});

test("subtree arm v: two cards in one runId — card B's clean Verify subtree is not contaminated by card A's generators", () => {
	const repo = fs.mkdtempSync(path.join(os.tmpdir(), "ev69-v-"));
	openRepos.push(repo);
	ensureRun(repo);
	putManifest(repo, { id: "runner-a", seat: RUNNER_SEAT, mode: "Verify" });
	putManifest(repo, { id: "runner-a.p", seat: "principal", parentJobId: "runner-a" });
	putManifest(repo, { id: "runner-b", seat: RUNNER_SEAT, mode: "Verify" });
	putManifest(repo, { id: "runner-b.s", seat: "skeptic", parentJobId: "runner-b" });
	expect(effectiveModeForCard(repo, RUN, "runner-a")).toBe("Deliberate");
	expect(effectiveModeForCard(repo, RUN, "runner-b")).toBe("Verify");
});

test("subtree arm vi: a stray /council-eval ROOT dispatch affects neither card", () => {
	const repo = fs.mkdtempSync(path.join(os.tmpdir(), "ev69-vi-"));
	openRepos.push(repo);
	ensureRun(repo);
	putManifest(repo, { id: "eval-stray", seat: "principal", mode: "Verify" }); // stray carrier ROOT
	putManifest(repo, { id: "runner-a", seat: RUNNER_SEAT, mode: "Verify" });
	putManifest(repo, { id: "runner-b", seat: RUNNER_SEAT, mode: "Verify" });
	expect(effectiveModeForCard(repo, RUN, "runner-a")).toBe("Verify");
	expect(effectiveModeForCard(repo, RUN, "runner-b")).toBe("Verify");
});

test("subtree arm vii: an absent ROOT throws with a named basis — fail-safe, never a reduced fallback", () => {
	const repo = fs.mkdtempSync(path.join(os.tmpdir(), "ev69-vii-"));
	openRepos.push(repo);
	ensureRun(repo);
	expect(() => effectiveModeForCard(repo, RUN, "no-such-runner")).toThrow(/no ROOT manifest/);
});

test("multiple-ROOT union: a card with two ROOTs — generators in either subtree ⇒ Deliberate; clean ROOTs resolve to the strongest ROOT mode", () => {
	const repo = fs.mkdtempSync(path.join(os.tmpdir(), "ev69-union-"));
	openRepos.push(repo);
	ensureRun(repo);
	putManifest(repo, { id: "runner-1", seat: RUNNER_SEAT, mode: "Verify" });
	putManifest(repo, { id: "runner-2", seat: RUNNER_SEAT, mode: "Verify" });
	putManifest(repo, { id: "runner-3", seat: RUNNER_SEAT, mode: "Direct" });
	// generator under runner-2 only
	putManifest(repo, { id: "runner-2.c", seat: "consolidator", parentJobId: "runner-2" });
	expect(effectiveModeForCard(repo, RUN, ["runner-1", "runner-2"])).toBe("Deliberate");
	expect(effectiveModeForCard(repo, RUN, ["runner-1", "runner-3"])).toBe("Verify"); // strongest of {Verify, Direct}
	expect(effectiveModeForCard(repo, RUN, "runner-1")).toBe("Verify");
});
