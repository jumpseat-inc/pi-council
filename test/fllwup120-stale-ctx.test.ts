// FLLWUP-120 — the print-mode stale-ctx parent crash when a dispatched job
// outlives its turn (card: council/cards/FLLWUP-120.md).
//
// The observed crash (FLLWUP-114's live run): the parent `pi -p` teardown
// disposed the extension context, then the dispatched seat child settled and
// the hub's onChange fired `renderWidget` against the disposed context —
// killing the parent with an unhandled stale-ctx throw.
//
// The settled pi teardown order (read from the installed runtime under test,
// dist/core/agent-session-runtime.js `dispose()`):
//   1. `emitSessionShutdownEvent(..., reason: "quit")` — the real
//      session_shutdown handlers run (council's calls shutdownHub → SIGKILL),
//   2. `beforeSessionInvalidate?.()`,
//   3. `session.dispose()` → extension runner invalidate → every captured
//      session_start ctx's `.ui` getter throws "stale after session
//      replacement…" (dist/core/agent-session.js:833).
//
// The crash class is ASYNC-POST-TEARDOWN: the hub's SIGKILLed children still
// emit `close` → `settle()` → `onChange()` after invalidate, and index.ts's
// `renderWidget` (extensions/index.ts) reads `uiCtx.ui` UNGUARDED — unlike
// the `getUi()` seam, which try/catches the same throw (spec §2.5).
//
// This test reproduces that ordering in-process: activate the REAL
// parent-mode extension against a fake pi, dispatch a real child through the
// real hub singleton, run the REAL session_shutdown handler (reason "quit",
// which SIGKILLs the child), then let the close→settle→onChange fan-out hit
// `renderWidget` while `uiCtx.ui` throws pi's stale-ctx error. The bun test
// process is the witness: an escaping throw surfaces as an unhandled
// exception and fails the run.
import { test, expect } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import activateCouncil from "../extensions/index.ts";
import { getHub, initHubIdentity, shutdownHub } from "../extensions/hub-tools.ts";
import { ensureRunDir } from "../extensions/runs.ts";

const STUB = path.join(import.meta.dir, "stub-child.ts");

/** The real installed pi (devDependency) surfaces, shaped down to the surface
 * extensions/index.ts's parent path actually touches: event registration
 * (the handlers this test drives directly), command/tool registration
 * (session_start registers the eval command), sendUserMessage/exec (the
 * retry wiring — never fired here). */
function makeFakePi() {
	const events = new Map<string, (event: any, ctx: any) => any>();
	return {
		events,
		pi: {
			on: (type: string, handler: (event: any, ctx: any) => any) => void events.set(type, handler),
			registerCommand: () => {},
			registerShortcut: () => {},
			registerTool: () => {},
			sendUserMessage: () => {},
			exec: () => {},
		},
	};
}

/** A faithful model of pi's real per-event ctx (dist/core/extensions/runner.js
 * `createContext`): ONE object whose every property getter routes through
 * `assertActive()` — after invalidate, ANY access throws, including `.hasUI`
 * on renderWidget's first line. The live phase answers normally; once
 * `invalidate()` runs, every getter throws the stale-ctx error. */
function makeCtx(): { ctx: any; invalidate: () => void; touches: () => number } {
	const state = { live: true, uiTouches: 0 };
	const assertActive = () => {
		if (!state.live) {
			state.uiTouches++;
			throw new Error(
				`This extension ctx is stale after session replacement or reload. Do not use a captured pi or command ctx after ctx.newSession().`,
			);
		}
	};
	const ctx = {
		get mode() {
			assertActive();
			return "print";
		},
		get hasUI() {
			assertActive();
			return false; // live phase: no widget surface; notifies degrade to console
		},
		get ui() {
			assertActive();
			return { setWidget: () => {}, notify: () => {} };
		},
	};
	return { ctx, invalidate: () => void (state.live = false), touches: () => state.uiTouches };
}

test(
	"FLLWUP-120: a dispatched job settling after its parent print-mode turn tore down drives renderWidget against the disposed ctx without an unhandled stale-ctx crash",
	async () => {
		const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), "fllwup120-"));
		const prevCwd = process.cwd();
		const savedSeat = process.env.COUNCIL_SEAT;
		delete process.env.COUNCIL_SEAT; // the runner env must never flip the activation into child mode
		const harness = makeCtx();
		try {
			process.chdir(repoRoot);
			shutdownHub(); // isolation: no singleton from a prior test
			initHubIdentity(`fllwup120-${Date.now()}`);
			const { pi, events } = makeFakePi();
			await activateCouncil(pi as never);
			const startHandler = events.get("session_start");
			const shutdownHandler = events.get("session_shutdown");
			expect(typeof startHandler).toBe("function");
			expect(typeof shutdownHandler).toBe("function");

			// Live phase: session_start captures uiCtx and wires the real hub
			// singleton's onChange → renderWidget.
			await startHandler!({ type: "session_start" }, harness.ctx);

			// Dispatch a real child through the real hub singleton. STUB_MODE=slow
			// keeps it alive ~10s, so it definitely survives until the teardown
			// SIGKILL — the child's `close` event lands AFTER the invalidate.
			const hub = getHub(repoRoot);
			// Same substrate the real dispatch tool arms (hub-tools:255): the run
			// dir keyed by the hub's own runId, so the per-job manifest writes
			// have a home.
			ensureRunDir(repoRoot, hub.runId!);
			const job = hub.spawnJob({
				id: hub.allocateId(),
				seat: "stub",
				command: "bun",
				args: [STUB],
				cwd: import.meta.dir,
				env: { ...process.env, STUB_MODE: "slow" } as Record<string, string>,
				timeoutMs: 60_000,
				stallMs: 60_000,
			});
			expect(job.state).toBe("running");

			// The REAL print-mode teardown order (agent-session-runtime.js
			// `dispose()`): session_shutdown (reason "quit") first — its real
			// handler calls shutdownHub(), SIGKILLing the child — on a STILL-LIVE
			// ctx; invalidate comes after emitSessionShutdownEvent, so the SAME
			// captured ctx then goes stale in place, every getter now throwing
			// (runner.js createContext).
			await shutdownHandler!({ type: "session_shutdown", reason: "quit" }, harness.ctx);
			harness.invalidate();

			// Post-teardown: the SIGKILLed child's close → settle → onChange fires
			// renderWidget against the stale ctx. Poll for the reachability probe.
			const deadline = Date.now() + 10_000;
			while (harness.touches() === 0 && Date.now() < deadline) {
				await new Promise((r) => setTimeout(r, 25));
			}
			// The crash path WAS reached post-teardown (the falsifier's probe —
			// without this assertion a silent no-op would "pass" vacuously).
			expect(harness.touches()).toBeGreaterThan(0);
			// The engine's settled behavior is pinned by the process itself: no
			// unhandled stale-ctx crash escapes this path (the renderWidget-seam
			// guard swallows exactly pi's stale-ctx throw; any other error still
			// propagates and fails the suite).
		} finally {
			shutdownHub();
			process.chdir(prevCwd);
			if (savedSeat !== undefined) process.env.COUNCIL_SEAT = savedSeat;
			fs.rmSync(repoRoot, { recursive: true, force: true });
		}
	},
	30_000,
);
