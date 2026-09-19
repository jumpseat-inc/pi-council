// EV-66 — offline tests for the parent-session `council_gate` tool.
//
// Spec: docs/superpowers/specs/2026-09-19-EV-66-design.md §2–§4, §9. Every
// test runs the REAL tool execute over a mkdtemp repo with a repo-local gate
// policy pointing at a loopback decisions stub hosted by the test process —
// the production composition (loadGatePolicy → loadGateQuestions +
// loadGateDecision → buildGateState → runGate with the production transport,
// apiKey resolved from the env) with zero external POSTs. The live arm lives
// elsewhere; nothing here touches the network beyond 127.0.0.1.
//
// Pins: R3 off is a mechanical no-op BEFORE loaders/build/fetch/write/widget
// (zero stub connections, no ledger file, zero widget calls); advisory writes
// one v2 line per card with advisory:true and no record.outcome.* facts;
// active takes the identical mechanical path with advisory:false; the result
// is verdict-opaque BY SHAPE (key walk + regex); a malformed card field fails
// loud naming the field; registration is parent-mode-only (never folded into
// registerHubTools, never visible to seats).
import { test, expect, afterEach } from "bun:test";
import * as fs from "node:fs";
import * as http from "node:http";
import * as os from "node:os";
import * as path from "node:path";
import { CONFIG_DIR_NAME } from "@earendil-works/pi-coding-agent";
import { GATE_PINNED_MODEL } from "../extensions/gate.ts";
import { GATE_WIDGET_KEY, registerGateTool } from "../extensions/gate-tool.ts";
import { readGateLedger } from "../extensions/gate-ledger.ts";

// ---------------------------------------------------------------------------
// Substrate: loopback decisions stub + mkdtemp repo + a captured registration
// ---------------------------------------------------------------------------

interface StubHandle {
	url: string;
	postCount(): number;
	lastBody(): unknown;
	close(): Promise<void>;
}

/** Per-card-keyed canned answers, keyed on body.state.card.id (the falsifier
 * non-vacuity clause, mirrored at unit level). */
const CANNED: Record<string, { answers: Record<string, unknown>; mode: string }> = {
	"EV-901": {
		// noul `probability` is P(yes); the mechanical poles are reversible=yes,
		// publicContract=no, blastRadius=no — so P(no)=1-p carries those composites.
		answers: {
			reversible: { type: "noul", probability: 0.95 },
			publicContract: { type: "noul", probability: 0.1 },
			blastRadius: { type: "noul", probability: 0.1 },
			decidablyTestable: { type: "choice", value: "yes", probabilities: { yes: 0.93, no: 0.07 }, confidence: 0.93 },
		},
		mode: "Direct",
	},
	"EV-902": {
		answers: {
			reversible: { type: "noul", probability: 0.2 },
			publicContract: { type: "noul", probability: 0.2 },
			blastRadius: { type: "noul", probability: 0.9 },
			decidablyTestable: { type: "choice", value: "yes", probabilities: { yes: 0.9, no: 0.1 }, confidence: 0.9 },
		},
		mode: "Deliberate",
	},
};

function startStub(): Promise<StubHandle> {
	let posts = 0;
	let lastBody: unknown = null;
	const server = http.createServer((req, res) => {
		let raw = "";
		req.on("data", (c: Buffer) => (raw += c.toString("utf-8")));
		req.on("end", () => {
			posts++;
			const body = JSON.parse(raw) as { state?: { card?: { id?: string } } };
			lastBody = body;
			const cardId = body?.state?.card?.id ?? "";
			const canned = CANNED[cardId];
			res.writeHead(200, { "Content-Type": "application/json" });
			res.end(
				JSON.stringify(
					canned
						? {
							model: `${GATE_PINNED_MODEL}-20260917`,
							answers: canned.answers,
							usage: { input_tokens: 120, output_tokens: 40, cost: 0.001 },
							provider: "Typesafe",
							id: `gen-ev66-${cardId}`,
						}
						: { model: `${GATE_PINNED_MODEL}-20260917`, answers: {}, usage: { input_tokens: 1, output_tokens: 1, cost: 0 }, provider: "Typesafe", id: "gen-ev66-unknown" },
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
				lastBody: () => lastBody,
				close: () => new Promise((r) => server.close(() => r())),
			});
		});
	});
}

function tmpRepo(): string {
	return fs.mkdtempSync(path.join(os.tmpdir(), "ev66-tool-"));
}

function writePolicy(repo: string, mode: "off" | "advisory" | "active", endpoint: string): void {
	const dir = path.join(repo, CONFIG_DIR_NAME, "council", "gate");
	fs.mkdirSync(dir, { recursive: true });
	const policy: Record<string, unknown> = {
		policyVersion: "ev66-tool-test-1",
		mode,
		model: GATE_PINNED_MODEL,
		endpoint,
	};
	if (mode !== "off") policy.gateStateBudgetTokens = 32000; // off may omit it (R3/skeptic O8)
	fs.writeFileSync(path.join(dir, "policy.json"), JSON.stringify(policy, null, 2));
}

function cards(): Array<{ id: string; title: string; goal: string; acceptance: string }> {
	return [
		{
			id: "EV-901",
			title: "Loopback success probe",
			goal: "Reach the packaged decide composite through the production transport on a loopback endpoint",
			acceptance: "The success line carries the decide basis and the per-card answers verbatim",
		},
		{
			id: "EV-902",
			title: "Credential-less failure probe",
			goal: "Fail closed pre-transport when the blast radius override fires on the canned answers",
			acceptance: "The failure line carries the override basis and the full panel",
		},
	];
}

/** The captured tool config from a fake ExtensionAPI — tests call
 * execute(id, params, signal, onUpdate, ctx) directly. */
interface RegisteredTool {
	name: string;
	execute(id: string, params: any, signal: AbortSignal | undefined, onUpdate: unknown, ctx: any): Promise<any>;
}

function captureTool(repo: string): RegisteredTool {
	const tools: RegisteredTool[] = [];
	const pi = { registerTool: (t: RegisteredTool) => tools.push(t) } as unknown as Parameters<typeof registerGateTool>[0];
	registerGateTool(pi, repo);
	expect(tools).toHaveLength(1);
	return tools[0]!;
}

/** A widget spy: records every setWidget call with its key and content. */
function uiSpy(): { hasUI: boolean; calls: Array<{ key: string; content: unknown }>; ui: unknown } {
	const calls: Array<{ key: string; content: unknown }> = [];
	return {
		hasUI: true,
		calls,
		ui: {
			setWidget: (key: string, content: unknown) => calls.push({ key, content }),
		},
	};
}

function ledgerPath(repo: string): string {
	return path.join(repo, CONFIG_DIR_NAME, "council", "gate-ledger.jsonl");
}

let stub: StubHandle | undefined;
let repo: string | undefined;
let savedKey: string | undefined;

afterEach(async () => {
	await stub?.close();
	stub = undefined;
	if (repo) {
		fs.rmSync(repo, { recursive: true, force: true });
		repo = undefined;
	}
	if (savedKey !== undefined) {
		if (savedKey === "") delete process.env.OPENROUTER_API_KEY;
		else process.env.OPENROUTER_API_KEY = savedKey;
		savedKey = undefined;
	}
});

function setEnvKey(value: string | undefined): void {
	savedKey = process.env.OPENROUTER_API_KEY ?? "";
	if (value === undefined) delete process.env.OPENROUTER_API_KEY;
	else process.env.OPENROUTER_API_KEY = value;
}

// ---------------------------------------------------------------------------
// 1. Off is a mechanical no-op that precedes everything (R3, skeptic O8)
// ---------------------------------------------------------------------------

test("off: no-op result, no ledger file, zero stub connections, zero widget lines (off policy may omit the budget)", async () => {
	repo = tmpRepo();
	stub = await startStub();
	writePolicy(repo, "off", stub.url);
	setEnvKey("ev66-unit-dummy-key");
	const tool = captureTool(repo);
	const ui = uiSpy();
	ui.hasUI = true;
	const result = await tool.execute("t1", { cards: cards() }, undefined, undefined, { hasUI: true, ui: ui.ui });

	// the mechanical no-op shape, before any loader could throw on the absent
	// budget key
	const out = JSON.parse(result.content[0].text) as Record<string, unknown>;
	expect(out).toEqual({ mode: "off", recorded: 0 });
	expect(fs.existsSync(ledgerPath(repo))).toBe(false);
	expect(stub.postCount()).toBe(0);
	expect(ui.calls).toHaveLength(0);
});

// ---------------------------------------------------------------------------
// 2. Advisory: one line per card, advisory:true, resolvedMode + basis
// ---------------------------------------------------------------------------

test("advisory: one v2 line per card, advisory:true, resolvedMode+basis, no record.outcome.* facts", async () => {
	repo = tmpRepo();
	stub = await startStub();
	writePolicy(repo, "advisory", stub.url);
	setEnvKey("ev66-unit-dummy-key");
	const tool = captureTool(repo);
	const result = await tool.execute("t2", { cards: cards() }, undefined, undefined, { hasUI: false, ui: undefined });

	expect(stub.postCount()).toBe(2); // exactly one POST per card
	const led = readGateLedger(repo);
	expect(led.calls).toHaveLength(2);
	for (const call of led.calls) {
		expect(call.schemaVersion).toBe(2);
		expect(call.kind).toBe("call");
		expect(call.advisory).toBe(true);
	}
	// per-card resolved modes: the stub keyed answers produce distinct modes
	const modes = led.calls.map((c) => c.resolvedMode).sort();
	expect(modes).toEqual(["Deliberate", "Direct"]);
	// non-empty basis, no failure on the success path, answers stored verbatim
	for (const call of led.calls) {
		expect(typeof call.basis).toBe("string");
		expect(call.basis!.length).toBeGreaterThan(0);
		expect(call.failure).toBeUndefined();
		expect(Object.keys(call.answers).length).toBeGreaterThan(0);
		// v2 union only — no outcome facts spliced into the call line
		expect("outcome" in call).toBe(false);
	}
	// the direct-mode card carries the composite basis byte-shape
	const direct = led.calls.find((c) => c.resolvedMode === "Direct")!;
	expect(direct.basis).toContain("composite 3.68 ≥ direct threshold 3.40");
	// result: mechanical shape only
	const out = JSON.parse(result.content[0].text) as { policyMode: string; cards: Array<{ id: string; callId: string; status: string }> };
	expect(out.policyMode).toBe("advisory");
	expect(out.cards.map((c) => c.id).sort()).toEqual(["EV-901", "EV-902"]);
	expect(out.cards.every((c) => typeof c.callId === "string" && c.callId.length > 0)).toBe(true);
	expect(out.cards.every((c) => c.status === "ok")).toBe(true);
});

// ---------------------------------------------------------------------------
// 3. Active: identical mechanical path, advisory:false, result shape unchanged
// ---------------------------------------------------------------------------

test("active: advisory:false on every line, result shape unchanged", async () => {
	repo = tmpRepo();
	stub = await startStub();
	writePolicy(repo, "active", stub.url);
	setEnvKey("ev66-unit-dummy-key");
	const tool = captureTool(repo);
	const result = await tool.execute("t3", { cards: cards() }, undefined, undefined, { hasUI: false, ui: undefined });

	const led = readGateLedger(repo);
	expect(led.calls).toHaveLength(2);
	expect(led.calls.every((c) => c.advisory === false)).toBe(true);
	const out = JSON.parse(result.content[0].text) as { policyMode: string; cards: unknown[] };
	expect(out.policyMode).toBe("active");
	expect(out.cards).toHaveLength(2);
});

// ---------------------------------------------------------------------------
// 4. Result opacity by shape (never resolvedMode/basis/answers/decision/…)
// ---------------------------------------------------------------------------

test("result opacity: no verdict-bearing key and no verdict token anywhere in the returned structure", async () => {
	repo = tmpRepo();
	stub = await startStub();
	writePolicy(repo, "advisory", stub.url);
	setEnvKey("ev66-unit-dummy-key");
	const tool = captureTool(repo);
	const result = await tool.execute("t4", { cards: cards() }, undefined, undefined, { hasUI: false, ui: undefined });

	const BANNED_KEYS = new Set(["resolvedMode", "mode", "basis", "include", "answers", "decision", "failure", "reportedModel", "modelDrift"]);
	const VERDICT_RE = /\b(Deliberate|Verify|Direct|Mode:)\b/;
	const walk = (v: unknown, keyPath: string[] = []): void => {
		if (Array.isArray(v)) {
			for (const x of v) walk(x, keyPath);
			return;
		}
		if (v && typeof v === "object") {
			for (const [k, x] of Object.entries(v as Record<string, unknown>)) {
				expect(BANNED_KEYS.has(k), `key ${[...keyPath, k].join(".")} must not exist`).toBe(false);
				walk(x, [...keyPath, k]);
			}
			return;
		}
		if (typeof v === "string") expect(VERDICT_RE.test(v), `string ${JSON.stringify(v)} must be verdict-free`).toBe(false);
	};
	walk(result.content);
	walk(result.details);
});

// ---------------------------------------------------------------------------
// 5. Malformed card field fails loud naming the field (before any POST/write)
// ---------------------------------------------------------------------------

test("malformed card field: throws naming the field, zero POSTs, no ledger line", async () => {
	repo = tmpRepo();
	stub = await startStub();
	writePolicy(repo, "advisory", stub.url);
	setEnvKey("ev66-unit-dummy-key");
	const tool = captureTool(repo);

	const bad = cards();
	(bad[1] as Record<string, unknown>).acceptance = "";
	await expect(
		tool.execute("t5", { cards: bad }, undefined, undefined, { hasUI: false, ui: undefined }),
	).rejects.toThrow(/acceptance/);
	expect(stub.postCount()).toBe(0);
	expect(fs.existsSync(ledgerPath(repo))).toBe(false);
});

test("malformed touchedFiles entry: throws naming the entry field", async () => {
	repo = tmpRepo();
	stub = await startStub();
	writePolicy(repo, "advisory", stub.url);
	setEnvKey("ev66-unit-dummy-key");
	const tool = captureTool(repo);
	const bad = [{ ...cards()[0]!, touchedFiles: [{ path: "extensions/gate-tool.ts", linesChanged: 0 }] }];
	await expect(
		tool.execute("t5b", { cards: bad }, undefined, undefined, { hasUI: false, ui: undefined }),
	).rejects.toThrow(/linesChanged/);
	expect(stub.postCount()).toBe(0);
});

// ---------------------------------------------------------------------------
// 6. Widget choreography (pending line per card, [] on settle, hasUI guard)
// ---------------------------------------------------------------------------

test("widget: one pending line per card naming that card, then exactly one empty-settle; hasUI false renders nothing", async () => {
	repo = tmpRepo();
	stub = await startStub();
	writePolicy(repo, "advisory", stub.url);
	setEnvKey("ev66-unit-dummy-key");
	const tool = captureTool(repo);

	// hasUI true: pending per card, then the settle clear
	const ui = uiSpy();
	await tool.execute("t6", { cards: cards() }, undefined, undefined, { hasUI: true, ui: ui.ui });
	expect(ui.calls).toHaveLength(3);
	expect(ui.calls[0]).toEqual({ key: GATE_WIDGET_KEY, content: ["gate: advisory call in progress · EV-901"] });
	expect(ui.calls[1]).toEqual({ key: GATE_WIDGET_KEY, content: ["gate: advisory call in progress · EV-902"] });
	expect(ui.calls[2]).toEqual({ key: GATE_WIDGET_KEY, content: [] });

	// hasUI false: headless silence
	const ui2 = uiSpy();
	ui2.hasUI = false;
	await tool.execute("t6b", { cards: cards() }, undefined, undefined, { hasUI: false, ui: ui2.ui });
	expect(ui2.calls).toHaveLength(0);
});

// ---------------------------------------------------------------------------
// 7. A thrown unrecorded failure is generic — never runGate's own text
// ---------------------------------------------------------------------------

test("a thrown per-card failure re-surfaces GENERIC: no policy-mode / noul-join text, no verdict token", async () => {
	repo = tmpRepo();
	stub = await startStub();
	// advisory policy whose ENDPOINT carries the forbidden path — runGate's
	// pre-POST guard throws runGate's own policy text; the tool must not
	// surface it.
	writePolicy(repo, "advisory", "https://openrouter.ai/api/v1/chat/completions");
	setEnvKey("ev66-unit-dummy-key");
	const tool = captureTool(repo);
	const result = await tool.execute("t7", { cards: cards() }, undefined, undefined, { hasUI: false, ui: undefined });

	const out = JSON.parse(result.content[0].text) as { cards: Array<{ id: string; callId: string | null; status: string; message?: string }> };
	expect(out.cards).toHaveLength(2);
	for (const c of out.cards) {
		expect(c.status).toBe("failed");
		expect(c.callId).toBeNull();
		expect(c.message).toBe(`gate: the gate call for card ${c.id} failed`);
		expect(c.message).not.toContain("chat/completions");
		expect(c.message).not.toMatch(/\b(Deliberate|Verify|Direct|Mode:)\b/);
	}
	expect(fs.existsSync(ledgerPath(repo))).toBe(false);
});

// ---------------------------------------------------------------------------
// 8. Parent-mode-only registration (never folded into registerHubTools)
// ---------------------------------------------------------------------------

test("registration is parent-mode-only: own module, never hub-tools, never child.ts, wired after the COUNCIL_SEAT early return", () => {
	const read = (p: string): string =>
		fs.readFileSync(path.join(import.meta.dir, "..", "extensions", p), "utf-8");
	const hubTools = read("hub-tools.ts");
	const child = read("child.ts");
	const index = read("index.ts");

	// the gate tool is registered by its own module, never from hub-tools
	expect(hubTools.includes("council_gate")).toBe(false);
	expect(hubTools.includes("gate-tool")).toBe(false);
	// child mode never sees it (child.ts calls registerHubTools for hub seats —
	// the gate tool must not ride that path)
	expect(child.includes("council_gate")).toBe(false);
	expect(child.includes("gate-tool")).toBe(false);
	// the parent wiring: imported and called on the parent path, AFTER the
	// COUNCIL_SEAT early return (seats structurally cannot call it)
	expect(index.includes('from "./gate-tool.ts"')).toBe(true);
	const earlyReturn = index.indexOf("runChildMode(pi, repoRoot, seatName)");
	const gateCall = index.indexOf("registerGateTool(pi, repoRoot)");
	expect(earlyReturn).toBeGreaterThan(-1);
	expect(gateCall).toBeGreaterThan(earlyReturn);
});
