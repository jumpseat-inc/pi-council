import type { ExtensionAPI, ExtensionContext, Theme } from "@earendil-works/pi-coding-agent";
import type { ThemeColor } from "@earendil-works/pi-coding-agent";
import { Key, matchesKey, truncateToWidth, visibleWidth, wrapTextWithAnsi, type Component } from "@earendil-works/pi-tui";
import { findSessionFile, listRunIds, readManifests } from "./runs.ts";
import { buildTree, flattenTree, textTree, type TreeNode } from "./tree.ts";
import { lastActivity, TranscriptTail, type TranscriptBlock } from "./transcript.ts";

export const TREE_SHORTCUT = "ctrl+shift+t";

export const COUNCIL_TREE_WIDGET_KEY = "council-tree";

export type NavTheme = Pick<Theme, "fg" | "bold" | "bg">;

const GLYPH: Record<string, string> = {
	running: "●",
	done: "✓",
	failed: "✗",
	stalled: "⏸",
	cancelled: "⊘",
	timeout: "⚠",
};

const STATE_ORDER: Record<string, number> = {
	running: 0,
	stalled: 1,
	timeout: 1,
	failed: 2,
	orphaned: 2,
	cancelled: 3,
	done: 3,
};

const STATE_TOKEN: Record<string, ThemeColor> = {
	running: "accent",
	done: "success",
	failed: "error",
	stalled: "warning",
	cancelled: "dim",
	timeout: "warning",
	orphaned: "error",
};

export function formatAge(ms: number): string {
	if (!Number.isFinite(ms) || ms < 0) return "";
	const s = Math.floor(ms / 1000);
	if (s < 60) return `${s}s`;
	const minutes = Math.floor(ms / 60000);
	if (minutes < 60) return `${minutes}m`;
	const h = Math.floor(ms / 3600000);
	return `${h}h ${minutes % 60}m`;
}

/** The `ctx.mode` guard for the inline widget path: TUI only (NOT !ctx.hasUI). */
export function surfaceForMode(mode: string): "widget" | "console" {
	return mode === "tui" ? "widget" : "console";
}

/** Tear down the inline tree widget — only meaningful in TUI (OV-2 guard). */
export function clearTreeWidget(ctx: { mode: string; ui: { setWidget(k: string, v: unknown): void } }): void {
	if (ctx.mode === "tui") ctx.ui.setWidget(COUNCIL_TREE_WIDGET_KEY, undefined);
}

/**
 * Wrap component content in a full-screen modal frame: an opaque backdrop
 * over the whole terminal (so the underlying session UI is blocked) plus a
 * centered bordered panel holding the content. The TUI overlay compositor
 * offers no backdrop of its own — OverlayOptions has no background/dim field
 * — so the component must draw it. theme.bg/fg resets are scoped (\x1b[39m /
 * \x1b[49m), so a bg wrap around fg-colored content nests cleanly.
 */
export function withModalFrame(
	theme: NavTheme,
	width: number,
	rows: number,
	content: string[],
	opts: { panelWidth?: number; maxPanelHeight?: number } = {},
): string[] {
	const panelWidth = Math.min(opts.panelWidth ?? 100, Math.max(1, width - 4));
	const contentWidth = Math.max(1, panelWidth - 4);
	const maxPanelHeight = Math.max(1, opts.maxPanelHeight ?? rows);
	const panelHeight = Math.min(content.length + 2, maxPanelHeight);
	const shown = content.slice(0, Math.max(0, panelHeight - 2));
	const panelTop = Math.max(0, Math.floor((rows - panelHeight) / 2));
	const panelLeft = Math.max(0, Math.floor((width - panelWidth) / 2));
	const border = (s: string) => theme.fg("border", s);
	const backdrop = (s: string) => theme.bg("customMessageBg", s);
	const out: string[] = [];
	for (let r = 0; r < rows; r++) {
		const local = r - panelTop;
		let seg: string;
		if (local < 0 || local >= panelHeight) {
			seg = "";
		} else if (local === 0 || local === panelHeight - 1) {
			const horiz = "─".repeat(Math.max(0, panelWidth - 2));
			seg = border(local === 0 ? `┌${horiz}┐` : `└${horiz}┘`);
		} else {
			const text = truncateToWidth(shown[local - 1] ?? "", contentWidth);
			const padded = text + " ".repeat(Math.max(0, contentWidth - visibleWidth(text)));
			seg = border("│ ") + padded + border(" │");
		}
		const left = " ".repeat(panelLeft);
		const rightPad = Math.max(0, width - panelLeft - visibleWidth(seg));
		out.push(backdrop(left + seg + " ".repeat(rightPad)));
	}
	return out;
}

export class CouncilTree implements Component {
	private rows: Array<{ node: TreeNode; runId: string }> = [];
	private selected = 0;
	private scopeAll = false;
	private cached?: { w: number; lines: string[] };

	constructor(
		private repoRoot: string,
		private currentRunId: string | undefined,
		private theme: NavTheme,
		private onOpen: (node: TreeNode, runId: string) => void,
		private onClose: () => void,
		private maxRows = Number.MAX_SAFE_INTEGER,
	) {
		this.refresh();
	}

	refresh(): void {
		const ids = this.scopeAll
			? listRunIds(this.repoRoot)
			: this.currentRunId
				? [this.currentRunId]
				: listRunIds(this.repoRoot).slice(0, 1);
		this.rows = ids.flatMap((runId) =>
			flattenTree(buildTree(readManifests(this.repoRoot, runId))).map((node) => ({ node, runId })),
		);
		if (this.selected >= this.rows.length) this.selected = Math.max(0, this.rows.length - 1);
		this.cached = undefined;
	}

	handleInput(data: string): void {
		if (matchesKey(data, Key.up)) {
			this.selected = Math.max(0, this.selected - 1);
			this.cached = undefined;
			return;
		}
		if (matchesKey(data, Key.down)) {
			this.selected = Math.min(this.rows.length - 1, this.selected + 1);
			this.cached = undefined;
			return;
		}
		if (matchesKey(data, Key.tab)) {
			this.scopeAll = !this.scopeAll;
			this.refresh();
			return;
		}
		if (matchesKey(data, Key.enter) && this.rows[this.selected]) {
			const r = this.rows[this.selected];
			this.onOpen(r.node, r.runId);
			return;
		}
		if (matchesKey(data, Key.escape)) this.onClose();
	}

	render(width: number): string[] {
		if (this.cached?.w === width) return this.cached.lines;
		const lines = [
			this.theme.bold(
				`council jobs${this.scopeAll ? " (all runs)" : ""} — ↑↓ move · enter view · tab runs · esc close`,
			),
		];
		if (this.rows.length === 0) lines.push(this.theme.fg("dim", "  (no jobs)"));
		// Window around the selection when the tree is taller than the panel budget,
		// so the highlighted row stays on screen.
		const start =
			this.rows.length > this.maxRows
				? Math.max(
						0,
						Math.min(this.selected - Math.floor((this.maxRows - 1) / 2), this.rows.length - this.maxRows),
					)
				: 0;
		const windowed = this.rows.slice(start, start + Math.min(this.maxRows, this.rows.length));
		windowed.forEach((r, i) => {
			const idx = start + i;
			const m = r.node.manifest;
			const glyph = r.node.orphaned ? "☠" : (GLYPH[m.state] ?? "?");
			const mins = ((Date.now() - m.startedAt) / 60_000).toFixed(1);
			const row = `${"  ".repeat(r.node.depth)}${glyph} ${m.id} ${m.seat} ${mins}m${m.state === "running" ? "" : ` ${m.state}`}`;
			lines.push(truncateToWidth(idx === this.selected ? this.theme.fg("accent", `> ${row}`) : `  ${row}`, width));
		});
		if (this.rows.length > windowed.length) {
			lines.push(this.theme.fg("dim", `  … ${this.rows.length - windowed.length} more`));
		}
		this.cached = { w: width, lines };
		return lines;
	}

	invalidate(): void {
		this.cached = undefined;
	}
}

/** The `ctx.mode === "tui"` guard: widget surface only in interactive TUI. */
const WIDGET_LINES_MAX = 10; // 1 hint line + 9 rows
const ROWS_MAX = WIDGET_LINES_MAX - 1;

function glyphFor(node: TreeNode): string {
	if (node.orphaned) return "☠";
	return GLYPH[node.manifest.state] ?? "?";
}

function stateOf(node: TreeNode): string {
	return node.orphaned ? "orphaned" : node.manifest.state;
}

function firstArgOf(block: TranscriptBlock): string {
	if (!block.detail) return "";
	try {
		const obj = JSON.parse(block.detail);
		if (obj && typeof obj === "object") {
			for (const v of Object.values(obj)) {
				if (typeof v === "string") return v;
			}
		}
	} catch {
		/* not JSON → no first arg */
	}
	return "";
}

/** Verb-first last-activity copy from a TranscriptBlock (designer GLANCE). */
function activityCopy(block: TranscriptBlock): string {
	switch (block.kind) {
		case "toolCall": {
			const arg = firstArgOf(block);
			return `ran ${block.label ?? "tool"}${arg ? ` ${arg.slice(0, 30)}` : ""}`;
		}
		case "thinking":
			return "thinking";
		case "assistant":
			return "replied";
		case "toolResult":
			return `got ${block.label ?? "tool"}`;
		case "user":
			return "idle";
	}
}

/** Status copy for a non-running row, collapsed to manifest state + settledAt. */
function settledCopy(node: TreeNode, now: number): { copy: string; age: string } {
	const st = stateOf(node);
	const m = node.manifest;
	const settledAge = (m.settledAt != null ? formatAge(now - m.settledAt) : "") as string;
	switch (st) {
		case "done":
			return { copy: "settled", age: settledAge };
		case "failed":
			return { copy: "failed", age: "" };
		case "stalled":
			return { copy: "stalled", age: settledAge };
		case "cancelled":
			return { copy: "cancelled", age: "" };
		case "timeout": {
			const secs = m.settledAt != null ? Math.max(0, Math.floor((now - m.settledAt) / 1000)) : 0;
			return { copy: `timeout ${secs}s`, age: "" };
		}
		case "orphaned":
			return { copy: "orphaned", age: "" };
		default:
			return { copy: st, age: "" };
	}
}

/**
 * EV-7 display-only inline below-editor tree widget: one stable row per job
 * (state glyph + seat + verb-first last activity + right-aligned age). Reads
 * tree shape from manifests (current-run scoped, matching the modal's
 * `scopeAll=false`), and tail-reads the running seat's transcript for the
 * last-activity seam so the 2s refresh is O(rows × appended-bytes), not a
 * full parse per node. Non-running rows collapse to manifest state. Renders
 * theme tokens at render time (repaint-safe on a mid-session recolor).
 */
export class CouncilTreeWidget implements Component {
	private rows: Array<{ node: TreeNode }> = [];
	private tails = new Map<string, TranscriptTail>();
	private lastBlocks = new Map<string, TranscriptBlock | undefined>();
	private cached?: { w: number; lines: string[] };
	private now: () => number;

	constructor(
		private repoRoot: string,
		private currentRunId: () => string | undefined,
		private theme: NavTheme,
		opts: { now?: () => number } = {},
		maxRows = ROWS_MAX,
	) {
		this.now = opts.now ?? Date.now;
		this.refresh();
	}

	private keyFor(node: TreeNode): string {
		return `${node.manifest.sessionId}`;
	}

	/** Tail-read the running seat's transcript; NaN `at` blocks are ignored (lastActivity skips them). */
	private tailRead(node: TreeNode): TranscriptBlock | undefined {
		const key = this.keyFor(node);
		const file = findSessionFile(this.repoRoot, this.currentRunId() ?? "", node.manifest.sessionId);
		if (!file) return undefined;
		if (!this.tails.has(key)) {
			this.tails.set(key, new TranscriptTail(file));
		}
		const tail = this.tails.get(key)!;
		const fresh = tail.poll();
		if (fresh.length > 0) {
			const la = lastActivity(fresh);
			const prev = this.lastBlocks.get(key);
			if (la && (!prev || !Number.isFinite(prev.at) || la.at > prev.at)) this.lastBlocks.set(key, la);
		}
		return this.lastBlocks.get(key);
	}

	refresh(): void {
		const runId = this.currentRunId();
		this.rows = runId ? flattenTree(buildTree(readManifests(this.repoRoot, runId))).map((node) => ({ node })) : [];
		// drain/refresh tails for running seats (tail-read, not full parse)
		for (const { node } of this.rows) {
			if (stateOf(node) === "running") this.tailRead(node);
		}
		this.cached = undefined;
	}

	private rowLine(node: TreeNode): string {
		const st = stateOf(node);
		const glyph = glyphFor(node);
		const seat = node.manifest.seat;
		const bold = st === "running" || st === "stalled";
		const token = (STATE_TOKEN[st] ?? "muted") as ThemeColor;
		const styled = bold ? this.theme.bold(this.theme.fg(token, seat)) : this.theme.fg(token, seat);
		// stable left edge: seat field padded to (at least) 14 visible columns
		const pad = Math.max(0, 14 - visibleWidth(styled));
		const seatField = styled + " ".repeat(pad);
		if (st === "running") {
			const block = this.lastBlocks.get(this.keyFor(node));
			if (block) {
				const msg = activityCopy(block);
				const age = Number.isFinite(block.at) ? formatAge(this.now() - block.at) : "";
				return `${glyph} ${seatField} · ${msg}${age ? " " + age : ""}`;
			}
			// no transcript/timestamp reachable → fall back to manifest startedAt
			const age = formatAge(this.now() - node.manifest.startedAt);
			return `${glyph} ${seatField} · spawned${age ? " " + age : ""}`;
		}
		const s = settledCopy(node, this.now());
		const copy = s.copy + (s.age ? " " + s.age : "");
		return `${glyph} ${seatField} · ${copy}`;
	}

	render(width: number): string[] {
		if (this.cached?.w === width) return this.cached.lines;
		const ordered = [...this.rows].sort(
			(a, b) => (STATE_ORDER[stateOf(a.node)] ?? 99) - (STATE_ORDER[stateOf(b.node)] ?? 99),
		);
		const lines: string[] = [];
		if (ordered.length === 0) {
			lines.push(this.theme.fg("dim", "no council jobs this session"));
		} else {
			const overflow = ordered.length > ROWS_MAX;
			const rowBudget = overflow ? ROWS_MAX - 1 : ROWS_MAX;
			for (const { node } of ordered.slice(0, rowBudget)) lines.push(truncateToWidth(this.rowLine(node), width));
			if (overflow) {
				lines.push(this.theme.fg("dim", `... ${ordered.length - rowBudget} more`));
			}
		}
		lines.push(this.theme.fg("dim", "up/down move · enter view · /council-tree to close"));
		this.cached = { w: width, lines };
		return lines;
	}

	invalidate(): void {
		this.cached = undefined;
	}
}

export function registerNavigator(pi: ExtensionAPI, repoRoot: string, currentRunId: () => string | undefined): void {
	const open = async (ctx: ExtensionContext): Promise<void> => {
		if (!ctx.hasUI) {
			const lines = textTree(repoRoot, listRunIds(repoRoot).slice(0, 5));
			console.log(lines.length ? lines.join("\n") : "No council jobs yet.");
			return;
		}
		await ctx.ui.custom<string | null>(
			(tui: any, theme: NavTheme, _kb: unknown, done: (v: string | null) => void) => {
				const termRows = Math.max(10, (tui?.terminal?.rows ?? 24));
				const tree = new CouncilTree(
					repoRoot,
					currentRunId(),
					theme,
					(node, runId) => {
						openTranscript(ctx, tui, repoRoot, node, runId);
					},
					() => close(),
					termRows - 4,
				);
				const refreshTimer = setInterval(() => {
					tree.refresh();
					tui.requestRender();
				}, 2000);
				const close = () => {
					clearInterval(refreshTimer);
					done(null);
				};
				return {
					render: (w: number) =>
						withModalFrame(
							theme,
							w,
							termRows,
							tree.render(Math.min(96, Math.max(1, w - 8))),
							{ maxPanelHeight: termRows - 2 },
						),
					invalidate: () => tree.invalidate(),
					handleInput: (d: string) => {
						tree.handleInput(d);
						tui.requestRender();
					},
				};
			},
			{
				overlay: true,
				overlayOptions: { width: "100%", maxHeight: "100%", margin: 0, anchor: "top-left" },
			},
		);
	};

	// EV-7: stateful TUI-gated toggle for the inline below-editor tree.
	// Non-TUI (headless/RPC) routes to the console textTree fallback. The old
	// modal `open()` above is left untouched (OV-2: navigator.ts:57 guard is
	// out of EV-7's scope — a follow-up card repairs it).
	let treeOpen = false;
	const toggleWidget = async (ctx: ExtensionContext): Promise<void> => {
		if (surfaceForMode(ctx.mode) === "console") {
			const lines = textTree(repoRoot, listRunIds(repoRoot).slice(0, 5));
			console.log(lines.length ? lines.join("\n") : "No council jobs yet.");
			return;
		}
		if (treeOpen) {
			ctx.ui.setWidget(COUNCIL_TREE_WIDGET_KEY, undefined);
			treeOpen = false;
			return;
		}
		ctx.ui.setWidget(
			COUNCIL_TREE_WIDGET_KEY,
			(tui: any, theme: NavTheme) => {
				const widget = new CouncilTreeWidget(repoRoot, currentRunId, theme);
				const timer = setInterval(() => {
					widget.refresh();
					tui?.requestRender?.();
				}, 2000);
				return {
					render: (w: number) => widget.render(w),
					invalidate: () => widget.invalidate(),
					dispose: () => clearInterval(timer),
				};
			},
			{ placement: "belowEditor" },
		);
		treeOpen = true;
	};

	pi.registerCommand("council-tree", {
		description: "Browse the live council job tree and seat transcripts",
		handler: async (_args, ctx) => {
			await toggleWidget(ctx);
		},
	});
	pi.registerShortcut(TREE_SHORTCUT, {
		description: "Open the council job tree",
		handler: async (ctx) => {
			await toggleWidget(ctx);
		},
	});
}

export class TranscriptView implements Component {
	private tail: TranscriptTail | null;
	private blocks: TranscriptBlock[] = [];
	private expanded = new Set<number>();
	private showThinking = false;
	private focused = 0;
	private topLine = 0;
	private follow = true;
	private timer: ReturnType<typeof setInterval>;
	private onChange?: () => void;

	constructor(
		file: string | undefined,
		private theme: NavTheme,
		private title: string,
		private viewportRows: number,
		private onClose: () => void,
	) {
		this.tail = file ? new TranscriptTail(file) : null;
		this.poll();
		this.timer = setInterval(() => {
			if (this.poll()) this.onChange?.();
		}, 1000);
	}

	setOnChange(fn: () => void): void {
		this.onChange = fn;
	}

	dispose(): void {
		clearInterval(this.timer);
	}

	poll(): boolean {
		const nb = this.tail?.poll() ?? [];
		if (nb.length === 0) return false;
		this.blocks.push(...nb);
		return true;
	}

	private visible(): Array<{ i: number; b: TranscriptBlock }> {
		return this.blocks.map((b, i) => ({ i, b })).filter(({ b }) => b.kind !== "thinking" || this.showThinking);
	}

	private blockLines(b: TranscriptBlock, i: number, width: number): string[] {
		const t = this.theme;
		const head =
			b.kind === "user"
				? t.fg("accent", t.bold("user"))
				: b.kind === "assistant"
					? t.fg("success", t.bold("assistant"))
					: b.kind === "thinking"
						? t.fg("dim", "thinking")
						: b.kind === "toolCall"
							? t.fg("warning", `→ ${b.label}`)
							: t.fg("muted", `⎿ ${b.label} · ${b.bytes ?? 0}b`);
		const out = [head];
		const showBody = b.kind === "user" || b.kind === "assistant" || this.expanded.has(i);
		if (showBody) {
			const body = b.kind === "toolCall" || b.kind === "toolResult" || b.kind === "thinking" ? (b.detail ?? "") : b.text;
			const all = body.split("\n");
			const capped = all.slice(0, 200);
			if (all.length > 200) capped.push(t.fg("dim", `… truncated (${body.length} bytes total)`));
			for (const l of capped) out.push(...wrapTextWithAnsi(`  ${l}`, width - 2));
		} else if (b.text) {
			out.push(truncateToWidth(`  ${t.fg("dim", b.text)}`, width));
		}
		return out;
	}

	handleInput(data: string): void {
		const vis = this.visible();
		if (matchesKey(data, Key.up)) {
			this.follow = false;
			this.focused = Math.max(0, this.focused - 1);
		} else if (matchesKey(data, Key.down)) {
			this.follow = false;
			this.focused = Math.min(vis.length - 1, this.focused + 1);
		} else if (matchesKey(data, "e") && vis[this.focused]) {
			const i = vis[this.focused].i;
			if (this.expanded.has(i)) this.expanded.delete(i);
			else this.expanded.add(i);
		} else if (matchesKey(data, "t")) {
			this.showThinking = !this.showThinking;
		} else if (matchesKey(data, "f")) {
			this.follow = !this.follow;
		} else if (matchesKey(data, "g")) {
			this.follow = false;
			this.focused = 0;
		} else if (matchesKey(data, Key.shift("g"))) {
			this.follow = false;
			this.focused = Math.max(0, vis.length - 1);
		} else if (matchesKey(data, Key.escape)) {
			this.dispose();
			this.onClose();
			return;
		}
		this.onChange?.();
	}

	render(width: number): string[] {
		const t = this.theme;
		const vis = this.visible();
		if (this.focused >= vis.length) this.focused = Math.max(0, vis.length - 1);
		const all: string[] = [
			t.bold(`${this.title} — ↑↓ move · e expand · t thinking · f follow${this.follow ? "(on)" : ""} · esc back`),
		];
		if (vis.length === 0) all.push(t.fg("dim", this.tail ? "  (waiting for output…)" : "  (no transcript)"));
		const starts: number[] = [];
		for (const { i, b } of vis) {
			starts.push(all.length);
			all.push(...this.blockLines(b, i, width));
		}
		const focusLine = starts[this.focused] ?? 0;
		const maxTop = Math.max(0, all.length - this.viewportRows);
		if (this.follow) this.topLine = maxTop;
		else this.topLine = Math.min(Math.max(0, focusLine - 2), maxTop);
		return all.slice(this.topLine, this.topLine + this.viewportRows);
	}

	invalidate(): void {}
}

function openTranscript(ctx: ExtensionContext, tui: any, repoRoot: string, node: TreeNode, runId: string): void {
	const file = findSessionFile(repoRoot, runId, node.manifest.id);
	void ctx.ui.custom(
		(_t2: any, theme2: NavTheme, _kb: unknown, done2: (v: null) => void) => {
			const termRows = Math.max(10, (tui?.terminal?.rows ?? 24));
			const view = new TranscriptView(
				file,
				theme2,
				`${node.manifest.id} ${node.manifest.seat}${node.orphaned ? " (orphaned)" : ""}`,
				termRows - 4,
				() => done2(null),
			);
			view.setOnChange(() => tui?.requestRender?.());
			return {
				render: (w: number) =>
					withModalFrame(
						theme2,
						w,
						termRows,
						view.render(Math.min(96, Math.max(1, w - 8))),
						{ maxPanelHeight: termRows - 2 },
					),
				invalidate: () => view.invalidate(),
				handleInput: (d: string) => {
					view.handleInput(d);
					tui?.requestRender?.();
				},
			};
		},
		{
			overlay: true,
			overlayOptions: { width: "100%", maxHeight: "100%", margin: 0, anchor: "top-left" },
		},
	);
}
