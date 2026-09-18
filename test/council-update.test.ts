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

	// consumer data: edit board + one card + a wiki page
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
	expect(TOOLING_FILES.sort()).toEqual(["council/cards/_template.md", "council/validate.py"]);
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
