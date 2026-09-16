// EV-37 — pure retry classification for settled job reports (ruling R1).
//
// classifyRetry keys on stopReason + errorMessage for the retry decision,
// never on state: a provider-errored child exits 0 and settles as `done`.
// The snapshot drift test re-extracts pi's shipped
// RETRYABLE_PROVIDER_ERROR_PATTERN token list from the installed bundle and
// asserts equality, so a pi update that changes the list fails here instead
// of silently narrowing council's superset (R1).
import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, sep } from "node:path";
import { fileURLToPath } from "node:url";
import type { JobReport } from "../extensions/hub.ts";
import type { Usage } from "../extensions/runs.ts";
import {
	PROVIDER_FINISH_REASON_ERROR,
	RETRYABLE_PROVIDER_ERROR_PATTERNS,
	classifyRetry,
} from "../extensions/retry.ts";

const usage: Usage = {
	input: 0,
	output: 0,
	cacheRead: 0,
	cacheWrite: 0,
	reasoning: 0,
	totalTokens: 0,
	cost: 0,
	costInput: 0,
	costOutput: 0,
	costCacheRead: 0,
	costCacheWrite: 0,
	turns: 0,
	costBasis: "catalogue-estimate",
	usageSource: "stream-assistant",
};

function report(overrides: Partial<JobReport> = {}): JobReport {
	return {
		id: "j1",
		seat: "skeptic",
		state: "done",
		output: "",
		elapsedMs: 0,
		usage,
		stderrTail: "",
		...overrides,
	};
}

describe("classifyRetry", () => {
	test("retries a done report with pi's emitted Provider finish_reason: error", () => {
		expect(classifyRetry(report({ stopReason: "error", errorMessage: "Provider finish_reason: error" }))).toBe("retry");
	});

	test("retries a done report matching pi's shipped retryable pattern", () => {
		for (const msg of [
			"502 Bad Gateway",
			"rate limit exceeded",
			"overloaded",
			"socket hang up",
			"Request timed out",
			"Connection refused",
		]) {
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
	// Locate the installed pi package the same way
	// test/env-split-contract.test.ts resolves it: entry → walk to package root.
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
		// Equality in both directions: a pi update that adds or removes a token
		// fails this test and forces a deliberate snapshot refresh (R1: never
		// silently narrow — and never silently widen either).
		expect(tokens).toEqual([...RETRYABLE_PROVIDER_ERROR_PATTERNS]);
	});

	test("snapshot compiles to the same regex semantics pi uses", () => {
		const re = new RegExp(RETRYABLE_PROVIDER_ERROR_PATTERNS.join("|"), "i");
		expect(re.test("HTTP 502")).toBe(true);
	});
});

describe("pi finish_reason literal regression (Resume 2 PO ruling, job-8)", () => {
	// Locate the installed pi package the same way the snapshot-drift describe
	// does: entry → walk to package root. The ruling binds "the literal" to
	// pi's real emitted message, so the expectation is derived from the
	// installed bundle's mapStopReason template — never re-declared here.
	const ENTRY_URL = import.meta.resolve("@earendil-works/pi-coding-agent");
	const ENTRY_PATH = fileURLToPath(ENTRY_URL);
	if (!ENTRY_PATH.endsWith(`${sep}dist${sep}index.js`)) {
		throw new Error(`EV-37: pi entry resolved to unexpected path ${ENTRY_PATH}`);
	}
	const PKG_ROOT = dirname(dirname(ENTRY_PATH));

	function findTemplateFiles(dir: string): string[] {
		const out: string[] = [];
		for (const name of readdirSync(dir)) {
			const p = join(dir, name);
			if (statSync(p).isDirectory()) out.push(...findTemplateFiles(p));
			else if (name.endsWith(".js") && readFileSync(p, "utf8").includes("Provider finish_reason:")) out.push(p);
		}
		return out;
	}

	test("PROVIDER_FINISH_REASON_ERROR matches pi's emitted message byte-for-byte", () => {
		// pi's mapStopReason default case: errorMessage:`Provider finish_reason: ${reason}`
		// (dist/bundle/chunks/openai-completions-EKZT2IH2.js). Extract the
		// template and evaluate it at reason === "error" — that evaluation is
		// the string pi actually puts in JobReport.errorMessage.
		const files = findTemplateFiles(join(PKG_ROOT, "dist", "bundle"));
		expect(files.length).toBeGreaterThan(0);
		let template: string | undefined;
		for (const file of files) {
			const match = readFileSync(file, "utf8").match(/errorMessage:`(Provider finish_reason: \$\{reason\})`/);
			if (match) {
				template = match[1];
				break;
			}
		}
		expect(template).toBeDefined();
		const emitted = (template as string).replace("${reason}", "error");
		// Byte-for-byte: the constant must equal pi's emitted message.
		expect(PROVIDER_FINISH_REASON_ERROR).toBe(emitted);
		// Behavior: a settled report carrying pi's real emitted string retries.
		expect(classifyRetry(report({ stopReason: "error", errorMessage: emitted }))).toBe("retry");
	});
});
