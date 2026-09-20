/**
 * FLLWUP-43 — the goal field is a lossless oracle for the judge.
 *
 * T1–T8 per docs/superpowers/specs/2026-09-17-FLLWUP-43-design.md §5.
 * T1 is the card's core red-first test (a colon-space goal must validate);
 * T2 pins the parser identity (green before the change — the ban, not the
 * parser, was the lossiness); T3 pins byte-parity across root ↔ scaffold ↔
 * 8 seeds; T4 pins the key-separator negative; T5 pins digest + version
 * discipline; T6 is the engine-testable prefix of the judge-reads leg;
 * T7 pins the documented wrap residual (a line break ends the value —
 * product-owner R1: no wrap-FAIL ships in this change) — **flipped by
 * FLLWUP-51**: the loader now refuses the wrap (parse raises, validate
 * exits 1); T8 is the
 * engine-testable prefix of the R4 single-cell smoke (the live judge
 * dispatch on board-create-card is the council-runner's verification step,
 * not a bun:test call — ESC-1 residual).
 */
import { test, expect } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { PKG_ROOT } from "../extensions/seats.ts";
import { PROVIDER_FINISH_REASON_ERROR } from "../extensions/retry.ts";
import { sha256Tree } from "../extensions/eval-fixtures.ts";

const LITERAL = PROVIDER_FINISH_REASON_ERROR; // "Provider finish_reason: error"
const TASKS = [
	"board-create-card",
	"council",
	"council-runner",
	"features-deliver",
	"features-new",
	"owner",
	"wiki-ingest",
	"wiki-lint",
] as const;

function sha256File(p: string): string {
	return createHash("sha256").update(fs.readFileSync(p)).digest("hex");
}

/**
 * Temp council tree: validate.py copied byte-identically from the repo, a
 * minimal board, and one card whose frontmatter carries `goalLines` verbatim
 * (so a wrap can be expressed as two physical lines for T7).
 */
function councilTree(...goalLines: string[]): string {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "fllwup43-"));
	fs.mkdirSync(path.join(root, "council", "cards"), { recursive: true });
	fs.copyFileSync(
		path.join(PKG_ROOT, "council", "validate.py"),
		path.join(root, "council", "validate.py"),
	);
	const card = [
		"---",
		"id: EV-901",
		"title: Test card",
		"state: Backlog",
		"owner: null",
		"epic: null",
		...goalLines,
		"---",
		"",
		"## Intent",
		"",
		"minimal",
		"",
		"## Acceptance",
		"",
		"minimal",
		"",
	].join("\n");
	fs.writeFileSync(path.join(root, "council", "cards", "EV-901.md"), card);
	fs.writeFileSync(
		path.join(root, "council", "board.md"),
		"# Board\n\n## Backlog\n\n- EV-901 — Test card\n",
	);
	return root;
}

function runValidate(root: string): { status: number; stdout: string } {
	const res = spawnSync("python3", [path.join(root, "council", "validate.py")], {
		encoding: "utf-8",
	});
	return { status: res.status ?? -1, stdout: res.stdout ?? "" };
}

/** Parse `goal` from a frontmatter blob via the repo's validate.py. */
function parseGoal(fmText: string): string {
	const script = [
		"import importlib.util, json, sys",
		'spec = importlib.util.spec_from_file_location("v", sys.argv[1])',
		"m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)",
		'print(json.dumps(m.parse_frontmatter(sys.argv[2]).get("goal")))',
	].join("\n");
	const res = spawnSync(
		"python3",
		["-c", script, path.join(PKG_ROOT, "council", "validate.py"), fmText],
		{ encoding: "utf-8" },
	);
	if (res.status !== 0) throw new Error(`parse_frontmatter harness failed: ${res.stderr}`);
	return JSON.parse(res.stdout);
}

// ---- T1 (red-first): the card's core — a colon-space goal validates clean ----

test("T1: a goal naming `Provider finish_reason: error` validates clean (lossless oracle)", () => {
	const root = councilTree(
		"goal: classifyRetry retries when the message is Provider finish_reason: error.",
	);
	const { status, stdout } = runValidate(root);
	expect(status).toBe(0);
	expect(stdout).toContain("All council artifacts valid");
});

// ---- T2 (green today, pins it): parser identity, trim-aware ----

test("T2: parse_frontmatter round-trips a single-line value with `: ` and a bare `:`", () => {
	const full = "Retry when the message says Rate limited: try again later";
	expect(parseGoal(`---\ngoal: ${full}\n---\n`)).toBe(full);
	expect(parseGoal("---\ngoal: a:b\n---\n")).toBe("a:b");
});

test("T2b: parse_frontmatter trims edge whitespace (Skeptic O1 — not byte-for-byte)", () => {
	expect(parseGoal("---\ngoal:  padded  \n---\n")).toBe("padded");
});

// ---- T3 (parity guard): byte-equality across root ↔ scaffold ↔ 8 seeds ----

test("T3: all 10 validate.py copies are byte-identical", () => {
	const paths = [
		path.join(PKG_ROOT, "council", "validate.py"),
		path.join(PKG_ROOT, "council", "scaffold", "council", "validate.py"),
		...TASKS.map((t) =>
			path.join(PKG_ROOT, "council", "fixtures", t, "seed", "council", "validate.py"),
		),
	];
	const digests = paths.map(sha256File);
	expect(new Set(digests).size).toBe(1);
});

test("T3b: all 10 _template.md copies are byte-identical", () => {
	const paths = [
		path.join(PKG_ROOT, "council", "cards", "_template.md"),
		path.join(PKG_ROOT, "council", "scaffold", "council", "cards", "_template.md"),
		...TASKS.map((t) =>
			path.join(PKG_ROOT, "council", "fixtures", t, "seed", "council", "cards", "_template.md"),
		),
	];
	const digests = paths.map(sha256File);
	expect(new Set(digests).size).toBe(1);
});

// ---- T4 (negative survives): the key separator rule is untouched ----

test("T4: `goal:no-space-after-key` still FAILs `missing required key 'goal'`", () => {
	const root = councilTree("goal:no-space-after-key");
	const { status, stdout } = runValidate(root);
	expect(status).toBe(1);
	expect(stdout).toContain("missing required key 'goal'");
});

// ---- T5 (digest + version discipline) ----

test("T5: the 8 seeded fixtures pin the updated seed digest and carry fixtureVersion 1.3.0", () => {
	for (const task of TASKS) {
		const dir = path.join(PKG_ROOT, "council", "fixtures", task);
		const fixture = JSON.parse(fs.readFileSync(path.join(dir, "fixture.json"), "utf-8"));
		expect(fixture.fixtureVersion, `${task} fixtureVersion`).toBe("1.3.0");
		expect(fixture.seed.treeDigest, `${task} treeDigest`).toBe(sha256Tree(path.join(dir, "seed")));
	}
});

test("T5b: board-create-card rubricVersion is bumped to 1.1.0 with the rewritten c3", () => {
	const rubric = JSON.parse(
		fs.readFileSync(path.join(PKG_ROOT, "council", "fixtures", "board-create-card", "rubric.json"), "utf-8"),
	);
	expect(rubric.rubricVersion).toBe("1.1.0");
});

// ---- T6 (conjunct-B engine-testable prefix): card → parse_frontmatter → literal ----

test("T6: a treatment card's parsed goal carries PROVIDER_FINISH_REASON_ERROR; a colon-free control does not", () => {
	const treatment = parseGoal(
		"---\ngoal: classifyRetry retries when the message is Provider finish_reason: error.\n---\n",
	);
	const control = parseGoal(
		"---\ngoal: classifyRetry retries when the message is Provider finish_reason error.\n---\n",
	);
	expect(treatment.includes(LITERAL)).toBe(true);
	expect(control.includes(LITERAL)).toBe(false);
});

// ---- T7 (flipped by FLLWUP-51: the wrap is now refused — the loud gate) ----

test("T7: a wrapped goal is refused — parse raises, validate exits 1 (FLLWUP-51)", () => {
	// parse refuses: the loader raises, it never returns the truncated first line
	expect(() => parseGoal("---\ngoal: first part\n second part\n---\n")).toThrow();
	const root = councilTree("goal: first part", " second part");
	// validate refuses with a named structural FAIL (R1 in test/fllwup51-gate.test.ts)
	const { status, stdout } = runValidate(root);
	expect(status).toBe(1);
	expect(stdout).toContain("FAIL: EV-901:");
});

// ---- T8 (rubric smoke, engine-testable prefix per product-owner R4) ----

test("T8: the rewritten c3 prompt is the settled copy, and the treatment/control pair discriminates on the literal", () => {
	const rubric = JSON.parse(
		fs.readFileSync(path.join(PKG_ROOT, "council", "fixtures", "board-create-card", "rubric.json"), "utf-8"),
	);
	const c3 = rubric.criteria.find((c: { id: string }) => c.id === "c3");
	expect(c3.prompt).toBe(
		"Grade the new board card this run wrote for the pinned intent (Add a --limit flag to the links CLI): " +
			"does it follow council/cards/_template.md — a single-line, literal-exact testable goal (colons allowed in the value), " +
			"an Intent section, and an Acceptance section? Name the card id and quote the goal.",
	);
	// treatment: goal contains `: ` and the literal → legal, and the literal survives the parse
	const treatment = parseGoal("---\ngoal: retry on Provider finish_reason: error.\n---\n");
	expect(treatment).toBe("retry on Provider finish_reason: error.");
	// control: colon-free paraphrase of the same literal → equally legal now (the
	// ban is gone), but the parse exposes that the literal is not spelled — the
	// discrimination c3's "quote the goal" grading relies on. The live judge
	// dispatch over this pair is the council-runner's verification step (ESC-1
	// residual), not a bun:test call.
	const control = parseGoal("---\ngoal: retry on Provider finish_reason error.\n---\n");
	expect(control.includes(LITERAL)).toBe(false);
});
