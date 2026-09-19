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
	return { policyVersion, mode, model, endpoint };
}

const POLICY_KEYS = ["mode", "policyVersion", "model", "endpoint"] as const;

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
