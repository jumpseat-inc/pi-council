// EV-83 — route the follow-up decision through /features-deliver Phase 3 and
// the council-runner escalation path.
//
// Spec: docs/superpowers/specs/2026-09-22-EV-83-design.md (settled, binding),
// including the confirmation-authority ruling: the recorded gate decision is
// the container's disposition SOURCE, never its confirmation — every surfaced
// candidate in a container ends step 13 as an ESCALATION before any write.
//
// Sections here (spec §Test plan):
//   1. Grant/sandbox unit tests — `followup` grant keyword at three sites
//      (seats.ts grantsFor + buildChildArgv, child.ts isCallAllowed + child
//      registration; control: council_dispatch stays hub-governed only).
//   2. The runner fixture (the card-goal falsifier): a stub child spawned via
//      hub.spawnJob against a mkdtemp fixture repo with a failing transport
//      and a drafted candidate — asserts first line ESCALATION, draft title
//      present, verbatim `gate call failed: <reason>` basis, ZERO new files
//      under council/cards/ (the no-write pin — NOT a FLLWUP- regex over the
//      report, per skeptic 8b: realistic draft titles contain FLLWUP- ids),
//      and exactly one ledger line (resolvedMode "File", failureClass). The
//      red-at-base half is the tool-surface assertion (skeptic 8a).
//   3. Wrapper arm-shape tests — the child-mode `council_followup_review`
//      composition (runFollowupReview then renderFollowupLinesFromRepo
//      against the actual result object): off no-op, the resolvedMode
//      fail-safe-File trap discriminator, the resolved active Mode: line.
//   4. Prose tests — Phase 3 replacement sentence pins, the
//      <followup_decision> block pins, the R6 byte baselines
//      (<return_contract> four-tag list byte-identity; RETIRED clause
//      byte-identity + zero Drop + zero candidate), the followup grant in
//      council-runner.md frontmatter.
import { afterEach, test, expect } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { CONFIG_DIR_NAME } from "@earendil-works/pi-coding-agent";
import { PKG_ROOT, loadSeat, grantsFor, buildChildArgv, type Seat } from "../extensions/seats.ts";
import { isCallAllowed } from "../extensions/child.ts";
import { Hub } from "../extensions/hub.ts";
import { readGateLedger } from "../extensions/gate-ledger.ts";
import { GATE_PINNED_MODEL } from "../extensions/gate.ts";
import type { GateTransport } from "../extensions/gate-transport.ts";
import type { FollowupCandidate } from "../extensions/followup-state.ts";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function tmpRepo(): string {
	return fs.mkdtempSync(path.join(os.tmpdir(), "ev83-runner-repo-"));
}

function syntheticSeat(overrides: Partial<Seat> = {}): Seat {
	return {
		name: "synthetic",
		description: "d",
		model: "openrouter/test/m",
		tools: [],
		spawns: [],
		mcp: [],
		body: "body",
		...overrides,
	};
}

/** Fixture repo: gate mode `active` via .council.json, a policy.json, a
 * board + one open card (buildFollowupState's input), an empty cards dir
 * snapshot target, and the packaged followup data falling through. */
function activeFixtureRepo(): string {
	const root = tmpRepo();
	fs.mkdirSync(path.join(root, CONFIG_DIR_NAME, "council", "gate"), { recursive: true });
	fs.writeFileSync(
		path.join(root, CONFIG_DIR_NAME, "council", "gate", "policy.json"),
		JSON.stringify({
			policyVersion: "ev83-fixture-policy-1",
			model: GATE_PINNED_MODEL,
			endpoint: "https://x/",
			gateStateBudgetTokens: 1000000,
		}),
	);
	fs.writeFileSync(path.join(root, ".council.json"), JSON.stringify({ gate: { mode: "active" } }));
	fs.mkdirSync(path.join(root, "council", "cards"), { recursive: true });
	fs.writeFileSync(
		path.join(root, "council", "board.md"),
		["# Council Board", "", "## In Progress", "", "- EV-83 — Route the follow-up decision", ""].join("\n"),
	);
	fs.writeFileSync(
		path.join(root, "council", "cards", "EV-83.md"),
		"---\nid: EV-83\ntitle: Route the follow-up decision\nstate: In Progress\n---\nbody",
	);
	return root;
}

const DRAFT: FollowupCandidate = { title: "FLLWUP-101 probe", goal: "Probe the runner escalation path" };

/** The failing transport double — the verbatim reason the fixture asserts. */
const failDouble: GateTransport = async () => ({ ok: false, kind: "network", message: "transport exploded" });

function cardFiles(repo: string): string[] {
	const dir = path.join(repo, "council", "cards");
	try {
		return fs.readdirSync(dir).sort();
	} catch {
		return [];
	}
}

function packaged(rel: string): string {
	return fs.readFileSync(path.join(PKG_ROOT, rel), "utf-8");
}

// ---------------------------------------------------------------------------
// 1. Grant/sandbox unit tests (red at base — the grant keyword is absent)
// ---------------------------------------------------------------------------

test("grantsFor: followup is true iff frontmatter carries it, independent of hub", () => {
	expect(grantsFor(syntheticSeat({ tools: ["followup"] }))).toEqual({ hub: false, followup: true });
	expect(grantsFor(syntheticSeat({ tools: ["task", "followup"], spawns: ["owner"] }))).toEqual({
		hub: true,
		followup: true,
	});
	expect(grantsFor(syntheticSeat({ tools: ["task"], spawns: ["owner"] }))).toEqual({ hub: true, followup: false });
	expect(grantsFor(syntheticSeat())).toEqual({ hub: false, followup: false });
});

test("buildChildArgv: council-runner's --tools allowlist contains council_followup_review", () => {
	const runner = loadSeat(tmpRepo(), "council-runner");
	const argv = buildChildArgv(runner, "input", "/tmp/prompt", [], {
		sessionDir: "/tmp/sd",
		sessionId: "sid",
	});
	const tools = argv[argv.indexOf("--tools") + 1]!.split(",");
	expect(tools).toContain("council_followup_review");
	// The parent-session pair is NOT pushed into child --tools (child-mode
	// tool only; the pair stays parent-path registered).
	expect(tools).not.toContain("council_followup_gate");
	expect(tools).not.toContain("council_followup_render");
});

test("isCallAllowed: council_followup_review flips true with the grant, stays false without it; control council_dispatch hub-governed only", () => {
	const followupOnly = syntheticSeat({ tools: ["followup"] });
	expect(isCallAllowed(followupOnly, "council_followup_review")).toBe(true);
	// control: the followup grant does NOT carry the hub tools
	expect(isCallAllowed(followupOnly, "council_dispatch")).toBe(false);
	expect(isCallAllowed(syntheticSeat(), "council_followup_review")).toBe(false);
	// hub-only seat (no followup): dispatch allowed, review not
	const hubOnly = syntheticSeat({ tools: ["task"], spawns: ["owner"] });
	expect(isCallAllowed(hubOnly, "council_dispatch")).toBe(true);
	expect(isCallAllowed(hubOnly, "council_followup_review")).toBe(false);
	// the packaged council-runner carries the grant
	const runner = loadSeat(tmpRepo(), "council-runner");
	expect(isCallAllowed(runner, "council_followup_review")).toBe(true);
	// control unchanged: a seat without the grant (consolidator) stays blocked
	const c = loadSeat(tmpRepo(), "consolidator");
	expect(isCallAllowed(c, "council_followup_review")).toBe(false);
});

// ---------------------------------------------------------------------------
// 2. The runner fixture — the card-goal falsifier
// ---------------------------------------------------------------------------

const STUB = path.join(import.meta.dir, "ev83-fixture-stub.ts");
let fixtureHub: Hub | undefined;
afterEach(() => fixtureHub?.shutdown());

test("runner fixture: failed followup call → ESCALATION report, zero card writes, one recorded ledger line", async () => {
	const repo = activeFixtureRepo();
	const runner = loadSeat(tmpRepo(), "council-runner");

	// RED-AT-BASE HALF (skeptic 8a): the tool-surface assertions. At base the
	// followup grant does not exist — council_followup_review is absent from
	// the child's --tools allowlist and isCallAllowed blocks it.
	const argv = buildChildArgv(runner, "input", "/tmp/prompt", [], { sessionDir: "/tmp/sd", sessionId: "sid" });
	expect(argv[argv.indexOf("--tools") + 1]!.split(",")).toContain("council_followup_review");
	expect(isCallAllowed(runner, "council_followup_review")).toBe(true);

	const cardsBefore = cardFiles(repo);
	fixtureHub = new Hub({ monitorIntervalMs: 50, pidFile: path.join(os.tmpdir(), `ev83-hub-${process.pid}.json`) });
	const job = fixtureHub.spawnJob({
		id: fixtureHub.allocateId(),
		seat: "stub",
		command: "bun",
		args: [STUB],
		cwd: import.meta.dir,
		env: { ...process.env, EV83_REPO: repo } as Record<string, string>,
		timeoutMs: 60_000,
		stallMs: 60_000,
	});
	const [r] = await fixtureHub.wait([job.id], 15_000);
	expect(r.state).toBe("done");
	const out = r.output ?? "";

	// The escalation route: first line ESCALATION; the candidate present by
	// its draft title; the verbatim engine-derived basis present.
	expect(out.split("\n")[0]).toBe("ESCALATION");
	expect(out).toContain("FLLWUP-101 probe");
	expect(out).toContain("gate call failed: transport exploded");
	expect(out).toContain("no card was written");

	// The no-write pin (skeptic 8b): ZERO files under council/cards/ — the
	// cards-dir discriminator, not a FLLWUP- regex over the report (the
	// realistic draft title itself contains FLLWUP-101).
	expect(cardFiles(repo)).toEqual(cardsBefore);

	// Exactly one ledger line: the recorded failure — resolvedMode "File"
	// (the fail-safe) WITH failureClass recorded; the trap the prose forbids
	// keying resolution off.
	const calls = readGateLedger(repo).calls;
	expect(calls.length).toBe(1);
	expect(calls[0]!.resolvedMode).toBe("File");
	expect(calls[0]!.failure).toBeDefined();
});

// ---------------------------------------------------------------------------
// 3. Wrapper arm-shape tests — the child-mode tool's composition
// ---------------------------------------------------------------------------

test("council_followup_review registers under its exact name on the child path", async () => {
	const { registerFollowupReviewTool } = await import("../extensions/followup-tool.ts");
	let tool: { name: string; parameters: unknown } | undefined;
	const pi = { registerTool: (t: never) => (tool = t as { name: string; parameters: unknown }) } as never;
	registerFollowupReviewTool(pi, tmpRepo());
	expect(tool?.name).toBe("council_followup_review");
	expect(tool?.parameters).toBeDefined();
});

test("off arm: the composition short-circuits at the result-level mode flag — { mode: off, recorded: 0 }, lines [off], transport never called", async () => {
	const repo = tmpRepo();
	fs.writeFileSync(path.join(repo, ".council.json"), JSON.stringify({ gate: { mode: "off" } }));
	let called = 0;
	const transport: GateTransport = async () => {
		called++;
		throw new Error("transport must never be called under off");
	};
	const { composeFollowupReview } = await import("../extensions/followup-tool.ts");
	const { result, lines } = await composeFollowupReview([DRAFT], repo, { transport });
	expect(result).toEqual({ mode: "off", recorded: 0 });
	expect(lines).toEqual(["off"]);
	expect(called).toBe(0);
});

test("trap discriminator: a failed call is status failed even though its ledger resolvedMode is the fail-safe File — the rendered line is the gate call failed basis, never a Mode: line", async () => {
	const repo = activeFixtureRepo();
	const { composeFollowupReview } = await import("../extensions/followup-tool.ts");
	const { result, lines } = await composeFollowupReview([DRAFT], repo, { apiKey: "k-test", transport: failDouble });
	if (result.mode === "off") throw new Error("fixture gate must be active");
	expect(result.candidates.length).toBe(1);
	const c = result.candidates[0]!;
	expect(c.title).toBe(DRAFT.title);
	expect(c.status).toBe("failed");
	expect(c.callId).not.toBeNull();
	// The rendered line is the verbatim basis — never a Mode:-prefixed
	// disposition line for a failed record.
	expect(lines).toEqual(["gate call failed: transport exploded"]);
	expect(lines.some((l) => l.startsWith("Mode:"))).toBe(false);
	// One ledger line: fail-safe File + failureClass (the trap in bytes).
	const calls = readGateLedger(repo).calls;
	expect(calls.length).toBe(1);
	expect(calls[0]!.resolvedMode).toBe("File");
	expect(calls[0]!.failure).toBeDefined();
});

test("resolved active arm: the composition returns status ok with the Mode: <disposition> — <basis> line verbatim", async () => {
	const repo = activeFixtureRepo();
	// A decision body whose composite is below the File threshold → File.
	const body = JSON.stringify({
		model: GATE_PINNED_MODEL,
		answers: {
			duplicate: { type: "noul", probability: 0.2 },
			alreadyDone: { type: "noul", probability: 0.1 },
			actionable: { type: "choice", value: "no", probabilities: { yes: 0.5, no: 0.5 }, confidence: 0.9 },
		},
		usage: { input_tokens: 10, output_tokens: 5, cost: 0.001 },
		provider: "Typesafe",
		id: "gen-dec-ev83-file",
	});
	const transport: GateTransport = async () => ({ ok: true, status: 200, body });
	const { composeFollowupReview } = await import("../extensions/followup-tool.ts");
	const { result, lines } = await composeFollowupReview([DRAFT], repo, { apiKey: "k-test", transport });
	if (result.mode === "off") throw new Error("fixture gate must be active");
	const c = result.candidates[0]!;
	expect(c.status).toBe("ok");
	expect(lines.length).toBe(1);
	// decisionLine(record) + " — " + title + " (active)" — the literal
	// Mode:-prefixed byte sequence the runner's DONE report carries verbatim.
	expect(lines[0]!.startsWith("Mode: File — ")).toBe(true);
	expect(lines[0]!).toContain(DRAFT.title);
	expect(lines[0]!.endsWith("(active)")).toBe(true);
});

// ---------------------------------------------------------------------------
// 4. Prose tests
// ---------------------------------------------------------------------------

// --- features-deliver.md Phase 3 ---

test("features-deliver Phase 3: the follow-up sentence names step 13's recorded decision as the disposition source and routes unresolved/confirmation-pending candidates through ESCALATION", () => {
	const text = packaged("council/procedures/features-deliver.md");
	// The prose.test.ts-pinned anchor is retained.
	expect(text).toContain("**Every follow-up filed**");
	// The replacement sentence's pins (spec §Design.2, byte-exact anchors):
	expect(text).toContain("recorded\n  follow-up decision at step 13's confirm gate");
	expect(text).toContain("by its draft title");
	expect(text).toContain("never re-decides one");
	expect(text).toContain("awaiting its\n  confirming ruling");
	expect(text).toContain("**held**");
	expect(text).toContain("through its runner's `ESCALATION`");
	expect(text).toContain("no card filed, no silent drop");
	expect(text).toContain("resume it against the same drafted title");
	// The usage-block anchor is retained.
	expect(text).toContain("usage block verbatim");
});

// --- council-runner.md <followup_decision> block ---

function runnerText(): string {
	return packaged("council/agents/council-runner.md");
}

function followupDecisionBlock(): string {
	const text = runnerText();
	const start = text.indexOf("<followup_decision>");
	const end = text.indexOf("</followup_decision>");
	expect(start).toBeGreaterThan(-1);
	expect(end).toBeGreaterThan(start);
	return text.slice(start, end);
}

test("council-runner frontmatter carries the followup grant", () => {
	const frontmatter = runnerText().split("---")[1]!;
	expect(frontmatter).toMatch(/^tools: .*\bfollowup\b/m);
});

test("<followup_decision> block sits after <escalation_contract>, outside <return_contract>", () => {
	const text = runnerText();
	const escClose = text.indexOf("</escalation_contract>");
	const start = text.indexOf("<followup_decision>");
	const retOpen = text.indexOf("<return_contract>", start);
	expect(escClose).toBeGreaterThan(-1);
	expect(start).toBeGreaterThan(escClose);
	expect(retOpen).toBeGreaterThan(start); // the block ends before <return_contract> opens
});

test("<followup_decision> pins: record-never-re-decide, draft-title identifier, the resolvedMode trap, and ledger-direct prohibition", () => {
	const block = followupDecisionBlock();
	expect(block).toContain("`council_followup_review` ONCE");
	expect(block).toContain("draft order");
	expect(block).toContain("never\nre-decide a candidate the tool already answered");
	expect(block).toContain("never override a\ndisposition into a different one");
	expect(block).toContain("draft title");
	expect(block).toContain("no `FLLWUP-N` id");
	expect(block).toContain('`status: "ok"`');
	expect(block).toContain("fail-safe `File`");
	expect(block).toContain("never the mode string");
	expect(block).toContain("Never\nread `council/gate-ledger.jsonl` directly");
});

test("<followup_decision> pins: every surfaced candidate ends step 13 as ESCALATION before any write; the three modes' packets are distinguishable; held-not-filed", () => {
	const block = followupDecisionBlock();
	expect(block).toContain("ends step 13 as an\n`ESCALATION` before any write");
	expect(block).toContain("disposition\nsource, never the container's confirmation");
	expect(block).toContain("**ratified**");
	expect(block).toContain("as information\n  only");
	expect(block).toContain("no line; say so plainly");
	expect(block).toContain("no card was written");
	expect(block).toContain("write nothing first");
	expect(block).toContain("no card to `council/cards/`");
	expect(block).toContain("silently dropped");
	expect(block).toContain("held, not\nfiled");
	expect(block).toContain("resumable by the\nnext runner against the same drafted title");
});

test("<followup_decision> pins: apply only on a confirming dispatch (DONE bullet list), the HALT pin, and the R6 boundaries restated in place", () => {
	const block = followupDecisionBlock();
	expect(block).toContain("confirming ruling");
	expect(block).toContain("bullet\nlist keyed by draft title");
	expect(block).toContain("verbatim (you do not paraphrase)");
	expect(block).toContain("never rides `RETIRED`");
	expect(block).toContain("never rides `HALT`");
	expect(block).toContain("no disposition reached");
	expect(block).toContain("partial: dispositions reached for N of M candidates");
	expect(block).toContain("card-withdrawal meaning");
	expect(block).toContain("`File | Merge | Drop`");
});

// --- R6 byte baselines (re-expressed, never deleted) ---

/** Slice helper: from `startMarker` (inclusive) to `endMarker` (exclusive). */
function slice(text: string, startMarker: string, endMarker: string): string {
	const s = text.indexOf(startMarker);
	const e = text.indexOf(endMarker, s);
	expect(s).toBeGreaterThan(-1);
	expect(e).toBeGreaterThan(s);
	return text.slice(s, e);
}

test("R6: <return_contract>'s four-tag list is byte-unchanged", () => {
	const tags = slice(runnerText(), "- **`ESCALATION`**", "</return_contract>");
	expect(tags).toBe(`- **\`ESCALATION\`** — a ruling-seat question per \`<escalation_contract>\`.
  Carries: the card id, the exact question, every position and test result
  relevant to it, and explicitly no recommendation.
- **\`DONE\`** — the card reached \`Done\` on the board per council.md's own
  observed-artifact rule (merged, CI green on the merged SHA — substituted
  per \`features-deliver.md\`). Carries: the card id, the merged SHA, the gate
  evidence, any follow-up cards filed, and — if the card closed carrying
  an \`open-untested\` residual per \`<step_9_iteration_cap>\` — the ruling
  that accepted it.
- **\`RETIRED\`** — the card was withdrawn during this run (e.g. a
  steward-level ruling, applied via an earlier \`ESCALATION\` resumption,
  that declines the card outright). Carries: the card id and the ruling
  that retired it.
- **\`HALT\`** — an environment failure this container cannot repair itself:
  a seat that failed \`<seat_resolution_check>\`, or a prerequisite
  council.md's later steps assume that Phase 0 should have cleared but
  didn't. Carries: the card id, the exact failure (the literal error, not
  a paraphrase), and what needs to happen before any runner can continue
  this card — e.g. "the \`owner\` seat does not resolve: reinstall or update
  pi-council so the seat file is present, then re-dispatch."
`);
});

test("R6: RETIRED's clause is byte-identical, with zero Drop and zero candidate occurrences in its span", () => {
	const retired = slice(runnerText(), "- **`RETIRED`**", "- **`HALT`**");
	expect(retired).toBe(`- **\`RETIRED\`** — the card was withdrawn during this run (e.g. a
  steward-level ruling, applied via an earlier \`ESCALATION\` resumption,
  that declines the card outright). Carries: the card id and the ruling
  that retired it.
`);
	expect(retired).not.toContain("Drop");
	expect(retired).not.toContain("candidate");
});
