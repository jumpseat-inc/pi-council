// FLLWUP-56 — the seat-child live arm: the parent-turn offline faux-provider
// harness reaching a REAL seat child (the card's oracle). The (b) stub arm in
// test/ev41-retry-e2e.test.ts stays byte-untouched; this file adds the
// child-half falsifier.
//
// Drive shape: the PARENT-SESSION drive (spec §2) — a real print-mode pi
// parent (runHarnessArm, council extension loaded) whose scripted turn is
// council_dispatch → council_wait (EV40_TOOLCALL_WAIT=1) → success. The
// dispatch spawns a real seat child: the engine's own path (hub-tools.ts
// `command: "pi"` + buildChildArgv), PATH-resolved through a scratch launcher
// shim that deterministically runs the dev-installed CLI (the FLLWUP-21
// env-split lesson). The child's repo-local `.pi/extensions` shim (project
// extension auto-discovery under `-a` — the mechanism this card falsifies)
// strips every EV40_* knob the parent's env leaked through childEnv's spread
// (O7), re-keys the per-attempt failure count from this process's
// `--session-id` (COUNCIL_JOB_ID is the same jobId on every attempt — NOT a
// discriminator, O4), and loads the shared faux-provider extension via a
// dynamic `await import()` placed after the env fixes (the shared module
// reads EV40_FAILS at module top level; a static `export { default } from`
// would evaluate the dependency first and read the leaked knob — O5).
//
// Attribution: the forced failure class is the with-colon literal
// `Provider finish_reason: error` (INJECTED_ERROR_MESSAGE — only the faux
// provider emits it). The council_wait toolResult — not the council_dispatch
// toolResult, which returns immediately and never carries child output (O3) —
// is the assertion carrier. The manifest's attempts[] pairing
// (job-1 / job-1-attempt2) is the assertion that the parent survived the
// backoff window: job-retry.ts unrefs the backoff timer, so the chain
// completes only because hub.wait (isSettledForWait false while the job is
// retrying) holds the dispatching process's turn open.
//
// Expected wall clock ≈18–30s for the block; outer bun ceiling 120_000 ms per
// arm (above the 0.5/0.5-min per-attempt inner ceilings — a hang reports
// attribution, the FLLWUP-48 O7 lesson).
import { expect, test } from "bun:test";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { CONFIG_DIR_NAME } from "@earendil-works/pi-coding-agent";
import { buildChildArgv, loadSeat } from "../extensions/seats.ts";
import { attemptEntries, findSessionFile } from "../extensions/runs.ts";
import { parseTranscript } from "../extensions/transcript.ts";
import {
	CLI_PATH,
	HARNESS_EXTENSION,
	INJECTED_ERROR_MESSAGE,
	parseSessionEntries,
	prepareHarnessArm,
	resolveNode,
	runHarnessArm,
	type ArmOptions,
	type EngineRepoOptions,
} from "./faux-provider/harness.ts";

const JOB_ID = "job-1";
const ATTEMPT2_SESSION_ID = "job-1-attempt2";
const SEAT = "skeptic";
const SEAT_MODEL = "ev40/ev40-model";
const MARKER = "EV40-SECOND-RESPONSE";
// FLLWUP-114 — the Part B replay dispatches the RUNNER seat: only a
// council-runner dispatch composes the procedure bodies into the child's
// first user message (hub-tools.ts composeRunnerInput), which is the surface
// the cross-attempt byte-equality asserts. The control arm stays skeptic
// (byte-untouched). The scratch card face carries epic: EPIC-1 (the
// skeptic-verified dispatchable shape — EPIC-1's own face is epic: null and
// cardEpicKey fail-loud refuses it).

/** The scratch `pi` launcher: the hub's hardcoded `command: "pi"`
 * (hub-tools.ts) PATH-resolves to this executable, which stamps the witness
 * and deterministically runs the dev-installed CLI. Returns the shim dir to
 * prepend to the arm's PATH. */
function writePiLauncherShim(scratchRoot: string, witnessPath: string): string {
	const dir = mkdtempSync(path.join(scratchRoot, "ev56-pi-launcher-"));
	const script = path.join(dir, "pi");
	writeFileSync(
		script,
		`#!/bin/sh\nprintf 'pi\\n' > "${witnessPath}"\nexec "${resolveNode()}" "${CLI_PATH}" "$@"\n`,
		{ mode: 0o755 },
	);
	return dir;
}

/** The scratch repo's `.council.json`: the seat-model override (the real
 * config-injection path — loadSeat → applySeatOverride(loadCouncilConfig))
 * plus the retry policy under test. `enabled: false` is the control arm's
 * no-mechanism condition. */
function engineRepo(retryEnabled: boolean, extraRepoFiles: EngineRepoOptions["extraRepoFiles"]): EngineRepoOptions {
	return {
		retryPolicy: {
			council: { [SEAT]: { model: SEAT_MODEL } },
			retry: { enabled: retryEnabled, maxAttempts: 2, baseDelayMs: 200, jitter: false },
		},
		procedureBody: "EV56-PROBE-TURN",
		extraRepoFiles,
	};
}

/** The minimal repo-local seat file the `.council.json` override shadows —
 * the frontmatter model is deliberately NOT the override's model, so the
 * static precondition proves the override won. */
function seatFile(): EngineRepoOptions["extraRepoFiles"] {
	return [
		{
			path: path.join(CONFIG_DIR_NAME, "agents", `${SEAT}.md`),
			body: `---\nname: ${SEAT}\ndescription: FLLWUP-56 live arm seat\nmodel: frontmatter/placeholder-model\ntools: Read\n---\nunit-test body`,
		},
	];
}

/** The project-local extension shim written into the scratch repo (treatment
 * only). Runtime-generated — never a repo file, and it carries no provider
 * factory token (the FLLWUP-49 shape witness stays untouched): the shim
 * re-exports the single shared provider extension. */
function extensionShimBody(): string {
	return `// FLLWUP-56 scratch shim (runtime-generated; lives only in the arm's scratch
// repo). Project-local extension auto-loaded by BOTH pi processes that run
// in this repo: the seat child AND the print-mode parent (discovery is not
// -a gated; the scratch HOME pre-grants project trust). Only the child
// carries --session-id (buildChildArgv), so that is the child discriminator.
// FLLWUP-114: the runner child additionally needs the faux provider itself —
// registered UNCONDITIONALLY here (the runner-child provider call must
// resolve ev40/ev40-model), with the FAILING call still gated on the
// --session-id discriminator (the guard is load-bearing: without it the
// parent's own provider calls would fail and no retry would arm).
const sidIdx = process.argv.indexOf("--session-id");
if (sidIdx < 0) {
	// Parent (no --session-id): pure no-op. The -e-loaded harness extension
	// already scripted the dispatch/wait turn and registers the provider in
	// the parent (extension.ts calls pi.registerProvider at load), and the
	// loader's jiti has moduleCache disabled — a second import here would
	// re-evaluate the shared module and double-register its provider/handlers
	// in the parent.
	module.exports.default = () => {};
} else {
	// Child: (a) strip every EV40_* knob the parent's env leaked through
	// childEnv's spread (runs.ts childEnv spreads the parent's process.env).
	for (const k of Object.keys(process.env)) {
		if (k.startsWith("EV40_")) delete process.env[k];
	}
	// (b) Re-key the per-attempt failure count from THIS process's
	// --session-id. COUNCIL_JOB_ID is the same jobId on every attempt and is
	// NOT a valid discriminator; the supervisor's respawn carries -attempt2
	// in the session id.
	const sessionId = process.argv[sidIdx + 1];
	process.env.EV40_FAILS = sessionId === ${JSON.stringify(ATTEMPT2_SESSION_ID)} ? "0" : "1";
	process.env.EV40_ARM = "none";
	// (c) Load the shared faux-provider extension via await import() AT THIS
	// STATEMENT: it reads EV40_FAILS at module top level, so it must evaluate
	// AFTER the env fixes above (Skeptic O5 — a static \`export { default } from\`
	// would evaluate the dependency first and read the leaked knob). The dynamic
	// form is also load-mechanics-mandatory: a nested require() from inside a
	// jiti-transformed shim re-resolves through jiti's sync pipeline, where the
	// loader's file-valued alias (@earendil-works/pi-ai → compat.js) prefix-
	// matches subpath requires ("cannot find compat.js/utils/uuid"); await
	// import() bypasses that pipeline and loads the shared module with correct
	// resolution (probe ev56-debug, green on both branches).
	const shared = await import(${JSON.stringify(HARNESS_EXTENSION)});
	module.exports.default = shared.default;
}
`;
}

/** FLLWUP-114 — the scratch card face the runner dispatch composes from.
 * Byte-0-anchored frontmatter block with a trailing newline (FLLWUP-115's
 * caveat), epic: EPIC-1 so cardEpicKey resolves and the features-deliver
 * overlay binds. */
function runnerCardFace(): EngineRepoOptions["extraRepoFiles"] {
	return [
		{
			path: "council/cards/EV-2.md",
			body: "---\nid: EV-2\ntitle: FLLWUP-114 replay fixture\nstate: Ready\nepic: EPIC-1\n---\n\nBody.\n",
		},
	];
}

/** FLLWUP-114 — the runner-seat override: frontmatter model deliberately NOT
 * the override's model (the .council.json override must win), hub + spawns
 * grants present so the runner can dispatch children. The engine composes
 * the procedure bodies into this seat's dispatch input. */
function runnerSeatFile(): EngineRepoOptions["extraRepoFiles"] {
	return [
		{
			path: path.join(CONFIG_DIR_NAME, "agents", "council-runner.md"),
			body: '---\nname: council-runner\ndescription: FLLWUP-114 replay runner\nmodel: frontmatter/placeholder-model\ntools: Read, task, hub\nspawns: [skeptic]\n---\nunit-test body',
		},
	];
}

interface ToolResultRecord {
	toolName: string;
	text: string;
	isError: boolean;
}

/** The parent session's toolResult messages — the wait toolResult is the
 * assertion carrier (O3). */
function toolResults(sessionPath: string): ToolResultRecord[] {
	const out: ToolResultRecord[] = [];
	for (const line of readFileSync(sessionPath, "utf-8").split("\n")) {
		if (!line.trim()) continue;
		let entry: any;
		try {
			entry = JSON.parse(line);
		} catch {
			continue;
		}
		const msg = entry.message ?? entry;
		if (msg?.role !== "toolResult") continue;
		const text = Array.isArray(msg.content)
			? msg.content.filter((c: any) => c.type === "text").map((c: any) => c.text).join("")
			: "";
		out.push({ toolName: msg.toolName, text, isError: !!msg.isError });
	}
	return out;
}

/** The single run dir the parent's dispatch created under the scratch repo. */
function findRunDir(workDir: string): string {
	const runs = path.join(workDir, CONFIG_DIR_NAME, "council", "runs");
	const ids = readdirSync(runs).filter((d) => !d.startsWith("."));
	if (ids.length !== 1) throw new Error(`EV56: expected exactly one run dir under ${runs}, got ${JSON.stringify(ids)}`);
	return path.join(runs, ids[0]!);
}

/** Static preconditions (no spawn): the seat resolves to the override's model
 * through the real config-injection path; buildChildArgv carries `-a` and
 * neither `-e` nor `--provider`; the launcher resolves. Computed against a
 * throwaway substrate of the SAME opts so nothing here depends on the arm's
 * spawn artifacts. */
function assertStaticPreconditions(opts: ArmOptions, repo: EngineRepoOptions): void {
	const preRoot = mkdtempSync(path.join(os.tmpdir(), "ev56-precheck-"));
	try {
		const pre = prepareHarnessArm(opts, preRoot, repo);
		const seat = loadSeat(pre.workDir, SEAT);
		expect(seat.model).toBe(SEAT_MODEL);
		const argv = buildChildArgv(seat, "EV56 static precondition probe", "/tmp/ev56-prompt.md", [], {
			sessionDir: "/tmp/ev56-sessions",
			sessionId: JOB_ID,
		});
		expect(argv).toContain("-a");
		expect(argv).not.toContain("-e");
		expect(argv).not.toContain("--provider");
		// The launcher resolves: the shim script is on the prepared PATH's first
		// dir, and the dev-installed CLI it execs exists (the harness module
		// itself throws a named error at load when either is unresolvable).
		const launcher = path.join(pre.env.PATH.split(":")[0]!, "pi");
		if (!existsSync(launcher)) throw new Error("EV56: the scratch `pi` launcher shim was not prepared on PATH");
		if (!existsSync(CLI_PATH)) throw new Error("EV56: the dev-installed pi CLI is unresolvable");
	} finally {
		rmSync(preRoot, { recursive: true, force: true });
	}
}

test(
	"FLLWUP-56/FLLWUP-114 treatment: the harness parent turn reaches a real seat child — provider error on attempt 1, hub retry respawns, attempt 2 succeeds",
	() => {
		const scratchRoot = mkdtempSync(path.join(os.tmpdir(), "ev56-treatment-"));
		const witnessPath = path.join(scratchRoot, "ev56-launcher.witness");
		const opts: ArmOptions = {
			label: "ev56-seat-child-treatment",
			fails: 0,
			arm: "none",
			councilExtension: true,
			toolcallDispatch: true,
			toolcallWait: true,
			// FLLWUP-114: dispatch the RUNNER against a card — the composed
			// procedure bodies are the surface the replay asserts.
			toolcallSeat: "council-runner",
			cardId: "EV-2",
			pathPrepend: [writePiLauncherShim(scratchRoot, witnessPath)],
			extraEnv: { PI_OFFLINE: "1" }, // the child has no --offline argv
			timeoutMs: 120_000,
		};
		const repo = engineRepo(true, [
			...(runnerSeatFile() ?? []),
			...(runnerCardFace() ?? []),
			{
				path: path.join(CONFIG_DIR_NAME, "extensions", "ev56-shim.ts"),
				body: extensionShimBody(),
			},
		]);
		try {
			assertStaticPreconditions(opts, repo);

			const arm = runHarnessArm(opts, scratchRoot, repo);
			expect(arm.exitCode).toBe(0);

			// (2) The child ran through the launcher witness (`command: "pi"` captured
			// verbatim), and the council_WAIT toolResult — not the dispatch one —
			// carries the final job success and the attempt-2 marker.
			expect(readFileSync(witnessPath, "utf-8").trim()).toBe("pi");
			const results = toolResults(arm.sessionPath!);
			const dispatchResult = results.find((r) => r.toolName === "council_dispatch");
			const waitResult = results.find((r) => r.toolName === "council_wait");
			expect(dispatchResult).toBeDefined();
			expect(waitResult).toBeDefined();
			expect(dispatchResult!.text).toContain("Dispatched");
			expect(dispatchResult!.text).not.toContain(MARKER);
			expect(waitResult!.text).toContain("state=done");
			expect(waitResult!.text).toContain(MARKER);

			// (3) The manifest's attempts[] pairing — the timer-owner process (the
			// parent) survived the backoff window and respawned attempt 2.
			const runDir = findRunDir(arm.workDir);
			const manifest = JSON.parse(readFileSync(path.join(runDir, `${JOB_ID}.json`), "utf-8"));
			expect(manifest.attempts).toEqual([
				{ attempt: 1, sessionId: JOB_ID },
				{ attempt: 2, sessionId: ATTEMPT2_SESSION_ID },
			]);

			// (4) Attempt-1 child session: the reachability witness — the errored
			// assistant entry carries the with-colon literal (only the faux provider
			// emits it).
			const attempt1Path = findSessionFile(arm.workDir, path.basename(runDir), JOB_ID);
			expect(attempt1Path).toBeDefined();
			const attempt1 = parseSessionEntries(attempt1Path!);
			expect(
				attempt1.some((e) => e.role === "assistant" && e.stopReason === "error" && e.errorMessage === INJECTED_ERROR_MESSAGE),
			).toBe(true);

			// (5) Attempt-2 child session: the marker, no error entry; manifest done.
			const attempt2Path = findSessionFile(arm.workDir, path.basename(runDir), ATTEMPT2_SESSION_ID);
			expect(attempt2Path).toBeDefined();
			const attempt2 = parseSessionEntries(attempt2Path!);
			expect(attempt2.some((e) => e.role === "assistant" && e.text.includes(MARKER))).toBe(true);
			expect(attempt2.some((e) => e.stopReason === "error")).toBe(false);
			expect(manifest.state).toBe("done");

			// =================================================================
			// FLLWUP-114 Part B — cross-attempt transcript byte-equality.
			// Spec: docs/superpowers/specs/2026-09-24-FLLWUP-114-design.md §Part B.
			// attemptSpec (hub-tools.ts:305–318) closes over the single computed
			// dispatchInput and varies only sessionId, so both attempts' first
			// user block — the composed runner input — is byte-identical at the
			// {kind, text} projection; the derived `at` is the sole volatile and
			// MUST differ (the exclusion is load-bearing, not vacuous).
			// =================================================================
			const attemptEntriesList = attemptEntries(manifest);
			expect(attemptEntriesList).toEqual([
				{ attempt: 1, sessionId: JOB_ID },
				{ attempt: 2, sessionId: ATTEMPT2_SESSION_ID },
			]);
			const locatedBlocks = attemptEntriesList.map((entry) => {
				const p = findSessionFile(arm.workDir, path.basename(runDir), entry.sessionId);
				expect(p).toBeDefined();
				const blocks = parseTranscript(readFileSync(p!, "utf-8"));
				const procedureBlocks = blocks.filter(
					(b) => b.kind === "user" && b.text.includes("<council-procedure>"),
				);
				// Exactly one located block per attempt — never blocks[0] (two
				// empty/absent first blocks would be byte-equal unfalsifiably).
				expect(procedureBlocks).toHaveLength(1);
				const located = procedureBlocks[0]!;
				expect(located.text.trim().length).toBeGreaterThan(0);
				expect(located.text).toContain("<features-deliver-overlay>");
				expect(located.text).toContain("EV-2"); // the council.md rendering binds the card id
				return located;
			});
			const [b1, b2] = locatedBlocks;
			// {kind, text} byte-equal across the real retry seam; raw `at` differs.
			expect(JSON.stringify({ kind: b1!.kind, text: b1!.text })).toBe(
				JSON.stringify({ kind: b2!.kind, text: b2!.text }),
			);
			expect(b1!.at).not.toBe(b2!.at);
		} finally {
			rmSync(scratchRoot, { recursive: true, force: true });
		}
	},
	120_000,
);

test(
	"FLLWUP-56 control (retry disabled): exactly one spawn, zero respawns, the literal present, no attempt-2 session, no marker anywhere",
	() => {
		const scratchRoot = mkdtempSync(path.join(os.tmpdir(), "ev56-control-"));
		const witnessPath = path.join(scratchRoot, "ev56-launcher.witness");
		const opts: ArmOptions = {
			label: "ev56-seat-child-control",
			fails: 0,
			arm: "none",
			councilExtension: true,
			toolcallDispatch: true,
			toolcallWait: true,
			pathPrepend: [writePiLauncherShim(scratchRoot, witnessPath)],
			extraEnv: { PI_OFFLINE: "1" },
			timeoutMs: 120_000,
		};
		const repo = engineRepo(false, [
			...(seatFile() ?? []),
			{
				path: path.join(CONFIG_DIR_NAME, "extensions", "ev56-shim.ts"),
				body: extensionShimBody(),
			},
		]);
		try {
			assertStaticPreconditions(opts, repo);

			const arm = runHarnessArm(opts, scratchRoot, repo);
			expect(arm.exitCode).toBe(0);
			expect(readFileSync(witnessPath, "utf-8").trim()).toBe("pi");

			const runDir = findRunDir(arm.workDir);
			const manifest = JSON.parse(readFileSync(path.join(runDir, `${JOB_ID}.json`), "utf-8"));
			// One spawn, zero respawns: no attempt keys in the manifest.
			expect(manifest.attempts).toBeUndefined();
			expect(manifest.attempt).toBeUndefined();
			// Exactly one child session file; no attempt-2 session.
			expect(existsSync(path.join(runDir, `${ATTEMPT2_SESSION_ID}.jsonl`))).toBe(false);
			const attempt1Path = findSessionFile(arm.workDir, path.basename(runDir), JOB_ID);
			expect(attempt1Path).toBeDefined();
			// The literal IS present (the reachability witness holds without the
			// retry mechanism too).
			const attempt1 = parseSessionEntries(attempt1Path!);
			expect(
				attempt1.some((e) => e.role === "assistant" && e.stopReason === "error" && e.errorMessage === INJECTED_ERROR_MESSAGE),
			).toBe(true);
			// No marker in any child-session file, the manifest, or the wait
			// toolResult.
			for (const f of readdirSync(runDir)) {
				if (!f.endsWith(".jsonl")) continue;
				expect(readFileSync(path.join(runDir, f), "utf-8")).not.toContain(MARKER);
			}
			expect(JSON.stringify(manifest)).not.toContain(MARKER);
			const waitResult = toolResults(arm.sessionPath!).find((r) => r.toolName === "council_wait");
			expect(waitResult).toBeDefined();
			expect(waitResult!.text).not.toContain(MARKER);
		} finally {
			rmSync(scratchRoot, { recursive: true, force: true });
		}
	},
	120_000,
);
