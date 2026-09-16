# EV-37 Retry Classification Predicate — Implementation Plan

> **Fold-in amendment (2026-09-16, Resume 2 PO ruling job-8, binding).** The
> literal is corrected from the colon-free `Provider finish_reason error` to
> **`Provider finish_reason: error` (with colon)** — pi's real emitted message.
> Binding source: the card's **Intent**, which "unambiguously binds 'the
> literal' to pi's real emitted message"; the goal field's colon-free spelling
> is structurally forced by `council/validate.py:50-52` and does not carry the
> definition. Grounding: the installed pi 0.85.1 bundle's `mapStopReason`
> default case is ``errorMessage:`Provider finish_reason: ${reason}` ``
> (`dist/bundle/chunks/openai-completions-EKZT2IH2.js`); no bundle hit exists
> for the colon-free form, so the branch as first written was dead code. The
> snippets below retain the original colon-free spelling as a historical
> record of the plan as written; `extensions/retry.ts` and
> `test/retry.test.ts` at the fold-in head carry the corrected literal, and
> the regression test derives the expectation from the installed bundle and
> asserts byte-for-byte equality.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A pure `classifyRetry(report: JobReport): "retry" | "terminal" | undefined` in `extensions/retry.ts` that returns `retry` for settled reports with `stopReason === "error"` whose `errorMessage` is the literal `Provider finish_reason error` or matches pi's shipped retryable-provider-error pattern, `terminal` for `stopReason` `"stop"`/`"length"` and for the `failed`/`cancelled`/`stalled`/`timeout` states, and `undefined` for everything else.

**Architecture:** One new pure module (`extensions/retry.ts`) with no hub wiring, no `.council.json` policy section, and no backoff loop (those are EV-38/39/40). The pi pattern list is re-declared as a version-pinned snapshot because `RETRYABLE_PROVIDER_ERROR_PATTERN` is built inside `dist/bundle/chunks/chunk-JVUZSMYM.js:475` of `@earendil-works/pi-coding-agent@0.85.1` via `buildProviderErrorPattern([...]) = new RegExp(tokens.join("|"), "i")` but is **not** exported from `dist/index.js` nor declared in any `.d.ts` (verified at dispatch). A drift test in `test/retry.test.ts` re-extracts the token list from the installed bundle and asserts equality with the snapshot, so a pi update that changes the list fails the suite instead of silently diverging.

**Tech Stack:** TypeScript (strict, `bunx tsc --noEmit`), `bun:test`, `@earendil-works/pi-coding-agent` (devDependency, `>=0.84.3 <0.86.0`).

**Spec:** council/cards/EV-37.md (mechanical path — the card is the spec) + Phase 1 ruling R1: council's classifier is a **superset** of pi's; it never retries less than pi would.

## Global Constraints

- Worktree only: `/home/tista/codes/pi-council/.worktrees/ev-37`, branch `feat/ev-37-retry-classification`; never checkout/switch/reset the main checkout.
- Never edit `council/board.md`, `council/cards/EV-37.md`, or anything under `vault/`.
- Keys on `stopReason` + `errorMessage` for the retry decision, **never** on `state` (a provider-errored child exits 0 and settles as `done`).
- Superset rule (R1): every input pi would retry must yield `retry` here.
- `errorMessage` is optional on `JobReport` (`extensions/hub.ts:36-37`); a missing or non-matching message with `stopReason === "error"` → `undefined`.
- Conventional Commits; tests in `test/` importing `../extensions/retry.ts`.

## Settled-set and truth-table decisions (stated per the card)

- **Settled** = `state ∈ {done, failed, cancelled, stalled, timeout}`; a `running` report yields `undefined` for every input (its stopReason is transient).
- **Retry rule (state-independent):** settled ∧ `stopReason === "error"` ∧ (`errorMessage === "Provider finish_reason error"` ∨ `RETRYABLE.test(errorMessage ?? "")`) → `"retry"`. Note a `failed`-state report with a matching error message still retries — state never blocks retry (R1 superset of pi, which keys on the message alone).
- **Terminal rule:** settled ∧ (`stopReason ∈ {stop, length}` ∨ `state ∈ {failed, cancelled, stalled, timeout}`) → `"terminal"`. The state clause is the *default* terminal for settled failure states that carry no retryable signal (stalled/timeout jobs typically have `stopReason === undefined`); it never overrides a retry match because the retry rule is evaluated first and never consults state.
- Everything else (`running`; `done` with `stopReason` `"aborted"`/`undefined`/`"pending"`; `error` with missing/non-matching message) → `undefined`.

---

### Task 1: Plan commit

- [x] **Step 1:** Write this plan file, commit it:

```bash
git add docs/superpowers/plans/2026-09-16-EV-37-retry-classification.md
git commit -m "docs(retry): EV-37 implementation plan for classifyRetry"
```

### Task 2: Failing truth-table + drift tests (RED)

**Files:**
- Create: `test/retry.test.ts`

**Interfaces:**
- Consumes: `classifyRetry(report: JobReport): "retry" | "terminal" | undefined`, `RETRYABLE_PROVIDER_ERROR_PATTERNS: readonly string[]`, `PROVIDER_FINISH_REASON_ERROR: string` (all from `../extensions/retry.ts`, not yet existing).
- Produces: the complete acceptance surface EV-38 (retry loop) will build against.

- [ ] **Step 1: Write the failing tests**

```typescript
// EV-37 — pure retry classification for settled job reports (ruling R1).
//
// classifyRetry keys on stopReason + errorMessage for the retry decision,
// never on state: a provider-errored child exits 0 and settles as `done`.
// The snapshot drift test re-extracts pi's shipped
// RETRYABLE_PROVIDER_ERROR_PATTERN token list from the installed bundle and
// asserts byte equality, so a pi update that changes the list fails here
// instead of silently narrowing council's superset (R1).
import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, sep } from "node:path";
import { fileURLToPath } from "node:url";
import {
	PROVIDER_FINISH_REASON_ERROR,
	RETRYABLE_PROVIDER_ERROR_PATTERNS,
	classifyRetry,
} from "../extensions/retry.ts";
import type { JobReport } from "../extensions/hub.ts";

function report(overrides: Partial<JobReport> = {}): JobReport {
	return {
		id: "j1",
		seat: "skeptic",
		state: "done",
		output: "",
		elapsedMs: 0,
		usage: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, totalTokens: 0, cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 } },
		stderrTail: "",
		...overrides,
	};
}

describe("classifyRetry", () => {
	test("retries a done report with the literal Provider finish_reason error", () => {
		expect(classifyRetry(report({ stopReason: "error", errorMessage: "Provider finish_reason error" }))).toBe("retry");
	});

	test("retries a done report matching pi's shipped retryable pattern", () => {
		for (const msg of ["502 Bad Gateway", "rate limit exceeded", "overloaded", "socket hang up", "Request timed out", "Connection refused"]) {
			expect(classifyRetry(report({ stopReason: "error", errorMessage: msg }))).toBe("retry");
		}
	});

	test("retries regardless of settled state — state never blocks retry (R1)", () => {
		// pi keys on the message alone; a failed-state report with a retryable
		// message is still retryable here, else council would retry less than pi.
		for (const state of ["done", "failed", "cancelled", "stalled", "timeout"] as const) {
			expect(classifyRetry(report({ state, stopReason: "error", errorMessage: "502" }))).toBe("retry");
		}
	});

	test("terminal for stopReason stop or length", () => {
		expect(classifyRetry(report({ stopReason: "stop" }))).toBe("terminal");
		expect(classifyRetry(report({ stopReason: "length" }))).toBe("terminal");
	});

	test("terminal for the failed, cancelled, stalled, and timeout states", () => {
		for (const state of ["failed", "cancelled", "stalled", "timeout"] as const) {
			expect(classifyRetry(report({ state }))).toBe("terminal");
		}
	});

	test("undefined for error stopReason with missing or non-matching errorMessage", () => {
		expect(classifyRetry(report({ stopReason: "error" }))).toBeUndefined();
		expect(classifyRetry(report({ stopReason: "error", errorMessage: "usage limit reached" }))).toBeUndefined();
	});

	test("undefined for everything outside the named cases", () => {
		expect(classifyRetry(report({ state: "running", stopReason: "error", errorMessage: "502" }))).toBeUndefined();
		expect(classifyRetry(report({}))).toBeUndefined();
		expect(classifyRetry(report({ stopReason: "aborted" }))).toBeUndefined();
	});
});

describe("pi pattern snapshot drift (R1 superset guard)", () => {
	// Locate the installed pi package the same way test/env-split-contract.test.ts does.
	const ENTRY_URL = import.meta.resolve("@earendil-works/pi-coding-agent");
	const ENTRY_PATH = fileURLToPath(ENTRY_URL);
	if (!ENTRY_PATH.endsWith(`${sep}dist${sep}index.js`)) {
		throw new Error(`EV-37: pi entry resolved to unexpected path ${ENTRY_PATH}`);
	}
	const PKG_ROOT = dirname(dirname(ENTRY_PATH));

	function findPatternFiles(dir: string): string[] {
		const out: string[] = [];
		for (const name of readdirSync(dir)) {
			const p = join(dir, name);
			if (statSync(p).isDirectory()) out.push(...findPatternFiles(p));
			else if (name.endsWith(".js") && readFileSync(p, "utf8").includes("RETRYABLE_PROVIDER_ERROR_PATTERN")) out.push(p);
		}
		return out;
	}

	test("snapshot equals the installed pi bundle's token list", () => {
		const files = findPatternFiles(join(PKG_ROOT, "dist"));
		expect(files.length).toBeGreaterThan(0);
		const tokens: string[] = [];
		for (const file of files) {
			const src = readFileSync(file, "utf8");
			const match = src.match(/RETRYABLE_PROVIDER_ERROR_PATTERN=buildProviderErrorPattern\((\[[^\]]*\])\)/);
			if (!match) continue;
			tokens.push(...(JSON.parse(match[1]) as string[]));
		}
		// Byte equality in both directions: a pi update that adds or removes a
		// token fails this test and forces a deliberate snapshot refresh (R1:
		// never silently narrow — and never silently widen either).
		expect(tokens).toEqual([...RETRYABLE_PROVIDER_ERROR_PATTERNS]);
	});

	test("snapshot compiles to the same regex semantics pi uses", () => {
		const re = new RegExp(RETRYABLE_PROVIDER_ERROR_PATTERNS.join("|"), "i");
		expect(PROVIDER_FINISH_REASON_ERROR).toBe("Provider finish_reason error");
		expect(re.test("HTTP 502")).toBe(true);
	});
});
```

- [ ] **Step 2: Run to verify RED (module missing)**

Run: `bun test test/retry.test.ts`
Expected: FAIL — `error: Cannot find module ... extensions/retry.ts` (feature missing, not a typo).

- [ ] **Step 3: Capture the exact failure output in the card report.**

### Task 3: Implement `extensions/retry.ts` (GREEN)

**Files:**
- Create: `extensions/retry.ts`

**Interfaces:**
- Consumes: `type { JobReport, JobState }` from `./hub.ts` (type-only import — the established pattern, e.g. `extensions/dispatch.ts:15`; pulls no runtime hub code).
- Produces: `classifyRetry(report: JobReport): "retry" | "terminal" | undefined`; `RETRYABLE_PROVIDER_ERROR_PATTERNS: readonly string[]`; `PROVIDER_FINISH_REASON_ERROR: "Provider finish_reason error"`.

- [ ] **Step 1: Write the module**

```typescript
// EV-37 — pure retry classification for settled job reports (ruling R1).
//
// The retry decision keys on stopReason + errorMessage and never on state:
// a provider-errored child exits 0 and settles as `done`, so "retry failed
// jobs" is wrong on arrival. Council's classifier is a superset of pi's
// shipped retryable-provider-error pattern — it never retries less than pi.
import type { JobReport, JobState } from "./hub.ts";

/**
 * Snapshot of pi's RETRYABLE_PROVIDER_ERROR_PATTERN source tokens, pinned to
 * @earendil-works/pi-coding-agent@0.85.1
 * (dist/bundle/chunks/chunk-JVUZSMYM.js:475), where
 * buildProviderErrorPattern(tokens) = new RegExp(tokens.join("|"), "i").
 * The compiled pattern is not exported from pi's public API (no .d.ts
 * declaration, absent from dist/index.js), so council re-declares the token
 * list verbatim. test/retry.test.ts re-extracts the list from the installed
 * bundle and asserts equality — a pi update that changes the list fails the
 * suite and forces a deliberate snapshot refresh (R1: never silently narrow,
 * never silently widen).
 */
export const RETRYABLE_PROVIDER_ERROR_PATTERNS = [
	"overloaded",
	"rate.?limit",
	"too many requests",
	"429",
	"500",
	"502",
	"503",
	"504",
	"524",
	"service.?unavailable",
	"server.?error",
	"internal.?error",
	"provider.?returned.?error",
	"exceeded request buffer limit while retrying upstream",
	"network.?error",
	"connection.?error",
	"connection.?refused",
	"connection.?lost",
	"other side closed",
	"fetch failed",
	"getaddrinfo",
	"ENOTFOUND",
	"EAI_AGAIN",
	"upstream.?connect",
	"reset before headers",
	"socket hang up",
	"socket connection was closed",
	"timed? out",
	"timeout",
	"terminated",
	"websocket.?closed",
	"websocket.?error",
	"ended without",
	"stream ended before message_stop",
	"stream ended before a terminal response event",
	"http2 request did not get a response",
	"retry delay",
	"you can retry your request",
	"try your request again",
	"please retry your request",
	"ResourceExhausted",
] as const;

/** Council-widened literal: the provider declined with a finish_reason error. */
export const PROVIDER_FINISH_REASON_ERROR = "Provider finish_reason error";

const RETRYABLE_PROVIDER_ERROR = new RegExp(RETRYABLE_PROVIDER_ERROR_PATTERNS.join("|"), "i");

const SETTLED_STATES: readonly JobState[] = ["done", "failed", "cancelled", "stalled", "timeout"];
const TERMINAL_STATES: readonly JobState[] = ["failed", "cancelled", "stalled", "timeout"];

export type RetryVerdict = "retry" | "terminal";

/**
 * Classify a settled job report for the retry loop (EV-38's input).
 *
 * - "retry"    — settled, stopReason "error", and the message is the literal
 *                Provider finish_reason error or matches pi's shipped
 *                retryable pattern (state-independent: state never blocks a
 *                retry pi itself would make).
 * - "terminal" — settled with stopReason "stop"/"length", or one of the
 *                failed/cancelled/stalled/timeout states (the state clause is
 *                the default terminal for settled failures carrying no
 *                retryable signal; it never overrides a retry match).
 * - undefined  — every other input: running reports, missing stopReason,
 *                "aborted"/"pending", or an error stopReason whose message is
 *                missing or non-retryable (pi wouldn't retry it either).
 */
export function classifyRetry(report: JobReport): RetryVerdict | undefined {
	if (!SETTLED_STATES.includes(report.state)) return undefined;
	if (report.stopReason === "error") {
		const message = report.errorMessage ?? "";
		if (message === PROVIDER_FINISH_REASON_ERROR || RETRYABLE_PROVIDER_ERROR.test(message)) {
			return "retry";
		}
	}
	if (report.stopReason === "stop" || report.stopReason === "length") return "terminal";
	if (TERMINAL_STATES.includes(report.state)) return "terminal";
	return undefined;
}
```

- [ ] **Step 2: Run to verify GREEN**

Run: `bun test test/retry.test.ts`
Expected: PASS, output pristine.

### Task 4: Gates (in order, on the final tree)

- [ ] **Step 1:** `bash council/preflight.sh EV-37` — expect OK lines only; if the known FLLWUP-27 artifact fires (`FAIL: local history does not descend from origin/main`), record the exact line (at dispatch `main == origin/main == 2dfab02`).
- [ ] **Step 2:** `bunx tsc --noEmit` — expect silent success.
- [ ] **Step 3:** `bun test` — expect full suite green (1 skipped integration unless `COUNCIL_INTEGRATION=1`, which must NOT be run).
- [ ] **Step 4:** `python3 council/validate.py` — expect exit 0.

### Task 5: Commit implementation, push, open PR

- [ ] **Step 1:** `git add extensions/retry.ts test/retry.test.ts && git commit -m "feat(retry): EV-37 pure classifyRetry for settled job reports"`
- [ ] **Step 2:** `git push -u origin feat/ev-37-retry-classification`
- [ ] **Step 3:** `gh pr create --base main --head feat/ev-37-retry-classification --title "feat(retry): EV-37 retry classification predicate for settled job reports" --body "<card id, goal, what changed, gate results>"`
- [ ] **Step 4:** STOP — do not poll CI, do not merge.
