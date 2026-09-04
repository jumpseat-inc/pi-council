import { describe, expect, test } from "bun:test";
import { resolveCatalogue } from "../extensions/catalogue.ts";
import type { CatalogueModel } from "../extensions/catalogue.ts";
import type { Seat } from "../extensions/seats.ts";

/** Build a full Seat literal. Thinking level optional — the resolver must
 *  omit SeatState.currentThinking when none resolves. */
function makeSeat(name: string, model: string, thinkingLevel?: string): Seat {
	return { name, description: `${name} role`, model, thinkingLevel, tools: [], spawns: [], mcp: [], body: "" };
}

/** Models fixture — exactly the four documented thinking-parity shapes plus a
 *  named model and a non-reasoning model. Providers/models deliberately
 *  unsorted: ordering must be the resolver's job (J-1). */
const MODELS: CatalogueModel[] = [
	{ provider: "xai", id: "grok/v1", reasoning: false },
	{ provider: "openrouter", id: "alpha/a", reasoning: true }, // missing thinkingLevelMap
	{
		provider: "openrouter",
		id: "beta/c",
		name: "Beta C",
		reasoning: true,
		thinkingLevelMap: { off: null }, // always-thinking model; off explicitly unsupported
	},
	{
		provider: "openrouter",
		id: "deepseek/deepseek-v4-pro-0813",
		name: "DeepSeek V4 Pro (0813)",
		reasoning: true,
		thinkingLevelMap: { minimal: "minimal", high: "high" }, // holes: low/medium absent; xhigh/max absent
	},
	{
		provider: "anthropic",
		id: "claude/sonnet-4",
		name: "Sonnet 4",
		reasoning: true, // missing thinkingLevelMap
	},
];

/** Stub of pi's getProviderDisplayName output. "ghost" is present in the map
 *  but absent from MODELS — it must produce NO ProviderGroup. "xai" is absent
 *  from the map — displayName must fall back to the provider id. */
const DISPLAY: Record<string, string> = { openrouter: "OpenRouter", anthropic: "Anthropic", ghost: "Ghost Co" };

const RAW_SEATS: Seat[] = [makeSeat("principal", "openrouter/x/yz"), makeSeat("owner", "openrouter/a/fm", "medium")];

const EMPTY_OVERRIDE: Record<string, never> = {};

describe("resolveCatalogue", () => {
	test("groups models by provider; displayName passes through or falls back to provider id", () => {
		const res = resolveCatalogue(MODELS, DISPLAY, RAW_SEATS, EMPTY_OVERRIDE);
		expect(res.providers.map((p) => p.provider)).toEqual(["anthropic", "openrouter", "xai"]);
		const byName = new Map(res.providers.map((p) => [p.provider, p]));
		expect(byName.get("anthropic")!.displayName).toBe("Anthropic"); // stub value verbatim (O-7)
		expect(byName.get("openrouter")!.displayName).toBe("OpenRouter");

		expect(byName.get("openrouter")!.models.map((m) => m.id)).toEqual([
			"alpha/a",
			"beta/c",
			"deepseek/deepseek-v4-pro-0813",
		]);

		const xai = byName.get("xai")!;
		expect(xai.displayName).toBe("xai"); // absent from DISPLAY → provider id fallback
		expect(xai.models.map((m) => m.id)).toEqual(["grok/v1"]);

		// Provider id in DISPLAY but absent from MODELS → no group at all.
		expect(byName.has("ghost")).toBe(false);
		expect(res.providers.length).toBe(3);
	});

	test("empty catalogue produces providers: [] without throwing", () => {
		const res = resolveCatalogue([], DISPLAY, RAW_SEATS, EMPTY_OVERRIDE);
		expect(res.providers).toEqual([]);
		// Seat state still resolves — the catalogue and seats arrays are independent.
		expect(res.seats).toHaveLength(RAW_SEATS.length);
	});

	test("orders providers by provider id and models by id ascending (J-1); twice-run is deep-equal", () => {
		const run = () => resolveCatalogue(MODELS, DISPLAY, RAW_SEATS, EMPTY_OVERRIDE);
		const first = run();
		expect(first.providers.map((p) => p.provider)).toEqual(["anthropic", "openrouter", "xai"]);
		for (const group of first.providers) {
			const ids = group.models.map((m) => m.id);
			expect(ids).toEqual([...ids].sort());
		}
		// Determinism: the same inputs always produce the identical structure.
		expect(run()).toEqual(first);
	});

	test("extracts supportedThinkingLevels with parity to pi's getSupportedThinkingLevels contract", () => {
		const res = resolveCatalogue(MODELS, DISPLAY, RAW_SEATS, EMPTY_OVERRIDE);
		const model = (provider: string, id: string) =>
			res.providers.find((p) => p.provider === provider)!.models.find((m) => m.id === id)!;

		// reasoning: false → exactly ["off"], never [].
		expect(model("xai", "grok/v1").supportedThinkingLevels).toEqual(["off"]);

		// reasoning: true, missing thinkingLevelMap → off..high supported, xhigh/max NOT.
		expect(model("openrouter", "alpha/a").supportedThinkingLevels).toEqual(["off", "minimal", "low", "medium", "high"]);
		expect(model("anthropic", "claude/sonnet-4").supportedThinkingLevels).toEqual(["off", "minimal", "low", "medium", "high"]);

		// deepseek-v4-pro-style holes: off..high present (absent keys = provider default),
		// xhigh/max excluded (their keys are required). A naive "keys with non-null
		// values" implementation would return ["minimal","high"] here and fail this.
		const ds = model("openrouter", "deepseek/deepseek-v4-pro-0813");
		expect(ds.supportedThinkingLevels).toEqual(["off", "minimal", "low", "medium", "high"]);
		expect(ds.name).toBe("DeepSeek V4 Pro (0813)");

		// always-thinking model with off: null → off excluded, rest of off..high kept.
		expect(model("openrouter", "beta/c").supportedThinkingLevels).toEqual(["minimal", "low", "medium", "high"]);
	});

	test("qualifiedId round-trips the modelled getAvailable() set (${provider}/${id})", () => {
		const res = resolveCatalogue(MODELS, DISPLAY, RAW_SEATS, EMPTY_OVERRIDE);
		const source = new Set(MODELS.map((m) => `${m.provider}/${m.id}`));
		const emitted = res.providers.flatMap((p) => p.models.map((m) => m.qualifiedId));
		// Every emitted id is in the source set, and the source set is fully
		// emitted (grouping emits nothing outside `models`).
		expect([...emitted].sort()).toEqual([...source].sort());
		expect(source.has(emitted[0])).toBe(true);
	});

	test("resolves per-seat current state: no override, explicit override, {} override, independent dims", () => {
		// No override entry → frontmatter owns everything.
		const plain = resolveCatalogue(MODELS, DISPLAY, RAW_SEATS, EMPTY_OVERRIDE);
		const owner = plain.seats.find((s) => s.name === "owner")!;
		expect(owner.hasOverride).toBe(false);
		expect(owner.currentModel).toBe("openrouter/a/fm");
		expect(owner.currentThinking).toBe("medium");
		const principal = plain.seats.find((s) => s.name === "principal")!;
		expect(principal.hasOverride).toBe(false);
		expect(principal.currentModel).toBe("openrouter/x/yz");
		expect(principal.currentThinking).toBeUndefined(); // field omitted when no level resolves

		// Override with model :high suffix AND explicit thinking → explicit thinking wins.
		const over = resolveCatalogue(MODELS, DISPLAY, RAW_SEATS, { owner: { model: "openrouter/b/m:high", thinking: "low" } });
		const ownerOver = over.seats.find((s) => s.name === "owner")!;
		expect(ownerOver.hasOverride).toBe(true);
		expect(ownerOver.currentModel).toBe("openrouter/b/m");
		expect(ownerOver.currentThinking).toBe("low");

		// {} entry counts as an override, leaves current state at frontmatter.
		const emptyOv = resolveCatalogue(MODELS, DISPLAY, RAW_SEATS, { owner: {} });
		const ownerEmpty = emptyOv.seats.find((s) => s.name === "owner")!;
		expect(ownerEmpty.hasOverride).toBe(true);
		expect(ownerEmpty.currentModel).toBe("openrouter/a/fm");
		expect(ownerEmpty.currentThinking).toBe("medium");

		// Model-only override keeps frontmatter thinking; thinking-only keeps frontmatter model.
		const modelOnly = resolveCatalogue(MODELS, DISPLAY, RAW_SEATS, { owner: { model: "openrouter/b/m" } });
		expect(modelOnly.seats.find((s) => s.name === "owner")!.currentModel).toBe("openrouter/b/m");
		expect(modelOnly.seats.find((s) => s.name === "owner")!.currentThinking).toBe("medium");

		const thinkingOnly = resolveCatalogue(MODELS, DISPLAY, RAW_SEATS, { owner: { thinking: "high" } });
		expect(thinkingOnly.seats.find((s) => s.name === "owner")!.currentModel).toBe("openrouter/a/fm");
		expect(thinkingOnly.seats.find((s) => s.name === "owner")!.currentThinking).toBe("high");
	});

	test("preserves rawSeats order exactly as passed", () => {
		const res = resolveCatalogue(MODELS, DISPLAY, RAW_SEATS, EMPTY_OVERRIDE);
		expect(res.seats.map((s) => s.name)).toEqual(["principal", "owner"]);
	});
});