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
// never a stack trace. R3 (binding): the packaged default ships
// `mode: "off"` — with the packaged default the gate issues no gate call and
// writes no ledger line; consumers opt in per repo via a repo-local
// policy.json. Tests that exercise a non-off mode set it explicitly and never
// rely on the packaged default being on. The model id is pinned to a
// versioned id — confidence floors tuned against a version must not silently
// move when the alias rolls.
import * as fs from "node:fs";
import * as path from "node:path";
import { CONFIG_DIR_NAME } from "@earendil-works/pi-coding-agent";
import type { GateAnswer } from "./gate-ledger.ts";
export type { GateAnswer } from "./gate-ledger.ts";
import { PKG_ROOT } from "./seats.ts";

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

/** Repo override first, packaged default second — the seatDirs pattern. */
function gateDirs(repoRoot: string): string[] {
	return [
		path.join(repoRoot, CONFIG_DIR_NAME, "council", "gate"),
		path.join(PKG_ROOT, "council", "gate"),
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
 * default. An absent `mode` key resolves to `off` (never to the packaged
 * file's literal mode — the repo file is validated and resolved standalone). */
export function loadGatePolicy(repoRoot: string): GatePolicy {
	const { file, value } = readGateFile(gateDirs(repoRoot), "policy.json");
	if (typeof value !== "object" || value === null || Array.isArray(value)) {
		throw gateFail(file, "JSON", "root must be a JSON object");
	}
	const raw = value as Record<string, unknown>;
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
	let mode: GateMode = "off"; // absent mode resolves to off
	if (raw.mode !== undefined) {
		if (typeof raw.mode !== "string" || !GATE_MODES.includes(raw.mode as GateMode)) {
			throw gateFail(
				file,
				"mode",
				`expected one of ${GATE_MODES.map((m) => JSON.stringify(m)).join(", ")}, found ${JSON.stringify(raw.mode)}`,
			);
		}
		mode = raw.mode as GateMode;
	}
	// EV-64 (PO ruling Q1 clause 2): the key is legal in its absence only on
	// the off path. The copy drops the template's "remove the key" advice —
	// wrong for an absent key under whole-file shadowing (removing the key
	// from a repo-local file cannot summon the packaged value; first-hit
	// whole-file means no merge).
	if (gateStateBudgetTokens === undefined && mode !== "off") {
		throw new Error(
			`FAIL: ${file} has an invalid gateStateBudgetTokens — the key is absent but the resolved mode is "${mode}" (an off-mode policy may omit it) — set a valid value`,
		);
	}
	return gateStateBudgetTokens === undefined
		? { policyVersion, mode, model, endpoint }
		: { policyVersion, mode, model, endpoint, gateStateBudgetTokens };
}

const POLICY_KEYS = ["mode", "policyVersion", "model", "endpoint", "gateStateBudgetTokens"] as const;

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

function validateGateQuestion(file: string, keyPrefix: string, raw: Record<string, unknown>): GateQuestion {
	for (const key of Object.keys(raw)) {
		if (!(key in ALLOWED_QUESTION_KEYS)) {
			throw gateFail(file, `${keyPrefix}.${key}`, `unknown key; expected one of ${QUESTION_KEYS.join(", ")}`);
		}
	}
	if (typeof raw.type !== "string" || !QUESTION_TYPES.includes(raw.type as GateQuestionType)) {
		throw gateFail(
			file,
			`${keyPrefix}.type`,
			`expected one of ${QUESTION_TYPES.map((t) => JSON.stringify(t)).join(", ")}, found ${JSON.stringify(raw.type)}`,
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
	const choiceFloor = unitNumber(file, "floors.choice", floors.choice, 0);
	const scoreFloor = unitNumber(file, "floors.score", floors.score, 0);
	const noulThreshold = unitNumber(file, "noulThreshold", raw.noulThreshold, 0);
	const noulProbabilityOf = nonEmptyString(file, "noulProbabilityOf", raw.noulProbabilityOf);
	if (typeof raw.thresholds !== "object" || raw.thresholds === null || Array.isArray(raw.thresholds)) {
		throw gateFail(file, "thresholds", "expected an object with verify and direct thresholds");
	}
	const thresholds = raw.thresholds as Record<string, unknown>;
	for (const t of ["verify", "direct"] as const) {
		if (typeof thresholds[t] !== "number" || !Number.isFinite(thresholds[t]) || thresholds[t] < 0) {
			throw gateFail(file, `thresholds.${t}`, `expected a finite non-negative number, found ${JSON.stringify(thresholds[t])}`);
		}
	}
	const verifyThreshold = thresholds.verify as number;
	const directThreshold = thresholds.direct as number;
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
