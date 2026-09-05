import type { Theme } from "@earendil-works/pi-coding-agent";
import { Key, decodeKittyPrintable, matchesKey, truncateToWidth, visibleWidth, type Component } from "@earendil-works/pi-tui";
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

/** EV-27 R-1 ruled hint — byte-exact, immutable. */
export const SEARCH_HINT = "/ filter · esc clears";
/** EV-27 R-1 byte-exact empty-input row: `▌` (U+258C, one column at 0) + hint. */
export const SEARCH_ROW_EMPTY = `\u258C ${SEARCH_HINT}`;

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
export interface PickRow {
	model: ModelEntry;
	level?: string;
}

/** J-2: `[]` → one level-less row; 1 level → one `:level` row; N ≥ 2 →
 *  exactly N `:level` rows in supportedThinkingLevels array order — no
 *  level-less row. Display model id is the entry's qualifiedId verbatim. */
export function rowsForProvider(group: ProviderGroup): PickRow[] {
	const rows: PickRow[] = [];
	for (const model of group.models) {
		if (model.supportedThinkingLevels.length === 0) rows.push({ model });
		else for (const level of model.supportedThinkingLevels) rows.push({ model, level });
	}
	return rows;
}

/** EV-26: pure model-name filter over the J-2 cross-product rows; EV-27's
 *  search input renders from this. Contract (card EV-26 Intent, pinned):
 *  match field is qualifiedId only — display name is never rendered and
 *  never matched; case-insensitive substring; the filter runs on the rows
 *  BEFORE the `:level` suffix is applied at render time, so a query
 *  containing ":" never matches a suffix; surviving rows are the identical
 *  PickRow references so resolveSelection() keeps emitting byte-verbatim
 *  keys; empty query ("" matches every string) → all rows; no match → []
 *  (the modal owns the no-match copy — EV-27). Pure: no I/O, no rendering,
 *  no side effects. */
export function filterModelRows(rows: PickRow[], query: string): PickRow[] {
	const q = query.toLowerCase();
	return rows.filter((row) => row.model.qualifiedId.toLowerCase().includes(q));
}

function clamp(v: number, lo: number, hi: number): number {
	if (hi < lo) return lo;
	return Math.max(lo, Math.min(hi, v));
}

/** EV-27 shared printable decode: kitty CSI-u arm plus the legacy bare-byte
 *  fallback. Callers MUST guard backspace BEFORE decoding — kitty DEL
 *  (`\x1b[127u`) decodes to "\x7f" — and the 126 upper bound is the
 *  belt-and-suspenders exclusion of the same byte. */
function decodePrintable(data: string): string | undefined {
	return decodeKittyPrintable(data) ?? (data.length === 1 && data.charCodeAt(0) >= 32 && data.charCodeAt(0) <= 126 ? data : undefined);
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
	private searchActive = false;
	private query = "";
	private inputFocused = false;
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
	 *  mutation. `signature = level:cursors:top:search:focus:query` — the
	 *  query renders on the search row itself, so a query-blind signature
	 *  would serve a stale frame; query last keeps it unique by construction
	 *  even with `/` and `:` in the query (compared by full equality, never
	 *  parsed). */
	private signature(): string {
		return `${this.level}:${this.seatIndex}:${this.providerIndex}:${this.modelIndex}:${this.windowStart()}:${this.searchActive ? 1 : 0}:${this.inputFocused ? 1 : 0}:${this.query}`;
	}

	/** The current level's linear cursor. */
	private currentIndex(): number {
		if (this.level === 0) return this.seatIndex;
		if (this.level === 1) return this.providerIndex;
		return this.modelIndex;
	}

	/** The current level's row list: seats / providers / model cross-product.
	 *  EV-27: at level 2 this is the SINGLE row source — search mode filters
	 *  here so windowing, the Up/Down clamps, pushRows, the Enter guard and
	 *  the Enter-pick all read one list and resolveSelection() stays
	 *  byte-verbatim by PickRow reference identity. */
	private currentRows(): Array<SeatState | ProviderGroup | PickRow> {
		if (this.level === 0) return this.catalogue.seats;
		if (this.level === 1) return this.catalogue.providers;
		const group = this.catalogue.providers[this.providerIndex];
		return group ? (this.searchActive ? filterModelRows(rowsForProvider(group), this.query) : rowsForProvider(group)) : [];
	}

	/** §2 windowed scrolling: start = max(0, min(sel - floor((maxRows-1)/2), len - maxRows)). */
	private windowStart(): number {
		const len = this.currentRows().length;
		if (len <= this.maxRows) return 0;
		const selected = this.currentIndex();
		return Math.max(0, Math.min(selected - Math.floor((this.maxRows - 1) / 2), len - this.maxRows));
	}

	/** EV-27 search row: `▌ ` (U+258C at column 0) + the R-1 empty hint or the
	 *  live query. Truncation is from the right and never clips the `▌`; the
	 *  row is byte-identical in both focus states (R-1 unconditional on focus). */
	private searchRow(width: number): string {
		const cell = "\u258C ";
		const text = this.query === "" ? SEARCH_HINT : this.query;
		if (visibleWidth(cell + text) <= width) return cell + text;
		return cell + truncateToWidth(text, Math.max(1, width - visibleWidth(cell)), "");
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
			} else if (this.searchActive) {
				// EV-27 search frame: search row between header and rows; the
				// footer is FOOTER_MODEL in every search frame (active keys).
				lines.push(this.searchRow(width));
				this.pushRows(width, lines, this.currentRows(), false);
				lines.push(this.theme.fg("dim", FOOTER_MODEL));
			} else {
				this.pushRows(width, lines, this.currentRows());
			}
		} else {
			this.pushRows(width, lines, this.currentRows());
		}

		this.cached = { w: width, signature: sig, lines };
		return lines;
	}

	private pushRows(width: number, lines: string[], rows: Array<SeatState | ProviderGroup | PickRow>, footer = true): void {
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
		if (footer) lines.push(this.theme.fg("dim", footerFor(this.level)));
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

		// EV-27 fall-through trigger: a decoded `/` at the model level with no
		// search open opens it — gated on a non-empty model list so `/` never
		// injects active keys into the keyless R-4#2 state.
		if (this.level === 2 && !this.searchActive && decodePrintable(data) === "/") {
			const group = this.catalogue.providers[this.providerIndex];
			if (group && group.models.length > 0) {
				this.searchActive = true;
				this.inputFocused = true;
				this.cached = undefined;
				return;
			}
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