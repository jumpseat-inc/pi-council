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
