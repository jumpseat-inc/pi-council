// EV-39 Task 1 — the flaky stub contract (spec §2.10): each invocation reads/
// increments a count in STUB_STATE; while count <= STUB_FAIL_TIMES it emits the
// retryable provider error assistant and exits 0; afterwards it emits "stub
// result" and exits 0.
import { test, expect } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

const STUB = path.join(import.meta.dir, "stub-child.ts");

function freshState(): string {
	const state = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "flaky-")), "state.json");
	fs.writeFileSync(state, JSON.stringify({ count: 0 }));
	return state;
}

function runFlaky(state: string, failTimes: number): { stdout: string; code: number | null } {
	const p = Bun.spawnSync(["bun", STUB], {
		cwd: import.meta.dir,
		env: { ...process.env, STUB_MODE: "flaky", STUB_STATE: state, STUB_FAIL_TIMES: String(failTimes) },
		stdout: "pipe",
		stderr: "pipe",
	});
	return { stdout: p.stdout.toString(), code: p.exitCode };
}

test("flaky: first invocation errors (retryable), second emits stub result", () => {
	const state = freshState();
	const first = runFlaky(state, 1);
	expect(first.code).toBe(0);
	expect(first.stdout).toContain("Provider returned 502");
	expect(first.stdout).toContain('"stopReason":"error"');
	const second = runFlaky(state, 1);
	expect(second.code).toBe(0);
	expect(second.stdout).toContain("stub result");
	expect(second.stdout).not.toContain("Provider returned 502");
});

test("flaky: FAIL_TIMES=2 keeps erroring on the second call, clears on the third", () => {
	const state = freshState();
	const a = runFlaky(state, 2);
	const b = runFlaky(state, 2);
	const c = runFlaky(state, 2);
	expect(a.stdout).toContain("Provider returned 502");
	expect(b.stdout).toContain("Provider returned 502");
	expect(c.stdout).toContain("stub result");
});

test("flaky: default FAIL_TIMES is 1", () => {
	const state = freshState();
	const p = Bun.spawnSync(["bun", STUB], {
		cwd: import.meta.dir,
		env: { ...process.env, STUB_MODE: "flaky", STUB_STATE: state } as Record<string, string>,
		stdout: "pipe",
	});
	expect(p.stdout.toString()).toContain("Provider returned 502");
});
