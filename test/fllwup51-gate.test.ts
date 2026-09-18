/**
 * FLLWUP-51 — the loader refuses a structurally broken frontmatter block.
 *
 * R1–R12 per docs/superpowers/specs/2026-09-18-FLLWUP-51-design.md §6.
 * The gate is `parse_frontmatter`'s own raise (FrontmatterError), never a
 * `main()` bolt-on: R2′ is the anti-bolt-on discriminator. The positional
 * raw-line rule (only blank lines and the closing `---` may follow `goal`)
 * carries no key vocabulary; the green pins R7 (extra intentional key
 * before `goal:`) and R10 (mid-block colon-bearing continuation of a
 * non-goal key) encode the withdrawn unknown-key FAIL and the documented
 * residual. FAIL copy echoes the procedure vocabulary {wrap, second line,
 * line break, value} (PO item 3.5, pinned by R11) and quotes the offending
 * line (PO 3.1); one structural FAIL per card (PO 3.4, pinned by R12).
 *
 * R5′ scope note: the `^goal:` → `^---$` scan is scoped to each file's
 * *leading* frontmatter block — the design's positional predicate is
 * leading-block-only (§2: body-embedded fences in FLLWUP-47/49 are never
 * scanned, and their bodies legitimately quote `goal:`-shaped example
 * lines), so a whole-file scan would contradict the design it pins.
 */
import { test, expect } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { spawnSync } from "node:child_process";
import { PKG_ROOT } from "../extensions/seats.ts";
import { sha256Tree } from "../extensions/eval-fixtures.ts";

const VOCAB = ["wrap", "second line", "line break", "value"];

/** Temp council tree: validate.py copied byte-identically, a minimal board,
 * and one card written verbatim from `cardText`. */
function rawTree(cardText: string): string {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "fllwup51-"));
	fs.mkdirSync(path.join(root, "council", "cards"), { recursive: true });
	fs.copyFileSync(
		path.join(PKG_ROOT, "council", "validate.py"),
		path.join(root, "council", "validate.py"),
	);
	fs.writeFileSync(path.join(root, "council", "cards", "EV-901.md"), cardText);
	fs.writeFileSync(
		path.join(root, "council", "board.md"),
		"# Board\n\n## Backlog\n\n- EV-901 — Test card\n",
	);
	return root;
}

/** Standard six-key card (goal lines passed verbatim, so wraps are expressible). */
function card(...goalLines: string[]): string {
	return [
		"---",
		"id: EV-901",
		"title: Test card",
		"state: Backlog",
		"owner: null",
		"epic: null",
		...goalLines,
		"---",
		"",
		"## Intent",
		"",
		"minimal",
		"",
	].join("\n");
}

function tree(...goalLines: string[]): string {
	return rawTree(card(...goalLines));
}

function runValidate(root: string): { status: number; stdout: string } {
	const res = spawnSync("python3", [path.join(root, "council", "validate.py")], {
		encoding: "utf-8",
	});
	return { status: res.status ?? -1, stdout: res.stdout ?? "" };
}

/** Direct one-arg `parse_frontmatter` call. Reports the subprocess outcome
 * without throwing, so a raise can be distinguished from a return: stdout
 * "FrontmatterError" means parse_frontmatter raised; "parsed" means it
 * returned (the silent-truncation path); any other status is a harness crash. */
function parseRaw(fmText: string): { status: number; stdout: string; stderr: string } {
	const script = [
		"import importlib.util, sys",
		'spec = importlib.util.spec_from_file_location("v", sys.argv[1])',
		"m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)",
		"try:",
		"    m.parse_frontmatter(sys.argv[2])",
		'    print("parsed")',
		"except m.FrontmatterError:",
		'    print("FrontmatterError")',
	].join("\n");
	const res = spawnSync(
		"python3",
		["-c", script, path.join(PKG_ROOT, "council", "validate.py"), fmText],
		{ encoding: "utf-8" },
	);
	return { status: res.status ?? -1, stdout: res.stdout ?? "", stderr: res.stderr ?? "" };
}

// ---- R1: wrapped bare continuation after `goal` is refused, naming the wrap ----

test("R1: wrapped goal refuses with a FAIL naming the wrap and quoting the line", () => {
	const { status, stdout } = runValidate(tree("goal: first part", " second part"));
	expect(status).toBe(1);
	const failLine = stdout.split("\n").find((l) => l.startsWith("FAIL: EV-901: frontmatter line"));
	expect(failLine).toBeDefined();
	expect(failLine).toContain("wrapped");
	expect(failLine).toContain("second part");
	// not merely the missing-key class (spec: "not merely missing required key")
	expect(failLine).not.toBe("FAIL: EV-901: missing required key 'goal'");
});

// ---- R2′ (anti-bolt-on): parse_frontmatter itself raises ----

test("R2′: parse_frontmatter raises on the wrapped blob — never a truncated dict", () => {
	const res = parseRaw("---\ngoal: first part\n second part\n---\n");
	expect(res.stdout.trim()).toBe("FrontmatterError");
});

// ---- R3: the wrap diagnostic is not reduced to the missing-key report ----

test("R3: wrap + duplicate `epic: null` after it — the diagnostic names the wrap", () => {
	const { status, stdout } = runValidate(
		tree("goal: first part", " second part", "epic: null"),
	);
	expect(status).toBe(1);
	// the bare continuation fires the bare-line predicate first; its message
	// names the wrap (a wrapped/continued value) and quotes the offending line
	const failLine = stdout.split("\n").find((l) => l.startsWith("FAIL: EV-901: frontmatter line"));
	expect(failLine).toBeDefined();
	expect(failLine).toContain("wrapped");
	expect(failLine).toContain("second part");
	// the diagnosis is structural, not reduced to the missing-key class
	expect(stdout).toContain("is not 'key: value'");
});

// ---- R4a (control): colon-bearing continuation is key-after-goal, not unknown-key ----

test("R4a: ` Rate limited: try again later` after goal refuses via the positional rule", () => {
	const { status, stdout } = runValidate(
		tree("goal: retry when the message is", " Rate limited: try again later"),
	);
	expect(status).toBe(1);
	const failLine = stdout.split("\n").find((l) => l.startsWith("FAIL: EV-901: frontmatter line"));
	expect(failLine).toBeDefined();
	expect(failLine).toContain("after 'goal'");
	expect(failLine).toContain("Rate limited: try again later");
	expect(stdout).not.toContain("unknown key");
});

// ---- R4b (the discriminator): duplicate-goal overwrite is refused ----

test("R4b: ` goal: field is wrapped is refused` after `goal:` refuses (was silent exit 0)", () => {
	const { status, stdout } = runValidate(
		tree("goal: a card whose", " goal: field is wrapped is refused"),
	);
	expect(status).toBe(1);
	const failLine = stdout.split("\n").find((l) => l.startsWith("FAIL: EV-901: frontmatter line"));
	expect(failLine).toBeDefined();
	expect(failLine).toContain("after 'goal'");
});

// ---- R5′: positional invariant on all shipped leading blocks + full-tree green ----

/** Leading frontmatter block of a markdown file (first `---` up to the next). */
function leadingBlock(lines: string[]): string[] {
	if (lines[0]?.trim() !== "---") return [];
	const block: string[] = [];
	for (const line of lines.slice(1)) {
		if (line.trim() === "---") break;
		block.push(line);
	}
	return block;
}

function mdFilesUnder(dir: string): string[] {
	const out: string[] = [];
	const walk = (d: string) => {
		for (const e of fs.readdirSync(d, { withFileTypes: true })) {
			const p = path.join(d, e.name);
			if (e.isDirectory()) walk(p);
			else if (e.name.endsWith(".md")) out.push(p);
		}
	};
	if (fs.existsSync(dir)) walk(dir);
	return out;
}

test("R5′: every leading-block `goal:` line in shipped card trees is followed by the closing `---`", () => {
	const trees = [
		path.join(PKG_ROOT, "council", "cards"),
		path.join(PKG_ROOT, "council", "scaffold", "council", "cards"),
		...fs
			.readdirSync(path.join(PKG_ROOT, "council", "fixtures"))
			.map((t) => path.join(PKG_ROOT, "council", "fixtures", t, "seed", "council")),
	];
	const violations: string[] = [];
	for (const treeDir of trees) {
		for (const f of mdFilesUnder(treeDir)) {
			const lines = fs.readFileSync(f, "utf-8").split("\n");
			const block = leadingBlock(lines);
			block.forEach((line, i) => {
				if (line.startsWith("goal:")) {
					const rest = block.slice(i + 1);
					const nextNonBlank = rest.find((l) => l.trim() !== "");
					if (nextNonBlank !== undefined && nextNonBlank.trim() !== "---") {
						violations.push(`${f}: line after goal: ${JSON.stringify(nextNonBlank)}`);
					}
				}
			});
		}
	}
	expect(violations).toEqual([]);
});

test("R5′: full-tree green run — all cards, 8 seeds, smoke fixture, body fences included", () => {
	const res = spawnSync("python3", [path.join(PKG_ROOT, "council", "validate.py")], {
		encoding: "utf-8",
	});
	expect(res.status).toBe(0);
	expect(res.stdout).toContain("All council artifacts valid");
});

// ---- R7 (green pin): an intentional extra key before `goal:` parses clean ----

test("R7: `labels: x` before goal, single-line goal → exit 0 (no unknown-key FAIL)", () => {
	const { status, stdout } = runValidate(tree("labels: x", "goal: a single line goal"));
	expect(status).toBe(0);
	expect(stdout).toContain("All council artifacts valid");
});

// ---- R8: unclosed block, both fail shapes + PO item 4's pinned residual ----

test("R8a: unclosed block, keys to EOF → exit 1 with the distinct 'not closed' message", () => {
	const { status, stdout } = runValidate(
		rawTree(
			[
				"---",
				"id: EV-901",
				"title: Test card",
				"state: Backlog",
				"owner: null",
				"epic: null",
				"goal: a single line goal",
			].join("\n"),
		),
	);
	expect(status).toBe(1);
	expect(stdout).toContain("frontmatter block is not closed");
});

test("R8b: unclosed block with bare body → exit 1 with the both-hypotheses message", () => {
	const { status, stdout } = runValidate(
		rawTree(
			[
				"---",
				"id: EV-901",
				"title: Test card",
				"state: Backlog",
				"owner: null",
				"epic: null",
				"goal: a single line goal",
				"",
				"Some prose body line.",
			].join("\n"),
		),
	);
	expect(status).toBe(1);
	const failLine = stdout.split("\n").find((l) => l.startsWith("FAIL: EV-901: frontmatter line"));
	expect(failLine).toBeDefined();
	expect(failLine).toContain("wrapped/continued value, or the closing '---' is missing");
});

test("R8c (PO item 4 residual): unclosed leading block + body line 1 bare `---` → exit 0 with all 6 keys", () => {
	const { status, stdout } = runValidate(
		rawTree(
			[
				"---",
				"id: EV-901",
				"title: Test card",
				"state: Backlog",
				"owner: null",
				"epic: null",
				"goal: a single line goal",
				"---",
				"",
				"body starting with a bare fence above",
			].join("\n"),
		),
	);
	expect(status).toBe(0);
	expect(stdout).toContain("All council artifacts valid");
});

// ---- R9 (T4 preservation): raise path feeds partial_meta into REQUIRED_KEYS ----

test("R9: `goal:no-space-after-key` still prints `missing required key 'goal'`", () => {
	const { status, stdout } = runValidate(tree("goal:no-space-after-key"));
	expect(status).toBe(1);
	expect(stdout).toContain("missing required key 'goal'");
});

// ---- R10 (residual pin): mid-block colon-bearing continuation of a non-goal key ----

test("R10: ` queue: …` wrapping a non-goal key mid-block stays silent (documented residual)", () => {
	const { status, stdout } = runValidate(
		tree(" queue: continuation of owner", "goal: a single line goal"),
	);
	expect(status).toBe(0);
	expect(stdout).toContain("All council artifacts valid");
});

// ---- R11 (vocabulary echo pin, PO item 3.5) ----

test("R11: every structural FAIL contains ≥1 of {wrap, second line, line break, value}", () => {
	const shapes = [
		tree("goal: first part", " second part"),
		tree("goal: retry when the message is", " Rate limited: try again later"),
		rawTree(
			[
				"---",
				"id: EV-901",
				"title: Test card",
				"state: Backlog",
				"owner: null",
				"epic: null",
				"goal: a single line goal",
			].join("\n"),
		),
	];
	for (const root of shapes) {
		const { stdout } = runValidate(root);
		const structural = stdout
			.split("\n")
			.filter((l) => l.startsWith("FAIL:") && l.includes("frontmatter"));
		expect(structural.length).toBeGreaterThan(0);
		for (const line of structural) {
			expect(VOCAB.some((v) => line.includes(v)), `vocabulary echo in: ${line}`).toBe(true);
		}
	}
});

// ---- R12 (one structural FAIL per card, PO item 3.4) ----

test("R12: unclosed-with-bare-body emits the bare-line FAIL and not the 'not closed' message", () => {
	const { status, stdout } = runValidate(
		rawTree(
			[
				"---",
				"id: EV-901",
				"title: Test card",
				"state: Backlog",
				"owner: null",
				"epic: null",
				"goal: a single line goal",
				"",
				"Some prose body line.",
			].join("\n"),
		),
	);
	expect(status).toBe(1);
	expect(stdout).toContain("is not 'key: value'");
	expect(stdout).not.toContain("frontmatter block is not closed");
});
