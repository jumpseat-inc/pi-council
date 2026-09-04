import type { Theme } from "@earendil-works/pi-coding-agent";
import { Key, matchesKey, truncateToWidth, visibleWidth, type Component } from "@earendil-works/pi-tui";
import type { ModelEntry, ProviderGroup, ResolverResult, SeatState } from "./catalogue.ts";
import { COUNCIL_CONFIG_FILE } from "./seats.ts";

/** Theme subset the picker draws with — the same structural shape as
 *  navigator's NavTheme. Token-only per AGENTS.md 9.6: accent/dim/bold via
 *  theme.fg/theme.bold, nothing else, no literals. */
type NavTheme = Pick<Theme, "fg" | "bold" | "bg">;

/**
 * The selection a completed picker run emits (spec §1). `model` is the
 * catalogue's `qualifiedId` byte-verbatim — never recomposed from provider +
 * id. `thinking` is present iff the picked cross-product row carried a
 * `:level` suffix. This is the single `done` payload EV-25 flows through
 * `ctx.ui.custom<SeatModelSelection | null>` and feeds to
 * `writeSeatOverride({ repoRoot, catalogue, ...sel })`.
 */
export interface SeatModelSelection {
	seat: string;
	model: string;
	thinking?: string;
}

// ---- R-1..R-4 ruled copy — byte-exact, binding (spec §4) ----
export const HEADER = "council models — pick a model per seat";
export const FOOTER_SEAT_PROVIDER = "↑/↓ move · enter open · esc back";
export const FOOTER_MODEL = "↑/↓ move · enter select · esc back";
export const FOOTER_CONFIRM = "enter confirm · esc back";
export const EMPTY_NO_PROVIDERS =
	"No providers configured — authenticate a provider in pi, then reopen /council-models.";
/** R-4#2 — displayName is ProviderGroup.displayName (render copy, never a write key). */
export const EMPTY_NO_MODELS = (displayName: string): string => `No models available for ${displayName}.`;

/** R-3 seat-row marker (dim suffix). Pure text; dim styling happens at the
 *  call site. Keyed off SeatState.hasOverride — key presence, so a
 *  `{}`-override entry renders `— using <frontmatter-effective-model> (override)`. */
export function seatMarker(state: SeatState): string {
	if (!state.hasOverride) return "— frontmatter default";
	const model = state.currentModel;
	const thinking = state.currentThinking !== undefined ? `:${state.currentThinking}` : "";
	return `— using ${model}${thinking} (override)`;
}

/** R-2 footers — seat & provider levels share one string; the four-footer
 *  exhaustiveness rule means no fifth string ever renders, regardless of
 *  level counts. */
export function footerFor(level: number): string {
	if (level === 2) return FOOTER_MODEL;
	if (level === 3) return FOOTER_CONFIRM;
	return FOOTER_SEAT_PROVIDER;
}

/** §6 two-case confirm echo, derived from the emitted tuple so echo ==
 *  selection by construction. The "thinking unchanged" form asserts only that
 *  no thinking was written — never what a preserved level is (seam, §9). */
export function echoFor(sel: SeatModelSelection): string {
	if (sel.thinking === undefined) return `Set ${sel.seat} to ${sel.model} — thinking unchanged`;
	return `Set ${sel.seat} to ${sel.model}:${sel.thinking}`;
}

/** One cursor row of the J-2 flat cross-product (spec §3). `level ===
 *  undefined` exactly for a `[]` model — its single level-less row, the only
 *  row that earns the "— thinking unchanged" echo. */
interface PickRow {
	model: ModelEntry;
	level?: string;
}

/** J-2: `[]` → one level-less row; 1 level → one `:level` row; N ≥ 2 →
 *  exactly N `:level` rows in supportedThinkingLevels array order — no
 *  level-less row. Display model id is the entry's qualifiedId verbatim. */
function rowsForProvider(group: ProviderGroup): PickRow[] {
	const rows: PickRow[] = [];
	for (const model of group.models) {
		if (model.supportedThinkingLevels.length === 0) rows.push({ model });
		else for (const level of model.supportedThinkingLevels) rows.push({ model, level });
	}
	return rows;
}

function clamp(v: number, lo: number, hi: number): number {
	if (hi < lo) return lo;
	return Math.max(lo, Math.min(hi, v));
}

/**
 * The token-only modal picker (EV-23). Pure content component: no repoRoot,
 * no filesystem, no writer — "confirm commits" means onConfirm(sel) fires
 * exactly once. The EV-25 opener wraps render(width) with withModalFrame and
 * drives handleInput through ctx.ui.custom.
 */
export class ModelPicker implements Component {
	private seatIndex = 0;
	private providerIndex = 0;
	private modelIndex = 0;
	private level: 0 | 1 | 2 | 3 = 0; // seat → provider → model → confirm
	private picked: PickRow | null = null;
	private settled = false;
	private maxRows: number;
	private cached?: { w: number; signature: string; lines: string[] };

	constructor(
		private catalogue: ResolverResult,
		private theme: NavTheme,
		private onConfirm: (sel: SeatModelSelection) => void,
		private onClose: () => void,
		opts: { maxRows?: number } = {},
	) {
		this.maxRows = opts.maxRows ?? Number.MAX_SAFE_INTEGER;
	}

	/** §7 render cache — a (width, signature) pair; invalidated on every
	 *  mutation. `signature = level:cursors:top`. */
	private signature(): string {
		return `${this.level}:${this.seatIndex}:${this.providerIndex}:${this.modelIndex}:${this.windowStart()}`;
	}

	/** The current level's linear cursor. */
	private currentIndex(): number {
		if (this.level === 0) return this.seatIndex;
		if (this.level === 1) return this.providerIndex;
		return this.modelIndex;
	}

	/** The current level's row list: seats / providers / model cross-product. */
	private currentRows(): Array<SeatState | ProviderGroup | PickRow> {
		if (this.level === 0) return this.catalogue.seats;
		if (this.level === 1) return this.catalogue.providers;
		const group = this.catalogue.providers[this.providerIndex];
		return group ? rowsForProvider(group) : [];
	}

	/** §2 windowed scrolling: start = max(0, min(sel - floor((maxRows-1)/2), len - maxRows)). */
	private windowStart(): number {
		const len = this.currentRows().length;
		if (len <= this.maxRows) return 0;
		const selected = this.currentIndex();
		return Math.max(0, Math.min(selected - Math.floor((this.maxRows - 1) / 2), len - this.maxRows));
	}

	/** Model rows: truncation must never clip the `:level` decision (§8.13) —
	 *  when the full row overflows, only the id part shrinks, the suffix is
	 *  preserved byte-verbatim. */
	private modelRow(marker: string, pick: PickRow, width: number): string {
		const id = pick.model.qualifiedId;
		const suffix = pick.level === undefined ? "" : `:${pick.level}`;
		const full = marker + id + suffix;
		if (visibleWidth(full) <= width) return full;
		const room = Math.max(1, width - visibleWidth(suffix));
		return truncateToWidth(marker + id, room, "") + suffix;
	}

	render(width: number): string[] {
		const sig = this.signature();
		if (this.cached?.w === width && this.cached.signature === sig) return this.cached.lines;

		const lines: string[] = [this.theme.bold(HEADER)];
		if (this.level === 3) {
			// §6 confirm screen: accent echo + dim write line (body, not footer) + footer.
			const sel = this.resolveSelection();
			lines.push(this.theme.fg("accent", echoFor(sel)));
			lines.push(this.theme.fg("dim", `Writes ${COUNCIL_CONFIG_FILE} — takes effect at the next dispatch.`));
			lines.push(this.theme.fg("dim", FOOTER_CONFIRM));
		} else if (this.level === 1 && this.catalogue.providers.length === 0) {
			// R-4#1 — body (dim), no footer: no active keys.
			lines.push(this.theme.fg("dim", EMPTY_NO_PROVIDERS));
		} else if (this.level === 2) {
			const group = this.catalogue.providers[this.providerIndex];
			if (group && group.models.length === 0) {
				// R-4#2 — render-contract-only input; the resolver never produces
				// a ProviderGroup with models: [] (spec §4). No footer.
				lines.push(this.theme.fg("dim", EMPTY_NO_MODELS(group.displayName)));
			} else {
				this.pushRows(width, lines, this.currentRows());
			}
		} else {
			this.pushRows(width, lines, this.currentRows());
		}

		this.cached = { w: width, signature: sig, lines };
		return lines;
	}

	private pushRows(width: number, lines: string[], rows: Array<SeatState | ProviderGroup | PickRow>): void {
		const start = this.windowStart();
		const windowed = rows.slice(start, start + Math.min(this.maxRows, rows.length));
		const selected = this.currentIndex();
		windowed.forEach((row, i) => {
			const isSel = start + i === selected;
			const marker = isSel ? "> " : "  ";
			let line: string;
			if (this.level === 0) {
				const seat = row as SeatState;
				const text = `${seat.name} ${this.theme.fg("dim", seatMarker(seat))}`;
				line = truncateToWidth(isSel ? this.theme.fg("accent", marker + text) : marker + text, width);
			} else if (this.level === 1) {
				const group = row as ProviderGroup;
				line = truncateToWidth(isSel ? this.theme.fg("accent", marker + group.displayName) : marker + group.displayName, width);
			} else {
				line = this.modelRow(marker, row as PickRow, width);
			}
			lines.push(line);
		});
		lines.push(this.theme.fg("dim", footerFor(this.level)));
	}

	handleInput(data: string): void {
		// settled (= confirm-Enter) swallows everything: no double-fire (§2).
		if (this.settled) return;

		if (this.level === 3) {
			if (matchesKey(data, Key.enter)) {
				this.settled = true;
				this.cached = undefined;
				this.onConfirm(this.resolveSelection());
				return;
			}
			if (matchesKey(data, Key.escape)) {
				this.level = 2; // back to the model level
				this.cached = undefined;
				return;
			}
			return;
		}

		if (matchesKey(data, Key.up)) {
			if (this.level === 0) this.seatIndex = clamp(this.seatIndex - 1, 0, this.catalogue.seats.length - 1);
			else if (this.level === 1) this.providerIndex = clamp(this.providerIndex - 1, 0, this.catalogue.providers.length - 1);
			else this.modelIndex = clamp(this.modelIndex - 1, 0, this.currentRows().length - 1);
			this.cached = undefined;
			return;
		}
		if (matchesKey(data, Key.down)) {
			if (this.level === 0) this.seatIndex = clamp(this.seatIndex + 1, 0, this.catalogue.seats.length - 1);
			else if (this.level === 1) this.providerIndex = clamp(this.providerIndex + 1, 0, this.catalogue.providers.length - 1);
			else this.modelIndex = clamp(this.modelIndex + 1, 0, this.currentRows().length - 1);
			this.cached = undefined;
			return;
		}
		if (matchesKey(data, Key.enter)) {
			if (this.currentRows().length === 0) return; // no row under the cursor
			// Entering a level resets that level's cursor to 0 (§2).
			if (this.level === 0) {
				this.providerIndex = 0;
				this.level = 1;
			} else if (this.level === 1) {
				this.modelIndex = 0;
				this.level = 2;
			} else {
				this.picked = this.currentRows()[this.modelIndex] as PickRow;
				this.level = 3;
			}
			this.cached = undefined;
			return;
		}
		if (matchesKey(data, Key.escape)) {
			if (this.level === 0) {
				this.onClose();
				return;
			}
			this.level = (this.level - 1) as 0 | 1 | 2; // ascend one level
			this.cached = undefined;
			return;
		}
	}

	/** §6 — the single confirm source: same construction feeds both the echo
	 *  and the emitted tuple. Only reachable at the confirm level, where
	 *  `picked` is always set (Enter at the model level). */
	resolveSelection(): SeatModelSelection {
		const pick = this.picked!;
		const sel: SeatModelSelection = {
			seat: this.catalogue.seats[this.seatIndex]!.name,
			model: pick.model.qualifiedId,
		};
		if (pick.level !== undefined) sel.thinking = pick.level;
		return sel;
	}

	/** EV-25 owns calling this on theme change (§7). */
	invalidate(): void {
		this.cached = undefined;
	}
}