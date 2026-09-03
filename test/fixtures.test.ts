/**
 * EV-18 — shipped benchmark fixtures + loader.
 *
 * This file covers spec §8 items 1, 4, 5, 9 (QA) with self-contained synthetic
 * fixtures (repo-side override dirs in mkdtemp repos — no shipped data needed)
 * plus the pure-engine tests (applyRulings decision table, sha256Tree
 * determinism). The packaged-data assertions (items 2, 6, 7, 8, 10, 11) live
 * in the same file below the synthetic block.
 */
import { test, expect } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { spawnSync } from "node:child_process";
import { CONFIG_DIR_NAME } from "@earendil-works/pi-coding-agent";
import { applyRulings, loadFixture, listFixtureTasks, sha256Tree, validatePolicy, type PolicyGate } from "../extensions/eval-fixtures.ts";
import { PKG_ROOT, loadSeat, parseQualifiedModel } from "../extensions/seats.ts";

function tmpRepo(): string {
	return fs.mkdtempSync(path.join(os.tmpdir(), "council-fixtures-"));
}

const MINIMAL_FIXTURE: Record<string, unknown> = {
	schemaVersion: 1,
	taskId: "x",
	name: "synthetic fixture",
	fixtureVersion: "1.0.0",
	kind: "procedure",
	target: { type: "procedure", command: "/wiki-query", arguments: ["is the wiki indexed?"] },
	seed: { dir: "seed", treeDigest: "sha256:0000000000000000000000000000000000000000000000000000000000000000" },
	policy: { gates: [] },
	graderModel: "openrouter/qwen/qwen3.6-35b-a3b:medium",
};

const MINIMAL_RUBRIC: Record<string, unknown> = {
	schemaVersion: 1,
	rubricVersion: "1.0.0",
	criteria: [{ id: "c1", type: "gate", check: { kind: "artifact-present", path: "a.md" } }],
};

function writeSyntheticFixture(
	root: string,
	taskId: string,
	opts: {
		fixture?: Record<string, unknown>;
		rubric?: Record<string, unknown> | null;
		seedFiles?: Record<string, string>;
		symlink?: string;
	} = {},
): string {
	const dir = path.join(root, CONFIG_DIR_NAME, "council", "fixtures", taskId);
	fs.mkdirSync(path.join(dir, "seed"), { recursive: true });
	const fixture = opts.fixture ?? { ...MINIMAL_FIXTURE, taskId };
	fs.writeFileSync(path.join(dir, "fixture.json"), JSON.stringify(fixture, null, 2));
	if (opts.rubric !== null) {
		fs.writeFileSync(path.join(dir, "rubric.json"), JSON.stringify(opts.rubric ?? MINIMAL_RUBRIC, null, 2));
	}
	for (const [rel, content] of Object.entries(opts.seedFiles ?? {})) {
		const f = path.join(dir, "seed", rel);
		fs.mkdirSync(path.dirname(f), { recursive: true });
		fs.writeFileSync(f, content);
	}
	if (opts.symlink) fs.symlinkSync(opts.symlink, path.join(dir, "seed", path.basename(opts.symlink)));
	return dir;
}

// ================= Q1 — seed forbid-list (model-floors.json joins the list) =================

test("Q1: a seed smuggling .pi/council/model-floors.json fails loadFixture naming the file", () => {
	const root = tmpRepo();
	writeSyntheticFixture(root, "x", {
		seedFiles: { ".pi/council/model-floors.json": '{"a/b": 123}' },
	});
	expect(() => loadFixture(root, "x")).toThrow(/model-floors\.json/);
});

test("Q1: a seed with model-floors.json at any other path in the tree fails too", () => {
	const root = tmpRepo();
	writeSyntheticFixture(root, "x", {
		seedFiles: { "vendor/model-floors.json": '{"a/b": 123}' },
	});
	expect(() => loadFixture(root, "x")).toThrow(/model-floors\.json/);
});

test("Q1: the shipped PKG_ROOT/council/model-floors.json (outside any seed) never trips the check", () => {
	const root = tmpRepo();
	writeSyntheticFixture(root, "x", { seedFiles: { "a.txt": "plain" } });
	expect(fs.existsSync(path.join(PKG_ROOT, "council", "model-floors.json"))).toBe(true);
	expect(loadFixture(root, "x").fixture.taskId).toBe("x");
});

test("Q1: .council.json with a named model fails load; theme-only .council.json passes", () => {
	const root = tmpRepo();
	writeSyntheticFixture(root, "x", {
		seedFiles: { ".council.json": JSON.stringify({ council: { owner: "openrouter/deepseek/x" } }) },
	});
	expect(() => loadFixture(root, "x")).toThrow(/\.council\.json/);
	const root2 = tmpRepo();
	writeSyntheticFixture(root2, "x", {
		seedFiles: { ".council.json": JSON.stringify({ theme: { enabled: true, variant: "auto" } }) },
	});
	expect(loadFixture(root2, "x").fixture.taskId).toBe("x");
});

test("Q1: non-empty mcp.json fails load; empty {\"servers\":{}} passes", () => {
	const root = tmpRepo();
	writeSyntheticFixture(root, "x", {
		seedFiles: { ".pi/council/mcp.json": JSON.stringify({ servers: { context7: { url: "x" } } }) },
	});
	expect(() => loadFixture(root, "x")).toThrow(/mcp\.json/);
	const root2 = tmpRepo();
	writeSyntheticFixture(root2, "x", { seedFiles: { ".pi/council/mcp.json": '{"servers": {}}' } });
	expect(loadFixture(root2, "x").fixture.taskId).toBe("x");
});

test("Q1: .env, node_modules/, .pi/git/, .pi/npm/, and symlinks all fail load", () => {
	for (const [file, why] of [
		[ ".env", ".env" ],
		[ "node_modules/pkg/index.js", "node_modules" ],
		[ ".pi/git/x/repo", "git/" ],
		[ ".pi/npm/x/y", "npm/" ],
	] as Array<[string, string]>) {
		const root = tmpRepo();
		writeSyntheticFixture(root, "x", { seedFiles: { [file]: "junk" } });
		expect(() => loadFixture(root, "x")).toThrow(new RegExp(why.replace(/[./]/g, "\\$&")));
	}
	const root = tmpRepo();
	writeSyntheticFixture(root, "x", { seedFiles: { "real.txt": "t" }, symlink: "dangling-link.txt" });
	expect(() => loadFixture(root, "x")).toThrow(/symlink/);
});

// ================= C3 — a fixture without its rubric fails loudly =================

test("C3: a fixture dir with fixture.json but no rubric.json throws naming the file", () => {
	const root = tmpRepo();
	writeSyntheticFixture(root, "x", { rubric: null });
	expect(() => loadFixture(root, "x")).toThrow(/rubric\.json/);
	expect(() => loadFixture(root, "x")).not.toThrow(/\[/); // never a silent empty result
});

// ================= loader resolution + self-description =================

test("loadFixture: unknown task, taskId/dirname mismatch, and missing seed dir all throw", () => {
	const root = tmpRepo();
	expect(() => loadFixture(root, "nope")).toThrow(/Unknown fixture task "nope"/);
	writeSyntheticFixture(root, "x", { fixture: { ...MINIMAL_FIXTURE, taskId: "aaa" } });
	expect(() => loadFixture(root, "x")).toThrow(/does not match directory name/);
	const root2 = tmpRepo();
	writeSyntheticFixture(root2, "x", {
		fixture: { ...MINIMAL_FIXTURE, seed: { dir: "missing", treeDigest: "sha256:0000000000000000000000000000000000000000000000000000000000000000" } },
	});
	expect(() => loadFixture(root2, "x")).toThrow(/seed/);
});

test("loadFixture: procedure command must be one of the 7 shipped procedures", () => {
	const root = tmpRepo();
	writeSyntheticFixture(root, "x", {
		fixture: { ...MINIMAL_FIXTURE, target: { type: "procedure", command: "/not-a-procedure", arguments: [] } },
	});
	expect(() => loadFixture(root, "x")).toThrow(/not one of the shipped procedures/);
});

test("loadFixture: seat kind requires inputFile present on disk and a resolvable seat", () => {
	const root = tmpRepo();
	writeSyntheticFixture(root, "x", {
		fixture: { ...MINIMAL_FIXTURE, kind: "seat", target: { type: "seat", seat: "judge" } },
	});
	expect(() => loadFixture(root, "x")).toThrow(/inputFile/);
	writeSyntheticFixture(root, "y", {
		fixture: { ...MINIMAL_FIXTURE, taskId: "y", kind: "seat", target: { type: "seat", seat: "judge" }, inputFile: "input.md" },
	});
	expect(() => loadFixture(root, "y")).toThrow(/input\.md/);
	const root2 = tmpRepo();
	writeSyntheticFixture(root2, "z", {
		fixture: { ...MINIMAL_FIXTURE, taskId: "z", kind: "seat", target: { type: "seat", seat: "judge" }, inputFile: "input.md" },
		seedFiles: { "a.md": "seed" },
	});
	fs.writeFileSync(path.join(root2, CONFIG_DIR_NAME, "council", "fixtures", "z", "input.md"), "turn");
	expect(loadFixture(root2, "z").fixture.inputFile).toBe("input.md");
	writeSyntheticFixture(root2, "w", {
		fixture: { ...MINIMAL_FIXTURE, taskId: "w", kind: "seat", target: { type: "seat", seat: "no-such-seat" }, inputFile: "input.md" },
		seedFiles: { "input.md": "turn" },
	});
	expect(() => loadFixture(root2, "w")).toThrow(/does not resolve/);
});

test("loadFixture: repo-side directory resolves as override and is read-only over repoRoot", () => {
	const root = tmpRepo();
	const dir = writeSyntheticFixture(root, "x", {
		fixture: { ...MINIMAL_FIXTURE, name: "OVERRIDE MARKER" },
		seedFiles: { "a.md": "seed content" },
	});
	const before = fs.readdirSync(root, { recursive: true }).map(String).sort().join("\n");
	const loaded = loadFixture(root, "x");
	expect(loaded.source).toBe("override");
	expect(loaded.fixture.name).toBe("OVERRIDE MARKER");
	expect(loaded.seedDir).toBe(path.join(dir, "seed"));
	const after = fs.readdirSync(root, { recursive: true }).map(String).sort().join("\n");
	expect(after).toBe(before);
});

test("listFixtureTasks: validates self-description and unions repo-side ids with the packaged 16", () => {
	const root = tmpRepo();
	writeSyntheticFixture(root, "b-task", { fixture: { ...MINIMAL_FIXTURE, taskId: "b-task" } });
	writeSyntheticFixture(root, "a-task", { fixture: { ...MINIMAL_FIXTURE, taskId: "a-task" } });
	const all = listFixtureTasks(root);
	expect(all.slice(0, 2)).toEqual(["a-task", "b-task"]);
	expect(all).toEqual(ALL_TASKS_UNION);
	const root2 = tmpRepo();
	writeSyntheticFixture(root2, "z", { fixture: { ...MINIMAL_FIXTURE, taskId: "zz" } });
	expect(() => listFixtureTasks(root2)).toThrow(/does not match directory name/);
});

test("$args[N] expands from target.arguments into policy conditions at load", () => {
	const root = tmpRepo();
	writeSyntheticFixture(root, "x", {
		fixture: {
			...MINIMAL_FIXTURE,
			target: { type: "procedure", command: "/council", arguments: ["EV-1"] },
			policy: {
				gates: [
					{
						id: "merge-gate",
						humanStep: 11,
						when: [{ kind: "board-column", cardId: "$args[0]", notIn: ["Needs Human"] }],
						verdict: "approve",
						then: "merge",
					},
				],
			},
		},
	});
	const gates = loadFixture(root, "x").fixture.policy.gates;
	expect(JSON.stringify(gates)).not.toContain("$args");
	expect(gates[0].when[0]).toEqual({ kind: "board-column", cardId: "EV-1", notIn: ["Needs Human"] });
});

// ================= A4 — applyRulings is pure with a pinned decision table =================

const DT_POLICY: { gates: PolicyGate[] } = {
	gates: [
		{
			id: "g-approve",
			humanStep: 11,
			when: [
				{ kind: "job-state", role: "owner", state: "done" },
				{ kind: "job-state", role: "skeptic", state: "done" },
				{ kind: "report-contains", role: "judge", token: "PASS" },
				{ kind: "board-column", cardId: "EV-1", notIn: ["Needs Human"] },
				{ kind: "file-exists", path: "docs/spec.md" },
			],
			verdict: "approve",
			then: "merge",
		},
		{
			id: "g-board-in",
			humanStep: 1,
			when: [{ kind: "board-column", cardId: "EV-2", in: ["Ready", "Deliberating"] }],
			verdict: "approve",
		},
		{
			id: "g-negate",
			humanStep: 1,
			when: [
				{ kind: "file-exists", path: "blocking.txt", negate: true },
				{ kind: "file-contains", path: "a.md", token: "implemented" },
			],
			verdict: "approve",
		},
		{
			id: "g-answer",
			humanStep: 1,
			when: [],
			verdict: "answer",
			answerText: "proceed with the pinned rulings",
		},
		{
			id: "g-hold",
			humanStep: 1,
			when: [{ kind: "report-contains", role: "judge", token: "REJECT" }],
			verdict: "approve",
		},
	],
};

const DT_STATE = {
	jobs: { owner: "done", skeptic: "done" },
	reports: { judge: "score 0.9 — PASS" },
	board: { "EV-1": ["Deliberating"], "EV-2": ["Ready"] },
	files: { "docs/spec.md": "…", "a.md": "implemented" },
};

test("A4: applyRulings is pure — identical policy + state yields identical verdicts twice", () => {
	const a = applyRulings(DT_POLICY, DT_STATE);
	const b = applyRulings(DT_POLICY, DT_STATE);
	expect(a).toEqual(b);
	expect(JSON.stringify(a)).toBe(JSON.stringify(b));
});

test("A4: decision table pins approve / hold / answer semantics (incl. negate and board-column in/notIn)", () => {
	const verdicts = applyRulings(DT_POLICY, DT_STATE);
	const byId = Object.fromEntries(verdicts.map((v) => [v.gateId, v]));
	expect(byId["g-approve"].verdict).toBe("approve");
	expect(byId["g-board-in"].verdict).toBe("approve");
	expect(byId["g-negate"].verdict).toBe("approve"); // blocking.txt absent + negate
	expect(byId["g-answer"]).toEqual({ gateId: "g-answer", verdict: "answer", answerText: "proceed with the pinned rulings" });
	expect(byId["g-hold"].verdict).toBe("hold"); // judge report has PASS, not REJECT

	// EV-1 moves to Needs Human → the merge gate holds; EV-2 leaves Ready → g-board-in holds too
	const moved = {
		jobs: { owner: "done", skeptic: "done" },
		reports: { judge: "PASS" },
		board: { "EV-1": ["Needs Human"], "EV-2": ["Done"] },
		files: { "docs/spec.md": "…", "a.md": "implemented" },
	};
	const movedVerdicts = Object.fromEntries(applyRulings(DT_POLICY, moved).map((v) => [v.gateId, v]));
	expect(movedVerdicts["g-approve"].verdict).toBe("hold");
	expect(movedVerdicts["g-board-in"].verdict).toBe("hold");
	expect(movedVerdicts["g-answer"].verdict).toBe("answer");
});

// ================= sha256Tree determinism (Q2 fixture half) =================

test("sha256Tree: deterministic, and LF vs CRLF byte streams differ in digest", () => {
	const a = tmpRepo();
	const b = tmpRepo();
	fs.writeFileSync(path.join(a, "a.txt"), "line1\nline2\n");
	fs.writeFileSync(path.join(b, "a.txt"), "line1\r\nline2\r\n");
	expect(sha256Tree(a)).toBe(sha256Tree(a));
	expect(sha256Tree(a)).toMatch(/^sha256:[0-9a-f]{64}$/);
	expect(sha256Tree(a)).not.toBe(sha256Tree(b));
});

// ================= validatePolicy strictness =================

test("validatePolicy: unknown keys/kinds/verdicts, bad then-vocab, and answerText rules all throw", () => {
	const file = "fixture.json";
	const ok = () => validatePolicy({ gates: [] }, file);
	expect(ok()).toEqual([]);
	expect(() => validatePolicy({ gates: [{ id: "a", humanStep: 1, when: [], verdict: "approve" }] }, file)).not.toThrow();
	expect(() => validatePolicy({ gates: [{ id: "a", humanStep: 1, when: [], verdict: "maybe" }] }, file)).toThrow(/verdict/);
	expect(() => validatePolicy({ gates: [{ id: "a", humanStep: 1, when: [], verdict: "answer" }] }, file)).toThrow(/answerText/);
	expect(() =>
		validatePolicy({ gates: [{ id: "a", humanStep: 1, when: [], verdict: "answer", answerText: "x", then: "explode" }] }, file),
	).toThrow(/then/);
	expect(() =>
		validatePolicy({ gates: [{ id: "a", humanStep: 1, when: [{ kind: "teleport", path: "x" }], verdict: "approve" }] }, file),
	).toThrow(/teleport/);
	expect(() =>
		validatePolicy({ gates: [{ id: "a", humanStep: 1, when: [{ kind: "board-column", cardId: "EV-1", in: ["a"], notIn: ["b"] }], verdict: "approve" }] }, file),
	).toThrow(/notIn/);
	expect(() =>
		validatePolicy({ gates: [{ id: "a", humanStep: 1, when: [{ kind: "job-state", role: "o", state: "merged" }], verdict: "approve" }] }, file),
	).toThrow(/merged/);
	expect(() => validatePolicy({ gates: [{ id: "a", humanStep: 1, when: [], verdict: "approve", bogus: 1 }] }, file)).toThrow(/bogus/);
});

// ================= shipped-data suite (packaged fixtures under PKG_ROOT) =================

const PROC_TASKS = [
	"board-create-card",
	"council",
	"features-deliver",
	"features-new",
	"wiki-ingest",
	"wiki-lint",
	"wiki-query",
];
const SEAT_TASKS = [
	"consolidator",
	"council-runner",
	"designer",
	"judge",
	"owner",
	"principal",
	"product-owner",
	"skeptic",
	"steward",
];
const ALL_TASKS = [...PROC_TASKS, ...SEAT_TASKS].sort();
const ALL_TASKS_UNION = ["a-task", "b-task", ...ALL_TASKS].sort();

function readFixtureJson(task: string): string {
	return fs.readFileSync(path.join(PKG_ROOT, "council", "fixtures", task, "fixture.json"), "utf-8");
}

function readRubricJson(task: string): string {
	return fs.readFileSync(path.join(PKG_ROOT, "council", "fixtures", task, "rubric.json"), "utf-8");
}

test("item 6: listFixtureTasks(PKG_ROOT) returns exactly the 16 shipped ids in sorted order", () => {
	expect(listFixtureTasks(PKG_ROOT)).toEqual(ALL_TASKS);
});

test("item 6: every fixture loads clean — schema, rubric present, digest self-check, taskId == dirname", () => {
	for (const task of ALL_TASKS) {
		const loaded = loadFixture(PKG_ROOT, task);
		expect(loaded.source).toBe("packaged");
		expect(loaded.fixture.taskId).toBe(task);
		expect(loaded.fixture.schemaVersion).toBe(1);
		expect(loaded.fixture.seed.treeDigest).toMatch(/^sha256:[0-9a-f]{64}$/);
		expect(loaded.rubric.criteria.length).toBeGreaterThanOrEqual(1);
		expect(loaded.rubric.criteria.length).toBeLessThanOrEqual(5);
	}
});

test("item 6: procedure fixtures reference real shipped commands; seat fixtures resolve via loadSeat + pin inputFile", () => {
	const shipped = new Set(PROC_TASKS);
	for (const task of PROC_TASKS) {
		const f = loadFixture(PKG_ROOT, task).fixture;
		expect(f.kind).toBe("procedure");
		expect(f.target.type).toBe("procedure");
		if (f.target.type === "procedure") expect(shipped.has(f.target.command.slice(1))).toBe(true);
		expect(f.inputFile).toBeUndefined();
	}
	for (const task of SEAT_TASKS) {
		const f = loadFixture(PKG_ROOT, task).fixture;
		expect(f.kind).toBe("seat");
		expect(f.target.type).toBe("seat");
		expect(f.inputFile).toBeDefined();
		if (f.target.type === "seat") expect(loadSeat(PKG_ROOT, f.target.seat).name).toBe(f.target.seat);
	}
});

test("item 7: determinism (A1 fixture half) — every shipped seed recomputes to its pinned treeDigest", () => {
	for (const task of ALL_TASKS) {
		const loaded = loadFixture(PKG_ROOT, task);
		expect(sha256Tree(loaded.seedDir)).toBe(loaded.fixture.seed.treeDigest);
	}
});

test("item 8: no network-dependent state — no http(s):// in fixture/rubric JSON; rubric gate argv never calls gh/mcp/curl/wget", () => {
	for (const task of ALL_TASKS) {
		expect(readFixtureJson(task)).not.toMatch(/https?:\/\//);
		expect(readRubricJson(task)).not.toMatch(/https?:\/\//);
		const loaded = loadFixture(PKG_ROOT, task);
		for (const c of loaded.rubric.criteria) {
			if (c.type !== "gate" || c.check.kind !== "gates") continue;
			for (const arg of c.check.argv) {
				expect(arg).not.toMatch(/^(gh|mcp|curl|wget)$/);
			}
		}
	}
});

test("item 10: graderModel grammar — all 16 parse via parseQualifiedModel; a bare id and an unknown suffix fail load", () => {
	for (const task of ALL_TASKS) {
		const f = loadFixture(PKG_ROOT, task).fixture;
		expect(() => parseQualifiedModel(f.graderModel, "check")).not.toThrow();
	}
	const root = tmpRepo();
	writeSyntheticFixture(root, "x", { fixture: { ...MINIMAL_FIXTURE, graderModel: "qwen3.6-35b" } });
	expect(() => loadFixture(root, "x")).toThrow(/must be qualified/);
	const root2 = tmpRepo();
	writeSyntheticFixture(root2, "x", { fixture: { ...MINIMAL_FIXTURE, graderModel: "openrouter/q/q:MediuM" } });
	expect(() => loadFixture(root2, "x")).toThrow(/MediuM/);
});

test("item 2: council/.gitattributes exists and carries the Q2 ruling content", () => {
	const attrs = fs.readFileSync(path.join(PKG_ROOT, "council", ".gitattributes"), "utf-8");
	expect(attrs).toContain("* text=auto eol=lf");
});

test("item 9: shadowing — repo-side task dir wins whole-dir; unoverridden resolves packaged; a repo dir missing its own rubric never falls back", () => {
	const root = tmpRepo();
	writeSyntheticFixture(root, "wiki-query", {
		fixture: { ...MINIMAL_FIXTURE, taskId: "wiki-query", name: "REPO MARKER" },
		seedFiles: { "a.md": "x" },
	});
	const overridden = loadFixture(root, "wiki-query");
	expect(overridden.source).toBe("override");
	expect(overridden.fixture.name).toBe("REPO MARKER");
	expect(loadFixture(root, "council").source).toBe("packaged");
	const tasks = listFixtureTasks(root);
	expect(tasks).toContain("wiki-query");
	expect(tasks).toContain("council");
	expect(tasks.filter((t) => t === "wiki-query")).toHaveLength(1);

	// a repo dir shadowing a packaged task WITHOUT its own rubric fails loudly (C3), never packaged fallback
	const root2 = tmpRepo();
	writeSyntheticFixture(root2, "council", { rubric: null });
	expect(() => loadFixture(root2, "council")).toThrow(/rubric\.json/);
});

test("item 11 (A2): with all 16 fixtures present, python3 council/validate.py exits 0 with the ok marker", () => {
	const res = spawnSync("python3", ["council/validate.py"], { cwd: PKG_ROOT, encoding: "utf-8" });
	expect(res.status).toBe(0);
	expect(res.stdout).toContain("All council artifacts valid");
});