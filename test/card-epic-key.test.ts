// FLLWUP-115 — frontmatter-scoped epic parse in cardEpicKey.
//
// Spec: docs/superpowers/specs/2026-09-24-fllwup-115-design.md (authoritative;
// do not reopen). test/ev90-runner-input.test.ts stays untouched (AC4).
//
// RED-BASE RECORD (red-base-evidence, seven fields; ev68 precedent):
// 1. Base identity — 03717b04778fd6276348a9737cfe3aefa664fdc2 ("docs(council):
//    move FLLWUP-115 to In Progress — spec committed, owner handed off"; the
//    commit immediately preceding the epic's first mechanism merge — no
//    frontmatter-scoped epic derivation exists at this sha). Base role:
//    required.
// 2. Transplant identity — this file (test/card-epic-key.test.ts), T1 only at
//    recording time (lines 1–49 of the head copy: header, imports, helpers,
//    and the single T1 test), materialized into the base worktree; copied
//    from the head copy of this file. Nothing else was added. (At base the
//    file's import names only composeRunnerInput — a name that exists at
//    base; cardEpicKey/epicKeyFromFace were not yet exported, so the
//    T1-only transplant is the only form that compiles at base.)
// 3. Exact command — `bun test test/card-epic-key.test.ts` (identical on
//    both halves of the pair).
// 4. Raw red output — verbatim from the base run (T1 red; T2–T4 did not
//    exist at recording time):
//    (fail) FLLWUP-115 T1: a body epic: line cannot win — compose refuses
//      loudly naming the card [22.42ms]
//      error: expect(received).toBe(expected)
//      Expected: "council-runner dispatch for card "X" refused: the card
//        face's epic: field is null or absent (EV-90 D1 ruling — a runner
//        dispatched without its features-deliver scope is a degraded
//        dispatch, not a fallback)"
//      Received: "undefined"
//      at <anonymous> (/tmp/fllwup-115-redbase/test/card-epic-key.test.ts:46:14)
//    0 pass / 1 fail / 1 expect() calls — Ran 1 test across 1 file. [616.00ms]
//    (The red names the absent mechanism's artifact — composeRunnerInput did
//    NOT refuse a no-frontmatter-epic face; the body `epic: EPIC-9` won.)
// 5. Worktree provenance — detached checkout of the base sha in a separate
//    worktree at /tmp/fllwup-115-redbase (git worktree add --detach); the
//    fllwup-115-frontmatter-epic-parse worktree was never switched; the base
//    worktree was removed after the run.
// 6. Copy set — bare copy of the transplant plus a node_modules symlink to
//    the implementation worktree's node_modules (dependency resolution only).
// 7. Head half — the PR head sha (recorded on the PR), same exact command,
//    0 fail.

import { expect, test } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { cardEpicKey, composeRunnerInput, epicKeyFromFace } from "../extensions/seats.ts";

/** The repo's own cards directory — the same path production reads (never PKG_ROOT). */
const REPO_ROOT = path.join(import.meta.dir, "..");

function tmpRepo(): string {
	return fs.mkdtempSync(path.join(os.tmpdir(), "fllwup-115-"));
}

/**
 * A card face with full control over frontmatter and body lines.
 * `epicLine === undefined` omits the epic line entirely (frontmatter has none).
 */
function writeFace(root: string, cardId: string, epicLine: string | undefined, body: string): void {
	fs.mkdirSync(path.join(root, "council", "cards"), { recursive: true });
	fs.writeFileSync(
		path.join(root, "council", "cards", `${cardId}.md`),
		`---\nid: ${cardId}\n${epicLine ? `${epicLine}\n` : ""}state: In Progress\n---\n${body}`,
	);
}
// ================= T1 — compose-path red-at-base falsifier =================

test("FLLWUP-115 T1: a body epic: line cannot win — compose refuses loudly naming the card", () => {
	const root = tmpRepo();
	// No frontmatter epic line; body carries `epic: EPIC-9`. At base the
	// whole-file match derives the BODY key and composes a dispatch with the
	// body prose leaking into operative context ("delivering `EPIC-9`") — the
	// exact EV-90 hazard. At head the D1 refusal fires naming the card.
	writeFace(root, "X", undefined, "some prose\nepic: EPIC-9\nmore prose");
	let threw: unknown;
	try {
		composeRunnerInput(root, "X", "t");
	} catch (e) {
		threw = e;
	}
	const msg = threw instanceof Error ? threw.message : String(threw);
	expect(msg).toBe(
		'council-runner dispatch for card "X" refused: the card face\'s epic: field is null or absent (EV-90 D1 ruling — a runner dispatched without its features-deliver scope is a degraded dispatch, not a fallback)',
	);
});

// ================= T2 — precedence pin =================

test("FLLWUP-115 T2: frontmatter epic wins over a conflicting body line (precedence is scoping, not accident)", () => {
	const root = tmpRepo();
	writeFace(root, "P", "epic: EPIC-A", "quoted example below\nepic: EPIC-B\nprose");
	expect(composeRunnerInput(root, "P", "t")).toContain("delivering `EPIC-A` autonomously");
});

// ================= T3 — byte-exact D1 refusal pins =================

test("FLLWUP-115 T3: the three D1 refusals keep their byte-for-byte messages", () => {
	// 1 — nonexistent face
	let nonexistent: unknown;
	try {
		composeRunnerInput(REPO_ROOT, "NOFACE-115", "t");
	} catch (e) {
		nonexistent = e;
	}
	expect(nonexistent instanceof Error && (nonexistent as Error).message).toBe(
		'council-runner dispatch for card "NOFACE-115" refused: its card face council/cards/NOFACE-115.md does not exist',
	);

	// 2 — epic: null
	const nullRoot = tmpRepo();
	writeFace(nullRoot, "N", "epic: null", "body");
	let nullEpic: unknown;
	try {
		composeRunnerInput(nullRoot, "N", "t");
	} catch (e) {
		nullEpic = e;
	}
	expect(nullEpic instanceof Error && (nullEpic as Error).message).toBe(
		'council-runner dispatch for card "N" refused: the card face\'s epic: field is null or absent (EV-90 D1 ruling — a runner dispatched without its features-deliver scope is a degraded dispatch, not a fallback)',
	);

	// 3 — absent epic line (identical message to #2)
	const absentRoot = tmpRepo();
	writeFace(absentRoot, "A", undefined, "body");
	let absentEpic: unknown;
	try {
		composeRunnerInput(absentRoot, "A", "t");
	} catch (e) {
		absentEpic = e;
	}
	expect(absentEpic instanceof Error && (absentEpic as Error).message).toBe(
		'council-runner dispatch for card "A" refused: the card face\'s epic: field is null or absent (EV-90 D1 ruling — a runner dispatched without its features-deliver scope is a degraded dispatch, not a fallback)',
	);
});

// ================= T4 — the corpus equivalence sweep =================

/**
 * Per card: the whole-file derivation (`raw.match(/^epic:\s*(.*)$/m)` — the
 * old derivation, kept inline forever as the oracle) and the
 * frontmatter-scoped derivation (the AC1 mechanism, exercising live
 * production code) must produce the identical result — same key, or same
 * throw. Green on the current corpus; reds exactly when the scoping change
 * (or any future edit) would alter an existing derivation.
 *
 * Corpus disposition (Phase-1 ruling, binding): five card files carry nine
 * body lines beginning `epic:` (EPIC-8 x1, EV-35 x1, FLLWUP-47 x3, FLLWUP-49
 * x2, FLLWUP-56 x2). Every face carries its frontmatter `epic:` line ahead of
 * its body, so no body occurrence ever won a derivation and no face lacks a
 * frontmatter `epic:` line — the nine occurrences are dispositioned here, NOT
 * policed: there is deliberately no set-equality or corpus-hygiene assertion,
 * only the equivalence property.
 *
 * Documented caveat (skeptic O5): FRONTMATTER_RE is byte-0-anchored, so a
 * face with a leading blank line or a closing `---` at EOF without a trailing
 * newline would diverge old=KEY / scoped=THROW. Zero such faces exist in the
 * corpus; any future one reds this sweep immediately — the "cannot silently
 * change" contract working as intended.
 */
test("FLLWUP-115 T4: whole-file and frontmatter-scoped derivations agree on every card in council/cards/", () => {
	const cardsDir = path.join(REPO_ROOT, "council", "cards");
	const files = fs.readdirSync(cardsDir).filter((f) => f.endsWith(".md")).sort();
	expect(files.length).toBeGreaterThan(0);

	const divergences: string[] = [];
	for (const file of files) {
		const cardId = file.replace(/\.md$/, "");
		const raw = fs.readFileSync(path.join(cardsDir, file), "utf-8");

		// Old derivation (the oracle): whole-file first match.
		let oldResult: string;
		try {
			const m = raw.match(/^epic:\s*(.*)$/m);
			const epic = m?.[1]?.trim();
			if (!epic || epic === "null") throw new Error("refused");
			oldResult = epic;
		} catch {
			oldResult = "THROW";
		}

		// New derivation (the mechanism): live production code.
		let newResult: string;
		try {
			newResult = epicKeyFromFace(raw, cardId);
		} catch {
			newResult = "THROW";
		}

		if (oldResult !== newResult) {
			divergences.push(`${cardId}: whole-file=${oldResult} scoped=${newResult}`);
		}
	}
	expect(divergences).toEqual([]);
});

// ================= T5 — the byte-0 anchor pin (FLLWUP-118) =================

/**
 * FLLWUP-118 — the FRONTMATTER_RE byte-0 anchor, pinned as a deliberate
 * contract (skeptic O5, FLLWUP-115's documented caveat).
 *
 * Disposition of the caveat, verbatim: FRONTMATTER_RE
 * (`/^---\n[\s\S]*?\n---\n/`, extensions/seats.ts:598) is byte-0-anchored
 * and requires a closing `---` followed by a newline, so exactly two
 * synthetic face shapes diverge — old whole-file derivation = KEY,
 * frontmatter-scoped derivation = THROW:
 *
 *   (a) a leading blank line before the opening `---` (the regex cannot
 *       match — its first byte must be `-`); and
 *   (b) a closing `---` at EOF without a trailing newline (the regex needs
 *       the newline after the closing dashes).
 *
 * Corpus disposition: ZERO faces in council/cards/ carry either shape, so
 * nothing on the corpus exercises this boundary — which is why T4 (the
 * equivalence sweep over every card in council/cards/) reds immediately on
 * any future face that does: the sweep is the tripwire, T5 pins the
 * boundary's behavior itself so a future regex tweak (loosening the anchor,
 * changing the closing-dash handling) cannot silently change which faces
 * parse. A regex tweak changing which faces parse must update this pin
 * deliberately.
 *
 * Driven through the real exported epicKeyFromFace — no reimplementation of
 * the derivation on either side of the assertion pair.
 *
 * Red-base disposition (red-base-evidence, seven fields): T5 is a PIN of
 * already-delivered behavior, not a new mechanism — its red/green pair was
 * observed by mutation (loosen the anchor → T5 reds 4 pass / 1 fail naming
 * the T5 toThrow; restore the anchor byte-identical → 5 pass / 0 fail),
 * which is the mechanism-absent red for this card: the hazard named in the
 * header is exactly "a regex tweak changes which faces parse". No base-sha
 * record is owed — there is no pre-mechanism base to transplant against
 * (the mechanism IS the delivered code being pinned; T4's sweep stays the
 * corpus tripwire).
 */
test("FLLWUP-118 T5: the byte-0 anchor — scoped derivation THROWS where the old whole-file derivation returned a key", () => {
	// (a) leading blank line before the opening ---
	const leading = "\n---\nid: L\nepic: EPIC-A\nstate: In Progress\n---\nbody";
	// The old whole-file derivation (the oracle, inline forever as in T4):
	// /^epic:\s*(.*)$/m is multiline, not byte-0-anchored — it still finds the
	// frontmatter epic line and returns the key.
	expect(leading.match(/^epic:\s*(.*)$/m)?.[1]?.trim()).toBe("EPIC-A");
	// The scoped derivation (the mechanism, live production code) throws the
	// named-card D1 refusal: the block is unmatchable ⇒ absent epic.
	expect(() => epicKeyFromFace(leading, "EPIC-115-LEAD")).toThrow(
		/refused: the card face's epic: field is null or absent/,
	);

	// (b) closing --- at EOF without a trailing newline
	const noTrailing = "---\nid: E\nepic: EPIC-B\nstate: In Progress\n---";
	// Old derivation: still a key.
	expect(noTrailing.match(/^epic:\s*(.*)$/m)?.[1]?.trim()).toBe("EPIC-B");
	// Scoped derivation: throws the same D1 refusal.
	expect(() => epicKeyFromFace(noTrailing, "EPIC-115-EOF")).toThrow(
		/refused: the card face's epic: field is null or absent/,
	);

	// The boundary is the anchor, not the epic field: the SAME faces with the
	// blank line removed / the newline restored derive normally. (Proves the
	// pin is on FRONTMATTER_RE's shape, not on null/absent epics.)
	expect(epicKeyFromFace(leading.replace(/^\n/, ""), "EPIC-115-LEAD")).toBe("EPIC-A");
	expect(epicKeyFromFace(`${noTrailing}\n`, "EPIC-115-EOF")).toBe("EPIC-B");
});
