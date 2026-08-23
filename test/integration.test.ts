// Requires network + OpenRouter key; skipped unless COUNCIL_INTEGRATION=1.
import { test, expect } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { Hub } from "../extensions/hub.ts";
import { buildChildArgv, buildSystemPrompt, loadSeat, proceduresDir } from "../extensions/seats.ts";

const root = fs.mkdtempSync(path.join(os.tmpdir(), "council-int-src-"));
const enabled = process.env.COUNCIL_INTEGRATION === "1";

test.skipIf(!enabled)(
	"consolidator seat round-trips a real dispatch",
	async () => {
		const seat = loadSeat(root, "consolidator");
		const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "council-int-"));
		const promptFile = path.join(tmpDir, "system.md");
		fs.writeFileSync(promptFile, buildSystemPrompt(root, seat, proceduresDir(root)));
		const hub = new Hub({ monitorIntervalMs: 1000, pidFile: path.join(tmpDir, "pids.json") });
		try {
			const job = hub.spawnJob({
				seat: seat.name,
				command: "pi",
				args: buildChildArgv(
					seat,
					"Reply with exactly one sentence describing what a council board is. Do not use any tool.",
					promptFile,
				),
				cwd: root,
				env: { ...process.env, COUNCIL_SEAT: seat.name } as Record<string, string>,
				timeoutMs: 5 * 60_000,
				stallMs: 3 * 60_000,
			});
			const [r] = await hub.wait([job.id], 5 * 60_000);
			if (r.state !== "done") console.error("stderr tail:", r.stderrTail);
			expect(r.state).toBe("done");
			expect(r.output.length).toBeGreaterThan(10);
			expect(r.usage.turns).toBeGreaterThanOrEqual(1);
		} finally {
			hub.shutdown();
			fs.rmSync(tmpDir, { recursive: true, force: true });
		}
	},
	6 * 60_000,
);
