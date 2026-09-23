/**
 * EV-89 — the schema falsifier for the class-enumeration record fence.
 *
 * Spec §8 (docs/superpowers/specs/2026-09-23-EV-89-design.md), FLLWUP-51
 * pattern: temp dir, the packaged `council/validate.py` copied
 * byte-identically, minimal board + card, `spawnSync` python3.
 *
 * Green arms pin the fence's tolerance: the record file absent → exit 0
 * (a consumer repo that never runs /features-deliver stays green), an
 * unresolved entry (neither `ruling` nor `reason`) → exit 0 — the
 * anti-overreach discriminator pinning that the fence never becomes the
 * completeness engine acceptance bullet 4 forbids — and a fully resolved
 * five-class record in stakes order → exit 0.
 *
 * Red arms pin the named-FAIL grammar (each exits 1 with a diagnostic
 * naming the defect, never a traceback): unreadable JSON; `classes` not
 * an array (including a non-object top level); a non-object entry; a
 * missing `class`; a duplicate `class`; both `ruling` and `reason` in one
 * entry; an empty `ruling`; a `reason` without the `n/a: ` prefix (a
 * non-string reason fails the same arm); an unknown `stakes` literal; a
 * non-monotonic `stakes` sequence. The fence knows the three tier
 * literals and nothing else — zero canonical class-name strings.
 */
import { test, expect } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { spawnSync } from "node:child_process";
import { PKG_ROOT } from "../extensions/seats.ts";

const RECORD_RELPATH = path.join("council", "phase1-rulings.json");

/** Temp council tree: validate.py copied byte-identically, a minimal board
 * and card, and the phase1-rulings record written verbatim from `recordText`
 * (null → no record file — the absent→skip arm's exact shape). */
function rulingsTree(recordText: string | null): string {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "ev89-rulings-"));
	fs.mkdirSync(path.join(root, "council", "cards"), { recursive: true });
	fs.copyFileSync(
		path.join(PKG_ROOT, "council", "validate.py"),
		path.join(root, "council", "validate.py"),
	);
	fs.writeFileSync(
		path.join(root, "council", "cards", "EV-901.md"),
		[
			"---",
			"id: EV-901",
			"title: Test card",
			"state: Backlog",
			"owner: null",
			"epic: null",
			"goal: minimal",
			"---",
			"",
			"## Intent",
			"",
			"minimal",
			"",
		].join("\n"),
	);
	fs.writeFileSync(
		path.join(root, "council", "board.md"),
		"# Board\n\n## Backlog\n\n- EV-901 — Test card\n",
	);
	if (recordText !== null) {
		fs.writeFileSync(path.join(root, RECORD_RELPATH), recordText);
	}
	return root;
}

function entry(e: Record<string, unknown>): Record<string, unknown> {
	return e;
}

/** A well-formed five-class record fragment, with per-class overrides. */
function classes(...entries: Array<Record<string, unknown>>): string {
	return JSON.stringify({ classes: entries });
}

function runValidate(root: string): { status: number; stdout: string; stderr: string } {
	const res = spawnSync("python3", [path.join(root, "council", "validate.py")], {
		encoding: "utf-8",
	});
	return { status: res.status ?? -1, stdout: res.stdout ?? "", stderr: res.stderr ?? "" };
}

/** Red-arm assertion: exit 1, a FAIL line naming the record, no traceback. */
function expectNamedFail(root: string, fragment: string): void {
	const { status, stdout, stderr } = runValidate(root);
	expect(status).toBe(1);
	const failLine = stdout.split("\n").find((l) => l.startsWith("FAIL: council/phase1-rulings.json"));
	expect(failLine, `named FAIL line expected, stdout was: ${stdout}`).toBeDefined();
	expect(failLine!).toContain(fragment);
	expect(stderr, "the fence reports named FAILs, never a traceback").not.toContain("Traceback");
}

// ---- Green arms: absent → skip; unresolved → legal; resolved → legal ----

test("G1: no record file → skip, exit 0 (the consumer repo that never runs /features-deliver)", () => {
	const { status, stdout } = runValidate(rulingsTree(null));
	expect(status).toBe(0);
	expect(stdout).toContain("All council artifacts valid");
});

test("G2: an unresolved entry (neither ruling nor reason) stays green — the anti-overreach discriminator", () => {
	const record = classes(
		entry({ class: "surface copy", stakes: "card" }),
		entry({ class: "state and field naming", stakes: "card" }),
		entry({ class: "uncertainty display", stakes: "run-committing" }),
		entry({ class: "error and empty-state text", stakes: "run-committing" }),
		entry({ class: "gate user-visibility", stakes: "portfolio" }),
	);
	const { status, stdout } = runValidate(rulingsTree(record));
	expect(status).toBe(0);
	expect(stdout).toContain("All council artifacts valid");
});

test("G3: a fully resolved five-class record in stakes order validates clean", () => {
	const record = classes(
		entry({ class: "surface copy", stakes: "card", ruling: "Copy is 'Charging'" }),
		entry({ class: "state and field naming", stakes: "card", ruling: "The field is named `status`" }),
		entry({ class: "uncertainty display", stakes: "run-committing", reason: "n/a: the run shows no fetched-data surface this epic" }),
		entry({ class: "error and empty-state text", stakes: "run-committing", ruling: "Empty state reads 'Nothing to show yet'" }),
		entry({ class: "gate user-visibility", stakes: "portfolio", ruling: "The gate verdict is shown to the human" }),
	);
	const { status, stdout } = runValidate(rulingsTree(record));
	expect(status).toBe(0);
	expect(stdout).toContain("All council artifacts valid");
});

// ---- Red arms: each exits 1 with a named diagnostic, never a traceback ----

test("R1: unreadable JSON → named FAIL", () => {
	expectNamedFail(rulingsTree('{"classes": ['), "is not readable JSON");
});

test("R2: `classes` not an array → named FAIL (a non-object top level hits the same arm)", () => {
	expectNamedFail(rulingsTree(JSON.stringify({ classes: "surface copy" })), "no `classes` array");
	expectNamedFail(rulingsTree("[1, 2]"), "no `classes` array");
	expectNamedFail(rulingsTree("42"), "no `classes` array");
});

test("R3: a non-object entry → named FAIL (O2 remedy: today a 42 entry tracebacks)", () => {
	expectNamedFail(rulingsTree(classes(entry(42))), "is not an object");
});

test("R4: an entry missing `class` → named FAIL", () => {
	expectNamedFail(
		rulingsTree(classes(entry({ stakes: "card", ruling: "x" }))),
		"has no `class`",
	);
});

test("R5: a duplicate `class` → named FAIL (order intact, duplicate still fires)", () => {
	expectNamedFail(
		rulingsTree(
			classes(
				entry({ class: "surface copy", stakes: "card", ruling: "x" }),
				entry({ class: "uncertainty display", stakes: "run-committing", ruling: "y" }),
				entry({ class: "surface copy", stakes: "portfolio", ruling: "z" }),
			),
		),
		"duplicates class",
	);
});

test("R6: both `ruling` and `reason` in one entry → named FAIL (O2 remedy)", () => {
	expectNamedFail(
		rulingsTree(
			classes(
				entry({ class: "surface copy", stakes: "card", ruling: "x", reason: "n/a: not this epic" }),
			),
		),
		"both `ruling` and `reason`",
	);
});

test("R7: an empty-string `ruling` → named FAIL (O2 remedy)", () => {
	expectNamedFail(
		rulingsTree(classes(entry({ class: "surface copy", stakes: "card", ruling: "" }))),
		"`ruling` is empty",
	);
});

test("R8: a `reason` without the `n/a: ` prefix → named FAIL (a non-string reason fails the same arm)", () => {
	expectNamedFail(
		rulingsTree(classes(entry({ class: "surface copy", stakes: "card", reason: "not relevant" }))),
		"must begin with `n/a: `",
	);
	expectNamedFail(
		rulingsTree(classes(entry({ class: "surface copy", stakes: "card", reason: 42 }))),
		"must begin with `n/a: `",
	);
});

test("R9: an unknown `stakes` literal → named FAIL (snake_case tier names included)", () => {
	expectNamedFail(
		rulingsTree(classes(entry({ class: "surface copy", stakes: "per-card", ruling: "x" }))),
		"not one of",
	);
	expectNamedFail(
		rulingsTree(classes(entry({ class: "surface copy", stakes: "uncertainty_display", ruling: "x" }))),
		"not one of",
	);
});

test("R10: a non-monotonic `stakes` sequence → named FAIL (the ordered array's order is an invariant)", () => {
	expectNamedFail(
		rulingsTree(
			classes(
				entry({ class: "surface copy", stakes: "card", ruling: "x" }),
				entry({ class: "uncertainty display", stakes: "portfolio", ruling: "y" }),
				entry({ class: "gate user-visibility", stakes: "run-committing", ruling: "z" }),
			),
		),
		"not non-decreasing",
	);
});
