# EV-73 — Gate enablement lives in `.council.json` Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `loadGateConfig(repoRoot)` becomes the ONE resolver of the decisions gate's enablement from `.council.json`'s reserved top-level `gate` section; `mode` leaves `policy.json`; FLLWUP-74's four refusal classes land in `loadGateDecision`.

**Architecture:** Composition, not reader surgery — `loadGatePolicy` calls `loadGateConfig` first (mode resolved before `policy.json` is read) and populates `GatePolicy.mode` from the resolved config; the three readers (`gate-tool.ts`, `gate-route-tool.ts`, `gate-route.ts`) and `gate-run.ts`'s pre-POST off guard read that one resolved value with NO edits. The four refusal classes live in `loadGateDecision`, adjacent to `decide()`.

**Tech Stack:** TypeScript (strict, `bunx tsc --noEmit`), bun:test, `fs.mkdtempSync` fixture roots.

**Spec:** `docs/superpowers/specs/2026-09-20-EV-73-design.md` (§1–§11); card `council/cards/EV-73.md` (post-ruling `goal:` line governs).

## Global Constraints

- Absent `.council.json` / absent `gate` / `gate: {}` ⇒ `{ mode: "off" }` byte-identically to today.
- Every `loadGateConfig` failure goes through `gateFail` (single line, newline-sanitized, template tail `— set a valid value or remove the key to use the packaged default`).
- Class-4 pinned bytes (NOT gateFail — no template tail, no sanitization): `FAIL: <file> has an invalid <key> — value contains a line break; basis lines must be single-line` with `<key>` the dotted path (`overrides.0.question`).
- `mode` removed from `POLICY_KEYS`; a policy.json carrying `mode` fires the existing generic unknown-key `FAIL:` VERBATIM — no `mode` specialization (ruling job-2 item (a); enriched copy is EV-75's).
- Packaged `council/gate/policy.json` drops its `"mode": "off"` line in the same change.
- No `policyVersion` bump, no re-registration, no scaffold change, pin + endpoint stay code constants in `gate-run.ts`.
- Class-4 shape checks run before class-3's referential check within an override rule; `weights` keys are DROPPED from class 4.
- Lazy-at-call preserved: `loadGateConfig` runs inside `loadGatePolicy` at gate-tool-call time, never at parent init.
- TDD: failing test first per behavior; tests live in `test/`, bun:test, mkdtempSync roots, never the real repo.

## Review Focus

- `gate: null` — `typeof null === "object"`, so a naive object check would coerce it; must FAIL like a bare string. (Test: Task 1 Step 1.)
- Case-wrong mode `"Active"` — `GATE_MODES.includes` is case-sensitive; must FAIL naming `gate.mode`. (Task 1.)
- Off path must NOT relax present-value budget shape — `gateStateBudgetTokens: 0` under config-off still fails clause 1. (Task 2.)
- `thresholds.verify = 0` is accepted by the current loader (live defect) — class 1 must refuse it while `direct` keeps `≥ 0`. (Task 4.)
- A newline-bearing override field must be refused with the pinned bytes BEFORE `gateFail`'s sanitizer could flatten the cause. (Task 4.)

---

### Task 1: `loadGateConfig` — the single enablement resolver

**Files:**
- Modify: `extensions/gate.ts` (new exported function + import of `COUNCIL_CONFIG_FILE` from `./seats.ts`)
- Test: `test/gate.test.ts`

**Interfaces:**
- Consumes: `COUNCIL_CONFIG_FILE` (seats.ts), `GATE_MODES`, `gateFail`, `describeShape` (all in gate.ts).
- Produces: `export function loadGateConfig(repoRoot: string): { mode: GateMode }`.

- [ ] **Step 1: Write the failing tests** (new `loadGateConfig` block in `test/gate.test.ts`; import `loadGateConfig` and `COUNCIL_CONFIG_FILE`)

```ts
function repoCouncilFile(root: string, body: unknown): string {
	const file = path.join(root, ".council.json");
	fs.writeFileSync(file, typeof body === "string" ? body : JSON.stringify(body));
	return file;
}

test("loadGateConfig: absent .council.json, absent gate key, and gate:{} all resolve off identically", () => {
	const absent = loadGateConfig("/nonexistent-repo-root-ev73");
	expect(absent).toEqual({ mode: "off" });
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "council-gate-"));
	expect(loadGateConfig(root)).toEqual({ mode: "off" }); // file absent
	repoCouncilFile(root, { council: {} }); // file present, gate absent
	expect(loadGateConfig(root)).toEqual({ mode: "off" });
	repoCouncilFile(root, { gate: {} }); // section present, mode absent
	expect(loadGateConfig(root)).toEqual({ mode: "off" });
});

test("loadGateConfig: off, advisory, and active each resolve", () => {
	for (const mode of ["off", "advisory", "active"] as const) {
		const root = fs.mkdtempSync(path.join(os.tmpdir(), "council-gate-"));
		repoCouncilFile(root, { gate: { mode } });
		expect(loadGateConfig(root)).toEqual({ mode });
	}
});

test("loadGateConfig: a case-wrong mode FAILs naming gate.mode", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "council-gate-"));
	const file = repoCouncilFile(root, { gate: { mode: "Active" } });
	const msg = failOf(() => loadGateConfig(root));
	expect(msg).toBe(
		`FAIL: ${file} has an invalid gate.mode — expected one of "off", "advisory", "active", found "Active" — set a valid value or remove the key to use the packaged default`,
	);
	expect(msg).not.toMatch(/\n/);
});

test("loadGateConfig: a bare-string gate is refused, never coerced", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "council-gate-"));
	const file = repoCouncilFile(root, `{ "gate": "advisory" }`);
	expect(() => loadGateConfig(root)).toThrow(
		`FAIL: ${file} has an invalid gate — expected an object, found a string — set a valid value or remove the key to use the packaged default`,
	);
});

test("loadGateConfig: gate null and gate as array are refused like a bare string", () => {
	for (const body of ['{ "gate": null }', '{ "gate": [] }', '{ "gate": 3 }']) {
		const root = fs.mkdtempSync(path.join(os.tmpdir(), "council-gate-"));
		const file = repoCouncilFile(root, body);
		expect(() => loadGateConfig(root)).toThrow(/has an invalid gate — expected an object, found /);
	}
});

test("loadGateConfig: an unknown sub-key inside gate FAILs naming gate.<key>", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "council-gate-"));
	const file = repoCouncilFile(root, { gate: { mod: "active" } });
	expect(() => loadGateConfig(root)).toThrow(
		`FAIL: ${file} has an invalid gate.mod — unknown key; expected one of mode — set a valid value or remove the key to use the packaged default`,
	);
});

test("loadGateConfig: malformed JSON throws a single FAIL line naming the file", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "council-gate-"));
	const file = repoCouncilFile(root, "{ not json\nwith a newline");
	const msg = failOf(() => loadGateConfig(root));
	expect(msg).not.toMatch(/\n/);
	expect(msg).toMatch(/^FAIL: .*\.council\.json has an invalid JSON — not parseable as JSON: .+ — set a valid value or remove the key to use the packaged default$/);
	expect(msg).toContain(file);
});

test("transitive equality: loadGatePolicy(root).mode === loadGateConfig(root).mode", () => {
	for (const gate of [undefined, { mode: "off" }, { mode: "advisory" }, { mode: "active" }] as const) {
		const root = fs.mkdtempSync(path.join(os.tmpdir(), "council-gate-"));
		if (gate) repoCouncilFile(root, { gate });
		repoPolicy(root, {
			policyVersion: "p",
			model: GATE_PINNED_MODEL,
			endpoint: "https://x/",
			...(gate && gate.mode !== "off" ? { gateStateBudgetTokens: 32000 } : {}),
		});
		expect(loadGatePolicy(root).mode).toBe(loadGateConfig(root).mode);
	}
});

test("a malformed gate section is gate-scoped: other loaders are untouched, the throw happens at the gate read", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "council-gate-"));
	repoCouncilFile(root, '{ "gate": { "mode": "advisory" ');
	expect(() => loadGateQuestions(root)).not.toThrow(); // questions.json never reads .council.json
	expect(() => loadGatePolicy(root)).toThrow(/^FAIL: .*\.council\.json has an invalid JSON/);
});
```

(Add `GATE_PINNED_MODEL` to the existing import from `../extensions/gate.ts`.)

- [ ] **Step 2: Run to verify red** — `bun test test/gate.test.ts` ⇒ FAIL (`loadGateConfig` not exported).
- [ ] **Step 3: Implement** in `extensions/gate.ts`:

```ts
/** EV-73 — the ONE resolver of the decisions gate's enablement, from the
 * reserved top-level `gate` section of the repo's committed `.council.json`
 * (a sibling invisible to loadCouncilConfig, which reads only `parsed.council`;
 * like `theme` and `retry` it gets its own independent loader). Absent file,
 * absent `gate`, and `gate: {}` all resolve `{ mode: "off" }` byte-identically
 * to the packaged default. Lazy-at-call by construction (this runs inside
 * loadGatePolicy at gate-tool-call time, never at parent init). Named hazard:
 * a mid-run `.council.json` edit flips routing on the next gate read — the
 * same run-config-stability class as a seat-model edit. */
export function loadGateConfig(repoRoot: string): { mode: GateMode } {
	const file = path.join(repoRoot, COUNCIL_CONFIG_FILE);
	if (!fs.existsSync(file)) return { mode: "off" };
	let parsed: unknown;
	try {
		parsed = JSON.parse(fs.readFileSync(file, "utf-8"));
	} catch (e) {
		throw gateFail(file, "JSON", `not parseable as JSON: ${e instanceof Error ? e.message : String(e)}`);
	}
	if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
		throw gateFail(file, "JSON", "root must be a JSON object");
	}
	const raw = (parsed as Record<string, unknown>).gate;
	if (raw === undefined) return { mode: "off" };
	if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
		throw gateFail(file, "gate", `expected an object, found ${describeShape(raw)}`);
	}
	const section = raw as Record<string, unknown>;
	for (const key of Object.keys(section)) {
		if (key !== "mode") {
			throw gateFail(file, `gate.${key}`, "unknown key; expected one of mode");
		}
	}
	if (section.mode === undefined) return { mode: "off" };
	if (typeof section.mode !== "string" || !GATE_MODES.includes(section.mode as GateMode)) {
		throw gateFail(
			file,
			"gate.mode",
			`expected one of ${GATE_MODES.map((m) => JSON.stringify(m)).join(", ")}, found ${JSON.stringify(section.mode)}`,
		);
	}
	return { mode: section.mode as GateMode };
}
```

Change the seats.ts import line to `import { COUNCIL_CONFIG_FILE, PKG_ROOT } from "./seats.ts";`.

- [ ] **Step 4: Run to green** — `bun test test/gate.test.ts`.
- [ ] **Step 5: Commit** — `feat(gate): add loadGateConfig — the single enablement resolver from .council.json's gate section`

### Task 2: Composition — `loadGatePolicy` composes `loadGateConfig`; `mode` leaves `policy.json`

**Files:**
- Modify: `extensions/gate.ts` (`loadGatePolicy`, `POLICY_KEYS`), `council/gate/policy.json`
- Test: `test/gate.test.ts`

**Interfaces:**
- Consumes: `loadGateConfig` (Task 1).
- Produces: `loadGatePolicy(repoRoot): GatePolicy` with `mode` from config; `POLICY_KEYS = ["policyVersion", "model", "endpoint", "gateStateBudgetTokens"]`.

- [ ] **Step 1: Write the failing tests**

```ts
test("a policy.json carrying mode fires the generic unknown-key FAIL verbatim — the migration signal — even with config off", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "council-gate-"));
	repoCouncilFile(root, { gate: { mode: "off" } });
	const file = repoPolicy(root, { policyVersion: "p", mode: "advisory", model: "m", endpoint: "https://x/" });
	const msg = failOf(() => loadGatePolicy(root));
	expect(msg).toBe(
		`FAIL: ${file} has an invalid mode — unknown key; expected one of policyVersion, model, endpoint, gateStateBudgetTokens — set a valid value or remove the key to use the packaged default`,
	);
	expect(msg).not.toMatch(/\.council\.json/); // no EV-75 specialization yet
});

test("the packaged policy.json carries no mode key and still resolves off", () => {
	const packaged = JSON.parse(fs.readFileSync(path.join(PKG_ROOT, "council", "gate", "policy.json"), "utf-8"));
	expect("mode" in packaged).toBe(false);
	expect(loadGatePolicy("/nonexistent-repo-root-ev73").mode).toBe("off");
});

test("EV-64 clause 2 re-expressed: advisory config + budget-less policy FAILs naming the RESOLVED mode; config off with the identical policy loads clean", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "council-gate-"));
	repoCouncilFile(root, { gate: { mode: "advisory" } });
	repoPolicy(root, { policyVersion: "p", model: GATE_PINNED_MODEL, endpoint: "https://x/" });
	const msg = failOf(() => loadGatePolicy(root));
	expect(msg).toBe(
		`FAIL: ${path.join(root, CONFIG_DIR_NAME, "council", "gate", "policy.json")} has an invalid gateStateBudgetTokens — the key is absent but the resolved mode is "advisory" (an off-mode policy may omit it) — set a valid value`,
	);
	repoCouncilFile(root, { gate: { mode: "off" } });
	const policy = loadGatePolicy(root);
	expect(policy.mode).toBe("off");
	expect(policy.gateStateBudgetTokens).toBeUndefined();
});

test("clause 1 is config-driven too: a present invalid budget fails under config off (off does NOT relax the present-value shape)", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "council-gate-"));
	repoCouncilFile(root, { gate: { mode: "off" } });
	repoPolicy(root, { policyVersion: "p", model: "m", endpoint: "https://x/", gateStateBudgetTokens: 0 });
	const msg = failOf(() => loadGatePolicy(root));
	expect(msg).toMatch(/^FAIL: .*policy\.json has an invalid gateStateBudgetTokens — expected a positive integer, found 0/);
});
```

(Import `PKG_ROOT` in the test file.)
- [ ] **Step 2: Run red** — migration FAIL test fails (mode still accepted).
- [ ] **Step 3: Implement** in `loadGatePolicy`:

```ts
export function loadGatePolicy(repoRoot: string): GatePolicy {
	// EV-73: mode is resolved from .council.json's gate section BEFORE the
	// policy file is read — policy.json is tuning data only.
	const { mode } = loadGateConfig(repoRoot);
	const { file, value } = readGateFile(gateDirs(repoRoot), "policy.json");
	// ...unchnown-key loop unchanged (POLICY_KEYS no longer has "mode")...
	// clause 1 unchanged; delete the raw.mode block; clause 2 becomes:
	//   if (gateStateBudgetTokens === undefined && mode !== "off") throw ...
	// and the return uses the config-resolved mode.
}
```

`POLICY_KEYS` drops `"mode"`. Delete the `let mode: GateMode = "off"; ... raw.mode ...` block and the stale "An absent `mode` key resolves to `off`" docstring sentence on `loadGatePolicy` (mode now always comes from the config).

- [ ] **Step 4: Drop the packaged mode line** — `council/gate/policy.json` loses `"mode": "off",`.
- [ ] **Step 5: Fix the existing gate.test.ts fixtures that put mode in policy.json** (they now hit the unknown-key FAIL):
  - "a repo-local policy.json shadows the packaged default whole-file" — move `mode: "active"` to `.council.json` (`{ gate: { mode: "active" } }`), keep policy.json without mode; expectations unchanged (mode "active" now via config).
  - "an unknown key throws the FAIL line naming the key" — fixture drops `mode`, expected allowed-list becomes `policyVersion, model, endpoint, gateStateBudgetTokens`.
  - "an invalid mode value throws…" (policy.json mode "on") — replaced by the migration-FAIL test above; delete it.
  - EV-64 clause tests: "clause 1 … in every mode — off included" and "clause 2" and "absent on the active path" and "a live-mode policy with a valid key loads with it" — move the mode from policy.json fixtures to `.council.json` gate fixtures (clause-1 loop uses config off/advisory/active; clause-2 tests use config advisory/active).
  - Add `repoCouncilFile` helper at the top (shared with Task 1's block — define once, above all uses).
- [ ] **Step 6: Run green** — `bun test test/gate.test.ts test/gate-state.test.ts test/gate-decide.test.ts`.
- [ ] **Step 7: Commit** — `feat(gate): resolve gate mode from .council.json; drop mode from policy.json's accepted keys`

### Task 3: Migrate the reader-test fixtures to `.council.json` gate fixtures

**Files:**
- Modify: `test/gate-tool.test.ts` (`writePolicy` → writes `.council.json` gate + mode-less policy.json), `test/gate-route.test.ts` (same), `test/ev69-verify-manifests.test.ts` (~line 178), `test/ev66-advisory-intake.test.ts` (~line 458)

- [ ] **Step 1: Rewrite the two `writePolicy` helpers** (identical shape in both files):

```ts
function writePolicy(repo: string, mode: "off" | "advisory" | "active", endpoint: string, opts: { budget?: number } = {}): void {
	const configPath = path.join(repo, ".council.json");
	fs.writeFileSync(configPath, JSON.stringify({ gate: { mode } }, null, 2));
	const dir = path.join(repo, CONFIG_DIR_NAME, "council", "gate");
	fs.mkdirSync(dir, { recursive: true });
	const policy: Record<string, unknown> = { policyVersion: "<keep each file's existing version>", model: GATE_PINNED_MODEL, endpoint };
	const budget = opts.budget ?? (mode === "off" ? undefined : 32000);
	if (budget !== undefined) policy.gateStateBudgetTokens = budget;
	fs.writeFileSync(path.join(dir, "policy.json"), JSON.stringify(policy, null, 2));
}
```

(gate-tool.test.ts has no `opts` param — keep its signature, drop only the mode key from policy.json and add the config write.)

- [ ] **Step 2: ev69 fixture** — policy.json loses `mode: "advisory"`; add `.council.json` `{ "gate": { "mode": "advisory" } }` written next to the card.
- [ ] **Step 3: ev66 falsifier** — in the `policy` object (~line 458) drop `mode: "advisory"`; in `engineRepo`'s `retryPolicy` object (which `writeEngineRepoFiles` serializes verbatim to `.council.json`) add a top-level `gate: { mode: "advisory" }` sibling.
- [ ] **Step 4: Run green** — `bun test test/gate-tool.test.ts test/gate-route.test.ts test/ev69-verify-manifests.test.ts` (ev66's full arms run in the whole-suite gate).
- [ ] **Step 5: Commit** — `test(gate): reader-test fixtures set the gate mode via .council.json, not policy.json`

### Task 4: FLLWUP-74's four refusal classes in `loadGateDecision`

**Files:**
- Modify: `extensions/gate.ts` (`loadGateDecision`, new `basisSafeString` helper)
- Test: `test/gate.test.ts`

**Interfaces:**
- Consumes: existing `gateFail`, `DECISION_KEYS`, weights-parsed-before-overrides ordering.
- Produces: stricter `loadGateDecision`; packaged `decision.json` validates clean unchanged.

- [ ] **Step 1: Write the failing tests** (repo-local `decision.json` fixtures via a `repoDecision` helper mirroring `repoPolicy`; base fixture = the packaged decision body, mutated per case)

```ts
const repoDecision = (root: string, body: unknown): string =>
	repoGateFile(root, "decision.json", typeof body === "string" ? body : JSON.stringify(body));

const baseDecision = (): Record<string, unknown> =>
	JSON.parse(fs.readFileSync(path.join(PKG_ROOT, "council", "gate", "decision.json"), "utf-8"));

test("class 1: thresholds.verify = 0 is refused (direct keeps >= 0)", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "council-gate-"));
	const d = baseDecision();
	(d.thresholds as Record<string, unknown>).verify = 0;
	const file = repoDecision(root, d);
	const msg = failOf(() => loadGateDecision(root));
	expect(msg).toBe(
		`FAIL: ${file} has an invalid thresholds.verify — expected a finite number > 0, found 0 — set a valid value or remove the key to use the packaged default`,
	);
	// direct = 0 alone is still legal
	const root2 = fs.mkdtempSync(path.join(os.tmpdir(), "council-gate-"));
	const d2 = baseDecision();
	(d2.thresholds as Record<string, unknown>).verify = 1;
	(d2.thresholds as Record<string, unknown>).direct = 1;
	expect(() => loadGateDecision(root2)).not.toThrow(); // after fixing verify, direct 1 >= verify 1 is fine
	const root3 = fs.mkdtempSync(path.join(os.tmpdir(), "council-gate-"));
	const d3 = baseDecision();
	(d3.thresholds as Record<string, unknown>).direct = 0;
	expect(() => loadGateDecision(root3)).toThrow(/thresholds\.direct/); // 0 direct < verify 2.6 → the cross-check, not the positivity check
});

test("class 2: an unknown floors or thresholds sub-key FAILs naming the parent's own allowed set", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "council-gate-"));
	const d = baseDecision();
	(d.floors as Record<string, unknown>).bogus = 0.5;
	const file = repoDecision(root, d);
	expect(() => loadGateDecision(root)).toThrow(
		`FAIL: ${file} has an invalid floors.bogus — unknown sub-key; expected one of choice, score — set a valid value or remove the key to use the packaged default`,
	);
	const root2 = fs.mkdtempSync(path.join(os.tmpdir(), "council-gate-"));
	const d2 = baseDecision();
	(d2.thresholds as Record<string, unknown>).bogus = 1;
	repoDecision(root2, d2);
	expect(() => loadGateDecision(root2)).toThrow(/has an invalid thresholds\.bogus — unknown sub-key; expected one of verify, direct/);
});

test("class 3: an override.question absent from weights FAILs naming overrides.<i>.question", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "council-gate-"));
	const d = baseDecision();
	d.overrides = [{ question: "nope", option: "yes", basis: "b" }];
	const file = repoDecision(root, d);
	const msg = failOf(() => loadGateDecision(root));
	expect(msg).toBe(
		`FAIL: ${file} has an invalid overrides.0.question — question id "nope" is not declared in weights (expected one of reversible, publicContract, blastRadius, decidablyTestable) — set a valid value or remove the key to use the packaged default`,
	);
});

test("class 4: a line break in any of the three basis-rendered strings is refused with the pinned bytes, never sanitized", () => {
	for (const [key, value] of [
		["question", "reversible\n2"], ["option", "no\rno"], ["basis", "one-way door\nsecond line"],
	] as const) {
		const root = fs.mkdtempSync(path.join(os.tmpdir(), "council-gate-"));
		const d = baseDecision();
		(d.overrides as Array<Record<string, unknown>>)[0][key] = value;
		const file = repoDecision(root, d);
		const msg = failOf(() => loadGateDecision(root));
		expect(msg).toBe(`FAIL: ${file} has an invalid overrides.0.${key} — value contains a line break; basis lines must be single-line`);
		expect(msg).not.toMatch(/\n/);
		expect(msg).not.toContain("set a valid value"); // the tail is deliberately dropped
	}
});

test("class 4 shape checks precede the class-3 referential check within an override rule", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "council-gate-"));
	const d = baseDecision();
	d.overrides = [{ question: "undeclared\nid", option: "yes", basis: "b" }];
	repoDecision(root, d);
	// the newline defect wins over the absent-from-weights defect
	expect(() => loadGateDecision(root)).toThrow(/value contains a line break/);
});

test("the packaged decision.json validates clean under all four refusal classes", () => {
	const policy = loadGateDecision("/nonexistent-repo-root-ev73");
	expect(policy.thresholds.verify).toBeGreaterThan(0);
	expect(Object.keys(policy.floors).sort()).toEqual(["choice", "score"]);
	expect(Object.keys(policy.thresholds).sort()).toEqual(["direct", "verify"]);
	for (const o of policy.overrides) expect(o.question in policy.weights).toBe(true);
	for (const o of policy.overrides) for (const v of [o.question, o.option, o.basis]) expect(v).not.toMatch(/[\r\n]/);
});
```

- [ ] **Step 2: Run red.**
- [ ] **Step 3: Implement** in `loadGateDecision`:
  - After parsing `floors`: `for (const key of Object.keys(floors)) if (key !== "choice" && key !== "score") throw gateFail(file, \`floors.${key}\`, "unknown sub-key; expected one of choice, score");`
  - After parsing `thresholds` object: same loop with allowed `verify, direct`, key `thresholds.${key}`.
  - Class 1: the verify check becomes `> 0` — replace the `thresholds[t] < 0` loop for verify with `if (typeof thresholds.verify !== "number" || !Number.isFinite(thresholds.verify) || thresholds.verify <= 0) throw gateFail(file, "thresholds.verify", \`expected a finite number > 0, found ${JSON.stringify(thresholds.verify)}\`);` — keep `direct`'s finite non-negative loop and the existing verify ≤ direct cross-check.
  - New helper (plain `new Error`, NOT gateFail — no tail, no sanitization):

```ts
/** FLLWUP-74 class 4 — the three strings decide() interpolates into a basis
 * line must be single-line; the input is refused, never sanitized, and the
 * message deliberately drops the "set a valid value" tail (for a multi-line
 * string there is no in-place valid value). */
function basisSafeString(file: string, key: string, v: string): void {
	if (/[\r\n]/.test(v)) {
		throw new Error(`FAIL: ${file} has an invalid ${key} — value contains a line break; basis lines must be single-line`);
	}
}
```

  - In the overrides loop, after the existing non-empty-string shape checks and BEFORE the class-3 referential check: `basisSafeString(file, \`overrides.${i}.${k}\`, rule[k] as string);` for each of question/option/basis, then `if (!(rule.question in weights)) throw gateFail(file, \`overrides.${i}.question\`, \`question id ${JSON.stringify(rule.question)} is not declared in weights (expected one of ${weightIds.join(", ")})\`);`
- [ ] **Step 4: Run green** — `bun test test/gate.test.ts test/gate-decide.test.ts test/gate-route.test.ts test/gate-run.test.ts`.
- [ ] **Step 5: Commit** — `feat(gate): refuse verify=0, unknown floors/thresholds sub-keys, undeclared override questions, and multi-line basis strings (FLLWUP-74)`

### Task 5: Single-resolution-site canary

**Files:**
- Test: `test/gate.test.ts` (source canary, mirroring gate-route.test.ts's T1/T9 source-scan style)

- [ ] **Step 1: Write the test**

```ts
test("single resolution site: only extensions/gate.ts touches .council.json's gate key; readers keep exactly one loadGatePolicy call each", () => {
	const srcOf = (name: string) => fs.readFileSync(path.join(PKG_ROOT, "extensions", name), "utf-8");
	for (const reader of ["gate-tool.ts", "gate-route-tool.ts", "gate-route.ts", "gate-run.ts"]) {
		const src = srcOf(reader);
		expect(src.match(/\.council\.json|COUNCIL_CONFIG_FILE/g), `${reader} must not read the config file directly`).toEqual(null);
	}
	for (const reader of ["gate-tool.ts", "gate-route-tool.ts", "gate-route.ts"]) {
		const src = srcOf(reader);
		const calls = src.match(/loadGatePolicy\(/g) ?? [];
		expect(calls.length, `${reader} has exactly one loadGatePolicy call site`).toBe(1);
	}
	// gate-tool.ts and gate-route.ts: loadGatePolicy textually precedes buildGateState.
	for (const reader of ["gate-tool.ts", "gate-route.ts"]) {
		const src = srcOf(reader);
		expect(src.indexOf("loadGatePolicy(")).toBeGreaterThan(-1);
		expect(src.indexOf("loadGatePolicy(")).toBeLessThan(src.indexOf("buildGateState("));
	}
	// gate-route-tool.ts recheck body (skeptic O5): the precedence is TRANSITIVE
	// via resolveRoute — resolveRoute( precedes buildGateState( inside recheck.
	const src = srcOf("gate-route-tool.ts");
	const recheck = src.slice(src.indexOf("async function recheck"));
	expect(recheck.indexOf("resolveRoute(")).toBeGreaterThan(-1);
	expect(recheck.indexOf("resolveRoute(")).toBeLessThan(recheck.indexOf("buildGateState("));
});
```

- [ ] **Step 2: Run** — should pass on the current tree (skeptic O6 closed-green on the pre-card half; this pins the post-card invariant).
- [ ] **Step 3: Commit** — `test(gate): pin the single-resolution-site canary for .council.json's gate key`

### Task 6: Docstring + wiki minimal sweep

**Files:**
- Modify: `extensions/gate.ts` (module docstring), `vault/wiki/metered-deliberation-routing.md`

- [ ] **Step 1:** In `gate.ts`'s module docstring, replace the R3 paragraph's packaged-default-mode / policy.json-opt-in claims with: enablement lives in `.council.json`'s reserved top-level `gate` section (`{"mode": "off" | "advisory" | "active"}`), resolved solely by `loadGateConfig`; `policy.json` is tuning data only (model/endpoint/budget) and carries no mode; with no `gate` section the gate resolves `off` and is inert. Keep the pinned-model sentences.
- [ ] **Step 2:** In `vault/wiki/metered-deliberation-routing.md`, fix the two "packaged default is `mode: "off"`, so consumers opt in per repo" claims (frontmatter `summary:` and the opening callout) to state enablement lives in `.council.json`'s reserved top-level `gate` section and the packaged `policy.json` carries tuning data only. (EV-77 does the full sweep.)
- [ ] **Step 3:** Run `bun test test/prose.test.ts test/gate.test.ts` to confirm no prose pin breaks; adjust the wiki `updated:` field date.
- [ ] **Step 4: Commit** — `docs(gate): enablement lives in .council.json's gate section; policy.json is tuning data only`

### Task 7: Gates, push, PR

- [ ] **Step 1:** `bash council/preflight.sh` — exit 0, no FAIL lines.
- [ ] **Step 2:** `bunx tsc --noEmit` — clean.
- [ ] **Step 3:** `bun test` — full suite green (integration tests NOT enabled).
- [ ] **Step 4:** `python3 council/validate.py` — "All council artifacts valid".
- [ ] **Step 5:** `git push -u origin feat/ev-73-gate-config`; `gh pr create --base main` — title `feat(gate): gate enablement lives in .council.json's gate section (EV-73)`; body per the card goal. Do NOT merge.
