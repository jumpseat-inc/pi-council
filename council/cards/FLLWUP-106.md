---
id: FLLWUP-106
title: The usages procedure forbids inventing framing around the tool's stderr
state: Done
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

### Step 3 (cont.) — round 3, final positions (jobs 5.7 owner, 5.8 principal, 5.9 designer). Cap reached.

**Owner (5.7) — measured, FINAL:**
- Mutation arithmetic settled: collapsed gap `stderr`→`verbatim` = **92**
  (not 86, not 81): `{0,80}` and `{0,81}` both red at base, `{0,91}` first
  true bound. Principal's mechanism (proximity pins FLLWUP-105's sentence;
  later reword flips green at base) confirmed; exact number refuted. Fix: move
  the anchor into the new paragraph — `non-empty stderr` is base-absent
  (measured: base has exactly one `stderr`, zero `non-empty stderr`).
- **FINAL pin** (new `test()` in `test/usages-procedure.test.ts`):
  1. `toContain("do not add a ⚠️")` — prohibition context as literal
     prohibition (stronger than bare glyph, which stays green on gutted and
     hostile variants);
  2. `toContain("One non-fatal issue")` — worked-example literal;
  3. `procedure.replace(/\s+/g, " ")` matched against
     `/non-empty stderr[\s\S]{0,120}verbatim/i` — base-red by anchor absence,
     not gap luck.
  Measured mutation matrix: strip → all 3 red; gutted (example kept, rule
  dropped) → 2 green only; hostile ("prefix each stderr line with ⚠️…") →
  3 green only; legitReword → 1 green only. No false trips. Bare-`verbatim`
  and bare-`⚠️` pins dropped (green everywhere / subsumed).
- **FINAL paragraph:** `**Stderr discipline.** Every non-empty stderr line the
  tool prints is quoted verbatim, exactly as printed: no added prefix of any
  kind — do not add a ⚠️ or ! to a line that does not itself carry one — and
  no invented cause, consequence, or non-fatal-issue count beyond what the
  line itself reports. System-status lines are uninterpreted tool output:
  surface them as printed, without explanation. Worked example from this
  procedure's own intake: a seat wrapped `usages: could not write cache:` in
  `⚠️ One non-fatal issue:` and appended an invented likelihood — that framing
  is exactly what this rule forbids. (The remediation route for that specific
  line, above, is unchanged.)` — glyphs unbackticked so pin 1 matches
  verbatim.
- **Version bump: NO** — a0b27ca shipped the identical payload class with no
  package.json change; releases are batched `chore(release)` commits
  (ef8bc9a pattern); recommends one batched release covering 105+106.
- Accepted tradeoffs: hostile-contradiction (pin-green text violating its own
  prohibition) not catchable by any containment/proximity pin — FLLWUP-108
  territory; `{0,120}` arbitrary-but-harmless (redness at base comes from
  anchor absence).

**Principal (5.8) — FINAL:**
- Corrected own round-2 arithmetic (86 on normalized text; any bounded
  `stderr→verbatim` ≤86 green at base; raw-text redness is the wrap
  coincidence — the FLLWUP-105 skeptic's "V2 line-break splits
  `newer package\nversion`" class). Named own blind spot: quoted `{0,80}/{0,81}`
  against the owner's round-1 regex.
- **FINAL pin** (endorsing owner's acceptance reading, repairing its unit):
  `toContain("⚠️")` (rule-drop falsifier, base-red, byte-identical
  U+26A0 U+FE0F) + `toContain("verbatim")` + `toContain("stderr")`
  (acceptance literals; green-at-base is fine — the acceptance says
  "contains", base-redness carried by the glyph) + glyph-neighborhood negation
  check on whitespace-normalized text (every `⚠️` occurrence must have
  `/\b(?:no|not|never|without|do not|don't|forbid)\b/i` within ±160 chars) —
  wrap-robust, reds on polarity inversion.
- **Drops own worked-example literal** (`One non-fatal issue`): a 4th lexical
  literal is the exact class the FLLWUP-105 ruling fenced (its 4-literal pin
  failed variant A); Acceptance bullet 2 is judge-verified semantics, not
  bullet 3's mechanical pin. Endorses owner's declared-gap position.
- **Version bump: claim WITHDRAWN** — staged-epic-bump is the operative
  convention for this chain (EV-38 "the owner reads the bump as landing at
  epic close, not per card"; EV-36/EPIC-9 package.json stays 0.18.0 at
  closure; FLLWUP-95 the release is a Backlog card, steward-ruled not a
  closure condition). Residual note for the orchestrator, not this card.
- Testable claims: (1) the ≤86 green-at-base bound; (2) re-wrap flips
  raw-text redness green with no new rule; (3) polarity-inversion mutation
  separates containment-only from neighborhood-check; (4) variant-A stability.

**Designer (5.9) — FINAL:**
- Lead: recommends the principal's merged `**Stderr relay — evidence, not
  narration.**` (category anchor + operational dichotomy; owner's bare
  `Stderr relay.` loses the claim, own bare dichotomy loses the anchor).
- Body: holds `repeated, never composed` over `relay authorized, narration
  not` — verb-level forcing function (names the verb the person substitutes:
  summarize, explain, frame).
- Worked example: tighten `invented likelihood` to `invented likelihood
  assessment` / `invented probability claim` so the class is pattern-matchable
  without reproducing the invented text.
- **Pin: holds three-literal containment** (round-3 framing: `⚠️` in
  prohibition context, `verbatim`, worked-example anchor) against both
  proximity designs — "three-literal containment cannot be passed by any
  mutation that drops a literal, by construction". NOTE for the skeptic: this
  claim is about *drop* mutations; the hostile/polarity-inversion mutation
  keeps all literals and should pass containment — designer's own round-2
  OQ conceded containment can't certify prohibition. Predictions P-R1..P-R4
  are cold-read smokes (P-R4's deletion-class matrix is testable).
- Carve-out: no new objection; keep additive.

**State at cap:** paragraph text near-converged — remaining prose choices are
lead (`Stderr discipline.` vs `Stderr relay — evidence, not narration.`), body
phrase (`repeated, never composed` vs `relay authorized, narration not` vs
owner's round-3 synthesis), likelihood class wording, carve-out phrasing.
Pin: **three final designs**, discriminated by named mutations (strip / gutted
/ hostile-polarity / legitReword / gap-coincidence). Cross-candidate
incompatibility to test: owner's pin 1 literal `do not add a ⚠️` is absent
from the principal's adopted owner-round-2 text ("no added `⚠️` or `!`
prefix"); each seat's pin+paragraph pair is self-consistent but cross-pairing
is unsettled. Version bump resolved: no bump this card, batched-release
residual (owner+principal agree). Registration pin resolved: phantom
`test/procedures.test.ts` named in acceptance; real gates are
`test/usages-procedure.test.ts` (content) + `test/env-split-contract.test.ts`
M1 pole A (registration, 17 commands).

### Step 4 — skeptic attack, all runnable objections settled (job-5.10) — NO-BLOCK

Transplant battery in `/tmp/fllwup106` (removed after run; main checkout
untouched, `git status` clean at end). T1 (owner's FINAL paragraph) extracted
byte-exact from this card; O1 pin literal likewise.

- **OBJ-1 — closed-red (record correction, not deliverable).** The round-3
  "settled" gap arithmetic is wrong: measured min regex-gap `stderr`→`verbatim`
  = **86** (both collapsed and raw) on the real base file; `{0,80}`/`{0,81}`
  red at base (confirmed), **`{0,86}` GREEN at base**, `{0,91}` green. Owner's
  "92, first-true {0,91}" was start-to-start distance, not what `.{0,N}`
  constrains; principal's "86" was right. Pin 3's base-redness survives —
  `non-empty stderr` occurrences at base = 0 (and pre-105 = 0) — redness by
  anchor-absence, not gap luck.
- **OBJ-2 — pin discrimination matrix (closed-green conclusions, two
  closed-red refutations).** Pins: O = owner `[O1 O2 O3]`, P = principal
  `[P1 P2 P3 P4]`, D = designer `[D1 D2 D3]`; 1 = green.

  | file | O | P | D |
  |---|---|---|---|
  | base (pre-edit = strip) | 000 | 0110 | 011 |
  | pre-105 base | 000 | 0100 | 010 |
  | head-T1 (`**Stderr discipline.**`) | 111 | 1111 | 111 |
  | head-T2 (merged lead) | 111 | 1111 | 111 |
  | head-T3 (+ `repeated, never composed`) | 111 | 1111 | 111 |
  | gutted (example kept, rule dropped) | 010 | **1111** | **111** |
  | hostile (endorsement "prefix each stderr line with a ⚠️…") | 111 | 1110 | 111 |
  | legitReword | 010 | 1111 | 111 |

  Confirmed: no false trips on any converged prose variant; P4 reds on
  polarity inversion as claimed; O fully red on strip. **Refuted (closed-red):**
  designer P13 — 3-literal containment is fully green on gutted (base's own
  `verbatim`×2/`stderr`×1 from the FLLWUP-105 sentence; no edit confined to
  the new paragraph can red them); principal's whole pin fully green on gutted
  (P4 passes fortuitously — the pre-existing "does **not** reach" sits 22
  chars before the example glyph). **Only O catches gutted**, the exact case
  bullet 3 exists for ("so the rule cannot be dropped silently").
- **OBJ-3 — closed-green for owner; closed-red for principal/designer as
  literal readings of the binding acceptance.** Only O1 asserts the glyph
  within a prohibition phrase (`do not add a ⚠️`, byte-exact from the card)
  and O3 anchors `verbatim` to a stderr-form token; P asserts three separate
  containment facts (no relation; P4 accepts "not a problem"; satisfied
  fortuitously on gutted); D asserts no prohibition context at all (own R2
  concession). If the merged pin diverges from the owner design, the
  acceptance deviation is a real open item.
- **OBJ-4 — closed-green on the documented surface.** Real error-path runs,
  key vars unset: bad range → exit 1 `usages: cannot parse range 'bogus
  bogus'`; reversed dates → exit 2 `usages: end date is before start date`;
  missing key → exit 2, four stderr lines; unwritable report → exit 3
  `usages: could not write report: [Errno 21] Is a directory`; offline
  success → exit 0, 6 `!` lines on stdout, 0 bytes stderr. Boundary: `--today
  garbage` → exit 1 ValueError traceback (not `usages:`-headed) — never
  passed by the procedure (fixed invocation `--range "$ARGUMENTS"`), so the
  documented-surface claim holds; the any-stderr-line rule surfaces a
  traceback verbatim too. **Open-untested:** the unwritable-*cache* path —
  `save_cache` guarded by `if not args.offline` (:746), no-offline path
  key-gated; its single emission (:747) source-verified glyph-free.
- **OBJ-5 — closed-green (additivity).** First 1544 bytes byte-identical on
  transplant; FLLWUP-105 three literals still true on the appended file;
  `!`-limitation sentence and `OPENROUTER_MANAGEMENT_KEY` paragraph untouched;
  T1 carries no `$…/@…` tokens (FLLWUP-107 invariants unaffected).
- **OBJ-6 — closed-green (registration).** `bun test
  test/env-split-contract.test.ts -t "M1 pole A"` → 1 pass / 0 fail; a body
  append cannot move a 17-command count; M1 pole B is the designed red
  counterpart.
- **OBJ-7 — closed-green (version-bump basis).** `git show a0b27ca
  --name-only | grep -c package.json` → 0; both trees `0.34.2` (release
  `80c02c6` ancestor of `a0b27ca`); bumps are separate `chore(release)`
  commits; wiki `[[steward]]` records EPIC-14 ruled the bump not a closure
  condition. No-bump basis factually grounded.
- **OBJ-8 — closed-green with constraint (byte identity).** All 37 `⚠` sites
  in the card are U+26A0 U+FE0F; T1 and O1 carry the identical sequence;
  implementation constraint: paragraph glyph and pin literal glyph must both
  be copied (with U+FE0F) from the card — a retype to bare U+26A0 silently
  breaks `toContain`.

**Verdict: NO-BLOCK.** The deliverable (owner's paragraph + owner's pin)
survives every runnable attack. Standing items, none blocking: (1) the
round-3 record line "gap=92, {0,91} first true" is corrected to "gap=86,
{0,86} first true" (principal right, owner's distance measure wrong); (2)
principal/designer pins refuted on the real file — the merged PR must carry
the owner pin or surface the acceptance deviation; (3) cache-write stderr
path open-untested at runtime (offline-gated × key-gated), source-verified
only; (4) U+FE0F byte-identity constraint.

### Step 5 — consolidator synthesis (job-5.11)

**Settled:** placement (end-of-file bold-lead paragraph, inside the
`**Report.**` stage); scope "any non-empty stderr line"; FLLWUP-105 carve-out
explicit; worked example names the prefix, likelihood described as a class,
invented text never reproduced; no agent-authored framing word; U+26A0 U+FE0F
byte-identity (S6-adjacent, OBJ-8); additivity only (OBJ-5); phantom
`test/procedures.test.ts` corrected to the two real gates (OBJ-6). Disputes
settled by measurement: **S1** version bump — no bump this card, batched
`chore(release)` residual at orchestrator level (OBJ-7); **S2** the owner pin
is the only acceptance-conformant pin and the only one that catches gutted
(OBJ-2/OBJ-3); **S3** gap arithmetic corrected to 86 first-true (OBJ-1);
**S4** all three prose variants pass every pin — the lead/body wording choice
is taste, not measured difference; **S5** polarity inversion is FLLWUP-108
territory (accepted boundary); **S6** "limitations" term avoided for stderr.

**Open judgment (consolidator's sorting, routed at step 6):**
1. Lead text — `**Stderr discipline.**` (owner FINAL) vs `**Stderr relay —
   evidence, not narration.**` (principal merged lead, designer-recommended).
2. Body phrasing — owner's round-3 synthesis (T1 wording) vs designer's
   `repeated, never composed` (verb-level forcing function).
3. Carve-out phrasing — owner's parenthetical vs "the one named exception".
4. Likelihood class wording — "invented likelihood" vs "invented likelihood
   assessment" / "invented probability claim".
5. Cross-pair consistency — implementation constraint, owner's job: if prose
   changes, pin 1 (`do not add a ⚠️`) must still match byte-exact.
6. **Acceptance-deviation confirmation** — OBJ-3's finding that only the
   owner pin satisfies bullet 3 as written: product-owner should confirm the
   acceptance bullet means the O-conformant pin, or the shipped pin diverges
   from the acceptance as written. The one judgment call that could become a
   blocking open objection if left ambiguous.

**Open objections (none blocking):** OBJ-U1 unwritable-cache stderr path
open-untested at runtime (offline-gated × key-gated; source-verified
glyph-free; the any-stderr-line rule covers it regardless); OBJ-U2 designer
cold-read predictions P-R1–P-R4/P10 never run (optional out-of-band smokes,
not acceptance requirements — step-13 candidates if unfurled); OBJ-U3 batched
release for 105+106 is an orchestrator-level residual, explicitly not a
closure condition for this card (EPIC-14 ruling, wiki `[[steward]]`).

Consolidator: ready to hand off — owner FINAL paragraph + owner pin survive
every runnable attack; the prose calls and the acceptance confirmation owe
rulings; owner owns pin↔paragraph alignment whatever prose is chosen.

### Step 6 — routing (facilitator)

The consolidator's open-judgment items 1–4 and 6 go to `product-owner`; item
5 is owner-implementation latitude within whatever prose is ruled. This
container never dispatches ruling seats. Phase-1 rulings checked first
(escalation contract, step 1): R1 (merge authorization) and R2 (build order)
— neither answers the lead/body/carve-out/likelihood wording choices, and
neither confirms what acceptance bullet 3's "in a prohibition context" means
mechanically. No other ruling is recorded on this card face. **Card held at
`Deliberating` pending the ruling** — steps 7+ do not start. Escalated to the
orchestrator with facts only; no worktree, branch, PR, or implementation
exists yet; at the time of escalation local `main` == `origin/main` at
`64edcd3` (this card's step-5 record commit).

### Product-owner ruling on the step-6 escalation (resumed container, verbatim)

The orchestrator dispatched `product-owner` on the step-6 escalation packet
and returned the following ruling, appended verbatim and binding:

> ### Q1 — Lead text: (a)
>
> Exact lead: `**Stderr discipline.**`
>
> ### Q2 — Body phrasing: owner's round-3 synthesis (T1), verbatim
>
> Append this paragraph end-of-file, after the FLLWUP-105 remediation
> paragraph (placement settled at step 3; the FLLWUP-105 sentence and
> `OPENROUTER_MANAGEMENT_KEY` paragraph untouched, additive only). Copy
> byte-exact from the card's step-3 owner-FINAL record — the glyph must be
> the recorded U+26A0 U+FE0F sequence, never retyped to bare U+26A0 (OBJ-8):
>
> > **Stderr discipline.** Every non-empty stderr line the tool prints is
> > quoted verbatim, exactly as printed: no added prefix of any kind — do not
> > add a ⚠️ or ! to a line that does not itself carry one — and no invented
> > cause, consequence, or non-fatal-issue count beyond what the line itself
> > reports. System-status lines are uninterpreted tool output: surface them
> > as printed, without explanation. Worked example from this procedure's own
> > intake: a seat wrapped `usages: could not write cache:` in `⚠️ One
> > non-fatal issue:` and appended an invented likelihood — that framing is
> > exactly what this rule forbids. (The remediation route for that specific
> > line, above, is unchanged.)
>
> ### Q3 — Carve-out phrasing: owner's parenthetical
>
> Exact final sentence: `(The remediation route for that specific line,
> above, is unchanged.)`
>
> ### Q4 — Likelihood class wording: "an invented likelihood"
>
> Exact phrase as it appears in the worked-example sentence above.
>
> ### Q5 — Bullet 3 confirmed as the O-conformant pin; no acceptance
> deviation exists
>
> The pin ships as a new `test()` in `test/usages-procedure.test.ts` and
> **must** carry exactly these three predicates (owner-implementation
> latitude covers the exact test scaffolding, but the three predicates and
> their byte-exact literals are fixed; paragraph+pin ship as one
> self-consistent pair):
>
> ```ts
> const procedure = readProcedure("usages.md");
> // O1 — glyph in a prohibition context (byte-exact; U+26A0 U+FE0F, copied
> // from the card)
> expect(procedure).toContain("do not add a ⚠️");
> // O2 — worked-example literal
> expect(procedure).toContain("One non-fatal issue");
> // O3 — proximity anchored on the base-absent token (red at base by
> // anchor-absence, not gap luck; base occurrences of "non-empty stderr" = 0)
> expect(procedure.replace(/\s+/g, " ")).toMatch(/non-empty stderr[\s\S]{0,120}verbatim/i);
> ```
>
> Real gates for the acceptance's phantom `test/procedures.test.ts`
> reference: `test/usages-procedure.test.ts` (content) +
> `test/env-split-contract.test.ts` M1 pole A (registration, 17 commands) —
> record this correction (OBJ-6). Also adopt OBJ-1's record correction (gap
> = 86, `{0,86}` first true, not 92/`{0,91}`).

### Step-13 dispositions (ruled with Q1–Q5, applied at resumed step 13)

- **OBJ-U1** (unwritable-cache stderr path runtime smoke) — **Drop**
  (source-verified glyph-free; the shipped any-stderr-line rule covers it by
  construction).
- **OBJ-U2** (designer cold-reads P-R1–P-R4/P10) — **Drop** (not acceptance
  requirements; the battery measured what matters).
- Batched release for 105+106 — orchestrator-level residual, not a step-13
  candidate; surfaced in the runner's DONE report, no card written.

No escalations remain; nothing reverses R1/R2. Steps 7+ begin on this basis.

### Step 7 — spec written and committed (facilitator, resumed container)

Spec: `docs/superpowers/specs/2026-09-22-FLLWUP-106-design.md` — self-reviewed
against the settled record (no placeholders; consistent with steps 3–6 and the
Q1–Q5 ruling; scope confined to the card's `goal`; unambiguous for an owner
with no deliberation memory: paragraph byte-exact from the ruling, pin
predicates fixed, placement end-of-file after the FLLWUP-105 remediation
paragraph, additive only, U+26A0 U+FE0F copied not retyped, no version bump,
real gates named).

### Step 8 — owner implemented (job-7.1, 8.7m, 28 turns)

Worktree `/home/tista/codes/pi-council-fllwup-106`, branch
`feat/fllwup-106-stderr-discipline` off `origin/main` @ `bd77bbb` (post-105
chain preserved); TDD — pin test red at base (O1 first failure), green after
the paragraph landed. **PR #106 open against `main`, head SHA `8cede8b`**
(observed via `gh pr view`: state OPEN, headRefOid matches). Byte-identity:
owner extracted the paragraph programmatically from the spec, hexdump-verified
both ⚠️ glyphs U+26A0 U+FE0F (2 occurrences, 0 bare U+26A0); re-wrapped at 78
cols with the two ruled pin literals (`do not add a ⚠️`, `One non-fatal
issue`) kept contiguous — the spec's blockquote wrapping itself breaks them.
One deviating byte: EOF newline added to usages.md (all 7 sibling procedures
end with one; no sentence byte changed). Gates in order: `bunx tsc --noEmit`
exit 0; `bun test` 1468 pass / 6 skip / 0 fail (113.7s); `council/validate.py`
clean. New pin: `usages procedure pins stderr discipline: glyph prohibition,
worked-example literal, and verbatim proximity` (2 pass / 0 fail, 6 expects).
No version bump. Status `In Review` written from the observed open PR — the
owner's gate report is not the precondition.

### Step 9 — skeptic verification at branch head (job-7.2, 6.2m, 31 turns) — cycle 1 of ≤3, NO-BLOCK

Step-8→9 re-check (EV-69): no `council_route` tool in this container's
grant set; re-check basis recorded — recorded ROOT mode `Deliberate` is the
strongest mode, the ratchet is escalation-only (`effective =
strongest(recorded, verdict)`, `gate-route.ts`), so no observed-set override
can re-route; no re-gate owed. Skeptic dispatched at PR #106 head `8cede8b`
in the same worktree, main path untouched.

Gates re-run in full at head, with failure-injection proof (each watched
red, then green on restore): `bunx tsc --noEmit` exit 0 (injected TS2322 →
exit 2); `bun test` 1468 pass / 6 skip / 0 fail, 112.30s; `council/validate.py`
clean (injected frontmatter fault → FAIL line, exit 1).

Probes, all closed-green: (1) paragraph byte-identity vs the ruling Q2
blockquote — whitespace-normalized 676/676 chars, ends with the exact ruled
carve-out sentence; (2) glyphs — both ⚠️ hex `e29aa0efb88f` (U+26A0
U+FE0F), 0 bare U+26A0; (3) additivity — head[:len(base)] == base exactly,
the sole change to existing content is the EOF newline (`base + b"\n" ==
head[:len(base)+1]`), FLLWUP-105 sentence and `OPENROUTER_MANAGEMENT_KEY`
paragraph byte-identical, EOF-newline judged non-violating (all siblings end
with `\n`, minimal byte to append); (4) pin — exactly the three Q5
predicates, 2 pass / 0 fail at head; (5) red-at-base — all three literals 0
occurrences at `bd77bbb`, harness 1 pass / 1 fail (O1 red) on a base
transplant; (6) gutted discrimination — rule sentence dropped, prohibition
and example kept → O1+O2 green, O3 red: pin NOT fully green on gutted, the
step-4 battery's requirement; (7) diff = exactly two files (usages.md 11+/1−
— the 1− is the no-EOF-newline marker, same sentence; test file 25+/0−), 0
package.json changes; (8) predecessor pins — FLLWUP-105 test byte-identical
and green, `env-split-contract` M1 pole A 1 pass / 0 fail (17 commands).

Verdict: NO-BLOCK, no open objections. Verify-cycle counter: 1 used, 0
fix-reverify rounds consumed.

### Step 10 — judge verdict (job-7.3, 0.3m, 4 turns) — PASS

Input: the card's `goal` verbatim + the step-9 Skeptic evidence, nothing
else; subject named as PR #106 head `8cede8b` (branch-head worktree, not the
local `main` checkout); frame stated — judging precedes the mechanical merge,
which the facilitator executes and no seat performs. Verdict **PASS**: the
appended paragraph is a direct statement of the goal (verbatim quote in the
verdict), and the mechanical pin makes silent regression detectable (judge's
own `bun test` run confirmed 2 pass / 0 fail on the pin).

### Step 11 — result presented; merge is the orchestrator's act (R1)

Presented on this card face and in the runner's DONE report: the spec
(`docs/superpowers/specs/2026-09-22-FLLWUP-106-design.md`), PR #106 (head
`8cede8b`), the Skeptic's NO-BLOCK verification (step 9), and the judge's
PASS (step 10). Per R1 and `<main_repo_immutability>` this container does
not merge: the orchestrator executes the deterministic merge check
(features-deliver, mode Deliberate — all five criteria) with the admin
bypass R1 authorizes, pinned to the exact head SHA criterion 2 was read
against. Card state remains `In Review` until the merge lands green — `Done`
is written only from the observed merged artifact (step 12), by the runner
that observes it.

### Step 13 — follow-up dispositions applied from the ruling; nothing filed

Applying the resumed dispatch's confirming ruling (escalation contract,
step 1: an answered question is not re-asked; the dispositions below are the
ruling's own words):

- OBJ-U1 (unwritable-cache stderr path runtime smoke) — **Drop** (source-
  verified glyph-free; the shipped any-stderr-line rule covers it by
  construction).
- OBJ-U2 (designer cold-reads P-R1–P-R4/P10) — **Drop** (not acceptance
  requirements; the battery measured what matters).

No cards written; nothing held (both dispositions reached); no
`council_followup_review` re-call — the decisions gate's `noul` drift (open
FLLWUP-104) makes follow-up gate calls fail mechanically and the run's
standing fact bars re-running a failed gate call; the ruling above already
answers, so a gate re-call could only re-decide a decided question.
Batched release for 105+106 — orchestrator-level residual, not a step-13
candidate: no card, surfaced in the DONE report.

No other follow-ups surfaced: the run's out-of-scope items (polarity
inversion = FLLWUP-108, already open) all have existing homes; no new
candidates were drafted.

### Run summary (resumed container)

Steps 1–6 complete prior to escalation; ruling applied and appended verbatim
(Q1–Q5 + dispositions); steps 7–13 executed this container: spec `bd77bbb`,
step-8 record `4bc6d9a`, step-9 record `5371811`. Verify cycles used: 1 of ≤3
(0 fix-reverify rounds). Round caps: step 3 cap reached pre-escalation (3
rounds); step 9 cap 1/3. No ruling seat dispatched by this container. PR #106
open at `8cede8b` awaiting the orchestrator's R1 merge.

### Step 12 — post-merge reconciliation (orchestrator)

- PR #106 merged to `main` under Phase-1 ruling R1: `gh pr merge 106 --squash
  --admin --match-head-commit 8cede8b58276cc4feadced3771559e6308fec120`.
  Merge commit `98a62a95e9f9ef0f1842ca568b59fcdd3049aff8`.
- Gates re-run on the merged SHA `98a62a9`: `bunx tsc --noEmit` exit 0;
  `python3 council/validate.py` → `All council artifacts valid`;
  `bun test test/usages-procedure.test.ts test/env-split-contract.test.ts`
  → 6 pass / 0 fail.
- Card set `Done`; board line moved to the Done column. Deterministic merge
  check recorded mode `Deliberate` (run substrate), criteria 1–5 satisfied at
  the pinned head.
