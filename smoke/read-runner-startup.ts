/**
 * FLLWUP-114 Part A — the pure runner-startup transcript reader.
 *
 * Spec: docs/superpowers/specs/2026-09-24-FLLWUP-114-design.md §Part A.
 *
 * Locates the ROOT council-runner session for a run dir and asserts the
 * runner-startup surface predictions EV-90's step-9 record classified as
 * live-smoke-only verification material:
 *
 *   AC2 — before the runner's first `council_dispatch` toolCall, no toolCall
 *         labeled `read` (case-insensitive — pi's labels are lowercase;
 *         test/transcript.test.ts:18 pins `bash`) has a first argument
 *         ending in `council/procedures/council.md` or
 *         `council/procedures/features-deliver.md`.
 *   AC3 — the transcript's FIRST toolCall block's first argument is not
 *         under `council/procedures/`.
 *
 * Liveness anchors are asserted BEFORE AC2/AC3 (skeptic O5): a transcript
 * missing any anchor FAILS the reader rather than passing vacuously —
 * ≥1 toolCall, ≥1 council_dispatch-labeled toolCall, exactly one
 * non-empty <council-procedure> user block also carrying
 * <features-deliver-overlay>.
 *
 * The located transcript is found ONLY via readManifests → findSessionFile
 * (extensions/runs.ts:191) — never the RUNNER_SESSIONS grep in driver.sh,
 * which matches .json manifests, not sessions (principal round 2 verified).
 *
 * Unit tests ride the existing default-suite file test/ev90-runner-input.test.ts
 * (AC5: no new file under test/). bun test discovers nothing under smoke/ —
 * the smoke/reeval.ts / smoke/leaderview.ts precedent (skeptic-verified).
 *
 * CLI (the driver's verdict surface):
 *   bun smoke/read-runner-startup.ts <repoRoot> [cardId]
 * Exits 0 + verdict line on success; 1 + reason on any failed assertion.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { parseTranscript, firstArgOf, type TranscriptBlock } from "../extensions/transcript.ts";
import { findSessionFile, listRunIds, readManifests, runsDir } from "../extensions/runs.ts";

const RUNNER_SEAT = "council-runner";
const MARKER_PROCEDURE = "<council-procedure>";
const MARKER_OVERLAY = "<features-deliver-overlay>";

const AC2_FORBIDDEN_SUFFIXES = [
	"council/procedures/council.md",
	"council/procedures/features-deliver.md",
] as const;

function fail(reason: string): never {
	throw new Error(`fllwup114-reader: ${reason}`);
}

function isToolCall(b: TranscriptBlock): boolean {
	return b.kind === "toolCall";
}

function labelOf(b: TranscriptBlock): string {
	return (b.label ?? "").toLowerCase();
}

export interface RunnerStartup {
	runId: string;
	sessionId: string;
	file: string;
}

/**
 * The pure reader. Throws `fllwup114-reader: …` on every failure; returns
 * the located run/session identity on success.
 */
export function readRunnerStartup(repoRoot: string, cardId?: string): RunnerStartup {
	// Selection — the spec's named extraction path, never a grep.
	const base = runsDir(repoRoot);
	if (!fs.existsSync(base)) fail(`no runs dir at ${base} — no council-runner session was ever written`);

	const runIds = listRunIds(repoRoot);
	if (runIds.length === 0) fail(`no run dirs under ${base}`);

	// Two-pass selection: resolve FIRST (latest run carrying a resolvable ROOT
	// runner session wins), THEN assert — an anchor-less transcript in an older
	// run never aborts selection; failures throw only for the selected session.
	for (const runId of runIds) {
		const manifests = readManifests(repoRoot, runId).filter((m) => m.seat === RUNNER_SEAT);
		for (const m of manifests) {
			const file = findSessionFile(repoRoot, runId, m.sessionId);
			if (!file) continue; // session not (yet) on disk — keep looking
			return checkSession(file, runId, m.sessionId, cardId);
		}
	}
	fail(
		`no ${RUNNER_SEAT} manifest with a resolvable session JSONL under ${base} (runs scanned: ${runIds.join(", ")})`,
	);
}

function checkSession(file: string, runId: string, sessionId: string, cardId?: string): RunnerStartup {
	const raw = fs.readFileSync(file, "utf-8");
	const blocks = parseTranscript(raw);

	// ---- Liveness anchors (BEFORE any acceptance check — skeptic O5) ----
	const calls = blocks.filter(isToolCall);
	if (calls.length === 0) fail(`anchors: transcript has zero toolCall blocks (${file})`);

	const dispatchCalls = calls.filter((b) => labelOf(b) === "council_dispatch");
	if (dispatchCalls.length === 0)
		fail(`anchors: transcript has no council_dispatch-labeled toolCall (${file})`);

	const userBlocks = blocks.filter((b) => b.kind === "user");
	const firstUser = userBlocks[0];
	if (!firstUser || firstUser.text.trim() === "")
		fail(`anchors: first user block missing or empty (${file})`);
	if (!firstUser!.text.includes(MARKER_PROCEDURE) || !firstUser!.text.includes(MARKER_OVERLAY))
		fail(
			`anchors: first user block lacks ${MARKER_PROCEDURE}/${MARKER_OVERLAY} markers — not the composed runner input (${file})`,
		);

	const procedureBlocks = userBlocks.filter((b) => b.text.includes(MARKER_PROCEDURE));
	if (procedureBlocks.length !== 1)
		fail(`anchors: expected exactly one ${MARKER_PROCEDURE} user block, found ${procedureBlocks.length} (${file})`);

	if (cardId !== undefined && !firstUser!.text.includes(cardId)) {
		fail(`anchors: first user block does not carry card id "${cardId}" (marker consistency)`);
	}

	// ---- AC2 (before the runner's own first dispatch) ----
	const dispatchIdx = blocks.findIndex((b) => isToolCall(b) && labelOf(b) === "council_dispatch");
	const startupCalls = blocks.slice(0, dispatchIdx).filter(isToolCall);
	for (const b of startupCalls) {
		if (labelOf(b) !== "read") continue;
		const arg = firstArgOf(b);
		for (const suffix of AC2_FORBIDDEN_SUFFIXES) {
			if (arg.endsWith(suffix)) {
				fail(
					`AC2: startup read of the pre-injected procedure — a toolCall labeled "read" before the first council_dispatch has first argument "${arg}" (expected: no read of ${AC2_FORBIDDEN_SUFFIXES.join(" or ")})`,
				);
			}
		}
	}

	// ---- AC3 (the first visible toolCall) ----
	const firstCall = calls[0]!;
	const firstArg = firstArgOf(firstCall);
	if (firstArg.includes("council/procedures/")) {
		fail(
			`AC3: first toolCall (${labelOf(firstCall)}) targets the procedures directory — first argument "${firstArg}" (expected: the first visible action is not under council/procedures/)`,
		);
	}

	return { runId, sessionId, file };
}

// ---------------------------------------------------------------------------
// CLI entry — the smoke driver's verdict surface (exit 0 = green).
// ---------------------------------------------------------------------------
if (import.meta.main) {
	const [, , repoRoot, cardId] = process.argv;
	if (!repoRoot) {
		console.error("usage: bun smoke/read-runner-startup.ts <repoRoot> [cardId]");
		process.exit(2);
	}
	try {
		const found = readRunnerStartup(repoRoot, cardId);
		console.log(
			`fllwup114-runner-startup OK run=${found.runId} session=${found.sessionId} file=${path.relative(repoRoot, found.file)} — anchors + AC2/AC3 green`,
		);
	} catch (e) {
		console.error(e instanceof Error ? e.message : String(e));
		process.exit(1);
	}
}
