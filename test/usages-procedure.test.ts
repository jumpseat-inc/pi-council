import { test, expect } from "bun:test";
import fs from "node:fs";
import path from "node:path";
import { PKG_ROOT } from "../extensions/seats.ts";

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
