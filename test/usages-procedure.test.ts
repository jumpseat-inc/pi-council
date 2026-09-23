import { test, expect } from "bun:test";
import fs from "node:fs";
import path from "node:path";
import { PKG_ROOT } from "../extensions/seats.ts";

function readProcedure(name: string): string {
	return fs.readFileSync(
		path.join(PKG_ROOT, "council", "procedures", name),
		"utf-8",
	);
}

// FLLWUP-105: the /usages procedure must carry the stale-copy remediation.
// Pin: containment of exactly these three literals — no 4th literal, no
// negative assertions, no section anchor, no ordering assertions, no
// full-sentence match (settled design, 2026-09-24 ruling Q1/Q2).
test("usages procedure pins the stale-copy remediation: trigger literal, copied path fragment, and re-init command", () => {
	const procedure = fs.readFileSync(
		path.join(PKG_ROOT, "council", "procedures", "usages.md"),
		"utf-8",
	);
	expect(procedure).toContain("usages: could not write cache:");
	expect(procedure).toContain("skills/usages/");
	expect(procedure).toContain("/council-init");
});

// ─── FLLWUP-108: remediation-element pin ────────────────────────────────
// The three-literal pin above cannot see an element dropped from the
// remediation sentence: `skills/usages/` and `/council-init` also live in the
// **Run.** section, so a whole-file containment check stays green when the
// sentence loses its rm -rf command, its /council-init re-run, or its
// package-update step. This pin is sentence-scoped instead: the region from
// the first trigger literal to the next markdown heading, with each
// remediation element required inside that region.
//
// Element detection is deliberately token-agnostic between the command form
// and the prose form (the FLLWUP-105 round-2 calibration boundary):
//   • copied-skill refresh — the copied skill directory is named in the
//     region (`rm -rf .pi/skills/usages/` or "delete the stale copied skill
//     at .pi/skills/usages/"); no coupling to the exact `rm -rf` token.
//   • re-init — `/council-init` inside the region (the Run-section mention
//     is outside the region and must not satisfy it).
//   • package-update — an update stem co-occurring with the package name
//     ("after updating the pi-council package" and "first update the
//     pi-council package" both carry it; unordered, so reflow is safe).

const norm = (s: string): string => s.replace(/\s+/g, " ");

// All three remediation elements must co-occur inside the remediation
// region: from the trigger literal through the next markdown heading (or
// end of file). Token-agnostic element detection per the calibration
// boundary above. The package-update element is a same-sentence
// co-occurrence — the package name plus an update-flavored verb stem in
// one normalized sentence — so qualifier insertions ("updating to the
// latest release of the pi-council package") and reordering
// ("first update the pi-council package, then delete …") both hold,
// while an unrelated "update" in a neighboring sentence cannot satisfy it.
function remediationPinned(procedure: string): boolean {
	const TRIGGER = "usages: could not write cache:";
	if (!procedure.includes(TRIGGER)) return false;
	const start = procedure.indexOf(TRIGGER);
	let end = procedure.length;
	const heading = /\n^#{1,6} /m.exec(procedure.slice(start));
	if (heading) end = start + heading.index;
	const region = norm(procedure.slice(start, end));
	// re-init: the /council-init command itself (the Run-section mention is
	// outside the region and cannot satisfy this).
	if (!region.includes("/council-init")) return false;
	// copied-skill refresh: the copied skill directory named in the region
	// (rm -rf form or prose "delete … at .pi/skills/usages/" form).
	if (!region.includes("skills/usages/")) return false;
	// package-update: update-flavored verb + "pi-council package" in the
	// same sentence (split on terminal punctuation after normalization).
	const sentences = region.split(/(?<=[.!?])\s+/);
	return sentences.some(
		(s) =>
			/\bpi-council package\b/.test(s) &&
			/\b(updat|upgrad|install)/i.test(s),
	);
}

// In-memory variant surgery for the calibration set. Throws on drift so a
// reworded ship-text can never silently turn an arm vacuous.
function surgery(text: string, from: string, to: string): string {
	if (!text.includes(from)) {
		throw new Error(`calibration drift: pattern not found: ${JSON.stringify(from)}`);
	}
	return text.replace(from, to);
}

// Variant A — claim-preserving rewords: every remediation element intact,
// different wording. MUST stay green.
const VARIANTS_A: Array<[string, (t: string) => string]> = [
	[
		"A1 package-version reword",
		(t) =>
			surgery(
				t,
				"the fix ships in a newer package version",
				"the fix lands in the next release",
			),
	],
	[
		"A2 v2-style reword (no rm -rf token, prose delete form)",
		(t) =>
			surgery(
				t,
				"surface that line to the user verbatim (no prefix, no rewording); explain the fix ships in a newer package version but does not reach the skill already copied into this repo, so — after updating the pi-council package — run `rm -rf .pi/skills/usages/` and then `/council-init` to recopy the fixed tool; the report itself still ships.",
				"surface that line verbatim to the user and explain that the fix ships in a newer package version — first update the pi-council package, then delete the stale copied skill at `.pi/skills/usages/` and re-run `/council-init` to recopy the fixed tool.",
			),
	],
];

// Variant B — a remediation element dropped. MUST go red.
const VARIANTS_B: Array<[string, (t: string) => string]> = [
	[
		"B1 rm -rf refresh command dropped",
		(t) =>
			surgery(
				t,
				"`rm -rf .pi/skills/usages/` and then `/council-init`",
				"`/council-init`",
			),
	],
	[
		"B2 /council-init re-run dropped (Run-section mention must not rescue it)",
		(t) =>
			surgery(
				t,
				"`rm -rf .pi/skills/usages/` and then `/council-init` to recopy the fixed tool",
				"`rm -rf .pi/skills/usages/` to clear the stale copy",
			),
	],
	[
		"B3 package-update step dropped",
		(t) =>
			surgery(
				t,
				"so — after updating the pi-council package — run",
				"so — run",
			),
	],
	[
		"B4 wholesale remediation-sentence removal",
		(t) =>
			surgery(
				t,
				"If the tool's stderr contains the literal `usages: could not write cache:`, surface that line to the user verbatim (no prefix, no rewording); explain the fix ships in a newer package version but does not reach the skill already copied into this repo, so — after updating the pi-council package — run `rm -rf .pi/skills/usages/` and then `/council-init` to recopy the fixed tool; the report itself still ships.",
				"",
			),
	],
];

// FLLWUP-108: the pin holds on the shipped procedure text.
test("usages procedure pins every remediation element sentence-scoped", () => {
	expect(remediationPinned(readProcedure("usages.md"))).toBe(true);
});

test.each(VARIANTS_A)(
	"calibration %s: pin stays green on claim-preserving reword",
	(_name, transform) => {
		expect(
			remediationPinned(transform(norm(readProcedure("usages.md")))),
		).toBe(true);
	},
);

test.each(VARIANTS_B)(
	"calibration %s: pin goes red on element drop",
	(_name, transform) => {
		expect(
			remediationPinned(transform(norm(readProcedure("usages.md")))),
		).toBe(false);
	},
);

// FLLWUP-106: the /usages procedure must forbid inventing framing around the
// tool's stderr — no added warning glyph, no invented cause, consequence, or
// issue count; every non-empty stderr line is surfaced verbatim (product-owner
// ruling Q1–Q5, spec 2026-09-22-FLLWUP-106-design.md).
test("usages procedure pins stderr discipline: glyph prohibition, worked-example literal, and verbatim proximity", () => {
	const procedure = readProcedure("usages.md");
	// O1 — glyph in a prohibition context (byte-exact; U+26A0 U+FE0F, copied
	// from the spec/card)
	expect(procedure).toContain("do not add a ⚠️");
	// O2 — worked-example literal
	expect(procedure).toContain("One non-fatal issue");
	// O3 — proximity anchored on the base-absent token (red at base by
	// anchor-absence, not gap luck; base occurrences of "non-empty stderr" = 0)
	expect(procedure.replace(/\s+/g, " ")).toMatch(
		/non-empty stderr[\s\S]{0,120}verbatim/i,
	);
});
