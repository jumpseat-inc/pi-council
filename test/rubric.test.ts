import { test, expect } from "bun:test";
import {
	gradeCell,
	replayJudgeVerdicts,
	projectVerdictRecord,
	type GradeIO,
	type JudgeVerdicts,
	type ResultRecord,
	type VerdictRecord,
} from "../extensions/eval-rubric.ts";
import { validateRubric, type Rubric } from "../extensions/eval-fixtures.ts";

// ---- recording fake GradeIO (pure-mirror of fs/child_process) ----

class FakeIO implements GradeIO {
	files = new Map<string, string>();
	jobs = new Map<string, string>();
	/** Scripted responses, consumed in call order. */
	runResponses: { exitCode: number; stdout: string }[] = [];
	runThrows = false;
	runCalls: string[][] = [];
	runIx = 0;

	readFile(path: string): string | undefined {
		return this.files.get(path);
	}
	jobState(role: string): string | undefined {
		return this.jobs.get(role);
	}
	run(argv: string[]): { exitCode: number; stdout: string } {
		this.runCalls.push(argv);
		if (this.runThrows) throw new Error("run exploded");
		const r = this.runResponses[this.runIx] ?? { exitCode: 0, stdout: "" };
		this.runIx++;
		return r;
	}
}

const META = {
	cellId: "10-1",
	taskId: "t",
	model: "m1",
	repeat: 1,
	scoredUnder: "m1",
	fixtureVersion: "1.0.0",
	rubricVersion: "1.0.0",
	gradedAt: 1000,
};

function rub(criteria: Rubric["criteria"]): Rubric {
	return { schemaVersion: 1, rubricVersion: "1.0.0", criteria };
}

// --- 10.1 C1 reproducibility: replay re-grade is byte-identical; gates re-run, judge zero io ---

test("C1: replayJudgeVerdicts -> gradeCell reproduces a byte-identical ResultRecord, judge makes zero io calls", async () => {
	const io = new FakeIO();
	io.runResponses = [{ exitCode: 0, stdout: "All council artifacts valid" }];
	const io2 = new FakeIO();
	io2.runResponses = [{ exitCode: 0, stdout: "All council artifacts valid" }];
	const r = rub([
		{ id: "c1", type: "gate", check: { kind: "gates", argv: ["python3", "council/validate.py"], expect: { exitCode: 0, stdoutContains: "All council artifacts valid" } } },
		{ id: "c2", type: "judge", prompt: "p" },
	]);
	const judgeVerdicts: JudgeVerdicts = { c2: "pass" };

	const first = await gradeCell({ rubric: r, io, judgeVerdicts, meta: META });
	// round-trip through the recorded VerdictRecord
	const vr = projectVerdictRecord(first, {
		usage: { input: 1, output: 2, cost: 3, turns: 4 },
		elapsedMs: 5,
		stopReason: "stop",
	});
	const replay = replayJudgeVerdicts(vr);
	expect(replay).toEqual({ c2: "pass" });

	const second = await gradeCell({ rubric: r, io: io2, judgeVerdicts: replay, meta: META });
	expect(second).toEqual(first);
	// gate re-ran on re-grade; the judge criterion made zero io.run calls
	expect(io.runCalls.length).toBe(1);
	expect(io2.runCalls.length).toBe(1);
});

// --- 10.2 C2 structural half: different scoredUnder -> distinct records; first deep-unchanged ---

test("C2: re-grading under a different scoredUnder yields a distinct record, the original is unchanged", async () => {
	const io = new FakeIO();
	io.files.set("a.txt", "hello");
	const r = rub([{ id: "c1", type: "gate", check: { kind: "artifact-present", path: "a.txt" } }]);
	const m1 = await gradeCell({ rubric: r, io, judgeVerdicts: {}, meta: META });
	const snapshot = JSON.parse(JSON.stringify(m1)) as ResultRecord;

	const m2 = await gradeCell({ rubric: r, io, judgeVerdicts: {}, meta: { ...META, scoredUnder: "m2" } });

	expect(m2.scoredUnder).toBe("m2");
	expect(m2).not.toEqual(m1);
	expect(m1).toEqual(snapshot); // M1 deep-unchanged
	expect(m1.score).toBe(m2.score); // same rubric + same io -> same score, only scoredUnder differs
});

// --- 10.3 gate truth table across all four kinds ---

test("gates: passes on exitCode + stdoutContains, fails on mismatch", async () => {
	const io = new FakeIO();
	io.runResponses = [
		{ exitCode: 0, stdout: "All council artifacts valid" }, // pass
		{ exitCode: 1, stdout: "All council artifacts valid" }, // wrong exit code -> fail
		{ exitCode: 0, stdout: "boom" }, // missing stdout fragment -> fail
	];
	const r = rub([
		{ id: "c1", type: "gate", check: { kind: "gates", argv: ["x"], expect: { exitCode: 0, stdoutContains: "All council artifacts valid" } } },
		{ id: "c2", type: "gate", check: { kind: "gates", argv: ["x"], expect: { exitCode: 0, stdoutContains: "All council artifacts valid" } } },
		{ id: "c3", type: "gate", check: { kind: "gates", argv: ["x"], expect: { exitCode: 0, stdoutContains: "All council artifacts valid" } } },
	]);
	const res = await gradeCell({ rubric: r, io, judgeVerdicts: {}, meta: META });
	expect(res.perCriterion.map((c) => c.verdict)).toEqual(["pass", "fail", "fail"]);
});

test("gates: a run that throws is a gradeable fail, not a throw", async () => {
	const io = new FakeIO();
	io.runThrows = true;
	const r = rub([{ id: "c1", type: "gate", check: { kind: "gates", argv: ["x"], expect: { exitCode: 0 } } }]);
	const res = await gradeCell({ rubric: r, io, judgeVerdicts: {}, meta: META });
	expect(res.perCriterion[0].verdict).toBe("fail");
});

test("artifact-present / artifact-contains: pass and fail for present/absent and contains/missing", async () => {
	const io = new FakeIO();
	io.files.set("a.txt", "has the token");
	const r = rub([
		{ id: "p1", type: "gate", check: { kind: "artifact-present", path: "a.txt" } }, // pass
		{ id: "p2", type: "gate", check: { kind: "artifact-present", path: "b.txt" } }, // absent -> fail
		{ id: "c1", type: "gate", check: { kind: "artifact-contains", path: "a.txt", contains: "token" } }, // pass
		{ id: "c2", type: "gate", check: { kind: "artifact-contains", path: "a.txt", contains: "nope" } }, // fail
	]);
	const res = await gradeCell({ rubric: r, io, judgeVerdicts: {}, meta: META });
	expect(res.perCriterion.map((c) => c.verdict)).toEqual(["pass", "fail", "pass", "fail"]);
});

test("settled: done -> pass; stalled/timeout/undefined -> gradeable fail, never a throw", async () => {
	const r = rub([{ id: "s", type: "gate", check: { kind: "settled", role: "facilitator" } }]);
	for (const state of ["done", "stalled", "timeout", undefined]) {
		const io = new FakeIO();
		if (state !== undefined) io.jobs.set("facilitator", state);
		const res = await gradeCell({ rubric: r, io, judgeVerdicts: {}, meta: META });
		expect(res.perCriterion[0].verdict).toBe(state === "done" ? "pass" : "fail");
	}
});

// --- 10.4 scoring ---

test("scoring: 2 pass + 1 fail -> 2/3; all pass -> 1.0; all fail -> 0", async () => {
	const io = new FakeIO();
	const r = rub([
		{ id: "c1", type: "gate", check: { kind: "artifact-present", path: "a" } },
		{ id: "c2", type: "gate", check: { kind: "artifact-present", path: "b" } },
		{ id: "c3", type: "gate", check: { kind: "artifact-present", path: "c" } },
	]);
	const res = await gradeCell({ rubric: r, io, judgeVerdicts: {}, meta: META });
	expect(res.score).toBe(0); // none present -> 0/3
	expect(res.perCriterion.length).toBe(3);
});

test("scoring: judge-only single pass -> 1.0; judge in the total denominator", async () => {
	const io = new FakeIO();
	io.files.set("present", "x");
	const r = rub([
		{ id: "g", type: "gate", check: { kind: "artifact-present", path: "present" } }, // pass
		{ id: "j1", type: "judge", prompt: "p" },
		{ id: "j2", type: "judge", prompt: "p" },
	]);
	const res = await gradeCell({ rubric: r, io, judgeVerdicts: { j1: "pass", j2: "pass" }, meta: META });
	expect(res.score).toBe(1.0);
	expect(res.perCriterion.length).toBe(3);
});

test("scoring: 1 gate-fail + 2 judge-pass -> 2/3 (judge counts toward total denominator)", async () => {
	const io = new FakeIO();
	const r = rub([
		{ id: "g", type: "gate", check: { kind: "artifact-present", path: "missing" } }, // fail
		{ id: "j1", type: "judge", prompt: "p" },
		{ id: "j2", type: "judge", prompt: "p" },
	]);
	const res = await gradeCell({ rubric: r, io, judgeVerdicts: { j1: "pass", j2: "pass" }, meta: META });
	expect(res.score).toBeCloseTo(2 / 3, 6);
});

test("scoring: judge-only single pass -> 1.0 (solo judge)", async () => {
	const io = new FakeIO();
	const r = rub([{ id: "j1", type: "judge", prompt: "p" }]);
	const res = await gradeCell({ rubric: r, io, judgeVerdicts: { j1: "pass" }, meta: META });
	expect(res.score).toBe(1.0);
});

// --- 10.5 missing judge verdict throws (never a fabricated score) ---

test("[gate-pass, judge] with {} judgeVerdicts -> gradeCell throws, never {score:1.0}", async () => {
	const io = new FakeIO();
	io.files.set("a", "1");
	const r = rub([
		{ id: "g", type: "gate", check: { kind: "artifact-present", path: "a" } }, // pass
		{ id: "j", type: "judge", prompt: "p" },
	]);
	await expect(gradeCell({ rubric: r, io, judgeVerdicts: {}, meta: META })).rejects.toThrow();
});

// --- 10.6 settled narrowing (validator) + gradeCell defense-throw ---

test("validateRubric rejects a path-only settled check (O2 narrowing)", () => {
	expect(() =>
		validateRubric(
			{ schemaVersion: 1, rubricVersion: "1.0.0", criteria: [{ id: "c1", type: "gate", check: { kind: "settled", path: "out.txt" } }] },
			"f",
		),
	).toThrow();
});

test("validateRubric rejects a role+path settled check (O2 narrowing)", () => {
	expect(() =>
		validateRubric(
			{ schemaVersion: 1, rubricVersion: "1.0.0", criteria: [{ id: "c1", type: "gate", check: { kind: "settled", role: "facilitator", path: "out.txt" } }] },
			"f",
		),
	).toThrow();
});

test("validateRubric accepts a role-only settled check (shipped rubrics)", () => {
	const r = validateRubric(
		{ schemaVersion: 1, rubricVersion: "1.0.0", criteria: [{ id: "c1", type: "gate", check: { kind: "settled", role: "facilitator" } }] },
		"f",
	);
	expect(r.criteria[0]).toMatchObject({ type: "gate", check: { kind: "settled", role: "facilitator" } });
});

test("gradeCell defense-throws on a role-less or path-bearing settled check it receives", async () => {
	const io = new FakeIO();
	// Bypass the validator: hand gradeCell a malformed settled check directly (defense-in-depth).
	const badRole = { id: "s", type: "gate", check: { kind: "settled" } } as unknown as Rubric["criteria"][number];
	const badPath = { id: "s", type: "gate", check: { kind: "settled", role: "facilitator", path: "x" } } as unknown as Rubric["criteria"][number];
	await expect(gradeCell({ rubric: rub([badRole]), io, judgeVerdicts: {}, meta: META })).rejects.toThrow();
	await expect(gradeCell({ rubric: rub([badPath]), io, judgeVerdicts: {}, meta: META })).rejects.toThrow();
});

// --- 10.7 projectVerdictRecord gradingUsage merge (O4) ---

test("projectVerdictRecord merges usage.input/output/cost + report.elapsedMs/stopReason, excludes turns", async () => {
	const io = new FakeIO();
	io.files.set("a", "1");
	const r = rub([
		{ id: "g", type: "gate", check: { kind: "artifact-present", path: "a" } }, // not a judge criterion
		{ id: "j", type: "judge", prompt: "p" },
	]);
	const res = await gradeCell({ rubric: r, io, judgeVerdicts: { j: "pass" }, meta: META });
	const vr = projectVerdictRecord(res, {
		usage: { input: 10, output: 20, cost: 30, turns: 40 },
		elapsedMs: 500,
		stopReason: "stop",
	});
	expect(vr.gradedBy).toBe(res.scoredUnder);
	expect(vr.gradingUsage).toEqual({ input: 10, output: 20, cost: 30, elapsedMs: 500, stopReason: "stop" });
	expect(vr.perCriterion.map((c) => c.criterionId)).toEqual(["j"]); // judge criteria only
});

// --- 10.8 totality ---

test("totality: every accepted check is graded; the sole GradeIO-independent throw is a missing judge verdict", async () => {
	const io = new FakeIO();
	io.files.set("a", "token here");
	io.jobs.set("facilitator", "done");
	io.runResponses = [{ exitCode: 0, stdout: "ok" }];
	const r = rub([
		{ id: "g1", type: "gate", check: { kind: "gates", argv: ["x"], expect: { exitCode: 0, stdoutContains: "ok" } } },
		{ id: "g2", type: "gate", check: { kind: "artifact-present", path: "a" } },
		{ id: "g3", type: "gate", check: { kind: "artifact-contains", path: "a", contains: "token" } },
		{ id: "g4", type: "gate", check: { kind: "settled", role: "facilitator" } },
		{ id: "j", type: "judge", prompt: "p" },
	]);
	const res = await gradeCell({ rubric: r, io, judgeVerdicts: { j: "pass" }, meta: META });
	expect(res.perCriterion.length).toBe(5); // every criterion graded
	expect(res.perCriterion.every((c) => c.verdict === "pass")).toBe(true);
	// and the missing-judge case throws
	await expect(gradeCell({ rubric: r, io, judgeVerdicts: {}, meta: META })).rejects.toThrow();
});

// --- 10.9 purity probe ---

test("purity: eval-rubric.ts touches no node:fs / child_process; identical input twice -> identical output", async () => {
	const src = await Bun.file(new URL("../extensions/eval-rubric.ts", import.meta.url).pathname).text();
	// never *imports* or *requires* fs / child_process (the doc comment may mention them; code must not)
	expect(src).not.toContain('from "node:');
	expect(src).not.toContain('from \'node:');
	expect(src).not.toContain('require("node:');
	expect(src).not.toContain("crypto");

	const mk = () => {
		const io = new FakeIO();
		io.files.set("a", "1");
		return io;
	};
	const r = rub([{ id: "c1", type: "gate", check: { kind: "artifact-present", path: "a" } }]);
	const a = await gradeCell({ rubric: r, io: mk(), judgeVerdicts: {}, meta: META });
	const b = await gradeCell({ rubric: r, io: mk(), judgeVerdicts: {}, meta: META });
	expect(a).toEqual(b);
});

// --- 10.10 C3: validateRubric is imported, not re-derived ---

test("C3: the scorer imports validateRubric from eval-fixtures and re-defines no rubric validator", async () => {
	const src = await Bun.file(new URL("../extensions/eval-rubric.ts", import.meta.url).pathname).text();
	expect(src).toContain('from "./eval-fixtures.ts"');
	// no second validator: no local function that re-derives rubric schema validation
	expect(src.match(/function\s+validateRubric/g)).toBeNull();
});
