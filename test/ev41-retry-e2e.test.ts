// EV-41 — the end-to-end falsifier for provider-error retry on BOTH paths
// (card: one falsifier covering seat child + parent turn; (b) and (c) live in
// this one file with a shared verdict; the TUI branch's pty runner is
// test/faux-provider/ev41-tui.py, spawned from here).
//
// The forced failure class is the WITH-COLON literal
// `Provider finish_reason: error` — byte-equal to PROVIDER_FINISH_REASON_ERROR
// (extensions/retry.ts:54, O3 literal hygiene: the shipped constant is the
// authority; the colon-less EV-43 spelling is classify-negative on both
// clauses and tests nothing, so it is never used here).
//
// Attribution discipline (EV-43): every treatment arm has a control with no
// mechanism (the retry policy disabled) that must show no continuation, and
// pi's own auto-retry is excluded up front — the with-colon literal does not
// match pi's shipped retryable pattern, so a second assistant message can
// only come from council's mechanism.
//
//   (b) seat path   — a real Hub + createRetrySupervisor dispatch of the
//                     STUB_MODE=finish_error stub child: attempt 1 settles
//                     done carrying stopReason error + the with-colon literal
//                     (classifyRetry === "retry"), attempt 2 is spawned
//                     automatically and settles clean under the same job id
//                     and manifest, with attempt: 2, one job-tree row,
//                     cumulative usage, and a final report naming the attempts.
//   (c) parent path — the REAL council extension (extensions/index.ts) drives
//                     the retry against the EV-40 faux provider failing once
//                     with the with-colon literal:
//                       - `-p` branch via runHarnessArm (real installed pi
//                         CLI, scratch HOME, explicit env, --offline):
//                         countdown line on the real stdout + second
//                         assistant message in the session JSONL;
//                       - TUI branch via test/faux-provider/ev41-tui.py (pty, 24x80, real
//                         TUI): the same observables on the screen;
//                       - control arm per branch (retry disabled): no
//                         countdown, no continuation.
import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import { mkdtempSync, rmSync } from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { CONFIG_DIR_NAME } from "@earendil-works/pi-coding-agent";
import { isRetryableAssistantError } from "@earendil-works/pi-ai";
import { Hub } from "../extensions/hub.ts";
import { createRetrySupervisor } from "../extensions/job-retry.ts";
import {
	classifyRetry,
	computeBackoffDelay,
	PROVIDER_FINISH_REASON_ERROR,
	type RetryPolicy,
} from "../extensions/retry.ts";
import { formatReport } from "../extensions/hub-tools.ts";
import { ensureRunDir, readManifests } from "../extensions/runs.ts";
import { buildTree, flattenTree } from "../extensions/tree.ts";
import { formatRetryCountdown } from "../extensions/parent-retry.ts";
import {
	CLI_PATH,
	COUNCIL_EXTENSION,
	HARNESS_EXTENSION,
	parseSessionEntries,
	resolveNode,
	runHarnessArm,
	type EngineRepoOptions,
} from "./faux-provider/harness.ts";
import { INJECTED_ERROR_MESSAGE } from "./faux-provider/extension.ts";

const STUB = path.join(import.meta.dir, "stub-child.ts");

/** The engine's `.council.json` retry section for the harness arms (jitter
 * off → exact delays; baseDelayMs 200 → the countdown names "1s"). */
const parentPolicy = (over: Record<string, unknown> = {}): EngineRepoOptions => ({
	retryPolicy: {
		retry: { enabled: true, maxAttempts: 3, baseDelayMs: 200, maxDelayMs: 5000, jitter: false, ...over },
	},
	procedureBody: "EV41-PROBE-TURN",
});

// ---------------------------------------------------------------------------
// O3 hygiene + attribution preconditions (unit-cheap; they gate the arms)
// ---------------------------------------------------------------------------

describe("EV-41 preconditions — literal hygiene + attribution", () => {
	test("the harness's injected errorMessage is exactly the with-colon intake literal", () => {
		expect(INJECTED_ERROR_MESSAGE).toBe(PROVIDER_FINISH_REASON_ERROR);
		expect(PROVIDER_FINISH_REASON_ERROR).toBe("Provider finish_reason: error"); // with colon
	});

	test("pi's own auto-retry cannot produce the second message: the with-colon literal is NOT retryable by pi", () => {
		const msg = {
			role: "assistant",
			content: [],
			api: "faux",
			provider: "ev40",
			model: "ev40-model",
			usage: {
				input: 0,
				output: 0,
				cacheRead: 0,
				cacheWrite: 0,
				totalTokens: 0,
				cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
			},
			stopReason: "error",
			errorMessage: PROVIDER_FINISH_REASON_ERROR,
			timestamp: Date.now(),
		} as any;
		expect(isRetryableAssistantError(msg)).toBe(false);
		// Contrast: the 502 string IS pi-retryable (pi owns it; council's parent
		// loop must never stack a second loop on top — classifyParentTurnRetry
		// returns undefined there).
		expect(isRetryableAssistantError({ ...msg, errorMessage: "Provider returned 502: upstream unavailable" })).toBe(true);
		expect(classifyRetry({ id: "j", seat: "s", state: "done", output: "", elapsedMs: 0, usage: null as never, stderrTail: "", stopReason: "error", errorMessage: PROVIDER_FINISH_REASON_ERROR })).toBe("retry");
	});
});

// ---------------------------------------------------------------------------
// (b) Seat-child falsifier — real Hub + createRetrySupervisor, end to end
// ---------------------------------------------------------------------------

describe("EV-41 (b) seat-child falsifier — the automatic retry end to end", () => {
	test(
		"finish_error attempt 1 settles retryable; attempt 2 respawns under the same id/manifest and settles clean",
		async () => {
			const root = mkdtempSync(path.join(os.tmpdir(), "ev41-seat-"));
			ensureRunDir(root, "run41");
			const pidFile = path.join(os.tmpdir(), `ev41-hub-${process.pid}.json`);
			const hub = new Hub({ monitorIntervalMs: 50, pidFile, run: { repoRoot: root, runId: "run41" } });
			try {
				const state = path.join(mkdtempSync(path.join(os.tmpdir(), "ev41-stub-")), "state.json");
				const policy: RetryPolicy = { enabled: true, maxAttempts: 3, baseDelayMs: 500, maxDelayMs: 500, jitter: false };
				const id = hub.allocateId();
				const finishErrorEnv = () =>
					({ ...process.env, STUB_MODE: "finish_error", STUB_STATE: state, STUB_FAIL_TIMES: "1" }) as Record<string, string>;

				// Real supervisor; injected timer records the armed delay but still
				// fires automatically (the default unref'd setTimeout semantics).
				let armedDelayMs: number | undefined;
				const sup = createRetrySupervisor({
					hub,
					jobId: id,
					policy,
					cleanup: () => {},
					attemptSpec: (n) => ({
						args: [STUB],
						cwd: import.meta.dir,
						env: finishErrorEnv(),
						sessionId: `${id}-attempt${n}`,
						timeoutMs: 60_000,
						stallMs: 60_000,
					}),
					setTimer: (fn, ms) => {
						armedDelayMs = ms;
						const t = setTimeout(fn, ms);
						t.unref?.();
						return { cancel: () => clearTimeout(t) };
					},
				});
				// Observation wrapper: capture the REAL attempt-1 settle report the
				// Hub hands the supervisor, then delegate to the real supervisor.
				const attempt1Reports: Parameters<typeof sup.onSettle>[1][] = [];
				hub.spawnJob({
					id,
					seat: "stub",
					command: "bun",
					args: [STUB],
					cwd: import.meta.dir,
					env: finishErrorEnv(),
					timeoutMs: 60_000,
					stallMs: 60_000,
					sessionId: id,
					cleanup: () => {},
					retry: {
						onSettle: (job, report) => {
							attempt1Reports.push(report);
							return sup.onSettle(job, report);
						},
						dispose: () => sup.dispose(),
					},
				});

				// Attempt 1 settles done (exit 0) carrying the retryable signal; the
				// supervisor armed the backoff (500ms window) before attempt 2.
				const mFile = path.join(root, CONFIG_DIR_NAME, "council", "runs", "run41", `${id}.json`);
				let retrying: Record<string, unknown> | undefined;
				for (let i = 0; i < 200 && !retrying; i++) {
					try {
						const parsed = JSON.parse(fs.readFileSync(mFile, "utf-8")) as Record<string, unknown>;
						if (parsed.state === "retrying") retrying = parsed;
					} catch {
						/* not written yet */
					}
					await Bun.sleep(10);
				}

				// The attempt-1 settle report: state=done (the provider-errored child
				// exits 0), stopReason error, errorMessage byte-equal, classifyRetry
				// verdict "retry".
				expect(attempt1Reports.length).toBeGreaterThanOrEqual(1);
				const r1 = attempt1Reports[0]!;
				expect(r1.state).toBe("done");
				expect(r1.stopReason).toBe("error");
				expect(r1.errorMessage).toBe(PROVIDER_FINISH_REASON_ERROR);
				expect(classifyRetry(r1)).toBe("retry");

				// The backoff policy ran: the timer was armed with computeBackoffDelay
				// (baseDelayMs 500, attempt 2, jitter off).
				expect(armedDelayMs).toBe(computeBackoffDelay(policy, 2));

				// Mid-backoff manifest: same id/one file, the PENDING ordinal 2, the
				// COMPLETED attempt's session id, the settled attempt-1 prefix.
				expect(retrying).toBeDefined();
				expect(retrying!.state).toBe("retrying");
				expect(retrying!.attempt).toBe(2);
				expect(typeof retrying!.nextAttemptAt).toBe("number");
				expect(retrying!.sessionId).toBe(id);
				expect(retrying!.attempts).toEqual([{ attempt: 1, sessionId: id }]);

				// The automatic retry lands: wait resolves ONCE, clean.
				const [r2] = await hub.wait([id], 10_000);
				expect(r2.state).toBe("done");
				expect(r2.output).toBe("stub result");
				expect(r2.stopReason).toBe("stop");
				// Cumulative usage across both attempts.
				expect(r2.usage.turns).toBe(2);

				// Cardinality A: ONE manifest, final attempt 2, complete ordered
				// attempts list, the FINAL attempt's session id, exit 0.
				const ms = readManifests(root, "run41").filter((x) => x.id === id);
				expect(ms).toHaveLength(1);
				const m = ms[0]!;
				expect(m.attempt).toBe(2);
				expect(m.attempts).toEqual([
					{ attempt: 1, sessionId: id },
					{ attempt: 2, sessionId: `${id}-attempt2` },
				]);
				expect(m.sessionId).toBe(`${id}-attempt2`);
				expect(m.exitCode).toBe(0);
				expect(m.state).toBe("done");

				// One job-tree row for the whole dispatch (one intent, not two rows).
				const rows = flattenTree(buildTree(readManifests(root, "run41")));
				expect(rows).toHaveLength(1);
				expect(rows[0]!.manifest.id).toBe(id);

				// The final report names the attempts.
				const reportText = formatReport(r2, { n: 2, max: 3 });
				expect(reportText.split("\n")[0]).toContain("attempts=2/3");
				expect(reportText).toContain("Settled on attempt 2 of 3.");
			} finally {
				hub.shutdown();
				rmSync(root, { recursive: true, force: true });
				try {
					fs.unlinkSync(pidFile);
				} catch {
					/* already gone */
				}
			}
		},
		20_000,
	);
});

// ---------------------------------------------------------------------------
// (c) Parent-turn falsifier — headless `-p` branch + control
// ---------------------------------------------------------------------------

describe("EV-41 (c) parent-turn falsifier — headless -p branch (real council extension)", () => {
	test(
		"treatment: countdown on the real stdout, second assistant message in the session; control (retry disabled): neither",
		() => {
			const scratchRoot = mkdtempSync(path.join(os.tmpdir(), "ev41-parent-"));
			try {
				// Treatment: the real council extension's agent_settled retry (the
				// harness's own arm is "none" — no continuation from the harness).
				const treatment = runHarnessArm(
					{ label: "ev41-parent-treatment", fails: 1, arm: "none", councilExtension: true },
					scratchRoot,
					parentPolicy(),
				);
				// The automatic retry is observable on the REAL stdout (O-ROUTE: the
				// countdown is printed via fs.writeSync(1, …) — read through pi's
				// stdout takeover).
				expect(treatment.stdout).toContain(formatRetryCountdown(2, 3, 200));
				expect(treatment.stdout).toContain("(attempt 2 of 3)");
				// The continuation landed: the second assistant message is the run's
				// output; the errored turn carried the with-colon literal.
				expect(treatment.exitCode).toBe(0);
				const entries = parseSessionEntries(treatment.sessionPath!);
				expect(entries.filter((e) => e.role === "user" && e.text.includes("start")).length).toBe(2); // original + the retry re-send
				const errored = entries.filter(
					(e) => e.role === "assistant" && e.stopReason === "error" && e.errorMessage === PROVIDER_FINISH_REASON_ERROR,
				);
				expect(errored.length).toBe(1);
				const secondIdx = entries.findIndex((e) => e.role === "assistant" && e.text.includes("EV40-SECOND-RESPONSE"));
				expect(secondIdx).toBeGreaterThan(entries.findIndex((e) => e === errored[0]));
				expect(treatment.stdout).toContain("EV40-SECOND-RESPONSE");

				// Control: identical provider behavior, NO mechanism (retry disabled).
				// No countdown, no continuation, no second message — the treatment's
				// second message is attributable to council's retry policy alone.
				const control = runHarnessArm(
					{ label: "ev41-parent-control", fails: 1, arm: "none", councilExtension: true },
					scratchRoot,
					parentPolicy({ enabled: false }),
				);
				expect(control.stdout).not.toContain("Retrying in");
				expect(control.stdout).not.toContain("EV40-SECOND-RESPONSE");
				const controlEntries = parseSessionEntries(control.sessionPath!);
				expect(controlEntries.filter((e) => e.role === "user" && e.text.includes("start")).length).toBe(1);
				expect(
					controlEntries.filter(
						(e) => e.role === "assistant" && e.stopReason === "error" && e.errorMessage === PROVIDER_FINISH_REASON_ERROR,
					).length,
				).toBe(1);
				expect(controlEntries.some((e) => e.role === "assistant" && e.text.includes("EV40-SECOND-RESPONSE"))).toBe(false);
			} finally {
				rmSync(scratchRoot, { recursive: true, force: true });
			}
		},
		180_000,
	);
});

// ---------------------------------------------------------------------------
// (c) Parent-turn falsifier — TUI branch (pty, via test/ev41-tui.py)
// ---------------------------------------------------------------------------

describe("EV-41 (c) parent-turn falsifier — TUI branch (real TUI + real council extension, pty)", () => {
	test(
		"treatment: countdown + second assistant message on the 24x80 screen; control (retry disabled): neither",
		() => {
			const scratchRoot = mkdtempSync(path.join(os.tmpdir(), "ev41-tui-test-"));
			try {
				const outdir = path.join(scratchRoot, "tui");
				fs.mkdirSync(outdir, { recursive: true });
				const res = spawnSync(
					"python3",
					[path.join(import.meta.dir, "faux-provider", "ev41-tui.py"), outdir],
					{
						env: {
							PATH: process.env.PATH ?? "/usr/bin:/bin",
							NODE_BIN: resolveNode(),
							CLI_PATH,
							EXT_PATH: HARNESS_EXTENSION,
							COUNCIL_EXT: COUNCIL_EXTENSION,
						},
						encoding: "utf-8",
						timeout: 280_000,
					},
				);
				const output = `${res.stdout ?? ""}${res.stderr ?? ""}`;
				// Keep the raw runner output on disk for triage when red.
				fs.writeFileSync(path.join(scratchRoot, "tui-runner-output.txt"), output);
				expect(res.status).toBe(0);
				expect(output).toContain("EV41-TUI-VERDICT: GREEN");
				expect(output).toContain("EV41-TUI-TREATMENT: GREEN");
				expect(output).toContain("EV41-TUI-CONTROL (no mechanism => no continuation): GREEN");
			} finally {
				rmSync(scratchRoot, { recursive: true, force: true });
			}
		},
		300_000,
	);
});
