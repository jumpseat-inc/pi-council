# EV-61 Gate Ledger Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every gate call appends one JSON line to `<repo>/$CONFIG_DIR_NAME/council/gate-ledger.jsonl` carrying stateHash, questionSetVersion, every answer with its probabilities and confidence, the resolved mode, and policyVersion — with a reader module and tests proving the resolved mode of a recorded call is re-derivable from that line alone, offline.

**Architecture:** One new module `extensions/gate-ledger.ts` (the record schema, an append-only single-`write(2)` JSONL writer, and a tolerant reader + re-derivation seam), plus `test/gate-ledger.test.ts`. The metered-deliberation gate does not exist yet (EV-63/EV-65 build it); this card ships the ledger substrate it will write to. Placement is settled by the card: repo-scoped durable telemetry at `<repo>/$CONFIG_DIR_NAME/council/gate-ledger.jsonl` — outside the pruned run directory, appended to never rewritten, committed by default. Precedent: `extensions/usage-store.ts` (EV-31) for the atomic-write and explicit-failure pattern; `test/cost-baseline.test.ts` (EV-60) for the accessor-discipline source-scan test shape.

**Tech Stack:** TypeScript (strict), `bun:test`, `node:fs`/`node:path`/`node:crypto`, `CONFIG_DIR_NAME` from `@earendil-works/pi-coding-agent`.

**Spec:** `council/cards/EV-61.md` (goal + Intent + Acceptance are the contract).

## Global Constraints

- `$CONFIG_DIR_NAME` must come from `@earendil-works/pi-coding-agent` — never hardcode `.pi` (AGENTS.md convention 3).
- Placement is settled: `<repo>/$CONFIG_DIR_NAME/council/gate-ledger.jsonl` — appended to, never rewritten; committed by default; verify no `.gitignore` rule covers it (none does today — do not add one). Extending the run-manifest usage surface instead would be a convention amendment — not chosen.
- The reader must NEVER read the pruned run directory (assert by test, EV-60 `cost-baseline` shape).
- Tests touch the repo filesystem only through `repoRoot` parameters with fresh `fs.mkdtempSync` dirs — never the real repo (AGENTS.md testing conventions).
- Offline, fast tests (vault/wiki/test-suite-budget.md — the suite is ≈101s; no network, integration gates stay off).
- TDD: failing test first, watch it fail, minimal implementation, watch it pass (AGENTS.md).
- Conventional Commits (`feat(gate-ledger): ...`).

## Review Focus

- **A torn trailing line** (crash mid-append) must be skipped by the reader, not crash it — pinned in Task 2 step 1 (test 10).
- **An absent answer must be recorded as absent (`null`), never as a zero** — the goal says so verbatim; pinned in Task 1 step 1 (test 3).
- **A write failure must name the absolute target path** — pinned in Task 1 step 1 (test 7) via a directory-as-target fixture (deterministic regardless of uid).
- **The reader's discipline**: it may open only its own ledger path — no `./runs.ts`, no `runsDir`, no `fetch(` — pinned by the source-scan test in Task 3.
- **The committed-by-default property**: verified at implementation time with `git check-ignore -v .pi/council/gate-ledger.jsonl` (exit 1, no rule); no test added (environment-dependent), the verification is recorded in the PR body.

---

### Task 1: The record schema + append-only writer

**Files:**
- Create: `extensions/gate-ledger.ts`
- Test: `test/gate-ledger.test.ts`

**Interfaces:**
- Produces (consumed by Task 2 and by future EV-63/EV-65 gate code):
  - `GATE_LEDGER_SCHEMA_VERSION = 1`
  - `type GateAnswer = { type: string } & Record<string, unknown>` — the transport's answer, stored verbatim (chosen label / score / legend / `probabilities` / `confidence` / `probability` ride as unknown fields; the ledger never smooths answer shapes).
  - `interface GateLedgerRecord { schemaVersion; kind: "call"; callId; stateHash; questionSetVersion; answers: Record<string, GateAnswer | null>; resolvedMode: string; policyVersion: string; recordedAt: string; outcome?: Record<string, unknown> }`
  - `interface GateOutcomeRecord { schemaVersion; kind: "outcome"; callId; outcome: Record<string, unknown>; recordedAt: string }`
  - `gateLedgerPath(repoRoot: string): string` — `path.join(repoRoot, CONFIG_DIR_NAME, "council", "gate-ledger.jsonl")`
  - `appendGateCall(input: GateCallInput, repoRoot: string, ledgerPath?: string): GateLedgerRecord` — `GateCallInput = { stateHash, questionSetVersion, questionIds: readonly string[], answers: Record<string, GateAnswer>, resolvedMode, policyVersion, now?, callId? }`. Every `questionIds` entry without an answer is recorded as `null` (absent, never zero). One `fs.appendFileSync` of a fully pre-serialized line (single O_APPEND write). Failure → throws an `Error` whose message names the absolute target path.
  - `appendGateOutcome(input: { callId: string; outcome: Record<string, unknown>; now? }, repoRoot: string, ledgerPath?): GateOutcomeRecord`

**Outcome-field design choice (recorded in the module header):** the file is append-only and never rewritten, so an outcome arriving after the call cannot be spliced into the call's line. The outcome joins the call's record as a **follow-on `kind: "outcome"` line** keyed on `callId`; the reader tolerates it and attaches it to the matching call (`last` outcome wins). The call line itself stays byte-frozen forever.

- [ ] **Step 1: Write the failing tests** (test file created; module does not exist yet)

```ts
import { test, expect } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { CONFIG_DIR_NAME } from "@earendil-works/pi-coding-agent";
import {
	GATE_LEDGER_SCHEMA_VERSION,
	appendGateCall,
	appendGateOutcome,
	gateLedgerPath,
} from "../extensions/gate-ledger.ts";

function tmpRepo(): string {
	return fs.mkdtempSync(path.join(os.tmpdir(), "ev61-repo-"));
}

function callInput(over: Partial<Parameters<typeof appendGateCall>[0]> = {}) {
	return {
		stateHash: "sha256:abc123",
		questionSetVersion: "qs-v1",
		questionIds: ["q-oneway", "q-blast"],
		answers: {
			"q-oneway": { type: "choice", value: "no", probabilities: { yes: 0.1, no: 0.9 }, confidence: 0.92 },
		},
		resolvedMode: "Deliberate",
		policyVersion: "policy-v3",
		...over,
	};
}

test("appendGateCall writes exactly one JSON line carrying the goal's fields", () => {
	const repo = tmpRepo();
	const rec = appendGateCall(callInput(), repo);
	const lines = fs.readFileSync(gateLedgerPath(repo), "utf-8").split("\n").filter((l) => l !== "");
	expect(lines.length).toBe(1);
	const parsed = JSON.parse(lines[0]!);
	expect(parsed.schemaVersion).toBe(GATE_LEDGER_SCHEMA_VERSION);
	expect(parsed.kind).toBe("call");
	expect(parsed.callId).toBe(rec.callId);
	expect(parsed.stateHash).toBe("sha256:abc123");
	expect(parsed.questionSetVersion).toBe("qs-v1");
	expect(parsed.resolvedMode).toBe("Deliberate");
	expect(parsed.policyVersion).toBe("policy-v3");
	expect(typeof parsed.recordedAt).toBe("string");
});

test("answers are stored verbatim — probabilities and confidence byte-equal", () => {
	const repo = tmpRepo();
	appendGateCall(callInput(), repo);
	const parsed = JSON.parse(fs.readFileSync(gateLedgerPath(repo), "utf-8").trim());
	expect(parsed.answers["q-oneway"]).toEqual({
		type: "choice",
		value: "no",
		probabilities: { yes: 0.1, no: 0.9 },
		confidence: 0.92,
	});
});

test("an asked-but-unanswered question is recorded as null (absent), never a zero", () => {
	const repo = tmpRepo();
	appendGateCall(callInput(), repo);
	const raw = fs.readFileSync(gateLedgerPath(repo), "utf-8");
	expect(raw).toContain(`"q-blast":null`);
	const parsed = JSON.parse(raw.trim());
	expect(parsed.answers["q-blast"]).toBe(null);
	expect(parsed.answers["q-blast"]).not.toBe(0);
});

test("two appends produce two lines, appended never rewritten", () => {
	const repo = tmpRepo();
	appendGateCall(callInput({ stateHash: "s1" }), repo);
	appendGateCall(callInput({ stateHash: "s2" }), repo);
	const lines = fs.readFileSync(gateLedgerPath(repo), "utf-8").split("\n").filter((l) => l !== "");
	expect(lines.length).toBe(2);
	expect(JSON.parse(lines[0]!).stateHash).toBe("s1");
	expect(JSON.parse(lines[1]!).stateHash).toBe("s2");
});

test("gateLedgerPath derives from CONFIG_DIR_NAME, never a hardcoded .pi", () => {
	const repo = tmpRepo();
	expect(gateLedgerPath(repo)).toBe(path.join(repo, CONFIG_DIR_NAME, "council", "gate-ledger.jsonl"));
});

test("a write failure throws naming the absolute target path", () => {
	const repo = tmpRepo();
	const target = path.join(repo, "blocked");
	fs.mkdirSync(target); // a directory as the target: append fails regardless of uid
	expect(() => appendGateCall(callInput(), repo, target)).toThrow(new RegExp(target.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
});
```

- [ ] **Step 2: Run to verify RED** — `bun test test/gate-ledger.test.ts` → fails: cannot resolve `../extensions/gate-ledger.ts` (feature missing — the right failure).
- [ ] **Step 3: Implement** `extensions/gate-ledger.ts` minimally: constants, types, `gateLedgerPath`, `appendGateCall` (mkdir -p parent, pre-serialize `JSON.stringify(record) + "\n"`, single `appendFileSync`, catch → rethrow with `${ledgerPath}` in the message), `appendGateOutcome` (same append mechanics), `randomUUID()` for `callId`.
- [ ] **Step 4: Run to verify GREEN** — same command, all pass.
- [ ] **Step 5: Commit** `feat(gate-ledger): EV-61 append-only gate-call records with absent-as-null answers`

### Task 2: The tolerant reader + re-derivation seam

**Files:**
- Modify: `extensions/gate-ledger.ts`
- Test: `test/gate-ledger.test.ts` (append)

**Interfaces:**
- Consumes: Task 1's types/`appendGateCall`/`appendGateOutcome`.
- Produces:
  - `type DecideFn = (answers: Record<string, GateAnswer | null>, policyVersion: string) => string` — the seam EV-63's pure `decide` plugs into.
  - `rederiveResolvedMode(record: GateLedgerRecord, decide: DecideFn): string` — pure; uses only the record object; no fs, no network.
  - `interface ReadGateLedgerResult { calls: GateLedgerRecord[]; orphanOutcomes: GateOutcomeRecord[] }`
  - `readGateLedger(repoRoot: string, ledgerPath?: string): ReadGateLedgerResult` — never throws; skips blank/unparseable (torn-tail) lines and unrecognized `kind`s; attaches the last outcome per `callId` onto its call.

- [ ] **Step 1: Write the failing tests** (append to the test file)

```ts
import {
	readGateLedger,
	rederiveResolvedMode,
	type DecideFn,
} from "../extensions/gate-ledger.ts";

/** A stand-in for EV-63's pure decide(): floors confidence, escalates nulls. */
const floorDecide: DecideFn = (answers) => {
	const list = Object.values(answers);
	if (list.some((a) => a === null)) return "Deliberate";
	for (const a of list) {
		if (typeof a!.confidence !== "number") throw new Error("answer missing confidence");
		if (a!.confidence < 0.7) return "Deliberate";
	}
	return "Verify";
};

test("two calls with the same stateHash and policyVersion re-derive the identical resolvedMode", () => {
	const repo = tmpRepo();
	const answers = {
		"q-reversible": { type: "choice", value: "yes", probabilities: { yes: 0.95, no: 0.05 }, confidence: 0.9 },
		"q-noul": { type: "noul", probability: 0.02 },
	};
	for (const stateHash of ["s-1", "s-1"]) {
		appendGateCall(callInput({ stateHash, answers, resolvedMode: "Verify" }), repo);
	}
	const { calls } = readGateLedger(repo);
	expect(calls.length).toBe(2);
	const modes = calls.map((c) => rederiveResolvedMode(c, floorDecide));
	expect(modes[0]).toBe(modes[1]);
	expect(modes[0]).toBe(calls[0]!.resolvedMode);
});

test("a recorded call's mode is re-derivable from the committed file alone, offline", () => {
	const repo = tmpRepo();
	appendGateCall(
		callInput({
			answers: { "q-x": { type: "choice", value: "yes", probabilities: { yes: 0.9, no: 0.1 }, confidence: 0.95 } },
			questionIds: ["q-x"],
			resolvedMode: "Verify",
		}),
		repo,
	);
	const { calls } = readGateLedger(repo);
	expect(rederiveResolvedMode(calls[0]!, floorDecide)).toBe("Verify");
});

test("the line alone suffices: stripping confidence from a stored line breaks re-derivation", () => {
	const repo = tmpRepo();
	appendGateCall(callInput({ questionIds: ["q-x"], answers: { "q-x": { type: "choice", value: "yes", probabilities: { yes: 0.9, no: 0.1 }, confidence: 0.95 } } }), repo);
	const parsed = JSON.parse(fs.readFileSync(gateLedgerPath(repo), "utf-8").trim());
	delete parsed.answers["q-x"].confidence;
	expect(() => rederiveResolvedMode(parsed as never, floorDecide)).toThrow(/missing confidence/);
});

test("a null (absent) answer re-derives to Deliberate through the seam", () => {
	const repo = tmpRepo();
	appendGateCall(callInput(), repo); // q-blast has no answer → null
	const { calls } = readGateLedger(repo);
	expect(rederiveResolvedMode(calls[0]!, floorDecide)).toBe("Deliberate");
});

test("an outcome joins its call as a follow-on line; the call line is never rewritten", () => {
	const repo = tmpRepo();
	const rec = appendGateCall(callInput(), repo);
	const before = fs.readFileSync(gateLedgerPath(repo), "utf-8");
	appendGateOutcome({ callId: rec.callId, outcome: { cardId: "EV-9", landed: true } }, repo);
	const after = fs.readFileSync(gateLedgerPath(repo), "utf-8");
	expect(after.startsWith(before)).toBe(true); // append-only: the call line is byte-frozen
	const { calls } = readGateLedger(repo);
	expect(calls[0]!.outcome).toEqual({ cardId: "EV-9", landed: true });
});

test("an orphan outcome is tolerated and reported, never fatal", () => {
	const repo = tmpRepo();
	appendGateOutcome({ callId: "no-such-call", outcome: { x: 1 } }, repo);
	const { calls, orphanOutcomes } = readGateLedger(repo);
	expect(calls).toEqual([]);
	expect(orphanOutcomes.length).toBe(1);
	expect(orphanOutcomes[0]!.outcome).toEqual({ x: 1 });
});

test("the reader tolerates a torn trailing line, a blank line, and an unknown kind", () => {
	const repo = tmpRepo();
	appendGateCall(callInput(), repo);
	fs.appendFileSync(gateLedgerPath(repo), "\n");
	fs.appendFileSync(gateLedgerPath(repo), JSON.stringify({ schemaVersion: 99, kind: "future-thing" }) + "\n");
	fs.appendFileSync(gateLedgerPath(repo), '{"kind":"call","callId":"torn"'); // no newline, mid-write tail
	const { calls, orphanOutcomes } = readGateLedger(repo);
	expect(calls.length).toBe(1);
	expect(orphanOutcomes).toEqual([]);
});

test("readGateLedger of a missing file is empty, never a throw", () => {
	const repo = tmpRepo();
	expect(readGateLedger(repo)).toEqual({ calls: [], orphanOutcomes: [] });
});
```

- [ ] **Step 2: Run to verify RED** — new imports fail: `readGateLedger`/`rederiveResolvedMode` not exported.
- [ ] **Step 3: Implement** the reader and seam minimally (parse-skip-tolerant loop, outcome join last-wins, `rederiveResolvedMode` one-liner).
- [ ] **Step 4: Run to verify GREEN.**
- [ ] **Step 5: Commit** `feat(gate-ledger): EV-61 tolerant JSONL reader and offline re-derivation seam`

### Task 3: Discipline tests + module header documentation

**Files:**
- Modify: `extensions/gate-ledger.ts` (header comment only, if needed)
- Test: `test/gate-ledger.test.ts` (append)

**Interfaces:**
- Consumes: everything above.
- Produces: the accessor-discipline and no-network source-scan tests (EV-60 `cost-baseline.test.ts` shape), and the header documenting the outcome design choice and the never-reads-the-run-directory posture.

- [ ] **Step 1: Write the failing tests**

```ts
test("the reader never reads the pruned run directory and performs no network call", () => {
	const moduleUrl = fileURLToPath(import.meta.resolve("../extensions/gate-ledger.ts"));
	const source = readFileSync(moduleUrl, "utf-8");
	// Run-directory discipline: no run-substrate accessors, no runs/ references.
	expect(source).not.toContain("./runs.ts");
	expect(source).not.toContain("runsDir");
	expect(source).not.toContain("readManifests");
	expect(source).not.toContain("pruneRuns");
	expect(source).not.toContain("runs/");
	// No network anywhere in the module.
	expect(source).not.toContain("fetch(");
	expect(source).not.toContain("openrouter");
	// No hardcoded .pi — the config dir comes from the package.
	expect(source).not.toContain('".pi"');
});

test("the module's imports are exactly the stdlib plus the pi-coding-agent package", () => {
	const moduleUrl = fileURLToPath(import.meta.resolve("../extensions/gate-ledger.ts"));
	const source = readFileSync(moduleUrl, "utf-8");
	const imports = [...source.matchAll(/(?:^|\n)import\s[^;]*from\s*"([^"]+)";/g)].map((m) => m[1]);
	expect(imports.sort()).toEqual(
		["@earendil-works/pi-coding-agent", "node:crypto", "node:fs", "node:path"],
	);
});
```

(plus `readFileSync`/`fileURLToPath` imports at the top of the test file if not already present)

- [ ] **Step 2: Run to verify RED or GREEN.** These are source-shape assertions; if the implementation already conforms they pass immediately — that is acceptable for a discipline pin (it constrains future edits), but the header text must still be added and re-checked. If any assertion fails, fix the module, never the test.
- [ ] **Step 3: Add the module header** documenting: placement + committed-by-default (with the `git check-ignore` verification note), append-only single-write mechanics, torn-tail tolerance, the follow-on-outcome design choice, and the never-reads-the-run-directory posture.
- [ ] **Step 4: Run to verify GREEN; then the full suite** `bun test` stays green.
- [ ] **Step 5: Commit** `test(gate-ledger): EV-61 reader discipline and no-network source pins`

### Task 4: The four gates, branch push, PR

- [ ] **Step 1:** `bash council/preflight.sh` — must print no `FAIL:` line.
- [ ] **Step 2:** `bunx tsc --noEmit` — clean.
- [ ] **Step 3:** `bun test` — full suite green, integration tests stay disabled (no `COUNCIL_INTEGRATION=1`).
- [ ] **Step 4:** `python3 council/validate.py` — `All council artifacts valid`.
- [ ] **Step 5:** `git push -u origin feat/ev-61-gate-ledger` and `gh pr create` against `main`; PR body summarizes the change, the record schema, the outcome design choice, the committed-by-default verification (`git check-ignore` exit 1), and each gate's observed result verbatim.
- [ ] **Step 6:** Report head SHA and gate results. Do not poll CI; do not touch board/card state.

## Self-Review

- **Spec coverage:** goal fields (stateHash, questionSetVersion, answers with probabilities+confidence, resolvedMode, policyVersion) → Task 1 tests 1–4; two-calls-identical-re-derivation → Task 2 test 1; absent-as-absent → Task 1 test 3; write failure with absolute path → Task 1 test 6; no-run-dir-read assertion → Task 3 test 1; read-back from committed file with no network → Task 2 tests 1–2; committed-by-default → verified via `git check-ignore` (recorded, no rule added). ✔
- **Placeholder scan:** none — every step carries its code. ✔
- **Type consistency:** `GateAnswer`, `GateLedgerRecord`, `DecideFn`, `ReadGateLedgerResult` names used identically across tasks. ✔
- **Review Focus:** all five entries have owning tests or a recorded verification. ✔
