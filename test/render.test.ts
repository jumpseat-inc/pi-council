import { test, expect } from "bun:test";
import fs from "node:fs";
import path from "node:path";
import { renderProcedure } from "../extensions/index.ts";
import { PKG_ROOT } from "../extensions/seats.ts";

test("substitutes $COUNCIL_PROCEDURES and $ARGUMENTS", () => {
	const body = "Read $COUNCIL_PROCEDURES/council.md on: $ARGUMENTS";
	expect(renderProcedure(body, "/pkg/council/procedures", "EV-7")).toBe(
		"Read /pkg/council/procedures/council.md on: EV-7",
	);
});

test("missing arguments renders empty substitution", () => {
	expect(renderProcedure("task: $ARGUMENTS", "/p", undefined)).toBe("task: ");
	expect(renderProcedure("no placeholders", "/p", "x")).toBe("no placeholders");
});

// FLLWUP-107: pin renderProcedure's substitution set. Byte-equality on the
// whole rendered string proves both directions at once — the two known tokens
// ARE substituted, and every foreign $…/@… token passes through byte-unchanged
// (FLLWUP-105 ruling 2026-09-24 Q3a: the renderer is the substitution seam;
// the pin lives here, not in usages-procedure.test.ts).
test("substitution set is exactly $COUNCIL_PROCEDURES and $ARGUMENTS — foreign tokens pass through byte-unchanged", () => {
	const body = [
		"dir=$COUNCIL_PROCEDURES",
		"args=$ARGUMENTS",
		"foreign=$CONFIG_DIR_NAME @CONFIG_DIR@ $SOMETHING_ELSE @ANYTHING@",
	].join("\n");
	expect(renderProcedure(body, "/pkg/council/procedures", "  EV-7  ")).toBe(
		[
			"dir=/pkg/council/procedures",
			"args=EV-7",
			"foreign=$CONFIG_DIR_NAME @CONFIG_DIR@ $SOMETHING_ELSE @ANYTHING@",
		].join("\n"),
	);
});

// FLLWUP-107: no packaged procedure ships containing an unrendered
// $CONFIG_DIR_NAME or @CONFIG_DIR@ token — the renderer never substitutes
// them, so a shipped occurrence would reach the model unresolved.
test("no packaged procedure contains an unrendered $CONFIG_DIR_NAME or @CONFIG_DIR@ token", () => {
	const dir = path.join(PKG_ROOT, "council", "procedures");
	const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md"));
	// non-vacuity: the scan is over a real procedure pack
	expect(files.length).toBeGreaterThan(0);
	const offenders: string[] = [];
	for (const file of files) {
		const content = fs.readFileSync(path.join(dir, file), "utf-8");
		if (content.includes("$CONFIG_DIR_NAME")) offenders.push(`${file}: $CONFIG_DIR_NAME`);
		if (content.includes("@CONFIG_DIR@")) offenders.push(`${file}: @CONFIG_DIR@`);
	}
	expect(offenders).toEqual([]);
});
