---
slug: po-ev82-step13-confirmation
card: EV-82
epic: EPIC-10
seat: product-owner
step: 13
date: 2026-09-22
kind: ruling
---

# EV-82 — product-owner step-13 confirmation (two drafts CONFIRMED, both amended; one composition-site answer accepted)

**Subject.** The `council-runner` that executed **EV-82** (state `Done`, merged
`277036b526bbeac19b82a8d6ae40d6bb6f01b3df`, PR #101, package 0.32.0) held two step-13
drafts per the pre-write draft-then-confirm gate (`council/procedures/council.md` §13;
`[[engineering-board]]`; `FLLWUP-69`'s pinning). In this autonomous `/features-deliver`
run over EPIC-10 the human's confirmation act is re-homed to this seat — same authority
shape as `vault/raw/2026-09-22-po-ev81-step13-confirmation.md`,
`vault/raw/2026-09-21-po-ev79-step13-followup-confirmation.md` and
`vault/raw/2026-09-20-po-fllwup58-step13-confirmation.md`.

**Disposition in one line: both drafts are CONFIRMED as `FLLWUP-101` and `FLLWUP-102`,
both `epic: EPIC-10`, both `Backlog` — FLLWUP-101 amended to the person-facing subset of
EV-82's thirteen predictions with a cold-read instrument that cannot be self-graded and
that `FLLWUP-68` can reuse; FLLWUP-102 amended so its goal is startable today — the
render must stop asserting a cause the transport cannot establish — with the
class-plus-mapping coupling kept as a named trigger rather than the card's precondition.
The composition-site answer (EV-82 built `runFollowupReview`; `FLLWUP-96`'s premise holds
as one function, up to two callers) is ACCEPTED as recorded and needs no card.**

Ids `FLLWUP-101`/`FLLWUP-102` are free: `council/cards/` scans to `FLLWUP-100` as highest
and no file exists at either id (allocation re-checked at fetched HEAD when written —
`[[card-id-allocation]]`).

---

## 0. What I verified myself, and the two facts the packet did not carry

I re-derived the load-bearing claims rather than trusting the summaries, per the
`FLLWUP-58` §1 habit the EV-81 ruling established for this seat.

**Byte order as shipped** — `extensions/followup-render.ts:93-95`: the render composes
`decisionLine(record)` + ` — ${title}${target ? ` → ${target}` : ""} (${qualifier})`, so
the shipped line is `Mode: <disposition> — <basis> — <title>[ → <target>]
(<advisory|active>)`. Both drafts quote it correctly (append-order, per the designer's
round-3 Option-2 settlement). Neither draft states the consequence I rely on below: **the
disposition's basis is model-authored prose, and it now sits between the disposition and
the candidate's name.**

**Fact 1 the packet did not carry — the `http-404` arm throws away the one reason it
has.** `extensions/gate-run.ts:115-126` shows the taxonomy is
`no-api-key | timeout | network | http-<status> | http-400-refusal | invalid-response |
internal-error`, with `class: refusal ? "http-400-refusal" : \`http-${res.status}\``.
There is **no dedicated 404 class** — `http-404` is string formatting, and it fires for a
404 from any cause: a wrong base URL, a retired alpha path, a renamed model id.
`extensions/followup-render.ts:133-136` maps that formatted status to the bare literal
`model-card coming-soon`, and `test/ev82-followup-render.test.ts:169-173` proves what the
human loses: the record's basis is `gate call failed: HTTP 404: page gone` and the render
returns `["model-card coming-soon"]` — the reason the transport actually recorded is
discarded in favour of an inference about a third party's webpage. So this is not a
copy-style question about whether `coming-soon` reads well; it is a surface that
**substitutes an unverifiable claim for a fact it already has**, at the moment a person is
deciding whether to trust a decision that did not run.

**Fact 2 the packet did not carry — the precedent for where a semantic claim about an
HTTP status belongs is already shipped, and the heuristic goes against it.**
`http-400-refusal` is exactly "a dedicated failure class naming why this status is
meaningful," created as classification sugar *inside the transport*
(`gate-run.ts:122-124`), not in a renderer. That is the shape the draft's "dedicated
failure class" half points at, and it means the future work has a home with a working
example beside it — the card is not speculative about *where* the fix lives, only about
*when* the signal arrives.

**And the "when" is not far off, in the one repo that will actually render it.**
`.council.json` runs `gate.mode: active` here (EV-81 ruling, Fact 2), so this repo — not a
consumer — is where a 404 reaches a person; `FLLWUP-100` is the live finding that the
decision endpoint's responses have never been usable (8/8); and `EV-84` (Backlog) is a
card whose third arm is "with the endpoint unreachable," i.e. the falsifier that will
drive an unavailable-state cell against a real run. A card that waits for Jev's webpage
to change is a card that will be overtaken by its own epic.

---

## 1. Item 1 — CONFIRMED as `FLLWUP-101`, `epic: EPIC-10`, narrowed to the predictions only a cold read can settle, and given an instrument that cannot grade itself

**Ruling: card it, with the goal rewritten around the person-facing subset (P1, P2, P3,
P5, P7, P9) and the mechanical predictions excluded by name, and with the falsifier's
honesty conditions written into the acceptance.**

**Why it is a card and not a decline.** `council/procedures/council.md` §13 does not leave
this to taste: "This includes any `designer` finding the run surfaced but did not fold
in, **and any CDP-smoke prediction it filed that no one ran**." The provenance is verified
in the procedure text, and the step-9 skeptic's own record is the other half of the
grounding: it verified per-cell *bytes* ("each line names title, disposition,
consequence, qualifier, basis from its bytes alone") — a claim about the presence of
constituents, which is precisely the test that cannot answer whether a reader can tell
which noun is the candidate and which is the merge target. `FLLWUP-68` names the failure
mode this card exists to prevent: predictions must not "silently decay into 'settled
because nobody contradicted them'."

**Why the subset, and not the draft's four.** The draft names four predictions; EV-82's
designer filed thirteen (P1–P10 carried through Option 2, P11–P14 added). Carding all
thirteen would re-run tests the skeptic already closed green — P4 (the presented-never-
written grep), P6 (double-colon), P8/P10 (arity), P11–P14 (D3, byte identity, formatter
uniqueness, separator count) are all mechanical and all verified at the pinned head.
Carding only the person-facing ones is the `FLLWUP-68` discipline, which excluded P7 *with
a stated reason*. The subset that survives as genuinely un-settled: P1 (on the shipped
line, can a reader say which noun the merge goes *to*), P2 (does `(advisory)` vs `(active)`
tell the reader whether their own edit still governs), P3 (does a bare `off` above the
drafts read as "nothing was decided" rather than "this is broken"), P5 (does the title
after the basis still carry Drop's cost), P7 (does a `Merge` line with **no arrow** read
as "name the target" rather than "nothing to merge"), P9 (does a 200-char verbatim title,
no longer leading, still let a reader find their own candidate). P1 and P7 are the two
the append-order settlement *created* — the designer flagged exactly this and asked for it
to be "decided, not lost." That is the strongest form of the user-value claim: the design
left a comprehension question open on purpose and nobody has read the line cold.

**Why `epic: EPIC-10`.** The surface is EPIC-10's, shipped by EV-82 — the board files a
residual under the epic whose code it touches (`FLLWUP-71`/`75`/`77` → EPIC-13,
`FLLWUP-81`…`95` → EPIC-14, and `FLLWUP-99`/`100` re-routed to EPIC-13 for exactly this
reason). `FLLWUP-68`, the sibling of this class, carries the epic whose surface it reads.

**Why it is not `FLLWUP-68`'s fold-in, and what it owes that card.** `FLLWUP-68`'s goal is
written against the `/council-update` refresh surface; a step-13 read is not needed to
honestly meet it, so the fold-in test keeps them apart (`[[engineering-board]]`, from
`2026-09-21-po-ev73-step6-ruling`). But two live Backlog cards now demand the same
instrument — structurally cold reader, captured verbatim output, stated thresholds — and
minting it twice is the duplication this epic exists to remove. So the card carries an
obligation, not a wish: **build the falsifier in the shape `FLLWUP-68` can consume, and if
`FLLWUP-68` lands first, its harness is the host.** That is a card-level constraint on the
*what*; whether the harness is a test file, a scratch-run arm, or a dispatched headless
session is the implementing owner's `how`.

**The honesty conditions, which the draft does not carry.** An LLM asked "do these bytes
read clearly?" will usually say yes, and the seat that could answer most truthfully is the
one that wrote them. The instrument is worth nothing unless coldness is structural:

1. The reader gets the captured literals and a question — **not** `council/cards/EV-82.md`,
   not the deliberation record, not the design spec, not the wiki page naming the
   literals, and not the designer.
2. The capture is taken from the renderer at the card's own promotion head, **not copied
   out of EV-82's record** — the card's quoted examples are the design talking about
   itself, and `[[presented-never-written]]` is exactly the discipline that keeps the two
   from being confused.
3. The predictions and their pass thresholds are fixed **before** the read (they are
   already fixed, in EV-82's face and this ruling's list — the card must not restate them
   more softly).
4. The answers are recorded verbatim as an artifact; a summary is not the evidence.
5. Any new live arm states its expected wall clock and its ceiling in its header and stays
   gated off the default suite (`[[test-suite-budget]]` rule 1 and the gated-site
   discipline; `[[headless-pi]]` if the read is driven through `pi -p`).
6. A failed prediction lands a **copy** fix, and the byte tests pinning the failed literal
   are **re-expressed, never deleted** — the EV-81 ruling's golden obligation and
   `FLLWUP-68`'s "copy fix, not mechanism change." Without clause 6 the falsifier would
   delete the evidence of its own finding.

**Sequencing, as an obligation on the face rather than a gate.** Promote after `EV-83`
lands if it can be managed, so one read covers the whole literal family — step 13's lines
and the runner's `ESCALATION` copy, which are the same words arriving in two places. This
is an efficiency condition, not a dependency: the card must not be written so it cannot
run before EPIC-10 closes, because the earlier a wrong literal is caught the cheaper the
fix.

---

## 2. Item 2 — CONFIRMED as `FLLWUP-102`, `epic: EPIC-10`, re-grounded: the card's precondition cannot be the trigger

**Ruling: card it, but move the contingent half out of the goal and into the acceptance as
a coupling rule. The goal is the defect that exists now — a literal asserting a cause the
transport cannot establish, while discarding the reason it has. "When Jev's model-card
page gains a real availability signal" stays the named trigger for the taxonomy half and
is no longer what makes the card startable.**

**Why the draft as written would be a dead card.** Its goal opens with a conditional on an
external party's webpage: *"when Jev's model-card page gains a real availability signal,
…"*. Nothing in `vault/wiki/`, `council/`, or the code establishes that such a signal is
coming or when. A card that cannot be started cannot be judged, and if promoted it
consumes a dispatch on the question "has the vendor's page changed yet?" — which is not a
mechanism and not a user value. I considered the alternative the EV-79 ruling used for a
contingent residual ("re-card trigger, named rather than carded now", Item 2) and rejected
it for this draft, for the reason in §0 Fact 1: the card as amended has real work in
front of the trigger, and the trigger's whole purpose is to keep that work from being
undone by the card that eventually lands the class.

**Why the doable-now half is a user-value defect, not a copy nit.** Per §0 Fact 1, the
arm drops a recorded reason to print an inference. The reader who gets it is the one who
*enabled* the gate — the most invested reader in the product — and what they are told is
"the model's page says coming soon," i.e. external, not your fault, and permanent. If the
404 is instead a wrong base URL or a retired alpha path, the advice they act on is wrong,
and the honest one (`gate call failed: HTTP 404: …`, an arm the renderer already owns) is
what was thrown away. The epic's posture is not at risk here and I am not touching it:
EPIC-10's Intent says availability is a real state the design carries, and R8 (this seat's
recut ruling) ruled the four states are one line at one moment with one formatter and
`FLLWUP-75`'s discipline. Every one of those survives a corrected fourth literal — R8
ruled the *set has an owner and a shape*, and explicitly left grammar and bytes to EV-82.
What does **not** survive my amendment is R8's *count*, read as four named literals;
that enumeration named the literal my own ruling was describing when the heuristic was
still a proposal. Correcting a referent this seat installed is the EV-67 J1 / EV-81 §3
ground, not an overturn — and no human decision is touched.

**Why not folded into `EV-84`, and why not merged with `FLLWUP-100`.** `EV-84` is a
falsifier card: R7's reasoning in the recut ruling was "a falsifier must assert a format,
not own it — that inverts the dependency." Making EV-84 carry a copy/transport fix would
let the test file define the convention. `FLLWUP-100` is about *usable answers arriving*
(shaping, parsing, probabilities); this is about *what the surface claims when nothing
arrived* — different files, different question, and EV-81's merge rule (near-duplicates
merge on shared sites; these share none) keeps them apart. They should be *sequenced*
beside each other, since both are about the gap between what the endpoint does and what
the surface says about it.

**Obligations to carry onto the card** (the implementing owner authors the prose and owns
the `how`):

1. The two verified facts, with sites: `gate-run.ts:115-126` (the taxonomy formats
   `http-${status}`; no dedicated 404 class; `http-400-refusal` is the shipped precedent
   for a semantic sub-class *in the transport*), and `followup-render.ts:133-136` with
   `test/ev82-followup-render.test.ts:169-173` (the record's reason exists and is
   discarded).
2. The goal is satisfiable **without** any external change. No acceptance clause may
   depend on the model-card page gaining a signal; that is the trigger for the coupling
   clause, not a precondition for this card.
3. Whatever replaces the literal keeps EV-82's pinned shape: one literal line per
   unavailable state, replaced not appended, zero lines when the gate resolves, no
   deliberation/failure/verdict wording beyond the literals, and the D4 aggregation rules
   intact. The affected tests are **re-expressed, never deleted**, and the module stays the
   single `Mode:`-free formatter owner (`gate-ledger.ts` untouched).
4. The stale prose moves in the same diff: `followup-render.ts`'s module header (lines
   34-41) currently promises the future card in prose, and the test header at
   `test/ev82-followup-render.test.ts:19-22` names the cell. Both sit beside live code and
   both become false the moment the mapping changes.
5. The interaction with `EV-84` is named: EV-84's unreachable-endpoint arm is the first
   falsifier to drive an unavailable-state cell against a real run, so whichever of the two
   lands second must re-check the other's assumption about what the human is shown.
6. If the honest fix turns out to need a shared-transport taxonomy change — the
   `http-400-refusal` shape, i.e. the class genuinely named for the cause — that edit is
   **this** card's, not a new card's: it is the card that owns the question, and the
   coupling rule (class + mapping in one diff) is why the seam was reserved here rather
   than edited twice.

---

## 3. The composition-site flag — ACCEPTED as recorded; no card

The runner's answer is consistent with the record I read: `runFollowupReview` in
`extensions/followup-tool.ts` is the composition (`loadGatePolicy` → off short-circuit →
both followup loaders → `buildFollowupState` → `runFollowupGate`), settled in EV-82's
round-2 dispute 5 and step-5 consolidator item (1), and it is the site `FLLWUP-96`'s face
— corrected by the EV-81 ruling, Item 3 — has been waiting for. `FLLWUP-96`'s followup
half is unblocked by EV-82's landing, its "one site that legitimately holds both" premise
holds as one function with up to two callers, and `FLLWUP-96`'s own face already carries
the conditional: **if EV-83 forks its own composition, the two-site premise becomes real
and belongs to `FLLWUP-96`'s promotion.** That is a promotion-time design question for a
card that names it, so nothing here is re-carded and no card-face edit is owed. Ratified
as-is.

The other two "noted, no card" items are also ratified: the card-writing enforcement gap
stays `FLLWUP-69`'s class (live, `Backlog`, `epic: EPIC-9`, named on EV-82's own
acceptance), and the two-site premise belongs to `FLLWUP-96` per the paragraph above.

---

## Options rejected

- **`FLLWUP-101` → drop, on "the skeptic already verified the rendered surface."** The
  skeptic verified constituents' *presence*; that is the test that structurally cannot
  settle which noun a reader takes as the merge target. Council.md §13 names un-run smoke
  predictions as step-13 material, and `FLLWUP-68` names the decay this prevents.
- **`FLLWUP-101` → card all thirteen predictions as drafted-enumerated.** Re-runs
  mechanical tests closed green at the pinned head; `FLLWUP-68`'s precedent is to exclude
  with a stated reason.
- **`FLLWUP-101` → fold into `FLLWUP-68`.** `FLLWUP-68`'s goal is written against the
  `/council-update` refresh surface; a step-13 read is not needed to honestly meet it. The
  instrument is shared by obligation, the goal is not by edit.
- **`FLLWUP-101` → fold into `EV-84`.** EV-84's goal is a wiring falsifier that
  disclaims judgment-quality evidence; a person-facing read is not needed to meet it, and
  R7's rule — a falsifier asserts a format, it does not own one — bars it.
- **`FLLWUP-102` → drop, carding nothing, with a re-card trigger named.** Rejected on §0
  Fact 1: unlike EV-79's `sideProbability` residual, this one has a defect observable now
  (a shipped, test-pinned render that discards a recorded reason for an unestablished
  claim), in the repo that runs `active`, on a path EV-84 will drive.
- **`FLLWUP-102` → confirm as drafted.** Its goal's opening conditional makes the card
  unstartable and its own judge unrunnable until an external party acts; that is a
  placeholder, not a plan.
- **`FLLWUP-102` → merge into `FLLWUP-100`.** Different files and different questions
  (answers that arrive unusably vs what the surface claims when none arrived); EV-81's
  merge rule fires on shared sites and these share none. Sequenced, not merged.
- **`FLLWUP-102` → order the remedy as "demote `http-404` to the generic
  `gate call failed:` arm."** That is a defensible `how` and I am not picking it; the
  ruling fixes the constraint — the surface must not assert a cause the transport cannot
  establish — and leaves the choice among demotion, a qualified literal, or an immediate
  dedicated class to the implementing owner.
- **Either draft → `epic: EPIC-13`.** EPIC-13's claim is on the shared transport and the
  card gate; both drafts' load-bearing sites (`followup-render.ts`, the step-13 surface)
  are EV-82's EPIC-10 code. `FLLWUP-102`'s obligation 6 lets it reach the taxonomy without
  re-tagging the question it owns.
- **`FLLWUP-101`/`102` → `Ready` now.** Both `Backlog`; promotion belongs to a later
  decomposition and is ratified, not executed, here (`[[chain-promotion]]`, and the
  EV-81 ruling's posture on its two items).
- **Escalating either item to `steward`.** No card is declined, no residual is made
  permanent, no live card's goal moves, and no recorded human decision is touched — §2's
  boundary check is against this seat's own R8 enumeration, which is mine to correct.

## Grounding

- Procedure: `council/procedures/council.md` §13 (the draft-then-confirm gate; "any
  CDP-smoke prediction it filed that no one ran" as step-13 material; the unconditional
  dedup pass; the four unavailable-state literals' shape).
- Cards: `council/cards/EV-82.md` (designer rounds 1–3 and the Option-2 settlement,
  skeptic step-4 O1–O6, step-5 consolidator's 20 settled items, step-9's cold read of
  bytes only, step-12's composition-site answer, step-13's two drafts), `FLLWUP-96`
  (face as corrected by the EV-81 ruling), `FLLWUP-68` (the sibling card class and its
  goal/falsifier/exclusion shape), `FLLWUP-69`, `FLLWUP-100`, `FLLWUP-99`, `EV-83`,
  `EV-84`, `EPIC-10`, `council/board.md`.
- Prior rulings: `vault/raw/2026-09-22-po-ev81-step13-confirmation.md` (re-verify the
  packet; golden re-expressed never deleted; stale binding prose moves in the same diff;
  residuals file under the epic whose code they touch; correcting this seat's own
  referent), `2026-09-21-po-ev79-step13-followup-confirmation.md` (re-card trigger vs
  card; scope widening at the confirm gate), `2026-09-21-po-epic10-recut-ruling.md` (R4
  fail-safe to the human, R7 a falsifier does not own a format, **R8 the four
  unavailable states ride EV-82 with one formatter**, R9 `off` is the packaged default),
  `2026-09-21-po-ev73-step6-ruling.md` (the fold-in test), `2026-09-20-po-fllwup58-step13-confirmation.md`,
  `2026-09-19-po-fllwup59-step13-ruling.md` (drop/over-engineering test).
- Wiki: `[[engineering-board]]`, `[[followup-merge-and-auto-ingest]]`,
  `[[smoke-test]]`, `[[product-owner]]`, `[[card-id-allocation]]`,
  `[[test-suite-budget]]`, `[[headless-pi]]`, `[[presented-never-written]]`,
  `[[chain-promotion]]`, `[[metered-deliberation-routing]]`.
- Code/tests read at this ruling: `extensions/followup-render.ts` (:31-48, :86-95,
  :125-141), `extensions/gate-run.ts` (:110-130, :468-479), `extensions/gate-ledger.ts`
  (:228-246), `test/ev82-followup-render.test.ts` (:19-22, :169-173, :227-230),
  `.council.json` (`gate.mode: active`).

## Reversibility

- **`FLLWUP-101`** is a Backlog card with no shipped delta until someone promotes it. If
  the ruling is wrong — the bytes are in fact obvious to a cold reader — the card's own
  falsifier says so and it closes with a record and zero code changes. If I over-narrowed
  the subset, the excluded mechanical predictions are already green at a pinned head and
  can be re-read cheaply. Cost of being wrong: one dispatched read.
- **`FLLWUP-102`**'s doable-now half is one literal and its mapping in a pure leaf
  renderer, plus a re-expressed test cell; `gate-ledger.ts`, `gate-run.ts` and the
  taxonomy need not move, and the fail-safe direction (fall to the human's review) is
  untouched by construction. If the demotion I have implicitly favoured turns out to be
  worse than a qualified literal, the copy fix is another small diff, and `FLLWUP-101`'s
  instrument is the thing that would tell us. If the availability signal never comes, the
  card has still been worth shipping, because the claim it corrects is live today.
- **Ratifying the composition-site answer** costs nothing to undo: it is a fact about
  shipped code, and the conditional it depends on (an EV-83 fork) is already written on
  `FLLWUP-96`'s face where a promoter will read it.
- Nothing here declines a card, converts a temporary residual into a permanent one, amends
  a live card's goal, or overturns a recorded human decision — so nothing reaches
  `steward`.
