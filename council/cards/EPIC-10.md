---
id: EPIC-10
title: Follow-up review decided by the typed TypeSafe Jev gate
state: Backlog
owner: null
epic: null
goal: Follow-up card review uses the same typed TypeSafe Jev decision making as the shipped /council-gate feature.
---

## Intent

Follow-up review is the one part of a council run that still ends in a human
reading prose and deciding. Step 13 of `council/procedures/council.md` turns
every surfaced item into its own card and presents the drafts for edit, drop,
or approval; `/features-deliver`'s Phase 3 repeats the contract at run scope.
Nothing there is a typed decision, so near-duplicate candidates accumulate and
review quality is whatever the reader's attention happens to be.

This epic gives that review the same decision making the shipped
`/council-gate` gives card dispatch: a pinned System One model
(`typesafe/jev-1.13`, the decisions endpoint), a fail-closed transport, a
repo-overridable policy data surface, a pure decision function, and a
committed record. It is not the card gate pointed at follow-up candidates. The
card gate's output is which panel runs a card (`Deliberate`/`Verify`/`Direct`);
this review's output is what happens to a candidate — `File` a new card,
`Merge` it into an existing board card or a sibling candidate from the same
run, or `Drop` it. Same mechanism, different domain: its own packed state, its
own question set, its own decision policy.

Two parts of the old framing carry forward and one does not. The
merge-before-draft requirement is subsumed — `Merge` is now the decision's own
outcome, decided from the board, every open card, and the run's other surfaced
candidates — and the board/open-card/sibling dedup pass is unconditional prose
in every mode, including `off` and every fallback arm: `gate.mode` switches
*whose decision is applied*, never *whether the reader is asked to look at the
board*. The wiki-ingest ask is not part of this decomposition: the intake names
follow-up cards, and ingest has its own write owner and authority map, so it
re-homes rather than riding here.

The fail-safe direction is deliberate and is not the card gate's. A failed
card-gate call resolves to the full Deliberate panel because more scrutiny is
the safe side; here the safe side is the human. A failed, unavailable, or
unresolved follow-up decision falls back to the existing pre-write review and
may never `Drop` a candidate or auto-merge one. Jev's model-card page still
says coming-soon while the code pins the versioned id and calls an alpha
endpoint, so availability is a real state the design carries.

Enablement reuses `.council.json`'s reserved `gate` section — one mode governs
both decision domains (`off` = unqualified human review that still carries the
dedup pass, `advisory` = the decision rendered as information, `active` = the
disposition applied). The pre-write confirmation a follow-up draft already
requires is preserved: the decision is recorded and rendered, and no card is
written before confirmation.

## Acceptance

- With `.council.json`'s `gate.mode` `active` and a resolvable credential, a
  run that surfaces two technically-close follow-up candidates plus one
  clearly-new candidate records one Jev decision line per candidate and writes
  exactly two `FLLWUP-` cards — the close pair merged, the new one filed — with
  each written card's basis observable in `.pi/council/gate-ledger.jsonl`; the
  fixture pins the follow-up policy's `overrides` in a fixture-local
  `council/gate/followup/decision.json` so the count is model-independent, and
  the arm is a wiring falsifier, not evidence of Jev's judgment quality.
- The recorded output vocabulary is exactly `File`, `Merge`, `Drop`, reusing
  `typesafe/jev-1.13` and `https://openrouter.ai/api/alpha/decisions` (no
  chat/completions path, no second model pin).
- On any call failure, refusal, unavailability, or unresolved credential, zero
  candidates are `Drop`ped, no card is auto-merged, and the run reaches the
  existing pre-write draft-then-confirm review.
- `gate.mode` `off` leaves step 13 as an unqualified human review that still
  carries the unconditional board/open-card/sibling dedup pass; `advisory`
  renders the decision as information without enforcing; `active` applies the
  disposition; no mode writes a card before the human's confirmation (the
  pre-write pin is authored by EV-82; `FLLWUP-69`'s halves stay its own,
  `Backlog`, `epic: EPIC-9` — nothing is green today).
- Wired at all three emitters — step 13, `features-deliver.md` Phase 3,
  `council-runner.md` (unresolved candidate → `ESCALATION`; outcome rides
  `DONE`/`ESCALATION` only; `RETIRED` keeps its documented meaning).
- `council/gate/followup/*` is repo-overridable whole-file, first-hit, failing
  loud on an unknown key or invalid value.
- The repo's typecheck, the full test suite, `python3 council/validate.py`, and
  the repo's preflight pass.