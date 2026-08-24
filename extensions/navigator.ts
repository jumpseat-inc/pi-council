import type { ExtensionAPI, ExtensionContext, Theme } from "@earendil-works/pi-coding-agent";
import { Key, matchesKey, truncateToWidth, wrapTextWithAnsi, type Component } from "@earendil-works/pi-tui";
import { findSessionFile, listRunIds, readManifests } from "./runs.ts";
import { buildTree, flattenTree, textTree, type TreeNode } from "./tree.ts";
import { TranscriptTail, type TranscriptBlock } from "./transcript.ts";

export const TREE_SHORTCUT = "ctrl+shift+t";

export type NavTheme = Pick<Theme, "fg" | "bold">;

const GLYPH: Record<string, string> = {
	running: "●",
	done: "✓",
	failed: "✗",
	stalled: "⏸",
	cancelled: "⊘",
	timeout: "⚠",
};

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
		this.rows.forEach((r, i) => {
			const m = r.node.manifest;
			const glyph = r.node.orphaned ? "☠" : (GLYPH[m.state] ?? "?");
			const mins = ((Date.now() - m.startedAt) / 60_000).toFixed(1);
			const row = `${"  ".repeat(r.node.depth)}${glyph} ${m.id} ${m.seat} ${mins}m${m.state === "running" ? "" : ` ${m.state}`}`;
			lines.push(truncateToWidth(i === this.selected ? this.theme.fg("accent", `> ${row}`) : `  ${row}`, width));
		});
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
				const tree = new CouncilTree(
					repoRoot,
					currentRunId(),
					theme,
					(node, runId) => {
						openTranscript(ctx, tui, repoRoot, node, runId);
					},
					() => close(),
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
					render: (w: number) => tree.render(w),
					invalidate: () => tree.invalidate(),
					handleInput: (d: string) => {
						tree.handleInput(d);
						tui.requestRender();
					},
				};
			},
			{ overlay: true },
		);
	};

	pi.registerCommand("council-tree", {
		description: "Browse the live council job tree and seat transcripts",
		handler: async (_args, ctx) => {
			await open(ctx);
		},
	});
	pi.registerShortcut(TREE_SHORTCUT, {
		description: "Open the council job tree",
		handler: async (ctx) => {
			await open(ctx);
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
			const view = new TranscriptView(
				file,
				theme2,
				`${node.manifest.id} ${node.manifest.seat}${node.orphaned ? " (orphaned)" : ""}`,
				Math.max(10, (tui?.terminal?.rows ?? 24) - 4),
				() => done2(null),
			);
			view.setOnChange(() => tui?.requestRender?.());
			return view;
		},
		{ overlay: true },
	);
}