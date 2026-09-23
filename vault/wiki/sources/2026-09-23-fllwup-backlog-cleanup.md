---
title: 2026-09-23 FLLWUP Backlog Cleanup
type: source
summary: The 2026-09-23 curation of the open follow-up backlog — 65 Backlog FLLWUP cards consolidated to 42 via 17 content-preserving merges and 2 retirements, with the no-Retired-state constraint, the silent-staleness finding, and the cross-epic `epic: null` consequence.
aliases: [fllwup backlog cleanup, follow-up cleanup 2026-09-23, 2026-09-23-fllwup-backlog-cleanup]
tags: [pi-council/source, pi-council/board, pi-council/followups]
sources: []
created: 2026-09-23
updated: 2026-09-23
---

# 2026-09-23 FLLWUP Backlog Cleanup

An **attended, human-directed** curation of the open follow-up backlog: the
`FLLWUP-*` cards sitting in the **Backlog** column of `council/board.md`.
Unlike a run's step-13 follow-up gate ([[followup-decision-gate]]), this was not
an autonomous per-run decision — it was a deliberate maintenance pass over cards
that had *accumulated across many runs*. The raw record is
`vault/raw/2026-09-23-fllwup-backlog-cleanup.md`.

**Result:** 65 open follow-ups → **42**. 17 merge groups absorbed 21 cards; 2
cards were retired outright. `python3 council/validate.py` stayed green
throughout.

## What the merge did — and did not — change

A merge keeps the **lower id** and folds the absorbed card's `## Intent` and
`## Acceptance` in **verbatim** under `### Absorbed: FLLWUP-N` /
`### From FLLWUP-N` sub-sections. Nothing was reworded, summarized, or dropped;
the absorbed card file is deleted but git retains it. A merge is therefore
**content-preserving**: the only thing it loses is a card id.

A retirement is the opposite — it has no survivor, so the **raw cleanup map is
the only in-repo record** of why the card is gone (see below). The surviving
discipline is: **a merge is safe; a retire needs a named reason.**

The merges the pass performed were overwhelmingly *same-surface* pairs the
cards themselves already flagged as coupled — e.g. FLLWUP-84 saying it is "one
loader over" from FLLWUP-83, FLLWUP-33 naming itself "sibling in shape to
FLLWUP-30", FLLWUP-38 saying both header cards "should land under one writer".
The pass mostly made explicit what the cards already asserted about each other.

## No `Retired` state exists

`council/validate.py` permits exactly seven states (`Backlog`, `Ready`,
`Deliberating`, `In Progress`, `In Review`, `Needs Human`, `Done`), and it fails
both an unknown state and a board/card mismatch. There is **no `Retired` state
and no retired column**, so a retirement is mechanically *delete the card file
and its board line*. Git becomes the only trace, which is why the raw map file
is load-bearing rather than decorative — it records the reason and any survivor
for every deleted id. Adding a `Retired` state would be a schema change to
packaged consumer tooling and was rejected as heavier than the cleanup itself.

## Standout finding — follow-up cards go stale silently

Two cards in the backlog had been **silently satisfied by later work** and were
still sitting open:

- **FLLWUP-63** (the EV-40 jitter flake): the test had already been corrected in
  the tree to `toBeLessThanOrEqual(7500)` with an explanatory comment; only a
  seeded adversarial case remained. The card read as if the defect were live.
- **FLLWUP-69** (the pre-write confirmation gate): the `council.md` §13 half had
  already shipped and was pinned by `test/prose.test.ts`; only a
  `features-deliver` prose pin remained.

This is a **standing hazard**: a follow-up card records a defect *as of the run
that filed it*, and nothing re-checks the tree before the card is later promoted.
A card can be promoted, deliberated, and implemented against a defect that no
longer exists. It is the follow-up analogue of a stale claim, and the wiki names
it as a hazard rather than an incident — see [[follow-up-backlog-curation]].

## Cross-epic merges forced `epic: null`

Several merge groups spanned two epics (e.g. `FLLWUP-83` EPIC-13 + `FLLWUP-84`
EPIC-14; `FLLWUP-7` EPIC-4 + `FLLWUP-32` EPIC-7; `FLLWUP-68` EPIC-9 +
`FLLWUP-101` EPIC-10). The merged survivor can no longer be attributed to one
epic, so its `epic:` field was set to `null`. The board's `epic:` tagging — which
[[chain-promotion]] and the residual-scope model lean on — is thus weakened for
those cards; they are now located by content, not by parent epic.

## Boundary notes (not contradictions)

- **A merge rewrites the survivor's `goal`.** [[engineering-board]] holds goal
  text immutable once a card is `In Progress`; every merged card was `Backlog`,
  so the rewrite is legal — but it does mean a merge changes the judge's oracle.
  A merge of `In Progress` or `Done` cards would need explicit authority.
- **Board and cards landed together**, per the "never separate commits" rule, and
  `validate.py` was the net at every step.
- **A retire can lose a live residual.** FLLWUP-69 was *kept*, not retired, for
  exactly this reason: its remaining `features-deliver` prose pin had no other
  home, so deleting it would have lost the essence the cleanup was meant to
  preserve.

## Pages touched

New [[follow-up-backlog-curation]]; updated [[engineering-board]],
[[pi-council-overview]], [[followup-decision-gate]], [[chain-promotion]],
[[card-id-allocation]]. No contradictions flagged.

## Related

- [[follow-up-backlog-curation]] — the merge/retire discipline this established
- [[engineering-board]] — the board/card schema the cleanup operates on
- [[followup-decision-gate]] — the per-run gate this is *not*
- [[chain-promotion]] — the cadence whose `epic:` tagging the merges weakened