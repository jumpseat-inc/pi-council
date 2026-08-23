import { test, expect } from "bun:test";
import { jsonSchemaToTypebox } from "../../extensions/mcp/schema.ts";

test("object with typed properties", () => {
	const s = jsonSchemaToTypebox({
		type: "object",
		properties: { q: { type: "string" }, limit: { type: "integer" } },
		required: ["q"],
	}) as Record<string, unknown>;
	expect((s as { type?: string }).type).toBe("object");
	expect(Object.keys((s as { properties?: Record<string, unknown> }).properties ?? {})).toEqual(["q", "limit"]);
});

test("object declared only via properties (common MCP quirk)", () => {
	const s = jsonSchemaToTypebox({ properties: { a: { type: "number" } } }) as Record<string, unknown>;
	expect((s as { type?: string }).type).toBe("object");
});

test("array of strings", () => {
	const s = jsonSchemaToTypebox({ type: "array", items: { type: "string" } }) as Record<string, unknown>;
	expect((s as { type?: string }).type).toBe("array");
});

test("enum becomes a union of literals", () => {
	const s = jsonSchemaToTypebox({ enum: ["a", "b"] }) as Record<string, unknown>;
	expect((s as { anyOf?: unknown[] }).anyOf?.length).toBe(2);
});

test("single-element union collapses", () => {
	const s = jsonSchemaToTypebox({ oneOf: [{ type: "string" }] }) as Record<string, unknown>;
	expect((s as { type?: string }).type).toBe("string");
});

test("unrecognized schema degrades to Any (empty schema), not a crash", () => {
	expect(jsonSchemaToTypebox(null)).toEqual({});
	expect(jsonSchemaToTypebox({ type: "weird" })).toEqual({});
	expect(jsonSchemaToTypebox({})).toEqual({});
});

test("nullable via type array", () => {
	const s = jsonSchemaToTypebox({ type: ["string", "null"] }) as Record<string, unknown>;
	expect((s as { anyOf?: unknown[] }).anyOf?.length).toBe(2);
});
