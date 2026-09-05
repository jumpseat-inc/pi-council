---
id: FLLWUP-9
title: Explicit clear-thinking-override affordance for a seat
state: In Progress
owner: owner
epic: EPIC-6
goal: A follow-up affordance removes a seat's thinking override or its whole council.<seat> entry from .council.json explicitly rather than treating absence as preserve, proven by a round-trip test that clears an existing override and byte-asserts the resulting config.
---

## Intent

Filed from EV-24's deliberation (round 3, owner and principal) and the
EV-24 design spec §5.4. v1 provides no way to delete a seat's `thinking`
override — absence means "preserve", so dropping an override is
hand-edit-only today, and the loader has no reset affordance
(`thinking: null` throws). The safe surface is a distinct explicit clear
(a writer option that removes the `thinking` member, or the whole
`council.<seat>` object when asked). This is a scope expansion EV-24
correctly excluded (spec §8).

## Acceptance

- A clear operation removes the `thinking` member (or the whole
  `council.<seat>` object when asked) from `.council.json` while
  preserving the `theme` section, every other seat, and unknown top-level
  keys, byte-asserted by a round-trip test.
- Absence continues to mean preserve everywhere else; no loader change.

## Phase 1 rulings (features-deliver, binding for this run)

- **R-1 (scope)**: delivered as a writer-level clear operation only — a
  writer option on `extensions/council-config-writer.ts` plus the
  round-trip test. No modal UI change and no new user-visible copy in
  this run, consistent with the EPIC-6 decomposition ruling (S-2) that
  this is a writer-surface follow-up, not a modal fold-in.

Recorded human decision — immutable for the run and binding on every seat,
`steward` included.

## Deliberation

### Step 1 gate
Mechanical, not surface-touching. Narrowly-scoped and unambiguous — the
behavior is fully specified (clear removes the `thinking` member; whole
`council.<seat>` object when asked; byte-preserve the `theme` section, every
other seat, and unknown top-level keys; no loader change) and pinned by
Phase-1 R-1 (writer-level clear operation on
`extensions/council-config-writer.ts` + round-trip test; no modal UI, no new
user-visible copy). Confined to one seam (the writer + its test file in
`test/council-config-writer.test.ts`); remaining freedom is API spelling —
an implementation choice, not a design tradeoff. Same seam and shape as
FLLWUP-10 (gated mechanical this epic). Applied R-1 and did not re-ask.
Not surface-touching → `designer` not seated. Skips steps 2-6; proceeds
directly to step 7 with the card itself as the owner handoff (no spec file
— mechanical path). (Features-deliver substitution: card selected by
orchestrator per steward's ruled build order replaces the attended-flow
Ready promotion, per the epic's established pattern, cf. FLLWUP-10.)

### Step 7 — In Progress, handed to owner
Card set In Progress on frontmatter and board, `owner: owner`; `validate.py`
clean. Owner dispatched at the card (mechanical-path handoff: the card's
Intent, goal, and Acceptance, with R-1 binding) with repo gate and
branch/PR conventions.
