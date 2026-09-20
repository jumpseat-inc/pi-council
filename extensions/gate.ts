// EV-62 — the metered-deliberation gate's data surface: the gate policy and
// the question set as per-repository data, not code (EPIC-13). The gate's
// decision function (EV-63) and transport (EV-65) consume these loaders; this
// module ships resolution + validation only — it never dispatches a model
// call and never writes a ledger line.
//
// Resolution follows the repo's packaged-default-plus-repo-override pattern
// (AGENTS.md convention #5; mirrors seatDirs/loadSeat in seats.ts and
// eval-fixtures.ts): repo-local files at
// `<repo>/$CONFIG_DIR_NAME/council/gate/<name>.json` shadow the packaged
// `council/gate/<name>.json` WHOLE-FILE with first-hit resolution — the first
// existing file is the only file read and the only file validated; there is
// NO field-level merge between the repo and packaged halves. A repo that
// supplies a policy gets its file, never a half-merged mixture; a repo that
// supplies nothing gets the packaged default.
//
// Validation is fail-loud on purpose: malformed JSON, an unknown key, and an
// invalid value each throw naming the offending file and key rather than
// degrading to a default — a silently defaulted policy is an untested policy.
// Every failure is one single line of the exact form
//   FAIL: <file> has an invalid <key> — <what was found> — set a valid value
//   or remove the key to use the packaged default
// (newline-sanitized so a raw JSON.parse snippet can never break the line),
// never a stack trace. Enablement (EV-73) lives in the repo's committed
// `.council.json` — the reserved top-level `gate` section, resolved solely by
// loadGateConfig: {"mode": "off" | "advisory" | "active"}, with an absent
// file/section and `gate: {}` all resolving `off` byte-identically. With the
// resolved default `off` the gate issues no gate call and writes no ledger
// line; policy.json is TUNING DATA ONLY and carries no mode (a policy file
// that still carries one hits the dedicated EV-75 migration FAIL pointing at
// gate.mode in .council.json). Tests that exercise a non-off mode set it via a `.council.json`
// gate fixture and never rely on the packaged default being on. The model id
// is pinned to a versioned id — confidence floors tuned against a version
// must not silently move when the alias rolls.
import * as fs from "node:fs";
import * as path from "node:path";
import { CONFIG_DIR_NAME } from "@earendil-works/pi-coding-agent";
import type { GateAnswer } from "./gate-ledger.ts";
export type { GateAnswer } from "./gate-ledger.ts";
import { COUNCIL_CONFIG_FILE, PKG_ROOT } from "./seats.ts";

/** Versioned model pin — NEVER the alias `~typesafe/jev-latest`. */
export const GATE_PINNED_MODEL = "typesafe/jev-1.13";
/** The pinned decisions endpoint; never a chat/completions path. */
export const GATE_ENDPOINT = "https://openrouter.ai/api/alpha/decisions";

/** `off` issues no gate call and writes no ledger line (R3). */
export const GATE_MODES = ["off", "advisory", "active"] as const;
export type GateMode = (typeof GATE_MODES)[number];

export interface GatePolicy {
	policyVersion: string;
	mode: GateMode;
	model: string;
	endpoint: string;
	/** EV-64: packed gate-state token budget. Present ⇒ a validated positive
	 * integer in every mode; absent ⇒ legal only when the resolved mode is
	 * off (PO ruling Q1). Never defaulted in code — the packaged data file
	 * carries the value. */
	gateStateBudgetTokens?: number;
}

export type GateQuestionType = "choice" | "noul" | "score";

export interface GateQuestion {
	type: GateQuestionType;
	instructions: string;
	/** For `choice`/`noul`: option → description. For `score`: ordered
	 * criterion strings (the legend indices EV-63 reads). */
	criteria: Record<string, string> | string[];
}

export interface GateQuestionSet {
	version: string;
	questions: Record<string, GateQuestion>;
}

/** EV-73 — the ONE resolver of the decisions gate's enablement, from the
 * reserved top-level `gate` section of the repo's committed `.council.json`
 * (a sibling invisible to loadCouncilConfig, which reads only `parsed.council`;
 * like `theme` and `retry` it gets its own independent loader). Absent file,
 * absent `gate`, and `gate: {}` all resolve `{ mode: "off" }` byte-identically
 * to the packaged default. Lazy-at-call by construction: this runs inside
 * loadGatePolicy at gate-tool-call time, never eagerly at parent init — a
 * malformed `gate` section throws one FAIL at the gate tool call and unrelated
 * session startup never crashes on it. Named hazard: a mid-run `.council.json`
 * edit flips routing on the next gate read — the same run-config-stability
 * class as a seat-model edit. */
export function loadGateConfig(repoRoot: string): { mode: GateMode } {
	const file = path.join(repoRoot, COUNCIL_CONFIG_FILE);
	if (!fs.existsSync(file)) return { mode: "off" };
	let parsed: unknown;
	try {
		parsed = JSON.parse(fs.readFileSync(file, "utf-8"));
	} catch (e) {
		throw gateFail(file, "JSON", `not parseable as JSON: ${e instanceof Error ? e.message : String(e)}`);
	}
	if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
		throw gateFail(file, "JSON", "root must be a JSON object");
	}
	const raw = (parsed as Record<string, unknown>).gate;
	if (raw === undefined) return { mode: "off" };
	if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
		throw gateFail(file, "gate", `expected an object, found ${describeShape(raw)}`);
	}
	const section = raw as Record<string, unknown>;
	for (const key of Object.keys(section)) {
		if (key !== "mode") {
			throw gateFail(file, `gate.${key}`, "unknown key; expected one of mode");
		}
	}
	if (section.mode === undefined) return { mode: "off" };
	if (typeof section.mode !== "string" || !GATE_MODES.includes(section.mode as GateMode)) {
		throw gateFail(
			file,
			"gate.mode",
			`expected one of ${GATE_MODES.map((m) => JSON.stringify(m)).join(", ")}, found ${JSON.stringify(section.mode)}`,
		);
	}
	return { mode: section.mode as GateMode };
}

/** Repo override first, packaged default second — the seatDirs pattern.
 * EV-78: optional sub-path segments generalize the dir pair to sibling data
 * surfaces (`gateDirs(repoRoot, "followup")`); the default empty keeps the
 * existing callers byte-identical. */
function gateDirs(repoRoot: string, ...sub: string[]): string[] {
	return [
		path.join(repoRoot, CONFIG_DIR_NAME, "council", "gate", ...sub),
		path.join(PKG_ROOT, "council", "gate", ...sub),
	];
}

/** The one-line FAIL error; `found` is newline-sanitized so the message is
 * always a single line, never a stack trace. */
function gateFail(file: string, key: string, found: string): Error {
	const detail = found.replace(/[\r\n]+/g, " ");
	return new Error(
		`FAIL: ${file} has an invalid ${key} — ${detail} — set a valid value or remove the key to use the packaged default`,
	);
}

/** First-hit whole-file read: the first existing file wins and is the only
 * file read. Returns the file identity with the parsed value so error text
 * names the file that was actually read, never the shadowed one. */
function readGateFile(dirs: string[], name: string): { file: string; value: unknown } {
	for (const dir of dirs) {
		const file = path.join(dir, name);
		if (!fs.existsSync(file)) continue;
		try {
			return { file, value: JSON.parse(fs.readFileSync(file, "utf-8")) };
		} catch (e) {
			throw gateFail(file, "JSON", `not parseable as JSON: ${e instanceof Error ? e.message : String(e)}`);
		}
	}
	throw new Error(`gate: no ${name} found — looked in ${dirs.join(", ")}`);
}

function nonEmptyString(file: string, key: string, v: unknown): string {
	if (typeof v !== "string" || v.trim() === "") {
		throw gateFail(file, key, `expected a non-empty string, found ${JSON.stringify(v)}`);
	}
	return v;
}

/** Load the gate policy: repo-local override whole-file, else the packaged
 * default. EV-73: enablement (`mode`) comes solely from `.council.json`'s
 * reserved top-level `gate` section via loadGateConfig, resolved BEFORE the
 * policy file is read; policy.json is tuning data only (model/endpoint/budget)
 * and carries no mode — a policy file that still carries one hits the
 * dedicated EV-75 migration FAIL naming the gate.mode replacement in
 * .council.json. */
export function loadGatePolicy(repoRoot: string): GatePolicy {
	const { mode } = loadGateConfig(repoRoot);
	const { file, value } = readGateFile(gateDirs(repoRoot), "policy.json");
	if (typeof value !== "object" || value === null || Array.isArray(value)) {
		throw gateFail(file, "JSON", "root must be a JSON object");
	}
	const raw = value as Record<string, unknown>;
	// EV-75 — a policy.json that still carries `mode` gets the dedicated
	// migration FAIL, not the generic unknown-key copy: the message names the
	// file, the key, and the gate.mode replacement in .council.json. It sits
	// BEFORE the loop (which is JSON insertion-order dependent, so an in-loop
	// branch would let a sibling unknown key inserted first mask the pointer)
	// and before all value validation, and is a bare `new Error`, NOT
	// gateFail — gateFail's tail ("set a valid value or remove the key to use
	// the packaged default") is wrong advice for this key. The detail is
	// newline-sanitized inline like gateFail does; there is no helper.
	if ("mode" in raw) {
		const configFile = path.join(repoRoot, COUNCIL_CONFIG_FILE);
		const detail = `unknown key; gate enablement moved to gate.mode in ${configFile} — remove this key and set gate.mode there`;
		throw new Error(`FAIL: ${file} has an invalid mode — ${detail.replace(/[\r\n]+/g, " ")}`);
	}
	for (const key of Object.keys(raw)) {
		if (!(key in ALLOWED_POLICY_KEYS)) {
			throw gateFail(file, key, `unknown key; expected one of ${Object.keys(ALLOWED_POLICY_KEYS).join(", ")}`);
		}
	}
	// EV-64 (PO ruling Q1 clause 1): present ⇒ validated unconditionally, in
	// every mode — an invalid value must never lie dormant waiting to become
	// live when the consumer flips the mode on. This runs BEFORE mode
	// resolution can short-circuit anything.
	let gateStateBudgetTokens: number | undefined;
	if (raw.gateStateBudgetTokens !== undefined) {
		const v = raw.gateStateBudgetTokens;
		if (typeof v !== "number" || !Number.isInteger(v) || v <= 0) {
			throw gateFail(file, "gateStateBudgetTokens", `expected a positive integer, found ${JSON.stringify(v)}`);
		}
		gateStateBudgetTokens = v;
	}
	const policyVersion = nonEmptyString(file, "policyVersion", raw.policyVersion);
	const model = nonEmptyString(file, "model", raw.model);
	const endpoint = nonEmptyString(file, "endpoint", raw.endpoint);
	// EV-64 (PO ruling Q1 clause 2): the key is legal in its absence only on
	// the off path. The copy drops the template's "remove the key" advice —
	// wrong for an absent key under whole-file shadowing (removing the key
	// from a repo-local file cannot summon the packaged value; first-hit
	// whole-file means no merge). `mode` is the RESOLVED config mode, never
	// re-derived from policy.json (which no longer carries one).
	if (gateStateBudgetTokens === undefined && mode !== "off") {
		throw new Error(
			`FAIL: ${file} has an invalid gateStateBudgetTokens — the key is absent but the resolved mode is "${mode}" (an off-mode policy may omit it) — set a valid value`,
		);
	}
	return gateStateBudgetTokens === undefined
		? { policyVersion, mode, model, endpoint }
		: { policyVersion, mode, model, endpoint, gateStateBudgetTokens };
}

const POLICY_KEYS = ["policyVersion", "model", "endpoint", "gateStateBudgetTokens"] as const;

const ALLOWED_POLICY_KEYS: Record<string, true> = Object.fromEntries(
	POLICY_KEYS.map((k) => [k, true as const]),
);

const QUESTION_KEYS = ["type", "instructions", "criteria"] as const;
const ALLOWED_QUESTION_KEYS: Record<string, true> = Object.fromEntries(
	QUESTION_KEYS.map((k) => [k, true as const]),
);
const QUESTION_SET_KEYS = ["version", "questions"] as const;
const ALLOWED_QUESTION_SET_KEYS: Record<string, true> = Object.fromEntries(
	QUESTION_SET_KEYS.map((k) => [k, true as const]),
);
const QUESTION_TYPES = ["choice", "noul", "score"] as const;

/** Load the gate's question set: repo-local override whole-file, else the
 * packaged default. The `criteria` shape is per-type and never smoothed:
 * option→description record for `choice`/`noul`, ordered criterion strings
 * for `score` (EV-65's request shape, validated here at the data surface). */
export function loadGateQuestions(repoRoot: string): GateQuestionSet {
	const { file, value } = readGateFile(gateDirs(repoRoot), "questions.json");
	if (typeof value !== "object" || value === null || Array.isArray(value)) {
		throw gateFail(file, "JSON", "root must be a JSON object");
	}
	const raw = value as Record<string, unknown>;
	for (const key of Object.keys(raw)) {
		if (!(key in ALLOWED_QUESTION_SET_KEYS)) {
			throw gateFail(file, key, `unknown key; expected one of ${QUESTION_SET_KEYS.join(", ")}`);
		}
	}
	const version = nonEmptyString(file, "version", raw.version);
	if (typeof raw.questions !== "object" || raw.questions === null || Array.isArray(raw.questions)) {
		throw gateFail(file, "questions", "expected a record keyed by question id");
	}
	const rawQuestions = raw.questions as Record<string, unknown>;
	const ids = Object.keys(rawQuestions);
	if (ids.length === 0) {
		throw gateFail(file, "questions", "expected at least one question, found 0");
	}
	const questions: Record<string, GateQuestion> = {};
	for (const id of ids) {
		const q = rawQuestions[id];
		if (typeof q !== "object" || q === null || Array.isArray(q)) {
			throw gateFail(file, `questions.${id}`, "expected a question object");
		}
		questions[id] = validateGateQuestion(file, `questions.${id}`, q as Record<string, unknown>);
	}
	return { version, questions };
}

/** EV-78: `allowedTypes` parameterizes the admitted type set INSIDE the
 * validator (never in a wrapper, which would leak the gate's three-value
 * expected-list into a sibling's FAIL copy). The default keeps the card
 * gate's call sites byte-identical. */
function validateGateQuestion(
	file: string,
	keyPrefix: string,
	raw: Record<string, unknown>,
	allowedTypes: readonly GateQuestionType[] = QUESTION_TYPES,
): GateQuestion {
	for (const key of Object.keys(raw)) {
		if (!(key in ALLOWED_QUESTION_KEYS)) {
			throw gateFail(file, `${keyPrefix}.${key}`, `unknown key; expected one of ${QUESTION_KEYS.join(", ")}`);
		}
	}
	if (typeof raw.type !== "string" || !allowedTypes.includes(raw.type as GateQuestionType)) {
		throw gateFail(
			file,
			`${keyPrefix}.type`,
			`expected one of ${allowedTypes.map((t) => JSON.stringify(t)).join(", ")}, found ${JSON.stringify(raw.type)}`,
		);
	}
	const type = raw.type as GateQuestionType;
	const instructions = nonEmptyString(file, `${keyPrefix}.instructions`, raw.instructions);
	const criteriaKey = `${keyPrefix}.criteria`;
	let criteria: Record<string, string> | string[];
	if (type === "score") {
		if (!Array.isArray(raw.criteria) || raw.criteria.length === 0 || raw.criteria.some((c) => typeof c !== "string" || c.trim() === "")) {
			throw gateFail(file, criteriaKey, `expected an ordered array of criterion strings, found ${describeShape(raw.criteria)}`);
		}
		criteria = raw.criteria as string[];
	} else {
		if (typeof raw.criteria !== "object" || raw.criteria === null || Array.isArray(raw.criteria)) {
			throw gateFail(file, criteriaKey, `expected an option-to-description record, found ${describeShape(raw.criteria)}`);
		}
		const rec = raw.criteria as Record<string, unknown>;
		const options = Object.keys(rec);
		if (options.length === 0) {
			throw gateFail(file, criteriaKey, "expected at least one criterion, found 0");
		}
		for (const opt of options) {
			nonEmptyString(file, `${criteriaKey}.${opt}`, rec[opt]);
		}
		criteria = rec as Record<string, string>;
	}
	return { type, instructions, criteria };
}

function describeShape(v: unknown): string {
	if (Array.isArray(v)) return `an array of length ${v.length}`;
	if (typeof v === "object" && v !== null) return "an object";
	return JSON.stringify(v);
}

// ---------------------------------------------------------------------------
// EV-63 — the pure decision function and its data-driven decision policy.
//
// The decision lives in code (control flow is never a model-chosen next
// action and never a loop); its coefficients live in data, so EV-72's
// pre-registered threshold tuning is a data edit, never a prompt edit.
// `decision.json` follows the exact EV-62 packaged-default-plus-repo-override
// pattern: first-hit whole-file resolution over the same `gateDirs`, fail-loud
// single-line validation, no field-level merge.
//
// Data conventions (declared once, here):
//  - every weighted question names its MECHANICAL option (`mechanical`);
//  - a `noul` answer's `probability` is the probability of the criterion
//    option named by `noulProbabilityOf` (the packaged set's "yes"); the
//    opposite side's probability is `1 - probability`;
//  - a question's mechanical score is P(mechanical option);
//  - override rules name {question, option, basis} — the criterion option
//    whose SELECTION fires the hard override.
// ---------------------------------------------------------------------------

/** The resolved execution modes (EPIC-13). Stored in the ledger's
 * `resolvedMode` as these exact strings. */
export const GATE_DECISION_MODES = ["Deliberate", "Verify", "Direct"] as const;
export type GateDecisionMode = (typeof GATE_DECISION_MODES)[number];

/** R4 (binding Phase-1 ruling): Deliberate = full panel; Verify = owner +
 * skeptic + judge (adversary + ruling authority); Direct = owner only — no
 * judge, the test suite is that mode's only gate. The owner is always first
 * and is never removed; the two invariant roles (owner, judge) survive in
 * every mode that dispatches them (Direct dispatches neither deliberation
 * nor judge, so it is exempt by the ruling, not by omission). Roster
 * composition is a binding ruling, not tuning data — it never lives in
 * decision.json. */
export const MODE_PANELS: Record<GateDecisionMode, readonly string[]> = {
	Deliberate: ["owner", "skeptic", "principal", "designer", "product-owner", "consolidator", "judge"],
	Verify: ["owner", "skeptic", "judge"],
	Direct: ["owner"],
};

/** A hard deterministic override: when the named question's answer selects
 * the named option, the card deliberates regardless of the composite. */
export interface GateOverrideRule {
	question: string;
	option: string;
	/** Short human reason for the basis line, e.g. "one-way door". */
	basis: string;
}

export interface GateDecisionPolicy {
	version: string;
	/** question id → composite weight (positive). */
	weights: Record<string, number>;
	/** question id → the criterion option that counts as mechanical. */
	mechanical: Record<string, string>;
	/** Confidence floors for the two answer types that report one. */
	floors: { choice: number; score: number };
	/** Certainty floor for noul answers (they carry no confidence). */
	noulThreshold: number;
	/** The criterion option whose probability a noul answer's `probability`
	 * field carries. */
	noulProbabilityOf: string;
	/** Mode thresholds over the raw weighted composite. */
	thresholds: { verify: number; direct: number };
	overrides: GateOverrideRule[];
}

const DECISION_KEYS = [
	"version",
	"weights",
	"mechanical",
	"floors",
	"noulThreshold",
	"noulProbabilityOf",
	"thresholds",
	"overrides",
] as const;
const ALLOWED_DECISION_KEYS: Record<string, true> = Object.fromEntries(DECISION_KEYS.map((k) => [k, true as const]));

function unitNumber(file: string, key: string, v: unknown, min: number): number {
	if (typeof v !== "number" || !Number.isFinite(v) || v < min || v > 1) {
		throw gateFail(file, key, `expected a number in [${min}, 1], found ${JSON.stringify(v)}`);
	}
	return v;
}

/** FLLWUP-74 class 4 — the three strings decide() interpolates into a basis
 * line (overrides[i].question/option/basis) must be single-line; the input is
 * refused, never sanitized, and the message deliberately drops the "set a
 * valid value" tail (for a multi-line string there is no in-place valid
 * value). Deliberately NOT gateFail: the raw check runs before any newline
 * flattener could hide the cause. */
function basisSafeString(file: string, key: string, v: string): void {
	if (/[\r\n]/.test(v)) {
		throw new Error(`FAIL: ${file} has an invalid ${key} — value contains a line break; basis lines must be single-line`);
	}
}

/** Load the decision policy: repo-local override whole-file, else the packaged
 * default — the same first-hit resolution and fail-loud single-line posture
 * as the EV-62 policy/question loaders. */
export function loadGateDecision(repoRoot: string): GateDecisionPolicy {
	const { file, value } = readGateFile(gateDirs(repoRoot), "decision.json");
	if (typeof value !== "object" || value === null || Array.isArray(value)) {
		throw gateFail(file, "JSON", "root must be a JSON object");
	}
	const raw = value as Record<string, unknown>;
	for (const key of Object.keys(raw)) {
		if (!(key in ALLOWED_DECISION_KEYS)) {
			throw gateFail(file, key, `unknown key; expected one of ${DECISION_KEYS.join(", ")}`);
		}
	}
	const version = nonEmptyString(file, "version", raw.version);
	if (typeof raw.weights !== "object" || raw.weights === null || Array.isArray(raw.weights)) {
		throw gateFail(file, "weights", "expected a record keyed by question id");
	}
	const weights = raw.weights as Record<string, unknown>;
	const weightIds = Object.keys(weights);
	if (weightIds.length === 0) {
		throw gateFail(file, "weights", "expected at least one weighted question, found 0");
	}
	for (const id of weightIds) {
		const w = weights[id];
		if (typeof w !== "number" || !Number.isFinite(w) || w <= 0) {
			throw gateFail(file, `weights.${id}`, `expected a positive finite number, found ${JSON.stringify(w)}`);
		}
	}
	const typedWeights: Record<string, number> = {};
	for (const id of weightIds) typedWeights[id] = weights[id] as number;
	if (typeof raw.mechanical !== "object" || raw.mechanical === null || Array.isArray(raw.mechanical)) {
		throw gateFail(file, "mechanical", "expected a record keyed by question id");
	}
	const mechanical = raw.mechanical as Record<string, unknown>;
	const mechIds = Object.keys(mechanical);
	if (mechIds.length !== weightIds.length || mechIds.some((id) => !(id in weights))) {
		throw gateFail(file, "mechanical", `expected exactly the weighted question ids (${weightIds.join(", ")}), found ${mechIds.join(", ") || "none"}`);
	}
	for (const id of mechIds) {
		nonEmptyString(file, `mechanical.${id}`, mechanical[id]);
	}
	const typedMechanical: Record<string, string> = {};
	for (const id of mechIds) typedMechanical[id] = mechanical[id] as string;
	if (typeof raw.floors !== "object" || raw.floors === null || Array.isArray(raw.floors)) {
		throw gateFail(file, "floors", "expected an object with choice and score floors");
	}
	const floors = raw.floors as Record<string, unknown>;
	for (const key of Object.keys(floors)) {
		if (key !== "choice" && key !== "score") {
			throw gateFail(file, `floors.${key}`, "unknown sub-key; expected one of choice, score");
		}
	}
	const choiceFloor = unitNumber(file, "floors.choice", floors.choice, 0);
	const scoreFloor = unitNumber(file, "floors.score", floors.score, 0);
	const noulThreshold = unitNumber(file, "noulThreshold", raw.noulThreshold, 0);
	const noulProbabilityOf = nonEmptyString(file, "noulProbabilityOf", raw.noulProbabilityOf);
	if (typeof raw.thresholds !== "object" || raw.thresholds === null || Array.isArray(raw.thresholds)) {
		throw gateFail(file, "thresholds", "expected an object with verify and direct thresholds");
	}
	const thresholds = raw.thresholds as Record<string, unknown>;
	for (const key of Object.keys(thresholds)) {
		if (key !== "verify" && key !== "direct") {
			throw gateFail(file, `thresholds.${key}`, "unknown sub-key; expected one of verify, direct");
		}
	}
	// FLLWUP-74 class 1: verify must be strictly positive — verify 0 lets
	// decide() re-derive a failed call as Deliberate ("composite 0.00 ≥ verify
	// threshold 0.00") while the ledger records otherwise. direct keeps >= 0.
	const v = thresholds.verify;
	if (typeof v !== "number" || !Number.isFinite(v) || v <= 0) {
		throw gateFail(file, "thresholds.verify", `expected a finite number > 0, found ${JSON.stringify(v)}`);
	}
	const directRaw = thresholds.direct;
	if (typeof directRaw !== "number" || !Number.isFinite(directRaw) || directRaw < 0) {
		throw gateFail(file, "thresholds.direct", `expected a finite non-negative number, found ${JSON.stringify(directRaw)}`);
	}
	const verifyThreshold = v;
	const directThreshold = directRaw;
	if (verifyThreshold > directThreshold) {
		throw gateFail(file, "thresholds", `verify must be ≤ direct, found verify ${verifyThreshold} > direct ${directThreshold}`);
	}
	if (!Array.isArray(raw.overrides)) {
		throw gateFail(file, "overrides", "expected an array of override rules");
	}
	const overrides: GateOverrideRule[] = [];
	for (const [i, o] of raw.overrides.entries()) {
		if (typeof o !== "object" || o === null || Array.isArray(o)) {
			throw gateFail(file, `overrides.${i}`, "expected an override rule object");
		}
		const rule = o as Record<string, unknown>;
		for (const k of ["question", "option", "basis"] as const) {
			if (typeof rule[k] !== "string" || rule[k].trim() === "") {
				throw gateFail(file, `overrides.${i}.${k}`, `expected a non-empty string, found ${JSON.stringify(rule[k])}`);
			}
			// FLLWUP-74 class 4 BEFORE the class-3 referential check: the shape
			// defect is the more local one and its pinned bytes must win.
			basisSafeString(file, `overrides.${i}.${k}`, rule[k] as string);
		}
		// FLLWUP-74 class 3: a rule whose question id is absent from weights can
		// never fire — refused, not silently dead. Weights parse above. Own keys
		// only: `in` would pass prototype-key collisions ("toString", ...) clean.
		if (!weightIds.includes(rule.question as string)) {
			throw gateFail(
				file,
				`overrides.${i}.question`,
				`question id ${JSON.stringify(rule.question)} is not declared in weights (expected one of ${weightIds.join(", ")})`,
			);
		}
		overrides.push({ question: rule.question as string, option: rule.option as string, basis: rule.basis as string });
	}
	return {
		version,
		weights: typedWeights,
		mechanical: typedMechanical,
		floors: { choice: choiceFloor, score: scoreFloor },
		noulThreshold,
		noulProbabilityOf,
		thresholds: { verify: verifyThreshold, direct: directThreshold },
		overrides,
	};
}

// ---------------------------------------------------------------------------
// EV-78 — the follow-up review's data surface: its typed question set and
// decision policy as packaged, repo-overridable data under
// `council/gate/followup/` (EPIC-10). Sibling loaders to the card gate's,
// mirroring them arm for arm: the same first-hit whole-file resolution over
// `gateDirs(repoRoot, "followup")` and the same fail-loud single-line
// posture. The domain deltas are the binding ruling's (2026-09-21):
//  - a three-value disposition vocabulary `File|Merge|Drop` — File is the
//    composite's else-arm, never declared in data;
//  - `countedOption` (renamed from the gate's `mechanical`): the
//    redundant-evidence option, so the composite drives AWAY from File as
//    redundancy rises — the inverse of the gate's valence. A followup policy
//    carrying `mechanical` is an unknown-key FAIL — the rename is real, not
//    an alias;
//  - `thresholds` is the named-key `{merge, drop}` object with a STRICT
//    `merge < drop` ordering (equality would empty the Merge band) — the
//    array shape fails loud on the shape line;
//  - override dispositions are restricted to `{Merge, Drop}` — File is
//    unreachable by override (the floors and the below-merge composite arm
//    own it); the FAIL's expected list names exactly "Merge", "Drop".
// No `followup/policy.json` ever: the followup shares
// `GATE_PINNED_MODEL`/endpoint, and the one on-disk budget stays
// `council/gate/policy.json` via `loadGatePolicy` (EV-80's seam). The
// behavioral exactly-one partition proof is `decideFollowup`'s (EV-79);
// this surface ships resolution + structural validation only.
// ---------------------------------------------------------------------------

/** The followup disposition vocabulary, spelled exactly this (EV-82 renders
 * these strings). File is never declared in data — it is the else-arm. */
export const FOLLOWUP_DISPOSITIONS = ["File", "Merge", "Drop"] as const;
export type FollowupDisposition = (typeof FOLLOWUP_DISPOSITIONS)[number];

/** Ruling Q2: the override lane's disposition is a declared subset — File is
 * unreachable by override. */
export type FollowupOverrideDisposition = Exclude<FollowupDisposition, "File">;

/** The override lane admits only the destructive dispositions (Q2). */
const FOLLOWUP_OVERRIDE_DISPOSITIONS = ["Merge", "Drop"] as const;

/** The followup's admitted question types: `score` is refused — the
 * followup's floors vocabulary covers `choice` only, and a score question's
 * ordered legend has no reader in this domain. */
const FOLLOWUP_QUESTION_TYPES: readonly GateQuestionType[] = ["choice", "noul"];

/** A hard deterministic followup override: when the named question's answer
 * selects the named option, the composite is bypassed for the named
 * disposition (Merge or Drop only — Q2). */
export interface FollowupOverrideRule {
	question: string;
	option: string;
	/** Short human reason for the basis line, e.g. "already resolved". */
	basis: string;
	disposition: FollowupOverrideDisposition;
}

export interface FollowupDecisionPolicy {
	version: string;
	/** question id → composite weight (positive). */
	weights: Record<string, number>;
	/** question id → the criterion option that counts as redundant evidence
	 * (renamed from the gate's `mechanical`; the valence is inverted — the
	 * composite drives away from File as redundancy rises). */
	countedOption: Record<string, string>;
	/** Confidence floors for the followup's floored answer types — exactly
	 * `choice` (`noul` carries noulThreshold instead, as shipped). */
	floors: { choice: number };
	/** Certainty floor for noul answers (they carry no confidence). */
	noulThreshold: number;
	/** The criterion option whose probability a noul answer's `probability`
	 * field carries. */
	noulProbabilityOf: string;
	/** Merge/Drop thresholds over the raw weighted composite. File =
	 * composite < merge (the else-arm, never declared); Merge =
	 * [merge, drop); Drop = ≥ drop. Strict `merge < drop` — equality would
	 * empty the Merge band. */
	thresholds: { merge: number; drop: number };
	overrides: FollowupOverrideRule[];
}

const FOLLOWUP_DECISION_KEYS = [
	"version",
	"weights",
	"countedOption",
	"floors",
	"noulThreshold",
	"noulProbabilityOf",
	"thresholds",
	"overrides",
] as const;
const ALLOWED_FOLLOWUP_DECISION_KEYS: Record<string, true> = Object.fromEntries(
	FOLLOWUP_DECISION_KEYS.map((k) => [k, true as const]),
);

const FOLLOWUP_OVERRIDE_KEYS = ["question", "option", "basis", "disposition"] as const;

/** Load the followup question set: the card gate's parse with the type set
 * restricted to choice/noul — a `score` question FAILs with the restricted
 * expected-list (O5). */
export function loadFollowupQuestions(repoRoot: string): GateQuestionSet {
	const { file, value } = readGateFile(gateDirs(repoRoot, "followup"), "questions.json");
	if (typeof value !== "object" || value === null || Array.isArray(value)) {
		throw gateFail(file, "JSON", "root must be a JSON object");
	}
	const raw = value as Record<string, unknown>;
	for (const key of Object.keys(raw)) {
		if (!(key in ALLOWED_QUESTION_SET_KEYS)) {
			throw gateFail(file, key, `unknown key; expected one of ${QUESTION_SET_KEYS.join(", ")}`);
		}
	}
	const version = nonEmptyString(file, "version", raw.version);
	if (typeof raw.questions !== "object" || raw.questions === null || Array.isArray(raw.questions)) {
		throw gateFail(file, "questions", "expected a record keyed by question id");
	}
	const rawQuestions = raw.questions as Record<string, unknown>;
	const ids = Object.keys(rawQuestions);
	if (ids.length === 0) {
		throw gateFail(file, "questions", "expected at least one question, found 0");
	}
	const questions: Record<string, GateQuestion> = {};
	for (const id of ids) {
		const q = rawQuestions[id];
		if (typeof q !== "object" || q === null || Array.isArray(q)) {
			throw gateFail(file, `questions.${id}`, "expected a question object");
		}
		questions[id] = validateGateQuestion(file, `questions.${id}`, q as Record<string, unknown>, FOLLOWUP_QUESTION_TYPES);
	}
	return { version, questions };
}

/** Load the followup decision policy: the card gate's parse mirrored arm for
 * arm, with the ruling's deltas (see the section comment above). */
export function loadFollowupDecision(repoRoot: string): FollowupDecisionPolicy {
	const { file, value } = readGateFile(gateDirs(repoRoot, "followup"), "decision.json");
	if (typeof value !== "object" || value === null || Array.isArray(value)) {
		throw gateFail(file, "JSON", "root must be a JSON object");
	}
	const raw = value as Record<string, unknown>;
	for (const key of Object.keys(raw)) {
		if (!(key in ALLOWED_FOLLOWUP_DECISION_KEYS)) {
			throw gateFail(file, key, `unknown key; expected one of ${FOLLOWUP_DECISION_KEYS.join(", ")}`);
		}
	}
	const version = nonEmptyString(file, "version", raw.version);
	// weights — the gate's parse verbatim.
	if (typeof raw.weights !== "object" || raw.weights === null || Array.isArray(raw.weights)) {
		throw gateFail(file, "weights", "expected a record keyed by question id");
	}
	const weights = raw.weights as Record<string, unknown>;
	const weightIds = Object.keys(weights);
	if (weightIds.length === 0) {
		throw gateFail(file, "weights", "expected at least one weighted question, found 0");
	}
	for (const id of weightIds) {
		const w = weights[id];
		if (typeof w !== "number" || !Number.isFinite(w) || w <= 0) {
			throw gateFail(file, `weights.${id}`, `expected a positive finite number, found ${JSON.stringify(w)}`);
		}
	}
	const typedWeights: Record<string, number> = {};
	for (const id of weightIds) typedWeights[id] = weights[id] as number;
	// countedOption — the gate's `mechanical` shape with the ruling's O4
	// subject split: an EXTRA id fails naming `countedOption.<id>`; a MISSING
	// weighted id fails naming `countedOption`.
	if (typeof raw.countedOption !== "object" || raw.countedOption === null || Array.isArray(raw.countedOption)) {
		throw gateFail(file, "countedOption", "expected a record keyed by question id");
	}
	const countedOption = raw.countedOption as Record<string, unknown>;
	const countedIds = Object.keys(countedOption);
	for (const id of countedIds) {
		if (!(id in weights)) {
			throw gateFail(
				file,
				`countedOption.${id}`,
				`unknown question id; expected one of ${weightIds.join(", ")}, found ${JSON.stringify(id)}`,
			);
		}
	}
	if (countedIds.length !== weightIds.length) {
		throw gateFail(
			file,
			"countedOption",
			`expected exactly the weighted question ids (${weightIds.join(", ")}), found ${countedIds.join(", ") || "none"}`,
		);
	}
	for (const id of countedIds) {
		nonEmptyString(file, `countedOption.${id}`, countedOption[id]);
	}
	const typedCountedOption: Record<string, string> = {};
	for (const id of countedIds) typedCountedOption[id] = countedOption[id] as string;
	// floors — exactly `choice` (the followup's only floored type).
	if (typeof raw.floors !== "object" || raw.floors === null || Array.isArray(raw.floors)) {
		throw gateFail(file, "floors", "expected an object with the choice floor");
	}
	const floors = raw.floors as Record<string, unknown>;
	for (const key of Object.keys(floors)) {
		if (key !== "choice") {
			throw gateFail(file, `floors.${key}`, "unknown sub-key; expected one of choice");
		}
	}
	const choiceFloor = unitNumber(file, "floors.choice", floors.choice, 0);
	const noulThreshold = unitNumber(file, "noulThreshold", raw.noulThreshold, 0);
	const noulProbabilityOf = nonEmptyString(file, "noulProbabilityOf", raw.noulProbabilityOf);
	// thresholds — ruling Q1: the named-key object. The Array.isArray guard is
	// what keeps the JS `typeof [] === "object"` trap handled: an array value
	// (and a null/string) fails loud on the shape line naming `thresholds`.
	if (typeof raw.thresholds !== "object" || raw.thresholds === null || Array.isArray(raw.thresholds)) {
		throw gateFail(file, "thresholds", "expected an object with merge and drop thresholds");
	}
	const thresholds = raw.thresholds as Record<string, unknown>;
	for (const key of Object.keys(thresholds)) {
		if (key !== "merge" && key !== "drop") {
			throw gateFail(file, `thresholds.${key}`, "unknown sub-key; expected one of merge, drop");
		}
	}
	// FLLWUP-74 class-1 mirror: merge must be strictly positive — merge 0
	// would empty File's else-arm (composite < merge). drop keeps ≥ 0.
	const mergeRaw = thresholds.merge;
	if (typeof mergeRaw !== "number" || !Number.isFinite(mergeRaw) || mergeRaw <= 0) {
		throw gateFail(file, "thresholds.merge", `expected a finite number > 0, found ${JSON.stringify(mergeRaw)}`);
	}
	const dropRaw = thresholds.drop;
	if (typeof dropRaw !== "number" || !Number.isFinite(dropRaw) || dropRaw < 0) {
		throw gateFail(file, "thresholds.drop", `expected a finite non-negative number, found ${JSON.stringify(dropRaw)}`);
	}
	// Strict — the shipped `verify ≤ direct` tightened one numeral: equality
	// would empty the Merge band ([merge, drop)).
	if (!(mergeRaw < dropRaw)) {
		throw gateFail(file, "thresholds", `merge must be < drop, found merge ${mergeRaw} ≥ drop ${dropRaw}`);
	}
	// overrides — the ruling Q2 lane.
	if (!Array.isArray(raw.overrides)) {
		throw gateFail(file, "overrides", "expected an array of override rules");
	}
	const overrides: FollowupOverrideRule[] = [];
	for (const [i, o] of raw.overrides.entries()) {
		if (typeof o !== "object" || o === null || Array.isArray(o)) {
			throw gateFail(file, `overrides.${i}`, "expected an override rule object");
		}
		const rule = o as Record<string, unknown>;
		for (const k of Object.keys(rule)) {
			if (!(FOLLOWUP_OVERRIDE_KEYS as readonly string[]).includes(k)) {
				throw gateFail(file, `overrides.${i}.${k}`, `unknown key; expected one of ${FOLLOWUP_OVERRIDE_KEYS.join(", ")}`);
			}
		}
		for (const k of ["question", "option", "basis"] as const) {
			if (typeof rule[k] !== "string" || rule[k].trim() === "") {
				throw gateFail(file, `overrides.${i}.${k}`, `expected a non-empty string, found ${JSON.stringify(rule[k])}`);
			}
			// FLLWUP-74 class 4 BEFORE the class-3 referential check, as shipped:
			// the shape defect is the more local one and its pinned bytes must win.
			basisSafeString(file, `overrides.${i}.${k}`, rule[k] as string);
		}
		// Ruling Q2: a missing, `File`, or otherwise unknown disposition fails
		// naming the field, with the expected list exactly "Merge", "Drop" — the
		// token File is absent (File is the else-arm, never an override).
		const d = rule.disposition;
		if (
			typeof d !== "string" ||
			d.trim() === "" ||
			!(FOLLOWUP_OVERRIDE_DISPOSITIONS as readonly string[]).includes(d)
		) {
			throw gateFail(
				file,
				`overrides.${i}.disposition`,
				`expected one of ${FOLLOWUP_OVERRIDE_DISPOSITIONS.map((x) => JSON.stringify(x)).join(", ")}, found ${JSON.stringify(d)}`,
			);
		}
		// FLLWUP-74 class 3: a rule whose question id is absent from weights can
		// never fire — refused, not silently dead.
		if (!weightIds.includes(rule.question as string)) {
			throw gateFail(
				file,
				`overrides.${i}.question`,
				`question id ${JSON.stringify(rule.question)} is not declared in weights (expected one of ${weightIds.join(", ")})`,
			);
		}
		overrides.push({
			question: rule.question as string,
			option: rule.option as string,
			basis: rule.basis as string,
			disposition: d as FollowupOverrideDisposition,
		});
	}
	return {
		version,
		weights: typedWeights,
		countedOption: typedCountedOption,
		floors: { choice: choiceFloor },
		noulThreshold,
		noulProbabilityOf,
		thresholds: { merge: mergeRaw, drop: dropRaw },
		overrides,
	};
}

/** The gate's decision: how the card runs (`mode`), which roles run
 * (`include`), and the deterministic one-line reason (`basis`). */
export interface GateDecision {
	mode: GateDecisionMode;
	include: readonly string[];
	basis: string;
}

/** Two fixed decimals — the basis line must be byte-stable across calls and
 * across re-derivations from the ledger, so float formatting is pinned. */
function fmt(v: number): string {
	return v.toFixed(2);
}

/** The probability of one criterion option side for an answer.
 * choice/score: the transport's `probabilities` map (keyed by option label or
 * criterion index). noul: the answer's `probability` is P(noulProbabilityOf);
 * the opposite side is 1 - p. */
function sideProbability(answer: GateAnswer, id: string, option: string, policy: GateDecisionPolicy): number {
	if (answer.type === "noul") {
		const p = answer.probability;
		if (typeof p !== "number" || !Number.isFinite(p) || p < 0 || p > 1) {
			throw new Error(`gate: decide — answer ${id} of type noul is missing a usable probability (expected a number in [0, 1])`);
		}
		return option === policy.noulProbabilityOf ? p : 1 - p;
	}
	const probs = answer.probabilities;
	const v = probs && typeof probs === "object" ? (probs as Record<string, unknown>)[option] : undefined;
	return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

/** Whether a hard override fires for this answer: deterministic on the ANSWER
 * itself (chosen label / score index / favored noul side), never on a
 * probability comparison a model could re-argue. */
function overrideFires(answer: GateAnswer, id: string, option: string, policy: GateDecisionPolicy): boolean {
	switch (answer.type) {
		case "choice":
			return answer.value === option;
		case "score":
			return String(answer.score) === option;
		case "noul":
			return sideProbability(answer, id, option, policy) > 0.5;
		default:
			throw new Error(`gate: decide — answer ${id} has unknown type ${JSON.stringify(answer.type)}`);
	}
}

/** The pure decision function (EV-63): a function of the transport's answers
 * and the decision policy ONLY — no fs, no network, no model call, no loop.
 * Order is fixed and load-bearing:
 *   1. hard deterministic overrides — one-way doors, public contracts and
 *      data changes, cross-module blast radius bypass the model entirely and
 *      return Deliberate regardless of what the answers say;
 *   2. confidence floors — choice/score answers below their floor escalate
 *      rather than guess; a noul answer has NO confidence field, so its
 *      certainty max(p, 1-p) is compared against the policy's own noul
 *      threshold instead of being silently treated as confident;
 *   3. the weighted composite — a reduced mode (Verify/Direct) requires
 *      POSITIVE evidence (composite ≥ threshold), not the absence of a
 *      warning; unanswered questions contribute 0 (raw sum, no
 *      normalization), so missing evidence drags toward Deliberate, the safe
 *      side, never toward a cheaper mode.
 * Skipping deliberation is the dangerous error and deliberating
 * unnecessarily is only expensive — every branch resolves toward safety.
 * Returns the mode AND the seat-inclusion set: metering panel composition
 * and metering the mode are the same decision, and splitting them would
 * create two sources of truth for the roster (R4 mapping via MODE_PANELS:
 * the owner is never removed; every reduced set that dispatches seats keeps
 * an adversary and a ruling authority; Direct's only gate is the test suite). */
export function decide(
	answers: Record<string, GateAnswer | null>,
	policy: GateDecisionPolicy,
): GateDecision {
	// 1. Hard overrides — bypass the model entirely, in declared order.
	for (const rule of policy.overrides) {
		const answer = answers[rule.question];
		if (!answer) continue; // an unanswered question fires nothing
		if (overrideFires(answer, rule.question, rule.option, policy)) {
			return {
				mode: "Deliberate",
				include: MODE_PANELS.Deliberate,
				basis: `${rule.question}? ${rule.option} (${rule.basis})`,
			};
		}
	}
	// 2. Confidence floors and the noul threshold — escalate rather than guess.
	// First failure in Object.keys(answers) order wins (deterministic).
	for (const id of Object.keys(answers)) {
		const answer = answers[id];
		if (!answer) continue; // asked-but-unanswered: absent, never a zero
		if (answer.type === "choice" || answer.type === "score") {
			const floor = policy.floors[answer.type];
			const confidence = answer.confidence;
			if (typeof confidence !== "number" || !Number.isFinite(confidence)) {
				throw new Error(`gate: decide — answer ${id} of type ${answer.type} is missing a numeric confidence`);
			}
			if (confidence < floor) {
				return {
					mode: "Deliberate",
					include: MODE_PANELS.Deliberate,
					basis: `${id}: confidence ${fmt(confidence)} < ${answer.type} floor ${fmt(floor)}`,
				};
			}
		} else if (answer.type === "noul") {
			const p = sideProbability(answer, id, policy.noulProbabilityOf, policy); // validates shape
			const certainty = Math.max(p, 1 - p);
			if (certainty < policy.noulThreshold) {
				return {
					mode: "Deliberate",
					include: MODE_PANELS.Deliberate,
					basis: `${id}: certainty ${fmt(certainty)} < noul threshold ${fmt(policy.noulThreshold)}`,
				};
			}
		} else {
			throw new Error(`gate: decide — answer ${id} has unknown type ${JSON.stringify(answer.type)}`);
		}
	}
	// 3. The weighted composite — a reduced mode needs positive evidence.
	let composite = 0;
	for (const id of Object.keys(policy.weights)) {
		const answer = answers[id];
		if (!answer) continue; // missing evidence contributes 0 → drags toward Deliberate
		composite += policy.weights[id] * sideProbability(answer, id, policy.mechanical[id], policy);
	}
	if (composite >= policy.thresholds.direct) {
		return {
			mode: "Direct",
			include: MODE_PANELS.Direct,
			basis: `composite ${fmt(composite)} ≥ direct threshold ${fmt(policy.thresholds.direct)}`,
		};
	}
	if (composite >= policy.thresholds.verify) {
		return {
			mode: "Verify",
			include: MODE_PANELS.Verify,
			basis: `composite ${fmt(composite)} ≥ verify threshold ${fmt(policy.thresholds.verify)}`,
		};
	}
	return {
		mode: "Deliberate",
		include: MODE_PANELS.Deliberate,
		basis: `composite ${fmt(composite)} < verify threshold ${fmt(policy.thresholds.verify)}`,
	};
}
