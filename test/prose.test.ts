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
