import { pidAlive, readManifests, type RunManifest } from "./runs.ts";

export interface TreeNode {
	manifest: RunManifest;
	children: TreeNode[];
	depth: number;
	orphaned: boolean;
}

export function buildTree(manifests: RunManifest[], isAlive: (pid: number) => boolean = pidAlive): TreeNode[] {
	const nodes = new Map<string, TreeNode>();
	for (const m of manifests) {
		nodes.set(m.id, {
			manifest: m,
			children: [],
			depth: 0,
			orphaned: m.state === "running" && (m.pid === null || !isAlive(m.pid)),
		});
	}
	const roots: TreeNode[] = [];
	for (const m of manifests) {
		const n = nodes.get(m.id)!;
		const parent = m.parentJobId ? nodes.get(m.parentJobId) : undefined;
		if (parent) parent.children.push(n);
		else roots.push(n);
	}
	const byId = (a: TreeNode, b: TreeNode) => a.manifest.id.localeCompare(b.manifest.id, undefined, { numeric: true });
	const walk = (n: TreeNode, depth: number): void => {
		n.depth = depth;
		n.children.sort(byId);
		for (const c of n.children) walk(c, depth + 1);
	};
	roots.sort(byId);
	for (const r of roots) walk(r, 0);
	return roots;
}

export function flattenTree(roots: TreeNode[]): TreeNode[] {
	const out: TreeNode[] = [];
	const walk = (n: TreeNode): void => {
		out.push(n);
		for (const c of n.children) walk(c);
	};
	for (const r of roots) walk(r);
	return out;
}

const GLYPH: Record<string, string> = {
	running: "●",
	done: "✓",
	failed: "✗",
	stalled: "⏸",
	cancelled: "⊘",
	timeout: "⚠",
};

/** Plain-text tree for headless parents. */
export function textTree(repoRoot: string, runIds: string[]): string[] {
	const lines: string[] = [];
	for (const runId of runIds) {
		const nodes = flattenTree(buildTree(readManifests(repoRoot, runId)));
		if (nodes.length === 0) continue;
		lines.push(`run ${runId}`);
		for (const n of nodes) {
			const m = n.manifest;
			const glyph = n.orphaned ? "☠" : (GLYPH[m.state] ?? "?");
			const mins = ((Date.now() - m.startedAt) / 60_000).toFixed(1);
			lines.push(`${"  ".repeat(n.depth + 1)}${glyph} ${m.id} ${m.seat} ${m.state} ${mins}m pid=${m.pid ?? "?"}`);
		}
	}
	return lines;
}