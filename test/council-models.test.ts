import { test, expect } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { CONFIG_DIR_NAME } from "@earendil-works/pi-coding-agent";
import { resolveCatalogue, type CatalogueModel } from "../extensions/catalogue.ts";
import { COUNCIL_CONFIG_FILE, loadCouncilConfig, loadSeat, listSeatNames } from "../extensions/seats.ts";
import {
	USAGE_LINE,
	LISTING_HEADER,
	applySeatSelection,
	buildProviderDisplayNames,
	modelsNotifyLine,
	runHeadless,
} from "../extensions/council-models.ts";
import type { SeatModelSelection } from "../extensions/model-picker.ts";
import { writeSeatOverride } from "../extensions/council-config-writer.ts";

const NO_ANSI = /[\u001b]/;
const NO_HEX = /#[0-9a-fA-F]{3,8}/;

/** Fake registry snapshot — structurally assignable to getAvailable() output. */
const MODELS: CatalogueModel[] = [
	{
		provider: "openrouter",
		id: "deepseek/deepseek-v4-flash-0731",
		name: "DeepSeek V4 Flash (0731)",
		reasoning: true,
		thinkingLevelMap: { off: "off", high: "high" },
	},
	{ provider: "openrouter", id: "qwen/qwen3.6-35b-a3b", name: "Qwen 3.6 35B A3B", reasoning: true, thinkingLevelMap: { low: "low" } },
	{ provider: "xai", id: "grok/v1", name: "Grok V1", reasoning: false },
];
const DISPLAY = { openrouter: "OpenRouter", xai: "xAI" };

const FLASH = "openrouter/deepseek/deepseek-v4-flash-0731";
const QWEN = "openrouter/qwen/qwen3.6-35b-a3b";

function makeRepo(files: Record<string, string> = {}): string {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ev25-models-"));
	for (const [rel, content] of Object.entries(files)) {
		const p = path.join(dir, rel);
		fs.mkdirSync(path.dirname(p), { recursive: true });
		fs.writeFileSync(p, content);
	}
	return dir;
}

/** A repo-local seat shadowing the packaged one with knowable frontmatter. */
function seatFile(name: string, model: string): string {
	return ["---", `name: ${name}`, "description: test seat", `model: ${model}`, "---", "body", ""].join("\n");
}

/** Run the headless grammar, returning the exact emitted text. */
function run(args: string, repo: string): string {
	const out: string[] = [];
	runHeadless(args, repo, MODELS, DISPLAY, (line) => out.push(line));
	return out.join("\n");
}

function cfg(repo: string): string {
	return fs.readFileSync(path.join(repo, COUNCIL_CONFIG_FILE), "utf-8");
}

// ---- headless handler-write path (acceptance 1) ----

test("H1: no args → R-2 usage block + full per-seat listing (all frontmatter-default lines)", () => {
	const repo = makeRepo();
	const text = run("", repo);
	const lines = text.split("\n");
	expect(lines.slice(0, 3)).toEqual([USAGE_LINE, "", LISTING_HEADER]);
	for (const l of lines.slice(3)) {
		expect(l).toMatch(/^[a-z0-9-]+: frontmatter default$/);
	}
	expect(lines.length - 3).toBe(listSeatNames(repo).length);
	expect(text).toContain("owner: frontmatter default");
});

test("H1b: override seats render `<seat>: <model>[:thinking] (override)` byte-exact", () => {
	const repo = makeRepo({
		[COUNCIL_CONFIG_FILE]: JSON.stringify({
			council: { owner: { model: FLASH, thinking: "high" }, skeptic: FLASH },
		}),
	});
	const text = run("", repo);
	expect(text).toContain("owner: openrouter/deepseek/deepseek-v4-flash-0731:high (override)");
	expect(text).toContain("skeptic: openrouter/deepseek/deepseek-v4-flash-0731 (override)");
	expect(text).toContain("consolidator: frontmatter default");
});

test("H2: <seat> → that seat's current line plus the usage line", () => {
	const repo = makeRepo({
		[COUNCIL_CONFIG_FILE]: JSON.stringify({ council: { owner: { model: FLASH, thinking: "low" } } }),
	});
	const text = run("owner", repo);
	expect(text).toBe([USAGE_LINE, "", LISTING_HEADER, "owner: openrouter/deepseek/deepseek-v4-flash-0731:low (override)"].join("\n"));
});

test("H3: <seat> <provider>/<model>[:thinking] → validates, writes, R-3 notify byte-exact", () => {
	const repo = makeRepo();
	const text = run(`owner ${FLASH}:high`, repo);
	expect(text).toBe(
		"council-models: wrote owner → openrouter/deepseek/deepseek-v4-flash-0731:high in .council.json — takes effect at the next dispatch.",
	);
	expect(JSON.parse(cfg(repo)).council.owner).toEqual({ model: FLASH, thinking: "high" });
});

test("H3b: a level-less write notifies without a :suffix and writes no thinking key", () => {
	const repo = makeRepo();
	const text = run(`owner ${FLASH}`, repo);
	expect(text).toBe(
		"council-models: wrote owner → openrouter/deepseek/deepseek-v4-flash-0731 in .council.json — takes effect at the next dispatch.",
	);
	expect(JSON.parse(cfg(repo)).council.owner).toEqual({ model: FLASH });
});

test("H4: unknown seat → error, nothing written (write form and listing form)", () => {
	const repo = makeRepo();
	const text = run(`nosuch ${FLASH}`, repo);
	expect(text).toContain("[council-models] error:");
	expect(text).toContain('Unknown seat "nosuch"');
	expect(fs.existsSync(path.join(repo, COUNCIL_CONFIG_FILE))).toBe(false);
	expect(run("nosuch", repo)).toContain("[council-models] error:");
});

test("H5: model not in the catalogue → error, nothing written", () => {
	const repo = makeRepo();
	const text = run(`owner openrouter/nope/never`, repo);
	expect(text).toContain("[council-models] error:");
	expect(text).toContain("not in the available model catalogue");
	expect(fs.existsSync(path.join(repo, COUNCIL_CONFIG_FILE))).toBe(false);
});

test("H6: unqualified model → error, nothing written", () => {
	const repo = makeRepo();
	const text = run("owner just-a-model", repo);
	expect(text).toContain("[council-models] error:");
	expect(text).toContain("must be qualified as provider/id");
	expect(fs.existsSync(path.join(repo, COUNCIL_CONFIG_FILE))).toBe(false);
});

test("H7: more than two args → error, nothing written", () => {
	const repo = makeRepo();
	const text = run(`owner ${FLASH} extra`, repo);
	expect(text).toContain("[council-models] error:");
	expect(text).toContain("unexpected arguments");
	expect(fs.existsSync(path.join(repo, COUNCIL_CONFIG_FILE))).toBe(false);
});

test("display names: buildProviderDisplayNames maps each provider through the registry once", () => {
	const seen: string[] = [];
	const names = buildProviderDisplayNames(
		{ getProviderDisplayName: (p) => (seen.push(p), p.toUpperCase()) },
		MODELS,
	);
	expect(names).toEqual({ openrouter: "OPENROUTER", xai: "XAI" });
	expect(seen).toEqual(["openrouter", "xai"]);
});

// ---- modal-picker-to-writer wiring path, modal mocked at its contract (acceptance 2) ----

test("W1: non-null selection → writeSeatOverride exactly once with the SAME snapshot array feeding resolveCatalogue", () => {
	const repo = makeRepo();
	const rawSeats = listSeatNames(repo).map((n) => loadSeat(repo, n));
	const resolved = resolveCatalogue(MODELS, DISPLAY, rawSeats, loadCouncilConfig(repo));
	const listed = resolved.providers.flatMap((g) => g.models).map((m) => m.qualifiedId);
	const sel: SeatModelSelection = { seat: "owner", model: FLASH };

	const calls: Array<Parameters<typeof writeSeatOverride>[0]> = [];
	const spy: typeof writeSeatOverride = (a) => {
		calls.push(a);
		return { ok: true };
	};
	const out = applySeatSelection(repo, MODELS, sel, spy);
	expect(calls).toHaveLength(1);
	expect(calls[0].catalogue).toBe(MODELS); // SAME array reference — listing guarantees writability
	expect(calls[0].seat).toBe("owner");
	expect(calls[0].model).toBe(FLASH);
	expect(calls[0].thinking).toBeUndefined();
	expect(listed).toContain(FLASH); // the pick is in the SAME snapshot the modal listed
	// spy wrote nothing: the notify still derives from the on-disk read-back, whatever it is
	expect(out.notified).toBe(modelsNotifyLine("owner", loadSeat(repo, "owner")));
});

test("W2: notify derives from the POST-WRITE file read-back — a level-less pick over a preserved-thinking override names the preserved level", () => {
	const repo = makeRepo({
		[COUNCIL_CONFIG_FILE]: JSON.stringify({ council: { owner: { model: QWEN, thinking: "low" } } }),
	});
	const out = applySeatSelection(repo, MODELS, { seat: "owner", model: FLASH });
	expect(out.error).toBeNull();
	// the selection carried no thinking, but the merged file keeps low — the notify names what is on disk
	expect(out.notified).toBe(
		"council-models: wrote owner → openrouter/deepseek/deepseek-v4-flash-0731:low in .council.json — takes effect at the next dispatch.",
	);
	expect(JSON.parse(cfg(repo)).council.owner).toEqual({ model: FLASH, thinking: "low" });
});

test("W3: object-form :suffix override — the notify names only what the post-write file actually carries (seam-honest)", () => {
	// FLLWUP-10 seam (NOT fixed in this card): an object-form model carrying a
	// :suffix with no thinking key drops the level on a level-less write. The
	// notify must track the on-disk truth, never the pre-write level.
	const repo = makeRepo({
		[path.join(CONFIG_DIR_NAME, "agents", "owner.md")]: seatFile("owner", "openrouter/base/x"),
		[COUNCIL_CONFIG_FILE]: JSON.stringify({ council: { owner: { model: `${QWEN}:low` } } }),
	});
	const out = applySeatSelection(repo, MODELS, { seat: "owner", model: FLASH });
	expect(out.error).toBeNull();
	expect(out.notified).toBe(modelsNotifyLine("owner", loadSeat(repo, "owner")));
	expect(out.notified).not.toContain(":low"); // the dropped level is never claimed
	expect(JSON.parse(cfg(repo)).council.owner).toEqual({ model: FLASH }); // on-disk truth
});

test("W4: null selection → no write, no notify, no error", () => {
	const repo = makeRepo();
	let called = 0;
	const out = applySeatSelection(repo, MODELS, null, () => {
		called++;
		return { ok: true };
	});
	expect(called).toBe(0);
	expect(out).toEqual({ notified: null, error: null });
});

// ---- registration / source assertions (acceptance 3) ----

test("registration: index.ts registers /council-models wired to the pure module (house pattern)", () => {
	const src = fs.readFileSync(path.join(import.meta.dir, "..", "extensions", "index.ts"), "utf-8");
	expect(src).toContain('pi.registerCommand("council-models"');
	expect(src).toMatch(/modelRegistry\.getAvailable\(\)/); // single snapshot in the handler
	expect(src).toMatch(/ctx\.modelRegistry\.refresh\(\)/);
	expect(src).toMatch(/openModelPicker\(/);
	expect(src).toMatch(/runHeadless\(/);
	expect(src).toMatch(/applySeatSelection\(/);
	const idx = src.indexOf('pi.registerCommand("council-models"');
	const next = src.indexOf("pi.registerCommand", idx + 10);
	const block = src.slice(idx, next === -1 ? src.length : next);
	expect(block).toMatch(/getAvailable\(\)/); // the snapshot sits in the handler's own block
});

test("source audit: council-models.ts emits plain text — no ANSI, no literal #hex (9.6)", () => {
	const src = fs.readFileSync(path.join(import.meta.dir, "..", "extensions", "council-models.ts"), "utf-8");
	const code = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
	expect(code).not.toMatch(NO_ANSI);
	expect(code).not.toMatch(NO_HEX);
	const notify = modelsNotifyLine("owner", { model: "openrouter/a/b", thinkingLevel: "high" });
	expect(USAGE_LINE).not.toMatch(NO_ANSI);
	expect(notify).not.toMatch(NO_ANSI);
	expect(notify).not.toMatch(NO_HEX);
});