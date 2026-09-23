---
id: FLLWUP-82
title: Gate questions↔weights equality: harden the loaders and fail loud at the composition site
state: Backlog
owner: null
epic: EPIC-16
goal: Every gate question id is single-line and cross-referenced — loadGateQuestions refuses a newline-bearing id, loadGateDecision refuses an overrides[].question/weights/mechanical id absent from questions.json and a noul override naming no criterion key, a rule that can never fire is refused, and composing a question set with its decision policy fails loud naming both files and offending ids in each direction for both the follow-up pair and the card-gate pair.
---


## Intent

Filed from EV-73's step-13 follow-up feed, item 2: the step-6 product-owner
ruling (job-2) merges EV-73's synthesis item (2) (the cross-file override
invariant) with item (4) (`questions.json` newline-bearing ids) into ONE card.
**Pairing: this card and FLLWUP-71 are siblings under EPIC-13's gate-data
hardening** — FLLWUP-71 adds the userVisibility question to the set's data;
this card hardens the loaders that read that data. Both touch
`council/gate/questions.json`/`decision.json`'s validated surface and should
land with awareness of each other's version bumps.

Evidence carried: EV-73's skeptic O1 (closed-red) found the actually-renderable
multi-line basis surface is newline-bearing `questions.json` ids —
`loadGateQuestions` accepts `"q\n1"` as a key today and `runGate`'s knownIds
filter passes it to `decide()`'s renderers (probe A4b/A5: the basis line
contains a newline). The principal's round-2 finding: an override id present
in `weights` but absent from `questions.json` can never fire (gate-run.ts
filters answers to knownIds), so a rule that can never fire is silently dead.
Both classes need the cross-file view; neither file's loader can refuse them
alone, hence one card.

---

### Absorbed: FLLWUP-96 — Fail-loud questions↔weights equality at the gate's and the follow-up's composition sites

The failure this card kills: a consumer shadowing one file of a pair (AGENTS.md
#5, whole-file first-hit, no merge) today gets a **silent undiagnosable
degradation** — the followup always `File`s, the card gate always drags to
`Deliberate` — and a basis line that blames the model rather than the
misconfiguration.

Precedent for the check's *shape*: FLLWUP-74 class 3 already refuses
`override.question` absent from `weights` **within** one file
(`extensions/gate.ts`). This card extends that equality discipline across the
file pair, at the one site that legitimately holds both.

Explicitly **not** in either loader and **not** in `decideFollowup`/`decide`
(EV-78 point (9); EV-79 S-R1) — those keep each file independently loadable.

**Naming (corrected by the EV-81 step-13 ruling,
`vault/raw/2026-09-22-po-ev81-step13-confirmation.md`):** EV-81 shipped **no**
composition site. `runFollowupGate` mirrors `runGate`'s "loads nothing itself"
posture and receives caller-loaded `questions` and `decisionPolicy`
(`extensions/gate-run.ts`'s EV-81 section header). The followup half is therefore
blocked on **the EV-82/EV-83 call site** — whichever of those cards builds the
engine-side composition that loads both `council/gate/followup/questions.json` and
`decision.json` and reaches `buildFollowupState`; if neither builds it, this half is
blocked on a card that does not exist yet and the gap comes back as its own card.
The card-gate half is buildable the day this card is promoted (`runGate` composes
today). Sequence accordingly. **Premise to re-examine at promotion:** the Intent's
"one site that legitimately holds both" is an assumption, not a fact — if EV-82 and
EV-83 each compose the pair, two call sites sharing one check is the design question
and it belongs to this card's promotion, not to its implementation.

## Acceptance

- A question id containing `\r` or `\n` is refused at the questions.json
  loader, single-line `FAIL:` naming the file and id.
- An `overrides[].question`, `weights`, or `mechanical` id absent from
  `questions.json` is refused at the decision.json loader (or the joint load
  point), single-line `FAIL:` naming both file and id.
- A `noul` override option naming no criterion key is refused.
- A rule that can never fire is refused.
- The packaged `questions.json`/`decision.json` validate clean under the new
  refusals.

---

### From FLLWUP-96 — Fail-loud questions↔weights equality at the gate's and the follow-up's composition sites

- Both directions are loud: a `weights`/counted-option id with no question, and a question with no `weights` entry, each produce a named failure; a well-formed packaged pair composes clean.
- Both domains: the followup pair and the card-gate pair, with the two error grammars kept distinct so a consumer never confounds which gate misfired.
- The failure's observable surface is named in the card's record as one of the two shipped loud-failure postures — the pre-POST zero-ledger-line throw (`extensions/gate-run.ts`, "a mis-keyed noul fails HERE") or the recorded `failRun` line — chosen deliberately, never arriving as a silent `File`/`Deliberate` and never as an unexplained crash mid-run.
- Consumer-visible: a repo-local override that mismatches goes from silently degraded to loud; the release note carries the call-out (same class as the FLLWUP-51 wording note).
- The repo's typecheck, the full test suite, `python3 council/validate.py`, and the repo's preflight pass.
