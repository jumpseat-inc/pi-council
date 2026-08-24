// Requires network + OpenRouter key; skipped unless COUNCIL_INTEGRATION=1.
import { test, expect } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { Hub } from "../extensions/hub.ts";
import { buildChildArgv, buildSystemPrompt, loadSeat, proceduresDir } from "../extensions/seats.ts";
import { childEnv, ensureRunDir, findSessionFile, readManifests } from "../extensions/runs.ts";

const root = fs.mkdtempSync(path.join(os.tmpdir(), "council-int-src-"));
const enabled = process.env.COUNCIL_INTEGRATION === "1";

test.skipIf(!enabled)(
	"consolidator seat round-trips a real dispatch",
	async () => {
		const seat = loadSeat(root, "consolidator");
		const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "council-int-"));
		const promptFile = path.join(tmpDir, "system.md");
		fs.writeFileSync(promptFile, buildSystemPrompt(root, seat, proceduresDir(root)));
		const runId = "int-run";
		const dir = ensureRunDir(root, runId);
		const hub = new Hub({
			monitorIntervalMs: 1000,
			pidFile: path.join(tmpDir, "pids.json"),
			run: { repoRoot: root, runId },
		});
		try {
			const jobId = hub.allocateId();
			const job = hub.spawnJob({
				id: jobId,
				seat: seat.name,
				model: seat.model,
				command: "pi",
				args: buildChildArgv(
					seat,
					"Reply with exactly one sentence describing what a council board is. Do not use any tool.",
					promptFile,
					[],
					{ sessionDir: dir, sessionId: jobId },
				),
				cwd: root,
				env: childEnv({ ...process.env, COUNCIL_SEAT: seat.name }, runId, jobId),
				timeoutMs: 5 * 60_000,
				stallMs: 3 * 60_000,
			});
			const [r] = await hub.wait([job.id], 5 * 60_000);
			if (r.state !== "done") console.error("stderr tail:", r.stderrTail);
			expect(r.state).toBe("done");
			expect(r.output.length).toBeGreaterThan(10);
			expect(r.usage.turns).toBeGreaterThanOrEqual(1);
			expect(findSessionFile(root, runId, jobId)).toBeDefined();
			const [m0] = readManifests(root, runId);
			expect(m0.state).toBe("done");
			expect(m0.id).toBe("job-1");
		} finally {
			hub.shutdown();
			fs.rmSync(tmpDir, { recursive: true, force: true });
		}
	},
	6 * 60_000,
);
