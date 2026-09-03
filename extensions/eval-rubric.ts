/**
 * EV-19 — pure scoring rubric / run verifier (gradeCell + replay + projector).
 *
 * PURE module: no `node:fs`, no `node:child_process`, no store, no dispatch
 * path of its own. The only outside contact is the injected `GradeIO` seam
 * (the EV-20 boundary binds a real implementation to the persisted snapshot
 * dir). Rubric validation is NOT re-derived here — `validateRubric`/`Rubric`/
 * `RubricCriterion` are imported from `./eval-fixtures.ts` (C3, one authority).
 *
 * `gradeCell` is a pure function of `{ rubric, judgeVerdicts, io }`: judge
 * criteria replay from the supplied (complete) `judgeVerdicts` map and make
 * zero `io` calls; the four frozen gate kinds probe through `io`. Score is
 * always `passes / criteria.length` — judge criteria count toward the total
 * denominator.
 */
import type { Rubric } from "./eval-fixtures.ts";

// ---- types (settled in spec §2) ----

/** Injected seam — the scorer's only route to the outside world. */
export interface GradeIO {
	/** undefined = the path does not exist. */
	readFile(path: string): string | undefined;
	/** "done" | "stalled" | "timeout" | undefined. */
	jobState(role: string): string | undefined;
	/** May return synchronously or asynchronously. */
	run(argv: string[], opts?: unknown): { exitCode: number; stdout: string } | Promise<{ exitCode: number; stdout: string }>;
}

export type Verdict = "pass" | "fail";
export type JudgeVerdicts = Record<string, Verdict>;

export interface GradedCriterion {
	criterionId: string;
	verdict: Verdict;
	/** gate: exitCode/stdout or path/fragment; judge: the recorded verdict text. */
	evidence: string;
}

export interface GradingUsage {
	input: number;
	output: number;
	cost: number;
	elapsedMs: number;
	stopReason?: string;
}

/** EV-16 §6.3 (Q1 amendment: gains `repeat`) — the grader's contribution; EV-20's persistence unit. Judge criteria only. */
export interface VerdictRecord {
	cellId: string;
	repeat: number;
	gradedBy: string;
	fixtureVersion: string;
	rubricVersion: string;
	perCriterion: GradedCriterion[];
	gradedAt: number;
	gradingUsage: GradingUsage;
}

/** EV-20/EV-21 domain — gradeCell's merged, score-carrying output. */
export interface ResultRecord {
	cellId: string;
	taskId: string;
	model: string;
	thinking?: string;
	repeat: number;
	fixtureVersion: string;
	rubricVersion: string;
	scoredUnder: string; // = the grader's model id
	perCriterion: GradedCriterion[]; // ALL criteria, rubric order
	score: number; // passes / criteria.length, 0..1
	gradedAt: number;
}

/** EV-20 cell-scope terminal block — attached by the store writer at persistence (NOT in gradeCell).
 * `state` is the job's terminal state (done|stalled|timeout|failed), persisted so the terminal-state
 * histogram (E3) and n_attempted/n_graded are recomputable from records alone (R-5). */
export interface CellScope {
	state: "done" | "stalled" | "timeout" | "failed";
	usage: { input: number; output: number; cost: number; turns: number };
	elapsedMs: number;
	stopReason?: string;
	repoState: string; // "sha256:<64 hex>"
}

/** The persisted ResultRecord: gradeCell's pure output + the writer-attached cellScope. */
export interface StoredResultRecord extends ResultRecord {
	cellScope: CellScope;
}

interface GradeMeta {
	cellId: string;
	taskId: string;
	model: string;
	thinking?: string;
	repeat: number;
	scoredUnder: string;
	fixtureVersion: string;
	rubricVersion: string;
	gradedAt: number;
}

// ----

/**
 * Grade one cell against its rubric. Pure: reads only through `io` and the
 * supplied `judgeVerdicts` map. Throws on a missing judge verdict (never
 * fabricates, never renormalizes) and defense-throws on any role-less or
 * path-bearing `settled` check (the validator's narrowing, mirrored here).
 */
export async function gradeCell(input: {
	rubric: Rubric;
	io: GradeIO;
	judgeVerdicts: JudgeVerdicts;
	meta: GradeMeta;
}): Promise<ResultRecord> {
	const { rubric, io, judgeVerdicts, meta } = input;
	const perCriterion: GradedCriterion[] = [];
	let passes = 0;

	for (const criterion of rubric.criteria) {
		let verdict: Verdict;
		let evidence: string;

		if (criterion.type === "judge") {
			const v = judgeVerdicts[criterion.id];
			if (v === undefined) {
				throw new Error(`gradeCell: missing judge verdict for criterion "${criterion.id}"`);
			}
			verdict = v;
			evidence = v; // the recorded verdict text
		} else {
			const check = criterion.check;
			switch (check.kind) {
				case "gates": {
					let pass = false;
					try {
						const res = await io.run(check.argv);
						evidence = `exit=${res.exitCode}`;
						pass =
							res.exitCode === check.expect.exitCode &&
							(check.expect.stdoutContains === undefined || res.stdout.includes(check.expect.stdoutContains));
					} catch {
						evidence = "threw"; // a run that throws is a gradeable fail, no hang
					}
					verdict = pass ? "pass" : "fail";
					break;
				}
				case "artifact-present": {
					const content = io.readFile(check.path);
					evidence = check.path;
					verdict = content !== undefined ? "pass" : "fail";
					break;
				}
				case "artifact-contains": {
					const content = io.readFile(check.path);
					evidence = check.path;
					verdict = (content ?? "").includes(check.contains) ? "pass" : "fail";
					break;
				}
				case "settled": {
					if (check.role === undefined || check.path !== undefined) {
						throw new Error(`gradeCell: settled check on "${criterion.id}" is role-only — role required, path forbidden`);
					}
					const state = io.jobState(check.role);
					evidence = `jobState=${state ?? "undefined"}`;
					verdict = state === "done" ? "pass" : "fail"; // stalled/timeout/undefined -> gradeable fail
					break;
				}
			}
		}

		if (verdict === "pass") passes++;
		perCriterion.push({ criterionId: criterion.id, verdict, evidence });
	}

	const score = passes / rubric.criteria.length;
	return {
		cellId: meta.cellId,
		taskId: meta.taskId,
		model: meta.model,
		...(meta.thinking !== undefined ? { thinking: meta.thinking } : {}),
		repeat: meta.repeat,
		fixtureVersion: meta.fixtureVersion,
		rubricVersion: meta.rubricVersion,
		scoredUnder: meta.scoredUnder,
		perCriterion,
		score,
		gradedAt: meta.gradedAt,
	};
}

/**
 * Pure, lossless extractor of the judge-criteria verdicts from a VerdictRecord
 * — feeds C1's re-grade replay (no dispatch).
 */
export function replayJudgeVerdicts(record: VerdictRecord): JudgeVerdicts {
	const out: JudgeVerdicts = {};
	for (const c of record.perCriterion) out[c.criterionId] = c.verdict;
	return out;
}

/**
 * Project a VerdictRecord from a ResultRecord + a JobReport-shaped object.
 * Judge criteria only (identified by the recorded-verdict evidence convention:
 * judge evidence is literally the Verdict, "pass"|"fail"), `gradedBy =
 * scoredUnder`, and `gradingUsage` per the O4 merge (usage.{input,output,cost}
 * + report-level elapsedMs/stopReason; `usage.turns` excluded by design).
 */
export function projectVerdictRecord(
	result: ResultRecord,
	report: { usage: { input: number; output: number; cost: number; turns: number }; elapsedMs: number; stopReason?: string },
): VerdictRecord {
	const gradingUsage: GradingUsage = {
		input: report.usage.input,
		output: report.usage.output,
		cost: report.usage.cost,
		elapsedMs: report.elapsedMs,
	};
	if (report.stopReason !== undefined) gradingUsage.stopReason = report.stopReason;

	return {
		cellId: result.cellId,
		repeat: result.repeat,
		gradedBy: result.scoredUnder,
		fixtureVersion: result.fixtureVersion,
		rubricVersion: result.rubricVersion,
		perCriterion: result.perCriterion.filter((c) => c.evidence === "pass" || c.evidence === "fail"),
		gradedAt: result.gradedAt,
		gradingUsage,
	};
}
