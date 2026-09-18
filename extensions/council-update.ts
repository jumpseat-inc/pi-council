/**
 * FLLWUP-50 — the /council-update engine: a supported, consent-gated refresh
 * path for the packaged council tooling class (council/validate.py +
 * council/cards/_template.md) in an initialized consumer repo.
 *
 * Spec: docs/superpowers/specs/2026-09-19-FLLWUP-50-design.md (R1–R6,
 * steward Q2 + lifecycle policy). The invariants that shape this file:
 *
 * - Tooling/data classification is a shipped constant in scaffold.ts
 *   (TOOLING_FILES); ONLY tooling files are ever written, and only after an
 *   explicit consent act (`↑ behind` at plan granularity, `~ diverged` per
 *   file). Data-class files (board, cards, vault/**, .council.json,
 *   preflight.sh) are report-only, never written.
 * - The provenance record `$CONFIG_DIR_NAME/council/scaffold.json` gives
 *   three states content-compare cannot: unchanged / behind
 *   (pristine-stale) / diverged (consumer-edited or unrecorded — the
 *   ask-once bootstrap carve). The record updates only after a consented
 *   write.
 * - Engine-resolved validation is forbidden: the consumer's validate.py copy
 *   is load-bearing (`ROOT = Path(__file__).resolve().parent.parent`), so
 *   post-refresh validation runs the CONSUMER's copy against the consumer's
 *   root, and its result is reported as a visually distinct block.
 * - Drift detection (steward Q2): non-fatal, session_start, once per drift
 *   condition, re-arming on new drift, never blocking a session.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { spawnSync } from "node:child_process";
import { CONFIG_DIR_NAME } from "@earendil-works/pi-coding-agent";
import { PKG_ROOT } from "./seats.ts";
import {
	readScaffoldRecord,
	renderScaffoldText,
	scaffoldInto,
	scaffoldRecordPath,
	sha256Hex,
	TOOLING_FILES,
	type ScaffoldRecord,
} from "./scaffold.ts";

/** The installed package's scaffold tree. */
export const SCAFFOLD_ROOT = path.join(PKG_ROOT, "council", "scaffold");

export type RefreshState = "unchanged" | "behind" | "diverged" | "removed" | "shadowed" | "local-only";

export interface RefreshRow {
	/** POSIX-normalized path relative to the consumer repo root. */
	rel: string;
	state: RefreshState;
	/** true for the refresh-writable tooling class; data-class files are report-only. */
	tooling: boolean;
	/** `… shadowed` rows only: does the local override match the packaged copy? */
	matchesPackaged?: boolean;
}

export interface RefreshPlan {
	/** Scaffold files created (create: true) or that WOULD be created (dry-run). */
	created: string[];
	rows: RefreshRow[];
}

/** Packaged bytes for a scaffold rel, exactly as scaffoldInto would write them. */
export function packagedBytes(scaffoldRoot: string, rel: string): Buffer {
	const raw = fs.readFileSync(path.join(scaffoldRoot, ...rel.split("/")), "utf-8");
	return Buffer.from(path.basename(rel) === "preflight.sh" ? renderScaffoldText(raw) : raw, "utf-8");
}

function walkScaffoldFiles(scaffoldRoot: string): string[] {
	const out: string[] = [];
	const walk = (rel: string): void => {
		let entries: fs.Dirent[];
		try {
			entries = fs.readdirSync(path.join(scaffoldRoot, rel), { withFileTypes: true });
		} catch {
			return;
		}
		for (const entry of entries) {
			const child = rel ? `${rel}/${entry.name}` : entry.name;
			if (entry.isDirectory()) walk(child);
			else if (entry.isFile()) out.push(child);
		}
	};
	walk("");
	return out.sort();
}

/** The scaffoldInto-first creation pass: files added to the scaffold since the
 * consumer's init are created by the existing non-clobbering path. Record-
 * known paths are skipped, so a consumer-deleted scaffold file is REPORTED
 * (`removed`), never silently recreated. Returns the created rel paths. */
function creationPass(repoRoot: string, scaffoldRoot: string, record: ScaffoldRecord): string[] {
	const recordKeys = new Set(Object.keys(record));
	const result = scaffoldInto(repoRoot, scaffoldRoot, { skip: (rel) => recordKeys.has(rel) });
	return result.created.filter((c) => c.includes("/") || c.endsWith(".json")).map((rel) => rel.split(path.sep).join("/"));
}

function planRows(repoRoot: string, scaffoldRoot: string, record: ScaffoldRecord): RefreshRow[] {
	const shipped = walkScaffoldFiles(scaffoldRoot);
	const shippedSet = new Set(shipped);
	const rows: RefreshRow[] = [];

	for (const rel of shipped) {
		const dst = path.join(repoRoot, ...rel.split("/"));
		if (!fs.existsSync(dst)) {
			// After the creation pass, a missing scaffold file is a consumer
			// deletion of a record-known file: report, never recreate.
			rows.push({ rel, state: "removed", tooling: TOOLING_FILES.includes(rel) });
			continue;
		}
		const consumer = fs.readFileSync(dst);
		const packaged = packagedBytes(scaffoldRoot, rel);
		const recorded = record[rel]?.sha256 ?? null;
		let state: RefreshState;
		if (consumer.equals(packaged)) {
			state = "unchanged"; // matches-current (with or without a record)
		} else if (recorded !== null && sha256Hex(consumer) === recorded) {
			state = "behind"; // pristine-stale
		} else {
			state = "diverged"; // consumer-edited, or unrecorded (bootstrap)
		}
		rows.push({ rel, state, tooling: TOOLING_FILES.includes(rel) });
	}

	// … shadowed: local procedure overrides shadowing packaged copies.
	const overrideDir = path.join(repoRoot, CONFIG_DIR_NAME, "council", "procedures");
	if (fs.existsSync(overrideDir)) {
		for (const name of fs.readdirSync(overrideDir)) {
			if (!name.endsWith(".md")) continue;
			const packagedProc = path.join(PKG_ROOT, "council", "procedures", name);
			if (!fs.existsSync(packagedProc)) continue;
			rows.push({
				rel: `${CONFIG_DIR_NAME}/council/procedures/${name}`,
				state: "shadowed",
				tooling: false,
				matchesPackaged: fs.readFileSync(path.join(overrideDir, name)).equals(fs.readFileSync(packagedProc)),
			});
		}
	}

	// · local-only: the package no longer ships a file the consumer still has.
	for (const rel of Object.keys(record)) {
		if (shippedSet.has(rel)) continue;
		const dst = path.join(repoRoot, ...rel.split("/"));
		if (fs.existsSync(dst)) rows.push({ rel, state: "local-only", tooling: false });
	}

	return rows;
}

/**
 * Compute the refresh report. With `create: false` (dry-run) NOTHING is
 * written; `created` lists the scaffold files the apply pass would create.
 * With `create: true` the scaffoldInto-first pass actually runs.
 */
export function planRefresh(
	repoRoot: string,
	scaffoldRoot: string = SCAFFOLD_ROOT,
	opts: { create?: boolean } = {},
): RefreshPlan {
	const record = readScaffoldRecord(repoRoot);
	const created = opts.create ? creationPass(repoRoot, scaffoldRoot, record) : plannedCreations(repoRoot, scaffoldRoot, record);
	const rows = planRows(repoRoot, scaffoldRoot, readScaffoldRecord(repoRoot));
	return { created, rows };
}

/** Dry-run creation list: scaffold files missing on disk and not record-known. */
function plannedCreations(repoRoot: string, scaffoldRoot: string, record: ScaffoldRecord): string[] {
	const recordKeys = new Set(Object.keys(record));
	return walkScaffoldFiles(scaffoldRoot).filter(
		(rel) => !recordKeys.has(rel) && !fs.existsSync(path.join(repoRoot, ...rel.split("/"))),
	);
}

export interface ApplyResult {
	created: string[];
	/** Tooling files actually written (all `↑ behind` + individually accepted `~ diverged`). */
	written: string[];
	/** `~ diverged` tooling files skipped (not individually accepted). */
	skippedDiverged: string[];
	/** Timestamped backup paths, one per written file. */
	backups: string[];
	/** Backup directory; null when nothing was written (never created speculatively). */
	backupDir: string | null;
}

function backupTimestamp(): string {
	return new Date().toISOString().replace(/[:.]/g, "-");
}

/**
 * The consented apply: writes ONLY tooling-class files — every `↑ behind`
 * (the reviewed plan is the explicit act) plus `~ diverged` files individually
 * named in `accepts`. Each write takes a timestamped backup first and updates
 * the provenance record to the new (packaged) digest. Data-class files are
 * never written; package-side removals are never deleted.
 */
export function applyRefresh(
	repoRoot: string,
	scaffoldRoot: string = SCAFFOLD_ROOT,
	accepts: ReadonlySet<string> = new Set(),
): ApplyResult {
	const record = readScaffoldRecord(repoRoot);
	const created = creationPass(repoRoot, scaffoldRoot, record);

	const result: ApplyResult = { created, written: [], skippedDiverged: [], backups: [], backupDir: null };
	let recordDirty = false;

	for (const row of planRows(repoRoot, scaffoldRoot, readScaffoldRecord(repoRoot))) {
		if (!row.tooling) continue; // data class: report-only, never written
		if (row.state === "behind" || (row.state === "diverged" && accepts.has(row.rel))) {
			const dst = path.join(repoRoot, ...row.rel.split("/"));
			const packaged = packagedBytes(scaffoldRoot, row.rel);
			if (result.backupDir === null) {
				result.backupDir = path.join(repoRoot, CONFIG_DIR_NAME, "council", "scaffold-backups", backupTimestamp());
				fs.mkdirSync(result.backupDir, { recursive: true });
			}
			const backupPath = path.join(result.backupDir, ...row.rel.split("/"));
			fs.mkdirSync(path.dirname(backupPath), { recursive: true });
			fs.copyFileSync(dst, backupPath);
			result.backups.push(backupPath);
			fs.writeFileSync(dst, packaged);
			const fresh = readScaffoldRecord(repoRoot);
			fresh[row.rel] = { sha256: sha256Hex(packaged), packageVersion: scaffoldPackageVersion(scaffoldRoot) };
			writeScaffoldRecord(repoRoot, fresh);
			recordDirty = true;
			result.written.push(row.rel);
		} else if (row.state === "diverged") {
			result.skippedDiverged.push(row.rel);
		}
	}
	void recordDirty;
	return result;
}

function scaffoldPackageVersion(scaffoldRoot: string): string {
	try {
		const pkg = JSON.parse(fs.readFileSync(path.resolve(scaffoldRoot, "..", "..", "package.json"), "utf-8"));
		return typeof pkg?.version === "string" ? pkg.version : "unknown";
	} catch {
		return "unknown";
	}
}

function writeScaffoldRecord(repoRoot: string, record: ScaffoldRecord): void {
	fs.mkdirSync(path.dirname(scaffoldRecordPath(repoRoot)), { recursive: true });
	fs.writeFileSync(scaffoldRecordPath(repoRoot), JSON.stringify(record, null, 2) + "\n");
}

/**
 * Post-refresh validation: runs the CONSUMER's council/validate.py against the
 * consumer root (never a packaged copy — the `ROOT = __file__` coupling makes
 * that a false-green generator). Never throws; a missing python3 is reported
 * through `ran: false`.
 */
export function runPostRefreshValidate(repoRoot: string): { ran: boolean; status: number; output: string; error?: string } {
	try {
		const res = spawnSync("python3", ["council/validate.py"], { cwd: repoRoot, encoding: "utf-8" });
		if (res.error) return { ran: false, status: -1, output: "", error: res.error.message };
		return { ran: true, status: res.status ?? -1, output: `${res.stdout ?? ""}${res.stderr ?? ""}`.trim() };
	} catch (e) {
		return { ran: false, status: -1, output: "", error: e instanceof Error ? e.message : String(e) };
	}
}

/** Persisted drift-notification state: the last-notified condition hash. */
function driftStatePath(repoRoot: string): string {
	return path.join(repoRoot, CONFIG_DIR_NAME, "council", "tooling-drift.state.json");
}

function driftConditionHash(drifted: string[], repoRoot: string): string {
	const parts = drifted
		.sort()
		.map((rel) => `${rel}:${sha256Hex(fs.readFileSync(path.join(repoRoot, ...rel.split("/"))))}`);
	return sha256Hex(JSON.stringify(parts));
}

/**
 * Session-start drift check (steward Q2): are the tooling-class files on disk
 * out of date relative to the installed package? Non-fatal at the call site
 * (the session_start handler wraps this in try/catch). A drift condition —
 * the set of drifted tooling files and their consumer digests — is notified
 * ONCE; the notified condition persists in
 * `$CONFIG_DIR_NAME/council/tooling-drift.state.json` so later sessions with
 * the SAME condition stay silent, and a CHANGED condition re-arms. A resolved
 * drift clears the state so the same drift can be flagged again if it
 * reappears.
 */
export function checkToolingDrift(repoRoot: string, scaffoldRoot: string = SCAFFOLD_ROOT): { drifted: string[]; message: string | null } {
	const drifted: string[] = [];
	for (const rel of TOOLING_FILES) {
		const dst = path.join(repoRoot, ...rel.split("/"));
		if (!fs.existsSync(dst)) continue; // missing files are init/update territory, not drift
		if (!fs.readFileSync(dst).equals(packagedBytes(scaffoldRoot, rel))) drifted.push(rel);
	}

	const statePath = driftStatePath(repoRoot);
	if (drifted.length === 0) {
		try {
			fs.rmSync(statePath);
		} catch {
			/* nothing to clear */
		}
		return { drifted, message: null };
	}

	const condition = driftConditionHash(drifted, repoRoot);
	let notified: string | null = null;
	try {
		notified = (JSON.parse(fs.readFileSync(statePath, "utf-8")) as { notifiedCondition?: string })?.notifiedCondition ?? null;
	} catch {
		notified = null;
	}
	if (notified === condition) return { drifted, message: null };

	try {
		fs.mkdirSync(path.dirname(statePath), { recursive: true });
		fs.writeFileSync(statePath, JSON.stringify({ notifiedCondition: condition }, null, 2) + "\n");
	} catch {
		/* state persistence is best-effort; the notification still fires */
	}
	return {
		drifted,
		message: `council: packaged tooling is out of date — ${drifted.join(", ")} differ from the installed package. Run /council-update to review and refresh (dry-run by default; --apply writes 'behind' files).`,
	};
}
