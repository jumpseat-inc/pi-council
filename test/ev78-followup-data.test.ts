// EV-78 — the followup disposition data surface: loaders + packaged data +
// fail-loud arms, pinned to their exact FAIL bytes. Fixture pattern follows
// test/gate.test.ts: temp repoRoot via mkdtempSync, packaged resources
// resolve through PKG_ROOT, and every forcing fixture goes through the
// repo-local override path — the packaged files are never edited.
import { test, expect } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { CONFIG_DIR_NAME } from "@earendil-works/pi-coding-agent";
import {
	FOLLOWUP_DISPOSITIONS,
	loadFollowupDecision,
	loadFollowupQuestions,
	loadGateQuestions,
} from "../extensions/gate.ts";

function repoFollowupFile(root: string, name: string, body: unknown): string {
	const dir = path.join(root, CONFIG_DIR_NAME, "council", "gate", "followup");
	fs.mkdirSync(dir, { recursive: true });
	const file = path.join(dir, name);
	fs.writeFileSync(file, typeof body === "string" ? body : JSON.stringify(body, null, "\t"));
	return file;
}

const followupFile = (root: string, name: string) =>
	path.join(root, CONFIG_DIR_NAME, "council", "gate", "followup", name);

function newRoot(): string {
	return fs.mkdtempSync(path.join(os.tmpdir(), "council-ev78-"));
}

/** A valid followup decision policy, mutated per test. Loosely typed so
 * fail-loud fixtures can carry invalid shapes. */
const baseDecision = (): {
	version: string;
	weights: Record<string, number>;
	countedOption: Record<string, string>;
	floors: Record<string, number>;
	noulThreshold: number;
	noulProbabilityOf: string;
	thresholds: Record<string, number>;
	overrides: Record<string, unknown>[];
} => ({
	version: "test-decision-9",
	weights: { duplicate: 1, alreadyDone: 1, actionable: 1 },
	countedOption: { duplicate: "yes", alreadyDone: "yes", actionable: "no" },
	floors: { choice: 0.6 },
	noulThreshold: 0.6,
	noulProbabilityOf: "yes",
	thresholds: { merge: 1, drop: 2 },
	overrides: [],
});

const baseQuestions = () => ({
	version: "test-questions-9",
	questions: {
		distinctive: {
			type: "noul",
			instructions: "Distinctive?",
			criteria: { yes: "y", no: "n" },
		},
	},
});

const FAIL_TAIL = " — set a valid value or remove the key to use the packaged default";

/** Run the named loader on root and pin the exact single-line FAIL bytes. */
function expectFollowupFail(root: string, name: string, body: unknown, key: string, detail: string): void {
	repoFollowupFile(root, name, body);
	let msg = "";
	try {
		(name === "questions.json" ? loadFollowupQuestions : loadFollowupDecision)(root);
	} catch (e) {
		msg = (e as Error).message;
	}
	expect(msg).toBe(`FAIL: ${followupFile(root, name)} has an invalid ${key} — ${detail}${FAIL_TAIL}`);
}

// ---------------------------------------------------------------------------
// 1. Packaged load — absent repo file resolves the packaged files intact.
// ---------------------------------------------------------------------------

test("packaged followup questions load intact from a repo root with no override", () => {
	const qs = loadFollowupQuestions("/nonexistent-repo-root-ev78");
	expect(qs.version).toBe("followup-questions-1");
	expect(Object.keys(qs.questions).sort()).toEqual(["actionable", "alreadyDone", "duplicate"]);
	expect(qs.questions.duplicate.type).toBe("noul");
	expect(qs.questions.alreadyDone.type).toBe("noul");
	expect(qs.questions.actionable.type).toBe("choice");
});

test("packaged followup decision loads intact, thresholds and overrides included", () => {
	const d = loadFollowupDecision("/nonexistent-repo-root-ev78");
	expect(d.version).toBe("followup-decision-1");
	expect(d.weights).toEqual({ duplicate: 1, alreadyDone: 1, actionable: 1 });
	expect(d.countedOption).toEqual({ duplicate: "yes", alreadyDone: "yes", actionable: "no" });
	expect(d.floors).toEqual({ choice: 0.6 });
	expect(d.noulThreshold).toBe(0.6);
	expect(d.noulProbabilityOf).toBe("yes");
	expect(d.thresholds).toEqual({ merge: 1.0, drop: 2.0 });
	expect(d.overrides).toEqual([
		{ question: "alreadyDone", option: "yes", basis: "already resolved or obsolete", disposition: "Drop" },
		{ question: "duplicate", option: "yes", basis: "same work as an open card", disposition: "Merge" },
	]);
});

test("the followup disposition vocabulary is spelled exactly File, Merge, Drop", () => {
	expect(FOLLOWUP_DISPOSITIONS).toEqual(["File", "Merge", "Drop"]);
});

// ---------------------------------------------------------------------------
// 2. First-hit whole-file override — no field merge, per R5.
// ---------------------------------------------------------------------------

test("a repo-local followup questions.json shadows the packaged set whole-file", () => {
	const root = newRoot();
	repoFollowupFile(root, "questions.json", baseQuestions());
	const qs = loadFollowupQuestions(root);
	expect(qs.version).toBe("test-questions-9");
	expect(Object.keys(qs.questions)).toEqual(["distinctive"]);
	expect(qs.questions.duplicate).toBeUndefined();
});

test("a repo-local followup decision.json shadows the packaged policy whole-file", () => {
	const root = newRoot();
	const fixture = {
		...baseDecision(),
		version: "override-decision-9",
		thresholds: { merge: 0.5, drop: 3 },
		overrides: [
			{ question: "duplicate", option: "yes", basis: "same run sibling", disposition: "Merge" },
		],
	};
	repoFollowupFile(root, "decision.json", fixture);
	const d = loadFollowupDecision(root);
	expect(d.version).toBe("override-decision-9");
	expect(d.thresholds).toEqual({ merge: 0.5, drop: 3 });
	expect(d.overrides).toEqual([
		{ question: "duplicate", option: "yes", basis: "same run sibling", disposition: "Merge" },
	]);
});

// ---------------------------------------------------------------------------
// 3. Fail-loud arms — each pinned to its exact FAIL bytes.
// ---------------------------------------------------------------------------

test("malformed followup questions JSON fails as a single line naming the file", () => {
	const root = newRoot();
	repoFollowupFile(root, "questions.json", "{ not json\nwith a newline");
	let msg = "";
	try {
		loadFollowupQuestions(root);
	} catch (e) {
		msg = (e as Error).message;
	}
	expect(msg).not.toMatch(/\n/);
	const esc = root.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	expect(msg).toMatch(
		new RegExp(
			`^FAIL: ${esc}/${CONFIG_DIR_NAME}/council/gate/followup/questions\\.json has an invalid JSON — not parseable as JSON: .+${FAIL_TAIL.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
		),
	);
});

test("malformed followup decision JSON fails as a single line naming the file", () => {
	const root = newRoot();
	repoFollowupFile(root, "decision.json", "{ not json");
	let msg = "";
	try {
		loadFollowupDecision(root);
	} catch (e) {
		msg = (e as Error).message;
	}
	expect(msg).not.toMatch(/\n/);
	expect(msg.startsWith(`FAIL: ${followupFile(root, "decision.json")} has an invalid JSON — not parseable as JSON`)).toBe(true);
	expect(msg.endsWith(FAIL_TAIL)).toBe(true);
});

test("an unknown root key in followup questions.json fails naming the key", () => {
	const root = newRoot();
	expectFollowupFail(root, "questions.json", { version: "v", questions: {}, bogus: 1 }, "bogus", "unknown key; expected one of version, questions");
});

test("a followup policy carrying mechanical hits the unknown-key FAIL — the rename is real, not an alias", () => {
	const root = newRoot();
	const fixture = baseDecision() as Record<string, unknown>;
	fixture.mechanical = { duplicate: "yes" };
	expectFollowupFail(
		root,
		"decision.json",
		fixture,
		"mechanical",
		"unknown key; expected one of version, weights, countedOption, floors, noulThreshold, noulProbabilityOf, thresholds, overrides",
	);
});

test("override disposition 'Delete' fails naming overrides.<i>.disposition", () => {
	const root = newRoot();
	const fixture = baseDecision();
	fixture.overrides = [
		{ question: "duplicate", option: "yes", basis: "b", disposition: "Delete" },
	];
	expectFollowupFail(root, "decision.json", fixture, "overrides.0.disposition", 'expected one of "Merge", "Drop", found "Delete"');
});

test("ruling Q2: override disposition 'File' fails with the expected list exactly \"Merge\", \"Drop\" — the token File is absent", () => {
	const root = newRoot();
	const fixture = baseDecision();
	fixture.overrides = [
		{ question: "duplicate", option: "yes", basis: "b", disposition: "File" },
	];
	const msg = expectFollowupFailBytes(root, fixture);
	expect(msg).toContain('expected one of "Merge", "Drop"');
	expect(msg).not.toContain('"File",');
	expect(msg).toContain("has an invalid overrides.0.disposition");
});

function expectFollowupFailBytes(root: string, fixture: unknown): string {
	repoFollowupFile(root, "decision.json", fixture);
	let msg = "";
	try {
		loadFollowupDecision(root);
	} catch (e) {
		msg = (e as Error).message;
	}
	return msg;
}

test("a missing override disposition fails with the same subject", () => {
	const root = newRoot();
	const fixture = baseDecision();
	fixture.overrides = [{ question: "duplicate", option: "yes", basis: "b" }];
	expectFollowupFail(root, "decision.json", fixture, "overrides.0.disposition", "expected one of \"Merge\", \"Drop\", found undefined");
});

test("ruling Q1: the skeptic's three array exhibits fail on the array-rejection line naming thresholds", () => {
	const exhibits: unknown[][] = [
		[
			{ at: 1.0, disposition: "Drop" },
			{ at: 2.0, disposition: "Merge" },
		],
		[
			{ at: 1.0, disposition: "Merge" },
			{ at: 2.0, disposition: "File" },
		],
		[{ at: 1.0, disposition: "Merge" }],
	];
	for (const thresholds of exhibits) {
		const root = newRoot();
		const fixture = baseDecision();
		(fixture as Record<string, unknown>).thresholds = thresholds;
		expectFollowupFail(root, "decision.json", fixture, "thresholds", "expected an object with merge and drop thresholds");
	}
});

test("ruling Q1: the owner's round-3 schema-sketch array also fails on the array-rejection line", () => {
	const root = newRoot();
	const fixture = baseDecision();
	(fixture as Record<string, unknown>).thresholds = [
		{ at: 1.8, disposition: "Merge" },
		{ at: 2.8, disposition: "Drop" },
	];
	expectFollowupFail(root, "decision.json", fixture, "thresholds", "expected an object with merge and drop thresholds");
});

test("merge 0 fails naming thresholds.merge (merge must be > 0)", () => {
	const root = newRoot();
	const fixture = baseDecision();
	fixture.thresholds = { merge: 0, drop: 2 };
	expectFollowupFail(root, "decision.json", fixture, "thresholds.merge", "expected a finite number > 0, found 0");
});

test("merge == drop fails the strict-ordering arm naming thresholds", () => {
	const root = newRoot();
	const fixture = baseDecision();
	fixture.thresholds = { merge: 1.5, drop: 1.5 };
	expectFollowupFail(root, "decision.json", fixture, "thresholds", "merge must be < drop, found merge 1.5 ≥ drop 1.5");
});

test("an unknown thresholds sub-key fails naming thresholds.<key> with the expected list exactly merge, drop", () => {
	const root = newRoot();
	const fixture = baseDecision();
	fixture.thresholds = { merge: 1, drop: 2, stop: 3 } as Record<string, number>;
	expectFollowupFail(root, "decision.json", fixture, "thresholds.stop", "unknown sub-key; expected one of merge, drop");
});

test("an override whose question id is absent from weights fails the referential arm", () => {
	const root = newRoot();
	const fixture = baseDecision();
	fixture.overrides = [
		{ question: "ghost", option: "yes", basis: "b", disposition: "Merge" },
	];
	expectFollowupFail(root, "decision.json", fixture, "overrides.0.question", 'question id "ghost" is not declared in weights (expected one of duplicate, alreadyDone, actionable)');
});

test("an out-of-range floor fails naming floors.choice", () => {
	const root = newRoot();
	const fixture = baseDecision();
	fixture.floors = { choice: 1.5 };
	expectFollowupFail(root, "decision.json", fixture, "floors.choice", "expected a number in [0, 1], found 1.5");
});

test("an unknown floors sub-key fails naming floors.<key> with the expected list exactly choice", () => {
	const root = newRoot();
	const fixture = baseDecision();
	fixture.floors = { choice: 0.6, score: 0.7 };
	expectFollowupFail(root, "decision.json", fixture, "floors.score", "unknown sub-key; expected one of choice");
});

test("a followup question of type score fails with the expected list exactly \"choice\", \"noul\" (O5)", () => {
	const root = newRoot();
	const fixture = {
		version: "v",
		questions: {
			confidence: {
				type: "score",
				instructions: "How confident?",
				criteria: ["low", "high"],
			},
		},
	};
	expectFollowupFail(root, "questions.json", fixture, "questions.confidence.type", 'expected one of "choice", "noul", found "score"');
});

test("countedOption missing a weighted id fails naming countedOption (O4)", () => {
	const root = newRoot();
	const fixture = baseDecision();
	fixture.countedOption = { duplicate: "yes", alreadyDone: "yes" };
	expectFollowupFail(root, "decision.json", fixture, "countedOption", "expected exactly the weighted question ids (duplicate, alreadyDone, actionable), found duplicate, alreadyDone");
});

test("countedOption carrying an extra id fails naming countedOption.<id> (O4)", () => {
	const root = newRoot();
	const fixture = baseDecision();
	fixture.countedOption = { duplicate: "yes", alreadyDone: "yes", actionable: "no", ghost: "yes" };
	expectFollowupFail(root, "decision.json", fixture, "countedOption.ghost", 'unknown question id; expected one of duplicate, alreadyDone, actionable, found "ghost"');
});

test("an unknown override rule key fails naming overrides.<i>.<key>", () => {
	const root = newRoot();
	const fixture = baseDecision();
	fixture.overrides = [
		{ question: "duplicate", option: "yes", basis: "b", disposition: "Merge", hard: true },
	];
	expectFollowupFail(root, "decision.json", fixture, "overrides.0.hard", "unknown key; expected one of question, option, basis, disposition");
});

// ---------------------------------------------------------------------------
// 4. Same-run gate green — the card gate keeps admitting `score` while the
// followup refuses it, and the followup dir pair is isolated from the gate's.
// ---------------------------------------------------------------------------

test("the card gate still admits score questions; the followup surface is unaffected (O5, same run)", () => {
	const root = newRoot();
	const gateDir = path.join(root, CONFIG_DIR_NAME, "council", "gate");
	fs.mkdirSync(gateDir, { recursive: true });
	fs.writeFileSync(
		path.join(gateDir, "questions.json"),
		JSON.stringify({
			version: "gate-override-9",
			questions: {
				confidence: { type: "score", instructions: "How confident?", criteria: ["low", "high"] },
			},
		}),
	);
	const qs = loadGateQuestions(root);
	expect(qs.questions.confidence.type).toBe("score");
	// The gate-level repo-local file does not shadow the followup dir pair:
	// the followup still resolves its own packaged set.
	expect(loadFollowupQuestions(root).version).toBe("followup-questions-1");
});
