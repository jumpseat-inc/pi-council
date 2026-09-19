// EV-60 — cost-per-card and cost-per-epic baseline over existing run
// manifests. Pure aggregation only: the module consumes the exported
// accessors of `./runs.ts` (`sumSubtree`) and never touches the run
// directory — the read posture the card pins and the test asserts. No
// model call, no interactive surface: this is measurement groundwork for
// EPIC-13 (a number before any routing policy).
//
// Grouping convention (manifests carry no card/epic fields, so the
// hand-built fixture forest encodes identity structurally):
//   - depth 0 (forest roots, parentJobId === null) are EPIC roots —
//     id = epicId;
//   - depth 1 are CARD roots — id = cardId;
//   - anything deeper is a seat dispatch.
// "Runs behind" a figure = the number of manifests in that subtree
// (inclusive) that carry a settled `usage` tuple — each settled dispatch
// is one run behind the number.
//
// Money literal: `cost=$X.XXXX` (the summed scalar `cost` field,
// basis-agnostic — an aggregate of possibly mixed-basis rows claims no
// catalogue/reported qualifier), matching the fragment shape in
// extensions/usage-format.ts.
import { sumSubtree, type RunManifest } from "./runs.ts";

export interface CardCostEntry {
	cardId: string;
	cost: number;
	/** Settled dispatches (manifests with a `usage`) behind this figure. */
	runs: number;
}

export interface EpicCostEntry {
	epicId: string;
	cost: number;
	runs: number;
	cards: CardCostEntry[];
}

export interface CostBaselineReport {
	epics: EpicCostEntry[];
}

const byId = (a: { id: string }, b: { id: string }): number =>
	a.id.localeCompare(b.id, undefined, { numeric: true });

/** Cost per card: every card root's `sumSubtree(manifests, cardRootId, "cost")`.
 * A card with no settled spend anywhere in its subtree appears as `0`, never
 * omitted. Cards are the depth-1 nodes of the forest. */
export function costByCard(manifests: RunManifest[]): Map<string, number> {
	const out = new Map<string, number>();
	for (const epic of epicRoots(manifests)) {
		for (const card of epic.cards) {
			out.set(card.cardId, card.cost);
		}
	}
	return out;
}

/** Cost per epic: `sumSubtree(manifests, epicId, "cost")` over the epic root
 * (its own usage plus every card and dispatch beneath it — spend above the
 * card level is the epic's spend). An unknown epic id is `0`, matching
 * `sumSubtree`'s missing-node behavior, never a throw. */
export function costByEpic(manifests: RunManifest[], epicId: string): number {
	const root = manifests.find((m) => m.parentJobId === null && m.id === epicId);
	if (!root) return 0;
	return sumSubtree(manifests, epicId, "cost");
}

/** The full baseline report: every epic in scope with its child cards, each
 * figure carrying its summed cost and the number of runs behind it. Pure. */
export function buildCostBaseline(manifests: RunManifest[]): CostBaselineReport {
	const roots = manifests.filter((m) => m.parentJobId === null).sort(byId);
	const epics: EpicCostEntry[] = roots.map((root) => {
		const cards = manifests
			.filter((m) => m.parentJobId === root.id)
			.sort(byId)
			.map((m): CardCostEntry => ({
				cardId: m.id,
				cost: sumSubtree(manifests, m.id, "cost"),
				runs: settledRuns(manifests, m.id),
			}));
		return {
			epicId: root.id,
			cost: sumSubtree(manifests, root.id, "cost"),
			runs: settledRuns(manifests, root.id),
			cards,
		};
	});
	return { epics };
}

/** Plain-text lines: one per epic, one per child card, each carrying its
 * summed cost and the number of runs behind it. Pure; no model call. */
export function formatCostBaseline(report: CostBaselineReport): string[] {
	const lines: string[] = [];
	for (const epic of report.epics) {
		lines.push(`epic ${epic.epicId} cost=$${epic.cost.toFixed(4)} runs=${epic.runs}`);
		for (const card of epic.cards) {
			lines.push(`  card ${card.cardId} cost=$${card.cost.toFixed(4)} runs=${card.runs}`);
		}
	}
	return lines;
}

function epicRoots(manifests: RunManifest[]): EpicCostEntry[] {
	return buildCostBaseline(manifests).epics;
}

/** Manifests in the subtree rooted at `id` (inclusive) that carry a settled
 * usage tuple — the dispatch count behind a summed figure. */
function settledRuns(manifests: RunManifest[], id: string): number {
	let count = 0;
	const walk = (nodeId: string): void => {
		const node = manifests.find((m) => m.id === nodeId);
		if (node) {
			if (node.usage !== undefined) count++;
			for (const c of manifests.filter((m) => m.parentJobId === nodeId)) walk(c.id);
		}
	};
	walk(id);
	return count;
}
