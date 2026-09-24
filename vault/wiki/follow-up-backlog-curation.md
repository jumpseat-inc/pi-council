---
title: Follow-Up Backlog Curation
type: concept
summary: The periodic, human-directed maintenance of the accumulated FLLWUP backlog — curation (merge near-duplicates content-preservingly, keep the lower id; retire dead cards, which need a named reason since no `Retired` state exists) followed by grouping the survivors into thematic close-out epics — plus the standing hazard that follow-up cards go stale silently.
aliases: [follow-up curation, backlog curation, follow-up cleanup, followup backlog, merge or retire, follow-up grouping, close-out epic]
tags: [pi-council/concept, pi-council/board, pi-council/followups]
sources: ["[[2026-09-23-fllwup-backlog-cleanup]]", "[[2026-09-23-fllwup-epic-grouping]]", "[[2026-09-24-epic23-run-ledger]]", "[[2026-09-24-epic24-run-ledger]]"]
created: 2026-09-23
updated: 2026-09-24
---

# Follow-Up Backlog Curation

Every closed epic and many cards file **follow-up** cards (`FLLWUP-*`) into the
Backlog column. They are the durable "we noticed this but did not fix it" trail,
and they accumulate: after EPIC-4/6/7/8/9/10/13/14/15 the Backlog held 65 open
`FLLWUP` cards. **Curation** is the deliberate pass that consolidates them.

Distinguish it from the per-run [[followup-decision-gate]]: that gate decides
*one candidate's* disposition (File/Merge/Drop) at step 13, attended by the run
and ratified by a ruling seat. Curation is a **board-level, human-directed**
maintenance operation over cards from *many* runs; it is not driven by the Jev
gate and does not re-open the runs that filed the cards.

## Two operations

### Merge — content-preserving

A merge picks a **survivor** (the lower id), moves every absorbed card's
`## Intent` and `## Acceptance` into the survivor **verbatim** under
`### Absorbed: FLLWUP-N` / `### From FLLWUP-N` sub-sections, and updates the
survivor's `title` and `goal` to state the merged scope. The absorbed card files
are deleted; git retains them. The only thing lost is a card id, so a merge is
**safe by construction**: no follow-up essence can escape.

Good merge candidates are cards that already point at each other — "one loader
over", "sibling in shape to", "should land under one writer". The 2026-09-23
pass mostly made explicit what the cards already asserted.

### Retire — needs a named reason

A retirement has no survivor, so it is not covered by a merge's preservation
guarantee. Retire only when the work is **already delivered** (a stale card), the
question has **already been settled** elsewhere (a decision card whose ruling is
on record), or the item is **provably not owed** by its own text (an
observational placeholder). Because there is no `Retired` state (below), every
retirement must be recorded in a **raw cleanup map** naming the id, the reason,
and any survivor — otherwise git history is the only trace.

**A retire can lose a live residual.** Before deleting, check that every open
clause of the card has a home; if one does not, keep the card (or narrow it). In
the 2026-09-23 pass FLLWUP-69 was deliberately *kept*, not retired, because its
remaining prose pin had no other home.

## Phase 2 — grouping into delivery epics

Curation reduces the count; **grouping** gives the residue delivery homes. The
41 survivors of the 2026-09-23 pass were grouped by **subsystem** into 7 thematic
**close-out epics** (EPIC-16…22, [[2026-09-23-fllwup-epic-grouping]]) and re-homed
via their `epic:` field, so each epic is a coherent `/features-deliver` scope. New
ids are allocated at fetched HEAD ([[card-id-allocation]]).

Grouping is the complement of curation's `epic: null` side-effect: curation nulls
`epic:` on cross-epic merges, and grouping re-homes those orphans. It restores a
*home*, never the *origin* — a child's `epic:` points at its new thematic epic,
and the "filed by EPIC-N" lineage survives only in the new epic's `Intent`. A
**close-out epic** is a distinct flavor: its `goal` is an aggregate rollup of the
children's outcomes rather than a single feature's falsifiable sentence — a
boundary with [[engineering-board]]'s one-sentence goal rule.

## No `Retired` state exists

`council/validate.py` accepts exactly seven states (`Backlog`, `Ready`,
`Deliberating`, `In Progress`, `In Review`, `Needs Human`, `Done`) and fails both
an unknown state and a board/card mismatch. There is no retired column. A
retirement is therefore mechanically **delete the card file and its board line**,
with the raw map as the out-of-band provenance. Adding a `Retired` state would be
a schema change to packaged consumer tooling ([[council-update]],
[[non-clobbering-scaffold]]) and needs its own version bump — heavier than the
cleanup it would serve.

## Standing hazard — follow-up cards go stale silently

A follow-up card records a defect **as of the run that filed it**, and nothing
re-checks the tree between filing and promotion. A later merge can silently
satisfy the card while it sits in Backlog, so a card is later promoted,
deliberated, and implemented against a defect that no longer exists. Observed in
the 2026-09-23 pass: FLLWUP-63's jitter fix was already in the tree
(`toBeLessThanOrEqual(7500)`) and FLLWUP-69's `council.md` half was already
shipped and pinned. **Consequence:** curation (and promotion) should re-verify
each card's premise against the current tree before acting on it; a card that
reads live may not be. This is the follow-up analogue of a stale wiki claim.

## Boundary — a merge rewrites the judge's oracle

[[engineering-board]] holds card **goal text immutable once a card is
`In Progress`**. A merge of `Backlog` cards may rewrite the survivor's `goal` to
state the merged scope (all 2026-09-23 merges were Backlog, so this was legal),
but doing so **changes the text the judge reads**. Merging an `In Progress` or
`Done` card would need explicit authority. Board and cards must land in the same
commit, with `validate.py` green ([[engineering-board]]).

## Consequence for `epic:` tagging

Follow-ups are scoped to an epic via the `epic:` field, which
[[chain-promotion]] and the residual-scope model read. A merge that spans two
epics (e.g. EPIC-13 + EPIC-14) can no longer be attributed to one, so its
`epic:` becomes `null` and the card is located by content rather than parent.
Cross-epic merges thus trade attribution for consolidation. Phase 2 grouping
re-homes those `epic: null` orphans into new thematic epics, so a card regains a
*home* — only its *origin* stays prose-only.

## EPIC-23 → EPIC-24 (2026-09-24) — a close-out epic leaks residuals

EPIC-23 closed `Done` while carrying three open `FLLWUP` children (114/115/116),
so the residuals were grouped into a new **EPIC-24** and re-pointed via their
`epic:` field — the curate-then-group lesson one level up: here the *source* of the
orphans was an **epic close-out**, not curation's cross-epic merge nulling. The
grouping restored a home (EPIC-24) without restoring origin (EPIC-23's `Intent`
carries the lineage). The general consequence: a `Done` epic is not required to
have zero open children, and closing an epic is a place to check for residuals to
re-home. Witness: [[2026-09-24-epic23-run-ledger]].

## EPIC-24 → EPIC-25 (2026-09-24) — re-homing at closure

EPIC-24 applied the previous section's lesson proactively. When its three named
children merged, the run's [[steward]] (job-15) ruled the epic closed on its
**named** acceptance and its five open follow-ups (FLLWUP-117/118/119/120/121,
all ratified `File` at the step-13 gate, [[confirmation-authority]]) re-homed into
a new **EPIC-25** in the same run. The new part is timing: the close-out check and
the grouping happened **at closure**, not in a later curation pass — the steward's
strategy row ("ending the run") now carries it. Only the `epic:` field moved on
the five cards; the board line for EPIC-24 moved to `Done` and EPIC-25 took its
`Backlog` slot. Witness: [[2026-09-24-epic24-run-ledger]].

## Related

- [[engineering-board]] — the board/card schema and lifecycle discipline
- [[followup-decision-gate]] — the per-run gate, distinct from board curation
- [[card-id-allocation]] — merges keep the lower id; ids are never renumbered
- [[chain-promotion]] — reads `epic:` tags that cross-epic merges nullify
- [[2026-09-23-fllwup-epic-grouping]] — the Phase 2 grouping pass (EPIC-16…22)
- [[council-update]] — why adding a `Retired` state is packaged-tooling work
- [[confirmation-authority]] — the step-13 gate whose `File` dispositions feed this re-homing

## Sources

- [[2026-09-23-fllwup-backlog-cleanup]] — the first curation pass (65 → 42)
- [[2026-09-23-fllwup-epic-grouping]] — the Phase 2 grouping pass (EPIC-16…22)
- `vault/raw/2026-09-23-fllwup-backlog-cleanup.md` — the merge/retire map
- `vault/raw/2026-09-23-fllwup-epic-grouping.md` — the epic structure + learnings