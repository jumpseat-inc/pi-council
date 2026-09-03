/**
 * EV-20 §8(c) — record-derived re-derivation used by smoke Phase 3.
 *
 * Reads the eval-results store directory (argv[2]) and recomputes the per-cell
 * summary purely from the on-disk records via the SAME `summarizeStore` /
 * `summaryLines` path the live `/council-eval` command uses. The smoke asserts
 * the live transcript's summary is byte-identical to this re-derivation,
 * proving records alone reproduce every aggregate (spec §3 / §8(c)).
 *
 * Run from the package root so the relative engine import resolves:
 *   (cd /pkg && bun smoke/reeval.ts <council/eval-results-store>)
 */
import { summarizeStore, summaryLines } from "../extensions/eval-runner.ts";

const store = process.argv[2];
if (!store) {
	console.error("usage: bun smoke/reeval.ts <eval-results-store-dir>");
	process.exit(2);
}

const summaries = summarizeStore(store);
process.stdout.write(summaryLines(summaries).join("\n") + "\n");
