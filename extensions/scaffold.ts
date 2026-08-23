import * as fs from "node:fs";
import * as path from "node:path";

export interface ScaffoldResult {
	created: string[];
	skipped: string[];
}

/** Directories that carry no tracked files but the workflow expects to exist. */
const EMPTY_DIRS = ["vault/raw", "vault/wiki/sources"];

/**
 * Copy scaffoldRoot into repoRoot, recursively, never overwriting.
 * Existing files are reported in `skipped` and left byte-for-byte untouched.
 */
export function scaffoldInto(repoRoot: string, scaffoldRoot: string): ScaffoldResult {
	const result: ScaffoldResult = { created: [], skipped: [] };

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
			const dst = path.join(repoRoot, childRel);
			if (entry.isDirectory()) {
				walk(childRel);
			} else if (entry.isFile()) {
				if (fs.existsSync(dst)) {
					result.skipped.push(childRel);
				} else {
					fs.mkdirSync(path.dirname(dst), { recursive: true });
					fs.copyFileSync(path.join(src, entry.name), dst);
					result.created.push(childRel);
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
	return result;
}
