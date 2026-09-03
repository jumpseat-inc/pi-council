/**
 * EV-18 — eval fixture loader, schema validators, and the pure rulings engine.
 *
 * Data lives in `council/fixtures/<task>/` (packaged default at PKG_ROOT) with
 * repo-local override at `<repo>/$CONFIG_DIR_NAME/council/fixtures/<task>/`
 * (whole-task-dir first-hit, mirroring seatDirs/proceduresDir). The loader is
 * read-only w.r.t. repoRoot: it verifies the packaged seed's pinned treeDigest
 * at every load and refuses seeds that smuggle model/config pins (the §1
 * cell-invariance contract). `applyRulings` is a pure finite matcher over a
 * normalized cell-state view — no I/O. EV-19 imports `validateRubric` and the
 * rubric/policy schema from here (one authority, no drift window); EV-20 reads
 * `fixtureVersion`/`rubricVersion` and executes the `then` acts per gateId.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { createHash } from "node:crypto";
import { CONFIG_DIR_NAME } from "@earendil-works/pi-coding-agent";
import { PKG_ROOT, loadSeat, parseQualifiedModel } from "./seats.ts";

// ---- frozen schema constants ----

const SCHEMA_VERSION = 1;
const TASK_ID_RE = /^[a-z0-9][a-z0-9-]*$/;
const SEMVER_RE = /^\d+\.\d+\.\d+$/;
const DIGEST_RE = /^sha256:[0-9a-f]{64}$/;
const JOB_STATES = new Set(["done", "stalled", "timeout"]);
const VERDICTS = new Set(["approve", "hold", "answer"]);
const THEN_VOCAB = new Set(["merge", "skip", "answer"]);
const CONDITION_KINDS = new Set(["job-state", "report-contains", "board-column", "file-exists", "file-contains"]);

// ---- public types ----

export type FixtureTarget =
	| { type: "procedure"; command: string; arguments: string[] }
	| { type: "seat"; seat: string };

export interface FixtureSeedRef {
	dir: string;
	treeDigest: string;
}

export type PolicyVerdict = "approve" | "hold" | "answer";

export interface PolicyCondition {
	kind: "job-state" | "report-contains" | "board-column" | "file-exists" | "file-contains";
	role?: string;
	state?: string;
	token?: string;
	cardId?: string;
	in?: string[];
	notIn?: string[];
	path?: string;
	negate?: boolean;
}

export interface PolicyGate {
	id: string;
	humanStep: number;
	when: PolicyCondition[];
	verdict: PolicyVerdict;
	answerText?: string;
	then?: "merge" | "skip" | "answer";
}

export interface Fixture {
	schemaVersion: typeof SCHEMA_VERSION;
	taskId: string;
	name: string;
	fixtureVersion: string;
	kind: "procedure" | "seat";
	target: FixtureTarget;
	inputFile?: string;
	seed: FixtureSeedRef;
	env?: Record<string, string>;
	timeoutMinutes?: number;
	policy: { gates: PolicyGate[] };
	graderModel: string;
	graderThinking?: string;
}

export type RubricCheck =
	| { kind: "gates"; argv: string[]; expect: { exitCode: number; stdoutContains?: string } }
	| { kind: "settled"; role?: string; path?: string }
	| { kind: "artifact-present"; path: string }
	| { kind: "artifact-contains"; path: string; contains: string };

export type RubricCriterion =
	| { id: string; type: "gate"; check: RubricCheck }
	| { id: string; type: "judge"; prompt: string };

export interface Rubric {
	schemaVersion: typeof SCHEMA_VERSION;
	rubricVersion: string;
	criteria: RubricCriterion[];
}

export interface LoadedFixture {
	fixture: Fixture;
	rubric: Rubric;
	seedDir: string;
	source: "packaged" | "override";
}

/** Normalized cell state in the condition vocabulary (supplied by EV-20). */
export interface RulingsState {
	/** role → job state ("done" | "stalled" | "timeout"). */
	jobs: Record<string, string>;
	/** role → report text. */
	reports: Record<string, string>;
	/** cardId → board columns it currently sits under. */
	board: Record<string, string[]>;
	/** path → file content; a path present here means the file exists. */
	files: Record<string, string>;
}

export interface RulingsVerdict {
	gateId: string;
	verdict: PolicyVerdict;
	answerText?: string;
}

// ---- small helpers ----

function isRecord(v: unknown): v is Record<string, unknown> {
	return typeof v === "object" && v !== null && !Array.isArray(v);
}

function rejectUnknownKeys(rec: Record<string, unknown>, allowed: ReadonlySet<string>, file: string, where: string): void {
	for (const key of Object.keys(rec)) {
		if (!allowed.has(key)) throw new Error(`${file}: unknown key ${where}.${key}`);
	}
}

function requireString(rec: Record<string, unknown>, key: string, file: string, where: string): string {
	const v = rec[key];
	if (typeof v !== "string" || v.trim() === "") {
		throw new Error(`${file}: ${where}.${key} must be a non-empty string`);
	}
	return v;
}

function requireInt(rec: Record<string, unknown>, key: string, file: string, where: string): number {
	const v = rec[key];
	if (typeof v !== "number" || !Number.isInteger(v)) {
		throw new Error(`${file}: ${where}.${key} must be an integer`);
	}
	return v;
}

function parseJsonFile(file: string): unknown {
	try {
		return JSON.parse(fs.readFileSync(file, "utf-8"));
	} catch (e) {
		throw new Error(`${file}: malformed JSON — ${e instanceof Error ? e.message : String(e)}`);
	}
}

function readOptionalBool(rec: Record<string, unknown>, key: string, file: string, where: string): boolean | undefined {
	const v = rec[key];
	if (v === undefined) return undefined;
	if (typeof v !== "boolean") throw new Error(`${file}: ${where}.${key} must be a boolean`);
	return v;
}

function pathInside(dir: string, target: string): boolean {
	const rel = path.relative(dir, target);
	return rel !== "" && !rel.startsWith("..") && !path.isAbsolute(rel) && target.startsWith(dir + path.sep);
}

// ---- fixture validation (strict: new/unknown keys throw, mirrors seats.ts) ----

const FIXTURE_KEYS = new Set([
	"schemaVersion",
	"taskId",
	"name",
	"fixtureVersion",
	"kind",
	"target",
	"inputFile",
	"seed",
	"env",
	"timeoutMinutes",
	"policy",
	"graderModel",
	"graderThinking",
]);
const TARGET_KEYS = new Set(["type", "command", "arguments", "seat"]);
const SEED_KEYS = new Set(["dir", "treeDigest"]);
const POLICY_KEYS = new Set(["gates"]);
const GATE_KEYS = new Set(["id", "humanStep", "when", "verdict", "answerText", "then"]);
const CONDITION_KEYS = new Set(["kind", "role", "state", "token", "cardId", "in", "notIn", "path", "negate"]);

/** Validate `policy` and return the gate list. Pure. */
export function validatePolicy(raw: unknown, file: string): PolicyGate[] {
	if (!isRecord(raw)) throw new Error(`${file}: "policy" must be an object`);
	rejectUnknownKeys(raw, POLICY_KEYS, file, "policy");
	const gatesRaw = raw.gates;
	if (!Array.isArray(gatesRaw)) throw new Error(`${file}: policy.gates must be an array`);
	return gatesRaw.map((gateRaw, i) => {
		const where = `policy.gates[${i}]`;
		if (!isRecord(gateRaw)) throw new Error(`${file}: ${where} must be an object`);
		rejectUnknownKeys(gateRaw, GATE_KEYS, file, where);
		const gate: PolicyGate = {
			id: requireString(gateRaw, "id", file, where),
			humanStep: requireInt(gateRaw, "humanStep", file, where),
			when: [],
			verdict: requireString(gateRaw, "verdict", file, where) as PolicyVerdict,
		};
		if (gate.humanStep < 0) throw new Error(`${file}: ${where}.humanStep must be >= 0`);
		if (!VERDICTS.has(gate.verdict)) {
			throw new Error(`${file}: ${where}.verdict "${gate.verdict}" must be one of ${[...VERDICTS].join(", ")}`);
		}
		if (gate.verdict === "answer") {
			if (typeof gateRaw.answerText !== "string" || gateRaw.answerText.trim() === "") {
				throw new Error(`${file}: ${where}.answerText is required when verdict is "answer"`);
			}
			gate.answerText = gateRaw.answerText;
		} else if (gateRaw.answerText !== undefined) {
			throw new Error(`${file}: ${where}.answerText is only allowed when verdict is "answer"`);
		}
		if (gateRaw.then !== undefined) {
			if (typeof gateRaw.then !== "string" || !THEN_VOCAB.has(gateRaw.then)) {
				throw new Error(`${file}: ${where}.then "${String(gateRaw.then)}" must be one of ${[...THEN_VOCAB].join(", ")}`);
			}
			gate.then = gateRaw.then as PolicyGate["then"];
		}
		if (!Array.isArray(gateRaw.when)) throw new Error(`${file}: ${where}.when must be an array`);
		gate.when = gateRaw.when.map((condRaw, j) => validateCondition(condRaw, file, `${where}.when[${j}]`));
		return gate;
	});
}

function validateCondition(raw: unknown, file: string, where: string): PolicyCondition {
	if (!isRecord(raw)) throw new Error(`${file}: ${where} must be an object`);
	rejectUnknownKeys(raw, CONDITION_KEYS, file, where);
	const kind = requireString(raw, "kind", file, where);
	if (!CONDITION_KINDS.has(kind)) {
		throw new Error(`${file}: ${where}.kind "${kind}" must be one of ${[...CONDITION_KINDS].join(", ")}`);
	}
	const negate = readOptionalBool(raw, "negate", file, where);
	const cond: PolicyCondition = { kind: kind as PolicyCondition["kind"] };
	if (negate !== undefined) cond.negate = negate;
	switch (kind) {
		case "job-state": {
			cond.role = requireString(raw, "role", file, where);
			cond.state = requireString(raw, "state", file, where);
			if (!JOB_STATES.has(cond.state)) {
				throw new Error(`${file}: ${where} job-state state "${cond.state}" must be one of ${[...JOB_STATES].join(", ")}`);
			}
			break;
		}
		case "report-contains": {
			cond.role = requireString(raw, "role", file, where);
			cond.token = requireString(raw, "token", file, where);
			break;
		}
		case "board-column": {
			cond.cardId = requireString(raw, "cardId", file, where);
			const hasIn = raw.in !== undefined;
			const hasNotIn = raw.notIn !== undefined;
			if (hasIn === hasNotIn) {
				throw new Error(`${file}: ${where} board-column must have exactly one of "in" or "notIn"`);
			}
			const listKey = hasIn ? "in" : "notIn";
			const list = raw[listKey];
			if (!Array.isArray(list) || list.length === 0 || !list.every((s) => typeof s === "string" && s !== "")) {
				throw new Error(`${file}: ${where}.${listKey} must be a non-empty array of non-empty strings`);
			}
			if (hasIn) cond.in = list as string[];
			else cond.notIn = list as string[];
			break;
		}
		case "file-exists": {
			cond.path = requireString(raw, "path", file, where);
			break;
		}
		case "file-contains": {
			cond.path = requireString(raw, "path", file, where);
			cond.token = requireString(raw, "token", file, where);
			break;
		}
	}
	return cond;
}

/** Validate a fixture.json. Pure. */
export function validateFixture(raw: unknown, file: string): Fixture {
	if (!isRecord(raw)) throw new Error(`${file}: fixture root must be an object`);
	rejectUnknownKeys(raw, FIXTURE_KEYS, file, "fixture");

	if (raw.schemaVersion !== SCHEMA_VERSION) {
		throw new Error(`${file}: schemaVersion must be ${SCHEMA_VERSION} (got ${String(raw.schemaVersion)})`);
	}
	const taskId = requireString(raw, "taskId", file, "fixture");
	if (!TASK_ID_RE.test(taskId)) {
		throw new Error(`${file}: taskId "${taskId}" must match ${TASK_ID_RE}`);
	}
	const name = requireString(raw, "name", file, "fixture");
	const fixtureVersion = requireString(raw, "fixtureVersion", file, "fixture");
	if (!SEMVER_RE.test(fixtureVersion)) {
		throw new Error(`${file}: fixtureVersion "${fixtureVersion}" must be a semver string like "1.0.0"`);
	}
	const kind = requireString(raw, "kind", file, "fixture");
	if (kind !== "procedure" && kind !== "seat") {
		throw new Error(`${file}: kind must be "procedure" or "seat" (got "${kind}")`);
	}
	const graderModelRaw = requireString(raw, "graderModel", file, "fixture");
	// The shared qualified-model grammar — a bare id or unknown :thinking suffix
	// fails at load naming the file (EV-17 seam reused, never forked).
	const grader = parseQualifiedModel(graderModelRaw, `${file}: graderModel`);

	const fixture: Fixture = {
		schemaVersion: SCHEMA_VERSION,
		taskId,
		name,
		fixtureVersion,
		kind,
		target: validateTarget(raw.target, kind, file),
		seed: validateSeedRef(raw.seed, file),
		policy: { gates: validatePolicy(raw.policy, file) },
		graderModel: grader.model,
	};
	if (grader.thinkingLevel !== undefined) fixture.graderModel = `${grader.model}:${grader.thinkingLevel}`;
	if (raw.graderThinking !== undefined) {
		if (typeof raw.graderThinking !== "string" || raw.graderThinking.trim() === "") {
			throw new Error(`${file}: graderThinking must be a non-empty string`);
		}
		// Validate through the shared grammar (the (model, thinking) dispatch
		// pair) — the combined string only parses when graderThinking is a
		// known level; anything else throws naming it.
		parseQualifiedModel(`${fixture.graderModel}:${raw.graderThinking}`, `${file}: graderThinking`);
		fixture.graderThinking = raw.graderThinking;
	}

	// inputFile: required iff kind=seat (exactly-one rule, validator-enforced)
	if (kind === "seat") {
		fixture.inputFile = requireString(raw, "inputFile", file, "fixture");
		if (path.isAbsolute(fixture.inputFile) || fixture.inputFile.split("/").includes("..")) {
			throw new Error(`${file}: inputFile must be a plain filename inside the fixture dir`);
		}
	} else if (raw.inputFile !== undefined) {
		throw new Error(`${file}: inputFile is only allowed for kind "seat"`);
	}

	if (raw.env !== undefined) {
		if (!isRecord(raw.env)) throw new Error(`${file}: env must be an object of string values`);
		fixture.env = {};
		for (const [k, v] of Object.entries(raw.env)) {
			if (typeof v !== "string") throw new Error(`${file}: env["${k}"] must be a string`);
			fixture.env[k] = v;
		}
	}
	if (raw.timeoutMinutes !== undefined) {
		const t = requireInt(raw, "timeoutMinutes", file, "fixture");
		if (t <= 0) throw new Error(`${file}: timeoutMinutes must be a positive integer`);
		fixture.timeoutMinutes = t;
	}
	return fixture;
}

function validateTarget(raw: unknown, kind: string, file: string): FixtureTarget {
	const where = "fixture.target";
	if (!isRecord(raw)) throw new Error(`${file}: ${where} must be an object`);
	rejectUnknownKeys(raw, TARGET_KEYS, file, where);
	const type = requireString(raw, "type", file, where);
	if (type !== kind) {
		throw new Error(`${file}: ${where}.type "${type}" must equal kind "${kind}"`);
	}
	if (kind === "procedure") {
		const command = requireString(raw, "command", file, where);
		if (!/^\/[a-z0-9-]+$/.test(command)) {
			throw new Error(`${file}: ${where}.command "${command}" must be a slash command like "/council"`);
		}
		if (!Array.isArray(raw.arguments) || !raw.arguments.every((a) => typeof a === "string")) {
			throw new Error(`${file}: ${where}.arguments must be an array of strings`);
		}
		return { type: "procedure", command, arguments: raw.arguments as string[] };
	}
	return { type: "seat", seat: requireString(raw, "seat", file, where) };
}

function validateSeedRef(raw: unknown, file: string): FixtureSeedRef {
	const where = "fixture.seed";
	if (!isRecord(raw)) throw new Error(`${file}: ${where} must be an object`);
	rejectUnknownKeys(raw, SEED_KEYS, file, where);
	const dir = requireString(raw, "dir", file, where);
	if (path.isAbsolute(dir) || dir.split(/[\\/]/).includes("..")) {
		throw new Error(`${file}: ${where}.dir must be a relative path inside the fixture dir`);
	}
	const treeDigest = requireString(raw, "treeDigest", file, where);
	if (!DIGEST_RE.test(treeDigest)) {
		throw new Error(`${file}: ${where}.treeDigest must be "sha256:<64 hex digits>"`);
	}
	return { dir, treeDigest };
}

// ---- rubric validation (frozen vocabulary; EV-19 imports this) ----

const RUBRIC_KEYS = new Set(["schemaVersion", "rubricVersion", "criteria"]);
const CRITERION_KEYS = new Set(["id", "type", "check", "prompt", "description"]);
const CHECK_KEYS = new Set(["kind", "argv", "expect", "path", "contains", "role", "stdoutContains"]);
const EXPECT_KEYS = new Set(["exitCode", "stdoutContains"]);
const CHECK_KINDS = new Set(["gates", "settled", "artifact-present", "artifact-contains"]);

/** Validate a rubric.json. Pure. */
export function validateRubric(raw: unknown, file: string): Rubric {
	if (!isRecord(raw)) throw new Error(`${file}: rubric root must be an object`);
	rejectUnknownKeys(raw, RUBRIC_KEYS, file, "rubric");
	if (raw.schemaVersion !== SCHEMA_VERSION) {
		throw new Error(`${file}: schemaVersion must be ${SCHEMA_VERSION} (got ${String(raw.schemaVersion)})`);
	}
	const rubricVersion = requireString(raw, "rubricVersion", file, "rubric");
	if (!SEMVER_RE.test(rubricVersion)) {
		throw new Error(`${file}: rubricVersion "${rubricVersion}" must be a semver string like "1.0.0"`);
	}
	if (!Array.isArray(raw.criteria) || raw.criteria.length < 1 || raw.criteria.length > 5) {
		throw new Error(`${file}: rubric.criteria must have 1-5 criteria`);
	}
	const ids = new Set<string>();
	const criteria: Rubric["criteria"] = raw.criteria.map((cRaw, i) => {
		const where = `rubric.criteria[${i}]`;
		if (!isRecord(cRaw)) throw new Error(`${file}: ${where} must be an object`);
		rejectUnknownKeys(cRaw, CRITERION_KEYS, file, where);
		const id = requireString(cRaw, "id", file, where);
		if (ids.has(id)) throw new Error(`${file}: ${where}.id "${id}" is duplicated`);
		ids.add(id);
		const type = requireString(cRaw, "type", file, where);
		if (type === "gate") return { id, type, check: validateCheck(cRaw.check, file, where) };
		if (type === "judge") return { id, type, prompt: requireString(cRaw, "prompt", file, where) };
		throw new Error(`${file}: ${where}.type must be "gate" or "judge" (got "${type}")`);
	});
	return { schemaVersion: SCHEMA_VERSION, rubricVersion, criteria };
}

function validateCheck(raw: unknown, file: string, where: string): RubricCheck {
	if (!isRecord(raw)) throw new Error(`${file}: ${where}.check must be an object`);
	rejectUnknownKeys(raw, CHECK_KEYS, file, `${where}.check`);
	const kind = requireString(raw, "kind", file, `${where}.check`);
	if (!CHECK_KINDS.has(kind)) {
		throw new Error(`${file}: ${where}.check.kind "${kind}" must be one of ${[...CHECK_KINDS].join(", ")}`);
	}
	switch (kind) {
		case "gates": {
			if (!Array.isArray(raw.argv) || raw.argv.length === 0 || !raw.argv.every((a) => typeof a === "string" && a !== "")) {
				throw new Error(`${file}: gates check argv must be a non-empty array of non-empty strings`);
			}
			if (!isRecord(raw.expect)) throw new Error(`${file}: gates check expect must be an object`);
			rejectUnknownKeys(raw.expect as Record<string, unknown>, EXPECT_KEYS, file, `${where}.check.expect`);
			const expectRaw = raw.expect as Record<string, unknown>;
			if (typeof expectRaw.exitCode !== "number" || !Number.isInteger(expectRaw.exitCode)) {
				throw new Error(`${file}: gates check expect.exitCode must be an integer`);
			}
			let stdoutContains: string | undefined;
			if (expectRaw.stdoutContains !== undefined) {
				if (typeof expectRaw.stdoutContains !== "string" || expectRaw.stdoutContains === "") {
					throw new Error(`${file}: gates check expect.stdoutContains must be a non-empty string`);
				}
				stdoutContains = expectRaw.stdoutContains;
			}
			return { kind, argv: raw.argv as string[], expect: { exitCode: expectRaw.exitCode, ...(stdoutContains !== undefined ? { stdoutContains } : {}) } };
		}
		case "settled": {
			const role = typeof raw.role === "string" && raw.role !== "" ? raw.role : undefined;
			const p = typeof raw.path === "string" && raw.path !== "" ? raw.path : undefined;
			if (role === undefined && p === undefined) {
				throw new Error(`${file}: settled check must carry at least one of "role" or "path"`);
			}
			return { kind, ...(role !== undefined ? { role } : {}), ...(p !== undefined ? { path: p } : {}) };
		}
		case "artifact-present":
			return { kind, path: requireString(raw, "path", file, `${where}.check`) };
		case "artifact-contains": {
			const out: { kind: "artifact-contains"; path: string; contains: string } = {
				kind,
				path: requireString(raw, "path", file, `${where}.check`),
				contains: requireString(raw, "contains", file, `${where}.check`),
			};
			return out;
		}
	}
	throw new Error(`${file}: unreachable check validation for kind "${kind}"`);
}

// ---- seed digest + forbid-list ----

/**
 * sha256 over (sorted relpath, NUL, bytes) pairs of every file under `dir`.
 * Deterministic: relpaths sorted, no modes/timestamps, symlinks refused
 * (plain deterministic trees only). Returns "sha256:<hex>".
 */
export function sha256Tree(dir: string): string {
	const files: string[] = [];
	const walk = (d: string, rel: string): void => {
		for (const name of fs.readdirSync(d).sort()) {
			const full = path.join(d, name);
			const relPath = rel === "" ? name : `${rel}/${name}`;
			const st = fs.lstatSync(full);
			if (st.isSymbolicLink()) throw new Error(`${full}: symlinks are not allowed in a seed tree`);
			if (st.isDirectory()) walk(full, relPath);
			else files.push(relPath);
		}
	};
	walk(dir, "");
	files.sort();
	const h = createHash("sha256");
	for (const rel of files) {
		h.update(rel);
		h.update("\u0000");
		h.update(fs.readFileSync(path.join(dir, rel)));
	}
	return `sha256:${h.digest("hex")}`;
}

/**
 * Scroll the seed tree for cell-invariance violations (Q1 + §6): any of
 * `.council.json` with a named model, non-empty `.pi/council/mcp.json`,
 * `.env`, `model-floors.json` at any path (the shipped PKG_ROOT default is
 * outside every seed and exempt by definition), `.pi/git/`, `.pi/npm/`,
 * `node_modules/`, or a symlink — fails load naming the offending path.
 */
function scanSeedTree(seedDir: string, fixtureFile: string): void {
	const walk = (d: string, rel: string): void => {
		for (const name of fs.readdirSync(d).sort()) {
			const full = path.join(d, name);
			const relPath = rel === "" ? name : `${rel}/${name}`;
			const st = fs.lstatSync(full);
			if (st.isSymbolicLink()) throw new Error(`${full}: symlinks are not allowed in a seed tree`);
			if (st.isDirectory()) {
				const segments = relPath.split("/");
				if (segments.includes("node_modules") && segments[segments.length - 1] === "node_modules") {
					throw new Error(`${full}: node_modules/ is not allowed in a seed tree`);
				}
				if (segments[0] === ".pi" && segments.length >= 2 && (segments[1] === "git" || segments[1] === "npm")) {
					throw new Error(`${full}: ${segments[1]}/ is not allowed in a seed tree`);
				}
				walk(full, relPath);
				continue;
			}
			const base = path.basename(name);
			if (base === ".env") throw new Error(`${full}: .env is not allowed in a seed tree`);
			if (base === "model-floors.json") {
				throw new Error(`${full}: model-floors.json is not allowed in a seed tree (a read-time config side channel)`);
			}
			if (base === ".council.json") {
				if (councilJsonHasNamedModel(readSeedJson(full))) {
					throw new Error(`${full}: .council.json with a named model is not allowed in a seed tree`);
				}
			}
			const segments = relPath.split("/");
			if (segments[0] === ".pi" && segments.slice(1).join("/") === "council/mcp.json" && mcpJsonNonEmpty(readSeedJson(full))) {
				throw new Error(`${full}: non-empty mcp.json is not allowed in a seed tree ({"servers": {}} is allowed)`);
			}
		}
	};
	walk(seedDir, "");
}

function readSeedJson(file: string): unknown {
	try {
		return JSON.parse(fs.readFileSync(file, "utf-8"));
	} catch {
		// A malformed seed config is still a config the loader would read at
		// module load — treat as forbidden rather than guess.
		throw new Error(`${file}: malformed JSON in seed config file`);
	}
}

function councilJsonHasNamedModel(raw: unknown): boolean {
	if (!isRecord(raw)) return false;
	const council = raw.council;
	if (!isRecord(council)) return false;
	for (const [key, value] of Object.entries(council)) {
		if (key === "theme") continue; // reserved for loadThemeConfig
		if (typeof value === "string") return true; // string shorthand always names a model
		if (isRecord(value) && typeof value.model === "string") return true;
	}
	return false;
}

function mcpJsonNonEmpty(raw: unknown): boolean {
	if (!isRecord(raw)) return true; // non-object content is not the allowed empty shape
	const keys = Object.keys(raw);
	if (keys.length === 0) return false; // {} allowed
	if (keys.length === 1 && keys[0] === "servers") {
		const servers = raw.servers;
		return !isRecord(servers) || Object.keys(servers).length > 0;
	}
	return true;
}

// ---- loader ----

function shippedProcedureNames(): Set<string> {
	const dir = path.join(PKG_ROOT, "council", "procedures");
	const out = new Set<string>();
	if (!fs.existsSync(dir)) return out;
	for (const f of fs.readdirSync(dir)) if (f.endsWith(".md")) out.add(f.replace(/\.md$/, ""));
	return out;
}

function expandArgs(fixture: Fixture, file: string): Fixture {
	if (fixture.target.type !== "procedure") return fixture;
	const args = fixture.target.arguments;
	const expand = (s: string): string =>
		s.replace(/\$args\[(\d+)\]/g, (m, idx: string) => {
			const i = Number(idx);
			if (i >= args.length) throw new Error(`${file}: $args[${i}] out of range of target.arguments`);
			return args[i];
		});
	const gates = fixture.policy.gates.map((gate) => ({
		...gate,
		when: gate.when.map((cond) => {
			const next = { ...cond };
			if (next.cardId !== undefined) next.cardId = expand(next.cardId);
			if (next.path !== undefined) next.path = expand(next.path);
			if (next.token !== undefined) next.token = expand(next.token);
			return next;
		}),
	}));
	return { ...fixture, policy: { gates } };
}

/**
 * Load a fixture by task id. Resolution order: repo-local first
 * (`<repo>/$CONFIG_DIR_NAME/council/fixtures/<task>/` — the whole task dir
 * resolves from the repo side, rubric included), packaged default second.
 * Loud failure on: unknown task, missing rubric.json (C3 — never a silent
 * `[]` or packaged fallback), schema violation, digest mismatch (packaged),
 * forbidden seed files, an unresolvable procedure command or seat, or a
 * missing inputFile. Read-only w.r.t. repoRoot.
 */
export function loadFixture(repoRoot: string, taskId: string): LoadedFixture {
	if (!TASK_ID_RE.test(taskId)) throw new Error(`Unknown fixture task "${taskId}"`);
	const repoDir = path.join(repoRoot, CONFIG_DIR_NAME, "council", "fixtures", taskId);
	const pkgDir = path.join(PKG_ROOT, "council", "fixtures", taskId);
	const source: "override" | "packaged" = fs.existsSync(repoDir) ? "override" : "packaged";
	const taskDir = source === "override" ? repoDir : pkgDir;

	const fixtureFile = path.join(taskDir, "fixture.json");
	if (!fs.existsSync(fixtureFile)) {
		if (source === "packaged") throw new Error(`Unknown fixture task "${taskId}"`);
		throw new Error(`${fixtureFile}: fixture dir exists but fixture.json is missing`);
	}
	const rubricFile = path.join(taskDir, "rubric.json");
	if (!fs.existsSync(rubricFile)) {
		throw new Error(`${rubricFile}: fixture task "${taskId}" has no rubric.json — a fixture without its rubric fails loudly (C3)`);
	}

	const fixture = validateFixture(parseJsonFile(fixtureFile), fixtureFile);
	const rubric = validateRubric(parseJsonFile(rubricFile), rubricFile);
	if (fixture.taskId !== taskId) {
		throw new Error(`${fixtureFile}: taskId "${fixture.taskId}" does not match directory name "${taskId}"`);
	}

	if (fixture.kind === "procedure") {
		const commandName = fixture.target.type === "procedure" ? fixture.target.command.slice(1) : "";
		if (!shippedProcedureNames().has(commandName)) {
			throw new Error(
				`${fixtureFile}: procedure command "${fixture.target.type === "procedure" ? fixture.target.command : ""}" is not one of the shipped procedures`,
			);
		}
	} else {
		const seatName = fixture.target.type === "seat" ? fixture.target.seat : "";
		try {
			loadSeat(repoRoot, seatName);
		} catch (e) {
			throw new Error(`${fixtureFile}: seat target "${seatName}" does not resolve — ${e instanceof Error ? e.message : String(e)}`);
		}
		const inputPath = path.join(taskDir, fixture.inputFile as string);
		if (!fs.existsSync(inputPath)) throw new Error(`${inputPath}: inputFile missing for fixture task "${taskId}"`);
	}

	const seedDir = path.resolve(taskDir, fixture.seed.dir);
	if (!pathInside(taskDir, seedDir)) {
		throw new Error(`${fixtureFile}: seed.dir must stay inside the fixture dir`);
	}
	if (!fs.existsSync(seedDir)) throw new Error(`${seedDir}: seed directory missing for fixture task "${taskId}"`);
	scanSeedTree(seedDir, fixtureFile);
	if (source === "packaged") {
		const digest = sha256Tree(seedDir);
		if (digest !== fixture.seed.treeDigest) {
			throw new Error(`${seedDir}: treeDigest mismatch — pinned ${fixture.seed.treeDigest}, computed ${digest}`);
		}
	}

	return { fixture: expandArgs(fixture, fixtureFile), rubric, seedDir, source };
}

/**
 * Union of packaged + repo-local fixture tasks, per-task first-hit (repo wins
 * on collision), each task's self-description validated (taskId == dirname).
 */
export function listFixtureTasks(repoRoot: string): string[] {
	const found = new Map<string, string>();
	for (const dir of [path.join(repoRoot, CONFIG_DIR_NAME, "council", "fixtures"), path.join(PKG_ROOT, "council", "fixtures")]) {
		if (!fs.existsSync(dir)) continue;
		for (const entry of fs.readdirSync(dir).sort()) {
			if (found.has(entry)) continue;
			const fixtureFile = path.join(dir, entry, "fixture.json");
			if (!fs.existsSync(fixtureFile)) {
				throw new Error(`${fixtureFile}: fixture task dir "${entry}" has no fixture.json`);
			}
			const fixture = validateFixture(parseJsonFile(fixtureFile), fixtureFile);
			if (fixture.taskId !== entry) {
				throw new Error(`${fixtureFile}: taskId "${fixture.taskId}" does not match directory name "${entry}"`);
			}
			found.set(entry, fixtureFile);
		}
	}
	return [...found.keys()].sort();
}

// ---- pure rulings engine (A4) ----

/**
 * Decide verdicts from cell state only — pure, no I/O (A4). `$args` are
 * already expanded at load. The mechanical act named by `then` (merge, skip,
 * answer) is EV-20's to perform per gateId.
 */
export function applyRulings(policy: { gates: PolicyGate[] }, state: RulingsState): RulingsVerdict[] {
	return policy.gates.map((gate) => {
		const satisfied = gate.when.every((cond) => evalCondition(cond, state));
		if (!satisfied) return { gateId: gate.id, verdict: "hold" };
		const verdict: RulingsVerdict = { gateId: gate.id, verdict: gate.verdict };
		if (gate.verdict === "answer") verdict.answerText = gate.answerText;
		return verdict;
	});
}

function evalCondition(cond: PolicyCondition, state: RulingsState): boolean {
	let result: boolean;
	switch (cond.kind) {
		case "job-state":
			result = state.jobs[cond.role as string] === cond.state;
			break;
		case "report-contains":
			result = (state.reports[cond.role as string] ?? "").includes(cond.token as string);
			break;
		case "board-column": {
			const columns = state.board[cond.cardId as string] ?? [];
			result = cond.in !== undefined
				? columns.some((col) => cond.in!.includes(col))
				: !columns.some((col) => cond.notIn!.includes(col));
			break;
		}
		case "file-exists":
			result = Object.hasOwn(state.files, cond.path as string);
			break;
		case "file-contains":
			result = (state.files[cond.path as string] ?? "").includes(cond.token as string);
			break;
	}
	return cond.negate ? !result : result;
}