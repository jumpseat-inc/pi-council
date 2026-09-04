# EV-24 Non-destructive .council.json Merge-Writer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `writeSeatOverride` — the first `.council.json` write path — that validates a seat's model/thinking selection against the flat catalogue's `qualifiedId` set and `THINKING_LEVELS`, then atomically merges `council.<seat>` (object form) into `.council.json` by splicing only the seat value's byte span, so the `theme` section, every other seat, unknown top-level keys, indentation, and trailing newline stay byte-identical.

**Architecture:** One I/O module `extensions/council-config-writer.ts` + one temp-dir test `test/council-config-writer.test.ts`. The writer is a **byte-region patcher with three regimes** (spec §5.3): *replace* (seat value span re-emitted as the object form in the file's indent, model-before-thinking, absent thinking preserved), *insert* (seat absent in existing `council`, or `council` absent entirely — new region in the file's detected indent), *greenfield* (file absent — canonical 2-space + trailing newline). A string-aware byte-scan (escape-aware) finds the seat value span — never mislocating on string content containing the literal seat name — and all other bytes pass through untouched. `THINKING_LEVELS` in `seats.ts:17` becomes `export`ed (one line, behavior-neutral). Atomic write mirrors `auth-store.ts` (tmp + chmod-preserve-existing-mode + `renameSync`; rename failures throw; greenfield uses default umask, never `0o600`).

**Tech Stack:** TypeScript strict (`bunx tsc --noEmit`), `bun:test`, `node:fs`/`node:path`, `node:crypto` in the test only for SHA-256. No new dependencies; no network I/O; no `@earendil-works/pi-ai/compat` import (capability data stays picker-only in catalogue.ts).

**Spec:** `docs/superpowers/specs/2026-09-04-EV-24-design.md` — committed on this branch as `e8c565b`. The plan argues from the spec. Rulings that bind (spec §2, deliberation rounds 1–3, converged): splice not re-serialize (the scaffold seed and the real `.council.json` are tab-indented — a `JSON.stringify(x, null, 2)` re-serialize breaks the theme-bytes contract); writer = loader's field-level inverse + dispatch's one model-presence predicate, nothing more — **no capability gate** (`getSupportedThinkingLevels` is picker-only; pi clamps at spawn); absent `thinking` **preserves** the pre-existing thinking (field-level merge); malformed-existing-JSON returns an error naming the file, never throws, never writes; mode: existing file's mode survives, greenfield = default umask, never `0o600`.

## Global Constraints

(From spec §§1–8 — verbatim rules; every task inherits these.)

1. **Signature** (§4): `writeSeatOverride({ repoRoot, seat, model, thinking?, catalogue }) → { ok: true } | { ok: false; error: string }` — `model` is a qualified `provider/id`; the catalogue arg carries the selectable `qualifiedId = "${provider}/${id}"` set (the natural fit: `CatalogueModel[]` from `extensions/catalogue.ts`, type-only import).
2. **Validation first** (§5.1): pure, I/O-free, before any filesystem action. ONLY three reject conditions: model unqualified per the loader grammar; model ∉ catalogue qualifiedId set; `thinking` present and ∉ `THINKING_LEVELS`. **No per-model capability check** — a capability-invalid level must be accepted (loader accepts, dispatch accepts, pi clamps at spawn).
3. **Read + parse** (§5.2): absent file → greenfield. Present but unparseable (`JSON.parse` throws, including an empty file) → `{ ok: false, error }` naming the file and the parse message; never throw, never write. Root not an object → refuse (`root must be a JSON object`); `council` present but not an object → refuse. `readFileSync`/rename filesystem failures THROW (asymmetry named in the module docstring).
4. **Splice, three regimes** (§5.3): (a) replace the seat value span with the object form in the file's indent, `model`-before-`thinking`, omit `thinking` when absent, convert string-shorthand spans to object form (thinking carried from a known `:suffix`); (b) insert — seat absent → insert into existing `council` (after the last member, `,`-join; empty council object → re-emit its span); `council` absent → insert a council section before `theme` when present, else after the last root member, else re-emit an empty root `{}`; (c) greenfield — create `{ "council": { "<seat>": { model[, thinking] } } }` with `JSON.stringify(doc, null, 2) + "\n"`.
5. **Field-level merge** (§5.4): absent `thinking` PRESERVES existing thinking; greenfield + no `thinking` → no `thinking` key at all; no way to delete `thinking` in v1. An invalid existing thinking (∉ THINKING_LEVELS) is not preserved (carrying it keeps the file un-loadable); documented edge.
6. **Indent rule** (§5.5): deterministic, throw-free — (1) strict-majority indent unit across indented lines (tab-led vs space-led; space-majority files emit the canonical 2-space unit), (2) else the target seat block's own unit (replace regime), (3) else tabs (matching the tab-indented seed).
7. **Atomic write** (§5.6): `mkdirSync(dirname, { recursive: true })`; tmp = `${file}.tmp-${process.pid}-${Date.now()}`; rewrite → `stat` target mode, `chmod` the tmp to it before `rename`; greenfield → default umask, never explicit `0o600`.
8. **Module surface / imports**: export `THINKING_LEVELS` from `extensions/seats.ts:17` (one line; zero behavior change). Imports: `node:fs`, `node:path`, `THINKING_LEVELS`/`COUNCIL_CONFIG_FILE`/`parseQualifiedModel`/type `AgentOverride` from `./seats.ts`, type `CatalogueModel` from `./catalogue.ts`. No unused imports.
9. **No network/capability**: `grep -nE 'fetch|http|axios|https|undici|node:http' extensions/council-config-writer.ts` must return nothing; `getSupportedThinkingLevels` consumed ONLY by `extensions/catalogue.ts`.
10. **Out of scope** (§8): no command registration, no EV-25 wiring/fetch, no capability gate, no delete-override, no `--dryrun`, no JSON-Patch, no backup-tmp, no config-lock. No wholesale reserialize anywhere in the repo.

---

### Task 1: Implementation plan committed

**Files:**
- Create: `docs/superpowers/plans/2026-09-04-EV-24-merge-write.md` (this file)

- [ ] **Step 1: Write the plan** (this file — embeds the full red test and the full green module for Tasks 2/3, verified against the merged code).
- [ ] **Step 2: Commit**

```bash
git add docs/superpowers/plans/2026-09-04-EV-24-merge-write.md
git commit -m "docs(council-config): EV-24 merge-write implementation plan (2026-09-04)"
```

---

### Task 2: The failing acceptance test (`test/council-config-writer.test.ts`)

**Files:**
- Create: `test/council-config-writer.test.ts`

**Interfaces:**
- Consumes: `writeSeatOverride` + type `WriteSeatOverrideResult` from `../extensions/council-config-writer.ts` (missing until Task 3 — that missing import is the RED). `loadCouncilConfig`/`loadThemeConfig`/`COUNCIL_CONFIG_FILE` from `../extensions/seats.ts` (existing loader round-trip probes); type `CatalogueModel` from `../extensions/catalogue.ts` (type-only).
- Produces: the complete §6 acceptance contract — every assertion below is one `test(...)` in `describe("writeSeatOverride", ...)`.

- [ ] **Step 1: Write the test** — exact content below (tab-indented; `bun:test`; temp repos via `fs.mkdtempSync`, never the real repo):

```tsimport { describe, expect, test } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { createHash } from "node:crypto";
import type { CatalogueModel } from "../extensions/catalogue.ts";
import { writeSeatOverride, type WriteSeatOverrideResult } from "../extensions/council-config-writer.ts";
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
		if (!res!.ok) {
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
});```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd .worktrees/feat/ev-24-merge-write && bun test test/council-config-writer.test.ts`
Expected: FAIL — module `../extensions/council-config-writer.ts` does not exist (`Cannot find module`). The failure must be "feature missing", not a typo.

- [ ] **Step 3: Commit the failing test**

```bash
git add test/council-config-writer.test.ts
git commit -m "test(council-config): EV-24 merge-writer acceptance contract (red)"
```

---

### Task 3: The writer (`extensions/council-config-writer.ts`) + THINKING_LEVELS export

**Files:**
- Modify: `extensions/seats.ts:17` — `const THINKING_LEVELS` → `export const THINKING_LEVELS` (one line, behavior-neutral; no consumers beyond the writer per the grep gate).
- Create: `extensions/council-config-writer.ts`

- [ ] **Step 1: Export THINKING_LEVELS**

```ts
export const THINKING_LEVELS = new Set(["off", "minimal", "low", "medium", "high", "xhigh", "max"]);
```

- [ ] **Step 2: Write the implementation** — `extensions/council-config-writer.ts` with the exact content below (tabs, `node:fs` atomic-write pattern, string-aware byte-span scanner, three splice regimes, deterministic indent rule):

```tsimport * as fs from "node:fs";
import * as path from "node:path";
import { COUNCIL_CONFIG_FILE, THINKING_LEVELS, parseQualifiedModel } from "./seats.ts";
import type { AgentOverride } from "./seats.ts";
import type { CatalogueModel } from "./catalogue.ts";

/**
 * EV-24: the first `.council.json` write path. It validates a seat's (model,
 * thinking) selection against the flat catalogue `qualifiedId` set and
 * `THINKING_LEVELS`, then atomically merges `council.<seat>` into
 * `.council.json` as the object form `{ "model": "provider/id", "thinking":
 * "<level>" }` the loader already speaks.
 *
 * The write is a SPLICE, not a re-serialize: the seat value's byte span is
 * located with a string-aware scan (escaped quotes do not terminate strings,
 * so a string containing the literal seat name is never misread), and only
 * that span is replaced or a new one inserted. The `theme` section, every
 * other seat, unknown top-level keys, the file's own indentation, and the
 * trailing newline are byte-identical by construction — a whole-object
 * `JSON.stringify(x, null, 2)` would reformat the tab-indented committed file
 * on the first write and violate the "never disturbs the theme sibling"
 * contract (spec §2: scaffold and real `.council.json` are `^I`-tabbed).
 *
 * Validation is the writer's ONLY stricter-than-runtime surface, and it
 * mirrors the loader's grammar + dispatch's model-presence exactly: (1) model
 * must be a qualified `provider/id` (loader grammar, `parseQualifiedModel`);
 * (2) model must be in the catalogue `qualifiedId` set (dispatch's gate);
 * (3) `thinking` present must be a member of `THINKING_LEVELS` (loader
 * grammar). There is deliberately NO per-model capability check:
 * `getSupportedThinkingLevels` / `supportedThinkingLevels` are picker-only
 * (`extensions/catalogue.ts` is their sole consumer) and never a persistence
 * gate; the file loader checks grammar only, dispatch checks model presence
 * only, and pi's `clampThinkingLevel` clamps at spawn — a capability-invalid
 * value must be accepted and round-tripped here.
 *
 * Failure contract (asymmetry named here so it is intentional): validation
 * failures and malformed existing JSON return `{ ok: false, error }` and write
 * NOTHING (a mid-edit or unparseable file must never be clobbered). ONLY
 * filesystem failures throw: an unreadable target or an atomic-rename error
 * (EROFS/ENOSPC, target is a directory).
 */
export type WriteSeatOverrideResult = { ok: true } | { ok: false; error: string };

/** One JSON object member with the byte span of its key and value. */
interface Member {
	key: string;
	keyStart: number; // offset of the key's opening quote
	value: ValueNode;
}

/** Byte span + structure of one JSON value inside the raw file text. */
interface ValueNode {
	start: number; // offset of the value's first byte
	end: number; // one past the value's last byte
	kind: "object" | "array" | "string" | "scalar";
	members?: Member[]; // present when kind === "object"
}

function skipSpace(text: string, i: number): number {
	while (i < text.length && (text[i] === " " || text[i] === "\t" || text[i] === "\n" || text[i] === "\r")) i++;
	return i;
}

/** text[i] must be `"`. Returns one-past the closing quote, walking escapes:
 *  `\"` does not terminate the string and `\uXXXX` hex digits cannot. */
function scanString(text: string, i: number): number {
	i++;
	while (i < text.length) {
		const c = text[i];
		if (c === "\\") i += 2;
		else if (c === '"') return i + 1;
		else i++;
	}
	return i;
}

/** Consume a scalar (number / true / false / null). The JSON.parse gate
 *  guarantees the token is well-formed; this only needs its byte span. */
function scanScalar(text: string, i: number): number {
	while (i < text.length && /[-0-9a-zA-Z.+]/.test(text[i])) i++;
	return i;
}

/** Recursive-descent byte-span scan over an already-parse-valid JSON text.
 *  Strings (incl. escaped quotes) are skipped atomically, so a key never
 *  collides with the literal seat name appearing inside unrelated strings. */
function parseValue(text: string, i: number): { node: ValueNode; next: number } {
	const start = i;
	const c = text[i];
	if (c === '"') {
		const end = scanString(text, i);
		return { node: { start, end, kind: "string" }, next: end };
	}
	if (c === "{") {
		const members: Member[] = [];
		i = skipSpace(text, i + 1);
		if (text[i] === "}") {
			return { node: { start, end: i + 1, kind: "object", members }, next: i + 1 };
		}
		for (;;) {
			const keyStart = i;
			const keyEnd = scanString(text, i);
			const key = text.slice(keyStart + 1, keyEnd - 1);
			i = skipSpace(text, keyEnd); // text[i] === ":"
			i = skipSpace(text, i + 1);
			const parsed = parseValue(text, i);
			members.push({ key, keyStart, value: parsed.node });
			i = skipSpace(text, parsed.next);
			if (text[i] === ",") {
				i = skipSpace(text, i + 1);
				continue;
			}
			// text[i] === "}" — parse-valid input guarantees the loop ends here.
			return { node: { start, end: i + 1, kind: "object", members }, next: i + 1 };
		}
	}
	if (c === "[") {
		let depth = 0;
		for (;;) {
			if (i >= text.length) return { node: { start, end: i, kind: "array" }, next: i };
			const ch = text[i];
			if (ch === '"') {
				i = scanString(text, i);
				continue;
			}
			if (ch === "[") depth++;
			else if (ch === "]") {
				depth--;
				if (depth === 0) return { node: { start, end: i + 1, kind: "array" }, next: i + 1 };
			}
			i++;
		}
	}
	const end = scanScalar(text, i);
	return { node: { start, end, kind: "scalar" }, next: end };
}

function lineStartAt(text: string, at: number): number {
	let i = at - 1;
	while (i >= 0 && text[i] !== "\n") i--;
	return i + 1;
}

/** Leading whitespace of the line containing `at`. Empty when `at` is not the
 *  first token of its line (single-line objects). */
function lineIndentAt(text: string, at: number): string {
	const ls = lineStartAt(text, at);
	let j = ls;
	while (j < at && (text[j] === " " || text[j] === "\t")) j++;
	return text.slice(ls, j);
}

/**
 * §5.5 indent rule — deterministic and throw-free, in order: (1) strict-
 * majority indent unit across indented lines (tab-led vs space-led lines;
 * space-majority files emit the canonical 2-space unit); (2) else the
 * replaced seat block's own unit; (3) else tabs (the tab-indented seed).
 * Never throws over whitespace.
 */
function detectIndentUnit(text: string, seatBlockUnit?: string): string {
	let tabs = 0;
	let spaces = 0;
	for (const line of text.split("\n")) {
		const m = /^([ \t]+)\S/.exec(line);
		if (!m) continue;
		if (m[1][0] === "\t") tabs++;
		else spaces++;
	}
	if (tabs > spaces) return "\t";
	if (spaces > tabs) return "  ";
	return seatBlockUnit !== undefined && seatBlockUnit.length > 0 ? seatBlockUnit : "\t";
}

/** The replaced seat block's own indent unit — only meaningful when the old
 *  value is a multi-line object whose members sit exactly one unit deeper. */
function seatBlockUnit(text: string, value: ValueNode, keyLineIndent: string): string | undefined {
	if (value.kind !== "object" || value.members === undefined || value.members.length === 0) return undefined;
	const memberIndent = lineIndentAt(text, value.members[0].keyStart);
	if (!memberIndent.startsWith(keyLineIndent)) return undefined;
	const unit = memberIndent.slice(keyLineIndent.length);
	return unit.length > 0 ? unit : undefined;
}

/** The object form `{ "model": ..., "thinking": ... }`, model-before-thinking,
 *  members one `unit` deeper than `keyIndent`, closing at `keyIndent`; the
 *  `thinking` line is omitted entirely when absent. */
function emitSeatObject(keyIndent: string, unit: string, value: AgentOverride): string {
	const memberIndent = keyIndent + unit;
	const modelLine = `${memberIndent}"model": ${JSON.stringify(value.model!)}`;
	if (value.thinking === undefined) {
		return `{\n${modelLine}\n${keyIndent}}`;
	}
	return `{\n${modelLine},\n${memberIndent}"thinking": ${JSON.stringify(value.thinking)}\n${keyIndent}}`;
}

/** Existing thinking of `parsedDoc.council[seat]`: a string-shorthand
 *  `:suffix` or the object's `thinking` key. Only members of THINKING_LEVELS
 *  are preserved — carrying an invalid level along would keep the file
 *  un-loadable, so a broken value is dropped instead of byte-kept. */
function existingThinking(parsedDoc: unknown, seat: string): string | undefined {
	const council = (parsedDoc as Record<string, unknown>).council;
	if (typeof council !== "object" || council === null || Array.isArray(council)) return undefined;
	const raw = (council as Record<string, unknown>)[seat];
	if (typeof raw === "string") {
		const colon = raw.lastIndexOf(":");
		if (colon > 0 && THINKING_LEVELS.has(raw.slice(colon + 1))) return raw.slice(colon + 1);
		return undefined;
	}
	if (typeof raw === "object" && raw !== null && !Array.isArray(raw)) {
		const t = (raw as Record<string, unknown>).thinking;
		if (typeof t === "string" && THINKING_LEVELS.has(t)) return t;
	}
	return undefined;
}

/** Permission bits of the existing target, so a tmp+rename never silently
 *  resets e.g. 0600 → default. Greenfield callers pass `undefined`. */
function existingMode(file: string): number | undefined {
	try {
		return fs.statSync(file).mode & 0o777;
	} catch {
		return undefined;
	}
}

/**
 * auth-store pattern (§5.6): recursive mkdir, unique tmp, chmod the tmp to
 * the existing target's mode BEFORE rename, then atomic rename. A rename
 * failure (EROFS/ENOSPC, target is a directory) THROWS — filesystem failures
 * are not convertible to `{ ok: false }`. Greenfield: no chmod — the default
 * umask applies; never explicit 0o600 (`.council.json` is a committed shared
 * file, not a secrets store).
 */
function writeAtomic(file: string, content: string, mode?: number): void {
	fs.mkdirSync(path.dirname(file), { recursive: true });
	const tmp = `${file}.tmp-${process.pid}-${Date.now()}`;
	fs.writeFileSync(tmp, content);
	if (mode !== undefined) fs.chmodSync(tmp, mode);
	fs.renameSync(tmp, file);
}

export function writeSeatOverride(args: {
	repoRoot: string;
	seat: string;
	model: string; // qualified "provider/id" — MUST match a catalogue qualifiedId
	thinking?: string; // when absent, existing thinking is PRESERVED
	catalogue: CatalogueModel[];
}): WriteSeatOverrideResult {
	const { repoRoot, seat, model, thinking, catalogue } = args;
	const where = "writeSeatOverride";

	// ---- 1. Validate (pure, I/O-free; nothing happens on any failure) ----
	let qualified: string;
	let inlineThinking: string | undefined;
	try {
		const parsed = parseQualifiedModel(model, where);
		qualified = parsed.model;
		inlineThinking = parsed.thinkingLevel;
	} catch (e) {
		return { ok: false, error: e instanceof Error ? e.message : String(e) };
	}
	if (!catalogue.some((c) => `${c.provider}/${c.id}` === qualified)) {
		return { ok: false, error: `${where}: model "${qualified}" is not in the available model catalogue` };
	}
	if (thinking !== undefined && !THINKING_LEVELS.has(thinking)) {
		return { ok: false, error: `${where}: thinking must be one of ${[...THINKING_LEVELS].join(", ")}` };
	}
	// Selection = explicit thinking key > inline `:suffix`; both per the loader
	// precedence (thinking key > :suffix). Absent either → merge keeps existing.
	const selection: AgentOverride = { model: qualified };
	if (thinking !== undefined) selection.thinking = thinking;
	else if (inlineThinking !== undefined) selection.thinking = inlineThinking;

	const file = path.join(repoRoot, COUNCIL_CONFIG_FILE);

	// ---- 2a. Greenfield: file absent — canonical 2-space + trailing newline ----
	if (!fs.existsSync(file)) {
		const doc = { council: { [seat]: selection } };
		writeAtomic(file, JSON.stringify(doc, null, 2) + "\n");
		return { ok: true };
	}

	// ---- 2b. Read + parse. Malformed / non-object root → refuse, never write. ----
	let text: string;
	try {
		text = fs.readFileSync(file, "utf-8");
	} catch (e) {
		throw e; // filesystem failure — throws by design
	}
	let parsedDoc: unknown;
	try {
		parsedDoc = JSON.parse(text);
	} catch (e) {
		return { ok: false, error: `${file}: malformed JSON — ${e instanceof Error ? e.message : String(e)}` };
	}
	if (typeof parsedDoc !== "object" || parsedDoc === null || Array.isArray(parsedDoc)) {
		return { ok: false, error: `${file}: root must be a JSON object` };
	}

	// ---- 3. Locate the council.<seat> value byte span (string-aware scan) ----
	const root = parseValue(text, skipSpace(text, 0)).node;
	const rootMembers = root.kind === "object" ? (root.members ?? []) : [];
	const councilMember = rootMembers.find((m) => m.key === "council");
	const quotedSeat = JSON.stringify(seat);

	if (councilMember !== undefined && councilMember.value.kind !== "object") {
		return { ok: false, error: `${file}: "council" must be an object keyed by seat name` };
	}

	if (councilMember !== undefined) {
		const councilNode = councilMember.value;
		const seatMembers = councilNode.members!.filter((m) => m.key === seat);

		if (seatMembers.length > 0) {
			// ---- (a) replace: re-emit the seat value span as the object form ----
			const member = seatMembers[seatMembers.length - 1]; // last wins — JSON.parse semantics
			const keyLineIndent = lineIndentAt(text, member.keyStart);
			const merged: AgentOverride = { ...selection };
			// Field-level merge: absent thinking PRESERVES the pre-existing one.
			if (merged.thinking === undefined) {
				const existing = existingThinking(parsedDoc, seat);
				if (existing !== undefined) merged.thinking = existing;
			}
			const unit = detectIndentUnit(text, seatBlockUnit(text, member.value, keyLineIndent));
			const emitted = emitSeatObject(keyLineIndent, unit, merged);
			const patched = text.slice(0, member.value.start) + emitted + text.slice(member.value.end);
			writeAtomic(file, patched, existingMode(file));
			return { ok: true };
		}

		// ---- (b) insert: seat absent — splice the object after the last member ----
		const unit = detectIndentUnit(text);
		if (councilNode.members!.length > 0) {
			const last = councilNode.members![councilNode.members!.length - 1];
			const insertIndent = lineIndentAt(text, last.keyStart);
			const insertion = `,\n${insertIndent}${quotedSeat}: ${emitSeatObject(insertIndent, unit, selection)}`;
			const patched = text.slice(0, last.value.end) + insertion + text.slice(last.value.end);
			writeAtomic(file, patched, existingMode(file));
			return { ok: true };
		}
		// Empty council object `{}` — re-emit its span fully formed.
		const councilKeyIndent = lineIndentAt(text, councilMember.keyStart);
		const memberIndent = councilKeyIndent + unit;
		const insertion = `{\n${memberIndent}${quotedSeat}: ${emitSeatObject(memberIndent, unit, selection)}\n${councilKeyIndent}}`;
		const patched = text.slice(0, councilNode.start) + insertion + text.slice(councilNode.end);
		writeAtomic(file, patched, existingMode(file));
		return { ok: true };
	}

	// ---- (c) council absent — insert a council section (scaffold order) ----
	const unit = detectIndentUnit(text);
	const themeMember = rootMembers.find((m) => m.key === "theme");
	if (themeMember !== undefined) {
		// Scaffold order: council before theme.
		const themeKeyIndent = lineIndentAt(text, themeMember.keyStart);
		const memberIndent = themeKeyIndent + unit;
		const insertion =
			`${themeKeyIndent}"council": {\n` +
			`${memberIndent}${quotedSeat}: ${emitSeatObject(memberIndent, unit, selection)}\n` +
			`${themeKeyIndent}},\n`;
		const at = lineStartAt(text, themeMember.keyStart);
		const patched = text.slice(0, at) + insertion + text.slice(at);
		writeAtomic(file, patched, existingMode(file));
		return { ok: true };
	}
	if (rootMembers.length > 0) {
		const last = rootMembers[rootMembers.length - 1];
		const insertIndent = lineIndentAt(text, last.keyStart);
		const memberIndent = insertIndent + unit;
		const insertion = `,\n${insertIndent}"council": {\n${memberIndent}${quotedSeat}: ${emitSeatObject(memberIndent, unit, selection)}\n${insertIndent}}`;
		const patched = text.slice(0, last.value.end) + insertion + text.slice(last.value.end);
		writeAtomic(file, patched, existingMode(file));
		return { ok: true };
	}
	// Empty root object — re-emit as a fresh structure at the file's unit.
	const inner = `${unit}${unit}${quotedSeat}: ${emitSeatObject(unit + unit, unit, selection)}`;
	const patched = `{\n${unit}"council": {\n${inner}\n${unit}}\n}`;
	writeAtomic(file, patched, existingMode(file));
	return { ok: true };
}```

- [ ] **Step 3: Verify GREEN**

Run: `cd .worktrees/feat/ev-24-merge-write && bun test test/council-config-writer.test.ts`
Expected: the whole new file passes (13 tests), matching spec §6.

- [ ] **Step 4: Confirm the §7 greps**

Run:
```bash
grep -nE 'fetch|http|axios|https|undici|node:http' extensions/council-config-writer.ts   # expect: nothing (exit 1)
grep -rn "getSupportedThinkingLevels" extensions/   # expect: only extensions/catalogue.ts
```

- [ ] **Step 5: Commit the implementation**

```bash
git add extensions/seats.ts extensions/council-config-writer.ts
git commit -m "feat(council-config): non-destructive .council.json splice merge-write (EV-24)"
```

---

### Task 4: Full gate sweep (all in order)

**Files:** none — verification only.

- [ ] **Step 1: Typecheck** — `bunx tsc --noEmit` (repo gate 1; also the CI `gates` workflow's first `run`). Exit 0, no output. Hard stop-and-fix if not.
- [ ] **Step 2: Full suite** — `bun test` (repo gate 2). Baseline 460 pass / 2 skip / 0 fail (462 tests / 50 files) + the 13 new; everything green, `test/council-config-writer.test.ts` green inside the full suite. No skip-dodges, no scope narrowing.
- [ ] **Step 3: Artifact validation** — `python3 council/validate.py` (repo gate 3). `All council artifacts valid`, exit 0.
- [ ] **Step 4: Re-run the §7 greps** and record verbatim.

---

### Task 5: Push and open the PR

- [ ] **Step 1:** `git push origin feat/ev-24-merge-write`; record the head SHA via `git rev-parse HEAD`.
- [ ] **Step 2:** `gh pr create --base main --head feat/ev-24-merge-write --title "feat(council-config): non-destructive .council.json merge-write (EV-24)" --body "..."` — cite spec `docs/superpowers/specs/2026-09-04-EV-24-design.md`, the splice / grammar-and-presence / capability rulings, and the local gate evidence verbatim.
- [ ] **Step 3:** Report — approach, gate outputs (tsc exit, test summary line, validate output, grep results), PR number/URL, pushed head SHA. Do NOT poll CI.