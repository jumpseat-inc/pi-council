import * as fs from "node:fs";
import * as path from "node:path";
import { createHash } from "node:crypto";
import { CONFIG_DIR_NAME } from "@earendil-works/pi-coding-agent";

export interface ScaffoldResult {
	created: string[];
	skipped: string[];
}

/**
 * FLLWUP-50 tooling/data classification of the `council/scaffold/` tree — a
 * shipped constant, NOT repo-extensible (steward lifecycle policy).
 *
 * `tooling` files are the refresh-writable class: executed-by-path packaged
 * tooling with no sanctioned consumer-edit story (today exactly
 * `council/validate.py` + `council/cards/_template.md`). Everything else in
 * the scaffold tree is `data` — report-only, never written by the refresh
 * path (board, cards, vault/**, .council.json, and preflight.sh, whose own
 * "adapt to your project" header is the design evidence).
 *
 * The set-equality guard in test/council-update.test.ts (T4) asserts
 * `tooling ∪ data == the walked scaffold file set`, so a newly-shipped
 * scaffold file reds the suite until it is classified (default: data).
 */
export const TOOLING_FILES: readonly string[] = ["council/cards/_template.md", "council/validate.py"];
export const DATA_FILES: readonly string[] = [
	".council.json",
	"council/board.md",
	"council/preflight.sh",
	"vault/CLAUDE.md",
	"vault/wiki/index.md",
	"vault/wiki/log.md",
];

/** One scaffold.json entry: the recorded pristine digest + the package version that wrote it. */
export interface ScaffoldRecordEntry {
	sha256: string;
	packageVersion: string;
}
export type ScaffoldRecord = Record<string, ScaffoldRecordEntry>;

/** The consumer-side provenance record: `<repo>/$CONFIG_DIR_NAME/council/scaffold.json`. */
export function scaffoldRecordPath(repoRoot: string): string {
	return path.join(repoRoot, CONFIG_DIR_NAME, "council", "scaffold.json");
}

/** Read the provenance record. Missing or malformed → {} (the record is
 * consumer-owned data; a malformed file is treated as absent rather than
 * crashing scaffold paths). */
export function readScaffoldRecord(repoRoot: string): ScaffoldRecord {
	try {
		const parsed = JSON.parse(fs.readFileSync(scaffoldRecordPath(repoRoot), "utf-8")) as unknown;
		if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return {};
		return parsed as ScaffoldRecord;
	} catch {
		return {};
	}
}

export function sha256Hex(data: Buffer | string): string {
	return createHash("sha256").update(data).digest("hex");
}

/** Scaffold-relative keys are POSIX-normalized regardless of platform. */
export function toScaffoldRel(rel: string): string {
	return rel.split(path.sep).join("/");
}

/** Directories that carry no tracked files but the workflow expects to exist. */
const EMPTY_DIRS = ["vault/raw", "vault/wiki/sources"];

/** Default MCP registrations written by council-init so Context7 and Tavily are
 * available out of the box. Consumers override by editing .pi/council/mcp.json. */
const DEFAULT_MCP_CONFIG = {
	servers: {
		context7: { url: "https://mcp.context7.com/mcp/oauth", auth: "oauth", enabled: true },
		tavily: { url: "https://mcp.tavily.com/mcp", auth: "oauth", enabled: true },
	},
};

/** Static placeholders replaced into copied text files. Token → value. */
const RENDER: Record<string, string> = { "@CONFIG_DIR@": CONFIG_DIR_NAME };

export function renderScaffoldText(content: string): string {
	return content.replace(/\@CONFIG_DIR@/g, RENDER["@CONFIG_DIR@"] ?? "");
}

/** Version stamped into the provenance record; best-effort ("unknown" when
 * scaffoldRoot does not sit inside a package — e.g. ad-hoc test trees). */
function scaffoldPackageVersion(scaffoldRoot: string): string {
	try {
		const pkg = JSON.parse(fs.readFileSync(path.resolve(scaffoldRoot, "..", "..", "package.json"), "utf-8"));
		return typeof pkg?.version === "string" ? pkg.version : "unknown";
	} catch {
		return "unknown";
	}
}

/** Optional per-file creation filter (FLLWUP-50: /council-update skips
 * record-known paths so a consumer-deleted file is reported, not silently
 * recreated). Default (no options) preserves the plain non-clobbering walk. */
export interface ScaffoldOptions {
	skip?: (rel: string) => boolean;
}

/**
 * Copy scaffoldRoot into repoRoot, recursively, never overwriting.
 * Existing files are reported in `skipped` and left byte-for-byte untouched.
 *
 * FLLWUP-50: every scaffold-tree file REPORTED CREATED also gains an entry in
 * the consumer-side provenance record `<repo>/$CONFIG_DIR_NAME/council/
 * scaffold.json` (path → { sha256 of the written bytes, packageVersion }) —
 * written on creation only; skipped runs never touch the record.
 */
export function scaffoldInto(repoRoot: string, scaffoldRoot: string, options: ScaffoldOptions = {}): ScaffoldResult {
	const result: ScaffoldResult = { created: [], skipped: [] };
	const createdScaffoldFiles: Array<{ rel: string; bytes: Buffer }> = [];

	const walk = (rel: string) => {
		const src = path.join(scaffoldRoot, rel);
		let entries: fs.Dirent[];
		try {
			entries = fs.readdirSync(src, { withFileTypes: true });
		} catch {
			return;
		}
		for (const entry of entries) {
			const childRel = rel ? path.join(rel, entry.name) : entry.name;
			if (options.skip?.(toScaffoldRel(childRel))) continue;
			const dst = path.join(repoRoot, childRel);
			if (entry.isDirectory()) {
				walk(childRel);
			} else if (entry.isFile()) {
				if (fs.existsSync(dst)) {
					result.skipped.push(childRel);
				} else {
					fs.mkdirSync(path.dirname(dst), { recursive: true });
					const srcPath = path.join(src, entry.name);
					let bytes: Buffer;
					if (entry.name === "preflight.sh") {
						bytes = Buffer.from(renderScaffoldText(fs.readFileSync(srcPath, "utf-8")), "utf-8");
						fs.writeFileSync(dst, bytes);
					} else {
						bytes = fs.readFileSync(srcPath);
						fs.copyFileSync(srcPath, dst);
					}
					result.created.push(childRel);
					createdScaffoldFiles.push({ rel: toScaffoldRel(childRel), bytes });
				}
			}
		}
	};

	walk("");
	for (const dir of EMPTY_DIRS) {
		const dst = path.join(repoRoot, dir);
		if (!fs.existsSync(dst)) {
			fs.mkdirSync(dst, { recursive: true });
			result.created.push(dir);
		}
	}

	// Non-clobbering default MCP registration: Context7 by default unless the
	// consumer already has (or wrote) their own mcp.json.
	const mcpRel = path.join(CONFIG_DIR_NAME, "council", "mcp.json");
	const mcpDst = path.join(repoRoot, mcpRel);
	if (fs.existsSync(mcpDst)) {
		result.skipped.push(mcpRel);
	} else {
		fs.mkdirSync(path.dirname(mcpDst), { recursive: true });
		fs.writeFileSync(mcpDst, JSON.stringify(DEFAULT_MCP_CONFIG, null, 2) + "\n");
		result.created.push(mcpRel);
	}

	// Provenance record: created scaffold-tree files only (mcp.json and empty
	// dirs are engine-synthesized, not scaffold-tree entries). A skipped run
	// adds no entries and never rewrites the file.
	if (createdScaffoldFiles.length > 0) {
		const recordPath = scaffoldRecordPath(repoRoot);
		const record = readScaffoldRecord(repoRoot);
		const version = scaffoldPackageVersion(scaffoldRoot);
		for (const { rel, bytes } of createdScaffoldFiles) {
			record[rel] = { sha256: sha256Hex(bytes), packageVersion: version };
		}
		fs.mkdirSync(path.dirname(recordPath), { recursive: true });
		fs.writeFileSync(recordPath, JSON.stringify(record, null, 2) + "\n");
	}
	return result;
}

/** D1 (`/usages`) — copy the package's `council/skills/usages/` payload into
 * `<repo>/$CONFIG_DIR_NAME/skills/usages/`, non-clobbering, rendering
 * `@CONFIG_DIR@` at copy time (the same renderer `preflight.sh` uses).
 * Deliberately OUTSIDE the scaffold tree: engine-synthesized consumer files
 * like the default mcp.json, so `TOOLING_FILES`/`DATA_FILES`, the T4 guard,
 * and the scaffold.json provenance record are all untouched. */
export function copyUsagesSkill(repoRoot: string, pkgRoot: string): ScaffoldResult {
	const src = path.join(pkgRoot, "council", "skills", "usages");
	const dstRoot = path.join(repoRoot, CONFIG_DIR_NAME, "skills", "usages");
	const result: ScaffoldResult = { created: [], skipped: [] };
	const walk = (rel: string): void => {
		let entries: fs.Dirent[];
		try {
			entries = fs.readdirSync(path.join(src, rel), { withFileTypes: true });
		} catch {
			return;
		}
		for (const entry of entries) {
			const childRel = rel ? path.join(rel, entry.name) : entry.name;
			const srcPath = path.join(src, childRel);
			const dst = path.join(dstRoot, childRel);
			const key = toScaffoldRel(path.join("skills", "usages", childRel));
			if (entry.isDirectory()) {
				walk(childRel);
			} else if (entry.isFile()) {
				if (fs.existsSync(dst)) {
					result.skipped.push(key);
				} else {
					fs.mkdirSync(path.dirname(dst), { recursive: true });
					const bytes = Buffer.from(renderScaffoldText(fs.readFileSync(srcPath, "utf-8")), "utf-8");
					fs.writeFileSync(dst, bytes);
					result.created.push(key);
				}
			}
		}
	};
	walk("");
	return result;
}
