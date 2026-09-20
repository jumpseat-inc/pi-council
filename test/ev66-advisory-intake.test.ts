// EV-66 — the advisory-intake falsifier (the card's hard part).
//
// Spec: docs/superpowers/specs/2026-09-19-EV-66-design.md §5/§7. The gate in
// advisory mode records one ledger line per drafted card (advisory: true)
// while dispatching the same seat set as a pre-gate run; the headline
// observable is "the ledger is the only engine-written diff": two offline
// arms run a BYTE-IDENTICAL script and tree through the real installed pi CLI
// (runHarnessArm, FLLWUP-56 headless precedent); the differing-path set
// between the two arm worktrees, minus the harness-authored repo-local
// policy.json and minus .pi/council/runs/** (engine-written telemetry,
// AGENTS.md convention 12), must equal exactly
// { .pi/council/gate-ledger.jsonl }. A card-file, board, manifest, or any
// incidental write is a failure. Dispatch-set equality (same manifest id +
// seat sets; no manifest carries a mode) is asserted as a corollary, and the
// steering-branch opacity clause is pinned at unit level (§5: the branch that
// would dispatch a different seat set on a verdict token is never taken).
//
// RED-BASE RECORD (red-base-evidence, seven fields; FLLWUP-56/ev68 precedent):
//
// 1. Base identity: 9966ffefcff6cb809eaf2df5ad0dd071d53066eb — the commit
//    immediately preceding EV-66's first mechanism merge (f5477a9, the
//    council_gate tool + in-flight render); base role: required.
// 2. Transplant identity: test/ev66-advisory-intake.test.ts plus the harness
//    knob diff (test/faux-provider/harness.ts + test/faux-provider/
//    extension.ts — the EV40_TOOLCALL_GATE knob and the GATE_CARDS gate step),
//    copied from head sha ecd728d798fbba9593b3c1107b1238f082a34d39 (the
//    falsifier commit; this file's content is what ran at both halves). At
//    base the falsifier file does not exist and the knob is absent.
// 3. Exact command (verbatim, both halves): bun test test/ev66-advisory-intake.test.ts
// 4. Raw red output (verbatim, from the base worktree run — per-failure
//    lines and the runner's own counts, unparaphrased):
//
//    (fail) EV-66 advisory intake — unit section > features-new places the gate step between aggregation and the draft-then-confirm heading [0.26ms]
//    error: expect(received).toBeGreaterThan(expected)
//    Expected: > 6976
//    Received: -1
//    (fail) EV-66 advisory intake — the two-arm headless falsifier > arm A (loopback success, primary) + arm B (credential-less failure): the ledger is the only engine-written diff; dispatch sets equal; arm B zero POSTs [4268.06ms]
//    error: expect(received).toBe(expected)
//    Expected: 3
//    Received: 0
//
//    2 pass
//    2 fail
//    13 expect() calls
//    Ran 4 tests across 1 file. [4.78s]
//
//    Mechanism-absent boundary (skeptic-derived at verification): both reds
//    name mechanism artifacts absent at base — the "## 3. Record the advisory
//    gate call" step (the gate seam in the procedure) and the ZERO gate POSTs
//    (the unregistered council_gate tool: at base pi returns an immediate
//    "Tool council_gate not found" toolResult — skeptic O11 — so the gate
//    step executes nothing and the stub receives no POST). No per-failure
//    line names a transplant/copy-set artifact: the harness files transplant
//    cleanly (the passing canary and steering-branch tests prove the copy
//    resolves) and both arm processes ran to their assertions — fail-loud,
//    deterministic, no hang. The two greens at base are exactly the two
//    tests that do not depend on the mechanism.
// 5. Worktree provenance: detached checkout of 9966ffe at
//    /tmp/ev66-redbase-worktree (git worktree add --detach), separate from
//    the main checkout; the main checkout was never touched; the worktree
//    was removed after the run (verified: no /tmp/ev66-redbase-worktree in
//    git worktree list afterward).
// 6. Copy set (affirmative): the transplant (the falsifier file + the two
//    harness files) plus a node_modules symlink (the EV-68 precedent — the
//    base tree has no node_modules and bun resolves the dev deps through
//    it). Bare copy otherwise.
// 7. Head half: head sha ecd728d798fbba9593b3c1107b1238f082a34d39, same
//    exact command verbatim, 0 fail (4 pass, 0 fail — observed on this tree
//    before the record was written; re-verified after).
//
// Suite budget (FLLWUP-58): the two offline arms measure ≈10s together; the
// per-test ceiling below carries headroom against the 60-minute CI backstop
// (ev41 precedent: 5 arms ≈ 38s under a 120s ceiling). No new live arm — the
// production transport is already live-proven under COUNCIL_INTEGRATION=1.

import { describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import * as http from "node:http";
import * as os from "node:os";
import * as path from "node:path";
import { CONFIG_DIR_NAME } from "@earendil-works/pi-coding-agent";
import { listRunIds, readManifests } from "../extensions/runs.ts";
import { readGateLedger } from "../extensions/gate-ledger.ts";
import { GATE_DECISION_MODES, GATE_PINNED_MODEL } from "../extensions/gate.ts";
import { runHarnessArmAsync, type ArmOptions, type EngineRepoOptions } from "./faux-provider/harness.ts";
import { GATE_CARDS } from "./faux-provider/extension.ts";
import { CLI_PATH, HARNESS_EXTENSION, resolveNode } from "./faux-provider/harness.ts";

const SEAT = "skeptic";
const SEAT_MODEL = "ev40/ev40-model";

/** The scratch `pi` launcher: the hub's hardcoded `command: "pi"`
 * (hub-tools.ts) PATH-resolves to this executable, which deterministically
 * runs the dev-installed CLI (the EV-56/FLLWUP-21 precedent — without it the
 * spawned seat child never settles and the wait holds the turn open). */
function writePiLauncherShim(scratchRoot: string): string {
	const dir = mkdtempSync(path.join(scratchRoot, "ev66-pi-launcher-"));
	writeFileSync(path.join(dir, "pi"), `#!/bin/sh\nexec "${resolveNode()}" "${CLI_PATH}" "$@"\n`, { mode: 0o755 });
	return dir;
}

/** The repo-local seat file the `.council.json` override shadows (the real
 * config-injection path): the child dispatch resolves `skeptic` to the faux
 * provider's model. */
function seatFile(): EngineRepoOptions["extraRepoFiles"] {
	return [
		{
			path: path.join(CONFIG_DIR_NAME, "agents", `${SEAT}.md`),
			body: `---\nname: ${SEAT}\ndescription: EV-66 falsifier arm seat\nmodel: frontmatter/placeholder-model\ntools: Read\n---\nunit-test body`,
		},
	];
}

/** The project-local extension shim written into the arm's scratch repo
 * (runtime-generated; EV-56 pattern). Project-local extensions auto-load in
 * BOTH pi processes: the parent (no `--session-id`) is a pure no-op — the
 * `-e`-loaded harness extension already scripted the dispatch/gate turn —
 * and the seat child gets the faux provider with a clean one-turn script
 * (no failure injection; this falsifier injects nothing into the child). */
function extensionShimBody(): string {
	return `// EV-66 scratch shim (runtime-generated; lives only in the arm's scratch
// repo). Auto-loads in both pi processes; only the child carries --session-id.
const sidIdx = process.argv.indexOf("--session-id");
if (sidIdx < 0) {
	module.exports.default = () => {};
} else {
	// Child: strip every EV40_* knob the parent's env leaked through childEnv's
	// spread, then script a clean single-turn child (no failure injection).
	for (const k of Object.keys(process.env)) {
		if (k.startsWith("EV40_")) delete process.env[k];
	}
	process.env.EV40_FAILS = "0";
	process.env.EV40_ARM = "none";
	const shared = await import(${JSON.stringify(HARNESS_EXTENSION)});
	module.exports.default = shared.default;
}
`;
}

// ---------------------------------------------------------------------------
// Shared arm substrate
// ---------------------------------------------------------------------------

const LEDGER_REL = `${CONFIG_DIR_NAME}/council/gate-ledger.jsonl`;
const POLICY_REL = `${CONFIG_DIR_NAME}/council/gate/policy.json`;
const RUNS_PREFIX = `${CONFIG_DIR_NAME}/council/runs/`;
const FAILURE_BASIS =
	"gate call failed: no OpenRouter API key resolved (OPENROUTER_API_KEY env or stored credential)";
const POST_GATE_MARKER = "EV40-SECOND-RESPONSE";

/** The unit-level steering-branch predicate (spec §5): a mock model whose
 * post-gate step branches on the preceding toolResult's text — if it contains
 * any verdict token, it dispatches a DIFFERENT seat set. The headless arms
 * run a byte-identical script, so the branch is taken iff the tool result
 * leaks a verdict token; the falsifier asserts it is never taken (over the
 * REAL toolResult text from the arm session JSONL). */
export function steeringBranchFires(toolResultText: string): boolean {
	return /\b(Deliberate|Verify|Direct|Mode:)\b/.test(toolResultText);
}

interface DecisionsStub {
	url: string;
	/** Server-side POST count — the zero-POST assertion never trusts client
	 * bookkeeping (the arm process's own logs could lie; the server cannot). */
	postCount(): number;
	close(): Promise<void>;
}

/** The loopback decisions stub: per-card-keyed canned answers, keyed on
 * body.state.card.id in the POST — never one canned body for all cards (the
 * non-vacuity clause). Loopback only. */
async function startDecisionsStub(): Promise<DecisionsStub> {
	let posts = 0;
	const server = http.createServer((req, res) => {
		let body = "";
		req.on("data", (c) => (body += c));
		req.on("end", () => {
			posts++;
			const cardId: string = JSON.parse(body)?.state?.card?.id ?? "";
			res.writeHead(200, { "Content-Type": "application/json" });
			res.end(
				JSON.stringify({
					model: GATE_PINNED_MODEL,
					answers: cannedAnswers(cardId),
					usage: { input_tokens: 1, output_tokens: 1, cost: null },
				}),
			);
		});
	});
	await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
	const port = (server.address() as { port: number }).port;
	return {
		url: `http://127.0.0.1:${port}/decisions`,
		postCount: () => posts,
		close: () => new Promise<void>((resolve) => server.close(() => resolve())),
	};
}

/** Per-card canned answers (non-vacuity): the epic fires the one-way-door
 * override (Deliberate, "reversible? no (one-way door)"); child 1 gets
 * confident fully-mechanical answers over the direct threshold (Direct,
 * composite 4.00); child 2 gets confident but non-mechanical answers over
 * the verify threshold only (Verify, composite 3.00). Three distinct modes. */
function cannedAnswers(cardId: string): Record<string, unknown> {
	if (cardId === "EPIC-66T") {
		return {
			reversible: { type: "noul", probability: 0.2 },
			publicContract: { type: "noul", probability: 0.9 },
			blastRadius: { type: "noul", probability: 0.9 },
			decidablyTestable: { type: "choice", value: "no", confidence: 0.95, probabilities: { no: 0.95 } },
		};
	}
	if (cardId === "EV-66T-1") {
		return {
			reversible: { type: "noul", probability: 0.9 },
			publicContract: { type: "noul", probability: 0.1 },
			blastRadius: { type: "noul", probability: 0.1 },
			decidablyTestable: { type: "choice", value: "yes", confidence: 0.95, probabilities: { yes: 1 } },
		};
	}
	// Child 2: blastRadius at p(yes) 0.4 → P(mechanical "no") = 0.6 (certainty
	// exactly at the noul threshold — passes), composite 3.30 ∈ [2.6, 3.4) →
	// Verify.
	return {
		reversible: { type: "noul", probability: 0.9 },
		publicContract: { type: "noul", probability: 0.1 },
		blastRadius: { type: "noul", probability: 0.4 },
		decidablyTestable: { type: "choice", value: "yes", confidence: 0.9, probabilities: { yes: 0.9 } },
	};
}

/** The byte-identical script/tree substrate: only policy.json (and arm B's
 * env) differs. The repo-local policy carries the loopback endpoint and the
 * explicit advisory mode (R3: never the packaged default). */
function engineRepo(policyBody: string): EngineRepoOptions {
	return {
		retryPolicy: {
			gate: { mode: "advisory" }, // EV-73: enablement lives in .council.json's top-level gate section
			council: { [SEAT]: { model: SEAT_MODEL } },
			retry: { enabled: false, maxAttempts: 2, baseDelayMs: 200, jitter: false },
		},
		procedureBody: "EV66-PROBE-TURN",
		extraRepoFiles: [
			...(seatFile() ?? []),
			{ path: path.join(CONFIG_DIR_NAME, "extensions", "ev66-shim.ts"), body: extensionShimBody() },
			{ path: POLICY_REL, body: `${policyBody}\n` },
		],
	};
}

function armOpts(label: string, extraEnv: Record<string, string>): ArmOptions {
	return {
		label,
		fails: 0,
		arm: "none",
		councilExtension: true,
		toolcallDispatch: true,
		// The wait step (FLLWUP-56) holds the print-mode parent's turn open
		// through the seat child's settle — without it the hub's onChange →
		// renderWidget fires after session replacement and the pre-existing
		// stale-ctx guard throws, killing the parent turn.
		toolcallWait: true,
		toolcallGate: true,
		// The hub's hardcoded `command: "pi"` never resolves in the harness (the
		// launcher shim is the EV-56 mechanism and would add a second moving
		// part); the dispatch fails fast inside the REAL council_dispatch →
		// council_wait path, producing the run/ manifests the corollary reads.
		// The parent turn continues to the gate step regardless.
		extraEnv: { PI_OFFLINE: "1", ...extraEnv },
		timeoutMs: 120_000,
	};
}

/** Recursive sha256 over every file of an arm worktree, keyed by
 * slash-relative path. */
function sha256Tree(root: string): Map<string, string> {
	const out = new Map<string, string>();
	const walk = (dir: string, rel: string): void => {
		let items;
		try {
			items = readdirSync(dir, { withFileTypes: true });
		} catch {
			return;
		}
		for (const e of [...items].sort((a, b) => (a.name < b.name ? -1 : 1))) {
			const relPath = rel ? `${rel}/${e.name}` : e.name;
			const abs = path.join(dir, e.name);
			if (e.isDirectory()) walk(abs, relPath);
			else if (e.isFile()) out.set(relPath, createHash("sha256").update(readFileSync(abs)).digest("hex"));
		}
	};
	walk(root, "");
	return out;
}

/** The differing-path set between two trees: paths whose hashes differ, plus
 * paths present in only one tree. */
function diffPaths(a: Map<string, string>, b: Map<string, string>): string[] {
	const out = new Set<string>([...a.keys(), ...b.keys()]);
	return [...out].filter((k) => a.get(k) !== b.get(k)).sort();
}

/** Extract the parent session's council_gate toolResult text — the opacity
 * assertions read the REAL toolResult from the session JSONL. */
function gateToolResultText(sessionPath: string): string {
	for (const line of readFileSync(sessionPath, "utf-8").split("\n")) {
		if (!line.trim()) continue;
		let entry: any;
		try {
			entry = JSON.parse(line);
		} catch {
			continue;
		}
		const msg = entry.message ?? entry;
		if (msg?.role !== "toolResult" || msg?.toolName !== "council_gate") continue;
		if (Array.isArray(msg.content)) {
			return msg.content
				.filter((c: any) => c.type === "text")
				.map((c: any) => c.text)
				.join("");
		}
	}
	throw new Error("no council_gate toolResult found in the parent session JSONL");
}

/** The advisories' dispatch material: per run dir, the manifest (id, seat)
 * set — the dispatch-set-equality corollary compares these across arms. */
function dispatchSets(workDir: string): Array<{ id: string; seat: string }> {
	const runDir = path.join(workDir, CONFIG_DIR_NAME, "council", "runs");
	const runId = readdirSync(runDir).filter((d) => !d.startsWith("."))[0]!;
	return readManifests(workDir, runId)
		.map((m) => ({ id: m.id, seat: m.seat }))
		.sort((x, y) => (x.id < y.id ? -1 : 1));
}

// ---------------------------------------------------------------------------
// Unit section — placement assertion, Acceptance bar, ledger-source canary,
// steering-branch predicate
// ---------------------------------------------------------------------------

describe("EV-66 advisory intake — unit section", () => {
	test("features-new places the gate step between aggregation and the draft-then-confirm heading", () => {
		const text = readFileSync(
			path.join(import.meta.dir, "..", "council", "procedures", "features-new.md"),
			"utf-8",
		);
		const agg = text.indexOf("**Aggregation.**");
		const gate = text.indexOf("## 3. Record the advisory gate call");
		const confirm = text.indexOf("## 4. Draft-then-confirm");
		expect(agg).toBeGreaterThan(-1);
		expect(gate).toBeGreaterThan(agg);
		expect(confirm).toBeGreaterThan(gate);
		// The gate call covers the epic card and every drafted child, passes the
		// card's ## Acceptance text, and is recorded-never-acted-on.
		expect(text).toContain("the epic card and every drafted");
		expect(text).toContain("`acceptance` is the");
		expect(text).toContain("recorded, never acted on");
		// R(d) bar: the epic card carries ## Acceptance too, the waves draft it,
		// aggregation carries it, and step 4 presents it.
		expect(text).toContain("The epic card also carries a\n`## Acceptance` section");
		expect(text).toContain("Every card the pass drafts — the epic card and every child — also\ncarries");
		expect(text).toContain("carries\nits frontmatter, `Intent`, and the `## Acceptance` text");
		expect(text).toContain("`##\nAcceptance` section, exactly as each");
	});

	test("ledger-source canary (EV-67 §4 amended): the ledger's accessors are role-enumerated — gate-run.ts writes, gate-ledger.ts owns, gate-render.ts presents — the read-only posture preserved in strength, and nothing on an execution path imports the renderer", () => {
		const dir = path.join(import.meta.dir, "..", "extensions");
		const modules = readdirSync(dir).filter((f) => f.endsWith(".ts")).sort();
		const srcOf = (f: string) => readFileSync(path.join(dir, f), "utf-8");
		// Role-enumerated accessor allowlist (the EV-67 amendment; sanctioned by
		// the EV-67 spec §4): the WRITER (gate-run.ts) references the append
		// accessors; the PRESENTATION leaf (gate-render.ts) references the
		// reader accessors and the format string; the OWNER (gate-ledger.ts)
		// defines all of them. EV-69 amendment (deliberate): the ROUTING READ
		// (gate-route.ts) and its tool (gate-route-tool.ts) also reference the
		// reader accessors — the routing read consumes recorded decisions; the
		// import fence keeps it off the execution path (no runGate/transport/
		// render edge, pinned by the T1 canary in test/gate-route.test.ts), and
		// the routing read never renders. EV-71 amendment (deliberate, settled
		// spec §1.4): the FLUSH READ (usage-store.ts) also references the reader
		// accessors — one readGateLedger per flush pass sources the windowed
		// decision generation ids for the gate-spend reconciliation; it never
		// touches the writer accessors (the writer allowlist below still fences
		// it), never imports gate-render.ts (the import fence below still
		// fences it), and never renders a ledger line — the ids ride the
		// caller-passed input into provider-cost.ts (no gate-ledger import
		// there, pinned by test/gate-spend-reconcile.test.ts's source canary).
		// Any OTHER module referencing any ledger accessor is an offender.
		const writerAccessors = ["appendGateCall", "appendGateOutcome"];
		const readerAccessors = ["readGateLedger", "gate-ledger.jsonl", "decisionLine"];
		const writerOffenders = modules
			.filter((f) => f !== "gate-ledger.ts" && f !== "gate-run.ts")
			.filter((f) => writerAccessors.some((sym) => srcOf(f).includes(sym)));
		expect(writerOffenders, "only gate-run.ts (the writer) references the append accessors").toEqual([]);
		const readerOffenders = modules
			.filter((f) => f !== "gate-ledger.ts" && f !== "gate-render.ts" && f !== "gate-route.ts" && f !== "gate-route-tool.ts" && f !== "usage-store.ts")
			.filter((f) => readerAccessors.some((sym) => srcOf(f).includes(sym)));
		expect(readerOffenders, "only gate-render.ts (the presentation), the EV-69 routing read, and the EV-71 flush read reference the reader accessors").toEqual([]);
		// Preserved in strength (1) — read-only posture: no module outside
		// gate-run.ts references the append accessors, and gate-render.ts
		// references NEITHER (it reads, never writes). The EV-71 flush read is
		// read-only too: usage-store.ts references no writer accessor.
		const renderSrc = srcOf("gate-render.ts");
		for (const sym of writerAccessors) {
			expect(renderSrc.includes(sym), `gate-render.ts must not reference ${sym}`).toBe(false);
		}
		const flushSrc = srcOf("usage-store.ts");
		for (const sym of writerAccessors) {
			expect(flushSrc.includes(sym), `usage-store.ts must not reference ${sym} (read-only flush)`).toBe(false);
		}
		// Preserved in strength (2) — import directionality: no execution-path
		// module imports gate-render.ts (the recorded line makes no policy
		// change effective). index.ts is the one sanctioned edge — the
		// composition root that registers the parent tool, not a step on the
		// record/decide/dispatch path.
		const importRenderOffenders = modules
			.filter((f) => f !== "gate-render.ts" && f !== "index.ts")
			.filter((f) => {
				// A RUNTIME import ("import {...}") — `import type` is never an
				// execution-path edge.
				return (srcOf(f).match(/^import(?! type)[^\n]*\.\/gate-render\.ts/gm) ?? []).length > 0;
			});
		expect(importRenderOffenders, "no execution-path module imports gate-render.ts").toEqual([]);
		// EV-67 §1: gate-ledger.ts is the ONLY module owning a `Mode: `-prefixed
		// format expression — the byte-equality claim stays executable.
		const modeFormatOffenders = modules
			.filter((f) => f !== "gate-ledger.ts")
			.filter((f) => /`Mode: |"Mode: "/.test(srcOf(f)));
		expect(modeFormatOffenders, "gate-ledger.ts is the only module owning a 'Mode: '-prefixed format expression").toEqual([]);
	});

	test("steering-branch predicate: fires on any verdict token, never on the mechanical result shape (the branch that would dispatch a different seat set)", () => {
		// Sensitivity half: the branch WOULD fire on a leak — the predicate is
		// real, not vacuous.
		expect(steeringBranchFires("policy: Deliberate — basis composite 3.60")).toBe(true);
		expect(steeringBranchFires("Mode: Verify — reversible? no (one-way door)")).toBe(true);
		// Mechanical half: the settled result shape carries no verdict token.
		expect(
			steeringBranchFires('{"policyMode":"advisory","cards":[{"id":"EV-66","callId":"c1","status":"ok"}]}'),
		).toBe(false);
		expect(steeringBranchFires('{"mode":"off","recorded":0}')).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// The two-arm headless falsifier
// ---------------------------------------------------------------------------

describe("EV-66 advisory intake — the two-arm headless falsifier", () => {
	test(
		"arm A (loopback success, primary) + arm B (credential-less failure): the ledger is the only engine-written diff; dispatch sets equal; arm B zero POSTs",
		async () => {
			const stub = await startDecisionsStub();
			const scratchRoot = mkdtempSync(path.join(os.tmpdir(), "ev66-falsifier-"));
			try {
				const policy = {
					policyVersion: "ev66-falsifier-policy-1",
					model: GATE_PINNED_MODEL,
					endpoint: stub.url,
					gateStateBudgetTokens: 32000,
				};
				const policyBody = `${JSON.stringify(policy, null, "\t")}\n`;

				// --- Arm A: loopback success (dummy key resolves the success path;
				// the loopback endpoint keeps every POST on 127.0.0.1). ---
				const launcherDir = writePiLauncherShim(scratchRoot);
				const armA = await runHarnessArmAsync(
					{ ...armOpts("ev66-armA", { OPENROUTER_API_KEY: "ev66-dummy-key" }), pathPrepend: [launcherDir] },
					scratchRoot,
					engineRepo(policyBody),
				);
				expect(armA.exitCode).toBe(0);
				// The byte-identical script settles after the gate call in both arms.
				expect(armA.stdout).toContain(POST_GATE_MARKER);

				// --- Arm B: credential-less failure. The key is ABSENT from the
				// arm's explicit env (the harness never inherits it — FLLWUP-21) and
				// the scratch HOME is bare, so resolveOpenRouterApiKey() finds no
				// credential: runGate fails closed pre-transport. A runner-exported
				// real key cannot leak in — and if it did, the stub's server-side
				// zero-POST count below would catch the live POST. ---
				const armB = await runHarnessArmAsync(
					{ ...armOpts("ev66-armB", {}), pathPrepend: [launcherDir] },
					scratchRoot,
					engineRepo(policyBody),
				);
				expect(armB.exitCode).toBe(0);
				expect(armB.stdout).toContain(POST_GATE_MARKER);
				// Arm A POSTed once per card to the LOOPBACK stub; arm B must add
				// ZERO POSTs — the count is the SERVER-side count, so a live POST
				// (a runner-exported key leaking into the arm env) cannot hide.
				const postsAfterA = stub.postCount();
				expect(postsAfterA).toBe(GATE_CARDS.length);

				const workDirA = path.join(scratchRoot, readdirSync(scratchRoot).filter((d) => d.startsWith("ev40-ev66-armA-cwd-"))[0]!);
				const workDirB = path.join(scratchRoot, readdirSync(scratchRoot).filter((d) => d.startsWith("ev40-ev66-armB-cwd-"))[0]!);

				// --- Headline observable: the ledger is the only engine-written
				// diff between the two byte-identical worktrees. ---
				const diffs = diffPaths(sha256Tree(workDirA), sha256Tree(workDirB)).filter(
					(rel) => rel !== POLICY_REL && !rel.startsWith(RUNS_PREFIX),
				);
				expect(diffs).toEqual([LEDGER_REL]);
				// (The policy file's CONTENT is the arms' only sanctioned difference —
				// here it is byte-identical by construction, so the raw diff set is
				// policy.json (harness stamping) + runs/** + the ledger.)
				expect(existsSync(path.join(workDirA, LEDGER_REL))).toBe(true);
				expect(existsSync(path.join(workDirB, LEDGER_REL))).toBe(true);

				// --- Arm A ledger: one advisory line per drafted card, per-card
				// resolved modes NOT all identical (non-vacuity). ---
				const ledgerA = readGateLedger(workDirA);
				expect(ledgerA.calls).toHaveLength(GATE_CARDS.length);
				expect(ledgerA.calls.map((c) => c.advisory)).toEqual([true, true, true]);
				const modesA = ledgerA.calls.map((c) => c.resolvedMode);
				for (const m of modesA) expect(GATE_DECISION_MODES).toContain(m as (typeof GATE_DECISION_MODES)[number]);
				expect(new Set(modesA).size).toBeGreaterThan(1);
				for (const c of ledgerA.calls) {
					expect(c.failure).toBeUndefined();
					expect((c.basis ?? "").length).toBeGreaterThan(0);
					expect(Object.keys(c.answers ?? {}).length).toBeGreaterThan(0);
					expect(c.model).toBe(GATE_PINNED_MODEL);
				}
				// Deterministic bases: decide() over the per-card canned answers.
				expect(ledgerA.calls.map((c) => c.resolvedMode)).toEqual(["Deliberate", "Direct", "Verify"]);
				expect(ledgerA.calls.map((c) => c.basis)).toEqual([
					"reversible? no (one-way door)",
					"composite 3.70 ≥ direct threshold 3.40",
					"composite 3.30 ≥ verify threshold 2.60",
				]);

				// --- Arm B ledger: fail-closed lines, byte-equal basis, zero POSTs
				// (server-side count). ---
				const ledgerB = readGateLedger(workDirB);
				expect(ledgerB.calls).toHaveLength(GATE_CARDS.length);
				expect(ledgerB.calls.map((c) => c.advisory)).toEqual([true, true, true]);
				expect(ledgerB.calls.map((c) => c.resolvedMode)).toEqual(["Deliberate", "Deliberate", "Deliberate"]);
				for (const c of ledgerB.calls) {
					expect(c.failure?.class).toBe("no-api-key");
					expect(c.basis).toBe(FAILURE_BASIS);
					expect(c.model).toBeUndefined();
				}

				// Zero POSTs for arm B, server-side (the count never moved).
				expect(stub.postCount()).toBe(postsAfterA);

				// --- Corollary: dispatch-set equality — same (id, seat) sets from
				// the byte-identical script; no manifest carries a mode. ---
				const dispatchA = dispatchSets(workDirA);
				const dispatchB = dispatchSets(workDirB);
				expect(dispatchA.length).toBeGreaterThan(0);
				expect(dispatchA).toEqual(dispatchB);
				// Directory-selecting runId: the runs dir carries a self-gitignore
				// FILE; a raw readdirSync(...)[0] is entry-order dependent and can
				// hand readManifests ".gitignore" (listRunIds stats for isDirectory).
				const manifestsA = readManifests(workDirA, listRunIds(workDirA)[0]!);
				expect(manifestsA.every((m) => m.mode === undefined)).toBe(true);

				// --- Steering-branch opacity: the branch is never taken over the
				// REAL toolResult text (a leak would dispatch a different seat set;
				// the arms' dispatch sets are equal, and the toolResult carries no
				// verdict token). ---
				const resultTextA = gateToolResultText(armA.sessionPath!);
				expect(steeringBranchFires(resultTextA)).toBe(false);
			} finally {
				await stub.close();
				rmSync(scratchRoot, { recursive: true, force: true });
			}
		},
		120_000,
	);
});
