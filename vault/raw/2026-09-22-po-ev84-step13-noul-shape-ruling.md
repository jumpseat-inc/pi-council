---
slug: po-ev84-step13-noul-shape-ruling
card: EV-84
epic: EPIC-10
seat: product-owner
step: 13
date: 2026-09-22
kind: ruling
supersedes: nothing
qualifies: FLLWUP-100's Intent cause list (Amendment D; its goal is untouched)
---

# EV-84 — product-owner step-13 confirmation: the live noul answer-shape drift is its own card; `FLLWUP-100`'s face records the cause

**Subject.** The `council-runner` executing **EV-84** (state `Done`, merged
`03925df015fb6d9b26931d8558cc11322a0782c2`, PR #103) held one step-13 candidate with no
disposition recorded in-container. Per the confirmation-authority ruling
(`vault/raw/2026-09-22-po-ev83-confirmation-authority-ruling.md` §2 — the recorded gate
decision is the container's disposition *source*, never its confirmation), the held draft
comes here for confirm / amend / drop before anything is written. No recommendation was
attached.

**Disposition in one line: the draft is CONFIRMED AS A CARD, amended — `FLLWUP-104`,
`epic: EPIC-13`, `state: Backlog` — because the fix it describes is bounded and known
while `FLLWUP-100`'s is an open question, and because the draft's followup-domain half
would require broadening `FLLWUP-100`'s goal to fit it, which is the fold-in test's own
definition of *not* a fold-in; `Merge` into `FLLWUP-100` is REJECTED for the reason this
seat used to keep `FLLWUP-99` and `FLLWUP-100` apart in the first place, and the dedup
pass is honoured instead by a face amendment to `FLLWUP-100` (Amendment D) recording that
its Amendment-A hypothesis is now CONFIRMED, that two of its four causes are demoted, and
that `FLLWUP-104` lands first.**

---

## 1. What I verified myself

The packet's mechanical claims were checkable in three files and I checked them rather
than accepting the summary.

- **The reader.** `extensions/gate.ts` — `sideProbability`'s noul branch reads
  `answer.probability` and throws `gate: decide — answer <id> of type noul is missing a
  usable probability (expected a number in [0, 1])`; `followupFloor` re-validates the same
  field with the `followup:`-prefixed grammar (deliberately, "keeping one mechanic");
  `overrideFires`'s noul arm delegates to `sideProbability`. So the three sites the draft
  names are **two reads of one field**, not three contracts.
- **The pass-through.** `extensions/gate-transport.ts` — `parseDecisionsResponse`
  validates `model`, that `answers` is a non-array object, and usage/provider/generationId,
  then casts `o.answers as Record<string, GateAnswer>`. There is no probability extraction
  at the parse site. This is exactly what `FLLWUP-100` Amendment A predicted, in its own
  words: "If the decisions body carries a probability at a location or under a key name the
  verbatim pass-through does not surface, `decide()` receives an answer object with no
  usable probability and throws — and the symptom is *indistinguishable* from 'the model
  didn't give us one'."
- **The live contract that now fails.** `test/gate-run-live.test.ts` arm 3 asserts
  `(parsed.answers.twoPlusTwo as { probability: number }).probability > 0.9` against the
  ledger — the **pole-semantics probe**, EV-65's answer to its own open judgment item
  ("Noul probability semantics — P(true) or P(favorable side) not pinned by the capture").
  Arm 1 asserts `status:"ok"` and `failure` absent. Under the drift those two fail and only
  the 1 ms-timeout arm passes — matching the recorded `1 pass / 2 fail`. The counts in the
  packet are right.
- **The board.** `FLLWUP-100` is `Backlog` (board.md:12), so goal immutability does not
  bind here; its siblings `FLLWUP-99` and `FLLWUP-102` carry `epic: EPIC-13`. Highest
  allocated id is `FLLWUP-103`, so `FLLWUP-104` is free — re-allocated at fetched HEAD when
  the card is actually written (`[[card-id-allocation]]`).

**One consequence the packet does not carry, and it is the reason this card exists in the
form below.** The evidence shows a *value* came back (`{"type":"noul","noul":0.59}`). It
does not show **which pole that value names**. Today's posture — every live call throwing,
every line resolving to the safe side — is expensive and useless, but it is never *wrong*.
A fix that maps `noul → probability` on the strength of the key name alone, with the pole
unproven, would replace a visible tax with silently mis-armed routing on a public,
committed ledger. So the new card's load-bearing proof is the pole probe on the new key,
not "parsing succeeds". That is the draft goal's one real gap and it is amended in.

## 2. The dedup pass, and why it lands as a face amendment rather than a merge

The dedup finding is correct as a fact and wrong as a conclusion. `FLLWUP-100` *is* the
same defect's observed symptom, and `EV-84`'s evidence *does* supply the root cause it
lacks. Two things follow, and they point in different directions:

1. **`FLLWUP-100`'s goal holds as written, unchanged.** Read it literally: "Diagnose why
   the decisions transport's answers reach `decide()` without usable probabilities … and
   land a remedy that keeps the fail-closed posture byte-identical, proven by a test
   showing a live-shaped call can produce a **reduced mode** when the evidence supports
   it." The reduced-mode clause is the card's load-bearing claim, and the shape fix does not
   deliver it — with the key accepted, a line still needs `FLLWUP-99`'s writer fix to
   survive `resolveRoute`'s drift check at all, and still needs the packaged four-question
   composite to clear a threshold. So the shape work is a *precondition* of that goal, not
   the goal.
2. **The draft asks for more than that goal can hold.** Its proof set names
   `test/ev84-followup-falsifier.test.ts` and the followup readers — `decideFollowup`,
   `followupFloor`, `overrideFires`, EPIC-10's surface. `FLLWUP-100`'s goal and acceptance
   say nothing about the followup domain; every clause of it is card-gate-shaped. Putting
   the followup half inside it means rewriting its goal to make room.

That is the fold-in test applied and failing: a work item belongs to a live card iff it is
needed to meet that card's goal *as written* (`[[engineering-board]]`,
`vault/raw/2026-09-21-po-ev73-step6-ruling.md`), and "would require changing the goal to
justify" is, by definition, a new card.

The collision the dedup pass legitimately worries about — two cards licensed to edit
`gate-transport.ts`'s parse site and `gate.ts`'s noul reads — is real, and the answer to it
in this board's practice is not merger but **stated sequence plus a correction on the face
of the card that would otherwise re-derive the answer for free**. That is exactly what this
seat did with the `FLLWUP-99`/`FLLWUP-100` pair ("Sequence them: `FLLWUP-99` first
(mechanical, bounded), `FLLWUP-100` second"), and what it did to `FLLWUP-96`'s blocker
sentence for the same reason: a stale or now-redundant instruction on a `Backlog` card's
face is binding prose and belongs on the face, not in a `Done` card's 400-line record
(`vault/raw/2026-09-22-po-ev81-step13-confirmation.md` §3, grounds 2 and 3).

## 3. Sequence after this ruling

`FLLWUP-104` (shape — bounded, cause known) → `FLLWUP-99` (writer — bounded) →
`FLLWUP-100` (does metering ever produce a reduced mode — open, and honest either way).
`FLLWUP-104` and `FLLWUP-99` do not depend on each other; `FLLWUP-100` depends on both and
must be re-read against Amendment D when it is promoted. Promotion posture is `Backlog` —
this run's epic is closed at its last child, and promotion belongs to the next
decomposition (`[[chain-promotion]]`; the posture taken in EV-81 §1 and
`2026-09-20-po-fllwup58-step13-confirmation` §5.7).

## 4. Apply-ready text

### 4.1 New card `council/cards/FLLWUP-104.md`

```markdown
---
id: FLLWUP-104
title: Fix the live noul answer-shape drift — the decisions API returns `{"type":"noul","noul":<p>}`, the engine reads `probability`, in both gate domains
state: Backlog
owner: null
epic: EPIC-13
goal: A noul answer's probability is read from the key the decisions endpoint actually returns, so live card-gate and follow-up calls stop dying at `decide()`/`decideFollowup()` with `invalid-response` — proven by both gated live arms reaching green (`COUNCIL_INTEGRATION=1 bun test test/gate-run-live.test.ts` 3/3 with the pole-semantics arm asserting on the new key, and `COUNCIL_JEV_LIVE=1 bun test test/ev84-followup-falsifier.test.ts` reaching its recorded dispositions), with the fail-closed posture for genuinely malformed answers unchanged and pinned, an answer carrying both keys with disagreeing values failing loud rather than silently preferring one, and the ledger storing one canonical answer shape that the same reader which produced it can still re-derive.
---

## Intent

Confirmed by the EV-84 step-13 product-owner ruling
(`vault/raw/2026-09-22-po-ev84-step13-noul-shape-ruling.md`). Sequence: this card lands
**before** `FLLWUP-100` (whose remaining question is unanswerable while every live call
throws) and independently of `FLLWUP-99`.

**The defect, located.** `typesafe/jev-1.13-20260917` returns noul answers as
`{"type":"noul","noul":<p>}` (raw POST, verified during EV-84 steps 8–9 and reproduced
independently by the skeptic and the judge). The engine reads `answer.probability` — once
in `sideProbability` (shared by `decide()` and by `overrideFires`'s noul arm) and once
again in `followupFloor` — and `parseDecisionsResponse` passes per-question payloads
verbatim, so nothing anywhere maps the returned key. Consequence: **every** live gate and
follow-up call fails closed with `invalid-response` (`File` / `Deliberate`). The safe
direction is holding; the mechanism buys nothing at any price.

**One upstream cause, two domains.** The card gate and the follow-up read the same parsed
answers. A fix at the parse site satisfies both readers at once; a fix widened into each
reader leaves two contracts where one drifted. Which is the implementing owner's `how`;
both live arms are the proof either way, and neither domain may be proven by the other's
arm.

**The pole is proven, not assumed (load-bearing).** A `0.59` came back; that it is
P(`noulProbabilityOf`'s pole) is a separate claim, and it is the one that decides whether
this fix is a repair or a new hazard — a wrong-pole probability would arm the floors and
the composite with confidently inverted evidence against a committed, dogfooded ledger,
which is worse than today's honest fail-closed tax. `test/gate-run-live.test.ts`'s
pole-semantics arm (a trivially-true statement must return p > 0.9) is the existing witness
and must pass **on the new key**; it may not be relaxed, re-keyed to a shape-only
assertion, or replaced by "the call no longer throws".

**Ambiguity fails loud.** An answer carrying both `probability` and `noul` with disagreeing
values throws naming the question id, in the existing domain-neutral error grammar (it
rides verbatim into `gate call failed: <reason>`); it never silently prefers a key.
Absent, non-numeric, or out-of-range still behaves exactly as pinned today.

**The record stays re-derivable.** `[[metered-deliberation-routing]]`'s ledger contract —
"the mode is re-derivable from the record alone with no network call" — must hold after the
change: one canonical answer shape on the committed line, read back by the same reader that
wrote it. If the honest mechanism cannot do that, the ledger-schema question is its own
card (the `FLLWUP-100` Amendment C boundary, applied here).

**Re-capture, do not trust this record.** The wire is an upstream dependency that has
already drifted once; EV-84's capture is the *discovery* evidence, not the implementation
evidence. The card records a fresh raw response body captured at implementation time.

## Acceptance

- Both gated live arms reach green: `COUNCIL_INTEGRATION=1 bun test
  test/gate-run-live.test.ts` (all three arms, the pole arm asserting on the accepted key)
  and `COUNCIL_JEV_LIVE=1 bun test test/ev84-followup-falsifier.test.ts` (reaching the
  recorded `Merge`/`File` dispositions). No new live arm enters the default suite
  (`[[test-suite-budget]]`).
- The fail-closed posture is unchanged and pinned by test for each malformed class: absent
  value, non-numeric, out of `[0, 1]`, unknown `type` — and now the both-keys-disagree
  case, which is new and must be loud, not preferred.
- The committed ledger carries one canonical noul answer shape and the mode re-derives from
  the record alone.
- A fresh raw response body is recorded on the card; red-at-base evidence follows the
  seven-field convention (`[[red-base evidence]]`) with base = the defect-live `main` at
  `03925df015fb6d9b26931d8558cc11322a0782c2`, role `required`, and the comparison triple
  recorded — this is a behavioral red on a gated arm, not a mechanism-absent one, and the
  record must say how the live arm was reached at base (credentials in a detached
  worktree) or name that it could not be.
- The owner gates green in full: `bunx tsc --noEmit`, the full `bun test`,
  `python3 council/validate.py`, and `bash council/preflight.sh`.
```

### 4.2 Board line (Backlog column, above the `FLLWUP-100` line)

```
- FLLWUP-104 — Fix the live noul answer-shape drift — the decisions API returns `{"type":"noul","noul":<p>}`, the engine reads `probability`, in both gate domains
```

### 4.3 `FLLWUP-100` face amendment — append to `## Intent`, after the "Starting point." paragraph

```markdown
**Amendment D (EV-84 step-13 ruling) — Amendment A's hypothesis is CONFIRMED; this card's
remaining question is narrower than drafted.** The wire has been captured:
`typesafe/jev-1.13-20260917` returns noul answers as `{"type":"noul","noul":<p>}`, while
`sideProbability`/`followupFloor` read `answer.probability` and `parseDecisionsResponse`
passes per-question payloads verbatim — so `decide()` receives an answer with no usable
probability and throws. That key-name mismatch is the cause of every `invalid-response`
line in the ledger. Of the four drafted causes, **wire shaping is confirmed**; question
instructions and model behavior are demoted to residual, to be re-examined only if the
packaged four-question set still fails to produce a usable probability after the shape is
accepted. **The shape remedy is not this card's** — it is `FLLWUP-104`, which lands first;
this card's question (does the packaged four-question set ever produce a *reduced* mode
that `resolveRoute` reads back as `source: "recorded"`) cannot be honestly investigated
while every call throws. Amendment B's proof and the "outcome named in advance" clause are
**unchanged**; the goal is unchanged and still cannot be closed by the shape fix alone.
Amendment C's capture obligation is discharged in its *diagnostic* half by EV-84's raw POST
(`council/cards/EV-84.md`, step 8 live-arm evidence); this card re-verifies the shape at
implementation rather than trusting that record, because the wire has already drifted once.
Source: `vault/raw/2026-09-22-po-ev84-step13-noul-shape-ruling.md`.
```

`FLLWUP-100`'s `title`, `goal`, `state`, and `epic` are untouched, so no `council/board.md`
line changes and no immutable surface moves — the identical posture to EV-81's Item 3.

## 5. Flag for the ingest that closes EPIC-10 (not a ruling)

`vault/wiki/metered-deliberation-routing.md` states, in its Decision bullet, "A `noul`
answer carries a probability but no `confidence`", and EV-81's §Grounding already recorded
that the wiki does not document the answer-shape or `policyVersion` *semantics*. The first
sentence is now contradicted by evidence about the **wire** (the endpoint names the field
`noul`) while remaining true of the **engine's** internal contract. The refresh should say
which of the two the sentence describes, and name the canonical stored shape — the
ambiguity is the soil this defect grew in. The wiki is not this seat's write surface.

## Grounding

- Cards/records: `council/cards/EV-84.md` (step 8 live-arm evidence, the seven-field
  red-at-base record, step 9 O4, step 10), `council/cards/FLLWUP-100.md` (Amendments A/B/C,
  the named-in-advance outcome), `council/cards/FLLWUP-99.md`, `council/cards/FLLWUP-96.md`
  (the face-correction posture), `council/cards/EV-81.md`, `council/cards/EV-65.md` (the
  noul wire-shape seam and the unpinned-pole open judgment), `council/board.md`.
- Prior rulings: `vault/raw/2026-09-22-po-ev81-step13-confirmation.md` (Item 2 — the very
  hypothesis this evidence confirms; Item 3 — correcting a `Backlog` card's binding face;
  Item 1 — gate residuals go to the epic whose code they touch),
  `vault/raw/2026-09-22-po-ev83-confirmation-authority-ruling.md` (§2, why a held draft
  comes here), `vault/raw/2026-09-21-po-ev73-step6-ruling.md` (the fold-in test),
  `vault/raw/2026-09-21-po-ev79-step13-followup-confirmation.md` (`sideProbability` reuse
  across both domains), `vault/raw/2026-09-17-po-fllwup47-step6-ruling.md` (the red-base
  convention).
- Wiki: `[[metered-deliberation-routing]]` (the decision asymmetry; the transport's
  fail-closed contract; the ledger's re-derivability), `[[followup-merge-and-auto-ingest]]`,
  `[[engineering-board]]`, `[[card-id-allocation]]`, `[[chain-promotion]]`,
  `[[test-suite-budget]]`, `[[red-base evidence]]`, `[[product-owner]]`.
- Code read at this ruling: `extensions/gate.ts` (`followupFloor`'s noul arm,
  `decideFollowup`'s phase walk, `sideProbability`, `overrideFires`, `decide`'s order
  comment), `extensions/gate-transport.ts` (`toWireQuestions`, `ParsedDecisionsResponse`,
  `parseDecisionsResponse`'s verbatim cast), `test/gate-run-live.test.ts` (all three arms).

## Reversibility

**Cheap, and the card's own posture is what makes it so.** `FLLWUP-104` is additive on a
`Backlog` card: declining or re-scoping it later is a markdown edit with no artifact
unwound. If its *mechanism* is wrong — a key mapped to the wrong pole, or a dual-shape
reader — the shipped fail-closed asymmetry catches it immediately at the pole probe and the
drift check, and the revert restores today's state exactly: every line `Deliberate`/`File`,
zero reduced modes, nothing lost from the append-only ledger. The expensive failure mode
this ruling is guarding against is not the card being wrong; it is the fix landing without
the pole proven. `FLLWUP-100`'s Amendment D is one paragraph, no goal, no state, no board
line — a text edit to undo. Nothing here declines a card, makes a temporary residual
permanent, touches a recorded human decision, or amends a live card's goal, so nothing
reaches `steward`.
