import { test, expect } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { CONFIG_DIR_NAME } from "@earendil-works/pi-coding-agent";
import { PKG_ROOT } from "../extensions/seats.ts";
import { GATE_PINNED_MODEL, loadGateConfig, loadGatePolicy, loadGateQuestions } from "../extensions/gate.ts";

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
	repoCouncilFile(root, { gate: { mode: "active" } });
	repoPolicy(root, {
		policyVersion: "test-policy-9",
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
	const file = repoPolicy(root, { policyVersion: "p", model: "m", endpoint: "https://x/", bogus: 1 });
	expect(() => loadGatePolicy(root)).toThrow(
		`FAIL: ${file} has an invalid bogus — unknown key; expected one of policyVersion, model, endpoint, gateStateBudgetTokens — set a valid value or remove the key to use the packaged default`,
	);
});

// ---------------------------------------------------------------------------
// EV-73 — mode leaves policy.json: the generic unknown-key FAIL is the
// migration signal (ruling job-2 item (a); the enriched copy is EV-75's).
// ---------------------------------------------------------------------------

test("a policy.json carrying mode fires the generic unknown-key FAIL verbatim — the migration signal — even with config off", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "council-gate-"));
	repoCouncilFile(root, { gate: { mode: "off" } });
	const file = repoPolicy(root, { policyVersion: "p", mode: "advisory", model: "m", endpoint: "https://x/" });
	const msg = failOf(() => loadGatePolicy(root));
	expect(msg).toBe(
		`FAIL: ${file} has an invalid mode — unknown key; expected one of policyVersion, model, endpoint, gateStateBudgetTokens — set a valid value or remove the key to use the packaged default`,
	);
	expect(msg).not.toMatch(/\.council\.json/); // no EV-75 specialization yet
});

test("the packaged policy.json carries no mode key and still resolves off", () => {
	const packaged = JSON.parse(fs.readFileSync(path.join(PKG_ROOT, "council", "gate", "policy.json"), "utf-8"));
	expect("mode" in packaged).toBe(false);
	expect(loadGatePolicy("/nonexistent-repo-root-ev73").mode).toBe("off");
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
	const file = repoPolicy(root, { policyVersion: "p", model: "", endpoint: "https://x/" });
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
		repoCouncilFile(root, { gate: { mode: "off" } });
		repoPolicy(root, { policyVersion: "p", model: "m", endpoint: "https://x/", gateStateBudgetTokens: v });
		const msg = failOf(() => loadGatePolicy(root));
		expect(msg).toMatch(/^FAIL: .*policy\.json has an invalid gateStateBudgetTokens — expected a positive integer, found /);
		expect(msg).not.toMatch(/\n/);
	}
});

test("clause 2 re-expressed: advisory config + budget-less policy FAILs naming the RESOLVED mode; the identical policy with config off loads clean", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "council-gate-"));
	repoCouncilFile(root, { gate: { mode: "advisory" } });
	repoPolicy(root, { policyVersion: "p", model: "m", endpoint: "https://x/" });
	const msg = failOf(() => loadGatePolicy(root));
	expect(msg).toBe(
		`FAIL: ${path.join(root, CONFIG_DIR_NAME, "council", "gate", "policy.json")} has an invalid gateStateBudgetTokens — the key is absent but the resolved mode is "advisory" (an off-mode policy may omit it) — set a valid value`,
	);
	expect(msg).not.toMatch(/remove the key/);
	repoCouncilFile(root, { gate: { mode: "off" } });
	const policy = loadGatePolicy(root);
	expect(policy.mode).toBe("off");
	expect(policy.gateStateBudgetTokens).toBeUndefined();
});

test("clause 2: absent on the active path fails the same way", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "council-gate-"));
	repoCouncilFile(root, { gate: { mode: "active" } });
	repoPolicy(root, { policyVersion: "p", model: "m", endpoint: "https://x/" });
	expect(() => loadGatePolicy(root)).toThrow(/has an invalid gateStateBudgetTokens/);
});

test("absent gateStateBudgetTokens resolves cleanly on the off path and is truly absent", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "council-gate-"));
	repoCouncilFile(root, { gate: { mode: "off" } });
	repoPolicy(root, { policyVersion: "p", model: "m", endpoint: "https://x/" });
	const policy = loadGatePolicy(root);
	expect(policy.mode).toBe("off");
	expect(policy.gateStateBudgetTokens).toBeUndefined();
	expect("gateStateBudgetTokens" in policy).toBe(false);
});

test("a live-mode policy with a valid key loads with it", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "council-gate-"));
	repoCouncilFile(root, { gate: { mode: "active" } });
	repoPolicy(root, {
		policyVersion: "p",
		model: "m",
		endpoint: "https://x/",
		gateStateBudgetTokens: 32000,
	});
	const policy = loadGatePolicy(root);
	expect(policy.mode).toBe("active");
	expect(policy.gateStateBudgetTokens).toBe(32000);
});

test("the packaged default resolves off via the absent gate section and ships the budget key at 32000", () => {
	const policy = loadGatePolicy("/nonexistent-repo-root-ev64");
	expect(policy.mode).toBe("off");
	expect(policy.gateStateBudgetTokens).toBe(32000);
});

// ---------------------------------------------------------------------------
// EV-73 — loadGateConfig: the single enablement resolver from .council.json's
// reserved top-level `gate` section.
// ---------------------------------------------------------------------------

function repoCouncilFile(root: string, body: unknown): string {
	const file = path.join(root, ".council.json");
	fs.writeFileSync(file, typeof body === "string" ? body : JSON.stringify(body));
	return file;
}

test("loadGateConfig: absent .council.json, absent gate key, and gate:{} all resolve off identically", () => {
	expect(loadGateConfig("/nonexistent-repo-root-ev73")).toEqual({ mode: "off" });
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "council-gate-"));
	expect(loadGateConfig(root)).toEqual({ mode: "off" }); // file absent
	repoCouncilFile(root, { council: {} }); // file present, gate absent
	expect(loadGateConfig(root)).toEqual({ mode: "off" });
	repoCouncilFile(root, { gate: {} }); // section present, mode absent
	expect(loadGateConfig(root)).toEqual({ mode: "off" });
});

test("loadGateConfig: off, advisory, and active each resolve", () => {
	for (const mode of ["off", "advisory", "active"] as const) {
		const root = fs.mkdtempSync(path.join(os.tmpdir(), "council-gate-"));
		repoCouncilFile(root, { gate: { mode } });
		expect(loadGateConfig(root)).toEqual({ mode });
	}
});

test("loadGateConfig: a case-wrong mode FAILs naming gate.mode", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "council-gate-"));
	const file = repoCouncilFile(root, { gate: { mode: "Active" } });
	const msg = failOf(() => loadGateConfig(root));
	expect(msg).toBe(
		`FAIL: ${file} has an invalid gate.mode — expected one of "off", "advisory", "active", found "Active" — set a valid value or remove the key to use the packaged default`,
	);
	expect(msg).not.toMatch(/\n/);
});

test("loadGateConfig: a bare-string gate is refused, never coerced", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "council-gate-"));
	const file = repoCouncilFile(root, `{ "gate": "advisory" }`);
	expect(() => loadGateConfig(root)).toThrow(
		`FAIL: ${file} has an invalid gate — expected an object, found "advisory" — set a valid value or remove the key to use the packaged default`,
	);
});

test("loadGateConfig: gate null, array, and number are refused like a bare string", () => {
	for (const body of ['{ "gate": null }', '{ "gate": [] }', '{ "gate": 3 }']) {
		const root = fs.mkdtempSync(path.join(os.tmpdir(), "council-gate-"));
		const file = repoCouncilFile(root, body);
		expect(() => loadGateConfig(root)).toThrow(
			`FAIL: ${file} has an invalid gate — expected an object, found`,
		);
	}
});

test("loadGateConfig: an unknown sub-key inside gate FAILs naming gate.<key>", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "council-gate-"));
	const file = repoCouncilFile(root, { gate: { mod: "active" } });
	expect(() => loadGateConfig(root)).toThrow(
		`FAIL: ${file} has an invalid gate.mod — unknown key; expected one of mode — set a valid value or remove the key to use the packaged default`,
	);
});

test("loadGateConfig: malformed JSON throws a single FAIL line naming the file", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "council-gate-"));
	const file = repoCouncilFile(root, "{ not json\nwith a newline");
	const msg = failOf(() => loadGateConfig(root));
	expect(msg).not.toMatch(/\n/);
	expect(msg).toMatch(
		/^FAIL: .*\.council\.json has an invalid JSON — not parseable as JSON: .+ — set a valid value or remove the key to use the packaged default$/,
	);
	expect(msg).toContain(file);
});

test("transitive equality: loadGatePolicy(root).mode === loadGateConfig(root).mode", () => {
	for (const gate of [undefined, { mode: "off" }, { mode: "advisory" }, { mode: "active" }] as const) {
		const root = fs.mkdtempSync(path.join(os.tmpdir(), "council-gate-"));
		if (gate) repoCouncilFile(root, { gate });
		repoPolicy(root, {
			policyVersion: "p",
			model: GATE_PINNED_MODEL,
			endpoint: "https://x/",
			...(gate && gate.mode !== "off" ? { gateStateBudgetTokens: 32000 } : {}),
		});
		expect(loadGatePolicy(root).mode).toBe(loadGateConfig(root).mode);
	}
});

test("a malformed gate section is gate-scoped: other loaders are untouched, the throw happens at the gate read", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "council-gate-"));
	repoCouncilFile(root, '{ "gate": { "mode": "advisory" ');
	expect(() => loadGateQuestions(root)).not.toThrow(); // questions.json never reads .council.json
	expect(() => loadGatePolicy(root)).toThrow(/^FAIL: .*\.council\.json has an invalid JSON/);
});

// ---------------------------------------------------------------------------
// FLLWUP-74 — the four refusal classes in loadGateDecision (EV-73).
// ---------------------------------------------------------------------------

import { loadGateDecision } from "../extensions/gate.ts";

const repoDecision = (root: string, body: unknown): string =>
	repoGateFile(root, "decision.json", typeof body === "string" ? body : JSON.stringify(body));

const baseDecision = (): Record<string, unknown> =>
	JSON.parse(fs.readFileSync(path.join(PKG_ROOT, "council", "gate", "decision.json"), "utf-8"));

test("class 1: thresholds.verify = 0 is refused (direct keeps >= 0)", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "council-gate-"));
	const d = baseDecision();
	(d.thresholds as Record<string, unknown>).verify = 0;
	const file = repoDecision(root, d);
	const msg = failOf(() => loadGateDecision(root));
	expect(msg).toBe(
		`FAIL: ${file} has an invalid thresholds.verify — expected a finite number > 0, found 0 — set a valid value or remove the key to use the packaged default`,
	);
	// direct = 0 alone is still legal when it does not break verify <= direct
	const root2 = fs.mkdtempSync(path.join(os.tmpdir(), "council-gate-"));
	const d2 = baseDecision();
	(d2.thresholds as Record<string, unknown>).verify = 1;
	(d2.thresholds as Record<string, unknown>).direct = 1;
	expect(() => loadGateDecision(root2)).not.toThrow();
	const root3 = fs.mkdtempSync(path.join(os.tmpdir(), "council-gate-"));
	const d3 = baseDecision();
	(d3.thresholds as Record<string, unknown>).direct = 0;
	const file3 = repoDecision(root3, d3);
	expect(() => loadGateDecision(root3)).toThrow(
		`FAIL: ${file3} has an invalid thresholds — verify must be ≤ direct, found verify 2.6 > direct 0 — set a valid value or remove the key to use the packaged default`,
	);
});

test("class 2: an unknown floors or thresholds sub-key FAILs naming the parent's own allowed set", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "council-gate-"));
	const d = baseDecision();
	(d.floors as Record<string, unknown>).bogus = 0.5;
	const file = repoDecision(root, d);
	expect(() => loadGateDecision(root)).toThrow(
		`FAIL: ${file} has an invalid floors.bogus — unknown sub-key; expected one of choice, score — set a valid value or remove the key to use the packaged default`,
	);
	const root2 = fs.mkdtempSync(path.join(os.tmpdir(), "council-gate-"));
	const d2 = baseDecision();
	(d2.thresholds as Record<string, unknown>).bogus = 1;
	const file2 = repoDecision(root2, d2);
	expect(() => loadGateDecision(root2)).toThrow(
		`FAIL: ${file2} has an invalid thresholds.bogus — unknown sub-key; expected one of verify, direct — set a valid value or remove the key to use the packaged default`,
	);
});

test("class 3: an override.question absent from weights FAILs naming overrides.<i>.question", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "council-gate-"));
	const d = baseDecision();
	d.overrides = [{ question: "nope", option: "yes", basis: "b" }];
	const file = repoDecision(root, d);
	const msg = failOf(() => loadGateDecision(root));
	expect(msg).toBe(
		`FAIL: ${file} has an invalid overrides.0.question — question id "nope" is not declared in weights (expected one of reversible, publicContract, blastRadius, decidablyTestable) — set a valid value or remove the key to use the packaged default`,
	);
});

test("class 3: a prototype-key collision (toString) counts as absent from weights' OWN keys and FAILs", () => {
	// ("toString" in weights) is true via Object.prototype — the check must see
	// own keys only, or a mistyped id colliding with a prototype key loads clean.
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "council-gate-"));
	const d = baseDecision();
	d.overrides = [{ question: "toString", option: "yes", basis: "b" }];
	const file = repoDecision(root, d);
	const msg = failOf(() => loadGateDecision(root));
	expect(msg).toBe(
		`FAIL: ${file} has an invalid overrides.0.question — question id "toString" is not declared in weights (expected one of reversible, publicContract, blastRadius, decidablyTestable) — set a valid value or remove the key to use the packaged default`,
	);
	expect(msg).not.toMatch(/\n/); // single-line FAIL, per the goal's contract
	// the ordinary absent id keeps the same message shape
	const root2 = fs.mkdtempSync(path.join(os.tmpdir(), "council-gate-"));
	const d2 = baseDecision();
	d2.overrides = [{ question: "nope", option: "yes", basis: "b" }];
	const file2 = repoDecision(root2, d2);
	const msg2 = failOf(() => loadGateDecision(root2));
	expect(msg2).toBe(
		`FAIL: ${file2} has an invalid overrides.0.question — question id "nope" is not declared in weights (expected one of reversible, publicContract, blastRadius, decidablyTestable) — set a valid value or remove the key to use the packaged default`,
	);
	// the packaged decision.json still validates clean
	expect(() => loadGateDecision("/nonexistent-repo-root-ev73")).not.toThrow();
});

test("class 4: a line break in any of the three basis-rendered strings is refused with the pinned bytes, never sanitized", () => {
	for (const [key, value] of [
		["question", "reversible\n2"],
		["option", "no\rno"],
		["basis", "one-way door\nsecond line"],
	] as const) {
		const root = fs.mkdtempSync(path.join(os.tmpdir(), "council-gate-"));
		const d = baseDecision();
		(d.overrides as Array<Record<string, unknown>>)[0][key] = value;
		const file = repoDecision(root, d);
		const msg = failOf(() => loadGateDecision(root));
		expect(msg).toBe(`FAIL: ${file} has an invalid overrides.0.${key} — value contains a line break; basis lines must be single-line`);
		expect(msg).not.toMatch(/\n/);
		expect(msg).not.toContain("set a valid value"); // the tail is deliberately dropped
	}
});

test("class 4 shape checks precede the class-3 referential check within an override rule", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "council-gate-"));
	const d = baseDecision();
	d.overrides = [{ question: "undeclared\nid", option: "yes", basis: "b" }];
	repoDecision(root, d);
	// the newline defect wins over the absent-from-weights defect
	expect(() => loadGateDecision(root)).toThrow(/value contains a line break/);
});

test("the packaged decision.json validates clean under all four refusal classes", () => {
	const policy = loadGateDecision("/nonexistent-repo-root-ev73");
	expect(policy.thresholds.verify).toBeGreaterThan(0);
	expect(Object.keys(policy.floors).sort()).toEqual(["choice", "score"]);
	expect(Object.keys(policy.thresholds).sort()).toEqual(["direct", "verify"]);
	for (const o of policy.overrides) {
		expect(o.question in policy.weights).toBe(true);
		for (const v of [o.question, o.option, o.basis]) expect(v).not.toMatch(/[\r\n]/);
	}
});

// ---------------------------------------------------------------------------
// EV-73 — single-resolution-site canary (spec §6): only extensions/gate.ts
// touches .council.json's gate key; the readers keep exactly one
// loadGatePolicy call each and their off short-circuit precedes any state
// build (skeptic O5: the recheck body's precedence is TRANSITIVE via
// resolveRoute — buildGateState textually precedes its own loadGatePolicy
// there, so the transitive form is the pinned one).
// ---------------------------------------------------------------------------

test("single resolution site: only extensions/gate.ts touches .council.json's gate key; readers keep exactly one loadGatePolicy call each", () => {
	const srcOf = (name: string) => fs.readFileSync(path.join(PKG_ROOT, "extensions", name), "utf-8");
	for (const reader of ["gate-tool.ts", "gate-route-tool.ts", "gate-route.ts", "gate-run.ts"]) {
		const src = srcOf(reader);
		expect(src.match(/\.council\.json|COUNCIL_CONFIG_FILE/g), `${reader} must not read the config file directly`).toEqual(null);
	}
	for (const reader of ["gate-tool.ts", "gate-route-tool.ts", "gate-route.ts"]) {
		const src = srcOf(reader);
		const calls = src.match(/loadGatePolicy\(/g) ?? [];
		expect(calls.length, `${reader} has exactly one loadGatePolicy call site`).toBe(1);
	}
	// gate-tool.ts and gate-route.ts: loadGatePolicy textually precedes any
	// buildGateState call (the off short-circuit ordering, preserved).
	for (const reader of ["gate-tool.ts", "gate-route.ts"]) {
		const src = srcOf(reader);
		expect(src.indexOf("loadGatePolicy(")).toBeGreaterThan(-1);
		expect(src.indexOf("loadGatePolicy(")).toBeLessThan(src.indexOf("buildGateState("));
	}
	// gate-route-tool.ts recheck body: resolveRoute( precedes buildGateState(
	// inside recheck — the transitive precedence form (skeptic O5).
	const src = srcOf("gate-route-tool.ts");
	const recheck = src.slice(src.indexOf("async function recheck"));
	expect(recheck.indexOf("resolveRoute(")).toBeGreaterThan(-1);
	expect(recheck.indexOf("resolveRoute(")).toBeLessThan(recheck.indexOf("buildGateState("));
});
