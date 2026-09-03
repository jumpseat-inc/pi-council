import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { extractLinks } from "../src/links.ts";

const sample = readFileSync(join(__dirname, "fixtures", "sample.md"), "utf-8");

test("extracts a plain link", () => {
	expect(extractLinks("[docs](https://example.com)")).toEqual([
		{ text: "docs", url: "https://example.com" },
	]);
});

test("skips image syntax", () => {
	expect(extractLinks("![logo](https://example.com/logo.png)")).toEqual([]);
});

test("ignores link titles", () => {
	expect(extractLinks('[a](https://a.b "Title")')).toEqual([
		{ text: "a", url: "https://a.b" },
	]);
});

test("sample fixture has exactly three links", () => {
	expect(extractLinks(sample)).toHaveLength(3);
});
