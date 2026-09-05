import { expect, test } from "bun:test";
import { filterModelRows, rowsForProvider, type PickRow } from "../extensions/model-picker.ts";
import type { ModelEntry, ProviderGroup } from "../extensions/catalogue.ts";

/** Hand-built entries in the same shape model-picker.test.ts uses.
 *  qualifiedId is the byte-verbatim `${provider}/${id}` write key; one entry
 *  deliberately carries a display name ("Sonnet 4") that must never match. */
function entry(id: string, levels: string[], qualifiedId = id, name = id): ModelEntry {
	return { qualifiedId, id, name, reasoning: levels.length > 0, supportedThinkingLevels: levels };
}

const OPENROUTER: ProviderGroup = {
	provider: "openrouter",
	displayName: "OpenRouter",
	models: [
		entry("deepseek/deepseek-v4-pro-0813", ["off", "medium", "high"], "openrouter/deepseek/deepseek-v4-pro-0813", "DeepSeek V4 Pro (0813)"),
		entry("alpha/a", ["off"], "openrouter/alpha/a", "Alpha A"),
		entry("alias/claude-sonnet", ["off", "high"], "openrouter/alias/claude-sonnet", "Sonnet 4"),
	],
};
const XAI: ProviderGroup = {
	provider: "xai",
	displayName: "xAI",
	models: [entry("grok/v1", [], "xai/grok/v1", "Grok V1")], // [] — one level-less row
};

/** Real rowsForProvider output — the exact J-2 shape EV-27's search input
 *  will filter: ds:off/medium/high, alpha:off, alias:off, alias:high,
 *  grok/v1 (level-less). */
const ROWS: PickRow[] = [...rowsForProvider(OPENROUTER), ...rowsForProvider(XAI)];

test("EV-26: case-insensitive substring on qualifiedId only; non-matches and display names excluded", () => {
	const hit = filterModelRows(ROWS, "deepseek");
	// suffixes preserved on surviving rows, rendered shape intact
	expect(hit.map((r) => `${r.model.qualifiedId}${r.level === undefined ? "" : ":" + r.level}`)).toEqual([
		"openrouter/deepseek/deepseek-v4-pro-0813:off",
		"openrouter/deepseek/deepseek-v4-pro-0813:medium",
		"openrouter/deepseek/deepseek-v4-pro-0813:high",
	]);
	// case-insensitive — the card's "filter" word
	expect(filterModelRows(ROWS, "DEEPSEEK-V4")).toHaveLength(3);
	expect(filterModelRows(ROWS, "ALPHA").map((r) => r.model.qualifiedId)).toEqual(["openrouter/alpha/a"]);
	expect(filterModelRows(ROWS, "grok").map((r) => r.model.qualifiedId)).toEqual(["xai/grok/v1"]);
	expect(filterModelRows(ROWS, "grok")[0].level).toBeUndefined(); // level-less [] row survives unfiltered
	// non-matches excluded
	expect(filterModelRows(ROWS, "zz-no-such-model")).toEqual([]);
	// display name is never a match field: "Sonnet 4" exists only as a name
	expect(filterModelRows(ROWS, "sonnet")).toEqual([]);
	// surviving rows are the identical PickRow references, not copies
	hit.forEach((r, i) => expect(r).toBe(ROWS[i]));
});

test("EV-26: empty query returns all rows as identical references", () => {
	const result = filterModelRows(ROWS, "");
	expect(result).toHaveLength(ROWS.length);
	result.forEach((row, i) => expect(row).toBe(ROWS[i])); // identical PickRow objects, not copies
});

test("EV-26: a query matching nothing returns an empty array", () => {
	expect(filterModelRows(ROWS, "zz")).toEqual([]);
	expect(filterModelRows(ROWS, "openrouter/x/yz")).toEqual([]);
});

test("EV-26: a query containing ':' never matches a thinking-level suffix", () => {
	// alpha/a:off and alias/claude-sonnet:off are rows whose RENDERED string
	// ends in ":off", but "off" is the level — not part of qualifiedId.
	expect(filterModelRows(ROWS, ":off")).toEqual([]);
	expect(filterModelRows(ROWS, ":")).toEqual([]); // no qualifiedId contains ":"
	// bare "off" matches nothing either — no qualifiedId contains it; levels
	// are not match fields at all
	expect(filterModelRows(ROWS, "off")).toEqual([]);
});