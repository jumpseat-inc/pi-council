import { test, expect } from "bun:test";
import * as fs from "node:fs";
import * as path from "node:path";
import { PKG_ROOT } from "../extensions/seats.ts";

/** Every packaged seat + procedure body, as `<dir>/<file>` → text. */
function councilMarkdown(): Array<[string, string]> {
	const out: Array<[string, string]> = [];
	for (const sub of ["agents", "procedures"]) {
		const dir = path.join(PKG_ROOT, "council", sub);
		for (const f of fs.readdirSync(dir)) {
			if (f.endsWith(".md")) out.push([`${sub}/${f}`, fs.readFileSync(path.join(dir, f), "utf-8")]);
		}
	}
	return out;
}

test("no stale `deliver.md` filename in council prose", () => {
	// The procedure is `features-deliver.md`; `deliver.md` is the old name that
	// must not survive anywhere. Strip valid `features-deliver.md` mentions
	// first so a bare `deliver.md` is the only thing that can still match.
	for (const [rel, text] of councilMarkdown()) {
		const withoutValid = text.split("features-deliver.md").join("");
		expect(withoutValid, `${rel} references the old deliver.md filename`).not.toContain("deliver.md");
	}
});

test("features-deliver does not hard-reference the repo-specific gate file", () => {
	const text = fs.readFileSync(
		path.join(PKG_ROOT, "council", "procedures", "features-deliver.md"),
		"utf-8",
	);
	expect(text).not.toContain("GATE-EVIDENCE.md");
});

test("council prose does not describe seats as a restartable agent registry", () => {
	// Seats are resolved from disk at dispatch time by `council_dispatch`;
	// the pre-packaged design's "agent registry + session restart" framing
	// must not survive anywhere in seat or procedure prose.
	for (const [rel, text] of councilMarkdown()) {
		expect(text, `${rel} references the stale agent registry`).not.toContain("registry");
		expect(text, `${rel} references a stale "named agent" resolution`).not.toContain("named agent");
	}
});

test("council prose carries no hardcoded product domain", () => {
	// Seats and procedures are domain-neutral: they ship for any repository,
	// and product-specific facts come from the `<repository_grounding>` block,
	// never from a hardcoded domain in the prose. Guard against the removed
	// domain creeping back in.
	const forbidden =
		/\b(PETA|SPKLU|spklu|ev-guide|evguide|Surabaya|Bahasa|Indonesian|Indonesia|charger|charging|maplibre|Mongo|healthz|PLN)\b/;
	for (const [rel, text] of councilMarkdown()) {
		expect(text, `${rel} references a removed product domain`).not.toMatch(forbidden);
	}
});

test("council prose does not pin a specific tech stack", () => {
	// Seats and procedures run against whatever stack the consuming repo
	// already uses, so they must not hardcode a language, runtime, or test
	// runner. Guard against a stack opinion creeping back in.
	const forbidden = /\b(bun|bunx|typescript|tsc)\b|bun test|bun run|@ts-expect-error/i;
	for (const [rel, text] of councilMarkdown()) {
		expect(text, `${rel} pins a tech stack`).not.toMatch(forbidden);
	}
});

const STEP3_FIXTURE = `## 3. Draft-then-confirm — every card, no exceptions

Reuse \`/board-create-card\`'s draft-then-confirm gate **for every card this
command produces, the epic included.** Present the full draft of the epic
and every child — complete frontmatter and \`Intent\` section, exactly as each
would be written to disk — to the human in one pass.

The human may edit any card, drop any child, or approve the set as-is.
**Write nothing to disk until the human approves.** There is no default
approval, no timeout that counts as consent, and no proceeding on the
assumption that silence means yes.

`;

test("features-new step 3 is byte-identical to the settled draft-then-confirm block", () => {
	const text = fs.readFileSync(
		path.join(PKG_ROOT, "council", "procedures", "features-new.md"),
		"utf-8",
	);
	const start = text.indexOf("## 3. Draft-then-confirm");
	const end = text.indexOf("## 4. On approval");
	expect(start, "step-3 heading must exist").toBeGreaterThan(-1);
	expect(end, "step-4 heading must exist").toBeGreaterThan(start);
	const shippedBlock = text.slice(start, end);
	expect(shippedBlock).toEqual(STEP3_FIXTURE);
});

test("features-new step 2 mandates attribution-free Part 1 card drafts", () => {
	// Step-9 cycle-1 O1: the smoke run's Part 1 card drafts embedded seat
	// names, wave numbers, and deliberation narrative in Intent prose that
	// would be written to disk. The step-2 gate-presentation text must carry
	// an explicit, unmissable mandate forbidding that, so the blur is
	// structurally prevented, not incidentally absent.
	const text = fs.readFileSync(
		path.join(PKG_ROOT, "council", "procedures", "features-new.md"),
		"utf-8",
	);
	// Whitespace-normalized so the pin survives line wrapping in the prose.
	const flat = text.replace(/\s+/g, " ");
	expect(flat).toContain("Part 1 card drafts must be attribution-free");
	expect(flat).toContain("no seat names, no wave numbers, and no deliberation narrative");
	expect(flat).toContain("Attribution belongs solely in the Part 2 ledger");
});

// EV-11 (bounded decomposition session): prose pins on the whitespace-
// flattened features-new.md step-2 bound text. All are red until the EV-11
// bound text lands; none can be made green by an "any-dissent => fallback",
// "or explicit escalation", or persisted-status implementation.

test("features-new step 2 bounds the session at three waves = three rounds before wave 1", () => {
	const text = fs.readFileSync(
		path.join(PKG_ROOT, "council", "procedures", "features-new.md"),
		"utf-8",
	);
	const flat = text.replace(/\s+/g, " ");
	// EV-11 CAP-1: the decomposition session is bounded at the same numeric
	// cap /council uses — three waves are the three rounds.
	expect(flat).toContain("three waves = three rounds");
	expect(flat).toContain("same numeric cap");
	// The no-re-dispatch clause must fire before Wave 1, with the stall-retry
	// carve-out riding the same sentence.
	const noRedispatch = "no seat is re-dispatched to respond to another seat's position";
	expect(flat.indexOf(noRedispatch)).toBeGreaterThan(-1);
	expect(flat.indexOf(noRedispatch)).toBeLessThan(flat.indexOf("Wave 1"));
	const sentence = flat.split(". ").find((s) => s.includes(noRedispatch));
	expect(sentence).toBeDefined();
	expect(sentence!.includes("a stall re-dispatch is a retry, not a round")).toBe(true);
});

test("features-new step 2 states convergence as zero open in-scope judgments, not unanimity", () => {
	const text = fs.readFileSync(
		path.join(PKG_ROOT, "council", "procedures", "features-new.md"),
		"utf-8",
	);
	const flat = text.replace(/\s+/g, " ");
	// Convergence = zero open in-scope judgments after wave 3, where open
	// means unruled by product-owner AND not settled by a runnable check.
	expect(flat).toContain("a named dissent is not non-convergence");
	expect(flat).toContain("zero open in-scope judgments remain after wave 3");
	expect(flat).toContain("unruled by product-owner");
	expect(flat).toContain("not settled by a runnable check");
	// Escalation co-occurs with non-convergence: an escalated, unruled item is
	// an open disagreement that becomes the fallback's content.
	expect(flat).toContain("escalated, unruled item is non-converged");
	expect(flat).toContain("is the fallback's canonical content");
	expect(flat).toContain("unresolved disagreement for the human");
	// Dogwatch: the superseded round-1 phrasing must not reappear.
	expect(flat).not.toContain("or explicit escalation");
});

test("features-new step 2 records convergence at the fixed endpoint, never by stopping early", () => {
	const text = fs.readFileSync(
		path.join(PKG_ROOT, "council", "procedures", "features-new.md"),
		"utf-8",
	);
	const flat = text.replace(/\s+/g, " ");
	expect(flat).toContain("convergence is recorded at the fixed endpoint");
	expect(flat).toContain("product-owner always runs last");
	expect(flat).toContain("no early stop");
	// council.md's "stop early if stabilised" is disavowed, not imported.
	expect(flat).toContain("stop early if stabilised");
	expect(flat).toContain("not imported");
	const sentence = flat.split(". ").find((s) => s.includes("stop early if stabilised"));
	expect(sentence).toBeDefined();
	expect(sentence!.includes("not imported")).toBe(true);
});

test("features-new step 2 fallback is the mechanical verbatim aggregate carried to the existing gate", () => {
	const text = fs.readFileSync(
		path.join(PKG_ROOT, "council", "procedures", "features-new.md"),
		"utf-8",
	);
	const flat = text.replace(/\s+/g, " ");
	const blockStart = flat.indexOf("**Bounded session and fallback.**");
	expect(blockStart).toBeGreaterThan(-1);
	const blockEnd = flat.indexOf("**Aggregation.**");
	expect(blockEnd).toBeGreaterThan(blockStart);
	const block = flat.slice(blockStart, blockEnd);
	// FALLBACK-1: the fallback draft is the mechanical verbatim aggregate of
	// all recorded contributions — never facilitator-authored synthesis.
	expect(block).toContain("mechanical verbatim aggregate");
	// Carry-to-gate: labeled unresolved at the existing approval gate — no new
	// gate, no Needs Human stop.
	expect(block).toContain("labeled unresolved");
	expect(block).toContain("existing approval gate");
	expect(block).toContain("no new gate");
	expect(block).toContain("Needs Human");
	// The dispatch double-fail stop is an incomplete-run outcome, not the fallback.
	const sentence = flat.split(". ").find((s) => s.includes("double-fail"));
	expect(sentence).toBeDefined();
	expect(sentence!.includes("not the fallback")).toBe(true);
});

test("features-new step 2 session status line sits in the Part 2 paragraph, adjacent to the guard", () => {
	const text = fs.readFileSync(
		path.join(PKG_ROOT, "council", "procedures", "features-new.md"),
		"utf-8",
	);
	const flat = text.replace(/\s+/g, " ");
	// STEP-6 ruling's final copy, verbatim.
	expect(flat).toContain("Session status: Non-converged after 3 rounds");
	expect(flat).toContain("this is a fallback draft");
	expect(flat).toContain("Ledger only — presented, never written");
	// Ruled dissents keep their ruling — the session marker never over-claims.
	expect(flat).not.toContain("every disagreement");
	// Sited inside the Part 2 ledger-description paragraph.
	const statusIdx = flat.indexOf("Session status: Non-converged after 3 rounds");
	expect(statusIdx).toBeGreaterThan(flat.indexOf("**Attribution and the disagreement ledger**"));
	expect(statusIdx).toBeLessThan(flat.indexOf("**Part 1 card drafts must be attribution-free.**"));
	// Adjacent to the existing guard, not mere file-wide co-occurrence.
	expect(Math.abs(statusIdx - flat.indexOf("presented, never written"))).toBeLessThanOrEqual(200);
	// The post-Wave-3 seam block carries neither the status line nor a guard
	// restatement.
	const seam = flat.slice(flat.indexOf("**Wave 3 —"), flat.indexOf("**Aggregation.**"));
	expect(seam).not.toContain("Session status");
	expect(seam).not.toContain("presented, never written");
});
