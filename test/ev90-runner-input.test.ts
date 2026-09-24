/**
 * EV-90 — pass renderProcedure-substituted council.md and features-deliver.md
 * into the council-runner dispatch.
 *
 * Spec: docs/superpowers/specs/2026-09-24-EV-90-design.md (§§1–6). The
 * D1-epic-null ruling recorded on council/cards/EV-90.md is binding: a null or
 * absent `epic:` field is a fail-loud refusal naming the card; no-throw
 * variants (un-substituted or omitted overlay) are rejected.
 *
 * Pure, ms-scale, no network (test-suite-budget). Load-bearing assertions
 * first — byte-identity against renderProcedure is asserted IN ADDITION to
 * substituted-substring assertions, never instead (skeptic job-9.5 item 6:
 * byte-identity alone is tautological and cannot red a wrong args binding).
 */
import { test, expect } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { CONFIG_DIR_NAME } from "@earendil-works/pi-coding-agent";
import { composeRunnerInput, proceduresDir, PKG_ROOT, renderProcedure } from "../extensions/seats.ts";

function tmpRepo(): string {
	return fs.mkdtempSync(path.join(os.tmpdir(), "ev90-"));
}

/** A minimal card face; `epic === undefined` writes a face with no epic line. */
function writeCardFace(root: string, cardId: string, epic: string | null | undefined): void {
	fs.mkdirSync(path.join(root, "council", "cards"), { recursive: true });
	const epicLine = epic === undefined ? "" : `epic: ${epic}\n`;
	fs.writeFileSync(
		path.join(root, "council", "cards", `${cardId}.md`),
		`---\nid: ${cardId}\n${epicLine}state: In Progress\n---\nface body`,
	);
}

function readPackagedBody(name: string): string {
	return fs
		.readFileSync(path.join(PKG_ROOT, "council", "procedures", name), "utf-8")
		.replace(/^---\n[\s\S]*?\n---\n/, "");
}

// ================= §6.1 — per-file override falsifier =================

test("EV-90 §6.1: per-file override-first — override council.md + packaged features-deliver.md", () => {
	const root = tmpRepo();
	const ov = path.join(root, CONFIG_DIR_NAME, "council", "procedures");
	fs.mkdirSync(ov, { recursive: true });
	fs.writeFileSync(
		path.join(ov, "council.md"),
		"---\ndescription: override sentinel\n---\nOVERRIDE-COUNCIL-SENTINEL on `council/cards/$ARGUMENTS.md`",
	);
	writeCardFace(root, "EV-90", "EPIC-23");
	const composed = composeRunnerInput(root, "EV-90", "do the work");
	// the override council body — stripped AND substituted with the card id
	expect(composed).toContain("OVERRIDE-COUNCIL-SENTINEL on `council/cards/EV-90.md`");
	// the strip applied to the override too
	expect(composed).not.toContain("description: override sentinel");
	// packaged features-deliver body still resolves (per-file, never half-mixing)
	expect(composed).toContain("You are the orchestrator delivering `EPIC-23` autonomously");
	// the packaged council.md body is NOT included
	expect(composed).not.toContain("You are the facilitator of a Council run on card");
});

// ================= §6.2 — two-args non-tautology =================

test("EV-90 §6.2: two-args binding — card id renders council.md, epic renders features-deliver.md", () => {
	const root = tmpRepo();
	writeCardFace(root, "EV-90", "EPIC-23");
	const composed = composeRunnerInput(root, "EV-90", "task");
	expect(composed).toContain("council/cards/EV-90.md");
	expect(composed).not.toContain("council/cards/EPIC-23.md");
	expect(composed).toContain("delivering `EPIC-23` autonomously");
	expect(composed).toContain("every card in `EPIC-23`'s scope");
	expect(composed).not.toContain("delivering EV-90 autonomously");
});

// Byte-identity asserted IN ADDITION to the load-bearing substrings above —
// per body with its OWN args, as contiguous substrings in block order.
test("EV-90 §6.2b: bodies byte-identical to renderProcedure output, per body with its own args, in order", () => {
	const root = tmpRepo();
	writeCardFace(root, "EV-90", "EPIC-23");
	const composed = composeRunnerInput(root, "EV-90", "the task text");
	const procDir = proceduresDir(root);
	const councilRender = renderProcedure(readPackagedBody("council.md"), procDir, "EV-90");
	const featuresRender = renderProcedure(readPackagedBody("features-deliver.md"), procDir, "EPIC-23");
	expect(composed).toContain(councilRender);
	expect(composed).toContain(featuresRender);
	expect(composed.indexOf(councilRender)).toBeLessThan(composed.indexOf(featuresRender));
});

// ================= §6.3 — verbatim $& tail + frontmatter strip =================

test("EV-90 §6.3: $&-bearing task text appears exactly once, unmodified, as the <task> tail; strip holds", () => {
	const root = tmpRepo();
	writeCardFace(root, "EV-90", "EPIC-23");
	const task = 'resume card EV-90 with $& and $1 metachars "quoted" and\na newline';
	const composed = composeRunnerInput(root, "EV-90", task);
	// the tail is the last block, byte-verbatim
	expect(composed.endsWith(`<task>\n${task}\n</task>`)).toBe(true);
	// exactly once (the $& metachar must not have been consumed by any .replace)
	expect(composed.indexOf(task)).toBeGreaterThanOrEqual(0);
	expect(composed.indexOf(task, composed.indexOf(task) + 1)).toBe(-1);
	// the scan's frontmatter strip applied to both bodies
	expect(composed).not.toMatch(/^description:/m);
	expect(composed).not.toMatch(/^argument-hint:/m);
	// no unresolved $ARGUMENTS anywhere in the composed input
	expect(composed.includes("$ARGUMENTS")).toBe(false);
});

// ================= §6.4 — epic derivation + the D1 ruling throw =================

test("EV-90 §6.4: epic key derived from the face; epic: null/absent throws naming the card", () => {
	const root = tmpRepo();
	writeCardFace(root, "EV-90", "EPIC-9");
	expect(composeRunnerInput(root, "EV-90", "t")).toContain("delivering `EPIC-9` autonomously");

	const nullRoot = tmpRepo();
	writeCardFace(nullRoot, "EV-45", null);
	expect(() => composeRunnerInput(nullRoot, "EV-45", "t")).toThrow(/EV-45/);

	// absent epic line — the same refusal
	const absentRoot = tmpRepo();
	writeCardFace(absentRoot, "EV-46", undefined);
	expect(() => composeRunnerInput(absentRoot, "EV-46", "t")).toThrow(/EV-46/);
});

// ================= §6.5 — placement / re-export / no-cycle =================

test("EV-90 §6.5: renderProcedure defined once in seats.ts, re-exported from index.ts, no cycle edges", () => {
	const seatsSrc = fs.readFileSync(path.join(PKG_ROOT, "extensions", "seats.ts"), "utf-8");
	const indexSrc = fs.readFileSync(path.join(PKG_ROOT, "extensions", "index.ts"), "utf-8");
	const hubToolsSrc = fs.readFileSync(path.join(PKG_ROOT, "extensions", "hub-tools.ts"), "utf-8");
	expect(seatsSrc).toContain("export function renderProcedure");
	expect(indexSrc).not.toContain("export function renderProcedure");
	expect(indexSrc).toMatch(/export\s*\{\s*renderProcedure\s*\}/);
	expect(seatsSrc.includes('from "./index.ts"')).toBe(false);
	expect(hubToolsSrc.includes('from "./index.ts"')).toBe(false);
});

// ================= §6.6 — AC3 prose pins (EV-89 precedent) =================

test("EV-90 §6.6: council-runner <procedure> block names the in-input blocks; read-in-full instruction gone", () => {
	const seatSrc = fs.readFileSync(path.join(PKG_ROOT, "council", "agents", "council-runner.md"), "utf-8");
	const norm = seatSrc.replace(/\s+/g, " ");
	// the read-in-full instruction is gone (normalized: it wrapped across lines)
	expect(norm).not.toContain("read `council.md` and `features-deliver.md` from the procedures directory");
	expect(norm).not.toContain("Before doing anything else, read");
	// the in-input block names are present
	expect(seatSrc).toContain("<council-procedure>");
	expect(seatSrc).toContain("<features-deliver-overlay>");
	expect(seatSrc).toContain("<task>");
	// byte-anchored survivors
	expect(seatSrc).toContain("**Skip step 0 (preflight).**");
	expect(seatSrc).toContain("Everything else in council.md applies as written");
	// the escalation Phase-1 class-list pointer stays (AC3 scopes only the <procedure> block)
	expect(seatSrc).toContain("council/procedures/features-deliver.md");
});
