# PO ruling — EV-67: the approval-gate locator, the fallback literals, and off-run scoping

**Seat:** product-owner. **Date:** 2026-09-20. **Run:** `/features-deliver EPIC-13`, card EV-67.
**Referred from:** the consolidator's step-5 synthesis, "Open judgment" items J1–J4, after the
skeptic's step-4 attack closed O1/O2 red (both folded into the converged mechanism) and raised
O4 as a pre-dispatch blocker. **Card state at ruling:** `Deliberating`, `owner: null`, no judge
has read the goal, so the `goal` is an amendable surface (`[[engineering-board]]`: goal text is
immutable only once `In Progress`; while `Deliberating` an amended goal is legal).

The question I held over every item: **does this serve the person standing at the approval gate
with a drafted card in front of them, or does it serve the epic's record?** The human at that
gate sees one line per card and nothing else of the routing machinery. Every item below is
decided on what those bytes must do for that person, not on which seat's framing wins.

---

## J1 — the goal/title locator

**Ruling: amend both the title and the goal, and name the gate by its heading, not its
ordinal — "the draft-then-confirm approval gate". The current section number is pinned in the
`## Acceptance` (an amendable surface), never in the goal.**

Exact replacement text:

- **title:** `Gate verdict rendered as information at the draft-then-confirm approval gate`
- **goal:**

> At the /features-new draft-then-confirm approval gate — the step that presents each drafted
> card for approve, edit, or drop — every card of a gate-enabled run renders exactly one
> additional line naming the resolved mode and the recorded one-line basis, no card lacks that
> line, and a test over the render function proves the approve, edit, and drop options and the
> printed card body are byte-identical to the pre-gate rendering.

The goal must stay on **one physical line** in the frontmatter block and `goal:` must stay the
last key (`[[engineering-board]]`, FLLWUP-51: a wrapped value is a loud `validate.py` FAIL).

The title edit carries a mechanical obligation: `council/validate.py:205` matches
`- {id} — {title}` against the board, so `council/board.md:76` (the `## Deliberating` row) is
edited in the **same commit** — board and cards never land separately.

### Why not "step-4 approval gate" (owner + principal, Position A)

They are right that the locator must move, and right about the failure it prevents: the line
placed into `## 3. Record the advisory gate call` is EV-66's forbidden print, and the goal is
the judge's verbatim input. Position A is rejected on one fact they did not weigh: **the ordinal
is only stable until the next card in this run edits the same file.** R2's order puts EV-69,
EV-70, EV-71 and EV-72 after this card, all of them spec'd against `features-new.md` or the
recorded mode, and EV-67's own step number is not a thing the judge can re-read after the fact —
the goal is immutable once `In Progress`. A goal that names "step 4" can be made false by a
later card without any ability to correct it, which is precisely the shape of the stale text we
are fixing today. Pinning an ordinal in the immutable surface is the wrong durability class.

And "draft-then-confirm" is not vaguer than "step 4": it is the **heading text itself** at
`features-new.md:215`, it appears nowhere else in the procedure, and it is the one piece of that
section two earlier rulings treat as byte-identity-protected (round-1 P5 / P-rev-4,
`[[2026-design-ev10-round2]]`: "the step-3 gate block in `features-new.md` must survive
byte-identical"; `[[2026-09-03-po-ev12-j1-ruling]]` settled it as the single unconditional
draft-then-confirm gate). So this wording is both the *precise* locator the owner asked for and
the *stable* one the designer asked for — they are the same text.

### Why not bare "the approval gate" (designer, Position B)

Rejected as under-determined in exactly the direction the designer was worried about: after
EV-66, the procedure has two gates, and its live prose at `:40` already uses "the step-3 gate
call" for the recording step. "The approval gate" without a name the section actually carries
invites the mis-placement the owner named. The designer's substantive point — that the step
number is a procedure-text edit, not a design call — is **adopted**, and is the reason the
ordinal goes to the Acceptance.

### Why not a documented reading with no edit (Option C)

Rejected. The text is now actively contradicted by its own referent: the goal's "step 3" points
at the step whose body says "do not print the recorded verdict". A judge reading the goal
against the procedure would be evaluating the card against the recording step. The
`[[2026-09-20-po-fllwup58-gates-backstop]]` test for document-only is that the literal reading
be "available, internally consistent, and the value-bearing one"; here it is none of the three.
The principal's line — "a documented reading without an edit leaves a false goal on the board"
— is correct and is the deciding ground.

### Authority

This is mine, not the steward's: correcting a referent does not change what EV-67 is for. The
drift is *this seat's own doing* — EV-66's step-6 Q(d) ruling (`council/cards/EV-66.md`,
job-16) is what inserted `## 3. Record the advisory gate call` and renumbered the approval gate.
Cleaning up the numbering a PO ruling created is not overturning a human decision, and no human
ruled on an ordinal. The epic's own approved substance — "the existing `/features-new` …
approval gate … no new gate, no new state" (`council/cards/EPIC-13.md` Intent) — is what this
wording protects.

---

## J2 — the exact fallback-literal bytes

**Ruling: cell B's wording changes from the endorsed candidate; cell C's candidate ships as
written. Both are basis-slot text handed to the single composite exported from
`extensions/gate-ledger.ts` — neither may carry its own `Mode: ` prefix.**

| cell | trigger (observable) | basis-slot literal (exact bytes) |
| --- | --- | --- |
| **B** | `council_gate` returned `callId: null`, `status: "failed"` | `gate call failed before recording a verdict` |
| **C** | `callId` non-null, no ledger line carries it | `recorded gate call not found in ledger` |

So the two lines a human reads are
`Mode: Deliberate — gate call failed before recording a verdict` and
`Mode: Deliberate — recorded gate call not found in ledger` (em dash U+2014, no trailing
period, no `?`, no `!`), composed by `decisionLine` exactly as the success line is.

**Why I changed B** (the designer endorsed the candidate; I am overturning an endorsement on a
fact none of the three seats weighed, so it is stated rather than assumed):

1. **The cause-slot inversion.** In the composite `Mode: Deliberate — gate call failed: <X>`,
   `<X>` occupies the *reason* slot — that is what the colon after "failed" means, and it is
   what EV-65's binding clause 1 makes it on the record side
   (`basis = "gate call failed: " + verbatimTransportReason`,
   `[[2026-09-20-po-ev65-step6-ruling]]`). `no ledger line recorded` is not the reason the call
   failed; it is the consequence. The line would assert a cause-effect the render cannot observe.
2. **Colliding with the recorded-failure form.** A cell-A' failure already renders
   `Mode: Deliberate — gate call failed: <reason>`. B's candidate differs from that form only in
   the reason text, so a surface grep cannot tell "there is a ledger line carrying this" from
   "there is no ledger line at all" — the one distinction the human actually needs when they
   audit, and the one the Intent's honesty clause is about. B2's text never matches the
   `gate call failed: ` prefix pattern, so the two kinds stay distinguishable on the bytes.
3. **It is the code's own contract, in plain words.** `extensions/gate-tool.ts` documents
   `callId: string | null` as "null when the call threw **before recording**" (skeptic verified
   the converse for C: `runGate` returns `rec.callId` only after a successful append). B2 says
   exactly that, and it is true for all three sub-causes the designer listed (pre-POST guard,
   `buildGateState` throw, append fault) where "before recording" is not.
4. It keeps the designer's requirement intact: a named fact, not an alarm, no imperative verb,
   and readable without knowing what a ledger is. The `metered-deliberation-routing` wiki still
   owes the reader the vocabulary explanation — J5, unchanged.

**Cell C — accepted as proposed**, for the negative reason the principal gave: a non-null
`callId` is evidence a line *was* written, so C must never say "no line recorded". `not found`
is a statement about the render's own join, which is all it can observe, and it names the
truncation/revert case as what it is. T8 (B and C distinct literals) passes on these bytes.

**Addendum — cell A′, because O2 asked for it pinned and unpinning it leaves a second seat
authoring the surface.** A found record with no stored `basis` (a v1 line, tolerant-read per
`readGateLedger`) renders the **mode token alone**: `Mode: <resolvedMode>` — no separator, no
`undefined`, no authored sentence. It must not receive a fourth literal: there is no basis to
name, and inventing one is the "confidence the system does not have" the Intent forbids. This
needs no goal change — the amended goal says "the **recorded** one-line basis", and where
nothing was recorded there is nothing to name, which is a reading, not a reinterpretation.

**Constraints on the copy (binding on the spec, not on the how):**

- Neither fallback may assert or imply the scrubbed transport reason. The reason is gone at the
  tool boundary by EV-66's ruling; a line that gestures at it lies.
- Neither may contain an imperative verb. The O1-scoped scan over the fallback-literal constants
  (ban `\b(use|switch|should|must|run|do not)\b`) is the check; the converged re-scope from
  `decisionLine` output is correct and is not reopened here.
- All four cells share one composite and one separator byte, so no surface can drift from
  another — which is what makes the principal's Q1 falsifier ("`gate-ledger.ts` contains exactly
  one composite format expression") meaningful rather than merely syntactic.

**Authority:** user-facing failure wording on this surface is settled PO copy. EV-66 round 2
delta 5 recorded it as "strictly product-owner's" and the owner routed it as such; my Q(a)
ruling in EV-66's step 6 is the standing obligation this card discharges — "after EV-67 the run
ends in a named failure at the surface the person is already reading, not in silence". Silence
is not an option and neither is a line that reads as an instruction.

---

## J3 — the unconditional goal vs. off → zero lines

**Ruling: option (a). The goal is amended (text at J1) to scope the line to a gate-enabled run,
and the Acceptance pins "off renders no lines at all, byte-identical to the pre-gate rendering".
No steward escalation.**

The skeptic's O4 is correct as stated: the drafted goal is unconditional, the converged design
renders zero lines under off, and the R3 packaged default is off — so a strict judge on a
default-policy repo counts zero against "exactly one". That is a real conflict with the card's
own words, and the design is the side that is right.

**Why (b) — "record the vacuity reading, touch nothing" — is rejected.** The vacuity argument
("under off there is no resolved mode to name") is sound reasoning, but the goal as written does
not contain it: it says *exactly one additional line per card*, and to get from that to
"no lines when the gate is off" a judge must reinterpret the clause against its own literal
terms. That is the EV-29 lesson stated in `[[product-owner]]` and `[[engineering-board]]`:
**a goal that must be reinterpreted against its own words to be satisfiable is the defect**, and
the answer to a defective goal is to fix it, not to file a reading next to it. The
FLLWUP-58 precedent (`[[2026-09-20-po-fllwup58-gates-backstop]]`) licenses a documented reading
only where the literal reading is *also* the value-bearing one. Here the literal reading is
value-destructive: enforced under off it demands a render-authored line — `Mode: Deliberate —
gate off` or some such — which is precisely the invented confidence the Intent forbids and would
change the default `/features-new` rendering of every consumer repo for a feature that ships
disabled.

**Why this is PO and not steward.** The distinction the board record actually draws is not
"touches the goal text" vs. "does not" — it is whether the amendment changes **what the card is
for**, i.e. whether it moves the portfolio. EV-29 escalated because its goal named a data source
that does not exist: no amendment could preserve the card's purpose, only redirect it. Here the
purpose, the mechanism, and the value are untouched by the clause; the amendment *removes* a
demand and adds nothing to build. Precedent for PO-made goal amendments that name what the judge
must observe is dense and unbroken — EPIC-5 (EV-22/23/24/25 goals replaced at wave 3), EPIC-9
(four quantified-goal amendments), EPIC-11 §11 (EV-52/53 amended, `Ready`), EPIC-12 §5/§6/§7
(EV-57/58/59 amended) — and those were made without a steward pass whenever the substance was
already settled and only the observable needed pinning. This is that case, with one extra
guarantee: **the scoping is a human ruling already on the record.** R3 — Phase 1, binding for
this run, the human's — says the packaged policy ships `mode: "off"` with "no gate call, no
ledger line by default". A card whose goal demanded a line under off would contradict a recorded
human decision; the amendment removes the contradiction instead of adding one. Correcting a card
toward a human ruling is not reversing it.

I flag the boundary honestly: had I read R3 as *not* covering this — i.e. had "the goal's
quantifier is itself the defect" been the finding — that is a goal-defect escalation, and I
would have routed it to `steward` rather than editing. It is not, because the goal's quantifier
was written against a gate the epic intended to be on, and R3 arrived afterwards in the same run.

---

## J4 — the stale Intent sentence

**Ruling: it is an Intent amendment, this seat's to make, and it is not a contract amendment.
The sentence is replaced; the goal is untouched by it.**

Exact replacement for the final sentence of the Intent's third paragraph (the clause "The
rendering is a pure function of the recorded decision and the card, so the byte-identity test is
cheap and is the load-bearing evidence that no second gate was introduced."):

> The rendering is a pure function of the recorded decision alone: it takes no card text as
> input, so the byte-identity test is cheap and is the load-bearing evidence that no second gate
> was introduced, and the line's placement below the card body and above the approve/edit/drop
> prompt is a property of the procedure step, not of the function.

**Why not "record correction" (the O3 category).** O3 was a factual error inside the
*deliberation record* — a seat restating a stale board state. This is a sentence in the *card*,
and cards' prose is binding in this repo: EV-37's step-6 ruling established that the Intent
binds the literal it names (`[[2026-09-16-po-ev37-merge-gate-defect]]`). A stale binding sentence
is therefore not inert documentation the loop never reads; it is a second, contradicting
instruction to the owner about the function's inputs, on the one claim the whole byte-identity
proof turns on. S13 in the record already conceded the card is not a render input (S3), and the
owner's round-1 construction — *a function that never receives the card is byte-identity by
construction* — is the stronger design and is what ships. The text must stop describing the
rejected shape.

**Why not a contract amendment requiring escalation.** The judge's contract is the goal
(`[[judge]]`, `[[engineering-board]]`); nothing in this edit changes what the goal asserts or
what gets built. Intent amendment at ruling time is settled PO ground — EPIC-8 ruled child 2,
3 and 4 `Ready` "with Intent amendments", and EPIC-12 §5 prescribed Intent text ("must name the
surface, not just the mechanism"). And the owner's own round-1 condition holds: a card-text edit
is made **flagged by the ruling seat**, never absorbed silently into a diff. This is that
flagging.

---

## Options rejected (summary)

- **J1-A "step-4 approval gate" in the goal** — right fix, wrong durability class: an ordinal in
  the immutable surface, with four cards left in this run that can move it. Its precision is
  preserved in the Acceptance instead.
- **J1-B bare "the approval gate"** — under-determined now that the procedure contains two gates
  and calls one of them "the step-3 gate call" in its own prose.
- **J1-C document-only** — leaves a goal pointing at the step that forbids the print.
- **J2-B as endorsed** (`no ledger line recorded`) — cause-slot inversion, and byte-indistuishable
  in kind from a recorded failure line.
- **J2, giving B/C their own `Mode: ` prefix** — makes the fallbacks a second format string and
  re-opens the drift S1 closed.
- **J3-B (vacuity reading, no edit)** — demands that a judge reinterpret "exactly one" to mean
  "zero sometimes"; the EV-29 class of defect.
- **J4 as record correction** — treats binding card prose as documentation.
- **A fourth authored literal for A′** — invented basis, the exact failure mode the Intent names.

## Reversibility

Everything here is text on a `Deliberating`, undispatched card plus two string constants, and
nothing depends on it yet. If J1's wording is wrong, it costs one goal/title/board edit while the
card is still `Deliberating` — and once the card is `In Progress`, the wording is
non-negotiable, which is the reason it was chosen for stability. If either J2 literal is wrong,
reverting is two string constants and their goldens (T8, the imperative scan) — no reader,
ledger format, or downstream card touches these bytes: EV-70 reads the mode token, and the
composite's home is `gate-ledger.ts`. If J3's scoping turns out wrong, it is one clause and the
judge has not read the goal yet. If J4's sentence is wrong, it is prose the diff does not
compile. J1 is the only item whose cost grows with time, and the fix is already applied.

## Not ruled here (routed)

- **J5** — the documentation residuals (basis vocabulary, what each failure cell means, "the line
  describes the recorded decision; EV-69 re-checks at dispatch") stay at step 13. Add one item
  there: `council/cards/EPIC-13.md`'s Intent carries the same stale "step-3 approval gate"
  referent this ruling removes from EV-67, as do `gate-tool.ts:9-10`,
  `[[presented-never-written]]` and `[[three-wave-decomposition]]`. Epic-card and wiki prose is
  not a child card's edit surface; it needs no ordinal change to be correct, only a consistent
  one, and the ingest pass owns that.
- **One record-accuracy observation, not a defect in this card:** `council/cards/EV-66.md:284`
  cites `vault/raw/2026-09-20-po-ev66-step6-ruling.md`, and no such file exists in `vault/raw/`.
  The ruling's substance survives verbatim in the card. Owed to step 13.

## Sources used

- `council/cards/EV-67.md` (full record, steps 1–6, incl. the four cells and O1–O6),
  `council/cards/EV-66.md` (round-2 delta 5, step-6 Q(a)/Q(c)/Q(d), Outcome),
  `council/cards/EPIC-13.md` (Intent surface sentence; R2, R3)
- `council/procedures/features-new.md` `:40`, `:131`, `:153`, `:192`, `:206`, `:209-212`, `:215`
- `council/validate.py:205` (title↔board match), `council/board.md:76`
- `vault/wiki/engineering-board.md` (goal immutability/positional/`Deliberating`-legal; Acceptance
  as a separate amendable surface), `vault/wiki/product-owner.md` (EV-29 escalation, EV-33 and
  EV-43 rulings, wave-3 amends-child-goals), `vault/wiki/judge.md`,
  `vault/wiki/metered-deliberation-routing.md`, `vault/wiki/presented-never-written.md`,
  `vault/wiki/three-wave-decomposition.md`, `vault/wiki/deterministic-merge-check.md`
- `vault/raw/2026-09-20-po-ev65-step6-ruling.md` (basis composition clause 1),
  `vault/raw/2026-09-20-po-epic13-promotion-ruling.md` (P2 chain position of EV-67),
  `vault/raw/2026-09-20-po-fllwup58-gates-backstop.md` (the document-only test),
  `vault/raw/2026-09-16-po-epic9-retry-ruling.md` + `vault/raw/2026-09-15-po-epic8-ruling.md` +
  EPIC-11/EPIC-12 wave-3 rulings (PO goal/Intent amendment precedent),
  `vault/raw/2026-09-03-po-ev12-j1-ruling.md`, `vault/raw/2026-design-ev10-round2.md`
