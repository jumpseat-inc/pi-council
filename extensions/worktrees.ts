/**
 * Council worktree discipline — the engine side.
 *
 * The deterministic create/remove logic is the scaffolded bash script
 * `council/scripts/worktree.sh` (design:
 * docs/superpowers/specs/2026-09-28-council-worktrees-design.md). This module
 * only locates and invokes it; it MUST NOT reimplement path or removal rules,
 * or engine and script drift.
 *
 * The canonical root is `<repo>/$CONFIG_DIR_NAME/council/worktrees/` — the
 * root is self-ignoring, like `council/runs/`. `evalScratchDir` routes the
 * eval runner's disposable copy under the same root so a residual sweep
 * reaches it (it is a plain copy, not a registered git worktree, hence the
 * script's `prune-scratch`).
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { spawnSync } from "node:child_process";
import { CONFIG_DIR_NAME } from "@earendil-works/pi-coding-agent";

/** The canonical council worktrees root. Single source of truth for the path;
 * the bash script computes the same location from its own path. */
export function councilWorktreesRoot(repoRoot: string): string {
	return path.join(repoRoot, CONFIG_DIR_NAME, "council", "worktrees");
}

/** The scaffolded script. Returns null when the consumer predates it. */
export function councilWorktreeScript(repoRoot: string): string | null {
	const script = path.join(repoRoot, "council", "scripts", "worktree.sh");
	return fs.existsSync(script) ? script : null;
}

export interface WorktreeRunResult {
	/** false when no script is installed (older consumer) — callers treat as a no-op. */
	ran: boolean;
	status: number;
	output: string;
}

function runWorktreeScript(repoRoot: string, args: string[]): WorktreeRunResult {
	const script = councilWorktreeScript(repoRoot);
	if (script === null) return { ran: false, status: 0, output: "" };
	const res = spawnSync("bash", [script, ...args], { cwd: repoRoot, encoding: "utf-8" });
	if (res.error) return { ran: false, status: -1, output: res.error.message };
	return { ran: true, status: res.status ?? -1, output: `${res.stdout ?? ""}${res.stderr ?? ""}`.trim() };
}

/** `worktree.sh check` — status 1 with `FAIL:` lines when council-owned
 * worktrees remain. The mechanical residual gate. */
export function checkCouncilWorktrees(repoRoot: string): WorktreeRunResult {
	return runWorktreeScript(repoRoot, ["check"]);
}

/** `worktree.sh sweep` — remove leftover registered worktrees and orphan
 * eval-* scratch dirs. Status 1 means at least one entry was refused
 * (dirty/unpushed) and left for the human; `output` names it. */
export function sweepCouncilWorktrees(repoRoot: string): WorktreeRunResult {
	return runWorktreeScript(repoRoot, ["sweep"]);
}

/** Create (idempotently) the root + its self-ignoring `.gitignore`. */
export function ensureCouncilWorktreesRoot(repoRoot: string): string {
	const root = councilWorktreesRoot(repoRoot);
	fs.mkdirSync(root, { recursive: true });
	const gi = path.join(root, ".gitignore");
	if (!fs.existsSync(gi)) fs.writeFileSync(gi, "*\n");
	return root;
}

/** A disposable eval scratch dir under the canonical root. A plain copy (the
 * driver is spawned with cwd here), never a registered worktree — the script's
 * `prune-scratch` reaps orphans whose `finally` cleanup a crash skipped. */
export function evalScratchDir(repoRoot: string, cellId: string, repeat: number): string {
	const root = ensureCouncilWorktreesRoot(repoRoot);
	return fs.mkdtempSync(path.join(root, `eval-${cellId}-${repeat}-`));
}