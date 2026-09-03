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
import * as os from "node:os";
import * as path from "node:path";
import { execFile } from "node:child_process";
import { writeAtomic, sumSubtree, readManifests, type RunManifest } from "./runs.ts";
import { loadFixture, sha256Tree, type Rubric } from "./eval-fixtures.ts";
import {
	gradeCell,
	projectVerdictRecord,
	type CellScope,
	type GradeIO,
	type JudgeVerdicts,
	type ResultRecord,
	type StoredResultRecord,
	type VerdictRecord,
} from "./eval-rubric.ts";
import { aggregateCell, type CellSummary } from "./eval-stats.ts";
import { spawnSeatJob } from "./dispatch.ts";
import { loadSeat, parseQualifiedModel } from "./seats.ts";
import type { Hub } from "./hub.ts";

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

/** Q1-D1 cellId string form: `taskId|model[:thinking]` (pipe separator; stable across fixture bumps). */
export function cellIdFor(taskId: string, model: string, thinking?: string): string {
	return `${taskId}|${model}${thinking ? `:${thinking}` : ""}`;
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

/** VerdictRecord on-disk filename key: (cellId, repeat, gradedBy, fixtureVersion, rubricVersion).
 * `v__` prefix discriminates from the ResultRecord file, which otherwise
 * collides when gradedBy === scoredUnder (the binding scoredUnder=gradedBy
 * invariant for judged cells). */
export function verdictStoreName(r: VerdictRecord): string {
	return `v__${sanitize(r.cellId)}__r${r.repeat}__${sanitize(r.gradedBy)}__${r.fixtureVersion}__${r.rubricVersion}.json`;
}

/** ResultRecord on-disk filename key: (cellId, repeat, scoredUnder, fixtureVersion, rubricVersion).
 * `s__` prefix discriminates from the VerdictRecord file (see verdictStoreName). */
export function resultStoreName(r: ResultRecord): string {
	return `s__${sanitize(r.cellId)}__r${r.repeat}__${sanitize(r.scoredUnder)}__${r.fixtureVersion}__${r.rubricVersion}.json`;
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

// ---- GradeIO binding + grade-and-persist core (testable without dispatch) ----

function runCmd(argv: string[], cwd: string): Promise<{ exitCode: number; stdout: string }> {
	return new Promise((resolve) => {
		execFile(argv[0], argv.slice(1), { cwd, timeout: 3 * 60_000 }, (err, stdout) => {
			const code = err ? ((err as { code?: number }).code ?? (err as { status?: number }).status ?? 1) : 0;
			resolve({ exitCode: typeof code === "number" ? code : 1, stdout: stdout ?? "" });
		});
	});
}

/**
 * Bind a GradeIO to the scratch tree: `readFile`/`run` resolve against `scratch`
 * (cwd), `jobState(role)` reads the scratch-side run manifests (the cell's own
 * subtree seats) for the shared runId. Must be built AFTER settle so the
 * subtree manifests are final.
 */
export function bindGradeIO(scratch: string, runId: string): GradeIO {
	const manifests = readManifests(scratch, runId);
	return {
		readFile(p) {
			try {
				return fs.readFileSync(path.join(scratch, p), "utf-8");
			} catch {
				return undefined;
			}
		},
		jobState(role) {
			const m = manifests.find((x) => x.seat === role);
			if (!m) return undefined;
			if (m.state === "done") return "done";
			if (m.state === "stalled") return "stalled";
			if (m.state === "timeout") return "timeout";
			return undefined;
		},
		run(argv) {
			return runCmd(argv, scratch);
		},
	};
}

export interface TerminalTelemetry {
	state: "done" | "stalled" | "timeout" | "failed";
	elapsedMs: number;
	stopReason?: string;
	usage: { input: number; output: number; cost: number; turns: number };
	repoState: string;
}

export interface JudgeOutcome {
	gradedBy: string;
	gradingUsage: { input: number; output: number; cost: number; elapsedMs: number; stopReason?: string };
}

export interface GradePersistInput {
	store: string;
	rubric: Rubric;
	io: GradeIO;
	judgeVerdicts: JudgeVerdicts;
	meta: {
		cellId: string;
		taskId: string;
		model: string;
		thinking?: string;
		repeat: number;
		scoredUnder: string;
		fixtureVersion: string;
		rubricVersion: string;
		gradedAt: number;
	};
	terminal: TerminalTelemetry;
	/** present iff the fixture is judge-bearing and the grader ran (non-gate-only). */
	judge?: JudgeOutcome;
}

/**
 * The grade-and-persist core: run gradeCell over the (recording/real) GradeIO,
 * attach the cellScope at persistence, write the ResultRecord, and — for a
 * judge-bearing repeat — project + write the VerdictRecord (harness owns the
 * grader dispatch; here we only persist what the harness already collected).
 * `scoredUnder` is the judge's model id for graded cells, `"self"` for gate-only.
 */
export async function gradeAndPersist(input: GradePersistInput): Promise<{ result: StoredResultRecord; verdictWritten: boolean }> {
	const result = await gradeCell({ rubric: input.rubric, io: input.io, judgeVerdicts: input.judgeVerdicts, meta: input.meta });
	const cellScope: CellScope = {
		state: input.terminal.state,
		usage: input.terminal.usage,
		elapsedMs: input.terminal.elapsedMs,
		repoState: input.terminal.repoState,
	};
	if (input.terminal.stopReason !== undefined) cellScope.stopReason = input.terminal.stopReason;
	writeResultRecord(input.store, result, cellScope);

	let verdictWritten = false;
	if (input.judge) {
		const verdict = projectVerdictRecord(result, {
			usage: {
				input: input.judge.gradingUsage.input,
				output: input.judge.gradingUsage.output,
				cost: input.judge.gradingUsage.cost,
				turns: 0,
			},
			elapsedMs: input.judge.gradingUsage.elapsedMs,
			...((input.judge.gradingUsage.stopReason ?? undefined) !== undefined
				? { stopReason: input.judge.gradingUsage.stopReason }
				: {}),
		});
		writeVerdictRecord(input.store, verdict);
		verdictWritten = true;
	}
	return { result: { ...result, cellScope }, verdictWritten };
}

/**
 * Read both roots' run manifests (caller + scratch) for the shared runId and
 * join on parentJobId (COUNCIL_RUN_ID propagates through childEnv so both
 * roots share one runId — EV-16 §7 / the forest-split merge key).
 */
export function readBothRoots(
	caller: string,
	scratch: string,
	runId: string,
): { callers: RunManifest[]; scratch: RunManifest[] } {
	return { callers: readManifests(caller, runId), scratch: readManifests(scratch, runId) };
}

// ---- judge verdict extraction (O3) ----

const VERDICT_LINE = /^\s*\*\*Verdict\*\*\s*[-–—]?\s*(PASS|REJECT)\b/i;

/** Extract per-criterion judge verdicts from the judge seat's output (O3). */
export function extractJudgeVerdicts(output: string, criterionIds: string[]): { verdicts: JudgeVerdicts; indeterminate: boolean } {
	const hits = output
		.split("\n")
		.map((l) => l.match(VERDICT_LINE))
		.filter((m): m is RegExpMatchArray => Boolean(m))
		.map((m) => m[1].toUpperCase() as "PASS" | "REJECT");
	const out: JudgeVerdicts = {};
	criterionIds.forEach((id, i) => {
		const v = hits[i];
		if (!v) return;
		out[id] = v === "PASS" ? "pass" : "fail";
	});
	const indeterminate = criterionIds.some((id) => out[id] === undefined);
	return { verdicts: out, indeterminate };
}

// ---- cell driver + matrix (in-process cwd=scratch; smoke exercises the seam) ----

export interface RunCellAndGradeOpts {
	store: string;
	repoRoot: string;
	hub: Hub;
	driverSeat: string;
	taskId: string;
	input: string;
	seedDir: string;
	fixtureVersion: string;
	rubricVersion: string;
	rubric: Rubric;
	graderModel?: string;
	model: string; // provider/id
	thinking?: string;
	repeat: number;
	gradedAt: number;
	cellId: string;
	runId: string;
	isModelAvailable: (m: string) => boolean;
	persist: boolean;
	echo: (line: string) => void;
	timeoutMs?: number;
	stallMs?: number;
}

/**
 * Run one cell×repeat in a disposable scratch worktree and grade it.
 * try/finally (EV-19 §5 / Q2): settle -> read both-roots manifests -> GradeIO
 * on scratch -> persist snapshot (if persist) -> rm scratch. The cell driver is
 * spawned in-process with cwd=scratch via the dispatch primitive — NOT an
 * external headless pi subprocess — so the parentJobId chain and shared
 * COUNCIL_RUN_ID keep both roots joinable. The harness owns every grader
 * dispatch (scoredUnder/graderModel invariant).
 */
export async function runCellAndGrade(o: RunCellAndGradeOpts): Promise<void> {
	const scratch = fs.mkdtempSync(path.join(os.tmpdir(), "council-eval-"));
	fs.cpSync(o.seedDir, scratch, { recursive: true });
	try {
		// spawn the cell driver with cwd=scratch (the dispatch primitive; the
		// whole subtree resolves its process.cwd() to scratch -> A1 isolation).
		const driver = spawnSeatJob({
			repoRoot: o.repoRoot,
			hub: o.hub,
			seat: loadSeat(o.repoRoot, o.driverSeat),
			input: o.input,
			cwd: scratch,
			timeoutMs: o.timeoutMs ?? 15 * 60_000,
			stallMs: o.stallMs ?? 4 * 60_000,
			model: o.model,
			...(o.thinking !== undefined ? { thinking: o.thinking } : {}),
			cellId: o.cellId,
			isModelAvailable: o.isModelAvailable,
		});
		const [report] = await o.hub.wait([driver.jobId], (o.timeoutMs ?? 15 * 60_000) + 30_000);
		o.echo(`[council-eval] cell ${o.cellId} repeat ${o.repeat}/${o.repeat >= 0 ? o.repeat : 1} settled=${report.state}`);

		// read both-roots manifests BEFORE disposal (EV-16 §7 merge on parentJobId).
		readBothRoots(o.repoRoot, scratch, o.runId);
		const repoState = sha256Tree(scratch);
		const terminal: TerminalTelemetry = {
			state: report.state === "done" ? "done" : report.state === "stalled" ? "stalled" : report.state === "timeout" ? "timeout" : "failed",
			elapsedMs: report.elapsedMs,
			usage: report.usage,
			repoState,
		};
		if (report.stopReason !== undefined) terminal.stopReason = report.stopReason;

		const gateOnly = isGateOnlyFixture(o.rubric);
		const scoredUnder = gateOnly ? SCORED_UNDER_SELF : (o.graderModel ?? SCORED_UNDER_SELF);
		const meta = {
			cellId: o.cellId,
			taskId: o.taskId,
			model: o.model,
			...(o.thinking !== undefined ? { thinking: o.thinking } : {}),
			repeat: o.repeat,
			scoredUnder,
			fixtureVersion: o.fixtureVersion,
			rubricVersion: o.rubricVersion,
			gradedAt: o.gradedAt,
		};

		const judgeIds = o.rubric.criteria.filter((c) => c.type === "judge").map((c) => c.id);

		if (terminal.state !== "done") {
			// attempted-but-not-graded: record the terminal state so the histogram
			// and n_attempted/n_graded derive from records alone; score 0 excluded
			// from the mean by aggregateCell.
			writeResultRecord(
				o.store,
				{ cellId: o.cellId, taskId: meta.taskId, model: o.model, repeat: o.repeat, fixtureVersion: o.fixtureVersion, rubricVersion: o.rubricVersion, scoredUnder, perCriterion: [], score: 0, gradedAt: o.gradedAt },
				terminal,
			);
			persistCellSnapshot(o.store, o.cellId, o.repeat, scratch, o.persist);
			return;
		}

		let judge: JudgeOutcome | undefined;
		let judgeVerdicts: JudgeVerdicts = {};
		if (!gateOnly && judgeIds.length > 0 && o.graderModel) {
			const parsedG = parseQualifiedModel(o.graderModel, "graderModel");
			// harness-owned grader dispatch: sibling of the cell, model pin beats env.
			const gSeat = loadSeat(o.repoRoot, "judge");
			const g = spawnSeatJob({
				repoRoot: o.repoRoot,
				hub: o.hub,
				seat: gSeat,
				input: `Grade this cell's output against the rubric's judge criteria.\n\nCell output:\n${report.output}`,
				cwd: o.repoRoot,
				timeoutMs: 10 * 60_000,
				stallMs: 4 * 60_000,
				model: parsedG.model,
				...(parsedG.thinkingLevel !== undefined ? { thinking: parsedG.thinkingLevel } : {}),
				cellId: o.cellId,
				isModelAvailable: o.isModelAvailable,
			});
			const [grep] = await o.hub.wait([g.jobId], 10 * 60_000 + 30_000);
			const extracted = extractJudgeVerdicts(grep.output, judgeIds);
			if (extracted.indeterminate) {
				// O3: a sloppy/empty/length judge degrades to indeterminate (n_attempted-not-n_graded),
				// never a fabricated score.
				writeResultRecord(
					o.store,
					{ cellId: o.cellId, taskId: meta.taskId, model: o.model, repeat: o.repeat, fixtureVersion: o.fixtureVersion, rubricVersion: o.rubricVersion, scoredUnder, perCriterion: [], score: 0, gradedAt: o.gradedAt },
					{ ...terminal, state: "done" },
				);
				persistCellSnapshot(o.store, o.cellId, o.repeat, scratch, o.persist);
				return;
			}
			judgeVerdicts = extracted.verdicts;
			judge = { gradedBy: parsedG.model, gradingUsage: { input: grep.usage.input, output: grep.usage.output, cost: grep.usage.cost, elapsedMs: grep.elapsedMs, ...(grep.stopReason !== undefined ? { stopReason: grep.stopReason } : {}) } };
		}

		await gradeAndPersist({
			store: o.store,
			rubric: o.rubric,
			io: bindGradeIO(scratch, o.runId),
			judgeVerdicts,
			meta,
			terminal,
			judge,
		});
		persistCellSnapshot(o.store, o.cellId, o.repeat, scratch, o.persist);
		// treeDigest on the record was stamped from scratch before copy; scratch
		// is disposed in the finally block. (scratch manifests were read before
		// disposal above.)
	} finally {
		try {
			fs.rmSync(scratch, { recursive: true, force: true });
		} catch {
			/* best effort */
		}
	}
}

// ---- matrix driver + summary (record-derived projection) ----

export interface RunMatrixOpts {
	repoRoot: string;
	hub: Hub;
	taskId: string;
	driverSeat: string;
	input: string;
	seedDir: string;
	models: string[]; // qualified tokens, may carry :thinking
	repeat: number;
	persist: boolean;
	isModelAvailable: (m: string) => boolean;
	echo: (line: string) => void;
}

export interface MatrixOutcome {
	store: string;
	fixtureVersion: string;
	rubricVersion: string;
	summaries: CellSummary[];
}

export async function runMatrix(o: RunMatrixOpts): Promise<MatrixOutcome> {
	const store = ensureEvalDir(o.repoRoot);
	const holder = loadFixture(o.repoRoot, o.taskId);
	const fixtureVersion = holder.fixture.fixtureVersion;
	const rubricVersion = holder.rubric.rubricVersion;
	const judged = !isGateOnlyFixture(holder.rubric);
	const graderModel = holder.fixture.graderModel;

	for (const rawModel of o.models) {
		const parsed = parseQualifiedModel(rawModel, "council-eval model");
		const thinking = parsed.thinkingLevel;
		const cellId = cellIdFor(o.taskId, parsed.model, thinking);
		for (let r = 1; r <= o.repeat; r++) {
			o.echo(`[council-eval] cell ${cellId} repeat ${r}/${o.repeat}`);
			try {
				await runCellAndGrade({
					store,
					repoRoot: o.repoRoot,
					hub: o.hub,
					driverSeat: o.driverSeat,
					taskId: o.taskId,
					input: o.input,
					seedDir: o.seedDir,
					fixtureVersion,
					rubricVersion,
					rubric: holder.rubric,
					graderModel: judged ? graderModel : undefined,
					model: parsed.model,
					...(thinking !== undefined ? { thinking } : {}),
					repeat: r,
					gradedAt: Date.now(),
					cellId,
					runId: o.hub.runId ?? "run",
					isModelAvailable: o.isModelAvailable,
					persist: o.persist,
					echo: o.echo,
					timeoutMs: (holder.fixture.timeoutMinutes ?? 15) * 60_000,
				});
				o.echo(`[council-eval] ✓ repeat ${r}/${o.repeat} recorded`);
			} catch (e) {
				o.echo(`[council-eval] ⚠ cell ${cellId} repeat ${r}/${o.repeat} failed: ${e instanceof Error ? e.message : String(e)}`);
			}
		}
	}

	const records = readAllResults(store);
	const grouped = new Map<string, StoredResultRecord[]>();
	for (const rec of records) {
		const key = `${rec.cellId}\u0000${rec.scoredUnder}`;
		const arr = grouped.get(key);
		if (arr) arr.push(rec);
		else grouped.set(key, [rec]);
	}
	const summaries = [...grouped.values()].map((recs) => aggregateCell(recs));
	return { store, fixtureVersion, rubricVersion, summaries };
}

/** Pure, record-derived per-cell summary projection (plain text, no ANSI/hex). */
export function summaryLines(summaries: CellSummary[]): string[] {
	return summaries.map((s) => {
		const mean = s.mean === null ? "—" : s.mean.toFixed(3);
		const sigma = s.sigma === null ? "—" : s.sigma.toFixed(3);
		const flag = s.indeterminate
			? s.lengthMajority
				? " indeterminate (length majority)"
				: " indeterminate (no graded repeats)"
			: "";
		return `[council-eval] ${s.cellId} (${s.scoredUnder}): graded=${s.n_graded}/${s.n_attempted} mean=${mean} σ=${sigma} lengthFlagged=${s.lengthFlagged} done=${s.histogram.done} stalled=${s.histogram.stalled} timeout=${s.histogram.timeout} failed=${s.histogram.failed}${flag}`;
	});
}
