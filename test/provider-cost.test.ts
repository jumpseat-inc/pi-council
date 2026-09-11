// EV-29 (T-P1..T-P8d): the provider-cost module — pure harvest +
// injected-transport fetch. Fully offline: every test injects a
// FetchGeneration double; the production HTTP transport is exercised only
// against an injected global fetch double (never the network). The opt-in
// live probe (T-P9, spec §4) runs only under COUNCIL_INTEGRATION=1.
import { test, expect, beforeEach } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { parseSessionEntries, type SessionEntry } from "@earendil-works/pi-coding-agent";
import { ensureRunDir, findSessionFile, writeManifest, type RunManifest } from "../extensions/runs.ts";
import {
	PROVIDER_COMPONENTS,
	UNAVAILABLE_MARKER,
	collectGenerationIds,
	fetchProviderReport,
	openRouterGenerationTransport,
	providerComponentFigure,
	resolveOpenRouterApiKey,
	type FetchGeneration,
	type GenerationResponse,
	type ProviderCostReport,
} from "../extensions/provider-cost.ts";

// Captured before any env mutation (T-U16 precedent): tests root credential
// reads under a fresh tmp agent dir and never touch the real one.
const REAL_AGENT_DIR = (() => {
	const env = process.env.PI_CODING_AGENT_DIR;
	if (env) return env;
	return path.join(os.homedir(), ".pi", "agent");
})();

beforeEach(() => {
	process.env.PI_CODING_AGENT_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "ev29-agent-home-"));
});

const T0 = 1_700_000_000_000;
const iso = (ms: number) => new Date(ms).toISOString();

function tmpDir(prefix: string): string {
	return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

/** Write a session JSONL (header + entries) and return its path. */
function writeSessionFile(dir: string, sessionId: string, entries: object[]): string {
	const header = { type: "session", version: 3, id: sessionId, timestamp: iso(T0), cwd: dir };
	const file = path.join(dir, `${sessionId}.jsonl`);
	fs.writeFileSync(file, [header, ...entries].map((e) => JSON.stringify(e)).join("\n") + "\n");
	return file;
}

function assistantEntry(id: string, parentId: string | null, ts: number, responseId?: string) {
	return {
		id,
		parentId,
		timestamp: iso(ts),
		type: "message",
		message: {
			role: "assistant",
			provider: "p",
			model: "m",
			api: "openai-completions",
			content: [{ type: "text", text: "hi" }],
			stopReason: "stop",
			timestamp: ts,
			usage: { input: 1, totalTokens: 1, cost: { total: 1 } },
			...(responseId !== undefined ? { responseId } : {}),
		},
	};
}

function userEntry(id: string, parentId: string | null, ts: number, text = "/council go") {
	return {
		id,
		parentId,
		timestamp: iso(ts),
		type: "message",
		message: { role: "user", content: [{ type: "text", text }], timestamp: ts },
	};
}

function parseFixture(file: string): SessionEntry[] {
	return parseSessionEntries(fs.readFileSync(file, "utf-8")).filter((e) => e.type !== "session") as unknown as SessionEntry[];
}

function manifest(id: string, over: Partial<RunManifest> = {}): RunManifest {
	return {
		id,
		seat: "owner",
		model: "openrouter/anthropic/claude-x",
		parentJobId: null,
		pid: null,
		sessionId: id,
		state: "done",
		startedAt: T0 + 1500,
		settledAt: T0 + 2100,
		exitCode: 0,
		...over,
	};
}

interface Repo {
	root: string;
	runId: string;
}

/** A tmp repo whose run dir holds an OpenRouter-modelled job manifest and a
 * session JSONL (inside the run dir, exactly as production reads it) whose
 * assistant entries carry the given responseIds. Returns the sessionPath the
 * way production obtains it: via findSessionFile — never a caller-supplied id. */
function repoWithOpenRouterJob(runId: string, sessionEntries: object[], manifestOver: Partial<RunManifest> = {}): Repo & { sessionPath: string | null } {
	const root = tmpDir("ev29-repo-");
	ensureRunDir(root, runId);
	writeManifest(root, runId, manifest("job-1", manifestOver));
	const sessDir = tmpDir("ev29-sess-");
	const file = writeSessionFile(sessDir, "job-1", sessionEntries);
	// The session must be findable the production way. findSessionFile matches
	// on the header id, which is "job-1".
	fs.renameSync(file, path.join(root, ".pi", "council", "runs", runId, "1_job-1.jsonl"));
	const sessionPath = findSessionFile(root, runId, "job-1") ?? null;
	return { root, runId, sessionPath };
}

/** Transport double that records every generationId it is asked for. */
function recordingTransport(
	responses: Record<string, GenerationResponse | Error>,
): { transport: FetchGeneration; calls: string[] } {
	const calls: string[] = [];
	const transport: FetchGeneration = async (generationId) => {
		calls.push(generationId);
		const r = responses[generationId];
		if (r instanceof Error) throw r;
		return r;
	};
	return { transport, calls };
}

const REPORTED_FIXTURE: GenerationResponse = {
	id: "gen-f1",
	total_cost: 0.0042,
	upstream_inference_cost: 0.0031,
	upstream_inference_prompt_cost: 0.0011,
	upstream_inference_completions_cost: 0.002,
	cache_discount: 0.0002,
	is_byok: true,
	provider_name: "Infermatic",
	native_tokens_prompt: 12,
	native_tokens_cached: 880,
};

const NOW = () => iso(T0 + 9999);

// ---------------------------------------------------------------------------
// T-P1 — acceptance 1 + identity binding (O-2): the fetch saw exactly the ids
// harvested from the invocation's own session file, and the report carries the
// response's values (differing from any catalogue estimate).
// ---------------------------------------------------------------------------

test("T-P1: fixture response persisted — ids sourced via findSessionFile, values carried verbatim", async () => {
	const repo = repoWithOpenRouterJob("run-P1", [
		userEntry("u1", null, T0 + 1000),
		assistantEntry("a1", "u1", T0 + 2000, "gen-f1"),
	]);
	expect(repo.sessionPath).not.toBeNull();
	const { transport, calls } = recordingTransport({ "gen-f1": REPORTED_FIXTURE });
	const report = await fetchProviderReport({
		repoRoot: repo.root,
		runId: repo.runId,
		jobs: [{ jobId: "job-1", model: "openrouter/anthropic/claude-x", sessionPath: repo.sessionPath }],
		fetchGeneration: transport,
		apiKey: "k",
		now: NOW,
	});
	expect(report).not.toBeNull();
	// identity binding: the fetch saw exactly the session-harvested ids
	expect(calls).toEqual(["gen-f1"]);
	const r = report as ProviderCostReport;
	expect(r.status).toBe("reported");
	expect(r.totalCost).toBe(0.0042);
	expect(r.reason).toBeUndefined();
	expect(r.generations).toHaveLength(1);
	const g = r.generations[0]!;
	expect(g.generationId).toBe("gen-f1");
	expect(g.jobId).toBe("job-1");
	expect(g.model).toBe("openrouter/anthropic/claude-x");
	expect(g.totalCost).toBe(0.0042);
	expect(g.providerName).toBe("Infermatic");
	expect(g.upstreamInferenceCost).toBe(0.0031);
	expect(g.upstreamInferencePromptCost).toBe(0.0011);
	expect(g.upstreamInferenceCompletionsCost).toBe(0.002);
	expect(g.cacheDiscount).toBe(0.0002);
	expect(g.isByok).toBe(true);
	expect(g.nativeTokens).toEqual({ prompt: 12, completion: null, reasoning: null, cached: 880 });
	expect(g.status).toBe("reported");
	expect(typeof g.fetchedAt).toBe("string");
});

// ---------------------------------------------------------------------------
// T-P2 — acceptance 2: fetch failure → the identical non-empty marker for
// every component (an always-estimate accessor returns numbers and fails).
// ---------------------------------------------------------------------------

test("T-P2: rejecting transport → unavailable + reason + identical n/a for every component", async () => {
	const repo = repoWithOpenRouterJob("run-P2", [assistantEntry("a1", null, T0 + 2000, "gen-f1")]);
	const { transport, calls } = recordingTransport({ "gen-f1": new Error("ECONNREFUSED") });
	const report = await fetchProviderReport({
		repoRoot: repo.root,
		runId: repo.runId,
		jobs: [{ jobId: "job-1", model: "openrouter/anthropic/claude-x", sessionPath: repo.sessionPath }],
		fetchGeneration: transport,
		apiKey: "k",
		now: NOW,
	});
	expect(calls).toEqual(["gen-f1"]); // the fetch was attempted
	const r = report as ProviderCostReport;
	expect(r.status).toBe("unavailable");
	expect(r.reason).toBe("fetch-failed:ECONNREFUSED");
	expect(typeof r.reason).toBe("string");
	expect(r.reason!.length).toBeGreaterThan(0);
	for (const c of PROVIDER_COMPONENTS) {
		const figure = providerComponentFigure(r, c);
		expect(figure).toBe(UNAVAILABLE_MARKER);
		expect(typeof figure).toBe("string");
		expect((figure as string).length).toBeGreaterThan(0);
	}
});

// ---------------------------------------------------------------------------
// T-P3 — granularity honesty: no per-component dollar field ever exists.
// ---------------------------------------------------------------------------

test("T-P3: no per-component dollar field in the component list or the generation row", async () => {
	for (const c of PROVIDER_COMPONENTS) {
		expect(c).not.toMatch(/^(costInput|costOutput|costCacheRead|costCacheWrite)$/);
	}
	const repo = repoWithOpenRouterJob("run-P3", [assistantEntry("a1", null, T0 + 2000, "gen-f1")]);
	const { transport } = recordingTransport({ "gen-f1": REPORTED_FIXTURE });
	const r = (await fetchProviderReport({
		repoRoot: repo.root,
		runId: repo.runId,
		jobs: [{ jobId: "job-1", model: "openrouter/anthropic/claude-x", sessionPath: repo.sessionPath }],
		fetchGeneration: transport,
		apiKey: "k",
		now: NOW,
	})) as ProviderCostReport;
	const serialized = JSON.stringify(r.generations[0]);
	for (const forbidden of ["costInput", "costOutput", "costCacheRead", "costCacheWrite"]) {
		expect(serialized).not.toContain(forbidden);
	}
});

// ---------------------------------------------------------------------------
// T-P4 — partial failure (C4): successful rows retained verbatim; report
// unavailable (worst-of) with a C3 literal; totalCost = the reported sum.
// ---------------------------------------------------------------------------

test("T-P4: two generations, one fetch fails → successful row retained, totalCost is the reported sum", async () => {
	const repo = repoWithOpenRouterJob("run-P4", [
		assistantEntry("a1", null, T0 + 2000, "gen-a"),
		assistantEntry("a2", "a1", T0 + 3000, "gen-b"),
	]);
	const { transport, calls } = recordingTransport({
		"gen-a": { id: "gen-a", total_cost: 0.01, provider_name: "Alpha" },
		"gen-b": new Error("boom"),
	});
	const report = (await fetchProviderReport({
		repoRoot: repo.root,
		runId: repo.runId,
		jobs: [{ jobId: "job-1", model: "openrouter/anthropic/claude-x", sessionPath: repo.sessionPath }],
		fetchGeneration: transport,
		apiKey: "k",
		now: NOW,
	})) as ProviderCostReport;
	expect(calls.sort()).toEqual(["gen-a", "gen-b"]);
	expect(report.status).toBe("unavailable");
	expect(report.reason).toBe("fetch-failed:boom");
	expect(report.totalCost).toBe(0.01);
	expect(report.generations).toHaveLength(1);
	expect(report.generations[0]!.generationId).toBe("gen-a");
	expect(report.generations[0]!.providerName).toBe("Alpha");
	expect(report.generations[0]!.totalCost).toBe(0.01);
});

// ---------------------------------------------------------------------------
// T-P5 — total failure: zero reported generations, totalCost null, reason.
// ---------------------------------------------------------------------------

test("T-P5: all fetches reject → totalCost null, zero generations, deterministic reason", async () => {
	const repo = repoWithOpenRouterJob("run-P5", [
		assistantEntry("a1", null, T0 + 2000, "gen-a"),
		assistantEntry("a2", "a1", T0 + 3000, "gen-b"),
	]);
	const { transport, calls } = recordingTransport({
		"gen-a": new Error("down"),
		"gen-b": new Error("down"),
	});
	const report = (await fetchProviderReport({
		repoRoot: repo.root,
		runId: repo.runId,
		jobs: [{ jobId: "job-1", model: "openrouter/anthropic/claude-x", sessionPath: repo.sessionPath }],
		fetchGeneration: transport,
		apiKey: "k",
		now: NOW,
	})) as ProviderCostReport;
	expect(calls).toEqual(["gen-a", "gen-b"]);
	expect(report.status).toBe("unavailable");
	expect(report.reason).toBe("fetch-failed:down");
	expect(report.totalCost).toBeNull();
	expect(report.generations).toHaveLength(0);
	for (const c of PROVIDER_COMPONENTS) {
		expect(providerComponentFigure(report, c)).toBe(UNAVAILABLE_MARKER);
	}
});

// ---------------------------------------------------------------------------
// T-P6 — no eligibility: a non-OpenRouter-modelled job yields null and the
// transport is never called (the model gate lives in the module, so a caller
// that forgets to filter cannot manufacture a report).
// ---------------------------------------------------------------------------

test("T-P6: no OpenRouter-modelled job → null, transport never called", async () => {
	const repo = repoWithOpenRouterJob("run-P6", [assistantEntry("a1", null, T0 + 2000, "gen-f1")]);
	const { transport, calls } = recordingTransport({});
	const report = await fetchProviderReport({
		repoRoot: repo.root,
		runId: repo.runId,
		jobs: [{ jobId: "job-1", model: "anthropic/claude-x", sessionPath: repo.sessionPath }],
		fetchGeneration: transport,
		apiKey: "k",
		now: NOW,
	});
	expect(report).toBeNull();
	expect(calls).toHaveLength(0);
});

// ---------------------------------------------------------------------------
// T-P7 — no key: one unavailable report, transport never called.
// ---------------------------------------------------------------------------

test("T-P7: apiKey null → unavailable/no-api-key, transport never called", async () => {
	const repo = repoWithOpenRouterJob("run-P7", [assistantEntry("a1", null, T0 + 2000, "gen-f1")]);
	const { transport, calls } = recordingTransport({});
	const report = (await fetchProviderReport({
		repoRoot: repo.root,
		runId: repo.runId,
		jobs: [{ jobId: "job-1", model: "openrouter/anthropic/claude-x", sessionPath: repo.sessionPath }],
		fetchGeneration: transport,
		apiKey: null,
		now: NOW,
	})) as ProviderCostReport;
	expect(report.status).toBe("unavailable");
	expect(report.reason).toBe("no-api-key");
	expect(report.generations).toEqual([]);
	expect(calls).toHaveLength(0);
});

// ---------------------------------------------------------------------------
// T-P8 — session-missing / no-generation-id.
// ---------------------------------------------------------------------------

test("T-P8: missing session → session-missing; session with no responseId → no-generation-id", async () => {
	const { transport, calls } = recordingTransport({});
	// sessionPath null
	const r1 = (await fetchProviderReport({
		repoRoot: tmpDir("ev29-repo-"),
		runId: "run-P8a",
		jobs: [{ jobId: "job-1", model: "openrouter/anthropic/claude-x", sessionPath: null }],
		fetchGeneration: transport,
		apiKey: "k",
		now: NOW,
	})) as ProviderCostReport;
	expect(r1.status).toBe("unavailable");
	expect(r1.reason).toBe("session-missing");
	expect(r1.generations).toHaveLength(0);
	// session present but no responseId anywhere
	const repo = repoWithOpenRouterJob("run-P8b", [userEntry("u1", null, T0 + 1000), assistantEntry("a1", "u1", T0 + 2000)]);
	const r2 = (await fetchProviderReport({
		repoRoot: repo.root,
		runId: repo.runId,
		jobs: [{ jobId: "job-1", model: "openrouter/anthropic/claude-x", sessionPath: repo.sessionPath }],
		fetchGeneration: transport,
		apiKey: "k",
		now: NOW,
	})) as ProviderCostReport;
	expect(r2.status).toBe("unavailable");
	expect(r2.reason).toBe("no-generation-id");
	expect(r2.generations).toHaveLength(0);
	expect(calls).toHaveLength(0); // transport never called in either class
});

// ---------------------------------------------------------------------------
// T-P8b — timeout + undefined-report marker.
// ---------------------------------------------------------------------------

test("T-P8b: an aborted signal → reason timeout; providerComponentFigure(undefined, c) → n/a", async () => {
	const repo = repoWithOpenRouterJob("run-P8bt", [assistantEntry("a1", null, T0 + 2000, "gen-f1")]);
	const slowTransport: FetchGeneration = async (_id, signal) => {
		await new Promise<void>((_, reject) => {
			signal.addEventListener("abort", () => {
				const e = new Error("The operation was aborted");
				e.name = "AbortError";
				reject(e);
			});
		});
		throw new Error("unreachable");
	};
	const report = (await fetchProviderReport({
		repoRoot: repo.root,
		runId: repo.runId,
		jobs: [{ jobId: "job-1", model: "openrouter/anthropic/claude-x", sessionPath: repo.sessionPath }],
		fetchGeneration: slowTransport,
		apiKey: "k",
		now: NOW,
		timeoutMs: 30,
	})) as ProviderCostReport;
	expect(report.status).toBe("unavailable");
	expect(report.reason).toBe("timeout");
	for (const c of PROVIDER_COMPONENTS) {
		expect(providerComponentFigure(undefined, c)).toBe(UNAVAILABLE_MARKER);
	}
});

// ---------------------------------------------------------------------------
// T-P8c — credential resolution: env first, then the stored api_key
// credential, else null. Env is saved/restored so the test is hermetic.
// ---------------------------------------------------------------------------

test("T-P8c: resolveOpenRouterApiKey — env wins, stored api_key credential is the fallback, neither → null", () => {
	const saved = process.env.OPENROUTER_API_KEY;
	try {
		// env present
		process.env.OPENROUTER_API_KEY = "env-k";
		expect(resolveOpenRouterApiKey()).toBe("env-k");
		// env absent, stored api_key credential present
		delete process.env.OPENROUTER_API_KEY;
		const home = process.env.PI_CODING_AGENT_DIR!;
		fs.writeFileSync(path.join(home, "auth.json"), JSON.stringify({ openrouter: { type: "api_key", key: "stored-k" } }), { mode: 0o600 });
		expect(resolveOpenRouterApiKey()).toBe("stored-k");
		// neither
		fs.rmSync(path.join(home, "auth.json"));
		expect(resolveOpenRouterApiKey()).toBeNull();
		// a stored oauth credential is not a bearer key
		fs.writeFileSync(path.join(home, "auth.json"), JSON.stringify({ openrouter: { type: "oauth", access: "t", refresh: "r", expires: 0 } }), { mode: 0o600 });
		expect(resolveOpenRouterApiKey()).toBeNull();
	} finally {
		if (saved === undefined) delete process.env.OPENROUTER_API_KEY;
		else process.env.OPENROUTER_API_KEY = saved;
	}
});

// ---------------------------------------------------------------------------
// T-P8d — the production transport: unwraps the { data } envelope, sends the
// bearer header, encodes the id, throws HTTP <status> on non-ok. Exercised
// against an injected global fetch double — never the network.
// ---------------------------------------------------------------------------

test("T-P8d: openRouterGenerationTransport — envelope unwrap, header, id encoding, HTTP status throw", async () => {
	const fixture: GenerationResponse = { id: "gen f/1", total_cost: 0.5, provider_name: "P", is_byok: false };
	const seen: Array<{ url: string; init: RequestInit | undefined }> = [];
	const origFetch = globalThis.fetch;
	globalThis.fetch = (async (url: unknown, init?: RequestInit) => {
		seen.push({ url: String(url), init });
		return { ok: true, status: 200, json: async () => ({ data: fixture }) } as Response;
	}) as typeof fetch;
	try {
		const gen = await openRouterGenerationTransport("k")("gen f/1", new AbortController().signal);
		expect(gen).toEqual(fixture);
		expect(seen[0]!.url).toBe("https://openrouter.ai/api/v1/generation?id=gen%20f%2F1");
		expect((seen[0]!.init?.headers as Record<string, string>).Authorization).toBe("Bearer k");
	} finally {
		globalThis.fetch = origFetch;
	}
	// non-ok → HTTP <status> (reason becomes fetch-failed:HTTP 401)
	globalThis.fetch = (async () => ({ ok: false, status: 401, json: async () => ({}) })) as unknown as typeof fetch;
	try {
		let message = "";
		try {
			await openRouterGenerationTransport("k")("gen-x", new AbortController().signal);
		} catch (e) {
			message = e instanceof Error ? e.message : String(e);
		}
		expect(message).toBe("HTTP 401");
	} finally {
		globalThis.fetch = origFetch;
	}
});

// ---------------------------------------------------------------------------
// collectGenerationIds — pure harvest (C1).
// ---------------------------------------------------------------------------

test("C1: collectGenerationIds — assistant responseIds in file order, deduped first-occurrence-wins; non-assistant entries contribute nothing", () => {
	const dir = tmpDir("ev29-c1-");
	const file = writeSessionFile(dir, "s", [
		userEntry("u1", null, T0),
		assistantEntry("a1", "u1", T0 + 100, "gen-x1"),
		assistantEntry("a2", "a1", T0 + 200), // no responseId → nothing
		assistantEntry("a3", "a2", T0 + 300, "gen-x2"),
		assistantEntry("a4", "a3", T0 + 400, "gen-x1"), // duplicate → dropped
		{
			id: "c1", parentId: "a4", timestamp: iso(T0 + 500), type: "custom",
			customType: "council-invocation", data: { responseId: "gen-fake" },
		},
	]);
	expect(collectGenerationIds(parseFixture(file))).toEqual(["gen-x1", "gen-x2"]);
	expect(collectGenerationIds([])).toEqual([]);
});

// ---------------------------------------------------------------------------
// T-P9 (spec §4) — opt-in live probe: NEVER in the default suite. Requires a
// real key and a real generation id; skipped unless COUNCIL_INTEGRATION=1.
// ---------------------------------------------------------------------------

test("T-P9 (opt-in): live generation endpoint returns total_cost + provider_name + is_byok", async () => {
	if (process.env.COUNCIL_INTEGRATION !== "1") return; // gated, offline default
	const key = resolveOpenRouterApiKey();
	if (!key || !process.env.EV29_GENERATION_ID) return; // probe needs both
	const origFetch = globalThis.fetch;
	try {
		const gen = await openRouterGenerationTransport(key)(process.env.EV29_GENERATION_ID, AbortSignal.timeout(5_000));
		expect(typeof gen.total_cost).toBe("number");
		expect(typeof gen.provider_name).toBe("string");
		expect(typeof gen.is_byok).toBe("boolean");
		const serialized = JSON.stringify(gen);
		expect(serialized).not.toContain("costInput");
	} finally {
		globalThis.fetch = origFetch;
	}
});
