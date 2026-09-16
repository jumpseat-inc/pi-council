import { pidAlive, readManifests, type RunManifest } from "./runs.ts";
import { DEFAULT_RETRY_POLICY } from "./seats.ts";

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
	retrying: "⏸", // EV-39 — between-attempt backoff (R4: same row, one glyph slot)
};

/** Plain-text tree for headless parents. The denominator is the injected
 * init-time snapshot (Q1/D3 — no config read in a render path). */
export function textTree(
	repoRoot: string,
	runIds: string[],
	maxAttempts: number = DEFAULT_RETRY_POLICY.maxAttempts,
): string[] {
	const lines: string[] = [];
	for (const runId of runIds) {
		const nodes = flattenTree(buildTree(readManifests(repoRoot, runId)));
		if (nodes.length === 0) continue;
		lines.push(`run ${runId}`);
		for (const n of nodes) {
			const m = n.manifest;
			const glyph = n.orphaned ? "☠" : (GLYPH[m.state] ?? "?");
			const mins = ((Date.now() - m.startedAt) / 60_000).toFixed(1);
			// EV-39 R4 — `attempt N/M` sits between the seat and the state, only
			// when N > 1; a non-retry row is byte-identical to pre-EV-39.
			const attempt =
				m.attempt !== undefined && m.attempt > 1 ? ` attempt ${m.attempt}/${maxAttempts}` : "";
			lines.push(
				`${"  ".repeat(n.depth + 1)}${glyph} ${m.id} ${m.seat}${attempt} ${m.state} ${mins}m pid=${m.pid ?? "?"}`,
			);
		}
	}
	return lines;
}