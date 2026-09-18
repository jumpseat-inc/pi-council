---
id: FLLWUP-52
title: Evolve EV-39 R4 — retrying row label denotation
state: Backlog
owner: null
epic: EPIC-9
goal: A binding ruling resolves whether the tree row's `attempt N/M` label on a retrying dispatch denotes the pending ordinal (EV-39 R4's letter) or the attempt whose transcript the row tails, and the label's data source matches that ruling in every state.
---

## Orchestrator rulings (Phase 1, binding)

Recorded human decisions for this run. Immutable and binding on every seat,
`steward` included; a runner that hits one applies it and cites the ruling
rather than re-asking.

- **R4 (retire — keep EV-39 R4's pending ordinal).** EV-39 R4's recorded
  binding ruling stands unchanged: the retrying job-tree row's `attempt N/M`
  label denotes the **pending** ordinal (`attempt 2/3` while retrying toward
  attempt 2), and the FLLWUP-45 shipped split — pending ordinal on the row,
  shown attempt's ordinal in the progress title — is correct as shipped. No
  `extensions/navigator.ts` change is made and the FLLWUP-45 progress-title
  attempt fragment stays. Under this ruling the card's own acceptance sentence
  "if R4 is left as-is, the card is retired with that ruling recorded"
  applies: **retire the card**, no PR, no code change.

## Intent

Filed from FLLWUP-45's step-13 follow-up per the run's Phase-1 ruling
("the (b) R4-evolution follow-up [is] approved in substance — file [it] at
step 13"). The (b) item is portfolio-level and belongs to `steward`: EV-39
R4 is a recorded binding ruling, so evolving it is a portfolio decision, not
a card-local one.

FLLWUP-45 shipped on R4's letter: the retrying row keeps
`` ` attempt ${m.attempt}/${maxAttempts} ` `` (the **pending** ordinal), and
the progress title names the **shown** attempt's ordinal
(`` `· attempt ${k}/${maxAttempts}` ``), so no viewer is told attempt N's
content is attempt N+1's. That split is deliberate and shipped. What it
leaves open is R4's own denotation on the row.

The tension FLLWUP-45 surfaced:

- FLLWUP-45's `goal` — "the backoff row's label matches the attempt it
  denotes" — reads, on one construction, toward the label denoting the
  attempt whose transcript the row tails (the settled attempt N during
  backoff), i.e. rendering `attempt 1/3` in the first-retry window.
- EV-39 R4 (`council/cards/EV-39.md`) fixes the pending ordinal —
  *"One job-tree row per dispatch, labeled `attempt 2/3` while retrying — no
  extra rows and no separate status line."* Its only unambiguous example is
  pending 2 / settled 1, and the tail-oriented source renders `attempt 1/3`
  in exactly that canonical instance.

FLLWUP-45's step-4 Skeptic (O2) confirmed the flip contradicts R4's letter
in that window, and the designer withdrew the flip; the card ships on R4
either way. FLLWUP-45's step-6b `product-owner` ruling recorded the
candidate as a `steward` item: if the steward evolves R4, the follow-up
resolution flips the row's label source to the tailed attempt and removes
the progress-title attempt fragment (which exists only to disambiguate under
R4's pending-ordinal row).

## Acceptance

- A binding ruling (steward, or product-owner escalating) states which
  attempt the row label denotes in the retrying window.
- The tree row's label data source in `extensions/navigator.ts` matches that
  ruling in every state (retrying / running / settled / legacy), proven by a
  test on the real backoff manifest shape
  (`{attempt: 2, sessionId: <attempt 1's id>, attempts: [{1, <attempt 1's id>}]}`),
  not the legacy fixture that cannot distinguish the two sources.
- If R4 is evolved to the tailed ordinal, the FLLWUP-45 progress-title
  attempt fragment is removed in the same change; if R4 is left as-is, the
  card is retired with that ruling recorded.
- EV-7/EV-8/EV-9/EV-35/FLLWUP-45 suites stay green; all owner gates green.