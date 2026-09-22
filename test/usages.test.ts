import { test, expect } from "bun:test";
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { PKG_ROOT } from "../extensions/seats.ts";

const TOOL = path.join(PKG_ROOT, "council", "skills", "usages", "scripts", "usages.py");

function mkRepo(): { root: string; agent: string } {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "usages-repo-"));
	const agent = fs.mkdtempSync(path.join(os.tmpdir(), "usages-agent-"));
	return { root, agent };
}

function sessionFile(agent: string, repo: string, ts: string, entries: object[]): void {
	const dir = path.join(agent, "sessions", "--proj--");
	fs.mkdirSync(dir, { recursive: true });
	const header = { type: "session", version: 3, id: "s1", timestamp: ts, cwd: repo };
	fs.writeFileSync(path.join(dir, "s1.jsonl"), [header, ...entries].map((e) => JSON.stringify(e)).join("\n") + "\n");
}

function assistant(ts: string, responseId: string | null, usage: object): object {
	return {
		type: "message",
		id: responseId ?? ts,
		parentId: null,
		timestamp: ts,
		message: {
			role: "assistant",
			provider: "openrouter",
			model: "deepseek/deepseek-v4.1-flash",
			content: [{ type: "text", text: "x" }],
			stopReason: "stop",
			timestamp: ts,
			...(responseId ? { responseId } : {}),
			usage,
		},
	};
}

function runTool(root: string, agent: string, args: string[], env: Record<string, string | undefined> = {}) {
	return spawnSync(
		"python3",
		[TOOL, "--repo", root, "--agent-dir", agent, "--config-dir", ".pi", "--out-dir", path.join(root, "out"),
			"--cache-file", path.join(root, "cache.json"), ...args],
		{ encoding: "utf-8", env: { ...process.env, ...env } },
	);
}

test("T-U1: offline harvest + aggregation writes paired JSON/MD with a main row", () => {
	const { root, agent } = mkRepo();
	sessionFile(agent, root, "2026-09-18T10:00:00.000Z", [
		assistant("2026-09-18T10:00:05.000Z", "gen-main-1", {
			input: 1000, output: 100, cacheRead: 4000, cacheWrite: 0, reasoning: 10, totalTokens: 5100,
			cost: { total: 0.01, input: 0.008, output: 0.002, cacheRead: 0, cacheWrite: 0 },
		}),
	]);
	const cache = {
		schemaVersion: 1,
		generations: {
			"gen-main-1": { total_usage: 0.0123, tokens_prompt: 5000, tokens_completion: 100, cached_tokens: 4000, cache_hit_rate: 0.8 },
		},
	};
	fs.writeFileSync(path.join(root, "cache.json"), JSON.stringify(cache));
	const res = runTool(root, agent, ["--offline", "--start", "2026-09-18", "--end", "2026-09-18", "--json"]);
	expect(res.status, res.stderr).toBe(0);
	const report = JSON.parse(res.stdout);
	expect(report.main.tokens.input).toBe(1000);
	expect(report.main.tokens.cacheRead).toBe(4000);
	expect(report.main.exactCostUsd).toBeCloseTo(0.0123, 6);
	expect(report.main.basis).toBe("exact");
	expect(report.limitations).toContain("offline: no network calls were made; uncached generations use catalogue estimates");
	const md = fs.readFileSync(path.join(root, "out", "usages-2026-09-18_2026-09-18.md"), "utf-8");
	expect(md).toContain("main");
	expect(fs.existsSync(path.join(root, "out", ".gitignore"))).toBe(true);
	expect(report.cache.hits).toBe(1);
});

test("T-U2: missing OPENROUTER_MANAGEMENT_KEY exits 2, writes nothing, prints remediation", () => {
	const { root, agent } = mkRepo();
	const res = runTool(root, agent, ["--start", "2026-09-18", "--end", "2026-09-18"], { OPENROUTER_MANAGEMENT_KEY: "" });
	expect(res.status).toBe(2);
	expect(res.stderr).toContain("OPENROUTER_MANAGEMENT_KEY");
	expect(res.stderr).toContain("Provisioning key");
	expect(fs.existsSync(path.join(root, "out"))).toBe(false);
});

test("T-U3: range grammar parses and yields an ordered window", () => {
	const { root, agent } = mkRepo();
	for (const r of ["last 30 days", "yesterday", "2026-09-01 to 2026-09-15", "this month"]) {
		const res = runTool(root, agent, ["--offline", "--range", r, "--today", "2026-09-21", "--json"]);
		expect(res.status, `${r}: ${res.stderr}`).toBe(0);
		const report = JSON.parse(res.stdout);
		expect(report.range.start <= report.range.end).toBe(true);
	}
});

test("T-U4: analytics/activity are queried and reconciled against a local stub", async () => {
	const { root, agent } = mkRepo();
	sessionFile(agent, root, "2026-09-18T10:00:00.000Z", [
		assistant("2026-09-18T10:00:05.000Z", "gen-a", {
			input: 100, output: 10, cacheRead: 0, cacheWrite: 0, reasoning: 0, totalTokens: 110,
			cost: { total: 0.001 },
		}),
	]);
	fs.writeFileSync(path.join(root, "cache.json"), JSON.stringify({ schemaVersion: 1, generations: {} }));
	const seen: string[] = [];
	const server = Bun.serve({
		port: 0,
		async fetch(req) {
			const url = new URL(req.url);
			seen.push(url.pathname);
			if (url.pathname.endsWith("/analytics/query")) {
				const body = (await req.json()) as { filters?: { value?: unknown }[] };
				const raw = body.filters?.[0]?.value;
				const ids = Array.isArray(raw) ? (raw as string[]) : [];
				return Response.json({
					data: {
						data: ids.map((id) => ({
							generation_id: id, total_usage: 0.004, tokens_prompt: 100, tokens_completion: 10,
							cached_tokens: 0, cache_hit_rate: 0,
						})),
					},
				});
			}
			if (url.pathname.endsWith("/activity")) {
				return Response.json({ data: [{ date: "2026-09-18 00:00:00", model: "deepseek/deepseek-v4.1-flash", usage: 0.05 }] });
			}
			return new Response("nope", { status: 404 });
		},
	});
	try {
		const proc = Bun.spawn(
			["python3", TOOL, "--repo", root, "--agent-dir", agent, "--config-dir", ".pi", "--out-dir", path.join(root, "out"),
				"--cache-file", path.join(root, "cache.json"),
				"--start", "2026-09-18", "--end", "2026-09-18", "--today", "2026-09-21", "--json",
				"--api-base", `http://127.0.0.1:${server.port}/api/v1`],
			{ env: { ...process.env, OPENROUTER_MANAGEMENT_KEY: "mgmt-test" }, stdout: "pipe", stderr: "pipe" },
		);
		const [stdout, stderr, status] = await Promise.all([
			new Response(proc.stdout).text(),
			new Response(proc.stderr).text(),
			proc.exited,
		]);
		expect(status, stderr).toBe(0);
		const report = JSON.parse(stdout);
		expect(report.main.exactCostUsd).toBeCloseTo(0.004, 6);
		expect(report.account.attributedUsd).toBeCloseTo(0.004, 6);
		expect(report.account.unattributedUsd).toBeCloseTo(0.046, 6);
		expect(report.account.activity.totalUsd).toBeCloseTo(0.05, 6);
		expect(seen.some((p) => p.endsWith("/analytics/query"))).toBe(true);
		expect(seen.some((p) => p.endsWith("/activity"))).toBe(true);
		// the exact figures are cached for cheap reruns
		const cached = JSON.parse(fs.readFileSync(path.join(root, "cache.json"), "utf-8"));
		expect(cached.generations["gen-a"].total_usage).toBeCloseTo(0.004, 6);
	} finally {
		server.stop(true);
	}
});

test("T-U6: non-OpenRouter response ids are not counted as cross-match misses", () => {
	const { root, agent } = mkRepo();
	sessionFile(agent, root, "2026-09-18T10:00:00.000Z", [
		assistant("2026-09-18T10:00:05.000Z", "chatcmpl-local-1", {
			input: 100, output: 10, cacheRead: 0, cacheWrite: 0, reasoning: 0, totalTokens: 110,
			cost: { total: 0.0 },
		}),
	]);
	const res = runTool(root, agent, ["--offline", "--start", "2026-09-18", "--end", "2026-09-18", "--json"]);
	expect(res.status, res.stderr).toBe(0);
	const report = JSON.parse(res.stdout);
	expect(report.main.requests).toBe(0);
	expect(report.main.basis).toBe("catalogue-estimate");
	expect(report.limitations.some((l: string) => l.includes("unresolved by analytics"))).toBe(false);
});

const U = "2026-09-18";

function serveStub() {
	return Bun.serve({
		port: 0,
		async fetch(req) {
			const url = new URL(req.url);
			if (url.pathname.endsWith("/analytics/query")) {
				const body = (await req.json()) as { filters?: { value?: unknown }[] };
				const raw = body.filters?.[0]?.value;
				const ids = Array.isArray(raw) ? (raw as string[]) : [];
				return Response.json({
					data: {
						data: ids.map((id) => ({
							generation_id: id, total_usage: 0.004, tokens_prompt: 100, tokens_completion: 10,
							cached_tokens: 0, cache_hit_rate: 0,
						})),
					},
				});
			}
			if (url.pathname.endsWith("/activity")) {
				return Response.json({ data: [{ date: "2026-09-18 00:00:00", model: "deepseek/deepseek-v4.1-flash", usage: 0.05 }] });
			}
			return new Response("nope", { status: 404 });
		},
	});
}

async function runAsync(root: string, agent: string, args: string[]) {
	const proc = Bun.spawn(
		["python3", TOOL, "--repo", root, "--agent-dir", agent, "--config-dir", ".pi", ...args],
		{ env: { ...process.env, OPENROUTER_MANAGEMENT_KEY: "mgmt-test" }, stdout: "pipe", stderr: "pipe" },
	);
	const [stdout, stderr, status] = await Promise.all([
		new Response(proc.stdout).text(),
		new Response(proc.stderr).text(),
		proc.exited,
	]);
	return { stdout, stderr, status };
}

test("T-U7: first non-offline run creates the default out dir before writing the cache", async () => {
	const { root, agent } = mkRepo();
	sessionFile(agent, root, "2026-09-18T10:00:00.000Z", [
		assistant("2026-09-18T10:00:05.000Z", "gen-dir-1", {
			input: 100, output: 10, cacheRead: 0, cacheWrite: 0, reasoning: 0, totalTokens: 110,
			cost: { total: 0.001 },
		}),
	]);
	const server = serveStub();
	const outDir = path.join(root, ".pi", "council", "usages");
	const args = ["--start", U, "--end", U, "--today", "2026-09-21", "--json",
		"--api-base", `http://127.0.0.1:${server.port}/api/v1`];
	try {
		const r1 = await runAsync(root, agent, args);
		expect(r1.status, r1.stderr).toBe(0);
		expect(r1.stderr).not.toContain("usages: could not write cache:");
		expect(fs.existsSync(path.join(outDir, ".cache.json"))).toBe(true);
		expect(fs.existsSync(path.join(outDir, "usages-2026-09-18_2026-09-18.json"))).toBe(true);
		expect(fs.existsSync(path.join(outDir, "usages-2026-09-18_2026-09-18.md"))).toBe(true);
		expect(fs.readFileSync(path.join(outDir, ".gitignore"), "utf-8")).toBe("*\n");
		const cache = JSON.parse(fs.readFileSync(path.join(outDir, ".cache.json"), "utf-8"));
		expect(cache.generations["gen-dir-1"]).toBeDefined();
		const r2 = await runAsync(root, agent, args);
		expect(r2.status, r2.stderr).toBe(0);
		expect(r2.stderr).not.toContain("usages: could not write cache:");
		const report2 = JSON.parse(r2.stdout);
		expect(report2.cache.hits).toBe(1);
	} finally {
		server.stop(true);
	}
});

test("T-U8: absent custom --out-dir is created before the cache write", async () => {
	const { root, agent } = mkRepo();
	sessionFile(agent, root, "2026-09-18T10:00:00.000Z", [
		assistant("2026-09-18T10:00:05.000Z", "gen-dir-2", {
			input: 100, output: 10, cacheRead: 0, cacheWrite: 0, reasoning: 0, totalTokens: 110,
			cost: { total: 0.001 },
		}),
	]);
	const server = serveStub();
	const outDir = path.join(root, "fresh-out");
	try {
		const r = await runAsync(root, agent, ["--out-dir", outDir, "--start", U, "--end", U, "--today", "2026-09-21", "--json",
			"--api-base", `http://127.0.0.1:${server.port}/api/v1`]);
		expect(r.status, r.stderr).toBe(0);
		expect(r.stderr).not.toContain("usages: could not write cache:");
		expect(fs.existsSync(path.join(outDir, ".cache.json"))).toBe(true);
	} finally {
		server.stop(true);
	}
});

test("T-U5: council seat rows are attributed from run manifests and transcripts", () => {
	const { root, agent } = mkRepo();
	const run = path.join(root, ".pi", "council", "runs", "run-1");
	fs.mkdirSync(run, { recursive: true });
	fs.writeFileSync(path.join(run, "run.json"), JSON.stringify({ runId: "run-1", startedAt: Date.parse("2026-09-18T00:00:00Z"), repoRoot: root, hostPid: 1 }));
	fs.writeFileSync(path.join(run, "job-1.json"), JSON.stringify({ id: "job-1", seat: "principal", model: "openrouter/deepseek/deepseek-v4.1-flash", state: "done", startedAt: Date.parse("2026-09-18T00:00:00Z"), exitCode: 0, usage: { input: 500, output: 50, cacheRead: 0, cacheWrite: 0, reasoning: 0, totalTokens: 550, cost: 0.02, turns: 1, costBasis: "catalogue-estimate", usageSource: "stream-assistant" } }));
	const entries = [
		{ type: "session", version: 3, id: "job-1", timestamp: "2026-09-18T00:00:00.000Z", cwd: root },
		assistant("2026-09-18T00:01:00.000Z", "gen-seat-1", { input: 500, output: 50, cacheRead: 0, cacheWrite: 0, reasoning: 0, totalTokens: 550, cost: { total: 0.02 } }),
	];
	fs.writeFileSync(path.join(run, "2026-09-18T00-00-00-000Z_job-1.jsonl"), entries.map((e) => JSON.stringify(e)).join("\n") + "\n");
	fs.writeFileSync(path.join(root, "cache.json"), JSON.stringify({ schemaVersion: 1, generations: { "gen-seat-1": { total_usage: 0.025, tokens_prompt: 500, tokens_completion: 50, cached_tokens: 0, cache_hit_rate: 0 } } }));
	const res = runTool(root, agent, ["--offline", "--start", "2026-09-18", "--end", "2026-09-18", "--json"]);
	expect(res.status, res.stderr).toBe(0);
	const report = JSON.parse(res.stdout);
	const principal = report.seats.find((s: { seat: string }) => s.seat === "principal");
	expect(principal).toBeDefined();
	expect(principal.exactCostUsd).toBeCloseTo(0.025, 6);
	expect(principal.tokens.input).toBe(500);
	expect(principal.basis).toBe("exact");
});