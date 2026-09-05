import * as fs from "node:fs";
import * as path from "node:path";
import { COUNCIL_CONFIG_FILE, THINKING_LEVELS, parseQualifiedModel } from "./seats.ts";
import type { AgentOverride } from "./seats.ts";
import type { CatalogueModel } from "./catalogue.ts";

/**
 * EV-24: the first `.council.json` write path. It validates a seat's (model,
 * thinking) selection against the flat catalogue `qualifiedId` set and
 * `THINKING_LEVELS`, then atomically merges `council.<seat>` into
 * `.council.json` as the object form `{ "model": "provider/id", "thinking":
 * "<level>" }` the loader already speaks.
 *
 * The write is a SPLICE, not a re-serialize: the seat value's byte span is
 * located with a string-aware scan (escaped quotes do not terminate strings,
 * so a string containing the literal seat name is never misread), and only
 * that span is replaced or a new one inserted. The `theme` section, every
 * other seat, unknown top-level keys, the file's own indentation, and the
 * trailing newline are byte-identical by construction — a whole-object
 * `JSON.stringify(x, null, 2)` would reformat the tab-indented committed file
 * on the first write and violate the "never disturbs the theme sibling"
 * contract (spec §2: scaffold and real `.council.json` are `^I`-tabbed).
 *
 * Validation is the writer's ONLY stricter-than-runtime surface, and it
 * mirrors the loader's grammar + dispatch's model-presence exactly: (1) model
 * must be a qualified `provider/id` (loader grammar, `parseQualifiedModel`);
 * (2) model must be in the catalogue `qualifiedId` set (dispatch's gate);
 * (3) `thinking` present must be a member of `THINKING_LEVELS` (loader
 * grammar). There is deliberately NO per-model capability check:
 * `getSupportedThinkingLevels` / `supportedThinkingLevels` are picker-only
 * (`extensions/catalogue.ts` is their sole consumer) and never a persistence
 * gate; the file loader checks grammar only, dispatch checks model presence
 * only, and pi's `clampThinkingLevel` clamps at spawn — a capability-invalid
 * value must be accepted and round-tripped here.
 *
 * Failure contract (asymmetry named here so it is intentional): validation
 * failures and malformed existing JSON return `{ ok: false, error }` and write
 * NOTHING (a mid-edit or unparseable file must never be clobbered). ONLY
 * filesystem failures throw: an unreadable target or an atomic-rename error
 * (EROFS/ENOSPC, target is a directory).
 */
export type WriteSeatOverrideResult = { ok: true } | { ok: false; error: string };

/** One JSON object member with the byte span of its key and value. */
interface Member {
	key: string;
	keyStart: number; // offset of the key's opening quote
	value: ValueNode;
}

/** Byte span + structure of one JSON value inside the raw file text. */
interface ValueNode {
	start: number; // offset of the value's first byte
	end: number; // one past the value's last byte
	kind: "object" | "array" | "string" | "scalar";
	members?: Member[]; // present when kind === "object"
}

function skipSpace(text: string, i: number): number {
	while (i < text.length && (text[i] === " " || text[i] === "\t" || text[i] === "\n" || text[i] === "\r")) i++;
	return i;
}

/** text[i] must be `"`. Returns one-past the closing quote, walking escapes:
 *  `\"` does not terminate the string and `\uXXXX` hex digits cannot. */
function scanString(text: string, i: number): number {
	i++;
	while (i < text.length) {
		const c = text[i];
		if (c === "\\") i += 2;
		else if (c === '"') return i + 1;
		else i++;
	}
	return i;
}

/** Consume a scalar (number / true / false / null). The JSON.parse gate
 *  guarantees the token is well-formed; this only needs its byte span. */
function scanScalar(text: string, i: number): number {
	while (i < text.length && /[-0-9a-zA-Z.+]/.test(text[i])) i++;
	return i;
}

/** Recursive-descent byte-span scan over an already-parse-valid JSON text.
 *  Strings (incl. escaped quotes) are skipped atomically, so a key never
 *  collides with the literal seat name appearing inside unrelated strings. */
function parseValue(text: string, i: number): { node: ValueNode; next: number } {
	const start = i;
	const c = text[i];
	if (c === '"') {
		const end = scanString(text, i);
		return { node: { start, end, kind: "string" }, next: end };
	}
	if (c === "{") {
		const members: Member[] = [];
		i = skipSpace(text, i + 1);
		if (text[i] === "}") {
			return { node: { start, end: i + 1, kind: "object", members }, next: i + 1 };
		}
		for (;;) {
			const keyStart = i;
			const keyEnd = scanString(text, i);
			const key = text.slice(keyStart + 1, keyEnd - 1);
			i = skipSpace(text, keyEnd); // text[i] === ":"
			i = skipSpace(text, i + 1);
			const parsed = parseValue(text, i);
			members.push({ key, keyStart, value: parsed.node });
			i = skipSpace(text, parsed.next);
			if (text[i] === ",") {
				i = skipSpace(text, i + 1);
				continue;
			}
			// text[i] === "}" — parse-valid input guarantees the loop ends here.
			return { node: { start, end: i + 1, kind: "object", members }, next: i + 1 };
		}
	}
	if (c === "[") {
		let depth = 0;
		for (;;) {
			if (i >= text.length) return { node: { start, end: i, kind: "array" }, next: i };
			const ch = text[i];
			if (ch === '"') {
				i = scanString(text, i);
				continue;
			}
			if (ch === "[") depth++;
			else if (ch === "]") {
				depth--;
				if (depth === 0) return { node: { start, end: i + 1, kind: "array" }, next: i + 1 };
			}
			i++;
		}
	}
	const end = scanScalar(text, i);
	return { node: { start, end, kind: "scalar" }, next: end };
}

function lineStartAt(text: string, at: number): number {
	let i = at - 1;
	while (i >= 0 && text[i] !== "\n") i--;
	return i + 1;
}

/** Leading whitespace of the line containing `at`. Empty when `at` is not the
 *  first token of its line (single-line objects). */
function lineIndentAt(text: string, at: number): string {
	const ls = lineStartAt(text, at);
	let j = ls;
	while (j < at && (text[j] === " " || text[j] === "\t")) j++;
	return text.slice(ls, j);
}

/**
 * §5.5 indent rule — deterministic and throw-free, in order: (1) strict-
 * majority indent unit across indented lines (tab-led vs space-led lines;
 * space-majority files emit the canonical 2-space unit); (2) else the
 * replaced seat block's own unit; (3) else tabs (the tab-indented seed).
 * Never throws over whitespace.
 */
function detectIndentUnit(text: string, seatBlockUnit?: string): string {
	let tabs = 0;
	let spaces = 0;
	for (const line of text.split("\n")) {
		const m = /^([ \t]+)\S/.exec(line);
		if (!m) continue;
		if (m[1][0] === "\t") tabs++;
		else spaces++;
	}
	if (tabs > spaces) return "\t";
	if (spaces > tabs) return "  ";
	return seatBlockUnit !== undefined && seatBlockUnit.length > 0 ? seatBlockUnit : "\t";
}

/** The replaced seat block's own indent unit — only meaningful when the old
 *  value is a multi-line object whose members sit exactly one unit deeper. */
function seatBlockUnit(text: string, value: ValueNode, keyLineIndent: string): string | undefined {
	if (value.kind !== "object" || value.members === undefined || value.members.length === 0) return undefined;
	const memberIndent = lineIndentAt(text, value.members[0].keyStart);
	if (!memberIndent.startsWith(keyLineIndent)) return undefined;
	const unit = memberIndent.slice(keyLineIndent.length);
	return unit.length > 0 ? unit : undefined;
}

/** The object form `{ "model": ..., "thinking": ... }`, model-before-thinking,
 *  members one `unit` deeper than `keyIndent`, closing at `keyIndent`; the
 *  `thinking` line is omitted entirely when absent. */
function emitSeatObject(keyIndent: string, unit: string, value: AgentOverride): string {
	const memberIndent = keyIndent + unit;
	const modelLine = `${memberIndent}"model": ${JSON.stringify(value.model!)}`;
	if (value.thinking === undefined) {
		return `{\n${modelLine}\n${keyIndent}}`;
	}
	return `{\n${modelLine},\n${memberIndent}"thinking": ${JSON.stringify(value.thinking)}\n${keyIndent}}`;
}

/** Existing thinking of `parsedDoc.council[seat]`: a string-shorthand
 *  `:suffix`, the object's `thinking` key, or an object-form `model`'s
 *  `:suffix` — the same parse rule `applySeatOverride` uses (thinking key >
 *  inline suffix), so preservation matches loader resolution (FLLWUP-10).
 *  Only members of THINKING_LEVELS are carried — an invalid level would keep
 *  the file un-loadable, so a broken value is dropped instead of byte-kept. */
function existingThinking(parsedDoc: unknown, seat: string): string | undefined {
	const council = (parsedDoc as Record<string, unknown>).council;
	if (typeof council !== "object" || council === null || Array.isArray(council)) return undefined;
	const raw = (council as Record<string, unknown>)[seat];
	if (typeof raw === "string") {
		const colon = raw.lastIndexOf(":");
		if (colon > 0 && THINKING_LEVELS.has(raw.slice(colon + 1))) return raw.slice(colon + 1);
		return undefined;
	}
	if (typeof raw === "object" && raw !== null && !Array.isArray(raw)) {
		const rec = raw as Record<string, unknown>;
		const t = rec.thinking;
		if (typeof t === "string" && THINKING_LEVELS.has(t)) return t;
		// FLLWUP-10: object-form `model` may carry the same `:suffix` the string
		// shorthand does; applySeatOverride parses it. Unknown/trailing suffixes
		// are dropped (no level) exactly like the string branch and the loader.
		const m = rec.model;
		if (typeof m === "string") {
			const colon = m.lastIndexOf(":");
			if (colon > 0 && THINKING_LEVELS.has(m.slice(colon + 1))) return m.slice(colon + 1);
		}
	}
	return undefined;
}

/** Permission bits of the existing target, so a tmp+rename never silently
 *  resets e.g. 0600 → default. Greenfield callers pass `undefined`. */
function existingMode(file: string): number | undefined {
	try {
		return fs.statSync(file).mode & 0o777;
	} catch {
		return undefined;
	}
}

/**
 * auth-store pattern (§5.6): recursive mkdir, unique tmp, chmod the tmp to
 * the existing target's mode BEFORE rename, then atomic rename. A rename
 * failure (EROFS/ENOSPC, target is a directory) THROWS — filesystem failures
 * are not convertible to `{ ok: false }`. Greenfield: no chmod — the default
 * umask applies; never explicit 0o600 (`.council.json` is a committed shared
 * file, not a secrets store).
 */
function writeAtomic(file: string, content: string, mode?: number): void {
	fs.mkdirSync(path.dirname(file), { recursive: true });
	const tmp = `${file}.tmp-${process.pid}-${Date.now()}`;
	fs.writeFileSync(tmp, content);
	if (mode !== undefined) fs.chmodSync(tmp, mode);
	fs.renameSync(tmp, file);
}

export function writeSeatOverride(args: {
	repoRoot: string;
	seat: string;
	model: string; // qualified "provider/id" — MUST match a catalogue qualifiedId
	thinking?: string; // when absent, existing thinking is PRESERVED
	catalogue: CatalogueModel[];
}): WriteSeatOverrideResult {
	const { repoRoot, seat, model, thinking, catalogue } = args;
	const where = "writeSeatOverride";

	// ---- 1. Validate (pure, I/O-free; nothing happens on any failure) ----
	let qualified: string;
	let inlineThinking: string | undefined;
	try {
		const parsed = parseQualifiedModel(model, where);
		qualified = parsed.model;
		inlineThinking = parsed.thinkingLevel;
	} catch (e) {
		return { ok: false, error: e instanceof Error ? e.message : String(e) };
	}
	if (!catalogue.some((c) => `${c.provider}/${c.id}` === qualified)) {
		return { ok: false, error: `${where}: model "${qualified}" is not in the available model catalogue` };
	}
	if (thinking !== undefined && !THINKING_LEVELS.has(thinking)) {
		return { ok: false, error: `${where}: thinking must be one of ${[...THINKING_LEVELS].join(", ")}` };
	}
	// Selection = explicit thinking key > inline `:suffix`; both per the loader
	// precedence (thinking key > :suffix). Absent either → merge keeps existing.
	const selection: AgentOverride = { model: qualified };
	if (thinking !== undefined) selection.thinking = thinking;
	else if (inlineThinking !== undefined) selection.thinking = inlineThinking;

	const file = path.join(repoRoot, COUNCIL_CONFIG_FILE);

	// ---- 2a. Greenfield: file absent — canonical 2-space + trailing newline ----
	if (!fs.existsSync(file)) {
		const doc = { council: { [seat]: selection } };
		writeAtomic(file, JSON.stringify(doc, null, 2) + "\n");
		return { ok: true };
	}

	// ---- 2b. Read + parse. Malformed / non-object root → refuse, never write. ----
	let text: string;
	try {
		text = fs.readFileSync(file, "utf-8");
	} catch (e) {
		throw e; // filesystem failure — throws by design
	}
	let parsedDoc: unknown;
	try {
		parsedDoc = JSON.parse(text);
	} catch (e) {
		return { ok: false, error: `${file}: malformed JSON — ${e instanceof Error ? e.message : String(e)}` };
	}
	if (typeof parsedDoc !== "object" || parsedDoc === null || Array.isArray(parsedDoc)) {
		return { ok: false, error: `${file}: root must be a JSON object` };
	}

	// ---- 3. Locate the council.<seat> value byte span (string-aware scan) ----
	const root = parseValue(text, skipSpace(text, 0)).node;
	const rootMembers = root.kind === "object" ? (root.members ?? []) : [];
	const councilMember = rootMembers.find((m) => m.key === "council");
	const quotedSeat = JSON.stringify(seat);

	if (councilMember !== undefined && councilMember.value.kind !== "object") {
		return { ok: false, error: `${file}: "council" must be an object keyed by seat name` };
	}

	if (councilMember !== undefined) {
		const councilNode = councilMember.value;
		const seatMembers = councilNode.members!.filter((m) => m.key === seat);

		if (seatMembers.length > 0) {
			// ---- (a) replace: re-emit the seat value span as the object form ----
			const member = seatMembers[seatMembers.length - 1]; // last wins — JSON.parse semantics
			const keyLineIndent = lineIndentAt(text, member.keyStart);
			const merged: AgentOverride = { ...selection };
			// Field-level merge: absent thinking PRESERVES the pre-existing one.
			if (merged.thinking === undefined) {
				const existing = existingThinking(parsedDoc, seat);
				if (existing !== undefined) merged.thinking = existing;
			}
			const unit = detectIndentUnit(text, seatBlockUnit(text, member.value, keyLineIndent));
			const emitted = emitSeatObject(keyLineIndent, unit, merged);
			const patched = text.slice(0, member.value.start) + emitted + text.slice(member.value.end);
			writeAtomic(file, patched, existingMode(file));
			return { ok: true };
		}

		// ---- (b) insert: seat absent — splice the object after the last member ----
		const unit = detectIndentUnit(text);
		if (councilNode.members!.length > 0) {
			const last = councilNode.members![councilNode.members!.length - 1];
			const insertIndent = lineIndentAt(text, last.keyStart);
			const insertion = `,\n${insertIndent}${quotedSeat}: ${emitSeatObject(insertIndent, unit, selection)}`;
			const patched = text.slice(0, last.value.end) + insertion + text.slice(last.value.end);
			writeAtomic(file, patched, existingMode(file));
			return { ok: true };
		}
		// Empty council object `{}` — re-emit its span fully formed.
		const councilKeyIndent = lineIndentAt(text, councilMember.keyStart);
		const memberIndent = councilKeyIndent + unit;
		const insertion = `{\n${memberIndent}${quotedSeat}: ${emitSeatObject(memberIndent, unit, selection)}\n${councilKeyIndent}}`;
		const patched = text.slice(0, councilNode.start) + insertion + text.slice(councilNode.end);
		writeAtomic(file, patched, existingMode(file));
		return { ok: true };
	}

	// ---- (c) council absent — insert a council section (scaffold order) ----
	const unit = detectIndentUnit(text);
	const themeMember = rootMembers.find((m) => m.key === "theme");
	if (themeMember !== undefined) {
		// Scaffold order: council before theme.
		const themeKeyIndent = lineIndentAt(text, themeMember.keyStart);
		const memberIndent = themeKeyIndent + unit;
		const insertion =
			`${themeKeyIndent}"council": {\n` +
			`${memberIndent}${quotedSeat}: ${emitSeatObject(memberIndent, unit, selection)}\n` +
			`${themeKeyIndent}},\n`;
		const at = lineStartAt(text, themeMember.keyStart);
		const patched = text.slice(0, at) + insertion + text.slice(at);
		writeAtomic(file, patched, existingMode(file));
		return { ok: true };
	}
	if (rootMembers.length > 0) {
		const last = rootMembers[rootMembers.length - 1];
		const insertIndent = lineIndentAt(text, last.keyStart);
		const memberIndent = insertIndent + unit;
		const insertion = `,\n${insertIndent}"council": {\n${memberIndent}${quotedSeat}: ${emitSeatObject(memberIndent, unit, selection)}\n${insertIndent}}`;
		const patched = text.slice(0, last.value.end) + insertion + text.slice(last.value.end);
		writeAtomic(file, patched, existingMode(file));
		return { ok: true };
	}
	// Empty root object — re-emit as a fresh structure at the file's unit.
	const inner = `${unit}${unit}${quotedSeat}: ${emitSeatObject(unit + unit, unit, selection)}`;
	const patched = `{\n${unit}"council": {\n${inner}\n${unit}}\n}`;
	writeAtomic(file, patched, existingMode(file));
	return { ok: true };
}

/** Byte-splice region that removes `member` from `objectNode`, trailing-comma
 *  aware (valid JSON output): only-member → re-emit the object span as `{}`;
 *  non-last → eat the member plus its trailing comma/whitespace up to the next
 *  key; last → eat the leading comma/whitespace plus the member. */
function removeMemberEdit(objectNode: ValueNode, member: Member): { start: number; end: number; replacement: string } {
	const members = objectNode.members ?? [];
	if (members.length === 1) {
		return { start: objectNode.start, end: objectNode.end, replacement: "{}" };
	}
	const index = members.indexOf(member);
	if (index === members.length - 1) {
		const prev = members[index - 1];
		return { start: prev.value.end, end: member.value.end, replacement: "" };
	}
	const next = members[index + 1];
	return { start: member.keyStart, end: next.keyStart, replacement: "" };
}

/** Disjoint byte edits that remove every loader-resolvable thinking carrier of
 *  a seat value (applySeatOverride parity: explicit `thinking` key AND a known
 *  `THINKING_LEVELS` `:suffix` on a model string or a string-shorthand value).
 *  Absent carriers → empty edits (no-op; absence means preserve). */
function clearThinkingEdits(text: string, valueNode: ValueNode): Array<{ start: number; end: number; replacement: string }> {
	const edits: Array<{ start: number; end: number; replacement: string }> = [];
	if (valueNode.kind === "object" && valueNode.members !== undefined) {
		const thinkingMember = valueNode.members.find((m) => m.key === "thinking");
		if (thinkingMember !== undefined) edits.push(removeMemberEdit(valueNode, thinkingMember));
		const modelMember = valueNode.members.find((m) => m.key === "model");
		if (modelMember !== undefined && modelMember.value.kind === "string") {
			const raw = text.slice(modelMember.value.start + 1, modelMember.value.end - 1);
			const colon = raw.lastIndexOf(":");
			if (colon > 0 && THINKING_LEVELS.has(raw.slice(colon + 1))) {
				edits.push({ start: modelMember.value.start, end: modelMember.value.end, replacement: JSON.stringify(raw.slice(0, colon)) });
			}
		}
	} else if (valueNode.kind === "string") {
		const raw = text.slice(valueNode.start + 1, valueNode.end - 1);
		const colon = raw.lastIndexOf(":");
		if (colon > 0 && THINKING_LEVELS.has(raw.slice(colon + 1))) {
			edits.push({ start: valueNode.start, end: valueNode.end, replacement: JSON.stringify(raw.slice(0, colon)) });
		}
	}
	return edits;
}

/** Apply disjoint byte edits highest-offset-first so lower offsets stay valid. */
function applyEdits(text: string, edits: Array<{ start: number; end: number; replacement: string }>): string {
	const sorted = [...edits].sort((a, b) => b.start - a.start);
	let out = text;
	for (const e of sorted) out = out.slice(0, e.start) + e.replacement + out.slice(e.end);
	return out;
}

/** Which override a clear removes. */
export type ClearSeatTarget = "thinking" | "seat";

/**
 * FLLWUP-9: the explicit clear affordance. Removes a seat's `thinking` override
 * (what === "thinking": the explicit `thinking` member AND any known `:suffix`
 * thinking carrier on the model, mirroring applySeatOverride's thinking key >
 * :suffix resolution) or its whole `council.<seat>` entry (what === "seat")
 * from `.council.json` via a byte-region splice — the theme section, every
 * other seat, unknown top-level keys, indentation, and trailing newline are
 * byte-identical by construction.
 *
 * Absence still means preserve: the clear is the ONLY way the writer removes
 * a thinking override, and a clear with nothing to remove is an idempotent
 * no-op — `{ ok: true }`, no write (file byte-identical, mtime unchanged).
 * Malformed JSON or a non-object root/council refuse with `{ ok: false, error }`
 * and write NOTHING; only filesystem failures throw (same asymmetry as
 * `writeSeatOverride`). The loader (`loadCouncilConfig`/`applySeatOverride`) is
 * unchanged.
 */
export function clearSeatOverride(args: {
	repoRoot: string;
	seat: string;
	what: ClearSeatTarget; // "thinking" removes the thinking override; "seat" removes the whole council.<seat> entry
}): WriteSeatOverrideResult {
	const { repoRoot, seat, what } = args;
	const file = path.join(repoRoot, COUNCIL_CONFIG_FILE);

	// ---- 1. Absent file → nothing to clear (idempotent no-op) ----
	if (!fs.existsSync(file)) return { ok: true };

	// ---- 2. Read + parse. Malformed / non-object root → refuse, never write. ----
	let text: string;
	try {
		text = fs.readFileSync(file, "utf-8");
	} catch (e) {
		throw e; // filesystem failure — throws by design
	}
	let parsedDoc: unknown;
	try {
		parsedDoc = JSON.parse(text);
	} catch (e) {
		return { ok: false, error: `${file}: malformed JSON — ${e instanceof Error ? e.message : String(e)}` };
	}
	if (typeof parsedDoc !== "object" || parsedDoc === null || Array.isArray(parsedDoc)) {
		return { ok: false, error: `${file}: root must be a JSON object` };
	}

	// ---- 3. Locate council.<seat> (string-aware scan, last duplicate wins) ----
	const root = parseValue(text, skipSpace(text, 0)).node;
	const rootMembers = root.kind === "object" ? (root.members ?? []) : [];
	const councilMember = rootMembers.find((m) => m.key === "council");
	if (councilMember !== undefined && councilMember.value.kind !== "object") {
		return { ok: false, error: `${file}: "council" must be an object keyed by seat name` };
	}
	if (councilMember === undefined) return { ok: true }; // no council section → no-op
	const councilNode = councilMember.value;
	const seatMembers = (councilNode.members ?? []).filter((m) => m.key === seat);
	if (seatMembers.length === 0) return { ok: true }; // seat absent → no-op
	const seatMember = seatMembers[seatMembers.length - 1]; // last wins — JSON.parse semantics

	const edits =
		what === "seat"
			? [removeMemberEdit(councilNode, seatMember)]
			: clearThinkingEdits(text, seatMember.value);
	if (what === "thinking" && edits.length === 0) return { ok: true }; // nothing to clear → no write

	const patched = applyEdits(text, edits);
	writeAtomic(file, patched, existingMode(file));
	return { ok: true };
}