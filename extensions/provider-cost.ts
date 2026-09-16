// EV-29: the provider-reported cost retrieval module — pure harvest +
// injected-transport fetch. No ctx, no hub import (convention 7: hub.ts is
// untouched). The only filesystem access is reading each job's already-
// resolved session JSONL (resolved parent-side through runs.ts per
// convention 12). The production HTTP transport is the ONLY network-touching
// code and is never reached by the default test suite (tests inject a
// FetchGeneration double; the live surface is probed only under
// COUNCIL_INTEGRATION=1).
//
// Granularity honesty (steward A): the provider's fetchable surface reports
// generation-level dollars (total_cost, upstream_inference_cost, BYOK-only
// prompt/completions split, nullable cache_discount, is_byok) plus
// per-component NATIVE TOKEN counts. Nothing here ever derives a per-
// component dollar from catalogue rates; the four Usage.cost* slots stay
// catalogue-estimate. `(reported)` reads as "what this provider reported for
// this generation", never as the user's bill (BYOK is credit accounting).
import * as fs from "node:fs";
import {
	type FileEntry,
	parseSessionEntries,
	readStoredCredential,
	type SessionEntry,
} from "@earendil-works/pi-coding-agent";
// pi-ai's public exports map exposes no getEnvApiKey subpath ("." and the
// named subpaths only; the deep dist path is blocked), so the env half of the
// resolver reads the C3-ruled env var directly — the ruling names it: "neither
// OPENROUTER_API_KEY nor a stored credential resolved".
const OPENROUTER_API_KEY_ENV = "OPENROUTER_API_KEY";

/** C3 literals — record-only, never rendered. */
export type ProviderUnavailableReason =
	| "no-generation-id"
	| "session-missing"
	| `fetch-failed:${string}`
	| "timeout"
	| "no-api-key";

/** EV-39 (Q4 disclosure) — record-only literal set in the same pattern as
 * `ProviderUnavailableReason`: why the reported provider figure is partial.
 * EV-42 widens it: `attempts-unaccounted` is the figure-scoped literal set by
 * the J1 predicate when a new-shape walk left attempts without a figure. */
export type ProviderPartialReason = "final-attempt-only" | "attempts-unaccounted";

export interface ProviderNativeTokens {
	prompt: number | null;
	completion: number | null;
	reasoning: number | null;
	cached: number | null;
}

export interface ProviderGeneration {
	generationId: string;
	jobId: string; // R-7 attribution
	model: string;
	providerName: string | null; // R-7 routed upstream provider (per generation)
	totalCost: number | null; // generation-level dollars
	upstreamInferenceCost: number | null;
	upstreamInferencePromptCost: number | null; // BYOK-only split, when returned
	upstreamInferenceCompletionsCost: number | null; // BYOK-only split, when returned
	cacheDiscount: number | null;
	isByok: boolean | null; // persisted verbatim (steward B), never rendered
	nativeTokens: ProviderNativeTokens | null; // per-component native token counts (null = none carried)
	/** EV-42 — the attempt ordinal this generation was harvested from; present
	 * only when the entry carried `attempt` (new shape / legacy window shape).
	 * Absent on single-attempt and plain-legacy entries ⇒ old records stay
	 * byte-identical. `jobId` remains the tree-row id (no per-attempt key). */
	attempt?: number;
	status: "reported" | "unavailable";
	reason?: ProviderUnavailableReason; // present iff unavailable
	fetchedAt: string;
}

export interface ProviderCostReport {
	status: "reported" | "unavailable"; // worst-of: unavailable if ANY generation is unavailable
	reason?: ProviderUnavailableReason; // deterministic; present iff unavailable
	/** EV-39 (steward Escalation 2, Q4) — record-only literal, present iff the
	 * reported figure is PARTIAL. At EV-39 a retried dispatch's provider figure
	 * is the final attempt's alone; wholeness is EV-42. Never rendered as copy —
	 * the usage block's conditional legend is the only renderer. */
	partial?: ProviderPartialReason;
	/** EV-42 (J1) — record-only audit: sorted unique ordinals of new-shape
	 * entries that yielded no generation ids (session missing / unreadable /
	 * zero ids). Present iff any new-shape attempt went unaccounted. */
	unaccountedAttempts?: number[];
	totalCost: number | null; // Σ over reported generations; null iff none reported
	generations: ProviderGeneration[];
}

/** The generation endpoint's wire shape; every field optional and defensively
 * read (the endpoint is documented to always carry total_cost/provider_name —
 * a missing one yields null and simply sums as absent). */
export interface GenerationResponse {
	id?: string;
	total_cost?: number | null;
	upstream_inference_cost?: number | null;
	upstream_inference_prompt_cost?: number | null;
	upstream_inference_completions_cost?: number | null;
	cache_discount?: number | null;
	is_byok?: boolean | null;
	provider_name?: string | null;
	native_tokens_prompt?: number | null;
	native_tokens_completion?: number | null;
	native_tokens_reasoning?: number | null;
	native_tokens_cached?: number | null;
}

/** Injected transport (the test seam — no network in the default suite). */
export type FetchGeneration = (
	generationId: string,
	signal: AbortSignal,
) => Promise<GenerationResponse>;

/** Pure: assistant entries' responseIds, file order, deduped (first
 * occurrence wins). Non-message entries and non-assistant messages
 * contribute nothing. */
export function collectGenerationIds(entries: SessionEntry[]): string[] {
	const out: string[] = [];
	const seen = new Set<string>();
	for (const e of entries) {
		if (e.type !== "message") continue;
		const msg = (e as { message?: { role?: string; responseId?: unknown } }).message;
		if (!msg || msg.role !== "assistant") continue;
		const rid = msg.responseId;
		if (typeof rid !== "string" || rid.length === 0 || seen.has(rid)) continue;
		seen.add(rid);
		out.push(rid);
	}
	return out;
}

/** The record-level unavailable marker (R-2 literal). Every nameable figure
 * returns the identical non-empty literal `n/a` on a failed report (D/E). */
export const UNAVAILABLE_MARKER = "n/a";

/** The nameable provider figures — the components the R-2/E marker rule
 * covers at record level. Deliberately contains NO Usage per-component dollar
 * field (costInput/costOutput/costCacheRead/costCacheWrite): those stay
 * catalogue-estimate (steward A). */
export const PROVIDER_COMPONENTS = [
	"totalCost",
	"upstreamInferenceCost",
	"upstreamInferencePromptCost",
	"upstreamInferenceCompletionsCost",
	"cacheDiscount",
	"nativeTokens.prompt",
	"nativeTokens.completion",
	"nativeTokens.reasoning",
	"nativeTokens.cached",
] as const;
export type ProviderComponent = (typeof PROVIDER_COMPONENTS)[number];

/** The figure, or UNAVAILABLE_MARKER on a failed report / absent field. On an
 * unavailable report every named component returns the identical non-empty
 * literal. On a reported report the component figure is the Σ over reported
 * generations that carried it (an aggregation of reported values, never a
 * derivation), or the marker when no generation carried the field. */
export function providerComponentFigure(
	report: ProviderCostReport | undefined,
	component: ProviderComponent,
): number | string {
	if (!report || report.status === "unavailable") return UNAVAILABLE_MARKER;
	const values: number[] = [];
	for (const g of report.generations) {
		if (g.status !== "reported") continue;
		let v: number | null;
		switch (component) {
			case "totalCost":
				v = g.totalCost;
				break;
			case "upstreamInferenceCost":
				v = g.upstreamInferenceCost;
				break;
			case "upstreamInferencePromptCost":
				v = g.upstreamInferencePromptCost;
				break;
			case "upstreamInferenceCompletionsCost":
				v = g.upstreamInferenceCompletionsCost;
				break;
			case "cacheDiscount":
				v = g.cacheDiscount;
				break;
			case "nativeTokens.prompt":
				v = g.nativeTokens?.prompt ?? null;
				break;
			case "nativeTokens.completion":
				v = g.nativeTokens?.completion ?? null;
				break;
			case "nativeTokens.reasoning":
				v = g.nativeTokens?.reasoning ?? null;
				break;
			case "nativeTokens.cached":
				v = g.nativeTokens?.cached ?? null;
				break;
		}
		if (v !== null) values.push(v);
	}
	return values.length > 0 ? values.reduce((a, b) => a + b, 0) : UNAVAILABLE_MARKER;
}

export interface FetchProviderReportInput {
	repoRoot: string;
	runId: string;
	/** Invocation-window manifests mapped to jobs: OpenRouter-modelled and
	 * startedAt >= markerAt (the window filter lives at the flush; the model
	 * gate is re-applied here so eligibility is the module's own property). */
	jobs: { jobId: string; model: string; attempt?: number; sessionPath: string | null }[];
	fetchGeneration: FetchGeneration; // injected; production passes the real transport
	apiKey: string | null;
	now?: () => string; // default ISO wall clock
	timeoutMs?: number; // default 5000 (AbortSignal.timeout)
}

/** C3 reason precedence: a fixed order of the failure classes actually
 * observed; the first failure in the loop sets report.reason unless a
 * higher-precedence class appears later (equal class keeps the first). */
const REASON_PRECEDENCE: Record<string, number> = {
	"no-api-key": 0,
	"session-missing": 1,
	"no-generation-id": 2,
	timeout: 3,
};

function reasonIndex(reason: string): number {
	const base = REASON_PRECEDENCE[reason];
	if (base !== undefined) return base;
	if (reason.startsWith("fetch-failed:")) return 4;
	return 5;
}

function worstReason(observed: string[]): string | undefined {
	let best: string | undefined;
	for (const r of observed) {
		if (best === undefined || reasonIndex(r) < reasonIndex(best)) best = r;
	}
	return best;
}

/** `parseSessionEntries` returns `FileEntry[]` (`SessionHeader | SessionEntry`);
 * the header carries no messages — narrow it away before harvesting ids. */
function isSessionEntry(e: FileEntry): e is SessionEntry {
	return e.type !== "session";
}

function num(v: unknown): number | null {
	return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function toGeneration(
	gen: GenerationResponse,
	job: { jobId: string; model: string; attempt?: number },
	generationId: string,
	fetchedAt: string,
): ProviderGeneration {
	const prompt = num(gen.native_tokens_prompt);
	const completion = num(gen.native_tokens_completion);
	const reasoning = num(gen.native_tokens_reasoning);
	const cached = num(gen.native_tokens_cached);
	const nativeTokens =
		prompt !== null || completion !== null || reasoning !== null || cached !== null
			? { prompt, completion, reasoning, cached }
			: null; // never fabricated
	return {
		generationId,
		jobId: job.jobId,
		model: job.model,
		providerName: typeof gen.provider_name === "string" && gen.provider_name.length > 0 ? gen.provider_name : null,
		totalCost: num(gen.total_cost),
		upstreamInferenceCost: num(gen.upstream_inference_cost),
		upstreamInferencePromptCost: num(gen.upstream_inference_prompt_cost),
		upstreamInferenceCompletionsCost: num(gen.upstream_inference_completions_cost),
		cacheDiscount: num(gen.cache_discount),
		isByok: typeof gen.is_byok === "boolean" ? gen.is_byok : null,
		nativeTokens,
		...(job.attempt !== undefined ? { attempt: job.attempt } : {}),
		status: "reported",
		fetchedAt,
	};
}

/** Fetch the provider report for the invocation-window OpenRouter jobs.
 * null = no eligible job (no OpenRouter-modelled manifest) ⇒ the caller
 * writes NO provider block. A transport rejection is converted into the
 * report (unavailable + C3 reason) — this function never throws for a
 * failed fetch; only the caller's write path can fail the record. */
export async function fetchProviderReport(input: FetchProviderReportInput): Promise<ProviderCostReport | null> {
	const now = input.now ?? (() => new Date().toISOString());
	const timeoutMs = input.timeoutMs ?? 5_000;
	const jobs = input.jobs.filter((j) => j.model.startsWith("openrouter/"));
	if (jobs.length === 0) return null;
	if (input.apiKey === null) {
		return { status: "unavailable", reason: "no-api-key", totalCost: null, generations: [] };
	}
	const generations: ProviderGeneration[] = [];
	const failures: string[] = [];
	// EV-42 — per-entry unaccounted buckets (new shape only). A read failure
	// (truncated/corrupt file) lands HERE, never in a contribute-zero bucket —
	// otherwise a corrupt attempt collapses to ids = [] and the figure reads
	// whole (the EV-39 falsification class).
	const unaccounted: number[] = [];
	const unaccountedClasses: string[] = [];
	for (const job of jobs) {
		const isNewShape = job.attempt !== undefined;
		const markUnaccounted = (cls: string): void => {
			if (isNewShape) {
				unaccounted.push(job.attempt!);
				unaccountedClasses.push(cls);
			} else {
				failures.push(cls); // legacy entry — today's semantics, byte-identical
			}
		};
		if (job.sessionPath === null) {
			markUnaccounted("session-missing");
			continue;
		}
		let ids: string[] | null;
		try {
			ids = collectGenerationIds(
				parseSessionEntries(fs.readFileSync(job.sessionPath, "utf-8")).filter(isSessionEntry),
			);
		} catch {
			ids = null; // missing, unreadable, or unparseable — never contribute-zero
		}
		if (ids === null || ids.length === 0) {
			markUnaccounted("no-generation-id");
			continue;
		}
		for (const id of ids) {
			const signal = AbortSignal.timeout(timeoutMs);
			try {
				const gen = await input.fetchGeneration(id, signal);
				generations.push(toGeneration(gen, job, id, now()));
			} catch (e) {
				if (signal.aborted) {
					failures.push("timeout");
				} else {
					const msg = (e instanceof Error ? e.message : String(e)).trim();
					failures.push(`fetch-failed:${msg}`);
				}
			}
		}
	}
	// EV-42 — the unaccounted audit + the C3 worst over BOTH observed sets
	// (a legacy failure and a new-shape unaccounted class rank identically).
	const unaccountedAttempts = [...new Set(unaccounted)].sort((a, b) => a - b);
	const reason = worstReason([...failures, ...unaccountedClasses]);
	const reported = generations.filter((g) => g.status === "reported");
	const totalCost = reported.reduce<number | null>(
		(sum, g) => (g.totalCost === null ? sum : (sum ?? 0) + g.totalCost),
		null,
	);
	// J1 (binding) — the figure-scoped predicate, set in the producer (the
	// disclosure is the module's claim, never a caller's post-hoc stamp):
	// on the new shape, partial := totalCost !== null && unaccountedAttempts
	// nonempty; otherwise absent. The all-unaccounted shape (totalCost null)
	// carries NO partial — the `n/a` legend only.
	const hasNewShape = jobs.some((j) => j.attempt !== undefined);
	return {
		// The `generations.length === 0` clause makes the all-unaccounted new
		// shape `unavailable`; it changes no legacy path (legacy zero-generation
		// entries already push a failure).
		status: failures.length > 0 || generations.length === 0 ? "unavailable" : "reported",
		...(reason !== undefined ? { reason: reason as ProviderUnavailableReason } : {}),
		...(hasNewShape && unaccountedAttempts.length > 0 ? { unaccountedAttempts } : {}),
		totalCost,
		generations,
		...(hasNewShape && totalCost !== null && unaccountedAttempts.length > 0
			? { partial: "attempts-unaccounted" as const }
			: {}),
	};
}

/** Credential resolution (production default only): the provider env key
 * first (OPENROUTER_API_KEY — the C3-ruled var; pi-ai's getEnvApiKey is not
 * exposed by its exports map), then the stored api_key credential; neither
 * ⇒ null. Tests inject an explicit apiKey so the real resolution is never
 * exercised offline. */
export function resolveOpenRouterApiKey(): string | null {
	const env = process.env[OPENROUTER_API_KEY_ENV];
	if (typeof env === "string" && env.length > 0) return env;
	const cred = readStoredCredential("openrouter");
	if (cred && cred.type === "api_key" && typeof cred.key === "string" && cred.key.length > 0) return cred.key;
	return null;
}

const GENERATION_URL = "https://openrouter.ai/api/v1/generation?id=";

/** The production HTTP transport — the only network code. Unwraps the live
 * endpoint's `{ data: {…} }` envelope (defensive plain-object fallback) and
 * encodes non-ok statuses as thrown `HTTP <status>` errors, which surface in
 * C3 literals as `fetch-failed:HTTP <status>`. */
export function openRouterGenerationTransport(apiKey: string): FetchGeneration {
	return async (generationId, signal) => {
		const res = await fetch(`${GENERATION_URL}${encodeURIComponent(generationId)}`, {
			headers: { Authorization: `Bearer ${apiKey}` },
			signal,
		});
		if (!res.ok) throw new Error(`HTTP ${res.status}`);
		const body: unknown = await res.json();
		const gen =
			body && typeof body === "object" && "data" in body ? (body as { data?: unknown }).data : body;
		if (!gen || typeof gen !== "object") throw new Error("malformed generation response");
		return gen as GenerationResponse;
	};
}
