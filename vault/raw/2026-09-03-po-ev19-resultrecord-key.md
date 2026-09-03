# EV-19 escalation ruling — ResultRecord store key under C2 re-grade (binding)

This ruling resolves the one open-judgment dispute on the EV-19 deliberation
record (`council/cards/EV-19.md`): under C2 ("replay append-only:
re-grading under a different pinned grader writes a second verdict keyed
by `gradedBy`; the original record is byte-identical"), what is the
store-key semantics for the **ResultRecord** — the score + merged
per-criterion record EV-19's spec commits as keyed `(cellId, repeat)`.

## Question, restated

EV-19's settled design (round 3) commits the on-disk ResultRecord to
carry `cellId, taskId, model, thinking?, repeat, fixtureVersion,
rubricVersion, scoredUnder, perCriterion (ALL criteria, rubric order),
score, gradedAt` and to be "keyed `(cellId, repeat)` — keying commitment
itself under O1." The Skeptic's O1 (`open-untested`) proved that under
C2 re-grading a captured run under a second grader M2 produces a
ResultRecord with the same `(cellId, repeat)` but a different
`scoredUnder`. EV-19's `(cellId, repeat)` key has no `gradedBy`
dimension, so M2's ResultRecord collides with M1's at the store layer.

The deliberation listed three resolutions and picked none. I am the
ruling seat (the consolidator explicitly routed this to product-owner as
a structural design decision, not prose; the seat-invocation asks the
runner to bind the choice). I rule.

## What the vault and board history already constrain

- **EV-16 spec §6 verdict schema and topology ruling
  (`vault/raw/2026-09-03-po-ev16-grader-topology.md`)** — the
  `VerdictRecord` is the grader's contribution (judge criteria only,
  gradingUsage, no score) and is committed to append-only across
  re-grades with `gradedBy` as the second key dimension. Two graders
  → two VerdictRecords, both readable. This is the existing pattern
  ResultRecord must mirror or contradict; on the merits, mirror is
  cheaper and more honest.
- **EV-16 spec §6.4** explicitly forbids cell drivers from dispatching
  graders and reserves grader dispatch to the harness — so a
  re-grade-under-M2 is a harness-initiated action, not a user-driven
  repetition. M2 is a deliberate second opinion the maintainer wants
  to compare.
- **EV-19 record (consolidator synthesis, round 3 closed)** —
  "VerdictRecord append-only keyed `(cellId, gradedBy)`, first-write-
  wins"; "ResultRecord ... `keyed (cellId, repeat)` — keying commitment
  itself under O1." The two-record asymmetry is exactly what O1
  surfaces; the deliberation did not adjudicate.
- **EV-19 acceptance** — "the same run re-graded produces the same
  score." This is C1 (re-grade reproducibility) and is orthogonal to
  C2 (re-grade-under-a-different-grader append-only). C1 holds under
  any of the three options; C2 is what O1 asks about.

## Why I rule rather than escalate to `steward`

Per `<escalation>` in the seat's authority: escalate to steward when the
ruling would change the **portfolio**, not just this card. O1 does not
change the portfolio — it binds EV-20's store contract for the
ResultRecord (an on-disk detail in a downstream `Backlog` card's
implementation) and EV-21's aggregation input (a column dimension the
leaderboard reads). EV-19, EV-20, and EV-21 are all under EPIC-4 with
serial promotion per `vault/raw/2026-09-03-po-epic4-promotion-cadence.md`;
EV-19 is `Deliberating`, EV-20 and EV-21 are `Backlog`, no code exists.
Reversibility is a spec edit. The VerdictRecord schema and topology are
unchanged by this ruling; EV-16's recorded human decisions are
untouched. This is a card-level judgment, not a portfolio change. I
rule.

## Ruling

**Option A — extend the ResultRecord store key to
`(cellId, repeat, scoredUnder)`.** Both graders' ResultRecords are
readable; M2's score is not silently dropped; the leaderboard (EV-21)
aggregates over the `scoredUnder` dimension explicitly when more than
one grader has run; the spec's own `scoredUnder` field (which EV-19's
design already commits as a ResultRecord member) becomes the store
key's third dimension, not merely a stamp.

### Why

**Mechanism.** The ResultRecord's `scoredUnder` field is the analogue of
the VerdictRecord's `gradedBy` field. EV-16 spec §6 already commits
`VerdictRecord` to append-only keyed `(cellId, gradedBy)` — the
deliberated contract is "two graders → two verdict records, both
readable." Dropping ResultRecord to `(cellId, repeat)` is the asymmetric
exception; extending it to `(cellId, repeat, scoredUnder)` is the
symmetric application of the same rule to the same problem on the same
record. The mechanism is consistent across the two record types; one
store contract, not two.

**User value.** A maintainer who re-grades a cell under M2 is asking a
real question: "does the score move under a different judge?" If M2's
ResultRecord is dropped (option b), the answer is invisible — the cell
still shows M1's score, and the maintainer cannot tell whether the
re-grade even ran. The leaderboard's truthful-empty-state ethos
(EV-21 acceptance, R-7) is the same principle at the read side: a
record's existence should reflect what happened. Throwing M2's score
away makes the leaderboard less honest, not more. Option (a) keeps both
scores readable so the comparison is meaningful; option (b) is silent
loss; option (c) defers to a card (EV-20) that will face the same
three options and the same asymmetry, just with less context.

**Reversibility.** Option (a) is committed as a spec-level key
dimension. EV-20 implements the store and EV-21 implements the
aggregation; both are still `Backlog`. If the maintainer later decides
a different keying is right, the change is a spec edit + one store
implementation, not a rewrite of already-landed code. Option (b)
embeds "first grader wins" in the store contract; reversing that later
is a non-trivial migration of any M2 records that were silently dropped
in the interim (recoverable only if the VerdictRecord store retained
enough to re-derive them, which it does — `gradedBy` is the
VerdictRecord's append-only key, so M2's verdicts survive; but
EV-19's gradeCell output against M2's verdicts is not stored under
option b, so the **ResultRecord** cannot be re-derived without
re-running the gates against a re-materialized seed). Option (a)
incurs no such recovery debt.

**The principal's round-2 reframe already said this in cross-seam
terms** (`council/cards/EV-19.md` line 221-224): "a ResultRecord without
a stamped `scoredUnder: gradedBy` is unauditable, and a fixture with
judges re-graded under two graders has two defensible scores." Option
(a) is that reframe applied as a key dimension, not just a stamp.

**Why not first-write-wins (option b).** Option (b) makes M2's
ResultRecord invisible. The VerdictRecord append-only contract is
precisely what C2 promises the maintainer — "a second verdict keyed by
`gradedBy`; the original record is byte-identical." Throwing away the
ResultRecord under the same scenario contradicts the same intent one
layer up. The defense offered for option b (avoid noise, "the first
score is the score") is the kind of "feature-complete / impressive-
looking" lens the seat's `<re_grounding>` warns against: it makes the
output cleaner-looking at the cost of making the comparison the
maintainer wanted impossible. The honest default under C2 is to keep
both.

**Why not defer (option c).** EV-19's `ResultRecord` is the
**producer** of the field the store keys on. Saying `(cellId, repeat)`
"in EV-19's record is identity-only, not a store key" is a verbal
distinction that any honest implementation must eventually resolve —
the moment EV-20's writer picks a key, it either matches the
VerdictRecord's append-only pattern or it doesn't. Option (c) hands
EV-20 the same three options to pick from with less context, and
forces the asymmetry to resurface inside the store layer where it is
harder to read. Picking (a) now keeps the spec, the store, and the
leaderboard reading the same shape.

## Options rejected

- **Option B — `(cellId, repeat)` with first-write-wins** — rejected
  because it silently drops M2's ResultRecord. C2 promises both records
  survive; option (b) breaks that promise at the merged-per-criterion
  layer even though the VerdictRecord layer honors it. The leaderboard
  then shows M1's score as the cell's score with no signal that an M2
  re-grade ever happened; the maintainer's "does the score move?"
  question has no visible answer.
- **Option C — mark `(cellId, repeat)` as identity-only** — rejected
  because it defers a structural decision EV-19's own spec already
  owns (`scoredUnder` is a committed ResultRecord member; making it
  "identity-only" while VerdictRecord is keyed by its `gradedBy`
  sibling creates the asymmetry the deliberation refused to
  adjudicate). EV-20 will face the same three options with less
  context; the deferral is reversible at the cost of EV-20
  re-deliberating. Cheaper to pick now.

## Grounding

- `council/cards/EV-19.md` rounds 1–3 + Skeptic O1 (`open-untested` —
  no settling test run because no store code exists yet) +
  consolidator synthesis (the dispute as left by the deliberation).
  Specifically the round-3 principal reframe (line 221-224) and the
  consolidator's "ResultRecord ... keyed (cellId, repeat) — keying
  commitment itself under O1" (line 607).
- `vault/raw/2026-09-03-po-ev16-grader-topology.md` — the
  VerdictRecord store is already `(cellId, gradedBy)` append-only with
  first-write-wins per (cellId, gradedBy, fixtureVersion, rubricVersion).
  That is the symmetric pattern ResultRecord must mirror.
- `docs/superpowers/specs/2026-09-03-EV-16-design.md` §6 verdict
  schema (line 203-207) — `gradedBy` is "appended across re-grades;
  first write wins for the cell, subsequent writes are new records."
  Same intent, same contract.
- `docs/superpowers/specs/2026-09-03-EV-16-design.md` §6.4 — cell
  drivers cannot dispatch graders; the harness owns all grader
  dispatches. So a re-grade under M2 is a deliberate harness action,
  not a user-driven repetition; M2's score is the answer to a real
  question the maintainer asked.
- `council/cards/EV-20.md` Phase 1 rulings R-3/R-4/R-5 and
  `council/cards/EV-21.md` R-6/R-7 — neither binds the ResultRecord
  store key; both rely on the leaderboard reading what the store
  writes. The choice here is the only constraint on what EV-20
  writes; EV-21 reads whatever that is.
- `vault/wiki/llm-wiki.md` + `vault/wiki/product-owner.md` —
  grounding-and-escalation discipline ("a ruling citing nothing is a
  coin flip"; card-level rulings are final among agents; portfolio
  matters escalate).

## Reversibility

Spec-level edit. To reverse: change EV-19's `ResultRecord` keying text
in `docs/superpowers/specs/2026-09-03-EV-19-design.md`, change EV-20's
store contract in its plan and implementation, change EV-21's
aggregation input. None of those cards has started implementation.
Cost: minutes for the spec edits, hours at most for the implementation
changes. No code is committed under this ruling; nothing exists to roll
back.

## Spec text the runner writes

The step-7 writer (`docs/superpowers/specs/2026-09-03-EV-19-design.md`,
section 6 "ResultRecord schema" and section 8 "Store contract") commits
to:

1. **ResultRecord schema carries `scoredUnder: string`** as the
   grader's model id at the time of the score — analogous to
   VerdictRecord's `gradedBy`, stamped at write time.
2. **On-disk store key is `(cellId, repeat, scoredUnder)`.** Two
   graders re-grading the same `(cellId, repeat)` produce two
   ResultRecords, both readable. There is no first-write-wins at
   the ResultRecord layer (the VerdictRecord layer's first-write-wins
   is per-`(cellId, gradedBy, fixtureVersion, rubricVersion)` and is
   unaffected).
3. **EV-20's writer (`council/eval-results/...`) chooses filenames from
   the triple `(cellId, repeat, scoredUnder)`** — same atomic
   write pattern as the VerdictRecord writer (per the grader-topology
   ruling); absent triple → writer throws; existing triple with a
   different payload → writer throws (within (fixtureVersion,
   rubricVersion) the score is a deterministic function of the seed
   + judge verdicts; a divergent payload is a defect, not a
   re-write). The VerdictRecord's `(cellId, gradedBy, fixtureVersion,
   rubricVersion)` first-write-wins is the read-owner of judge
   verdicts; the ResultRecord's `payload-must-match` rule is the
   read-owner of the merged per-criterion + score. Both are
   honest-about-the-source semantics.
4. **EV-21 reads `council/eval-results/` and aggregates per
   `(taskId, model, thinking, scoredUnder)` cell** — the
   `scoredUnder` dimension is explicit in the leaderboard. When a
   cell has exactly one `scoredUnder`, the leaderboard renders that
   one score; when a cell has more than one (cross-grader re-grade
   has happened), the leaderboard renders each as its own row or as
   a multi-line cell per the EV-21 copy deliberation (R-7 deferred
   copy to that card). Either way, no `scoredUnder` is invisible.
5. **`scoredUnder = gradedBy` invariant** — the ResultRecord's
   `scoredUnder` equals the VerdictRecord's `gradedBy` that was
   projected into the merged score. This is a structural rule, not
   a runtime check; a divergent value is a writer defect.
6. **C1 reproducibility (acceptance)** still holds: re-grading under
   the SAME `scoredUnder` reads back the same VerdictRecord, replays
   the same judge verdicts through `gradeCell`, gates re-run
   deterministically, score is byte-identical. The store key is
   `(cellId, repeat, scoredUnder)` so same-key lookups surface the
   original.

## Summary for the runner

| Question | Ruling |
|---|---|
| ResultRecord store key | **`(cellId, repeat, scoredUnder)`** — both graders' ResultRecords readable; `scoredUnder` is the second dimension, symmetric with VerdictRecord's `gradedBy` |
| First-write-wins at ResultRecord layer? | **No** — within `(fixtureVersion, rubricVersion)` the score is a deterministic function; a divergent payload for an existing key throws (defect, not re-write); an absent key is a new file |
| VerdictRecord semantics affected? | No — VerdictRecord is unchanged: append-only keyed `(cellId, gradedBy)`, first-write-wins per `(cellId, gradedBy, fixtureVersion, rubricVersion)` |
| EV-20 store contract | Filename from `(cellId, repeat, scoredUnder)`; atomic write; absent key → new file; existing key + divergent payload → throw; same payload → no-op |
| EV-21 aggregation input | Explicit `scoredUnder` dimension; one row per grader when re-graded, one row when only one grader has run; no `scoredUnder` invisible |
| Step-7 spec sections touched | §6 ResultRecord schema; §8 store contract (new, written here) |
| Steps unblocked | Step 7 (write the spec); steps 8–14 follow once the spec lands |

The runner writes the spec per items 1–6 above, then proceeds to step 7's
remainder (closing O2's both-role+path rule and O4's gradingUsage merge
in spec text). Steps 8–14 follow per the card's deliberation discipline.
