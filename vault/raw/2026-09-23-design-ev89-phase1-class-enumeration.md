# EV-89 — Designer (independent first pass) — the Phase 1 class-enumerated surface

**Seat:** designer. **Source card:** EV-89 / EPIC-23. **State:** Deliberating.
**Run:** independent first pass; the consolidator will see other seats later.
This is the design argument, not the implementation. P1-4 (path),
P1-5 (refusal literal), P1-6 (`n/a:` grammar) are settled and bind this design.

---

## 1. The activity this surface serves

The Phase 1 step is read by **two operators**, at different moments, with
opposite gulfs:

- **The human operator, once per epic.** They read `features-deliver.md`'s
  Phase 1 paragraph and the durable `council/phase1-rulings.json` record and
  must produce a complete ruling set before any `council-runner` is
  dispatched. The Gulf of **Execution** here is: they have to know what
  each named class is actually asking. "Surface copy" is a noun; it does
  not tell the operator what ruling to record. They have to remember or
  infer from deliberation history what each phrase means, or the entry
  becomes a rephrase that satisfies nothing.

- **The fresh `council-runner`, per card.** Per `council-runner.md`'s
  `<escalation_contract>` step 1, a runner arriving at a dispute checks
  the Phase 1 rulings first and applies-and-cites what is on record. The
  Gulf of **Evaluation** here is: the runner must locate the matching
  ruling by class identifier (or escalate when it cannot), without
  re-reading the procedure. The refusal literal `Phase 1 unresolved:
  <class>` (P1-5) must carry enough that a runner or human reading the
  run log can resolve the class from text alone.

The current Phase 1 paragraph (`features-deliver.md:127-141`) names the
classes in passing — "user-visible copy, what a state is named, how much
uncertainty to show a person about data that has no realtime availability
and no prices" — and treats each as a noun phrase the operator will
rephrase into a ruling. The acceptance bullet 1 closes that hole by
naming a closed, enumerated set; bullets 8 and 9 add stakes-order and
ruling-binding rules. What the acceptance does NOT pin:

1. Each class's *prompt* — the question the operator answers.
2. The structural shape of a ruling *per stakes tier* (per-card
   reversible vs run-committing vs portfolio-level).
3. The anti-shrug rule on `n/a: <reason>` (P1-6 settles the prefix but not
   the substance).
4. The discovery seam: what a fresh runner does when
   `council/phase1-rulings.json` is present but a class is missing
   because the file was generated under an earlier class set.

I argue for closing each. The fixes are small and sit on the card's
existing edges — no new file, no new gate, no schema fork.

---

## 2. Finding A — each class must read as a question, not a noun

**Moment:** the human operator reads the Phase 1 paragraph in
`features-deliver.md` for the first time, at the start of a new epic.
They see the class list and must produce rulings.

**Principle violated:** signifier (the list names what to rule on, but
does not say what the ruling is *about*). The EPIC-11 setup interview
finding (Finding A in
`vault/raw/2026-09-22-design-epic11-recut-surface.md`) named the same
failure class on the seat-composition question: "the recommendation is
Jev's, not a profile field's, but the header reads as if it were a
profile field." Here, the class name is a noun; the operator is asked to
write a ruling whose meaning they cannot infer from the noun alone
without prior knowledge of past deliberations.

**Consequence to the person:** the operator rephrases the noun into
a ruling, exactly the failure mode the card's `## Intent` paragraph
names ("the reader can rephrase it into nothing and proceed"). The
closed enumeration does no work if each entry is a rephraseable noun.

**Evidence:** the existing Phase 1 paragraph in `features-deliver.md`
at the "Front-load these specifically" clause — five noun phrases
("user-visible copy", "what a state is named", "how much uncertainty to
show", "no realtime availability and no prices", "names a surface") with
no question stems.

**Smallest fix:** an acceptance sub-bullet (or a settled-by-deliberation
literal) that each class entry in the procedure is **question-shaped**,
with a verb. Sketch (not a copy commitment):

| Class id            | Question the operator answers                                     |
|---------------------|--------------------------------------------------------------------|
| `surface_copy`      | What verbatim copy does the operator-facing surface show?         |
| `state_naming`      | What are state and field names the user reads?                     |
| `uncertainty_display` | How much uncertainty does the surface show about data the system does not have? |
| `error_empty_state` | What copy does an empty state and an error state carry?            |
| `gate_user_visibility` | Is the change visible to a person in the running product? (boolean; gates routing) |

The acceptance pin already covers presence-in-procedure (bullet 3). The
question shape is a *sub-acceptance*: a second prose pin asserts that
each named class identifier in the record is preceded in the procedure
by a question stem (a line ending in `?` or starting with "What / Does /
Is / How"). If a class is present in the record but absent a question
prompt in the procedure, the test reds.

The class identifiers are snake_case stable keys; the *display* names
("surface copy", "uncertainty display") remain human-readable, but the
refusal literal (`Phase 1 unresolved: surface_copy`, per P1-5) keys off
the stable identifier so renames do not break run-log greps. This is
the same move EV-82 made on the follow-up disposition render: stable
identifiers in the data, ruled wording on the surface.

---

## 3. Finding B — stakes tiers are structural, not just render order

**Moment:** a fresh runner arrives at `<escalation_contract>` step 1 with
a ruling record that has per-card reversible classes filled in but
run-committing classes blank. The runner must decide: refuse dispatch
or escalate per-class?

**Principle violated:** the card's acceptance bullet 8 names the
per-card reversible → run-committing → portfolio-level ordering as a
RENDER rule ("renders ordered by stakes, not as a flat checklist"). It
is not a STRUCTURE rule. If the JSON record carries the five classes in
a flat array with no `tier` field, the runner sees them in source order,
not in stakes order. The render rule binds the procedure's display; the
runner reads the JSON.

**Consequence to the person:** two parallel failure modes.

- The runner's refusal names the FIRST-missing class in JSON source order,
  not the EARLIEST-stakes-missing class. The operator reading the refusal
  cannot tell which of two blank classes to rule first, because the
  runner told them about the wrong one.
- A operator who writes rulings in source order may give a per-card
  reversible ruling the same shape as a portfolio-level ruling, losing
  the information that the latter is a routing gate (it binds the gate's
  user-visibility question — `userVisibility` per FLLWUP-71's goal — to
  the recorded mode).

**Evidence:** the card acceptance bullets 1 (closed enumerated set) and
8 (ordered by stakes) are not coupled. Bullet 8 lives in the procedure
prose; the JSON shape is unconstrained. FLLWUP-71's goal text shows the
portfolio-level class carries a boolean (`userVisibility answers yes` →
hard-route to Deliberate), which is a different ruling shape from
per-card reversible classes (typically a verbatim copy string).

**Smallest fix:** a structured record shape, three field shapes per
tier, ordered by stakes:

```json
{
  "version": "phase1-rulings-1",
  "classes": [
    {
      "id": "surface_copy",
      "tier": "per_card_reversible",
      "ruling": "verbatim copy string here"
    },
    {
      "id": "state_naming",
      "tier": "per_card_reversible",
      "ruling": "verbatim copy string here"
    },
    {
      "id": "uncertainty_display",
      "tier": "run_committing",
      "ruling": null,
      "n_a": "uncertainty display is deferred to EV-41's per-attempt legend work; not in scope for EPIC-23"
    },
    {
      "id": "error_empty_state",
      "tier": "run_committing",
      "ruling": null
    },
    {
      "id": "gate_user_visibility",
      "tier": "portfolio_level",
      "ruling": false
    }
  ]
}
```

- `per_card_reversible.ruling` is a string (verbatim copy or naming).
- `run_committing.ruling` is a string OR an object `{ trade_off: "...",
  chosen: "..." }` — the operator must name the trade-off, not just the
  choice. The EPIC-13 deliberation found that trade-off-naming on
  run-committing rulings is what surfaces hidden disagreement later
  (`vault/raw/2026-09-20-po-ev13-promotion-ruling.md`).
- `portfolio_level.ruling` is a boolean.
- `n_a` is a string (see Finding C for the anti-shrug rule).
- The runner reads the array in declared order (the procedure's source
  order IS the stakes order, by structural requirement) and refuses the
  first class whose `ruling` is `null` AND whose `n_a` is missing or
  fails the anti-shrug check.

`version: phase1-rulings-1` is the discovery-seam field (Finding D).
The runner pins the class set it expects at its dispatch head and refuses
with a distinct literal when the record carries a class it does not know
(see Finding D).

---

## 4. Finding C — `n/a: <reason>` is structurally too weak an anti-shrug rule

**Moment:** the operator reads the Phase 1 step, sees
`uncertainty_display` is not relevant to this epic, and writes
`n/a: not in scope`. The record is accepted.

**Principle violated:** the existing structured-unavailable-state
grammar in this project uses a `key = <definition>` shape, not a
`key: <value>` shape. The `usage  partial = reported figure excludes
unaccounted attempts` and `usage  n/a = provider figure unavailable`
grammars in `extensions/usage-block.ts:48-54` both require a
*definition* — a sentence-fragment that explains what the unavailable
state means. `n/a: not in scope` is a value, not a definition; it
satisfies a structural check but says nothing to a future runner
arriving at the dispute.

**Consequence to the person:** an operator under time pressure writes
the minimum-length n/a and the run dispatches. A fresh runner on a
later epic that touches uncertainty display reads the prior epic's
`n/a: not in scope` and escalates — the literal tells the runner
nothing about why the prior epic declined, only that it did.

**Evidence:** P1-6 settled `n/a: <reason>` as a *prefix*, leaving the
reason's substance unconstrained. Compare with the EV-39 / EV-42
disclosure work, where the literal's substance was hardened
(`vault/wiki/figure-scoped-disclosure.md`, "The copy and the stack"
section): the legend key stayed `partial`; the wording was required to
be a definition, not a tag. The same discipline belongs here.

**Smallest fix:** an acceptance sub-bullet that a `n/a` reason must
satisfy two predicates, validated by `validate.py` on the same fence
as the board (per P1-4):

1. **Length floor.** The text after `n/a: ` is at least 16
   non-whitespace characters. `n/a: TBD` and `n/a: N/A` and `n/a: see
   above` all fail.
2. **Definition shape.** The text contains at least one of: a noun
   phrase naming what the class WOULD have ruled on (e.g. "the
   dispatch-time uncertainty copy"), a verb naming an action taken or
   deferred (e.g. "deferred to FLLWUP-X", "owned by EV-Y"), or a
   question the operator cannot answer yet (e.g. "depends on whether
   the data has realtime availability"). Punctuation-only or stopword
   strings fail.

The validate.py check produces a FAIL: line that names the class and
the failing predicate (`FAIL: phase1-rulings.json class
"uncertainty_display" n/a reason fails length floor (got 11 chars,
need ≥16)`) so the operator sees what to fix without re-reading the
procedure.

---

## 5. Finding D — the discovery seam is silent on what happens when classes disagree

**Moment:** EPIC-24 ships. Its Phase 1 record carries classes
`surface_copy, state_naming, uncertainty_display, error_empty_state,
gate_user_visibility` — the EV-89 settled set. A fresh runner from
EPIC-23's container is resumed against EPIC-24. The runner's
`<escalation_contract>` step 1 reads the record; an in-flight dispute
about, say, `uncertainty_display`'s treatment is NOT in the runner's
known class set.

**Principle violated:** the path-and-locate clause (acceptance bullet
6, P1-4) settles WHERE the record lives, not what the runner does when
the record's class set differs from the runner's expectation. The
escalation contract (step 1 of `<escalation_contract>`) says "apply
the ruling and cite which ruling you applied" — but a class identifier
the runner does not recognize cannot be cited, and silently applying
the closest match is exactly the "deciding dressed up as applying" red
flag the contract itself names.

**Consequence to the person:** the runner escalates with a vague
packet ("could not locate ruling for class X") because the contract
gives no escalation literal for "the class set drifted." The human
operator reading the escalation cannot tell whether the runner failed
to read the file, the file is corrupt, or the class set changed.

**Evidence:** `<escalation_contract>` in `council-runner.md:90-115`
names three steps and one red flag; none names the class-set-drift
case. The `version` field on the record (per Finding B's proposed
shape) is the seam but the contract does not read it.

**Smallest fix:** an acceptance sub-bullet that the runner reads
`version` from the record and applies the matching class set it has
hard-coded for that version. If the record's version is unknown to
the runner, the runner escalates with a distinct literal:
`Phase 1 version mismatch: record=<version>, runner expects=<version>`.
This is symmetric with the EV-70 mode-aware HALT lines
(`HALT: EV-<n> has no recorded execution mode`) and the FLLWUP-60
record-push HALT — same "I cannot infer" shape, locatable from text
alone.

The runner's hard-coded class set per version is itself pinned by a
prose pin in the procedure ("for phase1-rulings-1, the named classes
are ..."), so a class-set change is a procedure edit (visible in git
diff) and the runner's hard-coding can be bumped deliberately.

---

## 6. Finding E — the procedure's prompt-stem ordering is the stakes-order rendering rule

**Moment:** a human reads the Phase 1 paragraph to write rulings.

**Principle violated:** knowledge in the world beats knowledge in the
head. The card's acceptance bullet 8 says the class list "renders
ordered by stakes, not as a flat checklist of equal items." But what
does ordered-by-stakes LOOK LIKE on the page?

**Consequence to the person:** a flat numbered list (1. surface copy
2. state naming 3. uncertainty display ...) reads as a checklist of
equal items no matter how the source order was chosen. The operator
treats each entry as independent and equally urgent; the stakes signal
is lost.

**Evidence:** the EV-11 step-2 wave structure
(`test/prose.test.ts:107-119`) named the same issue: a flat checklist
of three waves reads as "three equivalent rounds" even when one is
load-bearing. The solution there was prose stating the tier
explicitly; the same move belongs here.

**Smallest fix:** the procedure renders the class list as three
stakes-headers under one Phase 1 section, with each class entry
carrying its stable identifier and question prompt:

```
Phase 1 — class-enumerated rulings

Per-card reversible (ruling shape: verbatim string; misruling
is correctable on the card face at deliberation):

  - `surface_copy` — what verbatim copy does the
    operator-facing surface show?
  - `state_naming` — what state and field names does the user
    read?

Run-committing (ruling shape: trade-off + chosen value; misruling
binds every seat for the class and the epic):

  - `uncertainty_display` — how much uncertainty does the
    surface show about data the system does not have?
  - `error_empty_state` — what copy do empty and error states
    carry?

Portfolio-level (ruling shape: boolean; misruling routes cards
wrong at the gate):

  - `gate_user_visibility` — is the change visible to a person
    in the running product? (binds FLLWUP-71's gate question.)
```

The headers ("Per-card reversible", "Run-committing", "Portfolio-level")
are the stakes-tier names spelled out; the ruling SHAPES are next to
them, so the operator sees both the tier and the field type before
writing. The prose pin in acceptance bullet 3 expands to assert all
three headers and the per-tier shape strings.

---

## 7. Falsifiable predictions (cold-read persona harness shape per FLLWUP-68)

P1. *Class enumeration is locatable from refusal text alone.* A
first-time runner dispatched with no Phase 1 record present, given the
refusal literal `Phase 1 unresolved: uncertainty_display`, can name
the class without re-reading the procedure.
**Falsifier:** FLLWUP-68 cold-read harness, persona given the literal
only, asked to name the class and its ruling shape. Pass threshold:
4/5 readers name both; below that, the literal needs a sub-token rule
("Phase 1 unresolved: uncertainty_display (run-committing)").

P2. *Class entries read as questions, not noun phrases.* An operator
reading the Phase 1 procedure for the first time can re-state each
class's ruling prompt in their own words.
**Falsifier:** cold-read on the procedure's Phase 1 paragraph; ask
the reader to write the ruling they would record. Pass threshold: each
class's ruling matches a pattern the operator could defend in two
sentences.

P3. *The ordering-by-stakes carries meaning the runner respects.* A
runner given a partial record (per-card reversible classes ruled,
run-committing classes blank) refuses dispatch with the correct
refusal literal — `Phase 1 unresolved: uncertainty_display`, not
`Phase 1 unresolved: gate_user_visibility`.
**Falsifier:** dispatch attempt with a partial record; the refusal
names the *earliest-stakes unresolved class*, not the first-listed.
Pass threshold: 5/5 trials name the correct class.

P4. *The `n/a:` reason survives the shrug test.* An operator who would
otherwise write `n/a: TBD` is forced to write a substantive reason.
**Falsifier:** validate.py on the JSON record — `n/a` values shorter
than 16 chars or matching the blacklist
(`/^(n\/a|TBD|N\/A|see above|none|skipped)$/i`) produce a named FAIL.
Pass: zero FAIL on a hand-written test record; FAIL fires on a
shrugged record.

P5. *A fresh runner finds the record via path alone, not procedure
re-read.* With `council/phase1-rulings.json` present and the procedure's
`<escalation_contract>` step 1 carrying the path, the runner applies a
Phase 1 ruling without re-reading `features-deliver.md`.
**Falsifier:** a unit test of the runner's input composition: the path
is named in the dispatch input AND the procedure's escape clause
("apply the ruling you find at the path") is in the contract.

P6. *The refusal does not collide with the generic `HALT:`
environment-failure line.* An operator reading the run log can locate
the Phase 1 refusal from its prefix alone, without grepping for `EV-<n>`.
**Falsifier:** a grep of the run log for `Phase 1 unresolved:` returns
the refusal in 1 hit; a grep for `HALT:` returns environment failures
only; both prefix-greps return disjoint result sets.

P7. *A class-set version mismatch produces a distinct refusal literal,
not a vague escalation.* A runner receiving a record with
`version: phase1-rulings-2` when it expects `phase1-rulings-1`
escalates with `Phase 1 version mismatch: record=phase1-rulings-2,
runner expects=phase1-rulings-1`.
**Falsifier:** a unit test injects the version mismatch into the
runner input; the escalation report's first line is the literal
verbatim. Pass: byte-equal.

---

## 8. Where this design fails a person under time pressure

The card's strongest design intent — "the reader can rephrase it into
nothing and proceed" — is the failure mode my Findings A–E exist to
prevent. Under time pressure the failure modes I predict are:

- **The operator skims the noun-style class list and writes one-line
  rulings that paraphrase each noun.** Finding A's question-stem fix
  prevents this if and only if the question stems are themselves short
  enough to read at a glance (one line, not a paragraph). If a question
  stem runs to two sentences, the operator skims and paraphrases back.
  I would size each prompt at one sentence, with the trade-off spelled
  in a sub-line.

- **The operator writes `n/a:` for the classes they cannot think about
  and moves on.** Finding C's anti-shrug rule catches the structural
  shrugs (TBD, N/A, see above) but cannot catch the sophisticated shrug
  ("n/a: not relevant to this epic" — passes the length floor, contains
  a noun phrase, but says nothing). I cannot solve this in code; the
  procedure's prose must say what an n/a SHOULD name ("a deferred work
  item, an out-of-scope ruling owned elsewhere, or a question whose
  answer blocks the run"), and a cold-read persona test on a
  fresh-operators cohort (FLLWUP-68 shape) is the only honest settling
  mechanism. I would not pretend a structural predicate closes this.

- **A fresh runner on a resumed epic sees a Phase 1 record with a
  class set that drifted from its hard-coded set.** Finding D's
  version-mismatch literal catches this if and only if the procedure
  pins the runner's class-set per-version and a deliberate class-set
  change is a visible procedure edit. If the runner's hard-coding is
  implicit (e.g. inferred from the record at dispatch time), the
  version-mismatch literal is unreachable. The procedure must commit
  to the class set per version with a prose pin.

- **The stakes-tier rendering collapses to a flat checklist under
  rendering pressure.** A future editor wraps the per-tier headers in
  a numbered list "to be tidier" and loses the stakes signal. The
  prose pin in Finding E must assert the three tier headers verbatim,
  the way the EV-66 step-4 byte-identical pin works
  (`test/prose.test.ts:62-79`).

---

## 9. Sources and citations

- `vault/wiki/index.md` — wiki map; standing hazards.
- `vault/wiki/step-13-followup-surface.md` — the EV-82 refusal-literal
  precedent (the closest analog for "presented, never written" +
  distinct refusal + named unavailable-state literals).
- `vault/wiki/figure-scoped-disclosure.md` — the
  `usage  partial = <definition>` grammar; the key=definition shape
  this card's `n/a:` grammar should mirror.
- `vault/raw/2026-09-22-design-epic11-recut-surface.md` Finding A —
  the noun-style header mis-attribution failure class.
- `vault/raw/2026-09-16-design-ev42-partial-legend.md` — the
  precedent for retiring a stale literal and adding a definition-shaped
  one without widening the grammar.
- `vault/raw/2026-09-18-design-fllwup50-refresh-path.md` — the
  precedent for a procedure-pinned version field with a class-set
  declared per version.
- `council/cards/FLLWUP-68.md` and `FLLWUP-71.md` — the cold-read
  persona harness shape (FLLWUP-68) and the gate's user-visibility
  question (FLLWUP-71) that the portfolio-level class binds.
- `council/procedures/features-deliver.md` Phase 1 paragraph (lines
  127-141) — the noun-style class list this design replaces.
- `council/procedures/council.md` step 12, 13 — the mode-aware HALT
  lines, the presented-never-written pin, and the pre-write pin
  (`confirmed at ledger level`) that this card's refusal pattern
  parallels.
- `extensions/usage-block.ts:48-54` — the structured unavailable-state
  grammar (`usage  n/a = ...`, `usage  partial = ...`).
- `council/agents/council-runner.md` `<escalation_contract>` and
  `<followup_decision>` — the routing and reporting contracts a fresh
  runner follows.
- `council/validate.py` — the fence the anti-shrug rule lands on.
- `council/gate/questions.json` — the four current gate questions;
  the portfolio-level class binds `userVisibility` per FLLWUP-71.
