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
