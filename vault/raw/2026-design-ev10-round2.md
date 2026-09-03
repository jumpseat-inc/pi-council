# Designer — EV-10 round 2 (engaging owner + principal)

Slugs: ev10-round2-designer. Card: `council/cards/EV-10.md` (state `Deliberating`,
epic EPIC-3). Rulings binding: SEATS-1, SMOKE-1. Sibling card EV-11's scope
(round cap / convergence / fallback) is untouched by this file. Step 3's gate
block in `council/procedures/features-new.md` must survive byte-identical.

## Round-1 stance being revised

Round-1 argued for two surfaces:

1. A `Contributors:` line + `Disagreements:` block + `Decision: unresolved —
   your call` marker at the **top of each card's `Intent`** in the step-3 draft
   pass (P1–P5 of the round-1 position).
2. P4 specifically: "when the human approves a card with a Disagreements
   block, the disagreement remains visible in the on-disk card after the
   write — i.e., the procedure does not strip the block at write time."

Round 2 revises both:

- **Surface 1 (kept).** The `Contributors:` line, `Disagreements:` block, and
  `Decision: unresolved — your call` marker belong on the **step-3 draft
  presentation** — the prose the facilitator puts in front of the human
  between step 2 and step 3's "write nothing to disk." They do **not** belong
  in `council/cards/<id>.md` frontmatter or `Intent` prose.
- **P4 (revised).** The disagreement is visible at the gate with the
  `Decision: unresolved — your call` marker, and the human's edit/drop/approve
  decision at that gate is the recorded closing action. The on-disk card after
  approval carries the approved state, not the deliberation trace. The
  deliberation trace survives in the run substrate
  (`$CONFIG_DIR_NAME/council/runs/<runId>/<jobId>.json` manifests + seat
  JSONL) for the 15-run retention window — which is the right place for it,
  because that substrate is where the engine already records what a seat
  actually produced.

The combination is: **attribution on the draft pass; ratification recorded
by the human's gate decision; the durable card stays clean for the downstream
loop.**

## Engaging owner (round 1)

### Where owner changes my mind

**Attribution location.** Owner's "presentation at the gate, never card-file
content" position is correct, and my round-1 P4 was the weaker argument. Three
artifacts pin this down:

- `council/procedures/features-new.md:29–35` — step 2's `Intent` prose is the
  surface `council.md` step 1 reads to decide whether `designer` is seated. A
  `Disagreements:` block inside `Intent` reads as surface-naming prose to that
  test — a deliberation artifact masquerading as a screen/copy/state claim.
  That's a **false signifier**, exactly the failure mode this design seat
  exists to call out.
- `python3 council/validate.py` validates `id/title/state/owner/epic/goal`
  and the board em-dash; it does **not** validate `Intent` shape. So a
  deliberation trace in `Intent` is neither enforced nor parsed — it is
  inert text the downstream loop never grounds itself in.
- The human's approval at step 3 is the closing action. Once approved, the
  disagreement is no longer live; durabilizing it into the card would freeze
  a closed conversation into a state the unattended `/features-deliver` loop
  reads. The human's edit/drop/approve is what survives in the card, and it
  survives as the *approved* state, not as a `Disagreements:` block.

Owner's tradeoff section ("attribution not persisted in cards; survives in run
transcripts pruned to 15 runs") is accepted. Post-hoc audit through the
transcript is the right shape for a deliberation trace: short retention,
clearly scoped to the substrate that already records dispatch, not bolted
into a file the engine parses for a different purpose.

Owner's step-3 byte-identity testable (claim 1, TDD pin on the gate block)
is the right gate on the rewrite, and I would not weaken it. The "polished
solo draft" he names as the defect is the same defect the seat charter exists
to prevent — silent facilitator resolution — and the byte-identity pin is the
mechanical defense.

### Where I hold against owner

**Parallel-generate-with-mandated-output-shape (owner's step 2 structure).**
Owner's structure asks all four seats — `product-owner`, `designer`,
`principal`, `skeptic` — to each produce a decomposition with the same
mandated output shape (children list, per-child scope/goal/state/surface
flag, epic goal). That structure has a **charter violation** the design lens
catches:

- `product-owner`'s body (`council/agents/product-owner.md`, `<role>`):
  *"You decide — you do not design the solution, you do not implement it,
  and you do not merge it."* Asked to draft decomposition goals, the seat is
  asked to do exactly what its body forbids.
- `skeptic`'s body (`council/agents/skeptic.md`, `<stance>`): *"Every claim
  is unverified until a test demonstrates otherwise."* Asked to generate
  goals, the seat is asked to *produce* claims, not attack them — its entire
  charter is the inverse.
- `designer`'s body (`council/agents/designer.md`, `<deliberation_mode>`):
  argues design against an artifact; asked to generate children, the seat is
  asked to specify UX artifacts for components that have no existence yet.

The surface consequence: a `Contributors: product-owner` line on a goal
sentence the product-owner has no charter to author is a **false signifier**
— it tells the human "the product-owner signed off on this goal," when the
seat's own charter says the goal is not its to sign off on. The seat will
either refuse (silently dropping from the contributor list, which collapses
the parallel structure to three seats) or comply (producing a goal under a
charter it does not have, with a `Contributors:` line that misattributes
authority). Both outcomes are worse than the structure owner is trying to
avoid.

I revise toward principal's generate-then-attack on this point (below).

**Dispatch discipline text inlining.** Owner proposes the rewrite inlines
the house bounded-dispatch discipline (council.md step 1's restated
discipline block) into `features-new.md` step 2. That is the right call on
the principle of restating, not cross-referencing — `council.md` itself
restates the discipline in its own step 1 rather than pointing at a
separate document. (Factual correction to owner's ground: his citation
"council-runner.md:216-219" is misplaced; the file at that path is
`council/agents/council-runner.md`, a seat, not the procedure, and grep for
the literal "restating, not cross-referencing" finds no matches in the
procedure corpus. The precedent is real — `council.md` step 1's
dispatch-discipline block is itself the restatement, and `council.md` step 6
follows the same shape — but the cited line is the wrong one. Not
load-bearing for my position; flagging for the rewrite's grounding.)

### Decisions on the four open questions owner named

1. **Dispatch structure / job ids on record.** Agree with owner. The
   rewritten step 2 should inline the bounded-dispatch discipline
   (`council_dispatch` → note job id → `council_wait` with a window →
   cancel + one re-dispatch on stall → stop and surface on double-fail).
   Job ids ride in the manifests (`runs/<runId>/<jobId>.json`) under the
   run substrate. The presented draft names seats (human-visible surface),
   not job ids.
2. **Contributions → draft pass.** Agree on the mandate that every element
   in the presented draft names its contributing seat. Where I disagree
   with owner is the *generator set* — see principal engagement.
3. **Disagreements.** Agree on the two-tier shape: `product-owner` rules
   what it may rule (a ruling dispatch, dissent named, options-rejected
   recorded per the seat's own format); what it may not rule (portfolio
   change, recorded-human-decision reversal, a goal that looks like the
   defect) escalates to the human at the gate, where the edit/approve
   power already lives. The facilitator paraphrasing a seat's line is
   silent resolution wearing punctuation — agree.
4. **What the facilitator aggregates.** Agree: agreeing text (verbatim,
   attributed) + mechanical assembly (ids, card list, state mechanics) +
   a concordance diff that *produces* the disagreements. Facilitator
   writes no goal, state, or surface sentence of its own. Add: facilitator
   also writes no `Contributors:` line or `Disagreements:` block into the
   card file; the gate presentation is the only surface that carries them.

## Engaging principal (round 1)

### Where principal changes my mind

**Generate-then-attack, not parallel-generate.** Principal's reframe is the
correct structure. The card's own wording — *"the facilitator aggregates
their input into the single draft pass step 3 presents"* — forbids
parallel-generate when read against the seat charters: aggregating
*their input* implies input exists, and the input the four seats are
positioned to give is attack-on-a-draft, not independent generation.

The charter-fit argument (above) is what makes this a design claim and not
a procedural preference: a `Contributors:` line whose seat label is a
false attribution to authority is the failure mode Norman writes about —
*"a strong signifier tells the person there is a working thing here, now"*
— and the corollary the doctrine names: when the data cannot support the
strong claim, the gap between surface and reality is the design defect. The
strong claim "product-owner contributed to this goal" cannot be supported
by the seat's charter; the gap between surface and reality is exactly the
hazard.

Specifically:

1. Facilitator produces a **first-pass decomposition** (epic + candidate
   children with goals, states, surface flags) — same output shape
   steps 1–2 already define, so step 3's gate is untouched.
2. Dispatch `principal`, `designer`, `skeptic` in **parallel against that
   same first pass**, each in its own charter: principal reframes seam
   cuts (does any child's `goal` bake in another slice's assumption; is
   the epic `goal` the whole feature and not one child's slice), designer
   flags surface-touching children and argues the `Intent` must name the
   screen/copy/state (the existing step-2 bullet, now seated), skeptic
   attacks each `goal` for falsifiability/stub/colon-space and each
   `state` against the Ready-vs-Backlog bar with **runnable checks against
   the draft text itself** (colon-space grep, `REQUIRED_KEYS` presence,
   `ID_RE`).
3. Dispatch `product-owner` **last**, with the aggregated disputes only —
   it rules, it doesn't generate. Its `when_invoked` covers this: #1
   open-judgment disputes, #4 promotion ratification for `Backlog → Ready`.
4. Facilitator aggregates verbatim, labeled by seat (reusing `council.md`
   step 2's exact "append each returned position… verbatim, labeled by
   seat" convention), and carries anything `product-owner` does not rule
   as a **named, attributed open item into the step-3 draft
   presentation** — visible to the human at the gate, not in the card
   file.

This is round-minimal by construction (a single first-pass → seat-input →
ruling → draft pass), so EV-11's bounded-exchange text inserts between
dispatch and aggregation without rewriting the attribution contract.

**Seat-body mismatch as a falsifier.** Principal's testable claim 2 (run
`council_dispatch` for each of the four seats with the input "decompose
$FEATURE into children" and confirm `product-owner`/`skeptic` output
contradicts their bodies) is the right way to settle the structure
question with evidence rather than prose. A red result — the seats
producing contradicting output — is exactly the charter-fit failure the
design lens predicts; a green result would falsify my reframe. I would
not ship the rewrite without that test running first.

**Validate.py cannot catch a malformed `features-new.md`.** Principal's
testable claim 6 (the smoke run is the only check that exercises the
rewrite) is correct and I want to add it to the acceptance pin. Owner's
step-3 byte-identity testable is *necessary but not sufficient* — it pins
the gate block, but a malformed step 2 (wrong dispatch verb, wrong shape,
wrong charter assignment) leaves the gate block intact and the rewrite
broken. The byte-identity test + the smoke run's dispatch-evidence +
independence + concordance-non-resolution assertions are jointly the
gate.

### Where I hold against principal

**Scope of seats.** Principal's structure seats `principal`, `designer`,
`skeptic` in parallel and dispatches `product-owner` last. SEATS-1 names
all four seats as participants: `product-owner, designer, principal,
skeptic`. I read SEATS-1 as binding on *who participates*, not on *when
they dispatch*, and principal's structure preserves all four. But the
ordering matters: `product-owner` as the *last* ruling dispatch is exactly
what makes the structure charter-consistent. SEATS-1 is satisfied if
principal's reframe is the structure — not just satisfied, *better
served*, because parallel-dispatching `product-owner` into generation
would violate SEATS-1's spirit (the ruling seat's authority is to rule
disputes, not generate content).

**Attribution is presentation, not card content.** Principal's reframe
keeps the aggregation step verbatim + labeled by seat, but does not
specify *where* the labels live in the draft pass. The design position
from round 1 — gate-presentation, not card-file — applies here too:
the `Contributors:` line and `Disagreements:` block live in the prose
the facilitator puts in front of the human at step 3, never in
`council/cards/<id>.md`.

## Remaining dispute

**Whether the rewrite specifies *generator* seats or *charter-fit* seats.**

- Owner's structure: all four seats generate, mandated output shape.
- Principal's structure: `principal`, `designer`, `skeptic` attack a
  facilitator first pass; `product-owner` rules last.
- My position (revised): principal's structure, on charter-fit grounds.
  The `Contributors:` line is only a true signifier of attribution if
  the seat had the charter to author what is attributed.

This is the surface the design seat argues for on this card. The dispute
is not on *what the human sees at the gate* — that surface
(`Contributors:` line + `Disagreements:` block + `Decision: unresolved —
your call` marker, all in the gate presentation, never in card files)
is agreed. It is on **who is allowed to author what gets attributed**.

The procedure rewrite should name this explicitly: step 2's dispatch
block should specify each seat's charter (principal = seam cuts;
designer = surface-touching flag; skeptic = runnable falsifiers; product-
owner = ruling on disputes) rather than a uniform "produce a
decomposition" shape. That text change is small (one paragraph) and
load-bearing: it makes the `Contributors:` line honest.

## Falsifiable predictions (round 2)

Each is a hypothesis I cannot verify from this seat; the smoke run that
would falsify each is named so `owner`/`skeptic` can confirm.

- **P-rev-1 (charter-fit dispatch).** *Hypothesis:* under principal's
  structure, dispatching the four seats in the reframe's order produces
  contributions consistent with each seat's body — `product-owner`
  outputs a ruling (one of `rule`, `reject`, `escalate to steward`,
  `escalate to human`), not a decomposition; `skeptic` outputs
  runnable objections against the first-pass draft's goals and states,
  not its own goal sentences; `designer` outputs surface-flag
  arguments and `Intent`-naming claims, not its own children. *Falsifier:*
  smoke run's seat transcripts (`runs/<runId>/<jobId>.json`) show
  `product-owner` producing goal sentences — falsifies P-rev-1.
- **P-rev-2 (gate-presentation attribution).** *Hypothesis:* the step-3
  draft presented to the human in the smoke run contains, per card, a
  `Contributors:` line and (where applicable) a `Disagreements:` block
  with the `Decision: unresolved — your call` marker; **the on-disk
  card files written after approval contain neither.** *Falsifier:*
  pure-seam test: after the smoke run, grep `council/cards/<id>.md`
  for `Contributors:` and `Disagreements:` and assert zero matches;
  assert the presented draft (the parent session's output between
  step 2 and step 3) contains both. Falsifies P-rev-2 in either
  direction.
- **P-rev-3 (no false signifier).** *Hypothesis:* no presented `Contributors:`
  line names a seat that did not author the attributed element under
  its charter — `product-owner` is named only on rulings, `skeptic` only
  on closed objections, `designer` only on surface-flag arguments,
  `principal` only on seam-cut observations. *Falsifier:* smoke run
  inspection: for each `Contributors:` line, compare the named seat's
  transcript output type against the element type the line attributes.
  Falsifies P-rev-3 if a seat is named on an element outside its charter.
- **P-rev-4 (step-3 byte-identity preserved).** *Hypothesis:* the gate
  block in `features-new.md` (the prose starting "Write nothing to disk
  until the human approves…") survives the rewrite byte-identical.
  *Falsifier:* the diff against pre-change text is non-empty, or
  `python3 council/validate.py` on the scratch copy prints anything
  other than `All council artifacts valid`. Same as round-1 P5;
  pinning.

## Preferences, ranked last

- **Pref-1 (taste, ungrounded).** Whether the gate-presentation block
  sits *above* or *below* the goal sentence in the human-visible draft
  — both are fine as long as both are visible before approval. I'd
  put it above, so the human sees who-and-what-they-disagree-with
  before reading the goal; owner has not opined; principal has not.
  Taste.
- **Pref-2 (taste).** A boxed marker or `---` separator between the
  `Contributors:` line and the `Disagreements:` block would help scan,
  but I have not verified how the human reads the step-3 pass in
  practice. Taste.
- **Pref-3 (escalation note).** If a disagreement touches a
  product-shape question (not a seam cut or a falsifiability bar), the
  surfaced `Decision: unresolved — your call` marker could arguably
  *suggest* escalation through `product-owner` rather than only mark.
  That bleeds into a product ruling the product-owner owns — flag,
  don't decide.