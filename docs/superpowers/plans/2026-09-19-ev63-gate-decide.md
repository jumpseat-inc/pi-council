# EV-63 Pure decide() Mode and Seat-Inclusion Function Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement `decide(answers, policy)` in `extensions/gate.ts` as a pure function (weighted composite + confidence floors + hard deterministic overrides) returning `{ mode, include, basis }`, with a data-driven decision policy (packaged `council/gate/decision.json`, repo-overridable whole-file) and an offline fixture-driven test proving every override, floor, mode, and inclusion invariant with no network.

**Architecture:** A second packaged gate data file (`decision.json`) carrying the tunable coefficients — composite weights, per-question mechanical directions, confidence floors, the `noul` threshold, mode thresholds, and the hard override rules — loaded fail-loud by `loadGateDecision(repoRoot)` on the exact EV-62 packaged-default-plus-repo-override whole-file pattern. `decide()` is pure: overrides first (bypass the model entirely), then floors (escalate rather than guess), then the composite against mode thresholds (a reduced mode needs positive evidence). Mode → seat-inclusion mapping is the binding R4 constant, not tuning data. No wiring into the council loop (no transport until EV-65); the ledger contract (`rederiveResolvedMode` over stored lines, `resolvedMode` as a string) is preserved.

**Tech Stack:** TypeScript (strict), bun:test, no new dependencies.

**Spec:** `council/cards/EV-63.md` (verbatim card, in-progress on this branch) + binding Phase-1 rulings R4 (panel sets), R3 (packaged default off), R1 (merge is not mine — PR only).

## Global Constraints

- MAIN-REPO IMMUTABILITY: never `git checkout`/`git switch`/`git reset` against `/home/tista/codes/pi-council`. All work in worktree `/home/tista/codes/pi-council/.worktrees/ev-63`, branch `feat/ev-63-gate-decide`, keeping the existing In Progress commit `f587128`.
- Do NOT edit `council/board.md` or the state sections of `council/cards/EV-63.md` (facilitator owns transitions). No new headings in board.md.
- TDD: failing test first per behavior; `bun:test` in `test/`; anything touching repo fs takes `repoRoot` (tests use `fs.mkdtempSync`, never the real repo); no network in the default suite.
- Conventional Commits for every commit; no history rewriting.
- Version bump NOT done on this card: EV-60/61/62 precedent (merge `29dc10d`) bumps at run close, not per card.
- Red-base convention: not triggered — all failing-first tests land green in this same PR (standard TDD); no mechanism-absent transplant record is owed.
- Gates, in order, in the worktree: (1) `bash council/preflight.sh`, (2) `bunx tsc --noEmit`, (3) `bun test` (≈101s, integration stays gated — do NOT set `COUNCIL_INTEGRATION`), (4) `python3 council/validate.py`.
- Do not wire `decide` into the council loop.

## Review Focus

- A `noul` answer is NOT silently treated as confident: it has no `confidence` field; its certainty `max(p, 1-p)` must clear the policy's own `noulThreshold` or the decision is `Deliberate`. Test: p=0.51 vs threshold 0.60 escalates even though the composite would have said Verify.
- Hard overrides fire on the ANSWER, not the probability mass: a `choice` answer whose chosen label matches the override option fires even if its probabilities are lopsided the other way. Test: chosen "no" with p(yes)=0.8 still fires the reversible one-way-door override.
- Missing answers must bias SAFE, not cheap: an unanswered question contributes 0 to the composite (raw weighted sum, no normalization), dragging toward Deliberate. Test: nulling one mechanical answer drops Direct→Verify.
- Every inclusion set contains the owner, and Direct contains no judge — a regression that adds the judge to Direct violates R4. Test iterates all fixtures.
- Basis bytes are derived deterministically (fixed 2-decimal formatting, declared iteration order) — a `Date.now()`, `Math.random()`, or object-key-order dependency would break offline re-derivation. Test: byte-identical basis across two calls, pinned literal.

---

### Task 1: The decision-policy data type + packaged `decision.json` + loader (TDD)

**Files:**
- Modify: `extensions/gate.ts` (append EV-63 section)
- Create: `council/gate/decision.json`
- Test: `test/gate-decide.test.ts`

**Interfaces:**
- Produces: `GateDecisionPolicy` (interface below), `loadGateDecision(repoRoot): GateDecisionPolicy`, `GATE_DECISION_MODES`, `GateDecisionMode`, `MODE_PANELS` — consumed by Task 2 and the tests.
- Consumes: EV-62's `gateDirs` first-hit pattern and `gateFail` single-line FAIL format (both already module-local in `extensions/gate.ts`).

The packaged policy (calibrated so the acceptance fixtures resolve as specified):

```json
{
	"version": "gate-decision-1",
	"weights": { "reversible": 1, "publicContract": 1, "blastRadius": 1, "decidablyTestable": 1 },
	"mechanical": { "reversible": "yes", "publicContract": "no", "blastRadius": "no", "decidablyTestable": "yes" },
	"floors": { "choice": 0.7, "score": 0.7 },
	"noulThreshold": 0.6,
	"noulProbabilityOf": "yes",
	"thresholds": { "verify": 2.6, "direct": 3.4 },
	"overrides": [
		{ "question": "reversible", "option": "no", "basis": "one-way door" },
		{ "question": "publicContract", "option": "yes", "basis": "public contract or data change" },
		{ "question": "blastRadius", "option": "yes", "basis": "cross-module blast radius" }
	]
}
```

Conventions this data encodes (documented in gate.ts comments): every weighted question names its mechanical option; a `noul` answer's `probability` is the probability of the criterion option named by `noulProbabilityOf` (the packaged set's "yes"); `mechScore = P(mechanical option)`; override rules name `{question, option, basis}`.

- [ ] **Step 1: Write the failing loader tests** (append to new `test/gate-decide.test.ts`):

```ts
import { test, expect } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { CONFIG_DIR_NAME } from "@earendil-works/pi-coding-agent";
import { loadGateDecision, MODE_PANELS } from "../extensions/gate.ts";

test("the packaged decision policy loads from a nonexistent repo root with floors and thresholds", () => {
	const d = loadGateDecision("/nonexistent-repo-root-ev63");
	expect(d.version.length).toBeGreaterThan(0);
	expect(d.floors.choice).toBeGreaterThan(0);
	expect(d.floors.score).toBeGreaterThan(0);
	expect(d.noulThreshold).toBeGreaterThan(0);
	expect(d.noulThreshold).toBeLessThanOrEqual(1);
	expect(d.thresholds.verify).toBeLessThanOrEqual(d.thresholds.direct);
	expect(d.overrides.length).toBeGreaterThanOrEqual(3);
});

test("a repo-local decision.json shadows the packaged default whole-file", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "ev63-decision-"));
	const dir = path.join(root, CONFIG_DIR_NAME, "council", "gate");
	fs.mkdirSync(dir, { recursive: true });
	fs.writeFileSync(path.join(dir, "decision.json"), JSON.stringify({
		version: "t-1", weights: { probe: 2 }, mechanical: { probe: "yes" },
		floors: { choice: 0.5, score: 0.5 }, noulThreshold: 0.55, noulProbabilityOf: "yes",
		thresholds: { verify: 1, direct: 1.5 }, overrides: [],
	}));
	const d = loadGateDecision(root);
	expect(d.version).toBe("t-1");
	expect(Object.keys(d.weights)).toEqual(["probe"]);
});

test("a malformed repo decision.json throws the single FAIL line naming the file", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "ev63-decision-"));
	const dir = path.join(root, CONFIG_DIR_NAME, "council", "gate");
	fs.mkdirSync(dir, { recursive: true });
	const file = path.join(dir, "decision.json");
	fs.writeFileSync(file, "{ not json");
	let msg = "";
	try { loadGateDecision(root); } catch (e) { msg = (e as Error).message; }
	expect(msg).not.toMatch(/\n/);
	expect(msg).toContain(`FAIL: ${file} has an invalid JSON`);
});

test("an invalid threshold pair (verify > direct) throws the FAIL line", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "ev63-decision-"));
	const dir = path.join(root, CONFIG_DIR_NAME, "council", "gate");
	fs.mkdirSync(dir, { recursive: true });
	const file = path.join(dir, "decision.json");
	fs.writeFileSync(file, JSON.stringify({
		version: "t-1", weights: { probe: 1 }, mechanical: { probe: "yes" },
		floors: { choice: 0.7, score: 0.7 }, noulThreshold: 0.6, noulProbabilityOf: "yes",
		thresholds: { verify: 9, direct: 1 }, overrides: [],
	}));
	let msg = "";
	try { loadGateDecision(root); } catch (e) { msg = (e as Error).message; }
	expect(msg).toContain(`FAIL: ${file} has an invalid thresholds`);
	expect(msg).toContain("verify must be ≤ direct");
});

test("R4 panel constants: Verify keeps an adversary and a ruling authority; Direct has no judge", () => {
	expect(MODE_PANELS.Verify).toContain("skeptic");
	expect(MODE_PANELS.Verify).toContain("judge");
	expect(MODE_PANELS.Direct).not.toContain("judge");
	for (const panel of Object.values(MODE_PANELS)) expect(panel[0]).toBe("owner");
});
```

- [ ] **Step 2: Run to verify it fails** — `bun test test/gate-decide.test.ts` → FAIL (`loadGateDecision`/`MODE_PANELS` not exported).
- [ ] **Step 3: Implement** in `extensions/gate.ts` (append an EV-63 section): `GateDecisionPolicy`/`GateOverrideRule`/`GateDecisionMode`/`GATE_DECISION_MODES`/`MODE_PANELS` types + constants (R4 cited in a comment), and `loadGateDecision(repoRoot)` — same `gateDirs` first-hit read of `decision.json`, fail-loud validation via `gateFail`: root object; allowed keys exactly `version, weights, mechanical, floors, noulThreshold, noulProbabilityOf, thresholds, overrides`; `version` non-empty string; `weights` non-empty record of positive finite numbers; `mechanical` record with exactly the `weights` keys, non-empty string values; `floors` with `choice`/`score` in [0,1]; `noulThreshold` in (0,1]; `noulProbabilityOf` non-empty string; `thresholds` with `verify ≤ direct` both finite non-negative (FAIL text `verify must be ≤ direct`, per test); `overrides` array of `{question, option, basis}` non-empty strings.
- [ ] **Step 4: Create `council/gate/decision.json`** with the packaged body above (tab-indented to match the repo's other gate files).
- [ ] **Step 5: Run tests to green** — `bun test test/gate-decide.test.ts` → all PASS.
- [ ] **Step 6: Commit** — `feat(gate): EV-63 decision-policy data + packaged decision.json + fail-loud loader`

### Task 2: `decide(answers, policy)` — overrides, floors, noul threshold, composite (TDD)

**Files:**
- Modify: `extensions/gate.ts` (append to the EV-63 section)
- Test: `test/gate-decide.test.ts` (append)

**Interfaces:**
- Consumes: Task 1's `GateDecisionPolicy`, `GATE_DECISION_MODES`, `MODE_PANELS`; `GateAnswer` from `./gate-ledger.ts` (`{ type: string } & Record<string, unknown>`).
- Produces: `decide(answers: Record<string, GateAnswer | null>, policy: GateDecisionPolicy): GateDecision` where `GateDecision = { mode: GateDecisionMode; include: string[]; basis: string }`.

Decision order (each cited in code comments):
1. **Hard overrides** (data-driven, deterministic on the answer itself): a `choice` answer fires when its chosen `value` equals the rule's `option`; a `score` answer when `String(score)` equals it; a `noul` answer when the rule option's side probability `> 0.5` (side probability: the answer's `probability` is `P(noulProbabilityOf)`; the opposite side is `1 - p`). Fired → `Deliberate`, basis `<question>? <fired option> (<rule.basis>)` — the acceptance's example format (`reversible? no (one-way door)`).
2. **Confidence floors** (choice/score only — the types that report one): `confidence < floors[type]` → `Deliberate`, basis `<id>: confidence <x.xx> < <type> floor <x.xx>`. A `noul` answer has no `confidence`; certainty `max(p, 1-p) < noulThreshold` → `Deliberate`, basis `<id>: certainty <x.xx> < noul threshold <x.xx>`. First failure in `Object.keys(answers)` order wins (documented, deterministic).
3. **Composite**: raw weighted sum `Σ weights[id] × P(mechanical[id])` over answered questions only (null/absent contributes 0 — missing evidence drags toward Deliberate, never toward a reduced mode; no normalization). `composite ≥ thresholds.direct` → `Direct` (basis `composite <x.xx> ≥ direct threshold <x.xx>`); `≥ thresholds.verify` → `Verify`; else `Deliberate` (basis `composite <x.xx> < verify threshold <x.xx>`).
- Malformed answers fail loud with a plain `Error` naming the question (unknown `type`; missing/non-numeric `confidence` on choice/score; missing/non-numeric `probability` on noul) — a silently-defaulted answer is an untested answer, per the module's own fail-loud posture.
- `include` comes from `MODE_PANELS[mode]` — R4, never from answers.

Fixture helpers (in-test, typed, no fs):

```ts
const choice = (value: string, pYes: number, confidence = 0.9) =>
	({ type: "choice", value, probabilities: { yes: pYes, no: 1 - pYes }, confidence });
const noul = (p: number) => ({ type: "noul", probability: p });
const score = (score: number, confidence = 0.9) =>
	({ type: "score", score, legend: ["mechanical", "judgment"], probabilities: { "0": 1 - 0.1, "1": 0.1 }, confidence });
```

Tests to write FIRST (all fail: `decide` not exported):

- Every override class returns `Deliberate` against the all-mechanical answer set: (a) `reversible` noul p=0.15 (fires "no" override — certainty 0.85 clears the noul threshold, isolating the override); (b) `publicContract` noul p=0.85; (c) `blastRadius` noul p=0.85. Each basis matches `/^<question>\? (no|yes) \(.+\)$/`.
- A below-floor `choice` answer (`decidablyTestable` value "yes", confidence 0.5, floor 0.7) → `Deliberate` with the floor basis; everything else stays mechanical.
- A below-floor `score` answer using an in-memory policy with a `score`-typed weighted question (`probe`, mechanical option "0", weight 1, overrides []) — confidence 0.4 < 0.7 → `Deliberate` with the floor basis.
- The `noul` threshold: `reversible` p=0.51 (certainty 0.51 < 0.60; override does NOT fire; composite 3.21 would have been Verify) → `Deliberate` with the certainty basis.
- Reduced modes: all-mechanical confident set (reversible p=0.9, publicContract p=0.1, blastRadius p=0.1, decidablyTestable choice yes @0.9) → composite 3.6 ≥ 3.4 → `Direct`; the same set with a confident `decidablyTestable` value "no" (pMech 0.05) → composite 2.75 ≥ 2.6 → `Verify`. Both inclusion sets contain "skeptic" and "judge" (adversary + ruling authority; Direct per R4 its test suite is the gate).
- Non-invariant roles each absent from ≥1 reduced-set fixture: iterate `["skeptic", "principal", "designer", "product-owner", "consolidator"]`, assert each is absent from `MODE_PANELS.Direct` or `MODE_PANELS.Verify` via the two reduced fixtures.
- Missing evidence biases safe: null out `decidablyTestable` in the all-mechanical set (composite 2.7) → `Verify`, not Direct.
- Inclusion invariants across ALL fixtures in the file: `include[0] === "owner"` always; every Deliberate fixture contains owner+skeptic+judge; the Direct fixture contains no judge.
- Basis determinism: `decide(a, p).basis === decide(a, p).basis` byte-for-byte for two distinct fixtures; pin one exact literal (e.g. expect the override basis to equal `"reversible? no (one-way door)"` and one composite basis to equal `"composite 3.60 ≥ direct threshold 3.40"`).
- Malformed answers fail loud: noul missing `probability`, choice missing `confidence`, unknown type — each throws naming the question id.
- Ledger compatibility: with `rederiveResolvedMode` and a `DecideFn` adapter `(answers) => decide(answers, policy).mode`, a recorded call re-derives its stored `resolvedMode` string; the three mode strings are exactly `GATE_DECISION_MODES`.

- [ ] **Step 1: Write the failing tests** (append Task-2 block to `test/gate-decide.test.ts`).
- [ ] **Step 2: Run to verify they fail** — `bun test test/gate-decide.test.ts` → new tests FAIL (`decide` not exported).
- [ ] **Step 3: Implement `decide`** exactly per the interface + decision order above.
- [ ] **Step 4: Run to green** — `bun test test/gate-decide.test.ts` → all PASS.
- [ ] **Step 5: Commit** — `feat(gate): EV-63 pure decide() returning mode, seat-inclusion set, and deterministic basis`

### Task 3: Full gates, push, PR

- [ ] **Step 1: Gate 1** — `bash council/preflight.sh` → `PASS: preflight clean`.
- [ ] **Step 2: Gate 2** — `bunx tsc --noEmit` → clean.
- [ ] **Step 3: Gate 3** — `bun test` (full suite; no `COUNCIL_INTEGRATION`) → all pass, duration within the ≈101s envelope.
- [ ] **Step 4: Gate 4** — `python3 council/validate.py` → `All council artifacts valid`.
- [ ] **Step 5: Push** — `git push -u origin feat/ev-63-gate-decide`.
- [ ] **Step 6: PR** — `gh pr create --base main --head feat/ev-63-gate-decide` titled `feat(gate): EV-63 pure decide() mode + seat-inclusion with offline fixtures`, body summarizing the design, the R3/R4 rulings applied, and the four observed gate results. Do NOT merge.

## Self-Review

- Spec coverage: overrides (Task 2 tests a–c), choice/score floors (Task 2), noul threshold (Task 2), reduced modes + inclusions (Task 2), non-invariant absence (Task 2), basis + determinism/no-model-call (Task 2), loaders consistent with EV-62 (Task 1), ledger compatibility (Task 2), no network (all tests pure/in-memory). ✓
- Type consistency: `GateAnswer` reused from gate-ledger.ts; `decide`'s mode strings are the same vocabulary the ledger stores as `resolvedMode`. ✓
- Placeholders: none — all steps carry concrete code/data. ✓
