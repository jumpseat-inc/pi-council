---
slug: po-ev79-step13-confirmation
card: EV-79
epic: EPIC-10
seat: product-owner
step: 13
date: 2026-09-21
kind: ruling
---

# EV-79 — product-owner step-13 confirmation (one draft confirmed-and-widened; one flag ratified as no-card)

**Subject.** The `council-runner` that executed **EV-79** (state `Done`, merged
`ddf9077`) filed one step-13 draft and one not-drafted flag, and held both per
the pre-write draft-then-confirm gate (`council/procedures/council.md` §13). In
this autonomous `/features-deliver` run over EPIC-10, the human's confirmation is
re-homed to this seat (same authority shape as
`vault/raw/2026-09-20-po-fllwup58-step13-confirmation.md`, whose direct precedent
is `vault/raw/2026-09-19-po-fllwup59-step13-ruling.md` — confirm, drop, or amend
with a stated re-card trigger).

**Disposition in one line: the draft is CONFIRMED as `FLLWUP-96` with its title
and scope amended (both decision domains, not one); the EV-81
`sideProbability` range residual is RATIFIED as needing no card — its home is
EV-81's own acceptance — with a named re-card trigger if EV-81 lands without
closing the shipped card-gate arm.**

## Inputs read

`council/cards/{EV-79,EV-81,EV-80,EV-82,EV-78,FLLWUP-93}.md`,
`council/board.md` (`FLLWUP-95` is the highest existing id — `FLLWUP-96` is
free), `docs/superpowers/specs/2026-09-21-EV-79-design.md` §"Named notes and
residuals" (items 2 and 3), `vault/raw/2026-09-21-po-epic10-recut-ruling.md`
(R4), `vault/raw/2026-09-21-po-ev78-thresholds-schema-ruling.md`,
`vault/wiki/{index,engineering-board}`, and the shipped code:
`extensions/gate.ts:896–1005` (`followupFloor`, `decideFollowup`),
`gate.ts:1020–1031` (`sideProbability`), `gate.ts:1121–1125` (the gate's
0-contribution composite loop), `gate.ts:520–529` (FLLWUP-74 class-3 — the
*within-file* override↔weights check), `extensions/gate-run.ts:222–235, 249–300`
(the pre-POST loud posture, the `knownIds` filter, the invalid-response
catch-all → `failRun`).

---

## Item 1 — CONFIRMED, amended: `FLLWUP-96`

### Why it is a card and not a decline

The draft's premise is right but its stated *reason* is the weakest one
available. "A weight id with no question silently always-Files" is, on its own,
a **safe** residual — File is the human-facing side, and the epic's central
opinion (R4, `2026-09-21-po-epic10-recut-ruling.md`) is that a follow-up
failure resolves toward a person. Declining on that reading is defensible, and
the two EV-79 seats' recommendation would then be a coin flip.

The reason it is a card is the one the draft did not state: **the repo's
override pattern makes the mismatch an expected consumer action, not a
hypothetical.** AGENTS.md convention #5 and EV-78's shipped loader resolve
`council/gate/followup/questions.json` and `decision.json` *whole-file,
first-hit, with no field merge* — so a consumer who shadows one file (to retune
`thresholds`, to add a fourth question) and not the other produces exactly this
mismatch by design. Today that consumer gets a gate that silently degrades to a
no-op, with a basis line (`duplicate: unanswered`) that misdiagnoses the
misconfiguration as a model that refused to answer. **The user value is
diagnosability at the moment a person edited data and got no signal.** That is
the same opinion EV-78's goal already carries for the single-file case
("failing loud on any unknown key, never a silent default").

Two facts keep it out of `decideFollowup` and out of either loader, exactly as
the EV-79 record settled: the function is pure and takes no question set, and
EV-78's point (9) deliberately refuses cross-file validation *inside the
loaders* so each file stays independently loadable. The only site that holds
both files is the composition site.

### Why the scope is widened to both domains

The drafted card covers the followup pair only. The shipped **card gate has the
identical gap and no card owns it**: `decide()`'s composite loop
(`gate.ts:1121–1125`) lets a `weights` id with no question contribute 0, dragging
every card toward `Deliberate` forever, silently, in a feature that is live in
consumer repos today. Same mechanic, same fix site, same error-grammar question.
Splitting it into a second card later would mint two cards to answer one
question, and it would leave the *shipped* half — the half with real consumers
right now — uncovered behind the newer, more visible half. One card, two sites.

This is a card-level scope edit authorized by the confirm gate ("edit, drop, or
approve each draft"), not a portfolio act: no card is declined, no recorded
human decision is touched, no live card's goal is amended.

### Exact text to be written

File `council/cards/FLLWUP-96.md`, board line under `## Backlog`:

```
---
id: FLLWUP-96
title: Fail-loud questions↔weights equality at the gate's and the follow-up's composition sites
state: Backlog
owner: null
epic: EPIC-10
goal: Composing a question set with its decision policy fails loud — naming both files and the offending ids in each direction — when a `weights` id has no question or a question has no weight, for the follow-up pair and for the shipped card-gate pair, proven by a test per domain asserting a named failure for both mismatch directions and that each packaged pair still composes clean.
---
```

`## Intent` — to be authored by the implementing owner, carrying these points
(this seat rules *what*, not the prose):

- The failure this card kills: a consumer shadowing one file of a pair
  (AGENTS.md #5, whole-file first-hit, no merge) today gets a **silent
  undiagnosable degradation** — the followup always `File`s, the card gate
  always drags to `Deliberate` — and a basis line that blames the model.
- Precedent for the check's *shape*: FLLWUP-74 class 3 already refuses
  `override.question` absent from `weights` **within** one file
  (`gate.ts:520–529`). This card extends that equality discipline across the
  file pair, at the one site that legitimately holds both.
- Explicitly **not** in either loader and **not** in `decideFollowup`/`decide`
  (EV-78 point (9); EV-79 S-R1) — those keep each file independently loadable.
- Naming: the followup half is **blocked on EV-81**, which creates that
  composition site; the card-gate half is buildable the day this card is
  promoted (`runGate` composes today). Sequence accordingly.

`## Acceptance` — obligations, one bullet each:

- Both directions are loud: a `weights`/counted-option id with no question, and
  a question with no `weights` entry, each produce a named failure; a
  well-formed packaged pair composes clean.
- Both domains: the followup pair and the card-gate pair, with the two error
  grammars kept distinct so a consumer never confounds which gate misfired.
- The failure's observable surface is **named in the card's record** as one of
  the two shipped loud-failure postures — the pre-POST zero-ledger-line throw
  (`gate-run.ts:222–235`, "a mis-keyed noul fails HERE") or the recorded
  `failRun` line — chosen deliberately, never arriving as a silent `File` /
  `Deliberate` and never as an unexplained crash mid-run.
- Consumer-visible: a repo-local override that mismatches goes from silently
  degraded to loud; the release note carries the call-out (same class as the
  FLLWUP-51 wording note).
- The repo's typecheck, the full test suite, `python3 council/validate.py`, and
  the repo's preflight pass.

## Item 2 — RATIFIED as no-card; the home stays EV-81

`sideProbability`'s choice branch checks `Number.isFinite` and not `[0,1]`
(`gate.ts:1028–1030`; the noul branch at `gate.ts:1022–1025` does range-check),
and `followupFloor` range-checks a noul `probability` but **not** a choice
answer's `probabilities[option]` — so an out-of-range model probability still
reaches the composite in both domains. The runner's judgment that this needs no
new card is correct under the **fold-in test** (`engineering-board`, from
`2026-09-21-po-ev73-step6-ruling`): EV-81's Acceptance already binds "No
pathology of the call produces an automatic `Merge` or any write before
confirmation", and a body carrying `probs{no:1.5}` is a pathology of the call
whose composite (`2.3 ≥ 2.0` on the packaged followup policy) yields a `Drop` —
so the range check is **needed to honestly meet EV-81's goal as written**. It is
therefore EV-81's, by definition, not a `FLLWUP-`. Carding it separately would
move an acceptance test's target out of the card whose falsifier depends on it —
the exact failure mode the fold-in test exists to catch.

**Re-card trigger, named rather than carded now.** EV-79's skeptic probe (iii)
demonstrated this defect flipping the **shipped card gate** `Verify → Direct`
live. EV-81's parse path closes the followup arm. The cheapest repair closes
both at once, because `sideProbability` is shared — whether to fix the helper or
only the followup parse is the implementing owner's call (the `how`), and the
card-gate's posture is already fail-closed there (`decide()` throwing lands in
the invalid-response catch-all → `Deliberate`, `gate-run.ts:290–299`, i.e. more
scrutiny, never less). If EV-81 lands with the check at the followup parse site
only and the shipped `decide()` arm still accepts out-of-range probabilities,
that is a **new** card at EV-81's step 13 — not a fold-back into EV-81, whose
goal would then already be met.

## Supersedes

Nothing. This ruling is additive to
`vault/raw/2026-09-21-po-epic10-recut-ruling.md` and executes the deferral
recorded as residual 2 in `docs/superpowers/specs/2026-09-21-EV-79-design.md`.
