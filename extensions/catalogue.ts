import type { Seat, AgentOverride } from "./seats.ts";
import { applySeatOverride } from "./seats.ts";
import { getSupportedThinkingLevels } from "@earendil-works/pi-ai/compat";

/* The plain-data view of one registry Model that the resolver reads. The
   output of ctx.modelRegistry.getAvailable() is structurally assignable to
   this. `reasoning` is passthrough; supportedThinkingLevels — derived below,
   ONLY via pi's getSupportedThinkingLevels — is the sole capability
   authority, never a hand-rolled level set and never a "keys of the map"
   fallback. */
export interface CatalogueModel {
	provider: string;
	id: string;
	name?: string; // display label; falls back to id
	reasoning: boolean;
	thinkingLevelMap?: Record<string, string | null>;
}

export interface ModelEntry {
	qualifiedId: string; // `${provider}/${id}` — the selection/write key (dispatch validates this exact form)
	id: string;
	name: string; // model.name ?? model.id
	reasoning: boolean; // passthrough; NOT consumer-contract
	supportedThinkingLevels: string[];
}

export interface ProviderGroup {
	provider: string;
	displayName: string; // passthrough of providerDisplayName[provider] ?? provider — never derived here
	models: ModelEntry[];
}

export interface SeatState {
	name: string;
	hasOverride: boolean;
	currentModel: string; // always the qualified provider/id
	currentThinking?: string; // present only when a level resolves
}

export interface ResolverResult {
	providers: ProviderGroup[];
	seats: SeatState[];
}

/** J-1 ordering: ids only, never display labels. Both keys are unique per
 *  namespace, so these comparators are total. */
function byId<M extends { id: string }>(a: M, b: M): number {
	return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

function byProviderId<G extends { provider: string }>(a: G, b: G): number {
	return a.provider < b.provider ? -1 : a.provider > b.provider ? 1 : 0;
}

function toModelEntry(model: CatalogueModel): ModelEntry {
	return {
		qualifiedId: `${model.provider}/${model.id}`,
		id: model.id,
		name: model.name ?? model.id,
		reasoning: model.reasoning,
		// `getAvailable()` output and plain test literals are structurally
		// compatible with pi's Model; the cast is required because pi's Model
		// carries many fields this view does not. getSupportedThinkingLevels
		// reads only .reasoning and .thinkingLevelMap.
		supportedThinkingLevels: getSupportedThinkingLevels(
			model as Parameters<typeof getSupportedThinkingLevels>[0],
		),
	};
}

/**
 * Turn pi's flat model registry into a provider-grouped, ordered catalogue of
 * pickable model entries plus each seat's current override state. EV-22 owns
 * this transform only: the registry refresh + snapshot read (`await
 * refresh()` then `getAvailable()`) happens once in the EV-25 handler and the
 * SAME flat array is handed to this resolver and EV-24's writer-validation,
 * so listing from the result guarantees dispatch accepts the picked model
 * (dispatch validates against the same getAvailable() set).
 *
 * Pure over plain data: four flat arguments, no filesystem, no network, no
 * throwing on an empty catalogue (empty models → `providers: []`).
 */
export function resolveCatalogue(
	models: CatalogueModel[],
	providerDisplayName: Record<string, string>,
	rawSeats: Seat[],
	overrideMap: Record<string, AgentOverride>,
): ResolverResult {
	// 1. Group by provider.
	const byProvider = new Map<string, CatalogueModel[]>();
	for (const model of models) {
		const bucket = byProvider.get(model.provider);
		if (bucket) bucket.push(model);
		else byProvider.set(model.provider, [model]);
	}

	// 2-3. Model entries, then J-1 order: models by id asc, providers by provider id asc.
	const providers = [...byProvider.entries()]
		.map(([provider, groupModels]) => ({
			provider,
			displayName: providerDisplayName[provider] ?? provider,
			models: [...groupModels].sort(byId).map(toModelEntry),
		}))
		.sort(byProviderId);

	// 4. Seats: rawSeats order preserved. hasOverride is KEY PRESENCE — an
	//    `{}` entry counts; applySeatOverride yields the effective values.
	const seats = rawSeats.map((seat) => {
		const effective = applySeatOverride(seat, overrideMap);
		const state: SeatState = {
			name: seat.name,
			hasOverride: Object.hasOwn(overrideMap, seat.name),
			currentModel: effective.model,
		};
		if (effective.thinkingLevel !== undefined) state.currentThinking = effective.thinkingLevel;
		return state;
	});

	return { providers, seats };
}