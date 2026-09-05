// FLLWUP-21 driver fixture — NOT a test, never executed by `bun test` on its
// own (repo convention: test/*.ts non-*.test.ts files are harvest/helpers, and
// this file is spawned explicitly by test/env-split-contract.test.ts).
//
// Prints one JSON line describing how many slash commands the pi-council
// extension registered through the installed devDependency pi's
// discoverAndLoadExtensions, then exits 0. The process environment is fully
// explicit (constructed by the test) — this driver adds nothing.
//
// Env: FLLWUP21_REPO_ROOT — absolute path to the repo root (the extension's
//      factory reads process.cwd() = the repo root; procedures resolve from
//      the packaged council/procedures when no override exists).
//      COUNCIL_SEAT (optional) — when set, the extension enters child mode
//      and must register zero slash commands (pole B).
import { discoverAndLoadExtensions } from "@earendil-works/pi-coding-agent";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const repoRoot = process.env.FLLWUP21_REPO_ROOT;
const emit = (line: string) =>
	process.stdout.write(`${line}\n`, () => process.exit(0));

async function main(): Promise<void> {
	if (!repoRoot) {
		emit(JSON.stringify({ error: "FLLWUP21_REPO_ROOT not set" }));
		return;
	}
	const scratch = mkdtempSync(join(tmpdir(), "fllwup21-driver-"));
	try {
		const { extensions, errors } = await discoverAndLoadExtensions(
			[join(repoRoot, "extensions")],
			repoRoot,
			scratch,
		);
		if (errors.length > 0) {
			const e = errors[0];
			emit(JSON.stringify({ error: `${e.path}: ${e.error}` }));
			return;
		}
		emit(JSON.stringify({ commands: extensions[0]?.commands.size ?? -1 }));
	} catch (err) {
		emit(
			JSON.stringify({
				error: err instanceof Error ? err.message : String(err),
			}),
		);
	}
}

void main();