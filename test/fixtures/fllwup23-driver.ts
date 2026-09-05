// FLLWUP-23 driver fixture — NOT a test, never executed by `bun test` on its
// own (repo convention: test/*.ts non-*.test.ts files are harvest/helpers).
//
// Loads one extension path through the installed pi's
// discoverAndLoadExtensions and emits one JSON line:
//   {"commands": <registered slash command count>, "errors": [<load error strings>]}
// then exits 0. The process env is fully explicit (constructed by the test);
// this driver adds nothing.
//
// Env: FLLWUP23_EXT_ROOT — scratch package-tree root: loads [<root>/extensions]
//      with cwd = root (the extension factory's process.cwd()).
//      FLLWUP23_CANARY  — when set, load [<dir>] as the extension path with
//      cwd = its parent directory (used by the async-factory control).
import { discoverAndLoadExtensions } from "@earendil-works/pi-coding-agent";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

const emit = (line: string) => process.stdout.write(`${line}\n`, () => process.exit(0));

async function main(): Promise<void> {
	const extRoot = process.env.FLLWUP23_EXT_ROOT;
	const canaryDir = process.env.FLLWUP23_CANARY;
	if (!extRoot && !canaryDir) {
		emit(JSON.stringify({ error: "FLLWUP23_EXT_ROOT/FLLWUP23_CANARY not set" }));
		return;
	}
	const sessionDir = mkdtempSync(join(tmpdir(), "fllwup23-driver-"));
	try {
		const target = canaryDir ? [canaryDir] : [join(extRoot!, "extensions")];
		const cwd = canaryDir ? dirname(canaryDir) : extRoot!;
		const { extensions, errors } = await discoverAndLoadExtensions(target, cwd, sessionDir);
		emit(
			JSON.stringify({
				commands: extensions[0]?.commands.size ?? 0,
				errors: errors.map((e) => e.error),
			}),
		);
	} catch (err) {
		emit(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }));
	}
}

void main();