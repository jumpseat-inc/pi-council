---
slug: po-ev81-step13-confirmation
card: EV-81
epic: EPIC-10
seat: product-owner
step: 13
date: 2026-09-22
kind: ruling
---

# EV-81 — product-owner step-13 confirmation (two drafts confirmed-and-rerouted; one card-face correction ordered)

**Subject.** The `council-runner` that executed **EV-81** (state `Done`, merged
`690127bf0d3450e44800bcccd73e011d4184a696`, PR #100) held two step-13 drafts and one
card-face correction per the pre-write draft-then-confirm gate
(`council/procedures/council.md` §13; `[[engineering-board]]`; `FLLWUP-69`'s pinning).
In this autonomous `/features-deliver` run over EPIC-10 the human's confirmation act is
re-homed to this seat — same authority shape as
`vault/raw/2026-09-21-po-ev79-step13-followup-confirmation.md`,
`vault/raw/2026-09-20-po-fllwup58-step13-confirmation.md` and
`vault/raw/2026-09-19-po-fllwup59-step13-ruling.md` (confirm, amend, or drop each
draft before anything is written).

**Disposition in one line: both drafts are CONFIRMED as cards, `FLLWUP-99` and
`FLLWUP-100`, each re-routed to `epic: EPIC-13` and each carrying obligations the
drafts did not have (a shipped golden that pins the wrong value; a fourth cause
hypothesis and a proof that cannot be satisfied by a fabricated record); and
`FLLWUP-96`'s face IS corrected — option (a) — because its blocker sentence now points
at a card that is `Done` and shipped no such site, and card prose is binding.**

Ids `FLLWUP-99`/`FLLWUP-100` are free: the board's highest is `FLLWUP-98` and no file
exists at either id in `council/cards/`. Both are legal under `validate.py`'s
`ID_RE` (`[[card-id-allocation]]`; allocation is re-checked at fetched HEAD when the
cards are actually written).

---

## 0. Facts I verified myself, and the three the packet did not carry

I re-derived every leg rather than trusting the summary, because this ruling's whole
family of precedents (`FLLWUP-58` §1) is about the packet's arithmetic being wrong in
the direction that matters.

**Item 1's four legs — all four confirmed at the current `main`:**

- Writer: `extensions/gate-run.ts:202` and `:272` — both `runGate` arms write
  `policyVersion: policy.policyVersion`.
- Data: `council/gate/policy.json` → `"gate-policy-1"`; `council/gate/decision.json` →
  `"gate-decision-1"`. Different strings, both packaged.
- Reader: `extensions/gate-route.ts:219` — `record.policyVersion !== decisionPolicy.version`
  → `policyDrift` → the line is dropped from `valid` → §5 fallback routes full.
- Live: all **8** lines of `.pi/council/gate-ledger.jsonl` carry
  `"policyVersion":"gate-policy-1"`, `"resolvedMode":"Deliberate"`, every answer `null`.
- Blind spot: `test/gate-route.test.ts:142` — `appendRecorded` defaults
  `policyVersion` to `decisionPolicy.version`, i.e. the suite hand-writes the line the
  writer would never write.

**Fact 1 the packet did not carry — the fix reds a shipped golden, and that golden is
the bug's bodyguard.** `test/gate-run.test.ts:185` asserts
`expect(parsed.policyVersion).toBe("test-policy-1")` against a line written by the real
`runGate` from a `POLICY` whose tuning version is `"test-policy-1"`
(`test/gate-run.test.ts:40`). So the suite does not merely *miss* the defect at
`gate-route.test.ts:142` — it *pins* it at `gate-run.test.ts:185`. The card must
re-express that assertion against the decision policy's version, read through the
loader, and may not delete it. (Unaffected, and checked: the `"gate-policy-1"` literal
at `test/gate-run.test.ts:562` is a hand-written **v1** coexistence fixture, not an
assertion about `runGate`'s output; `test/gate-run-live.test.ts:31` passes a
`tuning`-shaped `GatePolicy` literal but asserts nothing about the version field.)

**Fact 2 the packet did not carry — this repo runs the gate in `active` mode.**
`.council.json:44-46` is `{"gate": {"mode": "active"}}`. Under `active` the recorded
mode is *enforced* (`[[metered-deliberation-routing]]`), so the inert fast path is not
a latent curiosity on a disabled feature: every card in every run of this repo pays for
a gate call whose verdict the router then throws away as drift. Consumer repos ship
`off` by default (EPIC-13 R3), so the exposure is dogfood-side — which is exactly where
this repo has always looked for its defects.

**Fact 3 the packet did not carry — the failure arm destroys the evidence item 2 needs
to diagnose itself.** `extensions/gate-run.ts:200` writes `answers: {}` on the
`failRun` arm, and `appendGateCall` fills every asked id with `null`. So when `decide()`
throws `invalid-response`, the committed ledger keeps only the thrown *message* —
never the payload that provoked it. The all-null answers in the live lines are the
failure arm's own rendering, **not** observation of what the model returned. The 8/8
diagnosis therefore cannot be made from the record; it needs a capture. Item 2's goal
must confront that.

**And a narrowing that already exists in the suite, unnamed in the packet.**
`test/gate-run-live.test.ts:96-98` — the gated pole-semantics arm — gets a *usable
probability* back from the pinned model for a single-question noul set
(`version: "qs-pole-probe"`). So "the endpoint never returns probabilities" is already
falsified by a shipped arm. What differs between the working probe and the 8 failing
live lines is the **packaged four-question set** and the multi-question response. That
is where `FLLWUP-100` starts, not at zero.

---

## 1. Item 1 — CONFIRMED as `FLLWUP-99`, `epic: EPIC-13` (amended from the draft's EPIC-10)

**Ruling: card it, as drafted in substance, under `epic: EPIC-13` rather than EPIC-10,
with the four obligations below carried onto the card.**

The fold-in test keeps it out of EV-81 and this seat already applied it there
(`[[engineering-board]]`, from `2026-09-21-po-ev73-step6-ruling`): EV-81's goal names
the followup transport and its fail-closed posture, not the card gate's writer, and
EV-81's own arms write the corrective value. Fixing `runGate` inside EV-81 would have
put a card-gate behavior change behind a followup card's judge — the "vacuous pass on
code it did not write" shape. Both seats and the skeptic converged on the same reading,
and EV-81 is now `Done`, so the question is only what the residual's home is.

**Why it is a card and not a parked observation.** The draft's honest framing —
"outcome-harmless today, safe direction" — is true of the *outcome* and false of the
*mechanism*. Two shipped mechanisms are dead in production and no existing card owns
reviving either: `resolveRoute`'s recorded-decision match (EV-69's fast path) and, one
layer out, the dispatch-time re-check ratchet, which fires *only* when
`route.source === "recorded"` on a reduced mode. A gate whose verdict is discarded as
drift can never produce either. Under `active` (Fact 2) that means EPIC-13's central
claim — deliberation as a metered, routed resource — is currently a per-card tax with a
fixed answer. The user value of the card is not "less drift noise"; it is that the
feature the repo shipped and dogfoods either works or is known not to.

**Why EPIC-13 and not EPIC-10.** The defective writer is `runGate`, shipped by EV-61 /
EV-65 / EV-69 in EPIC-13; EPIC-10 is follow-up merging and autonomous ingest
(`[[followup-merge-and-auto-ingest]]`) and has no claim on it. Board precedent is
unbroken and same-shaped: gate residuals were filed under the *Done* epic whose code
they touch — `FLLWUP-71`/`75`/`77` carry `epic: EPIC-13`, `FLLWUP-81`…`FLLWUP-95` carry
`epic: EPIC-14` — and EPIC-9's two residual runs are the promotion vehicle for exactly
this population. Attaching `FLLWUP-99` to EPIC-10 would bind its cadence to an unrelated
chain and mis-attribute the defect in the place future readers look.

**Obligations to carry onto the card** (the implementing owner authors the prose and
settles the how):

1. **The four verified legs**, with the two file:line pairs that pin the writer
   (`gate-run.ts:202`, `:272`) and the one that reads it (`gate-route.ts:219`).
2. **Blast radius, stated twice because both halves are load-bearing.** (a) Routing:
   existing mismatched lines keep routing full — the safe direction — and only newly
   written lines regain the fast path; no migration, no ledger rewrite. (b) Tests: the
   fix reds `test/gate-run.test.ts:185`, which pins the buggy value; the card re-expresses
   that golden against the decision policy's version via the loader, never by deletion.
3. **The proof must generate its own data.** The falsifier calls `runGate` (injected
   transport, response body shaped the way `parseDecisionsResponse` accepts), then runs
   the real `resolveRoute` over the resulting ledger file and asserts
   `source: "recorded"`. Injecting the *transport* is legitimate; hand-writing the
   *record* is the `gate-route.test.ts:142` blind spot that hid this defect for two
   epics, and a card that re-uses that shape has not closed the class.
4. **The stale prose moves in the same diff.** `gate-run.ts`'s EV-81 section header
   says the shipped `runGate` writer "is the buggy side" and that the followup arms are
   a "DELIBERATE DIVERGENCE" from it. Once the writer converges, that comment is false
   about the code it sits beside. EV-81 set the precedent for this discipline in its own
   diff by amending `gate-transport.ts`'s single-consumer header claim.
5. **Name what the field means now, and confirm nothing read the old way.** After the
   fix, the line's `policyVersion` carries the *decision* policy's version, while
   `council/gate/registrations.jsonl` is keyed on *policy.json's* `policyVersion`
   (`council/validate.py:169-207`, EV-72's pre-registration). I verified the join is
   file→file and never touches the ledger, so EV-72 is not broken; but the ledger and
   the registrations stop sharing a value, and a maintainer tracing "which policy
   version produced this line" now reads a different version than the registration
   names. The card must state that on its record. **Adding a second version field to
   the ledger is not a fold-in** — the goal is met without it — and would need its own
   card.

**Promotion posture.** `Backlog`, not this run's delivery scope; promotion belongs to
the next decomposition, ratified by this confirmation and not executed by it
(`[[chain-promotion]]`, and the same posture taken in `2026-09-20-po-fllwup58-step13-confirmation` §5.7).

---

## 2. Item 2 — CONFIRMED as `FLLWUP-100`, `epic: EPIC-13`, with the cause list widened and the proof tightened

**Ruling: card it — do not park it as an observation — under `epic: EPIC-13` as
drafted, with two amendments: the diagnosis must include the response-contract
hypothesis, and its proof must be a gated live arm that a fabricated record cannot
satisfy.**

Why a card rather than a recorded note: the owner's flag and the skeptic's O5 together
establish that the shipped gate has **never once** returned an answer the decision
function could use — 8 of 8, across every live call this repo has made. That is not a
quality nit beside the mechanism; it is the mechanism's input being permanently absent.
`FLLWUP-99` alone cannot make the metering work: after its fix the lines re-derive
faithfully, and every one of them still says `Deliberate`. The two cards are the pair
that decides whether EPIC-13's routing is a mechanism or a tax. Sequence them:
`FLLWUP-99` first (mechanical, bounded), `FLLWUP-100` second (a diagnosis that may
reframe what a remedy is).

**Amendment A — the drafted cause list omits the one cause with a shipped-code
home.** The draft names "wire shaping, question instructions, or model behavior" — all
three are request-side or model-side. None is `parseDecisionsResponse`, which validates
`model` and that `answers` is an object and then passes the per-question payloads
**verbatim** (`extensions/gate-transport.ts:185-215`; there is no probability extraction
at the parse site at all, which is why the O7 probe found the parser "domain-neutral").
If the decisions body carries a probability at a location or under a key name the
verbatim pass-through does not surface, `decide()` receives an answer object with no
usable probability and throws — and the symptom is *indistinguishable* from "the model
didn't give us one". That is a candidate shipped defect, not model behavior, and it is
the cheapest hypothesis to kill. The goal must not be written so that it can be closed
without looking at it.

**Amendment B — the proof cannot be a fixture of answers.** "A test showing a
live-shaped call can produce a reduced mode when the evidence supports it" is, as
drafted, satisfiable by writing an answers record with probabilities in it — which is
precisely the record-fabrication blind spot this ruling is correcting in Item 1. The
obligation: the load-bearing claim is proven by the **gated live arm**
(`COUNCIL_INTEGRATION=1`, `test/gate-run-live.test.ts` — the pattern and the gate
already exist) issuing the real packaged four-question set and producing a line that
`resolveRoute` reads back as a reduced mode with `source: "recorded"`. Offline arms may
inject a response *body*; they may not stand alone as the evidence that the model can
answer. The default suite stays offline and gains no new live arm
(`[[test-suite-budget]]`, FLLWUP-49 O10).

**Amendment C — the card owns the evidence problem, not just the cause.** Per Fact 3,
the ledger's failure arm records `answers: {}`, so the record cannot show what arrived.
The card must capture a real response body as part of the diagnosis. If the honest
remedy turns out to require *persisting* the offending payload on the failure line,
that is a ledger-schema change — a new card, not a fold-in here.

**Boundary kept, and one outcome named in advance.** The constraint the packet already
carries is binding and non-negotiable: the fail-closed posture stays byte-identical,
and no remedy may lower scrutiny (`[[metered-deliberation-routing]]`'s asymmetry —
skipping deliberation is the dangerous error, deliberating unnecessarily is only
expensive). I deliberately did **not** soften the goal into "diagnose and report": the
EPIC-13/EV-29 lesson (`[[product-owner]]`, `2026-09-20-po-ev67-step6-ruling` J3) is that
a goal written so it cannot fail is the defect. If the diagnosis concludes that the
pin simply cannot answer this question set with usable probabilities, then no remedy
exists inside the card, the judge's honest verdict is that the goal is unmet, and the
card ends in a named human decision about the question set — which is a correct
outcome, not a failure of this ruling.

---

## 3. Item 3 — RULED: option (a), correct `FLLWUP-96`'s face; option (b) rejected

**Ruling: edit `council/cards/FLLWUP-96.md`'s `## Intent` "Naming:" paragraph — the
blocker is re-pointed from EV-81 to the EV-82/EV-83 call site, and the one-site
premise is recorded on the face as a promotion-time question. The `title`, `goal`,
`state`, and `epic` are untouched, so no `council/board.md` line changes
(`validate.py:205` matches `- <ID> — <Title>` only) and no immutable surface moves.**

Exact replacement for that paragraph:

> **Naming (corrected by the EV-81 step-13 ruling,
> `vault/raw/2026-09-22-po-ev81-step13-confirmation.md`):** EV-81 shipped **no**
> composition site. `runFollowupGate` mirrors `runGate`'s "loads nothing itself"
> posture and receives caller-loaded `questions` and `decisionPolicy`
> (`extensions/gate-run.ts`'s EV-81 section header). The followup half is therefore
> blocked on **the EV-82/EV-83 call site** — whichever of those cards builds the
> engine-side composition that loads both `council/gate/followup/questions.json` and
> `decision.json` and reaches `buildFollowupState`; if neither builds it, this half is
> blocked on a card that does not exist yet and the gap comes back as its own card.
> The card-gate half is buildable the day this card is promoted (`runGate` composes
> today). Sequence accordingly. **Premise to re-examine at promotion:** the Intent's
> "one site that legitimately holds both" is an assumption, not a fact — if EV-82 and
> EV-83 each compose the pair, two call sites sharing one check is the design question
> and it belongs to this card's promotion, not to its implementation.

**Why (a) over (b) — three grounds, in order of weight.**

1. **The sentence is binding prose, not a comment.** `[[engineering-board]]` and
   `2026-09-16-po-ev37-merge-gate-defect` establish that a card's `Intent` binds what it
   names; EV-81's own round-2 record amended the *shipped* `gate-transport.ts` header
   claim for exactly this reason, on the ground that a stale claim beside live code is a
   second, contradicting instruction. Option (b) is the one asymmetry that survives
   from that precedent: EV-81's false sentence was in code this run was touching;
   FLLWUP-96's is in the only file its implementer will read first.
2. **The reader who needs the correction cannot reach it where (b) would leave it.**
   Under (b) the truth lives in `council/cards/EV-81.md` — a 540-line `Done`-column
   record, whose relevant sentences are in a round-2 subsection and a consolidator
   residual list. The board is this repo's source of truth for what is being built and
   why anything is waiting (`[[engineering-board]]`: "everything the Council does starts
   and records there"). Pointing a future implementer at a Done card's deliberation log
   to learn that their card's stated blocker shipped nothing is not a record, it is a
   scavenger hunt.
3. **The false sentence is a sequencing instruction, and sequencing is what a
   promotion decision consumes.** "Blocked on EV-81, which creates that composition
   site" now reads as a blocker that cleared while creating nothing. A promoter deciding
   whether the followup half is buildable today gets either a wait-forever signal or,
   likelier, a green light to build against a site that does not exist — and discovers
   it mid-dispatch, which is the class EV-84's end-to-end falsifier exists to catch.

**Why this is this seat's act and not an escalation.** The line being corrected was
written by this seat in the EV-79 step-13 confirmation
(`vault/raw/2026-09-21-po-ev79-step13-followup-confirmation.md`, Item 1, Intent bullet
4). Correcting a referent my own prior ruling installed is not overturning a human
decision — the identical ground as EV-67 J1's authority section ("the drift is this
seat's own doing"). No goal changes, nothing is declined, no residual is made
permanent, and the card stays `Backlog`. `[[product-owner]]`'s escalation list is not
engaged.

### Flag carried out of this item, for EV-84's dispatch (not a ruling)

The corrected blocker names "the EV-82/EV-83 tool layer," and I could not find that
layer in the two cards' goals as written: EV-82's goal is `council.md` step-13 record +
render; EV-83's is `features-deliver.md` Phase 3 + `council-runner.md` routing. Both
carry fixtures over the module EV-81 shipped, and EV-81 ships a module with **no
caller** — it deliberately left composition to whoever loads the two files. So as the
board stands, no promoted-or-Backlog card obviously builds the engine-side call site.
That may resolve cleanly inside EV-82's or EV-83's deliberation (an owner reading this
flag will find it fast), and it is not my call to add scope by fiat. **If EV-84's
falsifier reaches a step 13 with no such site to exercise, the missing card is a
portfolio matter — EPIC-10's decomposition, not EV-84's diff — and belongs to
`steward`, not to this gate.** Recording the check now, at the step where the next seat
will look for it, is the cheapest form of the correction; the face edit above already
carries the same conditional.

---

## Options rejected

- **Item 1 → EPIC-10 (the draft's choice)** — the writer is EPIC-13's; the board already
  files gate residuals under the Done epic whose code they touch
  (`FLLWUP-71`/`75`/`77`), and EPIC-10's chain would carry an unrelated defect's
  cadence.
- **Item 1 → fold into EV-81 (reopened)** — EV-81 is `Done`, its own arms write the
  corrective value, and the fold-in test excludes a card-gate behavior change from a
  followup-transport card's goal.
- **Item 1 → fix the reader instead of the writer** (make `resolveRoute` compare against
  the tuning version) — rejected by the converged grounds both seats and the skeptic
  probe carried: a recorded decision is a function of (answers, decision policy), so
  the decision policy's version is the field's meaning. Which side moves is the
  implementing owner's `how`; the direction is settled and is not reopened here.
- **Item 1 → widen the ledger to carry both versions** — not needed to meet this goal;
  new card if a named consumer appears (EV-71's rule: a field needs a named consumer).
- **Item 2 → record as an observation, no card** — 8/8 with zero usable probabilities
  is the mechanism's input never arriving; parking it leaves EPIC-13's metering inert
  with no owner.
- **Item 2 → merge into `FLLWUP-99` as one "make the gate work" card** — different
  files (`gate-run.ts`'s writer vs the questions/transport/model boundary), different
  questions, and a mechanical hours-long fix would be chained behind an open-ended
  diagnosis whose outcome is unknown. `EV-44`'s merge-near-duplicates rule fires on
  shared sites; these share none.
- **Item 2 → soften the goal to "diagnose and report"** — a goal that cannot fail is
  the EV-29/EV-67-J3 defect class; a no-remedy finding should end in a named human
  decision instead.
- **Item 2 → leave the drafted goal's proof clause as written** — "live-shaped" was
  closeable by a fabricated answers record, which is the exact blind spot Item 1 is
  about.
- **Item 3 → option (b), face untouched** — leaves a binding, now-false sequencing
  instruction on the only file the card's implementer reads, with the correction filed
  where they would have to already know it exists to find it.
- **Item 3 → escalate to steward** — the sentence is this seat's own from the EV-79
  step-13 confirmation; nothing about FLLWUP-96's purpose, goal, scope, or state moves.

## Grounding

- Cards/records: `council/cards/EV-81.md` (round-2 `policyVersion` convergence, the
  step-13 residual list (a)/(c), the consolidator's R-1/R-2/R-3, step-4 O1/O4/O5/O7,
  step 12), `council/cards/FLLWUP-96.md` (the Intent paragraph under correction),
  `council/cards/{EV-82,EV-83,EV-84}.md`, `council/board.md`.
- Prior rulings: `vault/raw/2026-09-21-po-ev79-step13-followup-confirmation.md` (author
  of the sentence corrected in Item 3; the fold-in call on `sideProbability`),
  `vault/raw/2026-09-20-po-fllwup58-step13-confirmation.md` (the authority shape, the
  re-verify-the-packet habit, and the "reds the shipped tripwire" blast-radius call),
  `vault/raw/2026-09-19-po-fllwup59-step13-ruling.md` (the drop/over-engineering test
  I applied to Item 2 and why it fails), `vault/raw/2026-09-20-po-ev67-step6-ruling.md`
  (J1/J4 — stale binding prose is the ruling seat's to correct; J3 — do not soften a
  goal), `vault/raw/2026-09-21-po-ev73-step6-ruling.md` (the fold-in test),
  `vault/raw/2026-09-16-po-ev37-merge-gate-defect.md` (Intent binds the literal).
- Wiki: `[[engineering-board]]`, `[[metered-deliberation-routing]]`,
  `[[followup-merge-and-auto-ingest]]`, `[[product-owner]]`, `[[card-id-allocation]]`,
  `[[test-suite-budget]]`, `[[chain-promotion]]`.
- Code/data read at this ruling: `extensions/gate-run.ts` (:196-206, :264-274, the EV-81
  section header, :404-440, :460-475, :539-551), `extensions/gate-route.ts:213-262`,
  `extensions/gate-transport.ts:160-215`, `council/gate/{policy,decision,questions}.json`,
  `council/gate/followup/{questions,decision}.json`, `council/validate.py:169-207`,
  `.council.json:44-46`, `.pi/council/gate-ledger.jsonl` (8 lines),
  `test/gate-run.test.ts:39-40, 172-192, 550-585`, `test/gate-route.test.ts:102-156,
  403-415`, `test/gate-run-live.test.ts:24-104`, `test/ev81-followup-run.test.ts:241-243,
  310-312`.
- **Wiki gap, stated as the rule requires:** `vault/wiki/` has no page for the follow-up
  decision lineage (`EPIC-10`'s page is explicitly `Backlog`/planned), and nothing in the
  wiki documents the ledger's `policyVersion` *semantics* — which of the two policy
  versions the field names. That ambiguity is the soil this defect grew in, and the
  ingest that closes EPIC-10 should settle it on `[[metered-deliberation-routing]]`. Not
  this gate's write surface.

## Reversibility

- **`FLLWUP-99`** is a two-line writer change plus one re-expressed golden plus one
  comment, and the safe direction is structural: a wrong call reverts the writer and the
  lines go back to routing full, which is where they are today. Existing ledger lines
  are never rewritten (append-only, `EV-61`), so no data migration can go wrong.
- **`FLLWUP-100`**'s diagnosis is additive; the binding constraint (fail-closed
  byte-identical, offline default suite, gated live arm) means a wrong remedy costs a
  question-set or shaping change that the posture tests and the drift check catch
  immediately. If it concludes "no wire-side remedy exists," the cost of having carded
  it is one card that ends in a human decision — which is cheaper than the alternative,
  which is the gate going on silently buying nothing.
- **Item 3** is a paragraph of markdown on a `Backlog` card, no board line, no state, no
  goal. Reverting is a text edit; promoting the card on a wrong premise costs a
  dispatch that reds on its own missing site.
- Nothing here declines a card, converts a temporary residual into a permanent one,
  touches a recorded human decision, or amends a live card's goal — so nothing reaches
  `steward`, except the conditional in §3's flag, which is named for that seat rather
  than ruled by this one.
