import type { ExtensionAPI, ExtensionContext, Theme } from "@earendil-works/pi-coding-agent";
import { Key, matchesKey, truncateToWidth, type Component } from "@earendil-works/pi-tui";
import { findSessionFile, listRunIds, readManifests } from "./runs.ts";
import { buildTree, flattenTree, textTree, type TreeNode } from "./tree.ts";

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

// Filled in Task 9 — keep as a hoisted function so Task 8 compiles.
function openTranscript(_ctx: ExtensionContext, _tui: any, _repoRoot: string, _node: TreeNode, _runId: string): void {
	// no-op until Task 9
}