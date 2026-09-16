import { expect, test } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { createHash } from "node:crypto";
import { writeSeatOverride } from "../extensions/council-config-writer.ts";
import type { CatalogueModel } from "../extensions/catalogue.ts";
import { COUNCIL_CONFIG_FILE, loadCouncilConfig, loadRetryConfig, PKG_ROOT } from "../extensions/seats.ts";

// ---- R2 shipped defaults (council/cards/EV-38.md, orchestrator ruling R2) ----

const R2_DEFAULTS = {
	enabled: true,
	maxAttempts: 3,
	baseDelayMs: 2000,
	maxDelayMs: 30000,
	jitter: true,
};

const CATALOGUE: CatalogueModel[] = [
	{ provider: "openrouter", id: "deepseek/deepseek-v4-flash-0731", reasoning: true },
	{ provider: "openrouter", id: "qwen/qwen3.6-35b-a3b", reasoning: true },
];

// ---- helpers ----

function tmpRepo(): string {
	return fs.mkdtempSync(path.join(os.tmpdir(), "ev38-retry-"));
}

function writeConfig(root: string, data: unknown): void {
	fs.writeFileSync(path.join(root, COUNCIL_CONFIG_FILE), JSON.stringify(data));
}

function writeConfigRaw(root: string, text: string): void {
	fs.writeFileSync(path.join(root, COUNCIL_CONFIG_FILE), text);
}

/** Offset ONE PAST the value's closing brace, matching the `{` opened at `from`. */
function objectEnd(text: string, from: number): number {
	let depth = 0;
	for (let i = from; i < text.length; i++) {
		if (text[i] === "{") depth++;
		else if (text[i] === "}") {
			depth--;
			if (depth === 0) return i + 1;
		}
	}
	return text.length;
}

function sha256(s: string): string {
	return createHash("sha256").update(s).digest("hex");
}

// ---- absent / present ----

test("absent .council.json returns the R2 defaults exactly", () => {
	expect(loadRetryConfig(tmpRepo())).toEqual(R2_DEFAULTS);
});

test("file without a retry section returns the R2 defaults exactly", () => {
	const root = tmpRepo();
	writeConfig(root, { council: { owner: { model: "x/y" } }, theme: { enabled: true, variant: "auto" } });
	expect(loadRetryConfig(root)).toEqual(R2_DEFAULTS);
});

test("empty retry object returns the R2 defaults (theme {} precedent)", () => {
	const root = tmpRepo();
	writeConfig(root, { retry: {} });
	expect(loadRetryConfig(root)).toEqual(R2_DEFAULTS);
});

test("full retry section returns the file's values exactly", () => {
	const root = tmpRepo();
	writeConfig(root, {
		retry: { enabled: false, maxAttempts: 5, baseDelayMs: 500, maxDelayMs: 10000, jitter: false },
	});
	expect(loadRetryConfig(root)).toEqual({
		enabled: false,
		maxAttempts: 5,
		baseDelayMs: 500,
		maxDelayMs: 10000,
		jitter: false,
	});
});

test("partial retry section merges over the defaults base (loadThemeConfig precedent)", () => {
	const root = tmpRepo();
	writeConfig(root, { retry: { maxAttempts: 5 } });
	expect(loadRetryConfig(root)).toEqual({ ...R2_DEFAULTS, maxAttempts: 5 });
});

test("present enabled:false is off-as-data — a full policy, never undefined", () => {
	const root = tmpRepo();
	writeConfig(root, { retry: { enabled: false } });
	const policy = loadRetryConfig(root);
	expect(policy).toEqual({ ...R2_DEFAULTS, enabled: false });
	expect(policy).not.toBeUndefined();
});

// ---- R3 violations: every throw names the file and the offending key ----

test("maxAttempts must be an integer ≥ 1", () => {
	for (const bad of [0, -1, 1.5, "3", null, true]) {
		const root = tmpRepo();
		writeConfig(root, { retry: { maxAttempts: bad } });
		expect(() => loadRetryConfig(root)).toThrow(/council\.json/);
		expect(() => loadRetryConfig(root)).toThrow(/retry\.maxAttempts/);
	}
});

test("baseDelayMs must be an integer ≥ 100", () => {
	for (const bad of [99, -1, 0, 199.5, "2000", null, true]) {
		const root = tmpRepo();
		writeConfig(root, { retry: { baseDelayMs: bad } });
		expect(() => loadRetryConfig(root)).toThrow(/council\.json/);
		expect(() => loadRetryConfig(root)).toThrow(/retry\.baseDelayMs/);
	}
});

test("maxDelayMs below the effective baseDelayMs throws naming retry.maxDelayMs", () => {
	const explicit = tmpRepo();
	writeConfig(explicit, { retry: { baseDelayMs: 5000, maxDelayMs: 4999 } });
	expect(() => loadRetryConfig(explicit)).toThrow(/retry\.maxDelayMs/);

	// merged base: file sets only baseDelayMs above the default maxDelayMs
	const merged = tmpRepo();
	writeConfig(merged, { retry: { baseDelayMs: 31000 } });
	expect(() => loadRetryConfig(merged)).toThrow(/retry\.maxDelayMs/);

	const wrongType = tmpRepo();
	writeConfig(wrongType, { retry: { maxDelayMs: "30000" } });
	expect(() => loadRetryConfig(wrongType)).toThrow(/retry\.maxDelayMs/);
});

test("the maxDelayMs-vs-baseDelayMs check is key-order independent", () => {
	const ok = tmpRepo();
	writeConfigRaw(ok, `{"retry": {"maxDelayMs": 1500, "baseDelayMs": 1000}}`);
	expect(loadRetryConfig(ok)).toEqual({ ...R2_DEFAULTS, baseDelayMs: 1000, maxDelayMs: 1500 });

	const bad = tmpRepo();
	writeConfigRaw(bad, `{"retry": {"maxDelayMs": 999, "baseDelayMs": 1000}}`);
	expect(() => loadRetryConfig(bad)).toThrow(/retry\.maxDelayMs/);
});

test("enabled and jitter must be booleans", () => {
	for (const [key, bad] of [
		["enabled", "yes"],
		["enabled", 1],
		["enabled", null],
		["jitter", 0],
		["jitter", "true"],
		["jitter", null],
	] as const) {
		const root = tmpRepo();
		writeConfig(root, { retry: { [key]: bad } });
		expect(() => loadRetryConfig(root)).toThrow(new RegExp(`retry\\.${key}`));
		expect(() => loadRetryConfig(root)).toThrow(/council\.json/);
	}
});

test("unknown key inside retry throws naming the file and the key (theme parity)", () => {
	const root = tmpRepo();
	writeConfig(root, { retry: { backoff: "exponential" } });
	expect(() => loadRetryConfig(root)).toThrow(/unknown key "retry\.backoff"/);
	expect(() => loadRetryConfig(root)).toThrow(/council\.json/);
});

// ---- section-level shape ----

test("non-object retry value throws naming the file and the key", () => {
	for (const bad of [false, null, 0, "", "fast", 42, [], [1]]) {
		const root = tmpRepo();
		writeConfig(root, { retry: bad });
		expect(() => loadRetryConfig(root)).toThrow(/council\.json/);
		expect(() => loadRetryConfig(root)).toThrow(/"retry" must be an object/);
	}
});

test("malformed JSON throws naming the file (loader precedent)", () => {
	const root = tmpRepo();
	writeConfigRaw(root, "{ not json");
	expect(() => loadRetryConfig(root)).toThrow(/council\.json/);
	expect(() => loadRetryConfig(root)).toThrow(/malformed JSON/);
});

test("non-object root throws naming the file (loader precedent)", () => {
	for (const bad of ["[1, 2]", '"x"', "null", "3"]) {
		const root = tmpRepo();
		writeConfigRaw(root, bad);
		expect(() => loadRetryConfig(root)).toThrow(/council\.json/);
		expect(() => loadRetryConfig(root)).toThrow(/root must be a JSON object/);
	}
});

// ---- sibling-loader coexistence ----

test("loadCouncilConfig ignores the top-level retry key; retry is never a seat override", () => {
	const root = tmpRepo();
	writeConfig(root, {
		council: { owner: { model: "openrouter/x/y" } },
		retry: { maxAttempts: 9 },
	});
	expect(loadCouncilConfig(root)).toEqual({ owner: { model: "openrouter/x/y" } });
	expect(loadRetryConfig(root).maxAttempts).toBe(9);
});

// ---- scaffold defaults visibility (R2 as concrete JSON) ----

const SCAFFOLD_CONFIG = path.join(PKG_ROOT, "council", "scaffold", ".council.json");

test("shipped scaffold carries the R2 retry block, tab-indented, with existing keys intact", () => {
	const raw = fs.readFileSync(SCAFFOLD_CONFIG, "utf-8");
	const parsed = JSON.parse(raw);
	expect(parsed.retry).toEqual(R2_DEFAULTS);
	// tab indentation is preserved (scaffold is ^I-tabbed; a 2-space re-format would break it)
	expect(raw).toContain('\t"retry": {');
	expect(raw).toContain('\t\t"maxAttempts": 3,');
	// every pre-existing key survives
	expect(parsed.council).toBeDefined();
	expect(parsed.theme).toEqual({ enabled: true, variant: "auto" });
});

test("the scaffold-seeded config loads to the R2 defaults through loadRetryConfig", () => {
	const root = tmpRepo();
	fs.copyFileSync(SCAFFOLD_CONFIG, path.join(root, COUNCIL_CONFIG_FILE));
	expect(loadRetryConfig(root)).toEqual(R2_DEFAULTS);
});

// ---- writer byte-preservation (the Intent's claim) ----

test("writeSeatOverride leaves the retry bytes untouched", () => {
	const repo = tmpRepo();
	const before = fs.readFileSync(SCAFFOLD_CONFIG, "utf-8");
	writeConfigRaw(repo, before);

	const retryAt = before.indexOf('"retry"');
	expect(retryAt).toBeGreaterThan(-1);
	const valueStart = before.indexOf("{", before.indexOf(":", retryAt));
	const valueEnd = objectEnd(before, valueStart);
	const retryBytesBefore = before.slice(valueStart, valueEnd);

	const res = writeSeatOverride({
		repoRoot: repo,
		seat: "judge",
		model: "openrouter/qwen/qwen3.6-35b-a3b",
		thinking: "high",
		catalogue: CATALOGUE,
	});
	expect(res.ok).toBe(true);
	const after = fs.readFileSync(path.join(repo, COUNCIL_CONFIG_FILE), "utf-8");
	const afterValueStart = after.indexOf("{", after.indexOf(":", after.indexOf('"retry"')));
	expect(sha256(after.slice(afterValueStart, objectEnd(after, afterValueStart)))).toBe(
		sha256(retryBytesBefore),
	);
	// and the written override is visible to the loader while retry stays default
	expect(loadRetryConfig(repo)).toEqual(R2_DEFAULTS);
});
