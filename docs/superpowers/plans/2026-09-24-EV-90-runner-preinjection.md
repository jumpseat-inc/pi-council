# EV-90 — Runner procedure pre-injection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A `council-runner` dispatch input carries the `renderProcedure`-substituted bodies of `council.md` (card id) and `features-deliver.md` (derived epic key), and the runner seat's `<procedure>` block affirms the in-input blocks instead of mandating disk reads.

**Architecture:** One exported pure composer `composeRunnerInput(repoRoot, cardId, taskInput)` in `extensions/seats.ts` (per-file override-first body resolution, scan-identical frontmatter strip, two-args binding, D1 fail-loud epic-null throw, verbatim `<task>` tail); `renderProcedure` relocates from `index.ts` into `seats.ts` with an `index.ts` re-export (import graph is binding); one guarded call site in `hub-tools.ts` computes the composed string once and reuses it at both `buildChildArgv` sites (initial + retry `attemptSpec`); a new optional `card_id` param on `council_dispatch` with a refusal naming the parameter and the seat; AC3 rewrite of `council/agents/council-runner.md`'s `<procedure>` opening (affirmation + interpretation instruction).

**Tech Stack:** TypeScript (strict, `bunx tsc --noEmit`), `bun:test`, TypeBox tool schemas.

**Spec:** `docs/superpowers/specs/2026-09-24-EV-90-design.md` (§§1–7). Card: `council/cards/EV-90.md` — the D1-epic-null product-owner ruling recorded there is binding: epic-null/absent → fail-loud throw naming the card; no-throw variants rejected.

## Global Constraints

- No `package.json` version bump (spec §7).
- AGENTS.md: no hardcoded `.pi` — use `CONFIG_DIR_NAME`; no hardcoded clone paths — `PKG_ROOT`; Conventional Commits; no history rewriting.
- `buildSystemPrompt`, `buildChildArgv`, `dispatch.ts`, the eval path, `hub.ts`: untouched (spec §§3, 7). `<council_runtime>` pointer unchanged; no new substitution token (AC4).
- Non-runner `council_dispatch` calls stay byte-identical (AC5 governs the enumerated fields).
- `renderProcedure`'s substitution set and `buildSystemPrompt`'s block order unchanged; `test/render.test.ts` pins stay green untouched (AC4, FLLWUP-107).
- Main checkout branch state immutable; all work in the `.worktrees/ev-90` worktree.

## Review Focus

- **Partial-override repos:** a `proceduresDir(repoRoot)`-join composer reads the wrong (unstripped, ENOENT) bodies — pinned by the per-file override falsifier (Task 1).
- **Tautological byte-identity:** `includes(renderProcedure(body, dir, args))` with self-chosen args never reds — every byte-identity assertion is paired with load-bearing substituted-substring assertions in both directions (Task 2).
- **`$&`-corrupted task text:** passing `taskInput` through `.replace` corrupts arbitrary prose — pinned by the verbatim-tail test (Task 3).
- **Epic-null silent degradation:** `epic: null`/absent must throw naming the card, per the D1 ruling — pinned pure and at the tool seam (Tasks 4 and 6).
- **Retry divergence:** initial and retry attempts must carry byte-identical composed input — pinned by the respawn argv assertion (Task 6).

---

### Task 1: Composer + `renderProcedure` relocation in `extensions/seats.ts`

**Files:**
- Modify: `extensions/seats.ts` (add `composeRunnerInput`, `renderProcedure`, private helpers near `proceduresDir` ≈line 557)
- Modify: `extensions/index.ts` (remove the `renderProcedure` definition at ≈148–153; import + re-export from `./seats.ts`)
- Test: `test/ev90-runner-input.test.ts` (new, adjacent to `test/render.test.ts`)

**Interfaces:**
- Consumes: `proceduresDir(repoRoot)` (exists, `seats.ts:557`), `PKG_ROOT`, `CONFIG_DIR_NAME` (both already in `seats.ts`).
- Produces: `export function composeRunnerInput(repoRoot: string, cardId: string, taskInput: string): string`; `export function renderProcedure(strippedBody: string, procDir: string, args?: string): string` (moved, byte-identical behavior); `index.ts` re-exports `renderProcedure`.

- [ ] **Step 1: Write the failing tests** in new `test/ev90-runner-input.test.ts`:

```ts
import { test, expect, afterEach, beforeEach } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { CONFIG_DIR_NAME } from "@earendil-works/pi-coding-agent";
import { composeRunnerInput, proceduresDir, PKG_ROOT } from "../extensions/seats.ts";

function tmpRepo(): string {
	return fs.mkdtempSync(path.join(os.tmpdir(), "ev90-"));
}

function writeCardFace(root: string, cardId: string, epic: string | null | undefined): void {
	fs.mkdirSync(path.join(root, "council", "cards"), { recursive: true });
	const epicLine = epic === undefined ? "" : `epic: ${epic}\n`;
	fs.writeFileSync(
		path.join(root, "council", "cards", `${cardId}.md`),
		`---\nid: ${cardId}\n${epicLine}state: In Progress\n---\nface body`,
	);
}

// (1) per-file override falsifier
test("EV-90 §6.1: per-file override-first — override council.md + packaged features-deliver.md", () => {
	const root = tmpRepo();
	const ov = path.join(root, CONFIG_DIR_NAME, "council", "procedures");
	fs.mkdirSync(ov, { recursive: true });
	fs.writeFileSync(
		path.join(ov, "council.md"),
		"---\ndescription: override sentinel\n---\nOVERRIDE-COUNCIL-SENTINEL on `council/cards/$ARGUMENTS.md`",
	);
	writeCardFace(root, "EV-90", "EPIC-23");
	const composed = composeRunnerInput(root, "EV-90", "do the work");
	// the override council body — stripped AND substituted
	expect(composed).toContain("OVERRIDE-COUNCIL-SENTINEL on `council/cards/EV-90.md`");
	expect(composed).not.toContain("description: override sentinel");
	// packaged features-deliver body still resolves (no half-mixing)
	expect(composed).toContain("You are the orchestrator delivering EPIC-23 autonomously");
	// the packaged council.md body is NOT included
	expect(composed).not.toContain("You are the facilitator of a Council run on card");
});
```

- [ ] **Step 2: Run it, watch it red** — `bun test test/ev90-runner-input.test.ts` → FAIL (`composeRunnerInput` not exported).

- [ ] **Step 3: Implement** in `extensions/seats.ts` (beside `proceduresDir`):

```ts
/** Substitute runtime placeholders into a stripped procedure body. */
export function renderProcedure(strippedBody: string, procDir: string, args?: string): string {
	return strippedBody
		.replace(/\$COUNCIL_PROCEDURES/g, procDir)
		.replace(/\$ARGUMENTS/g, (args ?? "").trim());
}

/** EV-90: the two procedure bodies a council-runner dispatch input carries. */
const RUNNER_PROCEDURE_FILES = ["council.md", "features-deliver.md"] as const;

/** EV-90: read one procedure body per-file, override-first — walk
 * [repoOverride, packaged] by filename (the same walk as the command scan in
 * index.ts), taking the first file that exists, never mixing halves, and
 * apply the scan's frontmatter strip. Never proceduresDir(repoRoot)-join:
 * that resolver is directory-level first-hit and reads wrong in any
 * partial-override repo. */
function readProcedureBody(repoRoot: string, name: string): string {
	const override = path.join(repoRoot, CONFIG_DIR_NAME, "council", "procedures", name);
	const packaged = path.join(PKG_ROOT, "council", "procedures", name);
	const file = fs.existsSync(override) ? override : packaged;
	if (!fs.existsSync(file)) {
		throw new Error(`composeRunnerInput: procedure "${name}" not found at ${override} or ${packaged}`);
	}
	return fs.readFileSync(file, "utf-8").replace(/^---\n[\s\S]*?\n---\n/, "");
}

/** EV-90: the epic key a features-deliver.md rendering binds — derived from
 * the card face's `epic:` field so a mismatched (card, epic) pair is
 * impossible by construction. D1 ruling (EV-90, 2026-09-24): a null/absent
 * epic is a fail-loud refusal naming the card — never an un-substituted or
 * omitted overlay. */
function cardEpicKey(repoRoot: string, cardId: string): string {
	const face = path.join(repoRoot, "council", "cards", `${cardId}.md`);
	let raw: string;
	try {
		raw = fs.readFileSync(face, "utf-8");
	} catch {
		throw new Error(
			`council-runner dispatch for card "${cardId}" refused: its card face council/cards/${cardId}.md does not exist`,
		);
	}
	const m = raw.match(/^epic:\s*(.*)$/m);
	const epic = m?.[1]?.trim();
	if (!epic || epic === "null") {
		throw new Error(
			`council-runner dispatch for card "${cardId}" refused: the card face's epic: field is null or absent (EV-90 D1 ruling — a runner without its features-deliver scope is a degraded dispatch, not a fallback)`,
		);
	}
	return epic;
}

/** EV-90 — compose the council-runner dispatch input: council.md rendered with
 * the card id, features-deliver.md rendered with the epic key derived from the
 * card face, and the parent's task text appended verbatim as the `<task>` tail
 * (concatenated, never passed through .replace — its $&/$n replacement
 * metacharacters would corrupt arbitrary task text). */
export function composeRunnerInput(repoRoot: string, cardId: string, taskInput: string): string {
	const procDir = proceduresDir(repoRoot);
	const councilBody = renderProcedure(readProcedureBody(repoRoot, "council.md"), procDir, cardId);
	const featuresBody = renderProcedure(readProcedureBody(repoRoot, "features-deliver.md"), procDir, cardEpicKey(repoRoot, cardId));
	return [
		`<council-procedure>\n${councilBody}\n</council-procedure>`,
		`<features-deliver-overlay>\n${featuresBody}\n</features-deliver-overlay>`,
		`<task>\n${taskInput}\n</task>`,
	].join("\n\n");
}
```

In `extensions/index.ts`: delete the `renderProcedure` definition (≈148–153); extend the line-13 seats import with `renderProcedure`; add `export { renderProcedure };` beside it with a comment naming the EV-90 move and re-export reason.

- [ ] **Step 4: Add the remaining pure tests** to `test/ev90-runner-input.test.ts`:

```ts
// (2) two-args non-tautology
test("EV-90 §6.2: two-args binding — card id renders council.md, epic renders features-deliver.md", () => {
	const root = tmpRepo();
	writeCardFace(root, "EV-90", "EPIC-23");
	const composed = composeRunnerInput(root, "EV-90", "task");
	expect(composed).toContain("council/cards/EV-90.md");
	expect(composed).not.toContain("council/cards/EPIC-23.md");
	expect(composed).toContain("delivering EPIC-23 autonomously");
	expect(composed).toContain("every card in `EPIC-23`'s scope");
	expect(composed).not.toContain("delivering EV-90 autonomously");
});

// (2b) byte-identity IN ADDITION to the load-bearing substrings
test("EV-90 §6.2b: bodies byte-identical to renderProcedure output, per body with its own args, in order", () => {
	const root = tmpRepo();
	writeCardFace(root, "EV-90", "EPIC-23");
	const composed = composeRunnerInput(root, "EV-90", "the task text");
	const procDir = proceduresDir(root);
	const readPackaged = (name: string) =>
		fs.readFileSync(path.join(PKG_ROOT, "council", "procedures", name), "utf-8").replace(/^---\n[\s\S]*?\n---\n/, "");
	const councilRender = renderProcedure(readPackaged("council.md"), procDir, "EV-90");
	const featuresRender = renderProcedure(readPackaged("features-deliver.md"), procDir, "EPIC-23");
	expect(composed).toContain(councilRender);
	expect(composed).toContain(featuresRender);
	expect(composed.indexOf(councilRender)).toBeLessThan(composed.indexOf(featuresRender));
});

// (3) verbatim $& tail + strip
test("EV-90 §6.3: $&-bearing task text appears exactly once, unmodified, as the <task> tail; strip holds", () => {
	const root = tmpRepo();
	writeCardFace(root, "EV-90", "EPIC-23");
	const task = 'resume card EV-90 with $& and $1 metachars "quoted" and\na newline';
	const composed = composeRunnerInput(root, "EV-90", task);
	expect(composed.endsWith(`<task>\n${task}\n</task>`)).toBe(true);
	expect(composed.indexOf(task)).toBeGreaterThanOrEqual(0);
	expect(composed.indexOf(task, composed.indexOf(task) + 1)).toBe(-1);
	expect(composed).not.toMatch(/^description:/m);
	expect(composed).not.toMatch(/^argument-hint:/m);
	expect(composed.includes("$ARGUMENTS")).toBe(false);
});

// (4) epic derivation + D1 throw
test("EV-90 §6.4: epic key derived from the face; epic: null/absent throws naming the card", () => {
	const root = tmpRepo();
	writeCardFace(root, "EV-90", "EPIC-9");
	expect(composeRunnerInput(root, "EV-90", "t")).toContain("delivering EPIC-9 autonomously");
	const nullRoot = tmpRepo();
	writeCardFace(nullRoot, "EV-45", null);
	expect(() => composeRunnerInput(nullRoot, "EV-45", "t")).toThrow(/EV-45/);
	const absentRoot = tmpRepo();
	writeCardFace(absentRoot, "EV-46", undefined);
	expect(() => composeRunnerInput(absentRoot, "EV-46", "t")).toThrow(/EV-46/);
});

// (5) placement / re-export / no-cycle
test("EV-90 §6.5: renderProcedure defined once in seats.ts, re-exported from index.ts, no cycle edges", () => {
	const seatsSrc = fs.readFileSync(path.join(PKG_ROOT, "extensions", "seats.ts"), "utf-8");
	const indexSrc = fs.readFileSync(path.join(PKG_ROOT, "extensions", "index.ts"), "utf-8");
	const hubToolsSrc = fs.readFileSync(path.join(PKG_ROOT, "extensions", "hub-tools.ts"), "utf-8");
	expect(seatsSrc).toContain("export function renderProcedure");
	expect(indexSrc).not.toContain("export function renderProcedure");
	expect(indexSrc).toMatch(/export\s*\{\s*renderProcedure\s*\}/);
	expect(seatsSrc.includes('from "./index.ts"')).toBe(false);
	expect(hubToolsSrc.includes('from "./index.ts"')).toBe(false);
});

// (6) AC3 prose pins (whitespace-normalized — the old instruction wraps across lines)
test("EV-90 §6.6: council-runner <procedure> block names the in-input blocks; read-in-full instruction gone", () => {
	const seatSrc = fs.readFileSync(path.join(PKG_ROOT, "council", "agents", "council-runner.md"), "utf-8");
	const norm = seatSrc.replace(/\s+/g, " ");
	expect(norm).not.toContain("read `council.md` and `features-deliver.md` from the procedures directory");
	expect(norm).not.toContain("Before doing anything else, read");
	expect(seatSrc).toContain("<council-procedure>");
	expect(seatSrc).toContain("<features-deliver-overlay>");
	expect(seatSrc).toContain("<task>");
	// byte-anchored survivors
	expect(seatSrc).toContain("**Skip step 0 (preflight).**");
	expect(seatSrc).toContain("Everything else in council.md applies as written");
	expect(seatSrc).toContain("council/procedures/features-deliver.md");
});
```

(Import `renderProcedure` from `../extensions/seats.ts` in the test file's import line.)

- [ ] **Step 5: Run the pure file green** — `bun test test/ev90-runner-input.test.ts` → all pass; `bun test test/render.test.ts` → still 4/4 untouched.

- [ ] **Step 6: Commit** — `feat(seats): compose council-runner dispatch input from rendered procedures (EV-90)`.

### Task 2: The call site — `card_id` param + guarded composition in `extensions/hub-tools.ts`

**Files:**
- Modify: `extensions/hub-tools.ts` (`council_dispatch` schema + execute body; `buildChildArgv` call sites ≈254 and ≈278)
- Test: `test/ev90-runner-input.test.ts` (dispatch-contract + retry tests appended)

**Interfaces:**
- Consumes: `composeRunnerInput` from `./seats.ts` (Task 1).
- Produces: `council_dispatch` gains optional `card_id: string`; runner dispatches carry the composed input at both spawn sites; refusal/throw paths return `isError` before any child spawns.

- [ ] **Step 1: Write the failing tests** (append to `test/ev90-runner-input.test.ts`), driving the real `registerHubTools` per the `test/override.test.ts` harness pattern (fake `pi`, wrapped `hub.spawnJob`, stub child, cleared `COUNCIL_EVAL_MODEL`, `afterEach(shutdownHub)`):

```ts
test("EV-90 §6.7: runner dispatch without card_id → refusal naming param + seat; non-runner unchanged; runner with card_id composes", async () => {
	const root = tmpRepo();
	// repo-local override seat named council-runner (catalogue-valid model)
	const agents = path.join(root, CONFIG_DIR_NAME, "agents");
	fs.mkdirSync(agents, { recursive: true });
	fs.writeFileSync(
		path.join(agents, "council-runner.md"),
		"---\nname: council-runner\ndescription: test\nmodel: openrouter/test/model\ntools: Read\n---\nunit-test body",
	);
	fs.writeFileSync(
		path.join(agents, "agent-s.md"),
		"---\nname: agent-s\ndescription: test\nmodel: openrouter/test/model\ntools: Read\n---\nunit-test body",
	);
	initHubIdentity("run-ev90a");
	const { dispatch, spawns } = makeDispatcher(root, ["openrouter/test/model"]);
	const refused = await dispatch({ seat: "council-runner", input: "do card work" });
	expect(refused.isError).toBe(true);
	expect(String(refused.content[0].text)).toContain("card_id");
	expect(String(refused.content[0].text)).toContain("council-runner");
	expect(spawns).toHaveLength(0);

	// epic-null face at the tool seam: refusal names the card, nothing spawns
	writeCardFace(root, "EV-47", null);
	const epicNull = await dispatch({ seat: "council-runner", input: "do card work", card_id: "EV-47" });
	expect(epicNull.isError).toBe(true);
	expect(String(epicNull.content[0].text)).toContain("EV-47");
	expect(spawns).toHaveLength(0);

	// non-runner dispatch without card_id: byte-identical raw input
	const plain = await dispatch({ seat: "agent-s", input: "raw task $& text" });
	expect(plain.isError).toBeFalsy();
	expect(spawns[0].args[spawns[0].args.length - 1]).toBe("raw task $& text");

	// runner with card_id: composed input
	writeCardFace(root, "EV-90", "EPIC-23");
	const ok = await dispatch({ seat: "council-runner", input: "do card work", card_id: "EV-90" });
	expect(ok.isError).toBeFalsy();
	const tail = spawns[1].args[spawns[1].args.length - 1];
	expect(tail).toContain("<council-procedure>");
	expect(tail).toContain("delivering EPIC-23 autonomously");
	expect(tail).toContain("<task>\ndo card work\n</task>");
});
```

Retry wiring test (mirrors `test/job-retry.test.ts`'s wired-dispatcher pattern: wrapped `spawnJob` + `respawn`, flaky stub, retry policy `{ enabled: true, maxAttempts: 2, ... }`):

```ts
test("EV-90 §6.8: retry attempt carries byte-identical composed input", async () => {
	// wired dispatcher with flaky stub (fails once, then emits) and a 2-attempt policy
	// dispatch { seat: "council-runner", input: "do card work", card_id: "EV-90" }
	// await hub.wait → done
	// expect(respawnArgs).toHaveLength(1)
	// tail(spawnArgs[0]) === tail(respawnArgs[0])  (byte-identical, contains both bodies)
});
```

- [ ] **Step 2: Run, watch it red** — the runner dispatch currently spawns un-composed (and no `card_id` refusal exists).

- [ ] **Step 3: Implement** in `extensions/hub-tools.ts`:
  - Add `card_id: Type.Optional(Type.String({ description: "The card id (e.g. EV-90) this dispatch executes — required for council-runner dispatches (the runner's input is composed from council.md and features-deliver.md rendered with it and the card face's epic); omit for every other seat." }))` to the `council_dispatch` `Type.Object`.
  - In `execute`, after `loadSeat` succeeds:

```ts
// EV-90 — runner dispatches carry the rendered procedure bodies. The
// card_id refusal and the composer's epic-null throw both fire before
// any child spawns; every other seat's input is untouched (AC5).
let dispatchInput = params.input;
if (seat.name === "council-runner") {
	if (params.card_id === undefined) {
		return {
			content: [{ type: "text", text: `Refused: a council-runner dispatch requires the card_id parameter (the card this runner executes — council.md renders with it); no card was named.` }],
			details: {},
			isError: true,
		};
	}
	try {
		dispatchInput = composeRunnerInput(repoRoot, params.card_id, params.input);
	} catch (e) {
		return { content: [{ type: "text", text: `Refused: ${e instanceof Error ? e.message : String(e)}` }], details: {}, isError: true };
	}
}
```

  - Replace `params.input` at BOTH `buildChildArgv` sites (initial spawn and `attemptSpec`) with `dispatchInput` — computed once, reused (§3).
  - Add `composeRunnerInput` to the existing `./seats.ts` import line.

- [ ] **Step 4: Run the file green** — `bun test test/ev90-runner-input.test.ts`; then `bun test test/job-retry.test.ts test/override.test.ts` (adjacent suites stay green).

- [ ] **Step 5: Commit** — `feat(hub-tools): card_id param + composed runner dispatch input (EV-90)`.

### Task 3: AC3 seat-block rewrite — `council/agents/council-runner.md`

**Files:**
- Modify: `council/agents/council-runner.md` (`<procedure>` block opening paragraph only)

**Interfaces:**
- Consumes: composer framing names from Task 1 (`<council-procedure>`, `<features-deliver-overlay>`, `<task>`).
- Produces: AC3 prose state pinned by the §6.6 test (already written in Task 1).

- [ ] **Step 1: The §6.6 test is the failing test** (red from Task 1 until this task lands — TDD order preserved by running the suite red between tasks).
- [ ] **Step 2: Rewrite** the first paragraph of the `<procedure>` block — affirmation + interpretation instruction, named affordances, "Execute the in-input text" close; keep "**Skip step 0 (preflight).**" and everything after byte-identical; keep the escalation class-list pointer (`council/procedures/features-deliver.md` Phase 1) untouched.
- [ ] **Step 3: Run** — `bun test test/ev90-runner-input.test.ts` green; `grep -c` sanity that the old opening is gone.
- [ ] **Step 4: Commit** — `feat(council): council-runner procedure block affirms in-input bodies (EV-90, AC3)`.

### Task 4: Full gates + PR

- [ ] **Step 1:** `bunx tsc --noEmit` — exit 0.
- [ ] **Step 2:** `bun test` — full suite green.
- [ ] **Step 3:** `python3 council/validate.py` — exit 0.
- [ ] **Step 4:** `bash council/preflight.sh EV-90` — `PASS: preflight clean`.
- [ ] **Step 5:** Push branch `ev-90-runner-preinjection`, open PR with `gh pr create` (Conventional Commits title, body citing card + spec + gates). Report branch, PR URL, head SHA, gate outputs.
