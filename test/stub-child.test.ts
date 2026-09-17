// EV-39 Task 1 — the flaky stub contract (spec §2.10): each invocation reads/
// increments a count in STUB_STATE; while count <= STUB_FAIL_TIMES it emits the
// retryable provider error assistant and exits 0; afterwards it emits "stub
// result" and exits 0.
import { test, expect } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { PROVIDER_FINISH_REASON_ERROR } from "../extensions/retry.ts";

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

// EV-41 (a): the finish_error stub contract — failing invocations emit the
// WITH-COLON literal byte-equal to PROVIDER_FINISH_REASON_ERROR (O3 hygiene:
// the shipped constant is the authority; the colon-less EV-43 spelling is
// classify-negative and tests nothing) and exit 0 (the state=done trap
// classifyRetry exists to handle); afterwards it emits the clean result.
test("finish_error: failing invocation emits the with-colon literal byte-equal to PROVIDER_FINISH_REASON_ERROR and exits 0", () => {
	const state = freshState();
	const p = Bun.spawnSync(["bun", STUB], {
		cwd: import.meta.dir,
		env: { ...process.env, STUB_MODE: "finish_error", STUB_STATE: state, STUB_FAIL_TIMES: "1" },
		stdout: "pipe",
		stderr: "pipe",
	});
	expect(p.exitCode).toBe(0);
	const event = JSON.parse(p.stdout.toString().trim()) as {
		type: string;
		message: { role: string; stopReason: string; errorMessage?: string };
	};
	expect(event.type).toBe("message_end");
	expect(event.message.role).toBe("assistant");
	expect(event.message.stopReason).toBe("error");
	expect(event.message.errorMessage).toBe(PROVIDER_FINISH_REASON_ERROR);
	expect(event.message.errorMessage).toBe("Provider finish_reason: error"); // with colon, pinned byte-for-byte
});

test("finish_error: after STUB_FAIL_TIMES it succeeds (the clean retry attempt)", () => {
	const state = freshState();
	const failOnce = { ...process.env, STUB_MODE: "finish_error", STUB_STATE: state, STUB_FAIL_TIMES: "1" } as Record<string, string>;
	Bun.spawnSync(["bun", STUB], { cwd: import.meta.dir, env: failOnce, stdout: "pipe" });
	const second = Bun.spawnSync(["bun", STUB], { cwd: import.meta.dir, env: failOnce, stdout: "pipe" });
	expect(second.exitCode).toBe(0);
	expect(second.stdout.toString()).toContain("stub result");
	expect(second.stdout.toString()).not.toContain("finish_reason");
});

test("finish_error: default FAIL_TIMES is 1", () => {
	const state = freshState();
	const p = Bun.spawnSync(["bun", STUB], {
		cwd: import.meta.dir,
		env: { ...process.env, STUB_MODE: "finish_error", STUB_STATE: state } as Record<string, string>,
		stdout: "pipe",
	});
	expect(p.stdout.toString()).toContain("Provider finish_reason: error");
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
