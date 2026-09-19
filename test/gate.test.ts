import { test, expect } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { CONFIG_DIR_NAME } from "@earendil-works/pi-coding-agent";
import { loadGatePolicy, loadGateQuestions } from "../extensions/gate.ts";

function repoGateFile(root: string, name: string, body: string): string {
	const dir = path.join(root, CONFIG_DIR_NAME, "council", "gate");
	fs.mkdirSync(dir, { recursive: true });
	const file = path.join(dir, name);
	fs.writeFileSync(file, body);
	return file;
}

const repoPolicy = (root: string, body: unknown) =>
	repoGateFile(root, "policy.json", typeof body === "string" ? body : JSON.stringify(body));

test("absent repo file yields the packaged default with a non-empty policyVersion and the pinned model", () => {
	const policy = loadGatePolicy("/nonexistent-repo-root-ev62");
	expect(policy.policyVersion.length).toBeGreaterThan(0);
	expect(policy.model).toBe("typesafe/jev-1.13");
	expect(policy.endpoint).toBe("https://openrouter.ai/api/alpha/decisions");
});

test("the resolved default model id is never the alias", () => {
	const policy = loadGatePolicy("/nonexistent-repo-root-ev62");
	expect(policy.model).not.toContain("~typesafe/jev-latest");
});

test("the packaged default ships mode off (R3: no gate call, no ledger line)", () => {
	expect(loadGatePolicy("/nonexistent-repo-root-ev62").mode).toBe("off");
});

test("a repo-local policy.json shadows the packaged default whole-file", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "council-gate-"));
	repoPolicy(root, {
		policyVersion: "test-policy-9",
		mode: "active",
		model: "typesafe/jev-1.13-test",
		endpoint: "https://example.test/decisions",
		gateStateBudgetTokens: 32000,
	});
	expect(loadGatePolicy(root)).toEqual({
		policyVersion: "test-policy-9",
		mode: "active",
		model: "typesafe/jev-1.13-test",
		endpoint: "https://example.test/decisions",
		gateStateBudgetTokens: 32000,
	});
});

test("an absent mode key resolves to off, not to the packaged file's literal mode", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "council-gate-"));
	repoPolicy(root, {
		policyVersion: "test-policy-9",
		model: "typesafe/jev-1.13-test",
		endpoint: "https://example.test/decisions",
	});
	expect(loadGatePolicy(root).mode).toBe("off");
});

test("a malformed repo policy throws a single FAIL line naming the file", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "council-gate-"));
	repoPolicy(root, "{ not json\nwith a newline");
	let msg = "";
	try {
		loadGatePolicy(root);
	} catch (e) {
		msg = (e as Error).message;
	}
	expect(msg).not.toMatch(/\n/);
	expect(msg).toMatch(
		new RegExp(
			`^FAIL: ${root.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/${CONFIG_DIR_NAME}/council/gate/policy\\.json has an invalid JSON — not parseable as JSON: .+ — set a valid value or remove the key to use the packaged default$`,
		),
	);
});

test("an unknown key throws the FAIL line naming the key", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "council-gate-"));
	const file = repoPolicy(root, { policyVersion: "p", mode: "off", model: "m", endpoint: "https://x/", bogus: 1 });
	expect(() => loadGatePolicy(root)).toThrow(
		`FAIL: ${file} has an invalid bogus — unknown key; expected one of mode, policyVersion, model, endpoint, gateStateBudgetTokens — set a valid value or remove the key to use the packaged default`,
	);
});

test("an invalid mode value throws the FAIL line naming the key and what was found", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "council-gate-"));
	const file = repoPolicy(root, { policyVersion: "p", mode: "on", model: "m", endpoint: "https://x/" });
	expect(() => loadGatePolicy(root)).toThrow(
		`FAIL: ${file} has an invalid mode — expected one of "off", "advisory", "active", found "on" — set a valid value or remove the key to use the packaged default`,
	);
});

test("packaged question set loads with a version and well-typed questions", () => {
	const qs = loadGateQuestions("/nonexistent-repo-root-ev62");
	expect(qs.version.length).toBeGreaterThan(0);
	expect(Object.keys(qs.questions).length).toBeGreaterThan(0);
	for (const q of Object.values(qs.questions)) {
		expect(["choice", "noul", "score"]).toContain(q.type);
	}
});

test("a repo-local questions.json shadows the packaged set whole-file", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "council-gate-"));
	repoGateFile(root, "questions.json", JSON.stringify({
		version: "test-questions-9",
		questions: {
			probe: { type: "noul", instructions: "Probe.", criteria: { yes: "Yes.", no: "No." } },
		},
	}));
	const qs = loadGateQuestions(root);
	expect(qs.version).toBe("test-questions-9");
	expect(Object.keys(qs.questions)).toEqual(["probe"]);
});

test("a malformed repo questions.json throws a single FAIL line naming the file", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "council-gate-"));
	const file = repoGateFile(root, "questions.json", "{");
	let msg = "";
	try {
		loadGateQuestions(root);
	} catch (e) {
		msg = (e as Error).message;
	}
	expect(msg).not.toMatch(/\n/);
	expect(msg).toMatch(
		new RegExp(
			`^FAIL: ${file.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} has an invalid JSON — not parseable as JSON: .+ — set a valid value or remove the key to use the packaged default$`,
		),
	);
});

test("an empty questions record is an invalid value, not a vacuous pass", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "council-gate-"));
	const file = repoGateFile(root, "questions.json", JSON.stringify({ version: "v", questions: {} }));
	expect(() => loadGateQuestions(root)).toThrow(
		`FAIL: ${file} has an invalid questions — expected at least one question, found 0 — set a valid value or remove the key to use the packaged default`,
	);
});

test("a question with an empty criteria record throws the FAIL line", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "council-gate-"));
	const file = repoGateFile(root, "questions.json", JSON.stringify({
		version: "v",
		questions: { probe: { type: "choice", instructions: "Probe.", criteria: {} } },
	}));
	expect(() => loadGateQuestions(root)).toThrow(
		`FAIL: ${file} has an invalid questions.probe.criteria — expected at least one criterion, found 0 — set a valid value or remove the key to use the packaged default`,
	);
});

test("an unknown question type throws the FAIL line naming the nested key", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "council-gate-"));
	const file = repoGateFile(root, "questions.json", JSON.stringify({
		version: "v",
		questions: { probe: { type: "yesno", instructions: "Probe.", criteria: { yes: "y", no: "n" } } },
	}));
	expect(() => loadGateQuestions(root)).toThrow(
		`FAIL: ${file} has an invalid questions.probe.type — expected one of "choice", "noul", "score", found "yesno" — set a valid value or remove the key to use the packaged default`,
	);
});

test("a score question with object criteria throws the FAIL line", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "council-gate-"));
	const file = repoGateFile(root, "questions.json", JSON.stringify({
		version: "v",
		questions: { probe: { type: "score", instructions: "Probe.", criteria: { a: "A" } } },
	}));
	expect(() => loadGateQuestions(root)).toThrow(
		`FAIL: ${file} has an invalid questions.probe.criteria — expected an ordered array of criterion strings, found an object — set a valid value or remove the key to use the packaged default`,
	);
});

test("an invalid empty model value throws the FAIL line naming the key", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "council-gate-"));
	const file = repoPolicy(root, { policyVersion: "p", mode: "off", model: "", endpoint: "https://x/" });
	expect(() => loadGatePolicy(root)).toThrow(
		`FAIL: ${file} has an invalid model — expected a non-empty string, found "" — set a valid value or remove the key to use the packaged default`,
	);
});

// ---------------------------------------------------------------------------
// EV-64 — gateStateBudgetTokens (PO ruling Q1, three binding clauses).
// ---------------------------------------------------------------------------

const failOf = (run: () => unknown): string => {
	try {
		run();
	} catch (e) {
		return (e as Error).message;
	}
	throw new Error("expected a throw");
};

test("clause 1: a present gateStateBudgetTokens is validated in every mode — off included", () => {
	for (const v of [0, -1, 1.5, "32k"]) {
		const root = fs.mkdtempSync(path.join(os.tmpdir(), "council-gate-"));
		repoPolicy(root, { policyVersion: "p", mode: "off", model: "m", endpoint: "https://x/", gateStateBudgetTokens: v });
		const msg = failOf(() => loadGatePolicy(root));
		expect(msg).toMatch(/^FAIL: .*policy\.json has an invalid gateStateBudgetTokens — expected a positive integer, found /);
		expect(msg).not.toMatch(/\n/);
	}
});

test("clause 2: absent gateStateBudgetTokens FAILs on the advisory path, without the remove-the-key advice", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "council-gate-"));
	repoPolicy(root, { policyVersion: "p", mode: "advisory", model: "m", endpoint: "https://x/" });
	const msg = failOf(() => loadGatePolicy(root));
	expect(msg).toBe(
		`FAIL: ${path.join(root, CONFIG_DIR_NAME, "council", "gate", "policy.json")} has an invalid gateStateBudgetTokens — the key is absent but the resolved mode is "advisory" (an off-mode policy may omit it) — set a valid value`,
	);
	expect(msg).not.toMatch(/remove the key/);
});

test("clause 2: absent on the active path fails the same way", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "council-gate-"));
	repoPolicy(root, { policyVersion: "p", mode: "active", model: "m", endpoint: "https://x/" });
	expect(() => loadGatePolicy(root)).toThrow(/has an invalid gateStateBudgetTokens/);
});

test("absent gateStateBudgetTokens resolves cleanly on the off path and is truly absent", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "council-gate-"));
	repoPolicy(root, { policyVersion: "p", mode: "off", model: "m", endpoint: "https://x/" });
	const policy = loadGatePolicy(root);
	expect(policy.mode).toBe("off");
	expect(policy.gateStateBudgetTokens).toBeUndefined();
	expect("gateStateBudgetTokens" in policy).toBe(false);
});

test("a live-mode policy with a valid key loads with it", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "council-gate-"));
	repoPolicy(root, {
		policyVersion: "p",
		mode: "active",
		model: "m",
		endpoint: "https://x/",
		gateStateBudgetTokens: 32000,
	});
	const policy = loadGatePolicy(root);
	expect(policy.mode).toBe("active");
	expect(policy.gateStateBudgetTokens).toBe(32000);
});

test("the packaged default ships mode off and the budget key at 32000", () => {
	const policy = loadGatePolicy("/nonexistent-repo-root-ev64");
	expect(policy.mode).toBe("off");
	expect(policy.gateStateBudgetTokens).toBe(32000);
});
