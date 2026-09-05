import { describe, expect, test } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { createHash } from "node:crypto";
import type { CatalogueModel } from "../extensions/catalogue.ts";
import { clearSeatOverride, writeSeatOverride, type WriteSeatOverrideResult } from "../extensions/council-config-writer.ts";
import { COUNCIL_CONFIG_FILE, loadCouncilConfig, loadThemeConfig } from "../extensions/seats.ts";

/** sha256 hex digest — the theme block's byte-identity probe (key-order inclusive). */
function sha256(s: string): string {
	return createHash("sha256").update(s).digest("hex");
}

/** Fresh temp repo; `files` keys are relative paths from the repo root. */
function makeRepo(files: Record<string, string> = {}): string {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ev24-writer-"));
	for (const [name, content] of Object.entries(files)) {
		const p = path.join(dir, name);
		fs.mkdirSync(path.dirname(p), { recursive: true });
		fs.writeFileSync(p, content);
	}
	return dir;
}

function cfg(repo: string): string {
	return fs.readFileSync(path.join(repo, COUNCIL_CONFIG_FILE), "utf-8");
}

/** Offset ONE PAST the value's closing brace, matching the `{` opened at `from`.
 *  Valid for the controlled fixtures below: no braces inside their strings. */
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

const T = "\t";

/** Tab-indented fixture, scaffold order (council before theme before other
 *  keys, model before thinking) with a theme section + an unknown top-level key. */
const TAB_FIXTURE =
	`{\n` +
	`${T}"council": {\n` +
	`${T}${T}"owner": {\n` +
	`${T}${T}${T}"model": "openrouter/deepseek/deepseek-v4-flash-0731",\n` +
	`${T}${T}${T}"thinking": "high"\n` +
	`${T}${T}},\n` +
	`${T}${T}"judge": {\n` +
	`${T}${T}${T}"model": "openrouter/qwen/qwen3.6-35b-a3b",\n` +
	`${T}${T}${T}"thinking": "medium"\n` +
	`${T}${T}}\n` +
	`${T}},\n` +
	`${T}"theme": {\n` +
	`${T}${T}"enabled": true,\n` +
	`${T}${T}"variant": "auto"\n` +
	`${T}},\n` +
	`${T}"unknownTopLevel": { "kept": true }\n` +
	`}`;

/** Catalogue fixture: minimax-m3 advertises NO xhigh (off:null) — the
 *  capability-parity probe; the writer MUST still accept thinking:"xhigh". */
const CATALOGUE: CatalogueModel[] = [
	{ provider: "openrouter", id: "deepseek/deepseek-v4-flash-0731", reasoning: true },
	{ provider: "openrouter", id: "qwen/qwen3.6-35b-a3b", reasoning: true },
	{
		provider: "openrouter",
		id: "minimax/minimax-m3",
		reasoning: true,
		thinkingLevelMap: { off: null }, // supported set lacks xhigh/max: off..high only
	},
	{ provider: "openrouter", id: "new/other", reasoning: true },
	{ provider: "anthropic", id: "claude/sonnet-4", reasoning: true },
	{ provider: "fake", id: "model-x", reasoning: false },
];

describe("writeSeatOverride", () => {
	test("discriminating splice: real tab-indented scaffold; one seat replaced; every other byte identical; theme SHA unchanged", () => {
		// The crux (spec §6 bullet 1): a whole-object re-serialize — never mind
		// `JSON.stringify(x, null, 2)` — would reformat the tab-indented seed
		// and fail these byte assertions.
		const repo = makeRepo();
		const seedPath = path.join(import.meta.dir, "..", "council", "scaffold", ".council.json");
		const before = fs.readFileSync(seedPath, "utf-8");
		fs.writeFileSync(path.join(repo, COUNCIL_CONFIG_FILE), before, "utf-8");

		const res = writeSeatOverride({
			repoRoot: repo,
			seat: "designer",
			model: "openrouter/minimax/minimax-m3",
			thinking: "low",
			catalogue: CATALOGUE,
		});
		expect(res.ok).toBe(true);
		const after = cfg(repo);

		const keyAt = before.indexOf('"designer"');
		const valueStart = before.indexOf("{", keyAt);
		const valueEnd = objectEnd(before, valueStart);
		// Every byte outside the council.designer value span is byte-identical:
		expect(after.startsWith(before.slice(0, valueStart))).toBe(true);
		expect(after.endsWith(before.slice(valueEnd))).toBe(true);
		// The theme sibling is byte-identical (SHA-256, key-order inclusive):
		const themeBefore = before.slice(before.indexOf('"theme"'));
		const themeAfter = after.slice(after.indexOf('"theme"'));
		expect(sha256(themeAfter)).toBe(sha256(themeBefore));
		// The replaced span is exactly the indentation-matched object form,
		// model-before-thinking:
		const emittedLen = after.length - (before.length - valueEnd);
		expect(after.slice(valueStart, emittedLen)).toBe(
			`{\n${T}${T}${T}"model": "openrouter/minimax/minimax-m3",\n${T}${T}${T}"thinking": "low"\n${T}${T}}`,
		);
	});

	test("acceptance round-trip: insert a new seat; theme + other seats + unknown key byte-preserved", () => {
		const repo = makeRepo({ [COUNCIL_CONFIG_FILE]: TAB_FIXTURE });
		const before = cfg(repo);

		const res = writeSeatOverride({
			repoRoot: repo,
			seat: "skeptic",
			model: "openrouter/deepseek/deepseek-v4-flash-0731",
			thinking: "high",
			catalogue: CATALOGUE,
		});
		expect(res.ok).toBe(true);
		const after = cfg(repo);

		// The insert lands after the last council member (judge): prefix + suffix
		// around that splice point are the untouched regions, byte-identical.
		const judgeKeyAt = before.indexOf('"judge"');
		const judgeBrace = before.indexOf("{", judgeKeyAt);
		const judgeEnd = objectEnd(before, judgeBrace);
		expect(after.startsWith(before.slice(0, judgeEnd))).toBe(true);
		expect(after.endsWith(before.slice(judgeEnd))).toBe(true);

		const themeBefore = before.slice(before.indexOf('"theme"'));
		const themeAfter = after.slice(after.indexOf('"theme"'));
		expect(sha256(themeAfter)).toBe(sha256(themeBefore));
		expect(after.slice(after.indexOf('"unknownTopLevel"'))).toBe(before.slice(before.indexOf('"unknownTopLevel"')));

		// The inserted seat loads:
		expect(loadCouncilConfig(repo).skeptic).toEqual({
			model: "openrouter/deepseek/deepseek-v4-flash-0731",
			thinking: "high",
		});
	});

	test("hostile span-finder: the seat name inside a string with escaped quotes is never mislocated", () => {
		const hostile =
			`{\n` +
			`${T}"council": {\n` +
			`${T}${T}"skeptic": {\n` +
			`${T}${T}${T}"model": "openrouter/deepseek/deepseek-v4-flash",\n` +
			`${T}${T}${T}"thinking": "high"\n` +
			`${T}${T}},\n` +
			`${T}${T}"judge": "openrouter/qwen/qwen3.6-35b-a3b:medium"\n` +
			`${T}},\n` +
			`${T}"someKey": "contains \\\"skeptic\\\" inside",\n` +
			`${T}"theme": { "enabled": true, "variant": "auto" }\n` +
			`}`;
		const repo = makeRepo({ [COUNCIL_CONFIG_FILE]: hostile });
		const before = cfg(repo);

		const res = writeSeatOverride({
			repoRoot: repo,
			seat: "skeptic",
			model: "openrouter/deepseek/deepseek-v4-flash-0731",
			thinking: "low",
			catalogue: CATALOGUE,
		});
		expect(res.ok).toBe(true);
		const after = cfg(repo);

		const keyAt = before.indexOf('"skeptic"');
		const valueStart = before.indexOf("{", keyAt);
		const valueEnd = objectEnd(before, valueStart);
		expect(after.startsWith(before.slice(0, valueStart))).toBe(true);
		expect(after.endsWith(before.slice(valueEnd))).toBe(true);
		// The hostile string survived the replace intact — a naive indexOf-based
		// span finder would have mistargeted it and corrupted these bytes.
		expect(after).toContain('"someKey": "contains \\"skeptic\\" inside"');
		expect(after).toContain('"judge": "openrouter/qwen/qwen3.6-35b-a3b:medium"');
	});

	test("emitted shape: indentation-matched object form, model-before-thinking", () => {
		const sp = "  ";
		const spaceFixture =
			`{\n` +
			`${sp}"council": {\n` +
			`${sp}${sp}"owner": {\n` +
			`${sp}${sp}${sp}"model": "openrouter/deepseek/deepseek-v4-flash-0731",\n` +
			`${sp}${sp}${sp}"thinking": "high"\n` +
			`${sp}${sp}}\n` +
			`${sp}}\n` +
			`}`;
		const repo = makeRepo({ [COUNCIL_CONFIG_FILE]: spaceFixture });

		const res = writeSeatOverride({
			repoRoot: repo,
			seat: "owner",
			model: "openrouter/minimax/minimax-m3",
			thinking: "low",
			catalogue: CATALOGUE,
		});
		expect(res.ok).toBe(true);
		const after = cfg(repo);
		expect(after).toContain(
			`{\n${sp}${sp}${sp}"model": "openrouter/minimax/minimax-m3",\n${sp}${sp}${sp}"thinking": "low"\n${sp}${sp}}`,
		);
	});

	test("validation writes nothing: unknown model / bad thinking leave file + mtime identical; a valid write lands", () => {
		const repo = makeRepo({ [COUNCIL_CONFIG_FILE]: TAB_FIXTURE });
		const file = path.join(repo, COUNCIL_CONFIG_FILE);
		const before = cfg(repo);
		const m0 = fs.statSync(file).mtimeMs;

		const rUnqualified = writeSeatOverride({
			repoRoot: repo,
			seat: "owner",
			model: "flat-model",
			catalogue: CATALOGUE,
		});
		expect(rUnqualified.ok).toBe(false);
		const rMissing = writeSeatOverride({
			repoRoot: repo,
			seat: "owner",
			model: "openrouter/not-in-cat/x",
			catalogue: CATALOGUE,
		});
		expect(rMissing.ok).toBe(false);
		const rLevel = writeSeatOverride({
			repoRoot: repo,
			seat: "owner",
			model: "openrouter/deepseek/deepseek-v4-flash-0731",
			thinking: "super",
			catalogue: CATALOGUE,
		});
		expect(rLevel.ok).toBe(false);

		expect(cfg(repo)).toBe(before);
		expect(fs.statSync(file).mtimeMs).toBe(m0);

		const rOk = writeSeatOverride({
			repoRoot: repo,
			seat: "owner",
			model: "openrouter/deepseek/deepseek-v4-flash-0731",
			thinking: "low",
			catalogue: CATALOGUE,
		});
		expect(rOk.ok).toBe(true);
		expect(cfg(repo)).not.toBe(before);
	});

	test("capability parity: thinking xhigh on a model that cannot xhigh is accepted and round-trips", () => {
		// minimax/minimax-m3 advertises thinkingLevelMap {off:null} → its
		// supported set excludes xhigh. No capability gate: accepted, loader reads it.
		const repo = makeRepo();
		const res = writeSeatOverride({
			repoRoot: repo,
			seat: "designer",
			model: "openrouter/minimax/minimax-m3",
			thinking: "xhigh",
			catalogue: CATALOGUE,
		});
		expect(res.ok).toBe(true);
		expect(loadCouncilConfig(repo).designer).toEqual({
			model: "openrouter/minimax/minimax-m3",
			thinking: "xhigh",
		});
	});

	test("malformed existing JSON: refuse with an error naming the file; no throw; bytes identical", () => {
		const repo = makeRepo({ [COUNCIL_CONFIG_FILE]: "{ not json" });
		const file = path.join(repo, COUNCIL_CONFIG_FILE);
		const before = cfg(repo);
		const m0 = fs.statSync(file).mtimeMs;

		let res: WriteSeatOverrideResult | undefined;
		expect(() => {
			res = writeSeatOverride({
				repoRoot: repo,
				seat: "owner",
				model: "openrouter/deepseek/deepseek-v4-flash-0731",
				thinking: "high",
				catalogue: CATALOGUE,
			});
		}).not.toThrow();
		expect(res!.ok).toBe(false);
		// Narrowing guard: `res!` above suppresses but does not narrow, so the
		// block reads `res.error` only after proving `res` is defined AND !ok.
		if (res !== undefined && !res.ok) {
			expect(res.error).toContain(COUNCIL_CONFIG_FILE);
		}
		expect(cfg(repo)).toBe(before);
		expect(fs.statSync(file).mtimeMs).toBe(m0);
	});

	test("mode: existing file mode survives the rewrite; greenfield = default umask, never 0600", () => {
		const repo = makeRepo({ [COUNCIL_CONFIG_FILE]: TAB_FIXTURE });
		const file = path.join(repo, COUNCIL_CONFIG_FILE);
		fs.chmodSync(file, 0o640);
		expect(
			writeSeatOverride({
				repoRoot: repo,
				seat: "owner",
				model: "openrouter/deepseek/deepseek-v4-flash-0731",
				thinking: "low",
				catalogue: CATALOGUE,
			}).ok,
		).toBe(true);
		expect(fs.statSync(file).mode & 0o777).toBe(0o640);

		fs.chmodSync(file, 0o600);
		expect(
			writeSeatOverride({
				repoRoot: repo,
				seat: "owner",
				model: "openrouter/deepseek/deepseek-v4-flash-0731",
				thinking: "low",
				catalogue: CATALOGUE,
			}).ok,
		).toBe(true);
		expect(fs.statSync(file).mode & 0o777).toBe(0o600);

		const repo2 = makeRepo();
		expect(
			writeSeatOverride({
				repoRoot: repo2,
				seat: "owner",
				model: "openrouter/deepseek/deepseek-v4-flash-0731",
				thinking: "high",
				catalogue: CATALOGUE,
			}).ok,
		).toBe(true);
		const mode = fs.statSync(path.join(repo2, COUNCIL_CONFIG_FILE)).mode & 0o777;
		expect(mode).not.toBe(0o600);
		expect(mode).toBe(0o666 & ~process.umask());
	});

	test("absent thinking preserves the existing thinking (field-level merge); greenfield writes no thinking key", () => {
		const preset =
			`{\n` +
			`${T}"council": {\n` +
			`${T}${T}"designer": {\n` +
			`${T}${T}${T}"model": "openrouter/anthropic/sonnet-4",\n` +
			`${T}${T}${T}"thinking": "high"\n` +
			`${T}${T}}\n` +
			`${T}}\n` +
			`}`;
		const repo = makeRepo({ [COUNCIL_CONFIG_FILE]: preset });
		const res = writeSeatOverride({
			repoRoot: repo,
			seat: "designer",
			model: "openrouter/new/other",
			catalogue: CATALOGUE,
		});
		expect(res.ok).toBe(true);
		expect(loadCouncilConfig(repo).designer).toEqual({ model: "openrouter/new/other", thinking: "high" });

		const repo2 = makeRepo();
		const res2 = writeSeatOverride({ repoRoot: repo2, seat: "owner", model: "openrouter/new/other", catalogue: CATALOGUE });
		expect(res2.ok).toBe(true);
		expect(loadCouncilConfig(repo2).owner).toEqual({ model: "openrouter/new/other" });
		// greenfield = canonical 2-space + trailing newline, exactly:
		expect(cfg(repo2)).toBe(JSON.stringify({ council: { owner: { model: "openrouter/new/other" } } }, null, 2) + "\n");
	});

	test("loader round-trip: loadCouncilConfig sees the written override; loadThemeConfig is pre-write identical", () => {
		const repo = makeRepo({ [COUNCIL_CONFIG_FILE]: TAB_FIXTURE });
		expect(loadThemeConfig(repo)).toEqual({ enabled: true, variant: "auto" });

		const res = writeSeatOverride({
			repoRoot: repo,
			seat: "owner",
			model: "openrouter/minimax/minimax-m3",
			thinking: "high",
			catalogue: CATALOGUE,
		});
		expect(res.ok).toBe(true);

		expect(loadThemeConfig(repo)).toEqual({ enabled: true, variant: "auto" });
		expect(loadCouncilConfig(repo).owner).toEqual({ model: "openrouter/minimax/minimax-m3", thinking: "high" });
	});

	test("idempotency: a second identical write leaves the file byte-identical", () => {
		const repo = makeRepo({ [COUNCIL_CONFIG_FILE]: TAB_FIXTURE });
		const args = {
			repoRoot: repo,
			seat: "owner",
			model: "openrouter/minimax/minimax-m3",
			thinking: "low",
			catalogue: CATALOGUE,
		};
		expect(writeSeatOverride(args).ok).toBe(true);
		const once = cfg(repo);
		expect(writeSeatOverride(args).ok).toBe(true);
		expect(cfg(repo)).toBe(once);
	});

	test("string-shorthand span becomes the object form; model kept, thinking carried", () => {
		const shorthand =
			`{\n` +
			`${T}"council": {\n` +
			`${T}${T}"judge": "openrouter/qwen/qwen3.6-35b-a3b:medium"\n` +
			`${T}}\n` +
			`}`;
		const repo = makeRepo({ [COUNCIL_CONFIG_FILE]: shorthand });
		const before = cfg(repo);
		const keyAt = before.indexOf('"judge"');
		const colonAt = before.indexOf(":", keyAt);
		let valueStart = colonAt + 1;
		while (before[valueStart] === " " || before[valueStart] === "\t") valueStart++;
		const valueEnd = valueStart + '"openrouter/qwen/qwen3.6-35b-a3b:medium"'.length;

		const res = writeSeatOverride({
			repoRoot: repo,
			seat: "judge",
			model: "openrouter/qwen/qwen3.6-35b-a3b",
			thinking: "high",
			catalogue: CATALOGUE,
		});
		expect(res.ok).toBe(true);
		const after = cfg(repo);
		expect(after.startsWith(before.slice(0, valueStart))).toBe(true);
		expect(after.endsWith(before.slice(valueEnd))).toBe(true);
		expect(after).toContain(
			`"judge": {\n${T}${T}${T}"model": "openrouter/qwen/qwen3.6-35b-a3b",\n${T}${T}${T}"thinking": "high"\n${T}${T}}`,
		);

		// thinking absent + shorthand with a suffix → suffix carried:
		const repo2 = makeRepo({ [COUNCIL_CONFIG_FILE]: shorthand });
		expect(
			writeSeatOverride({ repoRoot: repo2, seat: "judge", model: "openrouter/qwen/qwen3.6-35b-a3b", catalogue: CATALOGUE })
				.ok,
		).toBe(true);
		expect(loadCouncilConfig(repo2).judge).toEqual({
			model: "openrouter/qwen/qwen3.6-35b-a3b",
			thinking: "medium",
		});
	});

	test("FLLWUP-10: object-form model :suffix is preserved across a model-only write (loader parity)", () => {
		// Reproduction from the card: object-form override carrying a :suffix and
		// NO explicit thinking key. Pre-fix, existingThinking sees only the absent
		// `.thinking` key, the write emits no thinking line, and the post-write
		// effective thinking falls back to frontmatter — "low" silently dropped.
		const fixture =
			`{\n` +
			`${T}"council": {\n` +
			`${T}${T}"designer": {\n` +
			`${T}${T}${T}"model": "openrouter/minimax/minimax-m3:low"\n` +
			`${T}${T}},\n` +
			`${T}${T}"judge": {\n` +
			`${T}${T}${T}"model": "openrouter/qwen/qwen3.6-35b-a3b:medium"\n` +
			`${T}${T}}\n` +
			`${T}},\n` +
			`${T}"theme": {\n` +
			`${T}${T}"enabled": true,\n` +
			`${T}${T}"variant": "auto"\n` +
			`${T}},\n` +
			`${T}"unknownTopLevel": { "kept": true }\n` +
			`}`;
		const repo = makeRepo({ [COUNCIL_CONFIG_FILE]: fixture });
		const before = cfg(repo);

		// Model-only write — no `thinking` argument, so preservation is the merge's job.
		const res = writeSeatOverride({ repoRoot: repo, seat: "designer", model: "openrouter/new/other", catalogue: CATALOGUE });
		expect(res.ok).toBe(true);
		const after = cfg(repo);

		// The written entry preserves the level the loader would have resolved:
		expect(loadCouncilConfig(repo).designer).toEqual({ model: "openrouter/new/other", thinking: "low" });
		expect(after).toContain(`"thinking": "low"`);

		// EV-24 guarantees still hold through this fixture: only designer's value
		// span changed; theme, judge, unknown key, indent, trailing bytes identical.
		const keyAt = before.indexOf('"designer"');
		const valueStart = before.indexOf("{", keyAt);
		const valueEnd = objectEnd(before, valueStart);
		expect(after.startsWith(before.slice(0, valueStart))).toBe(true);
		expect(after.endsWith(before.slice(valueEnd))).toBe(true);
		const themeBefore = before.slice(before.indexOf('"theme"'));
		const themeAfter = after.slice(after.indexOf('"theme"'));
		expect(sha256(themeAfter)).toBe(sha256(themeBefore));
		expect(after.slice(after.indexOf('"unknownTopLevel"'))).toBe(before.slice(before.indexOf('"unknownTopLevel"')));
	});

	test("FLLWUP-10: explicit thinking key still wins over an object-form model :suffix (loader precedence)", () => {
		// applySeatOverride: `if (ov.thinking) thinkingLevel = ov.thinking;` runs
		// AFTER suffix parsing — the explicit key must win here too. Regression
		// pin guarding a wrong fix that checks the :suffix before the .thinking key.
		const fixture =
			`{\n` +
			`${T}"council": {\n` +
			`${T}${T}"designer": {\n` +
			`${T}${T}${T}"model": "openrouter/minimax/minimax-m3:low",\n` +
			`${T}${T}${T}"thinking": "high"\n` +
			`${T}${T}}\n` +
			`${T}}\n` +
			`}`;
		const repo = makeRepo({ [COUNCIL_CONFIG_FILE]: fixture });
		const res = writeSeatOverride({ repoRoot: repo, seat: "designer", model: "openrouter/new/other", catalogue: CATALOGUE });
		expect(res.ok).toBe(true);
		expect(loadCouncilConfig(repo).designer).toEqual({ model: "openrouter/new/other", thinking: "high" });
	});

	test("council absent: a council section is inserted before theme, per scaffold order", () => {
		const repo = makeRepo({
			[COUNCIL_CONFIG_FILE]: `{\n${T}"theme": { "enabled": true, "variant": "auto" }\n}`,
		});
		const before = cfg(repo);
		const res = writeSeatOverride({
			repoRoot: repo,
			seat: "designer",
			model: "openrouter/new/other",
			thinking: "high",
			catalogue: CATALOGUE,
		});
		expect(res.ok).toBe(true);
		const after = cfg(repo);
		expect(after.indexOf('"council"')).toBeLessThan(after.indexOf('"theme"'));
		expect(after).toContain('"theme": { "enabled": true, "variant": "auto" }');
		expect(after.endsWith(before.slice(before.indexOf('"theme"')))).toBe(true);
		expect(loadCouncilConfig(repo).designer).toEqual({ model: "openrouter/new/other", thinking: "high" });
	});
});
describe("clearSeatOverride", () => {
	test("round-trip: clear thinking on an object seat; only the thinking member's span changes; theme, other seats, unknown key byte-identical", () => {
		const repo = makeRepo({ [COUNCIL_CONFIG_FILE]: TAB_FIXTURE });
		const before = cfg(repo);

		const res = clearSeatOverride({ repoRoot: repo, seat: "owner", what: "thinking" });
		expect(res.ok).toBe(true);
		const after = cfg(repo);

		// The ONLY change is the owner value span re-emitted without thinking:
		const ownerKeyAt = before.indexOf('"owner"');
		const ownerValueStart = before.indexOf("{", ownerKeyAt);
		const ownerEnd = objectEnd(before, ownerValueStart);
		const expectedOwner =
			`{\n${T}${T}${T}"model": "openrouter/deepseek/deepseek-v4-flash-0731"\n${T}${T}}`;
		expect(after).toBe(before.slice(0, ownerValueStart) + expectedOwner + before.slice(ownerEnd));

		// theme + unknown top-level key byte-identical (SHA, key-order inclusive);
		// the other seat (judge) untouched:
		expect(sha256(after.slice(after.indexOf('"theme"')))).toBe(sha256(before.slice(before.indexOf('"theme"'))));
		expect(after.slice(after.indexOf('"unknownTopLevel"'))).toBe(before.slice(before.indexOf('"unknownTopLevel"')));
		expect(after.slice(after.indexOf('"judge"'), after.indexOf('"theme"'))).toBe(
			before.slice(before.indexOf('"judge"'), before.indexOf('"theme"')),
		);

		// The loader no longer returns the cleared override:
		expect(loadCouncilConfig(repo).owner).toEqual({ model: "openrouter/deepseek/deepseek-v4-flash-0731" });
	});

	test("round-trip: model :suffix is a thinking carrier and is stripped on clear (loader parity, FLLWUP-10 symmetric)", () => {
		const fixture =
			`{\n` +
			`${T}"council": {\n` +
			`${T}${T}"designer": {\n` +
			`${T}${T}${T}"model": "openrouter/minimax/minimax-m3:low"\n` +
			`${T}${T}},\n` +
			`${T}${T}"judge": {\n` +
			`${T}${T}${T}"model": "openrouter/qwen/qwen3.6-35b-a3b:medium"\n` +
			`${T}${T}}\n` +
			`${T}},\n` +
			`${T}"unknownTopLevel": { "kept": true }\n` +
			`}`;
		const repo = makeRepo({ [COUNCIL_CONFIG_FILE]: fixture });
		const before = cfg(repo);

		const res = clearSeatOverride({ repoRoot: repo, seat: "designer", what: "thinking" });
		expect(res.ok).toBe(true);
		const after = cfg(repo);

		// Only the model value span changed: the :low suffix is gone, nothing else.
		const modelValue = '"openrouter/minimax/minimax-m3:low"';
		const modelAt = before.indexOf(modelValue);
		expect(after).toBe(before.slice(0, modelAt) + '"openrouter/minimax/minimax-m3"' + before.slice(modelAt + modelValue.length));
		expect(loadCouncilConfig(repo).designer).toEqual({ model: "openrouter/minimax/minimax-m3" });
	});

	test("round-trip: explicit thinking key AND model :suffix together are both cleared", () => {
		const fixture =
			`{\n` +
			`${T}"council": {\n` +
			`${T}${T}"designer": {\n` +
			`${T}${T}${T}"model": "openrouter/minimax/minimax-m3:low",\n` +
			`${T}${T}${T}"thinking": "high"\n` +
			`${T}${T}}\n` +
			`${T}}\n` +
			`}`;
		const repo = makeRepo({ [COUNCIL_CONFIG_FILE]: fixture });
		const before = cfg(repo);

		const res = clearSeatOverride({ repoRoot: repo, seat: "designer", what: "thinking" });
		expect(res.ok).toBe(true);
		const after = cfg(repo);

		const keyAt = before.indexOf('"designer"');
		const valueStart = before.indexOf("{", keyAt);
		const valueEnd = objectEnd(before, valueStart);
		expect(after).toBe(
			before.slice(0, valueStart) + `{\n${T}${T}${T}"model": "openrouter/minimax/minimax-m3"\n${T}${T}}` + before.slice(valueEnd),
		);
		expect(loadCouncilConfig(repo).designer).toEqual({ model: "openrouter/minimax/minimax-m3" });
	});

	test("whole-seat clear: member + trailing comma removed; prefix/suffix byte-exact; seat gone from loader", () => {
		const repo = makeRepo({ [COUNCIL_CONFIG_FILE]: TAB_FIXTURE });
		const before = cfg(repo);

		const res = clearSeatOverride({ repoRoot: repo, seat: "owner", what: "seat" });
		expect(res.ok).toBe(true);
		const after = cfg(repo);

		// owner is not the last council member — its trailing `,` goes with it:
		const ownerKeyAt = before.indexOf('"owner"');
		const judgeKeyAt = before.indexOf('"judge"');
		expect(after).toBe(before.slice(0, ownerKeyAt) + before.slice(judgeKeyAt));
		expect(loadCouncilConfig(repo).owner).toBeUndefined();
		expect(loadCouncilConfig(repo).judge?.model).toBe("openrouter/qwen/qwen3.6-35b-a3b");
	});

	test("last seat cleared: council re-emits as {} — valid JSON, loadable, theme + unknown key preserved", () => {
		const solo =
			`{\n` +
			`${T}"council": {\n` +
			`${T}${T}"owner": {\n` +
			`${T}${T}${T}"model": "openrouter/deepseek/deepseek-v4-flash-0731",\n` +
			`${T}${T}${T}"thinking": "high"\n` +
			`${T}${T}}\n` +
			`${T}},\n` +
			`${T}"theme": {\n` +
			`${T}${T}"enabled": true,\n` +
			`${T}${T}"variant": "auto"\n` +
			`${T}},\n` +
			`${T}"unknownTopLevel": { "kept": true }\n` +
			`}`;
		const repo = makeRepo({ [COUNCIL_CONFIG_FILE]: solo });

		const res = clearSeatOverride({ repoRoot: repo, seat: "owner", what: "seat" });
		expect(res.ok).toBe(true);
		const after = cfg(repo);

		expect(after).toBe(
			`{\n${T}"council": {},\n${T}"theme": {\n${T}${T}"enabled": true,\n${T}${T}"variant": "auto"\n${T}},\n${T}"unknownTopLevel": { "kept": true }\n}`,
		);
		expect(loadCouncilConfig(repo)).toEqual({});
		expect(loadThemeConfig(repo)).toEqual({ enabled: true, variant: "auto" });
	});

	test("string shorthand: clear thinking strips the :suffix, keeps the shorthand form and the model", () => {
		const shorthand =
			`{\n` +
			`${T}"council": {\n` +
			`${T}${T}"judge": "openrouter/qwen/qwen3.6-35b-a3b:medium"\n` +
			`${T}}\n` +
			`}`;
		const repo = makeRepo({ [COUNCIL_CONFIG_FILE]: shorthand });
		const before = cfg(repo);

		const res = clearSeatOverride({ repoRoot: repo, seat: "judge", what: "thinking" });
		expect(res.ok).toBe(true);
		const after = cfg(repo);

		const quoted = '"openrouter/qwen/qwen3.6-35b-a3b:medium"';
		const valueAt = before.indexOf(quoted);
		expect(after).toBe(before.slice(0, valueAt) + '"openrouter/qwen/qwen3.6-35b-a3b"' + before.slice(valueAt + quoted.length));
		expect(loadCouncilConfig(repo).judge).toEqual({ model: "openrouter/qwen/qwen3.6-35b-a3b" });
	});

	test("no-op semantics: shorthand without suffix, seat absent, file absent — ok, no write, bytes + mtime unchanged", () => {
		const shorthand =
			`{\n` +
			`${T}"council": {\n` +
			`${T}${T}"judge": "openrouter/qwen/qwen3.6-35b-a3b"\n` +
			`${T}}\n` +
			`}`;
		const repo = makeRepo({ [COUNCIL_CONFIG_FILE]: shorthand });
		const file = path.join(repo, COUNCIL_CONFIG_FILE);
		const before = cfg(repo);
		const m0 = fs.statSync(file).mtimeMs;

		expect(clearSeatOverride({ repoRoot: repo, seat: "judge", what: "thinking" }).ok).toBe(true);
		expect(cfg(repo)).toBe(before);
		expect(fs.statSync(file).mtimeMs).toBe(m0);

		// seat absent → no-op with a write-free ok:true
		const repo2 = makeRepo({ [COUNCIL_CONFIG_FILE]: TAB_FIXTURE });
		const before2 = cfg(repo2);
		const f2 = path.join(repo2, COUNCIL_CONFIG_FILE);
		const m2 = fs.statSync(f2).mtimeMs;
		expect(clearSeatOverride({ repoRoot: repo2, seat: "skeptic", what: "seat" }).ok).toBe(true);
		expect(clearSeatOverride({ repoRoot: repo2, seat: "skeptic", what: "thinking" }).ok).toBe(true);
		expect(cfg(repo2)).toBe(before2);
		expect(fs.statSync(f2).mtimeMs).toBe(m2);

		// file absent → no-op
		const repo3 = makeRepo();
		expect(clearSeatOverride({ repoRoot: repo3, seat: "owner", what: "seat" }).ok).toBe(true);
		expect(fs.existsSync(path.join(repo3, COUNCIL_CONFIG_FILE))).toBe(false);
	});

	test("malformed JSON or non-object council: refuse with an error naming the file; no write", () => {
		for (const bad of ["{ not json", `{\n${T}"council": "nope"\n}`]) {
			const repo = makeRepo({ [COUNCIL_CONFIG_FILE]: bad });
			const f = path.join(repo, COUNCIL_CONFIG_FILE);
			const before = cfg(repo);
			const m0 = fs.statSync(f).mtimeMs;
			const res = clearSeatOverride({ repoRoot: repo, seat: "owner", what: "thinking" });
			expect(res.ok).toBe(false);
			if (!res.ok) expect(res.error).toContain(COUNCIL_CONFIG_FILE);
			expect(cfg(repo)).toBe(before);
			expect(fs.statSync(f).mtimeMs).toBe(m0);
		}
	});
});
