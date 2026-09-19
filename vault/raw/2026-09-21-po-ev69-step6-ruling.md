# PO ruling — EV-69: where the re-route block lives, the Verify designer gap, and the scripted-harness claim

**Seat:** product-owner. **Date:** 2026-09-21. **Run:** `/features-deliver EPIC-13`, card EV-69.
**Referred from:** the consolidator's step-5 synthesis, "Open judgment" Items A, B and C, after
3 exchange rounds + the post-skeptic design-fix round (O1/O2/O3) and with O7/O8 carried as
open-untested. **Card state at ruling:** `Deliberating` on `feat/ev-69-verify-routing`, `owner:
null`, no judge has read the goal, so an amended `goal` is legal (`[[engineering-board]]`:
immutable only once `In Progress`).

Record correction adopted first, because three items cite it: **the count of legacy cards lacking
`## Acceptance` is 32, not 31** (skeptic O5, closed-green). I re-derived it independently over
`council/cards/` rather than trusting the record: 4 EV (`EV-37`, `EV-38`, `EV-40`, `EV-41`), 2 EPIC
(`EPIC-9`, `EPIC-10`), 26 FLLWUP = **32**, with `_template.md` excluded as a non-card. Every
occurrence of "31" in the deliberation record (`principal` round 1 (d)) is superseded by this
ruling; Q(d)'s `full-unpackable` basis names 32.

The question I held over all three items: **does this serve the person who reads the routing
record, or does it serve the epic's tidiness?** The routing's whole product claim is that a card's
mode is a *recorded, checkable* fact rather than an unrecorded guess (`council/cards/EPIC-13.md`
Intent: "Routing already happens on every card, but as an unrecorded guess"). Items A and C are
decided on whether the record and the procedure can be trusted to say what actually happened;
Item B is decided on what a user of a terminal product loses, and whether anything bounds it.

---

## Item A — the re-route block is a named block resuming at step 3; step 2 stays byte-unchanged; the owner returns to step 8 only when the design is overturned

**Ruling (three binding parts).**

1. **Placement.** The escalation is expressed as **one named re-route block** in
   `council/procedures/council.md`, positioned after the step-8→9 observed-set re-check and
   **resuming at step 3**. `council.md` step 2 is **not** amended and stays byte-identical, and
   step 1 plus the 8→9 boundary sentence remain the only other procedure edits. The card's scope
   guard (h) is therefore *replaced by an explicit list*, not "amended by declaration": the
   amended surface is exactly "step 1 + the 8→9 boundary sentence + the new named re-route block";
   steps 2, 4–7 and 10–14 are unchanged.
2. **Roster and first pass.** The block declares its own generator roster — `principal`, plus
   `designer` under the recorded panel/surface rule (see Item B condition 1, which is what makes
   that rule evaluable on this arm) — and states in its own text that **the owner's first-pass
   record is its pushed step-8 branch**, which the deliberation reviews. It runs steps 3–6, then
   step 7's spec, then the fix cycle below.
3. **Owner re-dispatch is conditional.** The owner is re-dispatched at step 8 **only if the
   deliberation overturns the design**; if the deliberation ratifies the branch, no second owner
   dispatch occurs and the merge check's criterion 1 is read against the first owner dispatch's
   gate record.

**Falsifier, binding.** Clean Verify arm: `owner == 1`, `skeptic == 1`, `judge == 1`, ROOT
`mode == "Verify"`, five seats `== 0`. Re-route arm: asserts `principal`, `designer` (when
seated) and `consolidator` present, **exactly one** new v2 call line whose basis names the fired
override, and the card-scoped subtree read resolving Deliberate — it asserts **nothing about
owner count**. Add one procedure-text pin: a test that **step 2 is byte-identical** and that the
named block exists with its roster sentence and its resume-at-3 line. That pin is only available
under this placement, and it is the difference between a fence that is executable and a fence that
is prose.

**Why the block and not the step-2 amendment (owner's position).**

- **Step 2's text would be made false by the case it has to cover.** Step 2's load-bearing
  instruction is information starvation — "Give each **only the card** — never the other seat's
  position… if one seat's dispatch leaks another's opinion, the 'independent' pass is
  deliberation wearing a costume." On a re-entry an implementation already exists on a branch, so
  the owner's position is *already public*. Both designs suppress the owner's step-2 dispatch;
  the step-2 amendment then leaves the step standing there claiming to run a generative
  independence pass that this card can no longer have, with the exception in a conditional clause
  beside it. The named block says what is true: this is a re-entry, the artifact under review is
  code, resume at the exchange.
- **One authority per fact, literally.** The owner's design scatters the re-route's authority
  across step 2's new clause, the 8→9 boundary sentence, step 8's "verifies rather than
  re-implements" aside, and the falsifier's `owner == 2`. The block holds it once. A concrete
  leak in the scattered version: step 3's roster is defined as "each generator", and "generator"
  is defined by step 2 — if the re-entry clause removes the owner from step 2 but step 3 still
  says *each generator*, the facilitator has to decide mid-run whether the owner belongs at step
  3. The principal's own round-3 concern about a set-difference discriminator is the same bug
  class, in procedure text instead of code.
- **Where the instruction is needed is where the facilitator is.** Re-entry is triggered at the
  step-9 boundary; the facilitator must jump *backwards* to a step it already completed. A block
  placed forward of the trigger, naming its own resume point, is followable; a conditional inside
  a finished step is discoverable only by re-reading it.
- **The `owner == 2` assertion spends the routing falsifier on the wrong fact.** This card's
  teeth are that the dispatch set *differs observably by mode*. Owner-dispatch bookkeeping on the
  escalation arm is a consequence of a procedure-organization choice, and pinning it to 2 makes
  the routing evidence break if the re-dispatch policy is ever revised — while the
  generator-present signal, which *is* the merge check's mode authority, already proves the
  escalation happened.
- **An unconditional second owner dispatch is a dispatch that has nothing to do when the design
  stands.** Its stated job ("verifies rather than re-implements") is already covered twice over:
  the step-9 skeptic treats "done" as unverified and re-runs the gates against the pinned head
  SHA, and the merge check reads CI `SUCCESS` with `--match-head-commit`. `council.md` step 8's
  own rule — "Status is written only from observed artifacts, never from a seat's report" — is
  why ratification is safe without a re-dispatch: the gates backing criterion 1 are observed at
  the same head, not inherited from a report. The O6 re-push protocol folded into the design-fix
  round stands unchanged: any owner re-push updates the pinned head and invalidates prior gate
  evidence.
- **Cost is not a tiebreaker here, and I say so because the owner's version is not frivolous.**
  EPIC-13's thesis is "cost discipline is the point, not cheapness", and the unconditional
  dispatch is ~one 45-minute window per escalation. But I am not rejecting the owner's placement
  because it is expensive; I am rejecting it because its text asserts something false and scatters
  one fact over four places. If those two were fixed in the owner's version, the remaining
  difference would be taste.

**Who re-implements when the design is overturned** — the sub-question O2 said the design left
unanswered: **the owner, at step 8, against the existing branch, in the same run**, on a fix-cycle
dispatch under the standing dispatch discipline (bounded, one re-dispatch on stall). The block
must name this; it is the only branch of the conditional that creates a second owner dispatch.

**Acceptance clarification (amendable surface, binding on the card face).** The clause "any hard
override that fires on the observed state runs the full path" must not be read by a judge as "re-
runs every dispatch from step 2". Amend the Acceptance to say: on a re-route the card runs the
full deliberation path as **the re-route block's steps 3–12 with the generator roster it names,
the owner's step-8 work serving as its first-pass record, no deliberation seat dropped and no step
skipped**. This is naming an observable on the amendable surface, not a purpose change — the same
disposition as EV-43's naming-vs-existence ruling.

**Not an escalation.** (h) is an owner-authored design guard from this card's own round 1, not a
human ruling, and no Phase-1 ruling of the human's (R1–R6) speaks to procedure placement. R4 is
respected exactly: the panel sets are untouched.

---

## Item B — the designer-review loss under a recorded Verify is accepted, provisionally, with two conditions and a named closing card

**Ruling.** The loss is **real, and it is accepted for this card** as a *temporary, named*
residual. It is not closed by seating the designer on the Verify path, and it is not closed by a
file→surface predicate inside EV-69.

Two conditions, both binding on the amended procedure and the spec:

1. **The surface-touching bit is recorded regardless of the recorded mode.** Step 1's second,
   orthogonal question is answered and written even when a recorded mode makes the path decision
   for it. It is data the run still owes: step 13's routing of designer findings to follow-ups,
   and — the live mitigation on this arm — the Verify skeptic's step-9 dispatch input, so the
   branch verification actually looks at the rendered surface and may run out-of-band smoke
   probes of it. Recording a bit is not re-judging a path, so this does not touch the settled
   "recorded mode is authoritative" rule.
2. **The residual is disclosed and carded, not absorbed.** The spec names it in its own words: a
   surface-touching card can be routed Verify and will receive no design review, which the
   full-council path guaranteed. Step 13 files **one** follow-up card (scoped `epic: EPIC-13`)
   whose home is the **gate's question set** — a fourth atomic question covering user-visibility,
   landing under EV-72's pre-registration discipline (EPIC-13's Acceptance: "a threshold change is
   only effective when a pre-registration record naming the evidence that motivated it is
   present"), with the question-set version bumped. It is not an EV-69 edit. The step-14 ingest
   must carry the residual onto the `metered-deliberation-routing` page, since a reader of the
   procedure alone would never find it.

**Options rejected.**

- **Seat `designer` in Verify.** Barred, not merely wrong: **R4 is a recorded human Phase-1
  decision** and names Verify as owner + skeptic + judge with "no … designer" explicit. This seat
  does not overturn a human decision; had this been the required fix it would have gone to
  `steward` as an escalation, not been ruled.
- **A mechanical path→surface predicate (a declared path map, or "≥N modules ⇒ visible surface")
  on the observed-set re-check.** Rejected on the mechanism: it is a second, untuned decision
  surface competing with `decide()`, which is precisely what both seats rejected in round 2 when
  the principal's `observed-overrides.json` gave way to the owner's re-gate ("a declared path map
  is a second untuned predicate whose relationship to overrideFires/`decide()` is undefined"), and
  what `gate.ts`'s doctrine ("every branch resolves toward safety") and EPIC-13's single-decision-
  surface design exist to prevent. User-visibility is not derivable from a file set; only the
  model call can answer it, and to ask it of the model we must add the question — which is
  condition 2, not this card.
- **Rely on the shipped overrides as adequate coverage.** They are adjacent, not equivalent, and
  I state the difference rather than smoothing it: `publicContract: yes` routes Deliberate at
  intake, and in *this* product most durable user-visible surface is public contract (command
  names, output grammar, theme tokens), so the proxy is better than nothing. A copy-only change
  that is small, reversible and contract-neutral is exactly the card that routes Verify and loses
  review. That is the population condition 2 covers.
- **Accept it silently.** The skeptic is right that a recorded ruling is owed. Silence is the one
  option this seat may not take on an open-judgment item.

**Why acceptance here is bounded, and therefore mine.** Three things make the residual small
today, none of which is taste: (i) **R3** ships the packaged gate at `mode: "off"` and this repo
carries no repo-local gate policy, so the reduced paths do not execute for any consumer until a
repo opts in; (ii) the human at the `/features-new` draft-then-confirm approval gate sees the mode
line on the card, and **any edit they make changes the packed state, which under this card's own
rule takes the full path** — a real self-heal, though one that depends on the human noticing,
which is why condition 2 is not optional; (iii) the fix has a named home and a named discipline,
not a prose bullet. Per my own escalation criteria, **permanently** accepting a residual is
`steward`'s; a temporary one with a named closing card is this seat's, exactly as in
`[[2026-09-20-po-ev65-step6-ruling]]` Q2 ("accepted *provisionally, with a named card to close
it*"). If the human later drops the follow-up card at the step-13 gate, the residual becomes
permanent and that disposition is theirs, not mine.

---

## Item C — the goal's headline claim must be conditioned on scripted execution; the mitigations alone cannot reach the judge

**Ruling.** Condition it. The goal is amended (exact text below), in the same commit as this
ruling's other card-face edits, one physical line with `goal:` last in the frontmatter
(`[[engineering-board]]`, FLLWUP-51: a wrapped value is a loud `validate.py` FAIL). The three
named mitigations are adopted as well — the harness invoking the real `council_route` tool, the
exactly-one-mode-manifest assertion, the spec's residual paragraph — but they are not sufficient,
and the reason is mechanical, not stylistic.

**Why "spell it out in the spec" cannot work.** The judge is dispatched, by `council.md` step 10,
with "**the card's `goal` and the Skeptic's evidence from step 9 — nothing else**", and the same
step states the rule that decides this item: "If the goal is ambiguous without context, that
ambiguity is a defect in the card's `goal` text — **fix the card, don't widen the judge's
input**." A condition written only into the spec is precisely context the judge is forbidden to
have. And `[[judge]]`'s own standard is unforgiving about what happens next: "Returns `PASS` only
when the goal is met and the evidence shows it; a required test that is red/missing/unverifiable
is a `REJECT` — **no partial credit**." Left unconditioned, the goal's bare verb "proves" paired
with evidence that visibly describes a scripted harness yields one of two outcomes, and both are
bad product: a `REJECT` on an overclaim the mechanism was never able to close, or a `PASS` that
holds only if the judge quietly re-reads "proves" as "shows the multiset for a run we scripted".
That is the EV-29 class defect in miniature — a goal satisfiable only by a reinterpretation the
judge is not given — and it is fixable at the sentence level, which is what distinguishes it from
an escalation.

**Exact replacement `goal:` value (single line):**

> A card whose recorded ledger decision resolves to Verify runs council steps 7 through 12 with zero deliberation dispatch, and a falsifier over the manifests of a scripted harness run whose dispatches are produced by the real council_route tool proves that run's dispatch multiset — ROOT mode Verify, one owner dispatch, exactly one skeptic dispatch and no second branch-verification skeptic, one judge goal evaluation, and zero principal, designer, consolidator, product-owner and steward dispatches — while claiming nothing about whether a live facilitator called council_route, which the manifest record cannot show.

Three things this wording does, and does on purpose:

- It keeps the card's headline intact and falsifiable: the mode is only real if the dispatch set
  differs observably. The multiset is what manifests can actually show, so the goal now asserts
  exactly the reach of the evidence.
- It encodes the settled skeptic-count reading into the immutable surface: Deliberate dispatches
  the skeptic twice (step-4 attack + step-9 branch verification), Verify once, and "the
  branch-verification dispatch is absent" means **no second, dedicated** one. The facilitator's
  round-2 note ruled this from R4 and EPIC-13's "in any mode that dispatches them" qualifier; a
  reading this load-bearing belongs where the judge reads it, not only in the spec.
- It names the residual *as a claim the card does not make*, which is the cheap form of honesty:
  no new observable is demanded, no new code is implied, and nothing downstream (EV-70's mode
  authority, EV-71's fidelity evidence) inherits a promise it cannot keep.

**Execution.** The facilitator applies the goal text and the two Acceptance clarifications (Item A
's "full path" clarification; the "unchanged packed state" wording already agreed), appends this
ruling verbatim to the card's deliberation record, and runs `python3 council/validate.py` clean in
the same commit. Cards and board never land separately.

**Authority — PO, not steward, and the line is stated because `[[engineering-board]]` puts goal
-wording with the steward.** That page's sentence is an EPIC-7 provenance note about the case
that produced it: EV-29's goal "named a provider data granularity that **does not exist**", where
no amendment could preserve the card's purpose and only redirection remained. The unbroken record
since then is that PO amends a `Deliberating` goal where the substance is already settled and only
the observable or the claim's reach needs pinning: EPIC-5 (EV-22/23/24/25 goals replaced at wave
3), EPIC-9 (four quantified-goal amendments), EPIC-11 (EV-52/53), EPIC-12 (EV-57/58/59), and my
own EV-67 §J3 in this run, where the test I stated was whether the amendment "changes what the
card is for" — and the shape of a passing amendment there was "removes a demand and adds nothing
to build". Item C is that same shape: the card's purpose (deterministic routing to Verify, proven
by a differing dispatch set), its mechanism, and its value are untouched; the edit shrinks one
verb. The data the goal names — run manifests, `council_route`, the ledger record — all exist on
the tree. Had I found instead that no wording could make the headline claim true — that the card's
whole evidence plan rested on a source that does not exist — that is a goal-defect escalation and
I would have routed it to `steward` rather than editing. It is not.

**Self-reference check.** EV-69's own packed state changes when its goal changes, so under the
mechanism this card builds its recorded intake decision no longer matches and the card takes the
full path. That is consistent, not ironic: this card *is* running the full path (steps 2–6 with
owner, principal, skeptic and consolidator dispatched), and in this repo the gate is `off`, so no
ledger line exists for EV-69 to invalidate. The amendment breaks nothing it does not already
agree with.

---

## Reversibility

- **Item A** is procedure text plus two falsifier assertions, on a card with no implementation yet.
  If the placement turns out wrong, the cost is moving a block: step 2 has been kept byte-
  identical precisely so a later reversal starts from an unmodified surface, and the `owner == 2`
  assertion this ruling declines to make can always be added later — a test that asserts less is
  the reversible direction. The one thing that would *not* be cheap is discovering after merge that
  the shipped procedure contradicted itself, which is the defect O2 closed red.
- **Item B**'s acceptance is provisional by construction. Reverting it is the follow-up card
  landing (question set +1, version bumped), and with R3's `mode: "off"` default and no repo-local
  policy in this repo, no consumer is exposed in the meantime. If condition 1 were dropped, the
  loss would be invisible instead of merely present — that condition is the cheap-to-reverse part
  and I have made it mandatory.
- **Item C** is one frontmatter line while the card is still `Deliberating`, and the most
  expensive thing on this list to change afterwards: once `In Progress`, the goal is immutable and
  a wrong wording becomes a new card. That asymmetry is the reason it is ruled now, and it is the
  only item here whose cost grows with time.

## Not ruled here (routed)

- The step-13 list already agreed (EPIC-13 Intent's stale "branch-verification invariant"
  sentence, the re-check cost note, the EV-66 canary reader-allowlist amendment, the shared-
  extractor refactor flag, EV-70's acceptance arms) is unchanged; **add** Item B's follow-up card
  and Item B/A's two procedure-text disclosures.
- EV-70's four/five/six/seven fixture arms and the `basisSuffix` shapes stay EV-70's, per the
  settled spine. Only the generator-only discriminator and the re-route's non-assertion of owner
  count are inherited from this ruling.

## Sources used

- `council/cards/EV-69.md` (worktree record: rounds 1–3, skeptic O1–O8, design-fix round,
  synthesis Items A–C), `council/cards/EPIC-13.md` (Intent, Acceptance, R1–R6),
  `council/cards/EV-66.md` (Q(c)/Q(d), delta 3/5), `council/cards/EV-65.md`, `council/cards/EV-67.md`
- `council/procedures/council.md` (step 1's two orthogonal bits; step 2's independence framing and
  roster; step 3's "each generator"; step 8's observed-artifacts rule; step 9; step 10's
  goal-and-evidence-only input and fix-the-card rule; step 13), `council/procedures/
  features-deliver.md` (five criteria, escalation routing)
- `council/gate/policy.json` (`mode: "off"`), no repo-local gate policy in the worktree
- `vault/wiki/engineering-board.md` (goal immutability/positional/wrap-FAIL; Acceptance as a
  separate amendable surface; goal-wording-with-steward provenance), `vault/wiki/judge.md`
  (no partial credit; goal + evidence only; confabulated-premise precedent),
  `vault/wiki/product-owner.md` (EV-29 escalation; EV-33/EV-43 acceptance-amendment; naming vs
  existence), `vault/wiki/steward.md` (cheapest-to-reverse; permanent residuals),
  `vault/wiki/metered-deliberation-routing.md`, `vault/wiki/deterministic-merge-check.md`,
  `vault/wiki/facilitator.md`, `vault/wiki/council-loop.md`
- `vault/raw/2026-09-20-po-ev65-step6-ruling.md` (provisional residual with a named card),
  `vault/raw/2026-09-20-po-ev67-step6-ruling.md` (J1 durability class; J3 the PO-amendment test;
  J4 binding card prose), `vault/raw/2026-09-20-po-ev66-step6-ruling.md`,
  `vault/raw/2026-09-20-po-epic13-promotion-ruling.md`,
  `vault/raw/2026-09-16-po-epic9-retry-ruling.md`, `vault/raw/2026-09-19-po-fllwup58-gates-backstop.md`
  (the document-only test)
- Independent recount of `council/cards/*.md` for the 32 correction
