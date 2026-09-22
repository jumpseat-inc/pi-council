---
id: FLLWUP-106
title: The usages procedure forbids inventing framing around the tool's stderr
state: Deliberating
owner: null
epic: EPIC-15
goal: council/procedures/usages.md instructs the agent to surface every non-empty stderr line from usages.py verbatim, with no added prefix such as a warning glyph and no invented cause, and to state only what the line itself reports.
---

## Intent

`council/procedures/usages.md` says to surface the tool's printed summary and
its `!` limitation lines verbatim, but it does not classify a non-`!` stderr
line. In the run behind this epic, the warning `usages: could not write cache: …`
was wrapped in an invented `⚠️ One non-fatal issue:` prefix with an appended
cause and likelihood the procedure never authorized. The gap outlives the
specific warning: once the cache-ordering bug is fixed, the next non-`!` stderr
line can be framed the same way. This card makes the verbatim rule explicit and
routes system-status signals into the limitations block instead of an invented
narration.

## Acceptance

- A paragraph appended after `council/procedures/usages.md`'s `**Report.**`
  section: any non-empty stderr line is quoted verbatim; no `⚠️`/`!` prefix is
  added to a line that does not itself carry one; no cause, consequence, or
  "non-fatal issue" count is asserted beyond what the tool printed;
  system-status signals are described as uninterpreted tool output.
- The paragraph names the intake's own failure mode as the worked example —
  the seat wrapped `usages: could not write cache:` in `⚠️ One non-fatal issue:`
  and appended an invented likelihood — so the rule is pinned to a real case,
  not an abstraction.
- A mechanical pin in `test/` asserts the procedure contains the literal `⚠️`
  in a prohibition context and the phrase `verbatim` for stderr, so the rule
  cannot be dropped silently.
- `council/procedures/usages.md`'s existing `!`-limitation sentence and the
  `OPENROUTER_MANAGEMENT_KEY` hard-gate paragraph are unchanged; the edit is
  additive, and `bun test test/procedures.test.ts` (or the procedure-count pin
  covering registration) stays green.
## Phase 1 Rulings (recorded before dispatch — binding for this run)

- **R1 — merge authorization, this card.** The human authorized, for this run
  only, the admin-bypass merge `gh pr merge <PR> --squash --admin
  --match-head-commit <X>`, where `<X>` is the exact head SHA merge-check
  criterion 2 (`gates` workflow `SUCCESS`) was read against. Not extended to any
  later run; a SHA mismatch is a HALT, not a retry.
- **R2 — build order.** EPIC-15 runs serially: BUG-2, then FLLWUP-105, then
  FLLWUP-106. One runner at a time; never two against the board.

## Run record (features-deliver / FLLWUP-106 — EPIC-15)

### Step 1 — gate, mode, surface bit (facilitator)

- **Card state promoted `Backlog` → `Ready` at container start.** Basis: the
  orchestrator's dispatch names this card explicitly with its Phase-1 rulings
  and binding acceptance (chain-promotion cadence,
  `vault/wiki/chain-promotion.md` — promotion trigger observed, not decided:
  predecessor FLLWUP-105 merged `a0b27ca` (PR #105) is on local `main`,
  `python3 council/validate.py` clean). This container is the only runner in
  flight (R2); single-writer discipline holds.
- **Execution mode: `Deliberate`**, recorded on this dispatch's ROOT manifest
  (EV-68). Full path, steps 2–14. The full-vs-mechanical judgment is not made —
  a recorded mode is authoritative (council.md step 1). Roster: `owner`,
  `principal`, `designer`, `skeptic`, `consolidator`, `judge`; ruling seats are
  never dispatched by this container.
- **Surface-touching: yes.** The deliverable is user-facing copy on the
  `/usages` person surface: the appended paragraph in
  `council/procedures/usages.md`'s `**Report.**` section changes what a person
  is told when the tool's stderr carries a non-`!` line — the invented
  `⚠️ One non-fatal issue:` framing this card forbids is exactly a mis-told
  report. On a full-council card this seats `designer` as a third generator in
  steps 2–3.
- **Seat resolution (`<seat_resolution_check>`):** `owner`, `principal`,
  `designer`, `skeptic`, `consolidator`, `judge` all resolve — the nine packaged
  seat files are present in the installed package clone (`council/agents/`),
  and no repo-local `.pi/agents/` override directory exists, so nothing shadows
  them.
- **Environment:** step-0 preflight skipped per the autonomous-run substitution
  (Phase 0 cleared it). `python3 council/validate.py` → `All council artifacts
  valid`. Local `main` == `origin/main` at `8d47637` before this card's first
  record push.
- **Gate set for this repo** (authoritative: `.github/workflows/gates.yml`):
  `bunx tsc --noEmit`, `bun test`, `python3 council/validate.py` (run on PR via
  the `gates` workflow). Card-specific acceptance adds the mechanical pin in
  `test/` (the literal `⚠️` in a prohibition context and `verbatim` for
  stderr), requires the FLLWUP-105 remediation sentence and the
  `OPENROUTER_MANAGEMENT_KEY` hard-gate paragraph unchanged, and keeps
  `test/usages-procedure.test.ts`'s existing three-literal pin green. Owner
  gates met in full regardless of change size.
- **Rulings applied here (cited, not re-asked):** R1 — merge authorization is
  run-scoped, but the merge is the orchestrator's act; this container opens the
  PR, gets `gates` green on the PR head, and reports `DONE` with the PR number
  and head SHA. R2 — serial build order (BUG-2 at `59fad63` and FLLWUP-105 at
  `a0b27ca` both merged; this card is the last link in the chain).
- **Decisions gate:** `active` per `.council.json` `gate.mode`, with the known
  `noul` answer-shape drift (FLLWUP-104) making gate calls fail mechanically.
  Expected; a failed gate call is not re-run. No ruling on this card face
  pre-authorizes step-13 follow-ups, so any candidate that surfaces is held by
  draft title and carried in this container's report for orchestrator
  ratification — no card is written before that confirmation.
- **Predecessor context (dedup inputs for step 13):** FLLWUP-107 and FLLWUP-108
  are open cards (filed by FLLWUP-105); BUG-2 holds four step-13 candidates by
  draft title — not this card's to touch, but checked for duplicate homes.

### Step 2 — round 1, independent first pass (jobs 5.1 owner, 5.2 principal, 5.3 designer)

Each seat got only the card + neutral orientation facts. Positions appended;
draft texts verbatim.

**Owner (job-5.1), claims + draft paragraph:**
- Edit is genuinely additive; append one paragraph at end-of-file (the
  remediation paragraph is part of the Report stage, so "after the
  `**Report.**` section" = after it), plus a second test in the existing
  `test/usages-procedure.test.ts` — no new file. Two corrections to the
  card's own text are load-bearing:
  - **C1:** `bun test test/procedures.test.ts` — the file named in the
    acceptance — **does not exist**; the real registration pin is
    `test/env-split-contract.test.ts` M1 pole A (`expect(out.commands).toBe(17)`,
    comment "8 procedure commands"). Correct gates: `test/usages-procedure.test.ts`
    + `test/env-split-contract.test.ts` + full `bun test` + `bunx tsc --noEmit`.
  - **C3 (semantic hazard):** the general "no cause beyond what the tool
    printed" rule, read alone, contradicts FLLWUP-105's authorized cause
    explanation ("the fix ships in a newer package version…"). The paragraph
    needs an explicit scope carve-out or the procedure is self-contradictory
    for exactly the line it's about.
  - **C4:** glyph byte-identity — pin and paragraph must use the identical
    `⚠️` sequence (U+26A0 U+FE0F).
  - **C5:** procedures resolve from `PKG_ROOT`, so unlike the FLLWUP-105 skill
    copy this fix reaches consumers on package update — no remediation
    instruction belongs in this card.
- Draft paragraph (verbatim):
  > **Stderr is evidence, not narration.** Every non-empty stderr line usages.py
  > prints is quoted verbatim, exactly as printed — no added `⚠️` or `!` prefix on
  > a line that does not itself carry one, no invented cause, consequence,
  > severity, or issue count ("one non-fatal issue"), no likelihood the tool never
  > stated. State only what the line itself reports. System-status signals on
  > stderr are uninterpreted tool output: surface them beside the `!` limitation
  > lines, uninterpreted, never as narrated warnings. The only cause this procedure
  > authorizes is the cache-remediation instruction above, for the one line it
  > names. This rule is pinned to a real failure: an earlier run wrapped the
  > tool's line `usages: could not write cache:` in an invented
  > `⚠️ One non-fatal issue:` frame and appended a likelihood the tool never stated.
- Pin design (second test in `test/usages-procedure.test.ts`):
  `expect(procedure).toMatch(/stderr[\s\S]{0,80}verbatim/)` (proximity — bare
  `toContain("verbatim")` is already true at base, pins nothing new);
  `expect(procedure).toContain("⚠️")`; per-line prohibition-context check —
  every line carrying the glyph must match `/never|not\b|no\b|invented|wrong/i`;
  `expect(procedure).toContain("One non-fatal issue")`. Rationale: bare glyph
  containment is vacuous as a guard; the per-line check is the minimal
  mechanical reading of "prohibition context" without the full-sentence-match
  brittleness FLLWUP-105's ruling rejected. Red at base, green at head.
- Predictions: folding the rule into the FLLWUP-105 paragraph instead of
  appending violates "unchanged" (C2); a cheap extra pin
  (`toContain("no prefix, no rewording")`) would close that mechanically.
- Open questions: (1) placement — end-of-file vs immediately after the first
  Report paragraph, both satisfy the letter; (2) version bump — payload change
  per AGENTS.md needs a `package.json` bump in-PR unless EPIC-15's staged
  convention applies; (3) wiki — `[[usages-report]]` stays true, no edit forced.

**Principal (job-5.2), claims + draft paragraph:**
- Cross-seam grounding (line ranges): `log(msg)` (usages.py 38–39) prints to
  **stderr only**; every stderr emission is a raw `usages: …` line with **no
  glyph and no `!`** (`end date is before start date` :706,
  `OPENROUTER_MANAGEMENT_KEY is not set.` :711–714, `could not write cache:`
  :747, `could not write report:` :798); none are appended to
  `report["limitations"]`. The `!` limitation lines are **not stderr at all** —
  stdout/markdown rendering (`human_summary` :671, `render_markdown` :646–649).
  So the card's phrase "non-`!` stderr line" is a category with no members —
  the correct reading is "any stderr line" (testable claim 1: run all error
  paths, assert every stderr line is `usages:`-headed and `! ` appears only on
  stdout).
- **FLLWUP-105 conflict:** the existing remediation sentence itself asserts a
  cause/consequence beyond the printed line ("ships in a newer package version
  but does not reach the skill…") — a blanket "no consequence" rule contradicts
  it for the same literal (testable claim 2: the conflict literal exists at
  usages.md:28). The paragraph must scope the prohibition to unnamed/unknown
  lines and preserve the named remediation as the single authorized explanation.
- **Limitations-block trap:** do not use the term "limitations" for stderr —
  the Intent's "routes system-status signals into the limitations block" invites
  *composing* a limitation line, which is invented framing under another name;
  the `!` block is the tool's own words, repeated, never composed.
- Draft paragraph (verbatim, appends after the FLLWUP-105 sentence, still
  inside `**Report.**`):
  > Any non-empty line the tool writes to stderr is tool output, not a summary:
  > quote it verbatim, exactly as printed. Do not add a `⚠️` or `!` glyph to a
  > line that does not itself carry one, and assert no cause, consequence,
  > severity, or "non-fatal issue" count beyond the line's own words — for
  > example, do not present the line `usages: could not write cache: …` as
  > `⚠️ One non-fatal issue: …` or append a likelihood the tool never printed. A
  > stderr line is uninterpreted tool output: present it as such, and do not
  > promote it into the `!` limitation lines, which are the tool's own printed
  > wording and are repeated, never composed. The one named exception is the
  > remediation sentence above: for the literal `usages: could not write cache:`
  > the procedure already authorizes a stated explanation, and that
  > authorization is what makes it sayable — it is not license to explain any
  > other stderr line.
- Pin: containment-only — `⚠️`, `verbatim`, `stderr` (mirroring the FLLWUP-105
  comment discipline: no negative assertions, no anchor, no ordering, no
  full-sentence match). **Disagrees with the Acceptance's "in a prohibition
  context" clause:** containment cannot express a prohibition; proximity/
  negation matching is wording-coupling — the exact residual FLLWUP-108 owns —
  and re-introduces what the FLLWUP-105 ruling Q1/Q2 fenced out. The pin pins
  rule-text presence; the Acceptance should say so (testable claim 3: an
  endorsing `⚠️` sentence elsewhere keeps the containment pin green, so the pin
  cannot certify prohibition — accept the boundary or route to FLLWUP-108).
- Also: `test/procedures.test.ts` does not exist; "there is no procedure-count
  pin in `test/`" (`prose.test.ts` iterates procedures; `seats.test.ts`/
  `paths.test.ts` cover `proceduresDir` but count nothing) — the Acceptance
  cites a phantom backstop. *(Directly contradicts owner's C1 identification of
  `test/env-split-contract.test.ts` M1 pole A — a checkable fact for the
  skeptic.)*
- Open questions: exit codes (2 = range/key fatal, 3 = report-write fatal) —
  flag, not fold in; sole-exception wording choice ("the one named exception"
  vs "explain only what this procedure names") — owner picks one so wording and
  pin agree.

**Designer (job-5.3), claims + draft paragraph:**
- New sibling section `**Stderr relay.**` appended after the existing
  `**Report.**` block. Single mechanical rule — verbatim relay, no invented
  glyph, no added cause/consequence/severity/count — pinned to the actual
  misframing as a **recognition pattern at the moment of composition**, not a
  prohibition to recall. Norman framing: signifier + worked example + forcing
  function ("the relay is authorized, the narration is not") in one paragraph;
  knowledge-in-the-world, not the head.
- Draft paragraph (verbatim):
  > **Stderr relay.** If the tool prints anything else to stderr — a warning,
  > an error, a status note — surface each non-empty line to the user verbatim.
  > Do not prefix it with `⚠️`, `!`, or any warning marker the line does not
  > itself carry; do not append a cause, consequence, severity, or count the
  > line does not state. These lines are uninterpreted tool output — the relay
  > is authorized, the narration is not. Worked example (this seat's own past
  > failure on this surface): the `usages: could not write cache:` warning was
  > relayed as `⚠️ One non-fatal issue: <bare line> (<appended likelihood>).`
  > The `⚠️` glyph, the "non-fatal issue" label, and the parenthetical were all
  > invented by the seat; this procedure authorizes none of them. The correct
  > relay is the bare line.
- Pin (additive second test): `expect(procedure).toContain("⚠️")` + proximity
  regex `expect(procedure).toMatch(/stderr[^\n]*verbatim/si)`. P4: a loose
  `toContain("verbatim")` alone is green even with the new section dropped
  (the FLLWUP-105 sentence already contains "verbatim") — proximity is what
  makes the pin sensitive. Claim-preserving rewording stays green; word-drop
  goes red (FLLWUP-105 lesson).
- Predictions P1–P8, notably: P2 (stripping the worked example keeps the
  `⚠️` containment pin green while the recognition pattern is gone — suggests a
  worked-example literal pin); P7/OQ1 (the card quotes the prefix
  `⚠️ One non-fatal issue:` but not the appended likelihood — owner should
  source the exact relay text from the run ledger before quoting; if none
  exists, use the structural shape with `One non-fatal issue` flagged as
  illustrative); P8 (new prose uses no `$…`/`@…` tokens — FLLWUP-107's renderer
  invariants unaffected).
- Open questions: OQ2 — is a one-line neutral source label ("The tool also
  printed:") authorized, or does the strictest reading of "only what the line
  itself reports" forbid any agent-authored framing word? Designer prefers
  authorizing it but defers — the card's wording is binding. OQ4 — heading
  choice (`**Stderr relay.**` vs `**System status.**` vs no heading) is
  word-level taste. OQ5 — the new rule and the existing "repeat any `!`
  limitation lines" sentence read together as a clean two-bucket rule.

*Round-1 observation (facilitator):* all three seats independently flag the
FLLWUP-105 conflict and converge on a scope carve-out preserving the named
remediation; the live disputes are (a) pin sensitivity — containment-only
(principal) vs proximity/prohibition-context (owner, designer); (b) placement
and heading; (c) whether "verbatim" needs proximity to "stderr" to pin
anything (owner C-analog + designer P4 say yes, principal's third literal
`stderr` is a different mechanism); (d) the phantom `test/procedures.test.ts`
reference and what the actual registration pin is; (e) source-label latitude
(designer OQ2). Per <convergence_is_not_evidence>, the three-way agreement on
the carve-out is a hypothesis, not a settled fact — the skeptic tests it at
step 4.

### Step 3 — round 2, bounded exchange (jobs 5.4 owner, 5.5 principal, 5.6 designer)

**Converged this round (still hypotheses until the skeptic runs them):**
- Placement: end-of-file bold-lead paragraph after the FLLWUP-105 remediation
  paragraph (designer conceded its in-Report reading was a misread — the
  FLLWUP-105 remediation is an unbolded paragraph after the `**Report.**`
  block; designer's cited line number 17 is off, actual ~26 — noted for the
  skeptic). Principal adopted owner's text "verbatim, I would change nothing
  substantive" but prefers a merged lead `**Stderr relay — evidence, not
  narration.**`.
- Worked example: name the prefix `⚠️ One non-fatal issue:` (card-quoted),
  describe the appended likelihood only as a class ("a likelihood the tool
  never stated"), never reproduce invented text (owner measured
  `One non-fatal issue` absent from the file and all tool output paths;
  designer conceded its round-1 parenthetical placeholder was itself the
  failure mode the card targets).
- Source label: NO agent-authored framing word — designer conceded OQ2 to the
  strict reading; owner forbids; principal's own revised draft text carries no
  label even while its interpretation note says a non-evaluative label would be
  authorized. Ship-text converges on no-label.
- "Any non-empty stderr line", not "non-`!` stderr line" (owner verified the
  principal's category claim: all stderr emissions glyph-free, `!` lines
  stdout/markdown only).
- FLLWUP-105 carve-out must be explicit in the paragraph (all three; owner
  measured the conflict live).
- Card-text corrections: `test/procedures.test.ts` does not exist (both
  seats initially wrong in opposite directions — principal conceded owner's
  C1: the real registration pin is `test/env-split-contract.test.ts:126-133`
  M1 pole A, `expect(out.commands).toBe(17)`).
- C5 (no remediation instruction in this card — procedures are packaged-only,
  resolve from `PKG_ROOT`): principal verified `council/scaffold/` contains no
  procedures files; conceded.

**Still disputed — pin shape (three competing designs, all with testable
claims):**
- **Owner (5.4):** `toContain("⚠️")` + proximity `/stderr[^\n]*verbatim/si` +
  no worked-example literal (P2 gap declared, not hidden). Claimed measured:
  both predicates red at base, green only via the new paragraph.
- **Principal (5.5):** whitespace-normalized proximity (prose.test.ts idiom
  `text.replace(/\\s+/g, " ")`) anchored on the head-only token `non-empty
  stderr` — `/non-empty stderr[\\s\\S]{0,120}verbatim/i` — + `⚠️` + per-line
  prohibition check (minimal negation set) + `toContain("One non-fatal
  issue")` worked-example literal. **New falsifiable claim:** the owner's
  `{0,80}` bound is a coincidence — on collapsed base text the `stderr`→
  `verbatim` gap is ~81 chars (through the FLLWUP-105 sentence), so
  `/stderr[\\s\\S]{0,81}verbatim/` would be green at base and the pin would
  pin the FLLWUP-105 sentence, not the new rule; mutation test demanded. Also
  claims positive-context mutation ("prefix each stderr line with `⚠️`")
  passes containment+proximity but fails the per-line check.
- **Designer (5.6):** back to three-literal containment (`⚠️`, `verbatim`,
  `stderr`), no proximity, no per-line check — proximity/negation is
  FLLWUP-108's wording-coupling territory, re-introducing the class the
  FLLWUP-105 ruling fenced out. P11: stripping the paragraph reds `⚠️`
  (FLLWUP-105 has no glyph) so the pin catches rule-drop; P12: stable across
  claim-preserving rewording; P13: reds on rule-gutting rewording that drops
  `verbatim`.
- The card's own pin clause — "the literal `⚠️` in a prohibition context and
  the phrase `verbatim` for stderr" — is read three ways: containment-only
  can't express prohibition (principal R1); per-line negation check is the
  minimal faithful reading (owner R1, principal R2 concedes); proximity
  expresses "verbatim for stderr" but is wording-coupling (designer R2).

**Also disputed:**
- **Version bump** — principal claims AGENTS.md makes a `package.json` bump
  required in this PR ("payload or engine behavior changes"; "in the same PR
  as the behavior change"). Owner round-1 open question: EPIC-13/14 staged-
  bump convention vs in-PR bump; FLLWUP-105 (same surface, same payload class,
  merged `a0b27ca`) shipped **without** a bump. Unresolved — flagged for
  consolidation.
- Minor wording: carve-out phrasing ("the one named exception" vs "the only
  cause this procedure authorizes" — designer prefers the former, taste);
  whether "repeated, never composed" stays in the body (designer holds);
  lead text (`**Stderr is evidence, not narration.**` vs merged variant).

**Ship-text candidates at end of round 2:** owner's revised `**Stderr
relay.**` paragraph (designer-structured, principal-scoped, no-label);
designer's `**Stderr is evidence, not narration.**` paragraph; principal's
owner-verbatim adoption with merged lead. All carry: any-stderr-line rule,
glyph prohibition, class-described likelihood, no-composition principle,
FLLWUP-105 carve-out, worked example.
