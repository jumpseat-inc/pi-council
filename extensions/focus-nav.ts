import { CustomEditor, type KeybindingsManager, type ExtensionUIContext } from "@earendil-works/pi-coding-agent";
import {
	Key,
	matchesKey,
	truncateToWidth,
	visibleWidth,
	type EditorComponent,
	type EditorTheme,
	type TUI,
	type EditorOptions,
} from "@earendil-works/pi-tui";

// ---------------------------------------------------------------------------
// EV-8 (OJ-1): editor-driven focus navigation between the input editor and the
// EV-7 inline below-editor tree. `controller.surface` is the SOLE arbiter of
// "tree focus" — the editor stays the TUI's always-focused component and the
// widget is render/selection-only. Forward-unhandled (OJ-2): while
// surface==="tree" consume ONLY Up/Down/Enter/Escape and delegate every other
// key to super (or a composed-over prior editor, O4).
// ---------------------------------------------------------------------------

export type Surface = "editor" | "tree";
export type TreeKey = "up" | "down" | "enter" | "escape" | "other";

/** An editor factory: same signature as pi's EditorFactory (built from the passed tui/theme/keybindings). */
export type FocusEditorFactory = (tui: TUI, theme: EditorTheme, keybindings: KeybindingsManager) => EditorComponent;

/** Mode label (OJ-3, hard rule): vim `-- INSERT --`-style signifier. */
export const TREE_MODE_LABEL = "-- TREE --";
/** Selected-row marker (OJ-3, hard rule): U+258C, one visible column. */
export const TREE_ROW_MARKER = "\u258C";

/**
 * Multi-line entry gate (O5, settled): enter the tree only when the cursor is
 * on the LAST LOGICAL line, so a single-line draft (always last) and a
 * multi-line draft behave with one predicate. Wrapped visual lines past the
 * last logical line return false (documented, accepted trade-off).
 */
export function shouldEnterTreeOnDown(cursorLine: number, lineCount: number): boolean {
	// `===` equals `>=` for every real cursor (the logical line index never exceeds
	// lines-1), and exactly satisfies the settling test for a wrap-edge position
	// past the last logical line (false).
	return cursorLine === lineCount - 1;
}

/** Classify a key into the handled set ("up"/"down"/"enter"/"escape") or "other". */
export function classifyTreeKey(data: string): TreeKey {
	if (matchesKey(data, Key.up)) return "up";
	if (matchesKey(data, Key.down)) return "down";
	if (matchesKey(data, Key.enter)) return "enter";
	if (matchesKey(data, Key.escape)) return "escape";
	return "other";
}

/** The shared mutable focus surface: surface + sessionId-keyed selection. */
export class TreeFocusState {
	surface: Surface = "editor";
	/** Selected row keyed by sessionId, NEVER by index (O6). */
	selectedSessionId: string | null = null;
	private _open = false;
	private _rows: string[] = [];

	/** Tree open state; opening resets nothing, closing resets surface+selection. */
	setOpen(v: boolean): void {
		this._open = v;
		if (!v) this.exit();
	}
	isOpen(): boolean {
		return this._open;
	}
	/** Current sorted session-id rows (index == visual row in the widget, running-first). */
	setRows(ids: string[]): void {
		this._rows = ids;
	}
	rowCount(): number {
		return this._rows.length;
	}
	/** Resolve the selected session to its CURRENT row index (recomputed; never stale). */
	selectedIndex(): number {
		if (this.selectedSessionId === null) return -1;
		const i = this._rows.indexOf(this.selectedSessionId);
		return i < 0 ? -1 : i;
	}
	/** Try to enter the tree. Returns true once surface==="tree". */
	enter(): boolean {
		if (this.surface === "tree") return true;
		if (!this._open || this._rows.length === 0) return false;
		if (this.selectedSessionId === null || !this._rows.includes(this.selectedSessionId)) {
			this.selectedSessionId = this._rows[0]!;
		}
		this.surface = "tree";
		return true;
	}
	/** Move selection up(-1)/down(+1), clamped at the ends, no wrap. */
	move(dir: -1 | 1): void {
		const i = this.selectedIndex();
		const next = dir === 1 ? Math.min(this._rows.length - 1, i + 1) : Math.max(0, i - 1);
		this.selectedSessionId = this._rows[next] ?? null;
	}
	isAtTop(): boolean {
		return this.selectedIndex() <= 0;
	}
	isAtBottom(): boolean {
		const i = this.selectedIndex();
		return i >= this._rows.length - 1;
	}
	/** Exit the tree: back to editor, clear selection (T3). */
	exit(): void {
		this.surface = "editor";
		this.selectedSessionId = null;
	}
}

export type EditorRoute = { action: "consumed" } | { action: "forward" };

export type RouteMeta = { onLastLogicalLine: boolean; treeOpen: boolean };

/**
 * Pure routing kernel shared by the CustomEditor override AND tests (T1/T3/T4).
 * Returns "consumed" for a key the tree owns (do not touch super) and "forward"
 * for everything else (call super/prior.handleInput).
 */
export function routeEditorFocus(
	controller: TreeFocusState,
	key: TreeKey,
	meta: RouteMeta,
): EditorRoute {
	if (controller.surface === "tree") {
		switch (key) {
			case "up":
				if (controller.isAtTop()) controller.exit();
				else controller.move(-1);
				return { action: "consumed" };
			case "down":
				if (controller.isAtBottom()) controller.exit();
				else controller.move(1);
				return { action: "consumed" };
			case "enter":
				// caller triggers the row action; selection is preserved (T3).
				return { action: "consumed" };
			case "escape":
				controller.exit();
				return { action: "consumed" };
			default:
				return { action: "forward" }; // OJ-2 forward-unhandled
		}
	}
	// editor surface: Down on the last logical line while the tree is open enters it.
	if (meta.treeOpen && meta.onLastLogicalLine && key === "down") {
		if (controller.enter()) return { action: "consumed" };
	}
	return { action: "forward" };
}

export type FocusActivate = (tui: TUI, sessionId: string | null) => void;

/**
 * EV-8 delivery point (OJ-1): a CustomEditor subclass via setEditorComponent,
 * composing over any prior (getEditorComponent) editor so a second editor-
 * wrapping extension isn't clobbered (O4). `controller.surface` is the sole
 * arbiter; the TUI's focused component stays the editor.
 */
export class CustomTreeEditor extends CustomEditor {
	private inner?: EditorComponent;

	constructor(
		tui: TUI,
		theme: EditorTheme,
		keybindings: KeybindingsManager,
		private readonly controller: TreeFocusState,
		private readonly onActivate: FocusActivate,
		priorFactory?: FocusEditorFactory,
		options?: EditorOptions,
	) {
		super(tui, theme, keybindings, options);
		this.inner = priorFactory ? (priorFactory(tui, theme, keybindings) as EditorComponent) : undefined;
	}

	handleInput(data: string): void {
		const key = classifyTreeKey(data);
		const meta: RouteMeta = {
			treeOpen: this.controller.isOpen(),
			onLastLogicalLine: shouldEnterTreeOnDown(this.getCursor().line, this.getLines().length),
		};
		const r = routeEditorFocus(this.controller, key, meta);
		if (r.action === "consumed") {
			if (key === "enter") this.onActivate(this.tui, this.controller.selectedSessionId);
			this.tui.requestRender();
			return;
		}
		// forward-unhandled (OJ-2): prior editor keeps its behavior (O4), else base app editor.
		if (this.inner) this.inner.handleInput(data);
		else super.handleInput(data);
	}

	render(width: number): string[] {
		const lines = super.render(width);
		if (this.controller.surface === "tree" && lines.length > 0) {
			const label = this.borderColor ? this.borderColor(TREE_MODE_LABEL) : TREE_MODE_LABEL;
			lines[lines.length - 1] =
				truncateToWidth(lines[lines.length - 1]!, Math.max(1, width - visibleWidth(label)), "") + label;
		}
		return lines;
	}
}

export type RowActivator = FocusActivate;

let installedPrior: FocusEditorFactory | undefined;

/** Register the EV-8 editor, composing over whatever prior editor exists (O4). */
export function installTreeEditor(ui: Pick<ExtensionUIContext, "getEditorComponent" | "setEditorComponent">, controller: TreeFocusState, onActivate: FocusActivate): void {
	installedPrior = ui.getEditorComponent() ?? undefined;
	ui.setEditorComponent((tui, theme, keybindings) =>
		new CustomTreeEditor(tui, theme, keybindings, controller, onActivate, installedPrior),
	);
}

/** Restore the composed-over editor (default if none) and clear the surface. */
export function restoreTreeEditor(ui: Pick<ExtensionUIContext, "setEditorComponent">): void {
	ui.setEditorComponent(installedPrior);
	installedPrior = undefined;
}