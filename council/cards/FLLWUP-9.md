---
id: FLLWUP-9
title: Explicit clear-thinking-override affordance for a seat
state: Backlog
owner: null
epic: EPIC-5
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
