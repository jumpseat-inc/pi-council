# EV-62 Gate Policy and Question Set — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the metered-deliberation gate's data surface — packaged `council/gate/policy.json` + `council/gate/questions.json`, whole-file first-hit repo overrides, and fail-loud validation — without wiring the gate into the council loop (that is EV-63/EV-65).

**Architecture:** One new module `extensions/gate.ts` (loader + validator, mirroring `seatDirs`/`loadRetryConfig` precedents) plus two packaged JSON data files. Repo-local overrides at `<repo>/$CONFIG_DIR_NAME/council/gate/<file>.json` shadow the packaged default whole-file: first existing file wins, validated standalone, never merged. All validation failures throw a single-line `FAIL:` error naming the offending file and key.

**Tech Stack:** TypeScript (strict), `bun:test`, `node:fs`/`node:path`, `CONFIG_DIR_NAME` from `@earendil-works/pi-coding-agent`.

**Spec:** `council/cards/EV-62.md` (Intent/goal/Acceptance + Phase 1 ruling R3, binding).

## Global Constraints

- Packaged `policy.json` MUST ship `mode: "off"` (R3, binding). Tests exercising a non-`off` mode set it explicitly in a temp repo; never rely on the packaged default being on.
- Whole-file first-hit resolution; NO field-level merge between repo and packaged halves (AGENTS.md convention #5 pattern).
- `$CONFIG_DIR_NAME` from `@earendil-works/pi-coding-agent` — never a hardcoded `.pi` (AGENTS.md convention #3).
- Model id pinned to `typesafe/jev-1.13`; NEVER `~typesafe/jev-latest`. Endpoint `https://openrouter.ai/api/alpha/decisions`.
- Failure line is EXACTLY (single line, em dashes, never a stack trace):
  `FAIL: <file> has an invalid <key> — <what was found> — set a valid value or remove the key to use the packaged default`
- `policy.json` `mode` ∈ `off` | `advisory` | `active`; an absent `mode` key resolves to `off`.
- Do NOT wire the gate into the council loop, do NOT scaffold-copy the gate files (data-class scaffold files are never written), run the ordinary path everywhere.
- Offline tests only; `COUNCIL_INTEGRATION=1` arms stay off.
- Bump `version` in `package.json` in the same PR (engine + packaged payload change).
- Do not edit `council/board.md` or `council/cards/EV-62.md` (facilitator-owned).

## Review Focus

- **A repo override with an invalid value must throw naming the repo file, not silently fall back to the packaged field** — the whole "a silently defaulted policy is an untested policy" clause. Test: repo `mode: "on"` throws with the repo file's path in the FAIL line (Task 2, exact-equality assertion).
- **Absent `mode` resolves to `off`, not to the packaged file's literal mode** — a repo policy omitting `mode` is validated standalone. Test: repo file without `mode` resolves `mode === "off"` (Task 2).
- **Malformed JSON must surface as one `FAIL:` line, never a raw `SyntaxError` stack** — the parse-error detail is newline-sanitized so V8's raw-input snippet cannot break the single-line contract. Test: `expect(msg).not.toMatch(/\n/)` (Task 3).
- **Questions validation must not accept an empty question record** — a gate with zero questions is a misconfiguration, not a vacuous pass. Test: empty `questions` object throws (Task 3).
- **The packaged files are data the package ships, not scaffold output** — nothing in `council/scaffold/` references them, and `scaffoldInto` is untouched (verified by reading `extensions/scaffold.ts` copy list; no change needed).

---

### Task 1: `extensions/gate.ts` — resolution + fail-loud validation for policy.json

**Files:**
- Create: `extensions/gate.ts`
- Test: `test/gate.test.ts`
- Modify: `package.json` (version bump — Task 4, but listed here so the PR diff is coherent)

**Interfaces:**
- Consumes: `CONFIG_DIR_NAME` from `@earendil-works/pi-coding-agent`; `PKG_ROOT` from `./seats.ts` (the established import, no duplicate computation).
- Produces (EV-63/EV-65 will consume these exact names):
  - `type GateMode = "off" | "advisory" | "active"`
  - `const GATE_MODES: readonly GateMode[]`
  - `interface GatePolicy { policyVersion: string; mode: GateMode; model: string; endpoint: string }`
  - `loadGatePolicy(repoRoot: string): GatePolicy`
  - `loadGateQuestions(repoRoot: string): GateQuestionSet` (Task 3)
  - `GATE_PINNED_MODEL = "typesafe/jev-1.13"`, `GATE_ENDPOINT = "https://openrouter.ai/api/alpha/decisions"`

- [ ] **Step 1: Write the failing test** — `test/gate.test.ts`, packaged-default resolution:

```ts
import { test, expect } from "bun:test";
import { loadGatePolicy } from "../extensions/gate.ts";

test("absent repo file yields the packaged default with a non-empty policyVersion and the pinned model", () => {
	const policy = loadGatePolicy("/nonexistent-repo-root-ev62");
	expect(policy.policyVersion.length).toBeGreaterThan(0);
	expect(policy.model).toBe("typesafe/jev-1.13");
	expect(policy.endpoint).toBe("https://openrouter.ai/api/alpha/decisions");
});

test("the resolved default model id is never the alias", () => {
	const policy = loadGatePolicy("/nonexistent-repo-root-ev62");
	expect(policy.model).not.toContain("~typesafe/jev-latest");
});
```

- [ ] **Step 2: Run to verify RED** — `bun test test/gate.test.ts` → fails: module `../extensions/gate.ts` does not exist.
- [ ] **Step 3: Minimal implementation** — `extensions/gate.ts`:

```ts
import * as fs from "node:fs";
import * as path from "node:path";
import { CONFIG_DIR_NAME } from "@earendil-works/pi-coding-agent";
import { PKG_ROOT } from "./seats.ts";

export const GATE_PINNED_MODEL = "typesafe/jev-1.13"; // versioned pin, never "~typesafe/jev-latest"
export const GATE_ENDPOINT = "https://openrouter.ai/api/alpha/decisions";
export const GATE_MODES = ["off", "advisory", "active"] as const;
export type GateMode = (typeof GATE_MODES)[number];

export interface GatePolicy {
	policyVersion: string;
	mode: GateMode;
	model: string;
	endpoint: string;
}

function gateDirs(repoRoot: string): string[] {
	return [path.join(repoRoot, CONFIG_DIR_NAME, "council", "gate"), path.join(PKG_ROOT, "council", "gate")];
}

function gateFail(file: string, key: string, found: string): Error {
	const detail = found.replace(/[\r\n]+/g, " "); // single line, never a stack-trace-shaped message
	return new Error(
		`FAIL: ${file} has an invalid ${key} — ${detail} — set a valid value or remove the key to use the packaged default`,
	);
}

function readGateJson(dirs: string[], name: string): unknown {
	for (const dir of dirs) {
		const file = path.join(dir, name);
		if (!fs.existsSync(file)) continue;
		try {
			return JSON.parse(fs.readFileSync(file, "utf-8"));
		} catch (e) {
			throw gateFail(file, "JSON", `not parseable as JSON: ${e instanceof Error ? e.message : String(e)}`);
		}
	}
	throw new Error(`gate: no ${name} found (looked in ${dirs.join(", ")})`);
}

function nonEmptyString(file: string, key: string, v: unknown): string {
	if (typeof v !== "string" || v.trim() === "") {
		throw gateFail(file, key, `expected a non-empty string, found ${JSON.stringify(v)}`);
	}
	return v;
}

export function loadGatePolicy(repoRoot: string): GatePolicy {
	const dirs = gateDirs(repoRoot);
	const file = /* the first existing file, else the packaged one for error text */;
	const parsed = readGateJson(dirs, "policy.json") as Record<string, unknown>;
	// validate keys + values ...
}
```

(Actual commit expands the skipped ellipses fully — unknown-key loop over `Object.keys`, required `policyVersion`/`model`/`endpoint`, optional `mode` ∈ `GATE_MODES` defaulting to `"off"`, and the first-hit file identity captured during `readGateJson` so error text names the real file read.)

- [ ] **Step 4: Run to verify GREEN** — `bun test test/gate.test.ts` passes; then continue TDD per task below.
- [ ] **Step 5: Commit** — `feat(gate): EV-62 packaged gate policy with whole-file first-hit resolution`

### Task 2: Repo override shadows whole-file; absent mode → off; invalid values fail loud

**Files:** Modify `test/gate.test.ts`, `extensions/gate.ts` (as needed).

- [ ] **Step 1: Failing tests** (temp `mkdtemp` repos, paths built with `CONFIG_DIR_NAME`):

```ts
const repoPolicy = (root: string, body: unknown) => {
	const dir = path.join(root, CONFIG_DIR_NAME, "council", "gate");
	fs.mkdirSync(dir, { recursive: true });
	fs.writeFileSync(path.join(dir, "policy.json"), typeof body === "string" ? body : JSON.stringify(body));
};

test("a repo-local policy.json shadows the packaged default whole-file", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "council-gate-"));
	repoPolicy(root, {
		policyVersion: "test-policy-9",
		mode: "active",
		model: "typesafe/jev-1.13-test",
		endpoint: "https://example.test/decisions",
	});
	expect(loadGatePolicy(root)).toEqual({
		policyVersion: "test-policy-9",
		mode: "active",
		model: "typesafe/jev-1.13-test",
		endpoint: "https://example.test/decisions",
	});
});

test("an absent mode key resolves to off", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "council-gate-"));
	repoPolicy(root, {
		policyVersion: "test-policy-9",
		model: "typesafe/jev-1.13-test",
		endpoint: "https://example.test/decisions",
	});
	expect(loadGatePolicy(root).mode).toBe("off");
});

test("a malformed repo policy throws a single FAIL line naming the file", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "council-gate-"));
	repoPolicy(root, "{ not json");
	let msg = "";
	try {
		loadGatePolicy(root);
	} catch (e) {
		msg = (e as Error).message;
	}
	expect(msg).not.toMatch(/\n/);
	expect(msg).toMatch(/^FAIL: .*policy\.json has an invalid JSON — not parseable as JSON: .+ — set a valid value or remove the key to use the packaged default$/);
});

test("an unknown key throws the FAIL line naming the key", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "council-gate-"));
	repoPolicy(root, { policyVersion: "p", mode: "off", model: "m", endpoint: "https://x/", bogus: 1 });
	expect(() => loadGatePolicy(root)).toThrow(
		`FAIL: ${path.join(root, CONFIG_DIR_NAME, "council", "gate", "policy.json")} has an invalid bogus — unknown key; expected one of mode, policyVersion, model, endpoint — set a valid value or remove the key to use the packaged default`,
	);
});

test("an invalid mode value throws the FAIL line naming the key and what was found", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "council-gate-"));
	repoPolicy(root, { policyVersion: "p", mode: "on", model: "m", endpoint: "https://x/" });
	expect(() => loadGatePolicy(root)).toThrow(
		`FAIL: ${path.join(root, CONFIG_DIR_NAME, "council", "gate", "policy.json")} has an invalid mode — expected one of "off", "advisory", "active", found "on" — set a valid value or remove the key to use the packaged default`,
	);
});
```

- [ ] **Step 2: Verify RED** (unknown-key/mode messages will fail until validation exists), **Step 3: implement**, **Step 4: GREEN**, **Step 5: commit** — `feat(gate): EV-62 repo-local policy override, absent-mode off, fail-loud FAIL lines`

### Task 3: Packaged `questions.json` + `loadGateQuestions`

**Files:** Create `council/gate/questions.json`; Modify `extensions/gate.ts`, `test/gate.test.ts`.

- [ ] **Step 1: Failing tests** — packaged default (non-empty `version`, ≥1 question, all types ∈ choice/noul/score); repo override shadowing whole-file; malformed questions throws the FAIL line.

```ts
test("packaged question set loads with a version and well-typed questions", () => {
	const qs = loadGateQuestions("/nonexistent-repo-root-ev62");
	expect(qs.version.length).toBeGreaterThan(0);
	expect(Object.keys(qs.questions).length).toBeGreaterThan(0);
	for (const q of Object.values(qs.questions)) {
		expect(["choice", "noul", "score"]).toContain(q.type);
	}
});
```

- [ ] **Step 2–5: RED → implement (`council/gate/questions.json` + validation: allowed keys `version`/`questions`; per-question keys exactly `type`/`instructions`/`criteria`; `criteria` is an option→description record for `choice`/`noul` and an ordered non-empty string array for `score`; empty `questions` record is invalid) → GREEN → commit** — `feat(gate): EV-62 packaged question set with repo-local override and fail-loud validation`

### Task 4: Version bump + gates

- [ ] Bump `version` in `package.json` (0.20.0 → 0.21.0: engine + packaged payload change).
- [ ] Clear the four gates in order in the worktree, recording real output:
  1. `bash council/preflight.sh EV-62`
  2. `bunx tsc --noEmit`
  3. `bun test`
  4. `python3 council/validate.py`
- [ ] Push branch, open PR titled for EV-62 with gate results + head SHA. Do not poll CI.

## Self-Review

- Spec coverage: packaged defaults (Task 1/3, files), first-hit whole-file (Task 2), fail-loud 3 classes + exact FAIL line (Tasks 2–3), mode vocabulary + absent→off (Tasks 1–2), pinned model + alias test (Task 1), absent-repo-file → policyVersion/model test (Task 1), scope boundary respected (no wiring, no scaffold copy), version bump (Task 4). ✔
- Placeholders: none — code blocks carry real content; the one ellipsis in Task 1 Step 3 is marked "actual commit expands fully" and lists the exact remaining rules.
- Type consistency: `GatePolicy`/`GateQuestionSet` names used identically across tasks. ✔
- Review Focus: each of the five entries has an owning test as named. ✔
