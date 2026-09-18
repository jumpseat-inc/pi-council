/**
 * FLLWUP-50 — supported refresh path for packaged council tooling.
 *
 * Spec: docs/superpowers/specs/2026-09-19-FLLWUP-50-design.md (R1–R6,
 * steward Q2 + lifecycle policy). Red-first tests T1–T10 per spec §Hard
 * invariants. All tests use mkdtemp consumer roots — never the real repo.
 *
 * Engine surface under test:
 *   extensions/scaffold.ts      — TOOLING_FILES / DATA_FILES classification
 *                                 constants, scaffold.json provenance record
 *                                 (written on creation only), skip filter.
 *   extensions/council-update.ts — planRefresh / applyRefresh (consent-gated
 *                                 tooling writes + timestamped backups),
 *                                 runPostRefreshValidate, checkToolingDrift.
 */
import { test, expect } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { spawnSync } from "node:child_process";
import {
	DATA_FILES,
	TOOLING_FILES,
	readScaffoldRecord,
	renderScaffoldText,
	scaffoldInto,
	scaffoldRecordPath,
	sha256Hex,
} from "../extensions/scaffold.ts";
import { CONFIG_DIR_NAME } from "@earendil-works/pi-coding-agent";
import { PKG_ROOT } from "../extensions/seats.ts";

const SCAFFOLD = path.join(PKG_ROOT, "council", "scaffold");

/** All files in the packaged scaffold tree, POSIX-normalized. */
function walkScaffold(root = SCAFFOLD, rel = ""): string[] {
	const out: string[] = [];
	for (const entry of fs.readdirSync(rel ? path.join(root, rel) : root, { withFileTypes: true })) {
		const child = rel ? `${rel}/${entry.name}` : entry.name;
		if (entry.isDirectory()) out.push(...walkScaffold(root, child));
		else if (entry.isFile()) out.push(child);
	}
	return out.sort();
}

function consumerPath(repoRoot: string, rel: string): string {
	return path.join(repoRoot, ...rel.split("/"));
}

function sha256File(p: string): string {
	return sha256Hex(fs.readFileSync(p));
}

/** Packaged bytes for a scaffold rel (rendered for preflight.sh). */
function packagedBytes(rel: string): Buffer {
	const raw = fs.readFileSync(consumerPath(SCAFFOLD, rel), "utf-8");
	return Buffer.from(path.basename(rel) === "preflight.sh" ? renderScaffoldText(raw) : raw, "utf-8");
}

function mkdirp(p: string): void {
	fs.mkdirSync(path.dirname(p), { recursive: true });
}

/** Write a consumer-side scaffold.json record. */
function writeRecord(repoRoot: string, entries: Record<string, { sha256: string; packageVersion: string }>): void {
	const recordPath = scaffoldRecordPath(repoRoot);
	mkdirp(recordPath);
	fs.writeFileSync(recordPath, JSON.stringify(entries, null, 2) + "\n");
}

/**
 * Seed a consumer repo the way a pre-FLLWUP-50 init would have left it:
 * full scaffold, tooling files stale (≠ packaged), a consumer-edited board,
 * card, and wiki page — and NO scaffold.json (the ESC-3 population).
 * Returns { root, originals } with byte snapshots for untouched-assertions.
 */
function seedConsumerNoRecord(): { root: string; originals: Map<string, string> } {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "fllwup50-consumer-"));
	scaffoldInto(root, SCAFFOLD);
	fs.rmSync(scaffoldRecordPath(root)); // pre-record population

	// stale tooling: old validator copy (marker text changed) + old template
	const staleValidate =
		fs.readFileSync(consumerPath(SCAFFOLD, "council/validate.py"), "utf-8").replace(
			"Exits non-zero and prints a FAIL: line per finding.",
			"Exits non-zero and prints FAIL lines. (pre-FLLWUP-43 copy)",
		) + "\n";
	const staleTemplate =
		fs.readFileSync(consumerPath(SCAFFOLD, "council/cards/_template.md"), "utf-8").replace(
			/^# Card Template.*$/m,
			"# Card Template (older copy)",
		) + "\n";
	fs.writeFileSync(consumerPath(root, "council/validate.py"), staleValidate);
	fs.writeFileSync(consumerPath(root, "council/cards/_template.md"), staleTemplate);

	// consumer data: edit board + one card + a wiki page; the card carries a
	// matching board line (appended at EOF → under the last column, Done) so
	// the seeded tree is a VALID consumer tree before any test corrupts it.
	fs.appendFileSync(consumerPath(root, "council/board.md"), "- FLLWUP-42 — Consumer card\n");
	fs.appendFileSync(consumerPath(root, "council/board.md"), "\n<!-- consumer edit -->\n");
	const card = path.join(root, "council", "cards", "FLLWUP-42.md");
	fs.writeFileSync(
		card,
		"---\nid: FLLWUP-42\ntitle: Consumer card\nstate: Done\nowner: null\nepic: EPIC-9\ngoal: a consumer-authored card\n---\n\n## Intent\n\nmine\n",
	);
	fs.appendFileSync(consumerPath(root, "vault/wiki/index.md"), "\n<!-- wiki edit -->\n");

	const originals = new Map<string, string>();
	for (const rel of ["council/board.md", "council/cards/FLLWUP-42.md", "vault/wiki/index.md", "vault/CLAUDE.md", ".council.json", "council/preflight.sh"]) {
		originals.set(rel, sha256File(consumerPath(root, rel)));
	}
	return { root, originals };
}

// ---------------------------------------------------------------------------
// T4 — classification completeness guard (steward lifecycle)
// ---------------------------------------------------------------------------

test("T4: TOOLING_FILES ∪ DATA_FILES == the walked scaffold file set, disjoint", () => {
	const walked = walkScaffold();
	const classified = [...TOOLING_FILES, ...DATA_FILES].sort();
	expect(classified).toEqual(walked);
	expect(new Set([...TOOLING_FILES, ...DATA_FILES]).size).toBe(classified.length);
	expect([...TOOLING_FILES].sort()).toEqual(["council/cards/_template.md", "council/validate.py"]);
	expect(DATA_FILES).toContain("council/preflight.sh"); // data-class by design
	expect(DATA_FILES).toContain("council/board.md"); // protected class is real
});

test("T4b: no engine-side reclassification — tooling class is a shipped constant of exactly two files", () => {
	expect(TOOLING_FILES.length).toBe(2);
});

test("T8a: parity-pin awareness — 10 validate.py copies ship today and 16 fixture seeds carry treeDigest", () => {
	// O1 (closed-red): the tree pins 16 seed.treeDigests, not 8. This card
	// must not reshape any seed tree; these counts are the re-pin-size facts.
	const repo = PKG_ROOT;
	const validators = walkScaffold; // placeholder to keep helper referenced
	void validators;
	let validateCount = 0;
	let templateCount = 0;
	const countDir = (dir: string): void => {
		for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
			const p = path.join(dir, entry.name);
			if (entry.isDirectory()) countDir(p);
			else if (entry.name === "validate.py") validateCount++;
			else if (entry.name === "_template.md") templateCount++;
		}
	};
	countDir(path.join(repo, "council"));
	expect(validateCount).toBe(10);
	expect(templateCount).toBe(10);
	const fixtureFiles = fs.readdirSync(path.join(repo, "council", "fixtures"));
	const withDigest = fixtureFiles.filter((f) =>
		fs.readFileSync(path.join(repo, "council", "fixtures", f, "fixture.json"), "utf-8").includes("treeDigest"),
	);
	expect(withDigest.length).toBe(16);
});

// ---------------------------------------------------------------------------
// Provenance record — written on creation only
// ---------------------------------------------------------------------------

test("record: scaffoldInto writes scaffold.json entries for created scaffold files only", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "fllwup50-record-"));
	scaffoldInto(root, SCAFFOLD);

	const record = readScaffoldRecord(root);
	expect(record["council/validate.py"]).toBeDefined();
	expect(record["council/validate.py"]!.sha256).toBe(sha256Hex(packagedBytes("council/validate.py")));
	expect(record["council/validate.py"]!.packageVersion).not.toBe("");
	// preflight.sh's recorded digest covers the RENDERED bytes
	expect(record["council/preflight.sh"]!.sha256).toBe(sha256Hex(packagedBytes("council/preflight.sh")));
	// every created scaffold file is recorded; mcp.json / empty dirs are not
	for (const rel of walkScaffold()) expect(record[rel]).toBeDefined();
	expect(record[`${CONFIG_DIR_NAME}/council/mcp.json`]).toBeUndefined();
	expect(record["vault/raw"]).toBeUndefined();
});

test("record: a skipped re-run leaves the record byte-identical (creation-only writes)", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "fllwup50-record2-"));
	scaffoldInto(root, SCAFFOLD);
	const before = fs.readFileSync(scaffoldRecordPath(root), "utf-8");
	scaffoldInto(root, SCAFFOLD);
	expect(fs.readFileSync(scaffoldRecordPath(root), "utf-8")).toBe(before);
});

test("record: malformed consumer record does not crash scaffoldInto", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "fllwup50-record3-"));
	mkdirp(scaffoldRecordPath(root));
	fs.writeFileSync(scaffoldRecordPath(root), "{not json");
	scaffoldInto(root, SCAFFOLD);
	expect(readScaffoldRecord(root)["council/validate.py"]).toBeDefined();
});

test("skip filter: record-known deleted files are not silently recreated; plain scaffoldInto still recreates", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "fllwup50-skip-"));
	scaffoldInto(root, SCAFFOLD);
	writeRecord(root, { "council/validate.py": { sha256: sha256Hex(packagedBytes("council/validate.py")), packageVersion: "0.19.0" } });
	fs.rmSync(consumerPath(root, "council/validate.py"));

	const second = scaffoldInto(root, SCAFFOLD, {
		skip: (rel) => rel === "council/validate.py",
	});
	expect(second.created).not.toContain("council/validate.py");
	expect(fs.existsSync(consumerPath(root, "council/validate.py"))).toBe(false);

	const plain = scaffoldInto(root, SCAFFOLD);
	expect(plain.created).toContain("council/validate.py");
	expect(fs.existsSync(consumerPath(root, "council/validate.py"))).toBe(true);
});

// ---------------------------------------------------------------------------
// Task 2 — refresh engine (council-update.ts)
// ---------------------------------------------------------------------------

import {
	applyRefresh,
	checkToolingDrift,
	planRefresh,
	runPostRefreshValidate,
	type RefreshRow,
} from "../extensions/council-update.ts";

const TOOLING = ["council/cards/_template.md", "council/validate.py"] as const;

/** Record entries matching the currently-stale consumer bytes. */
function recordFor(root: string, rel: string): { sha256: string; packageVersion: string } {
	return { sha256: sha256File(consumerPath(root, rel)), packageVersion: "0.19.0" };
}

test("T1 bootstrap: no record → diverged plan; consented accept refreshes tooling, touches nothing else, records new digests", () => {
	const { root, originals } = seedConsumerNoRecord();

	// dry-run: plan reports both tooling files diverged (bootstrap carve), writes nothing
	const plan = planRefresh(root, SCAFFOLD);
	const toolingRows = plan.rows.filter((r) => r.tooling);
	expect(toolingRows.map((r) => r.state).sort()).toEqual(["diverged", "diverged"]);
	for (const rel of TOOLING) {
		expect(fs.readFileSync(consumerPath(root, rel), "utf-8")).not.toBe(packagedBytes(rel).toString());
	}

	// bootstrap consent: both tooling files individually accepted
	const result = applyRefresh(root, SCAFFOLD, new Set<string>(TOOLING));
	expect(result.written.sort()).toEqual([...TOOLING].sort());
	expect(result.skippedDiverged).toEqual([]);
	expect(result.backups.length).toBe(2);

	for (const rel of TOOLING) {
		// tooling now byte-equal to council/scaffold/**
		expect(fs.readFileSync(consumerPath(root, rel), "utf-8")).toBe(packagedBytes(rel).toString());
	}
	// protected data untouched, byte-for-byte
	for (const [rel, digest] of originals) {
		expect(sha256File(consumerPath(root, rel)), rel).toBe(digest);
	}
	// record now carries the new (packaged) digests for the accepted files
	const record = readScaffoldRecord(root);
	for (const rel of TOOLING) {
		expect(record[rel]!.sha256).toBe(sha256Hex(packagedBytes(rel)));
	}
	// ...and only for the accepted files (never for refused/skipped data)
	expect(record["council/preflight.sh"]).toBeUndefined();
	fs.rmSync(root, { recursive: true, force: true });
});

test("T3 edit safety: pristine-stale / hand-edited / matches-current emit three distinct statuses; flag-less run changes nothing", () => {
	const mk = (mutate: (root: string) => void): string => {
		const root = fs.mkdtempSync(path.join(os.tmpdir(), "fllwup50-t3-"));
		scaffoldInto(root, SCAFFOLD);
		mutate(root);
		return root;
	};
	const staleValidate = () =>
		fs.readFileSync(consumerPath(SCAFFOLD, "council/validate.py"), "utf-8") + "\n# stale copy\n";

	// pristine-stale: bytes == recorded ∧ bytes ≠ packaged
	const pristine = mk((root) => {
		fs.writeFileSync(consumerPath(root, "council/validate.py"), staleValidate());
		writeRecord(root, { "council/validate.py": recordFor(root, "council/validate.py") });
	});
	// consumer-edited: bytes ≠ recorded ∧ bytes ≠ packaged (record = pristine digest)
	const edited = mk((root) => {
		const stale = staleValidate();
		fs.writeFileSync(consumerPath(root, "council/validate.py"), stale + "# hand edit\n");
		writeRecord(root, { "council/validate.py": { sha256: sha256Hex(stale), packageVersion: "0.19.0" } });
	});
	// matches-current: bytes == packaged
	const current = mk((root) => {
		writeRecord(root, { "council/validate.py": recordFor(root, "council/validate.py") });
	});

	const stateOf = (root: string): RefreshRow["state"] =>
		planRefresh(root, SCAFFOLD).rows.find((r) => r.rel === "council/validate.py")!.state;
	const states = new Set([stateOf(pristine), stateOf(edited), stateOf(current)]);
	expect(stateOf(pristine)).toBe("behind");
	expect(stateOf(edited)).toBe("diverged");
	expect(stateOf(current)).toBe("unchanged");
	expect(states.size).toBe(3);

	// flag-less run leaves every byte identical
	for (const root of [pristine, edited, current]) {
		const before = sha256File(consumerPath(root, "council/validate.py"));
		planRefresh(root, SCAFFOLD);
		expect(sha256File(consumerPath(root, "council/validate.py"))).toBe(before);
		fs.rmSync(root, { recursive: true, force: true });
	}
});

test("T5 idempotence: second apply reports nothing written, creates no backup", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "fllwup50-t5-"));
	scaffoldInto(root, SCAFFOLD);
	// pristine-stale validate.py with a matching record
	fs.writeFileSync(consumerPath(root, "council/validate.py"), packagedBytes("council/validate.py").toString() + "\n# stale\n");
	writeRecord(root, { "council/validate.py": recordFor(root, "council/validate.py") });

	const first = applyRefresh(root, SCAFFOLD);
	expect(first.written).toEqual(["council/validate.py"]);
	expect(first.backupDir).not.toBeNull();
	const backupDir = first.backupDir!;

	const second = applyRefresh(root, SCAFFOLD);
	expect(second.written).toEqual([]);
	expect(second.backupDir).toBeNull();
	expect(fs.existsSync(path.join(backupDir, "council", "validate.py"))).toBe(true);
	fs.rmSync(root, { recursive: true, force: true });
});

test("T6 non-clobbering: plain scaffoldInto after a refresh is still a no-op — record and bytes unchanged", () => {
	const { root } = seedConsumerNoRecord();
	applyRefresh(root, SCAFFOLD, new Set<string>(TOOLING));
	const recordBefore = fs.readFileSync(scaffoldRecordPath(root), "utf-8");
	const validateBefore = sha256File(consumerPath(root, "council/validate.py"));

	const rerun = scaffoldInto(root, SCAFFOLD);
	const createdFiles = rerun.created.filter((c) => c !== "vault/raw" && c !== "vault/wiki/sources");
	expect(createdFiles).toEqual([]);
	expect(rerun.skipped).toContain("council/validate.py");
	expect(fs.readFileSync(scaffoldRecordPath(root), "utf-8")).toBe(recordBefore);
	expect(sha256File(consumerPath(root, "council/validate.py"))).toBe(validateBefore);
	fs.rmSync(root, { recursive: true, force: true });
});

test("T7 override semantics: local procedure overrides are reported shadowed (matches-packaged | differs) and never written", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "fllwup50-t7-"));
	scaffoldInto(root, SCAFFOLD);
	// two local overrides: one differing, one byte-identical to the packaged copy
	const procDir = path.join(root, CONFIG_DIR_NAME, "council", "procedures");
	fs.mkdirSync(procDir, { recursive: true });
	fs.copyFileSync(
		consumerPath(PKG_ROOT, "council/procedures/council.md"),
		path.join(procDir, "council.md"),
	);
	fs.writeFileSync(path.join(procDir, "council.md"), fs.readFileSync(path.join(procDir, "council.md"), "utf-8") + "\n<!-- local tuning -->\n");
	fs.copyFileSync(
		consumerPath(PKG_ROOT, "council/procedures/wiki-query.md"),
		path.join(procDir, "wiki-query.md"),
	);

	const plan = planRefresh(root, SCAFFOLD);
	const shadowed = plan.rows.filter((r) => r.state === "shadowed");
	expect(shadowed.map((r) => r.rel).sort()).toEqual(
		[`${CONFIG_DIR_NAME}/council/procedures/council.md`, `${CONFIG_DIR_NAME}/council/procedures/wiki-query.md`].sort(),
	);
	expect(shadowed.find((r) => r.rel.endsWith("council.md"))!.matchesPackaged).toBe(false);
	expect(shadowed.find((r) => r.rel.endsWith("wiki-query.md"))!.matchesPackaged).toBe(true);

	// --apply accepts both tooling files: zero writes under $CONFIG_DIR_NAME/council/procedures/
	const overrideBytes = new Map<string, string>();
	for (const f of fs.readdirSync(procDir)) overrideBytes.set(f, sha256File(path.join(procDir, f)));
	const mcpBefore = sha256File(path.join(root, CONFIG_DIR_NAME, "council", "mcp.json"));
	applyRefresh(root, SCAFFOLD, new Set<string>(TOOLING));
	for (const [f, digest] of overrideBytes) expect(sha256File(path.join(procDir, f)), f).toBe(digest);
	expect(sha256File(path.join(root, CONFIG_DIR_NAME, "council", "mcp.json"))).toBe(mcpBefore);
	fs.rmSync(root, { recursive: true, force: true });
});

test("engine: removed and local-only states — a record-known deleted file is reported, never recreated; package-side removals are local-only, never deleted", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "fllwup50-removal-"));
	scaffoldInto(root, SCAFFOLD);
	const record = readScaffoldRecord(root);
	record["council/validate.py"] = { sha256: sha256Hex(packagedBytes("council/validate.py")), packageVersion: "0.19.0" };
	record["council/gone-file.py"] = { sha256: "abc", packageVersion: "0.19.0" };
	writeRecord(root, record);
	// consumer deleted a recorded scaffold file; also still holds a file the package no longer ships
	fs.rmSync(consumerPath(root, "council/validate.py"));
	fs.writeFileSync(consumerPath(root, "council/gone-file.py"), "old bytes\n");

	const plan = planRefresh(root, SCAFFOLD, { create: true });
	expect(plan.rows.find((r) => r.rel === "council/validate.py")!.state).toBe("removed");
	expect(plan.rows.find((r) => r.rel === "council/gone-file.py")!.state).toBe("local-only");
	// never recreated, never deleted
	expect(fs.existsSync(consumerPath(root, "council/validate.py"))).toBe(false);
	expect(fs.existsSync(consumerPath(root, "council/gone-file.py"))).toBe(true);
	fs.rmSync(root, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// T2 — the false-green trap (engine-resolved validation is forbidden)
// ---------------------------------------------------------------------------

test("T2 false-green pin: the documented validate invocation FAILs on a corrupted consumer board — never 'All council artifacts valid'", () => {
	const { root } = seedConsumerNoRecord(); // a VALID consumer tree to start
	expect(runPostRefreshValidate(root).status).toBe(0);
	// corrupt the board: drop the card's board line
	const boardPath = consumerPath(root, "council/board.md");
	fs.writeFileSync(
		boardPath,
		fs
			.readFileSync(boardPath, "utf-8")
			.split("\n")
			.filter((l) => !l.startsWith("- FLLWUP-42"))
			.join("\n"),
	);
	// run the validator exactly the way the documentation instructs
	const res = spawnSync("python3", [path.join(root, "council", "validate.py")], { cwd: root, encoding: "utf-8" });
	expect(res.status).not.toBe(0);
	expect(res.stdout).toContain("FAIL:");
	expect(res.stdout).not.toContain("All council artifacts valid");

	// the engine's post-refresh runner surfaces the same consumer-root result
	const post = runPostRefreshValidate(root);
	expect(post.ran).toBe(true);
	expect(post.status).not.toBe(0);
	expect(post.output).toContain("FAIL:");
	fs.rmSync(root, { recursive: true, force: true });
});

test("T2b post-refresh runner: consumer-root run of the refreshed validator is green on a clean consumer tree", () => {
	const { root } = seedConsumerNoRecord();
	applyRefresh(root, SCAFFOLD, new Set<string>(TOOLING));
	const post = runPostRefreshValidate(root);
	expect(post.ran).toBe(true);
	expect(post.status).toBe(0);
	expect(post.output).toContain("All council artifacts valid");
	fs.rmSync(root, { recursive: true, force: true });
});
