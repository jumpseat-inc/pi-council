/**
 * FLLWUP-114 phase 7 — the startup-window waiter (the scoped half of the
 * phase: NOT full card delivery).
 *
 * Polls the smoke work dir's runs substrate for the council-runner session
 * the real parent `pi -p` turn dispatched, and ends the startup window the
 * moment the transcript carries its first `council_dispatch`-labeled
 * toolCall — the exact boundary AC2's window closes at. Also proceeds (never
 * fails here) when the runner settles without one or the parent exits: the
 * transcript is what it is, and read-runner-startup.ts is the verdict —
 * its anchors red loudly on a startup that never happened (skeptic O5).
 *
 * This file NEVER judges AC2/AC3 — the reader does.
 *
 * Usage (inside the smoke container, from /pkg):
 *   bun smoke/phase7-dispatch.ts <repoRoot> <cardId> <parentPid> [ceilingSec]
 *
 * Exit 0 → proceed to the reader. Exit 1 → ceiling: the startup window never
 * opened. Exit 2 → usage.
 */
import { readFileSync } from "node:fs";
import { findSessionFile, listRunIds, readManifests } from "../extensions/runs.ts";
import { parseTranscript } from "../extensions/transcript.ts";

const [, , repoRoot, cardId, parentPidArg, ceilingArg] = process.argv;
if (!repoRoot || !cardId || !parentPidArg) {
	console.error("usage: bun smoke/phase7-dispatch.ts <repoRoot> <cardId> <parentPid> [ceilingSec]");
	process.exit(2);
}
const parentPid = Number(parentPidArg);
if (!Number.isInteger(parentPid) || parentPid <= 0) {
	console.error(`phase7: parent pid must be a positive integer, got ${parentPidArg}`);
	process.exit(2);
}
const ceilingMs = (Number(ceilingArg ?? "900") || 900) * 1000;
const start = Date.now();

function parentAlive(): boolean {
	try {
		process.kill(parentPid, 0);
		return true;
	} catch {
		return false;
	}
}

const SETTLED = new Set(["done", "failed", "cancelled", "stalled", "timeout"]);
let evidence = "no runner manifest yet";

while (Date.now() - start < ceilingMs) {
	for (const runId of listRunIds(repoRoot)) {
		const manifests = readManifests(repoRoot, runId);
		const runners = manifests.filter((m) => m.seat === "council-runner");
		for (const m of runners) {
			const file = findSessionFile(repoRoot, runId, m.sessionId);
			if (!file) continue; // session not (yet) on disk
			let blocks;
			try {
				blocks = parseTranscript(readFileSync(file, "utf-8"));
			} catch {
				continue; // mid-write
			}
			evidence = `run=${runId} session=${m.sessionId} blocks=${blocks.length}`;
			const hasDispatch = blocks.some(
				(b) => b.kind === "toolCall" && (b.label ?? "").toLowerCase() === "council_dispatch",
			);
			if (hasDispatch) {
				console.log(`phase7: startup window OPEN — ${evidence} (card ${cardId})`);
				process.exit(0);
			}
		}
		// The runner settled without ever dispatching — no window is coming;
		// proceed to the reader, whose anchors red on this transcript.
		if (
			runners.length > 0 &&
			runners.every((m) => SETTLED.has(m.state))
		) {
			console.log(`phase7: runner settled without a startup dispatch (${evidence}) — proceeding to the reader`);
			process.exit(0);
		}
	}
	if (!parentAlive()) {
		console.log(`phase7: parent exited (${evidence}) — proceeding to the reader`);
		process.exit(0);
	}
	await new Promise((r) => setTimeout(r, 2000));
}

console.error(`phase7: ceiling — the runner's first council_dispatch never appeared within the window (${evidence})`);
process.exit(1);
