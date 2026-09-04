import type { ExtensionContext } from "@earendil-works/pi-coding-agent";
import type { CatalogueModel, ResolverResult, SeatState } from "./catalogue.ts";
import { resolveCatalogue } from "./catalogue.ts";
import { writeSeatOverride, type WriteSeatOverrideResult } from "./council-config-writer.ts";
import { ModelPicker, type SeatModelSelection } from "./model-picker.ts";
import { withModalFrame, type NavTheme } from "./navigator.ts";
import { COUNCIL_CONFIG_FILE, listSeatNames, loadCouncilConfig, loadSeat, type Seat } from "./seats.ts";

// ---- R-2 ruled copy — byte-exact, binding ----

export const USAGE_LINE = "[council-models] usage: /council-models [<seat> [<provider>/<model>[:thinking]]]";
export const LISTING_HEADER = "Current per-seat models:";

/** R-2 block: usage line, blank, header, then one line per seat — an override
 *  seat renders `<seat>: <model>[:thinking] (override)` (key presence), else
 *  `<seat>: frontmatter default`. `only` scopes to one seat (R-1 <seat> form):
 *  that seat's current line plus the usage line. Pure. */
export function modelsListingLines(seats: SeatState[], only?: string): string[] {
	const lines = [USAGE_LINE, "", LISTING_HEADER];
	const scope = only !== undefined ? seats.filter((s) => s.name === only) : seats;
	for (const s of scope) {
		if (s.hasOverride) {
			const suffix = s.currentThinking !== undefined ? `:${s.currentThinking}` : "";
			lines.push(`${s.name}: ${s.currentModel}${suffix} (override)`);
		} else {
			lines.push(`${s.name}: frontmatter default`);
		}
	}
	return lines;
}

/** R-3 notify copy — byte-exact in either surface after a SUCCESSFUL write.
 *  The `[:thinking]` suffix is present only when the effective (post-write)
 *  seat carries a thinking level. Pure. */
export function modelsNotifyLine(seatName: string, effective: Pick<Seat, "model" | "thinkingLevel">): string {
	const suffix = effective.thinkingLevel !== undefined ? `:${effective.thinkingLevel}` : "";
	return `council-models: wrote ${seatName} → ${effective.model}${suffix} in ${COUNCIL_CONFIG_FILE} — takes effect at the next dispatch.`;
}

export interface WriteOutcome {
	notified: string | null; // R-3 line when the write succeeded (post-write read-back)
	error: string | null; // writer error copy when validation failed (nothing written)
}

/**
 * The modal-to-writer wiring (EV-23 §10): given the picker's selection — or
 * null when the user closed the modal — writes through writeSeatOverride and
 * derives the notify copy from a POST-WRITE read of the file
 * (`loadSeat` = the loader's own resolution), never from the selection tuple.
 * The `catalogue` arg is the SAME snapshot array that built the modal's
 * listing; the writer validates the pick against it. `write` is injectable so
 * the wiring test can count calls and pin the array reference.
 */
export function applySeatSelection(
	repoRoot: string,
	models: CatalogueModel[],
	sel: SeatModelSelection | null,
	write: typeof writeSeatOverride = writeSeatOverride,
): WriteOutcome {
	if (sel === null) return { notified: null, error: null };
	const res = write({ repoRoot, seat: sel.seat, model: sel.model, thinking: sel.thinking, catalogue: models });
	if (!res.ok) return { notified: null, error: res.error };
	const effective = loadSeat(repoRoot, sel.seat);
	return { notified: modelsNotifyLine(sel.seat, effective), error: null };
}

/** Unique provider ids → pi's display names (render copy; never a write key). */
export function buildProviderDisplayNames(
	registry: { getProviderDisplayName(provider: string): string },
	models: CatalogueModel[],
): Record<string, string> {
	const out: Record<string, string> = {};
	for (const m of models) {
		if (!(m.provider in out)) out[m.provider] = registry.getProviderDisplayName(m.provider);
	}
	return out;
}

/**
 * The headless grammar (R-1), driven by the handler for print/json/rpc
 * sessions. `models`/`displayNames` are the handler's single snapshot — this
 * never refreshes, never re-reads the registry. Unknown seat, invalid or
 * unqualified model, or extra args emit `[council-models] error: ...` and
 * write NOTHING (the error path is caught here, mirroring the handler's own
 * catch).
 */
export function runHeadless(
	args: string,
	repoRoot: string,
	models: CatalogueModel[],
	displayNames: Record<string, string>,
	emit: (line: string) => void,
): void {
	const tokens = args.trim() ? args.trim().split(/\s+/) : [];
	try {
		const rawSeats = listSeatNames(repoRoot).map((n) => loadSeat(repoRoot, n));
		const resolved = resolveCatalogue(models, displayNames, rawSeats, loadCouncilConfig(repoRoot));

		if (tokens.length === 0) {
			emit(modelsListingLines(resolved.seats).join("\n"));
			return;
		}
		const seatName = tokens[0]!;
		loadSeat(repoRoot, seatName); // throws "Unknown seat" — validation before any write
		if (tokens.length === 1) {
			emit(modelsListingLines(resolved.seats, seatName).join("\n"));
			return;
		}
		if (tokens.length > 2) {
			throw new Error(`unexpected arguments after <provider>/<model>: ${JSON.stringify(tokens.slice(2).join(" "))}`);
		}
		const out = applySeatSelection(repoRoot, models, { seat: seatName, model: tokens[1]! });
		if (out.notified !== null) emit(out.notified);
		else if (out.error !== null) throw new Error(out.error);
		else throw new Error("applySeatSelection returned neither notified nor error");
	} catch (e) {
		emit(`[council-models] error: ${e instanceof Error ? e.message : String(e)}`);
	}
}

/**
 * The TUI surface: EV-23's ModelPicker opened as a full-screen overlay via
 * ctx.ui.custom — the openTranscript pattern. The modal is pure (zero I/O);
 * the write happens after this promise resolves with the selection (or null
 * on close). The custom factory's `invalidate` forwards to
 * `picker.invalidate()` — the theme-repaint seam (EV-23 §10/3).
 */
export function openModelPicker(
	ctx: Pick<ExtensionContext, "ui">,
	resolved: ResolverResult,
): Promise<SeatModelSelection | null> {
	return ctx.ui.custom<SeatModelSelection | null>(
		(tui: any, theme: NavTheme, _kb: unknown, done: (sel: SeatModelSelection | null) => void) => {
			const termRows = Math.max(10, tui?.terminal?.rows ?? 24);
			const picker = new ModelPicker(
				resolved,
				theme,
				(sel) => done(sel), // confirm → single emission
				() => done(null), // esc at seat level → cancel
				{ maxRows: termRows - 2 },
			);
			return {
				render: (w: number) =>
					withModalFrame(theme, w, termRows, picker.render(Math.min(96, Math.max(1, w - 8))), {
						maxPanelHeight: termRows - 2,
					}),
				invalidate: () => picker.invalidate(),
				handleInput: (d: string) => {
					picker.handleInput(d);
					tui?.requestRender?.();
				},
			};
		},
		{ overlay: true, overlayOptions: { width: "100%", maxHeight: "100%", margin: 0, anchor: "top-left" } },
	);
}