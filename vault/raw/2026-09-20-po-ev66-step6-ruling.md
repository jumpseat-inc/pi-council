---
title: PO ruling — EV-66 step 6: failure-invisibility scope, the absent touched-file manifest, and required acceptance
seat: product-owner
date: 2026-09-20
run: /features-deliver EPIC-13
card: EV-66
referred_from: consolidator step-5 synthesis, open-judgment items Q(a), Q(c) (skeptic O4), Q(d) (skeptic O5)
---

# PO ruling — EV-66 step 6

**Seat:** product-owner. **Date:** 2026-09-20. **Run:** `/features-deliver EPIC-13`,
card **EV-66** (Advisory gate at `/features-new` intake). Referred from the step-5
synthesis; step 6 was paused after Q(a), Q(c), Q(d). Q(b) (the in-flight copy itself:
`gate: advisory call in progress · <id>`, editor region, zero lines after settle) is
**already settled** and is not before this seat; nothing here re-opens it.

Binding Phase-1 rulings taken as given: **R3** (packaged `mode: "off"`; tests set modes
explicitly), **R1/R2/R4** of `EPIC-13.md`, including R2's full-epic delivery order with
"no card retired or descoped without a steward ruling."

The question each item actually poses, in this seat's terms: **mechanism** — what is
true about the record and the render path right now — and **user value** — whether the
person running `/features-new` is better served, not whether the surface looks complete.

---

## Q(a) — failure-invisibility scope of the in-flight line

### Ruling

**EV-66's copy surface stays exactly the pending line. It gains no transient failure
wording and no settled failure wording — not for a timeout, not for a refusal, not for a
slow success.** The failure face belongs to EV-67, which already carries it on its card
face, and the pending line is the only copy EV-66 is authorized to add.

Three binding clauses:

1. **The render function returns zero lines after settle, in every post-settle state** —
   success, `timeout`, `http-<status>`, `no-api-key`, `invalid-response`, `internal-error`.
   The existing acceptance clause ("a test asserts the render function returns zero lines
   after settle") is read as covering *all* settle outcomes, including failures. No
   failure-specific branch may persist a line.
2. **No failure vocabulary appears in the pending line**, and no wording is added to it
   either. The settled copy stands verbatim: `gate: advisory call in progress · <id>`.
   In particular this ruling does **not** authorize a duration or expectation hint
   ("up to 2 minutes", "this may take a while") inside the line — that would re-open
   copy already settled this run, and it would name `GATE_CALL_TIMEOUT_MS` in surface
   prose, making an internal timeout budget a user-facing promise the transport does not
   make.
3. **The pending line is drawn from in-flight call state only** — the card id and the
   fact that a call is outstanding. It must not read the ledger to decide what to render.
   This is a mechanism pin, not a style preference: the call line lands *after* the
   transport resolves (`gate-run.ts` appends inside `runGate`), so during the pending
   window there is no record to read. Any implementation that reaches for the ledger to
   colour the line is reaching for something that is not there yet.

### Why the designer's gap does not move into this card

The designer's objection is real as an evaluation problem and I do not score it down:
a person on a slow connection watches a static line for up to 120 s (`extensions/gate-run.ts:56`,
`GATE_CALL_TIMEOUT_MS = 120_000`) and then watches it vanish without learning whether
the call resolved, refused, or timed out. That is a genuine gulf of evaluation.

It is nonetheless not EV-66's to close, on three grounds:

- **The mechanism forecloses the in-window fix.** A failure is only known once the
  transport resolves; at that moment EV-66's own acceptance requires the surface to be
  empty. The only thing EV-66 could ship is a line that appears *after* settle and then
  disappears — a post-settle flash, which is both the "zero lines after settle" clause and
  a second face on a decision that already has one.
- **The card face already assigns the verdict its only printing home.** "The verdict
  itself is recorded, not printed — the printed verdict line belongs to the approval gate,
  and printing it twice from two cards would give one decision two faces."
- **EV-67 already owns exactly the missing fact, in the place a person reads it.**
  `EV-67.md` Acceptance: "a card whose gate call failed renders the fallback mode with the
  failure named rather than omitting the line", pinned to
  `Mode: Deliberate — gate call failed: <reason verbatim>`; and its Intent names this card's
  failure-invisibility concern as the thing its line exists to fix ("a missing line would
  read as 'no routing'"). My EV-65 Q1 ruling made that line possible by putting `basis` on
  the call line as the composite that byte-joins EV-67's render. So in advisory mode the
  run does not end in silence: the pending line vanishes, step 3 renders, and every card
  carries a verdict line naming the failure verbatim.

Exposure is further bounded by **R3**: the packaged default is `mode: "off"`, so the
pending window exists only in a repo that opted into the gate, and in `advisory` nothing is
blocked or reordered while it is open.

### Options rejected

- **Ship an ambient failure signifier in EV-66** (transient post-settle flash, or a
  pending line that changes on failure). Rejected on mechanism first: it is unreachable in
  the pending window (no record exists), and outside it the line is forbidden from
  persisting. It also duplicates EV-67's face — one decision, two surfaces.
- **Split the scope** — EV-66 ships a generic "couldn't complete" word, EV-67 ships the
  full failure line. Rejected as the worst outcome available: it puts two copy surfaces on
  one verdict, guarantees they drift, and is not a compromise but two half-owners of one
  line.
- **Fold the designer's ask into EV-66 as written.** Rejected on the fold-in test: it
  would require the goal to cover a failure surface, and a `goal` is immutable once a card
  is In Progress. Anything needing a new goal is a new card.

### The named residual (does not stop this card)

What survives this ruling is narrower than the designer's objection: **the pending window
is honest but static** — the line names the card and states a call is in progress, and
says nothing about elapsed time while up to 120 s pass unchanged. Ruled a **decomposition
candidate, not a fold-in**: a heartbeat/elapsed affordance needs in-flight state that no
EPIC-13 card owns, and it is a surface EV-67's rendering seam cannot carry either (EV-67 is
pinned to one line per card at step 3, byte-identical everywhere else). Recorded for the
run's step-13 gate as an EV-7x candidate grounded in this ruling; filing it is a board act
for the facilitator, and this card is not blocked on it.

### Reversibility

Cheap. Nothing is added, so a revert is a deletion of a branch that was never written. If
the residual later proves costly — evidence being a smoke run or consumer report where the
static pending line read as a hang — it ships as its own card against this ruling, with the
ledger's failure records as the evidence base. That is the sequence the epic prescribes for
its own policy changes ("a threshold change is only effective when a pre-registration
record naming the evidence that motivated it is present", `EPIC-13.md` Acceptance), and the
surface contract deserves the same discipline as the thresholds.

---

## Q(c) — skeptic O4: `touchedFiles` absent at intake

### Ruling

**Option 2 rules. `extensions/gate-state.ts` is not touched.** The EV-66 call site passes
`touchedFiles: []` when the intake parameter is absent, and the card/spec copy states the
semantics plainly: **at intake, no touched-file claim is made; `[]` is how "no claim" is
carried in a contract that has no absent slot; EV-69's dispatch-time re-check against the
*observed* touched-file set is the enforcement.** "Never defaulted to `[]`" comes out of the
copy.

Binding clauses:

1. **No edit to `gate-state.ts`** — not its `ParsedCard` type, not `validateParsedCard`,
   not the section caps or ordering. EV-64 is `Done`; its validation contract is the frozen
   surface other cards pack against.
2. **The empty array is labeled, never silently renamed.** Nowhere in the card, the spec,
   the module docs, or the ledger copy may `touchedFiles: []` be described as "the card
   touches nothing", "no files changed", or any phrasing that reads an empty manifest as a
   positive claim about the change. The wording that replaces "never defaulted to `[]`"
   must be present in the EV-66 spec, not implied by the code.
3. **The state hash stays a hash of card-declared content.** `[]` is the tool's input, so
   `stateHash` remains recomputable from the card plus the pinned packing rule — which is
   what makes the advisory label auditable later without a re-call.

### Grounding

- **The contract itself** (`extensions/gate-state.ts:88-101`): `touchedFiles` must be an
  array and each entry's `linesChanged` a *positive* integer. So there is no entry that can
  encode "absent", and `[]` is the only legal no-claim value. The converged "recorded as
  ABSENT" wording described a state the packed contract cannot represent — this is a copy
  defect in the design record, not a defect in EV-64.
- **`EPIC-13.md` Acceptance** — "a cost-per-card and cost-per-epic baseline exists from
  existing run manifests before any routing change ships" and "a threshold change is only
  effective when a pre-registration record naming the evidence that motivated it is
  present." The epic's standing rule is *evidence before amending the shared machinery*.
  Widening a `Done` card's frozen validation contract on a pre-baseline hypothesis is the
  same move, taken backwards.
- **`council/cards/EV-69.md` Acceptance** — "A card whose recorded mode is `Verify` is
  re-checked at dispatch against the **observed** touched-file set, and any hard override
  that fires on the observed state runs the full path with a ledger line recording the
  re-route." The safety net is keyed on observed state, so an empty recorded manifest does
  not weaken it; the design's own answer to a thin or misleading manifest is downstream and
  already scheduled.
- **`vault/wiki/gate-parity.md`** — the placement rule: express a constraint where the
  claim is made and where the person can see it, not by reshaping the shared persistence
  contract. "No claim was made" is a property of the intake surface; Option 1 relocates it
  into the packer, which is EV-64's data contract and every future packer's assumption.
- **Engaging the strongest ground for Option 1, honestly.** `EV-64.md` Intent warns that
  "the model is calibrated against what it is given, so thin state produces confident wrong
  answers rather than visible uncertainty," and an empty `touchedFiles` section is thin
  state of exactly that kind. I accept the premise and still rule Option 2, because in
  advisory mode that risk is the *thing being measured*: if the decisions model over-reads
  an empty manifest into a reduced mode it should not have chosen, EV-66's ledger line and
  EV-72's comparison against what actually happened are what surface it. Fixing the packing
  contract now, before the baseline exists, spends the label-making step's evidence on a
  guess. EV-64's own record sets the precedent for this posture — the skeptic's O3
  term-overlap finding was "record[ed] as a known … limitation, not implied competence."
- **The consolidator's routing fact:** Option 1 is a one-way door on EV-64's contract and
  would escalate to `steward`; Option 2 is resolvable here. This ruling keeps the door shut.

### Options rejected

- **Option 1 — accept absent `touchedFiles` in `gate-state.ts`.** Rejected: it edits a
  `Done` card's frozen validation contract to represent something the packed state was
  designed not to represent, pre-baseline, and on the run's own account that edit is the
  one-way door. If "absent vs empty" later proves load-bearing, it is a new card with
  evidence, changing the manifest *shape* deliberately (sentinel entry or `claim: false`),
  not a permissiveness patch that quietly splits one field into two meanings.
- **Recording the absence as a separate ledger field.** Rejected as out of this card's
  seam: EV-65 owns the record shape and my EV-65 Q1 ruling fixed its key set. Inventing a
  state-semantics field inside an advisory-label card would be a second schema change on
  the same run.
- **Omitting the section from the pack when absent.** Rejected: the section order is fixed
  by EV-64's contract, the byte-identity and drop-record tests are built on it, and it is
  still a `gate-state.ts` edit.
- **Option 2 minus the copy change** (pass `[]`, leave "never defaulted to `[]`" in the
  record). Rejected: that ships a known-false statement about the system into a card the
  judge reads.

### Reversibility

Confined to this card: the parameter default at one call site, plus copy. Reversal is a
new card proposing a manifest-shape change to `gate-state.ts` — which at that point is an
informed amendment with a ledger baseline behind it rather than a pre-baseline widening of
a frozen contract, and it is the escalation this ruling deliberately avoided.

---

## Q(d) — skeptic O5: `acceptance` required by the packer, not produced by intake

### Ruling

**Option 1 rules.** `council/procedures/features-new.md` is amended so that **every card
the command drafts carries `## Acceptance` text before the gate call is made** — children
and the epic card alike. The gate's required-`acceptance` contract stands unchanged.

Binding clauses:

1. **Same bar for the epic card.** It is included in the gate call per the settled design,
   it is drafted in the same step-3 pass, and `EPIC-13.md` already carries an
   `## Acceptance` section ("Observed as met when: …"). Exempting it would create a second
   rule for one field and a card with no ledger line, against this card's own acceptance
   ("every drafted card has exactly one ledger line").
2. **Seat-authored, human-approved, presented as card bytes.** Acceptance text must be
   produced by a seat's wave-1 artifact and presented at step 3 "exactly as each would be
   written to disk" — never facilitator-authored (the procedure's "You author nothing"
   holds), never gate-authored, never back-filled after the gate call. Placement, wording,
   and which wave's dispatch carries it belong to the owner; that is the *how*, and this
   seat rules only the *what*.
3. **The amendment is procedure text only.** `council/validate.py` is not touched, and no
   existing card is edited. `validate.py` has no `Acceptance` rule today, which is precisely
   why 31 on-disk cards lack the section; making it board-validated would retroactively
   invalidate a fifth of the board and is a tooling-class change on a data-class surface
   (AGENTS.md convention 6 / `vault/wiki/council-update.md`) — out of EV-66's scope, and not
   mine to authorize.
4. **The throw stays.** No EV-66 code path may catch `buildGateState`'s
   `card.acceptance must be a non-empty string` and substitute placeholder text. Under the
   amended procedure it is unreachable for drafted cards, which is the fix; a permissive
   fallback in the caller would hide the one case it is there for.

### Grounding

- **Why Option 3 is not merely unkind but goal-defeating.** `features-new` step 3 presents
  "complete frontmatter and `Intent` section", and step 2's wave-1 mandated output names
  per-child "`goal`, `state` … and the surface flag" — no wave output produces Acceptance.
  So acceptance text is absent for *every* drafted card at intake, not for the 31/152 that
  lack it on disk. Under Option 3 the gate call throws on 100% of drafted cards, and
  EV-66's acceptance — "every drafted card has exactly one ledger line marked
  `advisory: true`" — cannot be met at all. A reading of the card that makes its own goal
  unsatisfiable is not the cheap-to-reverse option.
- **And it is the wrong failure posture for an advisory label.** `EV-66.md` Intent: "If
  advisory mode alters a single dispatch, the labels it produces describe a different
  system than the one that will later be governed by the policy." Stopping a person from
  creating cards is the maximum available interference with the run. My EV-65 Q2 ruling
  already refused this shape on adjacent grounds — declining to add "a new pre-POST throw
  class to the advisory path, where EV-66's acceptance is precisely that the gate interferes
  with nothing." Fail-loud is right *inside* the packer (EV-64's contract, unchanged); it is
  wrong as the intake UX, and the fix belongs one layer up, where the missing text is
  supposed to come from.
- **Why Option 2 is barred, not just disfavoured.** Any "stated derivation" of acceptance
  text fails on one of two grounds, and there is no third kind of derivation:
  - *model-derived* — `EV-64.md` Intent: state assembly "must not call a model, because a
    model call inside state assembly would reintroduce the cost and the nondeterminism the
    gate exists to remove"; and the same card's determinism claim (same card + repo ⇒ same
    state bytes) dies with it;
  - *heuristic-derived* — it puts text in the packed state that exists nowhere in the card,
    so `stateHash` no longer keys the card's declared sections, and the advisory label is
    computed against criteria nobody wrote. `vault/wiki/presented-never-written.md` names
    exactly this failure: unattributed card text is "a lie about authorship … with no
    author." EV-66's labels would describe a card that will not land.
  Either way the comparison EV-66 exists to enable — verdict against what actually happened
  to *that card* — is corrupted at the source.
- **Option 1 is the only move that makes the two contracts agree.** The board's own
  `council/cards/_template.md` already declares `## Acceptance` as "How the goal will be
  observed as met … testable, observable detail the judge and Skeptic can act on." The
  packer requiring non-empty acceptance is consistent with the template; `features-new` is
  the outlier, since it hands off to `/features-deliver`, whose judge and skeptic act on
  that section. The amendment supplies text the workflow was always supposed to produce, and
  hands wave 2's falsifiability attack more to attack — a benefit, not a cost.
- **Named residual, routed not swallowed.** Cards already on disk without `## Acceptance`
  (31/152, e.g. `EV-37`, `FLLWUP-42`) remain unpackable. That is out of EV-66 — it only ever
  packs cards `/features-new` is drafting in this run — but any later card that packs an
  *existing* card inherits the throw. Routed to **EV-69** (its dispatch-time re-check is the
  first consumer likely to re-pack changed text on a legacy card), as a follow-up item for
  that card's step 2, not folded in here: EV-69's goal is about reading a recorded decision,
  and a back-fill of 31 cards would be board data-class churn this ruling does not authorize.

### Options rejected

- **Option 3 — let the fail-loud error stand for drafts without acceptance.** Rejected: it
  makes EV-66's own acceptance unreachable for the whole population of drafted cards and
  converts a non-interfering advisory label into a hard stop on the workflow's primary
  intake command. Correct inside the packer; wrong as intake behavior.
- **Option 2 — optional parameter with a stated derivation.** Rejected on mechanism: a
  model-derived version violates EV-64's no-model-in-assembly premise and determinism; a
  heuristic version fabricates card content with no author, breaks the stateHash↔card-bytes
  join, and corrupts the label comparison this card exists to enable.
- **Weakening `validateParsedCard` to accept an empty `acceptance`.** Rejected as
  gate-parity's forbidden asymmetry in the other direction — a packer that silently ships
  a declared section as an empty string produces states whose thinness is invisible, and it
  is a second edit to EV-64's contract (a one-way door per the consolidator's routing fact).
- **Editing `validate.py` to require `## Acceptance`.** Rejected on scope: it retroactively
  invalidates 31 live cards, is a tooling-class change to a data-class surface, and answers
  a procedure gap with a board-wide breaking rule.

### Reversibility

A procedure-text amendment with no engine change: if it turns out to be the wrong home, the
text reverts in one file and `gate-state.ts` was never touched. The residual exposure is
upstream — a seat drafting thin acceptance text. That is bounded by the existing gates, not
by this ruling: wave 2's `skeptic` attacks falsifiability, and `judge` evaluates against the
card's `goal`, not its acceptance. A thin acceptance string therefore produces a weak
advisory label that the ledger shows, rather than a broken intake.

---

## Escalation posture

**This is not an escalation and no steward action is required.** Nothing is declined
outright; no residual is accepted permanently (Q(a)'s static-pending-window residual is
filed as a decomposition candidate; Q(d)'s legacy-card residual is routed to a named card);
no recorded human decision is touched — R1–R6 of `EPIC-13.md` settle merge authorization,
run order, the `mode: "off"` default, panel composition, promotion cadence, and record push,
and none of them freezes the intake surface copy, the touched-file manifest's semantics, or
which sections `/features-new` drafts. Q(c) is resolved *without* opening the one-way door
on EV-64's contract, and Q(d) without a `validate.py` change — consistent with the
consolidator's routing condition. EV-66's `goal` is not itself the defect: each item here
asked what the card should ship, not what the epic should be building.

## What this ruling authorizes and blocks for EV-66 (step 7 onward)

**Authorizes:** the synthesis design as written, with (a) the pending line as the sole
rendered copy and zero lines after settle in every post-settle state; (c) `touchedFiles: []`
at the call site plus the "no claim" copy, and the "never defaulted to `[]`" clause struck;
(d) a `features-new.md` amendment requiring seat-authored, human-presented `## Acceptance`
text on the epic card and every child before the gate call.

**Blocks:** any edit to `extensions/gate-state.ts`; any post-settle line for any failure
class, and any failure or duration wording in the pending line; any acceptance derivation,
placeholder, or catch-and-continue around `buildGateState`'s validation; `validate.py`
changes; and back-editing the 31 existing cards that lack `## Acceptance`.

**Carries forward for step 13:** an EV-7x decomposition candidate for an elapsed/heartbeat
signifier on the pending window, grounded in this ruling's Q(a); and an EV-69 follow-up item
for the legacy-cards-without-acceptance population, grounded in Q(d).
