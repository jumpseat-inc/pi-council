---
slug: po-ev83-confirmation-authority-ruling
card: EV-83
epic: EPIC-10
seat: product-owner
step: 6
date: 2026-09-22
kind: ruling
supersedes: nothing
qualifies: the EV-83 round-3 convergence's confirmation-authority sentence (mechanism unaffected)
---

# EV-83 — product-owner ruling: confirmation authority in the container, and the `advisory` arm

**Subject.** Two open-judgment items escalated by the `council-runner` executing
**EV-83** (`state: Deliberating`, mode `Deliberate`, steps 2–5 complete and
committed) after full deliberation:

1. Under `gate.mode: "active"`, does the recorded (engine-minted) follow-up gate
   decision constitute the container's **confirmation** — may the runner apply the
   recorded disposition and write the confirmed card on `DONE`, with the
   orchestrator's dispatch standing in for the confirm step?
2. What does a container do with an `advisory` follow-up result — `ESCALATION`,
   `HALT`, or carry unconfirmed drafts on `DONE`?

**No recommendation was attached** (per `<escalation_contract>`), and none is
implied below by the seats' positions.

**Ruling in one line: the recorded decision is the container's disposition
SOURCE, never its confirmation — in-container the confirmation act belongs to a
ruling seat reached through the orchestrator's `ESCALATION` service, so a
resolved `active` candidate is also escalated (carrying its recorded `Mode:` line
verbatim as the disposition to be ratified) and nothing is written until a
confirming ruling lands in the resumed runner's input; and `advisory` →
`ESCALATION`, keyed on the result-level mode flag exactly as the settled `off`
arm, carrying the rendered advisory lines as information only.**

---

## 1. What I checked before ruling

I did not take the packet's summaries on the points that carried the ruling.

- `council/procedures/features-deliver.md:13–31` — the authority map, read in full:
  it declares itself "**complete and exhaustive**" over "every power `/council`
  reserves to the human", and states "No additional authority may be inferred from
  the autonomy mandate beyond what this table states — if a situation arises that
  doesn't map cleanly onto one of these rows, it is not covered, and covered means
  routed to a human per Phase 1 or the escalation contract below, **not decided by
  inference from this table's spirit**." Its three rows are Judgment →
  `product-owner` (escalating to `steward`), Merge → the deterministic artifact
  check, Strategy → `steward`. A model call is not a row.
- `council/procedures/council.md` §13 as shipped (EV-82, merged `277036b5`) — "With
  `active`: the disposition is applied **only after confirmation**";
  "**Confirmation precedes any write.** Nothing is written to `council/cards/`
  before the human confirms at this gate … the confirmation precedes any card
  write, **in every mode**"; "**Draft-then-confirm is a hard gate here** … write
  nothing to `council/cards/` that the human has not approved. Only after
  approval, write the approved cards".
- `test/prose.test.ts:526` — the pre-write pin is a live, passing mechanical test,
  not a sentiment.
- `council/agents/council-runner.md:104–136` (`<escalation_contract>`) — "You never
  dispatch `product-owner` or `steward` … Wherever council.md's procedure calls for
  a ruling seat — step 6's routing, **or any other point a ruling would ordinarily
  be sought** — do this instead", and the warning that "**Extending an old ruling
  to a new question it did not actually answer is deciding, dressed up as
  applying.**"
- `council/agents/council-runner.md:192–199` (`<convergence_is_not_evidence>`) —
  shipped seat text: agreement between independently-dispatched seats "is a
  hypothesis two people happened to share", not a closed dispute. This is the
  repo's own answer to the strongest argument for option (a).
- `council/cards/EV-83.md` — the goal's fixture assertion is "`ESCALATION` and zero
  **unconfirmed** cards" (my emphasis). Under reading (a) that adjective carries no
  weight: every written card would be confirmed-by-record by construction.
- `council/cards/EV-82.md:158–160` — the round-1 owner record of the card that
  *shipped* this surface states the design's own premise: "The confirmation act
  stays addressed to the human in the prose; this autonomous run **re-homes the act
  to a ruling seat through its own dispatch structure** without the procedure's
  addressee changing."
- The three step-13 confirmations already issued in **this same run**:
  `2026-09-21-po-ev79-step13-followup-confirmation.md`,
  `2026-09-22-po-ev81-step13-confirmation.md`,
  `2026-09-22-po-ev82-step13-confirmation.md`. Each opens by recording that "the
  human's confirmation act is re-homed to this seat", and in each the runner
  **held its drafts and escalated**; this seat then confirmed, amended, or dropped
  them and only then were the cards written. That is the container's confirmation
  mechanism as actually operating, on the three immediately preceding cards.
- `council/cards/EPIC-10.md` Acceptance bullet 4 — "**no mode writes a card before
  the human's confirmation**"; `vault/raw/2026-09-21-po-epic10-recut-ruling.md`
  R0b (that clause is PO-amended epic text, ratified against the
  human-ordered re-cut) and the Intent's fail-safe posture: "here the safe side is
  the human."
- `.council.json` → `gate.mode: "active"` (this repo is the dogfood side; the
  packaged default is `off`, recut R9).

## 2. Question 1 — the recorded decision is not the container's confirmation

**Ruled: NO.** Under `active`, the recorded gate decision is the **disposition
source** — it says *what* will happen and the runner never re-decides it — but it
is not the **confirmation**, which is an act by a different party than the
decider. In an autonomous container that party is a ruling seat, reached by the
machinery that already exists: the runner `ESCALATION`s the drafted candidate(s),
this seat confirms/amends/drops, the orchestrator resumes a fresh runner with the
ruling verbatim in its input, and **that** runner applies the recorded disposition,
writes the card, and reports the per-candidate outcome on `DONE`.

The gate's value in the container is not "a write licence". It is that the
confirmation becomes **ratification instead of re-deciding**: under `active` the
escalation packet carries the recorded `Mode: <disposition> — <basis> — <title>
[→ <target>] (active)` line and the confirming seat is being asked whether to apply
that; under `advisory` the line is information and the confirming seat decides
freely; under `off` there is no line at all. `gate.mode` keeps meaning *whose
decision is applied*, which is the single opinion EPIC-10 exists to hold.

**Why (a) loses, in order of weight.**

1. **Authority is not inferable.** The authority map is exhaustively re-homing the
   human's reserved powers, and step 13's approval is one of them. Its home is the
   judgment row → `product-owner`. The map's own text forecloses the argument for
   (a): the dispatch authorizes the runner to *run*, and treating the gate record as
   confirmation is exactly "decided by inference from this table's spirit".
2. **It makes the gate circular.** Nothing independent would stand between "a model
   returned `File`" and "a card exists on the board". The confirmation gate is a
   gate because its participant must differ from the decider. The epic already
   decided who the safe side is (Intent: the human), and EV-81's whole posture —
   `File` on every failure, never a silent `Drop` or auto-`Merge` — is that opinion
   expressed in code.
3. **It contradicts shipped, tested prose.** §13 says confirmation precedes any
   write "**in every mode**" and that nothing is written "that the human has not
   approved", with `test/prose.test.ts:526` pinning it. A runner block asserting
   machine-self-confirmation would put EV-83's new copy in contradiction with the
   surface EV-82 just merged, and EV-83's own bullet 1 requires the surfaces to
   *agree with* step 13.
4. **The goal's wording already assumes a confirmer.** "zero **unconfirmed** cards".
5. **The convergence is not evidence** — by this repo's own shipped block, and this
   seat's own `<re_grounding>`: two seats agreeing that a gate can confirm itself is
   a shared hypothesis, not a settled fact, and no skeptic test could touch it
   (probe 5 established only that no *code* enforces the distinction, which cuts the
   other way: the whole guarantee is prose plus a judgment seat).

**What I am not doing.** I am not stripping `active` of consequence, and I am not
adding a fifth outcome shape or a fifth tag (R6 holds: `File | Merge | Drop`,
`DONE`/`ESCALATION` only, `RETIRED` byte-verbatim, `<return_contract>` untouched).
The one consequence is a distinct **basis** on the escalation: failed/unresolved
carries the engine-derived failure bytes; resolved-but-awaiting-confirmation
carries the recorded `Mode:` line and names itself as awaiting confirmation. The
fixture's failure route (bullet 4) is unchanged.

**If the round trip is judged too expensive, the lever is not mine to pull.** A
run-scoped, human-recorded Phase-1 authorization could pre-confirm container
follow-up dispositions for a future run — the same shape as P1-1's run-scoped
record-push authorization. That is a human act, recorded before the run, and it is
available without changing anything shipped. This seat cannot mint it, and would
not treat the autonomy mandate as a substitute for it.

## 3. Question 2 — `advisory` in the autonomous container

**Ruled: `advisory` → `ESCALATION`, keyed on the result-level `mode` flag exactly
as the settled `off` arm.** The runner escalates every drafted candidate by its
draft title, writes nothing, and carries the rendered advisory lines verbatim
under those titles — as information, never as an applied disposition — naming the
basis as advisory-only, not as a call failure. Attended `advisory` runs are
untouched (council.md §13 governs there).

Under §2 this is not a new rule; it is the same rule with the packet's contents
filled in by the mode. The container cannot confirm, so a candidate whose recorded
line exists but must not be enforced still has no writer for its disposition, and
the only seat that may decide is the one the escalation reaches.

**Why the alternatives lose.**

- **`HALT`** — `advisory` is a policy state an operator chose, not an environment
  the container cannot repair. `runFollowupGate` throwing on `off` as a programming
  error is the engine's own statement that a mode is not a failure (skeptic probe 4,
  closed-green), and the same reasoning covers `advisory`. `HALT` is also
  disproportionate by construction: Phase 2's `HALT` row stops dispatching the rest
  of the epic's cards on the reading that a halt is usually Phase-0-shaped and will
  recur. A working gate in a supported mode must not freeze a run.
- **Carry unconfirmed drafts on `DONE`** — requires the third Phase-3
  presented-unconfirmed category the principal asked for in round 2, which the
  card's R6 pin and the goal's `File | Merge | Drop` vocabulary do not have room
  for; and it hands the orchestrator a disposition it has no authority under the
  map to resolve, so the drafts would in fact be *dropped* at the ledger seam —
  the precise defect bullet 2's "never silently drops one" exists to prevent. §13's
  advisory sentence ("the human's own edit/drop/approve decision governs")
  presupposes a reader the orchestrator is not.

## 4. Binding on this card, and what stays with the owner

Binding (the *what*):

1. The runner never writes a follow-up card on the strength of a gate record alone.
   The converged sentence "the recorded gate decision is the container's
   confirmation" is **replaced** in the block copy: the recorded decision is the
   disposition source; the confirmation is the ruling that reaches the runner in
   its dispatch input; nothing is written before it, in any mode.
2. `advisory` and `off` both route to `ESCALATION` on the result-level mode flag;
   `active` routes to `ESCALATION` too, but its packet carries the recorded
   disposition line as the thing to ratify. The three arms must stay
   distinguishable by basis so the confirming seat knows which it is doing.
3. Bullet 1's Phase-3 sentence must cover the confirmation-pending arm beside the
   failed/unresolved arm, still as a pointer agreeing with §13, and §13 itself is
   **not** edited by EV-83 (it is EV-82's shipped, prose-tested surface). Existing
   byte-baseline tests are re-expressed, never deleted.
4. `DONE`'s per-candidate outcome section is the post-confirmation arm: it carries
   the applied disposition lines verbatim for cards the confirming ruling
   authorized. Bullet 3 stays non-vacuous, and `<return_contract>` still does not
   move.

The owner's, unchanged: the wrapper mechanism (`council_followup_review`,
child-mode-only, parent pair untouched, `mergeTargets` a tool parameter, the
`followup` grant at the three sites, the `index.ts` comment rewrite), the
`resolved ⟺ status:"ok"`-with-a-rendered-line discriminator and the
`resolvedMode` fail-safe-`File` warning, identifier = draft title, the skeptic's
8a/8b fixture corrections, and all byte-level copy. Nothing in §2 or §3 touches
the engine design, which is why the ruling does not reopen it — and the card
remains worth shipping on its own mechanism: the resumed runner needs the tool to
obtain and apply the line it was confirmed on, and every escalation basis in the
design is engine-derived.

## 5. Escalation test applied — not triggered

I rule rather than escalate because §2 takes the **conservative** side of the
epic's own pin: it preserves `EPIC-10` acceptance bullet 4 and shipped §13 verbatim
and restores the confirmation home the authority map already names. No card is
declined, no live goal moves, no residual is made permanent, and no recorded human
decision is touched.

The **opposite** ruling on Q1 is the one that reaches portfolio level: "the
engine-minted record *is* the confirmation" would qualify EPIC-10's acceptance
("no mode writes a card before **the human's** confirmation"), the shipped §13
pre-write pin, and the authority map's exhaustivity clause at once. If the
portfolio wants that outcome, it must be a `steward` or human act — a Phase-1
authorization of the kind named in §2 — and not a reading adopted here.

## Grounding

- Procedure/seat: `council/procedures/features-deliver.md` (authority map,
  exhaustive; Phase 2 `ESCALATION`/`HALT` service rows; Phase 3 follow-up row),
  `council/procedures/council.md` §13, `council/agents/council-runner.md`
  (`<escalation_contract>`, `<convergence_is_not_evidence>`,
  `<return_contract>`).
- Cards: `council/cards/EV-83.md` (goal's "zero unconfirmed cards"; rounds 2–3
  crossings; step-4 probes 1–8b; step-5 open-judgment items 1–2),
  `council/cards/EV-82.md` (:158–160 the re-homing premise; the pre-write pin; the
  Option-2 line grammar), `council/cards/EV-81.md`, `council/cards/EPIC-10.md`.
- Prior rulings: `vault/raw/2026-09-21-po-epic10-recut-ruling.md` (R0b, R4, R6, R9,
  the fail-safe-to-the-human Intent clause),
  `2026-09-21-po-ev79-step13-followup-confirmation.md`,
  `2026-09-22-po-ev81-step13-confirmation.md`,
  `2026-09-22-po-ev82-step13-confirmation.md` (container confirmation exercised at
  this seat, three times, this epic).
- Wiki: `[[followup-merge-and-auto-ingest]]`, `[[metered-deliberation-routing]]`,
  `[[engineering-board]]`, `[[presented-never-written]]`,
  `[[record-push-discipline]]` (the run-scoped-authorization shape), `[[council-runner]]`,
  `[[facilitator]]`, `[[product-owner]]`, `[[steward]]`.
- Tests read: `test/prose.test.ts:526` (pre-write pin, live).

## Reversibility

Moderate-to-cheap, and asymmetric in the direction chosen. If this ruling is
wrong, the cost is **one ruling-seat round trip per follow-up-bearing card** — the
cost this epic has already paid and recorded three times — and the fix is a
Phase-1 human authorization on a later run: nothing shipped moves, no artifact is
unwound. If the reverse ruling is wrong, the cost is cards on the board that no
party approved, written by the seat whose model line justified them, against a
`File` disposition the human never saw — and `FLLWUP-69` records that **no code
enforces that write path**, so the recovery is manual board archaeology and a
union-merge reconcile. The gate here is prose plus a judgment seat; that is exactly
why the cheap-to-reverse side is the one that keeps a seat in front of it.
