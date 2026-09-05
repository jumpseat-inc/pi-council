// FLLWUP-24 — local drift tripwire: installed pi-coding-agent vs bun.lock
// (spec: docs/superpowers/specs/2026-09-06-FLLWUP-24-design.md).
//
// The suite spawns the SAME artifact preflight calls — `bash
// council/check-pi-drift.sh <scratch-root>` — on scratch trees under the
// test's temp dir; it never reimplements the comparison. Items 1–7 of the
// spec's driven-test section; item 8 (deliverables intact, full gate set)
// is the four-gate run itself.
import { afterAll, describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const REPO_ROOT = process.cwd();
const ARTIFACT = join(REPO_ROOT, "council", "check-pi-drift.sh");
const PKG = "@earendil-works/pi-coding-agent";
const LOCK_TEXT = readFileSync(join(REPO_ROOT, "bun.lock"), "utf8");

// Spec: "no hardcoded 0.85.1 anywhere in the suite" — the expected locked
// version is derived from the real lock's package-key leaf, which the
// evidence base read (bun.lock:82) and which appears exactly once.
const LOCKED_VERSION = (() => {
	const m = LOCK_TEXT.match(
		new RegExp(`"${PKG}": \\["${PKG}@([^"]+)"`),
	);
	if (!m) throw new Error("FLLWUP-24: could not extract locked version from bun.lock");
	return m[1]!;
})();

/** Synthetic lock at an arbitrary version: real lock text with the workspace
 *  range and the package-key leaf rewritten (both verified unique; the
 *  peerDependency `*` stays). `bun pm ls --all` then resolves the new version. */
function syntheticLockAt(version: string): string {
	return LOCK_TEXT
		.replace(
			`"${PKG}": ">=0.84.3 <0.86.0"`,
			`"${PKG}": "${version}"`,
		)
		.replace(`"${PKG}@${LOCKED_VERSION}"`, `"${PKG}@${version}"`);
}

/** Minimal project-root package.json — name is irrelevant to `bun pm ls`
 *  (probe: exit 0 for both "scratch" and "pi-council"); presence is required. */
const MIN_PKG = JSON.stringify({ name: "scratch", version: "0.0.0" });

const scratchDirs: string[] = [];
function makeScratch(): string {
	const dir = mkdtempSync(join(tmpdir(), "fllwup24-"));
	scratchDirs.push(dir);
	return dir;
}

interface TripwireResult {
	status: number;
	stdout: string;
	stderr: string;
}

function runTripwire(scratch: string, extraEnv: Record<string, string> = {}): TripwireResult {
	const res = spawnSync("bash", [ARTIFACT, scratch], {
		encoding: "utf8",
		timeout: 30_000,
		env: { ...process.env, NO_COLOR: "1", ...extraEnv },
	});
	if (res.error) throw res.error;
	return { status: res.status ?? -1, stdout: res.stdout ?? "", stderr: res.stderr ?? "" };
}

function lines(out: string): string[] {
	return out.split("\n").filter((l) => l.trim().length > 0);
}

/** Scratch with the copied real lock + a drifted installed package.json. */
function driftedScratch(installedVersion: string): string {
	const scratch = makeScratch();
	writeFileSync(join(scratch, "package.json"), MIN_PKG);
	writeFileSync(join(scratch, "bun.lock"), LOCK_TEXT);
	mkdirSync(join(scratch, "node_modules", PKG), { recursive: true });
	writeFileSync(join(scratch, "node_modules", PKG, "package.json"), JSON.stringify({ name: PKG, version: installedVersion }));
	return scratch;
}

describe("FLLWUP-24 drift tripwire (spec items 1–7)", () => {
	test("1. red / name-don't-heal: drifted installed → exit 1, one FAIL with both versions + remedy, node_modules untouched", () => {
		const scratch = driftedScratch("0.84.2");
		const r = runTripwire(scratch);
		expect(r.status, `stdout=${r.stdout} stderr=${r.stderr}`).toBe(1);
		const fails = lines(r.stdout).filter((l) => l.startsWith("FAIL:"));
		expect(fails, r.stdout).toHaveLength(1);
		expect(fails[0]).toContain(PKG);
		expect(fails[0]).toContain("0.84.2");
		expect(fails[0]).toContain(LOCKED_VERSION);
		expect(fails[0]).toContain("bun install --frozen-lockfile");
		// named, not healed — the artifact is read-only on node_modules
		const after = JSON.parse(readFileSync(join(scratch, "node_modules", PKG, "package.json"), "utf8")) as { version: string };
		expect(after.version).toBe("0.84.2");
	});

	test("2. green: installed == lock resolution → exit 0, exactly one quiet OK echoing the version", () => {
		const scratch = driftedScratch(LOCKED_VERSION);
		const r = runTripwire(scratch);
		expect(r.status, `stdout=${r.stdout} stderr=${r.stderr}`).toBe(0);
		expect(lines(r.stdout)).toHaveLength(1);
		const oks = lines(r.stdout).filter((l) => l.startsWith("OK:"));
		expect(oks).toHaveLength(1);
		expect(oks[0]).toContain(LOCKED_VERSION);
		expect(oks[0]).toMatch(/matches bun\.lock/);
	});

	test("3. version-agnostic green at 9.9.9 (synthetic lock; no hardcoded lock version in the suite)", () => {
		const scratch = makeScratch();
		writeFileSync(join(scratch, "package.json"), MIN_PKG);
		writeFileSync(join(scratch, "bun.lock"), syntheticLockAt("9.9.9"));
		mkdirSync(join(scratch, "node_modules", PKG), { recursive: true });
		writeFileSync(join(scratch, "node_modules", PKG, "package.json"), JSON.stringify({ name: PKG, version: "9.9.9" }));
		const r = runTripwire(scratch);
		expect(r.status, `stdout=${r.stdout} stderr=${r.stderr}`).toBe(0);
		const oks = lines(r.stdout).filter((l) => l.startsWith("OK:"));
		expect(oks).toHaveLength(1);
		expect(oks[0]).toContain("9.9.9");
	});

	test("4. fresh-clone pass-through: absent node_modules package.json → exit 0 OK; missing version field → exit 0 OK; no crash under set -u", () => {
		const absent = makeScratch();
		writeFileSync(join(absent, "package.json"), MIN_PKG);
		writeFileSync(join(absent, "bun.lock"), LOCK_TEXT);
		const r1 = runTripwire(absent);
		expect(r1.status, `stdout=${r1.stdout} stderr=${r1.stderr}`).toBe(0);
		expect(lines(r1.stdout).some((l) => l.startsWith("OK:"))).toBe(true);

		const noVersion = driftedScratch("0.84.2");
		writeFileSync(join(noVersion, "node_modules", PKG, "package.json"), JSON.stringify({ name: PKG }));
		const r2 = runTripwire(noVersion);
		expect(r2.status, `stdout=${r2.stdout} stderr=${r2.stderr}`).toBe(0);
		expect(lines(r2.stdout).some((l) => l.startsWith("OK:"))).toBe(true);
	});

	test("5. ambiguity fail-closed: two distinct locked versions → exit 1 with format changed / ambiguous diagnostic, never first-hit-as-OK", () => {
		const scratch = makeScratch();
		writeFileSync(join(scratch, "package.json"), MIN_PKG);
		mkdirSync(join(scratch, "node_modules", PKG), { recursive: true });
		writeFileSync(join(scratch, "node_modules", PKG, "package.json"), JSON.stringify({ name: PKG, version: "9.9.9" }));
		// A bun shim shapes `bun pm ls --all` output with two distinct
		// @earendil-works/pi-coding-agent@<X> lines (real bun cannot produce
		// this shape offline — see plan probe log; the artifact under test is
		// the real script, the shim is a fixture on the command it shells to).
		const shimDir = join(scratch, "bin");
		mkdirSync(shimDir, { recursive: true });
		const shim = join(shimDir, "bun");
		writeFileSync(
			shim,
			[
				"#!/bin/sh",
				'if [ "$1" = "pm" ] && [ "$2" = "ls" ]; then',
				'  echo "scratch@0.0.0"',
				'  echo "├── @earendil-works/pi-coding-agent@9.9.9"',
				'  echo "└── @earendil-works/pi-coding-agent@8.8.8"',
				"  exit 0",
				"fi",
				'echo "bun: shim refuses" >&2',
				"exit 1",
			].join("\n"),
		);
		chmodSync(shim, 0o755);
		const r = runTripwire(scratch, { PATH: `${shimDir}:${process.env.PATH ?? ""}` });
		expect(r.status, `stdout=${r.stdout} stderr=${r.stderr}`).toBe(1);
		const fails = lines(r.stdout).filter((l) => l.startsWith("FAIL:"));
		expect(fails, r.stdout).toHaveLength(1);
		expect(fails[0]).toMatch(/format changed \/ ambiguous/);
		expect(fails[0]).toContain("9.9.9");
		expect(fails[0]).toContain("8.8.8");
	});

	test("6. green-tree exactly-one (closed-red fix verification): anchored leaf count == 1, no /typebox subpath leakage, on the real repo", () => {
		const ls = spawnSync("bun", ["pm", "ls", "--all"], {
			cwd: REPO_ROOT,
			encoding: "utf8",
			timeout: 30_000,
		});
		expect(ls.status, ls.stderr).toBe(0);
		const anchored = (ls.stdout ?? "").split("\n").filter((l) => l.includes(`${PKG}@`));
		expect(anchored).toHaveLength(1);
		expect(ls.stdout ?? "").not.toContain("pi-coding-agent/typebox");
	});

	test("7. ordering (structural): tripwire present, after 'project files present', before 'bun install --frozen-lockfile' in council/preflight.sh", () => {
		const preflight = readFileSync(join(REPO_ROOT, "council", "preflight.sh"), "utf8");
		const tripwire = preflight.indexOf("check-pi-drift.sh");
		const projectFiles = preflight.indexOf("project files present");
		const install = preflight.indexOf("bun install --frozen-lockfile");
		expect(tripwire, "tripwire reference must be present").toBeGreaterThanOrEqual(0);
		expect(projectFiles).toBeGreaterThanOrEqual(0);
		expect(install).toBeGreaterThanOrEqual(0);
		expect(tripwire).toBeLessThan(install);
		expect(projectFiles).toBeLessThan(tripwire);
	});
});

afterAll(() => {
	for (const dir of scratchDirs) rmSync(dir, { recursive: true, force: true });
});