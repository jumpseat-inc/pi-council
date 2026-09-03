/**
 * EV-20 — the I/O harness. This module is the ONLY boundary that names the
 * `council/eval-results/` path (AGENTS.md convention 12 / EV-16 A3). It is
 * the store writer (R-1, EV-19 §8, EV-20 §6) implementing the Q1/Q2 key
 * semantics, the pure argument parser (§2), the gate-only `"self"` sentinel
 * (Q1-D2), and — in the runner half — driving cells in a scratch worktree and
 * grading through a GradeIO bound to scratch.
 *
 * Imported pure pieces come from `eval-fixtures.ts` (loader + rulings +
 * sha256Tree), `eval-rubric.ts` (gradeCell/projectVerdictRecord/replay), and
 * `eval-stats.ts` (aggregateCell). Dispatch comes from `./dispatch.ts` (the
 * cwd-parameterized primitive) — this module never forks the override path.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { writeAtomic, sumSubtree, type RunManifest } from "./runs.ts";
import type { Rubric } from "./eval-fixtures.ts";
import type { CellScope, ResultRecord, StoredResultRecord, VerdictRecord } from "./eval-rubric.ts";

export const REPEAT_DEFAULT = 3;
export const REPEAT_CAP = 20;
/** Q1-D2 gate-only sentinel — NOT a model id; asserts the cell was gate-only and no judge ran. */
export const SCORED_UNDER_SELF = "self";

// ---- argument grammar (§2, R-3/R-4) ----

export interface ParsedEvalArgs {
	/** undefined for the no-arg list form. */
	task?: string;
	models: string[];
	repeat: number;
	persistSnapshot: boolean;
}

/**
 * Pure parser: `[task] [model...] [--repeat N|--repeat=N] [--persist-snapshot|--no-persist-snapshot]`.
 * Repeat default 3, hard cap 20 (loud reject). Model tokens are NOT parsed
 * here (that is parseQualifiedModel's job, done by the handler against the
 * catalogue) — the parser keeps positionals and the two flags.
 */
export function parseEvalArgs(args: string[]): ParsedEvalArgs {
	let repeat = REPEAT_DEFAULT;
	let persistSnapshot = true;
	const positionals: string[] = [];

	for (let i = 0; i < args.length; i++) {
		const a = args[i];
		if (a === "--repeat") {
			const n = args[i + 1];
			if (n === undefined) throw new Error(`--repeat requires a positive integer N (cap ${REPEAT_CAP})`);
			repeat = parseRepeat(n);
			i++;
		} else if (a.startsWith("--repeat=")) {
			repeat = parseRepeat(a.slice("--repeat=".length));
		} else if (a === "--no-persist-snapshot") {
			persistSnapshot = false;
		} else if (a === "--persist-snapshot") {
			persistSnapshot = true;
		} else {
			positionals.push(a);
		}
	}

	if (!Number.isInteger(repeat) || repeat < 1) {
		throw new Error(`--repeat must be a positive integer (got ${repeat})`);
	}
	if (repeat > REPEAT_CAP) {
		throw new Error(`--repeat ${repeat} exceeds the cap of ${REPEAT_CAP} — lower it (edit REPEAT_CAP to change the guard, not needed in practice)`);
	}

	const [task, ...models] = positionals;
	return { task, models, repeat, persistSnapshot };
}

function parseRepeat(raw: string): number {
	const n = Number(raw);
	if (!Number.isInteger(n)) throw new Error(`--repeat "${raw}" is not a positive integer (cap ${REPEAT_CAP})`);
	return n;
}

// ---- store (R-1, EV-19 §8, EV-20 §6 / Q1-D1, Q1-D2) ----

/** The one consumer-data path this module owns (EV-16 A3). */
export function evalResultsDir(repoRoot: string): string {
	return path.join(repoRoot, "council", "eval-results");
}

/** Idempotent creation + the self-ignoring .gitignore (the runs/ pattern). */
export function ensureEvalDir(repoRoot: string): string {
	const dir = evalResultsDir(repoRoot);
	fs.mkdirSync(dir, { recursive: true });
	const gi = path.join(dir, ".gitignore");
	if (!fs.existsSync(gi)) fs.writeFileSync(gi, "*\n");
	return dir;
}

/** Filename-sanitize a key segment: cellId/scoredUnder contain `/`, `:`, and the `|` cellId separator. */
export function sanitize(seg: string): string {
	return seg.replace(/[/:|]/g, "_");
}

/** VerdictRecord on-disk filename key: (cellId, repeat, gradedBy, fixtureVersion, rubricVersion). */
export function verdictStoreName(r: VerdictRecord): string {
	return `${sanitize(r.cellId)}__r${r.repeat}__${sanitize(r.gradedBy)}__${r.fixtureVersion}__${r.rubricVersion}.json`;
}

/** ResultRecord on-disk filename key: (cellId, repeat, scoredUnder, fixtureVersion, rubricVersion). */
export function resultStoreName(r: ResultRecord): string {
	return `${sanitize(r.cellId)}__r${r.repeat}__${sanitize(r.scoredUnder)}__${r.fixtureVersion}__${r.rubricVersion}.json`;
}

/**
 * Atomic, first-write-wins-per-tuple: absent->new, same payload->no-op,
 * divergent payload->throw (a defect, not a re-write).
 */
function atomicWriteTuple(store: string, name: string, payload: unknown): void {
	const file = path.join(store, name);
	const serialized = JSON.stringify(payload, null, "\t");
	if (fs.existsSync(file)) {
		let existing: string;
		try {
			existing = JSON.stringify(JSON.parse(fs.readFileSync(file, "utf-8")), null, "\t");
		} catch {
			throw new Error(`${file}: existing eval record is corrupt — refusing to overwrite a divergent payload (defect)`);
		}
		if (existing === serialized) return; // same payload -> no-op
		throw new Error(`${file}: divergent payload already stored for this key tuple (defect, not a re-write)`);
	}
	writeAtomic(file, serialized);
}

export function writeVerdictRecord(store: string, record: VerdictRecord): void {
	atomicWriteTuple(store, verdictStoreName(record), record);
}

/** Attach the cellScope block at persistence (NOT in gradeCell — purity sacred). */
export function writeResultRecord(store: string, record: ResultRecord, cellScope: CellScope): void {
	const stored: StoredResultRecord = { ...record, cellScope };
	atomicWriteTuple(store, resultStoreName(record), stored);
}

export function readAllResults(store: string): StoredResultRecord[] {
	const out: StoredResultRecord[] = [];
	if (!fs.existsSync(store)) return out;
	for (const f of fs.readdirSync(store)) {
		if (!f.endsWith(".json")) continue;
		try {
			const rec = JSON.parse(fs.readFileSync(path.join(store, f), "utf-8")) as StoredResultRecord;
			if (rec && typeof rec.score === "number" && rec.cellScope) out.push(rec);
		} catch {
			/* corrupt/mid-write -> skip */
		}
	}
	return out;
}

export function readAllVerdicts(store: string): VerdictRecord[] {
	const out: VerdictRecord[] = [];
	if (!fs.existsSync(store)) return out;
	for (const f of fs.readdirSync(store)) {
		if (!f.endsWith(".json")) continue;
		try {
			const rec = JSON.parse(fs.readFileSync(path.join(store, f), "utf-8")) as unknown as {
				gradedBy?: unknown;
				repeat?: unknown;
				cellScope?: unknown;
			};
			if (rec && typeof rec.gradedBy === "string" && typeof rec.repeat === "number" && rec.cellScope === undefined) {
				out.push(rec as unknown as VerdictRecord);
			}
		} catch {
			/* corrupt -> skip */
		}
	}
	return out;
}

/** A fixture is gate-only when its rubric has no judge criterion (Q1-D2 seven). */
export function isGateOnlyFixture(rubric: Rubric): boolean {
	return !rubric.criteria.some((c) => c.type === "judge");
}

/** Persist the scratch snapshot per cell x repeat (Q2). Skips the copy when `persist` is false. */
export function persistCellSnapshot(store: string, cellId: string, repeat: number, scratchDir: string, persist: boolean): void {
	if (!persist) return;
	const snap = path.join(store, sanitize(cellId), `r${repeat}`, "snapshot");
	fs.cpSync(scratchDir, snap, { recursive: true });
}

// ---- cell cost columns (EV-16 §7) ----

export function cellCost(
	driverUsage: RunManifest["usage"],
	scratchManifests: RunManifest[],
	driverId: string,
): number {
	const callerSide = driverUsage?.cost ?? 0;
	const scratchSide = sumSubtree(scratchManifests, driverId, "cost");
	return callerSide + scratchSide;
}
