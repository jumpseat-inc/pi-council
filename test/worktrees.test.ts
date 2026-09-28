import { test, expect } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { spawnSync } from "node:child_process";
import { scaffoldInto } from "../extensions/scaffold.ts";
import { PKG_ROOT } from "../extensions/seats.ts";
import { checkCouncilWorktrees, councilWorktreesRoot, evalScratchDir, sweepCouncilWorktrees } from "../extensions/worktrees.ts";
import { CONFIG_DIR_NAME } from "@earendil-works/pi-coding-agent";

const SCAFFOLD = path.join(PKG_ROOT, "council", "scaffold");

function git(cwd: string, ...args: string[]): string {
	const r = spawnSync("git", args, { cwd, encoding: "utf-8" });
	if (r.status !== 0) throw new Error(`git ${args.join(" ")} failed: ${r.stderr}`);
	return r.stdout;
}

/** A scratch git repo with the council scaffold applied (the real consumer path). */
function scratchRepo(): string {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "council-wt-"));
	git(root, "init", "-q");
	git(root, "config", "user.email", "t@t");
	git(root, "config", "user.name", "t");
	fs.writeFileSync(path.join(root, "a.txt"), "hi\n");
	git(root, "add", ".");
	git(root, "commit", "-qm", "init");
	scaffoldInto(root, SCAFFOLD);
	git(root, "add", "-A");
	git(root, "commit", "-qm", "scaffold");
	return root;
}

function scriptPath(root: string): string {
	return path.join(root, "council", "scripts", "worktree.sh");
}

function run(root: string, ...args: string[]) {
	return spawnSync("bash", [scriptPath(root), ...args], { cwd: root, encoding: "utf-8" });
}

const worktreesRoot = (root: string) => path.join(root, CONFIG_DIR_NAME, "council", "worktrees");

test("scaffold copies worktree.sh and renders the config dir (no literal token)", () => {
	const root = scratchRepo();
	const raw = fs.readFileSync(scriptPath(root), "utf-8");
	expect(raw).not.toContain("@CONFIG_DIR@");
	expect(raw).toContain(`DEFAULT_CONFIG_DIR='${CONFIG_DIR_NAME}'`);
});

test("create is deterministic and idempotent; list/check see it", () => {
	const root = scratchRepo();
	const p = path.join(worktreesRoot(root), "ev-1");

	const first = run(root, "create", "ev-1", "--detach");
	expect(first.status).toBe(0);
	expect(first.stdout.trim()).toBe(p);
	expect(fs.existsSync(p)).toBe(true);
	expect(fs.existsSync(path.join(p, ".git"))).toBe(true);
	// self-ignored: the main checkout stays clean
	expect(git(root, "status", "--porcelain")).toBe("");

	const second = run(root, "create", "ev-1", "--detach");
	expect(second.status).toBe(0);
	expect(second.stdout.trim()).toBe(p);
	expect(run(root, "list").stdout.trim()).toBe(p);

	const check = run(root, "check");
	expect(check.status).toBe(1);
	expect(check.stderr).toContain(`FAIL: residual council worktree: ${p}`);

	run(root, "remove", "ev-1");
	expect(fs.existsSync(p)).toBe(false);
	const clean = run(root, "check");
	expect(clean.status).toBe(0);
});

test("remove refuses a dirty worktree and requires --force", () => {
	const root = scratchRepo();
	const p = path.join(worktreesRoot(root), "dirty");
	run(root, "create", "dirty", "--detach");
	fs.writeFileSync(path.join(p, "uncommitted.txt"), "x");

	const refused = run(root, "remove", "dirty");
	expect(refused.status).toBe(1);
	expect(refused.stderr).toContain("dirty worktree");
	expect(fs.existsSync(p)).toBe(true);

	const forced = run(root, "remove", "dirty", "--force");
	expect(forced.status).toBe(0);
	expect(fs.existsSync(p)).toBe(false);
});

test("remove refuses an unpushed branch and requires --force", () => {
	const root = scratchRepo();
	const p = path.join(worktreesRoot(root), "unpushed");
	run(root, "create", "unpushed", "--branch", "feat/unpushed");
	fs.writeFileSync(path.join(p, "b.txt"), "work\n");
	git(p, "add", ".");
	git(p, "commit", "-qm", "work");

	const refused = run(root, "remove", "unpushed");
	expect(refused.status).toBe(1);
	expect(refused.stderr).toContain("unpushed");
	expect(fs.existsSync(p)).toBe(true);

	expect(run(root, "remove", "unpushed", "--force").status).toBe(0);
	expect(fs.existsSync(p)).toBe(false);
});

test("prune/sweep remove council worktrees but not unrelated ones", () => {
	const root = scratchRepo();
	const council = path.join(worktreesRoot(root), "ev-2");
	const outside = path.join(root, "outside-wt");
	run(root, "create", "ev-2", "--detach");
	git(root, "worktree", "add", outside, "-b", "outside-branch");

	const swept = run(root, "sweep");
	expect(swept.status).toBe(0);
	expect(fs.existsSync(council)).toBe(false);
	expect(fs.existsSync(outside)).toBe(true);
	expect(run(root, "list").stdout.trim()).toBe("");
});

test("sweep removes orphan eval-* scratch dirs left under the root", () => {
	const root = scratchRepo();
	const orphan = path.join(worktreesRoot(root), "eval-m1-1-abc");
	fs.mkdirSync(orphan, { recursive: true });
	fs.writeFileSync(path.join(orphan, "junk"), "x");

	expect(run(root, "sweep").status).toBe(0);
	expect(fs.existsSync(orphan)).toBe(false);
});

test("slug validation rejects path traversal", () => {
	const root = scratchRepo();
	for (const bad of ["../escape", "a/../../b", "-x", "has space"]) {
		const r = run(root, "create", bad);
		expect(r.status).not.toBe(0);
	}
	expect(fs.existsSync(path.join(path.dirname(worktreesRoot(root)), "escape"))).toBe(false);
});

test("detached base-red creation works and is removable with --force", () => {
	const root = scratchRepo();
	const p = path.join(worktreesRoot(root), "ev-3-base-red");
	expect(run(root, "create", "ev-3-base-red", "--detach").status).toBe(0);
	expect(fs.existsSync(p)).toBe(true);
	// transplant files make it dirty; force is the sanctioned removal
	fs.writeFileSync(path.join(p, "transplant.test.ts"), "x");
	expect(run(root, "remove", "ev-3-base-red").status).toBe(1);
	expect(run(root, "remove", "ev-3-base-red", "--force").status).toBe(0);
});

// ---- engine wiring (extensions/worktrees.ts) ----

test("engine check fails on residue and passes on a clean root", () => {
	const root = scratchRepo();
	const clean = checkCouncilWorktrees(root);
	expect(clean.ran).toBe(true);
	expect(clean.status).toBe(0);

	run(root, "create", "residue", "--detach");
	const dirty = checkCouncilWorktrees(root);
	expect(dirty.status).toBe(1);
	expect(dirty.output).toContain("FAIL: residual council worktree");
});

test("engine sweep removes clean leftovers and reports refused dirty ones", () => {
	const root = scratchRepo();
	run(root, "create", "clean-left", "--detach");
	run(root, "create", "dirty-left", "--detach");
	fs.writeFileSync(path.join(councilWorktreesRoot(root), "dirty-left", "junk"), "x");

	const swept = sweepCouncilWorktrees(root);
	expect(swept.status).toBe(1); // dirty-left refused
	expect(fs.existsSync(path.join(councilWorktreesRoot(root), "clean-left"))).toBe(false);
	expect(fs.existsSync(path.join(councilWorktreesRoot(root), "dirty-left"))).toBe(true);
	expect(checkCouncilWorktrees(root).status).toBe(1);
});

test("engine wiring is a no-op when the consumer predates the script", () => {
	const bare = fs.mkdtempSync(path.join(os.tmpdir(), "council-nowt-"));
	git(bare, "init", "-q");
	expect(checkCouncilWorktrees(bare).ran).toBe(false);
	expect(sweepCouncilWorktrees(bare).ran).toBe(false);
});

test("eval scratch lives under the canonical root", () => {
	const root = scratchRepo();
	const scratch = evalScratchDir(root, "cell-1", 2);
	expect(scratch.startsWith(councilWorktreesRoot(root) + path.sep)).toBe(true);
	expect(path.basename(scratch).startsWith("eval-cell-1-2-")).toBe(true);
	fs.rmSync(scratch, { recursive: true, force: true });
});