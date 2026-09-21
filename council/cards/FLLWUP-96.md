---
id: FLLWUP-96
title: Fail-loud questions↔weights equality at the gate's and the follow-up's composition sites
state: Backlog
owner: null
epic: EPIC-10
goal: Composing a question set with its decision policy fails loud — naming both files and the offending ids in each direction — when a `weights` id has no question or a question has no weight, for the follow-up pair and for the shipped card-gate pair, proven by a test per domain asserting a named failure for both mismatch directions and that each packaged pair still composes clean.
---

## Intent

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

Naming: the followup half is **blocked on EV-81**, which creates that
composition site; the card-gate half is buildable the day this card is
promoted (`runGate` composes today). Sequence accordingly.

## Acceptance

- Both directions are loud: a `weights`/counted-option id with no question, and a question with no `weights` entry, each produce a named failure; a well-formed packaged pair composes clean.
- Both domains: the followup pair and the card-gate pair, with the two error grammars kept distinct so a consumer never confounds which gate misfired.
- The failure's observable surface is named in the card's record as one of the two shipped loud-failure postures — the pre-POST zero-ledger-line throw (`extensions/gate-run.ts`, "a mis-keyed noul fails HERE") or the recorded `failRun` line — chosen deliberately, never arriving as a silent `File`/`Deliberate` and never as an unexplained crash mid-run.
- Consumer-visible: a repo-local override that mismatches goes from silently degraded to loud; the release note carries the call-out (same class as the FLLWUP-51 wording note).
- The repo's typecheck, the full test suite, `python3 council/validate.py`, and the repo's preflight pass.