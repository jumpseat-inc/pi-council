---
slug: po-fllwup43-step6
card: FLLWUP-43
epic: EPIC-9
seat: product-owner
step: 6
date: 2026-09-17
---

# FLLWUP-43 — product-owner step-6 ruling

Card state at ruling: `Deliberating` (goal is **not yet immutable**;
the conjunct-B opacity finding below is escalated to [[steward] for
amendment under the engineering-board amendment authority). Head SHA
at subject: main checkout `c02380c` == `origin/main`. Step-6
escalation facts: two `closed-red` objections (O1, O2), seven
open-judgment questions (Q1–Q7), and a card-`goal` conjunct-B defect
whose wording authority is `steward`'s.

The methodology is observed-artifact-from-Skeptic-runs, not
seat-reports-as-facts: every load-bearing claim in the consolidator's
synthesis is verified by `job-3.7` against the live tree at head
`c02380c`. Where the rules below reach a verdict on disagreement, they
do so by grounding in wiki pages, board history, or — when neither
speaks — the cheapest-to-reverse call.

---

## R1 — Q1 (wrapped-line policy): **out of scope for this card's `goal`; document the wrap residual in the new copy; file a step-13 follow-up card for the loud gate.**

The fact of silent wrap truncation is settled (`closed-green` Skeptic
objection 3: `parse_frontmatter` terminates frontmatter on a bare
non-`key: value` line; `validate.py:61-63` ends frontmatter; `goal`
silently becomes its first line; `validate.py` exits 0). The dispute
is the *policy*.

Owner r2: in scope, add a bare-line-termination FAIL with red-first
test. Principal r2: out of scope for this card's `goal`, document
residual, file step-13. Designer r2: fact in scope, policy is
product-owner. Owner and principal both invoke `gate-parity` and reach
opposite verdicts.

**`gate-parity` is the dispositive wiki page here.** Its rule is
unambiguous:

> The symmetric corollary: if a future writer-side hardening is wanted,
> it must ship the **identical check in dispatch in the same change** —
> never the writer alone (writer ⊆ loader ∪ dispatch is the invariant).

A wrap-FAIL on the writer side, with no downstream match in the loader
(`parse_frontmatter` reads whatever it reads) or in dispatch (the
judge receives the goal as-is), is **exactly the asymmetry the page
forbids.** The current colon-space FAIL is the live demonstration of
the same defect — a writer-side gate stricter than its own loader
with zero downstream truncating consumers — and **deleting** it (not
adding a sibling) is the gate-parity-consistent move. Adding a
wrap-FAIL would extend the violation rather than repair it.

That does not make the wrap fine. It makes it a real silent loss
path that cannot be fixed by a writer-side gate; the fix route is the
copy ("a line break ends the value; never wrap the goal onto a second
line") plus a step-13 follow-up card for the loud gate when one is
warranted. A documented silent truncation the team owns is acceptable;
an undocumented one is the EV-37 defect class recursing. The new copy
must therefore **state the trim behavior** (`validate.py:60`
`.strip()`) and **state the line-break-ends-the-value behavior** —
neither claim is "lossless by construction," and the residual is
recorded as a known hazard.

The card's `goal` text is "a colon-space sequence without truncating."
A line break is not a colon-space sequence; it is a different mechanism
not named by the goal. The wrap is therefore not in scope under a
strict reading, and the cheap correct move is the one that does not
need a goal amendment — which is the right call given the goal's own
defect below.

- **Options rejected**: (a) adopt owner r2's wrap-FAIL — violates
  `gate-parity`, the wiki page owner invokes; (b) support
  multi-line wrapped goals (block scalar / continuation parsing) —
  scope creep, parser rewrite, introduces a decode step between file
  bytes and judge input (recreates the lossy-oracle class for new
  syntax); (c) ship a fix that quietly also patches the wrap without
  a step-13 record — undocumented residual.
- **Grounding**: `vault/wiki/gate-parity.md` (writer ⊆ loader ∪
  dispatch; "teach at the surface; don't gate at persistence");
  `vault/wiki/engineering-board.md` (goal text + intent are the card
  contract; residual belongs in the card record); Skeptic
  `closed-green` objection 3 (the fact).
- **Reversibility**: trivial. Reversing this ruling means promoting
  the wrap-FAIL into the live card as a fold-in; that costs one
  follow-up card plus one new test. The wrap-FAIL addition is more
  expensive to undo (gate removal plus rubric rollback) and
  asymmetric: adding a gate then removing it leaves the rubric's
  precedent for re-introducing the same gate later.

## R2 — Q4 ("rephrase without a colon" secondary advice): **drop permanently.**

The clause is never useful and always wrong in the case it would
apply to. If the goal names a literal that contains `: `, "rephrase
without a colon" is exactly the EV-37 failure mode (the author
produced `Provider finish_reason error` instead of
`Provider finish_reason: error`; the literal branch went dead; the
five merge criteria all passed). If the goal does not name a literal,
the colon is absent anyway and the advice is irrelevant. There is no
third case. Keeping it as "optional style" tells the author that
paraphrasing a colon-space literal is an acceptable workaround — the
exact comprehension the card exists to close.

Designer r2's drop is correct on the comprehension consequence;
owner's "keep as secondary" and principal's "keep as optional style"
both preserve the loophole.

- **Options rejected**: (a) keep-as-secondary (owner) — preserves the
  loophole; (b) keep-as-optional-style (principal) — same loophole,
  weaker wording; (c) replace the advice with a different escape
  hatch — the author has no business escaping from "spell the
  literal your code is matched against."
- **Grounding**: `vault/wiki/retry-classification.md` ("the defect
  it caused" — the literal-hygiene section naming EV-37's
  colon-free spell as the proximate cause); `vault/wiki/engineering-board.md`
  Card frontmatter ("a goal forced to misspell a literal is a goal
  that lies"); FLLWUP-43's `Intent` ("EV-37's goal spelled pi's
  emitted literal without its colon and the judge — whose only input
  is the goal — passed a branch that never matched pi's real
  message").
- **Reversibility**: trivial. Restoring the advice is a one-sentence
  copy edit on `_template.md` and the procedure paragraph; both are
  committed in this same change.

## R3 — Q5 (unrecorded second rationale): **retraction is safe; the recorded rationale is false and no undocumented rationale bears the load.**

The colon-space ban is documented in three places (`validate.py:8-9`
and `:121-124`; `_template.md:5`; `board-create-card.md:42-47`; plus
echoes in `features-new.md` and `rubric.json:c3`) and the rationale
in every one is the same: "frontmatter is parsed as plain `key: value`
lines with no YAML quoting, so a `: ` truncates everything after it."
That rationale is false. `parse_frontmatter` (`validate.py:55-56`)
splits on the **first** `: ` of the line — which is always the
key separator — and reads the rest of the line byte-exact (modulo
`.strip()`). Skeptic objection 1a settled this `closed-green` against
the live code; objection 2 settled it `closed-green` against the
shipped rule, deleting the FAIL block flips the validator green.

Could an unrecorded rationale exist? Hypothetically: defense against a
future YAML-parsing consumer of card frontmatter. Such a consumer
would (a) need to be added; (b) carry its own quoting requirements;
(c) ship with the gate-parity corollary satisfied — the loader or
dispatch, not the writer alone. The `gate-parity` page names this
exact case as the corollary to its main rule: "if a future
writer-side hardening is wanted, it must ship the **identical check
in dispatch in the same change** — never the writer alone." That
doctrine handles the hypothetical future-parser case correctly, and
without preserving a lossy authoring ban that lies about its own
mechanism. No code path or documentation supports any other rationale.

- **Options rejected**: (a) preserve the ban as future-proofing — the
  `gate-parity` corollary handles that case correctly; (b) defer the
  retraction pending an audit for unrecorded rationales — the audit
  has no artifact to find; only the false rationale is on the record.
- **Grounding**: `vault/wiki/gate-parity.md` (the corollary);
  `council/validate.py:55-56,121-124` (the false recorded
  rationale); Skeptic objections 1a, 2 (`closed-green`).
- **Reversibility**: low. Re-instating the colon-space FAIL is a
  three-line check-block addition plus a re-pin of the eight seeds;
  reversibility is symmetric with this change.

## R4 — Q6 (full-matrix `/council-eval` divergent re-run required before merge?): **a single-cell smoke on `board-create-card` with a treatment/control goal pair is the minimum sufficient evidence; the full matrix is not required.**

The throw primitive is green (`closed-green` Skeptic objection 7):
`eval-runner.ts:139-152` `atomicWriteTuple` throws `divergent payload
already stored for this key tuple` on a differing write under the same
key. The key tuple is `(cellId, repeat, scoredUnder/gradedBy,
fixtureVersion, rubricVersion)` and contains **no content hash**. So
the only divergent-write path is "same versions, different content" —
which the change set's `fixtureVersion` + `rubricVersion` bumps
prevent: the next write lands under a new tuple. The throw primitive
is therefore sufficient to settle the merge-time risk on its own.

The remaining evidence question is whether the rubric `c3` actually
accepts a colon-space goal after the rewrite. The rubric is text, not
mechanism — its acceptance is an LLM-judge call, not a CI primitive.
A full-matrix re-run over all 16 fixtures would confirm the rubric
mechanically but costs 16× the per-fixture run for evidence that
lives in one fixture's rubric.

The right evidence shape is a smoke against the fixture whose rubric
actually changes — `council/fixtures/board-create-card` — with a
treatment arm whose goal contains `: ` and a control arm whose goal
does not. The treatment should pass c3 (and the other criteria) under
the new rubric; the control should fail or be marginal on a
literal-coverage dimension. That pair is the minimum sufficient
falsifier for "the eval still accepts colon-space goals."

- **Options rejected**: (a) require the full matrix — over-evidence;
  (b) require no re-run at all — under-evidence; the rubric change
  is not mechanically testable and a stale rubric would silently
  re-grade; (c) require a different fixture — `board-create-card` is
  the only one whose rubric names the rule being retired.
- **Grounding**: `vault/wiki/eval-store-contract.md` (the key tuple,
  the throw on divergent payload, the append-only discipline);
  Skeptic objection 7 (`closed-green` for the throw primitive,
  composition code-read).
- **Reversibility**: trivial. If a full-matrix re-run is later
  wanted, it costs one run; the smoke does not block adding it.

## R5 — Q7 (designer's P1 cold-read authoring comprehension): **out of repo scope; record the prediction in the card; do not block the card on a human-subject test.**

A cold-read authoring test — give an author the new template +
procedure, ask them to write a goal whose judged literal contains
`: `, measure whether they spell it verbatim or paraphrase — requires
human subjects the repo does not have. The artifact being tested is
author comprehension of static copy, which no in-repo gate can
falsify. Designer's P1 is a falsifiable *prediction* about whether
the new copy closes the comprehension gulf, and the prediction is
recorded as a follow-up on the card's record.

This is a value call, not a fact: would the team rather (a) ship the
copy change now with a recorded-but-un-tested comprehension
prediction, or (b) delay the ship for a human-subject test. The
card's `Intent` says the fix is "owed before the next autonomous
run," which favors (a). The comprehension prediction's falsifier is
cheap to run later (one cold-read session) and expensive to schedule
now (no participants, no protocol, no IRB-shaped concerns but also
no scoring rubric). The owner can ship and the team can learn.

- **Options rejected**: (a) block on a cold-read test — no
  participants, no protocol, scope creep beyond the card; (b)
  silently absorb the prediction — would lose the falsifier;
  designer r2 recorded it, and the card's record keeps it.
- **Grounding**: `vault/wiki/council-loop.md` (the loop's verification
  steps run on artifacts, not human-subject tests); designer's
  falsifiable predictions P1 (recorded verbatim in step 3).
- **Reversibility**: trivial. Adding the cold-read test later is a
  one-card effort; this ruling does not foreclose it.

---

## Escalations to [[steward]]

The runner flags three portfolio-level calls and a card-`goal`
defect that the engineering-board amendment authority routes to
steward. I agree with each escalation — none is a card-level call —
and record them here with the cheap correct remedy and the
reasoning, so the resumed runner hands `steward` the shape it needs.

### ESC-1 — Card-goal conjunct-B opacity

The card's `goal` reads:

> A card goal can name an exact literal that contains a colon-space
> sequence without truncating, and **the judge reads the same string
> the classification test asserts**.

Conjunct B has two defects the Skeptic settled `closed-green`:

1. **Referential opacity.** "The classification test" names no file
   (Skeptic objection 10). The phrase appears once, at
   `council/cards/FLLWUP-43.md:7`. The judge for this card receives
   that phrase as its only input — an instance of the exact defect
   class the card exists to fix elsewhere.
2. **No code seam.** Conjunct B asserts a judge→runtime equality over
   a hop with no engine code in it (Skeptic objection 8: sole `goal`
   hit in `extensions/` is the `runs.ts:10` comment; the judge
   receives the goal as a static file read verbatim). The
   engine-testable prefix (card file → `parse_frontmatter` →
   `PROVIDER_FINISH_REASON_ERROR` at `extensions/retry.ts:78`,
   which `test/retry.test.ts` binds byte-for-byte to pi's installed
   bundle) is constructible (Skeptic objection 9); the residual
   "judge reads" step is procedural.

`council/procedures/council.md` step 10 names the route: "If the goal
is ambiguous without context, that ambiguity is a defect in the
card's `goal` text — fix the card, don't widen the judge's input."
`vault/wiki/engineering-board.md` gives in-place goal amendment to
[[steward] while the card is `Deliberating`; the EV-29 precedent
(steward amended EV-29's goal in place at EPIC-7 step 6) is the
house form. The referent is unambiguous in fact: `test/retry.test.ts`
is the only in-repo file that *derives* the literal from pi's
installed bundle (Skeptic objection 10's derive-vs-use distinction).

**Escalation to [[steward]:** amend conjunct B in place while the
card is still `Deliberating` to name the file and the constant.
Recommended shape (not binding — steward authors the final text):

> A card goal can name an exact literal that contains a colon-space
> sequence without truncating, and the judge reads the same string
> that `test/retry.test.ts` asserts `PROVIDER_FINISH_REASON_ERROR`
> (declared at `extensions/retry.ts:78`) against — namely the
> `Provider finish_reason: error` literal derived from pi's
> installed bundle's `mapStopReason` template.

The amendment is the cheap correct remedy: it names the file the
judge needs and the literal the assertion binds to, both verified by
Skeptic objections 8/9/10. If the steward declines the amendment,
the residual should be recorded in the card's run record (not
papered over) and the implementer proceeds with the amendment
shaped as a `steward`-authored target.

### ESC-2 — Q2 (retroactivity of EV-37's frozen lossy goal)

EV-37's `goal` spells `Provider finish_reason error` (no colon);
`vault/wiki/engineering-board.md` treats goal text as immutable once
`In Progress` and EV-37 is `Done`. The defect has already been
repaired at the runtime layer by the EV-37 Resume 2 fold-in (job-9.1,
which changed `PROVIDER_FINISH_REASON_ERROR` to `"Provider finish_reason: error"`
and added a regression test that derives the expectation from pi's
bundle) and at the intake layer by this card's deliverable. The
historical card record, however, still carries the lossy spelling.

**Escalation to [[steward]:** decide whether EV-37's `Done` card file
should be re-stated (a new card, since in-place amendment of a
`Done` goal is not legal) or whether the historical lossy record is
accepted. A re-state has a cost (one new card, one board line,
one record commit) and a benefit (a future reader of `EV-37.md` does
not re-derive the colon-free spell as a lesson). Accepting the
historical record has a cost (a future reader could be misled) and
a benefit (the board stays clean and the rule "Done records are
frozen" stays intact). Portfolio judgment; the resumed runner does
not settle it.

### ESC-3 — Q3 (propagation skew to already-initialized consumer repos)

`AGENTS.md` hard-convention #6 is non-clobbering scaffold
(`scaffoldInto` never overwrites an existing file) and there is no
override-resolution path for `council/validate.py` (unlike seats,
procedures, fixtures, eval-fixtures). Existing consumer repos
initialized against an earlier `pi-council` install therefore keep
the old colon-space FAIL, the old `_template.md` warning sentence,
the old docstring, the old `board-create-card.md` paragraph, and
the old `features-new.md` bars forever. Version skew is unbounded.

**Escalation to [[steward]:** decide whether mitigation is owed
(e.g. a separate `validate.py` override-resolution path shipped as a
follow-up card, a one-time migration, an `upgrade` subcommand, or a
documented "re-init" recommendation) or whether the unbounded skew
is acceptable given the non-clobbering invariant. The current state
means that for any consumer repo initialized before this card ships,
the colon-space FAIL still fires and the literal-hygiene teaching
is still wrong — the EV-37 class defect survives there until the
consumer repo re-initializes. Portfolio judgment; not a card-level
call.

---

## What the resumed runner hands off

With R1–R5 ruled and ESC-1/2/3 escalated, the resumed runner can
resume FLLWUP-43 at step 6/7 with the ruling appended verbatim. The
deliverable moves as the consolidator's converged design states, with:

- **O1 closed by copy** — the lossless contract language is
  "everything after the first `: `, edge-whitespace-trimmed" (or
  equivalent that does not assert byte-identity) in
  `validate.py` docstrings (module + `parse_frontmatter`), in
  `_template.md`, and in both procedure paragraphs. The `.strip()`
  behavior is pinned by a test (T2 / T6 in owner's set).
- **O2 closed by R1** — the synthesis carries R1's framing
  explicitly; no "byte for byte" across wraps is asserted, and the
  wrap truncation is recorded in the deliverable as a known hazard
  with a step-13 follow-up card.
- **Q4 closed by R2**, **Q5 closed by R3**, **Q6 closed by R4**,
  **Q7 closed by R5**.
- **ESC-1 routes to [[steward]** before step 7**, since the goal
  amendment changes the file the implementer reads and the goal the
  judge grades.
- **ESC-2 and ESC-3 stay open** at the steward tier; their
  resolutions do not block FLLWUP-43's merge (EV-37's runtime is
  already fixed; consumer repos' validator is unchanged but
  consumer-repo users are unaffected until they `pi install`).

The change set (mechanical, parallel-safe, one commit, exactly as
the consolidator converged):

1. `council/validate.py` — delete the `": " in goal` FAIL block
   (`validate.py:121-124`); correct the module docstring (`:8-9`)
   and `parse_frontmatter`'s docstring (`:49`) to state the
   lossless-by-construction contract AND the trim behavior AND the
   line-break-ends-the-value behavior.
2. `council/scaffold/council/validate.py` — byte-identical to (1).
3. The eight `council/fixtures/{board-create-card,council,council-runner,features-deliver,features-new,owner,wiki-ingest,wiki-lint}/seed/council/validate.py`
   files — byte-identical to (1).
4. `council/cards/_template.md` (root + scaffold + the same eight
   seeds) — goal example line updated.
5. `council/procedures/board-create-card.md` §3 "Hard failure mode"
   paragraph — rewritten to state the lossless contract, name the
   oracle ("the goal the judge reads is the literal your code is
   tested against; spell any literal precisely as the system emits
   it, colons and all"), name the trim, name the line-break rule,
   and drop "rephrase without a colon."
6. `council/procedures/features-new.md` lines 54, 57, 75 — bars
   become "single-line literal-exact goal (colons allowed in the
   value)."
7. `council/fixtures/board-create-card/rubric.json` `c3` prompt
   rewritten + `rubricVersion` bumped (e.g. `1.0.0` → `1.1.0`).
8. The eight `council/fixtures/*/fixture.json` — new
   `seed.treeDigest` (recomputed from the updated seed) +
   `fixtureVersion` bumped (e.g. `1.0.0` → `1.1.0`) so the next
   differing write under the old tuple throws (prevents silent
   overwrite of the existing eval results).
9. `vault/wiki/engineering-board.md:30-33` truncation claim — the
   correction routes through `/wiki-ingest` at step 14 per
   `council.md` step 14 (the facilitator hand does not edit
   `vault/`).

The red-first tests are T1 (red today: colon-space goal currently
FAILs at `validate.py`; green after); T2 (parser identity,
`closed-green` today and pinned); T3 (the wrap truncation, which
becomes the step-13 follow-up card's red-first test, not this
card's); T4 (parity guard: ten-copy byte-equality); T5 (digest
verification through `test/fixtures.test.ts`); T6 (the
`bundled-literal` regression at `test/retry.test.ts:152+`, already
in the tree); T7 (negative survives — `goal:no-space-after-key`
still FAILs `missing required key 'goal'`); T8 (the rubric
single-cell smoke per R4 — minimum sufficient evidence for the
rubric change).

## Reversibility, end-to-end

The single change is one commit on a worktree branch with no
main-repo state mutation (per `[[main-repo immutability]]`); the
five merge criteria (`vault/wiki/deterministic-merge-check.md`)
apply at head SHA. The resume path is the standard EPIC-9 form:
PR with squash method, `--match-head-commit` pinning, merged-SHA
gates re-verified, step 12 union-merge-reconcile if the runner's
record commits advanced `origin/main` between branch cut and
merge. The two `closed-red`s are resolved by the copy change (O1)
and the R1 framing (O2). The card goal amendment (ESC-1) is the
only pre-step-7 blocker; ESC-2 and ESC-3 are post-merge
steward-tier residuals.

## Sources

- `council/cards/FLLWUP-43.md` — steps 1–6 verbatim
- `council/validate.py:55-56,60,121-124` — the lossiness and its
  false recorded rationale
- `council/cards/_template.md:5` — the warning sentence
- `council/procedures/board-create-card.md:42-47` — the
  Hard-failure-mode paragraph
- `council/procedures/features-new.md:54,57,75` — the bars
- `council/fixtures/board-create-card/rubric.json:c3` — the rubric
  criterion
- `council/procedures/council.md:270-276` — the judge's input
  contract
- `extensions/retry.ts:78` — `PROVIDER_FINISH_REASON_ERROR`
- `test/retry.test.ts:152+` — the bundle-derived byte-for-byte
  regression
- `vault/wiki/engineering-board.md` — goal-as-judge's-only-input,
  goal-immutability, in-place amendment authority
- `vault/wiki/gate-parity.md` — writer ⊆ loader ∪ dispatch; the
  corollary on future hardening
- `vault/wiki/deterministic-merge-check.md` — five merge criteria
- `vault/wiki/eval-store-contract.md` — version-keyed records;
  divergent-payload throw
- `vault/wiki/retry-classification.md` — the literal-hygiene
  section naming the EV-37 failure mode
- `vault/raw/2026-09-16-po-ev37-merge-gate-defect.md` — the Resume
  2 fold-in ruling (the precedent that already fixed the runtime
  defect)
- Skeptic `job-3.7` report — every load-bearing fact in this
  ruling
