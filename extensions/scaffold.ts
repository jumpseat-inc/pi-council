import * as fs from "node:fs";
import * as path from "node:path";
import { CONFIG_DIR_NAME } from "@earendil-works/pi-coding-agent";

export interface ScaffoldResult {
	created: string[];
	skipped: string[];
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

function renderScaffoldText(content: string): string {
	return content.replace(/\@CONFIG_DIR@/g, RENDER["@CONFIG_DIR@"] ?? "");
}

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
					const srcPath = path.join(src, entry.name);
					if (entry.name === "preflight.sh") {
						fs.writeFileSync(dst, renderScaffoldText(fs.readFileSync(srcPath, "utf-8")));
					} else {
						fs.copyFileSync(srcPath, dst);
					}
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
	return result;
}
