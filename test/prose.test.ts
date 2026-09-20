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

test("packaged council prose does not hard-reference the repo-specific gate file", () => {
	// FLLWUP-53: a repo-specific gate-document path stated as fact in packaged
	// prose is the failure class this guard exists for — council.md step 8
	// hard-named `docs/gates/GATE-EVIDENCE.md`, a path that does not exist in
	// this repo, and the old single-file guard missed it. Every packaged seat
	// and procedure file is covered so a second naming cannot reintroduce it.
	for (const [rel, text] of councilMarkdown()) {
		expect(text, `${rel} hard-references the repo-specific gate file`).not.toContain(
			"GATE-EVIDENCE.md",
		);
	}
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

// EV-66 amended the settled block (the advisory gate step was inserted as
// step 3, renumbering draft-then-confirm to step 4, and the draft shape now
// carries the `## Acceptance` section) — the pin moves with the settled text.
const STEP4_FIXTURE = `## 4. Draft-then-confirm — every card, no exceptions

Reuse \`/board-create-card\`'s draft-then-confirm gate **for every card this
command produces, the epic included.** Present the full draft of the epic
and every child — complete frontmatter, \`Intent\` section, and \`##
Acceptance\` section, exactly as each would be written to disk — to the
human in one pass.

The gate's recorded verdict renders here as information. After presenting
the drafts, invoke the \`council_gate_render\` tool ONCE with the per-card
\`{ id, callId, status }\` array exactly as step 3's \`council_gate\` result
reported it, then print each returned \`modeLine\` verbatim, exactly once,
immediately below that card's body and above the approve/edit/drop prompt.
Add no words around a mode line, reformat nothing, and write nothing to
disk — the verdict line is presented, never written (the third member of
the presented-never-written pattern, after the Part 2 ledger surface and
the gate's record). Under the packaged default the gate is off, step 3's
result carries no \`cards\`, this tool is never invoked, and no line renders.

The human may edit any card, drop any child, or approve the set as-is.
**Write nothing to disk until the human approves.** There is no default
approval, no timeout that counts as consent, and no proceeding on the
assumption that silence means yes.

`;

test("features-new step 4 is byte-identical to the settled draft-then-confirm block", () => {
	const text = fs.readFileSync(
		path.join(PKG_ROOT, "council", "procedures", "features-new.md"),
		"utf-8",
	);
	const start = text.indexOf("## 4. Draft-then-confirm");
	const end = text.indexOf("## 5. On approval");
	expect(start, "step-4 heading must exist").toBeGreaterThan(-1);
	expect(end, "step-5 heading must exist").toBeGreaterThan(start);
	const shippedBlock = text.slice(start, end);
	expect(shippedBlock).toEqual(STEP4_FIXTURE);
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
	// Adjacent to the existing guard, not mere file-wide co-occurrence. The
	// anchor is the NEAREST guard occurrence — robust to how many guards the
	// file carries (EV-66 added the status line's own; EV-67's step-4 block
	// adds a third, far away). The 200-char tolerance itself is unchanged.
	const guards = [...flat.matchAll(/presented, never written/g)].map((m) => m.index!);
	expect(guards.length).toBeGreaterThan(0);
	const nearestGuard = Math.min(...guards.map((g) => Math.abs(statusIdx - g)));
	expect(nearestGuard).toBeLessThanOrEqual(200);
	// Skeptic O9: the deliberation ledger is disambiguated from the gate's
	// committed gate-ledger.jsonl (same word, different artifacts).
	expect(flat).toContain("not the gate's record");
	expect(flat).toContain("same word, different artifact");
	// The post-Wave-3 seam block carries neither the status line nor a guard
	// restatement.
	const seam = flat.slice(flat.indexOf("**Wave 3 —"), flat.indexOf("**Aggregation.**"));
	expect(seam).not.toContain("Session status");
	expect(seam).not.toContain("presented, never written");
});

// FLLWUP-42 (Phase-1 ruling R2): the deterministic merge check must name
// the human-granted `--admin` bypass explicitly as the sanctioned merge
// step under a `main` ruleset that requires an approving review, and state
// that the authorization is run-scoped and never extended to a later run.

test("features-deliver names the run-scoped --admin bypass as the sanctioned merge step", () => {
	const text = fs.readFileSync(
		path.join(PKG_ROOT, "council", "procedures", "features-deliver.md"),
		"utf-8",
	);
	// Whitespace-normalized so the pin survives line wrapping in the prose.
	const flat = text.replace(/\s+/g, " ");
	// The bypass must be named explicitly, inside the deterministic-merge-
	// check section, in the exact authorized command shape.
	const sectionStart = flat.indexOf("## The deterministic merge check");
	const sectionEnd = flat.indexOf("## Guards");
	expect(sectionStart).toBeGreaterThan(-1);
	expect(sectionEnd).toBeGreaterThan(sectionStart);
	const mergeCheck = flat.slice(sectionStart, sectionEnd);
	expect(mergeCheck).toContain("requires an approving review");
	expect(mergeCheck).toContain("gh pr merge <PR> --squash --admin --match-head-commit <X>");
	expect(mergeCheck).toContain("sanctioned merge step");
	// The authorization is run-scoped — recorded on the card / by a Phase-1
	// ruling before the merge — and never extended to a later run.
	expect(mergeCheck).toContain("run-scoped");
	expect(mergeCheck).toContain("Phase-1 ruling");
	expect(mergeCheck).toContain("not extended to any later run");
	// A run with no recorded authorization must not use `--admin`; if the
	// ruleset then blocks the merge, that is a HALT surfaced to the human,
	// not a bypass.
	expect(mergeCheck).toContain("must not use `--admin`");
	expect(mergeCheck).toContain("HALT surfaced to the human");
});

// EV-70: the deterministic merge check is mode-aware. The recorded execution
// mode keys the criteria table (EV-69's table, made concrete), a card with no
// recorded mode HALTs with the verbatim no-inference line, a card in a mode
// that requires a goal evaluation with no goal-evaluation record HALTs with
// the verbatim mode-named line, and only Direct merges with no judge verdict
// present. Criterion 2's workflow-field reading and the --match-head-commit
// pin stand byte-unchanged in meaning.

test("features-deliver's merge check carries the verbatim mode-aware HALT lines and the Direct no-judge rule", () => {
	const text = fs.readFileSync(
		path.join(PKG_ROOT, "council", "procedures", "features-deliver.md"),
		"utf-8",
	);
	// Whitespace-normalized so the pin survives line wrapping in the prose.
	const flat = text.replace(/\s+/g, " ");
	const sectionStart = flat.indexOf("## The deterministic merge check");
	const sectionEnd = flat.indexOf("## Guards");
	expect(sectionStart).toBeGreaterThan(-1);
	expect(sectionEnd).toBeGreaterThan(sectionStart);
	const mergeCheck = flat.slice(sectionStart, sectionEnd);
	// The two HALT lines, verbatim — each names the card and the remedy.
	expect(mergeCheck).toContain(
		"HALT: EV-<n> has no recorded execution mode — the merge check cannot infer one; route the card at the approval gate",
	);
	expect(mergeCheck).toContain(
		"HALT: EV-<n> — mode <mode> requires a goal evaluation and none is recorded",
	);
	// The mode is read from the run substrate, never a seat's report (EV-69's pin, kept).
	expect(mergeCheck).toContain("council_route");
	expect(mergeCheck).toContain("never a seat's report");
	// A mode that requires a goal evaluation names the absent judge verdict;
	// only Direct merges with no judge verdict present.
	expect(mergeCheck).toContain("goal evaluation");
	expect(mergeCheck).toContain("only Direct merges with no judge verdict present");
	// Criterion 2's exact reading and the SHA pin stand unchanged.
	expect(mergeCheck).toContain("gh pr checks <PR> --json name,state,workflow");
	expect(mergeCheck).toContain("--match-head-commit <X>");
	expect(mergeCheck).toContain("a mismatch is a **`HALT`, not a retry**");
});

// EV-70: the Phase 3 run ledger's per-card merge entry names the card's
// recorded execution mode beside its merge basis. This is the ONLY Phase 3
// report change in the epic — the follow-up-filing and usage-carry rows stand.

test("features-deliver's Phase 3 ledger entry names the recorded execution mode beside its merge basis", () => {
	const text = fs.readFileSync(
		path.join(PKG_ROOT, "council", "procedures", "features-deliver.md"),
		"utf-8",
	);
	const flat = text.replace(/\s+/g, " ");
	const phase3Start = flat.indexOf("## Phase 3 — the run ledger");
	const phase3End = flat.indexOf("## The deterministic merge check");
	expect(phase3Start).toBeGreaterThan(-1);
	expect(phase3End).toBeGreaterThan(phase3Start);
	const phase3 = flat.slice(phase3Start, phase3End);
	expect(phase3).toContain("recorded execution mode");
	expect(phase3).toContain("EV-<n> — mode Direct, criteria 1, 2, 5 satisfied");
	// The only change: the existing follow-up and usage-carry rows stand.
	expect(phase3).toContain("Every follow-up filed");
	expect(phase3).toContain("usage block");
});

// FLLWUP-41 (Phase-1 ruling R1): a literal reading of council.md step 12
// HALTs a diverged local `main` that the documented union-merge reconcile
// resolves. Step 12's non-fast-forward paragraph must name the union-merge
// reconcile as the sanctioned non-destructive repair, retain the never-force
// guard, and carry the reconcile's own discipline (validator clean + a
// conflict-marker sweep, the wiki's documented failure mode).

test("council step 12 names the union-merge reconcile as the sanctioned non-fast-forward repair", () => {
	const text = fs.readFileSync(
		path.join(PKG_ROOT, "council", "procedures", "council.md"),
		"utf-8",
	);
	// Whitespace-normalized so the pin survives line wrapping in the prose.
	const flat = text.replace(/\s+/g, " ");
	const stepStart = flat.indexOf("## 12. Sync and reconcile");
	const stepEnd = flat.indexOf("## 13. Card the follow-ups");
	expect(stepStart).toBeGreaterThan(-1);
	expect(stepEnd).toBeGreaterThan(stepStart);
	const step12 = flat.slice(stepStart, stepEnd);
	// The sanctioned repair is named: the documented union-merge reconcile,
	// applied instead of HALT-ing on a non-fast-forward.
	expect(step12).toContain("does not fast-forward cleanly");
	expect(step12).toContain("union-merge reconcile");
	expect(step12).toContain("the sanctioned non-destructive repair");
	// The never-force guard stands: force-pushing, rewinding, or discarding a
	// side stays forbidden.
	expect(step12).toContain("force-pushing, rewinding, or discarding a side");
	expect(step12).toContain("forbidden");
	// The reconcile's own discipline: union-keep both record sides, the
	// validator must be clean, and a conflict-marker sweep — a union resolve
	// can leave a lone marker behind.
	expect(step12).toContain("union-keep both record sides");
	expect(step12).toContain("`council/validate.py`");
	expect(step12).toContain("conflict markers");
	// A divergence the union merge cannot resolve is surfaced, never forced.
	expect(step12).toContain("surfaced to the human");
});

// FLLWUP-60 (Phase-1 ruling R3): council.md step 12 pushes the record
// commit directly to `main` — a privileged write under a `main` ruleset
// that requires changes to land through a pull request, and one the
// authority map does not re-home. The record-push paragraph must require
// an explicit, run-scoped, human-granted authorization (a Phase-1 ruling
// on the run's Phase-1 record) to exist before the run's first record
// push, state that it is not extended to any later run, and make an
// unauthorized direct record push a HALT surfaced to the human.

test("council step 12 gates the direct record push behind a run-scoped human authorization", () => {
	const text = fs.readFileSync(
		path.join(PKG_ROOT, "council", "procedures", "council.md"),
		"utf-8",
	);
	// Whitespace-normalized so the pin survives line wrapping in the prose.
	const flat = text.replace(/\s+/g, " ");
	const stepStart = flat.indexOf("## 12. Sync and reconcile");
	const stepEnd = flat.indexOf("## 13. Card the follow-ups");
	expect(stepStart).toBeGreaterThan(-1);
	expect(stepEnd).toBeGreaterThan(stepStart);
	const step12 = flat.slice(stepStart, stepEnd);
	// The direct record push is named: the step-12 record commit is pushed
	// directly to `main` — a privileged write the authority map does not
	// re-home to any seat.
	expect(step12).toContain("pushed directly to `main`");
	expect(step12).toContain("privileged write");
	expect(step12).toContain("authority map does not re-home");
	// A recorded, run-scoped, human-granted authorization (a Phase-1 ruling
	// on the run's Phase-1 record) must exist before the run's first record
	// push, and is not extended to any later run.
	expect(step12).toContain("Phase-1 ruling");
	expect(step12).toContain("before the run's first record push");
	expect(step12).toContain("not extended to any later run");
	// An unauthorized direct record push is a HALT surfaced to the human —
	// not a bypass, never silently executed.
	expect(step12).toContain("HALT surfaced to the human");
});

// FLLWUP-47: the red-base evidence convention is one shared block, bracketed
// by literal HTML-comment markers, that must be byte-identical in the two
// seats it binds (`owner` records the red-at-base run, `skeptic` reproduces
// and compares it). A second pin keeps the convention's field vocabulary
// inside skeptic.md's `<output_format>` block — the judge's actual input —
// not merely somewhere in the file.

test("red-base convention block is byte-identical in owner and skeptic seats", () => {
	const START = "<!-- red-base-shared-start -->";
	const END = "<!-- red-base-shared-end -->";
	const read = (seat: string) =>
		fs.readFileSync(path.join(PKG_ROOT, "council", "agents", seat), "utf-8");
	const slice = (text: string, label: string) => {
		const start = text.indexOf(START);
		const end = text.indexOf(END);
		expect(start, `${label} carries the red-base-shared-start marker`).toBeGreaterThan(-1);
		expect(end, `${label} carries the red-base-shared-end marker`).toBeGreaterThan(start);
		return text.slice(start, end + END.length);
	};
	const ownerBlock = slice(read("owner.md"), "owner.md");
	const skepticBlock = slice(read("skeptic.md"), "skeptic.md");
	expect(ownerBlock).toEqual(skepticBlock);
});

test("red-base convention vocabulary reaches the skeptic's output format", () => {
	const text = fs.readFileSync(
		path.join(PKG_ROOT, "council", "agents", "skeptic.md"),
		"utf-8",
	);
	// Whitespace-normalized so the pin survives line wrapping in the prose.
	const flat = text.replace(/\s+/g, " ");
	// The yield-contract block also mentions `<output_format>`; the real
	// block is the last opening tag and the only closing tag in the file.
	const start = flat.lastIndexOf("<output_format>");
	const end = flat.indexOf("</output_format>");
	expect(start, "skeptic.md carries an output_format block").toBeGreaterThan(-1);
	expect(end, "skeptic.md closes the output_format block").toBeGreaterThan(start);
	const format = flat.slice(start, end);
	for (const field of [
		"Base identity",
		"Transplant identity",
		"Exact command",
		"Raw red output",
		"Worktree provenance",
		"Copy set",
		"Head half",
	]) {
		expect(format, `output_format carries the field name "${field}"`).toContain(field);
	}
	expect(format, "output_format carries the comparison triple").toContain(
		"(base sha, transplant identity, exact command)",
	);
	expect(format, "output_format carries the head-half clause").toContain("`0 fail`");
});
