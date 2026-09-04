/**
 * EV-21 Phase-4 (c) — drive the leaderboard READER against the Phase-3 records
 * and print its per-cohort n/mean/σ so the smoke can compare them byte-for-byte
 * with /council-eval's summarizeStore re-derivation (same-function-both-sides).
 *
 * Run from the package root so the relative engine imports resolve:
 *   (cd /pkg && bun smoke/leaderview.ts <eval-results-store-dir> <repo-root>)
 */
import { buildLeaderboard } from "../extensions/eval-leaderboard.ts";

const store = process.argv[2];
const repoRoot = process.argv[3] ?? "/";
if (!store) {
	console.error("usage: bun smoke/leaderview.ts <eval-results-store-dir> <repo-root>");
	process.exit(2);
}

for (const r of buildLeaderboard(store, repoRoot)) {
	const mean = r.summary.mean === null ? "—" : r.summary.mean.toFixed(3);
	const sigma = r.summary.sigma === null ? "—" : r.summary.sigma.toFixed(3);
	const label = rankLabel(r);
	process.stdout.write(`[council-leaderboard] ${r.taskId} (${r.scoredUnder}) ${label}: graded=${r.summary.n_graded}/${r.summary.n_attempted} mean=${mean} σ=${sigma}\n`);
}

function rankLabel(r: { model: string; thinking?: string }): string {
	return r.thinking !== undefined ? `${r.model}:${r.thinking}` : r.model;
}