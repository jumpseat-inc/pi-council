import { test, expect } from "bun:test";
import { renderProcedure } from "../extensions/index.ts";

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
